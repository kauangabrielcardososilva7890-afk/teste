// ═══════════════════════════════════════════════════════════════════════════
// build_bundle.js — junta os scripts do bundle-manifest.json num app.bundle.js
//
// ISOLAMENTO DE ERRO (v5.22.65)
// Antes os 186 scripts eram colados num arquivo só, sem separação. Como é um
// único arquivo, um erro de execução em QUALQUER um deles aborta o resto: os
// scripts seguintes simplesmente nunca rodam. Era o que fazia "faltar muita
// coisa" no .exe — o navegador (GitHack) e o Electron (file://) não têm as
// mesmas permissões, então um patch que funciona no site pode falhar no .exe e
// derrubar tudo que vem depois dele.
//
// Agora cada script que pode ser isolado entra dentro do seu próprio
// try/catch. Se um falhar, os outros 185 continuam funcionando e o erro fica
// registrado em window.__DIGICOPY_ERROS (e vai para o log do Electron).
//
// Só ficam FORA do try/catch os arquivos que declaram coisas no escopo global
// (var/function/class no topo) — envolvê-los mudaria o escopo e quebraria o
// sistema. Isso é detectado lendo o código de verdade (acorn), não por lista
// escrita à mão.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const crypto = require('crypto');

const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const missing = manifest.filter(file => !fs.existsSync(file));
if (missing.length) throw new Error('Arquivos ausentes no bundle: ' + missing.join(', '));

// ── Quem pode ser isolado ───────────────────────────────────────────────────
let acorn = null;
try { acorn = require('acorn'); } catch (e) { acorn = null; }

function declaraNoEscopoGlobal(src, arquivo) {
  if (!acorn) return true;                       // sem parser: não arrisca, não isola
  try {
    const ast = acorn.parse(src, { ecmaVersion: 2022 });
    return ast.body.some(n =>
      n.type === 'VariableDeclaration' ||
      n.type === 'FunctionDeclaration' ||
      n.type === 'ClassDeclaration');
  } catch (e) {
    console.error('  ! não consegui analisar ' + arquivo + ': ' + e.message + ' — ficará sem isolamento');
    return true;
  }
}

if (!acorn) {
  console.error('  ! acorn não encontrado: bundle será gerado SEM isolamento de erro.');
  console.error('    Rode: npm install');
}

// ── Prelúdio: coletor de erros ──────────────────────────────────────────────
const PRELUDIO = `
/* ===== isolamento de erro (gerado pelo build_bundle.js) ===== */
(function(){
  if (typeof window === 'undefined') return;
  window.__DIGICOPY_ERROS = window.__DIGICOPY_ERROS || [];
  window.__DIGICOPY_FALHA = function(arquivo, erro){
    try{
      var msg = (erro && (erro.stack || erro.message)) || String(erro);
      window.__DIGICOPY_ERROS.push({ arquivo: arquivo, erro: msg });
      if (typeof console !== 'undefined' && console.error){
        console.error('[DIGICOPY][FALHOU] ' + arquivo + ' -> ' + msg);
      }
    }catch(e){}
  };
})();
`;

let isolados = 0, globais = [];
const partes = manifest.map(file => {
  const src = fs.readFileSync(file, 'utf8');
  if (declaraNoEscopoGlobal(src, file)) {
    globais.push(file);
    return `\n/* ===== ${file} (escopo global) ===== */\n${src}\n;\n`;
  }
  isolados++;
  return `\n/* ===== ${file} ===== */\ntry{\n${src}\n}catch(e){ if(typeof window!=='undefined'&&window.__DIGICOPY_FALHA) window.__DIGICOPY_FALHA(${JSON.stringify(file)}, e); }\n;\n`;
});

// ── Epílogo: prova de que o bundle chegou ao fim ────────────────────────────
const EPILOGO = `
/* ===== fim do bundle (gerado pelo build_bundle.js) ===== */
(function(){
  if (typeof window === 'undefined') return;
  window.__DIGICOPY_BUNDLE_COMPLETO = true;
  window.__DIGICOPY_BUNDLE_SCRIPTS = ${manifest.length};
  try{
    var n = (window.__DIGICOPY_ERROS || []).length;
    if (typeof console !== 'undefined' && console.log){
      console.log('[DIGICOPY] bundle completo: ${manifest.length} scripts, ' + n + ' com falha');
    }
    if (n && typeof localStorage !== 'undefined'){
      localStorage.setItem('digicopy_erros_bundle', JSON.stringify(window.__DIGICOPY_ERROS).slice(0, 8000));
    }
  }catch(e){}
})();
`;

const body = PRELUDIO + partes.join('') + EPILOGO;
const hash = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
const output = `/* DIGICOPY APP BUNDLE — gerado; não editar diretamente\n * scripts: ${manifest.length} | sha256: ${hash}\n */\n${body}`;

if (process.argv.includes('--check')) {
  if (!fs.existsSync('app.bundle.js') || fs.readFileSync('app.bundle.js', 'utf8') !== output) {
    console.error('app.bundle.js está desatualizado. Execute: npm run bundle'); process.exit(1);
  }
  console.log(`Bundle OK: ${manifest.length} scripts, sha256 ${hash}`);
} else {
  fs.writeFileSync('app.bundle.js', output);
  console.log(`Bundle gerado: ${manifest.length} scripts, sha256 ${hash}`);
  console.log(`  isolados contra erro: ${isolados} | no escopo global: ${globais.length} (${globais.join(', ')})`);
}
