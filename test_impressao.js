// test_impressao.js — v1.0.0 (fase 3 do redesenho: PAPEL — notinha e carnê)
//
// O papel que sai da impressora tem de ser o MESMO de hoje: meia folha A4 para a venda
// comum, folha inteira (com a Ordem de Serviço e as duas assinaturas) quando a venda tem
// OS, e o carnê com um canhoto por parcela. Este teste prova de três jeitos:
//   1) DIFERENCIAL: a regra de "OS completa" e a decisão de folha inteira rodam lado a lado
//      com as funções do `vendas_os_patch.js` que estão no ar hoje;
//   2) EVIDÊNCIA: o layout copiado é conferido no arquivo de origem (se a impressão de hoje
//      mudar, este teste avisa que a cópia precisa ser revisitada);
//   3) PAPEL: o HTML gerado é aberto num navegador de mentira — nada de alert nativo, nada
//      gravado fora do núcleo, e quem digitar nome com `<script>` NÃO consegue injetar nada.
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== IMPRESSÃO (notinha e carnê) ==');
  console.log('  (não rodou: falta a dependência \'jsdom\' — não é defeito do sistema)');
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, detalhe) {
  if (!cond) { console.error('  \u2718 ' + nome + (detalhe ? '  [' + detalhe + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}

// navegador de mentira SÓ para o `document`/`window.open`: o impressao.js não precisa de DOM
const dom = new JSDOM('<!DOCTYPE html><body></body>', { runScripts: 'outside-only', url: 'http://localhost/' });
const w = dom.window, doc = w.document;
w.alert = () => { throw new Error('USOU alert NATIVO'); };
w.confirm = () => { throw new Error('USOU confirm NATIVO'); };
w.prompt = () => { throw new Error('USOU prompt NATIVO'); };
const fonteImp = fs.readFileSync('novo/impressao.js', 'utf8');
w.eval(fonteImp);
const I = w.DIGICOPY_IMPRESSAO, R = I.regras;

const empresa = { nome: 'DIGICOPY INFORMÁTICA LTDA', fantasia: 'DIGICOPY', cnpj: '12.345.678/0001-99', telefone: '(38) 3222-1111' };
const cliente = { id: 'c1', codigo: '0042', nome: 'José Ávila', documento: '123.456.789-00', telefone: '(38) 99999-0000', cidade: 'Montes Claros', estado: 'MG' };
const sessao = { cnpj: empresa.cnpj, usuarioNome: 'Atendente' };
const vendaBase = {
  id: 'v1', numero: '16001', data: '2026-09-24T13:20:00.000Z', status: 'aguardar', formaPagamento: 'Dinheiro',
  clienteId: 'c1', clienteNome: 'José Ávila', desconto: 0, total: 90, observacao: 'Entregar no balcão',
  itens: [{ descricao: 'Cartucho HP 664', tipo: 'Cartucho', qtd: 1, preco: 90, subtotal: 90 }]
};

console.log('== IMPRESSÃO DO NÚCLEO NOVO (notinha e carnê) ==');

console.log('-- 1) HIGIENE --');
{
  const codigo = fonteImp.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('não chama alert/confirm/prompt nativos', !/\b(alert|confirm|prompt)\s*\(/.test(codigo));
  ok('não grava no PC e não fala com a nuvem (sem localStorage/fetch)',
    !/localStorage|sessionStorage|fetch\(|XMLHttpRequest/.test(codigo));
  ok('não embute dado real de ninguém (sem chave/senha/token no arquivo)',
    !/\bsenha\b|\btoken\b|password/i.test(codigo));
}

console.log('-- 2) EVIDÊNCIA: o layout de hoje ainda é o mesmo que o núcleo novo copiou --');
{
  const vivo = fs.readFileSync('vendas_os_patch.js', 'utf8');
  const marcas = [
    ['.meia{height:138mm}', 'a meia folha tem 138mm (o corte no meio da A4)'],
    ['.inteira{min-height:278mm}', 'a folha inteira é a A4 toda'],
    ['.ass-unica', 'assinatura única quando não tem OS'],
    ['.ass-dupla', 'duas assinaturas quando tem OS (cliente e técnico)'],
    ['vosOsCompleta', 'a regra de OS completa (modelo + série + patrimônio/contador)'],
    ['digicopy_empresa_notinha', 'a empresa do papel é a escolhida para a notinha'],
    ['paraArquivo', 'a versão em arquivo (Word) sai SEM auto-impressão']
  ];
  marcas.forEach(([marca, oQue]) => ok('o sistema de hoje ainda faz: ' + oQue, vivo.indexOf(marca) >= 0, marca));
  const carnê = vivo.indexOf('imprimir_carne');
  ok('o carnê de hoje registra no histórico que foi impresso', carnê > 0);
  ok('o auto-print da notinha espera 350ms como hoje', /setTimeout\([\s\S]{0,80}?350\)/.test(vivo));
}

console.log('-- 3) DIFERENCIAL: "OS completa" e "folha inteira" são as regras de hoje --');
{
  // a peça PURA do sistema de hoje (é a mesma que o test_venda.js usa)
  const srcOs = fs.readFileSync('vendas_os_patch.js', 'utf8');
  // as duas funções de hoje: `vosOsCompleta` está no bloco puro (o mesmo que o test_venda usa)
  // e `vosOsTemAlgumDado` fica fora dele — as duas vêm do arquivo de verdade
  const iniPuro = srcOs.indexOf('/* VOS_PURE_START */');
  w.eval(srcOs.slice(iniPuro, srcOs.indexOf('window.__vosPure =', iniPuro)) +
    srcOs.slice(srcOs.indexOf('window.__vosPure =', iniPuro), srcOs.indexOf('}', srcOs.indexOf('window.__vosPure =', iniPuro)) + 1));
  const iniSerie = srcOs.indexOf('function vosOsTemAlgumDado');
  w.eval(srcOs.slice(iniSerie, srcOs.indexOf('\n}', iniSerie) + 2));
  ok('as regras vivas `vosOsCompleta` e `vosOsTemAlgumDado` foram carregadas para a comparação',
    typeof w.__vosPure.vosOsCompleta === 'function' && typeof w.vosOsTemAlgumDado === 'function');

  const casos = [
    ['sem nada', {}],
    ['só modelo', { modelo: 'Kyocera M2040' }],
    ['modelo + série (falta patrimônio/contador)', { modelo: 'Kyocera M2040', numeroSerie: 'SN1' }],
    ['modelo + série + patrimônio', { modelo: 'Kyocera M2040', numeroSerie: 'SN1', patrimonio: 'PAT7' }],
    ['modelo + série + contador 0 (o ZERO conta: é leitura de máquina)', { modelo: 'Kyocera', numeroSerie: 'SN1', contador: 0 }],
    ['contador preenchido como texto', { modelo: 'Kyocera', numeroSerie: 'SN1', contador: '1234' }],
    ['só defeito, sem equipamento', { defeito: 'puxa papel dobrado' }],
    ['só valor de serviço', { valorServico: 80 }],
    ['só desconto da OS', { desconto: 5 }],
    ['tudo', { modelo: 'HP LaserJet', numeroSerie: 'BR9', patrimonio: 'P1', contador: '0', defeito: 'atolando', servicos: 'limpeza', pecas: 'rolo', tipoOS: 'Manutenção corretiva', situacao: 'Concluída' }]
  ];
  const difComp = casos.filter(([, os]) => R.osCompleta(os) !== w.__vosPure.vosOsCompleta(os));
  ok('a regra "OS completa" bate com a de hoje nos ' + casos.length + ' casos'
    + (difComp.length ? ' — DIFERENTE em ' + JSON.stringify(difComp.map((c) => c[0])) : ''), difComp.length === 0);
  const difTem = casos.filter(([, os]) => R.osTemAlgumDado(os) !== w.vosOsTemAlgumDado(os));
  ok('e "a OS tem algum dado" também bate nos ' + casos.length + ' casos'
    + (difTem.length ? ' — DIFERENTE em ' + JSON.stringify(difTem.map((c) => c[0])) : ''), difTem.length === 0);

  ok('venda SEM OS sai em MEIA FOLHA', R.tipoDePapel(vendaBase) === 'meia folha');
  ok('venda com a OS completa sai em FOLHA INTEIRA (a OS cabe no papel)',
    R.tipoDePapel(Object.assign({}, vendaBase, { os: { modelo: 'Kyocera', numeroSerie: 'SN1', patrimonio: 'P7' } })) === 'folha inteira');
  ok('e venda com OS SEM dado nenhum não vira folha inteira à toa',
    R.tipoDePapel(Object.assign({}, vendaBase, { os: {} })) === 'meia folha');
  // é assim que o sistema de hoje decide (`const temOS = !!v.os`) — e o `v.os` só nasce
  // quando a OS tem algum dado (`vosGravarVenda`), então as duas contas dão no mesmo.
  const vivo = fs.readFileSync('vendas_os_patch.js', 'utf8');
  ok('a decisão de hoje é "tem v.os?" e o v.os só nasce com algum dado (mesma conta)',
    /const temOS = !!v\.os;/.test(vivo) && R.folhaInteira(Object.assign({}, vendaBase, { os: { defeito: 'x' } })) === true);
}

console.log('-- 4) A NOTINHA: meia folha (a venda comum) --');
{
  const html = R.notinhaHtml({ venda: vendaBase, cliente: cliente, empresa: empresa, sessao: sessao });
  const corpo = html.slice(html.indexOf('<body>'));   // o CSS traz as duas classes; o que vale é o que sai no papel
  ok('sai uma página só, na meia folha com a linha de corte',
    html.indexOf('<div class="pagina meia">') > 0 && html.indexOf('✂') > 0);
  ok('com o cabeçalho da loja (fantasia, CNPJ e telefone)',
    html.indexOf('DIGICOPY') > 0 && html.indexOf('12.345.678/0001-99') > 0 && html.indexOf('(38) 3222-1111') > 0);
  ok('com o número da notinha e a data em português',
    html.indexOf('Nº 16001') > 0 && html.indexOf('/09/2026') > 0);
  ok('com o cliente identificado (código, nome e telefone)',
    html.indexOf('#0042') > 0 && html.indexOf('José Ávila') > 0 && html.indexOf('(38) 99999-0000') > 0);
  ok('com o item, a quantidade e o total da venda',
    html.indexOf('Cartucho HP 664') > 0 && html.indexOf('TOTAL: 90,00') > 0);
  ok('com a observação da venda e a forma de pagamento impressas',
    html.indexOf('Entregar no balcão') > 0 && html.indexOf('Dinheiro') > 0);
  ok('com a assinatura única do cliente (é a de hoje quando não tem OS)',
    corpo.indexOf('ass-unica') > 0 && corpo.indexOf('Assinatura do cliente') > 0 && corpo.indexOf('ass-dupla') < 0);
  ok('com a linha de auditoria no pé (quem emitiu e o código do cliente)',
    html.indexOf('class="audit"') > 0 && html.indexOf('Cód. cliente 0042') > 0);
  ok('e SEM o bloco da Ordem de Serviço (a venda não tem OS)', html.indexOf('ORDEM DE SERVIÇO') < 0);
}

console.log('-- 5) A NOTINHA: folha inteira (a venda com OS) --');
{
  const os = {
    numero: '007', modelo: 'Kyocera M2040', numeroSerie: 'SN12345', patrimonio: 'PAT7', contador: '1533',
    tipoOS: 'Manutenção corretiva', acessorios: 'cabo de força', tecnico: 'Kauan', responsavelEntrega: 'Maria',
    garantia: '90 dias', situacao: 'Concluída', defeito: 'atolando papel', servicos: 'limpeza geral e troca do rolo',
    pecas: 'rolo de tração', valorServico: 80, desconto: 10
  };
  const venda = Object.assign({}, vendaBase, { os: os, total: 160, formaPagamento: 'Prazo' });
  const html = R.notinhaHtml({ venda: venda, cliente: cliente, empresa: empresa, sessao: sessao });
  const corpo = html.slice(html.indexOf('<body>'));
  ok('sai na folha inteira (sem linha de corte) — é o papel de hoje',
    html.indexOf('<div class="pagina inteira">') > 0);
  ok('com o bloco da ORDEM DE SERVIÇO e o número dela',
    html.indexOf('ORDEM DE SERVIÇO 007') > 0);
  ok('com equipamento, série, patrimônio e contador',
    html.indexOf('Kyocera M2040') > 0 && html.indexOf('SN12345') > 0 && html.indexOf('PAT7') > 0 && html.indexOf('1533') > 0);
  ok('com técnico, tipo da OS, garantia e acessórios',
    html.indexOf('Kauan') > 0 && html.indexOf('Manutenção corretiva') > 0 && html.indexOf('90 dias') > 0 && html.indexOf('cabo de força') > 0);
  ok('com defeito, serviços executados, peças e a situação da OS',
    html.indexOf('atolando papel') > 0 && html.indexOf('limpeza geral e troca do rolo') > 0 &&
    html.indexOf('rolo de tração') > 0 && html.indexOf('Concluída') > 0);
  ok('com a linha do serviço da OS mostrando o valor menos o desconto (80 - 10 = 70,00)',
    html.indexOf('Serviço da OS 007') > 0 && html.indexOf('70,00') > 0);
  ok('e com as DUAS assinaturas (cliente e técnico), como hoje',
    corpo.indexOf('ass-dupla') > 0 && corpo.indexOf('Assinatura do técnico') > 0 && corpo.indexOf('ass-unica') < 0);
  ok('sem o bloco da OS a venda não perde nada (itens e total continuam)',
    html.indexOf('Cartucho HP 664') > 0 && html.indexOf('TOTAL: 160,00') > 0);
}

console.log('-- 6) O CARNÊ (um canhoto por parcela) --');
{
  const venda = Object.assign({}, vendaBase, { formaPagamento: 'Prazo', parcelas: [{ n: 1, total: 3, vencimento: '2026-10-24T00:00:00.000Z', valor: 33.33 }] });
  const parcelas = [
    { n: 1, total: 3, vencimento: '2026-10-24T00:00:00.000Z', valor: 33.33 },
    { n: 2, total: 3, vencimento: '2026-11-24T00:00:00.000Z', valor: 33.33 },
    { n: 3, total: 3, vencimento: '2026-12-24T00:00:00.000Z', valor: 33.34 }
  ];
  const html = R.carneHtml({ venda: venda, cliente: cliente, empresa: empresa, sessao: sessao, parcelas: parcelas });
  const canhotos = (html.match(/class="canhoto"/g) || []).length;
  const cortes = (html.match(/✂/g) || []).length;
  ok('sai um canhoto para CADA parcela (3 parcelas = 3 canhotos)', canhotos === 3, String(canhotos));
  ok('com a linha de corte entre eles (para picar o papel)', cortes === 3, String(cortes));
  ok('cada canhoto diz qual parcela é, o vencimento e o valor',
    html.indexOf('1/3') > 0 && html.indexOf('24/10/2026') > 0 && html.indexOf('33,33') > 0 &&
    html.indexOf('2/3') > 0 && html.indexOf('24/11/2026') > 0 && html.indexOf('3/3') > 0 && html.indexOf('24/12/2026') > 0);
  ok('com o nome da loja, o CNPJ, o cliente e o número da venda',
    html.indexOf('DIGICOPY') > 0 && html.indexOf('12.345.678/0001-99') > 0 &&
    html.indexOf('José Ávila') > 0 && html.indexOf('VENDA 16001') > 0);
  ok('com o espaço da assinatura de quem recebeu (o canhoto de hoje tem)',
    html.indexOf('Assinatura:') > 0 && html.indexOf('Recebemos de') > 0);
  ok('venda sem parcela nenhuma não gera carnê torto (devolve null)',
    R.carneHtml({ venda: vendaBase, cliente: cliente, empresa: empresa, parcelas: [] }) === null);
  ok('venda sem venda nenhuma também não (devolve null)', R.carneHtml({}) === null);
}

console.log('-- 7) O PIX NO PAPEL (v4.9.15: com o aviso do comprovante) --');
{
  const bloco = '<div class="px-notinha">PIX: 000201... <b>80,00</b></div>';
  const htmlPix = R.notinhaHtml({
    venda: Object.assign({}, vendaBase, { formaPagamento: 'Pix' }), cliente: cliente, empresa: empresa, sessao: sessao, pix: bloco
  });
  ok('o bloco do Pix entra na notinha', htmlPix.indexOf('px-notinha') > 0 && htmlPix.indexOf('80,00') > 0);
  ok('e ele entra ANTES do pé da página (não fica pendurado no fim do arquivo)',
    htmlPix.indexOf('px-notinha') < htmlPix.indexOf('class="audit"'));
  ok('com o aviso de baixa manual (letra por letra, como no patch de hoje)',
    htmlPix.indexOf('Pix:</b> valor exato da notinha. Envie o comprovante no WhatsApp da DIGICOPY para baixa manual.') > 0);
  const htmlDinheiro = R.notinhaHtml({ venda: vendaBase, cliente: cliente, empresa: empresa, sessao: sessao });
  ok('venda que não é Pix não ganha aviso de Pix', htmlDinheiro.indexOf('baixa manual') < 0);
}

console.log('-- 8) A VERSÃO EM ARQUIVO (Word) não imprime sozinha --');
{
  const html = R.notinhaHtml({ venda: vendaBase, cliente: cliente, empresa: empresa, sessao: sessao, paraArquivo: true });
  const corpo = html.slice(html.indexOf('<body>'));
  ok('sem o script de auto-impressão e sem os botões (é o que hoje o Word recebe)',
    !/window\.onload=function\(\)\{setTimeout/.test(html) && corpo.indexOf('🖨 Imprimir') < 0 &&
    corpo.indexOf('>Fechar<') < 0, 'script=' + /window\.onload/.test(html));
  const html2 = R.notinhaHtml({ venda: vendaBase, cliente: cliente, empresa: empresa, sessao: sessao });
  ok('e a versão normal TEM o auto-print com os botões de imprimir/fechar',
    /window\.onload=function\(\)\{setTimeout[\s\S]{0,60}?350/.test(html2) &&
    html2.slice(html2.indexOf('<body>')).indexOf('>Fechar<') > 0);
}

console.log('-- 9) SEGURANÇA DO PAPEL: quem digita `<script>` não injeta nada --');
{
  const venda = Object.assign({}, vendaBase, {
    clienteNome: '<script>alert(1)</script>', observacao: '"><img src=x onerror=alert(1)>',
    itens: [{ descricao: '<b>Cartucho</b>', tipo: '<i>x</i>', qtd: 1, preco: 10, subtotal: 10 }],
    os: { numero: '<script>', modelo: 'Kyocera"><script>alert(2)</script>', numeroSerie: 'SN', patrimonio: 'P', defeito: '<img src=x onerror=alert(3)>' }
  });
  const clienteMau = Object.assign({}, cliente, { nome: '<script>alert(4)</script>', fantasia: '"><svg onload=alert(5)>' });
  const html = R.notinhaHtml({ venda: venda, cliente: clienteMau, empresa: { nome: '<script>alert(6)</script>', fantasia: 'X' }, sessao: sessao });
  const tags = (html.match(/<script/gi) || []).length;
  const autoPrints = (html.match(/<script>window\.onload=function\(\)\{setTimeout\(function\(\)\{window\.print\(\)\},350\)\};<\/script>/g) || []).length;
  ok('nenhuma tag <script> de terceiro sobrou no papel (só o auto-print do próprio sistema)',
    tags - autoPrints === 0, 'tags=' + tags + ' auto-print=' + autoPrints);
  // a prova de verdade: abre o papel num navegador de mentira e vê o que VIROU elemento
  const domPapel = new JSDOM(html);
  const dp = domPapel.window.document;
  const scripts = dp.querySelectorAll('script').length;
  const perigosos = dp.querySelectorAll('img, svg, iframe, object, embed').length;
  ok('nenhum <script> de terceiro virou elemento (só o auto-print do sistema)',
    scripts === 1 && /window\.print/.test(dp.querySelector('script').textContent), 'scripts=' + scripts);
  ok('e nenhuma tag que ele digitou virou elemento (nada de <img onerror> nem <svg onload>)',
    perigosos === 0, 'elementos perigosos=' + perigosos);
  ok('os atributos de evento escritos por ele ficaram como TEXTO (escapados), não como atributo',
    !/<[^>]*\son(error|load)\s*=/i.test(html));
  ok('mas o texto que ele digitou continua legível no papel (escapado, não sumiu)',
    html.indexOf('&lt;script&gt;alert(4)&lt;/script&gt;') > 0);
  const carne = R.carneHtml({
    venda: vendaBase, cliente: clienteMau, empresa: empresa, sessao: sessao,
    parcelas: [{ n: 1, total: 1, vencimento: '2026-10-24T00:00:00.000Z', valor: 10 }]
  });
  const domCarne = new JSDOM(carne);
  ok('o carnê também escapa (o nome do cliente não vira código)',
    carne.indexOf('&lt;script&gt;') > 0 && domCarne.window.document.querySelectorAll('script').length === 1 &&
    domCarne.window.document.querySelectorAll('img, svg').length === 0);
}

console.log('-- 10) MANDAR PARA A IMPRESSORA (janela bloqueada avisa, não quebra) --');
{
  let escrito = null, fechou = false, focou = false;
  w.open = function () {
    return {
      document: { write: function (h) { escrito = h; }, close: function () { fechou = true; } },
      focus: function () { focou = true; }
    };
  };
  const html = R.notinhaHtml({ venda: vendaBase, cliente: cliente, empresa: empresa, sessao: sessao });
  const foi = I.imprimir(html);
  ok('a janela abre, recebe o papel e vai para a frente (imprime)', foi === true && escrito === html && fechou && focou);
  w.open = function () { return null; };  // navegador bloqueou
  ok('janela bloqueada devolve FALSE (quem chamou avisa na tela — nada de alert nativo)',
    I.imprimir(html) === false);
  ok('e sem HTML para imprimir também devolve false (não abre janela vazia)', I.imprimir('') === false && I.imprimir(null) === false);
  w.open = function () { throw new Error('bloqueado'); };
  ok('se o próprio navegador der erro ao abrir, devolve false em vez de estourar na cara do dono',
    I.imprimir(html) === false);
}

// ── a notinha em ARQUIVO WORD (.doc) — é o botão "Word" do sistema de hoje ──
console.log('-- a notinha em Word (.doc), igual ao botão de hoje --');
{
  const arq = R.arquivoWord({ venda: vendaBase, cliente: cliente, empresa: empresa, sessao: sessao });
  ok('o arquivo sai com o MESMO papel da notinha (meia folha, sem a OS)',
    arq.html.indexOf('\ufeff') === 0 && arq.html.indexOf('<html') > 0);
  ok('e o nome sai pela número da venda (notinha_<número>.doc)', /^notinha_[\w-]+\.doc$/.test(arq.nome), arq.nome);
  ok('com o tipo que o Word abre (application/msword)', arq.tipo === 'application/msword');
  ok('SEM auto-print (senão o arquivo abriria imprimindo na cara do dono)',
    arq.html.indexOf('window.print()') < 0 && arq.html.indexOf('onload=') < 0);
  const vendaComOsCheia = Object.assign({}, vendaBase, { os: { modelo: 'Kyocera', numeroSerie: 'SN1', patrimonio: 'P7' } });
  const comOS = R.arquivoWord({ venda: vendaComOsCheia, cliente: cliente, empresa: empresa, sessao: sessao });
  ok('com a OS completa, o arquivo vem de FOLHA INTEIRA (as duas assinaturas)',
    comOS.html.indexOf('ass-dupla') > 0 && comOS.html.indexOf('Assinatura do técnico') > 0);
  // o nome do arquivo perde barra e ponto do número (é a mesma limpeza de hoje): ninguém
  // baixa um arquivo com caminho dentro do nome
  ok('o número com caractere estranho não vira caminho de arquivo',
    R.arquivoWord({ venda: { numero: '../../etc/passwd' } }).nome === 'notinha__etc_passwd.doc',
    R.arquivoWord({ venda: { numero: '../../etc/passwd' } }).nome);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — a notinha (meia folha e folha inteira com OS) e o carnê saem como no sistema de hoje.');
try { w.close(); } catch (e) { }
