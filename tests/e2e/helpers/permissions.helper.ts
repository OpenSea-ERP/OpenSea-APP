import {
  API_URL,
  loginViaApi,
  selectTenantViaApi,
  getFirstTenantId,
} from './auth.helper';

/**
 * All storage permission codes available.
 */
export const STORAGE_PERMISSIONS = {
  // Interface
  INTERFACE_VIEW: 'storage.interface.view',

  // User folders
  USER_FOLDERS_LIST: 'storage.user-folders.list',
  USER_FOLDERS_CREATE: 'storage.user-folders.create',
  USER_FOLDERS_READ: 'storage.user-folders.read',
  USER_FOLDERS_UPDATE: 'storage.user-folders.update',
  USER_FOLDERS_DELETE: 'storage.user-folders.delete',
  USER_FOLDERS_DOWNLOAD: 'storage.user-folders.download',
  USER_FOLDERS_SHARE_USER: 'storage.user-folders.share-user',
  USER_FOLDERS_SHARE_GROUP: 'storage.user-folders.share-group',

  // Filter folders
  FILTER_FOLDERS_LIST: 'storage.filter-folders.list',
  FILTER_FOLDERS_READ: 'storage.filter-folders.read',
  FILTER_FOLDERS_DOWNLOAD: 'storage.filter-folders.download',
  FILTER_FOLDERS_SHARE_USER: 'storage.filter-folders.share-user',
  FILTER_FOLDERS_SHARE_GROUP: 'storage.filter-folders.share-group',

  // System folders
  SYSTEM_FOLDERS_LIST: 'storage.system-folders.list',
  SYSTEM_FOLDERS_READ: 'storage.system-folders.read',
  SYSTEM_FOLDERS_DOWNLOAD: 'storage.system-folders.download',
  SYSTEM_FOLDERS_SHARE_USER: 'storage.system-folders.share-user',
  SYSTEM_FOLDERS_SHARE_GROUP: 'storage.system-folders.share-group',

  // Files
  FILES_LIST: 'storage.files.list',
  FILES_CREATE: 'storage.files.create',
  FILES_READ: 'storage.files.read',
  FILES_UPDATE: 'storage.files.update',
  FILES_DELETE: 'storage.files.delete',
  FILES_DOWNLOAD: 'storage.files.download',
  FILES_SHARE_USER: 'storage.files.share-user',
  FILES_SHARE_GROUP: 'storage.files.share-group',

  // Versions
  VERSIONS_READ: 'storage.versions.read',
  VERSIONS_CREATE: 'storage.versions.create',
  VERSIONS_RESTORE: 'storage.versions.restore',

  // Stats
  STATS_VIEW: 'storage.stats.view',
} as const;

/** All storage permission codes as a flat array */
export const ALL_STORAGE_PERMISSIONS = Object.values(STORAGE_PERMISSIONS);

/** Minimal permissions to see the file manager page */
export const VIEW_ONLY_PERMISSIONS = [STORAGE_PERMISSIONS.INTERFACE_VIEW];

/** All file-related permissions */
export const ALL_FILE_PERMISSIONS = [
  STORAGE_PERMISSIONS.FILES_LIST,
  STORAGE_PERMISSIONS.FILES_CREATE,
  STORAGE_PERMISSIONS.FILES_READ,
  STORAGE_PERMISSIONS.FILES_UPDATE,
  STORAGE_PERMISSIONS.FILES_DELETE,
  STORAGE_PERMISSIONS.FILES_DOWNLOAD,
  STORAGE_PERMISSIONS.FILES_SHARE_USER,
  STORAGE_PERMISSIONS.FILES_SHARE_GROUP,
];

/** All user-folder-related permissions */
export const ALL_USER_FOLDER_PERMISSIONS = [
  STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
  STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
  STORAGE_PERMISSIONS.USER_FOLDERS_READ,
  STORAGE_PERMISSIONS.USER_FOLDERS_UPDATE,
  STORAGE_PERMISSIONS.USER_FOLDERS_DELETE,
  STORAGE_PERMISSIONS.USER_FOLDERS_DOWNLOAD,
  STORAGE_PERMISSIONS.USER_FOLDERS_SHARE_USER,
  STORAGE_PERMISSIONS.USER_FOLDERS_SHARE_GROUP,
];

// ─── Admin token cache ───────────────────────────────────────────────

let cachedAdminAuth: { token: string; tenantId: string } | null = null;

/**
 * Get admin token (cached for the test run).
 * Uses admin@teste.com which has all RBAC management permissions.
 */
