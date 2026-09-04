// Teste consolidado v5.22.89 — abrir orçamento à prova de bala + carimbo de
// origem nos avisos com "encontrad" + autocura de id em orçamento legado.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
function le(f){ return fs.readFileSync(f, 'utf8'); }

console.log('== v5.22.89 — abrir orçamento pela lista nunca mais cai no vazio ==');
const v237 = le('ajustes_v52237_orcamentos_menu_patch.js');

// A função antiga com toast vago morreu
const iAb = v237.indexOf('window.abrirOrcamento=function');
const iAbFim = v237.indexOf('window.abrirTelaOrcamento=function', iAb + 10);
const bloco = v237.slice(iAb, iAbFim);
ok(bloco.indexOf("toast('Orçamento não encontrado'") < 0, "o toast vago 'Orçamento não encontrado' não existe mais");
ok(bloco.indexOf('idStr.replace(/\\D/g') >= 0, 'procura também por número normalizado (só dígitos)');
ok(bloco.indexOf('window.neoOrcSel') >= 0, 'tenta pelo último selecionado da lista (linha velha de nuvem)');
ok(bloco.indexOf("orc_legado_") >= 0, 'autocura: orçamento sem id ganha id na hora de abrir');
ok(bloco.indexOf('renderOrcamentos') >= 0, 'em falha total, atualiza a lista sozinho');
ok(bloco.indexOf('Não achei esse orçamento neste PC agora') >= 0, 'aviso central claro (texto novo, não o antigo)');

console.log('== v5.22.89 — carimbo de origem nos avisos com "encontrad" ==');
const v289 = le('ajustes_v52289_orcamento_carimbo_autocura_patch.js');
ok(v289.indexOf('código:') >= 0 && v289.indexOf('mande ao suporte') >= 0, 'carimbo anexa código de origem ao aviso');
ok(v289.indexOf('interessa: function(msg){ return /encontrad/i.test') >= 0, 'carimbo só age em avisos com "encontrad"');
ok(v289.indexOf('window.lfbAlert.__v52289') >= 0, 'lfbAlert (popup central) carimbado');
ok(v289.indexOf('window.toast.__v52289') >= 0, 'toast carimbado');
ok(v289.indexOf('garantirIdsOrcamentos') >= 0, 'listagem garante id em orçamentos antigos');
ok(v289.indexOf('renderOrcamentos.__v52289ids') >= 0, 'renderOrcamentos envolvido com a autocura');

console.log('== v5.22.89 — comportamento puro do carimbo ==');
const PURE = /interessa: function\(msg\)\{ return \/encontrad\/i\.test\(String\(msg == null \? '' : msg\)\); \}/.test(v289);
ok(PURE, 'PURE.interessa definido');
const interessa = (msg)=>/encontrad/i.test(String(msg == null ? '' : msg));
ok(interessa('Orçamento não encontrado') && interessa('Nenhum cliente encontrado') && !interessa('Orçamento salvo'), 'carimbo dispara só na família "encontrad*"');

// o novo patch entrou no manifest do bundle
const man = JSON.parse(le('bundle-manifest.json'));
ok(man.indexOf('ajustes_v52289_orcamento_carimbo_autocura_patch.js') >= 0, 'novo patch dentro do bundle-manifest.json');
ok(man.indexOf('ajustes_v52289_orcamento_carimbo_autocura_patch.js') > man.indexOf('ajustes_v52265_script_isolado_patch.js'), 'carrega depois dos patches de orçamento (ordem segura)');

console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo v5.22.89!');
process.exit(falhas ? 1 : 0);
