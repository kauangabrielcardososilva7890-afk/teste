const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
console.log('== APP CELULAR 1.0 ==');
const pkg=JSON.parse(fs.readFileSync('mobile/package.json','utf8'));
const pc=JSON.parse(fs.readFileSync('package.json','utf8'));
ok('celular é 1.0.0',pkg.version==='1.0.0');
ok('PC continua 5.22.12',pc.version==='5.22.12');
ok('appId do celular separado',fs.readFileSync('mobile/capacitor.config.json','utf8').includes('br.com.digicopy.erp'));
const r=spawnSync(process.execPath,['sync-www.js'],{cwd:'mobile',encoding:'utf8'});
if(r.status!==0){console.error(r.stdout+r.stderr);process.exit(1);}
const html=fs.readFileSync(path.join('mobile','www','index.html'),'utf8');
ok('www tem o sistema',html.includes('app.bundle.js')&&fs.existsSync('mobile/www/app.bundle.js'));
ok('www marca canal celular e versão 1.0',html.includes('DIGICOPY_APP_CANAL="celular"')&&html.includes('DIGICOPY_APP_VER="1.0"'));
ok('PC index não virou 1.0',!fs.readFileSync('index.html','utf8').includes('DIGICOPY_APP_CANAL'));
ok('bundle do PC existe no www',fs.existsSync('mobile/www/app.bundle.js'));
console.log('\nRESULTADO: app celular 1.0 passou!');
