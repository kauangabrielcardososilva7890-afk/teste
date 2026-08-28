// ═══════════════════════════════════════════════════════════════════════════
// v5.22.43 — Sort dos contratos pelos títulos: 1º A→Z, 2º Z→A, uma seta.
//            Ordena as linhas pelo texto da coluna. Não inverte tbody
//            (isso piscava e desfazia o 2º clique).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var COL = { codigo:1, cliente:2, inicio:3, fim:4, impressoras:5, chamados:6, valor:7, status:8 };

function proximaDir(atualCol, atualDir, col){
  if(atualCol===col && atualDir==='asc') return 'desc';
  return 'asc';
}
function cmpVal(a,b){
  var A = String(a==null?'':a).trim();
  var B = String(b==null?'':b).trim();
  var AN = Number(String(A).replace(/[R$\s.]/g,'').replace(',','.'));
  var BN = Number(String(B).replace(/[R$\s.]/g,'').replace(',','.'));
  var numA = A!=='' && isFinite(AN) && /^-?[0-9.,]+$/.test(A.replace(/\s/g,'').replace('R$',''));
  var numB = B!=='' && isFinite(BN) && /^-?[0-9.,]+$/.test(B.replace(/\s/g,'').replace('R$',''));
  if(numA && numB) return AN-BN;
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

window.CONTRATOS_SORT_V52243_PURE = { proximaDir: proximaDir, cmpVal: cmpVal, ordenarLista: ordenarLista, COL: COL };

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

function ordenarTbody(){
  var st = stFinal();
  var view = document.getElementById('view-contratos');
  if(!view || view.classList.contains('hidden')) return;
  var tb = view.querySelector('tbody');
  if(!tb || tb.rows.length<2){ pintarSetas(view, st.sort||'codigo', st.dir||'asc'); return; }
  var idx = COL[st.sort] != null ? COL[st.sort] : 1;
  var rows = Array.from(tb.rows).filter(function(r){ return r.cells && r.cells.length>2; });
  rows.sort(function(a,b){
    var ta = a.cells[idx] ? a.cells[idx].innerText : '';
    var tb2 = b.cells[idx] ? b.cells[idx].innerText : '';
    var r = cmpVal(ta, tb2);
    return (st.dir||'asc')==='desc' ? -r : r;
  });
  rows.forEach(function(row){ tb.appendChild(row); });
  pintarSetas(view, st.sort||'codigo', st.dir||'asc');
}

window.contratosFinalSort = function(col){
  var st = stFinal();
  st.dir = proximaDir(st.sort, st.dir||'asc', col);
  st.sort = col;
  var rf = stRefino();
  rf.contratoSort = col;
  rf.contratoDir = st.dir;
  if(typeof window.renderContratos==='function') window.renderContratos();
};
window.contratosFinalSort.__v52214sort = true;
window.contratosFinalSort.__v52242sort = true;
window.contratosFinalSort.__v52243sort = true;

window.contratosSortRefino = function(col){
  window.contratosFinalSort(col);
};
window.contratosSortRefino.__v52214sort = true;
window.contratosSortRefino.__v52242sort = true;
window.contratosSortRefino.__v52243sort = true;

if(typeof window.renderContratos==='function' && !window.renderContratos.__v52243sort){
  var oldR = window.renderContratos;
  window.renderContratos = function(){
    var r = oldR.apply(this, arguments);
    try{ ordenarTbody(); }catch(e){}
    return r;
  };
  window.renderContratos.__v52243sort = true;
}

console.log('[DIGICOPY] v5.22.43 contratos: sort A→Z / Z→A sem piscar');
})();
