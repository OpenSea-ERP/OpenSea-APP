import { expect, test } from '@playwright/test';
import {
  API_URL,
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  createUserWithPermissions,
  getAdminToken,
  STORAGE_PERMISSIONS,
} from '../helpers/permissions.helper';
import {
  apiRequest,
  getContextMenuItems,
  initializeSystemFolders,
  navigateToFileManager,
  rightClickItem,
  uploadTestFile,
} from '../helpers/storage.helper';

// Shared: admin uploads test file into a system folder (visible to all)
let systemFolderId: string;
let testFileId: string;
const TEST_FILE_NAME = `e2e-fperm-${Date.now()}.txt`;

// Base permissions every file-test user needs to navigate to the system folder
const BASE_NAV_PERMISSIONS = [
  STORAGE_PERMISSIONS.INTERFACE_VIEW,
  STORAGE_PERMISSIONS.SYSTEM_FOLDERS_LIST,
  STORAGE_PERMISSIONS.SYSTEM_FOLDERS_READ,
  STORAGE_PERMISSIONS.FILES_LIST,
];

test.beforeAll(async () => {
  const admin = await getAdminToken();

  await initializeSystemFolders(admin.token);

  // Find "Estoque" system folder
  const res = await fetch(`${API_URL}/v1/storage/folders/root/contents`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  const data = await res.json();
  const estoque = data.folders.find(
    (f: { name: string; isSystem: boolean }) =>
      f.name === 'Estoque' && f.isSystem
  );
  if (!estoque) throw new Error('System folder "Estoque" not found');
  systemFolderId = estoque.id;

  // Upload test file into the system folder
  testFileId = await uploadTestFile(
    admin.token,
    systemFolderId,
    TEST_FILE_NAME
  );
});

/**
 * Navigate to the system folder "Estoque" and wait for file to appear.
 */
async function navigateToSystemFolder(page: import('@playwright/test').Page) {
  await navigateToFileManager(page);
  // Double-click "Estoque" system folder
  await page.locator('text="Estoque"').first().dblclick();
  // Wait for the test file to appear
  await expect(page.locator(`text="${TEST_FILE_NAME}"`).first()).toBeVisible({
    timeout: 10_000,
  });
}

test.describe('File Manager - Permissões de Arquivos (Context Menu)', () => {
  // ─── 3.1 Menu completo com todas as permissões ─────────────────────

  test('3.1 - Deve exibir menu completo com todas as permissões de arquivo', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_NAV_PERMISSIONS,
      STORAGE_PERMISSIONS.FILES_READ,
      STORAGE_PERMISSIONS.FILES_DOWNLOAD,
      STORAGE_PERMISSIONS.FILES_UPDATE,
      STORAGE_PERMISSIONS.FILES_DELETE,
      STORAGE_PERMISSIONS.VERSIONS_READ,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToSystemFolder(page);

    await rightClickItem(page, TEST_FILE_NAME);
    const items = await getContextMenuItems(page);

    expect(items).toContain('Abrir');
    expect(items).toContain('Baixar');
    expect(items).toContain('Renomear');
    expect(items).toContain('Mover');
    expect(items).toContain('Versões');
    expect(items).toContain('Excluir');
  });

  // ─── 3.2 Ocultar "Abrir" sem storage.files.read ────────────────────

  test('3.2 - Deve ocultar "Abrir" sem storage.files.read', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_NAV_PERMISSIONS,
      STORAGE_PERMISSIONS.FILES_DOWNLOAD,
      STORAGE_PERMISSIONS.FILES_UPDATE,
      STORAGE_PERMISSIONS.FILES_DELETE,
      // NO storage.files.read
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToSystemFolder(page);

    await rightClickItem(page, TEST_FILE_NAME);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Abrir');
    expect(items).toContain('Baixar');
    expect(items).toContain('Renomear');
  });

  // ─── 3.3 Ocultar "Baixar" sem storage.files.download ───────────────

  test('3.3 - Deve ocultar "Baixar" sem storage.files.download', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_NAV_PERMISSIONS,
      STORAGE_PERMISSIONS.FILES_READ,
      STORAGE_PERMISSIONS.FILES_UPDATE,
      STORAGE_PERMISSIONS.FILES_DELETE,
      // NO storage.files.download
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToSystemFolder(page);

    await rightClickItem(page, TEST_FILE_NAME);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Baixar');
    expect(items).toContain('Abrir');
  });

  // ─── 3.4 Ocultar "Renomear" e "Mover" sem storage.files.update ────

  test('3.4 - Deve ocultar "Renomear" e "Mover" sem storage.files.update', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_NAV_PERMISSIONS,
      STORAGE_PERMISSIONS.FILES_READ,
      STORAGE_PERMISSIONS.FILES_DOWNLOAD,
      STORAGE_PERMISSIONS.FILES_DELETE,
      // NO storage.files.update
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToSystemFolder(page);

    await rightClickItem(page, TEST_FILE_NAME);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Renomear');
    expect(items).not.toContain('Mover');
  });

  // ─── 3.5 Ocultar "Versões" sem storage.versions.read ───────────────

  test('3.5 - Deve ocultar "Versões" sem storage.versions.read', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_NAV_PERMISSIONS,
      STORAGE_PERMISSIONS.FILES_READ,
      // NO storage.versions.read
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToSystemFolder(page);

    await rightClickItem(page, TEST_FILE_NAME);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Versões');
  });

  // ─── 3.6 Ocultar "Excluir" sem storage.files.delete ────────────────

  test('3.6 - Deve ocultar "Excluir" sem storage.files.delete', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_NAV_PERMISSIONS,
      STORAGE_PERMISSIONS.FILES_READ,
      STORAGE_PERMISSIONS.FILES_UPDATE,
      // NO storage.files.delete
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToSystemFolder(page);

    await rightClickItem(page, TEST_FILE_NAME);
    const items = await getContextMenuItems(page);

    expect(items).not.toContain('Excluir');
  });

  // ─── 3.7 Menu mínimo com somente leitura ───────────────────────────

  test('3.7 - Deve exibir menu com apenas "Abrir" com permissão somente leitura', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_NAV_PERMISSIONS,
      STORAGE_PERMISSIONS.FILES_READ,
      // Only read — no download, update, delete, versions
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToSystemFolder(page);

    await rightClickItem(page, TEST_FILE_NAME);
    const items = await getContextMenuItems(page);

    expect(items).toContain('Abrir');
    expect(items).not.toContain('Baixar');
    expect(items).not.toContain('Renomear');
    expect(items).not.toContain('Mover');
    expect(items).not.toContain('Versões');
    expect(items).not.toContain('Excluir');
  });
});

test.describe('File Manager - Enforcement Backend (Arquivos)', () => {
  // ─── 3.8 Backend rejeita exclusão sem permissão ─────────────────────

  test('3.8 - Backend deve rejeitar exclusão sem storage.files.delete', async () => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.FILES_READ,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'DELETE',
      `/v1/storage/files/${testFileId}`
    );

    expect(status).toBe(403);
  });

  // ─── 3.9 Backend rejeita rename sem permissão ──────────────────────

  test('3.9 - Backend deve rejeitar rename sem storage.files.update', async () => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.FILES_READ,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'PATCH',
      `/v1/storage/files/${testFileId}/rename`,
      { name: 'hacked.txt' }
    );

    expect(status).toBe(403);
  });

  // ─── 3.10 Backend rejeita upload sem permissão ─────────────────────

  test('3.10 - Backend deve rejeitar upload sem storage.files.create', async () => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.FILES_READ,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);

    const blob = new Blob(['unauthorized content'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'unauthorized.txt');

    const res = await fetch(
      `${API_URL}/v1/storage/folders/${systemFolderId}/files`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` },
        body: formData,
      }
    );

    expect(res.status).toBe(403);
  });
});
