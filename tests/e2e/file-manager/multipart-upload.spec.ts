import { expect, test } from '@playwright/test';
import { getAuthenticatedToken } from '../helpers/auth.helper';
import {
  ALL_STORAGE_PERMISSIONS,
  createUserWithPermissions,
  getAdminToken,
  STORAGE_PERMISSIONS,
} from '../helpers/permissions.helper';
import {
  abortMultipartUploadViaApi,
  apiRequest,
  createTestFolder,
  initiateMultipartUploadViaApi,
  initializeSystemFolders,
} from '../helpers/storage.helper';

const PART_SIZE = 5 * 1024 * 1024; // 5MB

let userToken: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-mp-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
});

test.describe('File Manager - Upload Multipart', () => {
  // ─── MP-1 Initiate retorna uploadId, key e partUrls ────────────────
  test('MP-1 - Initiate multipart deve retornar uploadId, key e partUrls', async () => {
    const fileSize = 12 * 1024 * 1024; // 12MB → 3 parts

    const result = await initiateMultipartUploadViaApi(
      userToken,
      `mp1-${Date.now()}.bin`,
      'application/octet-stream',
      fileSize
    );

    expect(result.uploadId).toBeTruthy();
    expect(typeof result.uploadId).toBe('string');
    expect(result.key).toBeTruthy();
    expect(typeof result.key).toBe('string');
    expect(Array.isArray(result.partUrls)).toBe(true);
    expect(result.partUrls.length).toBeGreaterThan(0);

    // Each part url should have partNumber and url
    for (const part of result.partUrls) {
      expect(typeof part.partNumber).toBe('number');
      expect(typeof part.url).toBe('string');
    }

    // Cleanup
    await abortMultipartUploadViaApi(userToken, result.key, result.uploadId);
  });

  // ─── MP-2 Número correto de partes ─────────────────────────────────
  test('MP-2 - partUrls deve ter o número correto de partes (ceil(fileSize / 5MB))', async () => {
    const fileSize = 23 * 1024 * 1024; // 23MB → ceil(23/5) = 5 parts
    const expectedParts = Math.ceil(fileSize / PART_SIZE);

    const result = await initiateMultipartUploadViaApi(
      userToken,
      `mp2-${Date.now()}.bin`,
      'application/octet-stream',
      fileSize
    );

    expect(result.partUrls).toHaveLength(expectedParts);

    // Part numbers should be sequential starting from 1
    const partNumbers = result.partUrls
      .map(p => p.partNumber)
      .sort((a, b) => a - b);
    for (let i = 0; i < expectedParts; i++) {
      expect(partNumbers[i]).toBe(i + 1);
    }

    // Cleanup
    await abortMultipartUploadViaApi(userToken, result.key, result.uploadId);
  });

  // ─── MP-3 Initiate com folderId ────────────────────────────────────
  test('MP-3 - Initiate multipart deve aceitar folderId opcional', async () => {
    const folderName = `e2e-mp3-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);
    const fileSize = 10 * 1024 * 1024; // 10MB

    const result = await initiateMultipartUploadViaApi(
      userToken,
      `mp3-${Date.now()}.bin`,
      'application/octet-stream',
      fileSize,
      folderId
    );

    expect(result.uploadId).toBeTruthy();
    expect(result.key).toBeTruthy();
    expect(result.partUrls.length).toBeGreaterThan(0);

    // Cleanup
    await abortMultipartUploadViaApi(userToken, result.key, result.uploadId);
  });

  // ─── MP-4 Abort multipart upload ───────────────────────────────────
  test('MP-4 - Abort multipart upload deve retornar sucesso', async () => {
    const fileSize = 10 * 1024 * 1024;

    const initResult = await initiateMultipartUploadViaApi(
      userToken,
      `mp4-${Date.now()}.bin`,
      'application/octet-stream',
      fileSize
    );

    // Abort should not throw
    await abortMultipartUploadViaApi(
      userToken,
      initResult.key,
      initResult.uploadId
    );

    // Verify abort via API returns 204
    const { status } = await apiRequest(
      userToken,
      'POST',
      '/v1/storage/files/multipart/abort',
      { key: initResult.key, uploadId: initResult.uploadId }
    );

    // Second abort may return 204 or 400 (already aborted) — both are acceptable
    expect([204, 400]).toContain(status);
  });

  // ─── MP-5 Permissão — sem storage.files.create ─────────────────────
  test('MP-5 - Deve rejeitar initiate sem permissão storage.files.create (403)', async () => {
    const user = await createUserWithPermissions(
      [
        STORAGE_PERMISSIONS.INTERFACE_VIEW,
        STORAGE_PERMISSIONS.FILES_LIST,
        STORAGE_PERMISSIONS.FILES_READ,
        // NO FILES_CREATE
      ],
      `e2e-mp5-${Date.now().toString(36)}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'POST',
      '/v1/storage/files/multipart/initiate',
      {
        fileName: 'test.bin',
        mimeType: 'application/octet-stream',
        fileSize: 10 * 1024 * 1024,
      }
    );

    expect(status).toBe(403);
  });
});
