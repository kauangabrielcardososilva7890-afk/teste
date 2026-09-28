// test_zerar_deadlock_r50.js — r50 (Q3): Zerar NUNCA passava com a fila presa.
// "Não foi possível zerar / Aguarde a sincronização atual terminar" — o busy
// quase nunca apagava (push falhando há dias + tick novo a cada 3 s).
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const ler = a => fs.readFileSync(a, 'utf8');
const code = ler('cloudflare_data_sync_patch.js');
const fatia = (ini, fim) => code.slice(code.indexOf(ini), code.indexOf(fim));

console.log('== r50: o Zerar passa mesmo com sync rodando ==');
const reset = fatia('async function resetCloudOnly(){', 'async function baixarTudoDaNuvem');
ok('resetCloudOnly sem if(busy)throw (fim do deadlock)', !reset.includes('if(busy)throw'));
ok('resetCloudOnly ainda troca a geração (aborta o tick)', reset.includes('trocarEstado('));

console.log('== r50: resposta velha não polui o estado novo ==');
const pull = fatia('async function pullAll(opcoes){', 'const ESPERAS=');
ok('pull captura a geração na entrada', pull.includes('geracaoPull=estadoGeracao'));
ok('pull aborta em 2 pontos (leitura rápida + página)', (pull.match(/geracaoPull!==estadoGeracao/g) || []).length >= 2);
const push = fatia('async function pushOutbox(){', 'function leader(){');
ok('push captura a geração e aborta antes de marcar', push.includes('geracaoPush=estadoGeracao') && push.includes('geracaoPush!==estadoGeracao'));
ok('tick não anuncia sucesso após o zero', code.includes('zerou no fim da rodada'));

console.log('== r50: escolha Não-enviar não vaza fila ==');
const naoEnvia = fatia('async function manterLocalSemEnviar(){', 'async function planNaoAutorizarLocal');
ok('manterLocalSemEnviar limpa a outbox', naoEnvia.includes('outbox=[];'));

console.log('== r50: o que FICA travado de propósito ==');
ok('baixarTudo mantém a trava (não troca geração)', fatia('async function baixarTudoDaNuvem(){', 'async function publishLocalToCloud').includes('Aguarde a sincronização atual terminar'));
ok('discardLocal existe e sobraram 2 travas no motor (baixarTudo + discard)', code.includes('async function discardLocalKeepCloud(){') && (code.match(/Aguarde a sincronização atual terminar/g) || []).length === 2);

console.log('== r50: bundles (rodar npm run bundle antes de entregar) ==');
const b1 = ler('app.bundle.js'), b2 = ler('mobile/www/app.bundle.js');
ok('bundles com o aborto por geração', b1.includes('geracaoPull') && b2.includes('geracaoPull') && b1.includes('geracaoPush'));

console.log('\nRESULTADO: zerar deadlock r50 passou!');
