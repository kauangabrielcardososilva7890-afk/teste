const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const wpkg=JSON.parse(fs.readFileSync('cloudflare-worker/package.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== AJUSTES v5.22.79 ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));
// O carimbo serve para saber, olhando a própria nuvem, se o código novo subiu.
ok('a nuvem e o pacote andam na mesma versão',new RegExp("API_VERSION = '"+wpkg.version.replace(/\./g,'\\.')+"'").test(worker));
ok('o carimbo aparece na resposta de saúde',/version: API_VERSION/.test(worker));
ok('o conserto das contas está no código que vai subir',/async function resumoDaNuvem/.test(worker));
ok('o erro passa a dizer o motivo',/detail: motivo/.test(worker));
ok('as migrações dos índices existem',fs.existsSync('cloudflare-worker/migrations/0003_indices_contagem.sql'));
console.log('\nRESULTADO: ajustes v5.22.79 passaram!');
