// novo/selecao.js — A CAIXA DE SELEÇÃO INTELIGENTE (escolher cliente, produto, recarga)
//
// PEDIDO DO DONO (24/09/2026): "eu quero cada função que tinha antes, a caixa de seleção
// inteligente de escolher cliente, produto... TUDO".
//
// Esta peça é a versão do núcleo novo daquele filtro auxiliar que ele usa hoje: o campo onde
// ele ESCOLHE ONDE BUSCAR (Nome, Código, CPF/CNPJ, Telefone, ...) ao lado da caixa de digitar,
// com a lupa e o Enter. No sistema de hoje isso vive em 9 lugares diferentes (venda, nova
// venda, financeiro, contratos, contas a receber, orçamento, clientes...) e cada lugar
// reimplementou as regras do seu jeito. Aqui é UMA implementação só.
//
// REGRAS — copiadas do que já funciona hoje, sem inventar:
//   • busca sem acento e sem maiúscula ("José Ávila" acha "jose avila" e vice-versa);
//   • busca por número (3 dígitos ou mais) acha dentro de CPF/CNPJ, telefone, WhatsApp, CEP;
//   • Código é EXATO: 48 acha 48; 048 é o mesmo 48; NÃO acha 480 nem 1048;
//   • E-mail olha o e-mail e o e-mail 2; Produto NÃO traz Recarga nem inativo/excluído;
//   • Recarga pesquisa por Código / Descrição / Marca; Produto aceita filtro de categoria
//     (com a mesma unificação de categoria do sistema antigo: "serviço"/"Servico" → "Serviço").
//
// O que esta peça NÃO faz: não grava nada, não fala com a nuvem, não usa alert/confirm/prompt
// nativos, não usa localStorage. É só tela + regra de busca.
(function (raiz) {
  'use strict';
  var VERSAO = '1.0.0';

  // ── 1. as regras (puras: dá para provar por teste, sem tela) ───────────────
  var CAMPOS_CLIENTE = [
    ['todos', 'Pesquisar em tudo'], ['nome', 'Nome'], ['fantasia', 'Fantasia'],
    ['codigo', 'Código'], ['documento', 'CPF/CNPJ'], ['rgIE', 'RG/IE'],
    ['endereco', 'Endereço'], ['telefone', 'Telefone'], ['whatsapp', 'WhatsApp'],
    ['cidade', 'Cidade'], ['bairro', 'Bairro'], ['contato', 'Contato'],
    ['email', 'E-mail'], ['observacao', 'Observação'], ['cep', 'CEP'], ['estado', 'UF']
  ];
  var CATS_PRODUTO = [
    'Produto', 'Serviço', 'Cartucho', 'Cartucho Vazio', 'Insumo', 'Equipamento',
    'Impressoras', 'Chip', 'Compatível', 'Informática', 'Original', 'Outros'
  ];
  var CAMPOS_RECARGA = [
    ['todos', 'Pesquisar recarga'], ['codigo', 'Código'], ['nome', 'Descrição'], ['marca', 'Marca']
  ];

  function fold(t) {
    return String(t == null ? '' : t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  function soDigitos(t) { return String(t == null ? '' : t).replace(/\D/g, ''); }
  function ehRecargaCat(cat) { return /recarga/i.test(String(cat == null ? '' : cat)); }
  function unificaCat(cat) {
    var n = fold(cat);
    if (!n) return 'Produto';
    if (n.indexOf('serv') >= 0) return 'Serviço';
    if (n.indexOf('cartucho') >= 0 && n.indexOf('vaz') >= 0) return 'Cartucho Vazio';
    if (n.indexOf('cart') >= 0) return 'Cartucho';
    if (n.indexOf('insum') >= 0 || n.indexOf('peca') >= 0 || n.indexOf('peça') >= 0 || n.indexOf('toner') >= 0) return 'Insumo';
    if (n.indexOf('equip') >= 0) return 'Equipamento';
    if (n.indexOf('impress') >= 0) return 'Impressoras';
    if (n.indexOf('chip') >= 0) return 'Chip';
    if (n.indexOf('compat') >= 0) return 'Compatível';
    if (n.indexOf('info') >= 0) return 'Informática';
    if (n.indexOf('orig') >= 0) return 'Original';
    if (n.indexOf('recarga') >= 0) return 'Recarga';
    return String(cat || 'Produto');
  }
  // Código exato: 048 = 48; 48 ≠ 480; olha o código atual e o antigo
  function normCodigo(v) { var d = soDigitos(v); return d ? (d.replace(/^0+/, '') || '0') : ''; }
  function codigoIgual(cadastro, busca) {
    var alvo = normCodigo(busca);
    if (!alvo) return false;
    return normCodigo(cadastro) === alvo;
  }

  function filtraClientes(list, q, campo) {
    var termo = fold(q).trim();
    if (!termo) return list || [];
    var num = soDigitos(q);
    var k = campo || 'todos';
    function testa(v, extraNum) {
      return fold(v).indexOf(termo) >= 0 || (!!num && num.length >= 3 && extraNum && soDigitos(v).indexOf(num) >= 0);
    }
    return (list || []).filter(function (c) {
      if (!c) return false;
      if (k !== 'todos') {
        if (k === 'email') return testa(c.email) || testa(c.email2);
        if (k === 'documento' || k === 'cep' || k === 'telefone' || k === 'whatsapp') return testa(c[k], true);
        if (k === 'codigo') {
          // Regra do sistema de hoje (v5.22.36 envelopando o CLI_PURE): termo SEM número no
          // campo Código devolve a lista inteira (é o que ele já vê hoje quando digita letra
          // por engano nesse campo). Reproduzido de propósito — paridade, não palpite.
          if (!normCodigo(q)) return true;
          return codigoIgual(c.codigo, q) || codigoIgual(c.codigoAntigo, q);
        }
        return testa(c[k]);
      }
      return testa(c.nome) || testa(c.fantasia) || testa(c.documento, true) || testa(c.telefone, true) ||
        testa(c.cidade) || testa(c.bairro) || testa(c.endereco) || String(c.codigo == null ? '' : c.codigo).indexOf(num || termo) >= 0 ||
        testa(c.contato) || testa(c.email) || testa(c.cep, true) || testa(c.whatsapp, true);
    });
  }

  // Produto: fora Recarga, fora inativo/excluído; categoria unificada
  function filtraProdutos(list, q, cat) {
    var termo = fold(q).trim();
    var catN = String(cat == null ? '' : cat).trim();
    return (list || []).filter(function (p) {
      if (!p || p.status === 'inativo' || p.status === 'excluido') return false;
      if (ehRecargaCat(p.categoria) || ehRecargaCat(p.tipo) || ehRecargaCat(p.nome)) return false;
      if (catN && unificaCat(p.categoria) !== catN && String(p.categoria == null ? '' : p.categoria) !== catN) return false;
      if (!termo) return true;
      return [p.nome, p.sku, p.codigo, p.fabricante, p.ncm, p.categoria]
        .some(function (x) { return fold(x).indexOf(termo) >= 0; });
    });
  }

  function filtraRecargas(list, q, campo) {
    var termo = fold(q).trim();
    var k = campo || 'todos';
    return (list || []).filter(function (r) {
      if (!r || r.status === 'inativo' || r.status === 'excluido') return false;
      if (!termo) return true;
      if (k === 'codigo') return String(r.codigo == null ? '' : r.codigo).toLowerCase().indexOf(termo) >= 0 || soDigitos(r.codigo).indexOf(soDigitos(q)) >= 0;
      if (k === 'nome') return fold(r.nome).indexOf(termo) >= 0;
      if (k === 'marca') return fold(r.marca).indexOf(termo) >= 0;
      return [r.codigo, r.nome, r.marca].some(function (x) { return fold(x).indexOf(termo) >= 0; });
    });
  }

  var busca = {
    fold: fold, soDigitos: soDigitos, ehRecargaCat: ehRecargaCat, unificaCat: unificaCat,
    normCodigo: normCodigo, codigoIgual: codigoIgual,
    filtraClientes: filtraClientes, filtraProdutos: filtraProdutos, filtraRecargas: filtraRecargas,
    CAMPOS_CLIENTE: CAMPOS_CLIENTE, CATS_PRODUTO: CATS_PRODUTO, CAMPOS_RECARGA: CAMPOS_RECARGA
  };

  // ── 2. a caixa (tela) ──────────────────────────────────────────────────────
  var TIPOS = {
    cliente: {
      rotulo: 'cliente', limite: 12, campos: CAMPOS_CLIENTE, campoInicial: 'todos',
      placeholder: 'Digite nome, código, CPF/CNPJ ou telefone',
      titulo: function (c) { return (c.codigo ? '#' + c.codigo + ' ' : '') + String(c.nome == null ? '' : c.nome); },
      detalhe: function (c) { return String(c.documento || c.telefone || '').trim(); },
      filtrar: function (lista, q, campo) { return filtraClientes(lista, q, campo); },
      escolher: function (c) { return String(c.nome == null ? '' : c.nome); }
    },
    produto: {
      rotulo: 'produto', limite: 14, campos: [['', 'Todas categorias']].concat(CATS_PRODUTO.map(function (c) { return [c, c]; })),
      campoInicial: '',
      placeholder: 'Descrição, código de barras, NCM ou fabricante',
      titulo: function (p) { return String(p.sku || p.codigo || '') + ' ' + String(p.nome == null ? '' : p.nome); },
      detalhe: function (p) { return Number(p.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); },
      filtrar: function (lista, q, cat) { return filtraProdutos(lista, q, cat); },
      escolher: function (p) { return String(p.nome == null ? '' : p.nome); }
    },
    recarga: {
      rotulo: 'recarga', limite: 14, campos: CAMPOS_RECARGA, campoInicial: 'todos',
      placeholder: 'Nº da etiqueta, código ou descrição — se não achar, escreve e segue',
      titulo: function (r) { return String(r.codigo == null ? '' : r.codigo) + ' ' + String(r.nome == null ? '' : r.nome); },
      detalhe: function (r) { return String(r.marca || ''); },
      filtrar: function (lista, q, campo) { return filtraRecargas(lista, q, campo); },
      escolher: function (r) { return String(r.nome == null ? '' : r.nome); }
    }
  };

  function escapar(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function idDe(reg) { return reg && reg.id !== undefined && reg.id !== null ? String(reg.id) : ''; }

  function montar(opcoes) {
    var o = opcoes || {};
    var cfg = TIPOS[o.tipo];
    if (!cfg) throw new Error('selecao: tipo desconhecido "' + o.tipo + '" (use cliente, produto ou recarga)');
    var caixa = o.elemento;
    if (!caixa || !caixa.ownerDocument) throw new Error('selecao: informe o elemento onde desenhar a caixa');
    var doc = caixa.ownerDocument;
    var aoEscolher = typeof o.aoEscolher === 'function' ? o.aoEscolher : function () {};
    var fonte = typeof o.fonte === 'function' ? o.fonte : function () { return o.fonte || []; };
    var limite = Number(o.limite) > 0 ? Number(o.limite) : cfg.limite;
    var vivo = { achados: [], destaque: -1, escolhido: null };

    caixa.classList.add('sfx-caixa');
    caixa.innerHTML =
      '<div class="sfx-linha">' +
        '<select data-campo aria-label="Onde buscar">' +
          cfg.campos.map(function (c) { return '<option value="' + escapar(c[0]) + '">' + escapar(c[1]) + '</option>'; }).join('') +
        '</select>' +
        '<input data-termo type="text" autocomplete="off" spellcheck="false" placeholder="' + escapar(o.placeholder || cfg.placeholder) + '">' +
        '<button data-lupa type="button" title="Buscar">🔍</button>' +
      '</div>' +
      '<div data-resultados class="sfx-resultados sfx-escondido"></div>';

    var campo = caixa.querySelector('[data-campo]');
    var termo = caixa.querySelector('[data-termo]');
    var resultados = caixa.querySelector('[data-resultados]');
    campo.value = o.campoInicial !== undefined ? o.campoInicial : cfg.campoInicial;

    function fechar() { resultados.classList.add('sfx-escondido'); vivo.destaque = -1; }
    function abrir() { resultados.classList.remove('sfx-escondido'); }

    function procurar(primeiro) {
      var lista = fonte() || [];
      var achados = cfg.filtrar(lista, termo.value, campo.value);
      achados = achados.slice(0, limite);
      vivo.achados = achados;
      vivo.destaque = achados.length && primeiro !== false ? 0 : -1;
      abrir();
      if (!achados.length) {
        resultados.innerHTML = '<div class="sfx-vazio">Nenhum ' + escapar(cfg.rotulo) + '</div>';
        return achados;
      }
      resultados.innerHTML = achados.map(function (r, i) {
        var det = cfg.detalhe(r);
        return '<button type="button" class="sfx-item' + (i === vivo.destaque ? ' sfx-ativo' : '') + '" data-i="' + i + '" data-id="' + escapar(idDe(r)) + '">' +
          '<span class="sfx-titulo">' + escapar(cfg.titulo(r)) + '</span>' +
          (det ? '<span class="sfx-detalhe">' + escapar(det) + '</span>' : '') +
          '</button>';
      }).join('');
      return achados;
    }

    function pintarDestaque() {
      resultados.querySelectorAll('[data-i]').forEach(function (b) {
        b.classList.toggle('sfx-ativo', Number(b.getAttribute('data-i')) === vivo.destaque);
      });
    }

    function escolher(indice) {
      var r = vivo.achados[indice];
      if (!r) return null;
      vivo.escolhido = r;
      termo.value = cfg.escolher(r);        // a caixa passa a mostrar o nome escolhido
      fechar();
      aoEscolher(r);
      return r;
    }

    function mover(passo) {
      if (!vivo.achados.length) return;
      var n = vivo.achados.length;
      vivo.destaque = (vivo.destaque + passo + n) % n;
      pintarDestaque();
      var el = resultados.querySelector('[data-i="' + vivo.destaque + '"]');
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }

    termo.addEventListener('input', function () { if (o.aoDigitar !== false) procurar(); else fechar(); });
    termo.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); if (vivo.destaque < 0) procurar(); else escolher(vivo.destaque); return; }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); if (resultados.classList.contains('sfx-escondido')) procurar(); else mover(1); return; }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); mover(-1); return; }
      if (ev.key === 'Escape') { fechar(); return; }
    });
    campo.addEventListener('change', function () { if (termo.value.trim()) procurar(); });
    caixa.querySelector('[data-lupa]').addEventListener('click', function () { procurar(); termo.focus(); });
    resultados.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-i]') : null;
      if (b) escolher(Number(b.getAttribute('data-i')));
    });
    resultados.addEventListener('mousedown', function (ev) { ev.preventDefault(); });   // não tira o foco do campo

    return {
      versao: VERSAO,
      tipo: o.tipo,
      elemento: caixa,
      campo: campo,
      termo: termo,
      resultados: resultados,
      procurar: procurar,
      escolher: escolher,
      escolhido: function () { return vivo.escolhido; },
      achados: function () { return vivo.achados.slice(); },
      limpar: function () { termo.value = ''; vivo.escolhido = null; vivo.achados = []; fechar(); },
      focar: function () { termo.focus(); }
    };
  }

  raiz.DIGICOPY_SELECAO = { VERSAO_SELECAO: VERSAO, busca: busca, montar: montar, TIPOS: TIPOS, escapar: escapar };
})(typeof window !== 'undefined' ? window : globalThis);
