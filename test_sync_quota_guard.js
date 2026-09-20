const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exitCode = 1; }
  else console.log('  ✔ ' + name);
}
const cloud = fs.readFileSync('cloudflare_sync_patch.js','utf8');
const cloudData = fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
console.log('== PROTEÇÃO DE COTA DO SYNC ==');
// v5.22.63: o motor legado (sync_client.js) e sua camada de compatibilidade
// (limpar_nuvem_patch.js) foram APAGADOS — não há mais timer legado possível.
ok('motor legado apagado', !fs.existsSync('sync_client.js'));
ok('compatibilidade do legado apagada', !fs.existsSync('limpar_nuvem_patch.js'));
ok('painel Cloudflare não faz polling escondido', !/setInterval\s*\(/.test(cloud));
ok('motor Cloudflare não usa setInterval', !/setInterval\s*\(/.test(cloudData));
ok('repouso faz uma consulta incremental por ciclo', /if\(totalSent>0\)await pullAll\(\)/.test(cloudData));
ok('Cloudflare está carregada', manifest.includes('cloudflare_sync_patch.js') && manifest.includes('cloudflare_data_sync_patch.js'));
ok('Firebase automático apagado', !fs.existsSync('sync_realtime_patch.js') && !manifest.includes('sync_realtime_patch.js'));
if(process.exitCode) process.exit(process.exitCode);
console.log('\nRESULTADO: proteção de cota passou!');
