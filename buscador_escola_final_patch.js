// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.83 — Buscador Escola FINAL
// • Credenciais já no código (sem campo de digitar)
// • Sem botões de ocultar/esconder
// • Busca por termo, região e intervalo
// • Resultados em cards com prioridade
// • Excel e Excluídos
// • Autoatualização a cada 1 hora
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const VERSAO='4.9.83';
const USUARIO_API='08385589000103';
const SENHA_API='15901536De.';
const API_BASE='https://api.caixaescolar.educacao.mg.gov.br';

function txt(v){return String(v??'').trim()}
function esc(v){if(typeof escapeHtml==='function')return escapeHtml(v);return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function n(v,fb=0){if(v===null||v===undefined||String(v).trim()==='')return fb;const x=Number(String(v).replace(',','.'));return Number.isFinite(x)?x:fb}
function inteiro(v,fb=0){const x=parseInt(String(v??'').replace(/\D+/g,''),10);return Number.isFinite(x)?x:fb}
function agora(){return new Date().toISOString()}
function fmtData(v){return typeof fmtDate==='function'?fmtDate(v):txt(v).slice(0,10)}
function fmtHora(v){return typeof fmtDateTime==='function'?fmtDateTime(v):txt(v)}
function uidSafe(p){return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}
function toastMsg(m,t){if(typeof toast==='function')toast(m,t||'info')}
function salvar(){if(typeof saveDB==='function')saveDB()}
function delay(ms){return new Promise(r=>setTimeout(r,ms||0))}
function norm(v){return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/gi,'').toLowerCase().trim()}
function msDesde(v){const t=Date.parse(v||'');return Number.isFinite(t)?Date.now()-t:Infinity}

function formatarTempo(ms){
  ms=Math.max(0,ms||0);
  const total=Math.ceil(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
  if(h>0)return `${h}h ${String(m).padStart(2,'0')}m`;
  return `${m}m ${String(s).padStart(2,'0')}s`;
}

const MUNICIPIOS_NORTE=new Set(['janauba','nova porteirinha','porteirinha','riacho dos machados','verdelandia','jaiba','mato verde','monte azul','espinosa','gameleiras','catuti','pai pedro','mamonas','serranopolis de minas','rio pardo de minas','indaiabira','ninheira','montezuma','santo antonio do retiro','vargem grande do rio pardo','sao joao do paraiso','taiobeiras','berizal','curral de dentro','rubelita','fruta de leite','novorizonte','salinas','santa cruz de salinas','aguas vermelhas','divisa alegre','padre carvalho','josenopolis','montes claros','bocaiuva','francisco sa','capitao eneas','sao joao da ponte','varzelandia','ibiracatu','japonvar','lontra','mirabela','juramento','glaucilandia','guaraciama','engenheiro navarro','claro dos pocoes','coracao de jesus','sao joao da lagoa','sao joao do pacui','patis','luislandia','brasilia de minas','ubai','sao francisco','pintopolis','icarai de minas','sao romao','santa fe de minas','pirapora','buritizeiro','varzea da palma','lassance','jequitai','ponto chique','ibiai','lagoa dos patos','riachinho','januaria','itacarambi','bonito de minas','conego marinho','pedras de maria da cruz','sao joao das missoes','manga','matias cardoso','montalvania','juvenilia','miravania','urucuia','grao mogol','cristalia','botumirim','itacambira']);
const PRIORITARIAS=new Set(['janauba','porteirinha','pai pedro','mato verde','catuti','monte azul','gameleiras','espinosa','santo antonio do retiro','rio pardo de minas','verdelandia','jaiba','matias cardoso','manga','montalvania','capitao eneas','francisco sa']);
const COORDS={janauba:[-15.8025,-43.3089],jaiba:[-15.3433,-43.6686],'montes claros':[-16.7282,-43.8578],porteirinha:[-15.7433,-43.0283],espinosa:[-14.9247,-42.8092],manga:[-14.7556,-43.9392],pirapora:[-17.345,-44.9419],bocaiuva:[-17.1078,-43.815],salinas:[-16.1703,-42.2903],januaria:[-15.4875,-44.3598]};

function distKm(m){
  const c=COORDS[norm(m)];if(!c)return 999;
  const a={lat:-15.8025,lng:-43.3089},b={lat:c[0],lng:c[1]},R=6371,rad=x=>x*Math.PI/180;
  const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng),q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return Math.round((R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)))*10)/10;
}
function isNorte(m){return MUNICIPIOS_NORTE.has(norm(m))}
function isPrio(m){return PRIORITARIAS.has(norm(m))}

