// ═══════════════════════════════════════════════════════════════════════════
// TESTE — integridade do empacotamento (.exe)
// Garante que nunca mais saia um instalador sem as atualizações novas.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const cp = require('child_process');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }

const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html = fs.readFileSync('index.html','utf8');
const versao = pkg.version;

console.log('== EMPACOTAMENTO DO .EXE ==');

// ── Ferramentas existem ─────────────────────────────────────────────────────
ok('sync_build.js existe', fs.existsSync('sync_build.js'));
ok('verify_pack.js existe', fs.existsSync('verify_pack.js'));

// ── Scripts do npm encadeiam sync + bundle + verificação ────────────────────
const bw = pkg.scripts['build:win'] || '';
ok('build:win limpa o dist antes', bw.indexOf('clean_dist.js') >= 0);
ok('build:win sincroniza a configuração', bw.indexOf('sync_build.js') >= 0);
ok('build:win regenera o bundle', bw.indexOf('bundle') >= 0);
ok('build:win confere o pacote no final', bw.indexOf('verify_pack.js') >= 0);
ok('sync roda antes do electron-builder',
   bw.indexOf('sync_build.js') < bw.indexOf('electron-builder'));
ok('verify roda depois do electron-builder',
   bw.indexOf('electron-builder') < bw.indexOf('verify_pack.js'));
ok('atalhos npm run sync / verify:exe existem',
   !!pkg.scripts.sync && !!pkg.scripts['verify:exe'] && !!pkg.scripts['sync:check']);

// ── Configuração está de fato sincronizada ──────────────────────────────────
cp.execFileSync(process.execPath, ['sync_build.js','--check'], { stdio:'pipe' });
ok('index.html + build.files + check estão sincronizados', 'ok');

// ── Versão carimbada em todo lugar ──────────────────────────────────────────
ok('DIGICOPY_APP_VERSION bate com o package.json',
   html.indexOf("window.DIGICOPY_APP_VERSION = '"+versao+"'") >= 0);
ok('título da janela bate com a versão', html.indexOf('<title>Sistema Digicopy v'+versao+'</title>') >= 0);
ok('rodapé bate com a versão', new RegExp('id="footer-version"[^>]*>v'+versao.replace(/\./g,'\\.')+'<').test(html));

// ── Cache-busting: nenhum script do app com ?v= de versão antiga ────────────
const srcs = [...html.matchAll(/<script\s[^>]*src="\.\/([A-Za-z0-9_.\-/]+\.js)(\?v=([^"]*))?"/g)];
const desatualizados = srcs
  .filter(m => !m[1].startsWith('assets/vendor/'))
  .filter(m => m[3] !== versao)
  .map(m => m[1]);
ok('todo script do app tem ?v='+versao, desatualizados.length === 0);

// ── Nada carregado pelo index.html pode ficar de fora do .exe ───────────────
const refs = [...html.matchAll(/(?:src|href)="\.\/([A-Za-z0-9_.\-/]+?)(?:\?[^"]*)?"/g)].map(m => m[1]);
ok('todos os recursos do index.html existem no disco', refs.every(f => fs.existsSync(f)));
const foraDoExe = refs.filter(f => !f.startsWith('assets/') && !pkg.build.files.includes(f));
ok('nenhum recurso do index.html ficou fora de build.files', foraDoExe.length === 0);

// ── Arquivos essenciais do Electron ─────────────────────────────────────────
['package.json','index.html','main.js','preload.js','app.bundle.js','assets/vendor/**/*']
  .forEach(f => ok('build.files inclui '+f, pkg.build.files.includes(f)));

// ── Bundle bate com as fontes ───────────────────────────────────────────────
cp.execFileSync(process.execPath, ['build_bundle.js','--check'], { stdio:'pipe' });
ok('app.bundle.js está atualizado com as '+manifest.length+' fontes', 'ok');

// ── Cache do Electron invalida por impressão digital do código ──────────────
const main = fs.readFileSync('main.js','utf8');
ok('main.js calcula a impressão digital do bundle', /APP_FINGERPRINT/.test(main));
ok('cache é limpo quando o CÓDIGO muda, não só a versão',
   /prev\s*!==\s*APP_FINGERPRINT/.test(main));
ok('impressão digital usa o sha256 do bundle', /sha256/.test(main));

console.log('\nRESULTADO: empacotamento do .exe íntegro!');
