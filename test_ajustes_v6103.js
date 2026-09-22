// v6.1.3 — E2E do bundle no DOM real do navegador (jsdom):
// não basta encontrar os rótulos; cada clique precisa atualizar a tela e a aba.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = process.cwd();
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function mime(file) {
  return file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'application/octet-stream';
}
function startLocalServer() {
  const server = http.createServer(function (req, res) {
    const clean = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    const file = path.join(ROOT, clean || 'index.html');
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'content-type': mime(file) });
    res.end(fs.readFileSync(file));
  });
  return new Promise(function (resolve) {
    server.listen(0, '127.0.0.1', function () { resolve(server); });
  });
}
function namesSelected(w) {
  return [...w.document.querySelectorAll('.module.mod-sel')].map(function (m) {
    const b = m.querySelector(':scope > button');
    return b ? b.textContent.trim() : '';
  });
}

(async function () {
  const vc = new VirtualConsole();
  // O DOM de teste não implementa IndexedDB nem algumas APIs legadas; os
  // erros desses adaptadores não escondem os asserts de navegação abaixo.
  vc.on('log', function () {});
  vc.on('info', function () {});
  vc.on('warn', function () {});
  vc.on('error', function () {});
  const server = await startLocalServer();
  const address = server.address();
  const dom = await JSDOM.fromURL('http://127.0.0.1:' + address.port + '/index.html', {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.structuredClone = global.structuredClone;
      w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
      w.cancelAnimationFrame = function (id) { clearTimeout(id); };
      w.matchMedia = function () { return { matches: false, addListener() {}, removeListener() {} }; };
      w.alert = function () {};
      w.confirm = function () { return true; };
      w.scrollTo = function () {};
    }
  });
  try {
    await wait(2200);
    const w = dom.window;
    assert.strictEqual(typeof w.navigateTo, 'function', 'navigateTo carregou');
    assert.strictEqual(typeof w.fxAcao, 'function', 'fxAcao carregou');
    assert.strictEqual(w.__DIGICOPY_BUNDLE_SCRIPTS, 225, 'bundle completo carregou');

    w.navigateTo('clientes');
    await wait(120);
    assert.deepStrictEqual(namesSelected(w), ['Cadastros'], 'Clientes deixa somente Cadastros azul');
    w.navigateTo('vendas');
    await wait(120);
    assert.deepStrictEqual(namesSelected(w), ['Atendimento'], 'Vendas troca para somente Atendimento azul');
    w.navigateTo('config-fiscal');
    await wait(180);
    assert.deepStrictEqual(namesSelected(w), ['Fiscal'], 'Fiscal troca para somente Fiscal azul');

    const legacy = ['fiscal-historico', 'fiscal-inutilizar', 'fiscal-ferramentas'];
    assert(legacy.every(function (v) {
      return !w.document.querySelector('[data-nav="' + v + '"], [data-sxv-go="' + v + '"], #topmod-' + v);
    }), 'rotas fiscais legadas não aparecem como opções');
    assert(!w.document.querySelector('#dc-tab-code') && !w.document.body.textContent.includes('Tenho um código'), 'conexão por código/link não aparece na nuvem');

    let view = w.document.getElementById('view-config-fiscal');
    assert(view, 'Configurações fiscais abriu');
    assert.strictEqual(view.querySelectorAll('[data-fx-tab]').length, 10, 'dez botões de aba renderizados');
    const abas = ['Geral', 'Impressão', 'NFCe', 'Tributação', 'Nuvem', 'Outras', 'Mensagens', 'FCP', 'Autorizações', 'Reforma'];
    for (const aba of abas) {
      const tab = view.querySelector('[data-fx-tab="' + aba + '"]');
      assert(tab, 'botão da aba ' + aba);
      tab.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
      await wait(25);
      view = w.document.getElementById('view-config-fiscal');
      assert.strictEqual(w.__fxCfgAba, aba, 'clique abriu a aba ' + aba);
      assert.strictEqual(view.querySelectorAll('[data-fx-tab].on').length, 1, 'somente uma aba ativa: ' + aba);
    }

    const olho = w.document.getElementById('v5262-mostrar-senha');
    assert(olho && olho.querySelector('svg'), 'olho usa SVG');
    assert(!w.document.body.innerHTML.includes('👁') && !w.document.body.innerHTML.includes('🙈'), 'olho não usa emoji');
    const senha = w.document.getElementById('v5262-senha');
    olho.click();
    assert.strictEqual(senha.type, 'text', 'olho aberto mostra senha');
    assert(olho.querySelector('path').getAttribute('d').indexOf('M3 3l18 18') >= 0, 'senha visível troca para olho cortado');

    console.log('E2E v6.1.3: menus exclusivos, legado removido, dez abas abriram e olho SVG passou.');
  } finally {
    dom.window.close();
    await new Promise(function (resolve) { server.close(resolve); });
  }
})().catch(function (err) {
  console.error('E2E v6.1.3 falhou:', err.stack || err);
  process.exit(1);
});
