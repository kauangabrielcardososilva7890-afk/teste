// PATCH v5.17.2 — lista finalizar, color abaixo do preto, busca, PDF, ESC sem loop
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function txt(v){ return String(v??'').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb===undefined?0:fb); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function dia(v){ return String(v||'').slice(0,10); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Aviso'); }
function confirmar(m,t){ return typeof window.confirmSistema==='function' ? window.confirmSistema(m,t||'Confirmar') : Promise.resolve(false); }

function temColor(p, eq){
  const meds=(p&&(p.medidoresConfig||p.medidores))||{};
  if(meds.colorA4 && meds.colorA4.modalidade && meds.colorA4.modalidade!=='inativo') return true;
  if(meds.colorA3 && meds.colorA3.modalidade && meds.colorA3.modalidade!=='inativo') return true;
  return false;
}
function logoSrc(){ return window.DIGICOPY_LOGO || './logo.png'; }
function dadosLoja(){
  const s=sess()||{};
  const emp=(db.empresas||[]).find(e=>e.id===s.empresaId)||{};
  const cfg=(db.config&&db.config.empresa)||{};
  return { nome:emp.nome||cfg.nome||s.empresaNome||'DIGICOPY', fantasia:emp.fantasia||'DIGICOPY', cnpj:emp.cnpj||s.cnpj||cfg.cnpj||'', fone:cfg.fone||emp.telefone||'', end:cfg.endereco||emp.endereco||'' };
}

// ── 5 Todos nos chamados: limpa de/até ──
window.__lcChamFiltro = Object.assign({ tab:'hoje', de:'', ate:'', campo:'nome', q:'', origem:'todos' }, window.__lcChamFiltro||{});
const _hist = window.abrirHistoricoChamadosGeral;
const _ctrList = window.abrirChamadosContrato;

window.lcFiltroTodos = function(contratoId){
  window.__lcChamFiltro.tab='todos';
  window.__lcChamFiltro.de='';
  window.__lcChamFiltro.ate='';
  window.__lcChamFiltro.q='';
  if(contratoId) abrirChamadosContrato(contratoId);
  else abrirHistoricoChamadosGeral();
};

// ── 2.2 finalizar na LISTA (checkboxes) ──
window.finalizarChamadosSelecionados = function(contratoId){
  const ids = Array.from(document.querySelectorAll('.lc-chk-os:checked')).map(x=>x.value);
  if(!ids.length){ aviso('Marque ao menos um chamado.','Aviso'); return; }
  confirmar('Deseja finalizar '+ids.length+' chamado(s)?','Finalizar chamados').then(ok=>{
    if(!ok) return;
    ids.forEach(id=>{
      const o=(db.os||[]).find(x=>x.id===id);
      if(o){ o.status='concluido'; o.dataFechamento=new Date().toISOString(); o.faturado=true; }
    });
    if(typeof saveDB==='function') saveDB();
    if(contratoId) abrirChamadosContrato(contratoId);
    else abrirHistoricoChamadosGeral();
  });
};

function injetarChecksLista(contratoId){
  const body=document.getElementById('modal-body'); if(!body) return;
  const table=body.querySelector('table'); if(!table) return;
  const thead=table.querySelector('thead tr');
  if(thead && !thead.querySelector('.lc-th-chk')){
    const th=document.createElement('th');
    th.className='lc-th-chk px-2 py-2';
    th.innerHTML='<input type="checkbox" id="lc-chk-all" title="Marcar todos">';
    thead.insertBefore(th, thead.firstChild);
    document.getElementById('lc-chk-all').onchange=function(){
      body.querySelectorAll('.lc-chk-os').forEach(c=>c.checked=this.checked);
    };
  }
  table.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.querySelector('.lc-chk-os')) return;
    const onclick=tr.getAttribute('onclick')||tr.getAttribute('ondblclick')||'';
    const m=onclick.match(/'([^']+)'/);
    const id=m&&m[1];
    if(!id) return;
    const td=document.createElement('td');
    td.className='px-2 py-2';
    td.innerHTML=`<input type="checkbox" class="lc-chk-os" value="${id}" onclick="event.stopPropagation()">`;
    tr.insertBefore(td, tr.firstChild);
  });
  if(!document.getElementById('lc-btn-fin-sel')){
    const bar=document.getElementById('lc-filtros-ctr') || body.querySelector('.flex.flex-wrap') || body.firstElementChild;
    const btn=document.createElement('button');
    btn.id='lc-btn-fin-sel';
    btn.type='button';
    btn.className='h-10 px-4 rounded-xl bg-emerald-600 text-white font-bold text-[12px]';
    btn.textContent='Finalizar selecionados';
    btn.onclick=function(){ finalizarChamadosSelecionados(contratoId||''); };
    if(bar) bar.appendChild(btn);
  }
  // Todos limpa datas
  body.querySelectorAll('button').forEach(b=>{
    if(low(b.textContent)==='todos' && !b.dataset.lcTodos){
      b.dataset.lcTodos='1';
      b.onclick=function(ev){ ev.preventDefault(); lcFiltroTodos(contratoId||''); };
    }
  });
}

