// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.55 — Buscador Escola integrado ao DIGICOPY ERP
// • Adapta projeto Flask/SQLite para o app Electron/Web sem servidor Python
// • Menu único "Buscador Escola" antes de Configurações
// • Sincronização paginada com API externa, busca, ranqueamento por distância
// • Exportação Excel compatível (.xls HTML) e descarte com motivo
// • v4.9.55: sem SQLite lock, sem log em arquivo, rotas configuráveis e log interno
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function low(v){ return normalizarTexto(v); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function n(v,fb=0){ if(v===null||v===undefined||String(v).trim()==='') return fb; const x=Number(String(v).replace(',','.')); return Number.isFinite(x)?x:fb; }
function inteiro(v,fb=0){ const x=parseInt(String(v ?? '').replace(/\D+/g,''),10); return Number.isFinite(x)?x:fb; }
function hoje(){ return new Date().toISOString(); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(n(v,0)):n(v,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function dataBR(v){ return typeof fmtDate==='function'?fmtDate(v):txt(v).slice(0,10); }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function delay(ms){ return new Promise(r=>setTimeout(r,ms||0)); }

const API_PADRAO='https://api.caixaescolar.mg.gov.br';
const BASE_COORDS={lat:-15.8025,lng:-43.3089,nome:'Janaúba/MG'};
const CIDADES_COORDS={
  'janauba':[-15.8025,-43.3089], 'jaiba':[-15.3433,-43.6686], 'montes claros':[-16.7282,-43.8578], 'mocambinho':[-15.0930,-44.0160],
  'pirapora':[-17.3450,-44.9419], 'bocaiuva':[-17.1078,-43.8150], 'salinas':[-16.1703,-42.2903], 'januaria':[-15.4875,-44.3598],
  'manga':[-14.7556,-43.9392], 'varzelandia':[-15.7014,-44.0275], 'porteirinha':[-15.7433,-43.0283], 'espinosa':[-14.9247,-42.8092],
  'taiobeiras':[-15.8106,-42.2259], 'brasilia de minas':[-16.2064,-44.4294], 'sao francisco':[-15.9519,-44.8594], 'arinos':[-15.9169,-46.1056]
};

function normalizarTexto(texto){
  return txt(texto).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}
function haversineKm(a,b){
  if(!a||!b) return 999;
  const R=6371, toRad=x=>x*Math.PI/180;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const s1=Math.sin(dLat/2), s2=Math.sin(dLng/2);
  const q=s1*s1+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*s2*s2;
  return Math.round((R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)))*100)/100;
}
function coordsDoRegistro(o){
  const lat=n(o.latitude ?? o.lat ?? o.latitudeEscola ?? o.coordLat, NaN);
  const lng=n(o.longitude ?? o.lng ?? o.lon ?? o.longitudeEscola ?? o.coordLng, NaN);
  if(Number.isFinite(lat)&&Number.isFinite(lng)) return {lat,lng};
  const c=CIDADES_COORDS[normalizarTexto(o.municipio||o.cidade||o.nomeMunicipio)];
  return c?{lat:c[0],lng:c[1]}:null;
}
function calcularDistancia(o){
  const coords=Array.isArray(o)?{lat:n(o[0]),lng:n(o[1])}:coordsDoRegistro(o||{});
  return coords?haversineKm(BASE_COORDS,coords):999;
}
function prioridadeRegiao(distanciaKm){ return n(distanciaKm,999)<=250?1:2; }
function cfg(dbRef){
  dbRef.config=dbRef.config||{};
  dbRef.config.buscadorEscola=dbRef.config.buscadorEscola||{};
  const c=dbRef.config.buscadorEscola;
  c.apiBase=c.apiBase||API_PADRAO;
  c.cidadeBase=c.cidadeBase||'Janaúba/MG';
  c.statusPadrao=c.statusPadrao||'NAEN';
  c.maxPaginas=c.maxPaginas||30;
  c.loginPath=c.loginPath||'/login';
  c.orcamentosPath=c.orcamentosPath||'/orcamentos';
  c.itensPath=c.itensPath||'/orcamentos/{id}/itens';
  c.salvarAposPaginas=c.salvarAposPaginas||1;
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
  st.logs.unshift({id:uidSafe('esc_log'),data:hoje(),tipo:txt(tipo)||'info',mensagem:txt(msg),detalhes:detalhes||null});
  if(st.logs.length>500) st.logs.length=500;
}
function idOrc(o){ return txt(o.id ?? o.orcamento_id ?? o.orcamentoId ?? o.numero_orcamento ?? o.numeroOrcamento ?? o.numero ?? o.codigo); }
function normalizarOrcamento(raw){
  const id=idOrc(raw)||uidSafe('esc_orc');
  const municipio=txt(raw.municipio ?? raw.nomeMunicipio ?? raw.cidade ?? raw.localidade);
  let distancia=n(raw.distancia_km ?? raw.distanciaKm, NaN);
  if(!Number.isFinite(distancia)) distancia=calcularDistancia({municipio,latitude:raw.latitude,longitude:raw.longitude});
  return {
    id,
    numero_orcamento:txt(raw.numero_orcamento ?? raw.numeroOrcamento ?? raw.numero ?? raw.codigo ?? id),
    nome_escola:txt(raw.nome_escola ?? raw.nomeEscola ?? raw.escola ?? raw.unidade ?? raw.nome)||'Escola não informada',
    municipio,
    data_fim:txt(raw.data_fim ?? raw.dataFim ?? raw.validade ?? raw.encerramento ?? raw.fim),
    valor_total:n(raw.valor_total ?? raw.valorTotal ?? raw.total,0),
    status:txt(raw.status ?? raw.situacao ?? 'NAEN'),
    distancia_km:distancia,
    prioridade_regiao:prioridadeRegiao(distancia),
    atualizadoEm:hoje(),
    origem:'api'
  };
}
function normalizarItem(raw,orcamentoId){
  const descricao=txt(raw.descricao ?? raw.itemDescricao ?? raw.nome ?? raw.produto ?? raw.material ?? raw.descricaoItem) || 'Item sem descrição';
  const tipo=txt(raw.tipo ?? raw.tipoItem ?? raw.categoria ?? raw.grupo ?? '');
  const idBudget=txt(raw.id_budget ?? raw.idBudget ?? raw.budget_id ?? raw.budgetId ?? raw.orcamento_id ?? raw.orcamentoId ?? raw.idOrcamento ?? orcamentoId);
  return {
    id:txt(raw.id ?? raw.item_id ?? raw.itemId ?? raw.codigo ?? raw.cod_item ?? `${idBudget}_${normalizarTexto(tipo||descricao).slice(0,24)}_${raw.quantidade||raw.qtd||1}`),
    orcamento_id:idBudget,
    id_budget:idBudget,
    tipo,
    descricao,
    quantidade:n(raw.quantidade ?? raw.qtd ?? raw.qtde ?? raw.quantidadeSolicitada,1),
    valor_unitario:n(raw.valor_unitario ?? raw.valorUnitario ?? raw.preco ?? raw.valor ?? raw.precoUnitario,0),
    unidade:txt(raw.unidade ?? raw.und ?? raw.unidadeMedida ?? '')
  };
}
function upsertOrcamento(dbRef,raw){
  const st=store(dbRef); const o=normalizarOrcamento(raw);
  const old=st.orcamentos.find(x=>String(x.id)===String(o.id));
  if(old) Object.assign(old,o); else st.orcamentos.push(o);
  return o;
}
function salvarItens(dbRef,orcamentoId,itensRaw){
  const st=store(dbRef); const id=txt(orcamentoId);
  st.itens=st.itens.filter(i=>String(i.orcamento_id)!==String(id));
  dbRef.escolaItens=st.itens;
  (Array.isArray(itensRaw)?itensRaw:[]).forEach(r=>st.itens.push(normalizarItem(r,id)));
  return st.itens.filter(i=>String(i.orcamento_id)===String(id)).length;
}
function limparInexistentes(dbRef,idsApi){
  const st=store(dbRef); const ids=new Set(Array.from(idsApi||[]).map(String));
  if(!ids.size) return 0;
  const remover=[];
  st.orcamentos.forEach(o=>{ if(o.origem==='api'&&!ids.has(String(o.id))) remover.push(o.id); });
  remover.forEach(id=>descartarOrcamento(dbRef,id,'Removido/expirado na API',true));
  return remover.length;
}
function descartarOrcamento(dbRef,orcamentoId,motivo,auto){
  const st=store(dbRef); const id=txt(orcamentoId);
  const m=txt(motivo)||'Descartado';
  if(!st.excluidos.find(e=>String(e.orcamento_id)===String(id))){
    st.excluidos.push({id:uidSafe('esc_exc'),orcamento_id:id,motivo:m,data_exclusao:hoje(),automatico:!!auto});
    logEscola(dbRef,auto?'limpeza':'descarte',`Orçamento ${id} descartado`,m);
  }
  return true;
}
function restaurarOrcamento(dbRef,orcamentoId){ const st=store(dbRef); dbRef.escolaExcluidos=st.excluidos.filter(e=>String(e.orcamento_id)!==String(orcamentoId)); return true; }
function pesquisarOrcamentos(dbRef,termoBusca){
  const termo=normalizarTexto(termoBusca); const st=store(dbRef); const excl=new Set(st.excluidos.map(e=>String(e.orcamento_id)));
  const out=[];
  st.orcamentos.forEach(o=>{
    if(excl.has(String(o.id))) return;
    const itens=st.itens.filter(i=>String(i.orcamento_id)===String(o.id));
    itens.forEach(i=>{
      if(termo && !normalizarTexto(`${i.descricao} ${i.tipo} ${i.unidade}`).includes(termo)) return;
      out.push({...o,item_descricao:i.descricao,item_tipo:i.tipo,quantidade:i.quantidade,valor_unitario:i.valor_unitario,item_id:i.id,prioridade_regiao:prioridadeRegiao(o.distancia_km)});
    });
    if(!itens.length && !termo) out.push({...o,item_descricao:'(sem itens baixados)',quantidade:0,valor_unitario:0,item_id:''});
  });
  out.sort((a,b)=>(a.prioridade_regiao-b.prioridade_regiao)||(n(a.distancia_km,999)-n(b.distancia_km,999))||String(a.data_fim).localeCompare(String(b.data_fim)));
  return out;
}
function excelHtml(linhas){
  const rows=(linhas||[]).map(r=>`<tr><td>${esc(r.nome_escola)}</td><td>${esc(r.municipio)}</td><td>${esc(r.distancia_km)}</td><td>${esc(dataBR(r.data_fim))}</td><td>${esc(r.item_tipo||'')}</td><td>${esc(r.item_descricao)}</td><td>${esc(r.quantidade)}</td><td>${esc(n(r.valor_unitario,0).toFixed(2).replace('.',','))}</td><td>${esc(r.numero_orcamento)}</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Arial;font-size:11pt}th{background:#1F4E78;color:#fff;font-weight:bold;text-align:center;border:1px solid #999;padding:6px}td{border:1px solid #ccc;padding:5px}tr:nth-child(even){background:#f3f6fb}</style></head><body><table><thead><tr><th>Escola</th><th>Município</th><th>Distância (km)</th><th>Data Fim</th><th>Tipo</th><th>Item Solicitado</th><th>Qtd</th><th>Valor Unit. (R$)</th><th>Orçamento</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}
function baixarExcel(linhas){
  const blob=new Blob(['\ufeff'+excelHtml(linhas)],{type:'application/vnd.ms-excel;charset=utf-8'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download='buscador_escola_'+new Date().toISOString().slice(0,10)+'.xls'; document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(url); a.remove();},1200);
}
function importarAntigos(dbRef){
  const mod=(dbRef.modulosDinamicos||{}); let totalO=0,totalI=0;
  Object.entries(mod).forEach(([nome,m])=>{
    if(!m||!Array.isArray(m.dados)) return;
    const nomeN=normalizarTexto(nome);
    if(!/(orc|escola|caixa)/.test(nomeN)) return;
    m.dados.slice(0,50000).forEach((r,idx)=>{
      const escola=r.NOME_ESCOLA||r.ESCOLA||r.NOME||r.UNIDADE_ESCOLAR;
      const desc=r.DESCRICAO||r.ITEM||r.PRODUTO||r.MATERIAL;
      const orcId=r.ORCAMENTO_ID||r.COD_ORCAMENTO||r.ID_ORCAMENTO||r.ID||r.CODIGO||r.NUMERO_ORCAMENTO||`${nome}_${idx}`;
      if(escola){ upsertOrcamento(dbRef,{id:orcId,numero_orcamento:r.NUMERO_ORCAMENTO||r.NUMERO||orcId,nome_escola:escola,municipio:r.MUNICIPIO||r.CIDADE,data_fim:r.DATA_FIM||r.VALIDADE,valor_total:r.VALOR_TOTAL||r.TOTAL,status:r.STATUS||r.SITUACAO||'NAEN',distancia_km:r.DISTANCIA_KM}); totalO++; }
      if(desc){ const st=store(dbRef); const item=normalizarItem({id:r.ITEM_ID||r.COD_ITEM||`${orcId}_${idx}`,id_budget:r.ID_BUDGET||r.ORCAMENTO_ID||orcId,tipo:r.TIPO||r.CATEGORIA,descricao:desc,quantidade:r.QUANTIDADE||r.QTD,valor_unitario:r.VALOR_UNITARIO||r.PRECO||r.VALOR},orcId); if(!st.itens.find(i=>String(i.id)===String(item.id))){ st.itens.push(item); totalI++; } }
    });
  });
  return {orcamentos:totalO,itens:totalI};
}

async function requestApi(method,url,body,token){
  if(window.caixaEscolarAPI&&typeof window.caixaEscolarAPI.request==='function') return window.caixaEscolarAPI.request({method,url,body,token});
  let lastErr=null;
  for(let tent=0; tent<3; tent++){
    try{
      const headers={'Content-Type':'application/json'}; if(token) headers.Authorization='Bearer '+token;
      const resp=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined});
      const text=await resp.text(); let data=null; try{data=text?JSON.parse(text):null;}catch(e){data=text;}
      if(resp.ok) return {ok:true,status:resp.status,data};
      if(![500,502,503,504].includes(resp.status)) return {ok:false,status:resp.status,error:(data&&data.message)||text||resp.statusText,data};
      lastErr=(data&&data.message)||text||resp.statusText;
    }catch(e){ lastErr=e.message||String(e); }
    await delay(800*(tent+1));
  }
  return {ok:false,error:lastErr||'Falha na comunicação'};
}
function listaConteudo(dados){
  if(Array.isArray(dados)) return dados;
  if(!dados||typeof dados!=='object') return [];
  return dados.content||dados.data||dados.items||dados.resultados||dados.results||dados.orcamentos||dados.itens||[];
}
function apiBase(c){ return (c.apiBase||API_PADRAO).replace(/\/$/,''); }
function urlPath(base,path){ return base + (String(path||'').startsWith('/')?'':'/') + String(path||''); }
function urlOrcamentos(c,pagina){
  const sep=String(c.orcamentosPath||'/orcamentos').includes('?')?'&':'?';
  return urlPath(apiBase(c),c.orcamentosPath||'/orcamentos') + sep + `status=${encodeURIComponent(c.statusPadrao||'NAEN')}&page=${pagina}`;
}
function urlItens(c,id){ return urlPath(apiBase(c),(c.itensPath||'/orcamentos/{id}/itens').replace('{id}',encodeURIComponent(id))); }

async function sincronizarAPI(){
  const s=sess(); if(!s) return;
  if(window.__buscadorEscolaSyncAtivo) return toastMsg('Sincronização já está em andamento. Aguarde terminar.','info');
  window.__buscadorEscolaSyncAtivo=true;
  const c=cfg(db); const senha=txt(document.getElementById('esc-senha')?.value||localStorage.getItem('digicopy_buscador_escola_senha_local')||'');
  const cnpj=txt(document.getElementById('esc-cnpj')?.value||c.cnpjCpf||'');
  try{
    if(!cnpj||!senha){ window.__buscadorEscolaSyncAtivo=false; return toastMsg('Informe CNPJ/CPF e senha para sincronizar','error'); }
    c.cnpjCpf=cnpj;
    c.apiBase=txt(document.getElementById('esc-api')?.value)||c.apiBase||API_PADRAO;
    c.statusPadrao=txt(document.getElementById('esc-status-api')?.value)||'NAEN';
    c.maxPaginas=Math.max(1,inteiro(document.getElementById('esc-max-pag')?.value,30));
    c.loginPath=txt(document.getElementById('esc-login-path')?.value)||c.loginPath||'/login';
    c.orcamentosPath=txt(document.getElementById('esc-orc-path')?.value)||c.orcamentosPath||'/orcamentos';
    c.itensPath=txt(document.getElementById('esc-itens-path')?.value)||c.itensPath||'/orcamentos/{id}/itens';
    try{ localStorage.setItem('digicopy_buscador_escola_senha_local',senha); }catch(e){}
    salvar(); renderBuscadorEscola('Sincronizando login...');
    logEscola(db,'sync','Iniciando sincronização',{api:c.apiBase,status:c.statusPadrao});
    const login=await requestApi('POST',urlPath(apiBase(c),c.loginPath),{cnpjCpf:cnpj,senha},null);
    if(!login.ok){ logEscola(db,'erro','Falha no login da API',login); renderBuscadorEscola('Falha no login: '+(login.error||login.status)); toastMsg('Falha na autenticação da API','error'); return; }
    const token=(login.data&&(login.data.token||login.data.access_token||login.data.accessToken||login.data.jwt))||login.token||'';
    if(!token){ logEscola(db,'erro','Login OK, mas token não veio na resposta',login.data); renderBuscadorEscola('Login OK, mas token não veio na resposta.'); return; }
    let pagina=1,total=0,totalItens=0,errosItens=0; const ids=new Set();
    while(pagina<=c.maxPaginas){
      renderBuscadorEscola(`Sincronizando página ${pagina}...`);
      const resp=await requestApi('GET',urlOrcamentos(c,pagina),null,token);
      if(!resp.ok){
        const msg=resp.status===404?'Rota de orçamentos não encontrada (404). Ajuste as rotas avançadas.':'Erro na página '+pagina+': '+(resp.error||resp.status);
        logEscola(db,'erro',msg,resp);
        renderBuscadorEscola(msg);
        break;
      }
      const content=listaConteudo(resp.data);
      if(!content.length) break;
      for(const raw of content){
        const o=upsertOrcamento(db,raw); ids.add(String(o.id)); total++;
        const rItens=await requestApi('GET',urlItens(c,o.id),null,token);
        if(rItens.ok){ totalItens+=salvarItens(db,o.id,listaConteudo(rItens.data)); }
        else { errosItens++; logEscola(db,'erro',`Erro ao baixar itens do orçamento ${o.id}`,rItens); }
        if(total%25===0){ salvar(); await delay(0); }
      }
      salvar();
      pagina++; await delay(0);
    }
    const limpos=limparInexistentes(db,ids); c.ultimoSyncEm=hoje(); c.ultimoSyncResumo={orcamentos:total,itens:totalItens,limpos,errosItens}; salvar();
    const fim=`Sincronização finalizada: ${total} orçamento(s), ${totalItens} item(ns), ${limpos} removido(s)/expirado(s), ${errosItens} erro(s) de item.`;
    logEscola(db,'sync',fim,c.ultimoSyncResumo);
    renderBuscadorEscola(fim);
    toastMsg('Buscador Escola sincronizado','success');
  }finally{
    window.__buscadorEscolaSyncAtivo=false;
  }
}

window.BUSCADOR_ESCOLA_PURE={normalizarTexto,haversineKm,calcularDistancia,prioridadeRegiao,normalizarOrcamento,normalizarItem,pesquisarOrcamentos,descartarOrcamento,restaurarOrcamento,excelHtml,importarAntigos};
window.escolaSincronizarAPI=sincronizarAPI;
window.escolaImportarAntigos=function(){ const r=importarAntigos(db); salvar(); renderBuscadorEscola(`Importação antiga: ${r.orcamentos} orçamento(s), ${r.itens} item(ns).`); toastMsg('Dados antigos importados para Buscador Escola','success'); };
window.escolaDescartar=function(id){ const motivo=prompt('Motivo para descartar este orçamento:','Não interessa / longe / produto fora do foco'); if(motivo===null) return; descartarOrcamento(db,id,motivo,false); salvar(); renderBuscadorEscola('Orçamento descartado.'); };
window.escolaRestaurar=function(id){ restaurarOrcamento(db,id); salvar(); renderBuscadorEscola('Orçamento restaurado.'); };
window.escolaExportarExcel=function(){ baixarExcel(window.__escolaResultados||pesquisarOrcamentos(db,document.getElementById('esc-busca')?.value||'')); };
window.escolaBuscar=function(){ window.__escolaTermo=txt(document.getElementById('esc-busca')?.value); window.__escolaLimite=300; renderBuscadorEscola(); };
window.escolaMais=function(){ window.__escolaLimite=(window.__escolaLimite||300)+300; renderBuscadorEscola(); };
window.escolaExemplos=function(){
  const base=[
    {id:'ex1',numero_orcamento:'1001',nome_escola:'Escola Estadual Exemplo Janaúba',municipio:'Janaúba',data_fim:'2026-08-30',valor_total:1200,status:'NAEN'},
    {id:'ex2',numero_orcamento:'1002',nome_escola:'Escola Municipal Norte Minas',municipio:'Jaíba',data_fim:'2026-08-28',valor_total:890,status:'NAEN'},
    {id:'ex3',numero_orcamento:'1003',nome_escola:'Escola Distante Exemplo',municipio:'Belo Horizonte',data_fim:'2026-09-02',valor_total:500,status:'NAEN',distancia_km:520}
  ];
  base.forEach(o=>upsertOrcamento(db,{...o,origem:'exemplo'}));
  salvarItens(db,'ex1',[{id:'ex1i1',descricao:'Cartucho de toner compatível',quantidade:4,valor_unitario:180},{id:'ex1i2',descricao:'Papel A4 caixa',quantidade:2,valor_unitario:220}]);
  salvarItens(db,'ex2',[{id:'ex2i1',descricao:'Recarga de toner',quantidade:6,valor_unitario:95}]);
  salvarItens(db,'ex3',[{id:'ex3i1',descricao:'Impressora multifuncional',quantidade:1,valor_unitario:1500}]);
  salvar(); renderBuscadorEscola('Exemplos carregados. Busque por toner, papel ou impressora.');
};

function renderBuscadorEscola(msg){
  const s=sess(); if(!s) return;
  const view=(typeof ensureView==='function'?ensureView('buscador-escola'):document.getElementById('view-buscador-escola'));
  if(!view) return;
  const c=cfg(db); const st=store(db); const termo=window.__escolaTermo||''; const resultados=pesquisarOrcamentos(db,termo); window.__escolaResultados=resultados;
  const limite=window.__escolaLimite||300; const rows=resultados.slice(0,limite);
  const resumo=`${st.orcamentos.length} orçamento(s) • ${st.itens.length} item(ns) • ${st.excluidos.length} descartado(s)`;
  view.innerHTML=`<div class="neo-shell"><div class="neo-panel"><div class="neo-head"><div><h3>Buscador Escola</h3><p>Busca orçamentos escolares por produto, distância e prioridade regional. Dados ficam dentro do ERP.</p></div><div class="neo-actions"><button onclick="escolaSincronizarAPI()" class="neo-btn primary"><i class="ph ph-cloud-arrow-down"></i>Sincronizar API</button><button onclick="escolaExportarExcel()" class="neo-btn"><i class="ph ph-file-xls"></i>Excel</button><button onclick="escolaExemplos()" class="neo-btn"><i class="ph ph-flask"></i>Exemplos</button></div></div><div class="p-4 border-b bg-white space-y-3"><div class="grid grid-cols-1 md:grid-cols-6 gap-2"><input id="esc-cnpj" value="${esc(c.cnpjCpf||'')}" placeholder="CNPJ/CPF da API" class="neo-input"><input id="esc-senha" type="password" value="${esc(localStorage.getItem('digicopy_buscador_escola_senha_local')||'')}" placeholder="Senha local" class="neo-input"><input id="esc-api" value="${esc(c.apiBase||API_PADRAO)}" placeholder="URL API" class="neo-input md:col-span-2"><input id="esc-status-api" value="${esc(c.statusPadrao||'NAEN')}" class="neo-input" title="Status na API"><input id="esc-max-pag" type="number" value="${esc(c.maxPaginas||30)}" class="neo-input" title="Máx. páginas"></div><details class="rounded-xl border bg-slate-50 p-3"><summary class="text-[12px] font-bold cursor-pointer">Rotas avançadas da API (usar se der 404)</summary><div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2"><input id="esc-login-path" value="${esc(c.loginPath||'/login')}" placeholder="/login" class="neo-input"><input id="esc-orc-path" value="${esc(c.orcamentosPath||'/orcamentos')}" placeholder="/orcamentos" class="neo-input"><input id="esc-itens-path" value="${esc(c.itensPath||'/orcamentos/{id}/itens')}" placeholder="/orcamentos/{id}/itens" class="neo-input"></div><p class="text-[11px] text-slate-500 mt-2">Os erros 404 do projeto antigo eram rotas inexistentes no Flask. Aqui o erro aparece na tela e você pode ajustar a rota sem mexer em código.</p></details><div class="flex flex-wrap gap-2 items-center"><input id="esc-busca" value="${esc(termo)}" onkeydown="if(event.key==='Enter')escolaBuscar()" placeholder="Buscar item: toner, papel, cartucho..." class="neo-input flex-1 min-w-[260px]"><button onclick="escolaBuscar()" class="neo-btn"><i class="ph ph-magnifying-glass"></i>Buscar</button><button onclick="escolaImportarAntigos()" class="neo-btn"><i class="ph ph-database"></i>Importar dados antigos</button><span class="text-[12px] text-slate-500 ml-auto">${esc(resumo)}</span></div>${msg?`<div class="rounded-xl bg-blue-50 border border-blue-200 p-2 text-[12px] text-blue-900">${esc(msg)}</div>`:''}<div class="text-[11px] text-slate-500">Senha fica somente neste computador. Não salvar credenciais no código. Sincronização é paginada e não trava a tela.</div></div><div class="overflow-auto max-h-[calc(100vh-330px)]"><table class="neo-table"><thead><tr><th>Prior.</th><th>Escola</th><th>Município</th><th>Dist.</th><th>Data fim</th><th>Tipo</th><th>Item</th><th>Qtd</th><th>Valor unit.</th><th>Ações</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.prioridade_regiao===1?'<span class="neo-status ok">Norte</span>':'<span class="neo-status wait">Longe</span>'}</td><td><b>${esc(r.nome_escola)}</b><br><span class="text-[11px] text-slate-500">Orç. ${esc(r.numero_orcamento||r.id)}</span></td><td>${esc(r.municipio||'-')}</td><td>${n(r.distancia_km,999)===999?'—':esc(r.distancia_km)+' km'}</td><td>${dataBR(r.data_fim)}</td><td>${esc(r.item_tipo||'-')}</td><td><b>${esc(r.item_descricao)}</b></td><td>${esc(r.quantidade)}</td><td>${money(r.valor_unitario)}</td><td><button onclick="escolaDescartar('${esc(r.id)}')" class="neo-btn !px-2" title="Descartar"><i class="ph ph-x-circle"></i></button></td></tr>`).join('')||'<tr><td colspan="10" class="text-center text-slate-400 py-10">Nenhum resultado. Clique em Exemplos ou Sincronizar API.</td></tr>'}</tbody></table>${resultados.length>rows.length?`<div class="p-3 text-center border-t bg-slate-50"><button onclick="escolaMais()" class="neo-btn primary">Mostrar mais</button></div>`:''}</div><div class="p-4 border-t bg-slate-50"><details><summary class="font-bold text-[12px] cursor-pointer">Orçamentos descartados (${st.excluidos.length})</summary><div class="mt-2 space-y-1">${st.excluidos.slice(-80).reverse().map(e=>`<div class="flex justify-between items-center rounded-lg bg-white border p-2 text-[12px]"><span><b>${esc(e.orcamento_id)}</b> — ${esc(e.motivo)} • ${dataBR(e.data_exclusao)}</span><button onclick="escolaRestaurar('${esc(e.orcamento_id)}')" class="neo-btn !h-8">Restaurar</button></div>`).join('')||'<p class="text-slate-400 text-[12px]">Nenhum descartado.</p>'}</div></details><details class="mt-3"><summary class="font-bold text-[12px] cursor-pointer">Log interno (${(st.logs||[]).length})</summary><div class="mt-2 space-y-1 max-h-[220px] overflow-auto">${(st.logs||[]).slice(0,120).map(l=>`<div class="rounded-lg bg-white border p-2 text-[11px]"><b>${esc(l.tipo)}</b> • ${dataBR(l.data)} — ${esc(l.mensagem)}${l.detalhes?`<pre class="mt-1 whitespace-pre-wrap text-[10px] text-slate-500">${esc(JSON.stringify(l.detalhes,null,2).slice(0,800))}</pre>`:''}</div>`).join('')||'<p class="text-slate-400 text-[12px]">Sem logs.</p>'}</div></details></div></div></div>`;
}
window.renderBuscadorEscola=renderBuscadorEscola;

if(typeof document==='undefined') return;

function instalarMenu(){
  const nav=document.getElementById('nav-gest'); if(!nav||document.querySelector('[data-nav="buscador-escola"]')) return;
  const btn=document.createElement('button'); btn.dataset.nav='buscador-escola'; btn.onclick=()=>navigateTo('buscador-escola'); btn.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white'; btn.innerHTML='<i class="ph ph-magnifying-glass text-[19px]"></i><span>Buscador Escola</span>';
  const config=nav.querySelector('[data-nav="config"]'); if(config) nav.insertBefore(btn,config); else nav.appendChild(btn);
}
const oldBuildNav=window.buildNav;
window.buildNav=function(){ const r=oldBuildNav?oldBuildNav.apply(this,arguments):undefined; setTimeout(instalarMenu,0); return r; };
const oldNavigate=window.navigateTo;
window.navigateTo=function(view){
  if(view==='buscador-escola'){
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    const el=typeof ensureView==='function'?ensureView('buscador-escola'):null; if(el) el.classList.remove('hidden');
    document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.remove('bg-white/[0.12]','text-white','border','border-white/10'); b.classList.add('text-white/60');});
    const act=document.querySelector('[data-nav="buscador-escola"]'); if(act){act.classList.add('bg-white/[0.12]','text-white','border','border-white/10');act.classList.remove('text-white/60');}
    if(typeof setPageHeader==='function') setPageHeader('Buscador Escola','Orçamentos escolares, busca por produto e distância');
    renderBuscadorEscola(); if(window.innerWidth<1024&&typeof toggleSidebar==='function') toggleSidebar(true); return;
  }
  return oldNavigate?oldNavigate.apply(this,arguments):undefined;
};
setTimeout(()=>{ instalarMenu(); },1200);
console.log('[DIGICOPY] buscador_escola_patch.js v4.9.55 carregado');
})();
