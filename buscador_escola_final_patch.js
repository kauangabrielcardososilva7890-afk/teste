// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.79 — Buscador Escola final
// • Busca local com atualização automática
// • Credenciais carregadas da nuvem (Firebase) automaticamente
// • Sem área de login na tela — login configurado externamente
// • Sem busca avançada
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function n(v,fb=0){ if(v===null||v===undefined||String(v).trim()==='') return fb; const x=Number(String(v).replace(',','.')); return Number.isFinite(x)?x:fb; }
function inteiro(v,fb=0){ const x=parseInt(String(v ?? '').replace(/\D+/g,''),10); return Number.isFinite(x)?x:fb; }
function agora(){ return new Date().toISOString(); }
function fmtData(v){ return typeof fmtDate==='function'?fmtDate(v):txt(v).slice(0,10); }
function fmtHora(v){ return typeof fmtDateTime==='function'?fmtDateTime(v):txt(v); }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function delay(ms){ return new Promise(r=>setTimeout(r,ms||0)); }
function norm(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/gi,'').toLowerCase().trim(); }
function msDesde(v){ const t=Date.parse(v||''); return Number.isFinite(t)?Date.now()-t:Infinity; }
function formatarTempo(ms){
  ms=Math.max(0,ms||0);
  const total=Math.ceil(ms/1000), h=Math.floor(total/3600), m=Math.floor((total%3600)/60), s=total%60;
  if(h>0) return `${h}h ${String(m).padStart(2,'0')}m`;
  return `${m}m ${String(s).padStart(2,'0')}s`;
}
function proximaAtualizacaoTexto(c){
  if(!credOk(c)) return 'aguardando login da nuvem';
  if(window.__buscadorEscolaSyncAtivo) return 'atualizando agora';
  if(!c.ultimoSyncEm) return 'primeira carga pendente';
  const intervalo=Math.max(5,c.intervaloMinutos||60)*60*1000;
  const falta=intervalo-msDesde(c.ultimoSyncEm);
  return falta<=0?'pronto para atualizar':formatarTempo(falta);
}

const API_PADRAO='https://api.caixaescolar.educacao.mg.gov.br';
const P=(window.BUSCADOR_ESCOLA_PURE||{});
const MUNICIPIOS_NORTE_MINAS=new Set(['janauba','nova porteirinha','porteirinha','riacho dos machados','verdelandia','jaiba','mato verde','monte azul','espinosa','gameleiras','catuti','pai pedro','mamonas','serranopolis de minas','rio pardo de minas','indaiabira','ninheira','montezuma','santo antonio do retiro','vargem grande do rio pardo','sao joao do paraiso','taiobeiras','berizal','curral de dentro','rubelita','fruta de leite','novorizonte','salinas','santa cruz de salinas','aguas vermelhas','divisa alegre','padre carvalho','josenopolis','montes claros','bocaiuva','francisco sa','capitao eneas','sao joao da ponte','varzelandia','ibiracatu','japonvar','lontra','mirabela','juramento','glaucilandia','guaraciama','engenheiro navarro','claro dos pocoes','coracao de jesus','sao joao da lagoa','sao joao do pacui','patis','luislandia','brasilia de minas','ubai','sao francisco','pintopolis','icarai de minas','sao romao','santa fe de minas','pirapora','buritizeiro','varzea da palma','lassance','jequitai','ponto chique','ibiai','lagoa dos patos','riachinho','januaria','itacarambi','bonito de minas','conego marinho','pedras de maria da cruz','sao joao das missoes','manga','matias cardoso','montalvania','juvenilia','miravania','urucuia','grao mogol','cristalia','botumirim','itacambira']);
const CIDADES_PRIORITARIAS=new Set(['janauba','porteirinha','pai pedro','mato verde','catuti','monte azul','gameleiras','espinosa','santo antonio do retiro','rio pardo de minas','verdelandia','jaiba','matias cardoso','manga','montalvania','capitao eneas','francisco sa']);
const COORDS={janauba:[-15.8025,-43.3089],jaiba:[-15.3433,-43.6686],'montes claros':[-16.7282,-43.8578],porteirinha:[-15.7433,-43.0283],espinosa:[-14.9247,-42.8092],manga:[-14.7556,-43.9392],pirapora:[-17.345,-44.9419],bocaiuva:[-17.1078,-43.815],salinas:[-16.1703,-42.2903],januaria:[-15.4875,-44.3598]};

