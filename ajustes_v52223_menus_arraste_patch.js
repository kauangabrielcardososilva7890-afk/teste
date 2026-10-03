// ═══════════════════════════════════════════════════════════════════════════
// v5.22.23 — Menus: apaga as setas e o bloco segue o mouse
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function apagarSetas(root){
  if(!root) return 0;
  var n = 0;
  Array.from(root.querySelectorAll('button')).forEach(function(b){
    var t = String(b.textContent||'').replace(/\s+/g,'').trim();
    if(t==='↑' || t==='↓'){ b.remove(); n++; }
  });
  return n;
}

window.MENUS_ARRASTE_PURE = { apagarSetas: apagarSetas };

if(typeof document==='undefined') return;

function ligarSegueMouse(lista, seletor){
  if(!lista) return;
  var drag=null, ghost=null, offY=0;
  function itens(){
    return Array.from(lista.children).filter(function(el){
      return el && el.getAttribute && el.matches && el.matches(seletor);
    });
  }
  itens().forEach(function(el){
    if(el.__v52223drag) return;
    el.__v52223drag = true;
    el.removeAttribute('draggable');
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', function(e){
      if(e.button!==0) return;
      var t = e.target;
      if(t && /INPUT|TEXTAREA|SELECT|LABEL|BUTTON/.test(t.tagName)) return;
      e.preventDefault();
      drag = el;
      var r = el.getBoundingClientRect();
      offY = e.clientY - r.top;
      ghost = el.cloneNode(true);
      ghost.style.cssText = 'position:fixed;left:'+r.left+'px;width:'+r.width+'px;top:'+(e.clientY-offY)+'px;z-index:200000;pointer-events:none;opacity:.95;box-shadow:0 16px 36px rgba(15,23,42,.28);background:#fff';
      document.body.appendChild(ghost);
      el.style.opacity = '.3';
      try{ el.setPointerCapture(e.pointerId); }catch(x){}
    });
    el.addEventListener('pointermove', function(e){
      if(!drag || drag!==el) return;
      if(ghost) ghost.style.top = (e.clientY - offY)+'px';
      var outros = itens().filter(function(x){ return x!==drag; });
      var alvo = null;
      outros.forEach(function(o){
        var b = o.getBoundingClientRect();
        if(e.clientY >= b.top && e.clientY <= b.bottom) alvo = o;
      });
      if(!alvo) return;
      var mid = alvo.getBoundingClientRect().top + alvo.offsetHeight/2;
      if(e.clientY < mid){
        if(drag.nextSibling!==alvo) lista.insertBefore(drag, alvo);
      }else{
        if(alvo.nextSibling!==drag) lista.insertBefore(drag, alvo.nextSibling);
      }
    });
    function solta(){
      if(ghost){ ghost.remove(); ghost=null; }
      if(drag){ drag.style.opacity='1'; drag=null; }
    }
    el.addEventListener('pointerup', solta);
    el.addEventListener('pointercancel', solta);
  });
}

function prepararEditor(){
  var ed = document.getElementById('ui-menus-ed');
  if(!ed) return;
  apagarSetas(ed);
  ed.querySelectorAll('[draggable]').forEach(function(el){ el.removeAttribute('draggable'); });
  ligarSegueMouse(ed, '[data-mid]');
  ed.querySelectorAll('[data-subs]').forEach(function(box){
    ligarSegueMouse(box, '[data-sid]');
  });
}

if(typeof window.abrirEditorMenus==='function' && !window.abrirEditorMenus.__v52223drag){
  var old = window.abrirEditorMenus;
  window.abrirEditorMenus = function(){
    var r = old.apply(this, arguments);
    setTimeout(prepararEditor, 20);
    setTimeout(prepararEditor, 80);
    setTimeout(prepararEditor, 220);
    return r;
  };
  window.abrirEditorMenus.__v52223drag = true;
}

console.log('[DIGICOPY] v5.22.23 menus seguem o mouse, sem seta');
})();
