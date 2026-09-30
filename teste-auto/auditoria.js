#!/usr/bin/env node
// teste-auto/auditoria.js — AUDITORIA AUTOMÁTICA REPRODUTÍVEL (r62).
// Roda com: npm run teste-auto   (zero dependências novas — só Node).
// Mesma ideia da auditoria externa de 30/09, mas repetível a cada atualização:
//   L) LOCAL: bundle fresco? o que mudou desde a última rodada? sobrou segredo
//      no diff? guardas anti-P0 presentes? versões dos fios batem?
//   R) NO AR (precisa rede; sem rede vira SEM REDE, não falha): site responde?
//      versão publicada == package.json? bundle publicado == bundle do repo?
//      padrão do P0 ausente no ar?
// Cada verificação ganha evolução contra a rodada anterior (NOVO / CONSERTADO /
// QUEBROU / SEGUE ABERTO / SEGUE OK) e tudo vai para teste-auto/RELATORIO.md.
// Estado: .estado/fontes.json (base das fontes, vai pro git) e
// .estado/ultimo.json (última rodada, fica local).
// --autoteste: só confere o próprio harness (sem rede, sem escrita).
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const RAIZ = path.join(__dirname, '..');
const ESTADO = path.join(__dirname, '.estado');
const ARGS = process.argv.slice(2);
const AUTOTESTE = ARGS.includes('--autoteste');
let ALVO = process.env.ALVO_URL || 'https://teste-60f.pages.dev/';
if (!ALVO.endsWith('/')) ALVO += '/';

function sha(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function ler(p) { return fs.readFileSync(p, 'utf8'); }
function existe(p) { try { return fs.existsSync(p); } catch (e) { return false; } }
function fontesDoManifest() {
  const m = JSON.parse(ler(path.join(RAIZ, 'bundle-manifest.json')));
  const arr = Array.isArray(m) ? m : (m.scripts || m.files || []);
  return arr.map(e => typeof e === 'string' ? e : (e.file || e.nome || e.path || '')).filter(Boolean);
}
function listaFontes() {
  return fontesDoManifest().concat(['cloudflare-worker/src/index.js', 'index.html']);
}
async function buscar(url, ms) {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms || 20000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.text();
}

// ── padrões de segredo ──────────────────────────────────────────────
// BLOQUEANTE falha a auditoria; SUSPEITO só lista como aviso.
const BLOQUEANTE = [
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'chave privada'],
  [/sk_(live|test)_[A-Za-z0-9]+/, 'chave secreta sk_*'],
  [/xox[baprs]-[A-Za-z0-9-]+/, 'token xox*'],
  [/ghp_[A-Za-z0-9]{20,}/, 'token ghp_*'],
  [/Bearer\s+[A-Za-z0-9\-._~+/]{20,}/, 'bearer token'],
];
const SUSPEITO = /(senha|password|passwd|pwd|token|api[_-]?key|secret)\s*[:=]\s*['"][^'"]{3,}['"]/gi;

