import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { API_URL } from './auth.helper';

export interface CreateBoardPayload {
  title: string;
  description?: string | null;
  visibility?: 'PRIVATE' | 'SHARED';
}

export interface CreateCardPayload {
  title: string;
  columnId?: string;
  description?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

/**
 * Create a board via API and return its data.
 */
export async function createBoardViaApi(
  token: string,
  payload: CreateBoardPayload
): Promise<{
  id: string;
  title: string;
  columns: Array<{ id: string; title: string }>;
}> {
  const res = await fetch(`${API_URL}/v1/tasks/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Create board failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const board = data.board ?? data;
  return {
    id: board.id,
    title: board.title,
    columns: board.columns ?? [],
  };
}

/**
 * Create a card via API.
 */
export async function createCardViaApi(
  token: string,
  boardId: string,
  payload: CreateCardPayload
): Promise<{ id: string; title: string }> {
  const res = await fetch(`${API_URL}/v1/tasks/boards/${boardId}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Create card failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const card = data.card ?? data;
  return { id: card.id, title: card.title };
}

/**
 * Delete a board via API (cleanup).
 */
export async function deleteBoardViaApi(
  token: string,
  boardId: string
): Promise<void> {
  await fetch(`${API_URL}/v1/tasks/boards/${boardId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Navigate to the tasks boards listing page.
 */
export async function navigateToTasks(page: Page): Promise<void> {
  await page.goto('/tasks');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to a specific board page.
 */
export async function navigateToBoard(
  page: Page,
  boardId: string
): Promise<void> {
  await page.goto(`/tasks/${boardId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for a toast message to appear.
 */
export async function waitForToast(page: Page, text: string): Promise<void> {
  await expect(
    page.locator(`[data-sonner-toast] :text-matches("${text}", "i")`).first()
  ).toBeVisible({ timeout: 10_000 });
}
