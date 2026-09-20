/* fiscal_catalogo_completo_patch.js (v6.0.14) — AS 6 TELAS FISCAIS COMPLETAS,
   campo a campo do CATÁLOGO das fotos do sistema antigo (RELATORIO_SESSAO.md,
   dias 14-15/09, fase de design declarada 100% fechada).

   Decreto dele (19/09/2026): "não quero leva — substitui esses velhos que você
   colocou e coloque TUDO de uma vez; se precisar de foto específica eu falo o
   nome, salvei com nome e tudo".

   O que este patch SUBSTITUI (renders anteriores continuam no bundle, mas a
   pintura final é daqui — este wrap é o último da fila):
     • central-nf .......... Listagem de Notas completa (8f) + Venda-NF editor
                            em 9 abas (20f) + Pré-Visualizar DANFE com selo;
     • fiscal-perfil ....... Perfis Tributários (11f): 5 perfis REAIS seed +
                            Configurar Tributação (ICMS/PIS/COFINS/IPI/Reforma);
     • fiscal-manifestacao . Consulta Notas Destinadas (7f): 3 buscas NSU,
                            filtros, grade dele, 4 eventos legais, Baixar XML;
     • fiscal-ncm ......... Lupa NCM com favoritos + padrões (mesmas chaves);
     • fiscal-enviar-xml ... 'Preparar Arquivos Fiscais' (1f): mês, incluir PDFs,
                            matriz NFe/NFCe × geradas/canceladas/corrigidas/não
                            encontrados + Enviar para Escritório;
     • config-fiscal ....... CONFIG NF EM 10 ABAS (Geral/Outras/Tributação/
                            Mensagens/Certificados/FCP/Inutilizar/NFCe/
                            Autorizações/Reforma) com os valores dele de preset.

   Leis permanentes respeitadas: placa HOMOLOGAÇÃO/PRODUÇÃO; nada automático
   (Gerar NFC-e ao finalizar venda nasce DESMARCADO, igual ao dele); senha na
   hora; PRODUCAO digitado (Portão v6.0.0 intocado); manifestar/inutilizar/
   excluir nota pedem permissão 'Emitir NF' (usuarioPodeEmitirNfe); popup
   sempre do sistema (modal-root); zero segredos gravados (CSC fica nos campos
   já existentes, com máscara); grafo de chaves: config mora em db.config.nfCfg,
   perfis em db.perfisNf, rascunhos em db.notasNf, e as chaves antigas
   (nfCsc/nfCscId/nfNcmPadrao/nfNcmTinta/nfNcmLocacao/nfRegistro/nfManifestacoes)
   seguem lidas/gravadas nos mesmos lugares — uma verdade só. */
