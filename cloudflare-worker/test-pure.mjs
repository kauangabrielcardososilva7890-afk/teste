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

console.log('== BACKUPS AUTOMÁTICOS v5.22.96 ==');

// Nome do arquivo diário: "Backup 08-09-2026.json" com data de São Paulo
const dia = new Date('2026-09-08T21:30:00Z'); // 18:30 em São Paulo
assert.equal(__test.nomeBackupDiario(dia), 'Backup 08-09-2026.json');
console.log('  ✔ backup diário usa o nome do dono (dia de São Paulo)');

// 00:30 UTC = 21:30 do DIA ANTERIOR em SP — não pode pular dia
const madrugada = new Date('2026-09-09T00:30:00Z');
assert.equal(__test.nomeBackupDiario(madrugada), 'Backup 08-09-2026.json');
console.log('  ✔ madrugada UTC continua no dia certo de São Paulo');

// Nome do backup de atualização = versão ANTERIOR
assert.equal(__test.nomeBackupSistema('5.22.95'), 'Backup sistema 5.22.95.json');
console.log('  ✔ backup de atualização sai com o nome da versão anterior');

// Comparação de versões
assert.equal(__test.compararVersao('5.22.96', '5.22.95'), 1);
assert.equal(__test.compararVersao('5.22.95', '5.22.95'), 0);
assert.equal(__test.compararVersao('v5.22.95', '5.22.96'), -1);
assert.equal(__test.compararVersao('5.22.96', ''), 1);
assert.equal(__test.compararVersao('5.9.9', '5.22.1'), -1);
console.log('  ✔ versão nova só dispara backup quando é MAIOR (PC velho não dispara "desatualização")');
