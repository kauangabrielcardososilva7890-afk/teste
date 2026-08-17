// ═══════════════════════════════════════════════════════════════════════════
// DIGICOPY CLOUD v5.20.28 — ativação segura de aparelhos (Cloudflare D1)
// Esta etapa substitui o diagnóstico Firebase e prepara a autorização dos PCs.
// O SETUP_SECRET nunca é salvo localmente; só o token individual do aparelho.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const API = 'https://digicopy-sync-api.kauangabrielcardososilva7890.workers.dev';
const TOKEN_KEY = 'digicopy_cloud_device_token_v1';
const DEVICE_KEY = 'digicopy_cloud_device_info_v1';

function esc(value){
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[c]);
}
function token(){ try{return localStorage.getItem(TOKEN_KEY)||'';}catch(e){return '';} }
function deviceInfo(){ try{return JSON.parse(localStorage.getItem(DEVICE_KEY)||'null');}catch(e){return null;} }
function storeAuth(data){
  if(!data || !data.token || !data.device) throw new Error('Resposta de ativação incompleta.');
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(DEVICE_KEY, JSON.stringify(data.device));
  setTimeout(()=>{try{if(window.DIGICOPY_CLOUD_SYNC)window.DIGICOPY_CLOUD_SYNC.tick('autorizado');}catch(e){}},150);
}
function forgetAuth(){
  try{ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(DEVICE_KEY); }catch(e){}
}
async function api(path, options){
  const opts=Object.assign({},options||{});
  opts.headers=Object.assign({'content-type':'application/json'},opts.headers||{});
  const tk=token(); if(tk) opts.headers.authorization='Bearer '+tk;
  let response;
  try{ response=await fetch(API+path,opts); }
  catch(e){ throw new Error('Sem conexão com a nuvem. Verifique a internet.'); }
  let data=null; try{data=await response.json();}catch(e){}
  if(!response.ok){
    const err=new Error((data&&data.message)||('Erro HTTP '+response.status));
    err.code=(data&&data.error)||('HTTP_'+response.status); err.status=response.status;
    throw err;
  }
  return data;
}

window.DIGICOPY_CLOUD_PURE={esc};
window.DIGICOPY_CLOUD={API,token,deviceInfo,api};

// Desliga definitivamente os gatilhos da nuvem antiga. Algumas versões ainda
// agendavam uma carga Firebase 4,5s após abrir, mesmo com o sync legado inativo.
try{
  sessionStorage.setItem('digicopy_auto_load_try_v4939','1');
  localStorage.setItem('digicopy_erp_autosync','0');
}catch(e){}
window.syncAutoLigado=function(){ return false; };
window.syncAutoChecar=async function(){ return {ok:false,desligado:true,cloudflare:true}; };
window.syncCarregarDaNuvem=async function(){ return {ok:false,desligado:true,cloudflare:true}; };
window.syncEnviarParaNuvem=async function(){ return {ok:false,desligado:true,cloudflare:true}; };

if(typeof document==='undefined') return;

function modalShell(){
  let root=document.getElementById('digicopy-cloud-modal');
  if(root) return root;
  root=document.createElement('div');
  root.id='digicopy-cloud-modal';
  root.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;padding:18px';
  root.innerHTML='<div style="width:min(680px,96vw);max-height:92vh;overflow:auto;background:white;border-radius:18px;box-shadow:0 25px 80px rgba(0,0,0,.35)"><div style="padding:18px 22px;background:linear-gradient(135deg,#0a1e8a,#0876c9);color:white;display:flex;align-items:center;justify-content:space-between"><div><b style="font-size:18px">☁ Nuvem DIGICOPY</b><div style="font-size:11px;opacity:.75;margin-top:2px">Cloudflare D1 • autorização segura por aparelho</div></div><button id="dc-close" style="font-size:24px;line-height:1;padding:5px 10px">×</button></div><div id="dc-body" style="padding:22px"></div></div>';
  root.querySelector('#dc-close').onclick=()=>root.remove();
  root.addEventListener('click',e=>{if(e.target===root)root.remove();});
  document.body.appendChild(root);
  return root;
}
function field(label,id,type,placeholder){
  return '<label style="display:block;font-size:11px;font-weight:800;color:#475569;margin:12px 0 5px">'+esc(label)+'</label><input id="'+id+'" type="'+(type||'text')+'" placeholder="'+esc(placeholder||'')+'" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:10px;padding:0 12px;outline:none">';
}
function button(text,id,primary){
  return '<button id="'+id+'" style="height:40px;padding:0 16px;border-radius:10px;font-weight:800;font-size:12px;'+(primary?'background:#0a1e8a;color:white':'background:white;color:#334155;border:1px solid #cbd5e1')+'">'+text+'</button>';
}
function message(text,type){
  const colors=type==='error'?'background:#fef2f2;color:#991b1b;border-color:#fecaca':type==='ok'?'background:#f0fdf4;color:#166534;border-color:#bbf7d0':'background:#eff6ff;color:#1e40af;border-color:#bfdbfe';
  return '<div style="padding:11px 12px;border:1px solid;border-radius:10px;font-size:12px;line-height:1.5;'+colors+'">'+esc(text)+'</div>';
}
function setBusy(btn,busy,text){ if(!btn)return; if(busy){btn.dataset.old=btn.textContent;btn.textContent=text||'Aguarde...';btn.disabled=true;btn.style.opacity='.65';}else{btn.textContent=btn.dataset.old||btn.textContent;btn.disabled=false;btn.style.opacity='1';} }

