const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const env=fs.readFileSync('envio_arquivos.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');

ok('ehDel existe na página', /function ehDel\s*\(row\)/.test(env));
ok('usa ehDel no filtro', /brutas\.filter\(ehDel\)/.test(env) && /!ehDel\(r\)/.test(env));
ok('versão 5.22.26', pkg.version==='5.22.26' && html.includes('app.bundle.js?v=5.22.26'));
ok('APK quieto', !/mobile\//.test(env));
console.log('\nRESULTADO: v5.22.26 passou!');
