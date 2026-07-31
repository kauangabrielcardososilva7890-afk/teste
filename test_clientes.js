// Testes unitários do CLI_PURE (clientes_patch.js) — v4.8.0
// Uso: node test_clientes.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/clientes_patch.js', 'utf8');
const m = src.match(/\/\* CLI_PURE_START \*\/([\s\S]*?)\/\* CLI_PURE_END \*\//);
if(!m){ console.error('FALHOU: seção CLI_PURE não encontrada'); process.exit(1); }
const CLI_PURE = eval(m[1] + '\n; CLI_PURE;');

let pass = 0, fail = 0;
function eq(nome, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok){ pass++; console.log('  ✔', nome); }
  else { fail++; console.error('  ✘', nome, '\n     obtido:', JSON.stringify(got), '\n     esperado:', JSON.stringify(want)); }
}
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

console.log('== fold / soDigitos / normalizaCep ==');
{
  eq('dobra acentos e caixa', CLI_PURE.fold('José ÁVILA ç'), 'jose avila c');
  eq('só dígitos', CLI_PURE.soDigitos('(38) 9.9911-2233'), '38999112233');
  eq('cep válido', CLI_PURE.normalizaCep('39440-000'), '39440000');
  eq('cep incompleto → null', CLI_PURE.normalizaCep('3944'), null);
  eq('cep vazio → null', CLI_PURE.normalizaCep(''), null);
}

console.log('== montaEndereco ==');
{
  eq('completo', CLI_PURE.montaEndereco({rua:'Rua das Flores', numero:'123', complemento:'Sala 2', bairro:'Centro'}), 'Rua das Flores, 123 - Sala 2 • Centro');
  eq('sem complemento', CLI_PURE.montaEndereco({rua:'Av. Central', numero:'50', bairro:'Canaã'}), 'Av. Central, 50 • Canaã');
  eq('só rua', CLI_PURE.montaEndereco({rua:'Estrada do Campo'}), 'Estrada do Campo');
  eq('vazio', CLI_PURE.montaEndereco({}), '');
}

console.log('== validarObrigatorios (nome, telefone, rua, número, bairro) ==');
{
  eq('tudo vazio → 5 faltando', CLI_PURE.validarObrigatorios({}).length, 5);
  eq('só nome → faltam 4', CLI_PURE.validarObrigatorios({nome:'Maria'}).length, 4);
  eq('espaço conta como vazio', CLI_PURE.validarObrigatorios({nome:'  ', telefone:' x ', rua:' r ', numero:' 1 ', bairro:' b '}).length, 1);
  eq('completo → ok', CLI_PURE.validarObrigatorios({nome:'M', telefone:'9', rua:'R', numero:'1', bairro:'B'}).length, 0);
}

console.log('== proxCodigo ==');
{
  const cls = [
    {empresaId:'E', codigo:5}, {empresaId:'E', codigo:12}, {empresaId:'E'},
    {empresaId:'X', codigo:99}, {empresaId:'E', codigo:'20'}
  ];
  eq('maior da empresa +1', CLI_PURE.proxCodigo(cls, 'E'), 21);
  eq('sem clientes → 1', CLI_PURE.proxCodigo([], 'E'), 1);
}

console.log('== filtraClientes — campo específico ==');
{
  const cls = [
    {id:'1', nome:'CONCREBLOCOS TRANSPORTES LTDA', fantasia:'CONCREBLOCO', codigo:1607, documento:'20.415.005/0001-92', telefone:'(38) 3082-5799', cidade:'JANAUBA', bairro:'CENTRO', endereco:'Rua A, 10 • Centro', cep:'39.440-000', email:'a@a.com', contato:'Ana'},
    {id:'2', nome:'COLEGIO PREMIO EIRELI', fantasia:'COLEGIO PREMIO', codigo:1370, documento:'00.273.894/0001-93', telefone:'(38) 3821-1089', cidade:'Bocaiúva', bairro:'Alto', endereco:'Rua B, 20', cep:'39.390-000', email2:'b@b.com', contato:'Bruno'},
    {id:'3', nome:'José das Couves', codigo:22, telefone:'38999990000', cidade:'Montes Claros', bairro:'Couves', observacao:'VIP desde 2020'}
  ];
  eq('por nome com acento dobrado', CLI_PURE.filtraClientes(cls, 'colegio', 'nome').map(c=>c.id), ['2']);
  eq('por fantasia', CLI_PURE.filtraClientes(cls, 'premio', 'fantasia').map(c=>c.id), ['2']);
  eq('por código', CLI_PURE.filtraClientes(cls, '1607', 'codigo').length, 1);
  eq('por CNPJ só números', CLI_PURE.filtraClientes(cls, '20415005', 'documento').map(c=>c.id), ['1']);
  eq('por telefone só números', CLI_PURE.filtraClientes(cls, '30825799', 'telefone').map(c=>c.id), ['1']);
  eq('por cidade sem acento', CLI_PURE.filtraClientes(cls, 'bocaiuva', 'cidade').map(c=>c.id), ['2']);
  eq('por bairro', CLI_PURE.filtraClientes(cls, 'couves', 'bairro').map(c=>c.id), ['3']);
  eq('por endereço', CLI_PURE.filtraClientes(cls, 'rua a', 'endereco').map(c=>c.id), ['1']);
  eq('por e-mail (busca email2 também)', CLI_PURE.filtraClientes(cls, 'b@b.com', 'email').map(c=>c.id), ['2']);
  eq('por contato', CLI_PURE.filtraClientes(cls, 'bruno', 'contato').map(c=>c.id), ['2']);
  eq('por cep', CLI_PURE.filtraClientes(cls, '39390000', 'cep').map(c=>c.id), ['2']);
  eq('por observação', CLI_PURE.filtraClientes(cls, 'vip', 'observacao').map(c=>c.id), ['3']);
}

console.log('== filtraClientes — modo "todos" e bordas ==');
{
  const cls = [
    {id:'1', nome:'Maria Silva', cidade:'Janaúba', telefone:'(38) 99911-0000'},
    {id:'2', nome:'Pedro Ávila', bairro:'Silva Jardim', documento:'123.456.789-09'}
  ];
  eq('todos: acha por bairro', CLI_PURE.filtraClientes(cls, 'silva', 'todos').length, 2);
  eq('todos: acento dobrado', CLI_PURE.filtraClientes(cls, 'avila', 'todos').map(c=>c.id), ['2']);
  eq('todos: documento só números', CLI_PURE.filtraClientes(cls, '123456789', 'todos').map(c=>c.id), ['2']);
  eq('busca vazia devolve tudo', CLI_PURE.filtraClientes(cls, '   ', 'nome').length, 2);
  eq('nada achou → vazio', CLI_PURE.filtraClientes(cls, 'zzz', 'todos').length, 0);
}

console.log('\n══════════════════════════════════');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
