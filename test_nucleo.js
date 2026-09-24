// test_nucleo.js — v1.0.0 (fase 1 do redesenho)
// Prova o coração novo (novo/nucleo.js) contra os defeitos que deram trabalho nas
// rodadas 12 a 16. Cada verificação aqui é uma regra do núcleo — se alguma quebrar,
// a suíte para na hora.
//
// O que é provado:
//   1) gravar/editar (versão, origem, sem duplicar)
//   2) validação bloqueia e não grava NADA
//   3) apagar é MARCAR (lápide com quem/quando/motivo) — nunca sai da lista
//   4) apagado não volta sozinho (nem por sincronização)
//   5) edição mais nova que a lápide vence (a regra da rodada 15)
//   6) apagamento vindo de outro PC vale (versão maior)
//   7) restaurar é ação explícita
//   8) fila de mudanças: uma por gravação, na ordem, sem perder nem duplicar
//   9) achar registro é pelo índice (prova de tempo com 20 mil itens)
//  10) guardar/abrir preserva lápide, versão e data
//  11) o núcleo não tem tela nem rede (sem alert/confirm/prompt/localStorage/fetch)
require('./novo/nucleo.js');
const N = globalThis.DIGICOPY_NUCLEO;
const fs = require('fs');

let passou = 0;
function ok(nome, cond){ if(!cond){ console.error('  \u2718 ' + nome); process.exit(1); } console.log('  \u2714 ' + nome); passou++; }

console.log('== NÚCLEO NOVO (fase 1 do redesenho) ==');
ok('o núcleo carrega e se identifica (v' + N.VERSAO_NUCLEO + ')', !!N && N.VERSAO_NUCLEO === '1.0.0');

function novoNucleo(extra){
  const n = N.criar(Object.assign({ empresaId: 'emp1', origem: 'pc-loja' }, extra || {}));
  n.registrarLista('clientes', { nome: { obrigatorio: true, tipo: 'texto' }, fone: { tipo: 'texto' }, limite: { tipo: 'numero' } });
  n.registrarLista('produtos', { nome: { obrigatorio: true, tipo: 'texto' }, preco: { tipo: 'numero' } });
  return n;
}

console.log('-- 1) gravar e editar --');
{
  const n = novoNucleo();
  const r1 = n.salvar('clientes', { nome: 'Ana', fone: '38999990000' });
  ok('cria com id, versão 1, origem e data', r1.ok && r1.item.id && r1.item.versao === 1 && r1.item.origem === 'pc-loja' && r1.item.atualizadoEm > 0);
  ok('nasce vivo (sem lápide)', r1.item.apagadoEm === 0);
  const r2 = n.salvar('clientes', { id: r1.item.id, nome: 'Ana Souza', fone: '38999990000' });
  ok('editar mantém o MESMO id e sobe a versão', r2.ok && r2.item.id === r1.item.id && r2.item.versao === 2);
  ok('não duplica (uma linha só na lista)', n.listar('clientes').length === 1);
  ok('a lista cresce certa no resumo', n.resumo().listas.clientes.vivos === 1 && n.resumo().listas.clientes.apagados === 0);
  ok('campo extra não declarado no schema é PRESERVADO (não perde dado)', (() => {
    const r = n.salvar('clientes', { id: r1.item.id, nome: 'Ana Souza', observacao: 'cliente antigo' });
    return r.ok && n.obter('clientes', r1.item.id).observacao === 'cliente antigo';
  })());
  ok('lista desconhecida dá erro claro', (() => { try { n.salvar('inexistente', {}); return false; } catch (e) { return /lista desconhecida/.test(e.message); } })());
}

console.log('-- 2) validação bloqueia e não grava nada --');
{
  const n = novoNucleo();
  const antes = n.mudancas().length;
  const r = n.salvar('clientes', { fone: '38999990000' });
  ok('sem o obrigatório devolve erro', !r.ok && r.erros.length === 1 && /nome/.test(r.erros[0]));
  ok('nada foi gravado', n.listar('clientes').length === 0);
  ok('nada entrou na fila da nuvem', n.mudancas().length === antes);
  const rt = n.salvar('clientes', { nome: 'Ana', limite: 'muito' });
  ok('tipo errado também bloqueia', !rt.ok && /limite/.test(rt.erros[0]));
}

