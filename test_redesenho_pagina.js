// test_redesenho_pagina.js — v1.0.0 (fase 1 do redesenho)
// A página do sistema novo precisa ter A CARA do sistema de hoje (mesmo menu) e
// funcionar de verdade: as telas migradas trabalham e as que ainda não entraram
// dizem em que fase entram — nada de botão morto (regra 17).
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== PÁGINA DO SISTEMA NOVO ==');
  console.log('  (não rodou: falta a dependência \'jsdom\' — não é defeito do sistema)');
  process.exit(0);
}
let passou = 0;
function ok(nome, cond){ if(!cond){ console.error('  \u2718 ' + nome); process.exit(1); } console.log('  \u2714 ' + nome); passou++; }

const html = fs.readFileSync('novo/index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/', pretendToBeVisual: true });
const w = dom.window;

// As três peças do núcleo entram na ordem da página; depois roda o script da página.
['nucleo.js', 'ponte.js', 'selecao.js', 'venda.js', 'financeiro.js', 'telas.js'].forEach(f => w.eval(fs.readFileSync('novo/' + f, 'utf8')));
const trecho = html.match(/<script>([\s\S]*?)<\/script>/)[1];
w.eval(trecho);
const doc = w.document;

console.log('== PÁGINA DO SISTEMA NOVO (mesmo menu, coração novo) ==');
ok('a página abre na tela de Clientes', doc.getElementById('titulo-tela').textContent === 'Clientes');
ok('o menu traz os itens do sistema de hoje (18)', doc.querySelectorAll('[data-tela]').length === 18);
['Cadastros', 'Atendimento', 'Locação', 'Fiscal', 'Financeiro', 'Buscador Escola', 'Configurações'].forEach(rot => {
  ok('o menu tem "' + rot + '"', [...doc.querySelectorAll('[data-menu]')].some(b => b.textContent.indexOf(rot) >= 0));
});
ok('a barra de baixo mostra a versão do coração novo', /v1\.0\.0/.test(doc.getElementById('st-nucleo').textContent));
ok('e a fila da nuvem', /fila da nuvem: 0/.test(doc.getElementById('st-fila').textContent));

