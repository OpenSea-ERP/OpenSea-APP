import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { API_URL } from './auth.helper';

export interface CalendarEventPayload {
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  type?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  color?: string | null;
  rrule?: string | null;
  timezone?: string | null;
}

export function buildDefaultEventPayload(
  title: string,
  startOffsetMinutes = 60
): CalendarEventPayload {
  const start = new Date(Date.now() + startOffsetMinutes * 60_000);
  const end = new Date(start.getTime() + 60 * 60_000);
  return {
    title,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    type: 'CUSTOM',
    visibility: 'PUBLIC',
    isAllDay: false,
    description: null,
    location: null,
    color: null,
    rrule: null,
    timezone: null,
  };
}

export async function createCalendarEventViaApi(
  token: string,
  payload: CalendarEventPayload
): Promise<{ id: string; title: string }> {
  const res = await fetch(`${API_URL}/v1/calendar/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Create calendar event failed (${res.status}): ${await res.text()}`
    );
  }

  const data = await res.json();
  const event = data.event ?? data;
  return { id: event.id, title: event.title };
}

export async function deleteCalendarEventViaApi(
  token: string,
  eventId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/calendar/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(
      `Delete calendar event failed (${res.status}): ${await res.text()}`
    );
  }
}

export async function inviteParticipantsViaApi(
  token: string,
  eventId: string,
  participants: Array<{ userId: string; role?: 'ASSIGNEE' | 'GUEST' }>
): Promise<void> {
  const res = await fetch(
    `${API_URL}/v1/calendar/events/${eventId}/participants`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ participants }),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Invite participants failed (${res.status}): ${await res.text()}`
    );
  }
}

export async function navigateToCalendar(page: Page): Promise<void> {
  await page.goto('/calendar');
  await expect(page.locator('h1:has-text("Agenda")')).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('.fc')).toBeVisible({ timeout: 15_000 });
}

export async function openCalendarEventByTitle(
  page: Page,
  title: string
): Promise<void> {
  const eventItem = page.locator(`.fc-event:has-text("${title}")`).first();
  await expect(eventItem).toBeVisible({ timeout: 15_000 });
  await eventItem.click();
}

export async function createEventViaUi(
  page: Page,
  title: string
): Promise<void> {
  await page.locator('button:has-text("Novo Evento")').click();
  await expect(page.locator('text=Novo Evento')).toBeVisible({
    timeout: 5_000,
  });
  await page.locator('input[placeholder="Nome do evento"]').fill(title);
  await page.locator('button:has-text("Criar Evento")').click();
}

export async function waitForToast(
  page: Page,
  text: string,
  timeout = 10_000
): Promise<Locator> {
  const toast = page.locator(`[data-sonner-toast] :text("${text}")`).first();
  await expect(toast).toBeVisible({ timeout });
  return toast;
}

export async function enterActionPin(page: Page, pin: string): Promise<void> {
  const otpInput = page.locator('[data-input-otp="true"]').first();
  await expect(otpInput).toBeVisible({ timeout: 5_000 });
  await otpInput.focus();
  await page.keyboard.type(pin, { delay: 50 });
  await page.waitForTimeout(300);
}
