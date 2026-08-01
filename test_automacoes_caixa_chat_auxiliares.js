const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('automacoes_caixa_chat_auxiliares_patch.js','utf8');
const db = {
  config:{},
  clientes:[
    {id:'cli1', empresaId:'emp', codigo:'10', codigoAntigo:'10', nome:'Cliente Chat'},
    {id:'cli2', empresaId:'emp', codigo:'11', codigoAntigo:'11', nome:'Cliente Avaliação'}
  ],
  os:[{id:'osVis', empresaId:'emp', legadoCodigo:'VIS-5', clienteId:'cli2', status:'aberto'}],
  contasReceber:[],
  contasPagar:[],
  modulosDinamicos:{
    RETIRADA_CAIXA:{dados:[{COD_RETIRADA:1, TIPO:'E', VALOR:100, DESCRICAO:'Suprimento', DATA:'2026-08-01', COD_CAIXA:2},{COD_RETIRADA:2, TIPO:'S', VALOR:40, DESCRICAO:'Sangria', DATA:'2026-08-01', COD_CAIXA:2}]},
    FORNECEDORES:{dados:[{COD_FORNECEDOR:1, NOME_RAZAOSOCIAL:'Fornecedor A', CIDADE:'Janaúba', UF:'MG'}]},
    TRANSPORTADORES:{dados:[{COD_TRANSPORTADOR:1, TRANS_NOME:'Transp A', TRANS_CIDADE:'Bocaiúva', TRANS_UF:'MG'}]},
    CHAT:{dados:[{CH_CODIGO:1, CH_COD_CLIENTE:10, CH_MENSAGEM:'Preciso de toner', CH_DATA_ENVIO:'2026-08-01T10:00:00Z'}]},
    VISITAS:{dados:[{COD_VISITA:5, VI_COD_CLIENTE:11}]},
    RECEBIMENTO_CONTAS_RECEBER:{dados:[{COD_ITENS_RECEBIMENTO:7, COD_PARCELA:99},{COD_ITENS_RECEBIMENTO:9, COD_PARCELA:99}]},
    RECIBOS_EMITIDOS:{dados:[{COD_RECIBO:1, RC_COD_PARCELA:99, VALOR:100}]},
    ANEXOS:{dados:[{AN_CODIGO:1, AN_NOME:'foto.jpg', AN_TIPO:'imagem'}]},
    CENTRO_CUSTO:{dados:[{CC_CODIGO:1, CC_DESCRICAO:'Operação'}]},
    DEPARTAMENTOS:{dados:[{DEP_COD_DEPARTAMENTO:1, DEP_DESCRICAO:'financeiro'}]},
    SOLUCAO_DEFEITO:{dados:[{COD_SOLUCAO_DEFEITO:1, DESCRICAO:'"Limpeza\\ geral"'}]},
    SOMA_ITENS_INSUMOS_GASTOS:{dados:[{COD_SOMA_ITENS_INSUMOS_GASTOS:1, COD_RECARGA:100, VALOR_TOTAL:12}]},
    LOCALIZACAO:{dados:[{LO_CODIGO:1, LO_DESCRICAO:'Prateleira A'}]},
    ASSUNTOS:{dados:[{ASS_CODIGO:1, ASS_DESCRICAO:'Suporte'}]},
    MOTIVO_SITUACAO:{dados:[{MOT_CODIGO:1, MOT_DESCRICAO:'Aguardando'}]},
    ITENS_CAIXA:{dados:[{COD_ITENS_CAIXA:1, DESCRICAO:'Item caixa', VALOR:5}]},
    PUBLICIDADE:{dados:[{PUB_CODIGO:1, PUB_DESCRICAO:'Banner'}]},
    MOTIVO_PERGUNTA_TAGS:{dados:[{MPT_CODIGO:1, MPT_TAG:'urgente'}]},
    MOTIVO_RESPOSTA:{dados:[{MR_CODIGO:1, MR_RESPOSTA:'ok'}]},
    MOTIVOS:{dados:[{MO_CODIGO:1, MO_DESCRICAO:'duvida'}]},
    AVALIACAO:{dados:[{AV_CODIGO:1, AV_COD_VISITA:5, AV_NOTA:5, AV_COMENTARIO:'Bom'}]},
    VISITAS_HISTORICO:{dados:[{VH_CODIGO:1, VH_COD_VISITA:5, VH_DESCRICAO:'Aberto'}]},
    ENQUETES:{dados:[{ENC_CODIGO:1, ENC_DESCRICAO:'Satisfação'}]},
    ENQUETES_OPCOES:{dados:[{ENO_CODIGO:1, ENO_COD_ENQUETE:1, ENO_DESCRICAO:'Sim'}]}
  }
};

