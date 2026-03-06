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
  navigateToCalendar,
  openCalendarEventByTitle,
  waitForToast,
} from '../helpers/calendar.helper';

let viewOnlyToken: string;
let viewOnlyTenantId: string;
let editorToken: string;
let editorTenantId: string;

test.beforeAll(async () => {
  const viewOnly = await createCalendarUser(
    [CALENDAR_PERMISSIONS.EVENTS_LIST],
    `e2e-cal-ui-view-${Date.now().toString(36)}`
  );
  const viewOnlyAuth = await getAuthenticatedToken(viewOnly.email, viewOnly.password);
  viewOnlyToken = viewOnlyAuth.token;
  viewOnlyTenantId = viewOnlyAuth.tenantId;

  const editor = await createCalendarUser(
    [...CALENDAR_FULL_PERMISSIONS, CORE_PERMISSIONS.USERS_LIST],
    `e2e-cal-ui-edit-${Date.now().toString(36)}`
  );
  const editorAuth = await getAuthenticatedToken(editor.email, editor.password);
  editorToken = editorAuth.token;
  editorTenantId = editorAuth.tenantId;
});

test.describe('Calendar - P1 Interface (Navegação e UI Avançada)', () => {
  test('8.1 - Navegar entre períodos (anterior, próximo e hoje)', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, viewOnlyToken, viewOnlyTenantId);
    await navigateToCalendar(page);

    const title = page.locator('.fc-toolbar-title');
    const initialTitle = (await title.textContent())?.trim() ?? '';
    expect(initialTitle.length).toBeGreaterThan(0);

    await page.locator('button.fc-next-button').click();
    const nextTitle = (await title.textContent())?.trim() ?? '';
    expect(nextTitle).not.toBe(initialTitle);

    await page.locator('button.fc-prev-button').click();
    await page.locator('button.fc-today-button').click();
    await expect(title).toBeVisible();
  });

  test('8.2 - Alternar visualizações Mês/Semana/Dia/Agenda', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, viewOnlyToken, viewOnlyTenantId);
    await navigateToCalendar(page);

    await page.locator('button.fc-timeGridWeek-button').click();
    await expect(page.locator('button.fc-timeGridWeek-button.fc-button-active')).toBeVisible();

    await page.locator('button.fc-timeGridDay-button').click();
    await expect(page.locator('button.fc-timeGridDay-button.fc-button-active')).toBeVisible();

    await page.locator('button.fc-listWeek-button').click();
    await expect(page.locator('button.fc-listWeek-button.fc-button-active')).toBeVisible();

    await page.locator('button.fc-dayGridMonth-button').click();
    await expect(page.locator('button.fc-dayGridMonth-button.fc-button-active')).toBeVisible();
  });

  test('8.3 - Exibir estado vazio com filtros combinados', async ({ page }) => {
    await injectAuthIntoBrowser(page, viewOnlyToken, viewOnlyTenantId);
    await navigateToCalendar(page);

    await page.locator('input[placeholder="Buscar eventos..."]').fill(`none-${Date.now()}`);
    await page.locator('button.fc-listWeek-button').click();

    await expect(page.locator('text=Nenhum evento neste período')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('8.4 - Criar evento com campos avançados de interface', async ({ page }) => {
    const title = `e2e-cal-advanced-${Date.now()}`;
    const description = 'Descricao e2e calendar';
    const location = 'Sala 07';

    await injectAuthIntoBrowser(page, editorToken, editorTenantId);
    await navigateToCalendar(page);

    await page.locator('button:has-text("Novo Evento")').click();
    await page.locator('input[placeholder="Nome do evento"]').fill(title);

    await page.locator('text=Adicionar descrição').click();
    await page.locator('textarea[placeholder="Descrição do evento"]').fill(description);

    await page.locator('text=Adicionar local').click();
    await page.locator('input[placeholder="Local do evento"]').fill(location);

    await page.locator('text=Fuso horário').click();
    await page.locator('button[role="combobox"]:has-text("America")').first().click();
    await page.locator('input[placeholder="Buscar fuso horário..."]').fill('UTC');
    await page.locator('[role="option"]:has-text("UTC")').first().click();

    await page.locator('[role="dialog"] button[aria-label="Selecionar cor Azul"]').click();

    const settingsCombos = page.locator(
      '[role="dialog"] .grid.grid-cols-2.gap-3 button[role="combobox"]'
    );
    await settingsCombos.nth(1).click();
    await page.locator('[role="option"]:has-text("Privado")').click();

    await page.locator('button:has-text("Criar Evento")').click();
    await waitForToast(page, 'Evento criado com sucesso');

    await openCalendarEventByTitle(page, title);
    await expect(page.locator(`text=${description}`)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(`text=${location}`)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Privado')).toBeVisible({ timeout: 10_000 });
  });

  test('8.5 - Criar evento recorrente e exibir badge no detalhe', async ({ page }) => {
    const title = `e2e-cal-rrule-${Date.now()}`;

    await injectAuthIntoBrowser(page, editorToken, editorTenantId);
    await navigateToCalendar(page);

    await page.locator('button:has-text("Novo Evento")').click();
    await page.locator('input[placeholder="Nome do evento"]').fill(title);

    await page.locator('label:has-text("Repetir evento")').click();
    await page.locator('button[role="button"][value="MO"]').click();
    await page.locator('button[role="button"][value="WE"]').click();
    await page.locator('input[placeholder="Sem limite"]').fill('3');

    await page.locator('button:has-text("Criar Evento")').click();
    await waitForToast(page, 'Evento criado com sucesso');

    await openCalendarEventByTitle(page, title);
    await expect(page.locator('text=Recorrente')).toBeVisible({ timeout: 10_000 });
  });

  test('8.6 - Cancelar create e edit sem persistir alterações', async ({ page }) => {
    const originalTitle = `e2e-cal-cancel-${Date.now()}`;
    const changedTitle = `e2e-cal-cancel-changed-${Date.now()}`;
    await createCalendarEventViaApi(editorToken, buildDefaultEventPayload(originalTitle));

    await injectAuthIntoBrowser(page, editorToken, editorTenantId);
    await navigateToCalendar(page);

    await page.locator('button:has-text("Novo Evento")').click();
    await page.locator('input[placeholder="Nome do evento"]').fill('e2e-cancel-create-temp');
    await page.locator('[role="dialog"] button:has-text("Cancelar")').click();
    await expect(page.locator('text=Novo Evento')).toHaveCount(0);

    await openCalendarEventByTitle(page, originalTitle);
    await page.locator('button:has-text("Editar")').click();
    await page.locator('input[placeholder="Nome do evento"]').fill(changedTitle);
    await page.locator('[role="dialog"] button:has-text("Cancelar")').click();

    await openCalendarEventByTitle(page, originalTitle);
    await expect(page.locator('text=Editar Evento')).toHaveCount(0);
  });
});
