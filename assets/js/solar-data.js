const SWPC = {
  kp: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
  scales: 'https://services.swpc.noaa.gov/products/noaa-scales.json',
  flux: 'https://services.swpc.noaa.gov/json/f107_cm_flux.json',
  solarWind: 'https://services.swpc.noaa.gov/products/solar-wind/plasma-3-day.json'
};

async function getJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function lastArrayRow(data) {
  return Array.isArray(data) && data.length > 1 ? data[data.length - 1] : null;
}

function latestObject(data) {
  if (!Array.isArray(data) || !data.length) return null;
  return data[data.length - 1];
}

function kpLabel(value) {
  if (!Number.isFinite(value)) return 'Unavailable';
  if (value < 2) return 'Quiet';
  if (value < 4) return 'Unsettled';
  if (value < 5) return 'Active';
  if (value < 6) return 'Minor storm';
  if (value < 7) return 'Moderate storm';
  if (value < 8) return 'Strong storm';
  if (value < 9) return 'Severe storm';
  return 'Extreme storm';
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

async function loadSolarData() {
  try {
    const [kpData, scaleData, fluxData, windData] = await Promise.all([
      getJson(SWPC.kp),
      getJson(SWPC.scales),
      getJson(SWPC.flux),
      getJson(SWPC.solarWind)
    ]);

    const kpRow = lastArrayRow(kpData);
    const kp = kpRow ? Number(kpRow[1]) : NaN;

    const fluxRow = latestObject(fluxData);
    const flux = Number(fluxRow?.flux ?? fluxRow?.f107 ?? fluxRow?.value);

    const windRow = lastArrayRow(windData);
    const windHeaders = Array.isArray(windData?.[0]) ? windData[0] : [];
    const speedIndex = windHeaders.findIndex(item => String(item).toLowerCase().includes('speed'));
    const densityIndex = windHeaders.findIndex(item => String(item).toLowerCase().includes('density'));
    const speed = windRow && speedIndex >= 0 ? Number(windRow[speedIndex]) : NaN;
    const density = windRow && densityIndex >= 0 ? Number(windRow[densityIndex]) : NaN;

    const scale = Array.isArray(scaleData) ? scaleData[0] : scaleData;
    const current = scale?.['0'] || scale?.[0] || scale || {};
    const rScale = current?.R?.Scale ?? current?.R?.scale ?? '0';
    const sScale = current?.S?.Scale ?? current?.S?.scale ?? '0';
    const gScale = current?.G?.Scale ?? current?.G?.scale ?? '0';

    setText('solar-kp', Number.isFinite(kp) ? kp.toFixed(1) : '—');
    setText('solar-kp-label', kpLabel(kp));
    setText('solar-flux', Number.isFinite(flux) ? flux.toFixed(0) : '—');
    setText('solar-wind', Number.isFinite(speed) ? `${speed.toFixed(0)} km/s` : '—');
    setText('solar-density', Number.isFinite(density) ? `${density.toFixed(1)} p/cm³` : '—');
    setText('solar-r', `R${rScale}`);
    setText('solar-s', `S${sScale}`);
    setText('solar-g', `G${gScale}`);
    setText('solar-updated', `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
  } catch (error) {
    document.querySelectorAll('[data-solar-value]').forEach(element => {
      if (element.textContent === 'Loading…' || element.textContent === '--') element.textContent = 'Unavailable';
    });
    setText('solar-updated', 'Live data temporarily unavailable');
    console.error('Solar data error:', error);
  }
}

loadSolarData();
setInterval(loadSolarData, 5 * 60 * 1000);
