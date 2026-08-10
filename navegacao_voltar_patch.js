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

  function findTabs(){
    const root = document.getElementById('modal-root');
    if(!root || root.classList.contains('hidden')) return null;
    const btns = Array.from(root.querySelectorAll('[id^="kc-tab-"],[id^="ko-tab-"],[id^="kl-tab-"],[id^="kp-tab-"],[id*="tab-"]')).filter(b=> b.offsetParent!==null || b.getBoundingClientRect().width>0);
    // fallback: procura botões que parecem aba (border-b-2)
    if(btns.length<2){
      const alt = Array.from(root.querySelectorAll('button')).filter(b=> /Dados|Contato|Endere|Impressora|Geral|Finais|Detalhes|Estoque|NF|Itens|Ordem/i.test(b.textContent||''));
      if(alt.length>=2) return alt.slice(0,6);
    }
    return btns.length>=2 ? btns : null;
  }
  function activeTab(btns){
    for(const b of btns){
      if(b.classList.contains('border-[#0a1e8a]') || b.classList.contains('text-[#0a1e8a]') || b.classList.contains('border-[#0a1e8a]')) return b;
    }
    // tenta pelo painel visível
    const panels = Array.from(document.querySelectorAll('[id^="kc-painel-"],[id^="ko-painel-"],[id^="kl-"],[id^="kp-prod-"]'));
    for(const p of panels){
      if(!p.classList.contains('hidden')){
        const id = p.id.replace('painel-','tab-').replace('kc-','kc-tab-').replace('ko-','ko-tab-');
        const btn = document.getElementById(id);
        if(btn) return btn;
      }
    }
    return btns[0]||null;
  }
  function clickPrevTab(){
    const btns = findTabs();
    if(!btns || btns.length<2) return false;
    const cur = activeTab(btns);
    const idx = btns.indexOf(cur);
    if(idx>0){ btns[idx-1].click(); return true; }
    return false;
  }

  function voltarOuFechar(){
    const modal = document.getElementById('modal-root');
    const aberto = modal && !modal.classList.contains('hidden');
    if(aberto){
      if(clickPrevTab()) return;
      // ultima aba: fecha e volta ao menu
      const origClose = window.__origCloseModal || window.closeModal;
      if(origClose) origClose.call(window);
      else modal.classList.add('hidden');
      if(window._lastVendasEntry && (Date.now()-window._lastVendasEntry)<600000){
        setTimeout(()=> window.navigateTo('vendas'), 40);
        return;
      }
      const prev = stack.pop();
      if(prev) setTimeout(()=> origNav(prev), 40);
      // sem histórico não volta ao Início
      return;
    }
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
