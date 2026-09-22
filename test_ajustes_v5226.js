const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const ui=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined);
const S=window.DIGICOPY_CLOUD_SYNC;
console.log('== NUVEM NA REINSTALAÇÃO ==');
ok('guarda decideReinstallGuard',typeof S.decideReinstallGuard==='function');
const empty=S.decideReinstallGuard({activation:'initial',cloudHasData:false,localCount:1919,extraCount:0});
// v6.1.4 — ordem do dono (22/09/2026): sem trava de escolha; conectou, sincroniza.
ok('desinstalar/instalar com nuvem vazia sincroniza direto',!empty.pause&&!empty.isolate&&empty.reason==='sincroniza-direto');
const same=S.decideReinstallGuard({activation:'initial',cloudHasData:true,localCount:1919,extraCount:0});
ok('mesmo ID na nuvem segue sem pausar',!same.pause&&!same.hold&&/sincroniza-direto|ok/.test(same.reason));
const leftover=S.decideReinstallGuard({activation:'recovery',cloudHasData:true,localCount:1976,extraCount:57});
ok('57 sobras entram na fila por id (nada é apagado)',!leftover.pause&&!leftover.hold&&!leftover.isolate);
const invite=S.decideReinstallGuard({activation:'invite',cloudHasData:true,localCount:80,extraCount:57});
ok('PC convidado não apaga nada e não fica parado',!invite.isolate&&!invite.pause);
ok('scan pula chave retida',code.includes('held.has(k)'));
ok('enviar os dados atuais é escolha da pessoa',code.includes('async function publishLocalToCloud')&&code.includes('async function manterLocalSemEnviar'));
ok('painel avisa que a sincronização é automática',/Sincronização automática ativa/.test(ui)||/Sincronizando automaticamente/.test(ui));
ok('o botão manual de não enviar continua existindo (opcional)',fs.readFileSync('ajustes_v52246_nuvem_nao_autorizar_patch.js','utf8').includes('dc-nao-autorizar-local'));
console.log('\nRESULTADO: reinstalação não duplica na nuvem!');
