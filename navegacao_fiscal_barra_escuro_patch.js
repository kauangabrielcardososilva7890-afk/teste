/* ============================================================
 * v6.1.2 — Navegação fiscal NA BARRA DE MÓDULOS (reconstruída)
 *          + modo escuro íntegro nas telas fiscais.
 *
 * Causa-raiz provada no teste E2E headless (jsdom):
 * 1) pintarMenus (v5.22.13+) RECRIA a .module-row a partir de
 *    menusPadrao() e APAGA o markup estático do index: o módulo
 *    fiscal volta com o rótulo velho "NF-e/NFC-e" e um submenu
 *    SEM id com 3 itens antigos → a v6.1.1 (que buscava
 *    #menu-nfe) nunca encontrava o alvo → "não muda nada".
 * 2) As CSS claras fixas das telas fiscais/faixa não respeitavam
 *    .digi-escuro → "modo escuro todo bugado".
 *
 * Este patch: acha o módulo fiscal pelo ONCLICK (abrirCentralNfe /
 * navigateTo('central-nf')), recoloca o rótulo "Fiscal" e o
 * #menu-nfe com os 6 menus oficiais sempre que a barra for
 * repintada (observer), mantém pin por clique (compatível com a
 * v6.1.1 via classe .sfo-pin + e.defaultPrevented), e muda TODOS
 * os módulos com submenu para abrir somente por clique (hover não
 * abre; clique fora fecha). Também cobre o modo escuro (.digi-escuro)
 * de todas as camadas claras fixas.
 * Não importa dado, não toca banco, não interfere no claro.
 * Guard: __v612nes
 * ============================================================ */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__v612nes) return;
  window.__v612nes = true;

  var VIEWS = [
    'view-central-nf',
    'view-fiscal-perfil',
    'view-fiscal-manifestacao',
    'view-fiscal-enviar-xml',
    'view-fiscal-ncm',
    'view-config-fiscal'
  ];

  /* ---------- CSS: modo escuro (.digi-escuro) cobre os claros fixos ---------- */
  function injetaCss() {
    var st = document.getElementById('nes612-css');
    if (st) {
      /* mantém a folha por ÚLTIMO: folhas tardias (menus, catálogo) não a cobrem */
      var head0 = document.head || document.documentElement;
      if (st.parentNode === head0 && head0.lastElementChild !== st) head0.appendChild(st);
      return;
    }
    st = document.createElement('style');
    st.id = 'nes612-css';
    st.textContent = [
      /* shell das telas fiscais (gradiente claro → escuro) */
      'body.digi-escuro #view-central-nf, body.digi-escuro #view-fiscal-perfil, body.digi-escuro #view-fiscal-manifestacao, ' +
      'body.digi-escuro #view-fiscal-enviar-xml, body.digi-escuro #view-fiscal-ncm, body.digi-escuro #view-config-fiscal' +
      '{ background: linear-gradient(180deg,#0a1240 0%, #0d1746 55%, #101b52 100%) !important; color:#e8eeff !important; }',

      /* painel .fx-root-wrap: cartões, barras, inputs, tabelas e abas */
      'body.digi-escuro .fx-root-wrap{ color:#e8eeff !important; }',
      'body.digi-escuro .fx-root-wrap .fx-card, body.digi-escuro .fx-root-wrap .fx-barra{' +
      ' background: rgba(13,21,54,.88) !important; background-color: rgba(13,21,54,.88) !important;' +
      ' background-image: none !important; border-color: rgba(148,167,255,.22) !important;' +
      ' box-shadow: 0 2px 14px rgba(2,6,26,.45) !important; }',
      'body.digi-escuro .fx-root-wrap .fx-lb, body.digi-escuro .fx-root-wrap .fx-mini, body.digi-escuro .fx-root-wrap .fx-h2{ color:#a9bff2 !important; }',
      'body.digi-escuro .fx-root-wrap .fx-in, body.digi-escuro .fx-root-wrap select.fx-in, body.digi-escuro .fx-root-wrap textarea.fx-in{' +
      ' background:#0b1337 !important; color:#e8eeff !important; border-color: rgba(148,167,255,.28) !important; }',
      'body.digi-escuro .fx-root-wrap .fx-tb th{ background:#111e4e !important; color:#c3d4ff !important; border-color: rgba(148,167,255,.18) !important; }',
      'body.digi-escuro .fx-root-wrap .fx-tb td{ color:#dbe6ff !important; border-color: rgba(148,167,255,.12) !important; }',
      'body.digi-escuro .fx-tb tbody tr:nth-child(even){ background: rgba(148,167,255,.06) !important; }',
      'body.digi-escuro .fx-tb tbody tr:hover{ background: rgba(59,99,246,.16) !important; }',
      'body.digi-escuro .fx-tab{ color:#a9bff2 !important; }',
      'body.digi-escuro .fx-tab.on{ background:#1d4ed8 !important; color:#ffffff !important; border-color:#1d4ed8 !important; }',
      'body.digi-escuro .fx-root-wrap .fx-btn{ background:#152258 !important; color:#dbe6ff !important; border-color: rgba(148,167,255,.25) !important; }',
      'body.digi-escuro .fx-root-wrap .fx-btn:hover{ background:#1c2c6e !important; }',

      /* submenu #menu-nfe da barra (o claro do sfo611 quebrava o escuro) */
      'body.digi-escuro #menu-nfe{ background:#0d1738 !important; border:1px solid rgba(148,167,255,.28) !important; box-shadow: 0 14px 34px rgba(2,6,26,.55) !important; }',
      'body.digi-escuro #menu-nfe button{ color:#dbe6ff !important; }',
      'body.digi-escuro #menu-nfe button:hover{ background: rgba(59,99,246,.22) !important; color:#ffffff !important; }',

      /* flyout lateral (sxvm) também fica íntegro no escuro */
      'body.digi-escuro #sxvm-flyout-nav{ background:#0d1738 !important; border-color: rgba(148,167,255,.28) !important; box-shadow: 0 14px 34px rgba(2,6,26,.55) !important; }',
      'body.digi-escuro #sxvm-flyout-nav button{ color:#dbe6ff !important; }',
      'body.digi-escuro #sxvm-flyout-nav button:hover{ background: rgba(59,99,246,.22) !important; color:#ffffff !important; }',
      /* comportamento novo: menu só abre por clique, nunca só por hover */
      '.module:not(.sfo-pin) > .module-menu{opacity:0 !important;visibility:hidden !important;transform:translateY(8px) scale(.98) !important;pointer-events:none !important}',
      '.module.sfo-pin > .module-menu{opacity:1 !important;visibility:visible !important;transform:translateY(0) scale(1) !important;pointer-events:auto !important}',
      '.module.sfo-pin > button{background:linear-gradient(180deg,#1d4ed8,#1e3a8a) !important;color:#fff !important;border-radius:10px;box-shadow:0 8px 18px rgba(30,58,138,.24)}',
      '.module.sfo-pin > button i{color:#fff !important}',
      '.module-menu{background:#fff;border:1px solid #dbe3ef;border-radius:14px;box-shadow:0 18px 45px rgba(15,23,42,.18);padding:8px}',
      '.module-menu button{height:40px;border-radius:10px;font-weight:650}',
      '#sxvm-flyout-nav:not(.sfo-pin){display:none !important}',
      '#sxvm-flyout-nav.sfo-pin{display:block !important}',
      'body.digi-escuro .module-menu{background:#0d1738;border-color:rgba(148,167,255,.28);box-shadow:0 14px 34px rgba(2,6,26,.55)}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---------- remove definitivamente as três opções fiscais legadas ---------- */
  var FISCAIS_LEGADOS = ['fiscal-historico', 'fiscal-inutilizar', 'fiscal-ferramentas'];
  function ehRotaFiscalLegada(valor) {
    var s = String(valor || '');
    return FISCAIS_LEGADOS.some(function (v) {
      return s === v || s.indexOf("navigateTo('" + v + "')") >= 0 || s.indexOf('navigateTo("' + v + '")') >= 0;
    });
  }
  function removerOpcoesFiscaisLegadas() {
    var seletor = '[data-nav],[data-sxv-go],[id^="topmod-"]';
    document.querySelectorAll(seletor).forEach(function (el) {
      var chave = el.getAttribute('data-nav') || el.getAttribute('data-sxv-go') || '';
      var id = el.id || '';
      if (ehRotaFiscalLegada(chave) || FISCAIS_LEGADOS.some(function (v) { return id === 'topmod-' + v; })) {
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    });
    document.querySelectorAll('button, a').forEach(function (el) {
      var oc = el.getAttribute('onclick') || '';
      if (!oc || !ehRotaFiscalLegada(oc)) return;
      // Mantém a tela/rotas para compatibilidade de dados, mas não deixa
      // nenhum botão antigo continuar exposto em barra, submenu ou atalho.
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  /* ---------- módulo fiscal na barra de módulos ---------- */
  function ehFiscalBtn(b) {
    var oc = (b && b.getAttribute('onclick')) || '';
    return /abrirCentralNfe\s*\(|navigateTo\('central-nf'\)/.test(oc);
  }
  function moduloFiscal() {
    var mods = document.querySelectorAll('.module-row .module, .modern-topnav .module');
    for (var i = 0; i < mods.length; i++) {
      var b = mods[i].querySelector(':scope > button');
      if (ehFiscalBtn(b)) return mods[i];
    }
    return null;
  }

  var SUBS = [
    ["navigateTo('central-nf')", 'ph-receipt', 'Nota Fiscal'],
    ["navigateTo('fiscal-perfil')", 'ph-percent', 'Perfil Tributário'],
    ["navigateTo('fiscal-manifestacao')", 'ph-stamp', 'Manifestação'],
    ["navigateTo('fiscal-ncm')", 'ph-barcode', 'NCM'],
    ["navigateTo('fiscal-enviar-xml')", 'ph-file-zip', 'Enviar XML'],
    ["navigateTo('config-fiscal')", 'ph-gear', 'Configurações']
  ];
  function menuHtml() {
    return SUBS.map(function (s) {
      return '<button onclick="' + s[0] + '"><i class="ph ' + s[1] + '"></i>' + s[2] + '</button>';
    }).join('');
  }

  function fixBarra() {
    removerOpcoesFiscaisLegadas();
    var mod = moduloFiscal();
    if (!mod) return false;
    var btn = mod.querySelector(':scope > button');
    if (btn && !/^\s*Fiscal\b/.test(String(btn.textContent || '').trim())) {
      btn.innerHTML = '<i class="ph ph-file-text"></i>Fiscal';
    }
    /* submenu velho (sem id, 3 itens) sai; #menu-nfe oficial fica */
    var menus = mod.querySelectorAll('.module-menu');
    for (var i = 0; i < menus.length; i++) {
      if (menus[i].id !== 'menu-nfe' && menus[i].parentNode) menus[i].parentNode.removeChild(menus[i]);
    }
    var menu = mod.querySelector('#menu-nfe');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'menu-nfe';
      menu.className = 'module-menu';
      mod.appendChild(menu);
    }
    if (menu.className.indexOf('module-menu') === -1) menu.className = 'module-menu ' + menu.className;
    if (menu.getAttribute('data-nes612') !== '1' || menu.querySelectorAll(':scope > button').length !== SUBS.length) {
      var pin = menu.classList.contains('sfo-pin');
      menu.innerHTML = menuHtml();
      menu.setAttribute('data-nes612', '1');
      if (pin) menu.classList.add('sfo-pin');
    }
    return true;
  }

  /* ---------- Configurações: as dez abas usam um clique delegado estável ---------- */
  document.addEventListener('click', function (e) {
    var tab = e.target && e.target.closest ? e.target.closest('[data-fx-tab]') : null;
    if (!tab) return;
    var tela = tab.closest('#view-config-fiscal');
    if (!tela) return;
    var acao = window.fxAcao;
    if (typeof acao !== 'function') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    acao('cfg-aba', tab.getAttribute('data-fx-tab') || 'Geral');
  }, true);

  /* ---------- todos os menus: clique abre/fecha; hover não abre ---------- */
  function fecharMenus(excecao) {
    document.querySelectorAll('.module.sfo-pin').forEach(function (m) {
      if (m !== excecao) m.classList.remove('sfo-pin');
    });
    var fly = document.getElementById('sxvm-flyout-nav');
    if (fly && fly !== excecao && !fly.classList.contains('sfo-pin')) fly.style.display = 'none';
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var mod = e.target && e.target.closest ? e.target.closest('.module') : null;
    var pai = mod && mod.querySelector(':scope > button');
    var menu = mod && mod.querySelector(':scope > .module-menu');
    if (mod && pai && menu && pai.contains(e.target)) {
      e.preventDefault(); e.stopImmediatePropagation();
      var estava = mod.classList.contains('sfo-pin');
      fecharMenus();
      if (!estava) mod.classList.add('sfo-pin');
      return;
    }
    if (e.target && e.target.closest && e.target.closest('.module-menu')) {
      fecharMenus();
      return; /* deixa o onclick do item navegar */
    }
    if (!(e.target && e.target.closest && e.target.closest('#sxvm-flyout-nav'))) fecharMenus();
  }, true);

  /* ---------- clique no pai fiscal: abre e FICA preso (pin); compõe com o sfo611 ---------- */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return; /* o submenu_fiscal_oficial (6.1.1) já tratou */
    var mod = e.target && e.target.closest ? e.target.closest('.module') : null;
    if (!mod) return;
    var btn = mod.querySelector(':scope > button');
    var menu = mod.querySelector('#menu-nfe');
    if (!ehFiscalBtn(btn) || !menu) return;
    if (!e.target.closest('.module-menu')) {
      /* clique no PAI: pin/destampa o submenu, sem navegar */
      e.preventDefault(); e.stopPropagation();
      fixBarra();
      var estava = menu.classList.contains('sfo-pin');
      var todos = document.querySelectorAll('.module-menu.sfo-pin');
      for (var i = 0; i < todos.length; i++) todos[i].classList.remove('sfo-pin');
      if (!estava) menu.classList.add('sfo-pin');
      return;
    }
    /* clicou num ITEM: navega (onclick próprio) e o pin se solta */
    var alvo = e.target.closest('button');
    if (alvo && /central-nf|fiscal-|config-fiscal/.test(alvo.getAttribute('onclick') || '')) {
      setTimeout(function () { menu.classList.remove('sfo-pin'); }, 60);
    }
  }, true);
  /* clicar fora solta o pin */
  document.addEventListener('click', function (e) {
    var pins = document.querySelectorAll('.module-menu.sfo-pin');
    for (var i = 0; i < pins.length; i++) {
      var m = pins[i];
      if (!(e.target && m.contains(e.target)) && !(m.parentElement && m.parentElement.contains(e.target))) {
        m.classList.remove('sfo-pin');
      }
    }
  });

  /* ---------- sobrevive a cada re-pintura da barra ---------- */
  var armouObs = false, pendente = false;
  function armaObs() {
    if (armouObs) return;
    var row = document.querySelector('.module-row');
    if (!row || typeof window.MutationObserver !== 'function') return;
    armouObs = true;
    new window.MutationObserver(function (muts) {
      var mexeu = muts.some(function (m) {
        return m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length);
      });
      if (!mexeu || pendente) return;
      pendente = true;
      setTimeout(function () { pendente = false; armouObs = false; fixBarra(); armaObs(); }, 40);
    }).observe(row, { childList: true, subtree: true });
  }

  var armouLegadosObs = false;
  function armaLegadosObs() {
    if (armouLegadosObs || !document.body || typeof window.MutationObserver !== 'function') return;
    armouLegadosObs = true;
    new window.MutationObserver(function (muts) {
      if (muts.some(function (m) { return m.type === 'childList' && m.addedNodes.length; })) removerOpcoesFiscaisLegadas();
    }).observe(document.body, { childList: true, subtree: true });
  }

  function armar() {
    injetaCss();
    var ok = fixBarra();
    armaObs();
    armaLegadosObs();
    if (!ok) setTimeout(armar, 350);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(armar, 80); });
  } else {
    setTimeout(armar, 80);
  }
  try {
    if (typeof window.showApp === 'function' && !window.showApp.__v612nes) {
      var antiga = window.showApp;
      window.showApp = function () {
        var r = antiga.apply(this, arguments);
        setTimeout(armar, 150);
        return r;
      };
      window.showApp.__v612nes = true;
    }
  } catch (e) {}

  console.log('[DIGICOPY] v6.1.2 navegação Fiscal firme na barra + escuro sem bug');
})();
