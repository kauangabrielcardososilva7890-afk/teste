const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('leitura_impressao_compacta_produtos_patch.js','utf8');
const db={empresas:[{id:'emp',nome:'DIGICOPY',cnpj:'00'}],clientes:[{id:'cli',nome:'Cliente',documento:'11'}],contratos:[{id:'ct',numero:'1',clienteId:'cli'}],leituras:[{id:'l1',numero:'10',contratoId:'ct',clienteId:'cli',itens:[{departamento:'A',utilizado:10,excedente:2,valorTotal:5,medidorLabel:'PRETO',modelo:'Ricoh',serial:'S1',anterior:1,atual:11},{departamento:'A',utilizado:5,excedente:1,valorTotal:2},{departamento:'B',utilizado:7,excedente:0,valorTotal:3}]}]};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.LEITURA_IMPRESSAO_COMPACTA_PURE;
console.log('== LEITURA_IMPRESSAO_COMPACTA_PURE ==');
const grupos=P.agruparPorDepartamento(db.leituras[0].itens);
ok('agrupa departamentos', grupos.length===2 && grupos[0].total===7);
ok('totaliza itens', P.totais(db.leituras[0].itens).utilizado===22 && P.totais(db.leituras[0].itens).total===10);
const html=P.htmlNotinhaLeitura('l1','A');
ok('html contém logo e dados empresa/cliente', html.includes('logo.png') && html.includes('DIGICOPY') && html.includes('Cliente'));
ok('html filtra departamento', html.includes('Departamento: A') && !html.includes('Departamento: B'));
ok('html é compacto e tem total geral', html.includes('TOTAL GERAL'));
console.log('\nRESULTADO: Testes de impressão compacta/produtos passaram!');
