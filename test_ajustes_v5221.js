const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v5221_nfe_emissao_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.NFE_EMISSAO_PURE;
console.log('== NF-E EMISSAO v5.22.1 ==');
ok('exporta funções puras',!!P&&typeof P.montarDocumento==='function');
ok('não grava senha do certificado',!/pfxPassword|senhaPfx|senhaA1|certPassword/.test(code));
ok('não envia para SEFAZ nesta versão',!/NFeAutorizacao4|hnfe\.fazenda/.test(code));
ok('CRT 1 Simples travado',/crt:'1'/.test(code)&&/simei:false/.test(code));
ok('Jaíba tem IBGE',P.codigoIbge('Jaíba','MG')==='3135050');
ok('Janaúba tem IBGE',P.codigoIbge('Janaúba','MG')==='3135100');

const loja={razaoSocial:'DIGICOPY CARTUCHOS LTDA',fantasia:'DIGICOPY',cnpj:'08385589000103',rua:'Rua A',numero:'10',bairro:'Centro',cidade:'Jaíba',uf:'MG',cep:'39508000',telefone:'3838210000'};
const fiscal={ie:'123456789',crt:'1',serie:'1',ambiente:'2',uf:'MG'};
const cliente={nome:'Cliente Teste',documento:'39053344705',rua:'Rua B',numero:'20',bairro:'Centro',cidade:'Jaíba',estado:'MG',cep:'39508000'};
const venda={numero:'88',itens:[{descricao:'Toner',qtd:1,preco:100,desconto:0,ncm:'84439923',tipo:'Produto'}]};
const doc=P.montarDocumento({origem:'venda',venda,cliente,loja,fiscal,produtos:[],existentes:[],certificadoLocal:true,data:'2026-08-18T12:00:00'});
ok('documento da venda fica ok',doc.ok===true);
ok('XML tem modelo 55',P.montarXml(doc).includes('<mod>55</mod>'));
ok('XML tem CRT 1',P.montarXml(doc).includes('<CRT>1</CRT>'));
ok('chave tem 44 dígitos',doc.chave.length===44);
ok('sem A1 bloqueia',P.montarDocumento({origem:'venda',venda,cliente,loja,fiscal,produtos:[],existentes:[],certificadoLocal:false}).ok===false);

const leitura={numero:'12',itens:[{valorTotal:80}],valorTotal:80};
const docL=P.montarDocumento({origem:'leitura',leitura,cliente,loja,fiscal:{...fiscal,ncmPadrao:'84439923'},produtos:[],existentes:[],certificadoLocal:true});
ok('leitura monta item',docL.itens.length===1&&docL.totais.vNF>0);
ok('sem IE da loja aponta o erro',P.validarEmitente(P.emitenteDe(loja,{})).includes('Inscrição Estadual da loja'));
ok('patch entra no bundle',manifest.includes('ajustes_v5221_nfe_emissao_patch.js'));
ok('botão de conferência existe no código',code.includes('Conferir NF-e')&&code.includes('conferirNfe'));
ok('conferência não grava no banco',!/saveDB\(/.test(code));
ok('não grava fiscal sozinho ao abrir',!/garantirFiscalSimples\(\);\s*atualizarCardNfe/.test(code));
ok('envolve tela original antes de injetar botão',/const r=orig\.apply\(this,arguments\)/.test(code));
console.log('\nRESULTADO: conferência NF-e passou!');
