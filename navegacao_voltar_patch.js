// PATCH navegacao - pilha 4>3>2>1 para Contratos e TODAS as abas
(function(){
  const viewStack = window._navStack = window._navStack || [];
  const modalStack = window._modalStack = window._modalStack || [];
  
  function currentViewId(){
    const el = document.querySelector('.view:not(.hidden)');
    if(!el) return null;
    return el.id.replace('view-','');
  }
  const origNav = window.navigateTo;
  window.navigateTo = function(view){
    const cur = currentViewId();
    if(cur && cur !== view){
      if(viewStack[viewStack.length-1] !== cur) viewStack.push(cur);
      if(viewStack.length>40) viewStack.shift();
    }
    return origNav ? origNav.apply(this, arguments) : null;
  };

  // Envolve funções que abrem modais para empilhar
  function wrapModal(fnName){
    const orig = window[fnName];
    if(!orig || orig.__wrapped) return;
    window[fnName] = function(...args){
      const modal=document.getElementById('modal-root');
      const aberto = modal && !modal.classList.contains('hidden');
      // salva estado atual antes de abrir novo
      if(aberto){
        // salva html atual e função para restaurar
        modalStack.push({
          html: document.getElementById('modal-body')?.innerHTML || '',
          title: document.getElementById('modal-title')?.innerText || '',
          footer: document.getElementById('modal-footer')?.innerHTML || '',
          fn: fnName,
          args: [...args]
        });
        if(modalStack.length>20) modalStack.shift();
      } else {
        // primeira modal a partir de view, salva view
        const cur = currentViewId();
        if(cur) modalStack.push({view: cur, isView:true});
      }
      return orig.apply(this, args);
    };
    window[fnName].__wrapped=true;
  }
  // Tenta envolver imediatamente e após carga
  function tryWrap(){
    ['openContratoCompleto','abrirChamadosContrato','openModalChamadoCompleto','abrirLeiturasContrato','abrirLancamentoContadorContrato','openModal','abrirModalEquipamentoContrato'].forEach(wrapModal);
  }
  setTimeout(tryWrap, 300);
  setTimeout(tryWrap, 1500);
  try{ const obs=new MutationObserver(()=> tryWrap()); obs.observe(document.body,{childList:true,subtree:true}); }catch(e){}

  // Grupos de abas para voltar dentro do mesmo modal
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
      for(let i=0;i<panels.length;i++) if(!panels[i].classList.contains('hidden')){ idxVis=i; break; }
      if(idxVis>0){
        const btn=document.getElementById(g.tabs[idxVis-1]);
        if(btn){ btn.click(); return true; }
      }
      if(idxVis===0) return false;
    }
    // fallback genérico
    const allTabs = Array.from(root.querySelectorAll('button[id*="tab-"]')).filter(b=> root.contains(b));
    if(allTabs.length>=2){
      let idxVis=-1;
      for(let i=0;i<allTabs.length;i++) if(allTabs[i].className.includes('border-[#0a1e8a]')) idxVis=i;
      if(idxVis>0){ allTabs[idxVis-1].click(); return true; }
    }
    return false;
  }

  function voltarUmaAba(){
    const modal=document.getElementById('modal-root');
    const aberto=modal && !modal.classList.contains('hidden');
    if(aberto){
      if(clickPrevTab()) return;
      // se não tem aba para voltar, desempilha modal
      if(modalStack.length){
        const prev = modalStack.pop();
        if(prev.html !== undefined){
          // restaura modal anterior
          document.getElementById('modal-body').innerHTML = prev.html;
          document.getElementById('modal-title').innerText = prev.title;
          document.getElementById('modal-footer').innerHTML = prev.footer;
          // re-aplica patch nos botões
          setTimeout(()=> patchButtons(), 50);
          return;
        }
        if(prev.view){
          // era view, fecha modal e volta para view (já está na view)
          const orig = window.__origCloseModal;
          if(orig) orig.call(window); else modal.classList.add('hidden');
          return;
        }
        // se tem fn, reabre
        if(prev.fn && window[prev.fn]){
          window[prev.fn].apply(window, prev.args);
          // remove o push que o wrap faria duplicado
          if(modalStack.length && modalStack[modalStack.length-1].fn===prev.fn) modalStack.pop();
          return;
        }
      }
      // última: só fecha
      const orig = window.__origCloseModal;
      if(orig) orig.call(window); else modal.classList.add('hidden');
      return;
    }
    // fora do modal: não navega (não vai para Inicio)
    return;
  }
  window.voltarUmaAba = voltarUmaAba;
  window.__origCloseModal = window.closeModal;
  window.closeModal = function(){ voltarUmaAba(); };
  window.fecharModal = window.closeModal;
  window.fecharModalOperacional = window.closeModal;

  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      e.preventDefault(); e.stopImmediatePropagation();
      voltarUmaAba();
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
  console.log('[DIGICOPY] navegacao pilha 4>3>2>1 carregado');
})();
