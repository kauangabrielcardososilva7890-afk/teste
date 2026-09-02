const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.78 ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));
ok('a janela da nuvem abre mesmo se a contagem falhar',/contagemFalhou=e\.message/.test(painel)&&/status=\{device:salvo,totals:/.test(painel));
ok('sem autorização guardada ainda mostra o erro de sempre',/if\(!salvo\)\{/.test(painel));
ok('senha errada continua desconectando',/if\(e\.status===401\)\{forgetAuth\(\);return renderDisconnected\(body\);\}/.test(painel));
ok('a pessoa é avisada do motivo, sem susto',/Os números da nuvem não puderam ser contados agora/.test(painel)&&/NÃO atrapalha a sincronização/.test(painel));
ok('os botões continuam na tela',/dc-sync-now/.test(painel)&&/dc-list-deleted/.test(painel));
ok('no servidor, cada conta vai sozinha',/async function conta\(sql\)/.test(worker));
ok('o erro do servidor diz o motivo',/detail: motivo/.test(worker));
console.log('\nRESULTADO: ajustes v5.22.78 passaram!');