console.log('-- as telas migradas funcionam --');
{
  doc.querySelector('[data-aba="produtos"]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('trocar para Produtos muda o título', doc.getElementById('titulo-tela').textContent === 'Produtos e serviços');
  doc.querySelector('[data-acao="novo"]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('o modal do sistema abre no Produtos', !!doc.querySelector('[data-modal]'));
  const campo = doc.querySelector('[data-campo="nome"]'); campo.value = 'Toner HP';
  const preco = doc.querySelector('[data-campo="preco"]'); preco.value = '120,50';
  doc.querySelector('[data-modal-ok]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('o produto foi gravado no coração novo', w.__nucleoNovo.contar('produtos') === 1);
  ok('com o preço certo (vírgula vira ponto)', w.__nucleoNovo.listar('produtos')[0].preco === 120.5);
  ok('e a tabela mostra o produto', doc.querySelectorAll('[data-linha]').length === 1);
  ok('a fila da nuvem subiu para 1', /fila da nuvem: 1/.test(doc.getElementById('st-fila').textContent));
}

console.log('-- o que ainda não foi migrado avisa a fase (nada de botão morto) --');
{
  const bt = [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'orcamentos');
  bt.dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('a tela de Orçamentos avisa que ainda não foi migrada', /ainda não foi migrada/.test(doc.getElementById('tela').textContent));
  ok('e diz em que fase entra (fase 3)', /fase 3/.test(doc.getElementById('tela').textContent));
  const nuvem = [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'nuvem');
  nuvem.dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('a tela de Nuvem aponta a fase 2', /fase 2/.test(doc.getElementById('tela').textContent));
  const clientes = [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'clientes');
  clientes.dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('e dá para voltar para Clientes normalmente', doc.getElementById('titulo-tela').textContent === 'Clientes');
}

console.log('-- a ponte está ligada na página (mesmo mecanismo do sistema de hoje) --');
{
  ok('a ponte existe e está no modo ligado', !!w.__ponte && w.__ponte.modo() === 'ligado');
  ok('a lista do "db" que a página usa continua uma lista comum', Array.isArray(w.__dbNovo.produtos));
  ok('a página não usa alert/confirm/prompt nativos', !/\b(alert|confirm|prompt)\s*\(/.test(trecho));
}

console.log('-- a BUSCA tem o campo "onde buscar" (igual ao sistema de hoje) --');
{
  // alguns clientes com caso difícil de propósito (acento, maiúscula, telefone, cidade)
  w.__nucleoNovo.salvar('clientes', { id: 'cli-1', nome: 'José Ávila', telefone: '(38) 99999-1234', cidade: 'Montes Claros' });
  w.__nucleoNovo.salvar('clientes', { id: 'cli-2', nome: 'Loja 480', telefone: '(11) 3232-4800', cidade: 'São Paulo' });
  w.__nucleoNovo.salvar('clientes', { id: 'cli-3', nome: 'MARIA JOSE', telefone: '(38) 3232-1010', cidade: 'montes claros' });
  const abrirClientes = () => {
    [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'clientes')
      .dispatchEvent(new w.Event('click', { bubbles: true }));
    doc.querySelector('[data-aba="clientes"]').dispatchEvent(new w.Event('click', { bubbles: true }));
    return doc.querySelectorAll('[data-linha]').length;
  };
  ok('a aba Clientes desenha os 3 clientes', abrirClientes() === 3);
  const seletor = doc.querySelector('[data-campo-busca]');
  ok('a barra de busca tem o campo de onde buscar', !!seletor);
  ok('com os 16 campos do sistema de hoje, começando em "Pesquisar em tudo"',
    seletor.options.length === 16 && seletor.options[0].textContent === 'Pesquisar em tudo');
  const buscar = (termo) => {
    const campo = doc.querySelector('[data-busca]');
    campo.value = termo;
    campo.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    return [...doc.querySelectorAll('[data-linha]')].map(tr => tr.textContent).join(' | ');
  };
  const porNome = buscar('jose');
  ok('buscar "jose" acha "José Ávila" e "MARIA JOSE" (sem acento e sem maiúscula)',
    /José Ávila/.test(porNome) && /MARIA JOSE/.test(porNome) && !/Loja 480/.test(porNome), porNome);
  seletor.value = 'cidade';
  seletor.dispatchEvent(new w.Event('change', { bubbles: true }));
  const porCidade = buscar('montes');
  ok('trocar para o campo "Cidade" busca SÓ na cidade', /José Ávila/.test(porCidade) && /MARIA JOSE/.test(porCidade) && !/Loja 480/.test(porCidade), porCidade);
  seletor.value = 'telefone';
  seletor.dispatchEvent(new w.Event('change', { bubbles: true }));
  const porFone = buscar('3232');
  ok('trocar para "Telefone" acha por número dentro do telefone', /Loja 480/.test(porFone) && /MARIA JOSE/.test(porFone) && !/José Ávila/.test(porFone), porFone);
  seletor.value = 'todos';
  seletor.dispatchEvent(new w.Event('change', { bubbles: true }));
  const nada = buscar('zzzz');
  ok('quando não acha, a lista fica vazia (sem inventar registro)', nada === '');
  ok('e o rodapé diz em que campo ele filtrou', /filtrado por/.test(doc.querySelector('.nfx-rodape').textContent));
  buscar('');
  ok('limpar a busca mostra os 3 de novo', doc.querySelectorAll('[data-linha]').length === 3);
  // Produtos: o campo de busca é a categoria
  doc.querySelector('[data-aba="produtos"]').dispatchEvent(new w.Event('click', { bubbles: true }));
  const selProd = doc.querySelector('[data-campo-busca]');
  ok('em Produtos o campo de busca é a categoria, começando em "Todas categorias"',
    selProd.options.length === 13 && selProd.options[0].textContent === 'Todas categorias');
  doc.querySelector('[data-aba="clientes"]').dispatchEvent(new w.Event('click', { bubbles: true }));
}

console.log('-- a VENDA (notinha) funciona dentro da página --');
{
  w.__nucleoNovo.salvar('produtos', { id: 'pdx', nome: 'Cartucho 664', sku: 'HP664', categoria: 'Cartucho', preco: 89.9, estoque: 5 });
  const irVendas = () => {
    [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'vendas')
      .dispatchEvent(new w.Event('click', { bubbles: true }));
  };
  irVendas();
  ok('o item do menu diz o que já está pronto e o que ainda falta na venda (sem prometer demais)',
    /falta impressão e PIX/.test([...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'vendas').textContent));
  ok('e o título da tela muda para a venda', doc.getElementById('titulo-tela').textContent === 'Nova venda / Notinha');
  ok('a notinha abre com as duas caixas de seleção e a situação',
    !!doc.querySelector('[data-caixa-cliente] [data-termo]') && !!doc.querySelector('[data-caixa-produto] [data-termo]') && !!doc.querySelector('[data-status]'));

  const tipo = (sel, v) => { const e = doc.querySelector(sel); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); return e; };
  const enter = (el) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  enter(tipo('[data-caixa-cliente] [data-termo]', 'jose'));
  ok('escolher o cliente pela caixa funciona na página', /José Ávila/.test(doc.getElementById('tela').textContent));
  enter(tipo('[data-caixa-produto] [data-termo]', 'cartucho'));
  ok('escolher o produto traz o valor unitário', doc.querySelector('[data-vunit]').value === '89,9');
  doc.querySelector('[data-qtd]').value = '2';
  doc.querySelector('[data-add]').dispatchEvent(new w.Event('click', { bubbles: true }));
  doc.querySelector('[data-salvar]').dispatchEvent(new w.Event('click', { bubbles: true }));
  const vendas = w.__nucleoNovo.listar('vendas');
  ok('a venda entrou no coração novo com o total certo', vendas.length === 1 && vendas[0].total === 179.8, JSON.stringify(vendas.map(v => v.total)));
  ok('e o estoque do produto baixou (5 → 3)', w.__nucleoNovo.obter('produtos', 'pdx').estoque === 3);
  ok('a fila da nuvem cresceu com a venda', /fila da nuvem: [1-9]/.test(doc.getElementById('st-fila').textContent));
  irVendas();
  ok('voltar para a venda mantém o que já foi lançado (não perde nada)', w.__nucleoNovo.listar('vendas').length === 1);
  // faturar pela janela do recebimento (dentro da página, como vai ser no sistema)
  doc.querySelector('[data-faturar]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('na página, Faturar abre a janela de recebimento do próprio sistema',
    !!doc.querySelector('[data-fat-modal]') && doc.querySelectorAll('[data-fat-modal] [data-forma]').length === 8);
  // trocar de tela com a janela aberta não deixa a janela pendurada
  [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'clientes')
    .dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('trocar de tela fecha a janela do faturamento (nada de janela pendurada)', !doc.querySelector('[data-fat-modal]'));
  irVendas();
  doc.querySelector('[data-faturar]').dispatchEvent(new w.Event('click', { bubbles: true }));
  doc.querySelector('[data-fat-modal] [data-fat-concluir]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('concluir fatura no financeiro dentro da página (título já baixado, à vista em Dinheiro)',
    !doc.querySelector('[data-fat-modal]') &&
    w.__nucleoNovo.listar('contasReceber').length === 1 &&
    w.__nucleoNovo.listar('contasReceber')[0].status === 'pago' &&
    w.__nucleoNovo.listar('contasReceber')[0].autoBaixa === true);
}

console.log('-- o FINANCEIRO (contas a receber e a pagar) funciona dentro da página --');
{
  const irTela = (tela) => {
    [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === tela)
      .dispatchEvent(new w.Event('click', { bubbles: true }));
  };
  const clienteId = w.__nucleoNovo.listar('clientes').filter(c => /José Ávila/.test(c.nome))[0].id;
  const emDias = (d) => { const x = new Date(); x.setUTCDate(x.getUTCDate() + d); return x.toISOString().slice(0, 10); };
  // o que a venda faturou à vista já está aqui (pago); entram um a receber e um a pagar em aberto
  w.__nucleoNovo.salvar('contasReceber', { id: 'cr-pg', descricao: 'Mensalidade de exemplo', clienteId: clienteId, valor: 120, vencimento: emDias(0), status: 'aberto' });
  w.__nucleoNovo.salvar('contasPagar', { id: 'cp-pg', fornecedor: 'Papelaria da esquina', descricao: 'Resma de papel', categoria: 'Suprimentos', valor: 35.5, vencimento: emDias(2), status: 'aberto' });
  ok('o item do menu do Financeiro diz que as duas telas já estão prontas',
    /pronta/.test([...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'contasReceber').textContent) &&
    /pronta/.test([...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'contasPagar').textContent));

  irTela('contasReceber');
  ok('a tela de Contas a receber abre com o título certo', doc.getElementById('titulo-tela').textContent === 'Contas a receber');
  ok('com a tabela, os modos e o botão de novo lançamento',
    !!doc.querySelector('#tela [data-fin-receber]') && !!doc.querySelector('#tela [data-fin-novo]') && !![...doc.querySelectorAll('#tela [data-modo]')].length);
  const linhasFront = () => doc.querySelectorAll('#tela tbody tr[data-linha-fin]').length;
  [...doc.querySelectorAll('#tela [data-modo]')].find(b => b.getAttribute('data-modo') === 'todos')
    .dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('o título a receber que acabei de gravar aparece na lista', linhasFront() === 2, 'linhas=' + linhasFront());
  ok('e a tela de receber mostra SÓ o que é a receber (sem a conta a pagar)',
    !/Papelaria da esquina/.test(doc.getElementById('tela').textContent));

  irTela('contasPagar');
  ok('a tela de Contas a pagar abre com o título certo', doc.getElementById('titulo-tela').textContent === 'Contas a pagar');
  [...doc.querySelectorAll('#tela [data-modo]')].find(b => b.getAttribute('data-modo') === 'todos')
    .dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('e mostra a despesa a pagar (e só ela)', linhasFront() === 1 && /Papelaria da esquina/.test(doc.getElementById('tela').textContent));
  ok('com o botão de nova despesa no lugar do lançamento a receber',
    !!doc.querySelector('#tela [data-fin-nova-despesa]') && !doc.querySelector('#tela [data-fin-novo]'));

  // abrir a janela do próprio sistema e trocar de tela não pode deixar janela pendurada
  doc.querySelector('#tela [data-fin-nova-despesa]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('a janela da despesa abre dentro da página (janela do sistema, não do navegador)', !!doc.querySelector('[data-fin-modal]'));
  irTela('contasReceber');
  ok('trocar de tela fecha a janela do financeiro (nada de janela pendurada)', !doc.querySelector('[data-fin-modal]'));
}

console.log('-- modo ?exemplo=1: ver a caixa funcionando sem digitar nada e SEM gravar nada --');
{
  const dom2 = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/?exemplo=1', pretendToBeVisual: true });
  const w2 = dom2.window;
  ['nucleo.js', 'ponte.js', 'selecao.js', 'venda.js', 'financeiro.js', 'telas.js'].forEach(f => w2.eval(fs.readFileSync('novo/' + f, 'utf8')));
  w2.eval(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
  const d2 = w2.document;
  const criar = (campo, valor) => { const c = d2.querySelector('[data-campo="' + campo + '"]'); c.value = valor; return c; };
  const qtd = () => d2.querySelectorAll('[data-linha]').length;
  ok('o exemplo já abre com 4 clientes', qtd() === 4, 'linhas=' + qtd());
  ok('e com os 4 produtos (com preço em número, não texto)', w2.__nucleoNovo.contar('produtos') === 4 && w2.__nucleoNovo.obter('produtos', 'ex-prod-1').preco === 89.9);
  d2.querySelector('[data-aba="produtos"]').dispatchEvent(new w2.Event('click', { bubbles: true }));
  ok('a aba Produtos mostra os 4 de exemplo', qtd() === 4, 'linhas=' + qtd());
  d2.querySelector('[data-aba="clientes"]').dispatchEvent(new w2.Event('click', { bubbles: true }));
  ok('e NADA foi gravado no navegador (nem o rascunho)', w2.localStorage.length === 0 || w2.localStorage.getItem('digicopy_novo_rascunho_v1') === null);
  const busca = d2.querySelector('[data-busca]');
  busca.value = 'jose'; busca.dispatchEvent(new w2.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('buscar "jose" acha 2 (acento e maiúscula não atrapalham)', qtd() === 2, 'linhas=' + qtd());
  const campo2 = d2.querySelector('[data-campo-busca]');
  campo2.value = 'cidade'; campo2.dispatchEvent(new w2.Event('change', { bubbles: true }));
  busca.value = 'montes'; busca.dispatchEvent(new w2.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('campo "Cidade" busca só na cidade', qtd() === 2, 'linhas=' + qtd());
  ok('e continua sem gravar nada no navegador', w2.localStorage.getItem('digicopy_novo_rascunho_v1') === null);
  // a venda de exemplo: ele clica em Atendimento → Nova venda e vende um produto de exemplo
  [...d2.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'vendas')
    .dispatchEvent(new w2.Event('click', { bubbles: true }));
  const digitar = (sel, v) => { const e = d2.querySelector(sel); e.value = v; e.dispatchEvent(new w2.Event('input', { bubbles: true })); e.dispatchEvent(new w2.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); };
  digitar('[data-caixa-cliente] [data-termo]', 'jose');
  digitar('[data-caixa-produto] [data-termo]', 'cartucho');
  d2.querySelector('[data-add]').dispatchEvent(new w2.Event('click', { bubbles: true }));
  d2.querySelector('[data-salvar]').dispatchEvent(new w2.Event('click', { bubbles: true }));
  ok('a venda funciona também no modo exemplo (com os produtos de exemplo)', w2.__nucleoNovo.listar('vendas').length === 1);
  ok('e o estoque do produto de exemplo baixou (5 → 4)', w2.__nucleoNovo.obter('produtos', 'ex-prod-1').estoque === 4, 'estoque=' + w2.__nucleoNovo.obter('produtos', 'ex-prod-1').estoque);
  ok('e nada foi para o navegador nem no modo exemplo', w2.localStorage.getItem('digicopy_novo_rascunho_v1') === null);
  // o Financeiro do exemplo: 2 títulos a receber e 1 a pagar (o aviso de exemplo incompleto não pode aparecer)
  ok('o exemplo traz os 2 títulos a receber e a conta a pagar', w2.__nucleoNovo.listar('contasReceber').length === 2 &&
    w2.__nucleoNovo.listar('contasPagar').length === 1 && !/exemplo incompleto/.test(d2.getElementById('st-nucleo').textContent),
    d2.getElementById('st-nucleo').textContent);
  [...d2.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'contasReceber')
    .dispatchEvent(new w2.Event('click', { bubbles: true }));
  [...d2.querySelectorAll('#tela [data-modo]')].find(b => b.getAttribute('data-modo') === 'todos')
    .dispatchEvent(new w2.Event('click', { bubbles: true }));
  ok('e a tela de contas a receber do exemplo mostra os 2 títulos', d2.querySelectorAll('#tela tbody tr[data-linha-fin]').length === 2,
    'linhas=' + d2.querySelectorAll('#tela tbody tr[data-linha-fin]').length);
  try { w2.close(); } catch (e) {}
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — a página nova tem a cara do sistema e o coração novo.');
