// ═══════════════════════════════════════════════════════════════════════════
// v5.24.33 — CENTRAL DE NOTA FISCAL (relatório dele: "os menus de NF não
// estão acessando"). O menu lateral de NF chamava toasts de "em breve" —
// agora abre a Central, uma sala própria (DOM fora do miolo, ids fora de
// qualquer tela) com:
//   1. O ESTADO DO CERTIFICADO neste PC (instalado/ausente) + botão "Conferir
//      validade" que pede a senha do cofre UMA VEZ e mostra a data — fim da
//      era "o sistema não sabe que o cert venceu".
//   2. Emissão de verdade: escolhe a notinha OU a leitura e abre a conferência
//      da nota (window.conferirNfe, mesma ponte da v5.22.1→v5.22.8).
//   3. Atalho pra Configuração fiscal (certificado, IE, regime, série...).
// Tudo funciona; onde precisa do certificado válido, para LIMPO com aviso
// explicado — que é o combinado do tópico C ("só falta o certificado").
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function tn(m,t){ if(typeof toast==='function') toast(m,t||'info'); }

function vendasRecentes(){
  var v=(typeof db!=='undefined' && db && db.vendas)||[];
  return v.slice(-40).reverse();
}
function leiturasRecentes(){
  var l=(typeof db!=='undefined' && db && db.leituras)||[];
  return l.slice(-40).reverse();
}
function clientNome(id){
  var cs=(typeof db!=='undefined' && db && db.clientes)||[];
  var c=cs.find(function(x){return x.id===id;});
  return c?String(c.nome||c.fantasia||c.razao||'Cliente'):'sem cliente';
}
function dataBr(d){
  try{ var x=new Date(d||''); return isNaN(x)?'':x.toLocaleDateString('pt-BR'); }
  catch(e){ return ''; }
}

// ── Estado do certificado neste PC + conferência de validade com a senha ──
async function pintarStatusCert(){
  var el=document.getElementById('cnfe-cert-selo');
  if(!el) return;
  var api=window.nfeCertAPI;
  if(!api||typeof api.status!=='function'){
    el.style.background='#f1f5f9'; el.style.color='#64748b';
    el.textContent='Certificado: abra o programinha (.exe) do PC da loja — no navegador/celular não dá pra instalar nem conferir.';
    var bv=document.getElementById('cnfe-validade'); if(bv) bv.style.display='none';
    return;
  }
  try{
    var st=await api.status();
    if(st&&st.installed){
      el.style.background='#dcfce7'; el.style.color='#166534';
      el.textContent='Certificado A1 instalado neste PC. A validade de verdade só aparece com a senha do cofre — clique em "Conferir validade".';
    }else{
      el.style.background='#fee2e2'; el.style.color='#991b1b';
      el.textContent='Nenhum certificado A1 neste PC. Instale na Configuração fiscal (botão lá embaixo) ou a nota para aqui — limpo e avisado, nunca travado.';
    }
  }catch(e){
    el.style.background='#fef3c7'; el.style.color='#92400e';
    el.textContent='Não consegui ler o estado do certificado agora.';
  }
}

