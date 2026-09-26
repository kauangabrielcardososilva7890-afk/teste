// test_ajustes_v52417.js — v5.24.34: resposta à pergunta dele "se eu perder o
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
ok(av.includes('v5.24.34'), 'avisos: carimbo v5.24.34');
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
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(idx.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(idx.includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(idx.includes('app.bundle.js?v=' + pkg.version), 'index: cache-bust v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (erro.txt sobrevive ao F5 + baixar por resgate direto).');
