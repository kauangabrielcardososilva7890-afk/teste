// ═══════════════════════════════════════════════════════════════════════════
// TESTE — FUNÇÃO ÚNICA DE GRAVAÇÃO + BLOCO 2 (ideia E, r38)
// Parte A: a função única cumpre o contrato (não duplica, não inventa forma,
//          anota motivo, delega o save). Parte B: ANTES (git HEAD) × DEPOIS
// (arquivo atual) nos 3 sites migrados — db idêntico, saves iguais, e o DEPOIS
// anota o motivo. Parte C: estrutural (sites chamam a função certa).
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const cp = require('child_process');
function ok(name, cond, extra) {
  if (!cond) { console.error('  ✘ ' + name + (extra ? ' :: ' + extra : '')); process.exit(1); }
  console.log('  ✔ ' + name);
}
console.log('== FUNÇÃO ÚNICA DE GRAVAÇÃO + BLOCO 2 (só confere, nada muda) ==');

const PATCH = 'ajustes_v7022_salvar_alteracao_patch.js';
const FONTE = fs.readFileSync(PATCH, 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const lista = Array.isArray(manifest) ? manifest : (manifest.scripts || manifest.files || []);

// ── Parte 0: presença e higiene ──
ok('o patch da função única existe', fs.existsSync(PATCH));
const pos = lista.indexOf(PATCH);
ok('a função única entra no bundle', pos >= 0, 'pos=' + pos);
ok('a função única carrega depois do portão (usa o diário dele)',
  pos > lista.indexOf('ajustes_v7021_portao_escrita_patch.js'));
ok('definição única (sem conflito — trava D não acusa)',
  (FONTE.match(/window\.salvarAlteracao\s*=/g) || []).length === 1);
const codigo = FONTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
ok('a função única é barata (sem timer, sem rede, sem disco — regra 12)',
  ['setTimeout', 'setInterval', 'localStorage', 'sessionStorage', 'fetch(', 'XMLHttpRequest', 'WebSocket']
    .every((p) => codigo.indexOf(p) < 0));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok('o ritual confere o patch novo (scripts.check)', (pkg.scripts.check || '').indexOf(PATCH) >= 0);

// carrega a função única REAL num window de mentira
function carregar(window) {
  new Function('window', 'document', FONTE)(window, {});
  return window.salvarAlteracao;
}
function baseMock(db) {
  const chamadas = [];
  const motivos = [];
  const window = {
    db: db,
    saveDB: function () { chamadas.push(1); return 'salvo'; },
    DIGICOPY_PORTAO: { anotarMotivo: function (m) { motivos.push(m); } }
  };
  return { window: window, chamadas: chamadas, motivos: motivos };
}

// ── Parte A: contrato da função única ──
{
  const m = baseMock({ clientes: [] });
  const salvar = carregar(m.window);
  const r = salvar('clientes', { id: 'c1', nome: 'A' }, 'cliente criado');
  ok('A1 registro novo entra na lista', m.window.db.clientes.length === 1 && m.window.db.clientes[0].id === 'c1');
  ok('A2 grava 1 vez e devolve o retorno do save', m.chamadas.length === 1 && r === 'salvo');
  ok('A3 motivo vai para o diário', m.motivos.length === 1 && m.motivos[0] === 'cliente criado');
}
{
  const alvo = { id: 'c1', nome: 'B' };
  const m = baseMock({ clientes: [alvo] });
  const salvar = carregar(m.window);
  salvar('clientes', alvo, 'cliente editado');
  ok('A4 registro que já está lá NÃO duplica (mutação in-place)', m.window.db.clientes.length === 1);
  ok('A5 e mesmo assim grava + anota', m.chamadas.length === 1 && m.motivos[0] === 'cliente editado');
}
{
  const antes = { produtos: [{ id: 'p1', categoria: 'X' }] };
  const m = baseMock(JSON.parse(JSON.stringify(antes)));
  carregar(m.window)('produtos', null, 'correção em massa');
  ok('A6 registro null não mexe no db (só anota e grava)',
    JSON.stringify(m.window.db) === JSON.stringify(antes) && m.chamadas.length === 1 && m.motivos[0] === 'correção em massa');
}
{
  const m = baseMock({});
  carregar(m.window)('clientes', { id: 'c9' }, 'x');
  ok('A7 lista ausente: NÃO inventa forma no db (só grava)', !('clientes' in m.window.db) && m.chamadas.length === 1);
}
{
  const m = baseMock({ clientes: 'não é lista' });
  carregar(m.window)('clientes', { id: 'c9' }, 'x');
  ok('A8 lista que não é lista: ignora o upsert, grava normal',
    m.window.db.clientes === 'não é lista' && m.chamadas.length === 1);
}
{
  const m = baseMock({ clientes: [] });
  delete m.window.saveDB;
  const salvar = carregar(m.window);
  let erro = '';
  try { salvar('clientes', { id: 'c1' }, 'x'); } catch (e) { erro = String(e && e.message || e); }
  m.window.saveDB = function () { m.chamadas.push(1); };
  m.window.saveDB();
  ok('A9 sem saveDB não quebra e não deixa motivo pendente (sem vazamento)',
    erro === '' && m.motivos.length === 0 && m.chamadas.length === 1);
}
{
  const m = baseMock({ clientes: [] });
  const f1 = carregar(m.window);
  const f2 = carregar(m.window);
  ok('A10 carregar 2 vezes não troca a função (guarda __portaoE2)', f1 === f2);
}

// ── Parte B: ANTES (git HEAD) × DEPOIS (atual), de verdade ──
function antesDe(arq) {
  return cp.execFileSync('git', ['show', 'HEAD:' + arq], { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
}
function avaliarArquivo(src, window, db, saveDB, salvar, getSession) {
  new Function('window', 'document', 'db', 'saveDB', 'salvarAlteracao', 'getSession', src)(
    window, {}, db, saveDB, salvar, getSession);
}
const FLAG224 = 'correcaoCatLetraUmaVez';
function semente224() {
  return { produtos: [{ id: 'p1', categoria: 'P' }, { id: 'p2', categoria: 'Chip' }, { id: 'p3', categoria: 's' }], config: {} };
}
function realSalvarPara(window) {
  new Function('window', 'document', FONTE)(window, {});
  return window.salvarAlteracao;
}
function rodar224(src, usarReal, comApi) {
  const db = semente224();
  const chamadas = [];
  const motivos = [];
  const window = {
    db: db,
    saveDB: function () { chamadas.push(1); },
    DIGICOPY_PORTAO: { anotarMotivo: function (m) { motivos.push(m); } },
    renderProdutos: function () { /* original */ }
  };
  if (comApi) window.CAT_LETRA_PURE = { ehLetraFiltro: function (v) { return /^[psice]$/i.test(String(v || '')); }, letraParaNome: function (v) { return 'NOME:' + v; } };
  const salvar = usarReal ? realSalvarPara(window) : undefined;
  avaliarArquivo(src, window, db, window.saveDB, salvar, undefined);
  window.renderProdutos(); // o patch embrulha e roda aplicarUmaVez()
  const norm = JSON.parse(JSON.stringify(db));
  const em = norm.config && norm.config[FLAG224] && norm.config[FLAG224].em;
  if (norm.config && norm.config[FLAG224]) delete norm.config[FLAG224].em;
  return { norm: norm, n: db.config[FLAG224].n, em: em, saves: chamadas.length, motivos: motivos };
}
['sem API de letra', 'com API de letra'].forEach((modo, k) => {
  const comApi = k === 1;
  const srcAntes = antesDe('ajustes_v52224_cat_letra_uma_vez_patch.js');
  const srcDepois = fs.readFileSync('ajustes_v52224_cat_letra_uma_vez_patch.js', 'utf8');
  if (k === 0) console.log('  (HEAD ' + (srcAntes === srcDepois ? 'igual ao atual — modo regressão' : 'difere — ANTES × DEPOIS real') + ')');
  const a = rodar224(srcAntes, false, comApi);
  const d = rodar224(srcDepois, true, comApi);
  ok('B1[' + modo + '] v52224: db idêntico antes/depois (ignorando o relógio)',
    JSON.stringify(a.norm) === JSON.stringify(d.norm), JSON.stringify(d.norm));
  ok('B2[' + modo + '] v52224: mesma contagem e relógio válido nos dois',
    a.n === d.n && a.n === 2 && !isNaN(Date.parse(a.em)) && !isNaN(Date.parse(d.em)));
  ok('B3[' + modo + '] v52224: mesmos saves (1 e 1)', a.saves === 1 && d.saves === 1);
});

// NOTE: o motivo do DEPOIS é conferido com o diário ligado de verdade:
{
  const srcDepois = fs.readFileSync('ajustes_v52224_cat_letra_uma_vez_patch.js', 'utf8');
  const db = semente224();
  const chamadas = [];
  const motivos = [];
  const window = {
    db: db, saveDB: function () { chamadas.push(1); },
    DIGICOPY_PORTAO: { anotarMotivo: function (m) { motivos.push(m); } },
    renderProdutos: function () { }
  };
  const salvar = realSalvarPara(window);
  avaliarArquivo(srcDepois, window, db, window.saveDB, salvar, undefined);
  window.renderProdutos();
  ok('B4 v52224: o DEPOIS anota o motivo', motivos.length === 1 && motivos[0] === 'letra de categoria padronizada');
}

function semente196() {
  return {
    usuarios: [
      { id: 'u-admin', login: 'kauan', empresaId: 'e1', perfil: 'Funcionário' },
      { id: 'u-dono', login: 'denivaldo', empresaId: 'e1', perfil: 'Funcionário' },
      { id: 'u-alvo', login: 'maria', empresaId: 'e1', perfil: 'Funcionário' }
    ],
    tecnicos: [{ id: 't1', nome: 'Zé' }]
  };
}
function rodar196(src, qual, usarReal) {
  const db = semente196();
  const chamadas = [];
  const motivos = [];
  const window = {
    db: db,
    saveDB: function () { chamadas.push(1); },
    DIGICOPY_PORTAO: { anotarMotivo: function (m) { motivos.push(m); } },
    confirmSistema: function () { return { then: function (cb) { cb(true); } }; }
  };
  const salvarOuNada = usarReal ? realSalvarPara(window) : undefined;
  const sess = function () { return { usuarioId: 'u-admin', empresaId: 'e1', login: 'kauan' }; };
  avaliarArquivo(src, window, db, window.saveDB, salvarOuNada, sess);
  if (qual === 'usuario') window.excluirUsuario('u-alvo'); else window.excluirTecnico('t1');
  return { db: db, saves: chamadas.length, motivos: motivos };
}
{
  const srcAntes = antesDe('ajustes_v5196_patch.js');
  const srcDepois = fs.readFileSync('ajustes_v5196_patch.js', 'utf8');
  console.log('  (v5196 HEAD ' + (srcAntes === srcDepois ? 'igual — regressão' : 'difere — ANTES × DEPOIS real') + ')');
  const aU = rodar196(srcAntes, 'usuario', false);
  const dU = rodar196(srcDepois, 'usuario', true);
  const aT = rodar196(srcAntes, 'tecnico', false);
  const dT = rodar196(srcDepois, 'tecnico', true);
  ok('B5 excluirUsuario: db idêntico antes/depois', JSON.stringify(aU.db) === JSON.stringify(dU.db));
  ok('B6 excluirUsuario: alvo sumiu, resto intacto',
    dU.db.usuarios.length === 2 && !dU.db.usuarios.some((u) => u.id === 'u-alvo'));
  ok('B7 excluirUsuario: mesmos saves (1 e 1)', aU.saves === 1 && dU.saves === 1);
  ok('B8 excluirTecnico: db idêntico antes/depois', JSON.stringify(aT.db) === JSON.stringify(dT.db));
  ok('B9 excluirTecnico: técnico sumiu', dT.db.tecnicos.length === 0);
  ok('B10 excluirTecnico: mesmos saves (1 e 1)', aT.saves === 1 && dT.saves === 1);
}

// ── Parte C: estrutural (os 3 sites chamam a função certa) ──
const v224 = fs.readFileSync('ajustes_v52224_cat_letra_uma_vez_patch.js', 'utf8');
const v196 = fs.readFileSync('ajustes_v5196_patch.js', 'utf8');
ok('C1 v52224 chama a função única com lista+motivo',
  v224.indexOf("salvarAlteracao('produtos',null,'letra de categoria padronizada')") >= 0);
ok('C2 v52224 sem o save direto antigo',
  v224.indexOf("\n  if(typeof saveDB==='function') saveDB();") < 0);
ok('C3 v5196 excluirUsuario chama a função única',
  v196.indexOf("salvarAlteracao('usuarios',null,'usuário excluído')") >= 0);
ok('C4 v5196 excluirTecnico chama a função única',
  v196.indexOf("salvarAlteracao('tecnicos',null,'técnico excluído')") >= 0);
ok('C5 v5196 sem os 2 saves diretos antigos (os outros 2 ficam para os próximos blocos)',
  v196.indexOf("\n    if(typeof saveDB === 'function') saveDB();") < 0 &&
  (v196.match(/\n  if\(typeof saveDB === 'function'\) saveDB\(\);/g) || []).length === 2);

console.log('\nRESULTADO: função única + bloco 2 passaram!');
