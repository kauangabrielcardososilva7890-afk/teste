// test_ajustes_v52412.js — v5.24.12: notinha FATURADA → Imprimir inacessível
// Causa (diagnosticada no código): a trava anti-editção lockVendaFaturadaUI
// (vendas_notinhas_fix_patch.js) desliga botões cujo onclick contenha
// "salvar|faturar|item|..." — e o Imprimir do editor chama
// vosAbrirImpressaoESalvar(): tem "salvar" no NOME. Impressão é leitura,
// nunca edição. Fix: isenção dentro da própria varredura da trava.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const fix = fs.readFileSync('vendas_notinhas_fix_patch.js', 'utf8');

ok(fix.includes('v5.24.12'), 'carimbo v5.24.12 na trava corrigida');
ok(fix.includes('IMPRIMIR NUNCA É EDI'), 'comentário explica a isenção (imprimir não é edição)');
ok(fix.includes('const iaDesligar'), 'sweep refatorada para decidir duas vezes (iaDesligar)');
ok(fix.includes('if (iaDesligar && ('), 'isenção só se aplica a quem IA ser desligado');
ok(fix.includes("btn.setAttribute('onclick', \"imprimirNotinha('"), 'botão Imprimir ganha impressão DIRETA (sem salvar)');
ok(fix.includes('String(vendaId)'), 'impressão da isenção mira o vendaId travado');
ok(fix.includes("btn.title = 'Imprimir notinha (não altera nada)';"), 'hint no botão: imprimir não altera nada');
ok(fix.includes('if (iaDesligar) {'), 'guarda original segue protegendo botões de EDIÇÃO');

// Ordem na varredura: a isenção (return) aparece ANTES do caminho de desligar.
const base = fix.indexOf('const iaDesligar');
ok(base > -1, 'varredura localizada');
const idxIsencao = fix.indexOf('return;', base);
const idxDesliga = fix.indexOf('btn.disabled = true;', base);
ok(idxIsencao !== -1 && idxDesliga !== -1 && idxIsencao < idxDesliga,
   'isenção (return) vem antes do desligamento dentro da mesma varredura');

// A trava em si continua existindo e saudável para adicionar/salvar/faturar.
ok(fix.includes('avisoVendaFaturada'), 'aviso de venda faturada mantido');
ok(fix.includes('Estornar'), 'botão Estornar da faturada mantido');

// Fix realmente dentro do bundle que ele baixa (PC + celular = mesma origem).
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('v5.24.12'), 'bundle carrega o carimbo da correção');
ok(bundle.includes('const iaDesligar'), 'bundle CONTÉM a isenção corrigida');
const mBundle = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
ok(mBundle.includes('const iaDesligar'), 'bundle do CELULAR contém a isenção');

// Carimbos de versão (rodapé = prova que ele exige em cada teste).
const idx = fs.readFileSync('index.html', 'utf8');
ok(idx.includes("DIGICOPY_APP_VERSION = '5.24.12'"), 'index: DIGICOPY_APP_VERSION 5.24.12');
ok(idx.includes('>v5.24.12<'), 'index: rodapé v5.24.12');
ok(idx.includes('app.bundle.js?v=5.24.12'), 'index: cache-bust do bundle v5.24.12');
ok(!idx.includes('5.24.11'), 'index: nenhum carimbo velho sobrou');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
ok(mob.includes("DIGICOPY_APP_VERSION = '5.24.12'"), 'mobile: DIGICOPY_APP_VERSION 5.24.12');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
ok(worker.includes("'5.24.12'"), 'worker carimbado 5.24.12');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.12 (Imprimir na faturada destravado).');
