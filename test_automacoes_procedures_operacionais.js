const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('automacoes_procedures_operacionais_patch.js','utf8');
const db = {
  config:{},
  clientes:[
    {id:'cli1', empresaId:'emp', codigo:'10', codigoAntigo:'10', nome:'Cliente', documento:'12345678900'},
    {id:'cliDup', empresaId:'emp', codigo:'11', codigoAntigo:'11', nome:'Cliente Duplicado', documento:'123.456.789-00'}
  ],
  produtos:[{id:'prd1', empresaId:'emp', sku:'20', codigoAntigo:'20', nome:'Toner', preco:100, precoPromocao:90, precoAtacado:80, estoque:0, descVend:10, vidaUtil:1000}],
  equipamentos:[{id:'eq1', empresaId:'emp', codigoAntigo:'5', modelo:'Brother 8157', serie:'SER123', status:'disponivel'}],
  contratos:[{id:'ct1', empresaId:'emp', numero:'200', codigoAntigo:'200', clienteId:'cli1', valorPretoGlobal:100, franquiaGlobal:1000}],
  parque:[{id:'pq1', empresaId:'emp', codigoAntigo:'77', contratoId:'ct1', clienteId:'cli1', equipamentoId:'eq1', status:'ativo', medidores:{preto:{ativo:true, modalidade:'Mensal', valorFixo:50, franquia:500}}}],
  leituras:[{id:'lei1', empresaId:'emp', codigoAntigo:'8', contratoId:'ct1', clienteId:'cli1'}],
  vendas:[{id:'v1', empresaId:'emp', numero:'300', codigoAntigo:'300', clienteId:'cli1', equipamentoId:'eq1', status:'finalizada', tipo:'R', formaEntrega:'ENTREGAR', itens:[{produtoId:'prd1', descricao:'Recarga cartucho', tipo:'R', qtd:1, preco:100, subtotal:100, valorInsumos:5}]}],
  produtosHistorico:[{produtoId:'prd1', tipo:'E', qtde:10},{produtoId:'prd1', tipo:'S', qtde:3}],
  modulosDinamicos:{
    CONFIGURACAO:{dados:[{VEN_CAD_CHAMADO_AUTO:1, CARTUCHO_FINALIZADO_VENDA:'S', NFE_TRIB_VENDA_DENTRO:5}]},
    CONTADOR_PAGINAS:{dados:[{COD_CONTADOR:1, COD_ITENS_LOCACAO:77, CP_COD_LEITURA:8, CP_TIPO:'PRETO', CP_PAGINAS:300, PAGINAS_ATUAL:1300, PAGINAS_EXCEDENTE:120, CP_VALOR_EXCEDENTE:24, CP_VALOR_TOTAL:30, DATA_LEITURA:'2026-08-01'}]},
    NOTA_FISCAL:{dados:[{NF_CODIGO:1, NF_UF:'MG', NF_COD_EMPRESA:1, NF_MOSTRAR_IMPOSTO:'S', NF_VALOR_FRETE:0}]},
    EMPRESA:{dados:[{COD_EMPRESA:1, UF:'MG'}]},
    ITENS_NOTA:{dados:[{IN_CODIGO:1, IN_COD_NOTA_FISCAL:1, IN_VALOR_TOTAL:100, IN_QTDE:1, IN_VALOR_UNITARIO:100, IN_NCM:'1234', IN_TIPO_DESCRICAO:'PRODUTO'}]},
    TRIBUTOS_PRODUTOS:{dados:[{TP_CODIGO:5, TP_CFOP:5102, TP_CSOSN:'101', TP_CST_ICMS:'00', TP_ICMS:18, TP_IPI:5, TP_PIS:1.65, TP_COFINS:7.6, TP_CST_IBS_CBS:'000', TP_CCLASS_TRIB:'000001', TP_PIBS_UF:0.1, TP_PIBS_MUN:0, TP_PCBS:0.9}]},
    NCM:{dados:[{NC_CODIGO:1, NC_NCM:'1234', NC_IMPOSTO:10}]}
  }
};

const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_PROCEDURES_OPERACIONAIS_PURE;

console.log('== AUTOMACOES_PROCEDURES_OPERACIONAIS_PURE ==');
ok('round ABNT metade par', A.roundABNT(2.345,2) === 2.34);
ok('round ABNT metade ímpar', A.roundABNT(2.355,2) === 2.36);
ok('somente números', A.somenteNumeros('12.345/0001-99') === '12345000199');
ok('código numérico NF evita sequência inválida', !['12345678','11111111'].includes(String(A.gerarCodigoNumericoNF(12345677)).padStart(8,'0')));
const vl = A.valorLocacaoContrato(db.contratos[0], db.parque);
ok('valor locação soma global e medidor mensal', vl.valor === 150 && vl.somaFranquia === 1000);
ok('autorizar desconto respeita limite vendedor', A.autorizarDescontoProduto({funcionario:{vendedor:true},produto:db.produtos[0],desconto:11,tipoDesconto:0,valorBase:100}).success === 'N');
ok('validar Pix bloqueia parcela com boleto', A.validarPixEmissao({boletoId:'b1'}).success === 'N');
const changed = A.aplicarAutomacoesProceduresOperacionais('emp');
ok('aplicou procedures operacionais', changed > 0);
ok('contrato recebeu info locação', db.contratos[0].qtdeEquip === 1 && db.contratos[0].valorMensalFixo === 150 && db.contratos[0].somaFranquia === 1000);
ok('leitura recebeu totais detalhados', db.leituras[0].valorTotal === 30 && db.leituras[0].paginas === 300 && db.leituras[0].totalTonerPretoA4 === 300);
ok('parque recebeu última leitura e contador', db.parque[0].ultimaLeitura === '2026-08-01' && db.parque[0].contadorAtual === 1300);
ok('estoque recalculado por histórico', db.produtos[0].estoque === 7);
ok('produto variação por serial criado', db.produtosVariacaoMigrados.some(v=>v.serial==='SER123' && v.produtoId));
ok('venda totalizada e cartucho finalizado', db.vendas[0].total === 105 && db.vendas[0].itens[0].situacao === 'FINALIZADO');
ok('chamado por venda/entrega criado', db.os.length === 1 && db.vendas[0].osId === db.os[0].id);
ok('perfil tributário aplicado no item nota', db.modulosDinamicos.ITENS_NOTA.dados[0].IN_CFOP === 5102 && db.modulosDinamicos.ITENS_NOTA.dados[0].IN_ICMS === 18);
ok('nota fiscal totalizada', db.notasFiscaisMigradas[0].valorTotal === 105);
ok('sugeriu cliente duplicado em vez de mesclar automático', db.clientesDuplicadosSugeridos.length === 1);
ok('métricas de config criadas', db.config.metricasProcedures.tempoEntregaSeg > 0);
const item = {produtoId:'prd1', qtd:2};
ok('alterar preço item venda por atacado', A.alterarVlrProdutoItemVenda(item,3,'emp').ok && item.preco === 80 && item.subtotal === 160);
A.distribuirDescontoVenda(db.vendas[0], 10, 0, true);
ok('distribui desconto em venda', db.vendas[0].desconto >= 10 && db.vendas[0].total < 105);
console.log('\nRESULTADO: Testes de procedures operacionais passaram!');
