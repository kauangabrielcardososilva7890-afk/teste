// PATCH navegacao voltar - X / Sair / ESC volta uma aba antes + full A4 etiquetas
(function(){
  const stack = window._navStack = window._navStack || [];
  function currentViewId(){
    const el = document.querySelector('.view:not(.hidden)');
    if(!el) return null;
    return el.id.replace('view-','');
  }
  const origNav = window.navigateTo;
  window.navigateTo = function(view){
    const cur = currentViewId();
    if(cur && cur !== view){
      if(stack[stack.length-1] !== cur) stack.push(cur);
      if(stack.length>40) stack.shift();
    }
    if(view==='vendas') window._lastVendasEntry = Date.now();
    if(view==='financeiro') window._lastFinEntry = Date.now();
    return origNav ? origNav.apply(this, arguments) : null;
  };

  const tabHistory = window._tabHistory = window._tabHistory || [];
  function wrapAbas(){
    ['mudarAbaProdutoOperacional','mudarAbaContratoOperacional','mudarAbaChamadoOperacional','vosSetAba','mudarAbaChamadoOperacional'].forEach(fn=>{
      const orig = window[fn];
      if(orig && !orig.__wrapped){
        window[fn] = function(...args){
          const cur = args[0];
          // empilha aba atual antes de mudar
          const last = tabHistory[tabHistory.length-1];
          if(last !== cur) tabHistory.push(cur);
          if(tabHistory.length>20) tabHistory.shift();
          // guarda qual aba estava ativa antes
          const prevAba = document.querySelector('.border-\\[\\#0a1e8a\\]')?.id || '';
          const res = orig.apply(this, args);
          return res;
        };
        window[fn].__wrapped=true;
      }
    });
  }
  setTimeout(wrapAbas, 500);
  setTimeout(wrapAbas, 1500);
  setTimeout(wrapAbas, 3000);
  try{ const obsAba=new MutationObserver(()=> wrapAbas()); obsAba.observe(document.body,{childList:true,subtree:true}); }catch(e){}
  // grupos conhecidos de abas
  // grupos conhecidos de abas
  const GRUPOS = [
    {tabs:['kp-tab-prod-dados','kp-tab-prod-estoque','kp-tab-prod-nf'], panels:['kp-prod-dados','kp-prod-estoque','kp-prod-nf']},
    {tabs:['kc-tab-dados','kc-tab-contato','kc-tab-endereco','kc-tab-impressoras'], panels:['kc-painel-dados','kc-painel-contato','kc-painel-endereco','kc-painel-impressoras']},
    {tabs:['ko-tab-geral','ko-tab-finais','ko-tab-detalhes'], panels:['ko-painel-geral','ko-painel-finais','ko-painel-detalhes']},
    {tabs:['vos-tab-itens','vos-tab-os'], panels:['vos-aba-itens','vos-aba-os']},
    {tabs:['ko-tab-geral','ko-tab-finais'], panels:['ko-painel-geral','ko-painel-finais']},
  ];
  function clickPrevTab(){
    // primeiro tenta histórico real de abas
    if(tabHistory.length>=2){
      const atual = tabHistory[tabHistory.length-1];
      const prev = tabHistory[tabHistory.length-2];
      // remove atual do histórico e volta para anterior
      tabHistory.pop();
      // procura função que troca para prev
      for(const g of GRUPOS){
        if(g.tabs.includes(prev) || g.panels.includes(prev)){
          const idx = g.tabs.indexOf(prev);
          if(idx>=0){
            const btn=document.getElementById(g.tabs[idx]);
            if(btn){ btn.click(); return true; }
          }
          // se prev é panel id, converte para tab
          const tabId = g.tabs[g.panels.indexOf(prev)];
          if(tabId){ document.getElementById(tabId)?.click(); return true; }
        }
      }
      // genérico: tenta achar botão com onclick contendo prev
      const cand=document.querySelector('[onclick*="'+prev+'"]');
      if(cand){ cand.click(); return true; }
    }
    const root=document.getElementById('modal-root');
    if(!root || root.classList.contains('hidden')) return false;
    for(const g of GRUPOS){
      const panels = g.panels.map(id=>document.getElementById(id)).filter(Boolean);
      if(!panels.length) continue;
      const presente = panels.some(p=> root.contains(p));
      if(!presente) continue;
      let idxVis = -1;
      for(let i=0;i<panels.length;i++){
        const p=panels[i];
        if(p && !p.classList.contains('hidden') && p.offsetParent!==null) { idxVis=i; break; }
        if(p && !p.classList.contains('hidden')) { idxVis=i; break; }
      }
      if(idxVis===-1){
        const tabs=g.tabs.map(id=>document.getElementById(id)).filter(Boolean);
        for(let i=0;i<tabs.length;i++){
          const b=tabs[i];
          if(b && (b.classList.contains('border-[#0a1e8a]')||b.classList.contains('text-[#0a1e8a]'))) { idxVis=i; break; }
        }
      }
      if(idxVis>0){
        const prevTab=document.getElementById(g.tabs[idxVis-1]);
        if(prevTab){ prevTab.click(); return true; }
      }
      if(idxVis===0) return false;
      if(idxVis===-1) return false;
    }
    const allTabs = Array.from(root.querySelectorAll('button[id*="tab-"]')).filter(b=> root.contains(b));
    if(allTabs.length>=2){
      let idxVis=-1;
      for(let i=0;i<allTabs.length;i++){
        if(allTabs[i].classList.contains('border-[#0a1e8a]')||allTabs[i].classList.contains('text-[#0a1e8a]')) idxVis=i;
      }
      if(idxVis>0){ allTabs[idxVis-1].click(); return true; }
    }
    return false;
  }

  function voltarOuFechar(){
    const modal = document.getElementById('modal-root');
    const aberto = modal && !modal.classList.contains('hidden');
    if(aberto){
      if(clickPrevTab()) return;
      // última aba ou sem abas: apenas fecha o modal e permanece na mesma view
      const origClose = window.__origCloseModal || window.closeModal;
      // evita recursão: chama o original diretamente sem passar por nosso wrapper
      try{
        if(window.__origCloseModal) window.__origCloseModal.call(window);
        else modal.classList.add('hidden');
      }catch(e){ modal.classList.add('hidden'); }
      return;
    }
    // sem modal: volta ao view anterior da pilha
    const prev = stack.pop();
    if(prev) origNav(prev);
    // se não tem histórico, não faz nada (não vai para Início)
    else { /* fica onde está */ }
  }
  window.voltarUmaAba = voltarOuFechar;

  // guarda original
  window.__origCloseModal = window.closeModal;
  window.closeModal = function(){ voltarOuFechar(); };
  if(window.fecharModal) window.__origFecharModal = window.fecharModal;
  window.fecharModal = window.closeModal;
  if(window.fecharModalOperacional) window.fecharModalOperacional = window.closeModal;

  // ESC global com prioridade máxima
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      e.preventDefault();
      e.stopImmediatePropagation();
      voltarOuFechar();
    }
  }, true);

  // intercepta todos os botões X / Sair / Fechar / Cancelar dentro do modal
  function patchButtons(){
    const modal = document.getElementById('modal-root');
    if(!modal) return;
    modal.querySelectorAll('button').forEach(b=>{
      const oc = b.getAttribute('onclick')||'';
      if(/closeModal|fecharModal/i.test(oc)){
        b.setAttribute('onclick','voltarUmaAba()');
      }
      const txt = (b.textContent||'').trim().toLowerCase();
      if(['x','sair','fechar','cancelar','voltar'].includes(txt)){
        if(!b.__vPatched){
          b.__vPatched=true;
          b.addEventListener('click', (e)=>{
            const m=document.getElementById('modal-root');
            if(m && !m.classList.contains('hidden')){
              e.preventDefault(); e.stopPropagation();
              voltarOuFechar();
            }
          }, true);
        }
      }
    });
    // também o X do header (ícone ph-x)
    modal.querySelectorAll('[onclick*="closeModal"]').forEach(el=>{
      el.setAttribute('onclick','voltarUmaAba()');
    });
  }
  try{ const obs=new MutationObserver(()=> patchButtons()); obs.observe(document.body,{childList:true,subtree:true}); }catch(e){}
  setTimeout(patchButtons, 500);

  // etiquetas 7x18 full A4
  function garantirEtiquetas7x18(){
    try{
      const sess = typeof getSession==='function'? getSession(): null;
      if(!sess) return;
      if(typeof aplicarConfiguracoesCartuchos==='function'){
        const r = aplicarConfiguracoesCartuchos(db, {empresaId: sess.empresaId});
        if(r && r.alterou && typeof saveDB==='function') saveDB();
      }
      if(db && db.config && db.config.cartuchosRecargas && db.config.cartuchosRecargas.etiquetas){
        const et = db.config.cartuchosRecargas.etiquetas;
        let m=false;
        if(et.colunas!==7){et.colunas=7;m=true;}
        if(et.linhas!==18){et.linhas=18;m=true;}
        if(et.layout!=='A4_7X18'){et.layout='A4_7X18';m=true;}
        if(et.larguraMm!==27){et.larguraMm=27;m=true;}
        if(et.alturaMm!==14){et.alturaMm=14;m=true;}
        if(et.margemSuperiorMm!==5){et.margemSuperiorMm=5;m=true;}
        if(et.margemEsquerdaMm!==5){et.margemEsquerdaMm=5;m=true;}
        if(et.espacoHorizontalMm!==1.5){et.espacoHorizontalMm=1.5;m=true;}
        if(et.espacoVerticalMm!==1.2){et.espacoVerticalMm=1.2;m=true;}
        if(m && typeof saveDB==='function') saveDB();
      }
    }catch(e){}
  }
  setTimeout(garantirEtiquetas7x18, 900);
  const origRC = window.renderConfig;
  if(origRC) window.renderConfig = function(){ const r=origRC.apply(this,arguments); setTimeout(garantirEtiquetas7x18, 250); return r; };
  console.log('[DIGICOPY] navegacao_voltar_patch v2 carregado');
})();
