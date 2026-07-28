// DIGICOPY Gestão - conexão Supabase (chave publishable/anon pública)
(function(){
  const SUPABASE_PROJECT_URL = 'https://abfzubhivcarwiynuvhz.supabase.co';
  const SUPABASE_REST_URL = `${SUPABASE_PROJECT_URL}/rest/v1`;
  const SUPABASE_KEY = 'sb_publishable_O91tDfAY_vrtp8feezXXkA_aNhpCjJH';


  const DIGICOPY_SCHEMA_SQL = `
create extension if not exists pgcrypto;

create table if not exists app_state (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  cnpj text unique,
  razao_social text not null,
  nome_fantasia text,
  telefone text,
  email text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  nome text not null,
  login text not null,
  senha_hash text,
  perfil text default 'Comercial',
  ativo boolean default true,
  criado_em timestamptz default now(),
  unique (empresa_id, login)
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  codigo_interno integer,
  nome text not null,
  fantasia text,
  documento text,
  tipo text default 'PJ',
  telefone text,
  celular text,
  email text,
  endereco text,
  numero text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  status text default 'ativo',
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now(),
  atualizado_em timestamptz
);

create table if not exists fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  nome text not null,
  documento text,
  telefone text,
  email text,
  endereco text,
  cidade text,
  estado text,
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  sku text,
  nome text not null,
  categoria text,
  fabricante text,
  unidade text,
  estoque numeric default 0,
  estoque_min numeric default 0,
  custo numeric default 0,
  preco numeric default 0,
  localizacao text,
  status text default 'ativo',
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists equipamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  patrimonio text,
  modelo text not null,
  fabricante text,
  tipo text,
  serie text,
  contador_pb numeric default 0,
  contador_cor numeric default 0,
  status text default 'disponivel',
  valor_compra numeric default 0,
  data_aquisicao date,
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists contratos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  numero text,
  cliente_id uuid references clientes(id),
  data_inicio date,
  data_fim date,
  dia_vencimento integer default 10,
  valor_mensal numeric default 0,
  franquia_pb numeric default 0,
  franquia_cor numeric default 0,
  valor_excedente_pb numeric default 0,
  valor_excedente_cor numeric default 0,
  status text default 'ativo',
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists parque_instalado (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  contrato_id uuid references contratos(id),
  cliente_id uuid references clientes(id),
  equipamento_id uuid references equipamentos(id),
  setor text,
  endereco_instalacao text,
  data_instalacao date,
  status text default 'ativo',
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists leituras (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  parque_id uuid references parque_instalado(id),
  contrato_id uuid references contratos(id),
  cliente_id uuid references clientes(id),
  equipamento_id uuid references equipamentos(id),
  data_leitura date,
  contador_pb numeric default 0,
  contador_cor numeric default 0,
  contador_pb_anterior numeric default 0,
  contador_cor_anterior numeric default 0,
  consumo_pb numeric default 0,
  consumo_cor numeric default 0,
  valor_excedente numeric default 0,
  status text default 'pendente',
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists vendas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  numero text,
  cliente_id uuid references clientes(id),
  data_venda timestamptz default now(),
  desconto numeric default 0,
  total numeric default 0,
  forma_pagamento text,
  vencimento date,
  status text default 'aguardar',
  usuario_id uuid references usuarios(id),
  usuario_nome text,
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists venda_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  venda_id uuid references vendas(id) on delete cascade,
  produto_id uuid references produtos(id),
  codigo_antigo text,
  descricao text,
  quantidade numeric default 1,
  valor_unitario numeric default 0,
  desconto numeric default 0,
  subtotal numeric default 0,
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists chamados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  numero text,
  cliente_id uuid references clientes(id),
  equipamento_id uuid references equipamentos(id),
  contrato_id uuid references contratos(id),
  venda_id uuid references vendas(id),
  problema text,
  descricao text,
  prioridade text default 'normal',
  tecnico text,
  status text default 'aberto',
  data_abertura timestamptz default now(),
  data_fechamento timestamptz,
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists contas_receber (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  cliente_id uuid references clientes(id),
  venda_id uuid references vendas(id),
  contrato_id uuid references contratos(id),
  leitura_id uuid references leituras(id),
  descricao text,
  valor numeric default 0,
  vencimento date,
  pagamento_data date,
  forma_pagamento text,
  status text default 'aberto',
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists contas_pagar (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo_antigo text,
  fornecedor_id uuid references fornecedores(id),
  fornecedor_nome text,
  descricao text,
  categoria text,
  valor numeric default 0,
  vencimento date,
  pagamento_data date,
  status text default 'aberto',
  dados_legado jsonb default '{}'::jsonb,
  criado_em timestamptz default now()
);

create table if not exists auditoria (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  usuario_id uuid references usuarios(id),
  usuario_nome text,
  modulo text,
  acao text,
  registro_id text,
  detalhes text,
  criado_em timestamptz default now()
);

create table if not exists legado_import_raw (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  tabela_origem text not null,
  codigo_origem text,
  dados jsonb not null,
  importado boolean default false,
  criado_em timestamptz default now()
);

insert into empresas (cnpj, razao_social, nome_fantasia, telefone, email)
values ('08.385.589/0001-03', 'DIGICOPY', 'DIGICOPY', null, null)
on conflict (cnpj) do nothing;

-- Políticas abertas temporárias para DESENVOLVIMENTO.
-- Antes de produção, trocaremos por políticas por empresa/usuário.
do $$
declare t text;
begin
  foreach t in array array['app_state','empresas','usuarios','clientes','fornecedores','produtos','equipamentos','contratos','parque_instalado','leituras','vendas','venda_itens','chamados','contas_receber','contas_pagar','auditoria','legado_import_raw'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists dev_all_%I on %I', t, t);
    execute format('create policy dev_all_%I on %I for all using (true) with check (true)', t, t);
  end loop;
end $$;
`;

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


  window.copySupabaseSchemaSQL = async function(){
    try{
      await navigator.clipboard.writeText(DIGICOPY_SCHEMA_SQL.trim());
      if(typeof toast==='function') toast('SQL copiado. Cole no SQL Editor do Supabase e clique em Run.', 'success');
    }catch{
      const box=document.getElementById('supabase-schema-sql-box');
      if(box){ box.classList.remove('hidden'); box.value=DIGICOPY_SCHEMA_SQL.trim(); box.select(); }
      if(typeof toast==='function') toast('Não consegui copiar automaticamente. O SQL apareceu na caixa para copiar manualmente.', 'info');
    }
  };


  const CLOUD_STATE_KEY = 'digicopy_erp_state_v1'; // legado (blob único) — só leitura de compatibilidade
  const CLOUD_META_KEY = 'digicopy_erp_v2_meta';
  const CLOUD_PART_PREFIX = 'digicopy_erp_v2__';
  const SYNC_MAX_ITENS_PARTE = 400;      // máx. registros por parte
  const SYNC_MAX_BYTES_PARTE = 1500000;  // máx. ~1,5 MB por parte (evita statement timeout)
  const SYNC_MAX_BYTES_ITEM  = 1200000;  // item único maior que isso é fatiado

  // Entidades sincronizadas entre PCs
  const SYNC_ENTIDADES = [
    {campo:'empresas', tipo:'array'},
    {campo:'usuarios', tipo:'array'},
    {campo:'clientes', tipo:'array'},
    {campo:'produtos', tipo:'array'},
    {campo:'equipamentos', tipo:'array'},
    {campo:'contratos', tipo:'array'},
    {campo:'parque', tipo:'array'},
    {campo:'leituras', tipo:'array'},
    {campo:'os', tipo:'array'},
    {campo:'vendas', tipo:'array'},
    {campo:'contasReceber', tipo:'array'},
    {campo:'contasPagar', tipo:'array'},
    {campo:'logs', tipo:'array', limite:1500},
    {campo:'modulosDinamicos', tipo:'objeto'},
    {campo:'tecnicos', tipo:'array'},
    {campo:'config', tipo:'objeto'},
  ];

  function setCloudSyncStatus(html){
    const el=document.getElementById('cloud-sync-status');
    if(el) el.innerHTML = html;
  }

  // Objeto (modulosDinamicos/config) → lista de [chave,valor]; módulos gigantes são fatiados
  function objetoParaItens(obj){
    const itens=[];
    Object.entries(obj||{}).forEach(([k,v])=>{
      if(JSON.stringify([k,v]).length <= SYNC_MAX_BYTES_ITEM){ itens.push([k,v]); return; }
      if(v && Array.isArray(v.dados)){
        const fatias=[]; let cur=[]; let bytes=50;
        v.dados.forEach(r=>{
          const rb=JSON.stringify(r).length+1;
          if(bytes+rb > SYNC_MAX_BYTES_ITEM && cur.length){ fatias.push(cur); cur=[]; bytes=50; }
          cur.push(r); bytes+=rb;
        });
        fatias.push(cur);
        const total=fatias.length;
        fatias.forEach((f,i)=>itens.push([k, Object.assign({}, v, {dados:f, __parte:i, __partes:total})]));
      } else {
        itens.push([k,v]);
      }
    });
    return itens;
  }

  // Remonta o objeto a partir dos itens (agrupa fatias __parte/__partes)
  function itensParaObjeto(itens){
    const grupos={};
    itens.forEach(([k,v])=>{
      if(v && typeof v==='object' && v.__partes){
        if(!grupos[k]) grupos[k]={base:Object.assign({}, v, {dados:[]}), fatias:[]};
        grupos[k].fatias[v.__parte]=v.dados||[];
      } else {
        grupos[k]={simples:true, valor:v};
      }
    });
    const out={};
    Object.entries(grupos).forEach(([k,g])=>{
      if(g.simples){ out[k]=g.valor; return; }
      const dados=[];
      for(let i=0;i<(g.base.__partes||0);i++) dados.push(...(g.fatias[i]||[]));
      const rest=Object.assign({}, g.base); delete rest.__parte; delete rest.__partes;
      out[k]=Object.assign({}, rest, {dados});
    });
    return out;
  }

  // Empacota itens em partes (por quantidade E por tamanho)
  function empacotarPartes(itens){
    const partes=[]; let atual=[]; let bytes=2;
    itens.forEach(item=>{
      const b=JSON.stringify(item).length+1;
      if((atual.length >= SYNC_MAX_ITENS_PARTE || bytes+b > SYNC_MAX_BYTES_PARTE) && atual.length){ partes.push(atual); atual=[]; bytes=2; }
      atual.push(item); bytes+=b;
    });
    partes.push(atual);
    return partes;
  }

  // Envia TODOS os dados locais para a nuvem EM PARTES (evita statement timeout)
  window.syncEnviarParaNuvem = async function(opts={}){
    const confirmar = opts.confirmar !== false;
    if(confirmar && !confirm('Enviar TODOS os dados deste PC para a nuvem (Supabase)?\n\nOs outros computadores poderão carregar estes dados em "Carregar da nuvem".')) return {ok:false, cancelado:true};
    try{
      // 1) Monta as partes
      const partes=[]; const metaEntidades={};
      SYNC_ENTIDADES.forEach(ent=>{
        let itens;
        if(ent.tipo==='objeto'){
          itens = objetoParaItens(db[ent.campo]||{});
        } else {
          let lista = Array.isArray(db[ent.campo]) ? db[ent.campo] : [];
          if(ent.limite) lista = lista.slice(0, ent.limite);
          itens = lista;
        }
        const packs = empacotarPartes(itens);
        metaEntidades[ent.campo]={tipo:ent.tipo, partes:packs.length, total:itens.length};
        packs.forEach((pack,i)=>{
          partes.push({
            key:`${CLOUD_PART_PREFIX}${ent.campo}__p${i}`,
            data: ent.tipo==='objeto' ? {itens: pack} : {lista: pack}
          });
        });
      });
      const totalReg = Object.values(metaEntidades).reduce((s,e)=>s+e.total,0);

      // 2) Envia parte por parte (cada POST é pequeno → sem timeout)
      let enviadas=0; const erros=[];
      for(const p of partes){
        setCloudSyncStatus(`<span class="text-slate-500">Enviando parte ${enviadas+1} de ${partes.length}... <b>${escapeHtml(p.key.replace(CLOUD_PART_PREFIX,''))}</b></span>`);
        try{
          await supabaseRequest('app_state?on_conflict=key', {
            method:'POST',
            headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
            body:JSON.stringify({key:p.key, data:p.data, updated_at:new Date().toISOString()})
          });
          enviadas++;
        }catch(err){
          erros.push(p.key+': '+(err?.message||err));
        }
      }

      // 3) Meta SÓ vai se tudo subiu (outros PCs nunca leem estado parcial)
      if(erros.length){
        setCloudSyncStatus(`<span class="text-red-700 font-bold">Falha em ${erros.length} de ${partes.length} partes. Nada foi publicado. Tente novamente.</span><div class="text-[11px] text-red-600 mt-1">${escapeHtml(erros[0])}</div>`);
        if(typeof toast==='function') toast('Falha ao enviar algumas partes. Tente novamente.','error');
        return {ok:false, enviadas, erros};
      }
      const atualizadoEm = new Date().toISOString();
      await supabaseRequest('app_state?on_conflict=key', {
        method:'POST',
        headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
        body:JSON.stringify({key:CLOUD_META_KEY, data:{versao:2, app:'digicopy_erp', atualizadoEm, entidades:metaEntidades, totalRegistros:totalReg}, updated_at:atualizadoEm})
      });
      setCloudSyncStatus(`<span class="text-emerald-700 font-bold">✅ Enviado! ${totalReg.toLocaleString('pt-BR')} registros em ${partes.length} partes. Outros PCs podem clicar em "Carregar da nuvem".</span>`);
      if(typeof toast==='function') toast('Dados enviados para a nuvem com sucesso','success');
      return {ok:true, partes:partes.length, totalRegistros:totalReg};
    }catch(err){
      const msg=err?.message||String(err);
      setCloudSyncStatus(`<span class="text-red-700 font-bold">Erro ao enviar: ${escapeHtml(msg)}</span>`);
      if(typeof toast==='function') toast('Erro ao enviar para nuvem: '+msg, 'error');
      return {ok:false, erros:[msg]};
    }
  };

  // Carrega o estado publicado (v2 em partes, com fallback para blob legado v1)
  window.syncCarregarDaNuvem = async function(opts={}){
    const confirmar = opts.confirmar !== false;
    if(confirmar && !confirm('Carregar os dados da nuvem neste PC?\n\n⚠️ OS DADOS LOCAIS ATUAIS SERÃO SUBSTITUÍDOS pelos dados da nuvem.')) return {ok:false, cancelado:true};
    try{
      setCloudSyncStatus('<span class="text-slate-500">Buscando dados na nuvem...</span>');
      const metaRows = await supabaseRequest(`app_state?select=data,updated_at&key=eq.${encodeURIComponent(CLOUD_META_KEY)}&limit=1`, {method:'GET'});

      if(!metaRows || !metaRows.length){
        // Fallback: blob único legado
        const rows = await supabaseRequest(`app_state?select=data,updated_at&key=eq.${encodeURIComponent(CLOUD_STATE_KEY)}&limit=1`, {method:'GET'});
        if(!rows || !rows.length){
          setCloudSyncStatus('<span class="text-amber-700 font-bold">Ainda não há dados na nuvem. Em outro PC, use "Enviar para nuvem" primeiro.</span>');
          if(typeof toast==='function') toast('Nenhum dado encontrado na nuvem','info');
          return {ok:false, vazio:true};
        }
        db = rows[0].data;
        saveDB();
        setCloudSyncStatus(`<span class="text-emerald-700 font-bold">Base carregada da nuvem (formato antigo). Atualizada em ${new Date(rows[0].updated_at).toLocaleString('pt-BR')}.</span>`);
        if(typeof toast==='function') toast('Dados carregados da nuvem','success');
        setTimeout(()=>location.reload(),900);
        return {ok:true, legado:true};
      }

      const meta = metaRows[0].data;
      const totalPartes = Object.values(meta.entidades||{}).reduce((s,e)=>s+(e.partes||0),0);
      setCloudSyncStatus(`<span class="text-slate-500">Baixando ${totalPartes} partes (${(meta.totalRegistros||0).toLocaleString('pt-BR')} registros)...</span>`);
      const rows = await supabaseRequest(`app_state?select=key,data&key=like.${encodeURIComponent(CLOUD_PART_PREFIX)}*&limit=1000`, {method:'GET'});
      const mapa={};
      (rows||[]).forEach(r=>{ mapa[r.key]=r.data; });

      const novoDb = structuredClone(defaultData);
      Object.entries(meta.entidades||{}).forEach(([campo,info])=>{
        const itens=[];
        for(let i=0;i<(info.partes||0);i++){
          const parte = mapa[`${CLOUD_PART_PREFIX}${campo}__p${i}`];
          if(!parte) throw new Error(`Parte ${campo}__p${i} não encontrada na nuvem`);
          if(info.tipo==='objeto') itens.push(...(parte.itens||[]));
          else itens.push(...(parte.lista||[]));
        }
        novoDb[campo] = info.tipo==='objeto' ? itensParaObjeto(itens) : itens;
      });
      novoDb.meta = Object.assign({}, novoDb.meta||{}, {sincronizadoEm:new Date().toISOString(), origemNuvemAtualizadoEm:meta.atualizadoEm||metaRows[0].updated_at});
      db = novoDb;
      saveDB();
      setCloudSyncStatus(`<span class="text-emerald-700 font-bold">✅ Carregado! ${(meta.totalRegistros||0).toLocaleString('pt-BR')} registros restaurados da nuvem (enviados em ${new Date(meta.atualizadoEm||metaRows[0].updated_at).toLocaleString('pt-BR')}). Recarregando...</span>`);
      if(typeof toast==='function') toast('Dados carregados da nuvem','success');
      setTimeout(()=>location.reload(),900);
      return {ok:true};
    }catch(err){
      const msg=err?.message||String(err);
      setCloudSyncStatus(`<span class="text-red-700 font-bold">Erro ao carregar: ${escapeHtml(msg)}</span>`);
      if(typeof toast==='function') toast('Erro ao carregar da nuvem: '+msg, 'error');
      return {ok:false, erros:[msg]};
    }
  };

  window.enviarDadosLocaisParaNuvem = function(){ return window.syncEnviarParaNuvem({confirmar:true}); };
  window.carregarDadosDaNuvem = function(){ return window.syncCarregarDaNuvem({confirmar:true}); };

  window.verificarBaseNaNuvem = async function(){
    setCloudSyncStatus('<span class="text-slate-500">Verificando dados compartilhados na nuvem...</span>');
    try{
      const metaRows = await supabaseRequest(`app_state?select=data,updated_at&key=eq.${encodeURIComponent(CLOUD_META_KEY)}&limit=1`, {method:'GET'});
      if(metaRows && metaRows.length){
        const meta=metaRows[0].data;
        setCloudSyncStatus(`<span class="text-emerald-700 font-bold">Nuvem com dados publicados: ${(meta.totalRegistros||0).toLocaleString('pt-BR')} registros. Última atualização: ${new Date(meta.atualizadoEm||metaRows[0].updated_at).toLocaleString('pt-BR')}.</span>`);
        return;
      }
      const rows = await supabaseRequest(`app_state?select=updated_at&key=eq.${encodeURIComponent(CLOUD_STATE_KEY)}&limit=1`, {method:'GET'});
      if(rows && rows.length){
        setCloudSyncStatus(`<span class="text-emerald-700 font-bold">Existe base na nuvem (formato antigo). Última atualização: ${new Date(rows[0].updated_at).toLocaleString('pt-BR')}.</span><p class="text-[11px] text-amber-700 mt-1">Dica: envie novamente por este PC para migrar ao formato em partes (mais rápido e sem timeout).</p>`);
      }else{
        setCloudSyncStatus('<span class="text-amber-700 font-bold">Conectado, mas ainda não há dados enviados para a nuvem.</span>');
      }
    }catch(err){
      const msg=err?.message||String(err);
      setCloudSyncStatus(`<span class="text-red-700 font-bold">Erro ao verificar: ${escapeHtml(msg)}</span>`);
    }
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
              <button onclick="copySupabaseSchemaSQL()" class="neo-btn"><i class="ph ph-copy"></i>Copiar SQL tabelas</button>
              <button onclick="supabaseInfo()" class="neo-btn"><i class="ph ph-info"></i>Dados</button>
              <button onclick="verificarBaseNaNuvem()" class="neo-btn"><i class="ph ph-database"></i>Ver base teste</button>
            </div>
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="neo-card"><p class="neo-label">Projeto</p><b class="text-[#0a1e8a] break-all">${SUPABASE_PROJECT_URL}</b></div>
            <div class="neo-card"><p class="neo-label">Status</p><div id="cloud-connection-status" class="text-[13px] text-slate-600">Clique em testar conexão.</div></div>
            <div class="neo-card"><p class="neo-label">Arquivo legado</p><p class="text-[13px] text-slate-600">BANCO.rar no bucket <b>migracao</b>. Extração validada: contém <b>BANCO.FDB</b> (~63,9 MB).</p></div>
          </div>
          <div class="px-4 pb-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div class="neo-card lg:col-span-2"><p class="neo-label">Sincronização de teste</p><div id="cloud-sync-status" class="text-[13px] text-slate-600">Área temporária para testar sincronização. A importação real do BANCO.rar será feita em outro processo.</div></div>
            <div class="neo-card flex flex-col gap-2"><button onclick="enviarDadosLocaisParaNuvem()" class="neo-btn primary justify-center"><i class="ph ph-cloud-arrow-up"></i>Enviar base de teste</button><button onclick="carregarDadosDaNuvem()" class="neo-btn justify-center"><i class="ph ph-cloud-arrow-down"></i>Carregar base teste</button></div>
          </div>
          <div class="p-4 pt-0 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="neo-card"><b>1. Tabelas</b><p class="text-[12px] text-slate-500 mt-1">Clique em Copiar SQL tabelas, cole no SQL Editor e clique Run.</p></div>
            <div class="neo-card"><b>2. Importação</b><p class="text-[12px] text-slate-500 mt-1">Tabelas detectadas: CLIENTES, PRODUTOS, VENDAS, ITENS_VENDA, LOCACAO, LEITURAS, EQUIPAMENTOS e financeiro.</p></div>
            <div class="neo-card"><b>3. Sistema online</b><p class="text-[12px] text-slate-500 mt-1">Trocar localStorage pelo Supabase.</p></div>
            <div class="neo-card"><b>4. Tempo real</b><p class="text-[12px] text-slate-500 mt-1">Atualizar telas entre computadores.</p></div>
          </div>
          <div class="p-4 pt-0"><textarea id="supabase-schema-sql-box" class="neo-input hidden w-full !h-[180px] font-mono text-[11px] py-2"></textarea></div>
        </div>
      </div>`;
  }

  // renderBanco agora está no app.js com integração Firebird + Supabase
  // Mantendo apenas openCloudMigration para compatibilidade
  window.openCloudMigration = function(){
    if(typeof navigateTo === 'function') navigateTo('banco');
  };
})();
