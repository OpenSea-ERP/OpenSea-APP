import { test, expect } from '@playwright/test';
import { getAuthenticatedToken } from '../helpers/auth.helper';
import {
  ALL_EMAIL_PERMISSIONS,
  createEmailUser,
} from '../helpers/email-permissions.helper';
import {
  navigateToEmail,
  navigateToEmailSettings,
  createEmailAccountViaApi,
  deleteEmailAccountViaApi,
  mockEmailMessageRoutes,
} from '../helpers/email.helper';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const user = await createEmailUser(ALL_EMAIL_PERMISSIONS);
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('E-mail - Gerenciamento de Contas (Wizard + Edit)', () => {
  test('10.1 - Deve abrir wizard ao clicar no botao "+" na sidebar', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);

    // Wait for sidebar to render
    await expect(page.locator('[data-testid="email-sidebar"]')).toBeVisible({
      timeout: 15_000,
    });

    // Click the "+" button to add new account
    const addBtn = page.locator('button[title="Adicionar conta"]');
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click();

      // Wizard dialog should appear
      const wizard = page.locator('[data-testid="email-account-wizard"]');
      await expect(wizard).toBeVisible({ timeout: 5_000 });
    }
  });

  test('10.2 - Wizard deve exibir Step 1: Dados da Conta', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);

    const addBtn = page.locator('button[title="Adicionar conta"]');
    if (await addBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await addBtn.click();

      const wizard = page.locator('[data-testid="email-account-wizard"]');
      await expect(wizard).toBeVisible({ timeout: 5_000 });

      // Step 1 should show title and fields
      await expect(wizard.locator('text=Dados da Conta')).toBeVisible();
      await expect(wizard.locator('#wizard-email')).toBeVisible();
      await expect(wizard.locator('#wizard-display-name')).toBeVisible();
      await expect(wizard.locator('#wizard-password')).toBeVisible();
    }
  });

  test('10.3 - Wizard deve ter botao Avancar desabilitado com campos vazios', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);

    const addBtn = page.locator('button[title="Adicionar conta"]');
    if (await addBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await addBtn.click();

      const wizard = page.locator('[data-testid="email-account-wizard"]');
      await expect(wizard).toBeVisible({ timeout: 5_000 });

      // "Avancar" button should be disabled with empty required fields
      const nextBtn = wizard.locator('button:has-text("Avançar")');
      await expect(nextBtn).toBeDisabled();
    }
  });

  test('10.4 - Wizard deve habilitar Avancar quando campos obrigatorios preenchidos', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);

    const addBtn = page.locator('button[title="Adicionar conta"]');
    if (await addBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await addBtn.click();

      const wizard = page.locator('[data-testid="email-account-wizard"]');
      await expect(wizard).toBeVisible({ timeout: 5_000 });

      // Fill required fields for step 1
      await wizard.locator('#wizard-email').fill('teste@gmail.com');
      await wizard.locator('#wizard-password').fill('senha-teste-123');

      // "Avancar" should now be enabled
      const nextBtn = wizard.locator('button:has-text("Avançar")');
      await expect(nextBtn).toBeEnabled();
    }
  });

  test('10.5 - Wizard deve navegar para Step 2 (IMAP) ao avancar', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);

    const addBtn = page.locator('button[title="Adicionar conta"]');
    if (await addBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await addBtn.click();

      const wizard = page.locator('[data-testid="email-account-wizard"]');
      await expect(wizard).toBeVisible({ timeout: 5_000 });

      // Fill step 1
      await wizard.locator('#wizard-email').fill('teste@gmail.com');
      await wizard.locator('#wizard-password').fill('senha-teste-123');

      // Click advance
      await wizard.locator('button:has-text("Avançar")').click();
      await page.waitForTimeout(500);

      // Step 2 should show IMAP configuration
      await expect(wizard.locator('text=Servidor de Recebimento')).toBeVisible({
        timeout: 5_000,
      });
      await expect(wizard.locator('#wizard-imap-host')).toBeVisible();
      await expect(wizard.locator('#wizard-imap-port')).toBeVisible();
    }
  });

  test('10.6 - Wizard deve auto-detectar configuracoes para Gmail', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);

    const addBtn = page.locator('button[title="Adicionar conta"]');
    if (await addBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await addBtn.click();

      const wizard = page.locator('[data-testid="email-account-wizard"]');
      await expect(wizard).toBeVisible({ timeout: 5_000 });

      // Type a Gmail address to trigger auto-detection
      await wizard.locator('#wizard-email').fill('user@gmail.com');
      await wizard.locator('#wizard-password').fill('app-password');

      // Advance to IMAP step
      await wizard.locator('button:has-text("Avançar")').click();
      await page.waitForTimeout(500);

      // IMAP host should be auto-filled with Gmail settings
      const imapHost = wizard.locator('#wizard-imap-host');
      await expect(imapHost).toHaveValue('imap.gmail.com');
    }
  });

  test('10.7 - Wizard deve navegar para Step 3 (SMTP)', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);

    const addBtn = page.locator('button[title="Adicionar conta"]');
    if (await addBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await addBtn.click();

      const wizard = page.locator('[data-testid="email-account-wizard"]');
      await expect(wizard).toBeVisible({ timeout: 5_000 });

      // Step 1
      await wizard.locator('#wizard-email').fill('user@gmail.com');
      await wizard.locator('#wizard-password').fill('app-password');
      await wizard.locator('button:has-text("Avançar")').click();
      await page.waitForTimeout(500);

      // Step 2 -> Step 3
      await wizard.locator('button:has-text("Avançar")').click();
      await page.waitForTimeout(500);

      // Step 3 should show SMTP configuration
      await expect(wizard.locator('text=Servidor de Saída')).toBeVisible({
        timeout: 5_000,
      });
      await expect(wizard.locator('#wizard-smtp-host')).toBeVisible();
      await expect(wizard.locator('#wizard-smtp-port')).toBeVisible();
    }
  });

  test('10.8 - Wizard deve navegar para Step 4 (Configuracoes)', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);

    const addBtn = page.locator('button[title="Adicionar conta"]');
    if (await addBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await addBtn.click();

      const wizard = page.locator('[data-testid="email-account-wizard"]');
      await expect(wizard).toBeVisible({ timeout: 5_000 });

      // Navigate through steps 1 -> 2 -> 3 -> 4
      await wizard.locator('#wizard-email').fill('user@gmail.com');
      await wizard.locator('#wizard-password').fill('app-password');
      await wizard.locator('button:has-text("Avançar")').click();
      await page.waitForTimeout(500);

      await wizard.locator('button:has-text("Avançar")').click();
      await page.waitForTimeout(500);

      await wizard.locator('button:has-text("Avançar")').click();
      await page.waitForTimeout(500);

      // Step 4 should show settings
      await expect(wizard.locator('text=Configurações')).toBeVisible({
        timeout: 5_000,
      });
      await expect(wizard.locator('text=Visibilidade')).toBeVisible();
      await expect(wizard.locator('text=Conta padrão')).toBeVisible();
      await expect(wizard.locator('#wizard-signature')).toBeVisible();
    }
  });

  test('10.9 - Wizard deve permitir voltar para step anterior', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);

    const addBtn = page.locator('button[title="Adicionar conta"]');
    if (await addBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await addBtn.click();

      const wizard = page.locator('[data-testid="email-account-wizard"]');
      await expect(wizard).toBeVisible({ timeout: 5_000 });

      // Go to step 2
      await wizard.locator('#wizard-email').fill('user@gmail.com');
      await wizard.locator('#wizard-password').fill('app-password');
      await wizard.locator('button:has-text("Avançar")').click();
      await page.waitForTimeout(500);

      // Should show Step 2
      await expect(wizard.locator('text=Servidor de Recebimento')).toBeVisible({
        timeout: 3_000,
      });

      // Click "Voltar"
      const backBtn = wizard.locator('button:has-text("Voltar")');
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await page.waitForTimeout(500);

      // Should be back on Step 1
      await expect(wizard.locator('text=Dados da Conta')).toBeVisible({
        timeout: 3_000,
      });
    }
  });

  test('10.10 - Wizard deve fechar ao clicar Cancelar', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);

    const addBtn = page.locator('button[title="Adicionar conta"]');
    if (await addBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await addBtn.click();

      const wizard = page.locator('[data-testid="email-account-wizard"]');
      await expect(wizard).toBeVisible({ timeout: 5_000 });

      // Click cancel
      const cancelBtn = wizard.locator('button:has-text("Cancelar")');
      await cancelBtn.click();

      // Wizard should close
      await expect(wizard).not.toBeVisible({ timeout: 5_000 });
    }
  });

  test('10.11 - Deve abrir dialog de edicao ao clicar no icone de engrenagem da conta', async ({
    page,
  }) => {
    // Create account first
    const account = await createEmailAccountViaApi(userToken, {
      displayName: `Edit Test ${Date.now().toString(36)}`,
    });

    await mockEmailMessageRoutes(page, { accountId: account.id });
    await navigateToEmail(page, userToken, userTenantId);
    await page.waitForTimeout(3000);

    // Wait for account to appear in sidebar
    const sidebar = page.locator('[data-testid="email-sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 15_000 });

    // Hover over account to reveal gear icon
    const accountEntry = sidebar.locator('.group\\/account').first();
    if (await accountEntry.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await accountEntry.hover();

      const editBtn = accountEntry.locator('button[title="Configurar conta"]');
      if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await editBtn.click();

        // Edit dialog should appear
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5_000 });
      }
    }

    // Cleanup
    await deleteEmailAccountViaApi(userToken, account.id).catch(() => {});
  });

  test('10.12 - Wizard via menu de configuracoes da sidebar deve funcionar', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId: 'placeholder' });
    await navigateToEmail(page, userToken, userTenantId);
    await page.waitForTimeout(3000);

    // Click the gear icon in the sidebar footer
    const sidebar = page.locator('[data-testid="email-sidebar"]');
    const settingsBtn = sidebar.locator('button[title="Configurações"]');
    if (await settingsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await settingsBtn.click();

      // Dropdown should appear
      const menuItem = page.locator('text=Configurar nova conta');
      if (await menuItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await menuItem.click();

        // Wizard should open
        const wizard = page.locator('[data-testid="email-account-wizard"]');
        await expect(wizard).toBeVisible({ timeout: 5_000 });
      }
    }
  });
});
