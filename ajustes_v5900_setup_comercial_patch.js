// ═══════════════════════════════════════════════════════════════════════════
// v5.90.0 — SETUP COMERCIAL + NUVEM CONFIGURÁVEL (r59)
// Para VENDER o sistema: cada cliente tem a SUA nuvem e a SUA empresa.
//   • Base nova (sem empresa ou sem usuário) abre o SETUP em vez do login:
//     a assistência cadastra a loja do cliente + o admin dele + o endereço
//     da nuvem dele. Sem usuário de fábrica em lugar nenhum.
//   • O endereço da nuvem é configuração (db.config.nuvem.apiUrl). Vazio =
//     nuvem oficial DIGICOPY (a loja do dono).
//   • Atualizações vêm SEMPRE da nuvem oficial (atrelado ao vendedor).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var API_OFICIAL = 'https://digicopy-sync-api.digicopyonline.workers.dev';

// ── pura (testável em node, sem janela) ──
function resolverApiUrl(cfg){
  var u = cfg && cfg.nuvem ? cfg.nuvem.apiUrl : '';
  u = String(u == null ? '' : u).trim().replace(/\/+$/, '');
  if(!u) return API_OFICIAL;
  try{
    var x = new URL(u);
    var h = String(x.hostname || '').toLowerCase().replace(/\.$/, '');
    if(x.protocol !== 'https:' || x.username || x.password || x.port || x.pathname !== '/' || x.search || x.hash) return API_OFICIAL;
    if(h !== 'digicopy-sync-api.digicopyonline.workers.dev' && !(h.endsWith('.workers.dev') && h.length > '.workers.dev'.length)) return API_OFICIAL;
    return 'https://' + h;
  }catch(e){ return API_OFICIAL; }
}
function precisaSetup(dbLike, temToken){
  try{
    if(!dbLike) return true;
    var vazia = !Array.isArray(dbLike.empresas) || dbLike.empresas.length === 0 ||
                !Array.isArray(dbLike.usuarios) || dbLike.usuarios.length === 0;
    if(!vazia) return false;
    // SÓ NUVEM recarregou com a base ainda vazia (a nuvem devolve em
    // segundos) — o contrato puro continua indicando login quando há token.
    // O gate assíncrono de showLogin faz o pull e decide o setup depois.
    if(temToken) return false;
    return true;
  }catch(e){ return true; }
}
function validarSetup(d){
  var erros = [];
  d = d || {};
  if(String(d.nome || '').trim().length < 2) erros.push('Nome da loja');
  if(String(d.login || '').trim().length < 3) erros.push('Login do admin (mín. 3 letras)');
  if(String(d.senha || '').length < 4) erros.push('Senha do admin (mín. 4 caracteres)');
  var url = String(d.apiUrl || '').trim();
  if(url && !/^https:\/\/[a-z0-9.-]+\.workers\.dev\/?$/i.test(url)) erros.push('Endereço da nuvem (somente https://*.workers.dev)');
  return erros;
}

if(typeof window !== 'undefined'){
  window.DIGICOPY_API_OFICIAL = API_OFICIAL;
  window.DIGICOPY_API_URL = function(){
    try{ return resolverApiUrl(typeof db !== 'undefined' ? db.config : null); }
    catch(e){ return API_OFICIAL; }
  };
  window.SETUP_COMERCIAL_PURE = { resolverApiUrl: resolverApiUrl, precisaSetup: precisaSetup, validarSetup: validarSetup, oficial: API_OFICIAL };
}
if(typeof document === 'undefined') return;

function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function ehSetupPendente(){
  try{
    var dbv = (typeof db !== 'undefined') ? db : null;
    var tok = '';
    try{
      var C = (typeof window !== 'undefined') ? window.DIGICOPY_CLOUD : null;
      if(C && typeof C.token === 'function') tok = C.token() || '';
      else if(typeof localStorage !== 'undefined') tok = localStorage.getItem('digicopy_cloud_device_token_v1') || '';
    }catch(e){}
    return precisaSetup(dbv, !!tok);
  }catch(e){ return false; }
}
function soDig(v){ return String(v == null ? '' : v).replace(/\D/g, ''); }
function abrirSetupControlado(){
  var sec = (typeof window !== 'undefined') ? window.DIGICOPY_SECURITY : null;
  if(!sec || typeof sec.remotoPermiteSetup !== 'function'){
    try{ if(typeof toast === 'function') toast('Verificação de segurança ainda não carregou. Recarregue a página.', 'error'); }catch(e){}
    return;
  }
  Promise.resolve(sec.remotoPermiteSetup()).then(function(ok){
    if(ok){ renderSetup(); return; }
    try{ if(typeof toast === 'function') toast('A nuvem já está configurada ou não pôde ser verificada. Use o login normal.', 'error'); }catch(e){}
    if(typeof showLoginAnterior === 'function') showLoginAnterior.call(window);
  }).catch(function(){
    try{ if(typeof toast === 'function') toast('Não foi possível verificar a nuvem. O setup foi bloqueado.', 'error'); }catch(e){}
    if(typeof showLoginAnterior === 'function') showLoginAnterior.call(window);
  });
}

