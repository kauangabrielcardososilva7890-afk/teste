// PATCH v5.18.1 — peças com valor/desconto; PDF valor; venda faturada; excluir apaga chamado
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb===undefined?0:fb); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(n(v)):('R$ '+n(v).toFixed(2).replace('.',',')); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Aviso'); }
function confirmar(m,t){ return typeof window.confirmSistema==='function'?window.confirmSistema(m,t||'Confirmar'):Promise.resolve(false); }
function logoSrc(){ return window.DIGICOPY_LOGO||'./logo.png'; }
function dia(v){ return String(v||'').slice(0,10); }
function dataBR(v){ const s=dia(v); if(!s) return ''; const p=s.split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s; }

function normItem(it){
  const qtd=Math.max(1,n(it.qtd,1));
  const preco=n(it.preco,0);
  const desconto=Math.max(0,n(it.desconto,0));
  const bruto=qtd*preco;
  const subtotal=Math.max(0,bruto-desconto);
  return Object.assign({},it,{qtd,preco,desconto,subtotal});
}
function totalPecas(lista){
  return (lista||[]).reduce((s,it)=>s+n(normItem(it).subtotal),0);
}

window.lcAddPeca=function(prefix,prodId){
  const p=(db.produtos||[]).find(x=>x.id===prodId);
  if(!p){ aviso('Produto não encontrado'); return; }
  const qtd=Math.max(1,n(document.getElementById(prefix+'-prod-qtd')?.value,1));
  const precoEl=document.getElementById(prefix+'-prod-preco');
  const descEl=document.getElementById(prefix+'-prod-desc');
  const preco=precoEl&&String(precoEl.value).trim()!==''?n(precoEl.value,n(p.preco)):n(p.preco);
  const desconto=Math.max(0,n(descEl&&descEl.value,0));
  window.__chamadoPecasTemp=window.__chamadoPecasTemp||[];
  const ex=window.__chamadoPecasTemp.find(i=>i.produtoId===prodId);
  if(ex){
    ex.qtd=n(ex.qtd)+qtd;
    ex.preco=preco;
    ex.desconto=n(ex.desconto)+desconto;
    Object.assign(ex,normItem(ex));
  } else {
    window.__chamadoPecasTemp.push(normItem({produtoId:prodId,descricao:p.nome,qtd,preco,desconto}));
  }
  window.lcRenderPecas(prefix);
  const res=document.getElementById(prefix+'-prod-results'); if(res){ res.classList.add('hidden'); res.innerHTML=''; }
  const inp=document.getElementById(prefix+'-prod-search'); if(inp) inp.value='';
};

window.lcUpdPeca=function(prefix,idx,campo,val){
  const it=(window.__chamadoPecasTemp||[])[idx]; if(!it) return;
  it[campo]=val;
  Object.assign(it,normItem(it));
  window.lcRenderPecas(prefix);
};

window.lcRenderPecas=function(prefix){
  const cont=document.getElementById(prefix+'-pecas-list'); if(!cont) return;
  const itens=window.__chamadoPecasTemp||[];
  if(!itens.length){
    cont.innerHTML='<p class="text-[12px] text-slate-400 text-center py-2">Nenhum produto lançado</p>';
    const tot=document.getElementById(prefix+'-pecas-total'); if(tot) tot.textContent=money(0);
    return;
  }
  cont.innerHTML=`<div class="overflow-auto"><table class="w-full text-[11px]"><thead><tr class="text-slate-500">
    <th class="text-left py-1">Item</th><th class="w-16">Qtd</th><th class="w-24">Valor</th><th class="w-20">Desc.</th><th class="w-24">Final</th><th></th>
  </tr></thead><tbody>${itens.map((raw,i)=>{
    const it=normItem(raw);
    const p=(db.produtos||[]).find(x=>x.id===it.produtoId)||{};
    return `<tr class="border-t bg-white">
      <td class="py-1 pr-2"><b>${esc(p.nome||it.descricao||'')}</b><div class="text-slate-400">${esc(p.sku||'')}</div></td>
      <td><input type="number" min="1" value="${it.qtd}" class="w-14 h-8 px-1 rounded-lg border" onchange="lcUpdPeca('${prefix}',${i},'qtd',this.value)"></td>
      <td><input type="number" step="0.01" value="${it.preco}" class="w-20 h-8 px-1 rounded-lg border" onchange="lcUpdPeca('${prefix}',${i},'preco',this.value)"></td>
      <td><input type="number" step="0.01" min="0" value="${it.desconto}" class="w-16 h-8 px-1 rounded-lg border" onchange="lcUpdPeca('${prefix}',${i},'desconto',this.value)"></td>
      <td class="font-bold text-right pr-1">${money(it.subtotal)}</td>
      <td><button type="button" data-lc-del="${prefix}:${i}" class="lc-peca-del h-7 px-2 rounded-lg bg-red-50 text-red-600 font-bold">Tirar</button></td>
    </tr>`;
  }).join('')}</tbody></table></div>`;
  let tot=document.getElementById(prefix+'-pecas-total');
  if(!tot){
    tot=document.createElement('p');
    tot.id=prefix+'-pecas-total';
    tot.className='text-right font-bold text-[#0a1e8a] mt-2';
    cont.parentElement.appendChild(tot);
  }
  tot.textContent='Total peças: '+money(totalPecas(itens));
};

