// Testes puros do patch v5.20.25 — usuários fixos + recuperação de órfãos.
const fs = require('fs');
const vm = require('vm');

let passou = 0, falhou = 0;
function ok(nome, cond){
  if(cond){ passou++; console.log('  ✔ ' + nome); }
  else { falhou++; console.log('  ✘ ' + nome); }
}

// Sandbox mínimo: o patch precisa de window/document/console/location.
const sandbox = {
  console: { log(){}, warn(){} },
  location: { origin: 'https://teste.local' },
  document: { readyState: 'complete', addEventListener(){} },
  localStorage: { getItem(){ return null; }, setItem(){}, removeItem(){} },
  setTimeout, clearTimeout
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('./ajustes_v52025_patch.js', 'utf8'), sandbox);

const P = sandbox.window.AJUSTES_V52025_PURE;

console.log('\n── v5.20.25: usuários fixos ──');
ok('exporta a lógica pura', !!P);
ok('exatamente 4 usuários fixos', P.USUARIOS_FIXOS.length === 4);

const logins = P.USUARIOS_FIXOS.map(u => u.login);
ok('tem kauan', logins.includes('kauan'));
ok('tem denivaldo', logins.includes('denivaldo'));
ok('tem katia', logins.includes('katia'));
ok('tem recepcao', logins.includes('recepcao'));

const perfilDe = l => P.USUARIOS_FIXOS.find(u => u.login === l).perfil;
ok('kauan é Admin', perfilDe('kauan') === 'Admin');
ok('denivaldo é Dono', perfilDe('denivaldo') === 'Dono');
ok('katia é Funcionário', perfilDe('katia') === 'Funcionário');
ok('recepcao é Funcionário', perfilDe('recepcao') === 'Funcionário');
ok('só existem os 3 perfis do sistema',
   P.USUARIOS_FIXOS.every(u => ['Admin','Dono','Funcionário'].includes(u.perfil)));
ok('nenhum login tem acento', logins.every(l => l === l.normalize('NFD').replace(/[\u0300-\u036f]/g,'')));
ok('senhas do kauan/denivaldo preservadas do sistema antigo',
   P.USUARIOS_FIXOS.find(u=>u.login==='kauan').senha === '6132' &&
   P.USUARIOS_FIXOS.find(u=>u.login==='denivaldo').senha === '3232');

console.log('\n── reconciliarUsuarios ──');
let r = P.reconciliarUsuarios([], 'emp_digicopy');
ok('base vazia cria os 4', r.usuarios.length === 4);
ok('base vazia reporta 4 criados', r.criados.length === 4);
ok('todos recebem a empresa correta', r.usuarios.every(u => u.empresaId === 'emp_digicopy'));
ok('todos nascem ativos', r.usuarios.every(u => u.ativo === true));

r = P.reconciliarUsuarios([
  {id:'x1', login:'admin',   nome:'Admin',   senha:'admin123', perfil:'Admin', ativo:true},
  {id:'x2', login:'carlos',  nome:'Carlos',  senha:'123',      perfil:'Comercial', ativo:true},
  {id:'x3', login:'ana',     nome:'Ana',     senha:'123',      perfil:'Financeiro', ativo:true},
  {id:'x4', login:'kauan',   nome:'Kauan',   senha:'6132',     perfil:'Admin', ativo:true}
], 'emp_digicopy');
ok('remove usuários estranhos', r.usuarios.length === 4);
ok('sobra só login oficial', r.usuarios.every(u => logins.includes(u.login)));
ok('reporta os 3 removidos', r.removidos.length === 3);
ok('admin foi removido', r.removidos.includes('admin'));
ok('carlos foi removido', r.removidos.includes('carlos'));
ok('ana foi removida', r.removidos.includes('ana'));
ok('kauan sobreviveu', r.usuarios.some(u => u.login === 'kauan'));
ok('criou os 3 que faltavam', r.criados.length === 3);

// Senha personalizada não pode ser sobrescrita.
r = P.reconciliarUsuarios([
  {id:'usr_katia', login:'katia', nome:'Katia Silva', senha:'minhasenha', perfil:'Funcionário', ativo:true}
], 'emp_digicopy');
const katia = r.usuarios.find(u => u.login === 'katia');
ok('preserva senha personalizada', katia.senha === 'minhasenha');
ok('preserva nome personalizado', katia.nome === 'Katia Silva');
ok('mesmo assim completa os outros 3', r.usuarios.length === 4);

// Usuário inativo é reativado (senão o login trava).
r = P.reconciliarUsuarios([
  {id:'usr_kauan', login:'kauan', nome:'Kauan', senha:'6132', perfil:'Admin', ativo:false}
], 'emp_digicopy');
ok('reativa usuário desativado', r.usuarios.find(u=>u.login==='kauan').ativo === true);

