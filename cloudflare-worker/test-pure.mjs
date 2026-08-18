import assert from 'node:assert/strict';
import { __test } from './src/index.js';

console.log('== DIGICOPY CLOUD API: FUNÇÕES PURAS ==');
assert.equal(__test.cleanText('  Computador Loja  ', 80), 'Computador Loja');
assert.equal(__test.cleanText('', 80), null);
assert.equal(__test.cleanText('x'.repeat(81), 80), null);
console.log('  ✔ valida e normaliza textos');

const h1 = await __test.sha256('segredo');
const h2 = await __test.sha256('segredo');
const h3 = await __test.sha256('outro');
assert.equal(h1, h2);
assert.notEqual(h1, h3);
assert.equal(h1.length, 64);
console.log('  ✔ hash SHA-256 determinístico');

assert.equal(await __test.sameSecret('abc', 'abc'), true);
assert.equal(await __test.sameSecret('abc', 'abd'), false);
assert.equal(await __test.sameSecret('', ''), false);
console.log('  ✔ comparação de segredo');

const tokens = new Set(Array.from({length: 100}, () => __test.randomToken('dcp_')));
assert.equal(tokens.size, 100);
assert.ok([...tokens].every(token => /^dcp_[A-Za-z0-9_-]{40,}$/.test(token)));
console.log('  ✔ tokens aleatórios únicos e seguros');

const record = __test.publicRecord({
  entity:'clientes', record_id:'cli_1', data_json:'{"nome":"Teste"}', version:2,
  updated_at:123, deleted_at:null, updated_by:'dev_1'
});
assert.deepEqual(record, {
  entity:'clientes', recordId:'cli_1', data:{nome:'Teste'}, version:2,
  updatedAt:123, deletedAt:null, updatedBy:'dev_1'
});
console.log('  ✔ serialização pública de registro');

assert.equal(__test.activityLabel('{"nome":"Cliente Loja"}','cli_1'), 'Cliente Loja');
assert.equal(__test.activityLabel('{"senha":"x"}','cli_9'), 'cli_9');
assert.ok(__test.activityLabel('{"nome":"'+('A'.repeat(90))+'"}','id').length<=80);
console.log('  ✔ rótulo de acompanhamento sem vazar senha');
console.log('\nRESULTADO: funções puras da API passaram!');
