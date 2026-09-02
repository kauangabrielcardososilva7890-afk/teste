const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const wpkg=JSON.parse(fs.readFileSync('cloudflare-worker/package.json','utf8'));
const mig=fs.readFileSync('cloudflare-worker/migrations/0004_menos_gravacoes.sql','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.82 ==');
ok('versão subiu para 5.22.82',pkg.version==='5.22.82');
ok('a nuvem se identifica como 0.4.7',/API_VERSION = '0\.4\.7'/.test(worker)&&wpkg.version==='0.4.7');

// ── menos gravação: índice que ninguém usa sai ──
ok('saem os dois índices que eu criei para a contagem',/DROP INDEX IF EXISTS idx_records_deleted;/.test(mig)&&/DROP INDEX IF EXISTS idx_records_entity_deleted;/.test(mig));
ok('sai o índice de updated_at, que nenhuma consulta usava',/DROP INDEX IF EXISTS idx_records_updated;/.test(mig)&&!/ORDER BY[\s\S]{0,40}updated_at/.test(worker));
ok('sai o índice sobre a própria chave primária',/DROP INDEX IF EXISTS idx_changes_cursor;/.test(mig));
ok('o índice que é usado de verdade fica',!/DROP INDEX IF EXISTS idx_changes_record/.test(mig));

// ── menos leitura: resumo guardado ──
ok('o resumo é guardado e reaproveitado',/async function resumoDaNuvem/.test(worker)&&/RESUMO_VALE_POR = 10 \* 60 \* 1000/.test(worker));
ok('a tela usa o resumo em vez de contar tudo de novo',/const totals = await resumoDaNuvem\(env\)/.test(worker));
ok('o total sai da mesma consulta, sem contar duas vezes',/totais\.records \+= ativos;/.test(worker)&&/totais\.deleted \+= apagados;/.test(worker));
ok('o resumo é gravado numa linha só',/'resumo_json'/.test(worker)&&/ON CONFLICT\(key\) DO UPDATE/.test(worker));
ok('se nem o resumo sair, avisa que a sincronização não é afetada',/A sincronização não é afetada/.test(worker));
console.log('\nRESULTADO: ajustes v5.22.82 passaram!');
