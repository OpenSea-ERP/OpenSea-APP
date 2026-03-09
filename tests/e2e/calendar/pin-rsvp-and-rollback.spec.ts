import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  CALENDAR_FULL_PERMISSIONS,
  CALENDAR_PERMISSIONS,
  createCalendarUser,
} from '../helpers/calendar-permissions.helper';
import {
  buildDefaultEventPayload,
  createCalendarEventViaApi,
  enterActionPin,
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
    [...CALENDAR_FULL_PERMISSIONS, 'core.users.list'],
    `e2e-cal-p4-owner-${Date.now().toString(36)}`
  );
  const ownerAuth = await getAuthenticatedToken(owner.email, owner.password);
  ownerToken = ownerAuth.token;
  ownerTenantId = ownerAuth.tenantId;

  const guest = await createCalendarUser(
    [
      CALENDAR_PERMISSIONS.EVENTS_LIST,
      CALENDAR_PERMISSIONS.PARTICIPANTS_RESPOND,
    ],
    `e2e-cal-p4-guest-${Date.now().toString(36)}`
  );
  const guestAuth = await getAuthenticatedToken(guest.email, guest.password);
  guestToken = guestAuth.token;
  guestTenantId = guestAuth.tenantId;
  guestUserId = guest.userId;
});

test.describe('Calendar - PIN, RSVP e Rollback Visual', () => {
  test('13.1 - PIN inválido não exclui evento e mantém item na UI', async ({
    page,
  }) => {
    const title = `e2e-cal-pin-invalid-${Date.now()}`;
    await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );

    await page.route('**/v1/me/verify-action-pin', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: false }),
      });
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await page.locator('button:has-text("Excluir")').click();
    await enterActionPin(page, '0000');
    await waitForToast(page, 'PIN incorreto. Tente novamente.');

    await page.locator('[role="dialog"] button:has-text("Cancelar")').click();
    await expect(
      page.locator(`.fc-event:has-text("${title}")`).first()
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('13.2 - Cancelar modal de exclusão não altera evento', async ({
    page,
  }) => {
    const title = `e2e-cal-pin-cancel-${Date.now()}`;
    await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await page.locator('button:has-text("Excluir")').click();
    await expect(page.locator('text=Excluir Evento')).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('[role="dialog"] button:has-text("Cancelar")').click();

    await expect(
      page.locator(`.fc-event:has-text("${title}")`).first()
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('13.3 - RSVP recusar e talvez exibem feedback correto', async ({
    page,
  }) => {
    const title = `e2e-cal-rsvp-decline-tentative-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );
    await inviteParticipantsViaApi(ownerToken, event.id, [
      { userId: guestUserId },
    ]);

    await injectAuthIntoBrowser(page, guestToken, guestTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await page.locator('button:has-text("Recusar")').click();
    await waitForToast(page, 'Convite recusado');

    await page.locator('button:has-text("Talvez")').click();
    await waitForToast(page, 'Convite respondido com talvez');
  });

  test('13.4 - Erro ao excluir faz rollback visual (evento permanece)', async ({
    page,
  }) => {
    const title = `e2e-cal-delete-rollback-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );

    await page.route('**/v1/me/verify-action-pin', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true }),
      });
    });

    await page.route(`**/v1/calendar/events/${event.id}`, async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Falha forçada na exclusão' }),
        });
        return;
      }
      await route.continue();
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await page.locator('button:has-text("Excluir")').click();
    await enterActionPin(page, '9999');
    await waitForToast(page, 'Falha forçada na exclusão');

    await expect(
      page.locator(`.fc-event:has-text("${title}")`).first()
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('13.5 - Erro ao editar mantém título anterior no calendário', async ({
    page,
  }) => {
    const oldTitle = `e2e-cal-update-rollback-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(oldTitle)
    );
    const newTitle = `${oldTitle}-changed`;

    await page.route(`**/v1/calendar/events/${event.id}`, async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Falha forçada no update rollback' }),
        });
        return;
      }
      await route.continue();
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, oldTitle);
    await page.locator('button:has-text("Editar")').click();
    await page.locator('input[placeholder="Nome do evento"]').fill(newTitle);
    await page.locator('button:has-text("Salvar Alterações")').click();
    await waitForToast(page, 'Falha forçada no update rollback');

    await expect(
      page.locator(`.fc-event:has-text("${oldTitle}")`).first()
    ).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator(`.fc-event:has-text("${newTitle}")`)).toHaveCount(
      0
    );
  });
});
