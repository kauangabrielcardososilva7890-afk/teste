const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('ajustes_relatorio_pai_patch.js','utf8');
const fakeDoc={addEventListener(){}, getElementById(){return null;}};
const db={clientes:[],produtos:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[]};
const ctx={window:{},document:fakeDoc,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const A=ctx.window.AJUSTES_RELATORIO_PAI_PURE;
console.log('== AJUSTES_RELATORIO_PAI_PURE ==');
ok('preto A4 ativo por padrão', A.medidorDefault('pretoA4').ativo===true && A.medidorDefault('pretoA4').modalidade==='individual');
ok('demais medidores inativos por padrão', A.medidorDefault('scanner').ativo===false && A.medidorDefault('colorA4').modalidade==='inativo');
ok('por impressão cobra todas páginas', (()=>{ const r=A.consumoMed({modalidade:'impressao',valorPagina:0.1,acrescimo:2},100,150); return r.usado===50 && r.exced===50 && r.total===7; })());
ok('individual cobra excedente acima da franquia', (()=>{ const r=A.consumoMed({modalidade:'individual',franquia:30,valorExcedente:0.2,valorLocacao:10,valorFranquia:5,acrescimo:1},100,150); return r.usado===50 && r.exced===20 && r.total===20; })());
ok('mês fixo cobra só valor locação', (()=>{ const r=A.consumoMed({modalidade:'mes_fixo',valorLocacao:80},100,999); return r.usado===899 && r.exced===0 && r.total===80; })());
ok('código último grupo', A.cod('CT-2026-00123')==='123');
console.log('\nRESULTADO: Testes de ajustes do relatório passaram!');
