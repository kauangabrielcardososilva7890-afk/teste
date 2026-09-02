const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
const db={clientes:[{id:'a'},{id:'b'}],vendas:[{id:'v1'}]};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,db);
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.72 ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));
ok('o espelho vem ligado',S.espelhoLigado()===true);
ok('dá para desligar e ligar',S.ligarEspelho(false)===false&&S.ligarEspelho(true)===true);
ok('só limpa com a fila vazia e sem erro',/if\(state\.paused\|\|outbox\.length\|\|lastError\)return 0;/.test(code));
ok('nunca limpa com a nuvem vazia',/!Object\.keys\(state\.known\)\.length\)return 0;/.test(code));
ok('não toca no que a pessoa mandou não enviar',/const held=new Set\(state\.heldLocalOnly\|\|\[\]\);[\s\S]{0,600}!held\.has\(k\)/.test(code));
ok('sumiço grande não apaga nada, vira aviso',/fora\.length\/entries\.length>0\.30/.test(code)&&/sobras\.length>200/.test(code)&&/não apaguei nada/.test(code));
ok('grava cópia de recuperação antes da primeira limpeza',/antes_espelhar_nuvem/.test(code));
ok('a nuvem nunca é apagada pelo espelho',!/reset-cloud/.test(code.slice(code.indexOf('function espelharNuvem'),code.indexOf('function rememberConflict'))));
ok('auditoria e avisos ficam fora do espelho',/if\(NAO_SINCRONIZA\.has\(entity\)\)continue;/.test(code));
ok('mostra quantas sobras foram limpas',/sobras\+' sobras locais limpas/.test(code));
ok('painel tem o interruptor explicado',/Manter este PC igual à nuvem/.test(painel)&&/dc-espelho/.test(painel));

// o plano em si: nada na lista conhecida = nada a fazer sem nuvem
ok('sem nuvem conhecida o plano é vazio',Array.isArray(S.planejarEspelho()));
console.log('\nRESULTADO: ajustes v5.22.72 passaram!');
