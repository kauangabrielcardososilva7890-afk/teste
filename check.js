'use strict';

const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const refs = [];
const re = /(?:src|href)="\.\/([A-Za-z0-9_.\-/]+?)(?:\?[^\"]*)?"/g;
let match;
while ((match = re.exec(html)) !== null && !refs.includes(match[1])) refs.push(match[1]);
const looseScripts = refs.filter(file => file.endsWith('.js') && file !== 'app.bundle.js' && !file.startsWith('assets/vendor/'));
const files = ['build_bundle.js', ...new Set([
  ...manifest,
  ...looseScripts.filter(file => !manifest.includes(file)),
  'clean_dist.js', 'nfe_assinatura.js', 'main.js', 'preload.js'
])];

for (const file of files) {
  const args = file === 'build_bundle.js' ? [file, '--check'] : ['--check', file];
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', windowsHide: true });
  if (result.error) {
    console.error(`Falha ao executar ${file}: ${result.error.message}`);
    process.exit(result.status || 1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}
