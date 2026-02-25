import { expect, test } from '@playwright/test';
import { API_URL } from '../helpers/auth.helper';
import { getAdminToken } from '../helpers/permissions.helper';
import {
  createShareLinkViaApi,
  createTestFolder,
  initializeSystemFolders,
  revokeShareLinkViaApi,
  uploadTestFile,
} from '../helpers/storage.helper';

let adminToken: string;
let testFolderId: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  adminToken = admin.token;
  await initializeSystemFolders(adminToken);

  testFolderId = await createTestFolder(adminToken, `e2e-pubshare-${Date.now()}`);
});

test.describe('Public Share Page - /shared/[token]', () => {
  // ─── PS-1 Exibir informações do arquivo compartilhado ─────────────
  test('PS-1 - Deve exibir informações do arquivo compartilhado', async ({
    page,
  }) => {
    const fileName = `public-info-${Date.now()}.txt`;
    const fileId = await uploadTestFile(adminToken, testFolderId, fileName);
    const shareLink = await createShareLinkViaApi(adminToken, fileId);

    // Navigate directly to public page — no auth injection
    await page.goto(`/shared/${shareLink.token}`);

    // Wait for file info to load
    await expect(
      page.locator(`text=${fileName}`)
    ).toBeVisible({ timeout: 15_000 });

    // Verify file size and mimeType visible
    await expect(page.locator('text=text/plain')).toBeVisible();

    // Verify download button
    await expect(
      page.locator('button:has-text("Baixar arquivo")')
    ).toBeVisible();

    // Verify branding
    await expect(
      page.locator('text=Compartilhado via OpenSea')
    ).toBeVisible();
  });

  // ─── PS-2 Download de arquivo público ─────────────────────────────
  test('PS-2 - Deve permitir download de arquivo público', async ({
    page,
  }) => {
    const fileName = `public-dl-${Date.now()}.txt`;
    const fileId = await uploadTestFile(adminToken, testFolderId, fileName);
    const shareLink = await createShareLinkViaApi(adminToken, fileId);

    await page.goto(`/shared/${shareLink.token}`);
    await expect(
      page.locator(`text=${fileName}`)
    ).toBeVisible({ timeout: 15_000 });

    // Click download — it calls window.open so intercept popup
    const popupPromise = page
      .waitForEvent('popup', { timeout: 10_000 })
      .catch(() => null);
    await page.locator('button:has-text("Baixar arquivo")').click();

    // No error should appear
    await page.waitForTimeout(2_000);
    const errorVisible = await page
      .locator('text=Senha incorreta')
      .isVisible()
      .catch(() => false);
    expect(errorVisible).toBe(false);
  });

  // ─── PS-3 Campo de senha para link protegido ──────────────────────
  test('PS-3 - Deve exibir campo de senha para link protegido', async ({
    page,
  }) => {
    const fileName = `public-pass-${Date.now()}.txt`;
    const fileId = await uploadTestFile(adminToken, testFolderId, fileName);
    const shareLink = await createShareLinkViaApi(adminToken, fileId, {
      password: 'secret123',
    });

    await page.goto(`/shared/${shareLink.token}`);

    // Wait for password prompt
    await expect(
      page.locator('text=Este arquivo é protegido por senha')
    ).toBeVisible({ timeout: 15_000 });

    // Password input should be visible
    await expect(
      page.locator('input[type="password"]')
    ).toBeVisible();

    // Download button should be disabled (no password entered)
    await expect(
      page.locator('button:has-text("Baixar arquivo")')
    ).toBeDisabled();
  });

  // ─── PS-4 Rejeitar senha incorreta ────────────────────────────────
  test('PS-4 - Deve rejeitar senha incorreta', async ({ page }) => {
    const fileName = `public-wrongpass-${Date.now()}.txt`;
    const fileId = await uploadTestFile(adminToken, testFolderId, fileName);
    const shareLink = await createShareLinkViaApi(adminToken, fileId, {
      password: 'correct123',
    });

    await page.goto(`/shared/${shareLink.token}`);
    await expect(
      page.locator('text=Este arquivo é protegido por senha')
    ).toBeVisible({ timeout: 15_000 });

    // Type wrong password
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button:has-text("Baixar arquivo")').click();

    // Assert error text
    await expect(
      page.locator('text=Senha incorreta')
    ).toBeVisible({ timeout: 10_000 });
  });

  // ─── PS-5 Aceitar senha correta e permitir download ───────────────
  test('PS-5 - Deve aceitar senha correta e permitir download', async ({
    page,
  }) => {
    const fileName = `public-rightpass-${Date.now()}.txt`;
    const fileId = await uploadTestFile(adminToken, testFolderId, fileName);
    const shareLink = await createShareLinkViaApi(adminToken, fileId, {
      password: 'correct456',
    });

    await page.goto(`/shared/${shareLink.token}`);
    await expect(
      page.locator('text=Este arquivo é protegido por senha')
    ).toBeVisible({ timeout: 15_000 });

    // Type correct password
    await page.locator('input[type="password"]').fill('correct456');

    const popupPromise = page
      .waitForEvent('popup', { timeout: 10_000 })
      .catch(() => null);
    await page.locator('button:has-text("Baixar arquivo")').click();

    // No error should appear
    await page.waitForTimeout(2_000);
    const errorVisible = await page
      .locator('text=Senha incorreta')
      .isVisible()
      .catch(() => false);
    expect(errorVisible).toBe(false);
  });

  // ─── PS-6 "Link indisponível" para token inválido ─────────────────
  test('PS-6 - Deve exibir "Link indisponível" para token inválido', async ({
    page,
  }) => {
    await page.goto('/shared/invalid-token-12345');

    await expect(
      page.locator('text=Link indisponível')
    ).toBeVisible({ timeout: 15_000 });
  });

  // ─── PS-7 Informações de expiração ────────────────────────────────
  test('PS-7 - Deve exibir informações de expiração', async ({ page }) => {
    const fileName = `public-expiry-${Date.now()}.txt`;
    const fileId = await uploadTestFile(adminToken, testFolderId, fileName);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const shareLink = await createShareLinkViaApi(adminToken, fileId, {
      expiresAt: tomorrow.toISOString(),
    });

    await page.goto(`/shared/${shareLink.token}`);
    await expect(
      page.locator(`text=${fileName}`)
    ).toBeVisible({ timeout: 15_000 });

    // Should show "Disponível até"
    await expect(
      page.locator('text=Disponível até')
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─── PS-8 Contador de downloads com limite ────────────────────────
  test('PS-8 - Deve exibir contador de downloads com limite', async ({
    page,
  }) => {
    const fileName = `public-counter-${Date.now()}.txt`;
    const fileId = await uploadTestFile(adminToken, testFolderId, fileName);

    const shareLink = await createShareLinkViaApi(adminToken, fileId, {
      maxDownloads: 10,
    });

    await page.goto(`/shared/${shareLink.token}`);
    await expect(
      page.locator(`text=${fileName}`)
    ).toBeVisible({ timeout: 15_000 });

    // Should show "0 de 10 downloads realizados"
    await expect(
      page.locator('text=0 de 10 downloads realizados')
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─── PS-9 "Link indisponível" para link revogado ──────────────────
  test('PS-9 - Deve exibir "Link indisponível" para link revogado', async ({
    page,
  }) => {
    const fileName = `public-revoked-${Date.now()}.txt`;
    const fileId = await uploadTestFile(adminToken, testFolderId, fileName);

    const shareLink = await createShareLinkViaApi(adminToken, fileId);
    // Revoke it via API
    await revokeShareLinkViaApi(adminToken, shareLink.id);

    await page.goto(`/shared/${shareLink.token}`);

    await expect(
      page.locator('text=Link indisponível')
    ).toBeVisible({ timeout: 15_000 });
  });
});
