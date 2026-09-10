// DIGICOPY Cloud API — sincronização local-first em Cloudflare Workers + D1.
// Nenhuma rota substitui uma base inteira. Alterações são incrementais,
// versionadas, idempotentes e atribuídas a um aparelho autenticado.

const API_VERSION = '0.4.7';
const MAX_BODY_BYTES = 900_000;
// Carimbo deste código — GET /health sempre diz qual versão da nuvem está no ar.
const WORKER_VERSION = '5.24.5';

const MAX_MUTATIONS = 100;
const MAX_CHANGE_LIMIT = 500;
const ENTITY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, x-setup-secret, x-digicopy-versao, x-digicopy-usuario-login, x-digicopy-usuario-prova',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-max-age': '86400'
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function cleanText(value, max = 120) {
  const text = String(value == null ? '' : value).trim();
  if (!text || text.length > max) return null;
  return text;
}

function randomToken(prefix = '') {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const value = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return prefix + value;
}

async function sha256(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

async function sameSecret(left, right) {
  if (!left || !right) return false;
  const [a, b] = await Promise.all([sha256(left), sha256(right)]);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function readBody(request) {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new ApiError(413, 'BODY_TOO_LARGE', 'Conteúdo maior que o permitido.');
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (_error) {
    throw new ApiError(400, 'INVALID_JSON', 'JSON inválido.');
  }
}

function bearer(request) {
  const value = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match ? match[1].trim() : null;
}

async function authenticate(request, env) {
  const token = bearer(request);
  if (!token) throw new ApiError(401, 'AUTH_REQUIRED', 'Aparelho não autenticado.');
  const tokenHash = await sha256(token);
  const device = await env.DB.prepare(
    `SELECT id, name, role, created_at AS createdAt, last_seen_at AS lastSeenAt
       FROM devices WHERE token_hash = ? AND revoked_at IS NULL LIMIT 1`
  ).bind(tokenHash).first();
  if (!device) throw new ApiError(401, 'INVALID_TOKEN', 'Token de aparelho inválido ou revogado.');

  const now = Date.now();
  if (!device.lastSeenAt || now - Number(device.lastSeenAt) > 3_600_000) {
    await env.DB.prepare('UPDATE devices SET last_seen_at = ? WHERE id = ?')
      .bind(now, device.id).run();
    device.lastSeenAt = now;
  }
  return device;
}

async function requireAdmin(request, env) {
  const device = await authenticate(request, env);
  if (device.role !== 'admin') {
    throw new ApiError(403, 'ADMIN_REQUIRED', 'Somente o aparelho administrador pode realizar esta ação.');
  }
  return device;
}

// v5.24.2 — BACKUPS dependem do USUÁRIO logado, não do aparelho (pedido do dono:
// "qualquer PC pode baixar, depende apenas do usuário"). O aparelho só precisa
// estar autorizado na nuvem; quem manda é o cargo: SOMENTE o perfil Admin —
// v5.24.2: o dono pediu que o cargo Dono NÃO veja mais os menus de Nuvem e de
// Backup. A prova é login + sha256(login|senha) conferidos contra o cadastro
// sincronizado na nuvem.
async function requireUsuarioAdmin(request, env) {
  await authenticate(request, env);
  const login = cleanText(request.headers.get('x-digicopy-usuario-login') || '', 80).toLowerCase();
  const prova = String(request.headers.get('x-digicopy-usuario-prova') || '');
  if (!login || !prova) {
    throw new ApiError(403, 'USUARIO_ADMIN_REQUERIDO', 'Backups dependem do usuário: entre no sistema com um usuário de cargo Admin.');
  }
  const rows = await env.DB.prepare(
    "SELECT data_json FROM records WHERE entity = 'usuarios' AND deleted_at IS NULL"
  ).all();
  for (const row of (rows.results || [])) {
    let data = null;
    try { data = JSON.parse(row.data_json); } catch (e) {}
    if (!data) continue;
    if (String(data.login || '').trim().toLowerCase() !== login) continue;
    if (data.ativo === false) continue;
    const cargo = String(data.perfil || data.cargo || '').trim().toLowerCase();
    if (cargo !== 'admin') continue;
    const esperado = await sha256(login + '|' + String(data.senha || ''));
    if (esperado === prova) return { login };
  }
  throw new ApiError(403, 'USUARIO_ADMIN_REQUERIDO', 'Somente usuários com cargo Admin podem ver, baixar ou apagar backups — em qualquer computador.');
}

function handlePix(url) {
  const codigo = url.searchParams.get('c') || '';
  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pagamento Pix — DIGICOPY</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;background:#eef1f8;color:#111;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.card{background:#fff;border-radius:20px;box-shadow:0 12px 40px rgba(10,30,138,.14);max-width:430px;width:100%;overflow:hidden}
.topo{background:#0a1e8a;color:#fff;padding:18px 22px}
.topo h1{font-size:17px}
.corpo{padding:22px;text-align:center}
#qr{width:230px;height:230px;margin:8px auto 4px;display:block;border:1px solid #dfe3ee;border-radius:14px;padding:6px}
.passo{font-size:13px;color:#444;line-height:1.5}
#codigo{width:100%;margin-top:14px;border:1px solid #c9ceef;border-radius:12px;padding:10px;font-size:10.5px;font-family:monospace;word-break:break-all;background:#f7f8fd;resize:none}
#btn{width:100%;margin-top:10px;height:48px;border:0;border-radius:12px;background:#0a1e8a;color:#fff;font-weight:700;font-size:14.5px;cursor:pointer}
.dica{margin-top:12px;font-size:11px;color:#888}
.erro{padding:34px 22px;text-align:center;font-size:14px;color:#a33}
</style></head><body>
<div class="card"><div class="topo"><h1>Pagamento via Pix</h1><p style="font-size:11.5px;opacity:.75;margin-top:2px">Rápido, seguro e na hora</p></div>
<div class="corpo" id="area">
<p class="passo">1 Abra o aplicativo do seu banco<br>2 Escolha <b>Pix → Ler QR Code</b><br>3 Confira e confirme</p>
<img id="qr" alt="QR Code Pix">
<p class="passo" style="margin-top:10px">Ou copie o código e cole no banco:</p>
<textarea id="codigo" rows="5" readonly onclick="this.select()"></textarea>
<button id="btn">Copiar código Pix</button>
<p class="dica">Pagamento identificado pela DIGICOPY.</p>
</div></div>
<script>
(function(){
  var codigo=${JSON.stringify(codigo)};
  if(!codigo || codigo.indexOf('000201')!==0 || codigo.length>1024 || codigo.indexOf('br.gov.bcb.pix')<0){
    document.getElementById('area').innerHTML='<p class="erro">Link de pagamento inválido ou incompleto.<br>Peça a notinha atualizada para a loja.</p>';
    return;
  }
  document.getElementById('codigo').value=codigo;
  document.getElementById('qr').src='https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=6&data='+encodeURIComponent(codigo);
  var btn=document.getElementById('btn');
  btn.onclick=function(){
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(codigo);
    btn.textContent='Copiado! Cole no app do banco';
  };
})();
</script></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'access-control-allow-origin': '*'
    }
  });
}

async function handleHealth(env) {
  let database = 'not-bound';
  let schemaVersion = null;
  if (env.DB) {
    try {
      await env.DB.prepare('SELECT 1 AS ok').first();
      database = 'ok';
      try {
        const row = await env.DB.prepare(
          "SELECT value FROM system_meta WHERE key = 'schema_version' LIMIT 1"
        ).first();
        schemaVersion = row ? row.value : null;
      } catch (_schemaError) {
        schemaVersion = null;
      }
    } catch (_error) {
      database = 'error';
    }
  }
  return json({
    ok: true,
    service: 'digicopy-sync-api',
    version: API_VERSION,
    database,
    schemaVersion,
    setupConfigured: !!env.SETUP_SECRET,
    versao: WORKER_VERSION,
    ready: database === 'ok' && schemaVersion === '2' && !!env.SETUP_SECRET,
    message: database === 'ok'
      ? (schemaVersion ? 'API e banco D1 disponíveis.' : 'Banco vinculado; migração pendente.')
      : 'API disponível; banco D1 ainda não vinculado.'
  });
}

async function handleSetup(request, env) {
  if (!env.SETUP_SECRET) {
    throw new ApiError(503, 'SETUP_NOT_CONFIGURED', 'Segredo de ativação ainda não configurado.');
  }
  const supplied = request.headers.get('x-setup-secret');
  if (!(await sameSecret(supplied, env.SETUP_SECRET))) {
    throw new ApiError(403, 'INVALID_SETUP_SECRET', 'Segredo de ativação incorreto.');
  }
  const existing = await env.DB.prepare('SELECT COUNT(*) AS total FROM devices').first();
  if (Number(existing && existing.total) > 0) {
    throw new ApiError(409, 'ALREADY_INITIALIZED', 'A nuvem já possui um aparelho administrador.');
  }
  const body = await readBody(request);
  const name = cleanText(body.deviceName, 80);
  if (!name) throw new ApiError(400, 'DEVICE_NAME_REQUIRED', 'Informe o nome do aparelho.');

  const id = crypto.randomUUID();
  const token = randomToken('dcp_');
  const tokenHash = await sha256(token);
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO devices(id, name, token_hash, role, created_at, last_seen_at)
       VALUES (?, ?, ?, 'admin', ?, ?)`
    ).bind(id, name, tokenHash, now, now),
    env.DB.prepare(
      `INSERT INTO device_events(event_type, device_id, actor_id, details_json, created_at)
       VALUES ('initial_setup', ?, ?, ?, ?)`
    ).bind(id, id, JSON.stringify({ name }), now)
  ]);

  return json({
    ok: true,
    activation: 'initial',
    device: { id, name, role: 'admin' },
    token,
    warning: 'Este token é exibido uma única vez. Guarde-o somente no aparelho autorizado.'
  }, 201);
}

async function handleCreateInvite(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  const minutes = Math.min(60, Math.max(5, Number(body.minutes) || 15));
  const role = body.role === 'admin' ? 'admin' : 'device';
  const code = randomToken('join_');
  const codeHash = await sha256(code);
  const now = Date.now();
  const expiresAt = now + minutes * 60_000;
  await env.DB.prepare(
    `INSERT INTO enrollment_codes(code_hash, created_by, expires_at, uses_left, created_at, role)
     VALUES (?, ?, ?, 1, ?, ?)`
  ).bind(codeHash, admin.id, expiresAt, now, role).run();
  return json({ ok: true, code, expiresAt, uses: 1, role }, 201);
}

async function handleEnroll(request, env) {
  const body = await readBody(request);
  const code = cleanText(body.code, 200);
  const name = cleanText(body.deviceName, 80);
  if (!code || !name) {
    throw new ApiError(400, 'ENROLL_DATA_REQUIRED', 'Informe o código e o nome do aparelho.');
  }
  const codeHash = await sha256(code);
  const now = Date.now();
  const invitation = await env.DB.prepare(
    `SELECT role, created_by FROM enrollment_codes
     WHERE code_hash = ? AND uses_left > 0 AND expires_at > ? LIMIT 1`
  ).bind(codeHash, now).first();
  if (!invitation) {
    throw new ApiError(403, 'INVALID_ENROLL_CODE', 'Código inválido, expirado ou já utilizado.');
  }
  const claim = await env.DB.prepare(
    `UPDATE enrollment_codes SET uses_left = uses_left - 1
     WHERE code_hash = ? AND uses_left > 0 AND expires_at > ?`
  ).bind(codeHash, now).run();
  if (!claim.meta || Number(claim.meta.changes) !== 1) {
    throw new ApiError(403, 'INVALID_ENROLL_CODE', 'Código inválido, expirado ou já utilizado.');
  }

  const role = invitation.role === 'admin' ? 'admin' : 'device';
  const id = crypto.randomUUID();
  const token = randomToken('dcp_');
  const tokenHash = await sha256(token);
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO devices(id, name, token_hash, role, created_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(id, name, tokenHash, role, now, now),
      env.DB.prepare('DELETE FROM enrollment_codes WHERE code_hash = ? OR expires_at <= ?')
        .bind(codeHash, now),
      env.DB.prepare(
        `INSERT INTO device_events(event_type, device_id, actor_id, details_json, created_at)
         VALUES ('device_enrolled', ?, ?, ?, ?)`
      ).bind(id, invitation.created_by, JSON.stringify({ name, role }), now)
    ]);
  } catch (error) {
    throw new ApiError(500, 'ENROLL_FAILED', 'Não foi possível autorizar o aparelho. Gere outro código.');
  }
  return json({ ok: true, activation: 'invite', device: { id, name, role }, token }, 201);
}

async function handleRecovery(request, env) {
  if (!env.SETUP_SECRET) {
    throw new ApiError(503, 'RECOVERY_NOT_CONFIGURED', 'Segredo de recuperação não configurado.');
  }
  const supplied = request.headers.get('x-setup-secret');
  if (!(await sameSecret(supplied, env.SETUP_SECRET))) {
    throw new ApiError(403, 'INVALID_SETUP_SECRET', 'Segredo de recuperação incorreto.');
  }
  const body = await readBody(request);
  const name = cleanText(body.deviceName, 80);
  if (!name) throw new ApiError(400, 'DEVICE_NAME_REQUIRED', 'Informe o nome do aparelho.');

  const id = crypto.randomUUID();
  const token = randomToken('dcp_');
  const tokenHash = await sha256(token);
  const now = Date.now();
  const recent = await env.DB.prepare(
    `SELECT created_at FROM device_events
     WHERE event_type = 'admin_recovery' ORDER BY id DESC LIMIT 1`
  ).first();
  if (recent && now - Number(recent.created_at) < 600_000) {
    throw new ApiError(429, 'RECOVERY_COOLDOWN', 'Aguarde 10 minutos antes de outra recuperação.');
  }

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO devices(id, name, token_hash, role, created_at, last_seen_at)
       VALUES (?, ?, ?, 'admin', ?, ?)`
    ).bind(id, name, tokenHash, now, now),
    env.DB.prepare(
      `INSERT INTO device_events(event_type, device_id, actor_id, details_json, created_at)
       VALUES ('admin_recovery', ?, NULL, ?, ?)`
    ).bind(id, JSON.stringify({ name }), now)
  ]);
  return json({
    ok: true,
    recovered: true,
    activation: 'recovery',
    device: { id, name, role: 'admin' },
    token,
    warning: 'Recuperação concluída. Troque o SETUP_SECRET se ela não foi planejada.'
  }, 201);
}

