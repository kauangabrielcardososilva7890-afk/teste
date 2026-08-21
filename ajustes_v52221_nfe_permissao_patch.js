// ═══════════════════════════════════════════════════════════════════════════
// v5.22.21 — Caixa “pode emitir NF” em Usuários
// • Só Admin ou Dono edita a caixa
// • Só quem estiver marcado confere/assina
// • Ainda não envia para a SEFAZ
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function perfilDe(u){
  if(typeof window.AJUSTES_V5196_PURE === 'object' && window.AJUSTES_V5196_PURE.perfilEfetivo){
    return window.AJUSTES_V5196_PURE.perfilEfetivo(u);
  }
  var p = txt(u && u.perfil);
  if(p === 'Admin' || p === 'Dono') return p;
  return 'Funcionário';
}
function ehAdminOuDono(u){
  var p = perfilDe(u);
  return p === 'Admin' || p === 'Dono';
}
function podeEmitirNfe(u){ return !!(u && u.podeEmitirNfe); }
function podeEditarCaixaNfe(s){ return ehAdminOuDono(s); }

window.NFE_PERMISSAO_PURE = {
  perfilDe: perfilDe,
  ehAdminOuDono: ehAdminOuDono,
  podeEmitirNfe: podeEmitirNfe,
  podeEditarCaixaNfe: podeEditarCaixaNfe
};

if(typeof document === 'undefined') return;

function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function usuarioSessao(){
  var s = sess();
  if(!s || typeof db === 'undefined') return null;
  return (db.usuarios||[]).find(function(u){ return u && u.id === s.usuarioId; }) || {
    id: s.usuarioId, login: s.login, perfil: s.perfil, podeEmitirNfe: false
  };
}
function avisar(msg){
  if(typeof window.lfbAlert === 'function') window.lfbAlert(msg, 'NF-e');
  else if(typeof toast === 'function') toast(msg, 'error');
}

window.usuarioPodeEmitirNfe = function(){
  return podeEmitirNfe(usuarioSessao());
};

window.alternarPodeEmitirNfe = function(id, marcado){
  var s = sess();
  if(!podeEditarCaixaNfe(s)){
    avisar('Somente Admin ou Dono altera quem emite NF.');
    if(typeof renderUsuarios === 'function') renderUsuarios();
    return;
  }
  var u = (db.usuarios||[]).find(function(x){ return x && x.id === id; });
  if(!u) return;
  u.podeEmitirNfe = !!marcado;
  u.atualizadoEm = new Date().toISOString();
  if(typeof saveDB === 'function') saveDB();
  if(typeof toast === 'function') toast(u.podeEmitirNfe ? 'Pode emitir NF' : 'Não emite NF', 'success');
};

if(typeof window.renderUsuarios === 'function' && !window.renderUsuarios.__v52221nfe){
  var oldRU = window.renderUsuarios;
  window.renderUsuarios = function(){
    var r = oldRU.apply(this, arguments);
    setTimeout(injetarCaixas, 30);
    return r;
  };
  window.renderUsuarios.__v52221nfe = true;
}

function injetarCaixas(){
  var view = document.getElementById('view-usuarios');
  if(!view) return;
  var s = sess();
  var edita = podeEditarCaixaNfe(s);
  var table = view.querySelector('table');
  if(!table) return;
  var thead = table.querySelector('thead tr');
  if(thead && !thead.querySelector('[data-nfe-col]')){
    var th = document.createElement('th');
    th.setAttribute('data-nfe-col','1');
    th.textContent = 'Emitir NF';
    var last = thead.lastElementChild;
    if(last) thead.insertBefore(th, last);
    else thead.appendChild(th);
  }
  var usuarios = (typeof db !== 'undefined' && db.usuarios) ? db.usuarios : [];
  var rows = table.querySelectorAll('tbody tr');
  rows.forEach(function(tr){
    if(tr.querySelector('[data-nfe-cell]')) return;
    var loginCell = tr.children[1];
    var login = fold(loginCell && loginCell.textContent);
    if(!login || login === '—') return;
    var u = usuarios.find(function(x){ return fold(x.login) === login; });
    if(!u) return;
    var td = document.createElement('td');
    td.setAttribute('data-nfe-cell','1');
    var ck = document.createElement('input');
    ck.type = 'checkbox';
    ck.className = 'w-4 h-4';
    ck.checked = !!u.podeEmitirNfe;
    ck.disabled = !edita;
    ck.title = edita ? 'Marque quem pode emitir NF' : 'Somente Admin ou Dono altera';
    ck.onchange = function(){ window.alternarPodeEmitirNfe(u.id, ck.checked); };
    td.appendChild(ck);
    var acoes = tr.lastElementChild;
    if(acoes) tr.insertBefore(td, acoes);
    else tr.appendChild(td);
  });
}

if(typeof window.conferirNfe === 'function' && !window.conferirNfe.__v52221perm){
  var oldConf = window.conferirNfe;
  window.conferirNfe = async function(){
    if(!window.usuarioPodeEmitirNfe()){
      avisar('Este usuário não está autorizado a emitir NF. Peça para Admin ou Dono marcar a caixa em Usuários.');
      return;
    }
    return oldConf.apply(this, arguments);
  };
  window.conferirNfe.__v52221perm = true;
}

setTimeout(injetarCaixas, 800);
console.log('[DIGICOPY] v5.22.21 permissão de emitir NF');
})();
