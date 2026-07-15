(() => {
  const $ = id => document.getElementById(id);
  const put = (id, value) => { const node = $(id); if (node) node.textContent = value; };
  const codes = {0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Fog',48:'Freezing Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',56:'Freezing Drizzle',57:'Freezing Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',66:'Freezing Rain',67:'Freezing Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',77:'Snow Grains',80:'Rain Showers',81:'Rain Showers',82:'Heavy Showers',85:'Snow Showers',86:'Heavy Snow Showers',95:'Thunderstorm',96:'Thunderstorm',99:'Severe Thunderstorm'};
  async function loadWeather(){
    try {
      const url='https://api.open-meteo.com/v1/forecast?latitude=41.4048&longitude=-81.7229&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=1';
      const response=await fetch(url,{cache:'no-store'});
      if(!response.ok) throw new Error(`Weather request ${response.status}`);
      const data=await response.json(); const c=data.current||{}; const d=data.daily||{};
      put('weatherTemp',`${Math.round(c.temperature_2m)}°`);
      put('weatherCondition',codes[c.weather_code]||'Current');
      put('weatherHumidity',`${Math.round(c.relative_humidity_2m)}%`);
      put('weatherWind',`${Math.round(c.wind_speed_10m)} mph`);
      put('weatherPressure',`${(Number(c.surface_pressure)*0.0295299830714).toFixed(2)} inHg`);
      put('weatherHighLow',`${Math.round(d.temperature_2m_max?.[0])}° / ${Math.round(d.temperature_2m_min?.[0])}°`);
      put('weatherStatus',`Updated ${new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})} · Data from Open-Meteo`);
    } catch(error) {
      put('weatherCondition','Unavailable');
      put('weatherStatus','Live weather is temporarily unavailable.');
    }
  }
  loadWeather(); setInterval(loadWeather,600000);
})();
