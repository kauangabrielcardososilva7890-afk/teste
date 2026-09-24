// test_ponte.js — v1.0.0 (fase 1 do redesenho)
// A PONTE é o que permite rodar as telas de HOJE no coração NOVO (pedido dele:
// "o mesmo Index, as mesmas funções, tudo, mas com núcleo diferente").
//
// Este teste imita o que o sistema de hoje faz com as listas — do jeito que ele
// faz: `db.clientes.push(...)`, `db.clientes = db.clientes.filter(...)`,
// `nome`, `saveDB()` — e confere que o coração entende tudo, sem perder nada e
// sem deixar "sumiço" sem explicação.
require('./novo/nucleo.js');
require('./novo/ponte.js');
const N = globalThis.DIGICOPY_NUCLEO;
const P = globalThis.DIGICOPY_PONTE;

let passou = 0;
function ok(nome, cond){ if(!cond){ console.error('  \u2718 ' + nome); process.exit(1); } console.log('  \u2714 ' + nome); passou++; }

// ── o "sistema de hoje" de mentira: o mesmo `db` e o mesmo `saveDB` ─────────
function sistemaDeHoje(){
  const db = { clientes: [], produtos: [], config: { empresa: { nome: 'DIGICOPY' } }, modulosDinamicos: {} };
  const avisos = [];
  const estado = { salvamentos: 0 };
  return {
    db, avisos, estado,
    // as telas de hoje fazem isso o tempo todo:
    criar(lista, dados){ db[lista].push(Object.assign({ id: 'c' + (db[lista].length + 1) + '_' + Math.random().toString(36).slice(2,6) }, dados)); },
    salvarDB(){ estado.salvamentos++; }     // o `saveDB()` do sistema, que a ponte escuta
  };
}
function novoSistema(){
  const app = sistemaDeHoje();
  app.nucleo = N.criar({ empresaId: 'emp1', origem: 'pc-loja' });
  app.ponte = P.ligar({
    db: app.db, nucleo: app.nucleo, origem: 'pc-loja',
    aoPrecisarConfirmar: (lista, ids) => app.avisos.push({ lista, ids }),
    aoMudar: () => { app.estado.salvamentos++; }
  });
  app.salvar = () => { app.salvarDB(); app.ponte.sincronizar(); };   // é assim que fica no app de verdade
  return app;
}

console.log('== A PONTE: telas de hoje + coração novo ==');

console.log('-- 1) ligar numa base que já existe não perde nem inventa nada --');
{
  const app = novoSistema();
  app.criar('clientes', { nome: 'Ana', telefone: '38999990000' });
  app.criar('clientes', { nome: 'Bruno' });
  app.criar('produtos', { nome: 'Toner', preco: 100 });
  const r = app.ponte.primeiraVarredura();      // só leitura: conhece o que já existe
  ok('a primeira varredura acha as 2 listas de registros', r.listas === 2);
  ok('ela NÃO marca ninguém como apagado', r.apagados === 0 && r.massasSuspeitas === 0);
  ok('e não suja a fila da nuvem', app.ponte.mudancas().length === 0);
  app.salvar();
  ok('salvar sem mudar nada não gera mudança', app.ponte.mudancas().length === 0);
  ok('nem lápide', app.nucleo.listar('clientes').length === 2 && app.nucleo.listar('clientes', { somenteApagados: true }).length === 0);
}

console.log('-- 2) o que a tela cria, o coração registra (1 mudança por gravação) --');
{
  const app = novoSistema();
  app.ponte.primeiraVarredura();
  app.criar('clientes', { nome: 'Ana' });
  app.salvar();
  ok('o cliente entrou no coração', app.nucleo.contar('clientes') === 1);
  ok('com versão 1 e a origem do aparelho', app.nucleo.listar('clientes')[0].versao === 1 && app.nucleo.listar('clientes')[0].origem === 'pc-loja');
  ok('e UMA mudança na fila da nuvem', app.ponte.mudancas().length === 1);
  app.criar('clientes', { nome: 'Bruno' });
  app.salvar();
  ok('segunda gravação: 2 mudanças (uma por registro)', app.ponte.mudancas().length === 2);
}

