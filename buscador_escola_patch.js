// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.88 — Buscador Escola
// • Credenciais no código (sem campo de senha)
// • Layout no padrão do Sistema Digicopy
// • Autoatualização a cada 1 hora
// • Busca por termo, região e intervalo
// • Excel e Excluídos
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const API_BASE='https://api.caixaescolar.educacao.mg.gov.br';
const USUARIO='08.385.589/0001-03';
const SENHA='15901536De.';

function t(v){return String(v??'').trim()}
function esc(v){if(typeof escapeHtml==='function')return escapeHtml(v);return t(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function num(v,d=0){if(v===null||v===undefined||t(v)==='')return d;const x=Number(String(v).replace(',','.'));return Number.isFinite(x)?x:d}
function int(v,d=0){const x=parseInt(String(v??'').replace(/\D+/g,''),10);return Number.isFinite(x)?x:d}
function now(){return new Date().toISOString()}
function fData(v){return typeof fmtDate==='function'?fmtDate(v):t(v).slice(0,10)}
function fTime(v){return typeof fmtDateTime==='function'?fmtDateTime(v):t(v)}
function uid(p){return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}
function msg(m,c){if(typeof toast==='function')toast(m,c||'info')}
function save(){if(typeof saveDB==='function')saveDB()}
function wait(ms){return new Promise(r=>setTimeout(r,ms||0))}
function norm(v){return t(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/gi,'').toLowerCase().trim()}
function elapsed(v){const d=Date.parse(v||'');return Number.isFinite(d)?Date.now()-d:Infinity}
function fmtElapsed(ms){ms=Math.max(0,ms||0);const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h>0?`${h}h ${String(m).padStart(2,'0')}m`:`${m}m ${String(sec).padStart(2,'0')}s`}

const NORTE=new Set(['janauba','nova porteirinha','porteirinha','riacho dos machados','verdelandia','jaiba','mato verde','monte azul','espinosa','gameleiras','catuti','pai pedro','mamonas','serranopolis de minas','rio pardo de minas','indaiabira','ninheira','montezuma','santo antonio do retiro','vargem grande do rio pardo','sao joao do paraiso','taiobeiras','berizal','curral de dentro','rubelita','fruta de leite','novorizonte','salinas','santa cruz de salinas','aguas vermelhas','divisa alegre','padre carvalho','josenopolis','montes claros','bocaiuva','francisco sa','capitao eneas','sao joao da ponte','varzelandia','ibiracatu','japonvar','lontra','mirabela','juramento','glaucilandia','guaraciama','engenheiro navarro','claro dos pocoes','coracao de jesus','sao joao da lagoa','sao joao do pacui','patis','luislandia','brasilia de minas','ubai','sao francisco','pintopolis','icarai de minas','sao romao','santa fe de minas','pirapora','buritizeiro','varzea da palma','lassance','jequitai','ponto chique','ibiai','lagoa dos patos','riachinho','januaria','itacarambi','bonito de minas','conego marinho','pedras de maria da cruz','sao joao das missoes','manga','matias cardoso','montalvania','juvenilia','miravania','urucuia','grao mogol','cristalia','botumirim','itacambira']);
const PRIO=new Set(['janauba','porteirinha','pai pedro','mato verde','catuti','monte azul','gameleiras','espinosa','santo antonio do retiro','rio pardo de minas','verdelandia','jaiba','matias cardoso','manga','montalvania','capitao eneas','francisco sa']);
const GPS={janauba:[-15.8025,-43.3089],jaiba:[-15.3433,-43.6686],'montes claros':[-16.7282,-43.8578],porteirinha:[-15.7433,-43.0283],espinosa:[-14.9247,-42.8092],manga:[-14.7556,-43.9392],pirapora:[-17.345,-44.9419],bocaiuva:[-17.1078,-43.815],salinas:[-16.1703,-42.2903],januaria:[-15.4875,-44.3598]};

function dist(m){const c=GPS[norm(m)];if(!c)return 999;const R=6371,rad=x=>x*Math.PI/180,dLat=rad(c[0]+15.8025),dLng=rad(c[1]+43.3089),a=Math.sin(dLat/2)**2+Math.cos(rad(-15.8025))*Math.cos(rad(c[0]))*Math.sin(dLng/2)**2;return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))*10)/10}

