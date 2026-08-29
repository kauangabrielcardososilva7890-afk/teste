// PATCH v5.22.51 — Resiliência de inicialização do .exe, guardas anti-tela branca e sincronização de versão
(function(){
  'use strict';

  var VERSAO = '5.22.51';

  var EXE_RESILIENCIA_V52251_PURE = {
    VERSAO: VERSAO,
    antiTelaBranca: true,
    recuperacaoAutomatica: true,
    verificarSessaoSegura: function(sess){
      if(!sess) return { logado: false, nome: '-', login: '-' };
      return {
        logado: true,
        nome: String(sess.usuarioNome || sess.login || '-'),
        login: String(sess.login || '-')
      };
    },
    sincronizarVersaoVisual: function(v){
      return 'v' + (v || VERSAO);
    }
  };

  if(typeof window !== 'undefined'){
    window.EXE_RESILIENCIA_V52251_PURE = EXE_RESILIENCIA_V52251_PURE;

    if(window.__v52251_resiliencia_loaded) return;
    window.__v52251_resiliencia_loaded = true;

    // Atualiza versão no DOM
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

    // Guarda global anti-tela branca: se o DOM travar na inicialização, recupera login ou app
    function assegurarInicializacao(){
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
        console.warn('[DIGICOPY] Recuperação de inicialização:', err);
      }
      sincronizarVersao();
    }

    // Handler global para capturar erros e evitar tela branca silenciosa
    if(typeof window.addEventListener === 'function'){
      window.addEventListener('error', function(event){
        console.error('[DIGICOPY Error Guard]', event && event.message, event && event.filename, event && event.lineno);
        // Se não há nada visível no login nem no app shell, recupera
        setTimeout(function(){
          try{
            if(typeof document === 'undefined') return;
            var login = document.getElementById('login-screen');
            var app = document.getElementById('app-shell');
            var ambosOcultos = (!login || login.classList.contains('hidden') || login.style.display === 'none') &&
                               (!app || app.classList.contains('hidden') || app.style.display === 'none');
            if(ambosOcultos){
              assegurarInicializacao();
            }
          }catch(e){}
        }, 300);
      });
    }

    // Hook no navigateTo para sincronizar versão sem MutationObserver
    if(typeof window.navigateTo === 'function' && !window.navigateTo.__v52251nav){
      var oldN = window.navigateTo;
      window.navigateTo = function(){
        var r = oldN.apply(this, arguments);
        try{ sincronizarVersao(); }catch(e){}
        return r;
      };
      window.navigateTo.__v52251nav = true;
    }

    // Executa sincronização e guardas
    if(typeof document !== 'undefined'){
      if(document.readyState === 'loading' && typeof document.addEventListener === 'function'){
        document.addEventListener('DOMContentLoaded', function(){
          assegurarInicializacao();
        });
      }else{
        assegurarInicializacao();
      }
    }

    if(typeof setTimeout === 'function'){
      setTimeout(assegurarInicializacao, 50);
      setTimeout(assegurarInicializacao, 300);
      setTimeout(assegurarInicializacao, 1000);
    }

    console.log('[DIGICOPY] v' + VERSAO + ': Resiliência de boot e guarda anti-tela branca carregados.');
  }

  if(typeof module !== 'undefined' && module.exports){
    module.exports = { EXE_RESILIENCIA_V52251_PURE: EXE_RESILIENCIA_V52251_PURE };
  }
})();
