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
ok('janela à vista: procura novidade a cada 3 segundos (quase instantâneo)', /HEARTBEAT_MS=3000/.test(code));
ok('com a janela escondida continua consultando (a cada 15s)',
   /HEARTBEAT_OCULTO_MS=15000/.test(code) && /const base=document\.hidden\?HEARTBEAT_OCULTO_MS:HEARTBEAT_MS/.test(code));
ok('ao clicar de volta na janela, procura NA HORA (tolerância de 1s)',
   /Date\.now\(\)-lastTick>1000/.test(code) && !/lastTick>10000/.test(code));
ok('continua sendo UMA consulta incremental por rodada (não baixa a base toda)',
   /\/v1\/changes\?cursor=/.test(code) && /if\(!data\.hasMore\)break;/.test(code));
ok('não existe mais o "reagenda sem consultar" que parava o PC escondido',
   !/if\(!document\.hidden\)tick\('heartbeat'\);else scheduleHeartbeat\(\)/.test(code));
ok('o carência do foco continua (não consulta em rajada ao alternar janelas)',
   /Date\.now\(\)-lastTick>1000/.test(code));

console.log('\n== 1b) A ABA ESQUECIDA NÃO SEGURA MAIS A ATUALIZAÇÃO ==');
ok('existe o caminho de leitura para aba visível', /async function tickSohLeitura\(reason\)/.test(code));
ok('aba escondida e não-líder não gasta consulta',
   /if\(!leader\(\)\)\{[\s\S]{0,200}document\.hidden\)return false;/.test(code));
ok('o caminho de leitura não envia remessa (quem envia é só a líder)',
   /tickSohLeitura[\s\S]{0,900}?pullAll\(\{silencioso:true\}\)/.test(code) &&
   !/tickSohLeitura[\s\S]{0,900}?pushOutbox\(/.test(code));
ok('a leitura de aba visível não faz trabalho de líder (não mexe em exclusões)',
   !/tickSohLeitura[\s\S]{0,900}?varrerDemonstracao/.test(code));

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
ok('v7.0.2 — durante a CARGA da nuvem não redesenha (nada aparece em pedaços)',
   S.podeRedesenharSync({ ...base, cargaAberta:true }) === false);
ok('passados os 4 segundos, libera', S.podeRedesenharSync({ ...base, ultimo:95000, agora:100000 }) === true);

console.log('\n== 2b) CARGA COMPLETA À VISTA (v7.0.2) ==');
ok('página maior por consulta (menos idas e voltas)', /const POR_PAGINA=1000/.test(code));
ok('o aviso de carga existe e cobre a tela', /id='digicopy-carga-nuvem'/.test(code) && /Baixando os dados da nuvem/.test(code));
ok('o aviso mostra a contagem do que já veio', /registros trazidos/.test(code));
ok('a carga completa é ligada na primeira sincronização', /pedirCarga\(!state\.initialPull\|\|reason==='baixar-tudo-da-nuvem'\)/.test(code));
// v7.0.3 — ordem do dono: "de mostrar dados quero NADA que envolva eu fazer
// alguma coisa, só quero que mostre normal". O aviso de carga só aparece quando
// este PC NÃO tem base (aí não há o que mostrar); com base, a leitura é silenciosa.
ok('o aviso de carga NÃO aparece quando já existe base neste PC',
   /const baseVazia=/.test(code) && /const comAviso=cargaCompleta&&baseVazia;/.test(code));
ok('com base aqui, a atualização chega sem tela nenhuma na frente',
   /tickSohLeitura[\s\S]{0,900}?silencioso:true/.test(code));
ok('o aviso some no fim e também se der erro (ninguém fica preso)',
   /mostrarCargaNuvem\(false\);\s*\/\/ nunca deixar/.test(code) && /finally\{if\(cargaAberta\)mostrarCargaNuvem\(false\)/.test(code));

console.log('\n== 3) QUEM FICA DE FORA (telas de documento) ==');
const telas = S.telasAoVivo || {};
ok('lista de telas ao vivo existe', Object.keys(telas).length >= 8);
// v7.0.19 — vendas e leituras VIRARAM ao vivo: os renders são só releitura da lista
// (o que se digita fica em modal/campo, protegido pela trava) e ficar de fora deixava
// a tela velha no outro PC ("não aparece"). Config continua de fora (o render escreve
// nos campos e apagaria o não-salvo); orcamento/importar nem são telas com view.
['vendas','leituras'].forEach(t => {
  ok('tela de lista "' + t + '" virou ao vivo (v7.0.19)', !!telas[t]);
});
['config','orcamento','importar'].forEach(t => {
  ok('tela de documento "' + t + '" NÃO está na lista', !telas[t]);
});
['clientes','produtos','contratos','parque','manutencao','financeiro','usuarios','dashboard'].forEach(t => {
  ok('tela de lista "' + t + '" está na lista', !!telas[t]);
});
ok('redesenha chamando o render da tela (não o navigateTo, que rola a página)',
   !/redesenharTelaAtual[\s\S]{0,900}navigateTo\(/.test(code));

console.log('\n== 4) O REDESENHO SÓ ACONTECE SE A LEITURA TROUXE MUDANÇA ==');
ok('o retorno do pullAll é considerado', /const mudouNaTela=await pullAll\(\)/.test(code) && /pedirCarga\(!state\.initialPull/.test(code));
ok('o redesenho é chamado no fim do ciclo, sob a decisão e sem se perder',
   /if\(mudouNaTela\)\{redesenhoPendente=true;tentarRedesenhoPendente\(\);\}/.test(code));

console.log('\nRESULTADO: ' + passou + ' verificações — sincronização quase em tempo real e tela que se atualiza sem atrapalhar!');
