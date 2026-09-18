// test_ajustes_v6007.js — v6.0.7: INÍCIO SEM UNDEFINED + ITENS CLICÁVEIS
// Foto dele 18/09: "Silva e Freitas • undefined", "undefined • undefined PB",
// leitura com título "undefined" + pedido: itens clicáveis abrindo a origem.
const fs = require('fs');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('dashboard_inicio_clicavel_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./dashboard_inicio_clicavel_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 213; menus fiscais separados v6.0.8 fecha a fila',
  man.length === 214 && man[212] === 'menus_fiscais_separados_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[211] === 'dashboard_inicio_clicavel_patch.js' && man[210] === 'fiscal_menu_completo_patch.js' && man[209] === 'permissoes_estorno_venda_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (PURE + banner)',
  bundle.indexOf('DHC607_PURE_START') >= 0 && bundle.indexOf('v6.0.7 — INÍCIO SEM UNDEFINED + CLICÁVEL') >= 0);

console.log('== ANTI-UNDEFINED (raiz da foto) ==');
const clis = [{ id: 5, nome: 'Silva e Freitas Sociedade de Advogados' }, { id: 8, nome: 'Cliente BalcÃO' }];
const eqs = [{ id: '9', modelo: 'HP LaserJet 4020', clienteId: 5 }, { id: 21, modelo: 'Kyocera MA2100', clienteId: 999 }];

ok('junta partes pulando vazios (nunca "a • • b" nem pendurado)',
  P.dhcJunta(['Silva', undefined, '', null, 'NORMAL']) === 'Silva • NORMAL' && P.dhcJunta([undefined]) === '');
ok('escape HTML (&, <, >, aspas)',
  P.dhcEsc('<b>&"x"') === '&lt;b&gt;&amp;&quot;x&quot;' && P.dhcEsc(null) === '');
ok('cliente por id FROUXO (texto acha número — raiz provável do undefined da foto)',
  P.dhcNomeCliente(clis, '5') === 'Silva e Freitas Sociedade de Advogados' && P.dhcNomeCliente(clis, 5) === 'Silva e Freitas Sociedade de Advogados');
ok('cliente inexistente vira "" (cai nas alternativas honestas)',
  P.dhcNomeCliente(clis, 777) === '' && P.dhcNomeCliente(null, 5) === '' && P.dhcNomeCliente(clis, undefined) === '');

const osSem = P.dhcLinhaOs(clis, { id: 'o1', numero: 'OS-0012', clienteId: 5, tipo: undefined, descricao: '', criadoPorNome: 'Katia', prioridade: 'NORMAL' });
ok('OS sem tipo/descrição: SEM "• undefined" e SEM "• " pendurado (caso Silva e Freitas da foto)',
  osSem.titulo === 'Silva e Freitas Sociedade de Advogados' && osSem.subtitulo === 'por Katia' && osSem.prioridade === 'NORMAL');
ok('OS: número mantém 4 últimos dígitos; sem número vira "—"',
  P.dhcLinhaOs(clis, { numero: 'OS-0008' }).numero === '0008' && P.dhcLinhaOs([], {}).numero === '—');
const osRem = P.dhcLinhaOs(clis, { id: 'o2', numero: '12', clienteId: 999, tipo: 'TROCA', criadoPorNome: 'Katia' });
ok('OS de cliente apagado: "(cliente removido)" + tipo aparece (caso "undefined • undefined" da foto)',
  osRem.titulo === '(cliente removido) • TROCA' && osRem.numero === '12');
ok('OS: prioridade vazia assume "normal"',
  P.dhcLinhaOs(clis, { clienteId: 5 }).prioridade === 'normal');

const ltFoto = P.dhcLinhaLeitura(clis, eqs, { id: 'l1', clienteId: 777, equipamentoId: 9, consumoPB: undefined, criadoPorNome: 'Katia', valorExcedente: 120 });
ok('Leitura da foto (cliente solto MAS equipamento acha o cliente): título resgatado, "consumo não informado", sem undefined',
  ltFoto.titulo === 'Silva e Freitas Sociedade de Advogados' && ltFoto.subtitulo === 'HP LaserJet 4020 • consumo não informado • por Katia' && ltFoto.valor === 120);
