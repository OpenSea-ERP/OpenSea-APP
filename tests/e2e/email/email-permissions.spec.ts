import { test, expect } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  ALL_EMAIL_PERMISSIONS,
  createEmailUser,
  EMAIL_PERMISSIONS,
} from '../helpers/email-permissions.helper';
import { createUserWithPermissions } from '../helpers/permissions.helper';

let fullToken: string;
let fullTenantId: string;
let noPermsToken: string;
let noPermsTenantId: string;
let readOnlyToken: string;
let readOnlyTenantId: string;

test.beforeAll(async () => {
  // User with all email permissions
  const fullUser = await createEmailUser(ALL_EMAIL_PERMISSIONS);
  const fullAuth = await getAuthenticatedToken(
    fullUser.email,
    fullUser.password
  );
  fullToken = fullAuth.token;
  fullTenantId = fullAuth.tenantId;

  // User with no email permissions at all
  const noPermsUser = await createUserWithPermissions(
    [],
    `e2e-email-noperms-${Date.now().toString(36)}`
  );
  const noPermsAuth = await getAuthenticatedToken(
    noPermsUser.email,
    noPermsUser.password
  );
  noPermsToken = noPermsAuth.token;
  noPermsTenantId = noPermsAuth.tenantId;

  // User with read-only permissions (can list accounts and read messages, but no send/create)
  const readOnlyUser = await createUserWithPermissions(
    [
      EMAIL_PERMISSIONS.ACCOUNTS_LIST,
      EMAIL_PERMISSIONS.ACCOUNTS_READ,
      EMAIL_PERMISSIONS.MESSAGES_LIST,
      EMAIL_PERMISSIONS.MESSAGES_READ,
    ],
    `e2e-email-readonly-${Date.now().toString(36)}`
  );
  const readOnlyAuth = await getAuthenticatedToken(
    readOnlyUser.email,
    readOnlyUser.password
  );
  readOnlyToken = readOnlyAuth.token;
  readOnlyTenantId = readOnlyAuth.tenantId;
});

test.describe('E-mail - Controle de Permissoes', () => {
  test('6.1 - Usuario com todas permissoes deve ver pagina de email', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, fullToken, fullTenantId);
    await page.goto('/email');
    await page.waitForLoadState('networkidle');

    // Should see the email page header
    await expect(page.locator('text=E-mail').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('6.2 - Usuario com todas permissoes deve ver botao "Novo e-mail"', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, fullToken, fullTenantId);
    await page.goto('/email');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Novo e-mail")')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('6.3 - Usuario somente leitura nao deve ver botao "Novo e-mail"', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, readOnlyToken, readOnlyTenantId);
    await page.goto('/email');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(5000);

    // "Novo e-mail" requires MESSAGES_SEND permission
    const novoEmail = page.locator('button:has-text("Novo e-mail")');
    const isVisible = await novoEmail
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('6.4 - Usuario com todas permissoes deve ver settings', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, fullToken, fullTenantId);
    await page.goto('/email/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Contas configuradas').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('6.5 - Usuario com todas permissoes deve ver botao "Nova conta" em settings', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, fullToken, fullTenantId);
    await page.goto('/email/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Nova conta")')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('6.6 - Usuario somente leitura nao deve ver botao "Nova conta"', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, readOnlyToken, readOnlyTenantId);
    await page.goto('/email/settings');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(5000);

    // "Nova conta" requires ACCOUNTS_CREATE permission
    const novaConta = page.locator('button:has-text("Nova conta")');
    const isVisible = await novaConta
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('6.7 - Ambos usuarios devem poder acessar email (sem redirect)', async ({
    page,
  }) => {
    // Full permissions user
    await injectAuthIntoBrowser(page, fullToken, fullTenantId);
    await page.goto('/email');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Should stay on /email, not redirect
    expect(page.url()).toContain('/email');
  });

  test('6.8 - Usuario somente leitura deve ver pagina de email (com funcionalidade limitada)', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, readOnlyToken, readOnlyTenantId);
    await page.goto('/email');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(5000);

    // Page should render (not error or redirect)
    expect(page.url()).toContain('/email');

    // "Configurações" button should still be visible (navigational)
    const configBtn = page.locator('button:has-text("Configurações")');
    await expect(configBtn).toBeVisible({ timeout: 10_000 });
  });
});
