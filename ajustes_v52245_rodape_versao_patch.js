// ═══════════════════════════════════════════════════════════════════════════
// v5.22.45 — Versão sozinha no meio do rodapé.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var VERSAO = '5.22.45';

window.RODAPE_VERSAO_V52245_PURE = { VERSAO: VERSAO };

if(typeof document==='undefined') return;

function pintarRodape(){
  var foot = document.querySelector('footer');
  if(!foot) return;
  foot.className = 'h-12 px-8 grid grid-cols-3 items-center text-[11px] text-slate-400 border-t bg-white/60';
  var left = foot.querySelector('span:not(#footer-session):not(#footer-version)');
  var sess = document.getElementById('footer-session');
  var ver = document.getElementById('footer-version');
  if(!ver){
    ver = document.createElement('span');
    ver.id = 'footer-version';
    ver.className = 'text-center font-bold text-slate-500';
    if(sess) foot.insertBefore(ver, sess);
    else foot.appendChild(ver);
  }
  ver.textContent = 'v'+VERSAO;
  if(left){
    left.textContent = 'Sistema Digicopy • Banco na Nuvem';
    left.classList.add('text-left');
  }
  if(sess) sess.classList.add('text-right');
}

if(typeof window.navigateTo==='function' && !window.navigateTo.__v52245ver){
  var oldN = window.navigateTo;
  window.navigateTo = function(){
    var r = oldN.apply(this, arguments);
    try{ pintarRodape(); }catch(e){}
    return r;
  };
  window.navigateTo.__v52245ver = true;
}
setTimeout(pintarRodape, 200);
setTimeout(pintarRodape, 800);

console.log('[DIGICOPY] v5.22.45 rodapé: versão no meio');
})();
