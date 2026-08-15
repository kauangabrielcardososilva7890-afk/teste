// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.6 — Usuários e permissões (hierarquia) + técnicos
// • 0  — Remove TODO o fluxo de "senha CNPJ" da criação/edição de usuário.
// • 1/2— Cada um edita só o SEU usuário. Editar outros: só Admin (Kauan) e
//        Dono (Denivaldo).
// • 3  — Ao criar usuário, perfil é sempre "Funcionário" (Admin/Dono ocultos).
//        A troca de perfil só aparece para Admin/Dono editando outro usuário.
// • 4  — "Cadastrar para escolher em vendas/chamados" vira cadastro de TÉCNICO
//        (só nome). Técnicos aparecem na listagem junto com usuários, com
//        menos informações e botão de editar só o nome.
// • 5  — Quem não tem permissão não vê o botão de editar.
// • 6  — Campos abertos de "técnico" em chamados/vendas viram lista de seleção
//        com os técnicos criados.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function txt(v){ return String(v == null ? '' : v).trim(); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function toastMsg(m, t){ if(typeof toast === 'function') return toast(m, t || 'info'); }
function uidSafe(p){ return typeof uid === 'function' ? uid(p) : (p + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,8)); }

// ─────────────────────────────────────────────────────────────────────────
// Lógica pura (testável)
// ─────────────────────────────────────────────────────────────────────────

// Perfil efetivo de um usuário (hierarquia do sistema).
function perfilEfetivo(u){
  const l = fold((u && (u.login || u.nome)) || '');
  if(l === 'kauan') return 'Admin';
  if(l === 'denivaldo') return 'Dono';
  const p = txt(u && u.perfil);
  if(p === 'Admin') return 'Admin';
  if(p === 'Dono') return 'Dono';
  return 'Funcionário';
}

// Sessão atual tem permissão total? (Admin = Kauan / Dono = Denivaldo)
function temPermissaoTotal(s){
  const l = fold((s && (s.login || s.usuarioNome)) || '');
  if(l === 'kauan' || l === 'denivaldo') return true;
  const p = txt(s && s.perfil);
  return p === 'Admin' || p === 'Dono';
}

// Pode editar o usuário alvo? (a si mesmo sempre; os outros só Admin/Dono)
function podeEditarUsuario(s, alvoId){
  if(temPermissaoTotal(s)) return true;
  return !!(s && alvoId && s.usuarioId === alvoId);
}

window.AJUSTES_V5196_PURE = { fold: fold, perfilEfetivo: perfilEfetivo, temPermissaoTotal: temPermissaoTotal, podeEditarUsuario: podeEditarUsuario };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

// ─────────────────────────────────────────────────────────────────────────
// Lista combinada: usuários + técnicos
// ─────────────────────────────────────────────────────────────────────────
function tecnicosLista(){
  return Array.isArray(db.tecnicos) ? db.tecnicos : [];
}

