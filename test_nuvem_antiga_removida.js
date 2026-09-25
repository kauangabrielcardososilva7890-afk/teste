// ═══════════════════════════════════════════════════════════════════════════
// TESTE — a nuvem antiga (Google Firebase / Supabase) está REMOVIDA
//
// Histórico: o sistema já usou Supabase e depois Google Firebase. Hoje a nuvem
// é Cloudflare Worker + D1. Sobravam arquivos mortos do transporte antigo que
// não entravam no bundle nem no .exe, mas ficavam no repositório confundindo
// buscas e o scanner de segredos do GitHub.
//
// Na v5.22.63 esses arquivos foram APAGADOS. Este teste impede que voltem.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }

const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

console.log('== NUVEM ANTIGA REMOVIDA ==');

// ── 1. Os arquivos do transporte antigo não existem mais ────────────────────
const APAGADOS = [
  'sync_client.js',            // motor Supabase/Firebase legado
  'sync_realtime_patch.js',    // motor automático Firebase
  'limpar_nuvem_patch.js',     // compatibilidade do legado
  'ajustes_v52025_patch.js',   // diagnóstico de erros do Firebase
  'firebase_config.js',
  'firebase_client.js'
];
for (const f of APAGADOS) ok('apagado: ' + f, !fs.existsSync(f));

// ── 2. Nada no bundle referencia esses arquivos ─────────────────────────────
const noBundle = APAGADOS.filter(f => manifest.includes(f));
ok('nenhum deles está no bundle-manifest.json' + (noBundle.length ? ' → ' + noBundle.join(', ') : ''),
   noBundle.length === 0);

const fontes = manifest.filter(f => fs.existsSync(f));
const citando = [];
for (const arq of fontes) {
  const s = fs.readFileSync(arq, 'utf8');
  for (const morto of APAGADOS) {
    if (s.indexOf(morto) >= 0) citando.push(arq + ' cita ' + morto);
  }
}
ok('nenhum arquivo do bundle cita os apagados' + (citando.length ? ' → ' + citando.join('; ') : ''),
   citando.length === 0);

// ── 3. Nenhuma chave de API do Google no código ─────────────────────────────
// (a chave antiga ficou só no histórico do git; precisa ser revogada no
//  console do Google — o código atual não pode ter nenhuma.)
const reChave = /AIza[0-9A-Za-z_-]{30,}/;
const comChave = fontes.filter(f => reChave.test(fs.readFileSync(f, 'utf8')));
ok('nenhuma chave AIza... no código' + (comChave.length ? ' → ' + comChave.join(', ') : ''),
   comChave.length === 0);

// ── 4. Nenhum endpoint da nuvem antiga ──────────────────────────────────────
const reEndpoint = /firebaseio\.com|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|\.supabase\.co/;
const comEndpoint = fontes.filter(f => reEndpoint.test(fs.readFileSync(f, 'utf8')));
ok('nenhum endpoint Firebase/Supabase no código' + (comEndpoint.length ? ' → ' + comEndpoint.join(', ') : ''),
   comEndpoint.length === 0);

// ── 5. A nuvem atual continua no lugar ──────────────────────────────────────
ok('painel Cloudflare no bundle', manifest.includes('cloudflare_sync_patch.js'));
ok('motor de dados Cloudflare no bundle', manifest.includes('cloudflare_data_sync_patch.js'));
ok('persistência IndexedDB no bundle', manifest.includes('indexeddb_persistence_patch.js'));

// ── 6. Nenhum .zip volta para o repositório ─────────────────────────────────
const zips = fs.readdirSync('.').filter(f => f.endsWith('.zip'));
ok('nenhum .zip no repositório' + (zips.length ? ' → ' + zips.join(', ') : ''), zips.length === 0);
ok('.gitignore bloqueia .zip sem exceções', (() => {
  const g = fs.readFileSync('.gitignore', 'utf8');
  return g.indexOf('*.zip') >= 0 && !/^!.*\.zip$/m.test(g);
})());

console.log('\nRESULTADO: nuvem antiga removida!');
