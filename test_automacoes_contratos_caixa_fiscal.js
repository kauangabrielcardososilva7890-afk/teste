const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_contratos_caixa_fiscal_patch.js','utf8');
const db = {
  config:{},
  empresas:[{id:'emp', email:'loja@digicopy.com'}],
  clientes:[],
  contratos:[{id:'ct1', empresaId:'emp', numero:'1', status:'ativo', valorMensalFixo:0, valorPretoGlobal:10, valorColorGlobal:5}],
  parque:[{id:'p1', empresaId:'emp', contratoId:'ct1', equipamentoId:'eq1', status:'ativo', medidores:{pretoA4:{modalidade:'mes_fixo', valorFixo:120, ativo:true}, scanner:{modalidade:'impressao', valor:0.01, ativo:true}}}],
  equipamentos:[{id:'eq1', empresaId:'emp', modelo:'Brother HL', patrimonio:'446', serie:'ABC', status:'locado'}],
  produtos:[],
  vendas:[{id:'v1', empresaId:'emp', numero:'50', status:'aguardar'}],
  leituras:[{id:'l1', empresaId:'emp', codigoAntigo:'7'}],
  contasReceber:[{id:'cr1', empresaId:'emp', vendaId:'v1', status:'aberto'}, {id:'cr2', empresaId:'emp', leituraId:'l1', status:'aberto'}],
  modulosDinamicos:{
    CAIXA:{dados:[{COD_CAIXA:1, DATA:'2026-08-01', VALOR_DINHEIRO:100}]},
    NOTA_FISCAL:{dados:[{NF_CODIGO:9, NF_COD_VENDA:50, NF_COD_LEITURA:7, NF_NUM_NOTA:'123', NF_MODELO:55, NF_SITUACAO:'AUTORIZADA', NF_VALOR_TOTAL:100}]},
    ITENS_NOTA:{dados:[{IN_CODIGO:1, IN_COD_NOTA_FISCAL:9, IN_COD_PRODUTO:10, IN_VALOR_UNITARIO:20, IN_QTDE:2, IN_NCM:'12345678', IN_CEST:'01.001.00'}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_CONTR_CAIXA_FISCAL_PURE;
console.log('== AUTOMACOES_CONTR_CAIXA_FISCAL_PURE ==');
ok('calcula valor contrato por globais e medidor fixo', A.calcularValorContrato(db.contratos[0], db.parque) === 135);
ok('defaults caixa', A.defaultsCaixa({}).situacao === 'A' && A.defaultsCaixa({}).valorDinheiro === 0);
ok('fabricante por modelo', A.fabricantePeloModelo('Kyocera Ecosys') === 'KYOCERA');
const changed = A.aplicarAutomacoesContratosCaixaFiscal('emp');
ok('aplicou automações', changed > 0);
ok('contrato recebeu valor calculado', db.contratos[0].valorMensalFixo === 135);
ok('criou caixa migrado', db.caixasMigrados.length === 1);
ok('nota marcou venda e financeiro', db.vendas[0].nfe === 'S' && db.contasReceber[0].nfe === 'S');
ok('nota marcou leitura', db.leituras[0].notaFiscalId);
ok('equipamento criou produto auxiliar', db.produtos.some(p => p.equipamentoId === 'eq1' && p.categoria === 'Impressoras'));
ok('defaults empresa criados', db.config.defaultsOperacionais.caixaAtualizarPainelSeg === 600);
console.log('\nRESULTADO: Testes de automações contrato/caixa/fiscal passaram!');
