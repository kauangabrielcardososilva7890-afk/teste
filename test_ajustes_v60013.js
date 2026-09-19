// test_ajustes_v60013.js — v6.0.13: MENU FISCAL BONITO ("ta horrivel de feio
// esse menu fiscal"). Faixa ribbon estilo a aba NF-e/NFC-e do sistema antigo:
// aba ativa, botões GRANDES (ícone em cima, nome embaixo) em 3 grupos, item
// atual destacado, no topo de TODAS as telas fiscais; polimento do flyout
// lateral via CSS (sem tocar no arquivo da v6.0.11 — mural a protege).
const fs = require('fs');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('ribbon_fiscal_estilo_antigo_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const sxvm = fs.readFileSync('submenu_hover_nfe_patch.js', 'utf8');
const P = require('./ribbon_fiscal_estilo_antigo_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto já é 219 — a ribbon v6.0.13 ficou na posição histórica 217 (em cima dela, só o catálogo fiscal completo)',
  man.length === 221 && man[217] === 'ribbon_fiscal_estilo_antigo_patch.js' && man[216] === 'navegacao_sem_tela_branca_patch.js');
ok('bundle contém o patch (guard + PURE + css)',
  bundle.indexOf('__v60013wxr') >= 0 && bundle.indexOf('WXR613_PURE') >= 0 && bundle.indexOf('wxr-ribbon-css') >= 0);

console.log('== OS 6 ITENS EM GRUPOS (PURE) ==');
const it = P.itens();
ok('6 itens, mesmos destinos/ordem da v6.0.10 (nada muda de lugar)',
  it.length === 6 && it.map(m => m.rot).join(' · ') === 'Nota Fiscal · Manifestação · Enviar XML · Perfil Tributário · NCM · Configurações');
ok('3 grupos na ordem clássica de ribbon',
  P.gruposOrdem().join(' / ') === 'Documentos / Cadastros fiscais / Sistema');
ok('cada item tem view real + ícone ph-',
  it.every(m => P.ehViewFiscal(m.view) && m.icon.indexOf('ph-') === 0));

console.log('== A FAIXA (injeção + sobrevivência a re-render) ==');
ok('injeta no topo (insertBefore firstChild) idempotente por view',
  src.indexOf("insertBefore(wxrMonta") >= 0 && src.indexOf("querySelector(':scope > .wxr-bar')") >= 0);
ok('re-injeta depois de render (wrap navigateTo agenda 2 ticks) + sonda só p/ tela fiscal aberta',
  src.indexOf('setTimeout(wxrGarante, 40)') >= 0 && src.indexOf('offsetParent !== null') >= 0);
ok('aba NF-e/NFC-e ativa no topo da faixa (cara do velho)',
  src.indexOf('wxr-tab') >= 0 && src.indexOf('NF-e/NFC-e</div>') >= 0);
ok('destaque do item atual (wxr-btn.ativo)',
  src.indexOf("' ativo'") >= 0 && src.indexOf('.wxr-btn.ativo') >= 0);

console.log('== FLYOUT LATERAL GANHA BELEZA SÓ VIA CSS (arquivo da 6.0.11 intocado) ==');
ok('CSS do flyout: cabeçalho NF-e/NFC-e via ::before + bordas/hover/sombra',
  src.indexOf('#sxvm-flyout-nav::before') >= 0 && src.indexOf('!important') >= 0);
ok('submenu_hover_nfe_patch.js NÃO foi editado nesta versão (mural 6.0.11 segue valendo)',
  sxvm.indexOf('__v60011sxvm') >= 0 && sxvm.indexOf('__v60013wxr') < 0);

console.log('== NADA QUEBRA O QUE JÁ ESTAVA CERTO ==');
ok('anti-tela-branca da 6.0.12 intocado e anterior na fila',
  man[216] === 'navegacao_sem_tela_branca_patch.js' && bundle.indexOf('NAV612_PURE') >= 0);
ok('menu-nfe da barra segue real (regressão)',
  html.indexOf('id="menu-nfe" class="module-menu"') >= 0 && html.indexOf("navigateTo('fiscal-enviar-xml')") >= 0);

console.log('== CARIMBOS v6.0.13 ==');
ok('index.html carimbado (4 pontos)',
  html.indexOf("DIGICOPY_APP_VERSION = '6.1.1'") >= 0 && html.indexOf('>v6.1.1<') >= 0 && html.indexOf('app.bundle.js?v=6.1.1') >= 0 && html.indexOf('v6.1.1</title>') >= 0);
ok('mobile carimbado (3 pontos)',
  mob.indexOf("DIGICOPY_APP_VERSION = '6.1.1'") >= 0 && mob.indexOf('>v6.1.1<') >= 0 && mob.indexOf('v6.1.1</title>') >= 0);
ok('package.json cravado', pkg.version === '6.1.1');

console.log('');
console.log('RESUMO: ' + pass + ' passaram, ' + fail + ' falharam.');
process.exit(fail ? 1 : 0);
