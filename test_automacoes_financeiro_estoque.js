const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_financeiro_estoque_patch.js','utf8');
const db = {
  config:{},
  produtos:[{id:'prd1', empresaId:'emp', sku:'10', nome:'Produto', categoria:'Produto', estoque:0}],
  vendas:[{id:'v1', empresaId:'emp', numero:'50', total:100, status:'aguardar', itens:[]}],
  leituras:[{id:'l1', empresaId:'emp', codigoAntigo:'7', valorDesconto:5, valorAcrescimo:2, status:'pendente'}],
  contasReceber:[{id:'cr1', empresaId:'emp', vendaId:'v1', valor:100, status:'pago', pagamentoData:'2026-08-01'}, {id:'cr2', empresaId:'emp', leituraId:'l1', valor:10, status:'pago', pagamentoData:'2026-08-01'}],
  contasPagar:[{id:'cp1', empresaId:'emp', descricao:'', valorParcela:50, juros:5, fornecedor:''}],
  modulosDinamicos:{
    CONTADOR_PAGINAS:{dados:[{CP_COD_LEITURA:7, CP_VALOR_TOTAL:20}]},
    PRODUTOS_HISTORICO:{dados:[{PH_CODIGO:1, PH_COD_PRODUTO:10, PH_TIPO:'E', PH_QTDE:7},{PH_CODIGO:2, PH_COD_PRODUTO:10, PH_TIPO:'S', PH_QTDE:2}]},
    TAB_CEST:{dados:[{NCM:'12345678', CEST:'01.001.00'}]},
    ITENS_NOTA:{dados:[{IN_CODIGO:1, IN_COD_PRODUTO:10, IN_COD_VENDA:50, IN_VALOR_UNITARIO:12.5, IN_QTDE:2, IN_NCM:'12345678'}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_FIN_ESTOQUE_PURE;
console.log('== AUTOMACOES_FIN_ESTOQUE_PURE ==');
ok('normaliza localização', A.normalizeLocalizacaoDescricao(' A\\B ') === 'A/B');
const calc = A.calcularLeituraPorContadores([{CP_VALOR_TOTAL:20}], 5, 2);
ok('calcula leitura por contadores', calc.valorTotal === 17 && calc.desconto === 5 && calc.acrescimo === 2);
const cp = A.aplicarDefaultsContaPagar({valorParcela:10, juros:2, fornecedor:''});
ok('defaults conta pagar', cp.valorTotal === 12 && cp.fornecedor === 'Fornecedor não identificado');
const changed = A.aplicarAutomacoesFinanceiroEstoque('emp');
ok('aplicou automações', changed > 0);
ok('conta recebida marca venda paga/faturada', db.vendas[0].status === 'faturado' && db.vendas[0].pagamentoStatus === 'pago');
ok('conta recebida marca leitura faturada', db.leituras[0].status === 'faturado');
ok('leitura recalculada pelo contador', db.leituras[0].valorExcedente === 17);
ok('histórico atualiza estoque', db.produtos[0].estoque === 5);
ok('item nota calcula total e CEST', db.modulosDinamicos.ITENS_NOTA.dados[0].IN_VALOR_TOTAL === 25 && db.modulosDinamicos.ITENS_NOTA.dados[0].IN_CEST === '01.001.00');
console.log('\nRESULTADO: Testes de automações financeiro/estoque passaram!');
