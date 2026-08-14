// PATCH alerta estoque/geral com modal do sistema (igual login incorreto)
(function(){
  function showSystemAlert(msg, title){
    const tid = 'aviso-system-modal';
    const ex = document.getElementById(tid);
    if(ex) ex.remove();
    const div = document.createElement('div');
    div.id = tid;
    div.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)';
    const t = title || 'Aviso';
    const esc = (s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    div.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px 28px;max-width:400px;width:92%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:#fee2e2;margin:0 auto 12px;display:flex;align-items:center;justify-content:center"><span style="font-size:24px">⚠️</span></div>'
      + '<p style="font-size:14px;font-weight:800;color:#0f172a;margin:0 0 4px">'+esc(t)+'</p>'
      + '<p style="font-size:14px;font-weight:600;color:#1e293b;margin:0">'+esc(msg)+'</p>'
      + '<button id="aviso-system-ok" style="margin-top:16px;height:40px;padding:0 24px;border-radius:10px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">OK</button>'
      + '</div>';
    div.addEventListener('click', (e)=>{ if(e.target===div) div.remove(); });
    document.body.appendChild(div);
    const btn = document.getElementById('aviso-system-ok');
    if(btn) btn.onclick = ()=> div.remove();
    // ESC fecha
    const escHandler = (e)=>{ if(e.key==='Escape'){ div.remove(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
  }
  window.lfbAlert = showSystemAlert;
  window.avisoEstoque = showSystemAlert;
  console.log('[DIGICOPY] estoque_alert_patch carregado - modal sistema');
})();
