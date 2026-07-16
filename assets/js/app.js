(() => {
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  function clocks(){const d=new Date();qa('[data-local-clock]').forEach(e=>e.textContent=d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}));qa('[data-utc-clock]').forEach(e=>e.textContent=d.toLocaleTimeString('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',second:'2-digit'}));}
  clocks(); setInterval(clocks,1000);
  const year=q('#copyrightYear'); if(year) year.textContent=new Date().getFullYear();
  const btn=q('.menu-toggle'),nav=q('#site-nav');
  if(btn&&nav){btn.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));});nav.addEventListener('click',e=>{if(e.target.matches('a')){nav.classList.remove('open');btn.setAttribute('aria-expanded','false')}});}
})();