const ltTudo = P.dhcLinhaLeitura(clis, eqs, { id: 'l2', clienteId: 999, equipamentoId: 888, criadoPorNome: 'Katia', valorExcedente: 0 });
ok('Leitura órfã total: "(cliente removido)" + "(equipamento removido)" (caso título undefined da foto)',
  ltTudo.titulo === '(cliente removido)' && ltTudo.subtitulo.indexOf('(equipamento removido)') === 0 && ltTudo.valor === 0);
const ltOk2 = P.dhcLinhaLeitura(clis, eqs, { id: 'l3', clienteId: '5', equipamentoId: '9', consumoPB: 321, criadoPorNome: 'Katia', valorExcedente: 650 });
ok('Leitura completa: modelo • 321 PB • por Katia + valor 650 (tarja âmbar)',
  ltOk2.subtitulo === 'HP LaserJet 4020 • 321 PB • por Katia' && ltOk2.valor === 650);
ok('Leitura: valorExcedente lixo vira 0 (cai na tarja "Franquia")',
  P.dhcLinhaLeitura(clis, eqs, { clienteId: 5, valorExcedente: 'abc' }).valor === 0);

console.log('== CLICÁVEL → ORIGEM (pedido: "faz essas informações ser clicadas") ==');
ok('exporta dhcAbrirOrigem global', src.indexOf('window.dhcAbrirOrigem=') >= 0);
ok('clique por DELEGAÇÃO (data-dhc/data-id; sem onclick inline quebrável)',
  src.indexOf("addEventListener('click'") >= 0 && src.indexOf("closest('.dhc-item')") >= 0 && src.indexOf('data-dhc="os"') >= 0 && src.indexOf('data-dhc="leitura"') >= 0);
ok('chamado abre a ORIGEM: navigateTo manutencao + openModal os',
  src.indexOf("navigateTo('manutencao')") >= 0 && src.indexOf("openModal('os',id)") >= 0);
ok('leitura abre a ORIGEM: navigateTo leituras + openModal leitura',
  src.indexOf("navigateTo('leituras')") >= 0 && src.indexOf("openModal('leitura',id)") >= 0);
ok('affordance: cursor de mão + seta no hover + dica "Abrir a origem"',
  src.indexOf('cursor:pointer') >= 0 && src.indexOf('dhc-seta') >= 0 && src.indexOf('Abrir a origem') >= 0);

console.log('== BLINDAGEM / INTEGRAÇÃO ==');
ok('abraça renderDashboard mesmo se ele explodir (try/catch + redesenho garantido)',
  src.indexOf('window.renderDashboard=embr') >= 0 && src.indexOf('renderDashboard tropeçou') >= 0);
ok('redesenha as DUAS listas por id (as da foto)',
  src.indexOf("getElementById('list-chamados-recentes')") >= 0 && src.indexOf("getElementById('list-leituras-pendentes')") >= 0);
ok('fora do Início não gasta nada (view-dashboard oculta = return)',
  src.indexOf("getElementById('view-dashboard')") >= 0 && src.indexOf('offsetParent===null') >= 0);
ok('mantém estados vazios originais (🎉 / Sem chamados)',
  src.indexOf('Nenhuma pendência 🎉') >= 0 && src.indexOf('Sem chamados') >= 0);
ok('exporta PURE p/ testes e guarda anti-duplo (__v6007dhc)',
  src.indexOf('DHC607_PURE') >= 0 && src.indexOf('__v6007dhc') >= 0);

console.log('== CARIMBO 6.0.9 ==');
ok('package.json na 6.0.9', pkg.version === '6.0.9');
ok('index.html carimbado (versão real + rodapé + query)',
  html.indexOf("DIGICOPY_APP_VERSION = '6.0.9'") >= 0 && html.indexOf('>v6.0.9<') >= 0 && html.indexOf('app.bundle.js?v=6.0.9') >= 0);
ok('celular carimbado 6.0.9', mob.indexOf("DIGICOPY_APP_VERSION = '6.0.9'") >= 0 && mob.indexOf('>v6.0.9<') >= 0);

console.log('');
console.log(pass + ' passaram, ' + fail + ' falharam');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.7: Início sem nenhum "undefined" e cada item clicável abrindo a origem (OS na Manutenção, leitura na tela de Leituras).');
