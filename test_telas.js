// test_telas.js — v1.0.0 (fase 1 do redesenho)
// Abre as telas novas num navegador de mentira (jsdom) e faz o que a pessoa faz:
// cadastra, edita, busca, exclui (com motivo) e traz de volta.
//
// O que é provado:
//   1) as telas desenham e o cadastro passa pelo NÚCLEO (não grava por conta própria)
//   2) excluir abre o MODAL DO SISTEMA e registra o motivo na lápide
//   3) NADA de alert/confirm/prompt nativos (o teste explode se algum for chamado)
//   4) o excluído sai da lista, entra na lixeira e NÃO volta sozinho
//   5) trazer de volta é ação explícita ("♻️ Restaurar")
//   6) busca é por Enter (não a cada tecla) + a lupa funciona
//   7) erro de validação aparece no próprio modal, sem fechar e sem perder o que foi digitado
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== TELAS NOVAS (navegador de mentira) ==');
  console.log('  (não rodou: falta a dependência \'jsdom\' — não é defeito do sistema)');
  process.exit(0);
}

let passou = 0;
function ok(nome, cond){ if(!cond){ console.error('  \u2718 ' + nome); process.exit(1); } console.log('  \u2714 ' + nome); passou++; }

const pagina = new JSDOM('<!DOCTYPE html><body><div id="telas"></div></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
const win = pagina.window;

// Se alguma tela chamar o nativo, o teste reprova na hora (regra 16 das permanentes)
win.alert = () => { throw new Error('USOU alert NATIVO'); };
win.confirm = () => { throw new Error('USOU confirm NATIVO'); };
win.prompt = () => { throw new Error('USOU prompt NATIVO'); };

win.eval(fs.readFileSync('novo/nucleo.js', 'utf8'));
win.eval(fs.readFileSync('novo/telas.js', 'utf8'));

const nucleo = win.DIGICOPY_NUCLEO.criar({ empresaId: 'teste', origem: 'pc-teste' });
const telas = win.DIGICOPY_TELAS.criarTelas({ nucleo, elemento: win.document.getElementById('telas'), documento: win.document });
const doc = win.document;
const clicar = (sel) => { const b = doc.querySelector(sel); if (!b) throw new Error('não achei ' + sel); b.dispatchEvent(new win.Event('click', { bubbles: true })); };
const digitar = (sel, valor) => { const c = doc.querySelector(sel); c.value = valor; return c; };
const linhas = () => [...doc.querySelectorAll('[data-linha]')].map(tr => tr.textContent);
const abrirNovo = () => { clicar('[data-acao="novo"]'); };

console.log('== TELAS NOVAS (navegador de mentira) ==');
ok('as telas desenham os Clientes e os Produtos', !!doc.querySelector('[data-aba="clientes"]') && !!doc.querySelector('[data-aba="produtos"]'));
ok('o rodapé mostra a fila da nuvem zerada', /0 mudança/.test(doc.querySelector('[data-rodape]').textContent));
ok('sem cadastro, a tabela avisa que está vazia', /Nada aqui ainda/.test(doc.querySelector('[data-corpo]').textContent));

console.log('-- 1) cadastrar pelo modal do sistema --');
{
  abrirNovo();
  ok('o modal do sistema abre (nada de prompt nativo)', !!doc.querySelector('[data-modal]'));
  ok('o primeiro campo já vem focado (digitar sem clicar)', doc.activeElement && doc.activeElement.getAttribute('data-campo') === 'nome');
  digitar('[data-campo="nome"]', 'Ana');
  digitar('[data-campo="fone"]', '38999990000');
  clicar('[data-modal-ok]');
  ok('o cadastro foi para o núcleo (1 registro)', nucleo.contar('clientes') === 1);
  ok('o modal fechou', !doc.querySelector('[data-modal]'));
  ok('a linha apareceu na tabela', linhas().length === 1 && /Ana/.test(linhas()[0]));
  ok('o rodapé já conta a mudança na fila da nuvem', /1 mudança/.test(doc.querySelector('[data-rodape]').textContent));
}

console.log('-- 2) erro de validação fica no modal, sem perder o digitado --');
{
  abrirNovo();
  digitar('[data-campo="fone"]', '38000000000');   // sem o nome (obrigatório)
  clicar('[data-modal-ok]');
  ok('o modal CONTINUA aberto e mostra o motivo', !!doc.querySelector('[data-modal]') && /obrigatório/.test(doc.querySelector('[data-erro]').textContent));
  ok('nada foi gravado', nucleo.contar('clientes') === 1);
  ok('o que já tinha sido digitado não se perde', doc.querySelector('[data-campo="fone"]').value === '38000000000');
  clicar('[data-modal-cancelar]');
  ok('cancelar fecha sem gravar', !doc.querySelector('[data-modal]') && nucleo.contar('clientes') === 1);
}

console.log('-- 3) excluir: confirmação com motivo, no modal do sistema --');
{
  const id = nucleo.listar('clientes')[0].id;
  clicar('[data-linha="' + id + '"] [data-acao="excluir"]');
  ok('abre a confirmação do sistema (nunca o confirm nativo)', !!doc.querySelector('[data-modal="confirmacao"]'));
  ok('a confirmação mostra o nome do registro', /Ana/.test(doc.querySelector('[data-modal]').textContent));
  digitar('[data-campo="motivo"]', 'cliente pediu para excluir');
  clicar('[data-modal-ok]');
  const dentro = nucleo.obter('clientes', id);
  ok('o registro NÃO foi apagado: virou lápide', !!dentro && dentro.apagadoEm > 0);
  ok('a lápide guarda QUEM apagou', dentro.apagadoPor === 'pc-teste');
  ok('a lápide guarda o MOTIVO digitado', dentro.motivo === 'cliente pediu para excluir');
  ok('sumiu da lista normal', linhas().length === 0);
  ok('e a lixeira mostra 1', /Lixeira \(1\)/.test(doc.querySelector('[data-acao="alternar-lixeira"]').textContent));
}

console.log('-- 4) o excluído não volta sozinho --');
{
  const id = nucleo.listar('clientes', { somenteApagados: true })[0].id;
  // um PC velho reenviando o mesmo cadastro (versão antiga) não pode ressuscitar
  const r = nucleo.aplicarDaNuvem({ lista: 'clientes', id, versao: 1, dados: { id, nome: 'Ana', versao: 1, apagadoEm: 0 } });
  ok('mudança velha da nuvem é ignorada', r.aplicado === false);
  telas.desenhar();
  ok('a tabela continua sem ele', linhas().length === 0);
}

console.log('-- 5) trazer de volta é ação explícita --');
{
  clicar('[data-acao="alternar-lixeira"]');
  ok('a lixeira mostra o registro apagado', linhas().length === 1 && /Ana/.test(linhas()[0]));
  clicar('[data-linha] [data-acao="restaurar"]');
  ok('pede confirmação antes de trazer', !!doc.querySelector('[data-modal="confirmacao"]'));
  clicar('[data-modal-ok]');
  ok('voltou para a lista de verdade', nucleo.contar('clientes') === 1 && linhas().length === 1);
  ok('e a lixeira ficou vazia', /Lixeira \(0\)/.test(doc.querySelector('[data-acao="alternar-lixeira"]').textContent));
}

console.log('-- 6) busca por Enter (não a cada tecla) + lupa --');
{
  nucleo.salvar('clientes', { nome: 'Bruno' });
  nucleo.salvar('clientes', { nome: 'Carla' });
  telas.desenhar();
  ok('3 clientes na lista', linhas().length === 3);
  const campo = digitar('[data-busca]', 'Bruno');
  ok('digitar NÃO refaz a lista (só Enter ou a lupa)', linhas().length === 3);
  campo.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('Enter filtrou', linhas().length === 1 && /Bruno/.test(linhas()[0]));
  digitar('[data-busca]', 'Carla');
  clicar('[data-acao="buscar"]');
  ok('a lupa filtrou', linhas().length === 1 && /Carla/.test(linhas()[0]));
  digitar('[data-busca]', '');
  clicar('[data-acao="buscar"]');
  ok('limpar a busca mostra todos de novo', linhas().length === 3);
}

console.log('-- 7) editar pelo modal --');
{
  const id = nucleo.listar('clientes', { ordenarPor: 'nome' })[0].id;
  clicar('[data-linha="' + id + '"] [data-acao="editar"]');
  ok('o modal abre com os dados do registro', doc.querySelector('[data-campo="nome"]').value === 'Ana');
  digitar('[data-campo="cidade"]', 'Montes Claros');
  clicar('[data-modal-ok]');
  ok('gravou a edição (mesma linha, sem duplicar)', nucleo.contar('clientes') === 3 && nucleo.obter('clientes', id).cidade === 'Montes Claros');
  // a versão conta a história inteira do registro: 1 criou, 2 apagou, 3 restaurou, 4 editou
  ok('a versão conta a história (4 = criou, apagou, restaurou, editou)', nucleo.obter('clientes', id).versao === 4);
  ok('e a lápide antiga continua registrada no histórico da fila', nucleo.mudancas().some(m => m.id === id && m.apagadoEm > 0));
}

console.log('-- 8) as telas não mexem no dado por conta própria --');
{
  const codigo = fs.readFileSync('novo/telas.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('não chama alert/confirm/prompt nativos', !/\b(alert|confirm|prompt)\s*\(/.test(codigo));
  ok('não grava direto no armazenamento nem na rede', !/localStorage|fetch\(|XMLHttpRequest/.test(codigo));
  ok('não mexe na lista de dentro do núcleo (quem decide é o núcleo)',
    !/\.itens\s*=|\.splice\(|delete\s+\w+\[/.test(codigo));
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — telas novas falando com o coração novo.');
