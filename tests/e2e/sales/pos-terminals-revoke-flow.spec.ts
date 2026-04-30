import { test, expect } from '@playwright/test';
import { loginAndNavigate } from '../helpers/auth.helper';

test.describe('/devices/pos-terminals — revoke flow 4b', () => {
  test('revoga terminal sem sessão aberta', async ({ page }) => {
    const terminalId = process.env.E2E_TERMINAL_NO_SESSION_ID;
    test.skip(
      !terminalId,
      'E2E_TERMINAL_NO_SESSION_ID not set — backend (Plan 01) + seeded terminal required.'
    );
    const adminPin = process.env.E2E_ADMIN_PIN ?? '1234';

    await loginAndNavigate(
      page,
      'admin@teste.com',
      'Teste@123',
      '/devices/pos-terminals'
    );

    await expect(
      page.getByTestId(`pos-terminal-row-${terminalId}`)
    ).toBeVisible({ timeout: 15_000 });

    // Open the row's dropdown menu, then click "Revogar pareamento"
    await page
      .getByTestId(`pos-terminal-row-${terminalId}`)
      .getByRole('button')
      .first()
      .click();
    await page.getByTestId(`pos-terminal-revoke-${terminalId}`).click();

    // VerifyActionPinModal opens — type the 4-digit PIN
    for (const digit of adminPin) {
      await page.keyboard.type(digit);
    }

    // Auto-submits at length 4 OR fall back to clicking "Verificar"
    await Promise.race([
      page
        .getByText(/revogado/i)
        .first()
        .waitFor({ timeout: 10_000 }),
      page
        .getByRole('button', { name: /verificar/i })
        .click({ timeout: 2_000 })
        .then(() =>
          page
            .getByText(/revogado/i)
            .first()
            .waitFor({ timeout: 10_000 })
        ),
    ]).catch(() => {
      // Continue — assertion below is the source of truth.
    });

    await expect(page.getByTestId(`pos-terminal-row-${terminalId}`)).toBeHidden(
      { timeout: 10_000 }
    );
  });

  test('mostra force-revoke dialog quando sessão aberta', async ({ page }) => {
    const terminalId = process.env.E2E_TERMINAL_OPEN_SESSION_ID;
    test.skip(
      !terminalId,
      'E2E_TERMINAL_OPEN_SESSION_ID not set — backend (Plan 01) + seeded terminal with open session required.'
    );
    const adminPin = process.env.E2E_ADMIN_PIN ?? '1234';

    await loginAndNavigate(
      page,
      'admin@teste.com',
      'Teste@123',
      '/devices/pos-terminals'
    );

    await expect(
      page.getByTestId(`pos-terminal-row-${terminalId}`)
    ).toBeVisible({ timeout: 15_000 });

    await page
      .getByTestId(`pos-terminal-row-${terminalId}`)
      .getByRole('button')
      .first()
      .click();
    await page.getByTestId(`pos-terminal-revoke-${terminalId}`).click();

    // First PIN modal — confirm the initial revoke. Backend will respond 409.
    for (const digit of adminPin) {
      await page.keyboard.type(digit);
    }

    // ForceRevokeDialog appears with the open-session warning.
    await expect(
      page.getByRole('heading', { name: /sessão de caixa aberta/i })
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /forçar revogação/i }).click();

    // Second PIN modal — confirm the force=true revoke.
    for (const digit of adminPin) {
      await page.keyboard.type(digit);
    }

    await expect(page.getByText(/sessão descartada/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId(`pos-terminal-row-${terminalId}`)).toBeHidden(
      { timeout: 10_000 }
    );
  });
});
