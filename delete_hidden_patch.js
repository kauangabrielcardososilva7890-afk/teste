// PATCH delete_hidden - DELETA de vez em vez de ocultar
(function(){
  function deletarOcultos(){
    // 1 - texto Sistema Digicopy do login (deleta de vez)
    document.querySelectorAll('#login-screen h1, #login-screen p, #login-screen span').forEach(el=>{
      if(/Sistema Digicopy|Vendas, loca|© 2026 DIGICOPY/i.test(el.textContent||'')) el.remove();
    });
    // Remove elementos que foram apenas ocultados via hidden/display:none mas deveriam ser deletados
    const sel = [
      '[data-nav="migrados"]',
      '#nav-dinamico', '#nav-dinamico-label',
      '[data-dynamic-category]',
      '#rawgh-warn','[id*="rawgh"]',
      '.rawgh-warn'
    ];
    sel.forEach(s=>{
      document.querySelectorAll(s).forEach(el=> el.remove());
    });
    // Remove qualquer .hidden que é menu antigo de migrados
    document.querySelectorAll('.hidden').forEach(el=>{
      if(el.id && el.id.includes('migrados')) el.remove();
    });
  }
  // Roda na carga e observa
  setTimeout(deletarOcultos, 300);
  setTimeout(deletarOcultos, 1500);
  try{
    const obs=new MutationObserver(()=> deletarOcultos());
    obs.observe(document.body, {childList:true, subtree:true});
  }catch(e){}
  // Também sobrescreve funções que criam esses elementos para não recriarem
  const origGarantir = window.garantirBotaoDadosMigrados;
  if(origGarantir) window.garantirBotaoDadosMigrados = function(){ /* deletado - não recria */ };
  console.log('[DIGICOPY] delete_hidden_patch carregado - ocultos deletados de vez');
})();
