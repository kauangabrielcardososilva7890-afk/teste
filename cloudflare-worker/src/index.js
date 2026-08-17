// DIGICOPY Cloud API — base inicial segura para Cloudflare Workers.
// Nesta etapa publica somente diagnóstico. Rotas de dados e autenticação
// serão habilitadas depois que o D1 estiver criado e vinculado.

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer'
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      let database = 'not-bound';
      if (env.DB) {
        try {
          await env.DB.prepare('SELECT 1 AS ok').first();
          database = 'ok';
        } catch (_error) {
          database = 'error';
        }
      }

      return json({
        ok: true,
        service: 'digicopy-sync-api',
        version: '0.1.0',
        database,
        message: database === 'ok'
          ? 'API e banco D1 disponíveis.'
          : 'API disponível; banco D1 ainda não vinculado.'
      });
    }

    return json({ ok: false, error: 'NOT_FOUND' }, 404);
  }
};
