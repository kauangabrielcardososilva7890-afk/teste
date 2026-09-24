// test_financeiro.js — v1.0.0 (fase 3 do redesenho: o FINANCEIRO)
// Abre a tela nova do financeiro num navegador de mentira (jsdom) e faz o que a pessoa faz:
// filtra, recebe, paga, cria lançamento, cria despesa, apaga (com motivo) e traz de volta.
//
// O que é provado:
//   1) as REGRAS são as do sistema de hoje — o teste roda as duas pontas lado a lado
//      (`FINANCEIRO_RECEBER_PURE` do v5.22.13 e `FINANCEIRO_V52243_PURE` do v5.22.43);
//   2) os filtros (Hoje / Abertos / Todos / De-Até / Filtrar laranja / 5 ordens) acham
//      exatamente os mesmos lançamentos que acham hoje;
//   3) a baixa é a de hoje: 7 formas SEM "A prazo", Pix dá baixa de verdade, título pago
//      não entra na baixa;
//   4) nada de alert/confirm/prompt nativos e nada gravado fora do NÚCLEO;
//   5) apagar pede motivo, vira lápide, sai da lista e só volta por "♻️ Restaurar".
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== FINANCEIRO NOVO (navegador de mentira) ==');
  console.log("  (não rodou: falta a dependência 'jsdom' — não é defeito do sistema)");
  process.exit(0);
}

let passou = 0;
function ok(nome, cond, detalhe) {
  if (!cond) { console.error('  \u2718 ' + nome + (detalhe ? '  [' + detalhe + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome);
  passou++;
}

const pagina = new JSDOM('<!DOCTYPE html><body><div id="fin"></div><div id="finpagar"></div></body>',
  { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://teste.local/financeiro' });
const win = pagina.window;
const doc = win.document;

// Regra 16: se alguma tela chamar o nativo, o teste reprova na hora (e o Electron explode de verdade)
win.alert = () => { throw new Error('USOU alert NATIVO'); };
win.confirm = () => { throw new Error('USOU confirm NATIVO'); };
win.prompt = () => { throw new Error('USOU prompt NATIVO'); };

const fonteFin = fs.readFileSync('novo/financeiro.js', 'utf8');
win.eval(fs.readFileSync('novo/nucleo.js', 'utf8'));
win.eval(fs.readFileSync('novo/selecao.js', 'utf8'));
win.eval(fonteFin);

const N = win.DIGICOPY_NUCLEO;
const F = win.DIGICOPY_FINANCEIRO;
const nucleo = N.criar({ empresaId: 'teste', origem: 'pc-teste' });
const alvo = doc.getElementById('fin');
const telaPagar = doc.getElementById('finpagar');

const clicar = (sel, raiz) => {
  const b = (raiz || doc).querySelector(sel);
  if (!b) throw new Error('não achei ' + sel);
  b.dispatchEvent(new win.Event('click', { bubbles: true }));
  return b;
};
const digitar = (sel, valor, raiz) => {
  const c = (raiz || doc).querySelector(sel);
  if (!c) throw new Error('não achei ' + sel);
  c.value = valor;
  return c;
};
const mudar = (sel, valor, raiz) => {
  const c = digitar(sel, valor, raiz);
  c.dispatchEvent(new win.Event('change', { bubbles: true }));
  return c;
};
const marcarcaixa = (id, raiz) => {
  const c = (raiz || doc).querySelector('[data-marcar="' + id + '"]');
  if (!c) throw new Error('não achei a caixinha de ' + id);
  c.checked = true;
  c.dispatchEvent(new win.Event('change', { bubbles: true }));
  return c;
};
const contaLinhas = (raiz) => (raiz || alvo).querySelectorAll('[data-linha-fin]').length;
const idsNaTela = (raiz) => Array.prototype.map.call((raiz || alvo).querySelectorAll('[data-linha-fin]'),
  (tr) => tr.getAttribute('data-linha-fin'));
const janela = () => doc.querySelector('[data-fin-modal]');
const botaoJanela = (texto) => {
  const j = janela();
  if (!j) throw new Error('nenhuma janela aberta');
  const b = Array.prototype.filter.call(j.querySelectorAll('[data-fin-botao]'),
    (x) => x.textContent.trim().toLowerCase().indexOf(texto.toLowerCase()) >= 0)[0];
  if (!b) throw new Error('a janela não tem botão "' + texto + '"');
  b.dispatchEvent(new win.Event('click', { bubbles: true }));
};
const erroDaTela = () => {
  const e = alvo.querySelector('[data-fin-erro]');
  return e && !e.hidden ? e.textContent : '';
};
const avisoDaTela = () => {
  const e = alvo.querySelector('[data-fin-aviso]');
  return e && !e.hidden ? e.textContent : '';
};
const erroDaJanela = () => {
  const e = janela() && janela().querySelector('[data-fin-janela-erro]');
  return e && !e.hidden ? e.textContent : '';
};

// datas do teste sempre relativas ao dia de hoje (o mesmo relógio da tela)
const dia = (delta) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + delta); return d.toISOString().slice(0, 10); };
const HOJE = dia(0);
// o mesmo dia daqui a N meses, com o ajuste do fim do mês (a regra do `addMeses`)
const mesmoDia = (delta) => {
  const d = new Date();
  const y = d.getUTCFullYear(), mo = d.getUTCMonth() + delta, dia = d.getUTCDate();
  const ultimo = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, mo, Math.min(dia, ultimo))).toISOString().slice(0, 10);
};
const br = (iso) => String(iso).slice(0, 10).split('-').reverse().join('/');

console.log('== FINANCEIRO NOVO (navegador de mentira) ==');

