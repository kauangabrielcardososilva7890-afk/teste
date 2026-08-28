// PATCH v5.17.0 / v5.22.14 — Ordenar históricos clicando no nome da coluna
// v5.22.14: não empilha seta extra em tabelas que já ordenam no título
(function(){
'use strict';

const SKIP = /pdf|a[cç][aã]o|excluir|sel\b|imprimir|^$/i;

function cellKey(td){
  if(!td) return '';
  return String(td.textContent||'').replace(/\s+/g,' ').trim();
}
function cmp(a,b){
  const an=Number(String(a).replace(/[^\d,.-]/g,'').replace(',','.'));
  const bn=Number(String(b).replace(/[^\d,.-]/g,'').replace(',','.'));
  if(Number.isFinite(an)&&Number.isFinite(bn)&&/[0-9]/.test(a)&&/[0-9]/.test(b)) return an-bn;
  return String(a).localeCompare(String(b),'pt-BR',{numeric:true,sensitivity:'base'});
}

function thJaOrdena(th){
  if(!th) return false;
  if(th.getAttribute('onclick')) return true;
  const t=String(th.textContent||'');
  if(/[▲▼↕]/.test(t)) return true;
  if(th.querySelector('.hs-arrow')) return true;
  return false;
}

function bindTable(table){
  if(!table || table.__hsSort) return;
  const thead=table.tHead || table.querySelector('thead');
  if(!thead) return;
  const ths=Array.from(thead.querySelectorAll('th'));
  if(!ths.length) return;
  if(ths.some(thJaOrdena)){
    table.__hsSort='skip';
    return;
  }
  table.__hsSort=true;
  ths.forEach((th, idx)=>{
    const label=(th.textContent||'').trim();
    if(SKIP.test(label)) return;
    th.style.cursor='pointer';
    th.title='Clique para ordenar';
    th.addEventListener('click', function(ev){
      ev.stopImmediatePropagation();
      const tbody=table.tBodies[0]; if(!tbody) return;
      const rows=Array.from(tbody.rows);
      if(rows.length<2) return;
      const dir = th.dataset.hsDir==='asc' ? 'desc' : 'asc';
      ths.forEach(x=>{ x.dataset.hsDir=''; x.querySelectorAll('.hs-arrow').forEach(a=>a.remove()); });
      th.dataset.hsDir=dir;
      const mark=document.createElement('span');
      mark.className='hs-arrow';
      mark.textContent = dir==='asc' ? ' ▲' : ' ▼';
      th.appendChild(mark);
      rows.sort((ra,rb)=>{
        const c=cmp(cellKey(ra.cells[idx]), cellKey(rb.cells[idx]));
        return dir==='asc'?c:-c;
      });
      rows.forEach(r=>tbody.appendChild(r));
    });
  });
}

function scan(){
  document.querySelectorAll('table').forEach(bindTable);
}

try{
  const mo=new MutationObserver(()=>scan());
  mo.observe(document.body,{childList:true,subtree:true});
}catch(e){}
setTimeout(scan,400);
console.log('[DIGICOPY] historico_sort_patch.js v5.22.14 — uma seta só, dois sentidos');
})();
