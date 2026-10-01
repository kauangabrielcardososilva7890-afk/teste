// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.0.0 — Relatório completo do usuário
// 1. Login: campos vazios, mensagens de erro, logo nova
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

// Login: mensagens de erro corrigidas direto no app.js

// v7.3.13 (r69) — REMOVIDO de proposito. Este arquivo trazia, dentro do bundle
// publico, um bloco que conhecia a senha de um usuario real de verdade e, num PC
// zerado, trocava a senha antiga dele por outra, sem ninguem pedir. Duas coisas
// erradas ao mesmo tempo: (1) a frase era uma credencial publicada — quem le o
// bundle le a senha; (2) reescrever a senha de outra pessoa no boot nao e
// migracao, e porta. A prova de login hoje e hash+salt (v5.24.38 no app.js) e a
// troca de senha e feita na tela, por quem tem permissao. NAO RESTAURAR.

console.log('[DIGICOPY] patch_relatorio v5.0.0 carregado');
})();
