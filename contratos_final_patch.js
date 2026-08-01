// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.17 — Contratos final, vínculos migrados e RTF
// • Corrige "Sem cliente" vinculando contratos aos cadastros migrados
// • Cria/associa impressoras de ITENS_LOCACAO dentro do cadastro do contrato
// • Substitui a abertura do contrato por uma tela limpa, sem bloco duplicado
// • Contrato e proposta agora são baixados em .RTF
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); }
function esc(v){ return txt(v).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function n(v, fb=0){ const out = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(out) ? out : fb; }
function inteiro(v, fb=0){ const out = parseInt(String(v ?? '').replace(',', '.'), 10); return Number.isFinite(out) ? out : fb; }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function uidSafe(p){ return typeof uid === 'function' ? uid(p) : `${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function salvar(){ if(typeof saveDB === 'function') saveDB(); }
function aviso(m,t){ if(typeof toast === 'function') toast(m,t||'info'); }
function dinheiro(v){ return typeof fmtMoney === 'function' ? fmtMoney(n(v)) : n(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function dataBR(v){ if(typeof fmtDate === 'function') return fmtDate(v); if(!v) return '-'; const d=new Date(v); return Number.isNaN(d.getTime())?txt(v):d.toLocaleDateString('pt-BR'); }
function codigo(v){ const g = txt(v).match(/\d+/g); if(!g || !g.length) return ''; const last = g[g.length-1].replace(/^0+/,''); return last || '0'; }
function codigoContrato(c){ return codigo(c && (c.numero || c.codigo || c.codigoAntigo || c.id)); }
function cmp(a,b){ return txt(a).localeCompare(txt(b),'pt-BR',{numeric:true,sensitivity:'base'}); }
function byId(list,id){ return (list||[]).find(x => x.id === id) || null; }
function cliente(id){ return byId(db.clientes, id); }
function contrato(id){ return byId(db.contratos, id); }
function equipamento(id){ return byId(db.equipamentos, id); }
function modulo(nome){ return (db.modulosDinamicos || {})[nome] || null; }
function linhasModulo(regex){
  const out = [];
  Object.entries(db.modulosDinamicos || {}).forEach(([nome, mod]) => {
    if(regex.test(nome)) out.push(...((mod && mod.dados) || []));
  });
  return out;
}
function assinaturaLinhas(regex){ const r=linhasModulo(regex); const last=r[r.length-1]||{}; return `${r.length}:${JSON.stringify(last).slice(0,80)}`; }
function assinaturaArray(nome, empId){ const a=Array.isArray(db[nome])?db[nome].filter(x=>!empId||!x.empresaId||x.empresaId===empId):[]; const last=a[a.length-1]||{}; return `${nome}:${a.length}:${JSON.stringify(last).slice(0,80)}`; }
function assinaturaReconciliar(empId){ return [assinaturaLinhas(/^LOCACAO$|^LOCAÇÃO$|CONTRATO/i), assinaturaLinhas(/^ITENS_LOCACAO$|^ITENS_LOCAÇÃO$|ITEM.*LOC/i), assinaturaArray('contratos',empId), assinaturaArray('clientes',empId), assinaturaArray('equipamentos',empId), assinaturaArray('parque',empId)].join('|'); }
function pick(row, nomes){ for(const k of nomes){ if(row && row[k] !== undefined && row[k] !== null && txt(row[k]) !== '') return row[k]; } return ''; }
function nomeRow(row){ return pick(row, ['NOME','RAZAO_SOCIAL','RAZAOSOCIAL','NOME_FANTASIA','FANTASIA','CLIENTE','NOME_CLIENTE','DESCRICAO','CONTATO']); }
function iso(rowValue, fallback=''){
  const v = txt(rowValue);
  if(!v) return fallback;
  if(/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0,10);
  const m = v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if(m){ const y = m[3].length===2 ? '20'+m[3] : m[3]; return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
  const d = new Date(v); return Number.isNaN(d.getTime()) ? fallback : d.toISOString().slice(0,10);
}
function normalizaNomeEmpresa(nome){
  const s = txt(nome);
  if(!s) return '';
  return s.toLowerCase().replace(/\b\p{L}/gu, c => c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, m => m.toLowerCase()).replace(/\b(Jk|Me|Ltda|Eireli|Epp|Mei)\b/g, m => m.toUpperCase());
}
function clientePorCodigo(cod, empId){
  const c = codigo(cod);
  if(!c) return null;
  return (db.clientes||[]).find(x => x.empresaId === empId && (codigo(x.codigo) === c || codigo(x.codigoAntigo) === c || codigo(x.idLegado) === c)) || null;
}
function contratoPorCodigo(cod, empId){
  const c = codigo(cod);
  if(!c) return null;
  return (db.contratos||[]).find(x => x.empresaId === empId && (codigo(x.codigoAntigo) === c || codigo(x.numero) === c || codigo(x.codigo) === c)) || null;
}
function equipamentoPorChave(chave, empId){
  const k = up(chave);
  if(!k) return null;
  return (db.equipamentos||[]).find(e => e.empresaId === empId && (up(e.patrimonio) === k || up(e.serie) === k || up(e.codigoAntigo) === k)) || null;
}
function rawLocPorContrato(c){
  const cod = codigo(c && (c.codigoAntigo || c.numero || c.codigo));
  if(!cod) return null;
  return linhasModulo(/^LOCACAO$|^LOCAÇÃO$|CONTRATO/i).find(r => codigo(pick(r,['COD_LOCACAO','CODIGO','LO_CODIGO','L_CODIGO','ID','COD','NUMERO'])) === cod) || null;
}
function rawClientePorCodigo(cod){
  const c = codigo(cod);
  if(!c) return null;
  return linhasModulo(/CLIENT|PESSOA|CADASTRO/i).find(r => codigo(pick(r,['CODIGO','COD_CLIENTE','CODIGO_CLIENTE','ID','CLIENTE_ID'])) === c) || null;
}
function criaClienteDeRaw(cod, row, empId){
  const c = codigo(cod);
  if(!c) return null;
  const nome = normalizaNomeEmpresa(nomeRow(row) || `Cliente ${c}`);
  const novo = {
    id: uidSafe('cli'), empresaId: empId, codigo: c, codigoAntigo: c, nome, fantasia: nome,
    documento: pick(row,['CNPJ','CPF','DOCUMENTO','DOC']), telefone: pick(row,['FONE','TELEFONE','CELULAR']),
    email: pick(row,['EMAIL']), endereco: pick(row,['ENDERECO','ENDERECO_COMPLETO']), cidade: pick(row,['CIDADE']), estado: pick(row,['UF','ESTADO']), cep: pick(row,['CEP']),
    tipo: 'PJ', status: 'ativo', criadoPor: 'migracao', criadoPorNome: 'Migração', criadoEm: new Date().toISOString()
  };
  db.clientes.push(novo);
  return novo;
}
function vincularContratosClientes(empId){
  let mudou = 0;
  (db.contratos||[]).filter(c => c.empresaId === empId).forEach(c => {
    if(c.clienteId && cliente(c.clienteId)) return;
    const raw = rawLocPorContrato(c);
    const codCli = codigo(c.codClienteAntigo || pick(raw||{}, ['LO_COD_CLIENTE','L_COD_CLIENTE','COD_CLIENTE','CLIENTE','COD_PESSOA','ID_CLIENTE']));
    if(!codCli) return;
    let cli = clientePorCodigo(codCli, empId);
    if(!cli) cli = criaClienteDeRaw(codCli, rawClientePorCodigo(codCli) || raw || {}, empId);
    if(cli){ c.clienteId = cli.id; c.codClienteAntigo = codCli; mudou++; }
  });
  return mudou;
}
function equipamentoDeItem(row, empId){
  const codEq = pick(row, ['IL_COD_EQUIPAMENTO','COD_EQUIPAMENTO','EQUIPAMENTO','ID_EQUIPAMENTO','COD_IMPRESSORA']);
  const patrimonio = txt(pick(row, ['IL_PATRIMONIO','PATRIMONIO','PATR','TOMBAMENTO','IL_SERIAL','SERIAL','NUMERO_SERIE'])) || txt(codEq);
  const serie = txt(pick(row, ['IL_SERIAL','SERIAL','NUMERO_SERIE','SERIE'])) || patrimonio || txt(codEq);
  let eq = equipamentoPorChave(patrimonio || serie || codEq, empId);
  if(eq) return eq;
  const modelo = txt(pick(row, ['MODELO','DESCRICAO','DESCRIÇÃO','EQUIPAMENTO','IMPRESSORA','MARCA_MODELO'])) || `Impressora ${patrimonio || serie || codEq || ''}`.trim();
  eq = { id: uidSafe('eq'), empresaId: empId, codigoAntigo: codigo(codEq), modelo, tipo: 'Laser', serie: serie || patrimonio || uidSafe('serie'), patrimonio: patrimonio || serie || codigo(codEq) || uidSafe('pat'), contadorPB: inteiro(pick(row,['CONTADOR','CONTADOR_PB','CONTADOR_PRETO','CONT_ANT']),0), contadorCor: inteiro(pick(row,['CONTADOR_COR','CONTADOR_COLOR']),0), status: 'locado', criadoPor: 'migracao', criadoPorNome: 'Migração', criadoEm: new Date().toISOString() };
  db.equipamentos.push(eq);
  return eq;
}
function medidoresPadrao(row, contrato){
  const valor = n(pick(row,['IL_VALOR_PAGINA','VALOR_PAGINA','VALOR','VALOR_EXCEDENTE']), n(contrato && contrato.valorExcedentePB, 0));
  const franquia = inteiro(pick(row,['IL_FRANQUIA','FRANQUIA','FRANQUIA_PB']), n(contrato && contrato.franquiaPB, 0));
  return { pretoA4:{key:'pretoA4',label:'Preto A4',modalidade:'global',contadorAnterior:inteiro(pick(row,['CONTADOR','CONTADOR_PB','CONT_ANT']),0),franquia,valor,ativo:true}, colorA4:{key:'colorA4',label:'Color A4',modalidade:'global',contadorAnterior:0,franquia:0,valor:0,ativo:true}, scanner:{key:'scanner',label:'Scanner',modalidade:'impressao',contadorAnterior:0,franquia:0,valor:0,ativo:true}, pretoA3:{key:'pretoA3',label:'Preto A3',modalidade:'global',contadorAnterior:0,franquia:0,valor:0,ativo:true}, colorA3:{key:'colorA3',label:'Color A3',modalidade:'global',contadorAnterior:0,franquia:0,valor:0,ativo:true} };
}
function recriarParque(empId){
  let mudou = 0;
  linhasModulo(/^ITENS_LOCACAO$|^ITENS_LOCAÇÃO$|ITEM.*LOC/i).forEach(row => {
    const codItem = codigo(pick(row,['COD_ITENS_LOCACAO','CODIGO','IL_CODIGO','ID','COD']));
    const codLoc = codigo(pick(row,['COD_LOCACAO','IL_COD_LOCACAO','LOCACAO','ID_LOCACAO']));
    const c = contratoPorCodigo(codLoc, empId);
    const codCli = codigo(pick(row,['IL_COD_CLIENTE','COD_CLIENTE','CLIENTE','ID_CLIENTE'])) || (c && codigo(c.codClienteAntigo));
    let cli = c && c.clienteId ? cliente(c.clienteId) : clientePorCodigo(codCli, empId);
    if(!cli && codCli) cli = criaClienteDeRaw(codCli, rawClientePorCodigo(codCli) || row, empId);
    if(c && cli && c.clienteId !== cli.id){ c.clienteId = cli.id; mudou++; }
    const eq = equipamentoDeItem(row, empId);
    let p = codItem ? (db.parque||[]).find(x => x.empresaId === empId && codigo(x.codigoAntigo) === codItem) : null;
    if(!p && c && eq) p = (db.parque||[]).find(x => x.empresaId === empId && x.contratoId === c.id && x.equipamentoId === eq.id);
    const dados = { empresaId: empId, codigoAntigo: codItem, contratoId: c ? c.id : null, clienteId: cli ? cli.id : (c ? c.clienteId : null), equipamentoId: eq ? eq.id : null, setor: txt(pick(row,['IL_DEPARTAMENTO','DEPARTAMENTO','SETOR','IL_SETOR','LOCAL','LOCALIDADE'])) || 'Geral', localInstalacao: txt(pick(row,['LOCAL_INSTALACAO','LOCAL','LOCALIDADE','LOCALIZACAO'])) || '', patrimonio: eq ? eq.patrimonio : '', status: 'ativo', medidores: medidoresPadrao(row, c), modalidade: 'global', franquiaPB: inteiro(pick(row,['IL_FRANQUIA','FRANQUIA']), n(c && c.franquiaPB,0)), valorExcedentePB: n(pick(row,['IL_VALOR_PAGINA','VALOR_PAGINA','IL_VALOR']), n(c && c.valorExcedentePB,0)), atualizadoEm: new Date().toISOString() };
    if(p){ Object.assign(p, dados); }
    else { db.parque.push({ id: uidSafe('prq'), criadoPor:'migracao', criadoPorNome:'Migração', criadoEm:new Date().toISOString(), dataInstalacao:new Date().toISOString(), ...dados }); }
    if(c && eq){ if(!Array.isArray(c.equipamentos)) c.equipamentos=[]; if(!c.equipamentos.includes(eq.id)) c.equipamentos.push(eq.id); }
    mudou++;
  });
  return mudou;
}
function reconciliar(empId){
  if(!empId || !db) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sigAntes=assinaturaReconciliar(empId);
  if(db.config.automacoes.contratosFinalReconAssinatura===sigAntes) return 0;
  const total = vincularContratosClientes(empId) + recriarParque(empId);
  db.config.automacoes.contratosFinalReconAssinatura=assinaturaReconciliar(empId);
  if(total || sigAntes) salvar();
  return total;
}
function maquinasContrato(c){
  if(!c) return [];
  const seen = new Set();
  return (db.parque||[]).filter(p => p.empresaId === c.empresaId && (p.contratoId === c.id || (c.clienteId && p.clienteId === c.clienteId))).filter(p => {
    const k = p.id || `${p.equipamentoId}-${p.contratoId}`;
    if(seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a,b)=>cmp((equipamento(a.equipamentoId)||{}).patrimonio, (equipamento(b.equipamentoId)||{}).patrimonio));
}
function chamadosCliente(c){ return c && c.clienteId ? (db.os||[]).filter(o => o.clienteId === c.clienteId && !['concluido','cancelado','fechado'].includes(o.status)).length : 0; }
function setModal(t,b,f,max='1080px'){
  const box=document.getElementById('modal-box'); if(box) box.className=`w-full max-w-[${max}] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col`;
  const title=document.getElementById('modal-title'); if(title) title.innerText=t;
  const body=document.getElementById('modal-body'); if(body) body.innerHTML=b;
  const foot=document.getElementById('modal-footer'); if(foot) foot.innerHTML=f||'';
  document.getElementById('modal-root')?.classList.remove('hidden');
}
function fechar(){ if(typeof closeModal==='function') closeModal(); else document.getElementById('modal-root')?.classList.add('hidden'); }
function botaoBusca(onclick){ return `<button type="button" onclick="${onclick}" class="h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i></button>`; }
function bindEnter(id, cb){ const el=document.getElementById(id); if(el){ el.removeAttribute('oninput'); el.oninput=null; el.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); cb(); } }; } }