// Login com caixa alta / acento ainda é reconhecido.
r = P.reconciliarUsuarios([
  {id:'a', login:'KAUAN',    nome:'K', senha:'6132', perfil:'Admin', ativo:true},
  {id:'b', login:'Recepcao', nome:'R', senha:'5151', perfil:'Funcionário', ativo:true}
], 'emp_digicopy');
ok('login em maiúsculas é reconhecido', r.usuarios.filter(u=>u.login==='kauan').length === 1);
ok('não duplica por causa da caixa', r.usuarios.length === 4);
ok('normaliza o login para minúsculo', r.usuarios.every(u => u.login === u.login.toLowerCase()));

// Duplicatas do mesmo login colapsam em um só.
r = P.reconciliarUsuarios([
  {id:'a', login:'katia', nome:'K1', senha:'111', perfil:'Funcionário', ativo:true},
  {id:'b', login:'katia', nome:'K2', senha:'222', perfil:'Funcionário', ativo:true}
], 'emp_digicopy');
ok('remove login duplicado', r.usuarios.filter(u=>u.login==='katia').length === 1);
ok('mantém o primeiro registro', r.usuarios.find(u=>u.login==='katia').senha === '111');

// Idempotência: rodar 2x não muda nada.
const r1 = P.reconciliarUsuarios([], 'emp_digicopy');
const r2 = P.reconciliarUsuarios(r1.usuarios, 'emp_digicopy');
ok('idempotente: 2ª passada não remove', r2.removidos.length === 0);
ok('idempotente: 2ª passada não cria', r2.criados.length === 0);
ok('idempotente: mesma quantidade', r2.usuarios.length === 4);
ok('ids estáveis entre passadas',
   JSON.stringify(r1.usuarios.map(u=>u.id)) === JSON.stringify(r2.usuarios.map(u=>u.id)));

console.log('\n── adotarOrfaos (dados invisíveis) ──');
let banco = {
  clientes: [
    {id:'c1', nome:'A'},                          // órfão
    {id:'c2', nome:'B', empresaId:''},            // órfão
    {id:'c3', nome:'C', empresaId:'emp_digicopy'} // ok
  ],
  vendas: [{id:'v1'}, {id:'v2', empresaId:'emp_digicopy'}],
  produtos: []
};
let a = P.adotarOrfaos(banco, 'emp_digicopy');
ok('conta os órfãos certos', a.adotados === 3);
ok('cliente sem campo adotado', banco.clientes[0].empresaId === 'emp_digicopy');
ok('cliente com campo vazio adotado', banco.clientes[1].empresaId === 'emp_digicopy');
ok('cliente já correto intocado', banco.clientes[2].empresaId === 'emp_digicopy');
ok('venda órfã adotada', banco.vendas[0].empresaId === 'emp_digicopy');
ok('detalha por entidade', a.porEntidade.clientes === 2 && a.porEntidade.vendas === 1);
ok('nada é apagado', banco.clientes.length === 3 && banco.vendas.length === 2);

// NÃO pode roubar dados de outra empresa legítima.
banco = { clientes: [{id:'c1', empresaId:'outra_empresa'}] };
a = P.adotarOrfaos(banco, 'emp_digicopy');
ok('não mexe em registro de outra empresa', banco.clientes[0].empresaId === 'outra_empresa');
ok('não conta como adotado', a.adotados === 0);

// Segunda passada não faz nada.
banco = { clientes: [{id:'c1'}] };
P.adotarOrfaos(banco, 'emp_digicopy');
a = P.adotarOrfaos(banco, 'emp_digicopy');
ok('idempotente: sem novos órfãos', a.adotados === 0);

ok('entrada inválida não quebra', P.adotarOrfaos(null, 'x').adotados === 0);
ok('sem empresaId não faz nada', P.adotarOrfaos({clientes:[{id:'c'}]}, '').adotados === 0);
ok('campo não-array é ignorado', P.adotarOrfaos({clientes:'texto'}, 'e').adotados === 0);
ok('cobre as entidades das telas',
   ['clientes','produtos','vendas','os','contratos','contasReceber'].every(k => P.ENTIDADES_NEGOCIO.includes(k)));

console.log('\n── alinharSessao ──');
ok('sessão errada é corrigida',
   P.alinharSessao({empresaId:'velha', login:'kauan'}, 'emp_digicopy', 'DIGICOPY').empresaId === 'emp_digicopy');
ok('sessão certa não é tocada', P.alinharSessao({empresaId:'emp_digicopy'}, 'emp_digicopy') === null);
ok('sem sessão devolve null', P.alinharSessao(null, 'emp_digicopy') === null);
ok('preserva os outros campos',
   P.alinharSessao({empresaId:'v', login:'kauan', usuarioNome:'Kauan'}, 'e').login === 'kauan');
ok('atualiza o nome da empresa',
   P.alinharSessao({empresaId:'v'}, 'e', 'DIGICOPY').empresaNome === 'DIGICOPY');
ok('não muta o objeto original', (() => {
  const s = {empresaId:'velha'};
  P.alinharSessao(s, 'nova');
  return s.empresaId === 'velha';
})());

console.log('\n─────────────────────────');
console.log(`Passou: ${passou} | Falhou: ${falhou}`);
if(falhou > 0) process.exit(1);
console.log('TODOS OS TESTES PASSARAM ✔');
