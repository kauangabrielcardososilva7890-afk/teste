// ═══════════════════════════════════════════════════════════════════════════
// v5.22.47 — .exe passa a usar pasta (sem asar) + limpa cache na versão nova
//            para a atualização aparecer depois de gerar o instalador.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
window.EXE_ATUALIZA_V52247_PURE = {
  VERSAO: '5.22.47',
  asar: false,
  limpaCacheNaVersao: true
};
if(typeof document==='undefined') return;
function pintar(){
  var curV = (typeof window !== 'undefined' && window.DIGICOPY_APP_VERSION) || '5.22.47';
  var ver=document.getElementById('footer-version');
  if(ver) ver.textContent='v'+curV;
}
if(typeof window.navigateTo==='function' && !window.navigateTo.__v52247ver){
  var oldN=window.navigateTo;
  window.navigateTo=function(){
    var r=oldN.apply(this, arguments);
    try{ pintar(); }catch(e){}
    return r;
  };
  window.navigateTo.__v52247ver=true;
}
setTimeout(pintar, 200);
setTimeout(pintar, 900);
console.log('[DIGICOPY] v5.22.47 exe: pasta sem asar, cache limpo na versão');
})();
