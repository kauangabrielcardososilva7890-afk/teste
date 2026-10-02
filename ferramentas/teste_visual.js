// ═══════════════════════════════════════════════════════════════════════════
// ferramentas/teste_visual.js — o navegador de verdade, rodando no GitHub Actions
//
// Por que isto existe: o sandbox onde o agente trabalha tem rede só para
// npm/PyPI/GitHub — não consegue abrir https://teste-60f.pages.dev nem instalar
// um Chromium (o CDN do Playwright é bloqueado e não há as bibliotecas de
// sistema). Então a medição de tela acontece num runner do GitHub, que tem
// internet inteira, e o resultado volta como corpo de issue (api.github.com é
// acessível dos dois lados). O que o agente lê: números de layout, não achismo.
//
// O que ele confere (nada de credencial, nada de dado real — a base é montada
// aqui na hora, com nomes sintéticos):
//   · celular 390x844 — tabela mais larga que a tela virou rolável? o bilhete
//     "arraste" está lá? depois de arrastar, a última coluna (o botão Editar)
//     entra no recorte visível?
//   · modal — a caixa cabe no vão com respiro e nenhum botão sai da tela?
//   · faixa da Nuvem — no celular ela empilhou e devolveu espaço ao corpo?
//   · barra de menus — quando não cabe, existe o aviso de arraste?
//   · desktop 1365x850 — NADA foi marcado (a promessa é que tela grande não muda)
//   · e nenhum erro de console durante as 14 telas
//
// Rodar local (opcional, quem tiver navegador):
//   npx playwright install chromium
//   node ferramentas/teste_visual.js --url https://teste-60f.pages.dev/
// Saídas: resultado.json e resultado.md no diretório atual.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');

const argv = process.argv.slice(2);
function argumento(nome, padrao) {
  const i = argv.indexOf('--' + nome);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : padrao;
}
const URL_ALVO = argumento('url', 'https://teste-60f.pages.dev/index.html');
const VERSAO_ESPERADA = argumento('versao', '');
// Carimbo do bundle que o REPO deste commit serve (lido do index.html pelo workflow).
// Conferir o deploy DENTRO do navegador: o Cloudflare Pages responde a cliente sem
// browser o que quiser, então um `curl` no runner fica cego e o guard vira falha falsa
// (foi o que derrubou a rodada #6, em que o job morreu antes de medir).
const STAMP_ESPERADO = argumento('stamp', '');
const TENTATIVAS_DEPLOY = Number(argumento('tentativas', '20'));
const TELAS = ['dashboard', 'clientes', 'impressoras', 'contratos', 'leituras', 'parque',
  'manutencao', 'vendas', 'financeiro', 'relatorios', 'config', 'usuarios', 'auditoria', 'produtos'];

let chromium;
try { chromium = require('playwright').chromium; }
catch (e) { try { chromium = require('playwright-core').chromium; } catch (e2) {
  console.error('playwright não está instalado neste ambiente (npm i -D playwright && npx playwright install chromium)');
  process.exit(2);
} }

