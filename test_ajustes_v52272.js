const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
const db={clientes:[{id:'a'},{id:'b'}],vendas:[{id:'v1'}]};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,db);
const S=window.DIGICOPY_CLOUD_SYNC;

// O espelho da v5.22.72 foi REMOVIDO na v5.22.76: era ele que apagava do PC o
// que a nuvem não tinha. O que este arquivo garante hoje é que ele não volte.
console.log('== AJUSTES v5.22.72 (revisto na v5.22.76) ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));
ok('o espelho que apagava dado do PC não existe mais',!/function espelharNuvem/.test(code)&&!/function planejarEspelho/.test(code));
ok('o interruptor do espelho saiu do painel',!/dc-espelho/.test(painel));
ok('nenhum resto do espelho na lista de funções',!S.espelhoLigado&&!S.planejarEspelho);
ok('auditoria e avisos continuam fora da nuvem',/NAO_SINCRONIZA=new Set\(\['meta','__proto__','logs','notificacoes'\]\)/.test(code));
ok('zerar a nuvem só existe no botão do administrador',/function resetCloudOnly/.test(code)&&code.split('reset-cloud').length===2);
console.log('\nRESULTADO: ajustes v5.22.72 passaram!');