window.renderUsuarios = function(){
  const s = sess(); if(!s) return;
  const view = document.getElementById('view-usuarios'); if(!view) return;
  const privilegiado = temPermissaoTotal(s);
  const usuarios = (db.usuarios || []).filter(u => u.empresaId === s.empresaId);
  const tecnicos = tecnicosLista();

  const linhasUsuarios = usuarios.map(u => {
    const pode = podeEditarUsuario(s, u.id);
    const perfil = perfilEfetivo(u);
    const pill = perfil === 'Admin' ? 'primary' : (perfil === 'Dono' ? 'primary' : 'info');
    const btnEdit = pode ? `<button onclick="openModal('usuario','${esc(u.id)}')" class="neo-btn"><i class="ph ph-pencil"></i></button>` : '';
    return `<tr>
      <td><b>${esc(u.nome || '')}</b></td>
      <td>${esc(u.login || '')}</td>
      <td>${perfil === 'Funcionário' ? '<span class="neo-status info">Funcionário</span>' : `<span class="neo-status primary">${esc(perfil)}</span>`}</td>
      <td><span class="neo-status ${u.ativo ? 'ok' : 'wait'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td>${btnEdit}</td>
    </tr>`;
  }).join('');

  const linhasTecnicos = tecnicos.map(t => {
    return `<tr>
      <td><b>${esc(t.nome || '')}</b> <span class="neo-status info">Técnico</span></td>
      <td class="text-slate-400">—</td>
      <td><span class="neo-status info">Técnico</span></td>
      <td class="text-slate-400">—</td>
      <td><button onclick="openModalEditarTecnico('${esc(t.id)}')" class="neo-btn"><i class="ph ph-pencil"></i></button></td>
    </tr>`;
  }).join('');

  view.innerHTML = `<div class="neo-shell"><div class="neo-panel neo-float-in">
    <div class="neo-head">
      <div><h3>Usuários e permissões</h3><p>Hierarquia: Admin (Kauan) e Dono (Denivaldo) têm permissão total. Demais são Funcionários.</p></div>
      <div class="neo-actions">
        <button onclick="openModalCriarUsuario()" class="neo-btn primary"><i class="ph ph-user-plus"></i>Novo usuário</button>
        <button onclick="openModalNovoTecnico()" class="neo-btn"><i class="ph ph-plus-circle"></i>Novo técnico</button>
      </div>
    </div>
    <div class="overflow-auto max-h-[calc(100vh-290px)]">
      <table class="neo-table">
        <thead><tr><th>Nome</th><th>Login</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>${linhasUsuarios || ''}${linhasTecnicos || ''}${(!linhasUsuarios && !linhasTecnicos) ? '<tr><td colspan="5" class="text-center text-slate-500 py-12">Nenhum usuário ou técnico</td></tr>' : ''}</tbody>
      </table>
    </div>
  </div></div>`;
};

// ─────────────────────────────────────────────────────────────────────────
// Modal de usuário (sem senha CNPJ; perfil com regras de hierarquia)
// ─────────────────────────────────────────────────────────────────────────
window.openModalCriarUsuario = function(){
  window.renderModalUsuario(null);
  document.getElementById('modal-root')?.classList.remove('hidden');
  window.modalContext = { type: 'usuario', id: null };
};

window.renderModalUsuario = function(id){
  const s = sess(); if(!s) return;
  const isEdit = !!id;
  const u = isEdit ? (db.usuarios || []).find(x => x.id === id && x.empresaId === s.empresaId) : null;
  if(isEdit && !u) return toastMsg('Usuário não encontrado', 'error');
  if(isEdit && !podeEditarUsuario(s, id)) return toastMsg('Você só pode editar o seu próprio usuário', 'error');

  const privilegiado = temPermissaoTotal(s);
  const perfilAtual = perfilEfetivo(u || { perfil: 'Funcionário' });

  // Perfil só aparece (e só pode mudar) se for Admin/Dono editando alguém.
  const perfilHtml = (isEdit && privilegiado)
    ? `<div><label class="text-[11px] font-bold uppercase text-slate-500">Perfil</label><select id="u-perfil" class="mt-1 w-full h-11 px-3 rounded-xl border bg-white">
         <option value="Funcionário" ${perfilAtual === 'Funcionário' ? 'selected' : ''}>Funcionário</option>
         <option value="Admin" ${perfilAtual === 'Admin' ? 'selected' : ''}>Admin</option>
         <option value="Dono" ${perfilAtual === 'Dono' ? 'selected' : ''}>Dono</option>
       </select></div>`
    : '';

  const root = document.getElementById('modal-root'); if(root) root.classList.remove('hidden');
  document.getElementById('modal-title').innerText = isEdit ? 'Editar usuário' : 'Novo usuário';
  document.getElementById('modal-body').innerHTML = `<div class="space-y-4">
    <div><label class="text-[11px] font-bold uppercase text-slate-500">Nome completo *</label><input id="u-nome" value="${esc(u ? u.nome : '')}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-[11px] font-bold uppercase text-slate-500">Login usuário *</label><input id="u-login" value="${esc(u ? u.login : '')}" placeholder="ex: carlos" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
      <div><label class="text-[11px] font-bold uppercase text-slate-500">Senha usuário *</label><input id="u-senha" type="password" value="${esc(u ? u.senha : '')}" placeholder="senha do usuário" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      ${perfilHtml}
      <div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="u-ativo" class="mt-1 w-full h-11 px-3 rounded-xl border bg-white"><option value="true" ${!u || u.ativo ? 'selected' : ''}>Ativo</option><option value="false" ${u && !u.ativo ? 'selected' : ''}>Inativo</option></select></div>
    </div>
    ${!isEdit ? '<p class="text-[11px] text-slate-400">Novos usuários entram como <b>Funcionário</b>. Apenas Admin/Dono podem alterar perfis.</p>' : ''}
  </div>`;
  document.getElementById('modal-footer').innerHTML = `<button onclick="closeModal()" class="neo-btn">Cancelar</button><button onclick="saveUsuarioFinal('${esc(id || '')}')" class="neo-btn primary">Salvar usuário</button>`;
};

