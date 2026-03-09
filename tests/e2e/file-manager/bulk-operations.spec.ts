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
  bulkDeleteViaApi,
  bulkMoveViaApi,
  createTestFolder,
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
    `e2e-bulk-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
});

test.describe('File Manager - Operações em Lote', () => {
  // ─── BK-1 Bulk delete múltiplos arquivos ────────────────────────────
  test('BK-1 - Deve excluir múltiplos arquivos em lote via API', async () => {
    const folderName = `e2e-bk1-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);
    const fileId1 = await uploadTestFile(
      userToken,
      folderId,
      `bk1-a-${Date.now()}.txt`
    );
    const fileId2 = await uploadTestFile(
      userToken,
      folderId,
      `bk1-b-${Date.now()}.txt`
    );
    const fileId3 = await uploadTestFile(
      userToken,
      folderId,
      `bk1-c-${Date.now()}.txt`
    );

    const result = await bulkDeleteViaApi(userToken, [
      fileId1,
      fileId2,
      fileId3,
    ]);

    expect(result.deletedFiles).toBe(3);
    expect(result.errors).toHaveLength(0);

    // Verify files are gone from folder contents
    const contents = await getFolderContentsViaApi(userToken, folderId);
    expect(contents.files).toHaveLength(0);
  });

  // ─── BK-2 Bulk delete mix (arquivos + pastas) ──────────────────────
  test('BK-2 - Deve excluir mix de arquivos e pastas em lote', async () => {
    const parentName = `e2e-bk2-${Date.now()}`;
    const parentId = await createTestFolder(userToken, parentName);
    const fileId = await uploadTestFile(
      userToken,
      parentId,
      `bk2-file-${Date.now()}.txt`
    );
    const childId = await createTestFolder(
      userToken,
      `bk2-child-${Date.now()}`,
      parentId
    );

    const result = await bulkDeleteViaApi(userToken, [fileId], [childId]);

    expect(result.deletedFiles).toBe(1);
    expect(result.deletedFolders).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  // ─── BK-3 Bulk move arquivos para outra pasta ──────────────────────
  test('BK-3 - Deve mover múltiplos arquivos para outra pasta em lote', async () => {
    const srcName = `e2e-bk3-src-${Date.now()}`;
    const dstName = `e2e-bk3-dst-${Date.now()}`;
    const srcId = await createTestFolder(userToken, srcName);
    const dstId = await createTestFolder(userToken, dstName);

    const fileId1 = await uploadTestFile(
      userToken,
      srcId,
      `bk3-a-${Date.now()}.txt`
    );
    const fileId2 = await uploadTestFile(
      userToken,
      srcId,
      `bk3-b-${Date.now()}.txt`
    );

    const result = await bulkMoveViaApi(
      userToken,
      [fileId1, fileId2],
      undefined,
      dstId
    );

    expect(result.movedFiles).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Verify files are in destination
    const dstContents = await getFolderContentsViaApi(userToken, dstId);
    expect(dstContents.files).toHaveLength(2);

    // Verify source is empty
    const srcContents = await getFolderContentsViaApi(userToken, srcId);
    expect(srcContents.files).toHaveLength(0);
  });

  // ─── BK-4 Bulk move para root ──────────────────────────────────────
  test('BK-4 - Deve mover arquivos para a raiz em lote (targetFolderId: null)', async () => {
    const srcName = `e2e-bk4-${Date.now()}`;
    const srcId = await createTestFolder(userToken, srcName);
    const childName = `e2e-bk4-child-${Date.now()}`;
    const childId = await createTestFolder(userToken, childName, srcId);

    const result = await bulkMoveViaApi(userToken, undefined, [childId], null);

    expect(result.movedFolders).toBe(1);
    expect(result.errors).toHaveLength(0);

    // Verify child folder is now in root
    const rootContents = await getFolderContentsViaApi(userToken);
    const movedFolder = rootContents.folders.find(f => f.name === childName);
    expect(movedFolder).toBeTruthy();
  });

  // ─── BK-5 Permissão — bulk delete sem storage.files.delete ─────────
  test('BK-5 - Deve rejeitar bulk delete sem permissão storage.files.delete (403)', async () => {
    const user = await createUserWithPermissions(
      [
        STORAGE_PERMISSIONS.INTERFACE_VIEW,
        STORAGE_PERMISSIONS.FILES_LIST,
        STORAGE_PERMISSIONS.FILES_READ,
        STORAGE_PERMISSIONS.FILES_CREATE,
        STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
        STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
        STORAGE_PERMISSIONS.USER_FOLDERS_READ,
        // NO FILES_DELETE
      ],
      `e2e-bk5-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'POST',
      '/v1/storage/bulk/delete',
      {
        fileIds: ['00000000-0000-0000-0000-000000000001'],
        folderIds: [],
      }
    );

    expect(status).toBe(403);
  });

  // ─── BK-6 Permissão — bulk move sem storage.files.update ───────────
  test('BK-6 - Deve rejeitar bulk move sem permissão storage.files.update (403)', async () => {
    const user = await createUserWithPermissions(
      [
        STORAGE_PERMISSIONS.INTERFACE_VIEW,
        STORAGE_PERMISSIONS.FILES_LIST,
        STORAGE_PERMISSIONS.FILES_READ,
        STORAGE_PERMISSIONS.FILES_CREATE,
        STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
        STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
        STORAGE_PERMISSIONS.USER_FOLDERS_READ,
        // NO FILES_UPDATE
      ],
      `e2e-bk6-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'POST',
      '/v1/storage/bulk/move',
      {
        fileIds: ['00000000-0000-0000-0000-000000000001'],
        folderIds: [],
        targetFolderId: null,
      }
    );

    expect(status).toBe(403);
  });
});
