const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('automacoes_compras_recebimentos_contadores_patch.js','utf8');
const db = {
  config:{},
  empresas:[{id:'emp', endereco:'Rua Empresa', bairro:'Centro', cidade:'Bocaiuva', estado:'MG', cep:'39390-000', numero:'1'}],
  clientes:[
    {id:'cli1', empresaId:'emp', codigo:'10', codigoAntigo:'10', nome:'Cliente 10', telefone:'38', email:'cli@x.com', endereco:'', bairro:'', cidade:'', estado:'', numero:'', funcionarioCodigoAntigo:'7'},
    {id:'cli2', empresaId:'emp', codigo:'11', codigoAntigo:'11', nome:'Cliente 11', bloqueado:true}
  ],
  produtos:[{id:'prd1', empresaId:'emp', sku:'20', codigoAntigo:'20', nome:'Toner', categoria:'Produto', preco:100, custo:50}],
  equipamentos:[{id:'eq1', empresaId:'emp', codigoAntigo:'5', modelo:'Impressora'}],
  parque:[{id:'p1', empresaId:'emp', codigoAntigo:'77', clienteId:'cli1', contratoId:'ct1', equipamentoId:'eq1'}],
  leituras:[{id:'l1', empresaId:'emp', codigoAntigo:'8', valorTotal:0, valorExcedente:0}],
  vendas:[{id:'v1', empresaId:'emp', numero:'100', codigoAntigo:'100', itens:[{descricao:'Remanu antiga', tipoDescricao:'REMANU.', subtotal:10},{descricao:'Produto', tipoDescricao:'PRODUTO', subtotal:90}]}],
  contasReceber:[
    {id:'cr1', empresaId:'emp', legadoCodigo:'1', clienteId:'cli1', vendaId:'v1', valor:100, status:'aberto'},
    {id:'cr2', empresaId:'emp', legadoCodigo:'2', clienteId:'cli2', valor:60, status:'aberto'}
  ],
  contasPagar:[{id:'cp1', empresaId:'emp', legadoCodigo:'9', valor:80, status:'aberto', codCompra:'50'}],
  modulosDinamicos:{
    CONFIGURACAO:{dados:[{VENDEDOR_CLIENTE_VENDA:'S', COM_VEND_VENDEDOR_CLIENTE:'S', CONVERTER_UND_MEDIDA_ESTOQUE:'S', LUCRO_PROD_VAREJO:30, LUCRO_PROD_PROMOCAO:20, LUCRO_PROD_ATACADO:10, CLI_ALTERAR_COD_RECEBIMENTO:'S', CARTAO_DIAS_COMPENSAR_CREDITO:2}]},
    VENDAS:{dados:[{COD_VENDA:100, COD_VENDA_SEQ:100, COD_CLIENTE:10, COD_EQUIPAMENTO:5, COD_RECEBIMENTO:3, VALOR_TOTAL:100, FINALIZADA:'N', RUA:'Rua Venda', NUMERO:'123'}]},
    COMPRA:{dados:[{COD_COMPRA:50, FINALIZADA:'S', FRETE:10, VALOR_ACRESCIMO:5, VALOR_DESCONTO:3}]},
    ITENS_COMPRA:{dados:[{COD_ITENS_COMPRA:500, COD_COMPRA:50, DESCRICAO:'Papel KG', QTDE:2, VALOR_UNITARIO:10, VALOR_TOTAL:20, VALOR_DESCONTO:2, VALOR_ICMS_ST:1, VALOR_IPI:1, UND_MEDIDA:'KG', CODIGO_BARRA:'789', NCM:'4802'}]},
    CONTADOR_PAGINAS:{dados:[{COD_CONTADOR:1, COD_ITENS_LOCACAO:77, CP_COD_LEITURA:8, CP_TIPO:'PRETO', PAGINAS_ATUAL:150, CP_VALOR_TOTAL:30, CP_COD_DEPARTAMENTO:3}]},
    DEPARTAMENTOS:{dados:[{DEP_COD_DEPARTAMENTO:3, DEP_DESCRICAO:'Financeiro'}]},
    SHOP_TOKEN:{dados:[{SHT_TOKEN:'tok1', SHT_COD_CLIENTE:10, SHT_DATA:'2026-08-01'}]},
    SHOP_ACESSOS:{dados:[{SHA_CODIGO:1, SHA_TOKEN:'tok1'}]},
    PRODUTOS_CARRINHO:{dados:[{PRC_CODIGO:1, PRC_TOKEN:'tok1', PRC_COD_PRODUTO:20, PRC_QTDE:2}]},
    ITENS_RECEBIMENTO:{dados:[{COD_ITENS_RECEBIMENTO:1, COD_VENDA:100, COD_RECEBIMENTO:3}]},
    RECEBIMENTO_CONTAS_RECEBER:{dados:[{COD_ITENS_RECEBIMENTO:10, COD_PARCELA:1, COD_RECEBIMENTO:3, TIPO:'T', VALOR:100, REC_COD_CONTA:1},{COD_ITENS_RECEBIMENTO:11, COD_PARCELA:2, COD_RECEBIMENTO:9, TIPO:'T', VALOR:60, REC_COD_CONTA:2},{COD_ITENS_RECEBIMENTO:12, COD_CONTAS_PAGAR:9, COD_RECEBIMENTO:1, TIPO:'P', VALOR:30, REC_COD_CONTA:1}]},
    RAMO_ITENS:{dados:[{RAI_CODIGO:1, RAI_DESCRICAO:'Copiadora'}]},
    FABRICANTE:{dados:[{COD_FABRICANTE:1, NOME:'Brother'}]},
    MOTIVO_DEFEITO:{dados:[{COD_MOTIVO_DEFEITO:1, DESCRICAO:'"Atolamento\\ papel"'}]},
    VALOR_CLIENTE:{dados:[{COD_VALOR_CLIENTE:1, COD_CLIENTE:10, COD_PRODUTO:20, VALOR:88}]}
  }
};

