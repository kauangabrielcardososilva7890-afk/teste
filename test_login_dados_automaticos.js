const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('login_dados_automaticos_patch.js','utf8');
const db={
  empresas:[], usuarios:[{id:'demo',empresaId:'emp1',nome:'Administrador',login:'admin',senha:'admin123',perfil:'Admin',ativo:true,criadoPor:'sistema'}], logs:[], vendas:[{criadoPor:'demo'}], os:[],
  modulosDinamicos:{FUNCIONARIOS:{dados:[{COD_FUNCIONARIO:1,NOME:'KAUAN',LOGIN:'kauan',SENHA:'1234',ADMIN:'S',OCULTAR:'N'},{COD_FUNCIONARIO:2,NOME:'Atendente Um',SENHA:'abc',VENDEDOR:'S'}]}}
};
const ctx={window:{},db,localStorage:{setItem(){},getItem(){return null;}},sessionStorage:{getItem(){return null;},setItem(){}}};
new Function('window','db','localStorage','sessionStorage',code)(ctx.window,ctx.db,ctx.localStorage,ctx.sessionStorage);
const L=ctx.window.LOGIN_DIRETO_LEGADO_PURE;
console.log('== LOGIN_DIRETO_LEGADO_PURE ==');
ok('login compatível ignora capslock', L.loginCompativel({login:'kauan',nome:'Kauan'}, 'KaUaN'));
ok('login compatível por nome', L.loginCompativel({login:'kg',nome:'Kauan Gabriel'}, 'KAUAN'));
ok('senha literal confere', L.senhaCompativel({senha:'1234'}, '1234'));
const emp=L.escolherEmpresaPadrao(db);
ok('cria empresa padrão', !!emp.id && db.empresas.length===1);
const imp=L.importarFuncionariosLegados(db, emp.id);
ok('importa funcionários como usuários', imp>=2 && db.usuarios.some(u=>u.login==='kauan'&&u.senha==='1234'&&u.perfil==='Admin'));
ok('perfil vendedor vira comercial', db.usuarios.some(u=>u.login==='atendente'&&u.perfil==='Comercial'));
db.usuarios.push({id:'demo2',empresaId:emp.id,nome:'Administrador',login:'admin',senha:'admin123',perfil:'Admin',ativo:true,criadoPor:'sistema'});
const merged=L.unirAdminDemoComOriginal(db, emp.id);
ok('une admin demo ao original migrado', merged===1 && !db.usuarios.find(u=>u.id==='demo2'));
console.log('\nRESULTADO: Testes de login direto/dados automáticos passaram!');
