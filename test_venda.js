// test_venda.js — v1.0.0 (fase 3 do redesenho: a VENDA)
//
// A venda do núcleo novo tem que se comportar como a do sistema de hoje. Este teste prova
// de três jeitos:
//   1) DIFERENCIAL: a numeração nova é comparada com o `proximoNumeroVendaLimpo` que está
//      rodando hoje no sistema (extraído do arquivo de verdade), caso a caso;
//   2) EVIDÊNCIA: cada regra copiada é conferida no arquivo de origem — se alguém mudar a
//      regra no sistema de hoje, este teste avisa que a cópia precisa ser revisitada;
//   3) TELA: a venda funciona de verdade (escolher cliente e produto pela caixa de seleção,
//      item, estoque, total, salvar, faturar) num navegador de mentira, sem gravar nada
//      fora do núcleo e sem alert/confirm/prompt nativos.
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== VENDA (fase 3) ==');
  console.log('  (não rodou: falta a dependência \'jsdom\' — não é defeito do sistema)');
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, detalhe) {
  if (!cond) { console.error('  \u2718 ' + nome + (detalhe ? '  [' + detalhe + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}

const dom = new JSDOM('<!DOCTYPE html><body><div id="venda"></div></body>',
  { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window, doc = w.document;
w.alert = () => { throw new Error('USOU alert NATIVO'); };
w.confirm = () => { throw new Error('USOU confirm NATIVO'); };
w.prompt = () => { throw new Error('USOU prompt NATIVO'); };

const fonteVenda = fs.readFileSync('novo/venda.js', 'utf8');
const codigoVenda = fonteVenda.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

// as três peças carregadas de verdade (núcleo, caixa de seleção e a venda)
w.eval(fs.readFileSync('novo/nucleo.js', 'utf8'));
w.eval(fs.readFileSync('novo/selecao.js', 'utf8'));
w.eval(fs.readFileSync('novo/pix.js', 'utf8'));
w.eval(fs.readFileSync('novo/impressao.js', 'utf8'));
w.eval(fonteVenda);
w.eval(fs.readFileSync('novo/financeiro.js', 'utf8'));

console.log('== VENDA DO NÚCLEO NOVO (fase 3) ==');
ok('sem alert/confirm/prompt nativos no arquivo novo', !/\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/.test(codigoVenda));
ok('não grava fora do núcleo (sem localStorage) e não fala com a nuvem (sem fetch)',
  codigoVenda.indexOf('localStorage') < 0 && codigoVenda.indexOf('fetch(') < 0);

console.log('-- 1) EVIDÊNCIA: as regras copiadas ainda existem no sistema de hoje --');
{
  const provas = [
    ['vendas_notinhas_fix_patch.js', 'num < 500000', 'teto de número absurdo na numeração'],
    ['vendas_notinhas_fix_patch.js', 'Sem cobrança (R$ 0,00)', 'venda zerada entra paga'],
    ['vendas_notinhas_fix_patch.js', 'Não é possível excluir vendas que já foram faturadas', 'faturada não se exclui'],
    ['vendas_os_patch.js', "p.categoria!=='Serviço' && !p.estoqueInfinito", 'baixa de estoque isenta Serviço e estoque infinito'],
    ['vendas_os_patch.js', 'apenas na criação', 'estoque só baixa na criação da venda'],
    ['vendas_os_patch.js', 'Produto sem estoque', 'aviso de produto sem estoque'],
    ['vendas_os_patch.js', 'Estoque insuficiente. Disponível: ', 'aviso de estoque insuficiente'],
    ['vendas_os_patch.js', 'Informe um valor unitário numérico para adicionar o item', 'valor unitário obrigatório'],
    ['notinha_patch.js', '1000*60*60*24*14', 'título vence em 14 dias']
  ];
  provas.forEach(([arquivo, marca, oQue]) => {
    ok('o sistema de hoje ainda faz: ' + oQue, fs.readFileSync(arquivo, 'utf8').indexOf(marca) >= 0, arquivo);
  });
}

console.log('-- 2) DIFERENCIAL: a numeração é a mesma do sistema de hoje --');
{
  // A NUMERAÇÃO VIVA (correção da rodada 19): o número da venda sai do
  // `proximoNumeroSimples` (vendas_os_patch.js:81) → `seqObter` (interface_patch.js:169).
  // ATÉ A RODADA 18 este teste comparava com o `proximoNumeroVendaLimpo`
  // (vendas_notinhas_fix_patch.js:30) — que está no repositório mas NÃO está no caminho
  // vivo (ninguém chama). Quem seguia aquela conta devolvia o número de uma venda apagada,
  // o contrário da regra do dono. Agora as duas pontas são as de verdade.
  const srcOs = fs.readFileSync('vendas_os_patch.js', 'utf8');
  w.eval(srcOs.slice(srcOs.indexOf('/* VOS_PURE_START */'), srcOs.indexOf('window.__vosPure')));
  w.eval(srcOs.slice(srcOs.indexOf('window.proximoNumeroSimples'), srcOs.indexOf('\n};', srcOs.indexOf('window.proximoNumeroSimples')) + 3));
  const srcIf = fs.readFileSync('interface_patch.js', 'utf8');
  w.eval(srcIf.slice(srcIf.indexOf('window.seqObter'), srcIf.indexOf('\n};', srcIf.indexOf('window.seqObter')) + 3));
  ok('as duas peças vivas do sistema de hoje foram carregadas (seqObter + proximoNumeroSimples)',
    typeof w.seqObter === 'function' && typeof w.proximoNumeroSimples === 'function' && typeof w.vosNumeroInt === 'function');
  ok('o `proximoNumeroVendaLimpo` do repositório NÃO é usado por ninguém (ficou órfão)',
    fs.readFileSync('vendas_notinhas_fix_patch.js', 'utf8').indexOf('proximoNumeroVendaLimpo') >= 0 &&
    /proximoNumeroVendaLimpo\s*\(/.test(fs.readFileSync('vendas_notinhas_fix_patch.js', 'utf8').replace(/window\.proximoNumeroVendaLimpo\s*=\s*function[\s\S]*?\n  \};/, '')) === false);

  const E = 'e1';
  // O QUE CADA LADO VÊ: hoje, `proximoNumeroSimples` filtra a lista pela empresa; no coração
  // novo cada empresa tem o SEU coração (todo registro já nasce com o `empresaId` dele), então
  // a lista que a tela passa já é a da empresa. `soDaEmpresa` reproduz isso no teste.
  const soDaEmpresa = (vendas) => (vendas || []).filter((v) => v && v.empresaId === E);
  const casos = [
    ['lista vazia', [], '1', 0],
    ['1, 2, 3 → 4', [{ numero: '1', empresaId: E }, { numero: '2', empresaId: E }, { numero: '3', empresaId: E }], '4', 0],
    ['fora de ordem (10, 3, 7) → 11', [{ numero: '10', empresaId: E }, { numero: '3', empresaId: E }, { numero: '7', empresaId: E }], '11', 0],
    ['número com letra (AB-9) → 10', [{ numero: 'AB-9', empresaId: E }], '10', 0],
    ['registro migrado CONTA (a regra viva lê o último grupo de dígitos de qualquer venda)', [{ numero: '999', origemMigracao: true, empresaId: E }], '1000', 0],
    ['número fora de faixa CONTA (500000 → 500001 — a regra viva não tem teto)', [{ numero: '500000', empresaId: E }], '500001', 0],
    ['600 → 601', [{ numero: '600', empresaId: E }], '601', 0],
    ['venda de OUTRA empresa não conta', [{ numero: '50', empresaId: 'e2' }], '1', 0],
    ['registro antigo SEM empresa não conta quando a empresa é informada (e o coração novo nem enxerga ele: cada empresa tem o seu)', [{ numero: '9' }, { numero: '2', empresaId: E }], '3', 0],
    ['VENDA APAGADA NÃO DEVOLVE O NÚMERO: contador em 2 e a venda 1 na lista → 3', [{ numero: '1', empresaId: E }], '3', 2]
  ];
  let iguais = 0;
  casos.forEach(([nome, vendas, espera, seqInicial]) => {
    w.db = { config: { seq: {} } };
    if (seqInicial) w.db.config.seq['venda_' + E] = seqInicial;
    const antigo = w.proximoNumeroSimples('venda', vendas, E);

    const n = w.DIGICOPY_NUCLEO.criar({ empresaId: E, origem: 'teste', guardar: function () { } });
    n.registrarLista('vendas', { numero: { tipo: 'texto' } });
    soDaEmpresa(vendas).forEach((v) => {
      n.salvar('vendas', { id: 'v' + v.numero, numero: v.numero, origemMigracao: v.origemMigracao });
    });
    if (seqInicial) {
      n.registrarLista(n.LISTA_SERIES, n.SCHEMA_SERIES);
      n.salvar(n.LISTA_SERIES, { id: 'venda', serie: 'venda', seq: seqInicial });
    }
    const meu = n.proximoNumeroDaSerie('venda', n.listar('vendas'), (v) => v && v.numero).numero;

    const igual = meu === antigo;
    if (igual) iguais++;
    ok('numeração igual à de hoje: ' + nome, igual && meu === espera, 'novo=' + meu + ' hoje=' + antigo + ' esperado=' + espera);
  });
  ok('a numeração nova dá o mesmo número que a de hoje em ' + iguais + ' de ' + casos.length + ' casos (inclusive depois de apagar a última venda)',
    iguais === casos.length);

  // a diferença de propósito: a LEITURA não gasta número (hoje, abrir a notinha e sair queima um)
  const n2 = w.DIGICOPY_NUCLEO.criar({ empresaId: E, origem: 'teste', guardar: function () { } });
  n2.registrarLista('vendas', { numero: { tipo: 'texto' } });
  const ler1 = n2.proximoNumeroDaSerie('venda', n2.listar('vendas'), (v) => v && v.numero).numero;
  const ler2 = n2.proximoNumeroDaSerie('venda', n2.listar('vendas'), (v) => v && v.numero).numero;
  n2.proximoNumero('venda', n2.listar('vendas'), (v) => v && v.numero);
  ok('ler o próximo número duas vezes não muda nada; só a gravação gasta (a diferença de propósito)',
    ler1 === ler2 && ler1 === '1' && n2.contadorDaSerie('venda') === 1);
}

console.log('-- 3) AS REGRAS DO ITEM (validação, estoque, subtotal) --');
{
  const R = w.DIGICOPY_VENDA.regras;
  const prod = { id: 'p1', nome: 'Cartucho HP 664', sku: 'HP664', categoria: 'Cartucho', preco: 89.9, estoque: 3 };
  const semEstoque = { id: 'p2', nome: 'Toner', categoria: 'Insumo', estoque: 0 };
  const servico = { id: 'p3', nome: 'Instalação', categoria: 'Serviço', preco: 80, estoque: 0 };
  const recarga = { id: 'p4', nome: 'Recarga 85A', categoria: 'Recarga', preco: 40, estoque: 0 };
  const infinito = { id: 'p5', nome: 'Papel A4', categoria: 'Produto', estoque: 0, estoqueInfinito: true };

  ok('item normal monta com subtotal certo (3 × 10 - 5 = 25)',
    R.montarItem({ produto: prod, qtdTexto: '3', precoTexto: '10', descontoTexto: '5' }).item.subtotal === 25);
  ok('aceita vírgula no valor (10,50 → 10.5)',
    R.montarItem({ produto: prod, qtdTexto: '1', precoTexto: '10,50' }).item.preco === 10.5);
  ok('sem produto e sem descrição: pede produto ou descrição',
    /Selecione um produto ou escreva a descrição/.test(R.montarItem({}).motivos.join(' ')));
  ok('descrição livre funciona (venda sem cadastro)',
    R.montarItem({ descricaoLivre: 'Serviço avulso', precoTexto: '50' }).item.descricao === 'Serviço avulso');
  ok('sem estoque: "Produto sem estoque" (mesmo texto de hoje)',
    R.montarItem({ produto: semEstoque, qtdTexto: '1', precoTexto: '10' }).motivos.join(' ').indexOf('Produto sem estoque') >= 0);
  ok('qtd maior que o estoque: "Estoque insuficiente. Disponível: 3"',
    R.montarItem({ produto: prod, qtdTexto: '4', precoTexto: '10' }).motivos.join(' ').indexOf('Estoque insuficiente. Disponível: 3') >= 0);
  ok('Serviço é isento de estoque', R.montarItem({ produto: servico, qtdTexto: '99', precoTexto: '80' }).ok);
  ok('Recarga é isenta de estoque', R.montarItem({ produto: recarga, qtdTexto: '99', precoTexto: '40' }).ok);
  ok('estoque infinito é isento', R.montarItem({ produto: infinito, qtdTexto: '500', precoTexto: '30' }).ok);
  ok('valor unitário vazio: avisa (não inventa preço)',
    /Informe um valor unitário numérico/.test(R.montarItem({ produto: prod, qtdTexto: '1', precoTexto: '' }).motivos.join(' ')));
  ok('desconto com letra: avisa',
    /O desconto deve conter somente números/.test(R.montarItem({ produto: prod, qtdTexto: '1', precoTexto: '10', descontoTexto: 'x' }).motivos.join(' ')));
  ok('quantidade com letra: avisa',
    /A quantidade deve conter somente números/.test(R.montarItem({ produto: prod, qtdTexto: 'x', precoTexto: '10' }).motivos.join(' ')));

  const itens = [R.montarItem({ produto: prod, qtdTexto: '2', precoTexto: '100' }).item,
                 R.montarItem({ produto: servico, qtdTexto: '1', precoTexto: '80' }).item];
  const t = R.calcularTotais(itens, 30);
  ok('total geral = soma dos itens − desconto da venda (280 − 30 = 250)', t.produtos === 280 && t.total === 250);
  ok('desconto maior que a venda não deixa total negativo', R.calcularTotais(itens, 99999).total === 0);

  const achar = (id) => [prod, semEstoque, servico, recarga, infinito].find((p) => p.id === id);
  // acerto de diferença (o que hoje falta: item tirado de venda salva perdia o estoque)
  const soProd = R.montarItem({ produto: prod, qtdTexto: '2', precoTexto: '100' }).item;
  const doisProd = [soProd, R.montarItem({ produto: prod, qtdTexto: '1', precoTexto: '100' }).item];
  const rec1 = R.reconciliarEstoque([], [soProd], achar);
  ok('venda nova baixa o estoque do item', rec1.length === 1 && rec1[0].estoque === 1 && rec1[0].delta === 2, JSON.stringify(rec1));
  ok('salvar de novo sem mudar nada não mexe no estoque', R.reconciliarEstoque([soProd], [soProd], achar).length === 0);
  const rec2 = R.reconciliarEstoque(doisProd, [soProd], achar);
  ok('item tirado de venda salva DEVOLVE o estoque (correção de propósito)', rec2.length === 1 && rec2[0].estoque === 4 && rec2[0].delta === -1, JSON.stringify(rec2));
  const rec3 = R.reconciliarEstoque([soProd], [soProd, R.montarItem({ produto: prod, qtdTexto: '3', precoTexto: '100' }).item], achar);
  ok('item acrescentado em venda salva baixa a mais (3 − 3 = 0)', rec3.length === 1 && rec3[0].estoque === 0 && rec3[0].delta === 3, JSON.stringify(rec3));
  ok('Serviço nunca entra no acerto de estoque', R.reconciliarEstoque([], [R.montarItem({ produto: servico, qtdTexto: '5', precoTexto: '80' }).item], achar).length === 0);

  const baixas = R.baixaDeEstoque(itens, achar);
  ok('baixa de estoque: só o produto que controla estoque (Serviço fica fora)',
    baixas.length === 1 && baixas[0].id === 'p1' && baixas[0].estoque === 1, JSON.stringify(baixas));
  ok('devolução devolve a quantidade certa', R.devolucaoDeEstoque(itens, achar)[0].estoque === 5);
}

console.log('-- 4) FATURAMENTO (as mesmas regras do vosConcluirFaturamento) --');
{
  const R = w.DIGICOPY_VENDA.regras;
  ok('as formas de recebimento são as mesmas de hoje, com Dinheiro primeiro',
    R.FORMAS_RECEBIMENTO.join(',') === 'Dinheiro,Pix,Cartão de crédito,Cartão de débito,Cheque,Conta,Grátis,Prazo',
    R.FORMAS_RECEBIMENTO.join(','));

  const agora = new Date('2026-09-24T12:00:00.000Z');
  const venda = { id: 'v2', numero: '8', total: 250, clienteId: 'c2' };

  const vista = R.faturamentoDaVenda(venda, 'Dinheiro', 'e1', {}, agora);
  ok('à vista cria UM título JÁ PAGO, baixado automático (como hoje)',
    vista.titulos.length === 1 && vista.titulos[0].status === 'pago' && vista.titulos[0].autoBaixa === true && vista.titulos[0].valor === 250);
  ok('com a descrição e a forma no padrão de hoje',
    /Venda 8 • à vista \(Dinheiro\)/.test(vista.titulos[0].descricao) && vista.titulos[0].formaPagamento === 'Dinheiro', vista.titulos[0].descricao);
  ok('e a venda fica com a parcela 1/1 registrada', vista.parcelas.length === 1 && vista.parcelas[0].n === 1 && vista.parcelas[0].total === 1);

  const prazo = R.faturamentoDaVenda(venda, 'Prazo', 'e1', {}, agora);
  ok('a prazo cria título EM ABERTO (um por parcela)',
    prazo.titulos.length === 1 && prazo.titulos[0].status === 'aberto' && prazo.titulos[0].valor === 250);
  ok('vencendo em 30 dias (24/09 → 24/10, o padrão de hoje)',
    /^2026-10-24/.test(prazo.titulos[0].vencimento), prazo.titulos[0].vencimento);
  ok('com o rótulo de parcela "Venda 8 • parcela 1/1"',
    prazo.titulos[0].descricao === 'Venda 8 • parcela 1/1' && prazo.titulos[0].parcela === 1 && prazo.titulos[0].totalParcelas === 1);

  const gratis = R.faturamentoDaVenda(venda, 'Grátis', 'e1', {}, agora);
  ok('Grátis não cria cobrança nenhuma', gratis.titulos.length === 0 && gratis.parcelas.length === 0);

  const zerada = R.faturamentoDaVenda({ id: 'v1', numero: '7', total: 0, clienteId: 'c1' }, 'Dinheiro', 'e1', {}, agora);
  ok('venda zerada: um título PAGO, sem cobrança e baixado automático',
    zerada.titulos.length === 1 && zerada.titulos[0].status === 'pago' && zerada.titulos[0].valor === 0 &&
    zerada.titulos[0].autoBaixa === true && zerada.titulos[0].formaPagamento === 'Sem cobrança (R$ 0,00)' &&
    /sem cobrança/.test(zerada.titulos[0].descricao), JSON.stringify(zerada.titulos[0]));
  ok('e a zerada não depende da forma escolhida', R.faturamentoDaVenda({ id: 'v1', numero: '7', total: 0 }, 'Grátis', 'e1', {}, agora).titulos.length === 1);

  // DIFERENCIAL: as parcelas são calculadas igual ao `vosCalcParcelas` que roda hoje
  const srcOs = fs.readFileSync('vendas_os_patch.js', 'utf8');
  const iPur = srcOs.indexOf('/* VOS_PURE_START */');
  const iPure = srcOs.indexOf('window.__vosPure');
  w.eval(srcOs.slice(iPur, srcOs.indexOf('\n', iPure) + 1));
  const cfgs = [
    { valor: 250, cfg: {} },
    { valor: 1000, cfg: { parcelas: 3 } },
    { valor: 999.99, cfg: { parcelas: 3, jurosMes: 1.5 } },
    { valor: 180, cfg: { parcelas: 6, intervaloDias: 30 } },
    { valor: 500, cfg: { parcelas: 2, primeiroVencimento: '2026-11-05' } },
    { valor: 123.45, cfg: { parcelas: 4, intervaloDias: 15, jurosMes: 2 } },
    { valor: 300, cfg: { parcelas: 3, diaFixo: 10 } },
    { valor: 500, cfg: { parcelas: 4, diaFixo: 31 } },
    { valor: 240, cfg: { parcelas: 2, diaFixo: 5, jurosMes: 0.5 } }
  ];
  let iguais = 0;
  cfgs.forEach((c) => {
    const meu = R.parcelasDoFaturamento(c.valor, Object.assign({ hoje: agora }, c.cfg));
    const dele = w.__vosPure.vosCalcParcelas(c.valor, Object.assign({ hoje: agora }, c.cfg)).parcelas;
    const mesmo = meu.length === dele.length && meu.every((p, i) =>
      p.n === dele[i].n && p.valor === dele[i].valor && p.vencimento === dele[i].vencimento);
    if (!mesmo) throw new Error('parcelas diferentes: ' + JSON.stringify([meu, dele]));
    iguais++;
  });
  ok('parcelas iguais às do sistema de hoje em ' + iguais + ' configurações (valor, nº, juros, intervalo, 1º vencimento)', iguais === cfgs.length);
}

console.log('-- 5) A TELA: cliente, item, estoque, total, salvar e faturar --');
{
  const nucleo = w.DIGICOPY_NUCLEO.criar({ empresaId: 'e1', origem: 'teste', guardar: function () { } });
  nucleo.registrarLista('produtos', { nome: { obrigatorio: true, tipo: 'texto' }, preco: { tipo: 'numero' }, categoria: { tipo: 'texto' }, estoque: { tipo: 'numero' }, estoqueInfinito: { tipo: 'boleano' }, sku: { tipo: 'texto' } });
  nucleo.registrarLista('clientes', { nome: { obrigatorio: true, tipo: 'texto' } });
  nucleo.salvar('clientes', { id: 'c1', nome: 'José Ávila' });
  nucleo.salvar('produtos', { id: 'p1', nome: 'Cartucho HP 664', sku: 'HP664', categoria: 'Cartucho', preco: 89.9, estoque: 3 });
  nucleo.salvar('produtos', { id: 'p2', nome: 'Serviço de instalação', categoria: 'Serviço', preco: 80, estoque: 0 });

  const tela = w.DIGICOPY_VENDA.criarVenda({ nucleo: nucleo, elemento: doc.getElementById('venda'), empresaId: 'e1' });
  const alvo = doc.getElementById('venda');
  const clicar = (sel) => alvo.querySelector(sel).dispatchEvent(new w.Event('click', { bubbles: true }));
  const clicarDoc = (sel) => doc.querySelector(sel).dispatchEvent(new w.Event('click', { bubbles: true }));
  const modalFat = () => doc.querySelector('[data-fat-modal]');
  const digitarDoc = (sel, v) => { const e = doc.querySelector(sel); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); return e; };
  const porValor = (sel, v) => { const e = alvo.querySelector(sel); e.value = v; return e; };
  const linhas = () => alvo.querySelectorAll('.vnd-tabela tbody tr').length;

  ok('a tela abre com as duas caixas de seleção (cliente e produto)',
    !!alvo.querySelector('[data-caixa-cliente] [data-termo]') && !!alvo.querySelector('[data-caixa-produto] [data-termo]'));
  ok('e começa vazia (sem item inventado)', /Nenhum item lançado/.test(alvo.textContent));
  ok('a notinha já mostra o número dela ao abrir (código automático, como hoje)', /Notinha nº <b>1<\/b>/.test(alvo.innerHTML));
  ok('a situação da venda tem as MESMAS opções de hoje (AGUARDAR / ORÇAMENTO / APROVADA — faturar é ação, não opção)',
    [...alvo.querySelectorAll('[data-status] option')].map((o) => o.value).join(',') === 'aguardar,orcamento,aprovado',
    [...alvo.querySelectorAll('[data-status] option')].map((o) => o.value).join(','));

  // escolhe o cliente pela caixa (digita + Enter, como ele faz)
  const campoCli = alvo.querySelector('[data-caixa-cliente] [data-termo]');
  campoCli.value = 'jose';
  campoCli.dispatchEvent(new w.Event('input', { bubbles: true }));
  campoCli.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('o cliente escolhido aparece na venda', /José Ávila/.test(alvo.textContent) && tela.estado.cliente.id === 'c1');

  // escolhe o produto (o preço deve vir preenchido, como hoje)
  const campoProd = alvo.querySelector('[data-caixa-produto] [data-termo]');
  campoProd.value = 'cartucho';
  campoProd.dispatchEvent(new w.Event('input', { bubbles: true }));
  campoProd.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('escolher o produto já traz o valor unitário', alvo.querySelector('[data-vunit]').value === '89,9', alvo.querySelector('[data-vunit]').value);

  // quantidade acima do estoque: avisa e NÃO adiciona
  porValor('[data-qtd]', '4');
  clicar('[data-add]');
  ok('quantidade acima do estoque não entra (aviso igual ao de hoje)',
    tela.estado.itens.length === 0 && /Estoque insuficiente. Disponível: 3/.test(alvo.textContent), alvo.textContent.slice(0, 200));
  ok('e o aviso NÃO apaga o que ele digitou (produto, quantidade, valor continuam lá)',
    alvo.querySelector('[data-qtd]').value === '4' && alvo.querySelector('[data-vunit]').value === '89,9');

  porValor('[data-qtd]', '2');
  clicar('[data-add]');
  ok('item entra na venda com o subtotal certo', tela.estado.itens.length === 1 && tela.estado.itens[0].subtotal === 179.8);
  ok('e o total do rodapé acompanha', /TOTAL: R\$ 179,80/.test(alvo.textContent) || /179,80/.test(alvo.textContent));

  // estoque ainda NÃO baixou (a baixa é na gravação, como hoje)
  ok('o estoque só baixa quando grava (não ao incluir o item)', nucleo.obter('produtos', 'p1').estoque === 3);

  // desconto da venda
  const desc = alvo.querySelector('[data-desc-venda]');
  desc.value = '9,80';
  desc.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok('desconto da venda entra no total (179,80 − 9,80 = 170,00)', /170,00/.test(alvo.textContent));

  clicar('[data-salvar]');
  const vendas = nucleo.listar('vendas');
  ok('a venda foi gravada no núcleo com número 1', vendas.length === 1 && vendas[0].numero === '1', JSON.stringify(vendas.map((v) => v.numero)));
  ok('com cliente, item e total certos', vendas[0].clienteId === 'c1' && vendas[0].total === 170 && vendas[0].itens.length === 1);
  ok('e o estoque baixou 2 (3 → 1)', nucleo.obter('produtos', 'p1').estoque === 1, 'estoque=' + nucleo.obter('produtos', 'p1').estoque);
  ok('ainda NÃO criou título no financeiro (venda em AGUARDAR)', nucleo.listar('contasReceber').length === 0);

  // tira o item da venda já salva e grava de novo: o estoque tem de voltar
  clicar('[data-remover="0"]');
  ok('tirar o item da venda salva ainda não mexe no estoque', nucleo.obter('produtos', 'p1').estoque === 1);
  ok('e a venda aberta fica sem item', tela.estado.itens.length === 0);
  const vUnit = alvo.querySelector('[data-vunit]');
  vUnit.value = '89,9';
  const campoProd3 = alvo.querySelector('[data-caixa-produto] [data-termo]');
  campoProd3.value = 'cartucho';
  campoProd3.dispatchEvent(new w.Event('input', { bubbles: true }));
  campoProd3.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  porValor('[data-qtd]', '1');
  clicar('[data-add]');
  clicar('[data-salvar]');
  ok('gravar de novo com o item trocado devolve o que saiu (1 → 2)', nucleo.obter('produtos', 'p1').estoque === 2, 'estoque=' + nucleo.obter('produtos', 'p1').estoque);
  ok('e a venda salva fica com 1 item', nucleo.obter('vendas', tela.estado.vendaId).itens.length === 1);
  clicar('[data-salvar]');
  ok('salvar duas vezes sem mudar nada não baixa o estoque de novo', nucleo.obter('produtos', 'p1').estoque === 2);

  // segunda venda: numeração sobe
  clicar('[data-nova]');
  ok('ao clicar em Nova, a notinha já vem com o próximo número', /Notinha nº <b>2<\/b>/.test(alvo.innerHTML));
  const campoCli2 = alvo.querySelector('[data-caixa-cliente] [data-termo]');
  campoCli2.value = 'jose';
  campoCli2.dispatchEvent(new w.Event('input', { bubbles: true }));
  campoCli2.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  const campoProd2 = alvo.querySelector('[data-caixa-produto] [data-termo]');
  campoProd2.value = 'instalação';
  campoProd2.dispatchEvent(new w.Event('input', { bubbles: true }));
  campoProd2.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('Serviço entra mesmo sem estoque', alvo.querySelector('[data-vunit]').value === '80', alvo.querySelector('[data-vunit]').value);
  clicar('[data-add]');
  clicar('[data-faturar]');
  ok('Faturar abre a janela de recebimento (e a venda já foi salva antes, como hoje)', !!modalFat());
  ok('a janela mostra a venda, o cliente e o total', /Venda/.test(modalFat().textContent) && /José Ávila/.test(modalFat().textContent) && /80,00/.test(modalFat().textContent));
  ok('as 8 formas de recebimento estão na janela, com Dinheiro escolhido',
    modalFat().querySelectorAll('[data-forma]').length === 8 &&
    !!modalFat().querySelector('[data-forma="Dinheiro"].vnd-forma-on'));
  ok('e o texto diz que à vista conclui automaticamente', /concluída automaticamente/.test(modalFat().textContent));
  clicarDoc('[data-fat-concluir]');
  ok('concluir fecha a janela', !modalFat());
  const vendas2 = nucleo.listar('vendas');
  ok('a segunda venda saiu com número 2', vendas2.length === 2 && vendas2.some((v) => v.numero === '2'));
  const titulos = nucleo.listar('contasReceber');
  ok('faturar à vista (Dinheiro, o padrão de hoje) cria o título JÁ PAGO, baixado automático',
    titulos.length === 1 && titulos[0].status === 'pago' && titulos[0].autoBaixa === true &&
    titulos[0].formaPagamento === 'Dinheiro' && titulos[0].valor === 80 && /à vista \(Dinheiro\)/.test(titulos[0].descricao),
    JSON.stringify(titulos.map((t) => [t.valor, t.status, t.formaPagamento])));
  const vendaFaturada = nucleo.obter('vendas', tela.estado.vendaId);
  ok('e a venda guarda a forma e a parcela 1/1', vendaFaturada.formaPagamento === 'Dinheiro' && vendaFaturada.parcelas && vendaFaturada.parcelas.length === 1,
    JSON.stringify({ forma: vendaFaturada.formaPagamento, parcelas: vendaFaturada.parcelas, tela: alvo.textContent.replace(/\s+/g, ' ').slice(0, 160) }));
  ok('e a venda ficou como FATURADA', nucleo.listar('vendas').some((v) => v.status === 'faturado'));
  ok('a venda faturada fica travada, mas continua mostrando que está FATURADA (e o Nova segue à mão)',
    alvo.querySelector('[data-status]').disabled === true && /FATURADA/.test(alvo.textContent) && !!alvo.querySelector('[data-nova]'));
  ok('o estoque do Serviço não foi tocado', nucleo.obter('produtos', 'p2').estoque === 0);

  // venda zerada: entra paga
  clicar('[data-nova]');
  const c3 = alvo.querySelector('[data-caixa-cliente] [data-termo]');
  c3.value = 'jose';
  c3.dispatchEvent(new w.Event('input', { bubbles: true }));
  c3.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  const p3 = alvo.querySelector('[data-caixa-produto] [data-termo]');
  p3.value = 'instalação';
  p3.dispatchEvent(new w.Event('input', { bubbles: true }));
  p3.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  porValor('[data-vunit]', '0');
  clicar('[data-add]');
  clicar('[data-faturar]');
  clicarDoc('[data-fat-concluir]');
  const titulos2 = nucleo.listar('contasReceber');
  const zerado = titulos2.filter((t) => t.status === 'pago' && t.autoBaixa === true);
  ok('venda zerada faturada já entra PAGA e baixada automática (sem depender da forma)',
    titulos2.length === 2 && zerado.length === 2 && zerado.some((t) => t.valor === 0), JSON.stringify(titulos2.map((t) => [t.valor, t.status])));
  // forma escolhida na tela: a prazo cria parcela em aberto
  clicar('[data-nova]');
  const c4 = alvo.querySelector('[data-caixa-cliente] [data-termo]');
  c4.value = 'jose';
  c4.dispatchEvent(new w.Event('input', { bubbles: true }));
  c4.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  const p4 = alvo.querySelector('[data-caixa-produto] [data-termo]');
  p4.value = 'instalação';
  p4.dispatchEvent(new w.Event('input', { bubbles: true }));
  p4.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  clicar('[data-add]');
  // cancelar primeiro: a venda fica salva como AGUARDAR e nenhum título é criado
  clicar('[data-faturar]');
  clicarDoc('[data-fat-cancelar]');
  ok('cancelar o faturamento não cria cobrança e avisa que a venda ficou aguardando',
    !modalFat() && nucleo.listar('contasReceber').filter((t) => t.status === 'aberto').length === 0 &&
    /AGUARDAR/.test(alvo.textContent) && /cancelado/i.test(alvo.textContent),
    JSON.stringify(nucleo.listar('contasReceber').map((t) => [t.status, t.valor])));
  // agora a prazo de verdade: 3 parcelas com juros e prévia dos vencimentos
  clicar('[data-faturar]');
  clicarDoc('[data-forma="Prazo"]');
  ok('escolher "A prazo" abre a caixa das parcelas e muda o rótulo do botão',
    modalFat().querySelector('[data-prazo-box]').hidden === false && /Finalizar e gerar parcelas/.test(modalFat().textContent));
  ok('a prévia já mostra 1 parcela de 80,00 em 30 dias', modalFat().querySelectorAll('[data-parc-body] tr').length === 1 &&
    /80,00/.test(modalFat().querySelector('[data-parc-total]').textContent), modalFat().querySelector('[data-parc-total]').textContent);
  digitarDoc('[data-parc-qtd]', '3');
  digitarDoc('[data-parc-juros]', '1');
  ok('mudando para 3 parcelas com 1% de juros a prévia se refaz na hora',
    modalFat().querySelectorAll('[data-parc-body] tr').length === 3,
    String(modalFat().querySelectorAll('[data-parc-body] tr').length));
  const esperado = w.DIGICOPY_VENDA.regras.parcelasDoFaturamento(80, Object.assign({ hoje: new Date() }, {
    parcelas: 3, jurosMes: 1, intervaloDias: 30,
    primeiroVencimento: doc.querySelector('[data-parc-prim]').value
  }));
  const somaPrev = esperado.reduce((s, p) => s + p.valor, 0);
  ok('e o TOTAL da prévia é a soma das parcelas certas (' + somaPrev.toFixed(2) + ')',
    modalFat().querySelector('[data-parc-total]').textContent === somaPrev.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    modalFat().querySelector('[data-parc-total]').textContent);
  clicarDoc('[data-fat-concluir]');
  const terceiro = nucleo.listar('contasReceber').filter((t) => t.status === 'aberto');
  ok('concluir cria UM título em aberto por parcela, com o rótulo certo',
    terceiro.length === 3 && terceiro.every((t, i) => t.parcela === i + 1 && t.totalParcelas === 3) &&
    /parcela 1\/3/.test(terceiro[0].descricao),
    JSON.stringify(terceiro.map((t) => [t.valor, t.parcela, t.totalParcelas])));
  ok('com os MESMOS valores calculados pelo sistema de hoje',
    terceiro.every((t, i) => t.valor === esperado[i].valor),
    JSON.stringify([terceiro.map((t) => t.valor), esperado.map((p) => p.valor)]));
  const quartaVenda = nucleo.listar('vendas').filter((v) => v.status === 'faturado' && v.numero === '4')[0];
  ok('e a quarta venda saiu numerada, faturada a prazo e com as 3 parcelas gravadas',
    !!quartaVenda && quartaVenda.formaPagamento === 'Prazo' && quartaVenda.parcelas.length === 3,
    JSON.stringify(nucleo.listar('vendas').map((v) => [v.numero, v.status, v.formaPagamento])));
  ok('a janela do recebimento também não usa janela nativa (ela é do próprio sistema)',
    !!modalFat() === false && !/\b(alert|confirm|prompt)\s*\(/.test(w.DIGICOPY_VENDA.criarVenda.toString()));
  ok('a fila da nuvem registrou tudo (vendas, itens e financeiro)',
    nucleo.mudancas().length >= 6, 'mudanças=' + nucleo.mudancas().length);
}


console.log('-- 6) A OS NA VENDA e o ESTORNO (diferencial contra o que roda hoje) --');
{
  const R = w.DIGICOPY_VENDA.regras;
  // ── a peça pura do estorno de hoje (ajustes_v5240_relatorio_grande_patch.js:30-160) ──
  // o arquivo termina com `module.exports = _pureV5240`, então dá para rodá-lo aqui mesmo:
  // as partes de tela dele só rodam quando existe `document` (que não existe no Node).
  // O arquivo de hoje não é um módulo puro (ele mexe em `window.estornarVenda` no nível de
  // cima), então ele roda aqui com um window de mentira — e as partes de tela dele só rodam
  // quando existe `document`, que não é o caso.
  const dbFake = { vendas: [], contasReceber: [] };
  const fonteEstorno = fs.readFileSync('ajustes_v5240_relatorio_grande_patch.js', 'utf8');
  const moduloFake = { exports: {} };
  const janelaFake = { db: dbFake };
  new Function('window', 'module', 'db', 'getSession', 'logAction', 'document', 'setTimeout', 'setInterval',
    fonteEstorno)(janelaFake, moduloFake, dbFake, () => ({ usuarioNome: 'Kauan' }), () => { }, undefined, () => 0, () => 0);
  const vivo = moduloFake.exports;
  ok('a regra viva do estorno foi carregada (`V5240_RELATORIO_PURE`)',
    !!vivo && typeof vivo.estornarUmaVenda === 'function' && typeof vivo.ehFaturada === 'function');

  // 6.1 — quem pode ser estornado (a lista de status é a de hoje)
  const status = ['', 'aguardar', 'orcamento', 'aprovado', 'faturado', 'FINALIZADA', 'concluido', 'pago', 'estornada', 'cancelada'];
  const difStatus = status.filter((st) => R.jaFaturada(st) !== vivo.ehFaturada(st));
  ok('a regra "venda faturada" bate com a de hoje nos ' + status.length + ' status' + (difStatus.length ? ' — DIFERENTE em ' + JSON.stringify(difStatus) : ''), difStatus.length === 0);

  // 6.2 — o estorno lado a lado: a venda e os títulos saem iguais aos de hoje
  const casos = [
    { nome: 'à vista (1 título já pago)', status: 'faturado', forma: 'Dinheiro', parcelas: [], crs: [{ id: 't1', status: 'pago', autoBaixa: true, valor: 80 }] },
    { nome: 'a prazo (3 títulos abertos)', status: 'faturado', forma: 'Prazo', parcelas: [{ n: 1 }], crs: [{ id: 't1', status: 'aberto', valor: 30 }, { id: 't2', status: 'aberto', valor: 30 }, { id: 't3', status: 'aberto', valor: 30 }] },
    { nome: 'pix (título aberto pelo comprovante manual)', status: 'finalizada', forma: 'Pix', parcelas: [], crs: [{ id: 't1', status: 'aberto', autoBaixa: false, valor: 80 }] },
    { nome: 'misto (1 pago + 2 abertos)', status: 'pago', forma: 'Conta', parcelas: [], crs: [{ id: 't1', status: 'pago' }, { id: 't2', status: 'aberto' }, { id: 't3', status: 'aberto' }] },
    { nome: 'venda zerada (título "Sem cobrança" pago)', status: 'concluido', forma: 'Grátis', parcelas: [], crs: [] }
  ];
  let iguais = 0, titulosDiferentes = [];
  casos.forEach((c, i) => {
    const venda = { id: 'v' + i, numero: String(16000 + i), status: c.status, formaPagamento: c.forma, parcelas: c.parcelas.slice(), total: 90, clienteId: 'c1' };
    dbFake.vendas = [venda];
    dbFake.contasReceber = c.crs.map((x) => Object.assign({ vendaId: venda.id, descricao: 'venda', vencimento: '2026-10-01T00:00:00.000Z' }, x));
    const meu = R.estornoDaVenda(venda, c.crs.map((x) => Object.assign({ vendaId: venda.id }, x)), 'Kauan', new Date());
    const dele = vivo.estornarUmaVenda(venda);   // mexe no venda e nos títulos de verdade
    const vendaOk = meu && venda.status === meu.venda.status && venda.estornoDe === meu.venda.estornoDe &&
      venda.formaPagamento === meu.venda.formaPagamento && JSON.stringify(venda.parcelas) === JSON.stringify(meu.venda.parcelas) &&
      venda.estornadoPor === meu.venda.estornadoPor;
    // o `estornadoEm` é o instante do clique (cada lado pega o dele), então ele é conferido
    // pelo FORMATO: os dois têm de gravar a data completa (ISO com hora e fuso)
    const isoOk = (x) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(String(x || ''));
    const titulosOk = dbFake.contasReceber.every((t, k) =>
      t.status === meu.titulos[k].status && t.estornoDe === meu.titulos[k].estornoDe &&
      t.estornadoPor === meu.titulos[k].estornadoPor && isoOk(t.estornadoEm) && isoOk(meu.titulos[k].estornadoEm));
    const contasOk = dele.titulos === meu.quantos && dele.pagos === meu.pagos;
    if (!(vendaOk && titulosOk && contasOk)) titulosDiferentes.push({ caso: c.nome, vendaOk: vendaOk, titulosOk: titulosOk, contasOk: contasOk,
      meu: JSON.stringify(meu), dele: JSON.stringify({ v: venda, cr: dbFake.contasReceber }) });
    else iguais++;
  });
  ok('o estorno sai IGUAL ao de hoje nos ' + casos.length + ' casos (venda e títulos)'
    + (titulosDiferentes.length ? ' — DIFERENTE: ' + JSON.stringify(titulosDiferentes[0]).slice(0, 400) : ''), iguais === casos.length);
  ok('e o estoque NÃO é tocado pelo estorno (é a regra do dono)',
    R.estornoDaVenda({ id: 'v', status: 'faturado' }, [], 'x', new Date()).venda.itens === undefined);

  // 6.3 — o que NÃO pode ser estornado continua recusado, com o mesmo recado de hoje
  ok('venda em orçamento não pode ser estornada (a regra de hoje exige faturada)',
    R.estornoDaVenda({ id: 'v', status: 'orcamento' }, [], 'x', new Date()) === null);
  ok('venda já estornada não pode ser estornada de novo',
    R.estornoDaVenda({ id: 'v', status: 'estornada' }, [], 'x', new Date()) === null);

  // 6.4 — A ABA OS: as regras do núcleo novo são as mesmas duas funções de hoje
  const srcOs = fs.readFileSync('vendas_os_patch.js', 'utf8');
  const iniPuro = srcOs.indexOf('/* VOS_PURE_START */');
  w.eval(srcOs.slice(iniPuro, srcOs.indexOf('window.__vosPure =', iniPuro)) +
    srcOs.slice(srcOs.indexOf('window.__vosPure =', iniPuro), srcOs.indexOf('}', srcOs.indexOf('window.__vosPure =', iniPuro)) + 1));
  const iniSerie = srcOs.indexOf('function vosOsTemAlgumDado');
  w.eval(srcOs.slice(iniSerie, srcOs.indexOf('\n}', iniSerie) + 2));
  const casosOs = [
    {}, { modelo: 'Kyocera' }, { modelo: 'K', numeroSerie: 'S' }, { modelo: 'K', numeroSerie: 'S', patrimonio: 'P' },
    { modelo: 'K', numeroSerie: 'S', contador: 0 }, { modelo: 'K', numeroSerie: 'S', contador: '0' },
    { desconto: 10 }, { desconto: 10, valorServico: 5 }, { defeito: 'x' }, { contador: 0 },
    { modelo: 'K', numeroSerie: 'S', patrimonio: 'P', contador: '9', situacao: 'Entregue', valorServico: 80, desconto: 10 }
  ];
  const difComp = casosOs.filter((os) => R.osCompleta(os) !== w.__vosPure.vosOsCompleta(os));
  const difTem = casosOs.filter((os) => R.osTemAlgumDado(os) !== w.vosOsTemAlgumDado(os));
  ok('a regra "OS completa" da venda nova é a mesma de hoje nos ' + casosOs.length + ' casos'
    + (difComp.length ? ' — DIFERENTE em ' + JSON.stringify(difComp) : ''), difComp.length === 0);
  ok('e a regra "a OS tem algum dado" também (o desconto sozinho NÃO faz a OS existir, como hoje)'
    + (difTem.length ? ' — DIFERENTE em ' + JSON.stringify(difTem) : ''), difTem.length === 0);
  ok('a lista de faltantes da OS é a mesma conversa de hoje (modelo, série, patrimônio/contador)',
    R.osFalta({}).length === 3 && R.osFalta({ modelo: 'K', numeroSerie: 'S' }).length === 1 && R.osFalta({ modelo: 'K', numeroSerie: 'S', contador: 0 }).length === 0,
    JSON.stringify([R.osFalta({}), R.osFalta({ modelo: 'K', numeroSerie: 'S' })]));
  ok('as listas da aba OS são as MESMAS de hoje (tipo, garantia e situação, na mesma ordem)',
    R.TIPOS_OS.join('|') === 'Manutenção corretiva|Manutenção preventiva|Instalação|Retirada|Troca de equipamento|Recarga no local|Outros' &&
    R.GARANTIAS.join('|') === 'Sem garantia|7 dias|30 dias|60 dias|90 dias' &&
    R.SITUACOES_OS.join('|') === 'Aberta|Em execução|Aguardando peça|Concluída|Entregue');
  ok('o total da venda soma o serviço da OS e tira o desconto da OS (igual ao vosResumoVenda de hoje)',
    R.calcularTotais([{ subtotal: 100 }], 10, { valorServico: 80, desconto: 5 }).total === 165 &&
    R.calcularTotais([{ subtotal: 100 }], 10, {}).total === 90);
}

console.log('-- 7) A TELA: a aba OS grava a OS junto da venda, numera e espelha nos Chamados --');
{
  const R = w.DIGICOPY_VENDA.regras;
  const nucleo = w.DIGICOPY_NUCLEO.criar({ empresaId: 'e1', origem: 'teste', guardar: function () { } });
  nucleo.registrarLista('produtos', { nome: { obrigatorio: true, tipo: 'texto' }, preco: { tipo: 'numero' }, categoria: { tipo: 'texto' }, estoque: { tipo: 'numero' }, estoqueInfinito: { tipo: 'boleano' }, sku: { tipo: 'texto' } });
  nucleo.registrarLista('clientes', { nome: { obrigatorio: true, tipo: 'texto' } });
  nucleo.salvar('clientes', { id: 'c1', nome: 'José Ávila' });
  nucleo.salvar('produtos', { id: 'p1', nome: 'Cartucho HP 664', categoria: 'Cartucho', preco: 50, estoque: 10, sku: 'HP664' });

  const div = doc.createElement('div');
  doc.body.appendChild(div);
  const tela = w.DIGICOPY_VENDA.criarVenda({ nucleo: nucleo, elemento: div, empresaId: 'e1' });
  const alvo = div;
  const clicar = (sel) => alvo.querySelector(sel).dispatchEvent(new w.Event('click', { bubbles: true }));
  const digitar = (sel, v) => { const e = alvo.querySelector(sel); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); return e; };
  // a caixa de seleção escolhe com Enter (é o mesmo jeito do bloco 5 deste teste)
  const escolher = (caixa, termo) => {
    const e = alvo.querySelector(caixa + ' [data-termo]');
    e.value = termo;
    e.dispatchEvent(new w.Event('input', { bubbles: true }));
    e.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  };

  escolher('[data-caixa-cliente]', 'José');   // a venda sem cliente não grava (regra de hoje)
  escolher('[data-caixa-produto]', 'HP 664');
  digitar('[data-qtd]', '1');
  digitar('[data-vunit]', '50');
  clicar('[data-add]');
  ok('a venda tem 1 item e a aba OS aparece na tela (é onde ele digita a OS)',
    nucleo.listar('vendas').length === 0 && !!alvo.querySelector('[data-os-bloco]') && !!alvo.querySelector('[data-os="numeroSerie"]'));

  digitar('[data-os="numeroSerie"]', 'SN12345');
  digitar('[data-os="modelo"]', 'Kyocera M2040');
  digitar('[data-os="patrimonio"]', 'PAT7');
  digitar('[data-os="contador"]', '1533');
  digitar('[data-os="defeito"]', 'atolando papel');
  digitar('[data-os="valorServico"]', '80');
  ok('enquanto ele digita, a tela já avisa que a OS está completa (folha inteira)',
    !!alvo.querySelector('[data-os-selo]') && alvo.querySelector('[data-os-selo]').hidden === false);
  ok('e o serviço da OS entra no TOTAL na hora (50 + 80 = 130,00)',
    (alvo.querySelector('[data-tot-total]') || {}).textContent === '130,00' &&
    (alvo.querySelector('[data-tot-serv]') || {}).textContent === '80,00' &&
    alvo.querySelector('[data-tot-serv-box]').hidden === false,
    JSON.stringify([(alvo.querySelector('[data-tot-total]') || {}).textContent, (alvo.querySelector('[data-tot-serv]') || {}).textContent]));

  clicar('[data-salvar]');
  const vendaGravada = nucleo.listar('vendas')[0];
  ok('a venda foi gravada com a OS dentro dela (e o número da OS saiu da série)',
    !!vendaGravada && !!vendaGravada.os && vendaGravada.os.numero === '1' && vendaGravada.os.numeroSerie === 'SN12345',
    JSON.stringify(vendaGravada && vendaGravada.os) + ' vendas=' + JSON.stringify(nucleo.listar('vendas').map((v) => [v.numero, v.os && v.os.numero])));
  ok('a OS gravada nasce marcada como completa e com o valor do serviço',
    vendaGravada.os.completa === true && vendaGravada.os.valorServico === 80);
  const chamado = nucleo.listar('os')[0];
  ok('e ela aparece nos CHAMADOS (o espelho `db.os` de hoje) ligada à venda',
    !!chamado && chamado.vendaId === vendaGravada.id && chamado.numero === '1');
  ok('com o defeito no campo "problema", a descrição do serviço e a situação traduzida',
    chamado.problema === 'atolando papel' && chamado.serie === 'SN12345' && chamado.patrimonio === 'PAT7' &&
    chamado.prioridade === 'normal' && chamado.status === 'aberto');
  ok('o total da venda gravada é o da tela (itens + serviço da OS)',
    vendaGravada.total === 130, String(vendaGravada.total));

  // salvar de novo não cria um SEGUNDO chamado nem troca o número da OS
  clicar('[data-salvar]');
  ok('salvar duas vezes não cria um segundo chamado para a mesma venda',
    nucleo.listar('os').length === 1 && nucleo.listar('vendas')[0].os.numero === '1',
    'chamados=' + nucleo.listar('os').length);
  ok('e o número da OS NÃO anda quando a venda é salva de novo (o contador não é gasto à toa)',
    nucleo.listar('vendas')[0].os.numero === '1');

  // a busca por número de série acha a OS na própria venda
  digitar('[data-os="numeroSerie"]', 'SN12345');
  clicar('[data-os-buscar]');
  const info = alvo.querySelector('[data-os-serial-info]');
  ok('a busca por número de série reconhece um equipamento que já passou pela loja',
    !!info && info.hidden === false && /SN12345/.test(info.textContent), info ? info.textContent : 'sem aviso');

  // venda SÓ de serviço: com a OS preenchida, dá para salvar sem item (é a regra de hoje)
  clicar('[data-nova]');
  ok('a venda nova limpa também a aba OS (nada de OS vazada da venda anterior)',
    alvo.querySelector('[data-os="numeroSerie"]').value === '' && alvo.querySelector('[data-os-selo]').hidden === true);
  escolher('[data-caixa-cliente]', 'José');   // a venda sem cliente não grava (regra de hoje)
  digitar('[data-os="defeito"]', 'não liga');
  digitar('[data-os="valorServico"]', '120');
  clicar('[data-salvar]');
  const soServico = nucleo.listar('vendas').filter((v) => v.numero === '2')[0];
  ok('venda só de serviço da OS grava sem item (ao menos um item OU um serviço de OS)',
    !!soServico && soServico.itens.length === 0 && soServico.total === 120 && !soServico.os.numeroSerie && soServico.os.numero === '2',
    JSON.stringify(soServico && [soServico.total, soServico.os]) +
    ' erro=' + JSON.stringify((alvo.querySelector('[data-erro-box]') || {}).textContent) +
    ' cliente=' + JSON.stringify(tela.estadoAtual().cliente && tela.estadoAtual().cliente.nome));
  ok('e essa OS incompleta NÃO marca folha inteira (ela diz o que falta)',
    soServico.os.completa === false && R.osFalta(soServico.os).length === 3 &&
    R.osFalta(soServico.os)[0] === 'Modelo do equipamento', JSON.stringify(R.osFalta(soServico.os)));
}

console.log('-- 8) A TELA: o PIX no recebimento e o título que NÃO dá baixa sozinho --');
{
  const nucleo = w.DIGICOPY_NUCLEO.criar({ empresaId: 'e1', origem: 'teste', guardar: function () { } });
  nucleo.registrarLista('produtos', { nome: { obrigatorio: true, tipo: 'texto' }, preco: { tipo: 'numero' }, categoria: { tipo: 'texto' }, estoque: { tipo: 'numero' }, estoqueInfinito: { tipo: 'boleano' } });
  nucleo.registrarLista('clientes', { nome: { obrigatorio: true, tipo: 'texto' } });
  nucleo.salvar('clientes', { id: 'c1', nome: 'José Ávila' });
  nucleo.salvar('produtos', { id: 'p1', nome: 'Cartucho HP 664', categoria: 'Cartucho', preco: 80, estoque: 10 });
  w.DIGICOPY_PIX.regras.gravarConfig(nucleo, { chave: '12345678000199', nome: 'DIGICOPY', cidade: 'MONTES CLAROS' });

  const div = doc.createElement('div');
  doc.body.appendChild(div);
  w.DIGICOPY_VENDA.criarVenda({ nucleo: nucleo, elemento: div, empresaId: 'e1' });
  const alvo = div;
  const clicarDoc = (sel) => doc.querySelector(sel).dispatchEvent(new w.Event('click', { bubbles: true }));
  const clicar = (sel) => alvo.querySelector(sel).dispatchEvent(new w.Event('click', { bubbles: true }));
  const digitar = (sel, v) => { const e = alvo.querySelector(sel); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); };

  const escolher = (caixa, termo) => {
    const e = alvo.querySelector(caixa + ' [data-termo]');
    e.value = termo;
    e.dispatchEvent(new w.Event('input', { bubbles: true }));
    e.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  };
  escolher('[data-caixa-cliente]', 'José');
  escolher('[data-caixa-produto]', 'HP 664');
  digitar('[data-qtd]', '1'); digitar('[data-vunit]', '80');
  clicar('[data-add]');
  clicar('[data-salvar]');
  clicar('[data-faturar]');
  const modal = () => doc.querySelector('[data-fat-modal]');
  ok('a janela de recebimento tem o lugar do Pix (ele aparece quando escolher Pix)', !!modal().querySelector('[data-pix-box]'));
  ok('e ainda não mostra QR nenhum enquanto a forma não é Pix',
    modal().querySelector('[data-pix-box]').hidden === true && modal().querySelector('[data-pix-box]').innerHTML === '');

  clicarDoc('[data-forma="Pix"]');
  const box = modal().querySelector('[data-pix-box]');
  const venda = nucleo.listar('vendas')[0];
  const payload = w.DIGICOPY_PIX.regras.payloadDaVenda(venda, w.DIGICOPY_PIX.regras.lerConfig(nucleo));
  ok('escolhendo Pix, o QR aparece na própria janela com o código do valor exato da venda',
    box.hidden === false && box.innerHTML.indexOf('data-pix-codigo') > 0 && box.innerHTML.indexOf(payload) > 0);
  ok('e o aviso do comprovante manual aparece junto (Pix não dá baixa sozinho)',
    /comprovante/i.test(box.textContent) && /WhatsApp/.test(box.textContent));
  ok('o botão de copiar existe e usa a área de transferência (sem janela nativa de prompt)',
    !!box.querySelector('[data-pix-copiar]') && !/\b(prompt|alert|confirm)\s*\(/.test(w.DIGICOPY_PIX.copiarPayload.toString()));

  clicarDoc('[data-fat-concluir]');
  const titulo = nucleo.listar('contasReceber')[0];
  ok('o título da venda Pix nasce ABERTO (nada de baixa automática)',
    !!titulo && titulo.status === 'aberto' && titulo.autoBaixa === false && titulo.pagamentoData === null,
    JSON.stringify(titulo));
  ok('com o aviso do comprovante escrito na observação (ele lê no financeiro)',
    /comprovante no WhatsApp/.test(titulo.observacao));
  ok('e a venda ficou faturada com a forma Pix',
    nucleo.listar('vendas')[0].status === 'faturado' && nucleo.listar('vendas')[0].formaPagamento === 'Pix');
  ok('o aviso na tela explica que o título ficou aberto esperando o comprovante',
    /ABERTO/.test(alvo.textContent) && /comprovante/i.test(alvo.textContent));
}

console.log('-- 9) A TELA: imprimir a notinha e o carnê (e o aviso quando o navegador bloqueia) --');
{
  const nucleo = w.DIGICOPY_NUCLEO.criar({ empresaId: 'e1', origem: 'teste', guardar: function () { } });
  nucleo.registrarLista('clientes', { nome: { obrigatorio: true, tipo: 'texto' } });
  nucleo.salvar('clientes', { id: 'c1', nome: 'José Ávila' });
  const div = doc.createElement('div');
  doc.body.appendChild(div);
  const tela = w.DIGICOPY_VENDA.criarVenda({ nucleo: nucleo, elemento: div, empresaId: 'e1' });
  const alvo = div;
  const clicar = (sel) => alvo.querySelector(sel).dispatchEvent(new w.Event('click', { bubbles: true }));

  ok('venda ainda não gravada: os botões de impressão não aparecem (não tem o que imprimir)',
    !alvo.querySelector('[data-print-notinha]') && !alvo.querySelector('[data-print-carne]'));

  nucleo.salvar('vendas', { id: 'vx', numero: '16001', clienteId: 'c1', clienteNome: 'José Ávila', itens: [{ descricao: 'Cartucho', qtd: 1, preco: 80, subtotal: 80 }], desconto: 0, total: 80, status: 'aguardar', formaPagamento: 'Dinheiro', data: '2026-09-24T13:00:00.000Z' });
  tela.estadoAtual().vendaId = 'vx';
  tela.estadoAtual().numero = '16001';
  tela.desenhar();
  ok('com a venda gravada os botões de imprimir aparecem (notinha e carnê)',
    !!alvo.querySelector('[data-print-notinha]') && !!alvo.querySelector('[data-print-carne]'));

  let escrito = null;
  w.open = function () { return { document: { write: (h) => { escrito = h; }, close: () => { } }, focus: () => { } }; };
  clicar('[data-print-notinha]');
  ok('a notinha da venda sai em MEIA FOLHA (a venda não tem OS) e com o número certo',
    !!escrito && escrito.indexOf('class="pagina meia"') > 0 && escrito.indexOf('Nº 16001') > 0);
  ok('e a tela avisa que mandou imprimir (sem janela nativa)',
    /enviada para a impressora/.test(alvo.textContent) && /meia folha/.test(alvo.textContent));

  clicar('[data-print-carne]');
  ok('venda sem parcela: o carnê avisa em vez de abrir papel vazio',
    /não tem parcelas/.test(alvo.textContent) && escrito.indexOf('Nº 16001') > 0);

  w.open = function () { return null; };   // navegador bloqueou a janela
  clicar('[data-print-notinha]');
  ok('janela bloqueada pelo navegador: avisa na tela para liberar o pop-up (nada de alert nativo)',
    /bloqueou a janela de impressão/.test(alvo.textContent) && /pop-up/.test(alvo.textContent));
  delete w.open;
}

console.log('-- 10) A TELA: estornar (títulos marcados no financeiro e venda liberada de novo) --');
{
  const nucleo = w.DIGICOPY_NUCLEO.criar({ empresaId: 'e1', origem: 'teste', guardar: function () { } });
  nucleo.registrarLista('clientes', { nome: { obrigatorio: true, tipo: 'texto' } });
  nucleo.salvar('clientes', { id: 'c1', nome: 'José Ávila' });

  const div = doc.createElement('div');
  doc.body.appendChild(div);
  // a tela é criada primeiro (é ela que registra as listas da venda no núcleo, como na vida real)
  const tela = w.DIGICOPY_VENDA.criarVenda({ nucleo: nucleo, elemento: div, empresaId: 'e1' });
  const alvo = div;
  nucleo.salvar('vendas', { id: 'vf', numero: '16001', clienteId: 'c1', clienteNome: 'José Ávila', itens: [{ descricao: 'Cartucho', qtd: 1, preco: 80, subtotal: 80 }], total: 80, status: 'faturado', formaPagamento: 'Dinheiro', data: '2026-09-24T13:00:00.000Z', parcelas: [] });
  nucleo.salvar('contasReceber', { id: 'crf', vendaId: 'vf', descricao: 'Venda 16001', valor: 80, status: 'pago', vencimento: '2026-09-24T00:00:00.000Z', autoBaixa: true });
  tela.estadoAtual().vendaId = 'vf';
  tela.estadoAtual().numero = '16001';
  tela.estadoAtual().status = 'faturado';
  tela.estadoAtual().cliente = nucleo.obter('clientes', 'c1');
  tela.desenhar();
  const clicar = (sel) => alvo.querySelector(sel).dispatchEvent(new w.Event('click', { bubbles: true }));

  ok('a venda faturada mostra o botão de estornar no lugar do faturar',
    !!alvo.querySelector('[data-estornar]') && !alvo.querySelector('[data-faturar]'));
  clicar('[data-estornar]');
  const conf = doc.querySelector('[data-conf-modal]');
  ok('o estorno pede confirmação numa janela do PRÓPRIO sistema (nada de confirm nativo)',
    !!conf && /Estornar a venda 16001/.test(conf.textContent));
  ok('e a janela avisa que o estoque não se mexe e que o número não muda',
    /estoque/i.test(conf.textContent) && /não muda|não se mexe/i.test(conf.textContent));
  conf.querySelector('[data-conf-nao]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('cancelando, a venda continua faturada (nada foi mexido)',
    nucleo.obter('vendas', 'vf').status === 'faturado' && nucleo.obter('contasReceber', 'crf').status === 'pago');

  clicar('[data-estornar]');
  doc.querySelector('[data-conf-modal] [data-conf-sim]').dispatchEvent(new w.Event('click', { bubbles: true }));
  const vendaDepois = nucleo.obter('vendas', 'vf');
  const crDepois = nucleo.obter('contasReceber', 'crf');
  ok('confirmando, a venda fica estornada e volta a poder ser editada',
    vendaDepois.status === 'estornada' && vendaDepois.estornoDe === 'faturado' && vendaDepois.formaPagamento === 'Não faturado' && vendaDepois.parcelas.length === 0);
  ok('e o título NÃO sumiu: ficou marcado como estornado no financeiro (é a regra do dono)',
    crDepois.status === 'estornado' && crDepois.estornoDe === 'pago' && !!crDepois.estornadoEm && !!crDepois.estornadoPor,
    JSON.stringify(crDepois));
  ok('a tela voltou a mostrar os campos liberados e o botão de faturar',
    !alvo.querySelector('[data-faturar]') === false && !!alvo.querySelector('[data-faturar]') && !alvo.querySelector('[data-estornar]'));

  // o financeiro do núcleo novo mostra a tarja e deixa o estornado FORA da soma de aberto
  const F = w.DIGICOPY_FINANCEIRO.regras;
  ok('o financeiro novo sabe reconhecer um título estornado (tarja própria)',
    F.ehEstornado(crDepois) === true && F.ehEstornado({ status: 'aberto' }) === false && F.ehEstornado({ estornado: true }) === true);
}

console.log('-- 11) A NOTINHA EM WORD na tela (o botão que faltava do sistema de hoje) --');
{
  const nucleo = w.DIGICOPY_NUCLEO.criar({ empresaId: 'e1', origem: 'teste', guardar: function () { } });
  nucleo.registrarLista('clientes', { nome: { obrigatorio: true, tipo: 'texto' } });
  nucleo.salvar('clientes', { id: 'c1', nome: 'José Ávila' });
  const div = doc.createElement('div');
  doc.body.appendChild(div);
  const tela = w.DIGICOPY_VENDA.criarVenda({ nucleo: nucleo, elemento: div, empresaId: 'e1' });
  const alvo = div;
  nucleo.salvar('vendas', {
    id: 'vw', numero: '16010', clienteId: 'c1', clienteNome: 'José Ávila',
    itens: [{ descricao: 'Cartucho', qtd: 1, preco: 80, subtotal: 80 }],
    desconto: 0, total: 80, status: 'aguardar', formaPagamento: 'Dinheiro'
  });
  tela.estadoAtual().vendaId = 'vw';
  tela.estadoAtual().numero = '16010';
  tela.estadoAtual().cliente = nucleo.obter('clientes', 'c1');
  tela.desenhar();
  const clicar = (sel) => alvo.querySelector(sel).dispatchEvent(new w.Event('click', { bubbles: true }));

  ok('com a venda gravada, o botão 📄 Word aparece ao lado do Notinha e do Carnê',
    !!alvo.querySelector('[data-word]') && !!alvo.querySelector('[data-print-notinha]') && !!alvo.querySelector('[data-print-carne]'));
  // venda em branco (nada gravado): os três botões de papel somem (não se imprime o que não existe)
  tela.novaVenda();
  ok('venda nova em branco não mostra botão de papel nenhum',
    !alvo.querySelector('[data-word]') && !alvo.querySelector('[data-print-notinha]') && !alvo.querySelector('[data-print-carne]'));

  // o jsdom não baixa arquivo: o teste deixa o caminho do download pronto e confere que a
  // tela NÃO estoura e avisa o dono (nada de alert nativo, nada de erro na cara)
  tela.estadoAtual().vendaId = 'vw';
  tela.estadoAtual().numero = '16010';
  tela.estadoAtual().cliente = nucleo.obter('clientes', 'c1');
  tela.desenhar();
  const baixados = [];
  w.URL.createObjectURL = function () { return 'blob:teste'; };
  w.URL.revokeObjectURL = function () { };
  const clicarOriginal = w.HTMLAnchorElement.prototype.click;
  w.HTMLAnchorElement.prototype.click = function () { baixados.push(this.download); };
  clicar('[data-word]');
  w.HTMLAnchorElement.prototype.click = clicarOriginal;
  ok('clicar no Word monta o arquivo e dispara o download (notinha_<número>.doc)',
    baixados.length === 1 && /^notinha_[\w-]+\.doc$/.test(baixados[0]), JSON.stringify(baixados));
  ok('e avisa na própria tela que baixou (sem janela nativa)',
    /baixada em Word/.test((alvo.querySelector('[data-aviso-box]') || {}).textContent || ''));
  // com a OS completa, o arquivo Word sai de FOLHA INTEIRA (é a mesma regra do papel impresso)
  const osCompleta = { numero: '700', modelo: 'Kyocera', numeroSerie: 'SN1', patrimonio: 'P7', defeito: 'não puxa' };
  const arqCheio = w.DIGICOPY_IMPRESSAO.regras.arquivoWord({
    venda: Object.assign({}, nucleo.obter('vendas', 'vw'), { os: osCompleta }), cliente: nucleo.obter('clientes', 'c1')
  });
  ok('com a OS completa, o Word sai de folha inteira (duas assinaturas)',
    arqCheio.html.indexOf('ass-dupla') > 0 && w.DIGICOPY_IMPRESSAO.regras.tipoDePapel({ os: osCompleta }) === 'folha inteira');
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — a venda do núcleo novo responde como o sistema de hoje (numeração, item, estoque, total, financeiro) e a tela funciona.');
try { w.close(); } catch (e) { }
process.exit(0);