// Salvar usuário (sem senha CNPJ; perfil conforme hierarquia)
window.saveUsuarioFinal = function(id){
  const s = sess(); if(!s) return;
  const privilegiado = temPermissaoTotal(s);
  const nome = txt(document.getElementById('u-nome') && document.getElementById('u-nome').value);
  const login = fold(document.getElementById('u-login') && document.getElementById('u-login').value);
  const senha = txt(document.getElementById('u-senha') && document.getElementById('u-senha').value);
  const ativo = document.getElementById('u-ativo') ? document.getElementById('u-ativo').value === 'true' : true;
  if(!nome || !login || !senha) return toastMsg('Preencha nome, login e senha', 'error');

  let u = id ? (db.usuarios || []).find(x => x.id === id) : null;
  if(u && !podeEditarUsuario(s, u.id)) return toastMsg('Você só pode editar o seu próprio usuário', 'error');
  if(!u && (db.usuarios || []).some(x => x.empresaId === s.empresaId && fold(x.login) === login)) return toastMsg('Login já existe', 'error');

  // Perfil: ao criar = Funcionário; ao editar, só Admin/Dono mudam.
  let perfil;
  if(u){
    perfil = (privilegiado && document.getElementById('u-perfil')) ? document.getElementById('u-perfil').value : perfilEfetivo(u);
  } else {
    perfil = 'Funcionário';
  }

  if(u){
    Object.assign(u, { nome: nome, login: login, senha: senha, ativo: ativo, perfil: perfil, atualizadoEm: new Date().toISOString(), atualizadoPor: s.usuarioId });
    if(typeof logAction === 'function') logAction('usuario', 'editar', u.id, 'Editado usuário ' + login + ' perfil ' + perfil);
  } else {
    u = { id: uidSafe('usr'), empresaId: s.empresaId, nome: nome, login: login, senha: senha, ativo: ativo, perfil: perfil, criadoEm: new Date().toISOString(), criadoPor: s.usuarioId, criadoPorNome: s.usuarioNome };
    (db.usuarios = db.usuarios || []).push(u);
    if(typeof logAction === 'function') logAction('usuario', 'criar', u.id, 'Criado usuário ' + login + ' perfil ' + perfil);
  }
  if(typeof saveDB === 'function') saveDB();
  if(typeof renderUsuarios === 'function') renderUsuarios();
  if(typeof closeModal === 'function') closeModal();
  toastMsg('Usuário salvo', 'success');
};

// Sobrescreve o saveUsuario antigo (app.js) — remove a exigência de senha CNPJ.
window.saveUsuario = function(){
  const id = window.modalContext && window.modalContext.id;
  window.saveUsuarioFinal(id || '');
};

// ─────────────────────────────────────────────────────────────────────────
// Técnico: cadastrar/editar (só nome)
// ─────────────────────────────────────────────────────────────────────────
window.openModalNovoTecnico = function(){
  const root = document.getElementById('modal-root'); if(root) root.classList.remove('hidden');
  window.modalContext = { type: 'tecnico', id: null };
  document.getElementById('modal-title').innerText = 'Novo técnico';
  document.getElementById('modal-body').innerHTML = `<div class="space-y-4">
    <div><label class="text-[11px] font-bold uppercase text-slate-500">Nome do técnico *</label><input id="tec-nome" placeholder="Nome para escolher em chamados/vendas" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
    <p class="text-[11px] text-slate-400">O técnico aparece na lista de seleção dos chamados e das vendas.</p>
  </div>`;
  document.getElementById('modal-footer').innerHTML = `<button onclick="closeModal()" class="neo-btn">Cancelar</button><button onclick="salvarTecnico()" class="neo-btn primary">Salvar técnico</button>`;
};

