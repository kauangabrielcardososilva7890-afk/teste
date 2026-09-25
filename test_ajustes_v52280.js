const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const w={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document','db',code)(w,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
const S=w.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.80 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));
const recado="D1_ERROR: Your account has exceeded D1's free tier daily row write limit. Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.";
ok('o sistema reconhece o limite diário do banco grátis',S.ehLimiteDiario(recado)===true);
ok('erro comum não é confundido com limite',S.ehLimiteDiario('Falha de rede')===false&&S.ehLimiteDiario('')===false);
// v5.24.34 — SUPERSESSÃO: o recado do limite parou de falar "de hoje/grátis"
// (era o mundo gratuito); no plano pago o limite é do PERÍODO (mensal).
// v7.0.17 (rodada 28) — o aviso passou a dizer DE ONDE vem a parada (o freio
// preventivo do motor, não o teto do plano): era essa confusão que fazia parecer
// que ele estava no plano grátis quando o freio disparava.
ok('o aviso é em português e diz que nada se perdeu',/Nada foi perdido/.test(S.recadoDoLimite())&&/freio preventivo de gravações/.test(S.recadoDoLimite()));
ok('e o aviso NÃO chama o dono de plano grátis (a conta dele é paga)',!/teto grátis|plano grátis/i.test(S.recadoDoLimite()));
ok('o app reconhece o recado do freio do MÊS também (plano pago tem teto mensal)',S.ehLimiteDiario('D1_ERROR: monthly row write limit reached')===true);
ok('o aviso diz a hora de Brasília',/21h, horário de Brasília/.test(S.recadoDoLimite()));
const virada=S.viradaDoLimite();
ok('a virada é depois de agora e dentro de 24h',virada>Date.now()&&virada-Date.now()<=24*3600000+200000);
ok('a virada é meia-noite no horário de Londres',new Date(virada).getUTCHours()===0);
ok('para de bater na porta à toa enquanto o limite não vira',/timer=setTimeout\(\(\)=>tick\('limite-conferido'\)/.test(code));
ok('a hora da virada fica guardada',/state\.limiteAte=viradaDoLimite\(\)/.test(code));
ok('o painel também mostra o recado em português',/motorLimite\(contagemFalhou\)\)contagemFalhou=window\.DIGICOPY_CLOUD_SYNC\.recadoDoLimite\(\)/.test(painel));
console.log('\nRESULTADO: ajustes v5.22.80 passaram!');