console.log('-- 3) o que a tela EDITA, o coração sabe que é edição --');
{
  const app = novoSistema();
  app.ponte.primeiraVarredura();
  app.criar('clientes', { nome: 'Ana' });
  app.salvar();
  app.db.clientes[0].nome = 'Ana Souza';            // edição do jeito antigo
  app.db.clientes[0].cidade = 'Montes Claros';
  app.salvar();
  const c = app.nucleo.listar('clientes')[0];
  ok('gravou a edição (mesmo id, sem duplicar)', app.nucleo.contar('clientes') === 1 && app.nucleo.contar('clientes', { incluirApagados: true }) === 1);
  ok('a versão subiu para 2', c.versao === 2);
  ok('os dois campos novos estão lá', c.nome === 'Ana Souza' && c.cidade === 'Montes Claros');
  ok('a fila tem criar + editar (2 mudanças)', app.ponte.mudancas().length === 2);
}

console.log('-- 4) EXCLUIR PELA TELA = LÁPIDE (nunca "sumiço") --');
{
  const app = novoSistema();
  app.ponte.primeiraVarredura();
  app.criar('clientes', { nome: 'Ana' });
  app.criar('clientes', { nome: 'Bruno' });
  app.salvar();
  const idAna = app.db.clientes.find(c => c.nome === 'Ana').id;
  app.db.clientes = app.db.clientes.filter(c => c.id !== idAna);   // é assim que a tela exclui hoje
  app.salvar();
  const apagados = app.nucleo.listar('clientes', { somenteApagados: true });
  ok('o registro não desapareceu: virou lápide', apagados.length === 1 && String(apagados[0].id) === String(idAna));
  ok('a lápide diz QUEM apagou', apagados[0].apagadoPor === 'pc-loja');
  ok('a lápide diz POR QUE (foi retirado na tela)', /removido na tela/.test(apagados[0].motivo));
  ok('saiu da lista normal do coração', app.nucleo.contar('clientes') === 1);
  ok('a exclusão entrou na fila da nuvem', app.ponte.mudancas().some(m => String(m.id) === String(idAna) && m.apagadoEm > 0));
}

console.log('-- 5) reabrir o sistema: o apagado NÃO volta (o defeito das rodadas 12/15) --');
{
  const app = novoSistema();
  app.ponte.primeiraVarredura();
  app.criar('clientes', { nome: 'Ana' });
  app.criar('clientes', { nome: 'Bruno' });
  app.salvar();
  const idAna = app.db.clientes.find(c => c.nome === 'Ana').id;
  app.db.clientes = app.db.clientes.filter(c => c.id !== idAna);
  app.salvar();
  // agora "fecha e abre o programa": nova sessão, mesma base do PC (que não tem a Ana)
  const sessao2 = N.criar({ empresaId: 'emp1', origem: 'pc-loja' });
  const ponte2 = P.ligar({ db: app.db, nucleo: sessao2 });
  ponte2.primeiraVarredura();
  ponte2.sincronizar();
  ok('a base do PC não tem a Ana', app.db.clientes.length === 1);
  ok('e a sessão nova também não (nada de lápide esquecida virando registro novo)', sessao2.contar('clientes') === 1);
  ok('ninguém foi marcado como apagado por engano na abertura', sessao2.listar('clientes', { somenteApagados: true }).length === 0);
}

console.log('-- 6) exclusão em MASSA pede confirmação (não acontece por acidente) --');
{
  const app = novoSistema();
  app.ponte.primeiraVarredura();
  for (let i = 0; i < 40; i++) app.criar('clientes', { nome: 'Cliente ' + i });
  app.salvar();
  app.db.clientes = app.db.clientes.slice(0, 5);      // "sumiram" 35 de uma vez
  app.salvar();
  ok('avisou que precisa de confirmação', app.avisos.length === 1 && app.avisos[0].ids.length === 35);
  ok('e NÃO marcou ninguém como apagado', app.nucleo.listar('clientes', { somenteApagados: true }).length === 0);
  ok('os 40 continuam vivos no coração', app.nucleo.contar('clientes') === 40);
  const pend = app.ponte.pendentesDeConfirmacao();
  ok('a lista de pendentes tem os 35 esperando', pend.clientes && pend.clientes.length === 35);
  const conf = app.ponte.confirmarExclusaoEmMassa('clientes');
  ok('confirmando, as 35 viram lápide', conf.apagados === 35 && app.nucleo.listar('clientes', { somenteApagados: true }).length === 35);
  ok('e sobram 5 vivos', app.nucleo.contar('clientes') === 5);
  ok('a tela continua vendo só os 5', app.db.clientes.length === 5);
}
{
  const app = novoSistema();
  app.ponte.primeiraVarredura();
  for (let i = 0; i < 30; i++) app.criar('clientes', { nome: 'Cliente ' + i });
  app.salvar();
  app.db.clientes = app.db.clientes.slice(0, 10);
  app.salvar();
  const rec = app.ponte.recusarExclusaoEmMassa('clientes');
  ok('recusando a exclusão em massa, ninguém é apagado', rec.mantidos === 20 && app.nucleo.listar('clientes', { somenteApagados: true }).length === 0);
  ok('e o coração segue com os 30 (nada se perdeu)', app.nucleo.contar('clientes') === 30);
}

