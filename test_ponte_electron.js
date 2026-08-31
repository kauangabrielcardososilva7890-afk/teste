// Teste da ponte Electron (v5.22.66)
// Garante que o preload não volte a expor objetos congelados com os
// nomes que os patches precisam envelopar — foi isso que derrubou o
// A1 da nuvem no .exe e não no navegador.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let falhas = 0;
function ok(nome, cond) {
  if (cond) console.log('  \u2714 ' + nome);
  else { console.log('  \u2718 ' + nome); falhas++; }
}

const raiz = __dirname;
const preload = fs.readFileSync(path.join(raiz, 'preload.js'), 'utf8');
const fonte = fs.readFileSync(path.join(raiz, 'ponte_electron_patch.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(raiz, 'bundle-manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));

// ---- carrega o patch num window de mentira -------------------------
function novaTela(pontes) {
  const win = { console: { log() {} } };
  win.window = win;
  if (pontes) win.__digicopyPontes = pontes;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  return win;
}

// ---- preload -------------------------------------------------------
const expostos = [...preload.matchAll(/exposeInMainWorld\(\s*'([^']+)'/g)].map(m => m[1]);
ok('preload expõe uma ponte só', expostos.length === 1);
ok('a ponte se chama __digicopyPontes', expostos[0] === '__digicopyPontes');

const proibidos = ['firebirdAPI', 'fileAPI', 'caixaEscolarAPI', 'printAPI', 'backupAPI', 'nfeCertAPI'];
ok('nenhuma API vai congelada direto para o window',
   proibidos.every(n => !expostos.includes(n)));

for (const nome of proibidos) {
  ok('a ponte continua entregando ' + nome,
     new RegExp('\\n\\s*' + nome + ':\\s*\\{').test(preload));
}
ok('assinar continua na ponte com os 3 argumentos',
   /assinar:\s*\(xml,\s*senha,\s*pfxB64\)/.test(preload));

// ---- ordem no bundle ------------------------------------------------
ok('ponte_electron_patch.js é o primeiro do bundle',
   manifest[0] === 'ponte_electron_patch.js');
ok('a ponte vem antes de quem usa nfeCertAPI',
   manifest.indexOf('ponte_electron_patch.js') <
   manifest.indexOf('ajustes_v52221_cert_nuvem_a1_patch.js'));

// ---- comportamento ---------------------------------------------------
const tela = novaTela({
  nfeCertAPI: Object.freeze({ assinar: () => 'original', isElectron: true }),
  printAPI: Object.freeze({ cleanPrint: () => 1 })
});

ok('publica os nomes de sempre no window',
   typeof tela.nfeCertAPI === 'object' && typeof tela.printAPI === 'object');
ok('mantém os métodos funcionando', tela.nfeCertAPI.assinar() === 'original');
ok('mantém os valores simples', tela.nfeCertAPI.isElectron === true);
ok('diz quais pontes abriu',
   Array.isArray(tela.__DIGICOPY_PONTES_ABERTAS) &&
   tela.__DIGICOPY_PONTES_ABERTAS.length === 2);

// o ponto do bug: agora dá para envelopar
let envelopou = true;
try {
  const velho = tela.nfeCertAPI.assinar;
  tela.nfeCertAPI.assinar = function () { return 'envelopado:' + velho(); };
} catch (e) { envelopou = false; }
ok('dá para trocar um método (era o erro do .exe)', envelopou);
ok('o envelope realmente vale', tela.nfeCertAPI.assinar() === 'envelopado:original');

// não pode estragar o navegador, onde não existe ponte nenhuma
const semPonte = novaTela(null);
ok('sem preload não quebra nada', semPonte.__DIGICOPY_PONTES_ABERTAS.length === 0);
ok('sem preload não inventa API', semPonte.nfeCertAPI === undefined);

const janelaExistente = { console: { log() {} } };
janelaExistente.window = janelaExistente;
Object.defineProperty(janelaExistente, 'nfeCertAPI', {
  value: Object.freeze({ assinar: () => 'travado' }), writable: false, configurable: true
});
janelaExistente.__digicopyPontes = { nfeCertAPI: Object.freeze({ assinar: () => 'da ponte' }) };
vm.createContext(janelaExistente);
vm.runInContext(fonte, janelaExistente);
ok('substitui até um global somente-leitura', janelaExistente.nfeCertAPI.assinar() === 'da ponte');

// ---- os dois patches que quebravam ------------------------------------
for (const arq of ['ajustes_v52221_cert_nuvem_a1_patch.js', 'ajustes_v52228_a1_nuvem_lupa_ncm_patch.js']) {
  const txt = fs.readFileSync(path.join(raiz, arq), 'utf8');
  ok(arq + ' continua envelopando assinar', /\.assinar\s*=\s*function/.test(txt));
  ok(arq + ' está no bundle', manifest.includes(arq));
}

// ---- API do módulo -----------------------------------------------------
const api = tela.PONTE_ELECTRON_PURE;
ok('expõe PONTE_ELECTRON_PURE', !!api);
ok('copiaGravavel devolve cópia solta', (() => {
  const congelado = Object.freeze({ a: 1 });
  const copia = api.copiaGravavel(congelado);
  copia.a = 2;
  return copia.a === 2 && congelado.a === 1;
})());
ok('copiaGravavel aguenta valor vazio', api.copiaGravavel(null) === null);
ok('abrir devolve lista vazia sem ponte', api.abrir({}, null).length === 0);
ok('versão do módulo bate com o package.json',
   api.VERSAO === '5.22.66' && /^5\.22\.\d+/.test(pkg.version));

// ---- não mexe no celular ------------------------------------------------
ok('patch não fala de APK/Capacitor', !/capacitor|cordova|apk/i.test(fonte));

console.log(falhas === 0
  ? '\nRESULTADO: ponte Electron passou!'
  : '\nRESULTADO: ' + falhas + ' falha(s) na ponte Electron');
process.exit(falhas === 0 ? 0 : 1);
