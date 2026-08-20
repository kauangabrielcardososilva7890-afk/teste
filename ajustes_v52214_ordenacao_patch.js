// ═══════════════════════════════════════════════════════════════════════════
// v5.22.14 — Ordenação dos títulos: um sentido não trava; sem duas setas
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function proximaDir(atualCol, atualDir, col){
  if(atualCol===col && atualDir==='asc') return 'desc';
  return 'asc';
}

window.ORDENACAO_TITULO_PURE = { proximaDir: proximaDir };

if(typeof document==='undefined') return;

function aplicarDirVisual(root, dir){
  if(!root) return;
  root.querySelectorAll('thead th').forEach(function(th){
    th.querySelectorAll('.hs-arrow').forEach(function(a){ a.remove(); });
    var html = th.innerHTML;
    if(dir==='desc') th.innerHTML = html.replace(/ ▲/g,' ▼');
    else th.innerHTML = html.replace(/ ▼/g,' ▲');
  });
  if(dir!=='desc') return;
  var tb = root.querySelector('tbody');
  if(!tb || tb.rows.length<2) return;
  Array.from(tb.rows).reverse().forEach(function(r){ tb.appendChild(r); });
}

function wrapSort(nome, pegarEstado, seletor){
  var orig = window[nome];
  if(typeof orig!=='function' || orig.__v52214sort) return;
  window[nome] = function(col){
    var st = pegarEstado();
    if(!st) return orig.apply(this, arguments);
    st.dir = proximaDir(st.sort||st.col, st.dir||'asc', col);
    var r = orig.apply(this, arguments);
    var sel = typeof seletor==='function' ? seletor.apply(this, arguments) : seletor;
    setTimeout(function(){
      var root = sel ? document.querySelector(sel) : null;
      aplicarDirVisual(root, st.dir);
    }, 0);
    return r;
  };
  window[nome].__v52214sort = true;
}

function kauan(){ return window.__KAUAN_STATE__ || (window.__KAUAN_STATE__ = {}); }

wrapSort('produtosSortOperacional', function(){
  var st = kauan();
  st.prod = st.prod || { sort:'codigo', dir:'asc' };
  return st.prod;
}, '#view-produtos');

wrapSort('contratosSortOperacional', function(){
  var st = kauan();
  st.ctr = st.ctr || { sort:'codigo', dir:'asc' };
  return st.ctr;
}, '#view-contratos');

wrapSort('chamadosSortOperacional', function(){
  var st = kauan();
  st.chamados = st.chamados || { sort:'codigo', dir:'asc' };
  return st.chamados;
}, '#modal-body');

wrapSort('contratosFinalSort', function(){
  return window.__CONTRATOS_FINAL_STATE__ || (window.__CONTRATOS_FINAL_STATE__ = { sort:'codigo', dir:'asc' });
}, '#view-contratos');

wrapSort('contratosSortRefino', function(){
  var st = window.__CONTRATOS_REFINO_STATE__ || window.__KAUAN_STATE__ || {};
  return st;
}, '#view-contratos');

wrapSort('chamadosSortRefino', function(){
  var st = window.__CONTRATOS_REFINO_STATE__ || window.__KAUAN_STATE__ || {};
  return st;
}, '#modal-body');

console.log('[DIGICOPY] v5.22.14 ordenação: A→Z e Z→A, uma seta');
})();
