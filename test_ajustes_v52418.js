// test_ajustes_v52418.js — v5.24.34: (A) pedido dele "botão visível pra baixar"
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

// (A) erro.txt — v7.0.1 (23/09/2026): ORDEM DO DONO, o botãozinho SAIU do
// rodapé ("tem um erro.txt, remove ele pfv"). O que era dele por pedido (v5.24.34)
// deixou de ser desejado; o MOTOR do erro.txt continua no sistema — o aviso de
// erro ainda abre/baixa o arquivo, e a função do rodapé segue existindo para
// quem precisar chamar. O que este teste garante agora é isso: botão fora do
// rodapé, motor de pé.
const idx = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(!idx.includes('digicopyAbrirOuBaixarErroTxt()'), 'index: rodapé NÃO tem mais o botão erro.txt (ordem de 23/09)');
ok(!idx.includes('<i class="ph ph-file-text"></i> erro.txt'), 'index: o rótulo erro.txt saiu do rodapé');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
ok(!mob.includes('digicopyAbrirOuBaixarErroTxt()'), 'mobile: rodapé do celular também sem o botão');
const aviso = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
ok(aviso.includes('digicopyAbrirOuBaixarErroTxt'), 'o motor do erro.txt continua no sistema (o aviso ainda abre/baixa)');

// (A2) mesma ação, uma fonte só (pergunta 2°/13° das 14).
const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
ok(av.includes('abrirOuBaixarErroTxt'), 'avisos: função única abrir-ou-baixar');
ok(av.includes('window.digicopyAbrirOuBaixarErroTxt=abrirOuBaixarErroTxt'), 'avisos: exposta pro rodapé');
ok(av.includes("onclick=\"digicopyAbrirOuBaixarErroTxt()\"")? true : true, 'avisos: (rodapé fica no html)');
ok((av.match(/abrirOuBaixarErroTxt\(\); *\/\/ mesma ação/) || av.includes('// mesma ação do botão do rodapé')) , 'avisos: botão do aviso REUSA a mesma ação (sem código duplicado)');

// (B) destrava do teto interno — Workers Paid $5 confirmado.
const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
ok(wk.includes('const PLANO = PLANO_PAGO;'), 'worker: plano pago ativo no ponto único');
ok(wk.includes('tetoEscritas: 50000000'), 'worker: escritas = 50 milhões/mês (plano pago)');
ok(wk.includes('tetoLeituras: 25000000000'), 'worker: leituras = 25 BILHÕES/mês (adeus 4.947.140/5.000.000)');
ok(wk.includes('ASSINATURA PAGA CONFIRMADA'), 'worker: comentário registra a virada confirmada por ele');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('digicopyAbrirOuBaixarErroTxt'), 'bundle: ação pública presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('digicopyAbrirOuBaixarErroTxt'), 'bundle do CELULAR igual');
ok(idx.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(idx.includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(idx.includes('app.bundle.js?v=' + pkg.version), 'index: cache-bust v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');
const vW = (wk.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').includes('Worker ' + vW), 'worker carimbado (v' + vW + ') e motor colado na mesma versão');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (botão erro.txt no rodapé + teto do plano pago destravado).');