// ── base sintética: três linhas em cada lista basta para a tabela estourar ──
function textoFixo(i) { return ['um', 'dois', 'tres', 'quatro', 'cinco'][i % 5]; }
function montarBase() {
  const hoje = new Date().toISOString();
  const dia = new Date(Date.now() - 864e5).toISOString();
  const empresa = { id: 'emp-teste', nome: 'Empresa Sintética QA', fantasia: 'Empresa Sintética QA', cnpj: '00000000000000', telefone: '0000-0000', cidade: 'Montes Claros', estado: 'MG' };
  const cli = (n) => ({ id: 'cli-' + n, tipo: 'juridica', email: '', nome: 'Cliente Sintético ' + n, fantasia: 'Fantasia ' + textoFixo(n), documento: '00' + n + '0000000', telefone: '38 0000-000' + n, cidade: 'Montes Claros', bairro: 'Bairro ' + textoFixo(n), estado: 'MG', empresaId: 'emp-teste', ativo: true, criadoEm: hoje });
  const eq = (n) => ({ id: 'eq-' + n, modelo: 'Impressora Sintética ' + n, serial: 'SN' + n + '000000', patrimonio: 'PAT-' + n, contadorPreto: 100 * n, contadorPB: 100 * n, contadorColor: 50 * n, clienteId: 'cli-1', contratoId: 'ctr-1', departamento: 'Departamento ' + textoFixo(n), local: 'Local ' + textoFixo(n), empresaId: 'emp-teste', status: 'instalado' });
  return {
    _montada: true, empresas: [empresa], empresaAtivaId: 'emp-teste',
    // sem 'config' aqui de propósito: o testador mescla em cima do config que o
    // app criou, senão apaga chaves que o resto do código lê com .slice()
    config: { loja: { nome: empresa.nome, fantasia: empresa.fantasia, cnpj: empresa.cnpj } },
    usuarios: [{ id: 'u-qa', nome: 'QA Sintético', login: 'qa', perfil: 'ADMIN', ativo: true, empresaId: 'emp-teste' }],
    clientes: [1, 2, 3].map(cli), equipamentos: [1, 2, 3, 4].map(eq),
    contratos: [1, 2].map(n => ({ id: 'ctr-' + n, numero: 'CTR-000' + n, clienteId: 'cli-' + n, status: 'ativo', valor: 100 * n, inicio: dia, fim: hoje, empresaId: 'emp-teste', equipamentos: ['eq-1'] })),
    parque: [1, 2, 3].map(n => ({ id: 'pq-' + n, clienteId: 'cli-' + n, equipamentoId: 'eq-' + n, setor: 'Setor ' + textoFixo(n), status: 'ativo', empresaId: 'emp-teste' })),
    leituras: [1, 2, 3].map(n => ({ id: 'lei-' + n, contratoId: 'ctr-1', codigo: 'L000' + n, periodo: '2026-09', lancadaEm: hoje, preto: 10 * n, color: 5 * n, utilizado: 15 * n, excedente: n, total: 30 * n, empresaId: 'emp-teste' })),
    os: [1, 2, 3].map(n => ({ id: 'os-' + n, numero: 'CH-000' + n, clienteId: 'cli-1', motivo: 'Motivo sintético ' + textoFixo(n), descricao: 'Chamado sintético ' + n + ' — texto de teste, sem cliente real.', tipo: 'Contrato', criadoPorNome: 'QA Sintético', equipamentoId: 'eq-1', status: 'aberto', dataAbertura: hoje, prioridade: 'media', contratoId: 'ctr-1', empresaId: 'emp-teste' })),
    vendas: [1, 2].map(n => ({ id: 'v-' + n, numero: 'NV-000' + n, clienteId: 'cli-' + n, data: hoje, total: 379.8 * n, status: 'aberta', formaPagamento: 'Dinheiro', empresaId: 'emp-teste', itens: [] })),
    contasReceber: [1, 2, 3].map(n => ({ id: 'cr-' + n, descricao: 'Receber sintético ' + n, valor: 100 * n, vencimento: hoje, status: 'aberto', clienteId: 'cli-' + n, empresaId: 'emp-teste' })),
    contasPagar: [1].map(n => ({ id: 'cp-' + n, descricao: 'Pagar sintético ' + n, valor: 50 * n, vencimento: hoje, status: 'aberto', empresaId: 'emp-teste' })),
    produtos: [1, 2, 3].map(n => ({ id: 'p-' + n, nome: 'Produto Sintético ' + n, categoria: 'Cartucho', preco: 90 * n, estoque: n, minimo: 3, empresaId: 'emp-teste' })),
    auditoria: [1, 2, 3, 4].map(n => ({ id: 'a-' + n, data: hoje, usuario: 'QA Sintético', modulo: 'visual-qa', acao: 'FIXTURE', detalhes: 'Registro sintético ' + textoFixo(n) + ', sem persistência real.', empresaId: 'emp-teste' })),
  };
}

