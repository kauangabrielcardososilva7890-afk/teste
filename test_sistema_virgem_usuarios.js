const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('sistema_virgem_usuarios_patch.js','utf8');
const db={
  config:{empresa:{nome:'DIGICOPY'},pix:{chave:'x'},alinhamentoBanco:{x:1}},
  empresas:[{id:'emp',nome:'DIGICOPY',fantasia:'DIGICOPY'}],
  usuarios:[{id:'old',empresaId:'emp',login:'admin',senha:'admin123'}],
  clientes:[{id:'cli1',empresaId:'emp',nome:'Cliente Real'}],
  produtos:[{id:'p1'}],vendas:[{id:'v1'}],contratos:[{id:'c1'}],leituras:[{id:'l1'}],os:[{id:'o1'}],contasReceber:[{id:'cr1'}],modulosDinamicos:{VENDAS:{dados:[{a:1}]}},escolaOrcamentos:[{id:'e1'}],logs:[]
};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.SISTEMA_VIRGEM_PURE;
console.log('== SISTEMA_VIRGEM_PURE ==');
ok('exporta funções puras', !!P && typeof P.limparDadosAntigos==='function');
const r=P.limparDadosAntigos(db,{preservarClientes:true});
ok('preserva clientes', r.clientesPreservados===1 && db.clientes.length===1 && db.clientes[0].nome==='Cliente Real');
ok('limpa dados antigos operacionais', db.produtos.length===0 && db.vendas.length===0 && db.contratos.length===0 && db.leituras.length===0 && db.os.length===0 && Object.keys(db.modulosDinamicos).length===0);
ok('remove módulos buscador e financeiros antigos', db.escolaOrcamentos.length===0 && db.contasReceber.length===0);
ok('cria quatro usuários oficiais', db.usuarios.length===4 && db.usuarios.some(u=>u.login==='Kauan'&&u.senha==='6132'&&u.adminTotal));
ok('denivaldo exige troca de senha', db.usuarios.some(u=>u.login==='Denivaldo'&&u.senha==='1234'&&u.deveTrocarSenha));
ok('não mantém admin demo', !db.usuarios.some(u=>u.login==='admin'||u.senha==='admin123'));
ok('marca sistema virgem', !!db.config.sistemaVirgem && db.config.sistemaVirgem.versao==='4.9.57');
console.log('\nRESULTADO: Testes de sistema virgem/usuários passaram!');
