// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.7 — Auditoria só para Admin e Dono
// • Esconde o item "Auditoria" do menu lateral e do submenu Configurações
//   para quem não tem permissão total.
// • Bloqueia a navegação para a tela de auditoria (navigateTo('auditoria'))
//   se o usuário não for Admin/Dono.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

if(typeof window === 'undefined' || typeof document === 'undefined') return;

function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function fold(v){ return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }

function temPermissaoTotal(s){
  const l = fold(s && (s.login || s.usuarioNome));
  if(l === 'kauan' || l === 'denivaldo') return true;
  const p = String(s && s.perfil || '');
  return p === 'Admin' || p === 'Dono';
}

function podeVerAuditoria(){
  // Reaproveita a lógica do v5.19.6 se existir, senão usa a local.
  if(window.AJUSTES_V5196_PURE && typeof window.AJUSTES_V5196_PURE.temPermissaoTotal === 'function'){
    return window.AJUSTES_V5196_PURE.temPermissaoTotal(sess());
  }
  return temPermissaoTotal(sess());
}

// Mostra/esconde os itens de menu de auditoria conforme a permissão.
function esconderAuditoria(){
  // Sem sessão (tela de login): não mexe em nada.
  if(!sess()) return;
  var pode = podeVerAuditoria();
  // Lateral (data-nav="auditoria")
  var els = document.querySelectorAll('[data-nav="auditoria"]');
  for(var i = 0; i < els.length; i++){ els[i].style.display = pode ? '' : 'none'; }
  // Submenu Configurações: botão com onclick navigateTo('auditoria')
  var btns = document.querySelectorAll('button');
  for(var j = 0; j < btns.length; j++){
    var oc = btns[j].getAttribute('onclick') || '';
    if(/navigateTo\(['"]auditoria['"]\)/.test(oc)) btns[j].style.display = pode ? '' : 'none';
  }
}

// Bloqueia a navegação para auditoria sem permissão.
const _nav = window.navigateTo;
if(typeof _nav === 'function'){
  window.navigateTo = function(view){
    if(view === 'auditoria' && !podeVerAuditoria()){
      if(typeof toast === 'function') toast('Apenas Admin e Dono podem acessar a auditoria', 'error');
      return;
    }
    return _nav.apply(this, arguments);
  };
}

// Reaplica ao renderizar o menu (buildNav) e ao carregar.
const _buildNav = window.buildNav;
if(typeof _buildNav === 'function'){
  window.buildNav = function(){
    const r = _buildNav.apply(this, arguments);
    setTimeout(esconderAuditoria, 0);
    return r;
  };
}

setTimeout(esconderAuditoria, 300);
setTimeout(esconderAuditoria, 1200);
try{
  new MutationObserver(function(){ setTimeout(esconderAuditoria, 60); }).observe(document.body, { childList: true, subtree: true });
}catch(e){}

console.log('[DIGICOPY] ajustes_v5197_patch.js');
})();
