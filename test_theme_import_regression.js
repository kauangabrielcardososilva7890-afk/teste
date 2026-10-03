const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

assert(index.includes('var shellRefreshPending=false'), 'shell usa atualização coalescida');
assert(index.includes('new MutationObserver(scheduleShellRefresh)'), 'observer usa scheduler');
assert(index.includes('ordem.concat(groups.map'), 'reordenação preserva menus novos');
assert(index.includes('<option value="top">Topo horizontal</option>'), 'posição topo horizontal disponível');
assert(index.includes('digi-sidebar-top #shell-sidebar-links'), 'CSS do topo horizontal existe');
assert(index.includes('digicopy-v8-dark-complete'), 'tema escuro completo existe');
assert(index.includes('data-sub-row') && index.includes('data-sub-name'), 'editor permite ordenar e renomear submenus');
assert(index.includes('data-menu-hidden') && index.includes('data-sub-hidden'), 'editor permite ocultar menus e submenus');
assert(index.includes('digicopy_ui_menus_usuario_'), 'personalização de menus é separada por usuário');

const start = app.indexOf('window.importarJsonDBeaver = function');
const end = app.indexOf('\n};', start);
assert(start >= 0 && end > start, 'importador JSON existe');
const importer = app.slice(start, end);
assert(!/\bconfirm\s*\(/.test(importer), 'importador não usa confirm nativo');
assert(importer.includes('window.confirmSistema'), 'importador usa confirmação do sistema');
assert(importer.includes('window.lfbAlert'), 'importador tem fallback visual');

console.log('PASS: regressão do loop do shell e confirmação do importador coberta');
