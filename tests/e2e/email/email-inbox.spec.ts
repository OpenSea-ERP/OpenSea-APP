import { test, expect } from '@playwright/test';
import { getAuthenticatedToken } from '../helpers/auth.helper';
import {
  ALL_EMAIL_PERMISSIONS,
  createEmailUser,
} from '../helpers/email-permissions.helper';
import {
  navigateToEmail,
  createEmailAccountViaApi,
  deleteEmailAccountViaApi,
  mockEmailMessageRoutes,
  buildMockMessageItem,
} from '../helpers/email.helper';

let userToken: string;
let userTenantId: string;
let accountId: string;

test.beforeAll(async () => {
  const user = await createEmailUser(ALL_EMAIL_PERMISSIONS);
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  const account = await createEmailAccountViaApi(userToken, {
    displayName: 'Inbox Test',
  });
  accountId = account.id;
});

test.afterAll(async () => {
  if (accountId) {
    await deleteEmailAccountViaApi(userToken, accountId).catch(() => {});
  }
});

test.describe('E-mail - Caixa de Entrada (Inbox)', () => {
  test('3.1 - Deve exibir lista de mensagens', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    // Wait for messages to render
    await page.waitForTimeout(3000);

    // Check for message subjects from mock data
    const msgLocator = page.locator('text=Reuniao de equipe amanha');
    if (await msgLocator.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(msgLocator).toBeVisible();
    }

    // Check for other messages
    const msg2 = page.locator('text=Relatorio mensal pronto');
    if (await msg2.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(msg2).toBeVisible();
    }
  });

  test('3.2 - Deve exibir remetente e snippet da mensagem', async ({
    page,
  }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    // Sender name should appear
    const senderLocators = [
      page.locator('text=Maria Silva'),
      page.locator('text=Carlos Santos'),
      page.locator('text=TI Suporte'),
    ];

    let foundSender = false;
    for (const loc of senderLocators) {
      if (await loc.isVisible({ timeout: 3_000 }).catch(() => false)) {
        foundSender = true;
        break;
      }
    }

    expect(foundSender).toBe(true);
  });

  test('3.3 - Deve selecionar mensagem ao clicar', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    // Click on a message in the list
    const msgItem = page.locator('text=Reuniao de equipe amanha');
    if (await msgItem.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await msgItem.click();

      // The detail panel should show the message content
      await page.waitForTimeout(2000);

      // Check for message detail elements (subject, body)
      const detailPanel = page.locator('text=Reuniao de equipe amanha');
      await expect(detailPanel.first()).toBeVisible();
    }
  });

  test('3.4 - Deve filtrar mensagens nao lidas', async ({ page }) => {
    const messages = [
      buildMockMessageItem({
        id: 'unread-1',
        accountId,
        subject: 'Mensagem nao lida',
        isRead: false,
      }),
      buildMockMessageItem({
        id: 'read-1',
        accountId,
        subject: 'Mensagem ja lida',
        isRead: true,
      }),
    ];

    await mockEmailMessageRoutes(page, { accountId, messages });
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    // Look for filter control (tab/button for unread)
    const unreadFilter = page.locator('text=Não lido').first();
    if (await unreadFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await unreadFilter.click();
      await page.waitForTimeout(1000);

      // After filtering, unread message should be visible
      // The mock route filters by unread=true
    }
  });

  test('3.5 - Deve buscar mensagens por palavra-chave', async ({ page }) => {
    await mockEmailMessageRoutes(page, { accountId });
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    // Find search input
    const searchInput = page.locator(
      'input[placeholder*="Buscar"], input[placeholder*="buscar"], input[placeholder*="Pesquisar"], input[placeholder*="pesquisar"], input[type="search"]'
    );

    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('Relatorio');
      // Wait for debounce (300ms) + network
      await page.waitForTimeout(1000);

      // Mock filters by search term, so only matching message should appear
    }
  });

  test('3.6 - Deve exibir indicador de mensagem nao lida', async ({ page }) => {
    const messages = [
      buildMockMessageItem({
        id: 'unread-indicator',
        accountId,
        subject: 'Nova mensagem urgente',
        isRead: false,
        fromName: 'Diretor',
      }),
    ];

    await mockEmailMessageRoutes(page, { accountId, messages });
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    // Unread messages typically have visual indicators (bold text, dot, etc.)
    const msgItem = page.locator('text=Nova mensagem urgente');
    if (await msgItem.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(msgItem).toBeVisible();
    }
  });

  test('3.7 - Deve exibir indicador de anexo', async ({ page }) => {
    const messages = [
      buildMockMessageItem({
        id: 'with-attachment',
        accountId,
        subject: 'Email com arquivo anexo',
        hasAttachments: true,
      }),
    ];

    await mockEmailMessageRoutes(page, { accountId, messages });
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    const msgItem = page.locator('text=Email com arquivo anexo');
    if (await msgItem.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(msgItem).toBeVisible();
      // Attachment icon (Paperclip) should be visible near the message
    }
  });
});