function parseDataJson(value) {
  if (value == null) return null;
  try { return JSON.parse(value); } catch (_error) { return null; }
}

function publicRecord(row) {
  if (!row) return null;
  return {
    entity: row.entity,
    recordId: row.record_id,
    data: parseDataJson(row.data_json),
    version: Number(row.version),
    updatedAt: Number(row.updated_at),
    deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
    updatedBy: row.updated_by
  };
}

function activityLabel(dataJson, recordId, entity) {
  if (entity === 'config') return 'Configuração';
  const data = parseDataJson(dataJson) || {};
  const raw = data.nome || data.fantasia || data.numero || data.login || data.descricao || data.sku || data.modelo || '';
  const text = String(raw).trim();
  return text ? text.slice(0, 80) : String(recordId || '');
}

async function applyMutation(env, device, mutation) {
  const mutationId = cleanText(mutation && mutation.mutationId, 120);
  const entity = cleanText(mutation && mutation.entity, 64);
  const recordId = cleanText(mutation && mutation.recordId, 160);
  const operation = mutation && mutation.operation;
  const baseVersion = Number(mutation && mutation.baseVersion);
  if (!mutationId || !entity || !ENTITY_RE.test(entity) || !recordId ||
      !['upsert', 'delete'].includes(operation) || !Number.isInteger(baseVersion) || baseVersion < 0) {
    throw new ApiError(400, 'INVALID_MUTATION', 'Alteração inválida.');
  }

  const duplicate = await env.DB.prepare(
    `SELECT seq, entity, record_id, operation, data_json, version, device_id, created_at
       FROM changes WHERE mutation_id = ? LIMIT 1`
  ).bind(mutationId).first();
  if (duplicate) {
    return { ok: true, duplicate: true, seq: Number(duplicate.seq), version: Number(duplicate.version) };
  }

  const current = await env.DB.prepare(
    'SELECT * FROM records WHERE entity = ? AND record_id = ? LIMIT 1'
  ).bind(entity, recordId).first();
  const currentVersion = current ? Number(current.version) : 0;
  if (currentVersion !== baseVersion) {
    return { ok: false, conflict: true, current: publicRecord(current) };
  }

  let dataJson = null;
  if (operation === 'upsert') {
    if (!mutation.data || typeof mutation.data !== 'object' || Array.isArray(mutation.data)) {
      throw new ApiError(400, 'INVALID_RECORD_DATA', 'O registro precisa ser um objeto JSON.');
    }
    dataJson = JSON.stringify(mutation.data);
    if (new TextEncoder().encode(dataJson).byteLength > 700_000) {
      throw new ApiError(413, 'RECORD_TOO_LARGE', 'Registro maior que o permitido.');
    }
  } else if (current && current.data_json) {
    // Exclusão reversível: mantém a última versão no D1. A listagem normal não
    // a considera ativa, mas um administrador poderá restaurá-la.
    dataJson = current.data_json;
  }

  // v5.24.4 — ECONOMIA DA COTA GRÁTIS (100 mil escritas/dia): se o registro
  // já está IDÊNTICO na nuvem, não regrava. Replays/reconexões de PCs antes
  // gastavam 2 escritas por registro sem mudar nada — foi o que estourou a
  // cota e derrubou o backup ("daily row write limit").
  if (current && operation === 'upsert' && current.data_json === dataJson && current.deleted_at === null) {
    return { ok: true, duplicate: true, noop: true, version: currentVersion };
  }
  if (current && operation === 'delete' && current.deleted_at !== null) {
    return { ok: true, duplicate: true, noop: true, version: currentVersion };
  }

  const now = Date.now();
  const newVersion = currentVersion + 1;
  let recordStatement;
  if (!current) {
    recordStatement = env.DB.prepare(
      `INSERT OR IGNORE INTO records
       (entity, record_id, data_json, version, updated_at, deleted_at, updated_by)
       VALUES (?, ?, ?, 1, ?, ?, ?)`
    ).bind(entity, recordId, dataJson, now, operation === 'delete' ? now : null, device.id);
  } else {
    recordStatement = env.DB.prepare(
      `UPDATE records SET data_json = ?, version = version + 1, updated_at = ?,
       deleted_at = ?, updated_by = ?
       WHERE entity = ? AND record_id = ? AND version = ?`
    ).bind(dataJson, now, operation === 'delete' ? now : null, device.id,
      entity, recordId, baseVersion);
  }

  // O registro e seu evento são gravados na mesma transação D1. O SELECT
  // impede criar um evento se a versão condicional perdeu uma concorrência.
  const changeStatement = env.DB.prepare(
    `INSERT INTO changes
     (mutation_id, entity, record_id, operation, data_json, version, device_id, created_at)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?
     WHERE EXISTS (
       SELECT 1 FROM records
       WHERE entity = ? AND record_id = ? AND version = ?
         AND updated_at = ? AND updated_by = ?
     )`
  ).bind(mutationId, entity, recordId, operation, dataJson, newVersion, device.id, now,
    entity, recordId, newVersion, now, device.id);

  let transaction;
  try {
    transaction = await env.DB.batch([recordStatement, changeStatement]);
  } catch (error) {
    // Uma repetição simultânea pode bater no UNIQUE de mutation_id. Confirma
    // a idempotência antes de tratar como falha interna.
    const racedDuplicate = await env.DB.prepare(
      'SELECT seq, version FROM changes WHERE mutation_id = ? LIMIT 1'
    ).bind(mutationId).first();
    if (racedDuplicate) {
      return { ok: true, duplicate: true, seq: Number(racedDuplicate.seq), version: Number(racedDuplicate.version) };
    }
    throw new ApiError(500, 'ATOMIC_WRITE_FAILED', 'A alteração não foi gravada; será seguro tentar novamente.');
  }

  const wroteRecord = transaction[0] && transaction[0].meta && Number(transaction[0].meta.changes) === 1;
  const wroteChange = transaction[1] && transaction[1].meta && Number(transaction[1].meta.changes) === 1;
  if (!wroteRecord || !wroteChange) {
    const latest = await env.DB.prepare(
      'SELECT * FROM records WHERE entity = ? AND record_id = ? LIMIT 1'
    ).bind(entity, recordId).first();
    return { ok: false, conflict: true, current: publicRecord(latest) };
  }
  return {
    ok: true,
    duplicate: false,
    seq: Number(transaction[1].meta.last_row_id),
    version: newVersion
  };
}

