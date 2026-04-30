import { test, expect } from '@playwright/test';
import { loginAndNavigate } from '../helpers/auth.helper';

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:3333';

test.describe('/devices/pos-terminals — realtime sync update', () => {
  test('atualiza linha do terminal quando backend emite terminal.synced', async ({
    page,
  }) => {
    const deviceToken = process.env.E2E_DEVICE_TOKEN;
    test.skip(
      !deviceToken,
      'E2E_DEVICE_TOKEN not set — backend (Plan 01) + paired terminal required.'
    );

    await loginAndNavigate(
      page,
      'admin@teste.com',
      'Teste@123',
      '/devices/pos-terminals'
    );

    // Wait for the listing to render at least one terminal row.
    await expect(page.getByTestId(/^pos-terminal-row-/).first()).toBeVisible({
      timeout: 15_000,
    });

    // Grab the first row's terminal id from the data-testid attribute.
    const row = page.getByTestId(/^pos-terminal-row-/).first();
    const testIdAttr = await row.getAttribute('data-testid');
    expect(testIdAttr).toBeTruthy();
    const terminalId = testIdAttr!.replace('pos-terminal-row-', '');

    // Snapshot the current "last sync" cell text.
    const before = await page
      .getByTestId(`pos-terminal-last-sync-${terminalId}`)
      .textContent();

    // Fire the same backend endpoint Emporion uses to notify a sync. The
    // backend will broadcast `terminal.synced` to the admin namespace, and
    // useTerminalEvents will patch the cache reactively.
    const newSyncAt = new Date().toISOString();
    const resp = await page.request.post(
      `${API_URL.replace(/\/$/, '')}/v1/pos/sync/notify`,
      {
        headers: {
          'x-pos-device-token': deviceToken,
          'Content-Type': 'application/json',
        },
        data: {
          lastCatalogSyncAt: newSyncAt,
          pendingSales: 0,
          conflictSales: 0,
        },
      }
    );
    expect(resp.status()).toBe(200);

    // Wait for the cell to update reactively (no manual refresh!)
    await expect(async () => {
      const after = await page
        .getByTestId(`pos-terminal-last-sync-${terminalId}`)
        .textContent();
      expect(after).not.toBe(before);
    }).toPass({ timeout: 10_000 });
  });
});
