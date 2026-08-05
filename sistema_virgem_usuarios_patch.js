// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.57 — Sistema virgem, usuários fixos e nuvem sem legado
// • Remove dados antigos/migrados, preservando somente clientes cadastrados
// • Login direto por usuário/senha, sem CNPJ
// • Usuários oficiais: Kauan, Recepção, Katia e Denivaldo
// • Denivaldo troca a senha no primeiro acesso
// • Tenta publicar a base virgem na nuvem com confirmação forçada do usuário
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function agora(){ return new Date().toISOString(); }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function sess(){ return typeof getSession==='function'?getSession():null; }

const VIRGEM_VERSAO='4.9.57';
const USUARIOS_OFICIAIS=[
  {nome:'Kauan',login:'Kauan',senha:'6132',perfil:'Admin',adminTotal:true},
  {nome:'Recepção',login:'Recepção',senha:'3232',perfil:'Comercial'},
  {nome:'Katia',login:'Katia',senha:'1524',perfil:'Admin'},
  {nome:'Denivaldo',login:'Denivaldo',senha:'1234',perfil:'Técnico',deveTrocarSenha:true,avisoTroca:'mude a senha, coloque a senha do usuario do banco antigo'}
];
const CAMPOS_ARRAY_PERMITIDOS=new Set(['empresas','usuarios','clientes','logs']);
const CAMPOS_OBJ_PERMITIDOS=new Set(['config','meta']);

