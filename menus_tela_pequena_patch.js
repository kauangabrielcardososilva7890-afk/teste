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

  // Onde colocar o menu que desce, já preso dentro da tela.
  function posicaoDoMenu(botao, menu, janela, folga) {
    folga = folga == null ? FOLGA : folga;
    var left = botao.left;
    var direita = left + menu.largura;
    if (direita > janela.largura - folga) left = janela.largura - folga - menu.largura;
    if (left < folga) left = folga;
    return { left: Math.round(left), top: Math.round(botao.top + botao.altura + 2) };
  }

  window.MENUS_TELA_PEQUENA_PURE = {
    ajusteNecessario: ajusteNecessario,
    precisaRolar: precisaRolar,
    posicaoDoMenu: posicaoDoMenu,
    FOLGA: FOLGA,
    MIN_ALTURA: MIN_ALTURA,
    VERSAO: '5.22.67'
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
      '.module-row.digi-row-rola .module-menu{position:fixed;top:auto;left:auto;z-index:1200}';
    document.head.appendChild(st);
  }

  function faixa() { return document.querySelector('.module-row'); }

  function conferirFaixa() {
    var row = faixa();
    if (!row) return false;
    if (row.classList.contains('digi-row-rola')) {
      // já rolando: só tira a rolagem se voltar a caber sem ela
      row.classList.remove('digi-row-rola');
      if (precisaRolar(row.scrollWidth, row.clientWidth)) { row.classList.add('digi-row-rola'); return true; }
      return false;
    }
    if (precisaRolar(row.scrollWidth, row.clientWidth)) { row.classList.add('digi-row-rola'); return true; }
    return false;
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
  function varrer() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      try { css(); conferirFaixa(); } catch (e) {}
      try {
        var menus = document.querySelectorAll(SELETOR);
        for (var i = 0; i < menus.length; i++) ajustar(menus[i]);
      } catch (e) {}
    });
  }

  // dispara nos momentos em que um menu pode abrir ou mudar de tamanho
  document.addEventListener('click', varrer, true);
  document.addEventListener('mouseover', function (ev) {
    if (ev.target && ev.target.closest && ev.target.closest('.module, .modern-topnav')) varrer();
  }, true);
  document.addEventListener('focusin', varrer, true);
  document.addEventListener('keyup', varrer, true);
  window.addEventListener('resize', varrer);
  setTimeout(varrer, 800);
  setTimeout(varrer, 2500);   // a faixa é montada por outros patches, confere de novo
  if (typeof MutationObserver === 'function') {
    try {
      new MutationObserver(varrer).observe(document.querySelector('.modern-topnav') || document.body,
        { childList: true, subtree: true });
    } catch (e) {}
  }

  console.log('[DIGICOPY] menus e faixa de módulos se ajustam a telas pequenas');
})();
