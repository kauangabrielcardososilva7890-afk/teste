// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.48 — Notinha de leitura compacta + aba Produtos visível
// • Notinha de leitura com logo, dados da loja e dados do cliente
// • Impressão por departamento específico ou todos
// • Layout compacto, inspirado no detalhamento antigo, sem copiar visual
// • Garante acesso visível à aba Produtos/Estoque no menu superior
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function n(v,fb=0){ const x=Number(String(v ?? '').replace(',','.')); return Number.isFinite(x)?x:fb; }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(n(v,0)):n(v,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function dataBR(v){ if(!txt(v)) return '—'; return typeof fmtDate==='function'?fmtDate(v):txt(v).slice(0,10); }
function cli(id){ return (db.clientes||[]).find(c=>c.id===id)||null; }
function ctr(id){ return (db.contratos||[]).find(c=>c.id===id)||null; }
function empAtual(){ const s=typeof getSession==='function'?getSession():null; const emp=(db.empresas||[]).find(e=>e.id===(s&&s.empresaId)) || (db.empresas||[])[0] || {}; const loja=(db.config&&db.config.loja)||{}; return Object.assign({}, emp, loja); }
function leitura(id){ return (db.leituras||[]).find(l=>l.id===id)||null; }
function contratoLeitura(l){ return ctr(l&&l.contratoId)||null; }
function deptoItem(it){ return txt(it.departamento||it.setor||'Sem departamento')||'Sem departamento'; }
function agruparPorDepartamento(itens){
  const grupos={};
  (itens||[]).forEach(it=>{
    const d=deptoItem(it);
    const g=grupos[d]||(grupos[d]={departamento:d,itens:[],utilizado:0,excedente:0,total:0});
    g.itens.push(it); g.utilizado+=n(it.utilizado); g.excedente+=n(it.excedente); g.total+=n(it.valorTotal);
  });
  return Object.values(grupos).sort((a,b)=>a.departamento.localeCompare(b.departamento,'pt-BR',{sensitivity:'base'}));
}
function totais(itens){ return (itens||[]).reduce((a,it)=>{ a.utilizado+=n(it.utilizado); a.excedente+=n(it.excedente); a.total+=n(it.valorTotal); return a; },{utilizado:0,excedente:0,total:0}); }
function deptosLeitura(l){ return agruparPorDepartamento(l&&l.itens||[]).map(g=>g.departamento); }
function htmlLinhaItem(it){
  return `<div class="item">
    <div class="item-title"><b>${esc(it.medidorLabel||'Tipo')}</b><span>${esc(it.patrimonio||'')}</span><strong>${esc(it.modelo||it.impressora||'Impressora')}</strong></div>
    <div class="grid">
      <span><b>Serial:</b> ${esc(it.serial||'')}</span>
      <span><b>Anterior:</b> ${esc(it.anterior)}</span>
      <span><b>Atual:</b> ${esc(it.atual)}</span>
      <span><b>Depart.:</b> ${esc(deptoItem(it))}</span>
      <span><b>Utilizado:</b> ${esc(it.utilizado)}</span>
      <span><b>Franquia:</b> ${esc(it.franquia||0)}</span>
      <span><b>Vlr página/qtd:</b> ${n(it.valorUnitario||it.valorExcedente).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:5})}</span>
      <span><b>Excedente:</b> ${esc(it.excedente)}</span>
      <span><b>Acrésc.:</b> ${money(it.acrescimo||0)}</span>
      <span><b>Vlr exced.:</b> ${money((n(it.excedente)*n(it.valorExcedente||it.valorUnitario)))}</span>
      <span class="total-item"><b>Total:</b> ${money(it.valorTotal)}</span>
    </div>
  </div>`;
}
function htmlNotinhaLeitura(leituraId, departamento='todos'){
  const l=leitura(leituraId); if(!l) return '';
  const c=contratoLeitura(l); const cliente=cli(l.clienteId || (c&&c.clienteId)) || {}; const emp=empAtual();
  const grupos=agruparPorDepartamento(l.itens||[]).filter(g=>departamento==='todos'||g.departamento===departamento);
  const allItens=grupos.flatMap(g=>g.itens); const total=totais(allItens);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Leitura ${esc(l.numero||'')}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;margin:16px;color:#111;font-size:11px}.no-print{margin-bottom:10px}.top{display:flex;gap:12px;border-bottom:2px solid #0a1e8a;padding-bottom:8px;margin-bottom:8px;align-items:center}.logo{width:86px;height:52px;object-fit:contain}.empresa{flex:1}.empresa h1{font-size:18px;margin:0;color:#0a1e8a}.box{border:1px solid #d0d0d0;border-radius:6px;padding:7px;margin:7px 0}.cols{display:grid;grid-template-columns:1fr 1fr;gap:8px}.dept{border:1px solid #b8c1d8;margin-top:8px}.dept-title{background:#e9efff;color:#0a1e8a;font-weight:bold;padding:5px 7px;font-size:12px}.item{padding:5px 7px;border-top:1px solid #ddd}.item-title{display:grid;grid-template-columns:68px 55px 1fr;gap:8px;background:#eee;border:1px solid #aaa;padding:2px 5px;font-size:12px}.grid{display:grid;grid-template-columns:1.2fr .85fr .85fr;gap:2px 10px;margin-top:4px}.total-item{font-weight:bold;color:#0a1e8a}.subtotal{background:#f8fafc;text-align:right;padding:5px 7px;font-weight:bold;border-top:1px solid #ddd}.grand{font-size:15px;font-weight:800;text-align:right;margin-top:10px;color:#0a1e8a}.assin{display:flex;justify-content:space-between;margin-top:35px}.assin div{width:42%;border-top:1px solid #333;text-align:center;padding-top:4px}@media print{.no-print{display:none}body{margin:9mm}.dept{page-break-inside:avoid}.item{page-break-inside:avoid}}
  </style></head><body><button class="no-print" onclick="window.print()">Imprimir / Salvar PDF</button>
  <div class="top"><img src="${window.DIGICOPY_LOGO||'./logo.png'}" class="logo"><div class="empresa"><h1>${esc(emp.fantasia||emp.nome||'DIGICOPY')}</h1><div>${esc(emp.razaoSocial||emp.nome||'')} ${emp.cnpj?'• CNPJ '+esc(emp.cnpj):''}</div><div>${esc(emp.telefone||emp.fone?'Tel. '+esc(emp.telefone||emp.fone):'')} ${emp.email?'• '+esc(emp.email):''}</div><div>${esc([emp.rua||emp.endereco,emp.numero,emp.bairro,emp.cidade||emp.municipio,emp.uf||emp.estado,emp.cep].filter(Boolean).join(' - '))}</div></div><div><b>Leitura:</b> ${esc(l.numero||'')}<br><b>Emissão:</b> ${dataBR(new Date())}</div></div>
  <div class="cols"><div class="box"><b>Cliente</b><br>${esc(cliente.nome||cliente.fantasia||'')}<br>${esc(cliente.documento||'')}<br>${esc([cliente.endereco||cliente.rua,cliente.numero,cliente.bairro,cliente.cidade,cliente.estado||cliente.uf,cliente.cep].filter(Boolean).join(' - '))}</div><div class="box"><b>Contrato / Período</b><br>${esc(c&&c.numero||'')}<br>${dataBR(l.dataInicio)} a ${dataBR(l.dataFim)}<br><b>Departamento:</b> ${departamento==='todos'?'Todos':esc(departamento)}</div></div>
  ${grupos.map(g=>`<div class="dept"><div class="dept-title">Departamento: ${esc(g.departamento)}</div>${g.itens.map(htmlLinhaItem).join('')}<div class="subtotal">Subtotal — Utilizado: ${g.utilizado} • Excedente: ${g.excedente} • ${money(g.total)}</div></div>`).join('') || '<div class="box">Nenhum lançamento para imprimir.</div>'}
  <div class="grand">TOTAL GERAL — Utilizado: ${total.utilizado} • Excedente: ${total.excedente} • ${money(total.total)}</div><div class="assin"><div>${esc(emp.fantasia||emp.nome||'DIGICOPY')}</div><div>${esc(cliente.nome||'Cliente')}</div></div></body></html>`;
}
function setModal(titulo, corpo, rodape, max='620px'){
  const root=document.getElementById('modal-root'), box=document.getElementById('modal-box'); if(!root||!box) return;
  box.className=`w-full max-w-[${max}] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col`;
  document.getElementById('modal-title').innerText=titulo; document.getElementById('modal-body').innerHTML=corpo; document.getElementById('modal-footer').innerHTML=rodape||''; root.classList.remove('hidden');
}
window.abrirImpressaoLeitura=function(leituraId){
  const l=leitura(leituraId); if(!l) return;
  const deps=deptosLeitura(l);
  setModal('Imprimir leitura',`<div class="space-y-3"><p class="text-[13px] text-slate-600">Escolha se deseja imprimir todos os departamentos ou apenas um.</p><label class="font-bold text-slate-600">Departamento<select id="imp-leitura-depto" class="mt-1 w-full h-10 px-3 rounded-xl border"><option value="todos">Todos</option>${deps.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('')}</select></label></div>`,`<button onclick="closeModal&&closeModal(true)" class="neo-btn">Cancelar</button><button onclick="imprimirLeituraContratoExecutar('${leituraId}')" class="neo-btn primary">Imprimir</button>`);
};
window.imprimirLeituraContratoExecutar=function(leituraId){ const dep=document.getElementById('imp-leitura-depto')?.value||'todos'; const html=htmlNotinhaLeitura(leituraId,dep); const w=window.open('','_blank'); w.document.write(html); w.document.close(); };
window.imprimirLeituraContrato=function(leituraId){ return window.abrirImpressaoLeitura(leituraId); };

function garantirProdutosVisivel(){
  if(typeof document==='undefined') return;
  const row=document.querySelector('.modern-topnav .module-row'); if(row && !document.getElementById('top-produtos-fix')){
    const div=document.createElement('div'); div.className='module'; div.id='top-produtos-fix'; div.innerHTML='<button onclick="navigateTo(\'produtos\')"><i class="ph ph-package"></i>Produtos</button>';
    const loc=[...row.querySelectorAll('.module')].find(m=>/Locação/i.test(m.textContent||'')); if(loc) row.insertBefore(div,loc); else row.appendChild(div);
  }
  const nav=document.getElementById('nav-main'); if(nav && !nav.querySelector('[data-nav="produtos"]')){
    const b=document.createElement('button');
    if(b.dataset) b.dataset.nav='produtos';
    else if(typeof b.setAttribute==='function') b.setAttribute('data-nav','produtos');
    b.onclick=()=>navigateTo('produtos');
    b.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white';
    b.innerHTML='<i class="ph ph-package text-[19px]"></i><span>Produtos</span>';
    nav.appendChild(b);
  }
}
const oldBuildNav=window.buildNav; if(typeof oldBuildNav==='function'&&!oldBuildNav.__prodFix){ window.buildNav=function(){ const ret=oldBuildNav.apply(this,arguments); setTimeout(garantirProdutosVisivel,0); return ret; }; window.buildNav.__prodFix=true; }
if(typeof document!=='undefined'){ setTimeout(garantirProdutosVisivel,800); setInterval(garantirProdutosVisivel,4000); }
window.LEITURA_IMPRESSAO_COMPACTA_PURE={ agruparPorDepartamento, totais, htmlNotinhaLeitura };
console.log('[DIGICOPY] leitura_impressao_compacta_produtos_patch.js v4.9.48 carregado');
})();