// ── tela de setup (cobre tudo; some depois de salvar) ──
function renderSetup(){
  try{ document.getElementById('app-shell').classList.add('hidden'); }catch(e){}
  try{
    var ls = document.getElementById('login-screen');
    if(ls) ls.classList.remove('hidden');
    ['login-step-user','login-step-cnpj'].forEach(function(id){
      var el = document.getElementById(id);
      if(el){ el.classList.add('hidden'); el.style.display = 'none'; }
    });
  }catch(e){}
  var velho = document.getElementById('v5900-setup');
  if(velho) velho.remove();
  var capa = document.createElement('div');
  capa.id = 'v5900-setup';
  capa.style.cssText = 'position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;background:linear-gradient(135deg,#0a1e8a,#0876c9);padding:20px;overflow:auto';
  capa.innerHTML =
    '<div style="width:min(560px,96vw);background:#fff;border-radius:18px;padding:26px 28px;box-shadow:0 25px 80px rgba(0,0,0,.35)">'+
    '<h2 style="font-size:19px;font-weight:900;color:#0a1e8a;margin:0">Bem-vindo ao DIGICOPY — instalação nova</h2>'+
    '<p style="font-size:12.5px;color:#64748b;margin:6px 0 0">A assistência preenche uma vez só. Depois desta tela, o sistema abre no login normal.</p>'+
    '<h3 style="font-size:13px;font-weight:900;margin:16px 0 6px">1) A loja do cliente</h3>'+
    '<label style="display:block;font-size:11px;font-weight:800">NOME DA LOJA<br><input id="v5900-nome" placeholder="Ex.: Papelaria Central" style="height:40px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px;font-size:14px"></label>'+
    '<label style="display:block;font-size:11px;font-weight:800;margin-top:8px">NOME FANTASIA (aparece no topo)<br><input id="v5900-fantasia" placeholder="Ex.: CENTRAL" style="height:40px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px;font-size:14px"></label>'+
    '<label style="display:block;font-size:11px;font-weight:800;margin-top:8px">CNPJ DA LOJA<br><input id="v5900-cnpj" inputmode="numeric" placeholder="00.000.000/0000-00" style="height:40px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px;font-size:14px"></label>'+
    '<h3 style="font-size:13px;font-weight:900;margin:16px 0 6px">2) O dono (primeiro usuário)</h3>'+
    '<label style="display:block;font-size:11px;font-weight:800">NOME<br><input id="v5900-anome" placeholder="Ex.: Maria Silva" style="height:40px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px;font-size:14px"></label>'+
    '<label style="display:block;font-size:11px;font-weight:800;margin-top:8px">LOGIN (mín. 3 letras)<br><input id="v5900-login" placeholder="Ex.: maria" style="height:40px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px;font-size:14px"></label>'+
    '<label style="display:block;font-size:11px;font-weight:800;margin-top:8px">SENHA (mín. 4 caracteres)<br><input id="v5900-senha" type="password" placeholder="crie com o cliente" style="height:40px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px;font-size:14px"></label>'+
    '<h3 style="font-size:13px;font-weight:900;margin:16px 0 6px">3) A nuvem desta instalação</h3>'+
    '<label style="display:block;font-size:11px;font-weight:800">ENDEREÇO DA NUVEM DO CLIENTE<br><input id="v5900-api" placeholder="https://digicopy-loja-cliente...workers.dev (vazio = oficial)" style="height:40px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px;font-size:13px"></label>'+
    '<p style="font-size:11px;color:#94a3b8;margin:6px 0 0">É o endereço que o provisionar_cliente entrega no final. Vazio usa a nuvem oficial.</p>'+
    '<div style="display:flex;gap:8px;margin-top:16px"><button id="v5900-salvar" style="flex:1;height:44px;border:0;border-radius:10px;background:#0a1e8a;color:#fff;font-weight:900;font-size:14px;cursor:pointer">Concluir instalação</button></div>'+
    '<div id="v5900-res" style="margin-top:10px"></div>'+
    '</div>';
  document.body.appendChild(capa);
  capa.style.display = 'flex';
  capa.querySelector('#v5900-salvar').onclick = function(){ salvarSetup(capa); };
}

