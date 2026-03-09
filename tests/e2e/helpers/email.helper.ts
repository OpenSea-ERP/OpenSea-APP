import type { Page } from '@playwright/test';
import { API_URL, injectAuthIntoBrowser } from './auth.helper';

// ─── Navigation ─────────────────────────────────────────────────────

/**
 * Inject auth and navigate to the email inbox page.
 */
export async function navigateToEmail(
  page: Page,
  token: string,
  tenantId: string
) {
  await injectAuthIntoBrowser(page, token, tenantId);
  await page.goto('/email');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to email settings page.
 */
export async function navigateToEmailSettings(
  page: Page,
  token: string,
  tenantId: string
) {
  await injectAuthIntoBrowser(page, token, tenantId);
  await page.goto('/email/settings');
  await page.waitForLoadState('networkidle');
}

// ─── Toast Helper ───────────────────────────────────────────────────

/**
 * Wait for a Sonner toast with the given text.
 */
export async function waitForToast(
  page: Page,
  text: string,
  timeout = 10_000
): Promise<void> {
  await page.locator('[data-sonner-toast]').filter({ hasText: text }).waitFor({
    state: 'visible',
    timeout,
  });
}

// ─── API Helpers (real backend) ─────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 5
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, options);
    } catch {
      if (attempt < maxRetries) {
        await sleep((attempt + 1) * 3_000);
        continue;
      }
      throw new Error(`Max retries exceeded for ${url}`);
    }

    if (res.status === 429 || (res.status === 500 && attempt < maxRetries)) {
      const body = await res.text();
      if (res.status === 429 || body.includes('Rate limit')) {
        const match = body.match(/retry in (\d+)/);
        const waitMs = match
          ? (parseInt(match[1], 10) + 2) * 1_000
          : (attempt + 1) * 5_000;
        await sleep(waitMs);
        continue;
      }
      return new Response(body, { status: res.status, headers: res.headers });
    }

    return res;
  }

  throw new Error(`Max retries exceeded for ${url}`);
}

/**
 * Create an email account via API.
 */
export async function createEmailAccountViaApi(
  token: string,
  overrides: Partial<{
    address: string;
    displayName: string;
    imapHost: string;
    imapPort: number;
    smtpHost: string;
    smtpPort: number;
    username: string;
    secret: string;
    visibility: 'PRIVATE' | 'SHARED';
  }> = {}
): Promise<{ id: string; address: string }> {
  const uniqueId = Date.now().toString(36);
  const payload = {
    address: overrides.address ?? `e2e-${uniqueId}@test.com`,
    displayName: overrides.displayName ?? `E2E Account ${uniqueId}`,
    imapHost: overrides.imapHost ?? 'imap.test.com',
    imapPort: overrides.imapPort ?? 993,
    smtpHost: overrides.smtpHost ?? 'smtp.test.com',
    smtpPort: overrides.smtpPort ?? 587,
    username: overrides.username ?? `e2e-${uniqueId}@test.com`,
    secret: overrides.secret ?? 'test-password-123',
    visibility: overrides.visibility ?? 'PRIVATE',
  };

  const res = await fetchWithRetry(`${API_URL}/v1/email/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Create email account failed (${res.status}): ${await res.text()}`
    );
  }

  const data = await res.json();
  return { id: data.account.id, address: payload.address };
}

/**
 * Delete an email account via API.
 */
export async function deleteEmailAccountViaApi(
  token: string,
  accountId: string
): Promise<void> {
  const res = await fetchWithRetry(
    `${API_URL}/v1/email/accounts/${accountId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok && res.status !== 404) {
    throw new Error(
      `Delete email account failed (${res.status}): ${await res.text()}`
    );
  }
}

/**
 * List email accounts via API.
 */
export async function listEmailAccountsViaApi(
  token: string
): Promise<Array<{ id: string; address: string; displayName: string | null }>> {
  const res = await fetchWithRetry(`${API_URL}/v1/email/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `List email accounts failed (${res.status}): ${await res.text()}`
    );
  }

  const data = await res.json();
  return data.data ?? data.accounts ?? [];
}

// ─── Mock Data Builders ─────────────────────────────────────────────

/**
 * Build mock email account response data.
 */
