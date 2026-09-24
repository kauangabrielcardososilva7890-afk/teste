// ═══════════════════════════════════════════════════════════════════════════
// TESTE — TRAZER DE VOLTA O QUE FOI EXCLUÍDO (recuperação em massa)
//
// Contexto: a faxina da importação apagou contratos de verdade com as
// impressoras dentro (v7.0.1 corrigiu a causa). O dado não desapareceu da
// nuvem: ela marca a exclusão e GUARDA o conteúdo — então é possível trazer de
// volta. Este teste garante as regras que decidem O QUE volta:
//
//   • só as entidades de negócio (nunca usuarios/empresas/config/contadores);
//   • respeita o filtro de data (quando o dono quiser limitar);
//   • conta certo por entidade (o resumo que ele confirma na tela);
//   • registro quebrado/vazio não derruba o processo;
//   • nada é apagado ou sobrescrito — a operação só ADICIONA de volta.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++; console.log('  ✔ ' + nome);
}

// v7.0.2 — mora dentro do patch de backups (regra "um arquivo por módulo")
const arquivo = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
// o patch de backups tem as rotas de APAGAR backup dele (legítimas e antigas).
// Aqui interessa SÓ o bloco da recuperação — o que ele faz ou deixa de fazer.
const marca = '// TRAZER DE VOLTA O QUE FOI EXCLUÍDO';
const corte = arquivo.indexOf(marca);
if(corte < 0){ console.error('  ✘ bloco da recuperação não encontrado no patch de backups'); process.exit(1); }
const code = arquivo.slice(corte);
const window = {};
new Function('window','document','setInterval','console', code)(window, undefined, ()=>{}, { log: ()=>{} });
const R = window.DIGICOPY_RECUPERAR;

console.log('== 1) AS ENTIDADES QUE A FAXINA PODIA LEVAR ==');
ok('regras exportadas', !!R && typeof R.planejarRecuperacao === 'function');
['contratos','parque','leituras','os','contasReceber'].forEach(e=>{
  ok('entidade de negócio incluída: ' + e, R.ENTIDADES_PADRAO.indexOf(e) >= 0);
});
['usuarios','empresas','config','_seq','devices'].forEach(e=>{
  ok('NUNCA entra na recuperação: ' + e, R.ENTIDADES_PADRAO.indexOf(e) < 0);
});

console.log('\n== 2) O QUE VOLTA (regra pura) ==');
const lista = [
  { entity:'contratos',     recordId:'ctr1', data:{ numero:'CT-2021-0123', cliente:'CAIXA ESCOLAR GERALDO TELES DE MENEZES' }, deletedAt: 1700000000000 },
  { entity:'parque',        recordId:'prk1', data:{ modelo:'HP LaserJet' }, deletedAt: 1700000000000 },
  { entity:'parque',        recordId:'prk2', data:{ modelo:'Brother' },    deletedAt: 1700000000000 },
  { entity:'leituras',      recordId:'lei1', data:{ numero:'101' },        deletedAt: 1600000000000 },
  { entity:'usuarios',      recordId:'usr1', data:{ login:'admin' },       deletedAt: 1700000000000 },
  { entity:'config',        recordId:'cfg',  data:{ },                     deletedAt: 1700000000000 },
  null,
  { entity:'contratos' },
];
const plano = R.planejarRecuperacao(lista);
ok('traz contratos + parque + leituras', plano.total === 4);
ok('conta por entidade (é o que aparece na confirmação)',
   plano.porEntidade.contratos === 1 && plano.porEntidade.parque === 2 && plano.porEntidade.leituras === 1);
ok('usuarios NÃO volta', plano.escolhidos.every(r=>r.entity !== 'usuarios'));
ok('config NÃO volta', plano.escolhidos.every(r=>r.entity !== 'config'));
ok('registro quebrado/vazio é ignorado sem quebrar', plano.ignorados >= 2);
ok('período das exclusões calculado (para o resumo)',
   plano.primeiraExclusao === 1600000000000 && plano.ultimaExclusao === 1700000000000);

