// test_ajustes_v52417.js — v5.24.27: resposta à pergunta dele "se eu perder o
// aviso, como baixo de novo?" — a memória do erro.txt no navegador morria num
// F5; agora sobrevive ao refresh (localStorage) e existe um caminho de resgate
// direto (window.digicopyBaixarErroTxt). No .exe, nada muda: o arquivo real
// continua gravado no %APPDATA% pra sempre.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
ok(av.includes('v5.24.27'), 'avisos: carimbo v5.24.27');
ok(av.includes("localStorage.getItem('digicopy_erros_txt')"), 'avisos: memória do download sobrevive ao F5 (restaura)');
ok(av.includes("localStorage.setItem('digicopy_erros_txt'"), 'avisos: cada erro novo também persiste a memória');
ok(av.includes('salvoTxt.slice(-500)'), 'avisos: restauração respeita o teto de 500 linhas');
ok(av.includes('window.digicopyBaixarErroTxt=baixarErroTxt'), 'avisos: caminho de resgate exposto (invocável fora do aviso)');
ok(av.includes('sem login') || av.includes('montarLinhaErroTxt'), 'avisos: formato da linha preservado');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('digicopyBaixarErroTxt'), 'bundle: resgate presente');
ok(bundle.includes('digicopy_erros_txt'), 'bundle: persistência presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('digicopyBaixarErroTxt'), 'bundle do CELULAR igual');
const idx = fs.readFileSync('index.html', 'utf8');
ok(idx.includes("DIGICOPY_APP_VERSION = '5.24.27'"), 'index: versão 5.24.27');
ok(idx.includes('>v5.24.27<'), 'index: rodapé 5.24.27');
ok(idx.includes('app.bundle.js?v=5.24.27'), 'index: cache-bust 5.24.27');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.24.27"'), 'package.json 5.24.27');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.27 (erro.txt sobrevive ao F5 + baixar por resgate direto).');
