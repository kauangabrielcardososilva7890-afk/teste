// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.21.3 — Módulos migrados (Fiscal e demais) no visual neo padrão
// • As abas das tabelas migradas (ex.: as 6 do Fiscal) usavam o layout roxo
//   antigo, com busca filtrando a cada tecla. Agora usam o mesmo padrão neo
//   dos outros menus: cabeçalho, KPIs, lupa, ordenação e duplo clique.
// • Busca SÓ no Enter ou na lupa (regra oficial). Botão "Limpar".
// • Ordenação clicando no título da coluna (▲▼), como nos outros menus.
// • Duplo clique na linha abre o detalhe do registro.
// • Paginação "Mostrar mais" de 50 em 50 (não trava com tabela grande).
// • Botões Exportar / Excluir módulo mantidos no cabeçalho.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

/* ---------------- LÓGICA PURA (testável em node) ---------------- */

function cmpValor(a, b){
  const sa = String(a == null ? '' : a).trim(), sb = String(b == null ? '' : b).trim();
  const na = parseFloat(sa.replace(',', '.')), nb = parseFloat(sb.replace(',', '.'));
  const aNum = sa !== '' && !isNaN(na) && /^-?[\d.,]+$/.test(sa);
  const bNum = sb !== '' && !isNaN(nb) && /^-?[\d.,]+$/.test(sb);
  if(aNum && bNum) return na - nb;
  if(/\d{4}-\d{2}-\d{2}/.test(sa) && /\d{4}-\d{2}-\d{2}/.test(sb)){
    const da = Date.parse(sa), dbb = Date.parse(sb);
    if(!isNaN(da) && !isNaN(dbb)) return da - dbb;
  }
  try{ return sa.localeCompare(sb, 'pt-BR', { sensitivity: 'base' }); }
  catch(e){ return sa < sb ? -1 : (sa > sb ? 1 : 0); }
}
function filtrar(dados, colunas, q, coluna){
  const busca = String(q == null ? '' : q).trim().toLowerCase();
  const lista = Array.isArray(dados) ? dados : [];
  if(!busca) return lista.slice();
  const cols = Array.isArray(colunas) && colunas.length ? colunas : [];
  return lista.filter(row => {
    if(!row || typeof row !== 'object') return false;
    if(coluna) return String(row[coluna] == null ? '' : row[coluna]).toLowerCase().includes(busca);
    const chaves = cols.length ? cols : Object.keys(row);
    return chaves.some(c => String(row[c] == null ? '' : row[c]).toLowerCase().includes(busca));
  });
}
function ordenar(dados, coluna, dir){
  if(!coluna) return Array.isArray(dados) ? dados.slice() : [];
  const mult = dir === 'desc' ? -1 : 1;
  return dados.slice().sort((a, b) => mult * cmpValor(a ? a[coluna] : '', b ? b[coluna] : ''));
}
function fatiar(lista, limite){
  const lim = Math.max(1, parseInt(limite, 10) || 50);
  const arr = Array.isArray(lista) ? lista : [];
  return { visiveis: arr.slice(0, lim), total: arr.length, mostrando: Math.min(lim, arr.length) };
}

window.MODULOS_NEO_PURE = { cmpValor, filtrar, ordenar, fatiar };

if(typeof document === 'undefined') return; // modo teste (node)

/* ---------------- Visual neo (navegador) ---------------- */

