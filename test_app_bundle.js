const fs=require('fs');
const cp=require('child_process');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== APP BUNDLE ==');
ok('manifesto possui todos os 136 scripts na ordem',manifest.length===136&&new Set(manifest).size===136);
ok('Firebase e sync antigo não entram no runtime',!['sync_client.js','firebase_config.js','firebase_client.js','limpar_nuvem_patch.js'].some(file=>manifest.includes(file)));
ok('todos os arquivos do manifesto existem',manifest.every(fs.existsSync));
ok('IndexedDB precede painel e motor de sync',manifest.indexOf('indexeddb_persistence_patch.js')<manifest.indexOf('cloudflare_sync_patch.js')&&manifest.indexOf('cloudflare_sync_patch.js')<manifest.indexOf('cloudflare_data_sync_patch.js'));
ok('index carrega um único bundle da aplicação',(html.match(/<script[^>]+src="\.\/app\.bundle\.js/g)||[]).length===1);
ok('index não faz 97 requisições antigas',!manifest.some(file=>html.includes('src="./'+file)));
ok('Electron inclui bundle e não depende da lista manual antiga',pkg.build.files.includes('app.bundle.js')&&pkg.build.files.length<=12);
cp.execFileSync(process.execPath,['build_bundle.js','--check'],{stdio:'pipe'});
ok('bundle corresponde exatamente às fontes','ok');
console.log('\nRESULTADO: bundle consolidado passou!');
