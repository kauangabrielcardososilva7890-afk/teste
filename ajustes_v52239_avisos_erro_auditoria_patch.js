// ═══════════════════════════════════════════════════════════════════════════
// v5.22.39 — Se algo quebrar: aviso na tela. Detalhe técnico só na auditoria.
// v5.24.19 — PEDIDO DELE (mudou o destino do detalhe): erro indevido NÃO vai
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

// v5.24.19 — PEDIDO DELE: o erro não mora mais na auditoria. Agora vira linha
// num erro.txt visível (%APPDATA% no .exe; download no navegador/celular), com
// aviso na tela "mande esse arquivo ao técnico". Auditoria volta a ser quadro
// de "quem fez o quê", visível pra todos os logins (v5197).
var ultimoAviso=0;
var REGISTRANDO=false;   // anti-recursão: um erro dentro do registro não vira loop
var bufferErros=[];      // memória que alimenta o download (navegador/celular)

// v5.24.19 — resposta à pergunta dele: "e se eu perder o aviso, como baixo de
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

// v5.24.19 — pedido dele: BOTÃO visível pra abrir/baixar o erro.txt (o
// resgate por console não serve pra ele). Mesma ação do aviso, agora pública:
// o rodapé do sistema ganha um botãozinho "erro.txt" sempre à mão.
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

// v5.24.19 — caminho de resgate: baixar o erro.txt por fora do aviso (console
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
