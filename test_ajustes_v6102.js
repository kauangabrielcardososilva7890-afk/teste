const fs = require('fs');
let okCount = 0;
function ok(c, m) { if (!c) { console.error('  ✘ ' + m); process.exitCode = 1; } else { console.log('  ✔ ' + m); okCount++; } }
const ler = f => fs.readFileSync(f, 'utf8');

console.log('== v6.1.2 — navegação fiscal na barra (reconstruída) + escuro íntegro ==');

const p = ler('navegacao_fiscal_barra_escuro_patch.js');
ok(p.length > 4000, 'patch v6.1.2 existe e tem corpo');
ok(/__v612nes/.test(p) && p.indexOf('__v612nes') < p.indexOf('__v612nes = true'), 'guard __v612nes antes do registro');
ok(/v6\.1\.2 navegação Fiscal firme na barra \+ escuro sem bug/.test(p), 'log de boot da v6.1.2');

/* acha o módulo fiscal mesmo depois do pintarMenus reescrever a barra */
ok(/onclick/.test(p) && /abrirCentralNfe/.test(p) && /central-nf/.test(p), 'seleção do módulo fiscal via onclick (sobrevive à re-pintura)');
ok(/\.module-row \.module/.test(p) && /moduloFiscal/.test(p) && /fixBarra/.test(p), 'fixBarra localiza e repara o módulo fiscal na row');
ok(/<i class="ph ph-file-text"><\/i>Fiscal/.test(p), 'rótulo da aba forçado para "Fiscal"');
ok(/data-nes612/.test(p) && /menu-nfe/.test(p), '(re)cria #menu-nfe oficial com marca própria');
ok(/navigateTo\('fiscal-perfil'\)/.test(p) && /navigateTo\('fiscal-manifestacao'\)/.test(p) &&
   /navigateTo\('fiscal-ncm'\)/.test(p) && /navigateTo\('fiscal-enviar-xml'\)/.test(p) &&
   /navigateTo\('config-fiscal'\)/.test(p) && /navigateTo\('central-nf'\)/.test(p), 'os 6 itens oficiais do submenu');
ok(/sfo-pin/.test(p) && /defaultPrevented/.test(p), 'pin por clique reusa .sfo-pin e respeita o handler da v6.1.1 (sem duplo toggle)');
ok(/closest\('.module-menu'\)/.test(p) && /remove\(.sfo-pin.\)/.test(p), 'clique no item navega e o pin se solta');
ok(/MutationObserver/.test(p) && /\.module-row/.test(p), 'observer refaz o reparo após qualquer re-pintura da barra');
ok(/showApp/.test(p) && /__v612nes/.test(p), 'showApp embrulhado (boot tardio repara também)');

/* modo escuro — os claros fixos respeitam .digi-escuro */
const views = ['view-central-nf','view-fiscal-perfil','view-fiscal-manifestacao','view-fiscal-enviar-xml','view-fiscal-ncm','view-config-fiscal'];
ok(views.every(v => p.indexOf('body.digi-escuro #' + v) !== -1), 'as 6 shells fiscais têm gradiente escuro próprio');
ok(/nes612-css/.test(p) && /linear-gradient\(180deg,#0a1240/.test(p), 'CSS injetado nes612-css com gradiente escuro');
ok(/body\.digi-escuro #fx-root \.fx-card/.test(p) && /body\.digi-escuro #fx-root \.fx-barra/.test(p), 'fx-card/fx-barra escuros no dark');
ok(/body\.digi-escuro #fx-root \.fx-tb th/.test(p) && /body\.digi-escuro #fx-root \.fx-tb td/.test(p), 'tabelas fx legíveis no escuro');
ok(/body\.digi-escuro #menu-nfe\{/.test(p) && /body\.digi-escuro #menu-nfe button:hover/.test(p), 'submenu #menu-nfe escuro na barra');
ok(/body\.digi-escuro #sxvm-flyout-nav\{/.test(p), 'flyout lateral escuro');
const regrasClarasEscuras = (p.match(/digi-escuro/g) || []).length;
ok(regrasClarasEscuras >= 16, 'cobertura escura ampla (' + regrasClarasEscuras + ' menções a digi-escuro)');
ok(!/digi-escuro\s*[{,][^{}]*#f6f9ff|#f8fbff/.test(p), 'nenhum fundo claro nos blocos escuros');

/* convívio e manifesto */
const man = JSON.parse(ler('bundle-manifest.json'));
ok(man.length === 222 && man[221] === 'navegacao_fiscal_barra_escuro_patch.js' && man[220] === 'submenu_fiscal_oficial_patch.js',
  'manifesto 222: v6.1.1 antes, v6.1.2 fecha a fila');
const ix = ler('index.html');
ok(/DIGICOPY_APP_VERSION = '6\.1\.3'/.test(ix) && /<title>Sistema Digicopy v6\.1\.3<\/title>/.test(ix) &&
   />v6\.1\.3<\/span>/.test(ix) && /app\.bundle\.js\?v=6\.1\.3/.test(ix), '4 carimbos atuais no index');
ok(/>Fiscal<\/button><div id="menu-nfe"/.test(ix) || /<\/i>Fiscal<\/button><div id="menu-nfe"/.test(ix), 'index estático segue com a aba "Fiscal" + #menu-nfe');
ok(!/localStorage\.setItem\('db\./.test(p) && !/indexedDB/.test(p), 'não toca banco, não importa dado (importação continua cancelada)');

console.log('  ► v6.1.2: ' + okCount + ' PASS | ' + (process.exitCode ? 'FALHAS' : '0 FALHAS'));
