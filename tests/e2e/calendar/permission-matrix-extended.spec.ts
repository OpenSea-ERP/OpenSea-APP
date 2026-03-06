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

async function createOwnerWithPermissions(permissionCodes: string[], suffix: string) {
  const user = await createCalendarUser(
    [CALENDAR_PERMISSIONS.EVENTS_LIST, CALENDAR_PERMISSIONS.EVENTS_CREATE, ...permissionCodes],
    `e2e-cal-matrix-owner-${suffix}-${Date.now()}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  return { ...user, ...auth };
}

test.describe('Calendar - Matriz Estendida de Permissões (UI)', () => {
  test('11.1 - Com update sem delete: mostra Editar e oculta Excluir', async ({
    page,
  }) => {
    const owner = await createOwnerWithPermissions(
      [CALENDAR_PERMISSIONS.EVENTS_UPDATE],
      'upd-only'
    );
    const title = `e2e-cal-matrix-upd-${Date.now()}`;
    await createCalendarEventViaApi(owner.token, buildDefaultEventPayload(title));

    await injectAuthIntoBrowser(page, owner.token, owner.tenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await expect(page.locator('button:has-text("Editar")')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("Excluir")')).toHaveCount(0);
  });

  test('11.2 - Com delete sem update: mostra Excluir e oculta Editar', async ({
    page,
  }) => {
    const owner = await createOwnerWithPermissions(
      [CALENDAR_PERMISSIONS.EVENTS_DELETE],
      'del-only'
    );
    const title = `e2e-cal-matrix-del-${Date.now()}`;
    await createCalendarEventViaApi(owner.token, buildDefaultEventPayload(title));

    await injectAuthIntoBrowser(page, owner.token, owner.tenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await expect(page.locator('button:has-text("Excluir")')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("Editar")')).toHaveCount(0);
  });

  test('11.3 - Com manage participants sem invite: remove aparece e Convidar não', async ({
    page,
  }) => {
    const owner = await createOwnerWithPermissions(
      [CALENDAR_PERMISSIONS.PARTICIPANTS_MANAGE],
      'manage-no-invite'
    );
    const guest = await createCalendarUser(
      [CALENDAR_PERMISSIONS.EVENTS_LIST],
      `e2e-cal-matrix-guest-${Date.now()}`
    );
    const title = `e2e-cal-matrix-manage-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      owner.token,
      buildDefaultEventPayload(title)
    );
    await inviteParticipantsViaApi(owner.token, event.id, [{ userId: guest.userId }]);

    await injectAuthIntoBrowser(page, owner.token, owner.tenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await expect(page.locator('button:has-text("Convidar")')).toHaveCount(0);
    await expect(page.locator('text=Participantes')).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('div.flex.items-center.gap-2\\.5 button.h-6.w-6').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('11.4 - Convidado com respond vê RSVP, mas não vê Convidar mesmo com invite', async ({
    page,
  }) => {
    const owner = await createOwnerWithPermissions(
      [CALENDAR_PERMISSIONS.PARTICIPANTS_INVITE],
      'owner-invite'
    );
    const guest = await createCalendarUser(
      [
        CALENDAR_PERMISSIONS.EVENTS_LIST,
        CALENDAR_PERMISSIONS.PARTICIPANTS_RESPOND,
        CALENDAR_PERMISSIONS.PARTICIPANTS_INVITE,
      ],
      `e2e-cal-matrix-guest2-${Date.now()}`
    );
    const guestAuth = await getAuthenticatedToken(guest.email, guest.password);

    const title = `e2e-cal-matrix-rsvp-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      owner.token,
      buildDefaultEventPayload(title)
    );
    await inviteParticipantsViaApi(owner.token, event.id, [{ userId: guest.userId }]);

    await injectAuthIntoBrowser(page, guestAuth.token, guestAuth.tenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await expect(page.locator('text=Responder ao convite')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("Convidar")')).toHaveCount(0);
  });
});
