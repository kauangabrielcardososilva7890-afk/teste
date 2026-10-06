// ═══════════════════════════════════════════════════════════════════════════
// v5.22.25 — Nesta importação, produto com DEL = S não entra
// • Só DEL. OCULTAR não decide.
// • Não vira regra do cadastro novo.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function ehDel(row){
  if(!row || typeof row!=='object') return false;
  var d = row.DEL!=null ? row.DEL : row.del;
  if(d===true || d===1) return true;
  var t = txt(d).toUpperCase();
  return t==='S' || t==='SIM' || t==='1' || t==='TRUE';
}
function linhasSemDel(rows){
  return (rows||[]).filter(function(r){ return !ehDel(r); });
}

window.IMPORT_DEL_PURE = {
  ehDel: ehDel,
  linhasSemDel: linhasSemDel
};

if(window.IMPORT_PRODUTOS_PURE && !window.IMPORT_PRODUTOS_PURE.ehDel){
  window.IMPORT_PRODUTOS_PURE.ehDel = ehDel;
  window.IMPORT_PRODUTOS_PURE.linhasSemDel = linhasSemDel;
}

console.log('[DIGICOPY] v5.22.25 importação pula DEL=S');
})();
