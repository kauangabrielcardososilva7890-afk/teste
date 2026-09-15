// test_ajustes_v52420.js — v5.24.30: pedido dele "muda a estrutura completa
// pro pago + deixa anotado que é teste de 1 mês". Fecho do idioma "grátis"
// (último texto visível: a ficha do backup diário) + PONTO DE RECUO escrito
// no próprio worker (trocar 2 números + npm run deploy = volta ao grátis em
// 5 minutos, sem risco).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const bu = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const sync = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const dsyn = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');

// Ficha do backup diário — era o último que falava grátis/21h/diário:
ok(!bu.includes('plano grátis atingiu o LIMITE DIÁRIO'), 'backup: "plano grátis / LIMITE DIÁRIO" FORA');
ok(bu.includes('do período (bem raro no plano pago)'), 'backup: fala a verdade do plano pago');
ok(bu.includes('o backup diário das 18:30 tenta de novo sozinho'), 'backup: promessa do 18:30 intacta');
ok(bu.includes('Se isso aparecer de novo, me avise'), 'backup: linha direta com ele intacta');

// Varredura: nenhum texto VISÍVEL restante fala grátis/21h como regra:
ok(!sync.includes('teto grátis') && !dsyn.includes('nuvem grátis') && !bu.includes('plano grátis atingiu'),
   'varredura final: nenhuma string visível sobrevive do idioma-grátis');

// PONTO DE RECUO (exigência dele: anotado e fechável em 5 minutos):
ok(wk.includes('TESTE DE 1 MÊS') && wk.includes('PONTO DE RECUO'), 'worker: ponto de recuo escrito no código');
ok(wk.includes('(100000, 5000000)') && wk.includes('(50000000, 25000000000)'), 'worker: receita do recuo com os números exatos');
ok(wk.includes('npm run deploy'), 'worker: comando do recuo indicado na fonte');
ok(/tetoEscritas: 50000000/.test(wk) && /tetoLeituras: 25000000000/.test(wk), 'worker: tetos pagos seguem valendo');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('bem raro no plano pago'), 'bundle: ficha nova dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('bem raro no plano pago'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '5.24.30'"), 'index: versão 5.24.30');
ok(fs.readFileSync('index.html', 'utf8').includes('>v5.24.30<'), 'index: rodapé v5.24.30');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.24.30"'), 'package.json 5.24.30');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.30 (estrutura no idioma pago + ponto de recuo de 1 mês).');
