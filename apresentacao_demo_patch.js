// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.42 — Modo apresentação (.exe demo)
// • Base limpa com dados de teste, sem migração automática e sem menus migrados
// • Login somente admin / admin123
// • Renderiza apenas a tela aberta e limpa a tela anterior ao navegar
// • Remove área de importação/banco do uso diário
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const DEMO_ATIVO = (typeof location!=='undefined' && /[?&]demo=1\b/.test(location.search||'')) || (()=>{ try{return localStorage.getItem('digicopy_modo_apresentacao')==='1';}catch(e){return false;} })();
if(!DEMO_ATIVO){
  window.DIGICOPY_APRESENTACAO_DEMO = false;
  window.APRESENTACAO_DEMO_PURE = { prepararDemo:()=>0, travarUsuariosAdmin:()=>null, totalOperacional:()=>0 };
  console.log('[DIGICOPY] apresentacao_demo_patch.js v4.9.42 inativo');
  return;
}
window.DIGICOPY_APRESENTACAO_DEMO = true;
window.DIGI_MODO_LEVE = true;
try{ localStorage.setItem('digicopy_erp_autosync','0'); }catch(e){}

function txt(v){ return String(v ?? '').trim(); }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function ensureEmpresa(){
  db.empresas=db.empresas||[];
  let emp=db.empresas.find(e=>/digicopy/i.test(String(e.fantasia||e.nome||'')))||db.empresas[0];
  if(!emp){
    emp={id:uidSafe('emp'),cnpj:'',cnpjDigits:'',senha:'',nome:'DIGICOPY Cartuchos e Impressoras',fantasia:'DIGICOPY',criadoEm:new Date().toISOString(),demo:true};
    db.empresas.push(emp);
  }
  return emp;
}
function adminUser(empId){ return {id:'usr_admin_demo',empresaId:empId,nome:'Administrador',login:'admin',senha:'admin123',perfil:'Admin',ativo:true,criadoEm:new Date().toISOString(),criadoPor:'sistema',demo:true}; }
function travarUsuariosAdmin(){
  const emp=ensureEmpresa();
  db.usuarios=[adminUser(emp.id)];
  try{ if(typeof setPendingEmpresa==='function') setPendingEmpresa(emp); }catch(e){}
  return emp;
}
function totalOperacional(){ return ['clientes','produtos','equipamentos','contratos','parque','leituras','os','vendas','contasReceber','contasPagar'].reduce((s,k)=>s+((db[k]||[]).length),0); }
function prepararDemo(){
  if(!db) return;
  const precisa=totalOperacional()<20;
  if(precisa && typeof seedData==='function'){
    try{ seedData(true); }catch(e){ console.warn('[DIGICOPY] seed demo falhou',e); }
  }
  travarUsuariosAdmin();
  db.modulosDinamicos={};
  db.config=db.config||{};
  db.config.modoApresentacaoDemo=true;
  db.config.mostrarMenusMigradosNaLateral=false;
  if(typeof saveDB==='function') saveDB();
}
function limparMenus(){
  if(typeof document==='undefined') return;
  const css=document.getElementById('apresentacao-demo-css')||document.createElement('style');
  css.id='apresentacao-demo-css';
  css.textContent=`
    [data-nav="banco"],[data-nav="migrados"],[data-nav^="mod_"],#view-banco,#view-migrados,#nav-dinamico,#nav-dinamico-label,[data-dynamic-category],.dynamic-menu-heading{display:none!important;}
    .modern-topnav .module-menu button{white-space:nowrap;}
  `;
  if(!css.parentNode) document.head.appendChild(css);
  document.querySelectorAll('[data-nav="banco"],[data-nav="migrados"],[data-nav^="mod_"],#nav-dinamico,#nav-dinamico-label,[data-dynamic-category],.dynamic-menu-heading').forEach(e=>e.remove());
  [...document.querySelectorAll('button')].forEach(b=>{
    const t=(b.textContent||'').toLowerCase();
    if(t.includes('dados migrados')||t.includes('explorar migrados')||t.includes('importar arquivos')||t.includes('backup / migração')||t.includes('notinhas antigas')||t.includes('novo orçamento')) b.remove();
  });
}
function renderLogin(){
  if(typeof document==='undefined') return;
  const emp=travarUsuariosAdmin();
  const cnpj=document.getElementById('login-step-cnpj'); if(cnpj) cnpj.style.display='none';
  const box=document.getElementById('login-step-user'); if(!box) return;
  box.classList.remove('hidden'); box.style.display='block'; box.style.pointerEvents='auto';
  if(!box.dataset.demoLoginOk){
    box.dataset.demoLoginOk='1';
    box.innerHTML=`<div class="mb-6 flex items-center gap-3 p-3 rounded-xl bg-[#e8eaf8] border border-[#c9ceef]"><div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-bold text-[14px]">DG</div><div><p class="font-bold text-[13px] leading-tight">${emp.fantasia||'DIGICOPY'}</p><p class="text-[11px] text-slate-600">Modo apresentação</p></div></div><div class="mb-6"><h2 class="text-[20px] font-bold tracking-tight">Login do usuário</h2><p class="text-[13px] text-slate-500 mt-1">Use admin / admin123</p></div><form class="space-y-4" onsubmit="event.preventDefault(); doLoginUser();"><div><label class="text-[11px] font-bold uppercase text-slate-500">Usuário</label><input id="login-user" value="admin" autocomplete="username" class="mt-1.5 w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0a1e8a] focus:ring-4 focus:ring-[#0a1e8a]/10 outline-none text-[14px]"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Senha</label><input id="login-senha-user" type="password" autocomplete="current-password" placeholder="admin123" class="mt-1.5 w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0a1e8a] focus:ring-4 focus:ring-[#0a1e8a]/10 outline-none text-[14px]"></div><button type="submit" class="w-full h-[48px] rounded-xl bg-[#0a1e8a] text-white font-semibold text-[14px] hover:bg-[#08176e] transition shadow-lg shadow-[#0a1e8a]/20">Entrar</button></form>`;
  }
}
window.doLoginUser=function(){
  const emp=travarUsuariosAdmin();
  const login=String(document.getElementById('login-user')?.value||'').trim().toLowerCase();
  const senha=String(document.getElementById('login-senha-user')?.value||'').trim();
  if(login!=='admin'||senha!=='admin123'){ if(typeof toast==='function') toast('Use admin / admin123','error'); return; }
  const u=db.usuarios[0];
  const session={empresaId:emp.id,empresaNome:emp.fantasia||emp.nome,cnpj:emp.cnpj||'',cnpjDigits:emp.cnpjDigits||'',usuarioId:u.id,usuarioNome:u.nome,login:u.login,perfil:u.perfil,loginAt:new Date().toISOString()};
  if(typeof setSession==='function') setSession(session);
  db.logs=db.logs||[]; db.logs.unshift({id:uidSafe('log'),dataHora:new Date().toISOString(),empresaId:emp.id,usuarioId:u.id,usuarioNome:u.nome,usuarioLogin:u.login,entidade:'auth',acao:'login',entidadeId:u.id,detalhes:'Login modo apresentação'});
  if(typeof saveDB==='function') saveDB();
  if(typeof showApp==='function') showApp();
};