const STATE = window.__CONTRATOS_FINAL_STATE__ || (window.__CONTRATOS_FINAL_STATE__ = { busca:'', status:'', sort:'codigo' });
function th(col,label){ return `<th onclick="contratosFinalSort('${col}')" class="px-4 py-2.5 cursor-pointer hover:text-[#0a1e8a]">${label}${STATE.sort===col?' ▲':''}</th>`; }
function clienteContrato(c){
  let cl = c && c.clienteId ? cliente(c.clienteId) : null;
  if(!cl){ const raw=rawLocPorContrato(c); const codCli=codigo(c && c.codClienteAntigo || pick(raw||{}, ['LO_COD_CLIENTE','L_COD_CLIENTE','COD_CLIENTE','CLIENTE','COD_PESSOA','ID_CLIENTE'])); cl=clientePorCodigo(codCli, c && c.empresaId); }
  return cl;
}
function nomeClienteContrato(c){ const cl=clienteContrato(c); return cl ? cl.nome : 'Cliente sem vínculo'; }
window.contratosFinalBuscar = function(){ STATE.busca=document.getElementById('search-contratos')?.value||''; STATE.status=document.getElementById('filter-contrato-status')?.value||''; window.renderContratos(); };
window.contratosFinalSort = function(col){ STATE.sort=col; window.renderContratos(); };
window.renderContratos = function(){
  const s=sess(); if(!s) return;
  const view=document.getElementById('view-contratos'); if(!view || view.classList.contains('hidden')) return;
  reconciliar(s.empresaId);
  const q=up(STATE.busca);
  let lista=(db.contratos||[]).filter(c=>c.empresaId===s.empresaId && c.status!=='excluido');
  if(STATE.status) lista=lista.filter(c=>c.status===STATE.status);
  if(q) lista=lista.filter(c=>[codigoContrato(c), c.numero, nomeClienteContrato(c), c.codClienteAntigo].some(v=>up(v).includes(q)));
  const sorters={codigo:c=>Number(codigoContrato(c)||0), cliente:nomeClienteContrato, inicio:c=>c.dataInicio||'', fim:c=>c.dataFim||'', impressoras:c=>maquinasContrato(c).filter(p=>p.status==='ativo').length, chamados:chamadosCliente, valor:c=>n(c.valorMensalFixo), status:c=>c.status||''};
  lista=[...lista].sort((a,b)=>{ const A=sorters[STATE.sort]||sorters.codigo; const av=A(a), bv=A(b); return typeof av==='number'&&typeof bv==='number'?av-bv:cmp(av,bv); });
  const ativos=(db.contratos||[]).filter(c=>c.empresaId===s.empresaId && c.status==='ativo');
  view.innerHTML=`<div class="space-y-4"><div class="flex flex-wrap justify-between gap-3 items-center"><button onclick="openModal('contrato')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13.5px] font-semibold shadow"><i class="ph ph-plus mr-1"></i>Novo contrato</button><div class="flex gap-2"><select id="filter-contrato-status" onchange="contratosFinalBuscar()" class="h-10 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todos status</option><option value="ativo" ${STATE.status==='ativo'?'selected':''}>Ativo</option><option value="pendente" ${STATE.status==='pendente'?'selected':''}>Pendente</option><option value="vencido" ${STATE.status==='vencido'?'selected':''}>Vencido</option><option value="encerrado" ${STATE.status==='encerrado'?'selected':''}>Encerrado</option></select><input id="search-contratos" value="${esc(STATE.busca)}" placeholder="Código ou cliente..." class="h-10 px-4 rounded-xl bg-white border text-[13px] w-[280px]">${botaoBusca('contratosFinalBuscar()')}</div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Contratos</p><p class="text-[22px] font-extrabold">${lista.length}</p></div><div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Ativos</p><p class="text-[22px] font-extrabold text-emerald-700">${ativos.length}</p></div><div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Mensalidade</p><p class="text-[20px] font-extrabold text-[#0a1e8a]">${dinheiro(ativos.reduce((sum,c)=>sum+n(c.valorMensalFixo),0))}</p></div><div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Abrir</p><p class="text-[13px] font-bold">Duplo clique no cliente</p></div></div><div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><div class="overflow-auto max-h-[690px]"><table class="w-full text-left text-[13px]"><thead class="sticky top-0 bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr>${th('codigo','Código')}${th('cliente','Cliente')}${th('inicio','Início')}${th('fim','Fim')}${th('impressoras','Impressoras')}${th('chamados','Chamados')}${th('valor','Valor')}${th('status','Status')}<th class="px-4 py-2.5 text-right">Excluir</th></tr></thead><tbody class="divide-y">${lista.map(c=>{ const imps=maquinasContrato(c).filter(p=>p.status==='ativo').length; const ch=chamadosCliente(c); return `<tr ondblclick="openContratoCompleto('${c.id}')" class="hover:bg-blue-50/50 cursor-pointer"><td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">${esc(codigoContrato(c))}</td><td class="px-4 py-2.5"><p class="font-semibold">${esc(nomeClienteContrato(c))}</p><p class="text-[11px] text-slate-500">Duplo clique para abrir</p></td><td class="px-4 py-2.5">${dataBR(c.dataInicio)}</td><td class="px-4 py-2.5">${dataBR(c.dataFim)}</td><td class="px-4 py-2.5 font-bold">${imps}</td><td class="px-4 py-2.5 ${ch?'font-bold text-amber-700':''}">${ch}</td><td class="px-4 py-2.5 font-bold">${dinheiro(c.valorMensalFixo)}</td><td class="px-4 py-2.5"><span class="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold uppercase">${esc(c.status||'ativo')}</span></td><td class="px-4 py-2.5 text-right"><button onclick="event.stopPropagation(); excluirContratoOperacional('${c.id}')" class="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></td></tr>`;}).join('') || '<tr><td colspan="9" class="p-12 text-center text-slate-500">Nenhum contrato</td></tr>'}</tbody></table></div></div></div>`;
  bindEnter('search-contratos', window.contratosFinalBuscar);
};

