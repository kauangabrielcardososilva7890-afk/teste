// ═══════════════════════════════════════════════════════════════════════════
// v5.22.17 — Certificado público na nuvem (não é o A1 .pfx)
// • Sobe .p7b / .cer / .crt (arquivo da foto: Troca de Informações Pessoais)
// • NÃO sobe .pfx e NÃO pede senha
// • Isso NÃO assina NF-e — assinar continua com A1 neste PC
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var TIPOS_OK=['p7b','p7c','cer','crt','der','pem'];
var TIPOS_BLOQUEIO=['pfx','p12'];
var MAX_BYTES=256*1024;

function extDe(nome){
  var m=String(nome||'').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m?m[1]:'';
}
function podeEnviarCert(nome, bytes){
  var ext=extDe(nome);
  if(TIPOS_BLOQUEIO.indexOf(ext)>=0) return {ok:false, motivo:'pfx'};
  if(TIPOS_OK.indexOf(ext)<0 && ext) return {ok:false, motivo:'tipo'};
  if(bytes>MAX_BYTES) return {ok:false, motivo:'tamanho'};
  return {ok:true, ext:ext||'cer'};
}

window.CERT_NUVEM_PURE = {
  TIPOS_OK: TIPOS_OK.slice(),
  TIPOS_BLOQUEIO: TIPOS_BLOQUEIO.slice(),
  podeEnviarCert: podeEnviarCert,
  extDe: extDe
};

if(typeof document==='undefined') return;

function txt(v){ return String(v==null?'':v).trim(); }
function esc(v){ return txt(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }

function listaCerts(){
  if(typeof db==='undefined') return [];
  db.config=db.config||{}; db.config.fiscal=db.config.fiscal||{};
  if(!Array.isArray(db.config.fiscal.certsNuvem)) db.config.fiscal.certsNuvem=[];
  return db.config.fiscal.certsNuvem;
}

function pintarLista(){
  var el=document.getElementById('nfe-certs-nuvem-lista'); if(!el) return;
  var list=listaCerts();
  if(!list.length){ el.innerHTML='<p class="text-[12px] text-slate-500">Nenhum certificado público na nuvem ainda.</p>'; return; }
  el.innerHTML=list.map(function(c,i){
    return '<div class="flex items-center justify-between gap-2 rounded-lg border bg-white p-2 text-[12px]">'+
      '<span><b>'+esc(c.nome)+'</b><br><span class="text-slate-500">'+(c.tipo||'')+' • '+Math.round((c.bytes||0)/1024)+' KB'+(c.enviadoEm?' • '+new Date(c.enviadoEm).toLocaleString('pt-BR'):'')+'</span></span>'+
      '<button type="button" class="neo-btn !h-8 !px-2" onclick="window.nfeRemoverCertNuvem('+i+')">Remover</button></div>';
  }).join('');
}

function garantirBloco(){
  var card=document.getElementById('nfe-config-card'); if(!card) return;
  if(document.getElementById('nfe-certs-nuvem')) return;
  var box=document.createElement('div');
  box.id='nfe-certs-nuvem';
  box.className='mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3';
  box.innerHTML='<p class="font-bold text-[13px]">Certificado na nuvem (público)</p>'+
    '<p class="text-[12px] text-amber-900 mt-1">Pode enviar o arquivo de <b>Troca de Informações Pessoais</b> (.p7b / .cer), uns 9 KB. Ele sobe na nuvem com a configuração.<br>'+
    '<b>Não envie o A1 .pfx.</b> .pfx tem chave privada e senha — continua só neste PC, senha só na hora de assinar. Sem o .pfx a NF-e não assina.</p>'+
    '<div class="mt-2 flex flex-wrap gap-2 items-center">'+
    '<input id="nfe-cert-nuvem-file" type="file" accept=".p7b,.p7c,.cer,.crt,.der,.pem,application/x-pkcs7-certificates,application/pkix-cert" class="text-[12px]">'+
    '<button type="button" id="nfe-cert-nuvem-enviar" class="h-10 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]">Enviar para a nuvem</button>'+
    '</div><div id="nfe-certs-nuvem-lista" class="mt-2 space-y-1"></div>';
  card.appendChild(box);
  document.getElementById('nfe-cert-nuvem-enviar').onclick=function(){ window.nfeEnviarCertNuvem(); };
  pintarLista();
}

window.nfeEnviarCertNuvem=function(){
  var inp=document.getElementById('nfe-cert-nuvem-file');
  var file=inp && inp.files && inp.files[0];
  if(!file){ toastMsg('Escolha o arquivo do certificado.','error'); return; }
  var chk=podeEnviarCert(file.name, file.size);
  if(!chk.ok){
    if(chk.motivo==='pfx') toastMsg('O .pfx A1 não vai para a nuvem. Use o arquivo de Troca de Informações Pessoais (.p7b/.cer).','error');
    else if(chk.motivo==='tamanho') toastMsg('Arquivo grande demais.','error');
    else toastMsg('Tipo não aceito. Use .p7b ou .cer.','error');
    return;
  }
  var reader=new FileReader();
  reader.onload=function(){
    var data=String(reader.result||'');
    var list=listaCerts();
    list.push({
      nome:file.name,
      tipo:chk.ext,
      bytes:file.size,
      data:data,
      enviadoEm:new Date().toISOString()
    });
    if(typeof saveDB==='function') saveDB();
    if(inp) inp.value='';
    pintarLista();
    toastMsg('Certificado público ficou na configuração (sobe na nuvem no próximo sync). Não assina NF-e.','success');
  };
  reader.readAsDataURL(file);
};

window.nfeRemoverCertNuvem=function(i){
  var list=listaCerts();
  if(i<0||i>=list.length) return;
  list.splice(i,1);
  if(typeof saveDB==='function') saveDB();
  pintarLista();
  toastMsg('Removido da nuvem local. Sobe a exclusão no sync.','success');
};

if(typeof window.renderConfig==='function' && !window.renderConfig.__v52217cert){
  var old=window.renderConfig;
  window.renderConfig=function(){
    var r=old.apply(this, arguments);
    setTimeout(garantirBloco, 280);
    setTimeout(garantirBloco, 700);
    return r;
  };
  window.renderConfig.__v52217cert=true;
}
setTimeout(garantirBloco, 900);

console.log('[DIGICOPY] v5.22.17 certificado público na nuvem');
})();