function limparViewsExceto(view){
  if(typeof document==='undefined') return;
  document.querySelectorAll('.view').forEach(el=>{
    const id=(el.id||'').replace(/^view-/,'');
    if(id!==view && !['modal-root'].includes(el.id)) el.innerHTML='';
  });
}
const oldNavigate=window.navigateTo;
if(typeof oldNavigate==='function'&&!oldNavigate.__demoRenderUnico){
  window.navigateTo=function(view){
    if(view==='banco'||view==='migrados'||String(view).startsWith('mod_')) view='dashboard';
    limparViewsExceto(view);
    const ret=oldNavigate.call(this,view);
    setTimeout(limparMenus,0);
    return ret;
  };
  window.navigateTo.__demoRenderUnico=true;
}
const oldBuildNav=window.buildNav;
if(typeof oldBuildNav==='function'&&!oldBuildNav.__demoLimpo){
  window.buildNav=function(){ const ret=oldBuildNav.apply(this,arguments); setTimeout(limparMenus,0); return ret; };
  window.buildNav.__demoLimpo=true;
}
const oldShowLogin=window.showLogin;
if(typeof oldShowLogin==='function'&&!oldShowLogin.__demoLogin){
  window.showLogin=function(){ const ret=oldShowLogin.apply(this,arguments); setTimeout(renderLogin,0); return ret; };
  window.showLogin.__demoLogin=true;
}
const oldShowApp=window.showApp;
if(typeof oldShowApp==='function'&&!oldShowApp.__demoPrep){
  window.showApp=function(){ prepararDemo(); const ret=oldShowApp.apply(this,arguments); setTimeout(limparMenus,0); return ret; };
  window.showApp.__demoPrep=true;
}
function boot(){ prepararDemo(); renderLogin(); limparMenus(); }
if(typeof document!=='undefined'){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else setTimeout(boot,0);
  setInterval(limparMenus,3000);
}
window.APRESENTACAO_DEMO_PURE={ prepararDemo, travarUsuariosAdmin, totalOperacional };
console.log('[DIGICOPY] apresentacao_demo_patch.js v4.9.42 carregado');
})();
