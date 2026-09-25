// ═════════════════════════════════════════════════════
// TESTE — A NUVEM NÃO PODE PERDER O QUE ELE ACABOU DE GRAVAR
//
// A DOR (relatada pelo dono): "dado que some". O caminho vivo da gravação é o
// SÓ NUVEM (upload_cloud/cloudflare_data_sync_patch.js): a base NÃO é gravada
// neste computador, então o que garante que a mudança não morra é a FILA
// (outbox) persistida no navegador.
//
// O defeito provado aqui (rodada 23, §37.3): a mudança só entrava na fila
// quando a varredura rodava — e a varredura era agendada para 900 ms DEPOIS de
// gravar. Nessa janela, a única cópia da mudança estava na memória: fechar a
// janela (ou faltar luz, ou o programa morrer) levava a mudança embora, e como
// o SÓ NUVEM remonta a base pela nuvem, ela NÃO voltava.
//
// O QUE ESTE TESTE FAZ (com a nuvem fingida e o relógio na mão):
//   1. abre o sistema com a base assentada (nada pendente);
//   2. grava um cliente (window.saveDB) e NÃO deixa o relógio andar;
//   3. confere o que sobrou no navegador (a fila persistida) — hoje: nada;
//   4. fecha a janela (pagehide) e REABRE com a nuvem que não tem o cliente;
//   5. exige que a mudança sobreviva (na fila ou já enviada com keepalive).
// ═════════════════════════════════════════════════════
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== NUVEM NÃO PERDE ==');
  console.log("  (não rodou: falta a dependência 'jsdom' — não é defeito do sistema)");
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  \u2718 ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}
const FONTE = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const OUTBOX_KEY = 'digicopy_cf_sync_outbox_v1';
const STATE_KEY = 'digicopy_cf_sync_state_v1';

// ── a nuvem fingida: guarda o diário em memória e responde igual ao motor ──
function nuvemFingida() {
  const diario = [];        // {cursor, entity, recordId, data, version}
  const envios = [];        // o que o PC mandou
  let cursor = 0;
  return {
    diario: diario,
    envios: envios,
    // planta um registro JÁ EXISTENTE na nuvem (com o cursor certo, como se tivesse
    // sido gravado por outro computador antes deste abrir)
    semear: function (entity, recordId, data) {
      cursor++;
      diario.push({ cursor: cursor, entity: entity, recordId: recordId, data: data, version: 1 });
    },
    api: async function (path, options) {
      const opt = options || {};
      if (path.indexOf('/v1/changes?cursor=') === 0) {
        const pedido = Number(/cursor=(\d+)/.exec(path)[1]) || 0;
        const novas = diario.filter((c) => c.cursor > pedido);
        return { changes: novas, nextCursor: cursor, hasMore: false };
      }
      if (path === '/v1/changes' && opt.method === 'POST') {
        const corpo = JSON.parse(opt.body || '{}');
        envios.push({ keepalive: !!opt.keepalive, mutations: corpo.mutations || [] });
        (corpo.mutations || []).forEach((m, i) => {
          if (m.operation === 'delete') return;
          const ja = diario.filter((c) => c.entity === m.entity && String(c.recordId) === String(m.recordId));
          cursor++;
          if (ja.length) { ja[ja.length - 1].data = m.data; ja[ja.length - 1].version = (ja[ja.length - 1].version || 0) + 1; return; }
          diario.push({ cursor: cursor, entity: m.entity, recordId: m.recordId, data: m.data, version: 1 });
        });
        return { results: (corpo.mutations || []).map((m, i) => ({ index: i, ok: true, version: 1 })) };
      }
      if (path.indexOf('/v1/status') === 0) return { ok: true, registros: diario.length, totals: { records: diario.length, byEntity: {} } };
      if (path.indexOf('/v1/changes/watch') === 0) return { changes: [], nextCursor: cursor };
      return {};
    }
  };
}

