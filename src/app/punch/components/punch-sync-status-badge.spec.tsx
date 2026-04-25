/**
 * Behavior tests for `PunchSyncStatusBadge`.
 *
 * Phase 8 / Plan 08-03 / Task 1.
 *
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PunchSyncStatusBadge } from './punch-sync-status-badge';

describe('PunchSyncStatusBadge', () => {
  it('renders amber pending badge with tooltip', () => {
    render(<PunchSyncStatusBadge status="pending" />);
    const badge = screen.getByTestId('punch-sync-status-pending');
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('title')).toBe('Aguardando envio');
    expect(badge.className).toContain('amber');
  });

  it('renders sky syncing badge with spinning loader', () => {
    render(<PunchSyncStatusBadge status="syncing" />);
    const badge = screen.getByTestId('punch-sync-status-syncing');
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('sky');
    // Loader2 icon should have animate-spin class
    expect(badge.innerHTML).toContain('animate-spin');
  });

  it('renders emerald synced badge', () => {
    render(<PunchSyncStatusBadge status="synced" />);
    const badge = screen.getByTestId('punch-sync-status-synced');
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('emerald');
    expect(badge.getAttribute('title')).toBe('Sincronizada');
  });

  it('renders rose failed badge', () => {
    render(<PunchSyncStatusBadge status="failed" />);
    const badge = screen.getByTestId('punch-sync-status-failed');
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('rose');
    expect(badge.getAttribute('title')).toContain('Falha');
  });
});
