// ═════════════════════════════════════════════════════
// TESTE — O DADO APARECE NO OUTRO PC (v7.0.19, rodada 31)
//
// A DOR (relatada pelo dono): "às vezes um dado criado não aparece em outro PC;
// demora sincronizar os dados para aparecer tudo de uma vez" (a impressora de
// contrato era só um exemplo).
//
// DEFEITO 1 PROVADO: VENDAS e LEITURAS nunca se atualizavam sozinhas (estavam
// fora da lista de telas ao vivo, como "telas de documento"). O dado CHEGAVA no
// banco do outro PC, mas a lista na tela continuava velha até a pessoa trocar de
// tela e voltar. Os dois renders são só releitura da lista (o que se digita fica
// em modal/campo, protegido pela trava de sempre) — agora são ao vivo. CONFIG
// continua de fora de propósito: o render dela escreve nos campos e apagaria o
// que ele digitou e ainda não salvou.
//
// DEFEITO 2 PROVADO: na remontagem com aviso ("Baixar tudo de novo", primeira
// abertura), a tela azul de carga SEGURAVA o programa inteiro até o fim do
// histórico — num diário grande, minutos olhando "Baixando os dados da nuvem…",
// mesmo com o estado de agora já na base (o passe rápido). Agora o passe rápido
// libera na hora: o aviso afina (faixinha embaixo, sem bloquear) e a tela se
// atualiza; o resto compõe em silêncio atrás.
//
// O QUE ESTE TESTE FAZ:
//   1. confere o mapa: todas as telas com view são ao vivo, menos config;
//   2. A PROVA do defeito 2: diário grande (8000), páginas lentas (60 ms) —
//      exige que o dado recente esteja na tela E a trava da carga aberta ANTES
//      da remontagem completar (e que ela complete depois, sem sobra);
//   3. regressão do regime: com os dois PCs abertos, o que A grava aparece no
//      banco de B em segundos.
//   4. FOTO DA NUVEM (motor 5.28.0): a abertura lê o ESTADO ATUAL paginado e
//      pula o replay do diário (o que for gravado DURANTE a foto chega pelo
//      incremental); com motor antigo (404) o diário assume sozinho.
// ═════════════════════════════════════════════════════
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== O DADO APARECE NO OUTRO PC ==');
  console.log("  (não rodou: falta a dependência 'jsdom' — não é defeito do sistema)");
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  ✘ ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  ✔ ' + nome); passou++;
}
const FONTE = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');

// ── parte 1: o mapa de telas ao vivo (sem navegador: só o mapa exportado) ──
{
  const window = { DIGICOPY_CLOUD: { token: () => '' } };
  new Function('window', 'localStorage', 'document', FONTE)(
    window,
    { getItem: () => null, setItem: () => { }, removeItem: () => { } },
    undefined
  );
  const telas = (window.DIGICOPY_CLOUD_SYNC && window.DIGICOPY_CLOUD_SYNC.telasAoVivo) || {};
  ['dashboard', 'clientes', 'produtos', 'impressoras', 'contratos', 'parque', 'manutencao',
    'financeiro', 'relatorios', 'usuarios', 'auditoria', 'vendas', 'leituras'].forEach((t) => {
      ok('tela "' + t + '" é ao vivo', !!telas[t]);
    });
  ok('tela "config" continua de fora (o render escreve nos campos)', !telas.config);
}

