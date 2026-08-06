// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.46 — Ajuste fino do fluxo de leituras e busca de impressoras
// • Histórico de leituras sem botão/radio de selecionar: abre no duplo clique
// • Faturamento fica dentro da leitura aberta
// • Lista de impressoras do contrato sem coluna de tipo/medidores ao lado
// • Novo lançamento com busca por Impressora, Serial, Patrimônio, Departamento ou Localização
// • Impressora some da lista quando todos os medidores ativos já foram lançados
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function low(v){ return txt(v).toLowerCase(); }
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
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function seq(tipo, lista, empId){ return typeof proximoNumeroSimples==='function'?proximoNumeroSimples(tipo,lista||[],empId):String((lista||[]).filter(x=>x.empresaId===empId).length+1); }
function setModal(titulo, corpo, rodape, max='1080px'){
  const root=document.getElementById('modal-root'), box=document.getElementById('modal-box'); if(!root||!box) return;
  box.className=`w-full max-w-[${max}] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col`;
  document.getElementById('modal-title').innerText=titulo;
  document.getElementById('modal-body').innerHTML=corpo;
  document.getElementById('modal-footer').innerHTML=rodape||'';
  root.classList.remove('hidden');
}

const MEDS=[['pretoA4','Preto A4'],['pretoA3','Preto A3'],['colorA4','Color A4'],['colorA3','Color A3'],['scanner','Scanner']];
function medPadrao(key){ return {ativo:key==='pretoA4',ocultar:key!=='pretoA4',modalidade:key==='pretoA4'?'individual':'inativo',contadorInicial:0,acrescimo:0,franquia:0,valorFranquia:0,valorExcedente:0,valorPagina:0,valorLocacao:0}; }
function normalizarModalidade(m){ const x=low(m); if(x==='global') return 'individual'; if(['individual','impressao','mes_fixo','inativo'].includes(x)) return x; if(x.includes('impress')) return 'impressao'; if(x.includes('fixo')||x.includes('mensal')) return 'mes_fixo'; return 'individual'; }
function getMedidores(p){
  p.medidoresConfig=p.medidoresConfig||p.medidores||{};
  MEDS.forEach(([k])=>{ const old=p.medidoresConfig[k]||{}; p.medidoresConfig[k]=Object.assign(medPadrao(k),old,{modalidade:normalizarModalidade(old.modalidade||old.modo||medPadrao(k).modalidade)}); if(p.medidoresConfig[k].modalidade==='inativo') p.medidoresConfig[k].ativo=false; p.medidoresConfig[k].ocultar=!p.medidoresConfig[k].ativo; });
  p.medidores=p.medidoresConfig;
  return p.medidoresConfig;
}
function medAtivos(p){ return MEDS.map(([key,label])=>({key,label,...getMedidores(p)[key]})).filter(m=>m.ativo&&!m.ocultar&&m.modalidade!=='inativo'); }
function medPendentes(p,l){ return medAtivos(p).filter(m=>!(l.itens||[]).some(it=>it.parqueId===p.id && it.medidor===m.key)); }
function calc(m, ant, atu){ const usado=Math.max(0,n(atu)-n(ant)); if(m.modalidade==='impressao') return {usado,excedente:usado,valorTotal:usado*n(m.valorPagina)+n(m.acrescimo)}; if(m.modalidade==='mes_fixo') return {usado,excedente:0,valorTotal:n(m.valorLocacao)}; const exc=Math.max(0,usado-n(m.franquia)); return {usado,excedente:exc,valorTotal:n(m.valorLocacao)+n(m.valorFranquia)+exc*n(m.valorExcedente)+n(m.acrescimo)}; }
function contratoLeitura(l){ return ctr(l.contratoId)||null; }
function linhaLeitura(l){ const c=contratoLeitura(l); const cl=cli(l.clienteId||(c&&c.clienteId))||{}; const itens=l.itens||[]; const usado=itens.reduce((s,x)=>s+n(x.utilizado),0); const exc=itens.reduce((s,x)=>s+n(x.excedente),0); const total=itens.reduce((s,x)=>s+n(x.valorTotal),0)||n(l.valorTotal||l.valorExcedente); return {c,cl,itens,usado,exc,total}; }
function maquinasContrato(c){ return (db.parque||[]).filter(p=>p.empresaId===c.empresaId&&p.contratoId===c.id&&p.status!=='inativo'); }