const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_CAIXA_CHAT_AUXILIARES_PURE;

console.log('== AUTOMACOES_CAIXA_CHAT_AUXILIARES_PURE ==');
ok('limpa descrição removendo aspas e barra', A.limparDescricao('"Limpeza\\ geral"') === 'LIMPEZA GERAL');
const changed = A.aplicarAutomacoesCaixaChatAuxiliares('emp');
ok('aplicou automações parte 11', changed > 0);
ok('retirada caixa criou categoria fechamento', db.categoriasContasPagarMigradas[0].descricao === 'FECHAMENTO');
ok('retirada entrada virou contas a receber paga', db.contasReceber.some(c=>c.origem==='retirada_caixa' && c.status==='pago' && c.valor===100));
ok('retirada saída virou contas a pagar paga', db.contasPagar.some(c=>c.origem==='retirada_caixa' && c.status==='pago' && c.valor===40 && c.categoria==='FECHAMENTO'));
ok('fornecedor normalizado e cidade criada sem acento', db.fornecedoresMigrados[0].cidade === 'JANAUBA' && db.fornecedoresMigrados[0].endereco === 'ENDERECO' && db.cidadesMigradas.some(c=>c.nome==='JANAUBA'));
ok('transportador criou cidade quando faltava código', db.transportadoresMigrados[0].codCidade && db.cidadesMigradas.some(c=>c.nome==='BOCAIUVA'));
ok('chat criou motivo e chamado leve', db.motivosDefeitoMigrados.some(m=>m.descricao==='CHAT') && db.chatsMigrados[0].clienteId==='cli1' && db.os.some(o=>o.origem==='chat_migrado' && o.chatMensagens.length===1));
ok('recibo vinculou último recebimento da parcela', db.recibosEmitidosMigrados[0].codItensRecebimento === '9');
ok('anexo e centro de custo migrados', db.anexosMigrados.length === 1 && db.centrosCustoMigrados[0].del === 0);
ok('departamento fica maiúsculo', db.departamentosMigrados[0].descricao === 'FINANCEIRO');
ok('auxiliares simples migrados', db.solucoesDefeitoMigradas[0].descricao === 'LIMPEZA GERAL' && db.somaItensInsumosGastosMigrados[0].valor === 12 && db.localizacoesMigradas.length === 1);
ok('assunto e motivo situação com defaults', db.assuntosMigrados[0].valor === 0 && db.motivosSituacaoMigrados[0].codAssunto === '1' && db.motivosSituacaoMigrados[0].ordem === 1);
ok('itens caixa, publicidade, tags e respostas migrados', db.itensCaixaMigrados.length === 1 && db.publicidadesMigradas.length === 1 && db.motivoPerguntaTagsMigradas.length === 1 && db.motivoRespostasMigradas.length === 1);
ok('motivos ficam maiúsculos', db.motivosMigrados[0].descricao === 'DUVIDA');
ok('avaliação puxou cliente da visita', db.avaliacoesMigradas[0].clienteId === 'cli2' && db.avaliacoesMigradas[0].osId === 'osVis');
ok('histórico de visitas e enquetes migrados', db.visitasHistoricoMigrado.length === 1 && db.enquetesMigradas.length === 1 && db.enquetesOpcoesMigradas[0].enqueteCodigoAntigo === '1');
console.log('\nRESULTADO: Testes de automações caixa/chat/auxiliares passaram!');
