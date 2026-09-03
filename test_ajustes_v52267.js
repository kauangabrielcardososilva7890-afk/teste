// ═══════════════════════════════════════════════════════════════════════════
// TESTE — relatório do usuário (v5.22.67)
//   1.1 volta pro login sozinho     1.2 backup só no botão
//   1.3 menu passa da borda         2.1 aviso EPSON não estoura a folha
//   2.2 venda salva no financeiro   2.3 data um dia a menos
//   3.1 filtro cidade nos contratos 4.1 impressora em lista, dois cliques
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let falhas = 0;
function ok(nome, cond) {
  if (cond) console.log('  \u2714 ' + nome);
  else { console.log('  \u2718 ' + nome); falhas++; }
}
const ler = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const pkg = JSON.parse(ler('package.json'));
const manifest = JSON.parse(ler('bundle-manifest.json'));

console.log('== RELATÓRIO v5.22.67 ==');

// ── 1.1 volta pro login sozinho ────────────────────────────────────────────
{
  const fonte = ler('sistema_clientes_loja_patch.js');
  const win = { console: { log() {} }, document: undefined };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const P = win.SISTEMA_CLIENTES_LOJA_PURE;
  ok('1.1 módulo do login diário exporta as funções', !!(P && P.exigirLoginDiario && P.diaLocalDe));

  // diaLocalDe usa o dia LOCAL, nunca o UTC
  const noite = new Date(2026, 8, 1, 23, 30, 0);
  ok('1.1 dia local não pula para o dia seguinte à noite', P.diaLocalDe(noite) === '2026-09-01');
  ok('1.1 dia local aguenta lixo', P.diaLocalDe('xxxx') === '' && P.diaLocalDe(null) === '');

  // simula a sessão dentro do próprio módulo
  function rodar(sessao) {
    const w = { console: { log() {} } };
    w.window = w;
    const guardado = { sessao: sessao ? Object.assign({}, sessao) : null, deslogou: false };
    w.localStorage = {
      getItem: () => guardado.sessao ? JSON.stringify(guardado.sessao) : null,
      setItem: (_k, v) => { guardado.sessao = JSON.parse(v); },
      removeItem: () => { guardado.sessao = null; guardado.deslogou = true; }
    };
    w.getSession = () => guardado.sessao;
    w.setSession = s => { guardado.sessao = s; };
    w.clearSession = () => { guardado.sessao = null; guardado.deslogou = true; };
    w.toast = () => {};
    vm.createContext(w);
    vm.runInContext(fonte, w);
    const r = w.SISTEMA_CLIENTES_LOJA_PURE.exigirLoginDiario();
    return { deslogou: guardado.deslogou || r === true, sessao: guardado.sessao };
  }

  const hoje = new Date();
  const hojeStr = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');

  // ERA O BUG: sessão sem carimbo caía a cada 60 segundos
  const semCarimbo = rodar({ usuarioId: 'u1', loginAt: hoje.toISOString() });
  ok('1.1 sessão de hoje sem carimbo NÃO desloga', semCarimbo.deslogou === false);
  ok('1.1 e o carimbo passa a existir', semCarimbo.sessao && semCarimbo.sessao.loginDia === hojeStr);

  const semNada = rodar({ usuarioId: 'u1' });
  ok('1.1 sessão sem loginAt nenhum também não desloga', semNada.deslogou === false);

  const carimbada = rodar({ usuarioId: 'u1', loginDia: hojeStr });
  ok('1.1 sessão carimbada de hoje continua logada', carimbada.deslogou === false);

  const ontem = rodar({ usuarioId: 'u1', loginDia: '2020-01-01', loginAt: '2020-01-01T10:00:00' });
  ok('1.1 virou o dia = pede login de novo', ontem.deslogou === true);

  ok('1.1 sem sessão não faz nada', rodar(null).deslogou === false);
}

