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

// ── Caça-cópias: procura QUALQUER Sistema Digicopy instalado na máquina ─────
// Se o programa que você abre não está em nenhuma pasta padrão, é aqui que ele
// aparece. Varredura rasa e com limite, para não demorar.
const IGNORAR_DIR = new Set(['node_modules', '.git', 'Temp', 'Windows', 'ProgramData',
  'WindowsApps', '$Recycle.Bin', 'System Volume Information', 'Cache', 'Code Cache']);

function varrer(raiz, profundidadeMax){
  const achados = [];
  const fila = [[raiz, 0]];
  let visitados = 0;
  while (fila.length && visitados < 6000) {
    const [dir, nivel] = fila.shift();
    visitados++;
    let itens;
    try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch(e){ continue; }
    for (const it of itens) {
      if (!it.isDirectory()) {
        if (it.name === 'app.bundle.js' && /(\\|\/)resources(\\|\/)app$/i.test(dir)) achados.push(dir);
        continue;
      }
      if (IGNORAR_DIR.has(it.name)) continue;
      if (nivel < profundidadeMax) fila.push([path.join(dir, it.name), nivel + 1]);
    }
  }
  return achados;
}

const RAIZES = [
  [LOCAL ? path.join(LOCAL, 'Programs') : null, 4],
  [PROG, 3],
  [PROG86, 3],
  [os.homedir(), 4],
  ['C:\\', 2]
].filter(r => r[0] && existe(r[0]));

const encontradasExtra = [];
for (const [raiz, prof] of RAIZES) {
  for (const d of varrer(raiz, prof)) {
    const jaListada = CANDIDATOS.some(([, p]) => path.resolve(p) === path.resolve(d));
    if (!jaListada && !encontradasExtra.includes(d)) encontradasExtra.push(d);
  }
}
for (const d of encontradasExtra) CANDIDATOS.push(['OUTRA CÓPIA ENCONTRADA', d]);

// ── Para onde apontam os atalhos ────────────────────────────────────────────
function alvoDoAtalho(lnk){
  try {
    const b = fs.readFileSync(lnk);
    const txt = b.toString('latin1');
    const m = txt.match(/[A-Za-z]:\\[^\0]{0,240}?\.exe/g);
    if (!m) return null;
    const digi = m.filter(x => /digicopy/i.test(x));
    return (digi[0] || m[m.length - 1]) || null;
  } catch(e){ return null; }
}
const PASTAS_ATALHO = [
  path.join(os.homedir(), 'Desktop'),
  path.join(os.homedir(), 'OneDrive', 'Desktop'),
  path.join(os.homedir(), 'OneDrive', 'Área de Trabalho'),
  path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs')
];
const atalhos = [];
for (const pasta of PASTAS_ATALHO) {
  if (!existe(pasta)) continue;
  let itens;
  try { itens = fs.readdirSync(pasta); } catch(e){ continue; }
  for (const nome of itens) {
    if (!/\.lnk$/i.test(nome) || !/digicopy/i.test(nome)) continue;
    const alvo = alvoDoAtalho(path.join(pasta, nome));
    atalhos.push({ nome, pasta, alvo: alvo || '(não consegui ler)' });
  }
}

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

// ── Atalhos: qual .exe você abre de verdade ─────────────────────────────────
console.log('  ── atalhos do Sistema Digicopy');
if (!atalhos.length) {
  console.log('     nenhum atalho encontrado na Área de Trabalho nem no Menu Iniciar.');
  console.log('     Se você abre o programa de outro jeito, me diga qual.');
} else {
  for (const a of atalhos) {
    console.log('     ' + a.nome);
    console.log('        aponta para: ' + a.alvo);
  }
}
console.log('');

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

// ── 3b. Log de falhas do bundle (gravado pelo próprio app) ──────────────────
// Cada script do bundle roda no seu try/catch; se algum falhar, o main.js
// registra aqui. É este arquivo que diz POR QUE algo não aparece na tela.
let logLido = false;
for (const nome of ['digicopy-erp', 'Sistema Digicopy']) {
  const log = path.join(APPDATA, nome, 'log-erros.txt');
  if (!existe(log)) continue;
  logLido = true;
  let linhas = [];
  try { linhas = String(fs.readFileSync(log, 'utf8')).trim().split(/\r?\n/); } catch(e){}
  const ultimas = linhas.slice(-40);
  console.log('  ── log de falhas do app (' + nome + ')');
  console.log('     arquivo: ' + log);
  if (!ultimas.length) {
    console.log('     (vazio)');
  } else {
    ultimas.forEach(l => console.log('     ' + l));
    const falhou = ultimas.filter(l => /FALHOU|NÃO CHEGOU AO FIM|SCRIPTS QUE FALHARAM|•/.test(l));
    if (falhou.length) {
      problemas.push('o app registrou ' + falhou.length + ' linha(s) de falha ao carregar os scripts — veja o log acima.');
    }
  }
  console.log('');
}
if (!logLido) {
  console.log('  ── log de falhas do app');
  console.log('     ainda não existe. Abra o Sistema Digicopy uma vez e rode este');
  console.log('     diagnóstico de novo — o log é criado na primeira abertura.');
  console.log('');
}

// ── 4. Veredito ─────────────────────────────────────────────────────────────
const temDist = existe(path.join('dist', 'win-unpacked', 'resources', 'app'));
const temInstalacao = CANDIDATOS.some(([rotulo, dir]) => rotulo !== 'recém gerado (dist)' && existe(dir));

console.log('═══════════════════════════════════════════════════════════════');
if (problemas.length) {
  console.log('  PROBLEMA ENCONTRADO:');
  problemas.forEach(p => console.log('   • ' + p));
  console.log('');
  console.log('  O que fazer, nesta ordem:');
  console.log('   1) FECHE o Sistema Digicopy (se estiver aberto, o Windows não');
  console.log('      consegue substituir os arquivos e a instalação fica velha)');
  console.log('   2) npm run build:win');
  console.log('   3) DESINSTALE o Sistema Digicopy pelo Painel de Controle');
  console.log('   4) instale dist\\Sistema-Digicopy-Setup-' + FONTE.versao + '.exe');
} else if (temDist && !temInstalacao) {
  console.log('  O .exe GERADO está correto — bate 100% com o código-fonte.');
  console.log('');
  console.log('  Mas NÃO existe nenhum Sistema Digicopy instalado nesta máquina.');
  console.log('  Ou seja: o instalador novo ainda não foi executado. O programa');
  console.log('  que você abre no dia a dia não é este build.');
  console.log('');
  console.log('  Faça assim:');
  console.log('   1) FECHE o Sistema Digicopy se estiver aberto');
  console.log('   2) Painel de Controle > Programas > desinstale o Sistema Digicopy');
  console.log('   3) abra a pasta  dist\\  e execute:');
  console.log('        Sistema-Digicopy-Setup-' + FONTE.versao + '.exe');
  console.log('      (confira o número ' + FONTE.versao + ' no nome do arquivo)');
  console.log('   4) rode  npm run diag  de novo: tem que aparecer "instalado"');
  console.log('');
  console.log('  Para testar AGORA sem instalar, abra direto:');
  console.log('        dist\\win-unpacked\\Sistema Digicopy.exe');
} else if (achou) {
  console.log('  Tudo bate com o código-fonte. O que está instalado é o atual.');
} else {
  console.log('  Nada para comparar ainda. Rode:  npm run build:win');
}
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
