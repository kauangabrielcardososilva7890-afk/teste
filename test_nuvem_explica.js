// ═════════════════════════════════════════════════════
// TESTE — A NUVEM EXPLICA SOZINHA (v7.0.15)
//
// O que este teste prova (a queixa do dono: "não está aparecendo nenhum dado,
// é normal?"): o sistema NÃO pode ficar mudo quando a tela está vazia. A faixa
// do `ajustes_v7015_nuvem_explica_patch.js` tem de aparecer exatamente nos casos
// em que o dado não aparece, dizer o motivo em português, e consertar em 1 clique:
//
//   1) SEM CONEXÃO (o caso do link "jeito antigo"): portão fora da tela e a
//      sessão sem token → faixa + botão que REABRE o portão.
//   2) PAUSADA → faixa dizendo que este PC não está baixando nada.
//   3) CURSOR ADIANTADO (a nuvem tem mais do que aqui — o "some e não volta")
//      → faixa com os números ("clientes: 0 aqui × 3 na nuvem") e o botão
//      "Baixar tudo de novo", que relê o diário e faz o dado APARECER.
//   4) COM TUDO CERTO → a faixa NÃO aparece (senão vira alarme chato).
//
// Nuvem fingida + janela do sistema fingida. Nada de rede de verdade.
// ═════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== A NUVEM EXPLICA ==');
  console.log("  (não rodou: falta a dependência 'jsdom' — não é defeito do sistema)");
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  \u2718 ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}
const MOTOR = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const FAIXA = fs.readFileSync('ajustes_v7015_nuvem_explica_patch.js', 'utf8');
const CHECKUP = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');   // o check-up (resumo que ele copia)
const TOKEN_KEY = 'digicopy_cf_token_v1';
const STATE_KEY = 'digicopy_cf_sync_state_v1';

// ── a nuvem fingida: diário + contagem por lista (igual ao /v1/status) ──────
let freioDisparou = false;   // v7.0.16 — o freio preventivo do motor da nuvem (vem no /health)
function nuvemFingida(opcoes) {
  const cenario = opcoes || {};
  let falhasRestantes = Number(cenario.falhasDeLeitura) || 0;
  const diario = [];
  let cursor = 0;
  const contagem = () => {
    const byEntity = {};
    diario.forEach((c) => { byEntity[c.entity] = byEntity[c.entity] || { active: 0, deleted: 0 }; byEntity[c.entity].active++; });
    return { records: diario.length, cursor: cursor, byEntity: byEntity };
  };
  return {
    diario: diario, contagem: contagem,
    // a internet "volta" (o teste controla exatamente quando)
    liberar: function () { falhasRestantes = 0; },
    semear: function (entity, recordId, data) { cursor++; diario.push({ cursor: cursor, entity: entity, recordId: recordId, data: data, version: cursor }); },
    api: async function (path, options) {
      const opt = options || {};
      if (path.indexOf('/v1/changes?cursor=') === 0) {
        if (falhasRestantes > 0) { falhasRestantes--; throw new Error('A nuvem não respondeu agora (a internet caiu no meio da leitura)'); }
        const pedido = Number(/cursor=(\d+)/.exec(path)[1]) || 0;
        const novas = diario.filter((c) => c.cursor > pedido);
        return { changes: novas.map((c) => ({ entity: c.entity, recordId: c.recordId, data: c.data, version: c.version, operation: 'upsert' })), nextCursor: cursor, hasMore: false };
      }
      if (path === '/v1/changes' && opt.method === 'POST') {
        const corpo = JSON.parse(opt.body || '{}');
        return { results: (corpo.mutations || []).map((m, i) => ({ index: i, ok: true, version: 1 })) };
      }
      if (path.indexOf('/v1/status') === 0) return { ok: true, totals: contagem() };
      if (path === '/health') return { ok: true, versao: '5.26.9', freio: { plano: 'pago', tetoDia: 1000000, disparouHoje: !!freioDisparou, ultimoDisparoEm: freioDisparou ? Date.now() : null, motivo: freioDisparou ? 'dia' : null } };
      if (path.indexOf('/v1/changes/watch') === 0) return { changes: [], nextCursor: cursor };
      return {};
    }
  };
}

