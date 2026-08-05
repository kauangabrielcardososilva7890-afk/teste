const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('fluxo_contrato_leitura_corrigido_patch.js','utf8');
const fakeDoc={getElementById(){return null;}};
const db={clientes:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[]};
const ctx={window:{},document:fakeDoc,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.CONTRATOS_LEITURAS_CORRIGIDO_PURE;
console.log('== FLUXO_CONTRATO_LEITURA_CORRIGIDO_PURE ==');
ok('normaliza global para individual', P.normalizarModalidade('global')==='individual');
ok('preto A4 ativo por padrão na impressora', P.medPadrao('pretoA4').ativo===true && P.medPadrao('pretoA4').modalidade==='individual');
ok('color A4 inativo por padrão', P.medPadrao('colorA4').ativo===false && P.medPadrao('colorA4').modalidade==='inativo');
ok('cálculo individual', (()=>{ const r=P.calc({modalidade:'individual',franquia:100,valorExcedente:0.1,valorLocacao:50,valorFranquia:20,acrescimo:5},1000,1150); return r.usado===150 && r.excedente===50 && r.valorTotal===80; })());
ok('cálculo por impressão', (()=>{ const r=P.calc({modalidade:'impressao',valorPagina:0.2,acrescimo:3},10,40); return r.usado===30 && r.excedente===30 && r.valorTotal===9; })());
ok('cálculo mês fixo', (()=>{ const r=P.calc({modalidade:'mes_fixo',valorLocacao:200},0,999); return r.usado===999 && r.excedente===0 && r.valorTotal===200; })());
console.log('\nRESULTADO: Testes do fluxo contrato/leitura corrigido passaram!');
