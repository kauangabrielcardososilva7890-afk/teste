// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.22.59 — Orçamentos: Remoção da opção inválida 'Serviço' do tipo de item,
//                  Restauração Completa dos Filtros de Busca (Cliente, Categorias de Produto,
//                  Campos de Recarga de Toner e Etiqueta) e Sincronização v5.22.59
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  'use strict';

  var VERSAO = '5.22.59';
  if(typeof window !== 'undefined'){
    window.DIGICOPY_APP_VERSION = window.DIGICOPY_APP_VERSION || VERSAO;
  }

  function txt(v){ return String(v == null ? '' : v).trim(); }
  function n(v){ var x = Number(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : 0; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function money(v){ return (n(v)).toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }

  function getDb(){
    if(typeof window !== 'undefined' && window.db) return window.db;
    if(typeof db !== 'undefined') return db;
    if(typeof global !== 'undefined' && global.db) return global.db;
    return {};
  }

  function getSess(){
    if(typeof getSession === 'function') return getSession();
    if(typeof window !== 'undefined' && typeof window.getSession === 'function') return window.getSession();
    if(typeof global !== 'undefined' && typeof global.getSession === 'function') return global.getSession();
    return null;
  }

  var CAMPOS_CLIENTE = [
    ['todos', 'Pesquisar em tudo'],
    ['nome', 'Nome'],
    ['fantasia', 'Fantasia'],
    ['codigo', 'Código'],
    ['documento', 'CPF/CNPJ'],
    ['rgIE', 'RG/IE'],
    ['endereco', 'Endereço'],
    ['telefone', 'Telefone'],
    ['whatsapp', 'WhatsApp'],
    ['cidade', 'Cidade'],
    ['bairro', 'Bairro'],
    ['contato', 'Contato'],
    ['email', 'E-mail'],
    ['observacao', 'Observação'],
    ['cep', 'CEP'],
    ['estado', 'UF']
  ];

  var CATS_PRODUTO = [
    'Produto', 'Serviço', 'Cartucho', 'Cartucho Vazio', 'Insumo', 'Equipamento',
    'Impressoras', 'Chip', 'Compatível', 'Informática', 'Original', 'Outros'
  ];

  var CAMPOS_RECARGA = [
    ['todos', 'Pesquisar recarga'],
    ['codigo', 'Código'],
    ['nome', 'Descrição'],
    ['marca', 'Marca']
  ];

  function ehRecargaTipo(tipo){
    return /recarga/i.test(String(tipo || ''));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERFACE — Modal de Orçamento com Filtros Completos
  // ═══════════════════════════════════════════════════════════════════════════

  function orcOnTipoItem(){
    if(typeof document === 'undefined') return;
    var tipoEl = document.getElementById('orc-item-tipo');
    var tipo = tipoEl ? tipoEl.value : 'Produto';
    var isRec = ehRecargaTipo(tipo);

    var catEl = document.getElementById('orc-prod-cat');
    var recCampoEl = document.getElementById('orc-rec-campo');
    var extraEl = document.getElementById('orc-item-extra');
    var prodSearch = document.getElementById('orc-prod-search');
    var resEl = document.getElementById('orc-prod-results');

    if(catEl) catEl.style.display = isRec ? 'none' : '';
    if(recCampoEl) recCampoEl.style.display = isRec ? '' : 'none';
    if(extraEl) extraEl.classList.toggle('hidden', !isRec);
    if(prodSearch){
      prodSearch.placeholder = isRec ? 'Busque a recarga (Enter ou lupa)…' : 'Digite para buscar ou escreva a descrição…';
      prodSearch.value = '';
    }
    if(resEl){
      resEl.classList.add('hidden');
      resEl.innerHTML = '';
    }
    var vu = document.getElementById('orc-item-vunit');
    if(vu) vu.value = '';
    if(typeof window.orcCalcItem === 'function') window.orcCalcItem();
  }

  function orcBuscarCliente(){
    if(typeof document === 'undefined') return;
    var q = txt(document.getElementById('orc-cli-search') && document.getElementById('orc-cli-search').value);
    var el = document.getElementById('orc-cli-results');
    if(!el) return;
    if(!q){ el.classList.add('hidden'); el.innerHTML = ''; return; }

    var s = getSess();
    var _db = getDb();
    var list = (_db.clientes || []).filter(function(c){
      if(!c || c.status === 'inativo' || c.status === 'excluido') return false;
      if(s && s.empresaId && c.empresaId && c.empresaId !== s.empresaId) return false;
      return true;
    });

    var campo = (document.getElementById('orc-cli-campo') || {}).value || 'todos';
    if(window.FILTROS_BUSCA_PURE && typeof window.FILTROS_BUSCA_PURE.filtraClientes === 'function'){
      list = window.FILTROS_BUSCA_PURE.filtraClientes(list, q, campo);
    } else {
      var low = q.toLowerCase();
      list = list.filter(function(c){
        return String(c.nome || '').toLowerCase().includes(low)
          || String(c.fantasia || '').toLowerCase().includes(low)
          || String(c.codigo || '').includes(low)
          || String(c.documento || '').includes(low);
      });
    }

    list = list.slice(0, 15);
    el.classList.remove('hidden');
    el.innerHTML = list.map(function(c){
      return '<button type="button" onclick="window.orcSelCliente(\'' + esc(c.id) + '\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0">'
        + '<b class="text-[#0a1e8a]">#' + esc(c.codigo || '-') + '</b> <b>' + esc(c.nome || '') + '</b>'
        + (c.fantasia ? ' <span class="text-slate-500 text-[11px]">(' + esc(c.fantasia) + ')</span>' : '') + '<br>'
        + '<span class="text-slate-500 text-[11px]">' + esc(c.documento || '') + ' • ' + esc(c.telefone || '') + '</span></button>';
    }).join('') || '<p class="px-3 py-3 text-slate-400">Nenhum cliente encontrado com esse filtro.</p>';
  }

  function orcBuscarProd(){
    if(typeof document === 'undefined') return;
    var q = txt(document.getElementById('orc-prod-search') && document.getElementById('orc-prod-search').value);
    var el = document.getElementById('orc-prod-results');
    if(!el) return;

    var s = getSess();
    var _db = getDb();
    var tipoEl = document.getElementById('orc-item-tipo');
    var isRec = ehRecargaTipo(tipoEl ? tipoEl.value : 'Produto');

    if(isRec){
      var campo = (document.getElementById('orc-rec-campo') || {}).value || 'todos';
      var recs = (_db.recargas || []).filter(function(r){
        return !s || !r.empresaId || r.empresaId === s.empresaId;
      });
      if(window.FILTROS_BUSCA_PURE && typeof window.FILTROS_BUSCA_PURE.filtraRecargas === 'function'){
        recs = window.FILTROS_BUSCA_PURE.filtraRecargas(recs, q, campo);
      } else {
        var lowRec = q.toLowerCase();
        recs = recs.filter(function(r){
          return String(r.nome || '').toLowerCase().includes(lowRec) || String(r.codigo || '').includes(lowRec);
        });
      }
      recs = recs.slice(0, 10);
      el.classList.remove('hidden');
      el.innerHTML = recs.map(function(r){
        return '<button type="button" onclick="window.orcSelRecarga(\'' + esc(r.id) + '\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0">'
          + '<b>' + esc(r.nome || '') + '</b> <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100">Recarga</span><br>'
          + '<span class="text-slate-500 text-[11px]">cód. ' + esc(r.codigo || '') + ' • sem estoque • <b class="text-[#0a1e8a]">' + money(r.preco || 0) + '</b></span></button>';
      }).join('') || '<p class="px-3 py-2 text-slate-400">Nenhuma recarga encontrada. Você pode digitar a descrição e etiqueta manualmente.</p>';
      return;
    }

    var cat = (document.getElementById('orc-prod-cat') || {}).value || '';
    var prods = (_db.produtos || []).filter(function(p){
      return !s || !p.empresaId || p.empresaId === s.empresaId;
    });

    if(window.FILTROS_BUSCA_PURE && typeof window.FILTROS_BUSCA_PURE.filtraProdutos === 'function'){
      prods = window.FILTROS_BUSCA_PURE.filtraProdutos(prods, q, cat);
    } else {
      var lowProd = q.toLowerCase();
      prods = prods.filter(function(p){
        if(cat && String(p.categoria || '') !== cat) return false;
        return !lowProd || String(p.nome || '').toLowerCase().includes(lowProd) || String(p.sku || '').toLowerCase().includes(lowProd);
      });
    }

    prods = prods.slice(0, 10);
    el.classList.remove('hidden');
    el.innerHTML = prods.map(function(p){
      return '<button type="button" onclick="window.orcSelProd(\'' + esc(p.id) + '\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0">'
        + '<b>' + esc(p.nome || '') + '</b> <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100">' + esc(p.categoria || '') + '</span><br>'
        + '<span class="text-slate-500 text-[11px]">' + esc(p.sku || '') + ' • estoque ' + (p.estoque || 0) + ' • <b class="text-[#0a1e8a]">' + money(p.preco || 0) + '</b></span></button>';
    }).join('') || '<p class="px-3 py-2 text-slate-400">Sem produto cadastrado — a descrição digitada será usada normalmente</p>';
  }

  function orcBuscarEtiqueta(){
    if(typeof document === 'undefined') return;
    var etq = txt(document.getElementById('orc-item-cartucho') && document.getElementById('orc-item-cartucho').value);
    if(!etq) return;
    var _db = getDb();
    var rec = (_db.recargasEtiquetas || []).find(function(r){
      return String(r.etiqueta || '').replace(/\s+/g, '').toUpperCase() === etq.replace(/\s+/g, '').toUpperCase();
    });
    if(!rec && typeof toast === 'function'){
      toast('Etiqueta nova: digite e adicione o item ao orçamento.', 'info');
    } else if(rec && rec.clienteId && window.__ORC_ST && window.__ORC_ST.form && !window.__ORC_ST.form.cliente){
      var c = (_db.clientes || []).find(function(x){ return x && x.id === rec.clienteId; });
      if(c && typeof window.orcSelCliente === 'function') window.orcSelCliente(c.id);
    }
  }

  if(typeof window !== 'undefined'){
    window.orcOnTipoItem = orcOnTipoItem;
    window.orcBuscarCliente = orcBuscarCliente;
    window.orcBuscarProd = orcBuscarProd;
    window.orcBuscarEtiqueta = orcBuscarEtiqueta;

    // Override do Modal de Orçamento com layout limpo e TODOS os filtros de busca
    window.abrirTelaOrcamento = function(existente){
      var s = getSess(); if(!s) return;
      var _db = getDb();
      var agora = new Date();
      var f = {
        id: existente ? existente.id : null,
        codigo: existente ? existente.numero : (window.proximoNumeroSimples ? window.proximoNumeroSimples('orcamento', _db.orcamentos, s.empresaId) : String(Date.now().toString(36))),
        data: existente ? (existente.data || '').slice(0, 10) : agora.toISOString().slice(0, 10),
        hora: agora.toTimeString().slice(0, 5),
        cliente: existente && existente.clienteId ? (_db.clientes || []).find(function(c){ return c.id === existente.clienteId; }) : null,
        itens: existente ? (existente.itens || []).map(function(it){ return Object.assign({}, it); }) : [],
        produtoSel: null,
        token: existente && existente.token ? existente.token : ('orc_tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)),
        obs: existente ? (existente.observacao || '') : '',
        os: existente && existente.os ? Object.assign({}, existente.os) : {},
        status: existente ? (existente.status || 'aberto') : 'aberto',
        vendaNumero: existente ? (existente.vendaNumero || '') : ''
      };

      if(!window.__ORC_ST) window.__ORC_ST = {};
      window.__ORC_ST.form = f;

      var box = document.getElementById('modal-box');
      if(box) box.className = 'w-full max-w-[1180px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';

      var statusRotulo = f.status === 'aprovado' ? 'Autorizado' : (f.status === 'recusado' ? 'Não autorizado' : 'Aberto');
      var statusBadgeCls = f.status === 'aprovado' ? 'neo-status ok' : (f.status === 'recusado' ? 'neo-status wait' : 'neo-status info');

      document.getElementById('modal-title').innerText = existente ? ('Orçamento ' + f.codigo) : 'Novo orçamento';

      var osData = f.os || {};

      document.getElementById('modal-body').innerHTML =
        '<div class="space-y-3">'
        // Cabeçalho
        +'<div class="grid grid-cols-2 md:grid-cols-5 gap-2">'
        +'<div class="rounded-xl bg-[#0a1e8a] text-white p-3"><p class="text-[10px] uppercase font-bold text-white/70">Código</p><p class="font-bold text-[15px]" id="orc-codigo">'+esc(f.codigo)+'</p></div>'
        +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Data</p><p class="font-bold">'+esc(f.data.split('-').reverse().join('/'))+'</p></div>'
        +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Hora</p><p class="font-bold">'+esc(f.hora)+'</p></div>'
        +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Vendedor</p><p class="font-bold">'+esc(s.usuarioNome)+'</p></div>'
        +'<div class="rounded-xl border p-3 flex flex-col justify-center"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Status</p><p><span class="'+statusBadgeCls+'">'+esc(statusRotulo)+'</span></p></div>'
        +'</div>'

        // Linha do Cliente com Filtro de Campos
        +'<div class="rounded-[14px] border-2 border-[#0a1e8a]/20 bg-[#f8f9ff] p-3">'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Cliente * — selecione o filtro e busque com Enter ou lupa</label>'
        +'<div class="flex flex-wrap items-center gap-2 mt-1">'
        +'<select id="orc-cli-campo" class="h-[44px] px-2 rounded-xl border bg-white text-[12px] min-w-[155px] shrink-0">'
        +CAMPOS_CLIENTE.map(function(c){ return '<option value="'+esc(c[0])+'">'+esc(c[1])+'</option>'; }).join('')
        +'</select>'
        +'<input id="orc-cli-search" placeholder="Busque o cliente..." class="flex-1 min-w-[200px] h-[44px] px-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white text-[13px]">'
        +'<button type="button" onclick="window.orcBuscarCliente()" class="h-[44px] px-4 rounded-xl bg-[#0a1e8a] text-white shrink-0" title="Buscar cliente"><i class="ph ph-magnifying-glass"></i></button>'
        +'</div>'
        +'<div id="orc-cli-results" class="hidden mt-1 max-h-[220px] overflow-auto rounded-xl border bg-white shadow-xl text-[12.5px]"></div>'
        +'<div id="orc-cli-sel" class="'+(f.cliente ? '' : 'hidden')+' mt-2 rounded-xl bg-white border p-3 flex justify-between items-center">'
        +'<div><p class="font-bold" id="orc-cli-nome">'+(f.cliente ? esc((f.cliente.codigo ? '#' + f.cliente.codigo + ' — ' : '') + (f.cliente.nome || '')) : '')+'</p>'
        +'<p class="text-[11px] text-slate-500">'+(f.cliente ? esc([f.cliente.documento, f.cliente.telefone, f.cliente.cidade].filter(Boolean).join(' • ')) : '')+'</p></div>'
        +'<button type="button" onclick="window.orcLimparCliente()" class="w-8 h-8 rounded-lg bg-red-50 text-red-600"><i class="ph ph-x"></i></button></div>'
        +'</div>'

        // Barra de Abas (Itens / Ordem de Serviço)
        +'<div class="flex border-b border-slate-200">'
        +'<button id="orc-tab-itens" type="button" onclick="window.setAbaOrcamento(\'itens\')" class="px-5 py-2 text-[13px] font-bold border-b-2 border-[#0a1e8a] text-[#0a1e8a]"><i class="ph ph-shopping-cart"></i> Itens</button>'
        +'<button id="orc-tab-os" type="button" onclick="window.setAbaOrcamento(\'os\')" class="px-5 py-2 text-[13px] font-bold border-b-2 border-transparent text-slate-500"><i class="ph ph-wrench"></i> Ordem de Serviço (Opcional)</button>'
        +'</div>'

        // ABA 1: ITENS COM FILTROS DE CATEGORIA / RECARGA / ETIQUETA
        +'<div id="orc-aba-itens" class="space-y-3">'
        +'<div class="rounded-[14px] border bg-[#f8f9ff] p-3 space-y-2">'
        +'<div class="grid grid-cols-12 gap-2 items-end">'
        // Tipo de Item: apenas Produto e Recarga de toner (sem Serviço)
        +'<label class="col-span-12 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">Tipo'
        +'<select id="orc-item-tipo" onchange="window.orcOnTipoItem()" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12px]"><option value="Produto">Produto</option><option value="Recarga de toner">Recarga de toner</option></select></label>'

        // Descrição com Filtro de Categoria (Produto) ou Campo (Recarga)
        +'<div class="col-span-12 md:col-span-5 relative">'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Filtro e Descrição</label>'
        +'<div class="flex items-center gap-1 mt-1">'
        +'<select id="orc-prod-cat" class="h-[40px] px-2 rounded-xl border bg-white text-[12px] min-w-[145px] shrink-0">'
        +'<option value="">Todas categorias</option>'
        +CATS_PRODUTO.map(function(c){ return '<option value="'+esc(c)+'">'+esc(c)+'</option>'; }).join('')
        +'</select>'
        +'<select id="orc-rec-campo" class="hidden h-[40px] px-2 rounded-xl border bg-white text-[12px] min-w-[145px] shrink-0">'
        +CAMPOS_RECARGA.map(function(rc){ return '<option value="'+esc(rc[0])+'">'+esc(rc[1])+'</option>'; }).join('')
        +'</select>'
        +'<input id="orc-prod-search" placeholder="Digite para buscar ou escreva a descrição..." class="flex-1 min-w-[160px] h-[40px] px-3 rounded-xl border bg-white text-[12.5px]">'
        +'<button id="orc-prod-lupa" type="button" onclick="window.orcBuscarProd()" class="h-[40px] px-3.5 rounded-xl bg-[#0a1e8a] text-white shrink-0" title="Buscar item"><i class="ph ph-magnifying-glass"></i></button>'
        +'</div>'
        +'<div id="orc-prod-results" class="hidden absolute z-30 left-0 right-0 top-full mt-1 max-h-[200px] overflow-auto rounded-xl border bg-white shadow-xl text-[12px]"></div>'
        +'</div>'

        +'<label class="col-span-4 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">QTD<input id="orc-item-qtd" type="number" min="1" value="1" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-center"></label>'
        +'<label class="col-span-4 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">V. UNIT<input id="orc-item-vunit" type="number" step="0.01" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white"></label>'
        +'<label class="col-span-4 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">DESC R$<input id="orc-item-desc" type="number" step="0.01" value="" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-center"></label>'
        +'<label class="col-span-12 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">TOTAL<input id="orc-item-total" readonly class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-slate-100 font-bold text-center"></label>'
        +'</div>'

        // Linha extra quando for Recarga de Toner (Etiqueta + Lupa)
        +'<div id="orc-item-extra" class="hidden border-t border-[#0a1e8a]/10 pt-2 grid grid-cols-12 gap-2 items-end">'
        +'<label class="col-span-12 md:col-span-5 text-[11px] font-bold uppercase text-[#0a1e8a]">Etiqueta da recarga'
        +'<div class="flex gap-1 mt-1">'
        +'<input id="orc-item-cartucho" placeholder="Nº da etiqueta — se não achar, escreve e segue" class="flex-1 h-[38px] px-3 rounded-xl border bg-white text-[12px]">'
        +'<button id="orc-etq-lupa" type="button" onclick="window.orcBuscarEtiqueta()" class="h-[38px] px-3 rounded-xl bg-[#0a1e8a] text-white shrink-0" title="Buscar etiqueta"><i class="ph ph-magnifying-glass"></i></button>'
        +'</div></label>'
        +'</div>'

        +'<div class="flex justify-end pt-1"><button type="button" id="orc-btn-add" disabled onclick="window.orcAddItem()" class="h-[40px] px-5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"><i class="ph ph-plus-circle"></i> Adicionar item</button></div>'
        +'</div>'

        // Tabela de itens
        +'<div class="rounded-[14px] border overflow-hidden bg-white"><table class="w-full text-left text-[12px]">'
        +'<thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-[#0a1e8a]"><tr><th class="px-3 py-2">Tipo</th><th class="px-3 py-2">Descrição</th><th class="px-3 py-2 text-center">Qtd</th><th class="px-3 py-2">V.Unit</th><th class="px-3 py-2 text-center">Desc</th><th class="px-3 py-2">Total</th><th class="w-10"></th></tr></thead>'
        +'<tbody id="orc-itens-body" class="divide-y"></tbody></table></div>'
        +'</div>'

        // ABA 2: ORDEM DE SERVIÇO (OS) - Inicia vazia, sem nada obrigatório, sem busca inteligente
        +'<div id="orc-aba-os" class="hidden space-y-3">'
        +'<div class="rounded-[14px] border bg-[#f8f9ff] p-3 grid grid-cols-12 gap-2">'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Número de série'
        +'<input id="orc-os-serie" value="'+esc(osData.numeroSerie || osData.serie || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-4 text-[11px] font-bold uppercase text-[#0a1e8a]">Modelo do equipamento'
        +'<input id="orc-os-modelo" value="'+esc(osData.modelo || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Tipo da OS'
        +'<input id="orc-os-tipo" value="'+esc(osData.tipoOS || '')+'" placeholder="Ex: Manutenção, Instalação..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">Patrimônio'
        +'<input id="orc-os-patri" value="'+esc(osData.patrimonio || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">Contador / cópias'
        +'<input id="orc-os-contador" value="'+esc(osData.contador || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-12 md:col-span-4 text-[11px] font-bold uppercase text-[#0a1e8a]">Acessórios'
        +'<input id="orc-os-acess" value="'+esc(osData.acessorios || '')+'" placeholder="cabos, bandeja, etc..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Técnico responsável'
        +'<input id="orc-os-tec" value="'+esc(osData.tecnico || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Responsável entrega'
        +'<input id="orc-os-entrega" value="'+esc(osData.responsavelEntrega || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Garantia'
        +'<input id="orc-os-garantia" value="'+esc(osData.garantia || '')+'" placeholder="Ex: 30 dias, 90 dias..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Situação da OS'
        +'<input id="orc-os-situacao" value="'+esc(osData.situacao || '')+'" placeholder="Ex: Aberta, Em orçamento..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-12 text-[11px] font-bold uppercase text-[#0a1e8a]">Defeito apresentado'
        +'<textarea id="orc-os-defeito" placeholder="O que o cliente relatou..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.defeito || '')+'</textarea></label>'
        +'<label class="col-span-12 md:col-span-6 text-[11px] font-bold uppercase text-[#0a1e8a]">Serviços executados / previstos'
        +'<textarea id="orc-os-servicos" placeholder="Serviços a executar..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.servicos || '')+'</textarea></label>'
        +'<label class="col-span-12 md:col-span-6 text-[11px] font-bold uppercase text-[#0a1e8a]">Peças utilizadas / orçadas'
        +'<textarea id="orc-os-pecas" placeholder="Peças necessárias..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.pecas || '')+'</textarea></label>'
        +'</div>'
        +'</div>'

        // Observações e Total
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Observações do Orçamento<textarea id="orc-obs" class="mt-1 w-full h-[52px] p-2 rounded-xl border">'+esc(f.obs)+'</textarea></label>'
        +'<div class="rounded-[14px] bg-[#0a1e8a] text-white p-3 flex justify-between items-center"><span class="font-bold">TOTAL DO ORÇAMENTO</span><b id="orc-total" class="text-[18px]">R$ 0,00</b></div>'
        +'</div>';

      var linkCliente = existente && window.PURE_V52258 ? window.PURE_V52258.linkPublicoOrcamento(existente, f.cliente) : '';

      document.getElementById('modal-footer').innerHTML =
        '<button onclick="closeModal()" class="h-[46px] px-5 rounded-xl bg-white border text-red-600 font-bold">Sair</button>'
        +(existente ? '<button type="button" onclick="window.revalidarLinkOrcamento(\''+existente.id+'\')" class="h-[46px] px-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold flex items-center gap-1.5" title="Reativa o link e cancela a venda se já tiver sido gerada"><i class="ph ph-arrows-counter-clockwise"></i> Revalidar link</button>' : '')
        +(existente ? '<button type="button" onclick="window.imprimirOrcamento(\''+existente.id+'\')" class="h-[46px] px-5 rounded-xl bg-white border font-bold"><i class="ph ph-printer"></i> Imprimir</button>' : '')
        +'<button type="button" onclick="window.salvarOrcamentoTela()" class="h-[46px] px-6 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-floppy-disk"></i> Salvar</button>';

      document.getElementById('modal-root').classList.remove('hidden');
      window.modalContext = { type: 'orcamento' };
      if(typeof window.orcRenderItens === 'function') window.orcRenderItens();

      var cli = document.getElementById('orc-cli-search');
      if(cli) cli.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.orcBuscarCliente(); } };
      var pr = document.getElementById('orc-prod-search');
      if(pr) pr.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.orcBuscarProd(); } };
      var cart = document.getElementById('orc-item-cartucho');
      if(cart) cart.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.orcBuscarEtiqueta(); } };

      ['orc-item-qtd', 'orc-item-vunit', 'orc-item-desc'].forEach(function(id){
        var el = document.getElementById(id); if(el) el.oninput = window.orcCalcItem;
      });

      orcOnTipoItem();
    };

    // Override do orcAddItem para suportar produto ou recarga com etiqueta
    window.orcAddItem = function(){
      var f = window.__ORC_ST && window.__ORC_ST.form;
      if(!f) return;
      var desc = txt(document.getElementById('orc-prod-search') && document.getElementById('orc-prod-search').value);
      var p = f.produtoSel;
      var tipo = (document.getElementById('orc-item-tipo') || {}).value || 'Produto';
      var isRec = ehRecargaTipo(tipo);
      var cartucho = isRec ? txt(document.getElementById('orc-item-cartucho') && document.getElementById('orc-item-cartucho').value) : '';

      if(!p && !desc && !cartucho){
        if(typeof toast === 'function') toast('Selecione um produto ou escreva a descrição', 'error');
        return;
      }

      var qtd = n(document.getElementById('orc-item-qtd') && document.getElementById('orc-item-qtd').value) || 1;
      // v5.22.84 — trava de segurança: sem valor unitário numérico, não adiciona
      var vuRaw = String((document.getElementById('orc-item-vunit')||{}).value||'').trim();
      if(!/^\d+(?:[.,]\d+)?$/.test(vuRaw)){ if(typeof toast === 'function') toast('Informe um valor unitário numérico para adicionar o item', 'error'); return; }
      var preco = n(document.getElementById('orc-item-vunit') && document.getElementById('orc-item-vunit').value) || 0;
      var descV = n(document.getElementById('orc-item-desc') && document.getElementById('orc-item-desc').value) || 0;

      var descricaoFinal = p ? (p.nome || '') : (desc || (isRec ? 'Recarga de toner' : 'Item'));
      if(cartucho && !descricaoFinal.includes(cartucho)){
        descricaoFinal += ' (Etiqueta: ' + cartucho + ')';
      }

      f.itens.push({
        produtoId: p ? p.id : null,
        descricao: descricaoFinal,
        sku: p ? (p.sku || '') : '',
        tipo: isRec ? 'Recarga de toner' : 'Produto',
        qtd: qtd,
        preco: preco,
        desconto: descV,
        subtotal: Math.max(0, qtd * preco - descV),
        numCartucho: cartucho
      });

      f.produtoSel = null;
      var ps = document.getElementById('orc-prod-search'); if(ps) ps.value = '';
      var ci = document.getElementById('orc-item-cartucho'); if(ci) ci.value = '';
      var qi = document.getElementById('orc-item-qtd'); if(qi) qi.value = 1;
      var vi = document.getElementById('orc-item-vunit'); if(vi) vi.value = '';
      var di = document.getElementById('orc-item-desc'); if(di) di.value = '';
      var ti = document.getElementById('orc-item-total'); if(ti) ti.value = '';

      if(typeof window.orcRenderItens === 'function') window.orcRenderItens();
    };

    // Sincronização visual de versão v5.22.59
    function sincronizarVersaoVisual59(){
      try{
        if(typeof document === 'undefined') return;
        var fv = document.getElementById('footer-version');
        var _vUI = (typeof window!=='undefined' && window.DIGICOPY_APP_VERSION) || VERSAO;
        if(fv && fv.textContent !== 'v' + _vUI) fv.textContent = 'v' + _vUI;
        var tv = document.getElementById('app-title-version');
        if(tv && tv.textContent !== 'Sistema Digicopy v' + _vUI) tv.textContent = 'Sistema Digicopy v' + _vUI;
        if(document.title && !document.title.includes(_vUI)){
          document.title = 'Sistema Digicopy v' + _vUI;
        }
      }catch(e){}
    }

    sincronizarVersaoVisual59();
    setTimeout(sincronizarVersaoVisual59, 50);
    setTimeout(sincronizarVersaoVisual59, 300);

    if(typeof window.navigateTo === 'function' && !window.navigateTo.__v52259sync){
      var oldN = window.navigateTo;
      window.navigateTo = function(){
        var res = oldN.apply(this, arguments);
        try{ sincronizarVersaoVisual59(); }catch(e){}
        return res;
      };
      window.navigateTo.__v52259sync = true;
    }

    console.log('[DIGICOPY] v' + VERSAO + ': Filtros de orçamentos e itens corrigidos!');
  }

  var PURE_V52259 = {
    VERSAO: VERSAO,
    CAMPOS_CLIENTE: CAMPOS_CLIENTE,
    CATS_PRODUTO: CATS_PRODUTO,
    CAMPOS_RECARGA: CAMPOS_RECARGA,
    ehRecargaTipo: ehRecargaTipo
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = { PURE_V52259: PURE_V52259 };
  }
})();
