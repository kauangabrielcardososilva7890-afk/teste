// test_ajustes_v60012.js — v6.0.12: MATA A TELA BRANCA. Relato dele: clicou
// no menu (e no Buscador Escola) → tudo branco, não carrega. Causa raiz lida
// no código: navigateTo esconde TODAS as .view ANTES de procurar o destino E
// as views sob demanda (Buscador Escola + fiscais) nascem via ensureView COM
// "hidden" — na 1ª navegação o destino não existia quando o núcleo mostrou,
// e ninguém des-escondia depois do render. Fix: wrap (core intocado).
const fs = require('fs');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('navegacao_sem_tela_branca_patch.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./navegacao_sem_tela_branca_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 217; anti-tela-branca fecha a fila (é o último, wrap por cima de todos)',
  man.length === 224 && man[216] === 'navegacao_sem_tela_branca_patch.js' && man[215] === 'submenu_hover_nfe_patch.js');
ok('bundle contém o patch (guard + PURE)',
  bundle.indexOf('__v60012nav') >= 0 && bundle.indexOf('NAV612_PURE') >= 0);

console.log('== CAUSA RAIZ DOCUMENTADA (o bug existe no núcleo, a cura no patch) ==');
ok('núcleo esconde TODAS as .view ANTES de procurar o destino (a armadilha)',
  app.indexOf("querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))") >= 0 &&
  app.indexOf("querySelectorAll('.view').forEach") < app.indexOf("getElementById('view-'+view)"));
ok('ensureView do núcleo cria a view COM "hidden" (nasce invisível)',
  app.indexOf("className='view hidden space-y-4'") >= 0);
ok('views afetadas confirmadas: nem buscador-escola nem as 6 fiscais existem no HTML',
  ['view-buscador-escola', 'view-central-nf', 'view-fiscal-perfil', 'view-fiscal-manifestacao', 'view-fiscal-ncm', 'view-fiscal-enviar-xml', 'view-config-fiscal'].every(v => html.indexOf('id="' + v + '"') < 0));
ok('o patch NÃO tocou o miolo: navigateTo/ensureView do app.js seguem originais',
  app.indexOf('__v60012nav') < 0 && app.indexOf('NAV612_PURE') < 0);

console.log('== O WRAP (ordem certa) ==');
ok('garante o destino ANTES de chamar o navigateTo original',
  src.indexOf("G.ensureView === 'function'") >= 0 && src.indexOf("G.ensureView === 'function'") < src.indexOf('anterior.apply'));
ok('des-esconde DEPOIS do render (nunca mais branco)',
  src.indexOf("classList.remove('hidden')") > src.indexOf('anterior.apply'));
ok('anti-duplo-wrap (recarregar patch não empilha embrulhos)',
  src.indexOf('anterior.__nav612') >= 0 && src.indexOf('__nav612 = true') >= 0);
ok('documenta as views sob demanda (buscador + fiscal) pra manutenção',
  ['buscador-escola', 'central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'].every(v => src.indexOf("'" + v + "'") >= 0));

console.log('== TELA HONESTA EM VEZ DE BRANCO (PURE) ==');
const av = P.avisoVazio('fiscal-perfil', 'Tela sem conteúdo');
ok('avisoVazio monta tela completa com nome da view e botão Voltar ao Início',
  av.indexOf('fiscal-perfil') >= 0 && av.indexOf("navigateTo('dashboard')") >= 0 && av.indexOf('Voltar ao Início') >= 0 && av.indexOf('neo-panel') >= 0);
ok('aviso de verdade: diz que o botão funcionou, que nada foi apagado e pede pra avisar',
  P.avisoVazio('x', 'y').indexOf('Nada foi apagado') >= 0);

console.log('== O LUGAR DOS MENUS SEGUE O QUE ELE PEDIU (imagem = módulo NF-e/NFC-e da barra) ==');
ok('menu-nfe da barra continua real com os 6 (regressão da 6.0.11)',
  html.indexOf('id="menu-nfe" class="module-menu"') >= 0 &&
  ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'].every(v => html.indexOf("navigateTo('" + v + "')") >= 0));

console.log('== CARIMBOS v6.0.12 ==');
ok('index.html carimbado (4 pontos)',
  html.indexOf("DIGICOPY_APP_VERSION = '6.1.2'") >= 0 && html.indexOf('>v6.1.2<') >= 0 && html.indexOf('app.bundle.js?v=6.1.2') >= 0 && html.indexOf('v6.1.2</title>') >= 0);
ok('mobile carimbado (3 pontos)',
  mob.indexOf("DIGICOPY_APP_VERSION = '6.1.2'") >= 0 && mob.indexOf('>v6.1.2<') >= 0 && mob.indexOf('v6.1.2</title>') >= 0);
ok('package.json cravado', pkg.version === '6.1.2');

console.log('');
console.log('RESUMO: ' + pass + ' passaram, ' + fail + ' falharam.');
process.exit(fail ? 1 : 0);
