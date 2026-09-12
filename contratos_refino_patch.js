// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.14 — Refinos de Contratos/Leituras/Chamados pedidos pelo Operacional
// • Leituras ficam apenas dentro do contrato
// • Impressoras do cliente aparecem no contrato, leitura e chamado
// • Códigos internos sempre numéricos simples
// • Medidores da impressora independentes: Preto A4, Color A4, Scanner, Preto A3, Color A3
// • Chamado mostra criador e técnico separados
// • Relatórios com logo e visual melhorado
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const PATCH_VERSION = '4.9.14';
const MEDIDORES = [
  { key: 'pretoA4', label: 'Preto A4', contador: 'contadorPB' },
  { key: 'colorA4', label: 'Color A4', contador: 'contadorCor' },
  { key: 'scanner', label: 'Scanner', contador: 'contadorScanner' },
  { key: 'pretoA3', label: 'Preto A3', contador: 'contadorPretoA3' },
  { key: 'colorA3', label: 'Color A3', contador: 'contadorColorA3' }
];

function n(value, fallback = 0){
  if(value === null || value === undefined || value === '') return fallback;
  const out = Number(String(value).replace(',', '.'));
  return Number.isFinite(out) ? out : fallback;
}
function i(value, fallback = 0){
  const out = parseInt(String(value ?? '').replace(',', '.'), 10);
  return Number.isFinite(out) ? out : fallback;
}
function esc(value){
  return String(value ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}
function norm(value){
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}
function dinheiro(value){
  return typeof fmtMoney === 'function' ? fmtMoney(n(value)) : n(value).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}
function dataBR(value){
  if(typeof fmtDate === 'function') return fmtDate(value);
  if(!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value).slice(0,10).split('-').reverse().join('/') : d.toLocaleDateString('pt-BR');
}
function uidLocal(prefix){
  return typeof uid === 'function' ? uid(prefix) : `${prefix || 'id'}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}
function sess(){
  return typeof getSession === 'function' ? getSession() : null;
}
function salvar(){ if(typeof saveDB === 'function') saveDB(); }
function aviso(msg, type){ if(typeof toast === 'function') toast(msg, type || 'info'); }
function logar(ent, acao, id, det){ if(typeof logAction === 'function') logAction(ent, acao, id, det); }
function tituloPessoa(value){
  const txt = String(value || '').trim();
  if(!txt) return '';
  if(window.VOTM_PURE && typeof window.VOTM_PURE.toTitleCase === 'function') return window.VOTM_PURE.toTitleCase(txt);
  return txt.toLowerCase().replace(/\b\p{L}/gu, c => c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, m => m.toLowerCase());
}
function compara(a,b){
  const A = String(a ?? '').trim();
  const B = String(b ?? '').trim();
  if(!A && B) return 1;
  if(A && !B) return -1;
  const AN = Number(A.replace(',', '.'));
  const BN = Number(B.replace(',', '.'));
  if(Number.isFinite(AN) && Number.isFinite(BN)) return AN - BN;
  return A.localeCompare(B, 'pt-BR', { numeric:true, sensitivity:'base' });
}
function ordenar(lista, getter){ return [...(lista || [])].sort((a,b) => compara(getter(a), getter(b))); }

function codigoSimples(value){
  const grupos = String(value ?? '').match(/\d+/g);
  if(!grupos || !grupos.length) return '';
  const last = grupos[grupos.length - 1].replace(/^0+/, '');
  return last || '0';
}
function numeroCodigo(value){
  const c = codigoSimples(value);
  const out = parseInt(c, 10);
  return Number.isFinite(out) ? out : 0;
}
function proximoCodigo(lista, empresaId){
  const nums = (lista || [])
    .filter(x => !empresaId || !x.empresaId || x.empresaId === empresaId)
    .map(x => numeroCodigo(x.numero || x.codigo || x.id))
    .filter(x => Number.isFinite(x));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1);
}
function codigoContrato(c){ return codigoSimples(c && c.numero) || String((c && c.codigo) || ''); }
function codigoOS(o){ return codigoSimples(o && o.numero) || String((o && o.codigo) || ''); }

function getCli(id){ return (db.clientes || []).find(c => c.id === id) || null; }
function getCtr(id){ return (db.contratos || []).find(c => c.id === id) || null; }
function getEq(id){ return (db.equipamentos || []).find(e => e.id === id) || null; }
function getParque(id){ return (db.parque || []).find(p => p.id === id) || null; }
function nomeCliente(c){ return (getCli(c && c.clienteId) || {}).nome || (c && c.clienteNome) || 'Sem cliente'; }
function logoSrc(){ return window.DIGICOPY_LOGO || './logo.png'; }
function logoHTML(){ return `<img src="${logoSrc()}" style="width:58px;height:58px;object-fit:contain">`; }

function medidorPadrao(key, base){
  const label = (MEDIDORES.find(m => m.key === key) || {}).label || key;
  return {
    key,
    label,
    modalidade: key === 'scanner' ? 'impressao' : (base && base.modalidade) || 'global',
    franquia: n(base && base.franquiaPB, 0),
    valor: n(base && base.valorExcedentePB, 0),
    contadorAnterior: '',
    ativo: true
  };
}
function normalizarMedidores(parque){
  const out = {};
  MEDIDORES.forEach(m => {
    out[m.key] = Object.assign(medidorPadrao(m.key, parque || {}), (parque && parque.medidores && parque.medidores[m.key]) || {});
    out[m.key].key = m.key;
    out[m.key].label = m.label;
  });
  return out;
}

function parquesDoClienteContrato(dbRef, contrato, opts = {}){
  if(!contrato) return [];
  const todos = !!opts.todos;
  const lista = (dbRef.parque || []).filter(p =>
    (p.contratoId === contrato.id || p.clienteId === contrato.clienteId) &&
    (todos || p.status === 'ativo')
  );
  const seen = new Set();
  return lista.filter(p => {
    const k = p.id || `${p.equipamentoId}-${p.contratoId}-${p.clienteId}`;
    if(seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function ultimoContador(equipId, ignoreOsId){
  const eq = getEq(equipId) || {};
  let best = { valor: n(eq.contadorPB, 0), data: eq.atualizadoEm || eq.criadoEm || '', origem: 'cadastro' };
  (db.leituras || []).forEach(l => {
    if(l.equipamentoId !== equipId) return;
    const d = l.dataLeitura || l.criadoEm || '';
    if(!best.data || new Date(d) >= new Date(best.data || 0)) best = { valor: n(l.contadorPB, 0), data: d, origem: 'leitura' };
  });
  (db.os || []).forEach(o => {
    if(ignoreOsId && o.id === ignoreOsId) return;
    if(o.equipamentoId !== equipId) return;
    const d = o.dataFechamento || o.dataAbertura || o.criadoEm || '';
    if(!best.data || new Date(d) >= new Date(best.data || 0)) best = { valor: n(o.contadorAtual, 0), data: d, origem: 'chamado' };
  });
  return best;
}

function periodo(value){ return String(value || new Date().toISOString()).slice(0, 7); }
function isoData(value){ return value ? new Date(`${String(value).slice(0,10)}T12:00:00`).toISOString() : new Date().toISOString(); }
function calcLeitura(contrato, parque, anterior, atual, dataLeitura, leituraIgnorar){
  const ant = Math.max(0, n(anterior, 0));
  const atu = Math.max(ant, n(atual, ant));
  const usado = atu - ant;
  const meds = normalizarMedidores(parque);
  const med = meds.pretoA4;
  const modo = med.modalidade || parque.modalidade || 'global';
  const valorPag = n(med.valor, n(parque.valorExcedentePB, n(contrato.valorExcedentePB, 0)));
  let exc = 0;
  if(modo === 'impressao') exc = usado;
  else if(modo === 'mes_fixo') exc = 0;
  else if(modo === 'individual') exc = Math.max(0, usado - n(med.franquia, n(parque.franquiaPB, 0)));
  else {
    const per = periodo(dataLeitura);
    const usadasAntes = (db.leituras || []).filter(l =>
      l.id !== leituraIgnorar &&
      l.contratoId === contrato.id &&
      periodo(l.dataLeitura) === per
    ).reduce((s,l) => s + n(l.consumoPB, 0), 0);
    const antes = Math.max(0, usadasAntes - n(contrato.franquiaPB, 0));
    const depois = Math.max(0, usadasAntes + usado - n(contrato.franquiaPB, 0));
    exc = Math.max(0, depois - antes);
  }
  return { anterior: ant, atual: atu, utilizado: usado, qtdExcedente: exc, valorExcedente: exc * valorPag, modalidade: modo };
}
function chamadoVencido(dataAbertura, status){
  const st = norm(status || 'aberto');
  if(['CONCLUIDO','CANCELADO','FECHADO'].includes(st)) return false;
  return !!dataAbertura && String(dataAbertura).slice(0,10) < new Date().toISOString().slice(0,10);
}

window.CONTRATOS_REFINO_PURE = { codigoSimples, numeroCodigo, proximoCodigo, medidorPadrao, normalizarMedidores, parquesDoClienteContrato, chamadoVencido };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

const STATE = window.__KAUAN_REFINO_STATE__ || (window.__KAUAN_REFINO_STATE__ = {
  contratoBusca: '', contratoStatus: '', contratoSort: 'codigo',
  leituraBusca: '', leituraData: '',
  chamadoBusca: '', chamadoStatus: 'abertos', chamadoSort: 'codigo',
  medidorTab: 'pretoA4'
});

function setModal(titulo, body, footer, max = '980px'){
  const box = document.getElementById('modal-box');
  if(box) box.className = `w-full max-w-[${max}] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col`;
  const title = document.getElementById('modal-title'); if(title) title.innerText = titulo;
  const b = document.getElementById('modal-body'); if(b) b.innerHTML = body;
  const f = document.getElementById('modal-footer'); if(f) f.innerHTML = footer || '';
  document.getElementById('modal-root')?.classList.remove('hidden');
}
function closeK(){ if(typeof closeModal === 'function') closeModal(); else document.getElementById('modal-root')?.classList.add('hidden'); }
window.fecharModalOperacional = closeK;

function bindEnter(id, cb){
  const el = document.getElementById(id);
  if(!el) return;
  el.removeAttribute('oninput');
  el.oninput = null;
  el.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); cb(); } };
}
function btnBusca(onclick){ return `<button type="button" onclick="${onclick}" class="h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i></button>`; }

function ocultarLeiturasSeparadas(){
  document.querySelectorAll("button[onclick=\"navigateTo('leituras')\"], button[data-nav='leituras']").forEach(el => { el.style.display = 'none'; });
}
const oldNavigateToRefino = window.navigateTo;
if(typeof oldNavigateToRefino === 'function'){
  window.navigateTo = function(view){
    if(view === 'leituras'){
      aviso('As leituras agora ficam dentro do contrato. Abra Locação > Contratos e dê duplo clique no cliente.', 'info');
      return oldNavigateToRefino('contratos');
    }
    return oldNavigateToRefino.apply(this, arguments);
  };
}
setTimeout(ocultarLeiturasSeparadas, 200);
try{ new MutationObserver(ocultarLeiturasSeparadas).observe(document.body, { childList:true, subtree:true }); }catch(_e){}

function thContrato(col, label){ return `<th onclick="contratosSortRefino('${col}')" class="px-4 py-2.5 cursor-pointer hover:text-[#0a1e8a]">${label}${STATE.contratoSort === col ? ' ▲' : ''}</th>`; }
window.aplicarBuscaContratosRefino = function(){
  STATE.contratoBusca = document.getElementById('search-contratos')?.value || '';
  STATE.contratoStatus = document.getElementById('filter-contrato-status')?.value || '';
  window.renderContratos();
};
window.contratosSortRefino = function(col){ STATE.contratoSort = col; window.renderContratos(); };
window.renderContratos = function(){
  const s = sess(); if(!s) return;
  const view = document.getElementById('view-contratos');
  if(!view || view.classList.contains('hidden')) return;
  const q = norm(STATE.contratoBusca);
  let lista = (db.contratos || []).filter(c => c.empresaId === s.empresaId && c.status !== 'excluido');
  if(STATE.contratoStatus) lista = lista.filter(c => c.status === STATE.contratoStatus);
  if(q) lista = lista.filter(c => [codigoContrato(c), c.numero, nomeCliente(c), c.status].some(v => norm(v).includes(q)));
  const sorters = {
    codigo: c => numeroCodigo(c.numero || c.codigo), cliente: c => nomeCliente(c), inicio: c => c.dataInicio || '', fim: c => c.dataFim || '',
    impressoras: c => parquesDoClienteContrato(db, c).length, chamados: c => (db.os || []).filter(o => o.clienteId === c.clienteId && !['concluido','cancelado','fechado'].includes(o.status)).length,
    valor: c => n(c.valorMensalFixo, 0), status: c => c.status || ''
  };
  lista = ordenar(lista, sorters[STATE.contratoSort] || sorters.codigo);
  const ativos = (db.contratos || []).filter(c => c.empresaId === s.empresaId && c.status === 'ativo');
  view.innerHTML = `<div class="space-y-4">
    <div class="flex flex-wrap justify-between gap-3 items-center"><button onclick="openModal('contrato')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13.5px] font-semibold shadow"><i class="ph ph-plus mr-1"></i>Novo contrato</button><div class="flex flex-wrap gap-2"><select id="filter-contrato-status" onchange="aplicarBuscaContratosRefino()" class="h-10 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todos status</option><option value="ativo" ${STATE.contratoStatus==='ativo'?'selected':''}>Ativo</option><option value="pendente" ${STATE.contratoStatus==='pendente'?'selected':''}>Pendente</option><option value="vencido" ${STATE.contratoStatus==='vencido'?'selected':''}>Vencido</option><option value="encerrado" ${STATE.contratoStatus==='encerrado'?'selected':''}>Encerrado</option></select><input id="search-contratos" value="${esc(STATE.contratoBusca)}" placeholder="Código ou cliente..." class="h-10 px-4 rounded-xl bg-white border text-[13px] w-[280px]">${btnBusca('aplicarBuscaContratosRefino()')}</div></div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Contratos</p><p class="text-[22px] font-extrabold">${lista.length}</p></div><div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Ativos</p><p class="text-[22px] font-extrabold text-emerald-700">${ativos.length}</p></div><div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Mensalidade</p><p class="text-[20px] font-extrabold text-[#0a1e8a]">${dinheiro(ativos.reduce((sum,c)=>sum+n(c.valorMensalFixo),0))}</p></div><div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Abrir</p><p class="text-[13px] font-bold">Duplo clique no cliente</p></div></div>
    <div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><div class="overflow-auto max-h-[690px]"><table class="w-full text-left text-[13px]"><thead class="sticky top-0 bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr>${thContrato('codigo','Código')}${thContrato('cliente','Cliente')}${thContrato('inicio','Início')}${thContrato('fim','Fim')}${thContrato('impressoras','Impressoras')}${thContrato('chamados','Chamados')}${thContrato('valor','Valor')}${thContrato('status','Status')}<th class="px-4 py-2.5 text-right">Excluir</th></tr></thead><tbody class="divide-y">${lista.map(c => { const imps = parquesDoClienteContrato(db, c).length; const ch = (db.os || []).filter(o => o.clienteId === c.clienteId && !['concluido','cancelado','fechado'].includes(o.status)).length; return `<tr ondblclick="openContratoCompleto('${c.id}')" class="hover:bg-blue-50/50 cursor-pointer"><td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">${esc(codigoContrato(c))}</td><td class="px-4 py-2.5"><p class="font-semibold">${esc(nomeCliente(c))}</p><p class="text-[11px] text-slate-500">Duplo clique para abrir</p></td><td class="px-4 py-2.5">${dataBR(c.dataInicio)}</td><td class="px-4 py-2.5">${dataBR(c.dataFim)}</td><td class="px-4 py-2.5 font-bold">${imps}</td><td class="px-4 py-2.5 ${ch?'font-bold text-amber-700':''}">${ch}</td><td class="px-4 py-2.5 font-bold">${dinheiro(c.valorMensalFixo)}</td><td class="px-4 py-2.5"><span class="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold uppercase">${esc(c.status||'ativo')}</span></td><td class="px-4 py-2.5 text-right"><button onclick="event.stopPropagation(); excluirContratoOperacional('${c.id}')" class="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></td></tr>`; }).join('') || '<tr><td colspan="9" class="p-12 text-center text-slate-500">Nenhum contrato</td></tr>'}</tbody></table></div></div>
  </div>`;
  bindEnter('search-contratos', window.aplicarBuscaContratosRefino);
};

window.renderModalContrato = function(id){
  const s = sess(); if(!s) return;
  const isEdit = !!id;
  const c = isEdit ? getCtr(id) : { numero: proximoCodigo(db.contratos || [], s.empresaId), clienteId:'', dataInicio:new Date().toISOString().slice(0,10), dataFim:new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().slice(0,10), status:'ativo', diaVencimento:10, franquiaPB:0, franquiaCor:0, valorMensalFixo:0, valorExcedentePB:0 };
  const clientes = ordenar((db.clientes || []).filter(cl => cl.empresaId === s.empresaId && cl.status !== 'inativo'), cl => cl.nome).map(cl => `<option value="${cl.id}" ${cl.id===c.clienteId?'selected':''}>${esc(cl.nome)}</option>`).join('');
  setModal(isEdit ? 'Alterar contrato' : 'Novo contrato', `<div class="space-y-4 text-[13px]"><div class="grid grid-cols-1 md:grid-cols-3 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Código</label><input id="kr-ctr-num" value="${esc(codigoContrato(c) || c.numero || '')}" class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold"></div><div class="md:col-span-2"><label class="block font-bold text-slate-600 mb-1">Cliente</label><select id="kr-ctr-cli" class="w-full h-10 px-3 rounded-xl border"><option value="">Selecione</option>${clientes}</select></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Início</label><input id="kr-ctr-ini" type="date" value="${String(c.dataInicio||'').slice(0,10)}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Fim</label><input id="kr-ctr-fim" type="date" value="${String(c.dataFim||'').slice(0,10)}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Dia venc.</label><input id="kr-ctr-venc" type="number" value="${i(c.diaVencimento,10)}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Status</label><select id="kr-ctr-status" class="w-full h-10 px-3 rounded-xl border"><option value="ativo">Ativo</option><option value="pendente">Pendente</option><option value="encerrado">Encerrado</option><option value="vencido">Vencido</option></select></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Franquia PB</label><input id="kr-ctr-fpb" type="number" value="${n(c.franquiaPB)}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Franquia Cor</label><input id="kr-ctr-fcor" type="number" value="${n(c.franquiaCor)}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Valor mensal</label><input id="kr-ctr-vfix" type="number" step="0.01" value="${n(c.valorMensalFixo)}" class="w-full h-10 px-3 rounded-xl border font-bold text-[#0a1e8a]"></div><div><label class="block font-bold text-slate-600 mb-1">Valor página PB</label><input id="kr-ctr-vpb" type="number" step="0.001" value="${n(c.valorExcedentePB)}" class="w-full h-10 px-3 rounded-xl border font-bold text-emerald-700"></div></div></div>`, `<button onclick="fecharModalOperacional()" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button><button onclick="salvarContratoRefino('${isEdit ? c.id : ''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>`, '760px');
  const st = document.getElementById('kr-ctr-status'); if(st) st.value = c.status || 'ativo';
};
window.salvarContratoRefino = function(id){
  const s = sess(); if(!s) return;
  const clienteId = document.getElementById('kr-ctr-cli')?.value || '';
  if(!clienteId) return aviso('Selecione o cliente do contrato', 'error');
  const payload = { empresaId:s.empresaId, numero: codigoSimples(document.getElementById('kr-ctr-num')?.value) || proximoCodigo(db.contratos || [], s.empresaId), clienteId, dataInicio:document.getElementById('kr-ctr-ini')?.value || '', dataFim:document.getElementById('kr-ctr-fim')?.value || '', diaVencimento:i(document.getElementById('kr-ctr-venc')?.value,10), status:document.getElementById('kr-ctr-status')?.value || 'ativo', franquiaPB:i(document.getElementById('kr-ctr-fpb')?.value,0), franquiaCor:i(document.getElementById('kr-ctr-fcor')?.value,0), valorMensalFixo:n(document.getElementById('kr-ctr-vfix')?.value,0), valorExcedentePB:n(document.getElementById('kr-ctr-vpb')?.value,0) };
  if(id){ const c = getCtr(id); Object.assign(c, payload, { atualizadoEm:new Date().toISOString(), atualizadoPorNome:s.usuarioNome }); logar('contrato','editar',id,`Contrato ${payload.numero} editado por ${s.usuarioNome}`); }
  else { const novo = { id:uidLocal('ctr'), criadoEm:new Date().toISOString(), criadoPor:s.usuarioId, criadoPorNome:s.usuarioNome, ...payload }; db.contratos.push(novo); id = novo.id; logar('contrato','criar',novo.id,`Contrato ${novo.numero} criado por ${s.usuarioNome}`); }
  salvar(); closeK(); window.renderContratos(); aviso('Contrato salvo', 'success'); window.openContratoCompleto(id);
};

window.openContratoCompleto = function(contratoId){
  const s = sess(); if(!s) return;
  const c = getCtr(contratoId); if(!c) return aviso('Contrato não encontrado','error');
  const cli = getCli(c.clienteId) || {};
  const maquinas = parquesDoClienteContrato(db, c);
  const chamadosAbertos = (db.os || []).filter(o => o.clienteId === c.clienteId && !['concluido','cancelado','fechado'].includes(o.status)).length;
  setModal(`Contrato ${codigoContrato(c)} — ${cli.nome || 'Cliente'}`, `<div class="space-y-5 text-[13px]"><div class="rounded-[18px] bg-[#0a1e8a] text-white p-5 flex flex-col md:flex-row justify-between gap-4"><div><p class="text-[11px] uppercase font-bold text-white/70">Cliente</p><h3 class="text-[20px] font-extrabold mt-1">${esc(cli.nome||'')}</h3><p class="text-[12px] text-white/80 mt-1">${esc(cli.documento||'')} • ${esc(cli.cidade||'')}/${esc(cli.estado||'')}</p></div><div class="text-right"><p class="text-[11px] uppercase font-bold text-white/70">Código</p><p class="text-[26px] font-extrabold">${esc(codigoContrato(c))}</p><p class="text-[12px] text-white/80">${dataBR(c.dataInicio)} até ${dataBR(c.dataFim)}</p></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div class="rounded-[16px] border bg-emerald-50 border-emerald-200 p-4"><p class="text-[11px] font-bold uppercase text-emerald-800">Impressoras do Cliente</p><p class="text-[26px] font-extrabold text-emerald-700">${maquinas.length}</p></div><div class="rounded-[16px] border bg-amber-50 border-amber-200 p-4"><p class="text-[11px] font-bold uppercase text-amber-800">Chamados Abertos</p><p class="text-[26px] font-extrabold text-amber-700">${chamadosAbertos}</p></div><div class="rounded-[16px] border bg-blue-50 border-blue-200 p-4"><p class="text-[11px] font-bold uppercase text-blue-800">Valor Mensal</p><p class="text-[22px] font-extrabold text-blue-700">${dinheiro(c.valorMensalFixo)}</p></div><div class="rounded-[16px] border bg-purple-50 border-purple-200 p-4"><p class="text-[11px] font-bold uppercase text-purple-800">Leituras</p><p class="text-[26px] font-extrabold text-purple-700">${(db.leituras||[]).filter(l => l.contratoId === c.id || l.clienteId === c.clienteId).length}</p></div></div><div class="flex flex-wrap gap-3"><button onclick="abrirLeiturasContrato('${c.id}')" class="h-11 px-6 rounded-xl bg-emerald-600 text-white font-bold"><i class="ph ph-speedometer"></i> Leituras</button><button onclick="abrirChamadosContrato('${c.id}')" class="h-11 px-6 rounded-xl bg-blue-600 text-white font-bold"><i class="ph ph-wrench"></i> Chamados</button><button onclick="abrirModalEquipamentoContrato('${c.id}', null)" class="h-11 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold ml-auto"><i class="ph ph-printer"></i> Nova Impressora</button><button onclick="imprimirContratoLocacaoOperacional('${c.id}','contrato')" class="h-11 px-4 rounded-xl bg-white border font-bold">Contrato PDF</button><button onclick="imprimirContratoLocacaoOperacional('${c.id}','proposta')" class="h-11 px-4 rounded-xl bg-white border font-bold">Proposta PDF</button></div><div class="border rounded-xl overflow-hidden"><div class="bg-slate-50 px-4 py-3 border-b flex justify-between items-center"><b>Impressoras cadastradas neste cliente</b><span class="text-[11px] text-slate-500">Duplo clique para editar</span></div><div class="overflow-auto max-h-[360px]"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr><th class="px-4 py-2.5">Impressora</th><th class="px-4 py-2.5">Modelo</th><th class="px-4 py-2.5">Serial</th><th class="px-4 py-2.5">Departamento / Local</th><th class="px-4 py-2.5">Medidores</th><th class="px-4 py-2.5 text-right">Editar</th></tr></thead><tbody class="divide-y">${maquinas.map(p => { const eq = getEq(p.equipamentoId) || {}; const meds = normalizarMedidores(p); return `<tr ondblclick="abrirModalEquipamentoContrato('${c.id}','${p.id}')" class="hover:bg-slate-50 cursor-pointer"><td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">${esc(eq.patrimonio||'-')}</td><td class="px-4 py-2.5 font-semibold">${esc(eq.modelo||'')}</td><td class="px-4 py-2.5 font-mono">${esc(eq.serie||'')}</td><td class="px-4 py-2.5">${esc(p.setor||'Geral')}<br><span class="text-[11px] text-slate-500">${esc(p.localInstalacao||'')}</span></td><td class="px-4 py-2.5 text-[11px]">${MEDIDORES.map(m => `${m.label}: ${esc((meds[m.key]||{}).modalidade||'-')}`).join('<br>')}</td><td class="px-4 py-2.5 text-right"><button onclick="abrirModalEquipamentoContrato('${c.id}','${p.id}')" class="w-8 h-8 rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></td></tr>`; }).join('') || '<tr><td colspan="6" class="p-8 text-center text-slate-400">Nenhuma impressora cadastrada para este cliente</td></tr>'}</tbody></table></div></div></div>`, `<button onclick="fecharModalOperacional()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button><button onclick="salvarContratoFullRefino('${c.id}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Contrato</button>`, '1080px');
};
window.salvarContratoFullRefino = function(id){ aviso('Use o botão de editar/novo contrato para alterar os dados principais. Impressoras, leituras e chamados ficam nos botões do contrato.', 'info'); };

function medidorBoxHTML(key, med){
  return `<div id="kr-med-${key}" class="${STATE.medidorTab===key?'':'hidden'} space-y-3"><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Modalidade</label><select id="kr-${key}-mod" class="w-full h-10 px-3 rounded-xl border"><option value="global">Global</option><option value="individual">Individual</option><option value="impressao">Por Impressão</option><option value="mes_fixo">Mês Fixo</option><option value="inativo">Inativo (Ocultar)</option></select></div><div><label class="block font-bold text-slate-600 mb-1">Cont. Ant.</label><input id="kr-${key}-cont" type="number" value="${esc(med.contadorAnterior ?? '')}" class="w-full h-10 px-3 rounded-xl border font-mono" placeholder="0 é válido"></div><div><label class="block font-bold text-slate-600 mb-1">Franquia</label><input id="kr-${key}-franq" type="number" value="${n(med.franquia,0)}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Valor unitário R$</label><input id="kr-${key}-valor" type="number" step="0.001" value="${n(med.valor,0)}" class="w-full h-10 px-3 rounded-xl border font-bold text-emerald-700"></div></div><p class="text-[11px] text-slate-500">Este medidor é independente. Alterar aqui não muda os outros.</p></div>`;
}
function setMedidorSelects(meds){
  MEDIDORES.forEach(m => { const el = document.getElementById(`kr-${m.key}-mod`); if(el) el.value = (meds[m.key] || {}).modalidade || 'global'; });
}
window.mudarMedidorImpressoraRefino = function(key){
  STATE.medidorTab = key;
  MEDIDORES.forEach(m => {
    document.getElementById('kr-med-' + m.key)?.classList.toggle('hidden', m.key !== key);
    const tab = document.getElementById('kr-tab-' + m.key);
    if(tab){ tab.classList.toggle('bg-[#0a1e8a]', m.key === key); tab.classList.toggle('text-white', m.key === key); tab.classList.toggle('bg-white', m.key !== key); tab.classList.toggle('text-slate-600', m.key !== key); }
  });
};
window.abrirModalEquipamentoContrato = function(contratoId, parqueId){
  const s = sess(); if(!s) return;
  const c = getCtr(contratoId); if(!c) return;
  const isEdit = !!parqueId;
  const p = isEdit ? getParque(parqueId) : { id:'', contratoId:c.id, clienteId:c.clienteId, equipamentoId:null, setor:'', localInstalacao:'', modalidade:'global', valorExcedentePB:c.valorExcedentePB||0, franquiaPB:0, status:'ativo' };
  const eq = p.equipamentoId ? getEq(p.equipamentoId) : null;
  const meds = normalizarMedidores(p);
  if(eq){ meds.pretoA4.contadorAnterior = eq.contadorPB ?? meds.pretoA4.contadorAnterior; meds.colorA4.contadorAnterior = eq.contadorCor ?? meds.colorA4.contadorAnterior; }
  STATE.medidorTab = 'pretoA4';
  setModal(isEdit ? 'Alterar impressora do contrato' : 'Nova impressora no contrato', `<div class="space-y-4 text-[13px]"><div class="rounded-xl bg-blue-50 border border-blue-200 p-4"><label class="block font-bold text-blue-900 mb-1">Serial ou Patrimônio</label><div class="grid grid-cols-1 md:grid-cols-12 gap-2"><input id="kr-imp-busca" value="${esc(eq ? (eq.serie || eq.patrimonio || '') : '')}" class="md:col-span-6 h-10 px-3 rounded-xl border font-mono uppercase"><label class="md:col-span-2 h-10 px-3 rounded-xl bg-white border flex items-center gap-2"><input type="radio" name="kr-tipo-chave" value="serial" checked> Serial</label><label class="md:col-span-2 h-10 px-3 rounded-xl bg-white border flex items-center gap-2"><input type="radio" name="kr-tipo-chave" value="patrimonio"> Patrimônio</label><button onclick="reconhecerImpressoraContrato()" class="md:col-span-2 h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i> Buscar</button></div></div><div class="grid grid-cols-1 md:grid-cols-3 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Modelo *</label><input id="kr-imp-modelo" value="${esc(eq?.modelo||'')}" class="w-full h-10 px-3 rounded-xl border font-bold"></div><div><label class="block font-bold text-slate-600 mb-1">Patrimônio</label><input id="kr-imp-patr" value="${esc(eq?.patrimonio||'')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div><div><label class="block font-bold text-slate-600 mb-1">Serial</label><input id="kr-imp-serie" value="${esc(eq?.serie||'')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Departamento</label><input id="kr-imp-dept" value="${esc(p.setor||'')}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Local</label><input id="kr-imp-local" value="${esc(p.localInstalacao||'')}" class="w-full h-10 px-3 rounded-xl border"></div></div><div class="border rounded-xl p-3"><div class="flex flex-wrap gap-2 mb-4">${MEDIDORES.map(m => `<button type="button" id="kr-tab-${m.key}" onclick="mudarMedidorImpressoraRefino('${m.key}')" class="h-9 px-4 rounded-xl border font-bold text-[12px] ${m.key==='pretoA4'?'bg-[#0a1e8a] text-white':'bg-white text-slate-600'}">${m.label}</button>`).join('')}</div>${MEDIDORES.map(m => medidorBoxHTML(m.key, meds[m.key])).join('')}</div></div>`, `<button onclick="openContratoCompleto('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button><button onclick="salvarImpressoraContrato('${c.id}','${isEdit ? p.id : ''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Impressora</button>`, '900px');
  setMedidorSelects(meds);
  bindEnter('kr-imp-busca', window.reconhecerImpressoraContrato);
};
window.reconhecerImpressoraContrato = function(){
  const s = sess(); if(!s) return;
  const chave = document.getElementById('kr-imp-busca')?.value?.trim() || document.getElementById('ki-busca')?.value?.trim() || '';
  if(!chave) return aviso('Digite o serial ou patrimônio', 'info');
  const up = norm(chave);
  const eq = (db.equipamentos || []).find(e => e.empresaId === s.empresaId && ((e.serie && norm(e.serie) === up) || (e.patrimonio && norm(e.patrimonio) === up)));
  const tipo = document.querySelector('input[name="kr-tipo-chave"]:checked')?.value || 'serial';
  if(eq){
    const p = (db.parque || []).filter(x => x.equipamentoId === eq.id).sort((a,b) => new Date(b.dataInstalacao||0)-new Date(a.dataInstalacao||0))[0] || {};
    document.getElementById('kr-imp-modelo').value = eq.modelo || '';
    document.getElementById('kr-imp-patr').value = eq.patrimonio || '';
    document.getElementById('kr-imp-serie').value = eq.serie || '';
    document.getElementById('kr-imp-dept').value = p.setor || '';
    document.getElementById('kr-imp-local').value = p.localInstalacao || '';
    const cont = document.getElementById('kr-pretoA4-cont'); if(cont) cont.value = ultimoContador(eq.id).valor;
    aviso('Impressora reconhecida', 'success');
  } else {
    if(tipo === 'serial') document.getElementById('kr-imp-serie').value = chave;
    else document.getElementById('kr-imp-patr').value = chave;
    aviso('Impressora não cadastrada. Preencha o restante para criar.', 'info');
  }
};
window.salvarImpressoraContrato = function(contratoId, parqueId){
  const s = sess(); if(!s) return;
  const c = getCtr(contratoId); if(!c) return;
  const modelo = document.getElementById('kr-imp-modelo')?.value?.trim() || '';
  if(!modelo) return aviso('Informe o modelo', 'error');
  const serie = document.getElementById('kr-imp-serie')?.value?.trim() || '';
  const patr = document.getElementById('kr-imp-patr')?.value?.trim() || serie || uidLocal('pat');
  let eq = (db.equipamentos || []).find(e => e.empresaId === s.empresaId && ((serie && e.serie === serie) || (patr && e.patrimonio === patr)));
  if(!eq){ eq = { id:uidLocal('eq'), empresaId:s.empresaId, modelo, serie, patrimonio:patr, status:'locado', contadorPB:0, contadorCor:0, criadoEm:new Date().toISOString(), criadoPor:s.usuarioId, criadoPorNome:s.usuarioNome }; db.equipamentos.push(eq); }
  else { Object.assign(eq, { modelo, serie: serie || eq.serie, patrimonio: patr || eq.patrimonio, status:'locado', atualizadoEm:new Date().toISOString() }); }
  const medidores = {};
  MEDIDORES.forEach(m => {
    const contRaw = document.getElementById(`kr-${m.key}-cont`)?.value;
    medidores[m.key] = { key:m.key, label:m.label, modalidade:document.getElementById(`kr-${m.key}-mod`)?.value || 'global', contadorAnterior: contRaw === '' ? '' : n(contRaw,0), franquia:n(document.getElementById(`kr-${m.key}-franq`)?.value,0), valor:n(document.getElementById(`kr-${m.key}-valor`)?.value,0), ativo:(document.getElementById(`kr-${m.key}-mod`)?.value || 'global') !== 'inativo' };
  });
  if(medidores.pretoA4.contadorAnterior !== '') eq.contadorPB = n(medidores.pretoA4.contadorAnterior, 0);
  if(medidores.colorA4.contadorAnterior !== '') eq.contadorCor = n(medidores.colorA4.contadorAnterior, 0);
  const payload = { empresaId:s.empresaId, contratoId:c.id, clienteId:c.clienteId, equipamentoId:eq.id, setor:document.getElementById('kr-imp-dept')?.value?.trim() || 'Geral', localInstalacao:document.getElementById('kr-imp-local')?.value?.trim() || '', modalidade:medidores.pretoA4.modalidade === 'inativo' ? 'global' : medidores.pretoA4.modalidade, franquiaPB:medidores.pretoA4.franquia, valorExcedentePB:medidores.pretoA4.valor, medidores, status:medidores.pretoA4.modalidade === 'inativo' ? 'inativo' : 'ativo', atualizadoEm:new Date().toISOString() };
  if(parqueId){ const p = getParque(parqueId); if(p) Object.assign(p, payload); }
  else db.parque.push({ id:uidLocal('prq'), criadoEm:new Date().toISOString(), criadoPor:s.usuarioId, criadoPorNome:s.usuarioNome, dataInstalacao:new Date().toISOString(), ...payload });
  salvar(); logar('contrato','salvar_impressora',c.id,`Impressora ${modelo} salva por ${s.usuarioNome}`); aviso('Impressora salva', 'success'); window.openContratoCompleto(c.id); window.renderContratos();
};

function leiturasContratoCliente(c){ return (db.leituras || []).filter(l => l.contratoId === c.id || l.clienteId === c.clienteId).sort((a,b) => new Date(b.dataLeitura||0)-new Date(a.dataLeitura||0)); }
window.abrirLeiturasContrato = function(contratoId){
  const c = getCtr(contratoId); if(!c) return;
  const leituras = leiturasContratoCliente(c);
  setModal(`Leituras — Contrato ${codigoContrato(c)}`, `<div class="space-y-4 text-[13px]"><div class="flex flex-wrap justify-between items-center gap-3 bg-slate-50 p-3 rounded-xl border"><div class="flex gap-2"><button onclick="abrirEditorLeituraContrato('${c.id}')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-plus-circle"></i> Novo</button><button onclick="imprimirRelatorioLeiturasPDF('${c.id}')" class="h-10 px-5 rounded-xl bg-slate-900 text-white font-bold"><i class="ph ph-printer"></i> Imprimir</button></div><span class="text-[12px] text-slate-500">Histórico das impressoras cadastradas neste cliente</span></div><div class="overflow-auto max-h-[500px] border rounded-xl"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr><th class="px-4 py-3">Data</th><th class="px-4 py-3">Impressora</th><th class="px-4 py-3">Modelo</th><th class="px-4 py-3">Contadores</th><th class="px-4 py-3">Utilizado</th><th class="px-4 py-3">Qtd Exced.</th><th class="px-4 py-3">Valor</th><th class="px-4 py-3 text-right">Excluir</th></tr></thead><tbody class="divide-y">${leituras.map(l => { const eq = getEq(l.equipamentoId)||{}; return `<tr ondblclick="abrirLancamentoContadorContrato('${c.id}','${l.parqueId}','${String(l.dataLeitura||'').slice(0,10)}','${l.id}')" class="hover:bg-slate-50 cursor-pointer"><td class="px-4 py-2.5"><b>${dataBR(l.dataLeitura)}</b></td><td class="px-4 py-2.5 font-mono font-bold">${esc(eq.patrimonio||'-')}</td><td class="px-4 py-2.5">${esc(eq.modelo||'')}</td><td class="px-4 py-2.5 font-mono">${n(l.contadorPBAnterior)} → <b>${n(l.contadorPB)}</b></td><td class="px-4 py-2.5 font-bold">${n(l.consumoPB)}</td><td class="px-4 py-2.5">${n(l.qtdExcedentePB)}</td><td class="px-4 py-2.5 font-bold text-emerald-700">${dinheiro(l.valorExcedente)}</td><td class="px-4 py-2.5 text-right"><button onclick="event.stopPropagation(); deleteLeituraContrato('${l.id}','${c.id}')" class="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></td></tr>`; }).join('') || '<tr><td colspan="8" class="p-12 text-center text-slate-400">Nenhuma leitura lançada</td></tr>'}</tbody></table></div></div>`, `<button onclick="openContratoCompleto('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">← Voltar</button><button onclick="fecharModalOperacional()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>`, '980px');
};
window.abrirEditorLeituraContrato = function(contratoId){ STATE.leituraData = new Date().toISOString().slice(0,10); setModal(`Nova leitura — Contrato ${codigoContrato(getCtr(contratoId))}`, `<div class="space-y-4 text-[13px]"><div class="rounded-xl border bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-3"><div><label class="font-bold text-slate-700 mr-2">Data</label><input id="kr-lei-data" type="date" value="${STATE.leituraData}" class="h-9 px-3 rounded-lg border font-semibold"></div><button onclick="abrirListaImpressorasParaLeitura('${contratoId}')" class="h-10 px-5 rounded-xl bg-slate-700 text-white font-bold"><i class="ph ph-printer"></i> Lançar</button></div><div class="rounded-xl border p-4 text-slate-500">Vai listar todas as impressoras cadastradas neste cliente.</div></div>`, `<button onclick="abrirLeiturasContrato('${contratoId}')" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button>`, '760px'); };
window.abrirListaImpressorasParaLeitura = function(contratoId){
  const c = getCtr(contratoId); if(!c) return;
  const data = document.getElementById('kr-lei-data')?.value || STATE.leituraData || new Date().toISOString().slice(0,10); STATE.leituraData = data;
  const q = norm(STATE.leituraBusca);
  const ja = new Set((db.leituras || []).filter(l => (l.contratoId === c.id || l.clienteId === c.clienteId) && periodo(l.dataLeitura) === periodo(data)).map(l => l.parqueId));
  const todos = parquesDoClienteContrato(db, c, { todos:true });
  const filtra = p => { const eq = getEq(p.equipamentoId)||{}; return !q || [eq.patrimonio, eq.modelo, eq.serie, p.setor, p.localInstalacao].some(v => norm(v).includes(q)); };
  const ativas = ordenar(todos.filter(p => p.status === 'ativo' && !ja.has(p.id)).filter(filtra), p => (getEq(p.equipamentoId)||{}).patrimonio || '');
  const bloqueadas = ordenar(todos.filter(p => p.status !== 'ativo' || ja.has(p.id)).filter(filtra), p => (getEq(p.equipamentoId)||{}).patrimonio || '');
  const row = (p, block) => { const eq = getEq(p.equipamentoId)||{}; const motivo = ja.has(p.id) ? 'já lançada' : (p.status === 'inativo' ? 'inativa' : 'remanejada'); return `<tr ${block?'':`ondblclick="abrirLancamentoContadorContrato('${c.id}','${p.id}','${data}')"`} class="${block?'bg-slate-50 text-slate-400':'hover:bg-blue-50 cursor-pointer'}"><td class="px-4 py-2.5 font-mono font-bold">${esc(eq.patrimonio||'-')}</td><td class="px-4 py-2.5">${esc(eq.modelo||'')}</td><td class="px-4 py-2.5">${esc(eq.serie||'')}</td><td class="px-4 py-2.5">${esc(p.setor||'Geral')} / ${esc(p.localInstalacao||'')}</td><td class="px-4 py-2.5">${block?`<span class="px-2 py-0.5 rounded bg-slate-200 text-[11px] font-bold">${motivo}</span>`:`<button onclick="abrirLancamentoContadorContrato('${c.id}','${p.id}','${data}')" class="h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">Lançar</button>`}</td></tr>`; };
  setModal(`Selecionar impressora — ${periodo(data)}`, `<div class="space-y-4 text-[13px]"><div class="flex gap-2 bg-slate-50 border rounded-xl p-3"><input id="kr-lei-busca" value="${esc(STATE.leituraBusca)}" placeholder="Pesquisar impressora..." class="h-10 px-3 rounded-xl border w-[280px]">${btnBusca(`aplicarBuscaLeituraRefino('${c.id}')`)}<span class="text-[12px] text-slate-500 self-center">Duplo clique para lançar</span></div><div class="overflow-auto max-h-[480px] border rounded-xl"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr><th class="px-4 py-3">Impressora</th><th class="px-4 py-3">Modelo</th><th class="px-4 py-3">Serial</th><th class="px-4 py-3">Departamento / Local</th><th class="px-4 py-3">Ação</th></tr></thead><tbody class="divide-y">${ativas.map(p=>row(p,false)).join('') || '<tr><td colspan="5" class="p-8 text-center text-slate-400">Nenhuma impressora pendente</td></tr>'}<tr><td colspan="5" class="bg-slate-100 px-4 py-2 text-[11px] uppercase font-bold text-slate-500">Remanejadas / inativas / já lançadas</td></tr>${bloqueadas.map(p=>row(p,true)).join('') || '<tr><td colspan="5" class="p-4 text-center text-slate-400">Nenhuma</td></tr>'}</tbody></table></div></div>`, `<button onclick="abrirEditorLeituraContrato('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">← Voltar</button>`, '900px');
  bindEnter('kr-lei-busca', () => window.aplicarBuscaLeituraRefino(c.id));
};
window.aplicarBuscaLeituraRefino = function(contratoId){ STATE.leituraBusca = document.getElementById('kr-lei-busca')?.value || ''; window.abrirListaImpressorasParaLeitura(contratoId); };
window.abrirLancamentoContadorContrato = function(contratoId, parqueId, data, leituraId){
  const c = getCtr(contratoId); const p = getParque(parqueId); if(!c || !p) return;
  if(p.status !== 'ativo') return aviso('Esta impressora está inativa/remanejada e não pode receber leitura', 'error');
  const eq = getEq(p.equipamentoId) || {}; const l = leituraId ? (db.leituras||[]).find(x=>x.id===leituraId) : null;
  const ant = l ? n(l.contadorPBAnterior) : ultimoContador(p.equipamentoId).valor;
  const atual = l ? n(l.contadorPB) : '';
  setModal(`Lançar contador — ${eq.modelo || 'Impressora'}`, `<div class="space-y-4 text-[13px]"><div class="rounded-xl bg-slate-50 border p-3"><p class="font-bold text-[15px]">${esc(eq.modelo||'')}</p><p class="text-[12px] text-slate-500">Patrimônio ${esc(eq.patrimonio||'-')} • Serial ${esc(eq.serie||'-')} • ${esc(p.setor||'Geral')} / ${esc(p.localInstalacao||'')}</p></div><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Data</label><input id="kr-lanc-data" type="date" value="${esc(data || String(l?.dataLeitura||new Date().toISOString()).slice(0,10))}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-500 mb-1">Contador Antigo</label><input id="kr-lanc-ant" type="number" value="${ant}" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold"></div><div><label class="block font-bold text-[#0a1e8a] mb-1">Contador Atual</label><input id="kr-lanc-atual" type="number" value="${esc(atual)}" oninput="previewLancamentoRefino('${c.id}','${p.id}','${leituraId||''}')" class="w-full h-10 px-3 rounded-xl border-2 border-[#0a1e8a] font-mono font-bold"></div><div><label class="block font-bold text-emerald-700 mb-1">Utilizado</label><input id="kr-lanc-util" readonly class="w-full h-10 px-3 rounded-xl border bg-emerald-50 font-bold text-emerald-700"></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div class="rounded-xl border bg-white p-3"><p class="text-[11px] uppercase font-bold text-slate-500">Qtd Excedente</p><p id="kr-lanc-exc" class="font-extrabold text-[18px]">0</p></div><div class="rounded-xl border bg-white p-3"><p class="text-[11px] uppercase font-bold text-slate-500">Valor Excedente</p><p id="kr-lanc-valor" class="font-extrabold text-[18px] text-emerald-700">${dinheiro(0)}</p></div></div></div>`, `<button onclick="abrirListaImpressorasParaLeitura('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button><button onclick="salvarLancamentoRefino('${c.id}','${p.id}','${leituraId||''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Leitura</button>`, '780px');
  window.previewLancamentoRefino(c.id, p.id, leituraId || '');
};
window.previewLancamentoRefino = function(contratoId, parqueId, leituraId){
  const res = calcLeitura(getCtr(contratoId), getParque(parqueId), document.getElementById('kr-lanc-ant')?.value, document.getElementById('kr-lanc-atual')?.value, document.getElementById('kr-lanc-data')?.value, leituraId || null);
  const u = document.getElementById('kr-lanc-util'); if(u) u.value = res.utilizado;
  const e = document.getElementById('kr-lanc-exc'); if(e) e.innerText = res.qtdExcedente;
  const v = document.getElementById('kr-lanc-valor'); if(v) v.innerText = dinheiro(res.valorExcedente);
};
window.salvarLancamentoRefino = function(contratoId, parqueId, leituraId){
  const s = sess(); if(!s) return;
  const c = getCtr(contratoId); const p = getParque(parqueId); if(!c || !p) return;
  const atual = document.getElementById('kr-lanc-atual')?.value;
  if(String(atual ?? '').trim() === '') return aviso('Informe o contador atual', 'error');
  const data = document.getElementById('kr-lanc-data')?.value || new Date().toISOString().slice(0,10);
  const res = calcLeitura(c, p, document.getElementById('kr-lanc-ant')?.value, atual, data, leituraId || null);
  const payload = { empresaId:s.empresaId, parqueId:p.id, equipamentoId:p.equipamentoId, contratoId:c.id, clienteId:c.clienteId, dataLeitura:isoData(data), contadorPBAnterior:res.anterior, contadorPB:res.atual, contadorCorAnterior:0, contadorCor:0, consumoPB:res.utilizado, consumoCor:0, qtdExcedentePB:res.qtdExcedente, valorExcedente:res.valorExcedente, modalidade:res.modalidade, status:'pendente', faturar:res.valorExcedente>0 };
  if(leituraId){ const l = (db.leituras||[]).find(x=>x.id===leituraId); if(l) Object.assign(l, payload, { atualizadoEm:new Date().toISOString(), atualizadoPorNome:s.usuarioNome }); }
  else db.leituras.push({ id:uidLocal('lei'), criadoEm:new Date().toISOString(), criadoPor:s.usuarioId, criadoPorNome:s.usuarioNome, ...payload });
  const eq = getEq(p.equipamentoId); if(eq) eq.contadorPB = Math.max(n(eq.contadorPB), res.atual);
  salvar(); aviso('Leitura salva', 'success'); window.abrirLeiturasContrato(c.id); if(typeof renderLeituras === 'function') renderLeituras();
};

function tecnicoValorNome(value){
  if(!value) return '';
  const tec = (db.tecnicos || []).find(t => t.id === value || t.nome === value);
  const user = (db.usuarios || []).find(u => u.id === value || u.nome === value || u.login === value);
  return tituloPessoa((tec && tec.nome) || (user && user.nome) || value);
}
function tecnicoOptions(selected){
  const s = sess();
  const nomes = [];
  (db.tecnicos || []).forEach(t => { if(t && t.nome) nomes.push({ id:t.id || t.nome, nome:t.nome }); });
  (db.usuarios || []).filter(u => !s || u.empresaId === s.empresaId).forEach(u => { if(u && u.nome) nomes.push({ id:u.id || u.login || u.nome, nome:u.nome }); });
  if(s && s.usuarioNome) nomes.push({ id:s.usuarioNome, nome:s.usuarioNome });
  const seen = new Set();
  return nomes.filter(x => { const k = norm(x.nome); if(seen.has(k)) return false; seen.add(k); return true; }).sort((a,b)=>compara(a.nome,b.nome)).map(x => `<option value="${esc(x.id)}" ${selected === x.id || norm(selected) === norm(x.nome) ? 'selected' : ''}>${esc(tituloPessoa(x.nome))}</option>`).join('');
}
function maquinasChamado(c, clienteId){
  if(c) return parquesDoClienteContrato(db, c);
  return (db.parque || []).filter(p => !clienteId || p.clienteId === clienteId);
}
function pecasOptions(){
  const s = sess();
  return ordenar((db.produtos || []).filter(p => (!s || p.empresaId === s.empresaId) && p.status !== 'inativo' && p.status !== 'excluido'), p => p.nome).slice(0,500).map(p => `<option value="${p.id}">${esc(p.sku||p.codigo||'')} - ${esc(p.nome||'')} • ${dinheiro(p.preco)} • est ${n(p.estoque)}</option>`).join('');
}
function renderPecas(){
  const el = document.getElementById('kr-os-pecas'); if(!el) return;
  const itens = window.__krPecasChamado || [];
  el.innerHTML = itens.map((it, idx) => `<div class="flex justify-between gap-2 p-2 rounded-xl bg-white border text-[12px]"><div><b>${esc(it.descricao||'Produto')}</b><p class="text-[11px] text-slate-500">${dinheiro(it.preco)} un</p></div><div class="flex items-center gap-2"><input type="number" min="1" value="${it.qtd}" onchange="alterarQtdPecaRefino(${idx},this.value)" class="w-16 h-8 px-2 rounded-lg border"><b>${dinheiro(n(it.qtd)*n(it.preco))}</b><button onclick="removerPecaRefino(${idx})" class="w-7 h-7 rounded-lg bg-red-50 text-red-600"><i class="ph ph-x"></i></button></div></div>`).join('') || '<p class="text-[12px] text-slate-400 text-center py-3">Nenhum produto adicionado</p>';
}
window.adicionarPecaRefino = function(){ const id = document.getElementById('kr-os-prod')?.value; const qtd = Math.max(1, i(document.getElementById('kr-os-prod-qtd')?.value,1)); const p = (db.produtos||[]).find(x=>x.id===id); if(!p) return aviso('Selecione o produto','error'); window.__krPecasChamado = window.__krPecasChamado || []; const ex = window.__krPecasChamado.find(x=>x.produtoId===id); if(ex) ex.qtd += qtd; else window.__krPecasChamado.push({ produtoId:id, descricao:p.nome, qtd, preco:n(p.preco), subtotal:qtd*n(p.preco) }); renderPecas(); };
window.alterarQtdPecaRefino = function(idx, val){ const it = (window.__krPecasChamado||[])[idx]; if(it){ it.qtd = Math.max(1, i(val,1)); it.subtotal = it.qtd*n(it.preco); renderPecas(); } };
window.removerPecaRefino = function(idx){ (window.__krPecasChamado||[]).splice(idx,1); renderPecas(); };
function selectEquipOptions(c, selected, clienteId){
  return maquinasChamado(c, clienteId).map(p => { const eq = getEq(p.equipamentoId)||{}; return `<option value="${eq.id}" ${selected===eq.id?'selected':''}>${esc(eq.patrimonio||'-')} - ${esc(eq.modelo||'')}</option>`; }).join('');
}
window.openModalChamadoCompleto = function(osId, contratoId){
  const s = sess(); if(!s) return;
  const c = contratoId ? getCtr(contratoId) : null;
  const isEdit = !!osId;
  const o = isEdit ? (db.os||[]).find(x=>x.id===osId) : { id:'', numero:proximoCodigo(db.os||[], s.empresaId), clienteId:c?c.clienteId:'', dataAbertura:new Date().toISOString(), status:'aberto', prioridade:'normal', criadoPorNome:s.usuarioNome, tecnico:s.usuarioNome, pecas:[] };
  if(!o) return aviso('Chamado não encontrado','error');
  window.__krPecasChamado = (o.pecas || []).map(x => ({...x}));
  const clienteOpts = ordenar((db.clientes||[]).filter(cl => cl.empresaId === s.empresaId && cl.status !== 'inativo'), cl => cl.nome).map(cl => `<option value="${cl.id}" ${cl.id===o.clienteId?'selected':''}>${esc(cl.nome)}</option>`).join('');
  setModal(isEdit ? `Chamado Técnico ${codigoOS(o)}` : 'Novo Chamado Técnico', `<div class="space-y-4 text-[13px]"><div class="grid grid-cols-1 md:grid-cols-5 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Código</label><input id="kr-os-num" value="${esc(codigoOS(o)||o.numero||'')}" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold"></div><div><label class="block font-bold text-slate-600 mb-1">Data</label><input id="kr-os-data" type="date" value="${String(o.dataAbertura||'').slice(0,10)}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Prioridade</label><select id="kr-os-prio" class="w-full h-10 px-3 rounded-xl border"><option value="normal">Normal</option><option value="alta">Alta</option><option value="baixa">Baixa</option></select></div><div><label class="block font-bold text-slate-600 mb-1">Criado por</label><input id="kr-os-criador" value="${esc(o.criadoPorNome || s.usuarioNome)}" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-50"></div><div><label class="block font-bold text-slate-600 mb-1">Técnico que atende</label><select id="kr-os-tec" class="w-full h-10 px-3 rounded-xl border">${tecnicoOptions(o.tecnicoId || o.tecnico)}</select></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Cliente</label><select id="kr-os-cli" onchange="atualizarImpressorasChamadoRefino()" class="w-full h-10 px-3 rounded-xl border"><option value="">Selecione</option>${clienteOpts}</select></div><div><label class="block font-bold text-slate-600 mb-1">Impressora</label><select id="kr-os-eq" onchange="autoPreencherDadosChamado(this.value)" class="w-full h-10 px-3 rounded-xl border"><option value="">Selecione</option>${selectEquipOptions(c, o.equipamentoId, o.clienteId)}</select></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Modelo</label><input id="kr-os-modelo" value="${esc(o.modelo||'')}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Patrimônio</label><input id="kr-os-patr" value="${esc(o.patrimonio||'')}" class="w-full h-10 px-3 rounded-xl border font-mono font-bold"></div><div><label class="block font-bold text-slate-600 mb-1">Serial</label><input id="kr-os-serie" value="${esc(o.serie||'')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div><div><label class="block font-bold text-slate-600 mb-1">Local</label><input id="kr-os-local" value="${esc(o.local||'')}" class="w-full h-10 px-3 rounded-xl border"></div></div><div><label class="block font-bold text-slate-600 mb-1">Motivo / Defeito *</label><input id="kr-os-desc" value="${esc(o.descricao||'')}" class="w-full h-10 px-3 rounded-xl border font-semibold"></div><label class="bg-slate-50 border rounded-xl p-3 flex items-center gap-3 cursor-pointer"><input type="checkbox" id="kr-os-concluido" ${o.status==='concluido'?'checked':''}><span class="font-bold">Este chamado já foi finalizado?</span></label><div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 border rounded-xl"><div><label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Preto Antigo</label><input id="kr-os-cont-ant" type="number" value="${n(o.contadorAntigo)}" readonly class="w-full h-10 px-3 rounded-xl border font-mono font-bold text-[#0a1e8a]"></div><div><label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Preto Atual</label><input id="kr-os-cont-atu" type="number" value="${o.contadorAtual!==undefined?esc(o.contadorAtual):''}" oninput="calcImpressoesChamado()" class="w-full h-10 px-3 rounded-xl border-2 border-[#0a1e8a] font-mono font-bold"></div><div><label class="block font-bold text-emerald-700 mb-1 text-[11px] uppercase">Quantidade Impressos</label><input id="kr-os-qtd" type="number" value="${n(o.quantidadeImpressos)}" readonly class="w-full h-10 px-3 rounded-xl border bg-emerald-50 font-bold text-emerald-700"></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block font-bold text-slate-600 mb-1">Serviços Executados</label><textarea id="kr-os-serv" class="w-full h-24 p-3 rounded-xl border">${esc(o.servicos||'')}</textarea></div><div><label class="block font-bold text-slate-600 mb-1">Anotações / Pendências</label><textarea id="kr-os-obs" class="w-full h-24 p-3 rounded-xl border">${esc(o.observacao||o.pendencias||'')}</textarea></div></div><div class="rounded-xl border p-3 bg-slate-50"><p class="font-bold text-slate-700 mb-2">Produtos / Peças usadas</p><div class="grid grid-cols-1 md:grid-cols-12 gap-2"><select id="kr-os-prod" class="md:col-span-8 h-10 px-3 rounded-xl border bg-white"><option value="">Selecione</option>${pecasOptions()}</select><input id="kr-os-prod-qtd" type="number" value="1" min="1" class="md:col-span-2 h-10 px-3 rounded-xl border"><button onclick="adicionarPecaRefino()" class="md:col-span-2 h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold">Adicionar</button></div><div id="kr-os-pecas" class="mt-3 space-y-2"></div></div></div>`, `<button onclick="${c?`abrirChamadosContrato('${c.id}')`:'fecharModalOperacional()'}" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button><button onclick="salvarChamadoCompleto('${o.id||''}','${c?c.id:''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Chamado</button>${o.id?`<button onclick="imprimirChamadoPDF('${o.id}')" class="h-10 px-5 rounded-xl bg-slate-900 text-white font-bold ml-auto"><i class="ph ph-printer"></i> Imprimir</button>`:''}`, '980px');
  document.getElementById('kr-os-prio').value = o.prioridade || 'normal';
  renderPecas(); if(o.equipamentoId) autoPreencherDadosChamado(o.equipamentoId, true, o.id);
};
window.atualizarImpressorasChamadoRefino = function(){ const clienteId = document.getElementById('kr-os-cli')?.value || ''; const sel = document.getElementById('kr-os-eq'); if(sel) sel.innerHTML = '<option value="">Selecione</option>'+selectEquipOptions(null, '', clienteId); };
// v5.22.73 — cada campo é preenchido só se existir na tela. A tela do chamado
// mudou com o tempo (campos que somem quando a impressora não tem contador
// color, por exemplo) e escrever direto no campo ausente derrubava o sistema
// com "Cannot set properties of null".
function porCampo(id, valor){ const el = document.getElementById(id); if(el) el.value = valor; }
window.autoPreencherDadosChamado = function(equipId, manterAtual, ignoreOsId){
  const eq = getEq(equipId); if(!eq) return;
  const p = (db.parque||[]).filter(x=>x.equipamentoId===equipId).sort((a,b)=>new Date(b.dataInstalacao||0)-new Date(a.dataInstalacao||0))[0] || {};
  porCampo('kr-os-modelo', eq.modelo || '');
  porCampo('kr-os-patr', eq.patrimonio || '');
  porCampo('kr-os-serie', eq.serie || '');
  porCampo('kr-os-local', p.localInstalacao || p.setor || '');
  const ult = ultimoContador(equipId, ignoreOsId);
  porCampo('kr-os-cont-ant', ult.valor);
  if(!manterAtual) porCampo('kr-os-cont-atu', ult.valor);
  calcImpressoesChamado();
};
// v5.22.90 — a função que VALIA procurava só os ids kr-os-* (tela antiga)
// e deixava o chamado atual (ko-*) sem calcular a quantidade impressa.
// Agora atende TODOS os conjuntos de id usados pelas telas de chamado.
window.calcImpressoesChamado = function(){
  var pares = [
    ['ko-cont-ant','ko-cont-atu','ko-qtd-imp'],
    ['kr-os-cont-ant','kr-os-cont-atu','kr-os-qtd'],
    ['o-cont-ant','o-cont-atu','o-qtd-imp'],
    ['ca-cont-ant','ca-cont-atu','ca-qtd']
  ];
  for(var i = 0; i < pares.length; i++){
    var a = document.getElementById(pares[i][0]);
    var u = document.getElementById(pares[i][1]);
    var q = document.getElementById(pares[i][2]);
    if(!a && !u && !q) continue;
    var ant = Number(a && a.value ? a.value : 0) || 0;
    var atu = u && u.value !== '' && u.value != null ? (Number(u.value) || 0) : ant;
    if(atu < ant) atu = ant;
    if(q) q.value = atu - ant;
  }
};
// v5.22.90 — além do oninput dos campos (que nem sempre existe), um ouvinte
// garante o cálculo em QUALQUER campo de contador, em qualquer tela.
if(typeof document !== 'undefined'){
  document.addEventListener('input', function(e){
    var id = (e && e.target && e.target.id) || '';
    if(/-cont-atu$/.test(id) || /-cont-ant$/.test(id)) window.calcImpressoesChamado();
  }, true);
}
function ajustaEstoque(pecas, sinal){ (pecas||[]).forEach(it => { const p = (db.produtos||[]).find(x=>x.id===it.produtoId); if(p && !p.estoqueInfinito && !/SERV/i.test(p.categoria||'')) p.estoque = n(p.estoque) + sinal*n(it.qtd); }); }
window.salvarChamadoCompleto = function(osId, contratoId){
  const s = sess(); if(!s) return;
  const c = contratoId ? getCtr(contratoId) : null;
  const desc = document.getElementById('kr-os-desc')?.value?.trim() || '';
  if(!desc) return aviso('Informe o motivo do chamado', 'error');
  const tecnicoId = document.getElementById('kr-os-tec')?.value || '';
  const equipId = document.getElementById('kr-os-eq')?.value || '';
  const eq = getEq(equipId) || {};
  const pecas = (window.__krPecasChamado || []).map(x => ({ ...x, subtotal:n(x.qtd)*n(x.preco) }));
  const payload = { empresaId:s.empresaId, clienteId:document.getElementById('kr-os-cli')?.value || (c && c.clienteId) || null, contratoId:c?c.id:null, numero:codigoSimples(document.getElementById('kr-os-num')?.value) || proximoCodigo(db.os||[], s.empresaId), dataAbertura:isoData(document.getElementById('kr-os-data')?.value), prioridade:document.getElementById('kr-os-prio')?.value || 'normal', tecnicoId, tecnico:tecnicoValorNome(tecnicoId), descricao:desc, status:document.getElementById('kr-os-concluido')?.checked ? 'concluido' : 'aberto', equipamentoId:equipId || null, modelo:document.getElementById('kr-os-modelo')?.value?.trim() || eq.modelo || '', patrimonio:document.getElementById('kr-os-patr')?.value?.trim() || eq.patrimonio || '', serie:document.getElementById('kr-os-serie')?.value?.trim() || eq.serie || '', local:document.getElementById('kr-os-local')?.value?.trim() || '', contadorAntigo:n(document.getElementById('kr-os-cont-ant')?.value), contadorAtual:n(document.getElementById('kr-os-cont-atu')?.value), quantidadeImpressos:n(document.getElementById('kr-os-qtd')?.value), servicos:document.getElementById('kr-os-serv')?.value?.trim() || '', observacao:document.getElementById('kr-os-obs')?.value?.trim() || '', pendencias:document.getElementById('kr-os-obs')?.value?.trim() || '', pecas, custoPecas:pecas.reduce((sum,x)=>sum+n(x.subtotal),0), dataFechamento:document.getElementById('kr-os-concluido')?.checked ? new Date().toISOString() : null };
  if(osId){ const old = (db.os||[]).find(x=>x.id===osId); if(!old) return aviso('Chamado não encontrado','error'); ajustaEstoque(old.pecas, +1); ajustaEstoque(pecas, -1); Object.assign(old, payload, { atualizadoEm:new Date().toISOString(), atualizadoPorNome:s.usuarioNome }); logar('os','editar',osId,`Chamado ${payload.numero} editado por ${s.usuarioNome}`); }
  else { ajustaEstoque(pecas, -1); const novo = { id:uidLocal('os'), criadoEm:new Date().toISOString(), criadoPor:s.usuarioId, criadoPorNome:s.usuarioNome, ...payload }; db.os.push(novo); osId = novo.id; logar('os','criar',novo.id,`Chamado ${novo.numero} aberto por ${s.usuarioNome}`); }
  if(equipId && payload.contadorAtual) { const eqReal = getEq(equipId); if(eqReal) eqReal.contadorPB = Math.max(n(eqReal.contadorPB), payload.contadorAtual); }
  salvar(); aviso('Chamado salvo', 'success'); if(c) abrirChamadosContrato(c.id); else { closeK(); if(typeof renderOs === 'function') renderOs(); } if(typeof renderProdutos === 'function') renderProdutos();
};
function thChamado(col, label, cId){ return `<th onclick="chamadosSortRefino('${col}','${cId}')" class="px-4 py-3 cursor-pointer hover:text-[#0a1e8a]">${label}${STATE.chamadoSort===col?' ▲':''}</th>`; }
window.aplicarBuscaChamadosRefino = function(cId){ STATE.chamadoBusca = document.getElementById('kr-ch-busca')?.value || ''; STATE.chamadoStatus = document.getElementById('kr-ch-status')?.value || 'abertos'; abrirChamadosContrato(cId); };
window.chamadosSortRefino = function(col,cId){ STATE.chamadoSort = col; abrirChamadosContrato(cId); };
window.abrirChamadosContrato = function(contratoId){
  const c = getCtr(contratoId); if(!c) return;
  const q = norm(STATE.chamadoBusca);
  let lista = (db.os||[]).filter(o => o.clienteId === c.clienteId);
  if(STATE.chamadoStatus === 'abertos') lista = lista.filter(o => !['concluido','cancelado','fechado'].includes(o.status)); else if(STATE.chamadoStatus) lista = lista.filter(o => o.status === STATE.chamadoStatus);
  if(q) lista = lista.filter(o => [codigoOS(o), o.descricao, o.tecnico, o.criadoPorNome, o.patrimonio, o.modelo].some(v => norm(v).includes(q)));
  const sorters = { codigo:o=>numeroCodigo(o.numero), data:o=>o.dataAbertura||'', impressora:o=>o.patrimonio||'', modelo:o=>o.modelo||'', tecnico:o=>o.tecnico||'', criador:o=>o.criadoPorNome||'', status:o=>o.status||'' };
  lista = ordenar(lista, sorters[STATE.chamadoSort] || sorters.codigo);
  setModal(`Chamados — Contrato ${codigoContrato(c)}`, `<div class="space-y-4 text-[13px]"><div class="flex flex-wrap justify-between gap-3 bg-slate-50 p-3 rounded-xl border"><button onclick="openModalChamadoCompleto(null,'${c.id}')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-plus-circle"></i> Novo Chamado</button><div class="flex gap-2"><select id="kr-ch-status" onchange="aplicarBuscaChamadosRefino('${c.id}')" class="h-10 px-3 rounded-xl border bg-white"><option value="abertos" ${STATE.chamadoStatus==='abertos'?'selected':''}>Abertos automáticos</option><option value="" ${STATE.chamadoStatus===''?'selected':''}>Todos</option><option value="concluido" ${STATE.chamadoStatus==='concluido'?'selected':''}>Finalizados</option><option value="cancelado" ${STATE.chamadoStatus==='cancelado'?'selected':''}>Cancelados</option></select><input id="kr-ch-busca" value="${esc(STATE.chamadoBusca)}" placeholder="Pesquisar..." class="h-10 px-3 rounded-xl border w-[230px]">${btnBusca(`aplicarBuscaChamadosRefino('${c.id}')`)}</div></div><div class="overflow-auto max-h-[500px] border rounded-xl"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr>${thChamado('codigo','Código',c.id)}${thChamado('data','Data',c.id)}${thChamado('impressora','Impressora',c.id)}${thChamado('modelo','Modelo',c.id)}<th class="px-4 py-3">Motivo</th>${thChamado('criador','Criado por',c.id)}${thChamado('tecnico','Técnico',c.id)}${thChamado('status','Status',c.id)}<th class="px-4 py-3 text-right">PDF</th></tr></thead><tbody class="divide-y">${lista.map(o => { const venc = chamadoVencido(o.dataAbertura, o.status); return `<tr ondblclick="openModalChamadoCompleto('${o.id}','${c.id}')" class="hover:bg-slate-50 cursor-pointer ${venc?'bg-red-50/50':''}"><td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">${esc(codigoOS(o))}</td><td class="px-4 py-2.5">${dataBR(o.dataAbertura)} ${venc?'<span class="ml-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">VENCIDO</span>':''}</td><td class="px-4 py-2.5 font-mono font-bold">${esc(o.patrimonio||'-')}</td><td class="px-4 py-2.5">${esc(o.modelo||'')}</td><td class="px-4 py-2.5">${esc(o.descricao||'')}</td><td class="px-4 py-2.5">${esc(o.criadoPorNome||'-')}</td><td class="px-4 py-2.5">${esc(o.tecnico||'-')}</td><td class="px-4 py-2.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${o.status==='concluido'?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800'}">${o.status==='concluido'?'Finalizado':'Aberto'}</span></td><td class="px-4 py-2.5 text-right"><button onclick="event.stopPropagation(); imprimirChamadoPDF('${o.id}')" class="w-8 h-8 rounded-lg hover:bg-slate-100"><i class="ph ph-printer"></i></button></td></tr>`; }).join('') || '<tr><td colspan="9" class="p-12 text-center text-slate-400">Nenhum chamado</td></tr>'}</tbody></table></div></div>`, `<button onclick="openContratoCompleto('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">← Voltar</button><button onclick="fecharModalOperacional()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>`, '1080px');
  bindEnter('kr-ch-busca', () => window.aplicarBuscaChamadosRefino(c.id));
};

function printWindow(htmlDoc, slug){
  const win = window.open('', '_blank');
  if(!win) return;
  win.document.open(); win.document.write(htmlDoc); win.document.close();
  setTimeout(() => { try{ win.history.replaceState(null, '', slug || 'relatorio.html'); }catch(_e){} }, 50);
}
function basePrintCSS(){ return `@page{size:A4;margin:8mm}body{font-family:Arial,sans-serif;margin:0;color:#111;font-size:12px;background:white}.page{padding:16px}.top{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0a1e8a;padding-bottom:12px;margin-bottom:12px}.brand{display:flex;align-items:center;gap:12px}.brand h1{margin:0;color:#0a1e8a;font-size:19px}.muted{color:#64748b;font-size:11px}.box{border:1px solid #d7dce2;border-radius:10px;padding:10px;margin:8px 0;background:#fafbff}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #d7dce2;padding:6px;text-align:left}th{background:#eef2ff;color:#0a1e8a;font-size:10px;text-transform:uppercase}.sig{border-top:1px solid #111;width:220px;text-align:center;padding-top:6px;margin-top:46px}.no-print{margin:14px}.no-print button{padding:10px 18px;background:#0a1e8a;color:white;border:0;border-radius:8px;font-weight:bold}@media print{.no-print{display:none}.page{padding:0}}`; }
window.imprimirChamadoPDF = function(osId){
  const o = (db.os||[]).find(x=>x.id===osId); if(!o) return aviso('Chamado não encontrado','error');
  const cli = getCli(o.clienteId) || {};
  const pecas = (o.pecas||[]).map(it => `<tr><td>${esc(it.descricao||'')}</td><td>${n(it.qtd)}</td><td>${dinheiro(it.preco)}</td><td>${dinheiro(it.subtotal)}</td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center">Sem produtos</td></tr>';
  const title = `Chamado ${codigoOS(o)}`;
  const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${basePrintCSS()}</style></head><body><script>document.title=${JSON.stringify(title)};try{history.replaceState(null,'',${JSON.stringify('chamado-'+codigoOS(o)+'.html')});}catch(e){}</script><div class="no-print"><button onclick="window.print()">🖨 Imprimir / Salvar PDF</button></div><div class="page"><div class="top"><div class="brand">${logoHTML()}<div><h1>Ordem de Serviço Técnica</h1><div class="muted">DIGICOPY • Assistência e locação de impressoras</div></div></div><div style="text-align:right"><div class="muted">Código</div><h1 style="margin:0;color:#0a1e8a">${esc(codigoOS(o))}</h1><div class="muted">${dataBR(o.dataAbertura)}</div></div></div><div class="grid"><div class="box"><b>Cliente</b><p>${esc(cli.nome||'')}</p><p class="muted">${esc(cli.documento||'')} • ${esc(cli.telefone||'')}</p><p class="muted">${esc(cli.endereco||'')} ${esc(cli.numero||'')} - ${esc(cli.cidade||'')}/${esc(cli.estado||'')}</p></div><div class="box"><b>Atendimento</b><p><b>Criado por:</b> ${esc(o.criadoPorNome||'-')}</p><p><b>Técnico:</b> ${esc(o.tecnico||'-')}</p><p><b>Status:</b> ${esc(o.status||'aberto')}</p></div></div><div class="box"><b>Impressora</b><p>${esc(o.modelo||'-')} • Patrimônio ${esc(o.patrimonio||'-')} • Serial ${esc(o.serie||'-')}</p><p class="muted">Local: ${esc(o.local||'-')}</p></div><div class="box"><b>Motivo / Defeito informado</b><p>${esc(o.descricao||'-')}</p></div><div class="box"><b>Serviços executados / observações</b><p>${esc(o.servicos||o.observacao||'-')}</p></div><div class="box"><b>Produtos / Peças aplicadas</b><table><thead><tr><th>Produto</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${pecas}</tbody></table></div><div style="display:flex;justify-content:space-between"><div class="sig">Assinatura Técnico</div><div class="sig">Assinatura Cliente</div></div></div></body></html>`;
  printWindow(doc, `chamado-${codigoOS(o)}.html`);
};
window.imprimirRelatorioLeiturasPDF = function(contratoId){
  const c = getCtr(contratoId); if(!c) return;
  const cli = getCli(c.clienteId) || {};
  const linhas = leiturasContratoCliente(c).slice().reverse().map(l => { const eq = getEq(l.equipamentoId)||{}; return `<tr><td>${dataBR(l.dataLeitura)}</td><td>${esc(eq.patrimonio||'-')}</td><td>${esc(eq.modelo||'')}</td><td>${n(l.contadorPBAnterior)}</td><td>${n(l.contadorPB)}</td><td>${n(l.consumoPB)}</td><td>${n(l.qtdExcedentePB)}</td><td>${dinheiro(l.valorExcedente)}</td></tr>`; }).join('') || '<tr><td colspan="8" style="text-align:center">Sem leituras</td></tr>';
  const title = `Leituras contrato ${codigoContrato(c)}`;
  const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${basePrintCSS()}</style></head><body><script>document.title=${JSON.stringify(title)};try{history.replaceState(null,'',${JSON.stringify('leituras-contrato-'+codigoContrato(c)+'.html')});}catch(e){}</script><div class="no-print"><button onclick="window.print()">🖨 Imprimir / Salvar PDF</button></div><div class="page"><div class="top"><div class="brand">${logoHTML()}<div><h1>Relatório de Leituras</h1><div class="muted">DIGICOPY • Conferência de contadores</div></div></div><div style="text-align:right"><div class="muted">Contrato</div><h1 style="margin:0;color:#0a1e8a">${esc(codigoContrato(c))}</h1><div class="muted">${dataBR(new Date())}</div></div></div><div class="box"><b>Cliente:</b> ${esc(cli.nome||'')} • ${esc(cli.documento||'')}</div><table><thead><tr><th>Data</th><th>Impressora</th><th>Modelo</th><th>Antigo</th><th>Atual</th><th>Utilizado</th><th>Qtd Exced.</th><th>Valor</th></tr></thead><tbody>${linhas}</tbody></table></div></body></html>`;
  printWindow(doc, `leituras-contrato-${codigoContrato(c)}.html`);
};
window.imprimirContratoLocacaoOperacional = function(contratoId, tipo){
  const c = getCtr(contratoId); if(!c) return;
  const cli = getCli(c.clienteId) || {};
  const maquinas = parquesDoClienteContrato(db, c);
  const rows = maquinas.map(p => { const eq = getEq(p.equipamentoId)||{}; return `<tr><td>${esc(eq.patrimonio||'')}</td><td>${esc(eq.modelo||'')}</td><td>${esc(eq.serie||'')}</td><td>${esc(p.setor||'')}</td><td>${esc(p.localInstalacao||'')}</td></tr>`; }).join('') || '<tr><td colspan="5" style="text-align:center">Sem impressoras</td></tr>';
  const titulo = tipo === 'proposta' ? 'Proposta de Locação' : 'Contrato de Locação';
  const title = `${titulo} ${codigoContrato(c)}`;
  const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${basePrintCSS()}p{line-height:1.45}.clausula{margin:8px 0}</style></head><body><script>document.title=${JSON.stringify(title)};try{history.replaceState(null,'',${JSON.stringify((tipo==='proposta'?'proposta':'contrato')+'-'+codigoContrato(c)+'.html')});}catch(e){}</script><div class="no-print"><button onclick="window.print()">🖨 Imprimir / Salvar PDF</button></div><div class="page"><div class="top"><div class="brand">${logoHTML()}<div><h1>${titulo}</h1><div class="muted">DIGICOPY • Locação e outsourcing de impressoras</div></div></div><div style="text-align:right"><div class="muted">Código</div><h1 style="margin:0;color:#0a1e8a">${esc(codigoContrato(c))}</h1><div class="muted">${dataBR(new Date())}</div></div></div><div class="grid"><div class="box"><b>Cliente</b><p>${esc(cli.nome||'')}</p><p class="muted">${esc(cli.documento||'')} • ${esc(cli.telefone||'')}</p><p class="muted">${esc(cli.endereco||'')} ${esc(cli.numero||'')} - ${esc(cli.cidade||'')}/${esc(cli.estado||'')}</p></div><div class="box"><b>Condições</b><p>Vigência: ${dataBR(c.dataInicio)} até ${dataBR(c.dataFim)}</p><p>Valor mensal: <b>${dinheiro(c.valorMensalFixo)}</b></p><p>Franquia PB: ${n(c.franquiaPB).toLocaleString('pt-BR')} • Excedente PB: ${dinheiro(c.valorExcedentePB)}</p></div></div><div class="box"><b>Equipamentos</b><table><thead><tr><th>Patrimônio</th><th>Modelo</th><th>Serial</th><th>Departamento</th><th>Local</th></tr></thead><tbody>${rows}</tbody></table></div><div class="box"><p class="clausula">A DIGICOPY disponibiliza ao cliente os equipamentos relacionados acima, com as condições comerciais descritas neste documento.</p><p class="clausula">As leituras, chamados técnicos e produtos utilizados ficam registrados no DIGICOPY ERP para conferência e histórico de atendimento.</p><p class="clausula">Demais condições comerciais podem ser complementadas conforme negociação entre as partes.</p></div><div style="display:flex;justify-content:space-between"><div class="sig">DIGICOPY</div><div class="sig">Cliente</div></div></div></body></html>`;
  printWindow(doc, `${tipo==='proposta'?'proposta':'contrato'}-${codigoContrato(c)}.html`);
};


window.renderOs = function(){
  const s = sess(); if(!s) return;
  const view = document.getElementById('view-manutencao');
  if(!view || view.classList.contains('hidden')) return;
  const search = norm(document.getElementById('search-os')?.value || '');
  const status = document.getElementById('filter-os-status')?.value || '';
  let lista = (db.os || []).filter(o => o.empresaId === s.empresaId || !o.empresaId);
  if(status) lista = lista.filter(o => o.status === status);
  if(search) lista = lista.filter(o => [codigoOS(o), o.descricao, o.criadoPorNome, o.tecnico, o.patrimonio, o.modelo, (getCli(o.clienteId)||{}).nome].some(v => norm(v).includes(search)));
  lista = ordenar(lista, o => numeroCodigo(o.numero)).reverse();
  const kanban = document.getElementById('os-kanban');
  const listBox = document.getElementById('os-list');
  const tbody = document.getElementById('tbody-os');
  if(kanban){
    const cols = [
      { id:'aberto', label:'Aberto' },
      { id:'em_atendimento', label:'Em atendimento' },
      { id:'aguardando_peca', label:'Aguardando peça' },
      { id:'concluido', label:'Finalizado' }
    ];
    kanban.innerHTML = cols.map(col => {
      const items = lista.filter(o => (o.status || 'aberto') === col.id || (col.id === 'aberto' && !o.status));
      return `<div class="rounded-[16px] border bg-slate-50 p-3 flex flex-col"><div class="flex items-center justify-between mb-3"><h4 class="font-bold text-[12px] uppercase">${col.label}</h4><span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border">${items.length}</span></div><div class="space-y-3 flex-1 overflow-auto" style="min-height:360px">${items.map(o => { const cli=getCli(o.clienteId)||{}; const venc=chamadoVencido(o.dataAbertura,o.status); return `<div class="rounded-xl bg-white border p-3 shadow-sm hover:shadow-md cursor-pointer ${venc?'border-red-200 bg-red-50/40':''}" onclick="openModal('os','${o.id}')"><div class="flex justify-between"><span class="font-mono text-[12px] font-bold text-[#0a1e8a]">${esc(codigoOS(o))}</span>${venc?'<span class="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">VENCIDO</span>':''}</div><p class="font-semibold text-[13px] mt-2">${esc(cli.nome||'Sem cliente')}</p><p class="text-[11px] text-slate-600 mt-1">${esc(o.modelo||'')} • Patr. ${esc(o.patrimonio||'-')}</p><p class="text-[11px] text-slate-500 mt-1">Criado por ${esc(o.criadoPorNome||'-')} • Técnico ${esc(o.tecnico||'-')}</p></div>`; }).join('') || '<p class="text-[12px] text-slate-400 p-4 text-center">Vazio</p>'}</div></div>`;
    }).join('');
  }
  if(tbody){
    tbody.innerHTML = lista.map(o => { const cli=getCli(o.clienteId)||{}; const venc=chamadoVencido(o.dataAbertura,o.status); return `<tr class="hover:bg-slate-50 ${venc?'bg-red-50/40':''}"><td class="px-5 py-3"><p class="font-mono text-[12px] font-bold text-[#0a1e8a]">${esc(codigoOS(o))}</p><p class="font-semibold text-[12.5px]">${esc(cli.nome||'Sem cliente')}</p><p class="text-[11px] text-slate-500">Criado por ${esc(o.criadoPorNome||'-')}</p></td><td class="px-5 py-3"><p class="text-[12px] font-semibold">${esc(o.modelo||'')}</p><p class="text-[11px] text-slate-500">Patr. ${esc(o.patrimonio||'-')}</p></td><td class="px-5 py-3"><p class="text-[12px]">${esc(o.tecnico||'-')}</p></td><td class="px-5 py-3"><p class="text-[12px]">${dataBR(o.dataAbertura)} ${venc?'<b class="text-red-700">VENCIDO</b>':''}</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${o.status==='concluido'?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800'}">${o.status==='concluido'?'Finalizado':'Aberto'}</span></td><td class="px-5 py-3"><button onclick="openModal('os','${o.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></td></tr>`; }).join('') || '<tr><td colspan="6" class="p-12 text-center text-slate-400">Nenhum chamado</td></tr>';
  }
  bindEnter('search-os', window.renderOs);
};

const oldOpenModalRefino = window.openModal;
window.openModal = function(type, id){
  if(type === 'contrato') return window.renderModalContrato(id);
  if(type === 'os') return window.openModalChamadoCompleto(id, '');
  if(oldOpenModalRefino) return oldOpenModalRefino(type, id);
};

console.log(`[DIGICOPY] contratos_refino_patch.js ${PATCH_VERSION} carregado`);
})();