if(typeof _ctrList==='function'){
  window.abrirChamadosContrato=function(contratoId){
    window.__lcChamFormAberto=false;
    window.__lcChamDirty=false;
    window.__lcListaContratoId=contratoId;
    const r=_ctrList.apply(this,arguments);
    setTimeout(()=>injetarChecksLista(contratoId),60);
    return r;
  };
}
if(typeof _hist==='function'){
  window.abrirHistoricoChamadosGeral=function(){
    window.__lcChamFormAberto=false;
    const r=_hist.apply(this,arguments);
    setTimeout(()=>injetarChecksLista(''),60);
    return r;
  };
}

// ── 2.1 color embaixo do preto + qtd ──
function montarColorAbaixoDoPreto(){
  const pb=document.getElementById('ko-cont-atu')||document.getElementById('ca-cont-atu');
  if(!pb) return;
  const grid=pb.closest('.grid')||pb.parentElement.parentElement;
  let block=document.getElementById('lc-color-block');
  if(!block){
    block=document.createElement('div');
    block.id='lc-color-block';
    block.className='grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 border rounded-xl mt-3';
    block.innerHTML=`<div><label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Color Antigo</label><input id="lc-cont-color-ant" type="number" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono"></div>
      <div><label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Color Atual</label><input id="lc-cont-color-atu" type="number" class="w-full h-10 px-3 rounded-xl border font-mono" oninput="lcCalcColor()"></div>
      <div><label class="block font-bold text-emerald-700 mb-1 text-[11px] uppercase">Qtd Color</label><input id="lc-qtd-color" type="number" readonly class="w-full h-10 px-3 rounded-xl border bg-emerald-50 font-bold text-emerald-700"></div>`;
    if(grid&&grid.parentElement) grid.parentElement.insertBefore(block, grid.nextSibling);
    else document.getElementById('ko-painel-detalhes')?.appendChild(block);
  }
  const tabs=document.getElementById('lc-status-tabs');
  if(tabs) tabs.remove();
}

window.lcCalcColor=function(){
  const ant=n(document.getElementById('lc-cont-color-ant')?.value,0);
  const raw=document.getElementById('lc-cont-color-atu')?.value;
  const out=document.getElementById('lc-qtd-color');
  if(!out) return;
  if(raw===''||raw==null){ out.value=''; return; }
  out.value=Math.max(0, n(raw,ant)-ant);
};

