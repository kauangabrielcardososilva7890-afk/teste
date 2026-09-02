const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const cham=fs.readFileSync('locacao_chamados_fix_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.74 ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));

// O conserto automático que devolvia o que sumiu foi REMOVIDO na v5.22.76:
// ele trouxe de volta os nomes de demonstração. O que fica garantido é que
// nenhum botão de restaurar em massa existe e que aquele conserto saiu.
ok('não tem botão para o usuário apertar',!/dc-restore-all/.test(painel));
ok('o conserto que ressuscitava dado saiu',!/repararApagao/.test(code)&&!/agruparApagao/.test(code));
ok('nome de demonstração não volta pela nuvem',/ehLixoDeDemonstracao\(change\.entity,change\.data\)/.test(code));

// ── contador color pela modalidade ──
ok('contador color olha a modalidade',/function modalidadeAtiva/.test(cham)&&/modalidadeAtiva\(meds\.colorA4\) \|\| modalidadeAtiva\(meds\.colorA3\)/.test(cham));
ok('modalidade inativa não conta',/mod !== 'inativo' && mod !== 'off'/.test(cham));
ok('acabou o palpite pelo nome do tipo',!/\/color\/i\.test\(eq\.tipo/.test(cham));
console.log('\nRESULTADO: ajustes v5.22.74 passaram!');
