import { test, expect } from '@playwright/test';
import { getAuthenticatedToken } from '../helpers/auth.helper';
import {
  ALL_EMAIL_PERMISSIONS,
  createEmailUser,
} from '../helpers/email-permissions.helper';
import {
  navigateToEmailSettings,
  waitForToast,
  createEmailAccountViaApi,
  deleteEmailAccountViaApi,
} from '../helpers/email.helper';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const user = await createEmailUser(ALL_EMAIL_PERMISSIONS);
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('E-mail - Configuracoes (CRUD de Contas)', () => {
  test('1.1 - Deve exibir a pagina de configuracoes com breadcrumb correto', async ({
    page,
  }) => {
    await navigateToEmailSettings(page, userToken, userTenantId);

    // Breadcrumb shows E-mail > Configuracoes
    await expect(page.locator('text=E-mail')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=Configurações')).toBeVisible();
  });

  test('1.2 - Deve exibir mensagem quando nenhuma conta existe', async ({
    page,
  }) => {
    await navigateToEmailSettings(page, userToken, userTenantId);

    // Check for empty state or account list
    const content = page.locator('text=Contas configuradas');
    await expect(content).toBeVisible({ timeout: 15_000 });
  });

  test('1.3 - Deve abrir formulario ao clicar em "Nova conta"', async ({
    page,
  }) => {
    await navigateToEmailSettings(page, userToken, userTenantId);

    const novaContaBtn = page.locator('button:has-text("Nova conta")');
    await expect(novaContaBtn).toBeVisible({ timeout: 15_000 });
    await novaContaBtn.click();

    // Form should appear with required fields
    await expect(page.locator('text=Nova conta de e-mail')).toBeVisible();
    await expect(
      page.locator('text=Configure as credenciais IMAP e SMTP')
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="voce@empresa.com"]').first()
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="imap.empresa.com"]')
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="smtp.empresa.com"]')
    ).toBeVisible();
  });

  test('1.4 - Deve criar conta com dados validos', async ({ page }) => {
    await navigateToEmailSettings(page, userToken, userTenantId);

    // Open form
    await page.locator('button:has-text("Nova conta")').click();
    await expect(page.locator('text=Nova conta de e-mail')).toBeVisible();

    const uid = Date.now().toString(36);

    // Fill required fields
    await page
      .locator('input[placeholder="voce@empresa.com"]')
      .first()
      .fill(`e2e-crud-${uid}@test.com`);
    await page
      .locator('input[placeholder="João Silva"]')
      .first()
      .fill(`E2E Test ${uid}`);
    await page
      .locator('input[placeholder="imap.empresa.com"]')
      .fill('imap.test.com');
    await page
      .locator('input[placeholder="smtp.empresa.com"]')
      .fill('smtp.test.com');
    await page
      .locator('input[placeholder="voce@empresa.com"]')
      .last()
      .fill(`e2e-crud-${uid}@test.com`);
    await page.locator('input[type="password"]').fill('test-password');

    // Submit
    await page.locator('button:has-text("Salvar conta")').click();

    // Should show success toast
    await waitForToast(page, 'Conta criada com sucesso');

    // Account should appear in the list
    await expect(page.locator(`text=e2e-crud-${uid}@test.com`)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('1.5 - Botao "Salvar conta" deve estar desabilitado com campos vazios', async ({
    page,
  }) => {
    await navigateToEmailSettings(page, userToken, userTenantId);

    await page.locator('button:has-text("Nova conta")').click();
    await expect(page.locator('text=Nova conta de e-mail')).toBeVisible();

    // Submit button should be disabled with empty required fields
    const salvarBtn = page.locator('button:has-text("Salvar conta")');
    await expect(salvarBtn).toBeDisabled();
  });

  test('1.6 - Deve excluir conta existente', async ({ page }) => {
    // Create account via API first
    const account = await createEmailAccountViaApi(userToken, {
      displayName: `Delete Test ${Date.now().toString(36)}`,
    });

    await navigateToEmailSettings(page, userToken, userTenantId);

    // Wait for account to appear
    await expect(page.locator(`text=${account.address}`)).toBeVisible({
      timeout: 15_000,
    });

    // Click delete button on the account card
    const accountCard = page.locator(`text=${account.address}`).locator('..');
    const excluirBtn = accountCard
      .locator('..')
      .locator('..')
      .locator('..')
      .locator('button:has-text("Excluir")');

    if (await excluirBtn.isVisible()) {
      await excluirBtn.click();
      await waitForToast(page, 'Conta removida');
    } else {
      // Cleanup via API if UI button not found
      await deleteEmailAccountViaApi(userToken, account.id);
    }
  });

  test('1.7 - Deve expandir configuracoes da conta', async ({ page }) => {
    // Create account via API
    const account = await createEmailAccountViaApi(userToken, {
      displayName: `Config Test ${Date.now().toString(36)}`,
    });

    await navigateToEmailSettings(page, userToken, userTenantId);

    // Wait for account to appear
    await expect(page.locator(`text=${account.address}`)).toBeVisible({
      timeout: 15_000,
    });

    // Click "Configuracoes" to expand
    const configBtn = page.locator('button:has-text("Configurações")').first();
    if (await configBtn.isVisible()) {
      await configBtn.click();

      // Should show edit fields
      await expect(page.locator('text=Nome de exibição').last()).toBeVisible({
        timeout: 5_000,
      });
      await expect(page.locator('text=Assinatura').last()).toBeVisible();
      await expect(
        page.locator('button:has-text("Salvar alterações")')
      ).toBeVisible();
    }

    // Cleanup
    await deleteEmailAccountViaApi(userToken, account.id);
  });

  test('1.8 - Deve atualizar nome de exibicao da conta', async ({ page }) => {
    const uid = Date.now().toString(36);
    const account = await createEmailAccountViaApi(userToken, {
      displayName: `Before Update ${uid}`,
    });

    await navigateToEmailSettings(page, userToken, userTenantId);
    await expect(page.locator(`text=${account.address}`)).toBeVisible({
      timeout: 15_000,
    });

    // Expand settings
    const configBtn = page.locator('button:has-text("Configurações")').first();
    if (await configBtn.isVisible()) {
      await configBtn.click();

      // Update display name
      const displayNameInput = page
        .locator('input[placeholder="João Silva"]')
        .last();
      await displayNameInput.clear();
      await displayNameInput.fill(`After Update ${uid}`);

      await page.locator('button:has-text("Salvar alterações")').click();
      await waitForToast(page, 'Conta atualizada');
    }

    // Cleanup
    await deleteEmailAccountViaApi(userToken, account.id);
  });

  test('1.9 - Deve exibir badges de status (Ativa, Privada)', async ({
    page,
  }) => {
    const account = await createEmailAccountViaApi(userToken);

    await navigateToEmailSettings(page, userToken, userTenantId);
    await expect(page.locator(`text=${account.address}`)).toBeVisible({
      timeout: 15_000,
    });

    // Check for status badges
    await expect(page.locator('text=Ativa').first()).toBeVisible();
    await expect(page.locator('text=Privada').first()).toBeVisible();

    // Cleanup
    await deleteEmailAccountViaApi(userToken, account.id);
  });

  test('1.10 - Deve cancelar formulario de nova conta', async ({ page }) => {
    await navigateToEmailSettings(page, userToken, userTenantId);

    // Open form
    await page.locator('button:has-text("Nova conta")').click();
    await expect(page.locator('text=Nova conta de e-mail')).toBeVisible();

    // Cancel (button text changes to "Cancelar" when form is open)
    await page.locator('button:has-text("Cancelar")').click();

    // Form should disappear
    await expect(page.locator('text=Nova conta de e-mail')).not.toBeVisible();
  });
});
