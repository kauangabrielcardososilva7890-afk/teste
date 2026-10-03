const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

assert(index.includes('var shellRefreshPending=false'), 'shell usa atualização coalescida');
assert(index.includes('new MutationObserver(scheduleShellRefresh)'), 'observer usa scheduler');
assert(index.includes('desired.length===current.length&&desired.every'), 'reordenação evita append desnecessário');

const start = app.indexOf('window.importarJsonDBeaver = function');
const end = app.indexOf('\n};', start);
assert(start >= 0 && end > start, 'importador JSON existe');
const importer = app.slice(start, end);
assert(!/\bconfirm\s*\(/.test(importer), 'importador não usa confirm nativo');
assert(importer.includes('window.confirmSistema'), 'importador usa confirmação do sistema');
assert(importer.includes('window.lfbAlert'), 'importador tem fallback visual');

console.log('PASS: regressão do loop do shell e confirmação do importador coberta');
