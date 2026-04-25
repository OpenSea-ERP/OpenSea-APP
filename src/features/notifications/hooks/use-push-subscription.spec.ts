/**
 * Phase 8 / Plan 08-01 — Task 3.3.
 * usePushSubscription parametrizado para SW path/scope + consumir VAPID
 * key via endpoint público.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('../services/notifications-v2.service', () => ({
  registerPushDevice: vi.fn().mockResolvedValue(undefined),
}));

import { apiClient } from '@/lib/api-client';
import { registerPushDevice } from '../services/notifications-v2.service';
import { __resetVapidCacheForTesting } from './use-vapid-public-key';
import { usePushSubscription } from './use-push-subscription';

const swRegistration = {
  pushManager: {
    getSubscription: vi.fn(),
    subscribe: vi.fn(),
  },
};

const mockSubscription = {
  toJSON: () => ({
    endpoint: 'https://push.example/abc',
    keys: { p256dh: 'p256-mock', auth: 'auth-mock' },
  }),
};

beforeEach(() => {
  vi.clearAllMocks();
  __resetVapidCacheForTesting();

  // Mock Notification API.
  (globalThis as unknown as { Notification: unknown }).Notification = {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  };

  // Mock navigator.serviceWorker.
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      getRegistration: vi.fn(),
      register: vi.fn(),
    },
    configurable: true,
  });

  swRegistration.pushManager.getSubscription = vi.fn().mockResolvedValue(null);
  swRegistration.pushManager.subscribe = vi
    .fn()
    .mockResolvedValue(mockSubscription);
});

afterEach(() => {
  __resetVapidCacheForTesting();
});

describe('usePushSubscription parametrizado (Plan 8-01)', () => {
  it('Test 10 — { swPath: "/sw-punch.js", swScope: "/punch" } → register("/sw-punch.js", { scope: "/punch" })', async () => {
    (
      navigator.serviceWorker.getRegistration as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(null);
    (
      navigator.serviceWorker.register as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(swRegistration);

    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      publicKey: 'AQID',
    });

    const { result } = renderHook(() =>
      usePushSubscription({ swPath: '/sw-punch.js', swScope: '/punch' })
    );

    await act(async () => {
      await result.current.subscribe('iPhone-test');
    });

    expect(navigator.serviceWorker.getRegistration).toHaveBeenCalledWith(
      '/sw-punch.js'
    );
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
      '/sw-punch.js',
      { scope: '/punch' }
    );
  });

  it('Test 11 — subscribe() chama fetchVapidPublicKey e usa em pushManager.subscribe', async () => {
    (
      navigator.serviceWorker.getRegistration as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(swRegistration);

    // Base64url válido (passa pelo atob após o normalize -/+ _//).
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      publicKey: 'AQIDBAUGBwgJCgsM',
    });

    const { result } = renderHook(() =>
      usePushSubscription({ swPath: '/sw-punch.js', swScope: '/punch' })
    );

    await act(async () => {
      await result.current.subscribe();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/v1/public/vapid-key');
    expect(swRegistration.pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        userVisibleOnly: true,
      })
    );
    expect(registerPushDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'p256-mock', auth: 'auth-mock' },
      })
    );
  });

  it('default sem options usa /sw.js', async () => {
    (
      navigator.serviceWorker.getRegistration as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(null);
    (
      navigator.serviceWorker.register as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(swRegistration);
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      publicKey: 'AQID',
    });

    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
      '/sw.js',
      undefined
    );
  });

  it('VAPID 503 → subscribe() lança erro (CLAUDE.md regra 2: never silent fallback)', async () => {
    (
      navigator.serviceWorker.getRegistration as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(swRegistration);
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('VAPID not configured')
    );

    const { result } = renderHook(() =>
      usePushSubscription({ swPath: '/sw-punch.js', swScope: '/punch' })
    );

    await waitFor(async () => {
      await expect(result.current.subscribe()).rejects.toThrow(
        /VAPID not configured/i
      );
    });
  });
});
