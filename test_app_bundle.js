const fs=require('fs');
const cp=require('child_process');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== APP BUNDLE ==');
ok('manifesto possui todos os scripts na ordem',manifest.length>=141&&new Set(manifest).size===manifest.length);
ok('Firebase e sync antigo não entram no runtime',!['sync_client.js','firebase_config.js','firebase_client.js','limpar_nuvem_patch.js'].some(file=>manifest.includes(file)));
ok('todos os arquivos do manifesto existem',manifest.every(fs.existsSync));
ok('IndexedDB precede painel e motor de sync',manifest.indexOf('indexeddb_persistence_patch.js')<manifest.indexOf('cloudflare_sync_patch.js')&&manifest.indexOf('cloudflare_sync_patch.js')<manifest.indexOf('cloudflare_data_sync_patch.js'));
ok('index carrega um único bundle da aplicação',(html.match(/<script[^>]+src="\.\/app\.bundle\.js/g)||[]).length===1);
const scriptsSoltos=[...html.matchAll(/<script\s[^>]*src="\.\/([A-Za-z0-9_.\-/]+\.js)/g)]
  .map(m=>m[1]).filter(f=>f!=='app.bundle.js'&&!f.startsWith('assets/vendor/'));
ok('index não faz 97 requisições antigas',scriptsSoltos.length<=Math.max(20,Math.floor(manifest.length/6)));
ok('o grosso do sistema vem do bundle, não de scripts soltos',manifest.length-scriptsSoltos.length>=140);
ok('todo script solto existe e está no bundle ou em build.files',
   scriptsSoltos.every(f=>fs.existsSync(f)&&(manifest.includes(f)||pkg.build.files.includes(f))));
const htmlRefs=[...html.matchAll(/(?:src|href)="\.\/([A-Za-z0-9_.\-/]+?)(?:\?[^"]*)?"/g)].map(m=>m[1]);
const globAssets=f=>f.startsWith('assets/');
ok('Electron inclui bundle e essenciais',pkg.build.files.includes('app.bundle.js')&&pkg.build.files.includes('package.json')&&pkg.build.files.includes('index.html'));
ok('patches recentes viajam dentro do bundle',['ajustes_v52262_orcamento_uma_vez_loop_patch.js','ajustes_v52263_exe_completo_patch.js'].every(f=>manifest.includes(f)));
ok('index.html carrega SÓ o bundle (sem script duplicado)',scriptsSoltos.length===0);
ok('TUDO que o index.html carrega vai para o .exe',htmlRefs.filter(f=>!globAssets(f)).every(f=>pkg.build.files.includes(f)));
ok('build.files não leva lixo para o instalador',!pkg.build.files.some(f=>/^test_|\.zip$|^RELATORIO|^dist\//.test(f)));
ok('build.files só aponta para arquivos que existem',pkg.build.files.every(f=>f.includes('*')||fs.existsSync(f)));
cp.execFileSync(process.execPath,['sync_build.js','--check'],{stdio:'pipe'});
ok('configuração do build está sincronizada (npm run sync)','ok');
cp.execFileSync(process.execPath,['build_bundle.js','--check'],{stdio:'pipe'});
ok('bundle corresponde exatamente às fontes','ok');
console.log('\nRESULTADO: bundle consolidado passou!');
