const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_pix_contadores_auxiliares_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', nome:'Cliente', email:'cliente@x.com'}],
  vendas:[{id:'v1', empresaId:'emp', numero:'100', clienteId:'cli1'}],
  equipamentos:[{id:'eq1', empresaId:'emp', serie:'ABC', patrimonio:'446', modelo:'Brother', contadorPB:1000}],
  parque:[{id:'p1', empresaId:'emp', equipamentoId:'eq1', clienteId:'cli1', contratoId:'ct1'}],
  contasReceber:[{id:'cr1', empresaId:'emp', vendaId:'v1', pixCodigoAntigo:'1', status:'aberto'}],
  modulosDinamicos:{
    PIX:{dados:[{PIX_CODIGO:1, PIX_COD_VENDA:100, PIX_COD_CLIENTE:10, PIX_DATA_PAGAMENTO:'2026-08-01', PIX_VALOR:50},{PIX_CODIGO:2, PIX_COD_VENDA:100, PIX_DATA_CANCELADO:'2026-08-02'}]},
    CONTAS:{dados:[{CON_COD_CONTA:1, CON_DESCRICAO_CONTA:'INTER', BOLETO_BANCO:'cobBancoInter', CON_REC_PIX:1, PIX_CUSTO:1.5}]},
    CONTADOR:{dados:[{CON_CODIGO:1, CON_SERIAL:'ABC', CON_GERAL:1000, CON_DATA_CADASTRO:'2026-08-01', CON_NIVEL_MONO:20, CON_STATUS:'ok'},{CON_CODIGO:2, CON_SERIAL:'ABC', CON_GERAL:1100, CON_DATA_CADASTRO:'2026-08-02', CON_NIVEL_MONO:10, CON_STATUS:'toner low'}]},
    EMAIL:{dados:[{EMAIL_CODIGO:1, EMAIL_DESCRICAO:'CLIENTE@X.COM', EMAIL_CONTATO:'', EMAIL_DATA:'2026-08-01'}]},
    CUPONS:{dados:[{CUP_CODIGO:1, CUP_DESCRICAO:'DESC'}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_PIX_CONTADORES_AUX_PURE;
console.log('== AUTOMACOES_PIX_CONTADORES_AUX_PURE ==');
ok('status pix pago', A.pixStatus({PIX_DATA_PAGAMENTO:'x'}).situacao === 'Pago');
ok('banco inter codigo 077', A.bancoCodigo('cobBancoInter') === '077');
ok('comparar alerta menor que', A.compararAlerta(10,2,15));
const changed = A.aplicarAutomacoesPixContadoresAux('emp');
ok('aplicou automações', changed > 0);
ok('pix migrado sem baixa automática', db.pixMigrados.length === 2 && db.contasReceber[0].status === 'aberto');
ok('conta bancária migrada', db.contasBancariasMigradas[0].bancoCodigo === '077' && db.contasBancariasMigradas[0].recPix === true);
ok('contadores migrados e contador equipamento atualizado', db.contadoresMigrados.length === 2 && db.equipamentos[0].contadorPB === 1100);
ok('alerta de contador criado', db.contadorAlertasMigrados.length >= 1);
ok('email migrado vincula cliente', db.emailsMigrados[0].clienteId === 'cli1' && db.emailsMigrados[0].email === 'cliente@x.com');
ok('auxiliar simples migrado', db.cuponsMigrados.length === 1);
console.log('\nRESULTADO: Testes de automações pix/contadores/auxiliares passaram!');
