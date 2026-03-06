import { expect, test } from '@playwright/test';
import {
  CALENDAR_PERMISSIONS,
  createCalendarUser,
} from '../helpers/calendar-permissions.helper';
import {
  buildDefaultEventPayload,
  createCalendarEventViaApi,
  inviteParticipantsViaApi,
} from '../helpers/calendar.helper';
import { getAuthenticatedToken } from '../helpers/auth.helper';
import { apiRequest } from '../helpers/storage.helper';
import { getAdminToken } from '../helpers/permissions.helper';

let adminToken: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  adminToken = admin.token;
});

test.describe('Calendar - Enforcement de Backend (403)', () => {
  test('6.1 - Rejeitar create sem calendar.events.create', async () => {
    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-403-create-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const payload = buildDefaultEventPayload(`e2e-cal-403-create-title-${Date.now()}`);
    const { status } = await apiRequest(auth.token, 'POST', '/v1/calendar/events', payload);

    expect(status).toBe(403);
  });

  test('6.2 - Rejeitar update sem calendar.events.update', async () => {
    const event = await createCalendarEventViaApi(
      adminToken,
      buildDefaultEventPayload(`e2e-cal-403-update-${Date.now()}`)
    );

    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-403-update-user-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'PATCH',
      `/v1/calendar/events/${event.id}`,
      { title: 'unauthorized update' }
    );

    expect(status).toBe(403);
  });

  test('6.3 - Rejeitar delete sem calendar.events.delete', async () => {
    const event = await createCalendarEventViaApi(
      adminToken,
      buildDefaultEventPayload(`e2e-cal-403-delete-${Date.now()}`)
    );

    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-403-delete-user-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'DELETE',
      `/v1/calendar/events/${event.id}`
    );

    expect(status).toBe(403);
  });

  test('6.4 - Rejeitar invite sem calendar.participants.invite', async () => {
    const event = await createCalendarEventViaApi(
      adminToken,
      buildDefaultEventPayload(`e2e-cal-403-invite-${Date.now()}`)
    );
    const invited = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-403-invited-${Date.now()}`
    );

    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-403-invite-user-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'POST',
      `/v1/calendar/events/${event.id}/participants`,
      { participants: [{ userId: invited.userId, role: 'GUEST' }] }
    );

    expect(status).toBe(403);
  });

  test('6.5 - Rejeitar respond sem calendar.participants.respond', async () => {
    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-403-respond-user-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const event = await createCalendarEventViaApi(
      adminToken,
      buildDefaultEventPayload(`e2e-cal-403-respond-${Date.now()}`)
    );
    await inviteParticipantsViaApi(adminToken, event.id, [{ userId: user.userId }]);

    const { status } = await apiRequest(
      auth.token,
      'PATCH',
      `/v1/calendar/events/${event.id}/respond`,
      { status: 'ACCEPTED' }
    );

    expect(status).toBe(403);
  });

  test('6.6 - Rejeitar manage reminders sem calendar.reminders.create', async () => {
    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST, CALENDAR_PERMISSIONS.PARTICIPANTS_RESPOND],
      `e2e-cal-403-remind-user-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const event = await createCalendarEventViaApi(
      adminToken,
      buildDefaultEventPayload(`e2e-cal-403-remind-${Date.now()}`)
    );
    await inviteParticipantsViaApi(adminToken, event.id, [{ userId: user.userId }]);

    const { status } = await apiRequest(
      auth.token,
      'PUT',
      `/v1/calendar/events/${event.id}/reminders`,
      { reminders: [{ minutesBefore: 10 }] }
    );

    expect(status).toBe(403);
  });

  test('6.7 - Rejeitar remove participant sem calendar.participants.manage', async () => {
    const event = await createCalendarEventViaApi(
      adminToken,
      buildDefaultEventPayload(`e2e-cal-403-remove-participant-${Date.now()}`)
    );
    const invited = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-403-remove-target-${Date.now()}`
    );
    await inviteParticipantsViaApi(adminToken, event.id, [{ userId: invited.userId }]);

    const user = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-403-remove-actor-${Date.now()}`
    );
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'DELETE',
      `/v1/calendar/events/${event.id}/participants/${invited.userId}`
    );

    expect(status).toBe(403);
  });
});
