(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const put = (id, value) => { const n=$(id); if(n && value !== undefined && value !== null) n.textContent=value; };
  const num = (v, digits=0) => Number.isFinite(Number(v)) ? Number(v).toFixed(digits) : '—';
  const endpoint = window.KC8GW_CONFIG?.ambientWeatherEndpoint || '';
  const codes={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Fog',48:'Freezing Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',80:'Rain Showers',81:'Rain Showers',82:'Heavy Showers',85:'Snow Showers',86:'Heavy Snow Showers',95:'Thunderstorm',96:'Thunderstorm',99:'Severe Thunderstorm'};
  const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const windDir = deg => Number.isFinite(Number(deg)) ? dirs[Math.round(Number(deg)/22.5)%16] : '—';
  const uvText = uv => { const n=Number(uv); return !Number.isFinite(n)?'Ultraviolet exposure':n<3?'Low':n<6?'Moderate':n<8?'High':n<11?'Very high':'Extreme'; };
  const ageText = date => { const ms=Date.now()-new Date(date).getTime(); if(!Number.isFinite(ms)) return '—'; const min=Math.max(0,Math.round(ms/60000)); return min<1?'NOW':min===1?'1 MIN':`${min} MIN`; };
  const setNeedle = deg => { const n=$('windNeedle'); if(n && Number.isFinite(Number(deg))) n.style.transform=`translate(-50%,-90%) rotate(${Number(deg)}deg)`; };

  function showNotConfigured(){
    put('weatherCondition','SETUP NEEDED'); put('stationHealth','SETUP');
    put('weatherStatus','Add your Cloudflare Worker URL in assets/js/config.js. The Ambient dashboard remains available from the button.');
  }

  async function loadStation(){
    if(!endpoint){ showNotConfigured(); return; }
    try{
      const r=await fetch(endpoint,{cache:'no-store',headers:{Accept:'application/json'}});
      if(!r.ok) throw new Error(`Station request ${r.status}`);
      const d=await r.json();
      put('stationName',d.stationName||'KC8GW Ambient Station');
      put('weatherTemp',`${num(d.temperatureF)}°`); put('weatherFeels',`${num(d.feelsLikeF)}°`);
      put('weatherHumidity',`${num(d.humidity)}%`); put('weatherDewPoint',`${num(d.dewPointF)}°`);
      put('weatherWind',`${num(d.windSpeedMph)} / ${num(d.windGustMph)} mph`);
      put('weatherWindSpeed',`${num(d.windSpeedMph)} mph`); put('weatherGust',`${num(d.windGustMph)} mph`);
      put('weatherWindDir',windDir(d.windDirection)); setNeedle(d.windDirection);
      put('weatherPressure',`${num(d.pressureInHg,2)} inHg`);
      put('pressureTrend',d.pressureTrend||'Relative pressure');
      put('weatherRain',`${num(d.rainTodayIn,2)} in`); put('weatherRainRate',`${num(d.rainRateInHr,2)} in/hr`);
      put('weatherUv',num(d.uvIndex,1)); put('uvLabel',uvText(d.uvIndex));
      put('weatherSolar',`${num(d.solarRadiation)} W/m²`);
      const age=ageText(d.updatedAt); put('weatherAge',age); put('stationHealth',d.stale?'STALE':'ONLINE');
      put('weatherCondition',d.stale?'STALE DATA':'LIVE');
      put('weatherStatus',`Last station report ${new Date(d.updatedAt).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}${d.stale?' · Data may be delayed':''}`);
    }catch(e){
      put('weatherCondition','UNAVAILABLE'); put('stationHealth','OFFLINE');
      put('weatherStatus','The personal weather station feed is temporarily unavailable.');
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
  loadStation(); loadForecast();
  setInterval(loadStation,60000); setInterval(loadForecast,600000);
})();