console.log('-- 1) HIGIENE: o arquivo não fala com nada de fora do núcleo --');
{
  const codigo = fonteFin.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('não chama alert/confirm/prompt nativos', !/\b(alert|confirm|prompt)\s*\(/.test(codigo));
  ok('não grava direto no armazenamento nem na rede', !/localStorage|sessionStorage|fetch\(|XMLHttpRequest/.test(codigo));
  ok('não mexe na lista de dentro do núcleo (quem decide é o núcleo)',
    !/\.itens\s*=|\.splice\(|delete\s+\w+\[/.test(codigo));
  // cuidado com falso positivo: "de-senha-r" tem "senha" no meio — aqui tem de ser a palavra
  ok('não fala de senha nem de token (nada de segredo no arquivo)', !/\bsenha|\btoken|password/i.test(codigo));
}

console.log('-- 2) EVIDÊNCIA: as regras copiadas ainda existem no sistema de hoje --');
{
  const p13 = fs.readFileSync('ajustes_v52213_financeiro_receber_patch.js', 'utf8');
  const p43 = fs.readFileSync('ajustes_v52243_financeiro_filtros_patch.js', 'utf8');
  const app = fs.readFileSync('app.js', 'utf8');
  const provas = [
    ['a baixa do financeiro é SEM "A prazo" (v5.22.13)',
      /var FORMAS_BAIXA = \['Dinheiro','Pix','Cartão de crédito','Cartão de débito','Cheque','Conta','Grátis'\]/.test(p13)],
    ['quem não tem título marcado cria lançamento novo, repetindo mês a mês (v5.22.13)',
      /function montarRepeticoes\(base, qtd\)/.test(p13) && /function addMeses\(iso, n\)/.test(p13)],
    ['Pix no financeiro dá baixa de verdade (v5.22.13)',
      /function aplicarBaixaTitulo\(cr, forma, agora\)/.test(p13) && /cr\.status = 'pago'/.test(p13)],
    ['os filtros por código/valor e o "Filtrar" que só aplica quando aperta (v5.22.43)',
      /FINANCEIRO_V52243_PURE/.test(p43) && /function codigoNorm\(/.test(p43) && /function valorIgual\(/.test(p43)],
    ['pago = "pago", "baixado" ou "quitado" (v5.22.43)', /pago\|baixad\|quitad/.test(p43)],
    ['o formulário da despesa continua no sistema de hoje (app.js: renderModalContaPagar/saveCP)',
      /function renderModalContaPagar/.test(app) && /function saveCP/.test(app)]
  ];
  provas.forEach(([nome, cond]) => ok(nome, cond));
}

console.log('-- 3) DIFERENCIAL: as duas pontas rodando lado a lado --');
{
  // extrai as funções que rodam HOJE (é o mesmo truque do test_venda.js: fatia até o
  // `PURE` e para antes de encostar no documento)
  const p13 = fs.readFileSync('ajustes_v52213_financeiro_receber_patch.js', 'utf8');
  win.eval(p13.slice(p13.indexOf('var FORMAS_BAIXA'), p13.indexOf("if(typeof document==='undefined')")));
  const p43 = fs.readFileSync('ajustes_v52243_financeiro_filtros_patch.js', 'utf8');
  win.eval(p43.slice(p43.indexOf('var CAMPOS'), p43.indexOf("if(typeof document==='undefined')")));
  ok('as duas peças vivas do sistema de hoje foram carregadas',
    typeof win.montarRepeticoes === 'function' && typeof win.filtraLancamentos === 'function' && typeof win.codigoNorm === 'function');

  // 3.1 — as listas e as formas
  ok('as 7 formas de baixa são iguais, na mesma ordem, e nenhuma é "A prazo"',
    JSON.stringify(F.regras.FORMAS_BAIXA) === JSON.stringify(win.FORMAS_BAIXA) &&
    F.regras.FORMAS_BAIXA.indexOf('A prazo') < 0, JSON.stringify(F.regras.FORMAS_BAIXA));
  ok('os campos do filtro são iguais, na mesma ordem',
    JSON.stringify(F.regras.CAMPOS) === JSON.stringify(win.FINANCEIRO_V52243_PURE.CAMPOS),
    JSON.stringify(F.regras.CAMPOS) + ' x ' + JSON.stringify(win.FINANCEIRO_V52243_PURE.CAMPOS));
  ok('as 5 ordens do select são as de hoje',
    JSON.stringify(Object.keys(F.regras.ORDENS).sort()) === JSON.stringify(['desc', 'valor-asc', 'valor-desc', 'venc-asc', 'venc-desc']));

  // 3.2 — repetição mês a mês (é o que inventa as parcelas do "repetir")
  const casosRep = [
    ['1 vez, sem mexer no vencimento', { descricao: 'X', valor: 10, clienteId: 'c1', vencimento: '2026-09-24' }, 1],
    ['3 vezes, do fim do mês (31/01 → 28/02)', { descricao: 'X', valor: 10, clienteId: 'c1', vencimento: '2026-01-31' }, 3],
    ['12 vezes de 31 de agosto', { descricao: 'X', valor: 10, clienteId: 'c1', vencimento: '2026-08-31' }, 12],
    ['virada de ano (15/12 + 2)', { descricao: 'X', valor: 10, clienteId: 'c1', vencimento: '2026-12-15' }, 2],
    ['pediu 61, o teto de hoje é 60', { descricao: 'X', valor: 10, clienteId: 'c1', vencimento: '2026-09-24' }, 61],
    ['pediu 0, faz 1', { descricao: 'X', valor: 10, clienteId: 'c1', vencimento: '2026-09-24' }, 0],
    ['pediu com letra, faz 1', { descricao: 'X', valor: 10, clienteId: 'c1', vencimento: '2026-09-24' }, 'abc'],
    ['vencimento vazio usa o dia de hoje', { descricao: 'X', valor: 10, clienteId: 'c1', vencimento: '' }, 2]
  ];
  let iguaisRep = 0;
  casosRep.forEach(([nome, base, qtd]) => {
    const meu = F.regras.montarRepeticoes(base, qtd);
    const hoje = win.montarRepeticoes(base, qtd);
    const igual = JSON.stringify(meu) === JSON.stringify(hoje);
    if (igual) iguaisRep++;
    ok('repetição igual à de hoje: ' + nome, igual, 'novo=' + JSON.stringify(meu) + ' hoje=' + JSON.stringify(hoje));
  });
  ok('a repetição nova é igual à de hoje em ' + iguaisRep + ' de ' + casosRep.length + ' casos', iguaisRep === casosRep.length);

  // 3.3 — baixa do título
  const meuBaixa = F.regras.aplicarBaixaTitulo({ valor: 10, status: 'aberto' }, 'Pix', '2026-09-24T12:00:00.000Z');
  const hojeBaixa = win.aplicarBaixaTitulo({ valor: 10, status: 'aberto' }, 'Pix', '2026-09-24T12:00:00.000Z');
  ok('a baixa grava exatamente o que hoje grava (forma, data, status, baixaForma)',
    JSON.stringify(meuBaixa) === JSON.stringify(hojeBaixa) && meuBaixa.status === 'pago' && meuBaixa.baixaForma === 'Pix',
    JSON.stringify(meuBaixa));

  // 3.4 — o filtro (17 casos, incluindo os campos por código)
  const mapCli = { c1: { nome: 'José Ávila', codigo: '0007' }, c2: { nome: 'Maria Lopes', codigo: '12' } };
  const clienteDe = (c) => mapCli[c.clienteId] || {};
  const FIX = [
    { id: 'r1', descricao: 'Aluguel', valor: 100, status: 'aberto', vencimento: '2026-09-24T00:00:00.000Z', criadoEm: '2026-08-01T10:00:00.000Z', clienteId: 'c1', parcela: '1', totalParcelas: '3', vendaId: '000045' },
    { id: 'r2', descricao: 'Mensalidade', valor: 250.5, status: 'pago', vencimento: '2026-09-30T00:00:00.000Z', criadoEm: '2026-08-01T10:00:00.000Z', pagamentoData: '2026-09-30T12:00:00.000Z', clienteId: 'c2' },
    { id: 'r3', descricao: 'Recarga', valor: 80, status: 'baixado', vencimento: '2026-09-20T00:00:00.000Z', criadoEm: '2026-07-11T10:00:00.000Z', clienteId: 'c1' },
    { id: 'p1', descricao: 'Papel', valor: 40, status: 'aberto', vencimento: '2026-10-05T00:00:00.000Z', criadoEm: '2026-08-01T10:00:00.000Z', fornecedor: 'Papelaria Central' },
    { id: 'p2', descricao: 'Luz', valor: 300, status: 'quitado', vencimento: '2026-09-15T00:00:00.000Z', criadoEm: '2026-08-01T10:00:00.000Z', fornecedor: 'Energia' },
    { id: 'p3', descricao: 'Sem data', valor: 10, status: 'aberto' },
    { id: 'p4', descricao: 'Pix recebido', valor: 12.34, status: 'aberto', vencimento: '2026-10-01T00:00:00.000Z', criadoEm: '2026-08-01T10:00:00.000Z', pixId: '000123' },
    { id: 'p5', descricao: 'Caixa', valor: 5, status: 'aberto', vencimento: '2026-10-02T00:00:00.000Z', criadoEm: '2026-08-01T10:00:00.000Z', legadoCodigo: '000045', leituraNumero: '77' }
  ];
  const combos = [
    ['modo Hoje (24/09)', { campo: 'nome', q: '', modo: 'hoje' }, ['r1', 'p3']],
    ['modo Hoje: o lançamento SEM data nenhuma aparece (regra de hoje)', { campo: 'nome', q: '', modo: 'hoje', hoje: '2026-11-11' }, ['p3']],
    ['modo Abertos', { campo: 'nome', q: '', modo: 'abertos' }, ['r1', 'p1', 'p3', 'p4', 'p5']],
    ['modo Todos', { campo: 'nome', q: '', modo: 'todos' }, ['r1', 'r2', 'r3', 'p1', 'p2', 'p3', 'p4', 'p5']],
    ['Abertos entre 25/09 e 30/09: nada (só o que foi pago cai nesse intervalo)',
      { campo: 'nome', q: '', modo: 'abertos', de: '2026-09-25', ate: '2026-09-30' }, []],
    ['Abertos de 02/10 pra frente (o de 01/10 fica de fora)', { campo: 'nome', q: '', modo: 'abertos', de: '2026-10-02' }, ['p1', 'p5']],
    ['nome "josé" (com acento)', { campo: 'nome', q: 'josé', modo: 'todos' }, ['r1', 'r3']],
    ['nome "ZÉ" sem acento não acha "José" — é assim HOJE também (achado anotado: a caixa de seleção do núcleo dobra o acento, este campo não)',
      { campo: 'nome', q: 'ZÉ', modo: 'todos' }, []],
    ['nome "maria"', { campo: 'nome', q: 'maria', modo: 'todos' }, ['r2']],
    ['nome "papelaria" (fornecedor da despesa)', { campo: 'nome', q: 'papelaria', modo: 'todos' }, ['p1']],
    ['cod_cliente 7 (o código 0007)', { campo: 'cod_cliente', q: '7', modo: 'todos' }, ['r1', 'r3']],
    ['cod_caixa 45 (o código legado do título)', { campo: 'cod_caixa', q: '45', modo: 'todos' }, ['p5']],
    ['cod_pix 123', { campo: 'cod_pix', q: '123', modo: 'todos' }, ['p4']],
    ['cod_leitura 77', { campo: 'cod_leitura', q: '77', modo: 'todos' }, ['p5']],
    ['cod_parcela 1 (só a r1 tem parcela)', { campo: 'cod_parcela', q: '1', modo: 'todos' }, ['r1']],
    ['cod_venda 45', { campo: 'cod_venda', q: '45', modo: 'todos' }, ['r1']],
    ['por_valor 250,50', { campo: 'por_valor', q: '250,50', modo: 'todos' }, ['r2']],
    ['por_valor 250.5 (ponto)', { campo: 'por_valor', q: '250.5', modo: 'todos' }, ['r2']]
  ];
  let iguais = 0;
  combos.forEach(([nome, opc, esperado]) => {
    const op = Object.assign({ hoje: '2026-09-24', clienteDe: clienteDe }, opc);
    const meu = F.regras.filtraLancamentos(FIX, op).map((x) => x.id);
    const hoje = win.filtraLancamentos(FIX, op).map((x) => x.id);
    const mesmo = JSON.stringify(meu) === JSON.stringify(hoje) && JSON.stringify(meu) === JSON.stringify(esperado);
    if (mesmo) iguais++;
    ok('filtro igual à de hoje: ' + nome, mesmo, 'novo=' + JSON.stringify(meu) + ' hoje=' + JSON.stringify(hoje) + ' esperado=' + JSON.stringify(esperado));
  });
  ok('o filtro novo acha exatamente o mesmo em ' + iguais + ' de ' + combos.length + ' casos', iguais === combos.length);
  ok('as funções puras do filtro (codigoNorm/valorIgual/estaPago) respondem como as de hoje',
    F.regras.codigoNorm('0007') === win.codigoNorm('0007') && F.regras.codigoNorm('abc') === win.codigoNorm('abc') &&
    F.regras.valorIgual('80,00', '80') === true && F.regras.valorIgual('80', '80,01') === false &&
    F.regras.estaPago({ status: 'BAIXADO' }) === true && F.regras.estaPago({ status: 'aberto' }) === false);

  // 3.5 — as 5 ordens dão a mesma fila (o `ordFns` de hoje vive dentro do render; a fatia
  // abaixo pega só o objeto dos comparadores, sem encostar no documento)
  const iOrd = p43.indexOf('var ordFns = {');
  win.eval(p43.slice(iOrd, p43.indexOf('all.sort(ordFns', iOrd)).trim());
  ok('o objeto das ordens do sistema de hoje foi carregado', !!win.ordFns && typeof win.ordFns['venc-asc'] === 'function');
  const ordens = ['venc-asc', 'venc-desc', 'valor-desc', 'valor-asc', 'desc'];
  const pares = [];
  for (let i = 0; i < FIX.length; i++) for (let j = 0; j < FIX.length; j++) if (i !== j) pares.push([FIX[i], FIX[j]]);
  const difOrdens = ordens.filter((od) => {
    const meu = F.regras.ordenarLancamentos(FIX, od).map((x) => x.id);
    const hoje = FIX.slice().sort((a, b) => win.ordFns[od]({ ref: a }, { ref: b })).map((x) => x.id);
    if (JSON.stringify(meu) !== JSON.stringify(hoje)) return true;
    // e o comparador, par a par, tem de dar o mesmo sinal em todos os 56 pares
    return pares.some(([a, b]) => Math.sign(F.regras.ORDENS[od](a, b)) !== Math.sign(win.ordFns[od]({ ref: a }, { ref: b })));
  });
  ok('as 5 ordens deixam a lista na mesma fila de hoje (comparador a comparador, ' + pares.length + ' pares)'
    + (difOrdens.length ? ' — DIFERENTE em ' + difOrdens.join(', ') : ''), difOrdens.length === 0);
  ok('a ordem de vencimento põe o mais velho primeiro — e o SEM vencimento no começo, como hoje (p3, p2 15/09, r3 20/09, r1 24/09)',
    F.regras.ordenarLancamentos(FIX, 'venc-asc').slice(0, 4).map((x) => x.id).join(',') === 'p3,p2,r3,r1',
    F.regras.ordenarLancamentos(FIX, 'venc-asc').slice(0, 4).map((x) => x.id).join(','));
}

console.log('-- 4) A TELA: modos, filtros e ordens --');
{
  const tela = F.criarFinanceiro({ nucleo, elemento: alvo, empresaId: 'teste', tipo: 'todos' });
  ok('a tela desenha o financeiro e registra as duas listas no núcleo',
    !!alvo.querySelector('.fin-topo') && !!nucleo.listar('contasReceber') && !!nucleo.listar('contasPagar'));
  ok('o botão "Novo lançamento" (a receber) está na tela geral e o de despesa não',
    !!alvo.querySelector('[data-fin-novo]') && !alvo.querySelector('[data-fin-nova-despesa]'));

  // fixture: 3 a receber + 2 a pagar
  const criar = (lista, dados) => {
    const r = nucleo.salvar(lista, dados);
    if (!r.ok) throw new Error('fixture ' + lista + ': ' + JSON.stringify(r.erros));
    // carimbo antigo de propósito: sem isso todo registro é "de hoje" (criadoEm = agora)
    const r2 = nucleo.salvar(lista, { id: r.item.id, criadoEm: dia(-40) });
    if (!r2.ok) throw new Error('fixture criadoEm');
    return r2.item;
  };
  nucleo.registrarLista('clientes', { nome: { obrigatorio: true, tipo: 'texto' } });
  nucleo.salvar('clientes', { id: 'c1', nome: 'José Ávila', codigo: '1' });
  nucleo.salvar('clientes', { id: 'c2', nome: 'Maria Lopes', codigo: '2' });
  criar('contasReceber', { id: 'cr1', descricao: 'Aluguel da impressora', clienteId: 'c1', clienteNome: 'José Ávila', valor: 100, vencimento: dia(0), status: 'aberto' });
  criar('contasReceber', { id: 'cr2', descricao: 'Mensalidade de setembro', clienteId: 'c2', clienteNome: 'Maria Lopes', valor: 250.5, vencimento: dia(5), status: 'aberto', parcela: 2, totalParcelas: 3 });
  criar('contasReceber', { id: 'cr3', descricao: 'Recarga 85A', clienteId: 'c1', clienteNome: 'José Ávila', valor: 80, vencimento: dia(-3), status: 'baixado', pagamentoData: dia(-3) });
  criar('contasPagar', { id: 'cp1', descricao: 'Resma de papel', fornecedor: 'Papelaria Central', categoria: 'Insumos', valor: 40, vencimento: dia(1), status: 'aberto' });
  criar('contasPagar', { id: 'cp2', descricao: 'Energia', fornecedor: 'Energia Elétrica', categoria: 'Estrutura', valor: 300, vencimento: dia(-10), status: 'quitado', pagamentoData: dia(-10) });
  tela.desenhar();

  // 4.1 modos
  ok('o modo padrão é "Hoje"', tela.estado.modo === 'hoje' && !!alvo.querySelector('[data-modo="hoje"].fin-modo-on'));
  ok('Hoje mostra só o que tem data de hoje (o vencimento do cr1)', contaLinhas() === 1 && idsNaTela()[0] === 'cr1');
  clicar('[data-modo="todos"]');
  ok('Todos mostra os 5 lançamentos', contaLinhas() === 5, 'linhas=' + contaLinhas());
  ok('o resumo do topo conta os abertos e soma em aberto (100 + 250,50 + 40 = 390,50)',
    /em aberto:/.test(alvo.querySelector('.fin-topo').textContent) &&
    /390,50/.test(alvo.querySelector('.fin-topo').textContent), alvo.querySelector('.fin-topo').textContent.replace(/\s+/g, ' '));
  clicar('[data-modo="abertos"]');
  ok('Abertos tira os pagos/baixados (cr2 pago depois muda; agora 3 abertos)', contaLinhas() === 3, 'linhas=' + contaLinhas());
  ok('o De/Até aparece só no modo Abertos', !!alvo.querySelector('[data-fin-de]') && !!alvo.querySelector('[data-fin-ate]'));
  clicar('[data-modo="todos"]');
  ok('fora do Abertos o De/Até desaparece e o filtro de datas é limpo',
    !alvo.querySelector('[data-fin-de]') && tela.estado.de === '' && tela.estado.ate === '');

  // 4.2 De/Até dentro de Abertos
  clicar('[data-modo="abertos"]');
  digitar('[data-fin-de]', dia(4));
  clicar('[data-fin-filtrar]');
  ok('De = daqui a 4 dias acha só o cr2 (vence em 5)', contaLinhas() === 1 && idsNaTela()[0] === 'cr2');
  clicar('[data-fin-limpar]');
  ok('Remover filtro limpa as datas (no modo Abertos voltam os 3 abertos)',
    contaLinhas() === 3 && tela.estado.de === '' && tela.estado.ate === '', 'linhas=' + contaLinhas());
  clicar('[data-modo="todos"]');
  ok('e voltando para Todos aparecem os 5', contaLinhas() === 5, 'linhas=' + contaLinhas());

  // 4.3 o "Filtrar" que espera o dedo (v5.24.34): escolher não aplica sozinho
  mudar('[data-fin-campo]', 'por_valor');
  ok('escolher o campo deixa o Filtrar PENDENTE (laranja) e NÃO refaz a lista',
    !!alvo.querySelector('[data-fin-filtrar].fin-pendente') && contaLinhas() === 5);
  digitar('[data-fin-termo]', '250,50');
  ok('digitar ainda não refez a lista (quem aplica é o Enter ou o Filtrar)', contaLinhas() === 5);
  clicar('[data-fin-filtrar]');
  ok('Filtrar aplicou: só o cr2 de 250,50', contaLinhas() === 1 && idsNaTela()[0] === 'cr2');
  ok('e o botão voltou ao normal (não ficou laranja)',
    !alvo.querySelector('[data-fin-filtrar].fin-pendente') && !!alvo.querySelector('[data-fin-filtrar].vnd-btn-forte'));

  // 4.4 busca por código do caixa (o id do título) e por tipo
  mudar('[data-fin-campo]', 'cod_caixa');
  digitar('[data-fin-termo]', '1');
  clicar('[data-fin-filtrar]');
  ok('cod_caixa 1 acha o cr1 e o cp1 (o número tira as letras do id)', contaLinhas() === 2 &&
    idsNaTela().sort().join(',') === 'cp1,cr1', idsNaTela().join(','));
  mudar('[data-fin-tipo]', 'Pagar');
  clicar('[data-fin-filtrar]');
  ok('o filtro "Só a pagar" deixa só o cp1', contaLinhas() === 1 && idsNaTela()[0] === 'cp1');
  mudar('[data-fin-tipo]', 'Receber');
  clicar('[data-fin-filtrar]');
  ok('o filtro "Só a receber" deixa só o cr1', contaLinhas() === 1 && idsNaTela()[0] === 'cr1');
  digitar('[data-fin-termo]', 'zzz-inexistente');
  clicar('[data-fin-filtrar]');
  ok('sem resultado a tabela avisa (não fica vazia sem explicação)',
    contaLinhas() === 0 && /Nenhum lançamento encontrado/.test(alvo.textContent));
  clicar('[data-fin-limpar]');
  mudar('[data-fin-campo]', 'nome');
  clicar('[data-fin-filtrar]');
  ok('limpando tudo voltam os 5', contaLinhas() === 5, 'linhas=' + contaLinhas());

  // 4.5 ordens
  mudar('[data-fin-ordem]', 'valor-desc');
  clicar('[data-fin-filtrar]');
  ok('ordem por valor (maior primeiro) começa no cp2 de 300,00', idsNaTela()[0] === 'cp2');
  mudar('[data-fin-ordem]', 'desc');
  clicar('[data-fin-filtrar]');
  ok('ordem A-Z começa em "Aluguel da impressora"', idsNaTela()[0] === 'cr1');
  mudar('[data-fin-ordem]', 'venc-asc');
  clicar('[data-fin-filtrar]');
  ok('ordem por vencimento começa no mais velho — a despesa de 10 dias atrás (cp2) e depois o cr3, de 3 dias',
    idsNaTela().slice(0, 2).join(',') === 'cp2,cr3', idsNaTela().slice(0, 2).join(','));
  ok('a tabela mostra tipo, nome de quem deve, valor em R$ e a situação',
    /250,50/.test(alvo.textContent) && /Maria Lopes/.test(alvo.textContent) &&
    /Receber/.test(alvo.querySelector('[data-linha-fin="cr2"]').textContent) &&
    /pago/.test(alvo.querySelector('[data-linha-fin="cr3"]').textContent) &&
    /aberto/.test(alvo.querySelector('[data-linha-fin="cr2"]').textContent));
  ok('a parcela aparece na descrição (é o que o dono confere)',
    /parcela 2\/3/.test(alvo.querySelector('[data-linha-fin="cr2"]').textContent));
  ok('a despesa ganha a etiqueta vermelha de "Pagar"',
    /Pagar/.test(alvo.querySelector('[data-linha-fin="cp1"]').textContent));
}

console.log('-- 5) BAIXA: 7 formas, sem "A prazo", só título em aberto --');
{
  const filaAntes = nucleo.resumo().mudancasPendentes;
  clicar('[data-fin-receber]');
  ok('sem nada marcado a tela avisa e NÃO abre janela',
    !janela() && /Marque pelo menos um título a receber em aberto/.test(erroDaTela()), erroDaTela());

  marcarcaixa('cr2');
  clicar('[data-fin-receber]');
  ok('com o cr2 marcado abre a janela de baixa', !!janela() && /Baixa — receber \(1 título\(s\)\)/.test(janela().textContent));
  const formas = Array.prototype.map.call(janela().querySelectorAll('[data-fin-baixa-forma] option'), (o) => o.value);
  ok('a janela oferece as 7 formas de hoje, sem "A prazo"',
    JSON.stringify(formas) === JSON.stringify(F.regras.FORMAS_BAIXA) && formas.indexOf('A prazo') < 0, formas.join(' | '));
  ok('o total a baixar aparece na janela', /250,50/.test(janela().textContent));
  ok('a janela já avisa em que forma vai dar baixa (Dinheiro é o padrão)',
    /Baixa em Dinheiro/.test(janela().querySelector('[data-fin-baixa-msg]').textContent));
  mudar('[data-fin-baixa-forma]', 'Pix', janela());
  ok('trocar para Pix muda o aviso dentro da janela',
    /Pix/.test(janela().querySelector('[data-fin-baixa-msg]').textContent));
  botaoJanela('Confirmar baixa');
  ok('a janela fechou depois de confirmar', !janela());
  const cr2 = nucleo.obter('contasReceber', 'cr2');
  ok('o título ficou PAGO de verdade no núcleo', cr2.status === 'pago');
  ok('gravou a forma e a data da baixa (é o que a notinha/recibo leem depois)',
    cr2.formaPagamento === 'Pix' && cr2.baixaForma === 'Pix' && /^\d{4}-\d{2}-\d{2}T/.test(String(cr2.pagamentoData)));
  ok('a tela avisou o que fez', /1 título\(s\) baixado\(s\) em Pix/.test(avisoDaTela()), avisoDaTela());
  ok('a baixa entrou na fila da nuvem (nada é gravado só no PC)',
    nucleo.resumo().mudancasPendentes > filaAntes);
  ok('a linha do cr2 agora mostra pago e saiu da conta dos abertos',
    /pago/.test(alvo.querySelector('[data-linha-fin="cr2"]').textContent));

  // título pago não entra na baixa (regra de hoje)
  marcarcaixa('cr3');
  clicar('[data-fin-receber]');
  ok('marcar um título já baixado dá aviso e não abre a janela',
    !janela() && /Títulos já pagos não entram na baixa/.test(erroDaTela()), erroDaTela());
  ok('e o título pago continua como estava (nada foi rebaixado)',
    nucleo.obter('contasReceber', 'cr3').status === 'baixado' &&
    nucleo.obter('contasReceber', 'cr3').baixaForma === undefined);

  // pagar uma despesa
  marcarcaixa('cp1');
  clicar('[data-fin-pagar]');
  ok('a janela de pagar abre com o título marcado', !!janela() && /Baixa — pagar/.test(janela().textContent));
  mudar('[data-fin-baixa-forma]', 'Conta', janela());
  botaoJanela('Confirmar pagamento');
  const cp1 = nucleo.obter('contasPagar', 'cp1');
  ok('a despesa ficou paga na forma escolhida (Conta)',
    cp1.status === 'pago' && cp1.baixaForma === 'Conta' && /1 título\(s\) baixado\(s\) em Conta/.test(avisoDaTela()), avisoDaTela());
  ok('e o botão "Pagar" também limpou as marcas (nada fica marcado sem querer)',
    !alvo.querySelector('[data-marcar="cp1"]:checked'));

  // baixa em lote: dois títulos de uma vez
  const criarDoisAbertos = () => {
    // dois títulos a receber novos (a tela já está aberta; o desenho é chamado depois)
    nucleo.salvar('contasReceber', { id: 'cr4', descricao: 'Lote A', clienteId: 'c1', clienteNome: 'José Ávila', valor: 10, vencimento: dia(2), status: 'aberto' });
    nucleo.salvar('contasReceber', { id: 'cr5', descricao: 'Lote B', clienteId: 'c1', clienteNome: 'José Ávila', valor: 20, vencimento: dia(3), status: 'aberto' });
    clicar('[data-modo="todos"]');
  };
  criarDoisAbertos();
  marcarcaixa('cr4');
  marcarcaixa('cr5');
  clicar('[data-fin-receber]');
  ok('a janela mostra os 2 títulos e o total somado (30,00)', /2 título\(s\)/.test(janela().textContent) && /30,00/.test(janela().textContent));
  botaoJanela('Confirmar');
  ok('os dois ficaram pagos de uma vez',
    nucleo.obter('contasReceber', 'cr4').status === 'pago' && nucleo.obter('contasReceber', 'cr5').status === 'pago');
  ok('e o aviso fala dos dois', /2 título\(s\) baixado\(s\) em Dinheiro/.test(avisoDaTela()), avisoDaTela());
}

console.log('-- 6) LANÇAMENTO NOVO, DESPESA, HISTÓRICO E EDIÇÃO --');
{
  const antes = contaLinhas();
  clicar('[data-fin-novo]');
  ok('abre a janela do lançamento a receber com a caixa de escolher cliente',
    !!janela() && !!janela().querySelector('[data-fin-cliente] [data-termo]'));
  ok('o vencimento já vem com hoje (não deixa em branco)',
    janela().querySelector('[data-fin-novo-venc]').value === HOJE, janela().querySelector('[data-fin-novo-venc]').value);
  digitar('[data-fin-novo-desc]', 'Mensalidade de outubro', janela());
  digitar('[data-fin-novo-valor]', '90', janela());
  botaoJanela('Salvar');
  ok('sem cliente a janela continua aberta e explica o que falta',
    !!janela() && /Escolha o cliente/.test(erroDaJanela()), erroDaJanela());
  const caixa = janela().querySelector('[data-fin-cliente] [data-termo]');
  caixa.value = 'jose';
  caixa.dispatchEvent(new win.Event('input', { bubbles: true }));      // ele digita
  ok('a caixa filtra enquanto digita e mostra quem serve',
    /José Ávila/.test(janela().querySelector('[data-fin-cliente]').textContent) &&
    !/Maria Lopes/.test(janela().querySelector('[data-fin-cliente]').textContent));
  caixa.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));   // e aperta Enter
  ok('a escolha fica nomeada na caixa (é o cliente que vai para o título)',
    caixa.value === 'José Ávila', caixa.value);
  mudar('[data-fin-novo-rep]', '3', janela());
  ok('a janela avisa quantos lançamentos vão sair e quando vencem (data brasileira)',
    /3 lançamentos/.test(janela().querySelector('[data-fin-rep-prev]').textContent) &&
    janela().querySelector('[data-fin-rep-prev]').textContent.indexOf(br(mesmoDia(1))) > 0,
    janela().querySelector('[data-fin-rep-prev]').textContent);
  botaoJanela('Salvar');
  ok('a janela fechou e o aviso disse o que gravou',
    !janela() && /3 lançamento\(s\) a receber criado\(s\)/.test(avisoDaTela()),
    'janela=' + (!!janela()) + ' erroJanela=' + erroDaJanela() + ' aviso=' + avisoDaTela());
  const criados = nucleo.listar('contasReceber').filter((c) => c.descricao === 'Mensalidade de outubro');
  ok('nasceram 3 títulos (e não 1)', criados.length === 3, 'achou ' + criados.length);
  ok('com os vencimentos de hoje, do mês que vem e do outro',
    criados.map((c) => c.vencimento).sort().join(',') === [HOJE, mesmoDia(1), mesmoDia(2)].sort().join(','),
    criados.map((c) => c.vencimento).join(','));
  ok('todos no cliente certo, em aberto e sem forma de pagamento (é lançamento, não baixa)',
    criados.every((c) => c.clienteId === 'c1' && c.status === 'aberto' && c.formaPagamento === undefined));
  ok('a tela passou a mostrar os novos lançamentos', contaLinhas() === antes + 3, contaLinhas() + ' x ' + antes);

  // ficha pelo duplo clique + edição da despesa
  const linha = alvo.querySelector('[data-linha-fin="cp1"]');
  linha.dispatchEvent(new win.MouseEvent('dblclick', { bubbles: true }));
  ok('duplo clique abre a ficha do lançamento', !!janela() && /Histórico do lançamento/.test(janela().textContent));
  ok('a ficha mostra os campos do registro (fornecedor, categoria, valor)',
    /Papelaria Central/.test(janela().textContent) && /Insumos/.test(janela().textContent) && /40,00/.test(janela().textContent));
  botaoJanela('Editar');
  ok('a ficha da despesa tem o botão de editar e ele abre o formulário do próprio registro',
    !!janela() && /Editar despesa/.test(janela().textContent) && janela().querySelector('[data-fin-forn]').value === 'Papelaria Central');
  digitar('[data-fin-valor]', '', janela());
  botaoJanela('Salvar');
  ok('com o valor em branco a janela avisa em vez de gravar R$ 0,00 calado',
    !!janela() && /Informe o valor/.test(erroDaJanela()), erroDaJanela());
  digitar('[data-fin-forn]', 'Papelaria Central', janela());
  digitar('[data-fin-valor]', '45.50', janela());   // campo numérico quer ponto
  botaoJanela('Salvar');
  const cp1 = nucleo.obter('contasPagar', 'cp1');
  ok('a edição gravou no MESMO registro (não duplicou a despesa)',
    nucleo.listar('contasPagar').length === 2 && Math.abs(cp1.valor - 45.5) < 0.001, String(cp1.valor));
  ok('e a observação da ficha continua dizendo quem forneceu', cp1.fornecedor === 'Papelaria Central');
  ok('o aviso confirmou a alteração', /Despesa salva/.test(avisoDaTela()), avisoDaTela());

  // despesa nova sem fornecedor é recusada
  clicar('[data-modo="todos"]');
  clicar('[data-fin-novo]');
  ok('o lançamento novo abre sempre com a caixa do cliente (não guarda o último digitado)',
    !!janela().querySelector('[data-fin-cliente] [data-termo]') && janela().querySelector('[data-fin-novo-desc]').value === '');
  botaoJanela('Cancelar');
  ok('cancelar fecha a janela sem gravar nada', !janela() && nucleo.listar('contasReceber').filter((c) => c.descricao === 'Mensalidade de outubro').length === 3);
}

console.log('-- 7) TELA DAS CONTAS A PAGAR: criar despesa do jeito de hoje --');
{
  const tela2 = F.criarFinanceiro({ nucleo, elemento: telaPagar, empresaId: 'teste', tipo: 'Pagar' });
  ok('na tela de contas a pagar o botão é "Nova despesa"',
    !!telaPagar.querySelector('[data-fin-nova-despesa]') && !telaPagar.querySelector('[data-fin-novo]'));
  clicar('[data-modo="todos"]', telaPagar);
  ok('e ela já mostra só as despesas (o filtro de tipo vem em Pagar)',
    tela2.estado.tipo === 'Pagar' && contaLinhas(telaPagar) === 2, 'linhas=' + contaLinhas(telaPagar));
  clicar('[data-fin-nova-despesa]', telaPagar);
  ok('abre o formulário da despesa com as 7 categorias de hoje',
    !!janela() && janela().querySelectorAll('[data-fin-cat] option').length === F.regras.CATEGORIAS_DESPESA.length,
    String(janela() && janela().querySelectorAll('[data-fin-cat] option').length));
  digitar('[data-fin-desc]', 'Café da loja', janela());
  digitar('[data-fin-valor]', '30', janela());
  botaoJanela('Salvar');
  ok('sem fornecedor a janela reclama (é o campo obrigatório da despesa)',
    !!janela() && /fornecedor/i.test(erroDaJanela()), erroDaJanela());
  digitar('[data-fin-forn]', 'Mercado Bom Preço', janela());
  digitar('[data-fin-desc]', 'Café da loja', janela());
  digitar('[data-fin-valor]', '30', janela());
  botaoJanela('Salvar');
  const nova = nucleo.listar('contasPagar').filter((c) => c.fornecedor === 'Mercado Bom Preço')[0];
  ok('a despesa foi criada com fornecedor, categoria e valor',
    !!nova && Math.abs(nova.valor - 30) < 0.001 && !!nova.categoria, nova ? JSON.stringify({ v: nova.valor, cat: nova.categoria }) : 'não criou');
  ok('despesa nova nasce em aberto e sem forma de baixa (ainda não foi paga)',
    nova.status === 'aberto' && nova.formaPagamento === undefined);
  ok('a tela das despesas passou a mostrar 3 linhas', contaLinhas(telaPagar) === 3, 'linhas=' + contaLinhas(telaPagar));
}

console.log('-- 8) APAGAR (com motivo) E TRAZER DE VOLTA --');
{
  clicar('[data-modo="todos"]');
  const total = contaLinhas();
  const crAntes = nucleo.listar('contasReceber').length;
  clicar('[data-fin-excluir]');
  ok('sem nada marcado o Apagar avisa e não abre janela',
    !janela() && /Marque o que você quer apagar primeiro/.test(erroDaTela()), erroDaTela());

  marcarcaixa('cr1');
  clicar('[data-fin-excluir]');
  ok('com lançamento marcado abre a confirmação com o campo do motivo',
    !!janela() && !!janela().querySelector('[data-fin-motivo]'));
  digitar('[data-fin-motivo]', 'ab', janela());
  botaoJanela('Apagar');
  ok('motivo curto é recusado (o motivo fica no histórico)',
    !!janela() && /pelo menos 3 letras/.test(erroDaJanela()), erroDaJanela());
  ok('e nada foi apagado ainda', nucleo.listar('contasReceber').length === crAntes);
  digitar('[data-fin-motivo]', 'lançamento duplicado', janela());
  botaoJanela('Apagar');
  ok('com motivo de verdade apagou e fechou a janela',
    !janela() && nucleo.listar('contasReceber').filter((c) => c.id === 'cr1').length === 0 &&
    nucleo.listar('contasReceber').length === crAntes - 1);
  ok('a linha saiu da lista', contaLinhas() === total - 1, contaLinhas() + ' x ' + total);
  ok('a lápide guardou o motivo (é o histórico da exclusão)',
    nucleo.obter('contasReceber', 'cr1').motivo === 'lançamento duplicado' &&
    nucleo.obter('contasReceber', 'cr1').apagadoEm > 0);
  ok('o aviso disse o que fez', /1 lançamento\(s\) apagado\(s\)/.test(avisoDaTela()), avisoDaTela());

  clicar('[data-modo="apagados"]');
  ok('o modo Apagados mostra o que foi excluído, com o motivo escrito',
    contaLinhas() === 1 && /lançamento duplicado/.test(alvo.querySelector('[data-linha-fin="cr1"]').textContent));
  ok('no modo Apagados não existe caixinha de marcar (não se apaga o apagado)',
    !alvo.querySelector('[data-linha-fin="cr1"] [data-marcar]') && !alvo.querySelector('[data-fin-marcar-todos]'));
  ok('o chip do modo conta os apagados', /Apagados \(1\)/.test(alvo.querySelector('[data-modo="apagados"]').textContent));
  clicar('[data-linha-fin="cr1"] [data-restaurar]');
  ok('Restaurar devolve o lançamento para a lista',
    nucleo.listar('contasReceber').filter((c) => c.id === 'cr1').length === 1 &&
    nucleo.obter('contasReceber', 'cr1').apagadoEm === 0);
  ok('o motivo antigo continua registrado no histórico da fila',
    nucleo.mudancas().some((m) => m.id === 'cr1' && m.apagadoEm > 0));
  ok('e o chip voltou a zero', /Apagados \(0\)/.test(alvo.querySelector('[data-modo="apagados"]').textContent));
}

console.log('-- 9) LISTA GRANDE: o paginador (400 + Mostrar mais) --');
{
  const outroNucleo = N.criar({ empresaId: 'teste', origem: 'pc-teste' });
  const div = doc.createElement('div');
  doc.body.appendChild(div);
  const tela3 = F.criarFinanceiro({ nucleo: outroNucleo, elemento: div, empresaId: 'teste', tipo: 'todos' });
  for (let i = 1; i <= 405; i++) {
    outroNucleo.salvar('contasReceber', {
      id: 'g' + i, descricao: 'Título ' + i, valor: i, vencimento: dia(i % 20), status: 'aberto'
    });
  }
  tela3.desenhar();
  ok('com 405 lançamentos a tela mostra 400 e o botão dos que sobraram',
    contaLinhas(div) === 400 && /Mostrar mais \(5\)/.test(div.textContent), 'linhas=' + contaLinhas(div));
  clicar('[data-fin-mais]', div);
  ok('"Mostrar mais" mostra os 5 que faltavam (nada some da tela)',
    contaLinhas(div) === 405 && !div.querySelector('[data-fin-mais]'), 'linhas=' + contaLinhas(div));
}

console.log('-- 10) A TELA NÃO GRAVA POR FORA --');
{
  ok('nada foi parar no armazenamento do navegador (regra do dono: só nuvem)',
    win.localStorage.length === 0 && win.sessionStorage.length === 0);
  ok('todo dado que a tela mexeu passou pelo núcleo (a fila tem as mudanças)',
    nucleo.resumo().mudancasPendentes > 0);
  ok('e nenhum alert/confirm/prompt nativo foi chamado em nenhum momento do teste (senão já teria estourado)',
    true);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — o financeiro novo responde como o sistema de hoje (filtros, ordem, baixa, lançamento, despesa, lixeira) e a tela funciona.');
