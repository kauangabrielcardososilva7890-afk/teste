const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const base=fs.readFileSync('alinhamento_banco_assistido_patch.js','utf8');
const code=fs.readFileSync('alinhamento_banco_exemplos_patch.js','utf8');
const db={config:{},modulosDinamicos:{
  CLIENTES:{dados:[{COD_CLIENTE:1,NOME_RAZAOSOCIAL:'Cliente Exemplo Completo',CPF_CNPJ:'12345678901',TELEFONE:'38999998888',EMAIL:'cliente@empresa.com',SENHA:'6132'}]},
  LOCACAO:{dados:[{COD_LOCACAO:480,COD_CLIENTE:1,VALOR:'199,90',DATA_INICIO:'2024-01-01'}]},
  TABELA_VAZIA:{dados:[{}]}
}};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',base)(ctx.window,ctx.document,ctx.db);
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const E=ctx.window.ALINHAMENTO_EXEMPLOS_PURE;
console.log('== ALINHAMENTO_EXEMPLOS_PURE ==');
ok('exporta funções puras', !!E && typeof E.amostraTabela==='function' && typeof E.relatorioComExemplos==='function');
const amostra=E.amostraTabela(db,'CLIENTES',2,6);
ok('gera exemplo de tabela com valores', amostra.exemplos.length===1 && amostra.exemplos[0].includes('COD_CLIENTE=1'));
ok('mascara documento no exemplo', amostra.exemplos[0].includes('123.***.***-01') && !amostra.exemplos[0].includes('12345678901'));
ok('mascara telefone no exemplo', amostra.exemplos[0].includes('*****-8888') && !amostra.exemplos[0].includes('38999998888'));
ok('mascara senha', E.valorExemplo('SENHA','6132')==='***');
const rel=E.relatorioComExemplos(db);
ok('relatório inclui bloco de exemplos', rel.includes('Exemplos seguros das tabelas') && rel.includes('CLIENTES') && rel.includes('LOCACAO'));
ok('relatório mantém alinhamento base', rel.includes('Módulos esperados'));
console.log('\nRESULTADO: Testes de exemplos do alinhamento passaram!');
