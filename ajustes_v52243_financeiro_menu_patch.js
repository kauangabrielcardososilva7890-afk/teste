// ═══════════════════════════════════════════════════════════════════════════
// v5.22.43 — Menu Financeiro único: some o submenu "Contas e caixas".
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function semSubmenuFinanceiro(list){
  return (list||[]).map(function(m){
    if(!m || m.id!=='financeiro') return m;
    var c = Object.assign({}, m);
    c.items = [];
    return c;
  });
}

window.FINANCEIRO_MENU_V52243_PURE = { semSubmenuFinanceiro: semSubmenuFinanceiro };

if(typeof document==='undefined') return;

if(window.MENUS_ATALHOS_PURE && typeof window.MENUS_ATALHOS_PURE.menusPadrao==='function' && !window.MENUS_ATALHOS_PURE.menusPadrao.__v52243fin){
  var old = window.MENUS_ATALHOS_PURE.menusPadrao;
  window.MENUS_ATALHOS_PURE.menusPadrao = function(){
    return semSubmenuFinanceiro(old.apply(this, arguments)||[]);
  };
  window.MENUS_ATALHOS_PURE.menusPadrao.__v52243fin = true;
}

function tirar(){
  var menu = document.getElementById('menu-financeiro');
  if(!menu) return;
  menu.innerHTML = '';
  if(menu.parentNode) menu.remove();
}

setTimeout(tirar, 200);
setTimeout(tirar, 800);
if(typeof window.pintarMenus==='function' && !window.pintarMenus.__v52243fin){
  var oldP = window.pintarMenus;
  window.pintarMenus = function(){
    var r = oldP.apply(this, arguments);
    tirar();
    return r;
  };
  window.pintarMenus.__v52243fin = true;
}

console.log('[DIGICOPY] v5.22.43 financeiro: menu único');
})();