window.__lcAtualizarColor=function(equipId){
  const p=(db.parque||[]).find(x=>x.equipamentoId===equipId);
  const eq=(db.equipamentos||[]).find(x=>x.id===equipId);
  const tem=temColor(p,eq);
  const block=document.getElementById('lc-color-block');
  const el=document.getElementById('lc-cont-color-atu');
  const ant=document.getElementById('lc-cont-color-ant');
  if(ant) ant.value = eq && eq.contadorCor!=null && eq.contadorCor!=='' ? eq.contadorCor : '';
  if(block) block.style.display = tem ? '' : 'none';
  if(el){
    if(tem){ el.disabled=false; el.classList.remove('bg-slate-100'); }
    else { el.disabled=true; el.value=''; }
  }
  lcCalcColor();
};

// ── 6 busca impressora igual leituras ──
function montarBuscaImpressora(){
  const sel=document.getElementById('ko-equip');
  if(!sel || document.getElementById('lc-imp-busca-campo')) return;
  const wrap=sel.closest('.rounded-xl')||sel.parentElement;
  const box=document.createElement('div');
  box.className='mt-2 grid grid-cols-1 md:grid-cols-4 gap-2';
  box.innerHTML=`<select id="lc-imp-busca-campo" class="h-10 px-2 rounded-xl border text-[12px]"><option value="impressora">Impressora</option><option value="serial">Serial</option><option value="patrimonio">Patrimônio</option><option value="departamento">Departamento</option><option value="localizacao">Localização</option></select>
    <input id="lc-imp-busca-q" class="md:col-span-2 h-10 px-3 rounded-xl border" placeholder="Pesquisar impressora..." onkeydown="if(event.key==='Enter'){event.preventDefault();lcBuscarImpressoraChamado()}">
    <button type="button" onclick="lcBuscarImpressoraChamado()" class="h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i></button>`;
  wrap.appendChild(box);
}

window.lcBuscarImpressoraChamado=function(){
  const sel=document.getElementById('ko-equip'); if(!sel) return;
  const campo=document.getElementById('lc-imp-busca-campo')?.value||'impressora';
  const q=low(document.getElementById('lc-imp-busca-q')?.value||'');
  const cid=window.modalContext&&window.modalContext.contratoId;
  const maq=(db.parque||[]).filter(p=>p.contratoId===cid && p.status!=='inativo');
  const opts=maq.filter(p=>{
    if(!q) return true;
    const e=(db.equipamentos||[]).find(x=>x.id===p.equipamentoId)||{};
    const alvo={impressora:[e.modelo,e.descricao].join(' '),serial:e.serie,patrimonio:e.patrimonio||p.patrimonio,departamento:p.setor,localizacao:p.localInstalacao||p.enderecoInstalacao}[campo]||'';
    return low(alvo).includes(q);
  });
  const cur=sel.value;
  sel.innerHTML='<option value="">Outro equipamento</option>'+opts.map(p=>{
    const e=(db.equipamentos||[]).find(x=>x.id===p.equipamentoId)||{};
    return `<option value="${p.equipamentoId}">${esc(e.modelo||'')} (Patr. ${esc(e.patrimonio||'-')})</option>`;
  }).join('');
  if(cur) sel.value=cur;
};

// ── 4.1 busca produto igual vendas + vira venda ──
function montarBuscaProduto(){
  const sel=document.getElementById('ko-produto');
  if(!sel) return;
  const box=sel.closest('.rounded-xl')||sel.parentElement;
  if(document.getElementById('lc-prod-search')) return;
  sel.style.display='none';
  const lab=box.querySelector('p.font-bold');
  if(lab) lab.textContent='Produtos / Peças (vira venda do chamado)';
  const inp=document.createElement('input');
  inp.id='lc-prod-search';
  inp.placeholder='Digite nome, código, ref...';
  inp.className='w-full h-11 px-3 rounded-xl border mb-2';
  const res=document.createElement('div');
  res.id='lc-prod-results';
  res.className='hidden max-h-[220px] overflow-auto rounded-xl border bg-white mb-2';
  box.insertBefore(inp, sel);
  box.insertBefore(res, sel);
  inp.oninput=function(){ lcBuscarProdutoChamado(this.value); };
}