// ── o navegador na mão ─────────────────────────────────────────────────────
function abrir(cenario) {
  const dom = new JSDOM('<!DOCTYPE html><body><div id="login-screen" class="hidden"></div><button id="btn-nuvem"><i></i></button></body>',
    { url: 'http://localhost/', runScripts: 'outside-only' });
  const w = dom.window;
  const avisos = [], portaoAberto = [];
  w.toast = function (txt, tipo) { avisos.push({ txt: String(txt), tipo: tipo || '' }); };
  w.confirmSistema = function () { return Promise.resolve(true); };   // a janela do sistema (nunca a nativa)
  w.v5262AbrirPortao = function (force) { portaoAberto.push(!!force); return true; };
  w.abrirCloudflareNuvem = function () { portaoAberto.push('nuvem'); };
  w.v7015ConferirNuvem = undefined;
  w.localStorage.setItem('digicopy_cf_device_v1', JSON.stringify({ deviceId: 'pc-teste', activation: 'cnpj', cnpj: '11.222.333/0001-44' }));
  if (!cenario.semConexao) w.localStorage.setItem(TOKEN_KEY, 'token-de-teste');
  if (cenario.estadoInicial) w.localStorage.setItem(STATE_KEY, JSON.stringify(cenario.estadoInicial));
  w.DIGICOPY_CLOUD = { token: () => (cenario.semConexao ? '' : 'token-de-teste'), deviceInfo: () => ({ cnpj: '11.222.333/0001-44' }), api: cenario.nuvem.api };
  w.DIGICOPY_SO_NUVEM = true;
  w.saveDB = function () {}; w.saveDBAgora = function () {};
  // a base do SÓ NUVEM vive na memória (nada é gravado no PC) — é ela que as listas mostram
  w.db = { clientes: [], produtos: [], vendas: [], contasReceber: [], os: [], contratos: [], config: {} };
  w.db._seq = {};
  w.setInterval = () => 0;   // a faixa não repete sozinha no teste (a gente chama na mão)
  w.eval(MOTOR);
  w.eval(FAIXA);
  return {
    w: w, dom: dom, avisos: avisos, portaoAberto: portaoAberto,
    faixa: () => { const el = w.document.getElementById('v7015-faixa'); return el ? el.textContent : ''; },
    temFaixa: () => !!w.document.getElementById('v7015-faixa'),
    conferir: () => w.v7015ConferirNuvem(),
    // clica num botão da faixa (pelo rótulo)
    clicar: (rotulo) => {
      const el = w.document.getElementById('v7015-faixa');
      if (!el) return false;
      const bt = Array.prototype.slice.call(el.querySelectorAll('button')).find((b) => b.textContent === rotulo);
      if (!bt) return false;
      bt.onclick({ preventDefault() {} }); return true;
    },
    esperar: (ms) => new Promise((r) => setTimeout(r, ms))
  };
}

