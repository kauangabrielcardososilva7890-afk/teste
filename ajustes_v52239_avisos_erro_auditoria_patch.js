// ═══════════════════════════════════════════════════════════════════════════
// v5.22.39 — Se algo quebrar: aviso na tela. Detalhe técnico só na auditoria.
// v5.24.24 — PEDIDO DELE (mudou o destino do detalhe): erro indevido NÃO vai
//            mais pra auditoria — vai pro erro.txt visível (%APPDATA% no .exe,
//            download no navegador/celular) e o aviso ganha botão pra abrir
//            o arquivo + OK. Auditoria fica só com "quem fez o quê", visível
//            pra todos os logins outra vez (ajustes_v5197).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function detalheErro(msg, extra){
  var d=String(msg==null?'erro':msg);
  if(extra) d+=' | '+String(extra);
  if(d.length>800) d=d.slice(0,800);
  return d;
}

function ignoraRuido(msg){
  var t=String(msg||'').toLowerCase();
  if(!t) return true;
  if(/resizeobserver|script error\.|canceled|abort|the operation was aborted/.test(t)) return true;
  return false;
}

window.V52239_ERRO_PURE = {
  detalheErro: detalheErro,
  ignoraRuido: ignoraRuido
};

if(typeof document==='undefined') return;

// v5.24.24 — PEDIDO DELE: o erro não mora mais na auditoria. Agora vira linha
// num erro.txt visível (%APPDATA% no .exe; download no navegador/celular), com
// aviso na tela "mande esse arquivo ao técnico". Auditoria volta a ser quadro
// de "quem fez o quê", visível pra todos os logins (v5197).
var ultimoAviso=0;
var REGISTRANDO=false;   // anti-recursão: um erro dentro do registro não vira loop
var bufferErros=[];      // memória que alimenta o download (navegador/celular)

// v5.24.24 — resposta à pergunta dele: "e se eu perder o aviso, como baixo de
// novo?" No navegador a memória morria num F5. Agora ela SOBREVIVE ao refresh
// (fica salva local, mesmo lugar do banco): se ele deu OK sem baixar, o erro
// continua lá e volta no próximo aviso... e dá pra chamar o download direto
// por window.digicopyBaixarErroTxt().
try{
  var salvoTxt=JSON.parse((typeof localStorage!=='undefined'?localStorage.getItem('digicopy_erros_txt'):null)||'[]');
  if(Array.isArray(salvoTxt)) bufferErros=salvoTxt.slice(-500);
}catch(e){}

function montarLinhaErroTxt(det){
  var agora=new Date();
  function p2(n){ return (n<10?'0':'')+n; }
  var stamp=agora.getFullYear()+'-'+p2(agora.getMonth()+1)+'-'+p2(agora.getDate())+' '+p2(agora.getHours())+':'+p2(agora.getMinutes())+':'+p2(agora.getSeconds());
  var versao=(typeof window.DIGICOPY_APP_VERSION==='string')?window.DIGICOPY_APP_VERSION:'?';
  var sess=null; try{ sess=(typeof getSession==='function')?getSession():null; }catch(e){}
  var usuario=(sess&&(sess.usuarioNome||sess.login))||'sem login';
  var tela='';
  try{
    var at=document.querySelector('[data-nav].bg-blue-50, [data-nav].active');
    if(at) tela=String(at.getAttribute('data-nav')||'');
  }catch(e){}
  return '['+stamp+' | v'+versao+' | '+usuario+(tela?' | tela: '+tela:'')+'] '+det;
}

function gravarErroTxt(linha){
  bufferErros.push(linha);
  if(bufferErros.length>500) bufferErros=bufferErros.slice(-500);
  try{ localStorage.setItem('digicopy_erros_txt', JSON.stringify(bufferErros)); }catch(e){}
  try{
    if(window.erroTxtAPI && typeof window.erroTxtAPI.append==='function'){
      window.erroTxtAPI.append(linha).catch(function(){});
    }
  }catch(e){}
}

function baixarErroTxt(){
  try{
    var corpo=bufferErros.join('\n')+'\n';
    var blob=new Blob([corpo],{type:'text/plain;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url; a.download='erro.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
      try{ URL.revokeObjectURL(url); }catch(e){}
      try{ a.remove(); }catch(e){}
    },1200);
  }catch(e){}
}

