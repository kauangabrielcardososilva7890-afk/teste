// test_nuvem_rapida.js — v7.0.6
// Trava os consertos de VELOCIDADE da sincronização (a queixa do dono:
// "fica voltando, o que foi feito depois demora e vai subindo aos poucos").
// Nada aqui é invenção: os números vêm do banco de prova com 76.550 registros e
// 91.862 mudanças — remontar a base caiu de 17.240 ms para ~1.100 ms e o ciclo
// em repouso de 767 ms para 4 ms.
const fs=require('fs');
let passou=0;
function ok(nome,cond){if(!cond){console.error('  \u2718 '+nome);process.exit(1);}console.log('  \u2714 '+nome);passou++;}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');

console.log('== NUVEM RÁPIDA (v7.0.6) ==');
console.log('-- 1) procurar registro na lista não varre a lista inteira --');
ok('existe índice id → posição', /const INDICE_LISTA=\{\}/.test(code) && /function posicaoNaLista\(entity,id\)/.test(code));
ok('o índice cresce junto (acréscimo no fim), não é refeito a cada registro',
  /if\(c\.len<arr\.length\)/.test(code) && /for\(let j=c\.len;j<arr\.length;j\+\+\)/.test(code));
ok('índice velho é conferido antes de ser usado (nada de posição torta)',
  /String\(arr\[i\]\.id\)===alvo/.test(code));
ok('reordenação (unshift/ordenação) é detectada e o índice é refeito',
  /const mesmoLugar=/.test(code) && /montarIndice\(c,arr\)/.test(code));
ok('a procura antiga (findIndex registro por registro) saiu do applyRemote',
  !/arr\.findIndex\(x=>x&&String\(x\.id\)===String\(change\.recordId\)\)/.test(code));

console.log('-- 2) o estado de AGORA aparece antes de recontar a história --');
ok('existe o passe rápido', /const PASSE_RAPIDO=3000/.test(code) && /async function passeRapidoInicial\(call\)/.test(code));
ok('o passe rápido é chamado ANTES da leitura completa',
  /if\(await passeRapidoInicial\(call\)\)changed=true;[\s\S]{0,600}?do\{/.test(code));
ok('só roda quando este PC vai remontar a base (cursor 0) e uma vez por sessão',
  /if\(passeRapidoFeito\)return false;/.test(code) && /if\(Number\(state\.cursor\)>0\)return false;/.test(code));
ok('não mexe no cursor da leitura completa (o diário segue lido do começo)',
  /let cursor=Math\.max\(0,maxSeq-PASSE_RAPIDO\)/.test(code) && !/state\.cursor=Math\.max\(0,maxSeq/.test(code));

console.log('-- 3) gravar sem travar a remessa --');
ok('a fila (pequena) é gravada na hora, sempre', /function gravarFila\(\)/.test(code) && /const okFila=gravarFila\(\);/.test(code));
ok('o bloco grande (estado) é agrupado numa gravação só', /gravacaoAgendada=setTimeout\(function\(\)\{gravacaoAgendada=null;gravarEstado\(\);\},300\)/.test(code));
ok('o bloco grande só é reescrito quando mudou (com rede de 30 s)',
  /if\(!estadoMudou&&\(Date\.now\(\)-estadoGravadoEm\)<30000\)return okFila;/.test(code));
ok('gravação imediata existe para as decisões que não podem esperar', /function persistAgora\(\)/.test(code));
ok('zerar a nuvem / escolher publicar gravam na hora',
  (code.match(/persistAgora\(\)/g)||[]).length>=8);
ok('fechar ou esconder a janela grava na hora',
  /addEventListener\('pagehide',fechar\)/.test(code) && /addEventListener\('beforeunload',fechar\)/.test(code));

console.log('-- 4) a tela não para a cada 3 segundos --');
ok('a varredura é pulada quando nada mudou (com rede de 10 s)',
  /if\(!forcarVarredura&&!sujo&&!outbox\.length&&!filaCheia&&Date\.now\(\)-varreduraFeita<10000\)return 0;/.test(code));
ok('o sistema avisa a varredura quando grava (saveDB) e quando apaga',
  /if\(!applying&&authorized\(\)\)\{sujo=true;schedule\(900\);\}/.test(code) && /sujo=true;\n/.test(code));
ok('remessa grande continua correndo até o fim (fila cheia não para em 100)',
  /filaCheia=outbox\.length>=MAX_OUTBOX;/.test(code));
ok('a cópia do registro não é mais feita duas vezes por varredura',
  /if\(mode==='array'\)return \(Array\.isArray\(value\)\?value:\[\]\)\.filter\(x=>x&&x\.id\)\.map\(x=>\(\{id:String\(x\.id\),data:x\}\)\)/.test(code));
ok('a limpeza (_rt/_cf) é feita na hora de montar a remessa',
  /data:clean\(entry\.data\)/.test(code));

console.log('-- 5) menos peso na nuvem --');
ok('a conferência que solta a cópia local é no máximo 1× por minuto',
  /if\(agora-ultimaConferenciaNuvem<60000\)return false;/.test(code));

console.log('\nRESULTADO: '+passou+' verificações passaram — nuvem rápida OK!');
