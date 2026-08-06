const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_triggers_patch.js','utf8');
const db = {
  clientes: [], produtos:[{id:'p1', empresaId:'emp', sku:'10', nome:'Produto 10'}], vendas:[], parque:[{id:'prq1', empresaId:'emp', codigoAntigo:'113'}],
  modulosDinamicos:{
    ORCAMENTO:{dados:[{COD_ORCAMENTO:3, COD_CLIENTE:71, NOME_CLIENTE:'CIDA FILOMENA', VALOR_DESCONTO:10, VALOR_ACRESCIMO:5, VALOR_FRETE:2, PERCENTUAL_DESC:0, DATA_EMISSAO:'2018-04-20'}]},
    ITENS_ORCAMENTO:{dados:[{COD_ORCAMENTO:3, COD_PRODUTO:10, QTDE:2, VALOR_UNITARIO:50, VALOR_TOTAL:100}]},
    VISITAS:{dados:[{VI_COD_ITENS_LOCACAO:113, DATA:'2020-01-02'}]},
    MOVIMENTACAO:{dados:[{MOV_COD_CONTA:2, MOV_ENTRADA:100, MOV_SAIDA:20},{MOV_COD_CONTA:2, MOV_ENTRADA:5, MOV_SAIDA:0}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_TRIGGERS_PURE;
console.log('== AUTOMACOES_TRIGGERS_PURE ==');
ok('calcula total de orçamento com desconto/acréscimo/frete', A.calcularTotalOrcamento(db.modulosDinamicos.ORCAMENTO.dados[0], db.modulosDinamicos.ITENS_ORCAMENTO.dados) === 97);
const changed = A.aplicarAutomacoesTriggers('emp');
ok('sincroniza orçamento para vendas', changed > 0 && db.vendas.length === 1 && db.vendas[0].status === 'orcamento');
ok('cria cliente avulso do orçamento', db.clientes.length === 1 && db.clientes[0].codigo === '71');
ok('atualiza última visita do parque', db.parque[0].ultimaVisita === '2020-01-02');
ok('recalcula saldo por movimentação', db.saldosMovimentacao['2'] === 85);
const venda = A.converterOrcamentoEmVenda('3', 'emp');
ok('converte orçamento em venda sem apagar orçamento', venda && db.vendas.length === 2 && db.vendas[0].status === 'aprovado');
console.log('\nRESULTADO: Testes de automações de triggers passaram!');