export function buildMockAccount(
  overrides: Partial<{
    id: string;
    address: string;
    displayName: string;
    isActive: boolean;
    isDefault: boolean;
    visibility: 'PRIVATE' | 'SHARED';
  }> = {}
) {
  const id = overrides.id ?? crypto.randomUUID();
  return {
    id,
    address: overrides.address ?? 'mock@test.com',
    displayName: overrides.displayName ?? 'Mock Account',
    imapHost: 'imap.test.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.test.com',
    smtpPort: 587,
    smtpSecure: true,
    username: 'mock@test.com',
    visibility: overrides.visibility ?? 'PRIVATE',
    isActive: overrides.isActive ?? true,
    isDefault: overrides.isDefault ?? false,
    signature: null,
    lastSyncAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Build mock folder list response.
 */
export function buildMockFolders(accountId: string) {
  return {
    data: [
      {
        id: 'folder-inbox',
        accountId,
        remoteName: 'INBOX',
        displayName: 'Caixa de entrada',
        type: 'INBOX',
        uidValidity: 1,
        lastUid: 100,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'folder-sent',
        accountId,
        remoteName: 'Sent',
        displayName: 'Enviados',
        type: 'SENT',
        uidValidity: 1,
        lastUid: 50,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'folder-drafts',
        accountId,
        remoteName: 'Drafts',
        displayName: 'Rascunhos',
        type: 'DRAFTS',
        uidValidity: 1,
        lastUid: 10,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'folder-trash',
        accountId,
        remoteName: 'Trash',
        displayName: 'Lixeira',
        type: 'TRASH',
        uidValidity: 1,
        lastUid: 20,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'folder-spam',
        accountId,
        remoteName: 'Junk',
        displayName: 'Spam',
        type: 'SPAM',
        uidValidity: 1,
        lastUid: 5,
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Build a mock message list item.
 */
export function buildMockMessageItem(
  overrides: Partial<{
    id: string;
    accountId: string;
    folderId: string;
    subject: string;
    fromAddress: string;
    fromName: string;
    snippet: string;
    isRead: boolean;
    hasAttachments: boolean;
    receivedAt: string;
  }> = {}
) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    accountId: overrides.accountId ?? 'mock-account-1',
    folderId: overrides.folderId ?? 'folder-inbox',
    subject: overrides.subject ?? 'Test Email Subject',
    fromAddress: overrides.fromAddress ?? 'sender@example.com',
    fromName: overrides.fromName ?? 'Test Sender',
    snippet: overrides.snippet ?? 'This is a preview of the email body...',
    receivedAt: overrides.receivedAt ?? new Date().toISOString(),
    isRead: overrides.isRead ?? false,
    hasAttachments: overrides.hasAttachments ?? false,
  };
}

/**
 * Build a mock message detail response.
 */
export function buildMockMessageDetail(
  overrides: Partial<{
    id: string;
    accountId: string;
    folderId: string;
    subject: string;
    fromAddress: string;
    fromName: string;
    bodyHtmlSanitized: string;
    bodyText: string;
    toAddresses: string[];
    ccAddresses: string[];
    isRead: boolean;
  }> = {}
) {
  const id = overrides.id ?? crypto.randomUUID();
  return {
    message: {
      id,
      tenantId: 'mock-tenant',
      accountId: overrides.accountId ?? 'mock-account-1',
      folderId: overrides.folderId ?? 'folder-inbox',
      remoteUid: 101,
      messageId: `<${id}@mock>`,
      threadId: null,
      fromAddress: overrides.fromAddress ?? 'sender@example.com',
      fromName: overrides.fromName ?? 'Test Sender',
      toAddresses: overrides.toAddresses ?? ['recipient@example.com'],
      ccAddresses: overrides.ccAddresses ?? [],
      bccAddresses: [],
      subject: overrides.subject ?? 'Test Email Subject',
      snippet: 'This is a preview...',
      bodyText: overrides.bodyText ?? 'Plain text body content',
      bodyHtmlSanitized:
        overrides.bodyHtmlSanitized ??
        '<p>This is the <strong>HTML body</strong> of the email.</p>',
      receivedAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      isRead: overrides.isRead ?? true,
      isFlagged: false,
      hasAttachments: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: [],
    },
  };
}

/**
 * Build a mock paginated messages response.
 */
export function buildMockMessagesResponse(
  messages: ReturnType<typeof buildMockMessageItem>[],
  meta?: Partial<{ total: number; page: number; limit: number; pages: number }>
) {
  return {
    data: messages,
    meta: {
      total: meta?.total ?? messages.length,
      page: meta?.page ?? 1,
      limit: meta?.limit ?? 30,
      pages: meta?.pages ?? 1,
    },
  };
}

// ─── Route Mocking Helpers ──────────────────────────────────────────

/**
 * Mock all email message-related API routes for a page.
 * This sets up realistic mock data for inbox testing.
 */
export async function mockEmailMessageRoutes(
  page: Page,
  options: {
    accountId: string;
    messages?: ReturnType<typeof buildMockMessageItem>[];
    messageDetail?: ReturnType<typeof buildMockMessageDetail>;
  }
) {
  const { accountId } = options;
  const mockMessages = options.messages ?? [
    buildMockMessageItem({
      id: 'msg-1',
      accountId,
      folderId: 'folder-inbox',
      subject: 'Reuniao de equipe amanha',
      fromName: 'Maria Silva',
      fromAddress: 'maria@empresa.com',
      snippet: 'Oi, gostaria de confirmar a reuniao de amanha as 10h...',
      isRead: false,
    }),
    buildMockMessageItem({
      id: 'msg-2',
      accountId,
      folderId: 'folder-inbox',
      subject: 'Relatorio mensal pronto',
      fromName: 'Carlos Santos',
      fromAddress: 'carlos@empresa.com',
      snippet: 'Segue em anexo o relatorio mensal de vendas...',
      isRead: true,
      hasAttachments: true,
    }),
    buildMockMessageItem({
      id: 'msg-3',
      accountId,
      folderId: 'folder-inbox',
      subject: 'Atualizacao do sistema',
      fromName: 'TI Suporte',
      fromAddress: 'ti@empresa.com',
      snippet: 'Informamos que haverá uma manutencao programada...',
      isRead: false,
    }),
  ];

  const mockDetail =
    options.messageDetail ??
    buildMockMessageDetail({
      id: mockMessages[0]?.id ?? 'msg-1',
      accountId,
      folderId: 'folder-inbox',
      subject: mockMessages[0]?.subject ?? 'Reuniao de equipe amanha',
      fromName: mockMessages[0]?.fromName ?? 'Maria Silva',
      fromAddress: mockMessages[0]?.fromAddress ?? 'maria@empresa.com',
      bodyHtmlSanitized:
        '<p>Oi, gostaria de confirmar a <strong>reuniao</strong> de amanha as 10h.</p>',
      toAddresses: ['eu@empresa.com'],
    });

  const folders = buildMockFolders(accountId);

  // Mock folders endpoint
  await page.route('**/v1/email/folders*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(folders),
    });
  });

  // Mock messages list endpoint
  await page.route('**/v1/email/messages?*', route => {
    const url = new URL(route.request().url());
    const folderId = url.searchParams.get('folderId');
    const search = url.searchParams.get('search');
    const unread = url.searchParams.get('unread');

    let filtered = mockMessages;
    if (folderId) {
      filtered = filtered.filter(m => m.folderId === folderId);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.subject.toLowerCase().includes(q) ||
          m.fromName.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q)
      );
    }
    if (unread === 'true') {
      filtered = filtered.filter(m => !m.isRead);
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildMockMessagesResponse(filtered)),
    });
  });

  // Mock single message detail
  await page.route('**/v1/email/messages/msg-*', route => {
    if (route.request().method() === 'GET') {
      const url = route.request().url();
      const msgId = url.match(/messages\/(msg-\d+)/)?.[1];
      const msg = mockMessages.find(m => m.id === msgId);

      if (msg) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            buildMockMessageDetail({
              id: msg.id,
              accountId: msg.accountId,
              folderId: msg.folderId,
              subject: msg.subject,
              fromName: msg.fromName,
              fromAddress: msg.fromAddress,
            })
          ),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDetail),
        });
      }
    } else {
      // PATCH/DELETE — return success
      route.fulfill({ status: 204 });
    }
  });

  // Mock send endpoint
  await page.route('**/v1/email/messages/send', route => {
    route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ messageId: crypto.randomUUID() }),
    });
  });

  // Mock draft endpoint
  await page.route('**/v1/email/messages/draft', route => {
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ draftId: crypto.randomUUID() }),
    });
  });
}
