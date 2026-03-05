import { test as base, expect, type Page } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
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
  buildMockMessageItem,
  buildMockMessageDetail,
  buildMockMessagesResponse,
  buildMockFolders,
  waitForToast,
} from '../helpers/email.helper';

// ─── Page Object Model ──────────────────────────────────────────────────────

export class EmailPage {
  constructor(private page: Page) {}

  // ─── Navigation ─────────────────────────────────────────────────

  async goto() {
    await this.page.goto('/email');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoSettings() {
    await this.page.goto('/email/settings');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad() {
    await this.page.waitForSelector('[data-testid="email-sidebar"]', {
      timeout: 15_000,
    });
  }

  // ─── Sidebar ────────────────────────────────────────────────────

  get sidebar() {
    return this.page.locator('[data-testid="email-sidebar"]');
  }

  async selectFolder(folderName: string) {
    const folder = this.page.locator(`text=${folderName}`).first();
    await folder.click();
    await this.page.waitForTimeout(1000);
  }

  async clickCentralInbox() {
    await this.page.locator('[data-testid="email-central-inbox"]').click();
    await this.page.waitForTimeout(1000);
  }

  async getUnreadCount(folderName: string): Promise<number> {
    const folder = this.page.locator(`text=${folderName}`).first();
    const parent = folder.locator('..');
    const badge = parent.locator('span').last();
    const text = await badge.textContent().catch(() => '0');
    return parseInt(text ?? '0', 10) || 0;
  }

  // ─── Message List ───────────────────────────────────────────────

  get messageList() {
    return this.page.locator('[data-testid="email-message-list"]');
  }

  async selectMessage(index: number) {
    const items = this.messageList.locator('[data-index]');
    await items.nth(index).click();
    await this.page.waitForTimeout(500);
  }

  async getMessageCount(): Promise<number> {
    const items = this.messageList.locator('[data-index]');
    return items.count();
  }

  // ─── Compose ────────────────────────────────────────────────────

  async clickCompose() {
    await this.page.locator('button:has-text("Novo e-mail")').click();
    await this.page
      .locator('[data-testid="email-compose-dialog"]')
      .waitFor({ state: 'visible', timeout: 5_000 });
  }

  get composeDialog() {
    return this.page.locator('[data-testid="email-compose-dialog"]');
  }

  async fillTo(email: string) {
    const dialog = this.composeDialog;
    const toInput = dialog.locator('input').first();
    await toInput.fill(email);
  }

  async fillSubject(subject: string) {
    const dialog = this.composeDialog;
    const inputs = dialog.locator('input');
    const count = await inputs.count();
    if (count > 1) {
      await inputs.nth(1).fill(subject);
    }
  }

  async fillBody(text: string) {
    const dialog = this.composeDialog;
    const textarea = dialog.locator(
      'textarea, [contenteditable="true"], [role="textbox"]'
    );
    if (await textarea.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await textarea.fill(text);
    }
  }

  async clickSend() {
    const sendBtn = this.composeDialog.locator(
      'button:has-text("Enviar"), button:has-text("enviar")'
    );
    await sendBtn.click();
  }

  // ─── Actions ────────────────────────────────────────────────────

  get messageDisplay() {
    return this.page.locator('[data-testid="email-message-display"]');
  }

  async clickReply() {
    const btn = this.messageDisplay.locator(
      'button[title*="Responder"]:not([title*="todos"])'
    );
    await btn.first().click();
  }

  async clickReplyAll() {
    const btn = this.messageDisplay.locator(
      'button[title*="Responder a todos"]'
    );
    await btn.first().click();
  }

  async clickForward() {
    const btn = this.messageDisplay.locator('button[title*="Encaminhar"]');
    await btn.first().click();
  }

  async clickArchive() {
    const btn = this.messageDisplay.locator('button[title*="Arquivar"]');
    await btn.first().click();
  }

  async clickSpam() {
    const btn = this.messageDisplay.locator('button[title*="Spam"]');
    await btn.first().click();
  }

  async clickDelete() {
    const btn = this.messageDisplay.locator('button[title*="Excluir"]');
    await btn.first().click();
  }

  async clickMarkReadUnread() {
    const btn = this.messageDisplay.locator(
      'button[title*="lida"], button[title*="Lida"]'
    );
    await btn.first().click();
  }

  // ─── Multi-select ───────────────────────────────────────────────

  async shiftClickMessage(index: number) {
    const items = this.messageList.locator('[data-index]');
    await items.nth(index).click({ modifiers: ['Shift'] });
  }

  async ctrlClickMessage(index: number) {
    const items = this.messageList.locator('[data-index]');
    await items.nth(index).click({ modifiers: ['Control'] });
  }

  get bulkActionsToolbar() {
    return this.page.locator('[data-testid="email-bulk-actions-toolbar"]');
  }

  get bulkSelectionCount() {
    return this.page.locator('[data-testid="email-bulk-selection-count"]');
  }

  async clickBulkMarkRead() {
    await this.bulkActionsToolbar.locator('button:has-text("Lida")').click();
  }

  async clickBulkMarkUnread() {
    await this.bulkActionsToolbar
      .locator('button:has-text("Não lida")')
      .click();
  }

  async clickBulkArchive() {
    await this.bulkActionsToolbar
      .locator('button:has-text("Arquivar")')
      .click();
  }

  async clickBulkDelete() {
    await this.bulkActionsToolbar.locator('button:has-text("Excluir")').click();
  }

  async clearSelection() {
    await this.bulkActionsToolbar.locator('button[title*="Limpar"]').click();
  }

  // ─── Account Management ─────────────────────────────────────────

  get accountWizard() {
    return this.page.locator('[data-testid="email-account-wizard"]');
  }

  async openAccountWizard() {
    // Via sidebar "+" button
    await this.sidebar.locator('button[title="Adicionar conta"]').click();
    await this.accountWizard.waitFor({ state: 'visible', timeout: 5_000 });
  }

  async openAccountEdit(accountIndex: number) {
    // Hover over account in sidebar to reveal settings gear
    const accounts = this.sidebar.locator('.group\\/account');
    await accounts.nth(accountIndex).hover();
    const editBtn = accounts
      .nth(accountIndex)
      .locator('button[title="Configurar conta"]');
    await editBtn.click();
  }
}

// ─── Extended Test Fixture ──────────────────────────────────────────────────

interface EmailFixtures {
  emailPage: EmailPage;
  userToken: string;
  userTenantId: string;
}

/**
 * Extended Playwright test with email page fixture.
 * Automatically authenticates and provides EmailPage POM.
 */
export const test = base.extend<EmailFixtures>({
  // Shared auth state — created once per worker via beforeAll in each spec
  // Individual tests inject via navigateToEmail + mockEmailMessageRoutes
  userToken: ['', { option: true }],
  userTenantId: ['', { option: true }],
  emailPage: async ({ page }, use) => {
    await use(new EmailPage(page));
  },
});

export { expect };

// ─── Re-exports for convenience ─────────────────────────────────────────────

export {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
  ALL_EMAIL_PERMISSIONS,
  createEmailUser,
  navigateToEmail,
  navigateToEmailSettings,
  createEmailAccountViaApi,
  deleteEmailAccountViaApi,
  mockEmailMessageRoutes,
  buildMockMessageItem,
  buildMockMessageDetail,
  buildMockMessagesResponse,
  buildMockFolders,
  waitForToast,
};
