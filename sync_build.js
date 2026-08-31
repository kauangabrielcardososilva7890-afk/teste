// ═══════════════════════════════════════════════════════════════════════════
// SYNC_BUILD — mantém em sincronia AUTOMÁTICA tudo o que decide o que entra
// no .exe. Antes, cada atualização exigia 4 edições manuais:
//
//   1. bundle-manifest.json   (entrar no app.bundle.js)
//   2. index.html             (tag <script> + ?v= do cache)
//   3. package.json > build.files  (ser COPIADO para dentro do .exe)
//   4. package.json > scripts.check (validação de sintaxe)
//
// Esquecer o item 3 fazia o arquivo simplesmente NÃO ir para o instalador —
// o sistema abria com a versão nova no rodapé mas sem as mudanças novas.
// Agora só existe UMA fonte de verdade: bundle-manifest.json + index.html.
// Este script deriva os itens 2, 3 e 4 e falha o build se algo não bater.
//
// Uso:  node sync_build.js            → corrige/gera
//       node sync_build.js --check    → só valida (não escreve), sai 1 se sujo
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const fs = require('fs');
const path = require('path');

const CHECK = process.argv.includes('--check');

// Arquivos que o .exe SEMPRE precisa e que não aparecem como tag no index.html
// (são carregados pelo processo principal do Electron ou abertos sob demanda).
const BASE_FILES = [
  'package.json',
  'index.html',
  'main.js',
  'preload.js',
  'nfe_assinatura.js',
  'pix_pagar.html',
  'orcamento_pagar.html',
  'logo.png',
  'assets/icon.ico',
  'assets/vendor/**/*'
];

// Arquivos que passam pelo `node --check` além do que está no bundle.
const CHECK_EXTRA = ['clean_dist.js', 'nfe_assinatura.js', 'main.js', 'preload.js'];

const problemas = [];
const alteracoes = [];

function ler(f) { return fs.readFileSync(f, 'utf8'); }

// ─────────────────────────────────────────────────────────────────────────────
// 1. Fontes de verdade
// ─────────────────────────────────────────────────────────────────────────────
const pkg = JSON.parse(ler('package.json'));
const versao = String(pkg.version || '').trim();
if (!versao) { console.error('package.json sem "version".'); process.exit(1); }

const manifest = JSON.parse(ler('bundle-manifest.json'));
const faltandoNoDisco = manifest.filter(f => !fs.existsSync(f));
if (faltandoNoDisco.length) {
  console.error('Arquivos do bundle-manifest.json que não existem:\n  ' + faltandoNoDisco.join('\n  '));
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. index.html — carimba a versão em TODO lugar (título, rodapé, ?v= do cache)
// ─────────────────────────────────────────────────────────────────────────────
let html = ler('index.html');
const htmlOriginal = html;

html = html.replace(
  /(window\.DIGICOPY_APP_VERSION\s*=\s*')[^']*(')/,
  (_m, a, b) => a + versao + b
);
html = html.replace(
  /(<title>Sistema Digicopy v)[^<]*(<\/title>)/,
  (_m, a, b) => a + versao + b
);
html = html.replace(
  /(id="footer-version"[^>]*>)v[^<]*(<)/,
  (_m, a, b) => a + 'v' + versao + b
);

// Cache-busting: todo recurso LOCAL versionado pelo app recebe ?v=<versao>.
// Bibliotecas de terceiros em assets/vendor mantêm a versão própria delas.
html = html.replace(
  /(<script\s[^>]*src=")\.\/([A-Za-z0-9_.\-/]+\.js)(\?v=[^"]*)?(")/g,
  (m, pre, arquivo, _q, pos) => {
    if (arquivo.startsWith('assets/vendor/')) return m;
    return pre + './' + arquivo + '?v=' + versao + pos;
  }
);

if (html !== htmlOriginal) alteracoes.push('index.html (versão/cache-busting)');

// ── Desduplicação: script que já está DENTRO do app.bundle.js não pode ser
// carregado de novo como tag solta. Antes, 15 patches eram lidos e executados
// DUAS VEZES a cada abertura (216 KB a mais de leitura/parse, 6 ouvintes e 52
// setTimeout registrados em dobro) — peso puro em PC fraco, além de causar
// efeito duplicado nos patches sem guarda.
const antesDedup = html;
const removidos = [];
html = html.replace(
  /[ \t]*<script\s[^>]*src="\.\/([A-Za-z0-9_.\-/]+\.js)(?:\?[^"]*)?"[^>]*>\s*<\/script>\r?\n?/g,
  (m, arquivo) => {
    if (arquivo === 'app.bundle.js' || arquivo.startsWith('assets/vendor/')) return m;
    if (manifest.includes(arquivo)) { removidos.push(arquivo); return ''; }
    return m;
  }
);
if (html !== antesDedup) {
  alteracoes.push(`index.html: ${removidos.length} script(s) duplicado(s) do bundle removido(s)`);
}

