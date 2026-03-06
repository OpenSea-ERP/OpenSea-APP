import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  CALENDAR_PERMISSIONS,
  createCalendarUser,
} from '../helpers/calendar-permissions.helper';
import {
  buildDefaultEventPayload,
  createCalendarEventViaApi,
  navigateToCalendar,
} from '../helpers/calendar.helper';
import { getAdminToken } from '../helpers/permissions.helper';

let userToken: string;
let userTenantId: string;
let adminToken: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  adminToken = admin.token;

  const user = await createCalendarUser(
    [CALENDAR_PERMISSIONS.EVENTS_LIST],
    `e2e-cal-filters-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('Calendar - Filtros e Exportação', () => {
  test('7.1 - Buscar evento por texto', async ({ page }) => {
    const unique = `e2e-cal-search-${Date.now()}`;
    await createCalendarEventViaApi(adminToken, buildDefaultEventPayload(unique));

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await page.locator('input[placeholder="Buscar eventos..."]').fill(unique);
    await page.waitForTimeout(800);
    await expect(page.locator(`.fc-event:has-text("${unique}")`).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('7.2 - Filtrar eventos por tipo', async ({ page }) => {
    const taskTitle = `e2e-cal-task-${Date.now()}`;
    const meetingTitle = `e2e-cal-meeting-${Date.now()}`;
    await createCalendarEventViaApi(adminToken, {
      ...buildDefaultEventPayload(taskTitle),
      type: 'TASK',
    });
    await createCalendarEventViaApi(adminToken, {
      ...buildDefaultEventPayload(meetingTitle, 120),
      type: 'MEETING',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await page.locator('button[role="combobox"]').first().click();
    await page.locator('[role="option"]:has-text("Tarefa")').click();
    await page.waitForTimeout(800);

    await expect(page.locator(`.fc-event:has-text("${taskTitle}")`).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('7.3 - Exportação iCal com sucesso', async ({ page }) => {
    await page.route('**/v1/calendar/events/export**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/calendar',
        body: 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
      });
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);
    await page.locator('button:has-text("Exportar iCal")').click();

    await expect(
      page.locator('[data-sonner-toast] :text("Agenda exportada com sucesso")')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('7.4 - Exportação iCal com erro', async ({ page }) => {
    await page.route('**/v1/calendar/events/export**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'erro' }),
      });
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);
    await page.locator('button:has-text("Exportar iCal")').click();

    await expect(
      page.locator('[data-sonner-toast] :text("Erro ao exportar agenda")')
    ).toBeVisible({ timeout: 10_000 });
  });
});
