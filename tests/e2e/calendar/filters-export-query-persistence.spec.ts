import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  CALENDAR_FULL_PERMISSIONS,
  createCalendarUser,
} from '../helpers/calendar-permissions.helper';
import { navigateToCalendar } from '../helpers/calendar.helper';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const user = await createCalendarUser(
    [...CALENDAR_FULL_PERMISSIONS],
    `e2e-cal-filter-export-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('Calendar - Filtros, Querystring e Persistência', () => {
  test('14.1 - Export usa query com filtros ativos (type/includeSystemEvents/range)', async ({
    page,
  }) => {
    let exportUrl = '';

    await page.route('**/v1/calendar/events/export**', async route => {
      exportUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/calendar',
        body: 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
      });
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await page.locator('button[role="combobox"]').first().click();
    await page.locator('[role="option"]:has-text("Tarefa")').click();
    await page.locator('#system-events').click();

    await page.locator('button:has-text("Exportar iCal")').click();
    await expect(
      page.locator('[data-sonner-toast] :text("Agenda exportada com sucesso")')
    ).toBeVisible({ timeout: 10_000 });

    expect(exportUrl).toContain('/v1/calendar/events/export');
    const params = new URL(exportUrl).searchParams;
    expect(params.get('type')).toBe('TASK');
    expect(params.get('includeSystemEvents')).toBe('false');
    expect(params.get('startDate')).toBeTruthy();
    expect(params.get('endDate')).toBeTruthy();
  });

  test('14.2 - Filtros persistem ao navegar período e trocar view', async ({
    page,
  }) => {
    const requestUrls: string[] = [];

    await page.route('**/v1/calendar/events**', async route => {
      requestUrls.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [],
          meta: { total: 0, page: 1, limit: 50, pages: 1 },
        }),
      });
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await page
      .locator('input[placeholder="Buscar eventos..."]')
      .fill('persist-check');
    await page.locator('button[role="combobox"]').first().click();
    await page.locator('[role="option"]:has-text("Reunião")').click();
    await page.locator('#system-events').click();

    await page.locator('button.fc-next-button').click();
    await page.locator('button.fc-timeGridWeek-button').click();
    await page.waitForTimeout(700);

    await expect(
      page.locator('input[placeholder="Buscar eventos..."]')
    ).toHaveValue('persist-check');
    await expect(page.locator('#system-events')).toHaveAttribute(
      'data-state',
      'unchecked'
    );

    const hasFilteredRequest = requestUrls.some(url => {
      const params = new URL(url).searchParams;
      return (
        params.get('search') === 'persist-check' &&
        params.get('type') === 'MEETING' &&
        params.get('includeSystemEvents') === 'false'
      );
    });

    expect(hasFilteredRequest).toBe(true);
  });
});
