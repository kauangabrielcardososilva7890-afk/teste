// PATCH navegacao - DELETA aba anterior, não esconde - TODAS as abas
(function(){
  function voltarUmaAba(){
    const modal=document.getElementById('modal-root');
    if(!modal || modal.classList.contains('hidden')) return;
    // Acha TODOS os botões que são abas (qualquer botão com onclick mudarAba ou id com tab-)
    let tabs = Array.from(modal.querySelectorAll('button')).filter(b=>{
      const oc=b.getAttribute('onclick')||'';
      const id=b.id||'';
      return oc.includes('mudarAba') || id.includes('tab-') || b.className.includes('border-b-2');
    });
    // Filtra só os que são abas de verdade (têm borda ou estão no topo do modal)
    tabs = tabs.filter(b=> b.offsetParent!==null || b.getBoundingClientRect().width>10);
    // Remove duplicados e mantém ordem do DOM
    tabs = [...new Set(tabs)];
    if(tabs.length<2){
      // Sem abas detectadas: só fecha modal
      const orig = window.__origCloseModal;
      if(orig) orig.call(window); else modal.classList.add('hidden');
      return;
    }
    // Acha aba ativa: tem borda azul ou texto azul ou painel correspondente visível
    let idxAtiva = -1;
    for(let i=0;i<tabs.length;i++){
      const c=tabs[i].className||'';
      if(c.includes('border-[#0a1e8a]') || c.includes('text-[#0a1e8a]') || c.includes('bg-[#0a1e8a]')){
        idxAtiva=i; break;
      }
    }
    // Fallback: procura painel visível e mapeia para aba por ordem
    if(idxAtiva===-1){
      const panels = Array.from(modal.querySelectorAll('[id*="painel"],[id*="prod-"],[id*="aba-"]')).filter(p=> !p.classList.contains('hidden') && modal.contains(p));
      if(panels.length===1){
        // Tenta mapear painel visível para aba por índice
        const allPanels = Array.from(modal.querySelectorAll('[id*="painel"],[id*="prod-"],[id*="aba-"]')).filter(p=> modal.contains(p));
        const visId = panels[0].id;
        // Acha índice do painel visível entre todos os painéis do mesmo grupo
        for(let i=0;i<allPanels.length;i++){
          if(allPanels[i].id===visId){ idxAtiva=i; break; }
        }
      }
    }
    if(idxAtiva>0){
      tabs[idxAtiva-1].click();
      return;
    }
    if(idxAtiva===0){
      const orig = window.__origCloseModal;
      if(orig) orig.call(window); else modal.classList.add('hidden');
      return;
    }
    // Se não achou ativa, tenta clicar na primeira anterior visível
    if(tabs.length>=2){
      // Assume que a última é a ativa se não detectou
      tabs[tabs.length-2].click();
      return;
    }
  }
  window.voltarUmaAba = voltarUmaAba;
  window.__origCloseModal = window.closeModal;
  window.closeModal = function(){ voltarUmaAba(); };
  window.fecharModal = window.closeModal;
  window.fecharModalOperacional = window.closeModal;

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
      if(['x','sair','fechar','cancelar','voltar','← voltar'].includes(txt) && !b.__vPatched){
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
  console.log('[DIGICOPY] navegacao TODAS abas - DELETA, não esconde');
})();
