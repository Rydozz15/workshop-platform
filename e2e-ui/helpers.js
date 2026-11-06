const { expect } = require('@playwright/test');

const ADMIN_PASSWORD = 'ui-test-pass';

/** Logs in through the real login form. */
async function adminLogin(page) {
  await page.goto('/admin');
  await page.locator('input[type=password]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'En vivo' })).toBeVisible();
}

/** Creates a campaign through the authenticated API and returns its detail (incl. share_code). */
async function createCampaign(request, overrides = {}) {
  const login = await request.post('/api/auth', { data: { password: ADMIN_PASSWORD } });
  expect(login.ok()).toBeTruthy();
  const res = await request.post('/api/admin/campaigns', {
    data: {
      name: 'Campaña de prueba UI',
      consent_required: false,
      steps: [
        {
          name: 'Única parte',
          survey_config: [
            { id: 'util', text: '¿Te resultó útil?', type: 'likert', required: true },
            { id: 'extra', text: 'Comentarios', type: 'text', required: false },
          ],
          conditions: [
            { title: 'Neutro', case_content: '# Caso A\nTexto del caso A.' },
            { title: 'Socrático', case_content: '# Caso B\nTexto del caso B.', system_prompt: 'Pregunta más de lo que respondes.' },
          ],
        },
      ],
      ...overrides,
    },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

module.exports = { ADMIN_PASSWORD, adminLogin, createCampaign };
