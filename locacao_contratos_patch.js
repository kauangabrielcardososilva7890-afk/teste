// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.12 — Locação, Contratos, Leituras e Chamados Técnicos Completo:
// • Fim de busca por digitação (apenas no Enter ou Lupa) e sem barra A..Z
// • Ordenação do menor para o maior (asc) por padrão ao clicar nos títulos
// • Estoque mínimo: notificação SOMENTE se estoque < mínimo (igual ao mínimo NÃO notifica)
// • Cadastro de Produtos: categoria/tipo unificados, estoque fixo, sem promoção/varejo
// • Contratos Completo: clique duplo, resumo com KPIs, abas de impressoras (Global, Individual,
//   Impressão, Mês Fixo, Inativo), sem "Despesas"/"Pedidos"/"Observações"
// • Leituras Coletivas: cálculo de franquia/excedente e impressão em PDF (Modelo 2.1)
// • Chamados Técnicos: preenchimento automático de Serial/Patrimônio/Contador Preto Antigo,
//   cálculo da Quantidade Impressos, peças aplicadas e impressão em PDF (Modelo 1.1)
// ═══════════════════════════════════════════════════════════════════════════
(function(){

// ── Funções Puras (sem DOM) para Testes Automatizados ──

function ehEstoqueBaixo(estoque, estoqueMin){
  const e = Number(estoque||0);
  const m = Number(estoqueMin||0);
  // Regra oficial do Operacional: quantidade exata do mínimo NÃO notifica. Só abaixo (<).
  return e < m;
}

function calcLeituraExcedente(anterior, atual, franquia, valorExc, modo='global'){
  const ant = Math.max(0, Number(anterior||0));
  const atu = Math.max(ant, Number(atual||0));
  const util = atu - ant;
  const franq = Math.max(0, Number(franquia||0));
  const valExc = Math.max(0, Number(valorExc||0));
  let exc = 0;
  let val = 0;
  if(modo === 'impressao'){
    // Por Impressão: multiplica total de páginas pelo valor página
    exc = util;
    val = util * valExc;
  } else if(modo === 'mes_fixo'){
    // Mês Fixo: valor fixo (excedente 0)
    exc = 0;
    val = 0;
  } else {
    // Global ou Individual: cobra só o que exceder a franquia
    exc = Math.max(0, util - franq);
    val = exc * valExc;
  }
  return { utilizado: util, excedente: exc, valorExcedente: val };
}

function calcContadoresChamado(antigo, atual){
  const ant = Math.max(0, Number(antigo||0));
  const atu = Math.max(ant, Number(atual||0));
  const qtd = atu - ant;
  return { contadorAntigo: ant, contadorAtual: atu, quantidadeImpressos: qtd };
}

function ehVencidoChamado(dataAbertura, status){
  if(!status || status === 'concluido' || status === 'cancelado') return false;
  if(!dataAbertura) return false;
  const hoje = new Date().toISOString().slice(0,10);
  const ab = String(dataAbertura).slice(0,10);
  return ab < hoje;
}

window.LOC_PURE = {
  ehEstoqueBaixo,
  calcLeituraExcedente,
  calcContadoresChamado,
  ehVencidoChamado
};

if(typeof window === 'undefined') return;

// ── 1. Substituir verificação de Estoque Mínimo no app.js e notificações (< no lugar de <=) ──
window.verificarEstoqueBaixo = function(){
  const sess = getSession(); if(!sess || !db || !db.produtos) return 0;
  return db.produtos.filter(p => p.empresaId === sess.empresaId && p.status !== 'inativo' &&
    ehEstoqueBaixo(p.estoque, p.estoqueMin)).length;
};

// Sobrescrever scanEstoqueBaixo do notificacoes_patch para usar ehEstoqueBaixo (<)
const _origScanEstoque = window.scanEstoqueBaixo;
window.scanEstoqueBaixo = function(){
  const sess = getSession(); if(!sess || !db || !db.produtos) return [];
  return db.produtos.filter(p => p.empresaId === sess.empresaId && p.status !== 'inativo' &&
    ehEstoqueBaixo(p.estoque, p.estoqueMin)).map(p => ({
      id: p.id,
      sku: p.sku,
      nome: p.nome,
      estoque: p.estoque,
      estoqueMin: p.estoqueMin,
      critico: p.estoque <= 0
    })).sort((a,b) => a.estoque - b.estoque);
};

// ── 2. Renderização Otimizada de Produtos (Sem A..Z, busca só no Enter, Tipo/Cat unificados) ──
window.renderProdutos = function(){
  const sess = getSession(); if(!sess) return;
  const view = document.getElementById('view-produtos');
  if(!view) return;

  const qEl = document.getElementById('search-produtos');
  const catEl = document.getElementById('filter-prod-cat');
  const sortCol = window.__prodSortCol || 'sku';
  const sortDir = window.__prodSortDir || 'asc';

  const search = (qEl?.value || '').trim().toLowerCase();
  const cat = catEl?.value || '';

  let list = db.produtos.filter(p => p.empresaId === sess.empresaId &&
    (!search || p.nome.toLowerCase().includes(search) || String(p.sku).toLowerCase().includes(search)) &&
    (!cat || p.categoria === cat));

  // Ordenação do menor para o maior (asc) por padrão
  list.sort((a,b) => {
    let A = a[sortCol] || '', B = b[sortCol] || '';
    if(typeof A === 'number' && typeof B === 'number'){
      return sortDir === 'asc' ? A - B : B - A;
    }
    const cmp = String(A).localeCompare(String(B), 'pt-BR', { sensitivity: 'base' });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const baixoCount = list.filter(p => ehEstoqueBaixo(p.estoque, p.estoqueMin)).length;
  const cardsEl = document.getElementById('cards-estoque');
  if(cardsEl){
    cardsEl.innerHTML = `
      <div class="rounded-[14px] bg-white border p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center"><i class="ph ph-package"></i></div>
        <div><p class="text-[11px] uppercase font-bold text-slate-500">Total SKUs</p><p class="text-[18px] font-bold">${list.length}</p></div>
      </div>
      <div class="rounded-[14px] bg-white border ${baixoCount ? 'border-red-300 bg-red-50/50' : ''} p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl ${baixoCount ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'} grid place-items-center"><i class="ph ph-warning"></i></div>
        <div><p class="text-[11px] uppercase font-bold text-slate-500">Estoque abaixo mín.</p><p class="text-[18px] font-bold ${baixoCount ? 'text-red-600' : ''}">${baixoCount}</p></div>
      </div>
      <div class="rounded-[14px] bg-white border p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><i class="ph ph-trend-up"></i></div>
        <div><p class="text-[11px] uppercase font-bold text-slate-500">Valor em Custo</p><p class="text-[18px] font-bold">${fmtMoney(list.reduce((s,p)=>s+((p.custo||0)*(p.estoque||0)),0))}</p></div>
      </div>
      <div class="rounded-[14px] bg-white border p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-[#e8eaf8] text-[#0a1e8a] grid place-items-center"><i class="ph ph-currency-dollar"></i></div>
        <div><p class="text-[11px] uppercase font-bold text-slate-500">Valor em Venda</p><p class="text-[18px] font-bold">${fmtMoney(list.reduce((s,p)=>s+((p.preco||0)*(p.estoque||0)),0))}</p></div>
      </div>
    `;
  }

  const listVis = list.slice(0, 300);
  const seta = col => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
  const th = (col, label) => `<th onclick="prodSort('${col}')" class="cursor-pointer select-none hover:text-[#0a1e8a] px-5 py-3">${label}${seta(col)}</th>`;

  const tbodyEl = document.getElementById('tbody-produtos');
  if(tbodyEl){
    tbodyEl.innerHTML = listVis.map(p => {
      const isLow = ehEstoqueBaixo(p.estoque, p.estoqueMin);
      return `
        <tr class="hover:bg-slate-50 ${isLow ? 'bg-red-50/40' : ''}">
          <td class="px-5 py-3"><div><p class="font-mono text-[11px] text-slate-500">${escapeHtml(p.sku||'')}</p><p class="font-semibold text-[13px]">${escapeHtml(p.nome||'')}</p><p class="text-[11px] text-slate-500">Criado por <b>${escapeHtml(p.criadoPorNome||'-')}</b> • ${fmtDate(p.criadoEm||p.createdAt)}</p></div></td>
          <td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold">${escapeHtml(p.categoria||'Produto')}</span></td>
          <td class="px-5 py-3"><p class="font-bold ${isLow ? 'text-red-600' : ''}">${p.estoque||0} un</p><p class="text-[11px] text-slate-500">mín. ${p.estoqueMin||0}</p></td>
          <td class="px-5 py-3"><p class="text-[12px]">${fmtMoney(p.custo||0)} → <b>${fmtMoney(p.preco||0)}</b></p></td>
          <td class="px-5 py-3"><span class="font-mono text-[11px] px-2 py-1 rounded bg-slate-100 border">${escapeHtml(p.local||'-')}</span></td>
          <td class="px-5 py-3 text-right"><div class="flex justify-end gap-1"><button onclick="openModal('produto','${p.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100" title="Alterar"><i class="ph ph-pencil"></i></button><button onclick="deleteProduto('${p.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Excluir"><i class="ph ph-trash"></i></button></div></td>
        </tr>
      `;
    }).join('') + (list.length > 300 ? `<tr><td colspan="6" class="px-5 py-3 text-center text-slate-500 text-[12px]">Mostrando 300 de ${list.length} produtos</td></tr>` : '');
  }

  // Garantir que o input de busca busque APENAS no Enter ou Lupa (sem oninput)
  if(qEl && !qEl.getAttribute('data-enter-bound')){
    qEl.setAttribute('data-enter-bound', '1');
    qEl.removeAttribute('oninput');
    qEl.onkeydown = function(e){ if(e.key === 'Enter') renderProdutos(); };
  }
};

window.prodSort = function(col){
  if(window.__prodSortCol === col){
    window.__prodSortDir = window.__prodSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    window.__prodSortCol = col;
    window.__prodSortDir = 'asc'; // Padrão: do menor para o maior
  }
  renderProdutos();
};

// ── 3. Modal Completo e Limpo de Produto (Categoria unificada, estoque fixo, sem varejo/promoção) ──
window.renderModalProduto = function(id){
  const sess = getSession(); if(!sess) return;
  const isEdit = !!id;
  const p = isEdit ? db.produtos.find(x => x.id === id && x.empresaId === sess.empresaId) : {
    sku: uid('prd'), nome: '', categoria: 'Produto', fabricante: '',
    estoque: 0, estoqueMin: 0, custo: 0, preco: 0, local: '', ncm: '', origem: '0 - Nacional', estoqueInfinito: false
  };
  if(!p) return toast('Produto não encontrado', 'error');

  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[700px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  document.getElementById('modal-title').innerText = isEdit ? 'Alterar Produto — ' + p.sku : 'Novo Cadastro de Produto';

  const categorias = ['Produto', 'Serviço', 'Cartucho', 'Cartucho Vazio', 'Insumo', 'Equipamento', 'Impressora', 'Chip', 'Compatível', 'Informática', 'Original', 'Outros'];
  const catSel = categorias.map(c => `<option ${p.categoria===c?'selected':''}>${c}</option>`).join('');

  document.getElementById('modal-body').innerHTML = `
    <div class="space-y-4 text-[13px]">
      <!-- ABAS SUPERIORES -->
      <div class="flex border-b gap-4 font-bold text-[13px] text-slate-500">
        <button type="button" onclick="mudarAbaProd('basico')" id="tab-prod-basico" class="pb-2 border-b-2 border-[#0a1e8a] text-[#0a1e8a]">Dados Básicos</button>
        <button type="button" onclick="mudarAbaProd('estoque')" id="tab-prod-estoque" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Estoque / Custos</button>
        <button type="button" onclick="mudarAbaProd('nf')" id="tab-prod-nf" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Nota Fiscal (Em breve)</button>
      </div>

      <div id="painel-prod-basico" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Código / SKU</label>
            <input id="p-sku" value="${escapeHtml(p.sku||'')}" class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono">
          </div>
          <div class="md:col-span-2">
            <label class="block font-bold text-slate-600 mb-1">Categoria / Tipo de Cadastro</label>
            <div class="flex gap-2">
              <select id="p-cat" class="w-full h-10 px-3 rounded-xl border font-semibold">${catSel}</select>
            </div>
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Descrição do Produto *</label>
          <input id="p-nome" value="${escapeHtml(p.nome||'')}" class="w-full h-10 px-3 rounded-xl border font-semibold" placeholder="Ex.: TONER HP 85A PRETO">
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Fabricante / Marca</label>
            <input id="p-fab" value="${escapeHtml(p.fabricante||'')}" class="w-full h-10 px-3 rounded-xl border" placeholder="HP, Samsung, Epson...">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Valor Venda R$ (Auxiliar para Vendas)</label>
            <input id="p-preco" type="number" step="0.01" value="${p.preco||0}" class="w-full h-10 px-3 rounded-xl border font-bold text-[#0a1e8a]">
            <p class="text-[11px] text-slate-400 mt-1">Este valor é sugerido ao lançar uma venda, mas pode ser mudado na hora.</p>
          </div>
        </div>
      </div>

      <div id="painel-prod-estoque" class="hidden space-y-4">
        <label class="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-[12px] text-blue-900 font-semibold cursor-pointer">
          <input id="p-estoque-infinito" type="checkbox" ${p.estoqueInfinito?'checked':''} onchange="alternarEstoqueInfinito()" class="w-4 h-4 accent-[#0a1e8a]">
          <span><i class="ph ph-infinity"></i> Não controlar estoque deste produto (estoque infinito)</span>
        </label>
        <div id="p-campos-estoque">
        <div class="rounded-xl bg-slate-50 border p-3 text-[12px] text-slate-600 font-medium">
          Quando marcado, o produto fica sempre disponível e não é descontado nas vendas.
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Estoque Atual</label>
            <input id="p-est" type="number" value="${p.estoque||0}" class="w-full h-10 px-3 rounded-xl border font-bold">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Estoque Mínimo</label>
            <input id="p-est-min" type="number" value="${p.estoqueMin||0}" class="w-full h-10 px-3 rounded-xl border">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Estoque Ideal</label>
            <input id="p-est-ideal" type="number" value="${p.estoqueIdeal||0}" class="w-full h-10 px-3 rounded-xl border">
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Custo Total R$</label>
            <input id="p-custo" type="number" step="0.01" value="${p.custo||0}" class="w-full h-10 px-3 rounded-xl border">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Localização no Almoxarifado</label>
            <input id="p-local" value="${escapeHtml(p.local||'')}" class="w-full h-10 px-3 rounded-xl border" placeholder="Prateleira / Setor">
          </div>
        </div>
        </div>
      </div>

      <div id="painel-prod-nf" class="hidden space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Origem do Produto</label>
            <select id="p-origem" class="w-full h-10 px-3 rounded-xl border">
              <option>0 - Nacional, exceto as indicadas nos códigos 3 a 5</option>
              <option>1 - Estrangeira - Importação direta</option>
              <option>2 - Estrangeira - Adquirida no mercado interno</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Código NCM</label>
            <input id="p-ncm" value="${escapeHtml(p.ncm||'')}" class="w-full h-10 px-3 rounded-xl border" placeholder="0000.00.00">
          </div>
        </div>
        <p class="text-[12px] text-slate-500">Estrutura preparada para emissão de Nota Fiscal (NF-e/NFC-e).</p>
      </div>
    </div>
  `;
  document.getElementById('modal-footer').innerHTML = `
    <button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button>
    <button onclick="salvarProdutoModal('${p.id||''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>
  `;
  document.getElementById('modal-root').classList.remove('hidden');
  window.modalContext = { type: 'produto', id };
  alternarEstoqueInfinito();
};

window.alternarEstoqueInfinito = function(){
  const infinito = !!document.getElementById('p-estoque-infinito')?.checked;
  ['p-est','p-est-min','p-est-ideal','p-custo','p-local'].forEach(id=>{
    const el=document.getElementById(id); if(el){ el.disabled=infinito; el.classList.toggle('bg-slate-100',infinito); }
  });
};

window.mudarAbaProd = function(aba){
  ['basico', 'estoque', 'nf'].forEach(a => {
    const p = document.getElementById('painel-prod-' + a);
    const b = document.getElementById('tab-prod-' + a);
    if(p) p.classList.toggle('hidden', a !== aba);
    if(b){
      b.classList.toggle('border-[#0a1e8a]', a === aba);
      b.classList.toggle('text-[#0a1e8a]', a === aba);
      b.classList.toggle('border-transparent', a !== aba);
    }
  });
};

window.salvarProdutoModal = function(id){
  const sess = getSession(); if(!sess) return;
  const nome = document.getElementById('p-nome')?.value?.trim();
  if(!nome) return toast('Informe a descrição do produto', 'error');
  const payload = {
    empresaId: sess.empresaId,
    sku: document.getElementById('p-sku')?.value?.trim() || uid('prd'),
    nome: window.VOTM_PURE ? window.VOTM_PURE.toTitleCase(nome) : nome,
    categoria: document.getElementById('p-cat')?.value || 'Produto',
    fabricante: document.getElementById('p-fab')?.value?.trim() || '',
    estoqueInfinito: !!document.getElementById('p-estoque-infinito')?.checked,
    estoque: document.getElementById('p-estoque-infinito')?.checked ? 0 : (parseInt(document.getElementById('p-est')?.value || 0) || 0),
    estoqueMin: parseInt(document.getElementById('p-est-min')?.value || 0) || 0,
    estoqueIdeal: parseInt(document.getElementById('p-est-ideal')?.value || 0) || 0,
    custo: parseFloat(document.getElementById('p-custo')?.value || 0) || 0,
    preco: parseFloat(document.getElementById('p-preco')?.value || 0) || 0,
    local: document.getElementById('p-local')?.value?.trim() || '',
    ncm: document.getElementById('p-ncm')?.value?.trim() || '',
    origem: document.getElementById('p-origem')?.value || '0 - Nacional',
    status: 'ativo'
  };
  if(id){
    const existing = db.produtos.find(p => p.id === id && p.empresaId === sess.empresaId);
    if(existing){
      Object.assign(existing, payload, { atualizadoEm: new Date().toISOString(), atualizadoPorNome: sess.usuarioNome });
      logAction('produto', 'editar', id, `Produto ${payload.nome} alterado por ${sess.usuarioNome}`);
    }
  } else {
    const novo = {
      id: uid('prd'),
      criadoEm: new Date().toISOString(),
      criadoPor: sess.usuarioId,
      criadoPorNome: sess.usuarioNome,
      ...payload
    };
    db.produtos.push(novo);
    logAction('produto', 'criar', novo.id, `Produto ${payload.nome} cadastrado por ${sess.usuarioNome}`);
  }
  saveDB();
  closeModal();
  renderProdutos();
  if(typeof renderAuditoria === 'function') renderAuditoria();
  toast('Produto salvo com sucesso!', 'success');
};

// ── 4. Tela Completa do Contrato (`openContratoCompleto(id)`) com Resumo, KPIs e Abas ──
window.openContratoCompleto = function(contratoId){
  const sess = getSession(); if(!sess) return;
  const c = db.contratos.find(x => x.id === contratoId && x.empresaId === sess.empresaId);
  if(!c) return toast('Contrato não encontrado', 'error');
  const cli = db.clientes.find(x => x.id === c.clienteId) || {};
  const maquinas = db.parque.filter(p => p.contratoId === c.id && p.status === 'ativo');
  const chamadosAbertos = db.os.filter(o => o.clienteId === c.clienteId && o.status !== 'concluido').length;
  const leiturasCount = db.leituras.filter(l => l.contratoId === c.id).length;

  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[960px] rounded-[22px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText = `Contrato Locação — ${c.numero} • ${cli.nome||'Cliente'}`;

  document.getElementById('modal-body').innerHTML = `
    <div class="space-y-6 text-[13px]">
      <!-- HEADER CONTRATO -->
      <div class="rounded-[18px] bg-gradient-to-r from-[#0a1e8a] to-[#142ecc] text-white p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p class="text-[11px] uppercase font-bold tracking-widest text-white/70">Cliente Contratante</p>
          <h3 class="text-[20px] font-extrabold mt-1">${escapeHtml(cli.nome||'Sem Cliente')}</h3>
          <p class="text-[12px] text-white/80 mt-1">${escapeHtml(cli.documento||'')} • ${escapeHtml(cli.cidade||'')}/${escapeHtml(cli.estado||'')}</p>
        </div>
        <div class="text-right">
          <p class="text-[11px] uppercase font-bold text-white/70">Vigência do Contrato</p>
          <p class="font-bold text-[15px] mt-1">${fmtDate(c.dataInicio)} até ${fmtDate(c.dataFim)}</p>
          <p class="text-[11px] text-white/80 mt-1">Status: <b class="uppercase">${c.status}</b></p>
        </div>
      </div>

      <!-- CARDS DE KPIS DO CONTRATO -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-[16px] border bg-emerald-50/70 border-emerald-200 p-4">
          <p class="text-[11px] font-bold uppercase text-emerald-800">Impressoras Alocadas</p>
          <p class="text-[26px] font-extrabold text-emerald-700 mt-1">${maquinas.length}</p>
          <p class="text-[11px] text-emerald-600 mt-1">Conectadas no Parque</p>
        </div>
        <div class="rounded-[16px] border bg-amber-50/70 border-amber-200 p-4">
          <p class="text-[11px] font-bold uppercase text-amber-800">Chamados em Aberto</p>
          <p class="text-[26px] font-extrabold text-amber-700 mt-1">${chamadosAbertos}</p>
          <p class="text-[11px] text-amber-600 mt-1">Em atendimento / corretivo</p>
        </div>
        <div class="rounded-[16px] border bg-blue-50/70 border-blue-200 p-4">
          <p class="text-[11px] font-bold uppercase text-blue-800">Valor Mensal Fixo R$</p>
          <p class="text-[22px] font-extrabold text-blue-700 mt-1">${fmtMoney(c.valorMensalFixo||0)}</p>
          <p class="text-[11px] text-blue-600 mt-1">Franquia PB: ${Number(c.franquiaPB||0).toLocaleString()} pág</p>
        </div>
        <div class="rounded-[16px] border bg-purple-50/70 border-purple-200 p-4">
          <p class="text-[11px] font-bold uppercase text-purple-800">Leituras Lançadas</p>
          <p class="text-[26px] font-extrabold text-purple-700 mt-1">${leiturasCount}</p>
          <p class="text-[11px] text-purple-600 mt-1">Contadores e medições</p>
        </div>
      </div>

      <!-- BOTÕES PRINCIPAIS DE AÇÃO DO CONTRATO -->
      <div class="flex flex-wrap gap-3">
        <button onclick="abrirLeiturasContrato('${c.id}')" class="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-sm">
          <i class="ph ph-speedometer text-[18px]"></i> Leituras do Contrato (${leiturasCount})
        </button>
        <button onclick="abrirChamadosContrato('${c.id}')" class="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-sm">
          <i class="ph ph-wrench text-[18px]"></i> Chamados Técnicos (${chamadosAbertos})
        </button>
        <button onclick="abrirModalEquipamentoContrato('${c.id}', null)" class="h-11 px-5 rounded-xl bg-[#0a1e8a] hover:bg-[#08176e] text-white font-bold flex items-center gap-2 ml-auto shadow-sm">
          <i class="ph ph-printer text-[18px]"></i> + Nova Impressora
        </button>
      </div>

      <!-- ABAS DO CONTRATO: ESSENCIAIS, CONTATO, ENDEREÇO, IMPRESSORAS -->
      <div class="border-b flex gap-6 font-bold text-[13.5px] text-slate-500">
        <button type="button" onclick="mudarAbaContrato('essenciais')" id="tab-ctr-essenciais" class="pb-2 border-b-2 border-[#0a1e8a] text-[#0a1e8a]">Dados Essenciais</button>
        <button type="button" onclick="mudarAbaContrato('contato')" id="tab-ctr-contato" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Contato</button>
        <button type="button" onclick="mudarAbaContrato('end')" id="tab-ctr-end" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Endereço</button>
        <button type="button" onclick="mudarAbaContrato('impressoras')" id="tab-ctr-impressoras" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Impressoras (${maquinas.length})</button>
      </div>

      <div id="painel-ctr-essenciais" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Número do Contrato</label>
            <input id="c-num" value="${escapeHtml(c.numero||'')}" class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Data Início</label>
            <input id="c-ini" type="date" value="${(c.dataInicio||'').slice(0,10)}" class="w-full h-10 px-3 rounded-xl border">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Data Fim / Vencimento</label>
            <input id="c-fim" type="date" value="${(c.dataFim||'').slice(0,10)}" class="w-full h-10 px-3 rounded-xl border">
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Franquia Global PB (pág)</label>
            <input id="c-franq-pb" type="number" value="${c.franquiaPB||0}" class="w-full h-10 px-3 rounded-xl border">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Franquia Global Cor (pág)</label>
            <input id="c-franq-cor" type="number" value="${c.franquiaCor||0}" class="w-full h-10 px-3 rounded-xl border">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Valor Mensal Fixo (R$)</label>
            <input id="c-valor" type="number" step="0.01" value="${c.valorMensalFixo||0}" class="w-full h-10 px-3 rounded-xl border font-bold text-[#0a1e8a]">
          </div>
        </div>
      </div>

      <div id="painel-ctr-contato" class="hidden space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Pessoa de Contato</label>
            <input id="c-contato" value="${escapeHtml(cli.contato||cli.nome||'')}" class="w-full h-10 px-3 rounded-xl border" placeholder="Nome do responsável">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Telefone / Celular</label>
            <input id="c-fone" value="${escapeHtml(cli.telefone||'')}" class="w-full h-10 px-3 rounded-xl border" placeholder="(00) 00000-0000">
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">E-mail para envio de contadores</label>
          <input id="c-email" value="${escapeHtml(cli.email||'')}" class="w-full h-10 px-3 rounded-xl border" placeholder="contato@empresa.com.br">
        </div>
      </div>

      <div id="painel-ctr-end" class="hidden space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block font-bold text-slate-600 mb-1">CEP (Busca ViaCEP)</label>
            <div class="flex gap-1">
              <input id="c-cep" value="${escapeHtml(cli.cep||'')}" class="w-full h-10 px-3 rounded-xl border" onblur="if(typeof getCepCliente==='function') getCepCliente(this.value, 'c-end', 'c-bairro', 'c-cid', 'c-uf')">
              <button type="button" onclick="if(typeof getCepCliente==='function') getCepCliente(document.getElementById('c-cep').value, 'c-end', 'c-bairro', 'c-cid', 'c-uf')" class="px-3 h-10 rounded-xl bg-slate-100"><i class="ph ph-magnifying-glass"></i></button>
            </div>
          </div>
          <div class="md:col-span-2">
            <label class="block font-bold text-slate-600 mb-1">Endereço / Rua</label>
            <input id="c-end" value="${escapeHtml(cli.endereco||'')}" class="w-full h-10 px-3 rounded-xl border">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Número</label>
            <input id="c-num-end" value="${escapeHtml(cli.numero||'')}" class="w-full h-10 px-3 rounded-xl border">
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Bairro</label>
            <input id="c-bairro" value="${escapeHtml(cli.bairro||'')}" class="w-full h-10 px-3 rounded-xl border">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Cidade</label>
            <input id="c-cid" value="${escapeHtml(cli.cidade||'')}" class="w-full h-10 px-3 rounded-xl border">
          </div>
          <div>
            <label class="block font-bold text-slate-600 mb-1">Estado (UF)</label>
            <input id="c-uf" value="${escapeHtml(cli.estado||'')}" class="w-full h-10 px-3 rounded-xl border">
          </div>
        </div>
      </div>

      <div id="painel-ctr-impressoras" class="hidden space-y-3">
        <div class="flex justify-between items-center">
          <p class="font-bold text-slate-700">Lista de Máquinas Alocadas neste Contrato</p>
          <button onclick="abrirModalEquipamentoContrato('${c.id}', null)" class="h-9 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]">+ Nova Impressora</button>
        </div>
        <div class="overflow-auto max-h-[340px] border rounded-xl">
          <table class="w-full text-left text-[12.5px]">
            <thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500">
              <tr><th class="px-4 py-2.5">Patrimônio / Série</th><th class="px-4 py-2.5">Equipamento</th><th class="px-4 py-2.5">Departamento / Local</th><th class="px-4 py-2.5">Contador PB/Cor</th><th class="px-4 py-2.5">Modalidade</th><th></th></tr>
            </thead>
            <tbody class="divide-y">
              ${maquinas.map(m => {
                const eq = db.equipamentos.find(x => x.id === m.equipamentoId) || {};
                return `
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-2.5"><p class="font-bold font-mono">${escapeHtml(eq.patrimonio||'-')}</p><p class="text-[11px] text-slate-500 font-mono">${escapeHtml(eq.serie||'')}</p></td>
                    <td class="px-4 py-2.5 font-semibold">${escapeHtml(eq.modelo||'Impressora')}</td>
                    <td class="px-4 py-2.5"><p>${escapeHtml(m.setor||'-')}</p><p class="text-[11px] text-slate-500">${escapeHtml(m.localInstalacao||'')}</p></td>
                    <td class="px-4 py-2.5 font-mono text-[11px]">PB: ${Number(eq.contadorPB||0).toLocaleString()}<br>COR: ${Number(eq.contadorCor||0).toLocaleString()}</td>
                    <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold uppercase">${m.modalidade||'global'}</span></td>
                    <td class="px-4 py-2.5 text-right"><button onclick="abrirModalEquipamentoContrato('${c.id}', '${m.id}')" class="w-8 h-8 rounded-lg hover:bg-slate-100" title="Editar"><i class="ph ph-pencil"></i></button></td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="6" class="p-8 text-center text-slate-400">Nenhuma impressora alocada neste contrato</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-footer').innerHTML = `
    <button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>
    <button onclick="salvarContratoCompleto('${c.id}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Contrato</button>
  `;
  document.getElementById('modal-root').classList.remove('hidden');
  window.modalContext = { type: 'contratoCompleto', id: c.id };
};

window.mudarAbaContrato = function(aba){
  ['essenciais', 'contato', 'end', 'impressoras'].forEach(a => {
    const p = document.getElementById('painel-ctr-' + a);
    const b = document.getElementById('tab-ctr-' + a);
    if(p) p.classList.toggle('hidden', a !== aba);
    if(b){
      b.classList.toggle('border-[#0a1e8a]', a === aba);
      b.classList.toggle('text-[#0a1e8a]', a === aba);
      b.classList.toggle('border-transparent', a !== aba);
    }
  });
};

window.salvarContratoCompleto = function(id){
  const sess = getSession(); if(!sess) return;
  const c = db.contratos.find(x => x.id === id && x.empresaId === sess.empresaId);
  if(!c) return;
  c.numero = document.getElementById('c-num')?.value?.trim() || c.numero;
  c.dataInicio = document.getElementById('c-ini')?.value || c.dataInicio;
  c.dataFim = document.getElementById('c-fim')?.value || c.dataFim;
  c.franquiaPB = parseInt(document.getElementById('c-franq-pb')?.value || 0) || 0;
  c.franquiaCor = parseInt(document.getElementById('c-franq-cor')?.value || 0) || 0;
  c.valorMensalFixo = parseFloat(document.getElementById('c-valor')?.value || 0) || 0;

  const cli = db.clientes.find(x => x.id === c.clienteId);
  if(cli){
    cli.contato = document.getElementById('c-contato')?.value?.trim() || cli.contato;
    cli.telefone = document.getElementById('c-fone')?.value?.trim() || cli.telefone;
    cli.email = document.getElementById('c-email')?.value?.trim() || cli.email;
    cli.cep = document.getElementById('c-cep')?.value?.trim() || cli.cep;
    cli.endereco = document.getElementById('c-end')?.value?.trim() || cli.endereco;
    cli.numero = document.getElementById('c-num-end')?.value?.trim() || cli.numero;
    cli.bairro = document.getElementById('c-bairro')?.value?.trim() || cli.bairro;
    cli.cidade = document.getElementById('c-cid')?.value?.trim() || cli.cidade;
    cli.estado = document.getElementById('c-uf')?.value?.trim() || cli.estado;
  }
  c.atualizadoEm = new Date().toISOString();
  c.atualizadoPorNome = sess.usuarioNome;
  logAction('contrato', 'editar_completo', c.id, `Contrato ${c.numero} alterado por ${sess.usuarioNome}`);
  saveDB();
  closeModal();
  if(typeof renderContratos === 'function') renderContratos();
  toast('Contrato salvo com sucesso!', 'success');
};

// ── 5. Cadastro de Impressora no Contrato (Reconhecimento Serial/Patr e 0 como contador) ──
window.abrirModalEquipamentoContrato = function(contratoId, parqueId){
  const sess = getSession(); if(!sess) return;
  const c = db.contratos.find(x => x.id === contratoId && x.empresaId === sess.empresaId);
  if(!c) return;
  const isEdit = !!parqueId;
  const p = isEdit ? db.parque.find(x => x.id === parqueId) : {
    id: uid('prq'), contratoId: c.id, clienteId: c.clienteId, equipamentoId: null,
    setor: 'Geral', localInstalacao: '', modalidade: 'global', franquiaPB: 0, valorExcedentePB: 0.05,
    status: 'ativo'
  };

  const eq = p.equipamentoId ? db.equipamentos.find(x => x.id === p.equipamentoId) : null;

  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[760px] rounded-[22px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  document.getElementById('modal-title').innerText = isEdit ? `Alterar Impressora do Contrato — ${eq ? eq.patrimonio : ''}` : `Nova Impressora no Contrato — ${c.numero}`;

  document.getElementById('modal-body').innerHTML = `
    <div class="space-y-4 text-[13px]">
      <!-- RECONHECIMENTO SERIAL / PATRIMÔNIO -->
      <div class="rounded-xl bg-blue-50/70 border border-blue-200 p-4">
        <label class="block font-bold text-blue-900 mb-1">Digite o Serial ou Patrimônio da Impressora:</label>
        <div class="flex gap-2">
          <input id="pe-busca-id" value="${eq ? (eq.serie || eq.patrimonio || '') : ''}" class="flex-1 h-10 px-3 rounded-xl border font-mono font-bold uppercase" placeholder="Serial (ex.: Z5W1B...) ou Patrimônio (ex.: 516)">
          <button type="button" onclick="reconhecerImpressoraContrato()" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold flex items-center gap-1.5"><i class="ph ph-magnifying-glass"></i> Reconhecer / Buscar</button>
        </div>
        <p class="text-[11.5px] text-blue-700 mt-1">Se a impressora já existe no sistema, ela é reconhecida automaticamente. Senão, um cadastro é criado na hora.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block font-bold text-slate-600 mb-1">Modelo da Impressora *</label>
          <input id="pe-mod" value="${escapeHtml(eq ? eq.modelo : '')}" class="w-full h-10 px-3 rounded-xl border font-bold">
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Patrimônio</label>
          <input id="pe-patr" value="${escapeHtml(eq ? eq.patrimonio : '')}" class="w-full h-10 px-3 rounded-xl border font-mono">
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Número de Série</label>
          <input id="pe-serie" value="${escapeHtml(eq ? eq.serie : '')}" class="w-full h-10 px-3 rounded-xl border font-mono">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-600 mb-1">Departamento</label>
          <input id="pe-dept" value="${escapeHtml(p.setor||'Geral')}" class="w-full h-10 px-3 rounded-xl border" placeholder="Ex.: RH, Obras, Contabilidade">
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Local de Instalação</label>
          <input id="pe-local" value="${escapeHtml(p.localInstalacao||'')}" class="w-full h-10 px-3 rounded-xl border" placeholder="Sala / Prédio">
        </div>
      </div>

      <!-- MODALIDADES DE LOCAÇÃO (Global, Individual, Impressão, Mês Fixo, Inativo) -->
      <div class="border-t pt-4">
        <label class="block font-bold text-slate-700 mb-2">Modalidade de Cobrança / Leitura (Preto A4 padrão):</label>
        <div class="flex flex-wrap gap-4 bg-slate-50 border rounded-xl p-3 font-semibold text-[13px]">
          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="pe-modalidade" value="global" ${p.modalidade==='global'?'checked':''} onchange="mudarModalidadePE('global')"> Global</label>
          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="pe-modalidade" value="individual" ${p.modalidade==='individual'?'checked':''} onchange="mudarModalidadePE('individual')"> Individual</label>
          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="pe-modalidade" value="impressao" ${p.modalidade==='impressao'?'checked':''} onchange="mudarModalidadePE('impressao')"> Por Impressão</label>
          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="pe-modalidade" value="mes_fixo" ${p.modalidade==='mes_fixo'?'checked':''} onchange="mudarModalidadePE('mes_fixo')"> Mês Fixo</label>
          <label class="flex items-center gap-2 cursor-pointer text-slate-500"><input type="radio" name="pe-modalidade" value="inativo" ${p.status==='inativo'?'checked':''} onchange="mudarModalidadePE('inativo')"> Inativo (Ocultar)</label>
        </div>
      </div>

      <!-- CAMPOS DE CONTADORES E FRANQUIA -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block font-bold text-slate-600 mb-1">Contador Anterior (Cont. Ant.)</label>
          <input id="pe-cont-ant" type="number" value="${eq && eq.contadorPB != null ? eq.contadorPB : 0}" class="w-full h-10 px-3 rounded-xl border font-mono font-bold text-[#0a1e8a]">
          <p class="text-[11px] text-slate-400 mt-0.5">O valor 0 é aceito como contador válido.</p>
        </div>
        <div id="box-franq-ind" class="${p.modalidade==='individual'?'':'hidden'}">
          <label class="block font-bold text-slate-600 mb-1">Franquia Individual (pág)</label>
          <input id="pe-franq" type="number" value="${p.franquiaPB||0}" class="w-full h-10 px-3 rounded-xl border font-bold">
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Valor Excedente / Página (R$)</label>
          <input id="pe-val-exc" type="number" step="0.001" value="${p.valorExcedentePB||0.05}" class="w-full h-10 px-3 rounded-xl border font-bold text-emerald-700">
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-footer').innerHTML = `
    <button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button>
    <button onclick="salvarImpressoraContrato('${c.id}', '${p.id||''}', ${isEdit})" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Impressora</button>
  `;
  document.getElementById('modal-root').classList.remove('hidden');
};

window.reconhecerImpressoraContrato = function(){
  const sess = getSession(); if(!sess) return;
  const k = document.getElementById('pe-busca-id')?.value?.trim()?.toUpperCase();
  if(!k) return toast('Digite o Serial ou Patrimônio para buscar', 'info');
  const eq = db.equipamentos.find(e => e.empresaId === sess.empresaId && (String(e.serie).toUpperCase() === k || String(e.patrimonio).toUpperCase() === k));
  if(eq){
    if(document.getElementById('pe-mod')) document.getElementById('pe-mod').value = eq.modelo || '';
    if(document.getElementById('pe-patr')) document.getElementById('pe-patr').value = eq.patrimonio || '';
    if(document.getElementById('pe-serie')) document.getElementById('pe-serie').value = eq.serie || '';
    if(document.getElementById('pe-cont-ant')) document.getElementById('pe-cont-ant').value = eq.contadorPB || 0;
    toast(`Impressora reconhecida: ${eq.modelo} (Patr. ${eq.patrimonio})`, 'success');
  } else {
    toast('Impressora ainda não cadastrada. Preencha os campos para criar agora.', 'info');
  }
};

window.mudarModalidadePE = function(mod){
  const boxInd = document.getElementById('box-franq-ind');
  if(boxInd) boxInd.classList.toggle('hidden', mod !== 'individual');
};

window.salvarImpressoraContrato = function(contratoId, parqueId, isEdit){
  const sess = getSession(); if(!sess) return;
  const c = db.contratos.find(x => x.id === contratoId);
  if(!c) return;
  const serie = document.getElementById('pe-serie')?.value?.trim() || '';
  const patr = document.getElementById('pe-patr')?.value?.trim() || serie || uid('pat');
  const modelo = document.getElementById('pe-mod')?.value?.trim();
  if(!modelo) return toast('Informe o Modelo da Impressora', 'error');

  let eq = db.equipamentos.find(e => e.empresaId === sess.empresaId && (String(e.serie) === serie || String(e.patrimonio) === patr));
  const contAnt = parseInt(document.getElementById('pe-cont-ant')?.value || 0) || 0;
  if(!eq){
    eq = {
      id: uid('eq'),
      empresaId: sess.empresaId,
      modelo: window.VOTM_PURE ? window.VOTM_PURE.toTitleCase(modelo) : modelo,
      serie: serie || patr,
      patrimonio: patr,
      contadorPB: contAnt,
      contadorCor: 0,
      status: 'locado',
      criadoEm: new Date().toISOString(),
      criadoPorNome: sess.usuarioNome
    };
    db.equipamentos.push(eq);
  } else {
    eq.contadorPB = contAnt;
    eq.status = 'locado';
  }

  const modSel = document.querySelector('input[name="pe-modalidade"]:checked')?.value || 'global';
  const statusPrq = modSel === 'inativo' ? 'inativo' : 'ativo';

  if(isEdit){
    const p = db.parque.find(x => x.id === parqueId);
    if(p){
      p.setor = document.getElementById('pe-dept')?.value?.trim() || 'Geral';
      p.localInstalacao = document.getElementById('pe-local')?.value?.trim() || '';
      p.modalidade = modSel === 'inativo' ? 'global' : modSel;
      p.franquiaPB = parseInt(document.getElementById('pe-franq')?.value || 0) || 0;
      p.valorExcedentePB = parseFloat(document.getElementById('pe-val-exc')?.value || 0) || 0;
      p.status = statusPrq;
    }
  } else {
    const novoPrq = {
      id: uid('prq'),
      empresaId: sess.empresaId,
      contratoId: c.id,
      clienteId: c.clienteId,
      equipamentoId: eq.id,
      setor: document.getElementById('pe-dept')?.value?.trim() || 'Geral',
      localInstalacao: document.getElementById('pe-local')?.value?.trim() || '',
      modalidade: modSel === 'inativo' ? 'global' : modSel,
      franquiaPB: parseInt(document.getElementById('pe-franq')?.value || 0) || 0,
      valorExcedentePB: parseFloat(document.getElementById('pe-val-exc')?.value || 0) || 0.05,
      status: statusPrq,
      dataInstalacao: new Date().toISOString()
    };
    db.parque.push(novoPrq);
  }

  logAction('contrato', 'salvar_impressora', c.id, `Impressora ${eq.modelo} salva por ${sess.usuarioNome}`);
  saveDB();
  closeModal();
  openContratoCompleto(c.id);
  if(typeof renderContratos === 'function') renderContratos();
  toast('Impressora salva no contrato com sucesso!', 'success');
};

// ── 6. Leituras do Contrato (Cálculo automático de franquia/excedente e PDF Modelo 2.1) ──
window.abrirLeiturasContrato = function(contratoId){
  const sess = getSession(); if(!sess) return;
  const c = db.contratos.find(x => x.id === contratoId);
  if(!c) return;
  const cli = db.clientes.find(x => x.id === c.clienteId) || {};
  const maquinas = db.parque.filter(p => p.contratoId === c.id && p.status === 'ativo');
  const leituras = db.leituras.filter(l => l.contratoId === c.id).sort((a,b) => new Date(b.dataLeitura) - new Date(a.dataLeitura));

  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[940px] rounded-[22px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText = `Leituras Coletivas — Contrato ${c.numero} • ${cli.nome||''}`;

  const totalUtil = leituras.reduce((s, l) => s + (l.consumoPB||0), 0);
  const totalExc = leituras.reduce((s, l) => s + (l.valorExcedente||0), 0);

  document.getElementById('modal-body').innerHTML = `
    <div class="space-y-4 text-[13px]">
      <div class="flex flex-wrap justify-between items-center gap-3 bg-slate-50 p-3 rounded-xl border">
        <div class="flex gap-2">
          <button onclick="lancarLeituraColetivaContrato('${c.id}')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] hover:bg-[#08176e] text-white font-bold flex items-center gap-2">
            <i class="ph ph-plus-circle text-[18px]"></i> Lançar Nova Leitura
          </button>
          <button onclick="imprimirRelatorioLeiturasPDF('${c.id}')" class="h-10 px-5 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2">
            <i class="ph ph-printer text-[18px]"></i> Imprimir Relatório (PDF 2.1)
          </button>
        </div>
        <div class="flex gap-4 text-right">
          <div><p class="text-[11px] text-slate-500 font-bold uppercase">Total Utilizado</p><p class="font-extrabold text-[16px]">${totalUtil} pág</p></div>
          <div><p class="text-[11px] text-slate-500 font-bold uppercase">Soma Excedentes</p><p class="font-extrabold text-[16px] text-emerald-700">${fmtMoney(totalExc)}</p></div>
        </div>
      </div>

      <div class="overflow-auto max-h-[460px] border rounded-xl">
        <table class="w-full text-left text-[12.5px]">
          <thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500 sticky top-0">
            <tr><th class="px-4 py-3">Data Lançamento</th><th class="px-4 py-3">Patrimônio / Equipamento</th><th class="px-4 py-3">Contadores PB</th><th class="px-4 py-3">Utilizado</th><th class="px-4 py-3">Qtd Exced.</th><th class="px-4 py-3">Valor Exced.</th><th class="px-4 py-3">Por</th><th></th></tr>
          </thead>
          <tbody class="divide-y">
            ${leituras.map(l => {
              const eq = db.equipamentos.find(x => x.id === l.equipamentoId) || {};
              return `
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-2.5"><b>${fmtDate(l.dataLeitura)}</b><br><span class="text-[11px] text-slate-500">${(l.dataLeitura||'').slice(11,16)}</span></td>
                  <td class="px-4 py-2.5"><b>${escapeHtml(eq.patrimonio||'-')}</b><br><span class="text-[11px] text-slate-500">${escapeHtml(eq.modelo||'')}</span></td>
                  <td class="px-4 py-2.5 font-mono text-[11px]">${l.contadorPBAnterior||0} → <b>${l.contadorPB||0}</b></td>
                  <td class="px-4 py-2.5 font-bold">${l.consumoPB||0}</td>
                  <td class="px-4 py-2.5 font-semibold ${(l.consumoPB-(c.franquiaPB||0))>0?'text-amber-700':''}">${Math.max(0, (l.consumoPB||0) - (c.franquiaPB||0))}</td>
                  <td class="px-4 py-2.5 font-extrabold text-emerald-700">${fmtMoney(l.valorExcedente||0)}</td>
                  <td class="px-4 py-2.5">${escapeHtml(l.criadoPorNome||'-')}</td>
                  <td class="px-4 py-2.5 text-right"><button onclick="deleteLeituraContrato('${l.id}', '${c.id}')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" title="Excluir"><i class="ph ph-trash"></i></button></td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="8" class="p-12 text-center text-slate-400">Nenhuma leitura lançada para este contrato</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('modal-footer').innerHTML = `
    <button onclick="openContratoCompleto('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">← Voltar para Contrato</button>
    <button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>
  `;
};

window.lancarLeituraColetivaContrato = function(contratoId){
  const sess = getSession(); if(!sess) return;
  const c = db.contratos.find(x => x.id === contratoId);
  if(!c) return;
  const maquinas = db.parque.filter(p => p.contratoId === c.id && p.status === 'ativo');
  if(!maquinas.length) return toast('Não há impressoras ativas cadastradas neste contrato para lançar', 'info');

  const dataAtual = new Date().toISOString().slice(0,10);
  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[820px] rounded-[22px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  document.getElementById('modal-title').innerText = `Lançamento de Contadores — Contrato ${c.numero}`;

  document.getElementById('modal-body').innerHTML = `
    <div class="space-y-4 text-[13px]">
      <div class="flex items-center justify-between bg-slate-50 p-3 rounded-xl border">
        <div>
          <label class="font-bold text-slate-700 mr-2">Data da Leitura:</label>
          <input type="date" id="leit-data-input" value="${dataAtual}" class="h-9 px-3 rounded-lg border font-semibold">
        </div>
        <p class="text-[12px] text-slate-500">O sistema calcula o consumo automaticamente ao preencher o contador atual.</p>
      </div>

      <div class="space-y-3 max-h-[460px] overflow-auto">
        ${maquinas.map(m => {
          const eq = db.equipamentos.find(x => x.id === m.equipamentoId) || {};
          const contAnt = eq.contadorPB || 0;
          return `
            <div class="rounded-xl border p-4 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <p class="font-bold text-[14px]">${escapeHtml(eq.modelo||'Impressora')} <span class="font-mono text-slate-500">(Patr. ${eq.patrimonio||'-'})</span></p>
                <p class="text-[11.5px] text-slate-500">Departamento: <b>${escapeHtml(m.setor||'Geral')}</b> • Modalidade: <b class="uppercase">${m.modalidade||'global'}</b></p>
              </div>
              <div class="flex items-center gap-3">
                <div>
                  <p class="text-[10px] uppercase font-bold text-slate-500">Contador Ant.</p>
                  <p class="font-mono font-bold text-[15px] text-slate-700">${contAnt.toLocaleString()}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Contador Atual *</p>
                  <input type="number" id="leit-atu-${m.id}" data-prq-id="${m.id}" data-ant="${contAnt}" data-mod="${m.modalidade||'global'}" data-franq="${m.franquiaPB||0}" data-exc="${m.valorExcedentePB||0.05}" class="w-28 h-10 px-3 rounded-xl border-2 border-[#0a1e8a] font-mono font-bold text-[15px]" placeholder="${contAnt}" oninput="calcPreviewLeitura(this)">
                </div>
                <div class="w-28 text-right">
                  <p class="text-[10px] uppercase font-bold text-slate-500">Utilizado</p>
                  <p class="font-extrabold text-[15px] text-emerald-700" id="leit-prev-${m.id}">0</p>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.getElementById('modal-footer').innerHTML = `
    <button onclick="abrirLeiturasContrato('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button>
    <button onclick="confirmarLancamentoLeituras('${c.id}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] hover:bg-[#08176e] text-white font-bold">Confirmar e Salvar Lançamento</button>
  `;
};

window.calcPreviewLeitura = function(input){
  const prqId = input.getAttribute('data-prq-id');
  const ant = Number(input.getAttribute('data-ant') || 0);
  const franq = Number(input.getAttribute('data-franq') || 0);
  const excVal = Number(input.getAttribute('data-exc') || 0);
  const mod = input.getAttribute('data-mod') || 'global';
  const atu = Number(input.value || ant);
  const res = calcLeituraExcedente(ant, atu, franq, excVal, mod);
  const prevEl = document.getElementById('leit-prev-' + prqId);
  if(prevEl) prevEl.innerText = `${res.utilizado} pág`;
};

window.confirmarLancamentoLeituras = function(contratoId){
  const sess = getSession(); if(!sess) return;
  const c = db.contratos.find(x => x.id === contratoId);
  if(!c) return;
  const dataL = document.getElementById('leit-data-input')?.value || new Date().toISOString().slice(0,10);
  const inputs = document.querySelectorAll('input[id^="leit-atu-"]');
  let count = 0;

  inputs.forEach(inp => {
    const prqId = inp.getAttribute('data-prq-id');
    const ant = Number(inp.getAttribute('data-ant') || 0);
    const valStr = inp.value?.trim();
    if(!valStr) return; // Só lança se preencheu
    const atu = Number(valStr);
    const prq = db.parque.find(x => x.id === prqId);
    if(!prq) return;
    const eq = db.equipamentos.find(x => x.id === prq.equipamentoId);
    const res = calcLeituraExcedente(ant, atu, prq.franquiaPB||c.franquiaPB||0, prq.valorExcedentePB||0.05, prq.modalidade||'global');

    const novaLei = {
      id: uid('lei'),
      empresaId: sess.empresaId,
      parqueId: prq.id,
      equipamentoId: prq.equipamentoId,
      contratoId: c.id,
      clienteId: c.clienteId,
      dataLeitura: new Date(dataL).toISOString(),
      contadorPBAnterior: ant,
      contadorPB: atu,
      contadorCorAnterior: 0,
      contadorCor: 0,
      consumoPB: res.utilizado,
      consumoCor: 0,
      valorExcedente: res.valorExcedente,
      faturar: res.valorExcedente > 0,
      status: 'pendente',
      criadoPor: sess.usuarioId,
      criadoPorNome: sess.usuarioNome
    };
    db.leituras.push(novaLei);
    if(eq) eq.contadorPB = atu;
    count++;
  });

  if(count === 0) return toast('Preencha o contador atual de pelo menos 1 impressora', 'info');
  logAction('leitura', 'lancar_coletiva', c.id, `Lançadas ${count} leituras no contrato ${c.numero} por ${sess.usuarioNome}`);
  saveDB();
  abrirLeiturasContrato(c.id);
  if(typeof renderLeituras === 'function') renderLeituras();
  toast(`${count} leitura(s) lançada(s) com sucesso!`, 'success');
};

window.deleteLeituraContrato = function(leiId, contratoId){
  if(confirm('Deseja excluir esta leitura?')){
    db.leituras = db.leituras.filter(l => l.id !== leiId);
    saveDB();
    abrirLeiturasContrato(contratoId);
    if(typeof renderLeituras === 'function') renderLeituras();
    toast('Leitura excluída', 'success');
  }
};

window.imprimirRelatorioLeiturasPDF = function(contratoId){
  const c = db.contratos.find(x => x.id === contratoId);
  if(!c) return;
  const cli = db.clientes.find(x => x.id === c.clienteId) || {};
  const leituras = db.leituras.filter(l => l.contratoId === c.id).sort((a,b) => new Date(a.dataLeitura) - new Date(b.dataLeitura));
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Leituras — Contrato ${c.numero}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:20px;color:#111;font-size:12px}
      .cab{display:flex;justify-content:space-between;border-bottom:2px solid #0a1e8a;padding-bottom:10px;margin-bottom:15px}
      .cab h1{color:#0a1e8a;font-size:20px;margin:0}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{border:1px solid #ccc;padding:8px;text-align:left}
      th{background:#f4f6f9;font-weight:700;color:#0a1e8a;font-size:11px}
      .tot{font-weight:700;background:#eef2ff}
      @media print{.no-print{display:none}}
    </style></head><body>
      <div class="no-print" style="margin-bottom:15px"><button onclick="window.print()" style="padding:10px 20px;background:#0a1e8a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">🖨 Imprimir / Salvar PDF 2.1</button></div>
      <div class="cab">
        <div><h1>DIGICOPY ERP — RELATÓRIO DE LEITURAS (MOD. 2.1)</h1><p><b>Cliente:</b> ${escapeHtml(cli.nome||'')} (${escapeHtml(cli.documento||'')})</p></div>
        <div style="text-align:right"><p><b>Contrato:</b> ${escapeHtml(c.numero||'')}</p><p><b>Data Emissão:</b> ${fmtDate(new Date())}</p></div>
      </div>
      <table>
        <thead><tr><th>Data</th><th>Impressora</th><th>Patrimônio</th><th>Contador Ant.</th><th>Contador Atual</th><th>Pág. Impressas</th><th>Valor Exced. R$</th></tr></thead>
        <tbody>
          ${leituras.map(l => {
            const eq = db.equipamentos.find(x => x.id === l.equipamentoId) || {};
            return `<tr><td>${fmtDate(l.dataLeitura)}</td><td>${escapeHtml(eq.modelo||'')}</td><td>${escapeHtml(eq.patrimonio||'-')}</td><td>${l.contadorPBAnterior||0}</td><td><b>${l.contadorPB||0}</b></td><td>${l.consumoPB||0}</td><td>${fmtMoney(l.valorExcedente||0)}</td></tr>`;
          }).join('') || '<tr><td colspan="7" style="text-align:center">Sem leituras registradas</td></tr>'}
        </tbody>
      </table>
    </body></html>
  `;
  const win = window.open('','_blank');
  if(win){ win.document.write(html); win.document.close(); }
};

// ── 7. Chamados Técnicos do Contrato + Modal Completo com Serial/Patr/Contador Antigo Automáticos ──
window.abrirChamadosContrato = function(contratoId){
  const sess = getSession(); if(!sess) return;
  const c = db.contratos.find(x => x.id === contratoId);
  if(!c) return;
  const cli = db.clientes.find(x => x.id === c.clienteId) || {};
  const chamados = db.os.filter(o => o.clienteId === c.clienteId).sort((a,b) => new Date(b.dataAbertura) - new Date(a.dataAbertura));

  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[940px] rounded-[22px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText = `Chamados Técnicos — Contrato ${c.numero} • ${cli.nome||''}`;

  document.getElementById('modal-body').innerHTML = `
    <div class="space-y-4 text-[13px]">
      <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border">
        <button onclick="openModalChamadoCompleto(null, '${c.id}')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] hover:bg-[#08176e] text-white font-bold flex items-center gap-2">
          <i class="ph ph-plus-circle text-[18px]"></i> Novo Chamado Técnico
        </button>
        <span class="text-[12.5px] text-slate-500 font-semibold">${chamados.length} chamados registrados</span>
      </div>

      <div class="overflow-auto max-h-[460px] border rounded-xl">
        <table class="w-full text-left text-[12.5px]">
          <thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500 sticky top-0">
            <tr><th class="px-4 py-3">Código</th><th class="px-4 py-3">Data</th><th class="px-4 py-3">Equipamento</th><th class="px-4 py-3">Problema / Motivo</th><th class="px-4 py-3">Técnico</th><th class="px-4 py-3">Status</th><th></th></tr>
          </thead>
          <tbody class="divide-y">
            ${chamados.map(o => {
              const eq = db.equipamentos.find(x => x.id === o.equipamentoId) || {};
              const venc = ehVencidoChamado(o.dataAbertura, o.status);
              return `
                <tr class="hover:bg-slate-50 cursor-pointer ${venc ? 'bg-red-50/40' : ''}" onclick="openModalChamadoCompleto('${o.id}', '${c.id}')">
                  <td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">${o.numero}</td>
                  <td class="px-4 py-2.5">${fmtDate(o.dataAbertura)} ${venc ? '<span class="ml-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">VENCIDO</span>' : ''}</td>
                  <td class="px-4 py-2.5"><b>${escapeHtml(eq.modelo||o.modelo||'Impressora')}</b><br><span class="text-[11px] text-slate-500 font-mono">Patr. ${eq.patrimonio||o.patrimonio||'-'}</span></td>
                  <td class="px-4 py-2.5">${escapeHtml(o.descricao||'')}</td>
                  <td class="px-4 py-2.5">${escapeHtml(o.tecnico||'—')}</td>
                  <td class="px-4 py-2.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${o.status==='concluido'?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800'}">${o.status==='concluido'?'Finalizado':'Aberto'}</span></td>
                  <td class="px-4 py-2.5 text-right"><button onclick="event.stopPropagation(); imprimirChamadoPDF('${o.id}')" class="w-8 h-8 rounded-lg hover:bg-slate-100" title="Imprimir OS"><i class="ph ph-printer"></i></button></td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="7" class="p-12 text-center text-slate-400">Nenhum chamado aberto</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('modal-footer').innerHTML = `
    <button onclick="openContratoCompleto('${c.id}')" class="h-10 px-5 rounded-xl bg-white border font-bold">← Voltar para Contrato</button>
    <button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>
  `;
};

window.openModalChamadoCompleto = function(osId, contratoId){
  const sess = getSession(); if(!sess) return;
  const isEdit = !!osId;
  const c = db.contratos.find(x => x.id === contratoId);
  const o = isEdit ? db.os.find(x => x.id === osId) : {
    id: uid('os'), empresaId: sess.empresaId, clienteId: c ? c.clienteId : null,
    numero: (typeof proximoNumeroSimples==='function' ? proximoNumeroSimples('os', db.os, sess.empresaId) : String(db.os.length+1)),
    dataAbertura: new Date().toISOString(), status: 'aberto', prioridade: 'normal',
    modelo: '', serie: '', patrimonio: '', contadorAntigo: 0, contadorAtual: 0, quantidadeImpressos: 0,
    descricao: '', servicos: '', pendencias: '', observacao: '', pecas: []
  };

  const maquinas = c ? db.parque.filter(p => p.contratoId === c.id && p.status === 'ativo') : [];
  const maqSel = maquinas.map(m => {
    const eq = db.equipamentos.find(x => x.id === m.equipamentoId) || {};
    return `<option value="${m.equipamentoId}" ${o.equipamentoId===m.equipamentoId?'selected':''}>${escapeHtml(eq.modelo||'')} (Patr. ${eq.patrimonio||'-'})</option>`;
  }).join('');

  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[820px] rounded-[22px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText = isEdit ? `Chamado Técnico Corretivo — ${o.numero}` : 'Novo Chamado Técnico Corretivo';

  document.getElementById('modal-body').innerHTML = `
    <div class="space-y-4 text-[13px]">
      <div class="flex border-b gap-6 font-bold text-[13.5px] text-slate-500">
        <button type="button" onclick="mudarAbaChamado('geral')" id="tab-os-geral" class="pb-2 border-b-2 border-[#0a1e8a] text-[#0a1e8a]">Geral</button>
        <button type="button" onclick="mudarAbaChamado('finais')" id="tab-os-finais" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Dados Finais</button>
        <button type="button" onclick="mudarAbaChamado('eq')" id="tab-os-eq" class="pb-2 border-b-2 border-transparent hover:text-slate-800">Detalhes Produto / Equipamento (19.1)</button>
      </div>

      <div id="painel-os-geral" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><label class="block font-bold text-slate-600 mb-1">Código / OS</label><input id="o-num" value="${escapeHtml(o.numero||'')}" class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold" readonly></div>
          <div><label class="block font-bold text-slate-600 mb-1">Data</label><input type="date" id="o-data" value="${(o.dataAbertura||'').slice(0,10)}" class="w-full h-10 px-3 rounded-xl border"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Prioridade</label><select id="o-prio" class="w-full h-10 px-3 rounded-xl border"><option ${o.prioridade==='normal'?'selected':''}>normal</option><option ${o.prioridade==='alta'?'selected':''}>alta</option><option ${o.prioridade==='baixa'?'selected':''}>baixa</option></select></div>
          <div><label class="block font-bold text-slate-600 mb-1">Técnico Atribuído</label><input id="o-tec" value="${escapeHtml(o.tecnico||sess.usuarioNome)}" class="w-full h-10 px-3 rounded-xl border font-semibold"></div>
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Motivo / Defeito Relatado *</label>
          <input id="o-desc" value="${escapeHtml(o.descricao||'')}" class="w-full h-10 px-3 rounded-xl border font-semibold" placeholder="Ex.: PROBLEMA NA IMPRESSORA - NÃO RECONHECE FOLHA">
        </div>
        <div class="bg-slate-50 border rounded-xl p-3 flex items-center gap-3">
          <input type="checkbox" id="o-concluido" ${o.status==='concluido'?'checked':''} class="w-4 h-4 text-emerald-600 rounded">
          <label for="o-concluido" class="font-bold text-slate-800 cursor-pointer">Este Chamado já foi Finalizado?</label>
          <span class="text-[11px] text-slate-500 ml-auto">(Se marcar, ele sai da lista de chamados abertos)</span>
        </div>
      </div>

      <div id="painel-os-finais" class="hidden space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block font-bold text-slate-600 mb-1">Serviços Executados</label><textarea id="o-serv" class="w-full h-24 p-3 rounded-xl border">${escapeHtml(o.servicos||'')}</textarea></div>
          <div><label class="block font-bold text-slate-600 mb-1">Pendências</label><textarea id="o-pend" class="w-full h-24 p-3 rounded-xl border">${escapeHtml(o.pendencias||'')}</textarea></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block font-bold text-slate-600 mb-1">Observação Interna</label><textarea id="o-obs" class="w-full h-20 p-3 rounded-xl border">${escapeHtml(o.observacao||'')}</textarea></div>
          <div><label class="block font-bold text-slate-600 mb-1">Observação Cliente</label><textarea id="o-obs-cli" class="w-full h-20 p-3 rounded-xl border">${escapeHtml(o.observacaoCliente||'')}</textarea></div>
        </div>
      </div>

      <div id="painel-os-eq" class="hidden space-y-4">
        <div class="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-center justify-between">
          <div>
            <label class="font-bold text-blue-900 mr-2">Selecione a Impressora da Manutenção:</label>
            <select id="o-equip-sel" onchange="autoPreencherDadosChamado(this.value)" class="h-9 px-3 rounded-lg border font-semibold">${maqSel}<option value="">Outro Equipamento</option></select>
          </div>
          <span class="text-[11px] text-blue-700">Preenche Serial/Patrimônio e Contador Antigo</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label class="block font-bold text-slate-600 mb-1">Serial</label><input id="o-ser" value="${escapeHtml(o.serie||'')}" class="w-full h-10 px-3 rounded-xl border font-mono"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Patrimônio</label><input id="o-pat" value="${escapeHtml(o.patrimonio||'')}" class="w-full h-10 px-3 rounded-xl border font-mono font-bold"></div>
          <div><label class="block font-bold text-slate-600 mb-1">Local / Setor</label><input id="o-loc" value="${escapeHtml(o.local||'')}" class="w-full h-10 px-3 rounded-xl border"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 border rounded-xl">
          <div>
            <label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Preto Antigo</label>
            <input id="o-cont-ant" type="number" value="${o.contadorAntigo||0}" class="w-full h-10 px-3 rounded-xl border font-mono font-bold text-[#0a1e8a]" readonly>
          </div>
          <div>
            <label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Preto Atual *</label>
            <input id="o-cont-atu" type="number" value="${o.contadorAtual||o.contadorAntigo||0}" class="w-full h-10 px-3 rounded-xl border-2 border-[#0a1e8a] font-mono font-bold text-[15px]" oninput="calcImpressoesChamado()">
          </div>
          <div>
            <label class="block font-bold text-emerald-700 mb-1 text-[11px] uppercase">Quantidade Impressos</label>
            <input id="o-qtd-imp" type="number" value="${o.quantidadeImpressos||0}" class="w-full h-10 px-3 rounded-xl border bg-emerald-50 font-bold text-emerald-700 text-[15px]" readonly>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-footer').innerHTML = `
    <button onclick="imprimirChamadoPDF('${o.id||''}')" class="h-10 px-5 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2 mr-auto"><i class="ph ph-printer"></i> Imprimir OS (PDF 1.1)</button>
    <button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button>
    <button onclick="salvarChamadoCompleto('${o.id||''}', '${c ? c.id : ''}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] hover:bg-[#08176e] text-white font-bold">Salvar Chamado</button>
  `;
  document.getElementById('modal-root').classList.remove('hidden');

  // Seleciona primeira máquina por padrão para preencher contador antigo se for novo
  if(!isEdit && maquinas.length && document.getElementById('o-equip-sel')){
    autoPreencherDadosChamado(maquinas[0].equipamentoId);
  }
};

window.mudarAbaChamado = function(aba){
  ['geral', 'finais', 'eq'].forEach(a => {
    const p = document.getElementById('painel-os-' + a);
    const b = document.getElementById('tab-os-' + a);
    if(p) p.classList.toggle('hidden', a !== aba);
    if(b){
      b.classList.toggle('border-[#0a1e8a]', a === aba);
      b.classList.toggle('text-[#0a1e8a]', a === aba);
      b.classList.toggle('border-transparent', a !== aba);
    }
  });
};

window.autoPreencherDadosChamado = function(equipId){
  const eq = db.equipamentos.find(x => x.id === equipId);
  if(!eq) return;
  if(document.getElementById('o-ser')) document.getElementById('o-ser').value = eq.serie || '';
  if(document.getElementById('o-pat')) document.getElementById('o-pat').value = eq.patrimonio || '';
  if(document.getElementById('o-loc')) document.getElementById('o-loc').value = eq.local || '';
  const contAnt = eq.contadorPB || 0;
  if(document.getElementById('o-cont-ant')) document.getElementById('o-cont-ant').value = contAnt;
  if(document.getElementById('o-cont-atu') && !Number(document.getElementById('o-cont-atu').value)){
    document.getElementById('o-cont-atu').value = contAnt;
  }
  calcImpressoesChamado();
};

window.calcImpressoesChamado = function(){
  const ant = Number(document.getElementById('o-cont-ant')?.value || 0);
  const atu = Number(document.getElementById('o-cont-atu')?.value || ant);
  const res = calcContadoresChamado(ant, atu);
  if(document.getElementById('o-qtd-imp')) document.getElementById('o-qtd-imp').value = res.quantidadeImpressos;
};

window.salvarChamadoCompleto = function(osId, contratoId){
  const sess = getSession(); if(!sess) return;
  const desc = document.getElementById('o-desc')?.value?.trim();
  if(!desc) return toast('Informe o Motivo do Chamado', 'error');
  const conc = document.getElementById('o-concluido')?.checked;
  const statusOS = conc ? 'concluido' : 'aberto';

  const payload = {
    empresaId: sess.empresaId,
    numero: document.getElementById('o-num')?.value || uid('os'),
    dataAbertura: new Date(document.getElementById('o-data')?.value || Date.now()).toISOString(),
    prioridade: document.getElementById('o-prio')?.value || 'normal',
    tecnico: document.getElementById('o-tec')?.value?.trim() || sess.usuarioNome,
    descricao: desc,
    status: statusOS,
    servicos: document.getElementById('o-serv')?.value?.trim() || '',
    pendencias: document.getElementById('o-pend')?.value?.trim() || '',
    observacao: document.getElementById('o-obs')?.value?.trim() || '',
    observacaoCliente: document.getElementById('o-obs-cli')?.value?.trim() || '',
    serie: document.getElementById('o-ser')?.value?.trim() || '',
    patrimonio: document.getElementById('o-pat')?.value?.trim() || '',
    local: document.getElementById('o-loc')?.value?.trim() || '',
    contadorAntigo: Number(document.getElementById('o-cont-ant')?.value || 0),
    contadorAtual: Number(document.getElementById('o-cont-atu')?.value || 0),
    quantidadeImpressos: Number(document.getElementById('o-qtd-imp')?.value || 0)
  };

  if(osId){
    const existing = db.os.find(o => o.id === osId);
    if(existing){
      Object.assign(existing, payload, { atualizadoEm: new Date().toISOString() });
      logAction('os', 'editar_chamado', osId, `Chamado ${payload.numero} editado por ${sess.usuarioNome}`);
    }
  } else {
    const c = db.contratos.find(x => x.id === contratoId);
    const novo = {
      id: uid('os'),
      clienteId: c ? c.clienteId : null,
      criadoEm: new Date().toISOString(),
      criadoPor: sess.usuarioId,
      criadoPorNome: sess.usuarioNome,
      ...payload
    };
    db.os.push(novo);
    logAction('os', 'criar_chamado', novo.id, `Chamado ${payload.numero} aberto por ${sess.usuarioNome}`);
  }

  saveDB();
  closeModal();
  if(contratoId && typeof abrirChamadosContrato === 'function') abrirChamadosContrato(contratoId);
  if(typeof renderOs === 'function') renderOs();
  toast('Chamado salvo com sucesso!', 'success');
};

window.imprimirChamadoPDF = function(osId){
  const o = db.os.find(x => x.id === osId);
  if(!o) return toast('Chamado não encontrado', 'error');
  const cli = db.clientes.find(x => x.id === o.clienteId) || {};
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado Técnico — ${o.numero}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:20px;color:#111;font-size:12px}
      .cab{display:flex;justify-content:space-between;border-bottom:2px solid #0a1e8a;padding-bottom:10px;margin-bottom:15px}
      .cab h1{color:#0a1e8a;font-size:20px;margin:0}
      .box{border:1px solid #ccc;border-radius:8px;padding:12px;margin-bottom:12px;background:#f9fafc}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media print{.no-print{display:none}}
    </style></head><body>
      <div class="no-print" style="margin-bottom:15px"><button onclick="window.print()" style="padding:10px 20px;background:#0a1e8a;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">🖨 Imprimir / Salvar PDF 1.1</button></div>
      <div class="cab">
        <div><h1>DIGICOPY ERP — CHAMADO TÉCNICO (MOD. 1.1)</h1><p><b>Cliente:</b> ${escapeHtml(cli.nome||'Sem Cliente')} (${escapeHtml(cli.documento||'')})</p></div>
        <div style="text-align:right"><p><b>OS:</b> ${o.numero}</p><p><b>Data:</b> ${fmtDate(o.dataAbertura)}</p><p><b>Prioridade:</b> ${String(o.prioridade||'normal').toUpperCase()}</p></div>
      </div>
      <div class="box">
        <p><b>Motivo do Chamado:</b> ${escapeHtml(o.descricao||'-')}</p>
        <p style="margin-top:5px"><b>Técnico Atribuído:</b> ${escapeHtml(o.tecnico||'—')}</p>
      </div>
      <div class="box grid">
        <div><p><b>Serial:</b> ${escapeHtml(o.serie||'-')}</p><p><b>Patrimônio:</b> ${escapeHtml(o.patrimonio||'-')}</p></div>
        <div><p><b>Contador Antigo:</b> ${o.contadorAntigo||0}</p><p><b>Contador Atual:</b> ${o.contadorAtual||0}</p><p><b>Qtd. Impressas:</b> <b>${o.quantidadeImpressos||0}</b></p></div>
      </div>
      ${o.servicos ? `<div class="box"><p><b>Serviços Executados:</b></p><p>${escapeHtml(o.servicos)}</p></div>` : ''}
      <div style="margin-top:50px;display:flex;justify-content:space-between">
        <div style="border-top:1px solid #000;width:200px;text-align:center;padding-top:5px">Assinatura Técnico</div>
        <div style="border-top:1px solid #000;width:200px;text-align:center;padding-top:5px">Assinatura Cliente</div>
      </div>
    </body></html>
  `;
  const win = window.open('','_blank');
  if(win){ win.document.write(html); win.document.close(); }
};

console.log('[DIGICOPY] PATCH locacao_contratos_patch.js v4.9.12 — Locação/Contratos, Leituras (2.1), Chamados (19.1/1.1) e Estoque');
})();
