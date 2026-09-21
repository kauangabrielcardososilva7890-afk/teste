/* ═══════════════════════════════════════════════════════════════════════════
 * MOTOR DA NUVEM — DIGICOPY Cloud API (arquivo pronto para COLAR e publicar)
 *
 * O QUE É: este é o MESMO código que o comando `wrangler deploy` publica —
 * gerado com `wrangler deploy --dry-run` (só compila, NÃO publica nada).
 * Está num arquivo só, sem precisar de Node, wrangler, token nem senha.
 *
 * COMO PUBLICAR COLANDO (plano B — o painel da Cloudflare):
 *   1) Cloudflare → Workers & Pages → digicopy-sync-api → "Edit code".
 *   2) Selecione tudo (Ctrl+A) e apague.
 *   3) Cole ESTE arquivo inteiro (na página MOTOR_NUVEM_PARA_COLAR.html tem o
 *      botão "Copiar código").
 *   4) Clique em "Deploy".
 *   5) Confira: https://digicopy-sync-api.digicopyonline.workers.dev/health
 *
 * O QUE NÃO MUDA AO COLAR: os bindings (banco D1 "digicopy-erp", balde R2
 * "digicopy-downloads", o cron das 18:30 de São Paulo) e os SECRETS (incluindo
 * SETUP_SECRET) são configuração do Worker, não ficam no código — continuam
 * iguais. O que este caminho NÃO faz é aplicar migração do banco: quem aplica é
 * o `atualizar_motor_nuvem.cmd` (esta versão não tem migração pendente).
 *
 * VERSÃO DESTE ARQUIVO: API 0.4.8 / Worker 5.26.4
 * sha256 do código (sem este cabeçalho):
 *   96161c1e9152b29f2f16cfd5af395e39ec2995b63814d0cf61b15e0c89705390
 *
 * COMO REGERAR (quando o sistema mudar — precisa de Node instalado):
 *   cd cloudflare-worker
 *   npm install
 *   npx wrangler deploy --dry-run --outdir=motor_compilado
 *   (e substituir o corpo deste arquivo pelo motor_compilado/index.js)
 * Há teste automático conferindo que as versões aqui batem com src/index.js —
 * se alguém esquecer de regerar, o teste acusa.
 * ═══════════════════════════════════════════════════════════════════════════ */

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var API_VERSION = "0.4.8";
var MAX_BODY_BYTES = 9e5;
var WORKER_VERSION = "5.26.4";
var MAX_MUTATIONS = 100;
var MAX_CHANGE_LIMIT = 500;
var ENTITY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;
var JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, x-setup-secret, x-digicopy-versao, x-digicopy-usuario-login, x-digicopy-usuario-prova",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-max-age": "86400"
};
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}
__name(json, "json");
var ApiError = class extends Error {
  static {
    __name(this, "ApiError");
  }
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
};
function cleanText(value, max = 120) {
  const text = String(value == null ? "" : value).trim();
  if (!text || text.length > max) return null;
  return text;
}
__name(cleanText, "cleanText");
function randomToken(prefix = "") {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const value = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return prefix + value;
}
__name(randomToken, "randomToken");
async function sha256(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
async function sameSecret(left, right) {
  if (!left || !right) return false;
  const [a, b] = await Promise.all([sha256(left), sha256(right)]);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
__name(sameSecret, "sameSecret");
async function readBody(request) {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new ApiError(413, "BODY_TOO_LARGE", "Conte\xFAdo maior que o permitido.");
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (_error) {
    throw new ApiError(400, "INVALID_JSON", "JSON inv\xE1lido.");
  }
}
__name(readBody, "readBody");
function bearer(request) {
  const value = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match ? match[1].trim() : null;
}
__name(bearer, "bearer");
async function authenticate(request, env) {
  const token = bearer(request);
  if (!token) throw new ApiError(401, "AUTH_REQUIRED", "Aparelho n\xE3o autenticado.");
  const tokenHash = await sha256(token);
  const device = await env.DB.prepare(
    `SELECT id, name, role, created_at AS createdAt, last_seen_at AS lastSeenAt
       FROM devices WHERE token_hash = ? AND revoked_at IS NULL AND excluido_em IS NULL LIMIT 1`
  ).bind(tokenHash).first();
  if (!device) throw new ApiError(401, "INVALID_TOKEN", "Token de aparelho inv\xE1lido ou revogado.");
  const now = Date.now();
  if (!device.lastSeenAt || now - Number(device.lastSeenAt) > 36e5) {
    await env.DB.prepare("UPDATE devices SET last_seen_at = ? WHERE id = ?").bind(now, device.id).run();
    device.lastSeenAt = now;
  }
  return device;
}
__name(authenticate, "authenticate");
async function requireAdmin(request, env) {
  const device = await authenticate(request, env);
  if (device.role !== "admin") {
    throw new ApiError(403, "ADMIN_REQUIRED", "Somente o aparelho administrador pode realizar esta a\xE7\xE3o.");
  }
  return device;
}
__name(requireAdmin, "requireAdmin");
async function requireUsuarioAdmin(request, env) {
  await authenticate(request, env);
  const login = cleanText(request.headers.get("x-digicopy-usuario-login") || "", 80).toLowerCase();
  const prova = String(request.headers.get("x-digicopy-usuario-prova") || "");
  if (!login || !prova) {
    throw new ApiError(403, "USUARIO_ADMIN_REQUERIDO", "Backups dependem do usu\xE1rio: entre no sistema com um usu\xE1rio de cargo Admin.");
  }
  const rows = await env.DB.prepare(
    "SELECT data_json FROM records WHERE entity = 'usuarios' AND deleted_at IS NULL"
  ).all();
  for (const row of rows.results || []) {
    let data = null;
    try {
      data = JSON.parse(row.data_json);
    } catch (e) {
    }
    if (!data) continue;
    if (String(data.login || "").trim().toLowerCase() !== login) continue;
    if (data.ativo === false) continue;
    const cargo = String(data.perfil || data.cargo || "").trim().toLowerCase();
    if (cargo !== "admin") continue;
    const esperado = await sha256(login + "|" + String(data.senha || ""));
    if (esperado === prova) return { login };
  }
  throw new ApiError(403, "USUARIO_ADMIN_REQUERIDO", "Somente usu\xE1rios com cargo Admin podem ver, baixar ou apagar backups \u2014 em qualquer computador.");
}
__name(requireUsuarioAdmin, "requireUsuarioAdmin");
function handlePix(url) {
  const codigo = url.searchParams.get("c") || "";
  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pagamento Pix \u2014 DIGICOPY</title>
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
<div class="card"><div class="topo"><h1>Pagamento via Pix</h1><p style="font-size:11.5px;opacity:.75;margin-top:2px">R\xE1pido, seguro e na hora</p></div>
<div class="corpo" id="area">
<p class="passo">1 Abra o aplicativo do seu banco<br>2 Escolha <b>Pix \u2192 Ler QR Code</b><br>3 Confira e confirme</p>
<img id="qr" alt="QR Code Pix">
<p class="passo" style="margin-top:10px">Ou copie o c\xF3digo e cole no banco:</p>
<textarea id="codigo" rows="5" readonly onclick="this.select()"></textarea>
<button id="btn">Copiar c\xF3digo Pix</button>
<p class="dica">Pagamento identificado pela DIGICOPY.</p>
</div></div>
<script>
(function(){
  var codigo=${JSON.stringify(codigo)};
  if(!codigo || codigo.indexOf('000201')!==0 || codigo.length>1024 || codigo.indexOf('br.gov.bcb.pix')<0){
    document.getElementById('area').innerHTML='<p class="erro">Link de pagamento inv\xE1lido ou incompleto.<br>Pe\xE7a a notinha atualizada para a loja.</p>';
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
<\/script></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "access-control-allow-origin": "*"
    }
  });
}
__name(handlePix, "handlePix");
async function handleHealth(env) {
  let database = "not-bound";
  let schemaVersion = null;
  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1 AS ok").first();
      database = "ok";
      try {
        const row = await env.DB.prepare(
          "SELECT value FROM system_meta WHERE key = 'schema_version' LIMIT 1"
        ).first();
        schemaVersion = row ? row.value : null;
      } catch (_schemaError) {
        schemaVersion = null;
      }
    } catch (_error) {
      database = "error";
    }
  }
  return json({
    ok: true,
    service: "digicopy-sync-api",
    version: API_VERSION,
    database,
    schemaVersion,
    setupConfigured: !!env.SETUP_SECRET,
    versao: WORKER_VERSION,
    ready: database === "ok" && schemaVersion === "2" && !!env.SETUP_SECRET,
    message: database === "ok" ? schemaVersion ? "API e banco D1 dispon\xEDveis." : "Banco vinculado; migra\xE7\xE3o pendente." : "API dispon\xEDvel; banco D1 ainda n\xE3o vinculado."
  });
}
__name(handleHealth, "handleHealth");
async function handleSetup(request, env) {
  if (!env.SETUP_SECRET) {
    throw new ApiError(503, "SETUP_NOT_CONFIGURED", "Segredo de ativa\xE7\xE3o ainda n\xE3o configurado.");
  }
  const supplied = request.headers.get("x-setup-secret");
  if (!await sameSecret(supplied, env.SETUP_SECRET)) {
    throw new ApiError(403, "INVALID_SETUP_SECRET", "Segredo de ativa\xE7\xE3o incorreto.");
  }
  const existing = await env.DB.prepare("SELECT COUNT(*) AS total FROM devices WHERE excluido_em IS NULL").first();
  if (Number(existing && existing.total) > 0) {
    throw new ApiError(409, "ALREADY_INITIALIZED", "A nuvem j\xE1 possui um aparelho administrador.");
  }
  const body = await readBody(request);
  const name = cleanText(body.deviceName, 80);
  if (!name) throw new ApiError(400, "DEVICE_NAME_REQUIRED", "Informe o nome do aparelho.");
  const id = crypto.randomUUID();
  const token = randomToken("dcp_");
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
    activation: "initial",
    device: { id, name, role: "admin" },
    token,
    warning: "Este token \xE9 exibido uma \xFAnica vez. Guarde-o somente no aparelho autorizado."
  }, 201);
}
__name(handleSetup, "handleSetup");
async function handleCreateInvite(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  const minutes = Math.min(60, Math.max(5, Number(body.minutes) || 15));
  const role = body.role === "admin" ? "admin" : "device";
  const code = randomToken("join_");
  const codeHash = await sha256(code);
  const now = Date.now();
  const expiresAt = now + minutes * 6e4;
  await env.DB.prepare(
    `INSERT INTO enrollment_codes(code_hash, created_by, expires_at, uses_left, created_at, role)
     VALUES (?, ?, ?, 1, ?, ?)`
  ).bind(codeHash, admin.id, expiresAt, now, role).run();
  return json({ ok: true, code, expiresAt, uses: 1, role }, 201);
}
__name(handleCreateInvite, "handleCreateInvite");
async function handleEnroll(request, env) {
  const body = await readBody(request);
  const code = cleanText(body.code, 200);
  const name = cleanText(body.deviceName, 80);
  if (!code || !name) {
    throw new ApiError(400, "ENROLL_DATA_REQUIRED", "Informe o c\xF3digo e o nome do aparelho.");
  }
  const codeHash = await sha256(code);
  const now = Date.now();
  const invitation = await env.DB.prepare(
    `SELECT role, created_by FROM enrollment_codes
     WHERE code_hash = ? AND uses_left > 0 AND expires_at > ? LIMIT 1`
  ).bind(codeHash, now).first();
  if (!invitation) {
    throw new ApiError(403, "INVALID_ENROLL_CODE", "C\xF3digo inv\xE1lido, expirado ou j\xE1 utilizado.");
  }
  const claim = await env.DB.prepare(
    `UPDATE enrollment_codes SET uses_left = uses_left - 1
     WHERE code_hash = ? AND uses_left > 0 AND expires_at > ?`
  ).bind(codeHash, now).run();
  if (!claim.meta || Number(claim.meta.changes) !== 1) {
    throw new ApiError(403, "INVALID_ENROLL_CODE", "C\xF3digo inv\xE1lido, expirado ou j\xE1 utilizado.");
  }
  const role = invitation.role === "admin" ? "admin" : "device";
  const id = crypto.randomUUID();
  const token = randomToken("dcp_");
  const tokenHash = await sha256(token);
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO devices(id, name, token_hash, role, created_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(id, name, tokenHash, role, now, now),
      env.DB.prepare("DELETE FROM enrollment_codes WHERE code_hash = ? OR expires_at <= ?").bind(codeHash, now),
      env.DB.prepare(
        `INSERT INTO device_events(event_type, device_id, actor_id, details_json, created_at)
         VALUES ('device_enrolled', ?, ?, ?, ?)`
      ).bind(id, invitation.created_by, JSON.stringify({ name, role }), now)
    ]);
  } catch (error) {
    throw new ApiError(500, "ENROLL_FAILED", "N\xE3o foi poss\xEDvel autorizar o aparelho. Gere outro c\xF3digo.");
  }
  return json({ ok: true, activation: "invite", device: { id, name, role }, token }, 201);
}
__name(handleEnroll, "handleEnroll");
async function handleRecovery(request, env) {
  if (!env.SETUP_SECRET) {
    throw new ApiError(503, "RECOVERY_NOT_CONFIGURED", "Segredo de recupera\xE7\xE3o n\xE3o configurado.");
  }
  const supplied = request.headers.get("x-setup-secret");
  if (!await sameSecret(supplied, env.SETUP_SECRET)) {
    throw new ApiError(403, "INVALID_SETUP_SECRET", "Segredo de recupera\xE7\xE3o incorreto.");
  }
  const body = await readBody(request);
  const name = cleanText(body.deviceName, 80);
  if (!name) throw new ApiError(400, "DEVICE_NAME_REQUIRED", "Informe o nome do aparelho.");
  const id = crypto.randomUUID();
  const token = randomToken("dcp_");
  const tokenHash = await sha256(token);
  const now = Date.now();
  const recent = await env.DB.prepare(
    `SELECT created_at FROM device_events
     WHERE event_type = 'admin_recovery' ORDER BY id DESC LIMIT 1`
  ).first();
  if (recent && now - Number(recent.created_at) < 6e5) {
    throw new ApiError(429, "RECOVERY_COOLDOWN", "Aguarde 10 minutos antes de outra recupera\xE7\xE3o.");
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
    activation: "recovery",
    device: { id, name, role: "admin" },
    token,
    warning: "Recupera\xE7\xE3o conclu\xEDda. Troque o SETUP_SECRET se ela n\xE3o foi planejada."
  }, 201);
}
__name(handleRecovery, "handleRecovery");
function parseDataJson(value) {
  if (value == null) return null;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}
