// ═════════════════════════════════════════════════════
// TESTE — A IMPRESSORA NÃO SOME AO FECHAR E REABRIR (v7.0.18, rodada 30)
//
// A DOR (relatada pelo dono): "cadastra a impressora no contrato e ela some
// quando fecha e abre o programa".
//
// O DEFEITO PROVADO (nesta rodada): ele gravou e o programa fechou antes de
// subir (faltou luz, travou, fechou sem internet, ou a fila estava grande e a
// gravação não coube no envio de despedida). Ao reabrir no modo SÓ NUVEM, a
// base começa vazia, a fila pendente SOBE e a nuvem confirma — mas a confirmação
// só atualizava o livro-caixa e consumia a fila, SEM colocar o registro na base.
// O eco da nuvem é pulado pelo guarda de versão ("já conheço esta versão") e o
// registro ficava na nuvem, mas INVISÍVEL neste PC até a próxima reabertura.
// O conserto: ao confirmar um upsert, se o registro NÃO está na base, ele entra
// com os dados que acabaram de subir (nunca sobrescreve o que está na tela).
//
// O SEGUNDO DEFEITO (mesma família): quando a nuvem RECUSAVA um item
// (result.error), ele era descartado SEM NENHUM AVISO — e no SÓ NUVEM sumia ao
// fechar e reabrir. Agora a recusa aparece na tela (toast + sino) e no relatório
// de saúde da nuvem.
//
// O QUE ESTE TESTE FAZ (nuvem fingida + navegador na mão, relógio falso):
//   A. controle: envia antes de fechar → reabre → está lá;
//   F. A PROVA: o envio de despedida FALHA (offline/crash) → reabre, sobe a fila
//      pendente → a impressora TEM de estar na tela (banco=true), não só na nuvem;
//   C. a nuvem recusa o item → ele TEM de avisar na tela (nada de silêncio).
// ═════════════════════════════════════════════════════
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== IMPRESSORA NÃO SOME AO REABRIR ==');
  console.log("  (não rodou: falta a dependência 'jsdom' — não é defeito do sistema)");
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  ✘ ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  ✔ ' + nome); passou++;
}
const FONTE = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const OUTBOX_KEY = 'digicopy_cf_sync_outbox_v1';

function nuvemFingida(op) {
  op = op || {};
  const diario = [];
  const envios = [];
  const relatos = [];
  let cursor = 0;
  return {
    diario: diario, envios: envios, relatos: relatos,
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
        if (op.falharKeepalive && opt.keepalive) throw new Error('offline-no-fechamento');
        const corpo = JSON.parse(opt.body || '{}');
        const muts = corpo.mutations || [];
        envios.push({ keepalive: !!opt.keepalive, mutations: muts });
        const results = muts.map((m, i) => {
          if (op.rejeitar && op.rejeitar(m)) {
            return { index: i, error: { codigo: 'RECORD_TOO_LARGE', mensagem: 'registro excede o limite (simulado)' } };
          }
          if (m.operation === 'delete') return { index: i, ok: true, version: 1 };
          const ja = diario.filter((c) => c.entity === m.entity && String(c.recordId) === String(m.recordId));
          cursor++;
          if (ja.length) { ja[ja.length - 1].data = m.data; return { index: i, ok: true, version: 2 }; }
          diario.push({ cursor: cursor, entity: m.entity, recordId: m.recordId, data: m.data, version: 1 });
          return { index: i, ok: true, version: 1 };
        });
        return { results: results };
      }
      if (path === '/v1/relato' && opt.method === 'POST') { relatos.push(JSON.parse(opt.body || '{}')); return { ok: true }; }
      if (path.indexOf('/v1/status') === 0) return { ok: true, registros: diario.length, totals: { records: diario.length, byEntity: {} } };
      if (path.indexOf('/v1/changes/watch') === 0) return { changes: [], nextCursor: cursor };
      return {};
    }
  };
}

function abrirNavegador(nuvem, estadoSalvo) {
  const dom = new JSDOM('<!DOCTYPE html><body><button id="btn-nuvem" title="Nuvem"><i></i></button></body>',
    { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  if (estadoSalvo) Object.keys(estadoSalvo).forEach((k) => { try { w.localStorage.setItem(k, estadoSalvo[k]); } catch (e) { } });
  w.localStorage.setItem('digicopy_cf_token_v1', 'token-de-teste');
  w.DIGICOPY_CLOUD = { token: () => 'token-de-teste', api: nuvem.api, deviceInfo: () => null };
  w.DIGICOPY_SO_NUVEM = true;
  w.DIGICOPY_APP_VERSION = '7.0.18';
  w.getSession = () => null;
  w.db = { clientes: [], produtos: [], vendas: [], contasReceber: [], contasPagar: [], config: {}, _seq: {}, parque: [], equipamentos: [], contratos: [] };
  w.saveDB = function () { };
  w.saveDBAgora = function () { };
  const avisos = [];
  const sino = [];
  w.toast = function (txt, tipo) { avisos.push({ txt: String(txt), tipo: tipo || '' }); };
  w.alert = function (txt) { avisos.push({ txt: String(txt), tipo: 'alert' }); };
  w.notificarEvento = function (sev, msg) { sino.push({ sev: sev, msg: String(msg) }); };
  // o relógio começa no AGORA de verdade (não no zero): os fusíveis de tempo do
  // motor (ex.: "não repetir o relato de saúde dentro de 10 min") se comportam
  // como no PC do dono — com o relógio no zero, tudo pareceria "recém-feito".
  let relogio = Date.now();
  const fila = [];
  let proximoId = 1;
  w.setTimeout = function (fn, ms) { const id = proximoId++; fila.push({ id: id, quando: relogio + (Number(ms) || 0), fn: fn }); return id; };
  w.clearTimeout = function (id) { const i = fila.findIndex((x) => x.id === id); if (i >= 0) fila.splice(i, 1); };
  w.setInterval = function () { return 0; };
  const RelogioReal = Date;
  w.Date = class extends RelogioReal { constructor(...a) { super(...(a.length ? a : [relogio])); } static now() { return relogio; } };
  const pendentes = () => fila.slice().sort((a, b) => a.quando - b.quando);
  async function respirar() { for (let i = 0; i < 8; i++) await new Promise((r) => setImmediate(r)); }
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
    janela: w, dom: dom, andar: andar, respirar: respirar, avisos: avisos, sino: sino,
    filaSalva: () => { try { return JSON.parse(w.localStorage.getItem(OUTBOX_KEY) || '[]'); } catch (e) { return []; } },
    estadoSalvo: () => {
      const out = {};
      for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); out[k] = w.localStorage.getItem(k); }
      return out;
    },
    fechar: () => { w.dispatchEvent(new w.Event('pagehide')); }
  };
}

