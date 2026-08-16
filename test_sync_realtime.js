// Teste puro da lógica de MESCLAGEM do sync_realtime_patch.js (sem rede)
const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, 'sync_realtime_patch.js'), 'utf8');

// ---- stubs de navegador ----
function makeStorage(){ const s={}; return { getItem:k=>k in s?s[k]:null, setItem:(k,v)=>{s[k]=String(v);}, removeItem:k=>{delete s[k];}, _s:s }; }

const fakeLocal = makeStorage();
const fakeSession = makeStorage();

global.localStorage = fakeLocal;
global.sessionStorage = fakeSession;
global.document = { readyState:'complete', addEventListener(){}, activeElement:null };
global.fetch = async ()=>{ throw new Error('sem rede no teste'); };
global.getSession = ()=>null;
global.navigateTo = ()=>{};
global.saveDB = ()=>{};
global.setInterval = ()=>0;  // não roda loop no teste
global.setTimeout = ()=>0;

function emptyDb(){
  return { empresas:[],usuarios:[],clientes:[],produtos:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[],contasPagar:[],tecnicos:[],notificacoes:[],config:{empresa:{}},modulosDinamicos:{},logs:[] };
}
global.db = emptyDb();

global.window = {
  FIREBASE_CONFIG:{ apiKey:'fake', projectId:'fake' },
  DIGI_MODO_LEVE:false,
  navigateTo: global.navigateTo,
  saveDB: global.saveDB
};

eval(code);

const I = window.__syncRtInternals;
let pass=0, fail=0;
function ok(cond, nome){ if(cond){ pass++; } else { fail++; console.log('  ✗ FALHOU: '+nome); } }
function resetDb(){ global.db = emptyDb(); }

// ===== 1. hashRec ignora _rt =====
resetDb();
ok(I.hashRec({a:1}) === I.hashRec({a:1}), 'hash igual p/ registros iguais');
ok(I.hashRec({a:1,_rt:'x'}) === I.hashRec({a:1,_rt:'y'}), 'hash ignora _rt');
ok(I.hashRec({a:1}) !== I.hashRec({a:2}), 'hash muda com campo');

// ===== 2. dois PCs cadastram registros DIFERENTES => JUNTAM =====
resetDb();
db.clientes = [{ id:'cli_1', nome:'PC-A' }];
ok(I.aplicarRemoto('clientes','cli_2',{ id:'cli_2', nome:'PC-B' }, false, '2026-08-16T10:00:00.000Z') === true, 'adiciona cliente remoto');
ok(db.clientes.length === 2, 'os DOIS clientes existem (junta, não substitui)');
ok(db.clientes.some(c=>c.id==='cli_1') && db.clientes.some(c=>c.id==='cli_2'), 'A e B presentes');

// ===== 3. mesmo registro: ganha a hora do servidor mais recente =====
resetDb();
db.clientes = [{ id:'cli_1', nome:'ANTIGO', _rt:'2026-08-16T10:00:00.000Z' }];
// remoto mais novo
ok(I.aplicarRemoto('clientes','cli_1',{ id:'cli_1', nome:'NOVO' }, false, '2026-08-16T11:00:00.000Z') === true, 'remoto mais novo substitui');
ok(db.clientes[0].nome === 'NOVO', 'nome atualizado p/ NOVO');
// remoto mais velho
ok(I.aplicarRemoto('clientes','cli_1',{ id:'cli_1', nome:'VELHO' }, false, '2026-08-16T09:00:00.000Z') === false, 'remoto mais velho é ignorado');
ok(db.clientes[0].nome === 'NOVO', 'local mais novo mantido');

// ===== 4. exclusão via lápide =====
resetDb();
db.clientes = [{ id:'cli_1', nome:'X', _rt:'2026-08-16T10:00:00.000Z' }];
ok(I.aplicarRemoto('clientes','cli_1', null, true, '2026-08-16T11:00:00.000Z') === true, 'lápide apaga');
ok(db.clientes.length === 0, 'cliente removido');
// lápide mais velha que edição local => mantém
db.clientes = [{ id:'cli_1', nome:'editado', _rt:'2026-08-16T12:00:00.000Z' }];
ok(I.aplicarRemoto('clientes','cli_1', null, true, '2026-08-16T11:00:00.000Z') === false, 'lápide velha não apaga edição nova');
ok(db.clientes.length === 1, 'cliente mantido');

// ===== 5. objeto (config) último a salvar vence =====
resetDb();
db.config = { empresa:{ nome:'A' }, _rt:'2026-08-16T10:00:00.000Z' };
ok(I.aplicarRemoto('config','config',{ empresa:{ nome:'B' } }, false, '2026-08-16T11:00:00.000Z') === true, 'config remoto mais novo aplica');
ok(db.config.empresa.nome === 'B', 'config = B');

// ===== 6. demo detection =====
resetDb();
db.empresas = [{ id:'e1', cnpjDigits:'12345678000190' }];
ok(I.ehDemo() === true, 'detecta demo');
db.empresas = [{ id:'e2', cnpjDigits:'99999999999999' }];
ok(I.ehDemo() === false, 'não é demo com empresa real');
I.limparDemo();
ok(db.empresas.length === 0 && db.clientes.length === 0, 'limparDemo zera entidades');

// ===== 7. tsNum comparação numérica (fracionário de tamanhos diferentes) =====
ok(I.tsKey('2026-08-16T10:00:00.9Z')  >  I.tsKey('2026-08-16T10:00:00.10Z'), '0.9s > 0.10s (numérico, não string)');
ok(I.tsKey('2026-08-16T10:00:00.123Z') < I.tsKey('2026-08-16T10:00:00.1234Z'), '0.123 < 0.1234');

console.log('\n'+(fail===0?'✔ TODOS OS TESTES PASSARAM':'✗ '+fail+' falha(s)')+'  ('+pass+' ok)');
process.exit(fail===0?0:1);
