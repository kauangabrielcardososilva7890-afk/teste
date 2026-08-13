// PATCH v5.17.7 — peças: lupa/Enter; remover com aviso; 2.1 só contrato; PDF
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
function txt(v){ return String(v??'').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb===undefined?0:fb); }
function dia(v){ return String(v||'').slice(0,10); }
function dataBR(v){ const s=dia(v); if(!s) return ''; const p=s.split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,'Aviso'); }
function confirmar(m,t){ return typeof window.confirmSistema==='function'?window.confirmSistema(m,t||'Confirmar'):Promise.resolve(false); }
function logoSrc(){ return window.DIGICOPY_LOGO||'./logo.png'; }
function temColor(p){
  const m=(p&&(p.medidoresConfig||p.medidores))||{};
  return !!(m.colorA4&&m.colorA4.modalidade&&m.colorA4.modalidade!=='inativo')
      || !!(m.colorA3&&m.colorA3.modalidade&&m.colorA3.modalidade!=='inativo');
}

function htmlPecasLupa(prefix){
  return `<div class="rounded-xl border p-3 bg-slate-50" id="${prefix}-pecas-box">
    <p class="font-bold text-slate-700 mb-2">Produtos / Peças usadas</p>
    <div class="flex gap-2 mb-2">
      <input id="${prefix}-prod-search" class="flex-1 h-11 px-3 rounded-xl border bg-white" placeholder="Nome, código ou ref. — Enter ou lupa" autocomplete="off">
      <button type="button" id="${prefix}-prod-lupa" class="h-11 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold" title="Buscar"><i class="ph ph-magnifying-glass"></i></button>
    </div>
    <div id="${prefix}-prod-results" class="hidden max-h-[220px] overflow-auto rounded-xl border bg-white mb-2"></div>
    <div class="grid grid-cols-12 gap-2">
      <input id="${prefix}-prod-qtd" type="number" value="1" min="1" class="col-span-3 h-10 px-3 rounded-xl border bg-white" placeholder="Qtd">
      <p class="col-span-9 text-[11px] text-slate-500 self-center">Busca só na lupa ou Enter. Clique no item para lançar.</p>
    </div>
    <div id="${prefix}-pecas-list" class="mt-3 space-y-2"></div>
  </div>`;
}

function bindPecas(prefix){
  const box=document.getElementById(prefix+'-pecas-box');
  if(!box) return;
  if(!document.getElementById(prefix+'-prod-lupa')){
    const old=document.getElementById(prefix+'-prod-search');
    const wrap=document.createElement('div');
    wrap.innerHTML=htmlPecasLupa(prefix);
    box.replaceWith(wrap.firstChild);
    if(typeof window.lcRenderPecas==='function') window.lcRenderPecas(prefix);
  }
  const inp=document.getElementById(prefix+'-prod-search');
  const lupa=document.getElementById(prefix+'-prod-lupa');
  if(inp){
    inp.removeAttribute('oninput');
    inp.oninput=null;
    inp.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); window.lcBuscarPeca(prefix); } };
  }
  if(lupa) lupa.onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); window.lcBuscarPeca(prefix); };
}

window.lcBuscarPeca=function(prefix){
  // assinatura antiga: lcBuscarPeca(prefix, this.value) no oninput — ignora
  if(arguments.length>1) return;
  const inp=document.getElementById(prefix+'-prod-search');
  const res=document.getElementById(prefix+'-prod-results');
  if(!res) return;
  const q=low(inp&&inp.value);
  if(!q){ res.classList.add('hidden'); res.innerHTML=''; aviso('Digite algo e clique na lupa (ou Enter).'); return; }
  const s=sess();
  let lista=(db.produtos||[]).filter(p=>(!s||p.empresaId===s.empresaId)&&p.status!=='inativo'&&p.status!=='excluido');
  lista=lista.filter(p=>[p.nome,p.sku,p.codigo,p.categoria,p.fabricante].some(v=>low(v).includes(q))).slice(0,20);
  if(!lista.length){ res.innerHTML='<p class="p-3 text-[12px] text-slate-400">Nenhum item</p>'; res.classList.remove('hidden'); return; }
  res.innerHTML=lista.map(p=>`<div class="px-3 py-2 border-b hover:bg-blue-50 cursor-pointer" onmousedown="event.preventDefault();event.stopPropagation();lcAddPeca('${prefix}','${p.id}')"><b>${esc(p.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(p.sku||p.codigo||'')} • ${typeof fmtMoney==='function'?fmtMoney(p.preco||0):p.preco}</span></div>`).join('');
  res.classList.remove('hidden');
};

