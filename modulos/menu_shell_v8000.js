/* DIGICOPY v8.0.0 — módulo único do shell e menus principais
 * Fonte de verdade para: Usuários, Importação, Etiquetas e tema global.
 * Este arquivo substitui correções visuais dispersas; não cria dados e não altera a nuvem.
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined') return;
  var G=window;
  function qs(s,r){return (r||document).querySelector(s)}
  function qsa(s,r){return Array.from((r||document).querySelectorAll(s))}
  function safe(fn){try{return fn()}catch(e){console.error('[DIGICOPY][menu-shell]',e);return undefined}}
  function hideViews(){qsa('.view').forEach(function(v){v.classList.add('hidden')})}
  function ensureView(id){
    var el=document.getElementById('view-'+id);
    if(!el){el=document.createElement('section');el.id='view-'+id;el.className='view hidden space-y-4';(qs('#views')||qs('main')||document.body).appendChild(el)}
    return el;
  }
  function setActive(nav){
    qsa('[data-nav],[data-side-nav]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-nav')===nav||b.getAttribute('data-side-nav')===nav)})
  }
  function themeOn(){return document.documentElement.classList.contains('digi-escuro')}
  function applyTheme(on){
    document.documentElement.classList.toggle('digi-escuro',!!on);
    document.body.classList.toggle('digi-escuro',!!on);
    var m=qs('meta[name="theme-color"]'); if(m)m.content=on?'#070b14':'#0a1e8a';
  }
  function themeKey(){
    var s=safe(function(){return typeof getSession==='function'?getSession():null});
    var p=String(G.DIGICOPY_BUILD_PROFILE||'');
    return p==='commercial-cloud'&&s?'digicopy_ui_modo_escuro_'+(s.usuarioId||s.login||'usuario'):'digicopy_ui_modo_escuro_dispositivo_v1';
  }
  function loadTheme(){return safe(function(){return localStorage.getItem(themeKey())==='1'})===true}
  function saveTheme(on){safe(function(){localStorage.setItem(themeKey(),on?'1':'0')});applyTheme(on)}
  function darkCss(){
    if(document.getElementById('digicopy-v8-global-dark'))return;
    var s=document.createElement('style');s.id='digicopy-v8-global-dark';
    s.textContent='html.digi-escuro,html.digi-escuro body{background:#070b14!important;color:#e5e7eb!important}html.digi-escuro #app-shell,html.digi-escuro #app-shell>div,html.digi-escuro main,html.digi-escuro #workspace,html.digi-escuro #views{background:#070b14!important;color:#e5e7eb!important}html.digi-escuro .app-titlebar,html.digi-escuro footer,html.digi-escuro .statusbar{background:#0b1220!important;border-color:#263244!important;color:#cbd5e1!important}html.digi-escuro .view,html.digi-escuro .view>*,html.digi-escuro .view [class*="bg-white"],html.digi-escuro .view [class*="bg-slate-50"],html.digi-escuro .view [class*="bg-slate-100"]{background-color:#111827!important;color:#e5e7eb!important;border-color:#334155!important}html.digi-escuro .view [class*="text-slate-500"],html.digi-escuro .view [class*="text-slate-600"],html.digi-escuro .view [class*="text-slate-700"]{color:#aab7ca!important}html.digi-escuro input,html.digi-escuro select,html.digi-escuro textarea{background:#0f172a!important;color:#f1f5f9!important;border-color:#334155!important}html.digi-escuro table th{background:#0f172a!important;color:#cbd5e1!important}html.digi-escuro table td{color:#e5e7eb!important;border-color:#263244!important}html.digi-escuro #sidebar{background:#060e2f!important}html.digi-escuro .shell-side-sub{background:#0b163b!important}html.digi-escuro .shell-side-link,html.digi-escuro .shell-side-sub button{color:#e5e7eb!important}html.digi-escuro .modal,html.digi-escuro [role="dialog"],html.digi-escuro #modal-box{background:#111827!important;color:#e5e7eb!important;border-color:#334155!important}';document.head.appendChild(s);
    var l=document.createElement('style');l.id='digicopy-v8-shell-css';l.textContent='#nfe-config-card,#rtf-template-card{display:none!important}@media(min-width:901px){#sidebar{display:flex!important;position:fixed!important;inset:0 auto 0 0!important;width:300px!important;transform:none!important;z-index:60!important}#app-shell>div>main{margin-left:300px!important;min-height:100vh!important;background:#f8fafc!important}.modern-topnav,#app-shell .classic-toolbar,#app-shell .command-row{display:none!important}#app-shell>div>main>.flex-1{background:#f8fafc!important}#app-shell>div>main>.flex-1>.view{padding:24px 30px 42px!important}}@media(max-width:900px){#sidebar{display:flex!important}}';document.head.appendChild(l);
  }
  function removeDuplicateUser(){
    var cad=qsa('#shell-sidebar-links details').find(function(d){return /cadastros/i.test((qs('summary',d)||{}).textContent||'')});
    if(cad)qsa('[data-nav="usuarios"]',cad).forEach(function(b){b.remove()});
    var cfg=qsa('#shell-sidebar-links details').find(function(d){return /configurações/i.test((qs('summary',d)||{}).textContent||'')});
    if(cfg)qsa('button',cfg).filter(function(b){return /etiquetas de cartuchos/i.test(b.textContent||'')||b.hasAttribute('data-v8-etiquetas')}).forEach(function(b){b.remove()});
    var oldCard=document.getElementById('cartuchos-etiquetas-card');
    if(oldCard && oldCard.closest('#view-config'))oldCard.remove();
  }
  function independentMenus(){
    removeDuplicateUser();
    var side=qs('#shell-sidebar-links'); if(!side)return;
    if(qs('[data-v8-menu]',side))return;
    var section=qsa('.shell-menu-section',side).find(function(x){return /sistema/i.test((qs('.shell-menu-label',x)||{}).textContent||'')});
    if(!section)return;
    var make=function(id,icon,label,fn){var b=document.createElement('button');b.type='button';b.className='shell-side-link';b.setAttribute('data-nav',id);b.setAttribute('data-v8-menu','1');b.innerHTML='<i class="ph '+icon+'"></i><span>'+label+'</span>';b.onclick=fn;return b};
    var importBtn=qs('[data-nav="importar"]',section)||make('importar','ph-database','Importar dados',function(){G.renderBanco&&G.renderBanco();setActive('importar')});
    var labelBtn=qs('[data-nav="etiquetas"]',section)||make('etiquetas','ph-barcode','Etiquetas de cartuchos',function(){G.abrirEtiquetas&&G.abrirEtiquetas()});
    importBtn.setAttribute('data-v8-menu','1'); labelBtn.setAttribute('data-v8-menu','1');
    var anchor=qs('[data-nav="buscador-escola"]',section);section.insertBefore(importBtn,anchor||null);section.insertBefore(labelBtn,anchor||null);
  }
  function renderEtiquetas(){
    var el=ensureView('etiquetas');hideViews();el.classList.remove('hidden');setActive('etiquetas');
    var c=safe(function(){return (((G.db||{}).config||{}).cartuchosRecargas||{}).etiquetas||{}})||{};
    var pure=G.CARTUCHOS_ETIQUETAS_PURE||{};var cap=Number(pure.ETQ_CAPACIDADE||126);var ini=Number(c.proximoNumero||1);
    el.innerHTML='<div class="v8-menu-page"><div class="flex flex-wrap justify-between gap-3 items-center"><div><h1 class="text-[22px] font-bold">Etiquetas de cartuchos</h1><p class="text-sm text-slate-500 mt-1">Menu independente para configurar e imprimir as etiquetas, sem abrir Preferências.</p></div><button class="neo-btn primary" type="button" id="v8-print-labels"><i class="ph ph-printer"></i> Imprimir</button></div><div class="rounded-[18px] border bg-white p-6 mt-5"><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><label class="v8-field">Número inicial<input id="v8-etq-ini" type="number" min="1" value="'+ini+'"></label><label class="v8-field">Número final<input id="v8-etq-fim" type="number" min="1" value="'+(ini+cap-1)+'"></label><label class="v8-field">Colunas<input id="v8-etq-col" type="number" min="1" max="12" value="'+Number(c.colunas||7)+'"></label><label class="v8-field">Linhas<input id="v8-etq-lin" type="number" min="1" max="30" value="'+Number(c.linhas||18)+'"></label></div><div id="v8-etq-preview" class="mt-5"></div><p class="text-xs text-slate-500 mt-4">As etiquetas usam somente números e código de barras. O menu não compartilha estado visual com Preferências.</p></div></div>';
    function preview(){var col=Math.max(1,Number(qs('#v8-etq-col').value||7)),lin=Math.max(1,Number(qs('#v8-etq-lin').value||18)),start=Number(qs('#v8-etq-ini').value||1),n=Math.min(col*lin,cap);qs('#v8-etq-preview').innerHTML='<div class="v8-etq-grid" style="--etq-cols:'+col+'">'+Array.from({length:n},function(_,i){return '<div class="v8-etq-cell"><span class="v8-mini-bars"></span><b>'+(start+i)+'</b></div>'}).join('')+'</div>'}
    qsa('#v8-etq-ini,#v8-etq-col,#v8-etq-lin').forEach(function(x){x.oninput=preview});preview();
    qs('#v8-print-labels').onclick=function(){var a=Number(qs('#v8-etq-ini').value||1),b=Number(qs('#v8-etq-fim').value||a+cap-1);if(typeof G.imprimirEtiquetasCartucho==='function'){var old=qs('#cart-etq-inicio');if(old){old.value=a;var f=qs('#cart-etq-fim');if(f)f.value=b}G.imprimirEtiquetasCartucho()}else if(typeof G.toast==='function')G.toast('O módulo de etiquetas ainda está carregando.','info')};
  }
  G.abrirEtiquetas=renderEtiquetas;
  G.renderMenuShellV8000=function(){safe(independentMenus);darkCss();applyTheme(loadTheme());};
  G.renderMenuShellV8000();
  new MutationObserver(function(){safe(independentMenus);if(themeOn())applyTheme(true)}).observe(document.body,{childList:true,subtree:true});
  setTimeout(G.renderMenuShellV8000,250);setTimeout(G.renderMenuShellV8000,1000);
  console.log('[DIGICOPY] menu_shell_v8000 carregado: fontes únicas de shell/importação/etiquetas/tema');
})();
