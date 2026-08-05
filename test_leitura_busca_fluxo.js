const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('leitura_busca_fluxo_patch.js','utf8');
const fakeDoc={getElementById(){return null;}};
const db={clientes:[],equipamentos:[{id:'e1',modelo:'Brother 5652',serie:'SER123',patrimonio:'PAT9'},{id:'e2',modelo:'HP Color',serie:'ABC',patrimonio:'PAT2'}],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[]};
const ctx={window:{},document:fakeDoc,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.LEITURA_BUSCA_FLUXO_PURE;
console.log('== LEITURA_BUSCA_FLUXO_PURE ==');
ok('normaliza global para individual', P.normalizarModalidade('global')==='individual');
ok('preto A4 ativo padrão', P.medPadrao('pretoA4').ativo===true);
const parque={id:'p1',equipamentoId:'e1',setor:'Financeiro',localInstalacao:'Sala 2',medidoresConfig:{pretoA4:{ativo:true,ocultar:false,modalidade:'individual'},colorA4:{ativo:true,ocultar:false,modalidade:'impressao'}}};
ok('medidores pendentes remove o já lançado', P.medPendentes(parque,{itens:[{parqueId:'p1',medidor:'pretoA4'}]}).length===1 && P.medPendentes(parque,{itens:[{parqueId:'p1',medidor:'pretoA4'}]})[0].key==='colorA4');
const achou=P.filtrarMaquinasLancamento(db,{itens:[]},[parque],db.equipamentos,'serial','SER');
ok('busca por serial acha impressora', achou.length===1 && achou[0].id==='p1');
ok('busca por departamento acha impressora', P.filtrarMaquinasLancamento(db,{itens:[]},[parque],db.equipamentos,'departamento','finan').length===1);
ok('busca por localização acha impressora', P.filtrarMaquinasLancamento(db,{itens:[]},[parque],db.equipamentos,'localizacao','sala').length===1);
console.log('\nRESULTADO: Testes de busca de impressora na leitura passaram!');
