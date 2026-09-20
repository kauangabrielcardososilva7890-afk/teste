// Teste consolidado v5.22.88 — escolha de impressora dos chamados em lista
// sempre aberta com filtro enquanto digita + produto sem valor com caixa vazia.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
function le(f){ return fs.readFileSync(f, 'utf8'); }

console.log('== v5.22.88 — impressora do chamado em lista (contrato + avulso) ==');

// ── Contrato (ajustes_v5175_patch.js) ──
const v175 = le('ajustes_v5175_patch.js');

// 1. Filtro enquanto digita (no HTML e com listener real)
ok(v175.indexOf('oninput="lcBuscarImpressoraChamado()"') >= 0, 'campo de busca da impressora filtra enquanto digita (oninput)');
ok(v175.indexOf("qi.addEventListener('input', function(){ lcBuscarImpressoraChamado(); })") >= 0, 'listener real de input amarrado na busca (v52288)');
ok(v175.indexOf("cs.addEventListener('change', function(){ lcBuscarImpressoraChamado(); })") >= 0, 'trocar o campo da busca também refiltra');

// 2. v5.22.90 (pedido do usuário): ao escolher, a lista RECOLHE e fica só a
//    escolhida + lápis (modelo das leituras); o lápis reabre a lista de verdade
const iEscolher = v175.indexOf('window.lcEscolherImpressoraChamado=function');
const iEditar = v175.indexOf('window.lcEditarImpressoraChamado=function');
const blocoEscolher = v175.slice(iEscolher, iEditar);
ok(blocoEscolher.indexOf("list.classList.add('hidden')") >= 0, 'escolher a impressora recolhe a lista (v5.22.90)');
ok(blocoEscolher.indexOf("selBox.classList.remove('hidden')") >= 0, 'escolher mostra a linha da impressora escolhida');
ok(v175.indexOf('lcEditarImpressoraChamado()\"') >= 0 || v175.indexOf('lcEditarImpressoraChamado()"') >= 0, 'linha da escolhida tem o lápis que reabre a lista');
ok(blocoEscolher.indexOf('lcMarcarImpressoraNaLista(equipId)') >= 0, 'existe marcador da escolhida dentro da lista');

// 3. O bug do lápis sumiu: a busca não re-esconde a lista ao final
const iBuscar = v175.indexOf('window.lcBuscarImpressoraChamado=function');
const iSetModal = v175.indexOf('function setModalSize');
const blocoBuscar = v175.slice(iBuscar, iSetModal);
ok(blocoBuscar.indexOf('lcEscolherImpressoraChamado(cur)') < 0, 'buscar não chama mais escolher(cur) (era o que re-escondia a lista)');
ok(blocoBuscar.indexOf("listaEl.classList.remove('hidden')") >= 0, 'buscar garante a lista visível');
ok(blocoBuscar.indexOf('lcMarcarImpressoraNaLista(cur)') >= 0, 'buscar re-marca a escolhida na lista filtrada');

// 4. v5.22.90: lápis volta a funcionar de verdade (reabre e FICA aberta)
const iLp = v175.indexOf('window.lcEditarImpressoraChamado=function');
const trechoLapis = v175.slice(iLp, iLp + 400);
ok(trechoLapis.indexOf("classList.remove('hidden')") >= 0, 'lápis reabre a lista');
ok(trechoLapis.indexOf('q.focus()') >= 0, 'lápis já joga o cursor na busca');
ok(v175.indexOf('Digite para filtrar; ao tocar') >= 0, 'novo aviso visual de recolhimento');

// ── Avulso (chamados_avulsos_aberto_patch.js) ──
const cav = le('chamados_avulsos_aberto_patch.js');
ok(cav.indexOf('id="ca-busca-impressora"') >= 0, 'avulso ganhou campo de busca de impressora');
ok(cav.indexOf('id="ca-impressoras-result"') >= 0, 'avulso ganhou a lista de impressoras');
ok(cav.indexOf('id="ca-impressora-selecionada"') >= 0, 'avulso mostra a impressora escolhida');
ok(cav.indexOf('oninput="buscarImpressorasChamadoAvulso()"') >= 0, 'busca de impressora do avulso filtra enquanto digita');
ok(cav.indexOf("_impQ.addEventListener('input', () => renderImpressorasResultado())") >= 0, 'listener real de input no avulso (v52288)');
ok(cav.indexOf('window.__marcarImpAvulso') >= 0, 'avulso tem marcador da escolhida na lista');

// ── Produto sem valor → caixa unitária VAZIA (0 digitado continua valendo) ──
console.log('== v5.22.88 — produto sem valor: caixa unitária vazia ==');
const venda = le('vendas_os_patch.js');
ok(venda.indexOf("getElementById('vos-item-vunit').value = (p.preco!=null && p.preco!=='' && Number(p.preco)!==0) ? p.preco : ''") >= 0, 'vendas: produto sem valor deixa a caixa vazia');
const v182 = le('ajustes_v5182_patch.js');
ok(v182.indexOf("(p.preco!=null && p.preco!=='' && Number(p.preco)!==0) ? p.preco : ''") >= 0, 'chamados (peças): produto sem valor deixa a caixa vazia');
const v237 = le('ajustes_v52237_orcamentos_menu_patch.js');
ok(v237.indexOf("getElementById('orc-item-vunit').value=(p.preco!=null && p.preco!=='' && Number(p.preco)!==0) ? p.preco : ''") >= 0, 'orçamento (v52237): produto sem valor deixa a caixa vazia');
const v260 = le('ajustes_v52260_orcamento_trava_venda_atalho_patch.js');
ok(v260.indexOf("(p.preco!=null && p.preco!=='' && Number(p.preco)!==0) ? Number(p.preco).toFixed(2) : ''") >= 0, 'orçamento (v52260, fluxo vivo): produto sem valor deixa a caixa vazia');

// Travas antigas continuam aceitando 0 digitado à mão (não pode quebrar)
ok(venda.indexOf("/^\\d+(?:[.,]\\d+)?$/") >= 0, 'trava de item da venda continua aceitando número (0 incluso)');
ok(v182.indexOf("/^\\d+(?:[.,]\\d+)?$/") >= 0, 'trava de peça do chamado continua aceitando número (0 incluso)');

console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo v5.22.88!');
process.exit(falhas ? 1 : 0);
