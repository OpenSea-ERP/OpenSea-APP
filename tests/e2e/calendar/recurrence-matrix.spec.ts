import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  CALENDAR_FULL_PERMISSIONS,
  createCalendarUser,
} from '../helpers/calendar-permissions.helper';
import {
  buildDefaultEventPayload,
  createCalendarEventViaApi,
  navigateToCalendar,
  openCalendarEventByTitle,
  waitForToast,
} from '../helpers/calendar.helper';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const user = await createCalendarUser(
    [...CALENDAR_FULL_PERMISSIONS],
    `e2e-cal-rrule-matrix-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('Calendar - Matriz de Recorrência', () => {
  test('16.1 - Criar recorrência diária com intervalo > 1 e count', async ({
    page,
  }) => {
    const title = `e2e-cal-rrule-daily-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await page.locator('button:has-text("Novo Evento")').click();
    await page.locator('input[placeholder="Nome do evento"]').fill(title);
    await page.locator('label:has-text("Repetir evento")').click();
    await page
      .locator('[role="dialog"] button[role="combobox"]')
      .last()
      .click();
    await page.locator('[role="option"]:has-text("Diário")').click();
    await page
      .locator('[role="dialog"] input[type="number"]')
      .first()
      .fill('2');
    await page.locator('input[placeholder="Sem limite"]').fill('5');
    await page.locator('button:has-text("Criar Evento")').click();

    await waitForToast(page, 'Evento criado com sucesso');
    await openCalendarEventByTitle(page, title);
    await expect(page.locator('text=Recorrente')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('16.2 - Parsing de RRULE mensal no edit (FREQ=MONTHLY;INTERVAL=2)', async ({
    page,
  }) => {
    const title = `e2e-cal-rrule-monthly-${Date.now()}`;
    await createCalendarEventViaApi(userToken, {
      ...buildDefaultEventPayload(title),
      rrule: 'RRULE:FREQ=MONTHLY;INTERVAL=2',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);
    await page.locator('button:has-text("Editar")').click();

    await expect(page.locator('[role="dialog"] text=Mensal')).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator('[role="dialog"] input[type="number"]').first()
    ).toHaveValue('2');
  });

  test('16.3 - Parsing semanal com BYDAY e sem count preserva seleção de dias', async ({
    page,
  }) => {
    const title = `e2e-cal-rrule-weekly-byday-${Date.now()}`;
    await createCalendarEventViaApi(userToken, {
      ...buildDefaultEventPayload(title),
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);
    await page.locator('button:has-text("Editar")').click();

    await expect(
      page.locator('[role="dialog"] button[value="MO"][data-state="on"]')
    ).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator('[role="dialog"] button[value="WE"][data-state="on"]')
    ).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('input[placeholder="Sem limite"]')).toHaveValue(
      ''
    );
  });

  test('16.4 - Parsing anual no edit (FREQ=YEARLY;COUNT=3)', async ({
    page,
  }) => {
    const title = `e2e-cal-rrule-yearly-${Date.now()}`;
    await createCalendarEventViaApi(userToken, {
      ...buildDefaultEventPayload(title),
      rrule: 'RRULE:FREQ=YEARLY;COUNT=3',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);
    await page.locator('button:has-text("Editar")').click();

    await expect(page.locator('[role="dialog"] text=Anual')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('input[placeholder="Sem limite"]')).toHaveValue(
      '3'
    );
  });
});
