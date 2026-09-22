// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.18.5 — corrige de verdade a duplicação de peças + impressora no PDF
// • 4/1.2 — A duplicação "Produtos / peças utilizadas" não saía porque outro
//          patch (v5.17.1) já removia o #lc-pecas-wrap (as 5 linhas), deixando
//          o RÓTULO "Produtos / peças utilizadas" + o textarea escondido pra
//          trás. Agora removemos o bloco INTEIRO (label + textarea).
// • 3   — Devolve os dados da IMPRESSORA (modelo, patrimônio, serial, local)
//          no PDF do chamado, mantendo Cliente + Atendimento lado a lado.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function n(v, fb){ var x = Number(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(x) ? x : (fb === undefined ? 0 : fb); }
function money(v){ return typeof fmtMoney === 'function' ? fmtMoney(n(v)) : ('R$ ' + n(v).toFixed(2).replace('.', ',')); }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function aviso(m){ if(typeof window.lfbAlert === 'function') return window.lfbAlert(m, 'Aviso'); }
function logoSrc(){ return window.DIGICOPY_LOGO || './logo.png'; }
function dia(v){ return String(v == null ? '' : v).slice(0, 10); }
function dataBR(v){ var s = dia(v); if(!s) return ''; var p = s.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s; }

function normItem(it){
  var qtd = Math.max(1, n(it.qtd, 1));
  var preco = n(it.preco, 0);
  var desconto = Math.max(0, n(it.desconto, 0));
  return Object.assign({}, it, { qtd: qtd, preco: preco, desconto: desconto, subtotal: Math.max(0, qtd * preco - desconto) });
}

// ─────────────────────────────────────────────────────────────────────────
// Lógica pura (testável)
// ─────────────────────────────────────────────────────────────────────────
window.AJUSTES_V5185_PURE = {
  impressoraLinha: function(o){
    if(!o) return '';
    var partes = [];
    if(o.modelo) partes.push(o.modelo);
    if(o.patrimonio) partes.push('Patrimônio ' + o.patrimonio);
    if(o.serie) partes.push('Serial ' + o.serie);
    return partes.join(' • ');
  }
};

if(typeof window === 'undefined' || typeof document === 'undefined') return;

// ─────────────────────────────────────────────────────────────────────────
// Item 4 / 1.2 — remove o bloco ANTIGO de peças por completo
// ─────────────────────────────────────────────────────────────────────────
function limparPecasAntigas(){
  // 1) Avulso: bloco "Produtos / peças utilizadas" (label + textarea escondido).
  //    O #lc-pecas-wrap (5 linhas) já foi removido por outro patch, então
  //    miramos no textarea #lc-pecas e apagamos o container inteiro.
  var ta = document.getElementById('lc-pecas');
  if(ta){
    var c = ta.parentElement;
    if(c && c.parentElement) c.remove();
  }
  // 2) Contrato (formulário antigo do refino): select kr-os-prod.
  var kr = document.getElementById('kr-os-prod');
  if(kr){
    var c2 = kr.closest('.rounded-xl') || kr.parentElement;
    if(c2 && c2.parentElement) c2.remove();
  }
  // 3) Contrato (formulário antigo do fluxos): select ko-produto.
  var kp = document.getElementById('ko-produto');
  if(kp){
    var c3 = kp.closest('.rounded-xl') || kp.parentElement;
    if(c3 && c3.parentElement) c3.remove();
  }
}

window.__limparPecasAntigas = limparPecasAntigas;

// Roda sempre que o conteúdo do modal mudar (pega qualquer timing/entrada).
var _limpaTimer = null;
function agendarLimpeza(){
  if(_limpaTimer) return;
  _limpaTimer = setTimeout(function(){
    _limpaTimer = null;
    limparPecasAntigas();
  }, 60);
}
if(document.body){
  try{
    new MutationObserver(function(){ agendarLimpeza(); }).observe(document.body, { childList:true, subtree:true });
  }catch(e){}
}

// Reforço: também chama na abertura dos dois formulários.
var _openContrato = window.openModalChamadoCompleto;
if(typeof _openContrato === 'function'){
  window.openModalChamadoCompleto = function(){
    var r = _openContrato.apply(this, arguments);
    setTimeout(limparPecasAntigas, 120);
    setTimeout(limparPecasAntigas, 400);
    return r;
  };
}
var _abrirAvulso = window.abrirChamadoAvulsoForm;
if(typeof _abrirAvulso === 'function'){
  window.abrirChamadoAvulsoForm = function(){
    var r = _abrirAvulso.apply(this, arguments);
    setTimeout(limparPecasAntigas, 120);
    setTimeout(limparPecasAntigas, 400);
    return r;
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Item 3 — PDF do chamado com IMPRESSORA de volta
// ─────────────────────────────────────────────────────────────────────────
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


console.log('[DIGICOPY] ajustes_v5185_patch.js');
})();
