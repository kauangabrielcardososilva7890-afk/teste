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

})();
