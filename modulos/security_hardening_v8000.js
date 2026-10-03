/* DIGICOPY v8.0.0 — endurecimento defensivo do cliente.
 * Não substitui a proteção do Worker: adiciona fail-closed no setup,
 * whitelist de endpoints Cloudflare e atraso/bloqueio para tentativa local.
 */
(function(){
  'use strict';
  var OFICIAL = 'digicopy-sync-api.digicopyonline.workers.dev';
  var STATE_KEY = 'digicopy_login_guard_v8000';
  var MAX_FAILS = 5;
  var WINDOW_MS = 60 * 1000;
  var BASE_LOCK_MS = 30 * 1000;
  var MAX_LOCK_MS = 15 * 60 * 1000;

  function hostPermitido(host){
    host = String(host || '').toLowerCase().replace(/\.$/, '');
    return host === OFICIAL || (host.endsWith('.workers.dev') && host.length > '.workers.dev'.length);
  }
  function normalizarApiUrl(value){
    var raw = String(value == null ? '' : value).trim().replace(/\/+$/, '');
    if(!raw) return 'https://' + OFICIAL;
    try{
      var u = new URL(raw);
      if(u.protocol !== 'https:' || u.username || u.password || u.port || u.pathname !== '/' || u.search || u.hash || !hostPermitido(u.hostname)) return 'https://' + OFICIAL;
      return 'https://' + u.hostname;
    }catch(e){ return 'https://' + OFICIAL; }
  }
  function urlValida(value){
    var raw = String(value == null ? '' : value).trim();
    return !raw || normalizarApiUrl(raw) === raw.replace(/\/+$/, '');
  }
  if(typeof window !== 'undefined'){
    window.DIGICOPY_SECURITY = window.DIGICOPY_SECURITY || {};
    window.DIGICOPY_SECURITY.OFICIAL_HOST = OFICIAL;
    window.DIGICOPY_SECURITY.normalizarApiUrl = normalizarApiUrl;
    window.DIGICOPY_SECURITY.urlValida = urlValida;
  }
  if(typeof document === 'undefined') return;

  function lerEstado(){
    try{ return JSON.parse(localStorage.getItem(STATE_KEY) || '{}') || {}; }catch(e){ return {}; }
  }
  function salvarEstado(s){
    try{ localStorage.setItem(STATE_KEY, JSON.stringify(s)); }catch(e){}
  }
  function aviso(msg, tipo){
    try{ if(typeof window.toast === 'function') window.toast(msg, tipo || 'error'); else if(typeof window.mostrarAvisoSistema === 'function') window.mostrarAvisoSistema(msg, tipo || 'error'); }catch(e){}
  }
  function setupApi(){
    try{
      var cfg = (typeof db !== 'undefined' && db && db.config) ? db.config : {};
      return normalizarApiUrl(cfg && cfg.nuvem && cfg.nuvem.apiUrl);
    }catch(e){ return 'https://' + OFICIAL; }
  }
  async function remotoPermiteSetup(){
    try{
      var controller = new AbortController();
      var timer = setTimeout(function(){ controller.abort(); }, 5000);
      var res = await fetch(setupApi() + '/v1/setup-status', { method:'GET', cache:'no-store', signal:controller.signal });
      clearTimeout(timer);
      if(!res.ok) return false;
      var data = await res.json();
      return data && data.ok === true && data.configured === false;
    }catch(e){
      // Falha fechada: sem confirmação do Worker, não criamos administrador local.
      return false;
    }
  }
  window.DIGICOPY_SECURITY.remotoPermiteSetup = remotoPermiteSetup;

  // A URL também é revalidada no momento de salvar/trocar a configuração.
  var oldValidar = window.SETUP_COMERCIAL_PURE && window.SETUP_COMERCIAL_PURE.validarSetup;
  if(oldValidar){
    var oldPure = oldValidar;
    window.SETUP_COMERCIAL_PURE.validarSetup = function(d){
      var erros = oldPure(d);
      if(d && d.apiUrl && !urlValida(d.apiUrl)) erros.push('Endereço permitido: https://*.workers.dev');
      return erros;
    };
  }

  // Proteção adicional do login local. A autenticação real da nuvem continua
  // protegida no Worker; este bloqueio impede tentativas automáticas no browser.
  var oldLogin = window.doLoginUser;
  if(typeof oldLogin === 'function' && !oldLogin.__v8000Security){
    var guardedLogin = async function(){
      var now = Date.now();
      var state = lerEstado();
      if(Number(state.blockedUntil || 0) > now){
        var wait = Math.max(1, Math.ceil((state.blockedUntil - now) / 1000));
        aviso('Muitas tentativas. Aguarde ' + wait + ' segundos.', 'error');
        return false;
      }
      if(Number(state.windowStartedAt || 0) + WINDOW_MS <= now){ state = {}; }
      state.windowStartedAt = state.windowStartedAt || now;
      state.attempts = Number(state.attempts || 0) + 1;
      salvarEstado(state);
      await new Promise(function(resolve){ setTimeout(resolve, Math.min(1500, 250 * Math.max(1, state.attempts))); });
      var before = document.getElementById('login-screen');
      try{ await oldLogin.apply(this, arguments); }catch(e){ throw e; }
      var shell = document.getElementById('app-shell');
      var logged = !!(shell && !shell.classList.contains('hidden') && shell.style.display !== 'none');
      if(logged){
        try{ localStorage.removeItem(STATE_KEY); }catch(e){}
        return true;
      }
      state.failures = Number(state.failures || 0) + 1;
      if(state.failures >= MAX_FAILS){
        var exp = Math.min(6, state.failures - MAX_FAILS);
        state.blockedUntil = Date.now() + Math.min(MAX_LOCK_MS, BASE_LOCK_MS * Math.pow(2, exp));
      }
      salvarEstado(state);
      return false;
    };
    guardedLogin.__v8000Security = true;
    window.doLoginUser = guardedLogin;
  }

  // O fluxo de setup é controlado por abrirSetupControlado no módulo v5900.
  // Mantemos aqui apenas a função remota, em modo fail-closed.

})();
