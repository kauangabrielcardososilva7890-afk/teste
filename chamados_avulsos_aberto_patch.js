// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.16 — Chamado avulso aberto/profissional
// • A tela fora do contrato fica para atendimento avulso
// • Não usa formulário fechado por contrato: cliente e impressora ficam em busca aberta
// • Histórico continua compartilhado com chamados do contrato
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function esc(v){ return String(v ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }
function n(v, fb=0){ const out = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(out) ? out : fb; }
function i(v, fb=0){ const out = parseInt(String(v ?? ''), 10); return Number.isFinite(out) ? out : fb; }
function norm(v){ return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim(); }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function uidSafe(p){ return typeof uid === 'function' ? uid(p) : `${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
function salvar(){ if(typeof saveDB === 'function') saveDB(); }
function aviso(m,t){ if(typeof toast === 'function') toast(m,t||'info'); }
function logar(e,a,id,d){ if(typeof logAction === 'function') logAction(e,a,id,d); }
function cliente(id){ return (db.clientes || []).find(c => c.id === id) || null; }
function equipamento(id){ return (db.equipamentos || []).find(e => e.id === id) || null; }
function parquesCliente(clienteId){ return (db.parque || []).filter(p => p.clienteId === clienteId); }
function codigoSimples(value){ const g = String(value ?? '').match(/\d+/g); if(!g) return ''; const s = g[g.length-1].replace(/^0+/,''); return s || '0'; }
function numeroCodigo(value){ const out = parseInt(codigoSimples(value), 10); return Number.isFinite(out) ? out : 0; }
function proximoOS(empresaId){ const nums = (db.os || []).filter(o => !empresaId || o.empresaId === empresaId).map(o => numeroCodigo(o.numero)); return String((nums.length ? Math.max(...nums) : 0) + 1); }
function titlePessoa(v){
  const txt = String(v || '').trim();
  if(!txt) return '';
  if(window.VOTM_PURE && typeof window.VOTM_PURE.toTitleCase === 'function') return window.VOTM_PURE.toTitleCase(txt);
  return txt.toLowerCase().replace(/\b\p{L}/gu, c => c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, m => m.toLowerCase());
}
function ultimoContador(equipId, ignoreOsId){
  const eq = equipamento(equipId) || {};
  let best = { valor:n(eq.contadorPB,0), data:eq.atualizadoEm || eq.criadoEm || '' };
  (db.leituras || []).forEach(l => { if(l.equipamentoId !== equipId) return; const d=l.dataLeitura||l.criadoEm||''; if(!best.data || new Date(d)>=new Date(best.data||0)) best={valor:n(l.contadorPB,0),data:d}; });
  (db.os || []).forEach(o => { if(ignoreOsId && o.id===ignoreOsId) return; if(o.equipamentoId !== equipId) return; const d=o.dataFechamento||o.dataAbertura||o.criadoEm||''; if(!best.data || new Date(d)>=new Date(best.data||0)) best={valor:n(o.contadorAtual,0),data:d}; });
  return best.valor;
}
function setModal(title, body, footer){
  const box = document.getElementById('modal-box'); if(box) box.className = 'w-full max-w-[980px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  const t = document.getElementById('modal-title'); if(t) t.innerText = title;
  const b = document.getElementById('modal-body'); if(b) b.innerHTML = body;
  const f = document.getElementById('modal-footer'); if(f) f.innerHTML = footer || '';
  document.getElementById('modal-root')?.classList.remove('hidden');
}
function fechar(){ if(typeof closeModal === 'function') closeModal(); else document.getElementById('modal-root')?.classList.add('hidden'); }
function bindEnter(id, cb){ const el=document.getElementById(id); if(el){ el.removeAttribute('oninput'); el.oninput=null; el.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); cb(); } }; } }
function botaoBusca(onclick){ return `<button type="button" onclick="${onclick}" class="h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i></button>`; }

window.__CHAMADO_AVULSO = window.__CHAMADO_AVULSO || { clienteId:'', equipamentoId:'' };

function renderClientesResultado(){
  const s = sess(); if(!s) return;
  const q = norm(document.getElementById('ca-busca-cliente')?.value || '');
  const out = document.getElementById('ca-clientes-result'); if(!out) return;
  let lista = (db.clientes || []).filter(c => c.empresaId === s.empresaId && c.status !== 'inativo');
  if(q) lista = lista.filter(c => [c.codigo, c.codigoAntigo, c.nome, c.fantasia, c.documento, c.telefone].some(v => norm(v).includes(q)));
  lista = lista.slice(0, 30);
  out.innerHTML = lista.map(c => `<button type="button" onclick="selecionarClienteChamadoAvulso('${c.id}')" class="w-full text-left p-2 hover:bg-blue-50 border-b last:border-0"><b>${esc(c.codigo || c.codigoAntigo || '')}</b> ${esc(c.nome || 'Cliente sem nome')}<br><span class="text-[11px] text-slate-500">${esc(c.documento || '')} • ${esc(c.telefone || '')}</span></button>`).join('') || '<p class="p-3 text-center text-slate-400">Nenhum cliente encontrado</p>';
}
function renderImpressorasResultado(clienteId){
  const out = document.getElementById('ca-impressoras-result'); if(!out) return;
  const q = norm(document.getElementById('ca-busca-impressora')?.value || '');
  let lista = parquesCliente(clienteId || window.__CHAMADO_AVULSO.clienteId);
  if(q) lista = lista.filter(p => { const e=equipamento(p.equipamentoId)||{}; return [e.patrimonio,e.modelo,e.serie,p.setor,p.localInstalacao].some(v=>norm(v).includes(q)); });
  out.innerHTML = lista.map(p => { const e=equipamento(p.equipamentoId)||{}; return `<button type="button" onclick="selecionarImpressoraChamadoAvulso('${p.equipamentoId}')" class="w-full text-left p-2 hover:bg-blue-50 border-b last:border-0"><b>Patr. ${esc(e.patrimonio||'-')}</b> — ${esc(e.modelo||'')}<br><span class="text-[11px] text-slate-500">Serial ${esc(e.serie||'-')} • ${esc(p.setor||'Geral')} / ${esc(p.localInstalacao||'')}</span></button>`; }).join('') || '<p class="p-3 text-center text-slate-400">Nenhuma impressora para este cliente</p>';
}

window.buscarClientesChamadoAvulso = renderClientesResultado;
window.buscarImpressorasChamadoAvulso = function(){ renderImpressorasResultado(); };
window.selecionarClienteChamadoAvulso = function(id){
  window.__CHAMADO_AVULSO.clienteId = id;
  const c = cliente(id) || {};
  const el = document.getElementById('ca-cliente-selecionado'); if(el) el.innerHTML = `<b>${esc(c.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(c.documento||'')} • ${esc(c.telefone||'')}</span>`;
  renderImpressorasResultado(id);
};
window.selecionarImpressoraChamadoAvulso = function(equipId){
  window.__CHAMADO_AVULSO.equipamentoId = equipId;
  const e = equipamento(equipId) || {};
  const p = (db.parque || []).find(x => x.equipamentoId === equipId) || {};
  const ant = ultimoContador(equipId);
  ['modelo','patr','serie','local'].forEach(k => { const el=document.getElementById('ca-'+k); if(el){ if(k==='modelo') el.value=e.modelo||''; if(k==='patr') el.value=e.patrimonio||''; if(k==='serie') el.value=e.serie||''; if(k==='local') el.value=p.localInstalacao||p.setor||''; }});
  const antEl = document.getElementById('ca-cont-ant'); if(antEl) antEl.value = ant;
  const atuEl = document.getElementById('ca-cont-atu'); if(atuEl) atuEl.value = ant;
  window.calcChamadoAvulso();
};
window.calcChamadoAvulso = function(){ const ant=n(document.getElementById('ca-cont-ant')?.value); const atu=Math.max(ant,n(document.getElementById('ca-cont-atu')?.value,ant)); const out=document.getElementById('ca-qtd'); if(out) out.value=atu-ant; };

function renderChamadoAvulso(id){
  const s = sess(); if(!s) return;
  const o = id ? (db.os || []).find(x => x.id === id) : null;
  window.__CHAMADO_AVULSO = { clienteId:o?.clienteId || '', equipamentoId:o?.equipamentoId || '' };
  const c = o ? cliente(o.clienteId) : null;
  const codigo = o ? codigoSimples(o.numero) : proximoOS(s.empresaId);
  setModal(o ? `Chamado avulso ${codigo}` : 'Novo chamado avulso', `<div class="space-y-4 text-[13px]">
    <div class="rounded-xl bg-blue-50 border border-blue-200 p-3"><b>Chamado fora de contrato</b><p class="text-[12px] text-blue-800 mt-1">Use para atendimento avulso. Para cliente de contrato, abra pelo contrato.</p></div>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Código</label><input id="ca-num" readonly value="${esc(codigo)}" class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold"></div><div><label class="block font-bold text-slate-600 mb-1">Data</label><input id="ca-data" type="date" value="${String(o?.dataAbertura || new Date().toISOString()).slice(0,10)}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Prioridade</label><select id="ca-prio" class="w-full h-10 px-3 rounded-xl border"><option value="normal">Normal</option><option value="alta">Alta</option><option value="baixa">Baixa</option></select></div><div><label class="block font-bold text-slate-600 mb-1">Criado por</label><input readonly value="${esc(o?.criadoPorNome || s.usuarioNome)}" class="w-full h-10 px-3 rounded-xl border bg-slate-50"></div><div><label class="block font-bold text-slate-600 mb-1">Técnico</label><input id="ca-tec" value="${esc(o?.tecnico || s.usuarioNome)}" class="w-full h-10 px-3 rounded-xl border"></div></div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div class="rounded-xl border p-3"><label class="block font-bold text-slate-600 mb-1">Buscar cliente</label><div class="flex gap-2"><input id="ca-busca-cliente" placeholder="Digite código, nome, documento..." class="flex-1 h-10 px-3 rounded-xl border">${botaoBusca('buscarClientesChamadoAvulso()')}</div><div id="ca-cliente-selecionado" class="mt-2 rounded-lg bg-slate-50 p-2 text-[12px]">${c ? `<b>${esc(c.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(c.documento||'')} • ${esc(c.telefone||'')}</span>` : 'Nenhum cliente selecionado'}</div><div id="ca-clientes-result" class="mt-2 max-h-[170px] overflow-auto rounded-lg border bg-white"></div></div><div class="rounded-xl border p-3"><label class="block font-bold text-slate-600 mb-1">Buscar impressora do cliente</label><div class="flex gap-2"><input id="ca-busca-impressora" placeholder="Patrimônio, modelo, serial..." class="flex-1 h-10 px-3 rounded-xl border">${botaoBusca('buscarImpressorasChamadoAvulso()')}</div><div id="ca-impressoras-result" class="mt-2 max-h-[220px] overflow-auto rounded-lg border bg-white"></div></div></div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Modelo</label><input id="ca-modelo" value="${esc(o?.modelo||'')}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Patrimônio</label><input id="ca-patr" value="${esc(o?.patrimonio||'')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div><div><label class="block font-bold text-slate-600 mb-1">Serial</label><input id="ca-serie" value="${esc(o?.serie||'')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div><div><label class="block font-bold text-slate-600 mb-1">Local</label><input id="ca-local" value="${esc(o?.local||'')}" class="w-full h-10 px-3 rounded-xl border"></div></div>
    <div><label class="block font-bold text-slate-600 mb-1">Motivo / Defeito *</label><input id="ca-desc" value="${esc(o?.descricao||'')}" class="w-full h-10 px-3 rounded-xl border font-semibold"></div>
    <label class="bg-slate-50 border rounded-xl p-3 flex items-center gap-3 cursor-pointer"><input type="checkbox" id="ca-concluido" ${o?.status==='concluido'?'checked':''}><span class="font-bold">Este chamado já foi finalizado?</span></label>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 border rounded-xl"><div><label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Preto Antigo</label><input id="ca-cont-ant" type="number" value="${n(o?.contadorAntigo)}" readonly class="w-full h-10 px-3 rounded-xl border font-mono font-bold text-[#0a1e8a]"></div><div><label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Preto Atual</label><input id="ca-cont-atu" type="number" value="${o?.contadorAtual ?? ''}" oninput="calcChamadoAvulso()" class="w-full h-10 px-3 rounded-xl border-2 border-[#0a1e8a] font-mono font-bold"></div><div><label class="block font-bold text-emerald-700 mb-1 text-[11px] uppercase">Quantidade Impressos</label><input id="ca-qtd" type="number" value="${n(o?.quantidadeImpressos)}" readonly class="w-full h-10 px-3 rounded-xl border bg-emerald-50 font-bold text-emerald-700"></div></div>
    <div><label class="block font-bold text-slate-600 mb-1">Serviços / Observações</label><textarea id="ca-serv" class="w-full h-24 p-3 rounded-xl border">${esc(o?.servicos || o?.observacao || '')}</textarea></div>
  </div>`, `<button onclick="fecharModalChamadoAvulso()" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button><button onclick="salvarChamadoAvulso('${id || ''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar chamado</button>`);
  document.getElementById('ca-prio').value = o?.prioridade || 'normal';
  bindEnter('ca-busca-cliente', renderClientesResultado);
  bindEnter('ca-busca-impressora', () => renderImpressorasResultado());
  if(c) renderImpressorasResultado(c.id);
}
window.fecharModalChamadoAvulso = fechar;
window.salvarChamadoAvulso = function(id){
  const s = sess(); if(!s) return;
  const clienteId = window.__CHAMADO_AVULSO.clienteId || '';
  const desc = document.getElementById('ca-desc')?.value?.trim() || '';
  if(!clienteId) return aviso('Selecione o cliente', 'error');
  if(!desc) return aviso('Informe o motivo do chamado', 'error');
  const equipamentoId = window.__CHAMADO_AVULSO.equipamentoId || null;
  const payload = { empresaId:s.empresaId, clienteId, contratoId:null, numero:codigoSimples(document.getElementById('ca-num')?.value) || proximoOS(s.empresaId), dataAbertura:new Date(`${document.getElementById('ca-data')?.value || new Date().toISOString().slice(0,10)}T12:00:00`).toISOString(), prioridade:document.getElementById('ca-prio')?.value || 'normal', tecnico:titlePessoa(document.getElementById('ca-tec')?.value || s.usuarioNome), descricao:desc, status:document.getElementById('ca-concluido')?.checked ? 'concluido' : 'aberto', equipamentoId, modelo:document.getElementById('ca-modelo')?.value?.trim() || '', patrimonio:document.getElementById('ca-patr')?.value?.trim() || '', serie:document.getElementById('ca-serie')?.value?.trim() || '', local:document.getElementById('ca-local')?.value?.trim() || '', contadorAntigo:n(document.getElementById('ca-cont-ant')?.value), contadorAtual:n(document.getElementById('ca-cont-atu')?.value), quantidadeImpressos:n(document.getElementById('ca-qtd')?.value), servicos:document.getElementById('ca-serv')?.value?.trim() || '', observacao:document.getElementById('ca-serv')?.value?.trim() || '', dataFechamento:document.getElementById('ca-concluido')?.checked ? new Date().toISOString() : null };
  if(id){ const old=(db.os||[]).find(o=>o.id===id); Object.assign(old, payload, { atualizadoEm:new Date().toISOString(), atualizadoPorNome:s.usuarioNome }); logar('os','editar',id,`Chamado ${payload.numero} editado por ${s.usuarioNome}`); }
  else { const novo={ id:uidSafe('os'), criadoEm:new Date().toISOString(), criadoPor:s.usuarioId, criadoPorNome:s.usuarioNome, ...payload }; db.os.push(novo); logar('os','criar',novo.id,`Chamado ${novo.numero} aberto por ${s.usuarioNome}`); }
  const e = equipamento(equipamentoId); if(e && payload.contadorAtual) e.contadorPB = Math.max(n(e.contadorPB), payload.contadorAtual);
  salvar(); fechar(); if(typeof renderOs === 'function') renderOs(); aviso('Chamado salvo', 'success');
};

window.CHAMADOS_AVULSOS_PURE = { codigoSimples };

const oldOpenModal = window.openModal;
window.openModal = function(type, id){
  if(type === 'os') return renderChamadoAvulso(id);
  if(oldOpenModal) return oldOpenModal.apply(this, arguments);
};

console.log('[DIGICOPY] chamados_avulsos_aberto_patch.js v4.9.16 carregado');
})();
