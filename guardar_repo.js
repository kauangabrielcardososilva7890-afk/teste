// ═══════════════════════════════════════════════════════════════════════════
// GUARDAR REPO — fecha a rodada sem perder nada (pedido dele, 22/09/2026:
// "pq esse .git fica sempre voltando, o que podemos fazer pra n ficar voltando
// pra trás?").
//
// O QUE ACONTECE (e por quê): a pasta de trabalho desta sessão pode voltar a um
// ponto antigo do repositório. O que estiver SÓ aqui dentro se perde; o que
// estiver no GitHub, não. Então a regra passou a ser: terminou a rodada, roda
// este arquivo. Ele:
//   1) mostra onde o repositório está AGORA (branch + commit);
//   2) busca o que já está no GitHub (origin);
//   3) se houver mudança não salva, COMMITA;
//   4) EMPURRA para a branch da sessão (nunca em outra);
//   5) avisa se este checkout ficou atrás/divergente, ensinando o conserto certo
//      (git reset --soft FETCH_HEAD — o mesmo que já foi usado quando o push foi
//      recusado) em vez de qualquer um tentar adivinhar.
//
// Uso:  node guardar_repo.js            (ou npm run guardar)
//       node guardar_repo.js --check    (só olha, não commita nem empurra)
//       node guardar_repo.js -m "texto" (mensagem do commit)
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');

const CHECK = process.argv.includes('--check');
const msgIdx = process.argv.indexOf('-m');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const BRANCH = (pkg.digicopy && pkg.digicopy.branch) || '';

function git(args, opts){
  return execFileSync('git', args, Object.assign({ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }, opts || {})).trim();
}
function gitOk(args){
  try{ return { ok: true, out: git(args) }; }catch(e){ return { ok: false, out: String((e && (e.stdout || e.message)) || e).trim() }; }
}
function hora(){ const d = new Date(); const p = n => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + 'h' + p(d.getMinutes()); }

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(' GUARDAR REPO — nada se perde');
console.log('═══════════════════════════════════════════════════════════════\n');

if (!fs.existsSync('.git')){ console.error('✘ Esta pasta não é um repositório git.'); process.exit(1); }

const branchAtual = gitOk(['rev-parse', '--abbrev-ref', 'HEAD']).out || '';
console.log('• Branch agora: ' + (branchAtual || '(sem nome)'));
if (BRANCH && branchAtual && branchAtual !== BRANCH){
  console.log('⚠  A branch desta sessão é ' + BRANCH + '. Nada será empurrado de outra branch.');
}

// 1) situacao local
const pendentes = gitOk(['status', '--porcelain']).out;
const linhas = pendentes ? pendentes.split('\n').filter(Boolean) : [];
console.log('• Arquivos alterados: ' + linhas.length);
linhas.slice(0, 12).forEach(l => console.log('   ' + l));
if (linhas.length > 12) console.log('   … e mais ' + (linhas.length - 12));

// 2) busca o que já está no GitHub
const fetch = gitOk(['fetch', 'origin', BRANCH || branchAtual]);
if (fetch.ok){
  const atras = Number(gitOk(['rev-list', '--count', 'HEAD..FETCH_HEAD']).out) || 0;
  const frente = Number(gitOk(['rev-list', '--count', 'FETCH_HEAD..HEAD']).out) || 0;
  console.log('• GitHub: ' + (atras ? (atras + ' commit(s) que você ainda não tem') : 'em dia com o seu') +
              (frente ? (' · ' + frente + ' commit(s) seus só aqui') : ''));
  if (atras > 0 && frente > 0){
    console.log('\n⚠  Este checkout ficou PARA TRÁS e ao mesmo tempo tem commit novo seu (é o caso do');
    console.log('   ".git voltando"). Conserto certo, sem perder trabalho nenhum:');
    console.log('     git reset --soft FETCH_HEAD     (traz a base do GitHub e mantém o seu trabalho)');
    console.log('     node guardar_repo.js            (comita por cima e empurra)');
  }
}else{
  console.log('• Não deu para falar com o GitHub agora (sem internet?). O trabalho local não é perdido.');
}

// 3) commit
let commitado = '';
if (linhas.length && !CHECK){
  try{
    git(['add', '-A']);
    const msg = msgIdx >= 0 && process.argv[msgIdx + 1] ? process.argv[msgIdx + 1] : ('Checkpoint ' + hora() + ' (guardar_repo.js)');
    git(['commit', '-q', '-m', msg]);
    commitado = gitOk(['rev-parse', '--short', 'HEAD']).out;
    console.log('✔ Commit feito: ' + commitado + ' — ' + msg);
  }catch(e){
    console.error('✘ Não deu para commitar: ' + String(e.message || e).slice(0, 200));
  }
}else if (linhas.length && CHECK){
  console.log('(--check: não commitei nada)');
}else{
  console.log('• Nada para commitar.');
}

// 4) push
if (!CHECK && BRANCH){
  const push = gitOk(['push', 'origin', 'HEAD:' + BRANCH]);
  if (push.ok){
    console.log('✔ Enviado para o GitHub: origin/' + BRANCH);
  }else if (/fetch first|non-fast-forward|rejected/i.test(push.out)){
    console.log('✘ O GitHub recusou (a branch andou lá). Faça o conserto que está escrito acima:');
    console.log('     git fetch origin ' + BRANCH + ' && git reset --soft FETCH_HEAD && node guardar_repo.js');
  }else{
    console.log('✘ Push não passou: ' + push.out.split('\n').slice(-3).join(' '));
  }
}

// 5) retrato final
const head = gitOk(['log', '--oneline', '-1']).out;
console.log('\n• Fim: ' + (head || '(sem commit)'));
console.log('• Link do que está no GitHub (repositório privado, pede login):');
console.log('  https://github.com/' + ((pkg.digicopy && pkg.digicopy.repo) || 'kauangabrielcardososilva7890-afk/teste') + '/archive/refs/heads/' + (BRANCH || branchAtual) + '.zip');
console.log('═══════════════════════════════════════════════════════════════\n');
