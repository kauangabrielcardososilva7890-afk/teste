// ═══════════════════════════════════════════════════════════════════════════
// TESTE v5.22.64 — cada entrega tem número novo + diagnóstico do .exe
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }
function load(src){
  const ctx = { window:{}, document:undefined, setTimeout:()=>0, console:{log(){}} };
  new Function('window','document','setTimeout','console',src)(ctx.window, ctx.document, ctx.setTimeout, ctx.console);
  return ctx.window;
}

const src  = fs.readFileSync('ajustes_v52264_exe_numero_novo_patch.js','utf8');
const diag = fs.readFileSync('diagnostico_exe.js','utf8');
const html = fs.readFileSync('index.html','utf8');
const pkg  = JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const guia = fs.readFileSync('BUILD_EXE.md','utf8');

const P = load(src).EXE_NUMERO_NOVO_V52264_PURE;

console.log('== v5.22.64 — NÚMERO NOVO A CADA ENTREGA ==');

// ── 1. Versão ───────────────────────────────────────────────────────────────
ok('versão', P.VERSAO === '5.22.64' && pkg.version === '5.22.64');
ok('patch no bundle', manifest.includes('ajustes_v52264_exe_numero_novo_patch.js'));
ok('bundle carregado com a versão', html.indexOf('app.bundle.js?v='+pkg.version) >= 0);
ok('versão subiu em relação à 5.22.63', (() => {
  const n = v => v.split('.').map(Number);
  const a = n(pkg.version), b = n('5.22.63');
  return a[0] > b[0] || (a[0]===b[0] && (a[1] > b[1] || (a[1]===b[1] && a[2] > b[2])));
})());

// ── 2. Lógica pura ──────────────────────────────────────────────────────────
ok('versaoBate compara certo', P.versaoBate('5.22.64','5.22.64') && !P.versaoBate('5.22.63','5.22.64'));
ok('versaoBate ignora espaço', P.versaoBate(' 5.22.64 ','5.22.64'));
ok('nomeInstalador usa a versão', P.nomeInstalador('5.22.64') === 'Sistema-Digicopy-Setup-5.22.64.exe');
ok('nomeInstalador tem padrão', P.nomeInstalador() === 'Sistema-Digicopy-Setup-5.22.64.exe');
ok('marcadores do patch', P.numeroSempreNovo === true && P.temDiagnostico === true);

// ── 3. O patch não sequestra a versão global ────────────────────────────────
ok('respeita a versão do index.html', /DIGICOPY_APP_VERSION\s*\|\|\s*VERSAO/.test(src));
ok('não sobrescreve a versão global', !/window\.DIGICOPY_APP_VERSION\s*=\s*VERSAO\s*;/.test(src));
ok('pinta lendo a versão global', /window\.DIGICOPY_APP_VERSION\)\s*\|\|\s*VERSAO/.test(src));
ok('cuida do nome da janela', /document\.title\s*=\s*certo/.test(src));

// ── 4. Diagnóstico do .exe ──────────────────────────────────────────────────
ok('existe o diagnóstico', fs.existsSync('diagnostico_exe.js'));
ok('atalho npm run diag', pkg.scripts.diag === 'node diagnostico_exe.js');
ok('diagnóstico compara a digital do bundle', /lerSha/.test(diag) && /FONTE\.sha/.test(diag));
ok('diagnóstico procura a instalação do Windows', /LOCALAPPDATA/.test(diag) && /win-unpacked/.test(diag));
ok('diagnóstico reconhece o sintoma do rodapé', /só o rodapé atualiza/.test(diag));
ok('diagnóstico só lê, não escreve', !/writeFileSync|rmSync|unlinkSync|mkdirSync/.test(diag));
ok('diagnóstico caça outras cópias instaladas', /OUTRA CÓPIA ENCONTRADA/.test(diag) && /function varrer/.test(diag));
ok('diagnóstico mostra para onde os atalhos apontam', /alvoDoAtalho/.test(diag) && /Start Menu/.test(diag));
ok('diagnóstico avisa quando o build está ok mas nada foi instalado',
   /NÃO existe nenhum Sistema Digicopy instalado/.test(diag));
ok('diagnóstico lembra de fechar o app antes de instalar', /FECHE o Sistema Digicopy/.test(diag));
ok('diagnóstico não trava em pasta gigante', /visitados < \d+/.test(diag) && /profundidadeMax/.test(diag));

// ── 5. Documentação ─────────────────────────────────────────────────────────
ok('BUILD_EXE.md explica o número novo', guia.indexOf('5.22.64') >= 0 || /número novo/i.test(guia));
ok('BUILD_EXE.md cita o diagnóstico', guia.indexOf('npm run diag') >= 0);

// ── 6. APK segue parado ─────────────────────────────────────────────────────
ok('patch não mexe no APK', !/capacitor|android|apk/i.test(src));

console.log('\nRESULTADO: v5.22.64 passou!');
