// Teste consolidado v5.22.90 — contador de páginas do chamado volta a contar,
// lista de impressora recolhe na escolha (lápis reabre), orçamento avisa com números.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
function le(f){ return fs.readFileSync(f, 'utf8'); }

// ── 1. Quantidade impressa: UMA função para TODAS as telas de chamado ──
console.log('== v5.22.90 — quantidade impressa do chamado conta de novo ==');
const cr = le('contratos_refino_patch.js');
const iCalc = cr.indexOf('window.calcImpressoesChamado = function(){');
const blocoCalc = cr.slice(iCalc, cr.indexOf('};', iCalc) + 2);
ok(iCalc >= 0, 'a função que vale é a do contratos_refino (mesma posição de antes)');
ok(blocoCalc.indexOf("'ko-cont-ant','ko-cont-atu','ko-qtd-imp'") >= 0, 'atende o chamado de contrato (ko-*)');
ok(blocoCalc.indexOf("'kr-os-cont-ant','kr-os-cont-atu','kr-os-qtd'") >= 0, 'continua atendendo a tela antiga (kr-os-*)');
ok(blocoCalc.indexOf("'o-cont-ant','o-cont-atu','o-qtd-imp'") >= 0, 'atende a tela o-* (sombra antiga coberta)');
ok(blocoCalc.indexOf("'ca-cont-ant','ca-cont-atu','ca-qtd'") >= 0, 'cobra também os ids do avulso (ca-*)');
ok(blocoCalc.indexOf('q.value = atu - ant') >= 0, 'quantidade = atual - anterior');
ok(blocoCalc.indexOf('if(atu < ant) atu = ant') >= 0, 'nunca deixa quantidade negativa');
ok(cr.indexOf("document.addEventListener('input'") >= 0 && cr.indexOf('/-cont-atu$/') >= 0, 'ouvinte garante o cálculo ao digitar em qualquer campo de contador');

// ── 2. Lista de impressora: recolhe na escolha + lápis funciona (contrato) ──
console.log('== v5.22.90 — impressora do chamado de contrato (recolhe + lápis) ==');
const v175 = le('ajustes_v5175_patch.js');
const iEsc = v175.indexOf('window.lcEscolherImpressoraChamado=function');
const iEd = v175.indexOf('window.lcEditarImpressoraChamado=function');
const blocoEsc = v175.slice(iEsc, iEd);
ok(blocoEsc.indexOf("list.classList.add('hidden')") >= 0, 'ao tocar na impressora, as outras somem (lista recolhe)');
ok(blocoEsc.indexOf('ko-equip-selected') >= 0, 'a impressora escolhida fica na linha visível');
ok(v175.indexOf('Trocar impressora') >= 0, 'lápis de trocar está na linha da escolhida');
const trechoLapis = v175.slice(iEd, iEd + 400);
ok(trechoLapis.indexOf("ko-equip-lista')?.classList.remove('hidden')") >= 0, 'lápis reabre a lista de verdade');
ok(trechoLapis.indexOf('q.focus()') >= 0, 'lápis já foca a busca para trocar rápido');

// ── 3. Idem no avulso ──
console.log('== v5.22.90 — impressora do chamado avulso (recolhe + lápis) ==');
const cav = le('chamados_avulsos_aberto_patch.js');
const iSel = cav.indexOf('window.selecionarImpressoraChamadoAvulso = function(equipId)');
const blocoSel = cav.slice(iSel, cav.indexOf('window.fecharModalChamadoAvulso', iSel));
ok(blocoSel.indexOf("ca-impressoras-result'); if(_res) _res.classList.add('hidden')") >= 0, 'escolher no avulso recolhe a lista');
ok(blocoSel.indexOf('caEditarImpressoraAvulso()') >= 0, 'avulso mostra o lápis na escolhida');
ok(cav.indexOf('window.caEditarImpressoraAvulso = function()') >= 0, 'existe a função do lápis do avulso');
const lapAv = cav.slice(cav.indexOf('window.caEditarImpressoraAvulso = function()'));
ok(lapAv.indexOf("res.classList.remove('hidden')") >= 0, 'lápis do avulso reabre a lista');
ok(lapAv.indexOf('renderImpressorasResultado()') >= 0, 'lápis do avulso re-renderiza a lista');
ok(cav.indexOf('ao escolher, a lista fecha') >= 0, 'rótulo do avulso avisa o novo comportamento');
const iSelX = cav.indexOf("// Selecionar impressora");
ok(cav.indexOf("if(_resX) _resX.classList.add('hidden')") >= 0, 'edição de chamado já com impressora também abre recolhida');

// ── 4. Orçamento: aviso de "não achei" agora traz números de diagnóstico ──
console.log('== v5.22.90 — orçamento avisa COM números para o suporte ==');
const v237 = le('ajustes_v52237_orcamentos_menu_patch.js');
ok(v237.indexOf('Diagnóstico: o banco deste PC tem') >= 0, 'aviso informa quantos orçamentos o PC tem');
ok(v237.indexOf('o código clicado foi') >= 0, 'aviso informa o código clicado');
ok(v237.indexOf("slice(0,24)") >= 0, 'código clicado é curto e limpo no aviso');

// ── 5. Nada do que já funcionava quebrou ──
console.log('== v5.22.90 — regressões ==');
const v289 = le('ajustes_v52289_orcamento_carimbo_autocura_patch.js');
ok(v289.indexOf("orc_legado_") >= 0 || v237.indexOf("orc_legado_") >= 0, 'autocura de orçamento legado continua');
const flx = le('fluxos_operacionais_patch.js');
ok(flx.indexOf("quantidadeImpressos: toNumber(document.getElementById('ko-qtd-imp')") >= 0, 'salvar do chamado continua lendo ko-qtd-imp (agora preenchido)');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.90!');
