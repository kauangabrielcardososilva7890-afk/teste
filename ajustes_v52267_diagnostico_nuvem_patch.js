// ═══════════════════════════════════════════════════════════════════════════
// v5.22.67 — Diagnóstico rápido da Nuvem no indicador pulsante.
// Só consulta estado local e endpoints GET de saúde/status; nunca grava,
// autoriza dispositivo, envia registros ou mostra dados de clientes.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window==='undefined'||typeof document==='undefined') return;
if(window.__DIGICOPY_DIAG_NUVEM_V1) return;
window.__DIGICOPY_DIAG_NUVEM_V1=true;

function node(tag, text, css){
  var el=document.createElement(tag);
  if(text!=null) el.textContent=String(text);
  if(css) el.style.cssText=css;
  return el;
}
function dataLocal(){
  try{
    var sync=window.DIGICOPY_CLOUD_SYNC;
    return sync&&typeof sync.info==='function'?sync.info():{};
  }catch(e){ return {erroLocal:String(e&&e.message||e)}; }
}
function formatarHora(ts){
  var n=Number(ts)||0;
  if(!n) return 'Ainda não houve confirmação nesta sessão';
  try{return new Date(n).toLocaleString('pt-BR');}catch(e){return 'Horário indisponível';}
}
function criarLinha(rotulo, valor){
  var row=node('div',null,'display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #eef2f7;font-size:13px;');
  var a=node('span',rotulo,'color:#64748b');
  var b=node('b',valor,'color:#0f172a;text-align:right;max-width:65%;overflow-wrap:anywhere');
  row.appendChild(a);row.appendChild(b);return row;
}
function abrirDiagnosticoNuvem(){
  var existente=document.getElementById('dc-cloud-diagnostic');
  if(existente){ existente.style.display='flex'; return; }
  var overlay=node('div',null,'position:fixed;inset:0;z-index:100001;background:rgba(15,23,42,.58);display:flex;align-items:center;justify-content:center;padding:16px;');
  overlay.id='dc-cloud-diagnostic';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','dc-cloud-diagnostic-title');
  var card=node('section',null,'width:min(520px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);padding:20px 22px;font-family:inherit;');
  var top=node('div',null,'display:flex;align-items:flex-start;justify-content:space-between;gap:12px;');
  var title=node('h2','Diagnóstico da Nuvem','margin:0;font-size:18px;font-weight:900;color:#0a1e8a;');title.id='dc-cloud-diagnostic-title';
  var close=node('button','Fechar','border:0;border-radius:9px;background:#f1f5f9;color:#334155;padding:7px 10px;font-weight:800;cursor:pointer;');close.type='button';close.setAttribute('aria-label','Fechar diagnóstico');
  top.appendChild(title);top.appendChild(close);card.appendChild(top);
  card.appendChild(node('p','Os registros ficam na nuvem. Alterações aguardando confirmação existem apenas na memória desta sessão; uma fila antiga de versão anterior permanece até a nuvem confirmar o envio.','margin:7px 0 12px;color:#64748b;font-size:12px;line-height:1.5;'));
  var status=node('div','Consultando status…','padding:11px 12px;border-radius:11px;background:#eff6ff;color:#1d4ed8;font-size:13px;font-weight:800;');status.id='dc-cloud-diagnostic-status';card.appendChild(status);
  var rows=node('div');rows.id='dc-cloud-diagnostic-rows';card.appendChild(rows);
  var error=node('p','','margin:10px 0 0;color:#b91c1c;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;');error.id='dc-cloud-diagnostic-error';card.appendChild(error);
  var actions=node('div',null,'display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:16px;');
  var refresh=node('button','Atualizar diagnóstico','border:0;border-radius:10px;background:#0a1e8a;color:#fff;padding:9px 13px;font-weight:800;cursor:pointer;');refresh.type='button';refresh.id='dc-cloud-diagnostic-refresh';
  var config=node('button','Configurações da nuvem','border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#334155;padding:9px 13px;font-weight:800;cursor:pointer;');config.type='button';
  actions.appendChild(config);actions.appendChild(refresh);card.appendChild(actions);overlay.appendChild(card);document.body.appendChild(overlay);
  function fechar(){overlay.remove();document.removeEventListener('keydown',onKey);}
  function onKey(e){if(e.key==='Escape')fechar();}
  close.onclick=fechar;overlay.addEventListener('click',function(e){if(e.target===overlay)fechar();});document.addEventListener('keydown',onKey);
  config.onclick=function(){fechar();if(typeof window.abrirCloudflareNuvem==='function')window.abrirCloudflareNuvem();};
  refresh.onclick=atualizar;atualizar();

  async function atualizar(){
    refresh.disabled=true;refresh.textContent='Verificando…';status.textContent='Consultando a saúde do serviço…';status.style.background='#eff6ff';status.style.color='#1d4ed8';error.textContent='';rows.innerHTML='';
    var local=dataLocal(), cloud=null, falha='';
    try{
      var api=window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.api;
      if(typeof api==='function') cloud=await api('/health',{method:'GET'});
      else falha='Conector da nuvem não está carregado nesta sessão.';
    }catch(e){falha=String(e&&e.message||e||'Não foi possível consultar a nuvem.');}
    var autorizado=!!local.authorized;
    var pronto=!!(cloud&&(cloud.ready===true||cloud.ok===true));
    var erroSync=String(local.lastError||'').trim();
    var fila=Number(local.outbox)||0;
    var saudavel=pronto&&autorizado&&!erroSync&&fila===0;
    status.textContent=saudavel?'Tudo certo: computador autorizado e nuvem respondendo.':(pronto&&!autorizado?'Serviço respondendo; este computador ainda não está autorizado.':(pronto?'Serviço responde; há itens que precisam de atenção.':(falha?'Não consegui confirmar a resposta da nuvem.':'Nuvem respondeu, mas o serviço ainda não está pronto.')));
    status.style.background=saudavel?'#ecfdf5':(pronto?'#fffbeb':'#fef2f2');
    status.style.color=saudavel?'#047857':(pronto?'#92400e':'#b91c1c');
    var versaoServico=String((cloud&&(cloud.versao||cloud.workerVersao||cloud.version))||'Não informada');
    rows.appendChild(criarLinha('Autorização deste computador',autorizado?'Sim':'Não'));
    rows.appendChild(criarLinha('Serviço da nuvem',cloud?(pronto?'Respondendo e pronto':'Respondendo, configuração pendente'):'Sem resposta confirmada'));
    rows.appendChild(criarLinha('Fila nova (somente memória)',fila+' alteração(ões)'));
    if(Number(local.legacyOutboxPending)>0)rows.appendChild(criarLinha('Fila antiga aguardando confirmação',Number(local.legacyOutboxPending)+' alteração(ões) preservadas até confirmação'));
    rows.appendChild(criarLinha('Base de negócio no navegador','não é gravada por esta versão'));
    rows.appendChild(criarLinha('Última sincronização confirmada',formatarHora(local.emDiaAte||local.lastOk)));
    rows.appendChild(criarLinha('Versão do sistema',String(window.DIGICOPY_APP_VERSION||'—')));
    rows.appendChild(criarLinha('Versão da nuvem',versaoServico));
    if(falha)error.textContent=falha;
    else if(erroSync)error.textContent='Último erro de sincronização: '+erroSync;
    refresh.disabled=false;refresh.textContent='Atualizar diagnóstico';
  }
}
window.abrirDiagnosticoNuvem=abrirDiagnosticoNuvem;
var clickDelegadoLigado=false;
function ligar(){
  if(clickDelegadoLigado) return;
  clickDelegadoLigado=true;
  // A barra pode ser recriada por showApp; a delegação continua valendo para o novo nó.
  document.addEventListener('click',function(e){
    var alvo=e.target;
    var botao=alvo&&typeof alvo.closest==='function'?alvo.closest('#dc-cloud-diag-trigger'):null;
    if(!botao) return;
    e.preventDefault();
    abrirDiagnosticoNuvem();
  },true);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ligar); else ligar();
})();
