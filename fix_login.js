// =============================================================================
// FIX: Login - SOMENTE logo_2 grande centralizada, sem nada oculto
// =============================================================================

// DELETA TUDO que não é a logo_2 no painel esquerdo do login
function limparLoginPainelEsquerdo() {
  const loginScreen = document.getElementById('login-screen');
  if (!loginScreen) return;
  
  const leftPanel = loginScreen.querySelector('.lg\\:flex');
  if (leftPanel) {
    // Deixa SOMENTE a logo, remove TUDO o resto
    leftPanel.innerHTML = '';
    leftPanel.style = 'display:flex;align-items:center;justify-content:center;padding:0;background:radial-gradient(1200px 600px at 20% 10%, #1a2bbf 0%, #0a1e8a 35%, #070f4d 100%);';
    
    const img = document.createElement('img');
    img.src = './logo_2.png?v=5.4.0';
    img.alt = 'DIGICOPY';
    img.style = 'width:min(700px,90vw);height:auto;max-height:80vh;object-fit:contain;filter:drop-shadow(0 25px 50px rgba(0,0,0,.40))';
    leftPanel.appendChild(img);
  }
}

// DELETA o painel direito e recria SOMENTE com campos de login
function limparLoginPainelDireito() {
  const loginScreen = document.getElementById('login-screen');
  if (!loginScreen) return;
  
  const rightPanel = loginScreen.querySelector('.flex-1');
  if (rightPanel) {
    rightPanel.innerHTML = `
      <div class="lg:hidden h-[76px] px-6 flex items-center border-b border-slate-100 bg-[#0a1e8a]">
        <img src="./logo_2.png?v=5.4.0" class="h-9 w-auto" style="filter:drop-shadow(0 10px 20px rgba(0,0,0,.40))">
      </div>
      <div class="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div class="w-full max-w-[400px]">
          <div class="space-y-4">
            <div>
              <label class="text-[11px] font-bold uppercase text-slate-500">USUÁRIO</label>
              <input id="login-user" placeholder="" 
                     class="mt-1.5 w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0a1e8a] focus:ring-4 focus:ring-[#0a1e8a]/10 outline-none text-[14px]">
            </div>
            <div>
              <label class="text-[11px] font-bold uppercase text-slate-500">SENHA</label>
              <div class="relative">
                <input id="login-senha-user" type="password" placeholder="" 
                       class="mt-1.5 w-full h-[48px] px-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0a1e8a] focus:ring-4 focus:ring-[#0a1e8a]/10 outline-none text-[14px]">
                <button type="button" onclick="togglePass('login-senha-user')" 
                        class="absolute right-3 top-[50%] -translate-y-[40%] w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100">
                  <i class="ph ph-eye"></i>
                </button>
              </div>
            </div>
            <button onclick="doLoginUser()" 
                    class="w-full h-[48px] rounded-xl bg-[#0a1e8a] text-white font-semibold text-[14px] hover:bg-[#08176e] transition shadow-lg shadow-[#0a1e8a]/20">
              Entrar no Sistema
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  // Remove o texto "Sistema Digicopy" do rodapé do login
  const footerText = loginScreen.querySelector('.text-center.text-[11px]');
  if (footerText) {
    footerText.remove();
  }
}

// DELETA TODAS as abas ocultas do login
function deletarAbasOcultasLogin() {
  const loginScreen = document.getElementById('login-screen');
  if (!loginScreen) return;
  
  // Remove TUDO que tem display:none ou hidden
  loginScreen.querySelectorAll('[class*="hidden"], [style*="display:none"], [style*="display: none"]').forEach(el => {
    if (el.id !== 'login-step-user') {
      el.remove();
    }
  });
  
  // Remove elementos específicos que podem estar ocultos
  ['login-step-cnpj', 'login-empresa-cnpj'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

// Modal de erro de login (igual ao que o usuário quer)
function showLoginError(msg) {
  const existing = document.getElementById('modal-login-error');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'modal-login-error';
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)';
  div.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px 32px;max-width:360px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
      <div style="width:48px;height:48px;border-radius:50%;background:#fee2e2;margin:0 auto 12px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:24px">⚠️</span>
      </div>
      <p style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 8px">${msg}</p>
      <button onclick="document.getElementById('modal-login-error').remove()" 
              style="margin-top:12px;height:40px;padding:0 24px;border-radius:10px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">
        OK
      </button>
    </div>
  `;
  document.body.appendChild(div);
}

// Overwrite do doLoginUser para usar o modal de erro
const oldDoLoginUser = window.doLoginUser;
window.doLoginUser = function() {
  const loginInput = document.getElementById('login-user');
  const senhaInput = document.getElementById('login-senha-user');
  
  if (!loginInput || !senhaInput) {
    showLoginError('Campos de login não encontrados');
    return;
  }
  
  const login = loginInput.value.trim();
  const senha = senhaInput.value.trim();
  
  if (!login || !senha) {
    showLoginError('Informe usuário e senha');
    return;
  }
  
  // Chama a função original se existir
  if (oldDoLoginUser) {
    const result = oldDoLoginUser.apply(this, arguments);
    
    // Se a função original não mostrou erro, verifica manualmente
    if (result !== false) {
      const user = (db.usuarios || []).find(u => 
        u.ativo && 
        (u.login.toLowerCase() === login.toLowerCase() || 
         u.nome.toLowerCase().includes(login.toLowerCase())) &&
        u.senha === senha
      );
      
      if (!user) {
        showLoginError('Usuário ou senha incorreto');
        return;
      }
    }
    return result;
  }
  
  // Se não tiver função original
  const emp = (db.empresas || []).find(e => e.id) || db.empresas[0];
  if (!emp) {
    showLoginError('Empresa não encontrada');
    return;
  }
  
  const user = (db.usuarios || []).find(u => 
    u.empresaId === emp.id && 
    u.ativo && 
    (u.login.toLowerCase() === login.toLowerCase() || 
     u.nome.toLowerCase().includes(login.toLowerCase())) &&
    u.senha === senha
  );
  
  if (!user) {
    showLoginError('Usuário ou senha incorreto');
    return;
  }
  
  // Login bem-sucedido
  const session = {
    empresaId: emp.id,
    empresaNome: emp.fantasia || emp.nome,
    cnpj: emp.cnpj || '',
    cnpjDigits: (emp.cnpj || '').replace(/\D/g, ''),
    usuarioId: user.id,
    usuarioNome: user.nome,
    login: user.login,
    perfil: user.perfil,
    loginAt: new Date().toISOString()
  };
  
  if (typeof setSession === 'function') setSession(session);
  if (typeof saveDB === 'function') saveDB();
  if (typeof showApp === 'function') showApp();
  if (typeof toast === 'function') toast(`Bem-vindo, ${user.nome}!`, 'success');
};

// Inicializa quando carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(limparLoginPainelEsquerdo, 0);
    setTimeout(limparLoginPainelDireito, 0);
    setTimeout(deletarAbasOcultasLogin, 0);
  });
} else {
  setTimeout(limparLoginPainelEsquerdo, 0);
  setTimeout(limparLoginPainelDireito, 0);
  setTimeout(deletarAbasOcultasLogin, 0);
}

console.log('[FIX] fix_login.js - Login limpo: SOMENTE logo_2 grande, sem nada oculto');
