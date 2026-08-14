// PATCH v5.18.2 — peças igual vendas; PDF só desc/qtd/valor; sem 1.2.1/1.2.2
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
function low(v){ return String(v??'').toLowerCase().trim(); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb===undefined?0:fb); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(n(v)):('R$ '+n(v).toFixed(2).replace('.',',')); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,'Aviso'); }
function logoSrc(){ return window.DIGICOPY_LOGO||'./logo.png'; }
function dia(v){ return String(v||'').slice(0,10); }
function dataBR(v){ const s=dia(v); if(!s) return ''; const p=s.split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s; }

function normItem(it){
  const qtd=Math.max(1,n(it.qtd,1));
  const preco=n(it.preco,0);
  const desconto=Math.max(0,n(it.desconto,0));
  return Object.assign({},it,{qtd,preco,desconto,subtotal:Math.max(0,qtd*preco-desconto)});
}

window.__lcPecaSel=null;

function htmlPecasVendas(prefix){
  return `<div class="rounded-xl border p-3 bg-[#f8f9ff]" id="${prefix}-pecas-box">
    <p class="font-bold text-slate-700 mb-2">Produtos / Peças usadas</p>
    <div class="grid grid-cols-12 gap-2 items-end">
      <label class="col-span-12 md:col-span-5 text-[11px] font-bold uppercase text-slate-500 relative">Descrição ou código
        <div class="flex gap-1 mt-1">
          <input id="${prefix}-prod-search" class="flex-1 h-10 px-3 rounded-xl border bg-white" placeholder="Nome, código, ref. — Enter ou lupa" autocomplete="off">
          <button type="button" id="${prefix}-prod-lupa" class="h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i></button>
        </div>
        <div id="${prefix}-prod-results" class="hidden absolute z-30 left-0 right-0 mt-1 max-h-[220px] overflow-auto rounded-xl border bg-white shadow-xl"></div>
      </label>
      <label class="col-span-3 md:col-span-1 text-[11px] font-bold uppercase text-slate-500">Qtd
        <input id="${prefix}-prod-qtd" type="number" min="1" value="1" oninput="lcPecaCalc('${prefix}')" class="mt-1 w-full h-10 px-2 rounded-xl border bg-white"></label>
      <label class="col-span-4 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Valor
        <input id="${prefix}-prod-preco" type="number" step="0.01" value="" oninput="lcPecaCalc('${prefix}')" class="mt-1 w-full h-10 px-2 rounded-xl border bg-white"></label>
      <label class="col-span-3 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Desc. R$
        <input id="${prefix}-prod-desc" type="number" step="0.01" value="0" oninput="lcPecaCalc('${prefix}')" class="mt-1 w-full h-10 px-2 rounded-xl border bg-white"></label>
      <label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Valor final
        <input id="${prefix}-prod-total" readonly class="mt-1 w-full h-10 px-2 rounded-xl border bg-slate-100 font-bold"></label>
    </div>
    <div class="flex justify-end mt-2">
      <button type="button" onclick="lcAddPecaManual('${prefix}')" class="h-10 px-5 rounded-xl bg-emerald-600 text-white font-bold">Adicionar item</button>
    </div>
    <div id="${prefix}-pecas-list" class="mt-3"></div>
  </div>`;
}

window.lcPecaCalc=function(prefix){
  const qtd=n(document.getElementById(prefix+'-prod-qtd')?.value,0);
  const vu=n(document.getElementById(prefix+'-prod-preco')?.value,0);
  const de=n(document.getElementById(prefix+'-prod-desc')?.value,0);
  const el=document.getElementById(prefix+'-prod-total');
  if(el) el.value=money(Math.max(0,qtd*vu-de));
};