function store(){db.escolaOrc= db.escolaOrc||[];db.escolaIt=db.escolaIt||[];db.escolaExc=db.escolaExc||[];return{orc:db.escolaOrc,it:db.escolaIt,exc:db.escolaExc}}

function normOrc(r){
  const m=t(r.countyName||r.county_name||r.municipio||'');
  return{id:t(r.idBudget||r.id||r.nuBudgetOrder),idBudget:t(r.idBudget||r.id),idSchool:t(r.idSchool),idSubprogram:t(r.idSubprogram),numero:t(r.nuBudgetOrder||r.idBudget||r.id),escola:t(r.schoolName||r.school_name)||'Escola',municipio:m,dist:dist(m),norte:NORTE.has(norm(m)),prio:PRIO.has(norm(m)),at:now()};
}
function normIt(r,oid){return{id:t(r.id||`${oid}_${r.txBudgetItemType||''}`),oid,tipo:t(r.txBudgetItemType||r.tipo),desc:t(r.txDescription||r.descricao)||'Item',qtd:num(r.quantidade,1),vlr:num(r.valor_unitario,0)}}

async function api(method,url,body,tk){
  if(window.caixaEscolarAPI&&typeof window.caixaEscolarAPI.request==='function')return window.caixaEscolarAPI.request({method,url,body,token:tk});
  for(let i=0;i<3;i++){try{const h={'Content-Type':'application/json'};if(tk)h.Authorization='Bearer '+tk;const r=await fetch(url,{method,headers:h,body:body?JSON.stringify(body):undefined,credentials:'include'});const txt=await r.text();let d=null;try{d=txt?JSON.parse(txt):null}catch(e){d=txt}if(r.ok)return{ok:true,data:d,cookies:[]};if(![429,500,502,503,504].includes(r.status))return{ok:false,error:(d&&d.message)||txt}}catch(e){}await wait(800*(i+1))}return{ok:false,error:'Falha na comunicação'};
}

async function sync(opt={}){
  if(window.__esSync)return{ok:false};window.__esSync=true;
  window.__esSt={msg:'Autenticando...',pct:5};render();
  try{
    if(opt.limpar){db.escolaOrc=[];db.escolaIt=[]}
    const login=await api('POST',API_BASE+'/auth/login',{txCpfCnpj:USUARIO.replace(/\D/g,''),txPassword:SENHA});
    if(!login.ok){window.__esSt={msg:'Falha no login',pct:0};render();return login}
    const tk=(login.data&&(login.data.token||login.data.access_token||login.data.accessToken||login.data.jwt))||'';
    let tot=0,totIt=0,err=0,pg=1;const ids=[];
    while(pg<=120){
      window.__esSt={msg:`Página ${pg}...`,pct:Math.min(95,10+pg)};if(pg%2===1)render();
      const u=new URL(API_BASE+'/budget-proposal/summary-by-supplier-profile');
      u.searchParams.set('filter.supplierStatus','$eq:NAEN');u.searchParams.set('page',String(pg));u.searchParams.set('limit','100');
      const r=await api('GET',u.toString(),null,tk);if(!r.ok){err++;break}
      const list=Array.isArray(r.data)?r.data:(r.data&&(r.data.data||r.data.content||r.data.items||r.data.results)||[]);
      if(!list.length)break;
      for(const raw of list){
        const o=normOrc(raw),st=store(),old=st.orc.find(x=>String(x.id)===String(o.id));
        if(old)Object.assign(old,o);else st.orc.push(o);
        ids.push(o.id);tot++;
        for(let ip=1;ip<=50;ip++){
          const p=new URL(API_BASE+'/budget-item/by-subprogram/'+encodeURIComponent(o.idSubprogram||'')+'/by-school/'+encodeURIComponent(o.idSchool||'')+'/by-budget/'+encodeURIComponent(o.idBudget||o.id||''));
          p.searchParams.set('page',String(ip));p.searchParams.set('limit','100');
          const ir=await api('GET',p.toString(),null,tk);if(!ir.ok){err++;break}
          const items=Array.isArray(ir.data)?ir.data:(ir.data&&(ir.data.data||ir.data.content||ir.data.items||ir.data.results)||[]);
          if(!items.length)break;
          const st2=store();st2.it=st2.it.filter(i=>String(i.oid)!==String(o.id));db.escolaIt=st2.it;
          items.forEach(r=>st2.it.push(normIt(r,o.id)));totIt+=items.length;
          if(items.length<100)break;await wait(0);
        }
        if(tot%25===0){save();await wait(0)}
      }
      pg++;save();await wait(0);
    }
    const idsSet=new Set(ids.map(String));
    db.escolaOrc=(db.escolaOrc||[]).filter(o=>idsSet.has(String(o.id)));
    db.config=db.config||{};db.config.escolaSync={at:now(),orc:tot,it:totIt,err};
    window.__esSt={msg:`✅ ${tot} orçamentos, ${totIt} itens`,pct:100};save();render();
    // Envia dados para a nuvem
    if(typeof syncEnviarParaNuvem==='function'){try{await syncEnviarParaNuvem({confirmar:false,forcar:true,automatico:true})}catch(e){}}
    return{ok:true,tot,totIt,err};
  }catch(e){window.__esSt={msg:'Erro: '+e.message,pct:0};render();return{ok:false,error:e.message}}
  finally{window.__esSync=false}
}

