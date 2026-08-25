(function(){
  const form=document.getElementById('sayHiForm');
  if(!form) return;

  const callsign=document.getElementById('visitorCallsign');
  const honey=document.getElementById('sayHiWebsite');
  const button=document.getElementById('sayHiButton');
  const status=document.getElementById('sayHiStatus');
  const endpoint='https://formsubmit.co/ajax/kc8gw@outlook.com';
  const cooldownMs=10*60*1000;
  const cooldownKey='kc8gwSayHiLastSent';

  function setStatus(message,type){
    status.textContent=message;
    status.classList.remove('success','error');
    if(type) status.classList.add(type);
  }

  form.addEventListener('submit',async function(event){
    event.preventDefault();

    if(honey.value) return;

    const lastSent=Number(localStorage.getItem(cooldownKey)||0);
    const remaining=cooldownMs-(Date.now()-lastSent);
    if(remaining>0){
      const mins=Math.max(1,Math.ceil(remaining/60000));
      setStatus('Thanks! You already said hi recently. Try again in about '+mins+' minute'+(mins===1?'':'s')+'.','success');
      return;
    }

    let cs=(callsign.value||'').trim().toUpperCase();
    cs=cs.replace(/[^A-Z0-9/]/g,'').slice(0,12);
    callsign.value=cs;

    button.disabled=true;
    button.textContent='SENDING HELLO…';
    setStatus('Sending your hello to KC8GW…');

    const now=new Date();
    const payload={
      _subject:'👋 Someone said hi on KC8GW.com',
      _template:'table',
      _honey:'',
      message:'Hello! I stopped by KC8GW.com.',
      callsign:cs || 'Not provided',
      visitor_time:now.toLocaleString(),
      visitor_time_utc:now.toISOString(),
      page:window.location.href
    };

    try{
      const response=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload)
      });
      if(!response.ok) throw new Error('Send failed');
      localStorage.setItem(cooldownKey,String(Date.now()));
      form.reset();
      setStatus(cs ? 'Thanks for stopping by, '+cs+'! Your hello was sent. 73!' : 'Thanks for stopping by! Your hello was sent. 73!','success');
      button.textContent='✓ HELLO SENT';
      setTimeout(function(){button.textContent='👋 SEND MY HELLO';button.disabled=false;},4500);
    }catch(err){
      setStatus('I couldn’t send the hello right now. Please try again in a moment.','error');
      button.textContent='👋 TRY AGAIN';
      button.disabled=false;
    }
  });
})();
