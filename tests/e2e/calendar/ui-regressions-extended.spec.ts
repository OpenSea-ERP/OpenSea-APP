import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  CALENDAR_FULL_PERMISSIONS,
  CORE_PERMISSIONS,
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
    [...CALENDAR_FULL_PERMISSIONS, CORE_PERMISSIONS.USERS_LIST],
    `e2e-cal-ui-reg-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('Calendar - Regressões Estendidas de Interface', () => {
  test('12.1 - Toggle de eventos do sistema oculta eventos com systemSourceType', async ({
    page,
  }) => {
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    const systemTitle = `sys-${Date.now()}`;
    const customTitle = `custom-${Date.now()}`;

    await page.route('**/v1/calendar/events**', async route => {
      const url = new URL(route.request().url());
      const includeSystem =
        url.searchParams.get('includeSystemEvents') !== 'false';
      const events = includeSystem
        ? [
            {
              id: 'ev-system',
              tenantId: 'tenant',
              title: systemTitle,
              description: null,
              location: null,
              startDate: now.toISOString(),
              endDate: later.toISOString(),
              isAllDay: false,
              type: 'FINANCE_DUE',
              visibility: 'PUBLIC',
              color: null,
              rrule: null,
              timezone: null,
              systemSourceType: 'FINANCE_ENTRY',
              systemSourceId: 'entry-1',
              metadata: {},
              createdBy: 'system',
              creatorName: 'Sistema',
              participants: [],
              reminders: [],
              isRecurring: false,
              occurrenceDate: null,
              deletedAt: null,
              createdAt: now.toISOString(),
              updatedAt: null,
            },
            {
              id: 'ev-custom',
              tenantId: 'tenant',
              title: customTitle,
              description: null,
              location: null,
              startDate: now.toISOString(),
              endDate: later.toISOString(),
              isAllDay: false,
              type: 'CUSTOM',
              visibility: 'PUBLIC',
              color: null,
              rrule: null,
              timezone: null,
              systemSourceType: null,
              systemSourceId: null,
              metadata: {},
              createdBy: 'user',
              creatorName: 'Usuário',
              participants: [],
              reminders: [],
              isRecurring: false,
              occurrenceDate: null,
              deletedAt: null,
              createdAt: now.toISOString(),
              updatedAt: null,
            },
          ]
        : [
            {
              id: 'ev-custom',
              tenantId: 'tenant',
              title: customTitle,
              description: null,
              location: null,
              startDate: now.toISOString(),
              endDate: later.toISOString(),
              isAllDay: false,
              type: 'CUSTOM',
              visibility: 'PUBLIC',
              color: null,
              rrule: null,
              timezone: null,
              systemSourceType: null,
              systemSourceId: null,
              metadata: {},
              createdBy: 'user',
              creatorName: 'Usuário',
              participants: [],
              reminders: [],
              isRecurring: false,
              occurrenceDate: null,
              deletedAt: null,
              createdAt: now.toISOString(),
              updatedAt: null,
            },
          ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events,
          meta: { total: events.length, page: 1, limit: 50, pages: 1 },
        }),
      });
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await expect(
      page.locator(`.fc-event:has-text("${systemTitle}")`).first()
    ).toBeVisible();
    await expect(
      page.locator(`.fc-event:has-text("${customTitle}")`).first()
    ).toBeVisible();

    await page.locator('#system-events').click();
    await page.waitForTimeout(500);
    await expect(
      page.locator(`.fc-event:has-text("${systemTitle}")`)
    ).toHaveCount(0);
    await expect(
      page.locator(`.fc-event:has-text("${customTitle}")`).first()
    ).toBeVisible();
  });

  test('12.2 - Alternar Dia inteiro troca tipo dos inputs no create', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await page.locator('button:has-text("Novo Evento")').click();
    const startInput = page
      .locator('[role="dialog"] input[type="datetime-local"]')
      .first();
    await expect(startInput).toBeVisible({ timeout: 10_000 });

    await page.locator('label:has-text("Dia inteiro")').click();
    await expect(
      page.locator('[role="dialog"] input[type="date"]').first()
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('12.3 - Remover recorrência no edit remove badge Recorrente', async ({
    page,
  }) => {
    const title = `e2e-cal-rrule-remove-${Date.now()}`;
    await createCalendarEventViaApi(userToken, {
      ...buildDefaultEventPayload(title),
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);
    await expect(page.locator('text=Recorrente')).toBeVisible({
      timeout: 10_000,
    });

    await page.locator('button:has-text("Editar")').click();
    await page
      .locator('[role="dialog"] label:has-text("Repetir evento")')
      .click();
    await page
      .locator('[role="dialog"] button:has-text("Salvar Alterações")')
      .click();
    await waitForToast(page, 'Evento atualizado com sucesso');

    await openCalendarEventByTitle(page, title);
    await expect(page.locator('text=Recorrente')).toHaveCount(0);
  });

  test('12.4 - Timezone selecionado no create aparece no detalhe', async ({
    page,
  }) => {
    const title = `e2e-cal-timezone-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await page.locator('button:has-text("Novo Evento")').click();
    await page.locator('input[placeholder="Nome do evento"]').fill(title);
    await page.locator('text=Fuso horário').click();
    await page
      .locator('button[role="combobox"]:has-text("America")')
      .first()
      .click();
    await page
      .locator('input[placeholder="Buscar fuso horário..."]')
      .fill('UTC');
    await page.locator('[role="option"]:has-text("UTC")').first().click();
    await page.locator('button:has-text("Criar Evento")').click();
    await waitForToast(page, 'Evento criado com sucesso');

    await openCalendarEventByTitle(page, title);
    await expect(page.locator('text=UTC')).toBeVisible({ timeout: 10_000 });
  });
});
