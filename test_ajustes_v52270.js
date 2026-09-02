const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.70 ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));
ok('503 é tratado como "nuvem ocupada"',/st===429\|\|st===500\|\|st===502\|\|st===503\|\|st===504/.test(code));
ok('tenta de novo, com espera crescente',/const ESPERAS=\[900,2500,6000,12000\]/.test(code)&&/async function comPaciencia/.test(code));
ok('envio e leitura usam a espera',/comPaciencia\(\(\)=>call\('\/v1\/changes',\{method:'POST'/.test(code)&&/comPaciencia\(\(\)=>call\('\/v1\/changes\?cursor=/.test(code));
ok('lote encolhe quando a nuvem reclama',/lote=Math\.max\(1,Math\.floor\(lote\/2\)\)/.test(code));
ok('lote volta a crescer quando ela aceita',/if\(lote<PUSH_BATCH\)lote=Math\.min\(PUSH_BATCH,lote\+1\)/.test(code));
ok('tem respiro entre lotes para não afogar a nuvem',/await dormir\(180\)/.test(code));
ok('remessa grande continua sozinha em vez de pausar',/schedule\(4000\)/.test(code)&&!/A sincronização continua parada/.test(code));
ok('mostra quanto falta enviar',/faltam '\+outbox\.length\+' registros/.test(code));
ok('painel avisa que pode fechar a janela',/o envio segue sozinho e recomeça de onde parou/.test(painel));
ok('nada de susto com "Envio pendente"',!/Envio pendente/.test(painel));
ok('a fila não some no erro',/localStorage\.setItem\(OUTBOX_KEY/.test(code));
console.log('\nRESULTADO: ajustes v5.22.70 passaram!');
