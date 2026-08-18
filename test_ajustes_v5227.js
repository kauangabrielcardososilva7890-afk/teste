const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const patch=fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
console.log('== ACOMPANHAMENTO DOS PCS ==');
ok('botão só no painel admin',/Acompanhar dados dos PCs/.test(patch)&&/#dc-list-devices/.test(patch));
ok('consulta atividade da API',/\/v1\/admin\/activity/.test(patch));
ok('não mostra senha no rótulo',!/escolaAuth/.test(patch)&&!/\.senha/.test(patch)&&/entity==='config'/.test(patch));
ok('funciona mesmo sem a rota nova',/\/v1\/changes\?cursor=/.test(patch));
ok('API 0.4.2 tem rota de atividade',/API_VERSION = '0.4.2'/.test(worker)&&/\/v1\/admin\/activity/.test(worker));
ok('rótulo não leva o JSON inteiro',/activityLabel/.test(worker)&&/slice\(0, 80\)/.test(worker));
ok('aparelhos trazem lastChange e byEntity',/lastChangeAt/.test(worker)&&/byEntity/.test(worker));
ok('patch entra depois do motor da nuvem',manifest.indexOf('ajustes_v5227_nuvem_acompanhamento_patch.js')>manifest.indexOf('cloudflare_data_sync_patch.js'));
console.log('\nRESULTADO: acompanhamento dos PCs passou!');
