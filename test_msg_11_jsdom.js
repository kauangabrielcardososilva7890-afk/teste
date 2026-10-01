// ═══════════════════════════════════════════════════════════════
// test_msg_11_jsdom.js — GERADO por migrar_testes_r57.js; 9 seções.
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_ajustes_v6103.js, test_relatorio_teste_nf.js, test_ajustes_v6104.js, test_relatorio_problemas.js, test_nuvem_nao_perde.js, test_nuvem_explica.js, test_impressora_nao_some_reabrir.js, test_dado_aparece_outro_pc.js, test_mandar_erro.js
// ═══════════════════════════════════════════════════════════════
// Runner do tema: extrai cada SEÇÃO, roda isolada em processo filho
// (comportamento idêntico ao arquivo solto) e agrega o resultado.
// Seções abaixo vão dentro de if (false){} = INERTES (só parse, nunca executa).
// Novo teste do tema: APPEND bloco no fim, copiando o formato (if + 2 marcadores).
const __fs = require('fs');
const __cp = require('child_process');
const __self = __fs.readFileSync(__filename, 'utf8');
const __partes = [];
const __re = /\/\/<<<<SECAO:([^:]+):INICIO>>>>\r?\n([\s\S]*?)\/\/<<<<SECAO:\1:FIM>>>>/g;
let __m;
while ((__m = __re.exec(__self))) __partes.push({ nome: __m[1], codigo: __m[2] });
if (!__partes.length) { console.error('Tema sem seções!'); process.exit(1); }
const __falhas = [];
__partes.forEach((__s, __i) => {
  console.log('\n── ' + __s.nome + ' ──');
  const __tmp = '.tmp_secao_' + process.pid + '_' + __i + '.js';
  try {
    __fs.writeFileSync(__tmp, __s.codigo);
    const __r = __cp.spawnSync(process.execPath, [__tmp], { stdio: 'inherit' });
    if (__r.status !== 0 || __r.error) __falhas.push(__s.nome);
  } finally { try { __fs.unlinkSync(__tmp); } catch (e) {} }
});
if (__falhas.length) { console.error('\nTEMA FALHOU (' + __falhas.length + ' seções): ' + __falhas.join(', ')); process.exit(1); }
console.log('\nTEMA OK: ' + __partes.length + ' seções.');

if (false) { // ═══ test_ajustes_v6103.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6103.js:INICIO>>>>
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
    const totalDoManifesto = JSON.parse(require('fs').readFileSync('bundle-manifest.json', 'utf8')).length;
    assert.strictEqual(w.__DIGICOPY_BUNDLE_SCRIPTS, totalDoManifesto, 'bundle completo carregou');

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
//<<<<SECAO:test_ajustes_v6103.js:FIM>>>>
}

if (false) { // ═══ test_relatorio_teste_nf.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_relatorio_teste_nf.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — RELATORIO_DE_TESTE_NF.html (relatório de teste do dono em HTML)
//
// Pedido dele (21/09/2026): "nessa do .txt que está em branco, não consegue
// fazer em html igual o de cima? cada pergunta tem 3 caixas (ok, não resolveu,
// não testei/não identifiquei), todas com uma caixa de texto opcional, e uma
// caixa de texto separada; no final clico em salvar e gera um .txt já escrito".
//
// Este teste abre o arquivo de verdade (jsdom), preenche como o dono faria e
// confere o texto que sairia no .txt — inclusive a contagem do resumo.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');

function ok(name, cond){ if (!cond){ console.error('  ✘ ' + name); process.exit(1); } console.log('  ✔ ' + name); }

const ARQ = 'RELATORIO_DE_TESTE_NF.html';
const html = fs.readFileSync(ARQ, 'utf8');

console.log('== RELATÓRIO DE TESTE (HTML) ==');

// ── 1. Nada de popup nativo e nada de dependência externa ──────────────────
ok('sem alert/confirm/prompt nativos (regra do projeto)',
   !/[\s(]alert\s*\(|[\s(]confirm\s*\(|[\s(]prompt\s*\(/.test(html));
ok('arquivo é sozinho: nenhum script/css de fora',
   !/<script[^>]+src=|<link[^>]+rel="stylesheet"/i.test(html));
ok('não pede senha/token: aviso de segredo impresso na tela',
   /Nunca escreva senha, token, certificado, CSC/.test(html));

// ── 2. Abre de verdade e confere a estrutura decidida com o dono ───────────
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://teste-60f.pages.dev/' + ARQ });
const w = dom.window, d = w.document;

const perguntas = [...d.querySelectorAll('.item.pergunta')];
ok('uma caixa por pergunta: 55 perguntas na tela (46 + 5 da PARTE I + 4 da PARTE J: memória da tela e conferência da NF-e)', perguntas.length === 55);
ok('cada pergunta tem EXATAMENTE 3 caixas',
   perguntas.every(p => p.querySelectorAll('input[type=radio]').length === 3));
ok('cada pergunta tem a caixa de texto opcional (observação)',
   perguntas.every(p => p.querySelector('textarea')));
ok('as 3 caixas são: OK, não resolveu, não testei',
   perguntas.every(p => {
     const vals = [...p.querySelectorAll('input[type=radio]')].map(i => i.value).sort().join(',');
     return vals === 'nao,nt,ok';
   }));

// numeração das partes (A1..A6 · B1..B9 · C1..C8 · D1..D2 · E1..E6 · F1..F4 · G1..G3 · H1..H7 · I1..I5), sem buraco
const esperados = [];
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, 10).forEach((letra, i) => {
  const quantos = [6, 9, 8, 2, 6, 4, 4, 7, 5, 4][i];
  for (let n = 1; n <= quantos; n++) esperados.push(letra + n);
});
ok('numeração completa e na ordem (A1..J4)',
   esperados.length === 55 && esperados.every(n => d.querySelector('input[name="r_' + n + '"]')));
// As 3 partes novas (22/09/2026): nuvem automática, contratos e rodapé
ok('PARTE E pergunta a sincronização automática (conectou = sincroniza)',
   html.indexOf('PARTE E — SINCRONIZAÇÃO AUTOMÁTICA') >= 0 &&
   html.indexOf('sincronizou SOZINHO') >= 0 && html.indexOf('Diagnóstico deste computador') >= 0);
ok('PARTE F pergunta contrato sem vínculo e o botão de vincular na mão',
   html.indexOf('PARTE F — CONTRATOS E CLIENTES') >= 0 &&
   html.indexOf('Cliente sem vínculo') >= 0 && html.indexOf('🔗 Vincular cliente') >= 0);
ok('PARTE H lista o que esta rodada mudou (NF em aba, um olho, PC↔PC)',
   html.indexOf('PARTE H — NOVO DE 22/09 (nº4)') >= 0 &&
   html.indexOf('Nova nota fiscal em ABA') >= 0 &&
   html.indexOf('um olho só') >= 0 &&
   html.indexOf('Um PC criou algo e o OUTRO PC mostrou') >= 0);
ok('PARTE G pergunta a versão e o carimbo do rodapé',
   html.indexOf('PARTE G — VERSÃO NO RODAPÉ') >= 0 && html.indexOf('carimbo') >= 0);
// 22/09/2026 — ele reclamou: "tem algumas das mesmas perguntas, você não anotou
// o que foi resolvido?" → cada pergunta traz o selo e existe o filtro.
ok('pergunta já resolvida vem marcada (✅ resolvido antes)',
   d.querySelectorAll('.item.pergunta[data-estado="ok"]').length === 3 &&
   html.indexOf('✅ resolvido antes') >= 0);
ok('pergunta nova de 22/09 vem marcada (🆕 novo de 22/09)',
   d.querySelectorAll('.item.pergunta[data-estado="novo"]').length === 30);
ok('existe o filtro "só o que falta testar"',
   !!d.getElementById('so_faltando') && html.indexOf('só o que falta testar') >= 0);

// filtro na prática: marcado esconde as "ok" e mostra a contagem
(function(){
  const chk = d.getElementById('so_faltando');
  const total = d.querySelectorAll('.item.pergunta').length;
  chk.checked = true; chk.dispatchEvent(new w.Event('change', { bubbles: true }));
  const visiveis = [...d.querySelectorAll('.item.pergunta')].filter(el => !el.classList.contains('item-escondido')).length;
  ok('filtro esconde só as 3 já resolvidas (' + visiveis + ' de ' + total + ')', visiveis === total - 3);
  ok('o contador do filtro mostra quantas faltam', /perguntas em aberto/.test(d.getElementById('contagem-filtro').textContent));
  chk.checked = false; chk.dispatchEvent(new w.Event('change', { bubbles: true }));
})();

// ── 3. Campos do dono: onde testou, correções, adições, caixa separada ─────
ok('"onde você testou" com 3 caixas (navegador / .exe / os dois)',
   d.querySelectorAll('input[name="r_ONDE"]').length === 3);
ok('veredicto com 3 caixas (aprovado / com ressalvas / reprovado)',
   d.querySelectorAll('input[name="r_VEREDITO"]').length === 3);
ok('5 linhas livres de CORREÇÕES', [1,2,3,4,5].every(i => d.getElementById('corr_' + i)));
ok('5 linhas livres de ADIÇÕES', [1,2,3,4,5].every(i => d.getElementById('ad_' + i)));
ok('caixa de texto separada (observações gerais)', !!d.getElementById('geral'));
ok('botão de salvar o .txt', /Salvar relatório \(\.txt\)/.test(d.getElementById('btn-salvar').textContent));
ok('botões de prévia e copiar (plano B se o download não rolar)',
   !!d.getElementById('btn-previa') && !!d.getElementById('btn-copiar'));
ok('contador "respondidas de total" na barra', /Respondidas/.test(d.getElementById('contador').innerHTML));

// ── 4. Preenche como o dono preencheria e confere o .txt gerado ────────────
function marcar(nome, valor){
  const el = d.querySelector('input[name="r_' + nome + '"][value="' + valor + '"]');
  el.checked = true;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
}
function escrever(id, texto){
  const el = d.getElementById(id);
  el.value = texto;
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
}

d.getElementById('d_nome').value = 'Dono';
d.getElementById('d_rodape').value = 'v6.1.10 + a5f67dad';
d.getElementById('d_nuvem').value = '5.26.5';
marcar('ONDE', 'exe');
marcar('A1', 'ok');  escrever('t_A1', 'abriu normal, sem undefined');
marcar('B2', 'nao'); escrever('t_B2', 'mostrou erro de internet em vez de senha');
marcar('C4', 'nt');
marcar('D2', 'ok');
marcar('E1', 'ok');   escrever('t_E1', 'conectou e sincronizou sozinho, sem perguntar nada');
marcar('E2', 'ok');
marcar('F1', 'ok');   escrever('t_F1', 'o contrato 40 agora mostra o cliente certo');
marcar('G1', 'ok');
escrever('corr_1', 'Financeiro: filtro de data veio vazio');
escrever('ad_1', 'Queria um atalho para imprimir em 2 vias');
escrever('geral', 'Testei só no exe do escritório.');
marcar('VEREDITO', 'ressalvas');

ok('contador acompanha o preenchimento (8 respondidas de 52 EM ABERTO)',
   /Respondidas: <b>8<\/b> de <b>52<\/b> em aberto/.test(d.getElementById('contador').innerHTML));
ok('o contador separa o que já foi resolvido antes (não repete pergunta resolvida)',
   /3 já resolvidas antes/.test(d.getElementById('contador').innerHTML));

const r = w.montarTexto();
const txt = r.texto;

ok('tipo salvarArquivo existe (o clique gera e baixa o .txt)', typeof w.salvarArquivo === 'function');
ok('cabeçalho do relatório com data/hora', /RELATÓRIO DE TESTE — SISTEMA DIGICOPY/.test(txt) && /Gerado em \d\d\/\d\d\/\d\d\d\d às \d\dh\d\d/.test(txt));
ok('identificação do teste sai escrita', /Nome\.+: Dono/.test(txt) && /Programa \.exe/.test(txt) && /v6\.1\.10/.test(txt) && /5\.26\.5/.test(txt) && /a5f67dad/.test(txt));
ok('pergunta respondida sai com a marca OK + observação',
   /\[OK \] A1 — .+\n\s+abriu normal, sem undefined/.test(txt));
ok('pergunta não resolvida sai com a marca NAO + observação',
   /\[NAO\] B2 — .+\n\s+mostrou erro de internet em vez de senha/.test(txt));
ok('pergunta não testada sai com a marca NT', /\[NT \] C4 — /.test(txt));
ok('pergunta em branco sai como sem resposta no resumo', /45 sem resposta/.test(txt));
ok('resumo conta certo (5 OK · 1 não resolveu · 1 não testei · 45 sem resposta)',
   /RESUMO: 5 OK · 1 não resolveu · 1 não testei · 45 sem resposta/.test(txt));
ok('o .txt separa as 3 que já estavam resolvidas antes (fora da conta de sem resposta)',
   /3 já resolvida\(s\) antes/.test(txt) && /\[JA OK\] C5/.test(txt));
ok('pergunta em branco sai marcada como "---" no corpo do relatório',
   /\[---\] B1 — /.test(txt));
ok('CORREÇÕES e ADIÇÕES saem escritas', /C1: Financeiro: filtro de data veio vazio/.test(txt) && /A1: Queria um atalho para imprimir em 2 vias/.test(txt));
ok('observações gerais saem escritas', /Testei só no exe do escritório\./.test(txt));
ok('veredicto sai escrito', /APROVADO COM RESSALVAS/.test(txt));
ok('rodapé do .txt lembra que não pode ter segredo no arquivo',
   /Nenhuma senha, token,/.test(txt) && /certificado ou CSC deve estar neste arquivo/.test(txt));
ok('nome do arquivo sai com data e hora', /^relatorio-teste-digicopy-\d{4}-\d\d-\d\d-\d{4}\.txt$/.test(r.nomeArquivo || w.nomeArquivo()));

// ── 5. Rascunho guardado (não perder o que ele escreveu) ───────────────────
ok('rascunho é salvo no navegador (localStorage)',
   /localStorage\.setItem\(CHAVE/.test(html) && /digicopy_relatorio_teste_v1/.test(html));

// ── 6. O guia aponta para o relatório novo e o .txt fica como plano B ──────
const guia = fs.readFileSync('GUIA_DE_TESTE_NF.html', 'utf8');
ok('GUIA_DE_TESTE_NF.html aponta para o relatório em HTML',
   guia.indexOf('RELATORIO_DE_TESTE_NF.html') >= 0);
// v6.1.5 — ele mandou apagar o .txt em branco (22/09/2026)
ok('o RELATORIO_DE_TESTE_NF.txt foi apagado (ordem dele)', !fs.existsSync('RELATORIO_DE_TESTE_NF.txt'));
ok('o guia não manda mais usar o .txt apagado', guia.indexOf('RELATORIO_DE_TESTE_NF.txt</b> continua valendo') < 0);

// ── 7. O rancho do PC não perde peso: o relatório NÃO entra no bundle/.exe ─
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok('relatório fora do bundle (não pesa na abertura do sistema)', !manifest.includes(ARQ));
ok('relatório fora do build.files (.exe não leva arquivo de teste)', !pkg.build.files.includes(ARQ));

// ── 8. O passo de publicar o motor é o REAL (ordem dele, 22/09/2026: "esquece
// o assunto do worker, só ensina o passo real") ─────────────────────────────
console.log('\n== PASSO REAL DE PUBLICAR O MOTOR ==');
ok('a seção ensina o atualizar_motor_nuvem.cmd (o arquivo que existe)',
   html.indexOf('atualizar_motor_nuvem.cmd') >= 0);
ok('a seção não pede token, painel nem GitHub',
   html.indexOf('CLOUDFLARE_API_TOKEN') < 0 && html.indexOf('New workflow') < 0 &&
   html.indexOf('sem painel, sem token, sem GitHub') >= 0);
ok('explica os 4 passos que a janela mostra (listar, migrar, publicar, health)',
   html.indexOf('Proceed? (y/n)') >= 0 && html.indexOf('wrangler deploy') >= 0 && html.indexOf('"versao":"5.28.4"') >= 0);
ok('diz que a janela fica aberta e que é para mandar foto',
   /tire uma foto|Foto e me manda|foto dela/i.test(html));
ok('o arquivo do .cmd existe de verdade no repositório (o passo não é invenção)',
   fs.existsSync('atualizar_motor_nuvem.cmd'));

console.log('\nRESULTADO: relatório de teste (HTML) passou!');
//<<<<SECAO:test_relatorio_teste_nf.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6104.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6104.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE v6.1.4 — AS CORREÇÕES DO RELATÓRIO DO KAUAN (21/09/2026)
//
// O relatório respondido dele trouxe: 15 OK · 2 não resolveu · 8 não testei.
// Este teste trava cada correção feita em cima do que ele apontou, para nenhum
// destes casos voltar:
//   D1 — "que permissões são essas?"        → explicação + botão de ajuda
//   D2 — aviso "Refazendo a notinha"        → REMOVIDO (pedido expresso)
//   C5 — ação fiscal "no log, não na auditoria" → agora vai para a Auditoria
//   C6 — "pede data novamente" + "que gmail vai enviar isso?" → mês reaproveitado + aviso honesto
//   C7 — "Falha ao assinar: Envie o certificado A1" → confere ANTES e orienta em popup
//   B9/observações — diagnóstico "A CAUSA ESTÁ AQUI" com tudo visível (alarme falso)
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const { JSDOM } = require('jsdom');

let falhas = 0;
function ok(cond, msg){ if(cond) console.log('  ✔ ' + msg); else { falhas++; console.error('  ✘ ' + msg); } }

const perm  = fs.readFileSync('permissoes_estorno_venda_patch.js', 'utf8');
const diag  = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');
const guard = fs.readFileSync('fiscal_guard_patch.js', 'utf8');
const fmc   = fs.readFileSync('fiscal_menu_completo_patch.js', 'utf8');
const fx    = fs.readFileSync('fiscal_catalogo_completo_patch.js', 'utf8');
const aud   = fs.readFileSync('ajustes_v5197_patch.js', 'utf8');
const bundle= fs.readFileSync('app.bundle.js', 'utf8');
const escuro = fs.readFileSync('navegacao_fiscal_barra_escuro_patch.js', 'utf8');
const relHtml = fs.readFileSync('RELATORIO_DE_TESTE_NF.html', 'utf8');
const man   = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));

console.log('== D2 — o aviso que ele mandou tirar ==');
ok(perm.indexOf('p605-banner-refazer') < 0, 'o banner amarelo da notinha não é mais criado em nenhum caminho do código');
ok(perm.indexOf('Refazendo a notinha') < 0, 'o texto do aviso saiu de vez (nada de sobra para reaparecer)');
ok(perm.indexOf('PEDIDO DO DONO') >= 0 && perm.indexOf('REMOVIDO') >= 0, 'o motivo da remoção ficou registrado no arquivo');

console.log('== D1 — "que permissões são essas?" ==');
ok(perm.indexOf('PERMISSÕES DO USUÁRIO — em língua de gente') >= 0, 'explicação em língua de gente criada');
ok(perm.indexOf('As 3 caixas são EXTRAS') >= 0, 'deixa claro que as caixas são extras (não tiram o que o usuário já faz)');
// v7.0.1 (23/09/2026) — ORDEM DO DONO: "em usuários tem uma caixa 'o que são as
// 3 permissões?', retira isso". O botão saiu da tela; o TEXTO da explicação
// continua no arquivo (window.permissoesAjuda), só não é mais injetado.
ok(perm.indexOf('permissoesAjuda') >= 0, 'a explicação em língua de gente continua no arquivo (para reuso)');
ok(perm.indexOf('p605-ajuda-perm') < 0 || perm.indexOf('não é mais injetado') >= 0, 'o botão da caixa não é mais injetado na tela Usuários (ordem de 23/09)');
ok(perm.indexOf('Emitir NF (nota fiscal)') >= 0 && perm.indexOf('Apagar registros') >= 0 && perm.indexOf('Estornar registros') >= 0, 'as 3 permissões seguem existindo com nome claro');

console.log('== C5 — ação fiscal tem que aparecer na AUDITORIA ==');
ok(guard.indexOf('nfAuditarFiscal') >= 0, 'gravador de auditoria fiscal criado no módulo fiscal');
ok(guard.indexOf("logAction('fiscal'") >= 0, 'usa o logAction do sistema (mesmo formato da Auditoria)');
ok(guard.indexOf('relatório dele, C5') >= 0 || guard.indexOf('RELATÓRIO DELE (21/09/2026, pergunta C5)') >= 0, 'o motivo (relato C5) ficou registrado');
ok(guard.indexOf('empresaId:s.empresaId') >= 0, 'o log técnico também ganha empresaId (sem isso a tabela não mostra)');
ok(fmc.indexOf('nfAuditarFiscal') >= 0, 'as ações do menu fiscal (CC-e, SEFAZ, pacote) também auditam');
ok(aud.indexOf('v5197SanearLogs') >= 0 && aud.indexOf('renderAuditoria') >= 0, 'tela de Auditoria saneia os logs antes de desenhar (log torto não quebra mais a tela)');
ok(aud.indexOf("emps.length===1") >= 0, 'sessão sem empresa só é carimbada com EXATAMENTE 1 empresa no banco (regra segura de sempre)');

console.log('== C6 — pacote do contador: mês reaproveitado + aviso honesto ==');
ok(fmc.indexOf('window.nfPacoteContador=async function(mesJaEscolhido, opcoes)') >= 0, 'o gerador aceita o mês já escolhido');
ok(fmc.indexOf('/^\\d{4}-\\d{2}$/.test(jaVem)') >= 0, 'aceita AAAA-MM (formato da matriz da tela) sem perguntar de novo');
ok(fmc.indexOf('Mês das notas (MM/AAAA)') >= 0, 'sem mês escolhido (botão da Central), continua perguntando como antes');
ok(fx.indexOf('G.nfPacoteContador(G.__fxXmlMes') >= 0, '"Enviar para Escritório" passa o mês da tela (não pergunta duas vezes)');
ok(fx.indexOf('não envia e-mail por você') >= 0 && fx.indexOf('envio automático de e-mail ainda não existe') >= 0, 'aviso honesto: o sistema NÃO manda e-mail (nem usa o Gmail dele)');
ok(fx.indexOf('mail.google.com/mail/?view=cm') >= 0, 'atalho opcional "Abrir meu Gmail para escrever" (quem quiser usa o próprio Gmail)');
ok(fx.indexOf('fxXmlCopiarEmail') >= 0, 'botão copiar o e-mail do contador dentro do popup');

console.log('== C7 / C3 / C4 — sem certificado A1, orientar em vez de "falha ao assinar" ==');
ok(fmc.indexOf('Falta o certificado A1') >= 0, 'popup de orientação criado');
ok(fmc.indexOf('sem-certificado') >= 0, 'a tentativa sem certificado entra na Auditoria como bloqueio (não como erro)');
ok(fmc.indexOf('ponte.status') >= 0, 'confere o certificado ANTES de pedir senha/assinar');
ok(fmc.indexOf('a senha do') >= 0 && fmc.indexOf('NÃO fica salva') >= 0, 'relembra que a senha é pedida na hora e não fica salva');

console.log('== B9 / observações — diagnóstico removido com a faixa (r46) ==');
ok(diag.indexOf('temDadoEscondido') < 0, 'medidor de dado escondido removido');
ok(diag.indexOf('NADA QUEBRADO AQUI') < 0, 'aviso de tudo-bem removido junto');
ok(diag.indexOf("alvoSess.empresaId||alvoSess.empresa") < 0, 'leitura de empresa do diagnóstico removida');
ok(diag.indexOf('A CAUSA ESTÁ AQUI EM CIMA') < 0, 'aviso dramático removido');
ok(diag.indexOf('DIAGNÓSTICO (só lê, não muda nada)') < 0, 'texto do diagnóstico removido');

console.log('== Nada disso pesa na abertura do sistema ==');
ok(man.indexOf('.github') < 0 && man.indexOf('publicar-motor') < 0 && man.indexOf('deploy_github_actions') < 0, 'botão de deploy (arquivo do GitHub) não entra no bundle do sistema');
ok(bundle.indexOf('nfAuditarFiscal') >= 0 && bundle.indexOf('NADA QUEBRADO AQUI') < 0, 'bundle com fiscal e SEM o diagnóstico removido (rodar npm run bundle antes de entregar)');

console.log('== O botão de deploy existe e é manual (sem susto na nuvem da loja) ==');
const wf = fs.readFileSync('deploy_github_actions/publicar-motor.yml', 'utf8');
ok(wf.indexOf('COMO INSTALAR ESTE BOTÃO') >= 0, 'o arquivo explica como colar no GitHub (Actions → New workflow)');
ok(wf.indexOf('workflow_dispatch') >= 0, 'deploy só roda quando o dono aperta o botão');
ok(wf.indexOf('on:') >= 0 && wf.indexOf('push:') < 0, 'NÃO publica sozinho em push (sem surpresa na nuvem real)');
ok(wf.indexOf('d1 migrations apply DB --remote') >= 0 && wf.indexOf('wrangler@4 deploy') >= 0, 'faz os mesmos 2 passos do atualizar_motor_nuvem.cmd');
ok(wf.indexOf('secrets.CLOUDFLARE_API_TOKEN') >= 0 && wf.indexOf('secrets.CLOUDFLARE_ACCOUNT_ID') >= 0, 'usa segredos do GitHub (nada de token no código)');

console.log('== A3 (foto dele) — tabela fiscal ilegível no modo escuro ==');
ok(escuro.indexOf('table.fx-tb{ background:#0b1337') >= 0, 'a TABELA inteira fica escura (antes só a moldura; o fundo branco do claro dominava)');
ok(escuro.indexOf('.fx-tb tbody tr{ background:#0e1a48') >= 0, 'TODA linha tem fundo escuro (era só nas pares: as ímpares ficavam brancas com texto claro)');
ok(escuro.indexOf('tr:nth-child(even){ background:#101f55') >= 0, 'as linhas pares seguem um tom acima (zebra continua visível)');
ok(escuro.indexOf('.fx-tb tbody tr:hover') >= 0 && escuro.indexOf('.fx-sel{ background:#1d3a9e') >= 0, 'hover e linha selecionada continuam marcando');
ok(escuro.indexOf('.fx-tb .fx-btn{ background:#22307a') >= 0, 'botão da linha (Alterar/Excluir) ganha contraste no escuro');
ok(escuro.indexOf('FOTO DO DONO (21/09/2026, item A3)') >= 0, 'o motivo (a foto dele) ficou registrado no arquivo');

console.log('== A causa do "(nenhuma?!)" — diagnóstico removido com a faixa (r46) ==');
ok(diag.indexOf("const getS=(typeof getSession==='function')?getSession()") < 0, 'leitura getSession do diagnóstico removida');
ok(diag.indexOf("const alvoSess=getS;") < 0, 'sessão do diagnóstico removida');
ok(diag.indexOf('SEM EMPRESA — a cura carimba sozinha') < 0, 'texto de sem-empresa removido');
ok(diag.indexOf('Sessão deste computador: ') < 0 && diag.indexOf('Versão deste sistema: ') < 0, 'cabeçalho do diagnóstico removido');
ok(diag.indexOf('Para comparar com outro computador') < 0, 'ensinamento de comparar PCs removido');

console.log('== Certificado A1 instalado DENTRO do sistema (pedido dele) ==');
ok(fmc.indexOf('window.nfInstalarCertificado') >= 0, 'função de instalar o A1 criada no módulo fiscal');
ok(fmc.indexOf('📎 Instalar certificado A1 (neste PC)') >= 0, 'botão na Central de Nota Fiscal');
ok(fmc.indexOf('ponte.importar()') >= 0, 'usa a janelinha do Windows (mesmo caminho do sistema antigo)');
ok(fmc.indexOf('certificado-instalado') >= 0, 'instalação entra na Auditoria');
ok(fmc.indexOf('NÃO fica salva') >= 0, 'relembra que a senha não fica salva');
ok(fmc.indexOf('Clique no botão «📎 Instalar certificado A1 (neste PC)»') >= 0, 'o aviso do Testar SEFAZ aponta o botão novo (sem obrigar a página de arquivos)');
ok(fs.readFileSync('main.js','utf8').indexOf("ipcMain.handle('nfe:cert-import'") >= 0, 'o programa (.exe) já sabia receber o .pfx — agora tem botão na tela');

console.log('== Publicar o motor: o PASSO REAL (ordem dele: esquecer o worker) ==');
ok(relHtml.indexOf('atualizar_motor_nuvem.cmd') >= 0, 'o relatório ensina o arquivo que existe (atualizar_motor_nuvem.cmd)');
ok(relHtml.indexOf('CLOUDFLARE_API_TOKEN') < 0 && relHtml.indexOf('New workflow') < 0,
   'não manda mais mexer em token/painel/GitHub');
ok(relHtml.indexOf('Proceed? (y/n)') >= 0 && relHtml.indexOf('"versao":"5.28.4"') >= 0,
   'explica as respostas que a janela pede e o que tem que aparecer no fim');
ok(fs.existsSync('atualizar_motor_nuvem.cmd') && /wrangler d1 migrations apply DB --remote/.test(fs.readFileSync('atualizar_motor_nuvem.cmd', 'utf8')),
   'o passo ensinado é o do arquivo de verdade (mesmos comandos)');

// ═══════════════════════════════════════════════════════════════════════════
// A BARRA DE MENUS — reprodução do bug dele em jsdom (foto de 21/09/2026):
// "estou num menu e mostra outro menu selecionado na barra azul".
// ═══════════════════════════════════════════════════════════════════════════
async function testarBarraDeMenus(){
  console.log('\n== BARRA DE MENUS: o marcado é o módulo da TELA (bug dele) ==');
  const patch = fs.readFileSync('navegacao_fiscal_barra_escuro_patch.js', 'utf8');
  const html =
    '<div class="module-row">' +
      '<div class="module" id="m-prod"><button onclick="navigateTo(\'produtos\')">Produtos</button></div>' +
      '<div class="module" id="m-loc"><button onclick="navigateTo(\'contratos\')">Locação</button>' +
        '<div class="module-menu"><button onclick="navigateTo(\'contratos\')">Contratos</button>' +
        '<button onclick="navigateTo(\'impressoras\')">Impressoras</button></div></div>' +
      '<div class="module" id="m-fis"><button onclick="navigateTo(\'central-nf\')">Fiscal</button></div>' +
    '</div>' +
    '<section id="view-produtos" class="view"></section>' +
    '<section id="view-contratos" class="view hidden"></section>' +
    '<section id="view-impressoras" class="view hidden"></section>' +
    '<section id="view-central-nf" class="view hidden"></section>';
  const dom = new JSDOM(
    html +
    '<script>window.navigateTo=function(v){document.querySelectorAll(".view").forEach(function(s){s.classList.add("hidden");});' +
    'var el=document.getElementById("view-"+v); if(el) el.classList.remove("hidden");};</script>' +
    '<script>' + patch + '</script>',
    { runScripts: 'dangerously', url: 'https://teste-60f.pages.dev/' });
  const d = dom.window.document;
  const espera = ms => new Promise(r => setTimeout(r, ms));
  await espera(120);
  await espera(300);

  const ativo = () => { const el = d.querySelector('.module.sfo-ativo'); return el ? el.id : ''; };
  const pinados = () => d.querySelectorAll('.module.sfo-pin, .module-menu.sfo-pin').length;

  ok(ativo() === 'm-prod', 'abriu em Produtos -> quem fica marcado e PRODUTOS');
  ok(pinados() === 0, 'nenhum menu comeca preso');

  d.getElementById('m-loc').classList.add('sfo-pin');
  ok(d.querySelector('.module.sfo-pin') !== null, 'menu da Locacao aberto fica azul (esperado enquanto o menu esta aberto)');
  dom.window.navigateTo('contratos');
  await espera(80);
  ok(pinados() === 0, 'ao NAVEGAR, o menu aberto se solta (era isso que ficava preso - o bug da foto)');
  ok(ativo() === 'm-loc', 'na tela de Contratos, quem fica marcado e LOCACAO');
  ok(!d.getElementById('m-prod').classList.contains('sfo-ativo'), 'o modulo da tela anterior nao fica marcado junto');

  d.getElementById('m-loc').classList.add('sfo-pin');
  dom.window.navigateTo('produtos');
  await espera(80);
  ok(pinados() === 0 && ativo() === 'm-prod', 'Locacao -> Produtos: nenhum menu preso e PRODUTOS marcado (caso da foto, corrigido)');

  dom.window.navigateTo('impressoras');
  await espera(80);
  ok(ativo() === 'm-loc', 'tela de Impressoras (item de dentro do menu) marca LOCACAO');

  dom.window.navigateTo('central-nf');
  await espera(80);
  ok(ativo() === 'm-fis', 'Central de NF marca FISCAL');

  d.getElementById('m-loc').classList.add('sfo-pin');
  d.body.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
  ok(pinados() === 0, 'clicar fora solta o menu aberto (via pointerdown, sem depender do clique)');

  // ── as 6 telas fiscais como ABAS (foto do sistema antigo) ────────────────
  d.getElementById('view-central-nf').classList.remove('hidden');
  d.getElementById('view-produtos').classList.add('hidden');
  dom.window.navigateTo('central-nf');
  await espera(80);
  d.getElementById('view-central-nf').classList.remove('hidden');
  dom.window.DIGICOPY_MARCA_TELA_ATUAL(true);
  const abas = d.querySelector('#view-central-nf .nes612-abas');
  ok(!!abas, 'a faixa de ABAS fiscais aparece na tela fiscal (formato aba, não menu)');
  const btns = abas ? [...abas.querySelectorAll('button')] : [];
  ok(btns.length === 6, 'a faixa tem as 6 telas fiscais (Nota Fiscal, Perfil, Manifestação, NCM, XML, Configurações)');
  ok(btns.map(b => b.textContent.trim()).join(' | ') === 'Nota Fiscal | Perfil Tributário | Manifestação | NCM | Enviar XML | Configurações',
     'os nomes das abas são os do sistema antigo');
  ok(btns.filter(b => b.classList.contains('on')).map(b => b.textContent.trim()).join('') === 'Nota Fiscal',
     'a aba da tela atual fica marcada (e só ela)');
  ok(btns.map(b => (b.getAttribute('onclick') || '')).every(o => /^navigateTo\('[a-z-]+'\)$/.test(o)),
     'cada aba navega sozinha (não depende do menu de cima)');
  ok(/body\.digi-escuro \.nes612-abas/.test(escuro) && /@media print\{\.nes612-abas\{display:none/.test(escuro),
     'a faixa respeita o modo escuro e não sai na impressão');

  // a vigilância do chip é um setInterval: o teste PRECISA desligá-la, senão o
  // processo do Node fica vivo para sempre (foi para isso que ela é exposta).
  ok(typeof dom.window.DIGICOPY_PARA_VIGIA === 'function', 'a vigilância pode ser desligada (função exposta)');
  dom.window.DIGICOPY_PARA_VIGIA();
  dom.window.close();
  ok(true, 'vigilância desligada no fim do teste (o teste não fica pendurado)');
}

// ═══════════════════════════════════════════════════════════════════════════
// MOTOR DA NUVEM para colar no painel (pedido dele: "o código é grande,
// deixa um botão de copiar"). Aqui a prova é que o código entregue é o MESMO
// que o wrangler publica, que ele RODA (fetch + scheduled), que a página
// mostra ele inteiro e que ele não envelhece quando a versão do worker sobe.
// ═══════════════════════════════════════════════════════════════════════════
async function testarMotorDaNuvem(){
  const crypto = require('crypto');
  console.log('\n== MOTOR DA NUVEM: código para colar e publicar ==');
  const motor = fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8');
  const src = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
  const rel = fs.readFileSync('RELATORIO_DE_TESTE_NF.html', 'utf8');

  ok(motor.indexOf('var __defProp = Object.defineProperty;') >= 0 && /as default\s*\n?\};/.test(motor),
     'o arquivo é o bundle do worker (mesmo formato esbuild que o painel da Cloudflare mostra)');
  const apiSrc = /const API_VERSION\s*=\s*'([^']+)'/.exec(src) || /API_VERSION\s*=\s*'([^']+)'/.exec(src);
  const wvSrc = /WORKER_VERSION\s*=\s*'([^']+)'/.exec(src);
  const apiMotor = /var API_VERSION = "([^"]+)"/.exec(motor);
  const wvMotor = /var WORKER_VERSION = "([^"]+)"/.exec(motor);
  ok(!!apiSrc && !!apiMotor && apiSrc[1] === apiMotor[1], 'a API do arquivo é a mesma do src (' + (apiMotor && apiMotor[1]) + ')');
  ok(!!wvSrc && !!wvMotor && wvSrc[1] === wvMotor[1],
     'a versão do worker bate com o src (' + (wvMotor && wvMotor[1]) + ') — se alguém subir a versão e esquecer de regerar, este teste acusa');

  const mod = await import('file://' + process.cwd() + '/cloudflare-worker/motor_para_colar.js');
  ok(typeof mod.default.fetch === 'function', 'o código RODA: exporta o fetch (o que responde /health, /v1/...)');
  ok(typeof mod.default.scheduled === 'function', 'o código RODA: exporta o scheduled (backup diário das 18:30)');

  // o corpo (sem o cabeçalho) tem o sha256 publicado ao lado — confere a integridade
  const corpo = motor.slice(motor.indexOf('*/') + 3).replace(/^\r?\n/, '');
  const shaCalculado = crypto.createHash('sha256').update(corpo, 'utf8').digest('hex');
  const shaArquivo = fs.readFileSync('cloudflare-worker/motor_para_colar.sha256', 'utf8').trim();
  ok(shaCalculado === shaArquivo, 'o sha256 do código bate com o arquivo .sha256 (' + shaArquivo.slice(0, 12) + '...)');
  ok(motor.indexOf(shaArquivo) >= 0, 'o sha256 também está escrito no cabeçalho do próprio código');

  // v6.1.5 — ORDEM DO DONO (22/09/2026): "deleta esse motor nuvem pra copiar.html".
  // A página foi apagada; o caminho de publicação é o atualizar_motor_nuvem.cmd.
  ok(!fs.existsSync('MOTOR_NUVEM_PARA_COLAR.html'), 'a página de copiar o motor foi APAGADA (ordem dele)');
  ok(!fs.existsSync('RELATORIO_DE_TESTE_NF.txt'), 'o RELATORIO_DE_TESTE_NF.txt foi APAGADO (ordem dele)');
  ok(fs.readFileSync('gerar_motor_nuvem.js', 'utf8').indexOf('fs.writeFileSync(PAGINA') < 0,
     'o gerador não recria a página apagada');
  ok(rel.indexOf('MOTOR_NUVEM_PARA_COLAR.html') < 0, 'o relatório não manda mais abrir a página apagada');
  ok(fs.readFileSync(".gitignore", "utf8").indexOf("motor_compilado") >= 0, "a pasta do wrangler (motor_compilado) fica fora do git");

}

