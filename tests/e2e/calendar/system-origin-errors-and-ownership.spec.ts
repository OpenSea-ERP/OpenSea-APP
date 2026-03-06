import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  CALENDAR_FULL_PERMISSIONS,
  CALENDAR_PERMISSIONS,
  CORE_PERMISSIONS,
  createCalendarUser,
} from '../helpers/calendar-permissions.helper';
import {
  buildDefaultEventPayload,
  createCalendarEventViaApi,
  inviteParticipantsViaApi,
  navigateToCalendar,
  openCalendarEventByTitle,
  waitForToast,
} from '../helpers/calendar.helper';

let ownerToken: string;
let ownerTenantId: string;
let guestToken: string;
let guestTenantId: string;
let guestUserId: string;

test.beforeAll(async () => {
  const owner = await createCalendarUser(
    [...CALENDAR_FULL_PERMISSIONS, CORE_PERMISSIONS.USERS_LIST],
    `e2e-cal-p3-owner-${Date.now().toString(36)}`
  );
  const ownerAuth = await getAuthenticatedToken(owner.email, owner.password);
  ownerToken = ownerAuth.token;
  ownerTenantId = ownerAuth.tenantId;

  const guest = await createCalendarUser(
    [
      CALENDAR_PERMISSIONS.EVENTS_LIST,
      CALENDAR_PERMISSIONS.PARTICIPANTS_INVITE,
      CALENDAR_PERMISSIONS.PARTICIPANTS_RESPOND,
      CALENDAR_PERMISSIONS.REMINDERS_CREATE,
      CORE_PERMISSIONS.USERS_LIST,
    ],
    `e2e-cal-p3-guest-${Date.now().toString(36)}`
  );
  const guestAuth = await getAuthenticatedToken(guest.email, guest.password);
  guestToken = guestAuth.token;
  guestTenantId = guestAuth.tenantId;
  guestUserId = guest.userId;
});

test.describe('Calendar - P3 Interface (Origem, Erros e Ownership)', () => {
  test('10.1 - Evento de sistema exibe origem e navega para rota mapeada', async ({
    page,
  }) => {
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    const systemTitle = `e2e-system-${Date.now()}`;

    await page.route('**/v1/calendar/events**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [
            {
              id: 'system-event-1',
              tenantId: 'tenant-1',
              title: systemTitle,
              description: 'Evento de sistema para teste',
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
              systemSourceId: 'fin-123',
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
          ],
          meta: { total: 1, page: 1, limit: 50, pages: 1 },
        }),
      });
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, systemTitle);

    await expect(page.locator('text=Sistema')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Ver origem: Lançamento Financeiro')).toBeVisible({
      timeout: 10_000,
    });

    await page.locator('button:has-text("Ver origem: Lançamento Financeiro")').click();
    await expect(page).toHaveURL(/\/finance\/entries\/fin-123/, { timeout: 10_000 });
  });

  test('10.2 - Erro visual ao criar evento (intercept POST)', async ({ page }) => {
    await page.route('**/v1/calendar/events', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Falha forçada no create' }),
      });
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);

    await page.locator('button:has-text("Novo Evento")').click();
    await page.locator('input[placeholder="Nome do evento"]').fill(`e2e-create-error-${Date.now()}`);
    await page.locator('button:has-text("Criar Evento")').click();

    await waitForToast(page, 'Falha forçada no create');
  });

  test('10.3 - Erro visual ao editar evento (intercept PATCH)', async ({ page }) => {
    const title = `e2e-edit-error-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );

    await page.route(`**/v1/calendar/events/${event.id}`, async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Falha forçada no update' }),
        });
        return;
      }
      await route.continue();
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);
    await page.locator('button:has-text("Editar")').click();
    await page.locator('input[placeholder="Nome do evento"]').fill(`${title}-changed`);
    await page.locator('button:has-text("Salvar Alterações")').click();

    await waitForToast(page, 'Falha forçada no update');
  });

  test('10.4 - Erro visual ao convidar participante (intercept POST participants)', async ({
    page,
  }) => {
    const title = `e2e-invite-error-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );

    await page.route(`**/v1/calendar/events/${event.id}/participants`, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Falha forçada no convite' }),
      });
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);
    await page.locator('button:has-text("Convidar")').click();

    await page
      .locator('input[placeholder="Buscar por nome ou e-mail..."]')
      .fill('e2e');
    await page.waitForTimeout(800);
    await page.locator('[role="dialog"] [role="checkbox"]').first().click();
    await page.locator('button:has-text("Convidar (1)")').click();

    await waitForToast(page, 'Falha forçada no convite');
  });

  test('10.5 - Erro visual ao configurar lembrete (intercept PUT reminders)', async ({
    page,
  }) => {
    const title = `e2e-reminder-error-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );
    await inviteParticipantsViaApi(ownerToken, event.id, [{ userId: guestUserId }]);

    await page.route(`**/v1/calendar/events/${event.id}/reminders`, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Falha forçada no lembrete' }),
      });
    });

    await injectAuthIntoBrowser(page, guestToken, guestTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    const reminderCombo = page.locator('button[role="combobox"]').last();
    await reminderCombo.click();
    await page.locator('[role="option"]:has-text("10 minutos antes")').click();

    await waitForToast(page, 'Falha forçada no lembrete');
  });

  test('10.6 - Usuário convidado com permissão de convite não vê botão Convidar', async ({
    page,
  }) => {
    const title = `e2e-owner-rule-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );
    await inviteParticipantsViaApi(ownerToken, event.id, [{ userId: guestUserId }]);

    await injectAuthIntoBrowser(page, guestToken, guestTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await expect(page.locator('button:has-text("Convidar")')).toHaveCount(0);
  });
});
