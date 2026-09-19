// test_ajustes_v60011.js — v6.0.11: NF-e/NFC-e vira UM item; os 6 submenus
// aparecem quando o mouse passa por cima (igual ao sistema antigo; correção
// dele: "os submenu vc fez errado").
const fs = require('fs');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('submenu_hover_nfe_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./submenu_hover_nfe_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 216; hover NF-e/NFC-e fecha a fila',
  man.length === 221 && man[215] === 'submenu_hover_nfe_patch.js' && man[214] === 'seis_submenus_velho_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js');
ok('bundle contém o patch (guard + PURE + banner)',
  bundle.indexOf('__v60011sxvm') >= 0 && bundle.indexOf('SXVM_PURE_START') >= 0 && bundle.indexOf('SUBMENU_HOVER_NFE_PATCH v6.0.11 ativo') >= 0);

console.log('== RIBBON: O MÓDULO NF-e/NFC-e DO index.html É REAL AGORA ==');
ok('menu-nfe existe nos arquivos base com hover .module-menu (mecanismo nativo da barra)',
  html.indexOf('id="menu-nfe" class="module-menu"') >= 0 && html.indexOf('.module:hover .module-menu') >= 0);
ok('os 3 itens FALSOS ("Em breve…") sumiram do index.html',
  html.indexOf('Em breve: emissão de nota fiscal') < 0 && html.indexOf('Módulo fiscal em preparação') < 0);
ok('os 6 submenus apontam pras views certas (hover → navega)',
  ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'].every(v => html.indexOf("navigateTo('" + v + "')") >= 0));
ok('(supersede v6.1.1) a aba oficial agora é **Fiscal**: clicar ABRE o submenu dos 6 pinado; a Central abre pelo item Nota Fiscal',
  /<div class="module"><button onclick="navigateTo\('central-nf'\)"><i class="ph ph-file-text"><\/i>Fiscal<\/button><div id="menu-nfe"/.test(html));

console.log('== OS 6 DO PRINT (PURE) ==');
const it = P.sxvmItens();
ok('6 itens, ordem exata da foto',
  it.length === 6 && it.map(m => m.rot).join(' · ') === 'Nota Fiscal · Perfil Tributário · Manifestação · NCM · Enviar XML · Configurações');
ok('cada item tem view + ícone compatível com o padrão da barra',
  it.every(m => m.view && m.icon && m.icon.indexOf('ph-') === 0));

console.log('== BOTÕES SOLTOS SOMEM DOS DOIS LUGARES (sem matar telas) ==');
ok('nav lateral: os 6 fiscais + os 3 atalhos da 6.0.9 ficam escondidos (display:none)',
  src.indexOf("nb.style.display = 'none'") >= 0 && src.indexOf('fiscal-historico') >= 0 && src.indexOf('fiscal-ferramentas') >= 0 && src.indexOf('fiscal-inutilizar') >= 0);
ok('barra clássica: os topmods fiscais soltos também ficam escondidos',
  src.indexOf("getElementById('topmod-' + v)") >= 0 && src.indexOf("tm.style.display = 'none'") >= 0);
ok('PÁI instalado na lateral no lugar do "Nota Fiscal" (caret à direita, padrão visual da nav)',
  src.indexOf("id = 'sxvm-nav-pai'") >= 0 && src.indexOf('ph-caret-right') >= 0 && src.indexOf('NF-e/NFC-e') >= 0);

console.log('== FLYOUT NA LATERAL (espelho do .module-menu) ==');
ok('flyout branco à direita do botão, posicionado por getBoundingClientRect (não corta em scroll)',
  src.indexOf('sxvm-flyout-nav') >= 0 && src.indexOf('getBoundingClientRect') >= 0 && src.indexOf('rc.right + 8') >= 0);
ok('mouse passa por cima abre; mouse sai fecha com carência de 180ms; clique fora fecha; blur fecha',
  src.indexOf('mouseenter') >= 0 && src.indexOf('mouseleave') >= 0 && src.indexOf('180') >= 0 && src.indexOf("addEventListener('blur'") >= 0);
ok('flyout tem título NF-e/NFC-e + os 6 com ícone (mesmo CSS do module-menu)',
  src.indexOf('sxvm-cab') >= 0 && src.indexOf('#sxvm-flyout-nav button') >= 0);
ok('sonda re-aplica tudo (lateral redesenha no login) igual ao padrão das versões anteriores',
  src.indexOf('setInterval') >= 0 && src.indexOf('sxvmTudo') >= 0 && src.indexOf('300') >= 0);

console.log('== CARIMBO 6.0.11 ==');
ok('package.json na 6.0.11', pkg.version === '6.1.1');
ok('index.html carimbado (4 pontos)', html.indexOf("DIGICOPY_APP_VERSION = '6.1.1'") >= 0 && html.indexOf('>v6.1.1<') >= 0 && html.indexOf('app.bundle.js?v=6.1.1') >= 0 && html.indexOf('v6.1.1</title>') >= 0);
ok('celular carimbado 6.0.11', mob.indexOf("DIGICOPY_APP_VERSION = '6.1.1'") >= 0 && mob.indexOf('>v6.1.1<') >= 0);

console.log('');
console.log(pass + ' passaram, ' + fail + ' falharam');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.11: NF-e/NFC-e é UM item; os 6 submenus da foto aparecem no hover, na barra clássica E na lateral, sem botão fiscal solto.');
