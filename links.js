#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// LINKS DA RESPOSTA — imprime o bloco de links que TODA resposta ao dono
// precisa trazer (REGRAS_PERMANENTES.md, regra 8).
//
// Por que existe: eu esqueci de mandar os links nas respostas. Agora não dá:
// este comando monta o bloco a partir da FONTE (package.json, branch atual,
// bundle e worker) e o teste `test_ajustes_v6104.js` confere que ele sai certo.
// Uso:  npm run links
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const crypto = require('crypto');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const branch = (pkg.digicopy && pkg.digicopy.branch) || 'main';
const versao = pkg.version;
const SITE = 'https://teste-60f.pages.dev';
const HEALTH = 'https://digicopy-sync-api.digicopyonline.workers.dev/health';
const ZIP = 'https://github.com/kauangabrielcardososilva7890-afk/teste/archive/refs/heads/' + branch + '.zip';

let shaBundle = '(não gerei o bundle nesta pasta)';
try { shaBundle = crypto.createHash('sha256').update(fs.readFileSync('app.bundle.js')).digest('hex').slice(0, 12); } catch (e) {}

let worker = '';
try {
  const src = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
  const api = (/const API_VERSION\s*=\s*'([^']+)'/.exec(src) || [])[1] || '?';
  const wv = (/const WORKER_VERSION\s*=\s*'([^']+)'/.exec(src) || [])[1] || '?';
  worker = ' (API ' + api + ' / Worker ' + wv + ')';
} catch (e) {}

console.log('');
console.log('🔗 LINKS (toda resposta leva estes) — regra 8 de REGRAS_PERMANENTES.md');
console.log('');
console.log('• Testar no site (link fixo — sempre a versão mais nova):');
console.log('  ' + SITE);
console.log('• Relatório de teste (o que você preenche):');
console.log('  ' + SITE + '/RELATORIO_DE_TESTE_NF.html');
console.log('• Relatório de problemas (caminhos em caixas, "+" infinito):');
console.log('  ' + SITE + '/RELATORIO_DE_PROBLEMAS.html');
console.log('• Motor da nuvem para colar no painel (botão de copiar):');
console.log('• Saúde da nuvem (tem que mostrar o Worker 5.26.5 ou mais novo):');
console.log('  ' + HEALTH + worker);
console.log('• Baixar tudo (ZIP da branch do GitHub) — repositório PRIVADO, exige login:');
console.log('  ' + ZIP);
console.log('');
console.log('Branch: ' + branch + ' | Versão do app: v' + versao + ' | bundle sha: ' + shaBundle);
console.log('');
