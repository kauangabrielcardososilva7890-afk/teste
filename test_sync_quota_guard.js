const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exitCode = 1; }
  else console.log('  ✔ ' + name);
}
const legacy = fs.readFileSync('sync_client.js','utf8');
const force = fs.readFileSync('limpar_nuvem_patch.js','utf8');
const realtime = fs.readFileSync('sync_realtime_patch.js','utf8');
console.log('== PROTEÇÃO DE COTA DO SYNC ==');
ok('legado não consulta a cada 75 segundos', !/setInterval\s*\([^)]*syncAutoChecar[\s\S]{0,150}?75000/.test(legacy));
ok('legado automático retorna desligado', /syncAutoLigado\s*=\s*function\(\)\s*\{\s*return false/.test(legacy));
ok('compatibilidade não força sync legado ligado', !/syncAutoLigado\s*=\s*function[\s\S]*return true/.test(force));
ok('compatibilidade grava flag legado desligada', /digicopy_erp_autosync[\s\S]*['"]0['"]/.test(force));
ok('sync incremental não usa polling por intervalo', !/setInterval\s*\(/.test(realtime));
ok('sync incremental continua carregado', /sync_realtime_patch\.js/.test(fs.readFileSync('index.html','utf8')));
if(process.exitCode) process.exit(process.exitCode);
console.log('\nRESULTADO: proteção de cota passou!');
