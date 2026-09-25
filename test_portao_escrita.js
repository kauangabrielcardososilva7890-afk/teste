// ═════════════════════════════════════════════════════
// TESTE — PORTÃO DE ESCRITA, BLOCO 1: EXISTE E REGISTRA (v7.0.22, rodada 35, ideia E)
//
// A DOR: 254 pontos em 109 arquivos gravam direto (saveDB/saveDBAgora/db.save) e,
// quando um dado some/volta, não há registro de quem gravou, quando e por qual tela.
//
// ESTE BLOCO (o portão "por baixo"): embrulha o saveDB e o saveDBAgora e ANOTA cada
// gravação (quando + tela + por onde) numa lista curta na memória. NÃO muda nenhum
// comportamento — e este teste PROVA isso comparando ANTES (sem o portão) e DEPOIS
// (com o portão): efeitos idênticos + diário presente. A migração dos 254 pontos
// para a função única vem nos próximos blocos, cada um com seu antes/depois.
// Roda sem jsdom (navegador de mentira, na mão).
// ═════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  ✘ ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  ✔ ' + nome); passou++;
}
console.log('== PORTÃO DE ESCRITA, BLOCO 1 (só confere comportamento, nada muda) ==');

const PATCH = 'ajustes_v7021_portao_escrita_patch.js';
const LPATCH = 'ajustes_v7020_mandar_erro_patch.js';
ok('o patch do portão existe', fs.existsSync(PATCH));
const FONTE = fs.readFileSync(PATCH, 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const lista = Array.isArray(manifest) ? manifest : (manifest.scripts || manifest.files || []);
const pos = lista.indexOf(PATCH);
ok('o portão entra no bundle', pos >= 0);
ok('o portão carrega DEPOIS do patch da nuvem (embrulha o saveDB vencedor) e do mandar-erro',
  pos > lista.indexOf('cloudflare_data_sync_patch.js') && pos > lista.indexOf(LPATCH), 'pos=' + pos);
ok('o portão declara a substituição (trava D: marcador SUBSTITUICAO)',
  FONTE.indexOf('SUBSTITUICAO DE PROPOSITO: saveDB') >= 0 && FONTE.indexOf('SUBSTITUICAO DE PROPOSITO: saveDBAgora') >= 0);
const codigo = FONTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
ok('o portão ENCADEIA (não substitui): delega via .apply',
  /\.apply\s*\(\s*this\s*,\s*arguments\s*\)/.test(FONTE));
ok('o portão é VISÍVEL no mapa (atribuição estática, nunca window[nome])',
  codigo.indexOf('window.saveDB=function') >= 0 && codigo.indexOf('window.saveDBAgora=function') >= 0 &&
  codigo.indexOf('window[nome]') < 0);
ok('o portão é barato (sem timer, sem rede, sem disco — regra 12)',
  ['setTimeout', 'setInterval', 'localStorage', 'sessionStorage', 'fetch(', 'XMLHttpRequest', 'WebSocket']
    .every((p) => codigo.indexOf(p) < 0));
ok('o portão não mexe em tela (nada visual)', codigo.toLowerCase().indexOf('footer') < 0 && codigo.toLowerCase().indexOf('rodapé') < 0);
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok('o ritual confere o patch novo (scripts.check)', (pkg.scripts.check || '').indexOf(PATCH) >= 0);
// A montanha (só informa — os blocos de migração vão derrubar este número):
{
  let n = 0; const arqs = new Set();
  lista.forEach((f) => {
    let s = ''; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
    const c = (s.match(/[^A-Za-z0-9_.]saveDB\s*\(/g) || []).length +
      (s.match(/[^A-Za-z0-9_.]saveDBAgora\s*\(/g) || []).length + (s.match(/db\.save\s*\(/g) || []).length;
    if (c > 0) { n += c; arqs.add(f); }
  });
  console.log('  (montanha a migrar: ' + n + ' gravações diretas em ' + arqs.size + ' arquivos)');
}

// ── navegador de mentira ──
function vista(id, visivel) {
  return { id: id, classList: { contains: function (c) { return c === 'hidden' ? !visivel : false; } } };
}
function docMock(op) {
  op = op || {};
  const todas = ['view-vendas', 'view-clientes', 'view-config'];
  const vis = op.visiveis || ['view-vendas'];
  return {
    getElementById: function (id) {
      if (id !== 'modal-root') return null;
      if (!op.modal) return { classList: { contains: function () { return true; } } };
      return { classList: { contains: function () { return false; } } };
    },
    querySelectorAll: function () { return todas.map((t) => vista(t, vis.indexOf(t) >= 0)); },
    querySelector: function () { return null; }
  };
}
function janelaMock(doc) {
  const chamadas = [];
  const window = {
    saveDB: function () { chamadas.push({ via: 'saveDB', args: Array.prototype.slice.call(arguments), isto: this === window }); return 'ok-db'; },
    saveDBAgora: function () { chamadas.push({ via: 'saveDBAgora', args: Array.prototype.slice.call(arguments), isto: this === window }); return 'ok-agora'; }
  };
  return { window: window, chamadas: chamadas };
}
function avaliarPortao(window, doc) {
  new Function('window', 'document', FONTE)(window, doc);
}
function mesmosEfeitos(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ── ANTES × DEPOIS: efeitos idênticos ──
let antes, depois, recs;
{
  const a = janelaMock(docMock());
  const r1 = a.window.saveDB('cli-1', { nome: 'X' });
  const r2 = a.window.saveDBAgora();
  antes = { ret: [r1, r2], chamadas: a.chamadas };
}
{
  const d = janelaMock(docMock());
  avaliarPortao(d.window, docMock());
  const r1 = d.window.saveDB('cli-1', { nome: 'X' });
  const r2 = d.window.saveDBAgora();
  depois = { ret: [r1, r2], chamadas: d.chamadas };
  recs = d.window.DIGICOPY_PORTAO.ultimas(10);
}
ok('ANTES × DEPOIS: retorno, argumentos e this idênticos (comportamento intacto)',
  mesmosEfeitos(antes, depois), JSON.stringify(depois));
ok('DEPOIS: o diário anotou as 2 gravações (via + tela + quando)',
  recs.length === 2 && recs[0].via === 'saveDB' && recs[1].via === 'saveDBAgora' &&
  recs[0].tela === 'vendas' && recs[1].tela === 'vendas' &&
  typeof recs[0].q === 'number' && typeof recs[1].q === 'number' && recs[1].q >= recs[0].q,
  JSON.stringify(recs));

// ── detecção de tela ──
{
  const d = janelaMock(docMock({ visiveis: ['view-clientes'] }));
  avaliarPortao(d.window, docMock({ visiveis: ['view-clientes'] }));
  d.window.saveDB();
  ok('tela de verdade (clientes)', d.window.DIGICOPY_PORTAO.ultimas(1)[0].tela === 'clientes');
}
{
  const d = janelaMock(docMock({ modal: true }));
  d.window.modalContext = { type: 'orcamento-novo' };
  avaliarPortao(d.window, docMock({ modal: true }));
  d.window.saveDB();
  ok('janela por cima (modal)', d.window.DIGICOPY_PORTAO.ultimas(1)[0].tela === 'janela: orcamento-novo');
}
{
  const d = janelaMock(docMock({ visiveis: [] }));
  avaliarPortao(d.window, docMock({ visiveis: [] }));
  d.window.saveDB();
  ok('sem tela visível: "não sei" (nunca trava)', d.window.DIGICOPY_PORTAO.ultimas(1)[0].tela === 'não sei');
}
{
  const chamadas = [];
  const window = { saveDB: function () { chamadas.push(1); return true; } };
  avaliarPortao(window, undefined);
  window.saveDB();
  ok('sem documento: anota "não sei" e não quebra',
    chamadas.length === 1 && window.DIGICOPY_PORTAO.ultimas(1)[0].tela === 'não sei');
}

// ── proteção: não embrulha 2 vezes, teto, mudez temporária ──
{
  const d = janelaMock(docMock());
  avaliarPortao(d.window, docMock());
  avaliarPortao(d.window, docMock());
  d.window.saveDB();
  ok('carregar 2 vezes NÃO duplica (1 anotação, 1 chamada)',
    d.chamadas.length === 1 && d.window.DIGICOPY_PORTAO.ultimas(10).length === 1);
}
{
  const d = janelaMock(docMock());
  avaliarPortao(d.window, docMock());
  for (let i = 0; i < 55; i++) d.window.saveDB();
  ok('teto de 50 no diário, contador total segue (55)',
    d.window.DIGICOPY_PORTAO.ultimas(100).length === 50 && d.window.DIGICOPY_PORTAO.total() === 55);
}
{
  // padrão v5243: calar o saveDB durante um render filtrado e devolver depois
  const d = janelaMock(docMock());
  avaliarPortao(d.window, docMock());
  const sdB = d.window.saveDB;
  d.window.saveDB = function () {};
  d.window.saveDB();
  d.window.saveDB = sdB;
  d.window.saveDB();
  const u = d.window.DIGICOPY_PORTAO.ultimas(10);
  ok('mudez temporária (v5243) continua valendo e o portão volta depois',
    u.length === 1 && d.chamadas.length === 1);
}
{
  // sem saveDB ao carregar: o portão existe, vazio, sem quebrar
  const window = {};
  avaliarPortao(window, docMock());
  ok('sem saveDB ao carregar: portão existe e vazio, sem quebrar',
    !!window.DIGICOPY_PORTAO && window.DIGICOPY_PORTAO.ultimas(5).length === 0 && window.DIGICOPY_PORTAO.total() === 0);
}

// ── integração com o "mandar o que quebrou" ──
const LFONTE = fs.readFileSync(LPATCH, 'utf8');
function pacoteCom(op) {
  const loja = { digicopy_erros_txt: JSON.stringify(op.erros || []) };
  const ls = { getItem: function (k) { return loja[k] || null; }, setItem: function () {}, removeItem: function () {} };
  const w = {
    DIGICOPY_APP_VERSION: '9.9.9-teste',
    saveDB: function () { return true; },
    mostrarTextoCopiar: function (t, txt) { w.__pacote = txt; return true; },
    toast: function () {}
  };
  const doc = docMock({ visiveis: ['view-vendas'] });
  if (op.comPortao) avaliarPortao(w, doc);
  new Function('window', 'document', 'localStorage', LFONTE)(w, doc, ls);
  if (op.comPortao) { w.saveDB(); w.saveDB(); }
  w.digicopyMandarErro();
  return w.__pacote || '';
}
{
  const txt = pacoteCom({ comPortao: true, erros: ['[fake] quebrou X'] });
  ok('COM portão: pacote leva as gravações (quando | onde | por onde)',
    txt.indexOf('gravações (últimas 2') >= 0 && txt.indexOf('vendas') >= 0 && txt.indexOf('saveDB') >= 0,
    txt.split('\n').slice(-4).join(' / '));
  ok('COM portão: erros e versão continuam no pacote',
    txt.indexOf('[fake] quebrou X') >= 0 && txt.indexOf('9.9.9-teste') >= 0);
}
{
  const txt = pacoteCom({ comPortao: false, erros: ['[fake] quebrou X'] });
  ok('SEM portão: pacote idêntico ao de antes (zero linhas novas)',
    txt.indexOf('gravações (') < 0 && txt.indexOf('[fake] quebrou X') >= 0 && txt.indexOf('9.9.9-teste') >= 0);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
