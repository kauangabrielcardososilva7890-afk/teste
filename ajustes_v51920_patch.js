// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.20 — validação de chamado em UM aviso só + destaque em vermelho
// • Ao salvar/finalizar, junta TUDO que está faltando num único aviso.
// • Campos preenchidos saem do aviso (só mostra o que falta).
// • Campos que faltam ficam destacados em vermelho (igual produtos).
// • Ao finalizar: exige contador preto; no contrato com Color ativo, o color
//   também é obrigatório. Fora de contrato, só o preto.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v == null ? '' : v).trim(); }
function low(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function avisar(m){ if(typeof window.lfbAlert === 'function') return window.lfbAlert(m, 'Aviso'); else if(typeof toast === 'function') return toast(m, 'error'); }

// ─────────────────────────────────────────────────────────────────────────
// Lógica pura (testável)
// ─────────────────────────────────────────────────────────────────────────
function pegarValor(doc, ids){
  for(var i = 0; i < ids.length; i++){
    var el = doc.getElementById(ids[i]);
    if(el && txt(el.value) !== '') return { el: el, valor: txt(el.value) };
  }
  return { el: null, valor: '' };
}
function marcado(doc, ids){
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

window.AJUSTES_V51920_PURE = { pegarValor: pegarValor, marcado: marcado, impressoraTemColor: impressoraTemColor };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

const IDS = {
  concluido: ['ko-concluido','kr-os-concluido','ca-concluido','o-concluido'],
  desc:      ['ko-desc','kr-os-desc','ca-desc','o-desc'],
  modelo:    ['ko-modelo','kr-os-modelo','ca-modelo'],
  serial:    ['ko-serie','kr-os-serie','ca-serie'],
  contPreto: ['ko-cont-atu','kr-os-cont-atu','ca-cont-atu'],
  contColor: ['lc-cont-color-atu','ca-cont-color-atu'],
  dataAtend: ['lc-data-atend'],
  equip:     ['ko-equip','kr-os-eq']
};

function isContrato(){
  return !!(window.modalContext && window.modalContext.contratoId);
}
function equipIdAtual(){
  var r = pegarValor(document, IDS.equip);
  if(r.valor) return r.valor;
  return (window.__CHAMADO_AVULSO && window.__CHAMADO_AVULSO.equipamentoId) || '';
}

function destacar(el){
  if(!el) return;
  el.classList.add('border-red-500','ring-2','ring-red-200');
}

function validarChamado(){
  const finalizar = marcado(document, IDS.concluido);
  const ehContrato = isContrato();
  const faltando = []; // { label, el }

  function exigir(label, ids){
    const r = pegarValor(document, ids);
    if(!r.valor) faltando.push({ label: label, el: r.el || (ids.length ? document.getElementById(ids[0]) : null) });
  }

  exigir('Motivo / Defeito', IDS.desc);
  exigir('Modelo', IDS.modelo);
  exigir('Serial', IDS.serial);

  if(!ehContrato){
    const clienteId = (window.__CHAMADO_AVULSO && window.__CHAMADO_AVULSO.clienteId) || '';
    if(!clienteId) faltando.push({ label: 'Cliente', el: document.getElementById('ca-cliente-selecionado') || document.getElementById('ca-busca-cliente') });
  }

  if(finalizar){
    exigir('Contador preto atual', IDS.contPreto);
    exigir('Data de atendimento', IDS.dataAtend);
    if(ehContrato){
      const eqId = equipIdAtual();
      if(eqId && impressoraTemColor(db, eqId)){
        exigir('Contador color atual', IDS.contColor);
      }
    }
  }

  if(faltando.length){
    // destaca em vermelho os que faltam
    faltando.forEach(function(f){ destacar(f.el); });
    // foca no primeiro
    var primeiro = faltando.find(function(f){ return f.el; });
    if(primeiro && primeiro.el) primeiro.el.focus();
    avisar('Preencha o que falta: ' + faltando.map(function(f){ return f.label; }).join(', '));
    return false;
  }
  return true;
}

const _salvarContrato = window.salvarChamadoCompleto;
if(typeof _salvarContrato === 'function' && !_salvarContrato.__v51920){
  window.salvarChamadoCompleto = function(){
    if(!validarChamado()) return;
    return _salvarContrato.apply(this, arguments);
  };
  window.salvarChamadoCompleto.__v51920 = true;
}

const _salvarAvulso = window.salvarChamadoAvulso;
if(typeof _salvarAvulso === 'function' && !_salvarAvulso.__v51920){
  window.salvarChamadoAvulso = function(){
    if(!validarChamado()) return;
    return _salvarAvulso.apply(this, arguments);
  };
  window.salvarChamadoAvulso.__v51920 = true;
}

console.log('[DIGICOPY] ajustes_v51920_patch.js');
})();