// o clique "salvar impressora no contrato" (fluxo_contrato_leitura_corrigido_patch.js)
function salvarImpressora(w, tag) {
  const e = { id: 'eq-' + tag, empresaId: 'emp1', criadoEm: new Date().toISOString(), serie: 'SN' + tag, modelo: 'HP M404', patrimonio: 'PAT' + tag };
  w.db.equipamentos.push(e);
  const p = { id: 'prq-' + tag, contratoId: 'ctr-1', equipamentoId: e.id, empresaId: 'emp1', setor: 'Recepção', status: 'ativo', criadoEm: new Date().toISOString(), medidores: { pb: { ativo: true, valorLocacao: 100 } } };
  w.db.parque.push(p);
  const c = w.db.contratos.find((x) => x.id === 'ctr-1');
  c.equipamentos = c.equipamentos || [];
  c.equipamentos.push(e.id);
  c.valorMensalFixo = 100;
  w.saveDB();
  return p.id;
}

async function cicloFecharReabrir(opNuvem, tag, esperarEnvio) {
  const nuvem = nuvemFingida(opNuvem);
  nuvem.semear('contratos', 'ctr-1', { id: 'ctr-1', empresaId: 'emp1', numero: 'CT-1', clienteId: 'cli-1', equipamentos: [], valorMensalFixo: 0 });
  nuvem.semear('clientes', 'cli-1', { id: 'cli-1', empresaId: 'emp1', nome: 'Cliente' });
  const n1 = abrirNavegador(nuvem);
  await n1.andar(20000);
  const idNovo = salvarImpressora(n1.janela, tag);
  if (esperarEnvio) await n1.andar(20000);
  else await n1.andar(5);
  n1.fechar();
  await n1.respirar();
  const guardado = n1.estadoSalvo();
  const nuvem2 = nuvemFingida(opNuvem);
  nuvem2.diario.push.apply(nuvem2.diario, nuvem.diario);
  const n2 = abrirNavegador(nuvem2, guardado);
  await n2.andar(30000);
  return {
    id: idNovo,
    noBanco: (n2.janela.db.parque || []).some((c) => c && c.id === idNovo),
    naNuvem: nuvem2.diario.some((c) => c.entity === 'parque' && String(c.recordId) === idNovo),
    naFila: n2.filaSalva().some((x) => x && String(x.key).indexOf(idNovo) >= 0),
    avisos: n2.avisos, sino: n2.sino, relatos: nuvem2.relatos
  };
}

(async function () {
  console.log('== A IMPRESSORA NÃO SOME AO FECHAR E REABRIR ==');

  console.log('-- controle: envia antes de fechar --');
  {
    const r = await cicloFecharReabrir({}, 'A', true);
    ok('enviou antes de fechar: está na tela e na nuvem', r.noBanco && r.naNuvem, JSON.stringify({ banco: r.noBanco, nuvem: r.naNuvem }));
  }

  console.log('-- A PROVA: despedida falha (offline/crash), sobe depois de reabrir --');
  {
    const r = await cicloFecharReabrir({ falharKeepalive: true }, 'F', false);
    ok('subiu na nuvem depois de reabrir', r.naNuvem, 'nuvem=' + r.naNuvem);
    ok('E ESTÁ NA TELA (não some)', r.noBanco, 'banco=' + r.noBanco + ' fila=' + r.naFila);
    ok('nada preso na fila', !r.naFila, 'fila=' + r.naFila);
  }

  console.log('-- recusa da nuvem nunca mais em silêncio --');
  {
    const r = await cicloFecharReabrir({ rejeitar: (m) => m.entity === 'parque' && String(m.recordId) === 'prq-C' }, 'C', false);
    const avisouTela = r.avisos.some((a) => /recusou/i.test(a.txt));
    const avisouSino = r.sino.some((s) => /recusou/i.test(s.msg));
    ok('a recusa aparece na tela (toast)', avisouTela, JSON.stringify(r.avisos.map((a) => a.txt).slice(0, 2)));
    ok('a recusa aparece no sino', avisouSino, JSON.stringify(r.sino.map((s) => s.msg).slice(0, 1)));
    ok('a recusa vai para o relatório de saúde da nuvem', r.relatos.some((x) => x && x.tipo === 'recusado'), JSON.stringify(r.relatos.slice(0, 2)));
  }

  console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
})().catch((e) => { console.error('ERRO NO TESTE:', e); process.exit(2); });
