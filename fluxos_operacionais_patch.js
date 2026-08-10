// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.13 — Ajustes dos fluxos pedidos pelo Operacional
// • Produtos com busca só no Enter/lupa, categorias unificadas, estoque mínimo estrito e NF preparada
// • Contratos com abertura por duplo clique, sem botão de alterar na grade, impressoras, leituras e chamados no formato operacional
// • Leituras com lançamento por impressora, contador 0 válido, remanejadas/inativas bloqueadas e cálculo de excedente por modalidade
// • Chamados com filtro padrão de abertos, vencidos, contador antigo automático, peças/produtos e impressão A4
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const KAUAN_VERSION = '4.9.13';

function toNumber(value, fallback = 0){
  if(value === null || value === undefined || value === '') return fallback;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

function toInt(value, fallback = 0){
  const n = parseInt(String(value ?? '').replace(',', '.'), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(value){
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function onlyDigits(value){
  return String(value ?? '').replace(/\D+/g, '');
}

function titlePessoa(value){
  const txt = String(value || '').trim();
  if(!txt) return '';
  if(window.VOTM_PURE && typeof window.VOTM_PURE.toTitleCase === 'function') return window.VOTM_PURE.toTitleCase(txt);
  return txt.toLowerCase().replace(/\p{L}/gu, ch => ch.toUpperCase()).replace(/(Da|De|Do|Das|Dos|E)/g, m => m.toLowerCase());
}

function money(value){
  if(typeof fmtMoney === 'function') return fmtMoney(toNumber(value));
  return toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dateBR(value){
  if(typeof fmtDate === 'function') return fmtDate(value);
  if(!value) return '-';
  const d = new Date(value);
  if(Number.isNaN(d.getTime())) return String(value).slice(0, 10).split('-').reverse().join('/');
  return d.toLocaleDateString('pt-BR');
}

function dateTimeBR(value){
  if(typeof fmtDateTime === 'function') return fmtDateTime(value);
  if(!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('pt-BR');
}

function html(value){
  return String(value ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function uidSafe(prefix){
  if(typeof uid === 'function') return uid(prefix);
  return `${prefix || 'id'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getSess(){
  return (typeof getSession === 'function') ? getSession() : null;
}

function toastMsg(msg, type){
  if(typeof toast === 'function') toast(msg, type || 'info');
}

function saveSafe(){
  if(typeof saveDB === 'function') saveDB();
}

function logSafe(entidade, acao, id, detalhes){
  if(typeof logAction === 'function') logAction(entidade, acao, id, detalhes);
}

function sectionHidden(id){
  const el = (typeof document !== 'undefined') ? document.getElementById(id) : null;
  return !!(el && el.classList && el.classList.contains('hidden'));
}

function compareSmart(a, b){
  const av = a === null || a === undefined ? '' : a;
  const bv = b === null || b === undefined ? '' : b;
  const as = String(av).trim();
  const bs = String(bv).trim();
  if(!as && bs) return 1;
  if(as && !bs) return -1;
  const an = Number(as.replace(',', '.'));
  const bn = Number(bs.replace(',', '.'));
  if(Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
  return as.localeCompare(bs, 'pt-BR', { sensitivity: 'base', numeric: true });
}

function sortAsc(list, getter){
  return [...(list || [])].sort((a, b) => compareSmart(getter(a), getter(b)));
}

const CATEGORIAS_PRODUTO = [
  'Produto', 'Serviço', 'Cartucho', 'Cartucho Vazio', 'Insumo', 'Equipamento',
  'Impressoras', 'Chip', 'Compatível', 'Informática', 'Original', 'Outros'
];

function categoriaUnificada(value){
  const raw = String(value || '').trim();
  const n = normalizeText(raw);
  if(!n) return 'Produto';
  if(n.includes('SERV')) return 'Serviço';
  if(n.includes('CARTUCHO') && n.includes('VAZ')) return 'Cartucho Vazio';
  if(n.includes('CART')) return 'Cartucho';
  if(n.includes('TONER') || n.includes('SUPR') || n.includes('INSUM') || n.includes('PECA') || n.includes('PEÇA')) return 'Insumo';
  if(n.includes('EQUIP')) return 'Equipamento';
  if(n.includes('IMPRESS')) return 'Impressoras';
  if(n.includes('CHIP')) return 'Chip';
  if(n.includes('COMPAT')) return 'Compatível';
  if(n.includes('INFO')) return 'Informática';
  if(n.includes('ORIG')) return 'Original';
  if(n === 'PRODUTO') return 'Produto';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function produtoEhServico(produto){
  return normalizeText(produto && produto.categoria).includes('SERV') || normalizeText(produto && produto.tipo).includes('SERV');
}

function estoqueBaixoEstrito(estoque, minimo){
  return toNumber(estoque) < toNumber(minimo);
}

function periodoFromDate(value){
  const s = String(value || new Date().toISOString());
  return s.slice(0, 7);
}

function isoFromDateInput(value){
  if(!value) return new Date().toISOString();
  if(String(value).includes('T')) return new Date(value).toISOString();
  return new Date(`${value}T12:00:00`).toISOString();
}

function getEquipamento(equipId){
  return (db.equipamentos || []).find(e => e.id === equipId) || null;
}

function getParque(parqueId){
  return (db.parque || []).find(p => p.id === parqueId) || null;
}

function getCliente(clienteId){
  return (db.clientes || []).find(c => c.id === clienteId) || null;
}

function getContrato(contratoId){
  return (db.contratos || []).find(c => c.id === contratoId) || null;
}

function ultimoParqueDoEquipamento(equipId){
  return (db.parque || [])
    .filter(p => p.equipamentoId === equipId)
    .sort((a, b) => new Date(b.dataInstalacao || b.criadoEm || 0) - new Date(a.dataInstalacao || a.criadoEm || 0))[0] || null;
}

function ultimoContadorPreto(dbRef, equipId, ignoreOsId){
  const eq = (dbRef.equipamentos || []).find(e => e.id === equipId) || {};
  let best = {
    valor: toNumber(eq.contadorPB, 0),
    data: eq.atualizadoEm || eq.criadoEm || '',
    origem: 'cadastro'
  };

  (dbRef.leituras || []).forEach(l => {
    if(l.equipamentoId !== equipId) return;
    const valor = toNumber(l.contadorPB, NaN);
    if(!Number.isFinite(valor)) return;
    const data = l.dataLeitura || l.criadoEm || '';
    if(!best.data || new Date(data) >= new Date(best.data || 0)) best = { valor, data, origem: 'leitura' };
  });

  (dbRef.os || []).forEach(o => {
    if(ignoreOsId && o.id === ignoreOsId) return;
    const osEquipMatch = o.equipamentoId === equipId;
    const eqMatch = !osEquipMatch && eq && ((eq.serie && o.serie === eq.serie) || (eq.patrimonio && o.patrimonio === eq.patrimonio));
    if(!osEquipMatch && !eqMatch) return;
    const valor = toNumber(o.contadorAtual, NaN);
    if(!Number.isFinite(valor)) return;
    const data = o.dataFechamento || o.dataAbertura || o.criadoEm || '';
    if(!best.data || new Date(data) >= new Date(best.data || 0)) best = { valor, data, origem: 'chamado' };
  });

  return best;
}

function calcularLeituraOperacional(dbRef, contrato, parque, anterior, atual, dataLeitura, leituraIgnorarId){
  const ant = Math.max(0, toNumber(anterior, 0));
  const atu = Math.max(ant, toNumber(atual, ant));
  const utilizado = atu - ant;
  const modalidade = parque && parque.status === 'inativo' ? 'inativo' : String((parque && parque.modalidade) || 'global');
  const valorPagina = toNumber((parque && parque.valorExcedentePB), toNumber(contrato && contrato.valorExcedentePB, 0));
  let qtdExcedente = 0;

  if(modalidade === 'impressao'){
    qtdExcedente = utilizado;
  } else if(modalidade === 'mes_fixo' || modalidade === 'inativo'){
    qtdExcedente = 0;
  } else if(modalidade === 'individual'){
    const franquiaInd = toNumber(parque && parque.franquiaPB, 0);
    qtdExcedente = Math.max(0, utilizado - franquiaInd);
  } else {
    const periodo = periodoFromDate(dataLeitura);
    const franquiaGlobal = toNumber(contrato && contrato.franquiaPB, 0);
    const leiturasPeriodo = (dbRef.leituras || []).filter(l =>
      l.contratoId === (contrato && contrato.id) &&
      periodoFromDate(l.dataLeitura) === periodo &&
      l.id !== leituraIgnorarId
    );
    const usadoAntes = leiturasPeriodo.reduce((s, l) => s + toNumber(l.consumoPB, 0), 0);
    const excedAntes = Math.max(0, usadoAntes - franquiaGlobal);
    const excedDepois = Math.max(0, usadoAntes + utilizado - franquiaGlobal);
    qtdExcedente = Math.max(0, excedDepois - excedAntes);
  }

  return {
    anterior: ant,
    atual: atu,
    utilizado,
    qtdExcedente,
    valorExcedente: qtdExcedente * valorPagina,
    modalidade,
    valorPagina
  };
}

function chamadoVencido(dataAbertura, status){
  const st = normalizeText(status || 'aberto');
  if(st === 'CONCLUIDO' || st === 'CANCELADO' || st === 'FECHADO') return false;
  if(!dataAbertura) return false;
  return String(dataAbertura).slice(0, 10) < new Date().toISOString().slice(0, 10);
}

function normalizarNCM(value){
  const dig = onlyDigits(value).slice(0, 8);
  if(dig.length <= 4) return dig;
  if(dig.length <= 6) return `${dig.slice(0, 4)}.${dig.slice(4)}`;
  return `${dig.slice(0, 4)}.${dig.slice(4, 6)}.${dig.slice(6)}`;
}

function adaptarProdutosMigrados(dbRef, empresaId){
  let alterou = false;
  (dbRef.produtos || []).forEach(p => {
    if(empresaId && p.empresaId !== empresaId) return;
    const cat = categoriaUnificada(p.categoria || p.tipoCadastro || p.tipoProduto || p.tipo || p.grupo || p.subgrupo);
    if(p.categoria !== cat){ p.categoria = cat; alterou = true; }
    ['tipoCadastro', 'tipoProduto', 'categoriaDuplicada', 'promocao', 'precoPromocao', 'varejo', 'precoVarejo'].forEach(k => {
      if(Object.prototype.hasOwnProperty.call(p, k)){ delete p[k]; alterou = true; }
    });
    if(p.status === undefined || p.status === ''){ p.status = 'ativo'; alterou = true; }
    p.controleEstoque = true;
  });
  return alterou;
}

window.FLUXOS_PURE = {
  categoriaUnificada,
  estoqueBaixoEstrito,
  compareSmart,
  sortAsc,
  ultimoContadorPreto,
  calcularLeituraOperacional,
  chamadoVencido,
  normalizarNCM,
  adaptarProdutosMigrados
};

if(typeof window === 'undefined' || typeof document === 'undefined') return;

const STATE = window.__KAUAN_STATE__ || (window.__KAUAN_STATE__ = {
  prod: { q: '', cat: '', baixo: false, sort: 'codigo' },
  ctr: { q: '', status: '', sort: 'codigo' },
  leiturasBusca: '',
  chamados: { q: '', status: 'abertos', sort: 'codigo' },
  listaLeitura: { q: '', data: '' }
});

function ensureModalSize(size){
  const box = document.getElementById('modal-box');
  if(!box) return;
  const max = size || '980px';
  box.className = `w-full max-w-[${max}] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col`;
}

function setModal(title, body, footer, size){
  ensureModalSize(size);
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');
  if(titleEl) titleEl.innerText = title;
  if(bodyEl) bodyEl.innerHTML = body;
  if(footerEl) footerEl.innerHTML = footer || '';
  const root = document.getElementById('modal-root');
  if(root) root.classList.remove('hidden');
}

function fecharModal(){
  if(typeof closeModal === 'function') closeModal();
  else document.getElementById('modal-root')?.classList.add('hidden');
}

function filtroBusca(value){
  return normalizeText(value);
}

function botaoBusca(onclick){
  return `<button type="button" onclick="${onclick}" class="h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold" title="Pesquisar"><i class="ph ph-magnifying-glass"></i></button>`;
}

function thSort(fn, col, label, active){
  return `<th onclick="${fn}('${col}')" class="px-4 py-2.5 cursor-pointer select-none hover:text-[#0a1e8a]">${label}${active === col ? ' ▲' : ''}</th>`;
}

function bindBuscaEnter(id, callbackName){
  const el = document.getElementById(id);
  if(!el) return;
  el.removeAttribute('oninput');
  el.oninput = null;
  el.onkeydown = function(e){
    if(e.key === 'Enter'){
      e.preventDefault();
      const fn = window[callbackName];
      if(typeof fn === 'function') fn();
    }
  };
}

function sanitizarBuscas(){
  const map = {
    'search-produtos': 'aplicarBuscaProdutosOperacional',
    'search-contratos': 'aplicarBuscaContratosOperacional',
    'search-clientes': 'renderClientes',
    'search-equip': 'renderEquipamentos',
    'search-parque': 'renderParque',
    'search-os': 'renderOs',
    'search-auditoria': 'renderAuditoria',
    'top-command-search': 'handleTopSearchOperacional'
  };
  Object.entries(map).forEach(([id, cb]) => bindBuscaEnter(id, cb));
  const nv = document.getElementById('nv-prod-search');
  if(nv){
    nv.removeAttribute('oninput');
    nv.oninput = null;
    nv.onkeydown = function(e){
      if(e.key === 'Enter'){
        e.preventDefault();
        if(typeof searchProdutosVenda === 'function') searchProdutosVenda(nv.value);
      }
    };
  }
}

window.handleTopSearchOperacional = function(){
  const v = document.getElementById('top-command-search')?.value || '';
  if(typeof handleGlobalSearch === 'function') handleGlobalSearch(v);
};

function produtoCodigo(p){
  return p.codigo ?? p.sku ?? p.id ?? '';
}
function _getSeqProduto(empresaId){
  db._seq = db._seq || {};
  db._seq.produto = db._seq.produto || {};
  const key = empresaId || 'global';
  if(db._seq.produto[key]==null){
    const prods = (db.produtos||[]).filter(pr=>pr.empresaId===empresaId);
    // se tiver codigos altos tipo 8k mas poucos produtos, renumera do 1
    let max = 0;
    prods.forEach(pr=>{
      const n = parseInt(String(pr.sku||pr.codigo||'').replace(/\D/g,''))||0;
      if(n>max) max=n;
    });
    // se max muito maior que quantidade (ex: 8000 com 10 produtos), renumera
    if(max > prods.length + 50){
      const ordenados = [...prods].sort((a,b)=> new Date(a.criadoEm||0) - new Date(b.criadoEm||0));
      ordenados.forEach((pr,i)=>{ pr.sku = String(i+1); pr.codigo = String(i+1); });
      max = ordenados.length;
      if(typeof saveSafe==='function') try{saveSafe();}catch(e){}
    }
    db._seq.produto[key] = max + 1;
    if(typeof saveSafe==='function') try{saveSafe();}catch(e){}
  }
  return db._seq.produto[key];
}
function peekCodigoProduto(empresaId){
  return String(_getSeqProduto(empresaId));
}
function consumirCodigoProduto(empresaId){
  db._seq = db._seq || {};
  db._seq.produto = db._seq.produto || {};
  const key = empresaId || 'global';
  const cod = _getSeqProduto(empresaId);
  db._seq.produto[key] = cod + 1;
  if(typeof saveSafe==='function') try{saveSafe();}catch(e){}
  return String(cod);
}


function produtoCategoriaOptions(selected){
  const opts = [...new Set([...CATEGORIAS_PRODUTO, ...((db.produtos || []).map(p => categoriaUnificada(p.categoria))).filter(Boolean)])];
  return opts.map(c => `<option value="${html(c)}" ${c === selected ? 'selected' : ''}>${html(c)}</option>`).join('');
}

window.aplicarBuscaProdutosOperacional = function(){
  STATE.prod.q = document.getElementById('search-produtos')?.value || '';
  STATE.prod.cat = document.getElementById('filter-prod-cat')?.value || '';
  STATE.prod.baixo = !!document.getElementById('filter-prod-baixo')?.checked;
  window.renderProdutos();
};

window.produtosSortOperacional = function(col){
  STATE.prod.sort = col;
  window.renderProdutos();
};

window.limparBuscaProdutosOperacional = function(){
  STATE.prod.q = '';
  STATE.prod.cat = '';
  STATE.prod.baixo = false;
  window.renderProdutos();
};

window.renderProdutos = function(){
  const sess = getSess();
  if(!sess || sectionHidden('view-produtos')) return;
  const view = document.getElementById('view-produtos');
  if(!view) return;
  if(adaptarProdutosMigrados(db, sess.empresaId)) saveSafe();

  const qNorm = filtroBusca(STATE.prod.q);
  let list = (db.produtos || []).filter(p => p.empresaId === sess.empresaId && p.status !== 'excluido');
  if(STATE.prod.cat) list = list.filter(p => categoriaUnificada(p.categoria) === STATE.prod.cat);
  if(STATE.prod.baixo) list = list.filter(p => estoqueBaixoEstrito(p.estoque, p.estoqueMin));
  if(qNorm){
    list = list.filter(p => [produtoCodigo(p), p.nome, p.descricao, p.fabricante, p.local, p.ncm]
      .some(v => normalizeText(v).includes(qNorm)));
  }

  const sorters = {
    codigo: p => produtoCodigo(p),
    descricao: p => p.nome || p.descricao || '',
    categoria: p => p.categoria || '',
    estoque: p => toNumber(p.estoque),
    minimo: p => toNumber(p.estoqueMin),
    valor: p => toNumber(p.preco),
    local: p => p.local || ''
  };
  list = sortAsc(list, sorters[STATE.prod.sort] || sorters.codigo);
  const vis = list.slice(0, 300);
  const totalProdutos = (db.produtos || []).filter(p => p.empresaId === sess.empresaId && p.status !== 'excluido').length;
  const baixoCount = (db.produtos || []).filter(p => p.empresaId === sess.empresaId && p.status !== 'excluido' && estoqueBaixoEstrito(p.estoque, p.estoqueMin)).length;
  const estoqueTotal = (db.produtos || []).filter(p => p.empresaId === sess.empresaId && p.status !== 'excluido')
    .reduce((s, p) => s + (toNumber(p.estoque) * toNumber(p.preco)), 0);

  view.innerHTML = `
    <div class="space-y-4">
      <div class="flex flex-wrap gap-3 justify-between items-center">
        <div class="flex flex-wrap gap-2">
          <button onclick="openModal('produto')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13.5px] font-semibold shadow"><i class="ph ph-plus mr-1"></i>Novo produto</button>
          <button onclick="openModal('entradaEstoque')" class="h-10 px-4 rounded-xl bg-slate-900 text-white text-[13px]">Entrada estoque</button>
          <button onclick="limparBuscaProdutosOperacional()" class="h-10 px-4 rounded-xl bg-white border text-[13px]">Limpar filtros</button>
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <select id="filter-prod-cat" onchange="aplicarBuscaProdutosOperacional()" class="h-10 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todas categorias</option>${produtoCategoriaOptions(STATE.prod.cat)}</select>
          <label class="h-10 px-3 rounded-xl bg-white border text-[12px] font-semibold flex items-center gap-2"><input id="filter-prod-baixo" type="checkbox" ${STATE.prod.baixo ? 'checked' : ''} onchange="aplicarBuscaProdutosOperacional()"> Abaixo do mínimo</label>
          <input id="search-produtos" value="${html(STATE.prod.q)}" placeholder="Código, descrição, NCM..." class="h-10 px-4 rounded-xl bg-white border text-[13.5px] w-[270px]">
          ${botaoBusca('aplicarBuscaProdutosOperacional()')}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-[14px] bg-white border p-4 flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center"><i class="ph ph-package"></i></div><div><p class="text-[11px] uppercase font-bold text-slate-500">Total SKUs</p><p class="text-[18px] font-bold">${totalProdutos}</p></div></div>
        <div class="rounded-[14px] bg-white border ${baixoCount ? 'border-red-300 bg-red-50/50' : ''} p-4 flex items-center gap-3"><div class="w-10 h-10 rounded-xl ${baixoCount ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'} grid place-items-center"><i class="ph ph-warning"></i></div><div><p class="text-[11px] uppercase font-bold text-slate-500">Abaixo do mínimo</p><p class="text-[18px] font-bold ${baixoCount ? 'text-red-600' : ''}">${baixoCount}</p><p class="text-[10px] text-slate-500">Igual ao mínimo não avisa</p></div></div>
        <div class="rounded-[14px] bg-white border p-4 flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><i class="ph ph-check-circle"></i></div><div><p class="text-[11px] uppercase font-bold text-slate-500">Controle de estoque</p><p class="text-[18px] font-bold">Fixo</p></div></div>
        <div class="rounded-[14px] bg-white border p-4 flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-[#e8eaf8] text-[#0a1e8a] grid place-items-center"><i class="ph ph-currency-dollar"></i></div><div><p class="text-[11px] uppercase font-bold text-slate-500">Valor venda estoque</p><p class="text-[18px] font-bold">${money(estoqueTotal)}</p></div></div>
      </div>

      <div class="rounded-[16px] bg-white border shadow-sm overflow-hidden">
        <div class="overflow-auto max-h-[680px]">
          <table class="w-full text-left text-[13px]">
            <thead class="sticky top-0 bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500">
              <tr>
                ${thSort('produtosSortOperacional', 'codigo', 'Código', STATE.prod.sort)}
                ${thSort('produtosSortOperacional', 'descricao', 'Descrição', STATE.prod.sort)}
                ${thSort('produtosSortOperacional', 'categoria', 'Tipo / Categoria', STATE.prod.sort)}
                ${thSort('produtosSortOperacional', 'estoque', 'Estoque', STATE.prod.sort)}
                ${thSort('produtosSortOperacional', 'minimo', 'Mínimo', STATE.prod.sort)}
                ${thSort('produtosSortOperacional', 'valor', 'Valor Venda', STATE.prod.sort)}
                ${thSort('produtosSortOperacional', 'local', 'Local', STATE.prod.sort)}
                <th class="px-4 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${vis.map(p => {
                const isLow = estoqueBaixoEstrito(p.estoque, p.estoqueMin);
                return `<tr ondblclick="openModal('produto','${p.id}')" class="hover:bg-slate-50 cursor-pointer ${isLow ? 'bg-red-50/40' : ''}">
                  <td class="px-4 py-2.5 font-mono text-[11px] font-bold text-[#0a1e8a]">${html(produtoCodigo(p))}</td>
                  <td class="px-4 py-2.5"><p class="font-semibold text-[13px]">${html(p.nome || p.descricao || '')}</p><p class="text-[11px] text-slate-500">Marca: ${html(p.fabricante || '-')} • Criado por ${html(p.criadoPorNome || '-')}</p></td>
                  <td class="px-4 py-2.5"><span class="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold">${html(categoriaUnificada(p.categoria))}</span></td>
                  <td class="px-4 py-2.5"><b class="${isLow ? 'text-red-600' : ''}">${toNumber(p.estoque)}</b></td>
                  <td class="px-4 py-2.5">${toNumber(p.estoqueMin)}</td>
                  <td class="px-4 py-2.5 font-bold text-emerald-700">${money(p.preco || 0)}</td>
                  <td class="px-4 py-2.5"><span class="font-mono text-[11px] px-2 py-1 rounded bg-slate-100 border">${html(p.local || '-')}</span></td>
                  <td class="px-4 py-2.5"><div class="flex justify-end gap-1"><button onclick="openModal('produto','${p.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100" title="Editar"><i class="ph ph-pencil"></i></button><button onclick="deleteProduto('${p.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Excluir"><i class="ph ph-trash"></i></button></div></td>
                </tr>`;
              }).join('') || '<tr><td colspan="8" class="px-5 py-14 text-center text-slate-500">Nenhum produto encontrado</td></tr>'}
              ${list.length > vis.length ? `<tr><td colspan="8" class="px-5 py-3 text-center text-[12px] text-slate-500">Mostrando 300 de ${list.length}. Use a busca para refinar.</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  bindBuscaEnter('search-produtos', 'aplicarBuscaProdutosOperacional');
};

window.renderModalProduto = function(id){
  const sess = getSess(); if(!sess) return;
  const isEdit = !!id;
  const p = isEdit ? (db.produtos || []).find(x => x.id === id && x.empresaId === sess.empresaId) : {
    sku: '', nome: '', categoria: 'Produto', fabricante: '', estoque: 0, estoqueMin: 0, estoqueIdeal: 0,
    custo: 0, preco: 0, local: '', ncm: '', origem: '0 - Nacional, exceto as indicadas nos códigos 3 a 5', status: 'ativo'
  };
  if(!p) return toastMsg('Produto não encontrado', 'error');
  const cat = categoriaUnificada(p.categoria || p.tipoCadastro || p.tipo);
  setModal(isEdit ? `Alterar produto — ${produtoCodigo(p)}` : 'Novo cadastro de produto', `
    <div class="space-y-4 text-[13px]">
      <div class="flex border-b gap-4 font-bold text-[13px] text-slate-500">
        <button type="button" onclick="mudarAbaProdutoOperacional('dados')" id="kp-tab-prod-dados" class="pb-2 border-b-2 border-[#0a1e8a] text-[#0a1e8a]">Dados do Produto</button>
        <button type="button" onclick="mudarAbaProdutoOperacional('estoque')" id="kp-tab-prod-estoque" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Estoque</button>
        <button type="button" onclick="mudarAbaProdutoOperacional('nf')" id="kp-tab-prod-nf" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Nota Fiscal</button>
      </div>

      <div id="kp-prod-dados" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label class="block font-bold text-slate-600 mb-1">Código (automático)</label><input id="kp-prd-sku" value="${isEdit ? html(produtoCodigo(p)) : peekCodigoProduto(sess.empresaId)}" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-100 font-mono cursor-not-allowed"></div>
          <div class="md:col-span-2"><label class="block font-bold text-slate-600 mb-1">Tipo de Cadastro / Categoria</label><select id="kp-prd-cat" class="w-full h-10 px-3 rounded-xl border font-semibold">${produtoCategoriaOptions(cat)}</select></div>
        </div>
        <div><label class="block font-bold text-slate-600 mb-1">Cadastrar novo tipo/categoria (opcional)</label><input id="kp-prd-cat-nova" class="w-full h-10 px-3 rounded-xl border" placeholder="Se preencher aqui, será usado no lugar da lista"></div>
        <div><label class="block font-bold text-slate-600 mb-1">Descrição do Produto *</label><input id="kp-prd-nome" value="${html(p.nome || p.descricao || '')}" class="w-full h-10 px-3 rounded-xl border font-semibold" placeholder="Ex.: TONER HP 85A PRETO"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label class="block font-bold text-slate-600 mb-1">Fabricante / Marca</label><input id="kp-prd-fab" value="${html(p.fabricante || p.marca || '')}" class="w-full h-10 px-3 rounded-xl border"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Valor Venda R$ (auxiliar)</label><input id="kp-prd-preco" type="number" step="0.01" value="${toNumber(p.preco, 0)}" class="w-full h-10 px-3 rounded-xl border font-bold text-[#0a1e8a]"><p class="text-[11px] text-slate-400 mt-1">Vai como sugestão na venda, mas pode ser alterado na hora.</p></div>
        </div>
      </div>

      <div id="kp-prod-estoque" class="hidden space-y-4">
        <div class="rounded-xl bg-blue-50/70 border border-blue-200 p-3 text-[12px] text-blue-800 font-medium"><i class="ph ph-check-circle"></i> Controle de estoque sempre ligado. Aviso só aparece quando estoque fica abaixo do mínimo.</div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label class="block font-bold text-slate-600 mb-1">Estoque Atual</label><input id="kp-prd-est" type="number" value="${toNumber(p.estoque, 0)}" class="w-full h-10 px-3 rounded-xl border font-bold"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Estoque Mínimo</label><input id="kp-prd-min" type="number" value="${toNumber(p.estoqueMin, 0)}" class="w-full h-10 px-3 rounded-xl border"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Estoque Ideal</label><input id="kp-prd-ideal" type="number" value="${toNumber(p.estoqueIdeal, 0)}" class="w-full h-10 px-3 rounded-xl border"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label class="block font-bold text-slate-600 mb-1">Custo Total R$</label><input id="kp-prd-custo" type="number" step="0.01" value="${toNumber(p.custo, 0)}" class="w-full h-10 px-3 rounded-xl border"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Localização</label><input id="kp-prd-local" value="${html(p.local || '')}" class="w-full h-10 px-3 rounded-xl border" placeholder="Prateleira / Setor"></div>
        </div>
      </div>

      <div id="kp-prod-nf" class="hidden space-y-4">
        <div class="rounded-xl bg-slate-50 border p-3 text-[12px] text-slate-600">Campos deixados prontos para a parte fiscal.</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label class="block font-bold text-slate-600 mb-1">Origem do Produto</label><select id="kp-prd-origem" class="w-full h-10 px-3 rounded-xl border"><option>0 - Nacional, exceto as indicadas nos códigos 3 a 5</option><option>1 - Estrangeira - Importação direta</option><option>2 - Estrangeira - Adquirida no mercado interno</option></select></div>
          <div><label class="block font-bold text-slate-600 mb-1">Código NCM</label><input id="kp-prd-ncm" value="${html(normalizarNCM(p.ncm || ''))}" onblur="normalizarNCMProdutoOperacional()" class="w-full h-10 px-3 rounded-xl border font-mono" placeholder="0000.00.00"></div>
        </div>
      </div>
    </div>
  `, `
    <button onclick="fecharModalOperacional()" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button>
    <button onclick="salvarProdutoOperacional('${isEdit ? p.id : ''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>
  `, '760px');
  const origem = document.getElementById('kp-prd-origem');
  if(origem && p.origem) origem.value = p.origem;
};

window.mudarAbaProdutoOperacional = function(aba){
  ['dados', 'estoque', 'nf'].forEach(k => {
    document.getElementById('kp-prod-' + k)?.classList.toggle('hidden', k !== aba);
    const tab = document.getElementById('kp-tab-prod-' + k);
    if(tab){
      tab.classList.toggle('border-[#0a1e8a]', k === aba);
      tab.classList.toggle('text-[#0a1e8a]', k === aba);
      tab.classList.toggle('border-transparent', k !== aba);
    }
  });
};

window.normalizarNCMProdutoOperacional = function(){
  const el = document.getElementById('kp-prd-ncm');
  if(el) el.value = normalizarNCM(el.value);
};

window.salvarProdutoOperacional = function(id){
  const sess = getSess(); if(!sess) return;
  const nome = document.getElementById('kp-prd-nome')?.value?.trim() || '';
  if(!nome) return toastMsg('Informe a descrição do produto', 'error');
  const catNova = document.getElementById('kp-prd-cat-nova')?.value?.trim();
  const categoria = categoriaUnificada(catNova || document.getElementById('kp-prd-cat')?.value || 'Produto');
  const payload = {
    empresaId: sess.empresaId,
    sku: (id ? (document.getElementById('kp-prd-sku')?.value?.trim() || uidSafe('prd')) : consumirCodigoProduto(sess.empresaId)),
    nome,
    descricao: nome,
    categoria,
    fabricante: document.getElementById('kp-prd-fab')?.value?.trim() || '',
    estoque: toInt(document.getElementById('kp-prd-est')?.value, 0),
    estoqueMin: toInt(document.getElementById('kp-prd-min')?.value, 0),
    estoqueIdeal: toInt(document.getElementById('kp-prd-ideal')?.value, 0),
    custo: toNumber(document.getElementById('kp-prd-custo')?.value, 0),
    preco: toNumber(document.getElementById('kp-prd-preco')?.value, 0),
    local: document.getElementById('kp-prd-local')?.value?.trim() || '',
    ncm: normalizarNCM(document.getElementById('kp-prd-ncm')?.value || ''),
    origem: document.getElementById('kp-prd-origem')?.value || '0 - Nacional, exceto as indicadas nos códigos 3 a 5',
    status: 'ativo',
    controleEstoque: true
  };
  ['tipoCadastro', 'tipoProduto', 'promocao', 'precoPromocao', 'varejo', 'precoVarejo'].forEach(k => delete payload[k]);
  if(id){
    const existing = (db.produtos || []).find(p => p.id === id && p.empresaId === sess.empresaId);
    if(!existing) return toastMsg('Produto não encontrado', 'error');
    Object.assign(existing, payload, { atualizadoEm: new Date().toISOString(), atualizadoPorNome: sess.usuarioNome });
    ['tipoCadastro', 'tipoProduto', 'promocao', 'precoPromocao', 'varejo', 'precoVarejo'].forEach(k => delete existing[k]);
    logSafe('produto', 'editar', id, `Produto ${payload.sku} alterado por ${sess.usuarioNome}`);
  } else {
    const novo = { id: uidSafe('prd'), criadoEm: new Date().toISOString(), criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome, ...payload };
    db.produtos.push(novo);
    logSafe('produto', 'criar', novo.id, `Produto ${payload.sku} cadastrado por ${sess.usuarioNome}`);
  }
  saveSafe();
  fecharModal();
  window.renderProdutos();
  if(typeof renderAuditoria === 'function') renderAuditoria();
  toastMsg('Produto salvo com sucesso', 'success');
};

window.deleteProduto = function(id){
  const sess = getSess(); if(!sess) return;
  const p = (db.produtos || []).find(x => x.id === id && x.empresaId === sess.empresaId);
  if(!p) return toastMsg('Produto não encontrado', 'error');
  if(!confirm(`Excluir o produto ${produtoCodigo(p)} - ${p.nome || ''}?`)) return;
  db.produtos = (db.produtos || []).filter(x => !(x.id === id && x.empresaId === sess.empresaId));
  logSafe('produto', 'excluir', id, `Produto ${produtoCodigo(p)} excluído por ${sess.usuarioNome}`);
  saveSafe();
  window.renderProdutos();
  if(typeof renderAuditoria === 'function') renderAuditoria();
  toastMsg('Produto excluído', 'success');
};

function contratoClienteNome(c){
  return getCliente(c.clienteId)?.nome || c.clienteNome || 'Sem cliente';
}

function contratoAtivos(){
  const sess = getSess(); if(!sess) return [];
  return (db.contratos || []).filter(c => c.empresaId === sess.empresaId && c.status !== 'excluido');
}

window.aplicarBuscaContratosOperacional = function(){
  STATE.ctr.q = document.getElementById('search-contratos')?.value || '';
  STATE.ctr.status = document.getElementById('filter-contrato-status')?.value || '';
  window.renderContratos();
};

window.contratosSortOperacional = function(col){
  STATE.ctr.sort = col;
  window.renderContratos();
};

window.renderContratos = function(){
  const sess = getSess();
  if(!sess || sectionHidden('view-contratos')) return;
  const view = document.getElementById('view-contratos');
  if(!view) return;
  const q = filtroBusca(STATE.ctr.q);
  let list = contratoAtivos();
  if(STATE.ctr.status) list = list.filter(c => c.status === STATE.ctr.status);
  if(q){
    list = list.filter(c => [c.numero, contratoClienteNome(c), c.status].some(v => normalizeText(v).includes(q)));
  }
  const sorters = {
    codigo: c => c.numero || '',
    cliente: c => contratoClienteNome(c),
    inicio: c => c.dataInicio || '',
    fim: c => c.dataFim || '',
    valor: c => toNumber(c.valorMensalFixo),
    impressoras: c => (db.parque || []).filter(p => p.contratoId === c.id && p.status === 'ativo').length,
    chamados: c => (db.os || []).filter(o => o.clienteId === c.clienteId && o.status !== 'concluido' && o.status !== 'cancelado').length,
    status: c => c.status || ''
  };
  list = sortAsc(list, sorters[STATE.ctr.sort] || sorters.codigo);
  const mensalidade = contratoAtivos().filter(c => c.status === 'ativo').reduce((s, c) => s + toNumber(c.valorMensalFixo), 0);
  view.innerHTML = `
    <div class="space-y-4">
      <div class="flex flex-wrap justify-between gap-3 items-center">
        <div class="flex gap-2"><button onclick="openModal('contrato')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13.5px] font-semibold shadow"><i class="ph ph-plus mr-1"></i>Novo contrato</button></div>
        <div class="flex flex-wrap gap-2 items-center">
          <select id="filter-contrato-status" onchange="aplicarBuscaContratosOperacional()" class="h-10 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todos status</option><option value="ativo" ${STATE.ctr.status==='ativo'?'selected':''}>Ativo</option><option value="pendente" ${STATE.ctr.status==='pendente'?'selected':''}>Pendente</option><option value="vencido" ${STATE.ctr.status==='vencido'?'selected':''}>Vencido</option><option value="encerrado" ${STATE.ctr.status==='encerrado'?'selected':''}>Encerrado</option></select>
          <input id="search-contratos" value="${html(STATE.ctr.q)}" placeholder="Número ou cliente..." class="h-10 px-4 rounded-xl bg-white border text-[13px] w-[280px]">
          ${botaoBusca('aplicarBuscaContratosOperacional()')}
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Contratos</p><p class="text-[22px] font-extrabold">${contratoAtivos().length}</p></div>
        <div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Ativos</p><p class="text-[22px] font-extrabold text-emerald-700">${contratoAtivos().filter(c => c.status === 'ativo').length}</p></div>
        <div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Mensalidade</p><p class="text-[20px] font-extrabold text-[#0a1e8a]">${money(mensalidade)}</p></div>
        <div class="rounded-[14px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Como abrir</p><p class="text-[13px] font-bold text-slate-700 mt-1">Dê duplo clique no cliente</p></div>
      </div>
      <div class="rounded-[16px] bg-white border shadow-sm overflow-hidden">
        <div class="overflow-auto max-h-[690px]">
          <table class="w-full text-left text-[13px]">
            <thead class="sticky top-0 bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr>
              ${thSort('contratosSortOperacional', 'codigo', 'Código', STATE.ctr.sort)}
              ${thSort('contratosSortOperacional', 'cliente', 'Cliente', STATE.ctr.sort)}
              ${thSort('contratosSortOperacional', 'inicio', 'Início', STATE.ctr.sort)}
              ${thSort('contratosSortOperacional', 'fim', 'Fim', STATE.ctr.sort)}
              ${thSort('contratosSortOperacional', 'impressoras', 'Impressoras', STATE.ctr.sort)}
              ${thSort('contratosSortOperacional', 'chamados', 'Chamados', STATE.ctr.sort)}
              ${thSort('contratosSortOperacional', 'valor', 'Valor', STATE.ctr.sort)}
              ${thSort('contratosSortOperacional', 'status', 'Status', STATE.ctr.sort)}
              <th class="px-4 py-2.5 text-right">Excluir</th>
            </tr></thead>
            <tbody class="divide-y">
              ${list.map(c => {
                const impressoras = (db.parque || []).filter(p => p.contratoId === c.id && p.status === 'ativo').length;
                const chamados = (db.os || []).filter(o => o.clienteId === c.clienteId && o.status !== 'concluido' && o.status !== 'cancelado').length;
                return `<tr ondblclick="openContratoCompleto('${c.id}')" class="hover:bg-blue-50/50 cursor-pointer">
                  <td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">${html(c.numero || '')}</td>
                  <td class="px-4 py-2.5"><p class="font-semibold">${html(contratoClienteNome(c))}</p><p class="text-[11px] text-slate-500">Duplo clique para abrir</p></td>
                  <td class="px-4 py-2.5">${dateBR(c.dataInicio)}</td>
                  <td class="px-4 py-2.5">${dateBR(c.dataFim)}</td>
                  <td class="px-4 py-2.5 font-bold">${impressoras}</td>
                  <td class="px-4 py-2.5 ${chamados ? 'font-bold text-amber-700' : ''}">${chamados}</td>
                  <td class="px-4 py-2.5 font-bold">${money(c.valorMensalFixo || 0)}</td>
                  <td class="px-4 py-2.5"><span class="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold uppercase">${html(c.status || 'ativo')}</span></td>
                  <td class="px-4 py-2.5 text-right"><button onclick="event.stopPropagation(); excluirContratoOperacional('${c.id}')" class="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Excluir"><i class="ph ph-trash"></i></button></td>
                </tr>`;
              }).join('') || '<tr><td colspan="9" class="p-12 text-center text-slate-500">Nenhum contrato encontrado</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  bindBuscaEnter('search-contratos', 'aplicarBuscaContratosOperacional');
};

window.renderModalContrato = function(id){
  const sess = getSess(); if(!sess) return;
  const isEdit = !!id;
  const c = isEdit ? getContrato(id) : {
    numero: 'CT-' + new Date().getFullYear() + '-' + String((db.contratos || []).filter(x => x.empresaId === sess.empresaId).length + 1).padStart(4, '0'),
    clienteId: '', dataInicio: new Date().toISOString().slice(0, 10),
    dataFim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    diaVencimento: 10, franquiaPB: 0, franquiaCor: 0, valorMensalFixo: 0, valorExcedentePB: 0, status: 'ativo'
  };
  const clientes = (db.clientes || []).filter(cl => cl.empresaId === sess.empresaId && cl.status !== 'inativo')
    .sort((a, b) => compareSmart(a.nome, b.nome))
    .map(cl => `<option value="${cl.id}" ${cl.id === c.clienteId ? 'selected' : ''}>${html(cl.nome)}</option>`).join('');
  setModal(isEdit ? 'Alterar contrato' : 'Novo contrato', `
    <div class="space-y-4 text-[13px]">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><label class="block font-bold text-slate-600 mb-1">Número</label><input id="kc-num" value="${html(c.numero || '')}" class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold"></div>
        <div class="md:col-span-2"><label class="block font-bold text-slate-600 mb-1">Cliente</label><select id="kc-cli" class="w-full h-10 px-3 rounded-xl border"><option value="">Selecione</option>${clientes}</select></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div><label class="block font-bold text-slate-600 mb-1">Data início</label><input id="kc-ini" type="date" value="${String(c.dataInicio || '').slice(0, 10)}" class="w-full h-10 px-3 rounded-xl border"></div>
        <div><label class="block font-bold text-slate-600 mb-1">Data fim</label><input id="kc-fim" type="date" value="${String(c.dataFim || '').slice(0, 10)}" class="w-full h-10 px-3 rounded-xl border"></div>
        <div><label class="block font-bold text-slate-600 mb-1">Dia venc.</label><input id="kc-venc" type="number" value="${toInt(c.diaVencimento, 10)}" class="w-full h-10 px-3 rounded-xl border"></div>
        <div><label class="block font-bold text-slate-600 mb-1">Status</label><select id="kc-status" class="w-full h-10 px-3 rounded-xl border"><option value="ativo">Ativo</option><option value="pendente">Pendente</option><option value="encerrado">Encerrado</option><option value="vencido">Vencido</option></select></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div><label class="block font-bold text-slate-600 mb-1">Franquia Global PB</label><input id="kc-fpb" type="number" value="${toNumber(c.franquiaPB, 0)}" class="w-full h-10 px-3 rounded-xl border"></div>
        <div><label class="block font-bold text-slate-600 mb-1">Franquia Global Cor</label><input id="kc-fcor" type="number" value="${toNumber(c.franquiaCor, 0)}" class="w-full h-10 px-3 rounded-xl border"></div>
        <div><label class="block font-bold text-slate-600 mb-1">Valor mensal R$</label><input id="kc-vfix" type="number" step="0.01" value="${toNumber(c.valorMensalFixo, 0)}" class="w-full h-10 px-3 rounded-xl border font-bold text-[#0a1e8a]"></div>
        <div><label class="block font-bold text-slate-600 mb-1">Valor página PB R$</label><input id="kc-vpb" type="number" step="0.001" value="${toNumber(c.valorExcedentePB, 0)}" class="w-full h-10 px-3 rounded-xl border font-bold text-emerald-700"></div>
      </div>
    </div>
  `, `<button onclick="fecharModalOperacional()" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button><button onclick="salvarContratoOperacional('${isEdit ? c.id : ''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar contrato</button>`, '760px');
  const st = document.getElementById('kc-status'); if(st) st.value = c.status || 'ativo';
};

window.salvarContratoOperacional = function(id){
  const sess = getSess(); if(!sess) return;
  const clienteId = document.getElementById('kc-cli')?.value || '';
  if(!clienteId) return toastMsg('Selecione o cliente do contrato', 'error');
  const payload = {
    empresaId: sess.empresaId,
    numero: document.getElementById('kc-num')?.value?.trim() || uidSafe('ct'),
    clienteId,
    dataInicio: document.getElementById('kc-ini')?.value || new Date().toISOString().slice(0, 10),
    dataFim: document.getElementById('kc-fim')?.value || '',
    diaVencimento: toInt(document.getElementById('kc-venc')?.value, 10),
    franquiaPB: toInt(document.getElementById('kc-fpb')?.value, 0),
    franquiaCor: toInt(document.getElementById('kc-fcor')?.value, 0),
    valorMensalFixo: toNumber(document.getElementById('kc-vfix')?.value, 0),
    valorExcedentePB: toNumber(document.getElementById('kc-vpb')?.value, 0),
    status: document.getElementById('kc-status')?.value || 'ativo'
  };
  if(id){
    const c = getContrato(id); if(!c) return toastMsg('Contrato não encontrado', 'error');
    Object.assign(c, payload, { atualizadoEm: new Date().toISOString(), atualizadoPorNome: sess.usuarioNome });
    logSafe('contrato', 'editar', id, `Contrato ${payload.numero} alterado por ${sess.usuarioNome}`);
  } else {
    const novo = { id: uidSafe('ctr'), criadoEm: new Date().toISOString(), criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome, ...payload };
    db.contratos.push(novo);
    logSafe('contrato', 'criar', novo.id, `Contrato ${novo.numero} criado por ${sess.usuarioNome}`);
    id = novo.id;
  }
  saveSafe();
  fecharModal();
  window.renderContratos();
  toastMsg('Contrato salvo', 'success');
  window.openContratoCompleto(id);
};

window.excluirContratoOperacional = function(id){
  const sess = getSess(); if(!sess) return;
  const c = getContrato(id); if(!c) return;
  if(!confirm(`Excluir o contrato ${c.numero}?`)) return;
  c.status = 'excluido';
  (db.parque || []).forEach(p => { if(p.contratoId === id) p.status = 'inativo'; });
  logSafe('contrato', 'excluir', id, `Contrato ${c.numero} excluído por ${sess.usuarioNome}`);
  saveSafe();
  window.renderContratos();
  toastMsg('Contrato excluído', 'success');
};

function estoqueTonerResumo(sess){
  return (db.produtos || []).filter(p => p.empresaId === sess.empresaId && p.status !== 'inativo' && /TONER|CARTUCHO|INSUMO/i.test(`${p.nome || ''} ${p.categoria || ''}`))
    .reduce((s, p) => s + toNumber(p.estoque, 0), 0);
}

window.openContratoCompleto = function(contratoId){
  const sess = getSess(); if(!sess) return;
  const c = getContrato(contratoId);
  if(!c || c.empresaId !== sess.empresaId) return toastMsg('Contrato não encontrado', 'error');
  const cli = getCliente(c.clienteId) || {};
  const maquinas = (db.parque || []).filter(p => p.contratoId === c.id && p.status === 'ativo');
  const chamadosAbertos = (db.os || []).filter(o => o.clienteId === c.clienteId && o.status !== 'concluido' && o.status !== 'cancelado').length;
  const leiturasCount = (db.leituras || []).filter(l => l.contratoId === c.id).length;
  setModal(`Contrato de Locação — ${c.numero}`, `
    <div class="space-y-5 text-[13px]">
      <div class="rounded-[18px] bg-[#0a1e8a] text-white p-5 flex flex-col md:flex-row justify-between gap-4">
        <div><p class="text-[11px] uppercase font-bold text-white/70">Cliente</p><h3 class="text-[20px] font-extrabold mt-1">${html(cli.nome || 'Sem cliente')}</h3><p class="text-[12px] text-white/80 mt-1">${html(cli.documento || '')} • ${html(cli.cidade || '')}/${html(cli.estado || '')}</p></div>
        <div class="text-right"><p class="text-[11px] uppercase font-bold text-white/70">Vigência</p><p class="font-bold text-[15px] mt-1">${dateBR(c.dataInicio)} até ${dateBR(c.dataFim)}</p><p class="text-[11px] text-white/80 mt-1">Status: <b>${html(c.status || 'ativo')}</b></p></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-[16px] border bg-emerald-50 border-emerald-200 p-4"><p class="text-[11px] font-bold uppercase text-emerald-800">Impressoras Alocadas</p><p class="text-[26px] font-extrabold text-emerald-700 mt-1">${maquinas.length}</p></div>
        <div class="rounded-[16px] border bg-amber-50 border-amber-200 p-4"><p class="text-[11px] font-bold uppercase text-amber-800">Chamados Abertos</p><p class="text-[26px] font-extrabold text-amber-700 mt-1">${chamadosAbertos}</p></div>
        <div class="rounded-[16px] border bg-blue-50 border-blue-200 p-4"><p class="text-[11px] font-bold uppercase text-blue-800">Valor Mensal</p><p class="text-[22px] font-extrabold text-blue-700 mt-1">${money(c.valorMensalFixo || 0)}</p></div>
        <div class="rounded-[16px] border bg-purple-50 border-purple-200 p-4"><p class="text-[11px] font-bold uppercase text-purple-800">Estoque Toner</p><p class="text-[26px] font-extrabold text-purple-700 mt-1">${estoqueTonerResumo(sess)}</p></div>
      </div>
      <div class="flex flex-wrap gap-3">
        <button onclick="abrirLeiturasContrato('${c.id}')" class="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2"><i class="ph ph-speedometer"></i> Leituras</button>
        <button onclick="abrirChamadosContrato('${c.id}')" class="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2"><i class="ph ph-wrench"></i> Chamados</button>
        <button onclick="abrirModalEquipamentoContrato('${c.id}', null)" class="h-11 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold flex items-center gap-2 ml-auto"><i class="ph ph-printer"></i> Nova Impressora</button>
        <button onclick="imprimirContratoLocacaoOperacional('${c.id}', 'contrato')" class="h-11 px-4 rounded-xl bg-white border font-bold text-[12px]"><i class="ph ph-file-pdf"></i> Contrato PDF</button>
        <button onclick="imprimirContratoLocacaoOperacional('${c.id}', 'proposta')" class="h-11 px-4 rounded-xl bg-white border font-bold text-[12px]"><i class="ph ph-file-pdf"></i> Proposta PDF</button>
      </div>
      <div class="border-b flex gap-6 font-bold text-[13px] text-slate-500">
        <button type="button" onclick="mudarAbaContratoOperacional('dados')" id="kc-tab-dados" class="pb-2 border-b-2 border-[#0a1e8a] text-[#0a1e8a]">Dados</button>
        <button type="button" onclick="mudarAbaContratoOperacional('contato')" id="kc-tab-contato" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Contato</button>
        <button type="button" onclick="mudarAbaContratoOperacional('endereco')" id="kc-tab-endereco" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Endereço</button>
        <button type="button" onclick="mudarAbaContratoOperacional('impressoras')" id="kc-tab-impressoras" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Impressoras (${maquinas.length})</button>
      </div>
      <div id="kc-painel-dados" class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><label class="block font-bold text-slate-600 mb-1">Número</label><input id="kc-full-num" value="${html(c.numero || '')}" class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Início</label><input id="kc-full-ini" type="date" value="${String(c.dataInicio || '').slice(0, 10)}" class="w-full h-10 px-3 rounded-xl border"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Fim</label><input id="kc-full-fim" type="date" value="${String(c.dataFim || '').slice(0, 10)}" class="w-full h-10 px-3 rounded-xl border"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Status</label><select id="kc-full-status" class="w-full h-10 px-3 rounded-xl border"><option value="ativo">Ativo</option><option value="pendente">Pendente</option><option value="encerrado">Encerrado</option><option value="vencido">Vencido</option></select></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><label class="block font-bold text-slate-600 mb-1">Franquia Global PB</label><input id="kc-full-fpb" type="number" value="${toNumber(c.franquiaPB, 0)}" class="w-full h-10 px-3 rounded-xl border"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Franquia Global Cor</label><input id="kc-full-fcor" type="number" value="${toNumber(c.franquiaCor, 0)}" class="w-full h-10 px-3 rounded-xl border"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Valor Mensal</label><input id="kc-full-vfix" type="number" step="0.01" value="${toNumber(c.valorMensalFixo, 0)}" class="w-full h-10 px-3 rounded-xl border font-bold text-[#0a1e8a]"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Valor Página PB</label><input id="kc-full-vpb" type="number" step="0.001" value="${toNumber(c.valorExcedentePB, 0)}" class="w-full h-10 px-3 rounded-xl border font-bold text-emerald-700"></div>
        </div>
      </div>
      <div id="kc-painel-contato" class="hidden space-y-3"><div class="grid grid-cols-1 md:grid-cols-3 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Contato</label><input id="kc-full-contato" value="${html(cli.contato || '')}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Telefone</label><input id="kc-full-fone" value="${html(cli.telefone || '')}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">E-mail</label><input id="kc-full-email" value="${html(cli.email || '')}" class="w-full h-10 px-3 rounded-xl border"></div></div></div>
      <div id="kc-painel-endereco" class="hidden space-y-3"><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><div><label class="block font-bold text-slate-600 mb-1">CEP</label><div class="flex gap-1"><input id="kc-full-cep" value="${html(cli.cep || '')}" class="w-full h-10 px-3 rounded-xl border"><button type="button" onclick="buscarCepContratoOperacional()" class="h-10 px-3 rounded-xl bg-slate-100"><i class="ph ph-magnifying-glass"></i></button></div></div><div class="md:col-span-2"><label class="block font-bold text-slate-600 mb-1">Endereço</label><input id="kc-full-end" value="${html(cli.endereco || '')}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Número</label><input id="kc-full-numend" value="${html(cli.numero || '')}" class="w-full h-10 px-3 rounded-xl border"></div></div><div class="grid grid-cols-1 md:grid-cols-3 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Bairro</label><input id="kc-full-bairro" value="${html(cli.bairro || '')}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Cidade</label><input id="kc-full-cid" value="${html(cli.cidade || '')}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">UF</label><input id="kc-full-uf" value="${html(cli.estado || '')}" class="w-full h-10 px-3 rounded-xl border"></div></div></div>
      <div id="kc-painel-impressoras" class="hidden space-y-3">
        <div class="flex justify-between items-center"><p class="font-bold text-slate-700">Impressoras cadastradas neste cliente</p><button onclick="abrirModalEquipamentoContrato('${c.id}', null)" class="h-9 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]">+ Nova Impressora</button></div>
        <div class="overflow-auto max-h-[360px] border rounded-xl"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr><th class="px-4 py-2.5">Patrimônio / Série</th><th class="px-4 py-2.5">Modelo</th><th class="px-4 py-2.5">Departamento / Local</th><th class="px-4 py-2.5">Contador PB</th><th class="px-4 py-2.5">Modalidade</th><th class="px-4 py-2.5 text-right">Ação</th></tr></thead><tbody class="divide-y">${maquinas.map(m => { const eq = getEquipamento(m.equipamentoId) || {}; return `<tr ondblclick="abrirModalEquipamentoContrato('${c.id}','${m.id}')" class="hover:bg-slate-50 cursor-pointer"><td class="px-4 py-2.5"><p class="font-bold font-mono">${html(eq.patrimonio || '-')}</p><p class="text-[11px] text-slate-500 font-mono">${html(eq.serie || '')}</p></td><td class="px-4 py-2.5 font-semibold">${html(eq.modelo || '')}</td><td class="px-4 py-2.5"><p>${html(m.setor || 'Geral')}</p><p class="text-[11px] text-slate-500">${html(m.localInstalacao || '')}</p></td><td class="px-4 py-2.5 font-mono font-bold">${toNumber(eq.contadorPB, 0).toLocaleString('pt-BR')}</td><td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold uppercase">${html(m.modalidade || 'global')}</span></td><td class="px-4 py-2.5 text-right"><button onclick="abrirModalEquipamentoContrato('${c.id}','${m.id}')" class="w-8 h-8 rounded-lg hover:bg-slate-100" title="Editar"><i class="ph ph-pencil"></i></button></td></tr>`; }).join('') || '<tr><td colspan="6" class="p-8 text-center text-slate-400">Nenhuma impressora ativa</td></tr>'}</tbody></table></div>
      </div>
    </div>
  `, `<button onclick="fecharModalOperacional()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button><button onclick="salvarContratoCompletoOperacional('${c.id}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Contrato</button>`, '1040px');
  const st = document.getElementById('kc-full-status'); if(st) st.value = c.status || 'ativo';
};

window.mudarAbaContratoOperacional = function(aba){
  ['dados', 'contato', 'endereco', 'impressoras'].forEach(k => {
    document.getElementById('kc-painel-' + k)?.classList.toggle('hidden', k !== aba);
    const tab = document.getElementById('kc-tab-' + k);
    if(tab){
      tab.classList.toggle('border-[#0a1e8a]', k === aba);
      tab.classList.toggle('text-[#0a1e8a]', k === aba);
      tab.classList.toggle('border-transparent', k !== aba);
    }
  });
};

window.buscarCepContratoOperacional = function(){
  if(typeof getCepCliente === 'function') getCepCliente(document.getElementById('kc-full-cep')?.value, 'kc-full-end', 'kc-full-bairro', 'kc-full-cid', 'kc-full-uf');
};

window.salvarContratoCompletoOperacional = function(id){
  const sess = getSess(); if(!sess) return;
  const c = getContrato(id); if(!c) return;
  c.numero = document.getElementById('kc-full-num')?.value?.trim() || c.numero;
  c.dataInicio = document.getElementById('kc-full-ini')?.value || c.dataInicio;
  c.dataFim = document.getElementById('kc-full-fim')?.value || c.dataFim;
  c.status = document.getElementById('kc-full-status')?.value || c.status;
  c.franquiaPB = toInt(document.getElementById('kc-full-fpb')?.value, 0);
  c.franquiaCor = toInt(document.getElementById('kc-full-fcor')?.value, 0);
  c.valorMensalFixo = toNumber(document.getElementById('kc-full-vfix')?.value, 0);
  c.valorExcedentePB = toNumber(document.getElementById('kc-full-vpb')?.value, 0);
  const cli = getCliente(c.clienteId);
  if(cli){
    cli.contato = document.getElementById('kc-full-contato')?.value?.trim() || cli.contato || '';
    cli.telefone = document.getElementById('kc-full-fone')?.value?.trim() || cli.telefone || '';
    cli.email = document.getElementById('kc-full-email')?.value?.trim() || cli.email || '';
    cli.cep = document.getElementById('kc-full-cep')?.value?.trim() || cli.cep || '';
    cli.endereco = document.getElementById('kc-full-end')?.value?.trim() || cli.endereco || '';
    cli.numero = document.getElementById('kc-full-numend')?.value?.trim() || cli.numero || '';
    cli.bairro = document.getElementById('kc-full-bairro')?.value?.trim() || cli.bairro || '';
    cli.cidade = document.getElementById('kc-full-cid')?.value?.trim() || cli.cidade || '';
    cli.estado = document.getElementById('kc-full-uf')?.value?.trim() || cli.estado || '';
  }
  c.atualizadoEm = new Date().toISOString();
  c.atualizadoPorNome = sess.usuarioNome;
  logSafe('contrato', 'editar_completo', c.id, `Contrato ${c.numero} salvo por ${sess.usuarioNome}`);
  saveSafe();
  toastMsg('Contrato salvo', 'success');
  window.openContratoCompleto(c.id);
  window.renderContratos();
};

function deptOptions(){
  return [...new Set((db.parque || []).map(p => p.setor).filter(Boolean))].sort(compareSmart).map(v => `<option value="${html(v)}"></option>`).join('');
}
function localOptions(){
  return [...new Set((db.parque || []).map(p => p.localInstalacao || p.enderecoInstalacao).filter(Boolean))].sort(compareSmart).map(v => `<option value="${html(v)}"></option>`).join('');
}

window.abrirModalEquipamentoContrato = function(contratoId, parqueId){
  const sess = getSess(); if(!sess) return;
  const c = getContrato(contratoId); if(!c) return;
  const isEdit = !!parqueId;
  const p = isEdit ? getParque(parqueId) : { id: '', contratoId: c.id, clienteId: c.clienteId, equipamentoId: null, setor: '', localInstalacao: '', modalidade: 'global', franquiaPB: 0, valorExcedentePB: c.valorExcedentePB || 0, status: 'ativo' };
  const eq = p.equipamentoId ? getEquipamento(p.equipamentoId) : null;
  const contadorInicial = eq && eq.contadorPB !== undefined ? String(eq.contadorPB) : '';
  setModal(isEdit ? 'Alterar impressora do contrato' : 'Nova impressora no contrato', `
    <div class="space-y-4 text-[13px]">
      <datalist id="kp-dept-list">${deptOptions()}</datalist><datalist id="kp-local-list">${localOptions()}</datalist>
      <div class="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <label class="block font-bold text-blue-900 mb-1">Digite o Serial ou Patrimônio</label>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <input id="ki-busca" value="${html(eq ? (eq.serie || eq.patrimonio || '') : '')}" class="md:col-span-6 h-10 px-3 rounded-xl border font-mono font-bold uppercase" placeholder="Serial ou patrimônio">
          <label class="md:col-span-2 h-10 px-3 rounded-xl bg-white border flex items-center gap-2 font-semibold"><input type="radio" name="ki-tipo-chave" value="serial" ${!eq || eq.serie ? 'checked' : ''}> Serial</label>
          <label class="md:col-span-2 h-10 px-3 rounded-xl bg-white border flex items-center gap-2 font-semibold"><input type="radio" name="ki-tipo-chave" value="patrimonio" ${eq && !eq.serie ? 'checked' : ''}> Patrimônio</label>
          <button type="button" onclick="reconhecerImpressoraContrato()" class="md:col-span-2 h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i> Buscar</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><label class="block font-bold text-slate-600 mb-1">Modelo da Impressora *</label><input id="ki-modelo" value="${html(eq?.modelo || '')}" class="w-full h-10 px-3 rounded-xl border font-bold"></div>
        <div><label class="block font-bold text-slate-600 mb-1">Patrimônio</label><input id="ki-patr" value="${html(eq?.patrimonio || '')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div>
        <div><label class="block font-bold text-slate-600 mb-1">Número de Série</label><input id="ki-serie" value="${html(eq?.serie || '')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><label class="block font-bold text-slate-600 mb-1">Departamento</label><input id="ki-dept" list="kp-dept-list" value="${html(p.setor || '')}" class="w-full h-10 px-3 rounded-xl border" placeholder="Escolha ou digite novo"></div>
        <div><label class="block font-bold text-slate-600 mb-1">Local</label><input id="ki-local" list="kp-local-list" value="${html(p.localInstalacao || p.enderecoInstalacao || '')}" class="w-full h-10 px-3 rounded-xl border" placeholder="Escolha ou digite novo"></div>
      </div>
      <div class="border rounded-xl overflow-hidden">
        <div class="bg-slate-50 border-b flex flex-wrap gap-0 text-[12px] font-bold"><button class="px-4 py-2 bg-white text-[#0a1e8a] border-r">Preto A4</button><button class="px-4 py-2 text-slate-400 border-r" title="Pronto para etapa futura">Color A4</button><button class="px-4 py-2 text-slate-400 border-r" title="Pronto para etapa futura">Scanner</button><button class="px-4 py-2 text-slate-400 border-r" title="Pronto para etapa futura">Preto A3</button><button class="px-4 py-2 text-slate-400" title="Pronto para etapa futura">Color A3</button></div>
        <div class="p-4 space-y-3">
          <div class="flex flex-wrap gap-4 bg-slate-50 border rounded-xl p-3 font-semibold text-[13px]">
            <label class="flex items-center gap-2"><input type="radio" name="ki-modalidade" value="global" ${p.modalidade === 'global' ? 'checked' : ''}> Global</label>
            <label class="flex items-center gap-2"><input type="radio" name="ki-modalidade" value="individual" ${p.modalidade === 'individual' ? 'checked' : ''}> Individual</label>
            <label class="flex items-center gap-2"><input type="radio" name="ki-modalidade" value="impressao" ${p.modalidade === 'impressao' ? 'checked' : ''}> Por Impressão</label>
            <label class="flex items-center gap-2"><input type="radio" name="ki-modalidade" value="mes_fixo" ${p.modalidade === 'mes_fixo' ? 'checked' : ''}> Mês Fixo</label>
            <label class="flex items-center gap-2 text-slate-500"><input type="radio" name="ki-modalidade" value="inativo" ${p.status === 'inativo' ? 'checked' : ''}> Inativo (Ocultar)</label>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label class="block font-bold text-slate-600 mb-1">Cont. Ant. Preto A4</label><input id="ki-cont-ant" type="number" value="${html(contadorInicial)}" class="w-full h-10 px-3 rounded-xl border font-mono font-bold text-[#0a1e8a]" placeholder="Digite 0 se começar em zero"><p class="text-[11px] text-slate-400 mt-1">0 é válido; vazio não grava contador.</p></div>
            <div><label class="block font-bold text-slate-600 mb-1">Franquia Individual</label><input id="ki-franq" type="number" value="${toNumber(p.franquiaPB, 0)}" class="w-full h-10 px-3 rounded-xl border"></div>
            <div><label class="block font-bold text-slate-600 mb-1">Valor Excedente / Página</label><input id="ki-val-exc" type="number" step="0.001" value="${toNumber(p.valorExcedentePB, c.valorExcedentePB || 0)}" class="w-full h-10 px-3 rounded-xl border font-bold text-emerald-700"></div>
          </div>
        </div>
      </div>
    </div>
  `, `<button onclick="openContratoCompleto('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button><button onclick="salvarImpressoraContrato('${c.id}','${isEdit ? p.id : ''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Impressora</button>`, '820px');
  bindBuscaEnter('ki-busca', 'reconhecerImpressoraContrato');
};

window.reconhecerImpressoraContrato = function(){
  const sess = getSess(); if(!sess) return;
  const chave = document.getElementById('ki-busca')?.value?.trim() || '';
  if(!chave) return toastMsg('Digite o serial ou patrimônio para buscar', 'info');
  const up = normalizeText(chave);
  const eq = (db.equipamentos || []).find(e => e.empresaId === sess.empresaId && ((e.serie && normalizeText(e.serie) === up) || (e.patrimonio && normalizeText(e.patrimonio) === up)));
  const tipo = document.querySelector('input[name="ki-tipo-chave"]:checked')?.value || 'serial';
  if(eq){
    document.getElementById('ki-modelo').value = eq.modelo || '';
    document.getElementById('ki-patr').value = eq.patrimonio || '';
    document.getElementById('ki-serie').value = eq.serie || '';
    const ultParque = ultimoParqueDoEquipamento(eq.id) || {};
    document.getElementById('ki-dept').value = ultParque.setor || '';
    document.getElementById('ki-local').value = ultParque.localInstalacao || ultParque.enderecoInstalacao || '';
    document.getElementById('ki-cont-ant').value = ultimoContadorPreto(db, eq.id).valor;
    toastMsg('Impressora reconhecida e preenchida', 'success');
  } else {
    if(tipo === 'serial') document.getElementById('ki-serie').value = chave;
    else document.getElementById('ki-patr').value = chave;
    toastMsg('Não encontrei essa impressora. Preencha o restante para cadastrar agora.', 'info');
  }
};

window.salvarImpressoraContrato = function(contratoId, parqueId){
  const sess = getSess(); if(!sess) return;
  const c = getContrato(contratoId); if(!c) return;
  const modelo = document.getElementById('ki-modelo')?.value?.trim() || '';
  if(!modelo) return toastMsg('Informe o modelo da impressora', 'error');
  const serie = document.getElementById('ki-serie')?.value?.trim() || '';
  const patrimonio = document.getElementById('ki-patr')?.value?.trim() || serie || uidSafe('pat');
  const counterRaw = document.getElementById('ki-cont-ant')?.value;
  const hasCounter = counterRaw !== null && counterRaw !== undefined && String(counterRaw).trim() !== '';
  const contador = hasCounter ? toNumber(counterRaw, 0) : null;
  let eq = (db.equipamentos || []).find(e => e.empresaId === sess.empresaId && ((serie && e.serie === serie) || (patrimonio && e.patrimonio === patrimonio)));
  if(!eq){
    eq = { id: uidSafe('eq'), empresaId: sess.empresaId, modelo, serie, patrimonio, contadorPB: hasCounter ? contador : 0, contadorCor: 0, status: 'locado', criadoEm: new Date().toISOString(), criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome };
    db.equipamentos.push(eq);
  } else {
    eq.modelo = modelo;
    eq.serie = serie || eq.serie;
    eq.patrimonio = patrimonio || eq.patrimonio;
    if(hasCounter) eq.contadorPB = contador;
    eq.status = 'locado';
    eq.atualizadoEm = new Date().toISOString();
  }
  const modalidadeSel = document.querySelector('input[name="ki-modalidade"]:checked')?.value || 'global';
  const status = modalidadeSel === 'inativo' ? 'inativo' : 'ativo';
  const payloadParque = {
    empresaId: sess.empresaId,
    contratoId: c.id,
    clienteId: c.clienteId,
    equipamentoId: eq.id,
    setor: document.getElementById('ki-dept')?.value?.trim() || 'Geral',
    localInstalacao: document.getElementById('ki-local')?.value?.trim() || '',
    modalidade: modalidadeSel === 'inativo' ? 'global' : modalidadeSel,
    franquiaPB: toInt(document.getElementById('ki-franq')?.value, 0),
    valorExcedentePB: toNumber(document.getElementById('ki-val-exc')?.value, c.valorExcedentePB || 0),
    status,
    atualizadoEm: new Date().toISOString()
  };
  if(hasCounter) payloadParque.contadorInicialPB = contador;
  if(parqueId){
    const p = getParque(parqueId); if(p) Object.assign(p, payloadParque);
  } else {
    db.parque.push({ id: uidSafe('prq'), dataInstalacao: new Date().toISOString(), criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome, ...payloadParque });
  }
  logSafe('contrato', 'salvar_impressora', c.id, `Impressora ${modelo} salva por ${sess.usuarioNome}`);
  saveSafe();
  toastMsg('Impressora salva no contrato', 'success');
  window.openContratoCompleto(c.id);
  if(typeof renderContratos === 'function') window.renderContratos();
};

function leiturasContrato(contratoId){
  return (db.leituras || []).filter(l => l.contratoId === contratoId).sort((a, b) => new Date(b.dataLeitura || 0) - new Date(a.dataLeitura || 0));
}

window.abrirLeiturasContrato = function(contratoId){
  const c = getContrato(contratoId); if(!c) return;
  const cli = getCliente(c.clienteId) || {};
  const leituras = leiturasContrato(c.id);
  const totalUtil = leituras.reduce((s, l) => s + toNumber(l.consumoPB, 0), 0);
  const totalExc = leituras.reduce((s, l) => s + toNumber(l.valorExcedente, 0), 0);
  setModal(`Leituras — Contrato ${c.numero}`, `
    <div class="space-y-4 text-[13px]">
      <div class="flex flex-wrap justify-between items-center gap-3 bg-slate-50 p-3 rounded-xl border">
        <div class="flex flex-wrap gap-2">
          <button onclick="abrirEditorLeituraContrato('${c.id}')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-plus-circle"></i> Novo</button>
          <button onclick="imprimirRelatorioLeiturasPDF('${c.id}')" class="h-10 px-5 rounded-xl bg-slate-900 text-white font-bold"><i class="ph ph-printer"></i> Imprimir</button>
        </div>
        <div class="flex gap-4 text-right"><div><p class="text-[11px] text-slate-500 font-bold uppercase">Utilizado</p><p class="font-extrabold text-[16px]">${totalUtil} pág</p></div><div><p class="text-[11px] text-slate-500 font-bold uppercase">Excedente</p><p class="font-extrabold text-[16px] text-emerald-700">${money(totalExc)}</p></div></div>
      </div>
      <div class="overflow-auto max-h-[480px] border rounded-xl"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500 sticky top-0"><tr><th class="px-4 py-3">Data</th><th class="px-4 py-3">Impressora</th><th class="px-4 py-3">Modelo</th><th class="px-4 py-3">Contadores</th><th class="px-4 py-3">Utilizado</th><th class="px-4 py-3">Qtd Exced.</th><th class="px-4 py-3">Valor Exced.</th><th class="px-4 py-3 text-right">Excluir</th></tr></thead><tbody class="divide-y">${leituras.slice(0, 300).map(l => { const eq = getEquipamento(l.equipamentoId) || {}; return `<tr ondblclick="abrirLancamentoContadorContrato('${c.id}','${l.parqueId}','${String(l.dataLeitura || '').slice(0,10)}','${l.id}')" class="hover:bg-slate-50 cursor-pointer"><td class="px-4 py-2.5"><b>${dateBR(l.dataLeitura)}</b></td><td class="px-4 py-2.5 font-mono font-bold">${html(eq.patrimonio || '-')}</td><td class="px-4 py-2.5">${html(eq.modelo || '')}</td><td class="px-4 py-2.5 font-mono text-[11px]">${toNumber(l.contadorPBAnterior, 0)} → <b>${toNumber(l.contadorPB, 0)}</b></td><td class="px-4 py-2.5 font-bold">${toNumber(l.consumoPB, 0)}</td><td class="px-4 py-2.5 font-semibold">${toNumber(l.qtdExcedentePB, Math.max(0, toNumber(l.consumoPB,0) - toNumber(c.franquiaPB,0)))}</td><td class="px-4 py-2.5 font-extrabold text-emerald-700">${money(l.valorExcedente || 0)}</td><td class="px-4 py-2.5 text-right"><button onclick="event.stopPropagation(); deleteLeituraContrato('${l.id}','${c.id}')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><i class="ph ph-trash"></i></button></td></tr>`; }).join('') || '<tr><td colspan="8" class="p-12 text-center text-slate-400">Nenhuma leitura lançada</td></tr>'}</tbody></table></div>
    </div>
  `, `<button onclick="openContratoCompleto('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">← Voltar</button><button onclick="fecharModalOperacional()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>`, '980px');
};

window.abrirEditorLeituraContrato = function(contratoId){
  const c = getContrato(contratoId); if(!c) return;
  const dataHoje = new Date().toISOString().slice(0, 10);
  STATE.listaLeitura.data = dataHoje;
  setModal(`Nova leitura — Contrato ${c.numero}`, `
    <div class="space-y-4 text-[13px]">
      <div class="rounded-xl border bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-3"><div><label class="font-bold text-slate-700 mr-2">Data da leitura</label><input id="kl-data" type="date" value="${dataHoje}" class="h-9 px-3 rounded-lg border font-semibold"></div><button onclick="abrirListaImpressorasParaLeitura('${c.id}')" class="h-10 px-5 rounded-xl bg-slate-700 text-white font-bold"><i class="ph ph-printer"></i> Lançar</button></div>
      <div id="kl-historico" class="rounded-xl border bg-white p-4 text-slate-500 text-[12px]">Clique em <b>Lançar</b> para escolher a impressora. Remanejadas/inativas aparecem apenas para conferência e não podem receber contador.</div>
    </div>
  `, `<button onclick="abrirLeiturasContrato('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button>`, '760px');
};

window.abrirListaImpressorasParaLeitura = function(contratoId){
  const c = getContrato(contratoId); if(!c) return;
  const data = document.getElementById('kl-data')?.value || STATE.listaLeitura.data || new Date().toISOString().slice(0, 10);
  STATE.listaLeitura.data = data;
  const periodo = periodoFromDate(data);
  const q = filtroBusca(STATE.listaLeitura.q);
  const todas = (db.parque || []).filter(p => p.contratoId === c.id);
  const jaLancadas = new Set((db.leituras || []).filter(l => l.contratoId === c.id && periodoFromDate(l.dataLeitura) === periodo).map(l => l.parqueId));
  let ativas = todas.filter(p => p.status === 'ativo' && !jaLancadas.has(p.id));
  let remanejadas = todas.filter(p => p.status !== 'ativo' || jaLancadas.has(p.id));
  const filtra = p => {
    const eq = getEquipamento(p.equipamentoId) || {};
    return !q || [eq.modelo, eq.patrimonio, eq.serie, p.setor, p.localInstalacao].some(v => normalizeText(v).includes(q));
  };
  ativas = sortAsc(ativas.filter(filtra), p => (getEquipamento(p.equipamentoId) || {}).patrimonio || '');
  remanejadas = sortAsc(remanejadas.filter(filtra), p => (getEquipamento(p.equipamentoId) || {}).patrimonio || '');
  const row = (p, disabled) => { const eq = getEquipamento(p.equipamentoId) || {}; const motivo = jaLancadas.has(p.id) ? 'já lançada neste mês' : (p.status === 'inativo' ? 'inativa' : 'remanejada'); return `<tr ${disabled ? '' : `ondblclick="abrirLancamentoContadorContrato('${c.id}','${p.id}','${data}')"`} class="${disabled ? 'bg-slate-50 text-slate-400' : 'hover:bg-blue-50 cursor-pointer'}"><td class="px-4 py-2.5 font-mono font-bold">${html(eq.patrimonio || '-')}</td><td class="px-4 py-2.5">${html(eq.modelo || '')}</td><td class="px-4 py-2.5">${html(eq.serie || '')}</td><td class="px-4 py-2.5">${html(p.setor || 'Geral')} / ${html(p.localInstalacao || '')}</td><td class="px-4 py-2.5">${disabled ? `<span class="px-2 py-0.5 rounded bg-slate-200 text-[11px] font-bold">${motivo}</span>` : `<button onclick="abrirLancamentoContadorContrato('${c.id}','${p.id}','${data}')" class="h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">Lançar</button>`}</td></tr>`; };
  setModal(`Selecionar impressora — ${periodo}`, `
    <div class="space-y-4 text-[13px]">
      <div class="flex flex-wrap justify-between gap-2 bg-slate-50 border rounded-xl p-3"><div class="flex gap-2"><input id="kl-search-maq" value="${html(STATE.listaLeitura.q)}" placeholder="Pesquisar impressora..." class="h-10 px-3 rounded-xl border w-[270px]">${botaoBusca(`aplicarBuscaListaLeituraOperacional('${c.id}')`)}</div><span class="text-[12px] text-slate-500 self-center">Duplo clique na impressora para lançar</span></div>
      <div class="overflow-auto max-h-[460px] border rounded-xl"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr><th class="px-4 py-3">Impressora</th><th class="px-4 py-3">Modelo</th><th class="px-4 py-3">Serial</th><th class="px-4 py-3">Departamento / Local</th><th class="px-4 py-3">Ação</th></tr></thead><tbody class="divide-y">${ativas.map(p => row(p, false)).join('') || '<tr><td colspan="5" class="p-8 text-center text-slate-400">Nenhuma impressora pendente</td></tr>'}<tr><td colspan="5" class="bg-slate-100 px-4 py-2 text-[11px] uppercase font-bold text-slate-500">Remanejadas / inativas / já lançadas</td></tr>${remanejadas.map(p => row(p, true)).join('') || '<tr><td colspan="5" class="p-4 text-center text-slate-400">Nenhuma</td></tr>'}</tbody></table></div>
    </div>
  `, `<button onclick="abrirEditorLeituraContrato('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">← Voltar</button>`, '900px');
  const inpLista = document.getElementById('kl-search-maq');
  if(inpLista){
    inpLista.removeAttribute('oninput');
    inpLista.oninput = null;
    inpLista.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.aplicarBuscaListaLeituraOperacional(contratoId); } };
  }
};

window.aplicarBuscaListaLeituraOperacional = function(contratoId){
  STATE.listaLeitura.q = document.getElementById('kl-search-maq')?.value || '';
  window.abrirListaImpressorasParaLeitura(contratoId);
};

window.abrirLancamentoContadorContrato = function(contratoId, parqueId, data, leituraId){
  const c = getContrato(contratoId); const p = getParque(parqueId); if(!c || !p) return;
  if(p.status !== 'ativo') return toastMsg('Esta impressora está inativa/remanejada e não pode receber leitura', 'error');
  const eq = getEquipamento(p.equipamentoId) || {};
  const leitura = leituraId ? (db.leituras || []).find(l => l.id === leituraId) : null;
  const ult = ultimoContadorPreto(db, p.equipamentoId);
  const ant = leitura ? toNumber(leitura.contadorPBAnterior, 0) : ult.valor;
  const atual = leitura ? toNumber(leitura.contadorPB, ant) : '';
  const dataValor = data || String(leitura?.dataLeitura || new Date().toISOString()).slice(0, 10);
  setModal(`Lançar contador — ${eq.modelo || 'Impressora'}`, `
    <div class="space-y-4 text-[13px]">
      <div class="rounded-xl bg-slate-50 border p-3"><p class="font-bold text-[15px]">${html(eq.modelo || '')}</p><p class="text-[12px] text-slate-500">Patrimônio ${html(eq.patrimonio || '-')} • Serial ${html(eq.serie || '-')} • ${html(p.setor || 'Geral')} / ${html(p.localInstalacao || '')}</p></div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div><label class="block font-bold text-slate-600 mb-1">Data</label><input id="klc-data" type="date" value="${html(dataValor)}" class="w-full h-10 px-3 rounded-xl border"></div>
        <div><label class="block font-bold text-slate-500 mb-1">Contador Antigo</label><input id="klc-ant" type="number" value="${ant}" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold"></div>
        <div><label class="block font-bold text-[#0a1e8a] mb-1">Contador Atual *</label><input id="klc-atual" type="number" value="${html(atual)}" oninput="previewLancamentoContadorOperacional('${c.id}','${p.id}','${leituraId || ''}')" class="w-full h-10 px-3 rounded-xl border-2 border-[#0a1e8a] font-mono font-bold" placeholder="Digite o atual"></div>
        <div><label class="block font-bold text-emerald-700 mb-1">Utilizado</label><input id="klc-util" readonly class="w-full h-10 px-3 rounded-xl border bg-emerald-50 font-bold text-emerald-700"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div class="rounded-xl border bg-white p-3"><p class="text-[11px] uppercase font-bold text-slate-500">Qtd Excedente</p><p id="klc-exc" class="font-extrabold text-[18px]">0</p></div><div class="rounded-xl border bg-white p-3"><p class="text-[11px] uppercase font-bold text-slate-500">Valor Excedente</p><p id="klc-valor" class="font-extrabold text-[18px] text-emerald-700">${money(0)}</p></div></div>
    </div>
  `, `<button onclick="abrirListaImpressorasParaLeitura('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button><button onclick="salvarLancamentoContadorOperacional('${c.id}','${p.id}','${leituraId || ''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Leitura</button>`, '780px');
  window.previewLancamentoContadorOperacional(c.id, p.id, leituraId || '');
};

window.previewLancamentoContadorOperacional = function(contratoId, parqueId, leituraId){
  const c = getContrato(contratoId); const p = getParque(parqueId); if(!c || !p) return;
  const ant = toNumber(document.getElementById('klc-ant')?.value, 0);
  const atualRaw = document.getElementById('klc-atual')?.value;
  const atual = atualRaw === '' ? ant : toNumber(atualRaw, ant);
  const data = document.getElementById('klc-data')?.value || new Date().toISOString().slice(0, 10);
  const res = calcularLeituraOperacional(db, c, p, ant, atual, data, leituraId || null);
  const util = document.getElementById('klc-util'); if(util) util.value = res.utilizado;
  const exc = document.getElementById('klc-exc'); if(exc) exc.innerText = res.qtdExcedente;
  const val = document.getElementById('klc-valor'); if(val) val.innerText = money(res.valorExcedente);
};

window.salvarLancamentoContadorOperacional = function(contratoId, parqueId, leituraId){
  const sess = getSess(); if(!sess) return;
  const c = getContrato(contratoId); const p = getParque(parqueId); if(!c || !p) return;
  const atualRaw = document.getElementById('klc-atual')?.value;
  if(atualRaw === undefined || atualRaw === null || String(atualRaw).trim() === '') return toastMsg('Informe o contador atual', 'error');
  const ant = toNumber(document.getElementById('klc-ant')?.value, 0);
  const data = document.getElementById('klc-data')?.value || new Date().toISOString().slice(0, 10);
  const res = calcularLeituraOperacional(db, c, p, ant, atualRaw, data, leituraId || null);
  const payload = { empresaId: sess.empresaId, parqueId: p.id, equipamentoId: p.equipamentoId, contratoId: c.id, clienteId: c.clienteId, dataLeitura: isoFromDateInput(data), contadorPBAnterior: res.anterior, contadorPB: res.atual, contadorCorAnterior: 0, contadorCor: 0, consumoPB: res.utilizado, consumoCor: 0, qtdExcedentePB: res.qtdExcedente, valorExcedente: res.valorExcedente, modalidade: res.modalidade, faturar: res.valorExcedente > 0, status: 'pendente' };
  if(leituraId){
    const l = (db.leituras || []).find(x => x.id === leituraId); if(l) Object.assign(l, payload, { atualizadoEm: new Date().toISOString(), atualizadoPorNome: sess.usuarioNome });
    logSafe('leitura', 'editar', leituraId, `Leitura alterada por ${sess.usuarioNome}`);
  } else {
    db.leituras.push({ id: uidSafe('lei'), criadoEm: new Date().toISOString(), criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome, ...payload });
    logSafe('leitura', 'criar', p.id, `Leitura ${res.atual} lançada por ${sess.usuarioNome}`);
  }
  const eq = getEquipamento(p.equipamentoId); if(eq) eq.contadorPB = Math.max(toNumber(eq.contadorPB, 0), res.atual);
  saveSafe();
  toastMsg('Leitura salva com sucesso', 'success');
  window.abrirLeiturasContrato(c.id);
  if(typeof renderLeituras === 'function') renderLeituras();
};

window.deleteLeituraContrato = function(leiId, contratoId){
  if(!confirm('Excluir esta leitura?')) return;
  db.leituras = (db.leituras || []).filter(l => l.id !== leiId);
  saveSafe();
  toastMsg('Leitura excluída', 'success');
  window.abrirLeiturasContrato(contratoId);
};

window.imprimirRelatorioLeiturasPDF = function(contratoId){
  const c = getContrato(contratoId); if(!c) return;
  const cli = getCliente(c.clienteId) || {};
  const leituras = leiturasContrato(c.id).slice().reverse();
  const linhas = leituras.map(l => { const eq = getEquipamento(l.equipamentoId) || {}; return `<tr><td>${dateBR(l.dataLeitura)}</td><td>${html(eq.modelo || '')}</td><td>${html(eq.patrimonio || '-')}</td><td>${toNumber(l.contadorPBAnterior, 0)}</td><td><b>${toNumber(l.contadorPB, 0)}</b></td><td>${toNumber(l.consumoPB, 0)}</td><td>${toNumber(l.qtdExcedentePB, 0)}</td><td>${money(l.valorExcedente || 0)}</td></tr>`; }).join('') || '<tr><td colspan="8" style="text-align:center">Sem leituras registradas</td></tr>';
  const htmlDoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Leituras ${c.numero}</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#111;font-size:12px}.cab{display:flex;justify-content:space-between;border-bottom:2px solid #0a1e8a;padding-bottom:10px;margin-bottom:15px}.cab h1{color:#0a1e8a;font-size:20px;margin:0}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:7px;text-align:left}th{background:#f4f6f9;font-weight:700;color:#0a1e8a;font-size:11px}@media print{.no-print{display:none}}</style></head><body><div class="no-print" style="margin-bottom:15px"><button onclick="window.print()" style="padding:10px 20px;background:#0a1e8a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">🖨 Imprimir / Salvar PDF</button></div><div class="cab"><div><h1>DIGICOPY ERP — RELATÓRIO DE LEITURAS</h1><p><b>Cliente:</b> ${html(cli.nome || '')} (${html(cli.documento || '')})</p></div><div style="text-align:right"><p><b>Contrato:</b> ${html(c.numero || '')}</p><p><b>Emissão:</b> ${dateBR(new Date())}</p></div></div><table><thead><tr><th>Data</th><th>Impressora</th><th>Patrimônio</th><th>Cont. Ant.</th><th>Cont. Atual</th><th>Utilizado</th><th>Qtd Exced.</th><th>Valor Exced.</th></tr></thead><tbody>${linhas}</tbody></table></body></html>`;
  const win = window.open('', '_blank'); if(win){ win.document.write(htmlDoc); win.document.close(); }
};

window.aplicarBuscaChamadosOperacional = function(contratoId){
  STATE.chamados.q = document.getElementById('kc-search-chamado')?.value || '';
  STATE.chamados.status = document.getElementById('kc-status-chamado')?.value || 'abertos';
  window.abrirChamadosContrato(contratoId);
};

window.chamadosSortOperacional = function(col, contratoId){
  STATE.chamados.sort = col;
  window.abrirChamadosContrato(contratoId);
};

window.abrirChamadosContrato = function(contratoId){
  const c = getContrato(contratoId); if(!c) return;
  const cli = getCliente(c.clienteId) || {};
  const q = filtroBusca(STATE.chamados.q);
  let chamados = (db.os || []).filter(o => o.clienteId === c.clienteId);
  if(STATE.chamados.status === 'abertos') chamados = chamados.filter(o => o.status !== 'concluido' && o.status !== 'cancelado' && o.status !== 'fechado');
  else if(STATE.chamados.status) chamados = chamados.filter(o => o.status === STATE.chamados.status);
  if(q) chamados = chamados.filter(o => [o.numero, o.descricao, o.tecnico, o.modelo, o.patrimonio, o.serie].some(v => normalizeText(v).includes(q)));
  const sorters = { codigo: o => o.numero || '', data: o => o.dataAbertura || '', impressora: o => o.patrimonio || (getEquipamento(o.equipamentoId) || {}).patrimonio || '', modelo: o => o.modelo || (getEquipamento(o.equipamentoId) || {}).modelo || '', tecnico: o => o.tecnico || '', status: o => o.status || '' };
  chamados = sortAsc(chamados, sorters[STATE.chamados.sort] || sorters.codigo);
  setModal(`Chamados Técnicos — ${c.numero}`, '', '', '960px');
  const head = `<table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500 sticky top-0"><tr><th onclick="chamadosSortOperacional('codigo','${c.id}')" class="px-4 py-3 cursor-pointer">Código${STATE.chamados.sort==='codigo'?' ▲':''}</th><th onclick="chamadosSortOperacional('data','${c.id}')" class="px-4 py-3 cursor-pointer">Data${STATE.chamados.sort==='data'?' ▲':''}</th><th onclick="chamadosSortOperacional('impressora','${c.id}')" class="px-4 py-3 cursor-pointer">Impressora${STATE.chamados.sort==='impressora'?' ▲':''}</th><th onclick="chamadosSortOperacional('modelo','${c.id}')" class="px-4 py-3 cursor-pointer">Modelo${STATE.chamados.sort==='modelo'?' ▲':''}</th><th class="px-4 py-3">Motivo</th><th onclick="chamadosSortOperacional('tecnico','${c.id}')" class="px-4 py-3 cursor-pointer">Técnico${STATE.chamados.sort==='tecnico'?' ▲':''}</th><th onclick="chamadosSortOperacional('status','${c.id}')" class="px-4 py-3 cursor-pointer">Status${STATE.chamados.sort==='status'?' ▲':''}</th><th class="px-4 py-3 text-right">PDF</th></tr></thead><tbody class="divide-y">${chamados.map(o => { const eq = getEquipamento(o.equipamentoId) || {}; const venc = chamadoVencido(o.dataAbertura, o.status); return `<tr ondblclick="openModalChamadoCompleto('${o.id}','${c.id}')" class="hover:bg-slate-50 cursor-pointer ${venc ? 'bg-red-50/50' : ''}"><td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">${html(o.numero || '')}</td><td class="px-4 py-2.5">${dateBR(o.dataAbertura)} ${venc ? '<span class="ml-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">VENCIDO</span>' : ''}</td><td class="px-4 py-2.5 font-mono font-bold">${html(o.patrimonio || eq.patrimonio || '-')}</td><td class="px-4 py-2.5">${html(o.modelo || eq.modelo || '')}</td><td class="px-4 py-2.5">${html(o.descricao || '')}</td><td class="px-4 py-2.5">${html(o.tecnico || '-')}</td><td class="px-4 py-2.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${o.status === 'concluido' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${o.status === 'concluido' ? 'Finalizado' : 'Aberto'}</span></td><td class="px-4 py-2.5 text-right"><button onclick="event.stopPropagation(); imprimirChamadoPDF('${o.id}')" class="w-8 h-8 rounded-lg hover:bg-slate-100"><i class="ph ph-printer"></i></button></td></tr>`; }).join('') || '<tr><td colspan="8" class="p-12 text-center text-slate-400">Nenhum chamado nesta busca</td></tr>'}</tbody></table>`;
  const body = document.getElementById('modal-body');
  if(body){
    body.innerHTML = `<div class="space-y-4 text-[13px]"><div class="flex flex-wrap justify-between items-center gap-3 bg-slate-50 p-3 rounded-xl border"><button onclick="openModalChamadoCompleto(null,'${c.id}')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-plus-circle"></i> Novo Chamado</button><div class="flex flex-wrap gap-2"><select id="kc-status-chamado" onchange="aplicarBuscaChamadosOperacional('${c.id}')" class="h-10 px-3 rounded-xl border bg-white text-[13px]"><option value="abertos" ${STATE.chamados.status==='abertos'?'selected':''}>Abertos automáticos</option><option value="" ${STATE.chamados.status===''?'selected':''}>Todos</option><option value="concluido" ${STATE.chamados.status==='concluido'?'selected':''}>Finalizados</option><option value="cancelado" ${STATE.chamados.status==='cancelado'?'selected':''}>Cancelados</option></select><input id="kc-search-chamado" value="${html(STATE.chamados.q)}" placeholder="Pesquisar chamado..." class="h-10 px-3 rounded-xl border w-[240px]">${botaoBusca(`aplicarBuscaChamadosOperacional('${c.id}')`)}</div></div><div class="overflow-auto max-h-[480px] border rounded-xl">${head}</div></div>`;
  }
  const footer = document.getElementById('modal-footer');
  if(footer) footer.innerHTML = `<button onclick="openContratoCompleto('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">← Voltar</button><button onclick="fecharModalOperacional()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>`;
  const inpChamado = document.getElementById('kc-search-chamado');
  if(inpChamado){
    inpChamado.removeAttribute('oninput');
    inpChamado.oninput = null;
    inpChamado.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.aplicarBuscaChamadosOperacional(contratoId); } };
  }
};

function produtosOptionsChamado(){
  const sess = getSess();
  return (db.produtos || [])
    .filter(p => (!sess || p.empresaId === sess.empresaId) && p.status !== 'inativo' && p.status !== 'excluido')
    .sort((a,b) => compareSmart(a.nome, b.nome))
    .slice(0, 500)
    .map(p => `<option value="${p.id}">${html(produtoCodigo(p))} - ${html(p.nome || '')} • ${money(p.preco || 0)} • est ${toNumber(p.estoque, 0)}</option>`).join('');
}

function renderPecasChamado(){
  const cont = document.getElementById('ko-pecas-list'); if(!cont) return;
  const itens = window.__chamadoPecasTemp || [];
  cont.innerHTML = itens.map((it, idx) => { const p = (db.produtos || []).find(x => x.id === it.produtoId) || {}; return `<div class="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-white border text-[12px]"><div><b>${html(p.nome || it.descricao || 'Produto')}</b><p class="text-[11px] text-slate-500">${html(produtoCodigo(p))} • ${money(it.preco || 0)}</p></div><div class="flex items-center gap-2"><input type="number" min="1" value="${it.qtd}" onchange="alterarQtdPecaChamado(${idx}, this.value)" class="w-16 h-8 px-2 rounded-lg border"><b>${money((it.qtd || 0) * (it.preco || 0))}</b><button onclick="removerPecaChamado(${idx})" class="w-7 h-7 rounded-lg bg-red-50 text-red-600"><i class="ph ph-x"></i></button></div></div>`; }).join('') || '<p class="text-[12px] text-slate-400 text-center py-3">Nenhum produto adicionado</p>';
}

window.adicionarPecaChamado = function(){
  const prodId = document.getElementById('ko-produto')?.value || '';
  const qtd = Math.max(1, toInt(document.getElementById('ko-prod-qtd')?.value, 1));
  if(!prodId) return toastMsg('Selecione um produto', 'error');
  const p = (db.produtos || []).find(x => x.id === prodId);
  if(!p) return;
  window.__chamadoPecasTemp = window.__chamadoPecasTemp || [];
  const ex = window.__chamadoPecasTemp.find(i => i.produtoId === prodId);
  if(ex) ex.qtd += qtd;
  else window.__chamadoPecasTemp.push({ produtoId: prodId, descricao: p.nome, qtd, preco: toNumber(p.preco, 0), subtotal: qtd * toNumber(p.preco, 0) });
  renderPecasChamado();
};
window.alterarQtdPecaChamado = function(idx, value){
  const it = (window.__chamadoPecasTemp || [])[idx]; if(!it) return;
  it.qtd = Math.max(1, toInt(value, 1)); it.subtotal = it.qtd * toNumber(it.preco, 0); renderPecasChamado();
};
window.removerPecaChamado = function(idx){
  (window.__chamadoPecasTemp || []).splice(idx, 1); renderPecasChamado();
};

window.openModalChamadoCompleto = function(osId, contratoId){
  const sess = getSess(); if(!sess) return;
  const c = getContrato(contratoId);
  const isEdit = !!osId;
  const o = isEdit ? (db.os || []).find(x => x.id === osId) : { id: '', empresaId: sess.empresaId, clienteId: c?.clienteId || null, numero: (typeof proximoNumeroSimples === 'function' ? proximoNumeroSimples('os', db.os || [], sess.empresaId) : String((db.os || []).length + 1)), dataAbertura: new Date().toISOString(), status: 'aberto', prioridade: 'normal', tecnico: sess.usuarioNome, descricao: '', servicos: '', pendencias: '', observacao: '', observacaoCliente: '', pecas: [] };
  if(!o) return toastMsg('Chamado não encontrado', 'error');
  const maquinas = c ? (db.parque || []).filter(p => p.contratoId === c.id && p.status === 'ativo') : [];
  const maqOptions = maquinas.map(p => { const eq = getEquipamento(p.equipamentoId) || {}; return `<option value="${p.equipamentoId}" data-parque="${p.id}" ${o.equipamentoId === p.equipamentoId ? 'selected' : ''}>${html(eq.modelo || '')} (Patr. ${html(eq.patrimonio || '-')})</option>`; }).join('');
  window.__chamadoPecasTemp = (o.pecas || []).map(it => ({ ...it }));
  setModal(isEdit ? `Chamado Técnico — ${o.numero}` : 'Novo Chamado Técnico Corretivo', `
    <div class="space-y-4 text-[13px]">
      <div class="flex border-b gap-6 font-bold text-[13px] text-slate-500"><button type="button" onclick="mudarAbaChamadoOperacional('geral')" id="ko-tab-geral" class="pb-2 border-b-2 border-[#0a1e8a] text-[#0a1e8a]">Geral</button><button type="button" onclick="mudarAbaChamadoOperacional('finais')" id="ko-tab-finais" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Dados Finais</button><button type="button" onclick="mudarAbaChamadoOperacional('detalhes')" id="ko-tab-detalhes" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Detalhes Produtos</button></div>
      <div id="ko-painel-geral" class="space-y-4"><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Código / OS</label><input id="ko-num" value="${html(o.numero || '')}" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold"></div><div><label class="block font-bold text-slate-600 mb-1">Data</label><input id="ko-data" type="date" value="${String(o.dataAbertura || '').slice(0,10)}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Prioridade</label><select id="ko-prio" class="w-full h-10 px-3 rounded-xl border"><option value="normal">Normal</option><option value="alta">Alta</option><option value="baixa">Baixa</option></select></div><div><label class="block font-bold text-slate-600 mb-1">Técnico</label><input id="ko-tec" value="${html(o.tecnico || sess.usuarioNome)}" class="w-full h-10 px-3 rounded-xl border"></div></div><div><label class="block font-bold text-slate-600 mb-1">Motivo / Defeito Relatado *</label><input id="ko-desc" value="${html(o.descricao || '')}" class="w-full h-10 px-3 rounded-xl border font-semibold"></div><label class="bg-slate-50 border rounded-xl p-3 flex items-center gap-3 cursor-pointer"><input type="checkbox" id="ko-concluido" ${o.status === 'concluido' ? 'checked' : ''} class="w-4 h-4"><span class="font-bold">Este Chamado já foi Finalizado?</span><span class="text-[11px] text-slate-500 ml-auto">Marcado não aparece na lista padrão de abertos.</span></label></div>
      <div id="ko-painel-finais" class="hidden space-y-4"><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block font-bold text-slate-600 mb-1">Serviços Executados</label><textarea id="ko-serv" class="w-full h-24 p-3 rounded-xl border">${html(o.servicos || '')}</textarea></div><div><label class="block font-bold text-slate-600 mb-1">Pendências</label><textarea id="ko-pend" class="w-full h-24 p-3 rounded-xl border">${html(o.pendencias || '')}</textarea></div></div><div><label class="block font-bold text-slate-600 mb-1">Anotações finais</label><textarea id="ko-obs" class="w-full h-20 p-3 rounded-xl border">${html(o.observacao || '')}</textarea></div></div>
      <div id="ko-painel-detalhes" class="hidden space-y-4"><div class="rounded-xl bg-blue-50 border border-blue-200 p-3"><label class="font-bold text-blue-900 mr-2">Impressora da manutenção:</label><select id="ko-equip" onchange="autoPreencherDadosChamado(this.value)" class="h-9 px-3 rounded-lg border font-semibold"><option value="">Outro equipamento</option>${maqOptions}</select><span class="text-[11px] text-blue-700 ml-2">Preenche serial, patrimônio e contador antigo</span></div><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><div><label class="block font-bold text-slate-600 mb-1">Modelo</label><input id="ko-modelo" value="${html(o.modelo || '')}" class="w-full h-10 px-3 rounded-xl border"></div><div><label class="block font-bold text-slate-600 mb-1">Serial</label><input id="ko-serie" value="${html(o.serie || '')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div><div><label class="block font-bold text-slate-600 mb-1">Patrimônio</label><input id="ko-patr" value="${html(o.patrimonio || '')}" class="w-full h-10 px-3 rounded-xl border font-mono font-bold"></div><div><label class="block font-bold text-slate-600 mb-1">Local</label><input id="ko-local" value="${html(o.local || '')}" class="w-full h-10 px-3 rounded-xl border"></div></div><div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 border rounded-xl"><div><label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Preto Antigo</label><input id="ko-cont-ant" type="number" value="${toNumber(o.contadorAntigo, 0)}" readonly class="w-full h-10 px-3 rounded-xl border font-mono font-bold text-[#0a1e8a]"></div><div><label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Preto Atual</label><input id="ko-cont-atu" type="number" value="${o.contadorAtual !== undefined ? html(o.contadorAtual) : ''}" oninput="calcImpressoesChamado()" class="w-full h-10 px-3 rounded-xl border-2 border-[#0a1e8a] font-mono font-bold"></div><div><label class="block font-bold text-emerald-700 mb-1 text-[11px] uppercase">Quantidade Impressos</label><input id="ko-qtd-imp" type="number" value="${toNumber(o.quantidadeImpressos, 0)}" readonly class="w-full h-10 px-3 rounded-xl border bg-emerald-50 font-bold text-emerald-700"></div></div><div class="rounded-xl border p-3 bg-slate-50"><p class="font-bold text-slate-700 mb-2">Produtos / Peças usadas</p><div class="grid grid-cols-1 md:grid-cols-12 gap-2"><select id="ko-produto" class="md:col-span-8 h-10 px-3 rounded-xl border bg-white"><option value="">Selecione</option>${produtosOptionsChamado()}</select><input id="ko-prod-qtd" type="number" value="1" min="1" class="md:col-span-2 h-10 px-3 rounded-xl border"><button onclick="adicionarPecaChamado()" class="md:col-span-2 h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold">Adicionar</button></div><div id="ko-pecas-list" class="mt-3 space-y-2"></div></div></div>
    </div>
  `, `<button onclick="imprimirChamadoPDF('${o.id || ''}')" class="h-10 px-5 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2 mr-auto"><i class="ph ph-printer"></i> Imprimir OS</button><button onclick="abrirChamadosContrato('${c ? c.id : ''}')" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button><button onclick="salvarChamadoCompleto('${o.id || ''}','${c ? c.id : ''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Chamado</button>`, '880px');
  const prio = document.getElementById('ko-prio'); if(prio) prio.value = o.prioridade || 'normal';
  renderPecasChamado();
  if(!isEdit && maquinas.length) autoPreencherDadosChamado(maquinas[0].equipamentoId);
};

window.mudarAbaChamadoOperacional = function(aba){
  ['geral', 'finais', 'detalhes'].forEach(k => {
    document.getElementById('ko-painel-' + k)?.classList.toggle('hidden', k !== aba);
    const tab = document.getElementById('ko-tab-' + k);
    if(tab){ tab.classList.toggle('border-[#0a1e8a]', k === aba); tab.classList.toggle('text-[#0a1e8a]', k === aba); tab.classList.toggle('border-transparent', k !== aba); }
  });
};

window.autoPreencherDadosChamado = function(equipId, manterContadorAtual, ignoreOsId){
  const eq = getEquipamento(equipId); if(!eq) return;
  const prq = ultimoParqueDoEquipamento(eq.id) || {};
  document.getElementById('ko-modelo').value = eq.modelo || '';
  document.getElementById('ko-serie').value = eq.serie || '';
  document.getElementById('ko-patr').value = eq.patrimonio || '';
  document.getElementById('ko-local').value = prq.localInstalacao || prq.setor || '';
  const ult = ultimoContadorPreto(db, eq.id, ignoreOsId);
  document.getElementById('ko-cont-ant').value = ult.valor;
  const atual = document.getElementById('ko-cont-atu');
  if(atual && !manterContadorAtual) atual.value = ult.valor;
  calcImpressoesChamado();
};

window.calcImpressoesChamado = function(){
  const ant = toNumber(document.getElementById('ko-cont-ant')?.value, 0);
  const atu = Math.max(ant, toNumber(document.getElementById('ko-cont-atu')?.value, ant));
  const out = document.getElementById('ko-qtd-imp'); if(out) out.value = atu - ant;
};

function ajustarEstoquePecas(pecas, sinal){
  (pecas || []).forEach(it => {
    const p = (db.produtos || []).find(x => x.id === it.produtoId);
    if(p && !produtoEhServico(p)) p.estoque = toNumber(p.estoque, 0) + (sinal * toNumber(it.qtd, 0));
  });
}

window.salvarChamadoCompleto = function(osId, contratoId){
  const sess = getSess(); if(!sess) return;
  const c = getContrato(contratoId);
  const desc = document.getElementById('ko-desc')?.value?.trim() || '';
  if(!desc) return toastMsg('Informe o motivo do chamado', 'error');
  const equipId = document.getElementById('ko-equip')?.value || '';
  const eq = getEquipamento(equipId) || null;
  const concluido = !!document.getElementById('ko-concluido')?.checked;
  const pecas = (window.__chamadoPecasTemp || []).map(it => ({ ...it, subtotal: toNumber(it.qtd, 0) * toNumber(it.preco, 0) }));
  const payload = {
    empresaId: sess.empresaId,
    clienteId: c ? c.clienteId : null,
    contratoId: c ? c.id : null,
    numero: document.getElementById('ko-num')?.value || uidSafe('os'),
    dataAbertura: isoFromDateInput(document.getElementById('ko-data')?.value || new Date().toISOString().slice(0, 10)),
    prioridade: document.getElementById('ko-prio')?.value || 'normal',
    tecnico: titlePessoa(document.getElementById('ko-tec')?.value?.trim() || sess.usuarioNome),
    descricao: desc,
    status: concluido ? 'concluido' : 'aberto',
    servicos: document.getElementById('ko-serv')?.value?.trim() || '',
    pendencias: document.getElementById('ko-pend')?.value?.trim() || '',
    observacao: document.getElementById('ko-obs')?.value?.trim() || '',
    equipamentoId: equipId || null,
    parqueId: equipId ? (ultimoParqueDoEquipamento(equipId)?.id || null) : null,
    modelo: document.getElementById('ko-modelo')?.value?.trim() || (eq && eq.modelo) || '',
    serie: document.getElementById('ko-serie')?.value?.trim() || (eq && eq.serie) || '',
    patrimonio: document.getElementById('ko-patr')?.value?.trim() || (eq && eq.patrimonio) || '',
    local: document.getElementById('ko-local')?.value?.trim() || '',
    contadorAntigo: toNumber(document.getElementById('ko-cont-ant')?.value, 0),
    contadorAtual: toNumber(document.getElementById('ko-cont-atu')?.value, 0),
    quantidadeImpressos: toNumber(document.getElementById('ko-qtd-imp')?.value, 0),
    pecas,
    custoPecas: pecas.reduce((s, it) => s + toNumber(it.subtotal, 0), 0),
    dataFechamento: concluido ? new Date().toISOString() : null
  };
  if(osId){
    const old = (db.os || []).find(o => o.id === osId);
    if(!old) return toastMsg('Chamado não encontrado', 'error');
    ajustarEstoquePecas(old.pecas, +1);
    ajustarEstoquePecas(pecas, -1);
    Object.assign(old, payload, { atualizadoEm: new Date().toISOString(), atualizadoPorNome: sess.usuarioNome });
    logSafe('os', 'editar_chamado', osId, `Chamado ${payload.numero} editado por ${sess.usuarioNome}`);
  } else {
    ajustarEstoquePecas(pecas, -1);
    const novo = { id: uidSafe('os'), criadoEm: new Date().toISOString(), criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome, ...payload };
    db.os.push(novo);
    osId = novo.id;
    logSafe('os', 'criar_chamado', novo.id, `Chamado ${novo.numero} aberto por ${sess.usuarioNome}`);
  }
  if(eq && payload.contadorAtual) eq.contadorPB = Math.max(toNumber(eq.contadorPB, 0), payload.contadorAtual);
  saveSafe();
  toastMsg('Chamado salvo com sucesso', 'success');
  if(contratoId) window.abrirChamadosContrato(contratoId); else fecharModal();
  if(typeof renderOs === 'function') renderOs();
  if(typeof renderProdutos === 'function') renderProdutos();
};

window.imprimirChamadoPDF = function(osId){
  if(!osId) return toastMsg('Salve o chamado antes de imprimir', 'info');
  const o = (db.os || []).find(x => x.id === osId); if(!o) return toastMsg('Chamado não encontrado', 'error');
  const cli = getCliente(o.clienteId) || {};
  const pecas = (o.pecas || []).map(it => `<tr><td>${html(it.descricao || ((db.produtos || []).find(p => p.id === it.produtoId)?.nome) || '')}</td><td>${toNumber(it.qtd,0)}</td><td>${money(it.preco || 0)}</td><td>${money(it.subtotal || 0)}</td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center">Sem produtos</td></tr>';
  const htmlDoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado Técnico ${o.numero}</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#111;font-size:12px}.cab{display:flex;justify-content:space-between;border-bottom:2px solid #0a1e8a;padding-bottom:10px;margin-bottom:15px}.cab h1{color:#0a1e8a;font-size:20px;margin:0}.box{border:1px solid #ccc;border-radius:8px;padding:10px;margin-bottom:10px;background:#fafafa}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f4f6f9;color:#0a1e8a}@media print{.no-print{display:none}}</style></head><body><div class="no-print" style="margin-bottom:15px"><button onclick="window.print()" style="padding:10px 20px;background:#0a1e8a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">🖨 Imprimir / Salvar PDF</button></div><div class="cab"><div><h1>DIGICOPY ERP — CHAMADO TÉCNICO</h1><p><b>Cliente:</b> ${html(cli.nome || '')} (${html(cli.documento || '')})</p><p>${html(cli.endereco || '')} ${html(cli.numero || '')} - ${html(cli.cidade || '')}/${html(cli.estado || '')}</p></div><div style="text-align:right"><p><b>OS:</b> ${html(o.numero || '')}</p><p><b>Data:</b> ${dateBR(o.dataAbertura)}</p><p><b>Status:</b> ${html(o.status || '')}</p></div></div><div class="box"><p><b>Motivo:</b> ${html(o.descricao || '-')}</p><p><b>Técnico:</b> ${html(o.tecnico || '-')}</p></div><div class="box grid"><div><p><b>Modelo:</b> ${html(o.modelo || '-')}</p><p><b>Serial:</b> ${html(o.serie || '-')}</p><p><b>Patrimônio:</b> ${html(o.patrimonio || '-')}</p><p><b>Local:</b> ${html(o.local || '-')}</p></div><div><p><b>Contador Antigo:</b> ${toNumber(o.contadorAntigo,0)}</p><p><b>Contador Atual:</b> ${toNumber(o.contadorAtual,0)}</p><p><b>Qtd. Impressos:</b> ${toNumber(o.quantidadeImpressos,0)}</p></div></div><div class="box"><p><b>Serviços Executados:</b></p><p>${html(o.servicos || '-')}</p></div><div class="box"><p><b>Produtos / Peças:</b></p><table><thead><tr><th>Produto</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead><tbody>${pecas}</tbody></table></div><div style="margin-top:50px;display:flex;justify-content:space-between"><div style="border-top:1px solid #000;width:220px;text-align:center;padding-top:5px">Assinatura Técnico</div><div style="border-top:1px solid #000;width:220px;text-align:center;padding-top:5px">Assinatura Cliente</div></div></body></html>`;
  const win = window.open('', '_blank'); if(win){ win.document.write(htmlDoc); win.document.close(); }
};

window.imprimirContratoLocacaoOperacional = function(contratoId, tipo){
  const c = getContrato(contratoId); if(!c) return;
  const cli = getCliente(c.clienteId) || {};
  const maquinas = (db.parque || []).filter(p => p.contratoId === c.id && p.status === 'ativo');
  const rows = maquinas.map(p => { const eq = getEquipamento(p.equipamentoId) || {}; return `<tr><td>${html(eq.modelo || '')}</td><td>${html(eq.patrimonio || '')}</td><td>${html(eq.serie || '')}</td><td>${html(p.setor || '')}</td><td>${html(p.modalidade || '')}</td></tr>`; }).join('') || '<tr><td colspan="5" style="text-align:center">Sem impressoras</td></tr>';
  const titulo = tipo === 'proposta' ? 'PROPOSTA DE LOCAÇÃO' : 'CONTRATO DE LOCAÇÃO';
  const htmlDoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo} ${c.numero}</title><style>body{font-family:Arial,sans-serif;margin:28px;color:#111;font-size:12px}.cab{border-bottom:2px solid #0a1e8a;padding-bottom:12px;margin-bottom:18px}.cab h1{color:#0a1e8a;margin:0;font-size:22px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:7px;text-align:left}th{background:#f4f6f9;color:#0a1e8a}.box{border:1px solid #ccc;border-radius:8px;padding:12px;margin:12px 0}@media print{.no-print{display:none}}</style></head><body><div class="no-print"><button onclick="window.print()" style="padding:10px 20px;background:#0a1e8a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">🖨 Imprimir / Salvar PDF</button></div><div class="cab"><h1>DIGICOPY ERP — ${titulo}</h1><p><b>Contrato:</b> ${html(c.numero || '')} • <b>Emissão:</b> ${dateBR(new Date())}</p></div><div class="box"><p><b>Cliente:</b> ${html(cli.nome || '')}</p><p><b>Documento:</b> ${html(cli.documento || '')}</p><p><b>Endereço:</b> ${html(cli.endereco || '')} ${html(cli.numero || '')} - ${html(cli.cidade || '')}/${html(cli.estado || '')}</p></div><div class="box"><p><b>Vigência:</b> ${dateBR(c.dataInicio)} até ${dateBR(c.dataFim)}</p><p><b>Valor mensal:</b> ${money(c.valorMensalFixo || 0)} • <b>Franquia PB:</b> ${toNumber(c.franquiaPB,0).toLocaleString('pt-BR')} páginas • <b>Excedente PB:</b> ${money(c.valorExcedentePB || 0)}</p></div><table><thead><tr><th>Modelo</th><th>Patrimônio</th><th>Serial</th><th>Departamento</th><th>Modalidade</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:60px;display:flex;justify-content:space-between"><div style="border-top:1px solid #000;width:260px;text-align:center;padding-top:6px">DIGICOPY</div><div style="border-top:1px solid #000;width:260px;text-align:center;padding-top:6px">Cliente</div></div></body></html>`;
  const win = window.open('', '_blank'); if(win){ win.document.write(htmlDoc); win.document.close(); }
};

window.fecharModalOperacional = fecharModal;


window.openModalProdutoFromVenda = function(){
  const termo = document.getElementById('nv-prod-search')?.value || '';
  const tipo = document.getElementById('nv-tipo-item')?.value || '';
  window.openModal('produto');
  setTimeout(() => {
    const nome = document.getElementById('kp-prd-nome');
    const cat = document.getElementById('kp-prd-cat');
    if(nome && termo) nome.value = termo;
    if(cat && tipo === 'recarga') cat.value = 'Serviço';
  }, 80);
};

const oldOpenModal = window.openModal;
window.openModal = function(type, id = null){
  if(type === 'produto') return window.renderModalProduto(id);
  if(type === 'contrato') return window.renderModalContrato(id);
  if(oldOpenModal) return oldOpenModal(type, id);
};

window.verificarEstoqueBaixo = function(){
  const sess = getSess(); if(!sess) return 0;
  return (db.produtos || []).filter(p => p.empresaId === sess.empresaId && p.status !== 'inativo' && estoqueBaixoEstrito(p.estoque, p.estoqueMin)).length;
};
window.scanEstoqueBaixo = function(){
  const sess = getSess(); if(!sess) return [];
  return (db.produtos || []).filter(p => p.empresaId === sess.empresaId && p.status !== 'inativo' && estoqueBaixoEstrito(p.estoque, p.estoqueMin)).map(p => ({ id: p.id, sku: p.sku, nome: p.nome, estoque: p.estoque, estoqueMin: p.estoqueMin, critico: toNumber(p.estoque) <= 0 })).sort((a,b) => toNumber(a.estoque) - toNumber(b.estoque));
};

setTimeout(() => {
  sanitizarBuscas();
  const sess = getSess();
  if(sess && adaptarProdutosMigrados(db, sess.empresaId)) saveSafe();
}, 200);

try{
  const obs = new MutationObserver(() => sanitizarBuscas());
  obs.observe(document.body, { childList: true, subtree: true });
}catch(_err){}

console.log(`[DIGICOPY] fluxos_operacionais_patch.js ${KAUAN_VERSION} carregado`);
})();
