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
  inviteParticipantsViaApi,
  navigateToCalendar,
  openCalendarEventByTitle,
} from '../helpers/calendar.helper';
import { getAdminToken } from '../helpers/permissions.helper';

let adminToken: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  adminToken = admin.token;
});

test.describe('Calendar - Visibilidade por Permissão', () => {
  test('5.1 - Ocultar editar e excluir sem permissões de update/delete', async ({
    page,
  }) => {
    const eventTitle = `e2e-cal-perm-read-${Date.now()}`;
    await createCalendarEventViaApi(adminToken, buildDefaultEventPayload(eventTitle));

    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-perm-read-user-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, eventTitle);

    await expect(page.locator('button:has-text("Editar")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Excluir")')).toHaveCount(0);
  });

  test('5.2 - Ocultar botão de convite para owner sem calendar.participants.invite', async ({
    page,
  }) => {
    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST, CALENDAR_PERMISSIONS.EVENTS_CREATE],
      `e2e-cal-owner-no-invite-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const title = `e2e-cal-owner-event-${Date.now()}`;
    await createCalendarEventViaApi(auth.token, buildDefaultEventPayload(title));

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await expect(page.locator('button:has-text("Convidar")')).toHaveCount(0);
  });

  test('5.3 - Ocultar bloco RSVP sem calendar.participants.respond', async ({
    page,
  }) => {
    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-no-respond-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const title = `e2e-cal-invite-no-respond-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      adminToken,
      buildDefaultEventPayload(title)
    );
    await inviteParticipantsViaApi(adminToken, event.id, [{ userId: user.userId }]);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await expect(page.locator('text=Responder ao convite')).toHaveCount(0);
  });

  test('5.4 - Ocultar bloco de lembrete sem calendar.reminders.create', async ({
    page,
  }) => {
    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST, CALENDAR_PERMISSIONS.PARTICIPANTS_RESPOND],
      `e2e-cal-no-reminder-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const title = `e2e-cal-invite-no-reminder-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      adminToken,
      buildDefaultEventPayload(title)
    );
    await inviteParticipantsViaApi(adminToken, event.id, [{ userId: user.userId }]);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await expect(page.locator('text=Lembrete')).toHaveCount(0);
  });
});
