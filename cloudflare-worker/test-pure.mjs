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

console.log('== BACKUPS AUTOMÁTICOS v5.22.97 ==');

// Duas pastas separadas, com os nomes do desenho do dono
const dia = new Date('2026-09-08T21:30:00Z'); // 18:30 em São Paulo
assert.equal(__test.nomeBackupDiario(dia), 'Backup diario/Backup 08-09-2026.json');
console.log('  ✔ diário mora na pasta "Backup diario"');

assert.equal(__test.nomeBackupSistema('5.22.95'), 'Backup atualizações/Backup sistema 5.22.95.json');
console.log('  ✔ backup de atualização mora na pasta "Backup atualizações", nome da versão anterior');

const manual = __test.nomeBackupManual(1);
assert.equal(manual, 'Backup manual/Backup manual 1.json');
assert.equal(__test.nomeBackupManual(12), 'Backup manual/Backup manual 12.json');
console.log('  ✔ reforço manual numerado (v5.24.0): "Backup manual N.json" — o número nunca se repete');

// 00:30 UTC = 21:30 do DIA ANTERIOR em SP — não pode pular dia
const madrugada = new Date('2026-09-09T00:30:00Z');
assert.equal(__test.nomeBackupDiario(madrugada), 'Backup diario/Backup 08-09-2026.json');
console.log('  ✔ madrugada UTC continua no dia certo de São Paulo');

// Comparação de versões
assert.equal(__test.compararVersao('5.22.96', '5.22.95'), 1);
assert.equal(__test.compararVersao('5.22.95', '5.22.95'), 0);
assert.equal(__test.compararVersao('v5.22.95', '5.22.96'), -1);
assert.equal(__test.compararVersao('5.22.96', ''), 1);
assert.equal(__test.compararVersao('5.9.9', '5.22.1'), -1);
console.log('  ✔ versão nova só dispara backup quando é MAIOR (PC velho não dispara "desatualização")');

// gzip de ida e volta (o que grava compactado volta idêntico ao baixar)
const textoOriginal = JSON.stringify({a:1, nome:'Lojação'}) + ' bem longão '.repeat(5000);
const gz = await __test.gzipTexto(textoOriginal);
const de_volta = await __test.gunzipBytes(gz);
assert.equal(de_volta, textoOriginal);
assert.ok(gz.length < textoOriginal.length, 'compactou mesmo');
console.log('  ✔ backup grava compactado e baixa idêntico ao original');
