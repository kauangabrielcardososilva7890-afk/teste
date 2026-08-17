// DIGICOPY ERP — Ajustes de interface v4.9.0
// • Esc fecha modal/painéis de qualquer tela
// • Nuvem sem avisos repetitivos (só 1 confirmação clara nas ações manuais; erros continuam)
// • Consulta de clientes final: bonita (estilo neo), ordenação clicável nos títulos,
//   sem filtro A-Z, sem coluna "Sel", código estreito, busca só ao clicar na lupa/Enter
//   e render limitado para não travar em computadores fracos
(function(){
'use strict';

/* UI_PURE_START */
const UI_PURE = (function(){
  // ordena coluna com noção de número (código) e texto pt-BR
  function ordenaPor(lista, pega, dir){
    const mult = dir === 'desc' ? -1 : 1;
    return lista.slice().sort((a,b)=>{
      const va = pega(a), vb = pega(b);
      const sa = String(va==null?'':va).trim(), sb = String(vb==null?'':vb).trim();
      if(sa==='' && sb==='') return 0;
      if(sa==='') return 1;   // vazio sempre por último
      if(sb==='') return -1;
      const na = parseFloat(sa), nb = parseFloat(sb);
      const aNum = !isNaN(na) && /^-?[0-9.,]+$/.test(sa);
      const bNum = !isNaN(nb) && /^-?[0-9.,]+$/.test(sb);
      if(aNum && bNum) return (na-nb)*mult;
      return sa.localeCompare(sb,'pt-BR',{sensitivity:'base'})*mult;
    });
  }
  // avisos de nuvem que ficam quietos (o usuário pediu sem "sincronizou / não tem dados / etc")
  function ehAvisoDeNuvem(msg){
    const m = String(msg||'').toLowerCase();
    return m.includes('nuvem') || m.includes('sincroniz') || m.includes('publicad') ||
           m.includes('verificad') || m.includes('base recuperada') || m.includes('dados carregados');
  }
  return { ordenaPor, ehAvisoDeNuvem };
})();
/* UI_PURE_END */
window.UI_PURE = UI_PURE;

// ═══════════════════════════════════════════════════════════════════════════
// 1) ESC fecha modal e painéis em qualquer tela
// ═══════════════════════════════════════════════════════════════════════════
document.addEventListener('keydown', function(ev){
  if(ev.key !== 'Escape') return;
  try{ if(typeof ntfFecharPainel==='function') ntfFecharPainel(); }catch(e){}
  const modal = document.getElementById('modal-root');
  if(modal && !modal.classList.contains('hidden')){
    ev.preventDefault();
    if(typeof closeModal==='function') closeModal();
  }
}, true);

// ═══════════════════════════════════════════════════════════════════════════
// 2) Nuvem quieta: sem avisos repetitivos de sincronização
// ═══════════════════════════════════════════════════════════════════════════
const _uiToastReal = (typeof toast==='function') ? toast : function(){};
window.__toastReal = _uiToastReal;
window.toast = function(msg, tipo){
  if(tipo === 'error'){ window.__uiSyncErro = true; return _uiToastReal(msg, tipo); }
  if(UI_PURE.ehAvisoDeNuvem(msg)) return;      // silêncio nos "sincronizou/não tem dados..."
  return _uiToastReal(msg, tipo);
};
// ações manuais: uma única confirmação clara ao final
function uiWrapSync(fnOrig, msgOk){
  return async function(){
    window.__uiSyncErro = false;
    try{ if(fnOrig) await fnOrig({confirmar:true}); }catch(e){ window.__uiSyncErro = true; console.error(e); _uiToastReal('Não consegui agora: ' + ((e&&e.message)||e), 'error'); }
    if(!window.__uiSyncErro && msgOk) _uiToastReal(msgOk, 'success');
  };
}
if(typeof window.syncEnviarParaNuvem === 'function')
  window.enviarDadosLocaisParaNuvem = uiWrapSync(window.syncEnviarParaNuvem, 'Pronto! Este PC enviou os dados para a nuvem ☁️');
if(typeof window.syncCarregarDaNuvem === 'function')
  window.carregarDadosDaNuvem = uiWrapSync(window.syncCarregarDaNuvem, 'Pronto! Os dados da nuvem foram trazidos para este PC ☁️');

// ═══════════════════════════════════════════════════════════════════════════
// 3) Consulta de clientes — final e definitiva
// ═══════════════════════════════════════════════════════════════════════════
const CLI_COLS = [
  ['codigo','Código', c=>c.codigo],
  ['nome','Nome do Cliente', c=>c.nome],
  ['telefone','Telefone', c=>c.telefone],
  ['documento','CPF/CNPJ', c=>c.documento],
  ['fantasia','Nome Fantasia', c=>c.fantasia],
  ['cidade','Cidade', c=>c.cidade]
];
function cliTh(col, rot){
  const s = window.__cliSort || {col:'nome', dir:'asc'};
  const ativo = s.col === col;
  const proxDir = ativo && s.dir==='asc' ? 'desc' : 'asc';
  return `<th onclick="window.__cliSort={col:'${col}',dir:'${proxDir}'}; renderClientes()" class="cursor-pointer select-none hover:text-[#0a1e8a]" title="Clique para ordenar">${rot} ${ativo ? (s.dir==='asc'?'▲':'▼') : '<span class="text-slate-300">↕</span>'}</th>`;
}
window.renderClientes = function(){
  const sess = getSession(); if(!sess) return;
  const view = document.getElementById('view-clientes') || ensureView('clientes');
  // busca acontece SÓ ao apertar Enter ou clicar na lupa (leve para PCs fracos)
  const searchRaw = document.getElementById('cli-termo-aplicado')?.value || '';
  const campo = document.getElementById('cli-campo')?.value || 'todos';
  const limite = window.__cliLimite || 200;
  const sort = window.__cliSort || (window.__cliSort = {col:'nome', dir:'asc'});

  let list = db.clientes.filter(c=>c.empresaId===sess.empresaId && c.status!=='inativo');
  list = CLI_PURE.filtraClientes(list, searchRaw, campo);
  const colDef = CLI_COLS.find(c=>c[0]===sort.col) || CLI_COLS[1];
  const ordenada = UI_PURE.ordenaPor(list, colDef[2], sort.dir);

  const mostrando = ordenada.slice(0, limite);
  const selId = window.clienteSelecionadoClassic;
  view.innerHTML = `
  <div class="neo-shell"><div class="neo-panel neo-float-in">
    <div class="neo-head">
      <div><h3>Clientes</h3><p>Cadastro e consulta — <b>clique no título da coluna</b> para ordenar • <b>duplo clique</b> abre o cadastro</p></div>
      <div class="neo-actions">
        <button onclick="openModal('cliente')" class="neo-btn primary"><i class="ph ph-user-plus"></i>Novo</button>
        <button onclick="alterarClienteClassic()" class="neo-btn"><i class="ph ph-pencil"></i>Alterar</button>
        <button onclick="excluirClienteClassic()" class="neo-btn danger"><i class="ph ph-trash"></i>Excluir</button>
      </div>
    </div>
    <div class="p-4 border-b bg-white flex flex-wrap items-center gap-2">
      <select id="cli-campo" class="neo-select !h-10 !w-[180px]">
        ${CLI_PURE.CAMPOS_BUSCA.map(([k,r])=>`<option value="${k}" ${campo===k?'selected':''}>${r}</option>`).join('')}
      </select>
      <input id="cli-termo" value="" placeholder="Digite e aperte Enter (ou clique na lupa)..."
        onkeydown="if(event.key==='Enter'){document.getElementById('cli-termo-aplicado').value=this.value; window.__cliLimite=200; renderClientes();}"
        class="neo-input flex-1 min-w-[220px] !h-10">
      <button onclick="document.getElementById('cli-termo-aplicado').value=document.getElementById('cli-termo').value; window.__cliLimite=200; renderClientes()" class="neo-btn primary !h-10" title="Pesquisar"><i class="ph ph-magnifying-glass"></i></button>
      <button onclick="document.getElementById('cli-termo').value=''; document.getElementById('cli-termo-aplicado').value=''; window.__cliLimite=200; renderClientes()" class="neo-btn !h-10" title="Limpar filtro"><i class="ph ph-funnel-x"></i></button>
      <input id="cli-termo-aplicado" type="hidden" value="${escapeHtml(searchRaw)}">
      <span class="ml-auto text-[12px] text-slate-500"><b class="text-[#0a1e8a]">${list.length}</b> cliente(s)${searchRaw?` para “${escapeHtml(searchRaw)}”`:''}</span>
    </div>
    <div class="overflow-auto max-h-[calc(100vh-330px)]">
      <table class="neo-table"><thead><tr>
        <th onclick="window.__cliSort={col:'codigo',dir:'${sort.col==='codigo'&&sort.dir==='asc'?'desc':'asc'}'}; renderClientes()" class="cursor-pointer select-none hover:text-[#0a1e8a] !w-[66px] !max-w-[66px]" title="Clique para ordenar">Cód. ${sort.col==='codigo'?(sort.dir==='asc'?'▲':'▼'):'<span class="text-slate-300">↕</span>'}</th>
        ${cliTh('nome','Nome do Cliente')}
        ${cliTh('telefone','Telefone')}
        ${cliTh('documento','CPF/CNPJ')}
        ${cliTh('fantasia','Nome Fantasia')}
        ${cliTh('cidade','Cidade')}
        <th></th>
      </tr></thead><tbody>
      ${mostrando.map(c=>`<tr onclick="window.clienteSelecionadoClassic='${c.id}'; renderClientes()" ondblclick="openModal('cliente','${c.id}')" class="cursor-pointer ${selId===c.id?'neo-selected':''}">
        <td class="!w-[66px] !max-w-[66px] truncate"><b class="text-[#0a1e8a]">${c.codigo||''}</b></td>
        <td><b>${escapeHtml(c.nome||'')}</b></td>
        <td>${escapeHtml(c.telefone||'')}</td>
        <td>${escapeHtml(c.documento||'')}</td>
        <td>${escapeHtml(c.fantasia||'')}</td>
        <td>${escapeHtml([c.cidade, c.estado].filter(Boolean).join('/'))}</td>
        <td><button onclick="event.stopPropagation(); openModal('cliente','${c.id}')" class="neo-btn !px-2" title="Abrir cadastro"><i class="ph ph-eye"></i></button></td>
      </tr>`).join('') || '<tr><td colspan="7" class="text-center text-slate-500 py-12">Nenhum cliente encontrado — ajuste a pesquisa</td></tr>'}
      </tbody></table>
      ${ordenada.length > mostrando.length ? `<div class="p-3 text-center border-t bg-slate-50/70 sticky bottom-0"><button onclick="window.__cliLimite=${limite+200}; renderClientes()" class="neo-btn primary"><i class="ph ph-plus-circle"></i>Mostrar mais ${Math.min(200, ordenada.length-mostrando.length)} de ${ordenada.length-mostrando.length}</button><p class="text-[11px] text-slate-500 mt-1">Para chegar direto no cliente, use a pesquisa acima</p></div>` : ''}
    </div>
  </div></div>`;
};

// barra azul sempre atualizada: à esquerda "DIGICOPY ERP x.y.z" (versão real),
// no centro o nome da tela (quem cuida é o sistema de navegação)
(function(){
  function tituloApp(){
    const v = (typeof APP_VERSION!=='undefined') ? APP_VERSION : '';
    const span = document.getElementById('app-title-version');
    if(span) span.innerText = 'DIGICOPY ERP' + (v ? (' ' + v) : '');
    const t = document.getElementById('page-title');
    const atual = t ? String(t.innerText || t.textContent || '').trim() : '';
    if(t && (!atual || /DIGICOPY/i.test(atual))) t.textContent = 'Início';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', tituloApp);
  else tituloApp();
})();

// ═══════════════════════════════════════════════════════════════════════════
// Contador sequencial monotônico: código excluído NUNCA é reutilizado
// (excluir o cliente 57 não devolve o 57 pra ninguém — nem excluindo o último).
// Guardado em db.config.seq, que sincroniza pela nuvem → vale em todos os PCs.
// ═══════════════════════════════════════════════════════════════════════════
window.seqObter = function(tipo, itens, empresaId, extrator){
  db.config = db.config || {};
  db.config.seq = db.config.seq || {};
  const key = tipo + '_' + empresaId;
  let maxExistente = 0;
  (itens||[]).forEach(it=>{
    const n = Number(extrator ? extrator(it) : it) || 0;
    if(n > maxExistente) maxExistente = n;
  });
  const atual = Math.max(Number(db.config.seq[key])||0, maxExistente);
  db.config.seq[key] = atual + 1;
  return atual + 1;
};

// ═══════════════════════════════════════════════════════════════════════════
// Altura da home medida com "régua" de verdade (getBoundingClientRect):
// o cálculo fixo em pixels (100vh - 124px) nunca fechava exato e sobrava um
// pedaço vazio pra rolar. Agora a home ocupa EXATAMENTE o espaço livre entre
// o menu azul e o rodapé, em qualquer tela/zoom → não existe mais scroll pro vazio.
// ═══════════════════════════════════════════════════════════════════════════
window.uiAjustarHome = function(){
  const view = document.getElementById('view-dashboard');
  if(!view || view.classList.contains('hidden')) return;
  const home = view.querySelector('.clean-home, .desktop-home');
  if(!home) return;
  const footer = document.querySelector('#app-shell main footer');
  window.scrollTo(0, 0); // se veio de uma tela longa, a régua não pode medir com a página rolada
  const topo = home.getBoundingClientRect().top;
  const altFooter = footer ? footer.getBoundingClientRect().height : 0;
  home.style.minHeight = Math.max(240, window.innerHeight - topo - altFooter) + 'px';
  home.style.height = 'auto';
};
window.addEventListener('resize', window.uiAjustarHome);
const _uiNavOriginal = window.navigateTo;
if(typeof _uiNavOriginal==='function'){
  window.navigateTo = function(){
    _uiNavOriginal.apply(this, arguments);
    setTimeout(window.uiAjustarHome, 60);
  };
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(window.uiAjustarHome, 400); });
else setTimeout(window.uiAjustarHome, 400);

console.log('[DIGICOPY] Interface v4.9.3 — Esc fecha tudo, nuvem quieta, home sem scroll vazio');
})();
