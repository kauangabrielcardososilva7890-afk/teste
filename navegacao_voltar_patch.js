// PATCH navegacao - TODAS as abas voltam ao anterior com ESC/X/Sair
(function(){
  function voltarUmaAba(){
    const modal=document.getElementById('modal-root');
    if(!modal || modal.classList.contains('hidden')) return;
    // Tenta achar abas por ordem no DOM (qualquer botão que parece aba)
    // Critério: botão dentro do modal com id contendo "tab-" ou onclick com mudarAba
    const root=modal;
    let tabs = Array.from(root.querySelectorAll('button[id*="tab-"]'));
    if(tabs.length<2){
      // fallback: procura botões que têm borda de aba (border-b-2)
      tabs = Array.from(root.querySelectorAll('button')).filter(b=> b.className.includes('border-b-2') || (b.getAttribute('onclick')||'').includes('mudarAba'));
    }
    // Filtra só os que estão visíveis no modal (dentro do modal e não hidden)
    tabs = tabs.filter(b=> root.contains(b) && b.offsetParent!==null);
    if(tabs.length<2){
      // ainda não achou, tenta pelo painel visível para mapear
      const panels = Array.from(root.querySelectorAll('[id*="painel-"],[id*="prod-"],[id*="aba-"]')).filter(p=> !p.classList.contains('hidden') && root.contains(p));
      if(panels.length===1){
        // acha qual painel está visível e tenta achar sua aba correspondente pelo índice
        // Não tem como saber índice sem GRUPOS, então só fecha se for primeiro
      }
      // Sem abas detectadas: só fecha modal
      const orig = window.__origCloseModal;
      if(orig) orig.call(window); else modal.classList.add('hidden');
      return;
    }
    // Acha aba ativa (com borda azul ou texto azul)
    let idxAtiva = -1;
    for(let i=0;i<tabs.length;i++){
      const c=tabs[i].className||'';
      if(c.includes('border-[#0a1e8a]') || c.includes('text-[#0a1e8a]') || c.includes('border-[#0a1e8a]')){
        idxAtiva=i; break;
      }
    }
    // Fallback: tenta pelo painel visível
    if(idxAtiva===-1){
      const panels = Array.from(root.querySelectorAll('[id*="painel-"],[id*="prod-"],[id*="aba-"]')).filter(p=> root.contains(p));
      for(let i=0;i<panels.length;i++){
        if(!panels[i].classList.contains('hidden')){ idxAtiva=i; break; }
      }
    }
    if(idxAtiva>0){
      tabs[idxAtiva-1].click();
      return;
    }
    if(idxAtiva===0){
      // primeira aba: fecha modal
      const orig = window.__origCloseModal;
      if(orig) orig.call(window); else modal.classList.add('hidden');
      return;
    }
    // não achou ativa, tenta primeiro painel visível genérico
    const allPanels = Array.from(root.querySelectorAll('[id*="painel-"],[id*="prod-"],[id*="aba-"]')).filter(p=> root.contains(p) && !p.classList.contains('hidden'));
    if(allPanels.length===1){
      const orig = window.__origCloseModal;
      if(orig) orig.call(window); else modal.classList.add('hidden');
    }
  }
  window.voltarUmaAba = voltarUmaAba;
  window.__origCloseModal = window.closeModal;
  window.closeModal = function(){ voltarUmaAba(); };
  window.fecharModal = window.closeModal;
  window.fecharModalOperacional = window.closeModal;

  // ESC e X/Sair/Cancelar/Fechar/Voltar
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      const m=document.getElementById('modal-root');
      if(m && !m.classList.contains('hidden')){
        e.preventDefault(); e.stopImmediatePropagation();
        voltarUmaAba();
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
          if(m && !m.classList.contains('hidden')){ e.preventDefault(); e.stopPropagation(); voltarUmaAba(); }
        }, true);
      }
    });
  }
  try{ const obs=new MutationObserver(()=> patchButtons()); obs.observe(document.body,{childList:true,subtree:true}); }catch(e){}
  setTimeout(patchButtons, 500);
  console.log('[DIGICOPY] navegacao simples carregado - TODAS abas voltam');
})();
