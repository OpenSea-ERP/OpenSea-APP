import { expect, test } from '@playwright/test';
import { getAuthenticatedToken } from '../helpers/auth.helper';
import {
  ALL_STORAGE_PERMISSIONS,
  createUserWithPermissions,
  getAdminToken,
  STORAGE_PERMISSIONS,
} from '../helpers/permissions.helper';
import {
  apiRequest,
  createTestFolder,
  getStorageStatsViaApi,
  initializeSystemFolders,
  uploadTestFile,
} from '../helpers/storage.helper';

let userToken: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-stats-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
});

test.describe('File Manager - Estatísticas de Armazenamento', () => {
  // ─── SS-1 Stats retorna campos corretos ─────────────────────────────
  test('SS-1 - Deve retornar campos corretos nas estatísticas de armazenamento', async () => {
    const stats = await getStorageStatsViaApi(userToken);

    expect(typeof stats.totalFiles).toBe('number');
    expect(typeof stats.totalSize).toBe('number');
    expect(typeof stats.filesByType).toBe('object');
    expect(typeof stats.usedStoragePercent).toBe('number');
    expect(stats.totalFiles).toBeGreaterThanOrEqual(0);
    expect(stats.totalSize).toBeGreaterThanOrEqual(0);
    expect(stats.usedStoragePercent).toBeGreaterThanOrEqual(0);
    expect(stats.usedStoragePercent).toBeLessThanOrEqual(100);
  });

  // ─── SS-2 Stats refletem após upload ────────────────────────────────
  test('SS-2 - Estatísticas devem refletir após upload de arquivo', async () => {
    const statsBefore = await getStorageStatsViaApi(userToken);

    const folderName = `e2e-ss2-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);
    await uploadTestFile(
      userToken,
      folderId,
      `ss2-${Date.now()}.txt`,
      'Stats test content'
    );

    const statsAfter = await getStorageStatsViaApi(userToken);

    expect(statsAfter.totalFiles).toBe(statsBefore.totalFiles + 1);
    expect(statsAfter.totalSize).toBeGreaterThan(statsBefore.totalSize);
  });

  // ─── SS-3 Permissão — sem storage.stats.view ───────────────────────
  test('SS-3 - Deve rejeitar sem permissão storage.stats.view (403)', async () => {
    const user = await createUserWithPermissions(
      [
        STORAGE_PERMISSIONS.INTERFACE_VIEW,
        STORAGE_PERMISSIONS.FILES_LIST,
        STORAGE_PERMISSIONS.FILES_READ,
        // NO STATS_VIEW
      ],
      `e2e-ss3-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(auth.token, 'GET', '/v1/storage/stats');

    expect(status).toBe(403);
  });
});