// v5.24.24 — pedido dele: BOTÃO visível pra abrir/baixar o erro.txt (o
// resgate por console não serve pra ele). Mesma ação do aviso, agora pública:
// o rodapé do sistema ganha um botãozinho "erro.txt" sempre à mão.
// v5.24.24 — SININHO DE ATUALIZAÇÃO (pedido dele): quando abrir o sistema e
// existir versão nova publicada na nuvem, mostra UMA ÚNICA VEZ (por versão,
// por aparelho) o aviso com [Abrir pra baixar] + [Baixar depois]. Qualquer
// um dos dois marca a versão como vista — o resto é silêncio até a próxima.
function cmpVersaoMaior(nova, atual){
  var a=String(nova||'').replace(/^v/i,'').split('.');
  var b=String(atual||'').replace(/^v/i,'').split('.');
  for(var i=0;i<Math.max(a.length,b.length);i++){
    var x=parseInt(a[i],10)||0, y=parseInt(b[i],10)||0;
    if(x!==y) return x>y;
  }
  return false;
}
window.AVISOS_V52423_PURE={ cmpVersaoMaior:cmpVersaoMaior };

function chaveAtualizacaoVista(v){ return 'digicopy_upd_visto_'+String(v||'').replace(/^v/i,''); }

function mostrarAvisoAtualizacao(rel){
  if(document.getElementById('aviso-update-card')) return;
  var versao=String(rel.versao||'').replace(/^v/i,'');
  var notas=String(rel.notas||'').trim();
  var url=String(rel.url||'').trim();
  if(!versao||!url) return;
  var marcarVisto=function(){ try{ localStorage.setItem(chaveAtualizacaoVista(versao),'1'); }catch(e){} };
  var box=document.createElement('div');
  box.id='aviso-update-card';
  box.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(10,20,60,.45);display:flex;align-items:center;justify-content:center;padding:16px;';
  box.innerHTML=
    '<div style="background:#fff;border-radius:22px;max-width:430px;width:100%;padding:26px 24px 22px;box-shadow:0 24px 70px rgba(0,0,0,.25);font-family:inherit;text-align:center;">'+
      '<div style="width:64px;height:64px;margin:0 auto 12px;border-radius:20px;background:#eef2ff;display:grid;place-items:center;"><i class="ph ph-download-simple" style="font-size:30px;color:#0a1e8a"></i></div>'+
      '<h3 style="margin:0 0 4px;font-size:19px;font-weight:900;color:#0a1e8a">Atualização nova pra baixar</h3>'+
      '<p style="margin:0 0 10px;font-size:12.5px;color:#334155">Versão <b>v'+versao+'</b> disponível. Baixar e instalar por cima, sem perder nada — o banco e a nuvem não mexem.</p>'+
      (notas?'<div style="text-align:left;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px;font-size:12px;color:#475569;white-space:pre-wrap;max-height:180px;overflow:auto;word-wrap:break-word">'+String(notas).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+'</div>':'')+
      '<div style="display:flex;gap:10px;margin-top:16px">'+
        '<button id="aviso-update-baixar" style="flex:1;height:44px;border:0;border-radius:14px;background:#0a1e8a;color:#fff;font-weight:800;font-size:13.5px;cursor:pointer">Abrir pra baixar</button>'+
        '<button id="aviso-update-depois" style="flex:1;height:44px;border:1px solid #cbd5e1;border-radius:14px;background:#fff;color:#475569;font-weight:800;font-size:13.5px;cursor:pointer">Baixar depois</button>'+
      '</div>'+
      '<p style="margin:10px 0 0;font-size:10.5px;color:#94a3b8">Esse aviso aparece uma única vez nesta versão — na próxima, ele volta te avisar.</p>'+
    '</div>';
  document.body.appendChild(box);
  document.getElementById('aviso-update-depois').onclick=function(){ marcarVisto(); var d=document.getElementById('aviso-update-card'); if(d) d.remove(); };
  document.getElementById('aviso-update-baixar').onclick=function(){
    marcarVisto();
    try{ window.open(url,'_blank'); }catch(e){}
    var d=document.getElementById('aviso-update-card'); if(d) d.remove();
  };
}

function verificarAtualizacaoNova(){
  try{
    var api=window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.api;
    if(typeof api!=='function') return;
    var atual=String(window.DIGICOPY_APP_VERSION||'');
    Promise.resolve(api('/v1/app-release',{method:'GET'})).then(function(rel){
      if(!rel||!rel.ok||!rel.versao) return;
      if(!cmpVersaoMaior(rel.versao,atual)) return;
      try{ if(localStorage.getItem(chaveAtualizacaoVista(rel.versao))) return; }catch(e){}
      mostrarAvisoAtualizacao(rel);
    }).catch(function(){ /* sem sininho sem nuvem — não atrapalha ninguém */ });
  }catch(e){ /* idem */ }
}
window.digicopyVerificarAtualizacaoAgora=verificarAtualizacaoNova;

