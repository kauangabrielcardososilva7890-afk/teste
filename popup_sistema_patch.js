// PATCH todos os popups no estilo do sistema (igual login incorreto) - REMOVE popups antigos
(function(){
  // Preserva o confirm real como compatibilidade para fluxos legados ainda
  // síncronos. Antes este patch sempre retornava false e vários botões
  // cancelavam silenciosamente mesmo após o usuário confirmar no modal.
  const nativeConfirm = (typeof window.confirm === 'function') ? window.confirm.bind(window) : null;
  window.__confirmSistemaBypass = 0;
  function allowLegacyConfirmOnce(){
    window.__confirmSistemaBypass = 1;
    setTimeout(()=>{ window.__confirmSistemaBypass = 0; }, 0);
  }
  function showModal(msg, title, isConfirm){
    return new Promise(resolve=>{
      const tid='aviso-system-modal-'+Date.now();
      const div=document.createElement('div');
      div.id=tid;
      // v5.24.34 — BUG REAL apanhado por ele: 'Excluir de vez não faz nada / pop-ups
  // aparecem ATRÁS da aba de nuvem'. Eram um problema só: a janela da nuvem usa
  // z-index 100000 e as janelas de sistema 99999 — o pop-up nascia escondido
  // atrás dela. Diálogos do sistema agora vivem acima de TUDO (teto CSS seguro).
  div.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45)';
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
    // Wrappers assíncronos já perguntaram no popup do sistema: a chamada
    // síncrona interna recebe um "sim" único, sem mostrar um segundo aviso.
    if(window.__confirmSistemaBypass > 0){ window.__confirmSistemaBypass--; return true; }
    // Funções antigas ainda não migradas continuam operacionais com o diálogo
    // nativo, em vez de falhar silenciosamente. Serão migradas gradualmente.
    return nativeConfirm ? nativeConfirm(String(msg)) : false;
  };

  // Wrappers para ações que usavam confirm() - agora usam confirmSistema corretamente
  function wrapConfirm(fnName, msgGen){
    const orig = window[fnName];
    if(!orig) return;
    window[fnName] = function(...args){
      const msg = typeof msgGen==='function' ? msgGen(...args) : msgGen;
      confirmSistema(msg, 'Confirmar').then(ok=>{ if(ok){ allowLegacyConfirmOnce(); orig.apply(this, args); } });
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
      'deleteCliente': (id)=> 'Inativar cliente?',
      'deleteProduto': (id)=> 'Excluir produto?',
      'deleteUsuario': (id)=> { const u=(db.usuarios||[]).find(x=>x.id===id); return 'Excluir usuário '+(u?u.nome:'')+'?'; },
      'deleteVenda': (id)=> 'Excluir venda? Estoque será estornado.',
      'deleteCR': (id)=> 'Excluir título?',
      'deleteVDA': (id)=> 'Excluir venda?',
    };
    Object.entries(delMap).forEach(([name, gen])=>{
      if(window[name]){
        const orig = window[name];
        window[name] = function(...args){
          const msg = typeof gen==='function'? gen(...args) : gen;
          confirmSistema(msg, 'Excluir').then(ok=>{ if(ok){ allowLegacyConfirmOnce(); orig.apply(this,args); } });
        };
      }
    });
    // estornar / outros confirms
    if(window.estornarVendaParaEditar){
      const orig = window.estornarVendaParaEditar;
      window.estornarVendaParaEditar = function(id){
        confirmSistema('Estornar esta notinha para permitir edição?', 'Estornar').then(ok=>{ if(ok){ allowLegacyConfirmOnce(); orig(id); } });
      };
    }
    if(window.estornarVenda){
      const orig = window.estornarVenda;
      window["estornarVenda"] = function(id){
        confirmSistema('Estornar esta venda? Ela voltará como orçamento.', 'Estornar').then(ok=>{ if(ok){ allowLegacyConfirmOnce(); orig(id); } });
      };
    }
  }, 800);

  // ── CAMPO DE TEXTO DO SISTEMA (auditoria) ─────────────────────────────────
  // BUG REAL achado na auditoria: o Electron NÃO implementa window.prompt — a
  // função EXISTE, mas lança "prompt() is not supported" quando chamada.
  // Por isso a guarda `typeof prompt === 'function'` espalhada pelo sistema não
  // protegia nada: no .exe ela dá true e a chamada estoura. Resultado: botão
  // mudo (Ler status da impressora, Editar notas do portal, senha do
  // certificado), sem mensagem nenhuma — proibido pela regra "nenhum botão
  // pode ficar morto ou silencioso".
  //
  // Esta é a versão do sistema do prompt, no mesmo estilo dos outros popups:
  // devolve Promise com o texto digitado, ou null se o usuário desistir.
  // Nunca usa o prompt nativo (regra: nunca usar prompt/confirm/alert nativos).
  // Nome próprio para não colidir com o nfxPedirTexto da Central Fiscal.
  window.pedirTextoSistema = function(msg, op){
    op = op || {};
    return new Promise(resolve=>{
      const tid='texto-system-modal-'+Date.now();
      const div=document.createElement('div');
      div.id=tid;
      div.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45)';
      const escTxt=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const valorInicial = (op.valor==null) ? '' : String(op.valor);
      div.innerHTML='<div style="background:#fff;border-radius:18px;padding:22px 24px;max-width:460px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,0.35);border:1px solid #e2e8f0">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;gap:10px">'
        +'<p style="font-size:15px;font-weight:800;color:#0f172a;margin:0">'+escTxt(op.titulo||'Digite')+'</p>'
        +'<button id="'+tid+'-x" title="Fechar" style="font-size:20px;line-height:1;padding:2px 9px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;color:#64748b">×</button></div>'
        +'<p style="font-size:13px;font-weight:500;color:#334155;margin:10px 0 0;line-height:1.5;white-space:pre-wrap">'+escTxt(msg)+'</p>'
        +'<input id="'+tid+'-in" '+(op.mascara?'type="password" ':'type="text" ')+'value="'+escTxt(valorInicial)+'" style="margin-top:12px;width:100%;height:42px;border:1px solid #cbd5e1;border-radius:11px;padding:0 12px;font-size:14px;box-sizing:border-box">'
        +'<div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end">'
        +'<button id="'+tid+'-cancel" style="height:42px;padding:0 22px;border-radius:11px;background:#fff;border:1px solid #cbd5e1;color:#334155;font-size:13px;font-weight:700;cursor:pointer">Cancelar</button>'
        +'<button id="'+tid+'-ok" style="height:42px;padding:0 24px;border-radius:11px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">Confirmar</button>'
        +'</div></div>';
      const close=(val)=>{ div.remove(); document.removeEventListener('keydown', onKey); resolve(val); };
      // Igual ao prompt nativo: texto vazio é resposta válida (string vazia),
      // quem chama decide o que fazer com ela.
      const confirmar=()=>{
        const el=div.querySelector('#'+tid+'-in');
        close(el ? String(el.value) : '');
      };
      const onKey=(e)=>{ if(e.key==='Escape') close(null); if(e.key==='Enter') confirmar(); };
      document.addEventListener('keydown', onKey);
      div.addEventListener('click', (e)=>{ if(e.target===div) close(null); });
      document.body.appendChild(div);
      const ok=div.querySelector('#'+tid+'-ok'); if(ok) ok.onclick=confirmar;
      const cancel=div.querySelector('#'+tid+'-cancel'); if(cancel) cancel.onclick=()=>close(null);
      const x=div.querySelector('#'+tid+'-x'); if(x) x.onclick=()=>close(null);
      const inp=div.querySelector('#'+tid+'-in'); if(inp) inp.focus();
    });
  };

  // Mostra um texto para o usuário copiar (usado quando a área de transferência
  // não está disponível). Antes esses pontos caíam no prompt nativo, que
  // estourava no .exe e deixava o botão mudo.
  window.mostrarTextoCopiar = function(titulo, texto){
    return new Promise(resolve=>{
      const tid='copia-system-modal-'+Date.now();
      const div=document.createElement('div');
      div.id=tid;
      div.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45)';
      const escTxt=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      div.innerHTML='<div style="background:#fff;border-radius:18px;padding:22px 24px;max-width:520px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,0.35);border:1px solid #e2e8f0">'
        +'<p style="font-size:15px;font-weight:800;color:#0f172a;margin:0">'+escTxt(titulo||'Copie o texto')+'</p>'
        +'<textarea id="'+tid+'-tx" readonly style="margin-top:12px;width:100%;height:96px;border:1px solid #cbd5e1;border-radius:11px;padding:8px 10px;font-size:12.5px;box-sizing:border-box;resize:vertical">'+escTxt(texto)+'</textarea>'
        +'<div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end">'
        +'<button id="'+tid+'-cp" style="height:42px;padding:0 20px;border-radius:11px;background:#fff;border:1px solid #cbd5e1;color:#334155;font-size:13px;font-weight:700;cursor:pointer">Copiar</button>'
        +'<button id="'+tid+'-ok" style="height:42px;padding:0 24px;border-radius:11px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">Fechar</button>'
        +'</div></div>';
      const close=()=>{ div.remove(); document.removeEventListener('keydown', onKey); resolve(undefined); };
      const onKey=(e)=>{ if(e.key==='Escape'||e.key==='Enter') close(); };
      document.addEventListener('keydown', onKey);
      div.addEventListener('click', (e)=>{ if(e.target===div) close(); });
      document.body.appendChild(div);
      const ok=div.querySelector('#'+tid+'-ok'); if(ok) ok.onclick=close;
      const tx=div.querySelector('#'+tid+'-tx');
      const cp=div.querySelector('#'+tid+'-cp');
      if(cp) cp.onclick=()=>{
        try{ if(tx){ tx.select(); document.execCommand('copy'); } }catch(e){}
        close();
      };
      if(tx) tx.focus();
    });
  };

  // ── REDE DE SEGURANÇA do prompt nativo ────────────────────────────────────
  // Nenhum ponto do sistema deve usar prompt/confirm/alert nativos. Aqui o
  // alert e o confirm já foram trocados; o prompt tinha ficado de fora. No .exe
  // ele não existe de verdade (só existe a função que lança erro), então quem
  // chamava perdia o fluxo inteiro em silêncio.
  // Esta troca NUNCA lança: mostra o aviso do sistema e devolve null, para o
  // fluxo continuar e o usuário ver o motivo em vez de um botão mudo.
  // Fica registrado para o diagnóstico (npm run diag / log-erros.txt).
  window.prompt = function(msg, valor){
    try{
      if(!window.__DIGICOPY_PROMPT_NATIVO){
        window.__DIGICOPY_PROMPT_NATIVO=[];
      }
      const texto=String(msg==null?'':msg);
      window.__DIGICOPY_PROMPT_NATIVO.push(texto.slice(0,200));
      if(window.__DIGICOPY_PROMPT_NATIVO.length>50) window.__DIGICOPY_PROMPT_NATIVO.shift();
      if(window.mostrarTextoCopiar && (valor!=null && String(valor)!=='')){
        window.mostrarTextoCopiar('Aviso', texto+'\n\n'+String(valor));
      }else if(window.lfbAlert){
        window.lfbAlert(texto,'Aviso');
      }
    }catch(e){}
    return null;
  };

  console.log('[DIGICOPY] popup_sistema_patch v2 carregado - TODOS popups no estilo sistema, antigos removidos');
})();