// ── medições dentro da página ───────────────────────────────────────────────
function medirTela() {
  const visivel = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const fora = (r) => r.left < -1 || r.right > window.innerWidth + 1;
  const rec = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { esq: Math.round(r.left), dir: Math.round(r.right), larg: Math.round(r.width), alt: Math.round(r.height) }; };

  const vista = document.querySelector('.view:not(.hidden)') || document.querySelector('#view-dashboard');
  const saida = { tela: vista ? vista.id : null, titulo: (document.getElementById('page-title') || {}).innerText || '', erro: null };

  // Sondas: sem isto o relatório diria apenas "não marcou" e eu teria de adivinhar
  // se a culpe é do patch (não carregou), do gancho (não foi instalado), do
  // momento (a varredura ainda não rodou ali) ou da decisão (recusa marcar).
  saida.mecanica = {
    patch: (window.MENUS_TELA_PEQUENA_PURE && window.MENUS_TELA_PEQUENA_PURE.VERSAO) || 'patch não expôs PURE',
    ganchoNavigateTo: !!(window.navigateTo && window.navigateTo.__digiRoloNav),
    cssInjetado: !!document.getElementById('digi-menus-tela-pequena'),
    forcador: typeof window.digiRevarrerTelas,
  };

  // 1) a tabela não cabe? o bloco dela rola? o bilhete existe? e depois de
  //    arrastar até o fim, a última célula entra no recorte?
  //    A escolhida é a tabela VISÍVEL mais larga da tela — a primeira do DOM é
  //    quase sempre a de outra aba escondida (importação, pré-visualização), que
  //    mede 0x0 e daria um "está tudo bem" falso.
  let tab = null;
  if (vista) {
    let maior = 0;
    for (const t of vista.querySelectorAll('table')) {
      const r = t.getBoundingClientRect();
      if (r.height < 2 || r.width < 2) continue;
      if (r.width > maior) { maior = r.width; tab = t; }
    }
  }
  if (tab) {
    let cont = tab.parentElement;
    while (cont && cont !== document.body) {
      const cs = getComputedStyle(cont);
      if (/auto|hidden|scroll/.test(cs.overflowX || '')) break;
      cont = cont.parentElement;
    }
    const antes = tab.getBoundingClientRect();
    const disponivel = cont ? cont.clientWidth : 0;
    saida.tabela = {
      colunas: tab.querySelectorAll('thead th').length || tab.querySelectorAll('tr:first-child > *').length,
      largura: Math.round(Math.max(tab.scrollWidth, antes.width)),
      disponivel, naoCabe: Math.max(tab.scrollWidth, antes.width) > disponivel + 2,
      overflowX: cont ? getComputedStyle(cont).overflowX : 'sem contêiner',
      marcado: !!(cont && cont.classList.contains('digi-rola')),
      bilhete: !!(cont && cont.nextElementSibling && cont.nextElementSibling.classList.contains('digi-rola-dica')),
      textoBilhete: (cont && cont.nextElementSibling && cont.nextElementSibling.classList.contains('digi-rola-dica')) ? cont.nextElementSibling.textContent.trim() : '',
    };
    if (cont && saida.tabela.naoCabe) {
      const max = cont.scrollWidth - cont.clientWidth;
      cont.scrollLeft = max;
      const depois = tab.querySelector('tr:last-child > *:last-child');
      const rc = cont.getBoundingClientRect();
      saida.tabela.atingeOFim = cont.scrollLeft >= max - 2;
      saida.tabela.ultimaColunaVisivel = !!(depois && (() => { const r = depois.getBoundingClientRect(); return r.right <= rc.right + 2 && r.left >= rc.left - 2; })());
      cont.scrollLeft = 0;
    }
  } else { saida.tabela = null; }

  // 2) a barra de cima: quando não cabe, tem aviso?
  const faixa = document.querySelector('.module-row');
  if (faixa) {
    saida.faixa = {
      largura: Math.round(faixa.scrollWidth), disponivel: faixa.clientWidth, naoCabe: faixa.scrollWidth > faixa.clientWidth + 2,
      rola: /auto|scroll/.test(getComputedStyle(faixa).overflowX),
      bilhete: !!(faixa.nextElementSibling && faixa.nextElementSibling.classList.contains('digi-rola-dica')),
    };
  }

  // 3) a faixa da Nuvem: empilhou? devolveu espaço ao corpo? está dentro da tela?
  const nuvem = document.getElementById('v7015-faixa');
  if (nuvem && visivel(nuvem)) {
    const cs = getComputedStyle(nuvem);
    saida.nuvem = {
      direcao: cs.flexDirection, rec: rec(nuvem), vazaFora: fora(nuvem.getBoundingClientRect()),
      respiroCorpo: parseFloat(getComputedStyle(document.body).paddingBottom) || 0,
      cobreOMenu: (() => { const m = vista ? vista.getBoundingClientRect() : null; const r = nuvem.getBoundingClientRect(); return m ? (r.top < m.bottom && r.bottom > m.top) : false; })(),
    };
  } else { saida.nuvem = null; }
  return saida;
}

