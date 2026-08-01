const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('diagnostico_migracao_patch.js','utf8');
const ctx = { window:{}, db:{} };
new Function('window','db', code)(ctx.window, ctx.db);
const D = ctx.window.DIAGNOSTICO_MIGRACAO_PURE;
console.log('== DIAGNOSTICO_MIGRACAO_PURE ==');
const texto = D.diagnosticoMigracao({modulosDinamicos:{LOCACAO:{dados:[{COD_LOCACAO:82,COD_CLIENTE:116,VALOR:120}]},CLIENTES:{dados:[{CODIGO:116,NOME:'ESCOLA'}]},OUTRA:{dados:[{A:1}]}}});
ok('inclui tabela locacao', texto.includes('TABELA: LOCACAO'));
ok('inclui colunas', texto.includes('COD_CLIENTE'));
ok('inclui resumo relevante', texto.includes('LOCACAO: 1 registros'));
ok('não quebra sem módulos', D.diagnosticoMigracao({}).includes('Total de tabelas: 0'));
console.log('\nRESULTADO: Testes de diagnóstico passaram!');
