const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

function updateClocks() {
  const now = new Date();
  document.querySelector('#local-time').textContent = now.toLocaleTimeString([], {hour12: false});
  document.querySelector('#local-date').textContent = now.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'});
  document.querySelector('#utc-time').textContent = now.toLocaleTimeString([], {timeZone: 'UTC', hour12: false});
  document.querySelector('#utc-date').textContent = now.toLocaleDateString([], {timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric'});
}
updateClocks();
setInterval(updateClocks, 1000);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}
