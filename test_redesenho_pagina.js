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
['nucleo.js', 'ponte.js', 'selecao.js', 'pix.js', 'impressao.js', 'venda.js', 'financeiro.js', 'leituras.js', 'listas.js', 'telas.js'].forEach(f => w.eval(fs.readFileSync('novo/' + f, 'utf8')));
const trecho = html.match(/<script>([\s\S]*?)<\/script>/)[1];
w.eval(trecho);
const doc = w.document;

console.log('== PÁGINA DO SISTEMA NOVO (mesmo menu, coração novo) ==');
ok('a página abre na tela de Clientes', doc.getElementById('titulo-tela').textContent === 'Clientes');
// O MENU COMPLETO: toda tela da ficha tem de estar no menu — nenhuma fica de fora.
// (era o pedido do dono: "tudo de uma vez os menus")
const ficha = w.DIGICOPY_LISTAS;
const itensMenu = [...doc.querySelectorAll('[data-tela]')].map(b => b.getAttribute('data-tela'));
ok('o menu traz TODAS as telas da ficha (nenhuma fica de fora)', itensMenu.length === ficha.TELAS.length && ficha.TELAS.every(t => itensMenu.includes(t.id)),
  itensMenu.length + ' itens no menu / ' + ficha.TELAS.length + ' na ficha');
ok('e nenhuma tela aparece duas vezes no menu', new Set(itensMenu).size === itensMenu.length);
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

console.log('-- os menus que faltam abrem EXPLICANDO o motivo (nunca tela vazia) --');
{
  const abrirTela = (id) => [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === id)
    .dispatchEvent(new w.Event('click', { bubbles: true }));
  abrirTela('orcamentos');
  ok('Orçamentos agora é tela de verdade (abas + Novo), não mais "em construção"',
    !!doc.querySelector('[data-aba="orcamentos"]') && !!doc.querySelector('[data-acao="novo"]'));
  abrirTela('nuvem');
  ok('a tela de Nuvem diz que ainda roda no sistema de hoje', /ainda roda no sistema de hoje/.test(doc.getElementById('tela').textContent));
  ok('e explica o motivo com todas as letras (virada da chave)',
    /VIRADA DA CHAVE/.test(doc.getElementById('tela').textContent));
  abrirTela('migrados');
  ok('a tela de Registros migrados também explica em vez de ficar em branco',
    /ainda roda no sistema de hoje/.test(doc.getElementById('tela').textContent));
  abrirTela('clientes');
  ok('e dá para voltar para Clientes normalmente', doc.getElementById('titulo-tela').textContent === 'Clientes');
}

