const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('buscador_escola_patch.js','utf8');
const db={config:{},escolaOrcamentos:[],escolaItens:[],escolaExcluidos:[],modulosDinamicos:{
  ORCAMENTOS_ESCOLA:{dados:[{ID:9,NUMERO_ORCAMENTO:'900',NOME_ESCOLA:'Escola Antiga',MUNICIPIO:'Jaíba',DATA_FIM:'2026-09-01',VALOR_TOTAL:1000}]},
  ITENS_ORCAMENTO_ESCOLA:{dados:[{ID:91,ID_BUDGET:9,TIPO:'Material de informática',DESCRICAO:'Toner HP',QUANTIDADE:2,VALOR_UNITARIO:120}]}
}};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const B=ctx.window.BUSCADOR_ESCOLA_PURE;
console.log('== BUSCADOR_ESCOLA_PURE ==');
ok('exporta funções puras', !!B && typeof B.pesquisarOrcamentos==='function');
ok('normaliza texto sem acento', B.normalizarTexto('  Tôner Ç  ')==='toner c');
const jana=B.calcularDistancia({municipio:'Janaúba'});
ok('calcula distância por cidade conhecida', jana>=0 && jana<2);
ok('prioridade norte até 250km', B.prioridadeRegiao(100)===1 && B.prioridadeRegiao(300)===2);
const item=B.normalizarItem({id_budget:123,tipo:'Equipamento',descricao:'Impressora'},'fallback');
ok('normaliza item do modelo antigo com id_budget e tipo', item.orcamento_id==='123' && item.tipo==='Equipamento');
const imp=B.importarAntigos(db);
ok('importa dados antigos heurísticos', imp.orcamentos>=1 && imp.itens>=1);
const res=B.pesquisarOrcamentos(db,'toner');
ok('busca item por descrição', res.length>=1 && /toner/i.test(res[0].item_descricao));
ok('busca item por tipo', B.pesquisarOrcamentos(db,'informatica').length>=1);
B.descartarOrcamento(db,'9','teste',false);
ok('descartar remove da busca e registra log interno', B.pesquisarOrcamentos(db,'toner').length===0 && db.escolaLogs.length>=1);
B.restaurarOrcamento(db,'9');
ok('restaurar volta para busca', B.pesquisarOrcamentos(db,'toner').length>=1);
const html=B.excelHtml(res);
ok('gera excel html compatível', html.includes('Tipo') && html.includes('Item Solicitado'));
console.log('\nRESULTADO: Testes do Buscador Escola passaram!');