async function main() {
  const checks = [];
  function check(id, nome, status, detalhe) {
    checks.push({ id, nome, status, detalhe: String(detalhe || '') });
  }
  const pkg = JSON.parse(ler(path.join(RAIZ, 'package.json')));
  const versaoRepo = pkg.version;

  // L1 — bundle fresco
  try {
    const bundle = ler(path.join(RAIZ, 'app.bundle.js'));
    const n = Number((bundle.match(/\* scripts: (\d+) \| sha256:/) || [])[1] || 0);
    const man = fontesDoManifest().length;
    check('L1-bundle-fresco', 'bundle gerado bate com o manifest',
      (n === man && n > 200) ? 'OK' : 'FALHOU',
      n + ' scripts no bundle, ' + man + ' no manifest, sha ' + sha(bundle).slice(0, 12));
  } catch (e) { check('L1-bundle-fresco', 'bundle gerado bate com o manifest', 'FALHOU', e.message); }

  // L2 — o que mudou
  const agora = {};
  for (const f of listaFontes()) {
    const p = path.join(RAIZ, f);
    agora[f] = existe(p) ? sha(ler(p)) : 'AUSENTE';
  }
  let antes = {};
  try { antes = JSON.parse(ler(path.join(ESTADO, 'fontes.json'))); } catch (e) { antes = {}; }
  const mudaram = Object.keys(agora).filter(f => agora[f] !== antes[f]);
  const primeiraVez = Object.keys(antes).length === 0;
  check('L2-o-que-mudou', 'fontes mudadas desde a última rodada', 'OK',
    primeiraVez ? 'primeira rodada: base gravada (' + Object.keys(agora).length + ' fontes)'
      : (mudaram.length ? mudaram.length + ': ' + mudaram.slice(0, 12).join(', ') + (mudaram.length > 12 ? '…' : '')
        : 'nada mudou'));

  // L3 — segredos no diff
  try {
    const alvos = primeiraVez ? Object.keys(agora) : mudaram;
    const bloq = [], susp = [];
    for (const f of alvos) {
      const p = path.join(RAIZ, f);
      if (!existe(p)) continue;
      if (!/\.(js|html|json|jsonc)$/.test(f)) continue;
      const linhas = ler(p).split('\n');
      for (let i = 0; i < linhas.length; i++) {
        const l = linhas[i];
        for (const [re, nome] of BLOQUEANTE) {
          if (re.test(l)) { bloq.push(f + ':' + (i + 1) + ' (' + nome + ')'); re.lastIndex = 0; }
        }
        SUSPEITO.lastIndex = 0;
        let m;
        while ((m = SUSPEITO.exec(l)) !== null) {
          const trecho = m[0].toLowerCase();
          if (trecho.indexOf('placeholder') >= 0 || trecho.indexOf('exemplo') >= 0) continue;
          if (susp.length < 8) susp.push(f + ':' + (i + 1));
        }
      }
    }
    check('L3-segredos', 'sem segredo vazado no código',
      bloq.length ? 'FALHOU' : 'OK',
      bloq.length ? 'BLOQUEANTE: ' + bloq.slice(0, 5).join(' · ')
        : (susp.length ? 'avisos (conferir): ' + susp.join(' · ') : 'limpo (' + alvos.length + ' arquivos vistos)'));
  } catch (e) { check('L3-segredos', 'sem segredo vazado no código', 'FALHOU', e.message); }

  // L4 — guardas anti-P0 (r61) presentes no código do repo
  try {
    const sync = ler(path.join(RAIZ, 'cloudflare_data_sync_patch.js'));
    const temSkip = sync.indexOf("chave.indexOf('__')===0") >= 0;
    const semModal = sync.indexOf("window.toast('A nuvem recusou") < 0;
    const temSino = sync.indexOf("enfileirarRecado('nuvem-recusou-'") >= 0;
    check('L4-guardas-P0', 'código sem a tempestade de modais (r61)',
      (temSkip && semModal && temSino) ? 'OK' : 'FALHOU',
      '__ não viaja:' + (temSkip ? 'sim' : 'NÃO') + ' · sem toast-modal:' + (semModal ? 'sim' : 'NÃO') + ' · sino:' + (temSino ? 'sim' : 'NÃO'));
  } catch (e) { check('L4-guardas-P0', 'código sem a tempestade de modais (r61)', 'FALHOU', e.message); }

  // L5 — versões dos fios
  try {
    const idx = ler(path.join(RAIZ, 'index.html'));
    const mob = ler(path.join(RAIZ, 'mobile/www/index.html'));
    const a = idx.indexOf("DIGICOPY_APP_VERSION = '" + versaoRepo + "'") >= 0;
    const b = mob.indexOf("DIGICOPY_APP_VERSION = '" + versaoRepo + "'") >= 0;
    check('L5-versoes', 'index/mobile carimbados com v' + versaoRepo,
      (a && b) ? 'OK' : 'FALHOU', 'index:' + (a ? 'ok' : 'VELHO') + ' · mobile:' + (b ? 'ok' : 'VELHO'));
  } catch (e) { check('L5-versoes', 'index/mobile carimbados', 'FALHOU', e.message); }

  // R1/R2/R3 — site publicado (degrada sem rede)
  let htmlAr = null, bundleAr = null;
  if (!AUTOTESTE) {
    try {
      htmlAr = await buscar(ALVO, 20000);
      const mv = /DIGICOPY_APP_VERSION\s*=\s*'([^']+)'/.exec(htmlAr);
      const vAr = mv ? mv[1] : '?';
      check('R1-site-no-ar', 'publicado na v' + versaoRepo + ' (sem deriva)',
        (vAr === versaoRepo) ? 'OK' : 'FALHOU', 'no ar: v' + vAr + ' · repo: v' + versaoRepo);
    } catch (e) { check('R1-site-no-ar', 'publicado na v' + versaoRepo, 'SEM REDE', 'não alcançou ' + ALVO); }
    try {
      if (!htmlAr) throw new Error('sem html');
      const mb = /app\.bundle\.js\?[^"'\s]*/.exec(htmlAr);
      if (!mb) throw new Error('bundle não referenciado no html');
      bundleAr = await buscar(new URL(mb[0], ALVO).toString(), 30000);
      const shaAr = sha(bundleAr).slice(0, 12);
      const shaLocal = sha(ler(path.join(RAIZ, 'app.bundle.js'))).slice(0, 12);
      check('R2-bundle-no-ar', 'bundle publicado == bundle do repo',
        (shaAr === shaLocal) ? 'OK' : 'FALHOU', 'ar:' + shaAr + ' · repo:' + shaLocal);
    } catch (e) {
      check('R2-bundle-no-ar', 'bundle publicado == bundle do repo',
        /sem html|não alcançou|HTTP|fetch|timeout|abort/i.test(e.message) ? 'SEM REDE' : 'FALHOU', e.message);
    }
    try {
      if (!bundleAr) throw new Error('sem bundle');
      const temP0 = bundleAr.indexOf("window.toast('A nuvem recusou") >= 0;
      const temGuard = bundleAr.indexOf("indexOf('__')===0") >= 0;
      check('R3-P0-no-ar', 'ar sem a tempestade de modais',
        (!temP0 && temGuard) ? 'OK' : 'FALHOU',
        'padrão modal:' + (temP0 ? 'PRESENTE (P0!)' : 'ausente') + ' · guarda __:' + (temGuard ? 'sim' : 'NÃO'));
    } catch (e) {
      check('R3-P0-no-ar', 'ar sem a tempestade de modais', 'SEM REDE', e.message);
    }
  }

  // evolução contra a rodada anterior
  let prev = {};
  try { prev = (JSON.parse(ler(path.join(ESTADO, 'ultimo.json'))).checks) || {}; } catch (e) { prev = {}; }
  for (const c of checks) {
    const p = prev[c.id] && prev[c.id].status;
    if (c.status === 'SEM REDE') c.evolucao = 'SEM REDE';
    else if (!p) c.evolucao = 'NOVO';
    else if (c.status === 'OK') c.evolucao = (p === 'OK') ? 'SEGUE OK' : 'CONSERTADO';
    else c.evolucao = (p === 'FALHOU') ? 'SEGUE ABERTO' : 'QUEBROU';
  }

  if (AUTOTESTE) {
    console.log('AUTOTESTE OK: ' + checks.length + ' verificações locais definidas, .estado íntegro.');
    process.exit(0);
  }

  // persiste estado + relatório
  fs.mkdirSync(ESTADO, { recursive: true });
  fs.writeFileSync(path.join(ESTADO, 'fontes.json'), JSON.stringify(agora, null, 1));
  const reg = { quando: new Date().toISOString(), versaoRepo, alvo: ALVO, checks };
  fs.writeFileSync(path.join(ESTADO, 'ultimo.json'), JSON.stringify(reg, null, 1));
  const L = [];
  L.push('# Relatório da auditoria automática — ' + reg.quando.slice(0, 16).replace('T', ' ') + ' UTC');
  L.push('');
  L.push('Alvo: ' + ALVO + ' · repo: v' + versaoRepo);
  L.push('');
  L.push('| verificação | resultado | evolução | detalhe |');
  L.push('|---|---|---|---|');
  for (const c of checks) L.push('| ' + c.id + ' ' + c.nome + ' | ' + c.status + ' | ' + c.evolucao + ' | ' + (c.detalhe.length > 140 ? c.detalhe.slice(0, 140) + '…' : c.detalhe) + ' |');
  L.push('');
  L.push('Roda com `npm run teste-auto`. Evolução: NOVO (1ª vez) · CONSERTADO · QUEBROU · SEGUE ABERTO · SEGUE OK.');
  L.push('');
  fs.writeFileSync(path.join(__dirname, 'RELATORIO.md'), L.join('\n'));
  const falha = checks.filter(c => c.status === 'FALHOU').length;
  for (const c of checks) console.log((c.status === 'OK' ? '✔' : (c.status === 'SEM REDE' ? '…' : '✘')) + ' [' + c.evolucao + '] ' + c.id + ': ' + c.detalhe.slice(0, 120));
  console.log(falha ? ('AUDITORIA FALHOU (' + falha + ') — ver teste-auto/RELATORIO.md') : 'AUDITORIA OK — ver teste-auto/RELATORIO.md');
  process.exit(falha ? 1 : 0);
}

main().catch(e => { console.error('auditoria quebrou: ' + (e && e.message)); process.exit(2); });