// ═══════════════════════════════════════════════════════════════════════════
// v5.22.48 — .exe: desliga cache V8 e apaga Cache/Code Cache na versão nova
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
window.EXE_CACHE_V52248_PURE = { VERSAO:'5.22.48', v8Cache:'none' };
if(typeof document==='undefined') return;
function pintar(){
  var ver=document.getElementById('footer-version');
  if(ver) ver.textContent='v5.22.48';
}
if(typeof window.navigateTo==='function' && !window.navigateTo.__v52248ver){
  var oldN=window.navigateTo;
  window.navigateTo=function(){
    var r=oldN.apply(this, arguments);
    try{ pintar(); }catch(e){}
    return r;
  };
  window.navigateTo.__v52248ver=true;
}
setTimeout(pintar, 200);
setTimeout(pintar, 900);
console.log('[DIGICOPY] v5.22.48 exe: sem cache V8');
})();