function agendarChecagemInicial(){
  if(window.__checagemAtualizacaoFeita) return;
  window.__checagemAtualizacaoFeita=true;
  var tent=0;
  var t=setInterval(function(){
    tent++;
    var logado=false;
    try{ logado=typeof getSession==='function' && !!getSession(); }catch(e){}
    if(logado){ clearInterval(t); setTimeout(verificarAtualizacaoNova, 2500); }
    else if(tent>60) clearInterval(t); /* ~2 min tentando e desiste em silêncio */
  },2000);
}
if(typeof document!=='undefined') agendarChecagemInicial();

// v5.24.24 — o card publicador nas Configurações (ele marca a versão, cola o
// link do .exe, escreve as notas — ou me pede pra escrever, como ele disse).
function aplicarCardPublicarAtualizacao(){
  if(document.getElementById('card-publicar-atualizacao')) return;
  var grid=document.querySelector('#view-config .grid');
  if(!grid) return;
  var card=document.createElement('div');
  card.id='card-publicar-atualizacao';
  card.className='rounded-[16px] bg-white border p-6 lg:col-span-3';
  card.innerHTML=
    '<h4 class="font-bold text-[14px]"><i class="ph ph-rocket-launch"></i> Publicar nova atualização</h4>'+
    '<p class="mt-1 text-[11.5px] text-slate-500">Marque a versão nova, cole o link do arquivo (.exe) e escreva as notas (se quiser, me pede que eu monto a redação pra você). Cada aparelho vê o aviso UMA única vez.</p>'+
    '<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">'+
      '<div><label class="text-[11px] uppercase font-bold text-slate-500">Versão nova</label><input id="pub-upd-versao" class="mt-1 w-full h-10 px-3 rounded-xl border text-[13px] font-mono" placeholder="5.24.24"></div>'+
      '<div class="md:col-span-2"><label class="text-[11px] uppercase font-bold text-slate-500">Link do arquivo (.exe — https)</label><input id="pub-upd-url" class="mt-1 w-full h-10 px-3 rounded-xl border text-[13px] font-mono" placeholder="https://..."></div>'+
      '<div class="md:col-span-3"><label class="text-[11px] uppercase font-bold text-slate-500">Notas da atualização (o que mudou)</label><textarea id="pub-upd-notas" class="mt-1 w-full h-28 p-3 rounded-xl border text-[12.5px]" placeholder="1. ...&#10;2. ...&#10;3. ..."></textarea></div>'+
    '</div>'+
    '<div class="mt-3 flex items-center gap-3"><button id="pub-upd-enviar" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13px] font-bold">Publicar atualização</button><small class="text-[11px] text-slate-500">Apaga e refaz quando quiser — o aviso só aparece quando a versão nova for MAIOR que a do aparelho.</small></div>'+
    '<div class="mt-3 pt-3 border-t"><small class="text-[11px] text-slate-500">Seu site próprio de atualizações (histórico completo com as notas e o link de cada versão):</small> <a id="pub-upd-site" href="#" target="_blank" rel="noopener" class="text-[12px] font-bold text-[#0a1e8a] underline break-all">abrir site</a></div>';
  grid.appendChild(card);
  // v5.24.24 — aponta o "seu site" usando a mesma URL da nuvem já configurada
  // no app (cloudflare_sync_patch.js expõe window.DIGICOPY_CLOUD.API).
  try{
    var apiBase=String((window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.API)||'').replace(/\/+$/,'');
    var siteEl=document.getElementById('pub-upd-site');
    if(siteEl&&apiBase){ siteEl.href=apiBase+'/atualizacoes'; siteEl.textContent=apiBase+'/atualizacoes'; }
  }catch(e){}
  document.getElementById('pub-upd-enviar').onclick=function(){
    var versao=String(document.getElementById('pub-upd-versao').value||'').trim();
    var url=String(document.getElementById('pub-upd-url').value||'').trim();
    var notas=String(document.getElementById('pub-upd-notas').value||'');
    if(!versao||!url){ if(window.lfbAlert) window.lfbAlert('Preencha a versão e o link do arquivo.','Publicar atualização'); return; }
    var api=window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.api;
    if(typeof api!=='function'){ if(window.lfbAlert) window.lfbAlert('Nuvem não disponível agora. Tente de novo.','Publicar atualização'); return; }
    var btn=document.getElementById('pub-upd-enviar');
    btn.disabled=true; btn.textContent='Publicando...';
    Promise.resolve(api('/v1/app-release',{method:'POST',body:JSON.stringify({versao:versao,url:url,notas:notas})})).then(function(r){
      btn.disabled=false; btn.textContent='Publicar atualização';
      if(r&&r.ok){ if(typeof toast==='function') toast('Atualização v'+r.versao+' publicada — os aparelhos vão ver uma vez','success'); }
      else if(window.lfbAlert) window.lfbAlert('A nuvem recusou: '+((r&&r.message)||'?'),'Publicar atualização');
    }).catch(function(e){
      btn.disabled=false; btn.textContent='Publicar atualização';
      if(window.lfbAlert) window.lfbAlert('Não publicou: '+(e&&e.message||'sem conexão'),'Publicar atualização');
    });
  };
}
function agendarCardPublicador(){
  if(window.__cardPublicadorAgendado) return;
  window.__cardPublicadorAgendado=true;
  var tent=0;
  var t=setInterval(function(){
    tent++;
    aplicarCardPublicarAtualizacao();
    if(document.getElementById('card-publicar-atualizacao')||tent>120) clearInterval(t);
  },1500);
}
if(typeof document!=='undefined') agendarCardPublicador();

