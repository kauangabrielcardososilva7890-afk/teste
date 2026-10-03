// ═══════════════════════════════════════════════════════════════════════════
// AUDITAR MORTOS — ideia B: lista arquivo por arquivo com a PROVA de quem chama.
// Não apaga nada: só classifica. Apagar é decisão humana, um bloco por vez, com
// a suíte verde antes e depois (regra do dono: só o 100% morto e provado).
// Uso: node auditar_mortos.js
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const todosJs = fs.readdirSync(RAIZ).filter((f) => f.endsWith('.js'));
const manifest = JSON.parse(fs.readFileSync(path.join(RAIZ, 'bundle-manifest.json'), 'utf8'));
const noBundle = new Set(manifest);
const pkg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
const runner = fs.readFileSync(path.join(RAIZ, 'test_runner.js'), 'utf8');
const dentroRunner = runner.slice(runner.indexOf('const tests=['), runner.indexOf('];', runner.indexOf('const tests=[')));
const registrados = new Set((dentroRunner.match(/"([^"]+\.js)"/g) || []).map((x) => x.replace(/"/g, '')));

// tudo que referencia: scripts do package.json, runner, requires, html (src), .cmd
const refs = {}; // arquivo -> [quem cita]
function citar(alvo, por) {
  alvo = String(alvo).replace(/^\.\//, '').replace(/\?.*$/, '');
  if (!todosJs.includes(alvo)) return;
  (refs[alvo] = refs[alvo] || new Set()).add(por);
}
JSON.stringify(pkg.scripts || {}).replace(/[\w./-]+\.js/g, (m) => { citar(m, 'package.json#scripts'); return m; });
registrados.forEach((t) => citar(t, 'test_runner.js')); // registrado = rodado pela suíte
todosJs.forEach((f) => {
  let s = '';
  try { s = fs.readFileSync(path.join(RAIZ, f), 'utf8'); } catch (e) { return; }
  (s.match(/require\(\s*['"]\.\/([\w./-]+)['"]/g) || []).forEach((m) => {
    let alvo = m.replace(/.*\.\//, '').replace(/['"]$/, '');
    if (!alvo.endsWith('.js')) alvo += '.js'; // require sem extensão
    citar(alvo, f);
  });
  (s.match(/readFileSync\(['"]([\w./-]+\.js)['"]/g) || []).forEach((m) => {
    citar(m.replace(/.*['"]/, ''), f);
  });
});
fs.readdirSync(RAIZ).filter((f) => f.endsWith('.html')).forEach((h) => {
  const s = fs.readFileSync(path.join(RAIZ, h), 'utf8');
  (s.match(/src="([\w./-]+\.js)(\?[^"]*)?"/g) || []).forEach((m) => {
    citar(m.replace(/src="/, '').replace(/"$/, ''), h);
  });
});
fs.readdirSync(RAIZ).filter((f) => f.endsWith('.cmd')).forEach((c) => {
  const s = fs.readFileSync(path.join(RAIZ, c), 'utf8');
  (s.match(/[\w./-]+\.js/g) || []).forEach((m) => { citar(m, c); });
});

console.log('== A) raiz .js fora do bundle e fora dos testes (ferramentas?) ==');
todosJs.filter((f) => !noBundle.has(f) && !/^test_/.test(f)).forEach((f) => {
  console.log(' - ' + f + '  <-- ' + ([...(refs[f] || [])].join(', ') || 'NINGUÉM CITA'));
});
console.log('\n== B) testes órfãos (existem, não estão no runner) ==');
const orfaos = todosJs.filter((f) => /^test_/.test(f) && !registrados.has(f) && f !== 'test_runner.js');
orfaos.forEach((f) => console.log(' - ' + f));
console.log('total órfãos: ' + orfaos.length);
console.log('\n== C) resumo ==');
console.log('raiz .js: ' + todosJs.length + ' | no bundle: ' + noBundle.size +
  ' | testes registrados: ' + registrados.size + ' | órfãos: ' + orfaos.length);
