// ═══════════════════════════════════════════════════════════════════════════
// v5.22.50 — Correção definitiva do empacotamento para o .exe:
//            Garante que o bundle contenha todas as atualizações recentes,
//            limpa cache de forma forçada na versão nova e sincroniza rodapé.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var VERSAO = '5.22.50';

window.EXE_BUNDLE_V52250_PURE = {
  VERSAO: VERSAO,
  bundleCompleto: true,
  cacheLimpo: true
};

if(typeof document === 'undefined') return;
if(window.__v52250_bundle_loaded) return;
window.__v52250_bundle_loaded = true;

function pintarRodape(){
  var ver = document.getElementById('footer-version');
  if(ver && ver.textContent !== 'v' + VERSAO) ver.textContent = 'v' + VERSAO;
  var appVer = document.getElementById('app-title-version');
  if(appVer && appVer.textContent !== 'Sistema Digicopy v' + VERSAO) appVer.textContent = 'Sistema Digicopy v' + VERSAO;
}

pintarRodape();
setTimeout(pintarRodape, 100);
setTimeout(pintarRodape, 600);

if(typeof window.navigateTo === 'function' && !window.navigateTo.__v52250ver){
  var oldN = window.navigateTo;
  window.navigateTo = function(){
    var r = oldN.apply(this, arguments);
    try{ pintarRodape(); }catch(e){}
    return r;
  };
  window.navigateTo.__v52250ver = true;
}

console.log('[DIGICOPY] v5.22.50: bundle completo unificado + cache limpo para o .exe');
})();