window.lcBuscarPeca=function(prefix){
  if(arguments.length>1) return;
  const inp=document.getElementById(prefix+'-prod-search');
  const res=document.getElementById(prefix+'-prod-results');
  if(!res) return;
  const q=low(inp&&inp.value);
  if(!q){ res.classList.add('hidden'); res.innerHTML=''; return; }
  const s=sess();
  let lista=(db.produtos||[]).filter(p=>(!s||p.empresaId===s.empresaId)&&p.status!=='inativo'&&p.status!=='excluido');
  lista=lista.filter(p=>[p.nome,p.sku,p.codigo,p.categoria,p.fabricante].some(v=>low(v).includes(q))).slice(0,20);
  if(!lista.length){
    res.innerHTML='<p class="p-3 text-[12px] text-slate-400">Nenhum item — a descrição digitada pode ser usada no Adicionar</p>';
    res.classList.remove('hidden'); return;
  }
  res.innerHTML=lista.map(p=>`<div class="px-3 py-2 border-b hover:bg-blue-50 cursor-pointer" onmousedown="event.preventDefault();lcSelPeca('${prefix}','${p.id}')"><b>${esc(p.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(p.sku||p.codigo||'')} • est ${n(p.estoque)} • <b>${money(p.preco)}</b></span></div>`).join('');
  res.classList.remove('hidden');
};

window.lcSelPeca=function(prefix,prodId){
  const p=(db.produtos||[]).find(x=>x.id===prodId); if(!p) return;
  window.__lcPecaSel=p;
  const inp=document.getElementById(prefix+'-prod-search'); if(inp) inp.value=p.nome||'';
  const pr=document.getElementById(prefix+'-prod-preco'); if(pr) pr.value=p.preco||0;
  const res=document.getElementById(prefix+'-prod-results'); if(res){ res.classList.add('hidden'); res.innerHTML=''; }
  window.lcPecaCalc(prefix);
};

window.lcAddPecaManual=function(prefix){
  const desc=String(document.getElementById(prefix+'-prod-search')?.value||'').trim();
  const p=window.__lcPecaSel;
  if(!p && !desc){ aviso('Selecione um produto ou escreva a descrição'); return; }
  const qtd=Math.max(1,n(document.getElementById(prefix+'-prod-qtd')?.value,1));
  const preco=n(document.getElementById(prefix+'-prod-preco')?.value, p?n(p.preco):0);
  const desconto=Math.max(0,n(document.getElementById(prefix+'-prod-desc')?.value,0));
  window.__chamadoPecasTemp=window.__chamadoPecasTemp||[];
  window.__chamadoPecasTemp.push(normItem({
    produtoId:p?p.id:null,
    descricao:p?(p.nome||''):desc,
    qtd,preco,desconto
  }));
  window.__lcPecaSel=null;
  const inp=document.getElementById(prefix+'-prod-search'); if(inp) inp.value='';
  const q=document.getElementById(prefix+'-prod-qtd'); if(q) q.value=1;
  const pr=document.getElementById(prefix+'-prod-preco'); if(pr) pr.value='';
  const d=document.getElementById(prefix+'-prod-desc'); if(d) d.value=0;
  window.lcPecaCalc(prefix);
  window.lcRenderPecas(prefix);
};

window.lcAddPeca=function(prefix,prodId){
  window.lcSelPeca(prefix,prodId);
};

window.lcUpdPeca=function(prefix,idx,campo,val){
  const it=(window.__chamadoPecasTemp||[])[idx]; if(!it) return;
  it[campo]=val; Object.assign(it,normItem(it));
  window.lcRenderPecas(prefix);
};

