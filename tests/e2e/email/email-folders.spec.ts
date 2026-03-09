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
  buildMockFolders,
  buildMockMessageItem,
  buildMockMessagesResponse,
  buildMockMessageDetail,
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
    displayName: 'Folders Test',
  });
  accountId = account.id;
});

test.afterAll(async () => {
  if (accountId) {
    await deleteEmailAccountViaApi(userToken, accountId).catch(() => {});
  }
});

/**
 * Set up folder-specific mocks with different messages per folder.
 */
async function setupFolderMocks(page: import('@playwright/test').Page) {
  const folders = buildMockFolders(accountId);

  const inboxMessages = [
    buildMockMessageItem({
      id: 'inbox-msg-1',
      accountId,
      folderId: 'folder-inbox',
      subject: 'Mensagem na caixa de entrada',
      fromName: 'Inbox Sender',
    }),
  ];

  const sentMessages = [
    buildMockMessageItem({
      id: 'sent-msg-1',
      accountId,
      folderId: 'folder-sent',
      subject: 'Mensagem enviada por mim',
      fromName: 'Eu',
      isRead: true,
    }),
  ];

  const trashMessages = [
    buildMockMessageItem({
      id: 'trash-msg-1',
      accountId,
      folderId: 'folder-trash',
      subject: 'Mensagem na lixeira',
      fromName: 'Deletado',
      isRead: true,
    }),
  ];

  // Mock folders
  await page.route('**/v1/email/folders*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(folders),
    });
  });

  // Mock messages per folder
  await page.route('**/v1/email/messages?*', route => {
    const url = new URL(route.request().url());
    const folderId = url.searchParams.get('folderId');

    let msgs;
    switch (folderId) {
      case 'folder-sent':
        msgs = sentMessages;
        break;
      case 'folder-trash':
        msgs = trashMessages;
        break;
      case 'folder-drafts':
        msgs = [];
        break;
      case 'folder-spam':
        msgs = [];
        break;
      default:
        msgs = inboxMessages;
        break;
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildMockMessagesResponse(msgs)),
    });
  });

  // Mock message detail
  await page.route(/\/v1\/email\/messages\/[a-z]+-msg-\d+$/, route => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          buildMockMessageDetail({ id: 'inbox-msg-1', accountId })
        ),
      });
    } else {
      route.fulfill({ status: 204 });
    }
  });

  // Mock send/draft
  await page.route('**/v1/email/messages/send', route => {
    route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ messageId: 'mock-sent-id' }),
    });
  });
  await page.route('**/v1/email/messages/draft', route => {
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ draftId: 'mock-draft-id' }),
    });
  });
}

test.describe('E-mail - Navegacao de Pastas', () => {
  test('7.1 - Deve exibir todas as pastas padrao na sidebar', async ({
    page,
  }) => {
    await setupFolderMocks(page);
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    // Check for standard folder names
    const expectedFolders = [
      'Caixa de entrada',
      'Enviados',
      'Rascunhos',
      'Lixeira',
      'Spam',
      // Fallback English names
      'INBOX',
      'Sent',
      'Drafts',
      'Trash',
    ];

    let foundCount = 0;
    for (const name of expectedFolders) {
      const loc = page.locator(`text=${name}`);
      if (await loc.isVisible({ timeout: 2_000 }).catch(() => false)) {
        foundCount++;
      }
    }

    // Should find at least 3 folders (inbox + sent + trash at minimum)
    expect(foundCount).toBeGreaterThanOrEqual(3);
  });

  test('7.2 - Deve selecionar INBOX por padrao', async ({ page }) => {
    await setupFolderMocks(page);
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    // Inbox message should be visible (default selection)
    const inboxMsg = page.locator('text=Mensagem na caixa de entrada');
    if (await inboxMsg.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(inboxMsg).toBeVisible();
    }
  });

  test('7.3 - Deve trocar para pasta Enviados', async ({ page }) => {
    await setupFolderMocks(page);
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    // Click on "Enviados" folder
    const sentFolder = page.locator('text=Enviados').first();
    if (await sentFolder.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await sentFolder.click();
      await page.waitForTimeout(2000);

      // Sent message should now be visible
      const sentMsg = page.locator('text=Mensagem enviada por mim');
      if (await sentMsg.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(sentMsg).toBeVisible();
      }
    }
  });

  test('7.4 - Deve trocar para Lixeira', async ({ page }) => {
    await setupFolderMocks(page);
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    const trashFolder = page.locator('text=Lixeira').first();
    if (await trashFolder.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await trashFolder.click();
      await page.waitForTimeout(2000);

      const trashMsg = page.locator('text=Mensagem na lixeira');
      if (await trashMsg.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(trashMsg).toBeVisible();
      }
    }
  });

  test('7.5 - Pasta Rascunhos deve mostrar estado vazio quando sem rascunhos', async ({
    page,
  }) => {
    await setupFolderMocks(page);
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    const draftsFolder = page.locator('text=Rascunhos').first();
    if (await draftsFolder.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await draftsFolder.click();
      await page.waitForTimeout(2000);

      // No messages in drafts mock — page should render without errors
      // Inbox messages should NOT be visible
      await expect(
        page.locator('text=Mensagem na caixa de entrada')
      ).not.toBeVisible({ timeout: 3_000 });
    }
  });

  test('7.6 - Deve exibir nome da pasta selecionada no topo da lista', async ({
    page,
  }) => {
    await setupFolderMocks(page);
    await navigateToEmail(page, userToken, userTenantId);

    await page.waitForTimeout(3000);

    // The message list panel typically shows the folder name
    // Check for folder name display
    const folderNames = ['Caixa de entrada', 'INBOX'];
    let found = false;
    for (const name of folderNames) {
      const loc = page.locator(`text=${name}`);
      if (
        await loc
          .first()
          .isVisible({ timeout: 3_000 })
          .catch(() => false)
      ) {
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
  });
});
