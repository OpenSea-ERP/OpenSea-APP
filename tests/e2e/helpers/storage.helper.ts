import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { API_URL } from './auth.helper';

/**
 * Initialize system/filter folders for the current tenant.
 */
export async function initializeSystemFolders(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/v1/storage/folders/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  // 200 or 409 (already initialized) are both OK
  if (!res.ok && res.status !== 409) {
    throw new Error(
      `Initialize folders failed (${res.status}): ${await res.text()}`
    );
  }
}

/**
 * Create a user folder via API.
 */
export async function createTestFolder(
  token: string,
  name: string,
  parentId?: string
): Promise<string> {
  const body: Record<string, unknown> = { name };
  if (parentId) body.parentId = parentId;

  const res = await fetch(`${API_URL}/v1/storage/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `Create folder failed (${res.status}): ${await res.text()}`
    );
  }

  const data = await res.json();
  return data.folder?.id ?? data.id;
}

/**
 * Upload a test file to a folder via multipart form.
 */
export async function uploadTestFile(
  token: string,
  folderId: string,
  fileName = 'test-file.txt',
  content = 'E2E test file content'
): Promise<string> {
  const blob = new Blob([content], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, fileName);

  const res = await fetch(`${API_URL}/v1/storage/folders/${folderId}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload file failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.file?.id ?? data.id;
}

/**
 * Get the root folder contents to find system and filter folders.
 */
export async function getRootFolderContents(token: string): Promise<{
  folders: Array<{
    id: string;
    name: string;
    isSystem: boolean;
    isFilter: boolean;
  }>;
}> {
  const res = await fetch(`${API_URL}/v1/storage/folders/root/contents`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `Get root contents failed (${res.status}): ${await res.text()}`
    );
  }

  return res.json();
}

/**
 * Find a system folder from root contents.
 */
export async function findSystemFolder(
  token: string
): Promise<{ id: string; name: string } | null> {
  const { folders } = await getRootFolderContents(token);
  const system = folders.find(f => f.isSystem);
  return system ? { id: system.id, name: system.name } : null;
}

/**
 * Find a filter folder from root contents.
 */
export async function findFilterFolder(
  token: string
): Promise<{ id: string; name: string } | null> {
  const { folders } = await getRootFolderContents(token);
  const filter = folders.find(f => f.isFilter);
  return filter ? { id: filter.id, name: filter.name } : null;
}

/**
 * Navigate to file manager and wait for it to be ready.
 */
export async function navigateToFileManager(page: Page): Promise<void> {
  await page.goto('/file-manager');
  // Wait for the hero card title to be visible
  await expect(
    page.locator('h1:has-text("Gerenciador de Arquivos")')
  ).toBeVisible({ timeout: 15_000 });
}

/**
 * Right-click an item in the file manager grid by its name.
 * Uses the `title` attribute on folder/file card spans for reliable matching.
 */
export async function rightClickItem(page: Page, name: string): Promise<void> {
  const item = page.locator(`[title="${name}"]`).first();
  await expect(item).toBeVisible({ timeout: 10_000 });
  await item.scrollIntoViewIfNeeded();
  await item.click({ button: 'right' });
  // Wait for context menu to appear
  await expect(page.locator('[role="menu"]')).toBeVisible({ timeout: 5_000 });
}

/**
 * Click (select) an item in the file manager grid by its name.
 * Uses the `title` attribute on folder/file card spans for reliable matching.
 */
export async function clickItem(page: Page, name: string): Promise<void> {
  const item = page.locator(`[title="${name}"]`).first();
  await expect(item).toBeVisible({ timeout: 10_000 });
  await item.scrollIntoViewIfNeeded();
  await item.click();
}

/**
 * Get visible context menu item texts.
 */
export async function getContextMenuItems(page: Page): Promise<string[]> {
  const items = page.locator('[role="menu"] [role="menuitem"]');
  const texts: string[] = [];
  const count = await items.count();
  for (let i = 0; i < count; i++) {
    const text = await items.nth(i).textContent();
    if (text) texts.push(text.trim());
  }
  return texts;
}

/**
 * Make a direct API call (for backend enforcement tests).
 */
