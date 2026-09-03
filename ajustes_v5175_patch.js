// PATCH v5.17.5 — form contrato = layout avulso; peças; PDF linhas; cliente do contrato
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function txt(v){ return String(v??'').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb===undefined?0:fb); }
function dia(v){ return String(v||'').slice(0,10); }
function dataBR(v){ const s=dia(v); if(!s) return ''; const p=s.split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Aviso'); }
function logoSrc(){ return window.DIGICOPY_LOGO||'./logo.png'; }
function temColor(p){
  const m=(p&&(p.medidoresConfig||p.medidores))||{};
  return !!(m.colorA4&&m.colorA4.modalidade&&m.colorA4.modalidade!=='inativo')
      || !!(m.colorA3&&m.colorA3.modalidade&&m.colorA3.modalidade!=='inativo');
}
function dadosLoja(){
  const s=sess()||{};
  const emp=(db.empresas||[]).find(e=>e.id===s.empresaId)||{};
  const cfg=(db.config&&db.config.empresa)||{};
  return {nome:emp.nome||cfg.nome||s.empresaNome||'DIGICOPY',fantasia:emp.fantasia||'DIGICOPY',cnpj:emp.cnpj||s.cnpj||cfg.cnpj||'',fone:cfg.fone||'',end:cfg.endereco||emp.endereco||''};
}
function ctr(id){ return (db.contratos||[]).find(c=>c.id===id)||null; }
function cli(id){ return (db.clientes||[]).find(c=>c.id===id)||null; }
function eq(id){ return (db.equipamentos||[]).find(e=>e.id===id)||null; }

function contadorOficial(equipId, cor){
  const e=eq(equipId)||{};
  let best={d:'',pb:e.contadorPB,cor:e.contadorCor};
  (db.leituras||[]).forEach(l=>{
    const d=l.dataLeitura||l.criadoEm||'';
    if(l.equipamentoId===equipId){
      if(!best.d||new Date(d)>=new Date(best.d||0))
        best={d,pb:l.contadorPB!=null?l.contadorPB:best.pb,cor:l.contadorCor!=null?l.contadorCor:best.cor};
    }
    (l.itens||[]).forEach(it=>{
      const p=it.parqueId&&(db.parque||[]).find(x=>x.id===it.parqueId);
      const match=it.equipamentoId===equipId || (p&&p.equipamentoId===equipId);
      if(!match) return;
      if(!best.d||new Date(d)>=new Date(best.d||0)){
        if(/color/i.test(it.medidor||it.medidorLabel||'')) best={d,pb:best.pb,cor:it.atual};
        else best={d,pb:it.atual,cor:best.cor};
      }
    });
  });
  return cor?n(best.cor,0):n(best.pb,0);
}

window.lcCalcColor=function(){
  const ant=n(document.getElementById('lc-cont-color-ant')?.value||document.getElementById('ca-cont-color-ant')?.value,0);
  const raw=(document.getElementById('lc-cont-color-atu')||document.getElementById('ca-cont-color-atu')||{}).value;
  const out=document.getElementById('lc-qtd-color')||document.getElementById('ca-qtd-color');
  if(!out) return;
  out.value=(raw===''||raw==null)?'':Math.max(0,n(raw,ant)-ant);
};

function htmlPecasBusca(prefix){
  return `<div class="rounded-xl border p-3 bg-slate-50" id="${prefix}-pecas-box">
    <p class="font-bold text-slate-700 mb-2">Produtos / Peças usadas</p>
    <input id="${prefix}-prod-search" class="w-full h-11 px-3 rounded-xl border mb-2 bg-white" placeholder="Digite nome, código, ref..." oninput="lcBuscarPeca('${prefix}',this.value)">
    <div id="${prefix}-prod-results" class="hidden max-h-[220px] overflow-auto rounded-xl border bg-white mb-2"></div>
    <div class="grid grid-cols-12 gap-2">
      <input id="${prefix}-prod-qtd" type="number" value="1" min="1" class="col-span-3 h-10 px-3 rounded-xl border bg-white" placeholder="Qtd">
      <p class="col-span-9 text-[11px] text-slate-500 self-center">Clique no item da busca para lançar. Remover não fecha o chamado.</p>
    </div>
    <div id="${prefix}-pecas-list" class="mt-3 space-y-2"></div>
  </div>`;
}

window.lcBuscarPeca=function(prefix,q){
  const res=document.getElementById(prefix+'-prod-results'); if(!res) return;
  const s=sess(); const lowq=low(q);
  if(!lowq){ res.classList.add('hidden'); res.innerHTML=''; return; }
  let lista=(db.produtos||[]).filter(p=>(!s||p.empresaId===s.empresaId)&&p.status!=='inativo'&&p.status!=='excluido');
  lista=lista.filter(p=>[p.nome,p.sku,p.codigo,p.categoria,p.fabricante].some(v=>low(v).includes(lowq))).slice(0,15);
  if(!lista.length){ res.innerHTML='<p class="p-3 text-[12px] text-slate-400">Nenhum item</p>'; res.classList.remove('hidden'); return; }
  res.innerHTML=lista.map(p=>`<button type="button" class="w-full text-left px-3 py-2 border-b hover:bg-blue-50 lc-peca-add" onclick="lcAddPeca('${prefix}','${p.id}')"><b>${esc(p.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(p.sku||p.codigo||'')} • ${typeof fmtMoney==='function'?fmtMoney(p.preco||0):p.preco}</span></button>`).join('');
  res.classList.remove('hidden');
};

window.lcAddPeca=function(prefix,prodId){
  const p=(db.produtos||[]).find(x=>x.id===prodId); if(!p) return;
  const qtd=Math.max(1,n(document.getElementById(prefix+'-prod-qtd')?.value,1));
  window.__chamadoPecasTemp=window.__chamadoPecasTemp||[];
  const ex=window.__chamadoPecasTemp.find(i=>i.produtoId===prodId);
  if(ex) ex.qtd+=qtd; else window.__chamadoPecasTemp.push({produtoId:prodId,descricao:p.nome,qtd,preco:n(p.preco),subtotal:qtd*n(p.preco)});
  lcRenderPecas(prefix);
  const res=document.getElementById(prefix+'-prod-results'); if(res) res.classList.add('hidden');
  const inp=document.getElementById(prefix+'-prod-search'); if(inp) inp.value='';
};

window.lcRemoverPeca=function(prefix,idx,ev){
  if(ev){ ev.preventDefault(); ev.stopPropagation(); }
  (window.__chamadoPecasTemp||[]).splice(idx,1);
  lcRenderPecas(prefix);
};

window.lcRenderPecas=function(prefix){
  const cont=document.getElementById(prefix+'-pecas-list'); if(!cont) return;
  const itens=window.__chamadoPecasTemp||[];
  cont.innerHTML=itens.map((it,idx)=>{
    const p=(db.produtos||[]).find(x=>x.id===it.produtoId)||{};
    return `<div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border text-[12px]">
      <div><b>${esc(p.nome||it.descricao||'')}</b><p class="text-[11px] text-slate-500">${esc(p.sku||'')} • qtd ${it.qtd}</p></div>
      <button type="button" class="lc-peca-del h-8 px-3 rounded-lg bg-red-50 text-red-600 font-bold" onclick="lcRemoverPeca('${prefix}',${idx},event)">Tirar</button>
    </div>`;
  }).join('')||'<p class="text-[12px] text-slate-400 text-center py-2">Nenhum produto lançado</p>';
};

function htmlContadores(pre, o, showColor){
  const ant=o&&o.contadorAntigo!=null?o.contadorAntigo:'';
  const atu=o&&o.contadorAtual!=null&&o.contadorAtual!==''?o.contadorAtual:'';
  const colorDisp=showColor?'':'display:none';
  return `<div class="rounded-xl border p-3 bg-slate-50">
    <p class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">Este contador do chamado NÃO altera o contador da impressora usado na leitura. O antigo vem da última LEITURA.</p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div><label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Preto Antigo</label><input id="${pre}-cont-ant" type="number" value="${esc(ant)}" readonly class="w-full h-12 px-3 rounded-xl border bg-slate-50 font-mono font-bold text-[16px]"></div>
      <div><label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Preto Atual</label><input id="${pre}-cont-atu" type="number" value="${esc(atu)}" oninput="${pre==='ko'?'calcImpressoesChamado()':'calcChamadoAvulso()'}" class="w-full h-12 px-3 rounded-xl border-2 border-[#0a1e8a] font-mono font-bold text-[16px]" placeholder="Digite"></div>
      <div><label class="block font-bold text-emerald-700 mb-1 text-[11px] uppercase">Qtd impressos</label><input id="${pre==='ko'?'ko-qtd-imp':'ca-qtd'}" type="number" readonly class="w-full h-12 px-3 rounded-xl border bg-emerald-50 font-bold text-emerald-700 text-[16px]"></div>
    </div>
    <div id="${pre}-color-block" class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3" style="${colorDisp}">
      <div><label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Color Antigo</label><input id="${pre==='ko'?'lc-cont-color-ant':'ca-cont-color-ant'}" type="number" readonly class="w-full h-12 px-3 rounded-xl border bg-slate-50 font-mono font-bold text-[16px]"></div>
      <div><label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Color Atual</label><input id="${pre==='ko'?'lc-cont-color-atu':'ca-cont-color-atu'}" type="number" oninput="lcCalcColor()" class="w-full h-12 px-3 rounded-xl border-2 border-[#0a1e8a] font-mono font-bold text-[16px]" placeholder="Digite"></div>
      <div><label class="block font-bold text-emerald-700 mb-1 text-[11px] uppercase">Qtd Color</label><input id="${pre==='ko'?'lc-qtd-color':'ca-qtd-color'}" type="number" readonly class="w-full h-12 px-3 rounded-xl border bg-emerald-50 font-bold text-[16px]"></div>
    </div>
  </div>`;
}

function htmlBuscaImpressoraContrato(){
  return `<div class="rounded-xl bg-blue-50 border border-blue-200 p-3" id="lc-busca-imp-ctr">
    <b class="text-blue-900">Buscar impressora do contrato</b>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
      <select id="lc-imp-busca-campo" class="h-10 px-2 rounded-xl border bg-white text-[12px]"><option value="impressora">Impressora</option><option value="serial">Serial</option><option value="patrimonio">Patrimônio</option><option value="departamento">Departamento</option><option value="localizacao">Localização</option></select>
      <input id="lc-imp-busca-q" class="md:col-span-2 h-10 px-3 rounded-xl border" placeholder="Digite e Enter / lupa" onkeydown="if(event.key==='Enter'){event.preventDefault();lcBuscarImpressoraChamado()}">
      <button type="button" onclick="lcBuscarImpressoraChamado()" class="h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i></button>
    </div>
    <input type="hidden" id="ko-equip" value=""><div id="ko-equip-selected" class="hidden mt-2 flex items-center justify-between rounded-xl border bg-white px-3 py-2"><span id="ko-equip-selected-name" class="font-semibold text-[12px]"></span><button type="button" onclick="lcEditarImpressoraChamado()" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-[#0a1e8a]" title="Trocar impressora"><i class="ph ph-pencil"></i></button></div><div id="ko-equip-lista" class="mt-2 rounded-xl border bg-white max-h-48 overflow-y-auto"></div>
  </div>`;
}

window.lcEscolherImpressoraChamado=function(equipId){
  const sel=document.getElementById('ko-equip'); if(!sel) return;
  sel.value=equipId;
  const e=eq(equipId)||{};
  const chosen=document.getElementById('ko-equip-selected');
  const name=document.getElementById('ko-equip-selected-name');
  const list=document.getElementById('ko-equip-lista');
  if(name) name.textContent=(e.modelo||'Impressora')+' — '+(e.serie||'')+' — Patr. '+(e.patrimonio||'-');
  if(chosen) chosen.classList.remove('hidden');
  if(list) list.classList.add('hidden');
  if(typeof autoPreencherDadosChamado==='function') autoPreencherDadosChamado(equipId);
};
window.lcEditarImpressoraChamado=function(){
  document.getElementById('ko-equip-selected')?.classList.add('hidden');
  document.getElementById('ko-equip-lista')?.classList.remove('hidden');
  lcBuscarImpressoraChamado();
};

window.lcBuscarImpressoraChamado=function(){
  const sel=document.getElementById('ko-equip'); const listaEl=document.getElementById('ko-equip-lista'); if(!sel || !listaEl) return;
  const campo=document.getElementById('lc-imp-busca-campo')?.value||'impressora';
  const q=low(document.getElementById('lc-imp-busca-q')?.value||'');
  const cid=window.modalContext&&window.modalContext.contratoId;
  const maq=(db.parque||[]).filter(p=>p.contratoId===cid&&p.status!=='inativo');
  const opts=maq.filter(p=>{
    if(!q) return true;
    const e=eq(p.equipamentoId)||{};
    const alvo={impressora:[e.modelo,e.descricao].join(' '),serial:e.serie,patrimonio:e.patrimonio||p.patrimonio,departamento:p.setor,localizacao:p.localInstalacao||p.enderecoInstalacao}[campo]||'';
    return low(alvo).includes(q);
  });
  const cur=sel.value;
  listaEl.innerHTML=opts.map(p=>{ const e=eq(p.equipamentoId)||{}; const id=esc(p.equipamentoId); return `<button type="button" onclick="lcEscolherImpressoraChamado('${id}')" class="w-full text-left px-3 py-2 border-b last:border-0 hover:bg-blue-50"><b>${esc(e.modelo||'Impressora')}</b><br><span class="text-[11px] text-slate-500">${esc(e.serie||'')} — Patr. ${esc(e.patrimonio||'-')}</span></button>`; }).join('') || '<p class="p-3 text-[12px] text-slate-500">Nenhuma impressora encontrada.</p>';
  if(cur) lcEscolherImpressoraChamado(cur);
};

function setModalSize(){
  const box=document.getElementById('modal-box');
  if(box) box.className='w-full max-w-[980px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
}

// ── Form CONTRATO no layout do avulso ──
const _openOrig=window.openModalChamadoCompleto;
window.openModalChamadoCompleto=function(osId, contratoId){
  const s=sess(); if(!s) return;
  const c=ctr(contratoId);
  if(!c){ aviso('Contrato não encontrado.'); return; }
  const cl=cli(c.clienteId)||{};
  const isEdit=!!osId;
  const o=isEdit?(db.os||[]).find(x=>x.id===osId):null;
  if(isEdit&&!o){ aviso('Chamado não encontrado.'); return; }
  window.__lcChamFormAberto=true;
  window.__lcChamDirty=false;
  window.modalContext={type:'chamado',id:osId||'',contratoId:c.id};
  window.__chamadoPecasTemp=(o&&o.pecas||[]).map(it=>({...it}));
  const firstEq=((db.parque||[]).find(p=>p.contratoId===c.id&&p.status!=='inativo')||{}).equipamentoId||'';
  const equipId=(o&&o.equipamentoId)||firstEq;
  const pEq=(db.parque||[]).find(x=>x.equipamentoId===equipId&&x.contratoId===c.id);
  const showColor=temColor(pEq);
  const num=o?o.numero:(typeof proximoNumeroSimples==='function'?proximoNumeroSimples('os',db.os||[],s.empresaId):String((db.os||[]).length+1));
  const e=eq(equipId)||{};
  setModalSize();
  document.getElementById('modal-title').innerText=isEdit?('Chamado '+num):'Novo chamado do contrato';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4 text-[13px]">
    <div class="rounded-xl bg-blue-50 border border-blue-200 p-3"><b>${esc(cl.nome||'Cliente do contrato')}</b><p class="text-[12px] text-blue-800">${esc(cl.documento||'')} • Contrato ${esc(c.numero||'')}</p></div>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
      <div><label class="block font-bold text-slate-600 mb-1">Código</label><input id="ko-num" readonly value="${esc(num)}" class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold"></div>
      <div><label class="block font-bold text-slate-600 mb-1">Data</label><input id="ko-data" type="date" value="${dia(o&&o.dataAbertura||new Date().toISOString())}" class="w-full h-10 px-3 rounded-xl border"></div>
      <div><label class="block font-bold text-slate-600 mb-1">Prioridade</label><select id="ko-prio" class="w-full h-10 px-3 rounded-xl border"><option value="normal">Normal</option><option value="alta">Alta</option><option value="baixa">Baixa</option></select></div>
      <div><label class="block font-bold text-slate-600 mb-1">Técnico</label><input id="ko-tec" value="${esc((o&&o.tecnico)||s.usuarioNome)}" class="w-full h-10 px-3 rounded-xl border"></div>
      <div><label class="block font-bold text-slate-600 mb-1">Data atendimento</label><input id="lc-data-atend" type="date" value="${dia(o&&o.dataAtendimento||'')}" class="w-full h-10 px-3 rounded-xl border"></div>
    </div>
    ${htmlBuscaImpressoraContrato()}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div><label class="block font-bold text-slate-600 mb-1">Modelo</label><input id="ko-modelo" value="${esc((o&&o.modelo)||e.modelo||'')}" class="w-full h-10 px-3 rounded-xl border"></div>
      <div><label class="block font-bold text-slate-600 mb-1">Serial</label><input id="ko-serie" value="${esc((o&&o.serie)||e.serie||'')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div>
      <div><label class="block font-bold text-slate-600 mb-1">Patrimônio</label><input id="ko-patr" value="${esc((o&&o.patrimonio)||e.patrimonio||'')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div>
      <div><label class="block font-bold text-slate-600 mb-1">Local</label><input id="ko-local" value="${esc((o&&o.local)||'')}" class="w-full h-10 px-3 rounded-xl border"></div>
    </div>
    <div><label class="block font-bold text-slate-600 mb-1">Motivo / Defeito *</label><input id="ko-desc" value="${esc(o&&o.descricao||'')}" class="w-full h-10 px-3 rounded-xl border font-semibold"></div>
    <label class="bg-slate-50 border rounded-xl p-3 flex items-center gap-3 cursor-pointer"><input type="checkbox" id="ko-concluido" ${o&&o.status==='concluido'?'checked':''} class="w-4 h-4"><span class="font-bold">Este chamado já foi finalizado?</span></label>
    ${htmlContadores('ko', o, showColor)}
    <div><label class="block font-bold text-slate-600 mb-1">Serviços executados</label><textarea id="ko-serv" class="w-full h-24 p-3 rounded-xl border">${esc(o&&o.servicos||'')}</textarea></div>
    <div><label class="block font-bold text-slate-600 mb-1">Observação</label><textarea id="ko-obs" class="w-full h-20 p-3 rounded-xl border">${esc(o&&o.observacao||'')}</textarea></div>
    ${htmlPecasBusca('ko')}
  </div>`;
  document.getElementById('modal-footer').innerHTML=
    `<button type="button" onclick="imprimirChamadoPDF('${o&&o.id||''}')" class="h-10 px-5 rounded-xl bg-slate-900 text-white font-bold mr-auto">Imprimir</button>
     <button type="button" onclick="voltarListaChamadoContrato()" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button>
     <button type="button" onclick="salvarChamadoCompleto('${o&&o.id||''}','${c.id}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>`;
  document.getElementById('modal-root')?.classList.remove('hidden');
  const pr=document.getElementById('ko-prio'); if(pr) pr.value=(o&&o.prioridade)||'normal';
  lcBuscarImpressoraChamado();
  if(equipId){
    const sel=document.getElementById('ko-equip'); if(sel) lcEscolherImpressoraChamado(equipId);
    if(typeof autoPreencherDadosChamado==='function') autoPreencherDadosChamado(equipId, true, osId);
    const ant=document.getElementById('ko-cont-ant'); if(ant) ant.value=contadorOficial(equipId,false);
    const ca=document.getElementById('lc-cont-color-ant'); if(ca) ca.value=contadorOficial(equipId,true);
    const block=document.getElementById('ko-color-block'); if(block) block.style.display=temColor(pEq)?'':'none';
  }
  lcRenderPecas('ko');
  if(typeof calcImpressoesChamado==='function') calcImpressoesChamado();
};

window.voltarListaChamadoContrato=function(){
  window.__lcChamFormAberto=false;
  const cid=window.modalContext&&window.modalContext.contratoId;
  if(cid&&typeof abrirChamadosContrato==='function') abrirChamadosContrato(cid);
};

// ── Avulso: antigo + peças + color opcional ──
const _avForm=window.abrirChamadoAvulsoForm;
window.abrirChamadoAvulsoForm=function(id){
  window.__lcChamFormAberto=true;
  window.modalContext=Object.assign(window.modalContext||{},{type:'chamado',id:id||'',contratoId:''});
  if(_avForm) _avForm.apply(this,arguments);
  else if(window.openModal) window.openModal('os',id||null);
  setTimeout(()=>{
    const o=id&&(db.os||[]).find(x=>x.id===id);
    window.__chamadoPecasTemp=(o&&o.pecas||[]).map(it=>({...it}));
    const grid=document.getElementById('ca-cont-atu')&&document.getElementById('ca-cont-atu').closest('.grid');
    if(grid&&!document.getElementById('ca-cont-color-ant')){
      const wrap=document.createElement('div');
      wrap.innerHTML=htmlContadores('ca', o||{}, true);
      // keep avulso color visible (fora de contrato)
      grid.parentElement.insertBefore(wrap.firstChild, grid);
      grid.remove();
    }
    if(!document.getElementById('ca-pecas-box')){
      const body=document.getElementById('modal-body');
      const d=document.createElement('div');
      d.innerHTML=htmlPecasBusca('ca');
      body.appendChild(d.firstChild);
    }
    const ant=document.getElementById('ca-cont-ant');
    const eqId=window.__CHAMADO_AVULSO&&window.__CHAMADO_AVULSO.equipamentoId;
    if(ant) ant.value=eqId?contadorOficial(eqId,false):(ant.value==='0'?'':ant.value);
    const ca=document.getElementById('ca-cont-color-ant');
    if(ca&&eqId) ca.value=contadorOficial(eqId,true);
    lcRenderPecas('ca');
    if(typeof calcChamadoAvulso==='function') calcChamadoAvulso();
  },80);
};

const _selImp=window.selecionarImpressoraChamadoAvulso;
if(typeof _selImp==='function'){
  window.selecionarImpressoraChamadoAvulso=function(equipId){
    const r=_selImp.apply(this,arguments);
    const ant=document.getElementById('ca-cont-ant'); if(ant) ant.value=contadorOficial(equipId,false);
    const ca=document.getElementById('ca-cont-color-ant'); if(ca) ca.value=contadorOficial(equipId,true);
    const atu=document.getElementById('ca-cont-atu'); if(atu) atu.value='';
    return r;
  };
}

// ── Save contrato: cliente SEMPRE do contrato; venda só se finalizado ──
const _sav=window.salvarChamadoCompleto;
window.salvarChamadoCompleto=function(osId,contratoId){
  const c=ctr(contratoId);
  if(!c||!c.clienteId){ aviso('Este chamado é de contrato. O cliente é o do contrato.'); return; }
  window.__CHAMADO_AVULSO=window.__CHAMADO_AVULSO||{};
  window.__CHAMADO_AVULSO.clienteId=c.clienteId;
  const pecas=(window.__chamadoPecasTemp||[]).map(it=>({...it}));
  if(_sav) _sav.apply(this,arguments);
  let o=osId&&(db.os||[]).find(x=>x.id===osId);
  if(!o) o=(db.os||[]).slice().reverse().find(x=>x.contratoId===contratoId);
  if(o){
    o.clienteId=c.clienteId;
    o.contratoId=c.id;
    o.pecas=pecas;
    o.contadorColor=document.getElementById('lc-cont-color-atu')?.value||o.contadorColor;
    o.dataAtendimento=document.getElementById('lc-data-atend')?.value||o.dataAtendimento;
    if(o.status==='concluido') criarVendaSeFinalizado(o);
    // NÃO altera contador da impressora
    if(typeof saveDB==='function') saveDB();
  }
  window.__lcChamFormAberto=false;
};

const _savAv=window.salvarChamadoAvulso;
if(typeof _savAv==='function'){
  window.salvarChamadoAvulso=function(id){
    if(window.modalContext&&window.modalContext.contratoId){
      return window.salvarChamadoCompleto(id||window.modalContext.id||'', window.modalContext.contratoId);
    }
    const pecas=(window.__chamadoPecasTemp||[]).map(it=>({...it}));
    const r=_savAv.apply(this,arguments);
    let o=id&&(db.os||[]).find(x=>x.id===id);
    if(!o) o=(db.os||[]).slice(-1)[0];
    if(o){
      o.pecas=pecas;
      o.contadorColor=document.getElementById('ca-cont-color-atu')?.value||null;
      if(o.status==='concluido') criarVendaSeFinalizado(o);
      const e=eq(o.equipamentoId);
      if(e){ /* não sobrescreve contador oficial */ }
      if(typeof saveDB==='function') saveDB();
    }
    return r;
  };
}

function criarVendaSeFinalizado(o){
  if(!o||o.status!=='concluido') return;
  const pecas=o.pecas||[];
  if(!pecas.length) return;
  if((db.vendas||[]).some(v=>v.chamadoId===o.id)) return;
  const s=sess(); if(!s) return;
  const total=pecas.reduce((sum,it)=>sum+n(it.qtd)*n(it.preco),0);
  if(total<=0) return;
  const venda={
    id:(typeof uid==='function'?uid('vda'):'vda_'+Date.now()),
    empresaId:s.empresaId,
    numero:typeof proximoNumeroSimples==='function'?proximoNumeroSimples('venda',db.vendas||[],s.empresaId):String((db.vendas||[]).length+1),
    clienteId:o.clienteId, data:new Date().toISOString(),
    itens:pecas.map(it=>({produtoId:it.produtoId,qtd:it.qtd,preco:it.preco,subtotal:n(it.qtd)*n(it.preco),descricao:it.descricao})),
    desconto:0,total,formaPagamento:'Chamado',status:'faturado',
    chamadoId:o.id,chamadoNumero:o.numero,criadoPor:s.usuarioId,criadoPorNome:s.usuarioNome
  };
  db.vendas=db.vendas||[]; db.vendas.push(venda);
  pecas.forEach(it=>{ const pr=(db.produtos||[]).find(x=>x.id===it.produtoId); if(pr&&pr.categoria!=='Serviço') pr.estoque=n(pr.estoque)-n(it.qtd); });
  db.contasReceber=db.contasReceber||[];
  db.contasReceber.push({id:(typeof uid==='function'?uid('cr'):'cr_'+Date.now()),empresaId:s.empresaId,origem:'chamado',clienteId:o.clienteId,descricao:'Venda do chamado '+(o.numero||''),valor:total,vencimento:new Date().toISOString(),status:'aberto',vendaId:venda.id,chamadoId:o.id,criadoPor:s.usuarioId,criadoPorNome:s.usuarioNome});
  o.vendaId=venda.id; o.vendaNumero=venda.numero;
  aviso('Venda '+venda.numero+' criada porque o chamado foi finalizado. Entrou no financeiro.','Venda do chamado');
}

// ── PDF: linhas + contadores maiores ──
window.imprimirChamadoPDF=function(osId){
  const o=(db.os||[]).find(x=>x.id===osId);
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  const cl=cli(o.clienteId)||{};
  const loja=dadosLoja();
  const fin=o.status==='concluido';
  const p=(db.parque||[]).find(x=>x.equipamentoId===o.equipamentoId);
  const showColor=!o.contratoId||temColor(p);
  const pecas=Array.isArray(o.pecas)&&o.pecas.length?o.pecas.map(it=>({d:it.descricao||'',q:it.qtd||''})):[];
  while(pecas.length<5) pecas.push({d:'',q:''});
  const cell=(x)=>fin?esc(x==null||x===''?'':x):'';
  const dataCad=dataBR(o.criadoEm||o.dataAbertura);
  const dataAt=fin&&o.dataAtendimento?dataBR(o.dataAtendimento):'&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    @page{margin:12mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
    body{font-family:Arial,sans-serif;margin:0;color:#0f172a;font-size:12px}
    .head{display:flex;gap:14px;align-items:center;padding-bottom:12px;border-bottom:3px solid #0a1e8a}
    .head img{height:58px}.head h1{margin:0;color:#0a1e8a;font-size:20px}
    .muted{color:#64748b;font-size:11px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
    .card{border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;background:#f8fafc}
    .faixa{background:#0a1e8a!important;color:#fff!important;text-align:center;font-weight:800;padding:8px;margin:14px 0 6px;border-radius:8px;letter-spacing:.06em}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}
    th{background:#eef2ff!important;color:#0a1e8a}
    .box-write{border:1px solid #94a3b8;border-radius:10px;min-height:88px;padding:10px 12px;
      background-image:repeating-linear-gradient(#fff 0 23px,#cbd5e1 23px 24px);background-size:100% 24px}
    .cnt{min-height:52px;font-size:18px;font-family:monospace}
    .data{border-bottom:1px solid #334155;min-width:110px;display:inline-block;text-align:center}
    @media print{.no-print{display:none!important}}
  </style></head><body>
  <div class="no-print"><button onclick="window.print()">Imprimir</button></div>
  <div class="head"><img src="${logoSrc()}"><div><h1>${esc(loja.fantasia)}</h1><div class="muted">${esc(loja.nome)}</div><div class="muted">${esc(loja.cnpj)}</div></div>
    <div style="margin-left:auto;text-align:right"><b>OS ${esc(o.numero||'')}</b><div class="muted">${fin?'Finalizado':'Em aberto'}</div></div></div>
  <div class="cards">
    <div class="card"><div class="muted">CLIENTE</div><b>${esc(cl.nome||'')}</b><div class="muted">${esc(cl.documento||'')} • ${esc(cl.telefone||'')}</div></div>
    <div class="card"><div class="muted">ATENDIMENTO</div>
      <div>Técnico: <b>${esc(o.tecnico||'')}</b></div>
      <div>Motivo / Defeito: <b>${esc(o.descricao||'')}</b></div>
      <div class="muted">Data de cadastro: ${esc(dataCad)}</div>
    </div>
  </div>
  <table><tr><th>Contador preto atual</th>${showColor?'<th>Contador color atual</th>':''}</tr>
  <tr><td><div class="box-write cnt">${cell(o.contadorAtual)}</div></td>
  ${showColor?`<td><div class="box-write cnt">${cell(o.contadorColor)}</div></td>`:''}</tr></table>
  <div class="faixa">SERVIÇOS EXECUTADOS</div>
  <div class="box-write">${cell(o.servicos)}</div>
  <div class="faixa">PRODUTOS / PEÇAS USADAS</div>
  <table><thead><tr><th style="width:78%">Descrição</th><th>Quantidade</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(it=>`<tr><td>${fin?esc(it.d):''}&nbsp;</td><td>${fin?esc(it.q):''}&nbsp;</td></tr>`).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="box-write">${cell(o.observacao)}</div>
  <p style="margin-top:16px"><b>Data do atendimento:</b> <span class="data">${dataAt}</span></p>
  </body></html>`;
  const w=window.open('','_blank'); if(w){ w.document.write(html); w.document.close(); }
};

// X de peça NÃO fecha o chamado
document.addEventListener('click', function(ev){
  const btn=ev.target.closest&&ev.target.closest('button');
  if(!btn) return;
  if(btn.classList.contains('lc-peca-del') || btn.classList.contains('lc-peca-add') || btn.closest('#ko-pecas-list') || btn.closest('#ca-pecas-list') || btn.closest('#ko-prod-results') || btn.closest('#ca-prod-results')){
    ev.stopPropagation();
  }
}, true);

console.log('[DIGICOPY] ajustes_v5175_patch.js');
})();
