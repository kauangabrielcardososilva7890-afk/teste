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

  const previousRenderBanco = window.renderBanco;
  window.renderBanco = function(){
    if(typeof previousRenderBanco === 'function') previousRenderBanco();
    const view = document.getElementById('view-banco') || (typeof ensureView==='function' ? ensureView('banco') : null);
    if(!view) return;
    const card = document.createElement('div');
    card.className = 'neo-shell pt-0';
    card.innerHTML = `
      <div class="neo-panel neo-float-in">
        <div class="neo-head">
          <div>
            <h3>Conexão Supabase</h3>
            <p>Projeto configurado para banco em nuvem e importação futura dos dados antigos</p>
          </div>
          <div class="neo-actions">
            <button onclick="testarSupabase()" class="neo-btn primary"><i class="ph ph-plugs-connected"></i>Testar conexão</button>
            <button onclick="supabaseInfo()" class="neo-btn"><i class="ph ph-info"></i>Dados da conexão</button>
          </div>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="neo-card"><p class="neo-label">Projeto</p><b class="text-[#0a1e8a] break-all">${SUPABASE_PROJECT_URL}</b></div>
          <div class="neo-card"><p class="neo-label">Status</p><div id="cloud-connection-status" class="text-[13px] text-slate-600">Ainda não testado nesta sessão.</div></div>
          <div class="neo-card"><p class="neo-label">Próximo passo</p><p class="text-[13px] text-slate-600">Criar as tabelas no SQL Editor e depois trocar o localStorage pela nuvem.</p></div>
        </div>
      </div>`;
    view.appendChild(card);
  };
})();
