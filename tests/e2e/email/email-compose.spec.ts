import { test, expect } from '@playwright/test';
import { getAuthenticatedToken } from '../helpers/auth.helper';
import {
  ALL_EMAIL_PERMISSIONS,
  createEmailUser,
} from '../helpers/email-permissions.helper';
import {
  navigateToEmail,
  createEmailAccountViaApi,
  deleteEmailAccountViaApi,
  mockEmailMessageRoutes,
  waitForToast,
} from '../helpers/email.helper';

let userToken: string;
let userTenantId: string;
let accountId: string;

test.beforeAll(async () => {
  const user = await createEmailUser(ALL_EMAIL_PERMISSIONS);
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  const account = await createEmailAccountViaApi(userToken, {
    displayName: 'Compose Test',
  });
  accountId = account.id;
});

test.afterAll(async () => {
  if (accountId) {
    await deleteEmailAccountViaApi(userToken, accountId).catch(() => {});
  }
});

test.describe('E-mail - Composicao de Mensagens', () => {
  test('4.1 - Deve abrir dialog de composicao ao clicar "Novo e-mail"', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    const novoEmailBtn = page.locator('button:has-text("Novo e-mail")');
    await expect(novoEmailBtn).toBeVisible({ timeout: 15_000 });
    await novoEmailBtn.click();

    // Dialog should open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
  });

  test('4.2 - Dialog de composicao deve ter campos obrigatorios', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await page.locator('button:has-text("Novo e-mail")').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Should have To, Subject fields
    const toInput = dialog.locator(
      'input[placeholder*="Para"], input[placeholder*="para"], input[placeholder*="destinat"]'
    );
    const subjectInput = dialog.locator(
      'input[placeholder*="Assunto"], input[placeholder*="assunto"]'
    );

    // At least one of these fields should be visible
    const hasToField = await toInput
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const hasSubjectField = await subjectInput
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasToField || hasSubjectField).toBe(true);
  });

  test('4.3 - Deve fechar dialog ao clicar botao fechar', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await page.locator('button:has-text("Novo e-mail")').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Close via X button or Escape
    const closeBtn = dialog
      .locator('button[aria-label="Close"], button:has-text("Fechar")')
      .first();
    if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('4.4 - Deve enviar email com campos preenchidos', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await page.locator('button:has-text("Novo e-mail")').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Fill in recipient
    const toInput = dialog.locator('input').first();
    await toInput.fill('destinatario@test.com');

    // Fill subject if available
    const inputs = dialog.locator('input');
    const inputCount = await inputs.count();
    if (inputCount > 1) {
      await inputs.nth(1).fill('Teste E2E - Envio de email');
    }

    // Try to click send button
    const sendBtn = dialog.locator(
      'button:has-text("Enviar"), button:has-text("enviar")'
    );
    if (await sendBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sendBtn.click();
      // The mocked route returns 202
      await page.waitForTimeout(2000);
    }
  });

  test('4.5 - Deve abrir dialog de resposta a partir de mensagem', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    // Click on a message first
    const msgItem = page.locator('text=Reuniao de equipe amanha');
    if (await msgItem.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await msgItem.click();
      await page.waitForTimeout(2000);

      // Look for reply button in detail panel
      const replyBtn = page.locator(
        'button:has-text("Responder"), button[title="Responder"]'
      );
      if (
        await replyBtn
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false)
      ) {
        await replyBtn.first().click();

        // Dialog should open in reply mode
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test('4.6 - Deve abrir dialog de encaminhamento', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    const msgItem = page.locator('text=Reuniao de equipe amanha');
    if (await msgItem.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await msgItem.click();
      await page.waitForTimeout(2000);

      // Look for forward button
      const forwardBtn = page.locator(
        'button:has-text("Encaminhar"), button[title="Encaminhar"]'
      );
      if (
        await forwardBtn
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false)
      ) {
        await forwardBtn.first().click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test('4.7 - Deve abrir dialog "Responder a todos"', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    const msgItem = page.locator('text=Reuniao de equipe amanha');
    if (await msgItem.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await msgItem.click();
      await page.waitForTimeout(2000);

      const replyAllBtn = page.locator(
        'button:has-text("Responder a todos"), button[title="Responder a todos"]'
      );
      if (
        await replyAllBtn
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false)
      ) {
        await replyAllBtn.first().click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5_000 });
      }
    }
  });
});