function abrirOuBaixarErroTxt(){
  try{
    if(window.erroTxtAPI && typeof window.erroTxtAPI.abrir==='function'){
      window.erroTxtAPI.abrir().catch(function(){ baixarErroTxt(); });
    }else{
      baixarErroTxt();
    }
  }catch(e){ baixarErroTxt(); }
}
window.digicopyAbrirOuBaixarErroTxt=abrirOuBaixarErroTxt;

function avisarErroNaTela(){
  var agora=Date.now();
  if(agora-ultimoAviso<8000) return;  // anti-formiga: um aviso a cada 8s, nunca uma chuva
  ultimoAviso=agora;
  try{
    var antigo=document.getElementById('aviso-erro-txt');
    if(antigo) antigo.remove();
    var ehDesktop=!!(window.erroTxtAPI && typeof window.erroTxtAPI.abrir==='function');
    var div=document.createElement('div');
    div.id='aviso-erro-txt';
    div.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45)';
    div.innerHTML='<div style="background:#fff;border-radius:16px;padding:26px 30px;max-width:430px;width:92%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.35)">'
      +'<div style="width:52px;height:52px;border-radius:50%;background:#fee2e2;margin:0 auto 12px;display:flex;align-items:center;justify-content:center"><span style="font-size:26px">⚠️</span></div>'
      +'<p style="font-size:15px;font-weight:800;color:#1e293b;margin:0 0 6px">Ocorreu um erro indevido no sistema</p>'
      +'<p style="font-size:13px;color:#475569;margin:0 0 14px;line-height:1.5">Foi criado/atualizado um arquivo <b>erro.txt</b> falando sobre o erro. Mande esse arquivo ao técnico do sistema.</p>'
      +'<div style="display:flex;gap:10px;justify-content:center">'
      +'<button id="aviso-erro-txt-abrir" style="height:42px;padding:0 18px;border-radius:10px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:800;cursor:pointer">'+(ehDesktop?'Abrir o erro.txt':'Baixar o erro.txt')+'</button>'
      +'<button id="aviso-erro-txt-ok" style="height:42px;padding:0 22px;border-radius:10px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;font-size:13px;font-weight:800;cursor:pointer">OK</button>'
      +'</div></div>';
    document.body.appendChild(div);
    document.getElementById('aviso-erro-txt-abrir').onclick=function(){
      abrirOuBaixarErroTxt();  // mesma ação do botão do rodapé (uma só fonte)
      var d=document.getElementById('aviso-erro-txt'); if(d) d.remove();
    };
    document.getElementById('aviso-erro-txt-ok').onclick=function(){
      var d=document.getElementById('aviso-erro-txt'); if(d) d.remove();
    };
  }catch(e){}
}

// v5.24.24 — caminho de resgate: baixar o erro.txt por fora do aviso (console
// ou qualquer botão futuro). No .exe o arquivo real continua no %APPDATA%.
window.digicopyBaixarErroTxt=baixarErroTxt;

window.registrarErroSistema=function(msg, extra){
  var det=detalheErro(msg, extra);
  if(ignoraRuido(det)) return;
  if(REGISTRANDO) return;  // erro dentro do próprio registro não vira loop infinito
  REGISTRANDO=true;
  try{
    gravarErroTxt(montarLinhaErroTxt(det));   // era: gravarAuditoria — não vai mais
    avisarErroNaTela();
  }catch(e){}
  REGISTRANDO=false;
};

window.addEventListener('error', function(ev){
  var msg=(ev&&ev.message)||'erro';
  var extra=[ev&&ev.filename, ev&&ev.lineno, ev&&ev.colno].filter(Boolean).join(':');
  window.registrarErroSistema(msg, extra);
});

window.addEventListener('unhandledrejection', function(ev){
  var r=ev&&ev.reason;
  var msg=r&&(r.message||r);
  window.registrarErroSistema(msg||'promessa rejeitada', r&&r.stack);
});

console.log('[DIGICOPY] v5.22.39 avisos de erro na tela, detalhe na auditoria');
})();
