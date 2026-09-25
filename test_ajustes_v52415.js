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

const p = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');
ok(p.includes('v5.24.34'), 'carimbo v5.24.34 no painel de nuvem');
ok(p.includes('window.dcDiagnosticoInvisiveis'), 'função de diagnóstico exposta');
ok(p.includes('dc-diag-invisiveis'), 'botão injetado no painel (id dc-diag-invisiveis)');
ok(p.includes('Por que dados não aparecem?'), 'título do diagnóstico na língua dele');
ok(p.includes("INVISÍVEIS (outra empresa)"), 'marca registros invisíveis por empresa');
ok(p.includes("u.empresaId") || p.includes('empAtual'), 'compara contra empresaId da sessão');
ok(/ENTS=\['usuarios','tecnicos','clientes','produtos'/.test(p.replace(/\s/g,'')),
   'varre as entidades citadas por ele (usuarios, tecnicos, vendas, orcamentos...)');
ok(p.includes('vendas') && p.includes('orcamentos'), 'vendas e orçamentos incluídos na varredura');
ok(p.includes('só lê, não muda nada'), 'diagnóstico declara-se somente-leitura');
ok(!/fetch\(|api\('/.test(p.split('window.dcDiagnosticoInvisiveis=function')[1] || ''),
   'diagnóstico NÃO gasta nuvem (zero chamadas de API)');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('dcDiagnosticoInvisiveis'), 'bundle contém o diagnóstico');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('dcDiagnosticoInvisiveis'), 'bundle do CELULAR contém');

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
console.log('\nTudo OK — v' + pkg.version + ' (diagnóstico "por que dados não aparecem", custo zero de nuvem).');