console.log('-- as telas NOVAS de cadastro funcionam (contratos, chamados, leituras) --');
{
  const abrirTela = (id) => [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === id)
    .dispatchEvent(new w.Event('click', { bubbles: true }));
  const digitar = (sel, v) => { const c = doc.querySelector(sel); c.value = v; return c; };
  const clicar = (sel) => doc.querySelector(sel).dispatchEvent(new w.Event('click', { bubbles: true }));
  // o cliente que o contrato/parque/chamado vai apontar (a ficha não deixa gravar sem ele)
  w.__nucleoNovo.salvar('clientes', { id: 'cli-teste', nome: 'Cliente do Contrato', telefone: '38999990000' });
  const cli = w.__nucleoNovo.obter('clientes', 'cli-teste');

  // CONTRATOS: o número sai sozinho (CT-ano-0001) e o nome do cliente vem junto
  abrirTela('contratos');
  ok('o menu leva ao Contrato com o menu de abas da Locação',
    !!doc.querySelector('[data-aba="contratos"]') && !!doc.querySelector('[data-aba="leituras"]'));
  clicar('[data-acao="novo"]');
  digitar('[data-campo="clienteId"]', cli ? cli.id : '');
  digitar('[data-campo="numero"]', '');
  digitar('[data-campo="valorMensalFixo"]', '890,00');
  clicar('[data-modal-ok]');
  const contratos = w.__nucleoNovo.listar('contratos');
  ok('o contrato foi gravado com número automático',
    contratos.length === 1 && /^CT-\d{4}-\d+$/.test(String(contratos[0].numero)), contratos[0] && contratos[0].numero);
  ok('e o nome do cliente ficou no contrato (a tela não pergunta o que ela já sabe)',
    !cli || contratos[0].clienteNome === cli.nome);
  ok('o valor com vírgula virou número', contratos[0].valorMensalFixo === 890);

  // PARQUE + LEITURA: a conta do excedente é a MESMA do sistema de hoje
  w.__nucleoNovo.salvar('equipamentos', { id: 'eq-1', modelo: 'HP M404', contadorPB: 100, contadorCor: 0 });
  abrirTela('parque');
  clicar('[data-acao="novo"]');
  digitar('[data-campo="clienteId"]', cli ? cli.id : '');
  digitar('[data-campo="contratoId"]', contratos[0].id);
  digitar('[data-campo="equipamentoId"]', 'eq-1');
  digitar('[data-campo="setor"]', 'Recepção');
  digitar('[data-campo="contadorInicialPB"]', '100');
  clicar('[data-modal-ok]');
  const parque = w.__nucleoNovo.listar('parque');
  ok('a máquina entrou no cliente com o modelo preenchido',
    parque.length === 1 && parque[0].equipamentoModelo === 'HP M404' && parque[0].clienteNome === (cli ? cli.nome : parque[0].clienteNome));
  // o contrato do teste: franquia 3000 PB, excedente R$ 0,08 (os padrões de hoje)
  w.__nucleoNovo.salvar('contratos', { id: contratos[0].id, franquiaPB: 3000, franquiaCor: 0, valorExcedentePB: 0.08, valorExcedenteCor: 0.45 });
  abrirTela('leituras');
  clicar('[data-acao="novo"]');
  digitar('[data-campo="parqueId"]', parque[0].id);
  digitar('[data-campo="contadorPB"]', '3400');
  digitar('[data-campo="contadorCor"]', '0');
  clicar('[data-modal-ok]');
  const leituras = w.__nucleoNovo.listar('leituras');
  // 3400 lido − 100 que a máquina tinha = 3300 de consumo; 3300 − 3000 de franquia = 300
  // páginas excedentes × R$ 0,08 = R$ 24,00 (é a MESMA conta do sistema de hoje)
  ok('a leitura calculou o consumo sozinha (contador de agora − o anterior)',
    leituras.length === 1 && leituras[0].consumoPB === 3300, leituras[0] && String(leituras[0].consumoPB));
  ok('e o excedente saiu da franquia do contrato (300 × R$ 0,08 = R$ 24,00)',
    leituras[0].valorExcedente === 24 && leituras[0].faturar === true, leituras[0] && String(leituras[0].valorExcedente));
  ok('e o contador da máquina subiu para o que foi lido',
    w.__nucleoNovo.obter('equipamentos', 'eq-1').contadorPB === 3400);
  // segunda leitura: o "anterior" passa a ser a ÚLTIMA leitura (não o contador inicial)
  clicar('[data-acao="novo"]');
  digitar('[data-campo="parqueId"]', parque[0].id);
  digitar('[data-campo="contadorPB"]', '3900');
  clicar('[data-modal-ok]');
  const leituras2 = w.__nucleoNovo.listar('leituras');
  ok('a segunda leitura conta a partir da ÚLTIMA (3900 − 3400 = 500)',
    leituras2.length === 2 && leituras2.some(l => l.consumoPB === 500),
    JSON.stringify(leituras2.map(l => l.consumoPB)));
  ok('e abaixo da franquia não cobra excedente',
    !leituras2.some(l => l.consumoPB === 500 && l.valorExcedente > 0));
  ok('leitura com contador abaixo do anterior nasce marcada como divergência (regra de hoje)',
    w.DIGICOPY_LEITURAS.regras.leituraDaColeta({
      parque: { id: 'p', contadorInicialPB: 500 }, contrato: {}, contadorPB: 400, contadorCor: 0
    }).status === 'divergencia');

  // CHAMADOS: número automático da série de OS
  abrirTela('os');
  clicar('[data-acao="novo"]');
  digitar('[data-campo="clienteId"]', cli ? cli.id : '');
  digitar('[data-campo="descricao"]', 'Não imprime');
  clicar('[data-modal-ok]');
  const chamados = w.__nucleoNovo.listar('os');
  ok('o chamado foi gravado com número automático',
    chamados.length === 1 && /^\d+$/.test(String(chamados[0].numero)), chamados[0] && chamados[0].numero);
  ok('e com o nome do cliente', chamados.length === 1 && (!cli || chamados[0].clienteNome === cli.nome));

  // AUDITORIA (e o catálogo fiscal) são SÓ CONSULTA: não deixam inventar registro
  abrirTela('auditoria');
  ok('a Auditoria abre como lista só de consulta (sem botão Novo)',
    !!doc.querySelector('[data-aba="logs"]') && !doc.querySelector('[data-acao="novo"]'));
  ok('e a tela avisa que é só consulta', /só consulta/.test(doc.getElementById('tela').textContent));
  abrirTela('fiscal-catalogo');
  ok('o Catálogo fiscal (NCM/CEST/CFOP) também é só consulta', !doc.querySelector('[data-acao="novo"]'));
  abrirTela('auditoria');
  ok('e a lixeira não aparece em lista de histórico', !doc.querySelector('[data-acao="alternar-lixeira"]'));
}

