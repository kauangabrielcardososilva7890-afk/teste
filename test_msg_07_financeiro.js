// ═══════════════════════════════════════════════════════════════
// test_msg_07_financeiro.js — GERADO por migrar_testes_r57.js; 3 seções.
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_automacoes_financeiro_estoque.js, test_automacoes_compras_recebimentos_contadores.js, test_ajustes_v52213.js
// ═══════════════════════════════════════════════════════════════
// Runner do tema: extrai cada SEÇÃO, roda isolada em processo filho
// (comportamento idêntico ao arquivo solto) e agrega o resultado.
// Seções abaixo vão dentro de if (false){} = INERTES (só parse, nunca executa).
// Novo teste do tema: APPEND bloco no fim, copiando o formato (if + 2 marcadores).
const __fs = require('fs');
const __cp = require('child_process');
const __self = __fs.readFileSync(__filename, 'utf8');
const __partes = [];
const __re = /\/\/<<<<SECAO:([^:]+):INICIO>>>>\r?\n([\s\S]*?)\/\/<<<<SECAO:\1:FIM>>>>/g;
let __m;
while ((__m = __re.exec(__self))) __partes.push({ nome: __m[1], codigo: __m[2] });
if (!__partes.length) { console.error('Tema sem seções!'); process.exit(1); }
const __falhas = [];
__partes.forEach((__s, __i) => {
  console.log('\n── ' + __s.nome + ' ──');
  const __tmp = '.tmp_secao_' + process.pid + '_' + __i + '.js';
  try {
    __fs.writeFileSync(__tmp, __s.codigo);
    const __r = __cp.spawnSync(process.execPath, [__tmp], { stdio: 'inherit' });
    if (__r.status !== 0 || __r.error) __falhas.push(__s.nome);
  } finally { try { __fs.unlinkSync(__tmp); } catch (e) {} }
});
if (__falhas.length) { console.error('\nTEMA FALHOU (' + __falhas.length + ' seções): ' + __falhas.join(', ')); process.exit(1); }
console.log('\nTEMA OK: ' + __partes.length + ' seções.');

if (false) { // ═══ test_automacoes_financeiro_estoque.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_financeiro_estoque.js:INICIO>>>>
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
//<<<<SECAO:test_automacoes_financeiro_estoque.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_compras_recebimentos_contadores.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_compras_recebimentos_contadores.js:INICIO>>>>
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
//<<<<SECAO:test_automacoes_compras_recebimentos_contadores.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52213.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52213.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const fin=fs.readFileSync('ajustes_v52213_financeiro_receber_patch.js','utf8');
const men=fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',fin+'\n'+men)(ctx.window,ctx.document);
const F=ctx.window.FINANCEIRO_RECEBER_PURE;
const M=ctx.window.MENUS_ATALHOS_PURE;

console.log('== FINANCEIRO RECEBER ==');
ok('formas sem A prazo', F.FORMAS_BAIXA.indexOf('Prazo')<0 && F.FORMAS_BAIXA.indexOf('Pix')>=0);
ok('Pix na baixa', F.FORMAS_BAIXA.includes('Pix'));
ok('addMeses jan->fev', F.addMeses('2026-01-31',1)==='2026-02-28' || F.addMeses('2026-01-31',1)==='2026-02-29');
ok('addMeses 10/01 -> 10/02', F.addMeses('2026-01-10',1)==='2026-02-10');
const reps=F.montarRepeticoes({descricao:'Aluguel',valor:100,clienteId:'c1',vencimento:'2026-03-10'},3);
ok('repetir 3', reps.length===3 && reps[0].descricao==='Aluguel' && reps[2].vencimento==='2026-05-10');
const cr={status:'aberto'};
F.aplicarBaixaTitulo(cr,'Pix','2026-08-19T12:00:00.000Z');
ok('Pix baixa de verdade', cr.status==='pago' && cr.formaPagamento==='Pix' && cr.pagamentoData);

ok('some Novo recebimento do menu HTML', !/Novo recebimento/i.test(html));
ok('Contas e caixas no patch 5.22.13', /Contas e caixa/i.test(fin+men));
ok('Receber junto da lixeira', /finAcaoReceber/.test(fin) && /btn-del-lote/.test(fin));
ok('sem status no novo lançamento', !/f-cr-status/.test(fin) && /fin-novo-desc/.test(fin));
ok('cliente lupa/Enter', /finBuscarCliente/.test(fin) && /Enter/.test(fin));
ok('não filtra ao digitar no cliente', !/oninput=\"window.finBuscarCliente/.test(fin));

console.log('== MENUS E ATALHOS ==');
ok('limite de nome', M.limitarNome('Configurações do sistema inteiro',18).length<=18);
const pad=M.menusPadrao();
const loc=pad.find(x=>x.id==='locacao');
ok('locação sem Chamados', loc && loc.items.every(it=>!/chamado/i.test(it.label)));
const at=pad.find(x=>x.id==='atendimento');
ok('atendimento tem chamado', at && at.items.some(it=>/chamado/i.test(it.label)));
const finMenu=pad.find(x=>x.id==='financeiro');
ok('financeiro só contas e caixas', finMenu && finMenu.items.length===1 && /contas e caixas/i.test(finMenu.items[0].label));
const moved=M.moverItem(['a','b','c'],2,0);
ok('mover ordem', moved[0]==='c' && moved[1]==='a');
const aplicado=M.aplicarNomesSalvos(pad,{ordem:['config','inicio'],nomes:{config:'Ajustes'}});
ok('config pode ir para o começo', aplicado[0].id==='config' && aplicado[0].label==='Ajustes');
ok('atalhos padrão', M.atalhosPadrao().length>=3);

ok('patch financeiro no bundle', manifest.includes('ajustes_v52213_financeiro_receber_patch.js'));
ok('patch menus no bundle', manifest.includes('ajustes_v52213_menus_atalhos_patch.js'));
ok('patches 5.22.13 no bundle', manifest.includes('ajustes_v52213_financeiro_receber_patch.js') && manifest.includes('ajustes_v52213_menus_atalhos_patch.js'));
ok('APK quieto', !/mobile/.test(fin+men));

console.log('\nRESULTADO: v5.22.13 passou!');
//<<<<SECAO:test_ajustes_v52213.js:FIM>>>>
}