console.log('-- 3) apagar é MARCAR (lápide), nunca apagar de verdade --');
{
  const n = novoNucleo();
  const { item } = n.salvar('clientes', { nome: 'Bruno' });
  const fora = n.apagar('clientes', item.id, 'pediu para excluir');
  const dentro = n.obter('clientes', item.id);
  ok('a exclusão devolve o registro marcado', fora.ok && dentro.apagadoEm > 0);
  ok('a lápide tem QUEM apagou', dentro.apagadoPor === 'pc-loja');
  ok('a lápide tem POR QUE apagou', /pediu para excluir/.test(dentro.motivo));
  ok('a exclusão sobe a versão (não é só um "sumiço")', dentro.versao === 2);
  ok('o registro CONTINUA na lista de dentro (nada de splice)', n.paraJSON().listas.clientes.itens.length === 1);
  ok('mas sai da listagem normal', n.listar('clientes').length === 0);
  ok('e aparece quando se pede os apagados', n.listar('clientes', { somenteApagados: true }).length === 1);
  ok('apagar de novo não muda nada (idempotente)', n.apagar('clientes', item.id).jaEstava === true);
}

console.log('-- 4) apagado NÃO volta sozinho (o defeito das rodadas 12/15) --');
{
  const n = novoNucleo();
  const { item } = n.salvar('clientes', { nome: 'Carla' });
  n.apagar('clientes', item.id, 'excluído de propósito');
  // a nuvem manda a MESMA versão de antes (um PC velho reenviando o cadastro)
  const r = n.aplicarDaNuvem({ lista: 'clientes', id: item.id, versao: 1, dados: { id: item.id, nome: 'Carla', versao: 1, apagadoEm: 0 } });
  ok('mudança velha da nuvem é ignorada (não ressuscita)', r.aplicado === false && /venceu/.test(r.motivo));
  ok('e o registro segue apagado', n.obter('clientes', item.id).apagadoEm > 0);
  ok('a listagem normal continua vazia', n.listar('clientes').length === 0);
  // agora a nuvem manda uma EDIÇÃO mais nova que a lápide (outro PC editou depois)
  const r2 = n.aplicarDaNuvem({ lista: 'clientes', id: item.id, versao: 3, atualizadoEm: Date.now() + 1000, origem: 'pc-2', dados: { id: item.id, nome: 'Carla Editada', versao: 3, apagadoEm: 0 } });
  ok('edição MAIS NOVA que a lápide vence e o registro volta (regra da rodada 15)', r2.aplicado === true && n.obter('clientes', item.id).nome === 'Carla Editada');
}

console.log('-- 5) exclusão vinda de outro computador vale (e não perde edição nova) --');
{
  const n = novoNucleo();
  const { item } = n.salvar('produtos', { nome: 'Toner', preco: 100 });
  const r = n.aplicarDaNuvem({ lista: 'produtos', id: item.id, versao: 5, apagadoEm: Date.now(), origem: 'pc-gerente', dados: { id: item.id, nome: 'Toner', preco: 100, versao: 5, apagadoEm: Date.now(), apagadoPor: 'pc-gerente', motivo: 'produto fora de linha' } });
  ok('exclusão de outro PC é aplicada', r.aplicado === true && n.obter('produtos', item.id).apagadoEm > 0);
  ok('e some da listagem normal', n.listar('produtos').length === 0);
  ok('editar um registro apagado é RECUSADO (nada volta sozinho)', (() => {
    const r = n.salvar('produtos', { id: item.id, nome: 'Toner', preco: 120 });
    return !r.ok && r.apagado === true && /apagado/.test(r.erros[0]);
  })());
  n.restaurar('produtos', item.id);                       // ação explícita
  const { item: it2 } = n.salvar('produtos', { id: item.id, preco: 120 });   // agora sim edita (v6, vivo)
  const r2 = n.aplicarDaNuvem({ lista: 'produtos', id: item.id, versao: 5, apagadoEm: 1, origem: 'pc-gerente', dados: { id: item.id, versao: 5, apagadoEm: 1 } });
  ok('exclusão velha não apaga a minha edição mais nova', r2.aplicado === false && n.obter('produtos', item.id).apagadoEm === 0 && it2.versao >= 6);
}

