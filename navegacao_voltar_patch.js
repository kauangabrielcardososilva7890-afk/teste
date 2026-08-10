// PATCH navegacao voltar - X / Sair / ESC volta uma aba (SIMPLES E CONFIÁVEL)
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
    return origNav ? origNav.apply(this, arguments) : null;
  };

  const GRUPOS = [
    {tabs:['kp-tab-prod-dados','kp-tab-prod-estoque','kp-tab-prod-nf'], panels:['kp-prod-dados','kp-prod-estoque','kp-prod-nf']},
    {tabs:['kc-tab-dados','kc-tab-contato','kc-tab-endereco','kc-tab-impressoras'], panels:['kc-painel-dados','kc-painel-contato','kc-painel-endereco','kc-painel-impressoras']},
    {tabs:['ko-tab-geral','ko-tab-finais','ko-tab-detalhes'], panels:['ko-painel-geral','ko-painel-finais','ko-painel-detalhes']},
    {tabs:['vos-tab-itens','vos-tab-os'], panels:['vos-aba-itens','vos-aba-os']},
  ];

  function clickPrevTab(){
    const root=document.getElementById('modal-root');
    if(!root || root.classList.contains('hidden')) return false;
    for(const g of GRUPOS){
      const panels=g.panels.map(id=>document.getElementById(id)).filter(Boolean);
      if(!panels.length || !panels.some(p=> root.contains(p))) continue;
      let idxVis=-1;
      for(let i=0;i<panels.length;i++){
        if(!panels[i].classList.contains('hidden')){ idxVis=i; break; }
      }
      if(idxVis>0){
        const btn=document.getElementById(g.tabs[idxVis-1]);
        if(btn){ btn.click(); return true; }
      }
      if(idxVis===0) return false;
    }
    // fallback: qualquer tab com borda ativa
    const allTabs = Array.from(root.querySelectorAll('button[id*="tab-"]'));
    if(allTabs.length>=2){
      let idxVis=-1;
      for(let i=0;i<allTabs.length;i++){
        if(allTabs[i].className.includes('border-[#0a1e8a]') || allTabs[i].className.includes('text-[#0a1e8a]')) idxVis=i;
      }
      if(idxVis>0){ allTabs[idxVis-1].click(); return true; }
    }
    return false;
  }

  function voltarOuFechar(){
    const modal=document.getElementById('modal-root');
    const aberto=modal && !modal.classList.contains('hidden');
    if(aberto){
      if(clickPrevTab()) return;
      // última aba: só fecha, fica na mesma view
      const orig = window.__origCloseModal;
      if(orig) orig.call(window);
      else modal.classList.add('hidden');
      return;
    }
    // fora do modal: não faz nada (não vai para Inicio)
    return;
  }
  window.voltarUmaAba = voltarOuFechar;
  window.__origCloseModal = window.closeModal;
  window.closeModal = function(){ voltarOuFechar(); };
  window.fecharModal = window.closeModal;
  window.fecharModalOperacional = window.closeModal;

  // ESC com captura máxima
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      const m=document.getElementById('modal-root');
      if(m && !m.classList.contains('hidden')){
        e.preventDefault(); e.stopImmediatePropagation();
        voltarOuFechar();
      }
    }
  }, true);

  function patchButtons(){
    const modal=document.getElementById('modal-root');
    if(!modal) return;
    modal.querySelectorAll('button').forEach(b=>{
      const oc=b.getAttribute('onclick')||'';
      if(/closeModal|fecharModal/i.test(oc)) b.setAttribute('onclick','voltarUmaAba()');
      const txt=(b.textContent||'').trim().toLowerCase();
      if(['x','sair','fechar','cancelar','voltar'].includes(txt) && !b.__vPatched){
        b.__vPatched=true;
        b.addEventListener('click', (e)=>{
          const m=document.getElementById('modal-root');
          if(m && !m.classList.contains('hidden')){ e.preventDefault(); e.stopPropagation(); voltarOuFechar(); }
        }, true);
      }
    });
  }
  try{ const obs=new MutationObserver(()=> patchButtons()); obs.observe(document.body,{childList:true,subtree:true}); }catch(e){}
  setTimeout(patchButtons, 500);
  console.log('[DIGICOPY] navegacao voltar SIMPLES carregado');
})();
