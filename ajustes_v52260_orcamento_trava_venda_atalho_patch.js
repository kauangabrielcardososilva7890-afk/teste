// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.22.60 — Orçamentos: Trava de Edição em Autorizados, Atalho para Venda Salva,
//                  Criação ÚNICA de Venda (nunca recria se deletar venda ou orçamento),
//                  Impressão Completa com Ordem de Serviço (sem forçar salvar),
//                  Exclusão Segura e Seleção Inteligente de Cliente
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  'use strict';

  var VERSAO = '5.22.60';
  if(typeof window !== 'undefined'){
    window.DIGICOPY_APP_VERSION = VERSAO;
  }

  var PAGINA_CLIENTE = 'https://digicopy-orcamentos.pages.dev/';
  var AVISO_PADRAO = 'Prezados clientes,\n\nInformamos que as manutenções em impressoras EPSON exigem um prazo maior para a conclusão. Para estes equipamentos, utilizamos produtos químicos específicos que demandam um tempo necessário de reação para garantir a eficácia do serviço. Por isso, solicitamos um prazo médio de 15 dias úteis para a entrega da manutenção.\n\nVale ressaltar que o equipamento pode ficar pronto antes deste prazo, a depender da agilidade da reação dos produtos utilizados.\n\nAgradecemos a compreensão de todos e nos colocamos à disposição para eventuais dúvidas!';

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

  function b64url(obj){
    try{
      var j = JSON.stringify(obj);
      var b = btoa(unescape(encodeURIComponent(j)));
      return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }catch(e){ return ''; }
  }

  function payloadLink(o, cli, emp){
    var res = {
      t: (o && o.token) || '',
      n: (o && o.numero) || '',
      c: (cli && (cli.nome || cli.fantasia)) || (o && o.clienteNome) || '',
      dt: String((o && (o.data || o.criadoEm)) || '').slice(0, 10),
      tot: n(o && o.total),
      w: (emp && (emp.whatsapp || emp.telefone)) || (o && o.lojaWhatsapp) || '',
      it: ((o && o.itens) || []).map(function(it){
        return { d: it.descricao || '', q: it.qtd, p: it.preco, s: it.subtotal };
      })
    };
    if(o && o.os && typeof o.os === 'object'){
      var os = o.os;
      var temOS = Object.keys(os).some(function(k){ return txt(os[k]); });
      if(temOS){
        res.os = {
          m: os.modelo || '',
          s: os.numeroSerie || os.serie || '',
          p: os.patrimonio || '',
          c: os.contador || '',
          t: os.tipoOS || '',
          tec: os.tecnico || '',
          ent: os.responsavelEntrega || '',
          g: os.garantia || '',
          sit: os.situacao || '',
          def: os.defeito || '',
          srv: os.servicos || '',
          pec: os.pecas || '',
          ac: os.acessorios || ''
        };
      }
    }
    return res;
  }

  function linkPublicoOrcamento(o, cli, emp){
    if(!o) return PAGINA_CLIENTE;
    var _db = getDb();
    var c = cli || (_db.clientes || []).find(function(x){ return x && x.id === o.clienteId; }) || {};
    var s = getSess();
    var e = emp || (s && (_db.empresas || []).find(function(x){ return x && x.id === s.empresaId; })) || (_db.config && _db.config.empresa) || {};
    var p = payloadLink(o, c, e);
    var dStr = b64url(p);
    var tok = o.token || '';
    return PAGINA_CLIENTE + '?c=' + encodeURIComponent(tok) + '&d=' + encodeURIComponent(dStr) + '&v=' + VERSAO;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROTEÇÃO CONTRA RECRIAÇÃO DE VENDAS E ORÇAMENTOS EXCLUÍDOS
  // ═══════════════════════════════════════════════════════════════════════════

  function registrarExclusaoVendaOrcamento(vendaId, vendaObj){
    var _db = getDb();
    if(!_db) return;
    if(!_db.__vendasExcluidas) _db.__vendasExcluidas = [];
    if(vendaId && !_db.__vendasExcluidas.includes(vendaId)) _db.__vendasExcluidas.push(vendaId);
    if(!_db.__vendasDeOrcamentosExcluidas) _db.__vendasDeOrcamentosExcluidas = [];

    var v = vendaObj || (_db.vendas || []).find(function(x){ return x && x.id === vendaId; });
    var orcOrigemId = v ? (v.origemOrcamentoId || v.orcamentoId) : null;

    (_db.orcamentos || []).forEach(function(o){
      if(!o) return;
      if(o.vendaId === vendaId || (orcOrigemId && (o.id === orcOrigemId || o.token === orcOrigemId)) || (v && v.numero && o.vendaNumero === v.numero)){
        o.vendaExcluida = true;
        o.vendaGeradaUmaVez = true;
        o.vendaId = null;
        if(!_db.__vendasDeOrcamentosExcluidas.includes(o.id)) _db.__vendasDeOrcamentosExcluidas.push(o.id);
        if(o.token && !_db.__vendasDeOrcamentosExcluidas.includes(o.token)) _db.__vendasDeOrcamentosExcluidas.push(o.token);
      }
    });

    if(typeof saveDB === 'function') saveDB();
  }

  // Saneamento inicial: orçamentos antigos excluídos ou com vendas deletadas NUNCA recriam venda
  function sanitizarOrcamentosVendasExcluidas(){
    var _db = getDb();
    if(!_db || !_db.orcamentos) return;
    if(!_db.__vendasDeOrcamentosExcluidas) _db.__vendasDeOrcamentosExcluidas = [];
    if(!_db.__orcExcluidos) _db.__orcExcluidos = [];

    var alterou = false;
    _db.orcamentos.forEach(function(o){
      if(!o) return;
      if(o.status === 'excluido' || _db.__orcExcluidos.includes(o.id) || (o.token && _db.__orcExcluidos.includes(o.token))){
        if(!_db.__orcExcluidos.includes(o.id)) _db.__orcExcluidos.push(o.id);
        if(o.token && !_db.__orcExcluidos.includes(o.token)) _db.__orcExcluidos.push(o.token);
        if(!_db.__vendasDeOrcamentosExcluidas.includes(o.id)) _db.__vendasDeOrcamentosExcluidas.push(o.id);
        if(o.token && !_db.__vendasDeOrcamentosExcluidas.includes(o.token)) _db.__vendasDeOrcamentosExcluidas.push(o.token);
        o.vendaExcluida = true;
        o.vendaGeradaUmaVez = true;
        alterou = true;
      } else if(o.vendaId){
        var vendaExiste = (_db.vendas || []).some(function(v){ return v && (v.id === o.vendaId || v.origemOrcamentoId === o.id); });
        if(!vendaExiste){
          o.vendaExcluida = true;
          o.vendaGeradaUmaVez = true;
          if(!_db.__vendasDeOrcamentosExcluidas.includes(o.id)) _db.__vendasDeOrcamentosExcluidas.push(o.id);
          if(o.token && !_db.__vendasDeOrcamentosExcluidas.includes(o.token)) _db.__vendasDeOrcamentosExcluidas.push(o.token);
          alterou = true;
        } else {
          o.vendaGeradaUmaVez = true;
        }
      }
    });

    if(alterou && typeof saveDB === 'function') saveDB();
  }

  // Intercepta rotinas de exclusão de vendas
  if(typeof window !== 'undefined'){
    if(typeof window.deleteVenda === 'function' && !window.deleteVenda.__v52260hook){
      var oldDelVenda = window.deleteVenda;
      window.deleteVenda = function(id){
        var _db = getDb();
        var v = (_db && _db.vendas || []).find(function(x){ return x && x.id === id; });
        var res = oldDelVenda.apply(this, arguments);
        registrarExclusaoVendaOrcamento(id, v);
        return res;
      };
      window.deleteVenda.__v52260hook = true;
    }

    if(typeof window.excluirVendaUnificado === 'function' && !window.excluirVendaUnificado.__v52260hook){
      var oldExclUnif = window.excluirVendaUnificado;
      window.excluirVendaUnificado = function(){
        var id = window.vendaSelecionadaId || window.neoVendaSelecionada;
        var _db = getDb();
        var v = id && (_db && _db.vendas || []).find(function(x){ return x && x.id === id; });
        var res = oldExclUnif.apply(this, arguments);
        if(id) registrarExclusaoVendaOrcamento(id, v);
        return res;
      };
      window.excluirVendaUnificado.__v52260hook = true;
    }

    if(typeof window.excluirVendaNeo === 'function' && !window.excluirVendaNeo.__v52260hook){
      var oldExclNeo = window.excluirVendaNeo;
      window.excluirVendaNeo = function(){
        var id = window.neoVendaSelecionada;
        var _db = getDb();
        var v = id && (_db && _db.vendas || []).find(function(x){ return x && x.id === id; });
        var res = oldExclNeo.apply(this, arguments);
        if(id) registrarExclusaoVendaOrcamento(id, v);
        return res;
      };
      window.excluirVendaNeo.__v52260hook = true;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SELEÇÃO E BUSCA DE CLIENTE E PRODUTOS NO ORÇAMENTO
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

  function orcBuscarCliente(mostrarIniciais){
    if(typeof document === 'undefined') return;
    var inp = document.getElementById('orc-cli-search');
    var q = txt(inp && inp.value);
    var el = document.getElementById('orc-cli-results');
    if(!el) return;

    var s = getSess();
    var _db = getDb();
    var list = (_db.clientes || []).filter(function(c){
      if(!c || c.status === 'inativo' || c.status === 'excluido') return false;
      if(s && s.empresaId && c.empresaId && c.empresaId !== s.empresaId) return false;
      return true;
    });

    if(!q){
      if(mostrarIniciais && list.length){
        list = list.slice(0, 10);
      } else {
        el.classList.add('hidden');
        el.innerHTML = '';
        return;
      }
    } else {
      var campo = (document.getElementById('orc-cli-campo') || {}).value || 'todos';
      if(window.FILTROS_BUSCA_PURE && typeof window.FILTROS_BUSCA_PURE.filtraClientes === 'function'){
        list = window.FILTROS_BUSCA_PURE.filtraClientes(list, q, campo);
      } else {
        var low = q.toLowerCase();
        list = list.filter(function(c){
          return String(c.nome || '').toLowerCase().includes(low)
            || String(c.fantasia || '').toLowerCase().includes(low)
            || String(c.codigo || '').includes(low)
            || String(c.documento || '').includes(low)
            || String(c.telefone || c.whatsapp || '').includes(low);
        });
      }
    }

    list = list.slice(0, 15);
    el.classList.remove('hidden');
    el.innerHTML = list.map(function(c){
      var docTel = [c.documento, c.telefone || c.whatsapp, c.cidade].filter(Boolean).join(' • ');
      return '<button type="button" onclick="window.orcSelCliente(\'' + esc(c.id) + '\')" class="w-full text-left px-3 py-2.5 hover:bg-[#f0f2ff] border-b last:border-0 transition">'
        + '<div class="flex justify-between items-center"><b class="text-[#0a1e8a] text-[13px]">#' + esc(c.codigo || '-') + ' ' + esc(c.nome || c.fantasia || '') + '</b>'
        + (c.fantasia && c.fantasia !== c.nome ? '<span class="text-slate-500 text-[11px]">(' + esc(c.fantasia) + ')</span>' : '') + '</div>'
        + (docTel ? '<span class="text-slate-500 text-[11px] block mt-0.5">' + esc(docTel) + '</span>' : '')
        + '</button>';
    }).join('') || '<p class="px-3 py-3 text-slate-400 text-xs">Nenhum cliente encontrado com esse filtro.</p>';
  }

  function orcSelCliente(id){
    var _db = getDb();
    var c = (_db.clientes || []).find(function(x){ return x && x.id === id; });
    if(!c) return;

    if(!window.__ORC_ST) window.__ORC_ST = {};
    if(!window.__ORC_ST.form) window.__ORC_ST.form = {};

    window.__ORC_ST.form.cliente = c;
    window.__ORC_ST.form.clienteId = c.id;
    window.__ORC_ST.form.clienteNome = c.nome || c.fantasia || '';

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
    if(window.__ORC_ST && window.__ORC_ST.form){
      window.__ORC_ST.form.cliente = null;
      window.__ORC_ST.form.clienteId = null;
      window.__ORC_ST.form.clienteNome = '';
    }
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
    }).join('') || '<p class="px-3 py-2 text-slate-400">Nenhum produto encontrado. Você pode digitar a descrição diretamente.</p>';
  }

  function orcSelProd(id){
    var _db = getDb();
    var p = (_db.produtos || []).find(function(x){ return x && x.id === id; });
    if(!p || !window.__ORC_ST || !window.__ORC_ST.form) return;

    window.__ORC_ST.form.produtoSel = p;
    var inp = document.getElementById('orc-prod-search');
    if(inp) inp.value = p.nome || '';
    var vu = document.getElementById('orc-item-vunit');
    if(vu) vu.value = n(p.preco || 0).toFixed(2);

    var resEl = document.getElementById('orc-prod-results');
    if(resEl){ resEl.classList.add('hidden'); resEl.innerHTML = ''; }
    if(typeof window.orcCalcItem === 'function') window.orcCalcItem();
  }

  function orcSelRecarga(id){
    var _db = getDb();
    var r = (_db.recargas || []).find(function(x){ return x && x.id === id; });
    if(!r || !window.__ORC_ST || !window.__ORC_ST.form) return;

    var inp = document.getElementById('orc-prod-search');
    if(inp) inp.value = r.nome || ('Recarga ' + (r.codigo || ''));
    var vu = document.getElementById('orc-item-vunit');
    if(vu) vu.value = n(r.preco || 0).toFixed(2);

    var resEl = document.getElementById('orc-prod-results');
    if(resEl){ resEl.classList.add('hidden'); resEl.innerHTML = ''; }
    if(typeof window.orcCalcItem === 'function') window.orcCalcItem();
  }

  function orcBuscarEtiqueta(){
    if(typeof document === 'undefined') return;
    var inp = document.getElementById('orc-item-cartucho');
    var etq = txt(inp && inp.value);
    if(!etq){
      if(typeof toast === 'function') toast('Digite o número da etiqueta do toner', 'info');
      return;
    }
    var _db = getDb();
    var itemEtq = (_db.recargasEtiquetas || []).find(function(x){
      return x && String(x.etiqueta || x.numero || '').toLowerCase() === etq.toLowerCase();
    });
    if(itemEtq){
      if(itemEtq.modelo && !txt(document.getElementById('orc-prod-search') && document.getElementById('orc-prod-search').value)){
        var pInp = document.getElementById('orc-prod-search');
        if(pInp) pInp.value = 'Recarga ' + itemEtq.modelo;
      }
      if(typeof toast === 'function') toast('Etiqueta #' + etq + ' localizada!', 'success');
    } else {
      if(typeof toast === 'function') toast('Etiqueta manual informada. Prosseguindo.', 'info');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ATALHO PARA ABRIR A VENDA SALVA GERADA PELO ORÇAMENTO
  // ═══════════════════════════════════════════════════════════════════════════

  function abrirVendaDeOrcamento(paramOrcIdOuVendaId){
    var s = getSess(); if(!s) return;
    var _db = getDb();
    var paramStr = String(paramOrcIdOuVendaId || '');

    var v = (_db.vendas || []).find(function(x){
      return x && (x.id === paramStr || x.origemOrcamentoId === paramStr || x.numero === paramStr);
    });

    if(!v){
      var o = (_db.orcamentos || []).find(function(x){ return x && (x.id === paramStr || x.vendaId === paramStr); });
      if(o && o.vendaId){
        v = (_db.vendas || []).find(function(x){ return x && x.id === o.vendaId; });
      }
    }

    if(!v){
      if(typeof window.lfbAlert === 'function') window.lfbAlert('A venda salva referente a este orçamento foi excluída do sistema.', 'Venda Não Encontrada');
      else if(typeof toast === 'function') toast('Venda salva não encontrada no sistema', 'error');
      return;
    }

    if(typeof closeModal === 'function') closeModal();

    if(typeof window.navigateTo === 'function'){
      window.navigateTo('vendas');
    }

    setTimeout(function(){
      window.neoVendaSelecionada = v.id;
      window.vendaSelecionadaId = v.id;
      if(typeof window.historicoVenda === 'function'){
        window.historicoVenda(v.id);
      } else if(typeof window.abrirVenda === 'function'){
        window.abrirVenda(v.id);
      } else if(typeof window.renderVendas === 'function'){
        window.renderVendas();
      }
    }, 120);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCLUSÃO FUNCIONAL DE ORÇAMENTOS COM BLOQUEIO DE RECRIAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  function excluirOrcamentosMarcados(idDireto){
    var _db = getDb();
    if(!_db.orcamentos) _db.orcamentos = [];
    if(!_db.__orcExcluidos) _db.__orcExcluidos = [];
    if(!_db.__vendasDeOrcamentosExcluidas) _db.__vendasDeOrcamentosExcluidas = [];

    var ids = [];
    if(idDireto){
      ids = [idDireto];
    } else {
      document.querySelectorAll('input[name="orc-check"]:checked').forEach(function(c){
        if(c.value) ids.push(c.value);
      });
    }

    if(!ids.length){
      if(typeof toast === 'function') toast('Selecione pelo menos um orçamento para excluir', 'info');
      return;
    }

    var msg = ids.length === 1 ? 'Deseja realmente excluir este orçamento?' : ('Deseja excluir os ' + ids.length + ' orçamentos selecionados?');

    var executar = function(){
      ids.forEach(function(id){
        var o = _db.orcamentos.find(function(x){ return x && x.id === id; });
        if(o){
          o.status = 'excluido';
          o.vendaExcluida = true;
          o.vendaGeradaUmaVez = true;
          if(!_db.__orcExcluidos.includes(o.id)) _db.__orcExcluidos.push(o.id);
          if(o.token && !_db.__orcExcluidos.includes(o.token)) _db.__orcExcluidos.push(o.token);
          if(!_db.__vendasDeOrcamentosExcluidas.includes(o.id)) _db.__vendasDeOrcamentosExcluidas.push(o.id);
          if(o.token && !_db.__vendasDeOrcamentosExcluidas.includes(o.token)) _db.__vendasDeOrcamentosExcluidas.push(o.token);
        } else {
          if(!_db.__orcExcluidos.includes(id)) _db.__orcExcluidos.push(id);
          if(!_db.__vendasDeOrcamentosExcluidas.includes(id)) _db.__vendasDeOrcamentosExcluidas.push(id);
        }
      });

      _db.orcamentos = _db.orcamentos.filter(function(x){
        return x && x.status !== 'excluido' && !_db.__orcExcluidos.includes(x.id) && (!x.token || !_db.__orcExcluidos.includes(x.token));
      });

      if(typeof saveDB === 'function') saveDB();
      if(typeof toast === 'function') toast('Orçamento(s) excluído(s) com sucesso', 'success');
      if(typeof window.renderOrcamentos === 'function') window.renderOrcamentos();
      if(typeof closeModal === 'function') closeModal();
    };

    if(typeof window.lfbConfirm === 'function'){
      window.lfbConfirm(msg, 'Excluir Orçamento', function(ok){
        if(ok) executar();
      });
    } else if(typeof confirm === 'function'){
      if(confirm(msg)) executar();
    } else {
      executar();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GERAÇÃO DE VENDA COM PROTEÇÃO DE 1 ÚNICA VEZ
  // ═══════════════════════════════════════════════════════════════════════════

  function gerarVendaSalvaDeOrcamentoSafe(orcId, origem){
    var _db = getDb();
    if(!_db.orcamentos) _db.orcamentos = [];
    if(!_db.vendas) _db.vendas = [];
    if(!_db.notificacoes) _db.notificacoes = [];
    if(!_db.__vendasDeOrcamentosExcluidas) _db.__vendasDeOrcamentosExcluidas = [];
    if(!_db.__orcExcluidos) _db.__orcExcluidos = [];

    var o = _db.orcamentos.find(function(x){ return x && (x.id === orcId || x.token === orcId); });
    if(!o || o.status === 'excluido' || o.vendaExcluida || o.vendaGeradaUmaVez) return null;
    if(_db.__orcExcluidos.includes(orcId) || (o.token && _db.__orcExcluidos.includes(o.token))) return null;
    if(_db.__vendasDeOrcamentosExcluidas.includes(orcId) || (o.token && _db.__vendasDeOrcamentosExcluidas.includes(o.token))) return null;

    if(o.vendaId){
      var vendaExistente = _db.vendas.find(function(v){ return v && (v.id === o.vendaId || v.origemOrcamentoId === o.id); });
      if(vendaExistente){
        o.status = 'aprovado';
        o.vendaNumero = vendaExistente.numero || o.vendaNumero;
        o.vendaGeradaUmaVez = true;
        if(typeof saveDB === 'function') saveDB();
        return vendaExistente;
      } else {
        o.vendaExcluida = true;
        o.vendaGeradaUmaVez = true;
        if(!_db.__vendasDeOrcamentosExcluidas.includes(o.id)) _db.__vendasDeOrcamentosExcluidas.push(o.id);
        if(o.token && !_db.__vendasDeOrcamentosExcluidas.includes(o.token)) _db.__vendasDeOrcamentosExcluidas.push(o.token);
        if(typeof saveDB === 'function') saveDB();
        return null;
      }
    }

    if(o.vendaGeradaUmaVez || o.vendaExcluida) return null;

    var s = getSess();
    var empId = o.empresaId || (s && s.empresaId) || 'emp_default';
    var vId = 'vda_orc_' + String(o.id || Date.now().toString(36));
    var vNum = o.vendaNumero || (typeof window !== 'undefined' && window.proximaVendaNumero ? window.proximaVendaNumero(empId) : String(Date.now().toString(36)));

    var cli = (_db.clientes || []).find(function(c){ return c && c.id === o.clienteId; }) || {};
    var cliNome = (cli.nome || cli.fantasia || o.clienteNome || 'Cliente');

    var novaVenda = {
      id: vId,
      empresaId: empId,
      numero: vNum,
      clienteId: o.clienteId || null,
      clienteNome: cliNome,
      data: new Date().toISOString(),
      itens: (o.itens || []).map(function(it){
        return {
          produtoId: it.produtoId || null,
          descricao: it.descricao || '',
          sku: it.sku || '',
          qtd: n(it.qtd || 1),
          preco: n(it.preco || 0),
          desconto: n(it.desconto || 0),
          subtotal: n(it.subtotal || 0),
          tipo: it.tipo || 'Produto'
        };
      }),
      desconto: n(o.desconto || 0),
      total: n(o.total || 0),
      formaPagamento: 'A prazo',
      observacao: 'Gerada do orçamento ' + (o.numero || ''),
      status: 'aguardar',
      origemOrcamentoId: o.id,
      os: o.os ? Object.assign({}, o.os) : null,
      criadoPor: s ? s.usuarioId : (o.criadoPor || 'sistema'),
      criadoPorNome: s ? s.usuarioNome : (o.criadoPorNome || 'Cliente (Aprovação)'),
      criadoEm: new Date().toISOString(),
      atendenteNome: s ? s.usuarioNome : (o.criadoPorNome || 'Sistema')
    };

    _db.vendas.unshift(novaVenda);

    o.status = 'aprovado';
    o.vendaId = novaVenda.id;
    o.vendaNumero = novaVenda.numero;
    o.vendaGeradaUmaVez = true;
    o.aprovadoEm = new Date().toISOString();
    o.aprovadoOrigem = origem || 'cliente';

    if(typeof saveDB === 'function') saveDB();
    return novaVenda;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPRESSÃO COMPLETA COM ORDEM DE SERVIÇO (SEM FORÇAR SALVAR)
  // ═══════════════════════════════════════════════════════════════════════════

  function gerarHtmlOrcamentoCompleto(id){
    var _db = getDb();
    var o = (_db.orcamentos || []).find(function(x){ return x && (x.id === id || x.token === id); });
    if(!o) return '';

    var cli = (_db.clientes || []).find(function(c){ return c && c.id === o.clienteId; }) || {};
    var s = getSess();
    var emp = (s && (_db.empresas || []).find(function(x){ return x && x.id === s.empresaId; })) || (_db.config && _db.config.empresa) || {};
    var link = linkPublicoOrcamento(o, cli, emp);
    var logo = (typeof window !== 'undefined' && window.DIGICOPY_LOGO) ? '<img src="' + window.DIGICOPY_LOGO + '" style="max-height:55px;object-fit:contain">' : '<b style="font-size:22px;color:#0a1e8a">DIGICOPY</b>';

    var itensHtml = (o.itens || []).map(function(it, i){
      var subt = Math.max(0, n(it.qtd) * n(it.preco) - n(it.desconto));
      return '<tr>'
        + '<td style="text-align:center;padding:6px;border:1px solid #e2e8f0;font-size:11px">' + esc(it.tipo || 'Prod') + '</td>'
        + '<td style="padding:6px;border:1px solid #e2e8f0;font-size:11px"><b>' + esc(it.descricao || '') + '</b>' + (it.numCartucho ? '<br><span style="font-size:10px;color:#64748b">Etiqueta: ' + esc(it.numCartucho) + '</span>' : '') + '</td>'
        + '<td style="text-align:center;padding:6px;border:1px solid #e2e8f0;font-size:11px">' + esc(it.qtd) + '</td>'
        + '<td style="text-align:right;padding:6px;border:1px solid #e2e8f0;font-size:11px">' + money(it.preco) + '</td>'
        + '<td style="text-align:right;padding:6px;border:1px solid #e2e8f0;font-size:11px">' + (n(it.desconto) > 0 ? money(it.desconto) : '-') + '</td>'
        + '<td style="text-align:right;padding:6px;border:1px solid #e2e8f0;font-size:11px"><b>' + money(subt) + '</b></td>'
        + '</tr>';
    }).join('');

    var osHtml = '';
    if(o.os && typeof o.os === 'object'){
      var os = o.os;
      var camposOS = [];
      if(os.modelo) camposOS.push(['Equipamento/Modelo', os.modelo]);
      if(os.numeroSerie || os.serie) camposOS.push(['Nº de Série', os.numeroSerie || os.serie]);
      if(os.patrimonio) camposOS.push(['Patrimônio', os.patrimonio]);
      if(os.contador) camposOS.push(['Contador', os.contador]);
      if(os.tipoOS) camposOS.push(['Tipo da OS', os.tipoOS]);
      if(os.tecnico) camposOS.push(['Técnico', os.tecnico]);
      if(os.responsavelEntrega) camposOS.push(['Resp. Entrega', os.responsavelEntrega]);
      if(os.garantia) camposOS.push(['Garantia', os.garantia]);
      if(os.situacao) camposOS.push(['Situação', os.situacao]);
      if(os.acessorios) camposOS.push(['Acessórios', os.acessorios]);

      var blocosOS = [];
      if(os.defeito) blocosOS.push(['Defeito Apresentado / Relato', os.defeito]);
      if(os.servicos) blocosOS.push(['Serviços Executados / Previstos', os.servicos]);
      if(os.pecas) blocosOS.push(['Peças Utilizadas / Orçadas', os.pecas]);

      if(camposOS.length || blocosOS.length){
        osHtml = '<div style="margin:12px 0;padding:10px 14px;background:#f8f9ff;border:1.5px solid #c7d2fe;border-radius:10px;font-size:11px">'
          + '<div style="font-weight:800;color:#0a1e8a;margin-bottom:8px;font-size:12px">🔧 DADOS DA ORDEM DE SERVIÇO</div>'
          + (camposOS.length ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px 12px;margin-bottom:8px">'
            + camposOS.map(function(c){
              return '<div><span style="display:block;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:700">' + esc(c[0]) + '</span><b>' + esc(c[1]) + '</b></div>';
            }).join('') + '</div>' : '')
          + (blocosOS.length ? blocosOS.map(function(b){
            return '<div style="margin-top:6px;padding-top:6px;border-top:1px dashed #cbd5e1"><span style="display:block;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:700">' + esc(b[0]) + '</span><p style="margin:2px 0;font-size:11px">' + esc(b[1]) + '</p></div>';
          }).join('') : '')
          + '</div>';
      }
    }

    var dataStr = o.data ? o.data.slice(0, 10).split('-').reverse().join('/') : new Date().toLocaleDateString('pt-BR');

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orçamento ' + esc(o.numero) + '</title><style>'
      + '@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}'
      + 'body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#0f172a;line-height:1.4;margin:0;padding:0}'
      + '.no-print{margin-bottom:14px;text-align:center;padding:10px;background:#f1f5f9;border-radius:8px}'
      + '.btn{padding:8px 18px;border-radius:6px;font-weight:700;cursor:pointer;border:0;margin:0 4px}'
      + '.btn-blue{background:#0a1e8a;color:#fff}.btn-gray{background:#fff;border:1px solid #cbd5e1;color:#334155}'
      + '@media print{.no-print{display:none!important}body{padding:0}}'
      + '</style></head><body>'
      + '<div class="no-print"><button class="btn btn-blue" onclick="window.print()">🖨️ Imprimir Orçamento</button><button class="btn btn-gray" onclick="window.close()">Fechar</button></div>'
      + '<div style="border:1.5px solid #0a1e8a;border-radius:12px;padding:16px">'
      // Topo
      + '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0a1e8a;padding-bottom:10px;margin-bottom:12px">'
      + '<div>' + logo + '<br><b style="font-size:13px">' + esc(emp.fantasia || emp.nome || 'DIGICOPY') + '</b><br><span style="font-size:10px;color:#475569">' + esc([emp.cnpj, emp.telefone || emp.whatsapp, emp.email].filter(Boolean).join(' • ')) + '</span></div>'
      + '<div style="text-align:right"><div style="display:inline-block;background:#0a1e8a;color:#fff;padding:6px 12px;border-radius:8px;font-weight:800;font-size:14px">ORÇAMENTO #' + esc(o.numero) + '</div><br><span style="font-size:10px;color:#475569;display:block;margin-top:4px">Data: <b>' + esc(dataStr) + '</b></span></div>'
      + '</div>'
      // Cliente
      + '<div style="background:#f8f9ff;border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:12px">'
      + '<b style="color:#0a1e8a;font-size:11.5px">DADOS DO CLIENTE</b><br>'
      + '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:4px;margin-top:4px;font-size:11px">'
      + '<div><span style="color:#64748b;font-size:9px;text-transform:uppercase;font-weight:700">Nome: </span><b>' + esc(cli.nome || o.clienteNome || '(não informado)') + '</b></div>'
      + '<div><span style="color:#64748b;font-size:9px;text-transform:uppercase;font-weight:700">Documento: </span>' + esc(cli.documento || '-') + '</div>'
      + '<div><span style="color:#64748b;font-size:9px;text-transform:uppercase;font-weight:700">Telefone: </span>' + esc(cli.telefone || cli.whatsapp || '-') + '</div>'
      + '</div>'
      + '</div>'
      // Ordem de Serviço (se houver)
      + osHtml
      // Itens
      + '<div style="margin-top:10px"><b style="color:#0a1e8a;font-size:11.5px">ITENS DO ORÇAMENTO</b></div>'
      + '<table style="width:100%;border-collapse:collapse;margin-top:6px">'
      + '<thead style="background:#0a1e8a;color:#fff;font-size:10px;text-transform:uppercase">'
      + '<tr><th style="padding:6px;text-align:center">Tipo</th><th style="padding:6px;text-align:left">Descrição</th><th style="padding:6px;text-align:center">Qtd</th><th style="padding:6px;text-align:right">V. Unit</th><th style="padding:6px;text-align:right">Desc</th><th style="padding:6px;text-align:right">Total</th></tr>'
      + '</thead><tbody>'
      + (itensHtml || '<tr><td colspan="6" style="text-align:center;padding:12px;color:#64748b">Nenhum item</td></tr>')
      + '</tbody></table>'
      // Total
      + '<div style="display:flex;justify-content:space-between;align-items:center;background:#f8f9ff;border:1.5px solid #0a1e8a;border-radius:8px;padding:10px 14px;margin-top:12px">'
      + '<span style="font-size:12px;font-weight:700;color:#0a1e8a">TOTAL DO ORÇAMENTO:</span><b style="font-size:16px;color:#0a1e8a">' + money(o.total) + '</b>'
      + '</div>'
      // Observações
      + (o.observacao ? '<div style="margin-top:10px;font-size:10.5px"><b>Observações:</b> ' + esc(o.observacao) + '</div>' : '')
      // Link do Cliente
      + '<div style="margin-top:12px;padding:10px;border:1.5px dashed #0a1e8a;border-radius:8px;font-size:10px;background:#f8f9ff">'
      + '<b>Link do Cliente (Autorizar ou Recusar online):</b><br><a href="' + esc(link) + '" target="_blank" style="color:#0a1e8a;word-break:break-all;font-weight:700">' + esc(link) + '</a>'
      + '</div>'
      // Aviso
      + '<div style="margin-top:10px;padding:8px 10px;background:#f1f5f9;border-radius:6px;font-size:9.5px;color:#475569;white-space:pre-wrap;line-height:1.35">'
      + esc(AVISO_PADRAO)
      + '</div>'
      + '</div>'
      + '</body></html>';
  }

  function imprimirOrcamentoSafe(id){
    var _db = getDb();
    var idAlvo = id;
    if(!idAlvo && window.__ORC_ST && window.__ORC_ST.form && window.__ORC_ST.form.id){
      idAlvo = window.__ORC_ST.form.id;
    }
    var o = (_db.orcamentos || []).find(function(x){ return x && (x.id === idAlvo || x.token === idAlvo); });
    if(!o){
      if(typeof toast === 'function') toast('Salve o orçamento antes de imprimir', 'error');
      return;
    }
    var html = gerarHtmlOrcamentoCompleto(o.id);
    if(!html) return;
    var win = window.open('', '_blank');
    if(!win){
      if(typeof toast === 'function') toast('Bloqueador de pop-up impediu a impressão', 'error');
      return;
    }
    win.document.write(html);
    win.document.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL E INTERFACE DO ORÇAMENTO
  // ═══════════════════════════════════════════════════════════════════════════

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
    window.gerarVendaSalvaDeOrcamento = gerarVendaSalvaDeOrcamentoSafe;
    window.aprovarOrcamentoInterno = gerarVendaSalvaDeOrcamentoSafe;
    window.imprimirOrcamento = imprimirOrcamentoSafe;
    window.gerarHtmlOrcamento = gerarHtmlOrcamentoCompleto;

    // Saneamento ao carregar
    sanitizarOrcamentosVendasExcluidas();

    window.abrirTelaOrcamento = function(existente){
      var s = getSess(); if(!s) return;
      var _db = getDb();
      var agora = new Date();

      var cliExistente = null;
      if(existente){
        if(existente.clienteId){
          cliExistente = (_db.clientes || []).find(function(c){ return c && c.id === existente.clienteId; });
        }
        if(!cliExistente && existente.clienteNome){
          cliExistente = { id: existente.clienteId || null, nome: existente.clienteNome };
        }
      }

      var f = {
        id: existente ? existente.id : null,
        codigo: existente ? existente.numero : (window.proximoNumeroSimples ? window.proximoNumeroSimples('orcamento', _db.orcamentos, s.empresaId) : String(Date.now().toString(36))),
        data: existente ? (existente.data || '').slice(0, 10) : agora.toISOString().slice(0, 10),
        hora: agora.toTimeString().slice(0, 5),
        cliente: cliExistente,
        clienteId: cliExistente ? cliExistente.id : null,
        clienteNome: cliExistente ? (cliExistente.nome || cliExistente.fantasia || '') : '',
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

        // Linha do Cliente com Busca Reativa
        +'<div class="rounded-[14px] border-2 border-[#0a1e8a]/20 bg-[#f8f9ff] p-3 relative">'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Cliente * — digite o nome/código para buscar</label>'
        +'<div class="flex flex-wrap items-center gap-2 mt-1">'
        +'<select id="orc-cli-campo" '+(isAutorizado ? 'disabled' : '')+' class="h-[44px] px-2 rounded-xl border bg-white text-[12px] min-w-[155px] shrink-0">'
        +CAMPOS_CLIENTE.map(function(c){ return '<option value="'+esc(c[0])+'">'+esc(c[1])+'</option>'; }).join('')
        +'</select>'
        +'<input id="orc-cli-search" '+(isAutorizado ? 'disabled placeholder="Orçamento autorizado (bloqueado para edição)"' : 'placeholder="Digite o nome, código ou documento..."')+' class="flex-1 min-w-[200px] h-[44px] px-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white text-[13px]">'
        +'<button type="button" onclick="window.orcBuscarCliente(true)" '+(isAutorizado ? 'disabled class="h-[44px] px-4 rounded-xl bg-slate-300 text-white shrink-0 cursor-not-allowed"' : 'class="h-[44px] px-4 rounded-xl bg-[#0a1e8a] text-white shrink-0"')+' title="Buscar cliente"><i class="ph ph-magnifying-glass"></i></button>'
        +'</div>'
        +'<div id="orc-cli-results" class="hidden absolute left-3 right-3 top-[80px] z-30 max-h-[240px] overflow-auto rounded-xl border bg-white shadow-2xl text-[12.5px]"></div>'
        +'<div id="orc-cli-sel" class="'+(f.cliente ? '' : 'hidden')+' mt-2 rounded-xl bg-white border p-3 flex justify-between items-center shadow-sm">'
        +'<div><p class="font-bold text-[#0a1e8a]" id="orc-cli-nome">'+(f.cliente ? esc((f.cliente.codigo ? '#' + f.cliente.codigo + ' — ' : '') + (f.cliente.nome || f.cliente.fantasia || '')) : '')+'</p>'
        +'<p class="text-[11px] text-slate-500" id="orc-cli-info">'+(f.cliente ? esc([f.cliente.documento, f.cliente.telefone || f.cliente.whatsapp, f.cliente.cidade].filter(Boolean).join(' • ')) : '')+'</p></div>'
        +(!isAutorizado ? '<button type="button" onclick="window.orcLimparCliente()" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center font-bold" title="Trocar cliente"><i class="ph ph-x"></i></button>' : '')
        +'</div>'
        +'</div>'

        // Barra de Abas
        +'<div class="flex border-b border-slate-200">'
        +'<button id="orc-tab-itens" type="button" onclick="window.setAbaOrcamento(\'itens\')" class="px-5 py-2 text-[13px] font-bold border-b-2 border-[#0a1e8a] text-[#0a1e8a]"><i class="ph ph-shopping-cart"></i> Itens</button>'
        +'<button id="orc-tab-os" type="button" onclick="window.setAbaOrcamento(\'os\')" class="px-5 py-2 text-[13px] font-bold border-b-2 border-transparent text-slate-500"><i class="ph ph-wrench"></i> Ordem de Serviço (Opcional)</button>'
        +'</div>'

        // ABA 1: ITENS
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
          +'<div class="flex justify-end pt-1"><button type="button" onclick="window.orcAddItem()" class="h-[40px] px-5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5"><i class="ph ph-plus-circle"></i> Adicionar item</button></div>'
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
        +'<input id="orc-os-serie" '+(isAutorizado ? 'readonly' : '')+' value="'+esc(osData.numeroSerie || osData.serie || '')+'" placeholder="Número de série..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
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
        +(existente ? '<button type="button" onclick="window.revalidarLinkOrcamento(\''+existente.id+'\')" class="h-[46px] px-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold flex items-center gap-1.5" title="Reativa o link e reseta o orçamento para nova proposta"><i class="ph ph-arrows-counter-clockwise"></i> Revalidar link</button>' : '')
        +(existente ? '<button type="button" onclick="window.imprimirOrcamento(\''+existente.id+'\')" class="h-[46px] px-5 rounded-xl bg-white border font-bold"><i class="ph ph-printer"></i> Imprimir</button>' : '')
        +(!isAutorizado ? '<button type="button" onclick="window.salvarOrcamentoTela()" class="h-[46px] px-6 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-floppy-disk"></i> Salvar</button>' : '');

      document.getElementById('modal-root').classList.remove('hidden');
      window.modalContext = { type: 'orcamento' };
      if(typeof window.orcRenderItens === 'function') window.orcRenderItens();

      // Busca de cliente reativa: digitação (input), Enter (keydown) e foco
      var cli = document.getElementById('orc-cli-search');
      if(cli){
        var debCli = null;
        cli.oninput = function(){
          clearTimeout(debCli);
          debCli = setTimeout(function(){ window.orcBuscarCliente(); }, 120);
        };
        cli.onfocus = function(){
          if(!cli.value) window.orcBuscarCliente(true);
        };
        cli.onkeydown = function(e){
          if(e.key === 'Enter'){
            e.preventDefault();
            var _db = getDb();
            var q = txt(cli.value).toLowerCase();
            if(q){
              var exato = (_db.clientes || []).find(function(c){
                return c && (String(c.codigo || '') === q || String(c.documento || '').toLowerCase() === q || String(c.nome || '').toLowerCase() === q);
              });
              if(exato){
                window.orcSelCliente(exato.id);
                return;
              }
            }
            window.orcBuscarCliente();
          }
        };
      }

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

    // Override do salvarOrcamentoTela com busca inteligente de cliente e proteção de autorizados
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

      // 1. Resolução segura de cliente: se f.clienteId já existe
      if(!f.cliente && f.clienteId){
        f.cliente = (_db.clientes || []).find(function(c){ return c && c.id === f.clienteId; });
      }

      // 2. Se ainda não tem cliente mas há texto digitado no campo de busca:
      if(!f.cliente){
        var cliSearch = txt(document.getElementById('orc-cli-search') && document.getElementById('orc-cli-search').value);
        if(cliSearch){
          var lowSearch = cliSearch.toLowerCase();
          var achou = (_db.clientes || []).find(function(c){
            return c && (
              String(c.codigo || '') === cliSearch
              || String(c.documento || '').toLowerCase() === lowSearch
              || String(c.nome || '').toLowerCase() === lowSearch
              || String(c.fantasia || '').toLowerCase() === lowSearch
            );
          });
          if(!achou){
            achou = (_db.clientes || []).find(function(c){
              return c && (
                String(c.nome || '').toLowerCase().includes(lowSearch)
                || String(c.fantasia || '').toLowerCase().includes(lowSearch)
                || String(c.documento || '').includes(lowSearch)
              );
            });
          }
          if(achou){
            f.cliente = achou;
            f.clienteId = achou.id;
            f.clienteNome = achou.nome || achou.fantasia || '';
          }
        }
      }

      // 3. Se ainda não tem f.cliente mas f.clienteNome foi herdado:
      if(!f.cliente && f.clienteNome){
        f.cliente = { id: f.clienteId || 'cli_temp', nome: f.clienteNome };
      }

      if(!f.cliente){
        if(typeof toast === 'function') toast('Selecione um cliente para o orçamento', 'error');
        else if(typeof window.lfbAlert === 'function') window.lfbAlert('Selecione um cliente para o orçamento.', 'Cliente Obrigatório');
        var cInp = document.getElementById('orc-cli-search');
        if(cInp){ cInp.focus(); window.orcBuscarCliente(true); }
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
        clienteId: f.cliente.id || f.clienteId || null,
        clienteNome: f.cliente.nome || f.cliente.fantasia || f.clienteNome || '',
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
      if(typeof window.abrirOrcamento === 'function') window.abrirOrcamento(o.id);
    };

    // Revalidar link: reseta venda para permitir nova aprovação se o cliente solicitar
    if(typeof window.revalidarLinkOrcamento === 'function' && !window.revalidarLinkOrcamento.__v52260reset){
      var oldRev = window.revalidarLinkOrcamento;
      window.revalidarLinkOrcamento = function(id){
        var _db = getDb();
        if(_db && _db.orcamentos){
          var o = _db.orcamentos.find(function(x){ return x && x.id === id; });
          if(o){
            o.vendaGeradaUmaVez = false;
            o.vendaExcluida = false;
            if(_db.__vendasDeOrcamentosExcluidas){
              _db.__vendasDeOrcamentosExcluidas = _db.__vendasDeOrcamentosExcluidas.filter(function(x){ return x !== o.id && x !== o.token; });
            }
          }
        }
        return oldRev.apply(this, arguments);
      };
      window.revalidarLinkOrcamento.__v52260reset = true;
    }

    // Sincronização de versão visual
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

    console.log('[DIGICOPY] v' + VERSAO + ': Criação única de venda, impressão com OS e seleção inteligente de clientes ativas!');
  }

  var PURE_V52260 = {
    VERSAO: VERSAO,
    CAMPOS_CLIENTE: CAMPOS_CLIENTE,
    CATS_PRODUTO: CATS_PRODUTO,
    CAMPOS_RECARGA: CAMPOS_RECARGA,
    ehRecargaTipo: ehRecargaTipo,
    gerarVendaSalvaDeOrcamentoSafe: gerarVendaSalvaDeOrcamentoSafe,
    registrarExclusaoVendaOrcamento: registrarExclusaoVendaOrcamento,
    gerarHtmlOrcamentoCompleto: gerarHtmlOrcamentoCompleto,
    linkPublicoOrcamento: linkPublicoOrcamento
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = { PURE_V52260: PURE_V52260 };
  }
})();
