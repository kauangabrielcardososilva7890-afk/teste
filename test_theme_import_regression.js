const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html', 'utf8');
const manifest = fs.readFileSync('bundle-manifest.json', 'utf8');
const fluxos = fs.readFileSync('fluxos_operacionais_patch.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
assert(app.includes("v.style.removeProperty('display')") && app.includes("v.style.removeProperty('visibility')"), 'navegação limpa estilos inline das telas ocultadas');

assert(index.includes('var shellRefreshPending=false'), 'shell usa atualização coalescida');
assert(index.includes('new MutationObserver(scheduleShellRefresh)'), 'observer usa scheduler');
assert(index.includes('ordem.concat(groups.map'), 'reordenação preserva menus novos');
assert(index.includes('function reorderChildren(parent, nodes)'), 'reordenação não duplica mutações do observer');
assert(index.includes('current.every(function(n,i){return n===nodes[i]})'), 'reordenação evita append quando a ordem já está correta');
assert(index.includes('label.textContent!==nome'), 'renomeação de menu evita mutação redundante');
assert(index.includes('b.textContent!==savedSub[sid]'), 'renomeação de submenu evita mutação redundante');
assert(index.includes('<option value="top">Topo horizontal</option>'), 'posição topo horizontal disponível');
assert(index.includes('digi-sidebar-top #shell-sidebar-links'), 'CSS do topo horizontal existe');
assert(index.includes('digi-sidebar-top #sidebar>div:nth-child(2){display:flex!important'), 'lista de menus permanece visível no topo');
assert(index.includes('html.digi-escuro #app-shell [class*="bg-white"]'), 'tema escuro cobre fundos Tailwind dinâmicos');
assert(index.includes('html.digi-escuro #app-shell input,html.digi-escuro #app-shell select'), 'tema escuro cobre controles de formulário');
assert(index.includes('html.digi-escuro #app-shell .view,html.digi-escuro #app-shell .neo-shell'), 'tema escuro cobre o fundo das telas internas');
assert(index.includes('html.digi-escuro #app-shell button.bg-white'), 'tema escuro cobre botões brancos das telas');
assert(manifest.includes('ajustes_v52237_orcamentos_menu_patch.js'), 'módulo completo de Orçamentos está no bundle');
assert(!fluxos.includes("|| '<tr><td colspan=\"8\" class=\"px-5 py-14 text-center text-slate-500\">${avisoLista}</td></tr>'"), 'Produtos não exibe interpolação literal');
assert(index.includes('digicopy-v8-dark-complete'), 'tema escuro completo existe');
assert(index.includes('data-sub-row') && index.includes('data-sub-name'), 'editor permite ordenar e renomear submenus');
assert(index.includes('data-menu-hidden') && index.includes('data-sub-hidden'), 'editor permite ocultar menus e submenus');
assert(index.includes('digicopy_ui_menus_usuario_'), 'personalização de menus é separada por usuário');
assert(index.includes('background:#111827!important;background-color:#111827!important;color:#e5e7eb!important'), 'tema escuro cobre componentes dinâmicos');

const start = app.indexOf('window.importarJsonDBeaver = function');
const end = app.indexOf('\n};', start);
assert(start >= 0 && end > start, 'importador JSON existe');
const importer = app.slice(start, end);
assert(!/\bconfirm\s*\(/.test(importer), 'importador não usa confirm nativo');
assert(importer.includes('window.confirmSistema'), 'importador usa confirmação do sistema');
assert(importer.includes('window.lfbAlert'), 'importador tem fallback visual');
assert(app.includes('__uploadLeituraEmAndamento'), 'leitura de arquivos tem trava contra reentrada');
assert(app.includes('f.lastModified === file.lastModified'), 'leitura elimina arquivos duplicados');
assert(app.includes('rawData[tabelaKey].data.concat(value)'), 'importador soma tabelas repetidas em arquivos diferentes');
assert(app.includes('__importacaoLegadoEmAndamento || window.__fbImportEmAndamento'), 'gravação bloqueia importação concorrente');

console.log('PASS: regressão do loop do shell e confirmação do importador coberta');