async function renderDisconnected(body){
  let health;
  try{ health=await api('/health',{method:'GET'}); }
  catch(e){ body.innerHTML=message(e.message,'error'); return; }
  if(!health.ready){ body.innerHTML=message('A API ainda não está pronta. Banco: '+health.database+' • esquema: '+(health.schemaVersion||'pendente')+' • segurança: '+(health.setupConfigured?'ok':'pendente'),'error'); return; }
  body.innerHTML=message('Nuvem pronta. Este computador ainda não foi autorizado. Nenhum dado local será enviado antes da autorização.','info')+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0"><button id="dc-tab-first" style="padding:8px 12px;border-radius:9px;background:#e8eaf8;color:#0a1e8a;font-weight:800">Primeiro computador</button><button id="dc-tab-code" style="padding:8px 12px;border-radius:9px;background:#f1f5f9;color:#475569;font-weight:800">Tenho um código</button><button id="dc-tab-recover" style="padding:8px 12px;border-radius:9px;background:#f1f5f9;color:#475569;font-weight:800">Recuperar administrador</button></div><div id="dc-form"></div><div style="border-top:1px solid #e2e8f0;margin-top:20px;padding-top:14px"><button id="dc-clear-tests" style="padding:8px 11px;border:1px solid #fecaca;background:#fff7f7;color:#b91c1c;border-radius:9px;font-size:11px;font-weight:800">Limpar dados de teste deste navegador</button><p style="font-size:10.5px;color:#94a3b8;margin-top:5px">Não apaga arquivos JSON salvos no computador nem dados da Cloudflare.</p></div>';
  const form=body.querySelector('#dc-form');
  function first(){
    form.innerHTML='<h3 style="font-size:15px;font-weight:900">Ativar o computador principal</h3><p style="font-size:12px;color:#64748b;margin-top:4px">Faça isto apenas no computador principal do serviço.</p>'+field('Nome deste computador','dc-name','text','Ex.: PC PRINCIPAL - DIGICOPY')+field('Segredo de ativação','dc-secret','password','SETUP_SECRET da Cloudflare')+'<div style="display:flex;gap:8px;margin-top:15px">'+button('Ativar como administrador','dc-submit',true)+'</div><div id="dc-result" style="margin-top:12px"></div>';
    form.querySelector('#dc-submit').onclick=()=>activate('/v1/setup');
  }
  function recover(){
    form.innerHTML='<h3 style="font-size:15px;font-weight:900">Recuperar acesso administrativo</h3><p style="font-size:12px;color:#64748b;margin-top:4px">Não apaga nem substitui os dados da nuvem.</p>'+field('Nome deste computador','dc-name','text','Ex.: NOTEBOOK ADMIN')+field('Segredo de recuperação','dc-secret','password','SETUP_SECRET da Cloudflare')+'<div style="display:flex;gap:8px;margin-top:15px">'+button('Recuperar administrador','dc-submit',true)+'</div><div id="dc-result" style="margin-top:12px"></div>';
    form.querySelector('#dc-submit').onclick=()=>activate('/v1/recover');
  }
  function code(){
    form.innerHTML='<h3 style="font-size:15px;font-weight:900">Autorizar este computador</h3><p style="font-size:12px;color:#64748b;margin-top:4px">Use o código temporário gerado em um computador administrador.</p>'+field('Nome deste computador','dc-name','text','Ex.: PC FINANCEIRO')+field('Código temporário','dc-code','text','join_...')+'<div style="display:flex;gap:8px;margin-top:15px">'+button('Autorizar computador','dc-submit',true)+'</div><div id="dc-result" style="margin-top:12px"></div>';
    form.querySelector('#dc-submit').onclick=async()=>{
      const btn=form.querySelector('#dc-submit'),result=form.querySelector('#dc-result');
      const deviceName=form.querySelector('#dc-name').value.trim(),joinCode=form.querySelector('#dc-code').value.trim();
      if(!deviceName||!joinCode){result.innerHTML=message('Preencha o nome e o código.','error');return;}
      setBusy(btn,true,'Autorizando...');
      try{const data=await api('/v1/enroll',{method:'POST',body:JSON.stringify({deviceName,code:joinCode})});storeAuth(data);await renderConnected(body);}
      catch(e){result.innerHTML=message(e.message,'error');setBusy(btn,false);}
    };
  }
  async function activate(path){
    const btn=form.querySelector('#dc-submit'),result=form.querySelector('#dc-result');
    const deviceName=form.querySelector('#dc-name').value.trim(),secret=form.querySelector('#dc-secret').value;
    if(!deviceName||!secret){result.innerHTML=message('Preencha o nome e o segredo.','error');return;}
    setBusy(btn,true,'Ativando...');
    try{const data=await api(path,{method:'POST',headers:{'x-setup-secret':secret},body:JSON.stringify({deviceName})});form.querySelector('#dc-secret').value='';storeAuth(data);await renderConnected(body);}
    catch(e){result.innerHTML=message(e.message,'error');setBusy(btn,false);}
  }
  body.querySelector('#dc-tab-first').onclick=first;
  body.querySelector('#dc-tab-code').onclick=code;
  body.querySelector('#dc-tab-recover').onclick=recover;
  body.querySelector('#dc-clear-tests').onclick=async()=>{
    if(!window.DIGICOPY_INDEXED_DB){return;}
    const ok1=typeof window.confirmSistema==='function'?await window.confirmSistema('Você confirmou que só precisa manter o arquivo JSON dos clientes? Isto apaga os dados de teste apenas deste navegador.','Limpar dados de teste'):false;
    if(!ok1)return;
    const ok2=await window.confirmSistema('Último aviso: clientes/produtos que estão abertos nesta tela serão removidos. O arquivo JSON salvo no computador não será apagado. Continuar?','Último aviso');
    if(!ok2)return;
    try{await window.DIGICOPY_INDEXED_DB.clearLocalData();location.reload();}
    catch(e){if(typeof window.lfbAlert==='function')window.lfbAlert(e.message,'Não foi possível limpar');}
  };
  first();
}