async function handlePush(request, env, ctx) {
  const device = await authenticate(request, env);
  try{ await checarTrocaDeVersao(request, env, ctx); }catch(e){ console.error('BACKUP_VERSAO_CHECAR_FALHOU', e); }
  const body = await readBody(request);
  const mutations = body.mutations;
  somarUso(env, Array.isArray(mutations) ? Math.max(1, mutations.length) : 1, 0, ctx);
  if (!Array.isArray(mutations) || mutations.length < 1 || mutations.length > MAX_MUTATIONS) {
    throw new ApiError(400, 'INVALID_MUTATION_BATCH', `Envie de 1 a ${MAX_MUTATIONS} alterações.`);
  }
  // FREIO PREVENTIVO DA COTA (v5.24.5) — a ordem do dono é "nunca deixar
  // estourar". O plano grátis corta TUDO no teto de 100 mil escritas/dia
  // e só volta na virada (21h em Brasília). Aqui a própria nuvem para de
  // aceitar gravação um pouco ANTES do teto (folga de segurança) e devolve
  // uma pausa amigável: o app guarda as mudanças no PC e reenvia sozinho.
  // A mensagem carrega as palavras "daily row write limit" de propósito:
  // é assim que o app reconhece a pausa e mostra o aviso em português.
  const LIMITE_ESCRITA_DIA = 95000;
  try {
    const usoAgora = await env.DB.prepare('SELECT escritas AS w FROM uso_diario WHERE dia = ?').bind(hojeUTC()).first();
    const escritasAteAgora = Number((usoAgora && usoAgora.w) || 0);
    const estimativaDesteLote = mutations.length * 2; // cada alteração grava o registro + o evento
    if (escritasAteAgora + estimativaDesteLote > LIMITE_ESCRITA_DIA) {
      return json({ ok: false, quota: true, error: 'pre-stop DIGICOPY: daily row write limit próximo do teto — envio pausado até a virada do dia (por volta das 21h); as mudanças ficam guardadas neste PC.' }, 429);
    }
  } catch (eFreio) { console.error('FREIO_COTA_FALHOU', eFreio); /* segue o fluxo: o app já trata o erro real da cota */ }
  const results = [];
  for (let index = 0; index < mutations.length; index++) {
    try {
      results.push({ index, ...(await applyMutation(env, device, mutations[index])) });
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) {
        results.push({ index, ok: false, error: error.code, message: error.message });
      } else {
        throw error;
      }
    }
  }
  return json({ ok: results.every(item => item.ok), results });
}

async function handleChanges(request, env, ctx) {
  await authenticate(request, env);
  const url = new URL(request.url);
  const cursor = Math.max(0, Number.parseInt(url.searchParams.get('cursor') || '0', 10) || 0);
  somarUso(env, 0, 60, ctx); // uma folha do diário lida por baixo
  const limit = Math.min(MAX_CHANGE_LIMIT,
    Math.max(1, Number.parseInt(url.searchParams.get('limit') || '200', 10) || 200));
  const query = await env.DB.prepare(
    `SELECT seq, mutation_id, entity, record_id, operation, data_json, version, device_id, created_at
       FROM changes WHERE seq > ? ORDER BY seq ASC LIMIT ?`
  ).bind(cursor, limit + 1).all();
  const rows = query.results || [];
  const hasMore = rows.length > limit;
  const selected = hasMore ? rows.slice(0, limit) : rows;
  const changes = selected.map(row => ({
    seq: Number(row.seq),
    mutationId: row.mutation_id,
    entity: row.entity,
    recordId: row.record_id,
    operation: row.operation,
    data: parseDataJson(row.data_json),
    version: Number(row.version),
    deviceId: row.device_id,
    createdAt: Number(row.created_at)
  }));
  const nextCursor = changes.length ? changes[changes.length - 1].seq : cursor;
  return json({ ok: true, cursor, nextCursor, hasMore, changes });
}

async function handleDeleted(request, env) {
  await requireAdmin(request, env);
  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '100', 10) || 100));
  const rows = await env.DB.prepare(
    `SELECT * FROM records WHERE deleted_at IS NOT NULL
     ORDER BY deleted_at DESC LIMIT ?`
  ).bind(limit).all();
  return json({ ok: true, records: (rows.results || []).map(publicRecord) });
}

async function handleRestore(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  const entity = cleanText(body.entity, 64);
  const recordId = cleanText(body.recordId, 160);
  if (!entity || !ENTITY_RE.test(entity) || !recordId) {
    throw new ApiError(400, 'INVALID_RECORD', 'Registro inválido.');
  }
  const current = await env.DB.prepare(
    'SELECT * FROM records WHERE entity = ? AND record_id = ? LIMIT 1'
  ).bind(entity, recordId).first();
  if (!current || current.deleted_at == null || !current.data_json) {
    throw new ApiError(404, 'DELETED_RECORD_NOT_FOUND', 'Registro excluído não encontrado.');
  }
  const result = await applyMutation(env, admin, {
    mutationId: cleanText(body.mutationId, 120) || ('restore_' + crypto.randomUUID()),
    entity,
    recordId,
    operation: 'upsert',
    baseVersion: Number(current.version),
    data: parseDataJson(current.data_json)
  });
  if (!result.ok) return json({ ok: false, ...result }, 409);
  return json({ ok: true, restored: true, ...result });
}

