const NOAA = {
  kp: 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json',
  flux: 'https://services.swpc.noaa.gov/json/f107_cm_flux.json',
  scales: 'https://services.swpc.noaa.gov/products/noaa-scales.json'
};

const byId = id => document.getElementById(id);
const set = (id, value) => {
  const element = byId(id);
  if (element) element.textContent = value;
};

function condition(kp, flux, band) {
  if (kp >= 6) return 'poor';
  if (['10m', '12m', '15m'].includes(band)) {
    return flux >= 150 && kp < 4 ? 'good' : flux >= 105 && kp < 5 ? 'fair' : 'poor';
  }
  if (['17m', '20m'].includes(band)) return kp < 4 ? 'good' : kp < 6 ? 'fair' : 'poor';
  if (['30m', '40m', '80m', '160m'].includes(band)) return kp < 5 ? 'good' : kp < 7 ? 'fair' : 'poor';
  return kp < 4 ? 'fair' : 'poor';
}

function renderBands(holder, kp, flux) {
  if (!holder) return;
  const bands = ['160m', '80m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m'];
  holder.innerHTML = bands.map(band => {
    const rating = condition(kp, flux, band);
    return `<div class="band ${rating}"><strong>${band}</strong><span>${rating.toUpperCase()}</span></div>`;
  }).join('');
}

function noaaDate(value) {
  if (!value) return new Date(0);
  const text = String(value);
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(text) ? text : `${text}Z`);
}

function latestByTime(records) {
  if (!Array.isArray(records) || !records.length) return null;
  return records.reduce((latest, record) => {
    if (!latest) return record;
    return noaaDate(record.time_tag) > noaaDate(latest.time_tag) ? record : latest;
  }, null);
}

function finiteNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

async function json(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}_=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`NOAA request failed: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function scaleValue(current, key) {
  const raw = current?.[key]?.Scale ?? current?.[key];
  if (raw === null || raw === undefined || raw === '') return null;
  const text = String(raw);
  return text.startsWith(key) ? text : `${key}${text}`;
}

async function loadSolar() {
  set('homeSolarStatus', 'Loading NOAA space-weather data…');
  set('solarUpdated', 'Loading NOAA space-weather data…');

  const [kpResult, fluxResult, scalesResult] = await Promise.allSettled([
    json(NOAA.kp),
    json(NOAA.flux),
    json(NOAA.scales)
  ]);

  const kpRecord = kpResult.status === 'fulfilled' ? latestByTime(kpResult.value) : null;
  const fluxRecord = fluxResult.status === 'fulfilled' ? latestByTime(fluxResult.value) : null;
  const currentScales = scalesResult.status === 'fulfilled'
    ? (scalesResult.value?.['0'] || scalesResult.value?.[0] || null)
    : null;

  const kp = finiteNumber(kpRecord?.kp_index, kpRecord?.estimated_kp);
  const flux = finiteNumber(fluxRecord?.flux, fluxRecord?.observed_flux, fluxRecord?.adjusted_flux);
  const rScale = scaleValue(currentScales, 'R');
  const gScale = scaleValue(currentScales, 'G');

  set('kpIndex', kp === null ? '—' : kp.toFixed(1));
  set('homeKp', kp === null ? '—' : kp.toFixed(1));
  set('tickerKp', kp === null ? '—' : kp.toFixed(1));
  set('solarFlux', flux === null ? '—' : Math.round(flux));
  set('homeFlux', flux === null ? '—' : Math.round(flux));
  set('rScale', rScale || '—');
  set('homeR', rScale || '—');
  set('gScale', gScale || '—');
  set('homeG', gScale || '—');

  const successfulFeeds = [kp !== null, flux !== null, Boolean(rScale || gScale)].filter(Boolean).length;
  const newestStamp = [kpRecord?.time_tag, fluxRecord?.time_tag]
    .filter(Boolean)
    .sort((a, b) => noaaDate(b) - noaaDate(a))[0];
  const displayTime = newestStamp ? noaaDate(newestStamp) : new Date();
  const timeText = displayTime.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  let message;
  if (successfulFeeds === 3) {
    message = `Updated ${timeText} · NOAA SWPC`;
  } else if (successfulFeeds > 0) {
    message = `Updated ${timeText} · Some NOAA readings are temporarily unavailable`;
  } else {
    message = 'NOAA data is temporarily unavailable. Retrying automatically.';
  }
  set('solarUpdated', message);
  set('homeSolarStatus', message);

  renderBands(byId('bandGrid'), kp ?? 3, flux ?? 110);
  renderBands(byId('homeBandGrid'), kp ?? 3, flux ?? 110);
}

byId('refreshSolar')?.addEventListener('click', loadSolar);
loadSolar();
setInterval(loadSolar, 5 * 60 * 1000);
