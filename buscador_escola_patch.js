// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.67 — Buscador Escola final integrado ao Sistema Digicopy
// • Fluxo adaptado do projeto Flask para Electron/Web, sem Python/SQLite/.env
// • Credenciais salvas na configuração do sistema, não em arquivo/código
// • Autoatualização controlada a cada 1 hora, qualquer PC pode atualizar
// • Layout no padrão do Sistema Digicopy, com cards, badges, excluídos e Excel
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function n(v,fb=0){ if(v===null||v===undefined||String(v).trim()==='') return fb; const x=Number(String(v).replace(',','.')); return Number.isFinite(x)?x:fb; }
function inteiro(v,fb=0){ const x=parseInt(String(v ?? '').replace(/\D+/g,''),10); return Number.isFinite(x)?x:fb; }
function agora(){ return new Date().toISOString(); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(n(v,0)):n(v,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function dataBR(v){ return typeof fmtDate==='function'?fmtDate(v):txt(v).slice(0,10); }
function dataHoraBR(v){ return typeof fmtDateTime==='function'?fmtDateTime(v):txt(v); }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function delay(ms){ return new Promise(r=>setTimeout(r,ms||0)); }
function normalizarTexto(texto){ return txt(texto).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/gi,'').toLowerCase().trim(); }
function msDesde(v){ const t=Date.parse(v||''); return Number.isFinite(t)?Date.now()-t:Infinity; }

const API_PADRAO='https://api.caixaescolar.educacao.mg.gov.br';
const BASE_COORDS={lat:-15.8025,lng:-43.3089,nome:'Janaúba/MG'};
const UMA_HORA_MS=60*60*1000;
const MUNICIPIOS_NORTE_MINAS=new Set([
  'janauba','nova porteirinha','porteirinha','riacho dos machados','verdelandia','jaiba','mato verde','monte azul','espinosa','gameleiras','catuti','pai pedro','mamonas','serranopolis de minas','rio pardo de minas','indaiabira','ninheira','montezuma','santo antonio do retiro','vargem grande do rio pardo','sao joao do paraiso','taiobeiras','berizal','curral de dentro','rubelita','fruta de leite','novorizonte','salinas','santa cruz de salinas','aguas vermelhas','divisa alegre','padre carvalho','josenopolis','montes claros','bocaiuva','francisco sa','capitao eneas','sao joao da ponte','varzelandia','ibiracatu','japonvar','lontra','mirabela','juramento','glaucilandia','guaraciama','engenheiro navarro','claro dos pocoes','coracao de jesus','sao joao da lagoa','sao joao do pacui','patis','luislandia','brasilia de minas','ubai','sao francisco','pintopolis','icarai de minas','sao romao','santa fe de minas','pirapora','buritizeiro','varzea da palma','lassance','jequitai','ponto chique','ibiai','lagoa dos patos','riachinho','januaria','itacarambi','bonito de minas','conego marinho','pedras de maria da cruz','sao joao das missoes','manga','matias cardoso','montalvania','juvenilia','miravania','urucuia','grao mogol','cristalia','botumirim','itacambira'
]);
const CIDADES_PRIORITARIAS=new Set(['janauba','porteirinha','pai pedro','mato verde','catuti','monte azul','gameleiras','espinosa','santo antonio do retiro','rio pardo de minas','verdelandia','jaiba','matias cardoso','manga','montalvania','capitao eneas','francisco sa']);
const CIDADES_COORDS={
  'janauba':[-15.8025,-43.3089], 'nova porteirinha':[-15.8008,-43.2941], 'jaiba':[-15.3433,-43.6686], 'porteirinha':[-15.7433,-43.0283],
  'montes claros':[-16.7282,-43.8578], 'mato verde':[-15.3972,-42.8664], 'monte azul':[-15.1550,-42.8747], 'espinosa':[-14.9247,-42.8092],
  'pai pedro':[-15.5277,-43.0691], 'manga':[-14.7556,-43.9392], 'matias cardoso':[-14.8547,-43.9145], 'montalvania':[-14.4197,-44.3719],
  'capitao eneas':[-16.3261,-43.7083], 'francisco sa':[-16.4756,-43.4889], 'pirapora':[-17.3450,-44.9419], 'bocaiuva':[-17.1078,-43.8150],
  'salinas':[-16.1703,-42.2903], 'januaria':[-15.4875,-44.3598], 'varzelandia':[-15.7014,-44.0275], 'taiobeiras':[-15.8106,-42.2259],
  'brasilia de minas':[-16.2064,-44.4294], 'sao francisco':[-15.9519,-44.8594], 'grao mogol':[-16.5662,-42.8923], 'buritizeiro':[-17.3511,-44.9622]
};

function haversineKm(a,b){
  if(!a||!b) return 999;
  const R=6371, toRad=x=>x*Math.PI/180;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const s1=Math.sin(dLat/2), s2=Math.sin(dLng/2);
  const q=s1*s1+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*s2*s2;
  return Math.round((R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)))*10)/10;
}
function coordsDoRegistro(o){
  const lat=n(o.latitude ?? o.lat ?? o.latitudeEscola ?? o.coordLat, NaN);
  const lng=n(o.longitude ?? o.lng ?? o.lon ?? o.longitudeEscola ?? o.coordLng, NaN);
  if(Number.isFinite(lat)&&Number.isFinite(lng)) return {lat,lng};
  const c=CIDADES_COORDS[normalizarTexto(o.municipio||o.county_name||o.countyName||o.cidade||o.nomeMunicipio)];
  return c?{lat:c[0],lng:c[1]}:null;
}
function calcularDistancia(o){ const coords=Array.isArray(o)?{lat:n(o[0]),lng:n(o[1])}:coordsDoRegistro(o||{}); return coords?haversineKm(BASE_COORDS,coords):999; }
function isNorte(municipio){ return MUNICIPIOS_NORTE_MINAS.has(normalizarTexto(municipio)); }
function isPrioritario(municipio){ return CIDADES_PRIORITARIAS.has(normalizarTexto(municipio)); }
function prioridadeRegiao(distanciaKm, municipio){ return isPrioritario(municipio)||isNorte(municipio)||n(distanciaKm,999)<=250?1:2; }

