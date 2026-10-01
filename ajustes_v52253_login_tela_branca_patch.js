// PATCH v5.22.53 — Correção definitiva da inicialização, login instantâneo e guarda anti-tela branca
(function(){
  'use strict';

  var VERSAO = '5.22.53';

  // Garante disponibilidade do db global
  if(typeof window !== 'undefined'){
    if(typeof db !== 'undefined' && db){
      window.db = db;
    }
  }

  function txt(v){ return String(v == null ? '' : v).trim(); }
  function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  // Uma regra so de "quem e este usuario" (login, nome completo ou primeiro
  // nome), para o caminho do texto e o do hash nunca discordarem.
  function mesmoUsuario(digitado, u){
    var d = fold(digitado);
    if(!d || !u) return false;
    var uL = fold(u.login), uN = fold(u.nome), uP = uN.split(/\s+/)[0];
    return (d === uL || d === uN || d === uP);
  }
  function temHash(u){ return !!(u && txt(u.senhaHash) && txt(u.senhaSalt)); }

  var LOGIN_TELA_BRANCA_V52253_PURE = {
    VERSAO: VERSAO,
    mesmoUsuario: mesmoUsuario,
    temHash: temHash,
    bootInstantaneo: true,
    antiTelaBranca: true,
    loginFlexivel: function(digitadoLogin, digitadoSenha, usuarios){
      var dL = fold(digitadoLogin);
      var dS = txt(digitadoSenha);
      if(!dL || !dS) return null;
      var list = Array.isArray(usuarios) ? usuarios : [];
      var found = list.find(function(u){
        if(!u || !u.ativo) return false;
        if(!mesmoUsuario(dL, u)) return false;
        // v7.3.13 (r69) — cadastro que JA TEM hash+salt: o hash e a fonte da verdade
        // e o campo legado `senha` nao autentica mais por aqui. Antes o texto era
        // comparado primeiro no call site e o hash so era olhado se o texto falhasse
        // — o contrario do que o bloco de senhas do app.js promete ("login confere
        // hash primeiro, texto puro so na transicao"). Na transicao continua valendo:
        // registro sem hash entra pelo texto, e o proprio login grava o hash em seguida.
        if(temHash(u)) return false;
        return txt(u.senha) === dS;
      });
      if(found) return found;
      // Fallback para admin inicial — AUDITORIA 23/09/2026: era uma PORTA DOS
      // FUNDOS PERMANENTE. Valia sempre, então `admin` + `admin123` (ou `123`)
      // entrava como perfil Admin mesmo DEPOIS de o dono trocar a senha, sem
      // existir no banco, sem empresa e sem registro na auditoria. E o bundle é
      // público, então o par estava escrito para qualquer um ler.
      // Agora o fallback só vale quando o banco AINDA NÃO TEM nenhum Admin
      // ativo — que é o caso para o qual ele foi escrito ("admin inicial",
      // banco novo). Existindo Admin ativo, quem manda é a senha do banco.
      var jaTemAdmin = list.some(function(u){
        return !!(u && u.ativo && fold(u.perfil) === 'admin');
      });
      if(!jaTemAdmin && dL === 'admin' && (dS === 'admin' || dS === '123' || dS === 'admin123')){
        return {
          id: 'usr_admin',
          nome: 'Administrador',
          login: 'admin',
          perfil: 'Admin',
          ativo: true
        };
      }
      return null;
    }
  };

  if(typeof window !== 'undefined'){
    window.LOGIN_TELA_BRANCA_V52253_PURE = LOGIN_TELA_BRANCA_V52253_PURE;

    if(window.__v52253_login_guard_loaded) return;
    window.__v52253_login_guard_loaded = true;

    // Remove qualquer overlay de carregamento que possa ter ficado preso
    function limparOverlaysPresos(){
      try{
        if(typeof document === 'undefined') return;
        var cloud = document.getElementById('cloud-load-overlay');
        if(cloud) cloud.style.display = 'none';
        var aviso = document.getElementById('aviso-login-modal');
        if(aviso) aviso.remove();
      }catch(e){}
    }

    // Sincroniza versão no rodapé e no título
    function sincronizarVersaoVisual(){
      try{
        if(typeof document === 'undefined') return;
        var curV = (typeof window !== 'undefined' && window.DIGICOPY_APP_VERSION) || VERSAO;
        var fv = document.getElementById('footer-version');
        if(fv && fv.textContent !== 'v' + curV) fv.textContent = 'v' + curV;
        var tv = document.getElementById('app-title-version');
        if(tv && tv.textContent !== 'Sistema Digicopy v' + curV) tv.textContent = 'Sistema Digicopy v' + curV;
        if(document.title && !document.title.includes(curV)){
          document.title = 'Sistema Digicopy v' + curV;
        }
      }catch(e){}
    }

    // Exibição forçada e segura do login
    function forcarExibicaoLogin(){
      try{
        if(typeof document === 'undefined') return;
        limparOverlaysPresos();
        var app = document.getElementById('app-shell');
        if(app){
          app.classList.add('hidden');
          app.style.display = 'none';
        }
        var login = document.getElementById('login-screen');
        if(login){
          login.classList.remove('hidden');
          login.style.display = 'flex';
          login.style.pointerEvents = 'auto';
        }
        var stepUser = document.getElementById('login-step-user');
        if(stepUser){
          stepUser.classList.remove('hidden');
          stepUser.style.display = 'block';
          stepUser.style.pointerEvents = 'auto';
        }
        var stepCnpj = document.getElementById('login-step-cnpj');
        if(stepCnpj){
          stepCnpj.classList.add('hidden');
          stepCnpj.style.display = 'none';
        }
        var u = document.getElementById('login-user');
        var p = document.getElementById('login-senha-user');
        if(u){ u.disabled = false; u.readOnly = false; u.style.pointerEvents = 'auto'; }
        if(p){ p.disabled = false; p.readOnly = false; p.style.pointerEvents = 'auto'; }
      }catch(err){
        console.warn('[DIGICOPY] Erro ao exibir login:', err);
      }
      sincronizarVersaoVisual();
    }

    // Exibição forçada e segura do App
    function forcarExibicaoApp(){
      try{
        if(typeof document === 'undefined') return;
        limparOverlaysPresos();
        var login = document.getElementById('login-screen');
        if(login){
          login.classList.add('hidden');
          login.style.display = 'none';
        }
        var app = document.getElementById('app-shell');
        if(app){
          app.classList.remove('hidden');
          app.style.display = 'flex';
        }
        var sess = (typeof getSession === 'function') ? getSession() : null;
        if(sess){
          var un = document.getElementById('user-name'); if(un) un.innerText = sess.usuarioNome || sess.login || '-';
          var up = document.getElementById('user-perfil'); if(up) up.innerText = sess.perfil || 'Admin';
          var ue = document.getElementById('user-empresa'); if(ue) ue.innerText = sess.empresaNome || 'DIGICOPY';
          var sc = document.getElementById('session-cnpj'); if(sc) sc.innerText = sess.cnpj || '';
          var fs = document.getElementById('footer-session'); if(fs) fs.innerText = (sess.empresaNome || 'DIGICOPY') + ' • ' + (sess.usuarioNome || sess.login || 'Usuário');
        }
        if(typeof renderDashboard === 'function') renderDashboard();
        if(typeof pintarMenus === 'function') pintarMenus();
      }catch(err){
        console.warn('[DIGICOPY] Erro ao exibir app:', err);
      }
      sincronizarVersaoVisual();
    }

    // Sobrescreve login de forma infalível
    // v7.1.0-r54 (P1): async — hash primeiro; texto puro da transição faz upgrade automático.
    window.doLoginUser = async function(){
      try{
        var uInput = document.getElementById('login-user');
        var pInput = document.getElementById('login-senha-user');
        var loginVal = txt(uInput ? uInput.value : '');
        var senhaVal = txt(pInput ? pInput.value : '');

        if(!loginVal || !senhaVal){
          if(typeof toast === 'function') toast('Informe usuário e senha', 'error');
          else alert('Informe usuário e senha');
          return;
        }

        var _db = window.db || (typeof db !== 'undefined' ? db : null) || {};
        var usuarios = _db.usuarios || [];
        var user = LOGIN_TELA_BRANCA_V52253_PURE.loginFlexivel(loginVal, senhaVal, usuarios);
        // v7.1.0-r54 (P1): entrou pelo texto puro da transição → grava o hash agora (upgrade).
        if(user && !user.senhaHash && typeof atualizarHashRegistro === 'function'){
          try{ await atualizarHashRegistro(user, senhaVal); }catch(eUp){}
        }
        // v7.1.0-r54 (P1): texto não achou (pós-Corte não tem texto) → tenta o hash+salt.
        // v7.3.13 (r69): este laco virou o caminho de quem tem hash, entao ele usa a MESMA
        // regra de identidade do loginFlexivel — senao quem entra pelo nome (ou pelo primeiro
        // nome) ficava de fora agora que o texto legado nao vale mais nesses cadastros.
        if(!user && typeof confereSenha === 'function'){
          for(var hi = 0; hi < usuarios.length; hi++){
            var hu = usuarios[hi];
            if(!hu || !hu.ativo || !hu.senhaHash) continue;
            if(!LOGIN_TELA_BRANCA_V52253_PURE.mesmoUsuario(loginVal, hu)) continue;
            try{ if(await confereSenha(senhaVal, hu)){ user = hu; break; } }catch(eH){}
          }
        }

        if(!user){
          // v5.24.34 — diagnóstico partido (carimbo de fala): diz SE é o
          // usuário que não existe, se está inativo, ou se é a senha. Antes
          // era um erro genérico e ninguém sabia o que corrigir. Usa o MESMO
          // fold do loginFlexivel pra comparar igualzinho.
          var ff = (typeof fold === 'function') ? fold : function(s){ return String(s || '').toLowerCase().trim(); };
          var foldL = ff(loginVal);
          var cand = null;
          for (var ci = 0; ci < usuarios.length; ci++){
            var cu = usuarios[ci];
            if(!cu) continue;
            var cL = ff(cu.login);
            var cN = ff(cu.nome);
            var cF = cN.split(/\s+/)[0] || '';
            if (foldL === cL || foldL === cN || foldL === cF){ cand = cu; break; }
          }
          var msgLogin;
          if(!cand){
            msgLogin = 'Usuário "' + loginVal + '" não existe neste PC. Confere a digitação ou cria ele em Configurações > Usuários.';
          } else if(!cand.ativo){
            msgLogin = 'O usuário "' + loginVal + '" está INATIVO. Ativa em Configurações > Usuários.';
          } else {
            msgLogin = 'Senha não confere para "' + loginVal + '". Cuidado: maiúsculas e minúsculas contam.';
          }
          if(typeof toast === 'function') toast(msgLogin, 'error');
          else alert(msgLogin);
          return;
        }

        var empresa = (_db.empresas && _db.empresas[0]) || { id: '', nome: '', fantasia: '', cnpj: '' }; // r59: sem empresa fictícia; setup cria a real
        var sess = {
          empresaId: empresa.id || '',
          empresaNome: empresa.fantasia || empresa.nome || '',
          cnpj: empresa.cnpj || '',
          usuarioId: user.id || 'usr_1',
          usuarioNome: user.nome || 'Usuário',
          login: user.login || loginVal,
          perfil: user.perfil || 'Admin',
          loginAt: new Date().toISOString()
        };

        if(typeof setSession === 'function') setSession(sess);
        else{
          try{ localStorage.setItem('digicopy_session_v3', JSON.stringify(sess)); }catch(e){}
        }

        if(typeof saveDB === 'function') saveDB();
        forcarExibicaoApp();
        if(typeof toast === 'function') toast('Bem-vindo, ' + sess.usuarioNome + '!', 'success');
        // v7.1.0-r54 (P1): senha de fábrica → abre o próprio cadastro e obriga a troca.
        if(user && user.senhaPadrao && typeof openModal === 'function'){
          try{
            setTimeout(function(){
              try{ if(typeof toast === 'function') toast('Senha padrão: troque pela sua senha', 'error'); }catch(e){}
              openModal('usuario', user.id);
            }, 900);
          }catch(ePadrao){}
        }
      }catch(err){
        console.error('[DIGICOPY] Erro no login:', err);
        forcarExibicaoApp();
      }
    };

    // Guarda global de erro para recuperação automática
    window.addEventListener('error', function(e){
      console.error('[DIGICOPY Global Guard]', e && e.message);
      limparOverlaysPresos();
      setTimeout(function(){
        try{
          if(typeof document === 'undefined') return;
          var login = document.getElementById('login-screen');
          var app = document.getElementById('app-shell');
          var loginVisivel = login && !login.classList.contains('hidden') && login.style.display !== 'none';
          var appVisivel = app && !app.classList.contains('hidden') && app.style.display !== 'none';
          if(!loginVisivel && !appVisivel){
            var sess = (typeof getSession === 'function') ? getSession() : null;
            if(sess) forcarExibicaoApp();
            else forcarExibicaoLogin();
          }
        }catch(err){}
      }, 150);
    });

    // Boot inicial
    function executarBoot(){
      try{
        var sess = (typeof getSession === 'function') ? getSession() : null;
        if(sess){
          forcarExibicaoApp();
        }else{
          forcarExibicaoLogin();
        }
      }catch(e){
        forcarExibicaoLogin();
      }
      sincronizarVersaoVisual();
    }

    if(typeof document !== 'undefined'){
      if(document.readyState === 'loading' && typeof document.addEventListener === 'function'){
        document.addEventListener('DOMContentLoaded', executarBoot);
      }else{
        executarBoot();
      }
    }

    setTimeout(executarBoot, 50);
    setTimeout(executarBoot, 300);

    console.log('[DIGICOPY] v' + VERSAO + ': Login direto e proteção total contra tela branca ativos.');
  }

  if(typeof module !== 'undefined' && module.exports){
    module.exports = { LOGIN_TELA_BRANCA_V52253_PURE: LOGIN_TELA_BRANCA_V52253_PURE };
  }
})();
