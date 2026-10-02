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
  const cli = (n) => ({ id: 'cli-' + n, nome: 'Cliente Sintético ' + n, fantasia: 'Fantasia ' + textoFixo(n), documento: '00' + n + '0000000', telefone: '38 0000-000' + n, cidade: 'Montes Claros', bairro: 'Bairro ' + textoFixo(n), estado: 'MG', empresaId: 'emp-teste', ativo: true, criadoEm: hoje });
  const eq = (n) => ({ id: 'eq-' + n, modelo: 'Impressora Sintética ' + n, serial: 'SN' + n + '000000', patrimonio: 'PAT-' + n, contadorPreto: 100 * n, contadorColor: 50 * n, clienteId: 'cli-1', contratoId: 'ctr-1', departamento: 'Departamento ' + textoFixo(n), local: 'Local ' + textoFixo(n), empresaId: 'emp-teste', status: 'instalado' });
  return {
    _montada: true, empresas: [empresa], empresaAtivaId: 'emp-teste',
    config: { loja: { nome: empresa.nome, fantasia: empresa.fantasia, cnpj: empresa.cnpj }, seguranca: {} },
    usuarios: [{ id: 'u-qa', nome: 'QA Sintético', login: 'qa', perfil: 'ADMIN', ativo: true, empresaId: 'emp-teste' }],
    clientes: [1, 2, 3].map(cli), equipamentos: [1, 2, 3, 4].map(eq),
    contratos: [1, 2].map(n => ({ id: 'ctr-' + n, numero: 'CTR-000' + n, clienteId: 'cli-' + n, status: 'ativo', valor: 100 * n, inicio: dia, fim: hoje, empresaId: 'emp-teste', equipamentos: ['eq-1'] })),
    parque: [1, 2, 3].map(n => ({ id: 'pq-' + n, clienteId: 'cli-' + n, equipamentoId: 'eq-' + n, setor: 'Setor ' + textoFixo(n), status: 'ativo', empresaId: 'emp-teste' })),
    leituras: [1, 2, 3].map(n => ({ id: 'lei-' + n, contratoId: 'ctr-1', codigo: 'L000' + n, periodo: '2026-09', lancadaEm: hoje, preto: 10 * n, color: 5 * n, utilizado: 15 * n, excedente: n, total: 30 * n, empresaId: 'emp-teste' })),
    os: [1, 2, 3].map(n => ({ id: 'os-' + n, numero: 'CH-000' + n, clienteId: 'cli-1', motivo: 'Motivo sintético ' + textoFixo(n), equipamentoId: 'eq-1', status: 'aberto', dataAbertura: hoje, prioridade: 'media', contratoId: 'ctr-1', empresaId: 'emp-teste' })),
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

  // 1) a tabela não cabe? o bloco dela rola? o bilhete existe? e depois de
  //    arrastar até o fim, a última célula entra no recorte?
  const tab = vista ? vista.querySelector('table') : null;
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
  pagina.on('pageerror', e => errosPagina.push('pageerror: ' + String(e && e.message).slice(0, 160)));
  pagina.on('console', m => { if (m.type() === 'error') errosPagina.push('console: ' + m.text().slice(0, 160)); });

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
    Object.assign(alvo, base);
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

  const navegar = async (tela) => {
    await pagina.evaluate((v) => { try { window.navigateTo(v); } catch (e) { } }, tela);
    await pagina.waitForTimeout(650);
  };

  for (const tela of TELAS) {
    await navegar(tela);
    const medido = await pagina.evaluate(medirTela);
    resultados.celular.push(medido);
  }

  // o modal de Chamados — é o que o relatório descreveu cortado nas duas bordas
  await navegar('manutencao');
  await pagina.evaluate(() => { try { window.abrirHistoricoChamadosGeral(); } catch (e) { } });
  await pagina.waitForTimeout(700);
  resultados.modal = await pagina.evaluate(medirModal);
  if (resultados.modal) await pagina.screenshot({ path: 'modal-celular.png' });
  await pagina.evaluate(() => { try { window.closeModal(); } catch (e) { } });

  // desktop: a promessa é que nada muda — nenhuma marca de rolagem deve aparecer
  await contexto.close();
  const contextoD = await navegador.newContext({ viewport: { width: 1365, height: 850 } });
  const paginaD = await contextoD.newPage();
  await paginaD.goto(URL_ALVO, { waitUntil: 'domcontentloaded' });
  await paginaD.waitForTimeout(1200);
  for (const tela of ['clientes', 'impressoras', 'contratos', 'financeiro', 'auditoria']) {
    await paginaD.evaluate((v) => { try { window.navigateTo(v); } catch (e) { } }, tela);
    await paginaD.waitForTimeout(500);
    const m = await paginaD.evaluate(medirTela);
    resultados.desktop.push({ tela: m.tela, bilheteNaTabela: !!(m.tabela && m.tabela.bilhete), bilheteNaFaixa: !!(m.faixa && m.faixa.bilhete), faixaPrecisaRolar: !!(m.faixa && m.faixa.naoCabe) });
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
      if (!t.bilhete) falhas.push(s.tela + ': tabela não cabe e o bilhete de arraste não apareceu');
    }
    if (t) linhas.push('| ' + s.tela + ' | ' + t.colunas + ' | ' + t.largura + ' | ' + t.disponivel + ' | ' + (t.naoCabe ? 'sim' : 'não') + ' | ' + (t.marcado ? '✓' : '—') + ' | ' + (t.bilhete ? '✓' : '—') + ' | ' + (t.ultimaColunaVisivel === undefined ? '—' : (t.ultimaColunaVisivel ? '✓' : '✗')) + ' |');
    else linhas.push('| ' + s.tela + ' | — | — | — | sem tabela | — | — | — |');
    if (temErro(s)) falhas.push(s.tela + ': abriu com o cartaz de tela sem conteúdo');
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

  const md = [
    '## Teste visual no navegador real — ' + resultados.verso,
    '',
    'Semeadura: `' + JSON.stringify(resultados.semeadura) + '`', '',
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
})();
