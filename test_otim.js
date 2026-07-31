const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const codeVendas = fs.readFileSync('vendas_otimizacao_patch.js', 'utf8');
const codeLogin  = fs.readFileSync('login_otimizacao_patch.js', 'utf8');

const ctx = { window: {}, db: { modulosDinamicos: {}, vendas: [], usuarios: [] } };
new Function('window', 'db', codeVendas)(ctx.window, ctx.db);
new Function('window', 'db', codeLogin)(ctx.window, ctx.db);

const VOTM = ctx.window.VOTM_PURE;
const LOGO = ctx.window.LOGOPT_PURE;

console.log('== VOTM_PURE: ehTabelaVendaReal ==');
ok('VENDAS é tabela real', VOTM.ehTabelaVendaReal('VENDAS'));
ok('NOTA é tabela real', VOTM.ehTabelaVendaReal('NOTA'));
ok('CUPOM é tabela real', VOTM.ehTabelaVendaReal('CUPOM'));
ok('ORDEM_SERVICO é tabela real', VOTM.ehTabelaVendaReal('ORDEM_SERVICO'));
ok('VENDAS_ORDENS não é tabela real', !VOTM.ehTabelaVendaReal('VENDAS_ORDENS'));
ok('VENDAS_VENDEDOR não é tabela real', !VOTM.ehTabelaVendaReal('VENDAS_VENDEDOR'));
ok('ITENS_VENDA não é tabela real', !VOTM.ehTabelaVendaReal('ITENS_VENDA'));
ok('STATUS_NOTA não é tabela real', !VOTM.ehTabelaVendaReal('STATUS_NOTA'));

console.log('== VOTM_PURE: normalizarNomeVendedor ==');
ok('admin → Kauan Gabriel', VOTM.normalizarNomeVendedor('admin') === 'Kauan Gabriel');
ok('Vendas - ordens → Recepção', VOTM.normalizarNomeVendedor('Vendas - ordens') === 'Recepção');
ok('N → Recepção', VOTM.normalizarNomeVendedor('N') === 'Recepção');
ok('S → Recepção', VOTM.normalizarNomeVendedor('S') === 'Recepção');
ok('Importado → Recepção', VOTM.normalizarNomeVendedor('Importado') === 'Recepção');
ok('CAPSLOCK → Title Case', VOTM.normalizarNomeVendedor('MARIA DA SILVA') === 'Maria da Silva');

console.log('== VOTM_PURE: toTitleCase ==');
ok('KAUAN GABRIEL CARDOSO', VOTM.toTitleCase('KAUAN GABRIEL CARDOSO') === 'Kauan Gabriel Cardoso');
ok('JOSE DE SOUZA', VOTM.toTitleCase('JOSE DE SOUZA') === 'Jose de Souza');
ok('RECEPÇÃO', VOTM.toTitleCase('RECEPÇÃO') === 'Recepção');

console.log('== VOTM_PURE: ehRegistroVendaValido ==');
ok('número 0 → false', !VOTM.ehRegistroVendaValido('0', {}));
ok('número S → false', !VOTM.ehRegistroVendaValido('S', {}));
ok('número N → false', !VOTM.ehRegistroVendaValido('N', {}));
ok('número VD-123 → true', VOTM.ehRegistroVendaValido('VD-123', {}));
ok('número 1234 → true', VOTM.ehRegistroVendaValido('1234', {}));

console.log('== LOGOPT_PURE: loguinCompativel ==');
ok('FULANO em maiúsculo casa fulano', LOGO.loguinCompativel({login:'fulano', nome:'Fulano da Silva'}, 'FULANO'));
ok('Fulano da Silva casa fulano', LOGO.loguinCompativel({login:'f1', nome:'Fulano da Silva'}, 'fulano'));
ok('fUlAnO casa FULANO', LOGO.loguinCompativel({login:'FULANO', nome:'Fulano'}, 'fUlAnO'));
ok('incorreto não casa', !LOGO.loguinCompativel({login:'carlos', nome:'Carlos'}, 'kauan'));

console.log('== LOGOPT_PURE: normalizarKauanAdmin ==');
{
  const dbTest = {
    vendas: [
      { id: 'v1', empresaId: 'emp-1', criadoPorNome: 'admin', atendenteNome: 'admin' },
      { id: 'v2', empresaId: 'emp-1', criadoPorNome: 'Vendas - ordens', atendenteNome: 'S' }
    ],
    os: [],
    usuarios: [
      { id: 'u1', empresaId: 'emp-1', login: 'admin', nome: 'Admin' },
      { id: 'u2', empresaId: 'emp-1', login: 'kauan', nome: 'Kauan' }
    ]
  };
  global.db = dbTest;
  LOGO.normalizarKauanAdmin({ empresaId: 'emp-1' }, dbTest);
  ok('v1 criadoPorNome unificado para Kauan Gabriel', dbTest.vendas[0].criadoPorNome === 'Kauan Gabriel');
  ok('v2 atendenteNome virou Recepção', dbTest.vendas[1].atendenteNome === 'Recepção');
  ok('apenas 1 usuário kauan ficou', dbTest.usuarios.length === 1 && dbTest.usuarios[0].id === 'u2');
}

console.log('\nRESULTADO: Todos os novos testes de otimização passaram!');
