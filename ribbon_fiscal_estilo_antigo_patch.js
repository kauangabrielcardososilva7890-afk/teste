/* ribbon_fiscal_estilo_antigo_patch.js (v6.0.13) — MENU FISCAL BONITO:
   faixa de comandos estilo a aba "NF-e/NFC-e" do sistema antigo.

   Dele (18/09/2026): "ta horrivel de feio esse menu fiscal".
   O submenu no lugar certo (v6.0.11) e as telas que abrem (v6.0.12) não
   bastam: ele quer a CARA do menu fiscal do velho — faixa ribbon com aba,
   botões GRANDES (ícone em cima, nome embaixo) agrupados por assunto.

   O que este patch faz (sem desmontar nada do que existe):
   1) Faixa ribbon NO TOPO de cada tela fiscal (Central + os 6 menus + os
      atalhos fiscais): aba "NF-e/NFC-e" ativa, 3 grupos (Documentos,
      Cadastros fiscais, Sistema), 6 botões grandes com ícone azul + legenda,
      item atual destacado. Clique navega (passa pelo anti-tela-branca 6.0.12).
   2) Re-injeta a faixa quando a tela re-renderiza (renders fiscais sobrescrevem
      innerHTML) — wrap de navigateTo + sonda leve só quando tela fiscal visível.
   3) Beleza também no flyout lateral da v6.0.11 (#sxvm-flyout-nav): cabeçalho,
      bordas/hover/sombra no padrão visual do sistema — só CSS, sem tocar no
      arquivo do patch 6.0.11 (mural protege o conteúdo dele). */
