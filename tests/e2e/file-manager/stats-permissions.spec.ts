import { expect, test } from '@playwright/test';
import { getAuthenticatedToken } from '../helpers/auth.helper';
import {
  createUserWithPermissions,
  getAdminToken,
  STORAGE_PERMISSIONS,
} from '../helpers/permissions.helper';
import {
  apiRequest,
  getStorageStatsViaApi,
  initializeSystemFolders,
} from '../helpers/storage.helper';

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);
});

test.describe('File Manager - Permissão storage.stats.view', () => {
  // ─── SP-1 Com permissão — 200 ──────────────────────────────────────
  test('SP-1 - Deve retornar 200 com permissão storage.stats.view', async () => {
    const user = await createUserWithPermissions(
      [STORAGE_PERMISSIONS.INTERFACE_VIEW, STORAGE_PERMISSIONS.STATS_VIEW],
      `e2e-sp1-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const stats = await getStorageStatsViaApi(auth.token);

    expect(typeof stats.totalFiles).toBe('number');
    expect(typeof stats.totalSize).toBe('number');
    expect(typeof stats.usedStoragePercent).toBe('number');
  });

  // ─── SP-2 Sem permissão — 403 ──────────────────────────────────────
  test('SP-2 - Deve retornar 403 sem permissão storage.stats.view', async () => {
    const user = await createUserWithPermissions(
      [
        STORAGE_PERMISSIONS.INTERFACE_VIEW,
        STORAGE_PERMISSIONS.FILES_LIST,
        STORAGE_PERMISSIONS.FILES_READ,
        // NO STATS_VIEW
      ],
      `e2e-sp2-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(auth.token, 'GET', '/v1/storage/stats');

    expect(status).toBe(403);
  });
});
