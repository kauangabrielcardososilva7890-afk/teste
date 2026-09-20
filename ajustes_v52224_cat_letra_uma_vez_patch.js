// ═══════════════════════════════════════════════════════════════════════════
// v5.22.24 — Correção pontual: P/S/I/C/E só no dado já importado, uma vez
// • Não envolve unificaCat / categoriaUnificada (não vira regra).
// • Chip, Original e o resto não mexem.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var FLAG = 'correcaoCatLetraUmaVez';

function letraApi(){
  return (typeof window!=='undefined' && window.CAT_LETRA_PURE) ? window.CAT_LETRA_PURE : null;
}
function ehLetraFiltro(v){
  var api = letraApi();
  if(api && typeof api.ehLetraFiltro==='function') return api.ehLetraFiltro(v);
  var t = String(v==null?'':v).trim();
  return t.length===1 && /[psice]/i.test(t);
}
function letraParaNome(v){
  var api = letraApi();
  if(api && typeof api.letraParaNome==='function') return api.letraParaNome(v);
  return String(v==null?'':v).trim();
}

function corrigirProdutosUmaVez(produtos){
  var n = 0;
  (produtos||[]).forEach(function(p){
    if(!p || !ehLetraFiltro(p.categoria)) return;
    p.categoria = letraParaNome(p.categoria);
    n++;
  });
  return n;
}

function jaFez(){
  return !!(typeof db!=='undefined' && db.config && db.config[FLAG]);
}

function marcar(n){
  if(typeof db==='undefined') return;
  db.config = db.config || {};
  db.config[FLAG] = { em: new Date().toISOString(), n: n };
}

function aplicarUmaVez(){
  if(typeof db==='undefined' || !Array.isArray(db.produtos)) return 0;
  if(!db.produtos.length) return 0;
  if(jaFez()) return 0;
  var n = corrigirProdutosUmaVez(db.produtos);
  marcar(n);
  if(typeof saveDB==='function') saveDB();
  return n;
}

window.CAT_LETRA_UMA_VEZ_PURE = {
  FLAG: FLAG,
  corrigirProdutosUmaVez: corrigirProdutosUmaVez,
  ehLetraFiltro: ehLetraFiltro
};

if(typeof document==='undefined') return;

function tentar(){
  try{ aplicarUmaVez(); }catch(e){}
}

if(typeof window.renderProdutos==='function' && !window.renderProdutos.__v52224letra){
  var old = window.renderProdutos;
  window.renderProdutos = function(){
    tentar();
    return old.apply(this, arguments);
  };
  window.renderProdutos.__v52224letra = true;
}

setTimeout(tentar, 600);
setTimeout(tentar, 1800);
console.log('[DIGICOPY] v5.22.24 letra no produto: uma vez, sem regra');
})();
