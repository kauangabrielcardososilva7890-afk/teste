// v5.26.2 — LOGIN DA NUVEM ANTES DO LOGIN DE USUÁRIO (pedido dele, literal):
//
//  "consegue deixar pra fazer ANTES de entrar no login de usuário? ai DEPOIS
//   disso vai pro login de usuário. Ja tiver conectado uma vez não precisa —
//   e essa parte NÃO fica oculta, fica mostrando pra todos. DEPOIS que colocar
//   o CNPJ e a senha é que vai aparecer a parte de falar qual é esse
//   computador — é mais uma segurança: acessa somente se fizer o login da
//   nuvem primeiro e depois mais uma senha que é o de usuários. Vai ficar só
//   uma vez: conectou uma vez já era, não precisa mais. O usuário precisa
//   fazer o login UMA VEZ POR DIA automaticamente."
//
// Como funciona aqui dentro (sem encostar na tela antiga):
// A) PORTÃO: se este PC não está autorizado na nuvem (token vazio), um
//    painel cobre a tela inteira ANTES de qualquer login: CNPJ da loja +
//    senha de conexão. Senha certa → SÓ ENTÃO pergunta "qual é este
//    computador?" (etapa 2, mais uma tranca). Conclua → autoriza, recarrega
//    e o fluxo segue para o login de usuário. Conectou 1x → nunca mais aparece.
// B) SESSÃO DE USUÁRIO 1X POR DIA: a sessão vale só no dia em que entrou.
//    Virou o dia e abriu o sistema → volta a pedir usuário+senha (1x ao dia);
//    no resto do dia entra automático, como ele quer.
// C) SEM SENHA DEFINIDA / motor velho / sem internet: o portão explica o que
//    fazer e oferece um link discreto "entrar pelo jeito antigo (admin)" para
//    o dono não ficar trancado pra fora do próprio sistema.
//
// Guard: __v5262ln. Nada some/conta: é sobreposição de tela + checagem de dia.
(function(){
  'use strict';
  if (window.__v5262ln) return;
  window.__v5262ln = true;

  var SESSION_KEY = 'digicopy_session_v42_demo_apresentacao';
  var TOKEN_KEY = 'digicopy_cloud_device_token_v1';
  var DEVICE_KEY = 'digicopy_cloud_device_info_v1';
  var FECHOU_KEY = 'digicopy_v5262_fechou_esta_sessao';

  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function soDigitos(v){ return String(v==null?'':v).replace(/\D/g,''); }
  function fmtCnpj(c){ c=soDigitos(c); return c.length===14 ? c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5') : c; }

  // ── (B) sessão do usuário vale só no dia em que entrou ────────────────────
  function mesmoDia(iso, agora){
    try{
      var d = new Date(iso);
      if (isNaN(d.getTime())) return false;
      var a = agora || new Date();
      return d.getFullYear()===a.getFullYear() && d.getMonth()===a.getMonth() && d.getDate()===a.getDate();
    }catch(e){ return false; }
  }
  function sessaoDoDiaExpirada(){
    try{
      var s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if(!s || !s.loginAt) return false;
      return !mesmoDia(s.loginAt);
    }catch(e){ return false; }
  }
  window.LOGIN_V5262_PURE = { mesmoDia:mesmoDia, sessaoDoDiaExpirada:sessaoDoDiaExpirada };

  var avisoNovoDia = false;
  try{
    if(sessaoDoDiaExpirada()){
      localStorage.removeItem(SESSION_KEY);
      avisoNovoDia = true; // virou o dia: a senha de ontem expirou (1x por dia)
    }
  }catch(e){}

  // ── (A) portão da nuvem ───────────────────────────────────────────────────
  function tokenNuvem(){
    try{ return localStorage.getItem(TOKEN_KEY) || ''; }catch(e){ return ''; }
  }
  function empresaCnpjNome(){
    var c='', n='';
    try{ if (window.CNPJ_V5260_PURE && window.CNPJ_V5260_PURE.empresaCnpj) c = window.CNPJ_V5260_PURE.empresaCnpj(); }catch(e){}
    try{ if (window.CNPJ_V5260_PURE && window.CNPJ_V5260_PURE.empresaNome) n = window.CNPJ_V5260_PURE.empresaNome(); }catch(e){}
    return { cnpj:c, nome:n };
  }
  function fechouNestaSessao(){
    try{ return sessionStorage.getItem(FECHOU_KEY) === '1'; }catch(e){ return false; }
  }

  function montarPortao(){
    if (document.getElementById('v5262-portao')) return;
    if (tokenNuvem()) return;            // conectou uma vez → nunca mais aparece
    if (fechouNestaSessao()) return;     // admin saiu pelo jeito antigo até recarregar

    var base = empresaCnpjNome();
    var box = document.createElement('div');
    box.id = 'v5262-portao';
    box.style.cssText = 'position:fixed;inset:0;z-index:2147482900;background:linear-gradient(135deg,#f1f4fb,#e8edfb);display:flex;align-items:center;justify-content:center;padding:18px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;';
    box.innerHTML =
      '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:22px;box-shadow:0 24px 70px rgba(10,30,138,.16);max-width:430px;width:100%;padding:30px 26px 24px;text-align:center">'+
        '<div style="width:60px;height:60px;margin:0 auto 12px;border-radius:18px;background:linear-gradient(135deg,#4f5bff,#0a1e8a);display:grid;place-items:center;font-size:28px;font-weight:900;color:#fff">D</div>'+
        '<h2 style="margin:0;font-size:19px;font-weight:900;color:#0a1e8a">Conexão da nuvem</h2>'+
        '<p style="margin:8px 0 0;font-size:12.5px;color:#64748b;line-height:1.6">Este computador ainda não está conectado. <b>É só a primeira vez aqui</b> — depois some pra sempre. Sem a conexão, o sistema não abre (mais uma tranca de segurança sua).</p>'+
        '<div id="v5262-etapa1">'+
          '<label style="display:block;text-align:left;font-size:11px;font-weight:800;color:#334155;margin-top:16px">CNPJ DA LOJA<br><input id="v5262-cnpj" inputmode="numeric" placeholder="00.000.000/0000-00" style="height:42px;width:100%;margin-top:4px;border:1px solid #cbd5e1;border-radius:10px;padding:0 12px;font-size:14px;box-sizing:border-box"></label>'+
          '<label style="display:block;text-align:left;font-size:11px;font-weight:800;color:#334155;margin-top:10px">SENHA DE CONEXÃO OU DO GERENTE (gerente separado cria este PC como Administrador)<br><input id="v5262-senha" type="password" placeholder="senha de conexão ou do gerente" style="height:42px;width:100%;margin-top:4px;border:1px solid #cbd5e1;border-radius:10px;padding:0 12px;font-size:14px;box-sizing:border-box"></label>'+
          '<button id="v5262-continuar" style="margin-top:16px;width:100%;height:46px;border:0;border-radius:12px;background:#0a1e8a;color:#fff;font-weight:900;font-size:14.5px;cursor:pointer">Continuar</button>'+
        '</div>'+
        '<div id="v5262-etapa2" style="display:none">'+
          '<div id="v5262-ok-aviso" style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;border-radius:12px;padding:11px 14px;font-size:12.5px;margin-top:16px;text-align:left">✅ CNPJ e senha conferem! Agora diga qual é este computador.</div>'+
          '<label style="display:block;text-align:left;font-size:11px;font-weight:800;color:#334155;margin-top:12px">QUAL É ESTE COMPUTADOR?<br><input id="v5262-pc" placeholder="Ex.: PC BALCÃO 1 / PC CAIXA / NOTEBOOK" style="height:42px;width:100%;margin-top:4px;border:1px solid #cbd5e1;border-radius:10px;padding:0 12px;font-size:14px;box-sizing:border-box"></label>'+
          '<button id="v5262-conectar" style="margin-top:16px;width:100%;height:46px;border:0;border-radius:12px;background:#16a34a;color:#fff;font-weight:900;font-size:14.5px;cursor:pointer">Conectar e entrar</button>'+
          '<div style="margin-top:10px"><a href="#" id="v5262-voltar" style="font-size:12px;color:#64748b">← voltar</a></div>'+
        '</div>'+
        '<div id="v5262-msg" style="margin-top:14px"></div>'+
        '<div id="v5262-jeito-antigo" style="display:none;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:12px"><a href="#" id="v5262-antigo" style="font-size:11.5px;color:#94a3b8">sou o administrador e ainda não defini a senha → entrar pelo jeito antigo</a></div>'+
      '</div>';
    document.body.appendChild(box);

    try{
      var cp = box.querySelector('#v5262-cnpj');
      cp.setAttribute('maxlength','18');
      // v5.26.3 — máscara: só entram números e a pontuação sai sozinha
      cp.addEventListener('input', function(){
        var d = soDigitos(cp.value).slice(0,14), out = d;
        if(d.length > 12) out = d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/,'$1.$2.$3/$4-$5');
        else if(d.length > 8) out = d.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/,'$1.$2.$3/$4');
        else if(d.length > 5) out = d.replace(/(\d{2})(\d{3})(\d{1,3})/,'$1.$2.$3');
        else if(d.length > 2) out = d.replace(/(\d{2})(\d{1,3})/,'$1.$2');
        if(cp.value !== out) cp.value = out;
      });
      if(base.cnpj) cp.value = fmtCnpj(base.cnpj);
    }catch(e){}

    function mostrarMsg(html, tipo){
      var d = box.querySelector('#v5262-msg');
      d.innerHTML = html ? '<div style="'+(tipo==='erro'?'background:#fef2f2;border:1px solid #fecaca;color:#b91c1c':tipo==='bom'?'background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d':'background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8')+';border-radius:12px;padding:11px 14px;font-size:12.5px;text-align:left;line-height:1.6">'+html+'</div>' : '';
    }
    function mostrarJeitoAntigo(){ box.querySelector('#v5262-jeito-antigo').style.display='block'; }
    function apiNuvem(){
      var C = window.DIGICOPY_CLOUD;
      return (C && typeof C.api === 'function') ? C.api : null;
    }

    box.querySelector('#v5262-antigo').onclick = function(ev){
      ev.preventDefault();
      try{ sessionStorage.setItem(FECHOU_KEY,'1'); }catch(e){}
      var d = document.getElementById('v5262-portao'); if(d) d.remove();
      try{ if(typeof toast==='function') toast('Entrada administrativa: conecte o PC pela tela Nuvem e defina as senhas no cartão novo.','info'); }catch(e){}
    };
    box.querySelector('#v5262-voltar').onclick = function(ev){
      ev.preventDefault();
      box.querySelector('#v5262-etapa2').style.display='none';
      box.querySelector('#v5262-etapa1').style.display='block';
      mostrarMsg('');
    };

    // ETAPA 1 — confere CNPJ + senha (sem criar nada)
    box.querySelector('#v5262-continuar').onclick = async function(){
      var api = apiNuvem();
      if(!api){ mostrarMsg('O motor da nuvem ainda está carregando... aguarde 2 segundos e aperte Continuar de novo.','erro'); return; }
      var cnpj = soDigitos(box.querySelector('#v5262-cnpj').value);
      var senha = box.querySelector('#v5262-senha').value;
      if(cnpj.length!==14 || !senha){ mostrarMsg('Preencha o CNPJ (14 dígitos) e a senha de conexão ou do gerente.','erro'); return; }
      var b = box.querySelector('#v5262-continuar');
      b.disabled = true; b.textContent = 'Conferindo...'; mostrarMsg('');
      try{
        var r = await api('/v1/check-pass',{ method:'POST', body:JSON.stringify({ cnpj:cnpj, senha:senha }) });
        if(r && r.ok === false && r.senhaDefinida === false){
          mostrarMsg(esc(r.aviso || 'A senha de conexão ainda não foi definida.')+'<br>O dono define a senha no sistema → Nuvem → cartão <b>"Senhas de conexão (CNPJ) e do Gerente"</b>.','erro');
          mostrarJeitoAntigo(); b.disabled=false; b.textContent='Continuar'; return;
        }
        if(r && r.ok === true){
          box.querySelector('#v5262-etapa1').style.display='none';
          box.querySelector('#v5262-etapa2').style.display='block';
          box.dataset.v5262cnpj = cnpj;
          box.dataset.v5262senha = senha;
          box.dataset.v5262tipo = r.tipo || 'conexao';
          var papelAviso = box.querySelector('#v5262-ok-aviso');
          if(papelAviso) papelAviso.innerHTML = r.administrador
            ? '🔐 Senha do gerente conferida! Este computador será criado como <b>Administrador</b> e verá os botões de administração da nuvem. Agora diga qual é este computador.'
            : '✅ CNPJ e senha de conexão conferem! Este computador será autorizado como PC comum. Agora diga qual é este computador.';
          try{ box.querySelector('#v5262-pc').focus(); }catch(e){}
          b.disabled=false; b.textContent='Continuar'; return;
        }
        mostrarMsg(esc((r && r.aviso) || 'Não conferiu. Tente de novo.'),'erro');
      }catch(err){
        var em = (err && err.message) || 'Falhou.';
        var aviso = (err && err.aviso) || '';
        if(/CNPJ ou senha/.test(em) || /CNPJ ou senha/.test(aviso)){
          mostrarMsg('CNPJ ou senha de conexão ou do gerente <b>incorretos</b>. Confira com calma e tente de novo.','erro');
        }else if(/rota|404/i.test(em)){
          mostrarMsg('O motor da nuvem ainda é o antigo. O dono precisa rodar o <b>atualizar_motor_nuvem.cmd</b> UMA vez e tentar de novo.','erro');
          mostrarJeitoAntigo();
        }else{
          mostrarMsg('Sem conseguir falar com a nuvem agora: '+esc(em)+'<br>Verifique a internet. Se persistir, o dono roda o <b>atualizar_motor_nuvem.cmd</b>.','erro');
          mostrarJeitoAntigo();
        }
      }
      b.disabled = false; b.textContent = 'Continuar';
    };
    try{ box.querySelector('#v5262-senha').addEventListener('keydown', function(ev){ if(ev.key==='Enter') box.querySelector('#v5262-continuar').click(); }); }catch(e){}

    // ETAPA 2 — nome do PC (só aparece depois da senha certa) → autoriza
    box.querySelector('#v5262-conectar').onclick = async function(){
      var api = apiNuvem();
      if(!api){ mostrarMsg('Motor da nuvem ainda carregando... tente de novo em 2 segundos.','erro'); return; }
      var pc = box.querySelector('#v5262-pc').value.trim();
      if(!pc){ mostrarMsg('Diga qual é este computador (ex.: PC BALCÃO 1).','erro'); return; }
      var b = box.querySelector('#v5262-conectar');
      b.disabled = true; b.textContent = 'Conectando...';
      try{
        var data = await api('/v1/enroll-cnpj',{
          method:'POST',
          body:JSON.stringify({ cnpj: box.dataset.v5262cnpj, senha: box.dataset.v5262senha, empresaNome: empresaCnpjNome().nome, deviceName: pc })
        });
        if(!data || !data.token || !data.device) throw new Error('Resposta de autorização incompleta.');
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(DEVICE_KEY, JSON.stringify(Object.assign({}, data.device, { activation:'cnpj', cnpj: box.dataset.v5262cnpj })));
        mostrarMsg('✅ Computador conectado! Abrindo o sistema...','bom');
        setTimeout(function(){ try{ location.reload(); }catch(e){} }, 800);
      }catch(err){
        mostrarMsg(esc((err && err.message) || 'Não conectou. Tente de novo.'),'erro');
        b.disabled = false; b.textContent = 'Conectar e entrar';
      }
    };
    try{ box.querySelector('#v5262-pc').addEventListener('keydown', function(ev){ if(ev.key==='Enter') box.querySelector('#v5262-conectar').click(); }); }catch(e){}
  }

  // ── aviso "virou o dia" no topo da tela de login de usuário ───────────────
  function avisarNovoDia(){
    if(!avisoNovoDia) return;
    var tela = document.getElementById('login-screen');
    if(!tela || document.getElementById('v5262-aviso-dia')) return;
    var a = document.createElement('div');
    a.id = 'v5262-aviso-dia';
    a.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147482899;background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:12px;padding:10px 16px;font-size:12.5px;font-weight:700;box-shadow:0 10px 26px rgba(0,0,0,.12);font-family:inherit';
    a.textContent = '☀️ Virou o dia — por segurança, entre com usuário e senha de novo (é só 1x por dia).';
    document.body.appendChild(a);
    setTimeout(function(){ try{ var d=document.getElementById('v5262-aviso-dia'); if(d) d.remove(); }catch(e){} avisoNovoDia = false; }, 9000);
  }

  // ── vigilância leve: portão quando faltar nuvem; aviso quando aparecer login ─
  function varrerDOM(){
    try{ montarPortao(); }catch(e){}
    try{ avisarNovoDia(); }catch(e){}
  }
  if (typeof document !== 'undefined'){
    var mo = null, t = 0;
    function ligar(){
      if (mo) return;
      mo = new MutationObserver(function(){ clearTimeout(t); t = setTimeout(varrerDOM, 140); });
      mo.observe(document.body, { childList:true, subtree:true });
      varrerDOM();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligar);
    else ligar();
  }
})();
