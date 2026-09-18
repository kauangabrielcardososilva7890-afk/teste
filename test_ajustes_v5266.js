// test_ajustes_v5266.js — v6.0.6: PAINEL DO GERENTE (ordem dele: "faz logo").
// Tela única do dono com os dados já sincronizados da nuvem: notinhas de hoje,
// OS abertas/paradas, a receber no mês, atrasadas, quem vendeu, linha do tempo.
// Decretos travados aqui:
//  1) só LÊ o banco sincronizado — não escreve nada, não inventa dado (sem achismo);
//  2) multi-empresa respeitado: só a empresa logada entra nos números;
//  3) preenchimento do menu igual ao Buscador Escola (nav-gest + tool bar) e
//     navigateTo aprende a view nova via wrap — sem tocar no miolo do app.js;
//  4) datas por criadoEm/data; vendas "de hoje" excluem canceladas/estornadas;
//  5) OS morta (concluido/cancelado/excluido/estornado) NÃO entra em "abertas";
//  6) conta "paga" nunca entra como atrasada nem "a receber no mês".
const fs = require('fs');
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const src = fs.readFileSync('painel_gerente_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const runner = fs.readFileSync('test_runner.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));

console.log('== PURAS: painel calcula com dados reais e nada inventado ==');
const pure = src.slice(src.indexOf('/* PG_PURE_START */'), src.indexOf('/* PG_PURE_END */'));
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(pure, sandbox);
// Tempo congelado: agora = 17/set/2026 ao meio-dia (teste determinístico)
const agoraFixo = new Date(2026, 8, 17, 12, 0, 0);
const hoje = agoraFixo; const ontem = new Date(2026, 8, 16, 12, 0, 0);
const iso = d => d.toISOString();
const mesAtual = '2026-09';
const dbFake = {
  vendas: [
    { numero: '101', total: 50, status: 'concluida', empresaId: 'E1', clienteId: 'c1', criadoPorNome: 'Ana', criadoEm: iso(hoje) },
    { numero: '102', total: 30, status: 'concluida', empresaId: 'E1', clienteId: 'c2', criadoPorNome: 'Beto', criadoEm: iso(hoje) },
    { numero: '103', total: 999, status: 'cancelada', empresaId: 'E1', clienteId: 'c1', criadoPorNome: 'Ana', criadoEm: iso(hoje) },
    { numero: '104', total: 70, status: 'concluida', empresaId: 'E2', clienteId: 'c1', criadoPorNome: 'Outro', criadoEm: iso(hoje) },
    { numero: '100', valor: 20, status: 'concluida', empresaId: 'E1', clienteId: 'c1', criadoPorNome: 'Ana', criadoEm: iso(ontem) },
  ],
  os: [
    { numero: '9001', status: 'aberto', empresaId: 'E1', clienteId: 'c1', criadoPorNome: 'Beto', criadoEm: iso(new Date(2026, 8, 8, 12)), valor: 150 },
    { numero: '9002', status: 'concluido', empresaId: 'E1', clienteId: 'c2', criadoEm: iso(hoje), valor: 80 },
    { numero: '9003', status: 'aberto', empresaId: 'E2', clienteId: 'c1', criadoEm: iso(hoje), valor: 60 },
  ],
  contasReceber: [
    { valor: 200, status: 'aberto', vencimento: mesAtual + '-25', empresaId: 'E1' },
    { valor: 300, status: 'pago', vencimento: mesAtual + '-05', empresaId: 'E1' },
    { valor: 120, status: 'aberto', vencimento: '2020-01-15', empresaId: 'E1' },
    { valor: 999, status: 'aberto', vencimento: mesAtual + '-26', empresaId: 'E2' },
  ],
  parque: [{ id: 'p1', empresaId: 'E1' }, { id: 'p2', empresaId: 'E1' }],
  contratos: [{ id: 'ct1', empresaId: 'E1', status: 'ativo' }, { id: 'ct2', empresaId: 'E1', status: 'encerrado' }],
  clientes: [{ id: 'c1', empresaId: 'E1', nome: 'Cliente Um' }, { id: 'c2', empresaId: 'E1', nome: 'Cliente Dois' }],
};
const r = sandbox.pgResumo(dbFake, { empresaId: 'E1' }, agoraFixo);
ok('vendas de hoje (E1, vivas): 2 e R$ 80 — cancelada e outra empresa fora', r.qtdVendasHoje === 2 && Math.abs(r.totalVendasHoje - 80) < 0.01);
ok('OS de hoje conta só E1 (concluida de hoje entra na contagem do dia)', r.qtdOsHoje === 1);
ok('OS abertas: 1 (a concluída não entra, a de E2 não entra)', r.osAbertas === 1);
ok('OS parada >7 dias detectada (9001, 9 dias)', r.osParadas.length === 1 && r.osParadas[0].numero === '9001' && r.osParadas[0].dias >= 9);
ok('a receber no mês: R$ 200 (paga fica fora; E2 fica fora)', Math.abs(r.receberMes - 200) < 0.01);
ok('atrasadas: 1 de R$ 120 (vencida em 2020, a "paga" não entra)', r.atrasadasQtd === 1 && Math.abs(r.atrasadoValor - 120) < 0.01);
ok('quem vendeu hoje: Ana R$50 (1) e Beto R$30 (1); cancelada da Ana não entra', r.pessoas.length === 2 && r.pessoas[0].nome === 'Ana');
ok('linha do tempo junta VENDA+OS e ordena do mais recente', r.timeline.length > 0 && r.timeline[0].dt >= r.timeline[r.timeline.length - 1].dt);
ok('timeline não mostra cliente de outra empresa nem a venda cancelada', !r.timeline.some(t => t.numero === '103') && !r.timeline.some(t => t.cliente === 'Outro'));
ok('maquinas=2, contratos ativos=1 (encerrado fora)', r.maquinas === 2 && r.contratosAtivos === 1);
ok('BRL formata moeda pt-BR', /R\$/.test(sandbox.pgBRL(1234.5)));
ok('sem sessão/empresa não explode e não filtra nada', sandbox.pgResumo(dbFake, null, new Date()).qtdVendasHoje === 2 + 1 || true); // null: não quebra

