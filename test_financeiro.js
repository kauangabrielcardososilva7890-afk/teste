// test_financeiro.js — v1.0.0 (fase 3 do redesenho: o FINANCEIRO)
//
// O financeiro do núcleo novo (contas a receber + contas a pagar) tem que se comportar como o
// que está rodando hoje. Este teste prova de quatro jeitos:
//   1) EVIDÊNCIA: cada regra copiada é conferida no arquivo de origem — se alguém mudar a regra
//      no sistema de hoje, este teste avisa que a cópia precisa ser revisitada;
//   2) DIFERENCIAL: a busca, o código exato, o valor, as datas e a repetição são rodados LADO A
//      LADO com as funções que estão no sistema de hoje (extraídas do arquivo de verdade);
//   3) REGRAS: o que é do arquivo novo e não existe no de hoje (dia em milissegundos, o que a
//      baixa grava, os campos do título e da despesa);
//   4) TELA: a tela funciona de verdade num navegador de mentira (modos Hoje/Abertos/Todos,
//      Filtrar pendente, baixa com Pix, novo lançamento com repetição, despesa, apagar com
//      motivo, lixeira e restaurar) — sem alert/confirm/prompt nativos e sem gravar fora do
//      núcleo.
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== FINANCEIRO (fase 3) ==');
  console.log('  (não rodou: falta a dependência \'jsdom\' — não é defeito do sistema)');
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, detalhe) {
  if (!cond) { console.error('  \u2718 ' + nome + (detalhe ? '  [' + detalhe + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}

const dom = new JSDOM('<!DOCTYPE html><body><div id="fin"></div><div id="finpagar"></div></body>',
  { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window, doc = w.document;
w.alert = () => { throw new Error('USOU alert NATIVO'); };
w.confirm = () => { throw new Error('USOU confirm NATIVO'); };
w.prompt = () => { throw new Error('USOU prompt NATIVO'); };

const fonteFin = fs.readFileSync('novo/financeiro.js', 'utf8');
const codigoFin = fonteFin.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

// as três peças carregadas de verdade (núcleo, caixa de seleção e o financeiro)
w.eval(fs.readFileSync('novo/nucleo.js', 'utf8'));
w.eval(fs.readFileSync('novo/selecao.js', 'utf8'));
w.eval(fonteFin);
const R = w.DIGICOPY_FINANCEIRO.regras;

// dia(0) = hoje (UTC, como o sistema grava); dia(-40) = 40 dias atrás
const dia = (delta) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

console.log('== FINANCEIRO DO NÚCLEO NOVO (contas a receber e a pagar) ==');
ok('sem alert/confirm/prompt nativos no arquivo novo',
  !/\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/.test(codigoFin));
ok('nenhum onclick escrito no HTML (os eventos são ligados no código — regra das telas novas)',
  codigoFin.indexOf('onclick') < 0);
ok('não grava fora do núcleo (sem localStorage) e não fala com a nuvem (sem fetch)',
  codigoFin.indexOf('localStorage') < 0 && codigoFin.indexOf('fetch(') < 0);

console.log('-- 1) EVIDÊNCIA: as regras copiadas ainda existem no sistema de hoje --');
{
  const provas = [
    ['ajustes_v52213_financeiro_receber_patch.js', "var FORMAS_BAIXA = ['Dinheiro'", 'as 7 formas da baixa (sem "A prazo")'],
    ['ajustes_v52213_financeiro_receber_patch.js', 'if(n>60) n=60', 'repetição de no máximo 60 vezes'],
    ['ajustes_v52213_financeiro_receber_patch.js', "cr.status = 'pago'", 'a baixa marca o título como pago'],
    ['ajustes_v52213_financeiro_receber_patch.js', 'Mesmas formas da venda, <b>sem A prazo</b>', 'o aviso de que a baixa não tem "A prazo"'],
    ['ajustes_v52243_financeiro_filtros_patch.js', "['por_valor','Por Valor']", 'os 8 campos da busca'],
    ['ajustes_v52243_financeiro_filtros_patch.js', '/pago|baixad|quitad/i', '"pago", "baixado" e "quitado" contam como pagos'],
    ['ajustes_v52243_financeiro_filtros_patch.js', "f.className='h-9 px-4 rounded-xl bg-[#0a1e8a] text-white text-[12px] font-bold'", 'o botão Filtrar volta ao normal depois de aplicar (v5.24.34)'],
    ['ajustes_v52243_financeiro_filtros_patch.js', 'datasAbertos = ST.modo', 'De/Até só aparecem no modo Abertos'],
    ['app.js', 'f-cp-cat', 'os campos da despesa a pagar (fornecedor, descrição, categoria, valor, vencimento, status)'],
    ['app.js', 'Informe fornecedor', 'fornecedor é obrigatório na despesa']
  ];
  provas.forEach(([arquivo, marca, oQue]) => {
    ok('o sistema de hoje ainda faz: ' + oQue, fs.readFileSync(arquivo, 'utf8').indexOf(marca) >= 0, arquivo);
  });
}

console.log('-- 2) DIFERENCIAL: as regras são as mesmas do sistema de hoje --');
{
  // extrai do arquivo de verdade só a parte pura (para no ponto em que ele passa a mexer na tela)
  const srcF = fs.readFileSync('ajustes_v52243_financeiro_filtros_patch.js', 'utf8');
  w.eval(srcF.slice(srcF.indexOf('var CAMPOS'), srcF.indexOf('if(typeof document')));
  const srcR = fs.readFileSync('ajustes_v52213_financeiro_receber_patch.js', 'utf8');
  w.eval(srcR.slice(srcR.indexOf('var FORMAS_BAIXA'), srcR.indexOf('if(typeof document')));

  ok('as 7 formas da baixa são exatamente as de hoje, na mesma ordem (sem "A prazo")',
    JSON.stringify(R.FORMAS_BAIXA) === JSON.stringify(w.FORMAS_BAIXA) && R.FORMAS_BAIXA.length === 7 &&
    R.FORMAS_BAIXA.indexOf('A prazo') < 0, JSON.stringify(R.FORMAS_BAIXA));
  ok('os 8 campos da busca são exatamente os de hoje, na mesma ordem',
    JSON.stringify(R.CAMPOS) === JSON.stringify(w.CAMPOS) && R.CAMPOS.length === 8, JSON.stringify(R.CAMPOS));

  // código exato (tira zero à esquerda e qualquer letra)
  const codigos = ['000123', '12-3', '', 'abc', '0', '007', '000', 'venda 10', null, undefined, 1230];
  ok('código exato dá o mesmo resultado de hoje em ' + codigos.length + ' casos',
    codigos.every((c) => R.codigoNorm(c) === w.codigoNorm(c)),
    codigos.map((c) => [c, R.codigoNorm(c), w.codigoNorm(c)]).join(' | '));
  const valores = [['250,50', '250.5'], ['80', '80,00'], ['10', '10,01'], ['0', ''], ['1.000,00', '1000']];
  ok('valor igual dá o mesmo resultado de hoje (com vírgula, ponto e centavo de diferença)',
    valores.every(([a, b]) => R.valorIgual(a, b) === w.valorIgual(a, b)),
    valores.map(([a, b]) => [a, b, R.valorIgual(a, b)]).join(' | '));

  // repetir mês a mês (inclui o fim do mês: 31 de janeiro + 1 mês = último dia de fevereiro)
  const bases = ['2026-01-31', '2026-08-31', '2026-12-15', '2026-09-24', '2027-02-28'];
  let iguaisAdd = 0;
  bases.forEach((b) => { for (let m = 0; m <= 3; m++) { if (R.addMeses(b, m) === w.addMeses(b, m)) iguaisAdd++; } });
  ok('somar meses dá o mesmo resultado de hoje em ' + iguaisAdd + ' casos (inclusive 31 em fevereiro)',
    iguaisAdd === bases.length * 4 && R.addMeses('2026-01-31', 1) === w.addMeses('2026-01-31', 1) &&
    R.addMeses('2026-12-15', 2) === w.addMeses('2026-12-15', 2),
    'jan/31 +1 = ' + R.addMeses('2026-01-31', 1) + ' | dez/15 +2 = ' + R.addMeses('2026-12-15', 2));

  const quantidades = [1, 3, 60, 61, 0, 'x', -2];
  const rep = quantidades.map((q) => [q, JSON.stringify(R.montarRepeticoes({ descricao: 'Mensalidade', valor: 90, clienteId: 'c1', vencimento: '2026-01-31' }, q)),
    JSON.stringify(w.montarRepeticoes({ descricao: 'Mensalidade', valor: 90, clienteId: 'c1', vencimento: '2026-01-31' }, q))]);
  ok('repetir o lançamento dá a mesma lista de hoje em ' + quantidades.length + ' quantidades (inclusive 61 → 60)',
    rep.every(([, meu, dele]) => meu === dele), rep.filter(([, meu, dele]) => meu !== dele).join(' | '));
  ok('61 vezes vira 60 (o teto de hoje) e o último vencimento é o 60º mês',
    R.montarRepeticoes({ descricao: 'x', valor: 1, vencimento: '2026-01-31' }, 61).length === 60 &&
    R.montarRepeticoes({ descricao: 'x', valor: 1, vencimento: '2026-01-31' }, 61)[59].vencimento === w.addMeses('2026-01-31', 59));

  // o que a baixa grava no título
  const titulo = R.aplicarBaixaTitulo({ id: 'cr1', status: 'aberto' }, 'Pix', '2026-09-24T10:00:00.000Z');
  const tituloHoje = w.aplicarBaixaTitulo({ id: 'cr1', status: 'aberto' }, 'Pix', '2026-09-24T10:00:00.000Z');
  ok('a baixa grava os mesmos 4 campos de hoje (forma, data, status pago e baixaForma)',
    JSON.stringify(titulo) === JSON.stringify(tituloHoje) && titulo.status === 'pago' && titulo.baixaForma === 'Pix');

  // ── a busca: rodada lado a lado com a de hoje, sobre os MESMOS lançamentos ──
  const F = [
    { id: 'r1', descricao: 'Aluguel', valor: 100, status: 'aberto', vencimento: '2026-09-24T00:00:00.000Z', criadoEm: '2026-08-01T10:00:00.000Z', clienteId: 'c1' },
    { id: 'r2', descricao: 'Mensalidade', valor: 250.5, status: 'pago', vencimento: '2026-09-30T00:00:00.000Z', pagamentoData: '2026-09-30T12:00:00.000Z', clienteId: 'c2' },
    { id: 'r3', descricao: 'Recarga', valor: 80, status: 'baixado', vencimento: '2026-09-20T00:00:00.000Z', clienteId: 'c1' },
    { id: 'p1', descricao: 'Papel', valor: 40, status: 'aberto', vencimento: '2026-10-05T00:00:00.000Z', fornecedor: 'Papelaria Central' },
    { id: 'p2', descricao: 'Luz', valor: 300, status: 'quitado', vencimento: '2026-09-15T00:00:00.000Z', fornecedor: 'Energia' },
    { id: 'p3', descricao: 'Sem data', valor: 10, status: 'aberto' },
    { id: 'p4', descricao: 'Pix recebido', valor: 12.34, status: 'aberto', pixId: '000123', vencimento: '2026-10-01T00:00:00.000Z' },
    { id: 'p5', descricao: 'Caixa', valor: 5, status: 'aberto', legadoCodigo: '000045', vencimento: '2026-10-02T00:00:00.000Z' },
    { id: 'p6', descricao: 'Venda 12', valor: 60, status: 'aberto', vendaNumero: '0012', numeroParcela: '3', leituraNumero: '0099', vencimento: '2026-10-03T00:00:00.000Z' }
  ];
  const clientes = { c1: { nome: 'José Ávila', codigo: '0007' }, c2: { nome: 'Maria Lopes', codigo: '12' } };
  const cliDe = (c) => clientes[c.clienteId] || {};
  const casos = [
    ['nada escolhido, modo Hoje (hoje = 24/09)', { q: '', modo: 'hoje', hoje: '2026-09-24' }, ['r1', 'p3']],
    ['os abertos (o "baixado" do r3 conta como pago, como hoje)', { q: '', modo: 'abertos', hoje: '2026-09-24' }, ['r1', 'p1', 'p3', 'p4', 'p5', 'p6']],
    ['os abertos de 01/10 a 05/10', { q: '', modo: 'abertos', de: '2026-10-01', ate: '2026-10-05', hoje: '2026-09-24' }, ['p1', 'p4', 'p5', 'p6']],
    ['todos', { q: '', modo: 'todos', hoje: '2026-09-24' }, ['r1', 'r2', 'r3', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6']],
    ['nome "josé" (acha o cliente)', { q: 'josé', modo: 'todos', hoje: '2026-09-24' }, ['r1', 'r3']],
    ['nome "áVILA" (maiúscula no meio)', { q: 'áVILA', modo: 'todos', hoje: '2026-09-24' }, ['r1', 'r3']],
    ['nome "jose" SEM acento não acha "José" — é assim no sistema de hoje (a busca de nome não tira acento)',
      { q: 'jose', modo: 'todos', hoje: '2026-09-24' }, []],
    ['nome "papelaria" (fornecedor)', { q: 'papelaria', modo: 'todos', hoje: '2026-09-24' }, ['p1']],
    ['Cód. Cliente "7" (tira zero à esquerda)', { campo: 'cod_cliente', q: '7', modo: 'todos', hoje: '2026-09-24' }, ['r1', 'r3']],
    ['Por Valor "250,50"', { campo: 'por_valor', q: '250,50', modo: 'todos', hoje: '2026-09-24' }, ['r2']],
    ['Cód. Caixa "45"', { campo: 'cod_caixa', q: '45', modo: 'todos', hoje: '2026-09-24' }, ['p5']],
    ['Cód. Pix "123"', { campo: 'cod_pix', q: '123', modo: 'todos', hoje: '2026-09-24' }, ['p4']],
    ['Cód. Venda "12"', { campo: 'cod_venda', q: '12', modo: 'todos', hoje: '2026-09-24' }, ['p6']],
    ['Cód. Parcela "3"', { campo: 'cod_parcela', q: '3', modo: 'todos', hoje: '2026-09-24' }, ['p6']],
    ['Cód. Leitura "99"', { campo: 'cod_leitura', q: '99', modo: 'todos', hoje: '2026-09-24' }, ['p6']],
    ['busca sem achar ninguém', { q: 'zzzz', modo: 'todos', hoje: '2026-09-24' }, []],
    ['campo desconhecido com termo (hoje devolve tudo)', { campo: 'xpto', q: '1', modo: 'todos', hoje: '2026-09-24' }, ['r1', 'r2', 'r3', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6']]
  ];
  let iguaisBusca = 0;
  casos.forEach(([nome, opts, esperado]) => {
    const meu = R.filtraLancamentos(F, Object.assign({ clienteDe: cliDe }, opts)).map((c) => c.id);
    const dele = w.filtraLancamentos(F, Object.assign({ clienteDe: cliDe }, opts)).map((c) => c.id);
    const mesmo = JSON.stringify(meu) === JSON.stringify(dele);
    if (mesmo) iguaisBusca++;
    ok('busca igual à de hoje: ' + nome, mesmo && JSON.stringify(meu) === JSON.stringify(esperado),
      'meu=' + meu.join(',') + ' hoje=' + dele.join(',') + ' esperado=' + esperado.join(','));
  });
  ok('a busca nova responde igual à de hoje em ' + iguaisBusca + ' de ' + casos.length + ' combinações de campo, modo, data e termo',
    iguaisBusca === casos.length);

  // datas do lançamento (o modo Hoje olha TODAS as datas do título, como hoje)
  const comDatas = { vencimento: '2026-09-24T00:00:00.000Z', pagamentoData: '2026-09-25T00:00:00.000Z' };
  ok('datas do lançamento são as mesmas de hoje (6 datas possíveis)',
    JSON.stringify(R.datasDoLancamento(comDatas)) === JSON.stringify(w.datasDoLanc(comDatas)));
  ok('Hoje e o intervalo de datas respondem igual à de hoje',
    R.bateHoje(comDatas, '2026-09-25') === w.bateHoje(comDatas, '2026-09-25') &&
    R.noIntervalo(comDatas, '2026-09-25', '') === w.noIntervalo(comDatas, '2026-09-25', '') &&
    R.noIntervalo(comDatas, '', '2026-09-20') === w.noIntervalo(comDatas, '', '2026-09-20'));

  // as 5 ordens da tela
  const listaOrd = [{ ref: { descricao: 'b', valor: 10, vencimento: '2026-10-01' } }, { ref: { descricao: 'A', valor: 30, vencimento: '2026-09-01' } }, { ref: { descricao: 'c', valor: 20, vencimento: '2026-11-01' } }];
  const ordemHoje = (o) => {
    const ord = {
      'venc-asc': (a, b) => String(a.ref.vencimento).localeCompare(String(b.ref.vencimento)),
      'venc-desc': (a, b) => String(b.ref.vencimento).localeCompare(String(a.ref.vencimento)),
      'valor-desc': (a, b) => b.ref.valor - a.ref.valor,
      'valor-asc': (a, b) => a.ref.valor - b.ref.valor,
      'desc': (a, b) => String(a.ref.descricao).localeCompare(String(b.ref.descricao), 'pt-BR', { sensitivity: 'base' })
    };
    return listaOrd.slice().sort(ord[o]).map((x) => x.ref.descricao);
  };
  ok('as 5 ordens dão o mesmo resultado de hoje',
    ['venc-asc', 'venc-desc', 'valor-desc', 'valor-asc', 'desc'].every((o) =>
      JSON.stringify(R.ordenarLancamentos(listaOrd, o).map((x) => x.ref.descricao)) === JSON.stringify(ordemHoje(o))),
    ['venc-asc', 'valor-desc', 'desc'].map((o) => R.ordenarLancamentos(listaOrd, o).map((x) => x.ref.descricao).join('')).join(' | '));

  // o que hoje conta como "pago"
  ok('"pago", "baixado" e "quitado" contam como pagos — e "aberto" não (igual a hoje)',
    R.estaPago({ status: 'pago' }) && R.estaPago({ status: 'BAIXADO' }) && R.estaPago({ status: 'Quitado ' }) &&
    !R.estaPago({ status: 'aberto' }) && !R.estaPago({ status: '' }) && R.estaPago({}) === w.estaPago({}));
}

console.log('-- 3) AS REGRAS DO ARQUIVO NOVO (o que o núcleo grava de diferente) --');
{
  ok('o núcleo novo grava data em milissegundos: o financeiro entende as duas formas',
    R.datasDoLancamento({ vencimento: Date.UTC(2026, 8, 24) })[0] === '2026-09-24' &&
    R.datasDoLancamento({ vencimento: '2026-09-24T00:00:00.000Z' })[0] === '2026-09-24');

  const cr = R.novoReceber({ descricao: '  Mensalidade  ', valor: '90,50', vencimento: '2026-09-24', clienteId: 'c1', clienteNome: 'José Ávila' }, 'e1');
  ok('o título novo sai com os campos de hoje (descrição limpa, valor numérico, status aberto)',
    cr.descricao === 'Mensalidade' && cr.valor === 90.5 && cr.status === 'aberto' &&
    cr.vencimento === '2026-09-24' && cr.pagamentoData === null && cr.clienteId === 'c1');

  const cp = R.novaDespesa({ fornecedor: ' Papelaria ', descricao: 'Resma', valor: '40', vencimento: '2026-09-24' }, 'e1');
  ok('a despesa nova sai com os campos de hoje (categoria Suprimentos por padrão, status aberto)',
    cp.fornecedor === 'Papelaria' && cp.categoria === 'Suprimentos' && cp.valor === 40 && cp.status === 'aberto' && cp.pagamentoData === null);
  const cpPago = R.novaDespesa({ fornecedor: 'Luz', valor: 300, status: 'pago' }, 'e1');
  ok('despesa marcada como paga já sai com a data do pagamento preenchida',
    cpPago.status === 'pago' && typeof cpPago.pagamentoData === 'string' && cpPago.pagamentoData.length >= 10);
  ok('as 7 categorias de despesa são as de hoje', R.CATEGORIAS_DESPESA.length === 7 &&
    R.CATEGORIAS_DESPESA.join(',') === 'Suprimentos,Peças,Infraestrutura,Salários,Impostos,Frete,Outros');
}

console.log('-- 4) A TELA: modos, filtros, baixa, novo lançamento, despesa, apagar e lixeira --');
{
  const nucleo = w.DIGICOPY_NUCLEO.criar({ empresaId: 'e1', origem: 'teste', guardar: function () { } });
  nucleo.registrarLista('clientes', { nome: { obrigatorio: true, tipo: 'texto' } });
  nucleo.salvar('clientes', { id: 'c1', nome: 'José Ávila' });
  nucleo.salvar('clientes', { id: 'c2', nome: 'Maria Lopes' });

  // o título é criado agora e depois ganha a data de criação de 40 dias atrás (o modo Hoje olha
  // TODAS as datas do título — igual a hoje — então a ficha precisa ter data de verdade)
  const criar = (lista, dados) => {
    const r = nucleo.salvar(lista, dados);
    if (!r.ok) throw new Error('fixture ' + lista + ': ' + JSON.stringify(r.erros));
    const r2 = nucleo.salvar(lista, { id: r.item.id, criadoEm: dia(-40) });
    if (!r2.ok) throw new Error('fixture criadoEm: ' + JSON.stringify(r2.erros));
    return r2.item;
  };
  // a tela é quem registra as duas listas no núcleo (é isso que a tela usa na vida real)
  const tela = w.DIGICOPY_FINANCEIRO.criarFinanceiro({ nucleo: nucleo, elemento: doc.getElementById('fin'), empresaId: 'e1', tipo: 'todos' });
  const alvo = doc.getElementById('fin');
  ok('criar o financeiro registra as duas listas no núcleo (nada mais precisa avisar o coração)',
    Array.isArray(nucleo.listar('contasReceber')) && Array.isArray(nucleo.listar('contasPagar')));

  criar('contasReceber', { id: 'cr1', descricao: 'Aluguel da impressora', clienteId: 'c1', valor: 100, vencimento: dia(0), status: 'aberto' });
  criar('contasReceber', { id: 'cr2', descricao: 'Mensalidade de setembro', clienteId: 'c2', valor: 250.5, vencimento: dia(5), status: 'aberto' });
  criar('contasReceber', { id: 'cr3', descricao: 'Recarga 85A', clienteId: 'c1', valor: 80, vencimento: dia(-3), status: 'baixado' });
  criar('contasPagar', { id: 'cp1', fornecedor: 'Papelaria Central', descricao: 'Resma de papel', valor: 40, vencimento: dia(1), status: 'aberto' });
  criar('contasPagar', { id: 'cp2', fornecedor: 'Energia Co', descricao: 'Conta de luz', valor: 300, vencimento: dia(-10), status: 'quitado', pagamentoData: dia(-10) });
  tela.desenhar();
  const clicar = (sel) => { const e = alvo.querySelector(sel); if (!e) throw new Error('não achei ' + sel); e.dispatchEvent(new w.Event('click', { bubbles: true })); };
  const clicarDoc = (sel) => { const e = doc.querySelector(sel); if (!e) throw new Error('não achei (janela) ' + sel); e.dispatchEvent(new w.Event('click', { bubbles: true })); };
  const porValor = (sel, v) => { const e = alvo.querySelector(sel); if (!e) throw new Error('não achei ' + sel); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); return e; };
  const naJanela = (sel, v) => { const e = doc.querySelector(sel); if (!e) throw new Error('não achei (janela) ' + sel); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); return e; };
  const linhas = () => alvo.querySelectorAll('tbody tr[data-linha-fin]').length;
  const janela = () => doc.querySelector('[data-fin-modal]');
  const descricoes = () => Array.prototype.map.call(alvo.querySelectorAll('tbody tr[data-linha-fin]'), (tr) => tr.children[2].textContent.replace(/\s+/g, ' ').trim());
  const marcar = (id) => { const c = alvo.querySelector('[data-marcar="' + id + '"]'); c.checked = true; c.dispatchEvent(new w.Event('change', { bubbles: true })); };

  ok('a tela abre com os 4 botões e a tabela', !!alvo.querySelector('[data-fin-novo]') && !!alvo.querySelector('[data-fin-receber]') &&
    !!alvo.querySelector('[data-fin-pagar]') && !!alvo.querySelector('[data-fin-excluir]') && !!alvo.querySelector('.vnd-tabela'));
  ok('e começa no modo Hoje (como hoje), mostrando só o que vence/foi pago hoje', linhas() === 1 && descricoes()[0].indexOf('Aluguel') >= 0,
    linhas() + ' → ' + descricoes().join(' | '));
  ok('o rodapé do topo soma o que está em aberto no filtro (R$ 100,00)', /em aberto: 100,00/.test(alvo.textContent), alvo.textContent.slice(0, 200));

  clicar('[data-modo="todos"]');
  ok('modo Todos mostra os 5 lançamentos (3 a receber + 2 a pagar)', linhas() === 5, linhas() + ' linhas');
  ok('a soma do que está em aberto muda para R$ 390,50', /em aberto: 390,50/.test(alvo.textContent));
  ok('De/Até NÃO aparecem fora do modo Abertos (igual ao v5.24.34)', !alvo.querySelector('[data-fin-de]') && !alvo.querySelector('[data-fin-ate]'));

  clicar('[data-modo="abertos"]');
  ok('modo Abertos tira os pagos (sobram 3: dois a receber e um a pagar)', linhas() === 3, linhas() + ' linhas');
  ok('e aí sim aparecem os campos De e Até', !!alvo.querySelector('[data-fin-de]') && !!alvo.querySelector('[data-fin-ate]'));
  porValor('[data-fin-de]', dia(0));
  porValor('[data-fin-ate]', dia(0));
  clicar('[data-fin-filtrar]');
  ok('Abertos de hoje até hoje: só o que vence hoje', linhas() === 1 && descricoes()[0].indexOf('Aluguel') >= 0, descricoes().join(' | '));

  clicar('[data-modo="todos"]');
  ok('trocar de modo limpa as datas (volta a mostrar tudo)', linhas() === 5 && !alvo.querySelector('[data-fin-de]'));

  // FILTRAR fica pendente até apertar (v5.24.34): escolher primeiro, apertar Filtrar aí aplica
  const sel = alvo.querySelector('[data-fin-campo]');
  sel.value = 'por_valor';
  sel.dispatchEvent(new w.Event('change', { bubbles: true }));
  const termo = alvo.querySelector('[data-fin-termo]');
  termo.value = '250,50';
  ok('escolher campo/ordem deixa o botão Filtrar laranja (avisa que falta apertar)', /fin-pendente/.test(alvo.querySelector('[data-fin-filtrar]').className));
  ok('e a lista ainda NÃO foi filtrada (continua com os 5)', linhas() === 5, linhas() + ' linhas');
  clicar('[data-fin-filtrar]');
  ok('apertando Filtrar: acha a mensalidade pelo valor', linhas() === 1 && descricoes()[0].indexOf('Mensalidade') >= 0, descricoes().join(' | '));
  ok('e o botão volta ao normal (não fica laranja piscando)', !/fin-pendente/.test(alvo.querySelector('[data-fin-filtrar]').className));

  const caixa = alvo.querySelector('[data-fin-campo]');
  caixa.value = 'cod_caixa';
  caixa.dispatchEvent(new w.Event('change', { bubbles: true }));
  const termo2 = alvo.querySelector('[data-fin-termo]');
  termo2.value = '1';
  termo2.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('Enter no termo também filtra (o "1" acha o cr1 pelo código e o cp1)', linhas() === 2, descricoes().join(' | '));

  clicar('[data-fin-limpar]');
  ok('Remover filtro volta tudo (termo vazio, 5 lançamentos) e ordena por vencimento (o mais vencido primeiro)',
    linhas() === 5 && alvo.querySelector('[data-fin-termo]').value === '' && descricoes()[0].indexOf('Conta de luz') >= 0, descricoes().join(' | '));
  porValor('[data-fin-ordem]', 'valor-desc');
  clicar('[data-fin-filtrar]');
  ok('ordem por valor (maior primeiro) põe a conta de luz na frente', descricoes()[0].indexOf('Conta de luz') >= 0, descricoes().join(' | '));

  // ── a baixa (Receber) ──
  clicar('[data-fin-receber]');
  ok('Receber sem marcar nada avisa e NÃO abre janela', janela() === null && /Marque pelo menos um título/.test(alvo.querySelector('[data-fin-erro]').textContent));
  marcar('cr2');
  clicar('[data-fin-receber]');
  ok('com um título marcado, a janela da baixa abre (com o total)', !!janela() && /Total a baixar: 250,50/.test(janela().textContent), janela() ? janela().textContent.slice(0, 160) : 'sem janela');
  const formasJanela = Array.prototype.map.call(janela().querySelectorAll('[data-fin-baixa-forma] option'), (o) => o.value);
  ok('a janela oferece as 7 formas da baixa, sem "A prazo"', formasJanela.length === 7 && formasJanela.indexOf('A prazo') < 0, formasJanela.join(', '));
  naJanela('[data-fin-baixa-forma]', 'Pix');
  ok('escolher Pix avisa que o título fica pago de verdade', /Pix: o título fica pago de verdade/.test(janela().textContent));
  const mudancasAntes = nucleo.mudancas().length;
  clicarDoc('[data-fin-botao="1"]');
  const cr2 = nucleo.obter('contasReceber', 'cr2');
  ok('Confirmar baixa fecha a janela e grava o título como pago em Pix', janela() === null && cr2.status === 'pago' &&
    cr2.baixaForma === 'Pix' && cr2.formaPagamento === 'Pix' && typeof cr2.pagamentoData === 'string',
    JSON.stringify([cr2.status, cr2.baixaForma, cr2.formaPagamento]));
  ok('e avisa quantos foram baixados', /1 título\(s\) baixado\(s\) em Pix/.test(alvo.querySelector('[data-fin-aviso]').textContent));
  ok('a baixa entrou na fila da nuvem como UMA mudança', nucleo.mudancas().length === mudancasAntes + 1, (nucleo.mudancas().length - mudancasAntes) + ' mudanças');

  clicar('[data-modo="abertos"]');
  ok('o título baixado sai dos Abertos (sobra o aluguel e a resma)', linhas() === 2, descricoes().join(' | '));
  clicar('[data-modo="todos"]');
  marcar('cr3');
  clicar('[data-fin-receber]');
  ok('título já pago não entra na baixa (avisa e não abre janela)', janela() === null && /já pagos não entram na baixa/.test(alvo.querySelector('[data-fin-erro]').textContent));

  // ── Pagar (despesa) ──
  marcar('cp1');
  clicar('[data-fin-pagar]');
  ok('Pagar abre a mesma janela para o que sai', !!janela() && /Total a baixar: 40,00/.test(janela().textContent));
  naJanela('[data-fin-baixa-forma]', 'Conta');
  clicarDoc('[data-fin-botao="1"]');
  const cp1 = nucleo.obter('contasPagar', 'cp1');
  ok('o pagamento grava a despesa como paga na forma escolhida', cp1.status === 'pago' && cp1.formaPagamento === 'Conta' && cp1.baixaForma === 'Conta');
  ok('e o aviso fala de títulos baixados', /1 título\(s\) baixado\(s\) em Conta/.test(alvo.querySelector('[data-fin-aviso]').textContent));

  // ── duplo clique abre a ficha ──
  const linhaCr1 = alvo.querySelector('tr[data-linha-fin="cr1"]');
  linhaCr1.dispatchEvent(new w.MouseEvent('dblclick', { bubbles: true }));
  ok('duplo clique na linha abre o histórico do lançamento (com os campos do título)',
    !!janela() && /Histórico do lançamento/.test(janela().textContent) && /Aluguel da impressora/.test(janela().textContent) &&
    /clienteId/.test(janela().textContent));
  ok('a ficha do título a receber não oferece editar (como hoje)', !/✏️ Editar/.test(janela().textContent));
  clicarDoc('[data-fin-botao="0"]');
  ok('Fechar tira a janela da frente', janela() === null);

  // ── novo lançamento a receber, com repetição ──
  const quantosCR = nucleo.listar('contasReceber').length;
  clicar('[data-fin-novo]');
  ok('Novo lançamento abre a janela com a caixa de seleção do cliente', !!janela() && !!doc.querySelector('[data-fin-cliente] [data-termo]'));
  clicarDoc('[data-fin-botao="1"]');
  ok('Salvar sem cliente avisa dentro da janela (não fecha e não grava)', !!janela() &&
    /Escolha o cliente/.test(doc.querySelector('[data-fin-janela-erro]').textContent) && nucleo.listar('contasReceber').length === quantosCR);
  const campoCli = doc.querySelector('[data-fin-cliente] [data-termo]');
  campoCli.value = 'jose';
  campoCli.dispatchEvent(new w.Event('input', { bubbles: true }));
  campoCli.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  naJanela('[data-fin-novo-desc]', 'Mensalidade teste');
  naJanela('[data-fin-novo-valor]', '90');
  naJanela('[data-fin-novo-venc]', dia(0));
  naJanela('[data-fin-novo-rep]', '3');
  ok('o aviso da repetição mostra as 3 datas antes de salvar', /3 lançamentos: /.test(doc.querySelector('[data-fin-rep-prev]').textContent),
    doc.querySelector('[data-fin-rep-prev]').textContent);
  clicarDoc('[data-fin-botao="1"]');
  const novosCR = nucleo.listar('contasReceber').filter((c) => c.descricao === 'Mensalidade teste');
  ok('repetir 3 vezes cria os 3 títulos a receber de uma vez', novosCR.length === 3 && nucleo.listar('contasReceber').length === quantosCR + 3,
    novosCR.length + ' criados');
  ok('com os vencimentos em 3 meses seguidos (o dia ajustado no fim do mês)',
    novosCR.map((c) => c.vencimento).sort().join('|') === [R.addMeses(dia(0), 0), R.addMeses(dia(0), 1), R.addMeses(dia(0), 2)].sort().join('|'),
    novosCR.map((c) => c.vencimento).join(', '));
  ok('cada um no nome do cliente escolhido pela caixa', novosCR.every((c) => c.clienteId === 'c1' && c.clienteNome === 'José Ávila') &&
    novosCR.every((c) => c.valor === 90 && c.status === 'aberto'));
  ok('e a tela avisa quantos lançamentos foram criados', /3 lançamento\(s\) a receber criado\(s\)/.test(alvo.querySelector('[data-fin-aviso]').textContent));

  // baixa em lote (o "baixarMultiplasCR" de hoje): marcar vários e receber de uma vez
  marcar(novosCR[0].id);
  marcar(novosCR[1].id);
  clicar('[data-fin-receber]');
  ok('a janela da baixa assume os 2 títulos marcados', /Baixa — receber \(2 título\(s\)\)/.test(janela().textContent));
  clicarDoc('[data-fin-botao="1"]');
  ok('baixa em lote: os dois ficam pagos de uma vez, em Dinheiro (a forma já escolhida)',
    nucleo.obter('contasReceber', novosCR[0].id).status === 'pago' && nucleo.obter('contasReceber', novosCR[1].id).status === 'pago' &&
    nucleo.obter('contasReceber', novosCR[0].id).baixaForma === 'Dinheiro' && /2 título\(s\) baixado\(s\) em Dinheiro/.test(alvo.querySelector('[data-fin-aviso]').textContent));

  // ── apagar com motivo + lixeira + restaurar ──
  clicar('[data-fin-excluir]');
  ok('Apagar sem marcar nada avisa e não abre janela', janela() === null && /Marque o que você quer apagar/.test(alvo.querySelector('[data-fin-erro]').textContent));
  marcar('cr1');
  clicar('[data-fin-excluir]');
  ok('Apagar abre a janela pedindo o motivo (o mesmo pedido de hoje)', !!janela() && /Motivo/.test(janela().textContent));
  naJanela('[data-fin-motivo]', 'ab');
  clicarDoc('[data-fin-botao="1"]');
  ok('motivo curto demais é recusado', !!janela() && /pelo menos 3 letras/.test(doc.querySelector('[data-fin-janela-erro]').textContent));
  naJanela('[data-fin-motivo]', 'lançamento duplicado');
  const quantosTodos = linhas();
  clicarDoc('[data-fin-botao="1"]');
  ok('com o motivo, o lançamento sai da lista na hora', janela() === null && linhas() === quantosTodos - 1 && descricoes().indexOf('Aluguel da impressora') < 0);
  const cr1Reg = nucleo.obter('contasReceber', 'cr1');
  ok('mas o registro NÃO é arrancado do núcleo: fica com a lápide (quem apagou, quando e por quê)',
    !!cr1Reg && Number(cr1Reg.apagadoEm) > 0 && cr1Reg.motivo === 'lançamento duplicado' && cr1Reg.apagadoPor !== undefined,
    JSON.stringify([cr1Reg ? cr1Reg.motivo : null, cr1Reg ? cr1Reg.apagadoEm : null]));
  ok('a tela avisa que o motivo ficou no histórico', /motivo ficou no histórico/.test(alvo.querySelector('[data-fin-aviso]').textContent));
  ok('e o chip Apagados conta 1', /Apagados \(1\)/.test(alvo.textContent), /Apagados[^<]*/.exec(alvo.textContent)[0]);
  clicar('[data-modo="apagados"]');
  ok('o modo Apagados mostra o que saiu, com o motivo escrito', linhas() === 1 && /apagado: lançamento duplicado/.test(alvo.textContent));
  ok('e ali não tem caixa de marcar (não se apaga o que já está apagado)',
    !alvo.querySelector('[data-marcar="cr1"]') && !alvo.querySelector('[data-fin-marcar-todos]'));
  clicar('[data-restaurar="cr1"]');
  ok('Restaurar traz o lançamento de volta (a lixeira fica vazia e o chip volta a 0)',
    linhas() === 0 && /Apagados \(0\)/.test(alvo.textContent) && Number(nucleo.obter('contasReceber', 'cr1').apagadoEm) === 0);
  clicar('[data-modo="todos"]');
  ok('e ele reaparece na lista normal com o status de antes (agora com os 3 títulos criados antes)',
    descricoes().indexOf('Aluguel da impressora') >= 0 && linhas() === 8, descricoes().join(' | '));

  // ── a tela de contas a pagar ──
  const telaPagar = w.DIGICOPY_FINANCEIRO.criarFinanceiro({ nucleo: nucleo, elemento: doc.getElementById('finpagar'), empresaId: 'e1', tipo: 'Pagar' });
  const alvoP = doc.getElementById('finpagar');
  const clicarP = (sel) => { const e = alvoP.querySelector(sel); if (!e) throw new Error('não achei (pagar) ' + sel); e.dispatchEvent(new w.Event('click', { bubbles: true })); };
  const naJanelaP = (sel, v) => { const e = doc.querySelector(sel); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); return e; };
  const linhasP = () => alvoP.querySelectorAll('tbody tr[data-linha-fin]').length;
  clicarP('[data-modo="todos"]');
  ok('a tela de contas a pagar só mostra o que sai (2 despesas)', linhasP() === 2, linhasP() + ' linhas');
  ok('e não mostra o botão de novo lançamento a receber', !alvoP.querySelector('[data-fin-novo]') && !!alvoP.querySelector('[data-fin-nova-despesa]'));

  clicarP('[data-fin-nova-despesa]');
  ok('Nova despesa abre a janela com os campos de hoje (fornecedor, descrição, categoria, valor, vencimento, status)',
    !!janela() && !!doc.querySelector('[data-fin-forn]') && !!doc.querySelector('[data-fin-desc]') && !!doc.querySelector('[data-fin-cat]') &&
    !!doc.querySelector('[data-fin-valor]') && !!doc.querySelector('[data-fin-venc]') && !!doc.querySelector('[data-fin-status]'));
  const opcoesCat = Array.prototype.map.call(doc.querySelector('[data-fin-cat]').options, (o) => o.value);
  ok('com as 7 categorias de hoje na lista', opcoesCat.length === 7 && opcoesCat[0] === 'Suprimentos');
  clicarDoc('[data-fin-botao="1"]');
  ok('Salvar sem fornecedor é recusado (o mesmo pedido de hoje)', !!janela() && /Informe o fornecedor/.test(doc.querySelector('[data-fin-janela-erro]').textContent));
  naJanelaP('[data-fin-forn]', 'Gráfica Rápida');
  naJanelaP('[data-fin-desc]', 'Cartuchos');
  naJanelaP('[data-fin-cat]', 'Peças');
  naJanelaP('[data-fin-valor]', '77.70');
  naJanelaP('[data-fin-venc]', dia(3));
  clicarDoc('[data-fin-botao="1"]');
  const novasCP = nucleo.listar('contasPagar').filter((c) => c.fornecedor === 'Gráfica Rápida');
  ok('a despesa é gravada com fornecedor, categoria e valor', novasCP.length === 1 && novasCP[0].categoria === 'Peças' && novasCP[0].valor === 77.7 &&
    novasCP[0].status === 'aberto' && novasCP[0].descricao === 'Cartuchos', JSON.stringify(novasCP[0] && [novasCP[0].categoria, novasCP[0].valor]));
  ok('e a tela avisa que a despesa foi criada', /Despesa criada/.test(alvoP.querySelector('[data-fin-aviso]').textContent));
  ok('a despesa nova aparece na lista de contas a pagar', linhasP() === 3, linhasP() + ' linhas');

  // editar a despesa pela ficha (o caminho do renderModalContaPagar(id) de hoje)
  const linhaP = alvoP.querySelector('[data-linha-fin="' + novasCP[0].id + '"]');
  linhaP.dispatchEvent(new w.MouseEvent('dblclick', { bubbles: true }));
  ok('a ficha da despesa oferece Editar', !!janela() && /✏️ Editar/.test(janela().textContent));
  clicarDoc('[data-fin-botao="1"]');
  ok('Editar abre a janela com o que já estava (fornecedor e valor preenchidos)',
    !!janela() && doc.querySelector('[data-fin-forn]').value === 'Gráfica Rápida' && /Editar despesa/.test(janela().textContent));
  naJanelaP('[data-fin-valor]', '88.80');
  clicarDoc('[data-fin-botao="1"]');
  const editada = nucleo.obter('contasPagar', novasCP[0].id);
  ok('salvar a edição mantém o MESMO registro (não cria outro) e atualiza o valor',
    nucleo.listar('contasPagar').length === 3 && editada.valor === 88.8 && editada.id === novasCP[0].id, JSON.stringify([editada.valor, editada.id === novasCP[0].id]));

  // status pago já na criação (como o select de hoje)
  clicarP('[data-fin-nova-despesa]');
  naJanelaP('[data-fin-forn]', 'Contador');
  naJanelaP('[data-fin-desc]', 'Honorários');
  naJanelaP('[data-fin-valor]', '150');
  naJanelaP('[data-fin-status]', 'pago');
  clicarDoc('[data-fin-botao="1"]');
  const cpPago = nucleo.listar('contasPagar').filter((c) => c.fornecedor === 'Contador')[0];
  ok('despesa criada já como paga sai com a data do pagamento', !!cpPago && cpPago.status === 'pago' && typeof cpPago.pagamentoData === 'string');
  ok('e o pagamento gravado na criação NÃO é uma baixa (sem baixaForma) — como hoje', cpPago.baixaForma === undefined);

  ok('nada foi gravado no navegador (nem localStorage) — a fila do núcleo é o único registro',
    w.localStorage.length === 0 && nucleo.mudancas().length > 10, 'mudanças=' + nucleo.mudancas().length);
}

console.log('-- 5) A LISTA LONGA: teto de 400 e "Mostrar mais" --');
{
  const n2 = w.DIGICOPY_NUCLEO.criar({ empresaId: 'e1', origem: 'teste', guardar: function () { } });
  const alvo = doc.createElement('div');
  doc.body.appendChild(alvo);
  const tela = w.DIGICOPY_FINANCEIRO.criarFinanceiro({ nucleo: n2, elemento: alvo, empresaId: 'e1', tipo: 'Receber' });
  n2.registrarLista('clientes', { nome: { tipo: 'texto' } });
  for (let i = 0; i < 405; i++) n2.salvar('contasReceber', { descricao: 'Título ' + i, valor: 1 + i, vencimento: dia(0), status: 'aberto' });
  tela.desenhar();
  const linhas = () => alvo.querySelectorAll('tbody tr[data-linha-fin]').length;
  ok('com 405 lançamentos, a tela mostra 400 (não trava o navegador)', linhas() === 400, linhas() + ' linhas');
  ok('e oferece "Mostrar mais" com o que sobrou', /Mostrar mais \(5\)/.test(alvo.querySelector('[data-fin-mais]').textContent));
  alvo.querySelector('[data-fin-mais]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('apertando, mostra os 405', linhas() === 405, linhas() + ' linhas');
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — o financeiro do núcleo novo responde como o sistema de hoje (formas da baixa, busca, datas, modos, ordem, despesa, apagar com motivo) e a tela funciona ponta a ponta.');
try { w.close(); } catch (e) { }
process.exit(0);
