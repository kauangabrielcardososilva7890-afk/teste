const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('cadastros_nomes_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', code)(ctx.window, ctx.db);
const C = ctx.window.CADASTROS_NOMES_PURE;

console.log('== CADASTROS_NOMES_PURE: códigos e nomes conhecidos ==');
ok('código tira zeros', C.codigoCliente({ codigo: '000116' }) === '116');
ok('nome vazio inválido', !C.nomeValido(''));
ok('nome genérico inválido', !C.nomeValido('SEM NOME'));
ok('empresa preserva sigla JK', C.titleEmpresa('PAPELARIA JK') === 'Papelaria JK');

console.log('== corrigirNomesClientes ==');
{
  const db = { clientes: [
    { empresaId: 'e1', codigo: '116', nome: '' },
    { empresaId: 'e1', codigo: '166', nome: 'SEM NOME' },
    { empresaId: 'e1', codigo: '175', nome: '-' },
    { empresaId: 'e1', codigo: '200', fantasia: 'LOJA TESTE' },
    { empresaId: 'e2', codigo: '116', nome: '' }
  ], modulosDinamicos: {} };
  const count = C.corrigirNomesClientes(db, 'e1');
  ok('alterou 4 clientes da empresa', count === 4);
  ok('116 preenchido', db.clientes[0].nome === 'Fernando Seguros');
  ok('166 preenchido', db.clientes[1].nome === 'Papelaria JK');
  ok('175 preenchido', db.clientes[2].nome === 'Caixa Escolar Manoel Neto dos Santos');
  ok('fantasia aproveitada', db.clientes[3].nome === 'Loja Teste');
  ok('outra empresa não mexe', db.clientes[4].nome === '');
}

console.log('\nRESULTADO: Testes de correção de cadastros passaram!');
