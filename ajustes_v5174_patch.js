// PATCH v5.17.4 — contador oficial da leitura, peças, PDF print, Todos, busca impressora
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function txt(v){ return String(v??'').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb===undefined?0:fb); }
function dia(v){ return String(v||'').slice(0,10); }
function dataBR(v){
  const s=dia(v); if(!s) return '';
  const p=s.split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;
}
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Aviso'); }
function confirmar(m,t){ return typeof window.confirmSistema==='function'?window.confirmSistema(m,t||'Confirmar'):Promise.resolve(false); }
function logoSrc(){ return window.DIGICOPY_LOGO || './logo.png'; }
function temColor(p){
  const meds=(p&&(p.medidoresConfig||p.medidores))||{};
  return !!(meds.colorA4&&meds.colorA4.modalidade&&meds.colorA4.modalidade!=='inativo')
      || !!(meds.colorA3&&meds.colorA3.modalidade&&meds.colorA3.modalidade!=='inativo');
}
function dadosLoja(){
  const s=sess()||{};
  const emp=(db.empresas||[]).find(e=>e.id===s.empresaId)||{};
  const cfg=(db.config&&db.config.empresa)||{};
  return { nome:emp.nome||cfg.nome||s.empresaNome||'DIGICOPY', fantasia:emp.fantasia||'DIGICOPY', cnpj:emp.cnpj||s.cnpj||cfg.cnpj||'', fone:cfg.fone||'', end:cfg.endereco||emp.endereco||'' };
}

// ── 2.1 contador ANTIGO = última LEITURA (não último chamado) ──
function contadorOficial(equipId, cor){
  const eq=(db.equipamentos||[]).find(e=>e.id===equipId)||{};
  let best={d:'', pb:eq.contadorPB, cor:eq.contadorCor};
  (db.leituras||[]).forEach(l=>{
    const d=l.dataLeitura||l.criadoEm||'';
    if(l.equipamentoId===equipId){
      if(!best.d || new Date(d)>=new Date(best.d||0)){
        best={d, pb:l.contadorPB!=null?l.contadorPB:best.pb, cor:l.contadorCor!=null?l.contadorCor:best.cor};
      }
    }
    (l.itens||[]).forEach(it=>{
      if(it.equipamentoId!==equipId && it.parqueId){
        const p=(db.parque||[]).find(x=>x.id===it.parqueId);
        if(!p || p.equipamentoId!==equipId) return;
      } else if(it.equipamentoId && it.equipamentoId!==equipId) return;
      const dd=l.dataLeitura||l.criadoEm||d;
      if(!best.d || new Date(dd)>=new Date(best.d||0)){
        if(/color/i.test(it.medidor||it.medidorLabel||'')) best={d:dd, pb:best.pb, cor:it.atual};
        else if(/preto|pb|a4/i.test(it.medidor||it.medidorLabel||'') || !it.medidor) best={d:dd, pb:it.atual, cor:best.cor};
      }
    });
  });
  return cor ? n(best.cor,0) : n(best.pb,0);
}

const _auto=window.autoPreencherDadosChamado;
if(typeof _auto==='function'){
  window.autoPreencherDadosChamado=function(equipId){
    const r=_auto.apply(this,arguments);
    const ant=document.getElementById('ko-cont-ant');
    if(ant && equipId) ant.value=contadorOficial(equipId,false);
    const atu=document.getElementById('ko-cont-atu');
    if(atu && (atu.value==='0'||atu.value==='')) { /* deixa vazio no atual */ }
    if(typeof calcImpressoesChamado==='function') calcImpressoesChamado();
    setTimeout(()=>{
      window.__lcAtualizarColor&&window.__lcAtualizarColor(equipId);
      const ca=document.getElementById('lc-cont-color-ant');
      if(ca && equipId) ca.value=contadorOficial(equipId,true);
    },15);
    return r;
  };
}

function avisoContadorOficial(){
  if(document.getElementById('lc-aviso-cont')) return;
  const grid=(document.getElementById('ko-cont-atu')||{}).closest&&document.getElementById('ko-cont-atu').closest('.grid');
  if(!grid||!grid.parentElement) return;
  const p=document.createElement('p');
  p.id='lc-aviso-cont';
  p.className='text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2';
  p.textContent='Este contador PRETO do chamado NÃO altera o contador da impressora usado na leitura. O contador antigo vem da última LEITURA, não do último chamado.';
  grid.parentElement.insertBefore(p, grid.nextSibling);
}

