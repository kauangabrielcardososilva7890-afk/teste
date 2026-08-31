// ═══════════════════════════════════════════════════════════════════════════
// VERIFY_PACK — raio-X do que REALMENTE entrou no .exe.
//
// Roda logo depois do electron-builder e abre a pasta empacotada
// (dist/win-unpacked/resources/app) para conferir, arquivo por arquivo:
//
//   • todos os arquivos de build.files chegaram lá dentro;
//   • app.bundle.js empacotado é IDÊNTICO (sha256) ao do projeto — ou seja,
//     as atualizações novas realmente foram junto;
//   • a versão do index.html empacotado bate com a do package.json;
//   • nada que o index.html carrega ficou de fora (senão: tela quebrada).
//
// Se qualquer coisa faltar, o build FALHA em vez de gerar um instalador
// silenciosamente incompleto.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const versao = String(pkg.version || '').trim();

function acharPastaApp() {
  const candidatos = [
    path.join('dist', 'win-unpacked', 'resources', 'app'),
    path.join('dist', 'win-ia32-unpacked', 'resources', 'app'),
    path.join('dist', 'linux-unpacked', 'resources', 'app')
  ];
  for (const c of candidatos) if (fs.existsSync(c)) return c;
  // procura genérica: dist/*-unpacked/resources/app
  if (fs.existsSync('dist')) {
    for (const d of fs.readdirSync('dist')) {
      const p = path.join('dist', d, 'resources', 'app');
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

const APP = acharPastaApp();

// ── Modo simulação (--dry) ──────────────────────────────────────────────────
// Usa o MESMO matcher do electron-builder (app-builder-lib) para calcular a
// lista exata de arquivos que ele copiaria, sem precisar baixar o binário do
// Electron. Serve para conferir o empacotamento em máquina/CI sem rede.
if (process.argv.includes('--dry') || !APP) {
  let FileMatcher;
  try { ({ FileMatcher } = require('app-builder-lib/out/fileMatcher')); } catch (e) { FileMatcher = null; }

  if (!FileMatcher) {
    console.error('\n✘ VERIFY_PACK: não encontrei a pasta empacotada em dist/.');
    console.error('  (o electron-builder rodou? o build usa asar:false, então deve existir');
    console.error('   dist/win-unpacked/resources/app)');
    console.error('\n  Para conferir sem empacotar, instale as dependências e rode:');
    console.error('    npm install --ignore-scripts && node verify_pack.js --dry\n');
    process.exit(1);
  }

  const matcher = new FileMatcher(process.cwd(), '/out', s => s, pkg.build.files);
  const filtro = matcher.createFilter();
  const IGNORAR = new Set(['node_modules', '.git', 'dist', 'mobile', 'e2e', 'cloudflare-worker']);
  const copiados = [];
  (function anda(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (IGNORAR.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) anda(full);
      else if (filtro(full, fs.statSync(full))) copiados.push(path.relative(process.cwd(), full).split(path.sep).join('/'));
    }
  })(process.cwd());

  const problemas = [];
  const htmlSrc = fs.readFileSync('index.html', 'utf8');
  const re = /(?:src|href)="\.\/([A-Za-z0-9_.\-/]+?)(?:\?[^"]*)?"/g;
  let mm;
  while ((mm = re.exec(htmlSrc)) !== null) {
    if (copiados.indexOf(mm[1]) < 0) problemas.push(`index.html carrega "${mm[1]}", mas o electron-builder NÃO copiaria esse arquivo.`);
  }
  for (const f of pkg.build.files) {
    if (f.includes('*')) continue;
    if (copiados.indexOf(f) < 0) problemas.push(`build.files lista "${f}", mas ele não seria copiado.`);
  }

  const tam = copiados.reduce((s, f) => s + fs.statSync(f).size, 0);
  console.log('');
  console.log('══ SIMULAÇÃO DO EMPACOTAMENTO (matcher real do electron-builder) ══');
  console.log(`  versão......: ${versao}`);
  console.log(`  arquivos....: ${copiados.length}`);
  console.log(`  tamanho.....: ${(tam / 1048576).toFixed(1)} MB (+ node_modules de produção)`);
  console.log('═══════════════════════════════════════════════════════════════════');

  if (problemas.length) {
    console.error('\n✘ O instalador sairia INCOMPLETO:\n');
    problemas.forEach(p => console.error('   • ' + p));
    console.error('');
    process.exit(1);
  }
  console.log('\n✔ Lista de empacotamento completa: nada do sistema ficaria de fora.\n');
  process.exit(0);
}

