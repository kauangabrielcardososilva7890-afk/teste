const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const cham=fs.readFileSync('locacao_chamados_fix_patch.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const menus=fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.81 ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));

// Quem recolocava o botão era montarMenuLocacao, que roda a cada navegação.
const menuLoc=cham.slice(cham.indexOf('function montarMenuLocacao'),cham.indexOf('const _nav'));
ok('Chamados saiu do menu Locação',!/Chamados<\/button>|ph-wrench/.test(menuLoc));
ok('Locação continua com Contratos e Impressoras',/navigateTo\(\\'contratos\\'\)/.test(menuLoc)&&/navigateTo\(\\'impressoras\\'\)/.test(menuLoc));
ok('a tela de chamados continua existindo',/abrirHistoricoChamadosGeral = function/.test(cham));
ok('Atendimento continua abrindo chamado',/window.openQuickOS = function/.test(cham));
ok('e não voltou nos outros menus',!/label:'Chamados'/.test(app)&&!/id:'recargas'/.test(menus));
console.log('\nRESULTADO: ajustes v5.22.81 passaram!');