window.lcAddPeca=function(prefix,prodId){
  const p=(db.produtos||[]).find(x=>x.id===prodId);
  if(!p){ aviso('Produto não encontrado'); return; }
  const qtd=Math.max(1,n(document.getElementById(prefix+'-prod-qtd')?.value,1));
  window.__chamadoPecasTemp=window.__chamadoPecasTemp||[];
  const ex=window.__chamadoPecasTemp.find(i=>i.produtoId===prodId);
  if(ex){ ex.qtd+=qtd; ex.subtotal=ex.qtd*n(ex.preco); }
  else window.__chamadoPecasTemp.push({produtoId:prodId,descricao:p.nome,qtd,preco:n(p.preco),subtotal:qtd*n(p.preco)});
  if(typeof window.lcRenderPecas==='function') window.lcRenderPecas(prefix);
  const res=document.getElementById(prefix+'-prod-results'); if(res){ res.classList.add('hidden'); res.innerHTML=''; }
  const inp=document.getElementById(prefix+'-prod-search'); if(inp) inp.value='';
};

window.lcRemoverPeca=function(prefix,idx,ev){
  if(ev){ ev.preventDefault(); ev.stopPropagation(); }
  confirmar('Deseja remover esse item?','Remover produto').then(ok=>{
    if(!ok) return;
    (window.__chamadoPecasTemp||[]).splice(idx,1);
    if(typeof window.lcRenderPecas==='function') window.lcRenderPecas(prefix);
  });
};

window.lcRenderPecas=function(prefix){
  const cont=document.getElementById(prefix+'-pecas-list'); if(!cont) return;
  const itens=window.__chamadoPecasTemp||[];
  cont.innerHTML=itens.map((it,i)=>{
    const p=(db.produtos||[]).find(x=>x.id===it.produtoId)||{};
    return `<div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border text-[12px]">
      <div><b>${esc(p.nome||it.descricao||'')}</b><p class="text-[11px] text-slate-500">${esc(p.sku||'')} • qtd ${it.qtd}</p></div>
      <button type="button" class="lc-peca-del h-8 px-3 rounded-lg bg-red-50 text-red-600 font-bold" onclick="lcRemoverPeca('${prefix}',${i},event)">Tirar</button>
    </div>`;
  }).join('')||'<p class="text-[12px] text-slate-400 text-center py-2">Nenhum produto lançado</p>';
};

// 2.1 antigo do último chamado SOMENTE no contrato
const _auto=window.autoPreencherDadosChamado;
if(typeof _auto==='function'){
  window.autoPreencherDadosChamado=function(equipId, manter, ignoreOsId){
    const r=_auto.apply(this,arguments);
    const cid=window.modalContext&&window.modalContext.contratoId;
    if(cid && typeof window.lcContadorAntigoChamado==='function' && equipId){
      const id=ignoreOsId|| (window.modalContext&&window.modalContext.id)||null;
      const ant=document.getElementById('ko-cont-ant');
      if(ant) ant.value=window.lcContadorAntigoChamado(equipId,false,id);
      const ca=document.getElementById('lc-cont-color-ant');
      if(ca) ca.value=window.lcContadorAntigoChamado(equipId,true,id);
    }
    return r;
  };
}

const _open=window.openModalChamadoCompleto;
if(typeof _open==='function'){
  window.openModalChamadoCompleto=function(){
    const r=_open.apply(this,arguments);
    setTimeout(()=>bindPecas('ko'),30);
    setTimeout(()=>bindPecas('ko'),120);
    return r;
  };
}
const _av=window.abrirChamadoAvulsoForm;
if(typeof _av==='function'){
  window.abrirChamadoAvulsoForm=function(){
    const r=_av.apply(this,arguments);
    setTimeout(()=>bindPecas('ca'),90);
    setTimeout(()=>bindPecas('ca'),200);
    return r;
  };
}

const mo=new MutationObserver(()=>{
  ['ko','ca'].forEach(prefix=>{
    const inp=document.getElementById(prefix+'-prod-search');
    if(inp && inp.getAttribute('oninput')){
      inp.removeAttribute('oninput');
      inp.oninput=null;
    }
    if(document.getElementById(prefix+'-pecas-box') && !document.getElementById(prefix+'-prod-lupa'))
      bindPecas(prefix);
  });
});
if(document.body) mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['oninput']});

// PDF: contadores em branco até finalizar; assinaturas afastadas
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
    @page{margin:12mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    body{font-family:Arial,sans-serif;margin:0;color:#111;font-size:12px}
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
    .rodape{margin-top:28px;line-height:2.2;font-size:14px}
    .assin{margin-top:88px;display:flex;justify-content:space-between;gap:56px}
    .assin div{flex:1;text-align:center;border-top:1px solid #111;padding-top:8px}
    @media print{.no-print{display:none!important}}
  </style></head><body>
  <div class="no-print"><button onclick="window.print()">Imprimir</button></div>
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
  <div class="assin">
    <div>Assinatura do técnico</div>
    <div>Assinatura do cliente</div>
  </div>
  </body></html>`;
  const w=window.open('','_blank'); if(w){ w.document.write(html); w.document.close(); }
};

console.log('[DIGICOPY] ajustes_v5177_patch.js');
})();
