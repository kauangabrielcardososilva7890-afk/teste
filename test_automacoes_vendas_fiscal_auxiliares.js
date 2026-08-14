const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('automacoes_vendas_fiscal_auxiliares_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', codigoAntigo:'10', nome:'Cliente Teste', documento:'123.456.789-00', funcionarioCodigoAntigo:'7'}],
  produtos:[{id:'prd1', empresaId:'emp', sku:'20', codigoAntigo:'20', nome:'Toner', categoria:'Produto', preco:100}],
  vendas:[{id:'v1', empresaId:'emp', numero:'100', codigoAntigo:'100', clienteId:'cli1', data:'2026-08-01T10:00:00.000Z', status:'aberta', total:0, itens:[]}],
  contasReceber:[{id:'cr1', empresaId:'outra', vendaId:'v1', valor:113, status:'aberto'}],
  modulosDinamicos:{
    CONFIGURACAO:{dados:[{DIAS_GARANTIA_SERVICO:30, MUDAR_FORMA_ENTREGA_AUTO:'S', COM_VEND_VENDEDOR_CLIENTE:'S'}]},
    CUPONS:{dados:[{CUP_CODIGO:1, CUP_VALOR:15, CUP_TIPO:'DESCONTO'}]},
    CUPONS_ITENS:{dados:[{CUI_CODIGO:1, CUI_COD_CUPOM:1, CUI_COD_VENDA:100}]},
    ENDERECOS:{dados:[{END_CODIGO:1, END_COD_CLIENTE:10, END_CEP:'', END_ENDERECO:'Rua A', END_BAIRRO:'Centro', END_CIDADE:'Bocaiuva', END_UF:'MG', END_NUMERO:'55'}]},
    ENCOMENDAS:{dados:[{ENC_CODIGO:1, ENC_COD_CLIENTE:10, ENC_DESCRICAO:'Peça especial'}]},
    ENCOMENDAS_ITENS:{dados:[{ENI_CODIGO:1, ENI_COD_ENCOMENDA:1, ENI_COD_PRODUTO:20, ENI_QTDE:2, ENI_VALOR:10}]},
    PRODUTOS_FAVORITOS:{dados:[{PRF_CODIGO:1, PRF_COD_PRODUTO:20, PRF_COD_CLIENTE:10}]},
    PRODUTOS_PROMOCAO:{dados:[{PRP_CODIGO:1, PRP_COD_PRODUTO:20, PRP_VALOR:80}]},
    PRODUTOS_TAGS:{dados:[{PRT_CODIGO:1, PRT_COD_PRODUTO:20, PRT_TAG:'laser'}]},
    PRODUTOS_DIMENSAO:{dados:[{DIM_CODIGO:1, DIM_COD_PRODUTO:20, DIM_ALTURA:10, DIM_LARGURA:20}]},
    PRODUTOS_MOTIVO_PERGUNTA:{dados:[{PMP_CODIGO:1, PMP_COD_PRODUTO:20, PMP_PERGUNTA:'Compatível?'}]},
    PRODUTOS_VALORES:{dados:[{PV_CODIGO:1, PV_COD_PRODUTO:20, PV_VALOR:99}]},
    EMAIL_CAMPANHA:{dados:[]},
    EMAIL_CAMPANHA_ENVIOS:{dados:[{ECE_CODIGO:1, ECE_DESCRICAO:'Promo Agosto', ECE_EMAIL:'CLIENTE@TESTE.COM'}]},
    CARTAO:{dados:[{CAR_CODIGO:1, CAR_TITULAR:'cliente teste', CAR_CPF:'12345678900', CAR_DATA_NASCIMENTO:'1990-01-02', CAR_NUMERO:'4111111111111111'}]},
    CARTAO_BANDEIRA:{dados:[{CAB_CODIGO:1, CAB_DESCRICAO:'Visa'}]},
    CARTAO_HISTORICO:{dados:[{CAH_CODIGO:1, CAH_COD_CARTAO:1, CAH_VALOR:25}]},
    CARTAO_PAGAMENTO:{dados:[{CAP_CODIGO:1, CAP_COD_CARTAO:1, CAP_COD_VENDA:100, CAP_VALOR:50}]},
    COMANDAS:{dados:[{COM_CODIGO:1, COM_COD_CLIENTE:10, COM_VALOR_TOTAL:12}]},
    BANCOS:{dados:[{COD_BANCO:1, NOME:'Banco Teste'}]},
    NCM:{dados:[{NC_CODIGO:1, NC_NCM:'12.34.56.78', NC_DESCRICAO:'Teste'}]},
    TIPO_FINALIZACAO:{dados:[{TF_CODIGO:1, TF_DESCRICAO:'Balcão'}]},
    CARTUCHO_DEFEITO:{dados:[{COD_CARTUCHO_DEFEITO:1, DESCRICAO:'Vazando'}]},
    TRIBUTOS_PRODUTOS:{dados:[{TP_CODIGO:1, TP_COD_PRODUTO:20}]},
    VENDAS:{dados:[{COD_VENDA:100, COD_CLIENTE:10, FINALIZADA:'S', COD_EQUIPAMENTO:5, FORMA_ENTREGA:'BUSCAR', VALOR_MAO_DE_OBRA:20, VALOR_DESCONTO:5, VALOR_FRETE:3, COD_FUNCIONARIO:2}]},
    ITENS_VENDA:{dados:[{COD_ITENS_VENDA:1, COD_VENDA:100, COD_PRODUTO:20, TIPO_DESCRICAO:'PRODUTO', VALOR_TOTAL:50, VALOR_DESCONTO:5, VALOR_INSUMOS:10},{COD_ITENS_VENDA:2, COD_VENDA:100, TIPO_DESCRICAO:'SERVICO', VALOR_TOTAL:30, VALOR_DESCONTO:0}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_VENDAS_FISCAL_AUX_PURE;

console.log('== AUTOMACOES_VENDAS_FISCAL_AUX_PURE ==');
ok('normaliza NCM sem pontuação', A.normalizarNcm('12.34.56.78') === '12345678');
ok('mascara cartão', A.mascararNumeroCartao('4111111111111111') === '**** **** **** 1111');
ok('defaults IBS/CBS', A.tributoDefaults({}).cstIbsCbs === '000' && A.tributoDefaults({}).pCbs === 0.9);
const changed = A.aplicarAutomacoesVendasFiscalAuxiliares('emp');
ok('aplicou automações parte 9', changed > 0);
ok('cupom item herdou valor e tipo do cupom', db.cuponsItensMigrados[0].valor === 15 && db.cuponsItensMigrados[0].tipo === 'DESCONTO');
ok('endereço legado preservado com CEP em branco nulo', db.enderecosMigrados[0].cep === null && db.clientes[0].endereco === 'Rua A');
ok('encomenda e item migrados', db.encomendasMigradas.length === 1 && db.encomendasItensMigrados[0].valorTotal === 20);
ok('favorito e promoção histórica sem alterar preço do produto', db.produtosFavoritos.length === 1 && db.produtosPromocoesHistorico[0].naoAtivarPromocao === true && db.produtos[0].preco === 100);
ok('campanha criada pelo envio e sem envio automático', db.emailCampanhasMigradas.length === 1 && db.emailCampanhaEnviosMigrados[0].envioAutomatico === false);
ok('cartão histórico seguro atualizou nascimento do cliente', db.cartoesMigrados[0].titular === 'CLIENTE TESTE' && db.cartoesMigrados[0].numeroMascarado.endsWith('1111') && db.clientes[0].dataNascimento === '1990-01-02');
ok('NCM e tributos migrados com defaults', db.ncmMigrados[0].ncm === '12345678' && db.tributosProdutosMigrados[0].cclassTrib === '000001');
ok('venda finalizada recalculou total, garantia e forma entrega', db.vendas[0].status === 'finalizada' && db.vendas[0].total === 113 && db.vendas[0].dataGarantia === '2026-08-31' && db.vendas[0].formaEntrega === 'ENTREGAR');
ok('contas a receber sincronizou empresa da venda', db.contasReceber[0].empresaId === 'emp');
ok('OS gerada somente para venda com equipamento', db.os.length === 1 && db.vendas[0].osId === db.os[0].id);
console.log('\nRESULTADO: Testes de automações vendas/fiscal/auxiliares passaram!');
