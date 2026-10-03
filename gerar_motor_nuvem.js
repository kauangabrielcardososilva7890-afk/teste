#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// GERAR O MOTOR DA NUVEM PARA COLAR — um comando, sempre na versão certa.
//
// Por que existe: o dono pediu "o código do motor da nuvem, consegue deixar pra
// acompanhar a mesma versão que o da nuvem?". Antes, esse arquivo era gerado à
// mão (chato e fácil de esquecer). Agora:
//
//   npm run motor      → compila o worker (wrangler --dry-run, NÃO publica),
//                        regrava cloudflare-worker/motor_para_colar.js e o .sha256.
//
// v6.1.5 — ORDEM DO DONO (22/09/2026): "deleta esse motor nuvem pra copiar.html".
// A página MOTOR_NUVEM_PARA_COLAR.html foi APAGADA. O caminho de publicação é o
// atualizar_motor_nuvem.cmd (duplo clique). O .js compilado continua sendo gerado
// porque é ele que o wrangler publica quando alguém usa o painel. Nada mais é
// escrito além dele e do .sha256.
//
// O teste `test_ajustes_v6104.js` compara as versões deste arquivo com
// `cloudflare-worker/src/index.js`: se alguém subir a versão do worker e
// esquecer de rodar isto, o teste acusa na hora.
//
// ⚠ Não publica nada na nuvem. `--dry-run` só compila.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const RAIZ = __dirname;
const WORKER = path.join(RAIZ, 'cloudflare-worker');
const SAIDA = path.join(WORKER, 'motor_compilado');
const ARQUIVO = path.join(WORKER, 'motor_para_colar.js');
const SHA = path.join(WORKER, 'motor_para_colar.sha256');
const SRC = path.join(WORKER, 'src', 'index.js');

function morrer(msg){ console.error('\n✘ ' + msg + '\n'); process.exit(1); }

// ── 1. compila o worker (NÃO publica) ──────────────────────────────────────
const wrangler = path.join(WORKER, 'node_modules', '.bin', 'wrangler');
if (!fs.existsSync(wrangler)) {
  morrer('Falta o wrangler. Rode uma vez:  cd cloudflare-worker && npm install');
}
console.log('▶ Compilando o worker (wrangler deploy --dry-run — não publica nada)...');
fs.rmSync(SAIDA, { recursive: true, force: true });
try {
  execFileSync(wrangler, ['deploy', '--dry-run', '--outdir=motor_compilado'], { cwd: WORKER, stdio: 'pipe' });
} catch (e) {
  morrer('O wrangler falhou:\n' + String(e.stdout || '') + String(e.stderr || e.message));
}
const compilado = path.join(SAIDA, 'index.js');
if (!fs.existsSync(compilado)) morrer('O wrangler não gerou ' + compilado);

// ── 2. monta o arquivo com cabeçalho explicativo ───────────────────────────
const bruto = fs.readFileSync(compilado, 'utf8').replace('//# sourceMappingURL=index.js.map\n', '');
const src = fs.readFileSync(SRC, 'utf8');
const api = (/const API_VERSION\s*=\s*'([^']+)'/.exec(src) || [])[1] || '?';
const wv = (/const WORKER_VERSION\s*=\s*'([^']+)'/.exec(src) || [])[1] || '?';
const sha = crypto.createHash('sha256').update(bruto, 'utf8').digest('hex');

const cabecalho = `/* ═══════════════════════════════════════════════════════════════════════════
 * MOTOR DA NUVEM — DIGICOPY Cloud API (arquivo pronto para COLAR e publicar)
 *
 * O QUE É: este é o MESMO código que o comando \`wrangler deploy\` publica —
 * gerado com \`wrangler deploy --dry-run\` (só compila, NÃO publica nada).
 * Está num arquivo só, sem precisar de Node, wrangler, token nem senha.
 *
 * COMO PUBLICAR COLANDO (plano B — o painel da Cloudflare):
 *   1) Cloudflare → Workers & Pages → digicopy-sync-api → "Edit code".
 *   2) Selecione tudo (Ctrl+A) e apague.
 *   3) Cole ESTE arquivo inteiro (não existe mais página com botão de copiar:
 *      ela foi APAGADA a pedido do dono em 22/09/2026 — copie deste arquivo).
 *   4) Clique em "Deploy".
 *   5) Confira: https://digicopy-sync-api.digicopyonline.workers.dev/health
 *
 * O QUE NÃO MUDA AO COLAR: os bindings (banco D1 "digicopy-erp", balde R2
 * "digicopy-downloads", o cron das 18:30 de São Paulo) e os SECRETS (incluindo
 * SETUP_SECRET) são configuração do Worker, não ficam no código — continuam
 * iguais. O que este caminho NÃO faz é aplicar migração do banco: quem aplica é
 * o \`atualizar_motor_nuvem.cmd\` (esta versão não tem migração pendente).
 *
 * VERSÃO DESTE ARQUIVO: API ${api} / Worker ${wv}   (igual ao src/index.js)
 * GERADO EM: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC
 * sha256 do código (sem este cabeçalho):
 *   ${sha}
 *
 * COMO REGERAR (quando o código da nuvem mudar):  npm run motor
 * Há teste automático conferindo que as versões aqui batem com src/index.js —
 * se alguém esquecer de regerar, o teste acusa.
 * ═══════════════════════════════════════════════════════════════════════════ */

`;
const final = cabecalho + bruto;
fs.writeFileSync(ARQUIVO, final);
fs.writeFileSync(SHA, sha + '\n');
console.log('✔ ' + path.relative(RAIZ, ARQUIVO) + ' (' + final.length + ' bytes) — API ' + api + ' / Worker ' + wv);

// ── 3. a página do botão de copiar foi APAGADA (ordem do dono, 22/09/2026) ──

console.log('\nPronto. Não publiquei nada: quem publica é você (painel, .cmd ou o botão do GitHub).\n');
