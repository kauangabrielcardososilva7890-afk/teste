/* ═══════════════════════════════════════════════════════════════════════════
 * DIGICOPY — TELAS (v1.0.0) — as primeiras telas do sistema novo
 *
 * O que é: a parte que a pessoa vê e clica. Não guarda dado, não fala com a
 * nuvem, não sabe o que é "lápide": ela pede ao NÚCLEO (novo/nucleo.js) e o
 * núcleo decide. É o contrário do sistema de hoje, onde cada remendo mexia no
 * dado por conta própria.
 *
 * REGRAS QUE ESTAS TELAS JÁ CUMPREM:
 *   - nunca `alert`/`confirm`/`prompt` nativos: o modal é o do sistema
 *     (aqui, `abrirModal`), com botão cancelar e foco no primeiro campo;
 *   - excluir SEMPRE pede confirmação e um motivo (que vai para a lápide);
 *   - busca é por Enter ou pela lupa (não remonta a lista a cada tecla);
 *   - mostrar os excluídos é uma ação explícita ("🕳️ Lixeira"), e trazer de
 *     volta também ("♻️ Restaurar") — nada volta sozinho.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var NUC = raiz.DIGICOPY_NUCLEO;

  function escapar(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function texto(v) { return v == null ? '' : String(v); }

  // ── O MODAL DO SISTEMA (substitui prompt/confirm/alert, que são proibidos) ──
  function abrirModal(dono, opcoes) {
    var o = opcoes || {};
    var overlay = dono.createElement('div');
    overlay.className = 'nfx-mask';
    overlay.setAttribute('data-modal', o.tipo || 'form');
    overlay.innerHTML =
      '<div class="nfx-caixa" role="dialog" aria-modal="true">' +
        '<div class="nfx-titulo">' + escapar(o.titulo || '') + '</div>' +
        '<div class="nfx-corpo">' + (o.html || '') + '</div>' +
        '<div class="nfx-erro" data-erro hidden></div>' +
        '<div class="nfx-botoes">' +
          '<button type="button" data-modal-cancelar class="nfx-btn nfx-btn-fraco">' + escapar(o.textoCancelar || 'Cancelar') + '</button>' +
          '<button type="button" data-modal-ok class="nfx-btn nfx-btn-forte">' + escapar(o.textoOk || 'Salvar') + '</button>' +
        '</div>' +
      '</div>';
    dono.body.appendChild(overlay);

    var primeiro = overlay.querySelector('input,select,textarea');
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

  // ── AS LISTAS DE TRABALHO (o que a tela mostra e quais campos ela usa) ──
  var LISTAS = {
    clientes: {
      rotulo: 'Clientes',
      colunas: [{ campo: 'nome', titulo: 'Nome' }, { campo: 'fone', titulo: 'Fone' }, { campo: 'cidade', titulo: 'Cidade' }],
      campos: [
        { campo: 'nome', rotulo: 'Nome', obrigatorio: true },
        { campo: 'fone', rotulo: 'Fone' },
        { campo: 'cidade', rotulo: 'Cidade' }
      ],
      schema: { nome: { obrigatorio: true, tipo: 'texto' }, fone: { tipo: 'texto' }, cidade: { tipo: 'texto' } }
    },
    produtos: {
      rotulo: 'Produtos',
      colunas: [{ campo: 'nome', titulo: 'Nome' }, { campo: 'preco', titulo: 'Preço' }, { campo: 'categoria', titulo: 'Categoria' }],
      campos: [
        { campo: 'nome', rotulo: 'Nome', obrigatorio: true },
        { campo: 'preco', rotulo: 'Preço' },
        { campo: 'categoria', rotulo: 'Categoria' }
      ],
      schema: { nome: { obrigatorio: true, tipo: 'texto' }, preco: { tipo: 'numero' }, categoria: { tipo: 'texto' } }
    }
  };

  function criarTelas(opcoes) {
    var o = opcoes || {};
    var nucleo = o.nucleo;
    var dono = o.documento || raiz.document;
    var alvo = o.elemento;
    if (!nucleo) throw new Error('telas: informe o núcleo');
    if (!alvo) throw new Error('telas: informe onde desenhar');

    Object.keys(LISTAS).forEach(function (nome) { nucleo.registrarLista(nome, LISTAS[nome].schema); });

    var estado = { lista: 'clientes', busca: '', mostrando: 'vivos' };
    var linha = "Nada aqui ainda. Use ➕ Novo para cadastrar.";

    function registros() {
      var todos = nucleo.listar(estado.lista, estado.mostrando === 'apagados'
        ? { somenteApagados: true }
        : { ordenarPor: 'nome' });
      var b = estado.busca.trim().toLowerCase();
      if (!b) return todos;
      return todos.filter(function (r) {
        return LISTAS[estado.lista].colunas.some(function (c) {
          return texto(r[c.campo]).toLowerCase().indexOf(b) >= 0;
        });
      });
    }

    function corpoTabela() {
      var lista = LISTAS[estado.lista];
      var linhas = registros();
      if (!linhas.length) return '<tr><td colspan="' + (lista.colunas.length + 1) + '" class="nfx-vazio">' + linha + '</td></tr>';
      return linhas.map(function (r) {
        var cels = lista.colunas.map(function (c) {
          var v = r[c.campo];
          if (c.campo === 'preco') v = (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
          return '<td>' + escapar(v) + '</td>';
        }).join('');
        var acoes = estado.mostrando === 'apagados'
          ? '<button type="button" class="nfx-mini" data-acao="restaurar" data-id="' + escapar(r.id) + '">♻️ Restaurar</button>'
          : '<button type="button" class="nfx-mini" data-acao="editar" data-id="' + escapar(r.id) + '">✏️</button> ' +
            '<button type="button" class="nfx-mini nfx-perigo" data-acao="excluir" data-id="' + escapar(r.id) + '">🗑️</button>';
        return '<tr data-linha="' + escapar(r.id) + '">' + cels + '<td class="nfx-acoes">' + acoes + '</td></tr>';
      }).join('');
    }

    function desenhar() {
      var resumo = nucleo.resumo();
      var info = resumo.listas[estado.lista] || { vivos: 0, apagados: 0 };
      var abas = Object.keys(LISTAS).map(function (nome) {
        return '<button type="button" class="nfx-aba' + (nome === estado.lista ? ' nfx-aba-ativa' : '') + '" data-aba="' + nome + '">' + escapar(LISTAS[nome].rotulo) + '</button>';
      }).join('');
      var colunas = LISTAS[estado.lista].colunas.map(function (c) { return '<th>' + escapar(c.titulo) + '</th>'; }).join('') + '<th></th>';

      alvo.innerHTML =
        '<div class="nfx-cabecalho">' +
          '<div class="nfx-abas">' + abas + '</div>' +
          '<div class="nfx-bar">' +
            '<input type="search" data-busca placeholder="Buscar (Enter ou 🔍)" value="' + escapar(estado.busca) + '">' +
            '<button type="button" class="nfx-btn nfx-btn-fraco" data-acao="buscar">🔍</button>' +
            '<button type="button" class="nfx-btn nfx-btn-forte" data-acao="novo">➕ Novo</button>' +
            '<button type="button" class="nfx-btn nfx-btn-fraco" data-acao="alternar-lixeira">' +
              (estado.mostrando === 'apagados' ? '↩️ Voltar' : '🕳️ Lixeira (' + info.apagados + ')') +
            '</button>' +
          '</div>' +
        '</div>' +
        '<table class="nfx-tabela"><thead><tr>' + colunas + '</tr></thead><tbody data-corpo>' + corpoTabela() + '</tbody></table>' +
        '<div class="nfx-rodape" data-rodape>' +
          '<span>' + info.vivos + ' ' + escapar(LISTAS[estado.lista].rotulo.toLowerCase()) +
          (estado.busca ? ' · filtrado por "' + escapar(estado.busca) + '"' : '') +
          (estado.mostrando === 'apagados' ? ' · mostrando os EXCLUÍDOS' : '') + '</span>' +
          '<span>' + (resumo.mudancasPendentes || 0) + ' mudança(s) na fila da nuvem</span>' +
        '</div>';

      alvo.querySelectorAll('[data-aba]').forEach(function (b) {
        b.addEventListener('click', function () { estado.lista = b.getAttribute('data-aba'); estado.busca = ''; estado.mostrando = 'vivos'; desenhar(); });
      });
      var campoBusca = alvo.querySelector('[data-busca]');
      campoBusca.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { estado.busca = campoBusca.value; desenhar(); }
      });
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

    function abrirFormulario(registro) {
      var lista = LISTAS[estado.lista];
      var html = lista.campos.map(function (c) {
        var valor = registro ? escapar(registro[c.campo]) : '';
        return '<label class="nfx-campo"><span>' + escapar(c.rotulo) + (c.obrigatorio ? ' *' : '') + '</span>' +
               '<input data-campo="' + c.campo + '" value="' + valor + '"></label>';
      }).join('');
      abrirModal(dono, {
        tipo: 'formulario',
        titulo: (registro ? 'Editar ' : 'Novo ') + lista.rotulo.slice(0, -1).toLowerCase(),
        html: html,
        textoOk: 'Salvar',
        aoConfirmar: function (valores) {
          var dados = { id: registro ? registro.id : undefined };
          lista.campos.forEach(function (c) {
            var v = valores[c.campo];
            if (c.campo === 'preco') { var n = Number(texto(v).replace(',', '.')); dados[c.campo] = isFinite(n) && texto(v).trim() ? n : undefined; }
            else dados[c.campo] = texto(v).trim();
          });
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
      abrirModal(dono, {
        tipo: 'confirmacao',
        titulo: 'Excluir este registro?',
        html: '<p class="nfx-aviso">Vai para a lixeira (dá para trazer de volta depois). ' +
              'O nome é <b>' + escapar(r.nome) + '</b>.</p>' +
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
      abrirModal(dono, {
        tipo: 'confirmacao',
        titulo: 'Trazer de volta?',
        html: '<p class="nfx-aviso"><b>' + escapar(r.nome) + '</b> volta para a lista.</p>',
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
    return { desenhar: desenhar, estado: estado, registros: registros, agir: agir, abrirFormulario: abrirFormulario, pedirExclusao: pedirExclusao, pedirRestauracao: pedirRestauracao };
  }

  raiz.DIGICOPY_TELAS = { LISTAS: LISTAS, criarTelas: criarTelas, abrirModal: abrirModal, escapar: escapar };
})(typeof window !== 'undefined' ? window : globalThis);