// Lista do contrato sem coluna "tipos/medidores" e sem botão de ação: abre no duplo clique.
window.openContratoCompleto=function(contratoId){
  const c=ctr(contratoId); if(!c) return toastMsg('Contrato não encontrado','error');
  const cl=cli(c.clienteId)||{}; const maq=maquinasContrato(c); const leit=(db.leituras||[]).filter(l=>l.contratoId===c.id); const ch=(db.os||[]).filter(o=>o.contratoId===c.id&&!['concluido','cancelado','fechado'].includes(low(o.status))).length;
  setModal(`Contrato ${esc(c.numero||'')} — ${esc(cl.nome||'Cliente')}`,`<div class="space-y-5 text-[13px]"><div class="rounded-[18px] bg-[#0a1e8a] text-white p-5 flex justify-between"><div><p class="text-[11px] uppercase font-bold text-white/70">Cliente</p><h3 class="text-[20px] font-extrabold">${esc(cl.nome||'')}</h3><p class="text-white/80">${esc(cl.documento||'')} ${cl.cidade?('• '+esc(cl.cidade)+'/'+esc(cl.estado||'')):''}</p></div><div class="text-right"><p class="text-[11px] uppercase font-bold text-white/70">Código</p><p class="text-[26px] font-extrabold">${esc(c.numero||'')}</p><p>${dataBR(c.dataInicio)} até ${dataBR(c.dataFim)}</p></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div class="rounded-[16px] border bg-emerald-50 p-4"><p class="neo-label">Impressoras</p><p class="neo-total">${maq.length}</p></div><div class="rounded-[16px] border bg-amber-50 p-4"><p class="neo-label">Chamados abertos</p><p class="neo-total">${ch}</p></div><div class="rounded-[16px] border bg-blue-50 p-4"><p class="neo-label">Valor mensal</p><p class="neo-total !text-[22px]">${money(c.valorMensalFixo||0)}</p></div><div class="rounded-[16px] border bg-purple-50 p-4"><p class="neo-label">Leituras</p><p class="neo-total">${leit.length}</p></div></div><div class="flex flex-wrap gap-3"><button onclick="abrirLeiturasContrato('${c.id}')" class="h-11 px-6 rounded-xl bg-emerald-600 text-white font-bold"><i class="ph ph-speedometer"></i> Leituras</button><button onclick="abrirChamadosContrato&&abrirChamadosContrato('${c.id}')" class="h-11 px-6 rounded-xl bg-blue-600 text-white font-bold"><i class="ph ph-wrench"></i> Chamados</button><button onclick="abrirModalEquipamentoContrato('${c.id}', null)" class="h-11 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold ml-auto"><i class="ph ph-printer"></i> Nova Impressora</button>${typeof baixarContratoRTF==='function'?`<button onclick="baixarContratoRTF('${c.id}','contrato')" class="h-11 px-4 rounded-xl bg-white border font-bold">Contrato RTF</button>`:''}</div><div class="border rounded-xl overflow-hidden"><div class="bg-slate-50 px-4 py-3 border-b"><b>Impressoras locadas</b><p class="text-[11px] text-slate-500">Duplo clique na impressora para alterar cadastro e modalidades.</p></div><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b"><tr><th class="px-4 py-2">Patrimônio</th><th>Modelo</th><th>Serial</th><th>Departamento / Localização</th><th>Status</th></tr></thead><tbody>${maq.map(p=>{ const e=eq(p.equipamentoId)||{}; return `<tr ondblclick="abrirModalEquipamentoContrato('${c.id}','${p.id}')" class="border-b cursor-pointer hover:bg-slate-50"><td class="px-4 py-2 font-mono font-bold text-[#0a1e8a]">${esc(e.patrimonio||p.patrimonio||'-')}</td><td>${esc(e.modelo||'')}</td><td class="font-mono">${esc(e.serie||'')}</td><td>${esc(p.setor||'Geral')}<br><span class="text-[11px] text-slate-500">${esc(p.localInstalacao||'')}</span></td><td><span class="neo-status ok">${esc(p.status||'ativo')}</span></td></tr>`; }).join('')||'<tr><td colspan="5" class="text-center text-slate-400 py-8">Nenhuma impressora cadastrada</td></tr>'}</tbody></table></div></div>`,`<button onclick="closeModal&&closeModal(true)" class="neo-btn">Fechar</button>`,'1080px');
};

