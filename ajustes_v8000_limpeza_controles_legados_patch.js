// v8.0.0 — controles temporários de correção não fazem parte do produto final.
// As rotinas continuam no código para compatibilidade de dados, mas seus
// botões não devem aparecer na operação normal.
(function(){
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined'||window.__v8000LimpezaControles) return;
  window.__v8000LimpezaControles=true;
  var IDS={'btn-clientes-duplicados':1,'btn-usuarios-duplicados':1};
  function remover(){
    var shell=document.getElementById('app-shell'), login=document.getElementById('login-screen');
    var sessao=typeof window.getSession==='function' ? window.getSession() : null;
    if(shell && login && sessao && !login.classList.contains('hidden')) login.classList.add('hidden');
    if(shell && login && login.classList.contains('hidden') && !shell.classList.contains('hidden')){
      var portao=document.getElementById('v5262-portao');
      if(portao) portao.remove();
    }
    Object.keys(IDS).forEach(function(id){ var el=document.getElementById(id); if(el) el.remove(); });
    document.querySelectorAll('button').forEach(function(b){
      var t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(/^🔗?\s*vincular cliente$/.test(t)||/^desfazer última união/.test(t)||/^unir em 1 cadastro$/.test(t)||/^manter o principal, desativar repetidos$/.test(t)) b.remove();
    });
  }
  remover();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',remover);
  setTimeout(remover,100); setTimeout(remover,500); setTimeout(remover,1500);
  try{ new MutationObserver(remover).observe(document.body,{childList:true,subtree:true}); }catch(e){}
  // Último guard de navegação: alguns patches antigos fecham a classe no
  // próximo tick. Reaplica somente para o pai clicado, sem impedir itens do submenu.
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('.module-row .module > button'):null;
    if(!b) return;
    var m=b.parentElement;
    if(!m||!m.querySelector(':scope > .module-menu')) return;
    [0,40,140,320].forEach(function(ms){ setTimeout(function(){
      if(document.activeElement===b || m.matches(':hover') || ms===0) m.classList.add('sfo-pin');
    },ms); });
  },true);
})();
