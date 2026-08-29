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

async function executar(){
  if(!window.DIGICOPY_CLOUD_SYNC || typeof window.DIGICOPY_CLOUD_SYNC.discardLocalKeepCloud!=='function'){
    aviso('Motor de sincronização não carregado.','Nuvem');
    return;
  }
  var ok1=typeof window.confirmSistema==='function'
    ? await window.confirmSistema('Os dados que só existem NESTE computador vão sair daqui. A nuvem NÃO será apagada. Este PC passa a usar o que já está na nuvem. Continuar?','Não autorizar dados deste PC')
    : false;
  if(!ok1) return;
  var ok2=typeof window.confirmSistema==='function'
    ? await window.confirmSistema('Último aviso: o que só estava neste PC não sobe depois. O que você lançar daqui pra frente sincroniza normal. Confirma?','Confirmar')
    : false;
  if(!ok2) return;
  try{
    var r=await window.DIGICOPY_CLOUD_SYNC.discardLocalKeepCloud();
    if(typeof window.DIGICOPY_CLOUD_SYNC.tick==='function') await window.DIGICOPY_CLOUD_SYNC.tick('nao-autorizar-local');
    aviso('Pronto. Este PC está com a nuvem. '+((r&&r.removed)||0)+' registro(s) que só existiam aqui saíram deste computador. A nuvem não mudou. O que você lançar agora sobe.','Nuvem');
    if(typeof window.abrirCloudflareNuvem==='function') window.abrirCloudflareNuvem();
  }catch(e){
    aviso((e&&e.message)||String(e),'Não autorizado');
  }
}

function injetarBotao(){
  var modal=document.getElementById('digicopy-cloud-modal');
  if(!modal) return;
  var body=modal.querySelector('#dc-body');
  if(!body || document.getElementById('dc-nao-autorizar-local')) return;
  if(!body.querySelector('#dc-sync-now') && !body.querySelector('#dc-forget')) return;
  var box=document.createElement('div');
  box.style.cssText='border-top:1px solid #e2e8f0;margin-top:16px;padding-top:14px';
  box.innerHTML='<h3 style="font-size:14px;font-weight:900">Não autorizar dados deste PC</h3>'
    +'<p style="font-size:12px;color:#64748b;margin:6px 0 10px;line-height:1.45">Este PC passa a usar a nuvem. O que só existe aqui some DESTE computador. A nuvem não apaga nada. O que você lançar depois sobe.</p>'
    +'<button id="dc-nao-autorizar-local" type="button" style="height:40px;padding:0 16px;border-radius:10px;font-weight:800;font-size:12px;background:#fff7ed;color:#9a3412;border:1px solid #fdba74">Não autorizar dados deste PC</button>';
  var forgetRow=body.querySelector('#dc-forget');
  if(forgetRow && forgetRow.parentNode){
    forgetRow.parentNode.insertBefore(box, forgetRow);
  } else {
    body.appendChild(box);
  }
  var btn=document.getElementById('dc-nao-autorizar-local');
  if(btn) btn.onclick=function(){ executar(); };
}

if(typeof window.abrirCloudflareNuvem==='function' && !window.abrirCloudflareNuvem.__v52246nao){
  var oldA=window.abrirCloudflareNuvem;
  window.abrirCloudflareNuvem=async function(){
    var r=await oldA.apply(this, arguments);
    try{ setTimeout(injetarBotao, 80); setTimeout(injetarBotao, 400); }catch(e){}
    return r;
  };
  window.abrirCloudflareNuvem.__v52246nao=true;
}

console.log('[DIGICOPY] v5.22.46 nuvem: não autorizar dados atuais deste PC');
})();
