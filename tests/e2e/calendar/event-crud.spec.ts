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
  createEventViaUi,
  enterActionPin,
  navigateToCalendar,
  openCalendarEventByTitle,
  waitForToast,
} from '../helpers/calendar.helper';
import { setActionPinViaApi } from '../helpers/storage.helper';

const TEST_PIN = '1234';
const TEST_PASSWORD = 'E2eTest@123';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const user = await createCalendarUser(
    [...CALENDAR_FULL_PERMISSIONS, CORE_PERMISSIONS.USERS_LIST],
    `e2e-cal-crud-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  await setActionPinViaApi(userToken, TEST_PASSWORD, TEST_PIN);
});

test.describe('Calendar - CRUD de Eventos', () => {
  test('3.1 - Criar evento via dialog', async ({ page }) => {
    const title = `e2e-cal-create-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await createEventViaUi(page, title);
    await waitForToast(page, 'Evento criado com sucesso');
    await expect(
      page.locator(`.fc-event:has-text("${title}")`).first()
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('3.2 - Validar erro ao criar sem título', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await page.locator('button:has-text("Novo Evento")').click();
    await page.locator('button:has-text("Criar Evento")').click();

    await waitForToast(page, 'O título é obrigatório');
  });

  test('3.3 - Validar erro com data fim anterior ao início', async ({
    page,
  }) => {
    const title = `e2e-cal-invalid-date-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);

    await page.locator('button:has-text("Novo Evento")').click();
    await page.locator('input[placeholder="Nome do evento"]').fill(title);

    const dateInputs = page.locator(
      '[role="dialog"] input[type="datetime-local"]'
    );
    await dateInputs.nth(0).fill('2026-03-01T10:00');
    await dateInputs.nth(1).fill('2026-03-01T09:00');
    await page.locator('button:has-text("Criar Evento")').click();

    await waitForToast(
      page,
      'A data de fim deve ser posterior à data de início'
    );
  });

  test('3.4 - Editar evento existente', async ({ page }) => {
    const oldTitle = `e2e-cal-edit-old-${Date.now()}`;
    const newTitle = `e2e-cal-edit-new-${Date.now()}`;

    await createCalendarEventViaApi(
      userToken,
      buildDefaultEventPayload(oldTitle)
    );

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, oldTitle);

    await page.locator('button:has-text("Editar")').click();
    await expect(page.locator('text=Editar Evento')).toBeVisible({
      timeout: 5_000,
    });
    await page.locator('input[placeholder="Nome do evento"]').fill(newTitle);
    await page.locator('button:has-text("Salvar Alterações")').click();

    await waitForToast(page, 'Evento atualizado com sucesso');
    await page.locator('input[placeholder="Buscar eventos..."]').fill(newTitle);
    await expect(
      page.locator(`.fc-event:has-text("${newTitle}")`).first()
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('3.5 - Excluir evento com PIN', async ({ page }) => {
    const title = `e2e-cal-delete-${Date.now()}`;
    await createCalendarEventViaApi(userToken, buildDefaultEventPayload(title));

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToCalendar(page);
    await openCalendarEventByTitle(page, title);

    await page.locator('button:has-text("Excluir")').click();
    await expect(page.locator('text=Excluir Evento')).toBeVisible({
      timeout: 5_000,
    });

    await enterActionPin(page, TEST_PIN);
    await waitForToast(page, 'Evento excluído com sucesso');
  });
});
