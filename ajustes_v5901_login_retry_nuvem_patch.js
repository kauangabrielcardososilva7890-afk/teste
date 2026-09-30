// ═══════════════════════════════════════════════════════════════════════════
// ajustes_v5901_login_retry_nuvem_patch.js — r60 v7.3.0 (30/09/2026)
// O LOGIN QUE SE CURA SOZINHO. Por quê: PC limpo (ctrl+shift+delete) ou PC novo
// não tem o usuário na base local — e o login falhava ("não existe neste PC"),
// mandando o dono criar o usuário de novo em cada PC. Agora o login tenta,
// não acha, PUXA DA NUVEM sozinho e tenta de novo — sem ir em Config.
// Pedido do dono (print 30/09/2026: 'Usuário "kauan" não existe neste PC').
//
// Como funciona: embrulha window.doLoginUser (do v52253). Antes de chamar o
// original, confere se o usuário existe no db local (MESMA comparação do
// v52253: login, nome ou primeiro nome, com fold). Se não existe E tem token
// da nuvem E não está no meio de outra puxada → avisa ("buscando na nuvem…"),
// roda um ciclo do sync (tick 'login-retry', limite 15 s) e chama o original,
// que agora encontra o usuário que acabou de chegar. O original continua
// mandando em tudo (senha, inativo, upgrade de hash): este patch só garante
// que a tentativa aconteça com a base atualizada. Sem token ou sem rede, o
// comportamento é o de antes (o aviso original aparece) — nunca trava o login.
//
// PURE (testável em Node, sem DOM): LOGIN_RETRY_NUVEM_PURE.precisaPuxar.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  if(typeof window==='undefined') return;
  if(window.__v5901loginretry) return;
  window.__v5901loginretry=true;

  /* LOGIN_RETRY_NUVEM_PURE_START */
  function precisaPuxar(o){
    o=o||{};
    return !o.achou && !!o.token && !o.tentando;
  }
  /* LOGIN_RETRY_NUVEM_PURE_END */
  window.LOGIN_RETRY_NUVEM_PURE={ precisaPuxar:precisaPuxar };

  var TENTANDO=false;

  function temToken(){
    try{
      return !!(window.DIGICOPY_CLOUD && window.DIGICOPY_CLOUD.token &&
        window.DIGICOPY_CLOUD.token());
    }catch(e){ return false; }
  }

  // Existe no PC? Mesma comparação do diagnostico do v52253 (login/nome/1º nome).
  function achaLocal(loginVal){
    try{
      var dbw=null;
      try{ dbw=(typeof db!=='undefined')?db:(window.db||null); }catch(e){ dbw=window.db||null; }
      var usuarios=(dbw&&dbw.usuarios)||[];
      var ff=(typeof fold==='function')?fold:function(s){ return String(s||'').toLowerCase().trim(); };
      var alvo=ff(loginVal);
      if(!alvo) return false;
      for(var i=0;i<usuarios.length;i++){
        var u=usuarios[i]; if(!u) continue;
        var cL=ff(u.login), cN=ff(u.nome), cF=(cN.split(/\s+/)[0]||'');
        if(alvo===cL||alvo===cN||alvo===cF) return true;
      }
      return false;
    }catch(e){ return false; }
  }

  function espera(ms){ return new Promise(function(res){ setTimeout(res,ms); }); }

  async function puxarDaNuvem(){
    try{
      var sync=window.DIGICOPY_CLOUD_SYNC;
      if(!sync||typeof sync.tick!=='function') return false;
      var r=await Promise.race([
        sync.tick('login-retry'),
        espera(15000).then(function(){ return 'tempo'; })
      ]);
      return r!=='tempo';
    }catch(e){ return false; }
  }

  function instalar(){
    try{
      var orig=window.doLoginUser;
      if(typeof orig!=='function'||orig.__v5901) return !!orig;
      var embrulho=async function(){
        try{
          var uInput=document.getElementById('login-user');
          var loginVal=String(uInput?(uInput.value||''):'').trim();
          if(loginVal && precisaPuxar({ achou:achaLocal(loginVal), token:temToken(), tentando:TENTANDO })){
            TENTANDO=true;
            try{ if(typeof toast==='function') toast('Usuário não está neste PC — buscando na nuvem…','info'); }catch(eT){}
            await puxarDaNuvem();
            TENTANDO=false;
          }
        }catch(e){ TENTANDO=false; }
        return orig.apply(this,arguments);
      };
      embrulho.__v5901=true;
      window.doLoginUser=embrulho;
      return true;
    }catch(e){ return false; }
  }

  if(!instalar()){
    var tent=0;
    var t=setInterval(function(){
      tent++;
      try{ if(instalar()||tent>150) clearInterval(t); }catch(e){ clearInterval(t); }
    },200);
  }

  // Debug/teste manual no console: loginRetryNuvem.puxarDaNuvem()
  window.loginRetryNuvem={ instalar:instalar, puxarDaNuvem:puxarDaNuvem, precisaPuxar:precisaPuxar };
})();
