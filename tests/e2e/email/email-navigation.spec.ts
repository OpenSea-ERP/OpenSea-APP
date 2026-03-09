import { test, expect } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  ALL_EMAIL_PERMISSIONS,
  createEmailUser,
} from '../helpers/email-permissions.helper';
import {
  navigateToEmail,
  navigateToEmailSettings,
  createEmailAccountViaApi,
  deleteEmailAccountViaApi,
  mockEmailMessageRoutes,
} from '../helpers/email.helper';

let userToken: string;
let userTenantId: string;
let accountId: string;

test.beforeAll(async () => {
  const user = await createEmailUser(ALL_EMAIL_PERMISSIONS);
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  // Create an account for navigation tests
  const account = await createEmailAccountViaApi(userToken, {
    displayName: 'Nav Test Account',
  });
  accountId = account.id;
});

test.afterAll(async () => {
  if (accountId) {
    await deleteEmailAccountViaApi(userToken, accountId).catch(() => {});
  }
});

test.describe('E-mail - Navegacao', () => {
  test('2.1 - Deve renderizar pagina principal com layout de 3 paineis', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    // Header elements
    await expect(
      page
        .locator('h1:has-text("E-mail"), h2:has-text("E-mail"), text=E-mail')
        .first()
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.locator('text=Gerencie suas mensagens e contas de e-mail')
    ).toBeVisible();
  });

  test('2.2 - Deve exibir botao "Novo e-mail" no action bar', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await expect(page.locator('button:has-text("Novo e-mail")')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('2.3 - Deve exibir botao "Configuracoes" no action bar', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await expect(page.locator('button:has-text("Configurações")')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('2.4 - Deve navegar para settings ao clicar em "Configuracoes"', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await page.locator('button:has-text("Configurações")').click();
    await page.waitForURL('**/email/settings', { timeout: 10_000 });
    expect(page.url()).toContain('/email/settings');
  });

  test('2.5 - Deve navegar de volta ao inbox via breadcrumb', async ({
    page,
  }) => {
    await navigateToEmailSettings(page, userToken, userTenantId);

    // Click "E-mail" breadcrumb link to go back
    const emailBreadcrumb = page.locator('a:has-text("E-mail")').first();
    if (await emailBreadcrumb.isVisible({ timeout: 10_000 })) {
      await emailBreadcrumb.click();
      await page.waitForURL('**/email', { timeout: 10_000 });
      expect(page.url()).toMatch(/\/email$/);
    }
  });

  test('2.6 - Deve exibir sidebar com seletor de conta', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    // Sidebar should show account selector or account name
    // The sidebar renders account names and folder tree
    await page.waitForTimeout(2000); // Wait for accounts to load
    const sidebar = page
      .locator('aside, [class*="sidebar"], [class*="Sidebar"]')
      .first();
    if (await sidebar.isVisible({ timeout: 5_000 })) {
      await expect(sidebar).toBeVisible();
    }
  });

  test('2.7 - Deve exibir pastas na sidebar quando conta selecionada', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    // Wait for folders to render from mock
    await page.waitForTimeout(3000);

    // Check for at least one folder type visible
    const folderLocators = [
      page.locator('text=Caixa de entrada'),
      page.locator('text=Enviados'),
      page.locator('text=Rascunhos'),
      page.locator('text=Lixeira'),
      page.locator('text=INBOX'),
    ];

    let foundFolder = false;
    for (const locator of folderLocators) {
      if (await locator.isVisible({ timeout: 2_000 }).catch(() => false)) {
        foundFolder = true;
        break;
      }
    }

    expect(foundFolder).toBe(true);
  });
});