async function renderConnected(body){
  body.innerHTML=message('Verificando autorização deste computador...','info');
  let status;
  try{status=await api('/v1/status',{method:'GET'});}
  catch(e){
    if(e.status===401){forgetAuth();return renderDisconnected(body);}
    body.innerHTML=message(e.message,'error')+'<div style="margin-top:12px">'+button('Tentar novamente','dc-retry',true)+'</div>'; body.querySelector('#dc-retry').onclick=()=>renderConnected(body);return;
  }
  const d=status.device,t=status.totals,isAdmin=d.role==='admin';
  const localClients=typeof db!=='undefined'&&Array.isArray(db.clientes)?db.clientes.length:0;
  const cloudClients=t.byEntity&&t.byEntity.clientes?Number(t.byEntity.clientes.active)||0:0;
  const sync=window.DIGICOPY_CLOUD_SYNC?window.DIGICOPY_CLOUD_SYNC.info():{outbox:0,pending:0,cursor:0,lastOk:0,lastError:'Motor de dados não carregado',blockedDeletes:{}};
  const blocked=Object.keys(sync.blockedDeletes||{});
  const blockedHtml=blocked.length?'<div style="margin:12px 0">'+message('Proteção ativada: uma exclusão grande foi bloqueada. Confirme somente se você realmente apagou esses dados.','error')+blocked.map(entity=>'<button class="dc-approve-delete" data-entity="'+esc(entity)+'" style="margin:7px 7px 0 0;padding:8px 11px;border-radius:9px;background:#b91c1c;color:white;font-weight:800">Confirmar exclusões de '+esc(entity)+' ('+sync.blockedDeletes[entity].length+')</button>').join('')+'</div>':'';
  body.innerHTML=message(sync.lastError?('Computador autorizado, com pendência: '+sync.lastError):'Computador autorizado. Sincronização incremental ativa.','ok')+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:14px 0"><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>APARELHO</small><b style="display:block;margin-top:3px">'+esc(d.name)+'</b></div><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>PERFIL</small><b style="display:block;margin-top:3px">'+(isAdmin?'Administrador':'Autorizado')+'</b></div><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>CLIENTES NESTE PC</small><b style="display:block;margin-top:3px">'+localClients+'</b></div><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>CLIENTES NA NUVEM</small><b style="display:block;margin-top:3px">'+cloudClients+'</b></div><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>REGISTROS NA NUVEM</small><b style="display:block;margin-top:3px">'+t.records+'</b></div><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>PENDENTES NESTE PC</small><b style="display:block;margin-top:3px">'+sync.pending+'</b></div><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>EXCLUÍDOS</small><b style="display:block;margin-top:3px">'+(t.deleted||0)+'</b></div><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>APARELHOS</small><b style="display:block;margin-top:3px">'+t.devices+'</b></div></div>'+blockedHtml+
    '<div style="display:flex;gap:8px;margin-bottom:14px">'+button('Sincronizar agora','dc-sync-now',true)+'</div>'+
    (isAdmin?'<div style="border-top:1px solid #e2e8f0;padding-top:14px"><h3 style="font-size:14px;font-weight:900">Autorizar outro computador</h3><div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:8px"><label style="font-size:11px;font-weight:800">PERFIL<br><select id="dc-role" style="height:38px;border:1px solid #cbd5e1;border-radius:9px;padding:0 9px"><option value="device">Computador autorizado</option><option value="admin">Outro administrador</option></select></label>'+button('Gerar código (15 min)','dc-invite',true)+'</div><div id="dc-invite-result" style="margin-top:10px"></div></div>':'')+
    (isAdmin?'<div style="border-top:1px solid #e2e8f0;margin-top:16px;padding-top:14px"><h3 style="font-size:14px;font-weight:900">Administração da nuvem</h3><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+button('Ver aparelhos','dc-list-devices',false)+button('Ver excluídos ('+(t.deleted||0)+')','dc-list-deleted',false)+button('Analisar clientes repetidos','dc-dedupe-clients',false)+button('Revisar dados dos aparelhos bloqueados','dc-review-blocked',false)+'</div><div id="dc-admin-result" style="margin-top:10px"></div></div>':'')+
    '<div style="border-top:1px solid #e2e8f0;margin-top:16px;padding-top:12px;display:flex;justify-content:flex-end">'+button('Remover autorização deste navegador','dc-forget',false)+'</div>';
  body.querySelector('#dc-sync-now').onclick=async()=>{
    const btn=body.querySelector('#dc-sync-now');setBusy(btn,true,'Sincronizando...');
    try{if(window.DIGICOPY_CLOUD_SYNC)await window.DIGICOPY_CLOUD_SYNC.tick('manual');await renderConnected(body);}
    catch(e){setBusy(btn,false);}
  };
  body.querySelectorAll('.dc-approve-delete').forEach(btn=>btn.onclick=async()=>{
    const entity=btn.dataset.entity;
    const ok=typeof window.confirmSistema==='function'?await window.confirmSistema('Você realmente excluiu estes registros de '+entity+'? Eles ficarão recuperáveis na nuvem.','Confirmar exclusão em massa'):false;
    if(ok&&window.DIGICOPY_CLOUD_SYNC){window.DIGICOPY_CLOUD_SYNC.approveMassDelete(entity);await window.DIGICOPY_CLOUD_SYNC.tick('exclusao-aprovada');await renderConnected(body);}
  });
  if(isAdmin) body.querySelector('#dc-invite').onclick=async()=>{
    const btn=body.querySelector('#dc-invite'),result=body.querySelector('#dc-invite-result'),role=body.querySelector('#dc-role').value;
    setBusy(btn,true,'Gerando...');
    try{const data=await api('/v1/invites',{method:'POST',body:JSON.stringify({minutes:15,role})});result.innerHTML=message('Código de uso único (expira em 15 minutos):','info')+'<div style="font-family:monospace;word-break:break-all;padding:10px;background:#0f172a;color:white;border-radius:9px;margin-top:7px" id="dc-code-out">'+esc(data.code)+'</div>'+button('Copiar código','dc-copy',false);result.querySelector('#dc-copy').onclick=async()=>{try{await navigator.clipboard.writeText(data.code);result.querySelector('#dc-copy').textContent='Copiado!';}catch(e){}};}
    catch(e){result.innerHTML=message(e.message,'error');}
    setBusy(btn,false);
  };
  if(isAdmin){
    const adminResult=body.querySelector('#dc-admin-result');
    body.querySelector('#dc-review-blocked').onclick=async()=>{
      adminResult.innerHTML=message('Localizando clientes enviados pelos aparelhos bloqueados...','info');
      try{
        const data=await api('/v1/review/revoked-records?entity=clientes',{method:'GET'}),records=data.records||[];
        if(!records.length){adminResult.innerHTML=message('Nenhum cliente ativo veio dos aparelhos bloqueados.','ok');return;}
        adminResult.innerHTML=message('Encontrados '+records.length+' clientes ativos enviados pelos aparelhos bloqueados. Confira a quantidade antes de remover.','info')+records.map(x=>{const label=(x.data&&(x.data.nome||x.data.fantasia||x.data.codigo))||x.recordId;return '<div style="padding:7px 9px;border:1px solid #e2e8f0;border-radius:8px;margin-top:5px"><b>'+esc(label)+'</b><small style="display:block;color:#64748b">Origem: '+esc(x.sourceDevice)+'</small></div>';}).join('')+button('Remover estes '+records.length+' clientes extras','dc-remove-blocked',true);
        adminResult.querySelector('#dc-remove-blocked').onclick=async()=>{
          const ok=await window.confirmSistema('Remover os '+records.length+' clientes enviados pelos aparelhos bloqueados? Eles continuarão recuperáveis em Excluídos.','Remover dados dos testes');if(!ok)return;
          const btn=adminResult.querySelector('#dc-remove-blocked');setBusy(btn,true,'Removendo...');
          try{await api('/v1/review/remove-revoked',{method:'POST',body:JSON.stringify({entity:'clientes',recordIds:records.map(x=>x.recordId)})});if(window.DIGICOPY_CLOUD_SYNC)await window.DIGICOPY_CLOUD_SYNC.tick('limpeza-aparelhos-bloqueados');await renderConnected(body);}
          catch(e){adminResult.innerHTML=message(e.message,'error');}
        };
      }catch(e){adminResult.innerHTML=message(e.message,'error');}
    };
    body.querySelector('#dc-dedupe-clients').onclick=async()=>{
      if(!window.DIGICOPY_CLOUD_SYNC){adminResult.innerHTML=message('Motor de sincronização não carregado.','error');return;}
      const analysis=window.DIGICOPY_CLOUD_SYNC.analyzeDuplicateClients();
      if(!analysis.extraCount){adminResult.innerHTML=message('Nenhum cliente repetido por código ou CPF/CNPJ foi encontrado.','ok');return;}
      adminResult.innerHTML=message('Encontrados '+analysis.extraCount+' clientes extras em '+analysis.groupsCount+' grupos. Será criado um snapshot de recuperação; contratos, vendas e chamados serão apontados para o cadastro mantido.','info')+button('Unir '+analysis.extraCount+' repetidos com segurança','dc-confirm-dedupe',true);
      adminResult.querySelector('#dc-confirm-dedupe').onclick=async()=>{
        const ok=await window.confirmSistema('Unir '+analysis.extraCount+' clientes repetidos? A versão mais completa será mantida e os cadastros removidos ficarão recuperáveis na nuvem.','Unir clientes repetidos');if(!ok)return;
        const btn=adminResult.querySelector('#dc-confirm-dedupe');setBusy(btn,true,'Unindo...');
        try{const result=await window.DIGICOPY_CLOUD_SYNC.mergeDuplicateClients();await window.DIGICOPY_CLOUD_SYNC.tick('deduplicacao');if(typeof window.lfbAlert==='function')await window.lfbAlert('Clientes extras removidos: '+result.removed+'\nReferências atualizadas: '+result.references,'Clientes unidos');await renderConnected(body);}
        catch(e){adminResult.innerHTML=message(e.message,'error');}
      };
    };
    body.querySelector('#dc-list-devices').onclick=async()=>{
      adminResult.innerHTML=message('Carregando aparelhos...','info');
      try{
        const data=await api('/v1/devices',{method:'GET'});
        adminResult.innerHTML=(data.devices||[]).map(x=>'<div style="display:flex;align-items:center;gap:8px;padding:9px;border:1px solid #e2e8f0;border-radius:9px;margin-top:6px"><div style="flex:1"><b>'+esc(x.name)+'</b><small style="display:block;color:#64748b">'+esc(x.role==='admin'?'Administrador':'Autorizado')+(x.revokedAt?' • BLOQUEADO':'')+'</small></div>'+(!x.revokedAt&&x.id!==data.currentDeviceId?'<button class="dc-revoke" data-id="'+esc(x.id)+'" data-name="'+esc(x.name)+'" style="padding:6px 9px;border-radius:8px;background:#fff1f2;color:#be123c;font-weight:800">Bloquear</button>':'')+'</div>').join('')||message('Nenhum aparelho encontrado.','info');
        adminResult.querySelectorAll('.dc-revoke').forEach(btn=>btn.onclick=async()=>{
          const ok=await window.confirmSistema('Bloquear o aparelho '+btn.dataset.name+'? Ele perderá o acesso, mas nenhum dado será apagado.','Bloquear aparelho');
          if(!ok)return;
          try{await api('/v1/devices/revoke',{method:'POST',body:JSON.stringify({deviceId:btn.dataset.id})});body.querySelector('#dc-list-devices').click();}
          catch(e){adminResult.innerHTML=message(e.message,'error');}
        });
      }catch(e){adminResult.innerHTML=message(e.message,'error');}
    };
    body.querySelector('#dc-list-deleted').onclick=async()=>{
      adminResult.innerHTML=message('Carregando itens excluídos...','info');
      try{
        const data=await api('/v1/deleted?limit=100',{method:'GET'});
        adminResult.innerHTML=(data.records||[]).map(x=>{const label=(x.data&&(x.data.nome||x.data.descricao||x.data.numero||x.data.login))||x.recordId;return '<div style="display:flex;align-items:center;gap:8px;padding:9px;border:1px solid #fecaca;background:#fffafa;border-radius:9px;margin-top:6px"><div style="flex:1"><b>'+esc(label)+'</b><small style="display:block;color:#64748b">'+esc(x.entity)+' • versão '+esc(x.version)+'</small></div><button class="dc-restore" data-entity="'+esc(x.entity)+'" data-id="'+esc(x.recordId)+'" style="padding:6px 9px;border-radius:8px;background:#166534;color:white;font-weight:800">Restaurar</button></div>';}).join('')||message('Nenhum item excluído.','ok');
        adminResult.querySelectorAll('.dc-restore').forEach(btn=>btn.onclick=async()=>{
          const ok=await window.confirmSistema('Restaurar este registro de '+btn.dataset.entity+'?','Restaurar registro');if(!ok)return;
          try{await api('/v1/restore',{method:'POST',body:JSON.stringify({entity:btn.dataset.entity,recordId:btn.dataset.id})});if(window.DIGICOPY_CLOUD_SYNC)await window.DIGICOPY_CLOUD_SYNC.tick('restauracao');await renderConnected(body);}
          catch(e){adminResult.innerHTML=message(e.message,'error');}
        });
      }catch(e){adminResult.innerHTML=message(e.message,'error');}
    };
  }
  body.querySelector('#dc-forget').onclick=async()=>{
    const ok=typeof window.confirmSistema==='function'?await window.confirmSistema('Remover a autorização salva somente deste navegador? Os dados locais não serão apagados.','Remover autorização'):false;
    if(ok){forgetAuth();renderDisconnected(body);}
  };
}

window.abrirCloudflareNuvem=async function(){
  const root=modalShell(),body=root.querySelector('#dc-body');
  body.innerHTML=message('Verificando a nuvem...','info');
  if(token()) await renderConnected(body); else await renderDisconnected(body);
};

console.log('[DIGICOPY] Cloudflare D1: painel de autorização carregado');
})();
