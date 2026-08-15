// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.20 — validação obrigatória ao SALVAR chamado (sem duplicar)
// • 1 — Ao SALVAR (sempre): exige motivo/defeito, modelo e serial. No chamado
//        FORA de contrato, também exige cliente.
// • 2 — A validação do contador (preto/color) ao FINALIZAR já existe em
//        validarFinalizar (locacao_chamados_fix_patch.js) — NÃO é duplicada aqui.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v == null ? '' : v).trim(); }
function avisar(m){ if(typeof window.lfbAlert === 'function') return window.lfbAlert(m, 'Aviso'); else if(typeof toast === 'function') return toast(m, 'error'); }

// ─────────────────────────────────────────────────────────────────────────
// Lógica pura (testável)
// ─────────────────────────────────────────────────────────────────────────
function primeiroValor(doc, ids){
  for(var i = 0; i < ids.length; i++){
    var el = doc.getElementById(ids[i]);
    if(el && txt(el.value) !== '') return txt(el.value);
  }
  return '';
}

window.AJUSTES_V51920_PURE = { primeiroValor: primeiroValor };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

const IDS = {
  desc:   ['ko-desc','kr-os-desc','ca-desc','o-desc'],
  modelo: ['ko-modelo','kr-os-modelo','ca-modelo'],
  serial: ['ko-serie','kr-os-serie','ca-serie']
};

function isContrato(){
  return !!(window.modalContext && window.modalContext.contratoId);
}

// Só exige o que faltava: motivo, modelo, serial (e cliente no avulso).
function validarChamadoAntesDeSalvar(){
  if(!primeiroValor(document, IDS.desc)){ avisar('Informe o motivo do chamado'); return false; }
  if(!primeiroValor(document, IDS.modelo)){ avisar('Informe o modelo da impressora'); return false; }
  if(!primeiroValor(document, IDS.serial)){ avisar('Informe o serial da impressora'); return false; }
  if(!isContrato()){
    const clienteId = (window.__CHAMADO_AVULSO && window.__CHAMADO_AVULSO.clienteId) || '';
    if(!clienteId){ avisar('Selecione o cliente'); return false; }
  }
  return true;
}

const _salvarContrato = window.salvarChamadoCompleto;
if(typeof _salvarContrato === 'function' && !_salvarContrato.__v51920){
  window.salvarChamadoCompleto = function(){
    if(!validarChamadoAntesDeSalvar()) return;
    return _salvarContrato.apply(this, arguments);
  };
  window.salvarChamadoCompleto.__v51920 = true;
}

const _salvarAvulso = window.salvarChamadoAvulso;
if(typeof _salvarAvulso === 'function' && !_salvarAvulso.__v51920){
  window.salvarChamadoAvulso = function(){
    if(!validarChamadoAntesDeSalvar()) return;
    return _salvarAvulso.apply(this, arguments);
  };
  window.salvarChamadoAvulso.__v51920 = true;
}

console.log('[DIGICOPY] ajustes_v51920_patch.js');
})();
