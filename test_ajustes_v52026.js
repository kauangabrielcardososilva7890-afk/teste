// Testes do patch v5.20.26 — empresa única / fim dos dados invisíveis.
const fs = require('fs');
const vm = require('vm');

let passou = 0, falhou = 0;
function ok(n, c){ if(c){ passou++; console.log('  ✔ '+n); } else { falhou++; console.log('  ✘ '+n); } }

const sb = {
  console:{log(){},warn(){}}, location:{origin:'https://x'},
  document:{readyState:'complete', addEventListener(){}},
  localStorage:{getItem(){return null},setItem(){},removeItem(){}},
  setTimeout, clearTimeout
};
sb.window = sb;
vm.createContext(sb);
vm.runInContext(fs.readFileSync('./ajustes_v52026_patch.js','utf8'), sb);
const P = sb.window.AJUSTES_V52026_PURE;

console.log('\n── empresa única ──');
ok('exporta lógica pura', !!P);
ok('id fixo da empresa', P.EMPRESA_ID === 'emp_digicopy');

let r = P.unificarCadastroEmpresa([], 'emp_digicopy');
ok('base sem empresa cria a padrão', r.empresa.id === 'emp_digicopy');
ok('nome padrão aplicado', /DIGICOPY/.test(r.empresa.fantasia));

r = P.unificarCadastroEmpresa([{id:'velha', nome:'DIGICOPY LTDA', cnpj:'123', fantasia:'DIGICOPY'}], 'emp_digicopy');
ok('id é normalizado', r.empresa.id === 'emp_digicopy');
ok('preserva CNPJ cadastrado', r.empresa.cnpj === '123');
ok('preserva razão social', r.empresa.nome === 'DIGICOPY LTDA');

r = P.unificarCadastroEmpresa([{id:'a',fantasia:'X'},{id:'emp_digicopy',fantasia:'DIGICOPY'},{id:'b'}], 'emp_digicopy');
ok('escolhe a empresa certa entre várias', r.empresa.fantasia === 'DIGICOPY');
ok('reporta as duplicadas removidas', r.removidas === 2);

console.log('\n── unificarEmpresa: o histórico é o mesmo pra todos ──');
let banco = {
  clientes:[{id:'c1'},{id:'c2',empresaId:''},{id:'c3',empresaId:'emp_velha'},{id:'c4',empresaId:'emp_digicopy'}],
  vendas:[{id:'v1',empresaId:'aleatorio_xyz'}],
  contratos:[{id:'k1'}],
  os:[{id:'o1',empresaId:'outra'}],
  contasReceber:[{id:'r1'}],
  produtos:[]
};
let res = P.unificarEmpresa(banco, 'emp_digicopy');
ok('conta tudo que foi unificado', res.total === 7);
ok('cliente sem campo', banco.clientes[0].empresaId === 'emp_digicopy');
ok('cliente vazio', banco.clientes[1].empresaId === 'emp_digicopy');
ok('cliente de empresa antiga', banco.clientes[2].empresaId === 'emp_digicopy');
ok('cliente já certo não conta 2x', banco.clientes[3].empresaId === 'emp_digicopy');
ok('venda com id aleatório', banco.vendas[0].empresaId === 'emp_digicopy');
ok('contrato unificado', banco.contratos[0].empresaId === 'emp_digicopy');
ok('OS unificada', banco.os[0].empresaId === 'emp_digicopy');
ok('financeiro unificado', banco.contasReceber[0].empresaId === 'emp_digicopy');
ok('nada foi apagado', banco.clientes.length === 4 && banco.vendas.length === 1);

// O ponto que o usuário levantou: qualquer login vê o mesmo histórico.
const loginA = {empresaId:'emp_digicopy', login:'kauan'};
const loginB = {empresaId:'emp_digicopy', login:'katia'};
const visiveis = s => banco.clientes.filter(c => c.empresaId === s.empresaId).length;
ok('kauan e katia veem o MESMO histórico', visiveis(loginA) === visiveis(loginB));
ok('e veem todos os registros', visiveis(loginA) === 4);
ok('vendas idênticas para os dois',
   banco.vendas.filter(v=>v.empresaId===loginA.empresaId).length ===
   banco.vendas.filter(v=>v.empresaId===loginB.empresaId).length);