function clientIdentityTokens(dataJson) {
  const data = parseDataJson(dataJson) || {};
  const tokens = [];
  const code = String(data.codigo == null ? '' : data.codigo).replace(/\D/g, '').replace(/^0+/, '');
  const doc = String(data.documento == null ? '' : data.documento).replace(/\D/g, '');
  if (code && code !== '0') tokens.push('codigo:' + code);
  if (doc.length >= 8) tokens.push('documento:' + doc);
  return tokens;
}

async function deletedActiveOriginTokens(env, entity) {
  const rows = await env.DB.prepare(
    `SELECT r.data_json FROM records r
     JOIN changes first_change ON first_change.seq = (
       SELECT MIN(c2.seq) FROM changes c2
       WHERE c2.entity = r.entity AND c2.record_id = r.record_id
     )
     JOIN devices d ON d.id = first_change.device_id
     WHERE r.entity = ? AND r.deleted_at IS NOT NULL AND d.revoked_at IS NULL`
  ).bind(entity).all();
  const tokens = new Set();
  for (const row of (rows.results || [])) for (const token of clientIdentityTokens(row.data_json)) tokens.add(token);
  return tokens;
}

async function handleRevokedDeviceRecords(request, env) {
  await requireAdmin(request, env);
  const url = new URL(request.url);
  const entity = cleanText(url.searchParams.get('entity') || 'clientes', 64);
  if (!entity || !ENTITY_RE.test(entity)) throw new ApiError(400, 'INVALID_ENTITY', 'Entidade inválida.');
  const rows = await env.DB.prepare(
    `SELECT r.*, d.name AS source_device
     FROM records r
     JOIN changes first_change ON first_change.seq = (
       SELECT MIN(c2.seq) FROM changes c2
       WHERE c2.entity = r.entity AND c2.record_id = r.record_id
     )
     JOIN devices d ON d.id = first_change.device_id
     WHERE r.entity = ? AND r.deleted_at IS NULL AND d.revoked_at IS NOT NULL
     ORDER BY first_change.seq ASC LIMIT 200`
  ).bind(entity).all();
  const protectedTokens = entity === 'clientes' ? await deletedActiveOriginTokens(env, entity) : new Set();
  const records = [], kept = [];
  for (const row of (rows.results || [])) {
    const item = { ...publicRecord(row), sourceDevice: row.source_device };
    const isReplacement = clientIdentityTokens(row.data_json).some(token => protectedTokens.has(token));
    if (isReplacement) kept.push({ ...item, reason: 'substituiu cadastro original durante a união' });
    else records.push(item);
  }
  return json({ ok: true, entity, records, kept, totalFromBlocked: records.length + kept.length });
}

async function handleRemoveRevokedDeviceRecords(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  const entity = cleanText(body.entity || 'clientes', 64);
  const ids = Array.isArray(body.recordIds) ? [...new Set(body.recordIds.map(x => cleanText(x, 160)).filter(Boolean))] : [];
  if (!entity || !ENTITY_RE.test(entity) || !ids.length || ids.length > 100) {
    throw new ApiError(400, 'INVALID_REVIEW_BATCH', 'Seleção inválida para limpeza.');
  }
  const protectedTokens = entity === 'clientes' ? await deletedActiveOriginTokens(env, entity) : new Set();
  const results = [];
  for (const recordId of ids) {
    const current = await env.DB.prepare(
      `SELECT r.* FROM records r
       JOIN changes first_change ON first_change.seq = (
         SELECT MIN(c2.seq) FROM changes c2
         WHERE c2.entity = r.entity AND c2.record_id = r.record_id
       )
       JOIN devices d ON d.id = first_change.device_id
       WHERE r.entity = ? AND r.record_id = ? AND r.deleted_at IS NULL
         AND d.revoked_at IS NOT NULL LIMIT 1`
    ).bind(entity, recordId).first();
    if (!current) { results.push({ recordId, ok: false, skipped: true, reason: 'origem não autorizada' }); continue; }
    if (clientIdentityTokens(current.data_json).some(token => protectedTokens.has(token))) {
      results.push({ recordId, ok: false, skipped: true, reason: 'cadastro mantido substitui original unido' });
      continue;
    }
    const result = await applyMutation(env, admin, {
      mutationId: 'cleanup_' + crypto.randomUUID(), entity, recordId,
      operation: 'delete', baseVersion: Number(current.version)
    });
    results.push({ recordId, ...result });
  }
  return json({ ok: results.every(x => x.ok || x.skipped), removed: results.filter(x => x.ok).length, results });
}

async function handleDevices(request, env) {
  const admin = await requireAdmin(request, env);
  const [rows, lasts, grouped] = await env.DB.batch([
    env.DB.prepare(
      `SELECT d.id, d.name, d.role, d.created_at AS createdAt,
              d.last_seen_at AS lastSeenAt, d.revoked_at AS revokedAt,
              (SELECT COUNT(*) FROM records r WHERE r.updated_by = d.id AND r.deleted_at IS NULL) AS activeRecords,
              (SELECT COUNT(*) FROM changes c WHERE c.device_id = d.id) AS totalChanges
       FROM devices d ORDER BY d.revoked_at IS NOT NULL, d.created_at ASC`
    ),
    env.DB.prepare(
      `SELECT c.device_id AS deviceId, c.entity AS lastEntity, c.operation AS lastOperation,
              c.created_at AS lastChangeAt
         FROM changes c
         INNER JOIN (SELECT device_id, MAX(seq) AS seq FROM changes GROUP BY device_id) x
           ON x.device_id = c.device_id AND x.seq = c.seq`
    ),
    env.DB.prepare(
      `SELECT updated_by AS deviceId, entity, COUNT(*) AS active
         FROM records WHERE deleted_at IS NULL AND updated_by IS NOT NULL
         GROUP BY updated_by, entity`
    )
  ]);
  const lastMap = {};
  for (const row of (lasts.results || [])) lastMap[row.deviceId] = row;
  const entityMap = {};
  for (const row of (grouped.results || [])) {
    if (!entityMap[row.deviceId]) entityMap[row.deviceId] = {};
    entityMap[row.deviceId][row.entity] = Number(row.active) || 0;
  }
  const devices = (rows.results || []).map(device => {
    const last = lastMap[device.id] || {};
    return {
      ...device,
      lastChangeAt: last.lastChangeAt == null ? null : Number(last.lastChangeAt),
      lastEntity: last.lastEntity || null,
      lastOperation: last.lastOperation || null,
      byEntity: entityMap[device.id] || {}
    };
  });
  return json({ ok: true, currentDeviceId: admin.id, devices });
}

async function handleActivity(request, env) {
  await requireAdmin(request, env);
  const url = new URL(request.url);
  const limit = Math.min(80, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '40', 10) || 40));
  const deviceId = cleanText(url.searchParams.get('deviceId') || '', 80);
  const query = deviceId
    ? await env.DB.prepare(
      `SELECT c.seq, c.entity, c.record_id, c.operation, c.created_at, c.device_id, c.data_json, d.name AS device_name
         FROM changes c LEFT JOIN devices d ON d.id = c.device_id
        WHERE c.device_id = ? ORDER BY c.seq DESC LIMIT ?`
    ).bind(deviceId, limit).all()
    : await env.DB.prepare(
      `SELECT c.seq, c.entity, c.record_id, c.operation, c.created_at, c.device_id, c.data_json, d.name AS device_name
         FROM changes c LEFT JOIN devices d ON d.id = c.device_id
        ORDER BY c.seq DESC LIMIT ?`
    ).bind(limit).all();
  const events = (query.results || []).map(row => ({
    seq: Number(row.seq),
    entity: row.entity,
    recordId: row.record_id,
    operation: row.operation,
    createdAt: Number(row.created_at),
    deviceId: row.device_id,
    deviceName: row.device_name || 'Aparelho',
    label: activityLabel(row.data_json, row.record_id, row.entity)
  }));
  return json({ ok: true, events });
}