window.lcRenderPecas=function(prefix){
  const cont=document.getElementById(prefix+'-pecas-list'); if(!cont) return;
  const itens=window.__chamadoPecasTemp||[];
  if(!itens.length){ cont.innerHTML='<p class="text-[12px] text-slate-400 text-center py-2">Nenhum produto lançado</p>'; return; }
  cont.innerHTML=`<div class="overflow-auto rounded-xl border bg-white"><table class="w-full text-[11px]"><thead class="bg-slate-50"><tr>
    <th class="text-left px-2 py-1">Descrição</th><th>Qtd</th><th>Valor</th><th>Desc.</th><th>Final</th><th></th>
  </tr></thead><tbody>${itens.map((raw,i)=>{
    const it=normItem(raw);
    return `<tr class="border-t">
      <td class="px-2 py-1"><b>${esc(it.descricao||'')}</b></td>
      <td class="text-center">${it.qtd}</td>
      <td class="text-right">${money(it.preco)}</td>
      <td class="text-right">${money(it.desconto)}</td>
      <td class="text-right font-bold">${money(it.subtotal)}</td>
      <td><button type="button" data-lc-del="${prefix}:${i}" class="lc-peca-del h-7 px-2 rounded-lg bg-red-50 text-red-600 font-bold">Tirar</button></td>
    </tr>`;
  }).join('')}</tbody></table></div>
  <p class="text-right font-bold text-[#0a1e8a] mt-2">Total: ${money(itens.reduce((s,it)=>s+n(normItem(it).subtotal),0))}</p>`;
};

function montarPecas(prefix){
  const box=document.getElementById(prefix+'-pecas-box');
  if(!box) return;
  if(!document.getElementById(prefix+'-prod-total')){
    const wrap=document.createElement('div');
    wrap.innerHTML=htmlPecasVendas(prefix);
    box.replaceWith(wrap.firstChild);
  }
  const inp=document.getElementById(prefix+'-prod-search');
  const lupa=document.getElementById(prefix+'-prod-lupa');
  if(inp){
    inp.removeAttribute('oninput'); inp.oninput=null;
    inp.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); window.lcBuscarPeca(prefix); } };
  }
  if(lupa) lupa.onclick=function(ev){ ev.preventDefault(); window.lcBuscarPeca(prefix); };
  window.lcRenderPecas(prefix);
  window.lcPecaCalc(prefix);
}

const _open=window.openModalChamadoCompleto;
if(typeof _open==='function'){
  window.openModalChamadoCompleto=function(){
    const r=_open.apply(this,arguments);
    setTimeout(()=>montarPecas('ko'),40);
    setTimeout(()=>montarPecas('ko'),140);
    return r;
  };
}
const _av=window.abrirChamadoAvulsoForm;
if(typeof _av==='function'){
  window.abrirChamadoAvulsoForm=function(){
    const r=_av.apply(this,arguments);
    setTimeout(()=>montarPecas('ca'),90);
    setTimeout(()=>montarPecas('ca'),200);
    return r;
  };
}

// salva pecas sem abrir venda (1.2.1 fica pra depois)
const _sav=window.salvarChamadoCompleto;
if(typeof _sav==='function' && !_sav.__v5182pecas){
  window.salvarChamadoCompleto=function(){
    const pecas=(window.__chamadoPecasTemp||[]).map(normItem);
    const r=_sav.apply(this,arguments);
    const cid=arguments[1]||(window.modalContext&&window.modalContext.contratoId);
    let o=arguments[0]&&(db.os||[]).find(x=>x.id===arguments[0]);
    if(!o) o=(db.os||[]).slice().reverse().find(x=>x.contratoId===cid);
    if(o){ o.pecas=pecas; if(typeof saveDB==='function') saveDB(); }
    return r;
  };
  window.salvarChamadoCompleto.__v5182pecas=true;
}
const _savAv=window.salvarChamadoAvulso;
if(typeof _savAv==='function' && !_savAv.__v5182pecas){
  window.salvarChamadoAvulso=function(){
    const pecas=(window.__chamadoPecasTemp||[]).map(normItem);
    const r=_savAv.apply(this,arguments);
    let o=arguments[0]&&(db.os||[]).find(x=>x.id===arguments[0]);
    if(!o) o=(db.os||[]).slice(-1)[0];
    if(o){ o.pecas=pecas; if(typeof saveDB==='function') saveDB(); }
    return r;
  };
  window.salvarChamadoAvulso.__v5182pecas=true;
}

