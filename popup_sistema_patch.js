// PATCH todos os popups no estilo do sistema (igual login incorreto) - REMOVE popups antigos
(function(){
  function showModal(msg, title, isConfirm){
    return new Promise(resolve=>{
      const tid='aviso-system-modal-'+Date.now();
      const div=document.createElement('div');
      div.id=tid;
      div.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45)';
      const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const isDel = /excluir|apagar|deletar|remover|sair|estornar/i.test((title||'')+' '+(msg||''));
      const icon = isDel ? '🗑️' : '⚠️';
      const bgIcon = isDel ? '#fee2e2' : '#e0e7ff';
      div.innerHTML='<div style="background:#fff;border-radius:18px;padding:26px 28px;max-width:420px;width:92%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.35);border:1px solid #e2e8f0">'
        +'<div style="width:52px;height:52px;border-radius:50%;background:'+bgIcon+';margin:0 auto 14px;display:grid;place-items:center;font-size:26px">'+icon+'</div>'
        +'<p style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 6px">'+esc(title||'Aviso')+'</p>'
        +'<p style="font-size:13.5px;font-weight:500;color:#334155;margin:0;line-height:1.5;white-space:pre-wrap">'+esc(msg)+'</p>'
        +'<div style="margin-top:18px;display:flex;gap:10px;justify-content:center">'
        +(isConfirm?'<button id="'+tid+'-cancel" style="height:42px;padding:0 22px;border-radius:11px;background:#fff;border:1px solid #cbd5e1;color:#334155;font-size:13px;font-weight:700;cursor:pointer">Cancelar</button>':'')
        +'<button id="'+tid+'-ok" style="height:42px;padding:0 24px;border-radius:11px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">'+(isConfirm?'Confirmar':'OK')+'</button>'
        +'</div></div>';
      const close=(val)=>{ div.remove(); document.removeEventListener('keydown', onKey); resolve(val); };
      const onKey=(e)=>{ if(e.key==='Escape') close(isConfirm?false:undefined); if(e.key==='Enter') close(isConfirm?true:undefined); };
      document.addEventListener('keydown', onKey);
      div.addEventListener('click', (e)=>{ if(e.target===div) close(isConfirm?false:undefined); });
      document.body.appendChild(div);
      const ok=document.getElementById(tid+'-ok'); if(ok) ok.onclick=()=> close(isConfirm?true:undefined);
      const cancel=document.getElementById(tid+'-cancel'); if(cancel) cancel.onclick=()=> close(false);
      if(ok) ok.focus();
    });
  }
  window.lfbAlert = (msg,title)=> showModal(msg, title||'Aviso', false);
  window.avisoSistema = (msg,title)=> showModal(msg, title||'Aviso', false);
  window.confirmSistema = (msg,title)=> showModal(msg, title||'Confirmar', true);

  // REMOVE completamente alert/confirm nativos (não chama orig)
  window.alert = function(msg){ showModal(String(msg), 'Aviso', false); };
  window.confirm = function(msg){
    // para compatibilidade, mostra modal e retorna false (ação será refeita via wrappers abaixo)
    showModal(String(msg), 'Confirmar', true);
    return false;
  };

  // Wrappers para ações que usavam confirm() - agora usam confirmSistema corretamente
  function wrapConfirm(fnName, msgGen){
    const orig = window[fnName];
    if(!orig) return;
    window[fnName] = function(...args){
      const msg = typeof msgGen==='function' ? msgGen(...args) : msgGen;
      confirmSistema(msg, 'Confirmar').then(ok=>{ if(ok) orig.apply(this, args); });
    };
  }

  // Aguarda app carregar e então envolve
  setTimeout(()=>{
    // Sair
    const origLogout = window.doLogout;
    if(origLogout){
      window.doLogout = function(){
        confirmSistema('Sair do sistema?', 'Sair').then(ok=>{
          if(!ok) return;
          const sess=typeof getSession==='function'?getSession():null;
          if(sess){ try{ db.logs.unshift({id: (typeof uid==='function'?uid('log'):'log_'+Date.now()), dataHora:new Date().toISOString(), empresaId:sess.empresaId, usuarioId:sess.usuarioId, usuarioNome:sess.usuarioNome, usuarioLogin:sess.login, entidade:'auth', acao:'logout', entidadeId:sess.usuarioId, detalhes:'Logout'}); if(typeof saveDB==='function') saveDB(); }catch(e){} }
          try{ localStorage.removeItem('digicopy_session_v42_demo_apresentacao'); localStorage.removeItem('digicopy_pending_cnpj_v42_demo_apresentacao'); }catch(e){}
          if(typeof showLogin==='function') showLogin();
          if(typeof toast==='function') toast('Sessão encerrada','info');
        });
      };
    }
    // deletes
    const delMap = {
      // 'deleteCliente' saiu daqui na v5.20.23: ele já confirma sozinho
      // (confirmSistema) e agora EXCLUI de verdade, em vez de inativar.
      'deleteProduto': (id)=> 'Excluir produto?',
      'deleteUsuario': (id)=> { const u=(db.usuarios||[]).find(x=>x.id===id); return 'Excluir usuário '+(u?u.nome:'')+'?'; },
      'deleteVenda': (id)=> 'Excluir venda? Estoque será estornado.',
      // 'deleteCR' saiu daqui na v5.20.23: agora ele já confirma sozinho
      // (confirmSistema) — deixar aqui faria pedir confirmação duas vezes.
      'deleteVDA': (id)=> 'Excluir venda?',
    };
    Object.entries(delMap).forEach(([name, gen])=>{
      if(window[name]){
        const orig = window[name];
        window[name] = function(...args){
          const msg = typeof gen==='function'? gen(...args) : gen;
          confirmSistema(msg, 'Excluir').then(ok=>{ if(ok) orig.apply(this,args); });
        };
      }
    });
    // estornar / outros confirms
    if(window.estornarVendaParaEditar){
      const orig = window.estornarVendaParaEditar;
      window.estornarVendaParaEditar = function(id){
        confirmSistema('Estornar esta notinha para permitir edição?', 'Estornar').then(ok=>{ if(ok) orig(id); });
      };
    }
    if(window.estornarVenda){
      const orig = window.estornarVenda;
      window["estornarVenda"] = function(id){
        confirmSistema('Estornar esta venda? Ela voltará como orçamento.', 'Estornar').then(ok=>{ if(ok) orig(id); });
      };
    }
  }, 800);

  console.log('[DIGICOPY] popup_sistema_patch v2 carregado - TODOS popups no estilo sistema, antigos removidos');
})();
