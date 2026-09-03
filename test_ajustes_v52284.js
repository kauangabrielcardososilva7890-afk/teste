// ═══════════════════════════════════════════════════════════════════════════
// v5.22.84 — 1) vendas imprimem sem restrição (venda ou OS), salvando ao
//                escolher as vias sem fechar a aba
//            2) caixa de itens (venda, chamados, orçamentos): unitário e
//                desconto nascem vazios, qtd 1, Adicionar só com valor unitário
//            3) produtos: sem "Local" em lugar nenhum (nem dados antigos) e
//                ordenação A→Z / Z→A funcionando de verdade
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ ' + name); process.exit(1); } console.log('  ✔ ' + name); }
const ler = f => fs.readFileSync(f, 'utf8');

const relPai = ler('ajustes_relatorio_pai_patch.js');
const vos = ler('vendas_os_patch.js');
const p52239 = ler('ajustes_v52239_print_escolha_patch.js');
const p5182 = ler('ajustes_v5182_patch.js');
const p5186 = ler('ajustes_v5186_patch.js');
const o37 = ler('ajustes_v52237_orcamentos_menu_patch.js');
const o58 = ler('ajustes_v52258_orcamento_os_revalidar_patch.js');
const o59 = ler('ajustes_v52259_orcamento_filtros_item_patch.js');
const o60 = ler('ajustes_v52260_orcamento_trava_venda_atalho_patch.js');
const fluxos = ler('fluxos_operacionais_patch.js');
const ord = ler('ajustes_v52214_ordenacao_patch.js');
const imp = ler('ajustes_v52221_import_produtos_patch.js');
const manifest = JSON.parse(ler('bundle-manifest.json'));
const pkg = JSON.parse(ler('package.json'));

