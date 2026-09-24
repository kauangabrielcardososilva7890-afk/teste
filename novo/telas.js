/* ═══════════════════════════════════════════════════════════════════════════
 * DIGICOPY — TELAS (v1.1.0) — as telas de cadastro do sistema novo
 *
 * O que é: a parte que a pessoa vê e clica. Não guarda dado, não fala com a
 * nuvem e não sabe o que é "lápide": ela pede ao NÚCLEO (novo/nucleo.js) e o
 * núcleo decide. É o contrário do sistema de hoje, onde cada remendo mexia no
 * dado por conta própria.
 *
 * NOVIDADE DA v1.1.0 (rodada 21 — "todos os menus"): a tela não tem mais a
 * lista de campos escrita dentro dela. Ela lê a FICHA de cada tela em
 * `novo/listas.js` (o mesmo nome de campo do sistema de hoje, com a origem
 * anotada). Assim, uma tela só (esta) atende Clientes, Produtos, Recargas,
 * Máquinas, Contratos, Parque, Leituras, Chamados, Orçamentos, Usuários,
 * Técnicos, Empresas, Auditoria e Catálogo fiscal — e as abas de cada tela são
 * as listas do MENU a que ela pertence.
 *
 * REGRAS QUE ESTAS TELAS CUMPREM:
 *   - nunca `alert`/`confirm`/`prompt` nativos: o modal é o do sistema;
 *   - excluir SEMPRE pede confirmação e um motivo (que vai para a lápide);
 *   - busca é por Enter ou pela lupa (não remonta a lista a cada tecla);
 *   - mostrar os excluídos é ação explícita ("🕳️ Lixeira") e trazer de volta
 *     também ("♻️ Restaurar") — nada volta sozinho;
 *   - lista que é histórico (Auditoria) ou tabela de apoio (NCM/CEST/CFOP) é
 *     SOMENTE LEITURA: aparece, busca e mostra, mas não deixa inventar registro;
 *   - campo obrigatório é cobrado pelo núcleo (o modal mostra o motivo e o que
 *     já foi digitado NÃO se perde).
 * ═══════════════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var NUC = raiz.DIGICOPY_NUCLEO;
  var CAT = raiz.DIGICOPY_LISTAS || null;

  function escapar(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function texto(v) { return v == null ? '' : String(v); }

  // ── AS LISTAS DE TRABALHO ────────────────────────────────────────────────
  // Vêm da ficha (novo/listas.js). Se a ficha não estiver carregada, a tela
  // continua de pé com as duas de antes — a página nunca quebra por falta dela.
  var LISTAS = (CAT && CAT.LISTAS) ? CAT.LISTAS : {
    clientes: {
      grupo: 'cadastros', rotulo: 'Clientes', codigoSerie: 'cliente',
      colunas: [{ campo: 'codigo', titulo: 'Código' }, { campo: 'nome', titulo: 'Nome' }, { campo: 'telefone', titulo: 'Telefone' }, { campo: 'cidade', titulo: 'Cidade' }],
      campos: [
        { campo: 'codigo', rotulo: 'Código (automático)', somenteLeitura: true },
        { campo: 'nome', rotulo: 'Nome', obrigatorio: true },
        { campo: 'telefone', rotulo: 'Telefone' },
        { campo: 'cidade', rotulo: 'Cidade' }
      ],
      schema: { codigo: { tipo: 'texto' }, nome: { obrigatorio: true, tipo: 'texto' }, telefone: { tipo: 'texto' }, cidade: { tipo: 'texto' } }
    },
    produtos: {
      grupo: 'cadastros', rotulo: 'Produtos',
      colunas: [{ campo: 'nome', titulo: 'Nome' }, { campo: 'preco', titulo: 'Preço', moeda: true }, { campo: 'categoria', titulo: 'Categoria' }],
      campos: [
        { campo: 'nome', rotulo: 'Nome', obrigatorio: true },
        { campo: 'preco', rotulo: 'Preço', tipo: 'numero' },
        { campo: 'categoria', rotulo: 'Categoria' }
      ],
      schema: { nome: { obrigatorio: true, tipo: 'texto' }, preco: { tipo: 'numero' }, categoria: { tipo: 'texto' } }
    }
  };

  // ── A BUSCA INTELIGENTE (o campo "onde buscar" que ele usa no sistema de hoje) ──
  // A regra mora em `novo/selecao.js` — a mesma do CLI_PURE/FILTROS_BUSCA_PURE de hoje,
  // provada caso a caso no `test_selecao.js`. Se a peça não estiver carregada, a tela
  // continua funcionando com a busca simples de antes (nunca quebra por causa disso).
  var SEL = raiz.DIGICOPY_SELECAO || null;
  function camposDaLista(nome) {
    var L = LISTAS[nome];
    // 1º) a regra afinada do sistema de hoje (clientes/produtos)
    if (SEL) {
      if (nome === 'clientes') return SEL.busca.CAMPOS_CLIENTE;
      if (nome === 'produtos') {
        return [['', 'Todas categorias']].concat(SEL.busca.CATS_PRODUTO.map(function (c) { return [c, c]; }));
      }
    }
    // 2º) qualquer outra lista: o "onde buscar" sai dos próprios campos da ficha
    if (!L) return null;
    var temCliente = L.campos.some(function (c) { return c.campo === 'clienteId'; });
    var lista = [['todos', temCliente ? 'Todos os clientes' : 'Buscar em tudo']];
    L.campos.forEach(function (c) {
      if (/^(clienteId|contratoId|equipamentoId|parqueId|tecnico)$/.test(c.campo)) return;
      lista.push([c.campo, c.rotulo]);
    });
    return lista.length > 1 ? lista : null;
  }
  function campoInicialDaLista(nome) {
    if (nome === 'produtos') return '';
    var c = camposDaLista(nome);
    if (!c || !c.length) return 'todos';
    return c[0][0];
  }
  function filtraPelaRegra(nome, registros, termo, campo) {
    if (!SEL) return null;
    if (nome === 'clientes') return SEL.busca.filtraClientes(registros, termo, campo);
    if (nome === 'produtos') return SEL.busca.filtraProdutos(registros, termo, campo);
    return null;
  }

  // ── O MODAL DO SISTEMA (substitui prompt/confirm/alert, que são proibidos) ──
  function abrirModal(dono, opcoes) {
    var o = opcoes || {};
    var overlay = dono.createElement('div');
    overlay.className = 'nfx-mask';
    overlay.setAttribute('data-modal', o.tipo || 'form');
    overlay.innerHTML =
      '<div class="nfx-caixa' + (o.larga ? ' nfx-caixa-larga' : '') + '" role="dialog" aria-modal="true">' +
        '<div class="nfx-titulo">' + escapar(o.titulo || '') + '</div>' +
        '<div class="nfx-corpo">' + (o.html || '') + '</div>' +
        '<div class="nfx-erro" data-erro hidden></div>' +
        '<div class="nfx-botoes">' +
          '<button type="button" data-modal-cancelar class="nfx-btn nfx-btn-fraco">' + escapar(o.textoCancelar || 'Cancelar') + '</button>' +
          '<button type="button" data-modal-ok class="nfx-btn nfx-btn-forte">' + escapar(o.textoOk || 'Salvar') + '</button>' +
        '</div>' +
      '</div>';
    dono.body.appendChild(overlay);

    // campo desabilitado (ex.: o Código automático) não recebe foco — o dedo vai no primeiro
    // campo de digitar de verdade
    var primeiro = overlay.querySelector('input:not([disabled]),select,textarea');
    if (primeiro) primeiro.focus();

    function fechar() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    function mostrarErro(msg) {
      var area = overlay.querySelector('[data-erro]');
      area.textContent = msg;
      area.hidden = false;
    }
    overlay.querySelector('[data-modal-cancelar]').addEventListener('click', fechar);
    overlay.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') fechar();
    });
    overlay.querySelector('[data-modal-ok]').addEventListener('click', function () {
      var valores = {};
      overlay.querySelectorAll('[data-campo]').forEach(function (campo) {
        valores[campo.getAttribute('data-campo')] = campo.value;
      });
      var r = o.aoConfirmar ? o.aoConfirmar(valores) : { ok: true };
      if (r && r.ok) { fechar(); if (r.depois) r.depois(); return; }
      mostrarErro((r && r.erros && r.erros.join(' · ')) || 'não deu para salvar');
    });
    return { fechar: fechar, mostrarErro: mostrarErro };
  }

  // ── COMO CADA VALOR APARECE NA TABELA ────────────────────────────────────
  function moedaBR(v) { return (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function numeroBR(v) { return (Number(v) || 0).toLocaleString('pt-BR'); }
  function dataBR(v) {
    var t = texto(v); if (!t) return '';
    var d = new Date(t); if (isNaN(d.getTime())) return t;
    return d.toLocaleDateString('pt-BR');
  }
  function dataHoraBR(v) {
    var t = texto(v); if (!t) return '';
    var d = new Date(t); if (isNaN(d.getTime())) return t;
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR').slice(0, 5);
  }
  function nomeDe(lista, id, campo, achar) {
    if (!id || !achar) return '';
    var r = achar(lista, id);
    return r ? texto(r[campo]) : '';
  }
  function celula(coluna, registro, achar) {
    var c = coluna || {}, v = registro[c.campo];
    // colunas "de vitrine": quando a ficha não guarda o nome, a tela mostra o
    // nome do registro ligado (é o que a tela de hoje faz com cliente/máquina)
    if (c.composto === 'cliente') v = texto(registro.clienteNome) || nomeDe('clientes', registro.clienteId, 'nome', achar);
    else if (c.composto === 'equipamento') v = texto(registro.equipamentoModelo) || equipamentoDe(registro, achar);
    else if (c.composto === 'tecnico') v = texto(registro.tecnicoNome) || nomeDe('tecnicos', registro.tecnico, 'nome', achar);
    if (c.moeda) return moedaBR(v);
    if (c.dataCurta) return dataHoraBR(v);
    if (v === true) return 'Sim';
    if (v === false) return 'Não';
    return texto(v);
  }

  function equipamentoDe(registro, achar) {
    var id = registro.equipamentoId;
    if (!id && registro.parqueId) {
      var p = achar ? achar('parque', registro.parqueId) : null;
      id = p && p.equipamentoId;
    }
    var eq = id && achar ? achar('equipamentos', id) : null;
    return eq ? texto(eq.modelo) + (eq.patrimonio ? ' • ' + eq.patrimonio : '') : '';
  }

  // O QUE FOI DIGITADO VIRA NÚMERO — sem perder a vírgula nem confundir milhar:
  //   '120,50'   -> 120.5     (vírgula é decimal, o ponto é milhar)
  //   '1.234,56' -> 1234.56
  //   '1234.56'  -> 1234.56   (ponto com 1 ou 2 casas é decimal)
  //   '1.234'    -> 1234      (ponto com 3 casas e sem vírgula é milhar)
  //   vazio      -> undefined (não grava zero em cima de quem não digitou nada)
  function numeroDoDigitado(v) {
    var t = texto(v).trim();
    if (!t) return undefined;
    var limpo = t;
    if (t.indexOf(',') >= 0) limpo = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) limpo = t.replace(/\./g, '');
    var n = Number(limpo);
    return isFinite(n) ? n : 0;
  }

  // por qual campo a lista se ordena: o nome quando existe (é como o dono lê as
  // listas), senão o primeiro campo que aparece na tabela
  function campoDeOrdemDe(nome) {
    var L = LISTAS[nome] || {};
    if (L.ordenarPor) return L.ordenarPor;
    var temNome = (L.campos || []).some(function (c) { return c.campo === 'nome'; });
    if (temNome) return 'nome';
    return ((L.colunas || [])[0] || {}).campo || null;
  }

  function criarTelas(opcoes) {
    var o = opcoes || {};
    var nucleo = o.nucleo;
    var dono = o.documento || raiz.document;
    var alvo = o.elemento;
    if (!nucleo) throw new Error('telas: informe o núcleo');
    if (!alvo) throw new Error('telas: informe onde desenhar');

    Object.keys(LISTAS).forEach(function (nome) { nucleo.registrarLista(nome, LISTAS[nome].schema); });

    // ── QUAIS ABAS ESTA TELA TEM ──
    // A tela pertence a um MENU (grupo) e mostra, em abas, as listas do menu —
    // é o mesmo desenho do sistema de hoje (módulo → abas dentro do módulo).
    function listasDoGrupo(grupo) {
      return Object.keys(LISTAS).filter(function (n) { return (LISTAS[n].grupo || 'cadastros') === grupo; });
    }
    var grupo = o.grupo || (LISTAS[o.lista] && LISTAS[o.lista].grupo) || 'cadastros';
    var abas = listasDoGrupo(grupo);
    if (!abas.length) { abas = ['clientes']; grupo = 'cadastros'; }
    var listaInicial = (o.lista && LISTAS[o.lista]) ? o.lista : abas[0];

    var estado = { lista: listaInicial, busca: '', mostrando: 'vivos', campo: campoInicialDaLista(listaInicial) };
    var linha = 'Nada aqui ainda. Use ➕ Novo para cadastrar.';

    function ficha() { return LISTAS[estado.lista] || { colunas: [], campos: [], schema: {} }; }
    function somenteLeitura() { return !!ficha().somenteLeitura; }

    // quem o formulário consulta para mostrar nome de cliente, máquina etc.
    function achar(lista, id) { try { return nucleo.obter(lista, id); } catch (e) { return null; } }
    function campoDeOrdem() { return campoDeOrdemDe(estado.lista); }

    function registros() {
      var todos = nucleo.listar(estado.lista, estado.mostrando === 'apagados'
        ? { somenteApagados: true }
        : { ordenarPor: campoDeOrdem() });
      var b = estado.busca.trim();
      if (!b) return todos;
      if (estado.mostrando !== 'apagados') {
        var pelaRegra = filtraPelaRegra(estado.lista, todos, b, estado.campo);
        if (pelaRegra) return pelaRegra;
      }
      var low = b.toLowerCase();
      var campos = (ficha().campos || []).map(function (c) { return c.campo; });
      return todos.filter(function (r) {
        var alvo = estado.campo && !/^(todos|)$/.test(estado.campo) ? [estado.campo] : campos;
        return alvo.some(function (campo) { return texto(r[campo]).toLowerCase().indexOf(low) >= 0; });
      });
    }

    function corpoTabela() {
      var L = ficha();
      var linhas = registros();
      if (!linhas.length) return '<tr><td colspan="' + (L.colunas.length + 1) + '" class="nfx-vazio">' + linha + '</td></tr>';
      return linhas.map(function (r) {
        var cels = L.colunas.map(function (c) { return '<td>' + escapar(celula(c, r, achar)) + '</td>'; }).join('');
        var acoes = somenteLeitura() ? '<span class="nfx-vazio-inline">só consulta</span>'
          : (estado.mostrando === 'apagados'
            ? '<button type="button" class="nfx-mini" data-acao="restaurar" data-id="' + escapar(r.id) + '">♻️ Restaurar</button>'
            : '<button type="button" class="nfx-mini" data-acao="editar" data-id="' + escapar(r.id) + '">✏️</button> ' +
              '<button type="button" class="nfx-mini nfx-perigo" data-acao="excluir" data-id="' + escapar(r.id) + '">🗑️</button>');
        return '<tr data-linha="' + escapar(r.id) + '">' + cels + '<td class="nfx-acoes">' + acoes + '</td></tr>';
      }).join('');
    }

    function desenhar() {
      var resumo = nucleo.resumo();
      var info = resumo.listas[estado.lista] || { vivos: 0, apagados: 0 };
      var botoesAba = abas.map(function (nome) {
        return '<button type="button" class="nfx-aba' + (nome === estado.lista ? ' nfx-aba-ativa' : '') + '" data-aba="' + nome + '">' +
          escapar(LISTAS[nome].rotulo) + '</button>';
      }).join('');
      var colunas = ficha().colunas.map(function (c) { return '<th>' + escapar(c.titulo) + '</th>'; }).join('') + '<th></th>';

      var campos = camposDaLista(estado.lista);
      var rotuloCampo = '';
      var seletor = '';
      if (campos) {
        if (!campos.some(function (c) { return c[0] === estado.campo; })) estado.campo = campoInicialDaLista(estado.lista);
        campos.forEach(function (c) { if (c[0] === estado.campo) rotuloCampo = c[1]; });
        seletor = '<select data-campo-busca aria-label="Onde buscar">' +
          campos.map(function (c) { return '<option value="' + escapar(c[0]) + '">' + escapar(c[1]) + '</option>'; }).join('') +
          '</select>';
      }
      var dica = ficha().dica || ('Digite para buscar em ' + texto(ficha().rotulo).toLowerCase());
      alvo.innerHTML =
        '<div class="nfx-cabecalho">' +
          '<div class="nfx-abas">' + botoesAba + '</div>' +
          '<div class="nfx-bar">' +
            seletor +
            '<input type="search" data-busca placeholder="' + escapar(dica) + '" value="' + escapar(estado.busca) + '">' +
            '<button type="button" class="nfx-btn nfx-btn-fraco" data-acao="buscar">🔍</button>' +
            (somenteLeitura() ? '' : '<button type="button" class="nfx-btn nfx-btn-forte" data-acao="novo">➕ Novo</button>') +
            (somenteLeitura() ? '' :
              '<button type="button" class="nfx-btn nfx-btn-fraco" data-acao="alternar-lixeira">' +
                (estado.mostrando === 'apagados' ? '↩️ Voltar' : '🕳️ Lixeira (' + info.apagados + ')') +
              '</button>') +
          '</div>' +
        '</div>' +
        (ficha().nota ? '<p class="nfx-nota">' + escapar(ficha().nota) + '</p>' : '') +
        '<table class="nfx-tabela"><thead><tr>' + colunas + '</tr></thead><tbody data-corpo>' + corpoTabela() + '</tbody></table>' +
        '<div class="nfx-rodape" data-rodape>' +
          '<span>' + info.vivos + ' ' + escapar(texto(ficha().rotulo).toLowerCase()) +
          (estado.busca ? ' · filtrado por "' + escapar(estado.busca) + '"' + (rotuloCampo ? ' em ' + escapar(rotuloCampo) : '') : '') +
          (estado.mostrando === 'apagados' ? ' · mostrando os EXCLUÍDOS' : '') +
          (somenteLeitura() ? ' · só consulta' : '') +
          '</span>' +
          '<span>' + (resumo.mudancasPendentes || 0) + ' mudança(s) na fila da nuvem</span>' +
        '</div>';

      alvo.querySelectorAll('[data-aba]').forEach(function (b) {
        b.addEventListener('click', function () {
          estado.lista = b.getAttribute('data-aba');
          estado.busca = ''; estado.mostrando = 'vivos';
          estado.campo = campoInicialDaLista(estado.lista);
          linha = 'Nada aqui ainda.' + (somenteLeitura() ? ' Esta lista é só consulta.' : ' Use ➕ Novo para cadastrar.');
          desenhar();
        });
      });
      var campoBusca = alvo.querySelector('[data-busca]');
      campoBusca.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { estado.busca = campoBusca.value; desenhar(); }
      });
      var campoOnde = alvo.querySelector('[data-campo-busca]');
      if (campoOnde) {
        campoOnde.value = estado.campo;
        campoOnde.addEventListener('change', function () {
          estado.campo = campoOnde.value;
          if (estado.busca.trim()) desenhar();   // trocar o campo refaz a busca na hora
        });
      }
      alvo.querySelectorAll('[data-acao]').forEach(function (b) {
        b.addEventListener('click', function () { agir(b.getAttribute('data-acao'), b.getAttribute('data-id')); });
      });
    }

    function agir(acao, id) {
      if (acao === 'buscar') { estado.busca = alvo.querySelector('[data-busca]').value; desenhar(); return; }
      if (acao === 'novo') return abrirFormulario(null);
      if (acao === 'editar') return abrirFormulario(nucleo.obter(estado.lista, id));
      if (acao === 'excluir') return pedirExclusao(id);
      if (acao === 'restaurar') return pedirRestauracao(id);
      if (acao === 'alternar-lixeira') { estado.mostrando = estado.mostrando === 'apagados' ? 'vivos' : 'apagados'; desenhar(); }
    }

    // ── O CAMPO NA TELA (cada tipo de campo pede um desenho) ──
    function campoDoFormulario(c, registro, proximoCodigo) {
      var valor = registro ? registro[c.campo] : (c.somenteLeitura ? proximoCodigo : '');
      if (valor === undefined || valor === null) valor = '';
      var rotulo = '<span>' + escapar(c.rotulo) + (c.obrigatorio ? ' *' : '') + '</span>';
      var classe = c.largo ? ' nfx-campo-largo' : '';
      var atributo = ' data-campo="' + escapar(c.campo) + '"' + (c.somenteLeitura ? ' disabled' : '');

      if (c.opcoes && c.opcoes.length) {
        var ops = ['<option value="">—</option>'].concat(c.opcoes.map(function (v) {
          return '<option value="' + escapar(v) + '"' + (texto(valor) === texto(v) ? ' selected' : '') + '>' + escapar(v) + '</option>';
        })).join('');
        return '<label class="nfx-campo' + classe + '">' + rotulo + '<select' + atributo + '>' + ops + '</select></label>';
      }
      if (c.opcoesDe) {
        var origem = nucleo.listar(c.opcoesDe, { ordenarPor: campoDeOrdemDe(c.opcoesDe) }) || [];
        var ops2 = ['<option value="">—</option>'].concat(origem.map(function (r) {
          var nome = r.nome || r.numero || r.modelo || r.descricao || r.id;
          return '<option value="' + escapar(r.id) + '"' + (texto(valor) === texto(r.id) ? ' selected' : '') + '>' + escapar(nome) + '</option>';
        })).join('');
        return '<label class="nfx-campo' + classe + '">' + rotulo + '<select' + atributo + '>' + ops2 + '</select></label>';
      }
      if (c.tipo === 'boleano') {
        var sim = valor === true || valor === 'true' || valor === 1 || valor === '1' || valor === 'sim';
        return '<label class="nfx-campo' + classe + '">' + rotulo + '<select' + atributo + '>' +
          '<option value="">—</option>' +
          '<option value="sim"' + (sim ? ' selected' : '') + '>Sim</option>' +
          '<option value="nao"' + (!sim && texto(valor) !== '' ? ' selected' : '') + '>Não</option>' +
          '</select></label>';
      }
      // Campo de número é de DIGITAR (não `type=number`): o dono escreve 120,50 com
      // vírgula, como sempre escreveu. Quem transforma em número é a hora de salvar.
      var tipoHtml = c.tipo === 'numero' ? 'text" inputmode="decimal' : (c.tipo === 'data' ? 'date' : (c.tipo === 'datahora' ? 'datetime-local' : 'text'));
      var valorMostrado = valor;
      if (c.tipo === 'numero' && valorMostrado !== '') valorMostrado = texto(valorMostrado).replace('.', ',');
      if (c.tipo === 'data' || c.tipo === 'datahora') valorMostrado = texto(valor).slice(0, c.tipo === 'data' ? 10 : 16);
      return '<label class="nfx-campo' + classe + '">' + rotulo +
        '<input type="' + tipoHtml + '" value="' + escapar(valorMostrado) + '"' + atributo + '></label>';
    }

    function abrirFormulario(registro) {
      var L = ficha();
      // o próximo código é só MOSTRADO (a leitura não gasta número; quem gasta é o Salvar)
      var proximoCodigo = '';
      if (!registro && L.codigoSerie) {
        proximoCodigo = nucleo.proximoNumeroDaSerie(L.codigoSerie, nucleo.listar(estado.lista),
          function (c) { return c && c.codigo; }).numero;
      }
      var html = '<div class="nfx-grade">' + L.campos.map(function (c) { return campoDoFormulario(c, registro, proximoCodigo); }).join('') + '</div>';
      abrirModal(dono, {
        tipo: 'formulario',
        larga: true,
        titulo: (registro ? 'Editar ' : 'Novo ') + (L.singular || texto(L.rotulo).slice(0, -1).toLowerCase()),
        html: html,
        textoOk: 'Salvar',
        aoConfirmar: function (valores) {
          var dados = { id: registro ? registro.id : undefined };
          L.campos.forEach(function (c) {
            if (c.somenteLeitura) return;   // o código é dado pelo núcleo, não pelo formulário
            var v = valores[c.campo];
            if (c.tipo === 'numero') {
              // aceita os dois jeitos de digitar: 1.234,56 (como se escreve aqui) e 1234.56
              dados[c.campo] = numeroDoDigitado(v);
            }
            else if (c.tipo === 'boleano') dados[c.campo] = texto(v) === 'sim';
            else dados[c.campo] = texto(v).trim();
          });
          // cadastro novo: o código sai da série (nunca repete um código apagado)
          if (!registro && L.codigoSerie) {
            var codigo = nucleo.proximoNumero(L.codigoSerie, nucleo.listar(estado.lista), function (c) { return c && c.codigo; });
            if (codigo) dados.codigo = codigo;
          }
          // o que a ficha manda fazer ANTES de gravar (número próprio, nome do
          // cliente, a conta da leitura…) — é o único lugar com regra de negócio
          if (typeof L.preparar === 'function') {
            var ctx = {
              achar: function (lista, id) { return id ? achar(lista, id) : null; },
              listar: function (lista, o2) { try { return nucleo.listar(lista, o2); } catch (e) { return []; } },
              obter: function (lista, id) { return achar(lista, id); },
              proximoNumero: function (serie, campo) {
                var numero = nucleo.proximoNumero(serie, nucleo.listar(estado.lista), function (r) { return r && r[campo]; });
                return numero == null ? '' : numero;
              },
              salvar: function (lista, item) {
                try { return nucleo.salvar(lista, Object.assign({}, item)); } catch (e) { return { ok: false, erros: [(e && e.message) || 'falha ao salvar ' + lista] }; }
              }
            };
            dados = L.preparar(dados, ctx) || dados;
          }
          var r = nucleo.salvar(estado.lista, dados);
          if (!r.ok) return { ok: false, erros: r.erros };
          desenhar();
          return { ok: true };
        }
      });
    }

    function pedirExclusao(id) {
      var r = nucleo.obter(estado.lista, id);
      if (!r) return;
      var nome = r.nome || r.numero || r.modelo || r.descricao || r.id;
      abrirModal(dono, {
        tipo: 'confirmacao',
        titulo: 'Excluir este registro?',
        html: '<p class="nfx-aviso">Vai para a lixeira (dá para trazer de volta depois). ' +
              'O nome é <b>' + escapar(nome) + '</b>.</p>' +
              '<label class="nfx-campo"><span>Motivo (fica registrado)</span><input data-campo="motivo" value=""></label>',
        textoOk: 'Excluir',
        aoConfirmar: function (valores) {
          var res = nucleo.apagar(estado.lista, id, texto(valores.motivo).trim() || 'excluído pela tela');
          if (!res.ok) return { ok: false, erros: res.erros };
          desenhar();
          return { ok: true };
        }
      });
    }

    function pedirRestauracao(id) {
      var r = nucleo.obter(estado.lista, id);
      if (!r) return;
      var nome = r.nome || r.numero || r.modelo || r.descricao || r.id;
      abrirModal(dono, {
        tipo: 'confirmacao',
        titulo: 'Trazer de volta?',
        html: '<p class="nfx-aviso"><b>' + escapar(nome) + '</b> volta para a lista.</p>',
        textoOk: 'Trazer de volta',
        aoConfirmar: function () {
          var res = nucleo.restaurar(estado.lista, id);
          if (!res.ok) return { ok: false, erros: res.erros };
          estado.mostrando = 'vivos';   // voltou para a lista: mostra a lista de verdade
          desenhar();
          return { ok: true };
        }
      });
    }

    desenhar();
    return {
      desenhar: desenhar, estado: estado, registros: registros, agir: agir, abas: abas,
      ficha: ficha, abrirFormulario: abrirFormulario, pedirExclusao: pedirExclusao, pedirRestauracao: pedirRestauracao
    };
  }

  // ── TELA QUE AINDA DEPENDE DE MOTOR NÃO MIGRADO ──────────────────────────
  // Em vez de tela vazia (ou pior, um botão que finge), ela diz o motivo com
  // todas as letras — foi o combinado com o dono na virada por partes.
  function htmlDependencia(tela) {
    var t = tela || {};
    // "onde ela fica hoje": o dono sabe procurar pelo MENU, não pelo nome da tela antiga
    var onde = '';
    if (CAT) {
      var grupo = (CAT.GRUPOS || []).filter(function (g) { return g.id === t.grupo; })[0];
      if (grupo) onde = '<p class="nfx-depende-onde">No sistema de hoje ela fica em: <b>' + escapar(grupo.rotulo) + '</b> → ' + escapar(t.rotulo || '') + '.</p>';
    }
    return '<div class="nfx-depende">' +
      '<div class="nfx-depende-titulo">' + escapar(t.rotulo || '') + '</div>' +
      '<p class="nfx-depende-sub">Esta tela ainda roda no sistema de hoje — de propósito.</p>' +
      '<p class="nfx-depende-motivo">' + escapar(t.motivo || '') + '</p>' +
      onde +
      '<p class="nfx-depende-pe">Enquanto isso, ela continua funcionando no sistema de hoje, inteira.</p>' +
      '</div>';
  }

  raiz.DIGICOPY_TELAS = {
    VERSAO_TELAS: '1.1.0', LISTAS: LISTAS, criarTelas: criarTelas, abrirModal: abrirModal,
    escapar: escapar, htmlDependencia: htmlDependencia, camposDaLista: camposDaLista
  };
})(typeof window !== 'undefined' ? window : globalThis);