function montarColor(){
  const pb=document.getElementById('ko-cont-atu'); if(!pb) return;
  const grid=pb.closest('.grid');
  let block=document.getElementById('lc-color-block');
  if(!block){
    block=document.createElement('div');
    block.id='lc-color-block';
    block.style.display='none';
    block.className='grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 border rounded-xl mt-3';
    block.innerHTML=`<div><label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Color Antigo</label><input id="lc-cont-color-ant" type="number" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono"></div>
      <div><label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Color Atual</label><input id="lc-cont-color-atu" type="number" class="w-full h-10 px-3 rounded-xl border font-mono" oninput="lcCalcColor()"></div>
      <div><label class="block font-bold text-emerald-700 mb-1 text-[11px] uppercase">Qtd Color</label><input id="lc-qtd-color" type="number" readonly class="w-full h-10 px-3 rounded-xl border bg-emerald-50 font-bold"></div>`;
    if(grid&&grid.parentElement) grid.parentElement.insertBefore(block, (document.getElementById('lc-aviso-cont')||grid).nextSibling);
  }
}

window.lcCalcColor=function(){
  const ant=n(document.getElementById('lc-cont-color-ant')?.value,0);
  const raw=document.getElementById('lc-cont-color-atu')?.value;
  const out=document.getElementById('lc-qtd-color'); if(!out) return;
  out.value=(raw===''||raw==null)?'':Math.max(0,n(raw,ant)-ant);
};

window.__lcAtualizarColor=function(equipId){
  const p=(db.parque||[]).find(x=>x.equipamentoId===equipId);
  const tem=temColor(p);
  const block=document.getElementById('lc-color-block');
  const ant=document.getElementById('lc-cont-color-ant');
  const el=document.getElementById('lc-cont-color-atu');
  if(ant) ant.value=contadorOficial(equipId,true);
  if(block) block.style.display=tem?'':'none';
  if(el){ el.disabled=!tem; if(!tem) el.value=''; }
  lcCalcColor();
};

// ── 6 busca impressora SÓ no chamado de contrato ──
function montarBuscaImpressoraContrato(){
  const sel=document.getElementById('ko-equip');
  if(!sel || document.getElementById('lc-imp-busca-campo')) return;
  if(!(window.modalContext&&window.modalContext.contratoId)) return;
  const wrap=sel.closest('.rounded-xl')||sel.parentElement;
  const box=document.createElement('div');
  box.id='lc-busca-imp-ctr';
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
  sel.innerHTML='<option value="">Selecione</option>'+opts.map(p=>{
    const e=(db.equipamentos||[]).find(x=>x.id===p.equipamentoId)||{};
    return `<option value="${p.equipamentoId}">${esc(e.modelo||'')} — ${esc(e.serie||'')} — Patr. ${esc(e.patrimonio||'-')}</option>`;
  }).join('');
  if(cur) sel.value=cur;
};

// ── 4.1 Produtos / Peças usadas — busca tipo vendas ──
function montarPecasUsadas(){
  const box=document.querySelector('#ko-painel-detalhes .rounded-xl.border.p-3');
  const sel=document.getElementById('ko-produto');
  if(!sel) return;
  const lab=box&&box.querySelector('p.font-bold');
  if(lab) lab.textContent='Produtos / Peças usadas';
  if(document.getElementById('lc-prod-search')) return;
  const grid=sel.parentElement;
  const inp=document.createElement('input');
  inp.id='lc-prod-search';
  inp.className='w-full h-11 px-3 rounded-xl border mb-2';
  inp.placeholder='Digite nome, código, ref... (igual vendas)';
  const res=document.createElement('div');
  res.id='lc-prod-results';
  res.className='hidden max-h-[240px] overflow-auto rounded-xl border bg-white mb-2 shadow';
  if(grid&&grid.parentElement){
    grid.parentElement.insertBefore(inp, grid);
    grid.parentElement.insertBefore(res, grid);
  }
  inp.oninput=function(){ lcBuscarProdutoChamado(this.value); };
}

