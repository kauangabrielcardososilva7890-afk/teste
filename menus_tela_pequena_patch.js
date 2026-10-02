// ═══════════════════════════════════════════════════════════════════════════
// MENUS EM TELA PEQUENA (v5.22.67)
//
// Em monitores baixos os menus suspensos passavam da borda e a última opção
// ficava inalcançável. Agora, SÓ quando não cabe, o menu ganha rolagem e é
// puxado para dentro da tela. Se cabe, nada muda — nenhuma barra aparece.
//
// v5.22.68: a FAIXA AZUL de cima também. Quando os módulos não cabem na
// largura da tela, a faixa ganha rolagem lateral em vez de sumir na borda.
// Rolagem lateral cortaria os menus que descem, então, enquanto a faixa está
// rolando, o menu aberto é posicionado por cima de tudo.
//
// Vale para os menus da faixa azul (.module-menu), sugestões (.neo-suggest)
// e qualquer lista marcada com data-menu-flutuante.
//
// v5.22.69 (r66 — 'telas apertadas', adiamento que ele liberou): o mesmo
// cuidado agora vale para o MODAL. O corpo rola sozinho e o rodapé continua
// vivo embaixo, o modal largo respeita a janela e, em tela estreita, as grades
// de campos caem para 1 coluna. Em tela grande nada muda: as regras novas ficam
// dentro de media queries (só a rolagem do corpo vale sempre, e ela é invisível
// quando o conteúdo cabe).
//
// v5.22.70 (r70 — relatório 'conteúdo cortado ou encoberto', 14 telas no
// celular 390x844): o que estava vivo aqui.
//   · TABELA — sete telas (Clientes, Impressoras, Contratos, Leituras,
//     Chamados, Financeiro, Auditoria) têm mais colunas do que a largura do
//     aparelho. O contêiner cortava e o botão 'Editar' da última linha ficava
//     do lado de fora, sem jeito de alcançar. Agora: se a tabela é mais larga
//     que o bloco que a segura, o bloco ganha rolagem lateral e um bilhete
//     'arraste para o lado'. O bilhete some no primeiro empurrão e tudo é
//     desfeito quando passa a caber — em desktop nada é tocado.
//   · FAIXA DE MENUS — a rolagem já existava (v5.22.68), o que faltava era o
//     aviso: 'Locação' aparecia como 'Loca…' e nada dizia que a lista continua.
//   · MODAL — o limite era 96vw, mas a janela do modal tem 16px de respiro de
//     cada lado: em 390px sobrariam 358px e a caixa, mais larga que isso, era
//     centralizada e cortada nas DUAS bordas. O limite em celular passa a ser
//     100% do espaço disponível e o rodapé pode quebrar linha.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var FOLGA = 12;      // respiro até a borda da janela
  var MIN_ALTURA = 140; // abaixo disso rolar não adianta, é melhor deixar aberto

  // Cálculo puro: dado o retângulo do menu e o tamanho da janela, devolve o
  // que precisa mudar. `null` = cabe, não mexe em nada.
  function ajusteNecessario(rect, janela, folga, minAltura) {
    folga = folga == null ? FOLGA : folga;
    minAltura = minAltura == null ? MIN_ALTURA : minAltura;
    var out = { alturaMax: 0, deslocarX: 0, precisa: false };

    var sobraBaixo = janela.altura - rect.top - folga;
    if (rect.altura > sobraBaixo) {
      out.alturaMax = Math.max(minAltura, Math.round(sobraBaixo));
      out.precisa = true;
    }

    var passouDireita = rect.left + rect.largura - (janela.largura - folga);
    if (passouDireita > 0) {
      out.deslocarX = -Math.round(Math.min(passouDireita, Math.max(0, rect.left - folga)));
      out.precisa = true;
    }

    return out.precisa ? out : null;
  }

  // A faixa de módulos precisa rolar? (folga de 2px contra arredondamento)
  function precisaRolar(larguraConteudo, larguraVisivel) {
    return Number(larguraConteudo || 0) > Number(larguraVisivel || 0) + 2;
  }

  // ── r70: rolagem lateral para o que não cabe na largura ──────────────────
  // Medida real do conteúdo: scrollWidth ignora o corte do contêiner, e o
  // retângulo pega a largura que o navegador de fato usou. O maior dos dois.
  function larguraDe(el) {
    if (!el) return 0;
    var n = Number(el.scrollWidth) || 0;
    try {
      var r = el.getBoundingClientRect ? el.getBoundingClientRect().width : 0;
      if (r > n) n = Math.round(r);
    } catch (e) {}
    return n;
  }

  // O bloco que deve receber a barra de rolagem: subindo a partir do conteúdo,
  // o primeiro ancestral que já se comporta como caixa (overflow auto/hidden/
  // scroll) — é o que está cortando hoje. Sem ele, o pai direto.
  function containerDeRolagem(el, raiz) {
    var p = el && el.parentElement;
    while (p && p !== raiz) {
      var cs = null;
      try { cs = window.getComputedStyle ? window.getComputedStyle(p) : null; } catch (e) {}
      var ox = String((cs && (cs.overflowX || cs.overflow)) || '');
      if (/auto|hidden|scroll/.test(ox)) return p;
      if (p === document.body || !p.parentElement) break;
      p = p.parentElement;
    }
    return (el && el.parentElement) || null;
  }

  function proximoBilhete(container) {
    var p = container && container.nextElementSibling;
    return (p && p.classList && p.classList.contains('digi-rola-dica')) ? p : null;
  }

  // Bilhete 'arraste'. As cores vão no estilo do elemento, nunca no CSS
  // compartilhado (regra da r66: cor fixa no CSS injetado mata o modo escuro).
  function bilhete(container, texto) {
    var atual = proximoBilhete(container);
    if (!texto) {
      if (atual && atual.parentNode) atual.parentNode.removeChild(atual);
      return;
    }
    if (!container || !container.parentNode) return;
    if (typeof document === 'undefined' || !document || !document.createElement) return;   // sem DOM (teste), nada a criar
    if (!atual) {
      atual = document.createElement('div');
      atual.className = 'digi-rola-dica';
      atual.setAttribute('role', 'note');
      atual.style.cssText = 'color:#0a1e8a;background:#eef3ff;border-color:#b9c8e6';
      container.parentNode.insertBefore(atual, container.nextSibling);
      // some no primeiro arraste. O listener é preso uma vez só (marcado no
      // próprio bloco) — varrer() roda a cada clique e não pode empilhar.
      if (!container.getAttribute('data-digi-rolo-escuta')) {
        container.setAttribute('data-digi-rolo-escuta', '1');
        container.addEventListener('scroll', function () {
          if ((container.scrollLeft || 0) > 8) {
            var d = proximoBilhete(container);
            if (d && d.parentNode) d.parentNode.removeChild(d);
          }
        }, { passive: true });
      }
    }
    if (atual.textContent !== texto) atual.textContent = texto;
  }

  // true = não cabe (rolagem ligada + bilhete); false = cabe (tudo desfeito).
  function marcarRolagem(conteudo, container, texto) {
    if (!container || !container.classList) return false;
    var disponivel = Number(container.clientWidth) || 0;
    if (!disponivel) {   // bloco fechado/sem largura medida: não inventa, e tira o que ficou de antes
      container.classList.remove('digi-rola');
      bilhete(container, null);
      return false;
    }
    var precisa = precisaRolar(larguraDe(conteudo), disponivel);
    if (precisa) container.classList.add('digi-rola');
    else container.classList.remove('digi-rola');
    bilhete(container, precisa ? texto : null);
    return precisa;
  }

  var DICA_TABELA = 'arraste para o lado para ver as últimas colunas';
  var DICA_FAIXA = 'arraste para o lado para ver os outros menus';

  // Varre as tabelas da tela aberta (e das janelas de modal) marcando as que
  // não cabem. Roda dentro do varrer() — mesma hora do resto — e é exportada
  // para o teste poder exercitar com um DOM falso.
  function conferirTabelas() {
    if (typeof document === 'undefined' || !document || !document.querySelectorAll) return 0;
    var alvos = [];
    try { alvos = document.querySelectorAll('.view:not(.hidden) table, #modal-root:not(.hidden) table'); } catch (e) { return 0; }
    var marcadas = 0;
    for (var i = 0; i < alvos.length; i++) {
      var t = alvos[i];
      if (!t.getBoundingClientRect || t.getBoundingClientRect().height < 2) continue;   // tela fechada não é tocada
      var cont = containerDeRolagem(t, t.ownerDocument && t.ownerDocument.body);
      if (!cont) continue;
      if (marcarRolagem(t, cont, DICA_TABELA)) marcadas++;
    }
    return marcadas;
  }

  // Onde colocar o menu que desce, já preso dentro da tela.
  function posicaoDoMenu(botao, menu, janela, folga) {
    folga = folga == null ? FOLGA : folga;
    var left = botao.left;
    var direita = left + menu.largura;
    if (direita > janela.largura - folga) left = janela.largura - folga - menu.largura;
    if (left < folga) left = folga;
    return { left: Math.round(left), top: Math.round(botao.top + botao.altura + 2) };
  }

  // Regras da rodada 66 ('telas apertadas'). Ficam numa constante para que o
  // teste confira exatamente o que vai para a página — e para o css() abaixo não
  // duplicar nada.
  var CSS_TELA_APERTADA =
    '#modal-root #modal-box{max-height:94vh}' +
    '#modal-root #modal-body{overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}' +
    '#modal-root #modal-footer{flex:0 0 auto}' +
    '.digi-rola{overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:thin}' +
    '.digi-rola::-webkit-scrollbar{height:7px}' +
    '.digi-rola-dica{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;line-height:1.3;padding:4px 8px;margin:6px 0 0;border:1px dashed;border-radius:9px}' +
    '@media (min-width:821px){.digi-rola-dica{display:none}}' +
    '@media (max-width:1200px){' +
      '#modal-root #modal-box{max-width:96vw}' +
      '#modal-root #modal-body .grid{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}' +
      '#modal-root #modal-body .flex.items-center.justify-end{flex-wrap:wrap;gap:6px}' +
      '#modal-root #modal-footer button{white-space:nowrap}' +
    '}' +
    '@media (max-width:820px){' +
      '#modal-root #modal-body .grid{grid-template-columns:1fr}' +
      '#modal-root #modal-box{max-height:96vh;max-width:100%;min-width:0}' +
      '#modal-root #modal-footer{flex-wrap:wrap;row-gap:6px}' +
    '}';
  window.MENUS_TELA_PEQUENA_PURE = {
    ajusteNecessario: ajusteNecessario,
    precisaRolar: precisaRolar,
    posicaoDoMenu: posicaoDoMenu,
    larguraDe: larguraDe,
    containerDeRolagem: containerDeRolagem,
    marcarRolagem: marcarRolagem,
    bilhete: bilhete,
    conferirTabelas: conferirTabelas,
    DICA_TABELA: DICA_TABELA,
    DICA_FAIXA: DICA_FAIXA,
    FOLGA: FOLGA,
    MIN_ALTURA: MIN_ALTURA,
    VERSAO: '5.22.70',
    TELA_APERTADA: CSS_TELA_APERTADA,
  };


