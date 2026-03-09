import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  TASKS_FULL_PERMISSIONS,
  createTasksUser,
} from '../helpers/tasks-permissions.helper';
import {
  createBoardViaApi,
  createCardViaApi,
  deleteBoardViaApi,
  navigateToBoard,
  waitForToast,
} from '../helpers/tasks.helper';

let userToken: string;
let userTenantId: string;
let boardId: string;

test.beforeAll(async () => {
  const user = await createTasksUser(
    TASKS_FULL_PERMISSIONS,
    `e2e-tasks-cards-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  const board = await createBoardViaApi(userToken, {
    title: `e2e-cards-board-${Date.now()}`,
  });
  boardId = board.id;
});

test.afterAll(async () => {
  await deleteBoardViaApi(userToken, boardId);
});

test.describe('Tasks - CRUD de Cartões', () => {
  test('Criar cartão via dialog', async ({ page }) => {
    const title = `e2e-card-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    // Click add card button (+ icon in a column)
    const addButton = page
      .locator(
        'button:has-text("Adicionar"), button[aria-label*="adicionar"], button:has-text("Nova tarefa")'
      )
      .first();
    await addButton.click();

    // Fill title in dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5_000,
    });
    await page
      .locator('[role="dialog"] input[type="text"]')
      .first()
      .fill(title);

    // Submit
    await page.locator('[role="dialog"] button:has-text("Criar")').click();
    await waitForToast(page, 'Cartão criado');

    // Card should appear in the kanban
    await expect(page.locator(`text="${title}"`)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Abrir modal de detalhes do cartão', async ({ page }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-detail-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    // Click on the card
    await page.locator(`text="${card.title}"`).first().click();

    // Detail modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.locator(`[role="dialog"] :text("${card.title}")`)
    ).toBeVisible();
  });

  test('Editar título do cartão no modal', async ({ page }) => {
    const oldTitle = `e2e-edit-card-${Date.now()}`;
    const newTitle = `e2e-renamed-card-${Date.now()}`;

    await createCardViaApi(userToken, boardId, { title: oldTitle });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    // Open card detail
    await page.locator(`text="${oldTitle}"`).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5_000,
    });

    // Edit title (click on title text to enable editing)
    const titleElement = page
      .locator('[role="dialog"] input, [role="dialog"] [contenteditable]')
      .first();
    await titleElement.click();
    await titleElement.fill(newTitle);

    // Tab out or click away to save
    await titleElement.press('Tab');
    await page.waitForTimeout(1_000);

    // Verify the title was updated
    await expect(
      page.locator(`[role="dialog"] :text("${newTitle}")`)
    ).toBeVisible({ timeout: 5_000 });
  });
});