function search(term,reg){
  const st=store(),q=norm(term),exc=new Set(st.exc.map(e=>String(e.oid))),out=[];
  st.orc.forEach(o=>{
    if(exc.has(String(o.id)))return;if((reg==='2'||reg==='3')&&!NORTE.has(norm(o.municipio)))return;
    const its=st.it.filter(i=>String(i.oid)===String(o.id));
    const hit=its.filter(i=>!q||norm(`${i.tipo} ${i.desc}`).includes(q));
    if(q&&!hit.length)return;
    const tot=its.length,ext=Math.max(0,tot-hit.length),only=!!q&&tot>0&&ext===0;
    (hit.length?hit:[{tipo:'',desc:'(sem itens)',qtd:0,vlr:0,id:''}]).forEach(i=>out.push({...o,ipo:i.tipo,ides:i.desc,iqtd:i.qtd,ivlr:i.vlr,tot,found:hit.length,ext,only,hasExt:ext>0}));
  });
  out.sort((a,b)=>(a.only?0:1)-(b.only?0:1)||((reg==='3')?((a.prio?0:1)-(b.prio?0:1)):0)||(a.ext-b.ext)||(a.dist-b.dist));
  return out;
}

function badge(r){
  if(r.only)return'<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">SÓ PESQUISADO</span>';
  if(r.prio)return'<span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">PRIORITÁRIO</span>';
  if(r.norte)return'<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">NORTE</span>';
  return'<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">MG</span>';
}
function link(r){return r.numero?`https://caixaescolar.educacao.mg.gov.br/compras/orcamentos?budgetOrder=${encodeURIComponent(r.numero)}&status=NAEN`:'#'}
function card(r){
  return`<div class="rounded-[14px] border bg-white p-4 shadow-sm hover:shadow-md transition">
<div class="flex flex-wrap justify-between gap-3"><div><div class="flex items-center gap-2"><b class="px-2 py-1 rounded-lg bg-[#0a1e8a] text-white font-mono text-[11px]">${esc(r.numero||r.id)}</b>${badge(r)}</div>
<h4 class="mt-1 font-bold text-[14px]">${esc(r.escola)}</h4><p class="text-[11px] text-slate-500">${esc(r.municipio||'-')} • ${r.dist===999?'N/A':r.dist+' km'}</p></div>
<div class="flex gap-2"><a href="${esc(link(r))}" target="_blank" class="h-8 px-3 rounded-lg bg-white border text-[11px] font-bold flex items-center gap-1 hover:bg-slate-50"><i class="ph ph-arrow-square-out"></i>Abrir</a>
<button onclick="esExc('${esc(r.id)}')" class="h-8 px-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold flex items-center gap-1 hover:bg-red-100"><i class="ph ph-x-circle"></i></button></div></div>
${r.only?'<div class="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[11px] text-emerald-800 font-bold">✅ APENAS o produto pesquisado.</div>':''}
${r.hasExt?`<div class="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-900 font-bold">⚠️ ${r.ext} produto(s) extras.</div>`:''}
<div class="mt-2 grid grid-cols-4 gap-2 text-[11px]"><div class="rounded-lg bg-slate-50 p-2"><span class="text-[9px] uppercase font-bold text-slate-400">Achados/Total</span><br><b>${r.found}/${r.tot}</b></div>
<div class="rounded-lg bg-slate-50 p-2 col-span-3"><span class="text-[9px] uppercase font-bold text-slate-400">Produto</span><br><b>${esc(r.ipo||'')}</b> — ${esc(r.ides||'')}</div></div></div>`;
}

