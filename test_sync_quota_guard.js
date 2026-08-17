const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exitCode = 1; }
  else console.log('  ✔ ' + name);
}
const legacy = fs.readFileSync('sync_client.js','utf8');
const force = fs.readFileSync('limpar_nuvem_patch.js','utf8');
const cloud = fs.readFileSync('cloudflare_sync_patch.js','utf8');
const cloudData = fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
console.log('== PROTEÇÃO DE COTA DO SYNC ==');
ok('legado não consulta a cada 75 segundos', !/setInterval\s*\(/.test(legacy));
ok('legado automático retorna desligado', /syncAutoLigado\s*=\s*function\(\)\s*\{\s*return false/.test(legacy));
ok('compatibilidade não força sync legado ligado', !/syncAutoLigado\s*=\s*function[\s\S]*return true/.test(force));
ok('compatibilidade grava flag legado desligada', /digicopy_erp_autosync[\s\S]*['"]0['"]/.test(force));
ok('painel Cloudflare não faz polling escondido', !/setInterval\s*\(/.test(cloud));
ok('motor Cloudflare não usa setInterval', !/setInterval\s*\(/.test(cloudData));
ok('repouso faz uma consulta incremental por ciclo', /if\(totalSent>0\)await pullAll\(\)/.test(cloudData));
ok('Cloudflare está carregada', manifest.includes('cloudflare_sync_patch.js') && manifest.includes('cloudflare_data_sync_patch.js'));
ok('Firebase automático não está carregado', !manifest.includes('sync_realtime_patch.js'));
if(process.exitCode) process.exit(process.exitCode);
console.log('\nRESULTADO: proteção de cota passou!');
