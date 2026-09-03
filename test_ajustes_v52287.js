// ═══════════════════════════════════════════════════════════════════════════
// v5.22.87 — Orçamentos (ajeitos de tela e fluxo):
//   1) orçamento já salvo NÃO mostra a tela de "escolha o cliente" (só o
//      cartão do cliente; a busca volta só se clicar no X para trocar)
//   2) sem abas: Itens e Ordem de Serviço na mesma tela, um embaixo do outro
//      (a "tela 2" sempre aparece)
//   3) Salvar fecha a aba do orçamento na hora (volta pra lista)
//   4) sem botão "Sair" no rodapé — fecha pelo X do canto superior
//   5) lista: botões "Mostrar todos aprovados" e "Mostrar todos desaprovados"
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ ' + name); process.exit(1); } console.log('  ✔ ' + name); }
const ler = f => fs.readFileSync(f, 'utf8');

const o60 = ler('ajustes_v52260_orcamento_trava_venda_atalho_patch.js');
const o58 = ler('ajustes_v52258_orcamento_os_revalidar_patch.js');
const manifest = JSON.parse(ler('bundle-manifest.json'));
const pkg = JSON.parse(ler('package.json'));
const save60 = o60.slice(o60.indexOf('window.salvarOrcamentoTela = function(){'), o60.indexOf('window.salvarOrcamentoTela = function(){') + 5600);
const footer60 = o60.slice(o60.indexOf("document.getElementById('modal-footer').innerHTML ="), o60.indexOf("document.getElementById('modal-footer').innerHTML =") + 2200);

console.log('== 1. ORÇAMENTO SALVO NÃO PEDE CLIENTE ==');
ok('bloco de busca some quando já tem cliente', /id="orc-cli-busca" class="'\+\(f\.cliente \|\| isAutorizado \? 'hidden' : ''\)\+'"/.test(o60.replace(/\n/g,'')));
ok('cartão do cliente continua aparecendo quando tem cliente', /id="orc-cli-sel" class="'\+\(f\.cliente \? '' : 'hidden'\)/.test(o60.replace(/\n/g,'')));
ok('escolher cliente esconde a busca', /orcSelCliente = function\(id\)[\s\S]{0,260}orc-cli-busca'\);[\s\S]{0,80}classList\.add\('hidden'\)/.test(o60));
ok('trocar cliente (X) mostra a busca de volta', /orcLimparCliente = function\(\)[\s\S]{0,260}orc-cli-busca'\);[\s\S]{0,80}classList\.remove\('hidden'\)/.test(o60));

console.log('== 2. SEM ABAS: OS SEMPRE NA TELA ==');
ok('não existe mais botão de aba no orçamento', !/orc-tab-os|setAbaOrcamento/.test(o60));
ok('seção Ordem de Serviço nasce visível (sem hidden)', /id="orc-aba-os" class="space-y-3/.test(o60));
ok('seção Itens continua visível', /id="orc-aba-itens" class="space-y-3/.test(o60));

console.log('== 3. SALVAR FECHA A ABA ==');
ok('salvar termina fechando o modal', save60.includes("if(typeof closeModal === 'function') closeModal();") && save60.lastIndexOf('closeModal();') > save60.lastIndexOf('renderOrcamentos()'));
ok('salvar não reabre a tela do orçamento', !save60.includes('window.abrirTelaOrcamento(o)'));
ok('salvar limpa o formulário em tela', /window\.__ORC_ST\.form = null;/.test(save60));
ok('salvar continua dando o toast de confirmação', /Orçamento ' \+ o\.numero \+ ' salvo!/.test(save60));

console.log('== 4. SEM BOTÃO SAIR NO RODAPÉ ==');
ok('rodapé sem o botão Sair', !/Sair<\/button>/.test(footer60));
ok('rodapé sem fechar-aba embutido', !/onclick="closeModal\(\)"/.test(footer60));
ok('botões Revalidar / Imprimir / Salvar preservados', /revalidarLinkOrcamento/.test(footer60) && /imprimirOrcamento/.test(footer60) && /salvarOrcamentoTela\(\)/.test(footer60));

console.log('== 5. BOTÕES APROVADOS / DESAPROVADOS NA LISTA ==');
ok('botão "Mostrar todos aprovados" ao lado de Todos', /Mostrar todos aprovados/.test(o58));
ok('botão "Mostrar todos desaprovados" ao lado de Todos', /Mostrar todos desaprovados/.test(o58));
ok('botões acionam o filtro certo', o58.includes("orcFiltroLista(\\'fechados\\')") && o58.includes("orcFiltroLista(\\'recusados\\')"));
ok('função de filtro existe e re-renderiza', /window\.orcFiltroLista = function\(campo\)[\s\S]{0,220}window\.renderOrcamentos\(\)/.test(o58));
ok('filtro "recusados" pega só desaprovados', /campo === 'recusados'\) return st === 'recusado';/.test(o58));
ok('abertos deixam de misturar recusado', /nao_fechados'\)[\s\S]{0,140}st !== 'recusado'/.test(o58));

console.log('== 6. REVALIDAR LINK CONTINUA INTACTO ==');
ok('revalidar exposto na janela', /window\.revalidarLinkOrcamento = revalidarLinkOrcamento;/.test(o58));
ok('revalidar gera token novo e volta pra aberto', /o\.token = 'orc_tok_'/.test(o58) && /o\.status = 'aberto';/.test(o58));

console.log('== CONSISTÊNCIA ==');
ok('nenhum arquivo novo no bundle (um arquivo por módulo)', manifest.length === 190);
ok('versão 5.22.x', /^5\.22\./.test(pkg.version));

console.log('\nRESULTADO: ajustes v5.22.87 passaram!');
