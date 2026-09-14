// test_ajustes_v52413.js — v5.24.16: LOTE 1 da poda (as 14 perguntas aplicadas
// nos arquivos que já existem, autorizada por ele, "sem quebrar nada").
// imprimirChamadoPDF era definido 20× (só a última é viva): 17 cópias mortas
// removidas (~75KB). Ficam: elo v5186 (capturado), v5187 (dono da captura
// _imp) e v5189 (definição final/viva). Protocolo anti-quebra: nada com IIFE
// no topo, nada com chamada em topo, sintaxe de todos intacta.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const PODADOS = ['locacao_contratos_patch.js','fluxos_operacionais_patch.js','contratos_refino_patch.js','locacao_chamados_fix_patch.js','ajustes_v5171_patch.js','ajustes_v5172_patch.js','ajustes_v5174_patch.js','ajustes_v5175_patch.js','ajustes_v5176_patch.js','ajustes_v5177_patch.js','ajustes_v5178_patch.js','ajustes_v5179_patch.js','ajustes_v5180_patch.js','ajustes_v5181_patch.js','ajustes_v5182_patch.js','ajustes_v5184_patch.js','ajustes_v5185_patch.js'];
const reDef = /window\.imprimirChamadoPDF *= *function/;

for (const f of PODADOS) {
  const src = fs.readFileSync(f, 'utf8');
  ok(!reDef.test(src), f + ': cópia morta REMOVIDA');
}

const v5189 = fs.readFileSync('ajustes_v5189_patch.js', 'utf8');
ok(reDef.test(v5189), 'v5189: definição FINAL (viva) preservada');
const v5186 = fs.readFileSync('ajustes_v5186_patch.js', 'utf8');
ok(reDef.test(v5186), 'v5186: elo capturado preservado');
const v5187 = fs.readFileSync('ajustes_v5187_patch.js', 'utf8');
ok(v5187.includes('const _imp = window.imprimirChamadoPDF;'), 'v5187: captura _imp intacta (clausura viva)');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const nDefs = (bundle.match(/window\.imprimirChamadoPDF *= *function/g) || []).length;
ok(nDefs === 3, `bundle: exatamente 3 definições vivas (achou ${nDefs})`);
ok(bundle.includes('const _imp = window.imprimirChamadoPDF'), 'bundle: captura _imp presente');
const bytes = fs.statSync('app.bundle.js').size;
ok(bytes < 3128878, `bundle mais leve que a linha de base 3.128.878 B (agora ${bytes} B)`);
const mbundle = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
ok((mbundle.match(/window\.imprimirChamadoPDF *= *function/g) || []).length === 3, 'bundle do CELULAR igual: 3 definições');

const idx = fs.readFileSync('index.html', 'utf8');
ok(idx.includes("DIGICOPY_APP_VERSION = '5.24.16'"), 'index: versão 5.24.16');
ok(idx.includes('>v5.24.16<'), 'index: rodapé v5.24.16');
ok(idx.includes('app.bundle.js?v=5.24.16'), 'index: cache-bust v5.24.16');
ok(fs.readFileSync('mobile/www/index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '5.24.16'"), 'mobile: versão 5.24.16');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.24.16"'), 'package.json: 5.24.16');
ok(fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').includes("'5.24.16'"), 'worker: 5.24.16');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.16 (lote 1: ~75KB de peso morto fora, zero código morto chamável).');