function cfgFinal(dbRef){
  dbRef.config=dbRef.config||{}; dbRef.config.buscadorEscola=dbRef.config.buscadorEscola||{};
  const c=dbRef.config.buscadorEscola;
  c.apiBase=c.apiBase||API_PADRAO;
  c.loginPath=c.loginPath||'/auth/login';
  c.orcamentosPath=c.orcamentosPath||'/budget-proposal/summary-by-supplier-profile';
  c.itensPath=c.itensPath||'/budget-item/by-subprogram/{idSubprogram}/by-school/{idSchool}/by-budget/{idBudget}';
  c.statusPadrao=c.statusPadrao||'NAEN'; c.limit=c.limit||100; c.maxPaginas=c.maxPaginas||120;
  c.autoSync=c.autoSync!==false; c.intervaloMinutos=c.intervaloMinutos||60;
  c.credenciais=c.credenciais||{usuario:'',senha:''};
  c.layoutFinal=true;
  return c;
}
function storeFinal(dbRef){ dbRef.escolaOrcamentos=dbRef.escolaOrcamentos||[]; dbRef.escolaItens=dbRef.escolaItens||[]; dbRef.escolaExcluidos=dbRef.escolaExcluidos||[]; dbRef.escolaLogs=dbRef.escolaLogs||[]; return {orcamentos:dbRef.escolaOrcamentos,itens:dbRef.escolaItens,excluidos:dbRef.escolaExcluidos,logs:dbRef.escolaLogs}; }
function logFinal(tipo,msg,detalhes){ const st=storeFinal(db); st.logs.unshift({id:uidSafe('esc_log'),data:agora(),tipo,mensagem:msg,detalhes:detalhes||null}); if(st.logs.length>500) st.logs.length=500; }
function isNorte(m){ return MUNICIPIOS_NORTE_MINAS.has(norm(m)); }
function isPrioritario(m){ return CIDADES_PRIORITARIAS.has(norm(m)); }
function distancia(o){
  if(P.calcularDistancia) return P.calcularDistancia(o);
  const c=COORDS[norm(o.municipio||o.countyName||o.county_name||'')]; if(!c) return 999;
  const a={lat:-15.8025,lng:-43.3089}, b={lat:c[0],lng:c[1]}, R=6371, rad=x=>x*Math.PI/180;
  const dLat=rad(b.lat-a.lat), dLng=rad(b.lng-a.lng), q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return Math.round((R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)))*10)/10;
}
function normalizarOrc(raw){
  const base=P.normalizarOrcamento?P.normalizarOrcamento(raw):{};
  const municipio=txt(base.municipio||raw.countyName||raw.county_name||raw.municipio||'');
  const dist=n(base.distancia_km,distancia({municipio}));
  return {...base,id:txt(base.id||raw.idBudget||raw.id||raw.nuBudgetOrder),idBudget:txt(base.idBudget||raw.idBudget||raw.id),idSchool:txt(base.idSchool||raw.idSchool),idSubprogram:txt(base.idSubprogram||raw.idSubprogram),numero_orcamento:txt(base.numero_orcamento||raw.nuBudgetOrder||raw.numero)||txt(raw.idBudget||raw.id),nome_escola:txt(base.nome_escola||raw.schoolName||raw.school_name)||'Escola não informada',municipio,distancia_km:dist,norte_minas:isNorte(municipio),prioritario:isPrioritario(municipio),prioridade_regiao:(isPrioritario(municipio)||isNorte(municipio)||dist<=250)?1:2,atualizadoEm:agora(),origem:'api'};
}
function normalizarItem(raw,orcId){ return P.normalizarItem?P.normalizarItem(raw,orcId):{id:txt(raw.id||`${orcId}_${raw.txBudgetItemType||raw.tipo||''}`),orcamento_id:orcId,tipo:txt(raw.txBudgetItemType||raw.tipo),descricao:txt(raw.txDescription||raw.descricao)||'Item sem descrição',quantidade:n(raw.quantidade,1),valor_unitario:n(raw.valor_unitario,0)}; }
function upsertOrc(raw){ const st=storeFinal(db), o=normalizarOrc(raw); const old=st.orcamentos.find(x=>String(x.id)===String(o.id)); if(old) Object.assign(old,o); else st.orcamentos.push(o); return o; }
function salvarItens(orcId,rows){ const st=storeFinal(db); st.itens=st.itens.filter(i=>String(i.orcamento_id)!==String(orcId)); db.escolaItens=st.itens; (Array.isArray(rows)?rows:[]).forEach(r=>st.itens.push(normalizarItem(r,orcId))); return st.itens.filter(i=>String(i.orcamento_id)===String(orcId)).length; }
function listaConteudo(d){ return P.listaConteudo?P.listaConteudo(d):(Array.isArray(d)?d:(d&&typeof d==='object'?(d.data||d.content||d.items||[]):[])); }
function apiBase(c){ return (c.apiBase||API_PADRAO).replace(/\/$/,''); }
function pathUrl(base,path){ return base+(String(path||'').startsWith('/')?'':'/')+String(path||''); }
function urlOrc(c,page){ const u=new URL(pathUrl(apiBase(c),c.orcamentosPath)); u.searchParams.set('filter.supplierStatus',`$eq:${c.statusPadrao||'NAEN'}`); u.searchParams.set('page',String(page)); u.searchParams.set('limit',String(c.limit||100)); return u.toString(); }
function urlItem(c,o,page){ const path=c.itensPath.replace('{idSubprogram}',encodeURIComponent(o.idSubprogram||'')).replace('{idSchool}',encodeURIComponent(o.idSchool||'')).replace('{idBudget}',encodeURIComponent(o.idBudget||o.id||'')); const u=new URL(pathUrl(apiBase(c),path)); u.searchParams.set('page',String(page)); u.searchParams.set('limit',String(c.limit||100)); return u.toString(); }
async function requestApi(method,url,body,auth){
  const a=auth||{};
  if(window.caixaEscolarAPI&&typeof window.caixaEscolarAPI.request==='function') return window.caixaEscolarAPI.request({method,url,body,token:a.token,cookie:a.cookie});
  let last='';
  for(let i=0;i<3;i++){
    try{ const h={'Content-Type':'application/json'}; if(a.token) h.Authorization='Bearer '+a.token; const r=await fetch(url,{method,headers:h,body:body?JSON.stringify(body):undefined,credentials:'include'}); const text=await r.text(); let data=null; try{data=text?JSON.parse(text):null;}catch(e){data=text;} if(r.ok) return {ok:true,status:r.status,data,cookies:[]}; last=(data&&data.message)||text||r.statusText; if(![429,500,502,503,504].includes(r.status)) return {ok:false,status:r.status,error:last,data}; }catch(e){ last=e.message||String(e); }
    await delay(800*(i+1));
  }
  return {ok:false,error:last||'Falha na comunicação'};
}
async function baixarItens(c,o,auth){ let total=0; for(let p=1;p<=50;p++){ const r=await requestApi('GET',urlItem(c,o,p),null,auth); if(!r.ok) return {ok:false,total,error:r}; const itens=listaConteudo(r.data); if(!itens.length) break; total+=salvarItens(o.id,itens); if(itens.length<(c.limit||100)) break; await delay(0); } return {ok:true,total}; }
function pesquisarFinal(termo,regiao){
  const st=storeFinal(db), q=norm(termo), excl=new Set(st.excluidos.map(e=>String(e.orcamento_id))), out=[];
  st.orcamentos.forEach(o=>{
    if(excl.has(String(o.id))) return; if((regiao==='2'||regiao==='3')&&!isNorte(o.municipio)) return;
    const itens=st.itens.filter(i=>String(i.orcamento_id)===String(o.id)); const achados=itens.filter(i=>!q||norm(`${i.tipo} ${i.descricao}`).includes(q)); if(q&&!achados.length) return;
    const total=itens.length, extras=Math.max(0,total-achados.length), apenas=!!q&&total>0&&extras===0;
    (achados.length?achados:[{tipo:'',descricao:'(sem itens baixados)',quantidade:0,valor_unitario:0,id:''}]).forEach(i=>out.push({...o,item_tipo:i.tipo,item_descricao:i.descricao,quantidade:i.quantidade,valor_unitario:i.valor_unitario,item_id:i.id,total_produtos:total,produtos_encontrados:achados.length,quantidade_produtos_extras:extras,apenas_pesquisado:apenas,tem_produtos_extras:extras>0}));
  });
  const priorApp=regiao==='1'||regiao==='3';
  out.sort((a,b)=>(a.apenas_pesquisado?0:1)-(b.apenas_pesquisado?0:1)||(priorApp?((a.prioritario?0:1)-(b.prioritario?0:1)):0)||(a.quantidade_produtos_extras-b.quantidade_produtos_extras)||n(a.distancia_km,999)-n(b.distancia_km,999));
  return out;
}
function excelHtmlFinal(rows){ const trs=(rows||[]).map(r=>`<tr><td>${esc(r.numero_orcamento)}</td><td>${esc(r.nome_escola)}</td><td>${esc(r.municipio)}</td><td>${esc(r.distancia_km===999?'N/A':r.distancia_km)}</td><td>${esc(r.apenas_pesquisado?'SIM':'')}</td><td>${esc(r.quantidade_produtos_extras||0)}</td><td>${esc(r.item_tipo||'')}</td><td>${esc(r.item_descricao)}</td></tr>`).join(''); return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Arial}th{background:#0a1e8a;color:#fff;padding:6px}td{border:1px solid #ddd;padding:5px}</style></head><body><table><thead><tr><th>Código</th><th>Escola</th><th>Município</th><th>Distância</th><th>Só pesquisado</th><th>Extras</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody>${trs}</tbody></table></body></html>`; }
function baixarExcelFinal(){ const rows=window.__escolaResultados||pesquisarFinal(window.__escolaTermo||'',window.__escolaRegiao||'1'); const blob=new Blob(['\ufeff'+excelHtmlFinal(rows)],{type:'application/vnd.ms-excel;charset=utf-8'}); const a=document.createElement('a'), url=URL.createObjectURL(blob); a.href=url; a.download='buscador_escola_'+new Date().toISOString().slice(0,10)+'.xls'; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1000); }
function descartarFinal(id,motivo,auto){ const st=storeFinal(db); if(!st.excluidos.find(e=>String(e.orcamento_id)===String(id))){ st.excluidos.push({id:uidSafe('esc_exc'),orcamento_id:String(id),motivo:motivo||'Descartado',data_exclusao:agora(),automatico:!!auto}); logFinal(auto?'limpeza':'descarte',`Orçamento ${id} descartado`,motivo); } }
function restaurarFinal(id){ db.escolaExcluidos=(db.escolaExcluidos||[]).filter(e=>String(e.orcamento_id)!==String(id)); logFinal('restaurar',`Orçamento ${id} restaurado`); }
function limparSumidos(ids){ const idsApi=new Set(Array.from(ids).map(String)); let c=0; (db.escolaOrcamentos||[]).forEach(o=>{ if(o.origem==='api'&&!idsApi.has(String(o.id))){ descartarFinal(o.id,'Removido/expirado na API',true); c++; } }); return c; }
function credOk(c){ return !!(txt(c.credenciais&&c.credenciais.usuario)&&txt(c.credenciais&&c.credenciais.senha)); }
function deveAutoSync(c){ if(!c.autoSync||!credOk(c)) return false; if(window.__buscadorEscolaSyncAtivo) return false; const vazio=!(db.escolaOrcamentos||[]).length; return vazio||msDesde(c.ultimoSyncEm)>=Math.max(5,c.intervaloMinutos||60)*60*1000; }