export async function apiRequest(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const options: RequestInit = { method, headers };

  if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// =============================================================================
// Folder API Helpers
// =============================================================================

/**
 * Rename a folder via API.
 */
export async function renameFolderViaApi(
  token: string,
  folderId: string,
  newName: string
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/storage/folders/${folderId}/rename`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!res.ok) {
    throw new Error(
      `Rename folder failed (${res.status}): ${await res.text()}`
    );
  }
}

/**
 * Move a folder via API.
 */
export async function moveFolderViaApi(
  token: string,
  folderId: string,
  parentId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/storage/folders/${folderId}/move`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ parentId }),
  });

  if (!res.ok) {
    throw new Error(`Move folder failed (${res.status}): ${await res.text()}`);
  }
}

/**
 * Update folder color via API.
 */
export async function updateFolderColorViaApi(
  token: string,
  folderId: string,
  color: string | null
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/storage/folders/${folderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ color }),
  });

  if (!res.ok) {
    throw new Error(
      `Update folder color failed (${res.status}): ${await res.text()}`
    );
  }
}

/**
 * Delete a folder via API.
 */
export async function deleteFolderViaApi(
  token: string,
  folderId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/storage/folders/${folderId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `Delete folder failed (${res.status}): ${await res.text()}`
    );
  }
}

/**
 * Get folder contents via API.
 */
export async function getFolderContentsViaApi(
  token: string,
  folderId?: string
): Promise<{
  folders: Array<{
    id: string;
    name: string;
    isSystem: boolean;
    isFilter: boolean;
    color: string | null;
  }>;
  files: Array<{
    id: string;
    name: string;
    size: number;
    mimeType: string;
  }>;
}> {
  const path = folderId
    ? `/v1/storage/folders/${folderId}/contents`
    : '/v1/storage/folders/root/contents';

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `Get folder contents failed (${res.status}): ${await res.text()}`
    );
  }

  return res.json();
}

// =============================================================================
// File API Helpers
// =============================================================================

/**
 * Rename a file via API.
 */
export async function renameFileViaApi(
  token: string,
  fileId: string,
  name: string
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/storage/files/${fileId}/rename`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    throw new Error(`Rename file failed (${res.status}): ${await res.text()}`);
  }
}

/**
 * Move a file via API.
 */
export async function moveFileViaApi(
  token: string,
  fileId: string,
  folderId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/storage/files/${fileId}/move`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ folderId }),
  });

  if (!res.ok) {
    throw new Error(`Move file failed (${res.status}): ${await res.text()}`);
  }
}

/**
 * Delete a file via API.
 */
export async function deleteFileViaApi(
  token: string,
  fileId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/storage/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Delete file failed (${res.status}): ${await res.text()}`);
  }
}

/**
 * Get file details via API.
 */
export async function getFileViaApi(
  token: string,
  fileId: string
): Promise<{ id: string; name: string; size: number; currentVersion: number }> {
  const res = await fetch(`${API_URL}/v1/storage/files/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Get file failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.file ?? data;
}

// =============================================================================
// Version API Helpers
// =============================================================================

/**
 * Upload a new file version via API.
 */
export async function uploadFileVersionViaApi(
  token: string,
  fileId: string,
  content = 'Updated content',
  changeNote?: string
): Promise<string> {
  const blob = new Blob([content], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, 'updated-file.txt');
  if (changeNote) formData.append('changeNote', changeNote);

  const res = await fetch(`${API_URL}/v1/storage/files/${fileId}/versions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(
      `Upload file version failed (${res.status}): ${await res.text()}`
    );
  }

  const data = await res.json();
  return data.version?.id ?? data.id;
}

/**
 * List file versions via API.
 */
export async function listFileVersionsViaApi(
  token: string,
  fileId: string
): Promise<
  Array<{
    id: string;
    version: number;
    size: number;
    changeNote: string | null;
    createdAt: string;
  }>
> {
  const res = await fetch(`${API_URL}/v1/storage/files/${fileId}/versions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `List file versions failed (${res.status}): ${await res.text()}`
    );
  }

  const data = await res.json();
  return data.versions ?? data;
}

/**
 * Restore a file version via API.
 */
export async function restoreFileVersionViaApi(
  token: string,
  fileId: string,
  versionId: string
): Promise<void> {
  const res = await fetch(
    `${API_URL}/v1/storage/files/${fileId}/versions/${versionId}/restore`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(
      `Restore file version failed (${res.status}): ${await res.text()}`
    );
  }
}

// =============================================================================
// Access API Helpers
// =============================================================================

/**
 * List folder access rules via API.
 */
export async function listFolderAccessViaApi(
  token: string,
  folderId: string
): Promise<{
  rules: Array<{
    id: string;
    userId: string | null;
    userName: string | null;
    groupId: string | null;
    groupName: string | null;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canShare: boolean;
    isInherited: boolean;
  }>;
}> {
  const res = await fetch(`${API_URL}/v1/storage/folders/${folderId}/access`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `List folder access failed (${res.status}): ${await res.text()}`
    );
  }

  return res.json();
}

