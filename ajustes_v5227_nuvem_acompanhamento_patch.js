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
  // v5.24.34 — DIAGNÓSTICO DOS "SALVOS MAS QUE NÃO APARECEM" (relato dele:
  // dado está na nuvem e não desce "qualquer menu"). Custo ZERO de nuvem: só
  // lê o banco DESTE pc e conta o que carrega empresaId diferente da sessão —
  // porque as listas só mostram a empresa logada. Duas empresas no banco =
  // dois mundos invisíveis entre si (a suspeita número 1 deste caso).
  const dx=document.createElement('button');
  dx.id='dc-diag-invisiveis';
  dx.textContent='Por que dados não aparecem?';
  dx.style.cssText='height:40px;padding:0 16px;border-radius:10px;font-weight:800;font-size:12px;background:#fff7ed;color:#9a3412;border:1px solid #fdba74;margin-left:6px';
  list.parentNode.insertBefore(dx,btn.nextSibling);
  dx.onclick=window.dcDiagnosticoInvisiveis;
  // v6.0.4 — REPARAR SESSÃO AGORA: o diagnóstico acima SÓ LÊ; este botão é o
  // irmão que AGE (pedido dele: a sessão dele ficou "(nenhuma?!)" mesmo com 1
  // empresa no banco). Usa o motor da cura (window.acForcarCura) e conta o
  // resultado. Seguro: só carimba quando existe EXATAMENTE 1 empresa no banco.
  const rp=document.createElement('button');
  rp.id='dc-reparar-sessao';
  rp.textContent='Reparar sessão agora';
  rp.style.cssText='height:40px;padding:0 16px;border-radius:10px;font-weight:800;font-size:12px;background:#f0fdf4;color:#15803d;border:1px solid #86efac;margin-left:6px';
  if(rp.style) rp.style.marginLeft='6px';
  list.parentNode.insertBefore(rp,dx.nextSibling);
  rp.onclick=async function(){
    if(typeof window.acForcarCura!=='function'){
      const f='A cura v6.0.4 ainda não carregou nesta tela. Recarregue o sistema (F5) e tente de novo.';
      if(typeof window.lfbAlert==='function')window.lfbAlert(f,'Reparar sessão'); else alert(f);
      return;
    }
    let r=null;
    try{ r=await window.acForcarCura(); }catch(e){ r={ok:false,motivo:(e&&e.message)||'erro inesperado'}; }
    const msg=(r&&r.ok)
      ? ('✅ Reparo feito.\n\n• Sessão: '+(r.sessaoMudou?('carimbada com '+r.empresaId):'já estava com empresa')+'\n• Registros órfãos carimbados: '+Number(r.orfaos||0)+'\n\nRecarregue as telas — os dados voltam a aparecer.')
      : ('Nada reparado automaticamente: '+((r&&r.motivo)||'motivo desconhecido')+'\n\nSe o banco tiver 2 empresas ou mais, o sistema NÃO chuta — saia e entre escolhendo a empresa certa.');
    if(typeof window.lfbAlert==='function')window.lfbAlert(msg,'Reparar sessão'); else alert(msg);
  };
}

window.dcDiagnosticoInvisiveis=function(){
  const alvoSess=(typeof sess==='function')?sess():null;
  const empAtual=(alvoSess&&alvoSess.empresaId)||'';
  const ENTS=['usuarios','tecnicos','clientes','produtos','recargas','equipamentos','contratos','parque','leituras','os','vendas','orcamentos','contasReceber','contasPagar'];
  const linhas=[];
  let totalInvis=0;
  let totalOrfaos=0; const orfaosPor={};
  const idsEstranhos={};
  for(const e of ENTS){
    const arr=(window.db&&Array.isArray(window.db[e])) ? window.db[e] : [];
    let inv=0;
    let orfaos=0; // v6.0.2 — registros SEM carimbo de empresa (causa real dos "dados sumidos")
    for(const x of arr){
      const eid=x&&x.empresaId;
      if(eid && empAtual && eid!==empAtual){ inv++; idsEstranhos[eid]=true; totalInvis++; }
      if(eid===undefined||eid===null||eid==='') orfaos++;
    }
    if(orfaos) { totalOrfaos+=orfaos; orfaosPor[e]=orfaos; }
    if(arr.length) linhas.push(e+': '+arr.length+' gravados'+(inv?' • '+inv+' INVISÍVEIS (outra empresa)':'')+(orfaos?' • '+orfaos+' SEM CARIMBO (órfãos)':(!inv?' • todos visíveis':'')));
  }
  const empresas=(window.db&&Array.isArray(window.db.empresas))?window.db.empresas:[];
  const outros=Object.keys(idsEstranhos);
  let cab='Empresa da minha sessão: '+(empAtual||'(nenhuma?!)')+'\nEmpresas no banco: '+empresas.length+(empresas.length?' ['+empresas.map(function(x){return x.id;}).join(', ')+']':'');
  if(outros.length) cab+='\nIDs estranhos achados nos dados: '+outros.join(', ');
  const semSessaoComUmaEmpresa = !empAtual && empresas.length===1;
  const corpo = semSessaoComUmaEmpresa
    ? '\n\n>>> A CAUSA ESTÁ AQUI EM CIMA: sua SESSÃO está SEM empresa, mas o banco tem exatamente 1 ('+empresas[0].id+'). É por isso que dados somem das telas: as listas só mostram a empresa da sessão. Resolva NA HORA clicando no botão verde «Reparar sessão agora» (ao lado deste) — depois recarregue as telas que tudo volta.\n\n(Detalhe técnico, v6.0.4: a sonda antiga só tentava carimbar por 30 segundos depois de abrir o sistema. Quem entrava depois disso ficava o dia inteiro sem carimbo — por isso às vezes aparecia, às vezes não. Agora a cura insiste por até 10 minutos e é rearmada a cada login.)'
    : totalOrfaos
    ? '\n\n>>> A CAUSA PROVÁVEL DOS SUMIÇOS: '+totalOrfaos+' registros SEM carimbo de empresa ('+
      Object.keys(orfaosPor).map(function(k){return k+': '+orfaosPor[k];}).join(', ')+
      '). Quem criou estava com sessão sem empresa — por isso "sumia" nos outros PCs. '+
      (empAtual? 'A cura carimba sozinho na entrada (a v6.0.4 insiste até 10 minutos e rearma a cada login). Se essa contagem continuar subindo, manda foto.'
               : '>>> SUA PRÓPRIA SESSÃO TAMBÉM ESTÁ SEM EMPRESA (cabeçalho acima). Clique no botão verde «Reparar sessão agora». Se continuar, manda foto.')
    : totalInvis
    ? '\n\n>>> A CHAVE DO MISTÉRIO: '+totalInvis+' registros chegaram da nuvem mas estão carimbados com OUTRA empresa — por isso não aparecem nas telas. Manda foto deste diagnóstico que eu selo a correção (unir as empresas) em 1 versão.'
    : '\n\nNada escondido por empresa: os dados deste PC estão todos visíveis. O problema é outro — manda foto deste diagnóstico mesmo assim.';
  const msg='DIAGNÓSTICO (só lê, não muda nada)\n\n'+cab+'\n\n'+linhas.join('\n')+corpo;
  if(typeof window.lfbAlert==='function')window.lfbAlert(msg,'Por que dados não aparecem?');
  else alert(msg);
};

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