function medirModal() {
  const box = document.getElementById('modal-box');
  const raiz = document.getElementById('modal-root');
  if (!box || !raiz || raiz.classList.contains('hidden')) return null;
  const rb = box.getBoundingClientRect();
  const dentro = { x: rb.left >= -1, dir: rb.right <= window.innerWidth + 1 };
  const botoes = [...box.querySelectorAll('#modal-footer button, .modal-footer button')].map(b => {
    const r = b.getBoundingClientRect();
    return { texto: (b.innerText || '').trim().slice(0, 34), fora: r.left < -1 || r.right > window.innerWidth + 1, vazaDaCaixa: r.left < rb.left - 1 || r.right > rb.right + 1 };
  });
  const tab = box.querySelector('table');
  let cont = null;
  if (tab) { cont = tab.parentElement; while (cont && cont !== box) { if (/auto|hidden|scroll/.test(getComputedStyle(cont).overflowX)) break; cont = cont.parentElement; } }
  return {
    caixa: rec(box), viewport: Math.round(window.innerWidth), vazaEsquerda: !dentro.x, vazaDireita: !dentro.dir,
    botoesForaDaTela: botoes.filter(b => b.fora).length, botoesForaDaCaixa: botoes.filter(b => b.vazaDaCaixa).map(b => b.texto),
    tabelaNaoCabe: tab && cont ? Math.max(tab.scrollWidth, tab.getBoundingClientRect().width) > cont.clientWidth + 2 : false,
    tabelaRolavel: !!(cont && (cont.classList.contains('digi-rola') || /auto|scroll/.test(getComputedStyle(cont).overflowX))),
  };
}

