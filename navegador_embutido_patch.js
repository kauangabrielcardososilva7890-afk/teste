// ═══════════════════════════════════════════════════════════════════════════
// NAVEGADOR_EMBUTIDO_PATCH v6.1.7 — pedido dele (22/09/2026, rodada nº5):
//   "queria somente um navegador embutido no sistema onde ele vai abrir o site
//    da prefeitura e vou poder mexer por la no sistema, sem eu usar algum
//    navegador, tudo dentro do sistema, aproveitando a mesma base de um
//    navegador dentro do sistema, queria adicionar o whatsapp web tambem,
//    é possivel?"
//
// É possível — e é assim que funciona:
//   • No PROGRAMA DO PC (.exe / Electron) o sistema tem navegador de verdade
//     dentro dele: a aba "Navegador" abre o site DENTRO da tela do sistema,
//     com abas, voltar/avançar, recarregar, endereço, tamanho da letra.
//     É uma janela de navegador própria (tag <webview>), não um iframe — por
//     isso o site da prefeitura e o WhatsApp Web, que PROÍBEM ser mostrados
//     dentro de outra página (X-Frame-Options/CSP), aparecem normalmente aqui.
//   • No navegador comum (site na nuvem, celular) isso é impossível por
//     segurança dos próprios sites. Ali a tela explica isso em português claro
//     e dá o botão de abrir numa janela nova — nunca fica tela branca.
//
// Sites que já vêm prontos (a lista fica salva NA NUVEM, em db.config.navSites,
// em todos os PCs dele — nada guardado na memória do navegador (regra #44 SÓ NUVEM):
//   • NFS-e (prefeitura)  — EMISSOR DELE: sistema.sintesetecnologia.com.br (Janaúba)
//   • NFS-e Nacional      — Emissor Nacional (gov.br/nfse), obrigatório para
//                           ME/EPP do Simples Nacional desde 01/09/2026
//   • WhatsApp Web
//   • e quantos ele quiser: botão "＋ Site" (adicionar), ✏ (editar nome/
//     endereço) e 🗑 (apagar), tudo gravado na nuvem na hora.
//
// Login que fica guardado (importante): o WhatsApp Web e o portal da prefeitura
// precisam lembrar o login, senão pediriam QR Code / senha a cada abertura.
// Isso é do PRÓPRIO site, guardado pelo navegador embutido numa área separada
// do sistema (partição 'persist:digicopy-navegador', que NÃO guarda dado do
// sistema — só cookies desses sites). Existe o botão "Esquecer logins" para
// limpar essa área quando ele quiser.
//
// Guard: __v6107nav. PURE exportado para teste (sem DOM).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6107nav) return;

/* NAV6107_PURE_START */
// Sites que nascem na lista (id fixo para os atalhos do menu funcionarem)
var NAV_SITES_PADRAO=[
  { id:'nfse-prefeitura', nome:'NFS-e (prefeitura)',
    // ENDEREÇO DELE (22/09/2026, resposta literal): "eu uso o site
    // http://sistema.sintesetecnologia.com.br/NFEWeb/indexNFe.xhtml?Param=Janauba"
    // É o emissor municipal de Janaúba (Sintese Tecnologia). É http:// (não
    // https) — por isso o main.js tem uma lista branca só para esse endereço.
    url:'http://sistema.sintesetecnologia.com.br/NFEWeb/indexNFe.xhtml?Param=Janauba',
    dica:'Emissor da NFS-e de Janaúba (Sintese Tecnologia) — o mesmo que você usa hoje. A tela abre aqui dentro, sem sair do sistema.' },
  { id:'nfse-nacional', nome:'NFS-e Nacional',
    url:'https://www.nfse.gov.br/EmissorNacional/',
    dica:'Emissor Nacional da NFS-e (gov.br/nfse) — obrigatório para ME/EPP do Simples Nacional desde 01/09/2026, inclusive em município com emissor próprio.' },
  { id:'whatsapp', nome:'WhatsApp Web',
    url:'https://web.whatsapp.com',
    dica:'WhatsApp dentro do sistema: leia o QR Code uma vez com o celular; depois ele entra sozinho neste PC.' }
];

function navLimpar(t){ return String(t==null?'':t).replace(/^\s+|\s+$/g,''); }