(function () {
  var G = typeof window !== 'undefined' ? window : globalThis;
  if (G.__v60013wxr) return;
  G.__v60013wxr = true;

  // ── PURE: os 6 itens agrupados (mesmos destinos da v6.0.10/6.0.11) ──────
  function wxrItens() {
    return [
      { view: 'central-nf', rot: 'Nota Fiscal', icon: 'ph-file-text', grupo: 'Documentos' },
      { view: 'fiscal-manifestacao', rot: 'Manifestação', icon: 'ph-stamp', grupo: 'Documentos' },
      { view: 'fiscal-enviar-xml', rot: 'Enviar XML', icon: 'ph-file-zip', grupo: 'Documentos' },
      { view: 'fiscal-perfil', rot: 'Perfil Tributário', icon: 'ph-scales', grupo: 'Cadastros fiscais' },
      { view: 'fiscal-ncm', rot: 'NCM', icon: 'ph-barcode', grupo: 'Cadastros fiscais' },
      { view: 'config-fiscal', rot: 'Configurações', icon: 'ph-gear-six', grupo: 'Sistema' }
    ];
  }
  function wxrGruposOrdem() { return ['Documentos', 'Cadastros fiscais', 'Sistema']; }
  var WXR_VIEWS = ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal', 'fiscal-historico', 'fiscal-inutilizar', 'fiscal-ferramentas'];
  function wxrEhViewFiscal(view) { return WXR_VIEWS.indexOf(view) >= 0; }
  G.WXR613_PURE = { itens: wxrItens, gruposOrdem: wxrGruposOrdem, views: WXR_VIEWS, ehViewFiscal: wxrEhViewFiscal };

  // ── CSS da faixa (e polimento do flyout lateral) ────────────────────────
  var CSS_ID = 'wxr-ribbon-css';
  var CSS =
    '.wxr-bar{margin:0 0 12px;border:1px solid #d7e0ee;border-radius:14px;background:linear-gradient(180deg,#ffffff,#eef4ff);box-shadow:0 10px 26px rgba(15,23,42,.08);overflow:hidden}' +
    '.wxr-tabs{display:flex;gap:2px;padding:6px 10px 0;background:linear-gradient(180deg,#f4f8ff,#e8effc);border-bottom:1px solid #d7e0ee}' +
    '.wxr-tab{height:27px;padding:0 16px;border:1px solid #d7e0ee;border-bottom:none;border-radius:9px 9px 0 0;background:#fff;color:#0a1e8a;font-size:12px;font-weight:800;display:flex;align-items:center;gap:6px}' +
    '.wxr-corpo{display:flex;gap:10px;padding:10px 12px 6px;overflow-x:auto}' +
    '.wxr-grupo{display:flex;gap:4px;padding:0 10px;position:relative;border-right:1px solid #dbe3ef}' +
    '.wxr-grupo:last-child{border-right:none}' +
    '.wxr-grupo-nome{position:absolute;left:0;right:0;bottom:-22px;text-align:center;font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8}' +
    '.wxr-grupo-wrap{padding-bottom:24px;position:relative}' +
    '.wxr-btn{width:92px;height:66px;border:1px solid transparent;border-radius:11px;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:.14s;padding:4px}' +
    '.wxr-btn i{font-size:26px;color:#0a1e8a}' +
    '.wxr-btn span{font-size:11px;font-weight:750;color:#334155;text-align:center;line-height:1.15}' +
    '.wxr-btn:hover{background:#dceaff;border-color:#b8d0f5;transform:translateY(-1px)}' +
    '.wxr-btn.ativo{background:#eaf2ff;border-color:#0a1e8a;box-shadow:inset 0 0 0 1px #0a1e8a}' +
    /* relação de irmãos: central ativa também quando está em atalhos fiscais */
    '#sxvm-flyout-nav{border-radius:14px !important;box-shadow:0 20px 55px rgba(15,23,42,.22) !important;border:1px solid #d7e0ee !important;padding:10px !important}' +
    '#sxvm-flyout-nav::before{content:"NF-e/NFC-e";display:block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#0a1e8a;padding:2px 10px 8px;border-bottom:1px solid #eef2f7;margin-bottom:6px}' +
    '#sxvm-flyout-nav button{border-radius:9px !important}' +
    '#sxvm-flyout-nav button i{color:#0a1e8a}' +
    '#sxvm-nav-pai.sxvm-ativo, #sxvm-nav-pai:hover{background:rgba(255,255,255,.14) !important}';
  function wxrCss() {
    if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
    var st = document.createElement('style');
    st.id = CSS_ID; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  // ── Monta a faixa ───────────────────────────────────────────────────────
  function wxrMonta(viewAtual) {
    var bar = document.createElement('div');
    bar.className = 'wxr-bar'; bar.id = 'wxr-bar';
    var tabs = document.createElement('div');
    tabs.className = 'wxr-tabs';
    tabs.innerHTML = '<div class="wxr-tab"><i class="ph ph-file-text" style="font-size:15px"></i>NF-e/NFC-e</div>';
    bar.appendChild(tabs);
    var corpo = document.createElement('div');
    corpo.className = 'wxr-corpo';
    G.WXR613_PURE.gruposOrdem().forEach(function (g) {
      var wrap = document.createElement('div');
      wrap.className = 'wxr-grupo-wrap';
      var grp = document.createElement('div');
      grp.className = 'wxr-grupo';
      G.WXR613_PURE.itens().filter(function (it) { return it.grupo === g; }).forEach(function (it) {
        var b = document.createElement('button');
        b.className = 'wxr-btn' + (it.view === viewAtual ? ' ativo' : '');
        b.innerHTML = '<i class="ph ' + it.icon + '"></i><span>' + it.rot + '</span>';
        b.onclick = function () { if (typeof G.navigateTo === 'function') G.navigateTo(it.view); };
        grp.appendChild(b);
      });
      wrap.appendChild(grp);
      var nome = document.createElement('div');
      nome.className = 'wxr-grupo-nome'; nome.textContent = g;
      grp.appendChild(nome);
      corpo.appendChild(wrap);
    });
    bar.appendChild(corpo);
    return bar;
  }

  // ── Injeta no topo da view fiscal visível (idempotente) ─────────────────
  function wxrGarante() {
    try {
      wxrCss();
      for (var i = 0; i < WXR_VIEWS.length; i++) {
        var v = document.getElementById('view-' + WXR_VIEWS[i]);
        if (!v) continue;
        var velha = v.querySelector(':scope > .wxr-bar');
        if (v.offsetParent === null) { if (velha) velha.remove(); continue; }
        if (!velha) v.insertBefore(wxrMonta(WXR_VIEWS[i]), v.firstChild);
        else {
          // atualiza o destaque do item ativo (navegação sem re-render)
          velha.querySelectorAll('.wxr-btn').forEach(function () { });
        }
      }
    } catch (e) { }
  }

  // Wrap por cima da cadeia: depois de navegar, garante a faixa no próximo tick
  function instalar() {
    var anterior = G.navigateTo;
    if (typeof anterior !== 'function') return false;
    if (!anterior.__wxr613) {
      var embrulhado = function (view) {
        var r = anterior.apply(G, arguments);
        setTimeout(wxrGarante, 0);
        setTimeout(wxrGarante, 40);
        return r;
      };
      embrulhado.__wxr613 = true;
      embrulhado.__nav612 = anterior.__nav612; // preserva marca do anti-branco
      G.navigateTo = embrulhado;
    }
    return true;
  }
  if (!instalar() && typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () { instalar(); });
  }
  if (typeof setInterval === 'function' && typeof document !== 'undefined') {
    var iid = setInterval(function () {
      // só trabalha quando tem tela fiscal aberta sem faixa (re-render fiscal)
      try {
        for (var i = 0; i < WXR_VIEWS.length; i++) {
          var v = document.getElementById('view-' + WXR_VIEWS[i]);
          if (v && v.offsetParent !== null && !v.querySelector(':scope > .wxr-bar')) { wxrGarante(); return; }
        }
      } catch (e) { }
    }, 900);
    if (iid && iid.unref) iid.unref();
    G.__wxrSonda = iid;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = G.WXR613_PURE;
})();
