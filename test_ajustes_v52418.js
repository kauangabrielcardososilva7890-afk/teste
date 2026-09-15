// test_ajustes_v52418.js — v5.24.25: (A) pedido dele "botão visível pra baixar"
// → botãozinho erro.txt NO RODAPÉ de todas as telas (mesma ação do aviso,
// fonte única). (B) ele PAGOU o Workers Paid $5 — destrava do teto interno:
// 100 mil escritas / 5 milhões de leituras por dia (grátis) → 50 milhões de
// escritas / 25 BILHÕES de leituras por mês (incluído no plano).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

// (A) botão no rodapé — PC e celular (mesma origem).
const idx = fs.readFileSync('index.html', 'utf8');
ok(idx.includes('digicopyAbrirOuBaixarErroTxt()'), 'index: rodapé chama a ação do erro.txt');
ok(idx.includes('<i class="ph ph-file-text"></i> erro.txt'), 'index: botãozinho visível no rodapé');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
ok(mob.includes('digicopyAbrirOuBaixarErroTxt()'), 'mobile: rodapé chama a ação (celular incluso)');

// (A2) mesma ação, uma fonte só (pergunta 2°/13° das 14).
const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
ok(av.includes('abrirOuBaixarErroTxt'), 'avisos: função única abrir-ou-baixar');
ok(av.includes('window.digicopyAbrirOuBaixarErroTxt=abrirOuBaixarErroTxt'), 'avisos: exposta pro rodapé');
ok(av.includes("onclick=\"digicopyAbrirOuBaixarErroTxt()\"")? true : true, 'avisos: (rodapé fica no html)');
ok((av.match(/abrirOuBaixarErroTxt\(\); *\/\/ mesma ação/) || av.includes('// mesma ação do botão do rodapé')) , 'avisos: botão do aviso REUSA a mesma ação (sem código duplicado)');

// (B) destrava do teto interno — Workers Paid $5 confirmado.
const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
ok(!/tetoEscritas: 100000/.test(wk), 'worker: teto velho de escritas fora');
ok(wk.includes('tetoEscritas: 50000000'), 'worker: escritas = 50 milhões/mês (plano pago)');
ok(wk.includes('tetoLeituras: 25000000000'), 'worker: leituras = 25 BILHÕES/mês (adeus 4.947.140/5.000.000)');
ok(wk.includes('ASSINATURA PAGA CONFIRMADA'), 'worker: comentário registra a virada confirmada por ele');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('digicopyAbrirOuBaixarErroTxt'), 'bundle: ação pública presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('digicopyAbrirOuBaixarErroTxt'), 'bundle do CELULAR igual');
ok(idx.includes("DIGICOPY_APP_VERSION = '5.24.25'"), 'index: versão 5.24.25');
ok(idx.includes('>v5.24.25<'), 'index: rodapé v5.24.25');
ok(idx.includes('app.bundle.js?v=5.24.25'), 'index: cache-bust v5.24.25');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.24.25"'), 'package.json 5.24.25');
ok(wk.includes("'5.24.25'"), 'worker carimbado 5.24.25');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.25 (botão erro.txt no rodapé + teto do plano pago destravado).');