(async () => {
  const navegador = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const errosPagina = [];
  const resultados = { url: URL_ALVO, verso: '', feitoEm: new Date().toISOString(), celular: [], desktop: [], modal: null, erros: errosPagina };
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pagina = await contexto.newPage();
  pagina.on('pageerror', (e) => {
    const st = String((e && e.stack) || '').split('\n').slice(0, 3).join(' | ').replace(/https:\/\/[^ )]*\//g, '~/');
    errosPagina.push('pageerror: ' + String(e && e.message).slice(0, 140) + (st ? ' ⟵ ' + st.slice(0, 260) : ''));
  });
  pagina.on('console', m => { if (m.type() === 'error') errosPagina.push('console: ' + m.text().slice(0, 160)); });

  // O Pages publica a partir do commit; medir antes da publicação viraria veredito do
  // deploy anterior. Rola o reload até o <script src="app.bundle.js?v=..."> da página
  // bater com o carimbo deste commit (20 tentativas de 20s ≈ 7 min de build).
  if (STAMP_ESPERADO) {
    // Cada tentativa é protegida: uma falha de rede do Pages (403/EOF num momento de
    // pico) não pode derrubar o run inteiro — isso custou as rodadas #6 e #7, em que o
    // job morreu em 23s sem nem medir, porque o `goto` de espera não tinha catch.
    for (let tentativa = 1; ; tentativa++) {
      let visto = '';
      let erro = '';
      try {
        await pagina.goto(URL_ALVO, { waitUntil: 'domcontentloaded', timeout: 60000 });
        visto = await pagina.evaluate(() => {
          const alvo = document.querySelector('script[src*="app.bundle.js"]');
          return alvo ? String(alvo.getAttribute('src') || '') : '';
        });
      } catch (e) {
        erro = String((e && e.message) || e).split('\n')[0].slice(0, 120);
      }
      if (visto.indexOf(STAMP_ESPERADO) >= 0) {
        resultados.deploy = { conferido: true, naTentativa: tentativa, site: visto, esperado: STAMP_ESPERADO };
        break;
      }
      const esgotou = tentativa >= TENTATIVAS_DEPLOY;
      resultados.deploy = {
        falhou: esgotou, tentativas: tentativa, site: visto || 'nada',
        esperado: STAMP_ESPERADO, ultimoErro: erro || undefined,
      };
      if (esgotou) break;
      await pagina.waitForTimeout(20000);
    }
  }

  // login sem credencial: monta a base sintética e salva pelos canos do próprio app
  await pagina.goto(URL_ALVO, { waitUntil: 'domcontentloaded' });
  await pagina.waitForTimeout(900);
  const semeadura = await pagina.evaluate((base) => {
    // O app guarda a base num `let db` de escopo de script e espelha em
    // window.db. Trocar window.db NÃO troca o db interno — por isso a base é
    // MESCLADA no objeto que já está vivo (Object.assign) e salva pelo saveDB
    // do próprio app, que conhece o formato de pedaços/manifesto.
    const alvo = (window.db && typeof window.db === 'object') ? window.db : null;
    if (!alvo) return { ok: false, motivo: 'window.db não apareceu (o app não subiu?)' };
    // `config` é MESCLADO, não trocado: o app cria chaves dentro de db.config
    // (nfe, caixa, sync...) e um replace apagaria o que o resto do código lê com
    // .slice() em cima — é exatamente o tipo de 'reading slice' que o run #2
    // colheu no carregamento e que derruba o patch inteiro que vier depois.
    const configAntes = alvo.config;
    Object.assign(alvo, base);
    if (configAntes && typeof configAntes === 'object') alvo.config = Object.assign({}, configAntes, base.config);
    if (!Array.isArray(alvo.empresas) || !alvo.empresas.length) alvo.empresas = base.empresas;
    if (!alvo.empresaAtivaId) alvo.empresaAtivaId = 'emp-teste';
    try { if (typeof window.saveDB === 'function') window.saveDB(); } catch (e) { return { ok: false, motivo: 'saveDB lançou: ' + e.message }; }
    try {
      localStorage.setItem('digicopy_session_v42_demo_apresentacao', JSON.stringify({
        usuarioId: 'u-qa', usuarioNome: 'QA Sintético', perfil: 'ADMIN',
        empresaId: alvo.empresaAtivaId, empresaNome: 'Empresa Sintética QA', cnpj: '00000000000000',
        loginAt: new Date().toISOString(),
      }));
      sessionStorage.setItem('digicopy_ultima_empresa', alvo.empresaAtivaId);
    } catch (e) { return { ok: false, motivo: 'localStorage indisponível: ' + e.message }; }
    return { ok: true, clientes: (alvo.clientes || []).length, equipamentos: (alvo.equipamentos || []).length };
  }, montarBase());
  resultados.semeadura = semeadura;
  await pagina.reload({ waitUntil: 'domcontentloaded' });
  await pagina.waitForTimeout(1400);
  await pagina.evaluate(() => {
    // se a tela de login continuar na frente (o boot só abre o app quando a
    // sessão é aceita pelo fluxo dele), dá o empurrão que o botão daria
    const login = document.getElementById('login-screen');
    if (login && !login.classList.contains('hidden') && typeof window.showApp === 'function') {
      try { window.showApp(); } catch (e) {}
    }
  });
  await pagina.waitForTimeout(700);

  resultados.verso = await pagina.evaluate(() => {
    const rodape = document.querySelector('footer, .app-footer');
    const m = ((rodape && rodape.innerText) || (window.DIGICOPY_APP_VERSION ? 'v' + window.DIGICOPY_APP_VERSION : '')).match(/v?\d+\.\d+\.\d+/);
    return m ? m[0] : '?';
  });

  // Clique de verdade quando o botão existe: é o caminho que o usuário faz, e é o
  // que exercita os ganchos de quem escuta clique (o embrulho do navigateTo cuida
  // da navegação por programa). O resultado de cada tela diz por onde entramos.
  const navegar = async (p, tela) => {
    const modo = await p.evaluate((v) => {
      // a barra do app é <div class="module"><button onclick="navigateTo('x')">;
      // data-nav existe em outro canto (e nem sempre). Clicar o botão certo é o
      // caminho do usuário, e é ele que dispara os ganchos de clique do resto.
      const alvos = [].slice.call(document.querySelectorAll('.module-row button, [data-nav]'));
      const b = alvos.find((el) => el.offsetParent !== null &&
        String(el.getAttribute('onclick') || '').indexOf("'" + v + "'") >= 0) ||
        document.querySelector('[data-nav="' + v + '"]');
      if (b && b.offsetParent !== null) { b.click(); return 'clique no botão da barra'; }
      try { window.navigateTo(v); return 'navigateTo (botão não achado)'; } catch (e) { return 'falhou: ' + e.message; }
    }, tela);
    await p.waitForTimeout(760);
    return modo;
  };

  for (const tela of TELAS) {
    const modo = await navegar(pagina, tela);
    const medido = await pagina.evaluate(medirTela);
    medido.entrada = modo;
    // força a varredura (é o gancho público do patch) e mede outra vez: se o
    // bilhete aparecer aqui, o defeito é de MOMENTO, não de decisão
    await pagina.evaluate(() => { try { window.digiRevarrerTelas && window.digiRevarrerTelas(); } catch (e) { } });
    await pagina.waitForTimeout(320);
    const depois = await pagina.evaluate(medirTela);
    medido.depoisDeForcar = depois.tabela;
    if (!medido.mecanica.forcarExiste) medido.depoisDeForcar = null;
    medido.mecanica.forcarExiste = medido.mecanica.forcador === 'function';
    if (tela === 'config') {
      // a faixa da Nuvem só aparece quando o próprio módulo confere o estado; sem
      // dar esse empurrão o teste medir uma tela sem faixa e daria ✓ de favor
      await pagina.evaluate(() => { try { window.v7015ConferirNuvem && window.v7015ConferirNuvem(); } catch (e) { } });
      await pagina.waitForTimeout(1500);
      medido.aposEmpurrarFaixa = true;
    }
    resultados.celular.push(medido);
  }

  // o modal de Chamados — é o que o relatório descreveu cortado nas duas bordas
  await navegar(pagina, 'manutencao');
  resultados.modalAbertura = await pagina.evaluate(() => {
    if (typeof window.abrirHistoricoChamadosGeral !== 'function') return 'não existe window.abrirHistoricoChamadosGeral';
    try { window.abrirHistoricoChamadosGeral(); } catch (e) { return 'lançou: ' + e.message; }
    const r = document.getElementById('modal-root');
    return r ? (r.classList.contains('hidden') ? 'chamou mas o modal-root continuou escondido' : 'aberto') : 'sem #modal-root na página';
  });
  await pagina.waitForTimeout(900);
  resultados.modal = await pagina.evaluate(medirModal);
  resultados.modal = resultados.modal && Object.assign({}, resultados.modal, { abertura: resultados.modalAbertura });
  if (resultados.modal) await pagina.screenshot({ path: 'modal-celular.png' });
  await pagina.evaluate(() => { try { window.closeModal(); } catch (e) { } });

  // desktop: a promessa é que nada muda — nenhuma marca de rolagem deve aparecer
  await contexto.close();
  const contextoD = await navegador.newContext({ viewport: { width: 1365, height: 850 } });
  const paginaD = await contextoD.newPage();
  await paginaD.goto(URL_ALVO, { waitUntil: 'domcontentloaded' });
  await paginaD.waitForTimeout(900);
  // sem semear também aqui, o desktop media a tela de LOGIN e o "nada mudou no
  // desktop" saía ✓ de favor — contexto novo não herda o IndexedDB do anterior
  resultados.semeaduraDesktop = await paginaD.evaluate((base) => {
    const alvo = (window.db && typeof window.db === 'object') ? window.db : null;
    if (!alvo) return { ok: false, motivo: 'sem window.db' };
    const cfg = alvo.config;
    Object.assign(alvo, base);
    if (cfg && typeof cfg === 'object') alvo.config = Object.assign({}, cfg, base.config);
    try { window.saveDB && window.saveDB(); } catch (e) { return { ok: false, motivo: e.message }; }
    try {
      localStorage.setItem('digicopy_session_v42_demo_apresentacao', JSON.stringify({
        usuarioId: 'u-qa', usuarioNome: 'QA Sintético', perfil: 'ADMIN', empresaId: alvo.empresaAtivaId || 'emp-teste',
        empresaNome: 'Empresa Sintética QA', cnpj: '00000000000000', loginAt: new Date().toISOString(),
      }));
    } catch (e) { }
    return { ok: true, clientes: (alvo.clientes || []).length };
  }, montarBase());
  await paginaD.reload({ waitUntil: 'domcontentloaded' });
  await paginaD.waitForTimeout(1300);
  for (const tela of ['clientes', 'impressoras', 'contratos', 'financeiro', 'auditoria']) {
    const modo = await navegar(paginaD, tela);
    const m = await paginaD.evaluate(medirTela);
    resultados.desktop.push({ pedida: tela, aberta: m.tela, entrada: modo,
      bilheteNaTabela: !!(m.tabela && m.tabela.bilhete), bilheteNaFaixa: !!(m.faixa && m.faixa.bilhete), faixaPrecisaRolar: !!(m.faixa && m.faixa.naoCabe) });
  }

  await contextoD.close();
  await navegador.close();

  // ── veredito ─────────────────────────────────────────────────────────────
  const linhas = [];
  const falhas = [];
  const temErro = (s) => /Tela sem conteúdo|sem conte[uú]do/.test(s.titulo + ' ' + (s.erro || ''));
  for (const s of resultados.celular) {
    const t = s.tabela;
    if (t && t.naoCabe) {
      const ok = t.marcado && t.rola !== 'hidden' && t.atingeOFim && t.ultimaColunaVisivel;
      if (!ok) falhas.push(s.tela + ': tabela de ' + t.largura + 'px em ' + t.disponivel + 'px sem rolagem útil (marcado=' + t.marcado + ', overflow=' + t.overflowX + ', chega ao fim=' + t.atingeOFim + ', última coluna visível=' + t.ultimaColunaVisivel + ')');
      if (!t.bilhete) falhas.push(s.tela + ': tabela não cabe e o bilhete de arraste não apareceu' +
        (s.depoisDeForcar && s.depoisDeForcar.bilhete ? ' — MAS aparece ao forçar a varredura, logo é a hora de medir que está errada, não a medição' : '') +
        ' · mecânica: ' + JSON.stringify(s.mecanica));
    }
    if (t) linhas.push('| ' + s.tela + ' | ' + t.colunas + ' | ' + t.largura + ' | ' + t.disponivel + ' | ' + (t.naoCabe ? 'sim' : 'não') + ' | ' + (t.marcado ? '✓' : '—') + ' | ' + (t.bilhete ? '✓' : '—') + ' | ' + (t.ultimaColunaVisivel === undefined ? '—' : (t.ultimaColunaVisivel ? '✓' : '✗')) + ' |');
    else linhas.push('| ' + s.tela + ' | — | — | — | sem tabela | — | — | — |');
    if (temErro(s)) falhas.push(s.tela + ': abriu com o cartaz de tela sem conteúdo');
  }
  if (!resultados.modal) falhas.push('o modal de Chamados não abriu para ser medido: ' + (resultados.modalAbertura || '?'));
  for (const d of resultados.desktop) {
    if (d.aberta !== 'view-' + d.pedida) falhas.push('desktop: pediu ' + d.pedida + ' e a tela visível foi ' + d.aberta + ' (' + d.entrada + ')');
  }
  if (resultados.modal) {
    if (resultados.modal.vazaEsquerda || resultados.modal.vazaDireita) falhas.push('modal: caixa ' + resultados.modal.caixa.larg + 'px num viewport de ' + resultados.modal.viewport + 'px vazou (' + (resultados.modal.vazaEsquerda ? 'esquerda ' : '') + (resultados.modal.vazaDireita ? 'direita' : '') + ')');
    if (resultados.modal.botoesForaDaTela) falhas.push('modal: ' + resultados.modal.botoesForaDaTela + ' botão(ões) fora da tela');
    if (resultados.modal.botoesForaDaCaixa.length) falhas.push('modal: botão(es) fora da caixa: ' + resultados.modal.botoesForaDaCaixa.join(' / '));
  }
  const config = resultados.celular.find(s => s.tela === 'view-config') || {};
  if (config.nuvem) {
    if (config.nuvem.vazaFora) falhas.push('faixa da Nuvem: vazando da tela (' + JSON.stringify(config.nuvem.rec) + ')');
    if (config.nuvem.direcao !== 'column') falhas.push('faixa da Nuvem no celular não empilhou (flex-direction=' + config.nuvem.direcao + ')');
    if (!(config.nuvem.respiroCorpo > 0)) falhas.push('faixa da Nuvem: corpo sem respiro (padding-bottom=' + config.nuvem.respiroCorpo + ')');
  }
  for (const d of resultados.desktop) {
    if (d.bilheteNaTabela || d.bilheteNaFaixa) falhas.push('desktop ' + d.tela + ': apareceu aviso de arraste onde não devia');
  }
  if (errosPagina.length) falhas.push('erros de página (' + errosPagina.length + '): ' + errosPagina.slice(0, 3).join(' | '));
  if (!resultados.semeadura || !resultados.semeadura.ok) falhas.push('a base sintética não entrou: ' + ((resultados.semeadura && resultados.semeadura.motivo) || '?') + ' — as medidas abaixo não valem (nenhuma tela tem linhas para cortar)');
  if (resultados.semeadura && resultados.semeadura.ok && resultados.semeadura.clientes !== 3) falhas.push('clientes semeados = ' + resultados.semeadura.clientes + ' (esperado 3)');
  if (VERSAO_ESPERADA && resultados.verso.indexOf(VERSAO_ESPERADA) < 0) falhas.push('o site publicado não é a versão esperada: ' + resultados.verso + ' ≠ ' + VERSAO_ESPERADA);
  if (resultados.deploy && resultados.deploy.falhou) falhas.push('o Pages ainda serve OUTRO bundle (' + resultados.deploy.site + ' ≠ ' + resultados.deploy.esperado + ') depois de ' + resultados.deploy.tentativas + ' tentativas — o que está medido abaixo é o deploy anterior, não este commit');

  const md = [
    '## Teste visual no navegador real — ' + resultados.verso,
    '',
    'Semeadura: `' + JSON.stringify(resultados.semeadura) + '` · desktop: `' + JSON.stringify(resultados.semeaduraDesktop) + '` · modal: `' + String(resultados.modalAbertura) + '`', '',
    'Deploy: `' + (resultados.deploy ? JSON.stringify(resultados.deploy) : 'não conferido (sem --stamp)') + '`', '',
    'Mecânica do patch na página: `' + JSON.stringify((resultados.celular[0] || {}).mecanica) + '`', '',
    'Onde o bilhete apareceu ao FORÇAR a varredura (e não antes): `' + (resultados.celular.filter(s => s.tabela && s.depoisDeForcar && s.depoisDeForcar.bilhete && !s.tabela.bilhete).map(s => s.tela).join(', ') || 'nenhuma') + '`', '',
    'Rodado no GitHub Actions contra `' + URL_ALVO + '` (celular 390×844, desktop 1365×850, base sintética montada na hora, nada de dado real).',
    '',
    '| tela | colunas | tabela | tela cabe? | não cabe | rolável | bilhete | última coluna alcançável |',
    '|---|---|---|---|---|---|---|---|',
  ].concat(linhas).concat([
    '',
    '### modal de Chamados', '```json', JSON.stringify(resultados.modal, null, 1), '```',
    '',
    '### faixa da Nuvem no celular', '```json', JSON.stringify(config.nuvem || null, null, 1), '```',
    '',
    '### desktop (não deve mudar nada)', '```json', JSON.stringify(resultados.desktop, null, 1), '```',
    '',
    '### veredito',
    falhas.length ? '❌ ' + falhas.length + ' problema(s):\n' + falhas.map(f => '- ' + f).join('\n') : '✅ nenhuma falha de corte nas telas medidas',
    '',
    '<!-- teste-visual-json:' + Buffer.from(JSON.stringify(resultados)).toString('base64') + ' -->',
  ]).join('\n');

  fs.writeFileSync('resultado.json', JSON.stringify(resultados, null, 1));
  fs.writeFileSync('resultado.md', md);
  console.log(md.replace(/\n<!-- teste-visual-json:.*?-->/s, ''));
  process.exit(falhas.length ? 1 : 0);
})().catch(async (e) => {
  // Se qualquer passo estourar, a issue ainda tem de explicar o quê. Sem isto o veredito
  // era "não chegou a medir" e o log do Actions, nem sempre legível, era a única pista.
  const motivo = String((e && e.stack) || e).split('\n').slice(0, 6).join('\n')
    .replace(/https:\/\/[^ )]*\//g, '~/');
  const md = [
    '## ❌ Teste visual abortou antes do veredito',
    '',
    'Motivo (primeiras linhas da pilha, host cortado):',
    '```', motivo, '```',
    '',
    'Nada do que estava abaixo nas issues anteriores deve ser lido como aprovado: este run',
    'não mediu as telas. Os problemas conhecidos ficam abertos até um run concluir.',
  ].join('\n');
  try {
    fs.writeFileSync('resultado.json', JSON.stringify({ abortado: true, motivo }, null, 1));
    fs.writeFileSync('resultado.md', md);
  } catch (e2) { /* o disk pode estar ocupado; o console abaixo ainda chega ao log */ }
  console.error('\n[teste_visual] ABORTOU: ' + motivo);
  process.exit(1);
});
