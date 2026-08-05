const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('sistema_clientes_loja_patch.js','utf8');
const db={config:{},empresas:[{id:'emp',nome:'DIGICOPY'}],clientes:[{id:'cli_old',empresaId:'emp',codigo:'10',nome:'Cliente Dez',documento:'111'}]};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.SISTEMA_CLIENTES_LOJA_PURE;
console.log('== SISTEMA_CLIENTES_LOJA_PURE ==');
ok('exporta funções puras', !!P && typeof P.importarClientesDeObjetos==='function');
ok('extrai rows de formatos comuns', P.extrairRowsJson({dados:[{a:1}]}).length===1 && P.extrairRowsJson([{a:2}]).length===1);
const cli=P.mapClienteRow({COD_CLIENTE:'00025',NOME_RAZAOSOCIAL:'Cliente Teste',CPF_CNPJ:'12.345.678/0001-90',TELEFONE:'38999990000',ENDERECO:'Rua A',NUMERO:'123',BAIRRO:'Centro',CIDADE:'Jaíba',UF:'MG'},'emp',1);
ok('mapeia cliente e código vira número puro', cli.codigo==='25' && cli.nome==='Cliente Teste' && cli.estado==='MG');
const r=P.importarClientesDeObjetos(db,[{nome:'CLIENTES.json',json:[{COD_CLIENTE:'11',NOME:'Cliente Onze',CPF_CNPJ:'222'},{COD_CLIENTE:'12',NOME:'Cliente Doze',CPF_CNPJ:'333'}]},{nome:'CLIENTES_USUARIOS_RESTRICAO.json',json:[{COD_CLIENTE:'99',NOME:'Nao importar'}]}],'emp');
ok('importa clientes e ignora usuarios/restricao', r.importados===2 && r.ignorados===1 && db.clientes.length===3 && !db.clientes.some(c=>c.codigo==='99'));
ok('próximo código cliente continua do maior', P.proximoCodigoCliente(db,'emp')===13);
const loja=P.salvarLoja(db,'emp',{fantasia:'DIGICOPY',razaoSocial:'DIGICOPY LTDA',cnpj:'00',telefone:'38',whatsapp:'+55 38 99109-8698',rua:'Rua A',numero:'1',bairro:'Centro',cidade:'Jaíba',uf:'MG',cep:'39440-000',email:'x@y.com',endereco:'Rua A • 1'});
ok('salva dados completos da loja em config e empresa', loja.fantasia==='DIGICOPY' && db.config.empresa.nome==='DIGICOPY LTDA' && db.empresas[0].whatsapp.includes('99109'));
ok('hoje local tem formato data', /^\d{4}-\d{2}-\d{2}$/.test(P.hojeLocal()));
console.log('\nRESULTADO: Testes de clientes/loja/login diário passaram!');