// Endereço digitado → endereço de verdade. Nunca devolve vazio nem "javascript:"
// (isso é ordem dele: sem burrice e sem buraco de segurança).
function navNormalizarUrl(txt){
  var t=navLimpar(txt);
  if(!t) return '';
  if(/^https?:\/\//i.test(t)) return t;
  // localhost vem ANTES da checagem de protocolo: "localhost:3000" parece um
  // protocolo ("localhost:") e ia parar na busca do Google por engano.
  if(/^localhost(:\d+)?([/?#]|$)/i.test(t)) return 'http://'+t;
  if(/^[a-z][a-z0-9+.-]*:/i.test(t)) return 'https://www.google.com/search?q='+encodeURIComponent(t);
  if(/^[^\s]+\.[^\s]{2,}([/?#]|$)/.test(t)) return 'https://'+t;
  return 'https://www.google.com/search?q='+encodeURIComponent(t);
}

// "NFS-e da prefeitura" → "nfs-e-da-prefeitura" (id estável, sem acento)
function navIdNovo(nome, usados){
  var base=navLimpar(nome).toLowerCase()
    .replace(/[áàâãä]/g,'a').replace(/[éèêë]/g,'e').replace(/[íìîï]/g,'i')
    .replace(/[óòôõö]/g,'o').replace(/[úùûü]/g,'u').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  if(!base) base='site';
  var id=base, n=2, reservados=usados||{};
  while(reservados[id]){ id=base+'-'+n; n++; }
  return id;
}

function navSitesPadrao(){
  return NAV_SITES_PADRAO.map(function(s){ return {id:s.id,nome:s.nome,url:s.url,dica:s.dica||''}; });
}

// A lista do dono manda; sem lista salva, entram os 3 padrões.
// Qualquer site é normalizado na leitura (endereço velho/colado não derruba nada).
function navSites(db){
  var salvo=(db&&db.config&&Array.isArray(db.config.navSites))?db.config.navSites:null;
  if(!salvo||!salvo.length) return navSitesPadrao();
  var usados={}, lista=[];
  salvo.forEach(function(s){
    if(!s) return;
    var url=navNormalizarUrl(s.url);
    if(!url) return;
    var id=navLimpar(s.id)||navIdNovo(s.nome||'site',usados);
    if(usados[id]) return;
    usados[id]=1;
    lista.push({id:id,nome:navLimpar(s.nome)||id,url:url,dica:navLimpar(s.dica)});
  });
  return lista.length?lista:navSitesPadrao();
}

function navSiteAchar(lista,id){
  if(!lista||!id) return null;
  for(var i=0;i<lista.length;i++) if(lista[i].id===id) return lista[i];
  return null;
}

// Grava a lista na NUVEM (db.config → saveDB) e devolve a lista normalizada.
function navSitesSalvar(db,lista){
  var usados={}, saida=[];
  (lista||[]).forEach(function(s){
    if(!s) return;
    var url=navNormalizarUrl(s.url);
    if(!url) return;
    var id=navLimpar(s.id)||navIdNovo(s.nome||'site',usados);
    if(usados[id]) id=navIdNovo(s.nome||id,usados);
    usados[id]=1;
    saida.push({id:id,nome:navLimpar(s.nome)||id,url:url,dica:navLimpar(s.dica)});
  });
  if(db){ db.config=db.config||{}; db.config.navSites=saida; }
  try{ if(typeof saveDB==='function') saveDB(); }catch(e){}
  return saida;
}

// O navegador embutido só existe dentro do programa do PC (Electron).
function navEElectron(){
  try{
    if(typeof window==='undefined') return false;
    if(window.__DIGICOPY_ELECTRON===true) return true;
    if(window.__digicopyPontes||window.firebirdAPI) return true;
    if(window.process&&window.process.versions&&window.process.versions.electron) return true;
    if(window.navAPI||window.pontes) return true;
    if(typeof navigator!=='undefined'&&/Electron/i.test(navigator.userAgent||'')) return true;
  }catch(e){}
  return false;
}

// User-Agent do próprio Chromium do programa, sem a marca Electron — o
// WhatsApp Web recusa navegador que ele não reconhece.
function navUserAgent(){
  try{
    return String(navigator.userAgent||'')
      .replace(/\sElectron\/[0-9.]+/i,'')
      .replace(/\sDIGICOPY[^ ]*/i,'')
      .replace(/^\s+|\s+$/g,'');
  }catch(e){ return ''; }
}

// Passo a passo curto, por endereço (continua valendo depois de o dono
// renomear o site ou trocar o link — não depende da lista salva).
function navPassos(url){
  var u=String(url||'').toLowerCase();
  if(/sintesetecnologia\.com\.br|nfeweb/.test(u)){
    return ['Abra a NFS-e aqui dentro e faça o login do emissor (esta janela guarda a sessão neste PC).',
            'Emita a nota normalmente — os dados do cliente você copia da ficha dele no sistema.',
            'Para imprimir ou salvar o PDF, use Ctrl+P: a impressão sai limpa, sem cabeçalho do navegador.',
            'Empresa do Simples também pode emitir no Emissor Nacional (aba "NFS-e Nacional") — as duas estão aqui para você comparar.'];
  }
  if(/nfse\.gov\.br/.test(u)){
    return ['Entre com o certificado A1 (o mesmo da NF-e) ou com a conta gov.br.',
            'Emita a NFS-e/DPS normalmente — o padrão nacional vale em todo o país.',
            'Dúvida de qual usar? A aba "NFS-e (prefeitura)" é o emissor municipal que você já usa hoje.'];
  }
  if(/whatsapp\.com/.test(u)){
    return ['Leia o QR Code uma vez com o celular; depois esta janela entra sozinha neste PC.',
            'Se um dia pedir o QR de novo, clique no celular em Aparelhos conectados e leia outra vez.'];
  }
  return [];
}

if(typeof window!=='undefined'){
  window.NAV6107_PURE={ navNormalizarUrl:navNormalizarUrl, navIdNovo:navIdNovo, navSitesPadrao:navSitesPadrao,
    navSites:navSites, navSiteAchar:navSiteAchar, navSitesSalvar:navSitesSalvar, navEElectron:navEElectron,
    navUserAgent:navUserAgent, navPassos:navPassos, NAV_SITES_PADRAO:NAV_SITES_PADRAO };
}
/* NAV6107_PURE_END */

if(typeof document==='undefined') return;   // testes em Node: só a parte pura

function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function tn(m,t){ try{ if(typeof toast==='function') toast(m,t||'info'); }catch(e){} }
function banco(){ try{ return (typeof db!=='undefined')?db:null; }catch(e){ return null; } }
function sessao(){ try{ return (typeof getSession==='function')?getSession():null; }catch(e){ return null; } }

// Regra do sistema: quem mexe, fica na Auditoria (como no fiscal/C5).
function navAuditoria(acao,detalhes,entidadeId){
  try{
    var b=banco(); if(!b) return;
    var sess=sessao()||{};
    b.logs=b.logs||[];
    b.logs.unshift({ id:'nav-'+(new Date().getTime())+'-'+Math.floor(Math.random()*999),
      dataHora:new Date().toISOString(), empresaId:sess.empresaId||'', usuarioId:sess.usuarioId||'',
      usuarioNome:sess.usuarioNome||'sistema', usuarioLogin:sess.login||'sistema',
      entidade:'navegador', acao:acao, entidadeId:entidadeId||'', detalhes:detalhes||'' });
    if(typeof saveDB==='function') saveDB();
  }catch(e){}
}

var NAV_ATUAL={ id:'', zoom:1 };

function navView(){
  try{ if(typeof ensureView==='function') return ensureView('navegador'); }catch(e){}
  return document.getElementById('view-navegador');
}

function navAbasHtml(lista){
  var h='';
  lista.forEach(function(s){
    var ativo=(s.id===NAV_ATUAL.id);
    h+='<button type="button" data-nav-aba="'+esc(s.id)+'" title="'+esc(s.nome)+'" style="white-space:nowrap;height:34px;padding:0 14px;border-radius:10px;font-size:12.5px;font-weight:800;cursor:pointer;'+
      (ativo?'background:#0a1e8a;color:#fff;border:1px solid #0a1e8a':'background:#fff;color:#334155;border:1px solid #e2e8f0')+'">'+
      esc(s.nome)+'</button>';
  });
  return h;
}

function navHtml(){
  return ''+
  '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:8px">'+
    '<div id="nav-abas" style="display:flex;gap:6px;overflow-x:auto;align-items:center">'+navAbasHtml(navSites(banco()))+'</div>'+
    '<div style="margin-left:auto;display:flex;gap:6px">'+
      '<button type="button" id="nav-novo" style="height:34px;padding:0 12px;border-radius:10px;border:1px solid #0a1e8a;background:#e8eaf8;color:#0a1e8a;font-weight:800;font-size:12.5px;cursor:pointer">＋ Site</button>'+
      '<button type="button" id="nav-limpar" title="Apaga os logins guardados dos sites (WhatsApp e prefeitura) neste PC" style="height:34px;padding:0 12px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-weight:700;font-size:12.5px;cursor:pointer">Esquecer logins</button>'+
    '</div>'+
  '</div>'+
  '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:8px;margin-top:8px">'+
    '<button type="button" id="nav-vol" title="Voltar" style="width:36px;height:34px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;cursor:pointer">←</button>'+
    '<button type="button" id="nav-fwd" title="Avançar" style="width:36px;height:34px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;cursor:pointer">→</button>'+
    '<button type="button" id="nav-rec" title="Recarregar (F5)" style="width:36px;height:34px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;cursor:pointer">⟳</button>'+
    '<button type="button" id="nav-ini" title="Voltar para a NFS-e da prefeitura" style="width:36px;height:34px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;cursor:pointer">⌂</button>'+
    '<input id="nav-end" type="text" spellcheck="false" placeholder="Endereço do site (ex.: janauba.mg.gov.br)" style="flex:1;min-width:240px;height:34px;border-radius:10px;border:1px solid #cbd5e1;padding:0 12px;font-size:12.5px">'+
    '<button type="button" id="nav-ir" style="height:34px;padding:0 14px;border-radius:10px;border:0;background:#0a1e8a;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer">Ir</button>'+
    '<button type="button" id="nav-menos" title="Letra menor" style="width:36px;height:34px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;cursor:pointer">A-</button>'+
    '<button type="button" id="nav-mais" title="Letra maior" style="width:36px;height:34px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;cursor:pointer">A+</button>'+
    '<button type="button" id="nav-editar" style="height:34px;padding:0 12px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-weight:700;font-size:12.5px;cursor:pointer">✏ Editar</button>'+
    '<button type="button" id="nav-apagar" style="height:34px;padding:0 12px;border-radius:10px;border:1px solid #fecaca;background:#fff;color:#b91c1c;font-weight:700;font-size:12.5px;cursor:pointer">🗑 Apagar</button>'+
  '</div>'+
  '<div id="nav-form" style="display:none;margin-top:8px;background:#fff;border:1px solid #c9ceef;border-radius:14px;padding:12px">'+
    '<p id="nav-form-titulo" style="margin:0 0 8px;font-size:13px;font-weight:800;color:#0a1e8a">Adicionar site</p>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
      '<input id="nav-f-nome" placeholder="Nome do botão (ex.: NFS-e prefeitura)" style="flex:1;min-width:200px;height:36px;border-radius:10px;border:1px solid #cbd5e1;padding:0 12px;font-size:12.5px">'+
      '<input id="nav-f-url" placeholder="Endereço (ex.: janauba.mg.gov.br)" style="flex:2;min-width:260px;height:36px;border-radius:10px;border:1px solid #cbd5e1;padding:0 12px;font-size:12.5px">'+
      '<button type="button" id="nav-f-salvar" style="height:36px;padding:0 16px;border-radius:10px;border:0;background:#0a1e8a;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer">Salvar</button>'+
      '<button type="button" id="nav-f-cancelar" style="height:36px;padding:0 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-weight:700;font-size:12.5px;cursor:pointer">Cancelar</button>'+
    '</div>'+
    '<p style="margin:8px 0 0;font-size:11.5px;color:#64748b">A lista fica salva na nuvem: o site que você adicionar aqui aparece em todos os seus PCs.</p>'+
  '</div>'+
  '<div id="nav-dica" style="margin-top:8px;font-size:11.5px;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px"></div>'+
  '<div id="nav-passo" style="display:none;margin-top:8px;font-size:12.5px;color:#0f172a;background:#eef2ff;border:1px solid #c9ceef;border-radius:12px;padding:10px 14px"></div>'+
  '<div id="nav-palco" style="margin-top:8px"></div>';
}

function navPintarAbas(){
  var lista=navSites(banco());
  var box=document.getElementById('nav-abas');
  if(box) box.innerHTML=navAbasHtml(lista);
  try{ if(box){ Array.prototype.forEach.call(box.querySelectorAll('[data-nav-aba]'),function(b){
    b.onclick=function(){ window.navegadorAbrirSite(b.getAttribute('data-nav-aba')); };
  }); } }catch(e){}
  var dica=document.getElementById('nav-dica');
  var s=navSiteAchar(lista,NAV_ATUAL.id);
  if(dica) dica.innerHTML=s?('<b>'+esc(s.nome)+'</b> · '+esc(s.url)+(s.dica?' — '+esc(s.dica):'')):'';
  // passo a passo (como usar a nota aqui dentro) — só quando existe para o endereço
  var passo=document.getElementById('nav-passo');
  if(passo){
    var passos=s?navPassos(s.url):[];
    if(passos.length){
      passo.style.display='block';
      passo.innerHTML='<b style="font-size:12px;text-transform:uppercase;letter-spacing:.3px;color:#0a1e8a">Como usar aqui dentro</b>'+
        '<ol style="margin:6px 0 0 18px;padding:0">'+passos.map(function(t){ return '<li style="margin:2px 0">'+esc(t)+'</li>'; }).join('')+'</ol>';
    } else { passo.style.display='none'; passo.innerHTML=''; }
  }
  var end=document.getElementById('nav-end');
  if(end&&s&&document.activeElement!==end) end.value=s.url;
  return s;
}

// ── O navegador em si ───────────────────────────────────────────────────────
function navMontarNavegador(site){
  var palco=document.getElementById('nav-palco');
  if(!palco||!site) return;
  var jaTem=document.getElementById('nav-webview');

  if(!navEElectron()){
    // Navegador comum/celular: os sites não deixam ser mostrados dentro de
    // outra página. Em vez de tela branca, explica e dá a saída.
    palco.innerHTML=''+
    '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:16px">'+
      '<p style="margin:0 0 8px;font-size:14px;font-weight:800;color:#92400e">Esta janela de navegador só abre no programa do PC</p>'+
      '<p style="margin:0;font-size:13px;color:#78350f;line-height:1.6">Você está usando o sistema pelo <b>navegador comum</b> (site na nuvem ou celular). Nesse modo, a prefeitura e o WhatsApp <b>proíbem</b> ser abertos dentro de outra página — é regra de segurança deles, não é defeito do sistema. '+
      'Abra o sistema pelo <b>programa do PC</b> (o .exe): lá a aba Navegador funciona de verdade, com tudo dentro da tela do sistema.</p>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'+
        '<button type="button" id="nav-ext" style="height:36px;padding:0 16px;border-radius:10px;border:0;background:#0a1e8a;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer">Abrir numa janela nova</button>'+
        '<button type="button" id="nav-copiar" style="height:36px;padding:0 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-weight:700;font-size:12.5px;cursor:pointer">Copiar endereço</button>'+
      '</div>'+
    '</div>';
    var be=document.getElementById('nav-ext');
    if(be) be.onclick=function(){ try{ window.open(site.url,'_blank','noopener'); }catch(e){ tn('O navegador bloqueou a janela nova. Copie o endereço e cole lá.','error'); } };
    var bc=document.getElementById('nav-copiar');
    if(bc) bc.onclick=function(){
      try{ if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(site.url); tn('Endereço copiado.','success'); }
      catch(e){ tn(site.url,'info'); }
    };
    return;
  }

  if(!jaTem){
    palco.innerHTML='';
    var wv=document.createElement('webview');
    wv.setAttribute('id','nav-webview');
    // Partição própria: guarda SÓ os logins dos sites abertos aqui (WhatsApp /
    // prefeitura). Nenhum dado do sistema passa por aqui.
    wv.setAttribute('partition','persist:digicopy-navegador');
    var ua=navUserAgent(); if(ua) wv.setAttribute('useragent',ua);
    wv.setAttribute('allowpopups','');
    wv.style.cssText='width:100%;height:calc(100vh - 300px);min-height:420px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;display:block';
    palco.appendChild(wv);
    navLigarEventos(wv);
    try{ wv.loadURL(site.url); }catch(e){ tn('Não consegui abrir '+site.url,'error'); }
    return;
  }

  // Já existe: só troca o endereço (economiza memória no PC fraco).
  try{
    var web=jaTem;
    var atual='';
    try{ atual=web.getURL?String(web.getURL()||''):''; }catch(e){}
    if(atual!==site.url) web.loadURL(site.url);
    web.focus();
  }catch(e){ tn('Falha ao trocar de site. Recarregue a tela.','error'); }
}

function navLigarEventos(wv){
  function avisar(texto,cor,fundo){
    var p=document.getElementById('nav-recado'); if(!p) return;
    p.style.display=texto?'block':'none';
    p.style.background=fundo||'#fffbeb'; p.style.color=cor||'#92400e';
    p.textContent=texto||'';
  }
  try{
    wv.addEventListener('did-start-loading',function(){ var b=document.getElementById('nav-rec'); if(b) b.textContent='✕'; });
    wv.addEventListener('did-stop-loading',function(){ var b=document.getElementById('nav-rec'); if(b) b.textContent='⟳'; });
    wv.addEventListener('did-navigate',function(e){ var i=document.getElementById('nav-end'); if(i&&e&&e.url) i.value=e.url; avisar(''); });
    wv.addEventListener('did-navigate-in-page',function(e){ var i=document.getElementById('nav-end'); if(i&&e&&e.url) i.value=e.url; });
    wv.addEventListener('did-fail-load',function(e){
      if(e&&e.errorCode===-3) return;                       // cancelado: normal
      if(e&&e.isMainFrame===false) return;                  // imagem/anúncio: ignora
      avisar('Não consegui abrir este endereço agora (o site pode estar fora do ar ou a internet caiu). Toque em ⟳ para tentar de novo.',null,null);
    });
  }catch(e){}
}

function navZoom(delta){
  var wv=document.getElementById('nav-webview');
  if(!wv) return;
  NAV_ATUAL.zoom=Math.min(2,Math.max(0.5,(NAV_ATUAL.zoom+delta)));
  try{ if(wv.setZoomFactor) wv.setZoomFactor(NAV_ATUAL.zoom); }catch(e){}
}

function navRecarregarZoom(){
  var wv=document.getElementById('nav-webview');
  if(!wv||!wv.setZoomFactor) return;
  try{ wv.setZoomFactor(NAV_ATUAL.zoom); }catch(e){}
}

function navForm(mostrar,site){
  var f=document.getElementById('nav-form'); if(!f) return;
  f.style.display=mostrar?'block':'none';
  if(!mostrar) return;
  var tit=document.getElementById('nav-form-titulo');
  var nome=document.getElementById('nav-f-nome');
  var url=document.getElementById('nav-f-url');
  NAV_ATUAL.editando=site?site.id:'';
  if(tit) tit.textContent=site?('Editar "'+site.nome+'"'):'Adicionar site';
  if(nome) nome.value=site?site.nome:'';
  if(url) url.value=site?site.url:'';
  if(nome) try{ nome.focus(); }catch(e){}
}

function navRender(){
  var v=navView(); if(!v) return;
  var lista=navSites(banco());
  if(!NAV_ATUAL.id||!navSiteAchar(lista,NAV_ATUAL.id)) NAV_ATUAL.id=lista.length?lista[0].id:'';
  v.innerHTML='<div id="nav-raiz">'+navHtml()+'</div>'+
    '<div id="nav-recado" style="display:none;margin-top:8px;border-radius:12px;padding:10px 12px;font-size:12.5px;font-weight:700"></div>';
  navPintarAbas();
  var site=navSiteAchar(lista,NAV_ATUAL.id);
  navMontarNavegador(site);
  navRecarregarZoom();
  navBotoes();
}

function navBotoes(){
  var g=function(id){ return document.getElementById(id); };
  var b;
  if((b=g('nav-vol'))) b.onclick=function(){ try{ document.getElementById('nav-webview').goBack(); }catch(e){} };
  if((b=g('nav-fwd'))) b.onclick=function(){ try{ document.getElementById('nav-webview').goForward(); }catch(e){} };
  if((b=g('nav-rec'))) b.onclick=function(){ try{ var w=document.getElementById('nav-webview'); if(document.getElementById('nav-rec').textContent==='✕') w.stop(); else w.reload(); }catch(e){} };
  if((b=g('nav-ini'))) b.onclick=function(){ window.navegadorAbrirSite('nfse-prefeitura'); };
  if((b=g('nav-ir'))) b.onclick=function(){ var i=g('nav-end'); if(i) window.navegadorIrPara(i.value); };
  if((b=g('nav-end'))) b.onkeydown=function(ev){ if(ev&&ev.key==='Enter'){ ev.preventDefault(); window.navegadorIrPara(b.value); } };
  if((b=g('nav-menos'))) b.onclick=function(){ navZoom(-0.1); };
  if((b=g('nav-mais'))) b.onclick=function(){ navZoom(0.1); };
  if((b=g('nav-novo'))) b.onclick=function(){ navForm(true,null); };
  if((b=g('nav-f-cancelar'))) b.onclick=function(){ navForm(false,null); };
  if((b=g('nav-editar'))) b.onclick=function(){ navForm(true,navSiteAchar(navSites(banco()),NAV_ATUAL.id)); };
  if((b=g('nav-f-salvar'))) b.onclick=function(){
    var nome=(g('nav-f-nome')||{}).value||'', url=(g('nav-f-url')||{}).value||'';
    if(!navNormalizarUrl(url)){ tn('Escreva o endereço do site.','error'); return; }
    if(!String(nome).replace(/\s+/g,'')){ tn('Dê um nome para o botão do site.','error'); return; }
    if(NAV_ATUAL.editando) window.navegadorEditarSite(NAV_ATUAL.editando,{nome:nome,url:url});
    else window.navegadorAdicionarSite(nome,url);
    navForm(false,null);
  };
  if((b=g('nav-apagar'))) b.onclick=function(){
    var site=navSiteAchar(navSites(banco()),NAV_ATUAL.id);
    if(!site){ tn('Nenhum site para apagar.','error'); return; }
    if(!NAV_ATUAL.confirmandoApagar){
      NAV_ATUAL.confirmandoApagar=true;
      b.textContent='🗑 Confirmar?';
      setTimeout(function(){ NAV_ATUAL.confirmandoApagar=false; var x=g('nav-apagar'); if(x) x.textContent='🗑 Apagar'; },4000);
      return;
    }
    window.navegadorRemoverSite(site.id);
    NAV_ATUAL.confirmandoApagar=false;
  };
  if((b=g('nav-limpar'))) b.onclick=function(){
    if(!NAV_ATUAL.confirmandoLogins){
      NAV_ATUAL.confirmandoLogins=true; b.textContent='Esquecer (confirmar)';
      setTimeout(function(){ NAV_ATUAL.confirmandoLogins=false; var x=g('nav-limpar'); if(x) x.textContent='Esquecer logins'; },4000);
      return;
    }
    NAV_ATUAL.confirmandoLogins=false;
    try{
      if(window.navAPI&&typeof window.navAPI.limparLogins==='function'){
        window.navAPI.limparLogins().then(function(){ tn('Logins guardados dos sites foram apagados. Vai pedir o QR Code/senha de novo na próxima abertura.','success'); });
      }else{ tn('Isso só funciona no programa do PC.','info'); }
    }catch(e){ tn('Não consegui limpar agora.','error'); }
  };
}

// ── Entradas (menu, aba e atalhos) ──────────────────────────────────────────
window.navegadorAbrirSite=function(id){
  var lista=navSites(banco());
  if(navSiteAchar(lista,id)) NAV_ATUAL.id=id;
  try{ window.navigateTo('navegador'); }catch(e){ navRender(); }
  try{ if(typeof setPageHeader==='function') setPageHeader('Navegador','Prefeitura (NFS-e), WhatsApp Web e os sites que você quiser — dentro do sistema'); }catch(e){}
  navRender();
};
window.navegadorAbrir=function(){ window.navegadorAbrirSite(NAV_ATUAL.id||'nfse-prefeitura'); };
window.navegadorSites=function(){ return navSites(banco()); };
window.navegadorIrPara=function(txt){
  var url=navNormalizarUrl(txt);
  if(!url){ tn('Escreva o endereço.','error'); return ''; }
  var i=document.getElementById('nav-end'); if(i) i.value=url;
  try{ var w=document.getElementById('nav-webview'); if(w) w.loadURL(url); else navMontarNavegador({id:NAV_ATUAL.id,nome:'endereço avulso',url:url}); }catch(e){}
  return url;
};
window.navegadorAdicionarSite=function(nome,url){
  var lista=navSites(banco()).slice();
  var id=navIdNovo(nome,{}), usados={};
  lista.forEach(function(s){ usados[s.id]=1; });
  id=navIdNovo(nome,usados);
  lista.push({id:id,nome:nome,url:url});
  navSitesSalvar(banco(),lista);
  navAuditoria('site-adicionado',nome+' · '+url,id);
  NAV_ATUAL.id=id; navRender();
  tn('Site "'+nome+'" adicionado e salvo na nuvem.','success');
  return id;
};
window.navegadorEditarSite=function(id,novo){
  var lista=navSites(banco()).slice();
  for(var i=0;i<lista.length;i++) if(lista[i].id===id){
    lista[i].nome=(novo&&novo.nome)||lista[i].nome;
    lista[i].url=(novo&&novo.url)||lista[i].url;
  }
  navSitesSalvar(banco(),lista);
  navAuditoria('site-editado',((novo&&novo.nome)||'')+' · '+((novo&&novo.url)||''),id);
  navRender();
  tn('Site atualizado.','success');
};
window.navegadorRemoverSite=function(id){
  var lista=navSites(banco()).filter(function(s){ return s.id!==id; });
  navSitesSalvar(banco(),lista);
  navAuditoria('site-apagado',id,id);
  if(!navSiteAchar(lista,NAV_ATUAL.id)) NAV_ATUAL.id=lista.length?lista[0].id:'';
  navRender();
  tn('Site apagado.','info');
};
window.navegadorRestaurarPadrao=function(){
  var b=banco(); if(b){ b.config=b.config||{}; b.config.navSites=navSitesPadrao(); try{ if(typeof saveDB==='function') saveDB(); }catch(e){} }
  NAV_ATUAL.id='nfse-prefeitura'; navRender();
  tn('Lista de sites voltou ao padrão (prefeitura, NFS-e Nacional e WhatsApp).','success');
};

// navigateTo aprende a tela (mesma regra das outras salas: Central, Orçamentos…)
try{
  if(typeof window.navigateTo==='function'&&!window.navigateTo.__v6107nav){
    var _nav=window.navigateTo;
    window.navigateTo=function(view){
      var r=_nav.apply(this,arguments);
      if(view==='navegador'){
        try{ if(typeof setPageHeader==='function') setPageHeader('Navegador','Prefeitura (NFS-e), WhatsApp Web e os sites que você quiser — dentro do sistema'); }catch(e){}
        try{ navRender(); }catch(e){}
      }
      return r;
    };
    window.navigateTo.__v6107nav=true;
  }
}catch(e){}

// Menu: barra de cima (módulos) + lateral, com submenu dos sites
function navInstalarMenu(){
  try{
    var sidebar=document.getElementById('nav-gest');
    if(sidebar&&!sidebar.querySelector('[data-nav="navegador"]')){
      var btn=document.createElement('button');
      if(btn.dataset) btn.dataset.nav='navegador'; else btn.setAttribute('data-nav','navegador');
      btn.onclick=function(){ window.navegadorAbrir(); };
      btn.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white';
      btn.innerHTML='<i class="ph ph-globe text-[19px]"></i><span>Navegador</span>';
      var cfg=sidebar.querySelector('[data-nav="config"]');
      if(cfg) sidebar.insertBefore(btn,cfg); else sidebar.appendChild(btn);
    }
    var toolbar=document.querySelector('.classic-toolbar-scroll')||document.querySelector('.module-row');
    if(toolbar&&!document.getElementById('topmod-navegador')){
      var mod=document.createElement('div'); mod.className='module'; mod.id='topmod-navegador';
      mod.innerHTML='<button onclick="navegadorAbrir()" title="Navegador dentro do sistema: NFS-e da prefeitura, WhatsApp Web e outros sites"><i class="ph ph-globe"></i>Navegador</button>'+
        '<div class="module-menu" id="menu-navegador">'+
          '<button onclick="navegadorAbrirSite(\'nfse-prefeitura\')"><i class="ph ph-receipt"></i>NFS-e (prefeitura)</button>'+
          '<button onclick="navegadorAbrirSite(\'nfse-nacional\')"><i class="ph ph-stamp"></i>NFS-e Nacional</button>'+
          '<button onclick="navegadorAbrirSite(\'whatsapp\')"><i class="ph ph-whatsapp-logo"></i>WhatsApp Web</button>'+
          '<button onclick="navegadorAbrir();setTimeout(function(){var b=document.getElementById(\'nav-novo\');if(b)b.click();},60)"><i class="ph ph-plus-circle"></i>Adicionar site</button>'+
        '</div>';
      var nuvem=document.getElementById('btn-nuvem');
      var alvo=nuvem?(nuvem.closest&&nuvem.closest('.module')||nuvem.parentNode):null;
      if(alvo&&alvo.parentNode) alvo.parentNode.insertBefore(mod,alvo);
      else toolbar.appendChild(mod);
    }
  }catch(e){}
}

try{
  navInstalarMenu();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',navInstalarMenu);
  } else { setTimeout(navInstalarMenu,0); }
  window.addEventListener('load',navInstalarMenu);
  // A barra de módulos é remontada por outros patches: sonda leve garante que
  // o item do menu não desapareça (PC fraco: 1 vez a cada 2s, custo baixo).
  try{ setInterval(navInstalarMenu,2000); }catch(e){}
}catch(e){}

window.__v6107nav={vivo:true,versao:'6.1.7'};
console.log('[DIGICOPY] v6.1.7 Navegador embutido (NFS-e da prefeitura + WhatsApp Web dentro do sistema)');
})();
