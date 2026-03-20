import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  TEMPLATES_FULL_PERMISSIONS,
  createStockUser,
} from '../helpers/stock-permissions.helper';
import {
  createTemplateViaApi,
  deleteTemplateViaApi,
  navigateToStockPage,
  waitForToast,
  openContextMenu,
  clickContextAction,
} from '../helpers/stock.helper';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const user = await createStockUser(
    TEMPLATES_FULL_PERMISSIONS,
    `e2e-stock-tpl-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('Stock - Templates CRUD', () => {
  // ─── LIST ───────────────────────────────────────────────────────────

  test('4.1 - Listar templates e verificar hidratação', async ({ page }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-list-${Date.now()}`,
      unitOfMeasure: 'UNITS',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToStockPage(page, 'templates');

    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.getByText(tpl.name).first()).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.getByText(/Total de \d+ templates?/)).toBeVisible();

    await deleteTemplateViaApi(userToken, tpl.id);
  });

  test('4.2 - Buscar template por nome', async ({ page }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-search-${Date.now()}`,
      unitOfMeasure: 'METERS',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToStockPage(page, 'templates');

    const searchInput = page.getByPlaceholder(/Buscar/i);
    await searchInput.fill(tpl.name);
    await page.waitForTimeout(500);

    await expect(page.getByText(tpl.name).first()).toBeVisible({
      timeout: 5_000,
    });

    await deleteTemplateViaApi(userToken, tpl.id);
  });

  test('4.3 - Alternar entre visualização grid e lista', async ({ page }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-toggle-${Date.now()}`,
      unitOfMeasure: 'KILOGRAMS',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToStockPage(page, 'templates');

    await expect(page.getByText(tpl.name).first()).toBeVisible({
      timeout: 10_000,
    });

    const listBtn = page.getByRole('button', {
      name: 'Visualização em lista',
    });
    if (await listBtn.isVisible().catch(() => false)) {
      await listBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByText(tpl.name).first()).toBeVisible({
        timeout: 5_000,
      });
    }

    const gridBtn = page.getByRole('button', {
      name: 'Visualização em grade',
    });
    if (await gridBtn.isVisible().catch(() => false)) {
      await gridBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByText(tpl.name).first()).toBeVisible({
        timeout: 5_000,
      });
    }

    await deleteTemplateViaApi(userToken, tpl.id);
  });

  // ─── CONTEXT MENU — VISUALIZAR ────────────────────────────────────

  test.fixme(
    '4.4 - Visualizar template via context menu navega para detalhe',
    async ({ page }) => {
      const tpl = await createTemplateViaApi(userToken, {
        name: `e2e-tpl-view-${Date.now()}`,
        unitOfMeasure: 'KILOGRAMS',
      });

      await injectAuthIntoBrowser(page, userToken, userTenantId);
      await navigateToStockPage(page, 'templates');

      await openContextMenu(page, tpl.name);
      await clickContextAction(page, 'Visualizar');

      await page.waitForURL(`**/stock/templates/${tpl.id}`, {
        timeout: 10_000,
      });
      await expect(
        page.getByRole('heading', { level: 1, name: tpl.name })
      ).toBeVisible({ timeout: 10_000 });

      await deleteTemplateViaApi(userToken, tpl.id);
    }
  );

  // ─── CONTEXT MENU — EDITAR ────────────────────────────────────────

  test.fixme(
    '4.5 - Editar template via context menu navega para página de edição',
    async ({ page }) => {
      const tpl = await createTemplateViaApi(userToken, {
        name: `e2e-tpl-edit-${Date.now()}`,
        unitOfMeasure: 'UNITS',
      });

      await injectAuthIntoBrowser(page, userToken, userTenantId);
      await navigateToStockPage(page, 'templates');

      await openContextMenu(page, tpl.name);
      await clickContextAction(page, 'Editar');

      await page.waitForURL(`**/stock/templates/${tpl.id}/edit`, {
        timeout: 10_000,
      });
      await expect(page.getByText('Informações Gerais')).toBeVisible({
        timeout: 10_000,
      });

      await deleteTemplateViaApi(userToken, tpl.id);
    }
  );

  // ─── CONTEXT MENU — RENOMEAR ──────────────────────────────────────

  test.fixme('4.6 - Renomear template via context menu', async ({ page }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-rename-${Date.now()}`,
      unitOfMeasure: 'UNITS',
    });
    const newName = `e2e-tpl-renamed-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToStockPage(page, 'templates');

    await openContextMenu(page, tpl.name);
    await clickContextAction(page, 'Renomear');

    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5_000,
    });

    const nameInput = page
      .locator('[role="dialog"] input[type="text"]')
      .first();
    await nameInput.clear();
    await nameInput.fill(newName);

    await page
      .locator('[role="dialog"]')
      .getByRole('button', { name: 'Salvar' })
      .click();
    await page.waitForTimeout(1_000);

    const searchInput = page.getByPlaceholder(/Buscar/i);
    await searchInput.fill(newName);
    await page.waitForTimeout(500);

    await expect(page.getByText(newName).first()).toBeVisible({
      timeout: 10_000,
    });

    await deleteTemplateViaApi(userToken, tpl.id);
  });

  // ─── CONTEXT MENU — DUPLICAR ──────────────────────────────────────

  test('4.7 - Duplicar template via context menu', async ({ page }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-dup-${Date.now()}`,
      unitOfMeasure: 'UNITS',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToStockPage(page, 'templates');

    await openContextMenu(page, tpl.name);
    await clickContextAction(page, 'Duplicar');

    const confirmBtn = page
      .locator('[role="alertdialog"] button, [role="dialog"] button')
      .filter({ hasText: /Confirmar|Duplicar/i })
      .first();

    if (await confirmBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirmBtn.click();
      await waitForToast(page, 'sucesso');
    }

    await expect(page.getByText(`${tpl.name} (cópia)`).first()).toBeVisible({
      timeout: 10_000,
    });

    await deleteTemplateViaApi(userToken, tpl.id);
  });

  // ─── CONTEXT MENU — EXCLUIR ───────────────────────────────────────

  test.fixme('4.8 - Excluir template via context menu', async ({ page }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-delete-${Date.now()}`,
      unitOfMeasure: 'UNITS',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToStockPage(page, 'templates');

    await openContextMenu(page, tpl.name);
    await clickContextAction(page, 'Excluir');

    const otpInput = page.locator('[data-input-otp="true"]').first();
    const deleteBtn = page
      .locator('[role="alertdialog"] button, [role="dialog"] button')
      .filter({ hasText: /Excluir|Confirmar/i })
      .first();

    await Promise.race([
      otpInput.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {}),
      deleteBtn.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {}),
    ]);

    if (await otpInput.isVisible().catch(() => false)) {
      await otpInput.fill('1234');
      await page.waitForTimeout(500);
    } else if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
    }

    await waitForToast(page, 'sucesso');
    await expect(page.getByText(tpl.name)).not.toBeVisible({
      timeout: 5_000,
    });
  });

  // ─── DETAIL PAGE ──────────────────────────────────────────────────

  test('4.9 - Página de detalhe exibe seções e metadados', async ({ page }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-detail-${Date.now()}`,
      unitOfMeasure: 'KILOGRAMS',
      specialModules: ['CARE_INSTRUCTIONS'],
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await page.goto(`/stock/templates/${tpl.id}`);
    await page.waitForLoadState('networkidle');

    // Identity card com nome
    await expect(
      page.getByRole('heading', { level: 1, name: tpl.name })
    ).toBeVisible({ timeout: 10_000 });

    // Unidade de medida (sigla)
    await expect(page.getByText('kg').first()).toBeVisible();

    // Módulos especiais com Conservação Têxtil ativada
    await expect(
      page.getByRole('heading', { name: 'Módulos Especiais' })
    ).toBeVisible();
    await expect(page.getByText('Conservação Têxtil').first()).toBeVisible();

    // Seção Atributos
    await expect(
      page.getByRole('heading', { name: /^Atributos$/ })
    ).toBeVisible();

    // Tabs
    await expect(page.getByRole('tab', { name: /Produtos/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Variantes/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Itens/i })).toBeVisible();

    // Data de criação
    await expect(page.getByText(/Criado em/).first()).toBeVisible();

    await deleteTemplateViaApi(userToken, tpl.id);
  });

  test('4.10 - Botão Editar na página de detalhe navega para edição', async ({
    page,
  }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-detail-edit-${Date.now()}`,
      unitOfMeasure: 'METERS',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await page.goto(`/stock/templates/${tpl.id}`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { level: 1, name: tpl.name })
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Editar' }).click();
    await page.waitForURL(`**/stock/templates/${tpl.id}/edit`, {
      timeout: 10_000,
    });

    await expect(page.getByText('Informações Gerais')).toBeVisible({
      timeout: 10_000,
    });

    await deleteTemplateViaApi(userToken, tpl.id);
  });

  // ─── EDIT PAGE ────────────────────────────────────────────────────

  test('4.11 - Editar nome do template e salvar', async ({ page }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-save-${Date.now()}`,
      unitOfMeasure: 'UNITS',
    });
    const newName = `e2e-tpl-saved-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await page.goto(`/stock/templates/${tpl.id}/edit`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Informações Gerais')).toBeVisible({
      timeout: 10_000,
    });

    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.clear();
    await nameInput.fill(newName);

    await page.getByRole('button', { name: /Salvar/i }).click();
    await waitForToast(page, 'sucesso');

    await page.waitForURL(`**/stock/templates/${tpl.id}`, { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { level: 1, name: newName })
    ).toBeVisible({ timeout: 10_000 });

    await deleteTemplateViaApi(userToken, tpl.id);
  });

  test('4.12 - Seções colapsáveis na página de edição', async ({ page }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-collapse-${Date.now()}`,
      unitOfMeasure: 'UNITS',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await page.goto(`/stock/templates/${tpl.id}/edit`);
    await page.waitForLoadState('networkidle');

    const infoHeader = page.getByText('Informações Gerais');
    await expect(infoHeader).toBeVisible({ timeout: 10_000 });

    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    // Colapsar
    await infoHeader.click();
    await page.waitForTimeout(300);
    await expect(nameInput).not.toBeVisible();

    // Expandir
    await infoHeader.click();
    await page.waitForTimeout(300);
    await expect(nameInput).toBeVisible();

    await deleteTemplateViaApi(userToken, tpl.id);
  });

  // ─── DETAIL PAGE — VER PRODUTOS ───────────────────────────────────

  test('4.13 - Chip de nenhum produto quando não há produtos', async ({
    page,
  }) => {
    const tpl = await createTemplateViaApi(userToken, {
      name: `e2e-tpl-products-${Date.now()}`,
      unitOfMeasure: 'UNITS',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await page.goto(`/stock/templates/${tpl.id}`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { level: 1, name: tpl.name })
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText('Nenhum produto utiliza este template')
    ).toBeVisible({ timeout: 10_000 });

    await deleteTemplateViaApi(userToken, tpl.id);
  });

  // ─── ERROR STATES ─────────────────────────────────────────────────

  test('4.14 - Página de detalhe com ID inválido mostra erro', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await page.goto('/stock/templates/invalid-id-that-does-not-exist');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Template não encontrado')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('4.15 - Página de edição com ID inválido mostra erro', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await page.goto('/stock/templates/invalid-id-that-does-not-exist/edit');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Template não encontrado')).toBeVisible({
      timeout: 15_000,
    });
  });
});