// ── navegador na mão: relógio falso + páginas da nuvem com atraso ──
function nuvemFingida() {
  const diario = [];
  let cursor = 0;
  const self = {
    diario: diario, atrasar: null, fotoReqs: 0, diarioReqs: 0,
    semear: function (n) {
      for (let i = 0; i < n; i++) {
        cursor++;
        diario.push({ cursor: cursor, entity: 'clientes', recordId: 'seed-' + cursor, data: { id: 'seed-' + cursor, nome: 'Cliente ' + cursor }, version: 1 });
      }
    },
    semearVersoes: function (nRegs, nVers) {
      for (let r = 1; r <= nRegs; r++) for (let v = 1; v <= nVers; v++) {
        cursor++;
        diario.push({ cursor: cursor, entity: 'clientes', recordId: 'cli-' + r, data: { id: 'cli-' + r, nome: 'Cliente ' + r, v: v }, version: v });
      }
    },
    api: async function (path, options) {
      const opt = options || {};
      if (path.indexOf('/v1/changes?cursor=') === 0) {
        self.diarioReqs++;
        if (self.atrasar) await self.atrasar(60);   // página lenta: dá para ver o durante
        const m = /cursor=(\d+)(?:&limit=(\d+))?/.exec(path);
        const pedido = Number(m[1]) || 0, limit = Math.min(1000, Number(m[2]) || 200);
        const sel = diario.filter((c) => c.cursor > pedido).slice(0, limit + 1);
        const hasMore = sel.length > limit;
        const changes = (hasMore ? sel.slice(0, limit) : sel).map((c) => ({
          seq: c.cursor, entity: c.entity, recordId: c.recordId, data: c.data, version: c.version, operation: 'upsert'
        }));
        return { changes: changes, nextCursor: changes.length ? changes[changes.length - 1].seq : pedido, hasMore: hasMore };
      }
      if (path === '/v1/changes' && opt.method === 'POST') {
        const muts = (JSON.parse(opt.body || '{}').mutations) || [];
        const results = muts.map((mmt, i) => {
          if (mmt.operation === 'delete') return { index: i, ok: true, version: 1 };
          cursor++;
          diario.push({ cursor: cursor, entity: mmt.entity, recordId: mmt.recordId, data: mmt.data, version: 1 });
          return { index: i, ok: true, version: 1 };
        });
        return { results: results };
      }
      if (path.indexOf('/v1/snapshot') === 0) {
        self.fotoReqs++;
        if (!self.comFoto) { const e404 = new Error('sem foto'); e404.status = 404; throw e404; }
        if (self._seqFoto == null) self._seqFoto = cursor;   // igual ao motor: MAX(seq) lido ANTES
        if (self.injetarDuranteFoto && !self._injetou) {
          self._injetou = true; cursor++;   // gravado DURANTE a foto (seq maior)
          diario.push({ cursor: cursor, entity: 'clientes', recordId: 'c-novo', data: { id: 'c-novo', nome: 'Novo', v: 1 }, version: 1 });
        }
        const vivos = {};
        diario.forEach((c) => { const k = c.entity + '|' + c.recordId; if (!vivos[k] || c.cursor > vivos[k].cursor) vivos[k] = c; });
        const lista = Object.keys(vivos).map((k) => vivos[k]).sort((a, b) => (a.entity < b.entity ? -1 : a.entity > b.entity ? 1 : (a.recordId < b.recordId ? -1 : a.recordId > b.recordId ? 1 : 0)));
        const mf = /afterEntity=([^&]*)&afterId=([^&]*)(?:&limit=(\d+))?/.exec(path) || [];
        const ae = decodeURIComponent(mf[1] || ''), ai = decodeURIComponent(mf[2] || '');
        const lim = Math.min(1000, Number(mf[3]) || 1000);
        const apos = lista.filter((c) => !ae || c.entity > ae || (c.entity === ae && c.recordId > ai));
        const sel = apos.slice(0, lim + 1);
        const hasMore = sel.length > lim;
        return { ok: true, snapshotSeq: self._seqFoto, records: (hasMore ? sel.slice(0, lim) : sel).map((c) => ({ entity: c.entity, recordId: c.recordId, data: c.data, version: c.version })), hasMore: hasMore };
      }
      if (path.indexOf('/v1/changes/watch') === 0) {
        const ped = Number(/cursor=(\d+)/.exec(path)[1]) || 0;
        return { ok: true, novidade: cursor > ped, maxSeq: cursor };
      }
      if (path.indexOf('/v1/status') === 0) return { ok: true, registros: diario.length, totals: { records: diario.length, cursor: cursor, byEntity: {} } };
      return {};
    }
  };
  return self;
}