function chamadoFinalizado(o){
  if(!o) return false;
  const chk=document.getElementById('ko-concluido')||document.getElementById('ca-concluido');
  if(chk) return !!chk.checked;
  const st=String(o.status||'').toLowerCase();
  return st==='concluido'||st==='finalizado'||st==='fechado';
}
function parqueDaOs(o){
  const list=db.parque||[];
  return list.find(x=>x.equipamentoId===o.equipamentoId && (!o.contratoId||x.contratoId===o.contratoId))
      || list.find(x=>x.equipamentoId===o.equipamentoId)||null;
}
function temColor(p,o){
  if(!o.contratoId) return true;
  const m=(p&&(p.medidoresConfig||p.medidores))||{};
  return ['colorA4','colorA3'].some(k=>{
    const x=m[k]; if(!x) return false;
    const mod=String(x.modalidade||x.mod||'').toLowerCase();
    return !!(mod&&mod!=='inativo'&&mod!=='off');
  });
}
function lojaRodape(){
  const s=sess()||{};
  const emp=(db.empresas||[]).find(e=>e.id===s.empresaId)||{};
  const l=(db.config&&(db.config.loja||db.config.empresa))||{};
  const d=Object.assign({},emp,l);
  const end=d.endereco||[d.rua||d.logradouro,d.numero,d.bairro,d.cidade||d.municipio,d.uf||d.estado,d.cep].filter(Boolean).join(' • ');
  return {fantasia:d.fantasia||'DIGICOPY',razao:d.razaoSocial||d.nome||'',cnpj:d.cnpj||s.cnpj||'',tel:d.telefone||d.fone||'',whats:d.whatsapp||'',email:d.email||'',end:end||''};
}

