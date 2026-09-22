// ═══════════════════════════════════════════════════════════════════════════
// SUBMENU_HOVER_NFE_PATCH v6.0.11 — correção dele (18/09): "os submenu vc fez
// errado, é pra colocar onde mostra os menus quando coloca o mouse por cima
// de NF-e/NFC-e".
//
// O correto (igual ao sistema antigo): existe UM item "NF-e/NFC-e" e os 6
// submenus aparecem quando o mouse passa por cima. Não é a fila de botões
// soltos que a v6.0.9/6.0.10 instalou.
//
// O que este patch faz:
//  A) BARRA CLÁSSICA (ribbon): o módulo "NF-e/NFC-e" que já existia no
//     index.html (com 3 itens falsos "Em breve") virou real no próprio
//     index.html — hover abre .module-menu com os 6 submenus de verdade.
//     Os módulos fiscais SOLTOS na barra (instalados pelas 6.0.9/6.0.10)
//     ficam escondidos (display:none) — não apagados: as telas continuam.
//  B) NAV LATERAL: os 6 botões fiscais soltos viram UM botão "NF-e/NFC-e"
//     (ícone ph-file-text, mesmo do ribbon) posicionado exatamente onde o
//     "Nota Fiscal" estava; passar o mouse abre o flyout branco à direita
//     com os 6, no MESMO padrão visual do .module-menu da barra clássica.
//     Clicar no pai abre a Central (Nota Fiscal).
//  C) Nada de tela some: as views/atalhos da 6.0.10 seguem iguais — só o
//     JEITO DE CHEGAR muda (um pai + submenu em vez de botões soltos).
//
// Guard: __v60011sxvm · PURE: SXVM611_PURE (sem DOM, testável).
// NÃO mexer sem rodar: test_ajustes_v60011.js + suíte dupla.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__v60011sxvm) return;
  window.__v60011sxvm = true;

  // SXVM_PURE_START
  function sxvmItens() {
    return [
      { view: 'central-nf', rot: 'Nota Fiscal', icon: 'ph-receipt' },
      { view: 'fiscal-perfil', rot: 'Perfil Tributário', icon: 'ph-percent' },
      { view: 'fiscal-manifestacao', rot: 'Manifestação', icon: 'ph-stamp' },
      { view: 'fiscal-ncm', rot: 'NCM', icon: 'ph-barcode' },
      { view: 'fiscal-enviar-xml', rot: 'Enviar XML', icon: 'ph-file-zip' },
      { view: 'config-fiscal', rot: 'Configurações', icon: 'ph-gear' }
    ];
  }
  // SXVM_PURE_END

  var SXVM_SOLTOS = sxvmItens().map(function (m) { return m.view; })
    .concat(['fiscal-historico', 'fiscal-ferramentas', 'fiscal-inutilizar']);

  function sxvmEsconderSoltos() {
    SXVM_SOLTOS.forEach(function (v) {
      const nb = document.querySelector('[data-nav="' + v + '"]');
      if (nb) nb.style.display = 'none';
      const tm = document.getElementById('topmod-' + v);
      if (tm) tm.style.display = 'none';
    });
  }

  function sxvmCss() {
    if (document.getElementById('sxvm-style')) return;
    const st = document.createElement('style');
    st.id = 'sxvm-style';
    st.textContent =
      '#sxvm-flyout-nav{position:fixed;z-index:2147483000;display:none;min-width:238px;background:#fff;border:1px solid #dbe3ef;border-radius:12px;box-shadow:0 18px 45px rgba(15,23,42,.18);padding:8px}' +
      '#sxvm-flyout-nav .sxvm-cab{padding:4px 10px 8px;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #eef2f7;margin-bottom:5px}' +
      '#sxvm-flyout-nav button{width:100%;height:38px;border-radius:9px;display:flex;align-items:center;gap:10px;padding:0 10px;text-align:left;font-size:12.5px;color:#334155;transition:.14s;background:none;border:none;cursor:pointer;font-family:inherit}' +
      '#sxvm-flyout-nav button:hover{background:#f1f6ff;color:#0a1e8a;padding-left:14px}' +
      '#sxvm-flyout-nav button i{font-size:18px;color:#0a1e8a}';
    document.head.appendChild(st);
  }

  function sxvmFlyout() {
    let fly = document.getElementById('sxvm-flyout-nav');
    if (fly) return fly;
    sxvmCss();
    fly = document.createElement('div');
    fly.id = 'sxvm-flyout-nav';
    fly.setAttribute('role', 'menu');
    fly.innerHTML = '<div class="sxvm-cab">NF-e/NFC-e</div>' + sxvmItens().map(function (m) {
      return '<button type="button" role="menuitem" data-view="' + m.view + '"><i class="ph ' + m.icon + '"></i>' + m.rot + '</button>';
    }).join('');
    document.body.appendChild(fly);
    fly.querySelectorAll('button[data-view]').forEach(function (b) {
      b.onclick = function () {
        sxvmFechar(true);
        try { window.navigateTo(b.getAttribute('data-view')); } catch (e) { }
      };
    });
    fly.addEventListener('mouseenter', sxvmCancelarFechar);
    fly.addEventListener('mouseleave', function () { sxvmAgendarFechar(); });
    return fly;
  }

  var sxvmTimer = null;
  function sxvmAgendarFechar() {
    sxvmCancelarFechar();
    sxvmTimer = setTimeout(function () { sxvmFechar(); }, 180);
  }
  function sxvmCancelarFechar() { if (sxvmTimer) { clearTimeout(sxvmTimer); sxvmTimer = null; } }
  function sxvmFechar(agora) {
    const fly = document.getElementById('sxvm-flyout-nav');
    if (fly) fly.style.display = 'none';
    sxvmCancelarFechar();
  }
  function sxvmAbrir(botao) {
    const fly = sxvmFlyout();
    const rc = botao.getBoundingClientRect();
    fly.style.left = Math.min(window.innerWidth - 250, rc.right + 8) + 'px';
    fly.style.top = Math.max(8, rc.top - 4) + 'px';
    fly.style.display = 'block';
  }

  function sxvmInstalarNavLateral() {
    const nav = document.getElementById('nav-gest');
    if (!nav) return;
    let pai = document.getElementById('sxvm-nav-pai');
    if (!pai) {
      pai = document.createElement('button');
      pai.id = 'sxvm-nav-pai';
      pai.setAttribute('data-nav', 'central-nf'); // mesma marca do destino principal (nav ativa)
      pai.className = 'w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white';
      pai.innerHTML = '<i class="ph ph-file-text text-[19px]"></i><span>NF-e/NFC-e</span><i class="ph ph-caret-right text-[13px] ml-auto"></i>';
      pai.addEventListener('mouseenter', function () { sxvmAbrir(pai); });
      pai.addEventListener('mouseleave', function () { sxvmAgendarFechar(); });
      pai.onclick = function () { sxvmFechar(true); try { window.navigateTo('central-nf'); } catch (e) { } };
      const ref = nav.querySelector('[data-nav="central-nf"]:not(#sxvm-nav-pai)') || nav.firstChild;
      if (ref && ref.parentNode === nav) nav.insertBefore(pai, ref); else nav.appendChild(pai);
    }
  }

  function sxvmTudo() {
    try { sxvmEsconderSoltos(); sxvmInstalarNavLateral(); } catch (e) { }
  }

  sxvmTudo();
  (function sxvmSonda() {
    let tent = 0;
    const t = setInterval(function () {
      tent++;
      if (!document.hidden) sxvmTudo();
      if (tent > 300) clearInterval(t);
    }, 2000);
  })();
  window.addEventListener('blur', function () { sxvmFechar(true); });
  document.addEventListener('click', function (ev) {
    const fly = document.getElementById('sxvm-flyout-nav');
    if (fly && fly.style.display === 'block' && !fly.contains(ev.target) && ev.target.id !== 'sxvm-nav-pai' && !(ev.target.closest && ev.target.closest('#sxvm-nav-pai'))) sxvmFechar(true);
  });

  console.log('%cSUBMENU_HOVER_NFE_PATCH v6.0.11 ativo — NF-e/NFC-e vira UM item; os 6 submenus aparecem quando o mouse passa por cima (igual ao sistema antigo).', 'color:#0a1e8a;font-weight:bold');
})();

// PURE export (testes + reuso)
if (typeof module !== 'undefined' && module.exports) {
  const _p = (function () {
    const src = require('fs').readFileSync(__filename, 'utf8');
    const m = src.match(/\/\/ SXVM_PURE_START([\s\S]*?)\/\/ SXVM_PURE_END/);
    const fn = new Function(m[1] + '; return { sxvmItens };');
    return fn();
  })();
  module.exports = _p;
  if (typeof global !== 'undefined') global.SXVM611_PURE = _p;
}
