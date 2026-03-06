import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  CALENDAR_VIEW_ONLY_PERMISSIONS,
  createCalendarUser,
} from '../helpers/calendar-permissions.helper';
import { navigateToCalendar } from '../helpers/calendar.helper';

test.describe('Calendar - Controle de Acesso à Página', () => {
  test('1.1 - Deve redirecionar sem calendar.events.list', async ({ page }) => {
    const user = await createCalendarUser([], `e2e-cal-no-list-${Date.now()}`);
    const auth = await getAuthenticatedToken(user.email, user.password);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await page.goto('/calendar');
    await page.waitForTimeout(3_000);

    await expect(page.locator('h1:has-text("Agenda")')).not.toBeVisible();
    expect(page.url()).not.toContain('/calendar');
  });

  test('1.2 - Deve acessar página com calendar.events.list', async ({
    page,
  }) => {
    const user = await createCalendarUser(
      [...CALENDAR_VIEW_ONLY_PERMISSIONS],
      `e2e-cal-list-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToCalendar(page);

    await expect(
      page.locator('text=Gerencie eventos, reuniões e compromissos')
    ).toBeVisible();
  });
});
