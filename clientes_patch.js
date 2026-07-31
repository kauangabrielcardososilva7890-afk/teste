// DIGICOPY ERP — Módulo de Clientes completo — v4.8.0
// Consulta (Novo/Alterar/Excluir + filtros auxiliares por campo) e cadastro com:
// dados essenciais obrigatórios (nome, telefone, rua, número, bairro), busca
// inteligente de CEP (ViaCEP, igual a busca de CNPJ) e aba "Nota Fiscal" pronta
// para a NF-e. Carregado por último — esta é a versão definitiva das telas.
(function(){
'use strict';

/* CLI_PURE_START */
const CLI_PURE = (function(){
  // dobra acentos e minúsculas: "José Ávila" → "jose avila"
  function fold(t){
    return String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  }
  function soDigitos(t){ return String(t||'').replace(/\D/g,''); }
  function normalizaCep(cep){ const d = soDigitos(cep); return d.length===8 ? d : null; }
  // Endereço composto (guardado junto no cadastro para a notinha e telas antigas)
  function montaEndereco(o){
    o = o||{};
    const rua = String(o.rua||'').trim();
    const num = String(o.numero||'').trim();
    const compl = String(o.complemento||'').trim();
    const bairro = String(o.bairro||'').trim();
    let s = rua;
    if(num) s += (s ? ', ' : '') + num;
    if(compl) s += ' - ' + compl;
    if(bairro) s += (s ? ' • ' : '') + bairro;
    return s;
  }
  // Obrigatórios (pedido do cliente): nome, telefone, rua, número e bairro
  const OBRIGATORIOS = [
    ['nome','Nome do cliente'],['telefone','Telefone'],
    ['rua','Rua'],['numero','Número'],['bairro','Bairro']
  ];
  function validarObrigatorios(d){
    d = d||{};
    return OBRIGATORIOS.filter(([k])=>!String(d[k]||'').trim()).map(([,rotulo])=>rotulo);
  }
  function proxCodigo(clientes, empresaId){
    let max = 0;
    (clientes||[]).forEach(c=>{ if(c && c.empresaId===empresaId && Number(c.codigo)>max) max = Number(c.codigo); });
    return max + 1;
  }
  // Campos escolhíveis da pesquisa (mesma ideia do filtro auxiliar do sistema antigo)
  const CAMPOS_BUSCA = [
    ['todos','Pesquisar em tudo'],['nome','Nome'],['fantasia','Fantasia'],
    ['codigo','Código'],['documento','CPF/CNPJ'],['rgIE','RG/IE'],
    ['endereco','Endereço'],['telefone','Telefone'],['whatsapp','WhatsApp'],
    ['cidade','Cidade'],['bairro','Bairro'],['contato','Contato'],
    ['email','E-mail'],['observacao','Observação'],['cep','CEP'],['estado','UF']
  ];
  function filtraClientes(list, q, campo){
    const termo = fold(q).trim();
    if(!termo) return list;
    const termoNum = soDigitos(q);
    const testa = (valor, extraNum)=> fold(valor).includes(termo) || (!!termoNum && termoNum.length>=3 && extraNum && soDigitos(valor).includes(termoNum));
    return list.filter(c=>{
      if(!c) return false;
      if(campo && campo!=='todos'){
        if(campo==='email') return testa(c.email) || testa(c.email2);
        if(campo==='documento' || campo==='cep' || campo==='telefone' || campo==='whatsapp') return testa(c[campo], true);
        if(campo==='codigo') return String(c.codigo||'').includes(termoNum||termo);
        return testa(c[campo]);
      }
      return testa(c.nome)||testa(c.fantasia)||testa(c.documento,true)||testa(c.telefone,true)||
             testa(c.cidade)||testa(c.bairro)||testa(c.endereco)||String(c.codigo||'').includes(termoNum||termo)||
             testa(c.contato)||testa(c.email)||testa(c.cep,true)||testa(c.whatsapp,true);
    });
  }
  return { fold, soDigitos, normalizaCep, montaEndereco, OBRIGATORIOS, validarObrigatorios, proxCodigo, CAMPOS_BUSCA, filtraClientes };
})();
/* CLI_PURE_END */
window.CLI_PURE = CLI_PURE;

// ═══════════════════════════════════════════════════════════════════════════
// BUSCAS AUTOMÁTICAS — CNPJ (BrasilAPI, já existente e melhorada) e CEP (ViaCEP)
// ═══════════════════════════════════════════════════════════════════════════
function cliSetVal(id, val, soSeVazio){
  const el = document.getElementById(id);
  if(!el) return;
  if(soSeVazio && el.value.trim()) return;
  el.value = val || '';
  el.classList.remove('border-red-500');
}
window.buscarCNPJAutomatico = async function(cnpjRaw){
  const cnpj = CLI_PURE.soDigitos(cnpjRaw);
  if(cnpj.length!==14){ toast('CNPJ deve ter 14 dígitos (CPF preenche na mão)','error'); return; }
  const btn = document.getElementById('btn-buscar-cnpj');
  if(btn){ btn.innerHTML='<i class="ph ph-spinner animate-spin"></i> Buscando...'; btn.disabled=true; }
  try{
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if(!resp.ok) throw new Error('CNPJ não encontrado');
    const d = await resp.json();
    cliSetVal('f-cli-nome', d.razao_social || d.nome_fantasia || '');
    cliSetVal('f-cli-fantasia', d.nome_fantasia || '');
    cliSetVal('f-cli-rua', d.logradouro || '');
    cliSetVal('f-cli-num', d.numero || '');
    cliSetVal('f-cli-compl', d.complemento || '', true);
    cliSetVal('f-cli-bairro', d.bairro || '');
    cliSetVal('f-cli-cidade', d.municipio || '');
    cliSetVal('f-cli-estado', d.uf || '');
    cliSetVal('f-cli-cep', d.cep || '');
    cliSetVal('f-cli-email', d.email || '', true);
    if(d.ddd_telefone_1) cliSetVal('f-cli-tel', `(${d.ddd_telefone_1.slice(0,2)}) ${d.ddd_telefone_1.slice(2)}`);
    logAction('cliente','buscar_cnpj',cnpj,`Busca CNPJ ${cnpj} retornou ${d.razao_social}`);
    toast(`CNPJ encontrado: ${d.razao_social} — ${d.municipio}/${d.uf}. Confira telefone e número!`,'success');
  }catch(e){
    console.error(e);
    toast('Não achei esse CNPJ ('+e.message+'). Preencha manualmente.','error');
  }finally{
    if(btn){ btn.innerHTML='<i class="ph ph-magnifying-glass"></i> Buscar'; btn.disabled=false; }
  }
};
window.buscarCEPAutomatico = async function(cepRaw, silencioso){
  const cep = CLI_PURE.normalizaCep(cepRaw);
  if(!cep){ if(!silencioso) toast('CEP precisa de 8 números (ex.: 39440-000)','error'); return; }
  if(window._ultimoCepBuscado === cep) return;
  const btn = document.getElementById('btn-buscar-cep');
  if(btn){ btn.innerHTML='<i class="ph ph-spinner animate-spin"></i>'; btn.disabled=true; }
  try{
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if(!resp.ok) throw new Error('falha na consulta');
    const d = await resp.json();
    if(d.erro) throw new Error('CEP não encontrado');
    window._ultimoCepBuscado = cep;
    cliSetVal('f-cli-rua', d.logradouro || '', true);
    cliSetVal('f-cli-compl', d.complemento || '', true);
    cliSetVal('f-cli-bairro', d.bairro || '', true);
    cliSetVal('f-cli-cidade', d.localidade || '');
    cliSetVal('f-cli-estado', d.uf || '');
    logAction('cliente','buscar_cep',cep,`Busca CEP ${cep} retornou ${d.localidade}/${d.uf}`);
    toast(`CEP encontrado: ${d.localidade}/${d.uf}${d.logradouro?(' — '+d.logradouro):''} — falta o número da casa/prédio!`,'success');
    const num = document.getElementById('f-cli-num');
    if(num && !num.value.trim()) num.focus();
  }catch(e){
    console.error(e);
    if(!silencioso) toast('CEP não localizado ('+e.message+') — preencha o endereço na mão','error');
  }finally{
    if(btn){ btn.innerHTML='<i class="ph ph-magnifying-glass"></i> Buscar'; btn.disabled=false; }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FORMULÁRIO DO CLIENTE — essenciais (obrigatórios), endereço, outros e NF-e
// ═══════════════════════════════════════════════════════════════════════════
function cliField(id, label, valor, opts){
  opts = opts||{};
  const req = opts.req ? ' <span class="text-red-500" title="Obrigatório">*</span>' : '';
  const tipo = opts.type || 'text';
  return `<div class="${opts.cls||''}"><label class="text-[11px] font-bold uppercase ${opts.req?'text-slate-700':'text-slate-500'}">${label}${req}</label>
    <input id="${id}" type="${tipo}" value="${String(valor||'').replace(/"/g,'&quot;')}" ${opts.extra||''} class="mt-1 w-full h-11 px-3 rounded-xl border ${opts.req?'border-slate-300 bg-white':'bg-slate-50'} focus:border-[#0a1e8a] outline-none"></div>`;
}
window.renderModalCliente = function(id){
  const sess = getSession(); if(!sess) return;
  const isEdit = !!id;
  const c = isEdit ? (db.clientes.find(x=>x.id===id && x.empresaId===sess.empresaId)||{}) : {};
  // cliente antigo com endereço em texto único: já sugere na rua
  const ruaInicial = c.rua || (!c.numero && !c.bairro ? (c.endereco||'') : '');
  const nextCodigo = CLI_PURE.proxCodigo(db.clientes, sess.empresaId);
  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[880px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText = (isEdit?'Editar cliente':'Novo cliente') + ` — #${c.codigo||nextCodigo}`;
  document.getElementById('modal-body').innerHTML = `
  <div class="space-y-4">
    <!-- DADOS ESSENCIAIS -->
    <div class="rounded-[14px] border-2 border-[#0a1e8a]/20 p-4 space-y-3">
      <p class="font-bold text-[13px] text-[#0a1e8a]"><i class="ph ph-identification-card"></i> Dados essenciais <span class="font-normal text-[11px] text-slate-500">(com <span class="text-red-500">*</span> é obrigatório para salvar)</span></p>
      <div class="grid grid-cols-1 md:grid-cols-[1fr,130px] gap-3">
        <div>
          <label class="text-[11px] font-bold uppercase text-slate-500">CPF / CNPJ</label>
          <div class="mt-1 flex gap-2">
            <input id="f-cli-doc" value="${String(c.documento||'').replace(/"/g,'&quot;')}" placeholder="Só números — CNPJ preenche tudo sozinho" class="flex-1 h-11 px-3 rounded-xl border bg-white font-mono text-[13px]">
            <button onclick="buscarCNPJAutomatico(document.getElementById('f-cli-doc').value)" id="btn-buscar-cnpj" class="h-11 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px] flex items-center gap-1.5 shrink-0"><i class="ph ph-magnifying-glass"></i> Buscar</button>
          </div>
        </div>
        <div><label class="text-[11px] font-bold uppercase text-slate-500">Código</label><input value="${c.codigo||nextCodigo}" disabled class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-100 font-mono font-bold text-center"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${cliField('f-cli-nome','Nome / Razão social', c.nome, {req:true, cls:'md:col-span-2'})}
        <div><label class="text-[11px] font-bold uppercase text-slate-500">Tipo</label><select id="f-cli-tipo" class="mt-1 w-full h-11 px-3 rounded-xl border bg-white"><option value="PJ" ${(c.tipo||'PJ')==='PJ'?'selected':''}>Pessoa Jurídica</option><option value="PF" ${c.tipo==='PF'?'selected':''}>Pessoa Física</option></select></div>
        ${cliField('f-cli-tel','Telefone', c.telefone, {req:true, extra:'placeholder="(38) 99999-0000"'})}
        ${cliField('f-cli-whatsapp','WhatsApp', c.whatsapp)}
        ${cliField('f-cli-contato','Pessoa de contato', c.contato)}
        ${cliField('f-cli-email','E-mail', c.email)}
        ${cliField('f-cli-email2','E-mail 2', c.email2)}
        ${cliField('f-cli-fantasia','Nome fantasia', c.fantasia)}
      </div>
    </div>

    <!-- ENDEREÇO -->
    <div class="rounded-[14px] border p-4 space-y-3 bg-[#f8f9ff]">
      <p class="font-bold text-[13px] text-[#0a1e8a]"><i class="ph ph-map-pin"></i> Endereço <span class="font-normal text-[11px] text-slate-500">(digite o CEP e aperte Buscar — preenche rua, bairro, cidade e UF sozinho)</span></p>
      <div class="grid grid-cols-1 md:grid-cols-[190px,auto] gap-3 items-end">
        <div>
          <label class="text-[11px] font-bold uppercase text-slate-500">CEP</label>
          <input id="f-cli-cep" value="${String(c.cep||'').replace(/"/g,'&quot;')}" placeholder="39440-000" onblur="buscarCEPAutomatico(this.value, true)" class="mt-1 w-full h-11 px-3 rounded-xl border bg-white font-mono text-[13px]">
        </div>
        <button onclick="buscarCEPAutomatico(document.getElementById('f-cli-cep').value)" id="btn-buscar-cep" class="h-11 px-4 rounded-xl bg-white border-2 border-[#0a1e8a] text-[#0a1e8a] font-bold text-[12px] flex items-center gap-1.5 w-fit"><i class="ph ph-magnifying-glass"></i> Buscar</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        ${cliField('f-cli-rua','Rua / Avenida', ruaInicial, {req:true, cls:'md:col-span-2'})}
        ${cliField('f-cli-num','Número', c.numero, {req:true})}
        ${cliField('f-cli-compl','Complemento', c.complemento, {extra:'placeholder="sala, bloco... (opcional)"'})}
        ${cliField('f-cli-bairro','Bairro', c.bairro, {req:true})}
        ${cliField('f-cli-ref','Referência', c.referencia, {cls:'md:col-span-2', extra:'placeholder="ex.: ao lado da farmácia (opcional)"'})}
        ${cliField('f-cli-cidade','Cidade', c.cidade)}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div><label class="text-[11px] font-bold uppercase text-slate-500">UF</label><input id="f-cli-estado" value="${String(c.estado||'').replace(/"/g,'&quot;')}" maxlength="2" class="mt-1 w-full h-11 px-3 rounded-xl border bg-white uppercase"></div>
      </div>
    </div>

    <!-- NOTA FISCAL (preparado para a NF-e) -->
    <div class="rounded-[14px] border border-dashed border-purple-300 bg-purple-50/40 p-4 space-y-3">
      <p class="font-bold text-[13px] text-purple-800"><i class="ph ph-file-text"></i> Dados para Nota Fiscal <span class="font-normal text-[11px] text-slate-500">(já pode preencher — quando a NF-e chegar, sai tudo pronto)</span></p>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        ${cliField('f-cli-rgie','RG / Inscrição Estadual', c.rgIE)}
        <div><label class="text-[11px] font-bold uppercase text-slate-500">Indicador da IE</label><select id="f-cli-indie" class="mt-1 w-full h-11 px-3 rounded-xl border bg-white">
          ${[['9','9 = Não contribuinte'],['1','1 = Contribuinte ICMS'],['2','2 = Isento de IE']].map(o=>`<option value="${o[0]}" ${String(c.indIE||'9')===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
        <div><label class="text-[11px] font-bold uppercase text-slate-500">Consumidor final</label><select id="f-cli-consumidor" class="mt-1 w-full h-11 px-3 rounded-xl border bg-white">
          ${[['1','1 = Sim'],['0','0 = Não']].map(o=>`<option value="${o[0]}" ${String(c.consumidorFinal||'1')===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
        <div><label class="text-[11px] font-bold uppercase text-slate-500">Governamental</label><select id="f-cli-govern" class="mt-1 w-full h-11 px-3 rounded-xl border bg-white">
          ${[['0','0 = Não'],['1','1 = União'],['2','2 = Estado'],['3','3 = Distrito Federal'],['4','4 = Município']].map(o=>`<option value="${o[0]}" ${String(c.governamental||'0')===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
      </div>
    </div>

    <!-- OUTROS -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      ${cliField('f-cli-site','Site', c.site)}
      <div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="f-cli-status" class="mt-1 w-full h-11 px-3 rounded-xl border bg-white"><option value="ativo" ${(c.status||'ativo')==='ativo'?'selected':''}>Ativo</option><option value="inativo" ${c.status==='inativo'?'selected':''}>Inativo</option><option value="inadimplente" ${c.status==='inadimplente'?'selected':''}>Inadimplente</option></select></div>
      <div class="md:col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Observação</label><textarea id="f-cli-obs" rows="2" class="mt-1 w-full px-3 py-2 rounded-xl border bg-slate-50">${escapeHtml(c.observacao||'')}</textarea></div>
    </div>
    <p class="text-[11px] text-slate-400"><i class="ph ph-info"></i> Criado/alterado por <b>${escapeHtml(sess.usuarioNome)}</b> fica registrado na auditoria.</p>
  </div>`;
  document.getElementById('modal-footer').innerHTML = `
    <button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border text-slate-600 font-semibold">Cancelar</button>
    <button onclick="saveCliente()" class="h-11 px-8 rounded-xl bg-[#0a1e8a] text-white font-bold">${isEdit?'Salvar alterações':'Criar cliente'}</button>`;
};

// ═══════════════════════════════════════════════════════════════════════════
// SALVAR — só deixa concluir com os dados essenciais preenchidos
// ═══════════════════════════════════════════════════════════════════════════
window.saveCliente = function(){
  const sess = getSession(); if(!sess) return;
  const id = window.modalContext && window.modalContext.id;
  const val = x => (document.getElementById(x)||{value:''}).value.trim();
  const dados = {
    nome: val('f-cli-nome'), telefone: val('f-cli-tel'),
    rua: val('f-cli-rua'), numero: val('f-cli-num'), bairro: val('f-cli-bairro')
  };
  const faltando = CLI_PURE.validarObrigatorios(dados);
  if(faltando.length){
    const mapa = {nome:'f-cli-nome', telefone:'f-cli-tel', rua:'f-cli-rua', numero:'f-cli-num', bairro:'f-cli-bairro'};
    let primeiro = null;
    CLI_PURE.OBRIGATORIOS.forEach(([k])=>{
      const el = document.getElementById(mapa[k]);
      if(el){
        const falta = !dados[k];
        el.classList.toggle('border-red-500', falta);
        el.classList.toggle('ring-2', falta); el.classList.toggle('ring-red-200', falta);
        if(falta && !primeiro) primeiro = el;
      }
    });
    if(primeiro) primeiro.focus();
    return toast('Complete os obrigatórios: '+faltando.join(', '), 'error');
  }
  const payload = {
    empresaId: sess.empresaId,
    codigo: undefined,
    nome: dados.nome, documento: val('f-cli-doc'), tipo: document.getElementById('f-cli-tipo').value,
    fantasia: val('f-cli-fantasia'), email: val('f-cli-email'), email2: val('f-cli-email2'),
    telefone: dados.telefone, whatsapp: val('f-cli-whatsapp'), contato: val('f-cli-contato'), site: val('f-cli-site'),
    cep: val('f-cli-cep'), rua: dados.rua, numero: dados.numero, complemento: val('f-cli-compl'),
    bairro: dados.bairro, referencia: val('f-cli-ref'), cidade: val('f-cli-cidade'), estado: val('f-cli-estado').toUpperCase(),
    endereco: CLI_PURE.montaEndereco({rua:dados.rua, numero:dados.numero, complemento:val('f-cli-compl'), bairro:dados.bairro}),
    rgIE: val('f-cli-rgie'), indIE: document.getElementById('f-cli-indie').value,
    consumidorFinal: document.getElementById('f-cli-consumidor').value, governamental: document.getElementById('f-cli-govern').value,
    observacao: (document.getElementById('f-cli-obs')||{value:''}).value.trim(),
    status: document.getElementById('f-cli-status').value
  };
  let alvo = null;
  if(id){
    alvo = db.clientes.find(c=>c.id===id && c.empresaId===sess.empresaId);
    if(!alvo) return toast('Cliente não encontrado','error');
    payload.codigo = alvo.codigo;
    Object.assign(alvo, payload, {atualizadoPor:sess.usuarioId, atualizadoPorNome:sess.usuarioNome, atualizadoEm:new Date().toISOString()});
    logAction('cliente','editar',id,`Editado cliente ${payload.nome} (#${payload.codigo||'-'})`);
  } else {
    payload.codigo = (typeof window.seqObter==='function')
      ? window.seqObter('cliente', db.clientes.filter(c=>c.empresaId===sess.empresaId), sess.empresaId, c=>c.codigo)
      : CLI_PURE.proxCodigo(db.clientes, sess.empresaId);
    alvo = Object.assign({id:uid('cli'), mensalidade:0, criadoEm:new Date().toISOString(), criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome}, payload);
    db.clientes.push(alvo);
    logAction('cliente','criar',alvo.id,`Criado cliente ${alvo.nome} (#${alvo.codigo}) por ${sess.usuarioNome}`);
  }
  saveDB(); renderClientes(); closeModal();
  toast(`Cliente salvo (#${payload.codigo})`, 'success');
  buildNav(); if(typeof renderDashboard==='function') renderDashboard(); if(typeof renderAuditoria==='function') renderAuditoria();
  // se o cadastro veio de dentro de uma venda, já seleciona o cliente lá
  try{
    if(typeof window.selectClienteVenda==='function' && (window.clienteSelecionadoVenda===null || window.novaVenda)){
      setTimeout(()=>window.selectClienteVenda(alvo.id), 300);
    }
  }catch(e){}
};

// ═══════════════════════════════════════════════════════════════════════════
// CONSULTA DE CLIENTES — Novo / Alterar / Excluir + filtros auxiliares
// ═══════════════════════════════════════════════════════════════════════════
window.renderClientes = function(){
  const sess = getSession(); if(!sess) return;
  const view = document.getElementById('view-clientes') || ensureView('clientes');
  const searchRaw = document.getElementById('classic-search-clientes')?.value || '';
  const campo = document.getElementById('classic-campo-clientes')?.value || 'todos';
  const letter = document.getElementById('classic-letter-clientes')?.value || '';
  let list = db.clientes.filter(c=>c.empresaId===sess.empresaId && c.status!=='inativo');
  if(letter) list = list.filter(c=>(c.nome||'').toUpperCase().startsWith(letter));
  list = CLI_PURE.filtraClientes(list, searchRaw, campo);
  list = list.slice().sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR',{sensitivity:'base'}));
  view.innerHTML = `
    <div class="classic-window overflow-hidden max-w-[980px] mx-auto mt-2">
      <div class="h-6 bg-slate-100 border-b flex items-center justify-between px-2 text-[12px]"><span>Clientes Cadastrados</span><button onclick="navigateTo('dashboard')" class="text-slate-600">×</button></div>
      <div class="classic-title">Clientes</div>
      <div class="bg-white border-b border-slate-300 flex items-center flex-wrap">
        <button onclick="openModal('cliente')" class="classic-toolbar-btn"><i class="ph ph-file-plus"></i>Novo</button>
        <button onclick="alterarClienteClassic()" class="classic-toolbar-btn"><i class="ph ph-pencil-simple"></i>Alterar</button>
        <button onclick="excluirClienteClassic()" class="classic-toolbar-btn"><i class="ph ph-x-circle text-red-600"></i>Excluir</button>
        <select id="classic-campo-clientes" onchange="renderClientes()" class="classic-select ml-2 w-[170px]">
          ${CLI_PURE.CAMPOS_BUSCA.map(([k,rotulo])=>`<option value="${k}" ${campo===k?'selected':''}>${rotulo}</option>`).join('')}
        </select>
        <input id="classic-search-clientes" value="${escapeHtml(searchRaw)}" oninput="renderClientes()" placeholder="Digite para pesquisar..." class="classic-input h-[28px] w-[300px] ml-2">
        <button class="classic-toolbar-btn !border-r-0" onclick="renderClientes()"><i class="ph ph-magnifying-glass"></i></button>
        <span class="ml-auto pr-2 text-[11.5px] text-slate-500"><b class="text-[#0a1e8a]">${list.length}</b> cliente(s)</span>
      </div>
      <div class="flex items-center gap-3 px-2 py-1 bg-white border-b text-[12px] overflow-x-auto">
        ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l=>`<button onclick="document.getElementById('classic-letter-clientes').value='${l}'; renderClientes()" class="hover:text-[#0a1e8a] ${letter===l?'font-bold text-[#0a1e8a]':''}">${l}</button>`).join('')}
        <input id="classic-letter-clientes" type="hidden" value="${letter}"><button onclick="document.getElementById('classic-letter-clientes').value=''; renderClientes()" class="ml-2 text-red-600" title="Limpar letra">●</button>
      </div>
      <div class="h-[340px] overflow-auto bg-white">
        <table class="classic-grid-table"><thead><tr><th>Sel</th><th>Código</th><th>Nome do Cliente</th><th>Telefone</th><th>CPF/CNPJ</th><th>Nome Fantasia</th></tr></thead><tbody>${list.map(c=>`<tr onclick="window.clienteSelecionadoClassic='${c.id}'; renderClientes()" ondblclick="openModal('cliente','${c.id}')" class="cursor-pointer ${window.clienteSelecionadoClassic===c.id?'classic-row-selected':''}"><td>${window.clienteSelecionadoClassic===c.id?'✔':''}</td><td>${c.codigo||''}</td><td>${escapeHtml(c.nome||'')}</td><td>${escapeHtml(c.telefone||'')}</td><td>${escapeHtml(c.documento||'')}</td><td>${escapeHtml(c.fantasia||'')}</td></tr>`).join('')||'<tr><td colspan="6" class="text-center text-slate-500 py-8">Nenhum cliente encontrado com esse filtro</td></tr>'}</tbody></table>
      </div>
      <div class="h-[46px] bg-[#f7f7f7] border-t flex items-center px-4 gap-3 text-[11.5px] text-slate-500">
        <span><i class="ph ph-info"></i> Duplo clique abre o cadastro • o filtro ao lado escolhe onde pesquisar</span>
        <button onclick="navigateTo('dashboard')" class="ml-auto h-9 px-5 bg-white border text-red-600 font-bold">Sair</button>
      </div>
    </div>`;
  const input = document.getElementById('classic-search-clientes');
  if(input && document.activeElement?.id==='classic-search-clientes'){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
};

console.log('[DIGICOPY] Clientes v4.8.0 — essenciais obrigatórios, CEP inteligente, filtros auxiliares e aba NF pronta');
})();
