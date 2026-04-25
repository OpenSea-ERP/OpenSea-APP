/**
 * Behavior tests for `TodayHistory` (Phase 8 / Plan 08-03 enhancements).
 *
 * Verifies the two new optional fields:
 * - `syncStatus` → renders a `PunchSyncStatusBadge` per row.
 * - `canJustify` → renders an inline "Justificar" link unless `readOnly`.
 *
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TodayHistory, type TimeEntryWithSync } from './today-history';

const baseEntry = (overrides: Partial<TimeEntryWithSync>): TimeEntryWithSync =>
  ({
    id: 'te-1',
    tenantId: 't1',
    employeeId: 'e1',
    entryType: 'CLOCK_IN',
    timestamp: '2026-04-25T08:00:00.000Z',
    createdAt: '2026-04-25T08:00:00.000Z',
    ...overrides,
  }) as TimeEntryWithSync;

describe('TodayHistory — Phase 8 / Plan 08-03', () => {
  it('renders sync status badge per row when syncStatus is present', () => {
    render(
      <TodayHistory
        entries={[
          baseEntry({ id: 'te-pending', syncStatus: 'pending' }),
          baseEntry({
            id: 'te-failed',
            syncStatus: 'failed',
            entryType: 'CLOCK_OUT',
            timestamp: '2026-04-25T17:00:00.000Z',
          }),
        ]}
      />
    );
    expect(screen.getByTestId('punch-sync-status-pending')).toBeTruthy();
    expect(screen.getByTestId('punch-sync-status-failed')).toBeTruthy();
  });

  it('renders inline Justificar link when canJustify=true', () => {
    render(
      <TodayHistory entries={[baseEntry({ id: 'te-99', canJustify: true })]} />
    );
    const link = screen.getByTestId('punch-justify-link');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/punch/justify/te-99');
    expect(link.textContent).toBe('Justificar');
  });

  it('does NOT render Justificar link when canJustify is false/undefined', () => {
    render(<TodayHistory entries={[baseEntry({ id: 'te-no-flag' })]} />);
    expect(screen.queryByTestId('punch-justify-link')).toBeNull();
  });

  it('suppresses Justificar link when readOnly is true', () => {
    render(
      <TodayHistory
        entries={[baseEntry({ id: 'te-r1', canJustify: true })]}
        readOnly
      />
    );
    expect(screen.queryByTestId('punch-justify-link')).toBeNull();
  });
});
