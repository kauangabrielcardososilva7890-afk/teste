// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.43 — Ajustes do relatório de avaliação
// • Leitura em tela detalhada com lançamentos por impressora/medidor e total
// • Contrato sem select fechado de cliente; cliente por busca/lupa
// • Modalidades sem global: Individual, Por Impressão, Mês Fixo e Inativo
// • Clientes com busca por Enter/lupa
// • Notinha: busca só na lupa, bloqueio de impressão antes de faturar
// • Pilha de modais: Voltar retorna à aba anterior em vez de fechar tudo
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function norm(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function n(v,fb=0){ const x=Number(String(v ?? '').replace(',','.')); return Number.isFinite(x)?x:fb; }
function i(v,fb=0){ const x=parseInt(String(v ?? ''),10); return Number.isFinite(x)?x:fb; }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(n(v,0)):n(v,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function dataBR(v){ if(!txt(v)) return '—'; return typeof fmtDate==='function'?fmtDate(v):txt(v).slice(0,10); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); if(typeof renderDashboard==='function') setTimeout(()=>renderDashboard(),60); }
function cli(id){ return (db.clientes||[]).find(c=>c.id===id)||null; }
function eq(id){ return (db.equipamentos||[]).find(e=>e.id===id)||null; }
function ctr(id){ return (db.contratos||[]).find(c=>c.id===id)||null; }
function prq(id){ return (db.parque||[]).find(p=>p.id===id)||null; }
function clienteNome(c){ c=c||{}; return [c.codigo?('#'+c.codigo):'', c.nome||c.fantasia||''].filter(Boolean).join(' — '); }

// ── pilha de modais ───────────────────────────────────────────────────────
window.__modalStackOperacional = window.__modalStackOperacional || [];
function snapshotModal(){
  const root=document.getElementById('modal-root'), box=document.getElementById('modal-box');
  return root&&box?{title:document.getElementById('modal-title')?.innerText||'', body:document.getElementById('modal-body')?.innerHTML||'', footer:document.getElementById('modal-footer')?.innerHTML||'', boxClass:box.className, hidden:root.classList.contains('hidden')}:null;
}
function restoreModal(snap){
  if(!snap) return false;
  const root=document.getElementById('modal-root'), box=document.getElementById('modal-box'); if(!root||!box) return false;
  box.className=snap.boxClass;
  document.getElementById('modal-title').innerText=snap.title;
  document.getElementById('modal-body').innerHTML=snap.body;
  document.getElementById('modal-footer').innerHTML=snap.footer;
  root.classList.toggle('hidden', !!snap.hidden);
  return true;
}
window.abrirModalEmpilhado=function(titulo, corpo, rodape, max='980px'){
  const snap=snapshotModal(); if(snap && !snap.hidden) window.__modalStackOperacional.push(snap);
  const root=document.getElementById('modal-root'), box=document.getElementById('modal-box'); if(!root||!box) return;
  box.className=`w-full max-w-[${max}] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col`;
  document.getElementById('modal-title').innerText=titulo;
  document.getElementById('modal-body').innerHTML=corpo;
  document.getElementById('modal-footer').innerHTML=rodape||'';
  root.classList.remove('hidden');
};
window.voltarModalOperacional=function(){
  const snap=window.__modalStackOperacional.pop();
  if(snap) return restoreModal(snap);
  if(typeof closeModal==='function') return closeModal(true);
};
const oldCloseModal=window.closeModal;
window.closeModal=function(force){
  if(!force && window.__modalStackOperacional.length) return window.voltarModalOperacional();
  window.__modalStackOperacional=[];
  return oldCloseModal?oldCloseModal.apply(this,arguments):document.getElementById('modal-root')?.classList.add('hidden');
};

const MEDS=[
  ['pretoA4','Preto A4'],['pretoA3','Preto A3'],['colorA4','Color A4'],['colorA3','Color A3'],['scanner','Scanner']
];
function medidorDefault(key){ return {ativo:key==='pretoA4', ocultar:key!=='pretoA4', modalidade:key==='pretoA4'?'individual':'inativo', acrescimo:0, franquia:0, valorFranquia:0, valorExcedente:0, valorLocacao:0, valorPagina:0, contadorInicial:0}; }
function getMeds(obj){
  obj.medidoresConfig=obj.medidoresConfig||{};
  MEDS.forEach(([k])=>{ obj.medidoresConfig[k]=Object.assign(medidorDefault(k), obj.medidoresConfig[k]||{}); });
  return obj.medidoresConfig;
}
function medFields(key, med){
  const modo=med.modalidade||'inativo';
  const common=`<label class="flex items-center gap-2 text-[12px] font-bold"><input type="checkbox" id="med-${key}-ativo" ${med.ativo?'checked':''} onchange="atualizarMedidorUI('${key}')"> Ativo</label><label class="text-[11px] font-bold uppercase text-slate-500">Modalidade<select id="med-${key}-mod" onchange="atualizarMedidorUI('${key}')" class="mt-1 w-full h-9 px-2 rounded-lg border"><option value="inativo" ${modo==='inativo'?'selected':''}>Inativo</option><option value="individual" ${modo==='individual'?'selected':''}>Individual</option><option value="impressao" ${modo==='impressao'?'selected':''}>Por impressão</option><option value="mes_fixo" ${modo==='mes_fixo'?'selected':''}>Mês fixo</option></select></label>`;
  const individual=`<div class="grid grid-cols-2 md:grid-cols-6 gap-2"><label class="text-[11px] font-bold uppercase text-slate-500">Alterar Cont.<input id="med-${key}-contador" type="number" value="${n(med.contadorInicial)}" class="mt-1 w-full h-9 px-2 rounded-lg border bg-slate-50"></label><label class="text-[11px] font-bold uppercase text-slate-500">Acréscimo<input id="med-${key}-acrescimo" type="number" step="0.01" value="${n(med.acrescimo)}" class="mt-1 w-full h-9 px-2 rounded-lg border"></label><label class="text-[11px] font-bold uppercase text-slate-500">Franquia<input id="med-${key}-franquia" type="number" value="${n(med.franquia)}" class="mt-1 w-full h-9 px-2 rounded-lg border"></label><label class="text-[11px] font-bold uppercase text-slate-500">Vlr Franquia<input id="med-${key}-valorFranquia" type="number" step="0.01" value="${n(med.valorFranquia)}" class="mt-1 w-full h-9 px-2 rounded-lg border"></label><label class="text-[11px] font-bold uppercase text-slate-500">Valor Exc.<input id="med-${key}-valorExcedente" type="number" step="0.001" value="${n(med.valorExcedente)}" class="mt-1 w-full h-9 px-2 rounded-lg border bg-red-50"></label><label class="text-[11px] font-bold uppercase text-emerald-700">Valor Locação<input id="med-${key}-valorLocacao" type="number" step="0.01" value="${n(med.valorLocacao)}" class="mt-1 w-full h-9 px-2 rounded-lg border bg-emerald-50"></label></div><p class="text-[11px] text-slate-500 mt-2">Franquia Individual: usa as configurações acima na contagem da leitura.</p>`;
  const impressao=`<div class="grid grid-cols-2 md:grid-cols-3 gap-2"><label class="text-[11px] font-bold uppercase text-slate-500">Alterar Cont.<input id="med-${key}-contador" type="number" value="${n(med.contadorInicial)}" class="mt-1 w-full h-9 px-2 rounded-lg border bg-slate-50"></label><label class="text-[11px] font-bold uppercase text-slate-500">Acréscimo<input id="med-${key}-acrescimo" type="number" step="0.01" value="${n(med.acrescimo)}" class="mt-1 w-full h-9 px-2 rounded-lg border"></label><label class="text-[11px] font-bold uppercase text-slate-500">Vlr Página<input id="med-${key}-valorPagina" type="number" step="0.001" value="${n(med.valorPagina)}" class="mt-1 w-full h-9 px-2 rounded-lg border"></label></div><p class="text-[11px] text-slate-500 mt-2">Por Impressão: multiplica páginas utilizadas pelo valor por página + acréscimo.</p>`;
  const mes=`<div class="grid grid-cols-1 md:grid-cols-2 gap-2"><label class="text-[11px] font-bold uppercase text-emerald-700">Valor Locação<input id="med-${key}-valorLocacao" type="number" step="0.01" value="${n(med.valorLocacao)}" class="mt-1 w-full h-9 px-2 rounded-lg border bg-emerald-50"></label></div>`;
  return `<div class="space-y-3">${common}<div id="med-${key}-campos">${modo==='individual'?individual:modo==='impressao'?impressao:modo==='mes_fixo'?mes:'<p class="text-[12px] text-slate-400">Medidor inativo/oculto.</p>'}</div></div>`;
}
window.atualizarMedidorUI=function(key){
  const ativo=document.getElementById(`med-${key}-ativo`)?.checked;
  const mod=document.getElementById(`med-${key}-mod`)?.value || 'inativo';
  const fake=medidorDefault(key); fake.ativo=ativo; fake.modalidade=ativo?mod:'inativo'; fake.ocultar=!ativo;
  ['contador','acrescimo','franquia','valorFranquia','valorExcedente','valorLocacao','valorPagina'].forEach(k=>{ const e=document.getElementById(`med-${key}-${k}`); if(e) fake[k==='contador'?'contadorInicial':k]=n(e.value); });
  const box=document.getElementById(`medbox-${key}`); if(box) box.innerHTML=medFields(key,fake);
};
function collectMed(key){
  const ativo=document.getElementById(`med-${key}-ativo`)?.checked;
  const mod=document.getElementById(`med-${key}-mod`)?.value || 'inativo';
  const out=medidorDefault(key); out.ativo=!!ativo && mod!=='inativo'; out.ocultar=!out.ativo; out.modalidade=out.ativo?mod:'inativo';
  const map={contador:'contadorInicial',acrescimo:'acrescimo',franquia:'franquia',valorFranquia:'valorFranquia',valorExcedente:'valorExcedente',valorLocacao:'valorLocacao',valorPagina:'valorPagina'};
  Object.entries(map).forEach(([id,prop])=>{ const e=document.getElementById(`med-${key}-${id}`); if(e) out[prop]=n(e.value); });
  return out;
}
function medidoresEditor(obj){
  const meds=getMeds(obj);
  return `<div class="rounded-xl border bg-slate-50 p-3"><h4 class="font-bold text-[13px] mb-2">Modalidades de leitura</h4><p class="text-[11px] text-slate-500 mb-3">Global foi removido. Padrão: só Preto A4 ativo.</p><div class="space-y-3">${MEDS.map(([k,l])=>`<details ${k==='pretoA4'?'open':''} class="rounded-xl bg-white border p-3"><summary class="cursor-pointer font-bold text-[#0a1e8a]">${l}</summary><div id="medbox-${k}" class="pt-3">${medFields(k,meds[k])}</div></details>`).join('')}</div></div>`;
}

// ── clientes: busca por enter/lupa ─────────────────────────────────────────
window.renderClientes=function(){
  const s=sess(); if(!s) return;
  const view=document.getElementById('view-clientes') || (typeof ensureView==='function'?ensureView('clientes'):null); if(!view) return;
  const state=window.__cliBuscaState||(window.__cliBuscaState={q:''});
  const q=low(state.q);
  let list=(db.clientes||[]).filter(c=>c.empresaId===s.empresaId&&c.status!=='inativo');
  if(q) list=list.filter(c=>[c.nome,c.fantasia,c.codigo,c.documento,c.telefone,c.cidade,c.bairro,c.endereco,c.email].some(x=>low(x).includes(q)));
  list=list.sort((a,b)=>txt(a.nome).localeCompare(txt(b.nome),'pt-BR',{sensitivity:'base'}));
  view.innerHTML=`<div class="neo-shell"><div class="neo-panel"><div class="neo-head"><div><h3>Clientes</h3><p>Digite e pressione Enter ou clique na lupa.</p></div><div class="neo-actions"><button onclick="openModal('cliente')" class="neo-btn primary"><i class="ph ph-user-plus"></i>Novo cliente</button></div></div><div class="p-4 border-b flex gap-2"><input id="cli-busca-oper" value="${esc(state.q)}" onkeydown="if(event.key==='Enter'){window.__cliBuscaState.q=this.value; renderClientes()}" class="neo-input flex-1" placeholder="Pesquisar nome, fantasia, código, CPF/CNPJ, cidade..."><button onclick="window.__cliBuscaState.q=document.getElementById('cli-busca-oper').value; renderClientes()" class="neo-btn primary"><i class="ph ph-magnifying-glass"></i></button><button onclick="window.__cliBuscaState.q=''; renderClientes()" class="neo-btn">Limpar</button><span class="self-center text-[12px] text-slate-500"><b>${list.length}</b> clientes</span></div><div class="overflow-auto max-h-[calc(100vh-290px)]"><table class="neo-table"><thead><tr><th>Código</th><th>Cliente</th><th>Telefone</th><th>CPF/CNPJ</th><th>Cidade</th><th>Status</th></tr></thead><tbody>${list.map(c=>`<tr ondblclick="openModal('cliente','${c.id}')"><td><b class="text-[#0a1e8a]">${esc(c.codigo||'')}</b></td><td><b>${esc(c.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(c.fantasia||c.email||'')}</span></td><td>${esc(c.telefone||'')}</td><td>${esc(c.documento||'')}</td><td>${esc(c.cidade||'')} / ${esc(c.estado||'')}</td><td><span class="neo-status ${c.status==='ativo'?'ok':'wait'}">${esc(c.status||'ativo')}</span></td></tr>`).join('')||'<tr><td colspan="6" class="text-center text-slate-500 py-8">Nenhum cliente encontrado</td></tr>'}</tbody></table></div></div></div>`;
};

// ── contrato sem select fechado ────────────────────────────────────────────
let clienteContratoSelecionado=null;
function buscaClientesContrato(q){ const s=sess(); const l=low(q); if(!s||!l) return []; return (db.clientes||[]).filter(c=>c.empresaId===s.empresaId&&[c.nome,c.fantasia,c.codigo,c.documento,c.telefone].some(x=>low(x).includes(l))).slice(0,20); }
window.buscarClienteContratoModal=function(){
  const q=document.getElementById('ctr-cli-busca')?.value||''; const box=document.getElementById('ctr-cli-result'); if(!box) return;
  const list=buscaClientesContrato(q); box.classList.remove('hidden');
  box.innerHTML=list.map(c=>`<button class="w-full text-left px-3 py-2 border-b hover:bg-blue-50" onclick="selecionarClienteContrato('${c.id}')"><b>#${esc(c.codigo||'')} — ${esc(c.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(c.documento||'')} • ${esc(c.telefone||'')}</span></button>`).join('')||'<p class="p-3 text-slate-400">Nenhum cliente encontrado.</p>';
};
window.selecionarClienteContrato=function(id){ clienteContratoSelecionado=cli(id); const box=document.getElementById('ctr-cli-selected'); if(box&&clienteContratoSelecionado){ box.classList.remove('hidden'); box.innerHTML=`<b>${esc(clienteNome(clienteContratoSelecionado))}</b><br><span class="text-[11px] text-slate-500">${esc(clienteContratoSelecionado.documento||'')} • ${esc(clienteContratoSelecionado.telefone||'')}</span>`; } document.getElementById('ctr-cli-result')?.classList.add('hidden'); };
window.renderModalContrato=function(id){
  const s=sess(); if(!s) return; const isEdit=!!id; const c=isEdit?ctr(id):{id:'',numero:(typeof proximoNumeroSimples==='function'?proximoNumeroSimples('contrato',db.contratos||[],s.empresaId):String((db.contratos||[]).length+1)),dataInicio:new Date().toISOString().slice(0,10),dataFim:new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().slice(0,10),diaVencimento:10,status:'ativo'};
  clienteContratoSelecionado=c.clienteId?cli(c.clienteId):null; getMeds(c);
  abrirModalEmpilhado(isEdit?'Alterar contrato':'Novo contrato',`<div class="space-y-4 text-[13px]"><div class="grid grid-cols-1 md:grid-cols-3 gap-3"><label class="font-bold text-slate-600">Código<input id="ctr-num" value="${esc(c.numero||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono"></label><div class="md:col-span-2 relative"><label class="font-bold text-slate-600">Cliente</label><div class="flex gap-2 mt-1"><input id="ctr-cli-busca" onkeydown="if(event.key==='Enter'){event.preventDefault(); buscarClienteContratoModal()}" placeholder="Digite código, nome ou CPF/CNPJ e clique na lupa" class="flex-1 h-10 px-3 rounded-xl border"><button onclick="buscarClienteContratoModal()" class="h-10 px-4 rounded-xl bg-[#0a1e8a] text-white"><i class="ph ph-magnifying-glass"></i></button></div><div id="ctr-cli-result" class="hidden absolute left-0 right-0 z-30 mt-1 max-h-[240px] overflow-auto rounded-xl border bg-white shadow-xl"></div><div id="ctr-cli-selected" class="${clienteContratoSelecionado?'':'hidden'} mt-2 rounded-xl bg-blue-50 border border-blue-200 p-3">${clienteContratoSelecionado?`<b>${esc(clienteNome(clienteContratoSelecionado))}</b><br><span class="text-[11px] text-slate-500">${esc(clienteContratoSelecionado.documento||'')} • ${esc(clienteContratoSelecionado.telefone||'')}</span>`:''}</div></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><label class="font-bold text-slate-600">Início<input id="ctr-ini" type="date" value="${txt(c.dataInicio).slice(0,10)}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="font-bold text-slate-600">Fim<input id="ctr-fim" type="date" value="${txt(c.dataFim).slice(0,10)}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="font-bold text-slate-600">Dia venc.<input id="ctr-venc" type="number" value="${i(c.diaVencimento,10)}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="font-bold text-slate-600">Status<select id="ctr-status" class="mt-1 w-full h-10 px-3 rounded-xl border"><option value="ativo">Ativo</option><option value="pendente">Pendente</option><option value="encerrado">Encerrado</option></select></label></div>${medidoresEditor(c)}</div>`, `<button onclick="voltarModalOperacional()" class="h-10 px-5 rounded-xl bg-white border font-bold">Voltar</button><button onclick="salvarContratoRelatorio('${isEdit?c.id:''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>`, '980px');
};
window.salvarContratoRelatorio=function(id){
  const s=sess(); if(!s) return; if(!clienteContratoSelecionado) return toast('Escolha o cliente pela busca/lupa','error');
  let c=id?ctr(id):null; if(!c){ c={id:uidSafe('ctr'),empresaId:s.empresaId,criadoEm:new Date().toISOString(),criadoPor:s.usuarioId,criadoPorNome:s.usuarioNome}; db.contratos.push(c); }
  Object.assign(c,{numero:cod(document.getElementById('ctr-num')?.value)||document.getElementById('ctr-num')?.value,clienteId:clienteContratoSelecionado.id,dataInicio:document.getElementById('ctr-ini')?.value||'',dataFim:document.getElementById('ctr-fim')?.value||'',diaVencimento:i(document.getElementById('ctr-venc')?.value,10),status:document.getElementById('ctr-status')?.value||'ativo'});
  c.medidoresConfig={}; MEDS.forEach(([k])=>c.medidoresConfig[k]=collectMed(k));
  c.valorMensalFixo=Object.values(c.medidoresConfig).filter(m=>m.ativo).reduce((sum,m)=>sum+n(m.valorLocacao)+n(m.valorFranquia),0);
  salvar(); toast('Contrato salvo','success'); if(typeof renderContratos==='function') renderContratos(); openContratoCompleto&&openContratoCompleto(c.id);
};

// ── leituras detalhadas ───────────────────────────────────────────────────
function contratoDaLeitura(l){ return ctr(l.contratoId)||((db.contratos||[]).find(c=>c.clienteId===l.clienteId)||null); }
function medidoresAtivosContrato(c){ const meds=getMeds(c||{}); return MEDS.map(([k,l])=>({key:k,label:l,...meds[k]})).filter(m=>m.ativo&&!m.ocultar&&m.modalidade!=='inativo'); }
function consumoMed(m, ant, atu){ const usado=Math.max(0,n(atu)-n(ant)); if(m.modalidade==='impressao') return {usado,exced:usado,total:usado*n(m.valorPagina)+n(m.acrescimo)}; if(m.modalidade==='mes_fixo') return {usado,exced:0,total:n(m.valorLocacao)}; const exced=Math.max(0,usado-n(m.franquia)); return {usado,exced,total:n(m.valorLocacao)+n(m.valorFranquia)+exced*n(m.valorExcedente)+n(m.acrescimo)}; }
window.renderLeituras=function(){
  const s=sess(); if(!s) return; const view=document.getElementById('view-leituras')||(typeof ensureView==='function'?ensureView('leituras'):null); if(!view) return;
  const list=(db.leituras||[]).filter(l=>l.empresaId===s.empresaId).sort((a,b)=>new Date(b.dataLeitura||b.criadoEm||0)-new Date(a.dataLeitura||a.criadoEm||0));
  view.innerHTML=`<div class="neo-shell"><div class="neo-panel"><div class="neo-head"><div><h3>Leituras Realizadas</h3><p>Duplo clique abre a leitura para lançar impressoras e medidores.</p></div><div class="neo-actions"><button onclick="novaLeituraCabecalho()" class="neo-btn primary"><i class="ph ph-plus"></i>Nova leitura</button></div></div><div class="overflow-auto max-h-[calc(100vh-260px)]"><table class="neo-table"><thead><tr><th>Código</th><th>Lançada em</th><th>Cliente</th><th>Utilizado</th><th>Qtde Exced.</th><th>Valor Total</th><th>Status</th></tr></thead><tbody>${list.map(l=>{ const c=contratoDaLeitura(l); const cl=cli(l.clienteId||(c&&c.clienteId)); const itens=l.itens||[]; const usado=itens.reduce((s,x)=>s+n(x.utilizado),0); const exc=itens.reduce((s,x)=>s+n(x.excedente),0); const total=itens.reduce((s,x)=>s+n(x.valorTotal),0); return `<tr ondblclick="abrirLeituraDetalhada('${l.id}')" class="cursor-pointer"><td><b class="text-[#0a1e8a]">${esc(l.numero||l.codigoAntigo||cod(l.id))}</b></td><td>${dataBR(l.dataLeitura||l.criadoEm)}</td><td>${esc(cl?cl.nome:'')}</td><td>${usado}</td><td>${exc}</td><td><b>${money(total||l.valorTotal||l.valorExcedente)}</b></td><td><span class="neo-status ${l.status==='faturado'?'ok':'wait'}">${esc(l.status||'aberta')}</span></td></tr>`;}).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-8">Nenhuma leitura lançada.</td></tr>'}</tbody></table></div></div></div>`;
};
let leituraContratoSel=null;
window.novaLeituraCabecalho=function(){ leituraContratoSel=null; abrirModalEmpilhado('Nova leitura',`<div class="space-y-4"><div class="relative"><label class="font-bold text-slate-600">Contrato / cliente</label><div class="flex gap-2 mt-1"><input id="leit-ctr-busca" class="flex-1 h-10 px-3 rounded-xl border" placeholder="Digite cliente ou contrato"><button onclick="buscarContratoLeitura()" class="h-10 px-4 rounded-xl bg-[#0a1e8a] text-white"><i class="ph ph-magnifying-glass"></i></button></div><div id="leit-ctr-result" class="hidden absolute z-30 left-0 right-0 mt-1 max-h-[240px] overflow-auto bg-white border rounded-xl shadow-xl"></div><div id="leit-ctr-sel" class="hidden mt-2 p-3 rounded-xl bg-blue-50 border border-blue-200"></div></div><div class="grid grid-cols-2 gap-3"><label>Início<input id="leit-ini" type="date" class="mt-1 w-full h-10 px-3 rounded-xl border" value="${new Date().toISOString().slice(0,10)}"></label><label>Final<input id="leit-fim" type="date" class="mt-1 w-full h-10 px-3 rounded-xl border" value="${new Date().toISOString().slice(0,10)}"></label></div></div>`,`<button onclick="voltarModalOperacional()" class="neo-btn">Voltar</button><button onclick="criarLeituraDetalhada()" class="neo-btn primary">Criar leitura</button>`,'720px'); };
window.buscarContratoLeitura=function(){ const q=low(document.getElementById('leit-ctr-busca')?.value); const box=document.getElementById('leit-ctr-result'); if(!box) return; const list=(db.contratos||[]).filter(c=>{ const cl=cli(c.clienteId)||{}; return [c.numero,c.codigoAntigo,cl.nome,cl.codigo,cl.documento].some(x=>low(x).includes(q)); }).slice(0,20); box.classList.remove('hidden'); box.innerHTML=list.map(c=>{ const cl=cli(c.clienteId)||{}; return `<button class="w-full text-left px-3 py-2 border-b hover:bg-blue-50" onclick="selecionarContratoLeitura('${c.id}')"><b>${esc(c.numero||'')} — ${esc(cl.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(cl.documento||'')}</span></button>`; }).join('')||'<p class="p-3 text-slate-400">Nenhum contrato encontrado.</p>'; };
window.selecionarContratoLeitura=function(id){ leituraContratoSel=ctr(id); const cl=cli(leituraContratoSel&&leituraContratoSel.clienteId)||{}; const b=document.getElementById('leit-ctr-sel'); if(b){ b.classList.remove('hidden'); b.innerHTML=`<b>${esc(leituraContratoSel.numero||'')}</b> — ${esc(cl.nome||'')}`; } document.getElementById('leit-ctr-result')?.classList.add('hidden'); };
window.criarLeituraDetalhada=function(){ const s=sess(); if(!s) return; if(!leituraContratoSel) return toast('Escolha o contrato pela lupa','error'); const l={id:uidSafe('lei'),empresaId:s.empresaId,contratoId:leituraContratoSel.id,clienteId:leituraContratoSel.clienteId,numero:typeof proximoNumeroSimples==='function'?proximoNumeroSimples('leitura',db.leituras||[],s.empresaId):String((db.leituras||[]).length+1),dataLeitura:new Date().toISOString(),dataInicio:document.getElementById('leit-ini')?.value,dataFim:document.getElementById('leit-fim')?.value,status:'aberta',itens:[],criadoPor:s.usuarioId,criadoPorNome:s.usuarioNome,criadoEm:new Date().toISOString()}; db.leituras=db.leituras||[]; db.leituras.push(l); salvar(); abrirLeituraDetalhada(l.id); };
window.abrirLeituraDetalhada=function(id){ const l=(db.leituras||[]).find(x=>x.id===id); if(!l) return; const c=contratoDaLeitura(l); const cl=cli(l.clienteId||(c&&c.clienteId))||{}; const maquinas=(db.parque||[]).filter(p=>p.contratoId===c?.id&&p.status!=='inativo'); const total=(l.itens||[]).reduce((s,x)=>s+n(x.valorTotal),0); abrirModalEmpilhado(`Leitura ${l.numero||''} — ${cl.nome||''}`,`<div class="space-y-4 text-[13px]"><div class="grid grid-cols-3 gap-3"><div class="neo-card"><p class="neo-label">Total Utilizado</p><div class="neo-total">${(l.itens||[]).reduce((s,x)=>s+n(x.utilizado),0)}</div></div><div class="neo-card"><p class="neo-label">Total Excedentes</p><div class="neo-total">${(l.itens||[]).reduce((s,x)=>s+n(x.excedente),0)}</div></div><div class="neo-card"><p class="neo-label">Soma Total</p><div class="neo-total">${money(total)}</div></div></div><div class="rounded-xl border p-3 bg-slate-50"><div class="grid grid-cols-1 md:grid-cols-4 gap-2"><label>Impressora<select id="leit-prq" onchange="carregarTiposMedidorLeitura()" class="mt-1 w-full h-10 px-2 rounded-xl border"><option value="">Selecione</option>${maquinas.map(p=>{ const e=eq(p.equipamentoId)||{}; return `<option value="${p.id}">${esc(e.patrimonio||'')} — ${esc(e.modelo||'')}</option>`; }).join('')}</select></label><label>Tipo ativo<select id="leit-med" class="mt-1 w-full h-10 px-2 rounded-xl border"><option value="">Escolha uma impressora</option></select></label><label>Contador atual<input id="leit-cont" type="number" class="mt-1 w-full h-10 px-2 rounded-xl border"></label><div class="flex items-end"><button onclick="salvarItemLeitura('${l.id}')" class="neo-btn primary w-full">Lançar</button></div></div></div><div class="rounded-xl border overflow-hidden"><table class="w-full text-left text-[12px]"><thead class="bg-slate-50"><tr><th class="px-3 py-2">Impressora</th><th>Tipo</th><th>Anterior</th><th>Atual</th><th>Utilizado</th><th>Exced.</th><th>Total</th></tr></thead><tbody>${(l.itens||[]).map(it=>`<tr class="border-t"><td class="px-3 py-2">${esc(it.impressora)}</td><td>${esc(it.medidorLabel)}</td><td>${it.anterior}</td><td>${it.atual}</td><td>${it.utilizado}</td><td>${it.excedente}</td><td><b>${money(it.valorTotal)}</b></td></tr>`).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-6">Nenhuma impressora lançada.</td></tr>'}</tbody></table></div></div>`,`<button onclick="voltarModalOperacional()" class="neo-btn">Voltar</button><button onclick="imprimirLeituraDetalhada('${l.id}')" class="neo-btn primary">Imprimir notinha detalhada</button>`,'1080px'); };
window.carregarTiposMedidorLeitura=function(){ const p=prq(document.getElementById('leit-prq')?.value); const c=p&&ctr(p.contratoId); const meds=medidoresAtivosContrato(c); const sel=document.getElementById('leit-med'); if(sel) sel.innerHTML=meds.map(m=>`<option value="${m.key}">${esc(m.label)} — ${esc(m.modalidade)}</option>`).join('')||'<option value="">Nenhum medidor ativo</option>'; };
window.salvarItemLeitura=function(id){ const l=(db.leituras||[]).find(x=>x.id===id); const p=prq(document.getElementById('leit-prq')?.value); if(!l||!p) return toast('Selecione a impressora','error'); const c=ctr(p.contratoId); const key=document.getElementById('leit-med')?.value; const med=medidoresAtivosContrato(c).find(m=>m.key===key); if(!med) return toast('Selecione um tipo ativo','error'); const e=eq(p.equipamentoId)||{}; const anterior=n((p.contadores&&p.contadores[key])||med.contadorInicial||0); const atual=n(document.getElementById('leit-cont')?.value,anterior); const calc=consumoMed(med,anterior,atual); p.contadores=p.contadores||{}; p.contadores[key]=atual; l.itens=l.itens||[]; l.itens.push({parqueId:p.id,equipamentoId:p.equipamentoId,impressora:`${e.patrimonio||''} ${e.modelo||''}`,medidor:key,medidorLabel:med.label,modalidade:med.modalidade,anterior,atual,utilizado:calc.usado,excedente:calc.exced,valorTotal:calc.total}); l.valorTotal=l.itens.reduce((s,x)=>s+n(x.valorTotal),0); l.valorExcedente=l.valorTotal; salvar(); abrirLeituraDetalhada(id); };
window.imprimirLeituraDetalhada=function(id){ const l=(db.leituras||[]).find(x=>x.id===id); if(!l) return; const c=contratoDaLeitura(l); const cl=cli(l.clienteId||(c&&c.clienteId))||{}; const total=(l.itens||[]).reduce((s,x)=>s+n(x.valorTotal),0); const html=`<!doctype html><html><head><meta charset="utf-8"><title>Leitura ${esc(l.numero)}</title><style>body{font-family:Arial;margin:26px;color:#111}.top{border-bottom:3px solid #0a1e8a;padding-bottom:12px;margin-bottom:16px}h1{color:#0a1e8a;margin:0}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ccc;padding:7px;font-size:12px}th{background:#eef2ff}.total{font-size:22px;font-weight:800;color:#0a1e8a;text-align:right;margin-top:18px}.no-print{margin-bottom:14px}@media print{.no-print{display:none}}</style></head><body><button class="no-print" onclick="window.print()">Imprimir / Salvar PDF</button><div class="top"><h1>DIGICOPY — Notinha de leitura</h1><p><b>Cliente:</b> ${esc(cl.nome||'')} • <b>Contrato:</b> ${esc(c&&c.numero||'')} • <b>Período:</b> ${esc(l.dataInicio||'')} a ${esc(l.dataFim||'')}</p></div><table><thead><tr><th>Impressora</th><th>Tipo</th><th>Anterior</th><th>Atual</th><th>Utilizado</th><th>Excedente</th><th>Valor</th></tr></thead><tbody>${(l.itens||[]).map(it=>`<tr><td>${esc(it.impressora)}</td><td>${esc(it.medidorLabel)} (${esc(it.modalidade)})</td><td>${it.anterior}</td><td>${it.atual}</td><td>${it.utilizado}</td><td>${it.excedente}</td><td>${money(it.valorTotal)}</td></tr>`).join('')}</tbody></table><div class="total">Valor total: ${money(total)}</div></body></html>`; const w=window.open('','_blank'); w.document.write(html); w.document.close(); };

// ── venda: busca só lupa/Enter e impressão só faturada ────────────────────
const oldCliDeb=window.vosVendaSearchClienteDeb; window.vosVendaSearchClienteDeb=function(){ /* sem busca a cada tecla */ };
const oldProdDeb=window.vosVendaSearchProdDeb; window.vosVendaSearchProdDeb=function(){ /* sem busca a cada tecla */ };
function ajustarBuscaVenda(){
  const ci=document.getElementById('vos-cli-search'); if(ci&&!document.getElementById('vos-cli-lupa')){ ci.removeAttribute('oninput'); ci.oninput=null; ci.onkeydown=e=>{ if(e.key==='Enter'){e.preventDefault(); window.vosVendaSearchCliente(ci.value);} }; ci.insertAdjacentHTML('afterend','<button id="vos-cli-lupa" type="button" onclick="vosVendaSearchCliente(document.getElementById(\'vos-cli-search\').value)" class="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-[#0a1e8a] text-white"><i class="ph ph-magnifying-glass"></i></button>'); }
  const pi=document.getElementById('vos-prod-search'); if(pi&&!document.getElementById('vos-prod-lupa')){ pi.removeAttribute('oninput'); pi.oninput=null; pi.onkeydown=e=>{ if(e.key==='Enter'){e.preventDefault(); window.vosVendaSearchProd(pi.value);} }; pi.insertAdjacentHTML('afterend','<button id="vos-prod-lupa" type="button" onclick="vosVendaSearchProd(document.getElementById(\'vos-prod-search\').value)" class="absolute right-2 top-[30px] h-8 px-3 rounded-lg bg-[#0a1e8a] text-white"><i class="ph ph-magnifying-glass"></i></button>'); }
}
const oldNova=window.novaVenda; if(typeof oldNova==='function') window.novaVenda=function(){ const r=oldNova.apply(this,arguments); setTimeout(ajustarBuscaVenda,80); return r; };
// v5.22.84 — impressão livre: a venda imprime em qualquer situação (salva,
// aberta, faturada, orçamento), no formato Vendas ou Ordem de Serviço.
// A trava antiga ("Fature a notinha antes de imprimir") foi removida a pedido.
window.estornarVendaParaEditar=function(id){ const v=(db.vendas||[]).find(x=>x.id===id); if(!v) return; if(!confirm('Estornar esta notinha para permitir edição?')) return; v.status='estornada'; v.estornada=true; (db.contasReceber||[]).forEach(c=>{ if(c.vendaId===v.id){ c.status='estornado'; c.estornado=true; c.pagamentoData=null; }}); salvar(); toast('Notinha estornada. Agora pode editar e faturar novamente.','success'); if(typeof renderVendas==='function') renderVendas(); };

// ── bloqueio visual para faturados ────────────────────────────────────────
document.addEventListener('focusin',ev=>{ const root=document.getElementById('modal-root'); if(!root||root.classList.contains('hidden')) return; const vendaId=window.__vosForm&&window.__vosForm.vendaId; const v=vendaId&&(db.vendas||[]).find(x=>x.id===vendaId); if(v&&['faturado','finalizada'].includes(low(v.status))&&ev.target.matches('input,textarea,select')){ ev.target.blur(); toast('Venda faturada: estorne para alterar.','info'); } });

window.AJUSTES_RELATORIO_PAI_PURE={ medidorDefault, consumoMed, cod };
console.log('[DIGICOPY] ajustes_relatorio_pai_patch.js v4.9.43 carregado');
})();
