// ═══════════════════════════════════════════════════════════════════════════
// v5.22.44 — Financeiro: De / Até sempre visíveis. Não filtram em Hoje.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }

window.FINANCEIRO_DATAS_V52244_PURE = {
  datasVisiveis: true,
  aplicaDatas: function(modo){ return modo!=='hoje'; }
};

if(typeof document==='undefined') return;

var ST = window.__FIN_ST || (window.__FIN_ST = { campo:'nome', q:'', modo:'hoje', de:'', ate:'', tipo:'todos', ordem:'venc-asc' });

window.finModoV52243 = function(modo){
  ST.modo = modo||'hoje';
  if(modo==='hoje'){ ST.de=''; ST.ate=''; }
  if(typeof window.renderFinanceiro==='function') window.renderFinanceiro();
};
window.finModoV52244 = window.finModoV52243;

function garantirDatas(){
  var de = document.getElementById('neo-fin-de');
  var ate = document.getElementById('neo-fin-ate');
  if(!de || !ate) return;
  if(de.type==='hidden'){
    de.type='date';
    de.className='neo-input !w-[150px] !h-9';
  }
  if(ate.type==='hidden'){
    ate.type='date';
    ate.className='neo-input !w-[150px] !h-9';
  }
  de.value = ST.de||de.value||'';
  ate.value = ST.ate||ate.value||'';
  if(!document.getElementById('neo-fin-de-lab')){
    var labDe=document.createElement('label');
    labDe.id='neo-fin-de-lab';
    labDe.className='text-[11px] font-bold text-slate-500 uppercase';
    labDe.textContent='De';
    de.parentNode.insertBefore(labDe, de);
  }
  if(!document.getElementById('neo-fin-ate-lab')){
    var labAte=document.createElement('label');
    labAte.id='neo-fin-ate-lab';
    labAte.className='text-[11px] font-bold text-slate-500 uppercase';
    labAte.textContent='Até';
    ate.parentNode.insertBefore(labAte, ate);
  }
  var trava = ST.modo==='hoje';
  de.disabled = trava;
  ate.disabled = trava;
  de.onchange = function(){ ST.de=de.value||''; if(typeof window.finBuscarV52243==='function') window.finBuscarV52243(); else if(typeof window.renderFinanceiro==='function') window.renderFinanceiro(); };
  ate.onchange = function(){ ST.ate=ate.value||''; if(typeof window.finBuscarV52243==='function') window.finBuscarV52243(); else if(typeof window.renderFinanceiro==='function') window.renderFinanceiro(); };
}

if(window.FINANCEIRO_V52243_PURE && typeof window.FINANCEIRO_V52243_PURE.filtraLancamentos==='function' && !window.FINANCEIRO_V52243_PURE.filtraLancamentos.__v52244){
  var oldF = window.FINANCEIRO_V52243_PURE.filtraLancamentos;
  window.FINANCEIRO_V52243_PURE.filtraLancamentos = function(list, opts){
    var out = oldF(list, opts)||[];
    opts = opts||{};
    if(opts.modo==='hoje') return out;
    var de = txt(opts.de), ate = txt(opts.ate);
    if(!de && !ate) return out;
    return out.filter(function(item){
      var c = item.ref||item;
      return window.FINANCEIRO_V52243_PURE.noIntervalo(c, de, ate);
    });
  };
  window.FINANCEIRO_V52243_PURE.filtraLancamentos.__v52244 = true;
}

function pintarRodape(){
  var foot = document.querySelector('footer span:not(#footer-session)');
  if(foot) foot.textContent = 'Sistema Digicopy • Banco na Nuvem • v5.22.44';
}
if(typeof window.navigateTo==='function' && !window.navigateTo.__v52244ver){
  var oldN = window.navigateTo;
  window.navigateTo = function(){
    var r = oldN.apply(this, arguments);
    try{ pintarRodape(); }catch(e){}
    return r;
  };
  window.navigateTo.__v52244ver = true;
}
setTimeout(pintarRodape, 200);

if(typeof window.renderFinanceiro==='function' && !window.renderFinanceiro.__v52244datas){
  var oldR = window.renderFinanceiro;
  window.renderFinanceiro = function(){
    var r = oldR.apply(this, arguments);
    try{ garantirDatas(); }catch(e){}
    return r;
  };
  window.renderFinanceiro.__v52244datas = true;
}

console.log('[DIGICOPY] v5.22.44 financeiro: De/Até visíveis');
})();