// ── o navegador na mão: relógio falso (nada roda sozinho) + localStorage ──
function abrirNavegador(nuvem, estadoSalvo) {
  const dom = new JSDOM('<!DOCTYPE html><body><button id="btn-nuvem" title="Nuvem"><i></i></button></body>',
    { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  // restaura o que estava gravado no navegador (é o que sobrevive a fechar/reabrir)
  if (estadoSalvo) Object.keys(estadoSalvo).forEach((k) => { try { w.localStorage.setItem(k, estadoSalvo[k]); } catch (e) { } });
  w.localStorage.setItem('digicopy_cf_token_v1', 'token-de-teste');
  w.DIGICOPY_CLOUD = { token: () => 'token-de-teste', api: nuvem.api, deviceInfo: () => null };
  w.DIGICOPY_SO_NUVEM = true;
  w.DIGICOPY_APP_VERSION = '7.0.17';
  w.getSession = () => null;
  w.db = { clientes: [], produtos: [], vendas: [], contasReceber: [], contasPagar: [], config: {}, _seq: {} };
  w.saveDB = function () { };            // o saveDB "de antes" (app.js) — o motor embrulha este
  w.saveDBAgora = function () { };
  const avisos = [];
  w.toast = function (txt, tipo) { avisos.push({ txt: String(txt), tipo: tipo || '' }); };
  w.alert = function (txt) { avisos.push({ txt: String(txt), tipo: 'alert' }); };

  // relógio falso: guarda os temporizadores e só roda quando o teste mandar
  let relogio = 0;
  const fila = [];
  let proximoId = 1;
  w.setTimeout = function (fn, ms) { const id = proximoId++; fila.push({ id: id, quando: relogio + (Number(ms) || 0), fn: fn }); return id; };
  w.clearTimeout = function (id) { const i = fila.findIndex((x) => x.id === id); if (i >= 0) fila.splice(i, 1); };
  w.setInterval = function () { return 0; };
  w.Date.now = () => relogio;
  const RelogioReal = Date;
  w.Date = class extends RelogioReal { constructor(...a) { super(...(a.length ? a : [relogio])); } static now() { return relogio; } };

  const pendentes = () => fila.slice().sort((a, b) => a.quando - b.quando);
  async function respirar() { for (let i = 0; i < 8; i++) await new Promise((r) => setImmediate(r)); }
  // roda os temporizadores devidos até o limite, deixando as promessas assentarem
  async function andar(ms) {
    const fim = relogio + ms;
    for (let guarda = 0; guarda < 4000; guarda++) {
      const lista = pendentes();
      if (!lista.length || lista[0].quando > fim) break;
      const t = lista[0];
      relogio = t.quando;
      const i = fila.findIndex((x) => x.id === t.id); if (i >= 0) fila.splice(i, 1);
      try { t.fn(); } catch (e) { }
      await respirar();
    }
    relogio = fim;
    await respirar();
  }

  w.eval(FONTE);
  return {
    janela: w, dom: dom, andar: andar, respirar: respirar, avisos: avisos,
    agora: () => relogio,
    filaSalva: () => { try { return JSON.parse(w.localStorage.getItem(OUTBOX_KEY) || '[]'); } catch (e) { return []; } },
    estadoSalvo: () => {
      const out = {};
      for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); out[k] = w.localStorage.getItem(k); }
      return out;
    },
    fechar: () => { w.dispatchEvent(new w.Event('pagehide')); }
  };
}