async function handleRevokeDevice(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  const deviceId = cleanText(body.deviceId, 80);
  if (!deviceId) throw new ApiError(400, 'DEVICE_ID_REQUIRED', 'Informe o aparelho.');
  if (deviceId === admin.id) {
    throw new ApiError(400, 'CANNOT_REVOKE_SELF', 'Este computador não pode bloquear a própria autorização.');
  }
  const now = Date.now();
  const result = await env.DB.prepare(
    'UPDATE devices SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL'
  ).bind(now, deviceId).run();
  if (!result.meta || Number(result.meta.changes) !== 1) {
    throw new ApiError(404, 'DEVICE_NOT_FOUND', 'Aparelho não encontrado ou já bloqueado.');
  }
  await env.DB.prepare(
    `INSERT INTO device_events(event_type, device_id, actor_id, details_json, created_at)
     VALUES ('device_revoked', ?, ?, NULL, ?)`
  ).bind(deviceId, admin.id, now).run();
  return json({ ok: true, revoked: true, deviceId, revokedAt: now });
}

async function handleResetCloud(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  if (body.confirmation !== 'APAGAR NUVEM') {
    throw new ApiError(400, 'RESET_CONFIRMATION_REQUIRED', 'Digite APAGAR NUVEM para confirmar.');
  }
  const active = await env.DB.prepare(
    'SELECT COUNT(*) AS total FROM devices WHERE revoked_at IS NULL'
  ).first();
  if (Number(active && active.total) !== 1) {
    throw new ApiError(409, 'RESET_REQUIRES_SINGLE_DEVICE', 'Bloqueie os outros aparelhos antes de zerar a nuvem.');
  }
  const [recordCount, changeCount] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS total FROM records'),
    env.DB.prepare('SELECT COUNT(*) AS total FROM changes')
  ]);
  // v5.24.0 — zerar a nuvem SÓ depois de guardar uma foto completa dela na
  // pasta "Backup seguranca". Se o backup falhar, o reset NÃO acontece
  // (os dados da empresa valem mais que qualquer comando).
  const agoraSp = new Date();
  await gerarBackup(env, 'Backup seguranca/Backup antes de zerar a nuvem ' + dataArquivoSP(agoraSp) + ' ' + horaArquivoSP(agoraSp) + '.json', { tipo: 'seguranca' });
  const now = Date.now();
  const generation = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM enrollment_codes'),
    env.DB.prepare('DELETE FROM changes'),
    env.DB.prepare('DELETE FROM records'),
    env.DB.prepare(
      `INSERT INTO system_meta(key, value, updated_at) VALUES ('cloud_generation', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).bind(generation, now),
    env.DB.prepare(
      `INSERT INTO device_events(event_type, device_id, actor_id, details_json, created_at)
       VALUES ('cloud_business_reset', ?, ?, ?, ?)`
    ).bind(admin.id, admin.id, JSON.stringify({ generation }), now)
  ]);
  return json({
    ok: true,
    reset: true,
    generation,
    removed: {
      records: Number(recordCount.results[0].total) || 0,
      changes: Number(changeCount.results[0].total) || 0
    },
    kept: { devices: 1, security: true }
  });
}

// Resumo da nuvem guardado por 10 minutos (v5.22.82)
// Contar a tabela inteira a cada clique custa leitura no banco, e no plano
// grátis isso tem teto diário. O resultado passa a ser guardado numa linha só e
// reaproveitado por 10 minutos — é número de conferência, não precisa ser do
// segundo exato.
const RESUMO_VALE_POR = 10 * 60 * 1000;

async function resumoDaNuvem(env) {
  try {
    const linha = await env.DB.prepare("SELECT value FROM system_meta WHERE key = 'resumo_json' LIMIT 1").first();
    if (linha && linha.value) {
      const guardado = JSON.parse(linha.value);
      if (guardado && Date.now() - Number(guardado.em || 0) < RESUMO_VALE_POR) return guardado.totais;
    }
  } catch (error) {
    console.error('DIGICOPY_RESUMO_LEITURA', error);
  }
  const totais = { devices: 0, records: 0, deleted: 0, cursor: 0, byEntity: {} };
  try {
    const grouped = await env.DB.prepare(`SELECT entity,
      SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS deleted
      FROM records GROUP BY entity ORDER BY entity`).all();
    for (const row of (grouped.results || [])) {
      const ativos = Number(row.active) || 0, apagados = Number(row.deleted) || 0;
      totais.byEntity[row.entity] = { active: ativos, deleted: apagados };
      totais.records += ativos;
      totais.deleted += apagados;
    }
  } catch (error) {
    console.error('DIGICOPY_RESUMO_AGRUPADO', error);
    return null;
  }
  try {
    const devices = await env.DB.prepare('SELECT COUNT(*) AS total FROM devices WHERE revoked_at IS NULL').first();
    totais.devices = Number(devices && devices.total) || 0;
    const changes = await env.DB.prepare('SELECT COALESCE(MAX(seq), 0) AS total FROM changes').first();
    totais.cursor = Number(changes && changes.total) || 0;
  } catch (error) {
    console.error('DIGICOPY_RESUMO_PARCIAL', error);
  }
  try {
    await env.DB.prepare(
      `INSERT INTO system_meta(key, value, updated_at) VALUES ('resumo_json', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).bind(JSON.stringify({ em: Date.now(), totais }), Date.now()).run();
  } catch (error) {
    console.error('DIGICOPY_RESUMO_GRAVACAO', error);
  }
  return totais;
}

// ═══════════════════════════════════════════════════════════════════════════
// USO DA NUVEM (v5.22.101) — contagem estimada por dia UTC
// O teto grátis do D1: 100.000 gravações/dia e 5.000.000 leituras/dia
// (vira 00h UTC = 21h em São Paulo, como o sistema já avisa). Conta aqui no
// worker pra aba Nuvem mostrar "usou X de 100.000" — o dono vê antes de virar.
// ═══════════════════════════════════════════════════════════════════════════
let __USO_TABELA_OK = false;
let ultimoErroUso = '';
async function garantirTabelaUso(env){
  if (__USO_TABELA_OK) return;
  // v5.24.3 — D1 .exec() QUEBRA os comandos por LINHA: DDL multilinha virava
  // "incomplete input" (o erro que aparecia no Backup). Tudo numa linha só.
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS uso_diario (dia TEXT PRIMARY KEY, escritas INTEGER NOT NULL DEFAULT 0, leituras INTEGER NOT NULL DEFAULT 0)`);
  __USO_TABELA_OK = true;
}
function hojeUTC(){
  return new Date().toISOString().slice(0, 10);
}
async function _somar(env, escritas, leituras){
  try{
    await garantirTabelaUso(env);
    await env.DB.prepare(
      `INSERT INTO uso_diario(dia, escritas, leituras) VALUES (?, ?, ?)
         ON CONFLICT(dia) DO UPDATE SET escritas = escritas + ?, leituras = leituras + ?`
    ).bind(hojeUTC(), escritas, leituras, escritas, leituras).run();
  }catch(e){ ultimoErroUso = String(e && e.message || e); console.error('USO_DIARIO_FALHOU', e); }
}
// v5.22.103 — a anotação nunca segura a resposta: com ctx vai por waitUntil
// (sem ctx cai no await de antes, que também funciona).
function somarUso(env, escritas, leituras, ctx){
  const p = _somar(env, escritas, leituras);
  if(ctx && typeof ctx.waitUntil === 'function'){ ctx.waitUntil(p); return; }
  return p;
}
async function usoHoje(env){
  try{
    await garantirTabelaUso(env);
    const r = await env.DB.prepare('SELECT dia, escritas, leituras FROM uso_diario WHERE dia = ?').bind(hojeUTC()).first();
    return {
      dia: hojeUTC(),
      escritas: (r && Number(r.escritas)) || 0,
      leituras: (r && Number(r.leituras)) || 0,
      tetoEscritas: 100000,
      tetoLeituras: 5000000
    };
  }catch(e){ return { dia: hojeUTC(), escritas: 0, leituras: 0, tetoEscritas: 100000, tetoLeituras: 5000000 }; }
}

async function handleStatus(request, env, ctx) {
  const device = await authenticate(request, env);
  const totals = await resumoDaNuvem(env);
  if (!totals) throw new ApiError(503, 'CONTAGEM_INDISPONIVEL', 'A nuvem não conseguiu contar os registros agora. A sincronização não é afetada.');
  somarUso(env, 0, 30, ctx); // abrir o status também lê algumas linhas
  return json({ ok: true, device, totals, workerVersao: WORKER_VERSION,
    usoHoje: await (async () => {
      // v5.23.1 — medidor oficial (mini-worker contador-uso) tem precedência;
      // sem ele (ou zerado), cai na estimativa do próprio uso.
      try {
        const real = await env.DB.prepare('SELECT leituras, escritas, medido_em FROM uso_real WHERE dia = ?').bind(hojeUTC()).first();
        if (real && (Number(real.leituras) > 0 || Number(real.escritas) > 0)) {
          return { dia: hojeUTC(), escritas: Number(real.escritas) || 0, leituras: Number(real.leituras) || 0,
                   tetoEscritas: 100000, tetoLeituras: 5000000, fonte: 'oficial', medidoEm: real.medido_em || null };
        }
      } catch (e) { /* tabela ainda não existe — tudo bem */ }
      // v5.24.4 — com a cota estourada a CREATE da tabela de uso falha e o
      // SELECT abaixo quebrava o /v1/status inteiro (o app caía no aviso
      // falso de "código ANTIGO"). Medidor quebrado não derruba o status.
      let est;
      try {
        est = await usoHoje(env);
      } catch (eUso) {
        est = { dia: hojeUTC(), escritas: 0, leituras: 0, tetoEscritas: 100000, tetoLeituras: 5000000, avisoUso: 'medidor pausado (cota)' };
      }
      if (ultimoErroUso) est.avisoUso = ultimoErroUso;
      return Object.assign(est, { fonte: 'estimada' });
    })() });
}



function avisoEpson() {
  return 'Prezados clientes,\n\nInformamos que as manutenções em impressoras EPSON exigem um prazo maior para a conclusão. Para estes equipamentos, utilizamos produtos químicos específicos que demandam um tempo necessário de reação para garantir a eficácia do serviço. Por isso, solicitamos um prazo médio de 15 dias úteis para a entrega da manutenção.\n\nVale ressaltar que o equipamento pode ficar pronto antes deste prazo, a depender da agilidade da reação dos produtos utilizados.\n\nAgradecemos a compreensão de todos e nos colocamos à disposição para eventuais dúvidas!';
}

function parsePayloadD(raw) {
  if (!raw) return null;
  try {
    let b = String(raw).replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    const jsonStr = decodeURIComponent(escape(atob(b)));
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

async function ensurePublicDevice(env) {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT OR REPLACE INTO devices (id, name, token_hash, role, created_at, last_seen_at)
     VALUES ('public-orcamento', 'Aprovação Pública', 'public_orcamento_sys_hash', 'device', ?, ?)`
  ).bind(now, now).run();
}

