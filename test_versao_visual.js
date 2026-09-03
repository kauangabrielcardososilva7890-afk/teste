// ═══════════════════════════════════════════════════════════════════════════
// TESTE — versão exibida na tela (rodapé + nome da janela)
//
// Bug corrigido na v5.22.63: seis patches faziam
//     window.DIGICOPY_APP_VERSION = VERSAO;
// com a versão FIXA deles, sobrescrevendo a versão real definida no
// index.html. O último a rodar (v5.22.60) vencia, e o sistema mostrava
// "v5.22.60" no rodapé e "Sistema Digicopy v5.22.60" no nome da janela,
// mesmo estando na 5.22.63.
//
// Este teste impede a volta do problema de três formas: proíbe sobrescrever a
// versão global, proíbe pintar a tela com versão fixa e simula a ordem real
// de carregamento conferindo o resultado final.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }

const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const html = fs.readFileSync('index.html','utf8');
const VER = pkg.version;

console.log('== VERSÃO NA TELA ==');

// ── 1. index.html é a fonte da verdade ──────────────────────────────────────
ok('index.html define a versão real', html.indexOf("window.DIGICOPY_APP_VERSION = '"+VER+"'") >= 0);
ok('título do index está na versão', html.indexOf('<title>Sistema Digicopy v'+VER+'</title>') >= 0);
ok('rodapé do index está na versão', new RegExp('id="footer-version"[^>]*>v'+VER.replace(/\./g,'\\.')+'<').test(html));

// ── 2. Ninguém pode sobrescrever a versão global ────────────────────────────
const clobber = manifest.filter(f => /window\.DIGICOPY_APP_VERSION\s*=\s*VERSAO\s*;/.test(fs.readFileSync(f,'utf8')));
ok('nenhum patch sobrescreve a versão global' + (clobber.length ? ' → ' + clobber.join(', ') : ''),
   clobber.length === 0);

// ── 3. Ninguém pinta a tela com versão fixa ─────────────────────────────────
const reFixa = /(?:textContent|document\.title)\s*=\s*'[^']*'\s*\+\s*VERSAO\b/;
const pintaFixo = manifest.filter(f => {
  const s = fs.readFileSync(f,'utf8');
  if (!/footer-version|app-title-version|document\.title\s*=/.test(s)) return false;
  return reFixa.test(s);
});
ok('nenhum patch pinta rodapé/título com versão fixa' + (pintaFixo.length ? ' → ' + pintaFixo.join(', ') : ''),
   pintaFixo.length === 0);

// ── 4. Simulação da ordem real de carregamento ──────────────────────────────
// index.html define a versão; depois os scripts do bundle rodam em ordem.
const win = { DIGICOPY_APP_VERSION: VER };
let rodape = 'v' + VER;
let titulo = 'Sistema Digicopy v' + VER;

for (const f of manifest) {
  const s = fs.readFileSync(f, 'utf8');
  const mv = /var VERSAO\s*=\s*'([0-9.]+)'/.exec(s);
  if (!mv) continue;
  const VERSAO = mv[1];

  if (/window\.DIGICOPY_APP_VERSION\s*=\s*VERSAO\s*;/.test(s)) {
    win.DIGICOPY_APP_VERSION = VERSAO;                       // sobrescreve (proibido)
  } else if (/window\.DIGICOPY_APP_VERSION\s*=\s*window\.DIGICOPY_APP_VERSION\s*\|\|\s*VERSAO\s*;/.test(s)) {
    win.DIGICOPY_APP_VERSION = win.DIGICOPY_APP_VERSION || VERSAO;   // respeita (correto)
  }

  const leGlobal = /_vUI|curV/.test(s);
  if (/footer-version/.test(s)) {
    rodape = 'v' + (leGlobal ? win.DIGICOPY_APP_VERSION : VERSAO);
  }
  if (/document\.title\s*=/.test(s) && /Sistema Digicopy v/.test(s)) {
    titulo = 'Sistema Digicopy v' + (leGlobal ? win.DIGICOPY_APP_VERSION : VERSAO);
  }
}

ok('versão global sobrevive aos ' + manifest.length + ' scripts (v' + win.DIGICOPY_APP_VERSION + ')',
   win.DIGICOPY_APP_VERSION === VER);
ok('rodapé termina em v' + VER + ' (viu: ' + rodape + ')', rodape === 'v' + VER);
ok('nome da janela termina em v' + VER + ' (viu: ' + titulo + ')', titulo === 'Sistema Digicopy v' + VER);

// ── 5. O último painter é o da versão atual e cuida do título ───────────────
const ultimo = fs.readFileSync('ajustes_v52263_exe_completo_patch.js','utf8');
ok('painter final acerta o nome da janela', /document\.title = tituloCerto/.test(ultimo));
ok('painter final lê a versão global', /window\.DIGICOPY_APP_VERSION/.test(ultimo));

console.log('\nRESULTADO: versão na tela passou!');