console.log('-- 6) dois computadores decidem IGUAL (determinístico) --');
{
  const a = { id: 'x', versao: 4, apagadoEm: 0, atualizadoEm: 1000, origem: 'pc-a' };
  const b = { id: 'x', versao: 4, apagadoEm: 0, atualizadoEm: 1000, origem: 'pc-b' };
  ok('empate total: a origem decide sempre o mesmo lado', N.decisao(a, b) === 'remoto' && N.decisao(b, a) === 'local');
  ok('versão maior vence sempre', N.decisao({ versao: 7 }, { versao: 6 }) === 'local' && N.decisao({ versao: 6 }, { versao: 7 }) === 'remoto');
  ok('sem local, a nuvem entra', N.decisao(null, { versao: 1 }) === 'remoto');
}

console.log('-- 7) restaurar é AÇÃO EXPLÍCITA --');
{
  const n = novoNucleo();
  const { item } = n.salvar('clientes', { nome: 'Dora' });
  n.apagar('clientes', item.id);
  const r = n.restaurar('clientes', item.id);
  ok('restaura e limpa a lápide', r.ok && n.obter('clientes', item.id).apagadoEm === 0);
  ok('restaurar sobe a versão (fica mais novo que a exclusão)', n.obter('clientes', item.id).versao === 3);
  ok('volta para a listagem normal', n.listar('clientes').length === 1);
  ok('restaurar o que não está apagado não faz nada', n.restaurar('clientes', item.id).jaEstava === true);
}

console.log('-- 8) fila da nuvem: uma mudança por gravação, na ordem --');
{
  const guardados = [];
  const n = novoNucleo({ guardar: () => guardados.push(1) });
  const { item } = n.salvar('clientes', { nome: 'Eva' });
  n.salvar('clientes', { id: item.id, nome: 'Eva Maria' });
  n.apagar('clientes', item.id, 'teste');
  const fila = n.mudancas();
  ok('3 ações = 3 mudanças na fila', fila.length === 3);
  ok('na ordem em que aconteceram (1 criar, 2 editar, 3 apagar)', fila[0].versao === 1 && fila[1].versao === 2 && fila[2].apagadoEm > 0);
  ok('cada mudança diz a lista, o id e a versão', fila.every(m => m.lista === 'clientes' && m.id === item.id && m.versao > 0));
  ok('guardar() foi chamado a cada gravação (o que estiver plugado é avisado)', guardados.length === 3);
  const c = n.confirmarEnvio(fila[1].seq);
  ok('confirmar até a 2ª deixa só a 3ª pendente', c.confirmadas === 2 && n.mudancas().length === 1);
  ok('o que não foi confirmado continua na fila (nada se perde)', n.mudancas()[0].seq === fila[2].seq);
  n.confirmarEnvio();
  ok('confirmar tudo esvazia a fila', n.mudancas().length === 0);
  // importar base existente (usado pela ponte na primeira varredura): conhece sem
  // fingir que é novidade para a nuvem
  const imp = n.salvar('produtos', { nome: 'Toner importado', preco: 10 }, { semFila: true });
  ok('importar base existente não cria mudança para a nuvem', imp.ok && n.mudancas().length === 0);
  ok('mas o registro passa a ser conhecido (e versionado)', n.obter('produtos', imp.item.id).versao === 1);
}

console.log('-- 9) achar registro é pelo índice (sem varrer a lista) --');
{
  const n = novoNucleo();
  const ids = [];
  for (let i = 0; i < 20000; i++) ids.push(n.salvar('clientes', { nome: 'Cliente ' + i }).item.id);
  const t0 = Date.now();
  let achou = 0;
  for (let i = 0; i < 2000; i++) if (n.obter('clientes', ids[i * 7 % ids.length])) achou++;
  const ms = Date.now() - t0;
  ok('20.000 registros cadastrados', n.contar('clientes') === 20000);
  ok('2.000 buscas em ' + ms + ' ms (limite: 50 ms) — não varre a lista', achou === 2000 && ms < 50);
  const t1 = Date.now();
  n.apagar('clientes', ids[12345], 'teste');
  ok('apagar no meio de 20 mil é imediato (' + (Date.now() - t1) + ' ms)', n.obter('clientes', ids[12345]).apagadoEm > 0);
}