function garantirCamposPeca(prefix){
  if(document.getElementById(prefix+'-prod-preco')) return;
  const qtd=document.getElementById(prefix+'-prod-qtd');
  if(!qtd||!qtd.parentElement) return;
  const wrap=qtd.parentElement;
  wrap.className='grid grid-cols-12 gap-2 items-end';
  qtd.className='col-span-2 h-10 px-2 rounded-xl border bg-white';
  qtd.placeholder='Qtd';
  const preco=document.createElement('input');
  preco.id=prefix+'-prod-preco'; preco.type='number'; preco.step='0.01';
  preco.className='col-span-3 h-10 px-2 rounded-xl border bg-white';
  preco.placeholder='Valor';
  const desc=document.createElement('input');
  desc.id=prefix+'-prod-desc'; desc.type='number'; desc.step='0.01'; desc.value='0';
  desc.className='col-span-3 h-10 px-2 rounded-xl border bg-white';
  desc.placeholder='Desconto';
  const hint=document.createElement('p');
  hint.className='col-span-4 text-[11px] text-slate-500 self-center';
  hint.textContent='Qtd, valor e desconto — igual vendas.';
  wrap.appendChild(preco); wrap.appendChild(desc); wrap.appendChild(hint);
}

function afterOpenPecas(prefix){
  setTimeout(()=>{
    garantirCamposPeca(prefix);
    if(typeof window.lcRenderPecas==='function') window.lcRenderPecas(prefix);
  },60);
}
const _open=window.openModalChamadoCompleto;
if(typeof _open==='function'){
  window.openModalChamadoCompleto=function(){
    const r=_open.apply(this,arguments);
    afterOpenPecas('ko');
    return r;
  };
}
const _av=window.abrirChamadoAvulsoForm;
if(typeof _av==='function'){
  window.abrirChamadoAvulsoForm=function(){
    const r=_av.apply(this,arguments);
    afterOpenPecas('ca');
    return r;
  };
}

window.lcCriarVendaDoChamado=function(o){
  if(!o||o.status!=='concluido') return null;
  const pecas=(o.pecas||[]).map(normItem);
  if(!pecas.length) return null;
  let venda=(db.vendas||[]).find(v=>v.chamadoId===o.id);
  const s=sess(); if(!s) return venda||null;
  const descTot=pecas.reduce((s,it)=>s+n(it.desconto),0);
  const total=pecas.reduce((s,it)=>s+n(it.subtotal),0);
  if(!venda){
    venda={
      id:(typeof uid==='function'?uid('vda'):'vda_'+Date.now()),
      empresaId:s.empresaId,
      numero:typeof proximoNumeroSimples==='function'?proximoNumeroSimples('venda',db.vendas||[],s.empresaId):String((db.vendas||[]).length+1),
      clienteId:o.clienteId,
      data:new Date().toISOString(),
      itens:pecas.map(it=>({produtoId:it.produtoId,descricao:it.descricao,qtd:it.qtd,preco:it.preco,desconto:it.desconto,subtotal:it.subtotal})),
      desconto:descTot,total,formaPagamento:'Chamado',status:'faturado',situacao:'faturado',
      dataFaturamento:new Date().toISOString(),
      chamadoId:o.id,chamadoNumero:o.numero,
      criadoPor:s.usuarioId,criadoPorNome:s.usuarioNome
    };
    db.vendas=db.vendas||[]; db.vendas.push(venda);
    pecas.forEach(it=>{ const pr=(db.produtos||[]).find(x=>x.id===it.produtoId); if(pr&&pr.categoria!=='Serviço'&&pr.categoria!=='Recarga') pr.estoque=n(pr.estoque)-n(it.qtd); });
    db.contasReceber=db.contasReceber||[];
    if(!(db.contasReceber||[]).some(c=>c.vendaId===venda.id)){
      db.contasReceber.push({id:(typeof uid==='function'?uid('cr'):'cr_'+Date.now()),empresaId:s.empresaId,origem:'chamado',clienteId:o.clienteId,descricao:'Venda do chamado '+(o.numero||''),valor:total,vencimento:new Date().toISOString(),status:'aberto',vendaId:venda.id,chamadoId:o.id,criadoPor:s.usuarioId,criadoPorNome:s.usuarioNome});
    }
  }
  o.vendaId=venda.id; o.vendaNumero=venda.numero;
  if(typeof saveDB==='function') saveDB();
  return venda;
};