// Histórico de leituras sem radio/select: abre somente no duplo clique. Faturamento fica dentro da leitura.
window.abrirLeiturasContrato=function(contratoId){
  const c=ctr(contratoId); if(!c) return; const cl=cli(c.clienteId)||{}; const list=(db.leituras||[]).filter(l=>l.contratoId===c.id).sort((a,b)=>new Date(b.dataLeitura||b.criadoEm||0)-new Date(a.dataLeitura||a.criadoEm||0));
  setModal(`Histórico de leituras — ${esc(cl.nome||'')}`,`<div class="space-y-4"><div class="rounded-xl bg-slate-50 border p-3"><b>Leituras realizadas</b><p class="text-[12px] text-slate-500">Dê duplo clique em uma leitura para abrir os lançamentos e faturar. As impressoras ficam dentro da leitura.</p></div><div class="rounded-xl border overflow-hidden"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50"><tr><th class="px-3 py-2">Código</th><th>Período</th><th>Lançada em</th><th>Utilizado</th><th>Exced.</th><th>Total</th><th>Status</th></tr></thead><tbody>${list.map(l=>{ const r=linhaLeitura(l); return `<tr ondblclick="abrirLeituraContratoDetalhe('${l.id}')" class="border-t hover:bg-slate-50 cursor-pointer"><td class="px-3 py-2"><b class="text-[#0a1e8a]">${esc(l.numero||cod(l.id))}</b><br><span class="text-[10px] text-slate-400">duplo clique</span></td><td>${dataBR(l.dataInicio)} a ${dataBR(l.dataFim)}</td><td>${dataBR(l.dataLeitura||l.criadoEm)}</td><td>${r.usado}</td><td>${r.exc}</td><td><b>${money(r.total)}</b></td><td><span class="neo-status ${l.status==='faturado'?'ok':'wait'}">${esc(l.status||'aberta')}</span></td></tr>`;}).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-8">Nenhuma leitura criada.</td></tr>'}</tbody></table></div></div>`,`<button onclick="openContratoCompleto('${c.id}')" class="neo-btn">Voltar ao contrato</button><button onclick="novaLeituraContrato('${c.id}')" class="neo-btn primary">Novo</button>`,'1040px');
};

