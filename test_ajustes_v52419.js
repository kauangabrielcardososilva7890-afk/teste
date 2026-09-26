// test_ajustes_v52419.js — v5.24.34: pedido dele "muda as informações da
// nuvem" — limpeza dos textos visíveis que ainda falavam do mundo GRÁTIS
// (teto diário, zera 21h, "não ser pego de surpresa"). Plano pago ativo:
// o painel passa a dizer a verdade nova ($5 fixos, teto por mês e gigante).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const sync = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const dsyn = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');

// Mundando o que ELE vê no painel:
ok(!sync.includes('o teto grátis zera às 21h'), 'painel: "teto grátis zera 21h" FORA (mundo velho)');
ok(sync.includes('plano pago ativo ($5 fixos): o teto virou por mês e gigantesco'), 'painel: diz a verdade do plano pago');
ok(sync.includes('isso vira só curiosidade de uso, sem nenhum risco de susto'), 'painel: o rabinho que falava em "surpresa pelo teto" virou curiosidade');
ok(!sync.includes('não ser pego de surpresa pelo teto'), 'painel: nenhum texto ainda promete susto');
ok(sync.includes('📊 Uso da nuvem hoje'), 'painel: cabeçalho do medidor preservado (teste v5.22.96 segue íntegro)');

// A ficha quando (quase nunca) bater no limite:
ok(!dsyn.includes('A nuvem grátis atingiu o limite de gravação de hoje'), 'ficha: "grátis / de hoje" FORA');
ok(dsyn.includes('A nuvem aplicou o freio preventivo de gravações (para não estourar o limite do plano — raro no plano pago). Nada foi perdido: o envio recomeça sozinho quando o limite virar, em '), 'ficha: diz "freio preventivo (raro no plano pago)"');
ok(dsyn.includes('Nada foi perdido: o envio recomeça sozinho'), 'ficha: a promessa de segurança segue intacta');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('por mês e gigantesco'), 'bundle: texto do plano pago presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('por mês e gigantesco'), 'bundle do CELULAR igual');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (informações da nuvem no idioma do plano pago).');
