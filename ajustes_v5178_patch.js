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
window.imprimirChamadoPDF=function(osId){
  const o=(db.os||[]).find(x=>x.id===osId);
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  const cl=(db.clientes||[]).find(c=>c.id===o.clienteId)||{};
  const s=sess()||{};
  const emp=(db.empresas||[]).find(e=>e.id===s.empresaId)||{};
  const cfg=(db.config&&db.config.empresa)||{};
  const fin=o.status==='concluido';
  const p=(db.parque||[]).find(x=>x.equipamentoId===o.equipamentoId);
  const showColor=!o.contratoId||temColor(p);
  const pecas=Array.isArray(o.pecas)&&o.pecas.length?o.pecas.map(it=>({d:it.descricao||'',q:it.qtd||''})):[];
  while(pecas.length<5) pecas.push({d:'',q:''});
  const cell=(x)=>fin?esc(x==null||x===''?'':x):'';
  const linha='<span style="display:inline-block;border-bottom:1px solid #111;min-width:170px;height:20px;vertical-align:bottom">&nbsp;</span>';
  const linhaVal=function(v){
    const t=v==null||v===''?'':String(v);
    return '<span style="display:inline-block;border-bottom:1px solid #111;min-width:170px;height:20px;vertical-align:bottom;padding:0 6px">'+esc(t)+'</span>';
  };
  const dataCad=dataBR(o.criadoEm||o.dataAbertura);
  const dataAt=fin&&o.dataAtendimento?dataBR(o.dataAtendimento):'&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    @page{size:A4;margin:12mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#111;font-size:12px}
    .page{min-height:273mm;display:flex;flex-direction:column;box-sizing:border-box}
    .head{display:flex;gap:14px;align-items:center;padding-bottom:12px;border-bottom:3px solid #0a1e8a}
    .head img{height:58px}.head h1{margin:0;color:#0a1e8a;font-size:20px}
    .muted{color:#64748b;font-size:11px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
    .card{border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;background:#f8fafc}
    .faixa{background:#0a1e8a!important;color:#fff!important;text-align:center;font-weight:800;padding:8px;margin:14px 0 6px;border-radius:8px}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #cbd5e1;padding:8px}
    th{background:#eef2ff!important;color:#0a1e8a}
    .box-write{border:1px solid #94a3b8;border-radius:10px;min-height:88px;padding:10px 12px;
      background-image:repeating-linear-gradient(#fff 0 23px,#cbd5e1 23px 24px)}
    .rodape{margin-top:22px;line-height:2.2;font-size:14px}
    .foot{margin-top:auto;padding-top:48px}
    .assin{display:flex;justify-content:space-between;gap:64px;padding-bottom:8px}
    .assin div{flex:1;text-align:center;border-top:1px solid #111;padding-top:8px}
    @media print{.no-print{display:none!important}.page{min-height:273mm}}
  </style></head><body>
  <div class="no-print" style="padding:8px"><button onclick="window.print()">Imprimir</button></div>
  <div class="page">
  <div class="head"><img src="${logoSrc()}"><div><h1>${esc(emp.fantasia||'DIGICOPY')}</h1><div class="muted">${esc(emp.nome||cfg.nome||'')}</div><div class="muted">${esc(emp.cnpj||s.cnpj||'')}</div></div>
    <div style="margin-left:auto;text-align:right"><b>OS ${esc(o.numero||'')}</b></div></div>
  <div class="cards">
    <div class="card"><div class="muted">CLIENTE</div><b>${esc(cl.nome||'')}</b><div class="muted">${esc(cl.documento||'')} • ${esc(cl.telefone||'')}</div></div>
    <div class="card"><div class="muted">ATENDIMENTO</div>
      <div>Técnico: <b>${esc(o.tecnico||'')}</b></div>
      <div>Motivo / Defeito: <b>${esc(o.descricao||'')}</b></div>
      <div class="muted">Data de cadastro: ${esc(dataCad)}</div>
    </div>
  </div>
  <div class="faixa">SERVIÇOS EXECUTADOS</div>
  <div class="box-write">${cell(o.servicos)}</div>
  <div class="faixa">PRODUTOS / PEÇAS USADAS</div>
  <table><thead><tr><th style="width:78%">Descrição</th><th>Quantidade</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(it=>`<tr><td>${fin?esc(it.d):''}&nbsp;</td><td>${fin?esc(it.q):''}&nbsp;</td></tr>`).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="box-write">${cell(o.observacao)}</div>
  <p class="rodape">
    <b>Data do atendimento:</b> <span style="border-bottom:1px solid #111;min-width:120px;display:inline-block;text-align:center">${dataAt}</span>
    &nbsp;&nbsp;&nbsp;<b>Contador preto:</b> ${fin?linhaVal(o.contadorAtual):linha}
    ${showColor?'&nbsp;&nbsp;&nbsp;<b>Contador color:</b> '+(fin?linhaVal(o.contadorColor):linha):''}
  </p>
  <div class="foot">
    <div class="assin">
      <div>Assinatura do técnico</div>
      <div>Assinatura do cliente</div>
    </div>
  </div>
  </div>
  </body></html>`;
  const w=window.open('','_blank'); if(w){ w.document.write(html); w.document.close(); }
};

console.log('[DIGICOPY] ajustes_v5178_patch.js');
})();
