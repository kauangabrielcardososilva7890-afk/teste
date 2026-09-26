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

console.log('-- o check-up ganha o botão --');
{
  const ck = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');
  ok('o check-up tem o botão mandar (dc-ck-mandar)', ck.indexOf('dc-ck-mandar') >= 0);
  ok('o botão chama a função (com guarda)', ck.indexOf('digicopyMandarErro') >= 0);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
// os patches avaliados agendam vigias de minutos (checar atualização, card
// publicador) — o teste já terminou; sai sem esperar os vigias.
process.exit(0);