__name(parseDataJson, "parseDataJson");
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
__name(publicRecord, "publicRecord");
function activityLabel(dataJson, recordId, entity) {
  if (entity === "config") return "Configura\xE7\xE3o";
  const data = parseDataJson(dataJson) || {};
  const raw = data.nome || data.fantasia || data.numero || data.login || data.descricao || data.sku || data.modelo || "";
  const text = String(raw).trim();
  return text ? text.slice(0, 80) : String(recordId || "");
}
__name(activityLabel, "activityLabel");
async function applyMutation(env, device, mutation) {
  const mutationId = cleanText(mutation && mutation.mutationId, 120);
  const entity = cleanText(mutation && mutation.entity, 64);
  const recordId = cleanText(mutation && mutation.recordId, 160);
  const operation = mutation && mutation.operation;
  const baseVersion = Number(mutation && mutation.baseVersion);
  if (!mutationId || !entity || !ENTITY_RE.test(entity) || !recordId || !["upsert", "delete"].includes(operation) || !Number.isInteger(baseVersion) || baseVersion < 0) {
    throw new ApiError(400, "INVALID_MUTATION", "Altera\xE7\xE3o inv\xE1lida.");
  }
  const duplicate = await env.DB.prepare(
    `SELECT seq, entity, record_id, operation, data_json, version, device_id, created_at
       FROM changes WHERE mutation_id = ? LIMIT 1`
  ).bind(mutationId).first();
  if (duplicate) {
    return { ok: true, duplicate: true, seq: Number(duplicate.seq), version: Number(duplicate.version) };
  }
  const current = await env.DB.prepare(
    "SELECT * FROM records WHERE entity = ? AND record_id = ? LIMIT 1"
  ).bind(entity, recordId).first();
  const currentVersion = current ? Number(current.version) : 0;
  if (currentVersion !== baseVersion) {
    return { ok: false, conflict: true, current: publicRecord(current) };
  }
  let dataJson = null;
  if (operation === "upsert") {
    if (!mutation.data || typeof mutation.data !== "object" || Array.isArray(mutation.data)) {
      throw new ApiError(400, "INVALID_RECORD_DATA", "O registro precisa ser um objeto JSON.");
    }
    dataJson = JSON.stringify(mutation.data);
    if (new TextEncoder().encode(dataJson).byteLength > 7e5) {
      throw new ApiError(413, "RECORD_TOO_LARGE", "Registro maior que o permitido.");
    }
  } else if (current && current.data_json) {
    dataJson = current.data_json;
  }
  if (current && operation === "upsert" && current.data_json === dataJson && current.deleted_at === null) {
    return { ok: true, duplicate: true, noop: true, version: currentVersion };
  }
  if (current && operation === "delete" && current.deleted_at !== null) {
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
    ).bind(entity, recordId, dataJson, now, operation === "delete" ? now : null, device.id);
  } else {
    recordStatement = env.DB.prepare(
      `UPDATE records SET data_json = ?, version = version + 1, updated_at = ?,
       deleted_at = ?, updated_by = ?
       WHERE entity = ? AND record_id = ? AND version = ?`
    ).bind(
      dataJson,
      now,
      operation === "delete" ? now : null,
      device.id,
      entity,
      recordId,
      baseVersion
    );
  }
  const changeStatement = env.DB.prepare(
    `INSERT INTO changes
     (mutation_id, entity, record_id, operation, data_json, version, device_id, created_at)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?
     WHERE EXISTS (
       SELECT 1 FROM records
       WHERE entity = ? AND record_id = ? AND version = ?
         AND updated_at = ? AND updated_by = ?
     )`
  ).bind(
    mutationId,
    entity,
    recordId,
    operation,
    dataJson,
    newVersion,
    device.id,
    now,
    entity,
    recordId,
    newVersion,
    now,
    device.id
  );
  let transaction;
  try {
    transaction = await env.DB.batch([recordStatement, changeStatement]);
  } catch (error) {
    const racedDuplicate = await env.DB.prepare(
      "SELECT seq, version FROM changes WHERE mutation_id = ? LIMIT 1"
    ).bind(mutationId).first();
    if (racedDuplicate) {
      return { ok: true, duplicate: true, seq: Number(racedDuplicate.seq), version: Number(racedDuplicate.version) };
    }
    throw new ApiError(500, "ATOMIC_WRITE_FAILED", "A altera\xE7\xE3o n\xE3o foi gravada; ser\xE1 seguro tentar novamente.");
  }
  const wroteRecord = transaction[0] && transaction[0].meta && Number(transaction[0].meta.changes) === 1;
  const wroteChange = transaction[1] && transaction[1].meta && Number(transaction[1].meta.changes) === 1;
  if (!wroteRecord || !wroteChange) {
    const latest = await env.DB.prepare(
      "SELECT * FROM records WHERE entity = ? AND record_id = ? LIMIT 1"
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
__name(applyMutation, "applyMutation");
async function handlePush(request, env, ctx) {
  const device = await authenticate(request, env);
  try {
    await checarTrocaDeVersao(request, env, ctx);
  } catch (e) {
    console.error("BACKUP_VERSAO_CHECAR_FALHOU", e);
  }
  const body = await readBody(request);
  const mutations = body.mutations;
  somarUso(env, Array.isArray(mutations) ? Math.max(1, mutations.length) : 1, 0, ctx);
  if (!Array.isArray(mutations) || mutations.length < 1 || mutations.length > MAX_MUTATIONS) {
    throw new ApiError(400, "INVALID_MUTATION_BATCH", `Envie de 1 a ${MAX_MUTATIONS} altera\xE7\xF5es.`);
  }
  const LIMITE_ESCRITA_DIA = 95e3;
  try {
    const usoAgora = await env.DB.prepare("SELECT escritas AS w FROM uso_diario WHERE dia = ?").bind(hojeUTC()).first();
    const escritasAteAgora = Number(usoAgora && usoAgora.w || 0);
    const estimativaDesteLote = mutations.length * 2;
    if (escritasAteAgora + estimativaDesteLote > LIMITE_ESCRITA_DIA) {
      return json({ ok: false, quota: true, error: "pre-stop DIGICOPY: daily row write limit pr\xF3ximo do teto \u2014 envio pausado at\xE9 a virada do dia (por volta das 21h); as mudan\xE7as ficam guardadas neste PC." }, 429);
    }
  } catch (eFreio) {
    console.error("FREIO_COTA_FALHOU", eFreio);
  }
  const results = [];
  for (let index = 0; index < mutations.length; index++) {
    try {
      results.push({ index, ...await applyMutation(env, device, mutations[index]) });
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) {
        results.push({ index, ok: false, error: error.code, message: error.message });
      } else {
        throw error;
      }
    }
  }
  return json({ ok: results.every((item) => item.ok), results });
}
__name(handlePush, "handlePush");
async function handleChanges(request, env, ctx) {
  await authenticate(request, env);
  const url = new URL(request.url);
  const cursor = Math.max(0, Number.parseInt(url.searchParams.get("cursor") || "0", 10) || 0);
  somarUso(env, 0, 60, ctx);
  const limit = Math.min(
    MAX_CHANGE_LIMIT,
    Math.max(1, Number.parseInt(url.searchParams.get("limit") || "200", 10) || 200)
  );
  const query = await env.DB.prepare(
    `SELECT seq, mutation_id, entity, record_id, operation, data_json, version, device_id, created_at
       FROM changes WHERE seq > ? ORDER BY seq ASC LIMIT ?`
  ).bind(cursor, limit + 1).all();
  const rows = query.results || [];
  const hasMore = rows.length > limit;
  const selected = hasMore ? rows.slice(0, limit) : rows;
  const changes = selected.map((row) => ({
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
__name(handleChanges, "handleChanges");
async function handleDeleted(request, env) {
  await requireAdmin(request, env);
  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "100", 10) || 100));
  const rows = await env.DB.prepare(
    `SELECT * FROM records WHERE deleted_at IS NOT NULL
     ORDER BY deleted_at DESC LIMIT ?`
  ).bind(limit).all();
  return json({ ok: true, records: (rows.results || []).map(publicRecord) });
}
__name(handleDeleted, "handleDeleted");
async function handleRestore(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  const entity = cleanText(body.entity, 64);
  const recordId = cleanText(body.recordId, 160);
  if (!entity || !ENTITY_RE.test(entity) || !recordId) {
    throw new ApiError(400, "INVALID_RECORD", "Registro inv\xE1lido.");
  }
  const current = await env.DB.prepare(
    "SELECT * FROM records WHERE entity = ? AND record_id = ? LIMIT 1"
  ).bind(entity, recordId).first();
  if (!current || current.deleted_at == null || !current.data_json) {
    throw new ApiError(404, "DELETED_RECORD_NOT_FOUND", "Registro exclu\xEDdo n\xE3o encontrado.");
  }
  const result = await applyMutation(env, admin, {
    mutationId: cleanText(body.mutationId, 120) || "restore_" + crypto.randomUUID(),
    entity,
    recordId,
    operation: "upsert",
    baseVersion: Number(current.version),
    data: parseDataJson(current.data_json)
  });
  if (!result.ok) return json({ ok: false, ...result }, 409);
  return json({ ok: true, restored: true, ...result });
}
__name(handleRestore, "handleRestore");
function clientIdentityTokens(dataJson) {
  const data = parseDataJson(dataJson) || {};
  const tokens = [];
  const code = String(data.codigo == null ? "" : data.codigo).replace(/\D/g, "").replace(/^0+/, "");
  const doc = String(data.documento == null ? "" : data.documento).replace(/\D/g, "");
  if (code && code !== "0") tokens.push("codigo:" + code);
  if (doc.length >= 8) tokens.push("documento:" + doc);
  return tokens;
}
__name(clientIdentityTokens, "clientIdentityTokens");
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
  const tokens = /* @__PURE__ */ new Set();
  for (const row of rows.results || []) for (const token of clientIdentityTokens(row.data_json)) tokens.add(token);
  return tokens;
}
__name(deletedActiveOriginTokens, "deletedActiveOriginTokens");
async function handleRevokedDeviceRecords(request, env) {
  await requireAdmin(request, env);
  const url = new URL(request.url);
  const entity = cleanText(url.searchParams.get("entity") || "clientes", 64);
  if (!entity || !ENTITY_RE.test(entity)) throw new ApiError(400, "INVALID_ENTITY", "Entidade inv\xE1lida.");
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
  const protectedTokens = entity === "clientes" ? await deletedActiveOriginTokens(env, entity) : /* @__PURE__ */ new Set();
  const records = [], kept = [];
  for (const row of rows.results || []) {
    const item = { ...publicRecord(row), sourceDevice: row.source_device };
    const isReplacement = clientIdentityTokens(row.data_json).some((token) => protectedTokens.has(token));
    if (isReplacement) kept.push({ ...item, reason: "substituiu cadastro original durante a uni\xE3o" });
    else records.push(item);
  }
  return json({ ok: true, entity, records, kept, totalFromBlocked: records.length + kept.length });
}
__name(handleRevokedDeviceRecords, "handleRevokedDeviceRecords");
async function handleRemoveRevokedDeviceRecords(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  const entity = cleanText(body.entity || "clientes", 64);
  const ids = Array.isArray(body.recordIds) ? [...new Set(body.recordIds.map((x) => cleanText(x, 160)).filter(Boolean))] : [];
  if (!entity || !ENTITY_RE.test(entity) || !ids.length || ids.length > 100) {
    throw new ApiError(400, "INVALID_REVIEW_BATCH", "Sele\xE7\xE3o inv\xE1lida para limpeza.");
  }
  const protectedTokens = entity === "clientes" ? await deletedActiveOriginTokens(env, entity) : /* @__PURE__ */ new Set();
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
    if (!current) {
      results.push({ recordId, ok: false, skipped: true, reason: "origem n\xE3o autorizada" });
      continue;
    }
    if (clientIdentityTokens(current.data_json).some((token) => protectedTokens.has(token))) {
      results.push({ recordId, ok: false, skipped: true, reason: "cadastro mantido substitui original unido" });
      continue;
    }
    const result = await applyMutation(env, admin, {
      mutationId: "cleanup_" + crypto.randomUUID(),
      entity,
      recordId,
      operation: "delete",
      baseVersion: Number(current.version)
    });
    results.push({ recordId, ...result });
  }
  return json({ ok: results.every((x) => x.ok || x.skipped), removed: results.filter((x) => x.ok).length, results });
}
__name(handleRemoveRevokedDeviceRecords, "handleRemoveRevokedDeviceRecords");
async function handleDevices(request, env) {
  const admin = await requireAdmin(request, env);
  const [rows, lasts, grouped] = await env.DB.batch([
    env.DB.prepare(
      `SELECT d.id, d.name, d.role, d.created_at AS createdAt,
              d.last_seen_at AS lastSeenAt, d.revoked_at AS revokedAt,
              (SELECT COUNT(*) FROM records r WHERE r.updated_by = d.id AND r.deleted_at IS NULL) AS activeRecords,
              (SELECT COUNT(*) FROM changes c WHERE c.device_id = d.id) AS totalChanges
       FROM devices d WHERE d.excluido_em IS NULL ORDER BY d.revoked_at IS NOT NULL, d.created_at ASC`
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
  for (const row of lasts.results || []) lastMap[row.deviceId] = row;
  const entityMap = {};
  for (const row of grouped.results || []) {
    if (!entityMap[row.deviceId]) entityMap[row.deviceId] = {};
    entityMap[row.deviceId][row.entity] = Number(row.active) || 0;
  }
  const devices = (rows.results || []).map((device) => {
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
__name(handleDevices, "handleDevices");
async function handleActivity(request, env) {
  await requireAdmin(request, env);
  const url = new URL(request.url);
  const limit = Math.min(80, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "40", 10) || 40));
  const deviceId = cleanText(url.searchParams.get("deviceId") || "", 80);
  const query = deviceId ? await env.DB.prepare(
    `SELECT c.seq, c.entity, c.record_id, c.operation, c.created_at, c.device_id, c.data_json, d.name AS device_name
         FROM changes c LEFT JOIN devices d ON d.id = c.device_id
        WHERE c.device_id = ? ORDER BY c.seq DESC LIMIT ?`
  ).bind(deviceId, limit).all() : await env.DB.prepare(
    `SELECT c.seq, c.entity, c.record_id, c.operation, c.created_at, c.device_id, c.data_json, d.name AS device_name
         FROM changes c LEFT JOIN devices d ON d.id = c.device_id
        ORDER BY c.seq DESC LIMIT ?`
  ).bind(limit).all();
  const events = (query.results || []).map((row) => ({
    seq: Number(row.seq),
    entity: row.entity,
    recordId: row.record_id,
    operation: row.operation,
    createdAt: Number(row.created_at),
    deviceId: row.device_id,
    deviceName: row.device_name || "Aparelho",
    label: activityLabel(row.data_json, row.record_id, row.entity)
  }));
  return json({ ok: true, events });
}
__name(handleActivity, "handleActivity");
async function handleDeleteDevice(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  const deviceId = cleanText(body.deviceId, 80);
  if (!deviceId) throw new ApiError(400, "DEVICE_ID_REQUIRED", "Informe o aparelho.");
  if (deviceId === admin.id) throw new ApiError(400, "CANNOT_DELETE_SELF", "Este computador n\xE3o pode apagar a si mesmo.");
  const result = await env.DB.prepare(
    "UPDATE devices SET excluido_em = ?, revoked_at = COALESCE(revoked_at, ?) WHERE id = ? AND excluido_em IS NULL"
  ).bind(Date.now(), Date.now(), deviceId).run();
  if (!result.meta || Number(result.meta.changes) !== 1) {
    throw new ApiError(404, "DEVICE_NOT_FOUND", "Aparelho n\xE3o encontrado na nuvem (ou j\xE1 exclu\xEDdo).");
  }
  return json({ ok: true, deleted: deviceId });
}
__name(handleDeleteDevice, "handleDeleteDevice");
async function handleRevokeDevice(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  const deviceId = cleanText(body.deviceId, 80);
  if (!deviceId) throw new ApiError(400, "DEVICE_ID_REQUIRED", "Informe o aparelho.");
  if (deviceId === admin.id) {
    throw new ApiError(400, "CANNOT_REVOKE_SELF", "Este computador n\xE3o pode bloquear a pr\xF3pria autoriza\xE7\xE3o.");
  }
  const now = Date.now();
  const result = await env.DB.prepare(
    "UPDATE devices SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL"
  ).bind(now, deviceId).run();
  if (!result.meta || Number(result.meta.changes) !== 1) {
    throw new ApiError(404, "DEVICE_NOT_FOUND", "Aparelho n\xE3o encontrado ou j\xE1 bloqueado.");
  }
  await env.DB.prepare(
    `INSERT INTO device_events(event_type, device_id, actor_id, details_json, created_at)
     VALUES ('device_revoked', ?, ?, NULL, ?)`
  ).bind(deviceId, admin.id, now).run();
  return json({ ok: true, revoked: true, deviceId, revokedAt: now });
}
__name(handleRevokeDevice, "handleRevokeDevice");
async function handleResetCloud(request, env) {
  const admin = await requireAdmin(request, env);
  const body = await readBody(request);
  if (body.confirmation !== "APAGAR NUVEM") {
    throw new ApiError(400, "RESET_CONFIRMATION_REQUIRED", "Digite APAGAR NUVEM para confirmar.");
  }
  const active = await env.DB.prepare(
    "SELECT COUNT(*) AS total FROM devices WHERE revoked_at IS NULL AND excluido_em IS NULL"
  ).first();
  if (Number(active && active.total) !== 1) {
    throw new ApiError(409, "RESET_REQUIRES_SINGLE_DEVICE", "Bloqueie os outros aparelhos antes de zerar a nuvem.");
  }
  const [recordCount, changeCount] = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS total FROM records"),
    env.DB.prepare("SELECT COUNT(*) AS total FROM changes")
  ]);
  const agoraSp = /* @__PURE__ */ new Date();
  await gerarBackup(env, "Backup seguranca/Backup antes de zerar a nuvem " + dataArquivoSP(agoraSp) + " " + horaArquivoSP(agoraSp) + ".json", { tipo: "seguranca" });
  const now = Date.now();
  const generation = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM enrollment_codes"),
    env.DB.prepare("DELETE FROM changes"),
    env.DB.prepare("DELETE FROM records"),
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
__name(handleResetCloud, "handleResetCloud");
var RESUMO_VALE_POR = 10 * 60 * 1e3;
async function resumoDaNuvem(env) {
  try {
    const linha = await env.DB.prepare("SELECT value FROM system_meta WHERE key = 'resumo_json' LIMIT 1").first();
    if (linha && linha.value) {
      const guardado = JSON.parse(linha.value);
      if (guardado && Date.now() - Number(guardado.em || 0) < RESUMO_VALE_POR) return guardado.totais;
    }
  } catch (error) {
    console.error("DIGICOPY_RESUMO_LEITURA", error);
  }
  const totais = { devices: 0, records: 0, deleted: 0, cursor: 0, byEntity: {} };
  try {
    const grouped = await env.DB.prepare(`SELECT entity,
      SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS deleted
      FROM records GROUP BY entity ORDER BY entity`).all();
    for (const row of grouped.results || []) {
      const ativos = Number(row.active) || 0, apagados = Number(row.deleted) || 0;
      totais.byEntity[row.entity] = { active: ativos, deleted: apagados };
      totais.records += ativos;
      totais.deleted += apagados;
    }
  } catch (error) {
    console.error("DIGICOPY_RESUMO_AGRUPADO", error);
    return null;
  }
  try {
    const devices = await env.DB.prepare("SELECT COUNT(*) AS total FROM devices WHERE revoked_at IS NULL AND excluido_em IS NULL").first();
    totais.devices = Number(devices && devices.total) || 0;
    const changes = await env.DB.prepare("SELECT COALESCE(MAX(seq), 0) AS total FROM changes").first();
    totais.cursor = Number(changes && changes.total) || 0;
  } catch (error) {
    console.error("DIGICOPY_RESUMO_PARCIAL", error);
  }
  try {
    await env.DB.prepare(
      `INSERT INTO system_meta(key, value, updated_at) VALUES ('resumo_json', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).bind(JSON.stringify({ em: Date.now(), totais }), Date.now()).run();
  } catch (error) {
    console.error("DIGICOPY_RESUMO_GRAVACAO", error);
  }
  return totais;
}
__name(resumoDaNuvem, "resumoDaNuvem");
var __USO_TABELA_OK = false;
var ultimoErroUso = "";
async function garantirTabelaAppVersao(env) {
  if (env.__APP_VERSAO_TABELA_OK) return;
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS app_versao (id INTEGER PRIMARY KEY CHECK (id = 1), versao TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '', notas TEXT NOT NULL DEFAULT '', publicado_em INTEGER NOT NULL DEFAULT 0)`);
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS app_releases (versao TEXT PRIMARY KEY, url TEXT NOT NULL DEFAULT '', notas TEXT NOT NULL DEFAULT '', publicado_em INTEGER NOT NULL DEFAULT 0)`);
  const addCol = /* @__PURE__ */ __name(async (sql) => {
    try {
      await env.DB.exec(sql);
    } catch (e) {
    }
  }, "addCol");
  await addCol(`ALTER TABLE app_releases ADD COLUMN ativa INTEGER NOT NULL DEFAULT 1`);
  await addCol(`ALTER TABLE app_releases ADD COLUMN oculta INTEGER NOT NULL DEFAULT 0`);
  await addCol(`ALTER TABLE app_releases ADD COLUMN tutorial TEXT NOT NULL DEFAULT ''`);
  await addCol(`ALTER TABLE app_releases ADD COLUMN expira_em INTEGER NOT NULL DEFAULT 0`);
  await addCol(`ALTER TABLE app_releases ADD COLUMN tem_arquivo INTEGER NOT NULL DEFAULT 0`);
  await addCol(`ALTER TABLE app_releases ADD COLUMN destino_tipo TEXT NOT NULL DEFAULT 'todos'`);
  await addCol(`ALTER TABLE app_releases ADD COLUMN destino_cnpjs TEXT NOT NULL DEFAULT '[]'`);
  await addCol(`ALTER TABLE app_releases ADD COLUMN slug TEXT NOT NULL DEFAULT ''`);
  await addCol(`ALTER TABLE app_releases ADD COLUMN imagens TEXT NOT NULL DEFAULT '[]'`);
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS connect_secrets (id TEXT PRIMARY KEY, conn_hash TEXT NOT NULL DEFAULT '', gerente_hash TEXT NOT NULL DEFAULT '', owner_cnpj TEXT NOT NULL DEFAULT '', owner_nome TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT 0)`);
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS empresas (cnpj TEXT PRIMARY KEY, nome TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT 0, last_seen_at INTEGER NOT NULL DEFAULT 0)`);
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS site_sessions (token TEXT PRIMARY KEY, cnpj TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL DEFAULT 0)`);
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS gerente_sessions (token TEXT PRIMARY KEY, cnpj TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL DEFAULT 0)`);
  env.__APP_VERSAO_TABELA_OK = true;
}
__name(garantirTabelaAppVersao, "garantirTabelaAppVersao");
function soDigitos(v) {
  return String(v == null ? "" : v).replace(/\D+/g, "");
}
__name(soDigitos, "soDigitos");
function cnpjValido(cnpj) {
  return /^\d{14}$/.test(cnpj);
}
__name(cnpjValido, "cnpjValido");
async function senhaHash(env, cnpj, senha) {
  const pepper = env && env.SETUP_SECRET || "digicopy";
  return sha256(pepper + "|" + soDigitos(cnpj) + "|" + String(senha || ""));
}
__name(senhaHash, "senhaHash");
async function lerSegredos(env) {
  await garantirTabelaAppVersao(env);
  const r = await env.DB.prepare(`SELECT conn_hash, gerente_hash, owner_cnpj, owner_nome FROM connect_secrets WHERE id = 'main'`).first();
  return r || null;
}
__name(lerSegredos, "lerSegredos");
async function conferirSenha(env, cnpj, senha, campo) {
  const seg = await lerSegredos(env);
  if (!seg || !seg[campo]) return false;
  return await senhaHash(env, cnpj, senha) === seg[campo];
}
__name(conferirSenha, "conferirSenha");
async function upsertEmpresa(env, cnpj, nome) {
  cnpj = soDigitos(cnpj);
  if (!cnpjValido(cnpj)) return;
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO empresas (cnpj, nome, created_at, last_seen_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(cnpj) DO UPDATE SET nome = CASE WHEN excluded.nome <> '' THEN excluded.nome ELSE empresas.nome END,
    last_seen_at = excluded.last_seen_at`).bind(cnpj, String(nome || "").slice(0, 120), now, now).run();
}
__name(upsertEmpresa, "upsertEmpresa");
function destinoOk(r, cnpj) {
  const tipo = String(r && r.destino_tipo || r && r.destinoTipo || "todos");
  if (tipo === "todos") return true;
  if (!cnpj) return false;
  if (tipo === "so_loja") return !!r.ownerCnpj ? cnpj === r.ownerCnpj : true;
  try {
    const lista = Array.isArray(r.destino_cnpjs) ? r.destino_cnpjs : JSON.parse(String(r.destino_cnpjs || r.destinoCnpjs || "[]"));
    return lista.map(soDigitos).indexOf(cnpj) >= 0;
  } catch (e) {
    return false;
  }
}
__name(destinoOk, "destinoOk");
function linkSlug(origin, slug) {
  return origin + "/a/" + encodeURIComponent(slug);
}
__name(linkSlug, "linkSlug");
async function sessaoSite(request, env) {
  const cookie = String(request.headers.get("cookie") || "");
  const m = cookie.match(/(?:^|;\s*)site_sess=([A-Za-z0-9_.-]+)/);
  if (!m) return null;
  await garantirTabelaAppVersao(env);
  const now = Date.now();
  const r = await env.DB.prepare("SELECT cnpj, expires_at FROM site_sessions WHERE token = ?").bind(m[1]).first();
  if (!r || r.expires_at <= now) return null;
  return { cnpj: r.cnpj };
}
__name(sessaoSite, "sessaoSite");
async function gerenteDaRequisicao(request, env) {
  const tok = cleanText(request.headers.get("x-gerente-token") || "", 200);
  if (!tok) return null;
  await garantirTabelaAppVersao(env);
  const now = Date.now();
  const r = await env.DB.prepare("SELECT cnpj, expires_at FROM gerente_sessions WHERE token = ?").bind(tok).first();
  if (!r || r.expires_at <= now) return null;
  return { cnpj: r.cnpj };
}
__name(gerenteDaRequisicao, "gerenteDaRequisicao");
async function requireAdminOuGerente(request, env) {
  try {
    return await requireAdmin(request, env);
  } catch (e) {
  }
  const g = await gerenteDaRequisicao(request, env);
  if (!g) throw new ApiError(403, "GERENTE_OU_ADMIN_REQUERIDO", "A\xE7\xE3o permitida somente ao gerente de atualiza\xE7\xF5es ou ao aparelho administrador.");
  return g;
}
__name(requireAdminOuGerente, "requireAdminOuGerente");
function paginaLoginSite(msg) {
  const aviso = msg ? `<p style="margin-top:12px;color:#b91c1c;font-weight:700;font-size:13px">${msg}</p>` : "";
  return new Response(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DigiCopy Downloads \u2014 Entrar</title><style>
  *{box-sizing:border-box;margin:0}body{font-family:system-ui,'Segoe UI',Roboto,sans-serif;background:linear-gradient(160deg,#eef2ff,#f8fafc 55%,#ecfeff);min-height:100vh;display:grid;place-items:center;padding:20px}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:22px;padding:30px 26px;max-width:400px;width:100%;box-shadow:0 24px 70px rgba(10,30,138,.14)}
  .icone{width:60px;height:60px;margin:0 auto 12px;border-radius:18px;background:#0a1e8a;display:grid;place-items:center;color:#fff;font-size:28px}
  h1{font-size:19px;color:#0a1e8a;text-align:center;margin:0 0 4px}p.sub{font-size:12.5px;color:#64748b;text-align:center;margin-bottom:16px}
  label{display:block;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;margin:12px 0 5px;letter-spacing:.4px}
  input{width:100%;height:46px;border:1px solid #cbd5e1;border-radius:12px;padding:0 14px;font-size:15px}
  button{width:100%;margin-top:18px;height:50px;border:0;border-radius:14px;background:#0a1e8a;color:#fff;font-weight:900;font-size:15px;cursor:pointer}
  .nota{margin-top:14px;font-size:11px;color:#94a3b8;text-align:center}</style></head><body>
  <form class="card" method="POST" action="/v1/site-login">
  <div class="icone">\u2B07</div><h1>Downloads DigiCopy</h1><p class="sub">\xC1rea restrita \u2014 entre com o CNPJ e a senha de conex\xE3o da loja.</p>
  <label>CNPJ (somente n\xFAmeros)</label><input name="cnpj" inputmode="numeric" autocomplete="off" placeholder="00.000.000/0000-00" required>
  <label>Senha de conex\xE3o</label><input name="senha" type="password" autocomplete="off" required>
  ${aviso}
  <button type="submit">Entrar</button>
  <p class="nota">O acesso fica lembrado neste navegador por 30 dias. Esqueceu a senha? Pe\xE7a ao administrador do sistema.</p>
  </form></body></html>`, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}
__name(paginaLoginSite, "paginaLoginSite");
async function garantirTabelaUso(env) {
  if (__USO_TABELA_OK) return;
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS uso_diario (dia TEXT PRIMARY KEY, escritas INTEGER NOT NULL DEFAULT 0, leituras INTEGER NOT NULL DEFAULT 0)`);
  __USO_TABELA_OK = true;
}
__name(garantirTabelaUso, "garantirTabelaUso");
function hojeUTC() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
__name(hojeUTC, "hojeUTC");
async function _somar(env, escritas, leituras) {
  try {
    await garantirTabelaUso(env);
    await env.DB.prepare(
      `INSERT INTO uso_diario(dia, escritas, leituras) VALUES (?, ?, ?)
         ON CONFLICT(dia) DO UPDATE SET escritas = escritas + ?, leituras = leituras + ?`
    ).bind(hojeUTC(), escritas, leituras, escritas, leituras).run();
  } catch (e) {
    ultimoErroUso = String(e && e.message || e);
    console.error("USO_DIARIO_FALHOU", e);
  }
}
__name(_somar, "_somar");
var __USO_PEND = { esc: 0, lei: 0, desde: 0 };
function somarUso(env, escritas, leituras, ctx) {
  const agora = Date.now();
  __USO_PEND.esc += Math.max(0, Number(escritas) || 0);
  __USO_PEND.lei += Math.max(0, Number(leituras) || 0);
  if (!__USO_PEND.desde) __USO_PEND.desde = agora;
  const temGravacao = __USO_PEND.esc > 0;
  const deu15min = agora - __USO_PEND.desde >= 15 * 60 * 1e3;
  if (!temGravacao && !deu15min) return;
  const esc = __USO_PEND.esc, lei = __USO_PEND.lei;
  __USO_PEND = { esc: 0, lei: 0, desde: 0 };
  const p = _somar(env, esc, lei);
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(p);
    return;
  }
  return p;
}
__name(somarUso, "somarUso");
async function usoHoje(env) {
  try {
    await garantirTabelaUso(env);
    const r = await env.DB.prepare("SELECT dia, escritas, leituras FROM uso_diario WHERE dia = ?").bind(hojeUTC()).first();
    return {
      dia: hojeUTC(),
      escritas: r && Number(r.escritas) || 0,
      leituras: r && Number(r.leituras) || 0,
      tetoEscritas: 5e7,
      tetoLeituras: 25e9
    };
  } catch (e) {
    return { dia: hojeUTC(), escritas: 0, leituras: 0, tetoEscritas: 5e7, tetoLeituras: 25e9 };
  }
}
__name(usoHoje, "usoHoje");
async function handleStatus(request, env, ctx) {
  const device = await authenticate(request, env);
  const totals = await resumoDaNuvem(env);
  if (!totals) throw new ApiError(503, "CONTAGEM_INDISPONIVEL", "A nuvem n\xE3o conseguiu contar os registros agora. A sincroniza\xE7\xE3o n\xE3o \xE9 afetada.");
  somarUso(env, 0, 30, ctx);
  return json({
    ok: true,
    device,
    totals,
    workerVersao: WORKER_VERSION,
    usoHoje: await (async () => {
      try {
        const real = await env.DB.prepare("SELECT leituras, escritas, medido_em FROM uso_real WHERE dia = ?").bind(hojeUTC()).first();
        if (real && (Number(real.leituras) > 0 || Number(real.escritas) > 0)) {
          return {
            dia: hojeUTC(),
            escritas: Number(real.escritas) || 0,
            leituras: Number(real.leituras) || 0,
            tetoEscritas: 5e7,
            tetoLeituras: 25e9,
            fonte: "oficial",
            medidoEm: real.medido_em || null
          };
        }
      } catch (e) {
      }
      let est;
      try {
        est = await usoHoje(env);
      } catch (eUso) {
        est = { dia: hojeUTC(), escritas: 0, leituras: 0, tetoEscritas: 5e7, tetoLeituras: 25e9, avisoUso: "medidor pausado (cota)" };
      }
      if (ultimoErroUso) est.avisoUso = ultimoErroUso;
      return Object.assign(est, { fonte: "estimada" });
    })()
  });
}
__name(handleStatus, "handleStatus");
function avisoEpson() {
  return "Prezados clientes,\n\nInformamos que as manuten\xE7\xF5es em impressoras EPSON exigem um prazo maior para a conclus\xE3o. Para estes equipamentos, utilizamos produtos qu\xEDmicos espec\xEDficos que demandam um tempo necess\xE1rio de rea\xE7\xE3o para garantir a efic\xE1cia do servi\xE7o. Por isso, solicitamos um prazo m\xE9dio de 15 dias \xFAteis para a entrega da manuten\xE7\xE3o.\n\nVale ressaltar que o equipamento pode ficar pronto antes deste prazo, a depender da agilidade da rea\xE7\xE3o dos produtos utilizados.\n\nAgradecemos a compreens\xE3o de todos e nos colocamos \xE0 disposi\xE7\xE3o para eventuais d\xFAvidas!";
}
__name(avisoEpson, "avisoEpson");
function parsePayloadD(raw) {
  if (!raw) return null;
  try {
    let b = String(raw).replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    const jsonStr = decodeURIComponent(escape(atob(b)));
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}
__name(parsePayloadD, "parsePayloadD");
async function ensurePublicDevice(env) {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT OR REPLACE INTO devices (id, name, token_hash, role, created_at, last_seen_at)
     VALUES ('public-orcamento', 'Aprova\xE7\xE3o P\xFAblica', 'public_orcamento_sys_hash', 'device', ?, ?)`
  ).bind(now, now).run();
}
__name(ensurePublicDevice, "ensurePublicDevice");
async function findOrcamentoByToken(env, token) {
  const code = cleanText(token, 120);
  if (!code || code.length < 6) return null;
  const rows = await env.DB.prepare(
    `SELECT * FROM records WHERE entity = 'orcamentos'`
  ).all();
  for (const row of rows.results || []) {
    const data = parseDataJson(row.data_json) || {};
    if (String(data.token || "") === code || String(row.record_id || "") === code) {
      return { row, data };
    }
  }
  return null;
}
__name(findOrcamentoByToken, "findOrcamentoByToken");
function publicOrcamentoPayload(data) {
  return {
    ok: true,
    numero: data.numero || "",
    clienteNome: data.clienteNome || data.clienteFantasia || "",
    data: String(data.data || data.criadoEm || "").slice(0, 10),
    itens: Array.isArray(data.itens) ? data.itens.map((it) => ({
      descricao: it.descricao || it.d || "",
      qtd: it.qtd || it.q || 1,
      preco: it.preco || it.p || 0,
      subtotal: it.subtotal || it.s || 0
    })) : [],
    total: Number(data.total || data.tot) || 0,
    status: data.status || "aberto",
    whatsapp: data.lojaWhatsapp || data.w || "",
    vendaId: data.vendaId || null,
    vendaNumero: data.vendaNumero || "",
    os: data.os || null,
    aviso: avisoEpson()
  };
}
__name(publicOrcamentoPayload, "publicOrcamentoPayload");
async function handleOrcamentoGet(url, env) {
  if (!env.DB) throw new ApiError(503, "DATABASE_NOT_BOUND", "Banco D1 n\xE3o vinculado.");
  const token = url.searchParams.get("c");
  const found = await findOrcamentoByToken(env, token);
  if (!found) {
    return json({ ok: false, error: "NOT_FOUND", status: "aberto", message: "Or\xE7amento n\xE3o encontrado." }, 404);
  }
  const st = String(found.data.status || "aberto");
  const deleted = found.row.deleted_at != null || st === "excluido";
  if (deleted || st === "recusado" && false) {
    return json({
      ok: false,
      error: "USED",
      status: "recusado",
      vendaId: found.data.vendaId || null,
      vendaNumero: found.data.vendaNumero || "",
      message: "Este link n\xE3o vale mais."
    }, 410);
  }
  return json(publicOrcamentoPayload(found.data));
}
__name(handleOrcamentoGet, "handleOrcamentoGet");
async function handleOrcamentoPost(request, env) {
  if (!env.DB) throw new ApiError(503, "DATABASE_NOT_BOUND", "Banco D1 n\xE3o vinculado.");
  await ensurePublicDevice(env);
  const body = await readBody(request);
  const acao = body.acao === "recusar" ? "recusar" : body.acao === "aprovar" ? "aprovar" : "";
  if (!acao) throw new ApiError(400, "INVALID_ACTION", "Informe aprovar ou recusar.");
  const token = cleanText(body.c, 120);
  let found = await findOrcamentoByToken(env, token);
  const device = { id: "public-orcamento" };
  let data = null;
  let recordId = null;
  let baseVersion = 0;
  if (found) {
    data = found.data;
    recordId = found.row.record_id;
    baseVersion = Number(found.row.version);
    if (data.status === "aprovado" || data.status === "recusado") {
      return json({ ok: true, status: data.status, vendaId: data.vendaId || null, vendaNumero: data.vendaNumero || "", message: "Or\xE7amento j\xE1 processado." });
    }
  } else {
    const payloadD = parsePayloadD(body.d) || {};
    recordId = "orc_" + (body.numero ? String(body.numero).replace(/\D/g, "") : Date.now().toString(36));
    data = {
      id: recordId,
      token,
      numero: body.numero || payloadD.n || "",
      clienteNome: body.clienteNome || payloadD.c || "",
      data: payloadD.dt || (/* @__PURE__ */ new Date()).toISOString(),
      itens: Array.isArray(payloadD.it) ? payloadD.it.map((it) => ({
        descricao: it.d || "",
        qtd: it.q || 1,
        preco: it.p || 0,
        subtotal: it.s || 0
      })) : [],
      total: Number(payloadD.tot) || 0,
      lojaWhatsapp: body.whatsapp || payloadD.w || "",
      os: payloadD.os || null,
      status: "aberto",
      criadoEm: (/* @__PURE__ */ new Date()).toISOString()
    };
    baseVersion = 0;
  }
  if (acao === "recusar") {
    if (data.status === "aprovado") {
      throw new ApiError(409, "ALREADY_APPROVED", "Este or\xE7amento j\xE1 foi autorizado.");
    }
    data.status = "recusado";
    data.recusadoEm = (/* @__PURE__ */ new Date()).toISOString();
    await applyMutation(env, device, {
      mutationId: "orc_del_" + crypto.randomUUID(),
      entity: "orcamentos",
      recordId,
      operation: "upsert",
      baseVersion,
      data
    }).catch(() => ({ ok: true, version: 1, excluido: true }));
    return json({ ok: true, status: "recusado" });
  }
  const vendaNumero = String(data.vendaNumero || data.numero || "V" + Date.now().toString(36).toUpperCase());
  const vendaId = "vda_orc_" + String(data.id || recordId);
  const venda = {
    id: vendaId,
    empresaId: data.empresaId || "",
    numero: vendaNumero,
    clienteId: data.clienteId || null,
    clienteNome: data.clienteNome || "",
    data: (/* @__PURE__ */ new Date()).toISOString(),
    itens: Array.isArray(data.itens) ? data.itens : [],
    desconto: 0,
    total: Number(data.total) || 0,
    observacao: "Gerada do or\xE7amento " + (data.numero || ""),
    status: "aguardar",
    origemOrcamentoId: data.id || recordId,
    os: data.os || null,
    criadoPor: data.criadoPor || "cliente",
    criadoPorNome: data.criadoPorNome || "Cliente",
    criadoEm: (/* @__PURE__ */ new Date()).toISOString()
  };
  const mensagem = "Ol\xE1, sou " + String(data.clienteNome || "cliente") + ". Foi autorizado o or\xE7amento do COD " + String(data.numero || "") + " e gerou a venda salva " + vendaNumero + ". Por favor, v\xE1 atualizando para mim sobre o andamento.";
  data.status = "aprovado";
  data.vendaId = vendaId;
  data.vendaNumero = vendaNumero;
  data.aprovadoEm = (/* @__PURE__ */ new Date()).toISOString();
  data.aprovadoOrigem = "cliente";
  data.mensagemWhats = mensagem;
  const ntf = {
    id: crypto.randomUUID(),
    empresaId: data.empresaId || "",
    tipo: "orcamento_aprovado",
    titulo: "Or\xE7amento autorizado",
    texto: String(data.clienteNome || "Cliente") + " autorizou o or\xE7amento " + String(data.numero || "") + " e gerou a venda salva " + vendaNumero,
    orcamentoId: data.id || recordId,
    vendaId,
    lida: false,
    criadoEm: (/* @__PURE__ */ new Date()).toISOString()
  };
  await applyMutation(env, device, {
    mutationId: "orc_vda_" + crypto.randomUUID(),
    entity: "vendas",
    recordId: vendaId,
    operation: "upsert",
    baseVersion: 0,
    data: venda
  }).catch(() => {
  });
  await applyMutation(env, device, {
    mutationId: "orc_ntf_" + crypto.randomUUID(),
    entity: "notificacoes",
    recordId: ntf.id,
    operation: "upsert",
    baseVersion: 0,
    data: ntf
  }).catch(() => {
  });
  await applyMutation(env, device, {
    mutationId: "orc_ok_" + crypto.randomUUID(),
    entity: "orcamentos",
    recordId,
    operation: "upsert",
    baseVersion,
    data
  }).catch(() => {
  });
  return json({ ok: true, status: "aprovado", vendaId, vendaNumero, mensagem });
}
__name(handleOrcamentoPost, "handleOrcamentoPost");
async function route(request, env, ctx) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
  const url = new URL(request.url);
  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) return handleHealth(env);
  if (request.method === "GET" && url.pathname === "/pix") return handlePix(url);
  if (request.method === "GET" && url.pathname === "/orcamento") return handleOrcamentoGet(url, env);
  if (request.method === "POST" && url.pathname === "/orcamento") return handleOrcamentoPost(request, env);
  if (!env.DB) throw new ApiError(503, "DATABASE_NOT_BOUND", "Banco D1 n\xE3o vinculado.");
  if (request.method === "POST" && url.pathname === "/v1/setup") return handleSetup(request, env);
  if (request.method === "POST" && url.pathname === "/v1/recover") return handleRecovery(request, env);
  if (request.method === "POST" && url.pathname === "/v1/invites") return handleCreateInvite(request, env);
  if (request.method === "POST" && url.pathname === "/v1/enroll") return handleEnroll(request, env);
  if (request.method === "POST" && url.pathname === "/v1/changes") return handlePush(request, env, ctx);
  if (request.method === "GET" && url.pathname === "/v1/changes") return handleChanges(request, env, ctx);
  if (request.method === "GET" && url.pathname === "/v1/deleted") return handleDeleted(request, env);
  if (request.method === "POST" && url.pathname === "/v1/restore") return handleRestore(request, env);
  if (request.method === "GET" && url.pathname === "/v1/review/revoked-records") return handleRevokedDeviceRecords(request, env);
  if (request.method === "POST" && url.pathname === "/v1/review/remove-revoked") return handleRemoveRevokedDeviceRecords(request, env);
  if (request.method === "GET" && url.pathname === "/v1/devices") return handleDevices(request, env);
  async function publicacaoViva(env2) {
    const r = await env2.DB.prepare(`SELECT versao, url, notas, tutorial, publicado_em AS publicadoEm FROM app_releases WHERE ativa = 1 AND oculta = 0 AND (expira_em = 0 OR expira_em > ?) ORDER BY publicado_em DESC LIMIT 1`).bind(Date.now()).first();
    return r || null;
  }
  __name(publicacaoViva, "publicacaoViva");
  function linkDownload(origin, versao) {
    return origin + "/dl/" + encodeURIComponent(versao) + ".exe";
  }
  __name(linkDownload, "linkDownload");
  if (request.method === "POST" && url.pathname === "/v1/connect-pass") {
    const adminOuGerente = await requireAdminOuGerente(request, env);
    const body = await readBody(request);
    const senha = String(body && body.senha || "");
    const senhaG = String(body && body.senhaGerente || "");
    const cnpj = soDigitos(body && body.cnpj || "");
    const nome = cleanText(body && body.nome || "", 120);
    if (senha.length < 4) throw new ApiError(400, "SENHA_CURTA", "A senha de conex\xE3o precisa de pelo menos 4 caracteres.");
    if (cnpj && !cnpjValido(cnpj)) throw new ApiError(400, "CNPJ_INVALIDO", "CNPJ precisa ter 14 d\xEDgitos.");
    const seg = await lerSegredos(env);
    const conn = await senhaHash(env, cnpj || seg && seg.owner_cnpj || "", senha);
    const gerente = senhaG ? await senhaHash(env, cnpj || seg && seg.owner_cnpj || "", senhaG) : seg && seg.gerente_hash || conn;
    await env.DB.prepare(`INSERT INTO connect_secrets (id, conn_hash, gerente_hash, owner_cnpj, owner_nome, updated_at) VALUES ('main', ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET conn_hash = excluded.conn_hash, gerente_hash = excluded.gerente_hash,
      owner_cnpj = CASE WHEN excluded.owner_cnpj <> '' THEN excluded.owner_cnpj ELSE connect_secrets.owner_cnpj END,
      owner_nome = CASE WHEN excluded.owner_nome <> '' THEN excluded.owner_nome ELSE connect_secrets.owner_nome END,
      updated_at = excluded.updated_at`).bind(conn, gerente, cnpj || seg && seg.owner_cnpj || "", nome || seg && seg.owner_nome || "", Date.now()).run();
    if (cnpj) await upsertEmpresa(env, cnpj, nome);
    return json({ ok: true, definida: true, gerenteDefinida: !!gerente });
  }
  if (request.method === "POST" && url.pathname === "/v1/check-pass") {
    const body0 = await readBody(request);
    const cnpj0 = soDigitos(body0 && body0.cnpj || "");
    const senha0 = String(body0 && body0.senha || "");
    if (!cnpjValido(cnpj0) || !senha0) throw new ApiError(400, "DADOS_NECESSARIOS", "Informe o CNPJ da loja e a senha de conex\xE3o ou do gerente.");
    const seg0 = await lerSegredos(env);
    if (!seg0 || !seg0.conn_hash && !seg0.gerente_hash) {
      return json({ ok: false, senhaDefinida: false, aviso: 'As senhas ainda n\xE3o foram definidas. O administrador define no painel Nuvem, cart\xE3o "Senhas de conex\xE3o (CNPJ) e do Gerente".' });
    }
    const conexaoOk = !!(seg0.conn_hash && await conferirSenha(env, cnpj0, senha0, "conn_hash"));
    const gerenteOk = !!(seg0.gerente_hash && seg0.gerente_hash !== seg0.conn_hash && cnpj0 === seg0.owner_cnpj && await conferirSenha(env, cnpj0, senha0, "gerente_hash"));
    if (!conexaoOk && !gerenteOk) return json({ ok: false, senhaDefinida: true, aviso: "CNPJ ou senha de conex\xE3o/gerente incorretos. Confira e tente de novo." }, 403);
    return json({
      ok: true,
      senhaDefinida: true,
      tipo: gerenteOk ? "gerente" : "conexao",
      administrador: gerenteOk,
      empresa: seg0.owner_cnpj === cnpj0 ? seg0.owner_nome || "" : ""
    });
  }
  if (request.method === "POST" && url.pathname === "/v1/enroll-cnpj") {
    const body = await readBody(request);
    const cnpj = soDigitos(body && body.cnpj || "");
    const nome = cleanText(body && body.empresaNome || body && body.nome || "", 120);
    const senha = String(body && body.senha || "");
    const name = cleanText(body && body.deviceName || "", 80);
    if (!cnpjValido(cnpj) || !senha || !name) throw new ApiError(400, "DADOS_NECESSARIOS", "Informe CNPJ (14 d\xEDgitos), senha de conex\xE3o e o nome do computador.");
    const seg = await lerSegredos(env);
    let role = "device";
    let via = "cnpj";
    if (!await conferirSenha(env, cnpj, senha, "conn_hash")) {
      const gerOk = !!(seg && seg.gerente_hash && seg.conn_hash && seg.gerente_hash !== seg.conn_hash && cnpj === seg.owner_cnpj && await conferirSenha(env, cnpj, senha, "gerente_hash"));
      if (!gerOk) throw new ApiError(403, "CNPJ_OU_SENHA_INVALIDOS", "CNPJ ou senha de conex\xE3o incorretos.");
      role = "admin";
      via = "cnpj-gerente";
    }
    if (seg && seg.owner_cnpj && cnpj !== seg.owner_cnpj && !await env.DB.prepare("SELECT cnpj FROM empresas WHERE cnpj = ?").bind(cnpj).first()) {
      throw new ApiError(403, "CNPJ_NAO_CADASTRADO", "Este CNPJ ainda n\xE3o consta como empresa conhecida. Pe\xE7a ao administrador para cadastrar.");
    }
    await upsertEmpresa(env, cnpj, nome);
    const now = Date.now();
    const id = crypto.randomUUID();
    const token = randomToken("dcp_");
    const tokenHash = await sha256(token);
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO devices(id, name, token_hash, role, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(id, name, tokenHash, role, now, now),
      env.DB.prepare(`INSERT INTO device_events(event_type, device_id, actor_id, details_json, created_at) VALUES ('device_enrolled', ?, ?, ?, ?)`).bind(id, id, JSON.stringify({ name, role, via, cnpj }), now)
    ]);
    return json({ ok: true, activation: via, device: { id, name, role }, token }, 201);
  }
  if (request.method === "POST" && url.pathname === "/v1/site-login") {
    let cnpj = "", senha = "";
    const ct = String(request.headers.get("content-type") || "");
    if (ct.indexOf("application/x-www-form-urlencoded") >= 0) {
      const form = await request.formData();
      cnpj = soDigitos(form.get("cnpj"));
      senha = String(form.get("senha") || "");
    } else {
      const body = await readBody(request);
      cnpj = soDigitos(body && body.cnpj || "");
      senha = String(body && body.senha || "");
    }
    const okc = cnpjValido(cnpj) && await conferirSenha(env, cnpj, senha, "conn_hash");
    if (!okc) return paginaLoginSite("CNPJ ou senha de conex\xE3o incorretos.");
    await upsertEmpresa(env, cnpj, "");
    const token = randomToken("ss_");
    const now = Date.now();
    const expira = now + 30 * 24 * 3600 * 1e3;
    await env.DB.prepare("INSERT INTO site_sessions (token, cnpj, created_at, expires_at) VALUES (?, ?, ?, ?)").bind(token, cnpj, now, expira).run();
    await env.DB.prepare("DELETE FROM site_sessions WHERE expires_at <= ?").bind(now).run();
    const cookie = "site_sess=" + token + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" + 30 * 24 * 3600;
    if (ct.indexOf("application/x-www-form-urlencoded") >= 0) {
      return new Response(null, { status: 303, headers: { location: "/atualizacoes", "set-cookie": cookie } });
    }
    return json({ ok: true, cnpj, expiraEm: expira }, 200, { "set-cookie": cookie });
  }
  if (request.method === "POST" && url.pathname === "/v1/gerente-login") {
    const body = await readBody(request);
    const cnpj = soDigitos(body && body.cnpj || "");
    const senha = String(body && body.senha || "");
    if (!cnpjValido(cnpj) || !senha) throw new ApiError(400, "DADOS_NECESSARIOS", "Informe CNPJ e a senha do gerente.");
    const seg = await lerSegredos(env);
    if (!seg || !seg.owner_cnpj || !seg.gerente_hash) {
      throw new ApiError(409, "GERENTE_NAO_DEFINIDO", 'A senha do gerente ainda n\xE3o foi definida. Abra o sistema como administrador \u2192 Nuvem \u2192 cart\xE3o "Senhas de conex\xE3o (CNPJ) e do Gerente" \u2192 Salvar senhas na nuvem.');
    }
    if (cnpj !== seg.owner_cnpj) throw new ApiError(403, "GERENTE_SO_DONO", "O gerente de atualiza\xE7\xF5es s\xF3 entra com o CNPJ da empresa dona (" + seg.owner_nome + "). Este CNPJ digitado n\xE3o \xE9 o dela.");
    if (!await conferirSenha(env, cnpj, senha, "gerente_hash")) throw new ApiError(403, "SENHA_GERENTE_INVALIDA", "Senha do gerente incorreta. Confira e tente de novo \u2014 \xE9 a senha definida no cart\xE3o de senhas do painel Nuvem.");
    const token = randomToken("gr_");
    const now = Date.now();
    const expira = now + 7 * 24 * 3600 * 1e3;
    await env.DB.prepare("INSERT INTO gerente_sessions (token, cnpj, created_at, expires_at) VALUES (?, ?, ?, ?)").bind(token, cnpj, now, expira).run();
    await env.DB.prepare("DELETE FROM gerente_sessions WHERE expires_at <= ?").bind(now).run();
    return json({ ok: true, gerenteToken: token, expiraEm: expira });
  }
  if ((request.method === "GET" || request.method === "POST") && url.pathname === "/v1/gerente/empresas") {
    await requireAdminOuGerente(request, env);
    await garantirTabelaAppVersao(env);
    if (request.method === "POST") {
      const b2 = await readBody(request);
      const cnpj2 = soDigitos(b2 && b2.cnpj || "");
      const nome2 = cleanText(b2 && b2.nome || "", 120);
      if (!cnpjValido(cnpj2) || !nome2) throw new ApiError(400, "DADOS_NECESSARIOS", "Informe o CNPJ (14 d\xEDgitos) e o nome da empresa.");
      await upsertEmpresa(env, cnpj2, nome2);
      return json({ ok: true, cnpj: cnpj2, nome: nome2 });
    }
    const lista = await env.DB.prepare("SELECT cnpj, nome, last_seen_at AS ultimaVez FROM empresas ORDER BY nome COLLATE NOCASE").all();
    return json({ ok: true, empresas: lista.results || [] });
  }
  if (request.method === "POST" && url.pathname === "/v1/release-image") {
    await requireAdminOuGerente(request, env);
    if (!env.R2) throw new ApiError(503, "R2_NAO_LIGADO", "O bucket digicopy-downloads n\xE3o est\xE1 ligado no motor.");
    const v = String(url.searchParams.get("versao") || "").replace(/^v/i, "");
    if (!/^\d+(\.\d+)+$/.test(v)) throw new ApiError(400, "VERSAO_INVALIDA", "Informe a vers\xE3o da imagem.");
    const tipo = String(request.headers.get("x-imagem-tipo") || "png").replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
    const tamanho = Number(request.headers.get("content-length") || 0) || 0;
    if (tamanho > 4 * 1024 * 1024) throw new ApiError(413, "IMAGEM_GRANDE", "Imagem maior que 4MB \u2014 exporte menor (print em JPG fica pequeno).");
    const buf = await request.arrayBuffer();
    if (!buf || buf.byteLength < 200) throw new ApiError(400, "IMAGEM_VAZIA", "A imagem chegou vazia.");
    await garantirTabelaAppVersao(env);
    const key = "img/" + v + "/" + randomToken("i_") + "." + tipo;
    await env.R2.put(key, buf, { httpMetadata: { contentType: "image/" + (tipo === "jpg" ? "jpeg" : tipo) } });
    const rel = await env.DB.prepare("SELECT imagens FROM app_releases WHERE versao = ?").bind(v).first();
    let imgs = [];
    try {
      imgs = rel && rel.imagens ? JSON.parse(rel.imagens) : [];
    } catch (e) {
      imgs = [];
    }
    imgs = Array.isArray(imgs) ? imgs : [];
    if (imgs.length >= 8) throw new ApiError(400, "IMAGENS_DEMAIS", "M\xE1ximo de 8 imagens por tutorial.");
    imgs.push(key);
    await env.DB.prepare("UPDATE app_releases SET imagens = ? WHERE versao = ?").bind(JSON.stringify(imgs), v).run();
    return json({ ok: true, key, total: imgs.length });
  }
  if (request.method === "GET" && url.pathname === "/v1/app-releases") {
    await requireAdminOuGerente(request, env);
    await garantirTabelaAppVersao(env);
    const lista = await env.DB.prepare("SELECT versao, url, notas, tutorial, publicado_em AS publicadoEm, ativa, oculta, expira_em AS expiraEm, tem_arquivo AS temArquivo, destino_tipo AS destinoTipo, destino_cnpjs AS destinoCnpjs, slug, imagens FROM app_releases ORDER BY publicado_em DESC").all();
    return json({ ok: true, releases: lista.results || [] });
  }
  if (request.method === "GET" && url.pathname === "/v1/app-release") {
    await garantirTabelaAppVersao(env);
    const cnpjQ = soDigitos(url.searchParams.get("cnpj") || "") || null;
    const vivas = await env.DB.prepare(`SELECT versao, url, notas, tutorial, publicado_em AS publicadoEm, destino_tipo, destino_cnpjs, slug FROM app_releases WHERE ativa = 1 AND oculta = 0 AND (expira_em = 0 OR expira_em > ?) ORDER BY publicado_em DESC`).bind(Date.now()).all();
    const seg0 = await lerSegredos(env);
    const viva = (vivas && vivas.results || []).map(function(r) {
      r.ownerCnpj = seg0 && seg0.owner_cnpj || "";
      return r;
    }).find(function(r) {
      return destinoOk(r, cnpjQ);
    }) || null;
    if (viva) {
      const slugUrl = viva.slug ? linkSlug(new URL(request.url).origin, viva.slug) : linkDownload(new URL(request.url).origin, viva.versao);
      return json({ ok: true, versao: viva.versao, url: slugUrl, slug: viva.slug || "", linkDireto: slugUrl, notas: viva.notas || "", tutorial: viva.tutorial || "", publicadoEm: viva.publicadoEm || 0 });
    }
    if (cnpjQ) return json({ ok: true, versao: "", url: "", notas: "", publicadoEm: 0 });
    const legado = await publicacaoViva(env);
    if (legado) {
      return json({ ok: true, versao: legado.versao, url: linkDownload(new URL(request.url).origin, legado.versao), notas: legado.notas || "", tutorial: legado.tutorial || "", publicadoEm: legado.publicadoEm || 0 });
    }
    return json({ ok: true, versao: "", url: "", notas: "", publicadoEm: 0 });
    const row = await env.DB.prepare("SELECT versao, url, notas, publicado_em AS publicadoEm FROM app_versao WHERE id = 1").first();
    return json({ ok: true, versao: row && row.versao || "", url: row && row.url || "", notas: row && row.notas || "", publicadoEm: row && row.publicadoEm || 0 });
  }
  if (request.method === "POST" && url.pathname === "/v1/app-release") {
    const adminUser = await requireAdminOuGerente(request, env);
    const body = await request.json();
    const origin = new URL(request.url).origin;
    const acao = String(body && body.action || "publicar").toLowerCase();
    const versao = String(body && body.versao || "").trim().replace(/^v/i, "");
    if (!/^\d+(\.\d+)+$/.test(versao)) throw new ApiError(400, "VERSAO_INVALIDA", "Vers\xE3o precisa estar no formato 5.24.34.");
    const horas = Number(body && body.expiraHoras || 0) || 0;
    const expira = horas > 0 ? Date.now() + horas * 3600 * 1e3 : 0;
    await garantirTabelaAppVersao(env);
    if (acao === "excluir") {
      await env.DB.prepare("DELETE FROM app_releases WHERE versao = ?").bind(versao).run();
      try {
        if (env.R2) await env.R2.delete("exe/" + versao + ".exe");
      } catch (e) {
      }
      return json({ ok: true, acao, versao });
    }
    if (acao === "desativar") {
      await env.DB.prepare("UPDATE app_releases SET ativa = 0 WHERE versao = ?").bind(versao).run();
      return json({ ok: true, acao, versao });
    }
    if (acao === "ativar") {
      await env.DB.prepare("UPDATE app_releases SET ativa = 1, expira_em = ? WHERE versao = ?").bind(expira, versao).run();
      return json({ ok: true, acao, versao, expiraEm: expira });
    }
    if (acao === "ocultar" || acao === "mostrar") {
      await env.DB.prepare("UPDATE app_releases SET oculta = ? WHERE versao = ?").bind(acao === "ocultar" ? 1 : 0, versao).run();
      return json({ ok: true, acao, versao });
    }
    if (acao === "editar") {
      const notasE = String(body && body.notas || "").slice(0, 4e3);
      const tutE = String(body && body.tutorial || "").slice(0, 4e3);
      await env.DB.prepare("UPDATE app_releases SET notas = ?, tutorial = ? WHERE versao = ?").bind(notasE, tutE, versao).run();
      if (body && Object.prototype.hasOwnProperty.call(body, "destinoTipo")) {
        const dT = ["todos", "lista", "so_loja"].indexOf(body.destinoTipo) >= 0 ? body.destinoTipo : "todos";
        const dL = Array.isArray(body.destinoCnpjs) ? body.destinoCnpjs.map(soDigitos).filter(function(c) {
          return /^\d{14}$/.test(c);
        }).slice(0, 50) : [];
        await env.DB.prepare("UPDATE app_releases SET destino_tipo = ?, destino_cnpjs = ? WHERE versao = ?").bind(dT, JSON.stringify(dL), versao).run();
      }
      return json({ ok: true, acao, versao });
    }
    if (acao === "remover-imagem") {
      const keyX = cleanText(body && body.key || "", 300);
      const relX = await env.DB.prepare("SELECT imagens FROM app_releases WHERE versao = ?").bind(versao).first();
      let imgsX = [];
      try {
        imgsX = relX && relX.imagens ? JSON.parse(relX.imagens) : [];
      } catch (e) {
        imgsX = [];
      }
      const nova = (Array.isArray(imgsX) ? imgsX : []).filter(function(k) {
        return k !== keyX;
      });
      await env.DB.prepare("UPDATE app_releases SET imagens = ? WHERE versao = ?").bind(JSON.stringify(nova), versao).run();
      try {
        if (env.R2 && keyX) await env.R2.delete(keyX);
      } catch (e) {
      }
      return json({ ok: true, acao, versao, total: nova.length });
    }
    const notas = String(body && body.notas || "").slice(0, 4e3);
    const tutorial = String(body && body.tutorial || "").slice(0, 4e3);
    const destinoTipo = ["todos", "lista", "so_loja"].indexOf(body && body.destinoTipo || "todos") >= 0 ? body.destinoTipo || "todos" : "todos";
    const destinoCnpjs = Array.isArray(body && body.destinoCnpjs) ? body.destinoCnpjs.map(soDigitos).filter(function(c) {
      return /^\d{14}$/.test(c);
    }).slice(0, 50) : [];
    let urlRel = String(body && body.url || "").trim();
    if (urlRel && !/^https:\/\//.test(urlRel)) throw new ApiError(400, "URL_INVALIDA", "A URL de download precisa come\xE7ar com https:// .");
    if (!urlRel) urlRel = linkDownload(origin, versao);
    await env.DB.prepare("INSERT INTO app_versao (id, versao, url, notas, publicado_em) VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET versao = excluded.versao, url = excluded.url, notas = excluded.notas, publicado_em = excluded.publicado_em").bind(versao, urlRel, notas, Date.now()).run();
    const relAntiga = await env.DB.prepare("SELECT slug FROM app_releases WHERE versao = ?").bind(versao).first();
    const slugV = relAntiga && relAntiga.slug || randomToken("a_");
    await env.DB.prepare(`INSERT INTO app_releases (versao, url, notas, tutorial, publicado_em, ativa, oculta, expira_em, destino_tipo, destino_cnpjs, slug) VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)
      ON CONFLICT(versao) DO UPDATE SET url = excluded.url, notas = excluded.notas, tutorial = excluded.tutorial, publicado_em = excluded.publicado_em, ativa = 1, oculta = 0, expira_em = excluded.expira_em, destino_tipo = excluded.destino_tipo, destino_cnpjs = excluded.destino_cnpjs, slug = excluded.slug`).bind(versao, urlRel, notas, tutorial, Date.now(), expira, destinoTipo, JSON.stringify(destinoCnpjs), slugV).run();
    return json({ ok: true, acao: "publicar", versao, url: urlRel, slug: slugV, linkDireto: linkSlug(origin, slugV), notas, tutorial, destinoTipo, destinoCnpjs, expiraEm: expira, publicadoEm: Date.now() });
  }
  if (request.method === "POST" && url.pathname === "/v1/release-file") {
    const admin2 = await requireAdminOuGerente(request, env);
    if (!env.R2) throw new ApiError(503, "R2_NAO_LIGADO", "O bucket digicopy-downloads n\xE3o est\xE1 ligado no motor. Crie-o no painel (R2) e rode o atualizar_motor_nuvem.cmd.");
    const v = String(url.searchParams.get("versao") || "").replace(/^v/i, "");
    if (!/^\d+(\.\d+)+$/.test(v)) throw new ApiError(400, "VERSAO_INVALIDA", "Informe a vers\xE3o do arquivo.");
    const tamanho = Number(request.headers.get("content-length") || 0) || 0;
    if (tamanho > 150 * 1024 * 1024) throw new ApiError(413, "ARQUIVO_GRANDE", "Maior que 150MB: suba direto pelo painel do R2 em Objetos \u2192 pasta exe/ (o site continua servindo).");
    const buf = await request.arrayBuffer();
    if (!buf || buf.byteLength < 1e3) throw new ApiError(400, "ARQUIVO_VAZIO", "O arquivo chegou vazio.");
    await garantirTabelaAppVersao(env);
    await env.R2.put("exe/" + v + ".exe", buf, { httpMetadata: { contentType: "application/x-msdownload" } });
    await env.DB.prepare("UPDATE app_releases SET tem_arquivo = 1, url = ? WHERE versao = ?").bind(linkDownload(new URL(request.url).origin, v), v).run();
    return json({ ok: true, versao: v, bytes: buf.byteLength });
  }
  if (request.method === "GET" && url.pathname.startsWith("/dl/")) {
    if (!env.R2) return new Response("Arquivos ainda n\xE3o ligados (falta criar o bucket R2 no painel).", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
    const nome = decodeURIComponent(url.pathname.slice(4));
    const v = nome.replace(/\.exe$/i, "");
    await garantirTabelaAppVersao(env);
    const essa = await env.DB.prepare("SELECT ativa, oculta, expira_em, slug FROM app_releases WHERE versao = ?").bind(v).first();
    const liberada = essa && (essa.ativa === 1 && essa.oculta === 0 && (essa.expira_em === 0 || essa.expira_em > Date.now()));
    if (!liberada) return new Response("Esta vers\xE3o foi DESLIGADA do site pelo administrador. A atual continua em /atualizacoes", { status: 410, headers: { "content-type": "text/plain; charset=utf-8" } });
    const slugQ = String(url.searchParams.get("s") || "");
    const sessaoDl = await sessaoSite(request, env);
    if (!(sessaoDl || slugQ && essa.slug && slugQ === essa.slug || await gerenteDaRequisicao(request, env))) {
      return new Response("\xC1rea restrita: entre em /atualizacoes com o CNPJ e a senha de conex\xE3o.", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    const obj = await env.R2.get("exe/" + v + ".exe");
    if (!obj) return new Response("O arquivo desta vers\xE3o ainda n\xE3o subiu \u2014 o administrador j\xE1 foi avisado por sinal de fuma\xE7a.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    return new Response(obj.body, { headers: { "content-type": "application/x-msdownload", "content-disposition": 'attachment; filename="digicopy-' + v + '.exe"', "cache-control": "no-store" } });
  }
  if (request.method === "GET" && url.pathname.startsWith("/img/")) {
    if (!env.R2) return new Response("Arquivos ainda n\xE3o ligados (falta criar o bucket R2 no painel).", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
    const keyImg = url.pathname.slice(1);
    await garantirTabelaAppVersao(env);
    const relImg = await env.DB.prepare("SELECT ativa, oculta, expira_em FROM app_releases WHERE versao = ?").bind(keyImg.split("/")[1] || "").first();
    const liberadaImg = relImg && relImg.ativa === 1 && relImg.oculta === 0 && (relImg.expira_em === 0 || relImg.expira_em > Date.now());
    if (!liberadaImg) return new Response("404", { status: 404 });
    const objImg = await env.R2.get(keyImg);
    if (!objImg) return new Response("404", { status: 404 });
    const ext = (keyImg.split(".").pop() || "png").toLowerCase();
    return new Response(objImg.body, { headers: { "content-type": "image/" + (ext === "jpg" ? "jpeg" : ext), "cache-control": "public, max-age=3600" } });
  }
  if (request.method === "GET" && url.pathname.startsWith("/a/")) {
    await garantirTabelaAppVersao(env);
    const slugA = cleanText(decodeURIComponent(url.pathname.slice(3)), 120);
    const relA = await env.DB.prepare("SELECT versao, notas, tutorial, publicado_em AS publicadoEm, tem_arquivo AS temArquivo, ativa, oculta, expira_em, imagens FROM app_releases WHERE slug = ?").bind(slugA).first();
    const vivaA = relA && relA.ativa === 1 && relA.oculta === 0 && (relA.expira_em === 0 || relA.expira_em > Date.now());
    if (!vivaA) return new Response("Esta p\xE1gina saiu do ar (a vers\xE3o foi desligada ou venceu). Abrindo a \xE1rea restrita: /atualizacoes", { status: 410, headers: { "content-type": "text/plain; charset=utf-8" } });
    let listaA = [];
    try {
      listaA = relA.imagens ? JSON.parse(relA.imagens) : [];
    } catch (e) {
      listaA = [];
    }
    const imgsA = (Array.isArray(listaA) ? listaA : []).filter(Boolean).slice(0, 8).map(function(k) {
      return '<img class="zi" src="/' + encodeURI(k) + '" alt="passo a passo" loading="lazy">';
    }).join("");
    const escA = /* @__PURE__ */ __name((t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c), "escA");
    let tamA = "";
    try {
      if (env.R2 && relA.temArquivo) {
        const hA = await env.R2.head("exe/" + relA.versao + ".exe");
        if (hA && hA.size) tamA = (hA.size / 1048576).toFixed(hA.size >= 10485760 ? 0 : 1) + " MB";
      }
    } catch (e) {
      tamA = "";
    }
    const htmlA = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Atualiza\xE7\xE3o oficial v${escA(relA.versao)} do Sistema DigiCopy."><meta name="theme-color" content="#0a1e8a"><title>DigiCopy \u2014 Atualiza\xE7\xE3o v${escA(relA.versao)}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#f1f4fb;min-height:100vh;color:#0f172a;padding:0 0 52px}
    .faixa-topo{height:5px;background:linear-gradient(90deg,#0a1e8a,#06b6d4)}
    header{position:relative;overflow:hidden;color:#fff;padding:34px 20px 76px;text-align:center;background:linear-gradient(120deg,#101449 0%,#0a1e8a 48%,#0e7490 100%)}
    header::before{content:'';position:absolute;inset:0;background:radial-gradient(560px 210px at 20% -40px, rgba(139,152,255,.35), transparent 65%),radial-gradient(460px 190px at 85% -30px, rgba(34,211,238,.28), transparent 60%)}
    header .in{position:relative;z-index:1}
    .marca{display:inline-flex;align-items:center;gap:11px}
    .marca .logo{width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#4f5bff,#0a1e8a);display:grid;place-items:center;font-size:20px;font-weight:900;border:1px solid rgba(255,255,255,.25);box-shadow:0 10px 24px rgba(0,0,0,.28)}
    .marca b{font-size:clamp(18px,4.4vw,25px);font-weight:900;text-align:left;line-height:1.1;display:block}
    .marca small{display:block;font-size:11px;opacity:.85;font-weight:600;text-align:left;margin-top:2px}
    header h1{font-size:clamp(20px,4.6vw,29px);font-weight:900;margin-top:20px}
    header p{opacity:.92;font-size:13px;margin-top:8px;max-width:540px;margin-left:auto;margin-right:auto;line-height:1.55}
    .confianca{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}
    .confianca span{font-size:11px;font-weight:700;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.22);padding:6px 12px;border-radius:999px}
    @keyframes entra{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    main{max-width:720px;margin:-42px auto 0;padding:0 14px}
    .card{background:#fff;border:2px solid #0a1e8a;border-radius:20px;padding:24px 22px;box-shadow:0 18px 44px rgba(10,30,138,.13);animation:entra .6s ease both}
    .selo{display:inline-flex;align-items:center;gap:7px;background:#dcfce7;color:#15803d;font-size:11px;font-weight:900;padding:6px 14px;border-radius:999px;text-transform:uppercase;letter-spacing:.5px}
    .selo .p{width:8px;height:8px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.18)}
    .vtit{font-size:23px;font-weight:900;color:#0a1e8a;margin-top:12px;font-variant-numeric:tabular-nums}
    .meta{font-size:12px;color:#64748b;font-weight:600;margin-top:4px}
    .notas{margin-top:14px;white-space:pre-wrap;word-wrap:break-word;font-size:13.5px;line-height:1.65;color:#334155;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:15px;font-family:inherit}
    .tutorial{margin-top:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:15px}
    .tutorial h4{font-size:13px;color:#92400e;margin-bottom:9px}
    .passo{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;font-size:13px;line-height:1.7;color:#334155}
    .imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:10px}
    .imgs img{width:100%;border-radius:12px;border:1px solid #e2e8f0;cursor:zoom-in;transition:transform .18s ease}.imgs img:hover{transform:scale(1.03)}
    .zi-dica{margin-top:8px;font-size:11px;color:#92400e}
    .baixar{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:18px;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-decoration:none;padding:19px 22px;border-radius:16px;box-shadow:0 12px 28px rgba(22,163,74,.32);transition:transform .18s ease}
    .baixar:hover{transform:scale(1.018)}
    .baixar .big{font-size:26px}.baixar b{display:block;font-size:17px;font-weight:900}
    .baixar small{display:block;font-size:11.5px;opacity:.92;font-weight:600;margin-top:2px}
    .depois{margin-top:13px;font-size:12.5px;color:#64748b;text-align:center;line-height:1.6}
    .rodape{text-align:center;margin-top:26px;font-size:11.5px;color:#94a3b8;line-height:1.8;padding:12px 16px;border-top:1px solid #e2e8f0;max-width:520px;margin-left:auto;margin-right:auto}</style></head><body>
    <div class="faixa-topo"></div>
    <header><div class="in">
      <div class="marca"><span class="logo">D</span><b>Sistema DigiCopy<small>Portal oficial de atualiza\xE7\xF5es</small></b></div>
      <h1>Atualiza\xE7\xE3o v${escA(relA.versao)} pronta pra baixar</h1>
      <p>Voc\xEA chegou pela notifica\xE7\xE3o do seu sistema \u2014 este endere\xE7o \xE9 exclusivo desta vers\xE3o.</p>
      <div class="confianca"><span>\u{1F512} Conex\xE3o segura</span><span>\u2705 Vers\xE3o oficial verificada</span><span>\u{1F5C2} Seus dados s\xE3o preservados</span></div>
    </div></header>
    <main><div class="card">
      <span class="selo"><span class="p"></span>vers\xE3o atual, liberada</span>
      <div class="vtit">v${escA(relA.versao)}</div>
      <div class="meta">${relA.publicadoEm ? "Publicada em " + escA((function() {
      try {
        return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(relA.publicadoEm));
      } catch (e) {
        return "";
      }
    })()) : ""}${tamA ? (relA.publicadoEm ? " \xB7 " : "") + escA(tamA) : ""}</div>
      ${relA.notas ? `<pre class="notas">${escA(relA.notas)}</pre>` : ""}
      ${relA.tutorial || imgsA ? `<div class="tutorial"><h4>\u{1F4D6} Como baixar e instalar (passo a passo)</h4>${relA.tutorial ? `<pre class="passo">${escA(relA.tutorial)}</pre>` : ""}${imgsA ? `<div class="imgs">${imgsA}</div><p class="zi-dica">Toque na imagem para ampliar.</p>` : ""}</div>` : ""}
      ${relA.temArquivo ? `<a class="baixar" href="/dl/${encodeURIComponent(relA.versao)}.exe?s=${encodeURIComponent(slugA)}"><span class="big">\u2B07</span><span><b>Baixar a atualiza\xE7\xE3o agora</b><small>${tamA ? "Arquivo de " + escA(tamA) + " \xB7 " : ""}instala por cima, sem perder nada</small></span></a>` : '<p class="depois">\u23F3 O arquivo ainda est\xE1 subindo \u2014 volte em alguns minutos.</p>'}
      <p class="depois">Depois de baixar: abra o arquivo e avance a instala\xE7\xE3o. O sistema abre atualizado com <b>todos os seus dados no lugar</b>.</p>
    </div></main>
    <p class="rodape">Sistema DigiCopy \u2014 atualiza\xE7\xE3o oficial deste canal.<br>Precisa de ajuda? Fale com quem instalou o sistema na sua loja.</p>
    <div id="lbz" style="display:none;position:fixed;inset:0;background:rgba(2,6,23,.93);z-index:99;align-items:center;justify-content:center;cursor:zoom-out;padding:18px"><img id="lbzi" alt="imagem ampliada" style="max-width:96vw;max-height:94vh;border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,.5)"></div>
    <script>(function(){document.addEventListener('click',function(ev){var t=ev.target;if(t&&t.tagName==='IMG'&&t.classList&&t.classList.contains('zi')){var b=document.getElementById('lbz'),i=document.getElementById('lbzi');i.src=t.getAttribute('src');b.style.display='flex';}else if(t&&(t.id==='lbz'||t.id==='lbzi')){document.getElementById('lbz').style.display='none';}},true);})();<\/script>
    </body></html>`;
    return new Response(htmlA, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  if (request.method === "GET" && url.pathname === "/atualizacoes") {
    await garantirTabelaAppVersao(env);
    if (url.searchParams.get("logout")) {
      return new Response(null, { status: 303, headers: { "set-cookie": "site_sess=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax", "location": "/atualizacoes" } });
    }
    const sessaoAt = await sessaoSite(request, env);
    if (!sessaoAt) return paginaLoginSite();
    const lista = await env.DB.prepare("SELECT versao, url, notas, tutorial, publicado_em AS publicadoEm, tem_arquivo AS temArquivo, destino_tipo, destino_cnpjs, slug, imagens FROM app_releases WHERE ativa = 1 AND oculta = 0 AND (expira_em = 0 OR expira_em > ?) ORDER BY publicado_em DESC").bind(Date.now()).all();
    const segAt = await lerSegredos(env);
    const itens = (lista.results || []).filter(function(r) {
      r.ownerCnpj = segAt && segAt.owner_cnpj || "";
      return destinoOk(r, sessaoAt.cnpj);
    });
    const cnpjHum = sessaoAt.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    const origin = new URL(request.url).origin;
    const esc = /* @__PURE__ */ __name((t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c), "esc");
    const fmt = /* @__PURE__ */ __name((ms) => {
      try {
        return ms ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(ms)) : "";
      } catch (e) {
        return "";
      }
    }, "fmt");
    if (env.R2) {
      for (const r of itens) {
        r._tam = "";
        try {
          if (r.temArquivo) {
            const h = await env.R2.head("exe/" + r.versao + ".exe");
            if (h && h.size) r._tam = (h.size / 1048576).toFixed(h.size >= 10485760 ? 0 : 1) + " MB";
          }
        } catch (e) {
          r._tam = "";
        }
      }
    }
    const blocos = itens.map((r, i) => {
      let imgsR = [];
      try {
        imgsR = r.imagens ? JSON.parse(r.imagens) : [];
      } catch (e) {
        imgsR = [];
      }
      const imgsHtml = (Array.isArray(imgsR) ? imgsR : []).filter(Boolean).slice(0, 8).map(function(k) {
        return '<img class="zi" src="/' + encodeURI(k) + '" alt="passo a passo" loading="lazy">';
      }).join("");
      const href = r.temArquivo ? linkDownload(origin, r.versao) : r.url || "";
      return `
      <section class="rel ${i === 0 ? "atual" : ""}" style="animation-delay:${i * 120}ms">
        <div class="rel-head">
          <span class="v">v${esc(r.versao)}</span>${i === 0 ? '<span class="selo-novo">\u25CF mais recente</span>' : ""}
          <span class="meta">${esc(fmt(r.publicadoEm))}${r._tam ? " \xB7 " + esc(r._tam) : ""}</span>
        </div>
        ${r.notas ? `<div class="notas"><h4>O que mudou nesta vers\xE3o</h4><pre>${esc(r.notas)}</pre></div>` : ""}
        ${r.tutorial || imgsHtml ? `<div class="tutorial"><h4>\u{1F4D6} Como baixar e instalar (passo a passo)</h4>${r.tutorial ? `<pre class="passo">${esc(r.tutorial)}</pre>` : ""}${imgsHtml ? `<div class="imgs">${imgsHtml}</div><p class="zi-dica">Toque na imagem para ampliar.</p>` : ""}</div>` : ""}
        ${href ? `<a class="baixar" href="${esc(href)}" target="_blank" rel="noopener"><span class="big">\u2B07</span><span><b>Baixar a atualiza\xE7\xE3o agora</b><small>${r._tam ? "Arquivo de " + esc(r._tam) + " \xB7 " : ""}instala por cima, sem perder nada</small></span></a>` : '<p class="sem-arq">\u23F3 O arquivo ainda est\xE1 subindo \u2014 volte em alguns minutos.</p>'}
        <p class="depois">Depois de baixar: abra o arquivo e avance a instala\xE7\xE3o. O sistema abre atualizado com <b>todos os seus dados no lugar</b>.</p>
      </section>`;
    }).join("\n");
    const vazio = `<div class="vazio"><div class="vz-ico">\u{1F553}</div><b>Nenhuma atualiza\xE7\xE3o dispon\xEDvel para voc\xEA agora.</b><br>Quando sair uma nova destinada \xE0 sua loja, ela aparece aqui \u2014 e o sistema tamb\xE9m avisa pelo sininho.</div>`;
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Portal oficial de atualiza\xE7\xF5es do Sistema DigiCopy \u2014 baixe a vers\xE3o mais recente com seguran\xE7a.">
<meta name="theme-color" content="#0a1e8a">
<title>DigiCopy \u2014 Portal de Atualiza\xE7\xF5es</title>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#f1f4fb;min-height:100vh;color:#0f172a;padding:0 0 56px}
  .faixa-topo{height:5px;background:linear-gradient(90deg,#0a1e8a,#06b6d4)}
  header{position:relative;overflow:hidden;color:#fff;padding:38px 20px 84px;text-align:center;background:linear-gradient(120deg,#101449 0%,#0a1e8a 48%,#0e7490 100%)}
  header::before{content:'';position:absolute;inset:0;background:radial-gradient(600px 220px at 18% -40px, rgba(139,152,255,.35), transparent 65%),radial-gradient(500px 200px at 85% -30px, rgba(34,211,238,.28), transparent 60%)}
  header .in{position:relative;z-index:1}
  .marca{display:inline-flex;align-items:center;gap:12px;animation:entra .6s ease both}
  .marca .logo{width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#4f5bff,#0a1e8a);display:grid;place-items:center;font-size:22px;font-weight:900;box-shadow:0 10px 24px rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.25)}
  .marca b{font-size:clamp(20px,4.6vw,28px);font-weight:900;letter-spacing:.3px;text-align:left;line-height:1.1;display:block}
  .marca small{display:block;font-size:11.5px;opacity:.85;font-weight:600;text-align:left;margin-top:2px}
  header h1{font-size:clamp(21px,4.4vw,30px);font-weight:900;margin-top:22px;animation:entra .6s .1s ease both}
  header .sub{opacity:.92;font-size:13.5px;margin-top:8px;max-width:560px;margin-left:auto;margin-right:auto;line-height:1.55;animation:entra .6s .18s ease both}
  .confianca{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:16px;animation:entra .6s .26s ease both}
  .confianca span{font-size:11px;font-weight:700;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.22);padding:6px 12px;border-radius:999px;backdrop-filter:blur(4px)}
  @keyframes entra{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  .chip-sessao{position:relative;z-index:2;max-width:760px;margin:-46px auto 0;padding:0 14px}
  .chip-sessao .c{background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 14px 34px rgba(10,30,138,.12);padding:13px 18px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12.5px;color:#334155}
  .chip-sessao .ponto{width:9px;height:9px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.18)}
  .chip-sessao b{color:#0a1e8a}
  .chip-sessao a{margin-left:auto;font-size:12px;font-weight:800;color:#0a1e8a;text-decoration:none;padding:6px 12px;border:1px solid #c7d2fe;border-radius:10px}
  .chip-sessao a:hover{background:#eef2ff}
  .passos{max-width:760px;margin:16px auto 0;padding:0 14px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
  .passo-card{flex:1 1 160px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:16px 14px;text-align:center;box-shadow:0 8px 22px rgba(10,30,138,.06)}
  .passo-card .num{display:inline-flex;width:30px;height:30px;border-radius:50%;align-items:center;justify-content:center;background:#0a1e8a;color:#fff;font-weight:900;font-size:14px}
  .passo-card b{display:block;margin-top:9px;font-size:13.5px}
  .passo-card span.d{display:block;margin-top:4px;font-size:11.5px;color:#64748b;line-height:1.5}
  main{max-width:760px;margin:22px auto 0;padding:0 14px;display:flex;flex-direction:column;gap:18px}
  .rel{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:22px;box-shadow:0 10px 28px rgba(10,30,138,.06);animation:entra .6s both;transition:transform .22s ease,box-shadow .22s ease}
  .rel:hover{transform:translateY(-3px);box-shadow:0 18px 44px rgba(10,30,138,.13)}
  .rel.atual{border:2px solid #0a1e8a;box-shadow:0 14px 38px rgba(10,30,138,.12)}
  .rel-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .v{font-size:20px;font-weight:900;color:#0a1e8a;font-variant-numeric:tabular-nums}
  .selo-novo{background:#0a1e8a;color:#fff;font-size:10.5px;font-weight:800;padding:4px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:.5px}
  .meta{margin-left:auto;font-size:11.5px;color:#64748b;font-weight:600}
  .notas{margin-top:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:15px}
  .notas h4{font-size:12px;color:#0a1e8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
  .notas pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;font-size:13.5px;line-height:1.65;color:#334155}
  .tutorial{margin-top:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:15px}
  .tutorial h4{font-size:13px;color:#92400e;margin-bottom:9px}
  .passo{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;font-size:13px;line-height:1.7;color:#334155}
  .imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:10px}
  .zi{width:100%;border-radius:12px;border:1px solid #e2e8f0;cursor:zoom-in;transition:transform .18s ease;animation:entra .5s ease both}.zi:hover{transform:scale(1.03)}
  .zi-dica{margin-top:8px;font-size:11px;color:#92400e}
  .baixar{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:18px;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-decoration:none;padding:18px 22px;border-radius:16px;box-shadow:0 12px 28px rgba(22,163,74,.32);transition:transform .18s ease,box-shadow .18s ease}
  .baixar:hover{transform:scale(1.018);box-shadow:0 16px 34px rgba(22,163,74,.38)}
  .baixar .big{font-size:26px}
  .baixar b{display:block;font-size:17px;font-weight:900}
  .baixar small{display:block;font-size:11.5px;opacity:.92;font-weight:600;margin-top:2px}
  .depois{margin-top:12px;font-size:12.5px;color:#64748b;text-align:center;line-height:1.6}
  .sem-arq{margin-top:12px;font-size:12.5px;color:#b45309;font-style:italic}
  .vazio{background:#fff;border:1px dashed #cbd5e1;border-radius:20px;padding:44px 24px;text-align:center;color:#64748b;font-size:13.5px;line-height:1.7;animation:entra .6s both}
  .vazio .vz-ico{font-size:34px;margin-bottom:10px}
  footer{text-align:center;margin-top:34px;font-size:11.5px;color:#94a3b8;line-height:1.8}
  footer .linha{max-width:520px;margin:0 auto;padding:12px 16px;border-top:1px solid #e2e8f0}
  @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div class="faixa-topo"></div>
<header>
  <div class="in">
    <div class="marca"><span class="logo">D</span><b>Sistema DigiCopy<small>Portal oficial de atualiza\xE7\xF5es</small></b></div>
    <h1>Atualize seu sistema com seguran\xE7a</h1>
    <p class="sub">Aqui voc\xEA baixa a vers\xE3o oficial mais recente, com o passo a passo em imagens. Baixou, executou, atualizou \u2014 seus dados continuam todos no lugar.</p>
    <div class="confianca"><span>\u{1F512} Conex\xE3o segura</span><span>\u2705 Vers\xE3o oficial verificada</span><span>\u{1F5C2} Seus dados s\xE3o preservados</span></div>
  </div>
</header>
<div class="chip-sessao"><div class="c"><span class="ponto"></span><span>Entrada autorizada para <b>${esc(cnpjHum)}</b></span><a href="/atualizacoes?logout=1">sair</a></div></div>
<div class="passos">
  <div class="passo-card"><span class="num">1</span><b>Baixar</b><span class="d">Aperte o bot\xE3o verde da vers\xE3o mais recente.</span></div>
  <div class="passo-card"><span class="num">2</span><b>Executar por cima</b><span class="d">Abra o arquivo baixado e avance \u2014 instala em cima da vers\xE3o atual.</span></div>
  <div class="passo-card"><span class="num">3</span><b>Pronto</b><span class="d">Abra o sistema normal: seus dados continuam todos no lugar.</span></div>
</div>
<main>
  ${blocos || vazio}
</main>
<footer><div class="linha">Sistema DigiCopy \u2014 atualiza\xE7\xF5es oficiais deste canal.<br>Precisa de ajuda? Fale com quem instalou o sistema na sua loja.</div></footer>
<div id="lbz" style="display:none;position:fixed;inset:0;background:rgba(2,6,23,.93);z-index:99;align-items:center;justify-content:center;cursor:zoom-out;padding:18px"><img id="lbzi" alt="imagem ampliada" style="max-width:96vw;max-height:94vh;border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,.5)"></div>
<script>(function(){document.addEventListener('click',function(ev){var t=ev.target;if(t&&t.tagName==='IMG'&&t.classList&&t.classList.contains('zi')){var b=document.getElementById('lbz'),i=document.getElementById('lbzi');i.src=t.getAttribute('src');b.style.display='flex';}else if(t&&(t.id==='lbz'||t.id==='lbzi')){document.getElementById('lbz').style.display='none';}},true);})();<\/script>
</body>
</html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  }
  if (request.method === "GET" && url.pathname === "/v1/admin/activity") return handleActivity(request, env);
  if (request.method === "POST" && url.pathname === "/v1/devices/revoke") return handleRevokeDevice(request, env);
  if (request.method === "POST" && url.pathname === "/v1/devices/delete-forever") return handleDeleteDevice(request, env);
  if (request.method === "POST" && url.pathname === "/v1/admin/reset-cloud") return handleResetCloud(request, env);
  if (request.method === "GET" && url.pathname === "/v1/status") return handleStatus(request, env, ctx);
  if (request.method === "GET" && url.pathname === "/v1/backups") return handleBackupListar(request, env);
  if (request.method === "GET" && url.pathname === "/v1/backup") return handleBackupBaixar(request, env);
  if (request.method === "DELETE" && url.pathname === "/v1/backup") return handleBackupApagarUm(request, env);
  if (request.method === "DELETE" && url.pathname === "/v1/backups") return handleBackupApagarTodos(request, env);
  if (request.method === "POST" && url.pathname === "/v1/backup/agora") return handleBackupAgora(request, env);
  throw new ApiError(404, "NOT_FOUND", "Rota n\xE3o encontrada.");
}
__name(route, "route");
function dataArquivoSP(agora) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(agora).replaceAll("/", "-");
}
__name(dataArquivoSP, "dataArquivoSP");
function horaArquivoSP(agora) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(agora).replace(":", "h").replace("\u200F", "").trim();
}
__name(horaArquivoSP, "horaArquivoSP");
var PASTA_DIARIO = "Backup diario";
var PASTA_ATUALIZACOES = "Backup atualiza\xE7\xF5es";
var PASTA_MANUAL = "Backup manual";
function nomeBackupDiario(agora) {
  return PASTA_DIARIO + "/Backup " + dataArquivoSP(agora) + ".json";
}
__name(nomeBackupDiario, "nomeBackupDiario");
function nomeBackupSistema(versaoAnterior) {
  return PASTA_ATUALIZACOES + "/Backup sistema " + String(versaoAnterior || "").trim() + ".json";
}
__name(nomeBackupSistema, "nomeBackupSistema");
function nomeBackupManual(seq) {
  return PASTA_MANUAL + "/Backup manual " + seq + ".json";
}
__name(nomeBackupManual, "nomeBackupManual");
async function proximoSeqManual(env) {
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
__name(proximoSeqManual, "proximoSeqManual");
function compararVersao(a, b) {
  const pa = String(a || "").replace(/^v/i, "").split(".").map((x) => parseInt(x, 10) || 0);
  const pb = String(b || "").replace(/^v/i, "").split(".").map((x) => parseInt(x, 10) || 0);
  const tam = Math.max(pa.length, pb.length);
  for (let i = 0; i < tam; i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}
__name(compararVersao, "compararVersao");
async function gzipTexto(texto) {
  const dados = new TextEncoder().encode(texto);
  const stream = new Blob([dados]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
__name(gzipTexto, "gzipTexto");
async function gunzipBytes(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}
__name(gunzipBytes, "gunzipBytes");
var __BACKUP_TABELA_OK = false;
async function garantirTabelaBackups(env) {
  if (__BACKUP_TABELA_OK) return;
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS backups (id TEXT PRIMARY KEY, nome TEXT NOT NULL, pasta TEXT NOT NULL, tipo TEXT NOT NULL, tamanho_original INTEGER NOT NULL, tamanho_gzip INTEGER NOT NULL, registros INTEGER NOT NULL, gerado_em INTEGER NOT NULL)`);
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS backups_chunks (id TEXT NOT NULL, seq INTEGER NOT NULL, chunk BLOB NOT NULL, PRIMARY KEY (id, seq))`);
  __BACKUP_TABELA_OK = true;
}
__name(garantirTabelaBackups, "garantirTabelaBackups");
var TAMANHO_CHUNK = 15e5;
async function gerarBackup(env, chave, meta) {
  const records = [];
  let pulados = 0;
  for (let guard = 0; guard < 500; guard++) {
    const lote = await env.DB.prepare(
      `SELECT entity, record_id, data_json, version, updated_at, deleted_at, updated_by
         FROM records ORDER BY entity ASC, record_id ASC LIMIT 1000 OFFSET ?`
    ).bind(pulados).all();
    const linhas = lote.results || [];
    records.push(...linhas);
    if (linhas.length < 1e3) break;
    pulados += linhas.length;
  }
  const devices = await env.DB.prepare(
    `SELECT id, name, role, created_at, last_seen_at, revoked_at FROM devices WHERE excluido_em IS NULL ORDER BY created_at ASC`
  ).all();
  const totals = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM records WHERE deleted_at IS NULL) AS records_vivos,
            (SELECT COUNT(*) FROM records WHERE deleted_at IS NOT NULL) AS records_excluidos,
            (SELECT COUNT(*) FROM changes) AS changes`
  ).first();
  const agora = /* @__PURE__ */ new Date();
  const arquivo = {
    ferramenta: "digicopy-backup",
    tipo: meta && meta.tipo || "manual",
    versaoSistemaAnterior: meta && meta.versaoAnterior || void 0,
    geradoEm: agora.toISOString(),
    geradoEmSaoPaulo: agora.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    totais: totals || {},
    aparelhos: devices.results || [],
    registros: records
  };
  const texto = JSON.stringify(arquivo, null, 2);
  const gzip = await gzipTexto(texto);
  await garantirTabelaBackups(env);
  const corte = chave.indexOf("/");
  const pasta = corte > 0 ? chave.slice(0, corte) : "";
  const nome = corte > 0 ? chave.slice(corte + 1) : chave;
  const partes = [];
  for (let i = 0; i < gzip.length; i += TAMANHO_CHUNK) {
    partes.push(gzip.slice(i, i + TAMANHO_CHUNK));
  }
  const lotes = [
    env.DB.prepare("DELETE FROM backups WHERE id = ?").bind(chave),
    env.DB.prepare("DELETE FROM backups_chunks WHERE id = ?").bind(chave)
  ].concat(
    [env.DB.prepare(
      `INSERT INTO backups(id, nome, pasta, tipo, tamanho_original, tamanho_gzip, registros, gerado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(chave, nome, pasta, meta && meta.tipo || "manual", texto.length, gzip.length, records.length, Date.now())]
  ).concat(
    partes.map((p, idx) => env.DB.prepare(
      "INSERT INTO backups_chunks(id, seq, chunk) VALUES (?, ?, ?)"
    ).bind(chave, idx, p))
  );
  for (let i = 0; i < lotes.length; i += 25) {
    await env.DB.batch(lotes.slice(i, i + 25));
  }
  return { nome: chave, registros: records.length, tamanho: gzip.length };
}
__name(gerarBackup, "gerarBackup");
async function checarTrocaDeVersao(request, env, ctx) {
  const versaoApp = (request.headers.get("x-digicopy-versao") || "").trim();
  if (!versaoApp) return;
  const atual = await env.DB.prepare(
    "SELECT value FROM system_meta WHERE key = ? LIMIT 1"
  ).bind("backup_ultima_versao").first();
  const ultima = atual && atual.value ? String(atual.value) : "";
  if (compararVersao(versaoApp, ultima) <= 0) return;
  await env.DB.prepare(
    `INSERT INTO system_meta(key, value, updated_at) VALUES ('backup_ultima_versao', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind(versaoApp, Date.now()).run();
  if (!ultima) return;
  const tarefa = gerarBackup(env, nomeBackupSistema(ultima), { tipo: "sistema", versaoAnterior: ultima }).catch((e) => console.error("BACKUP_VERSAO_FALHOU", e));
  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(tarefa);
  else await tarefa;
}
__name(checarTrocaDeVersao, "checarTrocaDeVersao");
function chaveBackupValida(chave) {
  return !!chave && chave.indexOf("..") < 0 && chave.length < 300;
}
__name(chaveBackupValida, "chaveBackupValida");
async function handleBackupListar(request, env) {
  await requireUsuarioAdmin(request, env);
  await garantirTabelaBackups(env);
  const r = await env.DB.prepare(
    `SELECT id, nome, pasta, tipo, tamanho_original, tamanho_gzip, registros, gerado_em
       FROM backups ORDER BY gerado_em DESC LIMIT 300`
  ).all();
  const backups = (r.results || []).map((x) => ({
    chave: x.id,
    nome: x.nome,
    pasta: x.pasta,
    tipo: x.tipo,
    tamanho: x.tamanho_original,
    tamanhoGzip: x.tamanho_gzip,
    registros: x.registros,
    geradoEm: new Date(Number(x.gerado_em)).toISOString()
  }));
  return json({ ok: true, backups });
}
__name(handleBackupListar, "handleBackupListar");
async function lerBackupCompleto(env, chave) {
  const meta = await env.DB.prepare("SELECT id, tamanho_gzip FROM backups WHERE id = ?").bind(chave).first();
  if (!meta) return null;
  const linhas = await env.DB.prepare("SELECT chunk FROM backups_chunks WHERE id = ? ORDER BY seq ASC").bind(chave).all();
  const partes = (linhas.results || []).map((x) => new Uint8Array(x.chunk));
  const total = partes.reduce((a, p) => a + p.length, 0);
  const gzip = new Uint8Array(total);
  let pos = 0;
  partes.forEach((p) => {
    gzip.set(p, pos);
    pos += p.length;
  });
  return { gzip, meta };
}
__name(lerBackupCompleto, "lerBackupCompleto");
async function handleBackupBaixar(request, env) {
  await requireUsuarioAdmin(request, env);
  await garantirTabelaBackups(env);
  const chave = new URL(request.url).searchParams.get("key") || "";
  if (!chaveBackupValida(chave)) throw new ApiError(400, "NOME_INVALIDO", "Nome de backup inv\xE1lido.");
  const achado = await lerBackupCompleto(env, chave);
  if (!achado) throw new ApiError(404, "BACKUP_NAO_ACHOU", "Backup n\xE3o encontrado na nuvem.");
  const texto = await gunzipBytes(achado.gzip);
  const corte = chave.indexOf("/");
  const nomeFinal = corte > 0 ? chave.slice(corte + 1) : chave;
  return new Response(texto, {
    headers: {
      ...JSON_HEADERS,
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="' + nomeFinal.replaceAll('"', "") + '"'
    }
  });
}
__name(handleBackupBaixar, "handleBackupBaixar");
async function handleBackupApagarUm(request, env) {
  await requireUsuarioAdmin(request, env);
  await garantirTabelaBackups(env);
  const chave = new URL(request.url).searchParams.get("key") || "";
  if (!chaveBackupValida(chave)) throw new ApiError(400, "NOME_INVALIDO", "Nome de backup inv\xE1lido.");
  await env.DB.batch([
    env.DB.prepare("DELETE FROM backups WHERE id = ?").bind(chave),
    env.DB.prepare("DELETE FROM backups_chunks WHERE id = ?").bind(chave)
  ]);
  return json({ ok: true, apagado: chave });
}
__name(handleBackupApagarUm, "handleBackupApagarUm");
async function handleBackupApagarTodos(request, env) {
  await requireUsuarioAdmin(request, env);
  await garantirTabelaBackups(env);
  const antes = await env.DB.prepare("SELECT COUNT(*) AS n FROM backups").first();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM backups"),
    env.DB.prepare("DELETE FROM backups_chunks")
  ]);
  return json({ ok: true, apagados: antes && antes.n || 0 });
}
__name(handleBackupApagarTodos, "handleBackupApagarTodos");
async function handleBackupAgora(request, env) {
  await requireUsuarioAdmin(request, env);
  const corpo = await readBody(request).catch(() => ({}));
  const tipo = corpo && corpo.tipo === "atualizacao" ? "atualizacao" : "manual";
  let chave;
  if (tipo === "atualizacao") {
    const versao = cleanText(corpo && corpo.versao || "", 40) || "sem-numero";
    chave = nomeBackupSistema(versao + " (antes de mexer)");
  } else {
    chave = nomeBackupManual(await proximoSeqManual(env));
  }
  const r = await gerarBackup(env, chave, { tipo: tipo === "atualizacao" ? "sistema" : "manual", versaoAnterior: corpo && corpo.versao || void 0 });
  return json({ ok: true, backup: r.nome, registros: r.registros });
}
__name(handleBackupAgora, "handleBackupAgora");
var index_default = {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch (error) {
      if (error instanceof ApiError) {
        return json({ ok: false, error: error.code, message: error.message }, error.status);
      }
      console.error("DIGICOPY_API_ERROR", error);
      const motivo = String(error && error.message || error || "").slice(0, 200);
      return json({ ok: false, error: "INTERNAL_ERROR", message: "Erro interno da API." + (motivo ? " Motivo: " + motivo : ""), detail: motivo }, 500);
    }
  },
  // Relógio da própria nuvem: todo dia 18:30 de São Paulo faz o backup
  // diário sozinho — não precisa de nenhum PC ligado.
  async scheduled(event, env, ctx) {
    try {
      const nome = nomeBackupDiario(/* @__PURE__ */ new Date());
      const r = await gerarBackup(env, nome, { tipo: "diario" });
      console.log("BACKUP_DIARIO_OK", JSON.stringify(r));
    } catch (e) {
      console.error("BACKUP_DIARIO_FALHOU", e);
    }
  }
};
var __test = { cleanText, sha256, sameSecret, randomToken, publicRecord, activityLabel, nomeBackupDiario, nomeBackupSistema, nomeBackupManual, compararVersao, dataArquivoSP, gzipTexto, gunzipBytes };
export {
  __test,
  index_default as default
};
