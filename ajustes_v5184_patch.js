// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.18.4 — PDF do chamado: dados do cliente e de atendimento lado a lado
// • Item 3 — no PDF do chamado (Ordem de Serviço), a caixa de DADOS DO CLIENTE
//   fica ao lado da caixa de DADOS DE ATENDIMENTO (economiza espaço).
//   - Cliente: nome, documento, telefone e endereço.
//   - Atendimento: técnico, criado por, motivo/defeito, data de cadastro e
//     data de atendimento.
//   - A "Data do atendimento" que ficava solta no rodapé subiu para a caixa
//     de atendimento; os contadores continuam no rodapé (em branco até
//     finalizar, como já era).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function n(v, fb){ var x = Number(String(v==null?'':v).replace(',', '.')); return Number.isFinite(x) ? x : (fb === undefined ? 0 : fb); }
function money(v){ return typeof fmtMoney === 'function' ? fmtMoney(n(v)) : ('R$ ' + n(v).toFixed(2).replace('.', ',')); }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function aviso(m){ if(typeof window.lfbAlert === 'function') return window.lfbAlert(m, 'Aviso'); }
function logoSrc(){ return window.DIGICOPY_LOGO || './logo.png'; }
function dia(v){ return String(v==null?'':v).slice(0,10); }
function dataBR(v){ var s = dia(v); if(!s) return ''; var p = s.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s; }

function normItem(it){
  var qtd = Math.max(1, n(it.qtd, 1));
  var preco = n(it.preco, 0);
  var desconto = Math.max(0, n(it.desconto, 0));
  return Object.assign({}, it, { qtd: qtd, preco: preco, desconto: desconto, subtotal: Math.max(0, qtd * preco - desconto) });
}

function chamadoFinalizado(o){
  if(!o) return false;
  var chk = document.getElementById('ko-concluido') || document.getElementById('ca-concluido');
  if(chk) return !!chk.checked;
  var st = String(o.status || '').toLowerCase();
  return st === 'concluido' || st === 'finalizado' || st === 'fechado';
}
function parqueDaOs(o){
  var list = db.parque || [];
  return list.find(function(x){ return x.equipamentoId === o.equipamentoId && (!o.contratoId || x.contratoId === o.contratoId); })
      || list.find(function(x){ return x.equipamentoId === o.equipamentoId; })
      || null;
}
function temColor(p, o){
  if(!o.contratoId) return true;
  var m = (p && (p.medidoresConfig || p.medidores)) || {};
  return ['colorA4','colorA3'].some(function(k){
    var x = m[k]; if(!x) return false;
    var mod = String(x.modalidade || x.mod || '').toLowerCase();
    return !!(mod && mod !== 'inativo' && mod !== 'off');
  });
}
function lojaRodape(){
  var s = sess() || {};
  var emp = (db.empresas || []).find(function(e){ return e.id === s.empresaId; }) || {};
  var l = (db.config && (db.config.loja || db.config.empresa)) || {};
  var d = Object.assign({}, emp, l);
  var end = d.endereco || [d.rua || d.logradouro, d.numero, d.bairro, d.cidade || d.municipio, d.uf || d.estado, d.cep].filter(Boolean).join(' • ');
  return { fantasia: d.fantasia || 'DIGICOPY', razao: d.razaoSocial || d.nome || '', cnpj: d.cnpj || s.cnpj || '', tel: d.telefone || d.fone || '', whats: d.whatsapp || '', email: d.email || '', end: end || '' };
}


console.log('[DIGICOPY] ajustes_v5184_patch.js');
})();