console.log('\n== 3) FILTRO DE DATA (trazer só uma faixa) ==');
const soRecentes = R.planejarRecuperacao(lista, { desde: 1650000000000 });
ok('filtra o que é mais antigo que a data', soRecentes.total === 3);
ok('mantém só o que é recente', soRecentes.escolhidos.every(r=>r.deletedAt >= 1650000000000));

console.log('\n== 4) O RESUMO EM LÍNGUA DE GENTE ==');
const texto = R.textoResumo(plano);
ok('diz o total', texto.indexOf('4 registro(s)') >= 0);
ok('fala "impressoras de contrato" em vez do nome técnico "parque"', texto.indexOf('impressoras de contrato') >= 0);
ok('mostra o período', /entre/i.test(texto));
ok('lista vazia avisa em vez de trazer nada', R.textoResumo(R.planejarRecuperacao([])) .indexOf('Nada para trazer') >= 0);
ok('rótulo reconhecível usa o nome que a pessoa conhece',
   R.rotuloExcluido({ entity:'contratos', recordId:'ctr1', data:{ numero:'CT-2021-0123' } }) === 'CT-2021-0123');
ok('rótulo cai para o id quando não tem nome',
   R.rotuloExcluido({ entity:'x', recordId:'abcdefghijklmno', data:{} }) === 'abcdefghijkl');

console.log('\n== 5) A OPERAÇÃO SÓ ADICIONA (nunca apaga) ==');
ok('usa a rota de restaurar do Worker', /\/v1\/restore/.test(code));
ok('lê a lista de excluídos do Worker (paginada, não só os últimos 200)',
   code.indexOf('/v1/deleted?limit=1000') >= 0);
