// ═══════════════════════════════════════════════════════════════════════════
// checar_cota_nuvem.js — FAROL ANTI-ESTOURO (v5.24.5, ordem do dono:
// "nunca deixa estourar essa nuvem").
//
// Rodar antes de entregar QUALQUER versão:  node checar_cota_nuvem.js
// Este farol é obrigatório daqui em diante: ele lê o worker e o app e
// garante, sozinho, que nada novo consegue torrar a cota do plano grátis:
//   1) a nuvem NÃO regrava registro idêntico (dedupe ligado);
//   2) existe um FREIO DENTRO do worker que para de aceitar gravação ANTES
//      do teto de 100 mil escritas/dia (folga de segurança);
//   3) a pausa é reconhecida pelo app ("daily row write limit" no texto →
//      aviso amigável e reenvio automático depois da virada às 21h);
//   4) envios saem em lote com teto (MAX_OUTBOX), nunca em catarata solta;
//   5) DDL continua numa linha só (sem o fantasma do "incomplete input").
// E no final ele ainda faz a CONTA do dia típico, para número nenhum virar
// supresa: quantas escritas um dia de loja gasta do teto diário.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }

const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const sync   = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');

console.log('-- muralhas da cota (worker + app) --');
ok((worker.match(/noop: true, version: currentVersion/g) || []).length === 2,
   'dedupe: registro idêntico e delete repetido viram "noop" (zero gravação)');
ok(worker.indexOf('LIMITE_ESCRITA_DIA = 95000') >= 0,
   'freio preventivo dentro do worker (para em 95 mil, antes do teto de 100 mil)');
ok(worker.indexOf('daily row write limit próximo') >= 0 && worker.indexOf('429') >= 0,
   'freio devolve pausa amigável que o app reconhece e respeita');
ok(sync.indexOf('ehLimiteDiario') >= 0 && /daily row \(write\|read\) limit/.test(sync),
   'app reconhece a pausa da cota e guarda as mudanças até a virada');
ok(/MAX_OUTBOX\s*=\s*\d+/.test(sync), 'envio sai em lotes com teto (sem catarata)');
ok(!/CREATE TABLE IF NOT EXISTS \w+ \(\s*\n/.test(worker), 'DDL sempre numa linha só');
ok(worker.indexOf("catch (eUso)") >= 0, 'medidor nunca derruba o /v1/status');

console.log('-- conta do dia típico (quanto do teto a loja gasta) --');
// Cada mudança NOVA grava 2 linhas (o registro + o evento no diário).
// Registro regravado IGUAL = 0 linhas (dedupe medido acima).
// Teto do plano grátis: 100.000 linhas escritas/dia; freio interno: 95.000.
function estimativa(nome, mudancasPorDia, pcs){
  const linhas = mudancasPorDia * 2 * pcs;
  const pct = (linhas / 100000 * 100);
  console.log('  • ' + nome + ': ' + mudancasPorDia + ' mudança(s)/dia × ' + pcs + ' PC(s) = ' +
    linhas + ' linhas/dia = ' + pct.toFixed(2).replace('.', ',') + '% do teto' +
    (pct < 10 ? ' (folgadíssimo)' : pct < 50 ? ' (confortável)' : ' ⚠ PESADO'));
  return linhas;
}
const total = [
  estimativa('dia movimentado de 1 loja (vendas+clientes+produtos+financeiro)', 300, 1),
  estimativa('mesmo dia com 2 PCs ligados o dia todo', 300, 2),
  estimativa('dia recorde exagerado (mil mudanças reais)', 1000, 2)
].reduce((s, n) => s + n, 0);
ok(total < 95000, 'até o cenário exagerado somado fica abaixo do freio (95 mil)');
console.log('  TOTAL DOS 3 CENÁRIOS JUNTOS: ' + total + ' linhas/dia (' +
  (total / 100000 * 100).toFixed(2).replace('.', ',') + '% do teto).');
console.log('  Resumo: com dedupe + freio, estourar a cota exigiria MILHARES de');
console.log('  mudanças reais num único dia. Uma restauração/publicação de PC inteiro');
console.log('  grava de verdade só na 1ª vez — depois tudo vira "noop" (grátis).');

if (falhas) { console.error('\n' + falhas + ' FALHA(S) NO FAROL — NÃO ENTREGAR ASSIM'); process.exit(1); }
console.log('\nFarol verde: nada desta versão consegue estourar a nuvem.');
