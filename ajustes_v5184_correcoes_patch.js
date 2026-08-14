// PATCH v5.18.4 — Correção 2.3: fechar leitura com confirmação APENAS se dados modificados
(function(){
'use strict';

function low(v){ return String(v ?? '').toLowerCase().trim(); }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function confirmar(msg,titulo){
  if(typeof confirmSistema==='function') return confirmSistema(msg,titulo||'Confirmar');
  if(typeof window.lfbAlert==='function') return window.lfbAlert(msg,titulo||'Confirmar');
  return Promise.resolve(window.confirm(msg));
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 2.3: Fechar leitura — confirmação APENAS se houver dados no contador modificados
// ═══════════════════════════════════════════════════════════════════════════════════

function ehModalLeituraAberta(){
  const t=low(document.getElementById('modal-title')?.textContent||'');
  const contemLeitura = /\bleitura\b/.test(t);
  const contemHistorico = t.includes('histórico') || t.includes('historico') || t.includes('lista');
  return contemLeitura && !contemHistorico;
}

// Rastreia se o campo de contador foi modificado nesta sessão
let contadorModificado = false;

function marcarContadorModificado(){
  contadorModificado = true;
}

function resetarContadorModificado(){
  contadorModificado = false;
}

let bypassClose = false;

function tentarFecharLeitura(){
  if(bypassClose) return false;
  if(!ehModalLeituraAberta()) return false;
  if(!contadorModificado) return false; // Não pergunta se não modificou nada
  
  bypassClose = true;
  return confirmar('Deseja salvar a leitura antes de fechar?', 'Fechar leitura').then(ok=>{
    if(ok) salvar();
    bypassClose = false;
    return ok;
  });
}

const closeAntigo = window.closeModal;
if(typeof closeAntigo === 'function' && !closeAntigo.__v5184Fechar){
  window.closeModal = function(){
    if(ehModalLeituraAberta() && contadorModificado){
      bypassClose = true;
      return confirmar('Deseja salvar a leitura antes de fechar?', 'Fechar leitura').then(ok=>{
        if(ok) salvar();
        bypassClose = false;
        if(ok) closeAntigo.apply(this, arguments);
      });
    }
    return closeAntigo.apply(this, arguments);
  };
  window.closeModal.__v5184Fechar = true;
}

const voltarAntigo = window.fecharOuVoltar;
if(typeof voltarAntigo === 'function' && !voltarAntigo.__v5184Fechar){
  window.fecharOuVoltar = function(){
    if(ehModalLeituraAberta() && contadorModificado){
      bypassClose = true;
      return confirmar('Deseja salvar a leitura antes de fechar?', 'Fechar leitura').then(ok=>{
        if(ok) salvar();
        bypassClose = false;
        if(ok) voltarAntigo.apply(this, arguments);
      });
    }
    return voltarAntigo.apply(this, arguments);
  };
  window.fecharOuVoltar.__v5184Fechar = true;
}

// Hook para detectar quando campos de contador são modificados
function initContadorHooks(){
  document.addEventListener('input', function(ev){
    const target = ev.target;
    if(!target) return;
    // Campos de contador de leitura
    const ids = ['lan-cont', 'lei-cont-def', 'leit-cont', 'lan-cont-def', 'lei-cont'];
    if(ids.includes(target.id)){
      marcarContadorModificado();
    }
  });
  
  // Resetar quando abrir nova leitura/lançamento
  const origLanc = window.abrirLancamentoContador;
  if(typeof origLanc === 'function' && !origLanc.__v5184Reset){
    window.abrirLancamentoContador = function(){
      resetarContadorModificado();
      return origLanc.apply(this, arguments);
    };
    window.abrirLancamentoContador.__v5184Reset = true;
  }
  
  const origLancDef = window.abrirLancamentoDefinitiva;
  if(typeof origLancDef === 'function' && !origLancDef.__v5184Reset){
    window.abrirLancamentoDefinitiva = function(){
      resetarContadorModificado();
      return origLancDef.apply(this, arguments);
    };
    window.abrirLancamentoDefinitiva.__v5184Reset = true;
  }
  
  const origDetalhe = window.abrirLeituraContratoDetalhe;
  if(typeof origDetalhe === 'function' && !origDetalhe.__v5184Reset){
    window.abrirLeituraContratoDetalhe = function(){
      resetarContadorModificado();
      return origDetalhe.apply(this, arguments);
    };
    window.abrirLeituraContratoDetalhe.__v5184Reset = true;
  }
}

console.log('[DIGICOPY] ajustes_v5184_correcoes_patch.js carregado');
initContadorHooks();
})();