function cfg(dbRef){
  dbRef.config=dbRef.config||{}; dbRef.config.buscadorEscola=dbRef.config.buscadorEscola||{};
  const c=dbRef.config.buscadorEscola;
  c.apiBase=c.apiBase||API_PADRAO;
  c.cidadeBase=c.cidadeBase||'Janaúba/MG';
  c.statusPadrao=c.statusPadrao||'NAEN';
  c.maxPaginas=c.maxPaginas||80;
  c.loginPath=c.loginPath||'/auth/login';
  c.orcamentosPath=c.orcamentosPath||'/budget-proposal/summary-by-supplier-profile';
  c.itensPath=c.itensPath||'/budget-item/by-subprogram/{idSubprogram}/by-school/{idSchool}/by-budget/{idBudget}';
  c.limit=c.limit||100;
  c.autoSync=c.autoSync!==false;
  c.intervaloMinutos=c.intervaloMinutos||60;
  c.credenciais=c.credenciais||{usuario:'',senha:''};
  c.layoutFinal=true;
  return c;
}
function store(dbRef){
  dbRef.escolaOrcamentos=dbRef.escolaOrcamentos||[];
  dbRef.escolaItens=dbRef.escolaItens||[];
  dbRef.escolaExcluidos=dbRef.escolaExcluidos||[];
  dbRef.escolaLogs=dbRef.escolaLogs||[];
  return {orcamentos:dbRef.escolaOrcamentos,itens:dbRef.escolaItens,excluidos:dbRef.escolaExcluidos,logs:dbRef.escolaLogs};
}
function logEscola(dbRef,tipo,msg,detalhes){
  const st=store(dbRef);
  st.logs.unshift({id:uidSafe('esc_log'),data:agora(),tipo:txt(tipo)||'info',mensagem:txt(msg),detalhes:detalhes||null});
  if(st.logs.length>500) st.logs.length=500;
}
function idOrc(o){ return txt(o.idBudget ?? o.id_budget ?? o.id ?? o.orcamento_id ?? o.orcamentoId ?? o.numero_orcamento ?? o.numeroOrcamento ?? o.nuBudgetOrder ?? o.numero ?? o.codigo); }
function normalizarOrcamento(raw){
  const id=idOrc(raw)||uidSafe('esc_orc');
  const municipio=txt(raw.countyName ?? raw.county_name ?? raw.municipio ?? raw.nomeMunicipio ?? raw.cidade ?? raw.localidade);
  let distancia=n(raw.distancia_km ?? raw.distanciaKm, NaN);
  if(!Number.isFinite(distancia)) distancia=calcularDistancia({municipio,latitude:raw.latitude,longitude:raw.longitude});
  return {
    id,
    idBudget:txt(raw.idBudget ?? raw.id_budget ?? id),
    idSchool:txt(raw.idSchool ?? raw.id_school ?? raw.schoolId),
    idSubprogram:txt(raw.idSubprogram ?? raw.id_subprogram ?? raw.subprogramId),
    numero_orcamento:txt(raw.nuBudgetOrder ?? raw.numero_orcamento ?? raw.numeroOrcamento ?? raw.numero ?? raw.codigo ?? id),
    nome_escola:txt(raw.schoolName ?? raw.school_name ?? raw.nome_escola ?? raw.nomeEscola ?? raw.escola ?? raw.unidade ?? raw.nome)||'Escola não informada',
    municipio,
    data_fim:txt(raw.data_fim ?? raw.dataFim ?? raw.validade ?? raw.encerramento ?? raw.fim),
    valor_total:n(raw.valor_total ?? raw.valorTotal ?? raw.total,0),
    status:txt(raw.status ?? raw.situacao ?? raw.supplierStatus ?? 'NAEN'),
    distancia_km:distancia,
    norte_minas:isNorte(municipio),
    prioritario:isPrioritario(municipio),
    prioridade_regiao:prioridadeRegiao(distancia,municipio),
    atualizadoEm:agora(), origem:'api'
  };
}
function normalizarItem(raw,orcamentoId){
  const descricao=txt(raw.txDescription ?? raw.descricao ?? raw.itemDescricao ?? raw.nome ?? raw.produto ?? raw.material ?? raw.descricaoItem) || 'Item sem descrição';
  const tipo=txt(raw.txBudgetItemType ?? raw.tipo ?? raw.tipoItem ?? raw.categoria ?? raw.grupo ?? '');
  const idBudget=txt(raw.id_budget ?? raw.idBudget ?? raw.budget_id ?? raw.budgetId ?? raw.orcamento_id ?? raw.orcamentoId ?? raw.idOrcamento ?? orcamentoId);
  return {
    id:txt(raw.id ?? raw.item_id ?? raw.itemId ?? raw.codigo ?? raw.cod_item ?? `${idBudget}_${normalizarTexto(tipo||descricao).slice(0,24)}_${raw.quantidade||raw.qtd||1}`),
    orcamento_id:idBudget, id_budget:idBudget, tipo, descricao,
    quantidade:n(raw.quantidade ?? raw.qtd ?? raw.qtde ?? raw.quantidadeSolicitada,1),
    valor_unitario:n(raw.valor_unitario ?? raw.valorUnitario ?? raw.preco ?? raw.valor ?? raw.precoUnitario,0),
    unidade:txt(raw.unidade ?? raw.und ?? raw.unidadeMedida ?? '')
  };
}
function upsertOrcamento(dbRef,raw){ const st=store(dbRef), o=normalizarOrcamento(raw); const old=st.orcamentos.find(x=>String(x.id)===String(o.id)); if(old) Object.assign(old,o); else st.orcamentos.push(o); return o; }
function salvarItens(dbRef,orcamentoId,itensRaw){
  const st=store(dbRef); const id=txt(orcamentoId);
  st.itens=st.itens.filter(i=>String(i.orcamento_id)!==String(id)); dbRef.escolaItens=st.itens;
  (Array.isArray(itensRaw)?itensRaw:[]).forEach(r=>st.itens.push(normalizarItem(r,id)));
  return st.itens.filter(i=>String(i.orcamento_id)===String(id)).length;
}
function limparInexistentes(dbRef,idsApi){
  const st=store(dbRef); const ids=new Set(Array.from(idsApi||[]).map(String)); if(!ids.size) return 0;
  const remover=[]; st.orcamentos.forEach(o=>{ if(o.origem==='api'&&!ids.has(String(o.id))) remover.push(o.id); });
  remover.forEach(id=>descartarOrcamento(dbRef,id,'Removido/expirado na API',true)); return remover.length;
}
function descartarOrcamento(dbRef,orcamentoId,motivo,auto){
  const st=store(dbRef); const id=txt(orcamentoId); const m=txt(motivo)||'Descartado';
  if(!st.excluidos.find(e=>String(e.orcamento_id)===String(id))){ st.excluidos.push({id:uidSafe('esc_exc'),orcamento_id:id,motivo:m,data_exclusao:agora(),automatico:!!auto}); logEscola(dbRef,auto?'limpeza':'descarte',`Orçamento ${id} descartado`,m); }
  return true;
}
function restaurarOrcamento(dbRef,orcamentoId){ const st=store(dbRef); dbRef.escolaExcluidos=st.excluidos.filter(e=>String(e.orcamento_id)!==String(orcamentoId)); logEscola(dbRef,'restaurar',`Orçamento ${orcamentoId} restaurado`); return true; }
function pesquisarOrcamentos(dbRef,termoBusca,opts={}){
  const termo=normalizarTexto(termoBusca), regiao=txt(opts.regiao||'1'); const st=store(dbRef), excl=new Set(st.excluidos.map(e=>String(e.orcamento_id))); const grupos=[];
  st.orcamentos.forEach(o=>{
    if(excl.has(String(o.id))) return;
    if((regiao==='2'||regiao==='3')&&!isNorte(o.municipio)) return;
    const itens=st.itens.filter(i=>String(i.orcamento_id)===String(o.id));
    const encontrados=itens.filter(i=>!termo || normalizarTexto(`${i.tipo} ${i.descricao}`).includes(termo));
    if(!encontrados.length && termo) return;
    const total=itens.length; const extras=Math.max(0,total-encontrados.length); const apenas=!!termo&&total>0&&extras===0;
    (encontrados.length?encontrados:[{descricao:'(sem itens baixados)',tipo:'',quantidade:0,valor_unitario:0,id:''}]).forEach(i=>grupos.push({...o,item_descricao:i.descricao,item_tipo:i.tipo,quantidade:i.quantidade,valor_unitario:i.valor_unitario,item_id:i.id,total_produtos:total,produtos_encontrados:encontrados.length,quantidade_produtos_extras:extras,apenas_pesquisado:apenas,tem_produtos_extras:extras>0,prioridade_regiao:prioridadeRegiao(o.distancia_km,o.municipio)}));
  });
  const priorApp=(regiao==='1'||regiao==='3');
  grupos.sort((a,b)=>{
    const ga=a.apenas_pesquisado?0:1, gb=b.apenas_pesquisado?0:1; if(ga!==gb) return ga-gb;
    const pa=priorApp?(a.prioritario?0:1):0, pb=priorApp?(b.prioritario?0:1):0; if(pa!==pb) return pa-pb;
    if(a.quantidade_produtos_extras!==b.quantidade_produtos_extras) return a.quantidade_produtos_extras-b.quantidade_produtos_extras;
    return n(a.distancia_km,999)-n(b.distancia_km,999) || String(a.numero_orcamento).localeCompare(String(b.numero_orcamento),'pt-BR',{numeric:true});
  });
  return grupos;
}
function excelHtml(linhas){
  const rows=(linhas||[]).map(r=>`<tr><td>${esc(r.numero_orcamento)}</td><td>${esc(r.nome_escola)}</td><td>${esc(r.municipio)}</td><td>${esc(r.distancia_km===999?'N/A':r.distancia_km)}</td><td>${esc(dataBR(r.data_fim))}</td><td>${esc(r.apenas_pesquisado?'SIM':'')}</td><td>${esc(r.quantidade_produtos_extras||0)}</td><td>${esc(r.item_tipo||'')}</td><td>${esc(r.item_descricao)}</td><td>${esc(r.quantidade)}</td><td>${esc(n(r.valor_unitario,0).toFixed(2).replace('.',','))}</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Arial;font-size:11pt}th{background:#1F4E78;color:#fff;font-weight:bold;text-align:center;border:1px solid #999;padding:6px}td{border:1px solid #ccc;padding:5px}tr:nth-child(even){background:#f3f6fb}.ok{background:#27AE60;color:#fff}.warn{background:#FFFF00;color:#F00;font-weight:bold}</style></head><body><h3>PESQUISA - CAIXA ESCOLAR</h3><table><thead><tr><th>Código</th><th>Escola</th><th>Município</th><th>Distância (km)</th><th>Data Fim</th><th>Apenas pesquisado</th><th>Produtos extras</th><th>Tipo</th><th>Item Solicitado</th><th>Qtd</th><th>Valor Unit. (R$)</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}
function baixarExcel(linhas){ const blob=new Blob(['\ufeff'+excelHtml(linhas)],{type:'application/vnd.ms-excel;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='buscador_escola_'+new Date().toISOString().slice(0,10)+'.xls'; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(url); a.remove();},1200); }
function importarAntigos(dbRef){
  const mod=(dbRef.modulosDinamicos||{}); let totalO=0,totalI=0;
  Object.entries(mod).forEach(([nome,m])=>{ if(!m||!Array.isArray(m.dados)) return; const nomeN=normalizarTexto(nome); if(!/(orc|escola|caixa|budget)/.test(nomeN)) return;
    m.dados.slice(0,50000).forEach((r,idx)=>{ const escola=r.SCHOOL_NAME||r.NOME_ESCOLA||r.ESCOLA||r.NOME||r.UNIDADE_ESCOLAR; const desc=r.TXDESCRIPTION||r.txDescription||r.DESCRICAO||r.ITEM||r.PRODUTO||r.MATERIAL; const orcId=r.ID_BUDGET||r.idBudget||r.IDBUDGET||r.ORCAMENTO_ID||r.COD_ORCAMENTO||r.ID_ORCAMENTO||r.ID||r.CODIGO||r.NUMERO_ORCAMENTO||`${nome}_${idx}`;
      if(escola){ upsertOrcamento(dbRef,{idBudget:orcId,idSchool:r.ID_SCHOOL||r.idSchool,idSubprogram:r.ID_SUBPROGRAM||r.idSubprogram,nuBudgetOrder:r.NU_BUDGET_ORDER||r.nuBudgetOrder||r.NUMERO_ORCAMENTO||r.NUMERO||orcId,schoolName:escola,countyName:r.COUNTY_NAME||r.countyName||r.MUNICIPIO||r.CIDADE,data_fim:r.DATA_FIM||r.VALIDADE,valor_total:r.VALOR_TOTAL||r.TOTAL,status:r.STATUS||r.SITUACAO||'NAEN',distancia_km:r.DISTANCIA_KM}); totalO++; }
      if(desc){ const st=store(dbRef); const item=normalizarItem({id:r.ITEM_ID||r.COD_ITEM||`${orcId}_${idx}`,id_budget:orcId,tipo:r.TXBUDGETITEMTYPE||r.txBudgetItemType||r.TIPO||r.CATEGORIA,descricao:desc,quantidade:r.QUANTIDADE||r.QTD,valor_unitario:r.VALOR_UNITARIO||r.PRECO||r.VALOR},orcId); if(!st.itens.find(i=>String(i.id)===String(item.id))){ st.itens.push(item); totalI++; } }
    });
  }); return {orcamentos:totalO,itens:totalI};
}
function listaConteudo(dados){ if(Array.isArray(dados)) return dados; if(!dados||typeof dados!=='object') return []; return dados.content||dados.data||dados.items||dados.resultados||dados.results||dados.orcamentos||dados.itens||[]; }
function apiBase(c){ return (c.apiBase||API_PADRAO).replace(/\/$/,''); }
function urlPath(base,path){ return base + (String(path||'').startsWith('/')?'':'/') + String(path||''); }
function urlOrcamentos(c,pagina){ const u=new URL(urlPath(apiBase(c),c.orcamentosPath||'/budget-proposal/summary-by-supplier-profile')); u.searchParams.set('filter.supplierStatus',`$eq:${c.statusPadrao||'NAEN'}`); u.searchParams.set('page',String(pagina)); u.searchParams.set('limit',String(c.limit||100)); return u.toString(); }
function urlItens(c,o,pagina){ const path=(c.itensPath||'/budget-item/by-subprogram/{idSubprogram}/by-school/{idSchool}/by-budget/{idBudget}').replace('{idSubprogram}',encodeURIComponent(o.idSubprogram||'')).replace('{idSchool}',encodeURIComponent(o.idSchool||'')).replace('{idBudget}',encodeURIComponent(o.idBudget||o.id||'')); const u=new URL(urlPath(apiBase(c),path)); u.searchParams.set('page',String(pagina)); u.searchParams.set('limit',String(c.limit||100)); return u.toString(); }

async function requestApi(method,url,body,auth){
  const a=typeof auth==='object'&&auth?auth:{token:auth||'',cookie:''};
  if(window.caixaEscolarAPI&&typeof window.caixaEscolarAPI.request==='function') return window.caixaEscolarAPI.request({method,url,body,token:a.token,cookie:a.cookie});
  let lastErr=null;
  for(let tent=0; tent<3; tent++){
    try{ const headers={'Content-Type':'application/json'}; if(a.token) headers.Authorization='Bearer '+a.token; const resp=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined,credentials:'include'}); const text=await resp.text(); let data=null; try{data=text?JSON.parse(text):null;}catch(e){data=text;} if(resp.ok) return {ok:true,status:resp.status,data,cookies:[]}; if(![429,500,502,503,504].includes(resp.status)) return {ok:false,status:resp.status,error:(data&&data.message)||text||resp.statusText,data}; lastErr=(data&&data.message)||text||resp.statusText; }
    catch(e){ lastErr=e.message||String(e); }
    await delay(800*(tent+1));
  }
  return {ok:false,error:lastErr||'Falha na comunicação'};
}
async function baixarItensOrcamento(c,o,auth){
  let total=0;
  for(let p=1;p<=50;p++){
    const r=await requestApi('GET',urlItens(c,o,p),null,auth);
    if(!r.ok) return {ok:false,total,error:r};
    const itens=listaConteudo(r.data); if(!itens.length) break;
    total+=salvarItens(db,o.id,itens);
    if(itens.length<(c.limit||100)) break;
  }
  return {ok:true,total};
}
async function sincronizarAPI(limparTudo){
  const s=sess(); if(!s) return;
  if(window.__buscadorEscolaSyncAtivo) return toastMsg('Sincronização já está em andamento. Aguarde terminar.','info');
  window.__buscadorEscolaSyncAtivo=true;
  const c=cfg(db), senha=txt(document.getElementById('esc-senha')?.value||localStorage.getItem('digicopy_buscador_escola_senha_local')||''), cnpj=txt(document.getElementById('esc-cnpj')?.value||c.cnpjCpf||'');
  try{
    if(!cnpj||!senha){ toastMsg('Informe CNPJ/CPF e senha para sincronizar','error'); return; }
    c.cnpjCpf=cnpj; c.apiBase=txt(document.getElementById('esc-api')?.value)||c.apiBase||API_PADRAO; c.statusPadrao=txt(document.getElementById('esc-status-api')?.value)||'NAEN'; c.maxPaginas=Math.max(1,inteiro(document.getElementById('esc-max-pag')?.value,50)); c.loginPath=txt(document.getElementById('esc-login-path')?.value)||c.loginPath||'/auth/login'; c.orcamentosPath=txt(document.getElementById('esc-orc-path')?.value)||c.orcamentosPath; c.itensPath=txt(document.getElementById('esc-itens-path')?.value)||c.itensPath; c.limit=Math.max(10,inteiro(document.getElementById('esc-limit')?.value,100));
    try{ localStorage.setItem('digicopy_buscador_escola_senha_local',senha); }catch(e){}
    if(limparTudo){ db.escolaOrcamentos=[]; db.escolaItens=[]; logEscola(db,'limpeza','Base do Buscador Escola limpa para baixar tudo'); }
    salvar(); renderBuscadorEscola('Sincronizando login...');
    const login=await requestApi('POST',urlPath(apiBase(c),c.loginPath),{txCpfCnpj:cnpj.replace(/\D+/g,''),txPassword:senha,cnpjCpf:cnpj.replace(/\D+/g,''),senha},null);
    if(!login.ok){ logEscola(db,'erro','Falha no login da API',login); renderBuscadorEscola('Falha no login: '+(login.error||login.status)); toastMsg('Falha na autenticação da API','error'); return; }
    const token=(login.data&&(login.data.token||login.data.access_token||login.data.accessToken||login.data.jwt))||login.token||'';
    const cookie=(login.cookies||[]).map(c=>String(c).split(';')[0]).filter(Boolean).join('; ');
    const auth={token,cookie}; if(!token&&!cookie) logEscola(db,'aviso','Login OK sem token/cookie explícito. Se a lista falhar, a API mudou autenticação.',login.data);
    let pagina=1,total=0,totalItens=0,errosItens=0; const ids=new Set();
    while(pagina<=c.maxPaginas){
      renderBuscadorEscola(`Sincronizando página ${pagina}... (${total} orçamentos)`);
      const resp=await requestApi('GET',urlOrcamentos(c,pagina),null,auth);
      if(!resp.ok){ const msg=resp.status===404?'Rota de orçamentos não encontrada (404). Ajuste as rotas avançadas.':'Erro na página '+pagina+': '+(resp.error||resp.status); logEscola(db,'erro',msg,resp); renderBuscadorEscola(msg); break; }
      const content=listaConteudo(resp.data); if(!content.length) break;
      for(const raw of content){ const o=upsertOrcamento(db,raw); ids.add(String(o.id)); total++; const itens=await baixarItensOrcamento(c,o,auth); if(itens.ok) totalItens+=itens.total; else {errosItens++; logEscola(db,'erro',`Erro ao baixar itens do orçamento ${o.id}`,itens.error);} if(total%25===0){salvar(); await delay(0);} }
      salvar(); pagina++; await delay(0);
    }
    const limpos=limparInexistentes(db,ids); c.ultimoSyncEm=hoje(); c.ultimoSyncResumo={orcamentos:total,itens:totalItens,limpos,errosItens}; salvar();
    const fim=`Sincronização finalizada: ${total} orçamento(s), ${totalItens} item(ns), ${limpos} removido(s)/expirado(s), ${errosItens} erro(s) de item.`; logEscola(db,'sync',fim,c.ultimoSyncResumo); renderBuscadorEscola(fim); toastMsg('Buscador Escola sincronizado','success');
  }finally{ window.__buscadorEscolaSyncAtivo=false; }
}

window.BUSCADOR_ESCOLA_PURE={normalizarTexto,haversineKm,calcularDistancia,prioridadeRegiao,normalizarOrcamento,normalizarItem,pesquisarOrcamentos,descartarOrcamento,restaurarOrcamento,excelHtml,importarAntigos,isNorte,isPrioritario,urlOrcamentos,urlItens,listaConteudo};
window.escolaSincronizarAPI=function(){ return sincronizarAPI(false); };
window.escolaSincronizarTudo=function(){ if(confirm('Baixar tudo limpa orçamentos e itens do Buscador Escola antes de sincronizar. Continuar?')) return sincronizarAPI(true); };
window.escolaImportarAntigos=function(){ const r=importarAntigos(db); salvar(); renderBuscadorEscola(`Importação antiga: ${r.orcamentos} orçamento(s), ${r.itens} item(ns).`); toastMsg('Dados antigos importados para Buscador Escola','success'); };
window.escolaDescartar=function(id){ const motivo=prompt('Motivo para descartar este orçamento:','Não interessa / longe / produto fora do foco'); if(motivo===null) return; descartarOrcamento(db,id,motivo,false); salvar(); renderBuscadorEscola('Orçamento descartado.'); };
window.escolaRestaurar=function(id){ restaurarOrcamento(db,id); salvar(); renderBuscadorEscola('Orçamento restaurado.'); };
window.escolaExportarExcel=function(){ baixarExcel(window.__escolaResultados||pesquisarOrcamentos(db,document.getElementById('esc-busca')?.value||'', {regiao:window.__escolaRegiao||'1'})); };
window.escolaBuscar=function(){ window.__escolaTermo=txt(document.getElementById('esc-busca')?.value); window.__escolaRegiao=txt(document.getElementById('esc-regiao')?.value)||'1'; const interv=txt(document.getElementById('esc-intervalo')?.value)||'1-300'; const parts=interv.includes('-')?interv.split('-'):[interv,interv]; window.__escolaInicio=Math.max(1,inteiro(parts[0],1)); window.__escolaFim=Math.max(window.__escolaInicio,inteiro(parts[1],window.__escolaInicio+299)); renderBuscadorEscola(); };
window.escolaMais=function(){ window.__escolaFim=(window.__escolaFim||300)+300; renderBuscadorEscola(); };
window.escolaExemplos=function(){
  const base=[{idBudget:'ex1',nuBudgetOrder:'1001',schoolName:'Escola Estadual Exemplo Janaúba',countyName:'Janaúba',status:'NAEN'},{idBudget:'ex2',nuBudgetOrder:'1002',schoolName:'Escola Municipal Norte Minas',countyName:'Jaíba',status:'NAEN'},{idBudget:'ex3',nuBudgetOrder:'1003',schoolName:'Escola Distante Exemplo',countyName:'Belo Horizonte',status:'NAEN',distancia_km:520}];
  base.forEach(o=>upsertOrcamento(db,{...o,origem:'exemplo'})); salvarItens(db,'ex1',[{id:'ex1i1',txBudgetItemType:'Toner',txDescription:'Cartucho de toner compatível'},{id:'ex1i2',txBudgetItemType:'Papel',txDescription:'Papel A4 caixa'}]); salvarItens(db,'ex2',[{id:'ex2i1',txBudgetItemType:'Toner',txDescription:'Recarga de toner'}]); salvarItens(db,'ex3',[{id:'ex3i1',txBudgetItemType:'Impressora',txDescription:'Impressora multifuncional'}]); salvar(); renderBuscadorEscola('Exemplos carregados. Busque por toner, papel ou impressora.');
};
function linkOrcamento(r){ return r.numero_orcamento?`https://caixaescolar.educacao.mg.gov.br/compras/orcamentos?budgetOrder=${encodeURIComponent(r.numero_orcamento)}&status=${encodeURIComponent(r.status||'NAEN')}`:'#'; }
function renderBuscadorEscola(msg){
  const s=sess(); if(!s) return; const view=(typeof ensureView==='function'?ensureView('buscador-escola'):document.getElementById('view-buscador-escola')); if(!view) return;
  const c=cfg(db), st=store(db), termo=window.__escolaTermo||'', regiao=window.__escolaRegiao||'1', resultados=pesquisarOrcamentos(db,termo,{regiao}); window.__escolaResultados=resultados;
  const inicio=window.__escolaInicio||1, fim=window.__escolaFim||Math.min(300,resultados.length||300), rows=resultados.slice(inicio-1,fim); const resumo=`${st.orcamentos.length} orçamento(s) • ${st.itens.length} item(ns) • ${st.excluidos.length} descartado(s)`;
  view.innerHTML=`<div class="neo-shell"><div class="neo-panel"><div class="neo-head"><div><h3>Buscador Escola</h3><p>Orçamentos Caixa Escolar por produto, Norte de Minas, extras e distância. Sem SQLite e sem arquivo de log.</p></div><div class="neo-actions"><button onclick="escolaSincronizarAPI()" class="neo-btn primary"><i class="ph ph-cloud-arrow-down"></i>Atualizar</button><button onclick="escolaSincronizarTudo()" class="neo-btn danger"><i class="ph ph-arrows-clockwise"></i>Baixar tudo</button><button onclick="escolaExportarExcel()" class="neo-btn"><i class="ph ph-file-xls"></i>Excel</button><button onclick="escolaExemplos()" class="neo-btn"><i class="ph ph-flask"></i>Exemplos</button></div></div><div class="p-4 border-b bg-white space-y-3"><div class="grid grid-cols-1 md:grid-cols-6 gap-2"><input id="esc-cnpj" value="${esc(c.cnpjCpf||'')}" placeholder="CNPJ/CPF da API" class="neo-input"><input id="esc-senha" type="password" value="${esc(localStorage.getItem('digicopy_buscador_escola_senha_local')||'')}" placeholder="Senha local" class="neo-input"><input id="esc-api" value="${esc(c.apiBase||API_PADRAO)}" placeholder="URL API" class="neo-input md:col-span-2"><input id="esc-status-api" value="${esc(c.statusPadrao||'NAEN')}" class="neo-input" title="Status"><input id="esc-max-pag" type="number" value="${esc(c.maxPaginas||50)}" class="neo-input" title="Máx. páginas"></div><details class="rounded-xl border bg-slate-50 p-3"><summary class="text-[12px] font-bold cursor-pointer">Rotas avançadas da API</summary><div class="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2"><input id="esc-login-path" value="${esc(c.loginPath)}" class="neo-input"><input id="esc-orc-path" value="${esc(c.orcamentosPath)}" class="neo-input"><input id="esc-itens-path" value="${esc(c.itensPath)}" class="neo-input"><input id="esc-limit" type="number" value="${esc(c.limit||100)}" class="neo-input"></div><p class="text-[11px] text-slate-500 mt-2">Padrão do seu app.py: /auth/login, /budget-proposal/summary-by-supplier-profile e /budget-item/by-subprogram/{idSubprogram}/by-school/{idSchool}/by-budget/{idBudget}</p></details><div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center"><input id="esc-busca" value="${esc(termo)}" onkeydown="if(event.key==='Enter')escolaBuscar()" placeholder="Buscar tipo/descrição: toner, papel, impressora..." class="neo-input md:col-span-5"><select id="esc-regiao" class="neo-select md:col-span-2"><option value="1" ${regiao==='1'?'selected':''}>MG todo</option><option value="2" ${regiao==='2'?'selected':''}>Norte de Minas</option><option value="3" ${regiao==='3'?'selected':''}>Norte prioritário</option></select><input id="esc-intervalo" value="${inicio}-${fim}" class="neo-input md:col-span-2" title="Intervalo"><button onclick="escolaBuscar()" class="neo-btn md:col-span-1"><i class="ph ph-magnifying-glass"></i></button><button onclick="escolaImportarAntigos()" class="neo-btn md:col-span-2"><i class="ph ph-database"></i>Importar antigos</button></div>${msg?`<div class="rounded-xl bg-blue-50 border border-blue-200 p-2 text-[12px] text-blue-900">${esc(msg)}</div>`:''}<div class="text-[11px] text-slate-500">${esc(resumo)} • Senha fica somente neste computador. A busca só roda no Enter/lupa.</div></div><div class="overflow-auto max-h-[calc(100vh-350px)]"><table class="neo-table"><thead><tr><th>Prior.</th><th>Código/Escola</th><th>Município</th><th>Dist.</th><th>Produto</th><th>Extras</th><th>Ações</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.apenas_pesquisado?'<span class="neo-status ok">Só pesquisado</span>':(r.prioritario?'<span class="neo-status info">Prioritário</span>':r.norte_minas?'<span class="neo-status ok">Norte</span>':'<span class="neo-status wait">MG</span>')}</td><td><b>${esc(r.numero_orcamento||r.id)}</b><br><span>${esc(r.nome_escola)}</span></td><td>${esc(r.municipio||'-')}</td><td>${n(r.distancia_km,999)===999?'N/A':esc(r.distancia_km)+' km'}</td><td><b>${esc(r.item_tipo||'Sem tipo')}</b><br><span class="text-[11px] text-slate-500">${esc(r.item_descricao)}</span></td><td>${r.tem_produtos_extras?`<span class="neo-status wait">+${r.quantidade_produtos_extras}</span>`:'<span class="neo-status ok">0</span>'}<br><span class="text-[11px] text-slate-500">${r.produtos_encontrados}/${r.total_produtos}</span></td><td><a href="${esc(linkOrcamento(r))}" target="_blank" class="neo-btn !px-2" title="Abrir orçamento"><i class="ph ph-arrow-square-out"></i></a><button onclick="escolaDescartar('${esc(r.id)}')" class="neo-btn !px-2" title="Descartar"><i class="ph ph-x-circle"></i></button></td></tr>`).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-10">Nenhum resultado. Clique em Exemplos ou Atualizar.</td></tr>'}</tbody></table>${resultados.length>fim?`<div class="p-3 text-center border-t bg-slate-50"><button onclick="escolaMais()" class="neo-btn primary">Mostrar mais</button></div>`:''}</div><div class="p-4 border-t bg-slate-50"><details><summary class="font-bold text-[12px] cursor-pointer">Orçamentos descartados (${st.excluidos.length})</summary><div class="mt-2 space-y-1">${st.excluidos.slice(-80).reverse().map(e=>`<div class="flex justify-between items-center rounded-lg bg-white border p-2 text-[12px]"><span><b>${esc(e.orcamento_id)}</b> — ${esc(e.motivo)} • ${dataBR(e.data_exclusao)}</span><button onclick="escolaRestaurar('${esc(e.orcamento_id)}')" class="neo-btn !h-8">Restaurar</button></div>`).join('')||'<p class="text-slate-400 text-[12px]">Nenhum descartado.</p>'}</div></details><details class="mt-3"><summary class="font-bold text-[12px] cursor-pointer">Log interno (${(st.logs||[]).length})</summary><div class="mt-2 space-y-1 max-h-[220px] overflow-auto">${(st.logs||[]).slice(0,120).map(l=>`<div class="rounded-lg bg-white border p-2 text-[11px]"><b>${esc(l.tipo)}</b> • ${dataBR(l.data)} — ${esc(l.mensagem)}${l.detalhes?`<pre class="mt-1 whitespace-pre-wrap text-[10px] text-slate-500">${esc(JSON.stringify(l.detalhes,null,2).slice(0,800))}</pre>`:''}</div>`).join('')||'<p class="text-slate-400 text-[12px]">Sem logs.</p>'}</div></details></div></div></div>`;
}
window.renderBuscadorEscola=renderBuscadorEscola;

if(typeof document==='undefined') return;
function instalarMenu(){ const nav=document.getElementById('nav-gest'); if(!nav||document.querySelector('[data-nav="buscador-escola"]')) return; const btn=document.createElement('button'); btn.dataset.nav='buscador-escola'; btn.onclick=()=>navigateTo('buscador-escola'); btn.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white'; btn.innerHTML='<i class="ph ph-magnifying-glass text-[19px]"></i><span>Buscador Escola</span>'; const config=nav.querySelector('[data-nav="config"]'); if(config) nav.insertBefore(btn,config); else nav.appendChild(btn); }
const oldBuildNav=window.buildNav; window.buildNav=function(){ const r=oldBuildNav?oldBuildNav.apply(this,arguments):undefined; setTimeout(instalarMenu,0); return r; };
const oldNavigate=window.navigateTo; window.navigateTo=function(view){ if(view==='buscador-escola'){ document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden')); const el=typeof ensureView==='function'?ensureView('buscador-escola'):null; if(el) el.classList.remove('hidden'); document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.remove('bg-white/[0.12]','text-white','border','border-white/10'); b.classList.add('text-white/60');}); const act=document.querySelector('[data-nav="buscador-escola"]'); if(act){act.classList.add('bg-white/[0.12]','text-white','border','border-white/10');act.classList.remove('text-white/60');} if(typeof setPageHeader==='function') setPageHeader('Buscador Escola','Orçamentos escolares, busca por produto e distância'); renderBuscadorEscola(); if(window.innerWidth<1024&&typeof toggleSidebar==='function') toggleSidebar(true); return; } return oldNavigate?oldNavigate.apply(this,arguments):undefined; };
setTimeout(()=>{ instalarMenu(); },1200);
console.log('[DIGICOPY] buscador_escola_patch.js v4.9.56 carregado');
})();
