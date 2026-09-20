// ═══════════════════════════════════════════════════════════════════════════
// v5.22.34 — Aviso de salvo nas Configurações
// • Qualquer botão Salvar do menu Configurações abre o aviso do sistema.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function ehBotaoSalvar(el){
  if(!el || el.tagName!=='BUTTON') return false;
  var t=String(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  return t.indexOf('salvar')>=0;
}

window.CONFIG_AVISO_SALVOU_PURE = { ehBotaoSalvar: ehBotaoSalvar };

if(typeof document==='undefined') return;

function avisoSalvou(){
  if(window.__cfgAvisoSalvouLock) return;
  window.__cfgAvisoSalvouLock=1;
  setTimeout(function(){ window.__cfgAvisoSalvouLock=0; }, 500);
  if(typeof window.lfbAlert==='function') window.lfbAlert('Salvo.','Salvo');
  else if(typeof toast==='function') toast('Salvo.','success');
}

function wrapFn(nome){
  var fn=window[nome];
  if(typeof fn!=='function' || fn.__v52234salvo) return;
  var old=fn;
  window[nome]=function(){
    var r=old.apply(this, arguments);
    avisoSalvou();
    return r;
  };
  window[nome].__v52234salvo=true;
}

function wrapNfe(){
  var btn=document.getElementById('nfe-salvar');
  if(!btn || btn.__v52234salvo) return;
  var old=btn.onclick;
  btn.onclick=function(ev){
    var r;
    if(typeof old==='function') r=old.call(this, ev);
    avisoSalvou();
    return r;
  };
  btn.__v52234salvo=true;
}

['saveConfig','salvarDadosLojaFinal','pixSalvarConfig','salvarTemplatesRTF','salvarEditorMenus','salvarEditorAtalhos'].forEach(wrapFn);

if(typeof window.renderConfig==='function' && !window.renderConfig.__v52234salvo){
  var oldCfg=window.renderConfig;
  window.renderConfig=function(){
    var r=oldCfg.apply(this, arguments);
    setTimeout(function(){ wrapFn('saveConfig'); wrapFn('salvarDadosLojaFinal'); wrapFn('pixSalvarConfig'); wrapFn('salvarTemplatesRTF'); wrapNfe(); }, 280);
    setTimeout(wrapNfe, 750);
    return r;
  };
  window.renderConfig.__v52234salvo=true;
}

if(!window.__v52234salvoClick){
  window.__v52234salvoClick=true;
  document.addEventListener('click', function(e){
    var view=document.getElementById('view-config');
    if(!view || view.classList.contains('hidden')) return;
    var b=e.target && e.target.closest ? e.target.closest('button') : null;
    if(!b || !view.contains(b)) return;
    if(!ehBotaoSalvar(b)) return;
    setTimeout(avisoSalvou, 0);
  }, true);
}

console.log('[DIGICOPY] v5.22.34 aviso de salvo nas Configurações');
})();