(async function () {
  console.log('== A NUVEM EXPLICA (nada de tela vazia em silêncio) ==');

  // ── 1) SEM CONEXÃO ───────────────────────────────────────────────────────
  {
    const n = abrir({ semConexao: true, nuvem: nuvemFingida() });
    await n.esperar(150);
    await n.conferir();
    ok('sem conexão e sem portão na tela: a faixa avisa que o computador não está conectado',
      n.temFaixa() && /não está conectado à nuvem/.test(n.faixa()), n.faixa().slice(0, 90));
    ok('o botão "Conectar agora" REABRE o portão da nuvem (é o que faltava para sair do vazio)',
      n.clicar('Conectar agora') && n.portaoAberto.length === 1 && n.portaoAberto[0] === true, JSON.stringify(n.portaoAberto));
  }

  // ── 2) PAUSADA ───────────────────────────────────────────────────────────
  //    A pausa NÃO sobrevive a um F5 (o motor destrava de propósito desde a v6.1.4:
  //    "conectou, sincroniza na hora"), então o teste pausa EM TEMPO DE USO — que é
  //    como ela acontece de verdade (ex.: o reset da nuvem e a cota diária).
  {
    const n = abrir({ nuvem: nuvemFingida() });
    await n.esperar(150);
    await n.w.DIGICOPY_CLOUD_SYNC.resetCloudOnly();   // pausa de verdade, dentro do motor
    await n.conferir();
    ok('sincronização pausada: a faixa diz que este PC não está baixando nada (com o motivo)',
      n.temFaixa() && /pausada/i.test(n.faixa()), n.faixa().slice(0, 120));
    ok('o botão "Resolver agora" leva para a tela da Nuvem', n.clicar('Resolver agora') && n.portaoAberto.indexOf('nuvem') >= 0, JSON.stringify(n.portaoAberto));
  }

  // ── 3) A LEITURA DA NUVEM FALHOU (a tela fica vazia) ────────────────────
  //    É assim que o dono vê o problema: a nuvem TEM os dados, a internet caiu
  //    no meio da leitura e a tela ficou vazia e muda. A faixa tem de mostrar a
  //    conta e consertar em 1 clique.
  {
    const nuvem = nuvemFingida({ falhasDeLeitura: 3 });
    nuvem.semear('clientes', 'c1', { id: 'c1', nome: 'Cliente Um' });
    nuvem.semear('clientes', 'c2', { id: 'c2', nome: 'Cliente Dois' });
    nuvem.semear('clientes', 'c3', { id: 'c3', nome: 'Cliente Três' });
    const n = abrir({ nuvem: nuvem });
    await n.esperar(150);
    await n.w.DIGICOPY_CLOUD_SYNC.tick('teste');
    await n.conferir();
    const vazio = (n.w.db.clientes || []).length;
    ok('o retrato do problema: a leitura falhou e a tela ficou com 0 cliente (a nuvem tem 3)', vazio === 0, 'aqui: ' + vazio);
    ok('a faixa mostra a CONTA (quanto tem aqui × quanto tem na nuvem)',
      n.temFaixa() && /nuvem tem mais registros/i.test(n.faixa()) && /clientes: 0 aqui × 3 na nuvem/.test(n.faixa()), n.faixa().slice(0, 150));
    ok('o botão "Baixar tudo de novo" está nessa faixa (conserto em 1 clique)',
      !!n.w.document.getElementById('v7015-bt-baixar'), n.faixa().slice(0, 80));
    nuvem.liberar();        // a internet voltou
    await n.clicar('Baixar tudo de novo');
    await n.esperar(500);   // o clique pede a confirmação do sistema e relê a nuvem
    const depois = (n.w.db.clientes || []).length;
    ok('depois do "Baixar tudo de novo" O DADO APARECE (3 clientes na tela)', depois === 3, 'aqui: ' + depois);
    ok('e a faixa desaparece sozinha (o problema acabou de ser resolvido)', !n.temFaixa(), n.faixa().slice(0, 90));
  }

  // ── 3b) A NUVEM NO LIMITE DO DIA ────────────────────────────────────────
  {
    const nuvem = nuvemFingida({ falhasDeLeitura: 3 });
    const cena = { nuvem: nuvem, estadoInicial: { cursor: 0, versions: {}, hashes: {}, known: {}, initialPull: true, lastOk: 0, paused: false, limiteAte: Date.now() + 3 * 3600 * 1000 } };
    const n = abrir(cena);
    await n.esperar(150);
    await n.w.DIGICOPY_CLOUD_SYNC.tick('teste');
    await n.conferir();
    ok('nuvem no limite do dia: a faixa avisa que nada se perdeu e a que horas ela volta',
      n.temFaixa() && /freio preventivo de gravações/i.test(n.faixa()) && /volta sozinho por volta das/.test(n.faixa()), n.faixa().slice(0, 140));
  }

  // ── 4) TUDO CERTO → sem faixa (nada de alarme falso) ─────────────────────
  {
    const nuvem = nuvemFingida();
    nuvem.semear('clientes', 'c1', { id: 'c1', nome: 'Cliente Um' });
    const n = abrir({ nuvem: nuvem });
    await n.esperar(150);
    await n.w.DIGICOPY_CLOUD_SYNC.tick('teste');
    await n.conferir();
    const aqui = (n.w.db.clientes || []).length;
    ok('nuvem e computador em dia: os dados vêm e a faixa NÃO aparece', aqui === 1 && !n.temFaixa(),
      'aqui: ' + aqui + ' | faixa: ' + n.faixa().slice(0, 60));
  }

  // ── 5) O CHECK-UP RECEBE O FREIO JUNTO (rodada 28) ──────────────────────
  //    A contagem da nuvem (apiStatus) passou a trazer o freio preventivo do
  //    /health: é o que permite saber, de fora, se a nuvem está recusando
  //    gravação — a manutenção não depende de ninguém abrir o sistema.
  {
    const nuvem = nuvemFingida();
    const n = abrir({ nuvem: nuvem });
    const semFreio = await n.w.DIGICOPY_CLOUD_SYNC.apiStatus();
    ok('sem disparo, a contagem da nuvem vem com o freio em paz (plano pago, teto de 1 milhão/dia)',
      !!semFreio && !!semFreio.freio && semFreio.freio.plano === 'pago' && semFreio.freio.disparouHoje === false && semFreio.freio.tetoDia === 1000000);

    freioDisparou = true;
    const comFreio = await n.w.DIGICOPY_CLOUD_SYNC.apiStatus();
    ok('com o freio disparado, a contagem diz que disparou HOJE e o motivo',
      comFreio.freio.disparouHoje === true && comFreio.freio.motivo === 'dia');

    // o check-up entra só nesta janela (não mexe no resto do teste)
    try { n.w.eval(CHECKUP); } catch (e) { /* se a tela não montar aqui, o assert cobra */ }
    const resumo = (typeof n.w.dcCheckupNuvemResumo === 'function')
      ? n.w.dcCheckupNuvemResumo(n.w.DIGICOPY_CLOUD_SYNC.estadoDetalhado(), comFreio) : '';
    ok('e o resumo que ele copia leva essa linha (é a prova que chega para a manutenção)',
      /Freio preventivo da nuvem: DISPAROU HOJE/.test(resumo) && /plano pago/.test(resumo));
    freioDisparou = false;
  }

  // ── 6) A CONFERÊNCIA NÃO PODE PESAR (base grande, como a do dono) ───────
  //    A faixa confere a cada 15 s. O `info()` do motor tinha um campo (`pending`)
  //    que percorria a base inteira e calculava o hash de cada registro: 223 ms numa
  //    base de 76 mil registros — congelaria a tela de 15 em 15 segundos. Ele virou
  //    sob demanda (getter). Este teste trava o ganho.
  {
    const nuvem = nuvemFingida();
    const n = abrir({ nuvem: nuvem });
    const t0 = Date.now();
    for (let i = 0; i < 6000; i++) n.w.db.clientes.push({ id: 'c' + i, nome: 'Cliente ' + i, obs: 'texto' });
    const info = n.w.DIGICOPY_CLOUD_SYNC.info();
    const ms = Date.now() - t0;
    ok('a base de 6.000 registros foi montada e o info() respondeu rápido (contagem sob demanda)',
      ms < 250 && typeof info.outbox === 'number', ms + ' ms');
    const pend = n.w.DIGICOPY_CLOUD_SYNC.info().pending;
    ok('e o número de pendentes continua disponível para quem pedir (nada foi perdido na mudança)',
      typeof pend === 'number' && pend >= 0, String(pend));
  }

  console.log('\nRESULTADO: ' + passou + ' verificações passaram — quando o dado não aparece, o sistema explica e conserta.');
  process.exit(0);
})();
