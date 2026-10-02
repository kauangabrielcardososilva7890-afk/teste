const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const OUT_DIR = process.env.DIGICOPY_EVIDENCE_DIR || path.join(__dirname, 'test-results', 'personal-ui-audit');

test.setTimeout(120_000);

function fixture() {
  const empresaId = 'qa-company';
  const clienteId = 'qa-client-1';
  const equipamentoId = 'qa-equipment-1';
  const contratoId = 'qa-contract-1';
  const parqueId = 'qa-park-1';
  const now = new Date().toISOString();
  return {
    empresas: [{ id: empresaId, nome: 'Empresa Sintética QA', fantasia: 'Empresa QA', cnpj: '00000000000000', cidade: 'Cidade Teste', estado: 'MG' }],
    usuarios: [{ id: 'qa-admin', empresaId, nome: 'Administrador QA', login: 'qa-admin', senha: 'senha-qa-sintetica', senhaPadrao: false, perfil: 'Admin', ativo: true }],
    clientes: [{ id: clienteId, empresaId, nome: 'Cliente Exemplo QA', documento: '00000000000000', email: 'cliente@example.invalid', telefone: '(00) 00000-0000', endereco: 'Rua Sintética, 1', numero: '1', bairro: 'Centro', cidade: 'Cidade Teste', estado: 'MG', cep: '00000-000', status: 'ativo', criadoEm: now, criadoPorNome: 'Administrador QA' }],
    produtos: [{ id: 'qa-product-1', empresaId, sku: 'QA-TONER-01', nome: 'Toner Sintético QA', categoria: 'Toner', fabricante: 'Fabricante QA', estoque: 12, estoqueMin: 3, custo: 90, preco: 140, local: 'Prateleira QA', status: 'ativo', criadoEm: now, criadoPorNome: 'Administrador QA' }],
    recargas: [],
    equipamentos: [{ id: equipamentoId, empresaId, modelo: 'Impressora Sintética QA', fabricante: 'Marca QA', tipo: 'Laser Mono A4', patrimonio: '900001', serie: 'QA-SERIE-001', contadorPB: 1200, contadorCor: 0, status: 'locado', valorCompra: 0, criadoEm: now, criadoPorNome: 'Administrador QA' }],
    contratos: [{ id: contratoId, empresaId, numero: 'QA-2026-001', clienteId, dataInicio: '2026-01-01', dataFim: '2026-10-20', duracaoMeses: 12, diaVencimento: 10, franquiaPB: 3000, franquiaCor: 0, valorMensalFixo: 890, valorExcedentePB: 0.08, valorExcedenteCor: 0.45, status: 'ativo', equipamentos: [equipamentoId], criadoEm: now, criadoPorNome: 'Administrador QA' }],
    parque: [{ id: parqueId, empresaId, contratoId, clienteId, equipamentoId, setor: 'Recepção QA', enderecoInstalacao: 'Rua Sintética, 1', dataInstalacao: now, contadorInicialPB: 1000, contadorInicialCor: 0, status: 'ativo', criadoEm: now, criadoPorNome: 'Administrador QA' }],
    leituras: [{ id: 'qa-reading-1', empresaId, parqueId, equipamentoId, contratoId, clienteId, dataLeitura: now, contadorPBAnterior: 1000, contadorPB: 1200, contadorCorAnterior: 0, contadorCor: 0, consumoPB: 200, consumoCor: 0, valorExcedente: 0, faturar: false, status: 'pendente', criadoEm: now, criadoPorNome: 'Administrador QA' }],
    os: [{ id: 'qa-os-1', empresaId, numero: '900001', clienteId, parqueId, equipamentoId, tipo: 'corretiva', prioridade: 'alta', descricao: 'Verificação sintética de impressão', tecnico: 'qa-tech-1', status: 'em_atendimento', dataAbertura: now, dataFechamento: null, criadoEm: now, criadoPorNome: 'Administrador QA' }],
    vendas: [{ id: 'qa-sale-1', empresaId, numero: '900001', clienteId, data: now, itens: [{ produtoId: 'qa-product-1', qtd: 1, preco: 140, subtotal: 140 }], total: 140, formaPagamento: 'Dinheiro', status: 'faturado', criadoEm: now, criadoPorNome: 'Administrador QA' }],
    orcamentos: [{ id: 'qa-budget-1', empresaId, numero: '900001', clienteId, data: now, itens: [], total: 280, status: 'aberto', criadoEm: now, criadoPorNome: 'Administrador QA' }],
    contasReceber: [{ id: 'qa-cr-1', empresaId, origem: 'qa-fixture', clienteId, descricao: 'Título sintético QA', valor: 140, vencimento: '2026-10-10T12:00:00.000Z', pagamentoData: null, status: 'aberto', vendaId: 'qa-sale-1', criadoEm: now, criadoPorNome: 'Administrador QA' }],
    contasPagar: [{ id: 'qa-cp-1', empresaId, origem: 'qa-fixture', descricao: 'Conta sintética QA', valor: 35, vencimento: '2026-10-12T12:00:00.000Z', pagamentoData: null, status: 'aberto', criadoEm: now, criadoPorNome: 'Administrador QA' }],
    logs: [{ id: 'qa-log-1', empresaId, usuarioId: 'qa-admin', usuarioNome: 'Administrador QA', usuarioLogin: 'qa-admin', entidade: 'qa', acao: 'fixture', entidadeId: 'qa-log-1', detalhes: 'Registro sintético de auditoria', dataHora: now }],
    tecnicos: [{ id: 'qa-tech-1', empresaId, nome: 'Técnico QA', ativo: true }],
    modulosDinamicos: {},
    config: { empresa: { nome: 'Empresa Sintética QA', cnpj: '00000000000000', cidade: 'Cidade Teste', estado: 'MG' } }
  };
}