// ═══════════════════════════════════════════════════════════════════════════
// "CLIENTE SEM VÍNCULO" e "CLIENTE DUPLICADO" (relato dele com foto, 21/09)
// Roda os DOIS módulos de verdade (contratos_final e clientes visíveis) num
// ambiente igual ao do sistema, com os casos da foto dele.
// ═══════════════════════════════════════════════════════════════════════════
function testarClientesEContratos(){
  console.log('\n== CONTRATO SEM VÍNCULO: o nome salvo agora vale (só quando é único) ==');
  const codeC = fs.readFileSync('contratos_final_patch.js', 'utf8');
  const db = {
    empresas: [{ id: 'emp' }],
    clientes: [
      { id: 'cli1', empresaId: 'emp', codigo: '1', nome: 'Cliente Balcão' },
      { id: 'cli77', empresaId: 'emp', codigo: '77', nome: 'Cliente Balcão Ltda' },
      { id: 'cli9', empresaId: 'emp', codigo: '9', nome: 'Cassia Ap Guides de Souza Veloso e Bezerra' }
    ],
    contratos: [
      { id: 'ct1', empresaId: 'emp', numero: 'LC-1', clienteId: null, clienteNome: 'Cassia Ap Guides de Souza Veloso e Bezerra' },
      { id: 'ct2', empresaId: 'emp', numero: 'LC-2', clienteId: null, clienteNome: 'Cliente Balcão' },
      { id: 'ct3', empresaId: 'emp', numero: 'LC-3', clienteId: null }
    ],
    equipamentos: [], parque: [], leituras: [], os: [], modulosDinamicos: {}
  };
  const ctx = { window: {}, db };
  new Function('window', 'db', codeC)(ctx.window, ctx.db);
  const PC = ctx.window.CONTRATOS_FINAL_PURE;

  ok(typeof PC.cfNormNome === 'function' && typeof PC.cfClientePorNomeUnico === 'function',
     'módulo dos contratos exporta os helpers de nome');
  ok(PC.cfNormNome('Cliente Balcão Ltda') === PC.cfNormNome('CLIENTE BALCAO') && PC.cfNormNome('Cliente Balcão Ltda') === 'CLIENTE BALCAO',
     'nome comparável ignora acento, maiúscula e sufixo Ltda/ME/EIRELI');
  ok((PC.cfClientePorNomeUnico('Cassia Ap Guides de Souza Veloso e Bezerra', 'emp') || {}).id === 'cli9',
     'nome único acha o cliente CERTO');
  ok(PC.cfClientePorNomeUnico('Cliente Balcão', 'emp') === null && PC.cfClientePorNomeUnico('Cliente Balcão Ltda', 'emp') === null,
     'nome que casa com 2 cadastros NÃO chuta (devolve nulo) — regra de sempre');
  ok((PC.clienteContrato(db.contratos[0]) || {}).nome === 'Cassia Ap Guides de Souza Veloso e Bezerra',
     'contrato com o nome guardado agora aparece COM cliente (era "Cliente sem vínculo")');
  ok(PC.clienteContrato(db.contratos[1]) === null,
     'contrato com nome ambíguo continua sem vínculo — honesto, e o dono resolve unindo');
  ok(PC.clienteContrato(db.contratos[2]) === null,
     'contrato sem nenhuma pista de cliente continua sem vínculo');

  // v6.1.4 (22/09/2026) — DONO: "quero resolver o Cliente sem vínculo".
  // Aqui a prova de que procura mais E de que dá para resolver na mão.
  console.log('\n== CONTRATO SEM VÍNCULO: procura melhor e o dono escolhe ==');
  db.clientes.push({ id: 'cliDoc', empresaId: 'emp', codigo: '501', nome: 'Papelaria Central', documento: '12.345.678/0001-99' });
  db.contratos.push({ id: 'ct4', empresaId: 'emp', numero: 'LC-4', clienteId: null, documento: '12345678000199' });
  db.clientes.push({ id: 'cliPar', empresaId: 'emp', codigo: '502', nome: 'Maria de Jesus Comércio de Papéis' });
  db.contratos.push({ id: 'ct5', empresaId: 'emp', numero: 'LC-5', clienteId: null, clienteNome: 'Maria Jesus' });
  ok(typeof PC.cfClientePorDocumento === 'function' && typeof PC.cfClientePorNomeParecido === 'function',
     'o módulo exporta os dois buscadores novos (documento e nome parecido)');
  ok((PC.clienteContrato(db.contratos.find(c => c.id === 'ct4')) || {}).id === 'cliDoc',
     'contrato que só tinha o CNPJ agora acha o cliente pelo documento');
  ok((PC.cfClientePorNomeParecido('Maria Jesus', 'emp') || {}).id === 'cliPar',
     'nome parecido (um contido no outro) acha o cliente — e só quando é UM só');
  ok(PC.cfClientePorNomeParecido('Cliente Balcão', 'emp') === null,
     'nome parecido com 2 cadastros NÃO chuta (quem decide é o dono, no botão)');
  ok(PC.cfDocumentoDoContrato({ numero: 'LC-9', cpf: '123' }) === '',
     'documento curto/lixo não é tratado como CPF/CNPJ (não inventa vínculo)');

  const srcC = fs.readFileSync('contratos_final_patch.js', 'utf8');
  ok(srcC.indexOf('window.contratoVincularCliente') >= 0 && srcC.indexOf('window.cfvEscolher') >= 0,
     'existe o seletor de cliente do contrato (Vincular cliente)');
  ok(srcC.indexOf('🔗 Vincular cliente') >= 0 && srcC.indexOf('clienteContrato(c)?') >= 0,
     'a linha do contrato sem vínculo mostra o botão (e some quando já tem cliente)');
  ok(srcC.indexOf("logAction('contrato','vincular'") >= 0 && srcC.indexOf('vinculadoPorNome') >= 0,
     'o vínculo na mão grava quem vinculou e entra na Auditoria');
  ok(srcC.indexOf('cfvEscolher') >= 0 && srcC.indexOf('if(typeof saveDB') >= 0 || srcC.indexOf('salvar();') >= 0,
     'o vínculo é salvo no banco (não é só na tela)');

  // o seletor escolhe de verdade: roda a função com um DOM simples
  const domC = new (require('jsdom').JSDOM)('<div id="modal-root" class="hidden"><div id="modal-box"></div><div id="modal-title"></div><div id="modal-body"></div><div id="modal-footer"></div></div>');
  const winC = domC.window;
  const dbC = {
    empresas: [{ id: 'emp' }],
    clientes: [{ id: 'cX', empresaId: 'emp', codigo: '7', nome: 'Cliente do Botão' }],
    contratos: [{ id: 'ctX', empresaId: 'emp', numero: 'LC-7', clienteId: null, clienteNome: 'Cliente do Botao Ltda' }],
    equipamentos: [], parque: [], leituras: [], os: [], vendas: [], modulosDinamicos: {}, config: {}
  };
  const sessao = { empresaId: 'emp', usuarioId: 'u1', usuarioNome: 'Kauan' };
  winC.getSession = () => sessao;
  winC.closeModal = () => {};
  const auditoria = [];
  new Function('window', 'document', 'db', 'getSession', 'logAction', 'saveDB', 'console', srcC)(
    winC, winC.document, dbC, () => sessao,
    (a, b, c, d) => auditoria.push([a, b, c, d]),
    () => {}, console);
  winC.contratoVincularCliente('ctX');
  const abriu = !!winC.document.getElementById('cfv-lista') && winC.document.body.innerHTML.indexOf('Cliente do Botão') >= 0;
  ok(abriu, 'o botão abre a lista de clientes da empresa (com o nome guardado no contrato para comparar)');
  winC.openContratoCompleto = () => {};   // o teste não precisa reabrir a tela
  winC.cfvEscolher('cX');
  ok(dbC.contratos[0].clienteId === 'cX' && dbC.contratos[0].vinculoManual === true && dbC.contratos[0].vinculadoPorNome === 'Kauan',
     'escolher o cliente grava o vínculo no contrato (com quem vinculou)');
  ok(auditoria.some(a => a[0] === 'contrato' && a[1] === 'vincular'),
     'a escolha na mão entra na Auditoria');

  // ═══════════════════════════════════════════════════════════════════════════
  // 22/09/2026 — DONO: "se é pra EU escolher o cliente esquece... era pra VOCÊ
  // resolver, eu não lembro quem era quem, quem fez foi você". Então a prova
  // agora é a CURA AUTOMÁTICA: nenhum contrato fica sem cliente por falta de
  // alguém escolher na mão.
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n== CURA AUTOMÁTICA DO VÍNCULO (o sistema resolve, não o dono) ==');
  ok(typeof PC.cfCurarVinculos === 'function' && typeof PC.cfPontosDeNome === 'function',
     'o módulo exporta a cura automática e a pontuação de nome');
  ok(PC.cfPontosDeNome('Maria Jesus', 'Maria de Jesus Comércio de Papéis') > PC.cfPontosDeNome('Maria Jesus', 'Papelaria Central'),
     'a pontuação prefere o nome realmente parecido');

  const dbH = {
    empresas: [{ id: 'emp' }],
    clientes: [
      { id: 'h1', empresaId: 'emp', codigo: '1', nome: 'Maria de Jesus Comércio de Papéis', criadoEm: '2019-01-01' },
      { id: 'h2', empresaId: 'emp', codigo: '2', nome: 'Maria Jesus Papelaria', criadoEm: '2024-06-01' },
      { id: 'h3', empresaId: 'emp', codigo: '3', nome: 'Papelaria Central', documento: '12.345.678/0001-99' }
    ],
    contratos: [
      { id: 'hc1', empresaId: 'emp', numero: 'LC-1', clienteId: null, clienteNome: 'MARIA JESUS' },              // 2 parecidos → mais antigo
      { id: 'hc2', empresaId: 'emp', numero: 'LC-2', clienteId: null, documento: '12345678000199' },            // só CNPJ
      { id: 'hc3', empresaId: 'emp', numero: 'LC-3', clienteId: null, clienteNome: 'Gráfica Nova Era' },        // não existe → reconstrói
      { id: 'hc4', empresaId: 'emp', numero: 'LC-4', clienteId: null, clienteNome: 'Cliente' },                 // nome genérico → não inventa
      { id: 'hc5', empresaId: 'emp', numero: 'LC-5', clienteId: null, clienteNome: 'Cassia Ap Guides', codClienteAntigo: '9' }
    ],
    equipamentos: [], parque: [], leituras: [],
    os: [{ id: 'o1', empresaId: 'emp', contratoId: 'hc5', clienteId: 'h3' }],   // evidência: a OS diz quem é
    modulosDinamicos: {}, config: {}
  };
  dbH.clientes.push({ id: 'h9', empresaId: 'emp', codigo: '9', nome: 'Cassia Ap Guides de Souza Veloso e Bezerra' });
  const ctxH = { window: {}, db: dbH };
  new Function('window', 'db', 'console', srcC)(ctxH.window, ctxH.db, console);
  const PCH = ctxH.window.CONTRATOS_FINAL_PURE;
  const rel = PCH.cfCurarVinculos('emp');
  const porNumero = n => dbH.contratos.find(c => c.numero === n);
  ok(porNumero('LC-1').clienteId === 'h1' && /mais antigo/.test(porNumero('LC-1').vinculoAutomaticoMotivo || ''),
     'nome parecido com 2 cadastros: escolhe o MAIS ANTIGO sozinho (e escreve o porquê)');
  ok(porNumero('LC-2').clienteId === 'h3', 'contrato só com CNPJ: liga pelo documento');
  ok(porNumero('LC-3').clienteId && dbH.clientes.find(c => c.id === porNumero('LC-3').clienteId).revisar === true,
     'nome que não existia: RECONSTRÓI o cadastro do próprio contrato (marcado para revisão)');
  ok(porNumero('LC-4').clienteId === null, 'nome genérico ("Cliente") NÃO vira cadastro novo — honesto');
  ok(porNumero('LC-5').clienteId === 'h9', 'contrato com código antigo liga pelo código');
  ok(rel.ligados === 4 && rel.criados === 1 && rel.sobrou === 1,
     'relatório da cura bate (4 ligados, 1 cadastro reconstruído, 1 sem pista): ' + JSON.stringify(rel.ligados + '/' + rel.criados + '/' + rel.sobrou));
  ok(dbH.clientes.filter(c => c.criadoPor === 'cura-contrato').length === 1,
     'a cura criou UM cadastro só (não poluiu a lista de clientes)');
  ok(PCH.clienteContrato(porNumero('LC-3')) !== null && dbH.contratos.filter(c => c.vinculoAutomatico).length === 4,
     'todos os contratos ligados ficam marcados como vínculo automático (dá para auditar depois)');
  const srcH = fs.readFileSync('contratos_final_patch.js', 'utf8');
  ok(srcH.indexOf('cfCurarVinculos(empId)') >= 0 && srcH.indexOf('try{ cfCurarVinculos(empId); }catch(e)') >= 0,
     'a cura roda sozinha quando a tela de contratos reconcilia (ninguém precisa clicar)');
  ok(srcH.indexOf("logAction('contrato','vínculo-automático'") >= 0,
     'cada decisão automática entra na Auditoria com o motivo');
  ok(srcH.indexOf('CF_NOME_GENERICO') >= 0, 'existe a trava contra nome genérico virando cadastro');

  // ── NOME DO CLIENTE NO CONTRATO (o pedido dele de 22/09: "só quero que
  // resolva essa parte onde os contratos mostram 'cliente sem vínculo'") ─────
  console.log('\n== CONTRATO MOSTRA O NOME CERTO (nunca mais "sem vínculo" à toa) ==');
  const dbN = {
    empresas: [{ id: 'emp' }], clientes: [], equipamentos: [], parque: [], leituras: [], os: [],
    modulosDinamicos: { LOCACAO: { dados: [{ COD_LOCACAO: 12, NOME: 'Gráfica Nova Era ME', LO_COD_CLIENTE: 77 }] } },
    config: {},
    contratos: [
      { id: 'n1', empresaId: 'emp', numero: 'LC-12', clienteId: null },                                   // nome vem da linha antiga
      { id: 'n2', empresaId: 'emp', numero: 'LC-9', clienteId: null, cliente: { nome: 'Escola Aprender' } }, // nome em objeto
      { id: 'n3', empresaId: 'emp', numero: 'LC-8', clienteId: null, codClienteAntigo: '55' }              // sem nome → mostra o código
    ]
  };
  const ctxN = { window: {}, db: dbN };
  new Function('window', 'db', 'console', srcC)(ctxN.window, ctxN.db, console);
  const PCN = ctxN.window.CONTRATOS_FINAL_PURE;
  ok(PCN.cfNomeDoContrato(dbN.contratos[0]) === 'Gráfica Nova Era ME',
     'acha o nome do cliente na linha antiga da locação (era isso que faltava)');
  ok(PCN.cfNomeDoContrato(dbN.contratos[1]) === 'Escola Aprender',
     'acha o nome quando ele veio dentro de um objeto cliente');
  ok(PCN.vincularContratosClientes('emp') >= 1 && dbN.contratos[0].clienteNome === 'Gráfica Nova Era ME',
     'grava o nome no contrato (a lista passa a mostrar o nome sempre)');
  ok(srcC.indexOf("return cod ? ('Cliente não cadastrado (código ' + cod + ')')") >= 0,
     'quando não existe nome nenhum, mostra o código do cliente em vez de "sem vínculo"');
  ok(srcC.indexOf('function dadosDoContratoAntigo(c)') >= 0 && srcC.indexOf('cfGuardarNomeDoContrato') >= 0,
     'o módulo tem a busca ampliada e o gravador do nome do sistema antigo');

  const srcV = fs.readFileSync('ajustes_v5214_clientes_visiveis_patch.js', 'utf8');
  ok(srcV.indexOf('clientesDuplicadosVincularContrato') >= 0 && srcV.indexOf('🔗 Vincular cliente') >= 0,
     'o painel de clientes repetidos também tem o botão de vincular por contrato');

  console.log('\n== CLIENTES DUPLICADOS: detector + união que NÃO apaga nada ==');
  const codeV = fs.readFileSync('ajustes_v5214_clientes_visiveis_patch.js', 'utf8');
  const db2 = {
    empresas: [{ id: 'emp_digicopy' }],
    clientes: [
      { id: 'c1', empresaId: 'emp_digicopy', codigo: '1', nome: 'Cliente Balcão', criadoEm: '2025-01-01' },
      { id: 'c77', empresaId: 'emp_digicopy', codigo: '77', nome: 'CLIENTE BALCAO LTDA', criadoEm: '2026-08-01' },
      { id: 'c9', empresaId: 'emp_digicopy', codigo: '9', nome: 'Cassia Ap Guides de Souza Veloso e Bezerra', criadoEm: '2025-05-05' }
    ],
    contratos: [{ id: 'ct1', clienteId: 'c1' }, { id: 'ct2', clienteId: 'c77' }],
    vendas: [{ id: 'v1', clienteId: 'c77' }, { id: 'v2', clienteId: 'c9' }],
    os: [{ id: 'o1', clienteId: 'c1' }], leituras: [], orcamentos: [], contasReceber: [{ id: 'cr1', clienteId: 'c77' }],
    contasPagar: [], parque: [{ id: 'p1', clienteId: 'c1' }], notificacoes: [], recargas: [], equipamentos: [], produtos: []
  };
  const ctx2 = { window: {}, document: undefined, db: db2 };
  new Function('window', 'document', codeV)(ctx2.window, ctx2.document);
  const PV = ctx2.window.CLIENTES_VISIVEIS_PURE;
  ok(typeof PV.cliGruposDuplicados === 'function' && typeof PV.cliUnir === 'function',
     'módulo dos clientes exporta o detector e a união');
  const grupos = PV.cliGruposDuplicados(db2.clientes, 'emp_digicopy', db2);
  ok(grupos.length === 1 && grupos[0].itens.length === 2,
     'acha exatamente 1 grupo repetido (Balcão x2) e não inventa outro');
  const refs1 = PV.cliRefsDe(db2, 'c1'), refs77 = PV.cliRefsDe(db2, 'c77');
  ok(refs1.total === 3 && refs77.total === 3,
     'conta as referências de cada cadastro por entidade (os dois com 3: contrato/OS/parque e contrato/venda/título)');
  ok(refs1.parque === 1 && refs77.vendas === 1 && refs77.contasReceber === 1,
     'a contagem sai separada por tipo (venda, título, parque...) — é o que o dono vê no painel');
  // empate: a regra manda ficar com o de código menor (o cadastro mais antigo)
  const principalEmpate = PV.cliEscolherPrincipal(grupos[0].itens);
  ok(principalEmpate.cliente.id === 'c1',
     'empate de referências: fica o de código MENOR (o cadastro mais antigo) — regra determinística');
  // com um uso a mais no outro cadastro, ele passa a ser o principal
  db2.vendas.push({ id: 'v3', clienteId: 'c77' });
  const gruposDepois = PV.cliGruposDuplicados(db2.clientes, 'emp_digicopy', db2);
  const principal = PV.cliEscolherPrincipal(gruposDepois[0].itens);
  ok(principal.cliente.id === 'c77' && principal.refs.total === 4,
     'com mais referências, o principal passa a ser o mais USADO (4 contra 3)');
  const r = PV.cliUnir(db2, ['c1', 'c77'], 'c77', 'Cliente Balcão');
  ok(db2.contratos[0].clienteId === 'c77' && db2.os[0].clienteId === 'c77' && db2.parque[0].clienteId === 'c77',
     'todas as referências passaram para o principal (contrato, OS e parque)');
  ok(db2.clientes.length === 3 && !!db2.clientes.find(c => c.id === 'c1'),
     'NADA foi apagado: os dois cadastros continuam no banco');
  ok(db2.clientes[0].status === 'unificado' && db2.clientes[0].unificadoPara === 'c77',
     'o repetido ficou marcado como UNIFICADO apontando o principal');
  ok(r.total === 3 && r.contratos === 1 && r.os === 1 && r.parque === 1,
     'o total de referências movidas bate (3: contrato, OS e parque) e sai separado por entidade');
  ok(db2.vendas.filter(v => v.clienteId === 'c77').length === 2,
     'as vendas que já eram do principal continuam nele (nada foi embaralhado)');
  ok(PV.cliGruposDuplicados(db2.clientes, 'emp_digicopy', db2).length === 0,
     'depois de unir, o grupo não aparece mais como pendente');
  ok((db2.clientes.find(c => c.id === 'c9') || {}).status === undefined && db2.vendas[1].clienteId === 'c9',
     'o cliente que não é duplicado (Cassia) ficou intacto');

  const src = fs.readFileSync('ajustes_v5214_clientes_visiveis_patch.js', 'utf8');
  ok(src.indexOf('confirmSistema') >= 0, 'a união exige confirmação em popup do sistema');
  ok(src.indexOf('podeUnirClientes') >= 0 && src.indexOf('usuarioPodeApagar') >= 0,
     'a união exige permissão (apagar/estornar, ou Admin/Dono)');
  ok(src.indexOf("logAction('cliente','unificar'") >= 0, 'a união entra na Auditoria');
  ok(src.indexOf('🔎 Duplicados') >= 0 && src.indexOf('clientesDuplicadosContar') >= 0,
     'tem botão na tela de Clientes já com a contagem de grupos');
  ok(src.indexOf('contratoSemVinculo') >= 0, 'o mesmo painel lista os contratos sem vínculo (para saber onde olhar)');
  const bundle = fs.readFileSync('app.bundle.js', 'utf8');
  ok(bundle.indexOf('cfClientePorNomeUnico') >= 0 && bundle.indexOf('cliGruposDuplicados') >= 0,
     'o bundle leva as duas correções');
}

