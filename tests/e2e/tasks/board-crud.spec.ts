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
  deleteBoardViaApi,
  navigateToTasks,
  navigateToBoard,
  waitForToast,
} from '../helpers/tasks.helper';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const user = await createTasksUser(
    TASKS_FULL_PERMISSIONS,
    `e2e-tasks-crud-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('Tasks - CRUD de Quadros', () => {
  test('Criar quadro via dialog', async ({ page }) => {
    const title = `e2e-board-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTasks(page);

    // Click "Novo Quadro" button
    await page.locator('button:has-text("Novo Quadro")').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5_000,
    });

    // Fill title
    await page
      .locator('[role="dialog"] input[type="text"]')
      .first()
      .fill(title);

    // Submit
    await page.locator('[role="dialog"] button:has-text("Criar")').click();

    // Should navigate to the new board or show success
    await page.waitForURL(/\/tasks\//, { timeout: 10_000 });
  });

  test('Visualizar quadro com colunas padrão', async ({ page }) => {
    const board = await createBoardViaApi(userToken, {
      title: `e2e-view-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, board.id);

    // Board title should be visible
    await expect(page.locator(`text="${board.title}"`)).toBeVisible({
      timeout: 10_000,
    });

    // Default columns should be visible (kanban view)
    await expect(
      page
        .locator(
          '[data-testid="kanban-column"], .kanban-column, [class*="kanban"]'
        )
        .first()
    ).toBeVisible({
      timeout: 10_000,
    });

    await deleteBoardViaApi(userToken, board.id);
  });

  test('Editar nome do quadro via configurações', async ({ page }) => {
    const oldTitle = `e2e-edit-old-${Date.now()}`;
    const newTitle = `e2e-edit-new-${Date.now()}`;

    const board = await createBoardViaApi(userToken, { title: oldTitle });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, board.id);

    // Open settings
    await page.locator('button:has-text("Configurações")').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5_000,
    });

    // Change title
    const nameInput = page.locator('[role="dialog"] #settings-name');
    await nameInput.clear();
    await nameInput.fill(newTitle);

    // Save
    await page.locator('[role="dialog"] button:has-text("Salvar")').click();
    await waitForToast(page, 'Quadro atualizado com sucesso');

    await deleteBoardViaApi(userToken, board.id);
  });

  test('Listar quadros na página inicial', async ({ page }) => {
    const board = await createBoardViaApi(userToken, {
      title: `e2e-list-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTasks(page);

    // Board should appear in the list
    await expect(page.locator(`text="${board.title}"`)).toBeVisible({
      timeout: 10_000,
    });

    await deleteBoardViaApi(userToken, board.id);
  });
});
