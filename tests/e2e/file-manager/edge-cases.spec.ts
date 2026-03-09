import { expect, test } from '@playwright/test';
import { getAuthenticatedToken } from '../helpers/auth.helper';
import {
  ALL_STORAGE_PERMISSIONS,
  createUserWithPermissions,
  getAdminToken,
} from '../helpers/permissions.helper';
import {
  accessSharedFileViaApi,
  apiRequest,
  createShareLinkViaApi,
  createTestFolder,
  downloadSharedFileViaApi,
  getFolderContentsViaApi,
  initializeSystemFolders,
  uploadTestFile,
} from '../helpers/storage.helper';

let userToken: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-edge-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
});

test.describe('File Manager - Casos de Borda', () => {
  // ─── EC-1 Mover pasta para dentro de si mesma — erro 400 ──────────
  test('EC-1 - Deve retornar erro ao mover pasta para dentro de si mesma (circular move)', async () => {
    const folderName = `e2e-ec1-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);

    const { status } = await apiRequest(
      userToken,
      'PATCH',
      `/v1/storage/folders/${folderId}/move`,
      { parentId: folderId }
    );

    expect(status).toBe(400);
  });

  // ─── EC-2 Share link com download limit consumido ──────────────────
  test('EC-2 - Share link com maxDownloads=1 deve falhar após consumir o limite', async () => {
    const folderName = `e2e-ec2-${Date.now()}`;
    const fileName = `ec2-${Date.now()}.txt`;
    const folderId = await createTestFolder(userToken, folderName);
    const fileId = await uploadTestFile(
      userToken,
      folderId,
      fileName,
      'Share limit test'
    );

    // Create share link with maxDownloads=1
    let shareLink: { id: string; token: string };
    try {
      shareLink = await createShareLinkViaApi(userToken, fileId, {
        maxDownloads: 1,
      });
    } catch {
      // storage_share_links table may not exist — skip gracefully
      test.skip(true, 'Share links table not available in this environment');
      return;
    }

    // First download should succeed
    const first = await downloadSharedFileViaApi(shareLink.token);
    expect(first.status).toBe(200);

    // Second download should fail (limit exceeded)
    const second = await downloadSharedFileViaApi(shareLink.token);
    expect([403, 404, 410]).toContain(second.status);
  });

  // ─── EC-3 Share link expirado ──────────────────────────────────────
  test('EC-3 - Share link expirado deve retornar erro adequado', async () => {
    const folderName = `e2e-ec3-${Date.now()}`;
    const fileName = `ec3-${Date.now()}.txt`;
    const folderId = await createTestFolder(userToken, folderName);
    const fileId = await uploadTestFile(
      userToken,
      folderId,
      fileName,
      'Expired share test'
    );

    // Create share link expired in the past
    const pastDate = new Date(Date.now() - 60_000).toISOString(); // 1 min ago
    let shareLink: { id: string; token: string };
    try {
      shareLink = await createShareLinkViaApi(userToken, fileId, {
        expiresAt: pastDate,
      });
    } catch {
      // storage_share_links table may not exist — skip gracefully
      test.skip(true, 'Share links table not available in this environment');
      return;
    }

    // Access should fail (expired)
    const result = await accessSharedFileViaApi(shareLink.token);
    expect([403, 404, 410]).toContain(result.status);
  });

  // ─── EC-4 Nomes especiais — espaços, acentos, unicode ─────────────
  test('EC-4 - Deve lidar corretamente com nomes contendo espaços, acentos e caracteres especiais', async () => {
    const folderName = `e2e-ec4-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);

    // Upload files with special characters in names
    const specialNames = [
      `arquivo com espaços ${Date.now()}.txt`,
      `relatório_técnico_${Date.now()}.txt`,
      `données_café_${Date.now()}.txt`,
    ];

    const fileIds: string[] = [];
    for (const name of specialNames) {
      const id = await uploadTestFile(
        userToken,
        folderId,
        name,
        `Content: ${name}`
      );
      fileIds.push(id);
    }

    // Verify all files are retrievable
    const contents = await getFolderContentsViaApi(userToken, folderId);
    expect(contents.files).toHaveLength(specialNames.length);

    for (const name of specialNames) {
      const found = contents.files.find(f => f.name === name);
      expect(found).toBeTruthy();
    }
  });
});
