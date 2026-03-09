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
  apiRequest,
  createTestFolder,
  doubleClickItem,
  initializeSystemFolders,
  navigateToFileManager,
  uploadTestFile,
} from '../helpers/storage.helper';

let userToken: string;
let userTenantId: string;
let searchFolderId: string;
let searchFolderName: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-search-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  // Create a folder with multiple files for search tests
  searchFolderName = `e2e-search-${Date.now()}`;
  searchFolderId = await createTestFolder(userToken, searchFolderName);

  await uploadTestFile(
    userToken,
    searchFolderId,
    'report.pdf',
    'report content'
  );
  await uploadTestFile(
    userToken,
    searchFolderId,
    'invoice.pdf',
    'invoice content'
  );
  await uploadTestFile(
    userToken,
    searchFolderId,
    'readme.txt',
    'readme content'
  );
});

test.describe('File Manager - Busca', () => {
  // ─── SR-1 Filtrar arquivos por nome ────────────────────────────────
  test('SR-1 - Deve filtrar arquivos por nome ao digitar na busca', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, searchFolderName);
    await page.waitForTimeout(1_000);

    // All 3 files should be visible initially
    await expect(page.locator('[title="report.pdf"]')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('[title="invoice.pdf"]')).toBeVisible();
    await expect(page.locator('[title="readme.txt"]')).toBeVisible();

    // Type "report" in search
    const searchInput = page.locator('input[placeholder="Pesquisar..."]');
    await searchInput.fill('report');

    // Wait for debounce (300ms) + render
    await page.waitForTimeout(600);

    // Only "report.pdf" should be visible
    await expect(page.locator('[title="report.pdf"]')).toBeVisible();
    await expect(page.locator('[title="invoice.pdf"]')).not.toBeVisible();
    await expect(page.locator('[title="readme.txt"]')).not.toBeVisible();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(600);

    // All 3 should be visible again
    await expect(page.locator('[title="report.pdf"]')).toBeVisible();
    await expect(page.locator('[title="invoice.pdf"]')).toBeVisible();
    await expect(page.locator('[title="readme.txt"]')).toBeVisible();
  });

  // ─── SR-2 Filtrar pastas por nome ─────────────────────────────────
  test('SR-2 - Deve filtrar pastas por nome ao digitar na busca', async ({
    page,
  }) => {
    // Create folders at root level
    const folder1 = `Vendas-${Date.now()}`;
    const folder2 = `Marketing-${Date.now()}`;
    const folder3 = `HR-${Date.now()}`;
    await createTestFolder(userToken, folder1);
    await createTestFolder(userToken, folder2);
    await createTestFolder(userToken, folder3);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Type search for "Vendas"
    const searchInput = page.locator('input[placeholder="Pesquisar..."]');
    await searchInput.fill(folder1.split('-')[0]); // "Vendas"
    await page.waitForTimeout(600);

    await expect(page.locator(`[title="${folder1}"]`)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator(`[title="${folder2}"]`)).not.toBeVisible();
    await expect(page.locator(`[title="${folder3}"]`)).not.toBeVisible();
  });

  // ─── SR-3 Estado vazio quando busca não encontra resultados ───────
  test('SR-3 - Deve mostrar estado vazio quando busca não encontra resultados', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, searchFolderName);
    await page.waitForTimeout(1_000);

    const searchInput = page.locator('input[placeholder="Pesquisar..."]');
    await searchInput.fill('xyznonexistent');
    await page.waitForTimeout(600);

    // No items should be visible
    await expect(page.locator('[title="report.pdf"]')).not.toBeVisible();
    await expect(page.locator('[title="invoice.pdf"]')).not.toBeVisible();
    await expect(page.locator('[title="readme.txt"]')).not.toBeVisible();
  });

  // ─── SR-4 Limpar busca ao apagar texto ────────────────────────────
  test('SR-4 - Deve limpar busca ao apagar texto', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, searchFolderName);
    await page.waitForTimeout(1_000);

    const searchInput = page.locator('input[placeholder="Pesquisar..."]');

    // Type to filter
    await searchInput.fill('report');
    await page.waitForTimeout(600);
    await expect(page.locator('[title="invoice.pdf"]')).not.toBeVisible();

    // Clear with keyboard: select all + backspace
    await searchInput.focus();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(600);

    // All items should be visible again
    await expect(page.locator('[title="report.pdf"]')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('[title="invoice.pdf"]')).toBeVisible();
    await expect(page.locator('[title="readme.txt"]')).toBeVisible();
  });

  // ─── SR-5 Busca case-insensitive ──────────────────────────────────
  test('SR-5 - Busca deve ser case-insensitive', async ({ page }) => {
    const fileName = `Report-CI-${Date.now()}.txt`;
    await uploadTestFile(userToken, searchFolderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await doubleClickItem(page, searchFolderName);
    await page.waitForTimeout(1_000);

    const searchInput = page.locator('input[placeholder="Pesquisar..."]');
    await searchInput.fill('report-ci');
    await page.waitForTimeout(600);

    await expect(page.locator(`[title="${fileName}"]`)).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe('File Manager - Enforcement Backend (Busca)', () => {
  // ─── SR-6 Backend aceita busca com permissão files.read ───────────
  test('SR-6 - Deve buscar com permissão files.read (backend enforcement)', async () => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.FILES_READ,
    ]);
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'GET',
      '/v1/storage/search?query=test'
    );

    expect(status).toBe(200);
  });

  // ─── SR-7 Backend rejeita busca sem permissão ─────────────────────
  test('SR-7 - Backend deve rejeitar busca sem permissão (403)', async () => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      // NO FILES_READ
    ]);
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'GET',
      '/v1/storage/search?query=test'
    );

    expect(status).toBe(403);
  });
});