test('auditoria visual desktop do uso pessoal com fixture isolada', async ({ page }) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.setViewportSize({ width: 1365, height: 850 });
  const pageErrors = [];
  const externalRequests = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', async dialog => { pageErrors.push('native-dialog: ' + dialog.message()); await dialog.dismiss(); });
  const appOrigin = new URL(test.info().project.use.baseURL || 'http://127.0.0.1:4173').origin;

  // Allow only the local checkout. All off-origin traffic is blocked except
  // read-only service probes, which receive synthetic responses.
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === appOrigin) return route.continue();
    const requestRecord = { origin: url.origin, path: url.pathname, method: request.method(), queryKeys: [...url.searchParams.keys()], hasApprovalToken: url.searchParams.has('c'), approvalTokenLength: url.searchParams.get('c')?.length || 0 };
    externalRequests.push(requestRecord);
    if (request.method() === 'GET' && url.pathname === '/orcamento') {
      requestRecord.disposition = 'synthetic-mock';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, status: 'aberto' }) });
    }
    if (request.method() === 'GET' && url.pathname === '/health') {
      requestRecord.disposition = 'synthetic-mock';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ready: true, database: 'qa-fixture', schemaVersion: 'synthetic', setupConfigured: true, versao: 'qa-mock' }) });
    }
    if (request.method() === 'GET' && ['/v1/app-release', '/v1/app-releases', '/v1/status'].includes(url.pathname)) {
      requestRecord.disposition = 'synthetic-mock';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false, status: 'qa-fixture' }) });
    }
    requestRecord.disposition = 'aborted-before-network';
    return route.abort();
  });

  const dbFixture = fixture();
  await page.addInitScript(({ dbFixture }) => {
    if (location.hostname !== '127.0.0.1') return;
    window.__qaFetchTrace = [];
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function(input, init) {
      try {
        const raw = typeof input === 'string' ? input : input.url;
        const url = new URL(raw, location.href);
        if (url.pathname === '/orcamento') window.__qaFetchTrace.push({ pathname: url.pathname, queryKeys: [...url.searchParams.keys()], hasApprovalToken: url.searchParams.has('c'), approvalTokenLength: url.searchParams.get('c')?.length || 0, stack: String(new Error().stack || '').split('\n').slice(1, 7) });
      } catch (_) {}
      return nativeFetch(input, init);
    };
    sessionStorage.setItem('digicopy_v5262_fechou_esta_sessao', '1');
    localStorage.setItem('digicopy_erp_v42_demo_apresentacao', JSON.stringify(dbFixture));
    localStorage.setItem('digicopy_patch_visto_7.3.11', '1');
    localStorage.setItem('digicopy_patch_visto_7.3.12', '1');
    localStorage.setItem('digicopy_patch_visto_7.3.13', '1');
  }, { dbFixture });

  await page.goto('/index.html');
  await expect(page.locator('#login-screen')).toBeVisible();
  await page.waitForFunction(() => window.db && Array.isArray(window.db.clientes));
  await page.locator('#login-user').fill('qa-admin');
  await page.locator('#login-senha-user').fill('senha-qa-sintetica');
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
  await expect(page.locator('#app-shell')).toBeVisible();
  await expect(page.locator('#modal-root')).toHaveClass(/hidden/);
  await expect(page.locator('#digicopy-patch-notes')).toBeVisible({ timeout: 5000 });
  const releaseNotesFirstLogin = await page.evaluate(() => ({
    version: window.DIGICOPY_APP_VERSION,
    seenForCurrentVersion: localStorage.getItem(`digicopy_patch_visto_${window.DIGICOPY_APP_VERSION}`),
    previousVersionSeen: localStorage.getItem('digicopy_patch_visto_7.3.13')
  }));
  await page.getByRole('button', { name: 'Entendi', exact: true }).click();
  await expect(page.locator('#digicopy-patch-notes')).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(1400);
  if (await page.locator('#login-screen').isVisible().catch(() => false)) {
    await page.locator('#login-user').fill('qa-admin');
    await page.locator('#login-senha-user').fill('senha-qa-sintetica');
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await expect(page.locator('#app-shell')).toBeVisible();
    await page.waitForTimeout(1200);
  }
  const releaseNotesAfterReload = await page.locator('#digicopy-patch-notes').count();
  expect(releaseNotesFirstLogin.version, 'a aplicação deve usar a versão atual').toBe('7.3.14');
  expect(releaseNotesFirstLogin.seenForCurrentVersion, 'marcar como visto ao exibir, com chave da versão atual').toBe('1');
  expect(releaseNotesFirstLogin.previousVersionSeen, 'o marcador da versão anterior não suprime as notas atuais').toBe('1');
  expect(releaseNotesAfterReload, 'a nota não deve reaparecer depois de recarregar em modo sem nuvem real').toBe(0);
  const releaseNotesValidation = { ...releaseNotesFirstLogin, shownAfterReload: releaseNotesAfterReload === 1, stayedHiddenAfterReload: releaseNotesAfterReload === 0 };

  const result = {
    viewport: { width: 1365, height: 850 },
    releaseNotes: releaseNotesValidation,
    menuPreferences: await page.evaluate(() => ({
      session: typeof getSession === 'function' ? getSession() : null,
      dbUiMenus: window.db?.config?.uiMenus || null,
      deviceUiMenus: localStorage.getItem('digicopy_ui_menus_dispositivo_v1'),
      menuRelatedKeys: Object.keys(localStorage).filter(k => /menu|atalho/i.test(k))
    })),
    fixtureCounts: await page.evaluate(() => Object.fromEntries(['clientes','produtos','equipamentos','contratos','parque','leituras','os','vendas','orcamentos','contasReceber','contasPagar'].map(k => [k, (window.db?.[k] || []).length]))),
    budgetTokenCount: await page.evaluate(() => (window.db?.orcamentos || []).filter(x => x && x.token).length),
    routes: [], navigation: {}, externalRequests
  };
  result.dashboardProbe = await page.evaluate(() => {
    try {
      if (typeof initTemplates === 'function') initTemplates();
      if (typeof renderDashboard === 'function') renderDashboard();
      return { ok: true, dashboardIds: [...document.querySelectorAll('#view-dashboard [id]')].map(x => x.id) };
    } catch (e) {
      return { ok: false, name: e.name, message: e.message, stack: String(e.stack || '').split('\n').slice(0, 8) };
    }
  });
  console.log('DIAGNÓSTICO DO PAINEL:', JSON.stringify(result.dashboardProbe));
  const warningOk = page.getByRole('button', { name: 'OK', exact: true });
  if (await warningOk.count()) await warningOk.first().click({ timeout: 1500 }).catch(() => {});
  result.navigation = await page.evaluate(() => ({
    topnav: [...document.querySelectorAll('.modern-topnav .module > button')].map(x => ({ label: x.innerText.trim(), onclick: x.getAttribute('onclick') })),
    submenus: [...document.querySelectorAll('.modern-topnav .module-menu')].map(x => ({ id: x.id || '', display: getComputedStyle(x).display, visibility: getComputedStyle(x).visibility, buttons: [...x.querySelectorAll('button')].map(b => ({ text: b.textContent.trim(), onclick: b.getAttribute('onclick'), aria: b.getAttribute('aria-label'), display: getComputedStyle(b).display, visibility: getComputedStyle(b).visibility, width: Math.round(b.getBoundingClientRect().width), height: Math.round(b.getBoundingClientRect().height) })) })),
    views: [...document.querySelectorAll('main section.view')].map(x => x.id)
  }));

  async function capture(id, trigger, viewId) {
    console.log('Capturando tela:', id);
    try {
      let target;
      let menuForDebug = null;
      if (trigger.menuLabel) {
        const top = page.locator('.modern-topnav .module > button').filter({ hasText: trigger.menuLabel }).first();
        if (!(await top.count()) || !(await top.isVisible())) {
          result.routes.push({ id, ok: false, reason: `menu superior ausente: ${trigger.menuLabel}` });
          fs.writeFileSync(path.join(OUT_DIR, 'audit.partial.json'), JSON.stringify(result, null, 2));
          return;
        }
        await top.hover({ timeout: 2500 });
        await top.click({ timeout: 2500 });
        menuForDebug = top.locator('xpath=..').locator('.module-menu');
        await menuForDebug.waitFor({ state: 'visible', timeout: 1800 }).catch(() => {});
        target = menuForDebug.locator('button').filter({ hasText: trigger.menuItem }).first();
      } else if (trigger.selector) {
        target = page.locator(trigger.selector).first();
      } else {
        target = page.locator('.modern-topnav .module > button').filter({ hasText: trigger.label }).first();
      }
      const targetCount = await target.count();
      const targetVisible = targetCount ? await target.isVisible() : false;
      if (!targetCount || !targetVisible) {
        const menuState = menuForDebug && await menuForDebug.count() ? await menuForDebug.evaluate(m => ({ display: getComputedStyle(m).display, visibility: getComputedStyle(m).visibility, rect: { width: m.getBoundingClientRect().width, height: m.getBoundingClientRect().height }, buttons: [...m.querySelectorAll('button')].map(b => ({ text: b.textContent.trim(), onclick: b.getAttribute('onclick'), display: getComputedStyle(b).display, visibility: getComputedStyle(b).visibility, rect: { width: b.getBoundingClientRect().width, height: b.getBoundingClientRect().height } })) })).catch(() => null) : null;
        result.routes.push({ id, ok: false, reason: trigger.menuLabel ? `item ausente/oculto em ${trigger.menuLabel}: ${trigger.menuItem}` : 'controle de navegação ausente ou não visível', targetCount, targetVisible, menuState });
        fs.writeFileSync(path.join(OUT_DIR, 'audit.partial.json'), JSON.stringify(result, null, 2));
        return;
      }
      await target.click({ timeout: 2500 });
      await page.waitForTimeout(250);
      const view = page.locator(`#${viewId || `view-${id}`}`);
      if (viewId && await view.count()) await view.waitFor({ state: 'visible', timeout: 2500 }).catch(() => {});
      await page.mouse.move(850, 350);
      await page.waitForTimeout(120);
      const viewVisible = (await view.count()) ? await view.isVisible() : false;
      const title = await page.locator('#page-title').innerText().catch(() => '');
      const activeView = await page.locator('main section.view:not(.hidden)').evaluateAll(xs => xs.map(x => x.id));
      const screenshot = path.join(OUT_DIR, `${id}.png`);
      await page.screenshot({ path: screenshot, timeout: 5000 });
      const body = trigger.modal ? await page.locator('body').innerText().catch(() => '') : viewVisible ? await view.innerText().catch(() => '') : await page.locator('main').innerText().catch(() => '');
      const pageText = await page.locator('body').innerText().catch(() => '');
      const modalVisible = !!trigger.modal && !!trigger.expectedText && body.includes(trigger.expectedText);
      const expectedTextMatched = !!trigger.expectedText && pageText.includes(trigger.expectedText);
      result.routes.push({ id, ok: viewVisible || modalVisible || expectedTextMatched, modalVisible, expectedTextMatched, title, activeView, hasSyntheticMarker: body.includes('QA'), screenshot, textStart: body.slice(0, 220), navigation: trigger.menuLabel ? `${trigger.menuLabel} > ${trigger.menuItem}` : trigger.label || trigger.selector || 'ação direta' });
      if (trigger.closeAfter === 'backup') await page.getByRole('button', { name: 'Fechar', exact: true }).last().click({ timeout: 1800 }).catch(() => {});
      if (trigger.closeAfter === 'cloud') await page.locator('#dc-close').click({ timeout: 1800 }).catch(() => {});
      if (trigger.closeAfter === 'modal') await page.locator('#modal-root button[onclick="closeModal()"]:visible').first().click({ timeout: 1800 }).catch(() => {});
    } catch (error) {
      result.routes.push({ id, ok: false, reason: String(error.message).slice(0, 200) });
      console.log('Falha ao abrir', id, String(error.message).slice(0, 120));
    }
    fs.writeFileSync(path.join(OUT_DIR, 'audit.partial.json'), JSON.stringify(result, null, 2));
  }

  const routes = [
    { id: 'dashboard', label: 'Início', view: 'dashboard' },
    { id: 'vendas', menuLabel: 'Atendimento', menuItem: 'Consultar notinhas', view: 'vendas' },
    { id: 'orcamentos', menuLabel: 'Atendimento', menuItem: 'Orçamentos', view: 'orcamentos' },
    { id: 'produtos', label: 'Produtos', view: 'produtos' },
    { id: 'clientes', menuLabel: 'Cadastros', menuItem: 'Clientes', view: 'clientes' },
    { id: 'contratos', menuLabel: 'Locação', menuItem: 'Contratos', view: 'contratos' },
    { id: 'parque', menuLabel: 'Locação', menuItem: 'Máquinas nos clientes', view: 'impressoras', expectedText: 'Todas as impressoras cadastradas nos clientes' },
    { id: 'leituras', menuLabel: 'Locação', menuItem: 'Leituras', view: 'contratos', expectedText: 'Lançar leitura' },
    { id: 'impressoras', menuLabel: 'Locação', menuItem: 'Impressoras', view: 'impressoras' },
    { id: 'financeiro', label: 'Financeiro', view: 'financeiro' },
    { id: 'config', menuLabel: 'Configurações', menuItem: 'Preferências', view: 'config' },
    { id: 'usuarios', menuLabel: 'Configurações', menuItem: 'Usuários e permissões', view: 'usuarios' },
    { id: 'auditoria', menuLabel: 'Configurações', menuItem: 'Auditoria', view: 'auditoria' },
    { id: 'central-nf', menuLabel: 'Fiscal', menuItem: 'Nota Fiscal', view: 'central-nf' },
    { id: 'fiscal-perfil', menuLabel: 'Fiscal', menuItem: 'Perfil Tributário', view: 'fiscal-perfil' },
    { id: 'fiscal-manifestacao', menuLabel: 'Fiscal', menuItem: 'Manifestação', view: 'fiscal-manifestacao' },
    { id: 'fiscal-ncm', menuLabel: 'Fiscal', menuItem: 'NCM', view: 'fiscal-ncm' },
    { id: 'fiscal-enviar-xml', menuLabel: 'Fiscal', menuItem: 'Enviar XML', view: 'fiscal-enviar-xml' },
    { id: 'config-fiscal', menuLabel: 'Fiscal', menuItem: 'Configurações', view: 'config-fiscal' },
    { id: 'buscador-escola', label: 'Buscador Escola', view: 'buscador-escola' },
    { id: 'backup', label: 'Backup', modal: true, expectedText: 'Backup do sistema', closeAfter: 'backup' },
    { id: 'nuvem', label: 'Nuvem', modal: true, expectedText: 'Nuvem DIGICOPY', closeAfter: 'cloud' },
    { id: 'chamado-rapido', menuLabel: 'Atendimento', menuItem: 'Abrir chamado', modal: true, expectedText: 'Chamados', closeAfter: 'modal' }
  ];
  for (const route of routes) await capture(route.id, route, route.view ? `view-${route.view}` : undefined);

  // Regressão: limpar o campo sem clicar na lupa e escolher Mostrar todos não
  // pode recuperar a busca antiga do renderer de Contratos.
  await page.evaluate(() => navigateTo('contratos'));
  await expect(page.locator('#view-contratos')).toBeVisible();
  await page.locator('#ctr-filtro-campo').selectOption('todos');
  await page.locator('#search-contratos').fill('QA-2026-001');
  await page.locator('#search-contratos + button').click();
  await expect(page.locator('#view-contratos tbody')).toContainText(/Cliente Exemplo QA/i);
  await page.locator('#search-contratos').fill('');
  await page.locator('#ctr-mostrar-todos').click();
  await expect(page.locator('#search-contratos')).toHaveValue('');
  await expect(page.locator('#view-contratos tbody')).toContainText(/Cliente Exemplo QA/i);
  result.contractSearchAudit = await page.evaluate(() => ({
    filterQuery: window.__CTR_FILTRO_V52237?.q,
    rendererQuery: window.__CONTRATOS_FINAL_STATE__?.busca,
    filterField: window.__CTR_FILTRO_V52237?.campo,
    rendererStatus: window.__CONTRATOS_FINAL_STATE__?.status,
    visibleRows: document.querySelectorAll('#view-contratos tbody tr').length
  }));
  expect(result.contractSearchAudit.filterQuery).toBe('');
  expect(result.contractSearchAudit.rendererQuery).toBe('');
  expect(result.contractSearchAudit.filterField).toBe('todos');
  expect(result.contractSearchAudit.rendererStatus).toBe('');
  await page.screenshot({ path: path.join(OUT_DIR, 'contratos-busca-mostrar-todos.png') });

  // Fluxo Fiscal real em DOM com dados sintéticos: abre um rascunho local, cria
  // um item QA e percorre os cartões inspirados nas referências antigas.
  await page.evaluate(() => { if (typeof navigateTo === 'function') navigateTo('central-nf'); });
  await page.waitForFunction(() => !!document.querySelector('#view-central-nf') && !document.querySelector('#view-central-nf').classList.contains('hidden'));
  await page.evaluate(() => window.fxAcao('nf-novo'));
  await page.evaluate(() => window.fxAcao('nf-aba', 'Itens da Nota'));
  await expect(page.locator('#fx-it-desc')).toBeVisible();
  await page.locator('#fx-it-desc').fill('Item Fiscal Sintético QA');
  await page.locator('#fx-it-qtd').fill('2');
  await page.locator('#fx-it-vu').fill('50');
  await page.locator('#view-central-nf button[onclick="fxAcao(\'nf-item-add\')"]').click();
  await page.locator('#view-central-nf button[title="Tributação do item"]').last().click();
  await expect(page.locator('#fx-trib-corpo')).toContainText('Dados do Produto');
  await expect(page.locator('#fx-trib-corpo')).toContainText('Alterar para Todos');
  await page.screenshot({ path: path.join(OUT_DIR, 'fiscal-item-cabecalho.png') });

  const fiscalMainTabs = page.locator('#fx-trib-corpo .fx-tabs').first();
  await fiscalMainTabs.getByText('Importação', { exact: true }).click();
  await expect(page.locator('#fx-trib-corpo')).toContainText('Dados para Declaração');
  await expect(page.locator('#fx-trib-corpo')).toContainText('Dados do País');
  await page.locator('[data-fx="tribItem.imp2.di"]').fill('DI-QA-001');
  await page.locator('[data-fx="tribItem.imp2.adicaoNumero"]').fill('1');
  await page.locator('[data-fx="tribItem.imp2.codPais"]').fill('9999');
  await page.locator('[data-fx="tribItem.imp2.nomePais"]').fill('PAÍS SINTÉTICO QA');
  await page.screenshot({ path: path.join(OUT_DIR, 'fiscal-importacao.png') });
  const countryNameField = page.locator('[data-fx="tribItem.imp2.nomePais"]');
  await countryNameField.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const importBottomVisible = await countryNameField.evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight - 120;
  });
  expect(importBottomVisible, 'Dados do País precisa ficar acessível ao rolar, acima da barra fixa').toBe(true);
  await page.screenshot({ path: path.join(OUT_DIR, 'fiscal-importacao-inferior.png') });

  await page.locator('#fx-trib-corpo .fx-tabs').first().getByText('Outros', { exact: true }).click();
  await expect(page.locator('#fx-trib-corpo')).toContainText('Valor DIF.');
  await page.screenshot({ path: path.join(OUT_DIR, 'fiscal-outros-csosn.png') });
  const outrasTabs = page.locator('#fx-trib-corpo .fx-tabs').nth(1);
  await outrasTabs.getByText('Icms ST', { exact: true }).click();
  await expect(page.locator('#fx-trib-corpo')).toContainText('Vlr. Substituído');
  await page.screenshot({ path: path.join(OUT_DIR, 'fiscal-outros-st.png') });
  await page.locator('#fx-trib-corpo .fx-tabs').nth(1).getByText('Fcp', { exact: true }).click();
  await page.locator('[data-fx="tribItem.trib2.fcpBase"]').fill('100');
  await page.locator('[data-fx="tribItem.trib2.fcpPerc"]').fill('2');
  await page.locator('[data-fx="tribItem.trib2.fcpValor"]').fill('2');
  await page.screenshot({ path: path.join(OUT_DIR, 'fiscal-outros-fcp.png') });
  await page.locator('#fx-trib-corpo .fx-tabs').nth(1).getByText('Efetivo', { exact: true }).click();
  await expect(page.locator('#fx-trib-corpo')).toContainText('Redução Efetivo');
  await page.screenshot({ path: path.join(OUT_DIR, 'fiscal-outros-efetivo.png') });
  await page.locator('#fx-trib-corpo .fx-tabs').nth(1).getByText('Outros', { exact: true }).click();
  await expect(page.locator('#fx-trib-corpo')).toContainText('Total Parcial Comercial');
  await expect(page.locator('#fx-trib-corpo')).toContainText('Total Parcial Tributável');
  await page.screenshot({ path: path.join(OUT_DIR, 'fiscal-outros-comercial-tributavel.png') });

  await page.locator('#fx-trib-corpo .fx-tabs').first().getByText('Reforma Tributária', { exact: true }).click();
  await expect(page.locator('#fx-trib-corpo')).toContainText('Alíquota em branco não calcula valor');
  const fiscalPersisted = await page.evaluate(() => {
    const note = (window.db?.notasNf || []).find(n => (n.itens || []).some(i => i.descricao === 'Item Fiscal Sintético QA'));
    const item = note && note.itens.find(i => i.descricao === 'Item Fiscal Sintético QA');
    return item ? { numero: note.numero, descricao: item.descricao, quantidade: item.qtd, valorUnitario: item.vunit, di: item.trib?.imp?.di, adicaoNumero: item.trib?.imp?.adicaoNumero, codPais: item.trib?.imp?.codPais, nomePais: item.trib?.imp?.nomePais, fcpBase: item.trib?.fcpBase, fcpPerc: item.trib?.fcpPerc, fcpValor: item.trib?.fcpValor } : null;
  });
  result.fiscalEditorAudit = { syntheticOnly: true, transmissionAttempted: false, importBottomVisibleAfterScroll: importBottomVisible, persisted: fiscalPersisted };
  expect(fiscalPersisted, 'o rascunho Fiscal deve guardar as alterações entre subabas').toMatchObject({ descricao: 'Item Fiscal Sintético QA', quantidade: 2, valorUnitario: '50', di: 'DI-QA-001', adicaoNumero: '1', codPais: '9999', nomePais: 'PAÍS SINTÉTICO QA', fcpBase: '100', fcpPerc: '2', fcpValor: '2' });
  await page.screenshot({ path: path.join(OUT_DIR, 'fiscal-reforma-ibs-cbs.png') });

  const failedRoutes = result.routes.filter(x => !x.ok);
  expect(failedRoutes, 'rotas sem tela/modal visualmente aberto: ' + JSON.stringify(failedRoutes)).toEqual([]);
  for (const id of ['parque', 'leituras']) {
    const route = result.routes.find(x => x.id === id);
    expect(route?.expectedTextMatched, `o atalho ${id} deve mostrar o destino consolidado esperado`).toBe(true);
  }
  result.pageErrors = pageErrors;
  result.externalRequestSummary = externalRequests;
  result.cloudFetchTrace = await page.evaluate(() => window.__qaFetchTrace || []);
  expect(externalRequests.filter(x => x.path === '/orcamento'), 'orçamentos locais não podem consultar a API sem autorização de Nuvem').toEqual([]);
  expect(externalRequests.every(x => ['synthetic-mock', 'aborted-before-network'].includes(x.disposition)), 'nenhuma chamada externa pode chegar a um serviço real: ' + JSON.stringify(externalRequests)).toBeTruthy();
  fs.writeFileSync(path.join(OUT_DIR, 'audit.json'), JSON.stringify(result, null, 2));
  expect(pageErrors, 'erros de JavaScript na navegação: ' + JSON.stringify(pageErrors)).toEqual([]);
  expect(externalRequests.every(x => x.disposition && x.method === 'GET'), 'requisição externa sem contenção ou método mutável: ' + JSON.stringify(externalRequests)).toBeTruthy();
});
