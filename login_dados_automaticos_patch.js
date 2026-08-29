// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.39 — Login direto por usuário, usuários migrados e carga automática
// • Remove a etapa de CNPJ do login e deixa somente usuário/senha
// • Importa FUNCIONARIOS do banco antigo como usuários do ERP, mantendo senhas
// • Login aceita maiúsculas/minúsculas em qualquer combinação
// • Une o admin demonstrativo ao usuário administrador original migrado quando existir
// • Tenta carregar automaticamente a base da nuvem quando o app abre sem banco migrado
// • Limpa submenu de Início/Pesquisa rápida e remove Notinhas antigas do Atendimento
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function avisoLogin(msg){
  const existing = document.getElementById('aviso-login-modal');
  if(existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'aviso-login-modal';
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)';
  div.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px 32px;max-width:360px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">' +
    '<div style="width:48px;height:48px;border-radius:50%;background:#fee2e2;margin:0 auto 12px;display:flex;align-items:center;justify-content:center"><span style="font-size:24px">⚠️</span></div>' +
    '<p style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 8px">' + msg + '</p>' +
    '<button onclick="document.getElementById(\u0027aviso-login-modal\u0027).remove()" style="margin-top:12px;height:40px;padding:0 24px;border-radius:10px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">OK</button>' +
    '</div>';
  document.body.appendChild(div);
}


function txt(v){ return String(v ?? '').trim(); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function onlyDigitsSafe(v){ return typeof onlyDigits==='function'?onlyDigits(v):txt(v).replace(/\D/g,''); }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function title(v){ const s=txt(v); if(!s) return ''; if(window.VOTM_PURE&&typeof window.VOTM_PURE.toTitleCase==='function') return window.VOTM_PURE.toTitleCase(s); return s.toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g,m=>m.toLowerCase()); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }
function perfilFunc(row){ if(txt(pick(row,['ADMIN','FUN_ADMIN','FUN_GERENTE'])).toUpperCase()==='S') return 'Admin'; if(txt(pick(row,['GERENTE'])).toUpperCase()==='S') return 'Admin'; if(txt(pick(row,['VENDEDOR'])).toUpperCase()==='S') return 'Comercial'; if(txt(pick(row,['TECNICO','FUN_TECNICO'])).toUpperCase()==='S') return 'Técnico'; return 'Operador'; }
function loginCompativel(user, typed){
  const t=fold(typed); if(!t||!user) return false;
  const login=fold(user.login); const nome=fold(user.nome); const primeiro=nome.split(/\s+/)[0];
  return t===login || t===nome || t===primeiro;
}
function senhaCompativel(user, senha){ return txt(user&&user.senha)===txt(senha); }
function escolherEmpresaPadrao(dbRef){
  dbRef.empresas=dbRef.empresas||[];
  let emp=dbRef.empresas.find(e=>/digicopy/i.test(txt(e.fantasia||e.nome))) || dbRef.empresas.find(e=>e.id==='emp_digicopy') || dbRef.empresas[0];
  if(!emp){
    emp={id:'emp_digicopy',cnpj:'',cnpjDigits:'',senha:'',nome:'DIGICOPY Cartuchos e Impressoras',fantasia:'DIGICOPY',criadoEm:new Date().toISOString(),criadoPor:'sistema'};
    dbRef.empresas.push(emp);
  }
  if(!emp.cnpjDigits) emp.cnpjDigits=onlyDigitsSafe(emp.cnpj||'');
  return emp;
}
function usuarioExiste(dbRef, empId, login, nome){ return (dbRef.usuarios||[]).find(u=>u.empresaId===empId&&(loginCompativel(u,login)||loginCompativel(u,nome))); }
function importarFuncionariosLegados(dbRef, empId){
  dbRef.usuarios=dbRef.usuarios||[];
  const funcs=rows('FUNCIONARIOS');
  let alterou=0;
  funcs.forEach(row=>{
    const codigo=cod(pick(row,['COD_FUNCIONARIO','FUN_CODIGO','CODIGO']));
    const nome=title(pick(row,['NOME','FUN_NOME','NOME_FUNCIONARIO','LOGIN','USUARIO']) || (codigo?`Usuário ${codigo}`:''));
    if(!nome) return;
    const login=fold(pick(row,['LOGIN','USUARIO','FUN_LOGIN']) || nome.split(/\s+/)[0] || codigo);
    const senha=txt(pick(row,['SENHA','FUN_SENHA','PASSWORD','PASS','SENHA_BANCO'])) || '123';
    const ativo=!['S','1','SIM'].includes(txt(pick(row,['OCULTAR','DEL','FUN_DEL'])).toUpperCase());
    let u=usuarioExiste(dbRef, empId, login, nome);
    const dados={empresaId:empId,nome,login,senha,perfil:perfilFunc(row),ativo,codigoAntigo:codigo,funcionarioCodigoAntigo:codigo,origem:'FUNCIONARIOS'};
    if(u){ Object.assign(u,dados); }
    else { dbRef.usuarios.push({id:uidSafe('usr'),criadoEm:new Date().toISOString(),criadoPor:'migracao',...dados}); }
    alterou++;
  });
  // Se não veio FUNCIONARIOS ainda, garante o usuário real (kauan) como admin.
  if(!dbRef.usuarios.some(u=>u.empresaId===empId && u.ativo)){
    const jaTemKauan = dbRef.usuarios.some(u=>u.empresaId===empId && u.id==='usr_kauan');
    dbRef.usuarios.push({id: jaTemKauan?uidSafe('usr'):'usr_kauan',empresaId:empId,nome:'Kauan',login:'kauan',senha:'6132',perfil:'Admin',ativo:true,criadoEm:new Date().toISOString(),criadoPor:'sistema'});
    alterou++;
  }
  return alterou;
}
function unirAdminDemoComOriginal(dbRef, empId){
  const users=dbRef.usuarios||[];
  const demo=users.find(u=>u.empresaId===empId&&fold(u.login)==='admin'&&/admin/i.test(txt(u.nome))&&u.criadoPor==='sistema');
  const original=users.find(u=>u.empresaId===empId&&u!==demo&&u.ativo&&(['admin','administrador'].includes(fold(u.perfil))||fold(u.login)==='admin'||/admin|gerente|gestor/i.test(txt(u.perfil||u.nome))));
  if(!demo||!original) return 0;
  ['vendas','os','logs','contasReceber','contasPagar'].forEach(k=>{
    (dbRef[k]||[]).forEach(x=>{ if(x.criadoPor===demo.id) x.criadoPor=original.id; if(x.usuarioId===demo.id) x.usuarioId=original.id; });
  });
  dbRef.usuarios=dbRef.usuarios.filter(u=>u.id!==demo.id);
  return 1;
}
function prepararEmpresaLogin(){
  const emp=escolherEmpresaPadrao(db);
  importarFuncionariosLegados(db, emp.id);
  unirAdminDemoComOriginal(db, emp.id);
  if(typeof setPendingEmpresa==='function') setPendingEmpresa(emp);
  return emp;
}

