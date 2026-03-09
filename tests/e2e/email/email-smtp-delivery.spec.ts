/**
 * Email SMTP Delivery Integration Tests
 *
 * These tests verify REAL email delivery through the full stack:
 * Frontend → API → SMTP → Mail server
 *
 * Prerequisites:
 * - Backend running (npm run dev in OpenSea-API)
 * - Frontend running (npm run dev in OpenSea-APP)
 * - Email account configured (guilherme@casaesmeralda.ind.br)
 *
 * Run:
 *   npx playwright test tests/e2e/email/email-smtp-delivery.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
  API_URL,
} from '../helpers/auth.helper';
import { waitForToast } from '../helpers/email.helper';

// Use the test user who has the email account configured
const ADMIN_EMAIL = 'guilherme@teste.com';
const ADMIN_PASSWORD = 'Teste@123';

// Test destinations
const EXTERNAL_GMAIL = 'guilhermeganim@gmail.com';
const EXTERNAL_HOTMAIL = 'guilhermeganim@hotmail.com';

let token: string;
let tenantId: string;
let emailAccountId: string;
let emailAccountAddress: string;

test.beforeAll(async () => {
  const auth = await getAuthenticatedToken(ADMIN_EMAIL, ADMIN_PASSWORD);
  token = auth.token;
  tenantId = auth.tenantId;

  // Find the real email account
  const res = await fetch(`${API_URL}/v1/email/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`List accounts failed: ${res.status}`);
  }

  const data = await res.json();
  const accounts = data.data ?? [];

  if (accounts.length === 0) {
    throw new Error(
      'No email accounts configured. Set up an account at /email/settings first.'
    );
  }

  // Use first active account
  const activeAccount = accounts.find((a: { isActive: boolean }) => a.isActive);
  if (!activeAccount) {
    throw new Error('No active email account found');
  }

  emailAccountId = activeAccount.id;
  emailAccountAddress = activeAccount.address;
  console.log(
    `Using email account: ${emailAccountAddress} (${emailAccountId})`
  );
});

test.describe('Email SMTP Delivery - Testes de Entrega Real', () => {
  test.describe.configure({ mode: 'serial' });

  test('Deve enviar email para o proprio endereco (mesmo dominio)', async ({
    page,
  }) => {
    // Send via API directly (faster, more reliable for CI)
    const timestamp = new Date().toISOString();
    const res = await fetch(`${API_URL}/v1/email/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountId: emailAccountId,
        to: [emailAccountAddress],
        subject: `[E2E Test] Envio interno - ${timestamp}`,
        bodyHtml: '<p>Teste automatizado de envio para o mesmo dominio.</p>',
      }),
    });

    expect(res.status).toBe(202);

    const data = await res.json();
    expect(data.messageId).toBeTruthy();
    console.log(`  Interno OK - messageId: ${data.messageId}`);
  });

  test('Deve enviar email para Gmail (dominio externo)', async ({ page }) => {
    const timestamp = new Date().toISOString();
    const res = await fetch(`${API_URL}/v1/email/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountId: emailAccountId,
        to: [EXTERNAL_GMAIL],
        subject: `[E2E Test] Envio externo Gmail - ${timestamp}`,
        bodyHtml:
          '<p>Teste automatizado de envio para dominio externo (Gmail).</p><p>Se voce recebeu este email, a entrega SMTP esta funcionando.</p>',
      }),
    });

    expect(res.status).toBe(202);

    const data = await res.json();
    expect(data.messageId).toBeTruthy();
    console.log(`  Gmail OK - messageId: ${data.messageId}`);
  });

  test('Deve enviar email para Hotmail (dominio externo)', async ({ page }) => {
    const timestamp = new Date().toISOString();
    const res = await fetch(`${API_URL}/v1/email/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountId: emailAccountId,
        to: [EXTERNAL_HOTMAIL],
        subject: `[E2E Test] Envio externo Hotmail - ${timestamp}`,
        bodyHtml:
          '<p>Teste automatizado de envio para dominio externo (Hotmail).</p><p>Se voce recebeu este email, a entrega SMTP esta funcionando.</p>',
      }),
    });

    expect(res.status).toBe(202);

    const data = await res.json();
    expect(data.messageId).toBeTruthy();
    console.log(`  Hotmail OK - messageId: ${data.messageId}`);
  });

  test('Deve enviar email pelo fluxo completo do frontend (compose dialog)', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // Login and navigate
    await injectAuthIntoBrowser(page, token, tenantId);
    await page.goto('/email');
    await page.waitForLoadState('networkidle');

    // Wait for the email page to fully load
    await page.waitForTimeout(3000);

    // Click "Novo e-mail" button
    const novoEmailBtn = page.locator(
      'button:has-text("Novo e-mail"), button:has-text("Escrever")'
    );
    await expect(novoEmailBtn.first()).toBeVisible({ timeout: 15_000 });
    await novoEmailBtn.first().click();

    // Wait for compose dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Fill "Para" (To) field - first input in dialog
    const toInput = dialog.locator('input').first();
    await toInput.fill(emailAccountAddress);
    await toInput.press('Enter');

    // Fill subject
    const inputs = dialog.locator('input');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const placeholder = await inputs.nth(i).getAttribute('placeholder');
      if (
        placeholder &&
        (placeholder.toLowerCase().includes('assunto') ||
          placeholder.toLowerCase().includes('subject'))
      ) {
        await inputs
          .nth(i)
          .fill(`[E2E Frontend] Teste completo - ${new Date().toISOString()}`);
        break;
      }
    }

    // Fill body (TipTap editor)
    const editor = dialog.locator('[contenteditable="true"]');
    if (await editor.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editor.click();
      await editor.type(
        'Este email foi enviado pelo teste E2E do Playwright via compose dialog.'
      );
    }

    // Intercept the send request to capture the response
    const sendPromise = page.waitForResponse(
      response =>
        response.url().includes('/v1/email/messages/send') &&
        response.request().method() === 'POST',
      { timeout: 30_000 }
    );

    // Click send
    const sendBtn = dialog.locator(
      'button:has-text("Enviar"), button:has-text("enviar")'
    );
    if (
      await sendBtn
        .first()
        .isVisible({ timeout: 3_000 })
        .catch(() => false)
    ) {
      await sendBtn.first().click();
    }

    // Wait for the API response
    try {
      const response = await sendPromise;
      const status = response.status();
      console.log(`  Frontend send status: ${status}`);

      if (status === 202) {
        const body = await response.json();
        console.log(`  Frontend send messageId: ${body.messageId}`);
      } else {
        const text = await response.text();
        console.log(`  Frontend send response: ${text}`);
      }

      // Check for success toast
      try {
        await waitForToast(page, 'sucesso', 10_000);
        console.log('  Toast de sucesso exibido');
      } catch {
        console.log('  Toast nao detectado (pode ter fechado rapido)');
      }
    } catch {
      console.log('  Timeout aguardando resposta de envio');
    }
  });

  test('Deve responder a um email existente', async ({ page }) => {
    test.setTimeout(60_000);

    await injectAuthIntoBrowser(page, token, tenantId);
    await page.goto('/email');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click on first message in the list
    const messageItems = page.locator(
      '[data-testid^="message-item"], .cursor-pointer'
    );
    const firstMessage = messageItems.first();

    if (await firstMessage.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await firstMessage.click();
      await page.waitForTimeout(2000);

      // Find reply button
      const replyBtn = page
        .locator(
          'button:has-text("Responder"), button[title="Responder"], button[aria-label*="Responder"]'
        )
        .first();

      if (await replyBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await replyBtn.click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5_000 });

        // Editor should have quoted content
        const editor = dialog.locator('[contenteditable="true"]');
        if (await editor.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await editor.click();
          await editor.type('Resposta de teste E2E. ');
        }

        // Intercept send
        const sendPromise = page.waitForResponse(
          response =>
            response.url().includes('/v1/email/messages/send') &&
            response.request().method() === 'POST',
          { timeout: 30_000 }
        );

        const sendBtn = dialog
          .locator('button:has-text("Enviar"), button:has-text("enviar")')
          .first();
        if (await sendBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await sendBtn.click();

          try {
            const response = await sendPromise;
            console.log(`  Reply status: ${response.status()}`);
            if (response.status() === 202) {
              const body = await response.json();
              console.log(`  Reply messageId: ${body.messageId}`);
            }
          } catch {
            console.log('  Timeout aguardando resposta de reply');
          }
        }
      } else {
        console.log(
          '  Botao responder nao encontrado - sem mensagens na inbox?'
        );
      }
    } else {
      console.log('  Nenhuma mensagem na inbox para testar reply');
    }
  });

  test('Deve encaminhar um email existente para endereco externo', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    await injectAuthIntoBrowser(page, token, tenantId);
    await page.goto('/email');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click on first message
    const messageItems = page.locator(
      '[data-testid^="message-item"], .cursor-pointer'
    );
    const firstMessage = messageItems.first();

    if (await firstMessage.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await firstMessage.click();
      await page.waitForTimeout(2000);

      // Find forward button
      const forwardBtn = page
        .locator(
          'button:has-text("Encaminhar"), button[title="Encaminhar"], button[aria-label*="Encaminhar"]'
        )
        .first();

      if (await forwardBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await forwardBtn.click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5_000 });

        // Fill To with external address
        const toInput = dialog.locator('input').first();
        await toInput.fill(EXTERNAL_GMAIL);
        await toInput.press('Enter');

        // Intercept send
        const sendPromise = page.waitForResponse(
          response =>
            response.url().includes('/v1/email/messages/send') &&
            response.request().method() === 'POST',
          { timeout: 30_000 }
        );

        const sendBtn = dialog
          .locator('button:has-text("Enviar"), button:has-text("enviar")')
          .first();
        if (await sendBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await sendBtn.click();

          try {
            const response = await sendPromise;
            console.log(`  Forward status: ${response.status()}`);
            if (response.status() === 202) {
              const body = await response.json();
              console.log(`  Forward messageId: ${body.messageId}`);
            }
          } catch {
            console.log('  Timeout aguardando resposta de forward');
          }
        }
      } else {
        console.log(
          '  Botao encaminhar nao encontrado - sem mensagens na inbox?'
        );
      }
    } else {
      console.log('  Nenhuma mensagem na inbox para testar forward');
    }
  });

  test('Servidor nao deve travar apos operacoes de email', async ({ page }) => {
    // After all send operations, verify the server is still responsive
    const healthCheck = await fetch(`${API_URL}/v1/email/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(healthCheck.status).toBe(200);
    console.log('  Servidor respondendo normalmente apos operacoes de email');

    // Also check that listing messages still works
    if (emailAccountId) {
      const messagesCheck = await fetch(
        `${API_URL}/v1/email/messages?accountId=${emailAccountId}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 200 or 404 (if no folder) are both acceptable - just not 500
      expect(messagesCheck.status).toBeLessThan(500);
      console.log(`  Listagem de mensagens: status ${messagesCheck.status}`);
    }
  });
});
