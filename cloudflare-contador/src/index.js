// ═══════════════════════════════════════════════════════════════════════════
// DIGICOPY CONTADOR-USO (worker separado) — v5.23.4 (sem cronômetro: mede sob demanda)
// Ideia do dono: um "index separado" que ele implanta UMA VEZ. Ele lê o
// medidor OFICIAL da Cloudflare (com um token só de leitura guardado como
// segredo DESTE worker) e grava o resultado no próprio D1 (tabela uso_real).
// A partir daí, todos os PCs leem o uso junto com os dados normais da nuvem —
// sem token no sistema, sem senha espalhada, sem ninguém fazer mais nada.
// ═══════════════════════════════════════════════════════════════════════════

const NOME_BANCO = (env) => (env.D1_NOME && String(env.D1_NOME).trim()) || 'digicopy-erp';

function hojeUTC() { return new Date().toISOString().slice(0, 10); }

async function garantirTabelaUsoReal(env) {
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS uso_real (dia TEXT PRIMARY KEY, leituras INTEGER NOT NULL DEFAULT 0, escritas INTEGER NOT NULL DEFAULT 0, medido_em TEXT)'
  ).run();
}

async function acharDatabaseId(env) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/d1/database`, {
    headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, 'content-type': 'application/json' },
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || !j.success) throw new Error('LISTA_D1_FALHOU: ' + (j && j.errors && j.errors[0] ? (j.errors[0].code + ' ' + j.errors[0].message) : r.status));
  const alvo = (j.result || []).find((d) => d.name === NOME_BANCO(env));
  if (!alvo) throw new Error('BANCO_NAO_ACHOU: ' + NOME_BANCO(env));
  return alvo.uuid;
}

async function medirUsoOficial(env, databaseId) {
  const hoje = hojeUTC();
  const query = `query Uso($acc: AccountTag!, $db: String!, $ini: Date!, $fim: Date!) {
    viewer { accounts(filter: { accountTag: $acc }) {
      d1AnalyticsAdaptiveGroups(limit: 5, filter: { databaseId: $db, date_geq: $ini, date_leq: $fim }) {
        sum { rowsRead rowsWritten }
      }
    } }
  }`;
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: { acc: env.ACCOUNT_ID, db: databaseId, ini: hoje, fim: hoje } }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || (j && j.errors && j.errors.length)) {
    throw new Error('MEDIDA_FALHOU: ' + JSON.stringify(j && j.errors ? j.errors : r.status).slice(0, 200));
  }
  const grupos = (((j || {}).data || {}).viewer || {}).accounts?.[0]?.d1AnalyticsAdaptiveGroups || [];
  const soma = grupos[0] && grupos[0].sum ? grupos[0].sum : { rowsRead: 0, rowsWritten: 0 };
  return { leituras: Number(soma.rowsRead) || 0, escritas: Number(soma.rowsWritten) || 0 };
}

async function rodarMedida(env) {
  if (!env.ACCOUNT_ID || /COLE_AQUI/.test(String(env.ACCOUNT_ID))) throw new Error('CONFIGURE_ACCOUNT_ID');
  if (!env.CF_API_TOKEN) throw new Error('CONFIGURE_CF_API_TOKEN');
  await garantirTabelaUsoReal(env);
  const dbId = await acharDatabaseId(env);
  const uso = await medirUsoOficial(env, dbId);
  await env.DB.prepare(
    `INSERT INTO uso_real(dia, leituras, escritas, medido_em) VALUES (?, ?, ?, ?)
       ON CONFLICT(dia) DO UPDATE SET leituras = ?, escritas = ?, medido_em = ?`
  ).bind(hojeUTC(), uso.leituras, uso.escritas, new Date().toISOString(),
         uso.leituras, uso.escritas, new Date().toISOString()).run();
  return { dia: hojeUTC(), leituras: uso.leituras, escritas: uso.escritas };
}

export default {
  async scheduled(_event, env, ctx) {
    const p = rodarMedida(env).catch((e) => console.error('CONTADOR_USO_FALHOU', e));
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(p);
    else await p;
  },

  // GET https://digicopy-contador-uso.<seu-sub>.workers.dev/v1/medir  → mede na hora
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/v1/medir') {
      return new Response(JSON.stringify({ ok: true, uso: 'chame GET /v1/medir para medir agora; o cron mede a cada 15 min.' }), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    try {
      const uso = await rodarMedida(env);
      return new Response(JSON.stringify({ ok: true, uso }, null, 2), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, erro: String(e && e.message || e) }), {
        status: 500, headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
  },
};
