// DIGICOPY Cloud API — sincronização local-first em Cloudflare Workers + D1.
// Nenhuma rota substitui uma base inteira. Alterações são incrementais,
// versionadas, idempotentes e atribuídas a um aparelho autenticado.

const API_VERSION = '0.3.1';
const MAX_BODY_BYTES = 900_000;
const MAX_MUTATIONS = 100;
const MAX_CHANGE_LIMIT = 500;
const ENTITY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, x-setup-secret',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
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
  return json({ ok: true, device: { id, name, role }, token }, 201);
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

async function handlePush(request, env) {
  const device = await authenticate(request, env);
  const body = await readBody(request);
  const mutations = body.mutations;
  if (!Array.isArray(mutations) || mutations.length < 1 || mutations.length > MAX_MUTATIONS) {
    throw new ApiError(400, 'INVALID_MUTATION_BATCH', `Envie de 1 a ${MAX_MUTATIONS} alterações.`);
  }
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

async function handleChanges(request, env) {
  await authenticate(request, env);
  const url = new URL(request.url);
  const cursor = Math.max(0, Number.parseInt(url.searchParams.get('cursor') || '0', 10) || 0);
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

async function handleRevokedDeviceRecords(request, env) {
  await requireAdmin(request, env);
  const url = new URL(request.url);
  const entity = cleanText(url.searchParams.get('entity') || 'clientes', 64);
  if (!entity || !ENTITY_RE.test(entity)) throw new ApiError(400, 'INVALID_ENTITY', 'Entidade inválida.');
  const rows = await env.DB.prepare(
    `SELECT r.*, d.name AS source_device
     FROM records r JOIN devices d ON d.id = r.updated_by
     WHERE r.entity = ? AND r.deleted_at IS NULL AND d.revoked_at IS NOT NULL
     ORDER BY r.updated_at ASC LIMIT 200`
  ).bind(entity).all();
  return json({ ok: true, entity, records: (rows.results || []).map(row => ({
    ...publicRecord(row), sourceDevice: row.source_device
  })) });
}

async function handleRemoveRevokedDeviceRecords(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  const entity = cleanText(body.entity || 'clientes', 64);
  const ids = Array.isArray(body.recordIds) ? [...new Set(body.recordIds.map(x => cleanText(x, 160)).filter(Boolean))] : [];
  if (!entity || !ENTITY_RE.test(entity) || !ids.length || ids.length > 100) {
    throw new ApiError(400, 'INVALID_REVIEW_BATCH', 'Seleção inválida para limpeza.');
  }
  const results = [];
  for (const recordId of ids) {
    const current = await env.DB.prepare(
      `SELECT r.* FROM records r JOIN devices d ON d.id = r.updated_by
       WHERE r.entity = ? AND r.record_id = ? AND r.deleted_at IS NULL
         AND d.revoked_at IS NOT NULL LIMIT 1`
    ).bind(entity, recordId).first();
    if (!current) { results.push({ recordId, ok: false, skipped: true }); continue; }
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
  const rows = await env.DB.prepare(
    `SELECT id, name, role, created_at AS createdAt, last_seen_at AS lastSeenAt,
            revoked_at AS revokedAt
     FROM devices ORDER BY revoked_at IS NOT NULL, created_at ASC`
  ).all();
  return json({ ok: true, currentDeviceId: admin.id, devices: rows.results || [] });
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

async function handleStatus(request, env) {
  const device = await authenticate(request, env);
  const [devices, records, deleted, changes, grouped] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS total FROM devices WHERE revoked_at IS NULL'),
    env.DB.prepare('SELECT COUNT(*) AS total FROM records WHERE deleted_at IS NULL'),
    env.DB.prepare('SELECT COUNT(*) AS total FROM records WHERE deleted_at IS NOT NULL'),
    env.DB.prepare('SELECT COALESCE(MAX(seq), 0) AS total FROM changes'),
    env.DB.prepare(`SELECT entity,
      SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS deleted
      FROM records GROUP BY entity ORDER BY entity`)
  ]);
  const byEntity = {};
  for (const row of (grouped.results || [])) {
    byEntity[row.entity] = { active: Number(row.active) || 0, deleted: Number(row.deleted) || 0 };
  }
  return json({
    ok: true,
    device,
    totals: {
      devices: Number(devices.results[0].total),
      records: Number(records.results[0].total),
      deleted: Number(deleted.results[0].total),
      cursor: Number(changes.results[0].total),
      byEntity
    }
  });
}

async function route(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
  const url = new URL(request.url);
  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) return handleHealth(env);
  if (!env.DB) throw new ApiError(503, 'DATABASE_NOT_BOUND', 'Banco D1 não vinculado.');
  if (request.method === 'POST' && url.pathname === '/v1/setup') return handleSetup(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/recover') return handleRecovery(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/invites') return handleCreateInvite(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/enroll') return handleEnroll(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/changes') return handlePush(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/changes') return handleChanges(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/deleted') return handleDeleted(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/restore') return handleRestore(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/review/revoked-records') return handleRevokedDeviceRecords(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/review/remove-revoked') return handleRemoveRevokedDeviceRecords(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/devices') return handleDevices(request, env);
  if (request.method === 'POST' && url.pathname === '/v1/devices/revoke') return handleRevokeDevice(request, env);
  if (request.method === 'GET' && url.pathname === '/v1/status') return handleStatus(request, env);
  throw new ApiError(404, 'NOT_FOUND', 'Rota não encontrada.');
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      if (error instanceof ApiError) {
        return json({ ok: false, error: error.code, message: error.message }, error.status);
      }
      console.error('DIGICOPY_API_ERROR', error);
      return json({ ok: false, error: 'INTERNAL_ERROR', message: 'Erro interno da API.' }, 500);
    }
  }
};

export const __test = { cleanText, sha256, sameSecret, randomToken, publicRecord };