export async function getAdminToken(): Promise<{
  token: string;
  tenantId: string;
}> {
  if (cachedAdminAuth) return cachedAdminAuth;

  const auth = await loginViaApi('admin@teste.com', 'Teste@123');
  const tenantId = await getFirstTenantId(auth.token);
  const token = await selectTenantViaApi(auth.token, tenantId);
  cachedAdminAuth = { token, tenantId };
  return cachedAdminAuth;
}

// ─── Permission Group Management ─────────────────────────────────────

/**
 * Create a permission group with specific permission codes.
 */
export async function createPermissionGroup(
  token: string,
  name: string,
  permissionCodes: string[]
): Promise<string> {
  // 1. Create the group
  const createRes = await fetchWithRetry(
    `${API_URL}/v1/rbac/permission-groups`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        description: `E2E test group: ${name}`,
        priority: 200,
      }),
    }
  );

  if (!createRes.ok) {
    throw new Error(
      `Create group failed (${createRes.status}): ${await createRes.text()}`
    );
  }

  const { group } = await createRes.json();
  const groupId = group.id;

  // 2. Bulk-add permissions
  if (permissionCodes.length > 0) {
    const bulkRes = await fetchWithRetry(
      `${API_URL}/v1/rbac/permission-groups/${groupId}/permissions/bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          permissions: permissionCodes.map(code => ({
            permissionCode: code,
            effect: 'allow',
          })),
        }),
      }
    );

    if (!bulkRes.ok) {
      throw new Error(
        `Bulk add permissions failed (${bulkRes.status}): ${await bulkRes.text()}`
      );
    }
  }

  return groupId;
}

// ─── User Management ─────────────────────────────────────────────────

let userCounter = 0;

/**
 * Sleep helper for rate limit retries.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry on rate-limit (429/500 with rate limit message).
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 5
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, options);
    } catch (err) {
      // Connection refused / network error — wait and retry
      if (attempt < maxRetries) {
        await sleep((attempt + 1) * 3_000);
        continue;
      }
      throw err;
    }

    if (res.status === 429 || (res.status === 500 && attempt < maxRetries)) {
      const body = await res.text();
      if (res.status === 429 || body.includes('Rate limit')) {
        const match = body.match(/retry in (\d+)/);
        const waitMs = match
          ? (parseInt(match[1], 10) + 2) * 1_000
          : (attempt + 1) * 5_000;
        await sleep(waitMs);
        continue;
      }
      // Not a rate limit 500 — return as-is
      return new Response(body, { status: res.status, headers: res.headers });
    }

    return res;
  }

  throw new Error('Max retries exceeded for rate-limited request');
}

/**
 * Create a test user and assign them to a permission group.
 * Returns credentials for logging in.
 */
export async function createTestUser(
  token: string,
  groupId: string
): Promise<{
  email: string;
  password: string;
  userId: string;
  username: string;
}> {
  const counter = ++userCounter;
  // Username: max 20 chars, letters/numbers/underscore only (domain VO rule)
  const shortId = Date.now().toString(36) + counter.toString(36);
  const email = `e2e${shortId}@test.com`;
  const password = 'E2eTest@123';
  const username = `e2e_${shortId}`.slice(0, 20);

  // 1. Create user (automatically added to tenant)
  const createRes = await fetchWithRetry(`${API_URL}/v1/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email,
      password,
      username,
      profile: { name: 'E2E', surname: 'Storage Test' },
    }),
  });

  if (!createRes.ok) {
    throw new Error(
      `Create user failed (${createRes.status}): ${await createRes.text()}`
    );
  }

  const { user } = await createRes.json();
  const userId = user.id;

  // 2. Assign the custom permission group
  const assignRes = await fetchWithRetry(
    `${API_URL}/v1/rbac/users/${userId}/groups`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ groupId }),
    }
  );

  if (!assignRes.ok) {
    throw new Error(
      `Assign group failed (${assignRes.status}): ${await assignRes.text()}`
    );
  }

  return { email, password, userId, username };
}

/**
 * Create a user with specific storage permissions (high-level helper).
 * Creates a group, creates a user, assigns the group.
 */
export async function createUserWithPermissions(
  permissionCodes: string[],
  groupName?: string
): Promise<{
  email: string;
  password: string;
  userId: string;
  username: string;
  groupId: string;
  tenantId: string;
}> {
  const admin = await getAdminToken();
  const name = groupName ?? `e2e group ${Date.now().toString(36)}`;

  const groupId = await createPermissionGroup(
    admin.token,
    name,
    permissionCodes
  );
  const user = await createTestUser(admin.token, groupId);

  return {
    ...user,
    groupId,
    tenantId: admin.tenantId,
  };
}