window.lcBuscarProdutoChamado=function(q){
  const res=document.getElementById('lc-prod-results'); if(!res) return;
  const s=sess(); const lowq=low(q);
  if(!lowq){ res.classList.add('hidden'); res.innerHTML=''; return; }
  let lista=(db.produtos||[]).filter(p=>(!s||p.empresaId===s.empresaId)&&p.status!=='inativo'&&p.status!=='excluido');
  lista=lista.filter(p=>[p.nome,p.sku,p.codigo,p.categoria,p.fabricante].some(v=>low(v).includes(lowq))).slice(0,15);
  if(!lista.length){ res.innerHTML='<p class="p-3 text-[12px] text-slate-400">Nenhum item</p>'; res.classList.remove('hidden'); return; }
  res.innerHTML=lista.map(p=>`<button type="button" class="w-full text-left px-3 py-2 border-b hover:bg-blue-50" onclick="lcAddProdutoChamado('${p.id}')"><b>${esc(p.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(p.sku||p.codigo||'')} • ${typeof fmtMoney==='function'?fmtMoney(p.preco||0):p.preco} • est ${n(p.estoque)}</span></button>`).join('');
  res.classList.remove('hidden');
};

window.lcAddProdutoChamado=function(prodId){
  const p=(db.produtos||[]).find(x=>x.id===prodId); if(!p) return;
  const sel=document.getElementById('ko-produto');
  if(sel){
    if(!sel.querySelector('option[value="'+prodId+'"]')){
      const op=document.createElement('option'); op.value=prodId; op.textContent=(p.sku||'')+' - '+(p.nome||''); sel.appendChild(op);
    }
    sel.value=prodId;
  }
  if(typeof adicionarPecaChamado==='function') adicionarPecaChamado();
  else {
    window.__chamadoPecasTemp=window.__chamadoPecasTemp||[];
    const ex=window.__chamadoPecasTemp.find(i=>i.produtoId===prodId);
    if(ex) ex.qtd+=1; else window.__chamadoPecasTemp.push({produtoId:prodId,descricao:p.nome,qtd:1,preco:n(p.preco),subtotal:n(p.preco)});
    if(typeof renderPecasChamado==='function') renderPecasChamado();
  }
  const res=document.getElementById('lc-prod-results'); if(res) res.classList.add('hidden');
  const inp=document.getElementById('lc-prod-search'); if(inp) inp.value='';
};

const _ui=window.__lcMontarChamadoUI;
window.__lcMontarChamadoUI=function(contrato){
  if(_ui) _ui(contrato);
  avisoContadorOficial();
  montarColor();
  if(contrato){ montarBuscaImpressoraContrato(); montarPecasUsadas(); }
  const eq=document.getElementById('ko-equip')?.value;
  if(eq) window.__lcAtualizarColor(eq);
};

const _open=window.openModalChamadoCompleto;
if(typeof _open==='function'){
  window.openModalChamadoCompleto=function(osId,contratoId){
    const r=_open.apply(this,arguments);
    setTimeout(()=>window.__lcMontarChamadoUI(true),60);
    setTimeout(()=>window.__lcMontarChamadoUI(true),220);
    return r;
  };
}

