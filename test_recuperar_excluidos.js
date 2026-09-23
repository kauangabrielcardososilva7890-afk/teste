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
ok('lê a lista de excluídos do Worker', /\/v1\/deleted\?limit=200/.test(code));
ok('NÃO chama rota de apagar nada', !/\/v1\/backup'[\s\S]{0,80}DELETE/.test(code) && !/'DELETE'/.test(code));
ok('pede confirmação no modal do sistema (não no diálogo do navegador)',
   /confirmSistema/.test(code) && !/\bconfirm\(/.test(code) && !/\balert\(/.test(code) && !/\bprompt\(/.test(code));
ok('avisa que pode clicar de novo para as levas mais antigas',
   /clique de novo/i.test(code));
ok('explica que só ADMIN pode (o Worker exige)', /requireAdmin/.test(code));

console.log('\nRESULTADO: ' + passou + ' verificações — recuperação em massa segura e explicada!');