// ═══ STORE ═══
function getStore(){
  db.escolaOrcamentos=db.escolaOrcamentos||[];
  db.escolaItens=db.escolaItens||[];
  db.escolaExcluidos=db.escolaExcluidos||[];
  db.escolaLogs=db.escolaLogs||[];
  return {orc:db.escolaOrcamentos,itens:db.escolaItens,exc:db.escolaExcluidos,logs:db.escolaLogs};
}
function logBE(tipo,msg,det){const st=getStore();st.logs.unshift({id:uidSafe('log'),data:agora(),tipo,mensagem:msg,detalhes:det||null});if(st.logs.length>300)st.logs.length=300}

// ═══ NORMALIZAÇÃO ═══
function normOrc(raw){
  const mun=txt(raw.countyName||raw.county_name||raw.municipio||'');
  const dist=distKm(mun);
  return{id:txt(raw.idBudget||raw.id||raw.nuBudgetOrder),idBudget:txt(raw.idBudget||raw.id),idSchool:txt(raw.idSchool),idSubprogram:txt(raw.idSubprogram),numero_orcamento:txt(raw.nuBudgetOrder||raw.idBudget||raw.id),nome_escola:txt(raw.schoolName||raw.school_name)||'Escola',municipio:mun,distancia_km:dist,norte_minas:isNorte(mun),prioritario:isPrio(mun),atualizadoEm:agora()};
}
function normItem(raw,orcId){return{id:txt(raw.id||`${orcId}_${raw.txBudgetItemType||''}`),orcamento_id:orcId,tipo:txt(raw.txBudgetItemType||raw.tipo),descricao:txt(raw.txDescription||raw.descricao)||'Item',quantidade:n(raw.quantidade,1),valor_unitario:n(raw.valor_unitario,0)}}
function upsertOrc(raw){const st=getStore(),o=normOrc(raw);const old=st.orc.find(x=>String(x.id)===String(o.id));if(old)Object.assign(old,o);else st.orc.push(o);return o}
function salvarItens(orcId,rows){const st=getStore();st.itens=st.itens.filter(i=>String(i.orcamento_id)!==String(orcId));db.escolaItens=st.itens;(Array.isArray(rows)?rows:[]).forEach(r=>st.itens.push(normItem(r,orcId)));return st.itens.filter(i=>String(i.orcamento_id)===String(orcId)).length}

// ═══ API ═══
function listaItens(d){return Array.isArray(d)?d:(d&&typeof d==='object'?(d.data||d.content||d.items||d.results||[]):[])}
async function apiReq(method,url,body,auth){
  const a=auth||{};
  if(window.caixaEscolarAPI&&typeof window.caixaEscolarAPI.request==='function')return window.caixaEscolarAPI.request({method,url,body,token:a.token,cookie:a.cookie});
  for(let i=0;i<3;i++){
    try{const h={'Content-Type':'application/json'};if(a.token)h.Authorization='Bearer '+a.token;const r=await fetch(url,{method,headers:h,body:body?JSON.stringify(body):undefined,credentials:'include'});const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch(e){data=text}if(r.ok)return{ok:true,status:r.status,data,cookies:[]};const last=(data&&data.message)||text||r.statusText;if(![429,500,502,503,504].includes(r.status))return{ok:false,status:r.status,error:last,data}}catch(e){}
    await delay(800*(i+1));
  }
  return{ok:false,error:'Falha na comunicação'};
}

