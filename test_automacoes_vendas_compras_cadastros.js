const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_vendas_compras_cadastros_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', nome:'Cliente 10'}],
  produtos:[{id:'prd1', empresaId:'emp', sku:'5', nome:'Produto 5', preco:20, custo:8, categoria:'Produto'}, {id:'prd2', empresaId:'emp', sku:'6', nome:'Insumo 6', preco:3, custo:1, categoria:'Produto'}, {id:'vazio', empresaId:'emp', cartuchoCodigoAntigo:'9', nome:'Cartucho Vazio HP 85A', categoria:'Cartucho Vazio'}],
  vendas:[{id:'v1', empresaId:'emp', numero:'100', codigoAntigo:'100', clienteId:'cli1', itens:[], total:0}],
  modulosDinamicos:{
    CIDADES:{dados:[{COD_CIDADE:1,NOME_CIDADE:'Bocaiúva',UF:'MG'}]},
    RUAS:{dados:[{COD_RUA:1,DESCRICAO:'Rua A'}]},
    SITUACAO:{dados:[{COD_SITUACAO:1,DESCRICAO:'Aberto'}]},
    CONFIGURACAO:{dados:[{CLI_LIMITE_CREDITO:500}]},
    COMPRA:{dados:[{COD_COMPRA:1,VALOR_TOTAL:40}]},
    ITENS_COMPRA:{dados:[{COD_ITENS_COMPRA:1,COD_COMPRA:1,COD_PRODUTO:5,DESCRICAO:'produto 5',QTDE:2,VALOR_UNITARIO:10,VALOR_DESCONTO:2,VALOR_ICMS_ST:0,VALOR_IPI:0,VALOR_FRETE:4,NCM:'12345678',CODIGO_BARRA:'789'}]},
    CARTUCHOS:{dados:[{COD_CARTUCHO:9,TIPO:'TONER'}]},
    ITENS_INSUMOS:{dados:[{COD_ITENS_INSUMOS:1,COD_CARTUCHO:9,COD_PRODUTO:6,QTDE:2,CONTROLE_ESTOQUE:'S',SOMAR_INSUMO:'S'}]},
    ITENS_VENDA:{dados:[{COD_ITENS_VENDA:7,COD_VENDA:100,COD_PRODUTO:5,QTDE:2,VALOR_UNITARIO:20,VALOR_DESCONTO:5},{COD_ITENS_VENDA:8,COD_VENDA:100,COD_CARTUCHO:9,QTDE:1,VALOR_UNITARIO:30,DEBITAR_VAZIO:'S'}]},
    AGENDA_PERSONALIZADA:{dados:[{AGE_CODIGO:1,AGE_CONTATO:'JOAO TESTE',AGE_TELEFONE:'123',AGE_TASKCOMPLETEFIELD:1}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_VENDAS_COMPRAS_CADASTROS_PURE;
console.log('== AUTOMACOES_VENDAS_COMPRAS_CADASTROS_PURE ==');
ok('UF MG vira 31', A.ufIbge('MG') === 31);
ok('normaliza cidade', A.normalizarCidade('Bocaiúva','mg').nome === 'BOCAIUVA');
const itemCompra = A.calcularItemCompra(db.modulosDinamicos.ITENS_COMPRA.dados[0]);
ok('calcula item compra com desconto/frete', itemCompra.total === 20 && itemCompra.custoUnit === 11);
const itemVenda = A.calcularItemVenda(db.modulosDinamicos.ITENS_VENDA.dados[0], 'emp');
ok('calcula item venda', itemVenda.subtotal === 35 && itemVenda.percDesconto === 12.5);
const changed = A.aplicarAutomacoesVendasComprasCadastros('emp');
ok('aplicou automações', changed > 0);
ok('cidades/ruas/situações migradas', db.cidadesMigradas.length === 1 && db.ruasMigradas.length === 1 && db.situacoesMigradas.length === 1);
ok('compra atualizou produto', db.produtos[0].ncm === '12345678' && db.produtos[0].codigoBarra === '789');
ok('itens venda entraram na venda', db.vendas[0].itens.length === 2 && db.vendas[0].totalItensCalculado === 65);
ok('favorito criado', db.produtosFavoritos.length === 1);
ok('insumo automático do cartucho criado', db.insumosGastosMigrados.some(x => x.origem === 'auto_cartucho'));
ok('agenda criou cliente e registro', db.agendaMigrada.length === 1 && db.clientes.some(c => c.nome === 'Joao Teste'));
console.log('\nRESULTADO: Testes de automações vendas/compras/cadastros passaram!');
