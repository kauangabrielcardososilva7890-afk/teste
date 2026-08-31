// ═══════════════════════════════════════════════════════════════════════════
// DIAGNÓSTICO DO .EXE  —  rode na máquina Windows:  node diagnostico_exe.js
//
// Responde a pergunta "gerei o .exe e as atualizações não vieram".
// Não altera nada: só lê e compara.
//
// Compara o CÓDIGO-FONTE desta pasta com o que está REALMENTE dentro de:
//   • dist\win-unpacked  (o que o electron-builder acabou de gerar)
//   • a instalação do Sistema Digicopy (o que abre quando você clica no ícone)
//
// Assim dá para saber se o problema é no build ou na instalação.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const os = require('os');

function existe(p){ try{ return fs.existsSync(p); }catch(e){ return false; } }
function lerSha(arquivoBundle){
  // o sha256 fica no cabeçalho gravado pelo build_bundle.js
  try{
    const fd = fs.openSync(arquivoBundle, 'r');
    const buf = Buffer.alloc(512);
    const n = fs.readSync(fd, buf, 0, 512, 0);
    fs.closeSync(fd);
    const m = /sha256:\s*([0-9a-f]+)/.exec(buf.toString('utf8', 0, n));
    return m ? m[1] : '(sem digital)';
  }catch(e){ return '(ilegível)'; }
}
function contarScripts(arquivoBundle){
  try{
    const s = fs.readFileSync(arquivoBundle, 'utf8');
    return (s.match(/^\/\/ ─+ /gm) || []).length || (s.match(/DIGICOPY_BUNDLE_FILE/g) || []).length;
  }catch(e){ return 0; }
}
function versaoDoIndex(arquivoIndex){
  try{
    const s = fs.readFileSync(arquivoIndex, 'utf8');
    const m = /window\.DIGICOPY_APP_VERSION\s*=\s*'([^']+)'/.exec(s);
    return m ? m[1] : '(não achei)';
  }catch(e){ return '(ilegível)'; }
}

// ── 1. A verdade: o código-fonte desta pasta ────────────────────────────────
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const FONTE = {
  versao: pkg.version,
  sha: lerSha('app.bundle.js'),
  scripts: contarScripts('app.bundle.js'),
  bytes: existe('app.bundle.js') ? fs.statSync('app.bundle.js').size : 0,
  indexVersao: versaoDoIndex('index.html')
};

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  DIAGNÓSTICO DO .EXE — Sistema Digicopy');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('  CÓDIGO-FONTE (esta pasta) — é com isto que tudo tem que bater:');
console.log('    versão no package.json : ' + FONTE.versao);
console.log('    versão no index.html   : ' + FONTE.indexVersao);
console.log('    digital do bundle      : ' + FONTE.sha);
console.log('    tamanho do bundle      : ' + (FONTE.bytes/1048576).toFixed(2) + ' MB');
console.log('');

if (FONTE.versao !== FONTE.indexVersao) {
  console.log('  ⚠ package.json e index.html estão diferentes. Rode: npm run sync');
  console.log('');
}

// ── 2. Onde procurar cópias instaladas ──────────────────────────────────────
const LOCAL = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const PROG  = process.env.PROGRAMFILES || 'C:\\Program Files';
const PROG86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';

const CANDIDATOS = [
  ['recém gerado (dist)', path.join('dist', 'win-unpacked', 'resources', 'app')],
  ['instalado (usuário)', path.join(LOCAL, 'Programs', 'Sistema Digicopy', 'resources', 'app')],
  ['instalado (máquina)', path.join(PROG, 'Sistema Digicopy', 'resources', 'app')],
  ['instalado (x86)',     path.join(PROG86, 'Sistema Digicopy', 'resources', 'app')],
  ['instalado (digicopy-erp)', path.join(LOCAL, 'Programs', 'digicopy-erp', 'resources', 'app')]
];

let achou = 0;
let problemas = [];

for (const [rotulo, dir] of CANDIDATOS) {
  if (!existe(dir)) continue;
  achou++;
  const bundle = path.join(dir, 'app.bundle.js');
  const indexH = path.join(dir, 'index.html');
  const pkgP   = path.join(dir, 'package.json');

  const temBundle = existe(bundle);
  const sha = temBundle ? lerSha(bundle) : '(ARQUIVO NÃO EXISTE)';
  const vIdx = existe(indexH) ? versaoDoIndex(indexH) : '(ARQUIVO NÃO EXISTE)';
  let vPkg = '(não achei)';
  try { vPkg = JSON.parse(fs.readFileSync(pkgP, 'utf8')).version; } catch(e) {}
  const mtime = temBundle ? fs.statSync(bundle).mtime.toLocaleString() : '-';

  const bundleOk = sha === FONTE.sha;
  const indexOk  = vIdx === FONTE.versao;

  console.log('  ── ' + rotulo);
  console.log('     pasta         : ' + dir);
  console.log('     versão pkg    : ' + vPkg + (vPkg === FONTE.versao ? '  OK' : '  ANTIGA'));
  console.log('     versão index  : ' + vIdx + (indexOk ? '  OK' : '  ANTIGA'));
  console.log('     digital bundle: ' + sha + (bundleOk ? '  OK' : '  ANTIGA'));
  console.log('     bundle salvo em: ' + mtime);
  console.log('');

  if (!bundleOk && indexOk) {
    problemas.push(rotulo + ': o index.html é NOVO mas o app.bundle.js é ANTIGO — '
      + 'é exatamente o sintoma de "só o rodapé atualiza".');
  } else if (!bundleOk) {
    problemas.push(rotulo + ': o app.bundle.js não é o desta pasta.');
  }
}

if (!achou) {
  console.log('  Não encontrei nenhuma instalação nem dist\\win-unpacked.');
  console.log('  Rode este script na pasta do projeto, na máquina Windows,');
  console.log('  depois de gerar o .exe com:  npm run build:win');
  console.log('');
}

// ── 3. Marcador de cache do Electron ────────────────────────────────────────
const APPDATA = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
for (const nome of ['Sistema Digicopy', 'digicopy-erp']) {
  const marker = path.join(APPDATA, nome, 'app-version.txt');
  if (existe(marker)) {
    const conteudo = String(fs.readFileSync(marker, 'utf8')).trim();
    const esperado = FONTE.versao + '|' + FONTE.sha;
    console.log('  ── marcador de cache (' + nome + ')');
    console.log('     gravado : ' + conteudo);
    console.log('     esperado: ' + esperado);
    console.log('     ' + (conteudo === esperado
      ? 'OK — o app já abriu nesta versão e limpou o cache.'
      : 'diferente — na próxima abertura o cache será limpo (isso é normal).'));
    console.log('');
  }
}

// ── 4. Veredito ─────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════');
if (problemas.length) {
  console.log('  PROBLEMA ENCONTRADO:');
  problemas.forEach(p => console.log('   • ' + p));
  console.log('');
  console.log('  O que fazer, nesta ordem:');
  console.log('   1) npm run bundle          (regera o app.bundle.js)');
  console.log('   2) npm run build:win       (build completo e verificado)');
  console.log('   3) DESINSTALE o Sistema Digicopy pelo Painel de Controle');
  console.log('   4) instale o novo dist\\Sistema-Digicopy-Setup-'+FONTE.versao+'.exe');
} else if (achou) {
  console.log('  Tudo bate com o código-fonte. O que está instalado é o atual.');
} else {
  console.log('  Nada para comparar ainda.');
}
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
