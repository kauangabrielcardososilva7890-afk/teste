// test_ajustes_v52415.js — v5.24.34: relato dele "salvou na nuvem mas alguns
// dados não aparecem no PC (usuários, técnico, vendas, orçamentos...)".
// Suspeita número 1 provada em código: as listas filtram por empresaId da
// sessão (renderUsuarios: u.empresaId===s.empresaId) — dois PCs com duas
// empresaIds = dois mundos invisíveis. Em vez de chutar a correção, sobe um
// DIAGNÓSTICO na tela de acompanhamento (custo zero de nuvem; pergunta 5° e a
// regra da economia do medidor): mostra o que chegou x o que está invisível.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

// r46 — o diagnóstico "Por que dados não aparecem?" saiu da tela com a faixa
// de botões (pedido do dono). A cura automática continua sozinha no patch
// da cura; estes asserts travam a REMOÇÃO (fonte + 2 bundles).
const p = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');
ok(p.includes('v7.1.0 (r46)'), 'carimbo r46 da faixa no patch');
ok(!p.includes('window.dcDiagnosticoInvisiveis'), 'função de diagnóstico removida');
ok(!p.includes('dc-diag-invisiveis'), 'botão removido do painel (id dc-diag-invisiveis)');
ok(!p.includes('Por que dados não aparecem?'), 'título do diagnóstico removido');
ok(!p.includes("INVISÍVEIS (outra empresa)"), 'marca de invisíveis removida');
ok(!p.includes('semSessaoComUmaEmpresa'), 'caso semSessaoComUmaEmpresa removido');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(!bundle.includes('dcDiagnosticoInvisiveis'), 'bundle NÃO contém mais o diagnóstico');
ok(!fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('dcDiagnosticoInvisiveis'), 'bundle do CELULAR também não contém');

const idx = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(idx.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(idx.includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(idx.includes('app.bundle.js?v=' + pkg.version), 'index: cache-bust v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');
const wkR = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const vW = (wkR.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').includes('Worker ' + vW), 'worker carimbado (v' + vW + ') e motor colado na mesma versão');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (r46: diagnóstico "por que dados não aparecem" removido com a faixa).');
