const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined);
const S=window.DIGICOPY_CLOUD_SYNC;
console.log('== CLOUDFLARE DATA SYNC ==');
ok('motor exportado',!!S&&typeof S.tick==='function');
ok('sincroniza todas as entidades principais',S.definitions.clientes==='array'&&S.definitions.vendas==='array'&&S.definitions.config==='root');
ok('limpa metadados antigos',!('_rt' in S.clean({id:'1',_rt:'x'})));
ok('hash é estável com ordem diferente',S.hash({b:2,a:1})===S.hash({a:1,b:2}));
ok('possui fila local durável',/digicopy_cf_sync_outbox_v1/.test(code));
ok('reset cria snapshot e pausa sem republicar',/antes_zerar_nuvem/.test(code)&&/resetCloudOnly/.test(code)&&/paused:true/.test(code));
ok('publicação após reset é ação separada',/publishLocalToCloud/.test(code)&&/publicacao-manual-completa/.test(code));
ok('lote conservador evita excesso de subrequisições',/PUSH_BATCH=10/.test(code));
ok('calcula total pendente além do lote atual',/function pendingEstimate/.test(code));
const dup=S.duplicateClientGroups([{id:'a',codigo:'001',documento:''},{id:'b',codigo:'1',documento:''},{id:'c',codigo:'2',documento:'12345678900'},{id:'d',codigo:'9',documento:'123.456.789-00'}]);
ok('detecta repetidos por código ou documento',dup.length===2&&dup.reduce((n,g)=>n+g.length-1,0)===2);
ok('novo aparelho não publica histórico local',/reconcileFirstAuthorizedDevice/.test(code)&&/antes_primeira_nuvem/.test(code));
// v6.1.4 — ORDEM DO DONO (22/09/2026): "retire essa trava de preferir enviar ou
// não, já envia logo; conectou com qualquer das duas senhas, sincroniza na hora".
ok('a guarda de reinstalação existe (compatibilidade) mas NÃO pausa mais',typeof S.decideReinstallGuard==='function');
const gEmpty=S.decideReinstallGuard({activation:'initial',cloudHasData:false,localCount:1919,extraCount:0});
ok('nuvem vazia + dados neste PC: sincroniza direto (sem escolha)',gEmpty.pause===false&&gEmpty.isolate===false&&gEmpty.reason==='sincroniza-direto');
const gHold=S.decideReinstallGuard({activation:'recovery',cloudHasData:true,localCount:2000,extraCount:57});
ok('sobra local sobe sozinha por id (atualiza, não duplica)',gHold.pause===false&&gHold.hold===false&&gHold.isolate===false);
const gOk=S.decideReinstallGuard({activation:'initial',cloudHasData:true,localCount:10,extraCount:0});
ok('sem sobra local: idem, direto',gOk.pause===false&&gOk.reason==='sincroniza-direto');
const gInvite=S.decideReinstallGuard({activation:'invite',cloudHasData:true,localCount:57,extraCount:57});
ok('PC convidado nunca perde dado nem fica parado',gInvite.isolate===false&&gInvite.pause===false);
const gInviteLimpo=S.decideReinstallGuard({activation:'invite',cloudHasData:true,localCount:57,extraCount:0});
ok('PC convidado sem sobra entra direto',gInviteLimpo.pause===false&&gInviteLimpo.reason==='sincroniza-direto');
ok('escolha tem as duas opções',typeof S.publishLocalToCloud==='function'&&typeof S.manterLocalSemEnviar==='function');
ok('sempre puxa antes de escanear e enviar',/await pullAll\(\);[\s\S]{0,2000}scanLocal\(\)/.test(code));
ok('exclusões não travam mais a tela',!/blockedDeletes/.test(code)&&!/approveMassDelete/.test(code));
ok('usa cursor incremental',/\/v1\/changes\?cursor=/.test(code));
ok('usa backoff e não setInterval',/Math\.pow/.test(code)&&!/setInterval\s*\(/.test(code));
ok('script carregado depois do painel',manifest.indexOf('cloudflare_data_sync_patch.js')>manifest.indexOf('cloudflare_sync_patch.js'));
ok('conectar já dispara a sincronização (sem botão)',/tick\('autorizado'\)/.test(fs.readFileSync('cloudflare_sync_patch.js','utf8')));
ok('a pausa de boot foi removida do motor',!/pauseReason='escolha-inicial'/.test(code)&&/state\.paused=false;\s*\n\s*state\.pauseReason='';/.test(code));

console.log('\nRESULTADO: motor Cloudflare passou!');
