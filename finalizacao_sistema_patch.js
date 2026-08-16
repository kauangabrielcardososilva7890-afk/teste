// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.61 — Finalização operacional
// • X/ESC volta para aba anterior quando fechar janela/modal pelo usuário
// • Remove menus migrados/admin/nuvem/teste da navegação final
// • Buscador Escola fica visível antes de Configurações
// • Clientes com ordenação por coluna, padrão por código crescente e busca Enter/lupa
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function numCodigo(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return 0; return parseInt(g[g.length-1].replace(/^0+/,'')||'0',10)||0; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }

function ordenarLista(list,col,dir){
  const asc=dir!=='desc';
  const val=(c)=>{
    if(col==='codigo') return numCodigo(c.codigo);
    if(col==='nome') return fold(c.nome);
    if(col==='fantasia') return fold(c.fantasia);
    if(col==='telefone') return txt(c.telefone||c.whatsapp);
    if(col==='documento') return txt(c.documento).replace(/\D/g,'');
    if(col==='cidade') return fold(c.cidade);
    return fold(c[col]);
  };
  return list.slice().sort((a,b)=>{
    const A=val(a), B=val(b);
    const r=typeof A==='number'&&typeof B==='number'?A-B:String(A).localeCompare(String(B),'pt-BR',{numeric:true,sensitivity:'base'});
    return asc?r:-r;
  });
}
function filtrarClientesFinal(list,busca,campo){
  const q=fold(busca), qn=txt(busca).replace(/\D/g,''); if(!q&&!qn) return list;
  const test=(v)=>fold(v).includes(q)||(qn.length>=3&&txt(v).replace(/\D/g,'').includes(qn));
  return list.filter(c=>{
    if(campo&&campo!=='todos') return test(c[campo]);
    return ['codigo','nome','fantasia','telefone','whatsapp','documento','cidade','bairro','endereco','email','contato','cep'].some(k=>test(c[k]));
  });
}
function clientesDeveListar(busca,campo,status){
  // lista somente se houver pesquisa ou filtro de status — o campo (nome, código…)
  // fica pré-selecionado por padrão e NÃO dispara a listagem sozinho.
  return !!txt(busca) || (status&&status!=='ativos');
}
function removerElementosFinais(){
  const termos=/migrad|importar arquivos|backup|migraç|recarregar dados demo|limpar dados|exportar backup|sistema virgem|alinhamento do banco|carregar nuvem|enviar.*nuvem|publicar.*nuvem|dados migrados|explorar migrados|notinhas antigas|relat[oó]rios|nova despesa|contas a pagar/i;
  document.querySelectorAll('button,a,span.dynamic-menu-heading,#nav-dinamico,#nav-dinamico-label').forEach(el=>{
    const id=el.id||''; const nav=el.getAttribute&&el.getAttribute('data-nav')||''; const text=(el.innerText||el.textContent||'').trim();
    if(id==='nav-dinamico'||id==='nav-dinamico-label'||nav.startsWith('mod_')||termos.test(text)) el.remove();
  });
  document.querySelectorAll('[data-dynamic-category]').forEach(el=>el.remove());
  ['alinhamento-banco-card','alinhamento-exemplos-aviso','virgem-cfg-card'].forEach(id=>document.getElementById(id)?.remove());
  document.querySelectorAll('.module-menu button').forEach(b=>{ const t=b.innerText||''; if(termos.test(t)) b.remove(); });
}
function instalarBuscadorMenuFinal(){
  const nav=document.getElementById('nav-gest'); if(nav&&!nav.querySelector('[data-nav="buscador-escola"]')){
    const btn=document.createElement('button'); btn.dataset.nav='buscador-escola'; btn.onclick=()=>navigateTo('buscador-escola'); btn.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white'; btn.innerHTML='<i class="ph ph-magnifying-glass text-[19px]"></i><span>Buscador Escola</span>';
    const cfg=nav.querySelector('[data-nav="config"]'); if(cfg) nav.insertBefore(btn,cfg); else nav.appendChild(btn);
  }
  const toolbar=document.querySelector('.classic-toolbar-scroll');
  if(toolbar&&!document.getElementById('topmod-buscador-escola')){
    const mod=document.createElement('div'); mod.className='module'; mod.id='topmod-buscador-escola'; mod.innerHTML='<button onclick="navigateTo(\'buscador-escola\')"><i class="ph ph-magnifying-glass"></i>Buscador Escola</button>';
    const cfg=[...toolbar.querySelectorAll('.module')].find(m=>/Configura/.test(m.innerText||'')); if(cfg) toolbar.insertBefore(mod,cfg); else toolbar.appendChild(mod);
  }
}

