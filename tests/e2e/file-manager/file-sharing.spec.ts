import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  ALL_STORAGE_PERMISSIONS,
  createUserWithPermissions,
  getAdminToken,
  STORAGE_PERMISSIONS,
} from '../helpers/permissions.helper';
import {
  clickContextMenuItem,
  createShareLinkViaApi,
  createTestFolder,
  doubleClickItem,
  getContextMenuItems,
  initializeSystemFolders,
  navigateToFileManager,
  openShareDialog,
  rightClickItem,
  uploadTestFile,
  waitForToast,
} from '../helpers/storage.helper';

let userToken: string;
let userTenantId: string;
let testFolderId: string;
let testFolderName: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-sharing-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  testFolderName = `e2e-share-${Date.now()}`;
  testFolderId = await createTestFolder(userToken, testFolderName);
});

test.describe('File Manager - Compartilhamento de Arquivo', () => {
  // ─── S-1 Criar link de compartilhamento simples ────────────────────
  test('S-1 - Deve criar link de compartilhamento simples', async ({
    page,
  }) => {
    const fileName = `share-simple-${Date.now()}.txt`;
    await uploadTestFile(userToken, testFolderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, testFolderName);
    await page.waitForTimeout(1_000);

    await openShareDialog(page, fileName);

    // Click "Criar link de compartilhamento"
    await page
      .locator('button:has-text("Criar link de compartilhamento")')
      .click();

    await waitForToast(
      page,
      'Link criado e copiado para a área de transferência'
    );
  });

  // ─── S-2 Criar link com senha ──────────────────────────────────────
  test('S-2 - Deve criar link com senha', async ({ page }) => {
    const fileName = `share-pass-${Date.now()}.txt`;
    await uploadTestFile(userToken, testFolderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, testFolderName);
    await page.waitForTimeout(1_000);

    await openShareDialog(page, fileName);

    // Check "Proteger com senha"
    await page.locator('#use-password').click();
    await expect(
      page.locator('input[type="password"]')
    ).toBeVisible({ timeout: 3_000 });
    await page.locator('input[type="password"]').fill('test123');

    await page
      .locator('button:has-text("Criar link de compartilhamento")')
      .click();

    await waitForToast(
      page,
      'Link criado e copiado para a área de transferência'
    );

    // Verify link appears in "Links ativos" list
    await expect(
      page.locator('text=Links ativos')
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─── S-3 Criar link com data de expiração ─────────────────────────
  test('S-3 - Deve criar link com data de expiração', async ({ page }) => {
    const fileName = `share-expiry-${Date.now()}.txt`;
    await uploadTestFile(userToken, testFolderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, testFolderName);
    await page.waitForTimeout(1_000);

    await openShareDialog(page, fileName);

    // Check "Data de expiração"
    await page.locator('#use-expiry').click();
    const dateInput = page.locator('input[type="datetime-local"]');
    await expect(dateInput).toBeVisible({ timeout: 3_000 });

    // Set to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formatted = tomorrow.toISOString().slice(0, 16);
    await dateInput.fill(formatted);

    await page
      .locator('button:has-text("Criar link de compartilhamento")')
      .click();

    await waitForToast(
      page,
      'Link criado e copiado para a área de transferência'
    );

    // Verify expiry date info in link list
    await expect(
      page.locator('text=Expira em')
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─── S-4 Criar link com limite de downloads ───────────────────────
  test('S-4 - Deve criar link com limite de downloads', async ({ page }) => {
    const fileName = `share-limit-${Date.now()}.txt`;
    await uploadTestFile(userToken, testFolderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, testFolderName);
    await page.waitForTimeout(1_000);

    await openShareDialog(page, fileName);

    // Check "Limite de downloads"
    await page.locator('#use-max-downloads').click();
    const numberInput = page.locator('input[type="number"]');
    await expect(numberInput).toBeVisible({ timeout: 3_000 });
    await numberInput.fill('5');

    await page
      .locator('button:has-text("Criar link de compartilhamento")')
      .click();

    await waitForToast(
      page,
      'Link criado e copiado para a área de transferência'
    );

    // Verify "0/5 downloads" in link info
    await expect(
      page.locator('text=0/5 downloads')
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─── S-5 Exibir links ativos para o arquivo ──────────────────────
  test('S-5 - Deve exibir links ativos para o arquivo', async ({ page }) => {
    const fileName = `share-list-${Date.now()}.txt`;
    const fileId = await uploadTestFile(userToken, testFolderId, fileName);

    // Create 2 links via API
    await createShareLinkViaApi(userToken, fileId);
    await createShareLinkViaApi(userToken, fileId, { maxDownloads: 10 });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, testFolderName);
    await page.waitForTimeout(1_000);

    await openShareDialog(page, fileName);

    // Verify "Links ativos (2)" heading
    await expect(
      page.locator('text=Links ativos (2)')
    ).toBeVisible({ timeout: 10_000 });
  });

  // ─── S-6 Copiar link para a área de transferência ─────────────────
  test('S-6 - Deve copiar link para a área de transferência', async ({
    page,
  }) => {
    const fileName = `share-copy-${Date.now()}.txt`;
    const fileId = await uploadTestFile(userToken, testFolderId, fileName);
    await createShareLinkViaApi(userToken, fileId);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, testFolderName);
    await page.waitForTimeout(1_000);

    await openShareDialog(page, fileName);

    // Wait for active links to load
    await expect(
      page.locator('text=Links ativos')
    ).toBeVisible({ timeout: 10_000 });

    // Click copy button (title="Copiar link")
    await page.locator('button[title="Copiar link"]').first().click();

    await waitForToast(page, 'Link copiado para a área de transferência');
  });

  // ─── S-7 Revogar link de compartilhamento ─────────────────────────
  test('S-7 - Deve revogar link de compartilhamento', async ({ page }) => {
    const fileName = `share-revoke-${Date.now()}.txt`;
    const fileId = await uploadTestFile(userToken, testFolderId, fileName);
    await createShareLinkViaApi(userToken, fileId);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, testFolderName);
    await page.waitForTimeout(1_000);

    await openShareDialog(page, fileName);

    // Wait for active links to load
    await expect(
      page.locator('text=Links ativos')
    ).toBeVisible({ timeout: 10_000 });

    // Click revoke button (title="Revogar link")
    await page.locator('button[title="Revogar link"]').first().click();

    await waitForToast(page, 'Link revogado com sucesso');
  });

  // ─── S-8 "Compartilhar" visível no menu com files.update ──────────
  test('S-8 - "Compartilhar" deve aparecer no menu com permissão files.update', async ({
    page,
  }) => {
    const fileName = `share-perm-ok-${Date.now()}.txt`;
    await uploadTestFile(userToken, testFolderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, testFolderName);
    await page.waitForTimeout(1_000);

    await rightClickItem(page, fileName);
    const items = await getContextMenuItems(page);

    expect(items).toContain('Compartilhar');
  });

  // ─── S-9 "Compartilhar" NÃO deve aparecer sem files.update ────────
  test('S-9 - "Compartilhar" NÃO deve aparecer sem permissão files.update', async ({
    page,
  }) => {
    const BASE_NAV = [
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
      STORAGE_PERMISSIONS.FILES_LIST,
      STORAGE_PERMISSIONS.FILES_READ,
      // NO FILES_UPDATE
    ];

    const user = await createUserWithPermissions(BASE_NAV);
    const auth = await getAuthenticatedToken(user.email, user.password);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, testFolderName);
    await page.waitForTimeout(1_000);

    const fileName = `share-perm-ok-${Date.now()}.txt`;
    // Upload with admin token so the file exists
    await uploadTestFile(userToken, testFolderId, fileName);

    // Reload to see new file
    await page.reload();
    await page.waitForTimeout(2_000);
    await doubleClickItem(page, testFolderName);
    await page.waitForTimeout(1_000);

    await rightClickItem(page, fileName);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Compartilhar');
  });
});
