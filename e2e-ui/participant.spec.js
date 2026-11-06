const { test, expect } = require('@playwright/test');
const { createCampaign } = require('./helpers');

test('a participant goes from the code to the thank-you screen', async ({ page, request }) => {
  const campaign = await createCampaign(request);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Ingresa el código para comenzar/ })).toBeVisible();
  await page.getByLabel('Código de la actividad').fill(campaign.share_code);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  // Welcome: the name is required
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Escribe tu nombre o un seudónimo para continuar.')).toBeVisible();
  await page.getByLabel(/Tu nombre o seudónimo/).fill('Participante UI');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Comenzar' }).click();

  // Conversation
  await expect(page.getByRole('heading', { name: 'Conversación' }).first()).toBeVisible();
  await page.getByLabel(/Tu mensaje/).fill('Hola, necesito ayuda con mi caso');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByRole('log').getByText('Hola, necesito ayuda con mi caso')).toBeVisible();
  await expect(page.getByRole('log').locator('article')).toHaveCount(2, { timeout: 30_000 });
  await expect(page.getByText('Escribiendo…')).toBeHidden({ timeout: 30_000 });

  // Finish -> survey (required question blocks the submit button)
  await page.getByRole('button', { name: 'Terminar conversación' }).click();
  await page.getByRole('button', { name: 'Sí, terminar' }).click();
  await expect(page.getByRole('heading', { name: 'Cuéntanos cómo te fue' })).toBeVisible();
  const submit = page.getByRole('button', { name: 'Enviar y terminar' });
  await expect(submit).toBeDisabled();
  await page.getByText('4', { exact: true }).click();
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByRole('heading', { name: /Gracias, Participante UI/ })).toBeVisible();
  await expect(page.getByText('Ya puedes cerrar esta ventana.')).toBeVisible();
});

test('informed consent is required when the campaign asks for it', async ({ page, request }) => {
  const campaign = await createCampaign(request, {
    name: 'Con consentimiento',
    consent_required: true,
    consent_url: 'https://example.org/consent',
  });
  await page.goto(`/session/${campaign.share_code}`);
  await page.getByLabel(/Tu nombre o seudónimo/).fill('Ana');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Para participar necesitas aceptar el consentimiento.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'leer documento' })).toHaveAttribute('href', 'https://example.org/consent');
  await page.getByLabel(/He leído y acepto/).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('button', { name: 'Comenzar' })).toBeVisible();
});

test('the language switch translates the participant screens', async ({ page, request }) => {
  const campaign = await createCampaign(request, { name: 'Idiomas' });
  await page.goto('/');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Enter the code to start/ })).toBeVisible();
  await page.getByRole('button', { name: 'PT', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Digite o código para começar/ })).toBeVisible();

  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.goto(`/session/${campaign.share_code}`);
  await expect(page.getByLabel(/Your name or pseudonym/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
});
