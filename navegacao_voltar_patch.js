// PATCH navegacao voltar - X / Sair / ESC volta uma aba antes
(function(){
  const stack = window._navStack = window._navStack || [];
  const tabStack = window._tabStack = window._tabStack || [];

  function currentViewId(){
    const el = document.querySelector('.view:not(.hidden)');
    if(!el) return null;
    return el.id.replace('view-','');
  }

  // wrap navigateTo para empilhar histórico
  const origNav = window.navigateTo;
  window.navigateTo = function(view){
    const cur = currentViewId();
    if(cur && cur !== view){
      // evita duplicar se já é o topo
      if(stack[stack.length-1] !== cur) stack.push(cur);
      if(stack.length>30) stack.shift();
    }
    // origem especial: vendas via atalho
    if(view==='vendas') window._lastVendasEntry = Date.now();
    return origNav ? origNav.apply(this, arguments) : null;
  };

  // helpers para abas de contrato/chamado/leitura/modal genérico
  function findTabs(){
    // procura botões de aba visíveis dentro do modal
    const root = document.getElementById('modal-root');
    if(!root || root.classList.contains('hidden')) return null;
    const btns = Array.from(root.querySelectorAll('[id^="kc-tab-"],[id^="ko-tab-"],[id^="kl-tab-"],[id^="kp-tab-"]'));
    if(!btns.length) return null;
    // filtra só os que estão visíveis (dentro de modal)
    return btns;
  }

  function activeTab(btns){
    for(const b of btns){
      if(b.classList.contains('border-[#0a1e8a]') || b.classList.contains('text-[#0a1e8a]')){
        return b;
      }
    }
    return btns[0]||null;
  }

  function clickPrevTab(){
    const btns = findTabs();
    if(!btns || btns.length<2) return false;
    const cur = activeTab(btns);
    const idx = btns.indexOf(cur);
    if(idx>0){
      btns[idx-1].click();
      return true;
    }
    return false; // na primeira aba
  }

  // override closeModal para usar histórico
  const origClose = window.closeModal;
  const origFecharOp = window.fecharModalOperacional;
  const origFechar = window.fecharModal;

  function voltarOuFechar(){
    // 1) se modal aberto, tenta voltar uma aba
    const modal = document.getElementById('modal-root');
    const modalAberto = modal && !modal.classList.contains('hidden');
    if(modalAberto){
      if(clickPrevTab()) return; // voltou uma aba
      // ultima aba: fecha modal e volta ao menu de origem
      if(origClose) origClose();
      else modal.classList.add('hidden');
      // se veio de vendas via atalho recente (< 5min), volta para vendas
      if(window._lastVendasEntry && (Date.now()-window._lastVendasEntry)<300000){
        setTimeout(()=> window.navigateTo('vendas'), 30);
        return;
      }
      // senão volta ao view do stack
      const prev = stack.pop();
      if(prev) setTimeout(()=> origNav(prev), 30);
      return;
    }
    // 2) sem modal: volta na pilha de views
    const prev = stack.pop();
    if(prev){
      origNav(prev);
    } else {
      // sem histórico: volta ao dashboard
      origNav('dashboard');
    }
  }

  window.voltarUmaAba = voltarOuFechar;
  // intercepta ESC
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      const modal = document.getElementById('modal-root');
      const modalAberto = modal && !modal.classList.contains('hidden');
      // se tem painel de notificação aberto, deixa ele fechar primeiro
      // senão trata nosso voltar
      if(modalAberto || document.querySelector('.view:not(.hidden)')){
        // só age se não houver input focado em edição que queira ESC padrão?
        // mas requisito: qualquer ESC volta uma aba
        e.preventDefault();
        e.stopImmediatePropagation();
        voltarOuFechar();
      }
    }
  }, true);

  // intercepta cliques no botão X / Fechar / Cancelar / Sair dentro do modal
  // substitui onclick="closeModal()" por voltarUmaAba
  function patchModalButtons(){
    const modal = document.getElementById('modal-root');
    if(!modal) return;
    modal.querySelectorAll('button').forEach(b=>{
      const oc = b.getAttribute('onclick')||'';
      if(/closeModal|fecharModal/i.test(oc)){
        b.setAttribute('onclick', 'voltarUmaAba()');
      }
      const txt = (b.textContent||'').trim().toLowerCase();
      if(txt==='x' || txt==='sair' || txt==='fechar' || txt==='cancelar'){
        if(!b.__patchedVoltar){
          b.__patchedVoltar = true;
          b.addEventListener('click', (e)=>{
            // se for cancelar/fechar dentro de modal, usa voltar
            const m = document.getElementById('modal-root');
            if(m && !m.classList.contains('hidden')){
              e.preventDefault();
              e.stopPropagation();
              voltarOuFechar();
            }
          }, true);
        }
      }
    });
  }
  // observa modal para repatch
  try{
    const obs = new MutationObserver(()=> patchModalButtons());
    obs.observe(document.body, {childList:true, subtree:true});
  }catch(e){}

  // corrige etiquetas 7x18 garantindo config
  function garantirEtiquetas7x18(){
    try{
      const sess = typeof getSession==='function'? getSession(): null;
      if(!sess) return;
      if(typeof aplicarConfiguracoesCartuchos==='function'){
        const r = aplicarConfiguracoesCartuchos(db, {empresaId: sess.empresaId});
        if(r && r.alterou && typeof saveDB==='function') saveDB();
      } else if(db && db.config && db.config.cartuchosRecargas && db.config.cartuchosRecargas.etiquetas){
        const et = db.config.cartuchosRecargas.etiquetas;
        let mudou=false;
        if(et.colunas!==7){ et.colunas=7; mudou=true; }
        if(et.linhas!==18){ et.linhas=18; mudou=true; }
        if(et.layout!=='A4_7X18'){ et.layout='A4_7X18'; mudou=true; }
        if(et.larguraMm!==16){ et.larguraMm=16; mudou=true; }
        if(et.alturaMm!==10){ et.alturaMm=10; mudou=true; }
        if(mudou && typeof saveDB==='function') saveDB();
      }
    }catch(e){}
  }
  setTimeout(garantirEtiquetas7x18, 800);
  // reaplica quando renderConfig abrir
  const origRC = window.renderConfig;
  if(origRC){
    window.renderConfig = function(){ const r=origRC.apply(this,arguments); setTimeout(garantirEtiquetas7x18, 200); return r; };
  }

  console.log('[DIGICOPY] navegacao_voltar_patch carregado - ESC/X volta uma aba, etiquetas 7x18 garantidas');
})();