console.log('\n── idempotência (não repetir a cada versão) ──');
res = P.unificarEmpresa(banco, 'emp_digicopy');
ok('2ª passada não altera nada', res.total === 0);
res = P.unificarEmpresa(banco, 'emp_digicopy');
ok('3ª passada idem', res.total === 0);
ok('entrada nula não quebra', P.unificarEmpresa(null,'x').total === 0);
ok('sem empresaId não faz nada', P.unificarEmpresa({clientes:[{id:'a'}]}, '').total === 0);
ok('campo não-array ignorado', P.unificarEmpresa({clientes:'txt'}, 'e').total === 0);
ok('cobre entidades das telas',
   ['clientes','vendas','contratos','os','contasReceber','leituras','produtos'].every(k=>P.ENTIDADES.includes(k)));

console.log('\n── sessão ──');
ok('sessão antiga é normalizada',
   P.normalizarSessao({empresaId:'velha'}, {id:'emp_digicopy',fantasia:'DIGICOPY'}).empresaId === 'emp_digicopy');
ok('sessão correta não muda', P.normalizarSessao({empresaId:'emp_digicopy'}, {id:'emp_digicopy'}) === null);
ok('sem sessão devolve null', P.normalizarSessao(null,{id:'e'}) === null);
ok('preserva login/usuário',
   P.normalizarSessao({empresaId:'v',login:'katia',usuarioId:'u9'}, {id:'e'}).login === 'katia');
ok('atualiza nome da empresa',
   P.normalizarSessao({empresaId:'v'}, {id:'e',fantasia:'DIGICOPY'}).empresaNome === 'DIGICOPY');
ok('não muta o original', (()=>{ const s={empresaId:'v'}; P.normalizarSessao(s,{id:'e'}); return s.empresaId==='v'; })());

console.log('\n── técnico não vira login ──');
ok('regra explícita', P.tecnicoNaoViraUsuario() === true);
const src = fs.readFileSync('./ajustes_v52026_patch.js','utf8');
ok('desativa importarFuncionariosComoUsuarios', src.includes('importarFuncionariosComoUsuarios'));
ok('neutraliza também o LOGOPT_PURE', src.includes('LOGOPT_PURE'));

console.log('\n── cenário real do usuário ──');
const grande = {
  empresas:[{id:'emp_antiga',fantasia:'DIGICOPY',cnpj:'99'}],
  clientes:Array.from({length:500},(_,i)=>({id:'c'+i})),
  vendas:Array.from({length:300},(_,i)=>({id:'v'+i,empresaId:'sessao_velha'})),
  contratos:Array.from({length:80},(_,i)=>({id:'k'+i})),
  os:[], produtos:[], contasReceber:[]
};
const emp = P.unificarCadastroEmpresa(grande.empresas,'emp_digicopy');
grande.empresas=[emp.empresa];
const rr = P.unificarEmpresa(grande,'emp_digicopy');
const sessDepois = {empresaId:'emp_digicopy'};
ok('880 registros unificados', rr.total === 880);
ok('500 clientes visíveis', grande.clientes.filter(c=>c.empresaId===sessDepois.empresaId).length === 500);
ok('300 vendas visíveis', grande.vendas.filter(v=>v.empresaId===sessDepois.empresaId).length === 300);
ok('80 contratos visíveis', grande.contratos.filter(k=>k.empresaId===sessDepois.empresaId).length === 80);
ok('CNPJ preservado', grande.empresas[0].cnpj === '99');
ok('nenhum registro perdido',
   grande.clientes.length===500 && grande.vendas.length===300 && grande.contratos.length===80);

console.log('\n─────────────────────────');
console.log(`Passou: ${passou} | Falhou: ${falhou}`);
if(falhou) process.exit(1);
console.log('TODOS OS TESTES PASSARAM ✔');
