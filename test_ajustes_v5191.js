// ═══════════════════════════════════════════════════════════════════════════
// TESTE — ajustes_v5191 + fim das ações MANUAIS de nuvem
//
// ORDEM DO DONO (23/09/2026): "remove, pois não quero algo manual que envia pra
// nuvem, quero automático".
//
// Antes este teste provava que o sync manual usava confirmSistema em vez do
// confirm() quebrado. Agora ele prova o contrário: que o caminho manual NÃO
// existe mais, e que ele não pode mais mentir "Pronto! ... enviou os dados"
// com a nuvem desligada.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

// Remove comentários para os testes de "código morto": a palavra pode (e deve)
// aparecer num comentário explicando a remoção — o que não pode é existir USO.
function semComentarios(src){
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(l => !/^\s*\/\//.test(l))
    .join('\n');
}

const v5191 = fs.readFileSync('ajustes_v5191_patch.js', 'utf8');
const iface = fs.readFileSync('interface_patch.js', 'utf8');
const perf  = fs.readFileSync('performance_patch.js', 'utf8');
const perfCodigo = semComentarios(perf);

console.log('== AJUSTES_V5191: sem sync manual ==');

// 1) O arquivo continua carregando e não quebra (roda sem window real)
new Function('window', v5191)({ DIGICOPY_LOGO: null });

// 2) Nenhum dos dois arquivos cria as ações manuais
ok('v5191 não cria mais "Enviar para nuvem"', !/window\.enviarDadosLocaisParaNuvem\s*=/.test(v5191));
ok('v5191 não cria mais "Carregar da nuvem"', !/window\.carregarDadosDaNuvem\s*=/.test(v5191));
ok('interface não cria mais as ações manuais', !/window\.enviarDadosLocaisParaNuvem\s*=/.test(iface) && !/window\.carregarDadosDaNuvem\s*=/.test(iface));

// 3) O embrulho que mostrava sucesso falso foi removido
ok('uiWrapSync (aviso verde de sucesso falso) removido', !/uiWrapSync/.test(iface));

// 4) O v5191 continua fazendo o que é vivo (logo padrão)
ok('v5191 preserva a garantia da logo padrão', /window\.DIGICOPY_LOGO\s*=\s*_logoPadrao/.test(v5191));

console.log('== CÓDIGO MORTO (Supabase) REMOVIDO ==');
// Olha só o CÓDIGO (sem comentários): a palavra "Supabase" pode aparecer num
// comentário explicando a remoção; o que não pode existir é USO.
ok('performance_patch sem uso de __supabaseSyncInternals', !/__supabaseSyncInternals/.test(perfCodigo));
ok('performance_patch sem chamada supabaseRequest', !/supabaseRequest/.test(perfCodigo));
ok('performance_patch sem a rota app_state da nuvem antiga', !/app_state/.test(perfCodigo));
ok('performance_patch sem cache de partes morto', !/partCache/.test(perfCodigo));
ok('performance_patch preserva os helpers puros (testados)', /window\.__perfPure\s*=/.test(perf) && /function perfHashStr/.test(perf));
ok('performance_patch preserva o saveDB write-behind', /window\.__saveDBSched/.test(perf));

console.log('\nRESULTADO: sync manual removido e código morto limpo!');
