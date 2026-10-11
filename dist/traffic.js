(() => {
  if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl)return;
  // Staff routes are not tracked. The server also excludes signed-in staff and known bots.
  const track=()=>fetch('/api/traffic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:'/'}),keepalive:true}).catch(()=>{});
  track();
  let last=Date.now();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-last>=30*60000){last=Date.now();track();}});
})();
