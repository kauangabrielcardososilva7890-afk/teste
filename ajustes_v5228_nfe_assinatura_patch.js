// ═══════════════════════════════════════════════════════════════════════════
// v5.22.8 — assinar NF-e com A1 (senha só na hora)
// • Não grava a senha. Não envia para a SEFAZ. Não altera venda/leitura/nuvem.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }

function lembrarDocumento(){
  const P=window.NFE_EMISSAO_PURE;
  if(!P||typeof P.montarDocumento!=='function'||P.montarDocumento.__v5228) return;
  const old=P.montarDocumento;
  P.montarDocumento=function(){
    const doc=old.apply(this,arguments);
    window.__nfeUltimoDoc=doc;
    return doc;
  };
  P.montarDocumento.__v5228=true;
}

function pedirSenhaA1(){
  return new Promise(function(resolve){
    let root=document.getElementById('nfe-senha-modal');
    if(root) root.remove();
    root=document.createElement('div');
    root.id='nfe-senha-modal';
    root.style.cssText='position:fixed;inset:0;z-index:100080;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;padding:18px';
    root.innerHTML='<div style="width:min(420px,94vw);background:white;border-radius:16px;padding:18px">'+
      '<b style="font-size:15px">Senha do certificado A1</b>'+
      '<p style="font-size:12px;color:#64748b;margin:8px 0 12px">A senha vale só agora. Não é salva e não vai para a nuvem.</p>'+
      '<input id="nfe-senha-a1" type="password" autocomplete="off" class="w-full h-11 px-3 rounded-xl border" style="width:100%;height:44px;border:1px solid #cbd5e1;border-radius:10px;padding:0 12px">'+
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">'+
      '<button id="nfe-senha-x" type="button" style="height:38px;padding:0 14px;border-radius:10px;border:1px solid #cbd5e1;background:white;font-weight:800">Cancelar</button>'+
      '<button id="nfe-senha-ok" type="button" style="height:38px;padding:0 14px;border-radius:10px;background:#0a1e8a;color:white;font-weight:800">Assinar</button>'+
      '</div></div>';
    document.body.appendChild(root);
    const input=root.querySelector('#nfe-senha-a1');
    function fechar(val){
      try{ if(input) input.value=''; }catch(e){}
      root.remove();
      resolve(val);
    }
    root.querySelector('#nfe-senha-x').onclick=function(){ fechar(null); };
    root.querySelector('#nfe-senha-ok').onclick=function(){ fechar(txt(input.value)); };
    root.addEventListener('click',function(ev){ if(ev.target===root) fechar(null); });
    input.onkeydown=function(ev){ if(ev.key==='Enter') fechar(txt(input.value)); };
    setTimeout(function(){ try{ input.focus(); }catch(e){} },40);
  });
}