window.FINALIZACAO_SISTEMA_PURE={ordenarLista,filtrarClientesFinal,clientesDeveListar,numCodigo};

if(typeof document==='undefined') return;

// Histórico de abas: volta para a aba anterior quando o usuário fecha modal/janela com X/Esc.
window.__abaAtualFinal=window.__abaAtualFinal||'dashboard';
window.__abaHistFinal=window.__abaHistFinal||[];
const oldNavigate=window.navigateTo;
window.navigateTo=function(view){
  if(view&&view!==window.__abaAtualFinal&&!String(view).startsWith('mod_')){
    if(window.__abaAtualFinal) window.__abaHistFinal.push(window.__abaAtualFinal);
    window.__abaAtualFinal=view;
    if(window.__abaHistFinal.length>20) window.__abaHistFinal.shift();
  }
  const r=oldNavigate?oldNavigate.apply(this,arguments):undefined;
  setTimeout(()=>{ instalarBuscadorMenuFinal(); removerElementosFinais(); },120);
  return r;
};
window.voltarAbaAnteriorFinal=function(){
  const prev=window.__abaHistFinal.pop();
  if(prev&&prev!==window.__abaAtualFinal&&typeof oldNavigate==='function'){
    window.__abaAtualFinal=prev;
    oldNavigate(prev);
  }
};

document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ window.__fechamentoUsuarioFinal=true; const m=document.getElementById('modal-root'); if(m&&!m.classList.contains('hidden')){ if(typeof closeModal==='function') closeModal(); e.preventDefault(); } } },true);
document.addEventListener('click',e=>{
  const target=e.target;
  const isModalClose=target&&target.closest&&target.closest('#modal-root button, #modal-root .absolute.inset-0');
  if(isModalClose){ const t=(isModalClose.innerText||'').trim(); if(!t||/fechar|cancelar|sair|×|x/i.test(t)||isModalClose.querySelector('.ph-x')) window.__fechamentoUsuarioFinal=true; }
},true);
const oldCloseModal=window.closeModal;
window.closeModal=function(){
  const user=!!window.__fechamentoUsuarioFinal; window.__fechamentoUsuarioFinal=false;
  const r=oldCloseModal?oldCloseModal.apply(this,arguments):undefined;
  if(user) setTimeout(()=>window.voltarAbaAnteriorFinal(),50);
  return r;
};

// Mantém o usuário na mesma tela depois de salvar/faturar e atualiza a tela aberta.
['saveCliente','saveOS','saveVenda','neoSalvarVenda','cvSaveVenda','faturarVenda','salvarChamadoV53','gerarFaturasPendentes'].forEach(nome=>{
  const fn=window[nome];
  if(typeof fn==='function'&&!fn.__finalStay){
    const wrap=function(){ const tela=window.__abaAtualFinal; const ret=fn.apply(this,arguments); setTimeout(()=>{ if(tela&&typeof oldNavigate==='function'){ window.__abaAtualFinal=tela; oldNavigate(tela); } },180); return ret; };
    wrap.__finalStay=true; window[nome]=wrap;
  }
});