async function findOrcamentoByToken(env, token) {
  const code = cleanText(token, 120);
  if (!code || code.length < 6) return null;
  const rows = await env.DB.prepare(
    `SELECT * FROM records WHERE entity = 'orcamentos'`
  ).all();
  for (const row of (rows.results || [])) {
    const data = parseDataJson(row.data_json) || {};
    if (String(data.token || '') === code || String(row.record_id || '') === code) {
      return { row, data };
    }
  }
  return null;
}

function publicOrcamentoPayload(data) {
  return {
    ok: true,
    numero: data.numero || '',
    clienteNome: data.clienteNome || data.clienteFantasia || '',
    data: String(data.data || data.criadoEm || '').slice(0, 10),
    itens: Array.isArray(data.itens) ? data.itens.map(it => ({
      descricao: it.descricao || it.d || '',
      qtd: it.qtd || it.q || 1,
      preco: it.preco || it.p || 0,
      subtotal: it.subtotal || it.s || 0
    })) : [],
    total: Number(data.total || data.tot) || 0,
    status: data.status || 'aberto',
    whatsapp: data.lojaWhatsapp || data.w || '',
    vendaId: data.vendaId || null,
    vendaNumero: data.vendaNumero || '',
    os: data.os || null,
    aviso: avisoEpson()
  };
}

async function handleOrcamentoGet(url, env) {
  if (!env.DB) throw new ApiError(503, 'DATABASE_NOT_BOUND', 'Banco D1 não vinculado.');
  const token = url.searchParams.get('c');
  const found = await findOrcamentoByToken(env, token);
  if (!found) {
    return json({ ok: false, error: 'NOT_FOUND', status: 'aberto', message: 'Orçamento não encontrado.' }, 404);
  }
  const st = String(found.data.status || 'aberto');
  const deleted = found.row.deleted_at != null || st === 'excluido';
  if (deleted || (st === 'recusado' && false)) {
    return json({
      ok: false,
      error: 'USED',
      status: 'recusado',
      vendaId: found.data.vendaId || null,
      vendaNumero: found.data.vendaNumero || '',
      message: 'Este link não vale mais.'
    }, 410);
  }
  return json(publicOrcamentoPayload(found.data));
}

async function handleOrcamentoPost(request, env) {
  if (!env.DB) throw new ApiError(503, 'DATABASE_NOT_BOUND', 'Banco D1 não vinculado.');
  await ensurePublicDevice(env);
  const body = await readBody(request);
  const acao = body.acao === 'recusar' ? 'recusar' : (body.acao === 'aprovar' ? 'aprovar' : '');
  if (!acao) throw new ApiError(400, 'INVALID_ACTION', 'Informe aprovar ou recusar.');
  const token = cleanText(body.c, 120);
  let found = await findOrcamentoByToken(env, token);
  const device = { id: 'public-orcamento' };

  let data = null;
  let recordId = null;
  let baseVersion = 0;

  if (found) {
    data = found.data;
    recordId = found.row.record_id;
    baseVersion = Number(found.row.version);
    if (data.status === 'aprovado' || data.status === 'recusado') {
      // ALREADY_DECIDED / error: 'USED'
      return json({ ok: true, status: data.status, vendaId: data.vendaId || null, vendaNumero: data.vendaNumero || '', message: 'Orçamento já processado.' });
    }
  } else {
    // Decodifica payload de fallback se fornecido
    const payloadD = parsePayloadD(body.d) || {};
    recordId = 'orc_' + (body.numero ? String(body.numero).replace(/\D/g, '') : Date.now().toString(36));
    data = {
      id: recordId,
      token: token,
      numero: body.numero || payloadD.n || '',
      clienteNome: body.clienteNome || payloadD.c || '',
      data: payloadD.dt || new Date().toISOString(),
      itens: Array.isArray(payloadD.it) ? payloadD.it.map(it => ({
        descricao: it.d || '',
        qtd: it.q || 1,
        preco: it.p || 0,
        subtotal: it.s || 0
      })) : [],
      total: Number(payloadD.tot) || 0,
      lojaWhatsapp: body.whatsapp || payloadD.w || '',
      os: payloadD.os || null,
      status: 'aberto',
      criadoEm: new Date().toISOString()
    };
    baseVersion = 0;
  }

  if (acao === 'recusar') {
    if (data.status === 'aprovado') {
      throw new ApiError(409, 'ALREADY_APPROVED', 'Este orçamento já foi autorizado.');
    }
    data.status = 'recusado';
    data.recusadoEm = new Date().toISOString();
    // Suporte a mutation de recusa / exclusão orc_del_ (excluido: true)
    await applyMutation(env, device, {
      mutationId: 'orc_del_' + crypto.randomUUID(),
      entity: 'orcamentos',
      recordId: recordId,
      operation: 'upsert',
      baseVersion: baseVersion,
      data
    }).catch(() => ({ ok: true, version: 1, excluido: true }));
    return json({ ok: true, status: 'recusado' });
  }

  const vendaNumero = String(data.vendaNumero || data.numero || ('V' + Date.now().toString(36).toUpperCase()));
  const vendaId = 'vda_orc_' + String(data.id || recordId);
  const venda = {
    id: vendaId,
    empresaId: data.empresaId || '',
    numero: vendaNumero,
    clienteId: data.clienteId || null,
    clienteNome: data.clienteNome || '',
    data: new Date().toISOString(),
    itens: Array.isArray(data.itens) ? data.itens : [],
    desconto: 0,
    total: Number(data.total) || 0,
    observacao: 'Gerada do orçamento ' + (data.numero || ''),
    status: 'aguardar',
    origemOrcamentoId: data.id || recordId,
    os: data.os || null,
    criadoPor: data.criadoPor || 'cliente',
    criadoPorNome: data.criadoPorNome || 'Cliente',
    criadoEm: new Date().toISOString()
  };
  const mensagem = 'Olá, sou ' + String(data.clienteNome || 'cliente')
    + '. Foi autorizado o orçamento do COD ' + String(data.numero || '')
    + ' e gerou a venda salva ' + vendaNumero
    + '. Por favor, vá atualizando para mim sobre o andamento.';
  data.status = 'aprovado';
  data.vendaId = vendaId;
  data.vendaNumero = vendaNumero;
  data.aprovadoEm = new Date().toISOString();
  data.aprovadoOrigem = 'cliente';
  data.mensagemWhats = mensagem;

  const ntf = {
    id: crypto.randomUUID(),
    empresaId: data.empresaId || '',
    tipo: 'orcamento_aprovado',
    titulo: 'Orçamento autorizado',
    texto: String(data.clienteNome || 'Cliente') + ' autorizou o orçamento ' + String(data.numero || '')
      + ' e gerou a venda salva ' + vendaNumero,
    orcamentoId: data.id || recordId,
    vendaId,
    lida: false,
    criadoEm: new Date().toISOString()
  };

  await applyMutation(env, device, {
    mutationId: 'orc_vda_' + crypto.randomUUID(),
    entity: 'vendas',
    recordId: vendaId,
    operation: 'upsert',
    baseVersion: 0,
    data: venda
  }).catch(() => {});

  await applyMutation(env, device, {
    mutationId: 'orc_ntf_' + crypto.randomUUID(),
    entity: 'notificacoes',
    recordId: ntf.id,
    operation: 'upsert',
    baseVersion: 0,
    data: ntf
  }).catch(() => {});

  await applyMutation(env, device, {
    mutationId: 'orc_ok_' + crypto.randomUUID(),
    entity: 'orcamentos',
    recordId: recordId,
    operation: 'upsert',
    baseVersion: baseVersion,
    data
  }).catch(() => {});

  return json({ ok: true, status: 'aprovado', vendaId, vendaNumero, mensagem });
}

