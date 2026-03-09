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
  initializeSystemFolders,
  listFileVersionsViaApi,
  restoreFileVersionViaApi,
  uploadFileVersionViaApi,
  uploadTestFile,
} from '../helpers/storage.helper';

let adminToken: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);
  adminToken = admin.token;
});

test.describe('File Manager - Permissões de Versões', () => {
  // ─── VP-1 Sem storage.versions.create — 403 ────────────────────────
  test('VP-1 - Deve rejeitar upload de versão sem storage.versions.create (403)', async () => {
    // Setup: create file with admin
    const folderName = `e2e-vp1-${Date.now()}`;
    const folderId = await createTestFolder(adminToken, folderName);
    const fileId = await uploadTestFile(
      adminToken,
      folderId,
      `vp1-${Date.now()}.txt`
    );

    // Create user WITHOUT versions.create
    const user = await createUserWithPermissions(
      [
        STORAGE_PERMISSIONS.INTERFACE_VIEW,
        STORAGE_PERMISSIONS.FILES_LIST,
        STORAGE_PERMISSIONS.FILES_READ,
        STORAGE_PERMISSIONS.FILES_CREATE,
        STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
        STORAGE_PERMISSIONS.USER_FOLDERS_READ,
        STORAGE_PERMISSIONS.VERSIONS_READ,
        // NO VERSIONS_CREATE
      ],
      `e2e-vp1-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    // Attempt to upload version via multipart form (use apiRequest with FormData workaround)
    const blob = new Blob(['Version 2'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'v2.txt');

    const res = await fetch(
      `${process.env.API_URL ?? 'http://127.0.0.1:3333'}/v1/storage/files/${fileId}/versions`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` },
        body: formData,
      }
    );

    expect(res.status).toBe(403);
  });

  // ─── VP-2 Sem storage.versions.restore — 403 ───────────────────────
  test('VP-2 - Deve rejeitar restore de versão sem storage.versions.restore (403)', async () => {
    // Setup: create file + version with admin
    const folderName = `e2e-vp2-${Date.now()}`;
    const folderId = await createTestFolder(adminToken, folderName);
    const fileId = await uploadTestFile(
      adminToken,
      folderId,
      `vp2-${Date.now()}.txt`
    );
    await uploadFileVersionViaApi(adminToken, fileId, 'V2 content');

    const versions = await listFileVersionsViaApi(adminToken, fileId);
    const oldVersion = versions.find(v => v.version === 1);
    expect(oldVersion).toBeTruthy();

    // Create user WITHOUT versions.restore
    const user = await createUserWithPermissions(
      [
        STORAGE_PERMISSIONS.INTERFACE_VIEW,
        STORAGE_PERMISSIONS.FILES_LIST,
        STORAGE_PERMISSIONS.FILES_READ,
        STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
        STORAGE_PERMISSIONS.USER_FOLDERS_READ,
        STORAGE_PERMISSIONS.VERSIONS_READ,
        STORAGE_PERMISSIONS.VERSIONS_CREATE,
        // NO VERSIONS_RESTORE
      ],
      `e2e-vp2-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'POST',
      `/v1/storage/files/${fileId}/versions/${oldVersion!.id}/restore`
    );

    expect(status).toBe(403);
  });

  // ─── VP-3 Sem storage.versions.read — 403 ──────────────────────────
  test('VP-3 - Deve rejeitar listagem de versões sem storage.versions.read (403)', async () => {
    const folderName = `e2e-vp3-${Date.now()}`;
    const folderId = await createTestFolder(adminToken, folderName);
    const fileId = await uploadTestFile(
      adminToken,
      folderId,
      `vp3-${Date.now()}.txt`
    );

    // Create user WITHOUT versions.read
    const user = await createUserWithPermissions(
      [
        STORAGE_PERMISSIONS.INTERFACE_VIEW,
        STORAGE_PERMISSIONS.FILES_LIST,
        STORAGE_PERMISSIONS.FILES_READ,
        STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
        STORAGE_PERMISSIONS.USER_FOLDERS_READ,
        // NO VERSIONS_READ
      ],
      `e2e-vp3-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'GET',
      `/v1/storage/files/${fileId}/versions`
    );

    expect(status).toBe(403);
  });

  // ─── VP-4 Com storage.versions.create — sucesso ────────────────────
  test('VP-4 - Deve permitir upload de versão com storage.versions.create (201)', async () => {
    const folderName = `e2e-vp4-${Date.now()}`;
    const folderId = await createTestFolder(adminToken, folderName);
    const fileId = await uploadTestFile(
      adminToken,
      folderId,
      `vp4-${Date.now()}.txt`
    );

    // Create user WITH versions.create
    const user = await createUserWithPermissions(
      [
        STORAGE_PERMISSIONS.INTERFACE_VIEW,
        STORAGE_PERMISSIONS.FILES_LIST,
        STORAGE_PERMISSIONS.FILES_READ,
        STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
        STORAGE_PERMISSIONS.USER_FOLDERS_READ,
        STORAGE_PERMISSIONS.VERSIONS_READ,
        STORAGE_PERMISSIONS.VERSIONS_CREATE,
      ],
      `e2e-vp4-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const versionId = await uploadFileVersionViaApi(
      auth.token,
      fileId,
      'Version 2 content',
      'Upload via VP-4 test'
    );

    expect(versionId).toBeTruthy();
  });

  // ─── VP-5 Com storage.versions.restore — sucesso ───────────────────
  test('VP-5 - Deve permitir restore de versão com storage.versions.restore (200)', async () => {
    const folderName = `e2e-vp5-${Date.now()}`;
    const folderId = await createTestFolder(adminToken, folderName);
    const fileId = await uploadTestFile(
      adminToken,
      folderId,
      `vp5-${Date.now()}.txt`
    );
    await uploadFileVersionViaApi(adminToken, fileId, 'V2');

    const versions = await listFileVersionsViaApi(adminToken, fileId);
    const oldVersion = versions.find(v => v.version === 1);
    expect(oldVersion).toBeTruthy();

    // Create user WITH versions.restore
    const user = await createUserWithPermissions(
      [
        STORAGE_PERMISSIONS.INTERFACE_VIEW,
        STORAGE_PERMISSIONS.FILES_LIST,
        STORAGE_PERMISSIONS.FILES_READ,
        STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
        STORAGE_PERMISSIONS.USER_FOLDERS_READ,
        STORAGE_PERMISSIONS.VERSIONS_READ,
        STORAGE_PERMISSIONS.VERSIONS_CREATE,
        STORAGE_PERMISSIONS.VERSIONS_RESTORE,
      ],
      `e2e-vp5-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    // Should not throw
    await restoreFileVersionViaApi(auth.token, fileId, oldVersion!.id);

    // Verify a new version was created
    const updatedVersions = await listFileVersionsViaApi(auth.token, fileId);
    expect(updatedVersions.length).toBe(versions.length + 1);
  });
});
