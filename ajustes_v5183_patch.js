// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.18.3 — Correções nos chamados (contrato e fora) + leitura
// • 4  — Remove a seção duplicada "Produtos / peças utilizadas" (antiga) que
//        aparecia junto da nova "Produtos / Peças usadas" (igual vendas).
// • 4.1 — Adiciona as faixas azuis de seção no chamado DENTRO do contrato,
//        igual já existe no chamado fora de contrato.
// • 1.2 — Garante que a área de peças do chamado de contrato fique igual à do
//        chamado de fora (busca/lupa, qtd, valor, desconto, valor final).
// • 2.3 — Ao fechar o "Novo lançamento de contador" (leitura) com valor
//        digitado no contador, pergunta se deseja lançar a impressora na
//        leitura antes de sair.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v == null ? '' : v).trim(); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

// ─────────────────────────────────────────────────────────────────────────
// Lógica pura (testável) — exposta em window.AJUSTES_V5183_PURE
// ─────────────────────────────────────────────────────────────────────────

// Mesma regra usada no chamado de fora (ajustes_pos_final_patch.js) para
// decidir quais rótulos ganham faixa azul.
function deveTerFaixa(texto){
  return /motivo|defeito|serviço executado|servicos|observa|contador|itens usados|peças|pecas/.test(fold(texto));
}
function tituloFaixa(texto){
  return txt(texto).replace('*', '').replace(/\s+/g, ' ').trim();
}
function lancamentoContadorPreenchido(doc){
  const el = (doc && doc.getElementById) ? doc.getElementById('lan-cont') : null;
  return !!(el && txt(el.value) !== '');
}

window.AJUSTES_V5183_PURE = { deveTerFaixa: deveTerFaixa, tituloFaixa: tituloFaixa, lancamentoContadorPreenchido: lancamentoContadorPreenchido };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

// ─────────────────────────────────────────────────────────────────────────
// Item 4 — remove a seção antiga "Produtos / peças utilizadas" (duplicada)
// ─────────────────────────────────────────────────────────────────────────
function removerPecasDuplicadas(){
  const wrap = document.getElementById('lc-pecas-wrap');
  if(!wrap) return;
  const container = wrap.parentElement;
  // O container criado por injetarCamposChamado contém: label + #lc-pecas-wrap
  // + <textarea id="lc-pecas">. Removê-lo não afeta a nova área de peças.
  if(container && container.parentElement){
    container.remove();
  }
}

const _avulso = window.abrirChamadoAvulsoForm;
if(typeof _avulso === 'function'){
  window.abrirChamadoAvulsoForm = function(){
    const r = _avulso.apply(this, arguments);
    setTimeout(removerPecasDuplicadas, 120);
    setTimeout(removerPecasDuplicadas, 350);
    setTimeout(removerPecasDuplicadas, 800);
    return r;
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Item 4.1 — faixas azuis de seção no chamado de CONTRATO
// ─────────────────────────────────────────────────────────────────────────
function garantirFaixaCSS(){
  if(document.getElementById('faixa-chamado-v5183-css')) return;
  const style = document.createElement('style');
  style.id = 'faixa-chamado-v5183-css';
  style.textContent = '.faixa-chamado-final{margin:10px 0 6px;padding:7px 10px;background:#0a1e8a;color:#fff;border-radius:10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}';
  if(document.head) document.head.appendChild(style);
}

function adicionarFaixasChamado(){
  const body = document.getElementById('modal-body');
  if(!body) return;
  const title = document.getElementById('modal-title') ? (document.getElementById('modal-title').innerText || '') : '';
  if(!/chamado|ordem/i.test(title)) return;
  const els = body.querySelectorAll('label,p');
  for(let i = 0; i < els.length; i++){
    const el = els[i];
    const t = el.innerText || el.textContent || '';
    if(!deveTerFaixa(t)) continue;
    const prev = el.previousElementSibling;
    if(prev && prev.classList && prev.classList.contains('faixa-chamado-final')) continue;
    const faixa = document.createElement('div');
    faixa.className = 'faixa-chamado-final';
    faixa.textContent = tituloFaixa(t);
    el.parentNode.insertBefore(faixa, el);
  }
}

garantirFaixaCSS();
const _openContrato = window.openModalChamadoCompleto;
if(typeof _openContrato === 'function'){
  window.openModalChamadoCompleto = function(){
    const r = _openContrato.apply(this, arguments);
    setTimeout(adicionarFaixasChamado, 60);
    setTimeout(adicionarFaixasChamado, 260);
    return r;
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Item 1.2 — garante a área de peças "igual vendas" no chamado de contrato
// (reforço caso o montar de peças da v5.18.2 não tenha rodado a tempo)
// ─────────────────────────────────────────────────────────────────────────
function reassegurarPecasContrato(){
  const box = document.getElementById('ko-pecas-box');
  const total = document.getElementById('ko-prod-total');
  if(box && !total && typeof window.lcRenderPecas === 'function'){
    window.lcRenderPecas('ko');
  }
}
if(typeof _openContrato === 'function'){
  const _openContrato2 = window.openModalChamadoCompleto;
  window.openModalChamadoCompleto = function(){
    const r = _openContrato2.apply(this, arguments);
    setTimeout(reassegurarPecasContrato, 320);
    return r;
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Item 2.3 — aviso ao fechar lançamento de contador com valor digitado
// ─────────────────────────────────────────────────────────────────────────
const _abrirLanc = window.abrirLancamentoContador;
if(typeof _abrirLanc === 'function'){
  window.abrirLancamentoContador = function(leituraId){
    window.__lcLancAberto = true;
    window.__lcLancLeituraId = leituraId;
    return _abrirLanc.apply(this, arguments);
  };
}

const _salvarLanc = window.salvarLancamentoContador;
if(typeof _salvarLanc === 'function'){
  window.salvarLancamentoContador = function(leituraId){
    window.__lcLancAberto = false;
    return _salvarLanc.apply(this, arguments);
  };
}

const _abrirDet = window.abrirLeituraContratoDetalhe;
if(typeof _abrirDet === 'function'){
  window.abrirLeituraContratoDetalhe = function(leituraId){
    if(window.__lcLancAberto && lancamentoContadorPreenchido(document)){
      const id = window.__lcLancLeituraId || leituraId;
      const seguir = function(ok){
        window.__lcLancAberto = false;
        if(ok && typeof window.salvarLancamentoContador === 'function'){
          window.salvarLancamentoContador(id);
        } else {
          _abrirDet.call(window, leituraId);
        }
      };
      if(typeof window.confirmSistema === 'function'){
        window.confirmSistema('Deseja lançar essa impressora na leitura?', 'Lançar na leitura').then(seguir);
        return undefined;
      }
    }
    window.__lcLancAberto = false;
    return _abrirDet.apply(this, arguments);
  };
}

console.log('[DIGICOPY] ajustes_v5183_patch.js');
})();