async function salvarSetup(capa){
  var res = capa.querySelector('#v5900-res');
  var btn = capa.querySelector('#v5900-salvar');
  function falha(msg){
    res.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:12.5px">' + esc(msg) + '</div>';
    btn.disabled = false; btn.textContent = 'Concluir instalação';
  }
  var dados = {
    nome: capa.querySelector('#v5900-nome').value.trim(),
    fantasia: capa.querySelector('#v5900-fantasia').value.trim(),
    cnpj: soDig(capa.querySelector('#v5900-cnpj').value),
    anome: capa.querySelector('#v5900-anome').value.trim(),
    login: capa.querySelector('#v5900-login').value.trim(),
    senha: capa.querySelector('#v5900-senha').value,
    apiUrl: capa.querySelector('#v5900-api').value.trim().replace(/\/+$/, '')
  };
  var erros = validarSetup({ nome: dados.nome, login: dados.login, senha: dados.senha, apiUrl: dados.apiUrl });
  if(erros.length){ falha('Falta arrumar: ' + erros.join(' • ')); return; }
  if(typeof db === 'undefined' || typeof saveDB !== 'function'){ falha('Base ainda carregando. Aguarde 3 segundos e tente de novo.'); return; }
  if(!precisaSetup(db)){ location.reload(); return; } // outra aba concluiu primeiro
  btn.disabled = true; btn.textContent = 'Salvando...';
  try{
    var agora = new Date().toISOString();
    var fazId = (typeof uid === 'function') ? uid : function(p){ return p + '_' + Date.now(); };
    var emp = { id: fazId('emp'), nome: dados.nome, fantasia: dados.fantasia || dados.nome,
      cnpj: dados.cnpj, cnpjDigits: dados.cnpj, criadoEm: agora, criadoPor: 'setup' };
    db.empresas = [emp];
    var u = { id: fazId('usr'), empresaId: emp.id, nome: dados.anome, login: dados.login,
      senha: dados.senha, senhaPadrao: false, perfil: 'Dono', ativo: true,
      criadoEm: agora, criadoPor: 'setup' };
    try{ if(typeof atualizarHashRegistro === 'function') await atualizarHashRegistro(u, dados.senha); }catch(eH){}
    db.usuarios = [u];
    db.config = db.config || {};
    db.config.empresa = { nome: dados.nome, fantasia: dados.fantasia || dados.nome, cnpj: dados.cnpj, fone: '', email: '' };
    db.config.nuvem = { apiUrl: dados.apiUrl || '' };
    saveDB();
    // No caso pedido pelo dono (nuvem zerada), a criação do primeiro usuário
    // precisa ser enviada antes do reload. Se a rede cair, a fila permanece
    // protegida pelo motor e o aviso deixa o operador ciente.
    try{
      var sync = window.DIGICOPY_CLOUD_SYNC;
      if(sync && typeof sync.publishLocalToCloud === 'function' &&
         window.DIGICOPY_CLOUD && typeof window.DIGICOPY_CLOUD.token === 'function' &&
         window.DIGICOPY_CLOUD.token()) await sync.publishLocalToCloud();
    }catch(eSync){
      try{ console.warn('[DIGICOPY] primeiro cadastro salvo, publicação pendente:', eSync); }catch(_e){}
    }
    res.innerHTML = '<div style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;border-radius:10px;padding:10px 12px;font-size:12.5px">✅ Instalação concluída! Abrindo o login...</div>';
    setTimeout(function(){ try{ location.reload(); }catch(e){} }, 700);
  }catch(err){
    falha((err && err.message) || 'Não salvou.');
  }
}

