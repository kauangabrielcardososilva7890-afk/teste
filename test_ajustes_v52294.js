// Teste v5.22.94 — trocar de impressora troca os dados dela junto (contrato + avulso)
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.94 — lápis: trocar impressora atualiza os dados ==');

const v175 = fs.readFileSync('ajustes_v5175_patch.js', encoding='utf8');
const iEsc = v175.indexOf('window.lcEscolherImpressoraChamado=function');
const bloco = v175.slice(iEsc, iEsc + 2600);
ok(bloco.indexOf("const anteriorId=sel.value||''") >= 0 && bloco.indexOf('const troca=') >= 0, 'detecta que é TROCA (já havia outra impressora)');
ok(bloco.indexOf("preenche('ko-modelo', e.modelo||'', !troca)") >= 0, 'modelo da nova entra na tela na troca');
ok(bloco.indexOf("preenche('ko-serie', e.serie||'', !troca)") >= 0, 'serial da nova entra na tela na troca');
ok(bloco.indexOf("preenche('ko-patr', e.patrimonio||'', !troca)") >= 0, 'patrimônio da nova entra na tela na troca');
ok(bloco.indexOf("preenche('ko-local', pNovo.localInstalacao") >= 0, 'local da nova entra na tela na troca');
ok(bloco.indexOf("preenche('ko-cont-ant', contadorOficial(equipId,false), !troca)") >= 0, 'contador antigo vira o da nova');
ok(bloco.indexOf("const atu=document.getElementById('ko-cont-atu'); if(atu) atu.value='';") >= 0, 'na troca, contador atual limpa para digitar o da nova');
ok(bloco.indexOf("bloco.style.display=temColor(pNovo)?'':'none'") >= 0, 'bloco de color acompanha a impressora nova');
ok(bloco.indexOf("nao se mexe") >= 0 || bloco.indexOf("o texto dela não se mexe") >= 0, 'regra do motivo comentada');
ok(bloco.indexOf("motivo.value||'').trim().toLowerCase()===nomeAntigo.toLowerCase()") >= 0, 'motivo auto (=modelo antigo) vira o da nova');
ok(bloco.indexOf("autoPreencherDadosChamado(equipId, troca===true") >= 0, 'mantém contador atual protegido na troca (autopreencher legado)');
ok(bloco.indexOf("soVazio && String(el.value||'').trim()!==''") >= 0, 'na ABERTURA só preenche o que estiver vazio (não pisa no chamado salvo)');

const cav = fs.readFileSync('chamados_avulsos_aberto_patch.js', encoding='utf8');
const iS = cav.indexOf('window.selecionarImpressoraChamadoAvulso = function(equipId)');
const bA = cav.slice(iS, iS + 2400);
ok(bA.indexOf('_antIdAv') >= 0 && bA.indexOf('_trocaAv') >= 0, 'avulso também detecta a troca');
ok(bA.indexOf("String(_motAv.value || '').trim().toLowerCase() === _nomeAntAv.toLowerCase()") >= 0, 'avulso: motivo auto troca junto');
ok(bA.indexOf("el.value=e.modelo||''") >= 0 && bA.indexOf("el.value=e.patrimonio||''") >= 0, 'avulso: dados da impressora sobrescrevem na troca');

// regressão: a lista continua recolhendo com lápis (v5.22.90)
ok(v175.indexOf("list.classList.add('hidden')") >= 0, 'recolher a lista ao escolher continua');
ok(v175.indexOf('Trocar impressora') >= 0, 'lápis continua na linha da escolhida');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.94!');
