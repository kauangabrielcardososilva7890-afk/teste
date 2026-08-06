const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('leitura_detalhada_departamentos_patch.js','utf8');
const fakeDoc={getElementById(){return null;}};
const db={clientes:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[]};
const ctx={window:{},document:fakeDoc,db,confirm:()=>true};
new Function('window','document','db','confirm',code)(ctx.window,ctx.document,ctx.db,ctx.confirm);
const P=ctx.window.LEITURA_DETALHADA_DEPARTAMENTOS_PURE;
console.log('== LEITURA_DETALHADA_DEPARTAMENTOS_PURE ==');
const grupos=P.agruparPorDepartamento([{departamento:'A',utilizado:10,excedente:2,valorTotal:5},{departamento:'A',utilizado:5,excedente:0,valorTotal:1},{departamento:'B',utilizado:7,excedente:1,valorTotal:3}]);
ok('agrupa por departamento', grupos.length===2 && grupos[0].utilizado===15 && grupos[0].total===6);
const parque={id:'p1',medidoresConfig:{pretoA4:{ativo:true,ocultar:false,modalidade:'individual'},colorA4:{ativo:true,ocultar:false,modalidade:'impressao'},scanner:{ativo:false,ocultar:true,modalidade:'inativo'}}};
ok('medidor lançado sai dos pendentes', P.medPendentes(parque,{itens:[{parqueId:'p1',medidor:'pretoA4'}]}).length===1 && P.medPendentes(parque,{itens:[{parqueId:'p1',medidor:'pretoA4'}]})[0].key==='colorA4');
ok('todos lançados sem pendência', P.medPendentes(parque,{itens:[{parqueId:'p1',medidor:'pretoA4'},{parqueId:'p1',medidor:'colorA4'}]}).length===0);
ok('cálculo individual', (()=>{ const r=P.calc({modalidade:'individual',franquia:100,valorExcedente:.1,valorLocacao:50,valorFranquia:20,acrescimo:5},1000,1150); return r.valorTotal===80; })());
console.log('\nRESULTADO: Testes de leitura detalhada por departamento passaram!');
