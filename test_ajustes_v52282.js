const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const wpkg=JSON.parse(fs.readFileSync('cloudflare-worker/package.json','utf8'));
const mig=fs.readFileSync('cloudflare-worker/migrations/0004_menos_gravacoes.sql','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.82 ==');
ok('versão da linha 5.22.x (não amarrar teste à versão exata)',/^\d+\.\d+\.\d+$/.test(pkg.version));
ok('a nuvem se identifica como 0.4.9',/API_VERSION = '0\.4\.9'/.test(worker)&&wpkg.version==='0.4.9');

// ── menos gravação: índice que ninguém usa sai ──
ok('saem os dois índices que eu criei para a contagem',/DROP INDEX IF EXISTS idx_records_deleted;/.test(mig)&&/DROP INDEX IF EXISTS idx_records_entity_deleted;/.test(mig));
ok('sai o índice de updated_at, que nenhuma consulta usava',/DROP INDEX IF EXISTS idx_records_updated;/.test(mig)&&!/ORDER BY[\s\S]{0,40}updated_at/.test(worker));
ok('sai o índice sobre a própria chave primária',/DROP INDEX IF EXISTS idx_changes_cursor;/.test(mig));
ok('o índice que é usado de verdade fica',!/DROP INDEX IF EXISTS idx_changes_record/.test(mig));

// ── menos leitura: resumo guardado ──
ok('o resumo é guardado e reaproveitado',/async function resumoDaNuvem/.test(worker)&&/RESUMO_VALE_POR = 10 \* 60 \* 1000/.test(worker));
ok('a tela usa o resumo em vez de contar tudo de novo',/const totals = await resumoDaNuvem\(env, fresco\)/.test(worker));
// v6.1.5 — BUG ACHADO NO TESTE DE DOIS PCs: o resumo guardado fazia o painel
// mostrar contagem de até 10 minutos atrás (parecia que nada tinha subido).
// Agora quem pede fresco (/v1/status?fresh=1) recebe na hora e zerar a nuvem
// apaga o resumo guardado.
ok('painel/check-up podem pedir a contagem FRESCA',/searchParams\.get\('fresh'\) === '1'/.test(worker)&&/resumoDaNuvem\(env, fresco\)/.test(worker));
ok('zerar a nuvem apaga o resumo guardado',/DELETE FROM system_meta WHERE key = 'resumo_json'/.test(worker));
ok('o app pede a contagem fresca no painel',/\/v1\/status\?fresh=1/.test(fs.readFileSync('cloudflare_sync_patch.js','utf8')));
ok('o total sai da mesma consulta, sem contar duas vezes',/totais\.records \+= ativos;/.test(worker)&&/totais\.deleted \+= apagados;/.test(worker));
ok('o resumo é gravado numa linha só',/'resumo_json'/.test(worker)&&/ON CONFLICT\(key\) DO UPDATE/.test(worker));
ok('se nem o resumo sair, avisa que a sincronização não é afetada',/A sincronização não é afetada/.test(worker));
console.log('\nRESULTADO: ajustes v5.22.82 passaram!');
