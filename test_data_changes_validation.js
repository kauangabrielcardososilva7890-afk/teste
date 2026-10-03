const assert = require('node:assert/strict');
const fs = require('node:fs');

const code = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const window = { DIGICOPY_CLOUD: { token: () => '' } };
const localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
new Function('window', 'localStorage', 'document', code)(window, localStorage, undefined);

const validate = window.DIGICOPY_CLOUD_SYNC.validarPaginaChanges;
assert.equal(typeof validate, 'function');

const validUpsert = (seq, overrides = {}) => ({
  seq,
  mutationId: `mut_${seq}`,
  entity: 'clientes',
  recordId: `cli_${seq}`,
  operation: 'upsert',
  data: { id: `cli_${seq}`, nome: 'Cliente' },
  version: 1,
  deviceId: 'device_1',
  createdAt: 1000,
  ...overrides
});
const validDelete = (seq, overrides = {}) => ({
  ...validUpsert(seq, { operation: 'delete', data: null }),
  ...overrides
});

for (const invalid of [null, undefined, 'json', 3, [], {}, { changes: null }, { changes: {} }]) {
  assert.throws(() => validate(invalid, 5), /resposta|lista changes/);
}

const emptyPage = { changes: [], nextCursor: 5, hasMore: false };
assert.deepEqual(validate(emptyPage, 5), emptyPage, 'página vazia válida permanece aceita');
const validPage = { changes: [validUpsert(7), validDelete(9)], nextCursor: 9, hasMore: false };
assert.deepEqual(validate(validPage, 5), validPage, 'página válida com lacuna de seq é aceita');
assert.deepEqual(validate({ changes: [validUpsert(6)], nextCursor: 6, hasMore: true }, 5).nextCursor, 6);
assert.doesNotThrow(() => validate({ changes: [validUpsert(6, { entity: 'modulosDinamicos', data: { value: null } })], nextCursor: 6, hasMore: false }, 5));

const incomplete = { ...validUpsert(6) };
delete incomplete.recordId;
const invalidItems = [
  incomplete,
  validUpsert(6, { entity: '' }),
  validUpsert(6, { entity: '__local' }),
  validUpsert(6, { recordId: '   ' }),
  validUpsert(6, { recordId: 'x'.repeat(161) }),
  validUpsert(6, { operation: 'replace' }),
  validUpsert(6, { version: 0 }),
  validUpsert(6, { version: 1.5 }),
  validUpsert(6, { data: null }),
  validUpsert(6, { data: [] }),
  validUpsert(6, { entity: 'modulosDinamicos', data: {} }),
  validDelete(6, { entity: null }),
  validDelete(6, { version: NaN })
];
for (const item of invalidItems) {
  assert.throws(() => validate({ changes: [item], nextCursor: 6, hasMore: false }, 5), /item|mudança/);
}

for (const invalid of [
  { changes: [], nextCursor: 6, hasMore: false },
  { changes: [validUpsert(6)], nextCursor: 7, hasMore: false },
  { changes: [validUpsert(6), validDelete(6)], nextCursor: 6, hasMore: false },
  { changes: [], nextCursor: 5, hasMore: true }
]) assert.throws(() => validate(invalid, 5));

let cursor = 5;
const rejectedPage = { changes: [validUpsert(6, { data: null })], nextCursor: 6, hasMore: false };
assert.throws(() => {
  const page = validate(rejectedPage, cursor);
  cursor = page.nextCursor;
});
assert.equal(cursor, 5, 'página rejeitada não avança o cursor');

const rapidStart = code.indexOf('async function passeRapidoInicial');
const pullStart = code.indexOf('async function pullAll');
const rapidValidate = code.indexOf('validarPaginaChanges(resposta,cursor)', rapidStart);
const rapidCursor = code.indexOf('cursor=data.nextCursor', rapidStart);
const pullValidate = code.indexOf('validarPaginaChanges(resposta,cursorAntes)', pullStart);
const pullCursor = code.indexOf('state.cursor=data.nextCursor', pullStart);
assert.ok(rapidValidate >= 0 && rapidValidate < rapidCursor, 'passe rápido valida antes de avançar seu cursor');
assert.ok(pullValidate >= 0 && pullValidate < pullCursor, 'pull incremental valida antes de avançar o cursor persistente');

console.log('PASS: itens de data.changes validados e cursor protegido');