console.log('-- as telas avisam o que fazem e o que ainda não fazem (aviso honesto) --');
{
  const abrirTela = (id) => [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === id)
    .dispatchEvent(new w.Event('click', { bubbles: true }));
  abrirTela('clientes');
  ok('a tela de Clientes avisa que hoje o cadastro cobra endereço e aqui só o nome é obrigatório',
    /cobra telefone, rua, número e bairro/.test(doc.getElementById('tela').textContent));
  abrirTela('usuarios');
  ok('a tela de Usuários avisa que a trava por permissão ainda é do sistema antigo',
    /TRAVA por permissão/.test(doc.getElementById('tela').textContent) && /Senha não fica nesta lista/.test(doc.getElementById('tela').textContent));
  abrirTela('produtos');
  ok('a tela de Produtos avisa que estoque infinito é para serviço',
    /Estoque infinito é para serviço/.test(doc.getElementById('tela').textContent));
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
  // 4 clientes: os 3 desta prova de busca + o "Cliente do Contrato" da prova das telas novas
  ok('a aba Clientes desenha os clientes cadastrados', abrirClientes() === 4, String(abrirClientes()));
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
  ok('limpar a busca mostra todos de novo', doc.querySelectorAll('[data-linha]').length === 4);
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
  ok('o item do menu da venda diz que ela está pronta (com impressão, Pix e OS)',
    /pronta \(impressão, Pix e OS\)/.test([...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'vendas').textContent),
    [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'vendas').textContent);
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
  ['nucleo.js', 'ponte.js', 'selecao.js', 'pix.js', 'impressao.js', 'venda.js', 'financeiro.js', 'leituras.js', 'listas.js', 'telas.js'].forEach(f => w2.eval(fs.readFileSync('novo/' + f, 'utf8')));
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

console.log('-- a página carrega o PIX e a IMPRESSÃO, e a venda tem a aba OS --');
{
  ok('a página carrega as duas peças novas (Pix e impressão)',
    !!w.DIGICOPY_PIX && !!w.DIGICOPY_IMPRESSAO && !!w.DIGICOPY_PIX.regras.painelHtml && !!w.DIGICOPY_IMPRESSAO.regras.notinhaHtml);
  [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'vendas')
    .dispatchEvent(new w.Event('click', { bubbles: true }));
  const alvo = doc.getElementById('tela');
  ok('a tela da venda abre com a aba OS (os mesmos campos de hoje)',
    !!alvo.querySelector('[data-os-bloco]') && !!alvo.querySelector('[data-os="numeroSerie"]') &&
    !!alvo.querySelector('[data-os="defeito"]') && !!alvo.querySelector('[data-os="situacao"]'));
  ok('e com os campos de entrega/observação que a notinha imprime',
    !!alvo.querySelector('[data-data-saida]') && !!alvo.querySelector('[data-prazo-entrega]') &&
    !!alvo.querySelector('[data-destino]') && !!alvo.querySelector('[data-obs]'));
  // o "Nova" limpa a venda que os blocos de cima deixaram aberta nesta mesma página
  alvo.querySelector('[data-nova]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('venda em branco: sem botão de imprimir (nada gravado) e sem estornar',
    !alvo.querySelector('[data-print-notinha]') && !alvo.querySelector('[data-print-carne]') &&
    !alvo.querySelector('[data-estornar]') && !!alvo.querySelector('[data-faturar]'));
}

console.log('-- a tela do Pix (Configurações) funciona de verdade na página --');
{
  const irPix = () => {
    doc.querySelectorAll('.module').forEach(m => m.classList.remove('aberto'));
    [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'pix')
      .dispatchEvent(new w.Event('click', { bubbles: true }));
  };
  irPix();
  const alvo = doc.getElementById('tela');
  ok('a tela do Pix abre com o cartão da chave', doc.getElementById('titulo-tela').textContent === 'Configurações — Pix' &&
    !!alvo.querySelector('[data-cfg-pix-chave]'));
  const chave = alvo.querySelector('[data-cfg-pix-chave]');
  chave.value = '12345678000199';
  chave.dispatchEvent(new w.Event('input', { bubbles: true }));
  ok('digitando a chave, o tipo aparece na hora (sem apertar nada)',
    /CNPJ/.test(alvo.querySelector('[data-cfg-pix-tipo]').textContent), alvo.querySelector('[data-cfg-pix-tipo]').textContent);
  alvo.querySelector('[data-cfg-pix-nome]').value = 'DIGICOPY';
  alvo.querySelector('[data-cfg-pix-cidade]').value = 'MONTES CLAROS';
  alvo.querySelector('[data-cfg-pix-salvar]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('salvar grava a chave no núcleo (e o aviso aparece no rodapé, sem janela nativa)',
    /Chave Pix salva/.test(doc.getElementById('st-bd').textContent), doc.getElementById('st-bd').textContent);
  // sai da tela e volta: a chave tem de estar lá (foi gravada no núcleo, não na tela)
  [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'clientes')
    .dispatchEvent(new w.Event('click', { bubbles: true }));
  irPix();
  ok('a chave continua no cartão depois de sair e voltar para a tela (ficou gravada)',
    alvo.querySelector('[data-cfg-pix-chave]').value === '12345678000199' &&
    alvo.querySelector('[data-cfg-pix-nome]').value === 'DIGICOPY',
    alvo.querySelector('[data-cfg-pix-chave]').value);
  alvo.querySelector('[data-cfg-pix-testar]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('o teste do QR mostra a imagem e o código de exemplo (nada é gravado nem cobrado)',
    alvo.querySelector('[data-cfg-pix-preview]').hidden === false &&
    /api.qrserver.com/.test(alvo.querySelector('[data-cfg-pix-preview]').innerHTML) &&
    /Nada foi gravado/.test(alvo.querySelector('[data-cfg-pix-preview]').textContent));
}

console.log('-- a página carrega o PIX e a IMPRESSÃO, e a venda tem a aba OS --');
{
  ok('a página carrega as duas peças novas (Pix e impressão)',
    !!(w.DIGICOPY_PIX && w.DIGICOPY_PIX.regras) && !!(w.DIGICOPY_IMPRESSAO && w.DIGICOPY_IMPRESSAO.regras));
  [...doc.querySelectorAll('[data-tela]')].find(b => b.getAttribute('data-tela') === 'vendas')
    .dispatchEvent(new w.Event('click', { bubbles: true }));
  const alvo = doc.getElementById('tela');
  ok('a tela da venda abre com a aba OS (os mesmos campos de hoje)',
    !!alvo.querySelector('[data-os-bloco]') && !!alvo.querySelector('[data-os="numeroSerie"]') &&
    !!alvo.querySelector('[data-os="defeito"]') && !!alvo.querySelector('[data-os="situacao"]'));
  ok('e com os campos de entrega/observação que a notinha imprime',
    !!alvo.querySelector('[data-data-saida]') && !!alvo.querySelector('[data-prazo-entrega]') &&
    !!alvo.querySelector('[data-destino]') && !!alvo.querySelector('[data-obs]'));
  alvo.querySelector('[data-nova]').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok('venda em branco: sem botão de imprimir (nada gravado) e sem estornar',
    !alvo.querySelector('[data-print-notinha]') && !alvo.querySelector('[data-print-carne]') &&
    !alvo.querySelector('[data-estornar]'));
  // a tabela de itens, o rodapé de totais e a dica da OS existem na tela
  ok('a venda mostra itens e totais (igual à tela de hoje)',
    !!alvo.querySelector('[data-add]') && !!alvo.querySelector('[data-tot-prod]') &&
    !!alvo.querySelector('[data-tot-total]') && !!alvo.querySelector('[data-desc-venda]'));
}

console.log('-- TODOS os menus, uma tela por vez: nenhuma abre em branco --');
{
  const abrirTela = (id) => {
    const b = [...doc.querySelectorAll('[data-tela]')].find(x => x.getAttribute('data-tela') === id);
    b.dispatchEvent(new w.Event('click', { bubbles: true }));
    return b;
  };
  const alvo = doc.getElementById('tela');
  const brancas = [], semMotivo = [], semLista = [];
  const listasVistas = new Set();
  ficha.TELAS.forEach(t => {
    abrirTela(t.id);
    const txt = (alvo.textContent || '').replace(/\s+/g, ' ').trim();
    if (alvo.innerHTML.replace(/\s+/g, '') === '') { brancas.push(t.id); return; }
    if (t.tipo === 'depende') {
      // a tela pendente tem de dizer POR QUE ainda roda no sistema de hoje, e citar a
      // tela antiga (o dono sabe onde procurar hoje)
      if (!alvo.querySelector('.nfx-depende')) semMotivo.push(t.id + ' (sem a caixa de explicação)');
      if (txt.indexOf(String(t.motivo).slice(0, 40)) < 0) semMotivo.push(t.id + ' (sem o motivo)');
      if (txt.indexOf('roda no sistema de hoje') < 0) semMotivo.push(t.id + ' (não diz que roda no de hoje)');
      if (txt.indexOf('fica em:') < 0) semMotivo.push(t.id + ' (não diz onde ela está hoje)');
    } else if (t.tipo === 'lista') {
      listasVistas.add(t.lista);
      // tem de ter a tabela (ou o aviso de vazio) e a busca daquela lista
      if (!alvo.querySelector('.nfx-tabela') && txt.indexOf('Nada aqui ainda') < 0) semLista.push(t.id);
    } else {
      // tela própria: o título tem de ser o dela (nada de 'Em construção' genérico)
      if (doc.getElementById('titulo-tela').textContent !== (t.id === 'pix' ? 'Configurações — Pix' : (t.id === 'inicio' ? 'Início' : t.rotulo))) {
        semLista.push(t.id + ' (título: ' + doc.getElementById('titulo-tela').textContent + ')');
      }
    }
  });
  ok('nenhuma das ' + ficha.TELAS.length + ' telas do menu abre em branco' + (brancas.length ? ' — vazias: ' + brancas.join(', ') : ''), brancas.length === 0);
  ok('toda tela que ainda roda no sistema de hoje abre dizendo o motivo e ONDE ela fica hoje', semMotivo.length === 0, semMotivo.join(', '));
  ok('toda tela de cadastro abre com a sua tabela/busca', semLista.length === 0, semLista.join(', '));
  const cadastros = Object.keys(ficha.LISTAS).filter(n => ficha.LISTAS[n].tipo !== 'apoio');
  const faltam = cadastros.filter(n => !listasVistas.has(n));
  ok('as ' + cadastros.length + ' listas do sistema (' + cadastros.join(', ') + ') têm tela no menu', faltam.length === 0, faltam.join(', '));
  // e o botão do menu fica marcado na tela aberta (o dono não se perde)
  abrirTela('leituras');
  const ativo = [...doc.querySelectorAll('[data-tela]')].filter(b => b.classList.contains('ativa')).map(b => b.getAttribute('data-tela'));
  ok('a tela aberta fica marcada no menu (só uma)', ativo.length === 1 && ativo[0] === 'leituras', JSON.stringify(ativo));
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — a página nova tem a cara do sistema e o coração novo.');
