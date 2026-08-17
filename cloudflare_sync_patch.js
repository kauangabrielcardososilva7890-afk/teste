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
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0"><button id="dc-tab-first" style="padding:8px 12px;border-radius:9px;background:#e8eaf8;color:#0a1e8a;font-weight:800">Primeiro computador</button><button id="dc-tab-code" style="padding:8px 12px;border-radius:9px;background:#f1f5f9;color:#475569;font-weight:800">Tenho um código</button><button id="dc-tab-recover" style="padding:8px 12px;border-radius:9px;background:#f1f5f9;color:#475569;font-weight:800">Recuperar administrador</button></div><div id="dc-form"></div>';
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
  body.innerHTML=message('Computador autorizado e conectado. A sincronização dos dados será habilitada na próxima etapa testada.','ok')+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:14px 0"><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>APARELHO</small><b style="display:block;margin-top:3px">'+esc(d.name)+'</b></div><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>PERFIL</small><b style="display:block;margin-top:3px">'+(isAdmin?'Administrador':'Autorizado')+'</b></div><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>APARELHOS</small><b style="display:block;margin-top:3px">'+t.devices+'</b></div><div style="padding:12px;background:#f8fafc;border-radius:11px"><small>REGISTROS</small><b style="display:block;margin-top:3px">'+t.records+'</b></div></div>'+
    (isAdmin?'<div style="border-top:1px solid #e2e8f0;padding-top:14px"><h3 style="font-size:14px;font-weight:900">Autorizar outro computador</h3><div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:8px"><label style="font-size:11px;font-weight:800">PERFIL<br><select id="dc-role" style="height:38px;border:1px solid #cbd5e1;border-radius:9px;padding:0 9px"><option value="device">Computador autorizado</option><option value="admin">Outro administrador</option></select></label>'+button('Gerar código (15 min)','dc-invite',true)+'</div><div id="dc-invite-result" style="margin-top:10px"></div></div>':'')+
    '<div style="border-top:1px solid #e2e8f0;margin-top:16px;padding-top:12px;display:flex;justify-content:flex-end">'+button('Remover autorização deste navegador','dc-forget',false)+'</div>';
  if(isAdmin) body.querySelector('#dc-invite').onclick=async()=>{
    const btn=body.querySelector('#dc-invite'),result=body.querySelector('#dc-invite-result'),role=body.querySelector('#dc-role').value;
    setBusy(btn,true,'Gerando...');
    try{const data=await api('/v1/invites',{method:'POST',body:JSON.stringify({minutes:15,role})});result.innerHTML=message('Código de uso único (expira em 15 minutos):','info')+'<div style="font-family:monospace;word-break:break-all;padding:10px;background:#0f172a;color:white;border-radius:9px;margin-top:7px" id="dc-code-out">'+esc(data.code)+'</div>'+button('Copiar código','dc-copy',false);result.querySelector('#dc-copy').onclick=async()=>{try{await navigator.clipboard.writeText(data.code);result.querySelector('#dc-copy').textContent='Copiado!';}catch(e){}};}
    catch(e){result.innerHTML=message(e.message,'error');}
    setBusy(btn,false);
  };
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
