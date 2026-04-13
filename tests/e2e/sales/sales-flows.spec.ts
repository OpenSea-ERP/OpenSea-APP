/**
 * Sales Module — E2E CRUD Flow Tests
 *
 * Testa fluxos completos de criação, visualização, edição e exclusão
 * para as principais entidades do módulo Sales via interface do navegador.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
  API_URL,
} from '../helpers/auth.helper';

const TEST_PIN = '1234';

let authToken: string;
let tenantId: string;

test.beforeAll(async () => {
  const auth = await getAuthenticatedToken('admin@teste.com', 'Teste@123');
  authToken = auth.token;
  tenantId = auth.tenantId;

  // Configurar PIN de ação para operações destrutivas
  await fetch(`${API_URL}/v1/auth/action-pin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ password: 'Teste@123', pin: TEST_PIN }),
  });
});

/**
 * Injeta autenticação e navega até o caminho fornecido.
 */
async function setup(page: Page, path = '/sales'): Promise<void> {
  await injectAuthIntoBrowser(page, authToken, tenantId);
  await page.goto(path, { waitUntil: 'networkidle', timeout: 15000 });
}

// ─── Payment Conditions CRUD ──────────────────────────────────

test.describe('Condições de Pagamento - CRUD', () => {
  const uniqueName = `E2E-PC-${Date.now()}`;

  test('Criar condição de pagamento via wizard', async ({ page }) => {
    await setup(page, '/sales/payment-conditions');

    // Clicar no botão de criar
    await page
      .locator(
        '[data-testid="payment-conditions-create-btn"], button:has-text("Nova Condição")'
      )
      .first()
      .click();

    // Preencher wizard etapa 1
    await page
      .locator(
        '[data-testid="payment-condition-create-name"], input[placeholder*="30/60/90"]'
      )
      .first()
      .fill(uniqueName);

    // Avançar para etapa 2
    await page
      .locator(
        'button:has-text("Próximo"), button:has-text("Continuar"), button:has-text("Avançar")'
      )
      .first()
      .click();
    await page.waitForTimeout(500);

    // Submeter na etapa 2
    await page
      .locator(
        '[data-testid="payment-condition-create-submit"], button:has-text("Criar Condição"), button:has-text("Criar")'
      )
      .first()
      .click();

    // Verificar toast de sucesso
    await expect(page.locator('text=sucesso')).toBeVisible({ timeout: 10000 });

    // Verificar que o item aparece na listagem
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({
      timeout: 10000,
    });
  });

  test('Visualizar detalhe da condição de pagamento', async ({ page }) => {
    await setup(page, '/sales/payment-conditions');
    await page.waitForTimeout(2000);

    // Clicar no item criado
    await page.locator(`text=${uniqueName}`).first().click();
    await page.waitForURL('**/payment-conditions/**', { timeout: 10000 });

    // Verificar que a página de detalhe carregou
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible();
    await expect(page.locator('text=Informações Gerais')).toBeVisible({
      timeout: 5000,
    });
  });

  test('Excluir condição de pagamento com PIN', async ({ page }) => {
    await setup(page, '/sales/payment-conditions');
    await page.waitForTimeout(2000);

    // Localizar e clicar no botão de excluir (hover para revelar)
    const card = page
      .locator('[data-testid^="payment-condition-card"]')
      .filter({ hasText: uniqueName })
      .first();
    await card.hover();
    await card
      .locator(
        '[data-testid^="payment-condition-delete"], button:has(.lucide-trash-2)'
      )
      .first()
      .click();

    // Modal de PIN deve aparecer
    await expect(page.locator('text=Confirmar Exclusão')).toBeVisible({
      timeout: 5000,
    });

    // Inserir PIN
    await page
      .locator('input[type="password"], input[inputmode="numeric"]')
      .first()
      .fill(TEST_PIN);
    await page
      .locator('button:has-text("Confirmar"), button:has-text("Verificar")')
      .first()
      .click();

    // Verificar sucesso
    await expect(page.locator('text=sucesso')).toBeVisible({ timeout: 10000 });
  });
});

