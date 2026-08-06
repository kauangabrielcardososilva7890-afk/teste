const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('automacoes_finais_locacao_auxiliares_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', codigoAntigo:'10', nome:'Cliente'}],
  produtos:[{id:'prd1', empresaId:'emp', sku:'20', codigoAntigo:'20', nome:'Toner', vidaUtil:1000}],
  contratos:[{id:'ct1', empresaId:'emp', numero:'200', codigoAntigo:'200', clienteId:'cli1'}],
  cartuchosMigrados:[{id:'cart1', codigoAntigo:'30', qtdeCopias:800}],
  emailsMigrados:[{id:'eml1', empresaId:'emp', codigoAntigo:'5', email:'cliente@x.com'}],
  modulosDinamicos:{
    ENQUETES_PERGUNTA:{dados:[{ENI_CODIGO:1, ENI_COD_ENQUETE:1, ENI_PERGUNTA:'Gostou?'}]},
    ENQUETES_VOTOS:{dados:[{ENV_CODIGO:1, ENV_COD_ENQUETE:1, ENV_COD_CLIENTE:10, ENV_VALOR:'Sim'}]},
    CARTAO_CLIENTE:{dados:[{CAC_CODIGO:1, CAC_COD_CLIENTE:10, CAC_DESCRICAO:'Fidelidade'}]},
    CONTADORES_OFF:{dados:[{COO_CODIGO:1, COO_SERIAL:'ABC', COO_CONTADOR:123}]},
    EMAIL_OFF:{dados:[{EMO_CODIGO:1, EMO_EMAIL:'CLIENTE@X.COM', EMO_ASSUNTO:'Fila'}]},
    EMAIL_CAMPANHA_ENVIOS_EMAIL:{dados:[{ECM_CODIGO:1, ECM_COD_EMAIL:5, ECM_ACAO:1},{ECM_CODIGO:2, ECM_COD_EMAIL:5, ECM_ACAO:0}]},
    CONFIG_CLIENTES:{dados:[{CLC_CODIGO:1, CLC_COD_CLIENTE:10, CLC_DESCRICAO:'limite', CLC_VALOR:'1'}]},
    CONFIG_SISPRINTER:{dados:[{COS_CODIGO:1, COS_COD_CLIENTE:10, COS_DESCRICAO:'VALOR_EMAIL', COS_VALOR:0.05},{COS_CODIGO:2, COS_COD_CLIENTE:10, COS_DESCRICAO:'VALOR_WHATSAPP', COS_VALOR:0.20}]},
    CONTAS_RECEBER_AVULSA:{dados:[
      ...Array.from({length:11}, (_,i)=>({CRA_CODIGO:i+1, CRA_COD_CLIENTE:10, CRA_DESCRICAO:'Enviou Email: teste', CRA_DATA:'2026-08-01T10:00:10Z'})),
      {CRA_CODIGO:20, CRA_COD_CLIENTE:10, CRA_DESCRICAO:'Enviou Whatsapp: teste', CRA_DATA:'2026-08-01T11:00:00Z'},
      {CRA_CODIGO:21, CRA_COD_CLIENTE:10, CRA_DESCRICAO:'Gerou Nfe: 1', CRA_DATA:'2026-08-01T12:00:00Z'},
      {CRA_CODIGO:22, CRA_COD_CLIENTE:10, CRA_DESCRICAO:'Enviou SMS: importado', CRA_OBS:'Importado Banco Mysql'}
    ]},
    PRODUTOS_ATACADO:{dados:[{PRA_CODIGO:1, PRA_COD_PRODUTO:20, PRA_QTDE:5, PRA_VALOR:90}]},
    RAMO:{dados:[{RAM_CODIGO:1, RAM_DESCRICAO:'Escritório'}]},
    REGISTROS:{dados:[{REG_CODIGO:1, REG_DESCRICAO:'Registro'}]},
    BOLETOS_HISTORICO:{dados:[{BOH_CODIGO:1, BOH_COD_BOLETO:10, BOH_STATUS:'paid'}]},
    PIX_HISTORICO:{dados:[{PIH_CODIGO:1, PIH_COD_PIX:2, PIH_STATUS:5}]},
    SELECIONADOS:{dados:[{COD_SELECIONADO:1, TABELA:'CLIENTES', REFERENCIA:'10'}]},
    ITENS_VENDA:{dados:[{COD_ITENS_VENDA:501, COD_PRODUTO:20}]},
    CONTADORES:{dados:[{CON_COD_LOCACAO:200, CON_TOTAL_IMPRESSAO_DIA:10, CON_DATA_CADASTRO:'2026-08-01'},{CON_COD_LOCACAO:200, CON_TOTAL_IMPRESSAO_DIA:20, CON_DATA_CADASTRO:'2026-08-02'}]},
    LOCACAO_ESTOQUE:{dados:[{LE_CODIGO:1, LE_COD_LOCACAO:200, LE_ESTOQUE_TONER:0, LE_IMPRESSOES:0}]},
    LOCACAO_ESTOQUE_HISTORICO:{dados:[{LEH_CODIGO:1, LEH_COD_LOCACAO:200, LEH_COD_CLIENTE:10, LEH_TIPO:1, LEH_QTDE:2, LEH_COD_ITENS_VENDA:501},{LEH_CODIGO:2, LEH_COD_LOCACAO:200, LEH_TIPO:0, LEH_QTDE:1, LEH_IMPRESSOES:300}]},
    RAMO_ITENS_FABRICANTE:{dados:[{RIF_CODIGO:1, RIF_COD_RAMO_ITEM:4, RIF_COD_FABRICANTE:9}]}
  }
};

