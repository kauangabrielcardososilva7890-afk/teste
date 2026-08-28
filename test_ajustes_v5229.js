const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v5229_nfe_atalho_historico_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.NFE_ATALHO_HISTORICO;
console.log('== ATALHO NF-E NO HISTÓRICO ==');
ok('exporta atalho',!!P&&typeof P.nfeAtalhoDoHistorico==='function');
ok('pede seleção da notinha',/Selecione uma notinha/.test(code));
ok('pede seleção da leitura',/Selecione uma leitura/.test(code));
ok('abre só pré-visualização',/Pré-visualizar NF-e/.test(code)&&/nfePreVisualizar/.test(code));
ok('não emite direto da lista',!/Assinar com A1/.test(code));
ok('não grava banco',!/saveDB\(/.test(code));
ok('não envia SEFAZ',!/NFeAutorizacao4|hnfe\.fazenda/.test(code));
ok('entra no histórico da notinha e da leitura',/historicoVenda/.test(code)&&/renderLeituras/.test(code));
ok('patch no bundle',manifest.includes('ajustes_v5229_nfe_atalho_historico_patch.js'));
console.log('\nRESULTADO: atalho NF-e no histórico passou!');
