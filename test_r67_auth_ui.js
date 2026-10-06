const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function ok(name, condition) {
  assert.ok(condition, name);
  console.log('✔ ' + name);
}

// Login em hash: texto legado divergente não pode autenticar.
const loginSrc = fs.readFileSync('ajustes_v52253_login_tela_branca_patch.js', 'utf8');
const loginWindow = { addEventListener() {}, removeEventListener() {} };
loginWindow.window = loginWindow;
new Function('window', 'document', loginSrc)(loginWindow, undefined);
const login = loginWindow.LOGIN_TELA_BRANCA_V52253_PURE;
const hashedUser = [{ id: 'qa-user', nome: 'Usuário Sintético', login: 'qa-user', ativo: true, senha: 'senha-antiga-sintetica', senhaSalt: 'salt-sintetico', senhaHash: 'hash-da-senha-nova' }];
ok('senha antiga em texto é ignorada quando há hash e salt', login.loginFlexivel('qa-user', 'senha-antiga-sintetica', hashedUser) === null);
ok('compatibilidade de registros sem hash permanece', login.loginFlexivel('qa-user', 'senha-legada-sintetica', [{ ...hashedUser[0], senha: 'senha-legada-sintetica', senhaHash: '', senhaSalt: '' }])?.id === 'qa-user');

// Harness DOM mínimo para exercer as rotinas reais do menu sem dados ou rede.
function element(id) {
  const classes = new Set(['hidden']);
  return {
    id, value: '', innerHTML: '', innerText: '', textContent: '', style: {}, dataset: {}, tagName: 'INPUT',
    classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
    setAttribute() {}, addEventListener() {}, remove() {}
  };
}
const elements = Object.create(null);
const document = {
  getElementById(id) { return elements[id] || null; },
  querySelectorAll() { return []; },
  createElement(tag) { const e = element(tag); e.tagName = String(tag).toUpperCase(); e.options = []; return e; },
  addEventListener() {}, removeEventListener() {}
};
['view-usuarios','modal-root','modal-title','modal-body','modal-footer','u-nome','u-login','u-senha','u-ativo','u-perfil','tec-nome'].forEach(id => elements[id] = element(id));
const db = {
  usuarios: [
    { id: 'qa-admin', empresaId: 'qa-company', nome: 'Admin Sintético', login: 'qa-admin', senha: 'senha-anterior-sintetica', senhaSalt: 'salt-a', senhaHash: 'hash-a', senhaPadrao: true, ativo: true, perfil: 'Admin' },
    { id: 'qa-func', empresaId: 'qa-company', nome: 'Funcionário Sintético', login: 'qa-func', senha: 'senha-func-sintetica', ativo: true, perfil: 'Funcionário' },
    { id: 'qa-outra-empresa', empresaId: 'outra', nome: 'Separado', login: 'separado', senha: 'nao-exibir-sintetica', ativo: true, perfil: 'Admin' }
  ], tecnicos: [{ id: 'tec-1', nome: 'Técnico Sintético' }], logs: []
};
let sessao = { empresaId: 'qa-company', usuarioId: 'qa-admin', usuarioNome: 'Admin Sintético', perfil: 'Admin' };
let saves = 0;
let confirmCalls = 0;
const notices = [];
let idCounter = 0;
const window = {
  confirmSistema: async () => { confirmCalls++; return true; },
  lfbAlert() {},
  AJUSTES_V5196_PURE: null
};
window.window = window;
const getSession = () => sessao;
const toast = (message, type) => notices.push({ message, type });
const uid = prefix => prefix + '_qa_' + (++idCounter);
const saveDB = () => { saves++; };
const atualizarHashRegistro = async (user, password) => { user.senhaSalt = 'salt-sintetico'; user.senhaHash = 'hash:' + password; return true; };
const closeModal = () => elements['modal-root'].classList.add('hidden');
const logAction = () => {};
const salvarAlteracao = () => { saves++; };
const renderAuditoria = () => {};
const sourceMenu = fs.readFileSync('ajustes_v5196_patch.js', 'utf8');
const context = { window, document, db, getSession, toast, uid, saveDB, atualizarHashRegistro, closeModal, logAction, salvarAlteracao, renderAuditoria, setInterval: () => 0, setTimeout: () => 0, console, Date, Promise, Math, String, Array, Object };
vm.runInNewContext(sourceMenu, context, { timeout: 3000 });
const P = window.AJUSTES_V5196_PURE;
ok('somente perfil Admin/Dono tem permissão total', P.temPermissaoTotal({ perfil: 'Admin' }) && P.temPermissaoTotal({ perfil: 'Dono' }) && !P.temPermissaoTotal({ perfil: 'Funcionário' }));
ok('funcionário pode editar a si, mas não outro usuário', P.podeEditarUsuario({ usuarioId: 'qa-func', perfil: 'Funcionário' }, 'qa-func') && !P.podeEditarUsuario({ usuarioId: 'qa-func', perfil: 'Funcionário' }, 'qa-admin'));
window.renderUsuarios();
ok('lista mostra só usuários da empresa ativa e não exibe senha', elements['view-usuarios'].innerHTML.includes('qa-admin') && !elements['view-usuarios'].innerHTML.includes('nao-exibir-sintetica'));
ok('título do menu não exibe a linha técnica de hierarquia', !elements['view-usuarios'].innerHTML.includes('Hierarquia:'));

