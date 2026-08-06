const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('correcoes_uso_diario_patch.js','utf8');
const db={config:{}, modulosDinamicos:{}};
const ctx={window:{},db,localStorage:{setItem(){},getItem(){return null;}}};
new Function('window','db','localStorage',code)(ctx.window,ctx.db,ctx.localStorage);
const C=ctx.window.CORRECOES_USO_DIARIO_PURE;
console.log('== CORRECOES_USO_DIARIO_PURE ==');
ok('tabela VENDAS é venda real', C.tabelaVendaReal('VENDAS'));
ok('ITENS_VENDA não entra como notinha', !C.tabelaVendaReal('ITENS_VENDA'));
ok('BAIRROS não entra como notinha', !C.tabelaVendaReal('BAIRROS'));
ok('ORCAMENTO não entra como notinha', !C.tabelaVendaReal('ORCAMENTO'));
ok('pagamento por código Pix', C.pagamentoRaw({COD_RECEBIMENTO:9})==='Pix');
ok('data pega DATA_VENDA', C.dataVendaRaw({DATA_VENDA:'2026-08-01'})==='2026-08-01');
ok('código pega último grupo numérico', C.cod('VD-2026-00123')==='123');
ok('registro migrado não conta no dashboard novo', !C.ehNovoOperacional({origemMigracao:true}));
ok('registro manual conta no dashboard novo', C.ehNovoOperacional({criadoPor:'user'}));
console.log('\nRESULTADO: Testes de correções de uso diário passaram!');