// ═══════════════════════════════════════════════════
// CARREGAR CREDENCIAIS DA NUVEM (Firebase REST API)
// ═══════════════════════════════════════════════════
async function carregarCredenciaisDaNuvem(){
  try{
    // Usa fireGetDoc do firebase_client.js para ler direto do Firestore
    if(typeof fireGetDoc==='function'){
      const doc=await fireGetDoc('buscador_credenciais');
      if(doc&&doc.fields){
        const f=doc.fields;
        const usuario=f.usuario?.stringValue||'';
        const senha=f.senha?.stringValue||'';
        if(usuario&&senha) return {usuario,senha,carregadoEm:agora()};
      }
    }
    // Fallback: fetch direto com auth anônima
    const API_KEY=window.FIREBASE_CONFIG?.apiKey||'AIzaSyAEsHFZWRNiwMypSRU1azBj66p8g0FTi8U';
    const PROJECT=window.FIREBASE_CONFIG?.projectId||'digicopy-sistema-nuvem';
    const url='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/app_state/buscador_credenciais?key='+API_KEY;
    const r=await fetch(url);
    if(r.ok){
      const doc=await r.json();
      const f=doc.fields||{};
      const usuario=f.usuario?.stringValue||'';
      const senha=f.senha?.stringValue||'';
      if(usuario&&senha) return {usuario,senha,carregadoEm:agora()};
    }
  }catch(e){ console.warn('[BUSCADOR] carregar credenciais:',e); }
  return null;
}

