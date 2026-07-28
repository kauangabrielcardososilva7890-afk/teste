// DIGICOPY Gestão - conexão Supabase (chave publishable/anon pública)
(function(){
  const SUPABASE_PROJECT_URL = 'https://abfzubhivcarwiynuvhz.supabase.co';
  const SUPABASE_REST_URL = `${SUPABASE_PROJECT_URL}/rest/v1`;
  const SUPABASE_KEY = 'sb_publishable_O91tDfAY_vrtp8feezXXkA_aNhpCjJH';

  window.DIGICOPY_SUPABASE = {
    projectUrl: SUPABASE_PROJECT_URL,
    restUrl: SUPABASE_REST_URL,
    key: SUPABASE_KEY,
    configured: true
  };

  function supabaseHeaders(extra={}){
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...extra
    };
  }

  async function supabaseRequest(path, options={}){
    const cleanPath = String(path||'').replace(/^\/+/, '');
    const response = await fetch(`${SUPABASE_REST_URL}/${cleanPath}`, {
      ...options,
      headers: supabaseHeaders(options.headers||{})
    });
    const text = await response.text();
    let data = null;
    try{ data = text ? JSON.parse(text) : null; }catch{ data = text; }
    if(!response.ok){
      const message = typeof data === 'object' && data ? (data.message || data.error || JSON.stringify(data)) : (data || `HTTP ${response.status}`);
      throw {status:response.status, data, message};
    }
    return data;
  }

  window.supabaseRequest = supabaseRequest;

  window.testarSupabase = async function(showToast=true){
    const target = document.getElementById('cloud-connection-status');
    if(target) target.innerHTML = '<span class="text-slate-500">Testando conexão...</span>';
    try{
      // Se a tabela ainda não existir, a resposta será 404/erro PGRST, mas a URL/chave já foram validadas.
      const data = await supabaseRequest('empresas?select=id&limit=1', {method:'GET'});
      if(target) target.innerHTML = '<span class="text-emerald-700 font-bold">Conectado ao Supabase. Tabela empresas acessível.</span>';
      if(showToast && typeof toast==='function') toast('Supabase conectado com sucesso', 'success');
      return {ok:true, data};
    }catch(err){
      const msg = err?.message || String(err);
      const isSchemaMissing = msg.includes('Could not find') || msg.includes('schema cache') || msg.includes('does not exist') || err?.status===404;
      if(target){
        target.innerHTML = isSchemaMissing
          ? '<span class="text-amber-700 font-bold">Projeto conectado, mas as tabelas ainda não foram criadas.</span>'
          : `<span class="text-red-700 font-bold">Falha na conexão: ${escapeHtml(msg)}</span>`;
      }
      if(showToast && typeof toast==='function') toast(isSchemaMissing ? 'Supabase respondeu. Falta criar as tabelas.' : 'Erro ao conectar Supabase: '+msg, isSchemaMissing ? 'info' : 'error');
      return {ok:false, schemaMissing:isSchemaMissing, error:err};
    }
  };

  window.supabaseInfo = function(){
    const msg = `Projeto Supabase configurado:\n\n${SUPABASE_PROJECT_URL}\n\nChave usada: publishable/anon pública.\nNão use service_role no navegador.`;
    alert(msg);
  };

  function cloudMigrationHtml(){
    return `
      <div class="neo-shell">
        <div class="neo-panel neo-float-in">
          <div class="neo-head">
            <div>
              <h3>Migração e nuvem</h3>
              <p>Supabase configurado para receber os dados do sistema antigo e sincronizar computadores</p>
            </div>
            <div class="neo-actions">
              <button onclick="testarSupabase()" class="neo-btn primary"><i class="ph ph-plugs-connected"></i>Testar conexão</button>
              <button onclick="supabaseInfo()" class="neo-btn"><i class="ph ph-info"></i>Dados</button>
            </div>
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="neo-card"><p class="neo-label">Projeto</p><b class="text-[#0a1e8a] break-all">${SUPABASE_PROJECT_URL}</b></div>
            <div class="neo-card"><p class="neo-label">Status</p><div id="cloud-connection-status" class="text-[13px] text-slate-600">Clique em testar conexão.</div></div>
            <div class="neo-card"><p class="neo-label">Arquivo legado</p><p class="text-[13px] text-slate-600">BANCO.rar no bucket <b>migracao</b>. Ele será usado para extrair o Firebird e importar as tabelas.</p></div>
          </div>
          <div class="p-4 pt-0 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="neo-card"><b>1. Tabelas</b><p class="text-[12px] text-slate-500 mt-1">Criar schema inicial no SQL Editor.</p></div>
            <div class="neo-card"><b>2. Importação</b><p class="text-[12px] text-slate-500 mt-1">Extrair o FDB e mapear tabelas antigas.</p></div>
            <div class="neo-card"><b>3. Sistema online</b><p class="text-[12px] text-slate-500 mt-1">Trocar localStorage pelo Supabase.</p></div>
            <div class="neo-card"><b>4. Tempo real</b><p class="text-[12px] text-slate-500 mt-1">Atualizar telas entre computadores.</p></div>
          </div>
        </div>
      </div>`;
  }

  window.renderBanco = function(){
    const view = document.getElementById('view-banco') || (typeof ensureView==='function' ? ensureView('banco') : null);
    if(!view) return;
    view.innerHTML = cloudMigrationHtml();
  };

  window.openCloudMigration = function(){
    const view = document.getElementById('view-banco') || (typeof ensureView==='function' ? ensureView('banco') : null);
    if(!view) return;
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    view.classList.remove('hidden');
    const title=document.getElementById('page-title'); if(title) title.innerText='Migração e nuvem';
    const subtitle=document.getElementById('page-subtitle'); if(subtitle) subtitle.innerText='Supabase, importação e sincronização';
    window.renderBanco();
    window.scrollTo({top:0,behavior:'smooth'});
  };
})();
