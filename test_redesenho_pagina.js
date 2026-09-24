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
['nucleo.js', 'ponte.js', 'telas.js'].forEach(f => w.eval(fs.readFileSync('novo/' + f, 'utf8')));
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

console.log('\nRESULTADO: ' + passou + ' verificações passaram — a página nova tem a cara do sistema e o coração novo.');