console.log('== 1. IMPRESSÃO DE VENDAS SEM RESTRIÇÃO ==');
ok('trava "Fature a notinha antes de imprimir" removida', !/toast\('Fature a notinha/.test(relPai));
ok('relatorio_pai não bloqueia mais imprimirNotinha por status', !/imprimirNotinha=function|\!window\.imprimirNotinha/.test(relPai) && !/status\)\)\)\{ ?toast\('Fature/.test(relPai));
ok('imprimirNotinha base não exige status', !/faturado.*antes de imprimir/.test(vos));
ok('escolher vias salva antes de imprimir (silencioso)', /vosGravarVenda\(true\)/.test(p52239));
ok('o salvar da impressão não fecha a aba (sem closeModal)', !/vosAbrirImpressaoESalvar[\s\S]*?closeModal/.test(p52239.replace(/\/\/[^\n]*/g,'')));
ok('escolha de 1 ou 2 vias continua', /Quantas vias\?/.test(p52239) && /'2 vias'/.test(p52239));
ok('formato Ordem de serviço continua disponível', /Ordem de serviço/.test(p52239));
ok('trava de edição de venda faturada continua intacta', /Venda faturada: estorne para alterar/.test(relPai));

console.log('== 2. CAIXA DE ITENS (venda, chamados, orçamentos) ==');
// Venda (vos)
ok('venda: botão Adicionar lê o campo unitário', /vosAtualizarBotaoItem[\s\S]{0,200}getElementById\('vos-item-vunit'\)/.test(vos));
ok('venda: botão não depende mais da quantidade', !/vosAtualizarBotaoItem[\s\S]{0,160}getElementById\('vos-item-qtd'\)/.test(vos.replace(/const el=document\.getElementById\('vos-item-vunit'\)/,'')));
ok('venda: unitário e desconto nascem vazios', /id="vos-item-vunit" type="number" step="0\.01" value=""/.test(vos) && /id="vos-item-desc" type="number" step="0\.01" value=""/.test(vos));
ok('venda: quantidade continua padrão 1', /id="vos-item-qtd" type="number" min="1" value="1"/.test(vos));
ok('venda: escolher produto preenche o preço cadastrado', /vos-item-vunit'\)\.value = \(p\.preco/.test(vos));
ok('venda: trava de segurança na hora de adicionar', /Informe um valor unitário numérico para adicionar o item/.test(vos));
// Chamados (v5182 + v5186)
ok('chamados: desconto nasce vazio nas duas telas', !/prod-desc" type="number" step="0\.01" value="0"/.test(p5182) && !/prod-desc" type="number" step="0\.01" value="0"/.test(p5186));
ok('chamados: botão tem id e começa desligado', /id="\$\{prefix\}-btn-add" disabled/.test(p5182) && /id="\$\{prefix\}-btn-add" disabled/.test(p5186));
ok('chamados: lcPecaCalc liga/desliga o botão pelo unitário', /prefix\+'-btn-add'\)[\s\S]{0,120}disabled=!\^\\d/.test(p5182) || /btn\.disabled=!\/\^\\d\+\(\?:\[\.,\]\\d\+\)\?\$\//.test(p5182));
ok('chamados: trava de segurança ao adicionar', /Informe um valor unitário numérico para adicionar o item/.test(p5182));
ok('chamados: depois de adicionar o desconto volta vazio', /-prod-desc'\); if\(d\) d\.value='';/.test(p5182));
ok('chamados: escolher produto continua trazendo o preço', /prod-preco'\); if\(pr\) pr\.value=p\.preco\|\|0;/.test(p5182));
// Orçamentos (v52237 + v52258 + v52259 + v52260)
ok('orçamentos: desconto nasce vazio nas 4 gerações da tela', ![o37,o58,o59,o60].some(s=>/orc-item-desc" type="number" step="0\.01" value="0"/.test(s)));
ok('orçamentos: botão tem id e começa desligado nas 4 telas', [o37,o58,o59,o60].every(s=>/id="orc-btn-add" disabled/.test(s)));
ok('orçamentos: orcCalcItem liga/desliga pelo unitário', /orc-btn-add'?\)[\s\S]{0,200}disabled=!\/\^\\d/.test(o37) || /btn\.disabled=!\/\^\\d\+\(\?:\[\.,\]\\d\+\)\?\$\//.test(o37));
ok('orçamentos: trava de segurança ao adicionar', /Informe um valor unitário numérico para adicionar o item/.test(o37) && /Informe um valor unitário numérico para adicionar o item/.test(o59));
ok('orçamentos: depois de adicionar o desconto volta vazio', /orc-item-desc'\); if\(di\) di\.value = ''/.test(o59) && /orc-item-desc'\)\.value='';/.test(o37));
ok('orçamentos: escolher produto continua trazendo o preço', /orc-item-vunit'\)\.value=p\.preco\|\|0;/.test(o37));
ok('orçamentos: quantidade continua padrão 1', /orc-item-qtd'\)\.value ?\|\| ?1/.test(o59) || /orc-item-qtd'\)\.value=1;/.test(o37));
ok('etiqueta: fluxo de recarga continua preenchendo sozinho', /vos-item-vunit'\);[ ]*if\(vu\) vu\.value = rec\.valor/.test(ler('vendas_notinhas_fix_patch.js').replace(/\s+/g,' ')) || /vu\) vu\.value = rec\.valor/.test(ler('vendas_notinhas_fix_patch.js')));

console.log('== 3. PRODUTOS SEM "LOCAL" + ORDENAÇÃO ==');
ok('listagem sem a coluna Local', !/thSortDir?\('produtosSortOperacional', 'local'/.test(fluxos) && !/'Local', STATE\.prod\.sort/.test(fluxos));
ok('linha do produto sem o campo local', !/p\.local \|\| '-'/.test(fluxos));
ok('busca não usa mais local', !/p\.fabricante, p\.local/.test(fluxos));
ok('ordenadores sem local', !/local: p => p\.local/.test(fluxos));
ok('cadastro novo não nasce com local', !/preco: 0, local: ''/.test(fluxos));
ok('salvar produto não grava local', !/preco: toNumber\([\s\S]{0,80}local: '',/.test(fluxos));
ok('dados antigos de local são apagados na varredura', /delete p\.local/.test(fluxos) && /hasOwnProperty\.call\(p, 'local'\)/.test(fluxos));
ok('colspan acompanha a remoção da coluna', !/colspan="9"[\s\S]{0,80}produto/i.test(fluxos));
ok('importação não traz mais local', !/local: txt\(row/.test(imp));
ok('estado guarda coluna E sentido', /prod: \{ q: '', cat: '', baixo: false, todos: false, sort: 'codigo', dir: 'asc' \}/.test(fluxos));
ok('clicar na mesma coluna troca o sentido', /STATE\.prod\.dir = STATE\.prod\.dir === 'asc' \? 'desc' : 'asc'/.test(fluxos));
ok('coluna nova começa A→Z', /STATE\.prod\.sort = col; STATE\.prod\.dir = 'asc'/.test(fluxos));
ok('Z→A ordena a lista inteira antes de fatiar', /STATE\.prod\.dir === 'desc'[\s\S]{0,120}compareSmart\(prodGetter\(b\), prodGetter\(a\)\)/.test(fluxos));
ok('seta mostra os dois sentidos', /dir === 'desc' \? ' ▼' : ' ▲'/.test(fluxos));
ok('a trava velha de ordenação saiu do v52214', !/wrapSort\('produtosSortOperacional'/.test(ord));
ok('a função pura do v52214 continua', /ORDENACAO_TITULO_PURE/.test(ord) && /proximaDir/.test(ord));

console.log('== 4. CONSISTÊNCIA ==');
ok('nenhum arquivo novo no bundle (um arquivo por módulo)', manifest.length === 190);
ok('versão 5.22.x', /^5\.22\./.test(pkg.version));

console.log('\nRESULTADO: ajustes v5.22.84 passaram!');
