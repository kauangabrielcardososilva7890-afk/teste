const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('finalizacao_sistema_patch.js','utf8');
const db={};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.FINALIZACAO_SISTEMA_PURE;
console.log('== FINALIZACAO_SISTEMA_PURE ==');
ok('exporta funções puras', !!P && typeof P.ordenarLista==='function');
const list=[{codigo:'10',nome:'B'},{codigo:'2',nome:'A'},{codigo:'0003',nome:'C'}];
ok('ordena código numericamente crescente', P.ordenarLista(list,'codigo','asc').map(x=>x.codigo).join(',')==='2,0003,10');
ok('ordena nome desc', P.ordenarLista(list,'nome','desc')[0].nome==='C');
ok('filtra clientes por tudo', P.filtrarClientesFinal([{nome:'José',codigo:'1'},{nome:'Maria',codigo:'2'}],'jose','todos').length===1);
ok('código interno só número', P.numCodigo('CLI-00045')===45);
ok('clientes não lista tudo por padrão', P.clientesDeveListar('', 'todos', 'ativos')===false);
ok('clientes lista quando pesquisar ou filtrar', P.clientesDeveListar('maria', 'todos', 'ativos')===true && P.clientesDeveListar('', 'todos', 'inadimplente')===true && P.clientesDeveListar('', 'nome', 'ativos')===true);
console.log('\nRESULTADO: Testes de finalização passaram!');
