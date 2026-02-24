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
  createTestFolder,
  doubleClickItem,
  getBreadcrumbTexts,
  initializeSystemFolders,
  navigateToFileManager,
  uploadTestFile,
} from '../helpers/storage.helper';

let userToken: string;
let userTenantId: string;

/**
 * Click the "Início" link in the FILE MANAGER breadcrumb (the second breadcrumb on the page).
 * The page-level breadcrumb is the first nav[aria-label="breadcrumb"]; the FM breadcrumb is the second.
 */
async function clickFmBreadcrumbHome(page: import('@playwright/test').Page) {
  const fmBreadcrumb = page.locator('nav[aria-label="breadcrumb"]').nth(1);
  await fmBreadcrumb.getByText('Início').click();
}

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-nav-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('File Manager - Navegação, Busca, Filtros, Ordenação e View Mode', () => {
  // ─── 5.1 Navegar para dentro de pasta (double-click) ─────────────
  test('5.1 - Navegar para dentro de pasta via double-click', async ({
    page,
  }) => {
    const parentName = `e2e-nav-parent-${Date.now()}`;
    const childName = `e2e-nav-child-${Date.now()}`;

    const parentId = await createTestFolder(userToken, parentName);
    await createTestFolder(userToken, childName, parentId);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Double-click to enter parent
    await doubleClickItem(page, parentName);

    // Verify child is visible and breadcrumb shows path
    await expect(page.locator(`text=${childName}`)).toBeVisible({
      timeout: 10_000,
    });
    const breadcrumb = await getBreadcrumbTexts(page);
    expect(breadcrumb.join(' ')).toContain(parentName);
  });

  // ─── 5.2 Navegar via breadcrumb ──────────────────────────────────
  test('5.2 - Navegar de volta via breadcrumb', async ({ page }) => {
    const parentName = `e2e-bc-parent-${Date.now()}`;
    const childName = `e2e-bc-child-${Date.now()}`;

    const parentId = await createTestFolder(userToken, parentName);
    await createTestFolder(userToken, childName, parentId);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into parent
    await doubleClickItem(page, parentName);
    await expect(page.locator(`text=${childName}`)).toBeVisible({
      timeout: 10_000,
    });

    // Click "Início" in the file-manager breadcrumb to go back to root
    await clickFmBreadcrumbHome(page);

    // Verify we're back at root — parent folder should be visible again
    await expect(page.locator(`text=${parentName}`)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── 5.3 Voltar ao root via Home no breadcrumb ───────────────────
  test('5.3 - Voltar ao root via Home no breadcrumb (subpasta profunda)', async ({
    page,
  }) => {
    const level1 = `e2e-l1-${Date.now()}`;
    const level2 = `e2e-l2-${Date.now()}`;

    const l1Id = await createTestFolder(userToken, level1);
    await createTestFolder(userToken, level2, l1Id);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into level 1, then level 2
    await doubleClickItem(page, level1);
    await expect(page.locator(`text=${level2}`)).toBeVisible({
      timeout: 10_000,
    });
    await doubleClickItem(page, level2);
    await page.waitForTimeout(1_000);

    // Click Home/Início in breadcrumb
    await clickFmBreadcrumbHome(page);

    // Verify we're at root
    await expect(page.locator(`text=${level1}`)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── 5.4 Buscar pasta por nome ───────────────────────────────────
  test('5.4 - Buscar pasta por nome', async ({ page }) => {
    const uniqueName = `e2e-search-xyz-${Date.now()}`;
    await createTestFolder(userToken, uniqueName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Type in search field
    const searchInput = page.locator('input[placeholder="Pesquisar..."]');
    await searchInput.fill(uniqueName.slice(0, 20));

    // Wait for debounce (300ms) + network
    await page.waitForTimeout(1_000);

    // Verify the folder appears
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── 5.5 Buscar arquivo por nome ─────────────────────────────────
  test('5.5 - Buscar arquivo por nome dentro de pasta', async ({ page }) => {
    const folderName = `e2e-fsrch-${Date.now()}`;
    // Use a short file name to avoid truncation issues in the grid
    const fileName = `srch-${Date.now().toString(36)}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    await uploadTestFile(userToken, folderId, fileName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into the folder
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    // The file should already be visible (single file in folder)
    await expect(page.getByText(fileName)).toBeVisible({ timeout: 10_000 });

    // Now search for it
    const searchInput = page.locator('input[placeholder="Pesquisar..."]');
    await searchInput.fill(fileName.slice(0, 10));
    await page.waitForTimeout(1_000);

    // File should still be visible after search
    await expect(page.getByText(fileName)).toBeVisible({ timeout: 10_000 });
  });

  // ─── 5.6 Filtrar: ocultar pastas de sistema ──────────────────────
  test('5.6 - Filtrar: ocultar pastas de sistema', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Verify "Estoque" system folder is initially visible
    await expect(page.locator('text=Estoque').first()).toBeVisible({
      timeout: 10_000,
    });

    // Open filter popover (SlidersHorizontal button)
    await page.locator('button:has(svg.lucide-sliders-horizontal)').click();

    // Uncheck "Sistema"
    const sistemaLabel = page.locator('label:has-text("Sistema")');
    await sistemaLabel.click();

    // Close popover by clicking elsewhere
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // System folder should be hidden
    await expect(page.locator('text=Estoque').first()).not.toBeVisible({
      timeout: 5_000,
    });
  });

  // ─── 5.7 Filtrar: ocultar pastas de filtragem ────────────────────
  test('5.7 - Filtrar: ocultar pastas de filtragem', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Verify "Boletos (Todos)" filter folder is initially visible
    const filterFolder = page.locator('text=Boletos (Todos)').first();
    await expect(filterFolder).toBeVisible({ timeout: 10_000 });

    // Open filter popover
    await page.locator('button:has(svg.lucide-sliders-horizontal)').click();

    // Uncheck "Filtragem"
    const filtragemLabel = page.locator('label:has-text("Filtragem")');
    await filtragemLabel.click();

    // Close popover
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Filter folder should be hidden
    await expect(filterFolder).not.toBeVisible({ timeout: 5_000 });
  });

  // ─── 5.8 Alternar grid → lista ───────────────────────────────────
  test('5.8 - Alternar modo de visualização para lista', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Wait for content to load
    await page.waitForTimeout(2_000);

    // Click "Lista" button (the list icon button in the view toggle)
    const listButton = page.locator('button:has(svg.lucide-list)');
    await listButton.click();

    // Verify table headers appear (list view uses a table layout)
    await expect(
      page.locator(
        'th:has-text("Nome"), [role="columnheader"]:has-text("Nome")'
      )
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─── 5.9 Alternar lista → grid ───────────────────────────────────
  test('5.9 - Alternar modo de visualização de volta para grid', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);
    await page.waitForTimeout(2_000);

    // Switch to list first
    await page.locator('button:has(svg.lucide-list)').click();
    await page.waitForTimeout(500);

    // Switch back to grid — use .last() to avoid matching the nav hamburger
    await page.locator('button:has(svg.lucide-grid-3x3)').last().click();
    await page.waitForTimeout(500);

    // Table headers should disappear
    await expect(
      page.locator(
        'th:has-text("Nome"), [role="columnheader"]:has-text("Nome")'
      )
    ).not.toBeVisible({ timeout: 5_000 });
  });

  // ─── 5.10 Ordenar por nome ───────────────────────────────────────
  test('5.10 - Ordenar pastas por nome (A-Z e Z-A)', async ({ page }) => {
    const ts = Date.now();
    // Use a unique prefix to avoid collision and make search reliable
    const prefix = `srt${ts.toString(36)}`;
    const names = [`${prefix}-A`, `${prefix}-B`, `${prefix}-C`];

    for (const name of names) {
      await createTestFolder(userToken, name);
    }

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Search for the prefix to isolate our folders
    const searchInput = page.locator('input[placeholder="Pesquisar..."]');
    await searchInput.fill(prefix);
    await page.waitForTimeout(1_500);

    // Verify all 3 folders are visible
    for (const name of names) {
      await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
    }

    // Default sort is already "name asc" — verify A-Z order
    const contentArea = page.locator('.flex-1.overflow-y-auto');
    const contentText = await contentArea.textContent();

    const idxA = contentText?.indexOf(names[0]) ?? -1;
    const idxB = contentText?.indexOf(names[1]) ?? -1;
    const idxC = contentText?.indexOf(names[2]) ?? -1;

    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeGreaterThanOrEqual(0);
    expect(idxC).toBeGreaterThanOrEqual(0);
    expect(idxA).toBeLessThan(idxB);
    expect(idxB).toBeLessThan(idxC);

    // Toggle to Z-A by clicking "Nome" (since already sorted by name, this toggles to desc)
    await page.locator('button:has(svg.lucide-arrow-up-down)').click();
    await page.locator('[role="menuitem"]:has-text("Nome")').click();
    await page.waitForTimeout(1_000);

    const contentTextDesc = await contentArea.textContent();
    const idxADesc = contentTextDesc?.indexOf(names[0]) ?? -1;
    const idxCDesc = contentTextDesc?.indexOf(names[2]) ?? -1;

    expect(idxCDesc).toBeLessThan(idxADesc);
  });
});