// ── 1.2 backup só quando clicar ────────────────────────────────────────────
{
  const fonte = ler('ajustes_v52024_patch.js');
  ok('1.2 não existe mais backup automático', !/rodarBackupDiario|agendarBackupDiario/.test(fonte));
  ok('1.2 não chama mais o saveDaily sozinho', !/saveDaily/.test(fonte));
  ok('1.2 nenhum temporizador sobrou no módulo', !/setInterval/.test(fonte));
  ok('1.2 o botão Backup continua funcionando', /window\.exportBackup\s*=/.test(fonte));
  ok('1.2 nenhum outro arquivo do bundle chama saveDaily',
     manifest.every(f => !/backupAPI[\s\S]{0,40}saveDaily/.test(ler(f))));
}

// ── 1.3 menu passando da borda ─────────────────────────────────────────────
{
  const fonte = ler('menus_tela_pequena_patch.js');
  const win = { console: { log() {} } };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const P = win.MENUS_TELA_PEQUENA_PURE;
  const janela = { largura: 1024, altura: 600 };

  ok('1.3 menu que cabe não é tocado',
     P.ajusteNecessario({ top: 100, left: 100, largura: 220, altura: 200 }, janela) === null);

  const alto = P.ajusteNecessario({ top: 100, left: 100, largura: 220, altura: 900 }, janela);
  ok('1.3 menu alto demais ganha rolagem', !!alto && alto.alturaMax > 0 && alto.alturaMax <= 500);
  ok('1.3 a rolagem respeita a altura mínima',
     P.ajusteNecessario({ top: 580, left: 10, largura: 220, altura: 400 }, janela).alturaMax === P.MIN_ALTURA);

  const largo = P.ajusteNecessario({ top: 50, left: 900, largura: 300, altura: 100 }, janela);
  ok('1.3 menu que vaza pela direita é puxado para dentro', !!largo && largo.deslocarX < 0);
  ok('1.3 e nunca é empurrado para fora pela esquerda',
     900 + largo.deslocarX >= 0);

  ok('1.3 o módulo está no bundle', manifest.includes('menus_tela_pequena_patch.js'));
  ok('1.3 não mexe no APK', !/capacitor|cordova/i.test(fonte));
}

// ── 2.1 aviso EPSON sem estourar a folha ───────────────────────────────────
{
  const fonte = ler('ajustes_v52239_print_escolha_patch.js');
  const win = { console: { log() {} } };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const P = win.V52239_PRINT_PURE;

  ok('2.1 o aviso continua existindo', /EPSON/.test(fonte));
  ok('2.1 conta que cabe não encolhe nada', P.fatorParaCaber(900, 1000) === 1);
  ok('2.1 conta que passa encolhe o suficiente', P.fatorParaCaber(1100, 1000) <= 1000 / 1100 + 0.01);
  ok('2.1 nunca encolhe abaixo do legível', P.fatorParaCaber(5000, 1000) === 0.7);
  ok('2.1 conta aguenta valores vazios', P.fatorParaCaber(0, 1000) === 1);

  const os = P.aplicarTipo('<html><body><div class="pagina meia">x</div></body></html>', 'os');
  ok('2.1 OS sai em folha inteira', /pagina inteira/.test(os));
  ok('2.1 OS leva o ajuste de uma folha só', /régua/.test(os));
  ok('2.1 o ajuste não é injetado duas vezes', (P.injetarUmaFolha(os).match(/régua/g) || []).length === (os.match(/régua/g) || []).length);

  const venda = P.aplicarTipo('<html><body><div class="pagina inteira">x</div></body></html>', 'venda');
  ok('2.1 venda continua meia folha e sem aviso', /pagina meia/.test(venda) && !/aviso-epson/.test(venda));
}

