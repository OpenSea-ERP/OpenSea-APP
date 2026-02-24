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

test.describe('File Manager - Permissões da Toolbar e PageActionBar', () => {
  // ─── 2.1 Ocultar "Carregar" sem storage.files.create ───────────────

  test('2.1 - Deve ocultar botão "Carregar" sem storage.files.create', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      // NO storage.files.create
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    // "Carregar" button should NOT exist anywhere on the page
    const uploadButtons = page.locator('button:has-text("Carregar")');
    await expect(uploadButtons).toHaveCount(0);
  });

  // ─── 2.2 Exibir "Carregar" com storage.files.create ────────────────

  test('2.2 - Deve exibir botão "Carregar" com storage.files.create', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.FILES_CREATE,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    // "Carregar" button should be visible
    await expect(
      page.locator('button:has-text("Carregar")').first()
    ).toBeVisible();
  });

  // ─── 2.3 Ocultar "Nova Pasta" sem storage.user-folders.create ──────

  test('2.3 - Deve ocultar botão "Nova Pasta" sem storage.user-folders.create', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      // NO storage.user-folders.create
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    const newFolderButtons = page.locator('button:has-text("Nova Pasta")');
    await expect(newFolderButtons).toHaveCount(0);
  });

  // ─── 2.4 Exibir "Nova Pasta" com storage.user-folders.create ───────

  test('2.4 - Deve exibir botão "Nova Pasta" com storage.user-folders.create', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await expect(
      page.locator('button:has-text("Nova Pasta")').first()
    ).toBeVisible();
  });

  // ─── 2.5 Ocultar ambos botões com permissão somente leitura ────────

  test('2.5 - Deve ocultar ambos botões com permissão somente leitura', async ({
    page,
  }) => {
    const user = await createUserWithPermissions(VIEW_ONLY_PERMISSIONS);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    // Neither button should exist
    await expect(page.locator('button:has-text("Carregar")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Nova Pasta")')).toHaveCount(0);
  });
});