async function conferirValidadeAgora(){
  var api=window.nfeCertAPI;
  if(!api||typeof api.validade!=='function'){
    tn('A conferência de validade precisa do programinha (.exe) novo — atualize pra v5.24.33.','info'); return;
  }
  var senha=null;
  try{
    if(window.NFE_ASSINATURA_UI && typeof window.NFE_ASSINATURA_UI.pedirSenhaA1==='function'){
      senha=await window.NFE_ASSINATURA_UI.pedirSenhaA1();
    }else{
      senha=(typeof prompt==='function')?prompt('Senha do certificado (não guardo — uso só pra ler a data):',''):null;
    }
  }catch(e){ senha=null; }
  if(!senha) return; // desistiu, sem drama
  var el=document.getElementById('cnfe-cert-selo'); if(!el) return;
  el.style.background='#e2e8f0'; el.style.color='#334155';
  el.textContent='Lendo o certificado com a senha...';
  try{
    var r=await Promise.resolve(api.validade(senha));
    if(r&&r.ok){
      var dt=r.validoAte?new Date(r.validoAte).toLocaleDateString('pt-BR'):'?';
      if(r.vencido){
        el.style.background='#fee2e2'; el.style.color='#991b1b';
        el.textContent='Certificado VENCIDO em '+dt+' ('+(r.titular||'')+'). Renove na ANACERT/AC e instale o novo .pfx aqui. Atualizado assim que trocar.';
      }else{
        el.style.background='#dcfce7'; el.style.color='#166534';
        el.textContent='Certificado válido até '+dt+' ('+(r.titular||'')+').';
      }
    }else{
      el.style.background='#fef3c7'; el.style.color='#92400e';
      el.textContent='Não li a validade: '+((r&&r.error)||'senha não confere?');
    }
  }catch(e){
    el.style.background='#fef3c7'; el.style.color='#92400e';
    el.textContent='Não li a validade desta vez.';
  }
}

// ── Histórico das notas assinadas neste PC (v5.24.33 — pedido dele) ──────────
// Guarda LOCAL de propósito: a emissão só acontece no PC que tem o certificado
// instalado — então a lista "minhas notas" mora aqui mesmo, sem custar nuvem.
var HIST_KEY='digicopy_nfe_historico';
function historicoNfe(){
  try{ return JSON.parse(localStorage.getItem(HIST_KEY)||'[]')||[]; }
  catch(e){ return []; }
}
function registrarNfeEmitida(r, doc){
  try{
    var lista=historicoNfe();
    var cli=(doc&&doc.cliente&&(doc.cliente.nome||doc.cliente.fantasia||doc.cliente.razao))||(doc&&doc.clienteNome)||'';
    lista.unshift({
      numero:(doc&&doc.numero)||'',
      chave:(r&&r.chave)||(doc&&doc.chave)||'',
      cliente:cli,
      data:Date.now(),
      origem:(doc&&doc.origem)||''
    });
    if(lista.length>200) lista=lista.slice(0,200);
    localStorage.setItem(HIST_KEY, JSON.stringify(lista));
  }catch(e){ /* histórico é melhoria, nunca trava emissão */ }
}
window.registrarNfeEmitida=registrarNfeEmitida;
function pintarHistoricoNfe(){
  var box=document.getElementById('cnfe-historico');
  if(!box) return;
  var lista=historicoNfe();
  if(!lista.length){
    box.innerHTML='<p style="margin:0;font-size:11.5px;color:#94a3b8;font-style:italic">Nenhuma nota assinada neste PC ainda — as próximas aparecem aqui, com a chave.</p>';
    return;
  }
  var linhas=lista.slice(0,8).map(function(n,i){
    var dt=n.data?new Date(n.data).toLocaleDateString('pt-BR'):'';
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #e2e8f0;border-radius:10px;margin-top:6px;">'+
      '<i class="ph ph-file-check" style="color:#166534;font-size:16px"></i>'+
      '<div style="flex:1;min-width:0;"><b style="font-size:12px;color:#0f172a">'+(n.numero?('Nº '+esc(n.numero)):'NF assinada')+'</b>'+
      '<span style="font-size:11px;color:#64748b"> • '+esc(dt)+'</span>'+
      '<div style="font-size:10.5px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(n.cliente||'sem cliente')+'</div></div>'+
      (n.chave?'<button type="button" data-cnfecopi="'+esc(n.chave)+'" style="border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:4px 8px;font-size:10.5px;font-weight:700;color:#0a1e8a;cursor:pointer">copiar chave</button>':'')+
    '</div>';
  }).join('');
  box.innerHTML='<p style="margin:0 0 2px;font-size:11px;color:#64748b;font-weight:700">'+lista.length+' nota(s) assinada(s) neste PC — últimas 8:</p>'+linhas;
  var bts=box.querySelectorAll('[data-cnfecopi]');
  for(var i=0;i<bts.length;i++){
    bts[i].onclick=function(){
      try{ navigator.clipboard.writeText(this.getAttribute('data-cnfecopi')); tn('Chave copiada.','success'); }
      catch(e){ tn('Chave: '+this.getAttribute('data-cnfecopi'),'info'); }
    };
  }
}