window.imprimirChamadoPDF=function(osId){
  const o=(db.os||[]).find(x=>x.id===osId);
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  const cl=(db.clientes||[]).find(c=>c.id===o.clienteId)||{};
  const loja=lojaRodape();
  const fin=chamadoFinalizado(o);
  const p=parqueDaOs(o);
  const showColor=!o.contratoId||temColor(p,o);
  let pecas=Array.isArray(o.pecas)?o.pecas.map(normItem):[];
  while(pecas.length<5) pecas.push({descricao:'',qtd:'',subtotal:''});
  const cell=(x)=>fin?esc(x==null||x===''?'':x):'';
  const cellM=(x)=>fin&&x!==''&&x!=null?esc(money(x)):'';
  const dataCad=dataBR(o.criadoEm||o.dataAbertura);
  const dataAt=fin&&o.dataAtendimento?dataBR(o.dataAtendimento):'&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const pb=fin&&o.contadorAtual!=null&&String(o.contadorAtual).trim()!==''?esc(String(o.contadorAtual)):'';
  const cor=fin&&o.contadorColor!=null&&String(o.contadorColor).trim()!==''?esc(String(o.contadorColor)):'';
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    @page{size:A4;margin:10mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0;padding:0} body{font-family:Arial,sans-serif;color:#111;font-size:12px}
    .page{height:277mm;max-height:277mm;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden}
    .head{display:flex;gap:12px;align-items:center;padding-bottom:8px;border-bottom:3px solid #0a1e8a}
    .head img{height:50px}.head h1{margin:0;color:#0a1e8a;font-size:18px}
    .muted{color:#64748b;font-size:11px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
    .card{border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;background:#f8fafc}
    .faixa{background:#0a1e8a!important;color:#fff!important;text-align:center;font-weight:800;padding:6px;margin:8px 0 4px;border-radius:6px}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #cbd5e1;padding:5px}
    th{background:#eef2ff!important;color:#0a1e8a}
    .box-write{border:1px solid #94a3b8;border-radius:8px;min-height:48px;padding:6px 10px;background-image:repeating-linear-gradient(#fff 0 20px,#cbd5e1 20px 21px)}
    .foot{margin-top:auto;padding-top:10px}
    .assin{display:flex;justify-content:space-between;gap:48px;margin-bottom:12px}
    .assin div{flex:1;text-align:center;border-top:1px solid #111;padding-top:6px}
    .rodape-loja-final{border-top:1px solid #d8dee9;padding-top:4px;text-align:center;font-size:8.5px;color:#5b6472}
    @media print{.no-print{display:none!important}}
  </style></head><body>
  <div class="no-print" style="padding:8px"><button onclick="window.print()">Imprimir</button></div>
  <div class="page">
  <div class="head"><img src="${logoSrc()}"><div><h1>${esc(loja.fantasia)}</h1><div class="muted">${esc(loja.razao)}</div></div>
    <div style="margin-left:auto;text-align:right"><b>OS ${esc(o.numero||'')}</b></div></div>
  <div class="cards">
    <div class="card"><div class="muted">CLIENTE</div><b>${esc(cl.nome||'')}</b><div class="muted">${esc(cl.documento||'')} • ${esc(cl.telefone||'')}</div></div>
    <div class="card" style="grid-column:1 / -1"><div class="muted">IMPRESSORA / EQUIPAMENTO</div>${o.contratoId?`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px 24px;margin-top:7px"><div>Modelo: <b>${esc(o.modelo||'')}</b></div><div>Patrimônio: <b>${esc(o.patrimonio||'')}</b></div><div>Serial: <b>${esc(o.serie||o.serial||'')}</b></div><div>Local: <b>${esc(o.local||'')}</b></div></div>`:`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px 24px;margin-top:7px"><div>Modelo: __________________________________</div><div>Patrimônio: ______________________________</div><div>Serial: __________________________________</div><div>Local: __________________________________</div></div>`}</div>
    <div class="card"><div class="muted">ATENDIMENTO</div>
      <div>Técnico: <b>${esc(o.tecnico||'')}</b></div>
      <div>Motivo / Defeito: <b>${esc(o.descricao||'')}</b></div>
      <div class="muted">Data de cadastro: ${esc(dataCad)}</div>
    </div>
  </div>
  <div class="faixa">SERVIÇOS EXECUTADOS</div>
  <div class="box-write">${cell(o.servicos)}</div>
  <div class="faixa">PRODUTOS / PEÇAS UTILIZADAS</div>
  <table><thead><tr><th style="width:62%">Descrição</th><th>Quantidade</th><th>Valor</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(it=>`<tr><td>${cell(it.descricao)}&nbsp;</td><td>${cell(it.qtd)}&nbsp;</td><td>${it.subtotal===''?'':cellM(it.subtotal)}&nbsp;</td></tr>`).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="box-write">${cell(o.observacao)}</div>
  <p style="margin-top:10px;font-size:13px">
    <b>Data do atendimento:</b> <span style="border-bottom:1px solid #111;min-width:110px;display:inline-block;text-align:center">${dataAt}</span>
    &nbsp;&nbsp;<b>Contador preto:</b> <span style="display:inline-block;border-bottom:1px solid #111;min-width:130px;height:16px;text-align:center">${pb}</span>
    ${showColor?'&nbsp;&nbsp;<b>Contador color:</b> <span style="display:inline-block;border-bottom:1px solid #111;min-width:130px;height:16px;text-align:center">'+cor+'</span>':''}
  </p>
  <div class="foot">
    <div class="assin"><div>Assinatura do técnico</div><div>Assinatura do cliente</div></div>
    <div class="rodape-loja-final"><b>${esc(loja.fantasia)}</b>${loja.razao?' • '+esc(loja.razao):''}${loja.cnpj?' • CNPJ '+esc(loja.cnpj):''}<br>${esc(loja.end||'Endereço não informado')}${loja.tel?' • Tel. '+esc(loja.tel):''}${loja.whats?' • WhatsApp '+esc(loja.whats):''}${loja.email?' • '+esc(loja.email):''}</div>
  </div>
  </div></body></html>`;
  const w=window.open('','_blank'); if(w){ w.document.write(html); w.document.close(); }
};

console.log('[DIGICOPY] ajustes_v5182_patch.js');
})();