ok('NÃO chama rota de apagar nada', !/\/v1\/backup'[\s\S]{0,80}DELETE/.test(code) && !/'DELETE'/.test(code));
ok('pede confirmação no modal do sistema (não no diálogo do navegador)',
   /confirmSistema/.test(code) && !/\bconfirm\(/.test(code) && !/\balert\(/.test(code) && !/\bprompt\(/.test(code));
ok('avisa que pode clicar de novo para as levas mais antigas',
   /clique de novo/i.test(code));
ok('explica que só ADMIN pode (o Worker exige)', /requireAdmin/.test(code));

console.log('\n== 6) RECUPERAÇÃO AUTOMÁTICA (v7.0.4 — sem clicar em nada) ==');
const motor = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const w2 = { DIGICOPY_CLOUD: { token: () => '' } };
new Function('window','localStorage','document', motor)(w2, { getItem: () => null, setItem: () => {}, removeItem: () => {} }, undefined);
const SYNC = w2.DIGICOPY_CLOUD_SYNC;
ok('a regra do dono humano existe no motor (só traz o que gente criou)', typeof SYNC.temDonoHumano === 'function');
ok('registro criado na tela é recuperável', SYNC.temDonoHumano({ data:{ criadoPor:'usr_kauan' } }) === true);
ok('registro de exemplo do sistema NÃO é recuperado', SYNC.temDonoHumano({ data:{ criadoPor:'sistema' } }) === false);
ok('registro sem autor NÃO é recuperado', SYNC.temDonoHumano({ data:{} }) === false);
ok('registro vindo da importação do sistema antigo É recuperado (é dado real)',
   SYNC.temDonoHumano({ data:{ criadoPor:'migracao' } }) === true);
ok('a recuperação não "gasta" a passada enquanto o motor da nuvem for antigo',
   /if\(!varreduraCompleta\)\{/.test(motor) && /state\.avisoMotorAntigo=MOTOR_MINIMO/.test(motor));
// v7.0.8 — "motor novo" passou a significar o motor que NÃO PULA registro: a
// prova é o par (entidade, id) do cursor composto, e não só o `temMais` (o 5.26.6
// tinha `temMais` e mesmo assim perdia registros — provado em
// test_recuperacao_completa.js). Sem isto, o carimbo na nuvem diria "já recuperei"
// e a varredura completa nunca aconteceria depois de publicar o motor certo.
ok('só marca a varredura completa quando o motor devolve o cursor composto',
   /if\(r&&r\.proximoEntity&&r\.proximoId\)varreduraCompleta=true;/.test(motor));
ok('a recuperação automática existe e é chamada sozinha', /async function recuperarAutomatico\(/.test(motor) && /setTimeout\(\(\)=>\{ try\{recuperarAutomatico\(\);\}catch\(e\)\{\} \},4000\)/.test(motor));
ok('roda uma vez por PC (não fica repetindo)',
   /state\.recuperacaoV1=true/.test(motor) && /if\(state\.recuperacaoV1\|\|recuperandoAgora\)return;/.test(motor));
ok('nunca traz duas vezes o mesmo registro (lista do que já trouxe)',
   /RECUP_LEDGER/.test(motor) && /function marcarRecuperado/.test(motor) && /!jaRecuperado\(jaVieram,r\.entity,r\.recordId\)/.test(motor));
// v7.0.8 — a lista do que já trouxe passou a ser por ENTIDADE+id: antes era só
// pelo id, e duas listas com o mesmo id (contrato 7 x parque 7) se confundiam —
// uma delas nunca era recuperada. A leitura aceita as chaves antigas.
ok('a lista do que já trouxe diz de QUEM é o id (e aceita as chaves antigas)',
   /function jaRecuperado\(memoria,entity,recordId\)/.test(motor) &&
   /m\[String\(entity\)\+'\|'\+String\(recordId\)\]\|\|m\[String\(recordId\)\]/.test(motor));
ok('só tenta de novo a cada 60s se falhar (não fica batendo na porta)', /recuperacaoTentativa/.test(motor) && /<60000\)return/.test(motor));
ok('avisa no sino o que voltou', /Recuperação automática: '/.test(motor));
ok('registra na Auditoria', /logAction\('recuperacao','automatica'/.test(motor));
ok('segunda fonte: fotos internas do PC', /async function recuperarDasFotosLocais\(/.test(motor));
ok('as fotos só devolvem contrato/parque/leitura/chamado',
   /const entidades=\['contratos','parque','leituras','os'\];/.test(motor));
ok('registro vindo de foto fica marcado (rastreável)', /recuperadoDe:'foto-local'/.test(motor));
ok('o IndexedDB sabe listar as fotos', /listSnapshots:getAllSnapshots/.test(fs.readFileSync('indexeddb_persistence_patch.js','utf8')));
ok('a varredura da nuvem é paginada (alcança o que foi apagado há meses)',
   /for\(let volta=0;volta<40;volta\+\+\)/.test(motor) && /url\+='&before='\+before/.test(motor));
// v7.0.8 — cursor COMPOSTO (deleted_at, entidade, id) e nada pedido duas vezes:
// sem ele, os registros excluídos no mesmo milissegundo que caíam no fim de uma
// página nunca eram alcançados (defeito provado em test_recuperacao_completa.js).
ok('a paginação usa o cursor composto e não repete registro',
   /beforeEntity=/.test(motor) && /beforeId=/.test(motor) &&
   /if\(vistos\.has\(chave\)\)continue;/.test(motor));

console.log('\n== 7) AVISO INSTANTÂNEO (a nuvem avisa o PC) ==');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
ok('o motor da nuvem tem o canal do aviso instantâneo', worker.indexOf("'/v1/changes/watch'") >= 0 && /async function handleChangesWatch/.test(worker));
ok('o canal NÃO grava nada (só confere se apareceu novidade)', /SELECT MAX\(seq\) AS maxSeq FROM changes/.test(worker) && !/INSERT|UPDATE|DELETE/.test(worker.slice(worker.indexOf('async function handleChangesWatch'), worker.indexOf('async function handleDeleted'))));
ok('o canal é curto de propósito (no máximo 25 s por consulta)', /Math\.min\(25, Math\.max\(3, pedido\)\)/.test(worker));
ok('PC com motor novo + motor de nuvem antigo volta sozinho para o ritmo normal',
   /if\(st===404\|\|st===400\)\{ canalInstantaneoParado=true; \}/.test(motor));
ok('o canal só abre com a janela à vista (não gasta à toa)',
   /if\(typeof document!=='undefined'&&document\.hidden\)return;/.test(motor));
ok('a nuvem carimba a versao nova do motor', /WORKER_VERSION = '5\.26\.7'/.test(worker));

console.log('\nRESULTADO: ' + passou + ' verificações — recuperação em massa segura e explicada!');