// Recursos locais que o index.html realmente carrega.
const refsHtml = [];
const reRef = /(?:src|href)="\.\/([A-Za-z0-9_.\-/]+?)(?:\?[^"]*)?"/g;
let m;
while ((m = reRef.exec(html)) !== null) if (!refsHtml.includes(m[1])) refsHtml.push(m[1]);

for (const ref of refsHtml) {
  if (!fs.existsSync(ref)) problemas.push(`index.html aponta para "${ref}", que NÃO existe no projeto.`);
}

// Scripts soltos (fora do bundle) que o index.html carrega.
const scriptsSoltos = refsHtml.filter(
  f => f.endsWith('.js') && f !== 'app.bundle.js' && !f.startsWith('assets/vendor/')
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. build.files — derivado, nunca mais escrito à mão
// ─────────────────────────────────────────────────────────────────────────────
const cobertoPorGlob = f => f.startsWith('assets/');

const filesEsperado = [];
const push = f => { if (!filesEsperado.includes(f)) filesEsperado.push(f); };

BASE_FILES.forEach(push);
refsHtml.filter(f => !cobertoPorGlob(f)).forEach(push);

for (const f of filesEsperado) {
  if (f.includes('*')) continue;
  if (!fs.existsSync(f)) problemas.push(`build.files precisa de "${f}", que NÃO existe no projeto.`);
}

const filesAtual = pkg.build.files || [];
const filesMudou = JSON.stringify(filesAtual) !== JSON.stringify(filesEsperado);
if (filesMudou) {
  const sumiram = filesEsperado.filter(f => !filesAtual.includes(f));
  const sobraram = filesAtual.filter(f => !filesEsperado.includes(f));
  if (sumiram.length) alteracoes.push('build.files += ' + sumiram.join(', '));
  if (sobraram.length) alteracoes.push('build.files -= ' + sobraram.join(', '));
  if (!sumiram.length && !sobraram.length) alteracoes.push('build.files (ordem)');
  pkg.build.files = filesEsperado;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. scripts.check — derivado do bundle + extras
// ─────────────────────────────────────────────────────────────────────────────
const checkEsperado = ['node build_bundle.js --check']
  .concat(manifest.map(f => 'node --check ' + f))
  .concat(scriptsSoltos.filter(f => !manifest.includes(f)).map(f => 'node --check ' + f))
  .concat(CHECK_EXTRA.map(f => 'node --check ' + f))
  .join(' && ');

if (pkg.scripts.check !== checkEsperado) {
  alteracoes.push('scripts.check');
  pkg.scripts.check = checkEsperado;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Relatório / escrita
// ─────────────────────────────────────────────────────────────────────────────
if (problemas.length) {
  console.error('\n✘ SYNC_BUILD encontrou problemas que impedem um .exe correto:\n');
  problemas.forEach(p => console.error('   • ' + p));
  console.error('');
  process.exit(1);
}

if (!alteracoes.length) {
  console.log(`Sync OK: v${versao} | ${manifest.length} no bundle | ${scriptsSoltos.length} soltos | ${filesEsperado.length} entradas em build.files`);
  process.exit(0);
}

if (CHECK) {
  console.error('\n✘ Configuração do build está DESATUALIZADA:\n');
  alteracoes.forEach(a => console.error('   • ' + a));
  console.error('\n   Rode: npm run sync\n');
  process.exit(1);
}

fs.writeFileSync('index.html', html);
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log(`Sync aplicado (v${versao}):`);
alteracoes.forEach(a => console.log('   • ' + a));
