// ═══════════════════════════════════════════════════════════════════════════
// TESTE v6.1.8 — LEMBRAR A TELA (última ordenação + último filtro)
//
// Pedido dele: escolheu "só o básico" e perguntou "vai atualizar mesmo assim
// né?" → este teste prova que sim: anota sozinho a cada uso, por USUÁRIO, e
// guarda na NUVEM (nada no PC/navegador). E prova também o que ele NÃO quis:
// mexer em colunas (largura/ocultar) está fora.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');

let falhas = 0;
function ok(cond, msg) { if (cond) console.log('  ✔ ' + msg); else { falhas++; console.error('  ✘ ' + msg); } }
function ler(p) { return fs.readFileSync(p, 'utf8'); }

const arquivo = 'ajustes_v6108_lembrar_tela_patch.js';
const code = ler(arquivo);
const P = (function () {
  const ctx = { window: {}, document: undefined, db: {} };
  new Function('window', 'document', 'db', code)(ctx.window, ctx.document, ctx.db);
  return ctx.window.LT6108_PURE;
})();

console.log('\n== 1) Parte pura: quem, o quê e de quem é a memória ==');
ok(!!P, 'o módulo exporta a parte pura (LT6108_PURE)');
ok(P.ltUsuario({ login: 'DONO' }) === 'dono', 'a memória é por USUÁRIO (login, sem depender de maiúscula)');
ok(P.ltUsuario(null) === '', 'sem sessão, ninguém é anotado');

console.log('\n== 2) Só campo de FILTRO entra (formulário nunca) ==');
ok(P.ltEhFiltro('filtro-clientes', 'INPUT') === true, 'filtro-... conta como filtro');
ok(P.ltEhFiltro('buscaProduto', 'INPUT') === true, 'busca... conta como filtro');
ok(P.ltEhFiltro('search-auditoria', 'INPUT') === true, 'search-... conta como filtro');
ok(P.ltEhFiltro('f-cli-nome', 'INPUT') === false, 'campo de cadastro (nome do cliente) NUNCA é filtro');
ok(P.ltEhFiltro('venda-valor', 'INPUT') === false, 'campo de valor de venda NUNCA é filtro');
ok(P.ltEhFiltro('filtro-x', 'BUTTON') === false, 'só input/select entram (botão não)');
ok(P.ltEhFiltro('', 'INPUT') === false, 'campo sem id fica de fora (não dá para devolver depois)');

console.log('\n== 3) Reaplicar a ordenação certa ==');
ok(P.ltProximoClique('', 'asc') === 1, 'sem seta → um clique põe A→Z');
ok(P.ltProximoClique('', 'desc') === 2, 'sem seta → dois cliques põem Z→A');
ok(P.ltProximoClique('asc', 'desc') === 1, 'seta A→Z → um clique troca para Z→A');
ok(P.ltProximoClique('asc', 'asc') === 0, 'já está do jeito dele → nenhum clique');
ok(P.ltProximoClique('asc', '') === 0, 'sem ordenação guardada → não mexe');

console.log('\n== 4) Guardar/ler/esquecer (na nuvem, por usuário e por tela) ==');
const db = { config: {} };
P.ltGravar(db, 'dono', 'vendas', { tabela: { i: 0, coluna: 2, dir: 'desc' }, filtros: { 'filtro-vendas': 'aberta' } });
ok(!!db.config.lembraTela && !!db.config.lembraTela.telas, 'grava em db.config.lembraTela (é isso que sobe para a nuvem)');
ok(P.ltLer(db, 'dono', 'vendas').tabela.coluna === 2, 'lê de volta a coluna ordenada');
ok(P.ltLer(db, 'dono', 'vendas').filtros['filtro-vendas'] === 'aberta', 'lê de volta o filtro');
ok(P.ltLer(db, 'recepcao', 'vendas') === null, 'a memória de um usuário NÃO aparece para o outro');
ok(P.ltLer(db, 'dono', 'clientes') === null, 'cada tela tem a sua memória');
ok(P.ltEsquecer(db, 'dono', 'vendas') === true && P.ltLer(db, 'dono', 'vendas') === null, 'dá para esquecer a memória de uma tela');

console.log('\n== 5) Como está ligado no sistema ==');
ok(code.indexOf('saveDB') >= 0, 'salva pela função do sistema (sobe para a nuvem)');
ok(!/localStorage\s*\.\s*(get|set|remove)Item|window\.localStorage/.test(code), 'não guarda nada no navegador (regra #44)');
ok(code.indexOf('__v6108lembra') >= 0 && /navigateTo\.__v6108lembra/.test(code), 'a tela é reaplicada quando abre (navigateTo aprende, sem quebrar as antigas)');
ok(/LT_APLICANDO/.test(code), 'tem trava para não entrar em laço ao reaplicar');
ok(/clearTimeout\(LT_TIMER\)/.test(code) && /800/.test(code), 'espera ele parar de digitar antes de gravar (PC fraco)');
ok(/JSON\.stringify\(antes\)===JSON\.stringify\(dados\)/.test(code), 'não grava de novo se nada mudou');
ok(/th\.dataset/.test(code) && /hsDir/.test(code), 'anota a ordenação pelo mesmo mecanismo do clique no título (historico_sort)');
ok(!/columnWidth|colgroup|style\.width|ocultarColuna|col\.hidden/i.test(code), 'NÃO mexe em colunas (foi o que ele escolheu: só o básico)');
ok(!/\balert\(|\bprompt\(|\bconfirm\(/.test(code), 'sem modal nativo do navegador (regra #16)');
ok(ler('bundle-manifest.json').indexOf(arquivo) >= 0, 'está no bundle (senão não roda no sistema)');
ok(ler('test_runner.js').indexOf('test_lembrar_tela.js') >= 0, 'o próprio teste está na suíte');

console.log('\nRESULTADO: ' + (falhas === 0 ? 'a tela lembra do jeito dele (só o básico)!' : falhas + ' falha(s)'));
if (falhas) process.exitCode = 1;
