const ALLOWED_ORIGINS = new Set(['https://kc8gw.com', 'https://www.kc8gw.com']);

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://kc8gw.com',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body, status, origin, cache='public, max-age=45') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {...cors(origin), 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':cache, 'X-Content-Type-Options':'nosniff'}
  });
}

function pressureTrend(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Relative pressure';
  return n >= 30.20 ? 'High pressure' : n <= 29.80 ? 'Low pressure' : 'Steady range';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:cors(origin)});
    if (request.method !== 'GET' || url.pathname !== '/weather') return json({error:'Not found'},404,origin,'no-store');
    if (!env.AMBIENT_API_KEY || !env.AMBIENT_APPLICATION_KEY) return json({error:'Worker secrets are not configured'},500,origin,'no-store');

    try {
      const auth = `apiKey=${encodeURIComponent(env.AMBIENT_API_KEY)}&applicationKey=${encodeURIComponent(env.AMBIENT_APPLICATION_KEY)}`;
      let mac = env.AMBIENT_DEVICE_MAC || '';
      let stationName = 'KC8GW Ambient Station';
      if (!mac) {
        const devicesRes = await fetch(`https://api.ambientweather.net/v1/devices?${auth}`, {headers:{Accept:'application/json'}});
        if (!devicesRes.ok) throw new Error(`Ambient devices request failed: ${devicesRes.status}`);
        const devices = await devicesRes.json();
        const device = devices.find(d => d.macAddress) || devices[0];
        if (!device?.macAddress) throw new Error('No Ambient Weather device found');
        mac = device.macAddress;
        stationName = device.info?.name || device.info?.location || stationName;
      }
      const dataRes = await fetch(`https://api.ambientweather.net/v1/devices/${encodeURIComponent(mac)}?${auth}&limit=1`, {headers:{Accept:'application/json'}});
      if (!dataRes.ok) throw new Error(`Ambient data request failed: ${dataRes.status}`);
      const rows = await dataRes.json();
      const d = Array.isArray(rows) ? rows[0] : rows;
      if (!d) throw new Error('No station observation returned');
      const updatedAt = d.dateutc || d.date || new Date().toISOString();
      const stale = Date.now() - new Date(updatedAt).getTime() > 15 * 60 * 1000;

      // Only outdoor/public observations are returned. Indoor temperature and humidity are intentionally omitted.
      return json({
        stationName,
        updatedAt,
        stale,
        temperatureF: d.tempf,
        feelsLikeF: d.feelsLike ?? d.feelslike,
        humidity: d.humidity,
        dewPointF: d.dewPoint ?? d.dewpoint,
        windSpeedMph: d.windspeedmph,
        windGustMph: d.windgustmph,
        windDirection: d.winddir,
        pressureInHg: d.baromrelin ?? d.baromabsin,
        pressureTrend: pressureTrend(d.baromrelin ?? d.baromabsin),
        rainTodayIn: d.dailyrainin,
        rainRateInHr: d.hourlyrainin,
        uvIndex: d.uv,
        solarRadiation: d.solarradiation,
      }, 200, origin);
    } catch (error) {
      console.error(error);
      return json({error:'Weather data is temporarily unavailable'},502,origin,'no-store');
    }
  }
};
