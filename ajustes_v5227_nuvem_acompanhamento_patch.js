// DIGICOPY v5.22.7 — acompanhamento dos dados dos outros PCs (só Admin)
(function(){
'use strict';
if(typeof document==='undefined')return;

const ENT={
  clientes:'Clientes',produtos:'Produtos',vendas:'Vendas',contratos:'Contratos',
  leituras:'Leituras',os:'Chamados',equipamentos:'Impressoras',parque:'Parque',
  contasReceber:'A receber',contasPagar:'A pagar',usuarios:'Usuários',
  empresas:'Empresa',logs:'Auditoria',tecnicos:'Técnicos',
  notificacoes:'Avisos',config:'Configuração',modulosDinamicos:'Módulos'
};
function esc(value){
  return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function when(ts){
  const n=Number(ts);if(!n)return 'nunca';
  try{return new Date(n).toLocaleString('pt-BR');}catch(e){return 'nunca';}
}
function entityName(key){return ENT[key]||key;}
function opName(op){return op==='delete'?'excluiu':'enviou';}
function labelFromData(entity,data,recordId){
  if(entity==='config')return 'Configuração';
  const src=data&&typeof data==='object'?data:{};
  const raw=src.nome||src.fantasia||src.numero||src.login||src.descricao||src.sku||src.modelo||'';
  const text=String(raw).trim();
  return text?text.slice(0,80):String(recordId||'');
}

function renderWatch(target,devices,events,currentId,filterId){
  const list=Array.isArray(devices)?devices:[];
  const feed=Array.isArray(events)?events:[];
  const cards=list.map(d=>{
    const mine=d.id===currentId;
    const parts=Object.entries(d.byEntity||{}).filter(([,n])=>Number(n)>0)
      .sort((a,b)=>Number(b[1])-Number(a[1]))
      .map(([k,n])=>esc(entityName(k))+': <b>'+Number(n)+'</b>');
    const last=d.lastChangeAt
      ? (opName(d.lastOperation)+' '+(entityName(d.lastEntity)||'dado')+' em '+when(d.lastChangeAt))
      : 'ainda não enviou alteração';
    return '<div style="border:1px solid '+(d.revokedAt?'#fecaca':'#e2e8f0')+';border-radius:12px;padding:11px;margin-top:8px;background:'+(d.revokedAt?'#fffafa':'#fff')+'">'+
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">'+
      '<div><b>'+esc(d.name)+'</b>'+(mine?' <small style="color:#0a1e8a">este PC</small>':'')+
      '<small style="display:block;color:#64748b">'+(d.role==='admin'?'Administrador':'Autorizado')+(d.revokedAt?' • BLOQUEADO':'')+'</small></div>'+
      '<button class="dc-watch-filter" data-id="'+esc(d.id)+'" style="padding:5px 9px;border-radius:8px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:800;font-size:11px">Ver movimentos</button></div>'+
      '<small style="display:block;color:#475569;margin-top:6px">Último acesso: '+esc(when(d.lastSeenAt))+'</small>'+
      '<small style="display:block;color:#475569">Último envio: '+esc(last)+'</small>'+
      '<small style="display:block;color:#64748b;margin-top:4px">'+Number(d.activeRecords||0)+' registros atuais • '+Number(d.totalChanges||0)+' alterações</small>'+
      (parts.length?'<div style="margin-top:7px;font-size:11px;color:#334155">'+parts.join(' • ')+'</div>':'')+
      '</div>';
  }).join('')||'<div style="padding:10px;color:#64748b">Nenhum aparelho.</div>';
  const shown=filterId?feed.filter(x=>x.deviceId===filterId):feed;
  const filterName=(list.find(d=>d.id===filterId)||{}).name;
  const lines=shown.map(ev=>{
    return '<div style="padding:8px 0;border-bottom:1px solid #f1f5f9">'+
      '<b style="font-size:12px">'+esc(ev.deviceName||'Aparelho')+'</b> '+opName(ev.operation)+
      ' <b>'+esc(entityName(ev.entity))+'</b> — '+esc(ev.label||ev.recordId)+
      '<small style="display:block;color:#94a3b8">'+esc(when(ev.createdAt))+'</small></div>';
  }).join('')||'<div style="padding:8px;color:#64748b">Nenhum movimento recente.</div>';
  target.innerHTML='<h3 style="font-size:14px;font-weight:900;margin:4px 0 6px">Acompanhamento dos PCs</h3>'+
    '<p style="font-size:12px;color:#64748b;margin:0 0 8px">Só o administrador vê isto. Os outros logins não abrem a nuvem.</p>'+
    cards+
    '<h4 style="font-size:13px;font-weight:900;margin:14px 0 6px">Movimentos recentes'+(filterName?' — '+esc(filterName):'')+'</h4>'+
    (filterId?'<button id="dc-watch-all" style="margin-bottom:8px;padding:5px 9px;border-radius:8px;border:1px solid #cbd5e1;background:white;font-weight:800;font-size:11px">Ver todos</button>':'')+
    '<div style="max-height:280px;overflow:auto">'+lines+'</div>';
}

async function openWatch(target,filterId){
  const api=window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.api;
  if(!api){target.innerHTML='<div style="color:#991b1b">API da nuvem não carregada.</div>';return;}
  target.innerHTML='<div style="padding:10px;color:#1e40af">Carregando acompanhamento...</div>';
  try{
    const devicesData=await api('/v1/devices',{method:'GET'});
    let events=[];
    try{
      const q=filterId?'?limit=50&deviceId='+encodeURIComponent(filterId):'?limit=50';
      const act=await api('/v1/admin/activity'+q,{method:'GET'});
      events=act.events||[];
    }catch(e){
      const status=await api('/v1/status',{method:'GET'});
      const cursor=Number(status.totals&&status.totals.cursor)||0;
      const from=Math.max(0,cursor-80);
      const data=await api('/v1/changes?cursor='+from+'&limit=80',{method:'GET'});
      const names={};(devicesData.devices||[]).forEach(d=>{names[d.id]=d.name;});
      events=(data.changes||[]).slice().reverse().map(c=>({
        seq:c.seq,entity:c.entity,recordId:c.recordId,operation:c.operation,
        createdAt:c.createdAt,deviceId:c.deviceId,deviceName:names[c.deviceId]||'Aparelho',
        label:labelFromData(c.entity,c.data,c.recordId)
      }));
      if(filterId)events=events.filter(x=>x.deviceId===filterId);
    }
    renderWatch(target,devicesData.devices||[],events,devicesData.currentDeviceId,filterId||'');
    target.querySelectorAll('.dc-watch-filter').forEach(btn=>{
      btn.onclick=()=>openWatch(target,btn.dataset.id);
    });
    const all=target.querySelector('#dc-watch-all');
    if(all) all.onclick=()=>openWatch(target,'');
  }catch(e){
    target.innerHTML='<div style="padding:10px;color:#991b1b">'+(e&&e.message?e.message:'Não foi possível carregar.')+'</div>';
  }
}

function injectButton(root){
  const list=root.querySelector('#dc-list-devices');
  const box=root.querySelector('#dc-admin-result');
  if(!list||!box||root.querySelector('#dc-watch-devices'))return;
  const btn=document.createElement('button');
  btn.id='dc-watch-devices';
  btn.textContent='Acompanhar dados dos PCs';
  btn.style.cssText='height:40px;padding:0 16px;border-radius:10px;font-weight:800;font-size:12px;background:white;color:#334155;border:1px solid #cbd5e1';
  list.parentNode.insertBefore(btn,list.nextSibling);
  btn.onclick=()=>openWatch(box,'');
}

function watchModal(){
  const modal=document.getElementById('digicopy-cloud-modal');
  if(!modal||modal.__v5227watch)return;
  modal.__v5227watch=true;
  const obs=new MutationObserver(()=>injectButton(modal));
  obs.observe(modal,{childList:true,subtree:true});
  injectButton(modal);
}

const orig=window.abrirCloudflareNuvem;
if(typeof orig==='function'&&!orig.__v5227){
  window.abrirCloudflareNuvem=async function(){
    const r=await orig.apply(this,arguments);
    setTimeout(watchModal,0);
    return r;
  };
  window.abrirCloudflareNuvem.__v5227=true;
}
window.DIGICOPY_NUVEM_ACOMPANHAMENTO={entityName,opName,activityReady:true};
console.log('[DIGICOPY] acompanhamento dos PCs na nuvem (Admin)');
})();
