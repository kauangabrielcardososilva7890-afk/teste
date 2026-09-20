// ═══════════════════════════════════════════════════════════════════════════
// v5.22.39 — Menus aparecem na hora (não somem e voltam depois).
//            Continua oculto só o que é por permissão (Backup/Nuvem) ou
//            marcado Oculto para quem não é Admin.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function idsMenus(list){
  return (list||[]).map(function(m){ return m&&m.id; }).filter(Boolean).join(',');
}

function garantirLocacao(list){
  return (list||[]).map(function(m){
    if(!m || m.id!=='locacao') return m;
    var c=Object.assign({}, m);
    var items=(m.items||[]).slice();
    function tem(id){ return items.some(function(it){ return it.id===id; }); }
    if(!tem('parque')) items.push({id:'parque', icon:'ph-map-pin', label:'Máquinas nos clientes', click:"navigateTo('parque')"});
    if(!tem('leituras')) items.push({id:'leituras', icon:'ph-speedometer', label:'Leituras', click:"navigateTo('leituras')"});
    c.items=items;
    return c;
  });
}

window.V52239_MENUS_PURE = {
  idsMenus: idsMenus,
  garantirLocacao: garantirLocacao
};

if(typeof document==='undefined') return;

if(window.MENUS_ATALHOS_PURE && typeof window.MENUS_ATALHOS_PURE.menusPadrao==='function' && !window.MENUS_ATALHOS_PURE.menusPadrao.__v52239loc){
  var oldPad=window.MENUS_ATALHOS_PURE.menusPadrao;
  window.MENUS_ATALHOS_PURE.menusPadrao=function(){
    return garantirLocacao(oldPad.apply(this, arguments)||[]);
  };
  window.MENUS_ATALHOS_PURE.menusPadrao.__v52239loc=true;
}

function pintarAgora(forcar){
  if(typeof window.pintarMenus!=='function') return;
  if(forcar) window.__v52239MenuSess=null;
  window.pintarMenus();
}

if(typeof window.pintarMenus==='function' && !window.pintarMenus.__v52239once){
  var oldP=window.pintarMenus;
  window.pintarMenus=function(){
    var row=document.querySelector('.module-row');
    var sess=typeof getSession==='function'?getSession():null;
    var key=(sess&&sess.usuarioId)||'anon';
    if(row && row.getAttribute('data-v52239-ok')==='1' && window.__v52239MenuSess===key){
      return;
    }
    var r=oldP.apply(this, arguments);
    var row2=document.querySelector('.module-row');
    if(row2){
      row2.setAttribute('data-v52239-ok','1');
      Array.from(row2.querySelectorAll('.module')).forEach(function(mod){
        var b=mod.querySelector('button');
        var t=String(b&&b.textContent||'').replace(/\s+/g,' ').trim();
        if(t==='Menus' || /Editar ordem/.test((b&&b.getAttribute('title'))||'')){
          mod.remove();
        }
      });
    }
    window.__v52239MenuSess=key;
    return r;
  };
  window.pintarMenus.__v52239once=true;
}

if(typeof window.salvarEditorMenus==='function' && !window.salvarEditorMenus.__v52239force){
  var oldS=window.salvarEditorMenus;
  window.salvarEditorMenus=function(){
    window.__v52239MenuSess=null;
    var row=document.querySelector('.module-row');
    if(row) row.removeAttribute('data-v52239-ok');
    return oldS.apply(this, arguments);
  };
  window.salvarEditorMenus.__v52239force=true;
}

if(typeof window.showApp==='function' && !window.showApp.__v52239menus){
  var oldShow=window.showApp;
  window.showApp=function(){
    var r=oldShow.apply(this, arguments);
    window.__v52239MenuSess=null;
    var row=document.querySelector('.module-row');
    if(row) row.removeAttribute('data-v52239-ok');
    pintarAgora(true);
    return r;
  };
  window.showApp.__v52239menus=true;
}

pintarAgora(true);
console.log('[DIGICOPY] v5.22.39 menus na hora, locação completa, sem piscar');
})();
