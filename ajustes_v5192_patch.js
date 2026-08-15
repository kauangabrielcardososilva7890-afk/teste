// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.2 — corrige o "Informe o motivo do chamado" ao salvar/sair
// • CAUSA: o formulário do chamado é desenhado com campos de um nome (ko-* /
//   ca-*), mas a função de SALVAR valida/grava campos de OUTRO nome (kr-os-*).
//   Resultado: o sistema achava que "Motivo / Defeito" estava vazio mesmo com
//   texto escrito — no botão Salvar E ao Sair.
// • FIX: antes de salvar, copia o que está digitado nas caixas para os campos
//   que o "salvar" lê (criando os campos escondidos, se preciso). Cobre motivo,
//   modelo, patrimônio, serial, local, contadores, serviços, observação,
//   técnico, impressora e "finalizado?".
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

if(typeof window === 'undefined' || typeof document === 'undefined') return;

// Cada campo lógico: o ID que o salvar lê (target) + de onde tirar o valor.
const FIELDS = [
  { target: 'kr-os-desc',       srcs: ['ko-desc','ca-desc','o-desc'], type: 'value' },
  { target: 'kr-os-modelo',     srcs: ['ko-modelo','ca-modelo'], type: 'value' },
  { target: 'kr-os-patr',       srcs: ['ko-patr','ca-patr'], type: 'value' },
  { target: 'kr-os-serie',      srcs: ['ko-serie','ca-serie'], type: 'value' },
  { target: 'kr-os-local',      srcs: ['ko-local','ca-local'], type: 'value' },
  { target: 'kr-os-cont-ant',   srcs: ['ko-cont-ant','ca-cont-ant'], type: 'value' },
  { target: 'kr-os-cont-atu',   srcs: ['ko-cont-atu','ca-cont-atu'], type: 'value' },
  { target: 'kr-os-qtd',        srcs: ['ko-qtd-imp','ca-qtd'], type: 'value' },
  { target: 'kr-os-serv',       srcs: ['ko-serv','ca-serv'], type: 'value' },
  { target: 'kr-os-obs',        srcs: ['ko-obs','ca-obs'], type: 'value' },
  { target: 'kr-os-tec',        srcs: ['ko-tec'], type: 'value' },
  { target: 'kr-os-eq',         srcs: ['ko-equip'], type: 'value' },
  { target: 'kr-os-concluido',  srcs: ['ko-concluido','ca-concluido'], type: 'checked' }
];

function acharValor(field){
  for(let i = 0; i < field.srcs.length; i++){
    const el = document.getElementById(field.srcs[i]);
    if(!el) continue;
    if(field.type === 'checked') return { ok: true, val: !!el.checked };
    if(el.value != null && String(el.value).trim() !== '') return { ok: true, val: String(el.value).trim() };
  }
  return { ok: false, val: null };
}

function garantirAlvo(field, val, tipo){
  let el = document.getElementById(field.target);
  if(!el){
    el = document.createElement('input');
    el.id = field.target;
    el.type = (tipo === 'checked') ? 'checkbox' : 'hidden';
    el.style.display = 'none';
    if(document.body) document.body.appendChild(el);
  }
  if(tipo === 'checked') el.checked = !!val;
  else el.value = val;
}

function sincronizarCampos(){
  FIELDS.forEach(function(field){
    const r = acharValor(field);
    if(field.type === 'checked'){
      // checkbox: copia mesmo se desmarcado (estado atual importa)
      if(r.ok) garantirAlvo(field, r.val, 'checked');
      return;
    }
    if(!r.ok) return; // nada digitado: deixa o salvar reclamar (é o certo)
    garantirAlvo(field, r.val, 'value');
  });
}

window.__sincronizarCamposChamado = sincronizarCampos;

const _salvarContrato = window.salvarChamadoCompleto;
if(typeof _salvarContrato === 'function' && !_salvarContrato.__v5192){
  window.salvarChamadoCompleto = function(){
    sincronizarCampos();
    return _salvarContrato.apply(this, arguments);
  };
  window.salvarChamadoCompleto.__v5192 = true;
}

const _salvarAvulso = window.salvarChamadoAvulso;
if(typeof _salvarAvulso === 'function' && !_salvarAvulso.__v5192){
  window.salvarChamadoAvulso = function(){
    sincronizarCampos();
    return _salvarAvulso.apply(this, arguments);
  };
  window.salvarChamadoAvulso.__v5192 = true;
}

console.log('[DIGICOPY] ajustes_v5192_patch.js');
})();