const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_COMPRAS_RECEBIMENTOS_CONTADORES_PURE;

console.log('== AUTOMACOES_COMPRAS_RECEBIMENTOS_CONTADORES_PURE ==');
ok('limpa motivo de defeito', A.limparMotivo('"Atolamento\\ papel"') === 'ATOLAMENTO PAPEL');
const rateio = A.calcularRateioCompra(db.modulosDinamicos.COMPRA.dados[0], db.modulosDinamicos.ITENS_COMPRA.dados);
ok('rateio compra distribui frete/acréscimo/desconto', rateio['500'].frete === 10 && rateio['500'].acrescimo === 5 && rateio['500'].desconto === 3);
const changed = A.aplicarAutomacoesComprasRecebimentosContadores('emp');
ok('aplicou automações parte 10', changed > 0);
ok('venda recebeu cliente, endereço e recebimento', db.vendas[0].clienteId === 'cli1' && db.vendas[0].formaEntrega === 'ENTREGAR' && db.itensRecebimentoMigrados.some(x=>x.vendaId==='v1' && x.valor===100));
ok('cliente recebeu ordem/último acesso e endereço seguro', db.clientes[0].cliOrdem === 1 && db.clientes[0].endereco === 'Rua Venda');
ok('equipamento recebeu ordem de venda', db.equipamentos[0].eqOrdem === 1);
ok('compra criou produto e item convertido KG para GR', db.produtos.some(p=>p.nome==='Papel KG' && p.unidade==='GR') && db.itensCompraMigrados[0].unidadeConvertida === true);
ok('contador de páginas recalculou leitura e medidor do parque', db.leituras[0].valorTotal === 30 && db.parque[0].medidoresInicio.preto === 150);
ok('carrinho vinculou token ao cliente e produto', db.produtosCarrinhoMigrados[0].clienteId === 'cli1' && db.shopTokensMigrados[0].clienteId === 'cli1');
ok('recebimento normal baixou conta e gerou movimento', db.contasReceber[0].status === 'pago' && db.movimentacaoRecebimentosMigrada.some(m=>m.tipo==='E' && m.entrada===100));
ok('Pix ficou sem baixa automática e exige comprovante', db.contasReceber[1].status === 'aberto' && db.contasReceber[1].pixComprovanteObrigatorio === true && db.contasReceber[1].baixaAutomatica === false);
ok('pagamento parcial de conta a pagar preservado', db.contasPagar[0].status === 'parcial' && db.contasPagarParciaisMigradas[0].valor === 30);
ok('auxiliares migrados', db.ramoItensMigrados.length === 1 && db.fabricantesMigrados.length === 1 && db.motivosDefeitoMigrados[0].descricao === 'ATOLAMENTO PAPEL' && db.valoresClienteMigrados[0].valor === 88);

// Simula exclusão de venda após já ter dados vinculados.
db.modulosDinamicos.VENDAS.dados[0].DEL = 1;
db.config.automacoes.comprasRecebimentosContadoresAssinatura = '';
A.aplicarAutomacoesComprasRecebimentosContadores('emp');
ok('venda excluída limpa financeiro sem apagar histórico de remanufatura', db.vendas[0].status === 'excluida' && db.contasReceber[0].status === 'cancelado' && db.itensRemanufaturaDesvinculados.length === 1);

console.log('\nRESULTADO: Testes de automações compras/recebimentos/contadores passaram!');
