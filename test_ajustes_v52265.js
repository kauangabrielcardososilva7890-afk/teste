// ═══════════════════════════════════════════════════════════════════════════
// TESTE v5.22.65 — um script quebrado não derruba o sistema inteiro
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const os = require('os');
const path = require('path');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }
function load(src){
  const ctx = { window:{}, document:undefined, setTimeout:()=>0, console:{log(){},error(){}} };
  new Function('window','document','setTimeout','console',src)(ctx.window, ctx.document, ctx.setTimeout, ctx.console);
  return ctx.window;
}

const src    = fs.readFileSync('ajustes_v52265_script_isolado_patch.js','utf8');
const build  = fs.readFileSync('build_bundle.js','utf8');
const main   = fs.readFileSync('main.js','utf8');
const diag   = fs.readFileSync('diagnostico_exe.js','utf8');
const bundle = fs.readFileSync('app.bundle.js','utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const P = load(src).EXE_SCRIPT_ISOLADO_V52265_PURE;

console.log('== v5.22.65 — SCRIPT ISOLADO ==');

// ── 1. Versão ───────────────────────────────────────────────────────────────
ok('versão', P.VERSAO === '5.22.65' && pkg.version === '5.22.65');
ok('patch no bundle', manifest.includes('ajustes_v52265_script_isolado_patch.js'));
ok('bundle carregado com a versão', fs.readFileSync('index.html','utf8').indexOf('app.bundle.js?v='+pkg.version) >= 0);

// ── 2. Lógica pura ──────────────────────────────────────────────────────────
ok('não isola quem declara no escopo global', P.podeIsolar(true) === false);
ok('isola quem não declara nada no topo', P.podeIsolar(false) === true);
ok('resumo sem falha', P.resumoFalhas([]) === 'Todos os scripts carregaram.');
ok('resumo no singular', P.resumoFalhas([{}]) === '1 script não carregou');
ok('resumo no plural', P.resumoFalhas([{},{}]) === '2 scripts não carregaram');
ok('carregouTudo confere o marcador',
   P.carregouTudo({ __DIGICOPY_BUNDLE_COMPLETO:true }) === true &&
   P.carregouTudo({}) === false && P.carregouTudo(null) === false);

// ── 3. O bundle realmente isola ─────────────────────────────────────────────
ok('build_bundle usa acorn para decidir', /require\('acorn'\)/.test(build) && /declaraNoEscopoGlobal/.test(build));
ok('build_bundle não usa lista escrita à mão', !/const\s+(SEGUROS|GLOBAIS)\s*=\s*\[/.test(build));
ok('bundle tem o coletor de falhas', /__DIGICOPY_FALHA\s*=\s*function/.test(bundle));
ok('bundle tem a marca de fim', /__DIGICOPY_BUNDLE_COMPLETO\s*=\s*true/.test(bundle));
ok('bundle envolve scripts em try/catch', (bundle.match(/window\.__DIGICOPY_FALHA\("/g) || []).length >= 150);
ok('app.js fica fora do try/catch (escopo global)', /app\.js \(escopo global\)/.test(bundle));

// prova de fogo: monta um bundle onde o script do meio quebra
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'digicopy-iso-'));
  const antes = process.cwd();
  try {
    process.chdir(tmp);
    fs.writeFileSync('um.js',   '(function(){ window.ordem.push("um"); })();\n');
    fs.writeFileSync('dois.js', '(function(){ window.ordem.push("dois"); indexedDB.open("x"); })();\n');
    fs.writeFileSync('tres.js', '(function(){ window.ordem.push("tres"); })();\n');
    fs.writeFileSync('bundle-manifest.json', JSON.stringify(['um.js','dois.js','tres.js']));
    require('child_process').execSync('node ' + JSON.stringify(path.join(antes,'build_bundle.js')),
      { stdio:'ignore', env:{...process.env, NODE_PATH: path.join(antes,'node_modules')} });

    const w = { ordem: [] };
    const idb = { open(){ throw new Error('SecurityError: bloqueado em file://'); } };
    new Function('window','indexedDB','localStorage','console',
      fs.readFileSync('app.bundle.js','utf8'))(w, idb, undefined, {log(){},error(){}});

    ok('script depois do que falhou continua rodando', w.ordem.join(',') === 'um,dois,tres');
    ok('bundle chega ao fim mesmo com falha', w.__DIGICOPY_BUNDLE_COMPLETO === true);
    ok('a falha fica registrada com o nome do arquivo',
       (w.__DIGICOPY_ERROS||[]).length === 1 && w.__DIGICOPY_ERROS[0].arquivo === 'dois.js');
  } finally {
    process.chdir(antes);
    try { fs.rmSync(tmp, { recursive:true, force:true }); } catch(e){}
  }
}

// ── 4. As falhas ficam registradas em disco ─────────────────────────────────
ok('main.js grava log-erros.txt', /log-erros\.txt/.test(main));
ok('main.js escuta erros do console', /console-message/.test(main));
ok('main.js avisa se o bundle não terminou', /BUNDLE NÃO CHEGOU AO FIM/.test(main));
ok('main.js lê __DIGICOPY_ERROS da tela', /__DIGICOPY_ERROS/.test(main));
ok('registro nunca atrapalha o uso', /catch\(e\)\{\}/.test(main));
ok('diagnóstico mostra o log', /log-erros\.txt/.test(diag) && /log de falhas do app/.test(diag));

// ── 5. Patch bem-comportado ─────────────────────────────────────────────────
ok('não sobrescreve a versão global', !/window\.DIGICOPY_APP_VERSION\s*=\s*VERSAO\s*;/.test(src));
ok('lê a versão global ao pintar', /window\.DIGICOPY_APP_VERSION\)\s*\|\|\s*VERSAO/.test(src));
ok('avisa quem usa quando algo falhou', /resumoFalhas\(erros\)/.test(src));
ok('patch não mexe no APK', !/capacitor|android|apk/i.test(src));

console.log('\nRESULTADO: v5.22.65 passou!');
