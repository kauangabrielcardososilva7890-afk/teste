// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.58 — Login diário, dados da loja e importação de clientes
// • Todo dia, ao abrir, exige login na primeira abertura do dia
// • Nome visual: Sistema Digicopy (sem ERP)
// • Configura dados completos da loja para notinhas/relatórios
// • Importa somente clientes por JSON, preservando/continuando código numérico
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim(); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function dig(v){ return txt(v).replace(/\D+/g,''); }
function onlyNumCode(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const s=g[g.length-1].replace(/^0+/,''); return s||'0'; }
function hojeLocal(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function pick(row,keys){
  const r=row||{}; const entries=Object.keys(r);
  for(const k of keys){ if(r[k]!==undefined&&r[k]!==null&&txt(r[k])!=='') return r[k]; }
  const upper=Object.fromEntries(entries.map(k=>[up(k),k]));
  for(const k of keys){ const real=upper[up(k)]; if(real&&txt(r[real])!=='') return r[real]; }
  return '';
}

function extrairRowsJson(json){
  if(Array.isArray(json)) return json;
  if(!json||typeof json!=='object') return [];
  if(Array.isArray(json.dados)) return json.dados;
  if(Array.isArray(json.data)) return json.data;
  if(Array.isArray(json.rows)) return json.rows;
  if(Array.isArray(json.items)) return json.items;
  const vals=Object.values(json).find(Array.isArray);
  return Array.isArray(vals)?vals:[];
}
function mapClienteRow(row,empresaId,nextCodigo){
  const codigo=onlyNumCode(pick(row,['COD_CLIENTE','CODIGO','COD','ID_CLIENTE','ID','CLI_CODIGO','CLIENTE_ID'])) || String(nextCodigo||1);
  const nome=txt(pick(row,['NOME_RAZAOSOCIAL','NOME_RAZAO_SOCIAL','RAZAO_SOCIAL','NOME','CLIENTE','CLI_NOME','NOME_CLIENTE'])) || 'Cliente sem nome';
  const fantasia=txt(pick(row,['NOME_FANTASIA','FANTASIA','APELIDO','CLI_FANTASIA']));
  const documento=txt(pick(row,['CPF_CNPJ','CNPJ_CPF','CNPJ','CPF','DOCUMENTO','DOC','CLI_CNPJ','CLI_CPF']));
  const telefone=txt(pick(row,['TELEFONE','FONE','CELULAR','WHATSAPP','WHATS','TEL','CLI_TELEFONE','CONTATO_TELEFONE']));
  const whatsapp=txt(pick(row,['WHATSAPP','WHATS','CELULAR','CELULAR1','FONE_WHATS']));
  const email=txt(pick(row,['EMAIL','E_MAIL','MAIL','CLI_EMAIL']));
  const rua=txt(pick(row,['RUA','LOGRADOURO','ENDERECO','ENDEREÇO','CLI_ENDERECO']));
  const numero=onlyNumCode(pick(row,['NUMERO','NUM','NRO','END_NUMERO','CLI_NUMERO']));
  const bairro=txt(pick(row,['BAIRRO','CLI_BAIRRO']));
  const cidade=txt(pick(row,['CIDADE','MUNICIPIO','MUNICÍPIO','CLI_CIDADE']));
  const estado=txt(pick(row,['UF','ESTADO','CLI_UF'])).toUpperCase();
  const cep=txt(pick(row,['CEP','CLI_CEP']));
  const complemento=txt(pick(row,['COMPLEMENTO','COMPL','CLI_COMPLEMENTO']));
  const contato=txt(pick(row,['CONTATO','RESPONSAVEL','RESPONSÁVEL','PESSOA_CONTATO']));
  const rgIE=txt(pick(row,['RG_IE','RGIE','RG','INSCRICAO_ESTADUAL','INSCRICAO','IE']));
  const endereco=[rua,numero,bairro].filter(Boolean).join(rua&&numero?', ':' • ');
  return {id:uidSafe('cli'),empresaId,codigo,nome,fantasia,documento,tipo:dig(documento).length>11?'PJ':'PF',telefone,whatsapp,email,rua,numero,bairro,cidade,estado,cep,complemento,contato,rgIE,endereco,status:'ativo',origemImportacao:'clientes_json',importadoEm:new Date().toISOString(),codigoAntigo:codigo};
}
function importarClientesDeObjetos(dbRef,arquivos,empresaId){
  dbRef.clientes=Array.isArray(dbRef.clientes)?dbRef.clientes:[];
  let importados=0, atualizados=0, ignorados=0;
  const existentes=dbRef.clientes.filter(c=>!empresaId||c.empresaId===empresaId);
  let maxCod=existentes.reduce((m,c)=>Math.max(m,parseInt(c.codigo,10)||0),0);
  (arquivos||[]).forEach(arq=>{
    const nome=up(arq.nome||'');
    if(/USUARIOS|USUÁRIOS|RESTRICAO|RESTRIÇÃO/.test(nome)){ ignorados++; return; }
    const rows=extrairRowsJson(arq.json);
    rows.forEach(row=>{
      if(!row||typeof row!=='object'){ ignorados++; return; }
      const c=mapClienteRow(row,empresaId, maxCod+1);
      if(!c.nome||fold(c.nome)==='cliente sem nome'){ ignorados++; return; }
      maxCod=Math.max(maxCod,parseInt(c.codigo,10)||0);
      const doc=dig(c.documento);
      let old=dbRef.clientes.find(x=>x.empresaId===empresaId && ((doc&&dig(x.documento)===doc) || (c.codigo&&String(x.codigo)===String(c.codigo))));
      if(old){ Object.assign(old,{...c,id:old.id,criadoEm:old.criadoEm||c.importadoEm,atualizadoEm:new Date().toISOString()}); atualizados++; }
      else { c.id=uidSafe('cli'); c.criadoEm=new Date().toISOString(); dbRef.clientes.push(c); importados++; }
    });
  });
  dbRef.config=dbRef.config||{}; dbRef.config.clientesImportacao={importados,atualizados,ignorados,ultimoCodigo:maxCod,importadoEm:new Date().toISOString()};
  return {importados,atualizados,ignorados,ultimoCodigo:maxCod,total:dbRef.clientes.filter(c=>c.empresaId===empresaId).length};
}
function proximoCodigoCliente(dbRef,empresaId){ return (dbRef.clientes||[]).filter(c=>c.empresaId===empresaId).reduce((m,c)=>Math.max(m,parseInt(c.codigo,10)||0),0)+1; }
function salvarLoja(dbRef,empresaId,dados){
  dbRef.config=dbRef.config||{};
  dbRef.config.loja={...(dbRef.config.loja||{}),...dados,atualizadoEm:new Date().toISOString()};
  dbRef.config.empresa={...(dbRef.config.empresa||{}),...dados,nome:dados.razaoSocial||dados.nome||dados.fantasia,fone:dados.telefone,email:dados.email};
  const emp=(dbRef.empresas||[]).find(e=>e.id===empresaId)||((dbRef.empresas||[])[0]);
  if(emp){ Object.assign(emp,{fantasia:dados.fantasia||emp.fantasia,nome:dados.razaoSocial||dados.nome||emp.nome,cnpj:dados.cnpj||emp.cnpj,telefone:dados.telefone||emp.telefone,whatsapp:dados.whatsapp||emp.whatsapp,email:dados.email||emp.email,endereco:dados.endereco||emp.endereco,logradouro:dados.rua||emp.logradouro,numero:dados.numero||emp.numero,bairro:dados.bairro||emp.bairro,cidade:dados.cidade||emp.cidade,municipio:dados.cidade||emp.municipio,uf:dados.uf||emp.uf,cep:dados.cep||emp.cep}); }
  return dbRef.config.loja;
}
function lojaAtual(){ const s=sess(); const emp=(db.empresas||[]).find(e=>s&&e.id===s.empresaId)||((db.empresas||[])[0])||{}; const l=(db.config||{}).loja||{}; return {...emp,...l}; }
function atualizarNomeSistema(){
  try{ document.title='Sistema Digicopy'; }catch(e){}
  const t=document.getElementById('app-title-version'); if(t) t.textContent='Sistema Digicopy';
  document.querySelectorAll('title,span,p,h1,h2,h3,button,div').forEach(el=>{
    if(el.childNodes.length===1 && el.childNodes[0].nodeType===3){
      const s=el.textContent;
      if(/DIGICOPY ERP|ERP/i.test(s)) el.textContent=s.replace(/DIGICOPY ERP/gi,'Sistema Digicopy').replace(/\bERP\b/g,'Sistema');
    }
  });
}
function exigirLoginDiario(){
  const s=sess(); if(!s) return false;
  const hoje=hojeLocal();
  if(s.loginDia===hoje) return false;
  try{ if(typeof clearSession==='function') clearSession(); else localStorage.removeItem('digicopy_session_v42_demo_apresentacao'); }catch(e){}
  toastMsg('Novo dia: faça login novamente para continuar.','info');
  if(typeof showLogin==='function') setTimeout(()=>showLogin(),50);
  return true;
}

window.SISTEMA_CLIENTES_LOJA_PURE={extrairRowsJson,mapClienteRow,importarClientesDeObjetos,proximoCodigoCliente,salvarLoja,hojeLocal};

if(typeof document==='undefined') return;

const oldLogin=window.doLoginUser;
window.doLoginUser=function(){
  const ret=oldLogin?oldLogin.apply(this,arguments):undefined;
  setTimeout(()=>{ const s=sess(); if(s){ s.loginDia=hojeLocal(); if(typeof setSession==='function') setSession(s); } },120);
  return ret;
};
setTimeout(()=>{ exigirLoginDiario(); atualizarNomeSistema(); },300);
setInterval(()=>exigirLoginDiario(), 60000);

function renderDadosLojaCard(){
  const grid=document.querySelector('#view-config .grid')||document.getElementById('view-config'); if(!grid||document.getElementById('dados-loja-card')) return;
  const l=lojaAtual();
  const card=document.createElement('div'); card.id='dados-loja-card'; card.className='rounded-[16px] bg-white border p-6 lg:col-span-3';
  card.innerHTML=`<h4 class="font-bold text-[15px]"><i class="ph ph-storefront"></i> Dados da loja para relatórios e notinhas</h4><p class="text-[12px] text-slate-500 mt-1">Preencha uma vez. Estes dados aparecem nas notinhas, chamados e relatórios.</p><div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4"><label class="text-[11px] font-bold uppercase text-slate-500">Nome fantasia<input id="loja-fantasia" value="${esc(l.fantasia||'DIGICOPY')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[11px] font-bold uppercase text-slate-500 md:col-span-2">Razão social<input id="loja-razao" value="${esc(l.razaoSocial||l.nome||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[11px] font-bold uppercase text-slate-500">CNPJ<input id="loja-cnpj" value="${esc(l.cnpj||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[11px] font-bold uppercase text-slate-500">Telefone<input id="loja-telefone" value="${esc(l.telefone||l.fone||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[11px] font-bold uppercase text-slate-500">WhatsApp<input id="loja-whatsapp" value="${esc(l.whatsapp||'+55 38 99109-8698')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[11px] font-bold uppercase text-slate-500 md:col-span-2">Rua / Av<input id="loja-rua" value="${esc(l.rua||l.logradouro||l.endereco||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[11px] font-bold uppercase text-slate-500">Número<input id="loja-numero" value="${esc(l.numero||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[11px] font-bold uppercase text-slate-500">Bairro<input id="loja-bairro" value="${esc(l.bairro||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[11px] font-bold uppercase text-slate-500">Cidade<input id="loja-cidade" value="${esc(l.cidade||l.municipio||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[11px] font-bold uppercase text-slate-500">UF<input id="loja-uf" maxlength="2" value="${esc(l.uf||l.estado||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border uppercase"></label><label class="text-[11px] font-bold uppercase text-slate-500">CEP<input id="loja-cep" value="${esc(l.cep||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[11px] font-bold uppercase text-slate-500 md:col-span-2">E-mail<input id="loja-email" value="${esc(l.email||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label></div><div class="mt-4 flex gap-2"><button onclick="salvarDadosLojaFinal()" class="neo-btn primary"><i class="ph ph-floppy-disk"></i>Salvar dados da loja</button></div>`;
  grid.prepend(card);
}
window.salvarDadosLojaFinal=function(){
  const s=sess(); if(!s) return;
  const v=id=>txt(document.getElementById(id)?.value);
  const dados={fantasia:v('loja-fantasia'),razaoSocial:v('loja-razao'),cnpj:v('loja-cnpj'),telefone:v('loja-telefone'),whatsapp:v('loja-whatsapp'),rua:v('loja-rua'),numero:v('loja-numero'),bairro:v('loja-bairro'),cidade:v('loja-cidade'),uf:v('loja-uf').toUpperCase(),cep:v('loja-cep'),email:v('loja-email')};
  dados.endereco=[dados.rua,dados.numero,dados.bairro,dados.cidade&&dados.uf?`${dados.cidade}/${dados.uf}`:dados.cidade,dados.cep].filter(Boolean).join(' • ');
  salvarLoja(db,s.empresaId,dados); salvar(); toastMsg('Dados da loja salvos','success');
};
const oldRenderConfig=window.renderConfig;
window.renderConfig=function(){ const r=oldRenderConfig?oldRenderConfig.apply(this,arguments):undefined; setTimeout(()=>{ renderDadosLojaCard(); atualizarNomeSistema(); },120); return r; };

function inserirImportadorClientes(){
  const view=document.getElementById('view-clientes'); if(!view||document.getElementById('clientes-import-card')) return;
  const div=document.createElement('div'); div.id='clientes-import-card'; div.className='max-w-[980px] mx-auto rounded-[16px] bg-blue-50 border border-blue-200 p-4 text-[12px] text-blue-900';
  div.innerHTML=`<div class="flex flex-col md:flex-row md:items-center gap-3"><div class="flex-1"><b>Importar clientes reais</b><p class="mt-1">Use preferencialmente <b>CLIENTES.json</b> e <b>CLIENTES_FINAL.json</b>. Arquivos de usuários/restrição são ignorados neste importador.</p></div><input id="clientes-json-input" type="file" accept=".json,application/json" multiple class="text-[12px]"><button onclick="importarClientesJsonFinal()" class="neo-btn primary">Importar clientes</button></div><div id="clientes-import-status" class="mt-2 text-[12px]"></div>`;
  view.prepend(div);
}
window.importarClientesJsonFinal=async function(){
  const s=sess(); if(!s) return;
  const input=document.getElementById('clientes-json-input'); const files=Array.from(input?.files||[]);
  if(!files.length) return toastMsg('Selecione CLIENTES.json e/ou CLIENTES_FINAL.json','error');
  const arquivos=[];
  for(const f of files){
    try{ arquivos.push({nome:f.name,json:JSON.parse(await f.text())}); }
    catch(e){ toastMsg('Erro lendo '+f.name+': '+e.message,'error'); }
  }
  const r=importarClientesDeObjetos(db,arquivos,s.empresaId);
  salvar(); if(typeof renderClientes==='function') renderClientes();
  const st=document.getElementById('clientes-import-status'); if(st) st.innerHTML=`Importados: <b>${r.importados}</b> • Atualizados: <b>${r.atualizados}</b> • Ignorados: <b>${r.ignorados}</b> • Próximo código: <b>${r.ultimoCodigo+1}</b>`;
  toastMsg('Clientes importados/atualizados','success');
};
const oldRenderClientes=window.renderClientes;
window.renderClientes=function(){ const r=oldRenderClientes?oldRenderClientes.apply(this,arguments):undefined; setTimeout(()=>{ inserirImportadorClientes(); atualizarNomeSistema(); },80); return r; };

console.log('[DIGICOPY] sistema_clientes_loja_patch.js v4.9.58 carregado');
})();
