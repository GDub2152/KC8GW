(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const put = (id, value) => { const n=$(id); if(n && value !== undefined && value !== null) n.textContent=value; };
  const num = (v, digits=0) => Number.isFinite(Number(v)) ? Number(v).toFixed(digits) : '—';
  const codes={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Fog',48:'Freezing Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',80:'Rain Showers',81:'Rain Showers',82:'Heavy Showers',85:'Snow Showers',86:'Heavy Snow Showers',95:'Thunderstorm',96:'Thunderstorm',99:'Severe Thunderstorm'};
  const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const windDir = deg => Number.isFinite(Number(deg)) ? dirs[Math.round(Number(deg)/22.5)%16] : '—';
  const setNeedle = deg => { const n=$('windNeedle'); if(n && Number.isFinite(Number(deg))) n.style.transform=`translate(-50%,-90%) rotate(${Number(deg)}deg)`; };

  async function loadCurrent(){
    try{
      const url='https://api.open-meteo.com/v1/forecast?latitude=41.4048&longitude=-81.7229&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=sunrise,sunset,uv_index_max,precipitation_sum&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York&forecast_days=1';
      const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error(`Weather ${r.status}`); const d=await r.json();
      const c=d.current || {}; const daily=d.daily || {};
      const pressureInHg=Number(c.surface_pressure)*0.0295299830714;
      put('stationName','Parma Area Weather');
      put('weatherTemp',`${num(c.temperature_2m)}°`); put('weatherFeels',`${num(c.apparent_temperature)}°`);
      put('weatherHumidity',`${num(c.relative_humidity_2m)}%`);
      const dew = Number(c.temperature_2m) - ((100-Number(c.relative_humidity_2m))/5);
      put('weatherDewPoint',`${num(dew)}°`);
      put('weatherWind',`${num(c.wind_speed_10m)} / ${num(c.wind_gusts_10m)} mph`);
      put('weatherWindSpeed',`${num(c.wind_speed_10m)} mph`); put('weatherGust',`${num(c.wind_gusts_10m)} mph`);
      put('weatherWindDir',windDir(c.wind_direction_10m)); setNeedle(c.wind_direction_10m);
      put('weatherPressure',`${num(pressureInHg,2)} inHg`);
      put('pressureTrend','Surface pressure');
      put('weatherRain',`${num(daily.precipitation_sum?.[0] ?? c.precipitation,2)} in`);
      put('weatherRainRate',`${num(c.rain,2)} in/hr`);
      put('weatherUv',num(daily.uv_index_max?.[0],1)); put('uvLabel','Daily maximum UV');
      put('weatherSolar','Forecast');
      put('weatherAge','NOW'); put('stationHealth','ONLINE');
      put('weatherCondition',codes[c.weather_code]||'Current');
      put('weatherStatus',`Updated ${new Date(c.time).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} · Personal station KOHWADSW119 available on Weather Underground.`);
    }catch(e){
      put('weatherCondition','UNAVAILABLE'); put('stationHealth','OFFLINE');
      put('weatherStatus','Current weather is temporarily unavailable. Use the Weather Underground station link for live personal-station readings.');
      console.error(e);
    }
  }

  async function loadForecast(){
    const grid=$('forecastGrid'); if(!grid) return;
    try{
      const url='https://api.open-meteo.com/v1/forecast?latitude=41.4048&longitude=-81.7229&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=7';
      const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error(`Forecast ${r.status}`); const d=await r.json();
      grid.innerHTML=d.daily.time.map((date,i)=>`<article class="forecast-day"><span>${new Date(date+'T12:00:00').toLocaleDateString([], {weekday:'short'})}</span><b>${Math.round(d.daily.temperature_2m_max[i])}°</b><small>${Math.round(d.daily.temperature_2m_min[i])}° low</small><em>${codes[d.daily.weather_code[i]]||'Forecast'}</em><i>${d.daily.precipitation_probability_max[i]??0}% rain</i></article>`).join('');
    }catch(e){grid.innerHTML='<p>Forecast is temporarily unavailable.</p>'; console.error(e);}
  }
  loadCurrent(); loadForecast();
  setInterval(loadCurrent,300000); setInterval(loadForecast,600000);
})();
