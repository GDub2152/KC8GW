const CACHE = 'kc8gw-v2-solar-1';
const ASSETS = [
  './', './index.html', './solar.html', './404.html',
  './assets/css/style.css', './assets/js/app.js', './assets/js/solar-data.js',
  './assets/images/favicon.svg', './manifest.webmanifest'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('services.swpc.noaa.gov')) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
});
