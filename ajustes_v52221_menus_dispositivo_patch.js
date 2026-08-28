// ═══════════════════════════════════════════════════════════════════════════
// v5.22.21 — Menus só deste dispositivo + editor nas Configurações
// • Layout não sobe na nuvem e não muda os outros PCs
// • Some o botão Menus da faixa azul
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var KEY_MENUS = 'digicopy_ui_menus_dispositivo_v1';
var KEY_ATALHOS = 'digicopy_ui_atalhos_dispositivo_v1';

function lerJson(chave){
  try{
    var raw = localStorage.getItem(chave);
    if(!raw) return null;
    var o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : null;
  }catch(e){ return null; }
}
function gravarJson(chave, valor){
  try{ localStorage.setItem(chave, JSON.stringify(valor)); return true; }
  catch(e){ return false; }
}
function migrarSeVazio(){
  if(typeof db === 'undefined' || !db || !db.config) return;
  if(!lerJson(KEY_MENUS) && db.config.uiMenus) gravarJson(KEY_MENUS, db.config.uiMenus);
  if(!lerJson(KEY_ATALHOS) && db.config.uiAtalhos) gravarJson(KEY_ATALHOS, db.config.uiAtalhos);
}
function tirarDaNuvem(){
  if(typeof db === 'undefined' || !db || !db.config) return false;
  var mudou = false;
  if(db.config.uiMenus){ delete db.config.uiMenus; mudou = true; }
  if(db.config.uiAtalhos){ delete db.config.uiAtalhos; mudou = true; }
  return mudou;
}

window.MENUS_DISPOSITIVO_PURE = {
  KEY_MENUS: KEY_MENUS,
  KEY_ATALHOS: KEY_ATALHOS,
  lerJson: lerJson,
  gravarJson: gravarJson
};

if(typeof document === 'undefined') return;

function comLayoutLocal(fn){
  if(typeof db === 'undefined') return fn();
  db.config = db.config || {};
  migrarSeVazio();
  var prevM = db.config.uiMenus;
  var prevA = db.config.uiAtalhos;
  var localM = lerJson(KEY_MENUS);
  var localA = lerJson(KEY_ATALHOS);
  if(localM) db.config.uiMenus = localM;
  if(localA) db.config.uiAtalhos = localA;
  try{ return fn(); }
  finally{
    if(prevM === undefined) delete db.config.uiMenus; else db.config.uiMenus = prevM;
    if(prevA === undefined) delete db.config.uiAtalhos; else db.config.uiAtalhos = prevA;
  }
}

function tirarBotaoMenus(){
  var row = document.querySelector('.module-row');
  if(!row) return;
  Array.from(row.querySelectorAll('.module')).forEach(function(mod){
    var b = mod.querySelector('button');
    if(!b) return;
    var t = String(b.textContent || '').replace(/\s+/g,' ').trim();
    if(t === 'Menus' || /Editar ordem/.test(b.getAttribute('title')||'')){
      mod.remove();
    }
  });
}

if(typeof window.pintarMenus === 'function' && !window.pintarMenus.__v52221dev){
  var oldPintar = window.pintarMenus;
  window.pintarMenus = function(){
    var r = comLayoutLocal(function(){ return oldPintar.apply(this, arguments); }.bind(this));
    tirarBotaoMenus();
    return r;
  };
  window.pintarMenus.__v52221dev = true;
}

if(typeof window.pintarAtalhos === 'function' && !window.pintarAtalhos.__v52221dev){
  var oldAtalhos = window.pintarAtalhos;
  window.pintarAtalhos = function(){
    return comLayoutLocal(function(){ return oldAtalhos.apply(this, arguments); }.bind(this));
  };
  window.pintarAtalhos.__v52221dev = true;
}

if(typeof window.abrirEditorMenus === 'function' && !window.abrirEditorMenus.__v52221dev){
  var oldAbrir = window.abrirEditorMenus;
  window.abrirEditorMenus = function(){
    return comLayoutLocal(function(){ return oldAbrir.apply(this, arguments); }.bind(this));
  };
  window.abrirEditorMenus.__v52221dev = true;
}

if(typeof window.abrirEditorAtalhos === 'function' && !window.abrirEditorAtalhos.__v52221dev){
  var oldAbrirA = window.abrirEditorAtalhos;
  window.abrirEditorAtalhos = function(){
    return comLayoutLocal(function(){ return oldAbrirA.apply(this, arguments); }.bind(this));
  };
  window.abrirEditorAtalhos.__v52221dev = true;
}

if(typeof window.salvarEditorMenus === 'function' && !window.salvarEditorMenus.__v52221dev){
  var oldSalvar = window.salvarEditorMenus;
  window.salvarEditorMenus = function(){
    var r = oldSalvar.apply(this, arguments);
    if(typeof db !== 'undefined' && db.config && db.config.uiMenus){
      gravarJson(KEY_MENUS, db.config.uiMenus);
    }
    if(tirarDaNuvem() && typeof saveDB === 'function') saveDB();
    if(typeof window.pintarMenus === 'function') window.pintarMenus();
    return r;
  };
  window.salvarEditorMenus.__v52221dev = true;
}

if(typeof window.salvarEditorAtalhos === 'function' && !window.salvarEditorAtalhos.__v52221dev){
  var oldSalvarA = window.salvarEditorAtalhos;
  window.salvarEditorAtalhos = function(){
    var r = oldSalvarA.apply(this, arguments);
    if(typeof db !== 'undefined' && db.config && db.config.uiAtalhos){
      gravarJson(KEY_ATALHOS, db.config.uiAtalhos);
    }
    if(tirarDaNuvem() && typeof saveDB === 'function') saveDB();
    if(typeof window.pintarAtalhos === 'function') window.pintarAtalhos();
    return r;
  };
  window.salvarEditorAtalhos.__v52221dev = true;
}

function cardMenusConfig(){
  var grid = document.querySelector('#view-config .grid') || document.getElementById('view-config');
  if(!grid || document.getElementById('ui-menus-dispositivo-card')) return;
  var card = document.createElement('div');
  card.id = 'ui-menus-dispositivo-card';
  card.className = 'rounded-[16px] bg-white border p-6';
  card.innerHTML = '<h4 class="font-bold text-[14px]"><i class="ph ph-squares-four"></i> Menus deste computador</h4>'+
    '<p class="text-[12px] text-slate-500 mt-1">Ordem e nome valem só neste aparelho. Não muda os outros PCs e não sobe na nuvem.</p>'+
    '<button type="button" id="ui-menus-dispositivo-btn" class="mt-4 h-10 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]">Editar menus</button>';
  grid.appendChild(card);
  document.getElementById('ui-menus-dispositivo-btn').onclick = function(){
    if(typeof window.abrirEditorMenus === 'function') window.abrirEditorMenus();
  };
}

if(typeof window.renderConfig === 'function' && !window.renderConfig.__v52221menus){
  var oldCfg = window.renderConfig;
  window.renderConfig = function(){
    var r = oldCfg.apply(this, arguments);
    setTimeout(cardMenusConfig, 220);
    setTimeout(cardMenusConfig, 600);
    return r;
  };
  window.renderConfig.__v52221menus = true;
}

setTimeout(function(){
  migrarSeVazio();
  if(tirarDaNuvem() && typeof saveDB === 'function') saveDB();
  if(typeof window.pintarMenus === 'function') window.pintarMenus();
  cardMenusConfig();
}, 700);

console.log('[DIGICOPY] v5.22.21 menus só deste dispositivo');
})();
