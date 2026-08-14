// PATCH v5.18.4 — Correções: 2.3 salvar lançamento e faixas nos chamados de contrato
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
// 2.3: Ao fechar lançamento de contador com dados modificados, pergunta se quer SALVAR
// ═══════════════════════════════════════════════════════════════════════════════════

function ehModalLancamento(){
  const t=low(document.getElementById('modal-title')?.textContent||'');
  return t.includes('lançamento') || t.includes('lancamento') || t.includes('editar lançamento');
}

let lancamentoModificado = false;

function resetarLancamento(){
  lancamentoModificado = false;
}

function initLancamentoHooks(){
  // Detectar modificações nos campos de lançamento
  document.addEventListener('input', function(ev){
    const target = ev.target;
    if(!target) return;
    const ids = ['lan-cont', 'lei-cont-def', 'leit-cont', 'lan-cont-def', 'lei-cont', 'lan-med', 'lan-prq'];
    if(ids.includes(target.id)){
      lancamentoModificado = true;
    }
  });
  
  // Resetar ao abrir modais de lançamento
  ['abrirLancamentoContador','abrirLancamentoDefinitiva','abrirLeituraContratoDetalhe','editarLancamentoLeitura'].forEach(fn=>{
    const orig = window[fn];
    if(typeof orig === 'function' && !orig.__v5184Reset){
      window[fn] = function(){
        resetarLancamento();
        return orig.apply(this, arguments);
      };
      window[fn].__v5184Reset = true;
    }
  });
}

let bypassClose = false;

const closeAntigo = window.closeModal;
if(typeof closeAntigo === 'function' && !closeAntigo.__v5184Lanc){
  window.closeModal = function(){
    if(bypassClose) return closeAntigo.apply(this, arguments);
    
    // Se é modal de lançamento e foi modificado, pergunta se quer salvar
    if(ehModalLancamento() && lancamentoModificado){
      bypassClose = true;
      return confirmar('Deseja salvar este lançamento de contador?', 'Lançamento modificado').then(ok=>{
        bypassClose = false;
        if(ok){
          // Simular click no botão Salvar
          const btn = document.querySelector('button[onclick*="salvarLancamento"], button[onclick*="salvarItemLeitura"]');
          if(btn) btn.click();
        }
        closeAntigo.apply(this, arguments);
      });
    }
    
    return closeAntigo.apply(this, arguments);
  };
  window.closeModal.__v5184Lanc = true;
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 4.1: Faixas azuis nos chamados de contrato (igual aos chamados avulsos)
// ═══════════════════════════════════════════════════════════════════════════════════

function injetarFaixasChamadoContrato(){
  const modalBody = document.getElementById('modal-body');
  if(!modalBody) return;
  
  // Verifica se está no modal de chamado de contrato
  const title = low(document.getElementById('modal-title')?.textContent||'');
  if(!title.includes('chamado')) return;
  
  // Já tem faixas?
  if(modalBody.querySelector('.faixa-kr')) return;
  
  // Adiciona CSS se não existir
  if(!document.getElementById('faixa-kr-css')){
    const style = document.createElement('style');
    style.id = 'faixa-kr-css';
    style.textContent = `
      .faixa-kr {
        background: linear-gradient(90deg, #0a1e8a, #1d4ed8);
        color: #fff !important;
        text-align: center;
        font-weight: 800;
        padding: 8px 12px;
        margin: 16px 0 8px;
        border-radius: 8px;
        letter-spacing: .06em;
        font-size: 11px;
        text-transform: uppercase;
      }
      .faixa-kr:first-child { margin-top: 0; }
    `;
    document.head.appendChild(style);
  }
  
  // Encontra as seções para adicionar faixas
  const sections = [
    { antes: 'Motivo / Defeito', texto: 'Motivo / Defeito' },
    { antes: 'Serviços Executados', texto: 'Serviços Executados' },
    { antes: 'Anotações', texto: 'Anotações / Pendências' },
    { antes: 'Produtos / Peças usadas', texto: 'Produtos / Peças Utilizadas' }
  ];
  
  sections.forEach(sec => {
    // Procura elementos que contenham o texto
    const labels = modalBody.querySelectorAll('label, p, div');
    labels.forEach(el => {
      const text = low(el.textContent||'');
      if(text.includes(sec.antes.toLowerCase()) && !el.classList.contains('faixa-kr')){
        // Verifica se já tem uma faixa antes
        if(el.previousElementSibling?.classList.contains('faixa-kr')) return;
        if(el.classList.contains('faixa-kr')) return;
        
        const faixa = document.createElement('div');
        faixa.className = 'faixa-kr';
        faixa.textContent = sec.texto;
        el.parentNode.insertBefore(faixa, el);
      }
    });
  });
}

// Hook no openModalChamadoCompleto do contratos_refino_patch.js
function hookFaixasChamado(){
  const orig = window.openModalChamadoCompleto;
  if(typeof orig === 'function' && !orig.__v5184Faixa){
    window.openModalChamadoCompleto = function(){
      const r = orig.apply(this, arguments);
      setTimeout(injetarFaixasChamadoContrato, 100);
      setTimeout(injetarFaixasChamadoContrato, 300);
      return r;
    };
    window.openModalChamadoCompleto.__v5184Faixa = true;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// Inicialização
// ═══════════════════════════════════════════════════════════════════════════════════

function init(){
  initLancamentoHooks();
  hookFaixasChamado();
  setTimeout(hookFaixasChamado, 1000);
  setTimeout(hookFaixasChamado, 2000);
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  setTimeout(init, 200);
}

console.log('[DIGICOPY] ajustes_v5184_correcoes_patch.js carregado');
})();
