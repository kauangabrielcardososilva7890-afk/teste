// novo/venda.js — A VENDA (notinha) no núcleo novo
//
// FASE 3 do redesenho. Regra de ouro: as regras abaixo foram COPIADAS do arquivo que manda
// no sistema de hoje — não foram inventadas. Cada uma diz de onde veio:
//
//   • número da venda ....... vendas_notinhas_fix_patch.js:30 (`proximoNumeroVendaLimpo`)
//   • item: validações ...... vendas_os_patch.js:446 (`vosAddItem`)
//   • estoque só na gravação  vendas_os_patch.js:659 (`vosGravarVenda`, baixa "apenas na criação")
//     + correção de propósito: quando a venda JÁ existe e algum item mudou, a diferença é
//       acertada no estoque (o sistema de hoje não devolve o estoque de item tirado de uma
//       venda já salva — a mercadoria sumia do estoque sem estar em venda nenhuma).
//   • total ................. vendas_os_patch.js:653 (`max(0, soma - desconto)`)
//   • situação da venda ..... vendas_os_patch.js:297 (`vos-status`: AGUARDAR/ORÇAMENTO/APROVADA)
//   • venda zerada .......... vendas_notinhas_fix_patch.js:204 (`faturarVendaZeradaDireto`)
//   • faturada não se exclui  vendas_notinhas_fix_patch.js:352
//   • faturamento .......... vendas_os_patch.js:844 (`vosConcluirFaturamento`: à vista
//     conclui com título JÁ PAGO e baixa automática; a prazo cria uma parcela por título;
//     Grátis não cria nada; e os títulos ABERTOS antigos da venda são refeitos)
//
// A tela de RECEBIMENTO entrou junto (formas, parcelas com prévia, Grátis e venda zerada).
// O que esta parte AINDA NÃO faz (vem nas próximas fatias, e está registrado no relatório):
// PIX com link público, estorno, impressão da notinha (meia folha/folha inteira com OS),
// carnê das parcelas, aba Ordem de Serviço dentro da venda e a reposição de estoque com popup.
//
// Não grava nada fora do núcleo, não fala com a nuvem, não usa alert/confirm/prompt nativos.
(function (raiz) {
  'use strict';
  var VERSAO = '1.0.0';

  // ── 1. AS REGRAS (puras — dá para provar por teste, sem tela) ──────────────
  function texto(v) { return v == null ? '' : String(v); }
  function low(v) { return texto(v).trim().toLowerCase(); }
  function n(v, padrao) {
    var x = Number(texto(v).replace(',', '.'));
    return isFinite(x) ? x : (padrao === undefined ? 0 : padrao);
  }
  function ehNumerico(txt) { return /^\d+(?:[.,]\d+)?$/.test(texto(txt).trim()); }

  var STATUS_QUE_JA_FATURARAM = ['faturado', 'finalizada', 'concluido', 'pago'];
  function jaFaturada(status) { return STATUS_QUE_JA_FATURARAM.indexOf(low(status)) >= 0; }

  // Número da venda: maior número já usado (+1), ignorando registro migrado e número
  // fora de faixa (>= 500000 — é o mesmo teto do sistema de hoje, que existe para número
  // absurdo/corrompido não empurrar a numeração da loja para o infinito).
  function numeroDaVenda(vendas, empresaId) {
    var max = 0;
    (vendas || []).forEach(function (v) {
      if (!v || v.origemMigracao) return;
      if (empresaId && v.empresaId !== empresaId) return;
      var num = parseInt(texto(v.numero).replace(/\D/g, ''), 10);
      if (isFinite(num) && num > max && num < 500000) max = num;
    });
    return String(max + 1);
  }

  // Estoque: a INCLUSÃO do item não checa estoque quando é Serviço, Recarga ou estoque
  // infinito (vendas_os_patch.js:449). A BAIXA na gravação só isenta Serviço e estoque
  // infinito (vendas_os_patch.js:661) — as duas regras do sistema de hoje, diferentes de
  // propósito, copiadas como estão.
  function isentoNaInclusao(p) { return !p || !!p.estoqueInfinito || p.categoria === 'Serviço' || p.categoria === 'Recarga'; }
  function isentoNaBaixa(p) { return !p || !!p.estoqueInfinito || p.categoria === 'Serviço'; }

  // Devolve { ok, motivo } — o motivo é exatamente o texto que ele vê hoje.
  function validaEstoque(p, qtd) {
    if (isentoNaInclusao(p)) return { ok: true };
    var est = n(p.estoque, 0);
    if (est <= 0) return { ok: false, motivo: 'Produto sem estoque' };
    if (qtd > est) return { ok: false, motivo: 'Estoque insuficiente. Disponível: ' + est };
    return { ok: true };
  }

  // Monta o item da venda com as MESMAS checagens e na MESMA ordem do sistema de hoje.
  function montarItem(entrada) {
    var e = entrada || {};
    var p = e.produto || null;
    var descricaoLivre = texto(e.descricaoLivre).trim();
    if (!p && !descricaoLivre) return { ok: false, motivos: ['Selecione um produto ou escreva a descrição'] };
    var qtd = n(e.qtdTexto, 1) || 1;
    var motivos = [];
    if (p) {
      var est = validaEstoque(p, qtd);
      if (!est.ok) motivos.push(est.motivo);
    }
    if (!ehNumerico(e.precoTexto)) motivos.push('Informe um valor unitário numérico para adicionar o item');
    if (texto(e.descontoTexto).trim() !== '' && !ehNumerico(e.descontoTexto)) motivos.push('O desconto deve conter somente números');
    if (texto(e.qtdTexto).trim() !== '' && !ehNumerico(e.qtdTexto)) motivos.push('A quantidade deve conter somente números');
    if (motivos.length) return { ok: false, motivos: motivos };
    var preco = n(e.precoTexto, 0);
    var desconto = texto(e.descontoTexto).trim() === '' ? 0 : n(e.descontoTexto, 0);
    return {
      ok: true,
      item: {
        produtoId: p ? p.id : null,
        descricao: p ? texto(p.nome) : descricaoLivre,
        sku: p ? texto(p.sku) : '',
        tipo: texto(e.tipo) || 'Produto',
        qtd: qtd,
        preco: preco,
        desconto: desconto,
        subtotal: Math.max(0, qtd * preco - desconto),
        situacao: 'Pendente',
        numCartucho: '', identificacao: '', pe: false, ps: false, tecnico: ''
      }
    };
  }

  function calcularTotais(itens, descontoVenda) {
    var soma = (itens || []).reduce(function (s, i) { return s + n(i && i.subtotal, 0); }, 0);
    var desconto = n(descontoVenda, 0);
    return { produtos: soma, desconto: desconto, total: Math.max(0, soma - desconto) };
  }

  // O que a gravação faz com o estoque de cada item (só na criação da venda).
  function baixaDeEstoque(itens, acharProduto) {
    var mudancas = [];
    (itens || []).forEach(function (it) {
      if (!it || !it.produtoId) return;
      var p = acharProduto ? acharProduto(it.produtoId) : null;
      if (!p || isentoNaBaixa(p)) return;
      mudancas.push({ id: p.id, estoque: n(p.estoque, 0) - n(it.qtd, 1) });
    });
    return mudancas;
  }
  // Acerta a diferença entre a venda que JÁ estava salva e a que está sendo salva agora:
  // devolve o que saiu, baixa o que entrou. Salvar duas vezes sem mudar nada não mexe em
  // nada (é o mesmo cálculo, então não existe baixa dobrada).
  function reconciliarEstoque(itensAntes, itensDepois, acharProduto) {
    function somar(itens, mapa) {
      (itens || []).forEach(function (it) {
        if (!it || !it.produtoId) return;
        var p = acharProduto ? acharProduto(it.produtoId) : null;
        if (!p || isentoNaBaixa(p)) return;
        mapa[p.id] = (mapa[p.id] || 0) + n(it.qtd, 1);
      });
      return mapa;
    }
    var antes = somar(itensAntes, {});
    var depois = somar(itensDepois, {});
    var mudancas = [];
    Object.keys(depois).forEach(function (id) {
      if ((depois[id] || 0) !== (antes[id] || 0)) {
        var p = acharProduto(id);
        if (p) mudancas.push({ id: id, estoque: n(p.estoque, 0) + (antes[id] || 0) - depois[id], delta: (depois[id] || 0) - (antes[id] || 0) });
      }
    });
    Object.keys(antes).forEach(function (id) {
      if (depois[id] === undefined) {
        var p = acharProduto(id);
        if (p) mudancas.push({ id: id, estoque: n(p.estoque, 0) + antes[id], delta: -antes[id] });
      }
    });
    return mudancas;
  }

  // Devolver estoque (excluir venda).
  function devolucaoDeEstoque(itens, acharProduto) {
    var mudancas = [];
    (itens || []).forEach(function (it) {
      if (!it || !it.produtoId) return;
      var p = acharProduto ? acharProduto(it.produtoId) : null;
      if (!p || isentoNaBaixa(p)) return;
      mudancas.push({ id: p.id, estoque: n(p.estoque, 0) + n(it.qtd, 1) });
    });
    return mudancas;
  }

  // As formas de recebimento são as MESMAS de hoje (vendas_os_patch.js:740 + 'Prazo'),
  // e "Dinheiro" vem escolhido — igual ao faturamento de hoje.
  var FORMAS_RECEBIMENTO = ['Dinheiro', 'Pix', 'Cartão de crédito', 'Cartão de débito', 'Cheque', 'Conta', 'Grátis', 'Prazo'];

  function somarDias(d, dias) { var x = new Date(d.getTime()); x.setDate(x.getDate() + dias); return x; }

  // Cópia do `vosAddMesesDiaFixo` (vendas_os_patch.js:36): vence todo dia N do mês, e se o
  // mês não tiver esse dia (31 em fevereiro), cai no último dia do mês.
  function somarMesesDiaFixo(base, meses, dia) {
    var d = new Date(base.getTime());
    var alvoMes = d.getMonth() + meses;
    var ano = d.getFullYear() + Math.floor(alvoMes / 12);
    var mes = ((alvoMes % 12) + 12) % 12;
    var ultimo = new Date(ano, mes + 1, 0).getDate();
    d.setFullYear(ano, mes, Math.min(dia, ultimo));
    return d;
  }

  // Cópia do `vosCalcParcelas` (vendas_os_patch.js:46): n parcelas, intervalo em dias,
  // juros ao mês, primeiro vencimento e vence-todo-dia (diaFixo).
  function parcelasDoFaturamento(valor, cfg) {
    var c = cfg || {};
    var quantas = Math.max(1, parseInt(c.parcelas, 10) || 1);
    var juros = n(c.jurosMes, 0);
    var intervalo = Math.max(1, parseInt(c.intervaloDias, 10) || 30);
    var diaFixo = parseInt(c.diaFixo, 10) || 0;
    var hoje = c.hoje ? new Date(c.hoje) : new Date();
    if (isNaN(hoje.getTime())) hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    var prim;
    if (c.primeiroVencimento) {
      prim = new Date(String(c.primeiroVencimento).slice(0, 10) + 'T12:00:00');
      if (isNaN(prim.getTime())) prim = somarDias(hoje, intervalo);
    } else prim = somarDias(hoje, intervalo);
    var base = Math.round((n(valor, 0) / quantas) * 100) / 100;
    var out = [];
    for (var i = 0; i < quantas; i++) {
      var venc = diaFixo > 0 ? somarMesesDiaFixo(prim, i, diaFixo) : somarDias(prim, i * intervalo);
      var venc0 = new Date(venc.getTime()); venc0.setHours(0, 0, 0, 0);
      var dias = Math.max(0, Math.round((venc0 - hoje) / 86400000));
      var val = Math.round(base * (1 + (juros / 100) * (dias / 30)) * 100) / 100;
      out.push({ n: i + 1, vencimento: venc.toISOString(), valor: val });
    }
    return out;
  }

  // Títulos que o faturamento cria (vendas_os_patch.js:844):
  //  • venda zerada ....... um título JÁ PAGO, baixado automático, "Sem cobrança (R$ 0,00)"
  //  • "Grátis" ........... nenhum título
  //  • "Prazo" ............ um título EM ABERTO por parcela
  //  • à vista (demais) ... um título JÁ PAGO, baixado automático
  // Devolve { titulos, parcelas } — `parcelas` é o que fica gravado na venda.
  function faturamentoDaVenda(venda, forma, empresaId, cfg, agora) {
    var quando = agora || new Date();
    var total = n(venda && venda.total, 0);
    var f = texto(forma) || 'Dinheiro';
    var numero = texto(venda && venda.numero);
    var base = function (extra) {
      return Object.assign({
        empresaId: empresaId, origem: 'venda', clienteId: venda ? venda.clienteId : null,
        vendaId: venda ? venda.id : null, contratoId: null, leituraId: null, formaPagamento: f
      }, extra);
    };
    if (total <= 0) {
      return {
        titulos: [base({
          descricao: 'Venda ' + numero + ' • sem cobrança (R$ 0,00)', valor: 0,
          vencimento: quando.toISOString(), pagamentoData: quando.toISOString(),
          status: 'pago', autoBaixa: true, formaPagamento: 'Sem cobrança (R$ 0,00)',
          parcela: 1, totalParcelas: 1
        })],
        parcelas: [{ n: 1, total: 1, vencimento: quando.toISOString(), valor: 0 }]
      };
    }
    if (f === 'Grátis') return { titulos: [], parcelas: [] };
    if (f === 'Prazo') {
      var lista = parcelasDoFaturamento(total, Object.assign({ hoje: quando }, cfg || {}));
      return {
        titulos: lista.map(function (p) {
          return base({
            descricao: 'Venda ' + numero + ' • parcela ' + p.n + '/' + lista.length,
            valor: p.valor, vencimento: p.vencimento, pagamentoData: null, status: 'aberto',
            autoBaixa: false, parcela: p.n, totalParcelas: lista.length,
            jurosMes: n((cfg || {}).jurosMes, 0)
          });
        }),
        parcelas: lista.map(function (p) { return { n: p.n, total: lista.length, vencimento: p.vencimento, valor: p.valor }; })
      };
    }
    return {
      titulos: [base({
        descricao: 'Venda ' + numero + ' • à vista (' + f + ')', valor: total,
        vencimento: quando.toISOString(), pagamentoData: quando.toISOString(),
        status: 'pago', autoBaixa: true, parcela: 1, totalParcelas: 1
      })],
      parcelas: [{ n: 1, total: 1, vencimento: quando.toISOString(), valor: total }]
    };
  }

  // 'YYYY-MM-DD' como o sistema de hoje monta (mesmo fuso, mesma origem)
  function isoDia(d) { return new Date(d.getTime()).toISOString().slice(0, 10); }

  var regras = {
    numeroDaVenda: numeroDaVenda, ehNumerico: ehNumerico, jaFaturada: jaFaturada,
    FORMAS_RECEBIMENTO: FORMAS_RECEBIMENTO, parcelasDoFaturamento: parcelasDoFaturamento,
    somarMesesDiaFixo: somarMesesDiaFixo, isoDia: isoDia,
    faturamentoDaVenda: faturamentoDaVenda,
    isentoNaInclusao: isentoNaInclusao, isentoNaBaixa: isentoNaBaixa, validaEstoque: validaEstoque,
    montarItem: montarItem, calcularTotais: calcularTotais,
    baixaDeEstoque: baixaDeEstoque, devolucaoDeEstoque: devolucaoDeEstoque, reconciliarEstoque: reconciliarEstoque,
  };

  // ── 2. A TELA ─────────────────────────────────────────────────────────────
  var LISTA_VENDAS = {
    numero: { obrigatorio: true, tipo: 'texto' }, clienteId: { tipo: 'texto' }, clienteNome: { tipo: 'texto' },
    itens: { tipo: 'lista' }, desconto: { tipo: 'numero' }, total: { tipo: 'numero' },
    status: { tipo: 'texto' }, formaPagamento: { tipo: 'texto' }, data: { tipo: 'texto' }, destino: { tipo: 'texto' },
    parcelas: { tipo: 'lista' }, faturadoEm: { tipo: 'texto' }
  };
  var LISTA_RECEBER = {
    origem: { tipo: 'texto' }, clienteId: { tipo: 'texto' }, vendaId: { tipo: 'texto' }, descricao: { tipo: 'texto' },
    valor: { tipo: 'numero' }, vencimento: { tipo: 'texto' }, pagamentoData: { tipo: 'texto' }, status: { tipo: 'texto' },
    autoBaixa: { tipo: 'boleano' }, formaPagamento: { tipo: 'texto' },
    parcela: { tipo: 'numero' }, totalParcelas: { tipo: 'numero' }, jurosMes: { tipo: 'numero' }
  };

  function moeda(v) { return n(v, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
  function escapar(t) {
    return texto(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function criarVenda(opcoes) {
    var o = opcoes || {};
    var nucleo = o.nucleo;
    if (!nucleo) throw new Error('venda: informe o núcleo');
    var alvo = o.elemento;
    if (!alvo || !alvo.ownerDocument) throw new Error('venda: informe onde desenhar a venda');
    var doc = alvo.ownerDocument;
    var raizDom = o.documento || doc;
    var SEL = raiz.DIGICOPY_SELECAO;
    var aoMudar = typeof o.aoMudar === 'function' ? o.aoMudar : function () { };
    var empresaId = o.empresaId || 'rascunho';

    nucleo.registrarLista('vendas', LISTA_VENDAS);
    nucleo.registrarLista('contasReceber', LISTA_RECEBER);

    var estado = { cliente: null, itens: [], desconto: 0, status: 'aguardar', vendaId: null, numero: '', forma: 'Dinheiro', aviso: '', erro: '' };

    function produtosDeVerdade() { return nucleo.listar('produtos') || []; }
    function acharProduto(id) { try { return nucleo.obter('produtos', id); } catch (e) { return null; } }

    // ── gravar (criar ou atualizar). Estoque só na primeira gravação, como hoje. ──
    function gravar(forcarStatus) {
      if (!estado.cliente) return { ok: false, erro: 'Selecione o cliente' };
      if (!estado.itens.length) return { ok: false, erro: 'Adicione ao menos um item' };
      var totais = calcularTotais(estado.itens, estado.desconto);
      var status = forcarStatus || estado.status;
      var nova = !estado.vendaId;
      if (nova) estado.numero = numeroDaVenda(nucleo.listar('vendas'), empresaId);
      var anterior = null;
      if (!nova) { try { anterior = nucleo.obter('vendas', estado.vendaId); } catch (e) { anterior = null; } }

      var venda = {
        id: estado.vendaId || undefined,
        numero: estado.numero,
        clienteId: estado.cliente.id,
        clienteNome: texto(estado.cliente.nome),
        itens: estado.itens.map(function (i) { return Object.assign({}, i); }),
        desconto: totais.desconto,
        total: totais.total,
        status: status
      };
      // a forma de pagamento só passa a existir na venda depois de faturar — é o que o
      // sistema de hoje faz (`vosGravarVenda` não grava forma; `vosConcluirFaturamento` grava)
      if (status === 'faturado') venda.formaPagamento = estado.forma;
      var r = nucleo.salvar('vendas', venda);
      if (!r || !r.ok) return { ok: false, erro: (r && r.erros && r.erros.join(' · ')) || 'não deu para gravar a venda' };
      estado.vendaId = r.item.id;

      // estoque: baixa na criação (vendas_os_patch.js:659) e, quando a venda já existia,
      // acerta só a diferença do que mudou (nada de baixa dobrada e nada de estoque perdido)
      reconciliarEstoque(anterior ? anterior.itens : [], venda.itens, acharProduto).forEach(function (m) {
        var p = acharProduto(m.id);
        if (p) nucleo.salvar('produtos', Object.assign({}, p, { estoque: m.estoque }));
      });
      return { ok: true, venda: r.item, nova: nova };
    }

    // ── RECEBIMENTO (a janela de faturamento) ─────────────────────────────────
    // Mesmo fluxo de hoje (vendas_os_patch.js:741 → :793 → :838 → :844): a venda é
    // gravada antes de abrir, a forma vem com Dinheiro escolhido, "A prazo" abre a caixa
    // das parcelas (qtd, 1º vencimento, intervalo, vence todo dia, juros) com a prévia
    // dos vencimentos, e o botão conclui o faturamento.
    var fat = { forma: 'Dinheiro', overlay: null };

    function lerConfigParcelas() {
      var v = function (sel, padrao) {
        var el = doc.querySelector('[data-fat-modal] ' + sel);
        return el && texto(el.value).trim() !== '' ? el.value : padrao;
      };
      return {
        parcelas: parseInt(v('[data-parc-qtd]', '1'), 10) || 1,
        primeiroVencimento: v('[data-parc-prim]', isoDia(somarDias(new Date(), 30))),
        intervaloDias: parseInt(v('[data-parc-int]', '30'), 10) || 30,
        diaFixo: parseInt(v('[data-parc-dia]', '0'), 10) || 0,
        jurosMes: n(v('[data-parc-juros]', '0'), 0)
      };
    }

    function atualizarPreview(parcelas) {
      var corpo = doc.querySelector('[data-fat-modal] [data-parc-body]');
      if (!corpo) return;
      var venda = nucleo.obter('vendas', estado.vendaId);
      var lista = parcelas || parcelasDoFaturamento(venda.total, Object.assign({ hoje: new Date() }, lerConfigParcelas()));
      corpo.innerHTML = lista.map(function (p) {
        return '<tr><td><b>' + p.n + '/' + lista.length + '</b></td><td>' + escapar(isoDia(new Date(p.vencimento))) + '</td><td><b>' + moeda(p.valor) + '</b></td></tr>';
      }).join('');
      var tot = doc.querySelector('[data-fat-modal] [data-parc-total]');
      if (tot) tot.textContent = moeda(lista.reduce(function (s, p) { return s + p.valor; }, 0));
    }

    function escolherForma(f) {
      fat.forma = f;
      var modal = doc.querySelector('[data-fat-modal]');
      if (!modal) return;
      modal.querySelectorAll('[data-forma]').forEach(function (b) {
        var on = b.getAttribute('data-forma') === f;
        b.className = 'vnd-forma' + (on ? ' vnd-forma-on' : '') + (f === 'Prazo' && on ? ' vnd-forma-prazo' : '');
      });
      var prazo = f === 'Prazo';
      modal.querySelector('[data-prazo-box]').hidden = !prazo;
      var msg = modal.querySelector('[data-vista-msg]');
      msg.hidden = prazo;
      if (!prazo) {
        msg.textContent = f === 'Grátis'
          ? 'Venda Grátis (sem cobrança): será faturada e concluída sem gerar conta a receber.'
          : 'Venda à vista em ' + f + ': será faturada e concluída automaticamente.';
      }
      modal.querySelector('[data-fat-label]').textContent = prazo ? 'Finalizar e gerar parcelas' : 'Concluir faturamento';
      if (prazo) atualizarPreview();
    }

    function fecharRecebimento() {
      var m = doc.querySelector('[data-fat-modal]');
      if (m && m.parentNode) m.parentNode.removeChild(m);
      fat.overlay = null;
    }

    function abrirRecebimento() {
      // o sistema de hoje grava a venda antes de abrir o faturamento (vosFaturarAtual)
      var g = gravar();
      if (!g.ok) { mostrarErro(g.erro); return null; }
      fecharRecebimento();
      var venda = g.venda;
      var overlay = doc.createElement('div');
      overlay.className = 'nfx-mask';
      overlay.setAttribute('data-fat-modal', '1');
      var campo = function (attr, rotulo, valor, extra) {
        return '<label class="vnd-campo"><span>' + rotulo + '</span><input ' + attr + ' value="' + escapar(valor) + '"' + (extra || '') + '></label>';
      };
      overlay.innerHTML =
        '<div class="nfx-caixa vnd-fat-caixa" role="dialog" aria-modal="true">' +
          '<div class="vnd-fat-topo">' +
            '<div><span class="vnd-rotulo">Venda</span><b>' + escapar(venda.numero) + ' — ' + escapar(venda.clienteNome || '') + '</b></div>' +
            '<div class="vnd-fat-dinheiro"><span class="vnd-rotulo">Total a faturar</span><b>' + moeda(venda.total) + '</b></div>' +
          '</div>' +
          '<div class="vnd-rotulo">Forma de recebimento</div>' +
          '<div class="vnd-formas" data-formas>' +
            FORMAS_RECEBIMENTO.map(function (f) {
              return '<button type="button" data-forma="' + escapar(f) + '" class="vnd-forma' + (f === 'Dinheiro' ? ' vnd-forma-on' : '') + '">' +
                     escapar(f === 'Prazo' ? 'A prazo' : f) + '</button>';
            }).join('') +
          '</div>' +
          '<div class="vnd-aviso" data-vista-msg>Venda à vista em Dinheiro: será faturada e concluída automaticamente.</div>' +
          '<div class="vnd-prazo" data-prazo-box hidden>' +
            '<div class="vnd-parc-campos">' +
              campo('type="number" min="1" max="60" data-parc-qtd', 'Qtd parcelas', '1') +
              campo('type="date" data-parc-prim', 'Primeiro vencimento', isoDia(somarDias(new Date(), 30))) +
              campo('type="number" min="1" data-parc-int', 'Intervalo (dias)', '30') +
              campo('type="number" min="1" max="31" placeholder="ex: 10" data-parc-dia', 'Venc. todo dia', '') +
              campo('type="number" step="0.01" data-parc-juros', 'Juros % a.m.', '0') +
            '</div>' +
            '<table class="vnd-tabela"><thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th></tr></thead>' +
            '<tbody data-parc-body></tbody>' +
            '<tfoot><tr><td colspan="2"><b>TOTAL</b></td><td><b data-parc-total></b></td></tr></tfoot></table>' +
          '</div>' +
          '<div class="nfx-erro" data-fat-erro hidden></div>' +
          '<div class="nfx-botoes">' +
            '<button type="button" class="nfx-btn nfx-btn-fraco" data-fat-cancelar>Cancelar</button>' +
            '<button type="button" class="nfx-btn nfx-btn-forte" data-fat-concluir><span data-fat-label>Concluir faturamento</span></button>' +
          '</div>' +
        '</div>';
      doc.body.appendChild(overlay);
      fat.overlay = overlay;
      overlay.querySelectorAll('[data-forma]').forEach(function (b) {
        b.addEventListener('click', function () { escolherForma(b.getAttribute('data-forma')); });
      });
      overlay.querySelectorAll('.vnd-parc-campos input').forEach(function (i) {
        i.addEventListener('change', function () { atualizarPreview(); });
      });
      overlay.querySelector('[data-fat-cancelar]').addEventListener('click', function () {
        fecharRecebimento();
        mostrarAviso('Faturamento cancelado — a venda ficou salva como AGUARDAR.');
      });
      overlay.querySelector('[data-fat-concluir]').addEventListener('click', concluirFaturamento);
      return overlay;
    }

    function erroNoRecebimento(msg) {
      var el = doc.querySelector('[data-fat-modal] [data-fat-erro]');
      if (el) { el.textContent = msg; el.hidden = false; } else mostrarErro(msg);
    }

    function concluirFaturamento() {
      var cfg = fat.forma === 'Prazo' ? lerConfigParcelas() : {};
      estado.forma = fat.forma;
      var g = gravar('faturado');
      if (!g.ok) { erroNoRecebimento(g.erro); return; }
      var venda = g.venda;
      var calc = faturamentoDaVenda(venda, fat.forma, empresaId, cfg, new Date());
      // regra de hoje (vendas_os_patch.js:852): antes de criar, refaz os títulos ABERTOS
      // desta venda — assim faturar de novo nunca deixa título repetido pendurado
      (nucleo.listar('contasReceber') || []).forEach(function (c) {
        if (c.vendaId === venda.id && c.status === 'aberto') nucleo.apagar('contasReceber', c.id, 'refeito no faturamento');
      });
      calc.titulos.forEach(function (t) { nucleo.salvar('contasReceber', t); });
      var r = nucleo.salvar('vendas', Object.assign({}, venda, {
        formaPagamento: fat.forma, parcelas: calc.parcelas, faturadoEm: new Date().toISOString()
      }));
      if (!r || !r.ok) { erroNoRecebimento('não deu para gravar o faturamento da venda'); return; }
      estado.status = 'faturado';
      fecharRecebimento();
      desenhar();
      mostrarAviso(avisoDoFaturamento(venda.total, fat.forma, calc));
      aoMudar();
    }

    function avisoDoFaturamento(total, forma, calc) {
      if (n(total, 0) <= 0) return 'Venda zerada: faturada, baixada automaticamente como paga, sem cobrança.';
      if (!calc.titulos.length) return 'Venda faturada como Grátis: nenhuma cobrança foi criada no financeiro.';
      if (forma === 'Prazo') {
        var total = calc.titulos.reduce(function (s, t) { return s + n(t.valor, 0); }, 0);
        return 'Venda faturada a prazo: ' + calc.titulos.length + ' parcela(s) em aberto no financeiro, somando ' + moeda(total) + '.';
      }
      return 'Venda faturada à vista em ' + forma + ': título já baixado no financeiro.';
    }

    function salvar() {
      var g = gravar();
      if (!g.ok) { mostrarErro(g.erro); return; }
      var msg = 'Venda ' + g.venda.numero + ' salva' + (g.nova ? ' (estoque baixado)' : '');
      desenhar();
      mostrarAviso(msg);
      aoMudar();
    }

    // Limpa na MESMA caixa (não troca o objeto): quem guardou a referência ao estado
    // continua enxergando a venda certa — trocar o objeto fazia o de fora olhar venda velha.
    function limparEstado() {
      estado.cliente = null;
      estado.itens = [];
      estado.desconto = 0;
      estado.status = 'aguardar';
      estado.vendaId = null;
      estado.numero = '';
      estado.forma = 'Dinheiro';
      estado.aviso = '';
      estado.erro = '';
    }

    function novaVenda() {
      limparEstado();
      desenhar();
      aoMudar();
    }

    function adicionarItem() {
      var caixaProd = caixas.produto;
      var p = caixaProd ? caixaProd.escolhido() : null;
      var campos = {
        produto: p,
        descricaoLivre: (alvo.querySelector('[data-prod-texto]') || {}).value,
        tipo: (alvo.querySelector('[data-tipo]') || {}).value,
        qtdTexto: (alvo.querySelector('[data-qtd]') || {}).value,
        precoTexto: (alvo.querySelector('[data-vunit]') || {}).value,
        descontoTexto: (alvo.querySelector('[data-item-desc]') || {}).value
      };
      var r = regras.montarItem(campos);
      if (!r.ok) { mostrarErro(r.motivos.join(' · ')); return; }
      estado.itens.push(r.item);
      estado.erro = '';
      estado.aviso = '';
      desenhar();
      var foco = alvo.querySelector('[data-prod-texto]');
      if (foco && foco.focus) foco.focus();
    }

    function removerItem(indice) {
      var it = estado.itens[indice];
      if (!it) return;
      // O estoque NÃO volta aqui: se ele tirar o item e não salvar, a venda do sistema
      // continua com o item. O acerto acontece na gravação (reconciliarEstoque).
      estado.itens.splice(indice, 1);
      desenhar();
      aoMudar();
    }

    var caixas = { cliente: null, produto: null };

    // O aviso NÃO redesenha a venda: o que ele digitou (produto, quantidade, valor,
    // desconto) fica na tela — é o comportamento do sistema de hoje, que só avisa.
    function mostrarErro(msg) {
      estado.erro = msg || '';
      var b = alvo.querySelector('[data-erro-box]');
      if (b) { b.textContent = estado.erro ? '⚠️ ' + estado.erro : ''; b.hidden = !estado.erro; }
    }
    function mostrarAviso(msg) {
      estado.aviso = msg || '';
      var b = alvo.querySelector('[data-aviso-box]');
      if (b) { b.textContent = estado.aviso; b.hidden = !estado.aviso; }
    }

    function tabela() {
      if (!estado.itens.length) return '<tr><td colspan="6" class="vnd-vazio">Nenhum item lançado</td></tr>';
      return estado.itens.map(function (it, i) {
        return '<tr>' +
          '<td><span class="vnd-tag">' + escapar(it.tipo) + '</span></td>' +
          '<td><b>' + escapar(it.descricao) + '</b>' + (it.sku ? '<br><span class="vnd-sub">' + escapar(it.sku) + '</span>' : '') + '</td>' +
          '<td>' + escapar(it.qtd) + '</td>' +
          '<td>' + moeda(it.preco) + '</td>' +
          '<td>' + moeda(it.desconto) + '</td>' +
          '<td>' + moeda(it.subtotal) + ' <button type="button" class="vnd-lixo" data-remover="' + i + '" title="Tirar item">🗑️</button></td>' +
          '</tr>';
      }).join('');
    }

    function desenhar() {
      // a notinha já mostra o número dela ao abrir (é o "código automático" do sistema de
      // hoje); na hora de gravar o número é conferido de novo, então ele nunca sai torto
      if (!estado.vendaId && !estado.numero) estado.numero = numeroDaVenda(nucleo.listar('vendas'), empresaId);
      var totais = calcularTotais(estado.itens, estado.desconto);
      var travada = regras.jaFaturada(estado.status);
      alvo.innerHTML =
        '<div class="vnd-topo">' +
          '<div class="vnd-bloco">' +
            '<div class="vnd-rotulo">Dados do Cliente</div>' +
            '<div data-caixa-cliente></div>' +
          '</div>' +
          '<div class="vnd-bloco vnd-bloco-pequeno">' +
            '<div class="vnd-rotulo">Situação da Venda</div>' +
            '<label class="vnd-rotulo" for="vnd-status">Situação da venda</label>' +
            '<select data-status id="vnd-status"' + (travada ? ' disabled' : '') + '>' +
              '<option value="aguardar"' + (estado.status === 'aguardar' ? ' selected' : '') + '>AGUARDAR</option>' +
              '<option value="orcamento"' + (estado.status === 'orcamento' ? ' selected' : '') + '>ORÇAMENTO</option>' +
              '<option value="aprovado"' + (estado.status === 'aprovado' ? ' selected' : '') + '>APROVADA</option>' +
              (travada ? '<option value="faturado" selected>FATURADA</option>' : '') +
            '</select>' +
            '<div class="vnd-numero">Notinha nº <b>' + escapar(estado.numero || '(sem número)') + '</b></div>' +
            (estado.cliente ? '<div class="vnd-sub">Cliente: <b>' + escapar(estado.cliente.nome) + '</b></div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="vnd-item">' +
          '<label class="vnd-campo"><span>Tipo</span><select data-tipo' + (travada ? ' disabled' : '') + '><option>Produto</option><option>Serviço</option><option>Recarga</option></select></label>' +
          '<div class="vnd-campo vnd-campo-prod"><span>Produto / descrição</span><div data-caixa-produto></div></div>' +
          '<label class="vnd-campo vnd-campo-mini"><span>Quat.</span><input data-qtd value="1"' + (travada ? ' disabled' : '') + '></label>' +
          '<label class="vnd-campo vnd-campo-mini"><span>Valor Unit.</span><input data-vunit' + (travada ? ' disabled' : '') + '></label>' +
          '<label class="vnd-campo vnd-campo-mini"><span>Desconto R$</span><input data-item-desc value="0"' + (travada ? ' disabled' : '') + '></label>' +
          '<button type="button" class="vnd-btn vnd-btn-add" data-add' + (travada ? ' disabled' : '') + '>➕ Item</button>' +
        '</div>' +
        '<div class="vnd-erro" data-erro-box' + (estado.erro ? '' : ' hidden') + '>⚠️ ' + escapar(estado.erro) + '</div>' +
        '<div class="vnd-aviso" data-aviso-box' + (estado.aviso ? '' : ' hidden') + '>' + escapar(estado.aviso) + '</div>' +
        (travada ? '<div class="vnd-aviso">Venda faturada — para alterar, estorne primeiro (a tela de estorno entra na próxima parte).</div>' : '') +
        '<table class="vnd-tabela"><thead><tr><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th>Valor Unit.</th><th>Desconto</th><th>Valor Total</th></tr></thead>' +
        '<tbody>' + tabela() + '</tbody></table>' +
        '<div class="vnd-rodape">' +
          '<div class="vnd-totais">' +
            '<span>Prod/Serv: <b>' + moeda(totais.produtos) + '</b></span>' +
            '<label class="vnd-desc">Descontos: <input data-desc-venda value="' + escapar(estado.desconto) + '"' + (travada ? ' disabled' : '') + '></label>' +
            '<span class="vnd-total">TOTAL: <b>' + moeda(totais.total) + '</b></span>' +
            (travada ? '<span class="vnd-sub">recebido em: <b>' + escapar(estado.forma) + '</b></span>' : '') +
          '</div>' +
          '<div class="vnd-acoes">' +
            '<button type="button" class="vnd-btn vnd-btn-fraco" data-nova>Nova</button>' +
            (travada ? '' : '<button type="button" class="vnd-btn" data-salvar>Salvar</button>') +
            (travada ? '' : '<button type="button" class="vnd-btn vnd-btn-forte" data-faturar>Faturar</button>') +
          '</div>' +
        '</div>';

      // as duas caixas de seleção inteligentes (mesma peça usada nas outras telas)
      caixas.cliente = null; caixas.produto = null;
      if (SEL) {
        caixas.cliente = SEL.montar({
          tipo: 'cliente', elemento: alvo.querySelector('[data-caixa-cliente]'), fonte: function () { return nucleo.listar('clientes') || []; },
          aoEscolher: function (c) { estado.cliente = c; mostrarErro(''); desenhar(); }
        });
        caixas.produto = SEL.montar({
          tipo: 'produto', elemento: alvo.querySelector('[data-caixa-produto]'), fonte: produtosDeVerdade,
          aoEscolher: function (p) {
            var vu = alvo.querySelector('[data-vunit]');
            if (vu) vu.value = String(p.preco == null ? '' : p.preco).replace('.', ',');
          }
        });
        // campo de texto livre (o sistema de hoje aceita descrição sem produto cadastrado)
        var caixaProd = alvo.querySelector('[data-caixa-produto]');
        var campoProd = caixaProd.querySelector('input[data-termo]');
        campoProd.setAttribute('data-prod-texto', '1');
        campoProd.placeholder = SEL.TIPOS.produto.placeholder + ' — ou escreva a descrição e siga';
      }

      alvo.querySelectorAll('[data-remover]').forEach(function (b) {
        b.addEventListener('click', function () { removerItem(Number(b.getAttribute('data-remover'))); });
      });
      var add = alvo.querySelector('[data-add]');
      if (add) add.addEventListener('click', adicionarItem);
      var salvarBtn = alvo.querySelector('[data-salvar]');
      if (salvarBtn) salvarBtn.addEventListener('click', salvar);
      var faturarBtn = alvo.querySelector('[data-faturar]');
      if (faturarBtn) faturarBtn.addEventListener('click', abrirRecebimento);
      var novaBtn = alvo.querySelector('[data-nova]');
      if (novaBtn) novaBtn.addEventListener('click', novaVenda);
      var status = alvo.querySelector('[data-status]');
      if (status) status.addEventListener('change', function () { estado.status = status.value; });
      var desc = alvo.querySelector('[data-desc-venda]');
      if (desc) {
        desc.addEventListener('change', function () { estado.desconto = n(desc.value, 0); desenhar(); });
      }

    }

    desenhar();
    return {
      versao: VERSAO, desenhar: desenhar, estado: estado, estadoAtual: function () { return estado; },
      gravar: gravar, salvar: salvar, adicionarItem: adicionarItem,
      abrirRecebimento: abrirRecebimento, concluirFaturamento: concluirFaturamento,
      escolherForma: escolherForma, fecharRecebimento: fecharRecebimento,
      removerItem: removerItem, novaVenda: novaVenda
    };
  }

  raiz.DIGICOPY_VENDA = { VERSAO_VENDA: VERSAO, regras: regras, criarVenda: criarVenda };
})(typeof window !== 'undefined' ? window : globalThis);
