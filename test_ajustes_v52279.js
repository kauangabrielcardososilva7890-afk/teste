const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const wpkg=JSON.parse(fs.readFileSync('cloudflare-worker/package.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== AJUSTES v5.22.79 ==');
ok('versão subiu para 5.22.79',pkg.version==='5.22.79');
// O carimbo serve para saber, olhando a própria nuvem, se o código novo subiu.
ok('a nuvem passa a se identificar como 0.4.6',/API_VERSION = '0\.4\.6'/.test(worker)&&wpkg.version==='0.4.6');
ok('o carimbo aparece na resposta de saúde',/version: API_VERSION/.test(worker));
ok('o conserto das contas está no código que vai subir',/async function conta\(sql\)/.test(worker)&&/DIGICOPY_STATUS_PARCIAL/.test(worker));
ok('o erro passa a dizer o motivo',/detail: motivo/.test(worker));
ok('as migrações dos índices existem',fs.existsSync('cloudflare-worker/migrations/0003_indices_contagem.sql'));
console.log('\nRESULTADO: ajustes v5.22.79 passaram!');
