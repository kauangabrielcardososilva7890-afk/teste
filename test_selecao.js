// test_selecao.js — v7.0.11/1.0.0
// A CAIXA DE SELEÇÃO INTELIGENTE do núcleo novo (novo/selecao.js).
//
// A prova principal é DIFERENCIAL: o sistema de hoje já tem as regras de busca dele
// (CLI_PURE.filtraClientes, FILTROS_BUSCA_PURE.filtraProdutos/filtraRecargas, o código
// exato do v5.22.36). Este teste roda as DUAS implementações sobre a mesma base cheia de
// casos difíceis e compara, caso a caso: se a resposta é a mesma, a função que o dono
// usa hoje continua idêntica no sistema novo. Depois prova a tela (teclado, lupa, escolher).
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== CAIXA DE SELEÇÃO INTELIGENTE (cliente/produto/recarga) ==');
  console.log('  (não rodou: falta a dependência \'jsdom\' — não é defeito do sistema)');
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, detalhe) {
  if (!cond) { console.error('  \u2718 ' + nome + (detalhe ? '  [' + detalhe + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}

const dom = new JSDOM('<!DOCTYPE html><body>' +
  '<div id="cx-cli"></div><div id="cx-prod"></div><div id="cx-rec"></div>' +
  '<button id="fora">fora</button></body>',
  { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window, doc = w.document;
w.alert = () => { throw new Error('USOU alert NATIVO'); };
w.confirm = () => { throw new Error('USOU confirm NATIVO'); };
w.prompt = () => { throw new Error('USOU prompt NATIVO'); };

// ── o ANTIGO (as regras que ele usa hoje, carregadas do próprio sistema) ────
const mCli = /\/\* CLI_PURE_START \*\/([\s\S]*?)\/\* CLI_PURE_END \*\//.exec(fs.readFileSync('clientes_patch.js', 'utf8'));
w.eval(mCli[1] + '\n;window.CLI_PURE=CLI_PURE;');
w.eval(fs.readFileSync('ajustes_v52219_filtros_busca_patch.js', 'utf8'));   // FILTROS_BUSCA_PURE
w.eval(fs.readFileSync('ajustes_v52236_codigo_cliente_exato_patch.js', 'utf8')); // código exato (envelopa o antigo)

// ── o NOVO ──────────────────────────────────────────────────────────────────
const fonte = fs.readFileSync('novo/selecao.js', 'utf8');
w.eval(fonte);
const SEL = w.DIGICOPY_SELECAO;
const ANTIGO = { cli: w.CLI_PURE, fil: w.FILTROS_BUSCA_PURE };

console.log('== CAIXA DE SELEÇÃO INTELIGENTE — paridade com o sistema de hoje, caso a caso ==');
ok('o novo carrega e o antigo também (v' + SEL.VERSAO_SELECAO + ')',
  !!SEL && !!ANTIGO.cli && !!ANTIGO.fil && typeof ANTIGO.cli.filtraClientes === 'function');
// o teste olha o CÓDIGO, não os comentários (os comentários explicam justamente o que NÃO se usa)
const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
ok('sem alert/confirm/prompt nativos no arquivo novo', !/\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/.test(codigo));
ok('sem gravar no navegador e sem falar com a nuvem', codigo.indexOf('localStorage') < 0 && codigo.indexOf('fetch(') < 0);

console.log('-- 1) a LISTA DE CAMPOS é a mesma (é isso que o dono vê no filtro) --');
ok('os 16 campos de cliente, na mesma ordem e com os mesmos nomes',
  JSON.stringify(SEL.busca.CAMPOS_CLIENTE) === JSON.stringify(ANTIGO.cli.CAMPOS_BUSCA),
  JSON.stringify(SEL.busca.CAMPOS_CLIENTE));
ok('as 12 categorias de produto', JSON.stringify(SEL.busca.CATS_PRODUTO) === JSON.stringify(ANTIGO.fil.CATS_PRODUTO));
ok('os 4 campos de recarga', JSON.stringify(SEL.busca.CAMPOS_RECARGA) === JSON.stringify(ANTIGO.fil.CAMPOS_RECARGA));

// ── a base de prova, cheia de caso difícil de propósito ─────────────────────
const clientes = [
  { id: 'c1', codigo: '48', nome: 'José Ávila', documento: '123.456.789-00', telefone: '(38) 99999-1234', cidade: 'Montes Claros', estado: 'MG', fantasia: 'Papelaria Ávila', email: 'jose@avila.com', email2: 'contato@avila.com.br', cep: '39400-000', whatsapp: '5538999991234', bairro: 'Centro', endereco: 'Rua A, 100 • Centro', contato: 'Maria', observacao: 'cliente antigo', rgIE: 'MG-1' },
  { id: 'c2', codigo: '048', nome: 'JOSE AVILA', documento: '12345678900', telefone: '3899991234', cidade: 'montes claros', estado: 'mg', cep: '39400000', whatsapp: '3899991234' },
  { id: 'c3', codigo: '480', nome: 'Loja 480', documento: '11.222.333/0001-44', telefone: '(11) 3232-4800' },
  { id: 'c4', codigo: '1048', nome: 'Loja 1048', cidade: 'São Paulo', estado: 'SP' },
  { id: 'c5', codigo: '', codigoAntigo: '48', nome: 'Fulano Código Antigo', documento: '555.666.777-88' },
  { id: 'c6', nome: 'Casa do Toner', cidade: 'Belo Horizonte', bairro: 'Savassi', estado: 'MG' },
  { id: 'c7', nome: 'Maria José', documento: '98.765.432/0001-10', telefone: '(31) 3232-3232', fantasia: 'MJ' },
  { id: 'c8', nome: 'Recarga Express', observacao: 'só recarga', rgIE: '1234567' },
  { id: 'c9', nome: 'Zé', cidade: 'São Paulo', estado: 'SP', cep: '01000-000', endereco: 'Av. Paulista, 1000 • Bela Vista' },
  { id: 'c10', nome: 'Ávila & Filhos', contato: 'João', whatsapp: '(11) 98888-7777', email2: 'financeiro@avilafilhos.com' },
  { id: 'c11', nome: 'Cliente Sem Nada' },
  { id: 'c12', nome: 'MARIA JOSE', fantasia: 'MJ Papel', cidade: 'Montes Claros', estado: 'MG' }
];
const T_BUSCA_CLI = ['', '48', '048', '480', '1048', '4', 'jose', 'josé', 'JOSÉ', 'avila', 'ávila', 'á', 'vila',
  '1234', '12345678900', '123.456.789-00', '39400', '39400000', '99999', '3899991234', 'mg', 'MG', 'sp',
  'centro', 'savassi', 'toner', 'recarga', 'maria jose', 'maria josé', 'avila & filhos', '999', '12', '1', 'papel'];

console.log('-- 2) BUSCA DE CLIENTE: os 16 campos × 34 termos = resposta idêntica --');
{
  let casos = 0, divergencias = [];
  SEL.busca.CAMPOS_CLIENTE.forEach(function (par) {
    T_BUSCA_CLI.forEach(function (q) {
      const novo = SEL.busca.filtraClientes(clientes, q, par[0]).map((c) => c.id).join(',');
      const antigo = ANTIGO.cli.filtraClientes(clientes, q, par[0]).map((c) => c.id).join(',');
      casos++;
      if (novo !== antigo) divergencias.push(par[0] + ' | "' + q + '" → novo[' + novo + '] antigo[' + antigo + ']');
    });
  });
  ok(casos + ' comparações de cliente, todas iguais', divergencias.length === 0, divergencias.slice(0, 3).join(' ;; '));
}

console.log('-- 3) o CÓDIGO continua EXATO (48 acha 48, não acha 480 nem 1048) --');
{
  const por48 = SEL.busca.filtraClientes(clientes, '48', 'codigo').map((c) => c.id);
  ok('48 acha o 48, o 048 (mesmo código) e o código antigo 48', por48.join(',') === 'c1,c2,c5', por48.join(','));
  ok('48 NÃO traz 480 nem 1048', !por48.includes('c3') && !por48.includes('c4'));
  ok('mesma resposta que o sistema de hoje', por48.join(',') === ANTIGO.cli.filtraClientes(clientes, '48', 'codigo').map((c) => c.id).join(','));
}

const produtos = [
  { id: 'p1', nome: 'Cartucho HP 664 Preto', sku: 'HP664', codigo: '1001', categoria: 'Cartucho', fabricante: 'HP', ncm: '8443.99.23', preco: 89.9 },
  { id: 'p2', nome: 'cartucho hp 664 colorido', sku: 'hp664c', codigo: '1002', categoria: 'cartucho', fabricante: 'hp', preco: 99.9 },
  { id: 'p3', nome: 'Toner Samsung', sku: 'SS101', categoria: 'Insumo', fabricante: 'Samsung', preco: 150 },
  { id: 'p4', nome: 'Serviço de Instalação', sku: 'SRV1', categoria: 'Serviço', preco: 80 },
  { id: 'p5', nome: 'servico de limpeza', sku: 'srv2', categoria: 'servico', preco: 60 },
  { id: 'p6', nome: 'Recarga de Toner', sku: 'REC1', categoria: 'Recarga', preco: 40 },
  { id: 'p7', nome: 'Cartucho Vazio 664', sku: 'VZ664', categoria: 'Cartucho Vazio', preco: 10 },
  { id: 'p8', nome: 'Impressora Epson L3250', sku: 'EPS3250', categoria: 'Impressoras', fabricante: 'Epson', preco: 1200 },
  { id: 'p9', nome: 'Chip Compatível', sku: 'CHIP1', categoria: 'Chip', preco: 25 },
  { id: 'p10', nome: 'Papel A4', sku: 'PAP4', categoria: 'Outros', ncm: '4802.55.10', preco: 30 },
  { id: 'p11', nome: 'Produto Inativo', sku: 'INA1', categoria: 'Produto', status: 'inativo', preco: 5 },
  { id: 'p12', nome: 'Produto Excluído', sku: 'EXC1', categoria: 'Produto', status: 'excluido', preco: 5 },
  { id: 'p13', nome: 'Cabo USB', sku: 'USB1', categoria: 'Informática', preco: 15 },
  { id: 'p14', nome: 'Toner Original HP', sku: 'ORIG1', categoria: 'Original', fabricante: 'HP', preco: 220 }
];
const CATS = [''].concat(SEL.busca.CATS_PRODUTO).concat(['servico', 'RECARGA', 'Cartucho vazio']);
const T_BUSCA_PROD = ['', 'toner', 'cartucho', 'hp', '664', '1001', 'ncm', '8443', 'serv', 'srv', 'impress',
  'chip', 'orig', 'xyz', 'papel', 'inform', 'vazio', 'samsung'];

console.log('-- 4) BUSCA DE PRODUTO: 16 categorias × 18 termos = resposta idêntica --');
{
  let casos = 0, divergencias = [];
  CATS.forEach(function (cat) {
    T_BUSCA_PROD.forEach(function (q) {
      const novo = SEL.busca.filtraProdutos(produtos, q, cat).map((p) => p.id).join(',');
      const antigo = ANTIGO.fil.filtraProdutos(produtos, q, cat).map((p) => p.id).join(',');
      casos++;
      if (novo !== antigo) divergencias.push('cat[' + cat + '] "' + q + '" → novo[' + novo + '] antigo[' + antigo + ']');
    });
  });
  ok(casos + ' comparações de produto, todas iguais', divergencias.length === 0, divergencias.slice(0, 3).join(' ;; '));
  ok('Recarga NÃO aparece na busca de produto (igual hoje)',
    SEL.busca.filtraProdutos(produtos, '', '').every((p) => p.id !== 'p6'));
  ok('inativo e excluído ficam fora (igual hoje)',
    SEL.busca.filtraProdutos(produtos, '', '').every((p) => p.id !== 'p11' && p.id !== 'p12'));
  ok('categoria unificada: "servico" acha "Serviço" (igual hoje)',
    SEL.busca.filtraProdutos(produtos, '', 'Serviço').map((p) => p.id).join(',') === 'p4,p5');
}

const recargas = [
  { id: 'r1', codigo: '12', nome: 'Recarga Toner HP 85A', marca: 'HP' },
  { id: 'r2', codigo: '120', nome: 'Recarga Toner Samsung', marca: 'Samsung' },
  { id: 'r3', nome: 'Recarga Cartucho 664', marca: 'hp' },
  { id: 'r4', codigo: '13', nome: 'Recarga Inativa', marca: 'Xerox', status: 'inativo' },
  { id: 'r5', codigo: '14', nome: 'Recarga Excluída', marca: 'Epson', status: 'excluido' },
  { id: 'r6', codigo: '15', nome: 'Toner Preto Genérico', marca: 'Genérico' }
];
console.log('-- 5) RECARGA (etiqueta): 4 campos × 8 termos = resposta idêntica --');
{
  let casos = 0, divergencias = [];
  SEL.busca.CAMPOS_RECARGA.forEach(function (par) {
    ['', '12', '120', 'cart', 'toner', 'HP', 'hp', 'sam'].forEach(function (q) {
      const novo = SEL.busca.filtraRecargas(recargas, q, par[0]).map((r) => r.id).join(',');
      const antigo = ANTIGO.fil.filtraRecargas(recargas, q, par[0]).map((r) => r.id).join(',');
      casos++;
      if (novo !== antigo) divergencias.push(par[0] + ' "' + q + '" → novo[' + novo + '] antigo[' + antigo + ']');
    });
  });
  ok(casos + ' comparações de recarga, todas iguais', divergencias.length === 0, divergencias.slice(0, 3).join(' ;; '));
  ok('inativa e excluída ficam fora (igual hoje)',
    SEL.busca.filtraRecargas(recargas, '', 'todos').every((r) => r.id !== 'r4' && r.id !== 'r5'));
}

console.log('-- 6) A CAIXA NA TELA: digitar, teclado, lupa e escolher --');
{
  const cx = SEL.montar({ tipo: 'cliente', elemento: doc.getElementById('cx-cli'), fonte: clientes, aoEscolher: () => {} });
  const resultado = doc.getElementById('cx-cli').querySelector('[data-resultados]');
  ok('a caixa monta com o campo de onde buscar + digitar + lupa',
    !!cx.campo && !!cx.termo && !!doc.getElementById('cx-cli').querySelector('[data-lupa]'));
  ok('o campo de onde buscar começa em "Pesquisar em tudo" e tem os 16', cx.campo.options.length === 16 && cx.campo.value === 'todos');

  cx.termo.value = 'jose';
  cx.termo.dispatchEvent(new w.Event('input', { bubbles: true }));
  ok('digitar já sugere (sem apertar nada)', cx.achados().map((c) => c.id).join(',') === 'c1,c2,c7,c12', cx.achados().map((c) => c.id).join(','));
  ok('a primeira sugestão já fica destacada', !!resultado.querySelector('.sfx-ativo'));

  cx.termo.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  cx.termo.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('seta + Enter escolhe o segundo', cx.escolhido() && cx.escolhido().id === 'c2');
  ok('a caixa passa a mostrar o nome do escolhido', cx.termo.value === 'JOSE AVILA', cx.termo.value);
  ok('e o painel fecha depois de escolher', resultado.classList.contains('sfx-escondido'));

  cx.limpar();
  cx.termo.value = '';
  doc.getElementById('cx-cli').querySelector('[data-lupa]').click();
  ok('lupa com a caixa vazia mostra os primeiros (não fica em branco)', cx.achados().length === 12);
  ok('respeita o limite de 12 sugestões por vez', resultado.querySelectorAll('[data-i]').length === 12);

  cx.termo.value = 'zzzz';
  cx.termo.dispatchEvent(new w.Event('input', { bubbles: true }));
  ok('quando não acha, diz "Nenhum cliente"', /Nenhum cliente/.test(resultado.innerHTML));

  cx.termo.value = 'maria';
  cx.termo.dispatchEvent(new w.Event('input', { bubbles: true }));
  cx.termo.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok('Esc fecha as sugestões (sem apagar o que ele digitou)', resultado.classList.contains('sfx-escondido') && cx.termo.value === 'maria');

  // clicar numa sugestão também escolhe (é o gesto dele no dia a dia)
  cx.termo.value = 'avila';
  cx.termo.dispatchEvent(new w.Event('input', { bubbles: true }));
  const alvo = resultado.querySelector('[data-id="c10"]');
  alvo.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  ok('clicar na sugestão escolhe o cliente', cx.escolhido() && cx.escolhido().id === 'c10');
}

console.log('-- 7) A CAIXA DE PRODUTO e a de RECARGA --');
{
  const guardados = [];
  const cx = SEL.montar({ tipo: 'produto', elemento: doc.getElementById('cx-prod'), fonte: produtos, aoEscolher: (p) => guardados.push(p) });
  ok('o produto traz a lista de categoria, começando em "Todas categorias"',
    cx.campo.options.length === 13 && cx.campo.options[0].textContent === 'Todas categorias');
  cx.termo.value = '664';
  cx.termo.dispatchEvent(new w.Event('input', { bubbles: true }));
  ok('mostra o código e o preço junto do nome (como hoje)',
    /664/.test(cx.resultados.innerHTML) && /89,90/.test(cx.resultados.innerHTML), cx.resultados.innerHTML.slice(0, 120));
  cx.termo.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('escolher produto avisa quem pediu a caixa', guardados.length === 1 && guardados[0].id === 'p1');
  ok('e a caixa passa a mostrar o nome do produto', cx.termo.value === 'Cartucho HP 664 Preto', cx.termo.value);

  const cxR = SEL.montar({ tipo: 'recarga', elemento: doc.getElementById('cx-rec'), fonte: recargas });
  ok('a recarga tem os 4 campos (todos/código/descrição/marca)', cxR.campo.options.length === 4);
  cxR.termo.value = '12';
  cxR.termo.dispatchEvent(new w.Event('input', { bubbles: true }));
  ok('a etiqueta 12 acha a 12 e a 120 (como hoje, busca por número)', cxR.achados().map((r) => r.id).join(',') === 'r1,r2', cxR.achados().map((r) => r.id).join(','));
  cxR.campo.value = 'marca';
  cxR.termo.value = 'gen';
  cxR.termo.dispatchEvent(new w.Event('input', { bubbles: true }));
  ok('trocar o campo para "Marca" muda a busca', cxR.achados().map((r) => r.id).join(',') === 'r6');
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — a caixa de seleção inteligente do núcleo novo responde IGUAL à do sistema de hoje (cliente, produto e recarga) e a tela (teclado, lupa, escolher) funciona.');
try { w.close(); } catch (e) {}
process.exit(0);
