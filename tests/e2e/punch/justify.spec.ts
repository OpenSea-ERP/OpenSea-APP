/**
 * /punch/justify/[id] — Playwright smoke compile-only spec.
 *
 * Phase 8 / Plan 08-03 / Task 3.
 *
 * Compile-only: o spec é parseável (`npx playwright test --list`). Os steps
 * runtime exigem stack local rodando (API + APP + Redis + Postgres + login
 * humano) — quando indisponível, UAT-08 é deferida pra HUMAN-UAT (pattern
 * Phase 7-06 → 07-HUMAN-UAT). Os assertions abaixo cobrem o happy path do
 * fluxo D-07/D-08:
 *
 *   1. Funcionário acessa /punch/justify/{timeEntryId} e vê o page chrome
 *      mobile-first (testid `punch-justify-page`).
 *   2. Form de justificativa renderiza com select "Motivo", textarea
 *      "Descrição" e o submit "Enviar justificativa".
 *   3. Preenche formulário com valor e descrição válidos → botão habilita.
 */

import { expect, test } from '@playwright/test';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page
    .getByPlaceholder('Email, CPF ou Matrícula')
    .fill('admin@teste.com');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByPlaceholder('••••••••').fill('Teste@123');
  await page.getByRole('button', { name: /Entrar|Login/i }).click();
  await page.waitForLoadState('networkidle');
}

test.describe('Punch Justify Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('renders form for given time entry id', async ({ page }) => {
    await page.goto('/punch/justify/te-mock-123');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('punch-justify-page')).toBeVisible();
    await expect(page.getByText('Justificar batida')).toBeVisible();
    await expect(page.getByTestId('justification-form')).toBeVisible();
  });

  test('submit button enables after filling required fields', async ({
    page,
  }) => {
    await page.goto('/punch/justify/te-mock-123');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Motivo').selectOption('EMPLOYEE_SELF_REQUEST');
    await page
      .getByLabel('Descrição')
      .fill(
        'Esqueci de bater o ponto na entrada hoje, esqueci o celular em casa.'
      );
    const submit = page.getByTestId('justification-form-submit');
    await expect(submit).toBeEnabled();
  });

  test('attachment picker exposes 3 trigger buttons', async ({ page }) => {
    await page.goto('/punch/justify/te-mock-123');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('attachment-picker')).toBeVisible();
    await expect(page.getByTestId('attachment-picker-camera')).toBeVisible();
    await expect(page.getByTestId('attachment-picker-gallery')).toBeVisible();
    await expect(page.getByTestId('attachment-picker-pdf')).toBeVisible();
  });
});
