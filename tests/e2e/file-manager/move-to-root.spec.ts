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
  getFolderContentsViaApi,
  initializeSystemFolders,
  moveFileViaApi,
  moveFolderViaApi,
  navigateToFileManager,
  uploadTestFile,
} from '../helpers/storage.helper';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-move-root-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('File Manager - Mover para Raiz', () => {
  // ─── MR-1 Mover arquivo de pasta para root ─────────────────────────
  test('MR-1 - Deve mover arquivo de uma pasta para a raiz (folderId: null)', async () => {
    const folderName = `e2e-mr1-${Date.now()}`;
    const fileName = `mr1-file-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    const fileId = await uploadTestFile(userToken, folderId, fileName);

    // Move file to root
    await moveFileViaApi(userToken, fileId, null);

    // Verify file is no longer in original folder
    const folderContents = await getFolderContentsViaApi(userToken, folderId);
    const fileInFolder = folderContents.files.find(f => f.name === fileName);
    expect(fileInFolder).toBeUndefined();

    // Verify file is in root
    const rootContents = await getFolderContentsViaApi(userToken);
    const fileInRoot = rootContents.files.find(f => f.name === fileName);
    expect(fileInRoot).toBeTruthy();
  });

  // ─── MR-2 Mover pasta de parent para root ──────────────────────────
  test('MR-2 - Deve mover pasta de um parent para a raiz (parentId: null)', async () => {
    const parentName = `e2e-mr2-parent-${Date.now()}`;
    const childName = `e2e-mr2-child-${Date.now()}`;

    const parentId = await createTestFolder(userToken, parentName);
    const childId = await createTestFolder(userToken, childName, parentId);

    // Move child folder to root
    await moveFolderViaApi(userToken, childId, null);

    // Verify child is no longer in parent
    const parentContents = await getFolderContentsViaApi(userToken, parentId);
    const childInParent = parentContents.folders.find(
      f => f.name === childName
    );
    expect(childInParent).toBeUndefined();

    // Verify child is in root
    const rootContents = await getFolderContentsViaApi(userToken);
    const childInRoot = rootContents.folders.find(f => f.name === childName);
    expect(childInRoot).toBeTruthy();
  });

  // ─── MR-3 UI — arquivo movido para root aparece na raiz ────────────
  test('MR-3 - UI deve exibir arquivo movido para root na visão raiz', async ({
    page,
  }) => {
    const folderName = `e2e-mr3-${Date.now()}`;
    const fileName = `mr3-ui-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    const fileId = await uploadTestFile(userToken, folderId, fileName);

    // Move file to root via API
    await moveFileViaApi(userToken, fileId, null);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Verify file is visible at root
    await expect(page.locator(`[title="${fileName}"]`)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── MR-4 Mover pasta para root e verificar que aparece ────────────
  test('MR-4 - Pasta movida para root deve aparecer na visão raiz', async ({
    page,
  }) => {
    const parentName = `e2e-mr4-parent-${Date.now()}`;
    const childName = `e2e-mr4-child-${Date.now()}`;

    const parentId = await createTestFolder(userToken, parentName);
    const childId = await createTestFolder(userToken, childName, parentId);

    // Move child to root via API
    await moveFolderViaApi(userToken, childId, null);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Verify child folder is visible at root
    await expect(page.locator(`[title="${childName}"]`)).toBeVisible({
      timeout: 10_000,
    });

    // Navigate into the moved folder to verify it works
    await doubleClickItem(page, childName);
    await page.waitForTimeout(1_000);

    // Breadcrumb should show: Início > childName
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb.locator(`text=${childName}`)).toBeVisible();
  });
});
