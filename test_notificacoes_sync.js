const assert = require('node:assert/strict');
const fs = require('node:fs');

const code = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const start = code.indexOf('function applyRemote(change,mapaDado){');
const end = code.indexOf('\nfunction localKeysSnapshot(){', start);
assert.ok(start >= 0 && end > start, 'applyRemote deve existir no código de sincronização');
const applyRemoteSource = code.slice(start, end);

const db = { notificacoes: [{ id: 'local-1', texto: 'aviso local', lida: false }] };
const state = { versions: {}, known: {}, hashes: {} };
const applyRemote = new Function(
  'db', 'state', 'definicoes', 'NAO_SINCRONIZA', 'key', 'posicaoNaLista', 'marcarEstado', 'hash',
  `${applyRemoteSource}; return applyRemote;`
)(
  db,
  state,
  () => ({ config: 'root' }),
  new Set(['meta', '__proto__', 'logs', 'notificacoes']),
  (entity, id) => `${entity}|${id}`,
  (entity, id) => db[entity].findIndex(item => item && String(item.id) === String(id)),
  () => {},
  value => JSON.stringify(value)
);

const remote = {
  entity: 'notificacoes', recordId: 'remote-1', operation: 'upsert', version: 1,
  data: { id: 'remote-1', tipo: 'orcamento_aprovado', texto: 'aviso remoto', lida: false }
};
assert.equal(applyRemote(remote, {}), true, 'notificação do Worker deve ser aplicada');
assert.equal(db.notificacoes.length, 2, 'notificação remota é anexada sem remover a local');
assert.equal(db.notificacoes[0].id, 'local-1', 'notificação local é preservada');

assert.equal(applyRemote({ ...remote, version: 2, data: { ...remote.data, texto: 'aviso remoto atualizado' } }, {}), true);
assert.equal(db.notificacoes.length, 2, 'atualização pelo mesmo ID não duplica');
assert.equal(db.notificacoes[1].texto, 'aviso remoto atualizado');

assert.equal(applyRemote({ ...remote, operation: 'delete', data: null, version: 3 }, {}), true);
assert.deepEqual(db.notificacoes.map(item => item.id), ['local-1'], 'delete remove somente a notificação remota correspondente');

const window = { DIGICOPY_CLOUD: { token: () => '' } };
const localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
new Function('window', 'localStorage', 'document', code)(window, localStorage, undefined);
const validate = window.DIGICOPY_CLOUD_SYNC.validarPaginaChanges;
assert.doesNotThrow(() => validate({
  changes: [{ ...remote, seq: 1 }], nextCursor: 1, hasMore: false
}, 0), 'a validação aceita a entidade notificacoes emitida pelo Worker');

console.log('PASS: notificações remotas são aplicadas por ID e preservam as locais');
