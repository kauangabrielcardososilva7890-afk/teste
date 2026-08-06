const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('indices_legado_performance_patch.js','utf8');
const db={
  config:{},
  clientes:[{id:'cli1',empresaId:'emp',codigo:'10',documento:'123.456.789-00',nome:'Cliente A'}],
  produtos:[{id:'prd1',empresaId:'emp',sku:'20',nome:'Toner'}],
  equipamentos:[{id:'eq1',empresaId:'emp',codigoAntigo:'5',serie:'SER1',patrimonio:'PAT1'}],
  contratos:[{id:'ct1',empresaId:'emp',numero:'200',clienteId:'cli1'}],
  parque:[{id:'pq1',empresaId:'emp',codigoAntigo:'77',contratoId:'ct1',clienteId:'cli1',equipamentoId:'eq1'}],
  vendas:[{id:'v1',empresaId:'emp',numero:'300',clienteId:'cli1'}],
  contasReceber:[{id:'cr1',empresaId:'emp',vendaId:'v1',clienteId:'cli1'}],
  contasPagar:[],
  modulosDinamicos:{
    VISITAS:{dados:[{COD_VISITA:1,COD_LOCACAO:200,VI_COD_CLIENTE:10,VI_COD_ITENS_LOCACAO:77}]},
    CONTADOR_PAGINAS:{dados:[{COD_CONTADOR:1,COD_ITENS_LOCACAO:77,CP_COD_LEITURA:8}]}
  }
};
const ctx={window:{},db};
new Function('window','db',code)(ctx.window,ctx.db);
const P=ctx.window.INDICES_LEGADO_PURE;
console.log('== INDICES_LEGADO_PERFORMANCE_PURE ==');
ok('resumo recebeu total informado', P.INDICES_LEGADO_RESUMO.totaisRecebidos===706);
ok('campos críticos incluem visitas por contrato', P.INDICES_LEGADO_RESUMO.camposCriticos.VISITAS.includes('COD_LOCACAO'));
const idx=P.construirIndices(db);
ok('cliente por código indexado', idx.clientes.porCodigo.get('10').id==='cli1');
ok('cliente por documento indexado', idx.clientes.porDocumento.get('12345678900').id==='cli1');
ok('produto por código indexado', idx.produtos.porCodigo.get('20').id==='prd1');
ok('equipamento por serial indexado', idx.equipamentos.porSerial.get('SER1').id==='eq1');
ok('parque por item indexado', idx.parque.porItem.get('77').id==='pq1');
ok('raw visita por locação indexado', idx.raw.VISITAS.COD_LOCACAO.get('200')[0].COD_VISITA===1);
ok('assinatura muda quando entra registro', (()=>{ const a=P.assinaturaBase(db); db.vendas.push({id:'v2'}); return P.assinaturaBase(db)!==a; })());
console.log('\nRESULTADO: Testes de índices legados/performance passaram!');
