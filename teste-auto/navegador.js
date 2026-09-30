#!/usr/bin/env node
// teste-auto/navegador.js — PROVA VISUAL (r62). Roda com: node teste-auto/navegador.js
// Abre o sistema num Chromium de verdade (Playwright), tira print de cada tela e
// conta modais/erros. Sem playwright instalado: avisa e sai 0 (não quebra o tudo).
// Credenciais SEMPRE por ambiente (nunca no repo, nunca no log):
//   TESTE_CNPJ + TESTE_SENHA_CONEXAO  → passa da tela de conexão
//   TESTE_LOGIN + TESTE_SENHA         → passa do login
// Sem elas, testa só até onde dá e marca o resto como PULADO.
// Alvo: ALVO_URL (padrão: sobe o repo local num servidor estático na 8137).
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const RAIZ = path.join(__dirname, '..');
const ESTADO = path.join(__dirname, '.estado');

let pw;
try { pw = require('playwright'); }
catch (e) {
  console.log(JSON.stringify({ disponivel: false,
    motivo: 'sem playwright (rode: npm install -D playwright && npx playwright install chromium)' }));
  process.exit(0);
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
function servirLocal(porta) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      try {
        let u = decodeURIComponent(req.url.split('?')[0]);
        if (u.endsWith('/')) u += 'index.html';
        const p = path.join(RAIZ, u);
        if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
          res.writeHead(404); res.end('404'); return;
        }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
        fs.createReadStream(p).pipe(res);
      } catch (e) { res.writeHead(500); res.end('500'); }
    });
    srv.listen(porta, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const out = { disponivel: true, quando: new Date().toISOString(), telas: [],
    errosConsole: [], p0modal: null, versaoRodape: null, alvo: null, falhasDigicopy: null, pure: null };
  const printsDir = path.join(__dirname, 'prints', new Date().toISOString().slice(0, 10));
  fs.mkdirSync(printsDir, { recursive: true });
  let srv = null;
  let alvo = process.env.ALVO_URL;
  if (!alvo) { srv = await servirLocal(8137); alvo = 'http://127.0.0.1:8137/'; }
  out.alvo = alvo;
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  page.on('console', m => { if (m.type() === 'error' && out.errosConsole.length < 20) out.errosConsole.push(m.text().slice(0, 160)); });
  page.on('pageerror', e => { if (out.errosConsole.length < 20) out.errosConsole.push('pageerror: ' + String(e && e.message || e).slice(0, 160)); });
  async function shot(nome) {
    const arq = path.join(printsDir, nome + '.png');
    await page.screenshot({ path: arq });
    return arq;
  }
  try {
    await page.goto(alvo, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    out.telas.push({ nome: 'conexao', print: await shot('01-conexao'), ok: true });
    try {
      out.falhasDigicopy = await page.evaluate(() => (window.__DIGICOPY_FALHAS || []).slice(0, 20));
      out.pure = await page.evaluate(() => ({ filtros: !!window.FILTROS_BUSCA_PURE, cli: !!window.CLI_PURE,
        moeda: !!window.parseMoedaBR, texto: !!window.textoOK, porta: !!window.filtraClientesCampo }));
    } catch (e) {}
    const cnpj = process.env.TESTE_CNPJ, sc = process.env.TESTE_SENHA_CONEXAO;
    if (cnpj && sc) {
      const cCnpj = page.locator('input').first();
      const cSenha = page.locator('input[type="password"]').first();
      await cCnpj.fill(cnpj);
      await cSenha.fill(sc);
      await page.getByRole('button', { name: /continuar/i }).click();
      await page.waitForTimeout(6000);
      const texto = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 4000) : '');
      out.p0modal = texto.indexOf('A nuvem recusou') >= 0;
      out.telas.push({ nome: 'apos-conexao', print: await shot('02-apos-conexao'), ok: !out.p0modal });
      const lg = process.env.TESTE_LOGIN, sn = process.env.TESTE_SENHA;
      if (lg && sn && texto.toLowerCase().indexOf('login') >= 0) {
        await page.locator('input').first().fill(lg);
        await page.locator('input[type="password"]').first().fill(sn);
        await page.getByRole('button', { name: /entrar/i }).click();
        await page.waitForTimeout(5000);
        const itens = ['Vendas', 'Clientes', 'Estoque', 'Financeiro', 'Contratos', 'Config'];
        let n = 3;
        for (const t of itens) {
          try {
            await page.getByText(t, { exact: false }).first().click({ timeout: 4000 });
            await page.waitForTimeout(2500);
            out.telas.push({ nome: t, print: await shot(String(n).padStart(2, '0') + '-' + t), ok: true });
          } catch (e) { out.telas.push({ nome: t, print: null, ok: false }); }
          n++;
        }
        try {
          const rodape = await page.locator('footer').first().innerText({ timeout: 4000 });
          const mv = /v(\d+\.\d+\.\d+)/.exec(rodape || '');
          out.versaoRodape = mv ? mv[1] : (rodape || '').slice(0, 60);
        } catch (e) { out.versaoRodape = null; }
      } else {
        out.telas.push({ nome: 'login-e-telas', print: null, ok: true, pulado: 'sem TESTE_LOGIN/TESTE_SENHA ou sem tela de login' });
      }
    } else {
      out.telas.push({ nome: 'apos-conexao', print: null, ok: true, pulado: 'sem TESTE_CNPJ/TESTE_SENHA_CONEXAO' });
    }
  } catch (e) {
    out.telas.push({ nome: 'ERRO', print: null, ok: false, detalhe: String(e && e.message || e).slice(0, 200) });
  }
  try { await browser.close(); } catch (e) {}
  try { if (srv) srv.close(); } catch (e) {}
  fs.mkdirSync(ESTADO, { recursive: true });
  fs.writeFileSync(path.join(ESTADO, 'navegador.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ disponivel: true, telas: out.telas.length,
    p0modal: out.p0modal, errosConsole: out.errosConsole.length, versaoRodape: out.versaoRodape,
    falhasDigicopy: (out.falhasDigicopy || []).length, pure: out.pure }));
  process.exit(0);
})().catch(e => { console.error('navegador falhou: ' + (e && e.message)); process.exit(0); });