function filtrarMaquinasLancamento(leituraId){
  const l=(db.leituras||[]).find(x=>x.id===leituraId); if(!l) return [];
  const c=contratoLeitura(l); if(!c) return [];
  const campo=document.getElementById('lan-filtro-campo')?.value||'impressora';
  const q=low(document.getElementById('lan-filtro-texto')?.value||'');
  return maquinasContrato(c).filter(p=>medPendentes(p,l).length>0).filter(p=>{
    if(!q) return true;
    const e=eq(p.equipamentoId)||{};
    const alvo={impressora:[e.modelo,e.descricao].join(' '),serial:e.serie,patrimonio:e.patrimonio||p.patrimonio,departamento:p.setor,localizacao:p.localInstalacao}[campo]||'';
    return low(alvo).includes(q);
  });
}
function optionMaquina(p){ const e=eq(p.equipamentoId)||{}; return `<option value="${p.id}">${esc(e.patrimonio||p.patrimonio||'-')} — ${esc(e.modelo||'Impressora')} — ${esc(e.serie||'')}</option>`; }
window.buscarImpressorasLancamento=function(leituraId){
  const sel=document.getElementById('lan-prq'); if(!sel) return;
  const lista=filtrarMaquinasLancamento(leituraId);
  sel.innerHTML='<option value="">Selecione</option>'+lista.map(optionMaquina).join('');
  if(lista.length===1){ sel.value=lista[0].id; atualizarTiposLancamento(); }
  else { const med=document.getElementById('lan-med'); if(med) med.innerHTML='<option value="">Escolha a impressora</option>'; }
  const info=document.getElementById('lan-busca-info'); if(info) info.innerText=`${lista.length} impressora(s) com lançamento pendente`;
};
window.abrirLancamentoContador=function(leituraId){
  const l=(db.leituras||[]).find(x=>x.id===leituraId); if(!l) return; const c=contratoLeitura(l); const totalPend=maquinasContrato(c).filter(p=>medPendentes(p,l).length>0).length;
  setModal('Novo lançamento de contador',`<input type="hidden" id="lan-leitura-id" value="${l.id}"><div class="space-y-4 text-[13px]"><div class="rounded-xl border bg-slate-50 p-3"><b>Buscar impressora</b><p class="text-[11px] text-slate-500">Use a busca quando o contrato tiver muitas impressoras. A lista mostra somente impressoras com medidores pendentes.</p><div class="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2"><select id="lan-filtro-campo" class="h-10 px-3 rounded-xl border"><option value="impressora">Impressora</option><option value="serial">Serial</option><option value="patrimonio">Patrimônio</option><option value="departamento">Departamento</option><option value="localizacao">Localização</option></select><input id="lan-filtro-texto" onkeydown="if(event.key==='Enter'){event.preventDefault(); buscarImpressorasLancamento('${l.id}')}" class="md:col-span-2 h-10 px-3 rounded-xl border" placeholder="Digite o termo da busca"><button onclick="buscarImpressorasLancamento('${l.id}')" class="h-10 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i> Buscar</button></div><p id="lan-busca-info" class="text-[11px] text-slate-500 mt-2">${totalPend} impressora(s) com lançamento pendente</p></div><label class="font-bold text-slate-600">Impressora<select id="lan-prq" onchange="atualizarTiposLancamento()" class="mt-1 w-full h-10 px-3 rounded-xl border"><option value="">Selecione</option>${filtrarMaquinasLancamento(leituraId).map(optionMaquina).join('')}</select></label><label class="font-bold text-slate-600">Tipo de impressão ativo<select id="lan-med" class="mt-1 w-full h-10 px-3 rounded-xl border"><option value="">Escolha a impressora</option></select></label><label class="font-bold text-slate-600">Contador atual<input id="lan-cont" type="number" autofocus class="mt-1 w-full h-12 px-3 rounded-xl border text-[18px] font-mono font-bold" placeholder="Digite somente o contador"></label></div>`,`<button onclick="abrirLeituraContratoDetalhe('${l.id}')" class="neo-btn">Voltar</button><button onclick="salvarLancamentoContador('${l.id}')" class="neo-btn primary">Salvar lançamento</button>`,'760px');
};
window.atualizarTiposLancamento=function(){ const lId=document.getElementById('lan-leitura-id')?.value; const p=prq(document.getElementById('lan-prq')?.value); const sel=document.getElementById('lan-med'); const l=(db.leituras||[]).find(x=>x.id===lId)||{itens:[]}; if(sel) sel.innerHTML=p?medPendentes(p,l).map(m=>`<option value="${m.key}">${esc(m.label)} — ${esc(m.modalidade)}</option>`).join('')||'<option value="">Todos os tipos ativos já lançados</option>':'<option value="">Escolha a impressora</option>'; };
window.salvarLancamentoContador=function(leituraId){ const l=(db.leituras||[]).find(x=>x.id===leituraId); const p=prq(document.getElementById('lan-prq')?.value); if(!l||!p) return toastMsg('Selecione a impressora','error'); const key=document.getElementById('lan-med')?.value; const med=medPendentes(p,l).find(m=>m.key===key); if(!med) return toastMsg('Selecione um tipo ativo ainda não lançado','error'); const atual=n(document.getElementById('lan-cont')?.value); const e=eq(p.equipamentoId)||{}; p.contadores=p.contadores||{}; const anterior=n(p.contadores[key] ?? med.contadorInicial); const r=calc(med,anterior,atual); p.contadores[key]=atual; l.itens=l.itens||[]; l.itens.push({parqueId:p.id,equipamentoId:p.equipamentoId,impressora:`${e.patrimonio||''} ${e.modelo||''}`.trim(),medidor:key,medidorLabel:med.label,modalidade:med.modalidade,anterior,atual,utilizado:r.usado,excedente:r.excedente,valorTotal:r.valorTotal}); l.valorTotal=l.itens.reduce((s,x)=>s+n(x.valorTotal),0); l.valorExcedente=l.valorTotal; salvar(); toastMsg('Lançamento salvo','success'); abrirLeituraContratoDetalhe(l.id); };

window.LEITURA_BUSCA_FLUXO_PURE={ filtrarMaquinasLancamento:function(dbRef, leitura, maquinas, equipamentos, campo, q){ const oldDb=window.db; window.db=dbRef; try{ return (maquinas||[]).filter(p=>{ const e=(equipamentos||[]).find(x=>x.id===p.equipamentoId)||{}; const alvo={impressora:[e.modelo,e.descricao].join(' '),serial:e.serie,patrimonio:e.patrimonio||p.patrimonio,departamento:p.setor,localizacao:p.localInstalacao}[campo]||''; return !q||low(alvo).includes(low(q)); }); } finally{ window.db=oldDb; } }, medPendentes, medPadrao, normalizarModalidade };
console.log('[DIGICOPY] leitura_busca_fluxo_patch.js v4.9.46 carregado');
})();
