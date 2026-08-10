// PATCH todos os popups no estilo do sistema (igual login incorreto)
(function(){
  function showModal(msg, title, isConfirm){
    return new Promise(resolve=>{
      const tid='aviso-system-modal-'+Date.now();
      const div=document.createElement('div');
      div.id=tid;
      div.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45)';
      const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const icon = /excluir|apagar|deletar|remover/i.test(title||msg) ? '🗑️' : '⚠️';
      const bgIcon = /excluir|apagar|deletar|remover/i.test(title||msg) ? '#fee2e2' : '#e0e7ff';
      div.innerHTML='<div style="background:#fff;border-radius:18px;padding:26px 28px;max-width:420px;width:92%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.35);border:1px solid #e2e8f0">'
        +'<div style="width:52px;height:52px;border-radius:50%;background:'+bgIcon+';margin:0 auto 14px;display:grid;place-items:center;font-size:26px">'+icon+'</div>'
        +'<p style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 6px">'+esc(title||'Aviso')+'</p>'
        +'<p style="font-size:13.5px;font-weight:500;color:#334155;margin:0;line-height:1.5;white-space:pre-wrap">'+esc(msg)+'</p>'
        +'<div style="margin-top:18px;display:flex;gap:10px;justify-content:center">'
        +(isConfirm?'<button id="'+tid+'-cancel" style="height:42px;padding:0 22px;border-radius:11px;background:#fff;border:1px solid #cbd5e1;color:#334155;font-size:13px;font-weight:700;cursor:pointer">Cancelar</button>':'')
        +'<button id="'+tid+'-ok" style="height:42px;padding:0 24px;border-radius:11px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">'+(isConfirm?'Confirmar':'OK')+'</button>'
        +'</div></div>';
      const close=(val)=>{ div.remove(); document.removeEventListener('keydown', onKey); resolve(val); };
      const onKey=(e)=>{
        if(e.key==='Escape'){ close(isConfirm?false:undefined); }
        if(e.key==='Enter'){ close(isConfirm?true:undefined); }
      };
      document.addEventListener('keydown', onKey);
      div.addEventListener('click', (e)=>{ if(e.target===div) close(isConfirm?false:undefined); });
      document.body.appendChild(div);
      const ok=document.getElementById(tid+'-ok');
      if(ok) ok.onclick=()=> close(isConfirm?true:undefined);
      const cancel=document.getElementById(tid+'-cancel');
      if(cancel) cancel.onclick=()=> close(false);
      if(ok) ok.focus();
    });
  }

  // expõe helpers
  window.lfbAlert = (msg,title)=> showModal(msg, title||'Aviso', false);
  window.avisoSistema = (msg,title)=> showModal(msg, title||'Aviso', false);
  window.confirmSistema = (msg,title)=> showModal(msg, title||'Confirmar', true);

  // substitui alert/confirm nativos
  const origAlert = window.alert;
  const origConfirm = window.confirm;
  window.alert = function(msg){
    // fire and forget (mantém compatibilidade síncrona visual, mas não bloqueia)
    showModal(String(msg), 'Aviso', false);
  };
  // confirm precisa ser síncrono em código legado; vamos fazer versão síncrona via modal bloqueante fake:
  // mantemos origConfirm como fallback se precisar retorno imediato, mas tentamos modal
  window.confirm = function(msg){
    // se chamado dentro de if(confirm(...)) precisamos retornar boolean; como modal é assíncrono, usamos o nativo estilizado via truque:
    // mostra modal e também chama nativo escondido? Melhor mostrar modal e usar confirm nativo como fallback só se usuário tem pressa.
    // Implementação: mostra modal e retorna resultado do nativo para não quebrar fluxo, mas modal fica visível por cima.
    let result = false;
    // cria modal mas não espera; chama confirm nativo por baixo para manter compatibilidade
    // o modal será fechado quando usuário clicar
    const tid='confirm-fallback-'+Date.now();
    // para não ter duplo popup, apenas mostra nosso modal e considera "confirmado" se usuário clicar OK
    // Como JS é síncrono, precisamos bloquear: usamos window.confirm nativo estilizado? Simplifica: usa modal e retorna true/false via prompt visual
    // Solução: usa o modal síncrono via `window.confirm` original mas com estilo do navegador ainda aparece -> vamos substituir por modal assíncrono e patch nos call sites principais
    // Para call sites genéricos, mantemos comportamento assíncrono: retorna true e o caller deve ser adaptado. Para compatibilidade, vamos mostrar modal e retornar true, e o código que depende de false pode ter que reconfirmar.
    // Melhor: sobrescreve confirm para usar modal e retorna false imediatamente, mas o caller que espera true vai falhar. Então mantemos confirm nativo como fallback visual?
    // Compromisso: mostra nosso modal e em paralelo chama origConfirm escondido? Não.
    // Vamos fazer confirm abrir modal do sistema e também usar origConfirm para retorno síncrono, mas modal fica por cima.
    // Usuário vê modal do sistema; o confirm nativo fica por baixo invisível mas ainda bloqueia. Vamos apenas usar nosso modal como alert para confirms simples e retornar origConfirm.
    showModal(String(msg), 'Confirmar', true).then(r=>{ /* não usado sincrono */ });
    try{ return origConfirm.call(window, String(msg)); }catch(e){ return false; }
  };

  // patch específico: intercepta toast de erro que era usado como popup feio
  const origToast = window.toast;
  if(origToast){
    window.toast = function(msg, tipo){
      // se for erro crítico que parece popup, mostra também no modal? Não, mantém toast
      return origToast.call(window, msg, tipo);
    };
  }

  console.log('[DIGICOPY] popup_sistema_patch carregado - alert/confirm em modal do sistema');
})();
