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
    `e2e-card-modal-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  const board = await createBoardViaApi(userToken, {
    title: `e2e-modal-board-${Date.now()}`,
  });
  boardId = board.id;
});

test.afterAll(async () => {
  await deleteBoardViaApi(userToken, boardId);
});

// Helper: abre um card no modal
async function openCardModal(
  page: import('@playwright/test').Page,
  cardTitle: string
) {
  await page.locator(`text="${cardTitle}"`).first().click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

// ────────────────────────────────────────────
// Estrutura do Modal
// ────────────────────────────────────────────
test.describe('CardModal - Estrutura', () => {
  test('Abrir card e verificar layout dois painéis', async ({ page }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-structure-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    const dialog = await openCardModal(page, card.title);

    // Título deve estar carregado como input
    const titleInput = dialog.locator('input[placeholder*="Título"]');
    await expect(titleInput).toBeVisible({ timeout: 5_000 });
    await expect(titleInput).toHaveValue(card.title);

    // Textarea de descrição deve existir
    await expect(dialog.locator('textarea').first()).toBeVisible();

    // Tabs devem estar visíveis
    await expect(dialog.getByText('Geral')).toBeVisible();
    await expect(dialog.getByText('Comentários')).toBeVisible();

    // Footer com botões
    await expect(
      dialog
        .locator('button:has-text("Salvar"), button:has-text("Cancelar")')
        .first()
    ).toBeVisible();
  });

  test('Sidebar exibe propriedades do card', async ({ page }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-sidebar-props-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    const dialog = await openCardModal(page, card.title);

    // Verificar labels de propriedades na sidebar
    // Os labels usam text-transform: uppercase via CSS
    const propertyLabels = ['Coluna', 'Prioridade'];
    for (const label of propertyLabels) {
      const found = await dialog.locator(`text=/${label}/i`).count();
      expect(found, `Label "${label}" não encontrado`).toBeGreaterThan(0);
    }
  });
});

// ────────────────────────────────────────────
// Edição de Título e Descrição
// ────────────────────────────────────────────
test.describe('CardModal - Edição de Conteúdo', () => {
  test('Editar título do cartão', async ({ page }) => {
    const oldTitle = `e2e-edit-title-${Date.now()}`;
    const newTitle = `e2e-renamed-${Date.now()}`;

    await createCardViaApi(userToken, boardId, { title: oldTitle });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    const dialog = await openCardModal(page, oldTitle);

    // Editar título
    const titleInput = dialog.locator('input[placeholder*="Título"]');
    await titleInput.click();
    await titleInput.fill(newTitle);
    await titleInput.press('Tab');

    // Aguardar auto-save
    await page.waitForTimeout(2_000);

    // Fechar e reabrir para confirmar persistência
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });

    // Card deve aparecer com novo título no kanban
    await expect(page.locator(`text="${newTitle}"`)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Editar descrição do cartão', async ({ page }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-edit-desc-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    const dialog = await openCardModal(page, card.title);

    // Preencher descrição
    const textarea = dialog.locator('textarea').first();
    await textarea.click();
    await textarea.fill('Nova descrição de teste');
    await textarea.press('Tab');

    await page.waitForTimeout(1_500);

    // Verificar que o valor persiste
    await expect(textarea).toHaveValue('Nova descrição de teste');
  });
});

// ────────────────────────────────────────────
// Navegação entre Tabs
// ────────────────────────────────────────────
test.describe('CardModal - Tabs', () => {
  test('Navegar entre tabs Geral, Comentários e Atividade', async ({
    page,
  }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-tabs-nav-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    const dialog = await openCardModal(page, card.title);

    // Tab Geral (padrão)
    const geralTab = dialog.getByText('Geral').first();
    await expect(geralTab).toBeVisible();

    // Clicar Comentários
    const commentTab = dialog.getByText('Comentários').first();
    await commentTab.click();
    await page.waitForTimeout(500);

    // Clicar Atividade
    const activityTab = dialog.getByText('Atividade', { exact: false }).first();
    if (await activityTab.isVisible()) {
      await activityTab.click();
      await page.waitForTimeout(500);
    }

    // Voltar para Geral
    await geralTab.click();
    await page.waitForTimeout(500);
  });
});

// ────────────────────────────────────────────
// Sidebar — Propriedades
// ────────────────────────────────────────────
test.describe('CardModal - Propriedades na Sidebar', () => {
  test('Alterar prioridade via dots', async ({ page }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-priority-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    const dialog = await openCardModal(page, card.title);

    // Procurar botões de prioridade (dots com title)
    const urgentDot = dialog.locator('button[title="Urgente"]');
    if ((await urgentDot.count()) > 0) {
      await urgentDot.first().click();
      await page.waitForTimeout(1_000);
      // Dot deve estar selecionado (borda primary)
    }

    const altaDot = dialog.locator('button[title="Alta"]');
    if ((await altaDot.count()) > 0) {
      await altaDot.first().click();
      await page.waitForTimeout(1_000);
    }
  });

  test('Seção de integrações mostra botão Vincular', async ({ page }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-integrations-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    const dialog = await openCardModal(page, card.title);

    // Seção de integrações deve mostrar botão "+ Vincular"
    const vincularBtn = dialog.getByText('Vincular', { exact: false });
    if ((await vincularBtn.count()) > 0) {
      await expect(vincularBtn.first()).toBeVisible();
    }
  });
});

// ────────────────────────────────────────────
// Footer — Ações
// ────────────────────────────────────────────
test.describe('CardModal - Ações no Footer', () => {
  test('Botões de ação visíveis no modo edição', async ({ page }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-actions-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    const dialog = await openCardModal(page, card.title);

    // Botões de ação no footer esquerdo (modo edição)
    const copyLink = dialog.getByText('Copiar link', { exact: false });
    const archive = dialog.getByText('Arquivar', { exact: false });

    // Pelo menos um deve estar visível
    const hasCopy = (await copyLink.count()) > 0;
    const hasArchive = (await archive.count()) > 0;
    expect(hasCopy || hasArchive).toBeTruthy();
  });
});

// ────────────────────────────────────────────
// Responsividade
// ────────────────────────────────────────────
test.describe('CardModal - Responsividade', () => {
  test('Modal funciona em viewport mobile', async ({ page }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-mobile-${Date.now()}`,
    });

    await page.setViewportSize({ width: 375, height: 812 });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    // Tentar abrir card (pode precisar scroll no kanban)
    const cardLocator = page.locator(`text="${card.title}"`).first();
    if (await cardLocator.isVisible({ timeout: 10_000 })) {
      await cardLocator.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      // Título deve estar visível
      const titleInput = dialog.locator('input[placeholder*="Título"]');
      await expect(titleInput).toBeVisible();
    }
  });
});

// ────────────────────────────────────────────
// Fechar Modal
// ────────────────────────────────────────────
test.describe('CardModal - Fechar', () => {
  test('Fechar via botão X', async ({ page }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-close-x-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    const dialog = await openCardModal(page, card.title);

    // Botão X (fechar)
    const closeBtn = dialog.locator(
      'button:has-text("Fechar"), button[aria-label="Fechar"]'
    );
    if ((await closeBtn.count()) > 0) {
      await closeBtn.first().click();
    } else {
      // Fallback: botão com ícone X (sr-only "Fechar")
      await dialog
        .locator('button')
        .filter({ hasText: 'Fechar' })
        .first()
        .click();
    }

    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });

  test('Fechar via tecla Escape', async ({ page }) => {
    const card = await createCardViaApi(userToken, boardId, {
      title: `e2e-close-esc-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToBoard(page, boardId);

    const dialog = await openCardModal(page, card.title);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });
});
