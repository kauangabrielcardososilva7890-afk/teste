const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_fiscal_cartuchos_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', nome:'Cliente Teste', documento:'12.345.678/0001-90', endereco:'Rua A', cidade:'Bocaiuva', estado:'MG'}],
  produtos:[{id:'prd1', empresaId:'emp', sku:'5', nome:'Produto 5', custo:10, preco:20, categoria:'Produto'}, {id:'prd2', empresaId:'emp', sku:'20', nome:'Insumo', custo:2, preco:5, categoria:'Produto'}],
  vendas:[{id:'v1', empresaId:'emp', numero:'100', codigoAntigo:'100', clienteId:'cli1', total:40, observacao:'Obs venda', itens:[{codigoAntigo:'77', descricao:'Recarga'}]}],
  leituras:[], contasReceber:[{id:'cr1', empresaId:'emp', vendaId:'v1', valor:40, vencimento:'2026-08-10', status:'aberto'}],
  modulosDinamicos:{
    NOTA_FISCAL:{dados:[{NF_CODIGO:1, NF_COD_CLIENTE:10, NF_COD_VENDA:100, NF_MODELO:55, NF_SITUACAO:'AUTORIZADA', NF_VALOR_TOTAL:40, NF_TOTAL_IMPOSTOS:3.5}]},
    ITENS_NOTA:{dados:[{IN_CODIGO:1, IN_COD_NOTA_FISCAL:1, IN_COD_PRODUTO:5, IN_VALOR_UNITARIO:20, IN_QTDE:2, IN_TIPO_DESCRICAO:'PRODUTO', IN_NCM:'12345678', IN_CEST:'01.001.00'}]},
    CARTUCHOS:{dados:[{COD_CARTUCHO:9, TIPO:'TONER', COD_FABRICANTE:1, NUMERO:'85A', COR:'PRETO', QTDE_COPIAS:1600}]},
    FABRICANTE:{dados:[{COD_FABRICANTE:1, NOME:'HP'}]},
    ITENS_INSUMOS:{dados:[{COD_CARTUCHO:9, VALOR_TOTAL:12}]},
    PRODUTOS_VARIACAO:{dados:[{PRV_CODIGO:1, PRV_COD_PRODUTO:5, PRV_IDENTIFICACAO:'ABC', PRV_QTDE:-1}]},
    PRODUTOS_VARIACAO_ITENS:{dados:[{PVI_CODIGO:1, PVI_COD_VARIACAO:1}]},
    ITENS_INSUMOS_GASTOS:{dados:[{COD_ITENS_INSUMOS_GASTOS:1, COD_ITENS_RECARGA:77, COD_PRODUTO:20, QTDE:3, VALOR_UNITARIO:4, VALOR_UNIT_CUSTO:2, SOMAR_INSUMO:'S'}]},
    ESTORNOS:{dados:[{ES_COD_ESTORNO:1, ES_TABELA:'VENDAS', ES_CODIGO:100, ES_MOTIVO:'Teste'}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_FISCAL_CARTUCHOS_PURE;
console.log('== AUTOMACOES_FISCAL_CARTUCHOS_PURE ==');
const def = A.defaultsNotaFiscal(db.modulosDinamicos.NOTA_FISCAL.dados[0], 'emp');
ok('defaults nota fiscal puxam cliente', def.clienteId === 'cli1' && def.clienteNome === 'Cliente Teste');
ok('totaliza itens da nota', A.totaisNotaPorItens(1).produtos === 40);
const changed = A.aplicarAutomacoesFiscalCartuchos('emp');
ok('aplicou automações', changed > 0);
ok('nota fiscal migrada criada', db.notasFiscaisMigradas.length === 1 && db.notasFiscaisMigradas[0].clienteId === 'cli1');
ok('fatura NFE criada', db.faturasNfe.length === 1);
ok('produto recebeu NCM/CEST', db.produtos[0].ncm === '12345678' && db.produtos[0].cest === '01.001.00');
ok('cartucho migrado e produto vazio criado', db.cartuchosMigrados.length === 1 && db.produtos.some(p => p.categoria === 'Cartucho Vazio'));
ok('variação não fica negativa', db.produtosVariacaoMigrados[0].qtde === 0);
ok('insumo gasto atualiza valor de insumos no item', db.vendas[0].itens[0].valorInsumos === 12);
ok('estorno marca venda', db.vendas[0].status === 'estornada');
console.log('\nRESULTADO: Testes de automações fiscal/cartuchos passaram!');
