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
  enterActionPin,
  inviteParticipantsViaApi,
  navigateToCalendar,
  openCalendarEventByTitle,
  waitForToast,
} from '../helpers/calendar.helper';
import { setActionPinViaApi } from '../helpers/storage.helper';

const TEST_PIN = '1234';
const TEST_PASSWORD = 'E2eTest@123';

let ownerToken: string;
let ownerTenantId: string;
let guestToken: string;
let guestTenantId: string;
let guestUserId: string;
let guestUsername: string;

test.beforeAll(async () => {
  const owner = await createCalendarUser(
    [...CALENDAR_FULL_PERMISSIONS, CORE_PERMISSIONS.USERS_LIST],
    `e2e-cal-p2-owner-${Date.now().toString(36)}`
  );
  const ownerAuth = await getAuthenticatedToken(owner.email, owner.password);
  ownerToken = ownerAuth.token;
  ownerTenantId = ownerAuth.tenantId;
  await setActionPinViaApi(ownerToken, TEST_PASSWORD, TEST_PIN);

  const guest = await createCalendarUser(
    [
      CALENDAR_PERMISSIONS.EVENTS_LIST,
      CALENDAR_PERMISSIONS.PARTICIPANTS_RESPOND,
      CALENDAR_PERMISSIONS.REMINDERS_CREATE,
    ],
    `e2e-cal-p2-guest-${Date.now().toString(36)}`
  );
  const guestAuth = await getAuthenticatedToken(guest.email, guest.password);
  guestToken = guestAuth.token;
  guestTenantId = guestAuth.tenantId;
  guestUserId = guest.userId;
  guestUsername = guest.username;
});

test.describe('Calendar - P2 Interface (Detalhe e Interações Avançadas)', () => {
  test('9.1 - Renderizar detalhe completo (badges, metadata e all-day)', async ({
    page,
  }) => {
    const title = `e2e-cal-detail-all-day-${Date.now()}`;
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    await createCalendarEventViaApi(ownerToken, {
      title,
      description: 'Descricao detalhada para teste',
      location: 'Auditório Principal',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      isAllDay: true,
      type: 'MEETING',
      visibility: 'PRIVATE',
      color: '#3b82f6',
      rrule: 'RRULE:FREQ=WEEKLY;COUNT=3',
      timezone: 'UTC',
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await expect(page.locator('text=Recorrente')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('text=Privado')).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('text=Descricao detalhada para teste')
    ).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('text=Auditório Principal')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('text=UTC')).toBeVisible({ timeout: 10_000 });
  });

  test('9.2 - Remover participante com PIN', async ({ page }) => {
    const title = `e2e-cal-remove-participant-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );
    await inviteParticipantsViaApi(ownerToken, event.id, [
      { userId: guestUserId },
    ]);

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    const participantRow = page
      .locator('div.flex.items-center.gap-2\\.5')
      .filter({ hasText: guestUsername });
    await expect(participantRow).toBeVisible({ timeout: 10_000 });
    await participantRow.locator('button').last().click();

    await expect(page.locator('text=Remover Participante')).toBeVisible({
      timeout: 5_000,
    });
    await enterActionPin(page, TEST_PIN);
    await waitForToast(page, 'Participante removido');
  });

  test('9.3 - Configurar e remover lembrete (Sem lembrete)', async ({
    page,
  }) => {
    const title = `e2e-cal-reminder-remove-${Date.now()}`;
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

    const reminderCombo = page.locator('button[role="combobox"]').last();
    await reminderCombo.click();
    await page.locator('[role="option"]:has-text("10 minutos antes")').click();
    await waitForToast(page, 'Lembrete configurado para 10 minutos antes');

    await reminderCombo.click();
    await page.locator('[role="option"]:has-text("Sem lembrete")').click();
    await waitForToast(page, 'Lembrete removido');
  });

  test('9.4 - Convite exibe estado vazio para usuário inexistente e exclui já participante', async ({
    page,
  }) => {
    const title = `e2e-cal-invite-empty-${Date.now()}`;
    const event = await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );
    await inviteParticipantsViaApi(ownerToken, event.id, [
      { userId: guestUserId },
    ]);

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await page.locator('button:has-text("Convidar")').click();
    await expect(page.locator('text=Convidar participantes')).toBeVisible({
      timeout: 5_000,
    });

    await page
      .locator('input[placeholder="Buscar por nome ou e-mail..."]')
      .fill('usuario-inexistente-1234');
    await expect(page.locator('text=Nenhum usuário encontrado')).toBeVisible({
      timeout: 10_000,
    });

    await page
      .locator('input[placeholder="Buscar por nome ou e-mail..."]')
      .fill(guestUsername);
    await expect(page.locator('text=Nenhum usuário encontrado')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('9.5 - Edição autoexpande campos já preenchidos', async ({ page }) => {
    const title = `e2e-cal-edit-prefilled-${Date.now()}`;
    await createCalendarEventViaApi(ownerToken, {
      ...buildDefaultEventPayload(title),
      description: 'Texto preexistente',
      location: 'Sala B',
      timezone: 'UTC',
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=5',
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);
    await page.locator('button:has-text("Editar")').click();

    await expect(page.locator('text=Editar Evento')).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.locator(
        '[role="dialog"] textarea[placeholder="Descrição do evento"]'
      )
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('[role="dialog"] input[placeholder="Local do evento"]')
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[role="dialog"] text=Repetições')).toBeVisible({
      timeout: 10_000,
    });
  });
});
