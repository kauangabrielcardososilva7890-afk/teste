// ════════════════════════════════════════════════════
// v5.22.66 — Banner "tem versão nova" (r64, pedido do dono 30/09).
// O testador testa enquanto o sistema atualiza: quem fica com a página
// aberta numa versão velha vê um aviso no topo com a versão nova e um
// botão Recarregar. Silencioso quando: sem rede, mesma versão, erro.
// ════════════════════════════════════════════════════
(function(){
'use strict';

/* VERSAONOVA_PURE_START */
function versaoNova(atual, nova){
  var a=String(atual==null?'':atual).trim(), n=String(nova==null?'':nova).trim();
  if(!a || !n || a===n) return false;
  return true;
}
function extraiVersao(html){
  var m=/DIGICOPY_APP_VERSION\s*=\s*['"]([^'"]+)['"]/.exec(String(html==null?'':html));
  return m?m[1]:'';
}
/* VERSAONOVA_PURE_END */

try{ if(typeof window!=='undefined'){ window.versaoNovaUteis=window.versaoNovaUteis||{ versaoNova:versaoNova, extraiVersao:extraiVersao }; } }catch(ePU){}
if(typeof window==='undefined' || typeof document==='undefined') return;

var ATUAL=String(window.DIGICOPY_APP_VERSION||'');
var SNOOZE='__digicopy_ver_snooze_ate';
var ULTIMA=0;

function snoozed(){
  try{
    var ate=Number(window.localStorage?window.localStorage.getItem(SNOOZE):0)||0;
    return Date.now()<ate;
  }catch(e){ return false; }
}
function snooze(min){
  try{ if(window.localStorage) window.localStorage.setItem(SNOOZE, String(Date.now()+min*60000)); }catch(e){}
}
function esconder(){
  try{
    var b=document.getElementById('versao-nova-banner');
    if(b && b.parentNode) b.parentNode.removeChild(b);
  }catch(e){}
  try{ window.__DIGICOPY_VERSAO_NOVA=null; }catch(e2){}
}
function mostrar(nova){
  try{ window.__DIGICOPY_VERSAO_NOVA={ atual:ATUAL, nova:nova }; }catch(e){}
  var b=document.getElementById('versao-nova-banner');
  if(!b){
    b=document.createElement('div');
    b.id='versao-nova-banner';
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#b45309;color:#fff;font-size:13px;font-weight:700;padding:10px 14px;display:flex;gap:10px;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,.25)';
    document.body.appendChild(b);
  }
  b.innerHTML='';
  var t=document.createElement('span');
  t.textContent='Tem versão nova ('+nova+') — você está na '+ATUAL+'. Recarregue para testar o novo.';
  var rec=document.createElement('button');
  rec.textContent='Recarregar agora';
  rec.style.cssText='background:#fff;color:#92400e;border:0;border-radius:8px;padding:6px 12px;font-weight:800;cursor:pointer';
  rec.onclick=function(){ try{ window.location.reload(); }catch(e){} };
  var x=document.createElement('button');
  x.textContent='X';
  x.title='Avisar depois (30 min)';
  x.style.cssText='background:transparent;color:#fff;border:1px solid #fff;border-radius:8px;padding:6px 10px;font-weight:800;cursor:pointer';
  x.onclick=function(){ snooze(30); esconder(); };
  b.appendChild(t); b.appendChild(rec); b.appendChild(x);
}
async function conferir(){
  if(!ATUAL || snoozed()) return;
  if(Date.now()-ULTIMA<60000) return;
  ULTIMA=Date.now();
  try{
    var r=await fetch('index.html',{ cache:'no-store' });
    if(!r || !r.ok) return;
    var html=await r.text();
    var nova=extraiVersao(html);
    if(versaoNova(ATUAL,nova)) mostrar(nova);
    else esconder();
  }catch(e){}
}

try{
  setTimeout(conferir, 15000);
  setInterval(conferir, 5*60*1000);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) conferir(); });
  window.addEventListener('focus', conferir);
}catch(e){}

  // v8.0.0 — controles temporários de correção não fazem parte do produto final.
  // Mantemos as rotinas de dados para compatibilidade, mas não exibimos os botões.
  (function(){
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
  // Fonte única para módulos não fiscais: captura o clique antes dos
  // onclick legados e torna abrir/fechar determinístico.
  document.addEventListener('click', function(e){
    if(e.defaultPrevented || !e.target || !e.target.closest) return;
    var b=e.target.closest('.module-row .module > button');
    var m=b && b.parentElement;
    var menu=m && m.querySelector(':scope > .module-menu');
    if(!b || !menu || m.querySelector('#menu-nfe')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    document.querySelectorAll('.module.sfo-pin').forEach(function(x){ if(x!==m) x.classList.remove('sfo-pin'); });
    m.classList.toggle('sfo-pin');
  }, true);
  })();

})();
