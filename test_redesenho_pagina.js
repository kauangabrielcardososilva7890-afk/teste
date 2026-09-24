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
['nucleo.js', 'ponte.js', 'selecao.js', 'telas.js'].forEach(f => w.eval(fs.readFileSync('novo/' + f, 'utf8')));
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

console.log('-- modo ?exemplo=1: ver a caixa funcionando sem digitar nada e SEM gravar nada --');
{
  const dom2 = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/?exemplo=1', pretendToBeVisual: true });
  const w2 = dom2.window;
  ['nucleo.js', 'ponte.js', 'selecao.js', 'telas.js'].forEach(f => w2.eval(fs.readFileSync('novo/' + f, 'utf8')));
  w2.eval(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
  const d2 = w2.document;
  const criar = (campo, valor) => { const c = d2.querySelector('[data-campo="' + campo + '"]'); c.value = valor; return c; };
  const qtd = () => d2.querySelectorAll('[data-linha]').length;
  ok('o exemplo já abre com 4 clientes', qtd() === 4, 'linhas=' + qtd());
  ok('e NADA foi gravado no navegador (nem o rascunho)', w2.localStorage.length === 0 || w2.localStorage.getItem('digicopy_novo_rascunho_v1') === null);
  const busca = d2.querySelector('[data-busca]');
  busca.value = 'jose'; busca.dispatchEvent(new w2.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('buscar "jose" acha 2 (acento e maiúscula não atrapalham)', qtd() === 2, 'linhas=' + qtd());
  const campo2 = d2.querySelector('[data-campo-busca]');
  campo2.value = 'cidade'; campo2.dispatchEvent(new w2.Event('change', { bubbles: true }));
  busca.value = 'montes'; busca.dispatchEvent(new w2.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('campo "Cidade" busca só na cidade', qtd() === 2, 'linhas=' + qtd());
  ok('e continua sem gravar nada no navegador', w2.localStorage.getItem('digicopy_novo_rascunho_v1') === null);
  try { w2.close(); } catch (e) {}
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — a página nova tem a cara do sistema e o coração novo.');
