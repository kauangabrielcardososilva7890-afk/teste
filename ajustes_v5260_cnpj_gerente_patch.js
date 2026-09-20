// v5.26.0 — CONEXÃO POR CNPJ + GERENTE (3º sistema) + sininho com link secreto.
//
// Três pedidos dele, entregues juntos porque são o mesmo motor na nuvem:
//
//  1) PC NOVO ENTRA COM CNPJ + SENHA DE CONEXÃO (única, definida uma vez no
//     painel Nuvem). Acabou a dor do código de convite que vence em minutos
//     ("dá problema direto"). O convite continua existindo como plano B.
//     → injeta a aba "Entrar com CNPJ" na tela de autorizar computador.
//
//  2) SININHO COM DESTINATÁRIO: o sininho só aparece se existir versão mais
//     nova DESTINADA ao CNPJ daquela instalação (todos / lista de CNPJs /
//     só a loja de teste do dono). Aqui o app passa a mandar ?cnpj= na
//     consulta — a nuvem decide por lá e responde muda quando não é pra ele.
//     O botão "Abrir pra baixar" agora abre a PÁGINA SECRETA /a/<slug> da
//     publicação (sem precisar digitar CNPJ de novo no site).
//
//  3) CARTÃO DO ADMIN "Senhas de conexão": dentro do painel Nuvem (tela
//     conectada, só perfil admin), ele define UMA VEZ: senha de conexão
//     (PCs novos entram com ela) e senha de GERENTE (abre o programa
//     separado "DIGICOPY Gerente de Atualizações" no PC dele — só o CNPJ da
//     empresa dona entra como gerente). Senhas vão SÓ como hash pra nuvem.
//
// Guard: __v5260cn. Não toca no funcionamento de quem já está conectado.
(function(){
  'use strict';
  if(window.__v5260cn) return;
  window.__v5260cn = true;

  var TOKEN_KEY = 'digicopy_cloud_device_token_v1';
  var DEVICE_KEY = 'digicopy_cloud_device_info_v1';

  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function soDigitos(v){ return String(v==null?'':v).replace(/\D/g,''); }

  // CNPJ da instalação: sessão do usuário logado (login por CNPJ+senha),
  // com voltas pela primeira empresa cadastrada (instalações antigas).
  function empresaCnpj(){
    try{
      var u = (typeof getCurrentUser==='function') ? getCurrentUser() : null;
      var c = soDigitos(u && (u.cnpj||''));
      if(c.length===14) return c;
    }catch(e){}
    try{
      var emp = ((typeof db!=='undefined' && db.empresas) || [])[0];
      var c2 = soDigitos(emp && (emp.cnpjDigits || emp.cnpj || ''));
      if(c2.length===14) return c2;
    }catch(e){}
    return '';
  }
  function empresaNome(){
    try{
      var u = (typeof getCurrentUser==='function') ? getCurrentUser() : null;
      if(u && u.empresaNome) return String(u.empresaNome);
    }catch(e){}
    try{
      var emp = ((typeof db!=='undefined' && db.empresas) || [])[0];
      if(emp && (emp.nome || emp.fantasia)) return String(emp.nome || emp.fantasia);
    }catch(e){}
    return '';
  }
  window.CNPJ_V5260_PURE = { empresaCnpj:empresaCnpj, empresaNome:empresaNome, soDigitos:soDigitos, cmpTipo:function(a,b){ return soDigitos(a)===soDigitos(b) && soDigitos(a).length>0; } };

  // ── (2) a consulta do sininho passa a dizer QUEM está perguntando ──
  function wrapApiAppRelease(){
    try{
      var C = window.DIGICOPY_CLOUD;
      if(!C || typeof C.api!=='function' || C.__v5260wrap) return false;
      var original = C.api;
      var embrulhada = function(path, options){
        try{
          if(String(path)==='/v1/app-release' && (!options || !options.method || String(options.method).toUpperCase()==='GET')){
            var c = empresaCnpj();
            if(c.length===14) path = path + '?cnpj=' + encodeURIComponent(c);
          }
        }catch(e){}
        return Promise.resolve(original(path, options)).then(function(rel){
          // a nuvem devolve linkDireto (/a/<slug>) — amarramos em rel.url pra
          // qualquer consumidor antigo abrir a página secreta certa.
          try{ if(rel && rel.ok && rel.linkDireto && String(path).indexOf('/v1/app-release')===0) rel.url = rel.linkDireto; }catch(e){}
          return rel;
        });
      };
      embrulhada.__v5260wrapLen = true;
      C.api = embrulhada;
      C.__v5260wrap = true;
      return true;
    }catch(e){ return false; }
  }

  // ── (1) aba "Entrar com CNPJ" na tela de autorizar computador ──
  function instalarAbaCnpj(){
    var tabRecover = document.getElementById('dc-tab-recover');
    if(!tabRecover || document.getElementById('v5260-tab-cnpj')) return;
    var btn = document.createElement('button');
    btn.id = 'v5260-tab-cnpj';
    btn.textContent = 'Entrar com CNPJ';
    btn.style.cssText = 'padding:8px 12px;border-radius:9px;background:#f1f5f9;color:#475569;font-weight:800';
    tabRecover.insertAdjacentElement('afterend', btn);
    btn.onclick = function(){
      var form = document.getElementById('dc-form');
      if(!form) return;
      form.innerHTML =
        '<h3 style="font-size:15px;font-weight:900">Conectar este computador com o CNPJ da loja</h3>'+
        '<p style="font-size:12px;color:#64748b;margin-top:4px">Sem código que vence: é o CNPJ da loja + a senha de conexão que o administrador definiu no painel Nuvem. Vale pra sempre (até trocarem a senha).</p>'+
        '<label style="display:block;font-size:11px;font-weight:800;margin-top:12px">CNPJ DA LOJA<br><input id="v5260-cnpj" inputmode="numeric" placeholder="00.000.000/0000-00" style="height:40px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px;font-size:14px"></label>'+
        '<label style="display:block;font-size:11px;font-weight:800;margin-top:10px">SENHA DE CONEXÃO (definida uma vez no painel Nuvem)<br><input id="v5260-senha" type="password" placeholder="senha de conexão" style="height:40px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px;font-size:14px"></label>'+
        '<label style="display:block;font-size:11px;font-weight:800;margin-top:10px">NOME DESTE COMPUTADOR<br><input id="v5260-pc" placeholder="Ex.: PC BALCÃO 2" style="height:40px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px;font-size:14px"></label>'+
        '<div style="display:flex;gap:8px;margin-top:15px"><button id="v5260-entrar" style="height:40px;padding:0 16px;border:0;border-radius:9px;background:#0a1e8a;color:#fff;font-weight:800;cursor:pointer">Conectar computador</button></div>'+
        '<div id="v5260-res" style="margin-top:12px"></div>'+
        '<p style="font-size:10.5px;color:#94a3b8;margin-top:10px">Prefere o jeito antigo? A aba "Tenho um código" continua funcionando (código vence em minutos).</p>';
      try{ var c0=empresaCnpj(); if(c0){ form.querySelector('#v5260-cnpj').value=c0.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'); } }catch(e){}
      form.querySelector('#v5260-entrar').onclick = async function(){
        var res = form.querySelector('#v5260-res');
        var btnE = form.querySelector('#v5260-entrar');
        var cnpj = soDigitos(form.querySelector('#v5260-cnpj').value);
        var senha = form.querySelector('#v5260-senha').value;
        var pc = form.querySelector('#v5260-pc').value.trim();
        var apiC = window.DIGICOPY_CLOUD && window.DIGICOPY_CLOUD.api;
        if(cnpj.length!==14 || !senha || !pc){ res.innerHTML='<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:12.5px">Preencha CNPJ (14 dígitos), senha de conexão e o nome do PC.</div>'; return; }
        if(typeof apiC!=='function'){ res.innerHTML='<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:12.5px">Motor da nuvem não carregado.</div>'; return; }
        btnE.disabled = true; btnE.textContent = 'Conectando...';
        try{
          var data = await apiC('/v1/enroll-cnpj',{ method:'POST', body:JSON.stringify({ cnpj:cnpj, empresaNome:empresaNome(), senha:senha, deviceName:pc }) });
          if(!data || !data.token || !data.device) throw new Error('Resposta de autorização incompleta.');
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(DEVICE_KEY, JSON.stringify(Object.assign({}, data.device, { activation:'cnpj', cnpj:cnpj })));
          res.innerHTML='<div style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;border-radius:10px;padding:10px 12px;font-size:12.5px">✅ Computador conectado! Abrindo o sistema...</div>';
          setTimeout(function(){ try{ location.reload(); }catch(e){} }, 700);
        }catch(err){
          res.innerHTML='<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:12.5px">'+esc((err&&err.message)||'Não conectou.')+'</div>';
          btnE.disabled = false; btnE.textContent = 'Conectar computador';
        }
      };
    };
  }

  // ── (3) cartão do admin: definir senha de conexão + senha de gerente ──
  function instalarCardAdmin(){
    var invite = document.getElementById('dc-invite');
    if(!invite || document.getElementById('v5260-admin-card')) return;
    var alvoPai = invite.closest('div[style*="border-top"]') || invite;
    var card = document.createElement('div');
    card.id = 'v5260-admin-card';
    card.style.cssText = 'border-top:1px solid #e2e8f0;padding-top:14px;margin-top:14px';
    card.innerHTML =
      '<h3 style="font-size:14px;font-weight:900">Senhas de conexão (CNPJ) e do Gerente</h3>'+
      '<p style="font-size:12px;color:#64748b;margin-top:4px">Defina UMA VEZ. <b>Senha de conexão</b>: computadores novos entram com CNPJ + ela (sem código que vence). <b>Senha do gerente</b>: abre o programa separado "DIGICOPY Gerente de Atualizações" no seu PC — só com o CNPJ da empresa dona. As senhas vão pra nuvem SÓ como embaralhado (hash): ninguém lê, nem o banco.</p>'+
      '<div style="display:grid;gap:8px;margin-top:10px;max-width:560px">'+
        '<label style="font-size:11px;font-weight:800">CNPJ DA EMPRESA DONA (é ele que vira gerente)<br><input id="v5260-a-cnpj" inputmode="numeric" placeholder="00.000.000/0000-00" style="height:38px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px"></label>'+
        '<label style="font-size:11px;font-weight:800">NOME DA EMPRESA DONA<br><input id="v5260-a-nome" placeholder="Ex.: DIGICOPY" style="height:38px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px"></label>'+
        '<label style="font-size:11px;font-weight:800">SENHA DE CONEXÃO (PCs novos + site de atualizações)<br><input id="v5260-a-conn" type="password" placeholder="mín. 4 caracteres" style="height:38px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px"></label>'+
        '<label style="font-size:11px;font-weight:800">SENHA DO GERENTE (só entra com o CNPJ da dona acima)<br><input id="v5260-a-ger" type="password" placeholder="crie uma senha separada (mín. 4 caracteres)" style="height:38px;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;margin-top:4px"></label>'+
      '</div>'+
      '<div style="display:flex;gap:8px;margin-top:10px"><button id="v5260-a-salvar" style="height:40px;padding:0 16px;border:0;border-radius:9px;background:#0a1e8a;color:#fff;font-weight:800;cursor:pointer">Salvar senhas na nuvem</button></div>'+
      '<div id="v5260-a-res" style="margin-top:10px"></div>';
    alvoPai.insertAdjacentElement('beforebegin', card);
    try{ var c1=empresaCnpj(); if(c1) card.querySelector('#v5260-a-cnpj').value=c1.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'); }catch(e){}
    try{ var n1=empresaNome(); if(n1) card.querySelector('#v5260-a-nome').value=n1; }catch(e){}
    card.querySelector('#v5260-a-salvar').onclick = async function(){
      var res = card.querySelector('#v5260-a-res');
      var btn = card.querySelector('#v5260-a-salvar');
      var cnpj = soDigitos(card.querySelector('#v5260-a-cnpj').value);
      var nome = card.querySelector('#v5260-a-nome').value.trim();
      var conn = card.querySelector('#v5260-a-conn').value;
      var ger = card.querySelector('#v5260-a-ger').value;
      var apiC = window.DIGICOPY_CLOUD && window.DIGICOPY_CLOUD.api;
      if(cnpj.length!==14 || conn.length<4 || ger.length<4){ res.innerHTML='<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:12.5px">Informe o CNPJ, uma senha de conexão e uma senha do gerente separada, ambas com no mínimo 4 caracteres. Se a senha de gerente nunca foi criada, este é o momento de criá-la.</div>'; return; }
      if(typeof apiC!=='function'){ res.innerHTML='<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:12.5px">Motor da nuvem não carregado.</div>'; return; }
      btn.disabled = true; btn.textContent = 'Salvando...';
      try{
        var r = await apiC('/v1/connect-pass',{ method:'POST', body:JSON.stringify({ cnpj:cnpj, nome:nome, senha:conn, senhaGerente:ger }) });
        if(!r || !r.ok) throw new Error((r&&r.message)||'Não salvou.');
        res.innerHTML='<div style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;border-radius:10px;padding:10px 12px;font-size:12.5px">✅ Senhas guardadas (como embaralhado) na nuvem. PCs novos já entram com CNPJ + senha de conexão. Se trocar a senha, computadores já conectados continuam — só bloqueia os novos.</div>';
        card.querySelector('#v5260-a-conn').value=''; card.querySelector('#v5260-a-ger').value='';
      }catch(err){
        res.innerHTML='<div style="background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:12.5px">'+esc((err&&err.message)||'Não salvou.')+'</div>';
      }
      btn.disabled = false; btn.textContent = 'Salvar senhas na nuvem';
    };
  }

  function varrerDOM(){
    try{ instalarAbaCnpj(); }catch(e){}
    try{ instalarCardAdmin(); }catch(e){}
  }

  if(typeof document !== 'undefined'){
    // o wrap precisa existir ANTES do sininho consultar; a tela da nuvem é
    // desenhada aos poucos → observador leve, se desliga quando nada muda.
    if(!wrapApiAppRelease()){
      var esperaWrap = setInterval(function(){ if(wrapApiAppRelease()) clearInterval(esperaWrap); }, 400);
      setTimeout(function(){ clearInterval(esperaWrap); }, 30000);
    }
    var mo = null;
    var ligado = 0;
    function ligar(){
      if(mo) return;
      mo = new MutationObserver(function(){ clearTimeout(ligado); ligado = setTimeout(varrerDOM, 120); });
      mo.observe(document.body, { childList:true, subtree:true });
      varrerDOM();
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ligar);
    else ligar();
  }
})();