function tabelaImpressoras(c){
  const lista=maquinasContrato(c);
  return `<div class="border rounded-xl overflow-hidden"><div class="bg-slate-50 px-4 py-3 border-b flex justify-between items-center"><div><b>Impressoras do cadastro do contrato</b><p class="text-[11px] text-slate-500 mt-1">Esta lista alimenta leituras e chamados.</p></div><button onclick="abrirModalEquipamentoContrato('${c.id}', null)" class="h-9 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]">+ Nova impressora</button></div><div class="overflow-auto max-h-[380px]"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr><th class="px-4 py-2.5">Patrimônio</th><th class="px-4 py-2.5">Modelo</th><th class="px-4 py-2.5">Serial</th><th class="px-4 py-2.5">Departamento / Local</th><th class="px-4 py-2.5">Status</th><th class="px-4 py-2.5 text-right">Editar</th></tr></thead><tbody class="divide-y">${lista.map(p=>{ const e=equipamento(p.equipamentoId)||{}; return `<tr ondblclick="abrirModalEquipamentoContrato('${p.contratoId || c.id}','${p.id}')" class="hover:bg-slate-50 cursor-pointer"><td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">${esc(e.patrimonio || p.patrimonio || '-')}</td><td class="px-4 py-2.5 font-semibold">${esc(e.modelo || '')}</td><td class="px-4 py-2.5 font-mono">${esc(e.serie || '')}</td><td class="px-4 py-2.5">${esc(p.setor||'Geral')}<br><span class="text-[11px] text-slate-500">${esc(p.localInstalacao||p.enderecoInstalacao||'')}</span></td><td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold uppercase">${esc(p.status||'ativo')}</span></td><td class="px-4 py-2.5 text-right"><button onclick="abrirModalEquipamentoContrato('${p.contratoId || c.id}','${p.id}')" class="w-8 h-8 rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></td></tr>`;}).join('') || '<tr><td colspan="6" class="p-8 text-center text-slate-400">Nenhuma impressora cadastrada neste contrato</td></tr>'}</tbody></table></div></div>`;
}
window.openContratoCompleto = function(contratoId){
  const s=sess(); if(!s) return;
  reconciliar(s.empresaId);
  const c=contrato(contratoId); if(!c) return aviso('Contrato não encontrado','error');
  const cl=clienteContrato(c)||{};
  const maquinas=maquinasContrato(c).filter(p=>p.status==='ativo');
  const chamados=chamadosCliente(c);
  const leituras=(db.leituras||[]).filter(l=>l.contratoId===c.id || (c.clienteId && l.clienteId===c.clienteId)).length;
  setModal(`Contrato ${codigoContrato(c)} — ${cl.nome || 'Cliente'}`, `<div class="space-y-5 text-[13px]"><div class="rounded-[18px] bg-[#0a1e8a] text-white p-5 flex flex-col md:flex-row justify-between gap-4"><div><p class="text-[11px] uppercase font-bold text-white/70">Cliente</p><h3 class="text-[20px] font-extrabold mt-1">${esc(cl.nome||'Cliente sem vínculo')}</h3><p class="text-[12px] text-white/80 mt-1">${esc(cl.documento||'')} ${cl.cidade?('• '+esc(cl.cidade)+'/'+esc(cl.estado||'')):''}</p></div><div class="text-right"><p class="text-[11px] uppercase font-bold text-white/70">Código</p><p class="text-[26px] font-extrabold">${esc(codigoContrato(c))}</p><p class="text-[12px] text-white/80">${dataBR(c.dataInicio)} até ${dataBR(c.dataFim)}</p></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div class="rounded-[16px] border bg-emerald-50 border-emerald-200 p-4"><p class="text-[11px] font-bold uppercase text-emerald-800">Impressoras</p><p class="text-[26px] font-extrabold text-emerald-700">${maquinas.length}</p></div><div class="rounded-[16px] border bg-amber-50 border-amber-200 p-4"><p class="text-[11px] font-bold uppercase text-amber-800">Chamados Abertos</p><p class="text-[26px] font-extrabold text-amber-700">${chamados}</p></div><div class="rounded-[16px] border bg-blue-50 border-blue-200 p-4"><p class="text-[11px] font-bold uppercase text-blue-800">Valor Mensal</p><p class="text-[22px] font-extrabold text-blue-700">${dinheiro(c.valorMensalFixo)}</p></div><div class="rounded-[16px] border bg-purple-50 border-purple-200 p-4"><p class="text-[11px] font-bold uppercase text-purple-800">Leituras</p><p class="text-[26px] font-extrabold text-purple-700">${leituras}</p></div></div><div class="flex flex-wrap gap-3"><button onclick="abrirLeiturasContrato('${c.id}')" class="h-11 px-6 rounded-xl bg-emerald-600 text-white font-bold"><i class="ph ph-speedometer"></i> Leituras</button><button onclick="abrirChamadosContrato('${c.id}')" class="h-11 px-6 rounded-xl bg-blue-600 text-white font-bold"><i class="ph ph-wrench"></i> Chamados</button><button onclick="abrirModalEquipamentoContrato('${c.id}', null)" class="h-11 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold ml-auto"><i class="ph ph-printer"></i> Nova Impressora</button><button onclick="baixarContratoRTF('${c.id}','contrato')" class="h-11 px-4 rounded-xl bg-white border font-bold">Contrato RTF</button><button onclick="baixarContratoRTF('${c.id}','proposta')" class="h-11 px-4 rounded-xl bg-white border font-bold">Proposta RTF</button></div>${tabelaImpressoras(c)}</div>`, `<button onclick="fecharModalOperacional ? fecharModalOperacional() : closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button><button onclick="salvarContratoFullRefino('${c.id}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Contrato</button>`, '1080px');
};
function rtfEsc(v){ return txt(v).replace(/\\/g,'\\\\').replace(/\{/g,'\\{').replace(/\}/g,'\\}').replace(/\n/g,'\\par '); }
function rtfLine(label, value){ return `\\b ${rtfEsc(label)}:\\b0  ${rtfEsc(value)}\\par `; }
window.baixarContratoRTF = function(contratoId, tipo){
  const c=contrato(contratoId); if(!c) return;
  const cl=clienteContrato(c)||{};
  const titulo=tipo==='proposta'?'PROPOSTA DE LOCAÇÃO':'CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS';
  const equipamentos=maquinasContrato(c).map((p,idx)=>{ const e=equipamento(p.equipamentoId)||{}; return `${idx+1}. Patrimônio ${e.patrimonio||p.patrimonio||'-'} - ${e.modelo||''} - Serial ${e.serie||''} - Local ${p.setor||''} ${p.localInstalacao||''}`; }).join('\n');
  const conteudo=`{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\fs22\\b ${rtfEsc(titulo)}\\b0\\par\\par ${rtfLine('Código', codigoContrato(c))}${rtfLine('Cliente', cl.nome||'')}${rtfLine('Documento', cl.documento||'')}${rtfLine('Endereço', `${cl.endereco||''} ${cl.numero||''} - ${cl.bairro||''} - ${cl.cidade||''}/${cl.estado||''}`)}${rtfLine('Vigência', `${dataBR(c.dataInicio)} até ${dataBR(c.dataFim)}`)}${rtfLine('Valor mensal', dinheiro(c.valorMensalFixo))}${rtfLine('Franquia PB', n(c.franquiaPB).toLocaleString('pt-BR'))}${rtfLine('Valor excedente PB', dinheiro(c.valorExcedentePB))}\\par\\b EQUIPAMENTOS\\b0\\par ${rtfEsc(equipamentos || 'Nenhum equipamento cadastrado')}\\par\\par\\b CONDIÇÕES\\b0\\par A DIGICOPY disponibiliza ao cliente os equipamentos relacionados acima para uso conforme as condições comerciais descritas neste documento.\\par As leituras, chamados técnicos e produtos utilizados serão registrados no sistema para conferência e histórico.\\par\\par\\par ________________________________\\tab\\tab ________________________________\\par DIGICOPY\\tab\\tab Cliente\\par}`;
  const blob=new Blob([conteudo],{type:'application/rtf'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${tipo==='proposta'?'proposta':'contrato'}-${codigoContrato(c)||'sem-codigo'}.rtf`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500);
};

window.CONTRATOS_FINAL_PURE = { codigo, vincularContratosClientes, recriarParque, reconciliar };

const oldShowApp = window.showApp;
window.showApp = function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; const s=sess(); if(s){ const job=()=>reconciliar(s.empresaId); if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('contratos_final_reconciliar', job, 100); else setTimeout(job,100); } return ret; };
{ const job=()=>{ const s=sess(); if(s) reconciliar(s.empresaId); }; if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('contratos_final_reconciliar', job, 500); else setTimeout(job,500); }
console.log('[DIGICOPY] contratos_final_patch.js v4.9.17 carregado');
})();
