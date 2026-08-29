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
const extraRuntime=['ajustes_v52249_relatorio_patch.js','ajustes_v52250_exe_bundle_patch.js','ajustes_v52251_exe_resiliencia_patch.js','ajustes_v52252_resolucao_loop_patch.js','ajustes_v52253_login_tela_branca_patch.js','ajustes_v52254_orcamentos_pages_patch.js','ajustes_v52255_orcamento_aprovacao_venda_patch.js'];
ok('index não faz 97 requisições antigas',!manifest.filter(file=>extraRuntime.indexOf(file)<0).some(file=>html.includes('src="./'+file)));
ok('Electron inclui bundle e patches do runtime',pkg.build.files.includes('app.bundle.js')&&pkg.build.files.includes('package.json')&&pkg.build.files.includes('ajustes_v52255_orcamento_aprovacao_venda_patch.js')&&pkg.build.files.length<=24);
cp.execFileSync(process.execPath,['build_bundle.js','--check'],{stdio:'pipe'});
ok('bundle corresponde exatamente às fontes','ok');
console.log('\nRESULTADO: bundle consolidado passou!');
