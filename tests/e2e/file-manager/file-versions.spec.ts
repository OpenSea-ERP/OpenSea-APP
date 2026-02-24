import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  ALL_STORAGE_PERMISSIONS,
  createUserWithPermissions,
  getAdminToken,
} from '../helpers/permissions.helper';
import {
  clickContextMenuItem,
  createTestFolder,
  doubleClickItem,
  initializeSystemFolders,
  navigateToFileManager,
  rightClickItem,
  uploadFileVersionViaApi,
  uploadTestFile,
  waitForToast,
} from '../helpers/storage.helper';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-versions-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('File Manager - Versionamento de Arquivos', () => {
  // ─── 3.1 Visualizar histórico de versões ──────────────────────────
  test('3.1 - Visualizar histórico de versões', async ({ page }) => {
    const folderName = `e2e-ver-hist-${Date.now()}`;
    const fileName = `versioned-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    const fileId = await uploadTestFile(userToken, folderId, fileName);

    // Upload 2 more versions
    await uploadFileVersionViaApi(
      userToken,
      fileId,
      'Version 2 content',
      'Second version'
    );
    await uploadFileVersionViaApi(
      userToken,
      fileId,
      'Version 3 content',
      'Third version'
    );

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Right-click → Versões
    await rightClickItem(page, fileName);
    await clickContextMenuItem(page, 'Versões');

    // Version panel (Sheet) opens
    await expect(page.locator('text=Histórico de versões')).toBeVisible({
      timeout: 10_000,
    });

    // Verify 3 versions are listed
    await expect(page.locator('text=Versão 1')).toBeVisible();
    await expect(page.locator('text=Versão 2')).toBeVisible();
    await expect(page.locator('text=Versão 3')).toBeVisible();

    // Current version (v3) should be marked as "Atual"
    const currentBadge = page.locator('text=Atual');
    await expect(currentBadge).toBeVisible();
  });

  // ─── 3.2 Download de versão específica ────────────────────────────
  test('3.2 - Download de versão específica', async ({ page }) => {
    const folderName = `e2e-ver-dl-${Date.now()}`;
    const fileName = `ver-dl-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    const fileId = await uploadTestFile(userToken, folderId, fileName);
    await uploadFileVersionViaApi(userToken, fileId, 'V2 content');

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Open versions panel
    await rightClickItem(page, fileName);
    await clickContextMenuItem(page, 'Versões');
    await expect(page.locator('text=Histórico de versões')).toBeVisible({
      timeout: 10_000,
    });

    // Version 1 is the oldest (shown last). It has both "Baixar" and "Restaurar" buttons.
    // The current version only has "Baixar". So the last "Baixar" button belongs to v1.
    const downloadBtn = page.getByRole('button', { name: 'Baixar' }).last();
    const popupPromise = page
      .waitForEvent('popup', { timeout: 10_000 })
      .catch(() => null);
    await downloadBtn.click();

    // Verify no error toast
    const errorToast = page.locator('[data-sonner-toast] :text("Erro")');
    await page.waitForTimeout(2_000);
    const hasError = await errorToast.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  // ─── 3.3 Restaurar versão anterior ────────────────────────────────
  test('3.3 - Restaurar versão anterior', async ({ page }) => {
    const folderName = `e2e-vr-${Date.now()}`;
    const fileName = `vr-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    const fileId = await uploadTestFile(userToken, folderId, fileName);
    await uploadFileVersionViaApi(userToken, fileId, 'V2 content');
    await uploadFileVersionViaApi(userToken, fileId, 'V3 content');

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Open versions panel
    await rightClickItem(page, fileName);
    await clickContextMenuItem(page, 'Versões');
    await expect(page.locator('text=Histórico de versões')).toBeVisible({
      timeout: 10_000,
    });

    // Click "Restaurar" — only non-current versions have this button
    const restoreBtn = page.getByRole('button', { name: 'Restaurar' }).first();
    await restoreBtn.click();

    // Verify toast
    await waitForToast(page, 'Versão restaurada com sucesso');

    // Verify a new version was created (v4 should now appear)
    await expect(page.locator('text=Versão 4')).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── 3.4 Upload de nova versão via API e verificar no painel ──────
  test('3.4 - Upload de nova versão via API e verificar no painel', async ({
    page,
  }) => {
    const folderName = `e2e-ver-upload-${Date.now()}`;
    const fileName = `ver-upload-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    const fileId = await uploadTestFile(userToken, folderId, fileName);

    // Upload a new version with a change note via API
    await uploadFileVersionViaApi(
      userToken,
      fileId,
      'Updated content for v2',
      'Correção de dados'
    );

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Open versions panel
    await rightClickItem(page, fileName);
    await clickContextMenuItem(page, 'Versões');
    await expect(page.locator('text=Histórico de versões')).toBeVisible({
      timeout: 10_000,
    });

    // Verify v2 is listed
    await expect(page.locator('text=Versão 2')).toBeVisible();

    // Verify change note is shown
    await expect(page.locator('text=Correção de dados')).toBeVisible();
  });
});
