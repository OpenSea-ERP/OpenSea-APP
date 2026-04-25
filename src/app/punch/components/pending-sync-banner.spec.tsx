/**
 * Behavior tests for `PendingSyncBanner` (Phase 8 / Plan 08-03 — failed variant).
 *
 * @vitest-environment happy-dom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PendingSyncBanner } from './pending-sync-banner';

describe('PendingSyncBanner — failed variant', () => {
  it('renders rose failed banner when failedCount > 0', () => {
    render(
      <PendingSyncBanner
        isOnline
        pendingCount={0}
        isSyncing={false}
        failedCount={2}
        onRetry={() => {}}
      />
    );
    const banner = screen.getByTestId('punch-pending-sync');
    expect(banner.getAttribute('data-sync-state')).toBe('failed');
    expect(banner.textContent).toContain('2 batidas falharam');
    expect(banner.textContent).toContain('Toque para tentar novamente');
    expect(banner.className).toContain('rose');
  });

  it('renders amber pending banner when only pendingCount > 0 and online', () => {
    render(
      <PendingSyncBanner
        isOnline
        pendingCount={3}
        isSyncing={false}
        failedCount={0}
      />
    );
    const banner = screen.getByTestId('punch-pending-sync');
    expect(banner.getAttribute('data-sync-state')).toBe('pending');
    expect(banner.textContent).toContain('3 batidas aguardando');
    expect(banner.className).toContain('amber');
  });

  it('renders rose offline banner when !isOnline (no failed)', () => {
    render(
      <PendingSyncBanner
        isOnline={false}
        pendingCount={1}
        isSyncing={false}
        failedCount={0}
      />
    );
    const banner = screen.getByTestId('punch-pending-sync');
    expect(banner.getAttribute('data-sync-state')).toBe('offline');
    expect(banner.textContent).toContain('offline');
  });

  it('priorities failed > offline (failedCount overrides isOnline=false)', () => {
    render(
      <PendingSyncBanner
        isOnline={false}
        pendingCount={1}
        isSyncing={false}
        failedCount={1}
      />
    );
    const banner = screen.getByTestId('punch-pending-sync');
    expect(banner.getAttribute('data-sync-state')).toBe('failed');
  });

  it('invokes onRetry when retry button clicked', () => {
    const onRetry = vi.fn();
    render(
      <PendingSyncBanner
        isOnline
        pendingCount={0}
        isSyncing={false}
        failedCount={1}
        onRetry={onRetry}
      />
    );
    fireEvent.click(screen.getByTestId('punch-pending-sync-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('returns null when nothing to display', () => {
    const { container } = render(
      <PendingSyncBanner
        isOnline
        pendingCount={0}
        isSyncing={false}
        failedCount={0}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
