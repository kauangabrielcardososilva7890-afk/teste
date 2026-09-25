const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exitCode = 1; }
  else console.log('  ✔ ' + name);
}
const cloud = fs.readFileSync('cloudflare_sync_patch.js','utf8');
const cloudData = fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
console.log('== PROTEÇÃO DE COTA DO SYNC ==');
// v5.22.63: o motor legado (sync_client.js) e sua camada de compatibilidade
// (limpar_nuvem_patch.js) foram APAGADOS — não há mais timer legado possível.
ok('motor legado apagado', !fs.existsSync('sync_client.js'));
ok('compatibilidade do legado apagada', !fs.existsSync('limpar_nuvem_patch.js'));
ok('painel Cloudflare não faz polling escondido', !/setInterval\s*\(/.test(cloud));
ok('motor Cloudflare não usa setInterval', !/setInterval\s*\(/.test(cloudData));
ok('repouso faz uma consulta incremental por ciclo', /if\(totalSent>0\)await pullAll\(\)/.test(cloudData));
ok('Cloudflare está carregada', manifest.includes('cloudflare_sync_patch.js') && manifest.includes('cloudflare_data_sync_patch.js'));
ok('Firebase automático apagado', !fs.existsSync('sync_realtime_patch.js') && !manifest.includes('sync_realtime_patch.js'));

// v6.1.11 — AUDITORIA: o freio preventivo de cota (Worker v5.24.5) devolve 429 com
// `quota:true` e o recado no campo `error`. O cliente lia o texto só de
// `message`/`aviso`, então o recado chegava como "Erro HTTP 429", o
// ehLimiteDiario NÃO reconhecia e o app ficava batendo na porta (4 tentativas por
// rodada) + inflando o contador de escrita da nuvem, em vez de dormir até a
// virada. Estes asserts prendem as TRÊS pontas do encanamento.
const worker = fs.readFileSync('cloudflare-worker/src/index.js','utf8');
console.log('== FREIO PREVENTIVO DE COTA (Worker -> cliente) ==');
ok('worker marca a pausa com quota:true', /quota:\s*true/.test(worker));
ok('worker devolve a pausa em 429', /quota:\s*true[^}]*\},\s*429\)/.test(worker));
ok('cliente preserva a marca quota no erro', /err\.quota\s*=\s*!!\(data\s*&&\s*data\.quota\)/.test(cloud));
ok('motor trata a marca como limite diário', /ehLimiteDiario\(lastError\)\s*\|\|\s*!!\(e\s*&&\s*e\.quota\)/.test(cloudData));
ok('reconhecer a pausa ainda agenda a volta na virada', /state\.limiteAte\s*=\s*viradaDoLimite\(\)/.test(cloudData));

// AUDITORIA 23/09/2026 (rodada 3) — a contagem do dia no Worker mudou de lugar:
// lote inválido (400) e lote recusado pelo freio (429) NÃO gravam nada e por isso
// não podem mais somar no contador — era esse detalhe que empurrava o freio para
// mais cedo em todos os PCs a cada recusa. A contagem continua ANTES das
// gravações (conservadora): o lote aceito é contado inteiro.
console.log('== CONTAGEM DO DIA SÓ CONTA LOTE ACEITO (Worker) ==');
{
  const iValida = worker.indexOf('INVALID_MUTATION_BATCH');
  // v5.27.0 (rodada 28) — o freio deixou de ter número solto e passou a ler o
  // PLANO (`PLANO.freioDia`): era justamente o número solto do plano grátis que
  // barrava a conta PAGA. A âncora acompanha a fonte da verdade nova.
  const iFreio = worker.indexOf('PLANO.freioDia');
  const iConta = worker.indexOf("somarUso(env, Math.max(1, mutations.length) * 2, 0, ctx)");
  ok('a contagem do dia existe no handlePush', iConta >= 0);
  ok('a contagem fala a MESMA unidade do freio (linhas: 2 por alteração)',
    /somarUso\(env, Math\.max\(1, mutations\.length\) \* 2, 0, ctx\)/.test(worker) &&
    /freioDeCota\(env, mutations\.length \* 2\)/.test(worker));
  ok('a contagem vem DEPOIS da validação do lote', iValida >= 0 && iConta > iValida);
  ok('a contagem vem DEPOIS do freio preventivo', iFreio >= 0 && iConta > iFreio);
  ok('o freio do dia lê o PLANO (uma fonte só: pago 1.000.000/dia, grátis 95.000 como recuo)',
    /freioDia:\s*1000000/.test(worker) && /freioDia:\s*95000/.test(worker) && /const PLANO = PLANO_PAGO/.test(worker));
  ok('o freio do MÊS existe no plano pago (50 milhões/mês, com 10% de folga)',
    /freioMes:\s*45000000/.test(worker) && /PLANO\.freioMes > 0/.test(worker));
  ok('o app reconhece os DOIS recados do freio (dia e mês), senão ficaria batendo na porta',
    /daily row \(write\|read\) limit\|monthly row write limit/.test(cloudData));
  ok('a contagem continua ANTES das gravações', iConta < worker.indexOf('const results = []', iConta));
  ok('não sobrou contagem antes da validação', worker.indexOf("somarUso(env, Array.isArray(mutations)") < 0);
}

if(process.exitCode) process.exit(process.exitCode);
console.log('\nRESULTADO: proteção de cota passou!');
