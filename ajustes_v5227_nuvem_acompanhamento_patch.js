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

// ═══════════════════════════════════════════════════════════════════════════
// v6.1.4 — CHECK-UP DA NUVEM (pedido dele: "quero resolver, isso sempre volta")
//
// O problema que ele relatou (nota criada num PC e não aparece no outro) tem
// três causas possíveis, e este check-up MOSTRA qual é — sem chute:
//   1. a sincronização está PAUSADA esperando a escolha ("enviar os dados deste
//      PC" ou "não enviar"). Enquanto ninguém escolhe, o PC não baixa NADA;
//   2. o computador está conectado, mas o diário da nuvem está sendo lido a
//      partir de um ponto adiantado (cursor) → dá para "Baixar tudo de novo";
//   3. tem coisa pendente para subir (fila) ou erro recente aparecendo no ícone.
// Ele vê o estado em português, compara LISTA POR LISTA (aqui x nuvem) e conserta
// com um clique. O resumo é copiável — é o "me manda o texto" que eu preciso.
// ═══════════════════════════════════════════════════════════════════════════
function upLista(mapa){
  if(!mapa) return [];
  return Object.keys(mapa).map(function(k){ return k+': '+mapa[k]; }).sort();
}
window.dcCheckupNuvemResumo=function(estado, nuvem){
  const L=[];
  L.push('CHECK-UP DA NUVEM — '+new Date().toLocaleString('pt-BR'));
  L.push('Versão do sistema: '+((typeof window!=='undefined'&&window.DIGICOPY_APP_VERSION)||'?'));
  if(!estado){ L.push('Motor de sincronização não carregado.'); return L.join('\n'); }
  L.push('Conectado...: '+(estado.authorized?'SIM':'NÃO'));
  L.push('Pausado.....: '+(estado.paused?'SIM — motivo: '+(estado.pauseReason||'sem motivo informado'):'não'));
  L.push('Pendentes neste PC (fila de envio): '+(estado.outbox||0));
  L.push('Registros deste PC: '+(estado.totalLocal||0));
  L.push('Último envio OK: '+(estado.lastOk?new Date(estado.lastOk).toLocaleString('pt-BR'):'nunca'));
  L.push('Último erro: '+(estado.lastError||'nenhum'));
  L.push('Leitura da nuvem até o número: '+(estado.cursor||0));
  if(estado.porListaLocal&&Object.keys(estado.porListaLocal).length) L.push('Listas deste PC → '+upLista(estado.porListaLocal).join(' | '));
  if(nuvem&&nuvem.byEntity){ const nb=Object.keys(nuvem.byEntity).map(function(k){ return k+': '+(Number(nuvem.byEntity[k]&&nuvem.byEntity[k].active)||0); }).sort(); L.push('Listas na nuvem → '+nb.join(' | ')); }
  else L.push('Listas na nuvem → (não consegui contar agora)');
  return L.join('\n');
};

