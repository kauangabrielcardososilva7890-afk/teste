// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.20 — validação obrigatória ao salvar/finalizar chamado
// • 1 — Ao SALVAR (sempre): exige motivo/defeito, modelo e serial. No chamado
//        FORA de contrato, também exige cliente.
// • 2 — Ao FINALIZAR: exige contador preto atual. No chamado DE contrato, se a
//        impressora tiver modalidade COLOR ativa, o contador color também é
//        obrigatório. Fora de contrato, só o preto é obrigatório.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v == null ? '' : v).trim(); }
function low(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
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
function concluidoMarcado(doc, ids){
  for(var i = 0; i < ids.length; i++){
    var el = doc.getElementById(ids[i]);
    if(el && el.checked) return true;
  }
  return false;
}
function impressoraTemColor(db, equipId){
  var p = (db.parque || []).find(function(x){ return x.equipamentoId === equipId; });
  var m = (p && (p.medidoresConfig || p.medidores)) || {};
  return ['colorA4','colorA3'].some(function(k){
    var x = m[k]; if(!x) return false;
    var mod = low(x.modalidade || x.mod || '');
    return !!(mod && mod !== 'inativo' && mod !== 'off');
  });
}

window.AJUSTES_V51920_PURE = { primeiroValor: primeiroValor, concluidoMarcado: concluidoMarcado, impressoraTemColor: impressoraTemColor };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

// IDs possíveis por campo (formulários de contrato e avulso)
const IDS = {
  concluido: ['ko-concluido','kr-os-concluido','ca-concluido','o-concluido'],
  desc:      ['ko-desc','kr-os-desc','ca-desc','o-desc'],
  modelo:    ['ko-modelo','kr-os-modelo','ca-modelo'],
  serial:    ['ko-serie','kr-os-serie','ca-serie'],
  contPreto: ['ko-cont-atu','kr-os-cont-atu','ca-cont-atu'],
  contColor: ['lc-cont-color-atu','ca-cont-color-atu'],
  equip:     ['ko-equip','kr-os-eq']
};

function isContrato(){
  return !!(window.modalContext && window.modalContext.contratoId);
}
function equipIdAtual(){
  var v = primeiroValor(document, IDS.equip);
  if(v) return v;
  return (window.__CHAMADO_AVULSO && window.__CHAMADO_AVULSO.equipamentoId) || '';
}

// Valida e retorna true se pode salvar; false se bloqueou (com aviso).
function validarChamadoAntesDeSalvar(){
  // 1) motivo/defeito (sempre)
  if(!primeiroValor(document, IDS.desc)){ avisar('Informe o motivo do chamado'); return false; }
  // 2) modelo (sempre)
  if(!primeiroValor(document, IDS.modelo)){ avisar('Informe o modelo da impressora'); return false; }
  // 3) serial (sempre)
  if(!primeiroValor(document, IDS.serial)){ avisar('Informe o serial da impressora'); return false; }
  // 4) cliente (só fora de contrato)
  if(!isContrato()){
    const clienteId = (window.__CHAMADO_AVULSO && window.__CHAMADO_AVULSO.clienteId) || '';
    if(!clienteId){ avisar('Selecione o cliente'); return false; }
  }
  // 5) ao finalizar: contador preto obrigatório
  if(concluidoMarcado(document, IDS.concluido)){
    if(!primeiroValor(document, IDS.contPreto)){ avisar('Preencha o contador preto atual para finalizar'); return false; }
    // de contrato + impressora com color → color obrigatório
    if(isContrato()){
      const eqId = equipIdAtual();
      if(eqId && impressoraTemColor(db, eqId)){
        if(!primeiroValor(document, IDS.contColor)){ avisar('Preencha o contador color atual para finalizar'); return false; }
      }
    }
  }
  return true;
}

// Wrappers
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
