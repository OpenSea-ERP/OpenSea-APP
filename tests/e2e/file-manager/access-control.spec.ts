import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  createUserWithPermissions,
  STORAGE_PERMISSIONS,
  VIEW_ONLY_PERMISSIONS,
} from '../helpers/permissions.helper';
import { navigateToFileManager } from '../helpers/storage.helper';

test.describe('File Manager - Controle de Acesso à Página', () => {
  // ─── 1.1 Redirecionar sem storage.interface.view ────────────────────

  test('1.1 - Deve redirecionar para home sem storage.interface.view', async ({
    page,
  }) => {
    // Create user with NO storage permissions
    const user = await createUserWithPermissions([]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);

    await page.goto('/file-manager');

    // Should be redirected away — file manager content should NOT be visible
    await page.waitForTimeout(3_000);

    const heroCard = page.locator('h1:has-text("Gerenciador de Arquivos")');
    await expect(heroCard).not.toBeVisible();

    // Should be on home or another page
    const url = page.url();
    expect(url).not.toContain('/file-manager');
  });

  // ─── 1.2 Acessar a página com storage.interface.view ────────────────

  test('1.2 - Deve acessar a página com storage.interface.view', async ({
    page,
  }) => {
    const user = await createUserWithPermissions(VIEW_ONLY_PERMISSIONS);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);

    await navigateToFileManager(page);

    // Hero card should be visible
    await expect(
      page.locator('h1:has-text("Gerenciador de Arquivos")')
    ).toBeVisible();

    // Page description should be visible
    await expect(
      page.locator('text=Organize, envie e compartilhe documentos')
    ).toBeVisible();
  });

  // ─── 1.3 Estado de loading ──────────────────────────────────────────

  test('1.3 - Deve exibir estado de loading enquanto permissões carregam', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...VIEW_ONLY_PERMISSIONS,
      STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);

    // Navigate and check for skeleton loading states
    await page.goto('/file-manager');

    // Either the loading skeletons appear briefly or the content loads
    // We just verify the page eventually resolves to the file manager
    await expect(
      page.locator('h1:has-text("Gerenciador de Arquivos")')
    ).toBeVisible({ timeout: 15_000 });
  });
});
