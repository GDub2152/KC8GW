const CACHE='kc8gw-polished-v1';
const CORE=['./','index.html','qrz.html','propagation.html','adsb.html','media.html','projects.html','shack.html','contact.html','assets/css/style.css','assets/js/app.js','assets/js/solar.js','assets/js/weather.js','assets/images/kc8gw-patch.png','assets/images/oshkosh-airshow-bg.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('404.html'))));});
