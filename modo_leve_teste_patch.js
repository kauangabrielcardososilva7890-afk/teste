// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.41 — Modo leve de teste
// • Evita travamento no GitHack/PC fraco desligando automações pesadas automáticas
// • Mantém dados de teste locais para validar telas sem depender da nuvem
// • Remove a área de importar banco da navegação/scroll do uso diário
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
const MODO_LEVE_ATIVO = (typeof location!=='undefined' && /[?&]leve=1\b/.test(location.search||'')) || (()=>{ try{return localStorage.getItem('digicopy_modo_leve')==='1'||localStorage.getItem('digicopy_modo_apresentacao')==='1';}catch(e){return false;} })();
if(MODO_LEVE_ATIVO){
  window.DIGI_MODO_LEVE = true;
  try{ localStorage.setItem('digicopy_erp_autosync','0'); }catch(e){}
}
function limparAreaBanco(){
  if(typeof document==='undefined') return;
  const banco=document.getElementById('view-banco');
  if(banco){ banco.classList.add('hidden'); banco.style.display='none'; banco.innerHTML=''; }
  document.querySelectorAll('[data-nav="banco"]').forEach(e=>e.remove());
  [...document.querySelectorAll('button')].forEach(b=>{
    const t=(b.textContent||'').toLowerCase();
    if(t.includes('importar arquivos')||t.includes('backup / migração')||t.includes('backup / migracao')) b.remove();
  });
}
function reforcarDemoSeVazio(){
  if(typeof db==='undefined'||!db) return 0;
  const total=['clientes','produtos','equipamentos','contratos','parque','leituras','os','vendas','contasReceber','contasPagar'].reduce((s,k)=>s+((db[k]||[]).length),0);
  if(total>20) return 0;
  if(typeof seedData==='function'){
    try{ seedData(true); return 1; }catch(e){ console.warn('[DIGICOPY] seed demo falhou',e); }
  }
  return 0;
}
window.MODO_LEVE_TESTE_PURE={ reforcarDemoSeVazio };
if(!MODO_LEVE_ATIVO){ console.log('[DIGICOPY] modo_leve_teste_patch.js v4.9.41 inativo'); return; }
if(typeof document==='undefined') return;
const oldBuildNav=window.buildNav;
if(typeof oldBuildNav==='function'&&!oldBuildNav.__modoLeveTeste){
  window.buildNav=function(){ const ret=oldBuildNav.apply(this,arguments); setTimeout(limparAreaBanco,0); return ret; };
  window.buildNav.__modoLeveTeste=true;
}
const oldShowApp=window.showApp;
if(typeof oldShowApp==='function'&&!oldShowApp.__modoLeveTeste){
  window.showApp=function(){ reforcarDemoSeVazio(); const ret=oldShowApp.apply(this,arguments); setTimeout(limparAreaBanco,100); return ret; };
  window.showApp.__modoLeveTeste=true;
}
setTimeout(()=>{ reforcarDemoSeVazio(); limparAreaBanco(); },500);
setInterval(limparAreaBanco,3000);
console.log('[DIGICOPY] modo_leve_teste_patch.js v4.9.41 carregado');
})();