// ═══ SINCRONIZAÇÃO ═══
async function sincronizar(opt={}){
  if(window.__escolaSyncAtivo)return{ok:false,ocupado:true};
  window.__escolaSyncAtivo=true;
  window.__escolaStatus={msg:'Autenticando...',pct:5};
  renderBE();
  try{
    if(opt.limpar){db.escolaOrcamentos=[];db.escolaItens=[];logBE('limpeza','Base limpa')}
    const login=await apiReq('POST',API_BASE+'/auth/login',{txCpfCnpj:USUARIO_API,txPassword:SENHA_API},null);
    if(!login.ok){window.__escolaStatus={msg:'Falha no login da API',pct:0};renderBE();return login}
    const token=(login.data&&(login.data.token||login.data.access_token||login.data.accessToken||login.data.jwt))||'';
    const cookie=(login.cookies||[]).map(x=>String(x).split(';')[0]).filter(Boolean).join('; ');
    const auth={token,cookie};
    let total=0,totalItens=0,erros=0,pg=1;const ids=[];
    while(pg<=120){
      window.__escolaStatus={msg:`Página ${pg}...`,pct:Math.min(95,10+pg)};
      if((pg%2)===1)renderBE();
      const u=new URL(API_BASE+'/budget-proposal/summary-by-supplier-profile');
      u.searchParams.set('filter.supplierStatus','$eq:NAEN');
      u.searchParams.set('page',String(pg));
      u.searchParams.set('limit','100');
      const resp=await apiReq('GET',u.toString(),null,auth);
      if(!resp.ok){erros++;logBE('erro','Erro página '+pg,resp);break}
      const lista=listaItens(resp.data);
      if(!lista.length)break;
      for(const raw of lista){
        const o=upsertOrc(raw);ids.push(o.id);total++;
        for(let ip=1;ip<=50;ip++){
          const p2=new URL(API_BASE+'/budget-item/by-subprogram/'+encodeURIComponent(o.idSubprogram||'')+'/by-school/'+encodeURIComponent(o.idSchool||'')+'/by-budget/'+encodeURIComponent(o.idBudget||o.id||''));
          p2.searchParams.set('page',String(ip));p2.searchParams.set('limit','100');
          const ir=await apiReq('GET',p2.toString(),null,auth);
          if(!ir.ok){erros++;break}
          const itens=listaItens(ir.data);
          if(!itens.length)break;
          totalItens+=salvarItens(o.id,itens);
          if(itens.length<100)break;
          await delay(0);
        }
        if((total%25)===0){salvar();await delay(0)}
      }
      pg++;salvar();await delay(0);
    }
    // Limpar sumidos
    const idsApi=new Set(ids.map(String));let limpos=0;
    (db.escolaOrcamentos||[]).forEach(o=>{if(o.origem!=='api')return;if(!idsApi.has(String(o.id))){if(!db.escolaExcluidos.find(e=>String(e.orcamento_id)===String(o.id))){db.escolaExcluidos.push({id:uidSafe('exc'),orcamento_id:String(o.id),motivo:'Removido da API',data_exclusao:agora(),automatico:true})}limpos++}});
    db.escolaOrcamentos=(db.escolaOrcamentos||[]).filter(o=>idsApi.has(String(o.id))||o.origem!=='api');
    db.config=db.config||{};db.config.buscadorEscola=db.config.buscadorEscola||{};
    db.config.buscadorEscola.ultimoSyncEm=agora();
    db.config.buscadorEscola.ultimoSyncResumo={orc:total,itens:totalItens,limpos,erros};
    window.__escolaStatus={msg:`✅ ${total} orçamentos, ${totalItens} itens, ${erros} erro(s)`,pct:100};
    salvar();logBE('sync','Sincronização OK',{total,totalItens,erros,limpos});
    renderBE();
    return{ok:true,total,totalItens,erros,limpos};
  }catch(e){
    window.__escolaStatus={msg:'Erro: '+(e.message||e),pct:0};
    renderBE();return{ok:false,error:e.message||String(e)};
  }finally{window.__escolaSyncAtivo=false}
}

// ═══ PESQUISA ═══
function pesquisar(termo,regiao){
  const st=getStore(),q=norm(termo),exc=new Set(st.exc.map(e=>String(e.orcamento_id))),out=[];
  st.orc.forEach(o=>{
    if(exc.has(String(o.id)))return;
    if((regiao==='2'||regiao==='3')&&!isNorte(o.municipio))return;
    const itens=st.itens.filter(i=>String(i.orcamento_id)===String(o.id));
    const ach=itens.filter(i=>!q||norm(`${i.tipo} ${i.descricao}`).includes(q));
    if(q&&!ach.length)return;
    const total=itens.length,extras=Math.max(0,total-ach.length),apenas=!!q&&total>0&&extras===0;
    (ach.length?ach:[{tipo:'',descricao:'(sem itens)',quantidade:0,valor_unitario:0,id:''}]).forEach(i=>out.push({...o,item_tipo:i.tipo,item_desc:i.descricao,item_qtd:i.quantidade,item_vlr:i.valor_unitario,total_prod:total,found:ach.length,extras,apenas,tem_extras:extras>0}));
  });
  out.sort((a,b)=>(a.apenas?0:1)-(b.apenas?0:1)||((regiao==='3')?((a.prioritario?0:1)-(b.prioritario?0:1)):0)||(a.extras-b.extras)||(a.distancia_km-b.distancia_km));
  return out;
}

