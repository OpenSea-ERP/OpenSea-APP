/**
 * Phase 8 / Plan 08-01 — Task 3.4.
 * useVapidPublicKey + fetchVapidPublicKey: cache em-memória.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';
import {
  __resetVapidCacheForTesting,
  fetchVapidPublicKey,
  useVapidPublicKey,
} from './use-vapid-public-key';

beforeEach(() => {
  vi.clearAllMocks();
  __resetVapidCacheForTesting();
});

afterEach(() => {
  __resetVapidCacheForTesting();
});

describe('useVapidPublicKey + fetchVapidPublicKey (Plan 8-01)', () => {
  it('Test 12 — cacheia em-memória — segunda chamada NÃO faz novo fetch', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      publicKey: 'BASE64URL-mock-key',
    });

    const k1 = await fetchVapidPublicKey();
    const k2 = await fetchVapidPublicKey();
    expect(k1).toBe('BASE64URL-mock-key');
    expect(k2).toBe('BASE64URL-mock-key');
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('useVapidPublicKey hook surface: key + error após fetch resolver', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      publicKey: 'BASE64URL-mock-key',
    });
    const { result } = renderHook(() => useVapidPublicKey());
    await waitFor(() => expect(result.current.key).toBe('BASE64URL-mock-key'));
    expect(result.current.error).toBeNull();
  });

  it('hook propaga error quando endpoint retorna 503', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('VAPID not configured')
    );
    const { result } = renderHook(() => useVapidPublicKey());
    await waitFor(() =>
      expect(result.current.error?.message).toMatch(/VAPID not configured/i)
    );
    expect(result.current.key).toBeNull();
  });

  it('inflight dedup: chamadas simultâneas reusam a mesma Promise', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ publicKey: 'concurrent-key' }), 50)
        )
    );
    const [a, b, c] = await Promise.all([
      fetchVapidPublicKey(),
      fetchVapidPublicKey(),
      fetchVapidPublicKey(),
    ]);
    expect(a).toBe('concurrent-key');
    expect(b).toBe('concurrent-key');
    expect(c).toBe('concurrent-key');
    // Apenas 1 chamada de fato — inflight dedup funcionou.
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
