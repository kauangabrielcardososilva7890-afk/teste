// ═══════════════════════════════════════════════════════════════════════════
// v5.22.17 — Menus arrastáveis + Nuvem/Backup só no Admin
// • Editor: arrastar menu e submenu (além das setas)
// • Backup: só Admin
// • Nuvem: Admin sempre; quem ainda não autorizou o PC também vê (colar código)
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function ehAdmin(perfil, login){
  if(String(perfil||'').trim()==='Admin') return true;
  return String(login||'').trim().toLowerCase()==='kauan';
}
function podeVerBackup(perfil, login){ return ehAdmin(perfil, login); }
function podeVerNuvem(perfil, login, temToken){
  if(ehAdmin(perfil, login)) return true;
  return !temToken;
}

window.MENUS_ARRASTAR_PURE = {
  ehAdmin: ehAdmin,
  podeVerBackup: podeVerBackup,
  podeVerNuvem: podeVerNuvem
};

if(typeof document==='undefined') return;

function sess(){ return typeof getSession==='function' ? getSession() : null; }
function sessAdmin(){ var s=sess(); return ehAdmin(s&&s.perfil, s&&s.login); }
function temTokenNuvem(){
  try{ return !!(window.DIGICOPY_CLOUD && typeof window.DIGICOPY_CLOUD.token==='function' && window.DIGICOPY_CLOUD.token()); }
  catch(e){ return false; }
}

function aplicarVisibilidadeBarra(){
  var s=sess();
  var admin=ehAdmin(s&&s.perfil, s&&s.login);
  var nuvemOk=podeVerNuvem(s&&s.perfil, s&&s.login, temTokenNuvem());
  var backup=document.getElementById('btn-backup-top');
  var nuvem=document.getElementById('btn-nuvem');
  if(backup){
    var mb=backup.closest('.module');
    var show=podeVerBackup(s&&s.perfil, s&&s.login);
    backup.style.display=show?'':'none';
    if(mb) mb.style.display=show?'':'none';
  }
  if(nuvem){
    var mn=nuvem.closest('.module');
    nuvem.style.display=nuvemOk?'':'none';
    if(mn) mn.style.display=nuvemOk?'':'none';
  }
  document.querySelectorAll('.module').forEach(function(mod){
    var btn=mod.querySelector('button');
    if(!btn) return;
    var tx=(btn.textContent||'').replace(/\s+/g,' ').trim();
    if(/^Menus$/i.test(tx)) mod.style.display=admin?'':'none';
  });
  try{ if(window.DIGICOPY_CLOUD && typeof window.DIGICOPY_CLOUD.refreshVisibility==='function') window.DIGICOPY_CLOUD.refreshVisibility(); }catch(e){}
}

if(typeof window.pintarMenus==='function' && !window.pintarMenus.__v52217vis){
  var oldPintar=window.pintarMenus;
  window.pintarMenus=function(){
    var r=oldPintar.apply(this, arguments);
    aplicarVisibilidadeBarra();
    return r;
  };
  window.pintarMenus.__v52217vis=true;
}

function ligarArraste(lista){
  if(!lista) return;
  var drag=null;
  Array.from(lista.children).forEach(function(el){
    if(!el || !el.getAttribute) return;
    if(!(el.getAttribute('data-mid')||el.getAttribute('data-subrow'))) return;
    el.setAttribute('draggable','true');
    el.style.cursor='grab';
    el.addEventListener('dragstart', function(e){
      if(e.target && (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA' || e.target.tagName==='LABEL')){
        e.preventDefault(); return;
      }
      drag=el;
      el.style.opacity='.55';
      try{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain','ok'); }catch(x){}
    });
    el.addEventListener('dragend', function(){ el.style.opacity='1'; drag=null; });
    el.addEventListener('dragover', function(e){ e.preventDefault(); });
    el.addEventListener('drop', function(e){
      e.preventDefault(); e.stopPropagation();
      if(!drag || drag===el) return;
      if(drag.parentElement!==el.parentElement) return;
      var parent=el.parentElement;
      var items=Array.from(parent.children);
      var a=items.indexOf(drag), b=items.indexOf(el);
      if(a<0||b<0) return;
      if(a<b) parent.insertBefore(drag, el.nextSibling);
      else parent.insertBefore(drag, el);
    });
  });
}

if(typeof window.abrirEditorMenus==='function' && !window.abrirEditorMenus.__v52217drag){
  var oldAbrir=window.abrirEditorMenus;
  window.abrirEditorMenus=function(){
    var r=oldAbrir.apply(this, arguments);
    setTimeout(function(){
      var ed=document.getElementById('ui-menus-ed'); if(!ed) return;
      var p=ed.querySelector('p')||ed.previousElementSibling;
      ligarArraste(ed);
      ed.querySelectorAll('[data-subs]').forEach(function(box){
        Array.from(box.children).forEach(function(row){
          if(row.getAttribute && row.getAttribute('data-sid') && !row.getAttribute('data-subrow')){
            row.setAttribute('data-subrow', row.getAttribute('data-sid'));
          }
        });
        ligarArraste(box);
      });
      var hint=document.createElement('p');
      hint.className='text-[12px] text-slate-500 mb-2';
      hint.textContent='Arraste o bloco para mudar a ordem (menu e submenu).';
      ed.parentElement.insertBefore(hint, ed);
    }, 30);
    return r;
  };
  window.abrirEditorMenus.__v52217drag=true;
}

if(typeof window.uiSubMenuMover==='function' && !window.uiSubMenuMover.__v52217){
  window.uiSubMenuMover=function(btn, dir){
    var row=btn && btn.closest ? (btn.closest('[data-subrow]')||btn.closest('[data-sid]')) : null;
    if(!row) return;
    if(row.tagName==='INPUT') row=row.parentElement;
    var parent=row.parentElement;
    var cards=Array.from(parent.children).filter(function(el){ return el && el.getAttribute && (el.getAttribute('data-subrow')||el.getAttribute('data-sid')); });
    var i=cards.indexOf(row);
    var j=i+dir;
    if(j<0||j>=cards.length) return;
    if(dir<0) parent.insertBefore(row, cards[j]);
    else parent.insertBefore(cards[j], row);
  };
  window.uiSubMenuMover.__v52217=true;
}

setTimeout(aplicarVisibilidadeBarra, 200);
setTimeout(aplicarVisibilidadeBarra, 800);
setTimeout(aplicarVisibilidadeBarra, 1800);
if(typeof window.showApp==='function' && !window.showApp.__v52217vis){
  var oldShow=window.showApp;
  window.showApp=function(){ var r=oldShow.apply(this, arguments); setTimeout(aplicarVisibilidadeBarra, 80); return r; };
  window.showApp.__v52217vis=true;
}

console.log('[DIGICOPY] v5.22.17 menus arrastáveis + Nuvem/Backup só Admin');
})();