function mostrarXmlAssinado(xml,chave,certNome){
  let root=document.getElementById('nfe-xml-modal');
  if(root) root.remove();
  root=document.createElement('div');
  root.id='nfe-xml-modal';
  root.style.cssText='position:fixed;inset:0;z-index:100070;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;padding:18px';
  root.innerHTML='<div style="width:min(820px,96vw);max-height:92vh;overflow:auto;background:white;border-radius:18px;padding:18px">'+
    '<b>XML assinado</b>'+
    '<p style="font-size:12px;color:#166534;margin:8px 0">Assinado neste PC'+(certNome?' • '+String(certNome).replace(/[<>]/g,''):'')+'. Ainda não foi enviado à SEFAZ.</p>'+
    (chave?'<p style="font-size:12px;word-break:break-all"><b>Chave</b> '+chave+'</p>':'')+
    '<textarea id="nfe-xml-out" readonly style="width:100%;height:280px;font:11px/1.4 monospace;border:1px solid #e2e8f0;border-radius:10px;padding:8px"></textarea>'+
    '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">'+
    '<button id="nfe-xml-copy" type="button" style="height:38px;padding:0 14px;border-radius:10px;border:1px solid #cbd5e1;background:white;font-weight:800">Copiar XML</button>'+
    '<button id="nfe-xml-down" type="button" style="height:38px;padding:0 14px;border-radius:10px;border:1px solid #cbd5e1;background:white;font-weight:800">Baixar XML</button>'+
    '<button id="nfe-xml-x" type="button" style="height:38px;padding:0 14px;border-radius:10px;background:#0a1e8a;color:white;font-weight:800">Fechar</button>'+
    '</div></div>';
  document.body.appendChild(root);
  const ta=root.querySelector('#nfe-xml-out');
  ta.value=xml;
  root.querySelector('#nfe-xml-x').onclick=function(){ root.remove(); };
  root.addEventListener('click',function(ev){ if(ev.target===root) root.remove(); });
  root.querySelector('#nfe-xml-copy').onclick=async function(){
    try{ await navigator.clipboard.writeText(xml); if(typeof toast==='function') toast('XML copiado','success'); }
    catch(e){ ta.select(); }
  };
  root.querySelector('#nfe-xml-down').onclick=function(){
    const blob=new Blob([xml],{type:'application/xml'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='nfe-'+(chave||'assinada')+'.xml';
    a.click();
  };
}

async function assinarUltimo(){
  const P=window.NFE_EMISSAO_PURE;
  const doc=window.__nfeUltimoDoc;
  if(!doc||!doc.ok||!P||typeof P.montarXml!=='function'){
    if(typeof toast==='function') toast('Conferência incompleta. Corrija os dados primeiro.','error');
    return;
  }
  const api=window.nfeCertAPI;
  if(!api||typeof api.assinar!=='function'){
    if(typeof toast==='function') toast('Abra o .exe neste PC para assinar com o A1.','error');
    return;
  }
  const senha=await pedirSenhaA1();
  if(senha==null) return;
  if(!senha){ if(typeof toast==='function') toast('Informe a senha do A1.','error'); return; }
  try{
    const xml=P.montarXml(doc);
    const r=await api.assinar(xml, senha);
    if(r&&r.ok&&r.xmlAssinado){
      mostrarXmlAssinado(r.xmlAssinado, r.chave||doc.chave, r.certificado||'');
    }else{
      if(typeof window.lfbAlert==='function') window.lfbAlert((r&&r.error)||'Não foi possível assinar.','Assinatura');
      else if(typeof toast==='function') toast((r&&r.error)||'Não foi possível assinar.','error');
    }
  }catch(e){
    if(typeof toast==='function') toast('Não foi possível assinar. Venda e leitura continuam iguais.','error');
  }
}

function injetarBotaoAssinar(){
  const modal=document.getElementById('nfe-conf-modal');
  if(!modal||modal.querySelector('#nfe-assinar')) return;
  const box=modal.querySelector('div > div:last-child')||modal;
  const ok=window.__nfeUltimoDoc&&window.__nfeUltimoDoc.ok;
  if(!ok) return;
  const b=document.createElement('button');
  b.id='nfe-assinar';
  b.type='button';
  b.style.cssText='margin-top:14px;height:40px;padding:0 16px;border-radius:10px;background:#0a1e8a;color:white;font-weight:800';
  b.textContent='Assinar com A1';
  b.onclick=function(ev){ if(ev){ ev.preventDefault(); ev.stopPropagation(); } assinarUltimo(); };
  box.appendChild(b);
}

if(typeof document!=='undefined'){
  lembrarDocumento();
  const orig=window.conferirNfe;
  if(typeof orig==='function'&&!orig.__v5228){
    window.conferirNfe=async function(){
      const r=await orig.apply(this,arguments);
      setTimeout(function(){ try{ injetarBotaoAssinar(); }catch(e){} },40);
      setTimeout(function(){ try{ injetarBotaoAssinar(); }catch(e){} },200);
      return r;
    };
    window.conferirNfe.__v5228=true;
  }
}

window.NFE_ASSINATURA_UI={pedirSenhaA1:typeof document==='undefined'?undefined:pedirSenhaA1};
console.log('[DIGICOPY] v5.22.8 assinatura A1 isolada');
})();
