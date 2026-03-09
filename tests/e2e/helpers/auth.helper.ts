import type { Page } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:3333';

export interface AuthTokens {
  token: string;
  refreshToken: string;
  userId: string;
}

/**
 * Sleep helper.
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

    if (res.ok) return res;

    // Check if it's a rate limit response
    if (res.status === 429 || res.status === 500) {
      const body = await res.text();
      if (body.includes('Rate limit') || res.status === 429) {
        // Extract wait time from message if available
        const match = body.match(/retry in (\d+)/);
        const waitSec = match ? parseInt(match[1], 10) + 2 : (attempt + 1) * 8;
        await sleep(waitSec * 1_000);
        continue;
      }
      // Not a rate limit — return the error response
      return new Response(body, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    }

    return res;
  }

  throw new Error(`Max retries exceeded for ${url}`);
}

/**
 * Login via API and return tokens (no tenant selected yet).
 */
export async function loginViaApi(
  email: string,
  password: string
): Promise<AuthTokens> {
  const res = await fetchWithRetry(`${API_URL}/v1/auth/login/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Login failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return {
    token: data.token,
    refreshToken: data.refreshToken,
    userId: data.user.id,
  };
}

/**
 * Select a tenant via API and return tenant-scoped token.
 */
export async function selectTenantViaApi(
  token: string,
  tenantId: string
): Promise<string> {
  const res = await fetchWithRetry(`${API_URL}/v1/auth/select-tenant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tenantId }),
  });

  if (!res.ok) {
    throw new Error(
      `Select tenant failed (${res.status}): ${await res.text()}`
    );
  }

  const data = await res.json();
  return data.token;
}

/**
 * List tenants for the authenticated user and return the first one's ID.
 */
export async function getFirstTenantId(token: string): Promise<string> {
  const res = await fetchWithRetry(`${API_URL}/v1/auth/tenants`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`List tenants failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const tenants = data.tenants ?? data.data ?? data;

  if (!Array.isArray(tenants) || tenants.length === 0) {
    throw new Error('User has no tenants');
  }

  return tenants[0].id ?? tenants[0].tenantId;
}

/**
 * Full login flow: authenticate → get tenant → select tenant → return scoped token.
 */
export async function getAuthenticatedToken(
  email: string,
  password: string
): Promise<{ token: string; userId: string; tenantId: string }> {
  const auth = await loginViaApi(email, password);
  const tenantId = await getFirstTenantId(auth.token);
  const token = await selectTenantViaApi(auth.token, tenantId);
  return { token, userId: auth.userId, tenantId };
}

/**
 * Inject auth state into the browser so the frontend recognizes the user as logged in.
 * This sets localStorage values that auth-context.tsx reads on mount.
 */
export async function injectAuthIntoBrowser(
  page: Page,
  token: string,
  tenantId?: string
): Promise<void> {
  await page.goto('/');

  await page.evaluate(
    ({ token, tenantId }) => {
      localStorage.setItem('auth_token', token);
      if (tenantId) {
        localStorage.setItem('selected_tenant_id', tenantId);
      }
    },
    { token, tenantId }
  );
}

/**
 * Full browser login: authenticate via API, inject token, navigate to file manager.
 */
export async function loginAndNavigate(
  page: Page,
  email: string,
  password: string,
  path = '/file-manager'
): Promise<{ token: string; userId: string; tenantId: string }> {
  const result = await getAuthenticatedToken(email, password);
  await injectAuthIntoBrowser(page, result.token, result.tenantId);
  await page.goto(path);
  return result;
}

// Re-export API_URL for other helpers
export { API_URL };
