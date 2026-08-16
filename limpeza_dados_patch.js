/* =====================================================================
 * LIMPEZA_DADOS v1.0.0 — "começar do zero" SEGURO e MANUAL
 * =====================================================================
 * Diferente do antigo "sistema virgem" (que apagava os dados SOZINHO a
 * cada atualização de código), esta limpeza:
 *   - SÓ roda quando o usuário CLICA no botão (nunca automático);
 *   - mantém a EMPRESA única + os USUÁRIOS (login continua funcionando);
 *   - limpa a nuvem (coleção erp_rt) pra dado antigo não "voltar" no sync;
 *   - pede confirmação (duas vezes), usando confirmSistema (o confirm
 *     nativo está quebrado no sistema).
 * ===================================================================== */
(function(){
  'use strict';
  if(typeof window==='undefined') return;

  var USUARIOS_DEMO = ['carlos','ana','financeiro']; // logins fake da demo antiga

  window.limparTodosDados = function(){
    if(typeof window.confirmSistema !== 'function'){
      if(typeof window.lfbAlert === 'function') window.lfbAlert('Não foi possível confirmar a limpeza.', 'Aviso');
      return;
    }
    window.confirmSistema(
      'Isso apaga TODOS os dados (clientes, produtos, vendas, chamados, financeiro...) deste PC e da nuvem.\n\n' +
      'A empresa e os usuários (logins) são mantidos. Esta ação NÃO pode ser desfeita.',
      'Limpar todos os dados'
    ).then(function(ok){
      if(!ok) return;
      window.confirmSistema('Tem CERTEZA absoluta? Depois disso você precisará importar/recadastrar seus dados.', 'Confirmação final').then(function(ok2){
        if(ok2) executarLimpeza();
      });
    });
  };

  async function executarLimpeza(){
    var btn = document.querySelector('#limpar-dados-wrap button');
    if(btn){ btn.disabled = true; btn.textContent = 'Limpando...'; }
    try{
      // 1) limpa a NUVEM primeiro (pra nada antigo voltar depois)
      try{ if(typeof window.__syncLimparNuvem === 'function') await window.__syncLimparNuvem(); }catch(e){}

      // 2) empresa única (id fixo) — evita duplicar empresa entre PCs
      var usuarios = (db.usuarios||[]).filter(function(u){
        return USUARIOS_DEMO.indexOf((u.login||'').toLowerCase()) < 0;
      });
      db.empresas = [{ id:'emp_digicopy', cnpj:'', cnpjDigits:'', senha:'', nome:'DIGICOPY Cartuchos e Impressoras', fantasia:'DIGICOPY', criadoEm:new Date().toISOString(), criadoPor:'sistema' }];
      usuarios.forEach(function(u){ u.empresaId = 'emp_digicopy'; });
      if(!usuarios.some(function(u){ return (u.login||'').toLowerCase()==='admin' && u.ativo; })){
        usuarios.push({ id:'usr_admin', empresaId:'emp_digicopy', nome:'Administrador', login:'admin', senha:'admin123', perfil:'Admin', ativo:true, criadoEm:new Date().toISOString(), criadoPor:'sistema' });
      }
      db.usuarios = usuarios;

      // 3) zera todos os dados de negócio (mantém empresas/usuarios)
      ['clientes','produtos','equipamentos','contratos','parque','leituras','os','vendas','contasReceber','contasPagar','logs','notificacoes','tecnicos'].forEach(function(k){
        if(Array.isArray(db[k])) db[k] = [];
      });
      db.modulosDinamicos = {};
      db.config = { empresa:{} };
      try{ db.escolaOrc=[]; db.escolaIt=[]; db.escolaExc=[]; }catch(e){}

      // 4) limpa o estado da sincronização (snapshot/cursor) pra recomeçar do zero
      try{ localStorage.removeItem('digicopy_rt_state_v1'); }catch(e){}

      // 5) salva e recarrega
      try{ if(typeof saveDB === 'function') saveDB(); }catch(e){}
      setTimeout(function(){ try{ location.reload(); }catch(e){} }, 350);
    }catch(err){
      if(btn){ btn.disabled = false; btn.textContent = '🗑️ Limpar todos os dados'; }
      if(typeof window.lfbAlert === 'function') window.lfbAlert('Erro ao limpar: ' + (err && err.message ? err.message : err), 'Erro');
    }
  }

  /* ---- injeta o botão no card "Backup" das Configurações ---- */
  function injetarBotaoLimpar(){
    if(typeof document === 'undefined') return;
    var view = document.getElementById('view-config');
    if(!view || document.getElementById('limpar-dados-wrap')) return;
    var h4s = view.querySelectorAll('h4');
    for(var i=0;i<h4s.length;i++){
      if(/backup/i.test(h4s[i].textContent||'')){
        var card = h4s[i].closest('div');
        if(!card) return;
        var wrap = document.createElement('div');
        wrap.id = 'limpar-dados-wrap';
        wrap.className = 'mt-4';
        wrap.innerHTML = '<button onclick="limparTodosDados()" style="width:100%;height:44px;border-radius:12px;background:#fee2e2;border:1px solid #fca5a5;color:#b91c1c;font-size:13px;font-weight:700;cursor:pointer">🗑️ Limpar todos os dados</button>';
        card.appendChild(wrap);
        return;
      }
    }
  }

  function boot(){
    var _rc = window.renderConfig;
    if(typeof _rc === 'function' && !_rc.__limpezaWrap){
      window.renderConfig = function(){
        var r = _rc.apply(this, arguments);
        setTimeout(injetarBotaoLimpar, 60);
        return r;
      };
      window.renderConfig.__limpezaWrap = true;
    }
  }

  if(typeof document === 'undefined') return;
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