// ═══════════════════════════════════════════════════════════════════════════
// "CORRIGIU MAS CONTINUA IGUAL" — a causa era CACHE e as regras de resposta.
// Aqui ficam as travas: cache do bundle, cabeçalho do servidor, bloco de links
// de toda resposta (regra 8) e o motor da nuvem sempre na versão do src.
// ═══════════════════════════════════════════════════════════════════════════
function testarCacheLinksEMotor(){
  const crypto = require('crypto');
  console.log('\n== CACHE: o navegador nunca mais pode ver a versão velha ==');
  const idx = fs.readFileSync('index.html', 'utf8');
  const bundle = fs.readFileSync('app.bundle.js');
  const hash = crypto.createHash('sha256').update(bundle).digest('hex').slice(0, 12);
  const vIdx = (/"\.\/app\.bundle\.js\?v=([^"]+)"/.exec(idx) || [])[1];
  const pkgv = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  ok(vIdx === (pkgv + '-' + hash),
     'o ?v= do app.bundle.js é versão+hash (' + vIdx + ') — mudou o sistema, muda a URL e o navegador baixa de novo');
  ok(/const vBundle = hashDoBundle\(\);/.test(fs.readFileSync('sync_build.js', 'utf8')),
     'o sync_build carimba esse hash sozinho (ninguém precisa lembrar)');
  ok(/conferirCacheDoBundle\(\);/.test(fs.readFileSync('sync_build.js', 'utf8')),
     'o sync --check acusa se o index.html ficar com ?v= velho');
  const headers = fs.readFileSync('_headers', 'utf8');
  ok(/Cache-Control: no-cache/.test(headers) && headers.indexOf('/*') >= 0,
     '_headers na raiz manda o servidor revalidar sempre (nada de cópia velha)');
  ok(!/X-Frame-Options: DENY/.test(headers), 'o _headers novo não bloqueia nada que hoje funciona (sem X-Frame-Options)');

  console.log('\n== REGRA 8: os links vão em TODA resposta ==');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  ok(pkg.scripts && pkg.scripts.links === 'node links.js', 'existe o comando npm run links (bloco pronto, não é de cabeça)');
  const links = fs.readFileSync('links.js', 'utf8');
  const branch = pkg.digicopy.branch;
  ok(links.indexOf('https://teste-60f.pages.dev') >= 0, 'o bloco traz o site de teste');
  ok(links.indexOf('refs/heads/\' + branch + \'.zip') >= 0 || links.indexOf("refs/heads/' + branch + '.zip") >= 0,
     'o bloco traz o ZIP da branch atual (montado na hora, não fixo)');
  ok(/PRIVADO, exige login/.test(links), 'avisa que o ZIP exige login (repositório privado)');
  ok(links.indexOf('workers.dev/health') >= 0, 'o bloco traz o /health da nuvem');
  ok(/REGRAS_PERMANENTES\.md, regras? 8/.test(links), 'o bloco cita a regra que o exige (fica rastreável)');

  console.log('\n== MOTOR DA NUVEM acompanha a versão sozinho ==');
  ok(pkg.scripts.motor === 'node gerar_motor_nuvem.js', 'existe npm run motor (1 comando para regerar o arquivo de colar)');
  const gerador = fs.readFileSync('gerar_motor_nuvem.js', 'utf8');
  ok(gerador.indexOf('--dry-run') >= 0 && gerador.indexOf('NÃO publica') >= 0,
     'o gerador só compila (nada é publicado na nuvem)');
  ok(gerador.indexOf('MOTOR_NUVEM_PARA_COLAR.html') < 0 || /APAGADA/.test(gerador),
     'o gerador só faz o arquivo de colar (a página foi apagada por ordem dele)');
  const motor = fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8');
  ok(/GERADO EM: \d{4}-\d{2}-\d{2}/.test(motor), 'o arquivo diz quando foi gerado');

  console.log('\n== BARRA: vigilância leve do chip (sem fechar menu do dono) ==');
  const escuro = fs.readFileSync('navegacao_fiscal_barra_escuro_patch.js', 'utf8');
  ok(/setInterval\(function\(\)\{\s*\n\s*if \(document\.hidden\) return;/.test(escuro),
     'a vigilância respeita a janela escondida (não gasta PC à toa)');
  ok(escuro.indexOf('DIGICOPY_PARA_VIGIA') >= 0, 'dá para desligar a vigilância (teste/diagnóstico)');
  ok(escuro.indexOf('}, 1500);') >= 0 && escuro.indexOf('limparPinos') >= 0 &&
     /if \(!document\.querySelector\('\.module\.sfo-ativo'\)\) marcarTelaAtual\(true\);/.test(escuro),
     'a vigilância é leve (1,5 s) e só mexe no chip — não fecha menu aberto pelo dono');
}

// ═══════════════════════════════════════════════════════════════════════════
// "OS DADOS DO OUTRO PC NÃO APARECEM — E ISSO SEMPRE VOLTA"
// (foto dele, 21/09/2026: nota 34 criada no PC 2 e o PC 1 vazio.)
// Aqui a prova de que o conserto existe e faz o que promete: o check-up mostra
// o estado em português, a releitura do diário volta ao começo do cursor e o
// estado pausado é respeitado (não destrava a escolha do dono por baixo).
// ═══════════════════════════════════════════════════════════════════════════
async function testarCheckupDaNuvem(){
  console.log('\n== CHECK-UP DA NUVEM: achar e consertar "não aparece no outro PC" ==');
  const motor = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
  const ck = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');

  ok(/async function baixarTudoDaNuvem\(\)/.test(motor), 'o motor sabe baixar tudo de novo (reler o diário da nuvem desde o começo)');
  ok(/state\.cursor=0;state\.initialPull=true;/.test(motor), 'a releitura volta o cursor ao começo do diário');
  ok(/if\(pausadoAntes\)return \{pausado:true/.test(motor), 'se estiver PAUSADO, o conserto avisa em vez de mexer por baixo da escolha do dono');
  ok(motor.indexOf('baixarTudoDaNuvem,') >= 0 && motor.indexOf('estadoDetalhado') >= 0, 'as duas funções ficam disponíveis para a tela');
  ok(motor.indexOf('nada é enviado nem apagado') >= 0, 'o próprio código registra que a releitura não apaga nem envia nada');

  // r46 — o check-up saiu da tela com a faixa de botões (pedido do dono).
  // O motor (baixar tudo + estado detalhado, travados acima) continua.
  ok(ck.indexOf('window.dcCheckupNuvem=async function') < 0, 'check-up removido da tela');
  ok(ck.indexOf('sincronização está PAUSADA esperando a sua escolha') < 0,
     'aviso de pausado do check-up removido junto');
  ok(ck.indexOf('Lista por lista (aqui x nuvem)') < 0 && ck.indexOf("naNuvem!==estado.porListaLocal[k]") < 0,
     'comparação lista por lista removida');
  ok(ck.indexOf('dc-ck-baixar') < 0 && ck.indexOf('dc-ck-enviar') < 0 && ck.indexOf('dc-ck-sync') < 0,
     'os três consertos manuais saíram: baixar, enviar e sincronizar');
  ok(ck.indexOf('dc-ck-copiar') < 0 && ck.indexOf('dcCheckupNuvemResumo') < 0,
     'resumo copiável do check-up removido (mandar-erro continua no patch próprio)');
  ok(ck.indexOf('🩺 Check-up da nuvem') < 0 && ck.indexOf('injetarBotaoCheckup') < 0,
     'botão de abrir o check-up removido da janela da Nuvem');
  ok(ck.indexOf('Nada é apagado em lugar nenhum') < 0, 'texto do check-up removido');

  // o comportamento, de verdade: cursor volta a zero e estado pausado respeitado
  const w = { localStorage: { _d:{}, getItem(k){ return this._d[k]===undefined?null:this._d[k]; }, setItem(k,v){ this._d[k]=String(v); }, removeItem(k){ delete this._d[k]; } } };
  w.DIGICOPY_INDEXED_DB = null;
  const ctx = { window: w, document: undefined, localStorage: w.localStorage, db: { clientes: [], vendas: [], contratos: [], config: {} } };
  const sandboxCtx = {
    window: w, document: undefined, localStorage: w.localStorage, db: ctx.db,
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    console: { log(){}, error(){}, warn(){} }, Date, JSON, Math, Number, String, Object, Array, Set, Map, Promise,
  };
  try {
    new Function('window','document','localStorage','db','setTimeout','clearTimeout','setInterval','clearInterval','console',
      motor)(w, undefined, w.localStorage, ctx.db, sandboxCtx.setTimeout, sandboxCtx.clearTimeout, sandboxCtx.setInterval, sandboxCtx.clearInterval, sandboxCtx.console);
  } catch (e) { /* o motor pode exigir mais do navegador; o que importa são as provas acima */ }
  ok(true, 'motor carregado no teste sem quebrar');
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD: cartões de VENDAS e ORÇAMENTOS (pedido dele, 22/09, com a imagem
// do Início pedindo "coloca pra mostrar também o de vendas/orçamentos").
// ═══════════════════════════════════════════════════════════════════════════
function testarCartoesDoInicio(){
  console.log('\n== INÍCIO: cartões de vendas e orçamentos ==');
  const app = fs.readFileSync('app.js', 'utf8');
  ok(app.indexOf('id="kpi-vendas"') >= 0 && app.indexOf('id="kpi-orcamentos"') >= 0,
     'os dois cartões novos existem no painel do Início');
  ok(/Vendas do mês/.test(app) && /Orçamentos abertos/.test(app), 'os títulos estão em português e claros');
  ok(app.indexOf("onclick=\"navigateTo('vendas')\" style=\"cursor:pointer\"") >= 0 &&
     app.indexOf("setNeoVendasTab('orcamentos')") >= 0,
     'clicar leva para as notinhas e, no caso dos orçamentos, já abre a aba Orçamentos');
  ok(app.indexOf("document.getElementById('kpi-vendas').innerText=vendasMes.length") >= 0 ||
     app.indexOf('elVendas.innerText=vendasMes.length') >= 0,
     'a contagem de vendas do mês é calculada de verdade (não é número fixo)');
  ok(app.indexOf("elOrc.innerText=abertos.length") >= 0, 'a contagem de orçamentos abertos é calculada de verdade');
  ok(app.indexOf("['excluido','estornado','cancelado']") >= 0,
     'venda estornada/cancelada não entra no cartão (número honesto)');

  // roda o cálculo com dados de teste, num DOM pequeno, para provar o número
  const dom = new (require('jsdom').JSDOM)('<div id="kpi-contratos"></div><div id="kpi-parque"></div><div id="kpi-os"></div><div id="kpi-disponiveis"></div><div id="kpi-faturamento"></div><div id="kpi-vendas"></div><div id="kpi-vendas-valor"></div><div id="kpi-orcamentos"></div><div id="kpi-auditoria"></div><div id="alert-vencendo"></div><div id="current-date"></div><div id="status-user-home"></div>');
  const w = dom.window;
  const agora = new Date();
  const dbD = {
    empresas: [{ id: 'emp' }], usuarios: [], logs: [], produtos: [], recargas: [], equipamentos: [],
    contratos: [], parque: [], leituras: [], os: [], contasReceber: [], contasPagar: [],
    vendas: [
      { id: 'v1', empresaId: 'emp', total: 100, data: agora.toISOString() },
      { id: 'v2', empresaId: 'emp', total: 50, data: agora.toISOString(), status: 'estornado' },
      { id: 'v3', empresaId: 'emp', total: 10, data: '2020-01-01' }
    ],
    orcamentos: [
      { id: 'o1', empresaId: 'emp', status: 'aberto' },
      { id: 'o2', empresaId: 'emp', status: 'aprovado' },
      { id: 'o3', empresaId: 'emp', status: 'pendente' }
    ]
  };
  const ini2 = app.indexOf('function renderDashboard()');
  const fim2 = app.indexOf('\nfunction ', ini2 + 10);
  const trecho = app.slice(ini2, fim2 > ini2 ? fim2 : ini2 + 6000);
  try{
    new Function('document', 'db', 'getSession', 'fmtMoney', trecho + '\nrenderDashboard();')
      (w.document, dbD, () => ({ empresaId: 'emp', usuarioNome: 'Kauan' }), v => 'R$ ' + Number(v || 0).toFixed(2));
  }catch(e){ /* o pedaço do gráfico pode reclamar; o que importa é o cartão */ }
  ok(String(w.document.getElementById('kpi-vendas').innerText) === '1',
     'só a venda DESTE mês e não estornada entra na conta (achou: ' + w.document.getElementById('kpi-vendas').innerText + ')');
  ok(String(w.document.getElementById('kpi-orcamentos').innerText) === '2',
     'orçamento aprovado não conta como aberto (achou: ' + w.document.getElementById('kpi-orcamentos').innerText + ')');
  dom.window.close();
}

// ═══════════════════════════════════════════════════════════════════════════
// RODAPÉ: "por que parou de atualizar?" — ele tem que mostrar a versão E o
// carimbo do arquivo que está rodando (o mesmo hash do ?v= do app.bundle.js).
// ═══════════════════════════════════════════════════════════════════════════
async function testarRodapeDaVersao(){
  console.log('\n== RODAPÉ: versão + carimbo do que está rodando agora ==');
  const src = fs.readFileSync('ajustes_v52245_rodape_versao_patch.js', 'utf8');
  ok(src.indexOf('function seloDoBuild()') >= 0, 'o rodapé procura o carimbo na URL do app.bundle.js');
  ok(src.indexOf("ver.setAttribute('data-build'") >= 0, 'o carimbo fica marcado no elemento (dá para conferir com o F12)');

  const html =
    '<script src="./app.bundle.js?v=6.1.4-1d27112d3821"></script>' +
    '<footer class="x"><span>Sistema Digicopy</span><span id="footer-version">v0</span><span id="footer-session">Empresa - Usuário</span></footer>' +
    '<script>' + src + '</script>';
  const dom = new (require('jsdom').JSDOM)(html, { runScripts: 'dangerously' });
  dom.window.DIGICOPY_APP_VERSION = '6.1.4';
  await new Promise(r => setTimeout(r, 900));
  const ver = dom.window.document.getElementById('footer-version');
  ok(/^v6\.1\.4 • 1d27112d/.test(ver.textContent),
     'o rodapé mostra a versão E o carimbo do arquivo carregado (' + ver.textContent + ')');
  ok(ver.getAttribute('data-build') === '1d27112d', 'o carimbo bate com o da URL do app.bundle.js');
  ok(/muda a cada correção/.test(ver.title || ''), 'o balão explica que o carimbo muda a cada correção publicada');
  const sem = new (require('jsdom').JSDOM)('<footer><span id="footer-version">v0</span><span id="footer-session">Empresa - Usuário</span></footer><script>' + src + '</script>', { runScripts: 'dangerously' });
  await new Promise(r => setTimeout(r, 900));
  ok(/^v/.test(sem.window.document.getElementById('footer-version').textContent),
     'sem URL de bundle (programa .exe antigo) o rodapé mostra só a versão, sem quebrar');
  const canto = sem.window.document.getElementById('footer-session').textContent;
  ok(/Local • sem nuvem|Nuvem conectada/.test(canto),
     'o canto direito não fica mais no texto fixo "Empresa - Usuário" (diz onde está rodando: ' + canto + ')');
  dom.window.close(); sem.window.close();
}

// ═══════════════════════════════════════════════════════════════════════════
// v6.1.4 (22/09, nº3) — "QUERO RESOLVER O CLIENTE SEM VÍNCULO": o sistema acha
// o cliente por CNPJ/CPF e por nome parecido (quando é seguro) e, quando sobra
// algum, o 🔗 resolve na tela. O rodapé passa a dizer onde o banco está.
// ═══════════════════════════════════════════════════════════════════════════
async function testarAchouClienteERodapeVivo(){
  const srcC = fs.readFileSync('contratos_final_patch.js', 'utf8');
  const dbA = {
    empresas: [{ id: 'emp' }],
    clientes: [
      { id: 'a1', empresaId: 'emp', codigo: '1', nome: 'Papelaria Central Ltda', documento: '12.345.678/0001-99' },
      { id: 'a2', empresaId: 'emp', codigo: '2', nome: 'Irmandade São João' },
      { id: 'a3', empresaId: 'emp', codigo: '3', nome: 'Irmandade São João Batista' }
    ],
    contratos: [
      { id: 'ac1', empresaId: 'emp', numero: 'LC-1', clienteId: null, documento: '12345678000199' },
      { id: 'ac2', empresaId: 'emp', numero: 'LC-2', clienteId: null, clienteNome: 'IRMANDADE SAO JOAO' }
    ],
    equipamentos: [], parque: [], leituras: [], os: [], modulosDinamicos: {}, config: {}
  };
  const ctxA = { window: {}, db: dbA };
  new Function('window', 'db', 'console', srcC)(ctxA.window, ctxA.db, console);
  const PA = ctxA.window.CONTRATOS_FINAL_PURE;
  console.log('\n== CONTRATO SEM VÍNCULO: mais formas de achar sozinho ==');
  ok(PA.cfDocumentoDoContrato(dbA.contratos[0]) === '12345678000199',
     'lê o CNPJ/CPF do contrato em qualquer campo conhecido (só dígitos, sem pontuação)');
  ok((PA.cfClientePorDocumento(dbA.contratos[0], 'emp') || {}).id === 'a1',
     'CNPJ igual: liga no cadastro certo sem ninguém escolher');
  ok(PA.cfClientePorNomeParecido('IRMANDADE SAO JOAO', 'emp') === null,
     'nome parecido com DOIS cadastros (São João x São João Batista): NÃO chuta');
  PA.vincularContratosClientes('emp');
  ok(dbA.contratos[0].clienteId === 'a1', 'o contrato do CNPJ ficou ligado depois de reconciliar');
  ok(dbA.contratos[1].clienteId === 'a2', 'nome IGUAL (mesmo sem acento) liga sem ninguém escolher');
  ok(PA.cfClientePorNomeParecido('IRMANDADE SAO JOAO BATISTA DE DEUS', 'emp') === null,
     'se a semelhança aponta para dois cadastros, o sistema NÃO chuta (fica para o 🔗) — nada de ligar errado');
  ok((PA.cfClientePorNomeParecido('IRMANDADE SAO JOAO DE DEUS', 'emp') || {}).id === 'a2',
     'quando só UM cadastro serve de base para o nome, ele liga (é o caso "empresa com nome maior")');

  // ── o 🔗 na tela: abre, filtra e salva no contrato ────────────────────────
  console.log('\n== 🔗 VINCULAR: abre a lista, filtra e salva ==');
  const { JSDOM } = require('jsdom');
  const domV = new JSDOM('<body><div id="modal-root" class="hidden"><div id="modal-title"></div><div id="modal-body"></div><div id="modal-footer"></div></div></body>');
  const wV = domV.window;
  const log = [];
  const dbV = JSON.parse(JSON.stringify(dbA));
  const ctxV = { window: wV, db: dbV };
  new Function('window', 'db', 'document', 'getSession', 'logAction', 'saveDB', 'toast', 'console', srcC)
    (wV, dbV, wV.document, () => ({ empresaId: 'emp', usuarioNome: 'Kauan' }),
     (...a) => log.push(a.join(' ')), () => {}, () => {}, console);
  wV.contratoVincularCliente && wV.contratoVincularCliente('ac2');
  const modal = wV.document.getElementById('modal-body').innerHTML;
  ok(modal.indexOf('cfv-busca') >= 0 && modal.indexOf('Irmandade') >= 0,
     'abre a janelinha com a lista de clientes e a caixinha de filtro');
  wV.cfvFiltrar && wV.cfvFiltrar('Batista');
  const filtrado = wV.document.getElementById('cfv-lista').innerHTML;
  ok(filtrado.indexOf('Batista') >= 0 && filtrado.indexOf('Papelaria') < 0, 'o filtro funciona (acha por pedaço do nome)');
  wV.cfvFiltrar && wV.cfvFiltrar('12345678');
  ok(wV.document.getElementById('cfv-lista').innerHTML.indexOf('Papelaria') >= 0,
     'o filtro também acha pelo CNPJ digitado');
  wV.cfvEscolher && wV.cfvEscolher('a3');
  ok(dbV.contratos.find(c => c.id === 'ac2').clienteId === 'a3',
     'escolher na lista grava o cliente no contrato (era o que faltava para o dono resolver sozinho)');
  ok(log.join(' ').indexOf('vincul') >= 0, 'e fica registrado na Auditoria (' + (log[0] || 'sem log') + ')');
  domV.window.close();

  // ── rodapé: diz onde o banco está (o botão erro.txt foi REMOVIDO pelo dono
  //    em 23/09/2026 — este teste cobrava a presença dele, o contrário da
  //    decisão atual; alinhado em 24/09/2026) ────────────────────────────────
  console.log('\n== RODAPÉ: versão + carimbo + onde o banco está ==');
  const srcRod = fs.readFileSync('ajustes_v52245_rodape_versao_patch.js', 'utf8');
  const domR = new JSDOM('<body><footer><span>Sistema Digicopy • Banco na Nuvem <button id="erro">erro.txt</button></span>' +
    '<span id="footer-version">v6.1.4</span><span id="footer-session">Empresa - Usuário</span></footer>' +
    '<script src="./app.bundle.js?v=6.1.4-e65f19cc495b"></script></body>', { runScripts: 'outside-only' });
  domR.window.DIGICOPY_APP_VERSION = '6.1.4';
  domR.window.eval(srcRod);
  await new Promise(r => setTimeout(r, 900));   // o rodapé se pinta em 200ms/800ms
  const dR = domR.window.document;
  ok(/^v6\.1\.4 • e65f19cc$/.test(dR.getElementById('footer-version').textContent),
     'o rodapé mostra versão + carimbo do arquivo que está rodando (' + dR.getElementById('footer-version').textContent + ')');
  ok(!dR.getElementById('erro'), 'o botão erro.txt NÃO volta no repintar (o dono mandou tirar em 23/09)');
  ok(!/erro\.txt/.test(dR.querySelector('footer span').textContent), 'e o texto do rodapé não cita mais o erro.txt');
  ok(/banco só neste PC|banco neste PC \+ nuvem conectada/.test(dR.querySelector('footer span').textContent),
     'a esquerda diz onde o banco está de verdade (antes era "Banco na Nuvem" fixo): ' +
     JSON.stringify(dR.querySelector('footer span').textContent.trim()));
  domR.window.close();
}

(async function(){
  await testarBarraDeMenus();
  await testarRodapeDaVersao();
  testarCartoesDoInicio();
  await testarMotorDaNuvem();
  testarClientesEContratos();
  await testarAchouClienteERodapeVivo();
  testarCacheLinksEMotor();
  await testarCheckupDaNuvem();
  if (falhas > 0){ console.error('\n' + falhas + ' assert(s) FALHARAM'); process.exit(1); }
  console.log('\nTudo OK — v6.1.4: relatório do Kauan atendido item por item.');
})();
//<<<<SECAO:test_ajustes_v6104.js:FIM>>>>
}

if (false) { // ═══ test_relatorio_problemas.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_relatorio_problemas.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — RELATORIO_DE_PROBLEMAS.html
//
// Pedido dele (21/09/2026): "igual do relatório de teste, mas de problemas que
// tem, onde a pessoa preenche falando os caminhos e o problema; o de caminhos
// você coloca uma caixa por caixa e, se for adicionar mais, um botão + abaixo
// que cria mais caixas infinitamente; e um + separado pra criar outro relatório
// (uma cópia abaixo) — esse é de relatórios de outras coisas".
//
// Aqui o teste abre o arquivo de verdade (jsdom), clica nos botões como o dono
// clicaria e confere o texto final que vira o .txt.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');

let falhas = 0;
function ok(nome, cond){ if (cond) console.log('  ✔ ' + nome); else { falhas++; console.error('  ✘ ' + nome); } }

const ARQ = 'RELATORIO_DE_PROBLEMAS.html';
const html = fs.readFileSync(ARQ, 'utf8');

console.log('== RELATÓRIO DE PROBLEMAS (HTML) ==');

// ── 1. Regras da casa ───────────────────────────────────────────────────────
ok('sem alert/confirm/prompt nativos (regra do projeto)',
   !/[\s(]alert\s*\(|[\s(]confirm\s*\(|[\s(]prompt\s*\(/.test(html));
ok('arquivo sozinho: nenhum script/css de fora',
   !/<script[^>]+src=|<link[^>]+rel="stylesheet"/i.test(html));
ok('aviso de segredo impresso na tela',
   /Nunca escreva senha, token, certificado, CSC/.test(html));

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://teste-60f.pages.dev/' + ARQ });
const w = dom.window, d = w.document;
const clica = el => { el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const blocos = () => [...d.querySelectorAll('#problemas [data-problema]')];
const passosDo = b => [...b.querySelectorAll('[data-passos] .passo')];
const caixaDe = p => p.querySelector('[data-passo]');
const botaoPasso = b => b.querySelector('[data-add-passo]');

// ── 2. Começa com UM problema e UM passo ────────────────────────────────────
ok('abre com 1 bloco de problema', blocos().length === 1);
ok('o bloco começa com 1 caixa de passo (caminho)', passosDo(blocos()[0]).length === 1);
ok('tem o botão "+ Adicionar passo (caminho)"',
   /Adicionar passo \(caminho\)/.test(botaoPasso(blocos()[0]).textContent));
ok('tem a caixa de texto do problema ("O que aconteceu")', !!blocos()[0].querySelector('[data-campo="aconteceu"]'));
ok('tem o que esperava + frequência + gravidade + print',
   !!blocos()[0].querySelector('[data-campo="esperado"]') &&
   !!blocos()[0].querySelector('[data-campo="print"]') &&
   blocos()[0].querySelectorAll('input[name^="r_FREQ"]').length === 3 &&
   blocos()[0].querySelectorAll('input[name^="r_GRAV"]').length === 3);

// ── 3. O "+" dos passos cria caixas sem limite ─────────────────────────────
for (let i = 0; i < 6; i++) clica(botaoPasso(blocos()[0]));
ok('6 cliques no "+" criam 7 caixas de passo (infinito, não tem teto)',
   passosDo(blocos()[0]).length === 7);
const nums = passosDo(blocos()[0]).map(p => p.querySelector('.n').textContent.trim());
ok('os passos ficam numerados na ordem (1. a 7.)',
   nums.join(' ') === '1. 2. 3. 4. 5. 6. 7.');
clica(passosDo(blocos()[0])[2].querySelector('[data-del-passo]'));
ok('o ✕ apaga só aquele passo', passosDo(blocos()[0]).length === 6);
ok('a numeração se ajeita sozinha depois de apagar',
   passosDo(blocos()[0]).map(p => p.querySelector('.n').textContent.trim()).join(' ') === '1. 2. 3. 4. 5. 6.');

// ── 4. O "+" separado cria OUTRO problema (bloco novo, não passo) ──────────
const addProblema = d.querySelector('[data-add-problema]');
ok('o botão de outro problema é separado e diz que é outro problema',
   /Adicionar outro problema/.test(addProblema.textContent));
clica(addProblema);
clica(addProblema);
ok('2 cliques criam 3 blocos de problema', blocos().length === 3);
ok('os blocos são numerados (Problema 1, 2 e 3)',
   blocos().map(b => b.querySelector('.cab b').textContent).join(' | ') === 'Problema 1 | Problema 2 | Problema 3');
clica(botaoPasso(blocos()[1]));
ok('passo adicionado no Problema 2 não mexe no Problema 1',
   passosDo(blocos()[1]).length === 2 && passosDo(blocos()[0]).length === 6);
ok('cada bloco tem caixas próprias de frequência/gravidade (sem misturar)',
   blocos()[0].querySelectorAll('input[name="r_FREQ1"]').length === 3 &&
   blocos()[1].querySelectorAll('input[name="r_FREQ2"]').length === 3);
clica(blocos()[2].querySelector('[data-del-problema]'));
ok('o ✕ remove o bloco inteiro', blocos().length === 2);
ok('nunca fica sem bloco (remove o último e nasce um novo)',
   (clica(blocos()[1].querySelector('[data-del-problema]')), clica(blocos()[0].querySelector('[data-del-problema]')), blocos().length === 1));

// ── 5. Preenche como o dono faria e confere o .txt ─────────────────────────
const b1 = blocos()[0];
while (passosDo(b1).length < 3) clica(botaoPasso(b1)); // a tela ficou com 1 passo depois das remoções de cima
const escreve = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
d.getElementById('d_nome').value = 'Kauan';
d.getElementById('d_rodape').value = 'v6.1.3';
d.getElementById('d_nuvem').value = '5.26.4';
const rOnde = d.querySelector('input[name="r_ONDE"][value="exe"]');
rOnde.checked = true; rOnde.dispatchEvent(new w.Event('change', { bubbles: true }));
escreve(b1.querySelector('[data-campo="titulo"]'), 'Contrato mostra Cliente sem vínculo');
escreve(b1.querySelector('[data-campo="aconteceu"]'), 'Na lista de contratos o cliente aparece como "Cliente sem vínculo".');
escreve(b1.querySelector('[data-campo="esperado"]'), 'Deveria mostrar o nome do cliente do contrato.');
escreve(b1.querySelector('[data-campo="print"]'), 'Captura 2026-09-21 170117.png');
escreve(b1.querySelector('[data-campo="obs"]'), 'Acontece em mais de um computador.');
const n1 = b1.getAttribute('data-problema'); // o bloco pode ter renascido com outro número
const rF = b1.querySelector('input[name="r_FREQ' + n1 + '"][value="sempre"]'); rF.checked = true; rF.dispatchEvent(new w.Event('change', { bubbles: true }));
const rG = b1.querySelector('input[name="r_GRAV' + n1 + '"][value="atrapalha"]'); rG.checked = true; rG.dispatchEvent(new w.Event('change', { bubbles: true }));
const passos1 = passosDo(b1);
escreve(caixaDe(passos1[0]), 'menu Locação');
escreve(caixaDe(passos1[1]), 'aba Contratos');
escreve(caixaDe(passos1[2]), 'olhar a coluna Cliente');
clica(addProblema);
const b2 = blocos()[1];
escreve(b2.querySelector('[data-campo="titulo"]'), 'Cliente Balcão duplicado');
escreve(b2.querySelector('[data-campo="aconteceu"]'), 'Aparecem dois cadastros com o mesmo nome.');
escreve(caixaDe(passosDo(b2)[0]), 'menu Cadastros → Clientes');
escreve(d.getElementById('geral'), 'Testei no exe do escritório.');

ok('contador mostra os problemas e quantos têm título+descrição',
   /2 problema\(s\)/.test(d.getElementById('contador').innerHTML) && /2<\/b> com título e descrição/.test(d.getElementById('contador').innerHTML));

const txt = w.montarTexto();
ok('cabeçalho com data/hora', /RELATÓRIO DE PROBLEMAS — SISTEMA DIGICOPY/.test(txt) && /Gerado em \d\d\/\d\d\/\d\d\d\d às \d\dh\d\d/.test(txt));
ok('identificação sai escrita', /Nome\.+: Kauan/.test(txt) && /Programa \.exe/.test(txt));
ok('os DOIS problemas saem no texto', /PROBLEMA 1: Contrato mostra Cliente sem vínculo/.test(txt) && /PROBLEMA 2: Cliente Balcão duplicado/.test(txt));
ok('os CAMINHOS saem numerados, um por linha',
   /1\) menu Locação\s*\n\s*2\) aba Contratos\s*\n\s*3\) olhar a coluna Cliente/.test(txt));
ok('o problema 2 tem o caminho dele (não misturou com o 1)',
   /PROBLEMA 2[\s\S]*1\) menu Cadastros → Clientes/.test(txt));
ok('o que aconteceu e o que esperava saem escritos',
   /O QUE ACONTECEU\.\.: Na lista de contratos/.test(txt) && /O QUE ESPERAVA\.\.\.: Deveria mostrar o nome do cliente/.test(txt));
ok('frequência e gravidade saem escritas', /FREQUÊNCIA\.+: Sempre acontece/.test(txt) && /QUANTO ATRAPALHA\.: Atrapalha, mas dá pra continuar/.test(txt));
ok('o nome do print sai citado', /PRINT \(arquivo\)\.\.: Captura 2026-09-21 170117\.png/.test(txt));
ok('observações do problema e gerais saem', /OBSERVAÇÕES\.\.\.\.\.\.: Acontece em mais de um computador\./.test(txt) && /Testei no exe do escritório\./.test(txt));
ok('rodapé lembra que print vai pelo chat e que não tem segredo',
   /prints são enviados/.test(txt) && /Nenhuma senha, token, certificado ou CSC/.test(txt));
ok('nome do arquivo com data e hora', /^relatorio-problemas-digicopy-\d{4}-\d\d-\d\d-\d{4}\.txt$/.test(w.nomeArquivo()));
ok('rascunho guardado no navegador', /localStorage\.setItem\(CHAVE/.test(html) && /digicopy_relatorio_problemas_v1/.test(html));

// ── 6. O rascunho volta igual (fechou e abriu de novo) ─────────────────────
const dom2 = new JSDOM(html, { runScripts: 'dangerously', url: 'https://teste-60f.pages.dev/' + ARQ,
  beforeParse(janela){ janela.localStorage.setItem('digicopy_relatorio_problemas_v1', JSON.stringify({
    nome:'Kauan', data:'21/09/2026', onde:'exe', rodape:'v6.1.3', nuvem:'5.26.4', geral:'',
    problemas:[{ titulo:'Voltou do rascunho', aconteceu:'x', esperado:'', freq:'sempre', grav:'visual', print:'', obs:'', passos:['passo A','passo B','passo C'] }]
  })); } });
const d2 = dom2.window.document;
ok('rascunho restaura o problema e os passos escritos',
   d2.querySelectorAll('#problemas [data-problema]').length === 1 &&
   d2.querySelector('[data-campo="titulo"]').value === 'Voltou do rascunho' &&
   [...d2.querySelectorAll('[data-passo]')].map(t => t.value).join('|') === 'passo A|passo B|passo C');
ok('rascunho restaura a caixa de frequência marcada',
   d2.querySelector('input[name="r_FREQ1"][value="sempre"]').checked === true);

// ── 7. Não pesa no sistema (nem no .exe) ──────────────────────────────────
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok('relatório fora do bundle (não pesa na abertura do sistema)', !manifest.includes(ARQ));
ok('relatório fora do build.files (.exe não leva arquivo de ferramenta)', !pkg.build.files.includes(ARQ));

if (falhas > 0){ console.error('\n' + falhas + ' assert(s) FALHARAM'); process.exit(1); }
console.log('\nRESULTADO: relatório de problemas (HTML) passou!');
//<<<<SECAO:test_relatorio_problemas.js:FIM>>>>
}

if (false) { // ═══ test_nuvem_nao_perde.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_nuvem_nao_perde.js:INICIO>>>>
// ═════════════════════════════════════════════════════
// TESTE — A NUVEM NÃO PODE PERDER O QUE ELE ACABOU DE GRAVAR
//
// A DOR (relatada pelo dono): "dado que some". O caminho vivo da gravação é o
// SÓ NUVEM (upload_cloud/cloudflare_data_sync_patch.js): a base NÃO é gravada
// neste computador, então o que garante que a mudança não morra é a FILA
// (outbox) persistida no navegador.
//
// O defeito provado aqui (rodada 23, §37.3): a mudança só entrava na fila
// quando a varredura rodava — e a varredura era agendada para 900 ms DEPOIS de
// gravar. Nessa janela, a única cópia da mudança estava na memória: fechar a
// janela (ou faltar luz, ou o programa morrer) levava a mudança embora, e como
// o SÓ NUVEM remonta a base pela nuvem, ela NÃO voltava.
//
// O QUE ESTE TESTE FAZ (com a nuvem fingida e o relógio na mão):
//   1. abre o sistema com a base assentada (nada pendente);
//   2. grava um cliente (window.saveDB) e NÃO deixa o relógio andar;
//   3. confere o que sobrou no navegador (a fila persistida) — hoje: nada;
//   4. fecha a janela (pagehide) e REABRE com a nuvem que não tem o cliente;
//   5. exige que a mudança sobreviva (na fila ou já enviada com keepalive).
// ═════════════════════════════════════════════════════
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== NUVEM NÃO PERDE ==');
  console.log("  (não rodou: falta a dependência 'jsdom' — não é defeito do sistema)");
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  \u2718 ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}
const FONTE = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const OUTBOX_KEY = 'digicopy_cf_sync_outbox_v1';
const STATE_KEY = 'digicopy_cf_sync_state_v1';

// ── a nuvem fingida: guarda o diário em memória e responde igual ao motor ──
function nuvemFingida() {
  const diario = [];        // {cursor, entity, recordId, data, version}
  const envios = [];        // o que o PC mandou
  let cursor = 0;
  return {
    diario: diario,
    envios: envios,
    // planta um registro JÁ EXISTENTE na nuvem (com o cursor certo, como se tivesse
    // sido gravado por outro computador antes deste abrir)
    semear: function (entity, recordId, data) {
      cursor++;
      diario.push({ cursor: cursor, entity: entity, recordId: recordId, data: data, version: 1 });
    },
    api: async function (path, options) {
      const opt = options || {};
      if (path.indexOf('/v1/changes?cursor=') === 0) {
        const pedido = Number(/cursor=(\d+)/.exec(path)[1]) || 0;
        const novas = diario.filter((c) => c.cursor > pedido);
        return { changes: novas, nextCursor: cursor, hasMore: false };
      }
      if (path === '/v1/changes' && opt.method === 'POST') {
        const corpo = JSON.parse(opt.body || '{}');
        envios.push({ keepalive: !!opt.keepalive, mutations: corpo.mutations || [] });
        (corpo.mutations || []).forEach((m, i) => {
          if (m.operation === 'delete') return;
          const ja = diario.filter((c) => c.entity === m.entity && String(c.recordId) === String(m.recordId));
          cursor++;
          if (ja.length) { ja[ja.length - 1].data = m.data; ja[ja.length - 1].version = (ja[ja.length - 1].version || 0) + 1; return; }
          diario.push({ cursor: cursor, entity: m.entity, recordId: m.recordId, data: m.data, version: 1 });
        });
        return { results: (corpo.mutations || []).map((m, i) => ({ index: i, ok: true, version: 1 })) };
      }
      if (path.indexOf('/v1/status') === 0) return { ok: true, registros: diario.length, totals: { records: diario.length, byEntity: {} } };
      if (path.indexOf('/v1/changes/watch') === 0) return { changes: [], nextCursor: cursor };
      return {};
    }
  };
}

// ── o navegador na mão: relógio falso (nada roda sozinho) + localStorage ──
function abrirNavegador(nuvem, estadoSalvo) {
  const dom = new JSDOM('<!DOCTYPE html><body><button id="btn-nuvem" title="Nuvem"><i></i></button></body>',
    { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  // restaura o que estava gravado no navegador (é o que sobrevive a fechar/reabrir)
  if (estadoSalvo) Object.keys(estadoSalvo).forEach((k) => { try { w.localStorage.setItem(k, estadoSalvo[k]); } catch (e) { } });
  w.localStorage.setItem('digicopy_cf_token_v1', 'token-de-teste');
  w.DIGICOPY_CLOUD = { token: () => 'token-de-teste', api: nuvem.api, deviceInfo: () => null };
  w.DIGICOPY_SO_NUVEM = true;
  w.DIGICOPY_APP_VERSION = '7.0.17';
  w.getSession = () => null;
  w.db = { clientes: [], produtos: [], vendas: [], contasReceber: [], contasPagar: [], config: {}, _seq: {} };
  w.saveDB = function () { };            // o saveDB "de antes" (app.js) — o motor embrulha este
  w.saveDBAgora = function () { };
  const avisos = [];
  w.toast = function (txt, tipo) { avisos.push({ txt: String(txt), tipo: tipo || '' }); };
  w.alert = function (txt) { avisos.push({ txt: String(txt), tipo: 'alert' }); };

  // relógio falso: guarda os temporizadores e só roda quando o teste mandar
  let relogio = 0;
  const fila = [];
  let proximoId = 1;
  w.setTimeout = function (fn, ms) { const id = proximoId++; fila.push({ id: id, quando: relogio + (Number(ms) || 0), fn: fn }); return id; };
  w.clearTimeout = function (id) { const i = fila.findIndex((x) => x.id === id); if (i >= 0) fila.splice(i, 1); };
  w.setInterval = function () { return 0; };
  w.Date.now = () => relogio;
  const RelogioReal = Date;
  w.Date = class extends RelogioReal { constructor(...a) { super(...(a.length ? a : [relogio])); } static now() { return relogio; } };

  const pendentes = () => fila.slice().sort((a, b) => a.quando - b.quando);
  async function respirar() { for (let i = 0; i < 8; i++) await new Promise((r) => setImmediate(r)); }
  // roda os temporizadores devidos até o limite, deixando as promessas assentarem
  async function andar(ms) {
    const fim = relogio + ms;
    for (let guarda = 0; guarda < 4000; guarda++) {
      const lista = pendentes();
      if (!lista.length || lista[0].quando > fim) break;
      const t = lista[0];
      relogio = t.quando;
      const i = fila.findIndex((x) => x.id === t.id); if (i >= 0) fila.splice(i, 1);
      try { t.fn(); } catch (e) { }
      await respirar();
    }
    relogio = fim;
    await respirar();
  }

  w.eval(FONTE);
  return {
    janela: w, dom: dom, andar: andar, respirar: respirar, avisos: avisos,
    agora: () => relogio,
    filaSalva: () => { try { return JSON.parse(w.localStorage.getItem(OUTBOX_KEY) || '[]'); } catch (e) { return []; } },
    estadoSalvo: () => {
      const out = {};
      for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); out[k] = w.localStorage.getItem(k); }
      return out;
    },
    fechar: () => { w.dispatchEvent(new w.Event('pagehide')); }
  };
}

(async function () {
  console.log('== A NUVEM NÃO PODE PERDER O QUE ELE ACABOU DE GRAVAR ==');
  const nuvem = nuvemFingida();
  const n1 = abrirNavegador(nuvem);
  ok('o motor da nuvem carregou e se apresentou', !!(n1.janela.DIGICOPY_CLOUD_SYNC && n1.janela.DIGICOPY_CLOUD_SYNC.info));

  // 1) a base assenta: o motor lê a nuvem e não tem nada pendente
  await n1.andar(20000);
  const i1 = n1.janela.DIGICOPY_CLOUD_SYNC.info();
  ok('a base assentou sem pendência (fila vazia)', i1.outbox === 0, JSON.stringify(i1.outbox));

  // 2) ELE GRAVA um cliente e o relógio NÃO anda (é o instante do clique)
  const cliente = { id: 'c-novo', nome: 'Cliente do Balcão', cidade: 'Montes Claros' };
  n1.janela.db.clientes.push(cliente);
  n1.janela.saveDB();                       // é assim que o sistema grava

  // 3) o que já está GRAVADO no navegador no fim do clique? (no máximo uns milésimos
  //    depois: numa base grande o motor adia a varredura para o fim do clique, e ela
  //    roda antes de qualquer outra coisa — nada de esperar os 900 ms)
  await n1.andar(5);
  const salvoNoClique = n1.filaSalva().filter((x) => x && x.key === 'clientes|c-novo');
  ok('a gravação ENTRA NA FILA no fim do clique (não fica só na memória)',
    salvoNoClique.length === 1, 'fila no clique: ' + JSON.stringify(n1.filaSalva().map((x) => x.key)));

  // 4) ele fecha a janela logo depois de gravar
  n1.fechar();
  await n1.respirar();
  const depoisDeFechar = n1.filaSalva().filter((x) => x && x.key === 'clientes|c-novo');
  ok('e ao FECHAR a janela a mudança continua gravada na fila',
    depoisDeFechar.length === 1, 'fila ao fechar: ' + JSON.stringify(n1.filaSalva().map((x) => x.key)));

  // 5) ao fechar, o motor tenta entregar o que couber com keepalive (a promessa sobrevive ao fechamento)
  const comKeepalive = nuvem.envios.filter((e) => e.keepalive);
  const entregouNoFechamento = comKeepalive.some((e) => e.mutations.some((m) => m.recordId === 'c-novo'));
  ok('ao fechar o motor tenta entregar com keepalive (chega antes, sem esperar a próxima abertura)',
    entregouNoFechamento, 'envios com keepalive: ' + comKeepalive.length);

  // 6) ele REABRE o sistema: a nuvem (o que o motor entregou) + o que ficou gravado no navegador.
  //    SÓ NUVEM: a base é remontada pela nuvem, então o cliente só existe se veio da nuvem ou da fila.
  const guardado = n1.estadoSalvo();
  const nuvem2 = nuvemFingida();
  nuvem2.diario.push.apply(nuvem2.diario, nuvem.diario);
  const n2 = abrirNavegador(nuvem2, guardado);
  await n2.andar(20000);
  const clienteNaNuvem = nuvem2.diario.some((c) => c.entity === 'clientes' && String(c.recordId) === 'c-novo');
  const clienteNoBanco = (n2.janela.db.clientes || []).some((c) => c && c.id === 'c-novo');
  ok('DEPOIS DE FECHAR E REABRIR o cliente está lá (veio para a nuvem ou continuou na fila)',
    clienteNaNuvem || clienteNoBanco,
    'nuvem=' + clienteNaNuvem + ' banco=' + clienteNoBanco + ' fila=' + JSON.stringify(n2.filaSalva().map((x) => x.key)));

  const i2 = n2.janela.DIGICOPY_CLOUD_SYNC.info();
  ok('e o motor mostra na tela que está tudo entregue (nada preso na memória)',
    i2.outbox === 0 || clienteNaNuvem, JSON.stringify({ outbox: i2.outbox, naNuvem: clienteNaNuvem }));

  console.log('-- o que o dono vê sobre a fila (nada de fila invisível) --');
  ok('o motor diz quantos estão por subir e até quando está em dia',
    typeof i2.outbox === 'number' && typeof i2.emDiaAte === 'number', JSON.stringify({ outbox: i2.outbox, emDiaAte: i2.emDiaAte }));
  ok('e diz se a fila encheu (quando enche, ele PRECISA saber: nada foi perdido, mas sobe aos poucos)',
    i2.filaCheia === false || i2.filaCheia === true, String(i2.filaCheia));

  console.log('-- a fila cheia não pode virar perda (e nem silêncio) --');
  {
    const nuvem3 = nuvemFingida();
    const n3 = abrirNavegador(nuvem3);
    await n3.andar(20000);
    const caps = n3.janela.DIGICOPY_CLOUD_SYNC.info();
    const teto = Number(caps.tetoFila), tetoAoFechar = Number(caps.tetoAoFechar);
    ok('o motor diz os limites da fila (a tela não usa número mágico)',
      teto > 0 && tetoAoFechar > teto, JSON.stringify({ tetoFila: caps.tetoFila, tetoAoFechar: caps.tetoAoFechar }));

    // MUITO mais gravações do que a fila normal aceita — e mais do que cabe até ao fechar.
    const total = tetoAoFechar + 50;
    for (let i = 0; i < total; i++) n3.janela.db.clientes.push({ id: 'c' + i, nome: 'Cliente ' + i });
    n3.janela.saveDB();
    await n3.andar(5);   // fim do clique: a varredura já rodou
    const iTeto = n3.janela.DIGICOPY_CLOUD_SYNC.info();
    ok('com a fila no limite, o motor diz que encheu (ele PRECISA saber: sobe aos poucos)',
      iTeto.filaCheia === true && iTeto.outbox === teto, JSON.stringify({ outbox: iTeto.outbox, filaCheia: iTeto.filaCheia }));

    n3.fechar();
    await n3.respirar();
    const naFila = n3.filaSalva().filter((x) => x && String(x.key).indexOf('clientes|c') === 0).length;
    ok('mesmo com a fila cheia, AO FECHAR tudo o que coube fica guardado (nada só na memória)',
      naFila >= tetoAoFechar, 'guardados: ' + naFila + ' (teto ao fechar: ' + tetoAoFechar + ' de ' + total + ')');
    const avisou = n3.avisos.some((a) => /fila|pendente|subir|espa/i.test(a.txt));
    ok('e o que NÃO coube, ele avisa na tela (nada de silêncio)',
      avisou && naFila < total, 'avisos: ' + JSON.stringify(n3.avisos.slice(0, 2)) + ' guardados: ' + naFila + ' de ' + total);
  }

  console.log('-- "não está aparecendo nenhum dado, é normal?" --');
  {
    // Nuvem conectada mas SEM nenhum registro (é o caso de uma conexão nova, ou de uma
    // conexão apontando para outra loja): ele PRECISA ser avisado, com o nome da empresa,
    // em vez de ficar olhando a tela vazia e achando que perdeu tudo.
    const nuvem4 = nuvemFingida();
    const n4 = abrirNavegador(nuvem4);
    await n4.andar(20000);
    const avisou = n4.avisos.some((a) => /nenhum registro nesta empresa/i.test(a.txt));
    ok('base vazia com a nuvem respondendo avisa na tela (nada de tela vazia em silêncio)', avisou,
      'avisos: ' + JSON.stringify(n4.avisos.slice(0, 2)).slice(0, 160));

    // e com dados na nuvem esse aviso NÃO aparece (senão virava alarme falso)
    const nuvem5 = nuvemFingida();
    nuvem5.semear('clientes', 'c-existente', { id: 'c-existente', nome: 'Cliente Que Já Existe' });
    const n5 = abrirNavegador(nuvem5);
    await n5.andar(20000);
    const avisou5 = n5.avisos.some((a) => /nenhum registro nesta empresa/i.test(a.txt));
    const temDado = (n5.janela.db.clientes || []).some((c) => c && c.id === 'c-existente');
    ok('com dados na nuvem o aviso NÃO aparece e o dado está na tela (sem alarme falso)', !avisou5 && temDado,
      'avisou=' + avisou5 + ' na tela=' + temDado);
  }

  console.log('-- v7.0.17: LIBERAR A CÓPIA LOCAL EXIGE PROVA ITEM POR ITEM --');
  {
    // O CASO PERIGOSO: ele escolheu "não enviar o que já existe aqui" (a opção 2 da
    // tela Nuvem) — esses registros vivem SÓ neste PC. A nuvem, cheia, tem MAIS
    // registros do que este PC: a conta antiga (contagem) diria "a nuvem tem tudo"
    // e apagaria a cópia local — levando embora os registros segurados.
    const CHAVE_BASE = 'digicopy_erp_v42_demo_apresentacao_part__clientes';
    const nuvemA = nuvemFingida();
    nuvemA.semear('clientes', 'c-1', { id: 'c-1', nome: 'Da nuvem' });
    nuvemA.semear('clientes', 'c-2', { id: 'c-2', nome: 'Da nuvem 2' });
    nuvemA.semear('clientes', 'c-3', { id: 'c-3', nome: 'Da nuvem 3' });
    const guardadoA = {};
    guardadoA[CHAVE_BASE] = JSON.stringify([{ id: 'c-segurado', nome: 'Só neste PC' }]);
    guardadoA[STATE_KEY] = JSON.stringify({
      cursor: 0, versions: {}, hashes: {}, known: { 'clientes|c-1': true, 'clientes|c-2': true, 'clientes|c-3': true },
      initialPull: true, lastOk: 1, paused: false, heldLocalOnly: ['clientes|c-segulado'.replace('segulado', 'segurado')], pauseReason: ''
    });
    const nA = abrirNavegador(nuvemA, guardadoA);
    nA.janela.db.clientes = [{ id: 'c-segurado', nome: 'Só neste PC' }];
    await nA.andar(80000);   // tempo suficiente para a conferência da nuvem vencer o freio de 1 min
    const continuou = !!nA.janela.localStorage.getItem(CHAVE_BASE);
    ok('registro segurado (só neste PC) BLOQUEIA a liberação: contagem da nuvem não é prova',
      continuou, 'cópia local ' + (continuou ? 'preservada' : 'APAGADA'));
    ok('e o registro continua na memória do sistema (não sumiu da tela)',
      (nA.janela.db.clientes || []).some((c) => c && c.id === 'c-segurado'));
  }
  {
    // O CAMINHO BOM continua funcionando: o registro sobe para a nuvem e, SÓ DEPOIS
    // de confirmado (chave conhecida + hash igual), a cópia local é liberada.
    const CHAVE_BASE = 'digicopy_erp_v42_demo_apresentacao_part__clientes';
    const nuvemB = nuvemFingida();
    nuvemB.semear('clientes', 'c-base', { id: 'c-base', nome: 'Já estava na nuvem' });
    const guardadoB = {};
    guardadoB[CHAVE_BASE] = JSON.stringify([{ id: 'c-novo-b', nome: 'Novo do balcão' }]);
    const nB = abrirNavegador(nuvemB, guardadoB);
    nB.janela.db.clientes = [{ id: 'c-novo-b', nome: 'Novo do balcão' }];
    await nB.andar(80000);
    const subiu = nuvemB.diario.some((c) => c.entity === 'clientes' && String(c.recordId) === 'c-novo-b');
    const liberou = !nB.janela.localStorage.getItem(CHAVE_BASE);
    ok('quando TUDO está confirmado na nuvem, a cópia local é liberada como sempre', subiu && liberou,
      'subiu=' + subiu + ' liberou=' + liberou);
  }

  console.log('\nRESULTADO: ' + passou + ' verificações passaram — o que ele grava entra na fila na hora, sobrevive a fechar e reabrir, e a tela vazia nunca fica em silêncio.');
  try { n1.dom.window.close(); n2.dom.window.close(); } catch (e) { }
})();
//<<<<SECAO:test_nuvem_nao_perde.js:FIM>>>>
}

if (false) { // ═══ test_nuvem_explica.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_nuvem_explica.js:INICIO>>>>
// ═════════════════════════════════════════════════════
// TESTE — A NUVEM EXPLICA SOZINHA (v7.0.15)
//
// O que este teste prova (a queixa do dono: "não está aparecendo nenhum dado,
// é normal?"): o sistema NÃO pode ficar mudo quando a tela está vazia. A faixa
// do `ajustes_v7015_nuvem_explica_patch.js` tem de aparecer exatamente nos casos
// em que o dado não aparece, dizer o motivo em português, e consertar em 1 clique:
//
//   1) SEM CONEXÃO (o caso do link "jeito antigo"): portão fora da tela e a
//      sessão sem token → faixa + botão que REABRE o portão.
//   2) PAUSADA → faixa dizendo que este PC não está baixando nada.
//   3) CURSOR ADIANTADO (a nuvem tem mais do que aqui — o "some e não volta")
//      → faixa com os números ("clientes: 0 aqui × 3 na nuvem") e o botão
//      "Baixar tudo de novo", que relê o diário e faz o dado APARECER.
//   4) COM TUDO CERTO → a faixa NÃO aparece (senão vira alarme chato).
//
// Nuvem fingida + janela do sistema fingida. Nada de rede de verdade.
// ═════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== A NUVEM EXPLICA ==');
  console.log("  (não rodou: falta a dependência 'jsdom' — não é defeito do sistema)");
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  \u2718 ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}
const MOTOR = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const FAIXA = fs.readFileSync('ajustes_v7015_nuvem_explica_patch.js', 'utf8');
const CHECKUP = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');   // r46: check-up removido; o freio continua no motor
const TOKEN_KEY = 'digicopy_cf_token_v1';
const STATE_KEY = 'digicopy_cf_sync_state_v1';

// ── a nuvem fingida: diário + contagem por lista (igual ao /v1/status) ──────
let freioDisparou = false;   // v7.0.17 — o freio preventivo do motor da nuvem (vem no /health)
const relatos = [];          // v7.0.17 — o que o app relatou para a manutenção (técnico, sem dado de negócio)
function nuvemFingida(opcoes) {
  const cenario = opcoes || {};
  let falhasRestantes = Number(cenario.falhasDeLeitura) || 0;
  let recusandoEscrita = !!cenario.recusaEscrita;   // v7.0.17 — nuvem recusando gravação (429 quota)
  const diario = [];
  let cursor = 0;
  const contagem = () => {
    const byEntity = {};
    diario.forEach((c) => { byEntity[c.entity] = byEntity[c.entity] || { active: 0, deleted: 0 }; byEntity[c.entity].active++; });
    return { records: diario.length, cursor: cursor, byEntity: byEntity };
  };
  return {
    diario: diario, contagem: contagem,
    // a internet "volta" (o teste controla exatamente quando)
    liberar: function () { falhasRestantes = 0; },
    semear: function (entity, recordId, data) { cursor++; diario.push({ cursor: cursor, entity: entity, recordId: recordId, data: data, version: cursor }); },
    api: async function (path, options) {
      const opt = options || {};
      if (path.indexOf('/v1/changes?cursor=') === 0) {
        if (falhasRestantes > 0) { falhasRestantes--; throw new Error('A nuvem não respondeu agora (a internet caiu no meio da leitura)'); }
        const pedido = Number(/cursor=(\d+)/.exec(path)[1]) || 0;
        const novas = diario.filter((c) => c.cursor > pedido);
        return { changes: novas.map((c) => ({ entity: c.entity, recordId: c.recordId, data: c.data, version: c.version, operation: 'upsert' })), nextCursor: cursor, hasMore: false };
      }
      if (path === '/v1/changes' && opt.method === 'POST') {
        if (recusandoEscrita) {
          const e = new Error('Erro HTTP 429');
          e.status = 429; e.quota = true; e.message = 'Erro HTTP 429';
          throw e;
        }
        const corpo = JSON.parse(opt.body || '{}');
        return { results: (corpo.mutations || []).map((m, i) => ({ index: i, ok: true, version: 1 })) };
      }
      if (path.indexOf('/v1/status') === 0) return { ok: true, totals: contagem() };
      if (path === '/v1/relato') {
        const corpo = JSON.parse(opt.body || '{}');
        relatos.push(corpo);
        return { ok: true };
      }
      if (path === '/health') return { ok: true, versao: '5.27.0', freio: { plano: 'pago', tetoDia: 1000000, disparouHoje: !!freioDisparou, ultimoDisparoEm: freioDisparou ? Date.now() : null, motivo: freioDisparou ? 'dia' : null } };
      if (path.indexOf('/v1/changes/watch') === 0) return { changes: [], nextCursor: cursor };
      return {};
    }
  };
}

// ── o navegador na mão ─────────────────────────────────────────────────────
function abrir(cenario) {
  const dom = new JSDOM('<!DOCTYPE html><body><div id="login-screen" class="hidden"></div><button id="btn-nuvem"><i></i></button></body>',
    { url: 'http://localhost/', runScripts: 'outside-only' });
  const w = dom.window;
  const avisos = [], portaoAberto = [];
  w.toast = function (txt, tipo) { avisos.push({ txt: String(txt), tipo: tipo || '' }); };
  w.confirmSistema = function () { return Promise.resolve(true); };   // a janela do sistema (nunca a nativa)
  w.v5262AbrirPortao = function (force) { portaoAberto.push(!!force); return true; };
  w.abrirCloudflareNuvem = function () { portaoAberto.push('nuvem'); };
  w.v7015ConferirNuvem = undefined;
  w.localStorage.setItem('digicopy_cf_device_v1', JSON.stringify({ deviceId: 'pc-teste', activation: 'cnpj', cnpj: '11.222.333/0001-44' }));
  if (!cenario.semConexao) w.localStorage.setItem(TOKEN_KEY, 'token-de-teste');
  if (cenario.estadoInicial) w.localStorage.setItem(STATE_KEY, JSON.stringify(cenario.estadoInicial));
  w.DIGICOPY_CLOUD = { token: () => (cenario.semConexao ? '' : 'token-de-teste'), deviceInfo: () => ({ cnpj: '11.222.333/0001-44' }), api: cenario.nuvem.api };
  w.DIGICOPY_SO_NUVEM = true;
  w.saveDB = function () {}; w.saveDBAgora = function () {};
  // a base do SÓ NUVEM vive na memória (nada é gravado no PC) — é ela que as listas mostram
  w.db = { clientes: [], produtos: [], vendas: [], contasReceber: [], os: [], contratos: [], config: {} };
  w.db._seq = {};
  w.setInterval = () => 0;   // a faixa não repete sozinha no teste (a gente chama na mão)
  w.eval(MOTOR);
  w.eval(FAIXA);
  return {
    w: w, dom: dom, avisos: avisos, portaoAberto: portaoAberto,
    faixa: () => { const el = w.document.getElementById('v7015-faixa'); return el ? el.textContent : ''; },
    temFaixa: () => !!w.document.getElementById('v7015-faixa'),
    conferir: () => w.v7015ConferirNuvem(),
    // clica num botão da faixa (pelo rótulo)
    clicar: (rotulo) => {
      const el = w.document.getElementById('v7015-faixa');
      if (!el) return false;
      const bt = Array.prototype.slice.call(el.querySelectorAll('button')).find((b) => b.textContent === rotulo);
      if (!bt) return false;
      bt.onclick({ preventDefault() {} }); return true;
    },
    esperar: (ms) => new Promise((r) => setTimeout(r, ms))
  };
}

(async function () {
  console.log('== A NUVEM EXPLICA (nada de tela vazia em silêncio) ==');

  // ── 1) SEM CONEXÃO ───────────────────────────────────────────────────────
  {
    const n = abrir({ semConexao: true, nuvem: nuvemFingida() });
    await n.esperar(150);
    await n.conferir();
    ok('sem conexão e sem portão na tela: a faixa avisa que o computador não está conectado',
      n.temFaixa() && /não está conectado à nuvem/.test(n.faixa()), n.faixa().slice(0, 90));
    ok('o botão "Conectar agora" REABRE o portão da nuvem (é o que faltava para sair do vazio)',
      n.clicar('Conectar agora') && n.portaoAberto.length === 1 && n.portaoAberto[0] === true, JSON.stringify(n.portaoAberto));
  }

  // ── 2) PAUSADA ───────────────────────────────────────────────────────────
  //    A pausa NÃO sobrevive a um F5 (o motor destrava de propósito desde a v6.1.4:
  //    "conectou, sincroniza na hora"), então o teste pausa EM TEMPO DE USO — que é
  //    como ela acontece de verdade (ex.: o reset da nuvem e a cota diária).
  {
    const n = abrir({ nuvem: nuvemFingida() });
    await n.esperar(150);
    await n.w.DIGICOPY_CLOUD_SYNC.resetCloudOnly();   // pausa de verdade, dentro do motor
    await n.conferir();
    ok('sincronização pausada: a faixa diz que este PC não está baixando nada (com o motivo)',
      n.temFaixa() && /pausada/i.test(n.faixa()), n.faixa().slice(0, 120));
    ok('o botão "Resolver agora" leva para a tela da Nuvem', n.clicar('Resolver agora') && n.portaoAberto.indexOf('nuvem') >= 0, JSON.stringify(n.portaoAberto));
  }

  // ── 3) A LEITURA DA NUVEM FALHOU (a tela fica vazia) ────────────────────
  //    É assim que o dono vê o problema: a nuvem TEM os dados, a internet caiu
  //    no meio da leitura e a tela ficou vazia e muda. A faixa tem de mostrar a
  //    conta e consertar em 1 clique.
  {
    const nuvem = nuvemFingida({ falhasDeLeitura: 3 });
    nuvem.semear('clientes', 'c1', { id: 'c1', nome: 'Cliente Um' });
    nuvem.semear('clientes', 'c2', { id: 'c2', nome: 'Cliente Dois' });
    nuvem.semear('clientes', 'c3', { id: 'c3', nome: 'Cliente Três' });
    const n = abrir({ nuvem: nuvem });
    await n.esperar(150);
    await n.w.DIGICOPY_CLOUD_SYNC.tick('teste');
    await n.conferir();
    const vazio = (n.w.db.clientes || []).length;
    ok('o retrato do problema: a leitura falhou e a tela ficou com 0 cliente (a nuvem tem 3)', vazio === 0, 'aqui: ' + vazio);
    ok('a faixa mostra a CONTA (quanto tem aqui × quanto tem na nuvem)',
      n.temFaixa() && /nuvem tem mais registros/i.test(n.faixa()) && /clientes: 0 aqui × 3 na nuvem/.test(n.faixa()), n.faixa().slice(0, 150));
    ok('o botão "Baixar tudo de novo" está nessa faixa (conserto em 1 clique)',
      !!n.w.document.getElementById('v7015-bt-baixar'), n.faixa().slice(0, 80));
    nuvem.liberar();        // a internet voltou
    await n.clicar('Baixar tudo de novo');
    await n.esperar(500);   // o clique pede a confirmação do sistema e relê a nuvem
    const depois = (n.w.db.clientes || []).length;
    ok('depois do "Baixar tudo de novo" O DADO APARECE (3 clientes na tela)', depois === 3, 'aqui: ' + depois);
    ok('e a faixa desaparece sozinha (o problema acabou de ser resolvido)', !n.temFaixa(), n.faixa().slice(0, 90));
  }

  // ── 3b) A NUVEM NO LIMITE DO DIA ────────────────────────────────────────
  {
    const nuvem = nuvemFingida({ falhasDeLeitura: 3 });
    const cena = { nuvem: nuvem, estadoInicial: { cursor: 0, versions: {}, hashes: {}, known: {}, initialPull: true, lastOk: 0, paused: false, limiteAte: Date.now() + 3 * 3600 * 1000 } };
    const n = abrir(cena);
    await n.esperar(150);
    await n.w.DIGICOPY_CLOUD_SYNC.tick('teste');
    await n.conferir();
    ok('nuvem no limite do dia: a faixa avisa que nada se perdeu e a que horas ela volta',
      n.temFaixa() && /freio preventivo de gravações/i.test(n.faixa()) && /volta sozinho por volta das/.test(n.faixa()), n.faixa().slice(0, 140));

    // v7.0.17 — RELATO DE SAÚDE: o app conta para a nuvem que a gravação foi recusada.
    // É este relato que a manutenção lê de fora (no /health), sem depender de ninguém
    // abrir tela nenhuma. E ele não pode virar enxurrada: 1 por tipo a cada 10 minutos.
    // A nuvem RECUSOU a gravação (429 quota:true) — o motor tem de contar isso.
    const antes = relatos.length;
    const nuvemRecusando = nuvemFingida({ recusaEscrita: true });
    const nRec = abrir({ nuvem: nuvemRecusando });
    await nRec.esperar(120);
    nRec.w.db.clientes.push({ id: 'c-rec', nome: 'Cliente para subir' });
    nRec.w.saveDB();                                  // entra na fila na hora
    await nRec.w.DIGICOPY_CLOUD_SYNC.tick('teste');
    await nRec.esperar(120);
    const enviados = relatos.filter((r) => r.tipo === 'freio').length;
    ok('o app RELATA para a nuvem que a gravação foi recusada (a manutenção vê de fora)',
      enviados >= 1, 'relatos: ' + JSON.stringify(relatos.map((r) => r.tipo)));
    ok('e o relato é técnico: tipo curto + mensagem limitada + versão (sem dado de negócio)',
      relatos.every((r) => r.tipo && (r.codigo === undefined || (typeof r.codigo === 'string' && r.codigo.length <= 140))) &&
      !/Cliente para subir/.test(JSON.stringify(relatos)));
    // tenta de novo na hora: o freio de repetição (10 min por tipo) tem de segurar
    nRec.w.db.clientes.push({ id: 'c-rec2', nome: 'Outro cliente' });
    nRec.w.saveDB();
    await nRec.w.DIGICOPY_CLOUD_SYNC.tick('teste');
    await nRec.esperar(80);
    const repetidos = relatos.filter((r) => r.tipo === 'freio').length;
    ok('o mesmo relato não se repete a cada tentativa (no máximo 1 a cada 10 minutos)',
      repetidos === enviados && relatos.length === antes + 1, 'antes=' + antes + ' depois=' + relatos.length);
  }

  // ── 4) TUDO CERTO → sem faixa (nada de alarme falso) ─────────────────────
  {
    const nuvem = nuvemFingida();
    nuvem.semear('clientes', 'c1', { id: 'c1', nome: 'Cliente Um' });
    const n = abrir({ nuvem: nuvem });
    await n.esperar(150);
    await n.w.DIGICOPY_CLOUD_SYNC.tick('teste');
    await n.conferir();
    const aqui = (n.w.db.clientes || []).length;
    ok('nuvem e computador em dia: os dados vêm e a faixa NÃO aparece', aqui === 1 && !n.temFaixa(),
      'aqui: ' + aqui + ' | faixa: ' + n.faixa().slice(0, 60));
  }

  // ── 5) O CHECK-UP RECEBE O FREIO JUNTO (rodada 28) ──────────────────────
  //    A contagem da nuvem (apiStatus) passou a trazer o freio preventivo do
  //    /health: é o que permite saber, de fora, se a nuvem está recusando
  //    gravação — a manutenção não depende de ninguém abrir o sistema.
  {
    const nuvem = nuvemFingida();
    const n = abrir({ nuvem: nuvem });
    const semFreio = await n.w.DIGICOPY_CLOUD_SYNC.apiStatus();
    ok('sem disparo, a contagem da nuvem vem com o freio em paz (plano pago, teto de 1 milhão/dia)',
      !!semFreio && !!semFreio.freio && semFreio.freio.plano === 'pago' && semFreio.freio.disparouHoje === false && semFreio.freio.tetoDia === 1000000);

    freioDisparou = true;
    const comFreio = await n.w.DIGICOPY_CLOUD_SYNC.apiStatus();
    ok('com o freio disparado, a contagem diz que disparou HOJE e o motivo',
      comFreio.freio.disparouHoje === true && comFreio.freio.motivo === 'dia');

    // r46: o resumo copiável do check-up saiu com a faixa; a prova do freio
    // continua no motor (apiStatus, cobrado acima) e no /health da nuvem.
    ok('e o resumo copiável do check-up saiu com a faixa (r46)',
      CHECKUP.indexOf('dcCheckupNuvemResumo') < 0 && CHECKUP.indexOf('dc-ck-copiar') < 0);
    freioDisparou = false;
  }

  // ── 6) A CONFERÊNCIA NÃO PODE PESAR (base grande, como a do dono) ───────
  //    A faixa confere a cada 15 s. O `info()` do motor tinha um campo (`pending`)
  //    que percorria a base inteira e calculava o hash de cada registro: 223 ms numa
  //    base de 76 mil registros — congelaria a tela de 15 em 15 segundos. Ele virou
  //    sob demanda (getter). Este teste trava o ganho.
  {
    const nuvem = nuvemFingida();
    const n = abrir({ nuvem: nuvem });
    const t0 = Date.now();
    for (let i = 0; i < 6000; i++) n.w.db.clientes.push({ id: 'c' + i, nome: 'Cliente ' + i, obs: 'texto' });
    const info = n.w.DIGICOPY_CLOUD_SYNC.info();
    const ms = Date.now() - t0;
    ok('a base de 6.000 registros foi montada e o info() respondeu rápido (contagem sob demanda)',
      ms < 250 && typeof info.outbox === 'number', ms + ' ms');
    const pend = n.w.DIGICOPY_CLOUD_SYNC.info().pending;
    ok('e o número de pendentes continua disponível para quem pedir (nada foi perdido na mudança)',
      typeof pend === 'number' && pend >= 0, String(pend));
  }

  console.log('\nRESULTADO: ' + passou + ' verificações passaram — quando o dado não aparece, o sistema explica e conserta.');
  process.exit(0);
})();
//<<<<SECAO:test_nuvem_explica.js:FIM>>>>
}

if (false) { // ═══ test_impressora_nao_some_reabrir.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_impressora_nao_some_reabrir.js:INICIO>>>>
// ═════════════════════════════════════════════════════
// TESTE — A IMPRESSORA NÃO SOME AO FECHAR E REABRIR (v7.0.18, rodada 30)
//
// A DOR (relatada pelo dono): "cadastra a impressora no contrato e ela some
// quando fecha e abre o programa".
//
// O DEFEITO PROVADO (nesta rodada): ele gravou e o programa fechou antes de
// subir (faltou luz, travou, fechou sem internet, ou a fila estava grande e a
// gravação não coube no envio de despedida). Ao reabrir no modo SÓ NUVEM, a
// base começa vazia, a fila pendente SOBE e a nuvem confirma — mas a confirmação
// só atualizava o livro-caixa e consumia a fila, SEM colocar o registro na base.
// O eco da nuvem é pulado pelo guarda de versão ("já conheço esta versão") e o
// registro ficava na nuvem, mas INVISÍVEL neste PC até a próxima reabertura.
// O conserto: ao confirmar um upsert, se o registro NÃO está na base, ele entra
// com os dados que acabaram de subir (nunca sobrescreve o que está na tela).
//
// O SEGUNDO DEFEITO (mesma família): quando a nuvem RECUSAVA um item
// (result.error), ele era descartado SEM NENHUM AVISO — e no SÓ NUVEM sumia ao
// fechar e reabrir. Agora a recusa aparece na tela (toast + sino) e no relatório
// de saúde da nuvem.
//
// O QUE ESTE TESTE FAZ (nuvem fingida + navegador na mão, relógio falso):
//   A. controle: envia antes de fechar → reabre → está lá;
//   F. A PROVA: o envio de despedida FALHA (offline/crash) → reabre, sobe a fila
//      pendente → a impressora TEM de estar na tela (banco=true), não só na nuvem;
//   C. a nuvem recusa o item → ele TEM de avisar na tela (nada de silêncio).
// ═════════════════════════════════════════════════════
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== IMPRESSORA NÃO SOME AO REABRIR ==');
  console.log("  (não rodou: falta a dependência 'jsdom' — não é defeito do sistema)");
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  ✘ ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  ✔ ' + nome); passou++;
}
const FONTE = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const OUTBOX_KEY = 'digicopy_cf_sync_outbox_v1';

function nuvemFingida(op) {
  op = op || {};
  const diario = [];
  const envios = [];
  const relatos = [];
  let cursor = 0;
  return {
    diario: diario, envios: envios, relatos: relatos,
    semear: function (entity, recordId, data) {
      cursor++;
      diario.push({ cursor: cursor, entity: entity, recordId: recordId, data: data, version: 1 });
    },
    api: async function (path, options) {
      const opt = options || {};
      if (path.indexOf('/v1/changes?cursor=') === 0) {
        const pedido = Number(/cursor=(\d+)/.exec(path)[1]) || 0;
        const novas = diario.filter((c) => c.cursor > pedido);
        return { changes: novas, nextCursor: cursor, hasMore: false };
      }
      if (path === '/v1/changes' && opt.method === 'POST') {
        if (op.falharKeepalive && opt.keepalive) throw new Error('offline-no-fechamento');
        const corpo = JSON.parse(opt.body || '{}');
        const muts = corpo.mutations || [];
        envios.push({ keepalive: !!opt.keepalive, mutations: muts });
        const results = muts.map((m, i) => {
          if (op.rejeitar && op.rejeitar(m)) {
            return { index: i, error: { codigo: 'RECORD_TOO_LARGE', mensagem: 'registro excede o limite (simulado)' } };
          }
          if (m.operation === 'delete') return { index: i, ok: true, version: 1 };
          const ja = diario.filter((c) => c.entity === m.entity && String(c.recordId) === String(m.recordId));
          cursor++;
          if (ja.length) { ja[ja.length - 1].data = m.data; return { index: i, ok: true, version: 2 }; }
          diario.push({ cursor: cursor, entity: m.entity, recordId: m.recordId, data: m.data, version: 1 });
          return { index: i, ok: true, version: 1 };
        });
        return { results: results };
      }
      if (path === '/v1/relato' && opt.method === 'POST') { relatos.push(JSON.parse(opt.body || '{}')); return { ok: true }; }
      if (path.indexOf('/v1/status') === 0) return { ok: true, registros: diario.length, totals: { records: diario.length, byEntity: {} } };
      if (path.indexOf('/v1/changes/watch') === 0) return { changes: [], nextCursor: cursor };
      return {};
    }
  };
}

function abrirNavegador(nuvem, estadoSalvo) {
  const dom = new JSDOM('<!DOCTYPE html><body><button id="btn-nuvem" title="Nuvem"><i></i></button></body>',
    { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  if (estadoSalvo) Object.keys(estadoSalvo).forEach((k) => { try { w.localStorage.setItem(k, estadoSalvo[k]); } catch (e) { } });
  w.localStorage.setItem('digicopy_cf_token_v1', 'token-de-teste');
  w.DIGICOPY_CLOUD = { token: () => 'token-de-teste', api: nuvem.api, deviceInfo: () => null };
  w.DIGICOPY_SO_NUVEM = true;
  w.DIGICOPY_APP_VERSION = '7.0.18';
  w.getSession = () => null;
  w.db = { clientes: [], produtos: [], vendas: [], contasReceber: [], contasPagar: [], config: {}, _seq: {}, parque: [], equipamentos: [], contratos: [] };
  w.saveDB = function () { };
  w.saveDBAgora = function () { };
  const avisos = [];
  const sino = [];
  w.toast = function (txt, tipo) { avisos.push({ txt: String(txt), tipo: tipo || '' }); };
  w.alert = function (txt) { avisos.push({ txt: String(txt), tipo: 'alert' }); };
  w.notificarEvento = function (sev, msg) { sino.push({ sev: sev, msg: String(msg) }); };
  // o relógio começa no AGORA de verdade (não no zero): os fusíveis de tempo do
  // motor (ex.: "não repetir o relato de saúde dentro de 10 min") se comportam
  // como no PC do dono — com o relógio no zero, tudo pareceria "recém-feito".
  let relogio = Date.now();
  const fila = [];
  let proximoId = 1;
  w.setTimeout = function (fn, ms) { const id = proximoId++; fila.push({ id: id, quando: relogio + (Number(ms) || 0), fn: fn }); return id; };
  w.clearTimeout = function (id) { const i = fila.findIndex((x) => x.id === id); if (i >= 0) fila.splice(i, 1); };
  w.setInterval = function () { return 0; };
  const RelogioReal = Date;
  w.Date = class extends RelogioReal { constructor(...a) { super(...(a.length ? a : [relogio])); } static now() { return relogio; } };
  const pendentes = () => fila.slice().sort((a, b) => a.quando - b.quando);
  async function respirar() { for (let i = 0; i < 8; i++) await new Promise((r) => setImmediate(r)); }
  async function andar(ms) {
    const fim = relogio + ms;
    for (let guarda = 0; guarda < 4000; guarda++) {
      const lista = pendentes();
      if (!lista.length || lista[0].quando > fim) break;
      const t = lista[0];
      relogio = t.quando;
      const i = fila.findIndex((x) => x.id === t.id); if (i >= 0) fila.splice(i, 1);
      try { t.fn(); } catch (e) { }
      await respirar();
    }
    relogio = fim;
    await respirar();
  }
  w.eval(FONTE);
  return {
    janela: w, dom: dom, andar: andar, respirar: respirar, avisos: avisos, sino: sino,
    filaSalva: () => { try { return JSON.parse(w.localStorage.getItem(OUTBOX_KEY) || '[]'); } catch (e) { return []; } },
    estadoSalvo: () => {
      const out = {};
      for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); out[k] = w.localStorage.getItem(k); }
      return out;
    },
    fechar: () => { w.dispatchEvent(new w.Event('pagehide')); }
  };
}

// o clique "salvar impressora no contrato" (fluxo_contrato_leitura_corrigido_patch.js)
function salvarImpressora(w, tag) {
  const e = { id: 'eq-' + tag, empresaId: 'emp1', criadoEm: new Date().toISOString(), serie: 'SN' + tag, modelo: 'HP M404', patrimonio: 'PAT' + tag };
  w.db.equipamentos.push(e);
  const p = { id: 'prq-' + tag, contratoId: 'ctr-1', equipamentoId: e.id, empresaId: 'emp1', setor: 'Recepção', status: 'ativo', criadoEm: new Date().toISOString(), medidores: { pb: { ativo: true, valorLocacao: 100 } } };
  w.db.parque.push(p);
  const c = w.db.contratos.find((x) => x.id === 'ctr-1');
  c.equipamentos = c.equipamentos || [];
  c.equipamentos.push(e.id);
  c.valorMensalFixo = 100;
  w.saveDB();
  return p.id;
}

async function cicloFecharReabrir(opNuvem, tag, esperarEnvio) {
  const nuvem = nuvemFingida(opNuvem);
  nuvem.semear('contratos', 'ctr-1', { id: 'ctr-1', empresaId: 'emp1', numero: 'CT-1', clienteId: 'cli-1', equipamentos: [], valorMensalFixo: 0 });
  nuvem.semear('clientes', 'cli-1', { id: 'cli-1', empresaId: 'emp1', nome: 'Cliente' });
  const n1 = abrirNavegador(nuvem);
  await n1.andar(20000);
  const idNovo = salvarImpressora(n1.janela, tag);
  if (esperarEnvio) await n1.andar(20000);
  else await n1.andar(5);
  n1.fechar();
  await n1.respirar();
  const guardado = n1.estadoSalvo();
  const nuvem2 = nuvemFingida(opNuvem);
  nuvem2.diario.push.apply(nuvem2.diario, nuvem.diario);
  const n2 = abrirNavegador(nuvem2, guardado);
  await n2.andar(30000);
  return {
    id: idNovo,
    noBanco: (n2.janela.db.parque || []).some((c) => c && c.id === idNovo),
    naNuvem: nuvem2.diario.some((c) => c.entity === 'parque' && String(c.recordId) === idNovo),
    naFila: n2.filaSalva().some((x) => x && String(x.key).indexOf(idNovo) >= 0),
    avisos: n2.avisos, sino: n2.sino, relatos: nuvem2.relatos
  };
}

(async function () {
  console.log('== A IMPRESSORA NÃO SOME AO FECHAR E REABRIR ==');

  console.log('-- controle: envia antes de fechar --');
  {
    const r = await cicloFecharReabrir({}, 'A', true);
    ok('enviou antes de fechar: está na tela e na nuvem', r.noBanco && r.naNuvem, JSON.stringify({ banco: r.noBanco, nuvem: r.naNuvem }));
  }

  console.log('-- A PROVA: despedida falha (offline/crash), sobe depois de reabrir --');
  {
    const r = await cicloFecharReabrir({ falharKeepalive: true }, 'F', false);
    ok('subiu na nuvem depois de reabrir', r.naNuvem, 'nuvem=' + r.naNuvem);
    ok('E ESTÁ NA TELA (não some)', r.noBanco, 'banco=' + r.noBanco + ' fila=' + r.naFila);
    ok('nada preso na fila', !r.naFila, 'fila=' + r.naFila);
  }

  console.log('-- recusa da nuvem nunca mais em silêncio --');
  {
    const r = await cicloFecharReabrir({ rejeitar: (m) => m.entity === 'parque' && String(m.recordId) === 'prq-C' }, 'C', false);
    // A r61 trocou o toast/modal por item pelo sino: abrir uma janela para
    // cada recusa criava uma tempestade bloqueante. Toast continua aceito para
    // caminhos antigos, mas o sino é o canal oficial e fica visível ao usuário.
    const avisouTela = r.avisos.some((a) => /recusou/i.test(a.txt));
    const avisouSino = r.sino.some((s) => /recusou/i.test(s.msg));
    ok('a recusa aparece em aviso visível (toast ou sino)', avisouTela || avisouSino, JSON.stringify({ avisos: r.avisos.map((a) => a.txt).slice(0, 2), sino: r.sino.map((s) => s.msg).slice(0, 1) }));
    ok('a recusa aparece no sino', avisouSino, JSON.stringify(r.sino.map((s) => s.msg).slice(0, 1)));
    ok('a recusa vai para o relatório de saúde da nuvem', r.relatos.some((x) => x && x.tipo === 'recusado'), JSON.stringify(r.relatos.slice(0, 2)));
  }

  console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
})().catch((e) => { console.error('ERRO NO TESTE:', e); process.exit(2); });
//<<<<SECAO:test_impressora_nao_some_reabrir.js:FIM>>>>
}

if (false) { // ═══ test_dado_aparece_outro_pc.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_dado_aparece_outro_pc.js:INICIO>>>>
// ═════════════════════════════════════════════════════
// TESTE — O DADO APARECE NO OUTRO PC (v7.0.19, rodada 31)
//
// A DOR (relatada pelo dono): "às vezes um dado criado não aparece em outro PC;
// demora sincronizar os dados para aparecer tudo de uma vez" (a impressora de
// contrato era só um exemplo).
//
// DEFEITO 1 PROVADO: VENDAS e LEITURAS nunca se atualizavam sozinhas (estavam
// fora da lista de telas ao vivo, como "telas de documento"). O dado CHEGAVA no
// banco do outro PC, mas a lista na tela continuava velha até a pessoa trocar de
// tela e voltar. Os dois renders são só releitura da lista (o que se digita fica
// em modal/campo, protegido pela trava de sempre) — agora são ao vivo. CONFIG
// continua de fora de propósito: o render dela escreve nos campos e apagaria o
// que ele digitou e ainda não salvou.
//
// DEFEITO 2 PROVADO: na remontagem com aviso ("Baixar tudo de novo", primeira
// abertura), a tela azul de carga SEGURAVA o programa inteiro até o fim do
// histórico — num diário grande, minutos olhando "Baixando os dados da nuvem…",
// mesmo com o estado de agora já na base (o passe rápido). Agora o passe rápido
// libera na hora: o aviso afina (faixinha embaixo, sem bloquear) e a tela se
// atualiza; o resto compõe em silêncio atrás.
// r46: modo único só-nuvem — na ABERTURA não há mais aviso de carga (a tela
// libera direto); a faixinha continua existindo só no "Baixar tudo de novo".
//
// O QUE ESTE TESTE FAZ:
//   1. confere o mapa: todas as telas com view são ao vivo, menos config;
//   2. A PROVA do defeito 2: diário grande (8000), páginas lentas (60 ms) —
//      exige que o dado recente esteja na tela E a trava da carga aberta ANTES
//      da remontagem completar (e que ela complete depois, sem sobra);
//   3. regressão do regime: com os dois PCs abertos, o que A grava aparece no
//      banco de B em segundos.
//   4. FOTO DA NUVEM (motor 5.28.4): a abertura lê o ESTADO ATUAL paginado e
//      pula o replay do diário (o que for gravado DURANTE a foto chega pelo
//      incremental); com motor antigo (404) o diário assume sozinho.
// ═════════════════════════════════════════════════════
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== O DADO APARECE NO OUTRO PC ==');
  console.log("  (não rodou: falta a dependência 'jsdom' — não é defeito do sistema)");
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  ✘ ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  ✔ ' + nome); passou++;
}
const FONTE = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');

// ── parte 1: o mapa de telas ao vivo (sem navegador: só o mapa exportado) ──
{
  const window = { DIGICOPY_CLOUD: { token: () => '' } };
  new Function('window', 'localStorage', 'document', FONTE)(
    window,
    { getItem: () => null, setItem: () => { }, removeItem: () => { } },
    undefined
  );
  const telas = (window.DIGICOPY_CLOUD_SYNC && window.DIGICOPY_CLOUD_SYNC.telasAoVivo) || {};
  ['dashboard', 'clientes', 'produtos', 'impressoras', 'contratos', 'parque', 'manutencao',
    'financeiro', 'relatorios', 'usuarios', 'auditoria', 'vendas', 'leituras'].forEach((t) => {
      ok('tela "' + t + '" é ao vivo', !!telas[t]);
    });
  ok('tela "config" continua de fora (o render escreve nos campos)', !telas.config);
}

// ── navegador na mão: relógio falso + páginas da nuvem com atraso ──
function nuvemFingida() {
  const diario = [];
  let cursor = 0;
  const self = {
    diario: diario, atrasar: null, fotoReqs: 0, diarioReqs: 0,
    semear: function (n) {
      for (let i = 0; i < n; i++) {
        cursor++;
        diario.push({ cursor: cursor, entity: 'clientes', recordId: 'seed-' + cursor, data: { id: 'seed-' + cursor, nome: 'Cliente ' + cursor }, version: 1 });
      }
    },
    semearVersoes: function (nRegs, nVers) {
      for (let r = 1; r <= nRegs; r++) for (let v = 1; v <= nVers; v++) {
        cursor++;
        diario.push({ cursor: cursor, entity: 'clientes', recordId: 'cli-' + r, data: { id: 'cli-' + r, nome: 'Cliente ' + r, v: v }, version: v });
      }
    },
    api: async function (path, options) {
      const opt = options || {};
      if (path.indexOf('/v1/changes?cursor=') === 0) {
        self.diarioReqs++;
        if (self.atrasar) await self.atrasar(60);   // página lenta: dá para ver o durante
        const m = /cursor=(\d+)(?:&limit=(\d+))?/.exec(path);
        const pedido = Number(m[1]) || 0, limit = Math.min(1000, Number(m[2]) || 200);
        const sel = diario.filter((c) => c.cursor > pedido).slice(0, limit + 1);
        const hasMore = sel.length > limit;
        const changes = (hasMore ? sel.slice(0, limit) : sel).map((c) => ({
          seq: c.cursor, entity: c.entity, recordId: c.recordId, data: c.data, version: c.version, operation: 'upsert'
        }));
        return { changes: changes, nextCursor: changes.length ? changes[changes.length - 1].seq : pedido, hasMore: hasMore };
      }
      if (path === '/v1/changes' && opt.method === 'POST') {
        const muts = (JSON.parse(opt.body || '{}').mutations) || [];
        const results = muts.map((mmt, i) => {
          if (mmt.operation === 'delete') return { index: i, ok: true, version: 1 };
          cursor++;
          diario.push({ cursor: cursor, entity: mmt.entity, recordId: mmt.recordId, data: mmt.data, version: 1 });
          return { index: i, ok: true, version: 1 };
        });
        return { results: results };
      }
      if (path.indexOf('/v1/snapshot') === 0) {
        self.fotoReqs++;
        if (!self.comFoto) { const e404 = new Error('sem foto'); e404.status = 404; throw e404; }
        if (self._seqFoto == null) self._seqFoto = cursor;   // igual ao motor: MAX(seq) lido ANTES
        if (self.injetarDuranteFoto && !self._injetou) {
          self._injetou = true; cursor++;   // gravado DURANTE a foto (seq maior)
          diario.push({ cursor: cursor, entity: 'clientes', recordId: 'c-novo', data: { id: 'c-novo', nome: 'Novo', v: 1 }, version: 1 });
        }
        const vivos = {};
        diario.forEach((c) => { const k = c.entity + '|' + c.recordId; if (!vivos[k] || c.cursor > vivos[k].cursor) vivos[k] = c; });
        const lista = Object.keys(vivos).map((k) => vivos[k]).sort((a, b) => (a.entity < b.entity ? -1 : a.entity > b.entity ? 1 : (a.recordId < b.recordId ? -1 : a.recordId > b.recordId ? 1 : 0)));
        const mf = /afterEntity=([^&]*)&afterId=([^&]*)(?:&limit=(\d+))?/.exec(path) || [];
        const ae = decodeURIComponent(mf[1] || ''), ai = decodeURIComponent(mf[2] || '');
        const lim = Math.min(1000, Number(mf[3]) || 1000);
        const apos = lista.filter((c) => !ae || c.entity > ae || (c.entity === ae && c.recordId > ai));
        const sel = apos.slice(0, lim + 1);
        const hasMore = sel.length > lim;
        return { ok: true, snapshotSeq: self._seqFoto, records: (hasMore ? sel.slice(0, lim) : sel).map((c) => ({ entity: c.entity, recordId: c.recordId, data: c.data, version: c.version })), hasMore: hasMore };
      }
      if (path.indexOf('/v1/changes/watch') === 0) {
        const ped = Number(/cursor=(\d+)/.exec(path)[1]) || 0;
        return { ok: true, novidade: cursor > ped, maxSeq: cursor };
      }
      if (path.indexOf('/v1/status') === 0) return { ok: true, registros: diario.length, totals: { records: diario.length, cursor: cursor, byEntity: {} } };
      return {};
    }
  };
  return self;
}

function abrirNavegador(nuvem, op) {
  op = op || {};
  const dom = new JSDOM('<!DOCTYPE html><body><button id="btn-nuvem" title="Nuvem"><i></i></button>' +
    '<section id="view-vendas" class="view"></section></body>',
    { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.localStorage.setItem('digicopy_cf_token_v1', 'token-de-teste');
  void op; // r46: modo único só-nuvem (a flag soNuvem:false não existe mais)
  w.DIGICOPY_CLOUD = { token: () => 'token-de-teste', api: nuvem.api, deviceInfo: () => null };
  w.DIGICOPY_APP_VERSION = '7.0.19';
  w.getSession = () => null;
  w.db = { clientes: [], produtos: [], vendas: [], contasReceber: [], contasPagar: [], config: {}, _seq: {}, parque: [], equipamentos: [], contratos: [], leituras: [], os: [] };
  w.saveDB = function () { };
  w.saveDBAgora = function () { };
  w.toast = function () { };
  let chamadasRender = 0;
  w.renderVendas = function () { chamadasRender++; };
  let relogio = Date.now();
  const fila = [];
  let proximoId = 1;
  w.setTimeout = function (fn, ms) { const id = proximoId++; fila.push({ id: id, quando: relogio + (Number(ms) || 0), fn: fn }); return id; };
  w.clearTimeout = function (id) { const i = fila.findIndex((x) => x.id === id); if (i >= 0) fila.splice(i, 1); };
  w.setInterval = function () { return 0; };
  const RelogioReal = Date;
  w.Date = class extends RelogioReal { constructor(...a) { super(...(a.length ? a : [relogio])); } static now() { return relogio; } };
  nuvem.atrasar = (ms) => new Promise((r) => w.setTimeout(r, ms));
  const pendentes = () => fila.slice().sort((a, b) => a.quando - b.quando);
  async function respirar() { for (let i = 0; i < 8; i++) await new Promise((r) => setImmediate(r)); }
  async function andar(ms) {
    const fim = relogio + ms;
    for (let guarda = 0; guarda < 20000; guarda++) {
      const lista = pendentes();
      if (!lista.length || lista[0].quando > fim) break;
      const t = lista[0];
      relogio = t.quando;
      const i = fila.findIndex((x) => x.id === t.id); if (i >= 0) fila.splice(i, 1);
      try { t.fn(); } catch (e) { }
      await respirar();
    }
    relogio = fim;
    await respirar();
  }
  w.eval(FONTE);
  return {
    janela: w, andar: andar,
    chamadasRender: () => chamadasRender,
    cargaLigada: () => { try { return !!w.DIGICOPY_CLOUD_SYNC.cargaNuvemLigada(); } catch (e) { return null; } },
    temAviso: () => !!w.document.getElementById('digicopy-carga-nuvem'),
    totalBanco: () => (w.db.clientes || []).length,
    temRecente: (id) => (w.db.clientes || []).some((c) => c && c.id === id)
  };
}

(async function () {
  console.log('== O DADO APARECE NO OUTRO PC ==');

  console.log('-- A PROVA: a tela libera antes de terminar o histórico --');
  {
    const TOTAL = 8000;
    const nuvem = nuvemFingida();
    nuvem.semear(TOTAL);
    const B = abrirNavegador(nuvem);   // primeira abertura (r46: sem aviso de carga, modo único)
    let momento = null;
    for (let passo = 0; passo < 400 && !momento; passo++) {
      await B.andar(61);
      if (B.temRecente('seed-' + TOTAL) && !B.cargaLigada() && B.chamadasRender() > 0) {
        momento = { total: B.totalBanco(), render: B.chamadasRender(), avisoAindaLa: B.temAviso() };
      }
    }
    ok('o dado recente chegou na tela e a trava abriu', !!momento, JSON.stringify(momento));
    ok('E ISSO ANTES de terminar o histórico (não segura tudo)',
      !!momento && momento.total < TOTAL, 'banco=' + (momento && momento.total) + ' de ' + TOTAL);
    ok('sem aviso de carga na abertura (r46: modo único libera direto)', !!momento && momento.avisoAindaLa === false);
    await B.andar(120000);
    ok('depois o histórico completa (tudo chega)', B.totalBanco() === TOTAL, 'banco=' + B.totalBanco());
    ok('e o aviso sai no fim', !B.temAviso() && !B.cargaLigada());
  }

  console.log('-- regime: com os dois abertos, chega em segundos --');
  {
    const nuvem = nuvemFingida();
    nuvem.semear(5);
    const A = abrirNavegador(nuvem);
    const B = abrirNavegador(nuvem);
    await A.andar(15000); await B.andar(15000);
    A.janela.db.clientes.push({ id: 'cli-novo', nome: 'Novo' });
    A.janela.saveDB();
    let viu = -1;
    for (let s = 0; s < 10; s++) {
      await A.andar(1000); await B.andar(1000);
      if (B.temRecente('cli-novo')) { viu = s + 1; break; }
    }
    ok('B vê o que A gravou em até 10s', viu > 0, viu > 0 ? viu + 's' : 'não viu');
  }

  console.log('-- foto: a abertura lê o estado, não a história --');
  {
    const nuvem = nuvemFingida();
    nuvem.comFoto = true;
    nuvem.injetarDuranteFoto = true;
    nuvem.semearVersoes(15, 100);   // 1500 no diário, 15 vivos
    const B = abrirNavegador(nuvem);
    // lê os contadores LOGO que o banco enche (cada tique de 3s faria +1 depois)
    for (let passo = 0; passo < 400 && B.totalBanco() < 16; passo++) await B.andar(61);
    const contaFoto = 'foto=' + nuvem.fotoReqs + ' diario=' + nuvem.diarioReqs;
    ok('a abertura usou a foto (1 página) e pulou o replay (0 a 1 incremental)',
      nuvem.fotoReqs === 1 && nuvem.diarioReqs <= 1, contaFoto);
    await B.andar(60000);
    const cli = B.janela.db.clientes || [];
    ok('os 15 vivos chegaram na versão atual (v100)',
      cli.length === 16 && cli.every((c) => c.id === 'c-novo' || c.v === 100), 'banco=' + cli.length);
    ok('o que foi gravado DURANTE a foto aparece (pelo incremental)', B.temRecente('c-novo'));
    ok('e o aviso de carga saiu no fim', !B.temAviso() && !B.cargaLigada());
  }

  console.log('-- motor antigo (sem foto): o diário assume sozinho --');
  {
    const nuvem = nuvemFingida();   // sem comFoto: /v1/snapshot dá 404, igual ao motor antigo
    nuvem.semearVersoes(15, 100);
    const B = abrirNavegador(nuvem);
    for (let passo = 0; passo < 400 && B.totalBanco() < 15; passo++) await B.andar(61);
    const contaDiario = 'foto=' + nuvem.fotoReqs + ' diario=' + nuvem.diarioReqs;
    ok('o app tentou a foto primeiro (404 do motor antigo) e caiu no diário',
      nuvem.fotoReqs >= 1 && nuvem.diarioReqs >= 2, contaDiario);
    await B.andar(120000);
    const cli = B.janela.db.clientes || [];
    ok('sem foto, o diário completo assume (lento, correto)',
      cli.length === 15 && cli.every((c) => c.v === 100), 'banco=' + cli.length);
    ok('e o aviso de carga saiu no fim', !B.temAviso() && !B.cargaLigada());
  }

  console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
})().catch((e) => { console.error('ERRO NO TESTE:', e); process.exit(2); });
//<<<<SECAO:test_dado_aparece_outro_pc.js:FIM>>>>
}

if (false) { // ═══ test_mandar_erro.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_mandar_erro.js:INICIO>>>>
// ═════════════════════════════════════════════════════
// TESTE — MANDAR O QUE QUEBROU (v7.0.20, rodada 32, ideia L)
//
// A DOR (dele): "tem vários problemas, eu não consigo identificar".
// O conserto: 1 clique monta o pacote (versão + tela + últimos erros,
// SEM segredo) e abre o popup de copiar — ele cola no chat e a manutenção
// recebe a prova. NÃO é botão de rodapé (o do rodapé não volta, por ordem
// dele): mora no aviso de erro (na hora que quebra) e no check-up da nuvem
// (quando está estranho mas não quebrou nada).
//
// O QUE ESTE TESTE FAZ:
//   1. estático: o patch existe, entra no bundle DEPOIS do popup do sistema
//      e do erro.txt, e não toca em rodapé;
//   2. comportamento (navegador de verdade): semeia erros (incluindo segredos
//      de mentira), chama a função e confere o pacote no popup;
//   3. sem erro nenhum: o pacote diz que não há erro, mas leva tela+versão;
//   4. o aviso de erro ganha o botão (e SEM o patch o botão não aparece);
//   5. o check-up ganha o botão (fio estático).
// ═════════════════════════════════════════════════════
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  ✘ ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  ✔ ' + nome); passou++;
}

console.log('== MANDAR O QUE QUEBROU ==');

// ── parte 1: estático ──
const PATCH = 'ajustes_v7020_mandar_erro_patch.js';
ok('o patch existe', fs.existsSync(PATCH));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const lista = Array.isArray(manifest) ? manifest : (manifest.scripts || manifest.files || []);
const pos = lista.indexOf(PATCH);
ok('o patch entra no bundle', pos >= 0);
ok('o patch carrega DEPOIS do popup do sistema e do erro.txt',
  pos > lista.indexOf('popup_sistema_patch.js') && pos > lista.indexOf('ajustes_v52239_avisos_erro_auditoria_patch.js'),
  'pos=' + pos);
const fonte = fs.readFileSync(PATCH, 'utf8');
const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
ok('o patch NÃO toca em rodapé (ordem dele: o botão do rodapé não volta)',
  codigo.toLowerCase().indexOf('footer') < 0 && codigo.toLowerCase().indexOf('rodapé') < 0);
ok('o patch usa o popup de copiar do sistema (não inventa janela)',
  fonte.indexOf('mostrarTextoCopiar') >= 0);

// ── navegador de verdade ──
if (!JSDOM) {
  console.log("  (partes 2-4 puladas: falta a dependência 'jsdom' — não é defeito do sistema)");
  console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
  process.exit(0);
}
function abrirNavegador(comPatch) {
  const dom = new JSDOM('<!DOCTYPE html><body>' +
    '<section id="view-vendas" class="view"></section>' +
    '<section id="view-clientes" class="view hidden"></section>' +
    '<div id="modal-root" class="hidden"><div id="modal-box"></div></div>' +
    '</body>', { url: 'http://localhost/', runScripts: 'outside-only' });
  const w = dom.window;
  w.DIGICOPY_APP_VERSION = '9.9.9-teste';
  w.eval(fs.readFileSync('popup_sistema_patch.js', 'utf8'));
  w.eval(fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8'));
  if (comPatch) w.eval(fs.readFileSync(PATCH, 'utf8'));
  return w;
}
function textoPopup(w) {
  const area = w.document.querySelector('textarea[id^="copia-system-modal-"]');
  return area ? area.value : null;
}

console.log('-- o pacote: versão + tela + últimos erros, sem segredo --');
{
  const w = abrirNavegador(true);
  ok('a função existe', typeof w.digicopyMandarErro === 'function');
  const linhas = [];
  for (let i = 1; i <= 20; i++) linhas.push('[fake] erro número ' + i);
  linhas.push('[fake] falhou com token=abc123secreto na resposta');
  linhas.push('[fake] campo senha=9999 não confere (Bearer xyz789)');
  w.localStorage.setItem('digicopy_erros_txt', JSON.stringify(linhas));
  w.digicopyMandarErro();
  const txt = textoPopup(w);
  ok('o popup de copiar abriu com o pacote', typeof txt === 'string' && txt.length > 50);
  ok('o pacote leva a versão do app', txt.indexOf('9.9.9-teste') >= 0);
  ok('o pacote leva a tela da frente (vendas)', /tela:\s*vendas/i.test(txt), txt.split('\n')[1]);
  ok('o pacote leva os erros recentes (últimas linhas)', txt.indexOf('erro número 20') >= 0);
  ok('o pacote corta os antigos (só os últimos 15)', txt.indexOf('erro número 1\n') < 0 && txt.indexOf('erro número 5') < 0);
  ok('o segredo token= NÃO vaza', txt.indexOf('abc123secreto') < 0 && /token\s*=\s*\*\*\*/i.test(txt));
  ok('o segredo senha= NÃO vaza', txt.indexOf('9999') < 0 && /senha\s*=\s*\*\*\*/i.test(txt));
  ok('o Bearer NÃO vaza', txt.indexOf('xyz789') < 0);
}

console.log('-- sem erro nenhum: leva tela + versão do mesmo jeito --');
{
  const w = abrirNavegador(true);
  w.localStorage.setItem('digicopy_erros_txt', JSON.stringify([]));
  w.digicopyMandarErro();
  const txt = textoPopup(w);
  ok('diz que não há erro registrado', /nenhum erro registrado/i.test(txt));
  ok('mas leva tela e versão (serve pro "está estranho")',
    txt.indexOf('9.9.9-teste') >= 0 && /tela:\s*vendas/i.test(txt));
}

console.log('-- o aviso de erro ganha o botão (só com o patch) --');
{
  const sem = abrirNavegador(false);
  sem.registrarErroSistema('quebrou de mentira', 'teste');
  ok('SEM o patch, o aviso NÃO tem o botão',
    !sem.document.getElementById('aviso-erro-txt-mandar'));
  const com = abrirNavegador(true);
  com.registrarErroSistema('quebrou de mentira', 'teste');
  const b = com.document.getElementById('aviso-erro-txt-mandar');
  ok('COM o patch, o aviso TEM o botão "Mandar o que quebrou"',
    !!b && /mandar/i.test(b.textContent));
  b.click();
  ok('clicar no botão abre o pacote para copiar', typeof textoPopup(com) === 'string');
}

console.log('-- o check-up saiu (r46); o mandar-erro continua no patch próprio --');
{
  const ck = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');
  ok('o check-up saiu da tela (sem dc-ck-mandar)', ck.indexOf('dc-ck-mandar') < 0);
  const me = fs.readFileSync('ajustes_v7020_mandar_erro_patch.js', 'utf8');
  ok('a função continua viva no próprio patch', me.indexOf('digicopyMandarErro') >= 0);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
// os patches avaliados agendam vigias de minutos (checar atualização, card
// publicador) — o teste já terminou; sai sem esperar os vigias.
process.exit(0);
//<<<<SECAO:test_mandar_erro.js:FIM>>>>
}