window.openModalEditarTecnico = function(id){
  const t = (db.tecnicos || []).find(x => x.id === id);
  if(!t) return toastMsg('Técnico não encontrado', 'error');
  const root = document.getElementById('modal-root'); if(root) root.classList.remove('hidden');
  window.modalContext = { type: 'tecnico', id: id };
  document.getElementById('modal-title').innerText = 'Editar técnico';
  document.getElementById('modal-body').innerHTML = `<div class="space-y-4">
    <div><label class="text-[11px] font-bold uppercase text-slate-500">Nome do técnico *</label><input id="tec-nome" value="${esc(t.nome || '')}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
  </div>`;
  document.getElementById('modal-footer').innerHTML = `<button onclick="closeModal()" class="neo-btn">Cancelar</button><button onclick="salvarTecnico()" class="neo-btn primary">Salvar</button>`;
};

window.salvarTecnico = function(){
  const s = sess(); if(!s) return;
  const nome = txt(document.getElementById('tec-nome') && document.getElementById('tec-nome').value);
  if(!nome) return toastMsg('Informe o nome do técnico', 'error');
  db.tecnicos = db.tecnicos || [];
  const id = window.modalContext && window.modalContext.id;
  if(id){
    const t = db.tecnicos.find(x => x.id === id);
    if(t){ t.nome = nome; t.atualizadoEm = new Date().toISOString(); }
  } else {
    db.tecnicos.push({ id: uidSafe('tec'), nome: nome, especialidade: 'Geral', osConcluidas: 0, criadoEm: new Date().toISOString() });
  }
  if(typeof saveDB === 'function') saveDB();
  if(typeof renderUsuarios === 'function') renderUsuarios();
  if(typeof closeModal === 'function') closeModal();
  toastMsg('Técnico salvo', 'success');
};

// ─────────────────────────────────────────────────────────────────────────
// Item 6 — campos abertos de "técnico" viram lista de seleção
// ─────────────────────────────────────────────────────────────────────────
const CAMPOS_TECNICO = ['vos-item-tec', 'vos-os-tec', 'vos-os-entrega', 'ca-tec', 'ko-tec'];

function converterCampoTecnico(id){
  const el = document.getElementById(id);
  if(!el || el.tagName !== 'INPUT') return;
  const valorAtual = txt(el.value);
  const sel = document.createElement('select');
  sel.id = id;
  sel.className = el.className || '';
  let html = '<option value="">Selecione</option>';
  tecnicosLista().forEach(function(t){
    const nome = txt(t.nome);
    if(!nome) return;
    html += `<option value="${esc(nome)}" ${nome === valorAtual ? 'selected' : ''}>${esc(nome)}</option>`;
  });
  if(valorAtual && !tecnicosLista().some(t => txt(t.nome) === valorAtual)){
    html += `<option value="${esc(valorAtual)}" selected>${esc(valorAtual)}</option>`;
  }
  sel.innerHTML = html;
  el.parentNode.replaceChild(sel, el);
}

function converterCamposTecnico(){
  CAMPOS_TECNICO.forEach(converterCampoTecnico);
}

// Observador: converte assim que os campos aparecerem (qualquer modal).
let _tecTimer = null;
function agendarConversao(){
  if(_tecTimer) return;
  _tecTimer = setTimeout(function(){
    _tecTimer = null;
    converterCamposTecnico();
  }, 60);
}
try{
  new MutationObserver(function(){ agendarConversao(); }).observe(document.body, { childList: true, subtree: true });
}catch(e){}

console.log('[DIGICOPY] ajustes_v5196_patch.js');
})();
