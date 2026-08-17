const { test, expect } = require('@playwright/test');

test('abre o painel Cloudflare real sem ativar nem enviar dados', async ({ page }) => {
  const pageErrors = [];
  const firebaseCalls = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    if (/firestore\.googleapis|identitytoolkit\.googleapis/.test(request.url())) {
      firebaseCalls.push(request.url());
    }
  });

  await page.goto('/index.html');
  await expect(page.locator('#login-screen')).toBeVisible();
  await page.locator('#login-user').fill('kauan');
  await page.locator('#login-senha-user').fill('6132');
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();

  await expect(page.locator('#app-shell')).toBeVisible();
  await expect(page.locator('#btn-nuvem')).toBeVisible();
  await page.locator('#btn-nuvem').click();

  await expect(page.locator('#digicopy-cloud-modal')).toBeVisible();
  await expect(page.getByText('Nuvem pronta. Este computador ainda não foi autorizado.')).toBeVisible();
  await expect(page.locator('#dc-secret')).toHaveAttribute('type', 'password');
  await expect(page.getByRole('button', { name: 'Ativar como administrador' })).toBeVisible();

  const authState = await page.evaluate(() => ({
    token: localStorage.getItem('digicopy_cloud_device_token_v1'),
    secretKeys: Object.keys(localStorage).filter(key => /secret/i.test(key))
  }));
  expect(authState.token).toBeNull();
  expect(authState.secretKeys).toEqual([]);
  expect(firebaseCalls).toEqual([]);
  expect(pageErrors).toEqual([]);
});