async function route(request, env, ctx) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
  const url = new URL(request.url);
  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) return handleHealth(env);
  if (request.method === 'GET' && url.pathname === '/pix') return handlePix(url);
  if (request.method === 'GET' && url.pathname === '/orcamento') return handleOrcamentoGet(url, env);
  if (request.method === 'POST' && url.pathname === '/orcamento') return handleOrcamentoPost(request, env);
  if (!env.DB) throw new ApiError(503, 'DATABASE_NOT_BOUND', 'Banco D1 não vinculado.');
  if (request.method === 'POST' && url.pathname === '/v1/setup') return handleSetup(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/recover') return handleRecovery(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/invites') return handleCreateInvite(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/enroll') return handleEnroll(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/changes') return handlePush(request, env, ctx);
  if (request.method === 'GET' && url.pathname === '/v1/changes') return handleChanges(request, env, ctx);
  if (request.method === 'GET' && url.pathname === '/v1/deleted') return handleDeleted(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/restore') return handleRestore(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/review/revoked-records') return handleRevokedDeviceRecords(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/review/remove-revoked') return handleRemoveRevokedDeviceRecords(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/devices') return handleDevices(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/admin/activity') return handleActivity(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/devices/revoke') return handleRevokeDevice(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/admin/reset-cloud') return handleResetCloud(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/status') return handleStatus(request, env, ctx);
  // Backups (somente aparelho administrador)
  if (request.method === 'GET' && url.pathname === '/v1/backups') return handleBackupListar(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/backup') return handleBackupBaixar(request, env);
  if (request.method === 'DELETE' && url.pathname === '/v1/backup') return handleBackupApagarUm(request, env);
  if (request.method === 'DELETE' && url.pathname === '/v1/backups') return handleBackupApagarTodos(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/backup/agora') return handleBackupAgora(request, env);
  throw new ApiError(404, 'NOT_FOUND', 'Rota não encontrada.');
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKUPS AUTOMÁTICOS (v5.22.97)
// Dois ciclos independentes que a nuvem faz sozinha, com os PCs desligados:
//  1) Diário às 18:30 de São Paulo (cron 21:30 UTC)
//  2) A cada ATUALIZAÇÃO do sistema — o primeiro sync de uma versão nova faz
//     primeiro a foto do banco com o nome da versão ANTERIOR.
// + um reforço manual: o dono pode pedir "Backup agora" na tela.
// Os arquivos ficam organizados em pastas dentro da própria nuvem (tabela
// exclusiva de backups, criada sozinha — NÃO mistura com os dados do sistema):
//   📁 Backup diario       → Backup 08-09-2026.json
//   📁 Backup atualizações → Backup sistema 5.22.95.json  (foto da versão anterior)
//   📁 Backup manual       → Backup manual 1.json, Backup manual 2.json... (número nunca repete)
// A limpeza é MANUAL pelos botões do administrador — nunca apaga sozinho.
// ═══════════════════════════════════════════════════════════════════════════

function pad2(n){ return String(n).padStart(2, '0'); }

function dataArquivoSP(agora){
  // Data de São Paulo no formato do dono: DD-MM-AAAA.
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(agora).replaceAll('/', '-');
}

function horaArquivoSP(agora){
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(agora).replace(':', 'h').replace('\u200f', '').trim();
}

const PASTA_DIARIO = 'Backup diario';
const PASTA_ATUALIZACOES = 'Backup atualizações';
const PASTA_MANUAL = 'Backup manual';

function nomeBackupDiario(agora){
  return PASTA_DIARIO + '/Backup ' + dataArquivoSP(agora) + '.json';
}

function nomeBackupSistema(versaoAnterior){
  return PASTA_ATUALIZACOES + '/Backup sistema ' + String(versaoAnterior || '').trim() + '.json';
}

function nomeBackupManual(seq){
  // v5.24.0 — manual numerado, como o dono pediu: "Backup manual 1, 2, 3..."
  // e o número NUNCA se repete, mesmo excluindo os arquivos (igual ao código
  // de clientes/vendas). O contador mora na nuvem e vale para todos os PCs.
  return PASTA_MANUAL + '/Backup manual ' + seq + '.json';
}

async function proximoSeqManual(env){
  // Contador persistente do manual (upsert em system_meta).
  const agora = Date.now();
  await env.DB.prepare(
    `INSERT INTO system_meta(key, value, updated_at) VALUES ('backup_seq_manual', '1', ?)
     ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1, updated_at = ?`
  ).bind(agora, agora).run();
  const linha = await env.DB.prepare(
    "SELECT value FROM system_meta WHERE key = 'backup_seq_manual' LIMIT 1"
  ).first();
  return Number(linha && linha.value) || 1;
}

function compararVersao(a, b){
  // 5.22.96 > 5.22.95; compara pedaço numérico por pedaço.
  const pa = String(a || '').replace(/^v/i, '').split('.').map(x => parseInt(x, 10) || 0);
  const pb = String(b || '').replace(/^v/i, '').split('.').map(x => parseInt(x, 10) || 0);
  const tam = Math.max(pa.length, pb.length);
  for (let i = 0; i < tam; i++){
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

// Compacta o texto do backup (backup textual comprime MUITO, economiza nuvem)
async function gzipTexto(texto){
  const dados = new TextEncoder().encode(texto);
  const stream = new Blob([dados]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function gunzipBytes(bytes){
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

// Tabela exclusiva de backups, autocriada no primeiro uso (não precisa migrate)
let __BACKUP_TABELA_OK = false;
async function garantirTabelaBackups(env){
  if (__BACKUP_TABELA_OK) return;
  // v5.24.3 — D1 .exec() quebra por LINHA (ver garantirTabelaUso): uma linha só.
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS backups (id TEXT PRIMARY KEY, nome TEXT NOT NULL, pasta TEXT NOT NULL, tipo TEXT NOT NULL, tamanho_original INTEGER NOT NULL, tamanho_gzip INTEGER NOT NULL, registros INTEGER NOT NULL, gerado_em INTEGER NOT NULL)`);
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS backups_chunks (id TEXT NOT NULL, seq INTEGER NOT NULL, chunk BLOB NOT NULL, PRIMARY KEY (id, seq))`);
  __BACKUP_TABELA_OK = true;
}

const TAMANHO_CHUNK = 1500000; // pedaços pequenos: nunca estica uma linha do banco

async function gerarBackup(env, chave, meta){
  // Foto completa: registros paginados + aparelhos (SEM token_hash).
  const records = [];
  let pulados = 0;
  for (let guard = 0; guard < 500; guard++){
    const lote = await env.DB.prepare(
      `SELECT entity, record_id, data_json, version, updated_at, deleted_at, updated_by
         FROM records ORDER BY entity ASC, record_id ASC LIMIT 1000 OFFSET ?`
    ).bind(pulados).all();
    const linhas = lote.results || [];
    records.push(...linhas);
    if (linhas.length < 1000) break;
    pulados += linhas.length;
  }
  const devices = await env.DB.prepare(
    `SELECT id, name, role, created_at, last_seen_at, revoked_at FROM devices ORDER BY created_at ASC`
  ).all();
  const totals = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM records WHERE deleted_at IS NULL) AS records_vivos,
            (SELECT COUNT(*) FROM records WHERE deleted_at IS NOT NULL) AS records_excluidos,
            (SELECT COUNT(*) FROM changes) AS changes`
  ).first();
  const agora = new Date();
  const arquivo = {
    ferramenta: 'digicopy-backup',
    tipo: meta && meta.tipo || 'manual',
    versaoSistemaAnterior: meta && meta.versaoAnterior || undefined,
    geradoEm: agora.toISOString(),
    geradoEmSaoPaulo: agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    totais: totals || {},
    aparelhos: (devices.results || []),
    registros: records
  };
  const texto = JSON.stringify(arquivo, null, 2);
  const gzip = await gzipTexto(texto);

  await garantirTabelaBackups(env);
  const corte = chave.indexOf('/');
  const pasta = corte > 0 ? chave.slice(0, corte) : '';
  const nome = corte > 0 ? chave.slice(corte + 1) : chave;
  const partes = [];
  for (let i = 0; i < gzip.length; i += TAMANHO_CHUNK){
    partes.push(gzip.slice(i, i + TAMANHO_CHUNK));
  }
  const lotes = [
    env.DB.prepare('DELETE FROM backups WHERE id = ?').bind(chave),
    env.DB.prepare('DELETE FROM backups_chunks WHERE id = ?').bind(chave)
  ].concat(
    [env.DB.prepare(
      `INSERT INTO backups(id, nome, pasta, tipo, tamanho_original, tamanho_gzip, registros, gerado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(chave, nome, pasta, (meta && meta.tipo) || 'manual', texto.length, gzip.length, records.length, Date.now())]
  ).concat(
    partes.map((p, idx) => env.DB.prepare(
      'INSERT INTO backups_chunks(id, seq, chunk) VALUES (?, ?, ?)'
    ).bind(chave, idx, p))
  );
  // grava em levas para não estourar o tamanho de um batch só
  for (let i = 0; i < lotes.length; i += 25){
    await env.DB.batch(lotes.slice(i, i + 25));
  }
  return { nome: chave, registros: records.length, tamanho: gzip.length };
}

async function checarTrocaDeVersao(request, env, ctx){
  // Roda em todo push autenticado: se o sistema que está enviando veio com
  // versão MAIS alta que a última vista, fotografa o banco com o nome da
  // versão anterior antes de marcar a nova como última.
  const versaoApp = (request.headers.get('x-digicopy-versao') || '').trim();
  if (!versaoApp) return;
  const atual = await env.DB.prepare(
    'SELECT value FROM system_meta WHERE key = ? LIMIT 1'
  ).bind('backup_ultima_versao').first();
  const ultima = (atual && atual.value) ? String(atual.value) : '';
  if (compararVersao(versaoApp, ultima) <= 0) return;
  // Marca ANTES de gerar: se dois PCs atualizarem ao mesmo tempo, só um
  // dispara a foto (e se falhar, a próxima atualização tenta de novo).
  await env.DB.prepare(
    `INSERT INTO system_meta(key, value, updated_at) VALUES ('backup_ultima_versao', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind(versaoApp, Date.now()).run();
  if (!ultima) return; // primeiro PC visto: não existe "versão anterior" ainda
  // Mesmo nome por versão: se já existir foto daquela versão, é sobrescrita
  // (não acumula duplicado).
  const tarefa = gerarBackup(env, nomeBackupSistema(ultima), { tipo: 'sistema', versaoAnterior: ultima })
    .catch(e => console.error('BACKUP_VERSAO_FALHOU', e));
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(tarefa);
  else await tarefa;
}

function chaveBackupValida(chave){
  return !!chave && chave.indexOf('..') < 0 && chave.length < 300;
}

async function handleBackupListar(request, env){
  await requireUsuarioAdmin(request, env);
  await garantirTabelaBackups(env);
  const r = await env.DB.prepare(
    `SELECT id, nome, pasta, tipo, tamanho_original, tamanho_gzip, registros, gerado_em
       FROM backups ORDER BY gerado_em DESC LIMIT 300`
  ).all();
  const backups = (r.results || []).map(x => ({
    chave: x.id, nome: x.nome, pasta: x.pasta, tipo: x.tipo,
    tamanho: x.tamanho_original, tamanhoGzip: x.tamanho_gzip,
    registros: x.registros, geradoEm: new Date(Number(x.gerado_em)).toISOString()
  }));
  return json({ ok: true, backups });
}

async function lerBackupCompleto(env, chave){
  const meta = await env.DB.prepare('SELECT id, tamanho_gzip FROM backups WHERE id = ?').bind(chave).first();
  if (!meta) return null;
  const linhas = await env.DB.prepare('SELECT chunk FROM backups_chunks WHERE id = ? ORDER BY seq ASC').bind(chave).all();
  const partes = (linhas.results || []).map(x => new Uint8Array(x.chunk));
  const total = partes.reduce((a, p) => a + p.length, 0);
  const gzip = new Uint8Array(total);
  let pos = 0;
  partes.forEach(p => { gzip.set(p, pos); pos += p.length; });
  return { gzip, meta };
}

async function handleBackupBaixar(request, env){
  await requireUsuarioAdmin(request, env);
  await garantirTabelaBackups(env);
  const chave = new URL(request.url).searchParams.get('key') || '';
  if (!chaveBackupValida(chave)) throw new ApiError(400, 'NOME_INVALIDO', 'Nome de backup inválido.');
  const achado = await lerBackupCompleto(env, chave);
  if (!achado) throw new ApiError(404, 'BACKUP_NAO_ACHOU', 'Backup não encontrado na nuvem.');
  const texto = await gunzipBytes(achado.gzip);
  const corte = chave.indexOf('/');
  const nomeFinal = corte > 0 ? chave.slice(corte + 1) : chave;
  return new Response(texto, {
    headers: {
      ...JSON_HEADERS,
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="' + nomeFinal.replaceAll('"', '') + '"'
    }
  });
}

async function handleBackupApagarUm(request, env){
  await requireUsuarioAdmin(request, env);
  await garantirTabelaBackups(env);
  const chave = new URL(request.url).searchParams.get('key') || '';
  if (!chaveBackupValida(chave)) throw new ApiError(400, 'NOME_INVALIDO', 'Nome de backup inválido.');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM backups WHERE id = ?').bind(chave),
    env.DB.prepare('DELETE FROM backups_chunks WHERE id = ?').bind(chave)
  ]);
  return json({ ok: true, apagado: chave });
}

async function handleBackupApagarTodos(request, env){
  await requireUsuarioAdmin(request, env);
  await garantirTabelaBackups(env);
  // Apaga SOMENTE os backups (tabelas exclusivas de backup). Os dados do
  // sistema (records/changes) nunca são tocados aqui, e o ciclo continua:
  // amanhã às 18:30 e a cada atualização novos backups voltam a aparecer.
  const antes = await env.DB.prepare('SELECT COUNT(*) AS n FROM backups').first();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM backups'),
    env.DB.prepare('DELETE FROM backups_chunks')
  ]);
  return json({ ok: true, apagados: (antes && antes.n) || 0 });
}

async function handleBackupAgora(request, env){
  // Reforço ANTES de mexer em atualização: ciõa a foto na hora, como o dono pediu.
  await requireUsuarioAdmin(request, env);
  const corpo = await readBody(request).catch(() => ({}));
  const tipo = (corpo && corpo.tipo === 'atualizacao') ? 'atualizacao' : 'manual';
  let chave;
  if (tipo === 'atualizacao'){
    const versao = cleanText((corpo && corpo.versao) || '', 40) || 'sem-numero';
    chave = nomeBackupSistema(versao + ' (antes de mexer)');
  } else {
    chave = nomeBackupManual(await proximoSeqManual(env));
  }
  const r = await gerarBackup(env, chave, { tipo: tipo === 'atualizacao' ? 'sistema' : 'manual', versaoAnterior: corpo && corpo.versao || undefined });
  return json({ ok: true, backup: r.nome, registros: r.registros });
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch (error) {
      if (error instanceof ApiError) {
        return json({ ok: false, error: error.code, message: error.message }, error.status);
      }
      console.error('DIGICOPY_API_ERROR', error);
      const motivo = String((error && error.message) || error || '').slice(0, 200);
      return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Erro interno da API.' + (motivo ? ' Motivo: ' + motivo : ''), detail: motivo }, 500);
    }
  },
  // Relógio da própria nuvem: todo dia 18:30 de São Paulo faz o backup
  // diário sozinho — não precisa de nenhum PC ligado.
  async scheduled(event, env, ctx) {
    try {
      const nome = nomeBackupDiario(new Date());
      const r = await gerarBackup(env, nome, { tipo: 'diario' });
      console.log('BACKUP_DIARIO_OK', JSON.stringify(r));
    } catch (e) {
      console.error('BACKUP_DIARIO_FALHOU', e);
    }
  }
};

export const __test = { cleanText, sha256, sameSecret, randomToken, publicRecord, activityLabel, nomeBackupDiario, nomeBackupSistema, nomeBackupManual, compararVersao, dataArquivoSP, gzipTexto, gunzipBytes };
