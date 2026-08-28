// ═══════════════════════════════════════════════════════════════════════════
// v5.21.5 — busca inteligente de CNPJ na loja e no cliente
// Consulta BrasilAPI e, se falhar, ReceitaWS. Preenche razão, fantasia,
// endereço, telefone e e-mail. Não grava chave nem senha.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function soDigitos(v){return String(v==null?'':v).replace(/\D/g,'');}
function txt(v){return String(v==null?'':v).trim();}
function formatarCnpj(v){
  const d=soDigitos(v).slice(0,14);
  if(d.length<=2)return d;
  if(d.length<=5)return d.slice(0,2)+'.'+d.slice(2);
  if(d.length<=8)return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5);
  if(d.length<=12)return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8);
  return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8,12)+'-'+d.slice(12);
}
function formatarCep(v){
  const d=soDigitos(v).slice(0,8);
  if(d.length<=5)return d;
  return d.slice(0,5)+'-'+d.slice(5);
}
function formatarFone(v){
  const d=soDigitos(v);
  if(d.length===10)return '('+d.slice(0,2)+') '+d.slice(2,6)+'-'+d.slice(6);
  if(d.length===11)return '('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7);
  return txt(v);
}
function validarCnpj(v){
  const c=soDigitos(v);
  if(c.length!==14||/^(\d)\1+$/.test(c))return false;
  const calc=function(base,pesos){
    let s=0;for(let i=0;i<pesos.length;i++)s+=Number(base[i])*pesos[i];
    const r=s%11;return r<2?0:11-r;
  };
  const d1=calc(c,[5,4,3,2,9,8,7,6,5,4,3,2]);
  const d2=calc(c,[6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return d1===Number(c[12])&&d2===Number(c[13]);
}
function mapBrasilApi(d){
  if(!d||typeof d!=='object')return null;
  const tel=txt(d.ddd_telefone_1||'');
  return {
    cnpj:formatarCnpj(d.cnpj||''),
    razaoSocial:txt(d.razao_social||d.nome||''),
    fantasia:txt(d.nome_fantasia||''),
    rua:txt(d.logradouro||d.descricao_tipo_de_logradouro||''),
    numero:txt(d.numero||''),
    complemento:txt(d.complemento||''),
    bairro:txt(d.bairro||''),
    cidade:txt(d.municipio||''),
    uf:txt(d.uf||'').toUpperCase(),
    cep:formatarCep(d.cep||''),
    email:txt(d.email||''),
    telefone:tel?formatarFone(tel):'',
    ie:txt(d.inscricao_estadual||''),
    situacao:txt(d.descricao_situacao_cadastral||d.situacao_cadastral||'')
  };
}
function mapReceitaWs(d){
  if(!d||typeof d!=='object'||d.status==='ERROR')return null;
  return {
    cnpj:formatarCnpj(d.cnpj||''),
    razaoSocial:txt(d.nome||''),
    fantasia:txt(d.fantasia||''),
    rua:txt(d.logradouro||''),
    numero:txt(d.numero||''),
    complemento:txt(d.complemento||''),
    bairro:txt(d.bairro||''),
    cidade:txt(d.municipio||''),
    uf:txt(d.uf||'').toUpperCase(),
    cep:formatarCep(d.cep||''),
    email:txt(d.email||''),
    telefone:formatarFone(d.telefone||''),
    ie:'',
    situacao:txt(d.situacao||'')
  };
}
async function consultarJson(url){
  const resp=await fetch(url,{method:'GET',headers:{'Accept':'application/json'}});
  if(!resp.ok)throw new Error('HTTP '+resp.status);
  return resp.json();
}
async function consultarCnpj(cnpjRaw){
  const cnpj=soDigitos(cnpjRaw);
  if(cnpj.length!==14)throw new Error('CNPJ precisa ter 14 números.');
  if(!validarCnpj(cnpj))throw new Error('CNPJ inválido. Confira os dígitos.');
  try{
    const data=await consultarJson('https://brasilapi.com.br/api/cnpj/v1/'+cnpj);
    const mapped=mapBrasilApi(data);
    if(mapped&&mapped.razaoSocial)return mapped;
  }catch(e){}
  const data=await consultarJson('https://www.receitaws.com.br/v1/cnpj/'+cnpj);
  const mapped=mapReceitaWs(data);
  if(!mapped||!mapped.razaoSocial)throw new Error('CNPJ não encontrado.');
  return mapped;
}
function setVal(id,value,soSeVazio){
  const el=document.getElementById(id);if(!el)return;
  if(soSeVazio&&txt(el.value))return;
  el.value=value||'';
}

window.CNPJ_INTELIGENTE_PURE={soDigitos,formatarCnpj,formatarCep,validarCnpj,mapBrasilApi,mapReceitaWs};

if(typeof document==='undefined')return;

window.consultarCnpjInteligente=consultarCnpj;

window.buscarCnpjLoja=async function(){
  const input=document.getElementById('loja-cnpj');
  const btn=document.getElementById('btn-buscar-cnpj-loja');
  const cnpj=soDigitos(input&&input.value);
  if(cnpj.length!==14){
    if(typeof toast==='function')toast('Digite os 14 números do CNPJ da loja.','error');
    return;
  }
  if(input)input.value=formatarCnpj(cnpj);
  if(btn){btn.disabled=true;btn.textContent='Buscando...';}
  try{
    const d=await consultarCnpj(cnpj);
    setVal('loja-cnpj',d.cnpj);
    setVal('loja-razao',d.razaoSocial);
    setVal('loja-fantasia',d.fantasia||d.razaoSocial,true);
    setVal('loja-rua',d.rua);
    setVal('loja-numero',d.numero);
    setVal('loja-bairro',d.bairro);
    setVal('loja-cidade',d.cidade);
    setVal('loja-uf',d.uf);
    setVal('loja-cep',d.cep);
    setVal('loja-email',d.email,true);
    setVal('loja-telefone',d.telefone,true);
    if(typeof toast==='function')toast('CNPJ encontrado: '+(d.fantasia||d.razaoSocial)+'. Confira e clique em Salvar.','success');
  }catch(e){
    if(typeof toast==='function')toast(e.message||'Não achei esse CNPJ.','error');
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ph ph-magnifying-glass"></i> Buscar CNPJ';}
  }
};

const oldBuscar=window.buscarCNPJAutomatico;
window.buscarCNPJAutomatico=async function(cnpjRaw){
  const cnpj=soDigitos(cnpjRaw);
  const btn=document.getElementById('btn-buscar-cnpj');
  if(cnpj.length!==14){
    if(typeof toast==='function')toast('CNPJ deve ter 14 dígitos (CPF preenche na mão).','error');
    return;
  }
  if(btn){btn.innerHTML='<i class="ph ph-spinner animate-spin"></i> Buscando...';btn.disabled=true;}
  try{
    const d=await consultarCnpj(cnpj);
    setVal('f-cli-doc',d.cnpj);
    setVal('f-cli-nome',d.razaoSocial||d.fantasia);
    setVal('f-cli-fantasia',d.fantasia,true);
    setVal('f-cli-rua',d.rua);
    setVal('f-cli-num',d.numero);
    setVal('f-cli-compl',d.complemento,true);
    setVal('f-cli-bairro',d.bairro);
    setVal('f-cli-cidade',d.cidade);
    setVal('f-cli-estado',d.uf);
    setVal('f-cli-cep',d.cep);
    setVal('f-cli-email',d.email,true);
    setVal('f-cli-tel',d.telefone,true);
    setVal('f-cli-rgie',d.ie,true);
    const tipo=document.getElementById('f-cli-tipo');if(tipo)tipo.value='PJ';
    if(typeof toast==='function')toast('CNPJ encontrado: '+(d.razaoSocial||d.fantasia)+'. Confira telefone e número.','success');
  }catch(e){
    if(typeof oldBuscar==='function'&&!oldBuscar.__v5215){
      try{return await oldBuscar(cnpjRaw);}catch(_e){}
    }
    if(typeof toast==='function')toast(e.message||'Não achei esse CNPJ.','error');
  }finally{
    if(btn){btn.innerHTML='<i class="ph ph-magnifying-glass"></i> Buscar';btn.disabled=false;}
  }
};
window.buscarCNPJAutomatico.__v5215=true;

function instalarBuscaLoja(){
  const input=document.getElementById('loja-cnpj');
  if(!input||document.getElementById('btn-buscar-cnpj-loja'))return;
  const wrap=document.createElement('div');
  wrap.className='flex gap-2 mt-1';
  input.classList.remove('mt-1');
  input.className=(input.className||'')+' flex-1 font-mono';
  input.placeholder='00.000.000/0001-00';
  input.parentNode.insertBefore(wrap,input);
  wrap.appendChild(input);
  const btn=document.createElement('button');
  btn.type='button';
  btn.id='btn-buscar-cnpj-loja';
  btn.className='h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px] shrink-0';
  btn.innerHTML='<i class="ph ph-magnifying-glass"></i> Buscar CNPJ';
  btn.onclick=function(ev){if(ev)ev.preventDefault();window.buscarCnpjLoja();};
  wrap.appendChild(btn);
  input.addEventListener('blur',function(){
    const d=soDigitos(input.value);
    if(d.length===14)input.value=formatarCnpj(d);
  });
  input.addEventListener('keydown',function(ev){
    if(ev.key==='Enter'){ev.preventDefault();window.buscarCnpjLoja();}
  });
}

const oldRenderConfig=window.renderConfig;
if(typeof oldRenderConfig==='function'&&!oldRenderConfig.__v5215){
  window.renderConfig=function(){
    const r=oldRenderConfig.apply(this,arguments);
    setTimeout(instalarBuscaLoja,180);
    setTimeout(instalarBuscaLoja,500);
    return r;
  };
  window.renderConfig.__v5215=true;
}
setTimeout(instalarBuscaLoja,800);

console.log('[DIGICOPY] v5.21.5 busca inteligente de CNPJ');
})();
