// test_ajustes_v52414.js — v5.24.25: bug relatado por ele (modelinho preenchido!)
// "criei usuário novo, salvei, testei o login -> 'Informe usuário e senha'".
// Recon provou a fiação íntegra (form/save/login nos mesmos campos); a falha
// era SILENCIOSA por desenho. Fix de raiz (sem adivinhar): (A) saveUsuarioFinal
// ganha PROVA DE GRAVAÇÃO — confere o registro do jeito que o login procura e
// grita se não gravou; (B) doLoginUser ganha diagnóstico partido — diz se o
// usuário não existe, se está INATIVO, ou se é a senha (mesmo fold do juiz).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const v5196 = fs.readFileSync('ajustes_v5196_patch.js', 'utf8');
ok(v5196.includes('v5.24.25'), 'v5196: carimbo da prova de gravação');
ok(v5196.includes('provaLogin'), 'v5196: verifica o registro salvo (provaLogin)');
ok(v5196.includes('Login pra testar: '), 'v5196: sucesso CONFIRMA o login exato pra ele');
ok(v5196.includes('O usuário NÃO ficou gravado como deveria'), 'v5196: falha silenciosa agora Grita (lfbAlert)');
ok(v5196.includes('fold(x.login) === login && txt(x.senha) === senha && x.ativo'),
   'v5196: prova compara do MESMO jeito que o login procura (login+senha+ativo)');

const v52253 = fs.readFileSync('ajustes_v52253_login_tela_branca_patch.js', 'utf8');
ok(v52253.includes('v5.24.25'), 'v52253: carimbo do diagnóstico partido');
ok(v52253.includes('não existe neste PC'), 'login: erro diz quando o USUÁRIO não existe');
ok(v52253.includes('está INATIVO'), 'login: erro diz quando o usuário está INATIVO');
ok(v52253.includes('Senha não confere para '), 'login: erro diz quando a SENHA não bate');
ok(v52253.includes("(typeof fold === 'function') ? fold"),
   'login: diagnóstico usa o MESMO fold do loginFlexivel (compara igual)');
ok(!/toast\('Usuário ou senha incorreto'/.test(v52253),
   'login: erro genérico antigo saiu do caminho do doLoginUser');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('provaLogin'), 'bundle: prova de gravação presente');
ok(bundle.includes('não existe neste PC'), 'bundle: diagnóstico partido presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('provaLogin'), 'bundle do CELULAR igual');

const idx = fs.readFileSync('index.html', 'utf8');
ok(idx.includes("DIGICOPY_APP_VERSION = '5.24.25'"), 'index: versão 5.24.25');
ok(idx.includes('>v5.24.25<'), 'index: rodapé 5.24.25');
ok(idx.includes('app.bundle.js?v=5.24.25'), 'index: cache-bust 5.24.25');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.24.25"'), 'package.json 5.24.25');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.25 (usuário novo: salvar prova que gravou; login diz o que errou).');