const erros = [];
const avisos = [];

function sha(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}
function listarArquivos(dir, base) {
  base = base || dir;
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listarArquivos(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

const empacotados = listarArquivos(APP);
const temNoPacote = rel => empacotados.includes(rel);

// ── 1. Tudo que build.files promete precisa estar lá ────────────────────────
for (const entrada of pkg.build.files) {
  if (entrada.includes('*')) {
    const raiz = entrada.split('*')[0].replace(/\/$/, '');
    if (!fs.existsSync(raiz)) continue;
    for (const f of listarArquivos(raiz)) {
      const rel = raiz + '/' + f;
      if (!temNoPacote(rel)) erros.push(`faltou no .exe (glob ${entrada}): ${rel}`);
    }
  } else if (!temNoPacote(entrada)) {
    erros.push(`faltou no .exe: ${entrada}`);
  }
}

// ── 2. O bundle empacotado é o mesmo do projeto? ────────────────────────────
const bundleRel = 'app.bundle.js';
if (temNoPacote(bundleRel) && fs.existsSync(bundleRel)) {
  const origem = sha(bundleRel);
  const destino = sha(path.join(APP, bundleRel));
  if (origem !== destino) {
    erros.push('app.bundle.js do .exe está DIFERENTE do projeto — as atualizações não foram junto.');
  }
}

// ── 3. Versão empacotada bate com o package.json? ───────────────────────────
const indexRel = 'index.html';
if (temNoPacote(indexRel)) {
  const htmlPack = fs.readFileSync(path.join(APP, indexRel), 'utf8');
  if (htmlPack.indexOf("window.DIGICOPY_APP_VERSION = '" + versao + "'") < 0) {
    erros.push(`index.html do .exe não está na versão ${versao}.`);
  }
  // ── 4. Nada que o index.html carrega pode faltar ──────────────────────────
  const re = /(?:src|href)="\.\/([A-Za-z0-9_.\-/]+?)(?:\?[^"]*)?"/g;
  let m;
  while ((m = re.exec(htmlPack)) !== null) {
    if (!temNoPacote(m[1])) erros.push(`index.html carrega "${m[1]}", mas ele NÃO foi para o .exe.`);
  }
}

// ── 5. Dependências de produção ─────────────────────────────────────────────
for (const dep of Object.keys(pkg.dependencies || {})) {
  if (!fs.existsSync(path.join(APP, 'node_modules', dep))) {
    avisos.push(`dependência "${dep}" não apareceu em node_modules do pacote.`);
  }
}

// ── Relatório ───────────────────────────────────────────────────────────────
const bytes = empacotados.reduce((s, f) => {
  try { return s + fs.statSync(path.join(APP, f)).size; } catch (e) { return s; }
}, 0);

console.log('');
console.log('══ RAIO-X DO .EXE ══════════════════════════════════════════');
console.log(`  pasta.......: ${APP}`);
console.log(`  versão......: ${versao}`);
console.log(`  arquivos....: ${empacotados.length}`);
console.log(`  tamanho.....: ${(bytes / 1048576).toFixed(1)} MB`);
if (fs.existsSync(bundleRel)) {
  // mesma digital usada pelo build_bundle.js e pelo cache do main.js
  const cab = fs.readFileSync(bundleRel, 'utf8').slice(0, 512);
  const dig = (/sha256:\s*([0-9a-f]+)/.exec(cab) || [, '?'])[1];
  console.log(`  bundle......: ${(fs.statSync(bundleRel).size / 1048576).toFixed(2)} MB, digital ${dig}`);
}
console.log('════════════════════════════════════════════════════════════');

avisos.forEach(a => console.log('  ⚠ ' + a));

if (erros.length) {
  console.error('\n✘ O instalador saiu INCOMPLETO:\n');
  erros.forEach(e => console.error('   • ' + e));
  console.error('\n   Rode "npm run sync" e gere de novo.\n');
  process.exit(1);
}

console.log('\n✔ Instalador completo: tudo que o sistema precisa foi empacotado.\n');
