import { test, expect } from './email.setup';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  buildMockAccount,
  buildMockFolders,
  buildMockMessageItem,
  buildMockMessagesResponse,
  buildMockMessageDetail,
} from '../helpers/email.helper';

// Visual audit - captures screenshots with mock data for manual review
test.describe('Email Visual Audit', () => {
  let token: string;
  let tenantId: string;

  test.beforeAll(async () => {
    const auth = await getAuthenticatedToken('admin@teste.com', 'Teste@123');
    token = auth.token;
    tenantId = auth.tenantId;
  });

  async function setupMocks(page: import('@playwright/test').Page) {
    const accountId = 'mock-acct-1';
    const mockAccount = buildMockAccount({
      id: accountId,
      address: 'admin@empresa.com',
      displayName: 'Admin Corporativo',
    });

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const mockMessages = [
      buildMockMessageItem({
        id: 'msg-1',
        accountId,
        folderId: 'folder-inbox',
        subject: 'Reunião de equipe amanhã às 10h',
        fromName: 'Maria Silva',
        fromAddress: 'maria@empresa.com',
        snippet: 'Oi, gostaria de confirmar a reunião de amanhã às 10h...',
        isRead: false,
        receivedAt: now.toISOString(),
      }),
      buildMockMessageItem({
        id: 'msg-2',
        accountId,
        folderId: 'folder-inbox',
        subject: 'Relatório mensal pronto',
        fromName: 'Carlos Santos',
        fromAddress: 'carlos@empresa.com',
        snippet: 'Segue em anexo o relatório mensal de vendas...',
        isRead: true,
        hasAttachments: true,
        receivedAt: yesterday.toISOString(),
      }),
      buildMockMessageItem({
        id: 'msg-3',
        accountId,
        folderId: 'folder-inbox',
        subject: 'Atualização do sistema - manutenção programada',
        fromName: 'TI Suporte',
        fromAddress: 'ti@empresa.com',
        snippet: 'Informamos que haverá uma manutenção programada...',
        isRead: false,
        receivedAt: twoDaysAgo.toISOString(),
      }),
      buildMockMessageItem({
        id: 'msg-4',
        accountId,
        folderId: 'folder-inbox',
        subject: 'Convite: Treinamento de vendas',
        fromName: 'Ana Oliveira',
        fromAddress: 'ana@empresa.com',
        snippet: 'Você está convidado para o treinamento...',
        isRead: true,
        receivedAt: twoDaysAgo.toISOString(),
      }),
      buildMockMessageItem({
        id: 'msg-5',
        accountId,
        folderId: 'folder-inbox',
        subject: '',
        fromName: '',
        fromAddress: '',
        snippet: '',
        isRead: false,
        receivedAt: twoDaysAgo.toISOString(),
      }),
    ];

    // Mock accounts
    await page.route('**/v1/email/accounts*', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [mockAccount] }),
        });
      } else {
        route.continue();
      }
    });

    // Mock folders
    await page.route('**/v1/email/folders*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildMockFolders(accountId)),
      });
    });

    // Mock messages list
    await page.route('**/v1/email/messages?*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildMockMessagesResponse(mockMessages)),
      });
    });

    // Mock message detail
    await page.route('**/v1/email/messages/msg-*', route => {
      if (route.request().method() === 'GET') {
        const url = route.request().url();
        const msgId = url.match(/messages\/(msg-\d+)/)?.[1];
        const msg = mockMessages.find(m => m.id === msgId);
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            buildMockMessageDetail({
              id: msg?.id ?? 'msg-1',
              accountId,
              folderId: 'folder-inbox',
              subject: msg?.subject ?? 'Test',
              fromName: msg?.fromName ?? 'Test',
              fromAddress: msg?.fromAddress ?? 'test@test.com',
              bodyHtmlSanitized:
                '<div style="color: black; background: white;"><p>Oi, gostaria de confirmar a <strong>reunião</strong> de amanhã às 10h.</p><p>Essa mensagem tem <span style="color: #000000">texto preto</span> que pode causar problemas no dark mode.</p></div>',
            })
          ),
        });
      } else {
        route.fulfill({ status: 204 });
      }
    });

    // Mock sync
    await page.route('**/v1/email/accounts/*/sync', route => {
      route.fulfill({ status: 202, contentType: 'application/json', body: '{}' });
    });
  }

  test('light mode - full interface', async ({ page }) => {
    await setupMocks(page);
    await injectAuthIntoBrowser(page, token, tenantId);
    await page.goto('/email');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: 'tests/e2e/email/screenshots/01-light-full.png',
      fullPage: false,
    });

    // Sidebar
    const sidebar = page.locator('[data-testid="email-sidebar"]');
    if (await sidebar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sidebar.screenshot({
        path: 'tests/e2e/email/screenshots/02-light-sidebar.png',
      });
    }

    // Message list
    const messageList = page.locator('[data-testid="email-message-list"]');
    if (await messageList.isVisible({ timeout: 2000 }).catch(() => false)) {
      await messageList.screenshot({
        path: 'tests/e2e/email/screenshots/03-light-message-list.png',
      });
    }

    // Click first message to select it
    const firstRow = page.locator('[data-index="0"]').first();
    if (await firstRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: 'tests/e2e/email/screenshots/04-light-selected-message.png',
        fullPage: false,
      });

      // Message display area
      const display = page.locator('[data-testid="email-message-display"]');
      if (await display.isVisible({ timeout: 2000 }).catch(() => false)) {
        await display.screenshot({
          path: 'tests/e2e/email/screenshots/05-light-message-display.png',
        });
      }
    }
  });

  test('dark mode - full interface', async ({ page }) => {
    await setupMocks(page);
    await injectAuthIntoBrowser(page, token, tenantId);

    // Set dark mode preference before navigation
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });

    await page.goto('/email');
    await page.waitForTimeout(3000);

    // Force dark mode if theme wasn't applied
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/e2e/email/screenshots/06-dark-full.png',
      fullPage: false,
    });

    // Sidebar
    const sidebar = page.locator('[data-testid="email-sidebar"]');
    if (await sidebar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sidebar.screenshot({
        path: 'tests/e2e/email/screenshots/07-dark-sidebar.png',
      });
    }

    // Message list
    const messageList = page.locator('[data-testid="email-message-list"]');
    if (await messageList.isVisible({ timeout: 2000 }).catch(() => false)) {
      await messageList.screenshot({
        path: 'tests/e2e/email/screenshots/08-dark-message-list.png',
      });
    }

    // Click first message
    const firstRow = page.locator('[data-index="0"]').first();
    if (await firstRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: 'tests/e2e/email/screenshots/09-dark-selected-message.png',
        fullPage: false,
      });

      // Message display
      const display = page.locator('[data-testid="email-message-display"]');
      if (await display.isVisible({ timeout: 2000 }).catch(() => false)) {
        await display.screenshot({
          path: 'tests/e2e/email/screenshots/10-dark-message-display.png',
        });
      }
    }
  });
});