// ═══ EXCEL ═══
function excel(rows){
  const trs=(rows||[]).map(r=>`<tr><td>${esc(r.numero_orcamento)}</td><td>${esc(r.nome_escola)}</td><td>${esc(r.municipio)}</td><td>${r.distancia_km===999?'N/A':r.distancia_km}</td><td>${esc(r.apenas?'SIM':'')}</td><td>${r.extras||0}</td><td>${esc(r.item_tipo||'')}</td><td>${esc(r.item_desc)}</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Arial}th{background:#0a1e8a;color:#fff;padding:6px}td{border:1px solid #ddd;padding:5px}</style></head><body><table><thead><tr><th>Código</th><th>Escola</th><th>Município</th><th>Distância</th><th>Só pesquisado</th><th>Extras</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody>${trs}</tbody></table></body></html>`;
}

// ═══ RENDER ═══
function badge(r){
  if(r.apenas)return '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">SÓ PESQUISADO</span>';
  if(r.prioritario)return '<span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">PRIORITÁRIO</span>';
  if(r.norte_minas)return '<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">NORTE</span>';
  return '<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">MG</span>';
}
function linkOrc(r){return r.numero_orcamento?`https://caixaescolar.educacao.mg.gov.br/compras/orcamentos?budgetOrder=${encodeURIComponent(r.numero_orcamento)}&status=NAEN`:'#'}
function card(r){
  return `<div class="rounded-[16px] border bg-white p-4 shadow-sm hover:shadow-md transition">
    <div class="flex flex-wrap justify-between gap-3">
      <div>
        <div class="flex flex-wrap items-center gap-2"><b class="px-2.5 py-1 rounded-lg bg-[#0a1e8a] text-white font-mono text-[12px]">${esc(r.numero_orcamento||r.id)}</b>${badge(r)}</div>
        <h4 class="mt-2 font-bold text-[15px]">${esc(r.nome_escola)}</h4>
        <p class="text-[12px] text-slate-500">${esc(r.municipio||'-')} • ${r.distancia_km===999?'N/A':r.distancia_km+' km de Janaúba'}</p>
      </div>
      <div class="flex gap-2">
        <a href="${esc(linkOrc(r))}" target="_blank" class="h-9 px-3 rounded-lg bg-white border text-[12px] font-bold flex items-center gap-1 hover:bg-slate-50"><i class="ph ph-arrow-square-out"></i>Abrir</a>
        <button onclick="escolaExcluir('${esc(r.id)}')" class="h-9 px-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px] font-bold flex items-center gap-1 hover:bg-red-100"><i class="ph ph-x-circle"></i>Excluir</button>
      </div>
    </div>
    ${r.apenas?'<div class="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-[12px] text-emerald-800 font-bold">✅ Este orçamento contém APENAS o produto pesquisado.</div>':''}
    ${r.tem_extras?`<div class="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-2 text-[12px] text-amber-900 font-bold">⚠️ Contém ${r.extras} produto(s) além do pesquisado.</div>`:''}
    <div class="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-[12px]">
      <div class="rounded-xl bg-slate-50 p-2"><span class="text-[10px] uppercase font-bold text-slate-400">Encontrados/Total</span><br><b>${r.found}/${r.total_prod}</b></div>
      <div class="rounded-xl bg-slate-50 p-2 md:col-span-3"><span class="text-[10px] uppercase font-bold text-slate-400">Produto</span><br><b>${esc(r.item_tipo||'')}</b> — <span class="text-slate-600">${esc(r.item_desc||'')}</span></div>
    </div>
  </div>`;
}

function tempoProx(c){
  if(window.__escolaSyncAtivo)return 'atualizando agora';
  const u=txt(c&&c.ultimoSyncEm);
  if(!u)return 'primeira carga pendente';
  const falta=60*60*1000-msDesde(u);
  return falta<=0?'pronto para atualizar':formatarTempo(falta);
}

function renderBE(msg){
  const s=typeof getSession==='function'?getSession():null;if(!s)return;
  const view=typeof ensureView==='function'?ensureView('buscador-escola'):document.getElementById('view-buscador-escola');if(!view)return;
  const st=getStore();
  const c=(db.config&&db.config.buscadorEscola)||{};
  const termo=window.__escolaTermo||'';
  const regiao=window.__escolaRegiao||'1';
  const ini=window.__escolaIni||1;
  const fim=window.__escolaFim||10;
  const resultados=pesquisar(termo,regiao);
  window.__escolaResultados=resultados;
  const rows=resultados.slice(ini-1,fim);
  const sts=window.__escolaStatus||{};

  view.innerHTML=`<div class="space-y-4 p-4 lg:p-6">
    <!-- HEADER -->
    <div class="rounded-[20px] bg-gradient-to-r from-[#0a1e8a] to-[#142ecc] text-white p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h2 class="text-[20px] font-extrabold">Buscador Escola</h2>
        <p class="text-white/70 text-[12px] mt-1">Caixa Escolar MG • Login automático • Atualização a cada 1 hora</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button onclick="escolaSync()" class="h-10 px-4 rounded-xl bg-white text-[#0a1e8a] font-bold text-[12px] hover:bg-white/90 flex items-center gap-2"><i class="ph ph-arrows-clockwise"></i>Atualizar</button>
        <button onclick="escolaExcToggle()" class="h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-[12px] flex items-center gap-2"><i class="ph ph-prohibit"></i>Excluídos</button>
        <button onclick="escolaExcel()" class="h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-[12px] flex items-center gap-2"><i class="ph ph-file-xls"></i>Excel</button>
      </div>
    </div>

    <!-- CARDS RESUMO -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="rounded-xl bg-white border p-3"><p class="text-[10px] uppercase font-bold text-slate-400">Última atualização</p><p class="font-bold text-[13px]">${c.ultimoSyncEm?fmtHora(c.ultimoSyncEm):'Nunca'}</p></div>
      <div class="rounded-xl bg-white border p-3"><p class="text-[10px] uppercase font-bold text-slate-400">Orçamentos</p><p class="font-extrabold text-[22px] text-[#0a1e8a]">${st.orc.length}</p></div>
      <div class="rounded-xl bg-white border p-3"><p class="text-[10px] uppercase font-bold text-slate-400">Itens</p><p class="font-extrabold text-[22px] text-[#0a1e8a]">${st.itens.length}</p></div>
      <div class="rounded-xl bg-white border p-3"><p class="text-[10px] uppercase font-bold text-slate-400">Próxima atualização</p><p class="font-bold text-[13px] text-emerald-700">${tempoProx(c)}</p></div>
    </div>

    <!-- BUSCA -->
    <div class="rounded-xl bg-white border p-4 flex flex-wrap gap-3 items-center">
      <input id="be-termo" value="${esc(termo)}" onkeydown="if(event.key==='Enter')escolaBuscar()" placeholder="Ex.: toner, cartucho, papel..." class="flex-1 min-w-[200px] h-10 px-3 rounded-lg border text-[13px]">
      <select id="be-regiao" class="h-10 px-3 rounded-lg border text-[13px]">
        <option value="1" ${regiao==='1'?'selected':''}>MG todo</option>
        <option value="2" ${regiao==='2'?'selected':''}>Norte de Minas</option>
        <option value="3" ${regiao==='3'?'selected':''}>Norte prioritário</option>
      </select>
      <input id="be-intervalo" value="${ini}-${fim}" class="h-10 w-24 px-3 rounded-lg border text-[13px] text-center">
      <button onclick="escolaBuscar()" class="h-10 px-5 rounded-lg bg-[#0a1e8a] text-white font-bold text-[13px]"><i class="ph ph-magnifying-glass"></i> Pesquisar</button>
    </div>

    ${sts.msg?`<div class="rounded-xl bg-blue-50 border border-blue-200 p-3 text-[12px] text-blue-900">${esc(sts.msg)} ${sts.pct?`• ${sts.pct}%`:''}</div>`:''}

    <!-- RESULTADOS -->
    ${window.__escolaMostrarExc?
      `<h3 class="font-bold text-[15px]">Orçamentos excluídos</h3>
       ${st.exc.length?st.exc.slice().reverse().map(e=>`<div class="rounded-xl border bg-white p-3 text-[12px] flex justify-between gap-3"><span><b>${esc(e.orcamento_id)}</b> — ${esc(e.motivo)} • ${fmtData(e.data_exclusao)}</span><button onclick="escolaRestaurar('${esc(e.orcamento_id)}')" class="h-8 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">Restaurar</button></div>`).join(''):'<p class="text-slate-400 text-[13px]">Nenhum excluído.</p>'}`
      :
      `<div class="flex justify-between text-[12px] text-slate-500 mb-2"><span>Resultados ${ini}-${Math.min(fim,resultados.length)} de ${resultados.length}</span><span>Enter/lupa para buscar</span></div>
       <div class="space-y-3">${rows.map(card).join('')||'<div class="text-center text-slate-400 py-16">Faça uma busca ou aguarde a atualização automática.</div>'}</div>
       ${resultados.length>fim?'<div class="text-center mt-4"><button onclick="escolaMais()" class="h-10 px-6 rounded-lg bg-[#0a1e8a] text-white font-bold text-[13px]">Mostrar mais</button></div>':''}`
    }
  </div>`;

  const r=document.getElementById('be-regiao');if(r)r.value=regiao;
}

// ═══ AÇÕES GLOBAIS ═══
window.escolaSync=function(){return sincronizar({})};
window.escolaSyncTudo=function(){if(confirm('Baixar tudo limpa e recarrega. Continuar?'))return sincronizar({limpar:true})};
window.escolaBuscar=function(){
  window.__escolaTermo=txt(document.getElementById('be-termo')?.value);
  window.__escolaRegiao=txt(document.getElementById('be-regiao')?.value)||'1';
  const iv=txt(document.getElementById('be-intervalo')?.value)||'1-10';
  const p=iv.includes('-')?iv.split('-'):[iv,iv];
  window.__escolaIni=Math.max(1,inteiro(p[0],1));
  window.__escolaFim=Math.max(window.__escolaIni,inteiro(p[1],window.__escolaIni));
  renderBE();
};
window.escolaMais=function(){window.__escolaFim=(window.__escolaFim||10)+10;renderBE()};
window.escolaExcel=function(){
  const rows=window.__escolaResultados||pesquisar(window.__escolaTermo||'',window.__escolaRegiao||'1');
  const blob=new Blob(['\ufeff'+excel(rows)],{type:'application/vnd.ms-excel;charset=utf-8'});
  const a=document.createElement('a'),url=URL.createObjectURL(blob);
  a.href=url;a.download='buscador_escola_'+new Date().toISOString().slice(0,10)+'.xls';
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1000);
};
window.escolaExcluir=function(id){
  const motivo=prompt('Motivo:','Não interessa / longe / fora do foco');
  if(motivo===null)return;
  const st=getStore();
  if(!st.exc.find(e=>String(e.orcamento_id)===String(id))){
    st.exc.push({id:uidSafe('exc'),orcamento_id:String(id),motivo:motivo||'Descartado',data_exclusao:agora()});
  }
  salvar();renderBE('Orçamento excluído.');
};
window.escolaRestaurar=function(id){
  db.escolaExcluidos=(db.escolaExcluidos||[]).filter(e=>String(e.orcamento_id)!==String(id));
  salvar();renderBE('Orçamento restaurado.');
};
window.escolaExcToggle=function(){
  window.__escolaMostrarExc=!window.__escolaMostrarExc;
  renderBE();
};

window.renderBuscadorEscola=renderBE;

// Auto sync a cada 1 hora
if(typeof document!=='undefined'){
  setTimeout(()=>{const c=(db.config&&db.config.buscadorEscola)||{};if(!txt(c.ultimoSyncEm)||msDesde(c.ultimoSyncEm)>60*60*1000)sincronizar({automatico:true})},10000);
  setInterval(()=>{const c=(db.config&&db.config.buscadorEscola)||{};if(msDesde(c.ultimoSyncEm)>60*60*1000)sincronizar({automatico:true})},60000);
}

console.log('[DIGICOPY] buscador_escola_final_patch.js v'+VERSAO+' carregado');
})();