const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_FINAIS_LOCACAO_AUX_PURE;

console.log('== AUTOMACOES_FINAIS_LOCACAO_AUX_PURE ==');
ok('descrição status Pix', A.descricaoStatusPix(5) === 'Pago');
const changed = A.aplicarAutomacoesFinaisLocacaoAux('emp');
ok('aplicou automações parte 12', changed > 0);
ok('perguntas e votos de enquete migrados', db.enquetesPerguntasMigradas[0].pergunta === 'Gostou?' && db.enquetesVotosMigrados[0].clienteId === 'cli1');
ok('cartão cliente, contador off e email off migrados', db.cartoesClienteMigrados.length === 1 && db.contadoresOffMigrados[0].contador === 123 && db.emailsOffMigrados[0].email === 'cliente@x.com');
ok('evento de campanha incrementou abertura do e-mail', db.emailCampanhaEventosMigrados.length === 2 && db.emailsMigrados[0].emailAbriu === 1);
ok('configurações migradas', db.configClientesMigradas.length === 1 && db.configSisprinterMigradas.length === 2);
ok('conta avulsa classificou custo de e-mail em lote', db.contasReceberAvulsasMigradas.find(x=>x.codigoAntigo==='1').valor === 0.05);
ok('conta avulsa usou override de whatsapp e ignorou importado mysql', db.contasReceberAvulsasMigradas.find(x=>x.codigoAntigo==='20').valor === 0.2 && !db.contasReceberAvulsasMigradas.find(x=>x.codigoAntigo==='22'));
ok('conta avulsa NFE padrão', db.contasReceberAvulsasMigradas.find(x=>x.codigoAntigo==='21').valor === 1.99);
ok('produtos atacado, ramo e registros migrados', db.produtosAtacadoMigrados[0].valor === 90 && db.ramosMigrados.length === 1 && db.registrosMigrados.length === 1);
ok('históricos boleto e pix migrados', db.boletosHistoricoMigrado.length === 1 && db.pixHistoricoMigrado[0].statusDescricao === 'Pago');
ok('selecionados e ramo/fabricante migrados', db.selecionadosMigrados.length === 1 && db.ramoItensFabricanteMigrados[0].fabricanteCodigoAntigo === '9');
ok('locação estoque histórico calculou entrada por vida útil do produto', db.locacaoEstoqueHistorico.find(x=>x.codigoAntigo==='LEH-1').impressoes === 2000);
ok('locação estoque calculou saldo, média, dias e percentual', db.locacaoEstoqueMigrado[0].estoqueToner === 1 && db.locacaoEstoqueMigrado[0].impressoes === 1700 && db.locacaoEstoqueMigrado[0].impressoesMediaDia === 15 && db.locacaoEstoqueMigrado[0].dias === 113 && db.locacaoEstoqueMigrado[0].porcentagem === 100);
ok('contrato recebeu resumo de toner', db.contratos[0].estoqueToner === 1 && db.contratos[0].diasToner === 113);
console.log('\nRESULTADO: Testes de automações finais/locação/auxiliares passaram!');