window.dcCheckupNuvem=async function(){
  const S=window.DIGICOPY_CLOUD_SYNC;
  if(!S||typeof S.estadoDetalhado!=='function'){ if(typeof window.lfbAlert==='function') window.lfbAlert('O motor da nuvem ainda não carregou. Espere alguns segundos e tente de novo.','Check-up da nuvem'); return; }
  const estado=S.estadoDetalhado();
  let nuvem=null, erroNuvem='';
  try{
    if(typeof S.apiStatus==='function') nuvem=await S.apiStatus();
    else if(window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.api) nuvem=(await window.DIGICOPY_CLOUD.api('/v1/status',{method:'GET'})).totals||null;
  }catch(e){ erroNuvem=(e&&e.message)||String(e); }
  const resumo=window.dcCheckupNuvemResumo(estado,nuvem);
  const linhaLocal=estado.porListaLocal&&Object.keys(estado.porListaLocal).length
    ? '<div style="max-height:230px;overflow:auto;border:1px solid #e2e8f0;border-radius:10px;margin-top:6px">'+Object.keys(estado.porListaLocal).sort().map(function(k){
        const naNuvem=(nuvem&&nuvem.byEntity&&nuvem.byEntity[k])?(Number(nuvem.byEntity[k].active)||0):null;
        const dif=(naNuvem!==null&&naNuvem!==estado.porListaLocal[k]);
        return '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:12px"><span>'+k+'</span><b>Aqui: '+estado.porListaLocal[k]+(naNuvem!==null?(' · Nuvem: '+naNuvem):'')+(dif?' <span style="color:#b45309">(diferente)</span>':'')+'</b></div>';
      }).join('')+'</div>'
    : '<p style="font-size:12px;color:#64748b;margin:4px 0 0">Nada gravado neste PC ainda.</p>';
  const corpo=''+
    '<p style="font-size:12.5px;color:#334155;margin:0 0 10px">Este check-up <b>só olha</b>. Ele mostra onde cada dado está e conserta a sincronização se ela estiver parada. '+
    'Nada é apagado em lugar nenhum.</p>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:10px">'+
      '<div style="padding:9px 11px;background:#f8fafc;border-radius:10px;font-size:12px"><small style="color:#64748b;font-weight:800">CONECTADO</small><br><b>'+(estado.authorized?'SIM':'NÃO')+'</b></div>'+
      '<div style="padding:9px 11px;background:'+(estado.paused?'#fff7ed':'#f8fafc')+';border-radius:10px;font-size:12px"><small style="color:#64748b;font-weight:800">SINCRONIZAÇÃO</small><br><b>'+(estado.paused?'PAUSADA':'ligada')+'</b></div>'+
      '<div style="padding:9px 11px;background:#f8fafc;border-radius:10px;font-size:12px"><small style="color:#64748b;font-weight:800">POR SUBIR</small><br><b>'+(estado.outbox||0)+'</b></div>'+
      '<div style="padding:9px 11px;background:#f8fafc;border-radius:10px;font-size:12px"><small style="color:#64748b;font-weight:800">AQUI / NUVEM</small><br><b>'+(estado.totalLocal||0)+' / '+(nuvem&&nuvem.records!=null?nuvem.records:'—')+'</b></div>'+
    '</div>'+
    (estado.paused
      ? '<div style="border:1px solid #fdba74;background:#fff7ed;border-radius:10px;padding:10px 12px;margin-bottom:10px"><b style="color:#9a3412;font-size:13px">⚠ A sincronização está PAUSADA esperando a sua escolha</b>'+
        '<p style="font-size:12px;color:#7c2d12;margin:5px 0 0">Enquanto ela está pausada, este computador <b>não baixa nada</b> da nuvem — é por isso que o que foi criado no outro PC não aparece aqui. '+
        'Abra a janela da <b>Nuvem</b> e escolha: <b>“Enviar os dados deste PC para a nuvem”</b> (se este PC é o certo) ou <b>“Não enviar os dados atuais”</b> (se a nuvem é a certa).</p></div>'
      : '')+
    (estado.lastError?'<div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:9px 11px;margin-bottom:10px;font-size:12px"><b>Último erro:</b> '+String(estado.lastError).replace(/[<>&]/g,'')+'</div>':'')+
    (erroNuvem?'<p style="font-size:11.5px;color:#9a3412;margin:0 0 8px">Não consegui contar a nuvem agora ('+String(erroNuvem).replace(/[<>&]/g,'')+'). Os botões de conserto funcionam do mesmo jeito.</p>':'')+
    '<h4 style="font-size:13px;color:#0a1e8a;margin:12px 0 4px">Lista por lista (aqui x nuvem)</h4>'+linhaLocal+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">'+
      '<button type="button" id="dc-ck-sync" style="height:40px;padding:0 14px;border-radius:10px;border:none;background:#0a1e8a;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer">🔄 Sincronizar agora</button>'+
      '<button type="button" id="dc-ck-baixar" style="height:40px;padding:0 14px;border-radius:10px;border:none;background:#0f766e;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer">⬇️ Baixar tudo da nuvem de novo</button>'+
      '<button type="button" id="dc-ck-enviar" style="height:40px;padding:0 14px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#0a1e8a;font-weight:800;font-size:12.5px;cursor:pointer">⬆️ Enviar este PC inteiro</button>'+
      '<button type="button" id="dc-ck-copiar" style="height:40px;padding:0 14px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-weight:800;font-size:12.5px;cursor:pointer">📋 Copiar resumo</button>'+
    '</div>'+
    '<p style="font-size:11.5px;color:#64748b;margin:9px 0 0">“Baixar tudo de novo” só faz este PC ler o diário da nuvem desde o começo — o que já está mais novo aqui não é mexido, e a nuvem não é alterada.</p>'+
    '<pre id="dc-ck-resumo" style="display:none"></pre>';
  if(!modalSistemaCheckup('Check-up da nuvem', corpo)){ if(typeof window.lfbAlert==='function') window.lfbAlert(resumo,'Check-up da nuvem'); return; }
  function recadinho(t,erro){ const el=document.getElementById('dc-ck-aviso'); if(el){ el.textContent=t; el.style.color=erro?'#b91c1c':'#15803d'; } }
  document.getElementById('dc-ck-sync').onclick=async function(){
    try{ recadinho('Sincronizando...'); await window.DIGICOPY_CLOUD_SYNC.tick('check-up'); recadinho('Sincronizado.'); }
    catch(e){ recadinho('Erro: '+(e.message||e),true); }
  };
  document.getElementById('dc-ck-baixar').onclick=async function(){
    try{
      recadinho('Baixando tudo de novo...');
      const r=await window.DIGICOPY_CLOUD_SYNC.baixarTudoDaNuvem();
      if(r&&r.pausado){ recadinho('A sincronização está PAUSADA — escolha na janela da Nuvem antes de baixar.',true); return; }
      recadinho('Pronto: reli a nuvem desde o começo (número '+(r&&r.antes||0)+' → '+(r&&r.durante||0)+').');
      if(typeof renderClientes==='function'){ try{ renderClientes(); }catch(e){} }
      if(typeof renderVendas==='function'){ try{ renderVendas(); }catch(e){} }
    }catch(e){ recadinho('Erro: '+(e.message||e),true); }
  };
  document.getElementById('dc-ck-enviar').onclick=async function(){
    let ok=true;
    if(typeof window.confirmSistema==='function') ok=await window.confirmSistema('Enviar todo o conteúdo deste computador para a nuvem? Nada é apagado: o que já existe é atualizado e o que falta é criado.','Enviar este PC inteiro');
    if(!ok) return;
    try{ recadinho('Enviando...'); await window.DIGICOPY_CLOUD_SYNC.publishLocalToCloud(); recadinho('Enviado. Os outros PCs recebem no próximo ciclo.'); }
    catch(e){ recadinho('Erro: '+(e.message||e),true); }
  };
  document.getElementById('dc-ck-copiar').onclick=function(){
    const pre=document.getElementById('dc-ck-resumo');
    pre.style.display='block'; pre.textContent=resumo;
    const pronto=function(){ recadinho('Resumo copiado! Cole no chat.'); };
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(resumo).then(pronto).catch(pronto); } else pronto();
  };
};
function modalSistemaCheckup(titulo, corpoHtml){
  const root=document.getElementById('modal-root'), box=document.getElementById('modal-box'),
        t=document.getElementById('modal-title'), b=document.getElementById('modal-body'), f=document.getElementById('modal-footer');
  if(!root||!b) return false;
  if(box) box.className='w-full max-w-[820px] rounded-[18px] bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col';
  if(t) t.textContent=titulo;
  b.innerHTML=corpoHtml+'<div id="dc-ck-aviso" style="font-size:12px;font-weight:800;margin-top:10px"></div>';
  if(f) f.innerHTML='<button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>';
  root.classList.remove('hidden');
  return true;
}
// Botão na janela da Nuvem: "🩺 Check-up da nuvem"
function injetarBotaoCheckup(){
  try{
    const modal=document.getElementById('digicopy-cloud-modal'); if(!modal) return;
    const body=modal.querySelector('#dc-body'); if(!body) return;
    if(body.querySelector('#dc-abrir-checkup')) return;
    if(!body.querySelector('#dc-sync-now')&&!body.querySelector('#dc-enviar-locais')) return;
    const box=document.createElement('div');
    box.style.cssText='border-top:1px solid #e2e8f0;margin-top:14px;padding-top:12px';
    box.innerHTML='<h3 style="font-size:14px;font-weight:900;margin:0 0 4px">🩺 Check-up da nuvem</h3>'+
      '<p style="font-size:12px;color:#64748b;margin:0 0 8px">Um dado criado no outro PC não aparece aqui? O check-up mostra se a sincronização está pausada, quantos registros têm em cada lado (lista por lista) e conserta com um clique.</p>'+
      '<button id="dc-abrir-checkup" type="button" style="height:40px;padding:0 16px;border-radius:10px;border:none;background:#0f766e;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer">🩺 Abrir check-up da nuvem</button>';
    const forget=body.querySelector('#dc-forget');
    if(forget&&forget.parentNode) forget.parentNode.insertBefore(box,forget); else body.appendChild(box);
    const b=document.getElementById('dc-abrir-checkup'); if(b) b.onclick=function(){ window.dcCheckupNuvem(); };
  }catch(e){}
}
if(typeof window.abrirCloudflareNuvem==='function'&&!window.abrirCloudflareNuvem.__v6104ck){
  const oldC=window.abrirCloudflareNuvem;
  window.abrirCloudflareNuvem=async function(){
    const r=await oldC.apply(this,arguments);
    try{ setTimeout(injetarBotaoCheckup,100); setTimeout(injetarBotaoCheckup,500); setTimeout(injetarBotaoCheckup,1200); }catch(e){}
    return r;
  };
  window.abrirCloudflareNuvem.__v6104ck=true;
}

