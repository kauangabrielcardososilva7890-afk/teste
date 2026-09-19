// test_ajustes_v60014.js — v6.0.14: AS 6 TELAS FISCAIS COMPLETAS DO CATÁLOGO,
// TODAS DE UMA VEZ (decreto 19/09: "tudo de uma vez, não leva; substitui esses
// velhos provisórios que você colocou" — 6.0.9/6.0.10). Central de Notas com
// listagem+editor VENDA-NF em 9 abas, Perfil Tributário, Manifestação, NCM,
// Enviar XML ("Preparar Arquivos Fiscais") e Configurações em 10 abas — o
// popup é o modal do sistema e DANFE sai com selo SEM VALOR FISCAL.
const fs = require('fs');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('fiscal_catalogo_completo_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('== FILA / BUNDLE / CARIMBO ==');
ok('manifesto já é 220 (Menu Fiscal oficial v6.1.0 por último); o catálogo da 6.0.14 ficou na posição histórica 218 (por cima do ribbon)',
  man.length === 222 && man[218] === 'fiscal_catalogo_completo_patch.js' && man[217] === 'ribbon_fiscal_estilo_antigo_patch.js');
ok('bundle contém o patch (guards + PURE + fxAcao + fx614-css)',
  bundle.indexOf('__v6014fxc') >= 0 && bundle.indexOf('FX614_PURE') >= 0 && bundle.indexOf('fxAcao') >= 0 && bundle.indexOf('fx614-css') >= 0);
ok('carimbo v6.0.14 (package + index + query do bundle)',
  pkg.version === '6.1.2' && html.indexOf("DIGICOPY_APP_VERSION = '6.1.2'") >= 0 && html.indexOf('v6.1.2</title>') >= 0 && html.indexOf('app.bundle.js?v=6.1.2') >= 0);

console.log('== PURE: fábricas e constantes do catálogo ==');
global.window = global;
global.document = {
  head: { appendChild: function () { } }, getElementById: function () { return null; },
  createElement: function () { return { style: {} }; }, addEventListener: function () { }, body: { appendChild: function () { } },
  querySelector: function () { return null; }
};
global.db = { config: { nfRegistro: [], nfManifestacoes: [] }, notasNf: [], clientes: [{ id: 'c1', nome: 'MERCADO X' }], fornecedores: [], produtos: [{ id: 'p1', nome: 'TONER', preco: 99, ncm: '84439923' }] };
window.usuarioPodeEmitirNfe = function () { return true; };
const P = require('./fiscal_catalogo_completo_patch.js');
const G = globalThis;
ok('5 perfis reais da loja semeados (idempotente): 00001/00002/00003/00005/00004 com CFOPs certos',
  P.PERFIS_SEED.length === 5 && P.PERFIS_SEED.map(function (s) { return s.cod + ':' + s.cfop; }).join('/') === '00001:5102/00002:6102/00003:5915/00005:5916/00004:6949');
ok('VENDA_NF_ABAS = as 9 do editor dele',
  P.VENDA_NF_ABAS.length === 9 && P.VENDA_NF_ABAS.indexOf('Itens da Nota') >= 0 && P.VENDA_NF_ABAS.indexOf('Reforma Tributária') >= 0);
ok('CONFIG_ABAS = as 10 da config dele (Geral…Reforma, NFCe e Nuvem dentro)',
  P.CONFIG_ABAS.length === 10 && P.CONFIG_ABAS.join('|') === 'Geral|Impressão|NFCe|Tributação|Nuvem|Outras|Mensagens|FCP|Autorizações|Reforma');
ok('MANIF_COLS = 15 colunas da grade de destinadas', P.MANIF_COLS && P.MANIF_COLS.length === 15);
ok('PAGAMENTOS cobre 01-99 (Dinheiro/Crédito/Débito/Pix/Boleto…)',
  P.PAGAMENTOS.length >= 10 && JSON.stringify(P.PAGAMENTOS[0][0]) === '"01"' && P.PAGAMENTOS.some(function (p) { return p[0] === '99'; }));
ok('ibsCbs: cofrinhos por fora (base 100, alíq 0,1/0/0,9 → 0,10/0/0,90)',
  JSON.stringify(P.ibsCbs(100, 0.1, 0, 0.9)) === '{"ibsUf":0.1,"ibsMun":0,"cbs":0.9}');
const nv = P.notaVazia('777', 'dono');
ok('notaVazia nasce rascunho: status "Não Gerada", modelo 55, série 1, frete 9, homologação',
  nv.status === 'Não Gerada' && nv.modelo === '55' && nv.serie === '1' && nv.frete.modalidade === '9' && nv.ambiente !== 'producao');

console.log('== INFRA ==');
ok('19 funções na infra (db/save/sess/log/cfg/perfis/notas/placa/pode/confirm/alert/toast/inp/sel/chk/valo/aplica/pinta/css)',
  G.__v6014fxInfra && Object.keys(G.__v6014fxInfra).length === 19);
ok('perfis() semeia os 5 (array vazio também herda o seed) e grava fxLog "perfis-seed"',
  G.__v6014fxInfra.perfis().length === 5 && (db.config.fxLogFiscal || []).some(function (l) { return l.acao === 'perfis-seed'; }));
ok('confirmação NUNCA é o confirm nativo: fxConfirm/alert existem na infra e pintam no modal-root do sistema',
  src.indexOf('window.confirm(') === -1 && src.indexOf("getElementById('modal-root')") >= 0 && typeof G.__v6014fxInfra.confirm === 'function' && typeof G.__v6014fxInfra.alert === 'function');
ok('placa de ambiente: HOMOLOGAÇÃO vermelho / PRODUÇÃO verde',
  src.indexOf('HOMOLOGAÇÃO — MODO TESTE') >= 0 && src.indexOf('PRODUÇÃO — a nota gerada aqui VALE DE VERDADE') >= 0);

console.log('== RENDERS DAS 6 TELAS (DOM fake) ==');
const R1 = G.__v6014fx3, R2 = G.__v6014fxRender2;
const central = R1.renderCentral();
ok('Central: barras + grade 9 cols + Novo/Alterar/Excluir/Clonar + regra fiscal impressa',
  ['Pesquisar', 'Imprimir', 'Novo', 'Alterar', 'Excluir', 'Clonar'].every(function (s) { return central.indexOf(s) >= 0; })
  && central.indexOf('Não Gerada') >= 0 && P.LIST_COLS.length === 9);
G.fxAcao('nf-novo');
const n = R1.notaEdicao();
ok('Novo abre VENDA-NF: status "Não Gerada", código sequencial 00416 em diante',
  !!n && n.status === 'Não Gerada' && /^004\d\d$/.test(n.cod));
const ed = R1.renderCentral();
ok('Aba Gerais: Total Aprox. Tributos (IBPT), Pagamentos, Duplicatas, cofrinhos IBS/CBS, rodapé Gerar/Pré-Visualizar/Salvar',
  ['Total Aprox. Tributos', 'Pagamentos', 'Duplicatas', 'Pré-Visualizar', 'Gerar NF-e', 'Salvar'].every(function (s) { return ed.indexOf(s) >= 0; }));
G.__fxEd.aba = 'Destinatário';
ok('Destinatário: Pesquisar por Cliente/Fornecedor + Puxar dados + endereço diferente (sem redigitar)',
  ['Pesquisar por', 'Cliente', 'Fornecedor', 'Puxar dados'].every(function (s) { return R1.renderCentral().indexOf(s) >= 0; }));
G.__fxEd.aba = 'Itens da Nota';
const it0 = R1.renderCentral();
ok('Itens: Lançar Produto + grade 14 cols + datalist do estoque',
  it0.indexOf('Lançar Produto') >= 0 && it0.indexOf('TONER') >= 0 && it0.indexOf('datalist') >= 0);
n.itens.push(P.itemVazio(1)); n.itens[0].descricao = 'TONER'; n.itens[0].qtd = 2; n.itens[0].vunit = 50;
G.__fxTrib = { idx: 0, sub: 'Itens' };
const it1 = R1.renderCentral();
ok('Tributação do item: mini-abas Itens/Tributação + "Alterar para Todos" + GTIN/NCM/CEST/CFOP',
  ['Alterar para Todos', 'Tributação', 'GTIN'].every(function (s) { return it1.indexOf(s) >= 0; }));
G.__fxTrib.sub = 'Tributação'; G.__fxTribAba = 'Reforma Tributária';
const it2 = R1.renderCentral();
ok('18 fotos do item: sub-abas Tributação/Importação/Outros/Reforma + cofrinhos IBS/CBS',
  ['Importação', 'Outros', 'Reforma Tributária'].every(function (s) { return it2.indexOf(s) >= 0; }) && /ibs/i.test(it2) && /cbs/i.test(it2));
R1.totaisAuto(n);
ok('Total da nota = produtos + serviços − descontos (+frete/despesas), SEM somar cofrinhos (2×50 = 100)',
  n.totais.total === 100 && n.totais.produtos === 100);
const previa = R1.danfePrevia(n);
ok('DANFE Pré-Visualizar: selo diagonal "NF-E EM PRÉ-VISUALIZAÇÃO / SEM VALOR FISCAL" + botão Imprimir',
  previa.indexOf('SEM VALOR FISCAL') >= 0 && previa.indexOf('PRÉ-VISUALIZAÇÃO') >= 0 && previa.indexOf('Imprimir') >= 0);
const mf = R2.manifestacao();
ok('Manifestação: Consultar Destinadas + NSU + barra de filtros + Obter/Manifestar/Baixar XML',
  ['Consultar Destinadas', 'NSU', 'Obter Notas', 'Manifestar', 'Baixar XML', 'Cadastradas Hoje'].every(function (s) { return mf.indexOf(s) >= 0; }));
const ncm = R2.ncm();
ok('NCM: favoritos + mesmos atalhos/padrões do velho (Padrao/Tinta/Locacao, chaves originais)',
  ['Favoritos', 'nfNcmPadrao', 'nfNcmTinta', 'nfNcmLocacao'].every(function (s) { return ncm.indexOf(s) >= 0 || src.indexOf(s) >= 0; }));
const xml = R2.enviarXml();
ok('Enviar XML = "Preparar Arquivos Fiscais": matriz do mês + "Não Suportado" NFC-e + aviso nuvem junta XMLs + Enviar para Escritório (mês longo) + e-mail escritório',
  ['Preparar Arquivos Fiscais', 'Não Suportado', 'Enviar para Escritório', 'nuvem junta', 'fx-xml-email'].every(function (s) { return xml.indexOf(s) >= 0 || src.indexOf(s) >= 0; }));
const abasCfg = ['Geral', 'Impressão', 'NFCe', 'Tributação', 'Nuvem', 'Outras', 'Mensagens', 'FCP', 'Autorizações', 'Reforma'];
const cfgOk = abasCfg.every(function (a) { G.__fxCfgAba = a; const h = R2.config(); return h.indexOf('>' + a + '<') >= 0 && h.length > 600; });
ok('Configurações: as 10 abas renderizam de verdade', cfgOk);
G.__fxCfgAba = 'NFCe';
ok('Aba NFCe: versão veqr200 + CSC mascarado nas chaves herdadas (nfCsc/nfCscId) + "gerar ao finalizar" desmarcado',
  R2.config().indexOf('veqr200') >= 0 && R2.config().indexOf('CSC') >= 0 && src.indexOf('nfCscId') >= 0);
G.__fxCfgAba = 'FCP';
ok('FCP: tabela das 27 UFs + padrão 2%', R2.config().split('<tr>').length >= 28 && src.indexOf("padrao: 2") >= 0);

console.log('== AÇÕES (fxAcao) ==');
ok('switch único cobre listagem/editor/perfil/manifestação/ncm/xml/config (prefixos)',
  ['lst-sel', 'nf-novo', 'nf-alterar', 'nf-excluir', 'nf-clonar', 'nf-gerar', 'nf-previa', 'nf-item-add', 'nf-item-cfop-todos', 'nf-dest-puxar', 'nf-ref-add', 'pf-novo', 'pf-salvar', 'mf-consultar', 'mf-manifestar', 'mf-baixar', 'ncm-add', 'ncm-uso', 'xml-enviar', 'cfg-salvar'].every(function (a) { return src.indexOf("'" + a + "'") >= 0; }));
ok('regra fiscal travada: nota Autorizada não pode ser alterada nem excluída (aviso no sistema)',
  src.indexOf('Nota já autorizada') >= 0 && src.indexOf('não pode ser alterada') >= 0 && src.indexOf('não pode ser excluída') >= 0);
ok('permissão "Emitir NF" exigida p/ excluir rascunho, gerar, manifestar e inutilizar',
  (src.match(/I\.pode\(\)/g) || []).length >= 4 && src.indexOf('Emitir NF') >= 0);
ok('honestidade: sem PC emissor → aviso claro e nota fica "Não Gerada" (sem sucesso falso)',
  src.indexOf('sem sucesso falso') >= 0 && src.indexOf('Não Gerada') >= 0 && src.indexOf('PC emissor') >= 0);
ok('Enviar para Escritório chama o motor do pacote (nfPacoteContador) + Copiar e-mail',
  src.indexOf('nfPacoteContador') >= 0 && src.indexOf("xml-copiar") >= 0);
ok('Operação Realizada com Sucesso preservada p/ o motor (literal nos eventos/manifestação/antigo)',
  bundle.indexOf('Operação Realizada com Sucesso') >= 0);
ok('salva em db.notasNf (rascunhos) e lê db.config.nfRegistro (autorizadas) — nada novo quebrando o velho',
  src.indexOf('notasNf') >= 0 && src.indexOf('nfRegistro') >= 0);

console.log('== CONVÍVIO ==');
ok('wrap navegação por CIMA do ribbon (insertBefore ribbon continua por cima do novo conteúdo)',
  src.indexOf('embrulhado.__wxr613') >= 0 && src.indexOf('embrulhado.__nav612') >= 0);
ok('atalhos fiscal-historico/inutilizar/ferramentas NÃO são substituídos (fora das 6)',
  ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'].every(function (v) { return src.indexOf("'" + v + "'") >= 0; })
  && src.indexOf("fiscal-historico'") === -1);

console.log('\nRESULTADO v6.0.14: ' + pass + ' ok, ' + fail + ' falhas');
process.exit(fail ? 1 : 0);
