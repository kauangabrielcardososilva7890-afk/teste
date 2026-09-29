// ═══════════════════════════════════════════════════════════════════════════
// TESTE r56 — Zerar sem exigir bloqueio + aparelhos velhos saem sozinhos
//
// Pedido dele 29/09/2026: os trastes de logins repetidos travavam o Zerar
// (409 exigindo bloquear os outros antes). Agora o Zerar desconecta os outros
// sozinho; o aparelho que pediu continua; a senha da nuvem NUNCA é tocada.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');

let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++;
  console.log('  ✔ ' + nome);
}

const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const tela = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');

console.log('== r56: Zerar sem bloqueio prévio, aparelhos saem sozinhos ==');
ok('gate de aparelho único removido', worker.indexOf('RESET_REQUIRES_SINGLE_DEVICE') < 0);
ok('Zerar conta os outros aparelhos (menos o que pediu)', worker.indexOf('WHERE id != ? AND revoked_at IS NULL AND excluido_em IS NULL') >= 0);
ok('Zerar revoga + tira os outros da lista', worker.indexOf('UPDATE devices SET revoked_at = ?, excluido_em = ?') >= 0);
ok('auditoria registra quantos saíram', worker.indexOf('aparelhosDesconectados') >= 0);
ok('backup de segurança antes do wipe continua', worker.indexOf('Backup antes de zerar a nuvem') >= 0);
ok('segredos (senhas) fora do wipe', worker.indexOf("DELETE FROM system_meta WHERE key = 'resumo_json'") >= 0 && !/DELETE FROM (segredos|secrets)/.test(worker));
ok('botão não manda mais bloquear antes', tela.indexOf('Bloqueie os outros aparelhos antes') < 0);
ok('botão avisa que os outros saem sozinhos e a senha não muda', tela.indexOf('DESCONECTADOS sozinhos') >= 0 && tela.indexOf('A senha da nuvem NÃO muda') >= 0);
ok('worker carimbado 5.28.2', worker.indexOf("const WORKER_VERSION = '5.28.2'") >= 0);
const motor = fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8');
ok('motor regenerado com a 5.28.2', motor.indexOf('5.28.2') >= 0 && motor.indexOf('aparelhosDesconectados') >= 0);

console.log('\nRESULTADO: ' + passou + ' verificações r56 — Zerar destravado!');
