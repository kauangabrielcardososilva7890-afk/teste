// ═══════════════════════════════════════════════════════════════════════════
// v5.21.4 — clientes visíveis na tela
// A nuvem/contagem usa db.clientes.length. A tela filtrava empresaId e
// sumia com cadastro antigo sem empresa ou com empresa antiga.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const ENTIDADES=['clientes','produtos','equipamentos','contratos','parque','leituras','os','vendas','contasReceber','contasPagar','notificacoes'];

function empresaUnica(){
  if(typeof db==='undefined'||!db)return 'emp_digicopy';
  const emp=(db.empresas||[]).find(e=>e&&e.id==='emp_digicopy')
    ||(db.empresas||[]).find(e=>/digicopy/i.test(String((e&&e.fantasia)||(e&&e.nome)||'')))
    ||(db.empresas||[])[0];
  return (emp&&emp.id)||'emp_digicopy';
}

function normalizarEmpresaClientes(){
  if(typeof db==='undefined'||!db)return 0;
  const empId=empresaUnica();
  let mudou=0;
  ENTIDADES.forEach(k=>{
    if(!Array.isArray(db[k]))return;
    db[k].forEach(r=>{
      if(!r||typeof r!=='object')return;
      if(!r.empresaId||r.empresaId!==empId){r.empresaId=empId;mudou++;}
    });
  });
  try{
    const sess=typeof getSession==='function'?getSession():null;
    if(sess&&sess.empresaId!==empId){
      sess.empresaId=empId;
      if(typeof setSession==='function')setSession(sess);
    }
  }catch(e){}
  if(mudou&&typeof saveDB==='function')saveDB();
  return mudou;
}

function pertenceEmpresa(c,empId){
  if(!c)return false;
  return !c.empresaId||c.empresaId===empId;
}

window.CLIENTES_VISIVEIS_PURE={empresaUnica,normalizarEmpresaClientes,pertenceEmpresa};

if(typeof document==='undefined')return;

const oldSeed=window.seedData;
if(typeof oldSeed==='function'&&!oldSeed.__v5214){
  window.seedData=function(){
    const r=oldSeed.apply(this,arguments);
    normalizarEmpresaClientes();
    return r;
  };
  window.seedData.__v5214=true;
}

if(typeof window.renderClientes==='function'&&!window.renderClientes.__v5214){
  const oldRender=window.renderClientes;
  window.renderClientes=function(){
    normalizarEmpresaClientes();
    return oldRender.apply(this,arguments);
  };
  window.renderClientes.__v5214=true;
}

function aposBasePronta(){
  try{
    normalizarEmpresaClientes();
    if(typeof seedData==='function')seedData(false);
    if(typeof getSession==='function'&&getSession()&&typeof showApp==='function'){
      const view=document.querySelector('.view:not(.hidden)');
      if(view&&view.id==='view-clientes'&&typeof renderClientes==='function')renderClientes();
    }
  }catch(e){}
}

const ready=window.DIGICOPY_DB_READY;
if(ready&&typeof ready.then==='function')ready.then(aposBasePronta).catch(function(){setTimeout(aposBasePronta,400);});
else setTimeout(aposBasePronta,400);

console.log('[DIGICOPY] v5.21.4 clientes visíveis');
})();
