// ═══════════════════════════════════════════════════════════════════════════
// v5.22.39 — Patrimônio da OS não é obrigatório (some o *)
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function ehVazioTec(v){ return !txt(v) || /^selecione$/i.test(txt(v)); }

function osCompletaSemPatri(os){
  if(!os) return false;
  return !!(txt(os.modelo) && txt(os.numeroSerie) && !ehVazioTec(os.tecnico));
}

window.V52239_PATRI_PURE = {
  osCompletaSemPatri: osCompletaSemPatri
};

if(typeof document==='undefined') return;

function tirarAstPatri(){
  var el=document.getElementById('vos-os-patri');
  var lab=el && el.closest('label');
  if(!lab) return;
  var first=lab.childNodes[0];
  if(first && first.nodeType===3){
    first.textContent=String(first.textContent||'').replace(/\s*\*\s*$/,'').replace(/Patrimônio \*/i,'Patrimônio');
    if(!/patrim/i.test(first.textContent)) first.textContent='Patrimônio ';
    else first.textContent=first.textContent.replace(/\*/g,'').replace(/\s+$/,'')+' ';
  }
}

if(typeof window.vosOsCompleta==='function' && !window.vosOsCompleta.__v52239patri){
  window.vosOsCompleta=function(os){
    if(window.__vosForcarOS) return true;
    if(window.__vosForcarVenda) return false;
    if(window.__vosPrintando){
      return !!(os && ['numeroSerie','modelo','patrimonio','contador','defeito','servicos','pecas','acessorios','tecnico','tipoOS']
        .some(function(k){ return txt(os[k]) && !ehVazioTec(os[k]); }));
    }
    return osCompletaSemPatri(os);
  };
  window.vosOsCompleta.__v52239patri=true;
}

if(typeof window.vosOsRuleHint==='function' && !window.vosOsRuleHint.__v52239patri){
  var oldHint=window.vosOsRuleHint;
  window.vosOsRuleHint=function(){
    var r=oldHint.apply(this, arguments);
    var el=document.getElementById('vos-os-rule');
    if(!el || typeof window.vosColetarOS!=='function') return r;
    var os=window.vosColetarOS();
    var algum=['numeroSerie','modelo','patrimonio','contador','defeito','servicos','pecas','acessorios','tecnico'].some(function(k){ return txt(os[k]); });
    if(algum && txt(os.modelo) && txt(os.numeroSerie) && ehVazioTec(os.tecnico)){
      el.className='rounded-xl border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900';
      el.innerHTML='<i class="ph ph-warning"></i> Para ordem de serviço, escolha o <b>técnico responsável</b>.';
    } else if(algum && osCompletaSemPatri(os)){
      el.className='rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-[12px] text-emerald-900';
      el.innerHTML='<i class="ph ph-check-circle"></i> Ordem de serviço pronta. Patrimônio é opcional.';
    }
    return r;
  };
  window.vosOsRuleHint.__v52239patri=true;
}

['novaVenda','vosCarregarVendaNaTela'].forEach(function(nome){
  if(typeof window[nome]!=='function' || window[nome].__v52239patri) return;
  var old=window[nome];
  window[nome]=function(){
    var r=old.apply(this, arguments);
    setTimeout(tirarAstPatri, 80);
    return r;
  };
  window[nome].__v52239patri=true;
});

setTimeout(tirarAstPatri, 500);
console.log('[DIGICOPY] v5.22.39 patrimônio da OS não é obrigatório');
})();
