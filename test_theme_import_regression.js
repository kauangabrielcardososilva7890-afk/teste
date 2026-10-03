const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

assert(index.includes('var shellRefreshPending=false'), 'shell usa atualização coalescida');
assert(index.includes('new MutationObserver(scheduleShellRefresh)'), 'observer usa scheduler');
assert(index.includes('ordem.concat(groups.map'), 'reordenação preserva menus novos');
assert(index.includes('function reorderChildren(parent, nodes)'), 'reordenação não duplica mutações do observer');
assert(index.includes('current.every(function(n,i){return n===nodes[i]})'), 'reordenação evita append quando a ordem já está correta');
assert(index.includes('<option value="top">Topo horizontal</option>'), 'posição topo horizontal disponível');
assert(index.includes('digi-sidebar-top #shell-sidebar-links'), 'CSS do topo horizontal existe');
assert(index.includes('digi-sidebar-top #sidebar>div:nth-child(2){display:flex!important'), 'lista de menus permanece visível no topo');
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
