// PATCH v5.18.4 — Correção 2.3: fechar leitura pede confirmação SOMENTE para leitura aberta
(function(){
'use strict';

function low(v){ return String(v ?? '').toLowerCase().trim(); }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function confirmar(msg,titulo){
  if(typeof confirmSistema==='function') return confirmSistema(msg,titulo||'Confirmar');
  if(typeof window.lfbAlert==='function') return window.lfbAlert(msg,titulo||'Confirmar');
  return Promise.resolve(window.confirm(msg));
}

// ── 2.3: fechar a leitura pede confirmação SOMENTE para leitura aberta ──
// NÃO deve perguntar para histórico de leituras

function ehModalLeituraAberta(){
  const t=low(document.getElementById('modal-title')?.textContent||'');
  // É leitura aberta se tem "leitura" seguido de algo (número, espaço, traço)
  // Mas NÃO é histórico
  const contemLeitura = /\bleitura\b/.test(t);
  const contemHistorico = t.includes('histórico') || t.includes('historico') || t.includes('lista');
  return contemLeitura && !contemHistorico;
}

let bypassClose = false;

const closeAntigo = window.closeModal;
if(typeof closeAntigo === 'function' && !closeAntigo.__v5184){
  window.closeModal = function(){
    if(bypassClose || !ehModalLeituraAberta()) return closeAntigo.apply(this, arguments);
    bypassClose = true;
    return confirmar('Deseja salvar a leitura antes de fechar?','Fechar leitura').then(ok=>{
      if(ok) salvar();
      bypassClose = false;
      closeAntigo.apply(this, arguments);
    });
  };
  window.closeModal.__v5184 = true;
}

const voltarAntigo = window.fecharOuVoltar;
if(typeof voltarAntigo === 'function' && !voltarAntigo.__v5184){
  window.fecharOuVoltar = function(){
    if(bypassClose || !ehModalLeituraAberta()) return voltarAntigo.apply(this, arguments);
    bypassClose = true;
    return confirmar('Deseja salvar a leitura antes de fechar?','Fechar leitura').then(ok=>{
      if(ok) salvar();
      bypassClose = false;
      voltarAntigo.apply(this, arguments);
    });
  };
  window.fecharOuVoltar.__v5184 = true;
}

console.log('[DIGICOPY] ajustes_v5184_correcoes_patch.js carregado');
})();
