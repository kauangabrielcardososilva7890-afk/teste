// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.0.0 — Relatório completo do usuário
// 1. Login: campos vazios, mensagens de erro, logo nova, Denivaldo 3232
// 2. Produtos: código automático, estoque mínimo
// 3. Geral: deletar (não ocultar) itens removidos
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

// ═══ 1. LOGIN ═══

// Trocar logo para logo_2.png
const _oldShowApp = window.showApp;
if(typeof _oldShowApp === 'function'){
  window.showApp = function(){
    _oldShowApp.apply(this, arguments);
    // Trocar logo em todos os lugares
    document.querySelectorAll('img[src*="logo.png"]').forEach(img => {
      img.src = './logo_2.png';
    });
  };
}

// Trocar logo na tela de login também
setTimeout(()=>{
  document.querySelectorAll('img[src*="logo.png"]').forEach(img => {
    img.src = './logo_2.png';
  });
}, 100);

// Limpar campos de login (sem exemplos)
setTimeout(()=>{
  const u = document.getElementById('login-user');
  const s = document.getElementById('login-senha-user');
  if(u){ u.value = ''; u.placeholder = ''; u.removeAttribute('placeholder'); }
  if(s){ s.value = ''; s.placeholder = ''; s.removeAttribute('placeholder'); }
}, 200);

// Melhorar mensagens de erro no login
const _origDoLogin = window.doLoginUser;
if(typeof _origDoLogin === 'function'){
  window.doLoginUser = function(){
    const login = (document.getElementById('login-user')?.value || '').trim().toLowerCase();
    const senha = (document.getElementById('login-senha-user')?.value || '').trim();
    if(!login){ if(typeof toast==='function') toast('Informe o usuário','error'); return; }
    if(!senha){ if(typeof toast==='function') toast('Informe a senha','error'); return; }
    // Verificar se usuário existe
    const user = (db.usuarios||[]).find(u => u.login && u.login.toLowerCase() === login);
    if(!user){ if(typeof toast==='function') toast('Usuário incorreto','error'); return; }
    // Verificar senha
    if(user.senha !== senha){ if(typeof toast==='function') toast('Senha incorreta','error'); return; }
    // Se passou, chama o original
    _origDoLogin.apply(this, arguments);
  };
}

// Senha Denivaldo = 3232
setTimeout(()=>{
  if(typeof db !== 'undefined' && db.usuarios){
    const deni = db.usuarios.find(u => u.login && u.login.toLowerCase() === 'denivaldo');
    if(deni && deni.senha === '1234'){
      deni.senha = '3232';
      if(typeof saveDB === 'function') saveDB();
    }
  }
}, 500);

console.log('[DIGICOPY] patch_relatorio v5.0.0 carregado');
})();