// ── 4.2 PDF ──
window.imprimirChamadoPDF=function(osId){
  const o=(db.os||[]).find(x=>x.id===osId);
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  const cli=(db.clientes||[]).find(c=>c.id===o.clienteId)||{};
  const loja=dadosLoja();
  const fin=o.status==='concluido';
  const p=(db.parque||[]).find(x=>x.equipamentoId===o.equipamentoId);
  const showColor=!o.contratoId || temColor(p);
  const pecas=Array.isArray(o.pecas)&&o.pecas.length?o.pecas.map(it=>({d:it.descricao||'',q:it.qtd||''})):[];
  while(pecas.length<5) pecas.push({d:'',q:''});
  const cell=(x)=>fin?esc(x==null||x===''?'':x):'';
  const dataCad=dataBR(o.criadoEm||o.dataAbertura);
  const dataAt=fin&&o.dataAtendimento?dataBR(o.dataAtendimento):'&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    @page{margin:12mm}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}
    body{font-family:Inter,Arial,sans-serif;margin:0;color:#0f172a;font-size:12px}
    .sheet{max-width:760px;margin:0 auto}
    .head{display:flex;gap:14px;align-items:center;padding-bottom:12px;border-bottom:3px solid #0a1e8a}
    .head img{height:58px}
    .head h1{margin:0;font-size:20px;color:#0a1e8a}
    .muted{color:#64748b;font-size:11px}
    .os{margin-left:auto;text-align:right}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
    .card{border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;background:#f8fafc}
    .card h3{margin:0 0 6px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#64748b}
    .faixa{background:#0a1e8a !important;color:#fff !important;border-radius:8px;text-align:center;font-weight:800;padding:8px;margin:14px 0 6px;letter-spacing:.08em;font-size:11px}
    table{width:100%;border-collapse:collapse;border:1px solid #cbd5e1}
    th{background:#eef2ff !important;color:#0a1e8a;font-size:11px;text-align:left;padding:8px;border:1px solid #cbd5e1}
    td{padding:8px;border:1px solid #e2e8f0;height:26px}
    .lined{border:1px solid #cbd5e1;border-radius:10px;min-height:72px;padding:8px 10px;
      background-image:repeating-linear-gradient(#fff,#fff 21px,#e2e8f0 22px);background-size:100% 22px}
    .data{border-bottom:1px solid #334155;min-width:110px;text-align:center;display:inline-block;letter-spacing:1px}
    @media print{.no-print{display:none!important}.faixa{background:#0a1e8a!important;color:#fff!important}}
  </style></head><body><div class="sheet">
  <div class="no-print" style="margin-bottom:10px"><button onclick="window.print()">Imprimir</button></div>
  <div class="head"><img src="${logoSrc()}" alt="logo"><div><h1>${esc(loja.fantasia)}</h1><div class="muted">${esc(loja.nome)}</div><div class="muted">${esc(loja.cnpj)} ${loja.fone?('• '+esc(loja.fone)):''}</div></div>
    <div class="os"><b>OS ${esc(o.numero||'')}</b><div class="muted">${fin?'Finalizado':'Em aberto'}</div></div></div>
  <div class="cards">
    <div class="card"><h3>Cliente</h3><div><b>${esc(cli.nome||'')}</b></div><div class="muted">${esc(cli.documento||'')} • ${esc(cli.telefone||'')}</div><div class="muted">${esc(cli.cidade||'')} ${esc(cli.estado||'')}</div></div>
    <div class="card"><h3>Atendimento</h3>
      <div>Técnico: <b>${esc(o.tecnico||'')}</b></div>
      <div>Motivo / Defeito: <b>${esc(o.descricao||'')}</b></div>
      <div class="muted">Data de cadastro: ${esc(dataCad)}</div>
    </div>
  </div>
  <table><tr><th>Contador preto atual</th>${showColor?'<th>Contador color atual</th>':''}</tr>
  <tr><td>${cell(o.contadorAtual)}</td>${showColor?`<td>${cell(o.contadorColor)}</td>`:''}</tr></table>
  <div class="faixa">SERVIÇOS EXECUTADOS</div>
  <div class="lined">${cell(o.servicos)}</div>
  <div class="faixa">PRODUTOS / PEÇAS USADAS</div>
  <table><thead><tr><th style="width:78%">Descrição</th><th>Quantidade</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(it=>`<tr><td>${fin?esc(it.d):''}&nbsp;</td><td>${fin?esc(it.q):''}&nbsp;</td></tr>`).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="lined">${cell(o.observacao)}</div>
  <p style="margin-top:16px"><b>Data do atendimento:</b> <span class="data">${dataAt}</span></p>
  </div></body></html>`;
  const w=window.open('','_blank'); if(w){ w.document.write(html); w.document.close(); }
};

// ── 5 Todos leituras com aviso ──
window.lcLeiturasTodos=function(){
  confirmar('Deseja mostrar todas as leituras?','Leituras').then(ok=>{
    if(!ok) return;
    const de=document.getElementById('lc-lei-de'), ate=document.getElementById('lc-lei-ate');
    if(de) de.value=''; if(ate) ate.value='';
    document.querySelectorAll('#modal-body tbody tr').forEach(tr=>tr.style.display='');
  });
};

console.log('[DIGICOPY] ajustes_v5174_patch.js');
})();