/**
 * Set folder access (grant access to a user or group).
 */
export async function setFolderAccessViaApi(
  token: string,
  folderId: string,
  payload: {
    userId?: string;
    groupId?: string;
    canRead?: boolean;
    canWrite?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
  }
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/storage/folders/${folderId}/access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Set folder access failed (${res.status}): ${await res.text()}`
    );
  }
}

/**
 * Remove a folder access rule.
 */
export async function removeFolderAccessViaApi(
  token: string,
  folderId: string,
  ruleId: string
): Promise<void> {
  const res = await fetch(
    `${API_URL}/v1/storage/folders/${folderId}/access/${ruleId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(
      `Remove folder access failed (${res.status}): ${await res.text()}`
    );
  }
}

// =============================================================================
// PIN Helper
// =============================================================================

/**
 * Set the action PIN for a user via API.
 * Required before any destructive action (delete) can be performed.
 */
export async function setActionPinViaApi(
  token: string,
  currentPassword: string,
  pin: string
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/me/action-pin`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newActionPin: pin }),
  });

  if (!res.ok) {
    throw new Error(
      `Set action PIN failed (${res.status}): ${await res.text()}`
    );
  }
}

// =============================================================================
// UI Helpers
// =============================================================================

/**
 * Wait for a toast with specific text to appear (sonner).
 */
export async function waitForToast(
  page: Page,
  text: string,
  timeout = 10_000
): Promise<Locator> {
  const toast = page.locator(`[data-sonner-toast] :text("${text}")`).first();
  await expect(toast).toBeVisible({ timeout });
  return toast;
}

/**
 * Double-click an item in the file manager grid by its name.
 * Uses the `title` attribute on folder/file card spans for reliable matching.
 * Clicks the parent card element to ensure onDoubleClick fires properly.
 */
export async function doubleClickItem(page: Page, name: string): Promise<void> {
  // Find the wrapper div[data-item-id] that contains the named span
  const wrapper = page.locator(`[data-item-id]:has([title="${name}"])`).first();
  await expect(wrapper).toBeVisible({ timeout: 10_000 });
  await wrapper.scrollIntoViewIfNeeded();
  // Let scroll animation settle
  await page.waitForTimeout(300);
  await wrapper.dblclick();
}

/**
 * Click a toolbar button by its text content.
 */
export async function clickToolbarButton(
  page: Page,
  text: string
): Promise<void> {
  await page.locator(`button:has-text("${text}")`).first().click();
}

/**
 * Click a context menu item by its text.
 */
export async function clickContextMenuItem(
  page: Page,
  text: string
): Promise<void> {
  const item = page.locator(
    `[role="menu"] [role="menuitem"]:has-text("${text}")`
  );
  await item.waitFor({ state: 'attached', timeout: 5_000 });
  await item.dispatchEvent('click');
}

/**
 * Get names of all visible items (folders + files) in the grid.
 */
export async function getGridItemNames(page: Page): Promise<string[]> {
  // Wait a bit for the grid to stabilize
  await page.waitForTimeout(500);
  const items = page.locator(
    '[data-testid^="fm-item-"], .file-card-name, .folder-card-name'
  );
  const count = await items.count();
  if (count > 0) {
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      if (text) names.push(text.trim());
    }
    return names;
  }
  // Fallback: extract text from the content area
  return [];
}

/**
 * Get breadcrumb text segments.
 */
export async function getBreadcrumbTexts(page: Page): Promise<string[]> {
  const breadcrumb = page.locator('nav[aria-label="breadcrumb"] li');
  const count = await breadcrumb.count();
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await breadcrumb.nth(i).textContent();
    if (text) texts.push(text.trim());
  }
  return texts;
}

/**
 * Type into the PIN modal (4 digits) and wait for verification.
 */
export async function enterActionPin(page: Page, pin: string): Promise<void> {
  // The PIN modal uses InputOTP which renders masked slots
  // Focus the first OTP input and type the PIN
  const otpInput = page.locator('[data-input-otp="true"]').first();
  await expect(otpInput).toBeVisible({ timeout: 5_000 });
  await otpInput.focus();
  await page.keyboard.type(pin, { delay: 50 });
  // Auto-submit happens after 4 digits + 100ms timeout
  await page.waitForTimeout(300);
}
