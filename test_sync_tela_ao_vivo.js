// ═══════════════════════════════════════════════════════════════════════════
// TESTE — SINCRONIZAÇÃO: ESPERA CURTA + TELA AO VIVO
//
// Relato do dono (23/09/2026): "o banco demora atualizar (sincronizar); o que
// faço em um computador não dá pra ver no outro". Duas causas:
//
//   1) ESPERA: o motor consultava a nuvem de 60 em 60 segundos e, com a janela
//      escondida (minimizada/atrás de outra), NÃO consultava mais nada — o PC
//      do balcão só se atualizava quando alguém clicava nele.
//   2) TELA: a novidade descia para o banco, mas a lista na tela continuava
//      mostrando o retrato antigo até a pessoa trocar de tela e voltar.
//
// Este teste trava os dois consertos, e principalmente as TRAVAS do redesenho:
// ele não pode acontecer com a pessoa digitando, com modal aberto, na janela
// escondida, em tela de documento ou em rajada.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++; console.log('  ✔ ' + nome);
}

const code = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const window = { DIGICOPY_CLOUD: { token: () => '' } };
new Function('window','localStorage','document', code)(
  window,
  { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  undefined
);
const S = window.DIGICOPY_CLOUD_SYNC;

console.log('== 1) A ESPERA ==');
ok('motor exportado', !!S && typeof S.tick === 'function');
ok('a espera caiu de 60s para 15s com a janela à vista', /HEARTBEAT_MS=15000/.test(code));
ok('com a janela escondida continua consultando (mais devagar, 2 min)',
   /HEARTBEAT_OCULTO_MS=120000/.test(code) && /const base=document\.hidden\?HEARTBEAT_OCULTO_MS:HEARTBEAT_MS/.test(code));
ok('não existe mais o "reagenda sem consultar" que parava o PC escondido',
   !/if\(!document\.hidden\)tick\('heartbeat'\);else scheduleHeartbeat\(\)/.test(code));
ok('o carência do foco continua (não consulta duas vezes em 10s)',
   /Date\.now\(\)-lastTick>10000/.test(code));

console.log('\n== 2) A TELA AO VIVO (regra pura) ==');
ok('regra exportada para teste', typeof S.podeRedesenharSync === 'function');
const base = { hidden:false, modalAberto:false, focoEmCampo:false, podeRenderizar:true, ultimo:0, agora:100000 };
ok('caso normal: pode redesenhar', S.podeRedesenharSync(base) === true);
ok('janela escondida: NÃO redesenha', S.podeRedesenharSync({ ...base, hidden:true }) === false);
ok('modal aberto: NÃO redesenha (pessoa pode estar cadastrando)', S.podeRedesenharSync({ ...base, modalAberto:true }) === false);
ok('cursor dentro de campo/botão: NÃO redesenha', S.podeRedesenharSync({ ...base, focoEmCampo:true }) === false);
ok('tela sem render conhecido (documento/importação): NÃO redesenha',
   S.podeRedesenharSync({ ...base, podeRenderizar:false }) === false);
ok('nunca em rajada: respeita os 4 segundos', S.podeRedesenharSync({ ...base, ultimo:99000, agora:100000 }) === false);
ok('passados os 4 segundos, libera', S.podeRedesenharSync({ ...base, ultimo:95000, agora:100000 }) === true);

console.log('\n== 3) QUEM FICA DE FORA (telas de documento) ==');
const telas = S.telasAoVivo || {};
ok('lista de telas ao vivo existe', Object.keys(telas).length >= 8);
['vendas','leituras','config','orcamento','importar'].forEach(t => {
  ok('tela de documento "' + t + '" NÃO está na lista', !telas[t]);
});
['clientes','produtos','contratos','parque','manutencao','financeiro','usuarios','dashboard'].forEach(t => {
  ok('tela de lista "' + t + '" está na lista', !!telas[t]);
});
ok('redesenha chamando o render da tela (não o navigateTo, que rola a página)',
   !/redesenharTelaAtual[\s\S]{0,900}navigateTo\(/.test(code));

console.log('\n== 4) O REDESENHO SÓ ACONTECE SE A LEITURA TROUXE MUDANÇA ==');
ok('o retorno do pullAll é considerado', /const mudouNaTela=await pullAll\(\)/.test(code));
ok('o redesenho é chamado no fim do ciclo, sob a decisão', /if\(mudouNaTela\)redesenharTelaAtual\(\)/.test(code));

console.log('\nRESULTADO: ' + passou + ' verificações — sincronização quase em tempo real e tela que se atualiza sem atrapalhar!');
