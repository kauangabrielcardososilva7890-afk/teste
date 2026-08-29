// ═══════════════════════════════════════════════════════════════════════════
// v5.22.22 — Editor de menus: só arrastar, sem setas
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function esconderSetas(){
  var ed = document.getElementById('ui-menus-ed');
  if(!ed) return 0;
  var n = 0;
  ed.querySelectorAll('button').forEach(function(b){
    var t = String(b.textContent||'').replace(/\s+/g,'').trim();
    if(t==='↑' || t==='↓'){ b.style.display='none'; n++; }
  });
  return n;
}

window.MENUS_ARRASTAR_SO_PURE = { esconderSetas: esconderSetas };

if(typeof document==='undefined') return;

function depoisDeAbrir(){
  setTimeout(esconderSetas, 20);
  setTimeout(esconderSetas, 80);
  setTimeout(esconderSetas, 200);
}

if(typeof window.abrirEditorMenus==='function' && !window.abrirEditorMenus.__v52222drag){
  var old = window.abrirEditorMenus;
  window.abrirEditorMenus = function(){
    var r = old.apply(this, arguments);
    depoisDeAbrir();
    return r;
  };
  window.abrirEditorMenus.__v52222drag = true;
}

console.log('[DIGICOPY] v5.22.22 menus só arrastar');
})();