// Clientes final: ordenação por coluna, padrão por código.
window.ordenarClientesFinal=function(col){
  const cur=window.__clientesSortFinal||{col:'codigo',dir:'asc'};
  window.__clientesSortFinal={col,dir:(cur.col===col&&cur.dir==='asc')?'desc':'asc'};
  renderClientes();
};
window.buscarClientesFinal=function(){ window.__clientesTodosFinal=false; window.__clientesBuscaFinal=txt(document.getElementById('clientes-busca-final')?.value); window.__clientesCampoFinal=txt(document.getElementById('clientes-campo-final')?.value)||'nome'; renderClientes(); };
window.clientesMostrarTodos=function(){ window.__clientesTodosFinal=true; window.__clientesBuscaFinal=''; window.__clientesCampoFinal='nome'; window.__clientesStatusFinal='ativos'; window.__clientesSortFinal=window.__clientesSortFinal||{col:'codigo',dir:'asc'}; renderClientes(); };
window.renderClientes=function(){
  const s=sess(); if(!s) return;
  const view=document.getElementById('view-clientes')||(typeof ensureView==='function'?ensureView('clientes'):null); if(!view) return;
  const busca=window.__clientesBuscaFinal||'', campo=window.__clientesCampoFinal||'nome', status=window.__clientesStatusFinal||'ativos', sort=window.__clientesSortFinal||{col:'codigo',dir:'asc'};
  const deveListar=window.__clientesTodosFinal || clientesDeveListar(busca,campo,status);
  let list=(db.clientes||[]).filter(c=>c.empresaId===s.empresaId);
  if(status==='ativos') list=list.filter(c=>c.status!=='inativo'&&c.status!=='oculto');
  else if(status==='inadimplente') list=list.filter(c=>c.status==='inadimplente');
  else if(status==='ocultos') list=list.filter(c=>c.status==='inativo'||c.status==='oculto');
  else if(status==='sem_telefone') list=list.filter(c=>!txt(c.telefone)&&!txt(c.whatsapp));
  else if(status==='sem_endereco') list=list.filter(c=>!txt(c.endereco)&&!txt(c.rua));
  if(deveListar) list=filtrarClientesFinal(list,busca,campo); else list=[];
  list=ordenarLista(list,sort.col,sort.dir);
  const totalGeral=(db.clientes||[]).filter(c=>c.empresaId===s.empresaId).length;
  const seta=col=>sort.col===col?(sort.dir==='asc'?' ▲':' ▼'):'';
  const th=(col,label)=>`<th onclick="ordenarClientesFinal('${col}')" class="cursor-pointer select-none hover:text-[#0a1e8a]">${label}${seta(col)}</th>`;
  const vazioMsg=deveListar?'Nenhum cliente encontrado com esse filtro.':'Pesquise ou escolha um filtro para listar os clientes. A lista não abre tudo por padrão para ficar leve.';
  view.innerHTML=`<div class="neo-shell"><div class="neo-panel"><div class="neo-head"><div><h3>Clientes</h3><p>Cadastro de clientes reais — padrão sem listar tudo. Pesquise ou filtre; depois clique nos títulos para organizar.</p></div><div class="neo-actions"><button onclick="openModal('cliente')" class="neo-btn primary"><i class="ph ph-user-plus"></i>Novo cliente</button></div></div><div class="p-4 border-b bg-white flex flex-wrap gap-2 items-center"><select id="clientes-campo-final" class="neo-select !h-10"><option value="nome">Nome</option><option value="codigo">Código</option><option value="fantasia">Fantasia</option><option value="documento">CPF/CNPJ</option><option value="telefone">Telefone</option><option value="cidade">Cidade</option><option value="bairro">Bairro</option></select><input id="clientes-busca-final" value="${esc(busca)}" onkeydown="if(event.key==='Enter')buscarClientesFinal()" placeholder="Buscar cliente por nome, código, telefone..." class="neo-input flex-1 min-w-[260px]"><button onclick="buscarClientesFinal()" class="neo-btn"><i class="ph ph-magnifying-glass"></i>Buscar</button><button onclick="clientesMostrarTodos()" class="neo-btn primary"><i class="ph ph-users"></i>Todos</button><select id="clientes-status-final" onchange="window.__clientesStatusFinal=this.value;renderClientes()" class="neo-select !h-10"><option value="ativos">Filtro: ativos</option><option value="inadimplente">Inadimplentes</option><option value="ocultos">Ocultos/inativos</option><option value="sem_telefone">Sem telefone</option><option value="sem_endereco">Sem endereço</option><option value="todos_status">Todos status</option></select><button onclick="window.__clientesTodosFinal=false;window.__clientesBuscaFinal='';window.__clientesCampoFinal='nome';window.__clientesStatusFinal='ativos';renderClientes()" class="neo-btn"><i class="ph ph-x"></i>Limpar</button><span class="text-[12px] text-slate-500 ml-auto">Mostrando <b>${list.length}</b> de <b>${totalGeral}</b></span></div><div class="overflow-auto max-h-[calc(100vh-280px)]"><table class="neo-table"><thead><tr>${th('codigo','Código')}${th('nome','Nome')}${th('fantasia','Fantasia')}${th('telefone','Telefone')}${th('documento','CPF/CNPJ')}${th('cidade','Cidade')}<th>Ações</th></tr></thead><tbody>${list.map(c=>`<tr ondblclick="openModal('cliente','${c.id}')" class="cursor-pointer hover:bg-slate-50"><td><b class="text-[#0a1e8a]">${esc(numCodigo(c.codigo)||c.codigo||'')}</b></td><td><b>${esc(c.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(c.email||'')}</span></td><td>${esc(c.fantasia||'')}</td><td>${esc(c.telefone||c.whatsapp||'')}</td><td>${esc(c.documento||'')}</td><td>${esc(c.cidade||'')}${c.estado?'/'+esc(c.estado):''}</td><td><button onclick="openModal('cliente','${c.id}')" class="neo-btn !px-2"><i class="ph ph-pencil"></i></button></td></tr>`).join('')||`<tr><td colspan="7" class="text-center text-slate-400 py-10">${vazioMsg}</td></tr>`}</tbody></table></div></div></div>`;
  const csel=document.getElementById('clientes-campo-final'); if(csel) csel.value=campo;
  const ssel=document.getElementById('clientes-status-final'); if(ssel) ssel.value=status;
};

// Reforço para impressão: dados da loja sempre completos quando existir config.loja.
const oldVosHtml=window.vosGerarHtmlNotinha;
if(typeof oldVosHtml==='function') window.vosGerarHtmlNotinha=function(id,opts){ let html=oldVosHtml.apply(this,arguments); const loja=(db.config||{}).loja||{}; if(html&&loja.fantasia){ const cab=`<p class="emp-nome">${esc(loja.fantasia)}</p><p class="emp-info">${esc(loja.razaoSocial||loja.nome||'')}${loja.cnpj?' • CNPJ '+esc(loja.cnpj):''}</p><p class="emp-info">${esc(loja.endereco||[loja.rua,loja.numero,loja.bairro,loja.cidade&&loja.uf?loja.cidade+'/'+loja.uf:loja.cidade,loja.cep].filter(Boolean).join(' • '))}</p><p class="emp-info">${loja.telefone?'Tel. '+esc(loja.telefone)+' • ':''}WhatsApp: <b>${esc(loja.whatsapp||'')}</b>${loja.email?' • '+esc(loja.email):''}</p>`; html=html.replace(/<p class="emp-nome">[\s\S]*?<\/p>\s*<p class="emp-info">[\s\S]*?<\/p>\s*<p class="emp-info">[\s\S]*?<\/p>/,cab); } return html; };

const oldBuildNav=window.buildNav;
window.buildNav=function(){ const r=oldBuildNav?oldBuildNav.apply(this,arguments):undefined; setTimeout(()=>{ instalarBuscadorMenuFinal(); removerElementosFinais(); },80); return r; };
setInterval(()=>{ instalarBuscadorMenuFinal(); removerElementosFinais(); },2000);
setTimeout(()=>{ instalarBuscadorMenuFinal(); removerElementosFinais(); },600);
console.log('[DIGICOPY] finalizacao_sistema_patch.js v4.9.61 carregado');
})();
