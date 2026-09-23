// ═══════════════════════════════════════════════════════════════════════════
// TESTE — A IMPRESSORA NÃO SOME MAIS DO CONTRATO
//
// Relato do dono (23/09/2026): "quando eu coloco alguma impressora em algum
// contrato, não sei quanto tempo depois, ela some do nada".
//
// CAUSA RAIZ (achada em 23/09/2026, `locacao_patch.js`): ao importar os dados do
// sistema antigo, o importador varre "dados de demonstração" e apaga. Ele
// reconhecia o dado de exemplo pelo NÚMERO do contrato, no formato
// CT-ano-0001 — que é EXATAMENTE o formato que o próprio sistema gera para
// contrato de verdade (app.js, renderModalContrato). Resultado: contrato
// verdadeiro, criado na tela, era apagado na próxima importação — e o `parque`
// (as impressoras que o dono tinha acabado de colocar nele), as leituras e as
// faturas iam junto.
//
// CONSERTO: a decisão passou a exigir também que o registro NÃO tenha dono
// humano (quem cria na tela grava `criadoPor` = id do usuário logado; o dado de
// exemplo não tem autor, ou está como 'sistema'/'demo'). Mesmo defeito existia
// no filtro dos chamados (OS-ano-0001) e foi travado igual.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++; console.log('  ✔ ' + nome);
}

const code = fs.readFileSync('locacao_patch.js', 'utf8');

console.log('== 1) A REGRA: número igual + SEM dono humano ==');
// Executa a função REAL do arquivo (extraída do próprio código)
const m = /function jbSemDonoHumano\(r\)\{[\s\S]*?\n\}/.exec(code);
ok('a função de decisão existe no arquivo', !!m);
const jbSemDonoHumano = new Function('return (' + m[0] + ')')();

ok('registro do seed, sem autor → é demonstração', jbSemDonoHumano({ numero:'CT-2026-0001' }) === true);
ok('registro do seed, autor "sistema" → é demonstração', jbSemDonoHumano({ numero:'CT-2026-0001', criadoPor:'sistema' }) === true);
ok('registro do seed, autor "demo" → é demonstração', jbSemDonoHumano({ numero:'CT-2026-0001', criadoPor:'demo' }) === true);
ok('CONTRATO DE VERDADE (autor = usuário logado) → NÃO é demonstração',
   jbSemDonoHumano({ numero:'CT-2026-0001', criadoPor:'usr_kauan', criadoPorNome:'Kauan' }) === false);
ok('contrato do Denivaldo → NÃO é demonstração',
   jbSemDonoHumano({ numero:'CT-2026-0042', criadoPor:'usr_denivaldo', criadoPorNome:'Denivaldo' }) === false);
ok('funcionário cadastrado na tela → NÃO é demonstração',
   jbSemDonoHumano({ numero:'CT-2026-0007', criadoPor:'usr_abc123', criadoPorNome:'Maria' }) === false);
ok('registro vazio/lixo não derruba o importador', jbSemDonoHumano(null) === false || jbSemDonoHumano(null) === true);
ok('objeto vazio: sem autor → tratado como demonstração', jbSemDonoHumano({}) === true);

console.log('\n== 2) OS DOIS FILTROS USAM A TRAVA ==');
const filtroCtr = /const demoCtrIds = db\.contratos[\s\S]{0,300}?\.map\(c=>c\.id\);/.exec(code);
ok('filtro dos contratos achado', !!filtroCtr);
ok('contratos: exige jbSemDonoHumano', !!filtroCtr && filtroCtr[0].includes('jbSemDonoHumano(c)'));
const filtroOs = /db\.os = db\.os\.filter\([\s\S]{0,200}?\);/.exec(code);
ok('filtro dos chamados achado', !!filtroOs);
ok('chamados: exige jbSemDonoHumano (mesmo defeito, mesma trava)', !!filtroOs && filtroOs[0].includes('jbSemDonoHumano(o)'));
ok('o padrão do número sozinho não decide mais nada',
   !/filter\(c=>c\.empresaId===empId && !jbEhMigracao\(c\) && !c\.codigoAntigo && \/\^CT-/.test(code));

console.log('\n== 3) O PARQUE (as impressoras) ACOMPANHA O CONTRATO ==');
ok('o parque só é apagado pelos contratos que a trava aprovou',
   /db\.parque\s*=\s*db\.parque\.filter\(p=>!demoCtrIds\.includes\(p\.contratoId\)\)/.test(code));
ok('as leituras e as faturas seguem a mesma lista',
   /db\.leituras\s*=\s*db\.leituras\.filter\(l=>!demoCtrIds/.test(code) &&
   /db\.contasReceber = db\.contasReceber\.filter\(cr=>!demoCtrIds/.test(code));
ok('a limpeza continua existindo (só ficou mais criteriosa)',
   /result\.demosRemovidos \+=/.test(code));

console.log('\nRESULTADO: ' + passou + ' verificações — contrato e impressora do dono não são mais tratados como demonstração!');