// ── cartão "nuvem desta instalação" no painel Nuvem (só admin) ──
function instalarCardNuvem(){
  if(document.getElementById('v5900-nuvem-card')) return;
  var admin = document.getElementById('dc-admin-result');
  if(!admin || !admin.parentNode) return;
  var atual = '';
  try{ atual = window.DIGICOPY_API_URL(); }catch(e){ atual = API_OFICIAL; }
  var ehOficial = (String(atual).replace(/\/+$/, '') === API_OFICIAL);
  var card = document.createElement('div');
  card.id = 'v5900-nuvem-card';
  card.style.cssText = 'border-top:1px solid #e2e8f0;padding-top:14px;margin-top:14px';
  card.innerHTML =
    '<h3 style="font-size:14px;font-weight:900">Nuvem desta instalação</h3>'+
    '<p style="font-size:12px;color:#64748b;margin-top:4px;word-break:break-all">Conectado em:<br><b>' + esc(atual) + '</b>' +
    (ehOficial ? ' <span style="background:#e8eaf8;color:#0a1e8a;border-radius:6px;padding:1px 7px;font-size:10.5px;font-weight:800">OFICIAL</span>' : '') + '</p>'+
    '<div style="display:flex;gap:8px;margin-top:8px"><button id="v5900-trocar" style="height:38px;padding:0 14px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0a1e8a;font-weight:800;cursor:pointer">Trocar de nuvem...</button></div>'+
    '<div id="v5900-nuvem-res" style="margin-top:8px"></div>';
  admin.parentNode.appendChild(card);
  card.querySelector('#v5900-trocar').onclick = async function(){
    var res = card.querySelector('#v5900-nuvem-res');
    var pergunta = (typeof window.pedirTextoSistema === 'function')
      ? function(t){ return window.pedirTextoSistema(t, { titulo: 'Trocar de nuvem' }); }
      : function(t){ return Promise.resolve(window.prompt(t)); };
    var nova = await pergunta('Novo endereço da nuvem (somente https://*.workers.dev). Vazio volta para a OFICIAL.');
    if(nova == null) return;
    nova = String(nova).trim().replace(/\/+$/, '');
    if(nova && !/^https:\/\/[a-z0-9.-]+\.workers\.dev\/?$/i.test(nova)){
      res.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:12.5px">Endereço inválido. Use somente https://*.workers.dev</div>';
      return;
    }
    var confirma = (typeof window.confirmSistema === 'function')
      ? await window.confirmSistema('Trocar a nuvem DESCONECTA este computador (o token da nuvem antiga não vale na nova). Os dados DESTE PC continuam. Depois reconecte no painel Nuvem. Continuar?', 'Trocar de nuvem')
      : window.confirm('Trocar a nuvem DESCONECTA este computador. Continuar?');
    if(!confirma) return;
    try{
      if(typeof db !== 'undefined'){
        db.config = db.config || {};
        db.config.nuvem = { apiUrl: nova || '' };
        if(typeof saveDB === 'function') saveDB();
      }
      try{ if(window.DIGICOPY_CLOUD && typeof window.DIGICOPY_CLOUD.forgetAuth === 'function') window.DIGICOPY_CLOUD.forgetAuth(); }catch(e){}
      location.reload();
    }catch(err){
      res.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:12.5px">' + esc((err && err.message) || 'Não trocou.') + '</div>';
    }
  };
}

// ── intercepta o login: base vazia abre o setup ──
// SUBSTITUICAO DE PROPOSITO showLogin: base vazia abre o setup; com base, encadeia a anterior.
var showLoginAnterior = window.showLogin;
var v5900SetupEmAndamento = false;
window.showLogin = function(){
  try{
    var dbv = (typeof db !== 'undefined') ? db : null;
    var vazio = precisaSetup(dbv, false);
    var tok = '';
    try{ tok = (window.DIGICOPY_CLOUD && typeof window.DIGICOPY_CLOUD.token === 'function') ? (window.DIGICOPY_CLOUD.token()||'') : ''; }catch(_t){}
    if(vazio && tok){
      if(v5900SetupEmAndamento) return;
      v5900SetupEmAndamento = true;
      // A nuvem pode ainda estar descendo o retrato. Não mostramos um login
      // impossível: fazemos um pull curto; se continuar sem identidade,
      // apresentamos o cadastro do primeiro usuário.
      var sync = window.DIGICOPY_CLOUD_SYNC;
      var p = sync && typeof sync.tick === 'function' ? sync.tick('setup-inicial') : Promise.resolve(false);
      Promise.race([Promise.resolve(p), new Promise(function(resolve){setTimeout(resolve,12000);})])
        .catch(function(){})
        .then(function(){
          v5900SetupEmAndamento = false;
          try{
            if(ehSetupPendente()) { abrirSetupControlado(); return; }
          }catch(_e){}
          if(typeof showLoginAnterior === 'function') showLoginAnterior.apply(window, arguments);
        });
      return;
    }
    if(vazio){ abrirSetupControlado(); return; }
  }catch(e){}
  if(typeof showLoginAnterior === 'function') return showLoginAnterior.apply(this, arguments);
};

// a tela da nuvem é desenhada aos poucos → observador reinstala o cartão
var v5900mo = null;
var v5900t = 0;
function v5900varrer(){
  try{ instalarCardNuvem(); }catch(e){}
}
function v5900ligar(){
  if(v5900mo) return;
  try{
    v5900mo = new MutationObserver(function(){ clearTimeout(v5900t); v5900t = setTimeout(v5900varrer, 120); });
    v5900mo.observe(document.body, { childList: true, subtree: true });
  }catch(e){}
  v5900varrer();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', v5900ligar);
else v5900ligar();

})();
