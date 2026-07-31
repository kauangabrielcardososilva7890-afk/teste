// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.8 — Otimização de Login, Funcionários e Vendedores:
// • Login flexível case-insensitive para qualquer formato (FULANO, Fulano, fUlAnO)
// • Unificação do usuário 'admin' com 'Kauan' (evita dois Kauan duplicados)
// • Conversão de vendedores 'Vendas - ordens', 'N', 'S', 'Importado' para 'Recepção'
// • Importação de funcionários migrados do banco como usuários de login (com senha)
// ═══════════════════════════════════════════════════════════════════════════
(function(){

function loguinCompativel(u, typed){
  if(!u || !typed) return false;
  const t = String(typed).trim().toLowerCase();
  const l = String(u.login||'').trim().toLowerCase();
  const n = String(u.nome||'').trim().toLowerCase();
  const primeiroNome = n.split(/\s+/)[0];
  return (l === t || n === t || primeiroNome === t);
}

function normalizarKauanAdmin(sess, dbRef){
  const _db = dbRef || (typeof db !== 'undefined' ? db : window.db);
  if(!sess || !_db) return;
  const empId = sess.empresaId;
  const adminUser = (_db.usuarios||[]).find(u => u.empresaId === empId && u.login === 'admin');
  const kauanUser = (_db.usuarios||[]).find(u => u.empresaId === empId && u.login !== 'admin' && (String(u.nome).toLowerCase().includes('kauan') || String(u.login).toLowerCase().includes('kauan')));
  if(adminUser){
    adminUser.nome = 'Kauan Gabriel';
    adminUser.login = 'kauan';
    if(kauanUser && kauanUser.id !== adminUser.id){
      // Unifica admin com o cadastro já existente de Kauan
      const targetId = kauanUser.id;
      (_db.vendas||[]).forEach(v => {
        if(v.criadoPor === adminUser.id) v.criadoPor = targetId;
        if(/^admin$/i.test(v.criadoPorNome||'')) v.criadoPorNome = 'Kauan Gabriel';
        if(/^admin$/i.test(v.atendenteNome||'')) v.atendenteNome = 'Kauan Gabriel';
      });
      (_db.os||[]).forEach(o => {
        if(o.criadoPor === adminUser.id) o.criadoPor = targetId;
        if(/^admin$/i.test(o.criadoPorNome||'')) o.criadoPorNome = 'Kauan Gabriel';
      });
      _db.usuarios = _db.usuarios.filter(u => u.id !== adminUser.id);
    } else {
      (_db.vendas||[]).forEach(v => {
        if(/^admin$/i.test(v.criadoPorNome||'')) v.criadoPorNome = 'Kauan Gabriel';
        if(/^admin$/i.test(v.atendenteNome||'')) v.atendenteNome = 'Kauan Gabriel';
      });
    }
  }

  // Normalizar registros legados com vendedor "admin", "N", "S", "Vendas - ordens"
  (_db.vendas||[]).forEach(v => {
    if(v.empresaId === empId){
      if(/^admin$/i.test(v.criadoPorNome||'')) v.criadoPorNome = 'Kauan Gabriel';
      if(/^admin$/i.test(v.atendenteNome||'')) v.atendenteNome = 'Kauan Gabriel';
      if(/^([NS]|VENDAS?.*ORDENS?|IMPORTADO)$/i.test(v.criadoPorNome||'')) v.criadoPorNome = 'Recepção';
      if(/^([NS]|VENDAS?.*ORDENS?|IMPORTADO)$/i.test(v.atendenteNome||'')) v.atendenteNome = 'Recepção';
    }
  });
}

function importarFuncionariosComoUsuarios(sess){
  if(!sess || !db || !db.usuarios) return;
  const empId = sess.empresaId;
  const ex = String => String || '';
  const excluidos = ['-', 'importado', 'n', 's', 'vendas - ordens', 'vendas ordens', 'admin'];

  // 1. Cadastra técnicos como usuários se ainda não tiver login
  (db.tecnicos||[]).forEach(t => {
    const s = String(t.nome||'').trim();
    const low = s.toLowerCase();
    if(!s || excluidos.includes(low)) return;
    const loginSug = low.split(/\s+/)[0];
    const existe = db.usuarios.some(u => u.empresaId === empId && loguinCompativel(u, loginSug));
    if(!existe){
      db.usuarios.push({
        id: (typeof uid==='function' ? uid('usr') : 'usr_'+Math.random().toString(36).slice(2,9)),
        empresaId: empId,
        nome: window.VOTM_PURE ? window.VOTM_PURE.toTitleCase(s) : s,
        login: loginSug,
        senha: '123',
        perfil: 'Comercial',
        ativo: true
      });
    }
  });
}

window.LOGOPT_PURE = {
  loguinCompativel,
  normalizarKauanAdmin,
  importarFuncionariosComoUsuarios
};

if(typeof window === 'undefined') return;

// Sobrescrever doLoginUser para permitir login flexível de qualquer formato (FULANO, Fulano, fulano)
const _origDoLoginUser = window.doLoginUser;
window.doLoginUser = function(){
  const pending = typeof getPendingEmpresa==='function' ? getPendingEmpresa() : null;
  if(!pending){
    if(typeof toast==='function') toast('Valide o CNPJ primeiro','error');
    if(typeof backToCNPJ==='function') backToCNPJ();
    return;
  }
  const loginInput = document.getElementById('login-user')?.value?.trim() || '';
  const senhaInput = document.getElementById('login-senha-user')?.value?.trim() || '';
  if(!loginInput || !senhaInput){
    if(typeof toast==='function') toast('Informe usuário e senha','error');
    return;
  }
  const user = (db.usuarios||[]).find(u => u.empresaId === pending.id && u.ativo &&
    loguinCompativel(u, loginInput) && String(u.senha) === senhaInput);
  if(!user){
    if(typeof toast==='function') toast('Usuário ou senha inválidos para este CNPJ','error');
    return;
  }
  const session = {
    empresaId: pending.id,
    empresaNome: pending.fantasia || pending.nome,
    cnpj: pending.cnpj,
    cnpjDigits: typeof onlyDigits==='function' ? onlyDigits(pending.cnpj) : pending.cnpj,
    usuarioId: user.id,
    usuarioNome: window.VOTM_PURE ? window.VOTM_PURE.toTitleCase(user.nome) : user.nome,
    login: user.login,
    perfil: user.perfil,
    loginAt: new Date().toISOString()
  };
  if(typeof setSession==='function') setSession(session);
  if(db.logs) db.logs.unshift({
    id: typeof uid==='function' ? uid('log') : 'log_'+Date.now(),
    dataHora: new Date().toISOString(),
    empresaId: pending.id,
    usuarioId: user.id,
    usuarioNome: session.usuarioNome,
    usuarioLogin: user.login,
    entidade: 'auth',
    acao: 'login',
    entidadeId: user.id,
    detalhes: `Login usuário ${user.login} perfil ${user.perfil}`
  });
  normalizarKauanAdmin(session);
  importarFuncionariosComoUsuarios(session);
  saveDB();
  if(typeof showApp==='function') showApp();
  if(typeof toast==='function') toast('Bem-vindo, ' + session.usuarioNome + '!', 'success');
};

// Ao iniciar a sessão já autenticada, executa normalizações sem recarregar a tela
const _origShowApp = window.showApp;
window.showApp = function(){
  const sess = typeof getSession==='function' ? getSession() : null;
  if(sess){
    normalizarKauanAdmin(sess);
    importarFuncionariosComoUsuarios(sess);
  }
  if(_origShowApp) _origShowApp.apply(this, arguments);
};

console.log('[DIGICOPY] PATCH login_otimizacao_patch.js v4.9.8 — Login case-insensitive, unificação Kauan/admin e Recepção');
})();
