const STATION_ID = 'KOHWADSW119';
const ALLOWED_ORIGINS = new Set([
  'https://kc8gw.com',
  'https://www.kc8gw.com',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
]);

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://kc8gw.com',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(origin),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store'
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, origin);

    const requestUrl = new URL(request.url);
    if (requestUrl.pathname !== '/' && requestUrl.pathname !== '/weather') {
      return json({ error: 'Not found' }, 404, origin);
    }
    if (!env.WU_API_KEY) return json({ error: 'WU_API_KEY secret is not configured' }, 500, origin);

    const api = new URL('https://api.weather.com/v2/pws/observations/current');
    api.searchParams.set('stationId', STATION_ID);
    api.searchParams.set('format', 'json');
    api.searchParams.set('units', 'e');
    api.searchParams.set('numericPrecision', 'decimal');
    api.searchParams.set('apiKey', env.WU_API_KEY);

    try {
      const response = await fetch(api.toString(), {
        headers: { 'Accept': 'application/json', 'User-Agent': 'KC8GW-Weather/1.0' },
        cf: { cacheTtl: 60, cacheEverything: true }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return json({ error: 'Weather Underground request failed', status: response.status }, 502, origin);

      const src = data.observations?.[0];
      if (!src) return json({ error: 'No current observation is available for KOHWADSW119' }, 503, origin);
      const imperial = src.imperial || {};

      return json({
        stationId: STATION_ID,
        observation: {
          neighborhood: src.neighborhood || 'KC8GW Personal Weather Station',
          obsTimeUtc: src.obsTimeUtc,
          obsTimeLocal: src.obsTimeLocal,
          humidity: src.humidity,
          winddir: src.winddir,
          uv: src.uv,
          solarRadiation: src.solarRadiation,
          temp: imperial.temp,
          heatIndex: imperial.heatIndex,
          windChill: imperial.windChill,
          dewpt: imperial.dewpt,
          windSpeed: imperial.windSpeed,
          windGust: imperial.windGust,
          pressure: imperial.pressure,
          precipRate: imperial.precipRate,
          precipTotal: imperial.precipTotal
        }
      }, 200, origin);
    } catch (error) {
      return json({ error: 'Weather data is temporarily unavailable' }, 502, origin);
    }
  }
};