function esc(v){
  if(typeof escapeHtml === 'function') return escapeHtml(v);
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function uiState(nomeTabela){
  window.__modUi = window.__modUi || {};
  return window.__modUi[nomeTabela] || (window.__modUi[nomeTabela] = { busca: '', coluna: '' });
}
function ordState(nomeTabela){
  window.__modOrdem = window.__modOrdem || {};
  return window.__modOrdem[nomeTabela] || (window.__modOrdem[nomeTabela] = {});
}
function limiteState(nomeTabela){
  window.__modNeoLimite = window.__modNeoLimite || {};
  if(!window.__modNeoLimite[nomeTabela]) window.__modNeoLimite[nomeTabela] = 50;
  return window.__modNeoLimite[nomeTabela];
}
function fmtDataHora(v){
  if(typeof fmtDateTime === 'function'){ try{ return fmtDateTime(v); }catch(e){} }
  try{ const d = new Date(v); return isNaN(d) ? String(v || '-') : d.toLocaleString('pt-BR'); }catch(e){ return '-'; }
}
function categoriaDaTabela(nomeTabela){
  try{
    if(typeof categoriaModulo === 'function') return categoriaModulo(nomeTabela);
  }catch(e){}
  return { id: 'outros', rotulo: 'Outros módulos', icone: 'ph-table' };
}

window.ordenarModuloDinamico = function(nomeTabela, col){
  const s = ordState(nomeTabela);
  if(s.col === col) s.dir = (s.dir === 'asc' ? 'desc' : 'asc');
  else { s.col = col; s.dir = 'asc'; }
  window.renderModuloDinamico(nomeTabela);
};
window.filtrarModuloDinamico = function(nomeTabela){
  const ui = uiState(nomeTabela);
  const inp = document.getElementById('search-mod-' + nomeTabela);
  const sel = document.getElementById('coluna-mod-' + nomeTabela);
  if(inp) ui.busca = inp.value;
  if(sel) ui.coluna = sel.value;
  window.__modNeoLimite = window.__modNeoLimite || {};
  window.__modNeoLimite[nomeTabela] = 50;
  window.renderModuloDinamico(nomeTabela);
};
window.limparBuscaModulo = function(nomeTabela){
  const ui = uiState(nomeTabela);
  ui.busca = ''; ui.coluna = '';
  window.__modNeoLimite = window.__modNeoLimite || {};
  window.__modNeoLimite[nomeTabela] = 50;
  window.renderModuloDinamico(nomeTabela);
};
window.mostrarMaisModulo = function(nomeTabela){
  window.__modNeoLimite = window.__modNeoLimite || {};
  window.__modNeoLimite[nomeTabela] = (window.__modNeoLimite[nomeTabela] || 50) + 50;
  window.renderModuloDinamico(nomeTabela);
};

window.renderModuloDinamico = function(nomeTabela){
  const modulo = (typeof db !== 'undefined' && db.modulosDinamicos) ? db.modulosDinamicos[nomeTabela] : null;
  if(!modulo){ if(typeof toast === 'function') toast('Módulo não encontrado', 'error'); return; }
  const ui = uiState(nomeTabela), ord = ordState(nomeTabela);
  const el = (typeof ensureView === 'function')
    ? ensureView('mod_' + String(nomeTabela).toLowerCase().replace(/[^a-z0-9]/g, '_'))
    : document.getElementById('view-mod_' + String(nomeTabela).toLowerCase().replace(/[^a-z0-9]/g, '_'));
  if(!el) return;
  const dados = Array.isArray(modulo.dados) ? modulo.dados : [];
  const colunas = (Array.isArray(modulo.colunas) && modulo.colunas.length)
    ? modulo.colunas
    : (dados.length ? Object.keys(dados[0]) : []);
  const label = modulo.label || (typeof formatarNomeTabela === 'function' ? formatarNomeTabela(nomeTabela) : String(nomeTabela));
  const cat = categoriaDaTabela(nomeTabela);
  const maxColunas = Math.min(colunas.length, 8);
  const colunasVisiveis = colunas.slice(0, maxColunas);
  const limite = limiteState(nomeTabela);

  const comIndice = dados.map((row, i) => ({ row, i }));
  const filtrados = filtrar(comIndice.map(x => x.row), colunas, ui.busca, ui.coluna)
    .map(row => ({ row, i: dados.indexOf(row) }));
  const ordenados = ord.col
    ? filtrados.slice().sort((a, b) => (ord.dir === 'desc' ? -1 : 1) * cmpValor(a.row ? a.row[ord.col] : '', b.row ? b.row[ord.col] : ''))
    : filtrados;
  const pagina = fatiar(ordenados, limite);
  const seta = c => (ord.col === c ? (ord.dir === 'asc' ? ' ▲' : ' ▼') : '');

  el.innerHTML =
  '<div class="neo-shell"><div class="neo-panel">' +
    '<div class="neo-head"><div>' +
      '<h3>' + esc(label) + '</h3>' +
      '<p><span class="text-white/80">Tabela ' + esc(nomeTabela) + ' • ' + dados.length + ' registros</span> ' +
      '<span class="neo-status info"><i class="ph ' + esc(cat.icone || 'ph-table') + '"></i> ' + esc(cat.rotulo || '') + '</span></p>' +
    '</div><div class="neo-actions">' +
      '<button onclick="exportarModuloDinamico(\'' + nomeTabela + '\')" class="neo-btn"><i class="ph ph-export"></i>Exportar</button>' +
      '<button onclick="confirmarExcluirModulo(\'' + nomeTabela + '\')" class="neo-btn danger"><i class="ph ph-trash"></i>Excluir módulo</button>' +
    '</div></div>' +
    '<div class="neo-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">' +
      '<div class="neo-card"><p class="neo-label">Registros</p><p class="neo-total" style="font-size:26px">' + dados.length + '</p></div>' +
      '<div class="neo-card"><p class="neo-label">Campos</p><p class="neo-total" style="font-size:26px">' + colunas.length + '</p></div>' +
      '<div class="neo-card"><p class="neo-label">Origem</p><p style="font-size:14px;font-weight:800;margin-top:6px">' + esc(modulo.origem || 'Firebird') + '</p></div>' +
      '<div class="neo-card"><p class="neo-label">Importado em</p><p style="font-size:14px;font-weight:800;margin-top:6px">' + (modulo.importadoEm ? esc(fmtDataHora(modulo.importadoEm)) : '-') + '</p></div>' +
    '</div>' +
    '<div class="p-4 border-b flex gap-2 flex-wrap items-center">' +
      '<input id="search-mod-' + nomeTabela + '" value="' + esc(ui.busca || '') + '" onkeydown="if(event.key===\'Enter\'){filtrarModuloDinamico(\'' + nomeTabela + '\')}" class="neo-input flex-1 min-w-[220px]" placeholder="Pesquisar e apertar Enter...">' +
      '<select id="coluna-mod-' + nomeTabela + '" class="neo-select"><option value="">Todas as colunas</option>' +
        colunas.map(c => '<option value="' + esc(c) + '"' + (ui.coluna === c ? ' selected' : '') + '>' + esc(c) + '</option>').join('') +
      '</select>' +
      '<button onclick="filtrarModuloDinamico(\'' + nomeTabela + '\')" class="neo-btn primary" title="Pesquisar"><i class="ph ph-magnifying-glass"></i></button>' +
      '<button onclick="limparBuscaModulo(\'' + nomeTabela + '\')" class="neo-btn">Limpar</button>' +
      '<span class="self-center text-[12px] text-slate-500" id="mod-count-' + nomeTabela + '"><b>' + pagina.total + '</b> registros' + (ui.busca ? ' (filtrados de ' + dados.length + ')' : '') + '</span>' +
    '</div>' +
    '<div class="overflow-auto max-h-[calc(100vh-340px)]"><table class="neo-table"><thead><tr>' +
      '<th style="width:44px">#</th>' +
      colunasVisiveis.map(c => '<th><a href="javascript:void(0)" onclick="ordenarModuloDinamico(\'' + nomeTabela + '\',\'' + esc(c) + '\')" style="color:inherit;text-decoration:none">' + esc(c) + seta(c) + '</a></th>').join('') +
      (colunas.length > maxColunas ? '<th>+' + (colunas.length - maxColunas) + '</th>' : '') +
      '<th style="width:70px">Ações</th>' +
    '</tr></thead><tbody id="mod-tbody-' + nomeTabela + '">' +
      (pagina.visiveis.map((item, k) =>
        '<tr ondblclick="visualizarRegistroDinamico(\'' + nomeTabela + '\',' + item.i + ')" title="Duplo clique para ver o detalhe">' +
        '<td>' + (k + 1) + '</td>' +
        colunasVisiveis.map(c => '<td>' + esc(String(item.row && item.row[c] != null ? item.row[c] : '').substring(0, 60)) + '</td>').join('') +
        (colunas.length > maxColunas ? '<td>...</td>' : '') +
        '<td><button onclick="visualizarRegistroDinamico(\'' + nomeTabela + '\',' + item.i + ')" class="neo-btn" title="Visualizar"><i class="ph ph-eye"></i></button></td>' +
        '</tr>'
      ).join('') || '<tr><td colspan="' + (colunasVisiveis.length + 3) + '" class="text-center text-slate-500 py-8">Nenhum registro encontrado</td></tr>') +
    '</tbody></table></div>' +
    (pagina.total > pagina.mostrando
      ? '<div class="p-3 border-t text-center"><button onclick="mostrarMaisModulo(\'' + nomeTabela + '\')" class="neo-btn">Mostrar mais (' + pagina.mostrando + ' de ' + pagina.total + ')</button></div>'
      : '<div class="p-3 border-t text-center text-[12px] text-slate-500">Mostrando ' + pagina.mostrando + ' de ' + pagina.total + ' registros • duplo clique abre o detalhe</div>') +
  '</div></div>';
};

window.visualizarRegistroDinamico = function(nomeTabela, idx){
  const modulo = (typeof db !== 'undefined' && db.modulosDinamicos) ? db.modulosDinamicos[nomeTabela] : null;
  if(!modulo || !modulo.dados || !modulo.dados[idx]) return;
  const row = modulo.dados[idx];
  const label = modulo.label || (typeof formatarNomeTabela === 'function' ? formatarNomeTabela(nomeTabela) : String(nomeTabela));
  const modalRoot = document.getElementById('modal-root');
  if(!modalRoot) return;
  const entradas = Object.entries(row);
  modalRoot.innerHTML =
    '<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick="if(event.target===this)closeModal()">' +
    '<div class="neo-panel neo-float-in" style="max-width:640px;width:100%;max-height:90vh;display:flex;flex-direction:column">' +
      '<div class="neo-head"><div><h3>' + esc(label) + ' — #' + (idx + 1) + '</h3><p>Tabela: ' + esc(nomeTabela) + ' • ' + entradas.length + ' campos</p></div>' +
      '<div class="neo-actions"><button onclick="closeModal()" class="neo-btn"><i class="ph ph-x"></i>Fechar</button></div></div>' +
      '<div class="flex-1 overflow-y-auto p-4"><div class="neo-card">' +
        entradas.map(([key, value]) =>
          '<div class="border-b pb-2 mb-2"><p class="neo-label">' + esc(key) + '</p>' +
          '<p class="text-[14px]">' + (value === null || value === undefined || value === '' ? '<span class="text-slate-400 italic">vazio</span>' : esc(String(value))) + '</p></div>'
        ).join('') +
      '</div></div>' +
    '</div></div>';
  modalRoot.classList.remove('hidden');
};

console.log('[DIGICOPY] modulos_neo_visual_patch.js v5.21.3 carregado — migrados/Fiscal no padrão neo');
})();
