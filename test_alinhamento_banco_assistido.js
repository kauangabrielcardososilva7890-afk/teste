const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('alinhamento_banco_assistido_patch.js','utf8');
const db={config:{},modulosDinamicos:{CLIENTES:{dados:[{COD_CLIENTE:1,NOME_RAZAOSOCIAL:'A',CPF_CNPJ:'1'}]},ITENS_LOCACAO:{dados:[{IT_COD_ITENS_LOCACAO:1,IT_COD_LOCACAO:2,IT_SERIAL:'S'}]},CONTADOR_PAGINAS:{dados:[{COD_CONTADOR:1,CP_COD_LEITURA:2,CP_TIPO:'PRETO'}]},BAIRROS:{dados:[{COD_BAIRRO:1,DESCRICAO:'Centro'}]}}};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const A=ctx.window.ALINHAMENTO_BANCO_PURE;
console.log('== ALINHAMENTO_BANCO_PURE ==');
ok('classifica clientes', A.classificarTabela('CLIENTES', db.modulosDinamicos.CLIENTES).destino==='clientes');
ok('classifica itens locação como impressoras contrato', A.classificarTabela('ITENS_LOCACAO', db.modulosDinamicos.ITENS_LOCACAO).destino==='impressoras_contrato');
ok('classifica contador páginas', A.classificarTabela('CONTADOR_PAGINAS', db.modulosDinamicos.CONTADOR_PAGINAS).destino==='contadores');
const r=A.analisarBanco(db);
ok('analisa total de tabelas', r.totalTabelas===4 && r.totalRegistros===4);
ok('tem destinos esperados', A.DESTINOS.some(d=>d.id==='leituras') && A.ESPERADOS.some(e=>e[0]==='contratos'));
const rel=A.relatorioAlinhamento(db);
ok('relatório contém tabelas e faltantes', rel.includes('CLIENTES') && rel.includes('Módulos esperados'));
console.log('\nRESULTADO: Testes de alinhamento assistido passaram!');