async function sincronizarFinal(opt={}){
  const c=cfgFinal(db); if(window.__buscadorEscolaSyncAtivo) return {ok:false,ocupado:true};
  // Tenta carregar credenciais da nuvem se não tiver local
  if(!credOk(c)){
    const nuvem=await carregarCredenciaisDaNuvem();
    if(nuvem){ c.credenciais={usuario:nuvem.usuario,senha:nuvem.senha}; c.credenciaisCarregadasDaNuvem=nuvem.carregadoEm; salvar(); }
  }
  if(!credOk(c)){ if(!opt.automatico) toastMsg('Login do Buscador não encontrado na nuvem. Configure pelo site de credenciais.','error'); renderBuscadorEscolaFinal('Login não encontrado na nuvem.'); return {ok:false,semCredencial:true}; }
  window.__buscadorEscolaSyncAtivo=true; window.__buscadorStatus={msg:'Autenticando...',progresso:5}; renderBuscadorEscolaFinal();
  try{
    if(opt.limpar){ db.escolaOrcamentos=[]; db.escolaItens=[]; logFinal('limpeza','Baixar tudo: base local do Buscador limpa'); }
    const login=await requestApi('POST',pathUrl(apiBase(c),c.loginPath),{txCpfCnpj:txt(c.credenciais.usuario).replace(/\D/g,''),txPassword:c.credenciais.senha},null);
    if(!login.ok){ logFinal('erro','Falha no login da API',login); window.__buscadorStatus={msg:'Falha no login da API',progresso:0}; renderBuscadorEscolaFinal(); return login; }
    const token=(login.data&&(login.data.token||login.data.access_token||login.data.accessToken||login.data.jwt))||''; const cookie=(login.cookies||[]).map(x=>String(x).split(';')[0]).filter(Boolean).join('; '); const auth={token,cookie};
    let total=0,totalItens=0,erros=0,pagina=1; const ids=[];
    while(pagina<=c.maxPaginas){
      window.__buscadorStatus={msg:`Baixando página ${pagina}...`,progresso:Math.min(95,10+pagina)}; if((pagina%2)===1) renderBuscadorEscolaFinal();
      const resp=await requestApi('GET',urlOrc(c,pagina),null,auth); if(!resp.ok){ erros++; logFinal('erro','Erro ao baixar orçamentos página '+pagina,resp); break; }
      const lista=listaConteudo(resp.data); if(!lista.length) break;
      for(const raw of lista){ const o=upsertOrc(raw); ids.push(o.id); total++; const it=await baixarItens(c,o,auth); if(it.ok) totalItens+=it.total; else { erros++; logFinal('erro','Erro ao baixar itens '+o.id,it.error); } if((total%25)===0){ salvar(); await delay(0); } }
      pagina++; salvar(); await delay(0);
    }
    const limpos=limparSumidos(ids); c.ultimoSyncEm=agora(); c.ultimoSyncResumo={orcamentos:total,itens:totalItens,limpos,erros}; window.__buscadorStatus={msg:`Atualizado: ${total} orçamento(s), ${totalItens} item(ns), ${erros} erro(s).`,progresso:100}; salvar(); logFinal('sync','Sincronização concluída',c.ultimoSyncResumo);
    if(typeof window.syncEnviarParaNuvem==='function'){ try{ await window.syncEnviarParaNuvem({confirmar:false,forcar:true,automatico:true}); }catch(e){ logFinal('aviso','Não consegui publicar Buscador na nuvem agora',String(e&&e.message||e)); } }
    renderBuscadorEscolaFinal(); return {ok:true,total,totalItens,erros,limpos};
  }finally{ window.__buscadorEscolaSyncAtivo=false; }
}