function abrirVendaFaturada(venda){
  if(!venda) return;
  window.__lcChamFormAberto=false;
  const open=function(){
    if(typeof window.vosCarregarVendaNaTela==='function') window.vosCarregarVendaNaTela(venda.id);
    else if(typeof window.historicoVenda==='function') window.historicoVenda(venda.id);
    setTimeout(()=>{ if(typeof window.lockVendaFaturadaUI==='function') window.lockVendaFaturadaUI(venda.id); },120);
  };
  if(typeof window.closeModal==='function'){ try{ window.closeModal(true); }catch(_){ } }
  setTimeout(open,80);
}

function afterSaveChamado(o){
  if(!o) return;
  o.pecas=(window.__chamadoPecasTemp||o.pecas||[]).map(normItem);
  // 1.2.1 / 1.2.2 ficam para depois — não abre venda agora
}

const _sav=window.salvarChamadoCompleto;
if(typeof _sav==='function' && !_sav.__v5181){
  window.salvarChamadoCompleto=function(){
    const pecas=(window.__chamadoPecasTemp||[]).map(normItem);
    const r=_sav.apply(this,arguments);
    const cid=arguments[1]|| (window.modalContext&&window.modalContext.contratoId);
    let o=arguments[0]&&(db.os||[]).find(x=>x.id===arguments[0]);
    if(!o) o=(db.os||[]).slice().reverse().find(x=>x.contratoId===cid);
    if(o){ o.pecas=pecas; afterSaveChamado(o); if(typeof saveDB==='function') saveDB(); }
    return r;
  };
  window.salvarChamadoCompleto.__v5181=true;
}
const _savAv=window.salvarChamadoAvulso;
if(typeof _savAv==='function' && !_savAv.__v5181){
  window.salvarChamadoAvulso=function(){
    const pecas=(window.__chamadoPecasTemp||[]).map(normItem);
    const r=_savAv.apply(this,arguments);
    let o=arguments[0]&&(db.os||[]).find(x=>x.id===arguments[0]);
    if(!o) o=(db.os||[]).slice(-1)[0];
    if(o){ o.pecas=pecas; afterSaveChamado(o); if(typeof saveDB==='function') saveDB(); }
    return r;
  };
  window.salvarChamadoAvulso.__v5181=true;
}

// 1.2.2 desligado nesta versão — usuário testa 1.1/1.2 primeiro

// 1.1 PDF com valor (mantém layout 5.18.0)
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
  let pecas=Array.isArray(o.pecas)?o.pecas.map(it=>normItem(Object.assign({d:it.descricao,q:it.qtd},it))):[];
  while(pecas.length<5) pecas.push({descricao:'',qtd:'',preco:'',desconto:'',subtotal:''});
  const cell=(x)=>fin?esc(x==null||x===''?'':x):'';
  const cellM=(x)=>fin&&x!==''&&x!=null?esc(money(x)):'';
  const dataCad=dataBR(o.criadoEm||o.dataAbertura);
  const dataAt=fin&&o.dataAtendimento?dataBR(o.dataAtendimento):'&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const pb=fin&&o.contadorAtual!=null&&String(o.contadorAtual).trim()!==''?esc(String(o.contadorAtual)):'';
  const cor=fin&&o.contadorColor!=null&&String(o.contadorColor).trim()!==''?esc(String(o.contadorColor)):'';
  const totFin=fin?money(totalPecas(o.pecas||[])):'';
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
    <div class="card"><div class="muted">ATENDIMENTO</div>
      <div>Técnico: <b>${esc(o.tecnico||'')}</b></div>
      <div>Motivo / Defeito: <b>${esc(o.descricao||'')}</b></div>
      <div class="muted">Data de cadastro: ${esc(dataCad)}</div>
    </div>
  </div>
  <div class="faixa">SERVIÇOS EXECUTADOS</div>
  <div class="box-write">${cell(o.servicos)}</div>
  <div class="faixa">PRODUTOS / PEÇAS UTILIZADAS</div>
  <table><thead><tr><th>Descrição</th><th>Qtd</th><th>Valor</th><th>Desc.</th><th>Valor final</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(it=>`<tr><td>${cell(it.descricao||it.d)}&nbsp;</td><td>${cell(it.qtd||it.q)}&nbsp;</td><td>${it.preco===''?'':cellM(it.preco)}&nbsp;</td><td>${it.desconto===''?'':cellM(it.desconto)}&nbsp;</td><td>${it.subtotal===''?'':cellM(it.subtotal)}&nbsp;</td></tr>`).join('')}
  <tr><td colspan="4" style="text-align:right"><b>Total</b></td><td><b>${totFin}</b></td></tr>
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

console.log('[DIGICOPY] ajustes_v5181_patch.js');
})();