console.log('-- 7) MODO OBSERVAÇÃO: só relata, não muda nada --');
{
  const app = sistemaDeHoje();
  const nucleo = N.criar({ empresaId: 'emp1', origem: 'pc-loja' });
  const ponte = P.ligar({ db: app.db, nucleo, modo: 'observacao' });
  ponte.primeiraVarredura();
  app.criar('clientes', { nome: 'Ana' });
  app.criar('clientes', { nome: 'Bruno' });
  ponte.sincronizar();
  const rel = ponte.relatar();
  ok('o relatório conta os 2 que entrariam', rel.novos === 2);
  ok('mas o coração continua vazio (nada foi gravado)', nucleo.contar('clientes', { incluirApagados: true }) === 0);
  ok('e a fila da nuvem continua zerada', ponte.mudancas().length === 0);
  app.db.clientes = app.db.clientes.filter(c => c.nome !== 'Ana');
  ponte.sincronizar();
  // o relatório PREVÊ a retirada (é para isso que ele serve), mas nada acontece:
  // nem lápide no coração, nem mudança na fila
  ok('o relatório prevê a retirada (1 apagado) sem aplicar nada',
    ponte.relatar().apagados === 1 && ponte.mudancas().length === 0 &&
    nucleo.listar('clientes', { incluirApagados: true }).length === 0);
  ok('e o modo está declarado', ponte.modo() === 'observacao');
}

console.log('-- 8) trazer de volta devolve para a LISTA DA TELA (as mesmas funções continuam) --');
{
  const app = novoSistema();
  app.ponte.primeiraVarredura();
  app.criar('clientes', { nome: 'Ana' });
  app.criar('clientes', { nome: 'Bruno' });
  app.salvar();
  const idAna = app.db.clientes.find(c => c.nome === 'Ana').id;
  app.db.clientes = app.db.clientes.filter(c => c.id !== idAna);
  app.salvar();
  ok('depois de excluir, a tela vê 1', app.db.clientes.length === 1);
  const r = app.ponte.restaurar('clientes', idAna);
  ok('restaurar devolve ok', r.ok === true);
  ok('e o cliente VOLTA para a lista que a tela usa', app.db.clientes.length === 2 && app.db.clientes.some(c => String(c.id) === String(idAna)));
  ok('o coração também considera vivo de novo', app.nucleo.contar('clientes') === 2);
}

console.log('-- 9) exclusão e edição que vêm de OUTRO PC chegam na tela --');
{
  const app = novoSistema();
  app.ponte.primeiraVarredura();
  app.criar('clientes', { nome: 'Ana' });
  app.salvar();
  const id = app.db.clientes[0].id;
  // exclusão feita no PC do gerente (versão 5, mais nova que a daqui)
  app.ponte.aplicarDaNuvem({ lista: 'clientes', id, versao: 5, apagadoEm: Date.now(), origem: 'pc-gerente', dados: { id, nome: 'Ana', versao: 5, apagadoEm: Date.now(), apagadoPor: 'pc-gerente' } });
  ok('a exclusão de outro PC tira o registro da lista da tela', app.db.clientes.length === 0);
  ok('e vira lápide no coração', app.nucleo.listar('clientes', { somenteApagados: true }).length === 1);
  // edição mais nova vinda de outro PC
  app.ponte.aplicarDaNuvem({ lista: 'clientes', id, versao: 6, apagadoEm: 0, atualizadoEm: Date.now(), origem: 'pc-gerente', dados: { id, nome: 'Ana Editada', versao: 6, apagadoEm: 0 } });
  ok('edição mais nova que a lápide traz o registro de volta para a tela', app.db.clientes.length === 1 && app.db.clientes[0].nome === 'Ana Editada');
}

