// PATCH v5.17.8 — Tirar peça de verdade; assinaturas no fim do A4
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb===undefined?0:fb); }
function dia(v){ return String(v||'').slice(0,10); }
function dataBR(v){ const s=dia(v); if(!s) return ''; const p=s.split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,'Aviso'); }
function confirmar(m,t){ return typeof window.confirmSistema==='function'?window.confirmSistema(m,t||'Confirmar'):Promise.resolve(true); }
function logoSrc(){ return window.DIGICOPY_LOGO||'./logo.png'; }
function temColor(p){
  const m=(p&&(p.medidoresConfig||p.medidores))||{};
  return !!(m.colorA4&&m.colorA4.modalidade&&m.colorA4.modalidade!=='inativo')
      || !!(m.colorA3&&m.colorA3.modalidade&&m.colorA3.modalidade!=='inativo');
}

window.lcRenderPecas=function(prefix){
  const cont=document.getElementById(prefix+'-pecas-list'); if(!cont) return;
  const itens=window.__chamadoPecasTemp||[];
  cont.innerHTML=itens.map((it,i)=>{
    const p=(db.produtos||[]).find(x=>x.id===it.produtoId)||{};
    return `<div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border text-[12px]">
      <div><b>${esc(p.nome||it.descricao||'')}</b><p class="text-[11px] text-slate-500">${esc(p.sku||'')} • qtd ${it.qtd}</p></div>
      <button type="button" data-lc-del="${prefix}:${i}" class="lc-peca-del h-8 px-3 rounded-lg bg-red-50 text-red-700 font-bold">Tirar</button>
    </div>`;
  }).join('')||'<p class="text-[12px] text-slate-400 text-center py-2">Nenhum produto lançado</p>';
};

window.lcRemoverPeca=function(prefix,idx,ev){
  if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
  if(window.__lcDelLock) return Promise.resolve();
  window.__lcDelLock=true;
  return confirmar('Deseja remover esse item?','Remover produto').then(ok=>{
    if(ok){
      (window.__chamadoPecasTemp||[]).splice(Number(idx),1);
      window.lcRenderPecas(prefix);
    }
  }).finally(()=>{ window.__lcDelLock=false; });
};

if(typeof window.renderPecasChamado==='function' && !window.renderPecasChamado.__v5178){
  const _rp=window.renderPecasChamado;
  window.renderPecasChamado=function(){
    const ko=document.getElementById('ko-pecas-list');
    const ca=document.getElementById('ca-pecas-list');
    if(ko) window.lcRenderPecas('ko');
    if(ca) window.lcRenderPecas('ca');
    if(!ko && !ca) return _rp.apply(this,arguments);
  };
  window.renderPecasChamado.__v5178=true;
}

function delFromEvent(ev){
  const btn=ev.target&&ev.target.closest&&ev.target.closest('.lc-peca-del,[data-lc-del]');
  if(!btn) return false;
  ev.preventDefault();
  ev.stopPropagation();
  if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
  const raw=btn.getAttribute('data-lc-del')||'';
  const parts=raw.split(':');
  const prefix=parts[0]||(document.getElementById('ca-pecas-list')?'ca':'ko');
  const idx=parts[1]!=null?parts[1]:0;
  window.lcRemoverPeca(prefix,idx,ev);
  return true;
}

document.addEventListener('mousedown', delFromEvent, true);
document.addEventListener('click', delFromEvent, true);
document.addEventListener('pointerdown', delFromEvent, true);

// PDF: página A4, assinaturas coladas no rodapé da folha

console.log('[DIGICOPY] ajustes_v5178_patch.js');
})();