function renderLoginDireto(emp){
  if(typeof document==='undefined') return;
  const box=document.getElementById('login-step-user');
  if(!box) return;
  const cnpj=document.getElementById('login-step-cnpj');
  if(cnpj) cnpj.remove();
  box.classList.remove('hidden');
  box.style.display='block';
  box.style.pointerEvents='auto';
  const u=document.getElementById('login-user');
  const sp=document.getElementById('login-senha-user');
  if(u){ u.disabled=false; u.readOnly=false; u.style.pointerEvents='auto'; if(u.value==='kauan') u.value=''; }
  if(sp){ sp.disabled=false; sp.readOnly=false; sp.style.pointerEvents='auto'; }
}
function escHtml(v){ return txt(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c])); }
function estilizarLogin(){
  if(typeof document==='undefined') return;
  const st=document.getElementById('login-direto-css')||document.createElement('style');
  st.id='login-direto-css';
  st.textContent=`
    #login-screen{pointer-events:auto!important;}
    #login-screen > div:first-child{display:flex!important;align-items:center!important;justify-content:center!important;padding:30px!important;}
    #login-screen > div:first-child img{width:min(600px,82vw)!important;height:auto!important;max-height:68vh!important;object-fit:contain!important;filter:drop-shadow(0 22px 45px rgba(0,0,0,.35));}
    /* logo_2 keep original size */
    #login-step-cnpj{display:none!important;}
    #login-step-user{display:block!important;pointer-events:auto!important;position:relative!important;z-index:5!important;}
    #login-step-user input,#login-step-user button,#login-direto-form{pointer-events:auto!important;}
    #login-empresa-cnpj{display:none!important;}
    .modern-topnav .module-menu button{white-space:nowrap;}
  `;
  if(!st.parentNode) document.head.appendChild(st);
  const emp=prepararEmpresaLogin();
  const cnpj=document.getElementById('login-step-cnpj'); if(cnpj) cnpj.classList.add('hidden');
  renderLoginDireto(emp);
  limparTopoMenus();
}
function deletaAbaOculta(){
  try{
    const abaA=document.getElementById('login-step-cnpj');
    if(abaA) abaA.remove();
    document.querySelectorAll('[id*="login-step"]').forEach(el=>{ if(el.id!=='login-step-user' && el.style.display==='none') el.remove(); });
  }catch(e){}
}
setTimeout(deletaAbaOculta,50);
setTimeout(deletaAbaOculta,500);
function deletaTextoLogin(){
  try{
    const left = document.querySelector('#login-screen > div:first-child');
    if(left){
      left.querySelectorAll('h1, p').forEach(el=>{
        if(/Sistema Digicopy|Vendas, loca|© 2026/i.test(el.textContent||'')) el.remove();
      });
      left.querySelectorAll('span').forEach(el=>{
        if(/© 2026/i.test(el.textContent||'')) el.remove();
      });
    }
  }catch(e){}
}
setTimeout(deletaTextoLogin, 100);
setTimeout(deletaTextoLogin, 800);
function limparTopoMenus(){
  // Os itens legados do menu superior (Área inicial, Pesquisa rápida, Notinhas
  // antigas, Novo orçamento) foram REMOVIDOS direto no index.html. Nada a limpar.
}

