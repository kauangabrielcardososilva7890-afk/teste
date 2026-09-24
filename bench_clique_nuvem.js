/* ============================================================================
   BANCADA — "o clique não pode travar" (v7.0.12)
   ----------------------------------------------------------------------------
   O que esta bancada mede, e por quê:
     A correção do "dado que some" faz a varredura (que enfileira a mudança)
     rodar NO MOMENTO da gravação, em vez de 900 ms depois. Isso é o certo em
     segurança — mas se a base for grande, fazer isso no meio do clique trava a
     tela do dono. Então a regra é: se a varredura demora até 60 ms, roda na
     hora; se demora mais, vai para o FIM do clique (0 ms) e o fechamento da
     janela força a varredura de qualquer jeito.

     Esta bancada prova as duas pontas:
       base de 2.000 registros  -> o clique roda a varredura junto (e é rápido);
       base de 40.000 registros -> o clique devolve em menos de 1 ms e a
                                   varredura acontece no fim do clique, com a
                                   mudança já DENTRO da fila gravada no navegador.

   Como rodar (jsdom fora do repositório, como os outros testes):
     cd /tmp/jsdomenv && npm install jsdom      (só na primeira vez)
     NODE_PATH=/tmp/jsdomenv/node_modules node bench_clique_nuvem.js

   Não faz parte de `test_runner.js`: leva ~1 minuto (a base grande é pesada de
   montar de propósito). O teste que entra na suíte é `test_nuvem_nao_perde.js`.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const FONTE = fs.readFileSync(path.join(__dirname, 'cloudflare_data_sync_patch.js'), 'utf8');
const TETO_MS_CLIQUE = 50;   // acima disto, consideramos que o clique travou

// ── nuvem fingida: aceita as mudanças e devolve "ok" (é só para a fila escoar) ─
function montarNuvemFingida() {
  let cursor = 0;
  return {
    token: () => 'token-de-teste',
    deviceInfo: () => null,
    api: async (caminho, opcoes) => {
      if (caminho.indexOf('/v1/changes?cursor=') === 0) {
        return { changes: [], nextCursor: cursor, hasMore: false };
      }
      if (caminho === '/v1/changes' && opcoes && opcoes.method === 'POST') {
        const corpo = JSON.parse(opcoes.body || '{}');
        const mutacoes = corpo.mutations || [];
        cursor += mutacoes.length;
        return { results: mutacoes.map((m, i) => ({ index: i, ok: true, version: 1 })) };
      }
      return {};
    }
  };
}

// ── a base do dono, de mentira, com o tamanho pedido ─────────────────────────
function montarBase(janela, total) {
  const baralho = Object.keys({ clientes: 0, produtos: 0, vendas: 0, contasReceber: 0, os: 0 });
  const db = { config: {}, _seq: {} };
  baralho.forEach(function (k) { db[k] = []; });
  for (let i = 0; i < total; i++) {
    const k = baralho[i % baralho.length];
    db[k].push({
      id: k + i,
      nome: 'Registro ' + i,
      valor: i * 1.5,
      status: i % 2 ? 'aberto' : 'pago',
      obs: 'texto de tamanho médio para o registro ' + i
    });
  }
  janela.db = db;
}

async function cenario(tamanho) {
  const dom = new JSDOM('<!DOCTYPE html><body><button id="btn-nuvem"><i></i></button></body>',
    { url: 'http://localhost/', runScripts: 'outside-only' });
  const janela = dom.window;
  janela.localStorage.setItem('digicopy_cf_token_v1', 'token-de-teste');
  janela.DIGICOPY_CLOUD = montarNuvemFingida();
  janela.DIGICOPY_SO_NUVEM = true;
  janela.getSession = () => null;
  janela.toast = function () {};
  janela.saveDB = function () {};        // a gravação no PC (o motor embrulha este)
  janela.saveDBAgora = function () {};
  montarBase(janela, tamanho);

  // relógio falso para os temporizadores (determinístico) e Date.now() andando de
  // verdade (senão a própria medição da varredura daria sempre zero)
  let relogio = 1700000000000;
  const fila = [];
  let id = 1;
  const base = process.hrtime.bigint();
  const realMs = () => Number(process.hrtime.bigint() - base) / 1e6;
  janela.setTimeout = (fn, ms) => { const i = id++; fila.push({ i, q: relogio + (Number(ms) || 0), fn }); return i; };
  janela.clearTimeout = (i) => { const k = fila.findIndex((x) => x.i === i); if (k >= 0) fila.splice(k, 1); };
  janela.setInterval = () => 0;
  janela.Date = class extends Date {
    constructor(...a) { super(...(a.length ? a : [relogio + realMs()])); }
    static now() { return relogio + realMs(); }
  };

  janela.eval(FONTE);
  const motor = janela.DIGICOPY_CLOUD_SYNC;
  const respirar = async () => { for (let i = 0; i < 3; i++) await new Promise((r) => setImmediate(r)); };

  // deixa a base assentar: roda os temporizadores que vencem até +60 s (com teto)
  for (let passo = 0; passo < 1200; passo++) {
    const lista = fila.slice().sort((a, b) => a.q - b.q);
    if (!lista.length || lista[0].q > relogio + 60000) break;
    const t = lista[0];
    relogio = Math.max(relogio, t.q);
    fila.splice(fila.findIndex((x) => x.i === t.i), 1);
    try { t.fn(); } catch (e) {}
    await respirar();
  }

  // A PROVA: o que o clique custa (com a base já assentada, como no uso de verdade)
  const custos = [];
  for (let n = 0; n < 4; n++) {
    janela.db.clientes.push({ id: 'novo' + n, nome: 'Cliente novo ' + n });
    const t0 = process.hrtime.bigint();
    janela.saveDB();
    custos.push(Number(process.hrtime.bigint() - t0) / 1e6);
    // fim do clique: roda o que ficou marcado para agora
    for (let passo = 0; passo < 60; passo++) {
      const lista = fila.slice().sort((a, b) => a.q - b.q);
      if (!lista.length || lista[0].q > relogio + 5) break;
      const t = lista[0];
      relogio = Math.max(relogio, t.q);
      fila.splice(fila.findIndex((x) => x.i === t.i), 1);
      try { t.fn(); } catch (e) {}
      await respirar();
    }
  }
  // e ELE FECHA a janela: é aqui que nada pode ficar de fora
  janela.dispatchEvent(new janela.Event('pagehide'));
  await respirar();
  const info = motor.info();
  const filaSalva = (() => {
    try { return JSON.parse(janela.localStorage.getItem('digicopy_cf_sync_outbox_v1') || '[]'); }
    catch (e) { return []; }
  })();
  const naFilaGravada = filaSalva.filter((x) => x && String(x.key).indexOf('clientes|novo') === 0).length;
  const maior = Math.max(...custos);
  const custoMedio = custos.reduce((a, b) => a + b, 0) / custos.length;

  try { janela.close(); } catch (e) {}

  return {
    tamanho, custoMedio, maior, varredura: info.varreduraMs,
    naFilaGravada, outbox: info.outbox, filaGravada: info.filaGravada
  };
}

(async function () {
  console.log('== O CLIQUE NÃO PODE TRAVAR (bancada da v7.0.12) ==');
  let falhas = 0;
  const cenas = [[2000, 'base pequena'], [40000, 'base grande (maior que a do dono: ~76 mil no banco de prova)']];
  for (const [tamanho, rotulo] of cenas) {
    const t0 = process.hrtime.bigint();
    const r = await cenario(tamanho);
    const segundos = (Number(process.hrtime.bigint() - t0) / 1e9).toFixed(1);
    console.log('\n-- ' + rotulo + ': ' + r.tamanho.toLocaleString('pt-BR') + ' registros (bancada levou ' + segundos + ' s) --');
    console.log('   custo do clique .... ' + r.custoMedio.toFixed(1) + ' ms em média (pior: ' + r.maior.toFixed(1) + ' ms)');
    console.log('   a varredura em si ... ' + r.varredura + ' ms  ' + (r.varredura <= 60 ? '(leve: roda junto do clique)' : '(pesada: vai para o fim do clique)'));
    console.log('   mudanças na fila .... ' + r.outbox + '  |  gravadas no navegador: ' + r.naFilaGravada + ' de 4');
    const okClique = r.maior <= TETO_MS_CLIQUE;
    const okFila = r.naFilaGravada === 4;
    console.log('   ' + (okClique ? '✔' : '✘') + ' o clique devolve rápido (até ' + TETO_MS_CLIQUE + ' ms)');
    console.log('   ' + (okFila ? '✔' : '✘') + ' as 4 mudanças ficaram guardadas na fila depois de fechar a janela');
    if (!okClique || !okFila) falhas++;
  }
  console.log('\nRESULTADO: ' + (falhas ? falhas + ' cenário(s) com problema' : 'nenhum clique travado e nada ficou só na memória'));
  process.exit(falhas ? 1 : 0);
})();