window.openModalCriarUsuario();
elements['u-nome'].value = 'Novo Usuário QA';
elements['u-login'].value = 'novo-qa';
elements['u-senha'].value = 'senha-nova-sintetica';
elements['u-ativo'].value = 'true';
(async () => {
  await window.saveUsuarioFinal('');
  const novo = db.usuarios.find(u => u.login === 'novo-qa');
  ok('criar usuário grava na empresa atual e aplica perfil Funcionário', !!novo && novo.empresaId === 'qa-company' && novo.perfil === 'Funcionário' && novo.ativo === true);
  ok('criar usuário gera hash antes de finalizar', novo.senhaHash === 'hash:senha-nova-sintetica' && novo.senhaPadrao === true);

  elements['u-nome'].value = 'Admin Sintético';
  elements['u-login'].value = 'qa-admin';
  elements['u-senha'].value = 'senha-nova-sintetica';
  elements['u-ativo'].value = 'true';
  await window.saveUsuarioFinal('qa-admin');
  const admin = db.usuarios.find(u => u.id === 'qa-admin');
  ok('troca sintética da própria senha atualiza o hash e limpa senhaPadrao', admin.senha === 'senha-nova-sintetica' && admin.senhaHash === 'hash:senha-nova-sintetica' && admin.senhaPadrao === false);
  ok('rotinas do menu salvaram alterações locais', saves >= 2);

  elements['u-nome'].value = 'Funcionário Sintético';
  elements['u-login'].value = 'qa-func';
  elements['u-senha'].value = '';
  elements['u-perfil'].value = 'Funcionário';
  elements['u-ativo'].value = 'false';
  await window.saveUsuarioFinal('qa-func');
  const inativo = db.usuarios.find(u => u.id === 'qa-func');
  ok('salvar usuário inativo persiste status sem emitir falso alerta de falha', inativo.ativo === false && notices.some(n => /salvo como inativo/i.test(n.message)) && !notices.some(n => /NÃO ficou gravado/i.test(n.message)));

  const countBeforeSelfDelete = db.usuarios.length;
  window.excluirUsuario('qa-admin');
  ok('menu impede excluir a própria conta', db.usuarios.length === countBeforeSelfDelete && confirmCalls === 0);
  window.excluirUsuario('qa-func');
  await Promise.resolve();
  ok('Admin consegue excluir outro usuário após confirmação', !db.usuarios.some(u => u.id === 'qa-func') && confirmCalls === 1);

  window.openModalNovoTecnico();
  elements['tec-nome'].value = 'Técnico QA Novo';
  window.salvarTecnico();
  const tec = db.tecnicos.find(t => t.nome === 'Técnico QA Novo');
  ok('cadastrar técnico cria item sintético', !!tec);
  window.modalContext = { type: 'tecnico', id: tec.id };
  elements['tec-nome'].value = 'Técnico QA Editado';
  window.salvarTecnico();
  ok('editar técnico atualiza o nome', tec.nome === 'Técnico QA Editado');
  window.excluirTecnico(tec.id);
  await Promise.resolve();
  ok('excluir técnico remove o item após confirmação', !db.tecnicos.some(t => t.id === tec.id) && confirmCalls === 2);

  const html = fs.readFileSync('index.html', 'utf8');
  const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
  const diag = fs.readFileSync('ajustes_v52267_diagnostico_nuvem_patch.js', 'utf8');
  const syncSource = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
  const notes = fs.readFileSync('patch_notes_local.js', 'utf8');
  const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  ok('rótulo Nuvem é acionável e acessível', /id="dc-cloud-diag-trigger"[^>]*aria-label="Abrir diagnóstico da nuvem"/.test(html) && html.includes('>Nuvem</span>'));
  ok('diagnóstico está no bundle e usa somente GET explícito', manifest.includes('ajustes_v52267_diagnostico_nuvem_patch.js') && diag.includes("api('/health',{method:'GET'})") && !/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/.test(diag));
  ok('clique do diagnóstico usa delegação e sobrevive à recriação da barra', diag.includes("document.addEventListener('click'") && diag.includes("closest('#dc-cloud-diag-trigger')"));
  ok('pull de leitura só roda com token autorizado', /async function tickSohLeitura\(reason\)\{[\s\S]{0,140}?if\(!authorized\(\)\)return false;/.test(syncSource) && /async function puxarAoAbrirTela\(\)\{[\s\S]{0,140}?if\(!authorized\(\)\)return false;/.test(syncSource));
  ok('notas de v'+version+' estão embutidas no bundle e a chave depende só da versão', manifest.includes('patch_notes_local.js') && notes.includes("'7.3.11'") && notes.includes('digicopy_patch_visto_') && notes.includes('localStorage.setItem(chave(versao),\'1\')') && notes.includes('Desativar um usuário agora'));
  console.log('\nRESULTADO: testes sintéticos r67 de autenticação, Usuários, Técnicos, diagnóstico e patch passaram.');
})().catch(e => { console.error(e); process.exitCode = 1; });
