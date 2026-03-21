import type { Page } from '@playwright/test';
import { loginViaApi, injectAuthIntoBrowser } from './auth.helper';

export async function loginAsSuperAdmin(page: Page) {
  const auth = await loginViaApi('super@teste.com', 'Super@123');
  // For Central, we inject the initial token (no tenant selection needed)
  await injectAuthIntoBrowser(page, auth.token);
  return auth;
}

export async function navigateToCentral(page: Page, path = '/central') {
  const auth = await loginAsSuperAdmin(page);
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  return auth;
}