const oldShowLogin=window.showLogin;
window.showLogin=function(){ if(oldShowLogin) oldShowLogin.apply(this,arguments); setTimeout(estilizarLogin,0); };
const oldBack=window.backToCNPJ;
window.backToCNPJ=function(){ prepararEmpresaLogin(); estilizarLogin(); };
window.doLoginUser=function(){
  const emp=prepararEmpresaLogin();
  const loginInput=document.getElementById('login-user')?.value || '';
  const senhaInput=document.getElementById('login-senha-user')?.value || '';
  if(!txt(loginInput)||!txt(senhaInput)){ avisoLogin('Informe usuário e senha'); return; }
  const user=(db.usuarios||[]).find(u=>u.empresaId===emp.id&&u.ativo&&loginCompativel(u,loginInput)&&senhaCompativel(u,senhaInput));
  if(!user){ avisoLogin('Usuário ou senha incorreto'); return; }
  const session={empresaId:emp.id,empresaNome:emp.fantasia||emp.nome,cnpj:emp.cnpj||'',cnpjDigits:onlyDigitsSafe(emp.cnpj||''),usuarioId:user.id,usuarioNome:title(user.nome),login:user.login,perfil:user.perfil,loginAt:new Date().toISOString()};
  if(typeof setSession==='function') setSession(session);
  db.logs=db.logs||[]; db.logs.unshift({id:uidSafe('log'),dataHora:new Date().toISOString(),empresaId:emp.id,usuarioId:user.id,usuarioNome:session.usuarioNome,usuarioLogin:user.login,entidade:'auth',acao:'login',entidadeId:user.id,detalhes:`Login usuário ${user.login} perfil ${user.perfil}`});
  if(typeof saveDB==='function') saveDB();
  if(typeof showApp==='function') showApp();
  if(typeof toast==='function') toast('Bem-vindo, '+session.usuarioNome+'!','success');
};

function totalLocal(){ return ['clientes','produtos','equipamentos','contratos','parque','leituras','os','vendas','contasReceber','contasPagar'].reduce((s,k)=>s+((db[k]||[]).length||0),0); }
function temBancoMigrado(){ return Object.values(db.modulosDinamicos||{}).some(m=>Array.isArray(m&&m.dados)&&m.dados.length>0) || totalLocal()>1000; }
async function autoCarregarNuvemSeVazio(){
  // v5.22.15: não puxa nuvem sozinho na abertura (Firebase morto; Cloudflare
  // sincroniza depois do login). No GitHack isso cobria a tela e recarregava em loop.
  return;
}

const oldBuildNav=window.buildNav;
if(typeof oldBuildNav==='function'&&!oldBuildNav.__loginDiretoMenus){
  window.buildNav=function(){ const ret=oldBuildNav.apply(this,arguments); setTimeout(limparTopoMenus,0); return ret; };
  window.buildNav.__loginDiretoMenus=true;
}

window.LOGIN_DIRETO_LEGADO_PURE={ fold, loginCompativel, senhaCompativel, perfilFunc, importarFuncionariosLegados, escolherEmpresaPadrao, unirAdminDemoComOriginal };

if(typeof document!=='undefined'){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ estilizarLogin(); });
  else { estilizarLogin(); }
  setInterval(limparTopoMenus,3000);
}
console.log('[DIGICOPY] login_dados_automaticos_patch.js v4.9.39 carregado');
})();