window.lcBuscarProdutoChamado=function(q){
  const res=document.getElementById('lc-prod-results'); if(!res) return;
  const s=sess(); const lowq=low(q);
  if(!lowq){ res.classList.add('hidden'); res.innerHTML=''; return; }
  let lista=(db.produtos||[]).filter(p=>(!s||p.empresaId===s.empresaId)&&p.status!=='inativo'&&p.status!=='excluido');
  lista=lista.filter(p=>[p.nome,p.sku,p.codigo,p.categoria,p.fabricante].some(v=>low(v).includes(lowq))).slice(0,15);
  if(!lista.length){ res.innerHTML='<p class="p-3 text-[12px] text-slate-400">Nenhum produto</p>'; res.classList.remove('hidden'); return; }
  res.innerHTML=lista.map(p=>`<button type="button" class="w-full text-left px-3 py-2 border-b hover:bg-blue-50" onclick="lcAddProdutoChamado('${p.id}')"><b>${esc(p.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(p.sku||p.codigo||'')} • ${typeof fmtMoney==='function'?fmtMoney(p.preco||0):p.preco}</span></button>`).join('');
  res.classList.remove('hidden');
};

window.lcAddProdutoChamado=function(prodId){
  const p=(db.produtos||[]).find(x=>x.id===prodId); if(!p) return;
  window.__chamadoPecasTemp=window.__chamadoPecasTemp||[];
  const ex=window.__chamadoPecasTemp.find(i=>i.produtoId===prodId);
  if(ex) ex.qtd+=1; else window.__chamadoPecasTemp.push({produtoId:prodId,descricao:p.nome,qtd:1,preco:n(p.preco),subtotal:n(p.preco)});
  if(typeof renderPecasChamado==='function') renderPecasChamado();
  const res=document.getElementById('lc-prod-results'); if(res) res.classList.add('hidden');
  const inp=document.getElementById('lc-prod-search'); if(inp) inp.value='';
};

function criarVendaDoChamado(o){
  const pecas=o.pecas||window.__chamadoPecasTemp||[];
  if(!pecas.length) return;
  const s=sess(); if(!s) return;
  const total=pecas.reduce((sum,it)=>sum+n(it.qtd)*n(it.preco),0);
  if(total<=0) return;
  if((db.vendas||[]).some(v=>v.chamadoId===o.id)) return;
  const venda={
    id:(typeof uid==='function'?uid('vda'):'vda_'+Date.now()),
    empresaId:s.empresaId,
    numero: typeof proximoNumeroSimples==='function'?proximoNumeroSimples('venda',db.vendas||[],s.empresaId):String((db.vendas||[]).length+1),
    clienteId:o.clienteId,
    data:new Date().toISOString(),
    itens:pecas.map(it=>({produtoId:it.produtoId,qtd:it.qtd,preco:it.preco,subtotal:n(it.qtd)*n(it.preco),descricao:it.descricao})),
    desconto:0,total,formaPagamento:'Chamado',status:'faturado',
    chamadoId:o.id, chamadoNumero:o.numero,
    criadoPor:s.usuarioId, criadoPorNome:s.usuarioNome
  };
  db.vendas=db.vendas||[]; db.vendas.push(venda);
  pecas.forEach(it=>{ const pr=(db.produtos||[]).find(x=>x.id===it.produtoId); if(pr && pr.categoria!=='Serviço') pr.estoque=n(pr.estoque)-n(it.qtd); });
  db.contasReceber=db.contasReceber||[];
  db.contasReceber.push({id:(typeof uid==='function'?uid('cr'):'cr_'+Date.now()),empresaId:s.empresaId,origem:'chamado',clienteId:o.clienteId,descricao:'Venda do chamado '+ (o.numero||'') ,valor:total,vencimento:new Date().toISOString(),status:'aberto',vendaId:venda.id,chamadoId:o.id,criadoPor:s.usuarioId,criadoPorNome:s.usuarioNome});
  o.vendaId=venda.id; o.vendaNumero=venda.numero;
  if(typeof saveDB==='function') saveDB();
  aviso('Foi criada a venda '+venda.numero+' relacionada a este chamado. Ela também entra no financeiro.','Venda do chamado');
}

