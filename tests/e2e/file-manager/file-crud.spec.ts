import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
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
  enterActionPin,
  initializeSystemFolders,
  navigateToFileManager,
  rightClickItem,
  setActionPinViaApi,
  uploadTestFile,
  waitForToast,
} from '../helpers/storage.helper';

const TEST_PIN = '1234';
const TEST_PASSWORD = 'E2eTest@123';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-file-crud-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  // Set action PIN for delete tests
  await setActionPinViaApi(userToken, TEST_PASSWORD, TEST_PIN);
});

test.describe('File Manager - Operações de Arquivo', () => {
  // ─── 2.1 Upload de arquivo via dialog ─────────────────────────────
  test('2.1 - Upload de arquivo via dialog', async ({ page }) => {
    const folderName = `e2e-upload-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Create temp file and open upload dialog
    const tmpFile = path.join(os.tmpdir(), 'test-upload.txt');
    fs.writeFileSync(tmpFile, 'E2E upload test content');

    await page.locator('button[title="Carregar"]').click();
    await expect(page.locator('text=Carregar arquivos')).toBeVisible({
      timeout: 5_000,
    });

    // Set files directly on the hidden input
    await page
      .locator('[role="dialog"] input[type="file"]')
      .setInputFiles(tmpFile);

    // Wait for file to be added and button to become clickable
    await expect(
      page.locator('button:has-text("Enviar 1 arquivo"):not([disabled])')
    ).toBeVisible({ timeout: 5_000 });
    await page.locator('button:has-text("Enviar 1 arquivo")').click();

    // Verify toast
    await waitForToast(page, '1 arquivo enviado com sucesso');

    // Verify file appears in grid
    await expect(page.locator('text=test-upload.txt')).toBeVisible({
      timeout: 10_000,
    });

    // Cleanup
    fs.unlinkSync(tmpFile);
  });

  // ─── 2.2 Download de arquivo via context menu ─────────────────────
  test('2.2 - Download de arquivo via context menu', async ({ page }) => {
    const folderName = `e2e-download-${Date.now()}`;
    const fileName = `download-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    await uploadTestFile(userToken, folderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Right-click → Baixar
    await rightClickItem(page, fileName);

    // Intercept download by listening to popup/new tab
    const downloadPromise = page
      .waitForEvent('popup', { timeout: 10_000 })
      .catch(() => null);
    await clickContextMenuItem(page, 'Baixar');

    // Verify no error toast appeared (download should succeed or open new tab)
    const errorToast = page.locator('[data-sonner-toast] :text("Erro")');
    await page.waitForTimeout(2_000);
    const hasError = await errorToast.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  // ─── 2.3 Preview de arquivo (Abrir) ──────────────────────────────
  test('2.3 - Preview de arquivo não suportado mostra mensagem', async ({
    page,
  }) => {
    const folderName = `e2e-preview-${Date.now()}`;
    const fileName = `preview-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    await uploadTestFile(userToken, folderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Double-click file to open preview
    await doubleClickItem(page, fileName);

    // Verify preview dialog opens with "Visualização não disponível"
    await expect(
      page.locator('text=Visualização não disponível para este tipo de arquivo')
    ).toBeVisible({ timeout: 10_000 });

    // Verify metadata is shown
    await expect(
      page.locator('[role="dialog"]').getByText('text/plain')
    ).toBeVisible();
  });

  // ─── 2.4 Renomear arquivo via context menu ────────────────────────
  test('2.4 - Renomear arquivo via context menu', async ({ page }) => {
    const folderName = `e2e-file-rename-${Date.now()}`;
    const originalName = `original-${Date.now()}.txt`;
    const newName = `renamed-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    await uploadTestFile(userToken, folderId, originalName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Right-click → Renomear
    await rightClickItem(page, originalName);
    await clickContextMenuItem(page, 'Renomear');

    // Fill new name
    const input = page.locator('input[placeholder="Novo nome"]');
    await expect(input).toBeVisible({ timeout: 5_000 });
    await input.clear();
    await input.fill(newName);

    // Click "Renomear"
    await page
      .locator('button:has-text("Renomear"):not(:has-text("Renomeando"))')
      .last()
      .click();

    // Verify toast and updated name
    await waitForToast(page, 'Arquivo renomeado com sucesso');
    await expect(page.locator(`text=${newName}`)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── 2.5 Mover arquivo para outra pasta ───────────────────────────
  test('2.5 - Mover arquivo para outra pasta', async ({ page }) => {
    const folder1Name = `e2e-src-${Date.now()}`;
    const folder2Name = `e2e-dst-${Date.now()}`;
    const fileName = `move-${Date.now()}.txt`;

    const folder1Id = await createTestFolder(userToken, folder1Name);
    await createTestFolder(userToken, folder2Name);
    await uploadTestFile(userToken, folder1Id, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder 1
    await doubleClickItem(page, folder1Name);
    await page.waitForTimeout(1_000);

    // Right-click → Mover
    await rightClickItem(page, fileName);
    await clickContextMenuItem(page, 'Mover');

    // Move dialog shows root-level folders — select folder 2
    const targetItem = page.locator(`[role="dialog"] :text("${folder2Name}")`);
    await expect(targetItem).toBeVisible({ timeout: 10_000 });
    await targetItem.click();

    // Click "Mover para cá"
    await page.locator('button:has-text("Mover para cá")').click();

    // Verify toast — successful move confirmed
    await waitForToast(page, 'Item movido com sucesso');
  });

  // ─── 2.6 Excluir arquivo (com PIN) ────────────────────────────────
  test('2.6 - Excluir arquivo com PIN', async ({ page }) => {
    const folderName = `e2e-file-del-${Date.now()}`;
    const fileName = `delete-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    await uploadTestFile(userToken, folderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Right-click → Excluir
    await rightClickItem(page, fileName);
    await clickContextMenuItem(page, 'Excluir');

    // PIN modal appears
    await expect(page.locator('text=Excluir Arquivo')).toBeVisible({
      timeout: 5_000,
    });

    // Enter PIN
    await enterActionPin(page, TEST_PIN);

    // Verify toast
    await waitForToast(page, 'Arquivo excluído com sucesso');

    // Verify file disappeared
    await expect(page.locator(`text=${fileName}`).first()).not.toBeVisible({
      timeout: 5_000,
    });
  });

  // ─── 2.7 Upload múltiplos arquivos ────────────────────────────────
  test('2.7 - Upload de múltiplos arquivos', async ({ page }) => {
    const folderName = `e2e-mul-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Create temp files
    const tmpA = path.join(os.tmpdir(), 'file-a.txt');
    const tmpB = path.join(os.tmpdir(), 'file-b.txt');
    fs.writeFileSync(tmpA, 'Content A');
    fs.writeFileSync(tmpB, 'Content B');

    // Open upload dialog and set files directly on hidden input
    await page.locator('button[title="Carregar"]').click();
    await expect(page.locator('text=Carregar arquivos')).toBeVisible({
      timeout: 5_000,
    });
    await page
      .locator('[role="dialog"] input[type="file"]')
      .setInputFiles([tmpA, tmpB]);

    // Wait for button and click send
    await expect(
      page.locator('button:has-text("Enviar 2 arquivos"):not([disabled])')
    ).toBeVisible({ timeout: 5_000 });
    await page.locator('button:has-text("Enviar 2 arquivos")').click();

    // Verify toast
    await waitForToast(page, '2 arquivos enviados com sucesso');

    // Verify both files appear
    await expect(page.locator('text=file-a.txt')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('text=file-b.txt')).toBeVisible({
      timeout: 10_000,
    });

    // Cleanup
    fs.unlinkSync(tmpA);
    fs.unlinkSync(tmpB);
  });

  // ─── 2.8 Preview de imagem (Abrir via context menu) ───────────────
  test('2.8 - Abrir arquivo via context menu exibe preview', async ({
    page,
  }) => {
    const folderName = `e2e-open-${Date.now()}`;
    const fileName = `openfile-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    await uploadTestFile(userToken, folderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // Right-click → Abrir
    await rightClickItem(page, fileName);
    await clickContextMenuItem(page, 'Abrir');

    // Preview dialog opens
    await expect(
      page.locator('[role="dialog"]').filter({ hasText: fileName })
    ).toBeVisible({ timeout: 10_000 });

    // Metadata section shows file name
    await expect(
      page.locator('[role="dialog"]').getByText('text/plain')
    ).toBeVisible();
  });
});
