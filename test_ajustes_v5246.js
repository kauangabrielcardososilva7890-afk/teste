// Teste v5.24.34 — rodada com as 3 fotos dele:
//  2.1) o "Nova venda" vivo era o atalho do MENU LATERAL (Atendimento):
//       removido do padrão; config salva em ordem antiga é ignorada sozinha
//       (aplicarNomesSalvos só trabalha em cima do padrão).
//  4.1/4.2) O formulário de ORÇAMENTO usava o placeholder "Digite para buscar"
//       — o guardião da VOS escuta esse texto, não acha __vosForm lá dentro e
//       travava TUDO com "Cliente Não Selecionado", mesmo com cliente escolhido.
//       Placeholder trocado: orçamento busca produto em paz de novo.
//  5.x) Excluir com popup PRÓPRIO do sistema (confirmSistema — nunca o cinza
//       do navegador), aviso de intenção ao motor da nuvem (o puxão que
//       "ressuscitava" o apagado agora é desfeito sozinho em 60s) e id
//       tolerante a string/número.
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }

const menus   = fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js', 'utf8');
const orc60   = fs.readFileSync('ajustes_v52260_orcamento_trava_venda_atalho_patch.js', 'utf8');
const orc58   = fs.readFileSync('ajustes_v52258_orcamento_os_revalidar_patch.js', 'utf8');
const orc59   = fs.readFileSync('ajustes_v52259_orcamento_filtros_item_patch.js', 'utf8');
const patch   = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const worker  = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle  = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg       = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- 2.1: "Nova venda" fora do menu lateral --');
ok(menus.indexOf("{id:'nova-venda'") < 0, 'item nova-venda removido do menu Atendimento padrão');
ok(menus.indexOf("{id:'notinhas'") >= 0 && menus.indexOf("{id:'nova-notinha'") >= 0, 'Consultar notinhas e atalho Nova notinha (Início) preservados');
ok(bundle.indexOf("id:'nova-venda'") < 0 && bundleM.indexOf("id:'nova-venda'") < 0, 'remoção refletida nos 2 bundles');

console.log('-- 4.1/4.2: orçamento livre do guardião da VOS --');
ok(orc60.indexOf('Digite para buscar') < 0 && orc58.indexOf('Digite para buscar') < 0 && orc59.indexOf('Digite para buscar') < 0, 'placeholder-armadilha aposentado nas 3 camadas do orçamento');
ok(orc60.indexOf('Buscar produto ou escrever a descrição') >= 0, 'novo placeholder do orçamento no lugar');

console.log('-- 5.x: exclusão com popup próprio e à prova de nuvem --');
ok(patch.indexOf("window.confirmSistema(pergunta,'Excluir de vez')") >= 0, 'confirmação vem do popup do sistema (ask pedido dele)');
ok(patch.indexOf('DIGICOPY_EXCLUSAO_INTENCIONAL') >= 0, 'motor da nuvem é avisado: desfaz o "ressuscitou" em até 60s');
ok(patch.indexOf("tick('ficha-exclui')") >= 0, 'apagou = empurra o delete para a nuvem na hora');
ok(patch.indexOf('String(x.id)===String(id)') >= 0, 'id tolerante a string/número na remoção');
ok((patch.match(/String\(x\.id\)===String\(id\)/g) || []).length >= 7, 'tolerância aplicada em todas as coleções');
ok(patch.indexOf("window.confirmSistema('Estornar '") >= 0, 'Estornar também usa o popup do sistema');

console.log('-- integridade: bundles e versões --');
const vW = (worker.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').indexOf('Worker ' + vW) >= 0, 'worker carimbado (v' + vW + ') e motor colado na mesma versão');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf("confirmSistema(pergunta,'Excluir de vez')") >= 0, 'exclusão nova presente no bundle');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0 && indexHtml.indexOf('app.bundle.js?v=' + pkg.version) >= 0, 'index.html na v' + pkg.version);
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0, 'mobile/www/index.html na v' + pkg.version);
ok(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json com versão válida (v' + pkg.version + ')');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v' + pkg.version); process.exit(1); }
console.log('\nTudo certo v' + pkg.version + '!');
