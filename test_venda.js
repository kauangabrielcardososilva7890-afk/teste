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
w.eval(fonteVenda);

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
  // extrai a função que roda hoje (vendas_notinhas_fix_patch.js) e roda as duas lado a lado
  const src = fs.readFileSync('vendas_notinhas_fix_patch.js', 'utf8');
  const ini = src.indexOf('window.proximoNumeroVendaLimpo');
  const fim = src.indexOf('\n  };', ini);
  w.eval(src.slice(ini, fim + '\n  };'.length));
  const E = 'e1';
  const casos = [
    { nome: 'lista vazia', vendas: [], empresa: E, espera: '1' },
    { nome: '1, 2, 3 → 4', vendas: [{ numero: '1', empresaId: E }, { numero: '2', empresaId: E }, { numero: '3', empresaId: E }], empresa: E, espera: '4' },
    { nome: 'fora de ordem (10,3,7) → 11', vendas: [{ numero: '10', empresaId: E }, { numero: '3', empresaId: E }, { numero: '7', empresaId: E }], empresa: E, espera: '11' },
    { nome: 'número com letra (AB-9) → 10', vendas: [{ numero: 'AB-9', empresaId: E }], empresa: E, espera: '10' },
    { nome: 'registro migrado é ignorado', vendas: [{ numero: '999', origemMigracao: true, empresaId: E }], empresa: E, espera: '1' },
    { nome: 'número absurdo (500000) é ignorado', vendas: [{ numero: '500000', empresaId: E }], empresa: E, espera: '1' },
    { nome: '600 → 601', vendas: [{ numero: '600', empresaId: E }], empresa: E, espera: '601' },
    { nome: 'outra empresa não conta', vendas: [{ numero: '50', empresaId: 'e2' }], empresa: E, espera: '1' },
    { nome: 'registro SEM empresa não conta quando a empresa é informada (regra de hoje)', vendas: [{ numero: '9' }], empresa: E, espera: '1' },
    { nome: 'sem empresa informada, conta tudo', vendas: [{ numero: '50', empresaId: 'e2' }], empresa: null, espera: '51' }
  ];
  casos.forEach((c) => {
    const novo = w.DIGICOPY_VENDA.regras.numeroDaVenda(c.vendas, c.empresa);
    const antigo = w.proximoNumeroVendaLimpo(c.vendas, c.empresa);
    ok('numeração igual à de hoje: ' + c.nome, novo === antigo && novo === c.espera, 'novo=' + novo + ' antigo=' + antigo + ' espera=' + c.espera);
  });
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
    { valor: 123.45, cfg: { parcelas: 4, intervaloDias: 15, jurosMes: 2 } }
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
  const selForma = porValor('[data-forma]', 'Prazo');
  selForma.dispatchEvent(new w.Event('change', { bubbles: true }));
  clicar('[data-faturar]');
  const terceiro = nucleo.listar('contasReceber').filter((t) => t.status === 'aberto');
  ok('escolhendo "Prazo" na tela, o título fica em aberto com o rótulo de parcela',
    terceiro.length === 1 && terceiro[0].parcela === 1 && terceiro[0].totalParcelas === 1 && /parcela 1\/1/.test(terceiro[0].descricao),
    JSON.stringify(terceiro.map((t) => [t.valor, t.status, t.descricao])));
  const quartaVenda = nucleo.listar('vendas').filter((v) => v.status === 'faturado' && v.numero === '4')[0];
  ok('e a quarta venda saiu numerada e faturada', !!quartaVenda && quartaVenda.formaPagamento === 'Prazo', JSON.stringify(nucleo.listar('vendas').map((v) => [v.numero, v.status])));
  ok('a fila da nuvem registrou tudo (vendas, itens e financeiro)',
    nucleo.mudancas().length >= 6, 'mudanças=' + nucleo.mudancas().length);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — a venda do núcleo novo responde como o sistema de hoje (numeração, item, estoque, total, financeiro) e a tela funciona.');
try { w.close(); } catch (e) { }
process.exit(0);
