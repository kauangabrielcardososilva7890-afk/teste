const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('contratos_rtf_template_patch.js','utf8');
const db = {
  empresas:[{id:'emp', nome:'DIGICOPY', cnpj:'08.385.589/0001-03', cidade:'Bocaiúva', estado:'MG'}],
  clientes:[{id:'cli', nome:'Escola Estadual Teste', documento:'12.345.678/0001-90', endereco:'Rua A', numero:'10', bairro:'Centro', cidade:'Bocaiúva', estado:'MG', cep:'39390-000'}],
  contratos:[{id:'ct', empresaId:'emp', numero:'82', clienteId:'cli', dataInicio:'2026-01-01', dataFim:'2026-12-31', valorMensalFixo:120, franquiaPB:1000, valorExcedentePB:0.1, diaVencimento:10}],
  parque:[{id:'p', contratoId:'ct', clienteId:'cli', equipamentoId:'eq', setor:'Secretaria', localInstalacao:'Sala 1'}],
  equipamentos:[{id:'eq', patrimonio:'446', modelo:'Brother', serie:'ABC'}]
};
const ctx = { window:{}, db, getSession:()=>({empresaId:'emp', cnpj:'08.385.589/0001-03'}) };
new Function('window','db','getSession', code)(ctx.window, ctx.db, ctx.getSession);
const R = ctx.window.RTF_TEMPLATE_PURE;
console.log('== RTF_TEMPLATE_PURE ==');
const tpl = '{\\rtf1 Cliente {CLI_NOMERAZAO} [TABLE] Valor {CTR_VALOR_MENSAL}}';
const out = R.aplicarTemplate(tpl, 'ct');
ok('troca cliente', out.includes('Escola Estadual Teste'));
ok('troca tabela de impressoras', out.includes('446') && out.includes('Brother'));
ok('troca valor mensal', out.includes('R$'));
ok('escapa acento em texto RTF', R.rtf('Bocaiúva').includes('\\u'));
console.log('\nRESULTADO: Testes de template RTF passaram!');