window.escolaSincronizarAPI=function(){ return sincronizarFinal({automatico:false}); };
window.escolaSincronizarTudo=function(){ if(confirm('Baixar tudo limpa orçamentos/itens do Buscador e baixa novamente. Continuar?')) return sincronizarFinal({limpar:true,automatico:false}); };
window.escolaBuscar=function(){ window.__escolaTermo=txt(document.getElementById('be-termo')?.value); window.__escolaRegiao=txt(document.getElementById('be-regiao')?.value)||'1'; const iv=txt(document.getElementById('be-intervalo')?.value)||'1-10'; const p=iv.includes('-')?iv.split('-'):[iv,iv]; window.__escolaInicio=Math.max(1,inteiro(p[0],1)); window.__escolaFim=Math.max(window.__escolaInicio,inteiro(p[1],window.__escolaInicio)); renderBuscadorEscolaFinal(); };
window.escolaMais=function(){ window.__escolaFim=(window.__escolaFim||10)+10; renderBuscadorEscolaFinal(); };
window.escolaExportarExcel=baixarExcelFinal;
window.escolaDescartar=function(id){ const motivo=prompt('Motivo da exclusão:', 'Não interessa / longe / produto fora do foco'); if(motivo===null) return; descartarFinal(id,motivo,false); salvar(); renderBuscadorEscolaFinal('Orçamento excluído do buscador.'); };
window.escolaRestaurar=function(id){ restaurarFinal(id); salvar(); renderBuscadorEscolaFinal('Orçamento restaurado.'); };
window.escolaExcluidosToggle=function(){ window.__escolaMostrarExcluidos=!window.__escolaMostrarExcluidos; renderBuscadorEscolaFinal(); };
window.escolaAutoSyncTick=function(){ const c=cfgFinal(db); if(deveAutoSync(c)) return sincronizarFinal({automatico:true,limpar:!(db.escolaOrcamentos||[]).length}); return null; };

