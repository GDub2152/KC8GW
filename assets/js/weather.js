(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const put = (id, value) => { const n=$(id); if(n && value !== undefined && value !== null) n.textContent=value; };
  const num = (v, digits=0) => Number.isFinite(Number(v)) ? Number(v).toFixed(digits) : '—';
  const codes={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Fog',48:'Freezing Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',80:'Rain Showers',81:'Rain Showers',82:'Heavy Showers',85:'Snow Showers',86:'Heavy Snow Showers',95:'Thunderstorm',96:'Thunderstorm',99:'Severe Thunderstorm'};
  const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const windDir = deg => Number.isFinite(Number(deg)) ? dirs[Math.round(Number(deg)/22.5)%16] : '—';
  const setNeedle = deg => { const n=$('windNeedle'); if(n && Number.isFinite(Number(deg))) n.style.transform=`translate(-50%,-90%) rotate(${Number(deg)}deg)`; };
  const heatOrChill = o => {
    const temp=Number(o.temp), heat=Number(o.heatIndex), chill=Number(o.windChill);
    if(Number.isFinite(heat) && Number.isFinite(temp) && heat > temp + 1) return heat;
    if(Number.isFinite(chill) && Number.isFinite(temp) && chill < temp - 1) return chill;
    return temp;
  };
  const ageText = iso => {
    const t=new Date(iso).getTime();
    if(!Number.isFinite(t)) return '—';
    const mins=Math.max(0,Math.round((Date.now()-t)/60000));
    return mins < 1 ? 'NOW' : `${mins} MIN`;
  };
  const uvText = uv => {
    const n=Number(uv); if(!Number.isFinite(n)) return 'UV index';
    if(n<3) return 'Low'; if(n<6) return 'Moderate'; if(n<8) return 'High'; if(n<11) return 'Very high'; return 'Extreme';
  };

  async function loadCurrent(){
    const endpoint=window.KC8GW_CONFIG?.weatherApiUrl;
    try{
      if(!endpoint) throw new Error('Weather API endpoint is not configured');
      const r=await fetch(`${endpoint}${endpoint.includes('?')?'&':'?'}_=${Date.now()}`,{cache:'no-store'});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error || `Weather ${r.status}`);
      const o=d.observation || d;
      if(!o || !Number.isFinite(Number(o.temp))) throw new Error('No current station observation returned');

      put('stationName',o.neighborhood || 'KC8GW Personal Weather Station');
      put('weatherTemp',`${num(o.temp,1)}°`);
      put('weatherFeels',`${num(heatOrChill(o),1)}°`);
      put('weatherHumidity',`${num(o.humidity)}%`);
      put('weatherDewPoint',`${num(o.dewpt,1)}°`);
      put('weatherWind',`${num(o.windSpeed,1)} / ${num(o.windGust,1)} mph`);
      put('weatherWindSpeed',`${num(o.windSpeed,1)} mph`);
      put('weatherGust',`${num(o.windGust,1)} mph`);
      put('weatherWindDir',windDir(o.winddir)); setNeedle(o.winddir);
      put('weatherPressure',`${num(o.pressure,2)} inHg`);
      put('pressureTrend','Station barometric pressure');
      put('weatherRain',`${num(o.precipTotal,2)} in`);
      put('weatherRainRate',`${num(o.precipRate,2)} in/hr`);
      put('weatherUv',num(o.uv,1)); put('uvLabel',uvText(o.uv));
      put('weatherSolar',Number.isFinite(Number(o.solarRadiation)) ? `${num(o.solarRadiation)} W/m²` : '— W/m²');
      put('weatherAge',ageText(o.obsTimeUtc || o.obsTimeLocal));
      put('stationHealth','ONLINE');
      put('weatherCondition',Number(o.precipRate)>0 ? 'RAIN DETECTED' : 'LIVE PWS');
      const observed=new Date(o.obsTimeUtc || o.obsTimeLocal);
      const when=Number.isFinite(observed.getTime()) ? observed.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : 'recently';
      put('weatherStatus',`Observed by KOHWADSW119 · Updated ${when}`);
    }catch(e){
      put('weatherCondition','PWS OFFLINE'); put('stationHealth','OFFLINE'); put('weatherAge','—');
      put('weatherStatus','Personal-station data is unavailable. Confirm the Worker URL and WU_API_KEY secret.');
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
  setInterval(loadCurrent,120000); setInterval(loadForecast,600000);
})();
