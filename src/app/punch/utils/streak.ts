/**
 * Streak calculation helpers.
 *
 * Lightweight client-side estimation of "days punctually clocked-in in a row".
 * Backend will eventually own the canonical streak (it knows the schedule and
 * the punctuality threshold), but a foreground approximation lets the UI
 * surface immediate feedback after the user punches the clock today.
 *
 * Heuristic: a day "counts" if there is at least one CLOCK_IN registered for
 * that calendar date. A streak breaks on the first prior workday (Mon–Fri)
 * with no CLOCK_IN.
 */

import type { TimeEntry } from '@/types/hr';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function calculateStreak(
  entries: TimeEntry[],
  today: Date = new Date()
): number {
  if (entries.length === 0) return 0;

  const days = new Set<string>();
  for (const entry of entries) {
    if (entry.entryType !== 'CLOCK_IN') continue;
    const date = new Date(entry.timestamp);
    days.add(toIsoDate(date));
  }
  if (days.size === 0) return 0;

  let cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;

  // If user hasn't clocked-in yet today, start counting from yesterday.
  if (!days.has(toIsoDate(cursor))) {
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
  }

  while (true) {
    const isoDate = toIsoDate(cursor);
    const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;

    if (days.has(isoDate)) {
      streak += 1;
      cursor = new Date(cursor.getTime() - ONE_DAY_MS);
      continue;
    }

    if (isWeekend) {
      // Skip weekends silently — they don't break the streak.
      cursor = new Date(cursor.getTime() - ONE_DAY_MS);
      continue;
    }

    break;
  }

  return streak;
}

export function filterToday(
  entries: TimeEntry[],
  today: Date = new Date()
): TimeEntry[] {
  const isoToday = toIsoDate(today);
  return entries.filter(entry => toIsoDate(new Date(entry.timestamp)) === isoToday);
}

export function isWorkingNow(entries: TimeEntry[]): boolean {
  if (entries.length === 0) return false;
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let opened = false;
  for (const entry of sorted) {
    if (entry.entryType === 'CLOCK_IN' || entry.entryType === 'BREAK_END') {
      opened = true;
    } else if (
      entry.entryType === 'CLOCK_OUT' ||
      entry.entryType === 'BREAK_START'
    ) {
      opened = false;
    }
  }
  return opened;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