function badge(r){ if(r.apenas_pesquisado) return '<span class="neo-status ok">Só pesquisado</span>'; if(r.prioritario) return '<span class="neo-status info">Prioritário</span>'; if(r.norte_minas) return '<span class="neo-status ok">Norte</span>'; return '<span class="neo-status wait">MG</span>'; }
function linkOrc(r){ return r.numero_orcamento?`https://caixaescolar.educacao.mg.gov.br/compras/orcamentos?budgetOrder=${encodeURIComponent(r.numero_orcamento)}&status=${encodeURIComponent(r.status||'NAEN')}`:'#'; }
function renderCard(r){ return `<div class="rounded-[16px] border bg-white p-4 shadow-sm"><div class="flex flex-wrap justify-between gap-3"><div><div class="flex flex-wrap items-center gap-2"><b class="px-2.5 py-1 rounded-lg bg-[#0a1e8a] text-white font-mono text-[12px]">${esc(r.numero_orcamento||r.id)}</b>${badge(r)}</div><h4 class="mt-2 font-bold text-[15px]">${esc(r.nome_escola)}</h4><p class="text-[12px] text-slate-500">${esc(r.municipio||'-')} • ${r.distancia_km===999?'Distância N/A':esc(r.distancia_km)+' km de Janaúba'}</p></div><div class="flex gap-2"><a href="${esc(linkOrc(r))}" target="_blank" class="neo-btn !h-9"><i class="ph ph-arrow-square-out"></i>Abrir</a><button onclick="escolaDescartar('${esc(r.id)}')" class="neo-btn danger !h-9"><i class="ph ph-x-circle"></i>Excluir</button></div></div>${r.apenas_pesquisado?'<div class="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-[12px] text-emerald-800 font-bold">✅ Este orçamento contém APENAS o produto pesquisado.</div>':''}${r.tem_produtos_extras?`<div class="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-2 text-[12px] text-amber-900 font-bold">⚠️ Contém ${r.quantidade_produtos_extras} produto(s) adicional(is) além do pesquisado.</div>`:''}<div class="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-[12px]"><div class="rounded-xl bg-slate-50 p-2"><span class="neo-label">Encontrados / total</span><br><b>${r.produtos_encontrados}/${r.total_produtos}</b></div><div class="rounded-xl bg-slate-50 p-2 md:col-span-3"><span class="neo-label">Produto pesquisado</span><br><b>${esc(r.item_tipo||'Sem tipo')}</b><br><span class="text-slate-600">${esc(r.item_descricao||'')}</span></div></div></div>`; }