// ── montar UI do form ──
const _montar=window.__lcMontarChamadoUI;
window.__lcMontarChamadoUI=function(contrato){
  if(_montar) _montar(contrato);
  const tabs=document.getElementById('lc-status-tabs'); if(tabs) tabs.remove();
  montarColorAbaixoDoPreto();
  montarBuscaImpressora();
  montarBuscaProduto();
  // contrato: some busca/edição de cliente
  if(contrato){
    document.querySelectorAll('#ca-busca-cliente, #ca-clientes-result').forEach(el=>{
      const box=el.closest('.rounded-xl')||el.parentElement; if(box) box.remove();
    });
  }
  const eqSel=document.getElementById('ko-equip')?.value;
  if(eqSel) window.__lcAtualizarColor(eqSel);
  else {
    const block=document.getElementById('lc-color-block');
    if(block) block.style.display='none';
  }
};

const _open=window.openModalChamadoCompleto;
if(typeof _open==='function'){
  window.openModalChamadoCompleto=function(osId,contratoId){
    window.__lcChamFormAberto=true;
    window.__lcChamDirty=false;
    window.modalContext=Object.assign(window.modalContext||{},{type:'chamado',id:osId||'',contratoId:contratoId||''});
    const r=_open.apply(this,arguments);
    setTimeout(()=>window.__lcMontarChamadoUI(true),50);
    setTimeout(()=>window.__lcMontarChamadoUI(true),200);
    return r;
  };
}

// wrap save: cliente do contrato + venda
const _sav=window.salvarChamadoCompleto;
if(typeof _sav==='function' && !_sav.__v5172){
  window.salvarChamadoCompleto=function(osId,contratoId){
    const c=(db.contratos||[]).find(x=>x.id===contratoId);
    if(c && c.clienteId){
      // garante cliente do contrato
    }
    const extras={
      dataAtendimento:document.getElementById('lc-data-atend')?.value||'',
      contadorColor: document.getElementById('lc-cont-color-atu') && !document.getElementById('lc-cont-color-atu').disabled ? n(document.getElementById('lc-cont-color-atu').value,null) : null,
      quantidadeColor: n(document.getElementById('lc-qtd-color')?.value,0)
    };
    const r=_sav.apply(this,arguments);
    try{
      let o=osId && (db.os||[]).find(x=>x.id===osId);
      if(!o) o=(db.os||[]).slice().reverse().find(x=>x.contratoId===contratoId) || (db.os||[]).slice(-1)[0];
      if(o){
        if(c) o.clienteId=c.clienteId;
        Object.assign(o,extras);
        if(o.pecas && o.pecas.length) criarVendaDoChamado(o);
        if(typeof saveDB==='function') saveDB();
      }
    }catch(e){}
    window.__lcChamFormAberto=false;
    return r;
  };
  window.salvarChamadoCompleto.__v5172=true;
}

