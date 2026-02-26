import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { API_URL } from './auth.helper';

// ─── API Helpers ─────────────────────────────────────────────────────

export interface CreateTeamPayload {
  name: string;
  description?: string | null;
  color?: string | null;
}

export async function createTeamViaApi(
  token: string,
  payload: CreateTeamPayload
): Promise<{ id: string; name: string; slug: string }> {
  const res = await fetch(`${API_URL}/v1/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Create team failed (${res.status}): ${await res.text()}`
    );
  }

  const data = await res.json();
  const team = data.team ?? data;
  return { id: team.id, name: team.name, slug: team.slug };
}

export async function deleteTeamViaApi(
  token: string,
  teamId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/teams/${teamId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `Delete team failed (${res.status}): ${await res.text()}`
    );
  }
}

export async function updateTeamViaApi(
  token: string,
  teamId: string,
  data: Partial<CreateTeamPayload>
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/teams/${teamId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(
      `Update team failed (${res.status}): ${await res.text()}`
    );
  }
}

export async function addTeamMemberViaApi(
  token: string,
  teamId: string,
  userId: string,
  role?: 'ADMIN' | 'MEMBER'
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/teams/${teamId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, role: role ?? 'MEMBER' }),
  });

  if (!res.ok) {
    throw new Error(
      `Add member failed (${res.status}): ${await res.text()}`
    );
  }
}

export async function listTeamMembersViaApi(
  token: string,
  teamId: string
): Promise<Array<{ id: string; userId: string; role: string; userName: string | null }>> {
  const res = await fetch(`${API_URL}/v1/teams/${teamId}/members?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `List members failed (${res.status}): ${await res.text()}`
    );
  }

  const data = await res.json();
  return data.data ?? [];
}

// ─── UI Helpers ──────────────────────────────────────────────────────

export async function navigateToTeams(page: Page): Promise<void> {
  await page.goto('/admin/teams');
  await expect(page.locator('h1:has-text("Equipes"), h2:has-text("Equipes")')).toBeVisible({
    timeout: 15_000,
  });
}

export async function navigateToTeamDetail(
  page: Page,
  teamId: string
): Promise<void> {
  await page.goto(`/admin/teams/${teamId}`);
  await expect(page.locator('[data-slot="tabs-list"], [role="tablist"]')).toBeVisible({
    timeout: 15_000,
  });
}

export async function waitForToast(
  page: Page,
  text: string,
  timeout = 10_000
) {
  const toast = page.locator(`[data-sonner-toast] :text("${text}")`).first();
  await expect(toast).toBeVisible({ timeout });
  return toast;
}

export async function createTeamViaUi(
  page: Page,
  name: string,
  options?: { description?: string; colorIndex?: number }
): Promise<void> {
  // Click "Nova Equipe" button
  await page.locator('button:has-text("Nova Equipe")').click();
  await expect(page.locator('text=Nova Equipe').first()).toBeVisible({ timeout: 5_000 });

  // Fill name
  await page.locator('#team-name').fill(name);

  // Fill description if provided
  if (options?.description) {
    await page.locator('#team-description').fill(options.description);
  }

  // Select color if provided (click the Nth color circle)
  if (options?.colorIndex !== undefined) {
    const colorButtons = page.locator('button.rounded-full[style*="background-color"]');
    await colorButtons.nth(options.colorIndex).click();
  }

  // Submit
  await page.locator('button:has-text("Criar Equipe")').click();
}

export async function enterActionPin(page: Page, pin: string): Promise<void> {
  const otpInput = page.locator('[data-input-otp="true"]').first();
  await expect(otpInput).toBeVisible({ timeout: 5_000 });
  await otpInput.focus();
  await page.keyboard.type(pin, { delay: 50 });
  await page.waitForTimeout(300);
}