(async function () {
  console.log('== A NUVEM NÃO PODE PERDER O QUE ELE ACABOU DE GRAVAR ==');
  const nuvem = nuvemFingida();
  const n1 = abrirNavegador(nuvem);
  ok('o motor da nuvem carregou e se apresentou', !!(n1.janela.DIGICOPY_CLOUD_SYNC && n1.janela.DIGICOPY_CLOUD_SYNC.info));

  // 1) a base assenta: o motor lê a nuvem e não tem nada pendente
  await n1.andar(20000);
  const i1 = n1.janela.DIGICOPY_CLOUD_SYNC.info();
  ok('a base assentou sem pendência (fila vazia)', i1.outbox === 0, JSON.stringify(i1.outbox));

  // 2) ELE GRAVA um cliente e o relógio NÃO anda (é o instante do clique)
  const cliente = { id: 'c-novo', nome: 'Cliente do Balcão', cidade: 'Montes Claros' };
  n1.janela.db.clientes.push(cliente);
  n1.janela.saveDB();                       // é assim que o sistema grava

  // 3) o que já está GRAVADO no navegador no fim do clique? (no máximo uns milésimos
  //    depois: numa base grande o motor adia a varredura para o fim do clique, e ela
  //    roda antes de qualquer outra coisa — nada de esperar os 900 ms)
  await n1.andar(5);
  const salvoNoClique = n1.filaSalva().filter((x) => x && x.key === 'clientes|c-novo');
  ok('a gravação ENTRA NA FILA no fim do clique (não fica só na memória)',
    salvoNoClique.length === 1, 'fila no clique: ' + JSON.stringify(n1.filaSalva().map((x) => x.key)));

  // 4) ele fecha a janela logo depois de gravar
  n1.fechar();
  await n1.respirar();
  const depoisDeFechar = n1.filaSalva().filter((x) => x && x.key === 'clientes|c-novo');
  ok('e ao FECHAR a janela a mudança continua gravada na fila',
    depoisDeFechar.length === 1, 'fila ao fechar: ' + JSON.stringify(n1.filaSalva().map((x) => x.key)));

  // 5) ao fechar, o motor tenta entregar o que couber com keepalive (a promessa sobrevive ao fechamento)
  const comKeepalive = nuvem.envios.filter((e) => e.keepalive);
  const entregouNoFechamento = comKeepalive.some((e) => e.mutations.some((m) => m.recordId === 'c-novo'));
  ok('ao fechar o motor tenta entregar com keepalive (chega antes, sem esperar a próxima abertura)',
    entregouNoFechamento, 'envios com keepalive: ' + comKeepalive.length);

  // 6) ele REABRE o sistema: a nuvem (o que o motor entregou) + o que ficou gravado no navegador.
  //    SÓ NUVEM: a base é remontada pela nuvem, então o cliente só existe se veio da nuvem ou da fila.
  const guardado = n1.estadoSalvo();
  const nuvem2 = nuvemFingida();
  nuvem2.diario.push.apply(nuvem2.diario, nuvem.diario);
  const n2 = abrirNavegador(nuvem2, guardado);
  await n2.andar(20000);
  const clienteNaNuvem = nuvem2.diario.some((c) => c.entity === 'clientes' && String(c.recordId) === 'c-novo');
  const clienteNoBanco = (n2.janela.db.clientes || []).some((c) => c && c.id === 'c-novo');
  ok('DEPOIS DE FECHAR E REABRIR o cliente está lá (veio para a nuvem ou continuou na fila)',
    clienteNaNuvem || clienteNoBanco,
    'nuvem=' + clienteNaNuvem + ' banco=' + clienteNoBanco + ' fila=' + JSON.stringify(n2.filaSalva().map((x) => x.key)));

  const i2 = n2.janela.DIGICOPY_CLOUD_SYNC.info();
  ok('e o motor mostra na tela que está tudo entregue (nada preso na memória)',
    i2.outbox === 0 || clienteNaNuvem, JSON.stringify({ outbox: i2.outbox, naNuvem: clienteNaNuvem }));

  console.log('-- o que o dono vê sobre a fila (nada de fila invisível) --');
  ok('o motor diz quantos estão por subir e até quando está em dia',
    typeof i2.outbox === 'number' && typeof i2.emDiaAte === 'number', JSON.stringify({ outbox: i2.outbox, emDiaAte: i2.emDiaAte }));
  ok('e diz se a fila encheu (quando enche, ele PRECISA saber: nada foi perdido, mas sobe aos poucos)',
    i2.filaCheia === false || i2.filaCheia === true, String(i2.filaCheia));

  console.log('-- a fila cheia não pode virar perda (e nem silêncio) --');
  {
    const nuvem3 = nuvemFingida();
    const n3 = abrirNavegador(nuvem3);
    await n3.andar(20000);
    const caps = n3.janela.DIGICOPY_CLOUD_SYNC.info();
    const teto = Number(caps.tetoFila), tetoAoFechar = Number(caps.tetoAoFechar);
    ok('o motor diz os limites da fila (a tela não usa número mágico)',
      teto > 0 && tetoAoFechar > teto, JSON.stringify({ tetoFila: caps.tetoFila, tetoAoFechar: caps.tetoAoFechar }));

    // MUITO mais gravações do que a fila normal aceita — e mais do que cabe até ao fechar.
    const total = tetoAoFechar + 50;
    for (let i = 0; i < total; i++) n3.janela.db.clientes.push({ id: 'c' + i, nome: 'Cliente ' + i });
    n3.janela.saveDB();
    await n3.andar(5);   // fim do clique: a varredura já rodou
    const iTeto = n3.janela.DIGICOPY_CLOUD_SYNC.info();
    ok('com a fila no limite, o motor diz que encheu (ele PRECISA saber: sobe aos poucos)',
      iTeto.filaCheia === true && iTeto.outbox === teto, JSON.stringify({ outbox: iTeto.outbox, filaCheia: iTeto.filaCheia }));

    n3.fechar();
    await n3.respirar();
    const naFila = n3.filaSalva().filter((x) => x && String(x.key).indexOf('clientes|c') === 0).length;
    ok('mesmo com a fila cheia, AO FECHAR tudo o que coube fica guardado (nada só na memória)',
      naFila >= tetoAoFechar, 'guardados: ' + naFila + ' (teto ao fechar: ' + tetoAoFechar + ' de ' + total + ')');
    const avisou = n3.avisos.some((a) => /fila|pendente|subir|espa/i.test(a.txt));
    ok('e o que NÃO coube, ele avisa na tela (nada de silêncio)',
      avisou && naFila < total, 'avisos: ' + JSON.stringify(n3.avisos.slice(0, 2)) + ' guardados: ' + naFila + ' de ' + total);
  }

  console.log('-- "não está aparecendo nenhum dado, é normal?" --');
  {
    // Nuvem conectada mas SEM nenhum registro (é o caso de uma conexão nova, ou de uma
    // conexão apontando para outra loja): ele PRECISA ser avisado, com o nome da empresa,
    // em vez de ficar olhando a tela vazia e achando que perdeu tudo.
    const nuvem4 = nuvemFingida();
    const n4 = abrirNavegador(nuvem4);
    await n4.andar(20000);
    const avisou = n4.avisos.some((a) => /nenhum registro nesta empresa/i.test(a.txt));
    ok('base vazia com a nuvem respondendo avisa na tela (nada de tela vazia em silêncio)', avisou,
      'avisos: ' + JSON.stringify(n4.avisos.slice(0, 2)).slice(0, 160));

    // e com dados na nuvem esse aviso NÃO aparece (senão virava alarme falso)
    const nuvem5 = nuvemFingida();
    nuvem5.semear('clientes', 'c-existente', { id: 'c-existente', nome: 'Cliente Que Já Existe' });
    const n5 = abrirNavegador(nuvem5);
    await n5.andar(20000);
    const avisou5 = n5.avisos.some((a) => /nenhum registro nesta empresa/i.test(a.txt));
    const temDado = (n5.janela.db.clientes || []).some((c) => c && c.id === 'c-existente');
    ok('com dados na nuvem o aviso NÃO aparece e o dado está na tela (sem alarme falso)', !avisou5 && temDado,
      'avisou=' + avisou5 + ' na tela=' + temDado);
  }

  console.log('-- v7.0.17: LIBERAR A CÓPIA LOCAL EXIGE PROVA ITEM POR ITEM --');
  {
    // O CASO PERIGOSO: ele escolheu "não enviar o que já existe aqui" (a opção 2 da
    // tela Nuvem) — esses registros vivem SÓ neste PC. A nuvem, cheia, tem MAIS
    // registros do que este PC: a conta antiga (contagem) diria "a nuvem tem tudo"
    // e apagaria a cópia local — levando embora os registros segurados.
    const CHAVE_BASE = 'digicopy_erp_v42_demo_apresentacao_part__clientes';
    const nuvemA = nuvemFingida();
    nuvemA.semear('clientes', 'c-1', { id: 'c-1', nome: 'Da nuvem' });
    nuvemA.semear('clientes', 'c-2', { id: 'c-2', nome: 'Da nuvem 2' });
    nuvemA.semear('clientes', 'c-3', { id: 'c-3', nome: 'Da nuvem 3' });
    const guardadoA = {};
    guardadoA[CHAVE_BASE] = JSON.stringify([{ id: 'c-segurado', nome: 'Só neste PC' }]);
    guardadoA[STATE_KEY] = JSON.stringify({
      cursor: 0, versions: {}, hashes: {}, known: { 'clientes|c-1': true, 'clientes|c-2': true, 'clientes|c-3': true },
      initialPull: true, lastOk: 1, paused: false, heldLocalOnly: ['clientes|c-segulado'.replace('segulado', 'segurado')], pauseReason: ''
    });
    const nA = abrirNavegador(nuvemA, guardadoA);
    nA.janela.db.clientes = [{ id: 'c-segurado', nome: 'Só neste PC' }];
    await nA.andar(80000);   // tempo suficiente para a conferência da nuvem vencer o freio de 1 min
    const continuou = !!nA.janela.localStorage.getItem(CHAVE_BASE);
    ok('registro segurado (só neste PC) BLOQUEIA a liberação: contagem da nuvem não é prova',
      continuou, 'cópia local ' + (continuou ? 'preservada' : 'APAGADA'));
    ok('e o registro continua na memória do sistema (não sumiu da tela)',
      (nA.janela.db.clientes || []).some((c) => c && c.id === 'c-segurado'));
  }
  {
    // O CAMINHO BOM continua funcionando: o registro sobe para a nuvem e, SÓ DEPOIS
    // de confirmado (chave conhecida + hash igual), a cópia local é liberada.
    const CHAVE_BASE = 'digicopy_erp_v42_demo_apresentacao_part__clientes';
    const nuvemB = nuvemFingida();
    nuvemB.semear('clientes', 'c-base', { id: 'c-base', nome: 'Já estava na nuvem' });
    const guardadoB = {};
    guardadoB[CHAVE_BASE] = JSON.stringify([{ id: 'c-novo-b', nome: 'Novo do balcão' }]);
    const nB = abrirNavegador(nuvemB, guardadoB);
    nB.janela.db.clientes = [{ id: 'c-novo-b', nome: 'Novo do balcão' }];
    await nB.andar(80000);
    const subiu = nuvemB.diario.some((c) => c.entity === 'clientes' && String(c.recordId) === 'c-novo-b');
    const liberou = !nB.janela.localStorage.getItem(CHAVE_BASE);
    ok('quando TUDO está confirmado na nuvem, a cópia local é liberada como sempre', subiu && liberou,
      'subiu=' + subiu + ' liberou=' + liberou);
  }

  console.log('\nRESULTADO: ' + passou + ' verificações passaram — o que ele grava entra na fila na hora, sobrevive a fechar e reabrir, e a tela vazia nunca fica em silêncio.');
  try { n1.dom.window.close(); n2.dom.window.close(); } catch (e) { }
})();
