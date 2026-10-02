const { test, expect } = require('@playwright/test');

test('troca de senha, nota única e diagnóstico da nuvem em fixture sem produção', async ({ page }) => {
  const pageErrors = [];
  const externalRequests = [];
  const dialogs = [];
  const baseURL = test.info().project.use.baseURL || 'http://127.0.0.1:4173';
  const appOrigin = new URL(baseURL).origin;

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  // Só libera o servidor local. Todos os endpoints remotos são fixtures; os
  // outros destinos externos são bloqueados para impedir tráfego de produção.
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === appOrigin) return route.continue();
    externalRequests.push({ url: url.origin + url.pathname, method: request.method() });
    if (request.method() === 'GET' && url.pathname === '/health') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ready: true, database: 'qa-fixture', schemaVersion: 'synthetic', setupConfigured: true, versao: 'qa-mock' }) });
    }
    if (request.method() === 'GET' && ['/v1/app-release', '/v1/app-releases'].includes(url.pathname)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false }) });
    }
    if (request.method() === 'GET' && url.pathname === '/v1/status') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ totals: {}, status: 'qa-fixture' }) });
    }
    return route.abort();
  });

  await page.addInitScript(() => {
    if (location.hostname !== '127.0.0.1') return;
    // Preferência somente desta sessão QA: mantém o fluxo legado local sem criar token.
    sessionStorage.setItem('digicopy_v5262_fechou_esta_sessao', '1');
    const fixture = {
      empresas: [{ id: 'qa-company', nome: 'Empresa Sintética', fantasia: 'Empresa Sintética', cnpj: '00000000000000' }],
      usuarios: [{ id: 'qa-admin', empresaId: 'qa-company', nome: 'Administrador QA', login: 'qa-admin', senha: 'senha-antiga-sintetica', perfil: 'Admin', ativo: true, senhaPadrao: true }],
      clientes: [], produtos: [], recargas: [], equipamentos: [], contratos: [], parque: [], leituras: [], os: [], vendas: [],
      orcamentos: [], contasReceber: [], contasPagar: [], logs: [], modulosDinamicos: {}, tecnicos: [],
      config: { empresa: { nome: 'Empresa Sintética', cnpj: '00000000000000' } }
    };
    localStorage.setItem('digicopy_erp_v42_demo_apresentacao', JSON.stringify(fixture));
  });
  await page.goto('/index.html');
  await expect(page.locator('#login-screen')).toBeVisible();
  await page.waitForFunction(() => window.db && Array.isArray(window.db.usuarios) && window.SENHA_HASH_PURE);

  await page.locator('#login-user').fill('qa-admin');
  await page.locator('#login-senha-user').fill('senha-antiga-sintetica');
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
  await expect(page.locator('#app-shell')).toBeVisible();
  // O primeiro login de fixture abre a tela real de troca obrigatória.
  await expect(page.locator('#modal-root')).toBeVisible({ timeout: 5000 });
  // Os dois avisos previstos no primeiro login (patch de versão e senha padrão)
  // devem poder ser reconhecidos/fechados sem impedir o formulário.
  await expect(page.locator('#digicopy-patch-notes')).toBeVisible({ timeout: 7000 });
  await expect(page.getByRole('button', { name: 'OK' })).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('button', { name: 'Entendi' }).click();
  await page.locator('#u-senha').fill('senha-final-sintetica');
  await page.getByRole('button', { name: 'Salvar usuário' }).click();
  await expect(page.locator('#modal-root')).toHaveClass(/hidden/);
  const changed = await page.evaluate(() => {
    const u = window.db.usuarios.find(x => x.id === 'qa-admin');
    return { senhaPadrao: u.senhaPadrao, senha: u.senha, hasHash: !!u.senhaHash && !!u.senhaSalt,
      oldAccepted: !!window.LOGIN_TELA_BRANCA_V52253_PURE.loginFlexivel('qa-admin', 'senha-antiga-sintetica', window.db.usuarios) };
  });
  expect(changed).toEqual({ senhaPadrao: false, senha: 'senha-final-sintetica', hasHash: true, oldAccepted: false });

  // As notas foram exibidas e marcadas antes do formulário; a chave é local e por versão.
  const seenKey = await page.evaluate(() => localStorage.getItem('digicopy_patch_visto_7.3.11'));
  expect(seenKey).toBe('1');
  await expect(page.locator('#digicopy-patch-notes')).toHaveCount(0);

  // Encerrar e autenticar novamente com a senha nova: sem novo modal obrigatório.
  await page.getByTitle('Sair do sistema').click();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.locator('#login-screen')).toBeVisible();
  await page.locator('#login-user').fill('qa-admin');
  await page.locator('#login-senha-user').fill('senha-final-sintetica');
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
  await expect(page.locator('#app-shell')).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(page.locator('#modal-root')).toHaveClass(/hidden/);
  await expect(page.locator('#digicopy-patch-notes')).toHaveCount(0);

  // Senha antiga é recusada após logout; o alerta é capturado sem bloquear o runner.
  await page.getByTitle('Sair do sistema').click();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.locator('#login-screen')).toBeVisible();
  await page.locator('#login-user').fill('qa-admin');
  await page.locator('#login-senha-user').fill('senha-antiga-sintetica');
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
  await expect(page.getByText(/Senha não confere para "qa-admin"/)).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('#login-screen')).toBeVisible();

  // Reentra com a senha vigente para testar o painel e o botão escondido do ponto.
  await page.locator('#login-user').fill('qa-admin');
  await page.locator('#login-senha-user').fill('senha-final-sintetica');
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
  await expect(page.locator('#app-shell')).toBeVisible();
  await page.locator('#btn-nuvem').click();
  await expect(page.locator('#digicopy-cloud-modal')).toBeVisible();
  await expect(page.getByText('Nuvem pronta. Este computador ainda não foi autorizado.')).toBeVisible();
  await expect(page.locator('#dc-secret')).toHaveAttribute('type', 'password');
  await expect(page.getByRole('button', { name: 'Ativar como administrador' })).toBeVisible();
  await page.locator('#dc-close').click();
  const diagBinding = await page.evaluate(() => ({
    available: typeof window.abrirDiagnosticoNuvem === 'function',
    loaded: !!window.__DIGICOPY_DIAG_NUVEM_V1
  }));
  expect(diagBinding).toEqual({ available: true, loaded: true });
  await page.locator('#dc-cloud-diag-trigger').click();
  await expect(page.locator('#dc-cloud-diagnostic')).toBeVisible();
  await expect(page.locator('#dc-cloud-diagnostic-status')).toContainText('este computador ainda não está autorizado');
  await expect(page.locator('#dc-cloud-diagnostic-rows')).toContainText('Respondendo e pronto');
  await page.locator('#dc-cloud-diagnostic').getByRole('button', { name: 'Fechar diagnóstico' }).click();

  // Acessar o menu real, não apenas a função isolada: o subtítulo técnico não deve aparecer.
  await page.getByRole('button', { name: 'Configurações' }).click();
  await page.getByText('Usuários e permissões', { exact: true }).last().click();
  await expect(page.locator('#view-usuarios')).toBeVisible();
  await expect(page.locator('#view-usuarios')).toContainText('Usuários e permissões');
  await expect(page.locator('#view-usuarios')).not.toContainText('Hierarquia:');

  // CRUD real de usuários na interface: criação, perfil, status e senha em branco.
  await page.locator('#view-usuarios').getByRole('button', { name: 'Novo usuário' }).click();
  await page.locator('#u-nome').fill('Usuário E2E Sintético');
  await page.locator('#u-login').fill('qa-e2e-user');
  await page.locator('#u-senha').fill('senha-e2e-sintetica');
  await page.getByRole('button', { name: 'Salvar usuário' }).click();
  const userRow = page.locator('#view-usuarios tr').filter({ hasText: 'qa-e2e-user' });
  await expect(userRow).toContainText('Funcionário');
  await expect(userRow).toContainText('Ativo');

  await userRow.getByRole('button').first().click();
  await expect(page.locator('#u-perfil')).toBeVisible();
  await page.locator('#u-perfil').selectOption('Admin');
  await page.locator('#u-ativo').selectOption('false');
  await expect(page.locator('#u-senha')).toHaveValue('');
  await page.getByRole('button', { name: 'Salvar usuário' }).click();
  await expect(userRow).toContainText('Admin');
  await expect(userRow).toContainText('Inativo');
  await expect(page.getByText(/O usuário NÃO ficou gravado/)).toHaveCount(0);
  await expect(page.getByText(/Usuário salvo como inativo/)).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  const syntheticUserState = await page.evaluate(() => {
    const u = window.db.usuarios.find(x => x.login === 'qa-e2e-user');
    return { exists: !!u, ativo: u?.ativo, perfil: u?.perfil, senha: u?.senha, hashed: !!u?.senhaHash && !!u?.senhaSalt };
  });
  expect(syntheticUserState).toEqual({ exists: true, ativo: false, perfil: 'Admin', senha: 'senha-e2e-sintetica', hashed: true });

  // Cadastro e edição de técnico sintético na mesma tela.
  await page.locator('#view-usuarios').getByRole('button', { name: 'Novo técnico' }).click();
  await page.locator('#tec-nome').fill('Técnico E2E Sintético');
  await page.getByRole('button', { name: 'Salvar técnico' }).click();
  let techRow = page.locator('#view-usuarios tr').filter({ hasText: 'Técnico E2E Sintético' });
  await expect(techRow).toBeVisible();
  await techRow.getByRole('button').first().click();
  await page.locator('#tec-nome').fill('Técnico E2E Editado');
  await page.getByRole('button', { name: 'Salvar' }).click();
  techRow = page.locator('#view-usuarios tr').filter({ hasText: 'Técnico E2E Editado' });
  await expect(techRow).toBeVisible();

  const authState = await page.evaluate(() => ({
    token: localStorage.getItem('digicopy_cloud_device_token_v1'),
    secretKeys: Object.keys(localStorage).filter(key => /secret/i.test(key))
  }));
  expect(authState.token).toBeNull();
  expect(authState.secretKeys).toEqual([]);
  expect(externalRequests.some(r => new URL(r.url).pathname === '/v1/snapshot')).toBeFalsy();
  const onlyReadFixtures = externalRequests.every(r => r.method === 'GET' && ['/health', '/v1/app-release', '/v1/app-releases', '/v1/status'].includes(new URL(r.url).pathname));
  expect(onlyReadFixtures, 'chamadas externas mockadas: ' + JSON.stringify(externalRequests)).toBeTruthy();
  expect(pageErrors).toEqual([]);
});
