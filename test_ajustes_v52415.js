// test_ajustes_v52415.js — v5.24.22: relato dele "salvou na nuvem mas alguns
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
ok(p.includes('v5.24.22'), 'carimbo v5.24.22 no painel de nuvem');
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
ok(idx.includes("DIGICOPY_APP_VERSION = '5.24.22'"), 'index: versão 5.24.22');
ok(idx.includes('>v5.24.22<'), 'index: rodapé 5.24.22');
ok(idx.includes('app.bundle.js?v=5.24.22'), 'index: cache-bust 5.24.22');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.24.22"'), 'package.json 5.24.22');
ok(fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').includes("'5.24.22'"), 'worker 5.24.22');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.22 (diagnóstico "por que dados não aparecem", custo zero de nuvem).');
