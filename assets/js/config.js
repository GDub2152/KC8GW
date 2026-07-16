window.KC8GW_CONFIG = {
  localAdsbUrl: 'http://adsb-feeder.local/tar1090/',
  publicStatsUrl: '',
  weatherUndergroundUrl: 'https://www.wunderground.com/dashboard/pws/KOHWADSW119',

  // Secure Cloudflare Worker endpoint. The Weather Underground API key belongs
  // in the Worker's WU_API_KEY secret, never in this public website file.
  weatherApiUrl: 'https://kc8gw-weather.nortonnfriends.workers.dev/weather'
};
