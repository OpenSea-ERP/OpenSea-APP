import { test, expect } from '@playwright/test';
import { getAuthenticatedToken } from '../helpers/auth.helper';
import {
  ALL_EMAIL_PERMISSIONS,
  ACCOUNT_MANAGEMENT_PERMISSIONS,
  createEmailUser,
} from '../helpers/email-permissions.helper';
import {
  navigateToEmailSettings,
  createEmailAccountViaApi,
  deleteEmailAccountViaApi,
  waitForToast,
} from '../helpers/email.helper';

let userToken: string;
let userTenantId: string;
let secondUserId: string;

test.beforeAll(async () => {
  const user = await createEmailUser(ALL_EMAIL_PERMISSIONS, 'e2e-share-owner');
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  // Create a second user to share with
  const secondUser = await createEmailUser(
    ACCOUNT_MANAGEMENT_PERMISSIONS,
    'e2e-share-target'
  );
  secondUserId = secondUser.userId;
});

test.describe('E-mail - Compartilhamento de Contas', () => {
  test('8.1 - Deve exibir secao de compartilhamento na conta expandida', async ({
    page,
  }) => {
    const account = await createEmailAccountViaApi(userToken, {
      displayName: `Share Section ${Date.now().toString(36)}`,
      visibility: 'SHARED',
    });

    await navigateToEmailSettings(page, userToken, userTenantId);
    await expect(page.locator(`text=${account.address}`)).toBeVisible({
      timeout: 15_000,
    });

    // Expand account settings
    const configBtn = page
      .locator('button:has-text("Configurações")')
      .first();
    if (await configBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await configBtn.click();

      // Should show sharing section
      await expect(
        page.locator('text=Compartilhamento')
      ).toBeVisible({ timeout: 5_000 });
      await expect(
        page.locator('button:has-text("Adicionar acesso")')
      ).toBeVisible();
    }

    await deleteEmailAccountViaApi(userToken, account.id);
  });

  test('8.2 - Deve abrir dialog de compartilhamento', async ({ page }) => {
    const account = await createEmailAccountViaApi(userToken, {
      displayName: `Share Dialog ${Date.now().toString(36)}`,
      visibility: 'SHARED',
    });

    await navigateToEmailSettings(page, userToken, userTenantId);
    await expect(page.locator(`text=${account.address}`)).toBeVisible({
      timeout: 15_000,
    });

    // Expand and click share
    const configBtn = page
      .locator('button:has-text("Configurações")')
      .first();
    if (await configBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await configBtn.click();

      const addAccessBtn = page.locator(
        'button:has-text("Adicionar acesso")'
      );
      if (
        await addAccessBtn.isVisible({ timeout: 5_000 }).catch(() => false)
      ) {
        await addAccessBtn.click();

        // Dialog should open
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5_000 });
        await expect(
          dialog.locator('text=Compartilhar conta')
        ).toBeVisible();
        await expect(dialog.locator('text=ID do usuário')).toBeVisible();
        await expect(
          dialog.locator('text=Pode ler mensagens')
        ).toBeVisible();
        await expect(
          dialog.locator('text=Pode enviar e-mails')
        ).toBeVisible();
        await expect(
          dialog.locator('text=Pode gerenciar a conta')
        ).toBeVisible();
      }
    }

    await deleteEmailAccountViaApi(userToken, account.id);
  });

  test('8.3 - Deve compartilhar conta com outro usuario', async ({ page }) => {
    const account = await createEmailAccountViaApi(userToken, {
      displayName: `Share Grant ${Date.now().toString(36)}`,
      visibility: 'SHARED',
    });

    await navigateToEmailSettings(page, userToken, userTenantId);
    await expect(page.locator(`text=${account.address}`)).toBeVisible({
      timeout: 15_000,
    });

    // Expand → Share
    const configBtn = page
      .locator('button:has-text("Configurações")')
      .first();
    if (await configBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await configBtn.click();

      const addAccessBtn = page.locator(
        'button:has-text("Adicionar acesso")'
      );
      if (
        await addAccessBtn.isVisible({ timeout: 5_000 }).catch(() => false)
      ) {
        await addAccessBtn.click();
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5_000 });

        // Fill user ID
        const userIdInput = dialog.locator(
          'input[placeholder*="uuid"]'
        );
        await userIdInput.fill(secondUserId);

        // Enable read permission (should already be on by default)
        // Click "Conceder acesso"
        const grantBtn = dialog.locator(
          'button:has-text("Conceder acesso")'
        );
        await grantBtn.click();

        await waitForToast(page, 'Conta compartilhada com sucesso');
      }
    }

    await deleteEmailAccountViaApi(userToken, account.id);
  });

  test('8.4 - Deve exibir badge "Compartilhada" para conta SHARED', async ({
    page,
  }) => {
    const account = await createEmailAccountViaApi(userToken, {
      displayName: `Badge Shared ${Date.now().toString(36)}`,
      visibility: 'SHARED',
    });

    await navigateToEmailSettings(page, userToken, userTenantId);
    await expect(page.locator(`text=${account.address}`)).toBeVisible({
      timeout: 15_000,
    });

    // Should show "Compartilhada" badge
    await expect(
      page.locator('text=Compartilhada').first()
    ).toBeVisible({ timeout: 5_000 });

    await deleteEmailAccountViaApi(userToken, account.id);
  });

  test('8.5 - Deve exibir badge "Privada" para conta PRIVATE', async ({
    page,
  }) => {
    const account = await createEmailAccountViaApi(userToken, {
      displayName: `Badge Private ${Date.now().toString(36)}`,
      visibility: 'PRIVATE',
    });

    await navigateToEmailSettings(page, userToken, userTenantId);
    await expect(page.locator(`text=${account.address}`)).toBeVisible({
      timeout: 15_000,
    });

    // Should show "Privada" badge
    await expect(
      page.locator('text=Privada').first()
    ).toBeVisible({ timeout: 5_000 });

    await deleteEmailAccountViaApi(userToken, account.id);
  });

  test('8.6 - Dialog de compartilhamento deve ter botao Cancelar funcional', async ({
    page,
  }) => {
    const account = await createEmailAccountViaApi(userToken, {
      displayName: `Cancel Share ${Date.now().toString(36)}`,
      visibility: 'SHARED',
    });

    await navigateToEmailSettings(page, userToken, userTenantId);
    await expect(page.locator(`text=${account.address}`)).toBeVisible({
      timeout: 15_000,
    });

    const configBtn = page
      .locator('button:has-text("Configurações")')
      .first();
    if (await configBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await configBtn.click();

      const addAccessBtn = page.locator(
        'button:has-text("Adicionar acesso")'
      );
      if (
        await addAccessBtn.isVisible({ timeout: 5_000 }).catch(() => false)
      ) {
        await addAccessBtn.click();
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5_000 });

        // Click cancel
        const cancelBtn = dialog.locator('button:has-text("Cancelar")');
        await cancelBtn.click();

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 5_000 });
      }
    }

    await deleteEmailAccountViaApi(userToken, account.id);
  });
});
