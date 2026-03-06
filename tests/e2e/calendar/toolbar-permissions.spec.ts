import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  CALENDAR_PERMISSIONS,
  createCalendarUser,
} from '../helpers/calendar-permissions.helper';
import { navigateToCalendar } from '../helpers/calendar.helper';

test.describe('Calendar - Permissões de Toolbar e Criação', () => {
  test('2.1 - Deve ocultar botão "Novo Evento" sem calendar.events.create', async ({
    page,
  }) => {
    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-toolbar-view-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToCalendar(page);

    await expect(page.locator('button:has-text("Novo Evento")')).toHaveCount(0);
    await expect(
      page.locator('button:has-text("Exportar iCal")').first()
    ).toBeVisible();
  });

  test('2.2 - Deve exibir botão "Novo Evento" com calendar.events.create', async ({
    page,
  }) => {
    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST, CALENDAR_PERMISSIONS.EVENTS_CREATE],
      `e2e-cal-toolbar-create-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToCalendar(page);

    await expect(
      page.locator('button:has-text("Novo Evento")').first()
    ).toBeVisible();
  });

  test('2.3 - Clique no dia não abre modal sem permissão de criação', async ({
    page,
  }) => {
    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-dayclick-no-create-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToCalendar(page);

    await page.locator('.fc-daygrid-day[data-date]').first().click();
    await expect(page.locator('[role="dialog"] >> text=Novo Evento')).toHaveCount(0);
  });

  test('2.4 - Clique no dia abre modal com permissão de criação', async ({
    page,
  }) => {
    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST, CALENDAR_PERMISSIONS.EVENTS_CREATE],
      `e2e-cal-dayclick-create-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToCalendar(page);

    await page.locator('.fc-daygrid-day[data-date]').first().click();
    await expect(page.locator('text=Novo Evento')).toBeVisible({ timeout: 5_000 });
  });
});