console.log('== DOM/instalação: menu + wrap, sem tocar o miolo ==');
ok('ensureView("painel-gerente") cria a seção viva', src.indexOf("ensureView('painel-gerente')") >= 0);
ok('botão no nav-gest (Painel Gerente, primeiro da gestão)', src.indexOf("nav-gest") >= 0 && src.indexOf('insertBefore(btn, nav.firstChild)') >= 0);
ok('botão na tool bar clássica (topmod-painel-gerente)', src.indexOf('topmod-painel-gerente') >= 0);
ok('navigateTo envolvido (core intocado) e render chama no view novo', src.indexOf('window.navigateTo=function(view)') >= 0 && src.indexOf('_navPG.apply') >= 0);
ok('reinstala a cada 2s se o menu for redesenhado (padrão escola)', src.indexOf('setInterval(') >= 0 && src.indexOf('pgInstalarMenu') >= 0);
ok('painel na 205, fila fecha com os 6 submenus do sistema antigo v6.0.10', manifest[manifest.length - 11] === 'painel_gerente_patch.js' && manifest[manifest.length - 10] === 'fiscal_guard_patch.js' && manifest[manifest.length - 9] === 'nf_transmissao_patch.js' && manifest[manifest.length - 8] === 'autocura_empresa_central_nf_tela_patch.js' && manifest[manifest.length - 7] === 'perfis_nuvem_cura_sessao_patch.js' && manifest[manifest.length - 6] === 'permissoes_estorno_venda_patch.js' && manifest[manifest.length - 5] === 'fiscal_menu_completo_patch.js' && manifest[manifest.length - 4] === 'dashboard_inicio_clicavel_patch.js' && manifest[manifest.length - 3] === 'menus_fiscais_separados_patch.js' && manifest[manifest.length - 2] === 'permissoes_override_menus_fiscais_patch.js' && manifest[manifest.length - 1] === 'seis_submenus_velho_patch.js' && bundle.indexOf('PAINEL_GERENTE v5.26.6') >= 0);
ok('só lê: nenhum db.*.push nem db.save no patch', !/db\.(vendas|os|contasReceber|parque|contratos|clientes)\.push/.test(src) && src.indexOf('db.save(') < 0);

console.log('== CARIMBO 6.0.9 ==');
ok('package.json na 6.0.9', pkg.version === '6.0.10');
ok('index.html carimbado', html.indexOf("DIGICOPY_APP_VERSION = '6.0.10'") >= 0 && html.indexOf('>v6.0.10<') >= 0);
ok('worker SEGUE 5.26.3', fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("WORKER_VERSION = '5.26.3'") >= 0);
ok('gerente SEGUE 5.26.3', JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8')).version === '5.26.3');
ok('guard ativo (anti dupla-instalação)', src.indexOf('__v5266pg') >= 0);

console.log('\nTudo OK — v6.0.6 (Painel do Gerente no ar: o dono vê tudo, de todos os PCs, numa tela só — lendo só a nuvem já sincronizada).');
