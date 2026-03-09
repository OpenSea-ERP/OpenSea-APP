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
} from '../helpers/tasks.helper';

let userToken: string;
let userTenantId: string;
let boardId: string;

test.beforeAll(async () => {
  const user = await createTasksUser(
    TASKS_FULL_PERMISSIONS,
    `e2e-tasks-kanban-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  const board = await createBoardViaApi(userToken, {
    title: `e2e-kanban-board-${Date.now()}`,
  });
  boardId = board.id;
});

test.afterAll(async () => {
  await deleteBoardViaApi(userToken, boardId);
});

test.describe('Tasks - Kanban View', () => {
  test('Exibir colunas padrão no kanban', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    // Default columns should be visible (A Fazer, Em Andamento, Concluído)
    await expect(page.locator('text="A Fazer"').first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('text="Em Andamento"').first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('text="Concluído"').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Exibir cartões dentro das colunas', async ({ page }) => {
    const cardTitle = `e2e-kanban-card-${Date.now()}`;
    await createCardViaApi(userToken, boardId, { title: cardTitle });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    // Card should appear inside a column
    await expect(page.locator(`text="${cardTitle}"`)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Buscar cartões pelo campo de pesquisa', async ({ page }) => {
    const searchTarget = `e2e-search-target-${Date.now()}`;
    const otherCard = `e2e-other-card-${Date.now()}`;

    await createCardViaApi(userToken, boardId, { title: searchTarget });
    await createCardViaApi(userToken, boardId, { title: otherCard });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    // Wait for both cards to be visible
    await expect(page.locator(`text="${searchTarget}"`)).toBeVisible({
      timeout: 10_000,
    });

    // Use search
    await page.locator('input[placeholder*="Buscar"]').fill(searchTarget);

    // Target should remain visible
    await expect(page.locator(`text="${searchTarget}"`)).toBeVisible();

    // Other card should be filtered out
    await expect(page.locator(`text="${otherCard}"`)).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test('Alternar entre visualizações', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    // Should start on kanban view (default)
    await page.waitForLoadState('networkidle');

    // Switch to list view
    const listButton = page
      .locator('a[href*="view=lista"], button:has-text("Lista")')
      .first();
    await listButton.click();
    await page.waitForURL(/view=lista/, { timeout: 5_000 });

    // Switch to table view
    const tableButton = page
      .locator('a[href*="view=tabela"], button:has-text("Tabela")')
      .first();
    await tableButton.click();
    await page.waitForURL(/view=tabela/, { timeout: 5_000 });
  });
});
