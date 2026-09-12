// Teste v5.24.11 — O FREIO DAS GRAVAÇÕES DA NUVEM (o alerta dos "76 mil"):
//  • buscador Caixa Escolar: automático com rédea (1x/hora quando velho,
//    relógio de 10 em 10 min, lista vazia NÃO dispara, sem login nem tenta,
//    nunca limpa a base sozinho, nunca duas buscas ao mesmo tempo);
//  • worker: medidor de uso não grava mais a cada leitura (acumula em memória,
//    desce junto de gravação real ou a cada 15 min);
//  • carimbos 5.24.11 + script de raio-x (ver_gasto_nuvem.cmd) presentes.
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }
const escola = fs.readFileSync('buscador_escola_patch.js', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM= fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const cmd    = fs.readFileSync('ver_gasto_nuvem.cmd', 'utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- escola: rédea no automático --');
ok(escola.indexOf('function esAutoTique()') >= 0, 'esAutoTique existe');
ok(escola.indexOf('setInterval(esAutoTique,10*60*1000)') >= 0, 'relógio agora é de 10 em 10 minutos (era 60 segundos)');
ok(escola.indexOf('sync({auto:true,incremental:true})') >= 0, 'automático nunca limpa a base (incremental sempre)');
ok(escola.indexOf('if(window.__esSync) return;') >= 0 && escola.indexOf("if(window.__esSync && opt && opt.auto) return {ok:false,error:'em-andamento'}") >= 0, 'nunca duas buscas ao mesmo tempo');
ok(escola.indexOf('if(!loginDaNuvem()&&!loginDoNavegador()) return;') >= 0, 'sem login salvo, nem tenta');
ok(escola.indexOf('||vazio)sync({auto:true,limpar:vazio,incremental:!vazio})') === -1, 'lista vazia NÃO dispara mais sincronização a cada minuto');
ok(escola.indexOf('limpar:vazio') === -1, 'automático sem modo limpar em lugar nenhum');
ok(escola.indexOf('Baixar Tudo') >= 0 && escola.indexOf('Atualizar') >= 0, 'botões manuais da tela continuam (Atualizar / Baixar Tudo)');

console.log('-- worker: medidor sem autogasto --');
ok(worker.indexOf('let __USO_PEND = { esc: 0, lei: 0, desde: 0 }') >= 0, 'acumulador do medidor existe');
ok(worker.indexOf('if (!temGravacao && !deu15min) return;') >= 0, 'leitura pura não grava nada no banco');
ok(worker.indexOf('15 * 60 * 1000') >= 0, 'descarga a cada 15 minutos no máximo');

console.log('-- raio-x + carimbos --');
ok(cmd.indexOf('digicopy-erp') >= 0 && cmd.indexOf('FROM changes') >= 0 && cmd.indexOf('FROM devices') >= 0, 'ver_gasto_nuvem.cmd pergunta por tipo de registro e por aparelho');
const cmdMotor = fs.readFileSync('atualizar_motor_nuvem.cmd', 'utf8');
ok(cmdMotor.indexOf('migrations apply DB --remote') >= 0 && cmdMotor.indexOf('wrangler deploy') >= 0, 'atualizar_motor_nuvem.cmd migra E publica, na ordem');
ok(cmdMotor.indexOf('/health') >= 0 && cmd.indexOf('/health') >= 0, 'os dois atalhos conferem a versão no ar via /health');
ok(worker.indexOf("const WORKER_VERSION = '5.24.11'") >= 0, 'worker carimba v5.24.11');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '5.24.11'") >= 0 && indexHtml.indexOf('app.bundle.js?v=5.24.11') >= 0, 'index.html na v5.24.11');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '5.24.11'") >= 0, 'mobile/www/index.html na v5.24.11');
ok(pkg.version === '5.24.11', 'package.json v5.24.11');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf('esAutoTique') >= 0, 'freio da escola está dentro do bundle');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v5.24.11'); process.exit(1); }
console.log('\nTudo certo v5.24.11!');