(function () {
  var G = typeof window !== 'undefined' ? window : globalThis;
  if (G.__v6014fxc) return;
  G.__v6014fxc = true;

  /* ══════════════ PURE — o catálogo transcrito (testável sem DOM) ══════════════ */
  /* Config > Geral (12 fotos) */
  var DANFE_OPCOES = [['0', '0 - Sem geração'], ['1', '1 - Normal (retrato)'], ['2', '2 - Normal (paisagem)'], ['3', '3 - Simplificado'], ['4', '4 - DANFE NFC-e'], ['5', '5 - DANFE NFC-e em mensagem eletrônica']];
  var FRETE_OPCOES = [['0', '0 - Por conta do emitente (CIF)'], ['1', '1 - Por conta do destinatário/remetente (FOB)'], ['2', '2 - Por conta de terceiros'], ['3', '3 - Transporte próprio por conta do remetente'], ['4', '4 - Transporte próprio por conta do destinatário'], ['9', '9 - Sem ocorrência de transporte']];
  var MODELO_OPCOES = [['55', '55 - NF-e'], ['65', '65 - NFC-e']];
  var PROCESSAMENTO = [['0', '0 - Assíncrono'], ['1', '1 - Síncrono']];
  var PROC_EMISSAO = [['0', '0 - Emissão normal (aplicativo do contribuinte)'], ['1', '1 - Emissão de NFC-e pelo Fisco'], ['2', '2 - Emissão de NFC-e em site do Fisco'], ['3', '3 - Emissão em aplicativo do Fisco']];
  var TP_EMISSAO = [['1', '1 - Normal'], ['2', '2 - Contingência FS-IA'], ['3', '3 - Contingência SCAN'], ['4', '4 - Contingência DPEC'], ['5', '5 - Contingência FS-DA'], ['6', '6 - Contingência SVC-AN'], ['7', '7 - Contingência SVC-RS'], ['9', '9 - Contingência off-line (NFC-e)']];
  var TP_OPERACAO = [['0', '0 - Não se aplica / Outros'], ['1', '1 - Venda presencial'], ['2', '2 - Venda não presencial, pela internet'], ['3', '3 - Venda não presencial, teleatendimento'], ['4', '4 - NFC-e em operação com entrega a domicílio'], ['5', '5 - Venda presencial, fora do estabelecimento'], ['9', '9 - Venda não presencial, outros']];
  var CRT_OPCOES = [['1', '1 - Simples Nacional'], ['2', '2 - Simples Nacional (excesso de sublimite)'], ['3', '3 - Regime Normal'], ['4', '4 - Simples Nacional - MEI']];
  var REG_ESP = [['0', '0 - Nenhum'], ['1', '1 - Microempresa Municipal'], ['2', '2 - Estimativa'], ['3', '3 - Sociedade de Profissionais'], ['4', '4 - Cooperativa'], ['5', '5 - MEI'], ['6', '6 - ME EPP']];
  var VERSAO = [['4.00', '4.00 (vigente)'], ['3.10', '3.10 (legado)']];
  /* Venda-NF > Gerais (20 fotos) */
  var FINALIDADE = [['1', '1 - NF-e normal'], ['2', '2 - NF-e complementar'], ['3', '3 - NF-e de ajuste'], ['4', '4 - Devolução/Retorno'], ['5', '5 - Nota de crédito'], ['6', '6 - Nota de débito']];
  var TIPO_NOTA = [['1', '1 - Saída'], ['0', '0 - Entrada']];
  var NATUREZAS = ['VENDA', 'COMPRA', 'TRANSFERENCIA', 'DEVOLUCAO', 'COMPLEMENTAR', 'IMPORTACAO', 'CONSIGNACAO', 'REMESSA', 'REMESSA PARA CONSERTO', 'REMESSA EM GARANTIA', 'REMESSA BEM LOCAÇÃO', 'DEMONSTRAÇÃO', 'SIMPLES REMESSA', 'LOCAÇÃO EQUIPAMENTOS', 'RETORNO PARA CONSERTO', 'LOCAÇÃO BENS MÓVEIS'];
  var PAGAMENTOS = [['01', '01 - Dinheiro'], ['02', '02 - Cheque'], ['03', '03 - Cartão de Crédito'], ['04', '04 - Cartão de Débito'], ['05', '05 - Cartão Loja (Private Label)'], ['10', '10 - Vale Alimentação'], ['11', '11 - Vale Refeição'], ['12', '12 - Vale Presente'], ['13', '13 - Vale Combustível'], ['14', '14 - Duplicata Mercantil'], ['15', '15 - Boleto Bancário'], ['16', '16 - Depósito Bancário'], ['17', '17 - Pagamento Instantâneo (PIX) Dinâmico'], ['18', '18 - Transferência/Wallet'], ['19', '19 - Programa de Fidelidade/Cashback'], ['20', '20 - PIX Estático'], ['21', '21 - Crédito em Loja'], ['22', '22 - Falha de pagamento'], ['90', '90 - Sem Pagamento'], ['98', '98 - Regime Especial NFE'], ['99', '99 - Outros']];
  var LIST_SITUACAO = [['todos', 'Todos'], ['autorizada', 'Autorizadas'], ['corrigida', 'Corrigidas'], ['cancelada', 'Canceladas'], ['nao-gerada', 'Não Geradas']];
  var LIST_AMBIENTE = [['todos', 'Todos'], ['producao', 'Produção'], ['homologacao', 'Homologação']];
  var LIST_MODELO = [['todas', 'Todas'], ['55', 'NF-e'], ['65', 'NFC-e']];
  var LIST_TIPO_DATA = [['cadastro', 'Dt. Cadastro'], ['autorizacao', 'Dt. Autorização'], ['cancelamento', 'Dt. Cancelamento']];
  var LIST_FILTRO_COMBO = [['hoje-abertas', 'Hoje / Abertas'], ['hoje', 'Hoje'], ['num-nota', 'Núm. Nota'], ['canceladas', 'Canceladas'], ['cod-cliente', 'Cód. Cliente'], ['nome-cliente', 'Nome Cliente'], ['chave', 'Chave'], ['valor', 'Valor'], ['cod-venda', 'Cód. Venda']];
  var LIST_COLS = ['Data', 'Modelo', 'Tipo', 'Email', 'Núm. Nota', 'Natureza Op.', 'Cliente', 'Valor', 'Situação'];
  /* Manifestação (7 fotos) */
  var MANIF_TIPO_FILTRO = [['hoje', 'Cadastradas Hoje'], ['emitente', 'Nome do Emitente'], ['chave', 'Chave'], ['valor', 'Valor']];
  var MANIF_STATUS_NF = [['todas', 'Todas'], ['autorizada', 'Autorizadas'], ['cancelada', 'Canceladas'], ['denegada', 'Denegadas']];
  var MANIF_STATUS = [['todos', 'Todos'], ['confirmada', 'Operação Confirmada'], ['ciencia', 'Ciência da Operação'], ['desconhecida', 'Operação Desconhecida'], ['nao-realizada', 'Operação Não Realizada']];
  var EVENTOS_MANIF = [['ciencia', 'Ciência da Operação'], ['desconheco', 'Desconheço esta Operação'], ['nao-realizada', 'Operação Não Foi Realizada'], ['realizada', 'Operação Realizada com Sucesso']];
  var MANIF_COLS = ['Sel', 'Código', 'NSU', 'Nome/Razão Social', 'IE', 'CNPJ', 'Chave da Nota', 'Tipo de Valor', 'Valor', 'Série', 'Número DFe', 'Dh. Emissão', 'Status Nota', 'Status Manifestação', 'Protocolo Nota'];
  var MANIF_BUSCAS = [['ultimo', 'A partir do último registro consultado (retoma o NSU salvo)'], ['3meses', 'Últimos 3 meses (primeira carga)'], ['nsu', 'A partir de um NSU específico']];
  /* Perfil Tributário (11 fotos + foto do combo) — OS 5 PERFIS REAIS DA LOJA */
  var PERFIS_SEED = [
    { cod: '00001', descricao: 'VENDA DENTRO DO ESTADO', cfop: '5102' },
    { cod: '00002', descricao: 'VENDA FORA DO ESTADO', cfop: '6102' },
    { cod: '00003', descricao: 'DEV/REMESSA DE MERCADORIA P/ CONSERTO', cfop: '5915' },
    { cod: '00005', descricao: 'RETORNO DE CONSERTO', cfop: '5916' },
    { cod: '00004', descricao: 'TROCA DE MERCADORIA', cfop: '6949' }];
  var CSOSN_LISTA = [['101', '101 - Tributada pelo Simples com permissão de crédito'], ['102', '102 - Tributada pelo Simples sem permissão de crédito'], ['103', '103 - Isenção do ICMS no Simples para faixa de receita'], ['201', '201 - Tributada pelo Simples com permissão de crédito e ST'], ['202', '202 - Tributada pelo Simples sem permissão de crédito e ST'], ['203', '203 - Isenção do ICMS no Simples com ST'], ['300', '300 - Imune'], ['400', '400 - Não tributada pelo Simples'], ['500', '500 - ICMS cobrado anteriormente por ST'], ['900', '900 - Outros']];
  var PISCOFINS_CST = [['01', '01 - Operação Tributável (alíquota normal)'], ['02', '02 - Operação Tributável (alíquota diferenciada)'], ['03', '03 - Operação Tributável (alíq. unidade por produto)'], ['04', '04 - Operação Tributável monofásica (alíquota zero)'], ['05', '05 - Operação Tributável por Substituição Tributária'], ['06', '06 - Operação Tributável (alíquota zero)'], ['07', '07 - Operação Isenta da Contribuição'], ['08', '08 - Operação Sem Incidência da Contribuição'], ['09', '09 - Operação com Suspensão da Contribuição'], ['49', '49 - Outras Operações de Saída']];
  var IPI_CST = [['50', '50 - Saída Tributada'], ['51', '51 - Saída Tributável com Alíquota Zero'], ['52', '52 - Saída Isenta'], ['53', '53 - Saída Não-Tributada'], ['54', '54 - Saída Imune'], ['55', '55 - Saída com Suspensão'], ['56', '56 - Saída com Suspensão (couro)'], ['99', '99 - Outras Saídas']];
  var REFORMA_CST = [['000', '000 - Tributação integral'], ['200', '200 - Alíquota reduzida'], ['410', '410 - Imunidade e não incidência'], ['510', '510 - Diferimento'], ['515', '515 - Diferimento com redução de alíquota'], ['550', '550 - Suspensão'], ['800', '800 - Transferência de crédito'], ['810', '810 - Ajustes'], ['811', '811 - Ajustes (anexo)'], ['830', '830 - Exclusão da base de cálculo']];
  var REFORMA_CLASSIF = [['000001', '000001 - Situações tributadas integralmente pelo IBS e CBS'], ['000003', '000003 - Regime automotivo'], ['000004', '000004 - Regime automotivo (variação)']];
  /* NFCe (3 fotos) */
  var VEQR = [['veqr000', 'veqr000'], ['veqr100', 'veqr100'], ['veqr200', 'veqr200 (padrão v2 vigente)'], ['veqr300', 'veqr300']];
  var IMPRESSORA_TIPO = [['0', '0 - Mini impressora (térmica)'], ['1', '1 - Laser/Tinta (Spooler)']];
  var FCP_UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  var VENDA_NF_ABAS = ['Gerais', 'Destinatário', 'Itens da Nota', 'Informações Adicionais', 'Transporte', 'Correções', 'Reforma Tributária', 'Referenciar', 'Log'];
  var CONFIG_ABAS = ['Geral', 'Impressão', 'NFCe', 'Tributação', 'Nuvem', 'Outras', 'Mensagens', 'FCP', 'Autorizações', 'Reforma'];

  function fxCfgPadrao() {
    return {
      geral: { serie: '1', modelo: '55', processamento: '1', procEmissao: '0', danfe: '1', frete: '9', tpEmis: '1', tpOp: '0', versao: '4.00', crt: '1', regEsp: '1' },
      outras: { agruparItens: false, margemSup: '', margemInf: '', margemEsq: '', margemDir: '', fuso: '-03:00', caminhoSec: '', emailEscritorio: '' },
      trib: { perfilDentro: '00001', perfilFora: '00002', mostrarTribItens: true, formatoMsg: 'junto' },
      msg: { infoContribuinte: '', textoCartaCorrecao: '', justificativaContingencia: '' },
      cert: { a3Serial: '' },
      fcp: { padrao: 2, ufs: {} },
      nfce: { qrcodeInfSup: true, gerarAoFinalizar: false, logoDanfe: true, logoSobreDados: false, imprimirSemPrevia: false, qrLateral: true, impressoraTipo: '1', impressora: '', veqr: 'veqr200' },
      autoriz: { cnpjs: '' },
      reforma: { ativa: true, intermediador: '0' },
      fusoOk: true
    };
  }
  function fxItemVazio(n) {
    return { n: n || 1, gtin: '', cprod: '', descricao: '', ncm: '', cest: '', cfop: '5102', csosn: '102', qtd: 1, un: 'UN', vunit: 0, vtotal: 0, tipo: 'PRODUTO', desconto: 0, bc: 0, perfilCod: '', trib: { icmsBase: 0, icmsValor: 0, stBase: 0, stPerc: 0, stValor: 0, ipiCst: '99', ipiPerc: 0, ipiValor: 0, pisCst: '07', pisAli: 0, cofinsCst: '07', cofinsAli: 0, beneficio: '', icmsDeson: 0, fcpPerc: 0, fcpValor: 0, efetBase: 0, efetValor: 0, pedido: '', pedidoItem: '', refCst: '000', refClassif: '000001', refIbsUfPerc: 0.1, refIbsMunPerc: 0, refCbsPerc: 0.9, imp: { di: '', dtReg: '', codExp: '', via: '', afrmm: 0, forma: '', desembData: '', desembUf: '', desembLocal: '', iof: 0, despAduan: 0, ii: 0, pais: '1058 BRASIL' } } };
  }
  function fxPagamentoVazio() { return { forma: '01', valor: 0 }; }
  function fxNotaVazia(numero, usuario) {
    return {
      id: 'fx' + Date.now().toString(36), cod: '', numero: numero || '', modelo: '55', finalidade: '1', tipo: '1', natureza: 'VENDA', serie: '1',
      dhCadastro: new Date().toISOString(), dhEmissao: '', dhSaida: '', usuario: usuario || '',
      dest: { pesquisarPor: 'Cliente', refId: '', nome: '', doc: '', ie: '', endereco: '', cidade: '', uf: '', enderecoDiferente: false, entrega: '' },
      itens: [], pagamentos: [], duplicatas: [],
      totais: { despAcess: 0, produtos: 0, servicos: 0, ipi: 0, icmsST: 0, frete: 0, seletivo: 0, ibs: 0, cbs: 0, descontos: 0, total: 0, tribAprox: 0 },
      frete: { modalidade: '9', transportadora: { doc: '', nome: '', ie: '', endereco: '', cidade: '', uf: '', email: '' }, veiculo: { placa: '', uf: '', rntc: '' }, volumes: [] },
      infos: { preConfig: '', complementares: '', geradasAuto: '', empenho: '', pedido: '', contrato: '' },
      refs: [], reforma: { cst: '000', classif: '000001', base: 0 },
      creditoIcms: 0, status: 'Não Gerada', ambiente: '', emailMarcado: false, log: [], criadoEm: new Date().toISOString()
    };
  }
  function fxIbsCbs(base, aliUf, aliMun, aliCbs) {
    var b = Number(base) || 0;
    var r = function (v) { return Math.round(v * 100) / 100; };
    return { ibsUf: r(b * (Number(aliUf) || 0) / 100), ibsMun: r(b * (Number(aliMun) || 0) / 100), cbs: r(b * (Number(aliCbs) || 0) / 100) };
  }
  function fxBRL(v) { return (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fxEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fxDig(s) { return String(s || '').replace(/\D+/g, ''); }
  function fxDataBR(iso) { if (!iso) return ''; var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('pt-BR'); }

  G.FX614_PURE = {
    DANFE_OPCOES: DANFE_OPCOES, FRETE_OPCOES: FRETE_OPCOES, MODELO_OPCOES: MODELO_OPCOES, PROCESSAMENTO: PROCESSAMENTO,
    PROC_EMISSAO: PROC_EMISSAO, TP_EMISSAO: TP_EMISSAO, TP_OPERACAO: TP_OPERACAO, CRT_OPCOES: CRT_OPCOES, REG_ESP: REG_ESP, VERSAO: VERSAO,
    FINALIDADE: FINALIDADE, TIPO_NOTA: TIPO_NOTA, NATUREZAS: NATUREZAS, PAGAMENTOS: PAGAMENTOS,
    LIST_SITUACAO: LIST_SITUACAO, LIST_AMBIENTE: LIST_AMBIENTE, LIST_MODELO: LIST_MODELO, LIST_TIPO_DATA: LIST_TIPO_DATA, LIST_FILTRO_COMBO: LIST_FILTRO_COMBO, LIST_COLS: LIST_COLS,
    MANIF_TIPO_FILTRO: MANIF_TIPO_FILTRO, MANIF_STATUS_NF: MANIF_STATUS_NF, MANIF_STATUS: MANIF_STATUS, EVENTOS_MANIF: EVENTOS_MANIF, MANIF_COLS: MANIF_COLS, MANIF_BUSCAS: MANIF_BUSCAS,
    PERFIS_SEED: PERFIS_SEED, CSOSN_LISTA: CSOSN_LISTA, PISCOFINS_CST: PISCOFINS_CST, IPI_CST: IPI_CST, REFORMA_CST: REFORMA_CST, REFORMA_CLASSIF: REFORMA_CLASSIF,
    VEQR: VEQR, IMPRESSORA_TIPO: IMPRESSORA_TIPO, FCP_UFS: FCP_UFS, VENDA_NF_ABAS: VENDA_NF_ABAS, CONFIG_ABAS: CONFIG_ABAS,
    cfgPadrao: fxCfgPadrao, itemVazio: fxItemVazio, pagamentoVazio: fxPagamentoVazio, notaVazia: fxNotaVazia, ibsCbs: fxIbsCbs, brl: fxBRL, esc: fxEsc, dig: fxDig, dataBR: fxDataBR
  };
  G.__v6014fxcInfo = 'FXCatalogo pronto';
})();

/* ══════════════ PARTE 2 — infraestrutura (db, css, campos, popup do sistema) ══════════════ */
(function () {
  var G = typeof window !== 'undefined' ? window : globalThis;
  if (G.__v6014fxc2) return;
  G.__v6014fxc2 = true;
  var P = G.FX614_PURE;

  function fxDb() { return (typeof db !== 'undefined' && db) ? db : (G.db || { config: {} }); }
  function fxSave() { try { if (typeof saveDB === 'function') saveDB(); } catch (e) { } }
  function fxSess() { try { return typeof getSession === 'function' ? getSession() : null; } catch (e) { return null; } }
  function fxLog(acao, detalhe) {
    try {
      var d = fxDb(); d.config = d.config || {}; d.config.fxLogFiscal = d.config.fxLogFiscal || [];
      d.config.fxLogFiscal.push({ acao: acao, detalhe: detalhe || '', em: new Date().toISOString(), usuario: (fxSess() || {}).usuario || '' });
      if (d.config.fxLogFiscal.length > 400) d.config.fxLogFiscal = d.config.fxLogFiscal.slice(-400);
    } catch (e) { }
  }
  function fxCfg() {
    var d = fxDb(); d.config = d.config || {};
    if (!d.config.nfCfg) d.config.nfCfg = P.cfgPadrao();
    else { var p0 = P.cfgPadrao(); for (var k in p0) { if (!d.config.nfCfg[k]) d.config.nfCfg[k] = p0[k]; else if (typeof p0[k] === 'object') for (var k2 in p0[k]) if (d.config.nfCfg[k][k2] === undefined) d.config.nfCfg[k][k2] = p0[k][k2]; } }
    return d.config.nfCfg;
  }
  function fxPerfis() {
    var d = fxDb();
    if (!d.perfisNf) {
      d.perfisNf = P.PERFIS_SEED.map(function (s) {
        return { cod: s.cod, descricao: s.descricao, tipo: 'ICMS', cfop: s.cfop, csosn: '102', pisCst: '07', pisAli: 0, cofinsCst: '07', cofinsAli: 0, ipiCst: '99', ipiAli: 0, refCst: '000', refClassif: '000001', ibsUf: 0.1, ibsMun: 0, cbs: 0.9, seed: true };
      });
      fxSave();
      fxLog('perfis-seed', '5 perfis reais da loja semeados (uma vez)');
    }
    return d.perfisNf;
  }
  function fxNotas() { var d = fxDb(); d.notasNf = d.notasNf || []; return d.notasNf; }
  function fxPlaca() {
    var amb = 'homologacao';
    try { amb = (G.NFG_PURE && G.NFG_PURE.nfgAmbiente(fxDb())) || 'homologacao'; } catch (e) { }
    var prod = amb === 'producao';
    return '<div class="fx-placa" style="background:' + (prod ? '#14532d' : '#7f1d1d') + '">' +
      (prod ? '✅ PRODUÇÃO — a nota gerada aqui VALE DE VERDADE' : '🏛️ HOMOLOGAÇÃO — MODO TESTE, SEM VALOR FISCAL') + '</div>';
  }
  function fxPode() { try { return G.usuarioPodeEmitirNfe && G.usuarioPodeEmitirNfe(); } catch (e) { return false; } }

  /* popup SEMPRE do sistema: usa o modal-root do app */
  function fxConfirm(titulo, texto, onSim, labelSim) {
    var root = document.getElementById('modal-root'), box = document.getElementById('modal-box'),
      body = document.getElementById('modal-body'), foot = document.getElementById('modal-footer'),
      ttl = document.getElementById('modal-title');
    if (!root || !body) { if (onSim) onSim(); return; }
    ttl.textContent = titulo;
    body.innerHTML = '<div style="font-size:13.5px;color:#334155;line-height:1.65">' + texto + '</div>';
    foot.innerHTML = '';
    var nao = document.createElement('button'); nao.className = 'h-10 px-5 rounded-xl bg-slate-100 font-bold text-[13px]'; nao.textContent = 'Cancelar';
    nao.onclick = function () { if (typeof closeModal === 'function') closeModal(); };
    var sim = document.createElement('button'); sim.className = 'h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold text-[13px]'; sim.textContent = labelSim || 'Confirmar';
    sim.onclick = function () { if (typeof closeModal === 'function') closeModal(); if (onSim) onSim(); };
    foot.appendChild(nao); foot.appendChild(sim);
    root.classList.remove('hidden');
  }
  function fxAlert(titulo, texto) {
    var root = document.getElementById('modal-root'), body = document.getElementById('modal-body'),
      foot = document.getElementById('modal-footer'), ttl = document.getElementById('modal-title');
    if (!root || !body) return;
    ttl.textContent = titulo;
    body.innerHTML = '<div style="font-size:13.5px;color:#334155;line-height:1.65">' + texto + '</div>';
    foot.innerHTML = '<button class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold text-[13px]" onclick="closeModal()">Entendi</button>';
    root.classList.remove('hidden');
  }
  function fxToast(m, t) { try { if (typeof toast === 'function') toast(m, t || "success"); } catch (e) { } }

  /* campos com data-fx (coleta genérica DOM→objeto) */
  function fxInp(path, label, extra) {
    return '<label class="fx-lb">' + label + '<input class="fx-in" data-fx="' + path + '" ' + (extra || '') + '></label>';
  }
  function fxSel(path, label, opcoes, extra) {
    var o = opcoes.map(function (p) { return '<option value="' + p[0] + '">' + P.esc(p[1]) + '</option>'; }).join('');
    return '<label class="fx-lb">' + label + '<select class="fx-in" data-fx="' + path + '" ' + (extra || '') + '>' + o + '</select></label>';
  }
  function fxChk(path, label, extra) {
    return '<label class="fx-chk"><input type="checkbox" data-fx="' + path + '" ' + (extra || '') + '><span>' + label + '</span></label>';
  }
  function fxValo(obj, path) {
    var cur = obj; String(path).split('.').forEach(function (k) { cur = (cur == null ? undefined : cur[k]); });
    return cur === undefined || cur === null ? '' : cur;
  }
  function fxAplica(obj) {
    document.querySelectorAll('#fx-root [data-fx]').forEach(function (el) {
      var path = el.getAttribute('data-fx'), cur = obj, parts = path.split('.');
      for (var i = 0; i < parts.length - 1; i++) { if (cur[parts[i]] == null) cur[parts[i]] = {}; cur = cur[parts[i]]; }
      var last = parts[parts.length - 1];
      if (el.type === 'checkbox') cur[last] = !!el.checked; else if (el.type === 'number') cur[last] = el.value; else cur[last] = el.value;
    });
  }
  function fxPinta(obj) {
    document.querySelectorAll('#fx-root [data-fx]').forEach(function (el) {
      var v = fxValo(obj, el.getAttribute('data-fx'));
      if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
    });
  }

  var CSS =
    '.fx-root-wrap .fx-placa{padding:9px 13px;border-radius:12px;font-weight:800;font-size:12.5px;color:#fff;margin-bottom:10px}' +
    '.fx-root-wrap .fx-barra{display:flex;flex-wrap:wrap;gap:8px;align-items:end;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:10px;margin-bottom:10px}' +
    '.fx-root-wrap .fx-lb{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:#64748b;display:flex;flex-direction:column;gap:3px}' +
    '.fx-root-wrap .fx-in{height:32px;border:1px solid #cbd5e1;border-radius:8px;padding:0 9px;font-size:12.5px;background:#fff;min-width:110px}' +
    '.fx-root-wrap .fx-chk{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#334155;height:32px}' +
    '.fx-root-wrap .fx-btn{height:34px;padding:0 13px;border-radius:9px;border:1px solid #d9e3ef;background:#fff;color:#334155;font-size:12px;font-weight:750;display:inline-flex;align-items:center;gap:6px;cursor:pointer;transition:.14s}' +
    '.fx-root-wrap .fx-btn:hover{border-color:#0a1e8a;color:#0a1e8a;transform:translateY(-1px)}' +
    '.fx-root-wrap .fx-btn.pri{background:#0a1e8a;border-color:#0a1e8a;color:#fff}' +
    '.fx-root-wrap .fx-btn.dan{border-color:#fecaca;color:#991b1b}.fx-root-wrap .fx-btn.dan:hover{background:#fef2f2}' +
    '.fx-root-wrap .fx-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}' +
    '.fx-root-wrap table.fx-tb{width:100%;border-collapse:separate;border-spacing:0;font-size:12px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}' +
    '.fx-root-wrap .fx-tb th{position:sticky;top:0;background:#f8fafc;color:#64748b;text-transform:uppercase;font-size:10px;letter-spacing:.04em;text-align:left;padding:8px;border-bottom:1px solid #e2e8f0;z-index:1}' +
    '.fx-root-wrap .fx-tb td{padding:7px 8px;border-bottom:1px solid #eef2f7;vertical-align:middle}' +
    '.fx-root-wrap .fx-tb tbody tr{transition:.12s;cursor:pointer}.fx-root-wrap .fx-tb tbody tr:hover{background:#f5f9ff}.fx-root-wrap .fx-tb tbody tr.fx-sel{background:#dbeafe}' +
    '.fx-root-wrap .fx-tabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:2px solid #e2e8f0;margin-bottom:10px;padding:0 2px}' +
    '.fx-root-wrap .fx-tab{height:32px;padding:0 13px;border-radius:9px 9px 0 0;font-size:12px;font-weight:750;color:#475569;display:flex;align-items:center;gap:6px;cursor:pointer;background:transparent;border:1px solid transparent;border-bottom:none}' +
    '.fx-root-wrap .fx-tab.on{background:#0a1e8a;color:#fff}' +
    '.fx-root-wrap .fx-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;margin-bottom:10px}' +
    '.fx-root-wrap .fx-grid{display:grid;gap:8px}.fx-g2{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}.fx-g3{grid-template-columns:repeat(auto-fit,minmax(130px,1fr))}.fx-g4{grid-template-columns:repeat(auto-fit,minmax(100px,1fr))}' +
    '.fx-root-wrap .fx-status{font-size:26px;font-weight:900;letter-spacing:-.02em}' +
    '.fx-root-wrap .fx-cofre{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}' +
    '.fx-root-wrap .fx-cofre>div{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:10px;text-align:center}' +
    '.fx-root-wrap .fx-cofre b{display:block;font-size:17px;color:#166534}' +
    '.fx-root-wrap .fx-mini{font-size:11px;color:#64748b}' +
    '.fx-root-wrap .fx-selmark{width:14px;height:14px;border:2px solid #94a3b8;border-radius:4px;display:inline-block;vertical-align:middle}' +
    '.fx-root-wrap tr.fx-sel .fx-selmark{background:#0a1e8a;border-color:#0a1e8a;box-shadow:inset 0 0 0 2px #fff}' +
    '.fx-root-wrap textarea.fx-in{height:auto;min-height:70px;padding:8px 9px;width:100%}';
  function fxCss() {
    if (typeof document === 'undefined' || document.getElementById('fx614-css')) return;
    var st = document.createElement('style'); st.id = 'fx614-css'; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  G.__v6014fxInfra = { db: fxDb, save: fxSave, sess: fxSess, log: fxLog, cfg: fxCfg, perfis: fxPerfis, notas: fxNotas, placa: fxPlaca, pode: fxPode, confirm: fxConfirm, alert: fxAlert, toast2: fxToast, inp: fxInp, sel: fxSel, chk: fxChk, valo: fxValo, aplica: fxAplica, pinta: fxPinta, css: fxCss };
})();

/* ══════════════ PARTE 3 — CENTRAL: LISTAGEM DE NOTAS (8 fotos) + editor VENDA-NF (20 fotos) ══════════════ */
(function () {
  var G = typeof window !== 'undefined' ? window : globalThis;
  if (G.__v6014fxc3) return;
  G.__v6014fxc3 = true;
  var P = G.FX614_PURE, I = G.__v6014fxInfra;

  function fxEstadoList() {
    if (!G.__fxList) G.__fxList = { ambiente: 'todos', situacao: 'todos', modelo: 'todas', ini: '', fim: '', tipoData: 'cadastro', agrupar: false, combo: 'hoje-abertas', txt: '', sel: null };
    return G.__fxList;
  }
  function fxLinhasBase() {
    var d = I.db(), linhas = [];
    (d.config && d.config.nfRegistro || []).forEach(function (r, i) {
      linhas.push({ fonte: 'reg', id: 'reg' + i, data: r.autorizadoEm || r.criadoEm || r.atualizadoEm || '', modelo: r.modelo || '55', tipo: 'Saída', email: !!r.emailMarcado, numero: r.numero || r.nNF || '', natureza: r.natureza || r.natOp || 'VENDA', cliente: r.cliente || r.destNome || '', valor: Number(r.valor || r.vNF || 0), situacao: r.status === 'cancelada' ? 'Cancelada' : (r.corrigida ? 'Corrigida' : 'Autorizada'), ambiente: r.ambiente || 'homologacao', ref: r });
    });
    I.notas().forEach(function (n) {
      linhas.push({ fonte: 'rasc', id: n.id, data: n.dhCadastro, modelo: n.modelo, tipo: n.tipo === '0' ? 'Entrada' : 'Saída', email: !!n.emailMarcado, numero: n.numero, natureza: n.natureza, cliente: (n.dest && n.dest.nome) || '', valor: (n.totais && n.totais.total) || 0, situacao: n.status || 'Não Gerada', ambiente: n.ambiente || (I.cfg() && ''), ref: n });
    });
    linhas.sort(function (a, b) { return String(b.data).localeCompare(String(a.data)); });
    return linhas;
  }
  function fxAplicarFiltros(linhas, st) {
    var hoje = new Date().toISOString().slice(0, 10);
    return linhas.filter(function (l) {
      if (st.ambiente !== 'todos' && l.ambiente !== st.ambiente) return false;
      if (st.situacao !== 'todos') {
        var s = l.situacao.toLowerCase();
        if (st.situacao === 'nao-gerada' && s.indexOf('não gerada') < 0) return false;
        if (st.situacao === 'autorizada' && s.indexOf('autorizada') < 0) return false;
        if (st.situacao === 'corrigida' && s.indexOf('corrigida') < 0) return false;
        if (st.situacao === 'cancelada' && s.indexOf('cancelada') < 0) return false;
      }
      if (st.modelo !== 'todas' && String(l.modelo) !== st.modelo) return false;
      var dia = String(l.data).slice(0, 10);
      if (st.ini && dia < st.ini) return false;
      if (st.fim && dia > st.fim) return false;
      var t = String(st.txt || '').toLowerCase();
      if (t) {
        switch (st.combo) {
          case 'hoje': return dia === hoje;
          case 'hoje-abertas': return (dia === hoje) || (l.situacao === 'Não Gerada');
          case 'num-nota': return String(l.numero).indexOf(t) >= 0;
          case 'canceladas': return l.situacao === 'Cancelada';
          case 'cod-cliente': return String((l.ref.dest && l.ref.dest.refId) || '').indexOf(t) >= 0;
          case 'nome-cliente': return String(l.cliente).toLowerCase().indexOf(t) >= 0;
          case 'chave': return String((l.ref && l.ref.chave) || '').indexOf(t) >= 0;
          case 'valor': return String(l.valor).indexOf(t) >= 0;
          case 'cod-venda': return String((l.ref && l.ref.vendaId) || '').indexOf(t) >= 0;
        }
      } else if (st.combo === 'hoje-abertas') return (dia === hoje) || (l.situacao === 'Não Gerada');
      return true;
    });
  }

  function fxRenderListagem() {
    var st = fxEstadoList();
    var linhas = fxAplicarFiltros(fxLinhasBase(), st);
    var h = I.placa();
    h += '<div class="fx-barra">' +
      I.sel('lst.ambiente', 'Ambiente', P.LIST_AMBIENTE) +
      I.sel('lst.situacao', 'Situação', P.LIST_SITUACAO) +
      I.sel('lst.modelo', 'Modelo', P.LIST_MODELO) +
      I.inp('lst.ini', 'Período de', 'type="date"') +
      I.inp('lst.fim', 'até', 'type="date"') +
      I.sel('lst.tipoData', 'Tipo de data', P.LIST_TIPO_DATA) +
      I.chk('lst.agrupar', 'Agrupar Filtros') +
      '<button class="fx-btn pri" onclick="fxAcao(\'lst-pesquisar\')"><i class="ph ph-magnifying-glass"></i>Pesquisar</button>' +
      '<button class="fx-btn" onclick="fxAcao(\'lst-imprimir\')"><i class="ph ph-printer"></i>Imprimir</button></div>';
    h += '<div class="fx-barra">' +
      I.sel('lst.combo', 'Filtro', P.LIST_FILTRO_COMBO) +
      I.inp('lst.txt', 'Valor do filtro', 'style="min-width:220px" placeholder="digite aqui o que procurar"') +
      '<span class="fx-mini" style="align-self:center">' + linhas.length + ' nota(s) no filtro</span>' +
      '<span style="flex:1"></span>' +
      '<button class="fx-btn pri" onclick="fxAcao(\'nf-novo\')"><i class="ph ph-plus"></i>Novo</button>' +
      '<button class="fx-btn" id="fx-bt-alt" onclick="fxAcao(\'nf-alterar\')" disabled><i class="ph ph-pencil"></i>Alterar</button>' +
      '<button class="fx-btn dan" id="fx-bt-exc" onclick="fxAcao(\'nf-excluir\')" disabled><i class="ph ph-trash"></i>Excluir</button>' +
      '<button class="fx-btn" id="fx-bt-clo" onclick="fxAcao(\'nf-clonar\')" disabled><i class="ph ph-copy"></i>Clonar</button></div>';
    h += '<div style="overflow:auto;max-height:calc(100vh - 340px)"><table class="fx-tb"><thead><tr>' +
      P.LIST_COLS.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>';
    if (!linhas.length) h += '<tr><td colspan="' + P.LIST_COLS.length + '" style="text-align:center;color:#94a3b8;padding:22px">Nenhuma nota no filtro — clique em <b>Novo</b> para abrir a nota (ou ajuste o período/situação).</td></tr>';
    linhas.forEach(function (l) {
      var sel = st.sel === l.id ? ' class="fx-sel"' : '';
      h += '<tr' + sel + ' onclick="fxAcao(\'lst-sel\',\'' + l.id + '\')">' +
        '<td>' + P.dataBR(l.data) + '</td><td>' + P.esc(l.modelo) + '</td><td>' + l.tipo + '</td><td>' + (l.email ? '✉' : '') + '</td>' +
        '<td><b>' + P.esc(l.numero) + '</b></td><td>' + P.esc(l.natureza) + '</td><td>' + P.esc(l.cliente) + '</td>' +
        '<td style="text-align:right">' + P.brl(l.valor) + '</td>' +
        '<td><b style="color:' + (l.situacao === 'Autorizada' ? '#166534' : (l.situacao === 'Cancelada' ? '#991b1b' : '#92400e')) + '">' + l.situacao + '</b></td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<p class="fx-mini">Nota já <b>autorizada não pode ser alterada nem excluída</b> (regra fiscal) — correção = CC-e, ou cancelamento. Alterar/Excluir valem para notas <b>Não Geradas</b>. Clonar cria uma Não Gerada com os mesmos dados.</p>';
    return h;
  }

  /* ── VENDA-NF (editor) ── */
  function fxNotaEdicao() {
    var d = I.db();
    if (!G.__fxEd) return null;
    return I.notas().find(function (n) { return n.id === G.__fxEd.id; }) || null;
  }
  function fxAbaVendaNf(n) {
    var aba = (G.__fxEd && G.__fxEd.aba) || 'Gerais';
    var h = '<div class="fx-tabs">' + P.VENDA_NF_ABAS.map(function (a) {
      return '<div class="fx-tab' + (a === aba ? ' on' : '') + '" onclick="fxAcao(\'nf-aba\',\'' + a.replace(/'/g, '') + '\')">' + a + '</div>';
    }).join('') + '</div>';
    return h;
  }
  function fxTotaisAuto(n) {
    var prod = 0, serv = 0, desc = 0, ibsUf = 0, ibsMun = 0, cbs = 0;
    n.itens.forEach(function (it) {
      var t = (Number(it.qtd) || 0) * (Number(it.vunit) || 0) - (Number(it.desconto) || 0);
      it.vtotal = Math.max(0, Math.round(t * 100) / 100);
      if (it.tipo === 'SERVIÇO') serv += it.vtotal; else prod += it.vtotal;
      desc += Number(it.desconto) || 0;
      var c = P.ibsCbs(it.vtotal, it.trib.refIbsUfPerc, it.trib.refIbsMunPerc, it.trib.refCbsPerc);
      ibsUf += c.ibsUf; ibsMun += c.ibsMun; cbs += c.cbs;
    });
    var t = n.totais;
    t.produtos = Math.round(prod * 100) / 100; t.servicos = Math.round(serv * 100) / 100; t.descontos = Math.round(desc * 100) / 100;
    t.ibs = Math.round((ibsUf + ibsMun) * 100) / 100; t.cbs = Math.round(cbs * 100) / 100;
    t.total = Math.round((t.produtos + t.servicos + (Number(t.despAcess) || 0) + (Number(t.frete) || 0) + (Number(t.seletivo) || 0) + (Number(t.ipi) || 0) + (Number(t.icmsST) || 0) - t.descontos) * 100) / 100;
    return t;
  }
  function fxRenderGerais(n) {
    var t = fxTotaisAuto(n);
    var h = '<div class="fx-card"><div class="fx-grid fx-g3">' +
      I.sel('nota.modelo', 'Modelo', P.MODELO_OPCOES) +
      I.sel('nota.finalidade', 'Finalidade', P.FINALIDADE) +
      I.sel('nota.tipo', 'Tipo', P.TIPO_NOTA) +
      I.sel('nota.natureza', 'Natureza da Operação', P.NATUREZAS.map(function (x) { return [x, x]; })) +
      I.inp('nota.serie', 'Série') + I.inp('nota.numero', 'Número') +
      I.inp('nota.creditoIcms', 'Crédito ICMS (R$)', 'type="number" step="0.01"') +
      I.inp('nota.totais.tribAprox', 'Total Aprox. Tributos R$ (IBPT)', 'type="number" step="0.01"') +
      '</div>' +
      '<p class="fx-mini">Painel de impostos por item (PIS/COFINS/ICMS) é calculado nos Itens; o Total Aprox. sai nas Informações Adicionais se a config estiver ligada (aba Tributação das Configurações).</p></div>';
    h += '<div class="fx-card"><h4 style="margin:0 0 8px">💳 Pagamentos</h4><div id="fx-pags">';
    h += '<div class="fx-grid" style="grid-template-columns:230px 130px 40px;gap:6px;align-items:center">';
    n.pagamentos.forEach(function (p, i) {
      h += '<select class="fx-in" onchange="fxAcao(\'nf-pag-edit\',\'' + i + '\', this.value)">' + P.PAGAMENTOS.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === p.forma ? ' selected' : '') + '>' + P.esc(o[1]) + '</option>'; }).join('') + '</select>' +
        '<input class="fx-in" type="number" step="0.01" value="' + (p.valor || 0) + '" onchange="fxAcao(\'nf-pag-val\',\'' + i + '\', this.value)">' +
        '<button class="fx-btn dan" onclick="fxAcao(\'nf-pag-del\',\'' + i + '\')">✕</button>';
    });
    h += '</div><button class="fx-btn" style="margin-top:8px" onclick="fxAcao(\'nf-pag-add\')"><i class="ph ph-plus"></i>Adicionar pagamento</button></div>';
    h += '<h4 style="margin:10px 0 8px">📑 Duplicatas</h4><div class="fx-grid" style="grid-template-columns:130px 150px 40px;gap:6px;align-items:center">';
    n.duplicatas.forEach(function (du, i) {
      h += '<input class="fx-in" type="number" step="0.01" value="' + (du.valor || 0) + '" onchange="fxAcao(\'nf-dup-val\',\'' + i + '\', this.value)">' +
        '<input class="fx-in" type="date" value="' + (du.vencimento || '') + '" onchange="fxAcao(\'nf-dup-ven\',\'' + i + '\', this.value)">' +
        '<button class="fx-btn dan" onclick="fxAcao(\'nf-dup-del\',\'' + i + '\')">✕</button>';
    });
    h += '</div><button class="fx-btn" style="margin-top:8px" onclick="fxAcao(\'nf-dup-add\')"><i class="ph ph-plus"></i>Adicionar duplicata</button></div>';
    h += '<div class="fx-card"><h4 style="margin:0 0 8px">🧮 Totais</h4><div class="fx-grid fx-g4">' +
      I.inp('nota.totais.despAcess', 'Desp. Acessórias', 'type="number" step="0.01"') +
      '<label class="fx-lb">Produtos<input class="fx-in" value="' + t.produtos + '" readonly style="background:#f8fafc"></label>' +
      '<label class="fx-lb">Serviços<input class="fx-in" value="' + t.servicos + '" readonly style="background:#f8fafc"></label>' +
      I.inp('nota.totais.ipi', 'IPI', 'type="number" step="0.01"') +
      I.inp('nota.totais.icmsST', 'ICMS ST', 'type="number" step="0.01"') +
      I.inp('nota.totais.frete', 'Frete', 'type="number" step="0.01"') +
      I.inp('nota.totais.seletivo', 'Imposto Seletivo', 'type="number" step="0.01"') +
      '<label class="fx-lb">IBS (Reforma)<input class="fx-in" value="' + t.ibs + '" readonly style="background:#f0fdf4"></label>' +
      '<label class="fx-lb">CBS (Reforma)<input class="fx-in" value="' + t.cbs + '" readonly style="background:#f0fdf4"></label>' +
      '<label class="fx-lb">Descontos<input class="fx-in" value="' + t.descontos + '" readonly style="background:#f8fafc"></label>' +
      '</div><div style="text-align:right;margin-top:8px;font-size:20px;font-weight:900;color:#0a1e8a">Total: R$ ' + P.brl(t.total) + '</div></div>';
    if (n.autorizacao) h += '<div class="fx-card fx-mini">Autorização: Dh ' + P.esc(n.autorizacao.dh || '') + ' · Protocolo ' + P.esc(n.autorizacao.protocolo || '') + '</div>';
    return h;
  }
  function fxRenderDestinatario(n) {
    var d = I.db();
    var origens = P.esc((d.clientes || []).length) + ' clientes e ' + ((d.fornecedores || []).length) + ' fornecedores no cadastro';
    var h = '<div class="fx-card"><div class="fx-grid fx-g3">' +
      I.sel('nota.dest.pesquisarPor', 'Pesquisar por', [['Cliente', 'Cliente'], ['Fornecedor', 'Fornecedor']]) +
      I.inp('nota.dest.refId', 'Cadastro (id)') +
      '<label class="fx-lb">Escolher do cadastro<select class="fx-in" id="fx-dest-pick"><option value="">— selecionar —</option>' +
      (d.clientes || []).map(function (c) { return '<option value="cli:' + P.esc(c.id) + '">👤 ' + P.esc((c.id || '') + ' · ' + (c.nome || c.razao || '')) + '</option>'; }).join('') +
      (d.fornecedores || []).map(function (f) { return '<option value="for:' + P.esc(f.id) + '">🏭 ' + P.esc((f.id || '') + ' · ' + (f.nome || f.razao || '')) + '</option>'; }).join('') +
      '</select></label>' +
      '<div class="fx-lb"> <button class="fx-btn" style="margin-top:16px" onclick="fxAcao(\'nf-dest-puxar\')"><i class="ph ph-download"></i>Puxar dados do cadastro</button></div>' +
      '</div><p class="fx-mini">Origem: ' + origens + '. Puxa do cadastro <b>sem redigitar</b>; os campos abaixo ainda podem ser ajustados só nesta nota.</p>' +
      '<div class="fx-grid fx-g3">' +
      I.inp('nota.dest.nome', 'Nome / Razão Social', 'style="min-width:260px"') +
      I.inp('nota.dest.doc', 'CNPJ/CPF') +
      I.inp('nota.dest.ie', 'IE') +
      I.inp('nota.dest.endereco', 'Endereço', 'style="min-width:260px"') +
      I.inp('nota.dest.cidade', 'Cidade') +
      I.inp('nota.dest.uf', 'UF', 'maxlength="2" style="width:60px"') +
      '</div>' +
      I.chk('nota.dest.enderecoDiferente', 'Endereço de Entrega é Diferente do Destinatário') +
      '<label class="fx-lb" style="margin-top:6px">Endereço de entrega (se diferente)<textarea class="fx-in" data-fx="nota.dest.entrega"></textarea></label></div>';
    return h;
  }
  function fxRenderItens(n) {
    G.__fxTrib = G.__fxTrib || { idx: -1, sub: 'Tributação' };
    var d = I.db(), h = '';
    h += '<div class="fx-card"><h4 style="margin:0 0 8px">➕ Lançar Produto</h4><div class="fx-grid" style="grid-template-columns:70px 1fr 90px 80px 90px 110px 130px 90px;gap:6px;align-items:end">' +
      '<label class="fx-lb">Código<input class="fx-in" id="fx-it-cod"></label>' +
      '<label class="fx-lb">Descrição (digite ou escolha do estoque)<input class="fx-in" id="fx-it-desc" list="fx-dl-prod"><datalist id="fx-dl-prod">' +
      (d.produtos || []).map(function (p2) { return '<option value="' + P.esc(p2.nome || '') + '" data-cod="' + P.esc(p2.id || '') + '">'; }).join('') + '</datalist></label>' +
      '<label class="fx-lb">NCM<input class="fx-in" id="fx-it-ncm" style="min-width:80px"></label>' +
      '<label class="fx-lb">Qtd<input class="fx-in" id="fx-it-qtd" type="number" step="0.0001" value="1" style="min-width:70px"></label>' +
      '<label class="fx-lb">UN<input class="fx-in" id="fx-it-un" value="UN" style="min-width:60px"></label>' +
      '<label class="fx-lb">Vlr. Unit<input class="fx-in" id="fx-it-vu" type="number" step="0.01" style="min-width:90px"></label>' +
      '<label class="fx-lb">Perfil Tributário<select class="fx-in" id="fx-it-perfil">' + I.perfis().map(function (pf) { return '<option value="' + pf.cod + '">' + P.esc(pf.cod + ' ' + pf.descricao) + '</option>'; }).join('') + '</select></label>' +
      '<button class="fx-btn pri" onclick="fxAcao(\'nf-item-add\')"><i class="ph ph-plus"></i>Lançar</button></div>' +
      '<p class="fx-mini">Estoque: ' + ((d.produtos || []).length) + ' produtos · escolher da lista preenche código/NCM/valor. <a href="javascript:void(0)" onclick="navigateTo(\'fiscal-perfil\')">＋ Novo Perfil</a> abre o cadastro de perfis.</p></div>';
    h += '<div style="overflow:auto"><table class="fx-tb"><thead><tr><th>Nº</th><th>Código</th><th>Descrição</th><th>NCM</th><th>CFOP</th><th>CSOSN</th><th>Qtd</th><th>UN</th><th>Vlr Unit</th><th>Desconto</th><th>Total</th><th>Tipo</th><th>Perfil</th><th></th></tr></thead><tbody>';
    if (!n.itens.length) h += '<tr><td colspan="14" style="text-align:center;color:#94a3b8;padding:18px">Nota sem itens — lance o primeiro acima.</td></tr>';
    n.itens.forEach(function (it, i) {
      h += '<tr><td>' + (i + 1) + '</td><td>' + P.esc(it.cprod) + '</td><td>' + P.esc(it.descricao) + '</td><td>' + P.esc(it.ncm) + '</td>' +
        '<td>' + P.esc(it.cfop) + '</td><td>' + P.esc(it.csosn) + '</td><td>' + it.qtd + '</td><td>' + P.esc(it.un) + '</td>' +
        '<td style="text-align:right">' + P.brl(it.vunit) + '</td><td style="text-align:right">' + P.brl(it.desconto) + '</td>' +
        '<td style="text-align:right"><b>' + P.brl(it.vtotal) + '</b></td><td>' + it.tipo + '</td><td>' + P.esc(it.perfilCod || '—') + '</td>' +
        '<td style="white-space:nowrap"><button class="fx-btn" title="Tributação do item" onclick="fxAcao(\'nf-item-trib\',\'' + i + '\')">⚖️</button>' +
        '<button class="fx-btn dan" onclick="fxAcao(\'nf-item-del\',\'' + i + '\')">✕</button></td></tr>';
    });
    h += '</tbody></table></div>';
    /* mini-abas Itens | Tributação (o cantinho superior esquerdo das fotos) */
    if (G.__fxTrib.idx >= 0 && n.itens[G.__fxTrib.idx]) {
      var it = n.itens[G.__fxTrib.idx], sub = G.__fxTrib.sub;
      h += '<div class="fx-card" style="border:2px solid #0a1e8a">' +
        '<div class="fx-tabs" style="margin-bottom:8px">' + ['Itens', 'Tributação'].map(function (s) {
          return '<div class="fx-tab' + (sub === s ? ' on' : '') + '" onclick="fxAcao(\'nf-trib-sub\',\'' + s + '\')">' + s + '</div>';
        }).join('') + '<div style="flex:1"></div><button class="fx-btn" onclick="fxAcao(\'nf-trib-fechar\')">✕ Fechar tributação</button></div>';
      if (sub === 'Itens') {
        h += '<div class="fx-grid fx-g3">' +
          '<label class="fx-lb">GTIN/EAN<input class="fx-in" data-fx="tribItem.gtin"></label>' +
          '<label class="fx-lb">C.Prod<input class="fx-in" data-fx="tribItem.cprod"></label>' +
          '<label class="fx-lb">Descrição<input class="fx-in" data-fx="tribItem.descricao" style="min-width:240px"></label>' +
          '<label class="fx-lb">Valor<input class="fx-in" type="number" step="0.01" data-fx="tribItem.vunit"></label>' +
          '<label class="fx-lb">NCM<input class="fx-in" data-fx="tribItem.ncm"></label>' +
          '<label class="fx-lb">CEST<input class="fx-in" data-fx="tribItem.cest"></label>' +
          '<label class="fx-lb">CFOP<input class="fx-in" data-fx="tribItem.cfop" maxlength="4"></label>' +
          '<div class="fx-lb"> <button class="fx-btn" style="margin-top:16px" onclick="fxAcao(\'nf-item-cfop-todos\')">Alterar para Todos</button></div></div>';
      }
      h += '<div id="fx-trib-corpo">' + (sub === 'Tributação' ? fxRenderTribItem(it) : '') + '</div></div>';
      G.__fxTribItemRef = it;
    }
    return h;
  }
  function fxRenderTribItem(it) {
    var t = it.trib;
    G.__fxTribAba = G.__fxTribAba || 'Tributação';
    var abas = ['Tributação', 'Importação', 'Outros', 'Reforma Tributária'];
    var h = '<div class="fx-tabs">' + abas.map(function (a) {
      return '<div class="fx-tab' + (G.__fxTribAba === a ? ' on' : '') + '" onclick="fxAcao(\'nf-trib-aba\',\'' + a + '\')">' + a + '</div>';
    }).join('') + '</div>';
    if (G.__fxTribAba === 'Tributação') {
      h += '<div class="fx-grid fx-g3">' +
        /* ICMS */
        '<div class="fx-card" style="margin:0"><h4 style="margin:0 0 6px">ICMS</h4>' +
        I.sel('tribItem.trib2.csosn', 'CST/CSOSN (Simples Nacional)', P.CSOSN_LISTA) +
        '<div class="fx-grid fx-g2" style="margin-top:6px">' + I.inp('tribItem.trib2.icmsBase', 'Base ICMS R$', 'type="number" step="0.01"') + I.inp('tribItem.trib2.icmsValor', 'Valor ICMS R$', 'type="number" step="0.01"') + '</div>' +
        '<button class="fx-btn" style="margin-top:6px" onclick="fxAcao(\'nf-trib-zerar\',\'icms\')">Zerar ICMS</button></div>' +
        /* ICMS ST */
        '<div class="fx-card" style="margin:0"><h4 style="margin:0 0 6px">ICMS ST</h4><div class="fx-grid fx-g2">' +
        I.inp('tribItem.trib2.stBase', 'Base ST R$', 'type="number" step="0.01"') + I.inp('tribItem.trib2.stPerc', 'ST %', 'type="number" step="0.01"') + I.inp('tribItem.trib2.stValor', 'Valor ST R$', 'type="number" step="0.01"') +
        '</div><button class="fx-btn" style="margin-top:6px" onclick="fxAcao(\'nf-trib-zerar\',\'st\')">Zerar ST</button></div>' +
        /* IPI */
        '<div class="fx-card" style="margin:0"><h4 style="margin:0 0 6px">IPI</h4>' +
        I.sel('tribItem.trib2.ipiCst', 'CST', P.IPI_CST) +
        '<div class="fx-grid fx-g2" style="margin-top:6px">' + I.inp('tribItem.trib2.ipiPerc', 'IPI %', 'type="number" step="0.01"') + I.inp('tribItem.trib2.ipiValor', 'Valor IPI R$', 'type="number" step="0.01"') + '</div>' +
        '<button class="fx-btn" style="margin-top:6px" onclick="fxAcao(\'nf-trib-zerar\',\'ipi\')">Zerar IPI</button></div>' +
        /* PIS */
        '<div class="fx-card" style="margin:0"><h4 style="margin:0 0 6px">PIS</h4>' +
        I.sel('tribItem.trib2.pisCst', 'CST', P.PISCOFINS_CST) +
        '<div class="fx-grid fx-g2" style="margin-top:6px">' + I.inp('tribItem.trib2.pisAli', 'Alíquota %', 'type="number" step="0.01"') + '<label class="fx-lb"> </label></div></div>' +
        /* COFINS */
        '<div class="fx-card" style="margin:0"><h4 style="margin:0 0 6px">COFINS</h4>' +
        I.sel('tribItem.trib2.cofinsCst', 'CST', P.PISCOFINS_CST) +
        '<div class="fx-grid fx-g2" style="margin-top:6px">' + I.inp('tribItem.trib2.cofinsAli', 'Alíquota %', 'type="number" step="0.01"') + '</div></div>' +
        '</div>';
    } else if (G.__fxTribAba === 'Importação') {
      var imp = t.imp;
      h += '<div class="fx-grid fx-g3">' +
        I.inp('tribItem.imp2.di', 'Documento (DI/DSI/DA/DRI-E)') +
        I.inp('tribItem.imp2.dtReg', 'Data de Registro', 'type="date"') +
        I.inp('tribItem.imp2.codExp', 'Código do Exportador') +
        I.inp('tribItem.imp2.via', 'Via de Transporte') +
        I.inp('tribItem.imp2.afrmm', 'AFRMM R$', 'type="number" step="0.01"') +
        I.inp('tribItem.imp2.forma', 'Forma de Importação') +
        I.inp('tribItem.imp2.desembData', 'Desembaraço — Data', 'type="date"') +
        I.inp('tribItem.imp2.desembUf', 'Desembaraço — UF', 'maxlength="2"') +
        I.inp('tribItem.imp2.desembLocal', 'Desembaraço — Local') +
        I.inp('tribItem.imp2.iof', 'IOF R$', 'type="number" step="0.01"') +
        I.inp('tribItem.imp2.despAduan', 'Despesas Aduaneiras R$', 'type="number" step="0.01"') +
        I.inp('tribItem.imp2.ii', 'Imposto de Importação R$', 'type="number" step="0.01"') +
        I.inp('tribItem.imp2.pais', 'País') + '</div>' +
        '<p class="fx-mini">Adições (nº/fabricante/desconto) entram quando a nota tiver importação de verdade.</p>';
    } else if (G.__fxTribAba === 'Outros') {
      h += '<div class="fx-grid fx-g3">' +
        I.inp('tribItem.trib2.icmsDeson', 'ICMS Desonerado R$', 'type="number" step="0.01"') +
        I.inp('tribItem.trib2.beneficio', 'Cód. Benefício Fiscal') +
        I.inp('tribItem.trib2.fcpPerc', 'FCP %', 'type="number" step="0.01"') +
        I.inp('tribItem.trib2.fcpValor', 'FCP R$', 'type="number" step="0.01"') +
        I.inp('tribItem.trib2.efetBase', 'Base % Efetivo', 'type="number" step="0.01"') +
        I.inp('tribItem.trib2.efetValor', 'Valor Efetivo R$', 'type="number" step="0.01"') +
        I.inp('tribItem.trib2.pedido', 'Nº do Pedido') +
        I.inp('tribItem.trib2.pedidoItem', 'Item do Pedido') +
        '<label class="fx-lb">Par Comercial/Tributável<input class="fx-in" value="' + P.esc(it.un) + ' × ' + P.brl(it.qtd) + ' × ' + P.brl(it.vunit) + ' = ' + P.brl(it.vtotal) + '" readonly style="background:#f8fafc"></label>' +
        '</div><p class="fx-mini">Outros → CSOSN ICMS (DIF/UF remetente-dest.), ICMS ST retido/substituído e FCP por UF ficam nestes campos — completa o mapa das 18 fotos.</p>';
    } else {
      var cofre = P.ibsCbs(it.vtotal, t.refIbsUfPerc, t.refIbsMunPerc, t.refCbsPerc);
      h += '<div class="fx-grid fx-g3">' +
        I.sel('tribItem.trib2.refCst', 'CST (Reforma)', P.REFORMA_CST) +
        I.sel('tribItem.trib2.refClassif', 'Classificação', P.REFORMA_CLASSIF) +
        I.inp('tribItem.trib2.refIbsUfPerc', 'IBS Estadual %', 'type="number" step="0.01"') +
        I.inp('tribItem.trib2.refIbsMunPerc', 'IBS Municipal %', 'type="number" step="0.01"') +
        I.inp('tribItem.trib2.refCbsPerc', 'CBS %', 'type="number" step="0.01"') +
        '</div>' +
        '<div class="fx-cofre" style="margin-top:8px">' +
        '<div><span class="fx-mini">IBS Estadual</span><b>R$ ' + P.brl(cofre.ibsUf) + '</b></div>' +
        '<div><span class="fx-mini">IBS Municipal</span><b>R$ ' + P.brl(cofre.ibsMun) + '</b></div>' +
        '<div><span class="fx-mini">CBS</span><b>R$ ' + P.brl(cofre.cbs) + '</b></div></div>' +
        '<p class="fx-mini">Os cofrinhos verdes calculam sozinhos sobre o valor do item (' + P.brl(it.vtotal) + ') com as alíquotas acima — devolução de tributos usa os mesmos campos na nota de devolução.</p>';
    }
    return h;
  }
  function fxRenderInfosAdic(n) {
    return '<div class="fx-card"><div class="fx-grid" style="grid-template-columns:1fr 1fr 1fr;gap:8px">' +
      '<label class="fx-lb">Pré-Configurada (do cadastro)<textarea class="fx-in" data-fx="nota.infos.preConfig"></textarea></label>' +
      '<label class="fx-lb">Informações Complementares (livre)<textarea class="fx-in" data-fx="nota.infos.complementares" placeholder="Ex.: TOMADOR NOTA FISCAL DE SERVIÇO... (romance crediário→fiscal)"></textarea></label>' +
      '<label class="fx-lb">Geradas Automaticamente (leitura)<textarea class="fx-in" data-fx="nota.infos.geradasAuto" readonly style="background:#f8fafc"></textarea></label></div>' +
      '<p class="fx-mini">A caixa automática recebe o texto IBPT (quando ligada na Config &gt; Tributação) na hora de gerar — nunca inventa valor.</p>' +
      '<h4 style="margin:10px 0 8px">🏛️ Órgãos Públicos</h4><div class="fx-grid fx-g3">' +
      I.inp('nota.infos.empenho', 'Nota de Empenho') + I.inp('nota.infos.pedido', 'Pedido') + I.inp('nota.infos.contrato', 'Contrato') + '</div></div>';
  }
  function fxRenderTransporte(n) {
    return '<div class="fx-card"><div class="fx-grid fx-g2">' +
      I.sel('nota.frete.modalidade', 'Modalidade do Frete', P.FRETE_OPCOES) + '</div>' +
      '<h4 style="margin:10px 0 8px">🚚 Transportadora</h4><div class="fx-grid fx-g4">' +
      I.inp('nota.frete.transportadora.doc', 'CNPJ/CPF') + I.inp('nota.frete.transportadora.nome', 'Razão Social', 'style="min-width:230px"') +
      I.inp('nota.frete.transportadora.ie', 'IE') + I.inp('nota.frete.transportadora.endereco', 'Endereço', 'style="min-width:220px"') +
      I.inp('nota.frete.transportadora.cidade', 'Cidade') + I.inp('nota.frete.transportadora.uf', 'UF', 'maxlength="2" style="width:60px"') +
      I.inp('nota.frete.transportadora.email', 'E-mail') + '</div>' +
      '<h4 style="margin:10px 0 8px">🚗 Veículo</h4><div class="fx-grid fx-g3">' +
      I.inp('nota.frete.veiculo.placa', 'Placa', 'maxlength="8" style="width:100px"') + I.inp('nota.frete.veiculo.uf', 'UF', 'maxlength="2" style="width:60px"') + I.inp('nota.frete.veiculo.rntc', 'RNTC') + '</div>' +
      '<h4 style="margin:10px 0 8px">📦 Volumes Transportados</h4>' +
      '<div class="fx-grid" style="grid-template-columns:70px 130px 110px 90px 100px 100px 100px 40px;gap:6px;align-items:center">' +
      n.frete.volumes.map(function (v, i) {
        return '<input class="fx-in" type="number" value="' + (v.qtde || 0) + '" onchange="fxAcao(\'nf-vol-edit\',\'' + i + '\',\'qtde\',this.value)">' +
          '<input class="fx-in" value="' + P.esc(v.especie || '') + '" placeholder="Espécie" onchange="fxAcao(\'nf-vol-edit\',\'' + i + '\',\'especie\',this.value)">' +
          '<input class="fx-in" value="' + P.esc(v.marca || '') + '" placeholder="Marca" onchange="fxAcao(\'nf-vol-edit\',\'' + i + '\',\'marca\',this.value)">' +
          '<input class="fx-in" value="' + P.esc(v.num || '') + '" placeholder="Numeração" onchange="fxAcao(\'nf-vol-edit\',\'' + i + '\',\'num\',this.value)">' +
          '<input class="fx-in" type="number" step="0.001" value="' + (v.pesoB || 0) + '" placeholder="Peso Bruto" onchange="fxAcao(\'nf-vol-edit\',\'' + i + '\',\'pesoB\',this.value)">' +
          '<input class="fx-in" type="number" step="0.001" value="' + (v.pesoL || 0) + '" placeholder="Peso Líq." onchange="fxAcao(\'nf-vol-edit\',\'' + i + '\',\'pesoL\',this.value)">' +
          '<input class="fx-in" value="' + P.esc(v.lacre || '') + '" placeholder="Lacre" onchange="fxAcao(\'nf-vol-edit\',\'' + i + '\',\'lacre\',this.value)">' +
          '<button class="fx-btn dan" onclick="fxAcao(\'nf-vol-del\',\'' + i + '\')">✕</button>';
      }).join('') + '</div>' +
      '<button class="fx-btn" style="margin-top:8px" onclick="fxAcao(\'nf-vol-add\')"><i class="ph ph-plus"></i>Adicionar volume</button></div>';
  }
  function fxRenderCorrecoes(n) {
    var d = I.db(), cce = [];
    (d.config && d.config.nfRegistro || []).forEach(function (r) {
      if (r.chave && n.chaveRef === r.chave) (r.cartas || r.eventos || []).forEach(function (c) { cce.push(c); });
    });
    (n.cce || []).forEach(function (c) { cce.push(c); });
    return '<div class="fx-card"><h4 style="margin:0 0 8px">📝 Correções Realizadas (Cartas de Correção)</h4>' +
      '<table class="fx-tb"><thead><tr><th>Data</th><th>Texto</th><th>Protocolo</th></tr></thead><tbody>' +
      (cce.length ? cce.map(function (c) { return '<tr><td>' + P.dataBR(c.em || c.dh) + '</td><td>' + P.esc(c.texto || '') + '</td><td>' + P.esc(c.protocolo || '') + '</td></tr>'; }).join('') :
        '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:16px">Nenhuma carta de correção nesta nota ainda.</td></tr>') + '</tbody></table>' +
      '<div style="margin-top:8px;display:flex;gap:8px">' +
      '<button class="fx-btn" onclick="fxAcao(\'nf-cce-imprimir\')"><i class="ph ph-printer"></i>Imprimir</button>' +
      '<span class="fx-mini" style="align-self:center">CC-e nova se faz pela LISTAGEM da Central (botão da nota autorizada) — carta não altera valor/item.</span></div></div>';
  }
  function fxRenderReforma(n) {
    var base = (n.totais && n.totais.produtos) || 0;
    var cofre = P.ibsCbs(base, 0.1, 0, 0.9);
    return '<div class="fx-card"><div class="fx-grid fx-g2">' +
      I.sel('nota.reforma.cst', 'Tributação Padrão — CST', P.REFORMA_CST) +
      I.sel('nota.reforma.classif', 'Classificação', P.REFORMA_CLASSIF) +
      I.inp('nota.reforma.base', 'Base R$', 'type="number" step="0.01"') + '</div>' +
      '<div class="fx-cofre" style="margin-top:8px">' +
      '<div><span class="fx-mini">IBS Estadual 0,1%</span><b>R$ ' + P.brl(cofre.ibsUf) + '</b></div>' +
      '<div><span class="fx-mini">IBS Municipal 0%</span><b>R$ ' + P.brl(cofre.ibsMun) + '</b></div>' +
      '<div><span class="fx-mini">CBS 0,9%</span><b>R$ ' + P.brl(cofre.cbs) + '</b></div></div>' +
      '<p class="fx-mini">Vigência por UF/data fica nas Configurações &gt; Reforma (o "Alterar NFe → Cidades / Datas" do sistema antigo virou os parâmetros da aba Reforma). <a href="javascript:void(0)" onclick="navigateTo(\'config-fiscal\')">Abrir Configurações</a></p></div>';
  }
  function fxRenderReferenciar(n) {
    return '<div class="fx-card"><h4 style="margin:0 0 8px">🔗 Notas Fiscais Referenciadas</h4>' +
      '<table class="fx-tb"><thead><tr><th>Chave de acesso (44 dígitos)</th><th></th></tr></thead><tbody>' +
      (n.refs.length ? n.refs.map(function (r, i) { return '<tr><td style="font-family:monospace">' + P.esc(r) + '</td><td style="width:40px"><button class="fx-btn dan" onclick="fxAcao(\'nf-ref-del\',\'' + i + '\')">✕</button></td></tr>'; }).join('') :
        '<tr><td colspan="2" style="text-align:center;color:#94a3b8;padding:14px">Nenhuma nota referenciada (devoluções/complementares apontam a nota de origem aqui).</td></tr>') + '</tbody></table>' +
      '<div style="display:flex;gap:8px;margin-top:8px"><input class="fx-in" id="fx-ref-nova" maxlength="44" placeholder="cole a chave de 44 dígitos" style="min-width:380px;font-family:monospace">' +
      '<button class="fx-btn" onclick="fxAcao(\'nf-ref-add\')"><i class="ph ph-plus"></i>Adicionar</button></div></div>';
  }
  function fxRenderLog(n) {
    var regs = (n.log || []).slice().reverse();
    return '<div class="fx-card"><div class="fx-tabs">' +
      ['Respostas', 'XML Resposta', 'Log'].map(function (s) { return '<div class="fx-tab' + (s === 'Log' ? ' on' : '') + '">' + s + '</div>'; }).join('') + '</div>' +
      '<p class="fx-mini">Retorno completo WS / dados SEFAZ aparecem aqui depois da 1ª transmissão real. Antes disso: o log local da nota.</p>' +
      '<table class="fx-tb"><thead><tr><th>Quando</th><th>O que aconteceu</th><th>Quem</th></tr></thead><tbody>' +
      (regs.length ? regs.map(function (l) { return '<tr><td>' + P.esc((l.em || '').replace('T', ' ').slice(0, 19)) + '</td><td>' + P.esc(l.acao + (l.detalhe ? ' — ' + l.detalhe : '')) + '</td><td>' + P.esc(l.usuario || '') + '</td></tr>'; }).join('') :
        '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:14px">Log vazio — ações da nota aparecem aqui.</td></tr>') + '</tbody></table></div>';
  }
  function fxRenderEditorNf() {
    var n = fxNotaEdicao(); if (!n) return '';
    var aba = (G.__fxEd && G.__fxEd.aba) || 'Gerais';
    var s = (I.sess() || {}).usuario || n.usuario || '';
    var h = I.placa();
    h += '<div class="fx-card" style="position:sticky;top:0;z-index:2">' +
      '<div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center">' +
      '<div><div class="fx-mini">Código</div><b>' + P.esc(n.cod || '— automático —') + '</b></div>' +
      '<div><div class="fx-mini">Dh Cadastro</div><b>' + P.esc(P.dataBR(n.dhCadastro)) + '</b></div>' +
      '<div><div class="fx-mini">Dh Emissão</div><b>' + P.esc(P.dataBR(n.dhEmissao) || '— até gerar —') + '</b></div>' +
      '<div><div class="fx-mini">Dh Saída</div><b>' + P.esc(P.dataBR(n.dhSaida) || '—') + '</b></div>' +
      '<div><div class="fx-mini">Usuário</div><b>' + P.esc(s) + '</b></div>' +
      '<div style="flex:1;text-align:right"><div class="fx-status" style="color:' + (n.status === 'Autorizada' ? '#166534' : (n.status === 'Cancelada' ? '#991b1b' : '#92400e')) + '">' + P.esc(n.status) + '</div></div></div></div>';
    h += fxAbaVendaNf(n);
    h += '<div id="fx-root">';
    if (aba === 'Gerais') h += fxRenderGerais(n);
    else if (aba === 'Destinatário') h += fxRenderDestinatario(n);
    else if (aba === 'Itens da Nota') h += fxRenderItens(n);
    else if (aba === 'Informações Adicionais') h += fxRenderInfosAdic(n);
    else if (aba === 'Transporte') h += fxRenderTransporte(n);
    else if (aba === 'Correções') h += fxRenderCorrecoes(n);
    else if (aba === 'Reforma Tributária') h += fxRenderReforma(n);
    else if (aba === 'Referenciar') h += fxRenderReferenciar(n);
    else if (aba === 'Log') h += fxRenderLog(n);
    h += '</div>';
    h += '<div class="fx-card" style="position:sticky;bottom:0;z-index:2;display:flex;gap:8px;flex-wrap:wrap;box-shadow:0 -8px 24px rgba(15,23,42,.08)">' +
      '<button class="fx-btn pri" onclick="fxAcao(\'nf-gerar\')"><i class="ph ph-paper-plane-tilt"></i>Gerar NF-e</button>' +
      '<button class="fx-btn" onclick="fxAcao(\'nf-previa\')"><i class="ph ph-eye"></i>Pré-Visualizar</button>' +
      '<button class="fx-btn" onclick="navigateTo(\'config-fiscal\')" title="Abre as Configurações de NF (10 abas)"><i class="ph ph-gear"></i></button>' +
      '<button class="fx-btn" onclick="fxAcao(\'nf-salvar\')"><i class="ph ph-floppy-disk"></i>Salvar</button>' +
      '<button class="fx-btn" onclick="fxAcao(\'nf-sair\')">Sair</button></div>';
    return h;
  }
  function fxRenderCentral() {
    I.css();
    G.__fxEd = G.__fxEd || null;
    var h = G.__fxEd && fxNotaEdicao() ? fxRenderEditorNf() : fxRenderListagem();
    return '<div class="fx-root-wrap">' + h + '</div>';
  }
  /* DANFE PRÉ-VISUALIZAÇÃO (selo vermelho grande, sem valor fiscal) */
  function fxDanfePrevia(n) {
    var cfg = I.cfg();
    var emp = (I.db().config && I.db().config.empresa) || {};
    var t = fxTotaisAuto(n);
    var linhas = n.itens.map(function (it, i) {
      return '<tr><td>' + P.esc(it.cprod) + '</td><td>' + P.esc(it.descricao) + '</td><td>' + P.esc(it.ncm) + '</td><td>' + P.esc(it.cfop) + '</td><td>' + P.esc(it.un) + '</td><td style="text-align:right">' + P.brl(it.qtd) + '</td><td style="text-align:right">' + P.brl(it.vunit) + '</td><td style="text-align:right">' + P.brl(it.vtotal) + '</td></tr>';
    }).join('');
    var ibpt = ''; if (cfg.trib.mostrarTribItens && Number(n.totais.tribAprox) > 0) ibpt = 'Valor Aproximado Total dos Tributos Federais, Estaduais e Municipais R$ ' + P.brl(n.totais.tribAprox) + ' Fonte: IBPT';
    var infos = [n.infos.preConfig, n.infos.complementares, ibpt].filter(Boolean).join('\n');
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pré-visualização da NF-e</title><style>' +
      'body{font-family:Arial,sans-serif;margin:24px;color:#111} .danfe{position:relative;border:2px solid #111;max-width:820px;margin:auto;padding:10px;overflow:hidden}' +
      '.selo{position:absolute;top:42%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:44px;font-weight:900;color:rgba(220,38,38,.30);border:6px solid rgba(220,38,38,.30);border-radius:14px;padding:8px 20px;white-space:nowrap;letter-spacing:.04em}' +
      '.bloco{border:1px solid #111;margin-top:8px;padding:6px;font-size:11px} .bloco h5{margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:.05em}' +
      'table{width:100%;border-collapse:collapse;font-size:10px} td,th{border:1px solid #111;padding:3px 4px}' +
      '.cab{display:flex;justify-content:space-between;align-items:center} .cab h2{margin:0;font-size:18px}.mini{font-size:9px;color:#333}' +
      '@media print {.btn{display:none}} </style></head><body>' +
      '<div style="text-align:center;margin-bottom:10px" class="btn"><button onclick="window.print()" style="height:36px;padding:0 18px;font-weight:700">🖨️ Imprimir</button> <button onclick="window.close()" style="height:36px;padding:0 18px">Fechar</button></div>' +
      '<div class="danfe"><div class="selo">NF-E EM PRÉ-VISUALIZAÇÃO<br><span style="font-size:24px">SEM VALOR FISCAL</span></div>' +
      '<div class="cab"><div><h2>DANFE</h2><div class="mini">Documento Auxiliar da Nota Fiscal Eletrônica</div></div>' +
      '<div style="text-align:right"><div><b>NF-e Nº ' + P.esc(n.numero || '—') + '</b> Série ' + P.esc(n.serie) + '</div><div class="mini">Modelo ' + P.esc(n.modelo) + ' · ' + P.esc(n.natureza) + '</div><div class="mini">CHAVE DE ACESSO: — (só existe após autorizar)</div></div></div>' +
      '<div class="bloco"><h5>Emitente</h5>' + P.esc(emp.nome || '(empresa do sistema)') + ' · CNPJ ' + P.esc(emp.cnpj || '—') + ' · IE ' + P.esc(emp.ie || '—') + '</div>' +
      '<div class="bloco"><h5>Destinatário / Remetente</h5>' + P.esc(n.dest.nome || '—') + ' · CNPJ/CPF ' + P.esc(n.dest.doc || '—') + ' · IE ' + P.esc(n.dest.ie || '—') + '<br>' + P.esc(n.dest.endereco || '') + ' ' + P.esc(n.dest.cidade || '') + '/' + P.esc(n.dest.uf || '') + (n.dest.enderecoDiferente && n.dest.entrega ? '<br><b>Entrega:</b> ' + P.esc(n.dest.entrega) : '') + '</div>' +
      '<div class="bloco"><h5>Produtos e Serviços</h5><table><thead><tr><th>Código</th><th>Descrição</th><th>NCM</th><th>CFOP</th><th>UN</th><th>Qtd</th><th>Vlr Unit</th><th>Vlr Total</th></tr></thead><tbody>' + (linhas || '<tr><td colspan="8" style="text-align:center">sem itens</td></tr>') + '</tbody></table></div>' +
      '<div class="bloco"><h5>Cálculo do Imposto</h5>Produtos R$ ' + P.brl(t.produtos) + ' · Serviços R$ ' + P.brl(t.servicos) + ' · Frete R$ ' + P.brl(t.frete) + ' · IPI R$ ' + P.brl(t.ipi) + ' · ICMS ST R$ ' + P.brl(t.icmsST) + ' · IBS R$ ' + P.brl(t.ibs) + ' · CBS R$ ' + P.brl(t.cbs) + ' · Descontos R$ ' + P.brl(t.descontos) + ' · <b>TOTAL DA NOTA R$ ' + P.brl(t.total) + '</b></div>' +
      '<div class="bloco"><h5>Transporte</h5>Modalidade: ' + P.esc((P.FRETE_OPCOES.find(function (f) { return f[0] === n.frete.modalidade; }) || ['', '—'])[1]) + (n.frete.transportadora.nome ? ' · ' + P.esc(n.frete.transportadora.nome) : '') + (n.frete.volumes.length ? ' · Volumes: ' + n.frete.volumes.map(function (v) { return P.esc(v.qtde + ' ' + (v.especie || '')); }).join(', ') : '') + '</div>' +
      '<div class="bloco"><h5>Dados Adicionais</h5><pre style="white-space:pre-wrap;font-size:10px;margin:0">' + P.esc(infos || '(sem informações)') + '</pre></div>' +
      '<div class="mini" style="text-align:center;margin-top:6px">Pré-visualização gerada pelo sistema Digicopy — sem valor fiscal enquanto não autorizada na SEFAZ.</div></div></body></html>';
  }

/* ══════════════ PARTE 4 — PERFIL TRIBUTÁRIO (11 fotos) ══════════════ */
(function () {
  var G = typeof window !== 'undefined' ? window : globalThis;
  if (G.__v6014fxc4) return;
  G.__v6014fxc4 = true;
  var P = G.FX614_PURE, I = G.__v6014fxInfra;

  function fxRenderPerfilLista() {
    I.css();
    var perfis = I.perfis(), h = I.placa();
    h += '<div class="fx-barra"><b style="font-size:14px">Perfis Tributários</b><span class="fx-mini">o mapa das operações da loja — cada item da nota escolhe um perfil e herda CFOP/CSOSN dele</span>' +
      '<span style="flex:1"></span><button class="fx-btn pri" onclick="fxAcao(\'pf-novo\')"><i class="ph ph-plus"></i>Novo Perfil</button></div>';
    h += '<table class="fx-tb"><thead><tr><th>Código</th><th>Descrição</th><th>CFOP</th><th>CSOSN</th><th>PIS</th><th>COFINS</th><th>IPI</th><th></th></tr></thead><tbody>';
    perfis.forEach(function (pf, i) {
      h += '<tr><td><b>' + P.esc(pf.cod) + '</b></td><td>' + P.esc(pf.descricao) + '</td><td>' + P.esc(pf.cfop) + '</td><td>' + P.esc(pf.csosn) + '</td>' +
        '<td>' + P.esc(pf.pisCst) + ' ' + (pf.pisAli || 0) + '%</td><td>' + P.esc(pf.cofinsCst) + ' ' + (pf.cofinsAli || 0) + '%</td><td>' + P.esc(pf.ipiCst) + ' ' + (pf.ipiAli || 0) + '%</td>' +
        '<td style="white-space:nowrap"><button class="fx-btn" onclick="fxAcao(\'pf-alterar\',\'' + i + '\')"><i class="ph ph-pencil"></i>Alterar</button>' +
        '<button class="fx-btn dan" onclick="fxAcao(\'pf-excluir\',\'' + i + '\')">Excluir</button></td></tr>';
    });
    h += '</tbody></table>';
    if (G.__fxPfEd != null && perfis[G.__fxPfEd]) h += fxRenderPerfilEdicao(perfis[G.__fxPfEd], G.__fxPfEd);
    return '<div class="fx-root-wrap">' + h + '</div>';
  }
  function fxRenderPerfilEdicao(pf, idx) {
    G.__fxPfObj = pf;
    return '<div class="fx-card" style="border:2px solid #0a1e8a;margin-top:10px"><h4 style="margin:0 0 8px">⚙️ Configurar Tributação — ' + P.esc(pf.cod) + '</h4>' +
      '<div class="fx-grid fx-g3">' +
      I.sel('pf.tipo', 'Tipo de Tributação', [['ICMS', 'ICMS'], ['ISSQN', 'ISSQN']]) +
      I.inp('pf.descricao', 'Descrição', 'style="min-width:280px"') +
      I.inp('pf.cfop', 'CFOP Padrão', 'maxlength="4"') + '</div>' +
      '<div class="fx-tabs" style="margin-top:10px">' + ['ICMS', 'PIS', 'COFINS', 'IPI', 'Reforma Tributária'].map(function (a) {
        return '<div class="fx-tab' + ((G.__fxPfAba || 'ICMS') === a ? ' on' : '') + '" onclick="fxAcao(\'pf-aba\',\'' + a + '\')">' + a + '</div>';
      }).join('') + '</div>' +
      '<div class="fx-card" style="margin:0">' + fxRenderPerfilAba(pf) + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:8px">' +
      '<button class="fx-btn pri" onclick="fxAcao(\'pf-salvar\')"><i class="ph ph-floppy-disk"></i>Salvar perfil</button>' +
      '<button class="fx-btn" onclick="fxAcao(\'pf-fechar\')">Fechar</button></div></div>';
  }
  function fxRenderPerfilAba(pf) {
    var a = G.__fxPfAba || 'ICMS';
    if (a === 'ICMS') return I.sel('pf.csosn', 'CST/CSOSN (Simples Nacional)', P.CSOSN_LISTA) + '<p class="fx-mini">O dele usa <b>102</b> (sem crédito) nas vendas e 500 ST em operações com substituição.</p>';
    if (a === 'PIS') return '<div class="fx-grid fx-g2">' + I.sel('pf.pisCst', 'CST PIS', P.PISCOFINS_CST) + I.inp('pf.pisAli', 'Alíquota PIS %', 'type="number" step="0.01"') + '</div>';
    if (a === 'COFINS') return '<div class="fx-grid fx-g2">' + I.sel('pf.cofinsCst', 'CST COFINS', P.PISCOFINS_CST) + I.inp('pf.cofinsAli', 'Alíquota COFINS %', 'type="number" step="0.01"') + '</div>';
    if (a === 'IPI') return '<div class="fx-grid fx-g2">' + I.sel('pf.ipiCst', 'CST IPI', P.IPI_CST) + I.inp('pf.ipiAli', 'Alíquota IPI %', 'type="number" step="0.01"') + '</div>';
    return '<div class="fx-grid fx-g2">' + I.sel('pf.refCst', 'CST (novo modelo)', P.REFORMA_CST) + I.sel('pf.refClassif', 'Classificação', P.REFORMA_CLASSIF) +
      I.inp('pf.ibsUf', 'IBS UF %', 'type="number" step="0.01"') + I.inp('pf.ibsMun', 'IBS MUN %', 'type="number" step="0.01"') + I.inp('pf.cbs', 'CBS %', 'type="number" step="0.01"') + '</div>';
  }

  /* ══════════════ PARTE 5 — MANIFESTAÇÃO DESTINATÁRIO (7 fotos) ══════════════ */
  function fxManifEstado() {
    if (!G.__fxMf) G.__fxMf = { busca: 'ultimo', nsu: '', tipo: 'hoje', txt: '', statusNf: 'todas', modelo: 'todas', status: 'todos', ini: '', fim: '', naoSeAplica: false, sel: null };
    return G.__fxMf;
  }
  function fxManifLista() { var d = I.db(); d.config = d.config || {}; d.config.nfManifestacoes = d.config.nfManifestacoes || []; return d.config.nfManifestacoes; }
  function fxRenderManifestacao() {
    I.css();
    var st = fxManifEstado(), h = I.placa();
    h += '<div class="fx-card"><h4 style="margin:0 0 8px">📥 Consulta Notas Destinadas</h4><div style="display:flex;flex-direction:column;gap:5px">' +
      P.MANIF_BUSCAS.map(function (b) {
        return '<label class="fx-chk"><input type="radio" name="fxm-busca" ' + (st.busca === b[0] ? 'checked' : '') + ' onchange="fxAcao(\'mf-busca-modo\',\'' + b[0] + '\')"><span>' + P.esc(b[1]) + '</span></label>';
      }).join('') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:8px;align-items:center">' +
      '<label class="fx-lb" id="fxm-nsu-lb" style="display:' + (st.busca === 'nsu' ? 'flex' : 'none') + '">NSU específico<input class="fx-in" id="fxm-nsu" value="' + P.esc(st.nsu) + '" maxlength="15"></label>' +
      '<button class="fx-btn pri" onclick="fxAcao(\'mf-consultar\')"><i class="ph ph-cloud-arrow-down"></i>Consultar Destinadas</button>' +
      '<span class="fx-mini">Marcador NSU salvo por empresa: <b>' + P.esc((I.db().config || {}).nfNsuUltimo || '— nenhuma consulta ainda —') + '</b></span></div></div>';
    h += '<div class="fx-barra">' +
      I.sel('mf.tipo', 'Tipo de Filtro', P.MANIF_TIPO_FILTRO) +
      I.inp('mf.txt', 'Valor do filtro', 'style="min-width:200px"') +
      I.sel('mf.statusNf', 'Status NF', P.MANIF_STATUS_NF) +
      I.sel('mf.modelo', 'Modelo NF', P.LIST_MODELO) +
      I.sel('mf.status', 'Status Manifestação', P.MANIF_STATUS) +
      I.inp('mf.ini', 'Período de', 'type="date"') + I.inp('mf.fim', 'até', 'type="date"') +
      I.chk('mf.naoSeAplica', 'Não se Aplica') + '</div>';
    var lista = fxManifLista().filter(function (m) {
      if (st.statusNf !== 'todas' && (m.statusNota || 'autorizada') !== st.statusNf) return false;
      if (st.modelo !== 'todas' && String(m.modelo || '55') !== st.modelo) return false;
      if (st.status !== 'todos') { var ev = (m.nossoStatus || 'desconhecida'); if (st.status === 'confirmada' && ev !== 'realizada' && ev !== 'confirmada') return false; if (st.status !== 'confirmada' && ev !== st.status) return false; }
      var dia = String(m.dhEmissao || m.em || '').slice(0, 10);
      if (st.ini && dia < st.ini) return false;
      if (st.fim && dia > st.fim) return false;
      var t = String(st.txt || '').toLowerCase();
      if (t) { if (st.tipo === 'emitente' && String(m.emitente || '').toLowerCase().indexOf(t) < 0) return false; if (st.tipo === 'chave' && String(m.chave || '').indexOf(t) < 0) return false; if (st.tipo === 'valor' && String(m.valor || '').indexOf(t) < 0) return false; }
      return true;
    });
    h += '<div class="fx-barra"><span class="fx-mini">' + lista.length + ' nota(s) destinadas</span><span style="flex:1"></span>' +
      '<button class="fx-btn" onclick="fxAcao(\'mf-consultar\')"><i class="ph ph-arrows-clockwise"></i>Obter Notas</button>' +
      '<button class="fx-btn pri" id="fxm-bt-man" onclick="fxAcao(\'mf-manifestar\')" disabled><i class="ph ph-stamp"></i>Manifestar</button>' +
      '<button class="fx-btn" id="fxm-bt-xml" onclick="fxAcao(\'mf-baixar\')" disabled><i class="ph ph-download"></i>Baixar XML</button></div>';
    h += '<div style="overflow:auto;max-height:calc(100vh - 380px)"><table class="fx-tb"><thead><tr>' + P.MANIF_COLS.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>';
    if (!lista.length) h += '<tr><td colspan="' + P.MANIF_COLS.length + '" style="text-align:center;color:#94a3b8;padding:22px">Nenhuma nota destinada na lista — use <b>Consultar Destinadas</b> (ou adicione uma chave pela busca).</td></tr>';
    lista.forEach(function (m, i) {
      var id = m.chave || ('m' + i), sel = st.sel === id ? ' class="fx-sel"' : '';
      h += '<tr' + sel + ' onclick="fxAcao(\'mf-sel\',\'' + id + '\')">' +
        '<td><span class="fx-selmark"></span></td><td>' + P.esc(m.codigo || (i + 1)) + '</td><td>' + P.esc(m.nsu || '—') + '</td>' +
        '<td>' + P.esc(m.emitente || '') + '</td><td>' + P.esc(m.ie || '') + '</td><td>' + P.esc(m.cnpj || '') + '</td>' +
        '<td style="font-family:monospace;font-size:10.5px">' + P.esc((m.chave || '').slice(0, 20) + (m.chave && m.chave.length > 20 ? '…' : '')) + '</td>' +
        '<td>' + P.esc(m.tipoValor || 'NF') + '</td><td style="text-align:right">' + P.brl(m.valor || 0) + '</td><td>' + P.esc(m.serie || '') + '</td>' +
        '<td>' + P.esc(m.nDFe || '') + '</td><td>' + P.esc(P.dataBR(m.dhEmissao || m.em)) + '</td>' +
        '<td>' + P.esc(m.statusNota || 'Autorizada') + '</td><td>' + P.esc(m.nossoStatus || 'Operação Desconhecida') + '</td><td>' + P.esc(m.protocolo || '') + '</td></tr>';
    });
    h += '</tbody></table></div>';
    return '<div class="fx-root-wrap">' + h + '</div>';
  }

  /* ══════════════ PARTE 6 — NCM (favoritos + padrões; tela com filtros = foto pendente opcional) ══════════════ */
  function fxRenderNcm() {
    I.css();
    var d = I.db(); d.config = d.config || {}; d.config.nfNcmFavoritos = d.config.nfNcmFavoritos || [];
    var termo = (G.__fxNcmTermo || '').toLowerCase();
    var favs = d.config.nfNcmFavoritos.filter(function (f) { return !termo || String(f.cod).indexOf(termo) >= 0 || String(f.desc).toLowerCase().indexOf(termo) >= 0; });
    var h = I.placa();
    h += '<div class="fx-barra"><input class="fx-in" id="fx-ncm-termo" placeholder="Buscar por código ou descrição" style="min-width:260px" value="' + P.esc(G.__fxNcmTermo || '') + '">' +
      '<button class="fx-btn pri" onclick="fxAcao(\'ncm-buscar\')"><i class="ph ph-magnifying-glass"></i>Buscar</button>' +
      '<span class="fx-mini">a tabela NCM completa (4.439 itens do banco antigo) entra com a migração — hoje a lupa vive nos favoritos</span></div>';
    h += '<div class="fx-card"><h4 style="margin:0 0 8px">⭐ Favoritos</h4>' +
      '<div class="fx-grid" style="grid-template-columns:110px 1fr 40px;gap:6px"><input class="fx-in" id="fx-ncm-cod" maxlength="8" placeholder="8 dígitos"><input class="fx-in" id="fx-ncm-desc" placeholder="descrição"><button class="fx-btn pri" onclick="fxAcao(\'ncm-add\')">＋</button></div>' +
      '<table class="fx-tb" style="margin-top:8px"><thead><tr><th>Código</th><th>Descrição</th><th>Uso</th></tr></thead><tbody>';
    if (!favs.length) h += '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:14px">Nenhum favorito ainda — cadastre os NCMs usados no dia a dia.</td></tr>';
    favs.forEach(function (f, i) {
      h += '<tr><td style="font-family:monospace">' + P.esc(f.cod) + '</td><td>' + P.esc(f.desc) + '</td>' +
        '<td style="white-space:nowrap"><button class="fx-btn" onclick="fxAcao(\'ncm-uso\',\'' + i + '\',\'padrao\')">→ padrão</button>' +
        '<button class="fx-btn" onclick="fxAcao(\'ncm-uso\',\'' + i + '\',\'tinta\')">→ recarga/tinta</button>' +
        '<button class="fx-btn" onclick="fxAcao(\'ncm-uso\',\'' + i + '\',\'locacao\')">→ locação</button>' +
        '<button class="fx-btn dan" onclick="fxAcao(\'ncm-del\',\'' + i + '\')">✕</button></td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="fx-card"><h4 style="margin:0 0 8px">🎯 Padrões atuais (uma verdade só — gravam nas mesmas chaves da Configuração)</h4>' +
      '<div class="fx-grid fx-g3">' +
      '<div class="fx-card" style="margin:0"><span class="fx-mini">NCM padrão (produto sem NCM)</span><b style="font-family:monospace">' + P.esc(d.config.nfNcmPadrao || '—') + '</b></div>' +
      '<div class="fx-card" style="margin:0"><span class="fx-mini">Recarga/tinta</span><b style="font-family:monospace">' + P.esc(d.config.nfNcmTinta || '—') + '</b></div>' +
      '<div class="fx-card" style="margin:0"><span class="fx-mini">Locação de máquinas</span><b style="font-family:monospace">' + P.esc(d.config.nfNcmLocacao || '—') + '</b></div></div></div>';
    return '<div class="fx-root-wrap">' + h + '</div>';
  }

  /* ══════════════ PARTE 7 — ENVIAR XML: 'Preparar Arquivos Fiscais' (1 foto) ══════════════ */
  function fxMatrizMes(mesISO) {
    var d = I.db(), m = { nfe: { ger: 0, canc: 0, corr: 0, nf: [] }, nfce: { ger: 0, canc: 0, corr: 'Não Suportado', nf: [] } };
    (d.config && d.config.nfRegistro || []).forEach(function (r) {
      var dia = String(r.autorizadoEm || r.criadoEm || '').slice(0, 7);
      if (dia !== mesISO) return;
      var alvo = String(r.modelo) === '65' ? m.nfce : m.nfe;
      if (!r.xml) alvo.nf.push(r); else if (r.status === 'cancelada') alvo.canc++; else if (r.corrigida) alvo.corr++; else alvo.ger++;
    });
    m.nfe.nfNao = m.nfe.nf.length; m.nfce.nfNao = m.nfce.nf.length;
    return m;
  }
  function fxRenderEnviarXml() {
    I.css();
    var hoje = new Date(); var mesPadrao = hoje.toISOString().slice(0, 7);
    G.__fxXmlMes = G.__fxXmlMes || mesPadrao;
    G.__fxXmlPdf = G.__fxXmlPdf || false;
    var mz = fxMatrizMes(G.__fxXmlMes);
    var mesNome = new Date(G.__fxXmlMes + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    function linha(rot, a, b) { return '<tr><td><b>' + rot + '</b></td><td style="text-align:center">' + a + '</td><td style="text-align:center">' + b + '</td></tr>'; }
    var h = I.placa();
    h += '<div class="fx-card"><h4 style="margin:0 0 8px">🗂️ Preparar Arquivos Fiscais</h4>' +
      '<div class="fx-barra"><label class="fx-lb">Selecione o Mês<input class="fx-in" type="month" value="' + G.__fxXmlMes + '" onchange="fxAcao(\'xml-mes\',this.value)"></label>' +
      '<label class="fx-chk"><input type="checkbox" ' + (G.__fxXmlPdf ? 'checked' : '') + ' onchange="fxAcao(\'xml-pdf\',this.checked)"><span>Incluir PDFs</span></label>' +
      '<button class="fx-btn pri" onclick="fxAcao(\'xml-preparar\')"><i class="ph ph-package"></i>Preparar Arquivos</button></div>' +
      '<table class="fx-tb"><thead><tr><th></th><th>NF-e (modelo 55)</th><th>NFC-e (modelo 65)</th></tr></thead><tbody>' +
      linha('Geradas', mz.nfe.ger, mz.nfce.ger) +
      linha('Canceladas', mz.nfe.canc, mz.nfce.canc) +
      linha('Corrigidas', mz.nfe.corr, mz.nfce.corr) +
      '<tr><td><b>XML Não Encontrados</b></td><td style="text-align:center">' + mz.nfe.nfNao + (mz.nfe.nfNao ? ' <a href="javascript:void(0)" onclick="fxAcao(\'xml-ver\',\'nfe\')">Ver</a>' : '') + '</td><td style="text-align:center">' + mz.nfce.nfNao + (mz.nfce.nfNao ? ' <a href="javascript:void(0)" onclick="fxAcao(\'xml-ver\',\'nfce\')">Ver</a>' : '') + '</td></tr></tbody></table>' +
      ((mz.nfe.nfNao + mz.nfce.nfNao) ? '<p class="fx-mini" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:8px 10px;margin-top:8px">⚠️ Há XML não encontrado: no sistema antigo você procurava <b>em outros terminais</b>. Aqui, a nuvem junta os XMLs de TODOS os PCs na mesma pasta do mês — se faltar algum, rode o pacote no PC que emitiu e os outros PCs herdam pela sincronização.</p>' : '') +
      '<div style="display:flex;gap:8px;margin-top:10px;align-items:center">' +
      '<label class="fx-lb">E-mail do escritório (CC)<input class="fx-in" id="fx-xml-email" style="min-width:280px" value="' + P.esc(I.cfg().outras.emailEscritorio) + '" placeholder="e-mail do contador"></label>' +
      '<button class="fx-btn" onclick="fxAcao(\'xml-copiar\')"><i class="ph ph-copy"></i>Copiar</button></div>' +
      '<button class="fx-btn pri" style="margin-top:10px" onclick="fxAcao(\'xml-enviar\')"><i class="ph ph-envelope"></i> Enviar para Escritório (' + mesNome + ')</button></div>';
    return '<div class="fx-root-wrap">' + h + '</div>';
  }
  G.__v6014fxRender2 = { perfil: fxRenderPerfilLista, manifestacao: fxRenderManifestacao, ncm: fxRenderNcm, enviarXml: fxRenderEnviarXml };
})();

/* ══════════════ PARTE 8 — CONFIG NF EM 10 ABAS (catálogo completo das 10 abas) ══════════════ */
(function () {
  var G = typeof window !== 'undefined' ? window : globalThis;
  if (G.__v6014fxc5) return;
  G.__v6014fxc5 = true;
  var P = G.FX614_PURE, I = G.__v6014fxInfra;

  function fxRenderConfig() {
    I.css();
    var cfg = I.cfg();
    G.__fxCfgAba = G.__fxCfgAba || 'Geral';
    var aba = G.__fxCfgAba;
    var h = I.placa();
    h += '<div class="fx-tabs">' + P.CONFIG_ABAS.map(function (a) {
      return '<button type="button" class="fx-tab' + (a === aba ? ' on' : '') + '" data-fx-tab="' + P.esc(a) + '">' + a + '</button>';
    }).join('') + '</div>';
    h += '<div id="fx-root">' + fxRenderConfigAba(cfg, aba) + '</div>';
    h += '<div style="display:flex;gap:8px;margin-top:4px">' +
      '<button class="fx-btn pri" onclick="fxAcao(\'cfg-salvar\')"><i class="ph ph-floppy-disk"></i>Salvar esta aba</button>' +
      '<span class="fx-mini" style="align-self:center">preset = os valores lidos das fotos da config do sistema antigo (série 1, DANFE retrato, frete 9, síncrono, CRT 1…)</span></div>';
    return '<div class="fx-root-wrap">' + h + '</div>';
  }
  function fxRenderConfigAba(cfg, aba) {
    var d = I.db(), h = '';
    if (aba === 'Geral') {
      var amb = 'homologacao'; try { amb = (G.NFG_PURE && G.NFG_PURE.nfgAmbiente(d)) || 'homologacao'; } catch (e) { }
      h += '<div class="fx-card"><div class="fx-grid fx-g3">' +
        '<label class="fx-lb">Ambiente<input class="fx-in" value="' + (amb === 'producao' ? '1 - Produção' : '2 - Homologação') + '" readonly style="background:#f8fafc"></label>' +
        I.inp('cfg.geral.serie', 'Série') +
        I.sel('cfg.geral.modelo', 'Modelo', P.MODELO_OPCOES) +
        I.sel('cfg.geral.processamento', 'Processamento', P.PROCESSAMENTO) +
        I.sel('cfg.geral.procEmissao', 'Processo de Emissão', P.PROC_EMISSAO) +
        I.sel('cfg.geral.danfe', 'DANFE', P.DANFE_OPCOES) +
        I.sel('cfg.geral.frete', 'Frete Padrão', P.FRETE_OPCOES) +
        I.sel('cfg.geral.tpEmis', 'Tipo de Emissão', P.TP_EMISSAO) +
        I.sel('cfg.geral.tpOp', 'Tipo de Operação', P.TP_OPERACAO) +
        I.sel('cfg.geral.versao', 'Versão', P.VERSAO) +
        I.sel('cfg.geral.crt', 'CRT (Regime Tributário)', P.CRT_OPCOES) +
        I.sel('cfg.geral.regEsp', 'Regime Especial', P.REG_ESP) +
        '</div><p class="fx-mini">Ambiente é lido da placa (Portão Fiscal — produção só com <b>PRODUCAO</b> digitado na Central). Os demais campos valem como preset da emissão.</p></div>';
    } else if (aba === 'Outras') {
      h += '<div class="fx-card"><div class="fx-grid fx-g3">' +
        I.chk('cfg.outras.agruparItens', 'Agrupar itens iguais na finalização') +
        I.inp('cfg.outras.fuso', 'Fuso horário (UTC)') +
        I.inp('cfg.outras.emailEscritorio', 'E-mail pro Escritório (CC contador)', 'style="min-width:280px"') +
        '</div><p class="fx-mini">O e-mail do escritório é o destino do "Enviar para Escritório" (menu Enviar XML). Dado de terceiro: só preencher quando o senhor confirmar. Margens e pasta de PDF/XML ficaram na aba <b>Impressão</b>/aba <b>Nuvem</b>.</p></div>';
    } else if (aba === 'Tributação') {
      h += '<div class="fx-card"><div class="fx-grid fx-g2">' +
        I.sel('cfg.trib.perfilDentro', 'Perfil tributário PADRÃO — dentro do Estado (1)', I.perfis().map(function (p2) { return [p2.cod, p2.cod + ' ' + p2.descricao]; })) +
        I.sel('cfg.trib.perfilFora', 'Perfil tributário PADRÃO — fora do Estado (2)', I.perfis().map(function (p2) { return [p2.cod, p2.cod + ' ' + p2.descricao]; })) +
        I.chk('cfg.trib.mostrarTribItens', 'Exibir Valor Aproximado Total dos Tributos nas Informações Adicionais dos Itens') +
        I.sel('cfg.trib.formatoMsg', 'Formato da mensagem de tributos', [['junto', 'Federal/Estadual/Municipal junto'], ['separado', 'Federal/Estadual/Municipal separado']]) +
        '</div><p class="fx-mini">Perfis padrão do dele: dentro = 00001 (CFOP 5102), fora = 00002 (CFOP 6102).</p></div>';
    } else if (aba === 'Mensagens') {
      h += '<div class="fx-card"><div class="fx-grid" style="grid-template-columns:1fr 1fr 1fr;gap:8px">' +
        '<label class="fx-lb">Informações Adicionais do Interesse do Contribuinte<textarea class="fx-in" data-fx="cfg.msg.infoContribuinte" placeholder="sai em toda nota (ex.: endereço, mensagem)"></textarea></label>' +
        '<label class="fx-lb">Texto Obrigatório da Carta de Correção<textarea class="fx-in" data-fx="cfg.msg.textoCartaCorrecao" placeholder="modelo de crédito ICMS do contador — carta NÃO altera valor/item"></textarea></label>' +
        '<label class="fx-lb">Justificativa da entrada em contingência<textarea class="fx-in" data-fx="cfg.msg.justificativaContingencia" placeholder="ex.: sem comunicação com a SEFAZ no horário"></textarea></label></div></div>';
    } else if (aba === 'Impressão') {
      h += '<div class="fx-card"><div class="fx-grid fx-g2">' +
        I.sel('cfg.geral.danfe', 'DANFE (padrão de saída)', P.DANFE_OPCOES) +
        I.inp('cfg.outras.caminhoSec', 'Caminho secundário PDF/XML', 'style="min-width:260px" placeholder="pasta onde os arquivos também são guardados"') +
        '</div><div class="fx-grid fx-g3" style="margin-top:8px">' +
        I.inp('cfg.outras.margemSup', 'Margem DANFE superior (cm)', 'type="number" step="0.1"') +
        I.inp('cfg.outras.margemInf', 'Margem DANFE inferior (cm)', 'type="number" step="0.1"') +
        I.inp('cfg.outras.margemEsq', 'Margem esquerda (cm)', 'type="number" step="0.1"') +
        I.inp('cfg.outras.margemDir', 'Margem direita (cm)', 'type="number" step="0.1"') +
        '</div><p class="fx-mini">Preset lido das fotos dele: DANFE 1 - Retrato. As margens ajustam a impressão do DANFE na impressora da loja. Caminho secundário = segunda pasta de guarda (além da da nuvem).</p></div>';
    } else if (aba === 'FCP') {
      h += '<div class="fx-card"><p class="fx-mini">Fundo de Combate à Pobreza por UF (NT 003.2015) — aplica só em venda interestadual a consumidor final; confirme alíquotas com a contabilidade. Padrão 2%.</p>' +
        '<label class="fx-lb" style="max-width:200px">Alíquota padrão %<input class="fx-in" type="number" step="0.01" data-fx="cfg.fcp.padrao"></label>' +
        '<table class="fx-tb" style="margin-top:8px"><thead><tr><th>UF</th><th>Alíquota FCP %</th></tr></thead><tbody>' +
        P.FCP_UFS.map(function (uf) {
          var v = (cfg.fcp.ufs && cfg.fcp.ufs[uf] !== undefined) ? cfg.fcp.ufs[uf] : cfg.fcp.padrao;
          return '<tr><td><b>' + uf + '</b></td><td><input class="fx-in" style="width:100px" type="number" step="0.01" value="' + v + '" onchange="fxAcao(\'cfg-fcp-uf\',\'' + uf + '\', this.value)"></td></tr>';
        }).join('') + '</tbody></table></div>';
    } else if (aba === 'Nuvem') {
      h += '<div class="fx-card"><h4 style="margin:0 0 6px">☁️ Sincronização</h4>' +
        '<p class="fx-mini" style="margin-top:0">A nuvem junta os XMLs de TODOS os PCs na mesma pasta do mês — o que um PC emite, os outros herdam pela sincronização. Sem pasta de rede para configurar: o app grava e replica automaticamente.</p>' +
        '<div class="fx-grid fx-g2">' + I.inp('cfg.outras.caminhoSec', 'Caminho secundário local (opcional)', 'style="min-width:260px"') + '</div>' +
        '<h4 style="margin:12px 0 6px">🔐 Certificado Digital (do PC emissor)</h4>' +
        '<div class="fx-grid fx-g2">' +
        I.inp('cfg.cert.a3Serial', 'A3 — Número de Série (token/smartcard)', 'style="min-width:280px"') +
        '<div class="fx-lb">A1 — arquivo PFX<div class="fx-mini" style="text-transform:none;font-weight:500;margin-top:4px">Importar arquivo + senha = só no PC emissor (.exe), pela Central. A senha é pedida na hora e <b>não fica salva</b>.</div></div>' +
        '</div><p class="fx-mini">Biblioteca TLS 1.2 fixa (conjunto moderno: WinCrypt/WinHttp/LibXml2 equiv.).' +
        (cfg.cert.a3Serial ? ' <b>⚠️ Confira se o número de série bate com o certificado renovado antes da 1ª emissão de verdade.</b>' : '') + '</p></div>';
    } else if (aba === 'NFCe') {
      var cscId = (d.config && d.config.nfCscId) || '', csc = (d.config && d.config.nfCsc) || '';
      h += '<div class="fx-card"><div class="fx-grid fx-g2">' +
        I.chk('cfg.nfce.qrcodeInfSup', 'Adicionar Tag de QRCode em Informações Suplementares') +
        I.chk('cfg.nfce.gerarAoFinalizar', 'Gerar NFC-e ao Finalizar Venda no PDV') +
        I.chk('cfg.nfce.logoDanfe', 'Imprimir Logo no DANFE') +
        I.chk('cfg.nfce.logoSobreDados', 'Logo sobre os dados da empresa') +
        I.chk('cfg.nfce.imprimirSemPrevia', 'Imprimir DANFE sem pré-visualização') +
        I.chk('cfg.nfce.qrLateral', 'Imprimir QRCode Lateral') +
        I.sel('cfg.nfce.veqr', 'Versão do QRCode', P.VEQR) +
        I.sel('cfg.nfce.impressoraTipo', 'Tipo de Impressora', P.IMPRESSORA_TIPO) +
        I.inp('cfg.nfce.impressora', 'Nome da impressora selecionada') +
        '</div>' +
        '<div class="fx-grid fx-g2" style="margin-top:10px">' +
        I.inp('csc.id', 'Id CSC', 'value="' + P.esc(cscId) + '"') +
        '<label class="fx-lb">CSC/Token (sócinho fica guardado e mascarado)<input class="fx-in" type="password" data-fx="csc.token" value="' + P.esc(csc) + '" autocomplete="off" style="min-width:280px"></label>' +
        '</div><p class="fx-mini">O CSC é emitido no portal da SEFAZ-MG e assina o QRCode — sem ele, cupom não valida. <b>Gerar NFC-e ao finalizar</b> nasce desmarcado (igual ao dele): nada automático no caixa.</p></div>';
    } else if (aba === 'Autorizações') {
      h += '<div class="fx-card">' +
        '<label class="fx-lb">CNPJ/CPF de quem pode baixar seus XMLs junto à SEFAZ (até 10, separados por vírgula)<input class="fx-in" data-fx="cfg.autoriz.cnpjs" style="min-width:420px" placeholder="ex.: CNPJ do escritório de contabilidade"></label>' +
        '<p class="fx-mini">Uso típico: liberar o contador. A autorização em si é registrada na SEFAZ; aqui fica a lista de referência.</p></div>';
    } else if (aba === 'Reforma') {
      h += '<div class="fx-card"><div class="fx-grid fx-g2">' +
        I.chk('cfg.reforma.ativa', 'Ativar Reforma Tributária (IBS/CBS 2026)') +
        I.sel('cfg.reforma.intermediador', 'Indicador de Intermediador/Marketplace', [['0', '0 - Site próprio / teleatendimento / venda direta'], ['1', '1 - Marketplace / plataforma / app parceiro']]) +
        '</div><p class="fx-mini">O dele vende direto: indicador 0. Os cofrinhos da nota (IBS UF/MUN/CBS) usam as alíquotas do perfil/item.</p>' +
        '<h4 style="margin:10px 0 8px">🗓️ Parâmetros de vigência (Cidades / Datas)</h4>' +
        I.inp('cfg.reforma.vigenciaUF', 'UF de referência', 'maxlength="2" style="width:70px" value="MG"') +
        I.inp('cfg.reforma.vigenciaData', 'Vigente a partir de', 'type="date"') + '</div>';
    }
    return h;
  }
  G.__v6014fxRender2 = Object.assign(G.__v6014fxRender2 || {}, { config: fxRenderConfig });
})();
  /* exportações da parte 3 (ações precisam enxergar) */
  G.__v6014fx3 = { estadoList: fxEstadoList, linhasBase: fxLinhasBase, filtros: fxAplicarFiltros, notaEdicao: fxNotaEdicao, totaisAuto: fxTotaisAuto, renderCentral: fxRenderCentral, danfePrevia: fxDanfePrevia };
})();

/* ══════════════ PARTE 9 — AÇÕES (window.fxAcao) + WRAP FINAL ══════════════ */
(function () {
  var G = typeof window !== 'undefined' ? window : globalThis;
  if (G.__v6014fxc6) return;
  G.__v6014fxc6 = true;
  var P = G.FX614_PURE, I = G.__v6014fxInfra, R1 = G.__v6014fx3, R2 = G.__v6014fxRender2;
  var VIEWS = ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'];

  function fxTelaFiscalAtiva() {
    for (var i = 0; i < VIEWS.length; i++) {
      var v = document.getElementById('view-' + VIEWS[i]);
      if (v && v.offsetParent !== null) return VIEWS[i];
    }
    return null;
  }
  function fxRenderDe(view) {
    if (view === 'central-nf') return R1.renderCentral();
    if (view === 'fiscal-perfil') return R2.perfil();
    if (view === 'fiscal-manifestacao') return R2.manifestacao();
    if (view === 'fiscal-ncm') return R2.ncm();
    if (view === 'fiscal-enviar-xml') return R2.enviarXml();
    if (view === 'config-fiscal') return R2.config();
    return null;
  }
  function fxRaizDe(view) {
    /* objeto raiz que alimenta os [data-fx] da tela (I.pinta/I.aplica) */
    var d = I.db();
    if (view === 'central-nf') {
      var n = R1.notaEdicao();
      if (n) { var it = (G.__fxTrib && G.__fxTrib.idx >= 0) ? n.itens[G.__fxTrib.idx] : null; if (it) { it.trib2 = it.trib; it.imp2 = it.trib.imp; } return { nota: n, tribItem: it || {}, lst: R1.estadoList() }; }
      return { lst: R1.estadoList() };
    }
    if (view === 'fiscal-manifestacao') return { mf: G.__fxMf || {} };
    if (view === 'fiscal-perfil') return { pf: G.__fxPfObj || {} };
    if (view === 'config-fiscal') return { cfg: I.cfg(), inut: (G.__fxInut = G.__fxInut || { ano: '26', modelo: '55' }), csc: { id: (d.config || {}).nfCscId || '', token: (d.config || {}).nfCsc || '' } };
    return {};
  }
  function fxLimpaAliases() {
    (I.db().notasNf || []).forEach(function (n) { (n.itens || []).forEach(function (it) { delete it.trib2; delete it.imp2; }); });
  }
  function fxReRender(view) {
    var t = fxTelaFiscalAtiva() || view;
    if (!t) return;
    var el = document.getElementById('view-' + t);
    var html = fxRenderDe(t);
    if (el && html != null) { el.innerHTML = html; I.pinta(fxRaizDe(t)); }
    I.css();
  }
  G.__fxReRender614 = fxReRender;

  function fxProximoNumero() {
    var mx = 0;
    (I.db().config && I.db().config.nfRegistro || []).forEach(function (r) { var v = parseInt(r.numero, 10); if (v > mx) mx = v; });
    (I.notas() || []).forEach(function (n) { var v = parseInt(n.numero, 10); if (v > mx) mx = v; });
    return String(mx + 1);
  }
  function fxSelecionada() {
    var st = R1.estadoList();
    if (!st.sel) return null;
    return R1.filtros(R1.linhasBase(), st).find(function (l) { return l.id === st.sel; }) || R1.linhasBase().find(function (l) { return l.id === st.sel; }) || null;
  }

  G.fxAcao = function (acao, a, b, c) {
    var d = I.db(), st, n, i, v;
    try {
      /* ── listagem ── */
      if (acao === 'lst-pesquisar') { I.aplica(fxRaizDe('central-nf')); return fxReRender('central-nf'); }
      if (acao === 'lst-sel') { st = R1.estadoList(); st.sel = (st.sel === a ? null : a); return fxReRender('central-nf'); }
      if (acao === 'lst-imprimir') {
        st = R1.estadoList(); var linhas = R1.filtros(R1.linhasBase(), st);
        var w = G.open ? G.open('', '_blank') : null; if (!w) return;
        w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Listagem de Notas</title><style>body{font-family:Arial;padding:16px}table{width:100%;border-collapse:collapse;font-size:11px}td,th{border:1px solid #111;padding:4px}h3{margin:0 0 8px}</style></head><body>' +
          '<h3>Listagem de Notas — ' + new Date().toLocaleDateString('pt-BR') + '</h3><table><thead><tr>' + P.LIST_COLS.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
          linhas.map(function (l) { return '<tr><td>' + P.dataBR(l.data) + '</td><td>' + P.esc(l.modelo) + '</td><td>' + l.tipo + '</td><td>' + (l.email ? '✉' : '') + '</td><td>' + P.esc(l.numero) + '</td><td>' + P.esc(l.natureza) + '</td><td>' + P.esc(l.cliente) + '</td><td style="text-align:right">' + P.brl(l.valor) + '</td><td>' + l.situacao + '</td></tr>'; }).join('') +
          '</tbody></table><button onclick="window.print()">🖨️ Imprimir</button></body></html>');
        w.document.close(); return;
      }
      if (acao === 'nf-novo') {
        var sess = (I.sess() || {});
        var nota = P.notaVazia(fxProximoNumero(), sess.usuario || '');
        nota.cod = String(I.notas().length + 416).padStart(5, '0');
        nota.ambiente = (G.NFG_PURE && G.NFG_PURE.nfgAmbiente(d)) || 'homologacao';
        nota.log.push({ acao: 'nota-criada', detalhe: 'rascunho aberto pelo menu Nota Fiscal', em: new Date().toISOString(), usuario: nota.usuario });
        I.notas().push(nota); G.__fxEd = { id: nota.id, aba: 'Gerais' }; G.__fxTrib = { idx: -1, sub: 'Tributação' };
        fxLimpaAliases(); I.save(); I.log('nf-nova', 'rascunho ' + nota.cod);
        return fxReRender('central-nf');
      }
      if (acao === 'nf-alterar') {
        var sel = fxSelecionada();
        if (!sel) return I.alert('Alterar nota', 'Selecione uma nota na grade primeiro (clique na linha).');
        if (sel.fonte === 'reg') return I.alert('Nota já autorizada', 'Nota <b>autorizada não pode ser alterada</b> — é regra fiscal. Para corrigir: Carta de Correção (CC-e). Para anular: cancelamento. Para reaproveitar os dados: <b>Clonar</b>.');
        G.__fxEd = { id: sel.id, aba: 'Gerais' }; G.__fxTrib = { idx: -1, sub: 'Tributação' };
        return fxReRender('central-nf');
      }
      if (acao === 'nf-excluir') {
        var sel2 = fxSelecionada();
        if (!sel2) return I.alert('Excluir nota', 'Selecione uma nota na grade primeiro.');
        if (sel2.fonte === 'reg') return I.alert('Nota já autorizada', 'Nota autorizada <b>não pode ser excluída</b> (regra fiscal) — cancele pela Central se for o caso.');
        if (!I.pode()) return I.alert('Sem permissão', 'Excluir nota precisa da permissão <b>Emitir NF</b> (Admin/Dono libera na tela Usuários).');
        I.confirm('Excluir rascunho', 'Excluir a nota <b>Não Gerada</b> nº ' + P.esc(sel2.numero) + ' (' + P.esc(sel2.cliente || 'sem destinatário') + ', R$ ' + P.brl(sel2.valor) + ')?<br><br>Ela ainda não foi transmitida — excluir não deixa buraco fiscal.', function () {
          d.notasNf = (d.notasNf || []).filter(function (x) { return x.id !== sel2.id; });
          R1.estadoList().sel = null; fxLimpaAliases(); I.save(); I.log('nf-excluida', 'rascunho nº ' + sel2.numero);
          I.toast2('Rascunho excluído'); fxReRender('central-nf');
        }, 'Excluir');
        return;
      }
      if (acao === 'nf-clonar') {
        var sel3 = fxSelecionada();
        if (!sel3) return I.alert('Clonar nota', 'Selecione uma nota na grade primeiro.');
        var base;
        if (sel3.fonte === 'reg') { base = P.notaVazia('', sel3.ref.usuario || ''); base.natureza = sel3.natureza; base.modelo = String(sel3.modelo); base.dest.nome = sel3.cliente; base.totais.total = sel3.valor; base.log.push({ acao: 'clonada-de-autorizada', detalhe: 'dados básicos da nota ' + sel3.numero + ' (itens completos precisam estar no cadastro)', em: new Date().toISOString() }); }
        else { base = JSON.parse(JSON.stringify(sel3.ref)); base.id = 'fx' + Date.now().toString(36); base.status = 'Não Gerada'; base.dhEmissao = ''; base.dhSaida = ''; base.chaveRef = ''; base.log = (base.log || []).concat([{ acao: 'clonada', detalhe: 'cópia do rascunho nº ' + sel3.numero, em: new Date().toISOString() }]); }
        base.numero = fxProximoNumero(); base.cod = String(I.notas().length + 416).padStart(5, '0'); base.criadoEm = new Date().toISOString(); base.dhCadastro = base.criadoEm;
        I.notas().push(base); G.__fxEd = { id: base.id, aba: 'Gerais' }; G.__fxTrib = { idx: -1, sub: 'Tributação' };
        R1.estadoList().sel = null; fxLimpaAliases(); I.save(); I.log('nf-clonada', 'nova ' + base.cod + ' a partir de ' + sel3.numero);
        return fxReRender('central-nf');
      }
      /* ── editor Venda-NF ── */
      n = R1.notaEdicao();
      if (acao === 'nf-aba') { if (n) { I.aplica(fxRaizDe('central-nf')); G.__fxEd.aba = a; fxLimpaAliases(); I.save(); } return fxReRender('central-nf'); }
      // Configurações fiscais não dependem de uma nota aberta. O guard do
      // editor ficava antes destas ações e fazia as dez abas ignorarem clique
      // quando o usuário entrava pela barra diretamente.
      if (!n && acao !== 'cfg-aba' && acao !== 'cfg-salvar' && acao !== 'cfg-fcp-uf' && acao !== 'inut-enviar') return;
      if (acao === 'nf-salvar' || acao === 'nf-sair') {
        I.aplica(fxRaizDe('central-nf')); R1.totaisAuto(n); n.atualizadoEm = new Date().toISOString();
        n.log = n.log || []; n.log.push({ acao: 'nota-salva', detalhe: 'itens: ' + n.itens.length + ' · total R$ ' + P.brl(n.totais.total), em: n.atualizadoEm, usuario: (I.sess() || {}).usuario || '' });
        if (acao === 'nf-sair') G.__fxEd = null;
        fxLimpaAliases(); I.save(); I.log('nf-salva', n.cod + ' R$ ' + n.totais.total);
        I.toast2('Nota salva'); return fxReRender('central-nf');
      }
      if (acao === 'nf-gerar') {
        I.aplica(fxRaizDe('central-nf')); R1.totaisAuto(n); fxLimpaAliases(); I.save();
        if (!n.itens.length) return I.alert('Nota sem itens', 'Lance pelo menos 1 item na aba <b>Itens da Nota</b> antes de gerar.');
        if (!n.dest.nome && !n.dest.doc) return I.alert('Sem destinatário', 'Escolha o destinatário na aba <b>Destinatário</b> (puxa do cadastro sem redigitar).');
        if (!I.pode()) return I.alert('Sem permissão', 'Gerar NF-e precisa da permissão <b>Emitir NF</b>.');
        var amb2 = (G.NFG_PURE && G.NFG_PURE.nfgAmbiente(d)) || 'homologacao';
        I.confirm('Gerar NF-e nº ' + n.numero + '?',
          'Confere o resumo: <b>' + P.esc(n.dest.nome || n.dest.doc) + '</b> · ' + n.itens.length + ' item(ns) · <b>R$ ' + P.brl(n.totais.total) + '</b> · natureza ' + P.esc(n.natureza) + ' · ambiente <b>' + (amb2 === 'producao' ? 'PRODUÇÃO (vale de verdade)' : 'HOMOLOGAÇÃO (teste)') + '</b>.<br><br>Nada é automático: transmitir usa o certificado do PC emissor e pede a senha na hora.',
          function () {
            var emissor = G.nfTransmitirNota || G.nfeTransmitirNota || G.nfTransmitir;
            if (typeof emissor === 'function') { try { emissor(n); } catch (e) { I.alert('Transmissão', 'O emissor respondeu com erro: ' + P.esc(e.message || e)); } }
            else I.alert('Falta o PC emissor', 'A nota ficou salva como <b>Não Gerada</b> — nada foi transmitido (sem sucesso falso). Para gerar de verdade a nota precisa sair pelo PC com o certificado (.exe): confirme comigo que o motor de emissão já está preso nessa tela.');
            n.log.push({ acao: 'gerar-tentativa', detalhe: (typeof emissor === 'function' ? 'emissor chamado' : 'sem emissor preso — ficou como Não Gerada'), em: new Date().toISOString(), usuario: (I.sess() || {}).usuario || '' });
            fxLimpaAliases(); I.save(); fxReRender('central-nf');
          }, 'Gerar agora');
        return;
      }
      if (acao === 'nf-previa') {
        I.aplica(fxRaizDe('central-nf')); R1.totaisAuto(n); fxLimpaAliases(); I.save();
        var w2 = G.open ? G.open('', '_blank') : null; if (!w2) return I.toast2('Popup bloqueado — libere para ver a prévia', 'info');
        w2.document.write(R1.danfePrevia(n)); w2.document.close();
        n.log.push({ acao: 'previa-danfe', detalhe: 'selo SEM VALOR FISCAL', em: new Date().toISOString() }); I.save();
        return;
      }
      /* itens */
      if (acao === 'nf-item-add') {
        var desc = (document.getElementById('fx-it-desc') || {}).value || '';
        var prod = (d.produtos || []).find(function (p2) { return String(p2.nome || '').toLowerCase() === desc.toLowerCase(); });
        var it = P.itemVazio(n.itens.length + 1);
        it.descricao = desc; it.cprod = (document.getElementById('fx-it-cod') || {}).value || (prod ? prod.id : '');
        it.ncm = (document.getElementById('fx-it-ncm') || {}).value || (prod && prod.ncm) || (d.config || {}).nfNcmPadrao || '';
        it.qtd = Number((document.getElementById('fx-it-qtd') || {}).value) || 1;
        it.un = (document.getElementById('fx-it-un') || {}).value || 'UN';
        it.vunit = Number((document.getElementById('fx-it-vu') || {}).value) || (prod ? (prod.preco || prod.precoVenda || 0) : 0);
        it.perfilCod = (document.getElementById('fx-it-perfil') || {}).value || I.cfg().trib.perfilDentro;
        var pf = I.perfis().find(function (x) { return x.cod === it.perfilCod; });
        if (pf) { it.cfop = pf.cfop; it.csosn = pf.csosn; it.trib.pisCst = pf.pisCst; it.trib.pisAli = pf.pisAli; it.trib.cofinsCst = pf.cofinsCst; it.trib.cofinsAli = pf.cofinsAli; it.trib.ipiCst = pf.ipiCst; it.trib.ipiPerc = pf.ipiAli; it.trib.refCst = pf.refCst; it.trib.refClassif = pf.refClassif; it.trib.refIbsUfPerc = pf.ibsUf; it.trib.refIbsMunPerc = pf.ibsMun; it.trib.refCbsPerc = pf.cbs; }
        if (!it.descricao) return I.toast2('Descreva o item ou escolha do estoque', 'info');
        n.itens.push(it); R1.totaisAuto(n);
        n.log.push({ acao: 'item-lancado', detalhe: it.descricao + ' x' + it.qtd, em: new Date().toISOString() });
        fxLimpaAliases(); I.save(); return fxReRender('central-nf');
      }
      if (acao === 'nf-item-del') { n.itens.splice(Number(a), 1); R1.totaisAuto(n); fxLimpaAliases(); I.save(); return fxReRender('central-nf'); }
      if (acao === 'nf-item-trib') { I.aplica(fxRaizDe('central-nf')); G.__fxTrib = { idx: Number(a), sub: 'Tributação' }; G.__fxTribAba = 'Tributação'; fxLimpaAliases(); I.save(); return fxReRender('central-nf'); }
      if (acao === 'nf-trib-sub') { G.__fxTrib.sub = a; return fxReRender('central-nf'); }
      if (acao === 'nf-trib-fechar') { I.aplica(fxRaizDe('central-nf')); G.__fxTrib = { idx: -1, sub: 'Tributação' }; fxLimpaAliases(); I.save(); return fxReRender('central-nf'); }
      if (acao === 'nf-trib-aba') { I.aplica(fxRaizDe('central-nf')); G.__fxTribAba = a; fxLimpaAliases(); I.save(); return fxReRender('central-nf'); }
      if (acao === 'nf-item-cfop-todos') {
        var itAberto = (G.__fxTrib && G.__fxTrib.idx >= 0) ? n.itens[G.__fxTrib.idx] : null;
        if (itAberto) { var cf = (document.querySelector('[data-fx="tribItem.cfop"]') || {}).value || itAberto.cfop; n.itens.forEach(function (x) { x.cfop = cf; }); I.toast2('CFOP ' + cf + ' aplicado a todos os itens'); fxLimpaAliases(); I.save(); return fxReRender('central-nf'); }
        return;
      }
      if (acao === 'nf-trib-zerar') {
        var itZ = (G.__fxTrib && G.__fxTrib.idx >= 0) ? n.itens[G.__fxTrib.idx] : null; if (!itZ) return;
        I.aplica(fxRaizDe('central-nf'));
        if (a === 'icms') { itZ.trib.icmsBase = 0; itZ.trib.icmsValor = 0; }
        if (a === 'st') { itZ.trib.stBase = 0; itZ.trib.stPerc = 0; itZ.trib.stValor = 0; }
        if (a === 'ipi') { itZ.trib.ipiPerc = 0; itZ.trib.ipiValor = 0; }
        fxLimpaAliases(); I.save(); return fxReRender('central-nf');
      }
      /* pagamentos/duplicatas/volumes (edição inline já vem pronta) */
      if (acao === 'nf-pag-add') { n.pagamentos.push(P.pagamentoVazio()); return fxReRender('central-nf'); }
      if (acao === 'nf-pag-del') { n.pagamentos.splice(Number(a), 1); fxLimpaAliases(); I.save(); return fxReRender('central-nf'); }
      if (acao === 'nf-pag-edit') { n.pagamentos[Number(a)].forma = b; fxLimpaAliases(); I.save(); return; }
      if (acao === 'nf-pag-val') { n.pagamentos[Number(a)].valor = Number(b) || 0; fxLimpaAliases(); I.save(); return; }
      if (acao === 'nf-dup-add') { n.duplicatas.push({ valor: 0, vencimento: '' }); return fxReRender('central-nf'); }
      if (acao === 'nf-dup-del') { n.duplicatas.splice(Number(a), 1); fxLimpaAliases(); I.save(); return fxReRender('central-nf'); }
      if (acao === 'nf-dup-val') { n.duplicatas[Number(a)].valor = Number(b) || 0; fxLimpaAliases(); I.save(); return; }
      if (acao === 'nf-dup-ven') { n.duplicatas[Number(a)].vencimento = b; fxLimpaAliases(); I.save(); return; }
      if (acao === 'nf-vol-add') { n.frete.volumes.push({ qtde: 1, especie: 'UNIDADE', marca: '', num: '', pesoB: 0, pesoL: 0, lacre: '' }); return fxReRender('central-nf'); }
      if (acao === 'nf-vol-del') { n.frete.volumes.splice(Number(a), 1); fxLimpaAliases(); I.save(); return fxReRender('central-nf'); }
      if (acao === 'nf-vol-edit') { var vv = n.frete.volumes[Number(a)]; if (vv) { vv[b] = (b === 'qtde' || b === 'pesoB' || b === 'pesoL') ? (Number(c) || 0) : c; } fxLimpaAliases(); I.save(); return; }
      /* destinatário */
      if (acao === 'nf-dest-puxar') {
        var pick = (document.getElementById('fx-dest-pick') || {}).value || '';
        if (!pick) return I.toast2('Escolha alguém no seletor do cadastro', 'info');
        var fonte = pick.slice(0, 4) === 'cli:' ? (d.clientes || []) : (d.fornecedores || []);
        var alvo = fonte.find(function (x) { return String(x.id) === pick.slice(4); });
        if (!alvo) return;
        I.aplica(fxRaizDe('central-nf'));
        n.dest.refId = alvo.id; n.dest.nome = alvo.nome || alvo.razao || '';
        n.dest.doc = alvo.cnpj || alvo.cpf || alvo.documento || '';
        n.dest.ie = alvo.ie || alvo.inscricaoEstadual || '';
        n.dest.endereco = alvo.endereco || alvo.logradouro || '';
        n.dest.cidade = alvo.cidade || ''; n.dest.uf = alvo.uf || '';
        n.log.push({ acao: 'dest-puxado', detalhe: n.dest.nome, em: new Date().toISOString() });
        fxLimpaAliases(); I.save(); return fxReRender('central-nf');
      }
      /* referenciar */
      if (acao === 'nf-ref-add') {
        var chave = P.dig((document.getElementById('fx-ref-nova') || {}).value || '');
        if (chave.length !== 44) return I.alert('Chave inválida', 'A chave de acesso tem <b>44 dígitos</b> — você mandou ' + chave.length + '.');
        if (n.refs.indexOf(chave) >= 0) return I.toast2('Essa nota já está referenciada', 'info');
        n.refs.push(chave); n.log.push({ acao: 'nf-referenciada', detalhe: chave, em: new Date().toISOString() });
        fxLimpaAliases(); I.save(); return fxReRender('central-nf');
      }
      if (acao === 'nf-ref-del') { I.confirm('Remover referência', 'Tirar esta nota referenciada da lista?', function () { n.refs.splice(Number(a), 1); I.save(); fxReRender('central-nf'); }, 'Remover'); return; }
      if (acao === 'nf-cce-imprimir') { I.toast2('A impressão da CC-e sai pela Central (nota autorizada)', 'info'); return; }
      /* perfil tributário */
      if (acao === 'pf-novo') {
        var usados = I.perfis().map(function (x) { return x.cod; });
        var livre = 1; while (usados.indexOf(String(livre).padStart(5, '0')) >= 0) livre++;
        var pf2 = { cod: String(livre).padStart(5, '0'), descricao: '', tipo: 'ICMS', cfop: '5102', csosn: '102', pisCst: '07', pisAli: 0, cofinsCst: '07', cofinsAli: 0, ipiCst: '99', ipiAli: 0, refCst: '000', refClassif: '000001', ibsUf: 0.1, ibsMun: 0, cbs: 0.9 };
        I.perfis().push(pf2); G.__fxPfEd = I.perfis().length - 1; G.__fxPfObj = pf2; G.__fxPfAba = 'ICMS';
        return fxReRender('fiscal-perfil');
      }
      if (acao === 'pf-alterar') { G.__fxPfEd = Number(a); G.__fxPfObj = I.perfis()[Number(a)]; G.__fxPfAba = 'ICMS'; return fxReRender('fiscal-perfil'); }
      if (acao === 'pf-fechar') { G.__fxPfEd = null; G.__fxPfObj = null; return fxReRender('fiscal-perfil'); }
      if (acao === 'pf-aba') { I.aplica({ pf: G.__fxPfObj || {} }); G.__fxPfAba = a; return fxReRender('fiscal-perfil'); }
      if (acao === 'pf-salvar') {
        var pfS = G.__fxPfObj; if (!pfS) return;
        I.aplica({ pf: pfS });
        if (!String(pfS.descricao || '').trim()) return I.alert('Falta a descrição', 'O perfil precisa de uma descrição (ex.: VENDA DENTRO DO ESTADO).');
        if (!/^\d{4}$/.test(String(pfS.cfop))) return I.alert('CFOP inválido', 'CFOP precisa ter 4 dígitos (ex.: 5102, 6102, 5915).');
        fxLimpaAliases(); I.save(); I.log('pf-salvo', pfS.cod + ' ' + pfS.descricao);
        G.__fxPfEd = null; G.__fxPfObj = null; I.toast2('Perfil salvo ✅'); return fxReRender('fiscal-perfil');
      }
      if (acao === 'pf-excluir') {
        var pfX = I.perfis()[Number(a)]; if (!pfX) return;
        I.confirm('Excluir perfil', 'Excluir o perfil <b>' + P.esc(pfX.cod + ' ' + pfX.descricao) + '</b>?<br>Itens de notas antigas que usam esse código continuam com o texto gravado na nota.', function () {
          d.perfisNf.splice(Number(a), 1); I.save(); I.log('pf-excluido', pfX.cod + ' ' + pfX.descricao);
          G.__fxPfEd = null; G.__fxPfObj = null; I.toast2('Perfil excluído'); fxReRender('fiscal-perfil');
        }, 'Excluir');
        return;
      }
      /* manifestação */
      if (acao === 'mf-busca-modo') { G.__fxMf.busca = a; return fxReRender('fiscal-manifestacao'); }
      if (acao === 'mf-aplicar') { I.aplica({ mf: G.__fxMf }); return fxReRender('fiscal-manifestacao'); }
      if (acao === 'mf-sel') { var mf = G.__fxMf; mf.sel = (mf.sel === a ? null : a); return fxReRender('fiscal-manifestacao'); }
      if (acao === 'mf-consultar') {
        var mfc = G.__fxMf;
        mfc.nsu = (document.getElementById('fxm-nsu') || {}).value || mfc.nsu;
        if (mfc.busca === 'nsu' && !/^\d{1,15}$/.test(P.dig(mfc.nsu))) return I.alert('NSU inválido', 'Informe o número do NSU (só dígitos).');
        var cons = G.nfConsultarDestinadas || G.nfDistribuicaoDfe;
        if (typeof cons === 'function') { try { cons(mfc.busca, mfc.nsu); } catch (e) { } }
        else I.alert('Consulta à SEFAZ', 'Consultar notas destinadas fala com a SEFAZ usando o <b>certificado do PC emissor</b> (.exe) + internet. Nenhum motor de consulta está preso nesta tela ainda — a lista atual permanece (sem sucesso falso). <br><br>O marcador NSU fica guardado por empresa: <b>' + (mfc.busca === 'nsu' ? P.esc(mfc.nsu) : 'retoma do último/3 meses') + '</b>.');
        if (mfc.busca === 'nsu') { d.config.nfNsuUltimo = P.dig(mfc.nsu); I.save(); }
        I.log('mf-consultar', mfc.busca + (mfc.nsu ? ' nsu ' + mfc.nsu : ''));
        return;
      }
      if (acao === 'mf-manifestar') {
        var mfm = G.__fxMf;
        if (!mfm.sel) return I.alert('Manifestar', 'Selecione uma nota na grade primeiro (clique na linha).');
        if (!I.pode()) return I.alert('Sem permissão', 'Manifestar precisa da permissão <b>Emitir NF</b> (a operação responde à SEFAZ em nome da empresa).');
        var alvoM = fxManifLista().find(function (m, i2) { return (m.chave || ('m' + i2)) === mfm.sel; });
        if (!alvoM) return;
        var body = '<div style="display:flex;flex-direction:column;gap:8px">' +
          P.EVENTOS_MANIF.map(function (e, ei) {
            return '<label class="fx-chk" style="height:38px;border:1px solid #e2e8f0;border-radius:10px;padding:0 10px"><input type="radio" name="fxm-ev" value="' + e[0] + '"' + (ei === 0 ? ' checked' : '') + '><span><b>' + P.esc(e[1]) + '</b>' + (e[0] === 'nao-realizada' ? ' <span class="fx-mini">(pede justificativa de 15+ letras)</span>' : '') + '</span></label>';
          }).join('') +
          '<label class="fx-lb" style="margin-top:6px">Justificativa (só se operação não realizada)<input class="fx-in" id="fxm-just" style="width:100%"></label></div>';
        I.confirm('Manifestar nota', '<div class="fx-mini" style="margin-bottom:8px">Chave <span style="font-family:monospace">' + P.esc((alvoM.chave || '').slice(0, 20)) + '…</span> · emitente ' + P.esc(alvoM.emitente || '') + '</div>' + body, function () {
          var ev = (document.querySelector('input[name="fxm-ev"]:checked') || {}).value || 'ciencia';
          var just = (document.getElementById('fxm-just') || {}).value || '';
          if (ev === 'nao-realizada' && just.trim().length < 15) { I.alert('Justificativa curta', 'A SEFAZ pede justificativa com <b>pelo menos 15 letras</b> para "Operação Não Foi Realizada". Tente de novo.'); return; }
          var rotulo = (P.EVENTOS_MANIF.find(function (e) { return e[0] === ev; }) || ['', ev])[1];
          if (typeof G.nfManifestarEvento === 'function') {
            try { G.nfManifestarEvento(alvoM.chave, ev, just, alvoM.cnpj); } catch (e) { }
            alvoM.nossoStatus = rotulo; fxLimpaAliases(); I.save(); fxReRender('fiscal-manifestacao');
          } else I.alert('Falta o PC emissor', 'O envio do evento usa o certificado do PC emissor (.exe). Nada foi manifestado (sem sucesso falso).');
          I.log('mf-manifestar', ev + ' ' + (alvoM.chave || ''));
        }, 'Manifestar agora');
        return;
      }
      if (acao === 'mf-baixar') {
        var mfb = G.__fxMf;
        var alvoB = fxManifLista().find(function (m2, i2) { return (m2.chave || ('m' + i2)) === mfb.sel; });
        if (!alvoB) return I.alert('Baixar XML', 'Selecione uma nota na grade primeiro.');
        if (!alvoB.xml) return I.alert('XML indisponível', 'Esta nota não tem o XML guardado. Baixar da SEFAZ usa o certificado do PC emissor (.exe).');
        var blob = new Blob([alvoB.xml], { type: 'application/xml' });
        var aEl = document.createElement('a'); aEl.href = URL.createObjectURL(blob);
        aEl.download = (alvoB.chave || 'nota') + '.xml'; document.body.appendChild(aEl); aEl.click();
        setTimeout(function () { URL.revokeObjectURL(aEl.href); aEl.remove(); }, 900);
        return;
      }
      /* NCM */
      if (acao === 'ncm-buscar') { G.__fxNcmTermo = (document.getElementById('fx-ncm-termo') || {}).value || ''; return fxReRender('fiscal-ncm'); }
      if (acao === 'ncm-add') {
        var cod = P.dig((document.getElementById('fx-ncm-cod') || {}).value || '');
        var descr = ((document.getElementById('fx-ncm-desc') || {}).value || '').trim();
        if (!/^\d{8}$/.test(cod)) return I.alert('NCM inválido', 'NCM tem <b>8 dígitos</b> (ex.: 84439923).');
        if (!descr) return I.alert('Falta a descrição', 'Descreva o NCM (ex.: peças de impressora).');
        d.config.nfNcmFavoritos = d.config.nfNcmFavoritos || [];
        if (d.config.nfNcmFavoritos.some(function (f) { return f.cod === cod; })) return I.toast2('Esse NCM já é favorito', 'info');
        d.config.nfNcmFavoritos.push({ cod: cod, desc: descr }); I.save(); I.log('ncm-add', cod);
        return fxReRender('fiscal-ncm');
      }
      if (acao === 'ncm-del') { I.confirm('Remover favorito', 'Tirar esse NCM dos favoritos?', function () { d.config.nfNcmFavoritos.splice(Number(a), 1); I.save(); fxReRender('fiscal-ncm'); }, 'Remover'); return; }
      if (acao === 'ncm-uso') {
        var fav = (d.config.nfNcmFavoritos || [])[Number(a)]; if (!fav) return;
        if (b === 'padrao') d.config.nfNcmPadrao = fav.cod;
        if (b === 'tinta') d.config.nfNcmTinta = fav.cod;
        if (b === 'locacao') d.config.nfNcmLocacao = fav.cod;
        I.save(); I.log('ncm-' + b, fav.cod); I.toast2('NCM ' + fav.cod + ' agora é o padrão de ' + b);
        return fxReRender('fiscal-ncm');
      }
      /* enviar xml */
      if (acao === 'xml-mes') { G.__fxXmlMes = a || G.__fxXmlMes; return fxReRender('fiscal-enviar-xml'); }
      if (acao === 'xml-pdf') { G.__fxXmlPdf = !!a; return; }
      if (acao === 'xml-preparar') { return fxReRender('fiscal-enviar-xml'); }
      if (acao === 'xml-copiar') { var em = (document.getElementById('fx-xml-email') || {}).value || ''; if (navigator.clipboard && em) navigator.clipboard.writeText(em).then(function () { I.toast2('E-mail copiado ✅'); }); return; }
      if (acao === 'xml-ver') { I.alert('XML não encontrados (' + (a === 'nfe' ? 'NF-e' : 'NFC-e') + ')', 'Notas do mês sem XML guardado: confira no PC que emitiu — a sincronização traz para todos. Se a emissão foi há pouco, aguarde o pacote da nuvem.'); return; }
      if (acao === 'xml-enviar') {
        var em2 = (document.getElementById('fx-xml-email') || {}).value || '';
        I.cfg().outras.emailEscritorio = em2; I.save();
        if (!em2) return I.alert('E-mail do escritório', 'Preencha o e-mail do contador antes de enviar (fica gravado na aba Outras das Configurações).');
        if (typeof G.nfPacoteContador === 'function') { try { G.nfPacoteContador(); } catch (e) { } I.log('xml-escritorio', G.__fxXmlMes + ' incluir PDFs: ' + !!G.__fxXmlPdf); }
        else I.alert('Pacote', 'O gerador de pacote .zip não respondeu — tente pela Central (Pacote do mês).');
        return;
      }
      /* config */
      if (acao === 'cfg-aba') { I.aplica(fxRaizDe('config-fiscal')); G.__fxCfgAba = a; return fxReRender('config-fiscal'); }
      if (acao === 'cfg-salvar') {
        var raiz = fxRaizDe('config-fiscal');
        I.aplica(raiz);
        d.config.nfCscId = String(raiz.csc.id || '').trim();
        d.config.nfCsc = String(raiz.csc.token || '');
        fxLimpaAliases(); I.save(); I.log('cfg-salva', G.__fxCfgAba);
        I.toast2('Configuração "' + G.__fxCfgAba + '" salva ✅');
        return fxReRender('config-fiscal');
      }
      if (acao === 'cfg-fcp-uf') { I.cfg().fcp.ufs[a] = Number(b); I.save(); return; }
      if (acao === 'inut-enviar') {
        var raiz2 = fxRaizDe('config-fiscal'); I.aplica(raiz2);
        var ini = parseInt(raiz2.inut.numIni, 10), fin = parseInt(raiz2.inut.numFin, 10);
        if (!ini || !fin || fin < ini) return I.alert('Intervalo inválido', 'Informe número inicial e final (final ≥ inicial).');
        if (String(raiz2.inut.motivo || '').trim().length < 15) return I.alert('Motivo curto', 'A SEFAZ pede justificativa com <b>pelo menos 15 letras</b> (ex.: NUMERAÇÃO FALHOU NA EMISSÃO).');
        if (!I.pode()) return I.alert('Sem permissão', 'Inutilizar numeração precisa da permissão <b>Emitir NF</b>.');
        G.__fxInutPend = { ini: ini, fin: fin, ano: raiz2.inut.ano, modelo: raiz2.inut.modelo, motivo: raiz2.inut.motivo };
        I.confirm('Inutilizar ' + ini + ' a ' + fin + '?', 'Modelo ' + raiz2.inut.modelo + ' · ano ' + P.esc(raiz2.inut.ano) + ' · motivo: <b>' + P.esc(raiz2.inut.motivo) + '</b><br><br>Isso aposenta números junto à Receita — <b>não tem como desfazer</b>.', function () {
          var enviador = G.nfInutilizarFaixa || G.nfInutilizar;
          d.config.nfInutilizacoes = d.config.nfInutilizacoes || [];
          d.config.nfInutilizacoes.push({ ini: G.__fxInutPend.ini, fin: G.__fxInutPend.fin, ano: G.__fxInutPend.ano, modelo: G.__fxInutPend.modelo, motivo: G.__fxInutPend.motivo, em: new Date().toISOString(), enviado: typeof enviador === 'function' });
          if (typeof enviador === 'function') { try { enviador(G.__fxInutPend); } catch (e) { } }
          else I.alert('Registrada, mas não enviada', 'A solicitação ficou registrada. O envio à SEFAZ usa o certificado do PC emissor (.exe) — prenda o motor e ela sai no próximo clique (sem sucesso falso).');
          fxLimpaAliases(); I.save(); I.log('inut-enviar', G.__fxInutPend.ini + '-' + G.__fxInutPend.fin);
          fxReRender('config-fiscal');
        }, 'Enviar Solicitação');
        return;
      }
    } catch (err) {
      try { I.alert('Ops — a tela respondeu com erro', P.esc(err.message || err) + '<br><span class="fx-mini">Nada foi perdido; reabra a tela pelo menu se precisar.</span>'); } catch (e) { }
    }
  };

  /* wrap final da navegação: as 6 telas pintam com o catálogo completo */
  function instalar() {
    var anterior = G.navigateTo;
    if (typeof anterior !== 'function') return false;
    if (!anterior.__fx614) {
      var embrulhado = function (view) {
        var r = anterior.apply(G, arguments);
        try { if (VIEWS.indexOf(view) >= 0) fxReRender(view); } catch (e) { }
        return r;
      };
      embrulhado.__fx614 = true;
      embrulhado.__nav612 = anterior.__nav612;
      embrulhado.__wxr613 = anterior.__wxr613;
      G.navigateTo = embrulhado;
    }
    return true;
  }
  if (!instalar() && typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () { instalar(); });
  }
  G.__v6014fxcInfo = 'FXCatalogo telas+acoes prontas';
})();
if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : globalThis).FX614_PURE;