console.log('-- 10) guardar e abrir preservam lápide, versão e data --');
{
  const n = novoNucleo();
  const { item } = n.salvar('clientes', { nome: 'Fábio' });
  n.apagar('clientes', item.id, 'motivo do teste');
  const foto = JSON.parse(JSON.stringify(n.paraJSON()));
  const m = novoNucleo();
  m.carregarDeJSON(foto);
  const voltou = m.obter('clientes', item.id);
  ok('o apagado continua apagado depois de abrir', voltou.apagadoEm > 0 && voltou.motivo === 'motivo do teste');
  ok('a versão é a mesma de antes de guardar', voltou.versao === 2);
  ok('a origem de quem apagou ficou guardada', voltou.apagadoPor === 'pc-loja');
  ok('a listagem normal segue vazia depois de abrir', m.listar('clientes').length === 0);
}

console.log('-- 10-B) O NÚMERO DE SÉRIE (o `seqObter` de hoje: apagar nunca devolve número) --');
{
  const n = novoNucleo();
  n.registrarLista('vendas', { numero: { tipo: 'texto' } });
  const daSerie = () => n.proximoNumeroDaSerie('venda', n.listar('vendas'), (v) => v && v.numero);

  ok('série vazia começa em 1', daSerie().numero === '1' && daSerie().seq === 1);
  ok('a LEITURA não gasta número (ler duas vezes dá o mesmo)', daSerie().numero === daSerie().numero);
  ok('número com letra conta pelo último grupo de dígitos (AB-9 → 9, VD-2026-0042 → 42)',
    n.numeroInteiro('AB-9') === 9 && n.numeroInteiro('VD-2026-0042') === 42 && n.numeroInteiro('') === 0);

  const v1 = n.salvar('vendas', { numero: n.proximoNumero('venda', n.listar('vendas'), (v) => v && v.numero) });
  const v2 = n.salvar('vendas', { numero: n.proximoNumero('venda', n.listar('vendas'), (v) => v && v.numero) });
  ok('gravar gasta o número na ordem (1 e depois 2)', v1.item.numero === '1' && v2.item.numero === '2');

  n.apagar('vendas', v2.item.id, 'venda apagada pelo teste');
  ok('APAGAR NÃO DEVOLVE O NÚMERO: com a venda 2 apagada, a próxima é a 3',
    n.proximoNumero('venda', n.listar('vendas'), (v) => v && v.numero) === '3');

  ok('o contador é um registro do núcleo (aparece na fila da nuvem como qualquer gravação)',
    !!n.obter(n.LISTA_SERIES, 'venda') && n.obter(n.LISTA_SERIES, 'venda').seq === 3);
  const foto = JSON.parse(JSON.stringify(n.paraJSON()));
  const m = novoNucleo();
  m.carregarDeJSON(foto);
  ok('o contador sobrevive a guardar e abrir (restauração, backup, nuvem)',
    m.obter(m.LISTA_SERIES, 'venda').seq === 3 &&
    m.proximoNumero('venda', m.listar('vendas'), (v) => v && v.numero) === '4');

  const z = novoNucleo();
  z.registrarLista('vendas', { numero: { tipo: 'texto' } });
  z.salvar('vendas', { numero: '50' });
  ok('se o contador se perder, o maior número existente puxa ele de volta (não repete)',
    z.proximoNumero('venda', z.listar('vendas'), (v) => v && v.numero) === '51');
  ok('e o contador nunca anda para trás', z.obter(z.LISTA_SERIES, 'venda').seq === 51);
}

