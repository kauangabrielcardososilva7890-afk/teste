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

// ── o que sumiu sozinho volta sozinho ──
ok('não tem botão para o usuário apertar',!/dc-restore-all/.test(painel));
ok('o conserto roda dentro do ciclo normal',/const devolvidos=await repararApagao\(\);/.test(code));
ok('roda uma vez só',/if\(state\.reparo===REPARO\)return 0;/.test(code));

const t0=1750000000000;
const lote=[];
for(let i=0;i<25;i++) lote.push({entity:'clientes',recordId:'c'+i,deletedAt:t0+i*300});
const manuais=[
  {entity:'clientes',recordId:'apaguei1',deletedAt:t0+900000},
  {entity:'clientes',recordId:'apaguei2',deletedAt:t0+1800000},
  {entity:'vendas',recordId:'v1',deletedAt:t0+3600000}
];
const volta=S.agruparApagao(lote.concat(manuais)).map(x=>x.recordId);
ok('devolve o apagão em lote',volta.length===25&&volta.indexOf('c0')>=0&&volta.indexOf('c24')>=0);
ok('NÃO devolve o que a pessoa apagou',volta.indexOf('apaguei1')<0&&volta.indexOf('apaguei2')<0&&volta.indexOf('v1')<0);
const soManuais=S.agruparApagao(manuais);
ok('exclusão de verdade fica excluída',soManuais.length===0);
const logs=[]; for(let i=0;i<30;i++) logs.push({entity:'logs',recordId:'l'+i,deletedAt:t0+i*100});
ok('auditoria não volta (é lixo)',S.agruparApagao(logs).length===0);
ok('o espelho espera o conserto terminar',/if\(state\.reparo!==REPARO\)return 0;/.test(code));

// ── contador color pela modalidade ──
ok('contador color olha a modalidade',/function modalidadeAtiva/.test(cham)&&/modalidadeAtiva\(meds\.colorA4\) \|\| modalidadeAtiva\(meds\.colorA3\)/.test(cham));
ok('modalidade inativa não conta',/mod !== 'inativo' && mod !== 'off'/.test(cham));
ok('acabou o palpite pelo nome do tipo',!/\/color\/i\.test\(eq\.tipo/.test(cham));
console.log('\nRESULTADO: ajustes v5.22.74 passaram!');
