// ═══════════════════════════════════════════════════════════════════════════
// v5.22.85 — Orçamentos:
//   1) estoque: não baixa (regra mantida), mas produto físico sem estoque
//      suficiente NÃO entra — avisa "precisa de no mínimo a quantidade"
//   2) salvar orçamento novo não mostra mais "Orçamento não encontrado" e o
//      orçamento salvo volta a abrir sempre (objeto direto + buscas de reserva)
//   3) fluxo de busca por número de série IGUAL às vendas: puxa a última
//      notinha e preenche modelo/patrimônio/contador/cliente sozinho
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ ' + name); process.exit(1); } console.log('  ✔ ' + name); }
const ler = f => fs.readFileSync(f, 'utf8');

const o37 = ler('ajustes_v52237_orcamentos_menu_patch.js');
const o59 = ler('ajustes_v52259_orcamento_filtros_item_patch.js');
const o60 = ler('ajustes_v52260_orcamento_trava_venda_atalho_patch.js');
const manifest = JSON.parse(ler('bundle-manifest.json'));
const pkg = JSON.parse(ler('package.json'));
const addItem59 = o59.slice(o59.indexOf('window.orcAddItem = function(){'), o59.indexOf('window.orcAddItem = function(){') + 3200);
const save60 = o60.slice(o60.indexOf('window.salvarOrcamentoTela = function(){'), o60.indexOf('window.salvarOrcamentoTela = function(){') + 5600);

console.log('== 1. ESTOQUE NO ORÇAMENTO ==');
ok('add de item exige estoque mínimo (não entra sem)', /temEstoque < qtd/.test(addItem59));
ok('aviso pede o mínimo da quantidade do orçamento', /Precisa de no mínimo 1, ou da quantidade que for colocar no orçamento/.test(addItem59));
ok('serviço e recarga seguem livres (sem trava)', addItem59.includes('servi[cç]o|recarga') && addItem59.includes('!p.estoqueInfinito'));
ok('orçamento NÃO baixa estoque ao adicionar item', !/estoque\s*=\s*[^=][^.]*estoque\s*-/.test(addItem59) && !/p\.estoque\s*-=|p\.estoque\s*=\s*[^=]/.test(addItem59.replace(/n\(p\.estoque\)/,'')));
ok('salvar do orçamento também não baixa estoque', !/\.estoque\s*=\s*/.test(save60.replace(/estoqueInfinito/g,'')));

console.log('== 2. SEM "ORÇAMENTO NÃO ENCONTRADO" AO SALVAR ==');
// v5.22.87: o salvar não reabre mais a tela — fecha. A blindagem que importa
// é a abertura por id/token/número/formulário, sem tostão fantasma.
ok('salvar não baseia confirmação em procura intermediária', !save60.includes("window.abrirOrcamento(o.id);"));
ok('abrir orçamento tenta id, depois token e número de reserva', /x\.token===id \|\| String\(x\.numero\)===String\(id\)/.test(o37));
ok('abrir orçamento usa o formulário em tela como última reserva', /f\.id===id \|\| f\.token===id/.test(o37));

console.log('== 3. BUSCA POR SERIAL IGUAL ÀS VENDAS ==');
ok('campo de série do orçamento tem lupa e Enter', /window\.orcBuscarSerial && window\.orcBuscarSerial\(this\.value\)/.test(o60) && /orc-os-serie'\)\.value/.test(o60));
ok('caixa de aviso da última notinha existe', /id="orc-serial-info"/.test(o60));
ok('procura serial em vendas, chamados e equipamentos', /\(_db\.vendas \|\| \[\]\)/.test(o60) && /\(_db\.os \|\| \[\]\)/.test(o60) && /\(_db\.equipamentos \|\| \[\]\)/.test(o60) && /\(_db\.parque \|\| \[\]\)/.test(o60));
ok('puxa a última notinha e mostra o aviso igual vendas', /Última notinha encontrada/.test(o60) && /Nenhuma notinha anterior encontrada/.test(o60));
ok('preenche modelo/patrimônio/contador', /orc-os-modelo/.test(o60) && /orc-os-patri/.test(o60) && /orc-os-contador/.test(o60));
ok('seleciona o cliente sozinho (mesma regra das vendas)', /orcSelCliente\(c\.id\)/.test(o60) || /orcSelCliente\(c2\.id\)/.test(o60));
ok('função exposta pra tela', /window\.orcBuscarSerial = orcBuscarSerial;/.test(o60));
ok('mesmos campos que as vendas guardam no save', /numeroSerie: txt\(document\.getElementById\('orc-os-serie'\)/.test(o60));

console.log('== 4. CONSISTÊNCIA ==');
ok('nenhum arquivo novo no bundle (um arquivo por módulo)', manifest.length === 190);
ok('versão 5.22.x', /^5\.22\./.test(pkg.version));

console.log('\nRESULTADO: ajustes v5.22.85 passaram!');