function empresaPadrao(dbRef){
  dbRef.empresas=Array.isArray(dbRef.empresas)?dbRef.empresas:[];
  let emp=dbRef.empresas[0];
  if(!emp){
    emp={id:'emp_digicopy',cnpj:'',cnpjDigits:'',senha:'',nome:'DIGICOPY',fantasia:'DIGICOPY',criadoEm:agora(),sistemaVirgem:true};
    dbRef.empresas.push(emp);
  }
  emp.nome=emp.nome||'DIGICOPY'; emp.fantasia=emp.fantasia||'DIGICOPY'; emp.cnpj=emp.cnpj||''; emp.cnpjDigits=emp.cnpjDigits||'';
  return emp;
}
function aplicarUsuariosOficiais(dbRef){
  const emp=empresaPadrao(dbRef);
  dbRef.usuarios=[];
  USUARIOS_OFICIAIS.forEach(u=>{
    dbRef.usuarios.push({
      id:'usr_'+fold(u.login).replace(/[^a-z0-9]+/g,'_'),
      empresaId:emp.id,
      nome:u.nome,
      login:u.login,
      senha:u.senha,
      perfil:u.perfil,
      ativo:true,
      adminTotal:!!u.adminTotal,
      deveTrocarSenha:!!u.deveTrocarSenha,
      avisoTroca:u.avisoTroca||'',
      senhaTemporaria:!!u.deveTrocarSenha,
      criadoEm:agora(),
      criadoPor:'sistema_virgem'
    });
  });
  return dbRef.usuarios;
}
function limparDadosAntigos(dbRef,opts={}){
  const preservarClientes=opts.preservarClientes!==false;
  const clientes=preservarClientes&&Array.isArray(dbRef.clientes)?dbRef.clientes.map(c=>({...c})):[];
  Object.keys(dbRef).forEach(k=>{
    if(Array.isArray(dbRef[k])&&!CAMPOS_ARRAY_PERMITIDOS.has(k)) dbRef[k]=[];
    else if(dbRef[k]&&typeof dbRef[k]==='object'&&!Array.isArray(dbRef[k])&&!CAMPOS_OBJ_PERMITIDOS.has(k)) dbRef[k]={};
  });
  dbRef.clientes=clientes;
  dbRef.modulosDinamicos={};
  dbRef.notificacoes=[];
  dbRef.produtos=[]; dbRef.equipamentos=[]; dbRef.contratos=[]; dbRef.parque=[]; dbRef.leituras=[]; dbRef.os=[]; dbRef.vendas=[];
  dbRef.contasReceber=[]; dbRef.contasPagar=[]; dbRef.tecnicos=[];
  dbRef.escolaOrcamentos=[]; dbRef.escolaItens=[]; dbRef.escolaExcluidos=[]; dbRef.escolaLogs=[];
  dbRef.logs=[];
  dbRef.config=dbRef.config||{};
  const manterEmpresa=dbRef.config.empresa||{};
  const manterPix=dbRef.config.pix||{};
  const manterBuscador=dbRef.config.buscadorEscola||{};
  dbRef.config={empresa:manterEmpresa,pix:manterPix,buscadorEscola:manterBuscador,sistemaVirgem:{versao:VIRGEM_VERSAO,aplicadoEm:agora(),preservouClientes:clientes.length}};
  aplicarUsuariosOficiais(dbRef);
  dbRef.logs.unshift({id:uidSafe('log'),dataHora:agora(),empresaId:empresaPadrao(dbRef).id,usuarioId:'sistema',usuarioNome:'Sistema',usuarioLogin:'sistema',entidade:'sistema',acao:'reset_virgem',entidadeId:'-',detalhes:`Sistema virgem v${VIRGEM_VERSAO}; clientes preservados: ${clientes.length}`});
  return {clientesPreservados:clientes.length,usuarios:dbRef.usuarios.length};
}
function precisaAplicarVirgem(dbRef){ return !((dbRef.config||{}).sistemaVirgem||{}).aplicadoEm; }
function aplicarVirgemSePreciso(){
  if(!window.db&&typeof db==='undefined') return null;
  if(!precisaAplicarVirgem(db)) return null;
  const r=limparDadosAntigos(db,{preservarClientes:true});
  salvar();
  try{ localStorage.removeItem('digicopy_erp_dirty_local'); }catch(e){}
  return r;
}
function usuarioPorLoginSenha(login,senha){
  const l=fold(login);
  return (db.usuarios||[]).find(u=>u.ativo!==false && (fold(u.login)===l||fold(u.nome)===l) && txt(u.senha)===txt(senha));
}
function loginDiretoVirgem(){
  const login=txt(document.getElementById('login-user')?.value);
  const senha=txt(document.getElementById('login-senha-user')?.value);
  if(!login||!senha) return toastMsg('Informe usuário e senha','error');
  const emp=empresaPadrao(db);
  const u=usuarioPorLoginSenha(login,senha);
  if(!u) return toastMsg('Usuário ou senha inválidos','error');
  const session={empresaId:emp.id,empresaNome:emp.fantasia||emp.nome,cnpj:emp.cnpj||'',cnpjDigits:emp.cnpjDigits||'',usuarioId:u.id,usuarioNome:u.nome,login:u.login,perfil:u.perfil,loginAt:agora(),trocaSenhaObrigatoria:!!u.deveTrocarSenha};
  if(typeof setSession==='function') setSession(session); else localStorage.setItem('digicopy_session_v42_demo_apresentacao',JSON.stringify(session));
  db.logs=db.logs||[]; db.logs.unshift({id:uidSafe('log'),dataHora:agora(),empresaId:emp.id,usuarioId:u.id,usuarioNome:u.nome,usuarioLogin:u.login,entidade:'auth',acao:'login',entidadeId:u.id,detalhes:`Login usuário ${u.login} perfil ${u.perfil}`}); salvar();
  if(typeof showApp==='function') showApp();
  if(u.deveTrocarSenha) setTimeout(()=>abrirTrocaSenhaObrigatoria(u.id),250);
  setTimeout(()=>publicarNuvemVirgemSePreciso(),1200);
}
function renderLoginVirgem(){
  const screen=document.getElementById('login-screen'); if(!screen) return;
  const cnpj=document.getElementById('login-step-cnpj'); if(cnpj) cnpj.style.display='none';
  const box=document.getElementById('login-step-user'); if(!box) return;
  box.classList.remove('hidden'); box.style.display='block';
  const primeiro=(db.usuarios||[])[0]||{};
  box.innerHTML=`<div class="mb-6 flex items-center gap-3 p-3 rounded-xl bg-[#e8eaf8] border border-[#c9ceef]"><div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-bold text-[14px]">DG</div><div><p class="font-bold text-[13px] leading-tight">DIGICOPY ERP</p><p class="text-[11px] text-slate-600">Sistema virgem • login por usuário/senha</p></div></div><div class="mb-6"><h2 class="text-[20px] font-bold tracking-tight">Login do usuário</h2><p class="text-[13px] text-slate-500 mt-1">Sem CNPJ. Use seu usuário e senha.</p></div><form class="space-y-4" onsubmit="event.preventDefault(); doLoginUser();"><div><label class="text-[11px] font-bold uppercase text-slate-500">Usuário</label><input id="login-user" autocomplete="username" value="${esc(primeiro.login||'')}" class="mt-1.5 w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0a1e8a] focus:ring-4 focus:ring-[#0a1e8a]/10 outline-none text-[14px]"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Senha</label><input id="login-senha-user" type="password" autocomplete="current-password" class="mt-1.5 w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0a1e8a] focus:ring-4 focus:ring-[#0a1e8a]/10 outline-none text-[14px]"></div><button type="submit" class="w-full h-[48px] rounded-xl bg-[#0a1e8a] text-white font-semibold text-[14px] hover:bg-[#08176e] transition shadow-lg shadow-[#0a1e8a]/20">Entrar</button><p class="text-[11px] text-slate-400 text-center">Usuários: Kauan, Recepção, Katia e Denivaldo.</p></form>`;
}
function abrirTrocaSenhaObrigatoria(userId){
  const u=(db.usuarios||[]).find(x=>x.id===userId); if(!u||!u.deveTrocarSenha) return;
  const root=document.getElementById('modal-root'); if(!root) return;
  document.getElementById('modal-title').innerText='Alterar senha obrigatória';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div class="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-900"><b>Atenção:</b> ${esc(u.avisoTroca||'mude a senha, coloque a senha do usuario do banco antigo')}</div><div><label class="text-[11px] font-bold uppercase text-slate-500">Nova senha</label><input id="senha-obrigatoria-1" type="password" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Confirmar nova senha</label><input id="senha-obrigatoria-2" type="password" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><p class="text-[12px] text-slate-500">Depois de salvar, o login ${esc(u.login)} passa a usar esta nova senha.</p></div>`;
  document.getElementById('modal-footer').innerHTML=`<button onclick="salvarSenhaObrigatoria('${esc(userId)}')" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar nova senha</button>`;
  root.classList.remove('hidden');
}
window.salvarSenhaObrigatoria=function(userId){
  const u=(db.usuarios||[]).find(x=>x.id===userId); if(!u) return;
  const a=txt(document.getElementById('senha-obrigatoria-1')?.value), b=txt(document.getElementById('senha-obrigatoria-2')?.value);
  if(!a||a.length<3) return toastMsg('Informe uma senha com pelo menos 3 caracteres','error');
  if(a!==b) return toastMsg('As senhas não conferem','error');
  if(a==='1234') return toastMsg('Use a senha correta do usuário do banco antigo, não a senha temporária 1234','error');
  u.senha=a; u.deveTrocarSenha=false; u.senhaTemporaria=false; u.senhaAlteradaEm=agora(); salvar();
  const s=sess(); if(s){ s.trocaSenhaObrigatoria=false; if(typeof setSession==='function') setSession(s); }
  if(typeof closeModal==='function') closeModal();
  toastMsg('Senha alterada. Próximos logins usarão a nova senha.','success');
  setTimeout(()=>publicarNuvemVirgemSePreciso(true),800);
};
async function publicarNuvemVirgemSePreciso(force){
  db.config=db.config||{}; db.config.sistemaVirgem=db.config.sistemaVirgem||{};
  if(db.config.sistemaVirgem.publicadoNuvemEm && !force) return;
  if(typeof window.syncEnviarParaNuvem!=='function') return;
  try{
    const r=await window.syncEnviarParaNuvem({confirmar:false,forcar:true,automatico:false});
    if(r&&r.ok){ db.config.sistemaVirgem.publicadoNuvemEm=agora(); salvar(); toastMsg('Nuvem publicada com sistema virgem','success'); }
  }catch(e){ console.warn('[SISTEMA_VIRGEM] Falha ao publicar nuvem',e); }
}
window.publicarNuvemVirgemAgora=function(){ return publicarNuvemVirgemSePreciso(true); };

window.SISTEMA_VIRGEM_PURE={limparDadosAntigos,aplicarUsuariosOficiais,precisaAplicarVirgem,USUARIOS_OFICIAIS};

if(typeof document==='undefined') return;
const reset=aplicarVirgemSePreciso();
if(reset) console.log('[DIGICOPY] Sistema virgem aplicado',reset);
const oldShowLogin=window.showLogin;
window.showLogin=function(){ if(oldShowLogin) oldShowLogin.apply(this,arguments); setTimeout(renderLoginVirgem,40); };
window.doLoginUser=loginDiretoVirgem;
const oldRenderConfig=window.renderConfig;
window.renderConfig=function(){ const r=oldRenderConfig?oldRenderConfig.apply(this,arguments):undefined; setTimeout(()=>{ const grid=document.querySelector('#view-config .grid')||document.getElementById('view-config'); if(grid&&!document.getElementById('virgem-cfg-card')){ const card=document.createElement('div'); card.id='virgem-cfg-card'; card.className='rounded-[16px] bg-white border p-6 lg:col-span-3'; card.innerHTML=`<h4 class="font-bold text-[15px]"><i class="ph ph-broom"></i> Sistema virgem / Nuvem</h4><p class="text-[12px] text-slate-500 mt-1">Dados antigos removidos. Clientes preservados. Usuários oficiais configurados.</p><div class="flex flex-wrap gap-2 mt-3"><button onclick="publicarNuvemVirgemAgora()" class="neo-btn primary"><i class="ph ph-cloud-arrow-up"></i>Publicar nuvem virgem agora</button></div><div class="mt-3 text-[12px] text-slate-500">Versão: ${VIRGEM_VERSAO} • Clientes preservados: ${((db.config||{}).sistemaVirgem||{}).preservouClientes||0}</div>`; grid.appendChild(card); } },120); return r; };
console.log('[DIGICOPY] sistema_virgem_usuarios_patch.js v4.9.57 carregado');
})();
