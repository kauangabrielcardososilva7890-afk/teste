const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== CLOUDFLARE SYNC UI ==');
ok('usa endpoint workers.dev correto',/digicopy-sync-api\.kauangabrielcardososilva7890\.workers\.dev/.test(code));
ok('token individual fica em chave local própria',/digicopy_cloud_device_token_v1/.test(code));
ok('segredo não é salvo no localStorage',!/setItem\([^\n]*secret/i.test(code));
ok('possui primeiro setup, convite, ingresso e recuperação',/\/v1\/setup/.test(code)&&/\/v1\/invites/.test(code)&&/\/v1\/enroll/.test(code)&&/\/v1\/recover/.test(code));
ok('botão Nuvem está na barra superior',/id="btn-nuvem"[^>]*abrirCloudflareNuvem/.test(html));
ok('novo painel é carregado por último',/cloudflare_sync_patch\.js/.test(html));
ok('Firebase automático não é mais carregado',!/<script[^>]+sync_realtime_patch\.js/.test(html));
ok('gatilho antigo de carga automática é travado',/digicopy_auto_load_try_v4939/.test(code) && /syncCarregarDaNuvem=async function\(\)/.test(code));
ok('diagnóstico Firebase antigo não é carregado',!/<script[^>]+ajustes_v52025_patch\.js/.test(html));
ok('arquivo entra no build Electron',pkg.build.files.includes('cloudflare_sync_patch.js'));
console.log('\nRESULTADO: interface Cloudflare passou!');
