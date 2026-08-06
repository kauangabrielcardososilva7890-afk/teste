const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_locacao_visitas_patch.js','utf8');
const db = {
  clientes:[{id:'cli1', empresaId:'emp', codigo:'78', nome:'Cliente 78'}],
  contratos:[{id:'ct1', empresaId:'emp', numero:'51', codigoAntigo:'51', clienteId:'cli1', equipamentos:[], franquiaPB:1000, valorExcedentePB:0.08}],
  equipamentos:[], parque:[], os:[], vendas:[], produtos:[{id:'prd1', empresaId:'emp', sku:'10', nome:'Toner', vidaUtil:5000}],
  modulosDinamicos:{
    DEPARTAMENTOS:{dados:[{DEP_COD_DEPARTAMENTO:7, DEP_DESCRICAO:'OBRAS'}]},
    ITENS_LOCACAO:{dados:[{IT_COD_ITENS_LOCACAO:113, IT_COD_LOCACAO:51, IT_COD_DEPARTAMENTO:7, IT_COD_EQUIPAMENTO:2, IT_SERIAL:'M558', IT_PATRIMONIO:'2018027', IT_TIPO:'G', IT_TIPO_SCANNER:'C', IT_VALOR_PAGINAS_SCANNER:0.01}]},
    VISITAS:{dados:[{COD_VISITA:18, COD_LOCACAO:51, VI_COD_CLIENTE:78, VI_COD_EQUIPAMENTO:2, VI_COD_ITENS_LOCACAO:113, VI_COD_DEPARTAMENTO:7, VI_PATRIMONIO:'2018027', VI_SERIAL:'M558', VI_COD_MOTIVO_DEFEITO:30, VI_MOTIVO:'TROCA TONER', VI_VALOR_CUSTO:30, VI_GERAR_VENDA:1, VI_COD_VENDA:106, DATA:'2020-01-02', VI_SITUACAO:'F'}]},
    DESPESAS_LOCACAO:{dados:[{DP_COD_DESPESA:1, DP_COD_VISITA:18, DP_COD_ITENS_LOCACAO:113, DP_DESCRICAO:'TONER PRETO', DP_COD_ITENS_VENDA:9, DP_QTDE:1}]},
    ITENS_VENDA:{dados:[{COD_ITENS_VENDA:9, COD_PRODUTO:10, DESCRICAO:'TONER PRETO'}]},
    MOTIVO_DEFEITO:{dados:[{COD_MOTIVO_DEFEITO:30, DESCRICAO:'TROCA TONER'}]},
    CARTUCHOS:{dados:[{COD_CARTUCHO:1, QTDE_COPIAS:3000}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_LOC_VISITAS_PURE;
console.log('== AUTOMACOES_LOC_VISITAS_PURE ==');
ok('detecta suprimento', A.descricaoSuprimento('TONER PRETO'));
ok('mapeia tipo C para impressão', A.tipoMedidorFromCodigo('C') === 'impressao');
const changed = A.aplicarAutomacoesLocacaoVisitas('emp');
ok('aplicou automações', changed > 0);
ok('criou equipamento', db.equipamentos.length === 1 && db.equipamentos[0].patrimonio === '2018027');
ok('criou parque no contrato', db.parque.length === 1 && db.parque[0].contratoId === 'ct1' && db.parque[0].setor === 'OBRAS');
ok('scanner é independente', db.parque[0].medidores.scanner.modalidade === 'impressao' && db.parque[0].medidores.pretoA4.modalidade === 'global');
ok('criou chamado pela visita', db.os.length === 1 && db.os[0].status === 'concluido');
ok('criou despesa e histórico de suprimento', db.despesasLocacao.length >= 1 && db.locacaoEstoqueHistorico.length === 1);
ok('gerou venda da visita quando marcado', db.vendas.length === 1 && db.vendas[0].origem === 'visita_gerou_venda');
console.log('\nRESULTADO: Testes de automações locação/visitas passaram!');