console.log('-- 10-C) IMPORTAÇÃO DA BASE ANTIGA: nunca recusa (senão o dado some na virada) --');
{
  const n = novoNucleo();
  n.registrarLista('contasReceber', { descricao: { tipo: 'texto' }, valor: { tipo: 'numero' }, parcela: { tipo: 'numero' } });

  // 1) a TELA NOVA continua estrita (nada de texto onde o schema pede número)
  const recusado = n.salvar('contasReceber', { id: 'x1', descricao: 'novo', valor: '80,00' });
  ok('a tela nova continua sendo recusada quando manda texto no lugar de número',
    !recusado.ok && /valor devia ser numero/.test(recusado.erros.join(' ')), JSON.stringify(recusado.erros || []));
  ok('e nada entrou no coração', n.contar('contasReceber') === 0);

  // 2) a IMPORTAÇÃO (a ponte) casa o tipo quando dá
  const importado = n.salvar('contasReceber', { id: 'x1', descricao: 'título antigo', valor: '80,00', parcela: '2' }, { importando: true });
  ok('importando: "80,00" vira 80 (número)', importado.ok && importado.item.valor === 80, String(importado.item && importado.item.valor));
  ok('importando: "2" vira 2', importado.item.parcela === 2, String(importado.item.parcela));
  ok('e não sobra aviso quando casou tudo', (importado.avisos || []).length === 0, JSON.stringify(importado.avisos || []));

  // 3) o que NÃO dá para casar entra COMO VEIO — e o aviso volta para quem importou
  //    (caso real da base de hoje: `parcela: '1/1'` na retirada de caixa)
  const estranho = n.salvar('contasReceber', { id: 'x2', descricao: 'RETIRADA DO CAIXA', valor: 20, parcela: '1/1' }, { importando: true });
  ok('importando: texto onde o schema pede número NÃO é recusado (o registro entra)',
    estranho.ok && n.obter('contasReceber', 'x2').parcela === '1/1', String(n.obter('contasReceber', 'x2').parcela));
  ok('e o aviso volta para quem importou (nada de "sumiu e ninguém viu")',
    (estranho.avisos || []).length === 1 && /parcela/.test(estranho.avisos.join(' ')), JSON.stringify(estranho.avisos || []));

  // 3-B) o conversor NÃO INVENTA número (senão vira mentira na base do dono)
  ok('"1/1" NÃO vira 11 (o valor fica como veio)', n.numeroDoTexto('1/1') === null);
  ok('"R$ 80" e "abc" também não viram número', n.numeroDoTexto('R$ 80') === null && n.numeroDoTexto('abc') === null);
  ok('o que é número de verdade casa: "80" → 80, "80,00" → 80, "80.00" → 80, "1.234,56" → 1234.56',
    n.numeroDoTexto('80') === 80 && n.numeroDoTexto('80,00') === 80 &&
    n.numeroDoTexto('80.00') === 80 && n.numeroDoTexto('1.234,56') === 1234.56);
  ok('campo vazio e nulo continuam como estavam', n.numeroDoTexto('') === null && n.numeroDoTexto(null) === null);

  // 4) campo obrigatório faltando também não recusa na importação
  n.registrarLista('contasPagar', { fornecedor: { obrigatorio: true, tipo: 'texto' }, valor: { tipo: 'numero' } });
  const cp = n.salvar('contasPagar', { id: 'p1', descricao: 'sem fornecedor na base antiga' }, { importando: true });
  ok('importando: registro sem o campo obrigatório entra (avisa, não recusa)',
    cp.ok && !!n.obter('contasPagar', 'p1') && (cp.avisos || []).length === 1, JSON.stringify(cp.avisos || []));
  const outro = novoNucleo();
  outro.registrarLista('contasPagar', { fornecedor: { obrigatorio: true, tipo: 'texto' } });
  ok('a TELA NOVA continuaria recusando esse mesmo registro (a trava da importação é só dela)',
    !outro.salvar('contasPagar', { id: 'p2', descricao: 'sem fornecedor' }).ok);

  // 5) importar de novo não suja a fila quando vem com `semFila` (é o primeiro passo da ponte)
  const antesFila = n.mudancas().length;
  n.salvar('contasReceber', { id: 'x1', descricao: 'título antigo', valor: 80, parcela: 2 }, { importando: true, semFila: true });
  ok('importação com semFila não vira mudança para a nuvem', n.mudancas().length === antesFila);
  ok('e o registro continua íntegro no coração', n.obter('contasReceber', 'x1').valor === 80);
}

console.log('-- 11) o núcleo não tem tela nem rede --');
{
  const bruto = fs.readFileSync('novo/nucleo.js', 'utf8');
  // comenta'rio explicando o que NA~O e' feito na~o e' co'digo: tira os comentarios
  const codigo = bruto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const proibido = ['alert(', 'confirm(', 'prompt(', 'localStorage', 'fetch(', 'XMLHttpRequest', 'document.'];
  const achados = proibido.filter(p => codigo.indexOf(p) >= 0);
  ok('nenhum ' + proibido.join(' / ') + ' no coração' + (achados.length ? ' — ACHOU: ' + achados.join(', ') : ''), achados.length === 0);
  ok('não fala de senha nem de token no código', !/senha|token/i.test(codigo));
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — o coração novo cumpre as 5 regras.');
