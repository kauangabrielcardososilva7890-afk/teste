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

// v5.27.0 — O FREIO PREVENTIVO FALA A LÍNGUA DO PLANO (achado da rodada 28):
// o dono está no plano PAGO e o freio ainda usava o número do GRÁTIS (95.000/dia).
// Numa conta paga isso parava a nuvem no meio do dia: o que era digitado num PC
// não subia e não aparecia no outro ("os dados não demonstram").
const { freioDecide, PLANO_PAGO, PLANO_GRATIS } = __test;
assert.equal(freioDecide(1000, 1000, 20, PLANO_PAGO), '', 'conta paga: uso normal passa');
assert.equal(freioDecide(99000, 0, 2000, PLANO_GRATIS), 'dia', 'conta grátis: 99.000 + 2.000 passa do teto de 95.000');
assert.equal(freioDecide(99000, 0, 2000, PLANO_PAGO), '', 'CONTA PAGA não pode ser barrada no número do grátis');
assert.equal(freioDecide(PLANO_PAGO.freioDia + 1, 0, 1, PLANO_PAGO), 'dia', 'conta paga ainda tem freio — no teto do plano (1 milhão/dia)');
assert.equal(freioDecide(0, PLANO_PAGO.freioMes + 1, 1, PLANO_PAGO), 'mes', 'conta paga: o freio do MÊS (50 milhões) existe e funciona');
assert.equal(freioDecide(0, PLANO_PAGO.freioMes + 1, 1, PLANO_GRATIS), '', 'plano grátis não tem freio de mês');
assert.equal(freioDecide(-5, -5, -5, PLANO_PAGO), '', 'número inválido não vira susto');
assert.equal(PLANO_PAGO.pago, true, 'o plano confirmado por ele é o pago');
assert.equal(PLANO_GRATIS.pago, false, 'e o grátis continua definido, com os números dele');
console.log('  ✔ freio preventivo coerente com o plano (pago não para no teto do grátis)');

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

// v5.24.3 — o .exec() do D1 quebra os comandos por LINHA: DDL multilinha
// virava "incomplete input" e backups/medidor nunca criavam as tabelas.
const __src = (await import('node:fs')).readFileSync(new URL('./src/index.js', import.meta.url), 'utf8');
assert.ok(__src.includes('CREATE TABLE IF NOT EXISTS backups (id TEXT PRIMARY KEY'), 'ddl backups em uma linha só (v5.24.3)');
assert.ok(__src.includes('CREATE TABLE IF NOT EXISTS backups_chunks (id TEXT NOT NULL'), 'ddl backups_chunks em uma linha só (v5.24.3)');
assert.ok(__src.includes('CREATE TABLE IF NOT EXISTS uso_diario (dia TEXT PRIMARY KEY'), 'ddl uso_diario em uma linha só (v5.24.3)');
assert.ok(!/CREATE TABLE IF NOT EXISTS \w+ \(\s*\n/.test(__src), 'nenhum CREATE TABLE multilinha restante');
console.log('  ✔ DDL de backups/medidor em uma linha (v5.24.3): D1 .exec() quebra por linha');

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