// ── 2.2 venda salva também vai para o financeiro ───────────────────────────
{
  const fonte = ler('vendas_financeiro_pendente_patch.js');
  const win = { console: { log() {} } };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const P = win.VENDAS_FINANCEIRO_PENDENTE_PURE;

  ok('2.2 venda salva conta como em aberto', P.vendaEmAberto({ id: 'v1', status: 'aberto' }) === true);
  ok('2.2 venda sem status conta como em aberto', P.vendaEmAberto({ id: 'v1' }) === true);
  ok('2.2 venda faturada fica de fora', P.vendaEmAberto({ id: 'v1', status: 'faturado' }) === false);
  ok('2.2 venda cancelada fica de fora', P.vendaEmAberto({ id: 'v1', status: 'cancelada' }) === false);

  const vendas = [
    { id: 'v1', numero: '1', total: 100, status: 'aberto' },
    { id: 'v2', numero: '2', total: 200, status: 'faturado' },
    { id: 'v3', numero: '3', total: 300, status: 'aberto' }
  ];
  const crs = [{ id: 'cr1', vendaId: 'v2', status: 'aberto' }];
  const faltam = P.vendasSemTitulo(vendas, crs);
  ok('2.2 acha as vendas salvas que sumiram do financeiro',
     faltam.length === 2 && faltam[0].id === 'v1' && faltam[1].id === 'v3');

  const jaTem = P.vendasSemTitulo(vendas, crs.concat([{ id: 'cr2', vendaId: 'v1' }, { id: 'cr3', vendaId: 'v3' }]));
  ok('2.2 não duplica quem já tem título', jaTem.length === 0);

  const t = P.tituloDaVenda(vendas[0], { empresaId: 'e1', usuarioId: 'u', usuarioNome: 'Kauan' }, 'cr9');
  ok('2.2 o título aponta para a venda', t.vendaId === 'v1' && t.valor === 100 && t.status === 'aberto');
  ok('2.2 o título é marcado como aguardando faturamento', t.aguardandoFaturamento === true);
  ok('2.2 o título diz o que é', /aguardando faturamento/.test(t.descricao));

  const orfaos = P.titulosOrfaos(
    [{ id: 'cr1', vendaId: 'v2', aguardandoFaturamento: true },
     { id: 'cr2', vendaId: 'vX', aguardandoFaturamento: true },
     { id: 'cr3', vendaId: 'v1', aguardandoFaturamento: true },
     { id: 'cr4', vendaId: 'v1' }],
    vendas);
  ok('2.2 o provisório some quando a venda é faturada', orfaos.some(c => c.id === 'cr1'));
  ok('2.2 o provisório some quando a venda é apagada', orfaos.some(c => c.id === 'cr2'));
  ok('2.2 o provisório da venda ainda aberta fica', !orfaos.some(c => c.id === 'cr3'));
  ok('2.2 título de verdade nunca é removido', !orfaos.some(c => c.id === 'cr4'));

  ok('2.2 o módulo está no bundle', manifest.includes('vendas_financeiro_pendente_patch.js'));
}

// ── 2.3 data um dia a menos ────────────────────────────────────────────────
{
  const app = ler('app.js');
  ok('2.3 existe leitura de data no fuso local', /function parseDataLocal/.test(app));
  ok('2.3 fmtDate usa a leitura local', /function fmtDate\(s\)\{[^}]*parseDataLocal/.test(app));
  ok('2.3 fmtDateTime usa a leitura local', /function fmtDateTime\(s\)\{[^}]*parseDataLocal/.test(app));

  const win = { console: { log() {} } };
  win.window = win;
  vm.createContext(win);
  const trecho = app.slice(app.indexOf('function parseDataLocal'), app.indexOf('function onlyDigits'));
  vm.runInContext(trecho, win);
  const d = win.parseDataLocal('2026-09-01');
  ok('2.3 AAAA-MM-DD vira meia-noite LOCAL, não UTC',
     d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 1);
  ok('2.3 o dia mostrado é o dia salvo', win.fmtDate('2026-09-01') === '01/09/2026');
  ok('2.3 data com hora continua igual',
     win.fmtDate('2026-09-01T15:00:00') === '01/09/2026');
  ok('2.3 texto que não é data passa reto', win.fmtDate('sem data') === 'sem data');
  ok('2.3 vazio continua traço', win.fmtDate('') === '-');
}

