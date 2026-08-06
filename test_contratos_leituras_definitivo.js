const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('contratos_leituras_definitivo_patch.js','utf8');
const fakeDoc={addEventListener(){},getElementById(){return null;}};
const db={clientes:[],produtos:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[]};
const ctx={window:{},document:fakeDoc,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.CONTRATOS_LEITURAS_DEFINITIVO_PURE;
console.log('== CONTRATOS_LEITURAS_DEFINITIVO_PURE ==');
ok('preto A4 ativo por padrão no cadastro da impressora', P.medidorPadrao('pretoA4').ativo===true && P.medidorPadrao('pretoA4').modalidade==='individual');
ok('demais medidores inativos por padrão', P.medidorPadrao('colorA4').ativo===false && P.medidorPadrao('scanner').modalidade==='inativo');
ok('individual calcula excedente e soma valores', (()=>{ const r=P.calcMed({modalidade:'individual',franquia:100,valorExcedente:0.1,valorLocacao:50,valorFranquia:20,acrescimo:5},1000,1150); return r.usado===150 && r.excedente===50 && r.valorTotal===80; })());
ok('por impressão calcula total por página', (()=>{ const r=P.calcMed({modalidade:'impressao',valorPagina:0.2,acrescimo:3},10,40); return r.usado===30 && r.excedente===30 && r.valorTotal===9; })());
ok('mês fixo só valor locação', (()=>{ const r=P.calcMed({modalidade:'mes_fixo',valorLocacao:200},0,999); return r.usado===999 && r.excedente===0 && r.valorTotal===200; })());
console.log('\nRESULTADO: Testes de contratos/leituras definitivos passaram!');