function proxTxt(c){
  if(window.__esSync)return'atualizando...';
  const u=c&&c.at;if(!u)return'aguardando';
  const f=60*60*1000-elapsed(u);return f<=0?'pronto':fmtElapsed(f);
}

function render(msg){
  const s=typeof getSession==='function'?getSession():null;if(!s)return;
  const v=typeof ensureView==='function'?ensureView('buscador-escola'):document.getElementById('view-buscador-escola');if(!v)return;
  const st=store(),c=(db.config&&db.config.escolaSync)||{};
  const term=window.__esTerm||'',reg=window.__esReg||'1',ini=window.__esIni||1,fim=window.__esFim||10;
  const res=search(term,reg);window.__esRes=res;const rows=res.slice(ini-1,fim);
  const sts=window.__esSt||{};

  v.innerHTML=`<div class="neo-shell"><div class="neo-panel">
<div class="neo-head"><div><h3>Buscador Escola</h3><p>Caixa Escolar MG • Atualização automática a cada 1 hora</p></div>
<div class="neo-actions"><button onclick="esExcTog()" class="neo-btn"><i class="ph ph-prohibit"></i>Excluídos</button>
<button onclick="esExcel()" class="neo-btn"><i class="ph ph-file-xls"></i>Excel</button></div></div>

<div class="p-4 border-b bg-white"><div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
<div class="neo-card"><p class="neo-label">Última atualização</p><div class="font-bold text-[13px]">${c.at?fTime(c.at):'Nunca'}</div></div>
<div class="neo-card"><p class="neo-label">Orçamentos</p><div class="neo-total">${st.orc.length}</div></div>
<div class="neo-card"><p class="neo-label">Itens</p><div class="neo-total">${st.it.length}</div></div>
<div class="neo-card"><p class="neo-label">Próxima</p><div class="font-bold text-[13px] text-emerald-700">${proxTxt(c)}</div></div></div>

<div class="flex flex-wrap gap-2 items-center">
<input id="es-term" value="${esc(term)}" onkeydown="if(event.key==='Enter')esSearch()" placeholder="toner, cartucho, papel..." class="flex-1 min-w-[180px] h-10 px-3 rounded-lg border text-[13px]">
<select id="es-reg" class="h-10 px-3 rounded-lg border text-[13px]"><option value="1" ${reg==='1'?'selected':''}>MG todo</option><option value="2" ${reg==='2'?'selected':''}>Norte de Minas</option><option value="3" ${reg==='3'?'selected':''}>Norte prioritário</option></select>
<input id="es-int" value="${ini}-${fim}" class="h-10 w-20 px-2 rounded-lg border text-[13px] text-center">
<button onclick="esSearch()" class="h-10 px-4 rounded-lg bg-[#0a1e8a] text-white font-bold text-[13px]"><i class="ph ph-magnifying-glass"></i></button>
<button onclick="esSync()" class="h-10 px-4 rounded-lg bg-white border font-bold text-[13px] flex items-center gap-1"><i class="ph ph-arrows-clockwise"></i>Atualizar</button>
<button onclick="esSyncTudo()" class="h-10 px-4 rounded-lg bg-red-50 border border-red-200 text-red-700 font-bold text-[13px] flex items-center gap-1"><i class="ph ph-arrow-counter-clockwise"></i>Baixar Tudo</button></div></div>

${sts.msg?`<div class="px-4 py-2 bg-blue-50 border-b text-[12px] text-blue-900">${esc(sts.msg)} ${sts.pct?`• ${sts.pct}%`:''}</div>`:''}

<div class="p-4 space-y-3 bg-slate-50/60 min-h-[400px]">
${window.__esExc?
  `<h4 class="font-bold text-[14px] mb-3">Excluídos</h4>${st.exc.length?st.exc.slice().reverse().map(e=>`<div class="rounded-xl border bg-white p-3 text-[12px] flex justify-between gap-3"><span><b>${esc(e.oid)}</b> — ${esc(e.mot)} • ${fData(e.dt)}</span><button onclick="esRest('${esc(e.oid)}')" class="h-8 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">Restaurar</button></div>`).join(''):'<p class="text-slate-400 text-[13px]">Nenhum.</p>'}`
  :
  `<div class="flex justify-between text-[12px] text-slate-500 mb-2"><span>${ini}-${Math.min(fim,res.length)} de ${res.length}</span><span>Enter/lupa</span></div>
  <div class="space-y-3">${rows.map(card).join('')||'<div class="text-center text-slate-400 py-16">Busque ou aguarde atualização.</div>'}</div>
  ${res.length>fim?'<div class="text-center mt-3"><button onclick="esMais()" class="h-10 px-6 rounded-lg bg-[#0a1e8a] text-white font-bold text-[13px]">Mais</button></div>':''}`
}</div></div></div>`;
}

