// ═══════════════════════════════════════════════════════════════════════════
// v5.22.42 — Sort dos contratos: 1º clique A→Z, 2º Z→A. Uma seta.
//            Ordena no dado. NÃO inverte tbody (isso piscava e voltava).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function proximaDir(atualCol, atualDir, col){
  if(atualCol===col && atualDir==='asc') return 'desc';
  return 'asc';
}
function cmpVal(a,b){
  var A = String(a==null?'':a).trim();
  var B = String(b==null?'':b).trim();
  var AN = Number(String(A).replace(',','.'));
  var BN = Number(String(B).replace(',','.'));
  if(A!=='' && B!=='' && isFinite(AN) && isFinite(BN) && /^-?[\d.,]+$/.test(A) && /^-?[\d.,]+$/.test(B)) return AN-BN;
  return A.localeCompare(B, 'pt-BR', { numeric:true, sensitivity:'base' });
}
function ordenarLista(lista, getter, dir){
  var arr = (lista||[]).slice();
  arr.sort(function(a,b){
    var r = cmpVal(getter(a), getter(b));
    return dir==='desc' ? -r : r;
  });
  return arr;
}

window.CONTRATOS_SORT_V52242_PURE = {
  proximaDir: proximaDir,
  cmpVal: cmpVal,
  ordenarLista: ordenarLista
};

if(typeof document==='undefined') return;

function stFinal(){
  return window.__CONTRATOS_FINAL_STATE__ || (window.__CONTRATOS_FINAL_STATE__ = { busca:'', status:'', sort:'codigo', dir:'asc' });
}
function stRefino(){
  return window.__KAUAN_REFINO_STATE__ || (window.__KAUAN_REFINO_STATE__ = { contratoSort:'codigo', contratoDir:'asc' });
}

function pintarSetas(root, col, dir){
  if(!root) return;
  root.querySelectorAll('thead th').forEach(function(th){
    var html = th.innerHTML.replace(/\s*[▲▼]/g,'');
    var oc = th.getAttribute('onclick')||'';
    var m = oc.match(/contratos(?:FinalSort|SortRefino)\('([^']+)'\)/);
    if(m && m[1]===col) html += dir==='desc' ? ' ▼' : ' ▲';
    th.innerHTML = html;
  });
}

window.contratosFinalSort = function(col){
  var st = stFinal();
  st.dir = proximaDir(st.sort, st.dir||'asc', col);
  st.sort = col;
  if(typeof window.renderContratos==='function') window.renderContratos();
};
window.contratosFinalSort.__v52214sort = true;
window.contratosFinalSort.__v52242sort = true;

window.contratosSortRefino = function(col){
  var st = stRefino();
  st.contratoDir = proximaDir(st.contratoSort, st.contratoDir||'asc', col);
  st.contratoSort = col;
  var stF = stFinal();
  stF.sort = col;
  stF.dir = st.contratoDir;
  if(typeof window.renderContratos==='function') window.renderContratos();
};
window.contratosSortRefino.__v52214sort = true;
window.contratosSortRefino.__v52242sort = true;

if(typeof window.renderContratos==='function' && !window.renderContratos.__v52242sort){
  var oldR = window.renderContratos;
  window.renderContratos = function(){
    var r = oldR.apply(this, arguments);
    try{
      var st = stFinal();
      var view = document.getElementById('view-contratos');
      if(!view) return r;
      pintarSetas(view, st.sort||'codigo', st.dir||'asc');
      if((st.dir||'asc')==='desc'){
        var tb = view.querySelector('tbody');
        if(tb && tb.rows.length>1){
          Array.from(tb.rows).reverse().forEach(function(row){ tb.appendChild(row); });
        }
      }
    }catch(e){}
    return r;
  };
  window.renderContratos.__v52242sort = true;
}

console.log('[DIGICOPY] v5.22.42 contratos: sort A→Z / Z→A sem piscar');
})();