// ── 3.1 filtro cidade nos contratos ────────────────────────────────────────
{
  const fonte = ler('ajustes_v52237_contratos_filtros_patch.js');
  const win = { console: { log() {} } };
  win.window = win;
  win.db = {
    clientes: [
      { id: 'c1', nome: 'ESCOLA A', cidade: 'Montes Claros' },
      { id: 'c2', nome: 'ESCOLA B', municipio: 'Bocaiúva' },
      { id: 'c3', nome: 'ESCOLA C' }
    ],
    parque: [], equipamentos: [], leituras: [], os: []
  };
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const P = win.CONTRATOS_FILTROS_PURE;

  ok('3.1 Cidade aparece na lista de filtros', P.FILTROS.some(f => f[0] === 'cidade' && f[1] === 'Cidade'));
  ok('3.1 lê a cidade do cliente', P.cidadeDe({ clienteId: 'c1' }) === 'Montes Claros');
  ok('3.1 aceita o cadastro que gravou como município', P.cidadeDe({ clienteId: 'c2' }) === 'Bocaiúva');
  ok('3.1 cliente sem cidade não quebra', P.cidadeDe({ clienteId: 'c3' }) === '');

  const contratos = [
    { id: 'k1', clienteId: 'c1', numero: '1' },
    { id: 'k2', clienteId: 'c2', numero: '2' },
    { id: 'k3', clienteId: 'c3', numero: '3' }
  ];
  const achou = P.filtraContratos(contratos, 'cidade', 'montes');
  ok('3.1 acha por pedaço do nome e sem ligar para maiúscula', achou.length === 1 && achou[0].id === 'k1');
  ok('3.1 acha ignorando acento', P.filtraContratos(contratos, 'cidade', 'bocaiuva').length === 1);
  ok('3.1 busca vazia não esconde ninguém', P.filtraContratos(contratos, 'cidade', '').length === 3);
  ok('3.1 cidade que não existe não traz nada', P.filtraContratos(contratos, 'cidade', 'zzz').length === 0);
}

// ── 4.1 impressora em lista, dois cliques ──────────────────────────────────
{
  const fonte = ler('leitura_detalhada_departamentos_patch.js');
  ok('4.1 a caixa de escolha de impressora acabou', !/<select id=\\?"lan-prq/.test(fonte));
  ok('4.1 agora é uma lista', /id="lan-prq-lista"[\s\S]{0,80}role="listbox"/.test(fonte));
  ok('4.1 o valor escolhido continua em lan-prq', /type="hidden" id="lan-prq"/.test(fonte));
  ok('4.1 escolhe com dois cliques', /ondblclick="escolherImpressoraLancamento/.test(fonte));
  ok('4.1 um clique só destaca', /onclick="destacarImpressoraLancamento/.test(fonte));
  ok('4.1 o teclado também escolhe (Enter)', /event\.key==='Enter'[\s\S]{0,80}escolherImpressoraLancamento/.test(fonte));
  ok('4.1 a lista rola quando tem muita impressora', /max-height:200px;overflow-y:auto/.test(fonte));
  ok('4.1 a busca reconstrói a lista', /buscarImpressorasLancamento[\s\S]{0,300}lan-prq-lista/.test(fonte));
  ok('4.1 escolher atualiza os tipos de impressão', /escolherImpressoraLancamento[\s\S]{0,600}atualizarTiposLancamento/.test(fonte));
  ok('4.1 lista vazia avisa em vez de ficar em branco', /Nenhuma impressora com medidor pendente/.test(fonte));
  ok('4.1 quem edita não troca a impressora sem querer', /if\(alvo\.disabled\) return;/.test(fonte));
}

// ── versão ─────────────────────────────────────────────────────────────────
ok('versão continua na família 5.22', /^5\.22\.\d+/.test(pkg.version));
ok('index.html está na mesma versão do package', ler('index.html').indexOf("'" + pkg.version + "'") >= 0);

console.log(falhas === 0
  ? '\nRESULTADO: relatório v5.22.67 passou!'
  : '\nRESULTADO: ' + falhas + ' falha(s) no relatório v5.22.67');
process.exit(falhas === 0 ? 0 : 1);
