/* DIGICOPY v8.0.0 — camada final de layout
 * Não reconstrói telas nem chama renderizadores. Apenas fixa a apresentação depois
 * que módulos legados terminam de inicializar, evitando piscadas e sobreposição.
 */
(function(){
  'use strict';
  if(typeof document==='undefined') return;
  const STYLE_ID='digicopy-v8000-final-layout';
  const LEGACY_SELECTORS=[
    '.modern-topnav','.classic-toolbar','.classic-toolbar-scroll','.command-row',
    '.ribbon-actions','.module-row','.statusbar','.wxr-bar','.wxr-wrap',
    '.sxvm-fly','.sxvm-menu','.topmod','.module-menu',
    '[id^="topmod-"]','[id^="menu-"]'
  ];
  function css(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=`
      /* Shell oficial v8: uma única navegação, sem barra herdada */
      .modern-topnav,.classic-toolbar,.classic-toolbar-scroll,.command-row,
      .ribbon-actions,.module-row,.statusbar,.wxr-bar,.wxr-wrap,
      .sxvm-fly,.sxvm-menu,.topmod,[id^="topmod-"],[id^="menu-"]{display:none!important}
      #app-shell>div>main{margin-left:220px!important;min-height:100vh!important;background:#fff!important}
      #app-shell>div>main>.flex-1{padding:0!important;background:#fff!important}
      #app-shell>div>main>.flex-1>.view{padding:0 30px 36px!important;background:#fff!important;min-height:calc(100vh - 60px);overflow:visible!important}
      #app-shell>div>main>.flex-1>#view-dashboard{padding:0!important}
      #sidebar{display:flex!important;visibility:visible!important}
      .view .classic-window,.view .classic-title,.view .classic-fieldset{border-radius:16px!important;box-shadow:0 6px 24px rgba(15,23,42,.06)!important}
      .view .classic-toolbar,.view .classic-toolbar-scroll,.view .command-row{display:none!important}
      @media(max-width:900px){
        #app-shell>div>main{margin-left:0!important}
        #app-shell>div>main>.flex-1>.view{padding:0 12px 28px!important}
        #sidebar{width:280px!important;position:fixed!important;inset:0 auto 0 0!important;z-index:60!important}
        #sidebar.-translate-x-full{transform:translateX(-100%)!important}
        #sidebar:not(.-translate-x-full){transform:translateX(0)!important}
      }
    `;
    document.head.appendChild(s);
  }
  function hideLegacy(){
    LEGACY_SELECTORS.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{
      if(el.id==='sidebar' || el.closest('#shell-sidebar-links')) return;
      el.setAttribute('data-v8-legacy-hidden','1');
      el.style.setProperty('display','none','important');
    }));
  }
  function apply(){ css(); hideLegacy(); document.documentElement.classList.add('digicopy-v8000-layout'); }
  apply();
  if(typeof MutationObserver!=='undefined'){
    const obs=new MutationObserver(()=>apply());
    obs.observe(document.body,{childList:true,subtree:true});
  }
  const oldBuild=window.buildNav;
  if(typeof oldBuild==='function'&&!oldBuild.__v8000FinalLayout){
    window.buildNav=function(){ const r=oldBuild.apply(this,arguments); apply(); return r; };
    window.buildNav.__v8000FinalLayout=true;
  }
  const oldNav=window.navigateTo;
  if(typeof oldNav==='function'&&!oldNav.__v8000FinalLayout){
    window.navigateTo=function(){ const r=oldNav.apply(this,arguments); apply(); return r; };
    window.navigateTo.__v8000FinalLayout=true;
  }
  console.log('[DIGICOPY] layout_final_v8000 ativo — shell único, sem barra legada');
})();