function abrirNavegador(nuvem, op) {
  op = op || {};
  const dom = new JSDOM('<!DOCTYPE html><body><button id="btn-nuvem" title="Nuvem"><i></i></button>' +
    '<section id="view-vendas" class="view"></section></body>',
    { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.localStorage.setItem('digicopy_cf_token_v1', 'token-de-teste');
  if (op.soNuvem === false) w.localStorage.setItem('digicopy_cf_so_nuvem_v1', '0');
  w.DIGICOPY_CLOUD = { token: () => 'token-de-teste', api: nuvem.api, deviceInfo: () => null };
  w.DIGICOPY_APP_VERSION = '7.0.19';
  w.getSession = () => null;
  w.db = { clientes: [], produtos: [], vendas: [], contasReceber: [], contasPagar: [], config: {}, _seq: {}, parque: [], equipamentos: [], contratos: [], leituras: [], os: [] };
  w.saveDB = function () { };
  w.saveDBAgora = function () { };
  w.toast = function () { };
  let chamadasRender = 0;
  w.renderVendas = function () { chamadasRender++; };
  let relogio = Date.now();
  const fila = [];
  let proximoId = 1;
  w.setTimeout = function (fn, ms) { const id = proximoId++; fila.push({ id: id, quando: relogio + (Number(ms) || 0), fn: fn }); return id; };
  w.clearTimeout = function (id) { const i = fila.findIndex((x) => x.id === id); if (i >= 0) fila.splice(i, 1); };
  w.setInterval = function () { return 0; };
  const RelogioReal = Date;
  w.Date = class extends RelogioReal { constructor(...a) { super(...(a.length ? a : [relogio])); } static now() { return relogio; } };
  nuvem.atrasar = (ms) => new Promise((r) => w.setTimeout(r, ms));
  const pendentes = () => fila.slice().sort((a, b) => a.quando - b.quando);
  async function respirar() { for (let i = 0; i < 8; i++) await new Promise((r) => setImmediate(r)); }
  async function andar(ms) {
    const fim = relogio + ms;
    for (let guarda = 0; guarda < 20000; guarda++) {
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
    janela: w, andar: andar,
    chamadasRender: () => chamadasRender,
    cargaLigada: () => { try { return !!w.DIGICOPY_CLOUD_SYNC.cargaNuvemLigada(); } catch (e) { return null; } },
    temAviso: () => !!w.document.getElementById('digicopy-carga-nuvem'),
    totalBanco: () => (w.db.clientes || []).length,
    temRecente: (id) => (w.db.clientes || []).some((c) => c && c.id === id)
  };
}

(async function () {
  console.log('== O DADO APARECE NO OUTRO PC ==');

  console.log('-- A PROVA: a tela libera antes de terminar o histórico --');
  {
    const TOTAL = 8000;
    const nuvem = nuvemFingida();
    nuvem.semear(TOTAL);
    const B = abrirNavegador(nuvem, { soNuvem: false });   // primeira abertura COM aviso de carga
    let momento = null;
    for (let passo = 0; passo < 400 && !momento; passo++) {
      await B.andar(61);
      if (B.temRecente('seed-' + TOTAL) && !B.cargaLigada() && B.chamadasRender() > 0) {
        momento = { total: B.totalBanco(), render: B.chamadasRender(), avisoAindaLa: B.temAviso() };
      }
    }
    ok('o dado recente chegou na tela e a trava abriu', !!momento, JSON.stringify(momento));
    ok('E ISSO ANTES de terminar o histórico (não segura tudo)',
      !!momento && momento.total < TOTAL, 'banco=' + (momento && momento.total) + ' de ' + TOTAL);
    ok('o aviso virou faixinha (continua lá, sem bloquear)', !!momento && momento.avisoAindaLa === true);
    await B.andar(120000);
    ok('depois o histórico completa (tudo chega)', B.totalBanco() === TOTAL, 'banco=' + B.totalBanco());
    ok('e o aviso sai no fim', !B.temAviso() && !B.cargaLigada());
  }

  console.log('-- regime: com os dois abertos, chega em segundos --');
  {
    const nuvem = nuvemFingida();
    nuvem.semear(5);
    const A = abrirNavegador(nuvem);
    const B = abrirNavegador(nuvem);
    await A.andar(15000); await B.andar(15000);
    A.janela.db.clientes.push({ id: 'cli-novo', nome: 'Novo' });
    A.janela.saveDB();
    let viu = -1;
    for (let s = 0; s < 10; s++) {
      await A.andar(1000); await B.andar(1000);
      if (B.temRecente('cli-novo')) { viu = s + 1; break; }
    }
    ok('B vê o que A gravou em até 10s', viu > 0, viu > 0 ? viu + 's' : 'não viu');
  }

  console.log('-- foto: a abertura lê o estado, não a história --');
  {
    const nuvem = nuvemFingida();
    nuvem.comFoto = true;
    nuvem.injetarDuranteFoto = true;
    nuvem.semearVersoes(15, 100);   // 1500 no diário, 15 vivos
    const B = abrirNavegador(nuvem, { soNuvem: false });
    // lê os contadores LOGO que o banco enche (cada tique de 3s faria +1 depois)
    for (let passo = 0; passo < 400 && B.totalBanco() < 16; passo++) await B.andar(61);
    const contaFoto = 'foto=' + nuvem.fotoReqs + ' diario=' + nuvem.diarioReqs;
    ok('a abertura usou a foto (1 página) e pulou o replay (0 a 1 incremental)',
      nuvem.fotoReqs === 1 && nuvem.diarioReqs <= 1, contaFoto);
    await B.andar(60000);
    const cli = B.janela.db.clientes || [];
    ok('os 15 vivos chegaram na versão atual (v100)',
      cli.length === 16 && cli.every((c) => c.id === 'c-novo' || c.v === 100), 'banco=' + cli.length);
    ok('o que foi gravado DURANTE a foto aparece (pelo incremental)', B.temRecente('c-novo'));
    ok('e o aviso de carga saiu no fim', !B.temAviso() && !B.cargaLigada());
  }

  console.log('-- motor antigo (sem foto): o diário assume sozinho --');
  {
    const nuvem = nuvemFingida();   // sem comFoto: /v1/snapshot dá 404, igual ao motor antigo
    nuvem.semearVersoes(15, 100);
    const B = abrirNavegador(nuvem, { soNuvem: false });
    for (let passo = 0; passo < 400 && B.totalBanco() < 15; passo++) await B.andar(61);
    const contaDiario = 'foto=' + nuvem.fotoReqs + ' diario=' + nuvem.diarioReqs;
    ok('o app tentou a foto primeiro (404 do motor antigo) e caiu no diário',
      nuvem.fotoReqs >= 1 && nuvem.diarioReqs >= 2, contaDiario);
    await B.andar(120000);
    const cli = B.janela.db.clientes || [];
    ok('sem foto, o diário completo assume (lento, correto)',
      cli.length === 15 && cli.every((c) => c.v === 100), 'banco=' + cli.length);
    ok('e o aviso de carga saiu no fim', !B.temAviso() && !B.cargaLigada());
  }

  console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
})().catch((e) => { console.error('ERRO NO TESTE:', e); process.exit(2); });
