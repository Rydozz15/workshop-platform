const { test, expect } = require('@playwright/test');
const { adminLogin, createCampaign, ADMIN_PASSWORD } = require('./helpers');

test('admin API is closed without a session, and the wrong password is rejected', async ({ page, request }) => {
  const res = await request.get('/api/admin/campaigns');
  expect(res.status()).toBe(401);

  await page.goto('/admin');
  await page.locator('input[type=password]').fill('incorrecta');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Contraseña incorrecta')).toBeVisible();
  await expect(page.getByText(ADMIN_PASSWORD)).toHaveCount(0);

  await page.getByRole('button', { name: '¿No sabes la contraseña?' }).click();
  await expect(page.getByText(/ADMIN_PASSWORD/)).toBeVisible();
  await expect(page.getByText('workshop2025')).toHaveCount(0);
});

test('create a campaign with three conditions, then see it in the list with its code', async ({ page }) => {
  await adminLogin(page);
  await page.getByRole('link', { name: 'Campañas' }).first().click();
  await page.getByRole('link', { name: 'Crear campaña' }).click();

  await page.getByLabel(/Nombre de la campaña/).fill('Estudio de tres estilos');
  await page.getByLabel(/Condición 1/).fill('Neutro');
  await page.getByLabel(/Caso o escenario/).fill('Un caso para conversar.');
  for (const [n, title] of [[2, 'Socrático'], [3, 'Directo']]) {
    await page.getByRole('button', { name: 'Agregar condición' }).click();
    await page.getByLabel(new RegExp(`Condición ${n}`)).fill(title);
    await page.getByLabel(/Caso o escenario/).nth(n - 1).fill(`Caso ${title}`);
  }
  await page.getByRole('button', { name: 'Guardar campaña' }).first().click();

  await expect(page.getByRole('heading', { name: 'Estudio de tres estilos' })).toBeVisible();
  await expect(page.getByText('Condiciones:').first()).toBeVisible();
});

test('saving an incomplete campaign explains what is missing', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/campaigns/new');
  await page.getByRole('button', { name: 'Guardar campaña' }).first().click();
  await expect(page.getByText('La campaña necesita un nombre.')).toBeVisible();
});

test('live view shows alerts and results can be downloaded as CSV', async ({ page, request }) => {
  const campaign = await createCampaign(request, { name: 'Para descargar' });
  // one participant joins through the API so there is data
  await request.post('/api/session/join', { data: { code: campaign.share_code, participant_name: 'Datos', chain_user_id: 'ui-user-1' } });

  await adminLogin(page);
  await page.getByRole('combobox').first().selectOption({ label: 'Para descargar' });
  await expect(page.getByText('Avance por paso')).toBeVisible();

  await page.getByRole('link', { name: 'Resultados' }).first().click();
  await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible();
  await page.getByLabel('Campaña').selectOption({ label: 'Para descargar' });
  await expect(page.getByRole('button', { name: 'Descargar' })).toBeEnabled();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar' }).click()]);
  expect(download.suggestedFilename()).toMatch(/para-descargar_sesiones_.*\.csv$/);
});

test('admin screens switch language', async ({ page }) => {
  await adminLogin(page);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Campaigns' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Results' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Results' }).first().click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  await expect(page.getByText('Download data')).toBeVisible();
});
