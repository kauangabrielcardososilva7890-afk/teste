// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.22.60 — Orçamentos: Trava de Edição em Autorizados, Atalho para Venda Salva,
//                  Exclusão Funcional com Cancelamento Seguro e Seleção Confiável de Cliente
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  'use strict';

  var VERSAO = '5.22.60';
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
  // SELEÇÃO E BUSCA DE CLIENTE E PRODUTOS
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

  // ═══════════════════════════════════════════════════════════════════════════
  // ATALHO PARA ABRIR A VENDA SALVA DO ORÇAMENTO AUTORIZADO
  // ═══════════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCLUSÃO DEFINITIVA E CANCELAMENTO SEGURO
  // ═══════════════════════════════════════════════════════════════════════════

  function excluirOrcamentosMarcados(idUnico){
    var _db = getDb();
    var ids = idUnico ? [idUnico] : Array.from(document.querySelectorAll('input[name="orc-check"]:checked')).map(function(c){ return c.value; });
    if(!ids.length && window.neoOrcSel) ids = [window.neoOrcSel];
    if(!ids.length){
      if(typeof window.lfbAlert === 'function') window.lfbAlert('Marque um orçamento para excluir.', 'Excluir');
      else if(typeof toast === 'function') toast('Marque um orçamento para excluir', 'error');
      return;
    }

    var msg = 'Deseja excluir ' + ids.length + ' orçamento(s)?';
    var executar = function(){
      if(!_db.orcamentos) _db.orcamentos = [];
      if(!_db.__orcExcluidos) _db.__orcExcluidos = [];

      ids.forEach(function(id){
        var o = _db.orcamentos.find(function(x){ return x && x.id === id; });
        if(o){
          // Registra token para NUNCA mais criar venda mesmo se a nuvem responder
          if(o.token) _db.__orcExcluidos.push(o.token);
          _db.__orcExcluidos.push(o.id);

          // Se gerou venda salva pendente (não faturada), remove a venda também
          if(o.vendaId){
            _db.vendas = (_db.vendas || []).filter(function(v){
              return v && v.id !== o.vendaId && !/faturad|finaliz|pago/i.test(v.status || '');
            });
            if(_db.os){
              _db.os = (_db.os || []).filter(function(x){ return x && x.vendaId !== o.vendaId; });
            }
          }
          o.status = 'excluido';
          o.excluidoEm = new Date().toISOString();
        }
      });

      _db.orcamentos = _db.orcamentos.filter(function(x){ return x && x.status !== 'excluido'; });

      if(typeof saveDB === 'function') saveDB();
      if(typeof window.renderOrcamentos === 'function') window.renderOrcamentos();
      if(typeof closeModal === 'function') closeModal();
      if(typeof toast === 'function') toast('Orçamento(s) excluído(s)', 'success');
    };

    if(typeof window.confirmSistema === 'function'){
      window.confirmSistema(msg, 'Excluir').then(function(ok){ if(ok) executar(); });
    } else if(typeof confirm === 'function' && confirm(msg)){
      executar();
    } else {
      executar();
    }
  }

  // Proteção: orçamentos apagados NUNCA mais criam venda
  if(typeof window !== 'undefined'){
    window.orcOnTipoItem = orcOnTipoItem;
    window.orcBuscarCliente = orcBuscarCliente;
    window.orcSelCliente = orcSelCliente;
    window.orcLimparCliente = orcLimparCliente;
    window.orcBuscarProd = orcBuscarProd;
    window.orcSelProd = orcSelProd;
    window.orcSelRecarga = orcSelRecarga;
    window.orcBuscarEtiqueta = orcBuscarEtiqueta;
    window.orcBuscarSerial = orcBuscarSerial;
    window.abrirVendaDeOrcamento = abrirVendaDeOrcamento;
    window.excluirOrcamentosMarcados = excluirOrcamentosMarcados;
    window.excluirOrcamento = excluirOrcamentosMarcados;

    // Override do Modal de Orçamento respeitando bloqueio quando Autorizado
  // v5.22.85 — Busca por número de série no orçamento: IGUAL às vendas.
  // Puxa a última notinha/venda com esse serial e já preenche modelo,
  // patrimônio, contador e o cliente sozinho (mesmas regras da aba OS).
  function orcBuscarSerial(serial){
    var s = getSess(); if(!s) return;
    var srl = txt(serial).toLowerCase();
    var info = document.getElementById('orc-serial-info');
    if(!srl){ if(info) info.classList.add('hidden'); return; }
    var _db = getDb();
    var normSerie = function(o){ return txt(o && (o.numeroSerie || o.serie)).toLowerCase(); };
    // 1) vendas com esse serial (a mais recente manda)
    var hist = (_db.vendas || []).filter(function(v){
      return v && v.empresaId === s.empresaId && v.os && normSerie(v.os) === srl;
    }).sort(function(a, b){ return new Date(b.data || 0) - new Date(a.data || 0); });
    // 2) chamados/OS com esse serial
    var chamado = (_db.os || []).filter(function(o){
      return o && o.empresaId === s.empresaId && normSerie(o) === srl;
    }).sort(function(a, b){ return new Date(b.abertura || b.criadoEm || 0) - new Date(a.abertura || a.criadoEm || 0); })[0];
    // 3) cadastro de equipamentos
    var eq = (_db.equipamentos || []).find(function(e){ return e && e.empresaId === s.empresaId && normSerie(e) === srl; });
    var ult = hist[0];
    var preencheu = 0;
    var setSeVazio = function(id, val){ var el = document.getElementById(id); if(el && !el.readOnly && !el.value.trim() && val != null && String(val).trim()){ el.value = String(val).trim(); preencheu++; } };
    var setSempre = function(id, val){ var el = document.getElementById(id); if(el && !el.readOnly && val != null && String(val).trim()){ el.value = String(val).trim(); preencheu++; } };
    var fonte = ult ? ult.os : (chamado || null);
    if(fonte){
      setSeVazio('orc-os-modelo', fonte.modelo || fonte.equipamentoModelo || '');
      setSeVazio('orc-os-patri', fonte.patrimonio || '');
      setSeVazio('orc-os-contador', fonte.contador != null ? fonte.contador : '');
    }
    if(eq){
      setSeVazio('orc-os-modelo', eq.modelo);
      setSeVazio('orc-os-patri', eq.patrimonio);
      setSeVazio('orc-os-contador', eq.contadorPB);
    }
    // cliente: última notinha > chamado > máquina instalada (parque)
    var cliId = ult ? ult.clienteId : (chamado ? chamado.clienteId : null);
    if(!cliId && eq){
      var inst = (_db.parque || []).find(function(p){ return p && p.empresaId === s.empresaId && p.equipamentoId === eq.id; });
      if(inst) cliId = inst.clienteId;
    }
    var f = window.__ORC_ST && window.__ORC_ST.form;
    var autoCli = false;
    if(cliId && !(f && f.cliente)){
      var c = (_db.clientes || []).find(function(x){ return x && x.id === cliId; });
      if(c){ orcSelCliente(c.id); autoCli = true; }
    }
    // regra das vendas: a última notinha encontrada comanda os dados do aparelho
    if(ult && ult.os){
      setSempre('orc-os-modelo', ult.os.modelo || ult.os.equipamentoModelo || '');
      setSempre('orc-os-patri', ult.os.patrimonio || '');
      if(ult.clienteId && !(f && f.cliente)){
        var c2 = (_db.clientes || []).find(function(x){ return x && x.id === ult.clienteId; });
        if(c2){ orcSelCliente(c2.id); autoCli = true; }
      }
    }
    if(info){
      var fmt = function(d){ return typeof fmtDate === 'function' ? fmtDate(d) : (d || '-'); };
      if(ult || chamado || eq){
        var clNome = ((_db.clientes || []).find(function(x){ return x && x.id === (ult ? ult.clienteId : cliId); }) || {}).nome || '-';
        info.className = 'col-span-12 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900 block';
        info.innerHTML = '<p class="font-bold mb-1"><i class="ph ph-clock-counter-clockwise"></i> Última notinha encontrada para este equipamento:</p>'
          + (ult ? 'Data: <b>' + fmt(ult.data) + '</b> • Cliente: <b>' + esc(clNome) + '</b> • Modelo: <b>' + esc(ult.os.modelo || '-') + '</b> • Venda/OS: <b>' + esc(ult.numero) + '</b>'
            : chamado ? 'Chamado <b>' + esc(chamado.numero || '-') + '</b> de <b>' + fmt(chamado.abertura || chamado.criadoEm) + '</b> • Cliente: <b>' + esc(clNome) + '</b>'
            : 'Equipamento cadastrado: <b>' + esc(eq.modelo || '-') + '</b> (patrimônio ' + esc(eq.patrimonio || '-') + ')')
          + (preencheu || autoCli ? '<p class="mt-1 text-emerald-800 font-semibold"><i class="ph ph-magic-wand"></i> Preenchido automaticamente' + (autoCli ? ' (incluindo cliente)' : '') + ' — confira antes de salvar.</p>' : '');
      } else {
        info.className = 'col-span-12 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-500 block';
        info.innerHTML = '<i class="ph ph-info"></i> Nenhuma notinha anterior encontrada para este número de série.';
      }
    }
  }

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
        // Cabeçalho
        +'<div class="grid grid-cols-2 md:grid-cols-5 gap-2">'
        +'<div class="rounded-xl bg-[#0a1e8a] text-white p-3"><p class="text-[10px] uppercase font-bold text-white/70">Código</p><p class="font-bold text-[15px]" id="orc-codigo">'+esc(f.codigo)+'</p></div>'
        +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Data</p><p class="font-bold">'+esc(f.data.split('-').reverse().join('/'))+'</p></div>'
        +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Hora</p><p class="font-bold">'+esc(f.hora)+'</p></div>'
        +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Vendedor</p><p class="font-bold">'+esc(s.usuarioNome)+'</p></div>'
        +'<div class="rounded-xl border p-3 flex flex-col justify-center"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Status</p><p><span class="'+statusBadgeCls+'">'+esc(statusRotulo)+'</span></p></div>'
        +'</div>'

        // Aviso de Orçamento Autorizado (se aplicável)
        +(isAutorizado ? '<div class="rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold"><span>🔒 Orçamento AUTORIZADO — Edição bloqueada (Venda salva já gerada)</span>' + (existente && (existente.vendaNumero || existente.vendaId) ? '<button type="button" onclick="abrirVendaDeOrcamento(\''+existente.id+'\')" class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"><i class="ph ph-arrow-square-out"></i> Abrir Venda Salva (nº '+(existente.vendaNumero || '')+')</button>' : '') + '</div>' : '')

        // Linha do Cliente com Filtro de Campos
        +'<div class="rounded-[14px] border-2 border-[#0a1e8a]/20 bg-[#f8f9ff] p-3">'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Cliente * — selecione o filtro e busque com Enter ou lupa</label>'
        +'<div class="flex flex-wrap items-center gap-2 mt-1">'
        +'<select id="orc-cli-campo" '+(isAutorizado ? 'disabled' : '')+' class="h-[44px] px-2 rounded-xl border bg-white text-[12px] min-w-[155px] shrink-0">'
        +CAMPOS_CLIENTE.map(function(c){ return '<option value="'+esc(c[0])+'">'+esc(c[1])+'</option>'; }).join('')
        +'</select>'
        +'<input id="orc-cli-search" '+(isAutorizado ? 'disabled placeholder="Orçamento autorizado (bloqueado para edição)"' : 'placeholder="Busque o cliente..."')+' class="flex-1 min-w-[200px] h-[44px] px-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white text-[13px]">'
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
          +'<label class="col-span-4 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">DESC R$<input id="orc-item-desc" type="number" step="0.01" value="" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-center"></label>'
          +'<label class="col-span-12 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">TOTAL<input id="orc-item-total" readonly class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-slate-100 font-bold text-center"></label>'
          +'</div>'
          +'<div id="orc-item-extra" class="hidden border-t border-[#0a1e8a]/10 pt-2 grid grid-cols-12 gap-2 items-end">'
          +'<label class="col-span-12 md:col-span-5 text-[11px] font-bold uppercase text-[#0a1e8a]">Etiqueta da recarga'
          +'<div class="flex gap-1 mt-1">'
          +'<input id="orc-item-cartucho" placeholder="Nº da etiqueta — se não achar, escreve e segue" class="flex-1 h-[38px] px-3 rounded-xl border bg-white text-[12px]">'
          +'<button id="orc-etq-lupa" type="button" onclick="window.orcBuscarEtiqueta && window.orcBuscarEtiqueta()" class="h-[38px] px-3 rounded-xl bg-[#0a1e8a] text-white shrink-0" title="Buscar etiqueta"><i class="ph ph-magnifying-glass"></i></button>'
          +'</div></label>'
          +'</div>'
          +'<div class="flex justify-end pt-1"><button type="button" id="orc-btn-add" disabled onclick="window.orcAddItem()" class="h-[40px] px-5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"><i class="ph ph-plus-circle"></i> Adicionar item</button></div>'
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
        +'<div class="rounded-[14px] border bg-[#f8f9ff] p-3 space-y-2">'
        +'<p class="text-[11px] font-bold text-[#0a1e8a] flex items-center gap-1.5"><i class="ph ph-info"></i> Dados da Ordem de Serviço (preenchimento opcional):</p>'
        +'<div class="grid grid-cols-12 gap-2 items-end">'
        +'<label class="col-span-12 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Número de série'
        +'<div class="flex gap-1 mt-1">'
        +'<input id="orc-os-serie" '+(isAutorizado ? 'readonly' : 'onchange="window.orcBuscarSerial && window.orcBuscarSerial(this.value)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();window.orcBuscarSerial && window.orcBuscarSerial(this.value);}"')+' value="'+esc(osData.numeroSerie || osData.serie || '')+'" placeholder="Número de série... (Enter ou lupa puxa o histórico)" class="flex-1 h-[40px] px-3 rounded-xl border bg-white text-[12.5px]">'
        +(!isAutorizado ? '<button type="button" onclick="window.orcBuscarSerial && window.orcBuscarSerial(document.getElementById(\'orc-os-serie\').value)" class="shrink-0 w-10 h-[40px] rounded-xl bg-[#0a1e8a] text-white grid place-items-center" title="Buscar histórico desse serial"><i class="ph ph-magnifying-glass"></i></button>' : '')
        +'</div></label>'
        +'<div id="orc-serial-info" class="col-span-12 hidden"></div>'
        +'<label class="col-span-12 md:col-span-4 text-[11px] font-bold uppercase text-[#0a1e8a]">Modelo do equipamento'
        +'<input id="orc-os-modelo" '+(isAutorizado ? 'readonly' : '')+' value="'+esc(osData.modelo || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Tipo da OS'
        +'<input id="orc-os-tipo" '+(isAutorizado ? 'readonly' : '')+' value="'+esc(osData.tipoOS || '')+'" placeholder="Ex: Manutenção..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">Patrimônio'
        +'<input id="orc-os-patri" '+(isAutorizado ? 'readonly' : '')+' value="'+esc(osData.patrimonio || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">Contador / cópias'
        +'<input id="orc-os-contador" '+(isAutorizado ? 'readonly' : '')+' value="'+esc(osData.contador || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-12 md:col-span-4 text-[11px] font-bold uppercase text-[#0a1e8a]">Acessórios'
        +'<input id="orc-os-acess" '+(isAutorizado ? 'readonly' : '')+' value="'+esc(osData.acessorios || '')+'" placeholder="cabos, fonte..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Técnico responsável'
        +'<input id="orc-os-tec" '+(isAutorizado ? 'readonly' : '')+' value="'+esc(osData.tecnico || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Responsável entrega'
        +'<input id="orc-os-entrega" '+(isAutorizado ? 'readonly' : '')+' value="'+esc(osData.responsavelEntrega || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Garantia'
        +'<input id="orc-os-garantia" '+(isAutorizado ? 'readonly' : '')+' value="'+esc(osData.garantia || '')+'" placeholder="Ex: 90 dias..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Situação da OS'
        +'<input id="orc-os-situacao" '+(isAutorizado ? 'readonly' : '')+' value="'+esc(osData.situacao || '')+'" placeholder="Ex: Em análise..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-12 text-[11px] font-bold uppercase text-[#0a1e8a]">Defeito apresentado'
        +'<textarea id="orc-os-defeito" '+(isAutorizado ? 'readonly' : '')+' placeholder="O que o cliente relatou..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.defeito || '')+'</textarea></label>'
        +'<label class="col-span-12 md:col-span-6 text-[11px] font-bold uppercase text-[#0a1e8a]">Serviços executados / previstos'
        +'<textarea id="orc-os-servicos" '+(isAutorizado ? 'readonly' : '')+' placeholder="Serviços a executar..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.servicos || '')+'</textarea></label>'
        +'<label class="col-span-12 md:col-span-6 text-[11px] font-bold uppercase text-[#0a1e8a]">Peças utilizadas / orçadas'
        +'<textarea id="orc-os-pecas" '+(isAutorizado ? 'readonly' : '')+' placeholder="Peças necessárias..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.pecas || '')+'</textarea></label>'
        +'</div>'
        +'</div>'
        +'</div>'

        // Observações e Total
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Observações do Orçamento<textarea id="orc-obs" '+(isAutorizado ? 'readonly' : '')+' class="mt-1 w-full h-[52px] p-2 rounded-xl border">'+esc(f.obs)+'</textarea></label>'
        +'<div class="rounded-[14px] bg-[#0a1e8a] text-white p-3 flex justify-between items-center"><span class="font-bold">TOTAL DO ORÇAMENTO</span><b id="orc-total" class="text-[18px]">R$ 0,00</b></div>'
        +'</div>';

      document.getElementById('modal-footer').innerHTML =
        '<button onclick="closeModal()" class="h-[46px] px-5 rounded-xl bg-white border text-red-600 font-bold">Sair</button>'
        +(isAutorizado ? '<button type="button" onclick="window.abrirVendaDeOrcamento(\''+esc(f.vendaId || f.id)+'\')" class="h-[46px] px-5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2"><i class="ph ph-shopping-bag"></i> Abrir Venda Salva (nº '+(f.vendaNumero ? esc(f.vendaNumero) : '')+')</button>' : '')
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

    // Override do orcRenderItens
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

    // v5.22.86 — remove um item da lista do orçamento. A lixeira da tabela
    // chama essa função e ela não existia (erro "orcDelItem is not a function").
    window.orcDelItem = function(idx){
      var f = window.__ORC_ST && window.__ORC_ST.form;
      if(!f || !f.itens) return;
      idx = n(idx);
      if(idx < 0 || idx >= f.itens.length) return;
      if(f.status === 'aprovado' || f.vendaId){ if(typeof toast === 'function') toast('Orçamento autorizado não pode ser editado', 'error'); return; }
      f.itens.splice(idx, 1);
      if(typeof window.orcRenderItens === 'function') window.orcRenderItens();
    };

    // Override do salvarOrcamentoTela com bloqueio em autorizados
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
        tecnico: txt(document.getElementById('orc-os-tec') && document.getElementById('orc-os-tec').value),
        responsavelEntrega: txt(document.getElementById('orc-os-entrega') && document.getElementById('orc-os-entrega').value),
        acessorios: txt(document.getElementById('orc-os-acess') && document.getElementById('orc-os-acess').value),
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
      // v5.22.85 — reabre o orçamento recém-salvo DIRETO pelo objeto: sem
      // consulta no meio, sem chance de aparecer "Orçamento não encontrado"
      if(typeof window.abrirTelaOrcamento === 'function') window.abrirTelaOrcamento(o);
      else if(typeof window.abrirOrcamento === 'function') window.abrirOrcamento(o.id);
    };

    // Sincronização de versão visual
    function sincronizarVersaoVisual60(){
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

    console.log('[DIGICOPY] v' + VERSAO + ': Trava de orçamentos autorizados e atalho para venda salva ativos!');
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