// ─── Coupons CRUD ─────────────────────────────────────────────

test.describe('Cupons - CRUD', () => {
  const uniqueCode = `E2ECOUP${Date.now().toString(36).toUpperCase()}`;

  test('Criar cupom via wizard', async ({ page }) => {
    await setup(page, '/sales/coupons');

    await page.locator('button:has-text("Novo Cupom")').first().click();

    // Preencher código do cupom
    await page
      .locator(
        '[data-testid="coupon-create-code"], input[placeholder*="código"], input[placeholder*="CODIGO"]'
      )
      .first()
      .fill(uniqueCode);

    // Tentar avançar ou submeter
    await page
      .locator('button:has-text("Próximo"), button:has-text("Avançar")')
      .first()
      .click();
    await page.waitForTimeout(500);

    await page
      .locator('[data-testid="coupon-create-submit"], button:has-text("Criar")')
      .first()
      .click();

    await expect(page.locator('text=sucesso')).toBeVisible({ timeout: 10000 });
  });
});

// ─── Contacts CRUD ────────────────────────────────────────────

test.describe('Contatos - CRUD', () => {
  const firstName = 'E2E';
  const lastName = `Contact${Date.now().toString(36)}`;

  test('Criar contato via wizard', async ({ page }) => {
    await setup(page, '/sales/contacts');

    await page.locator('button:has-text("Novo Contato")').first().click();
    await page.waitForTimeout(1000);

    // Preencher campos de nome (primeiro nome / sobrenome)
    const nameInputs = page.locator('input[type="text"]');
    await nameInputs.first().fill(firstName);
    if (await nameInputs.nth(1).isVisible()) {
      await nameInputs.nth(1).fill(lastName);
    }

    // Submeter
    await page
      .locator(
        'button:has-text("Próximo"), button:has-text("Avançar"), button:has-text("Criar")'
      )
      .first()
      .click();
    await page.waitForTimeout(500);
    await page
      .locator(
        'button:has-text("Criar Contato"), button:has-text("Criar"), button:has-text("Salvar")'
      )
      .first()
      .click();

    await expect(page.locator('text=sucesso')).toBeVisible({ timeout: 10000 });
  });
});

// ─── Sales Dashboard ──────────────────────────────────────────

test.describe('Dashboard de Vendas', () => {
  test('Dashboard carrega com KPIs e gráficos', async ({ page }) => {
    await setup(page, '/sales');

    // Verificar hero banner
    await expect(page.locator('text=Vendas')).toBeVisible();

    // Verificar seção de KPIs
    await expect(page.locator('[data-testid="sales-kpi-cards"]')).toBeVisible({
      timeout: 10000,
    });

    // Verificar gráficos carregados
    await expect(page.locator('[data-testid="sales-daily-chart"]')).toBeVisible(
      { timeout: 10000 }
    );
  });

  test('Página de configurações carrega', async ({ page }) => {
    await setup(page, '/sales/settings');

    await expect(
      page.locator('[data-testid="sales-settings-page"]')
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Configurações')).toBeVisible();

    // Verificar que cards de configuração são exibidos
    await expect(
      page.locator('[data-testid^="settings-card"]').first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ─── Navigation Smoke ─────────────────────────────────────────

test.describe('Navegação do Módulo Sales', () => {
  const pages = [
    { path: '/sales/customers', testid: 'customers-page' },
    { path: '/sales/deals', testid: 'deals-page' },
    { path: '/sales/orders', testid: 'orders-page' },
    { path: '/sales/pipelines', testid: 'pipelines-page' },
    { path: '/sales/contacts', testid: 'contacts-page' },
  ];

  for (const p of pages) {
    test(`${p.path} carrega corretamente`, async ({ page }) => {
      await setup(page, p.path);

      // Deve ter o wrapper da página com data-testid
      const wrapper = page.locator(`[data-testid="${p.testid}"]`);
      await expect(wrapper).toBeVisible({ timeout: 15000 });

      // Não deve apresentar error boundary
      await expect(page.locator('.next-error-h1')).not.toBeVisible();
    });
  }
});
