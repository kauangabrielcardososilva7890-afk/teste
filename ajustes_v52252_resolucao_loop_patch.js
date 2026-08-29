// PATCH v5.22.52 — Resolução definitiva de loops de MutationObserver, boot instantâneo e versão 5.22.52
(function(){
  'use strict';

  var VERSAO = '5.22.52';

  var RESOLUCAO_LOOP_V52252_PURE = {
    VERSAO: VERSAO,
    semLoopObserver: true,
    bootInstantaneo: true,
    sincronizarVersaoVisual: function(v){
      return 'v' + (v || VERSAO);
    }
  };

  if(typeof window !== 'undefined'){
    window.RESOLUCAO_LOOP_V52252_PURE = RESOLUCAO_LOOP_V52252_PURE;

    if(window.__v52252_loop_fix_loaded) return;
    window.__v52252_loop_fix_loaded = true;

    // Atualiza versão no DOM apenas se o texto for diferente (evita disparar mutações)
    function sincronizarVersao(){
      try{
        if(typeof document === 'undefined') return;
        var fv = document.getElementById('footer-version');
        if(fv && fv.textContent !== 'v' + VERSAO) fv.textContent = 'v' + VERSAO;
        var tv = document.getElementById('app-title-version');
        if(tv && tv.textContent !== 'Sistema Digicopy v' + VERSAO) tv.textContent = 'Sistema Digicopy v' + VERSAO;
        if(document.title && !document.title.includes(VERSAO)){
          document.title = 'Sistema Digicopy v' + VERSAO;
        }
      }catch(e){}
    }

    // Inicialização direta e leve
    function inicializarDireto(){
      try{
        if(typeof document === 'undefined') return;
        var sess = (typeof getSession === 'function') ? getSession() : null;
        var loginScreen = document.getElementById('login-screen');
        var appShell = document.getElementById('app-shell');

        if(!sess){
          if(loginScreen){
            loginScreen.classList.remove('hidden');
            loginScreen.style.display = 'flex';
          }
          if(appShell){
            appShell.classList.add('hidden');
          }
          if(typeof estilizarLogin === 'function') estilizarLogin();
          if(typeof renderLoginDireto === 'function' && typeof prepararEmpresaLogin === 'function'){
            renderLoginDireto(prepararEmpresaLogin());
          }
        }else{
          if(loginScreen){
            loginScreen.classList.add('hidden');
          }
          if(appShell){
            appShell.classList.remove('hidden');
          }
          if(typeof renderDashboard === 'function') renderDashboard();
          if(typeof pintarMenus === 'function') pintarMenus();
        }
      }catch(err){
        console.warn('[DIGICOPY] Inicialização 5.22.52:', err);
      }
      sincronizarVersao();
    }

    // Hook no navigateTo
    if(typeof window.navigateTo === 'function' && !window.navigateTo.__v52252nav){
      var oldN = window.navigateTo;
      window.navigateTo = function(){
        var r = oldN.apply(this, arguments);
        try{ sincronizarVersao(); }catch(e){}
        return r;
      };
      window.navigateTo.__v52252nav = true;
    }

    inicializarDireto();
    if(typeof setTimeout === 'function'){
      setTimeout(inicializarDireto, 50);
      setTimeout(inicializarDireto, 300);
    }

    console.log('[DIGICOPY] v' + VERSAO + ': Resolução de loops e inicialização instantânea ativas.');
  }

  if(typeof module !== 'undefined' && module.exports){
    module.exports = { RESOLUCAO_LOOP_V52252_PURE: RESOLUCAO_LOOP_V52252_PURE };
  }
})();
