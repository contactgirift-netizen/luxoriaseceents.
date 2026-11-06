(function(){
  try {
    var key='luxoriaVisitorId',id=localStorage.getItem(key);
    if(!id){id='v_'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'_'+Math.random().toString(36).slice(2));localStorage.setItem(key,id);}
    var device=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?'mobile':'desktop';
    function ping(){fetch('api.php?action=visitor-ping',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,page:location.pathname,device:device}),keepalive:true}).catch(function(){});}
    ping();setInterval(ping,30000);
  } catch(e) {}
})();
