import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
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
let guestUsername: string;

test.beforeAll(async () => {
  const owner = await createCalendarUser(
    [
      CALENDAR_PERMISSIONS.EVENTS_LIST,
      CALENDAR_PERMISSIONS.EVENTS_CREATE,
      CALENDAR_PERMISSIONS.PARTICIPANTS_INVITE,
      CALENDAR_PERMISSIONS.PARTICIPANTS_MANAGE,
      CALENDAR_PERMISSIONS.REMINDERS_CREATE,
      CORE_PERMISSIONS.USERS_LIST,
    ],
    `e2e-cal-owner-${Date.now().toString(36)}`
  );
  const ownerAuth = await getAuthenticatedToken(owner.email, owner.password);
  ownerToken = ownerAuth.token;
  ownerTenantId = ownerAuth.tenantId;

  const guest = await createCalendarUser(
    [
      CALENDAR_PERMISSIONS.EVENTS_LIST,
      CALENDAR_PERMISSIONS.PARTICIPANTS_RESPOND,
      CALENDAR_PERMISSIONS.REMINDERS_CREATE,
    ],
    `e2e-cal-guest-${Date.now().toString(36)}`
  );
  const guestAuth = await getAuthenticatedToken(guest.email, guest.password);
  guestToken = guestAuth.token;
  guestTenantId = guestAuth.tenantId;
  guestUserId = guest.userId;
  guestUsername = guest.username;
});

test.describe('Calendar - Participantes, RSVP e Lembretes', () => {
  test('4.1 - Convidar participante via UI', async ({ page }) => {
    const title = `e2e-cal-invite-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, event.title);

    await page.locator('button:has-text("Convidar")').click();
    await expect(page.locator('text=Convidar participantes')).toBeVisible({
      timeout: 5_000,
    });

    await page
      .locator('input[placeholder="Buscar por nome ou e-mail..."]')
      .fill(guestUsername);
    await page.waitForTimeout(600);
    await page.locator('[role="dialog"] [role="checkbox"]').first().click();
    await page.locator('button:has-text("Convidar (1)")').click();

    await waitForToast(page, '1 participante(s) convidado(s)');
  });

  test('4.2 - Participante responde convite e define lembrete', async ({
    page,
  }) => {
    const title = `e2e-cal-rsvp-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );
    await inviteParticipantsViaApi(ownerToken, event.id, [
      { userId: guestUserId, role: 'GUEST' },
    ]);

    await injectAuthIntoBrowser(page, guestToken, guestTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, event.title);

    await expect(page.locator('text=Responder ao convite')).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('button:has-text("Aceitar")').click();
    await waitForToast(page, 'Convite aceito');

    await expect(page.locator('text=Lembrete')).toBeVisible({
      timeout: 10_000,
    });
    const reminderBox = page.locator('button[role="combobox"]').last();
    await reminderBox.click();
    await page.locator('[role="option"]:has-text("10 minutos antes")').click();
    await waitForToast(page, 'Lembrete configurado para 10 minutos antes');
  });
});