function renderBuscadorEscolaFinal(msg){
  const s=typeof getSession==='function'?getSession():null; if(!s) return; const view=typeof ensureView==='function'?ensureView('buscador-escola'):document.getElementById('view-buscador-escola'); if(!view) return;
  const c=cfgFinal(db), st=storeFinal(db), termo=window.__escolaTermo||'', regiao=window.__escolaRegiao||'1', inicio=window.__escolaInicio||1, fim=window.__escolaFim||10;
  const resultados=pesquisarFinal(termo,regiao); window.__escolaResultados=resultados; const rows=resultados.slice(inicio-1,fim); const status=window.__buscadorStatus||{};
  const credsOk=credOk(c);
  view.innerHTML=`<div class="neo-shell"><div class="neo-panel"><div class="neo-head"><div><h3>Buscador Escola</h3><p>Busca local com atualização automática. Login carregado da nuvem.</p></div><div class="neo-actions"><button onclick="escolaExcluidosToggle()" class="neo-btn"><i class="ph ph-prohibit"></i>Excluídos</button><button onclick="escolaExportarExcel()" class="neo-btn"><i class="ph ph-file-xls"></i>Excel</button></div></div><div class="p-4 border-b bg-white space-y-3"><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><div class="neo-card"><p class="neo-label">Última atualização</p><div class="font-bold text-[13px]">${c.ultimoSyncEm?fmtHora(c.ultimoSyncEm):'Nunca'}</div></div><div class="neo-card"><p class="neo-label">Orçamentos</p><div class="neo-total">${st.orcamentos.length}</div></div><div class="neo-card"><p class="neo-label">Itens</p><div class="neo-total">${st.itens.length}</div></div><div class="neo-card"><p class="neo-label">Status</p><div class="font-bold text-[13px] ${credsOk?'text-emerald-700':'text-amber-700'}">${credsOk?'Login OK':'Aguardando login'}</div><div class="text-[11px] text-slate-500 mt-1">Próxima: <b>${esc(proximaAtualizacaoTexto(c))}</b></div></div></div>${!credsOk?'<div class="rounded-xl border bg-amber-50 p-3 text-[12px] text-amber-900">⚠️ Login do Buscador não encontrado. Configure pelo site de credenciais e aguarde a sincronização.</div>':''}<div class="grid grid-cols-1 md:grid-cols-10 gap-2 items-center"><input id="be-termo" value="${esc(termo)}" onkeydown="if(event.key==='Enter')escolaBuscar()" placeholder="Ex.: toner, cartucho, papel..." class="neo-input md:col-span-5"><select id="be-regiao" class="neo-select md:col-span-2"><option value="1" ${regiao==='1'?'selected':''}>MG todo</option><option value="2" ${regiao==='2'?'selected':''}>Norte de Minas</option><option value="3" ${regiao==='3'?'selected':''}>Norte prioritário</option></select><input id="be-intervalo" value="${inicio}-${fim}" class="neo-input md:col-span-1"><button onclick="escolaBuscar()" class="neo-btn primary md:col-span-1"><i class="ph ph-magnifying-glass"></i>Pesquisar</button><button onclick="escolaSincronizarAPI()" class="neo-btn md:col-span-1"><i class="ph ph-arrows-clockwise"></i>Atualizar</button></div>${msg||status.msg?`<div class="rounded-xl bg-blue-50 border border-blue-200 p-2 text-[12px] text-blue-900">${esc(msg||status.msg)} ${status.progresso?`• ${status.progresso}%`:''}</div>`:''}</div><div class="p-4 space-y-3 bg-slate-50/60 min-h-[420px]">${window.__escolaMostrarExcluidos?`<h4 class="font-bold text-[14px]">Orçamentos excluídos</h4>${st.excluidos.slice().reverse().map(e=>`<div class="rounded-xl border bg-white p-3 text-[12px] flex justify-between gap-3"><span><b>${esc(e.orcamento_id)}</b> — ${esc(e.motivo)} • ${fmtData(e.data_exclusao)}</span><button onclick="escolaRestaurar('${esc(e.orcamento_id)}')" class="neo-btn !h-8">Ativar</button></div>`).join('')||'<p class="text-slate-400 text-[13px]">Nenhum excluído.</p>'}`:`<div class="flex justify-between text-[12px] text-slate-500"><span>Resultados ${inicio}-${Math.min(fim,resultados.length)} de ${resultados.length}</span><span>Busca local • Enter/lupa</span></div>${rows.map(renderCard).join('')||'<div class="text-center text-slate-400 py-16">Faça uma busca para começar ou aguarde a atualização automática.</div>'}${resultados.length>fim?'<div class="text-center"><button onclick="escolaMais()" class="neo-btn primary">Mostrar mais</button></div>':''}`}</div></div></div>`;
  const r=document.getElementById('be-regiao'); if(r) r.value=regiao;
}
window.renderBuscadorEscola=renderBuscadorEscolaFinal;
if(typeof document!=='undefined'){
  setTimeout(()=>{ window.escolaAutoSyncTick(); },8000);
  setInterval(()=>{ window.escolaAutoSyncTick(); },60000);
}
console.log('[DIGICOPY] buscador_escola_final_patch.js v4.9.79 carregado');
})();