// ── A Central ──
function abrirCentralNfe(){
  var root=document.getElementById('central-nfe-modal');
  if(root){ root.remove(); }
  var vOpts=vendasRecentes().map(function(v){
    return '<option value="'+esc(v.id)+'">'+(esc(v.numero||v.codigo||'sem nº'))+' • '+esc(dataBr(v.data||v.criadoEm))+' • '+esc(clientNome(v.clienteId)).slice(0,38)+'</option>';
  }).join('');
  var lOpts=leiturasRecentes().map(function(l){
    return '<option value="'+esc(l.id)+'">'+(esc(l.numero||l.codigo||'sem nº'))+' • '+esc(dataBr(l.data||l.dataLeitura))+' • '+esc(clientNome(l.clienteId)).slice(0,38)+'</option>';
  }).join('');
  var box=document.createElement('div');
  box.id='central-nfe-modal';
  box.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(10,20,60,.45);display:flex;align-items:center;justify-content:center;padding:14px;';
  box.innerHTML=
    '<div style="background:#fff;border-radius:20px;max-width:520px;width:100%;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.25);font-family:inherit;max-height:92vh;overflow:auto;">'+
      '<div style="display:flex;align-items:center;gap:10px;">'+
        '<div style="width:46px;height:46px;border-radius:14px;background:#eef2ff;display:grid;place-items:center;"><i class="ph ph-file-text" style="font-size:24px;color:#0a1e8a"></i></div>'+
        '<div><h3 style="margin:0;font-size:17px;font-weight:900;color:#0a1e8a">Central de Nota Fiscal</h3>'+
        '<p style="margin:2px 0 0;font-size:11.5px;color:#64748b">Tudo de NF num lugar só — o que falta é o certificado renovado, e a tela avisa onde parar.</p></div>'+
      '</div>'+
      '<div id="cnfe-cert-selo" style="margin-top:12px;border-radius:12px;padding:10px 12px;font-size:12px;font-weight:600;background:#f1f5f9;color:#64748b">Lendo o certificado...</div>'+
      '<button id="cnfe-validade" type="button" style="margin-top:8px;width:100%;height:38px;border:1px dashed #94a3b8;border-radius:12px;background:#fff;color:#334155;font-weight:700;font-size:12px;cursor:pointer">Conferir validade do certificado (pede a senha do cofre)</button>'+
      '<div style="margin-top:14px;border-top:1px solid #e2e8f0;padding-top:14px;">'+
        '<h4 style="margin:0 0 6px;font-size:13px;font-weight:800;color:#0f172a">Emitir a partir de uma notinha</h4>'+
        '<select id="cnfe-venda" style="width:100%;height:40px;border:1px solid #cbd5e1;border-radius:12px;padding:0 10px;font-size:12.5px;"><option value="">— escolha a notinha —</option>'+vOpts+'</select>'+
      '</div>'+
      '<div style="margin-top:12px;">'+
        '<h4 style="margin:0 0 6px;font-size:13px;font-weight:800;color:#0f172a">Emitir a partir de uma leitura</h4>'+
        '<select id="cnfe-leitura" style="width:100%;height:40px;border:1px solid #cbd5e1;border-radius:12px;padding:0 10px;font-size:12.5px;"><option value="">— escolha a leitura —</option>'+lOpts+'</select>'+
      '</div>'+
      '<div style="display:flex;gap:10px;margin-top:16px;">'+
        '<button id="cnfe-emitir" type="button" style="flex:1;height:44px;border:0;border-radius:14px;background:#0a1e8a;color:#fff;font-weight:800;font-size:13px;cursor:pointer">Conferir e emitir</button>'+
        '<button id="cnfe-config" type="button" style="flex:1;height:44px;border:1px solid #cbd5e1;border-radius:14px;background:#fff;color:#475569;font-weight:800;font-size:12.5px;cursor:pointer">Configuração fiscal</button>'+
      '</div>'+
      '<p style="margin:12px 0 0;font-size:10.5px;color:#94a3b8;text-align:center">A emissão para LIMPO se o certificado estiver vencido — a mensagem diz a data certa. Nada some: notinha e leitura seguem iguais.</p>'+
      '<div style="margin-top:10px;border-top:1px solid #e2e8f0;padding-top:10px;">'+
        '<h4 style="margin:0;font-size:12.5px;font-weight:800;color:#0f172a"><i class="ph ph-clock-counter-clockwise"></i> Histórico das notas assinadas</h4>'+
        '<div id="cnfe-historico" style="margin-top:6px;"></div>'+
      '</div>'+
      '<button id="cnfe-fechar" type="button" style="margin-top:8px;width:100%;height:34px;border:0;background:none;color:#64748b;font-weight:700;font-size:12px;cursor:pointer">Fechar</button>'+
    '</div>';
  document.body.appendChild(box);
  document.getElementById('cnfe-fechar').onclick=function(){ var d=document.getElementById('central-nfe-modal'); if(d) d.remove(); };
  box.addEventListener('click',function(ev){ if(ev.target===box) box.remove(); });
  document.getElementById('cnfe-validade').onclick=conferirValidadeAgora;
  document.getElementById('cnfe-config').onclick=function(){ var d=document.getElementById('central-nfe-modal'); if(d) d.remove(); abrirPerfilTributario(); };
  document.getElementById('cnfe-emitir').onclick=function(){
    var vid=document.getElementById('cnfe-venda').value;
    var lid=document.getElementById('cnfe-leitura').value;
    if(!vid&&!lid){ tn('Escolha a notinha ou a leitura pra emitir.','info'); return; }
    var d=document.getElementById('central-nfe-modal'); if(d) d.remove();
    // v5221 entrega: a mesma ponte da notinha/leitura — venda vence se as duas vierem
    Promise.resolve(window.conferirNfe(vid?'venda':'leitura', vid||lid)).catch(function(){
      tn('Não foi possível abrir a conferência agora. Notinha e leitura seguem iguais.','error');
    });
  };
  pintarStatusCert();
  pintarHistoricoNfe();
}
window.abrirCentralNfe=abrirCentralNfe;

function abrirPerfilTributario(focoNcm){
  if(typeof navigateTo==='function') navigateTo('config');
  var tent=0;
  var t=setInterval(function(){
    tent++;
    var card=document.getElementById('nfe-config-card');
    if(card){
      clearInterval(t);
      try{ card.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){}
      tn(focoNcm?'NCM mora na ficha de cada produto; aqui embaixo ficam as fiscais da NF.':'(Configuração fiscal e certificado aqui embaixo.)','info');
    }else if(tent>10){ clearInterval(t); }
  },300);
}
window.abrirPerfilTributario=abrirPerfilTributario;

window.NFE_CENTRAL_V52425={ abrirCentralNfe:abrirCentralNfe, abrirPerfilTributario:abrirPerfilTributario, vendasRecentes:vendasRecentes, leiturasRecentes:leiturasRecentes, historicoNfe:historicoNfe, registrarNfeEmitida:registrarNfeEmitida };
window.NFE_CENTRAL_V52426={ historicoNfe:historicoNfe, registrarNfeEmitida:registrarNfeEmitida };
console.log('[DIGICOPY] Central de Nota Fiscal pronta (v5.24.33) — menu NF abre de verdade');
})();
