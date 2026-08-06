const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_orcamentos_clientes_auxiliares_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', nome:'CLIENTE TESTE', email:'ABC@EMAIL.COM', cidade:'Bocaiúva', estado:'mg', endereco:'', numero:'', bairro:''}],
  produtos:[{id:'prd1', empresaId:'emp', sku:'5', nome:'Produto 5', preco:20, valorTotal2:15, valorTotal3:10, categoria:'Produto', tipo:'P'}],
  vendas:[{id:'orc1', empresaId:'emp', numero:'3', orcamentoCodigoAntigo:'3', status:'orcamento', itens:[], total:0}],
  modulosDinamicos:{
    ITENS_ORCAMENTO:{dados:[{COD_ITENS_ORCAMENTO:1,COD_ORCAMENTO:3,COD_PRODUTO:5,QTDE:2,PRECO:2,DESCONTO:10,TIPO_DESCONTO:0}]},
    BOLETOS:{dados:[{BO_CODIGO:1,BO_COD_CLIENTE:10,BO_VALOR_TOTAL:120,BO_SITUACAO:'paid',BO_DATA_VENCIMENTO:'2026-08-10'}]},
    NFSE:{dados:[{NFS_CODIGO:1,NFS_STATUS:2}]},
    CLIENTES_USUARIOS:{dados:[{CLU_CODIGO:1,CLU_COD_CLIENTE:10}]},
    GRADES:{dados:[{GRA_CODIGO:1,GRA_DESCRICAO:'Cor'}]},
    PRODUTOS_CATEGORIA:{dados:[{PRC_CODIGO:1,PRC_DESCRICAO:'Linha'}]},
    VARIACAO:{dados:[{VAR_CODIGO:1,VAR_DESCRICAO:'Tamanho'}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_ORC_CLIENTES_AUX_PURE;
console.log('== AUTOMACOES_ORC_CLIENTES_AUX_PURE ==');
const item = A.calcularItemOrcamento(db.modulosDinamicos.ITENS_ORCAMENTO.dados[0], 'emp');
ok('calcula item orçamento com preço promocional e desconto percentual', item.preco === 15 && item.subtotal === 27);
ok('normaliza status boleto', A.statusBoleto('paid') === 'PAGO');
const changed = A.aplicarAutomacoesOrcClientesAux('emp');
ok('aplicou automações', changed > 0);
ok('itens do orçamento atualizados', db.vendas[0].itens.length === 1 && db.vendas[0].total === 27);
ok('cliente normalizado sem caps em nome e email minúsculo', db.clientes[0].nome === 'Cliente Teste' && db.clientes[0].email === 'abc@email.com');
ok('boletos legado criados sem reativar boleto', db.boletosLegado.length === 1 && db.boletosLegado[0].status === 'PAGO' && db.boletosLegado[0].somenteLegado);
ok('NFSe migrada criada e cancelada', db.nfseMigradas.length === 1 && db.nfseMigradas[0].cancelada === true);
ok('portal e auxiliares criados', db.clientesUsuariosMigrados.length === 1 && db.gradesMigradas.length === 1 && db.produtosCategoriaMigradas.length === 1 && db.variacaoTiposMigrados.length === 1);
console.log('\nRESULTADO: Testes de automações orçamento/clientes/auxiliares passaram!');