window.dcDiagnosticoInvisiveis=function(){
  // v6.1.4 — A CAUSA DO "(nenhuma?!)" EM TODO COMPUTADOR (relatório dele,
  // 21/09/2026): este arquivo usava `sess()` — e `sess()` NÃO EXISTE aqui
  // dentro. No bundle cada módulo é isolado; `typeof sess==='function'` dava
  // falso SEMPRE, então o diagnóstico escrevia "Empresa da minha sessão:
  // (nenhuma?!)" mesmo com a sessão certinha (prova: o botão «Reparar sessão
  // agora», que usa getSession() direto, respondeu "já estava com empresa").
  // Alarme falso puro — e ele ainda levou o susto para os outros PCs.
  const getS=(typeof getSession==='function')?getSession():(typeof sess==='function'?sess():null);
  const alvoSess=getS;
  const empAtual=(alvoSess&&(alvoSess.empresaId||alvoSess.empresa||alvoSess.empresa_id))||'';
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
  const versao=(typeof window!=='undefined'&&window.DIGICOPY_APP_VERSION)||'(não li)';
  const quem=alvoSess?((alvoSess.usuarioNome||alvoSess.login||'?')+' ('+(alvoSess.perfil||'?')+')'):'(ninguém logado)';
  let cab='Sessão deste computador: '+quem+'\nEmpresa da minha sessão: '+(empAtual||'(SEM EMPRESA — a cura carimba sozinha; o botão verde força agora)')+
          '\nEmpresas no banco: '+empresas.length+(empresas.length?' ['+empresas.map(function(x){return x.id;}).join(', ')+']':'')+
          '\nVersão deste sistema: '+versao;
  if(outros.length) cab+='\nIDs estranhos achados nos dados: '+outros.join(', ');
  const semSessaoComUmaEmpresa = !empAtual && empresas.length===1;
  // v6.1.4 — alarme honesto: drama só quando existe dado escondido de verdade.
  // Tudo visível + sessão sem carimbo = NADA quebrado (o sistema carimba
  // sozinho na entrada; o botão verde é opcional). Era aqui que ele se
  // assustava sem motivo.
  const temDadoEscondido = (totalInvis + totalOrfaos) > 0;
  const corpo = (semSessaoComUmaEmpresa && temDadoEscondido)
    ? '\n\n>>> A CAUSA ESTÁ AQUI EM CIMA: sua SESSÃO está SEM empresa, mas o banco tem exatamente 1 ('+empresas[0].id+'). É por isso que dados somem das telas: as listas só mostram a empresa da sessão. Resolva NA HORA clicando no botão verde «Reparar sessão agora» (ao lado deste) — depois recarregue as telas que tudo volta.\n\n(Detalhe técnico, v6.0.4: a sonda antiga só tentava carimbar por 30 segundos depois de abrir o sistema. Quem entrava depois disso ficava o dia inteiro sem carimbo — por isso às vezes aparecia, às vezes não. Agora a cura insiste por até 10 minutos e é rearmada a cada login.)'
    : (semSessaoComUmaEmpresa && !temDadoEscondido)
    ? '\n\n✅ NADA QUEBRADO AQUI: as listas acima estão TODAS VISÍVEIS e não há registro escondido — só o carimbo da sessão ainda não caiu (ele é gravado sozinho na entrada do sistema). Isto NÃO some com dado nenhum: pode trabalhar normal. Se quiser adiantar, o botão verde «Reparar sessão agora» carimba na hora; senão deixe que ele se carimba sozinho.'
    : totalOrfaos
    ? '\n\n>>> A CAUSA PROVÁVEL DOS SUMIÇOS: '+totalOrfaos+' registros SEM carimbo de empresa ('+
      Object.keys(orfaosPor).map(function(k){return k+': '+orfaosPor[k];}).join(', ')+
      '). Quem criou estava com sessão sem empresa — por isso "sumia" nos outros PCs. '+
      (empAtual? 'A cura carimba sozinho na entrada (a v6.0.4 insiste até 10 minutos e rearma a cada login). Se essa contagem continuar subindo, manda foto.'
               : '>>> SUA PRÓPRIA SESSÃO TAMBÉM ESTÁ SEM EMPRESA (cabeçalho acima). Clique no botão verde «Reparar sessão agora». Se continuar, manda foto.')
    : totalInvis
    ? '\n\n>>> A CHAVE DO MISTÉRIO: '+totalInvis+' registros chegaram da nuvem mas estão carimbados com OUTRA empresa — por isso não aparecem nas telas. Manda foto deste diagnóstico que eu selo a correção (unir as empresas) em 1 versão.'
    : '\n\nNada escondido por empresa: os dados deste PC estão todos visíveis. O problema é outro — manda foto deste diagnóstico mesmo assim.';
  const rodape = '\n\nPara comparar com outro computador (é assim que se acha diferença de dados): '+
    'abra ESTE mesmo botão no outro PC e compare as duas telas — se a «Empresa da minha sessão» for diferente entre os PCs, me manda as duas que eu junto as empresas em 1 versão.';
  const msg='DIAGNÓSTICO (só lê, não muda nada)\n\n'+cab+'\n\n'+linhas.join('\n')+corpo+rodape;
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
