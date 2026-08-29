// PATCH v5.22.60 — Bloqueio de edição em orçamentos autorizados, atalho para venda salva, exclusão funcional e seleção segura de cliente
(function(){
  var VERSAO = '5.22.60';
  if(typeof window !== 'undefined') window.DIGICOPY_APP_VERSION = VERSAO;

  function getDb(){
    return (typeof window !== 'undefined' && window.db) || (typeof db !== 'undefined' ? db : { clientes:[], produtos:[], orcamentos:[], vendas:[], notificacoes:[], recargasEtiquetas:[] });
  }

  function getSess(){
    return (typeof window !== 'undefined' && window.sess) || (typeof sess !== 'undefined' ? sess : { usuarioId:'1', usuarioNome:'Administrador', empresaId:'1', perfil:'Admin' });
  }

  function txt(v){ return String(v == null ? '' : v).trim(); }
  function n(v){ var num = Number(v); return isNaN(num) ? 0 : num; }
  function money(v){ return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

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
    'Produto', 'Serviço', 'Cartucho', 'Cartucho Vazio', 'Insumo',
    'Equipamento', 'Impressoras', 'Chip', 'Compatível', 'Informática',
    'Original', 'Outros'
  ];

  var CAMPOS_RECARGA = [
    ['todos', 'Pesquisar recarga'],
    ['codigo', 'Código'],
    ['nome', 'Descrição'],
    ['marca', 'Marca']
  ];

  function ehRecargaTipo(t){
    return /recarga/i.test(String(t || ''));
  }

  // Busca e Seleção de Clientes
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
        if(campo === 'codigo') return String(c.codigo || '').toLowerCase().includes(low);
        if(campo === 'documento') return String(c.documento || '').toLowerCase().includes(low);
        if(campo === 'telefone' || campo === 'whatsapp') return String(c.telefone || c.whatsapp || '').toLowerCase().includes(low);
        if(campo === 'cidade') return String(c.cidade || '').toLowerCase().includes(low);
        return String(c.nome || '').toLowerCase().includes(low)
          || String(c.fantasia || '').toLowerCase().includes(low)
          || String(c.codigo || '').toLowerCase().includes(low)
          || String(c.documento || '').toLowerCase().includes(low);
      });
    }

    list = list.slice(0, 15);
    el.classList.remove('hidden');
    el.innerHTML = list.map(function(c){
      return '<button type="button" onclick="window.orcSelCliente(\'' + esc(c.id) + '\')" class="w-full text-left px-3 py-2.5 hover:bg-[#f0f2ff] border-b last:border-0">'
        + '<div class="flex justify-between items-center">'
        + '<b class="text-[#0a1e8a] text-[13px]">#' + esc(c.codigo || '-') + ' — ' + esc(c.nome || c.fantasia || '') + '</b>'
        + '<span class="text-[11px] text-slate-500">' + esc(c.documento || '') + '</span>'
        + '</div>'
        + '<p class="text-[11px] text-slate-500 mt-0.5">' + esc([c.telefone || c.whatsapp, c.cidade, c.bairro].filter(Boolean).join(' • ')) + '</p>'
        + '</button>';
    }).join('') || '<p class="px-3 py-3 text-slate-400 text-[12px]">Nenhum cliente encontrado</p>';
  }

  function orcSelCliente(id){
    var _db = getDb();
    var c = (_db.clientes || []).find(function(x){ return x && x.id === id; });
    if(!c || !window.__ORC_ST || !window.__ORC_ST.form) return;
    window.__ORC_ST.form.cliente = c;

    var resEl = document.getElementById('orc-cli-results');
    if(resEl){ resEl.classList.add('hidden'); resEl.innerHTML = ''; }
    var searchInp = document.getElementById('orc-cli-search');
    if(searchInp) searchInp.value = '';

    var selBox = document.getElementById('orc-cli-sel');
    if(selBox) selBox.classList.remove('hidden');

    var nomeEl = document.getElementById('orc-cli-nome');
    if(nomeEl) nomeEl.textContent = (c.codigo ? '#' + c.codigo + ' — ' : '') + (c.nome || c.fantasia || '');
    var infoEl = document.getElementById('orc-cli-info');
    if(infoEl) infoEl.textContent = [c.documento, c.telefone || c.whatsapp, c.cidade].filter(Boolean).join(' • ');
  }

  function orcLimparCliente(){
    if(window.__ORC_ST && window.__ORC_ST.form) window.__ORC_ST.form.cliente = null;
    var selBox = document.getElementById('orc-cli-sel');
    if(selBox) selBox.classList.add('hidden');
    var searchInp = document.getElementById('orc-cli-search');
    if(searchInp){ searchInp.value = ''; searchInp.focus(); }
  }

  // Alterna tipo de item entre Produto e Recarga de toner
  function orcOnTipoItem(){
    if(typeof document === 'undefined') return;
    var tipo = (document.getElementById('orc-item-tipo') || {}).value || 'Produto';
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

  // Busca e Seleção de Produtos / Recargas
  function orcBuscarProd(){
    if(typeof document === 'undefined') return;
    var q = txt(document.getElementById('orc-prod-search') && document.getElementById('orc-prod-search').value);
    var el = document.getElementById('orc-prod-results');
    if(!el) return;
    if(!q){ el.classList.add('hidden'); el.innerHTML = ''; return; }

    var tipo = (document.getElementById('orc-item-tipo') || {}).value || 'Produto';
    var isRec = ehRecargaTipo(tipo);
    var s = getSess();
    var _db = getDb();

    if(isRec){
      var recCampo = (document.getElementById('orc-rec-campo') || {}).value || 'todos';
      var recargas = (_db.recargas || []).filter(function(r){
        if(!r) return false;
        if(s && s.empresaId && r.empresaId && r.empresaId !== s.empresaId) return false;
        return true;
      });
      var lowR = q.toLowerCase();
      var filtradas = recargas.filter(function(r){
        if(recCampo === 'codigo') return String(r.codigo || '').toLowerCase().includes(lowR);
        if(recCampo === 'marca') return String(r.marca || '').toLowerCase().includes(lowR);
        if(recCampo === 'nome') return String(r.nome || r.descricao || '').toLowerCase().includes(lowR);
        return String(r.nome || r.descricao || '').toLowerCase().includes(lowR)
          || String(r.codigo || '').toLowerCase().includes(lowR)
          || String(r.marca || '').toLowerCase().includes(lowR);
      }).slice(0, 15);

      el.classList.remove('hidden');
      el.innerHTML = filtradas.map(function(r){
        var descr = r.nome || r.descricao || 'Recarga';
        var prc = Number(r.preco || r.valor || 0);
        return '<button type="button" onclick="window.orcSelRecarga(\'' + esc(r.id) + '\')" class="w-full text-left px-3 py-2.5 hover:bg-[#f0f2ff] border-b last:border-0">'
          + '<div class="flex justify-between items-center"><b class="text-[#0a1e8a]">' + esc(descr) + '</b><b class="text-emerald-700">' + money(prc) + '</b></div>'
          + '<p class="text-[11px] text-slate-500">' + esc([r.codigo ? 'Cód ' + r.codigo : '', r.marca].filter(Boolean).join(' • ')) + '</p>'
          + '</button>';
      }).join('') || '<p class="px-3 py-3 text-slate-400 text-[12px]">Nenhuma recarga encontrada</p>';
      return;
    }

    var list = (_db.produtos || []).filter(function(p){
      if(!p || p.status === 'inativo' || p.status === 'excluido') return false;
      if(s && s.empresaId && p.empresaId && p.empresaId !== s.empresaId) return false;
      return true;
    });

    var cat = (document.getElementById('orc-prod-cat') || {}).value || '';
    if(cat){
      list = list.filter(function(p){
        return String(p.categoria || '').trim().toLowerCase() === cat.trim().toLowerCase();
      });
    }

    var low = q.toLowerCase();
    list = list.filter(function(p){
      return String(p.nome || '').toLowerCase().includes(low)
        || String(p.sku || p.codigo || '').toLowerCase().includes(low)
        || String(p.categoria || '').toLowerCase().includes(low);
    }).slice(0, 15);

    el.classList.remove('hidden');
    el.innerHTML = list.map(function(p){
      return '<button type="button" onclick="window.orcSelProd(\'' + esc(p.id) + '\')" class="w-full text-left px-3 py-2.5 hover:bg-[#f0f2ff] border-b last:border-0">'
        + '<div class="flex justify-between items-center"><b class="text-[#0a1e8a]">' + esc(p.nome || '') + '</b><b class="text-emerald-700">' + money(p.preco) + '</b></div>'
        + '<p class="text-[11px] text-slate-500">' + esc([p.sku ? 'Cód ' + p.sku : '', p.categoria, 'Estoque: ' + (p.estoque || 0)].filter(Boolean).join(' • ')) + '</p>'
        + '</button>';
    }).join('') || '<p class="px-3 py-3 text-slate-400 text-[12px]">Nenhum produto encontrado</p>';
  }

  function orcSelProd(id){
    var _db = getDb();
    var p = (_db.produtos || []).find(function(x){ return x && x.id === id; });
    if(!p || !window.__ORC_ST || !window.__ORC_ST.form) return;
    window.__ORC_ST.form.produtoSel = p;

    var resEl = document.getElementById('orc-prod-results');
    if(resEl){ resEl.classList.add('hidden'); resEl.innerHTML = ''; }
    var searchInp = document.getElementById('orc-prod-search');
    if(searchInp) searchInp.value = p.nome || '';
    var vu = document.getElementById('orc-item-vunit');
    if(vu) vu.value = (p.preco || 0).toFixed(2);
    if(typeof window.orcCalcItem === 'function') window.orcCalcItem();
  }

  function orcSelRecarga(id){
    var _db = getDb();
    var r = (_db.recargas || []).find(function(x){ return x && x.id === id; });
    if(!r || !window.__ORC_ST || !window.__ORC_ST.form) return;
    var nomeRec = r.nome || r.descricao || 'Recarga de toner';
    window.__ORC_ST.form.produtoSel = { id: r.id, nome: nomeRec, sku: r.codigo || '', preco: Number(r.preco || r.valor || 0), isRecarga: true };

    var resEl = document.getElementById('orc-prod-results');
    if(resEl){ resEl.classList.add('hidden'); resEl.innerHTML = ''; }
    var searchInp = document.getElementById('orc-prod-search');
    if(searchInp) searchInp.value = nomeRec;
    var vu = document.getElementById('orc-item-vunit');
    if(vu) vu.value = (Number(r.preco || r.valor || 0)).toFixed(2);
    if(typeof window.orcCalcItem === 'function') window.orcCalcItem();
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
      if(c) orcSelCliente(c.id);
    }
  }

  // Atalho direto para abrir a Venda Salva gerada pelo orçamento
  function abrirVendaDeOrcamento(param){
    var _db = getDb();
    var paramStr = String(param || '');
    var venda = (_db.vendas || []).find(function(v){
      return v && (v.id === paramStr || v.origemOrcamentoId === paramStr || v.numero === paramStr);
    });
    if(!venda){
      var o = (_db.orcamentos || []).find(function(x){ return x && (x.id === paramStr || x.vendaId === paramStr); });
      if(o && o.vendaId){
        venda = (_db.vendas || []).find(function(v){ return v && v.id === o.vendaId; });
      }
    }
    if(!venda){
      if(typeof toast === 'function') toast('Venda correspondente não encontrada.', 'error');
      else if(typeof window.lfbAlert === 'function') window.lfbAlert('Venda salva não encontrada no sistema.', 'Vendas');
      return;
    }
    if(typeof closeModal === 'function') closeModal();
    if(typeof window.navigateTo === 'function') window.navigateTo('vendas');
    setTimeout(function(){
      if(typeof window.abrirVenda === 'function') window.abrirVenda(venda.id);
    }, 100);
  }

  // Exclusão de Orçamentos funcional e definitiva
  function excluirOrcamentosMarcados(idUnico){
    var _db = getDb();
    var ids = idUnico ? [idUnico] : Array.from(document.querySelectorAll('input[name="orc-check"]:checked')).map(function(c){ return c.value; });
    if(!ids.length && window.neoOrcSel) ids = [window.neoOrcSel];
    if(!ids.length){
      if(typeof window.lfbAlert === 'function') window.lfbAlert('Marque a caixinha de um ou mais orçamentos para excluir.', 'Excluir Orçamento');
      else if(typeof toast === 'function') toast('Marque um orçamento para excluir', 'error');
      return;
    }

    var msg = ids.length === 1 ? 'Deseja realmente excluir este orçamento?' : ('Deseja realmente excluir os ' + ids.length + ' orçamentos selecionados?');
    var executar = function(){
      if(!_db.orcamentos) _db.orcamentos = [];
      ids.forEach(function(id){
        var o = _db.orcamentos.find(function(x){ return x && x.id === id; });
        if(o){
          // Se havia gerado venda salva não faturada, exclui a venda também
          if(o.vendaId){
            _db.vendas = (_db.vendas || []).filter(function(v){
              return v && v.id !== o.vendaId && !/faturad|finaliz|pago/i.test(v.status || '');
            });
          }
          o.status = 'excluido';
          o.excluidoEm = new Date().toISOString();
        }
      });
      _db.orcamentos = _db.orcamentos.filter(function(x){ return x && x.status !== 'excluido'; });
      if(typeof saveDB === 'function') saveDB();
      if(typeof window.renderOrcamentos === 'function') window.renderOrcamentos();
      if(typeof closeModal === 'function') closeModal();
      if(typeof toast === 'function') toast('Orçamento(s) excluído(s) com sucesso!', 'success');
    };

    if(typeof window.confirmSistema === 'function'){
      window.confirmSistema(msg, 'Excluir Orçamento').then(function(ok){ if(ok) executar(); });
    } else if(typeof confirm === 'function' && confirm(msg)){
      executar();
    } else {
      executar();
    }
  }

  if(typeof window !== 'undefined'){
    window.orcOnTipoItem = orcOnTipoItem;
    window.orcBuscarCliente = orcBuscarCliente;
    window.orcSelCliente = orcSelCliente;
    window.orcLimparCliente = orcLimparCliente;
    window.orcBuscarProd = orcBuscarProd;
    window.orcSelProd = orcSelProd;
    window.orcSelRecarga = orcSelRecarga;
    window.orcBuscarEtiqueta = orcBuscarEtiqueta;
    window.abrirVendaDeOrcamento = abrirVendaDeOrcamento;
    window.excluirOrcamentosMarcados = excluirOrcamentosMarcados;
    window.excluirOrcamento = excluirOrcamentosMarcados;

    // Override completo da abertura do Modal de Orçamento
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
        vendaId: existente ? (existente.vendaId || '') : '',
        vendaNumero: existente ? (existente.vendaNumero || '') : ''
      };

      if(!window.__ORC_ST) window.__ORC_ST = {};
      window.__ORC_ST.form = f;

      var isAutorizado = f.status === 'aprovado' || !!f.vendaId;
      var statusRotulo = isAutorizado ? 'Autorizado' : (f.status === 'recusado' ? 'Não autorizado' : (f.status === 'estornado' ? 'Estornado' : 'Aberto'));
      var statusBadgeCls = isAutorizado ? 'neo-status ok' : (f.status === 'recusado' ? 'neo-status wait' : 'neo-status info');

      var box = document.getElementById('modal-box');
      if(box) box.className = 'w-full max-w-[1180px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';

      document.getElementById('modal-title').innerText = existente ? ('Orçamento ' + f.codigo) : 'Novo orçamento';

      var osData = f.os || {};

      document.getElementById('modal-body').innerHTML =
        '<div class="space-y-3">'
        // Banner de Bloqueio se Autorizado + Atalho para Venda Salva
        +(isAutorizado ? (
          '<div class="rounded-xl bg-emerald-50 border-2 border-emerald-500/30 p-3 flex flex-wrap items-center justify-between gap-2">'
          +'<div class="flex items-center gap-2 text-emerald-900 font-bold text-[13px]"><i class="ph ph-lock-key text-[20px] text-emerald-700"></i> Orçamento AUTORIZADO — Edição bloqueada</div>'
          +'<button type="button" onclick="window.abrirVendaDeOrcamento(\''+esc(f.vendaId || f.id)+'\')" class="h-[40px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] flex items-center gap-2 shadow-sm"><i class="ph ph-shopping-bag"></i> Abrir Venda Salva nº '+(f.vendaNumero ? esc(f.vendaNumero) : '')+'</button>'
          +'</div>'
        ) : '')

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
        +'<select id="orc-cli-campo" '+(isAutorizado ? 'disabled' : '')+' class="h-[44px] px-2 rounded-xl border bg-white text-[12px] min-w-[155px] shrink-0">'
        +CAMPOS_CLIENTE.map(function(c){ return '<option value="'+esc(c[0])+'">'+esc(c[1])+'</option>'; }).join('')
        +'</select>'
        +'<input id="orc-cli-search" '+(isAutorizado ? 'disabled placeholder="Orçamento autorizado (edição bloqueada)"' : 'placeholder="Busque o cliente..."')+' class="flex-1 min-w-[200px] h-[44px] px-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white text-[13px]">'
        +'<button type="button" onclick="window.orcBuscarCliente()" '+(isAutorizado ? 'disabled class="h-[44px] px-4 rounded-xl bg-slate-300 text-white shrink-0 cursor-not-allowed"' : 'class="h-[44px] px-4 rounded-xl bg-[#0a1e8a] text-white shrink-0"')+' title="Buscar cliente"><i class="ph ph-magnifying-glass"></i></button>'
        +'</div>'
        +'<div id="orc-cli-results" class="hidden mt-1 max-h-[220px] overflow-auto rounded-xl border bg-white shadow-xl text-[12.5px]"></div>'
        +'<div id="orc-cli-sel" class="'+(f.cliente ? '' : 'hidden')+' mt-2 rounded-xl bg-white border p-3 flex justify-between items-center">'
        +'<div><p class="font-bold" id="orc-cli-nome">'+(f.cliente ? esc((f.cliente.codigo ? '#' + f.cliente.codigo + ' — ' : '') + (f.cliente.nome || f.cliente.fantasia || '')) : '')+'</p>'
        +'<p class="text-[11px] text-slate-500" id="orc-cli-info">'+(f.cliente ? esc([f.cliente.documento, f.cliente.telefone || f.cliente.whatsapp, f.cliente.cidade].filter(Boolean).join(' • ')) : '')+'</p></div>'
        +(!isAutorizado ? '<button type="button" onclick="window.orcLimparCliente()" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Trocar cliente"><i class="ph ph-x"></i></button>' : '')
        +'</div>'
        +'</div>'

        // Barra de Abas (Itens / Ordem de Serviço)
        +'<div class="flex border-b border-slate-200">'
        +'<button id="orc-tab-itens" type="button" onclick="window.setAbaOrcamento(\'itens\')" class="px-5 py-2 text-[13px] font-bold border-b-2 border-[#0a1e8a] text-[#0a1e8a]"><i class="ph ph-shopping-cart"></i> Itens</button>'
        +'<button id="orc-tab-os" type="button" onclick="window.setAbaOrcamento(\'os\')" class="px-5 py-2 text-[13px] font-bold border-b-2 border-transparent text-slate-500"><i class="ph ph-wrench"></i> Ordem de Serviço (Opcional)</button>'
        +'</div>'

        // ABA 1: ITENS COM FILTROS DE CATEGORIA / RECARGA / ETIQUETA
        +'<div id="orc-aba-itens" class="space-y-3">'
        +(!isAutorizado ? (
          '<div class="rounded-[14px] border bg-[#f8f9ff] p-3 space-y-2">'
          +'<div class="grid grid-cols-12 gap-2 items-end">'
          +'<label class="col-span-12 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">Tipo'
          +'<select id="orc-item-tipo" onchange="window.orcOnTipoItem && window.orcOnTipoItem()" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12px]"><option value="Produto">Produto</option><option value="Recarga de toner">Recarga de toner</option></select>'
          +'</label>'
          +'<div class="col-span-12 md:col-span-5 relative">'
          +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Filtro e Descrição</label>'
          +'<div class="flex items-center gap-1 mt-1">'
          +'<select id="orc-prod-cat" class="h-[40px] px-2 rounded-xl border bg-white text-[12px] min-w-[145px] shrink-0">'
          +'<option value="">Todas categorias</option>'
          +CATS_PRODUTO.map(function(cat){ return '<option value="'+esc(cat)+'">'+esc(cat)+'</option>'; }).join('')
          +'</select>'
          +'<select id="orc-rec-campo" class="hidden h-[40px] px-2 rounded-xl border bg-white text-[12px] min-w-[145px] shrink-0">'
          +CAMPOS_RECARGA.map(function(r){ return '<option value="'+esc(r[0])+'">'+esc(r[1])+'</option>'; }).join('')
          +'</select>'
          +'<input id="orc-prod-search" placeholder="Digite para buscar ou escreva a descrição..." class="flex-1 min-w-[160px] h-[40px] px-3 rounded-xl border bg-white text-[12.5px]">'
          +'<button id="orc-prod-lupa" type="button" onclick="window.orcBuscarProd()" class="h-[40px] px-3.5 rounded-xl bg-[#0a1e8a] text-white shrink-0" title="Buscar"><i class="ph ph-magnifying-glass"></i></button>'
          +'</div>'
          +'<div id="orc-prod-results" class="hidden absolute z-30 left-0 right-0 top-full mt-1 max-h-[200px] overflow-auto rounded-xl border bg-white shadow-xl text-[12px]"></div>'
          +'</div>'
          +'<label class="col-span-4 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">QTD<input id="orc-item-qtd" type="number" min="1" value="1" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-center"></label>'
          +'<label class="col-span-4 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">V. UNIT<input id="orc-item-vunit" type="number" step="0.01" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white"></label>'
          +'<label class="col-span-4 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">DESC R$<input id="orc-item-desc" type="number" step="0.01" value="0" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-center"></label>'
          +'<label class="col-span-12 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">TOTAL<input id="orc-item-total" readonly class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-slate-100 font-bold text-center"></label>'
          +'</div>'
          +'<div id="orc-item-extra" class="hidden border-t border-[#0a1e8a]/10 pt-2 grid grid-cols-12 gap-2 items-end">'
          +'<label class="col-span-12 md:col-span-5 text-[11px] font-bold uppercase text-[#0a1e8a]">Etiqueta da recarga'
          +'<div class="flex gap-1 mt-1">'
          +'<input id="orc-item-cartucho" placeholder="Nº da etiqueta — se não achar, escreve e segue" class="flex-1 h-[38px] px-3 rounded-xl border bg-white text-[12px]">'
          +'<button id="orc-etq-lupa" type="button" onclick="window.orcBuscarEtiqueta && window.orcBuscarEtiqueta()" class="h-[38px] px-3 rounded-xl bg-[#0a1e8a] text-white shrink-0" title="Buscar etiqueta"><i class="ph ph-magnifying-glass"></i></button>'
          +'</div></label>'
          +'</div>'
          +'<div class="flex justify-end pt-1"><button type="button" onclick="window.orcAddItem()" class="h-[40px] px-5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm"><i class="ph ph-plus-circle"></i> Adicionar item</button></div>'
          +'</div>'
        ) : '')
        +'<div class="rounded-[14px] border overflow-hidden bg-white"><table class="w-full text-left text-[12px]">'
        +'<thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-[#0a1e8a]"><tr><th class="px-3 py-2">Tipo</th><th class="px-3 py-2">Descrição</th><th class="px-3 py-2 text-center">Qtd</th><th class="px-3 py-2 text-right">V. Unit</th><th class="px-3 py-2 text-right">Desc</th><th class="px-3 py-2 text-right">Total</th>'
        +(!isAutorizado ? '<th class="px-3 py-2 w-12 text-center">Ações</th>' : '')
        +'</tr></thead>'
        +'<tbody id="orc-itens-body"></tbody></table></div>'
        +'</div>'

        // ABA 2: ORDEM DE SERVIÇO
        +'<div id="orc-aba-os" class="hidden space-y-3">'
        +'<div class="rounded-[14px] border bg-[#f8f9ff] p-4 space-y-3">'
        +'<p class="text-[12px] font-bold text-[#0a1e8a] flex items-center gap-1.5"><i class="ph ph-info"></i> Dados da Ordem de Serviço (preenchimento opcional):</p>'
        +'<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Número de série<input id="orc-os-serie" '+(isAutorizado ? 'readonly' : '')+' placeholder="Digite o número de série..." value="'+esc(osData.numeroSerie || osData.serie || '')+'" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Modelo do equipamento<input id="orc-os-modelo" '+(isAutorizado ? 'readonly' : '')+' placeholder="Ex: HP LaserJet 1020" value="'+esc(osData.modelo || '')+'" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Tipo da OS<input id="orc-os-tipo" '+(isAutorizado ? 'readonly' : '')+' placeholder="Ex: Manutenção preventiva" value="'+esc(osData.tipoOS || osData.tipo || '')+'" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Patrimônio<input id="orc-os-patri" '+(isAutorizado ? 'readonly' : '')+' placeholder="Número de patrimônio" value="'+esc(osData.patrimonio || '')+'" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Contador / cópias<input id="orc-os-contador" '+(isAutorizado ? 'readonly' : '')+' placeholder="Contador atual" value="'+esc(osData.contador || '')+'" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Garantia<input id="orc-os-garantia" '+(isAutorizado ? 'readonly' : '')+' placeholder="Ex: 90 dias" value="'+esc(osData.garantia || '')+'" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Situação da OS<input id="orc-os-situacao" '+(isAutorizado ? 'readonly' : '')+' placeholder="Ex: Em análise / Aguardando aprovação" value="'+esc(osData.situacao || '')+'" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Técnico responsável<input id="orc-os-tecnico" '+(isAutorizado ? 'readonly' : '')+' placeholder="Nome do técnico" value="'+esc(osData.tecnico || '')+'" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Responsável pela entrega<input id="orc-os-entrega" '+(isAutorizado ? 'readonly' : '')+' placeholder="Nome de quem entregou" value="'+esc(osData.responsavelEntrega || '')+'" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'</div>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Acessórios deixados com o equipamento<input id="orc-os-acessorios" '+(isAutorizado ? 'readonly' : '')+' placeholder="Ex: Cabo de força, fonte, toner..." value="'+esc(osData.acessorios || '')+'" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Defeito apresentado pelo equipamento<textarea id="orc-os-defeito" '+(isAutorizado ? 'readonly' : '')+' placeholder="Descreva o problema relatado pelo cliente..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.defeito || '')+'</textarea></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Serviços executados / previstos<textarea id="orc-os-servicos" '+(isAutorizado ? 'readonly' : '')+' placeholder="Serviços a realizar..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.servicos || '')+'</textarea></label>'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Peças utilizadas / orçadas<textarea id="orc-os-pecas" '+(isAutorizado ? 'readonly' : '')+' placeholder="Peças necessárias..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.pecas || '')+'</textarea></label>'
        +'</div>'
        +'</div>'

        // Observações e Total
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Observações do Orçamento<textarea id="orc-obs" '+(isAutorizado ? 'readonly' : '')+' class="mt-1 w-full h-[52px] p-2 rounded-xl border">'+esc(f.obs)+'</textarea></label>'
        +'<div class="rounded-[14px] bg-[#0a1e8a] text-white p-3 flex justify-between items-center"><span class="font-bold">TOTAL DO ORÇAMENTO</span><b id="orc-total" class="text-[18px]">R$ 0,00</b></div>'
        +'</div>';

      document.getElementById('modal-footer').innerHTML =
        '<button onclick="closeModal()" class="h-[46px] px-5 rounded-xl bg-white border text-red-600 font-bold">Sair</button>'
        +(existente ? '<button type="button" onclick="window.excluirOrcamentosMarcados(\''+existente.id+'\')" class="h-[46px] px-4 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold flex items-center gap-1.5" title="Excluir este orçamento"><i class="ph ph-trash"></i> Excluir</button>' : '')
        +(isAutorizado ? '<button type="button" onclick="window.abrirVendaDeOrcamento(\''+esc(f.vendaId || f.id)+'\')" class="h-[46px] px-5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2 shadow-sm"><i class="ph ph-shopping-bag"></i> Abrir Venda Salva nº '+(f.vendaNumero ? esc(f.vendaNumero) : '')+'</button>' : '')
        +(existente ? '<button type="button" onclick="window.revalidarLinkOrcamento(\''+existente.id+'\')" class="h-[46px] px-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold flex items-center gap-1.5" title="Reativa o link e cancela a venda se já tiver sido gerada"><i class="ph ph-arrows-counter-clockwise"></i> Revalidar link</button>' : '')
        +(existente ? '<button type="button" onclick="window.imprimirOrcamento(\''+existente.id+'\')" class="h-[46px] px-5 rounded-xl bg-white border font-bold"><i class="ph ph-printer"></i> Imprimir</button>' : '')
        +(!isAutorizado ? '<button type="button" onclick="window.salvarOrcamentoTela()" class="h-[46px] px-6 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-floppy-disk"></i> Salvar</button>' : '');

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

    // Override do orcRenderItens para respeitar bloqueio de remoção se autorizado
    window.orcRenderItens = function(){
      var f = window.__ORC_ST && window.__ORC_ST.form;
      var el = document.getElementById('orc-itens-body');
      if(!el) return;
      var isAutorizado = f && (f.status === 'aprovado' || !!f.vendaId);

      if(!f || !f.itens || !f.itens.length){
        el.innerHTML = '<tr><td colspan="' + (isAutorizado ? '6' : '7') + '" class="text-center text-slate-400 py-6">Nenhum item adicionado</td></tr>';
        var tEl = document.getElementById('orc-total');
        if(tEl) tEl.innerText = money(0);
        return;
      }

      var tot = 0;
      el.innerHTML = f.itens.map(function(it, idx){
        var subt = Math.max(0, n(it.qtd) * n(it.preco) - n(it.desconto));
        tot += subt;
        return '<tr class="border-b last:border-0">'
          + '<td class="px-3 py-2"><span class="px-2 py-0.5 rounded-md text-[10.5px] font-bold ' + (ehRecargaTipo(it.tipo) ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#0a1e8a]') + '">' + esc(it.tipo || 'Produto') + '</span></td>'
          + '<td class="px-3 py-2"><b>' + esc(it.descricao) + '</b>' + (it.numCartucho ? '<span class="text-[11px] text-slate-500 block">Etiqueta: ' + esc(it.numCartucho) + '</span>' : '') + '</td>'
          + '<td class="px-3 py-2 text-center">' + esc(it.qtd) + '</td>'
          + '<td class="px-3 py-2 text-right">' + money(it.preco) + '</td>'
          + '<td class="px-3 py-2 text-right">' + (n(it.desconto) > 0 ? money(it.desconto) : '-') + '</td>'
          + '<td class="px-3 py-2 text-right font-bold">' + money(subt) + '</td>'
          + (!isAutorizado ? '<td class="px-3 py-2 text-center"><button type="button" onclick="window.orcDelItem(' + idx + ')" class="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Remover item"><i class="ph ph-trash"></i></button></td>' : '')
          + '</tr>';
      }).join('');

      var totalEl = document.getElementById('orc-total');
      if(totalEl) totalEl.innerText = money(tot);
    };

    // Override do salvarOrcamentoTela com validação precisa de cliente e bloqueio se autorizado
    window.salvarOrcamentoTela = function(){
      var s = getSess(); if(!s) return;
      var _db = getDb();
      var f = window.__ORC_ST && window.__ORC_ST.form;
      if(!f) return;

      if(f.status === 'aprovado' || f.vendaId){
        if(typeof window.lfbAlert === 'function') window.lfbAlert('Este orçamento já foi autorizado e não pode ser editado. Para reabrir edições, clique no botão Revalidar link.', 'Orçamento Autorizado');
        else if(typeof toast === 'function') toast('Orçamento autorizado não pode ser editado', 'error');
        return;
      }

      if(!f.cliente){
        var cliSearch = txt(document.getElementById('orc-cli-search') && document.getElementById('orc-cli-search').value);
        if(cliSearch){
          var achou = (_db.clientes || []).find(function(c){
            return c && (String(c.nome || '').toLowerCase() === cliSearch.toLowerCase() || String(c.codigo || '') === cliSearch);
          });
          if(achou) f.cliente = achou;
        }
      }

      if(!f.cliente){
        if(typeof toast === 'function') toast('Selecione um cliente para o orçamento', 'error');
        else if(typeof window.lfbAlert === 'function') window.lfbAlert('Selecione um cliente para o orçamento.', 'Cliente Obrigatório');
        return;
      }

      if(!f.itens || !f.itens.length){
        if(typeof toast === 'function') toast('Adicione pelo menos um item ao orçamento', 'error');
        return;
      }

      var tot = (f.itens || []).reduce(function(acc, it){
        return acc + Math.max(0, n(it.qtd) * n(it.preco) - n(it.desconto));
      }, 0);

      if(!_db.orcamentos) _db.orcamentos = [];
      var o = null;
      if(f.id){
        o = _db.orcamentos.find(function(x){ return x && x.id === f.id; });
      }

      if(!o){
        o = {
          id: 'orc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
          numero: f.codigo || (window.proximoNumeroSimples ? window.proximoNumeroSimples('orcamento', _db.orcamentos, s.empresaId) : '1'),
          empresaId: s.empresaId,
          token: f.token || ('orc_tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)),
          criadoEm: new Date().toISOString(),
          criadoPor: s.usuarioId,
          criadoPorNome: s.usuarioNome,
          status: 'aberto'
        };
        _db.orcamentos.push(o);
        f.id = o.id;
      }

      var osColetada = {
        numeroSerie: txt(document.getElementById('orc-os-serie') && document.getElementById('orc-os-serie').value),
        modelo: txt(document.getElementById('orc-os-modelo') && document.getElementById('orc-os-modelo').value),
        tipoOS: txt(document.getElementById('orc-os-tipo') && document.getElementById('orc-os-tipo').value),
        patrimonio: txt(document.getElementById('orc-os-patri') && document.getElementById('orc-os-patri').value),
        contador: txt(document.getElementById('orc-os-contador') && document.getElementById('orc-os-contador').value),
        garantia: txt(document.getElementById('orc-os-garantia') && document.getElementById('orc-os-garantia').value),
        situacao: txt(document.getElementById('orc-os-situacao') && document.getElementById('orc-os-situacao').value),
        tecnico: txt(document.getElementById('orc-os-tecnico') && document.getElementById('orc-os-tecnico').value),
        responsavelEntrega: txt(document.getElementById('orc-os-entrega') && document.getElementById('orc-os-entrega').value),
        acessorios: txt(document.getElementById('orc-os-acessorios') && document.getElementById('orc-os-acessorios').value),
        defeito: txt(document.getElementById('orc-os-defeito') && document.getElementById('orc-os-defeito').value),
        servicos: txt(document.getElementById('orc-os-servicos') && document.getElementById('orc-os-servicos').value),
        pecas: txt(document.getElementById('orc-os-pecas') && document.getElementById('orc-os-pecas').value)
      };

      Object.assign(o, {
        clienteId: f.cliente.id,
        clienteNome: f.cliente.nome || f.cliente.fantasia || '',
        data: f.data,
        itens: (f.itens || []).map(function(it){ return Object.assign({}, it); }),
        total: tot,
        observacao: txt(document.getElementById('orc-obs') && document.getElementById('orc-obs').value),
        token: o.token || f.token,
        os: osColetada,
        status: o.status || 'aberto',
        atualizadoEm: new Date().toISOString()
      });

      if(typeof saveDB === 'function') saveDB();
      if(typeof toast === 'function') toast('Orçamento ' + o.numero + ' salvo!', 'success');
      if(typeof window.lfbAlert === 'function') window.lfbAlert('Orçamento ' + o.numero + ' salvo com sucesso.', 'Salvo');

      window.__ORC_ST.form.id = o.id;
      if(typeof window.renderOrcamentos === 'function') window.renderOrcamentos();
      window.abrirOrcamento(o.id);
    };

    // Renderizador da tabela de Orçamentos com botões de ação e atalho para Venda Salva
    window.renderOrcamentos = function(){
      var s = getSess(); if(!s) return;
      var _db = getDb();
      var view = typeof ensureView === 'function' ? ensureView('orcamentos') : document.getElementById('view-orcamentos');
      if(!view) return;

      var campo = (document.getElementById('orc-filtro-campo') || {}).value || (window.__ORC_ST && window.__ORC_ST.campo) || 'todos';
      var q = (document.getElementById('orc-busca') || {}).value || (window.__ORC_ST && window.__ORC_ST.q) || '';
      if(!window.__ORC_ST) window.__ORC_ST = {};
      window.__ORC_ST.campo = campo;
      window.__ORC_ST.q = q;

      var base = (_db.orcamentos || []).filter(function(o){
        return o && (!s.empresaId || o.empresaId === s.empresaId) && o.status !== 'excluido';
      });

      var termo = txt(q).toLowerCase();
      var list = base.filter(function(o){
        var cl = (_db.clientes || []).find(function(c){ return c && c.id === o.clienteId; }) || {};
        var st = txt(o.status).toLowerCase();
        if(campo === 'fechados') return st === 'aprovado' || o.vendaId;
        if(campo === 'nao_fechados') return st !== 'aprovado' && !o.vendaId && st !== 'estornado';
        if(campo === 'cod_orc') return !termo || String(o.numero || '').toLowerCase().includes(termo);
        if(campo === 'cliente') return !termo || String(cl.nome || '').toLowerCase().includes(termo) || String(cl.fantasia || '').toLowerCase().includes(termo);
        if(!termo) return true;
        return String(o.numero || '').toLowerCase().includes(termo)
          || String(cl.nome || '').toLowerCase().includes(termo)
          || String(o.criadoPorNome || '').toLowerCase().includes(termo);
      }).sort(function(a, b){
        var na = parseInt(String(a.numero || '').replace(/\D/g, ''), 10) || 0;
        var nb = parseInt(String(b.numero || '').replace(/\D/g, ''), 10) || 0;
        return nb - na;
      });

      view.innerHTML =
        '<div class="space-y-4">'
        +'<div class="flex flex-wrap gap-2 justify-between items-center">'
        +'<div class="flex flex-wrap gap-2 items-center">'
        +'<button onclick="window.abrirOrcamento()" class="neo-btn ok"><i class="ph ph-plus-circle"></i>Novo Orçamento</button>'
        +'<button onclick="window.excluirOrcamentosMarcados()" class="neo-btn danger"><i class="ph ph-trash"></i>Excluir</button>'
        +'</div>'
        +'<div class="flex flex-wrap gap-2 items-center">'
        +'<select id="orc-filtro-campo" class="neo-input !w-[180px]">'
        +'<option value="todos" '+(campo==='todos'?'selected':'')+'>Todos os orçamentos</option>'
        +'<option value="cod_orc" '+(campo==='cod_orc'?'selected':'')+'>Por Código</option>'
        +'<option value="cliente" '+(campo==='cliente'?'selected':'')+'>Por Cliente</option>'
        +'<option value="nao_fechados" '+(campo==='nao_fechados'?'selected':'')+'>Orçamentos Abertos</option>'
        +'<option value="fechados" '+(campo==='fechados'?'selected':'')+'>Orçamentos Autorizados</option>'
        +'</select>'
        +'<div class="relative"><input id="orc-busca" value="'+esc(q)+'" placeholder="Pesquisar orçamento..." class="neo-input !pr-9"><button onclick="window.orcBuscar()" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><i class="ph ph-magnifying-glass"></i></button></div>'
        +'<button onclick="window.orcMostrarTodos()" class="neo-btn">Todos</button>'
        +'</div>'
        +'</div>'

        +'<div class="neo-card p-0 overflow-hidden">'
        +'<div class="overflow-auto max-h-[calc(100vh-320px)]"><table class="neo-table"><thead><tr>'
        +'<th class="w-8"><input type="checkbox" onclick="document.querySelectorAll(\'input[name=orc-check]\').forEach(function(c){c.checked=this.checked}.bind(this))"></th>'
        +'<th>Código</th><th>Data</th><th>Cliente</th><th>Valor total</th><th>Status</th><th>Ações</th></tr></thead><tbody>'
        +(list.map(function(o){
          var cl = (_db.clientes || []).find(function(c){ return c && c.id === o.clienteId; }) || {};
          var st = txt(o.status).toLowerCase();
          var isAut = st === 'aprovado' || !!o.vendaId;
          var rotulo = isAut ? 'Autorizado' : (st === 'recusado' ? 'Não autorizado' : (st === 'estornado' ? 'Estornado' : 'Aberto'));
          var badgeCls = isAut ? 'neo-status ok' : (st === 'recusado' ? 'neo-status wait' : (st === 'estornado' ? 'neo-status info' : 'neo-status info'));
          var temOS = o.os && Object.keys(o.os).some(function(k){ return txt(o.os[k]); });

          return '<tr onclick="window.neoOrcSel=\''+o.id+'\';window.abrirOrcamento(\''+o.id+'\')" class="cursor-pointer">'
            +'<td class="px-2"><input type="checkbox" name="orc-check" value="'+o.id+'" onclick="event.stopPropagation()"></td>'
            +'<td><b class="text-[#0a1e8a]">'+esc(o.numero || '')+'</b>'+(temOS ? ' <span class="text-[10px]" title="Contém Ordem de Serviço">🔧 OS</span>' : '')+'</td>'
            +'<td>'+(o.data ? o.data.slice(0, 10).split('-').reverse().join('/') : '-')+'</td>'
            +'<td><b>'+esc(cl.nome || o.clienteNome || '(sem cliente)')+'</b></td>'
            +'<td><b>'+money(o.total)+'</b></td>'
            +'<td><span class="'+badgeCls+'">'+esc(rotulo)+'</span></td>'
            +'<td><div class="flex items-center gap-1.5" onclick="event.stopPropagation()">'
            +'<button onclick="window.abrirOrcamento(\''+o.id+'\')" class="neo-btn !px-2" title="Abrir Orçamento"><i class="ph ph-eye"></i></button>'
            +(isAut ? '<button onclick="window.abrirVendaDeOrcamento(\''+o.id+'\')" class="neo-btn !px-2 text-emerald-700 hover:bg-emerald-50" title="Abrir Venda Salva (nº '+(o.vendaNumero||'')+')"><i class="ph ph-shopping-bag"></i></button>' : '')
            +'<button onclick="window.revalidarLinkOrcamento(\''+o.id+'\')" class="neo-btn !px-2 text-amber-700 hover:bg-amber-50" title="Revalidar Link"><i class="ph ph-arrows-counter-clockwise"></i></button>'
            +'<button onclick="window.excluirOrcamentosMarcados(\''+o.id+'\')" class="neo-btn !px-2 text-red-600 hover:bg-red-50" title="Excluir Orçamento"><i class="ph ph-trash"></i></button>'
            +'</div></td>'
            +'</tr>';
        }).join('') || '<tr><td colspan="7" class="text-center text-slate-400 py-12">Nenhum orçamento encontrado</td></tr>')
        +'</tbody></table></div></div></div>';

      var inp = document.getElementById('orc-busca');
      if(inp) inp.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.orcBuscar(); } };
      var sel = document.getElementById('orc-filtro-campo');
      if(sel) sel.onchange = function(){
        window.__ORC_ST.campo = sel.value;
        window.renderOrcamentos();
      };
    };

    // Sincronização visual de versão v5.22.60
    function sincronizarVersaoVisual60(){
      try{
        if(typeof document === 'undefined') return;
        var fv = document.getElementById('footer-version');
        if(fv && fv.textContent !== 'v' + VERSAO) fv.textContent = 'v' + VERSAO;
        var tv = document.getElementById('app-title-version');
        if(tv && tv.textContent !== 'Sistema Digicopy v' + VERSAO) tv.textContent = 'Sistema Digicopy v' + VERSAO;
        if(document.title && !document.title.includes(VERSAO)){
          document.title = 'Sistema Digicopy v' + VERSAO;
        }
      }catch(e){}
    }

    sincronizarVersaoVisual60();
    setTimeout(sincronizarVersaoVisual60, 50);
    setTimeout(sincronizarVersaoVisual60, 300);

    if(typeof window.navigateTo === 'function' && !window.navigateTo.__v52260sync){
      var oldN = window.navigateTo;
      window.navigateTo = function(){
        var res = oldN.apply(this, arguments);
        try{ sincronizarVersaoVisual60(); }catch(e){}
        return res;
      };
      window.navigateTo.__v52260sync = true;
    }

    console.log('[DIGICOPY] v' + VERSAO + ': Trava de orçamentos autorizados, atalho para venda salva e exclusão definitiva ativos!');
  }

  var PURE_V52260 = {
    VERSAO: VERSAO,
    CAMPOS_CLIENTE: CAMPOS_CLIENTE,
    CATS_PRODUTO: CATS_PRODUTO,
    CAMPOS_RECARGA: CAMPOS_RECARGA,
    ehRecargaTipo: ehRecargaTipo
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = { PURE_V52260: PURE_V52260 };
  }
})();
