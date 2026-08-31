// ═══════════════════════════════════════════════════════════════════════════
// TESTE v5.22.63 — .exe completo: nenhuma atualização fica de fora
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const cp = require('child_process');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }
function load(src){
  const ctx = { window:{}, document:undefined };
  new Function('window','document', src)(ctx.window, ctx.document);
  return ctx.window;
}

const src = fs.readFileSync('ajustes_v52263_exe_completo_patch.js','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html = fs.readFileSync('index.html','utf8');
const sync = fs.readFileSync('sync_build.js','utf8');
const verify = fs.readFileSync('verify_pack.js','utf8');
const main = fs.readFileSync('main.js','utf8');
const P = load(src).EXE_COMPLETO_V52263_PURE;

console.log('== v5.22.63 — .EXE COMPLETO ==');

ok('versao', P.VERSAO === '5.22.63' && pkg.version === '5.22.63');
ok('patch no bundle', manifest.includes('ajustes_v52263_exe_completo_patch.js'));
ok('patch no index com cache-busting da versão',
   html.indexOf('ajustes_v52263_exe_completo_patch.js?v='+pkg.version) >= 0);
ok('patch vai para o .exe', pkg.build.files.includes('ajustes_v52263_exe_completo_patch.js'));

// ── 1. Lista de arquivos do .exe é gerada, não escrita à mão ────────────────
ok('sync gera build.files', P.listaAutomatica === true && /pkg\.build\.files\s*=\s*filesEsperado/.test(sync));
ok('sync gera scripts.check', /pkg\.scripts\.check\s*=\s*checkEsperado/.test(sync));
ok('sync tem modo --check para travar build sujo', /--check/.test(sync) && /process\.exit\(1\)/.test(sync));
cp.execFileSync(process.execPath, ['sync_build.js','--check'], { stdio:'pipe' });
ok('configuração está sincronizada agora', 'ok');

// ── 2. O pacote gerado é conferido ──────────────────────────────────────────
ok('verify confere o pacote', P.conferePacote === true);
ok('verify compara o sha256 do bundle empacotado', /sha\(bundleRel\)/.test(verify) && /DIFERENTE do projeto/.test(verify));
ok('verify acusa recurso do index ausente no pacote', /NÃO foi para o \.exe/.test(verify));
ok('verify falha o build quando falta algo', /erros\.length/.test(verify) && /process\.exit\(1\)/.test(verify));

// ── 3. Cache do Electron por conteúdo, não só por versão ────────────────────
ok('cache por impressão digital', P.cachePorConteudo === true && /APP_FINGERPRINT/.test(main));
ok('fingerprint usa o sha256 do bundle', /sha256/.test(main) && /app\.bundle\.js/.test(main));
ok('não depende só do número da versão', /prev\s*!==\s*APP_FINGERPRINT/.test(main));

// ── 4. Pipeline do npm encadeado na ordem certa ─────────────────────────────
const bw = pkg.scripts['build:win'];
ok('build:win = limpa → sincroniza → empacota → confere',
   bw.indexOf('clean_dist.js') < bw.indexOf('sync_build.js') &&
   bw.indexOf('sync_build.js') < bw.indexOf('electron-builder') &&
   bw.indexOf('electron-builder') < bw.indexOf('verify_pack.js'));

// ── 5. APK sem arquivos faltando ────────────────────────────────────────────
const www = fs.readFileSync('mobile/sync-www.js','utf8');
ok('APK copia o que o index carrega', P.apkSemFaltas === true && /refsLocais\(htmlOrigem\)/.test(www));
ok('APK falha se sobrar referência quebrada', /o APK sairia com arquivos faltando/.test(www));

// ── 6. Higiene ──────────────────────────────────────────────────────────────
ok('bundle atualizado com as fontes', (cp.execFileSync(process.execPath,['build_bundle.js','--check'],{stdio:'pipe'}), true));
ok('patch não mexe no APK', src.indexOf('mobile/') < 0);

console.log('\nRESULTADO: v5.22.63 passou!');