if (typeof document === 'undefined') return;

  var SELETOR = '.module-menu, .neo-suggest, [data-menu-flutuante]';

  // ── faixa azul dos módulos ───────────────────────────────────────────────
  function css() {
    if (document.getElementById('digi-menus-tela-pequena')) return;
    var st = document.createElement('style');
    st.id = 'digi-menus-tela-pequena';
    st.textContent =
      '.module-row.digi-row-rola{overflow-x:auto;overflow-y:hidden;flex-wrap:nowrap;scrollbar-width:thin;scroll-behavior:smooth}' +
      '.module-row.digi-row-rola::-webkit-scrollbar{height:7px}' +
      '.module-row.digi-row-rola::-webkit-scrollbar-thumb{background:#c7d2e4;border-radius:6px}' +
      '.module-row.digi-row-rola::-webkit-scrollbar-track{background:transparent}' +
      '.module-row.digi-row-rola > *{flex:0 0 auto}' +
      '.module-row.digi-row-rola .module-menu{position:fixed;top:auto;left:auto;z-index:1200}' +
      CSS_TELA_APERTADA;
    document.head.appendChild(st);
  }

  function faixa() { return document.querySelector('.module-row'); }

  function conferirFaixa() {
    var row = faixa();
    if (!row) return false;
    if (row.classList.contains('digi-row-rola')) {
      // já rolando: só tira a rolagem se voltar a caber sem ela
      row.classList.remove('digi-row-rola');
      if (precisaRolar(row.scrollWidth, row.clientWidth)) { row.classList.add('digi-row-rola'); return avisoDaFaixa(row, true); }
      return avisoDaFaixa(row, false);
    }
    if (precisaRolar(row.scrollWidth, row.clientWidth)) { row.classList.add('digi-row-rola'); return avisoDaFaixa(row, true); }
    return avisoDaFaixa(row, false);
  }

  // v5.22.70: rolar a faixa já rolava desde a v5.22.68 — o que ninguém via é
  // que ela rolava. 'Loca…' no canto direito era o único indício.
  function avisoDaFaixa(row, rolando) {
    if (rolando) row.classList.add('digi-rola');
    bilhete(row, rolando ? DICA_FAIXA : null);
    return rolando;
  }

  function colarMenuNoBotao(mod) {
    var row = faixa();
    if (!row || !row.classList.contains('digi-row-rola')) return;
    var btn = mod.querySelector(':scope > button');
    var menu = mod.querySelector('.module-menu');
    if (!btn || !menu) return;
    var rb = btn.getBoundingClientRect();
    var lm = menu.getBoundingClientRect();
    var pos = posicaoDoMenu(
      { left: rb.left, top: rb.top, altura: rb.height },
      { largura: lm.width || 230 },
      { largura: window.innerWidth, altura: window.innerHeight }
    );
    menu.style.left = pos.left + 'px';
    menu.style.top = pos.top + 'px';
  }

  document.addEventListener('mouseover', function (ev) {
    var mod = ev.target && ev.target.closest && ev.target.closest('.module');
    if (mod) colarMenuNoBotao(mod);
  }, true);
  document.addEventListener('click', function (ev) {
    var mod = ev.target && ev.target.closest && ev.target.closest('.module');
    if (mod) setTimeout(function () { colarMenuNoBotao(mod); }, 0);
  }, true);

  function visivel(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    var cs = window.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  }

  function limpar(el) {
    if (el.getAttribute('data-menu-ajustado') !== '1') return;
    el.style.maxHeight = '';
    el.style.overflowY = '';
    el.style.overscrollBehavior = '';
    el.style.transform = el.getAttribute('data-menu-transform-anterior') || '';
    el.removeAttribute('data-menu-transform-anterior');
    el.removeAttribute('data-menu-ajustado');
  }

  function ajustar(el) {
    if (!visivel(el)) { limpar(el); return; }

    // mede sem o ajuste anterior, senão o menu encolhe a cada abertura
    limpar(el);
    var r = el.getBoundingClientRect();
    var plano = ajusteNecessario(
      { top: r.top, left: r.left, largura: r.width, altura: r.height },
      { largura: window.innerWidth, altura: window.innerHeight }
    );
    if (!plano) return;

    if (plano.alturaMax) {
      el.style.maxHeight = plano.alturaMax + 'px';
      el.style.overflowY = 'auto';
      el.style.overscrollBehavior = 'contain';
    }
    if (plano.deslocarX) {
      el.setAttribute('data-menu-transform-anterior', el.style.transform || '');
      var base = el.style.transform ? el.style.transform + ' ' : '';
      el.style.transform = base + 'translateX(' + plano.deslocarX + 'px)';
    }
    el.setAttribute('data-menu-ajustado', '1');
  }

  var agendado = false;
  var ultimaPassadaDeTabela = 0;
  // A varredura de tabela é a parte cara (mede cada bloco e o estilo de cada
  // ancestral). O MutationObserver da barra dispara a cada mudança de DOM, e em
  // PC fraco isso aconteceria dezenas de vezes por segundo: no máximo uma
  // passada a cada 400ms. O próximo clique, resize ou troca de tela refaz.
  function agenda(forcar) {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      try { css(); conferirFaixa(); } catch (e) {}
      var agora = Date.now();
      if (forcar || agora - ultimaPassadaDeTabela > 400) {
        ultimaPassadaDeTabela = agora;
        try { conferirTabelas(); } catch (e) {}
      }
      try {
        var menus = document.querySelectorAll(SELETOR);
        for (var i = 0; i < menus.length; i++) ajustar(menus[i]);
      } catch (e) {}
    });
  }

  // dispara nos momentos em que um menu pode abrir ou mudar de tamanho
  function varrer() { agenda(false); }
  function varrerAgora() { agenda(true); }

  document.addEventListener('click', varrer, true);
  document.addEventListener('mouseover', function (ev) {
    if (ev.target && ev.target.closest && ev.target.closest('.module, .modern-topnav')) varrer();
  }, true);
  document.addEventListener('focusin', varrer, true);
  document.addEventListener('keyup', varrer, true);
  window.addEventListener('resize', varrer);
  document.addEventListener('digest-tela-pintada', varrerAgora, false);
  window.digiRevarrerTelas = varrerAgora;
  setTimeout(varrer, 800);
  setTimeout(varrer, 2500);   // a faixa é montada por outros patches, confere de novo

  // Trocar de tela também é um momento de medir. Sem isto, o aviso de "arraste"
  // só aparecia depois do primeiro clique DEPOIS de abrir a tela — quem navega
  // por atalho, pela busca ou por programa (é assim que o teste do Actions
  // navega) via a tabela cortada sem nenhum aviso. O embrulho é por fora do
  // núcleo: se outro patch já embrulhou, entra na frente dele e a corrente
  // inteira continua funcionando.
  function prenderNavegacao() {
    var anterior = window.navigateTo;
    if (typeof anterior !== 'function') return false;
    if (anterior.__digiRoloNav) return true;
    var embrulhado = function () {
      var r;
      try { r = anterior.apply(this, arguments); }
      finally { varrer(); setTimeout(varrerAgora, 140); setTimeout(varrerAgora, 800); }
      return r;
    };
    embrulhado.__digiRoloNav = true;
    window.navigateTo = embrulhado;
    return true;
  }
  if (!prenderNavegacao() && typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () { prenderNavegacao(); });
  }
  if (typeof MutationObserver === 'function') {
    try {
      new MutationObserver(varrer).observe(document.querySelector('.modern-topnav') || document.body,
        { childList: true, subtree: true });
    } catch (e) {}
  }

  console.log('[DIGICOPY] menus e faixa de módulos se ajustam a telas pequenas');
})();
