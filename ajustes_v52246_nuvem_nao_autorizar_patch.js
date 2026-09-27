// ═══════════════════════════════════════════════════════════════════════════
// v5.22.46 — Nuvem: botão para NÃO autorizar os dados atuais deste PC.
//            A nuvem não apaga. Este PC passa a usar a nuvem. O que só
//            existia aqui some daqui e não sobe. O que lançar depois sobe.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function planNaoAutorizarLocal(localKeys, known){
  var extras=[];
  (localKeys||[]).forEach(function(k){ if(k && !(known&&known[k])) extras.push(k); });
  return extras;
}

window.NUVEM_NAO_AUTORIZAR_V52246_PURE = {
  planNaoAutorizarLocal: planNaoAutorizarLocal,
  recusaNuvemVazia: function(knownCount){ return !knownCount; },
  nuvemIntocada: true,
  VERSAO: '5.22.46'
};

if(typeof document==='undefined') return;

function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Nuvem'); if(typeof toast==='function') toast(m,'info'); }

function pintarRodape(){
  var curV = (typeof window !== 'undefined' && window.DIGICOPY_APP_VERSION) || '5.22.46';
  var ver=document.getElementById('footer-version');
  if(ver) ver.textContent='v'+curV;
}
if(typeof window.navigateTo==='function' && !window.navigateTo.__v52246ver){
  var oldN=window.navigateTo;
  window.navigateTo=function(){
    var r=oldN.apply(this, arguments);
    try{ pintarRodape(); }catch(e){}
    return r;
  };
  window.navigateTo.__v52246ver=true;
}
setTimeout(pintarRodape, 200);
setTimeout(pintarRodape, 900);

// v7.1.0 (r46) — botão de não-enviar REMOVIDO a pedido do dono. Ficaram só os
// ajudantes puros (testados) + o pintor do rodapé. O motor de descarte local
// continua (a escolha da reinstalação usa outro caminho).

console.log('[DIGICOPY] v5.22.46 nuvem: não autorizar dados atuais deste PC');
})();