// ── 4.2 PDF inspirado, mais limpo ──
window.imprimirChamadoPDF=function(osId){
  const o=(db.os||[]).find(x=>x.id===osId);
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  const cli=(db.clientes||[]).find(c=>c.id===o.clienteId)||{};
  const loja=dadosLoja();
  const fin=o.status==='concluido';
  const p=(db.parque||[]).find(x=>x.equipamentoId===o.equipamentoId);
  const showColor=!o.contratoId || temColor(p,(db.equipamentos||[]).find(e=>e.id===o.equipamentoId));
  const pecas=Array.isArray(o.pecas)&&o.pecas.length?o.pecas.map(it=>({d:it.descricao||'',q:it.qtd||''})):[];
  while(pecas.length<5) pecas.push({d:'',q:''});
  const cell=(x)=>fin?esc(x==null||x===''?'':x):'';
  const dataAt=fin&&o.dataAtendimento?dia(o.dataAtendimento).split('-').reverse().join('/'):'&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    @page{margin:14mm}
    body{font-family:Inter,Arial,sans-serif;margin:0;color:#0f172a;font-size:12px;background:#fff}
    .sheet{max-width:760px;margin:0 auto;padding:8px 4px}
    .head{display:flex;gap:14px;align-items:center;padding-bottom:12px;border-bottom:3px solid #0a1e8a}
    .head img{height:58px}
    .head h1{margin:0;font-size:20px;color:#0a1e8a;letter-spacing:-.02em}
    .muted{color:#64748b;font-size:11px}
    .os{margin-left:auto;text-align:right}
    .os b{font-size:18px;color:#0a1e8a}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
    .card{border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;background:#f8fafc}
    .card h3{margin:0 0 6px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#64748b}
    .faixa{background:linear-gradient(90deg,#0a1e8a,#1d4ed8);color:#fff;border-radius:8px;text-align:center;font-weight:800;padding:7px;margin:14px 0 6px;letter-spacing:.08em;font-size:11px}
    table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border-radius:10px;border:1px solid #e2e8f0}
    th{background:#eef2ff;color:#0a1e8a;font-size:11px;text-align:left;padding:8px}
    td{padding:9px 8px;border-top:1px solid #eef2f7;min-height:26px}
    .line{border:1px dashed #cbd5e1;border-radius:10px;min-height:40px;padding:10px;background:#fff}
    .foot{margin-top:16px;display:flex;justify-content:space-between;align-items:flex-end}
    .data{border-bottom:1px solid #334155;min-width:110px;text-align:center;letter-spacing:1px;display:inline-block}
    @media print{.no-print{display:none}}
  </style></head><body><div class="sheet">
  <div class="no-print" style="margin-bottom:10px"><button onclick="window.print()">Imprimir</button></div>
  <div class="head"><img src="${logoSrc()}" alt="logo"><div><h1>${esc(loja.fantasia)}</h1><div class="muted">${esc(loja.nome)}</div><div class="muted">${esc(loja.cnpj)} ${loja.fone?('• '+esc(loja.fone)):''}</div></div>
    <div class="os"><b>OS ${esc(o.numero||'')}</b><div class="muted">${fin?'Finalizado':'Em aberto'}</div></div></div>
  <div class="cards">
    <div class="card"><h3>Cliente</h3><div><b>${esc(cli.nome||'')}</b></div><div class="muted">${esc(cli.documento||'')} • ${esc(cli.telefone||'')}</div><div class="muted">${esc(cli.cidade||'')} ${esc(cli.estado||'')}</div></div>
    <div class="card"><h3>Atendimento</h3><div>Técnico: <b>${esc(o.tecnico||'')}</b></div><div class="muted">${!o.contratoId?('Impressora: '+esc(o.modelo||'')+' • Serial '+esc(o.serie||'')):'Contrato'}</div></div>
  </div>
  <table><tr><th>Contador preto atual</th>${showColor?'<th>Contador color atual</th>':''}</tr>
  <tr><td>${cell(o.contadorAtual)}</td>${showColor?`<td>${cell(o.contadorColor)}</td>`:''}</tr></table>
  <div class="faixa">MOTIVO / DEFEITO</div>
  <div class="line">${cell(o.descricao)}</div>
  <div class="faixa">PRODUTO / PEÇAS</div>
  <table><thead><tr><th style="width:78%">Descrição</th><th>Quantidade</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(it=>`<tr><td>${fin?esc(it.d):''}</td><td>${fin?esc(it.q):''}</td></tr>`).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="line">${cell(o.observacao||o.servicos)}</div>
  <div class="foot"><div><b>Data do atendimento</b><br><span class="data">${dataAt}</span></div><div class="muted">DIGICOPY</div></div>
  </div></body></html>`;
  const w=window.open('','_blank'); if(w){ w.document.write(html); w.document.close(); }
};

// ── 4.5 / 7 sair SEM loop, volta para lista do contrato ──
window.__lcAskLock=false;
function voltarListaChamado(){
  window.__lcChamFormAberto=false;
  window.__lcChamDirty=false;
  const cid=window.modalContext&&window.modalContext.contratoId;
  if(cid && typeof window.abrirChamadosContrato==='function'){
    window.abrirChamadosContrato(cid);
    return;
  }
  if(typeof window.abrirHistoricoChamadosGeral==='function'){
    window.abrirHistoricoChamadosGeral();
    return;
  }
  if(typeof window.closeModal==='function') window.closeModal(true);
}

function perguntarSairUmaVez(){
  if(window.__lcAskLock) return;
  if(!window.__lcChamFormAberto){ voltarListaChamado(); return; }
  window.__lcAskLock=true;
  confirmar('Deseja salvar este chamado?','Sair do chamado').then(ok=>{
    window.__lcAskLock=false;
    if(ok){
      const cid=window.modalContext&&window.modalContext.contratoId;
      if(cid) window.salvarChamadoCompleto && window.salvarChamadoCompleto(window.modalContext.id||'', cid);
      else window.salvarChamadoAvulso && window.salvarChamadoAvulso(window.modalContext&&window.modalContext.id||'');
    }
    voltarListaChamado();
  });
}

window.closeModal=function(force){
  if(force){ window.__lcChamFormAberto=false; const root=document.getElementById('modal-root'); if(root) root.classList.add('hidden'); return; }
  if(window.__lcChamFormAberto){ perguntarSairUmaVez(); return; }
  const root=document.getElementById('modal-root'); if(root) root.classList.add('hidden');
};

window.voltarNivelModal=function(e){
  if(e&&e.preventDefault) e.preventDefault();
  if(window.__lcChamFormAberto){ perguntarSairUmaVez(); return; }
  const footer=document.getElementById('modal-footer');
  const btns=footer?Array.from(footer.querySelectorAll('button')):[];
  const voltar=btns.find(b=>/voltar/i.test(b.textContent||''));
  if(voltar){ voltar.click(); return; }
  window.closeModal(true);
};

// remove o listener antigo de click que empilhava avisos: substitui por um só
document.addEventListener('click', function(ev){
  if(!window.__lcChamFormAberto) return;
  const btn=ev.target.closest&&ev.target.closest('button');
  if(!btn) return;
  if(btn.closest('#aviso-system-modal') || (btn.id||'').includes('aviso-system')) return;
  const t=low(btn.textContent);
  if(/^(cancelar|fechar|sair|×|x)$/.test(t) || (btn.querySelector&&btn.querySelector('.ph-x') && btn.closest('#modal-box'))){
    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
    perguntarSairUmaVez();
  }
}, true);

// 5 Leituras Todos — reabre lista sem filtro
window.lcLeiturasTodos=function(contratoId){
  const de=document.getElementById('lc-lei-de'), ate=document.getElementById('lc-lei-ate');
  if(de) de.value=''; if(ate) ate.value='';
  document.querySelectorAll('#modal-body tbody tr').forEach(tr=>tr.style.display='');
};

const _lei=window.abrirLeiturasContrato;
window.abrirLeiturasContrato=function(contratoId){
  const r=_lei?_lei.apply(this,arguments):undefined;
  setTimeout(()=>{
    const td=document.getElementById('lc-lei-todos');
    if(td) td.onclick=function(){ lcLeiturasTodos(contratoId); };
  },80);
  return r;
};

console.log('[DIGICOPY] ajustes_v5172_patch.js');
})();