console.log('-- 10) as telas continuam vendo listas NORMAIS (nada de formato estranho) --');
{
  const app = novoSistema();
  app.ponte.primeiraVarredura();
  app.criar('clientes', { nome: 'Ana', telefone: '38999990000' });
  app.salvar();
  ok('db.clientes continua uma lista', Array.isArray(app.db.clientes));
  ok('com os campos da tela no lugar', app.db.clientes[0].nome === 'Ana' && app.db.clientes[0].telefone === '38999990000');
  ok('dá para filtrar, achar e mapear como sempre', app.db.clientes.filter(c => c.nome === 'Ana').length === 1 && app.db.clientes.map(c => c.nome)[0] === 'Ana');
  ok('o resto do db (config, modulosDinamicos) fica intocado', app.db.config.empresa.nome === 'DIGICOPY' && typeof app.db.modulosDinamicos === 'object');
  ok('a ponte não mexe em listas que não são de registros', app.ponte.listas().indexOf('config') < 0);
}

console.log('-- 11-B) IMPORTAR A BASE ANTIGA: o dado do dono nunca é recusado --');
{
  // Lista COM schema (é como o sistema novo vai andar depois da virada): aqui o tipo
  // é cobrado. A base de hoje tem caso assim de verdade — o
  // `automacoes_caixa_chat_auxiliares_patch.js` grava `parcela: '1/1'` (texto) numa
  // conta a pagar, e o preço do produto pode ter sido digitado com vírgula.
  const app = sistemaDeHoje();
  app.db.contasPagar = [];
  app.nucleo = N.criar({ empresaId: 'emp1', origem: 'pc-loja' });
  app.ponte = P.ligar({
    db: app.db, nucleo: app.nucleo, origem: 'pc-loja',
    schemas: {
      produtos: { nome: { obrigatorio: true, tipo: 'texto' }, preco: { tipo: 'numero' } },
      contasPagar: { fornecedor: { obrigatorio: true, tipo: 'texto' }, valor: { tipo: 'numero' }, parcela: { tipo: 'numero' } }
    }
  });
  const salvar = () => { app.salvarDB(); app.ponte.sincronizar(); };   // é assim que fica no app de verdade
  app.db.produtos.push({ id: 'pd1', nome: 'Cartucho 664', preco: '85,90' });
  app.db.contasPagar.push({ id: 'pg1', fornecedor: 'Papelaria', descricao: 'RETIRADA DO CAIXA', valor: 20, parcela: '1/1' });
  app.db.contasPagar.push({ id: 'pg2', descricao: 'sem fornecedor na base antiga', valor: 10 });
  salvar();

  const pd = app.nucleo.obter('produtos', 'pd1');
  ok('o produto antigo entrou com o preço virando número (85,90 → 85.9)', pd && pd.preco === 85.9, pd ? String(pd.preco) : 'não entrou');
  const pg1 = app.nucleo.obter('contasPagar', 'pg1');
  ok('a conta a pagar com parcela "1/1" entrou COMO VEIO (não foi recusada nem virou 11)',
    pg1 && pg1.parcela === '1/1' && pg1.valor === 20, pg1 ? String(pg1.parcela) : 'não entrou');
  ok('o registro antigo sem o campo obrigatório também entrou', !!app.nucleo.obter('contasPagar', 'pg2'));
  const rel = app.ponte.relatar();
  ok('o relatório conta o que entrou fora do padrão (2 registros)',
    rel.camposForaDoPadrao === 2, JSON.stringify(rel));
  ok('e nenhum registro foi recusado (recusadosImpossiveis = 0)', rel.recusadosImpossiveis === 0, String(rel.recusadosImpossiveis));
  ok('os três registros existem no coração (nada sumiu na importação)',
    app.nucleo.contar('produtos') === 1 && app.nucleo.contar('contasPagar') === 2);

  // e o caminho da TELA NOVA continua estrito com o mesmo schema
  const recusa = app.nucleo.salvar('contasPagar', { id: 'pg3', fornecedor: 'Novo', valor: '10,00' });
  ok('a tela nova, com esse mesmo schema, continua recusando texto no lugar de número', !recusa.ok);
}

console.log('-- 11) a ponte não reimplementa o coração (regra de ouro) --');
{
  const bruto = require('fs').readFileSync('novo/ponte.js', 'utf8');
  const codigo = bruto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('não decide conflito por conta própria (quem decide é o núcleo)', !/decisao\s*\(/.test(codigo) || /nucleo\.aplicarDaNuvem/.test(codigo));
  ok('não mexe no armazenamento nem na rede', !/localStorage|fetch\(|XMLHttpRequest/.test(codigo));
  ok('não usa modal nativo', !/\b(alert|confirm|prompt)\s*\(/.test(codigo));
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — a ponte liga as telas de hoje no coração novo.');
