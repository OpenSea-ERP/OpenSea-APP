/**
 * Behavior tests for `useStorageQuota`.
 *
 * @vitest-environment happy-dom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStorageQuota } from './use-storage-quota';

const originalStorage = navigator.storage;

function mockStorageEstimate(estimate: StorageEstimate | undefined) {
  if (estimate === undefined) {
    Object.defineProperty(navigator, 'storage', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    return;
  }
  Object.defineProperty(navigator, 'storage', {
    value: {
      estimate: vi.fn().mockResolvedValue(estimate),
    },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  // Reset to a clean state every test.
});

afterEach(() => {
  Object.defineProperty(navigator, 'storage', {
    value: originalStorage,
    configurable: true,
    writable: true,
  });
});

describe('useStorageQuota', () => {
  it('returns near=false at-limit=false when usage is well below cap', async () => {
    mockStorageEstimate({ usage: 5_000_000, quota: 100_000_000 });
    const { result } = renderHook(() => useStorageQuota());
    await waitFor(() => {
      expect(result.current.used).toBe(5_000_000);
    });
    expect(result.current.isNearLimit).toBe(false);
    expect(result.current.isAtLimit).toBe(false);
    expect(result.current.available).toBe(95_000_000);
  });

  it('flags isNearLimit when usage > 12.75MB and < 15MB', async () => {
    mockStorageEstimate({ usage: 13 * 1024 * 1024, quota: 100 * 1024 * 1024 });
    const { result } = renderHook(() => useStorageQuota());
    await waitFor(() => {
      expect(result.current.isNearLimit).toBe(true);
    });
    expect(result.current.isAtLimit).toBe(false);
  });

  it('flags isAtLimit when usage >= 15MB', async () => {
    mockStorageEstimate({ usage: 16 * 1024 * 1024, quota: 100 * 1024 * 1024 });
    const { result } = renderHook(() => useStorageQuota());
    await waitFor(() => {
      expect(result.current.isAtLimit).toBe(true);
    });
    expect(result.current.isNearLimit).toBe(false);
  });

  it('returns neutral state when navigator.storage is undefined', async () => {
    mockStorageEstimate(undefined);
    const { result } = renderHook(() => useStorageQuota());
    expect(result.current.used).toBeNull();
    expect(result.current.isAtLimit).toBe(false);
    expect(result.current.isNearLimit).toBe(false);
  });
});