window.esSync=function(){return sync({})};
window.esSyncTudo=function(){if(confirm('Baixar tudo limpa e recarrega. Continuar?'))return sync({limpar:true})};
window.esSearch=function(){window.__esTerm=t(document.getElementById('es-term')?.value);window.__esReg=t(document.getElementById('es-reg')?.value)||'1';const iv=t(document.getElementById('es-int')?.value)||'1-10';const p=iv.includes('-')?iv.split('-'):[iv,iv];window.__esIni=Math.max(1,int(p[0],1));window.__esFim=Math.max(window.__esIni,int(p[1],window.__esIni));render()};
window.esMais=function(){window.__esFim=(window.__esFim||10)+10;render()};
window.esExcel=function(){const rows=window.__esRes||search(window.__esTerm||'',window.__esReg||'1');const trs=rows.map(r=>`<tr><td>${esc(r.numero)}</td><td>${esc(r.escola)}</td><td>${esc(r.municipio)}</td><td>${r.dist===999?'N/A':r.dist}</td><td>${esc(r.only?'SIM':'')}</td><td>${r.ext||0}</td><td>${esc(r.ipo||'')}</td><td>${esc(r.ides)}</td></tr>`).join('');const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Arial}th{background:#0a1e8a;color:#fff;padding:6px}td{border:1px solid #ddd;padding:5px}</style></head><body><table><thead><tr><th>Código</th><th>Escola</th><th>Município</th><th>Distância</th><th>Só pesquisado</th><th>Extras</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody>${trs}</tbody></table></body></html>`;const b=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'});const a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download='buscador_'+new Date().toISOString().slice(0,10)+'.xls';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},1000)};
window.esExc=function(id){const m=prompt('Motivo:','Não interessa / longe');if(m===null)return;const st=store();if(!st.exc.find(e=>String(e.oid)===String(id)))st.exc.push({uid:uid('exc'),oid:String(id),mot:m||'Descartado',dt:now()});save();render('Excluído.')};
window.esRest=function(id){db.escolaExc=(db.escolaExc||[]).filter(e=>String(e.oid)!==String(id));save();render('Restaurado.')};
window.esExcTog=function(){window.__esExc=!window.__esExc;render()};
window.renderBuscadorEscola=render;

if(typeof document!=='undefined'){
  setTimeout(()=>{const c=(db.config&&db.config.escolaSync)||{};const st=store();const vazio=st.orc.length===0;if(!c.at||elapsed(c.at)>60*60*1000||vazio)sync({auto:true,limpar:vazio})},15000);
  setInterval(()=>{const c=(db.config&&db.config.escolaSync)||{};const st=store();const vazio=st.orc.length===0;if(elapsed(c.at)>60*60*1000||vazio)sync({auto:true,limpar:vazio})},60000);
}
console.log('[DIGICOPY] buscador_escola v1.0 carregado');
})();
