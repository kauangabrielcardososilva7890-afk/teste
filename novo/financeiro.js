// novo/financeiro.js — O FINANCEIRO (contas a receber e a pagar) no núcleo novo
//
// FECHAMENTO DO MENU FINANCEIRO (fase 3). As regras foram COPIADAS do sistema de hoje —
// cada uma diz de onde veio:
//
//   • formas da baixa (7, sem "A prazo"; Pix dá baixa de verdade)
//   • repetir o lançamento mês a mês (até 60x, com ajuste do dia no fim do mês)
//   • baixa do título (forma, data do pagamento, status pago, baixaForma)
//   • campos da busca (Nome, Cód. Venda, Cód. Parcela, Cód. Cliente, Por Valor, Cód. Caixa,
//     Cód. Pix, Cód. Leitura), código exato e valor igual
//   • Hoje / Abertos / Todos; De/Até só entram em "Abertos"
//   • ordem por vencimento (⇧/⇩), valor (⇩/⇧) e descrição; contador de lançamentos
//   • despesa a pagar (fornecedor, descrição, categoria, valor, vencimento, status)
//
// O que AINDA NÃO faz (registrado no relatório): imprimir o recibo (v5.22.17) e o
// histórico completo do lançamento além dos dados da própria ficha.
//
// Não grava nada fora do núcleo, não fala com a nuvem, não usa alert/confirm/prompt nativos.
(function (raiz) {
  'use strict';
  var VERSAO = '1.0.0';

  function texto(v) { return v == null ? '' : String(v); }
  function n(v, padrao) {
    var x = Number(texto(v).replace(',', '.'));
    return isFinite(x) ? x : (padrao === undefined ? 0 : padrao);
  }
  // O sistema de hoje grava as datas como texto ISO ('2026-09-24T…'). O núcleo novo grava
  // carimbo em milissegundos — as duas formas viram 'AAAA-MM-DD' aqui.
  function diaDe(v) {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'number' || /^\d{10,}$/.test(texto(v))) {
      var d = new Date(Number(v));
      return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    }
    return texto(v).slice(0, 10);
  }
  function hojeISO() { return new Date().toISOString().slice(0, 10); }

  // ── 1. AS REGRAS (puras — dá para provar por teste, sem tela) ──────────────

  // v5.22.13 (`FORMAS_BAIXA`): as mesmas formas da venda, MENOS "A prazo" — no
  // financeiro a baixa é sempre dinheiro entrando/saindo.
  var FORMAS_BAIXA = ['Dinheiro', 'Pix', 'Cartão de crédito', 'Cartão de débito', 'Cheque', 'Conta', 'Grátis'];

  // v5.22.13 (`addMeses`): soma meses mantendo o dia; se o mês não tiver o dia
  // (31 em fevereiro), cai no último dia daquele mês.
  function addMeses(iso, meses) {
    var s = diaDe(iso);
    var p = s.split('-').map(Number);
    var y = p[0] || new Date().getFullYear();
    var m = p[1] || (new Date().getMonth() + 1);
    var d = p[2] || new Date().getDate();
    var dt = new Date(y, (m - 1) + (parseInt(meses, 10) || 0), 1);
    var ultimo = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    dt.setDate(Math.min(d, ultimo));
    var mm = String(dt.getMonth() + 1).padStart(2, '0');
    var dd = String(dt.getDate()).padStart(2, '0');
    return dt.getFullYear() + '-' + mm + '-' + dd;
  }

  // v5.22.13 (`montarRepeticoes`): repete o lançamento mês a mês, no máximo 60 vezes.
  function montarRepeticoes(base, qtd) {
    var quantas = Math.max(1, parseInt(qtd, 10) || 1);
    if (quantas > 60) quantas = 60;
    var out = [];
    for (var i = 0; i < quantas; i++) {
      out.push({
        descricao: base.descricao,
        valor: base.valor,
        clienteId: base.clienteId,
        vencimento: addMeses(base.vencimento, i)
      });
    }
    return out;
  }

  // v5.22.13 (`aplicarBaixaTitulo`): é isso que "Receber" grava no título.
  function aplicarBaixaTitulo(titulo, forma, agora) {
    if (!titulo) return titulo;
    titulo.formaPagamento = forma;
    titulo.pagamentoData = agora;
    titulo.status = 'pago';
    titulo.baixaForma = forma;
    return titulo;
  }

  // v5.22.43 (`CAMPOS`): os mesmos campos e na mesma ordem da busca do financeiro.
  var CAMPOS = [
    ['nome', 'Nome'],
    ['cod_venda', 'Cód. Venda'],
    ['cod_parcela', 'Cód. Parcela'],
    ['cod_cliente', 'Cód. Cliente'],
    ['por_valor', 'Por Valor'],
    ['cod_caixa', 'Cód. Caixa'],
    ['cod_pix', 'Cód. Pix'],
    ['cod_leitura', 'Cód. Leitura']
  ];

  function codigoNorm(v) {
    var d = texto(v).replace(/\D/g, '');
    if (!d) return '';
    return d.replace(/^0+/, '') || '0';
  }
  function valorIgual(a, b) { return Math.abs(n(a) - n(b)) < 0.005; }

  // v5.22.43 (`datasDoLanc`): todas as datas que o lançamento tem.
  function datasDoLancamento(c) {
    return [c && c.criadoEm, c && c.data, c && c.vencimento, c && c.pagamentoData,
            c && c.baixaEm, c && c.faturadoEm].map(diaDe).filter(Boolean);
  }
  function bateHoje(c, h) {
    var ds = datasDoLancamento(c);
    if (!ds.length) return true;
    return ds.indexOf(h) >= 0;
  }
  function noIntervalo(c, de, ate) {
    if (!de && !ate) return true;
    var ds = datasDoLancamento(c);
    if (!ds.length) return false;
    return ds.some(function (d) {
      if (de && d < de) return false;
      if (ate && d > ate) return false;
      return true;
    });
  }
  // v5.22.43 (`estaPago`): "pago", "baixado" ou "quitado" contam como pago.
  function estaPago(c) { return /pago|baixad|quitad/i.test(texto(c && c.status)); }

  // Cópia fiel do `filtraLancamentos` do v5.22.43 (aceita { ref } ou o próprio registro).
  function filtraLancamentos(lista, opcoes) {
    var o = opcoes || {};
    var campo = o.campo || 'nome';
    var q = texto(o.q).trim();
    var modo = o.modo || 'hoje';
    var de = texto(o.de).trim();
    var ate = texto(o.ate).trim();
    var h = o.hoje || hojeISO();
    var cliDe = o.clienteDe || function () { return {}; };
    return (lista || []).filter(function (item) {
      var c = item && item.ref ? item.ref : item;
      if (!c) return false;
      if (modo === 'hoje' && !bateHoje(c, h)) return false;
      if (modo === 'abertos' && estaPago(c)) return false;
      if (modo === 'abertos' && (de || ate) && !noIntervalo(c, de, ate)) return false;
      if (!q) return true;
      var cli = cliDe(c) || {};
      var alvo = texto(q).toLowerCase();
      if (campo === 'nome') {
        var nome = texto(cli.nome || c.clienteNomeAntigo || c.fornecedor).toLowerCase();
        return nome.indexOf(alvo) >= 0;
      }
      if (campo === 'cod_venda') return codigoNorm(c.vendaNumero || c.numeroVenda || '') === codigoNorm(q) || codigoNorm(c.vendaId || '') === codigoNorm(q);
      if (campo === 'cod_parcela') return codigoNorm(c.numeroParcela || c.parcela || c.nroParcela || '') === codigoNorm(q);
      if (campo === 'cod_cliente') return codigoNorm(cli.codigo || cli.codigoAntigo || c.codClienteAntigo || '') === codigoNorm(q);
      if (campo === 'por_valor') return valorIgual(c.valor, q);
      if (campo === 'cod_caixa') return codigoNorm(c.codigo || c.legadoCodigo || c.id || '') === codigoNorm(q);
      if (campo === 'cod_pix') {
        var pix = c.pixId || c.txid || c.codigoPix || '';
        return codigoNorm(pix) === codigoNorm(q) || texto(pix).toLowerCase() === alvo;
      }
      if (campo === 'cod_leitura') return codigoNorm(c.leituraNumero || c.leituraId || c.codLeitura || '') === codigoNorm(q);
      return true;
    });
  }

  // v5.22.43 (ordens do select)
  var ORDENS = {
    'venc-asc': function (a, b) { return texto(a && a.ref ? a.ref.vencimento : a.vencimento).localeCompare(texto(b && b.ref ? b.ref.vencimento : b.vencimento)); },
    'venc-desc': function (a, b) { return texto(b && b.ref ? b.ref.vencimento : b.vencimento).localeCompare(texto(a && a.ref ? a.ref.vencimento : a.vencimento)); },
    'valor-desc': function (a, b) { return n((b && b.ref ? b.ref : b).valor) - n((a && a.ref ? a.ref : a).valor); },
    'valor-asc': function (a, b) { return n((a && a.ref ? a.ref : a).valor) - n((b && b.ref ? b.ref : b).valor); },
    'desc': function (a, b) { return texto((a && a.ref ? a.ref : a).descricao).localeCompare(texto((b && b.ref ? b.ref : b).descricao), 'pt-BR', { sensitivity: 'base' }); }
  };
  function ordenarLancamentos(lista, ordem) {
    return (lista || []).slice().sort(ORDENS[ordem] || ORDENS['venc-asc']);
  }

  // O título a receber de um lançamento novo (campos do v5.22.13).
  function novoReceber(info, empresaId) {
    var i = info || {};
    return {
      empresaId: empresaId,
      origem: i.origem || 'avulso',
      clienteId: i.clienteId || null,
      clienteNome: i.clienteNome || '',
      descricao: texto(i.descricao).trim(),
      valor: n(i.valor, 0),
      vencimento: diaDe(i.vencimento) || hojeISO(),
      pagamentoData: null,
      status: 'aberto',
      contratoId: null,
      leituraId: null,
      vendaId: i.vendaId || null
    };
  }

  // A despesa a pagar (campos do `saveCP` do app.js:1427).
  function novaDespesa(info, empresaId) {
    var i = info || {};
    return {
      empresaId: empresaId,
      origem: i.origem || 'avulso',
      fornecedor: texto(i.fornecedor).trim(),
      descricao: texto(i.descricao).trim(),
      categoria: i.categoria || 'Suprimentos',
      valor: n(i.valor, 0),
      vencimento: diaDe(i.vencimento) || hojeISO(),
      status: i.status || 'aberto',
      pagamentoData: i.status === 'pago' ? new Date().toISOString() : null
    };
  }

  var CATEGORIAS_DESPESA = ['Suprimentos', 'Peças', 'Infraestrutura', 'Salários', 'Impostos', 'Frete', 'Outros'];

  var regras = {
    FORMAS_BAIXA: FORMAS_BAIXA, CAMPOS: CAMPOS, CATEGORIAS_DESPESA: CATEGORIAS_DESPESA,
    addMeses: addMeses, montarRepeticoes: montarRepeticoes, aplicarBaixaTitulo: aplicarBaixaTitulo,
    codigoNorm: codigoNorm, valorIgual: valorIgual, datasDoLancamento: datasDoLancamento,
    bateHoje: bateHoje, noIntervalo: noIntervalo, estaPago: estaPago,
    filtraLancamentos: filtraLancamentos, ordenarLancamentos: ordenarLancamentos,
    novoReceber: novoReceber, novaDespesa: novaDespesa
  };

  // ── 2. A TELA ─────────────────────────────────────────────────────────────
  var LISTA_RECEBER = {
    origem: { tipo: 'texto' }, clienteId: { tipo: 'texto' }, clienteNome: { tipo: 'texto' },
    vendaId: { tipo: 'texto' }, descricao: { tipo: 'texto' }, valor: { tipo: 'numero' },
    vencimento: { tipo: 'texto' }, pagamentoData: { tipo: 'texto' }, status: { tipo: 'texto' },
    autoBaixa: { tipo: 'boleano' }, formaPagamento: { tipo: 'texto' }, baixaForma: { tipo: 'texto' },
    parcela: { tipo: 'numero' }, totalParcelas: { tipo: 'numero' }, jurosMes: { tipo: 'numero' }
  };
  var LISTA_PAGAR = {
    origem: { tipo: 'texto' }, fornecedor: { tipo: 'texto' }, descricao: { tipo: 'texto' },
    categoria: { tipo: 'texto' }, valor: { tipo: 'numero' }, vencimento: { tipo: 'texto' },
    pagamentoData: { tipo: 'texto' }, status: { tipo: 'texto' }, formaPagamento: { tipo: 'texto' }
  };

  function moeda(v) { return n(v, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
  function escapar(t) {
    return texto(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dataBR(v) {
    var d = diaDe(v);
    return d ? d.split('-').reverse().join('/') : '—';
  }

  function criarFinanceiro(opcoes) {
    var o = opcoes || {};
    var nucleo = o.nucleo;
    if (!nucleo) throw new Error('financeiro: informe o núcleo');
    var alvo = o.elemento;
    if (!alvo || !alvo.ownerDocument) throw new Error('financeiro: informe onde desenhar o financeiro');
    var doc = alvo.ownerDocument;
    var SEL = raiz.DIGICOPY_SELECAO;
    var empresaId = o.empresaId || 'rascunho';
    var aoMudar = typeof o.aoMudar === 'function' ? o.aoMudar : function () { };

    nucleo.registrarLista('contasReceber', LISTA_RECEBER);
    nucleo.registrarLista('contasPagar', LISTA_PAGAR);

    var estado = {
      campo: 'nome', termo: '', modo: 'hoje', de: '', ate: '',
      tipo: o.tipo || 'todos', ordem: 'venc-asc', limite: 400,
      filtroPendente: false, marcados: {}, aviso: '', erro: ''
    };

    function lista(nome, opcoes) { try { return nucleo.listar(nome, opcoes) || []; } catch (e) { return []; } }
    function achar(nome, id) { try { return nucleo.obter(nome, id); } catch (e) { return null; } }
    function clienteDe(c) {
      var id = c && c.clienteId;
      if (!id) return {};
      return lista('clientes').filter(function (x) { return x.id === id; })[0] || {};
    }
    function nomeDe(c) {
      var cli = clienteDe(c);
      return cli.nome || c.clienteNomeAntigo || c.fornecedor || '';
    }

    // todos os lançamentos (receber + pagar), como o `all` de hoje
    function lancamentos() {
      // no modo Apagados a lista sai do fundo do baú (lápide: quem apagou, quando e por quê)
      var soApagados = estado.modo === 'apagados' ? { somenteApagados: true } : null;
      var receber = lista('contasReceber', soApagados).map(function (c) { return { ref: c, tipo: 'Receber' }; });
      var pagar = lista('contasPagar', soApagados).map(function (c) { return { ref: c, tipo: 'Pagar' }; });
      var todos = receber.concat(pagar);
      if (estado.tipo === 'Receber') todos = todos.filter(function (x) { return x.tipo === 'Receber'; });
      if (estado.tipo === 'Pagar') todos = todos.filter(function (x) { return x.tipo === 'Pagar'; });
      return todos;
    }
    function filtrados() {
      return ordenarLancamentos(filtraLancamentos(lancamentos(), {
        campo: estado.campo, q: estado.termo,
        modo: estado.modo === 'apagados' ? 'todos' : estado.modo,
        de: estado.de, ate: estado.ate, hoje: hojeISO(), clienteDe: clienteDe
      }), estado.ordem);
    }
    function contarApagados() {
      return lista('contasReceber', { somenteApagados: true }).length + lista('contasPagar', { somenteApagados: true }).length;
    }
    function marcadosDe(tipo) {
      return Object.keys(estado.marcados).filter(function (id) { return estado.marcados[id]; })
        .map(function (id) {
          var nome = tipo === 'Receber' ? 'contasReceber' : 'contasPagar';
          return { nome: nome, tipo: tipo, registro: achar(nome, id) };
        }).filter(function (x) { return x.registro; });
    }
    function temMarcado() { return Object.keys(estado.marcados).some(function (id) { return estado.marcados[id]; }); }

    function mostrarErro(msg) {
      estado.erro = msg || '';
      var b = alvo.querySelector('[data-fin-erro]');
      if (b) { b.textContent = estado.erro ? '⚠️ ' + estado.erro : ''; b.hidden = !estado.erro; }
    }
    function mostrarAviso(msg) {
      estado.aviso = msg || '';
      var b = alvo.querySelector('[data-fin-aviso]');
      if (b) { b.textContent = estado.aviso; b.hidden = !estado.aviso; }
    }

    // ── janela do sistema (mesmo modelo das outras telas) ──
    function abrirJanela(titulo, corpo, botoes, aoAbrir) {
      var velha = doc.querySelector('[data-fin-modal]');
      if (velha && velha.parentNode) velha.parentNode.removeChild(velha);
      var overlay = doc.createElement('div');
      overlay.className = 'nfx-mask';
      overlay.setAttribute('data-fin-modal', '1');
      overlay.innerHTML =
        '<div class="nfx-caixa" role="dialog" aria-modal="true">' +
          '<div class="nfx-titulo">' + escapar(titulo) + '</div>' +
          '<div class="nfx-corpo">' + corpo + '</div>' +
          '<div class="nfx-erro" data-fin-janela-erro hidden></div>' +
          '<div class="nfx-botoes">' +
            botoes.map(function (b, i) {
              return '<button type="button" data-fin-botao="' + i + '" class="nfx-btn ' + (b.forte ? 'nfx-btn-forte' : 'nfx-btn-fraco') + '">' + escapar(b.texto) + '</button>';
            }).join('') +
          '</div>' +
        '</div>';
      doc.body.appendChild(overlay);
      botoes.forEach(function (b, i) {
        overlay.querySelector('[data-fin-botao="' + i + '"]').addEventListener('click', function () {
          if (b.acao) b.acao(overlay);
        });
      });
      if (aoAbrir) aoAbrir(overlay);
      return overlay;
    }
    function fecharJanela() {
      var m = doc.querySelector('[data-fin-modal]');
      if (m && m.parentNode) m.parentNode.removeChild(m);
    }
    function erroDaJanela(overlay, msg) {
      var el = overlay.querySelector('[data-fin-janela-erro]');
      if (el) { el.textContent = msg; el.hidden = false; }
    }

    // ── BAIXA (receber / pagar) ───────────────────────────────────────────────
    // Copiado do v5.22.13: formas da venda SEM "A prazo"; Pix dá baixa de verdade;
    // só título em aberto entra na baixa.
    function abrirBaixa(tipo) {
      var alvos = marcadosDe(tipo).filter(function (x) { return !estaPago(x.registro); });
      if (!alvos.length) {
        mostrarErro('Marque pelo menos um título ' + (tipo === 'Receber' ? 'a receber' : 'a pagar') + ' em aberto. Títulos já pagos não entram na baixa.');
        return null;
      }
      var total = alvos.reduce(function (s, x) { return s + n(x.registro.valor, 0); }, 0);
      var forma = 'Dinheiro';
      var botoes = [
        { texto: 'Cancelar', acao: fecharJanela },
        {
          texto: tipo === 'Receber' ? 'Confirmar baixa' : 'Confirmar pagamento', forte: true,
          acao: function (overlay) {
            var escolhida = overlay.querySelector('[data-fin-baixa-forma]').value;
            if (FORMAS_BAIXA.indexOf(escolhida) < 0) return erroDaJanela(overlay, 'Escolha uma forma de baixa.');
            var agora = new Date().toISOString();
            var quantos = 0;
            alvos.forEach(function (x) {
              var r = nucleo.salvar(x.nome, Object.assign({}, x.registro, aplicarBaixaTitulo({}, escolhida, agora)));
              if (r && r.ok) quantos++;
            });
            estado.marcados = {};
            fecharJanela();
            desenhar();
            mostrarAviso(quantos + ' título(s) baixado(s) em ' + escolhida + '.');
            aoMudar();
          }
        }
      ];
      return abrirJanela(
        (tipo === 'Receber' ? 'Baixa — receber' : 'Baixa — pagar') + ' (' + alvos.length + ' título(s))',
        '<div class="vnd-rotulo">Total a baixar: <b>' + moeda(total) + '</b></div>' +
        '<p class="fin-sub">Mesmas formas da venda, <b>sem "A prazo"</b>. Pix aqui dá baixa de verdade.</p>' +
        '<label class="vnd-campo"><span>Forma</span><select data-fin-baixa-forma>' +
          FORMAS_BAIXA.map(function (f) { return '<option value="' + escapar(f) + '">' + escapar(f) + '</option>'; }).join('') +
        '</select></label>',
        botoes,
        function (overlay) {
          overlay.querySelector('[data-fin-baixa-forma]').addEventListener('change', function () {
            var v = overlay.querySelector('[data-fin-baixa-forma]').value;
            var msg = overlay.querySelector('[data-fin-baixa-msg]');
            if (msg) msg.textContent = v === 'Pix' ? 'Baixa em Pix: o título fica pago de verdade.'
              : (v === 'Grátis' ? 'Baixa Grátis: o título é quitado sem cobrança.' : 'Baixa em ' + v + ': o título fica pago.');
          });
          var p = doc.createElement('div');
          p.className = 'fin-sub';
          p.setAttribute('data-fin-baixa-msg', '1');
          p.textContent = 'Baixa em ' + forma + ': o título fica pago.';
          overlay.querySelector('.nfx-corpo').appendChild(p);
        });
    }

    // ── NOVO LANÇAMENTO A RECEBER (v5.22.13) ─────────────────────────────────
    function abrirNovoLancamento() {
      var escolhido = { cliente: null };
      var botoes = [
        { texto: 'Cancelar', acao: fecharJanela },
        {
          texto: 'Salvar', forte: true,
          acao: function (overlay) {
            var cli = escolhido.cliente;
            var desc = texto(overlay.querySelector('[data-fin-novo-desc]').value).trim();
            var valor = n(overlay.querySelector('[data-fin-novo-valor]').value, 0);
            var venc = overlay.querySelector('[data-fin-novo-venc]').value || hojeISO();
            var repetir = overlay.querySelector('[data-fin-novo-rep]').value;
            if (!cli) return erroDaJanela(overlay, 'Escolha o cliente (lupa ou Enter).');
            if (!desc) return erroDaJanela(overlay, 'Informe a descrição.');
            if (!valor || valor <= 0) return erroDaJanela(overlay, 'Informe o valor.');
            var itens = montarRepeticoes({ descricao: desc, valor: valor, clienteId: cli.id, vencimento: venc }, repetir);
            var quantos = 0;
            itens.forEach(function (it) {
              var r = nucleo.salvar('contasReceber', novoReceber({
                descricao: it.descricao, valor: it.valor, clienteId: it.clienteId,
                clienteNome: cli.nome, vencimento: it.vencimento
              }, empresaId));
              if (r && r.ok) quantos++;
            });
            fecharJanela();
            desenhar();
            mostrarAviso(quantos + ' lançamento(s) a receber criado(s).');
            aoMudar();
          }
        }
      ];
      return abrirJanela('Novo lançamento a receber',
        '<div class="vnd-campo"><span>Cliente</span><div data-fin-cliente></div></div>' +
        '<div class="vnd-campo"><span>Descrição</span><input data-fin-novo-desc placeholder="Ex.: aluguel, mensalidade..." style="width:100%"></div>' +
        '<div class="fin-dupla">' +
          '<label class="vnd-campo"><span>Valor R$</span><input type="number" step="0.01" min="0" data-fin-novo-valor></label>' +
          '<label class="vnd-campo"><span>1º vencimento</span><input type="date" data-fin-novo-venc value="' + hojeISO() + '"></label>' +
        '</div>' +
        '<label class="vnd-campo"><span>Repetir (vezes, pulando 1 mês)</span><input type="number" min="1" max="60" value="1" data-fin-novo-rep></label>' +
        '<div class="fin-sub" data-fin-rep-prev>Um lançamento no vencimento informado.</div>',
        botoes,
        function (overlay) {
          if (SEL) {
            SEL.montar({
              tipo: 'cliente', elemento: overlay.querySelector('[data-fin-cliente]'),
              fonte: function () { return lista('clientes'); },
              aoEscolher: function (c) { escolhido.cliente = c; }
            });
          } else {
            // sem a caixa de seleção, cai num campo de digitação do nome
            var wrap = overlay.querySelector('[data-fin-cliente]');
            wrap.innerHTML = '<input data-fin-cliente-manual placeholder="Nome do cliente">';
            var campo = wrap.querySelector('[data-fin-cliente-manual]');
            campo.addEventListener('change', function () {
              var achado = lista('clientes').filter(function (c) { return texto(c.nome).toLowerCase() === texto(campo.value).toLowerCase(); })[0];
              escolhido.cliente = achado || null;
            });
          }
          var atualizar = function () {
            var quantas = Math.max(1, parseInt(overlay.querySelector('[data-fin-novo-rep]').value, 10) || 1);
            var venc = overlay.querySelector('[data-fin-novo-venc]').value || hojeISO();
            var prev = overlay.querySelector('[data-fin-rep-prev]');
            if (quantas <= 1) { prev.textContent = 'Um lançamento no vencimento informado.'; return; }
            var datas = [];
            for (var i = 0; i < Math.min(quantas, 6); i++) datas.push(dataBR(addMeses(venc, i)));
            prev.textContent = quantas + ' lançamentos: ' + datas.join(', ') + (quantas > 6 ? '…' : '');
          };
          overlay.querySelector('[data-fin-novo-rep]').addEventListener('change', atualizar);
          overlay.querySelector('[data-fin-novo-venc]').addEventListener('change', atualizar);
        });
    }

    // ── NOVA DESPESA (contas a pagar — campos do saveCP de hoje) ──────────────
    function abrirNovaDespesa(registro) {
      var r = registro || null;
      var botoes = [
        { texto: 'Cancelar', acao: fecharJanela },
        {
          texto: 'Salvar', forte: true,
          acao: function (overlay) {
            var fornecedor = texto(overlay.querySelector('[data-fin-forn]').value).trim();
            if (!fornecedor) return erroDaJanela(overlay, 'Informe o fornecedor.');
            var dados = novaDespesa({
              fornecedor: fornecedor,
              descricao: overlay.querySelector('[data-fin-desc]').value,
              categoria: overlay.querySelector('[data-fin-cat]').value,
              valor: overlay.querySelector('[data-fin-valor]').value,
              vencimento: overlay.querySelector('[data-fin-venc]').value,
              status: overlay.querySelector('[data-fin-status]').value
            }, empresaId);
            var salvar = Object.assign({}, r || {}, dados);
            var res = nucleo.salvar('contasPagar', salvar);
            if (!res || !res.ok) return erroDaJanela(overlay, (res && res.erros && res.erros.join(' · ')) || 'não deu para gravar a despesa');
            fecharJanela();
            desenhar();
            mostrarAviso(r ? 'Despesa salva.' : 'Despesa criada.');
            aoMudar();
          }
        }
      ];
      return abrirJanela(r ? 'Editar despesa' : 'Nova conta a pagar',
        '<label class="vnd-campo"><span>Fornecedor</span><input data-fin-forn value="' + escapar(r ? r.fornecedor : '') + '" style="width:100%"></label>' +
        '<label class="vnd-campo"><span>Descrição</span><input data-fin-desc value="' + escapar(r ? r.descricao : '') + '" style="width:100%"></label>' +
        '<div class="fin-dupla">' +
          '<label class="vnd-campo"><span>Categoria</span><select data-fin-cat>' +
            CATEGORIAS_DESPESA.map(function (c) { return '<option value="' + escapar(c) + '"' + (r && r.categoria === c ? ' selected' : '') + '>' + escapar(c) + '</option>'; }).join('') +
          '</select></label>' +
          '<label class="vnd-campo"><span>Valor R$</span><input type="number" step="0.01" data-fin-valor value="' + escapar(r ? r.valor : 0) + '"></label>' +
        '</div>' +
        '<div class="fin-dupla">' +
          '<label class="vnd-campo"><span>Vencimento</span><input type="date" data-fin-venc value="' + escapar(diaDe(r && r.vencimento) || hojeISO()) + '"></label>' +
          '<label class="vnd-campo"><span>Status</span><select data-fin-status>' +
            '<option value="aberto"' + (!r || r.status !== 'pago' ? ' selected' : '') + '>Em aberto</option>' +
            '<option value="pago"' + (r && r.status === 'pago' ? ' selected' : '') + '>Pago</option>' +
          '</select></label>' +
        '</div>',
        botoes);
    }

    // ── HISTÓRICO (duplo clique na linha) ─────────────────────────────────────
    function abrirHistorico(nome, registro) {
      if (!registro) return;
      var linhas = Object.keys(registro).filter(function (k) {
        return ['id', 'lista', 'versao', 'atualizadoEm', 'criadoEm', 'apagadoEm', 'apagadoPor', 'motivo', 'origem', 'empresaId'].indexOf(k) < 0 && registro[k] !== '' && registro[k] !== null && registro[k] !== undefined;
      }).map(function (k) {
        var v = registro[k];
        if (/vencimento|pagamentoData|faturadoEm|criadoEm|atualizadoEm/.test(k)) v = dataBR(v);
        else if (k === 'valor') v = moeda(v);
        return '<tr><td class="fin-chave">' + escapar(k) + '</td><td>' + escapar(v) + '</td></tr>';
      }).join('');
      var botoes = nome === 'contasPagar'
        ? [
            { texto: 'Fechar', acao: fecharJanela },
            { texto: '✏️ Editar', forte: true, acao: function () { fecharJanela(); abrirNovaDespesa(registro); } }
          ]
        : [{ texto: 'Fechar', forte: true, acao: fecharJanela }];
      return abrirJanela('Histórico do lançamento',
        '<table class="vnd-tabela"><tbody>' + linhas + '</tbody></table>', botoes);
    }

    // ── EXCLUIR (com motivo — regra do sistema) ───────────────────────────────
    function abrirExcluir() {
      var alvos = [];
      ['Receber', 'Pagar'].forEach(function (tipo) { alvos = alvos.concat(marcadosDe(tipo)); });
      if (!alvos.length) { mostrarErro('Marque o que você quer apagar primeiro.'); return null; }
      return abrirJanela('Apagar ' + alvos.length + ' lançamento(s)',
        '<p class="fin-sub">O lançamento sai da lista mas fica guardado no histórico (com o motivo).</p>' +
        '<label class="vnd-campo"><span>Motivo</span><input data-fin-motivo placeholder="Por que está apagando?" style="width:100%"></label>',
        [
          { texto: 'Cancelar', acao: fecharJanela },
          {
            texto: 'Apagar', forte: true,
            acao: function (overlay) {
              var motivo = texto(overlay.querySelector('[data-fin-motivo]').value).trim();
              if (motivo.length < 3) return erroDaJanela(overlay, 'Escreva o motivo (pelo menos 3 letras).');
              alvos.forEach(function (x) { nucleo.apagar(x.nome, x.registro.id, motivo); });
              estado.marcados = {};
              fecharJanela();
              desenhar();
              mostrarAviso(alvos.length + ' lançamento(s) apagado(s). O motivo ficou no histórico.');
              aoMudar();
            }
          }
        ]);
    }

    // ── DESENHO ───────────────────────────────────────────────────────────────
    function linhaTabela(x) {
      var c = x.ref;
      var marcado = !!estado.marcados[c.id];
      var apagado = estado.modo === 'apagados';
      return '<tr data-linha-fin="' + escapar(c.id) + '" data-tipo-lanc="' + escapar(x.tipo) + '">' +
        '<td>' + (apagado ? '' : '<input type="checkbox" data-marcar="' + escapar(c.id) + '"' + (marcado ? ' checked' : '') + '>') + '</td>' +
        '<td><span class="vnd-tag' + (x.tipo === 'Pagar' ? ' vnd-tag-pagar' : '') + '">' + escapar(x.tipo) + '</span></td>' +
        '<td><b>' + escapar(c.descricao) + '</b>' +
          (c.parcela ? ' <span class="vnd-sub">parcela ' + escapar(c.parcela) + '/' + escapar(c.totalParcelas) + '</span>' : '') +
          (apagado && c.motivo ? '<br><span class="vnd-sub">apagado: ' + escapar(c.motivo) + '</span>' : '') + '</td>' +
        '<td>' + escapar(nomeDe(c)) + '</td>' +
        '<td><b class="' + (x.tipo === 'Pagar' ? 'fin-vermelho' : '') + '">' + moeda(c.valor) + '</b></td>' +
        '<td>' + dataBR(c.vencimento) + '</td>' +
        '<td><span class="fin-pill' + (estaPago(c) ? ' fin-pill-ok' : '') + '">' + (estaPago(c) ? 'pago' : 'aberto') + '</span></td>' +
        '<td>' + (apagado
          ? '<button type="button" class="nfx-mini" data-restaurar="' + escapar(c.id) + '" title="Trazer de volta">♻️ Restaurar</button>'
          : '<button type="button" class="nfx-mini" data-historico="' + escapar(c.id) + '" title="Ver a ficha">👁️</button>') +
        '</td>' +
        '</tr>';
    }

    function desenhar() {
      var todos = filtrados();
      var visiveis = todos.slice(0, estado.limite);
      var abertos = todos.filter(function (x) { return !estaPago(x.ref); });
      var somaAberto = abertos.reduce(function (s, x) { return s + n(x.ref.valor, 0); }, 0);
      var datasAbertos = estado.modo === 'abertos';

      alvo.innerHTML =
        '<div class="fin-topo">' +
          '<div><span class="vnd-rotulo">Financeiro</span><b>Contas a receber e a pagar</b>' +
            '<div class="vnd-sub">' + todos.length + ' lançamento(s) no filtro • em aberto: <b>' + moeda(somaAberto) + '</b></div>' +
          '</div>' +
          '<div class="vnd-acoes">' +
            (estado.tipo === 'Pagar'
              ? '<button type="button" class="vnd-btn" data-fin-nova-despesa>➕ Nova despesa</button>'
              : '<button type="button" class="vnd-btn" data-fin-novo>➕ Novo lançamento</button>') +
            '<button type="button" class="vnd-btn vnd-btn-forte" data-fin-receber>💰 Receber</button>' +
            '<button type="button" class="vnd-btn" data-fin-pagar>📤 Pagar</button>' +
            '<button type="button" class="vnd-btn" data-fin-excluir>🗑️ Apagar</button>' +
          '</div>' +
        '</div>' +
        '<div class="fin-modos">' +
          [['hoje', 'Hoje'], ['abertos', 'Abertos'], ['todos', 'Todos'], ['apagados', '🕳️ Apagados (' + contarApagados() + ')']].map(function (m) {
            return '<button type="button" class="fin-modo' + (estado.modo === m[0] ? ' fin-modo-on' : '') + '" data-modo="' + m[0] + '">' + m[1] + '</button>';
          }).join('') +
        '</div>' +
        '<div class="fin-filtros">' +
          '<select data-fin-campo>' + CAMPOS.map(function (c) {
            return '<option value="' + c[0] + '"' + (estado.campo === c[0] ? ' selected' : '') + '>' + escapar(c[1]) + '</option>';
          }).join('') + '</select>' +
          '<input data-fin-termo value="' + escapar(estado.termo) + '" placeholder="Buscar… (Enter ou lupa)">' +
          '<button type="button" class="vnd-btn" data-fin-buscar title="Pesquisar">🔍</button>' +
          (datasAbertos ?
            '<label class="fin-data">De <input type="date" data-fin-de value="' + escapar(estado.de) + '"></label>' +
            '<label class="fin-data">Até <input type="date" data-fin-ate value="' + escapar(estado.ate) + '"></label>' : '') +
          '<select data-fin-tipo>' +
            ['todos', 'Receber', 'Pagar'].map(function (t) {
              var rot = t === 'todos' ? 'Receber + Pagar' : (t === 'Receber' ? 'Só a receber' : 'Só a pagar');
              return '<option value="' + t + '"' + (estado.tipo === t ? ' selected' : '') + '>' + rot + '</option>';
            }).join('') +
          '</select>' +
          '<button type="button" class="vnd-btn' + (estado.filtroPendente ? ' fin-pendente' : ' vnd-btn-forte') + '" data-fin-filtrar>✔ Filtrar</button>' +
          '<button type="button" class="vnd-btn vnd-btn-fraco" data-fin-limpar>✖ Remover filtro</button>' +
          '<select data-fin-ordem>' +
            [['venc-asc', '⇧ Vencimento'], ['venc-desc', '⇩ Vencimento'], ['valor-desc', '⇩ Valor'], ['valor-asc', '⇧ Valor'], ['desc', 'A-Z Descrição']].map(function (ord) {
              return '<option value="' + ord[0] + '"' + (estado.ordem === ord[0] ? ' selected' : '') + '>' + escapar(ord[1]) + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div class="fin-erro" data-fin-erro' + (estado.erro ? '' : ' hidden') + '>' + escapar(estado.erro) + '</div>' +
        '<div class="fin-aviso" data-fin-aviso' + (estado.aviso ? '' : ' hidden') + '>' + escapar(estado.aviso) + '</div>' +
        '<table class="vnd-tabela"><thead><tr>' +
          '<th>' + (estado.modo === 'apagados' ? '' : '<input type="checkbox" data-fin-marcar-todos>') + '</th><th>Tipo</th><th>Descrição</th><th>Cliente / Fornecedor</th>' +
          '<th>Valor</th><th>Vencimento</th><th>Status</th><th></th>' +
        '</tr></thead><tbody>' +
          (visiveis.length ? visiveis.map(linhaTabela).join('')
            : '<tr><td colspan="8" class="vnd-vazio">Nenhum lançamento encontrado</td></tr>') +
        '</tbody></table>' +
        (todos.length > visiveis.length ?
          '<div class="fin-mais"><button type="button" class="vnd-btn" data-fin-mais>Mostrar mais (' + (todos.length - visiveis.length) + ')</button></div>' : '');

      // eventos
      alvo.querySelectorAll('[data-modo]').forEach(function (b) {
        b.addEventListener('click', function () {
          estado.modo = b.getAttribute('data-modo');
          if (estado.modo !== 'abertos') { estado.de = ''; estado.ate = ''; }
          estado.marcados = {};
          estado.limite = 400;
          desenhar();
        });
      });
      alvo.querySelectorAll('[data-marcar]').forEach(function (c) {
        c.addEventListener('change', function () {
          var id = c.getAttribute('data-marcar');
          if (c.checked) estado.marcados[id] = true; else delete estado.marcados[id];
          var todosMarc = alvo.querySelector('[data-fin-marcar-todos]');
          if (todosMarc) todosMarc.checked = false;
        });
      });
      alvo.querySelectorAll('[data-restaurar]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-restaurar');
          var x = lancamentos().filter(function (y) { return y.ref.id === id; })[0];
          if (!x) return;
          var r = nucleo.restaurar(x.tipo === 'Receber' ? 'contasReceber' : 'contasPagar', id);
          if (!r || !r.ok) { mostrarErro('não deu para restaurar este lançamento'); return; }
          mostrarAviso('Lançamento trazido de volta.');
          desenhar();
        });
      });
      var marcarTodos = alvo.querySelector('[data-fin-marcar-todos]');
      if (marcarTodos) marcarTodos.addEventListener('change', function () {
        visiveis.forEach(function (x) {
          if (marcarTodos.checked) estado.marcados[x.ref.id] = true; else delete estado.marcados[x.ref.id];
        });
        desenhar();
      });
      alvo.querySelectorAll('[data-historico]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-historico');
          var x = filtrados().filter(function (y) { return y.ref.id === id; })[0] ||
                  lancamentos().filter(function (y) { return y.ref.id === id; })[0];
          if (x) abrirHistorico(x.tipo === 'Receber' ? 'contasReceber' : 'contasPagar', x.ref);
        });
      });
      // Escolhas de filtro NÃO se aplicam sozinhas: ficam pendentes (Filtrar fica laranja),
      // igual ao v5.24.34 ("escolhe primeiro, aperta Filtrar aí aplica").
      ['data-fin-campo', 'data-fin-tipo', 'data-fin-ordem', 'data-fin-de', 'data-fin-ate'].forEach(function (attr) {
        var el = alvo.querySelector('[' + attr + ']');
        if (!el) return;
        el.addEventListener('change', function () {
          estado.filtroPendente = true;
          var b = alvo.querySelector('[data-fin-filtrar]');
          if (b) b.className = 'vnd-btn fin-pendente';
        });
      });
      var termo = alvo.querySelector('[data-fin-termo]');
      if (termo) {
        termo.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') { ev.preventDefault(); aplicarFiltro(); }
        });
      }
      var buscar = alvo.querySelector('[data-fin-buscar]');
      if (buscar) buscar.addEventListener('click', aplicarFiltro);
      var filtrar = alvo.querySelector('[data-fin-filtrar]');
      if (filtrar) filtrar.addEventListener('click', aplicarFiltro);
      var limpar = alvo.querySelector('[data-fin-limpar]');
      if (limpar) limpar.addEventListener('click', function () {
        estado.de = ''; estado.ate = ''; estado.tipo = 'todos'; estado.ordem = 'venc-asc'; estado.termo = '';
        estado.filtroPendente = false; estado.limite = 400;
        desenhar();
      });
      var mais = alvo.querySelector('[data-fin-mais]');
      if (mais) mais.addEventListener('click', function () { estado.limite += 300; desenhar(); });
      var novo = alvo.querySelector('[data-fin-novo]');
      if (novo) novo.addEventListener('click', abrirNovoLancamento);
      var novaDespesa = alvo.querySelector('[data-fin-nova-despesa]');
      if (novaDespesa) novaDespesa.addEventListener('click', function () { abrirNovaDespesa(null); });
      var receber = alvo.querySelector('[data-fin-receber]');
      if (receber) receber.addEventListener('click', function () { abrirBaixa('Receber'); });
      var pagar = alvo.querySelector('[data-fin-pagar]');
      if (pagar) pagar.addEventListener('click', function () { abrirBaixa('Pagar'); });
      var excluir = alvo.querySelector('[data-fin-excluir]');
      if (excluir) excluir.addEventListener('click', abrirExcluir);
      // duplo clique na linha abre a ficha (como hoje)
      alvo.querySelectorAll('[data-linha-fin]').forEach(function (tr) {
        tr.addEventListener('dblclick', function () {
          var id = tr.getAttribute('data-linha-fin');
          var x = filtrados().filter(function (y) { return y.ref.id === id; })[0];
          if (x) abrirHistorico(x.tipo === 'Receber' ? 'contasReceber' : 'contasPagar', x.ref);
        });
      });
    }

    function aplicarFiltro() {
      var campo = alvo.querySelector('[data-fin-campo]');
      var termo = alvo.querySelector('[data-fin-termo]');
      var tipo = alvo.querySelector('[data-fin-tipo]');
      var ordem = alvo.querySelector('[data-fin-ordem]');
      var de = alvo.querySelector('[data-fin-de]');
      var ate = alvo.querySelector('[data-fin-ate]');
      estado.campo = campo ? campo.value : estado.campo;
      estado.termo = termo ? termo.value : estado.termo;
      estado.tipo = tipo ? tipo.value : estado.tipo;
      estado.ordem = ordem ? ordem.value : estado.ordem;
      estado.de = de ? de.value : estado.de;
      estado.ate = ate ? ate.value : estado.ate;
      estado.filtroPendente = false;
      estado.limite = 400;
      desenhar();
    }

    desenhar();
    return {
      versao: VERSAO, desenhar: desenhar, estado: estado, estadoAtual: function () { return estado; },
      aplicarFiltro: aplicarFiltro, abrirNovoLancamento: abrirNovoLancamento, abrirNovaDespesa: abrirNovaDespesa,
      abrirBaixa: abrirBaixa, abrirExcluir: abrirExcluir, abrirHistorico: abrirHistorico, fecharJanela: fecharJanela
    };
  }

  raiz.DIGICOPY_FINANCEIRO = { VERSAO_FINANCEIRO: VERSAO, regras: regras, criarFinanceiro: criarFinanceiro };
})(typeof window !== 'undefined' ? window : globalThis);
