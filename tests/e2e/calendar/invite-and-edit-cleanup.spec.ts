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
  inviteParticipantsViaApi,
  navigateToCalendar,
  openCalendarEventByTitle,
  waitForToast,
} from '../helpers/calendar.helper';

let ownerToken: string;
let ownerTenantId: string;
let guestUserId: string;
let guestUsername: string;

test.beforeAll(async () => {
  const owner = await createCalendarUser(
    [...CALENDAR_FULL_PERMISSIONS, CORE_PERMISSIONS.USERS_LIST],
    `e2e-cal-invite-cleanup-owner-${Date.now().toString(36)}`
  );
  const ownerAuth = await getAuthenticatedToken(owner.email, owner.password);
  ownerToken = ownerAuth.token;
  ownerTenantId = ownerAuth.tenantId;

  const guest = await createCalendarUser(
    ['calendar.events.list'],
    `e2e-cal-invite-cleanup-guest-${Date.now().toString(36)}`
  );
  guestUserId = guest.userId;
  guestUsername = guest.username;
});

test.describe('Calendar - Convite Avançado e Limpeza de Campos', () => {
  test('15.1 - Convidar como Responsável (ASSIGNEE) e exibir badge', async ({
    page,
  }) => {
    const title = `e2e-cal-assignee-${Date.now()}`;
    await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);
    await page.locator('button:has-text("Convidar")').click();

    await page
      .locator('input[placeholder="Buscar por nome ou e-mail..."]')
      .fill(guestUsername);
    await page.locator('[role="dialog"] [role="checkbox"]').first().click();
    await page
      .locator('[role="dialog"] button[role="combobox"]')
      .last()
      .click();
    await page.locator('[role="option"]:has-text("Responsável")').click();
    await page.locator('button:has-text("Convidar (1)")').click();
    await waitForToast(page, '1 participante(s) convidado(s)');

    await page.keyboard.press('Escape');
    await openCalendarEventByTitle(page, title);
    await expect(page.locator('text=Responsável')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('15.2 - Falha ao carregar usuários no convite mostra estado seguro', async ({
    page,
  }) => {
    const title = `e2e-cal-invite-users-error-${Date.now()}`;
    await createCalendarEventViaApi(
      ownerToken,
      buildDefaultEventPayload(title)
    );

    await page.route('**/v1/users**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Falha forçada em users list' }),
      });
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);
    await page.locator('button:has-text("Convidar")').click();

    await expect(page.locator('text=Nenhum usuário encontrado')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('15.3 - Limpar descrição/local/timezone no edit remove blocos no detalhe', async ({
    page,
  }) => {
    const title = `e2e-cal-clear-fields-${Date.now()}`;
    await createCalendarEventViaApi(ownerToken, {
      ...buildDefaultEventPayload(title),
      description: 'desc para remover',
      location: 'local para remover',
      timezone: 'UTC',
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);
    await page.locator('button:has-text("Editar")').click();

    await page.locator('textarea[placeholder="Descrição do evento"]').fill('');
    await page.locator('input[placeholder="Local do evento"]').fill('');
    await page.locator('[role="dialog"] text=Fuso horário').first().click();
    await page.locator('button:has-text("Salvar Alterações")').click();
    await waitForToast(page, 'Evento atualizado com sucesso');

    await openCalendarEventByTitle(page, title);
    await expect(page.locator('text=desc para remover')).toHaveCount(0);
    await expect(page.locator('text=local para remover')).toHaveCount(0);
    await expect(page.locator('text=UTC')).toHaveCount(0);
  });
});
