// ═══════════════════════════════════════════════════════════════════════════
// MENUS EM TELA PEQUENA (v5.22.67)
//
// Em monitores baixos os menus suspensos passavam da borda e a última opção
// ficava inalcançável. Agora, SÓ quando não cabe, o menu ganha rolagem e é
// puxado para dentro da tela. Se cabe, nada muda — nenhuma barra aparece.
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

  window.MENUS_TELA_PEQUENA_PURE = {
    ajusteNecessario: ajusteNecessario,
    FOLGA: FOLGA,
    MIN_ALTURA: MIN_ALTURA,
    VERSAO: '5.22.67'
  };

  if (typeof document === 'undefined') return;

  var SELETOR = '.module-menu, .neo-suggest, [data-menu-flutuante]';

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

  console.log('[DIGICOPY] menus se ajustam a telas pequenas');
})();
