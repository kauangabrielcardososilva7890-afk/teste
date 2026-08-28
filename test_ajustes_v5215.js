const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v5215_cnpj_inteligente_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.CNPJ_INTELIGENTE_PURE;
console.log('== CNPJ INTELIGENTE v5.21.5 ==');
ok('exporta funções puras',!!P&&typeof P.validarCnpj==='function');
ok('formata CNPJ',P.formatarCnpj('08385589000103')==='08.385.589/0001-03');
ok('rejeita CNPJ inválido',P.validarCnpj('00000000000000')===false);
ok('aceita CNPJ válido conhecido',P.validarCnpj('08385589000103')===true);
ok('mapeia BrasilAPI',P.mapBrasilApi({razao_social:'LOJA X',nome_fantasia:'X',logradouro:'Rua A',numero:'10',bairro:'Centro',municipio:'Januaba',uf:'mg',cep:'39400000',cnpj:'19131243000197'}).cidade==='Januaba');
ok('mapeia ReceitaWS',P.mapReceitaWs({nome:'LOJA Y',status:'OK',municipio:'Montes Claros',uf:'MG'}).razaoSocial==='LOJA Y');
ok('patch entra no bundle',manifest.includes('ajustes_v5215_cnpj_inteligente_patch.js'));
ok('botão da loja existe no código',code.includes('btn-buscar-cnpj-loja')&&code.includes('buscarCnpjLoja'));
console.log('\nRESULTADO: CNPJ inteligente passou!');
