const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('ajustes_pos_final_patch.js','utf8');
const db={config:{loja:{fantasia:'DIGICOPY',razaoSocial:'DIGICOPY LTDA',cnpj:'00',endereco:'Rua A',whatsapp:'+55 38 99109-8698'}},empresas:[{id:'emp'}],produtos:[]};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.AJUSTES_POS_FINAL_PURE;
console.log('== AJUSTES_POS_FINAL_PURE ==');
ok('exporta funções puras', !!P && typeof P.isProdutoImpressoraLocacao==='function');
ok('detecta impressora de locação por categoria', P.isProdutoImpressoraLocacao({categoria:'Impressora',nome:'Brother'})===true);
ok('não confunde produto com palavra impressora no nome', P.isProdutoImpressoraLocacao({categoria:'Produto',nome:'Cabo para impressora'})===false);
ok('detecta impressora por patrimônio/serial', P.isProdutoImpressoraLocacao({categoria:'Produto',patrimonio:'123'})===true);
const html=P.patchHtmlImpressao('<html><body><p class="audit">Emitido por X • CNPJ 00 • Cód. cliente 1</p></body></html>');
ok('adiciona rodapé da loja e remove repetição de CNPJ no audit', html.includes('rodape-loja-final') && html.includes('DIGICOPY') && !html.includes('Cód. cliente 1'));
ok('assistente foi removido do patch final', !('respostaAssistente' in P));
console.log('\nRESULTADO: Testes de ajustes pós-final passaram!');
