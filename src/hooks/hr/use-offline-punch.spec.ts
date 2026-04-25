/**
 * Phase 8 / Plan 08-01 — Task 3.
 * useOfflinePunch backoff + TTL + retryNow spec.
 *
 * Cobertura mínima do plan (specs 5..9):
 *  - flushQueue skipa entries com status='paused'/'expired' ou nextRetryAt > Date.now().
 *  - markPunchFailed é chamado com nextRetryAt = Date.now() + 30s no 1º fail.
 *  - após 4 falhas (BACKOFF_SEQUENCE_MS.length), status='paused' e nextRetryAt=undefined.
 *  - retryNow(id) chama resetPunchRetry e dispara flushQueue.
 *  - TTL gate marca expired entries > 7 dias.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

import { useOfflinePunch } from './use-offline-punch';
import {
  enqueuePunch,
  getPendingPunches,
  __resetPunchDbForTesting,
  type PendingPunch,
} from '@/lib/pwa/punch-db';

vi.mock('@/app/punch/api/punch.api', () => ({
  punchApi: {
    clockIn: vi.fn(),
    clockOut: vi.fn(),
    getConfig: vi.fn(),
    validateGeofence: vi.fn(),
  },
}));

import { punchApi } from '@/app/punch/api/punch.api';

beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  __resetPunchDbForTesting();
  // Garantia de online + sem service worker.
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  __resetPunchDbForTesting();
});

describe('useOfflinePunch backoff (Plan 8-01)', () => {
  it('Test 5 — flushQueue skipa entries com status=paused/expired ou nextRetryAt > Date.now()', async () => {
    // navigator.onLine=false para evitar auto-flush no mount do hook.
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    });

    // Pre-seed 3 entries: paused, futura, válida.
    const pausedPunch = await enqueuePunch({
      employeeId: 'emp-1',
      type: 'CLOCK_IN',
    });
    const futurePunch = await enqueuePunch({
      employeeId: 'emp-2',
      type: 'CLOCK_IN',
    });
    const okPunch = await enqueuePunch({
      employeeId: 'emp-3',
      type: 'CLOCK_OUT',
    });

    // Override status via IDB raw put.
    const list = await getPendingPunches();
    const target1 = list.find(p => p.id === pausedPunch.id) as PendingPunch;
    target1.status = 'paused';
    const target2 = list.find(p => p.id === futurePunch.id) as PendingPunch;
    target2.nextRetryAt = Date.now() + 60_000;
    target2.status = 'failed';

    await new Promise<void>(resolve => {
      const req = indexedDB.open('opensea-punch', 2);
      req.onsuccess = () => {
        const tx = req.result.transaction('pending-punches', 'readwrite');
        tx.objectStore('pending-punches').put(target1);
        tx.objectStore('pending-punches').put(target2);
        tx.oncomplete = () => {
          req.result.close();
          resolve();
        };
      };
    });

    (punchApi.clockOut as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'te-1',
    });

    const { result } = renderHook(() => useOfflinePunch());
    await waitFor(() => expect(result.current.pendingCount).toBe(3));

    // Volta online para permitir flush manual.
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
      writable: true,
    });

    await act(async () => {
      await result.current.flushQueue();
    });

    // Apenas a okPunch (status=pending) foi tentada.
    expect(punchApi.clockOut).toHaveBeenCalledTimes(1);
    expect(punchApi.clockIn).not.toHaveBeenCalled();
    // okPunch removida; outras 2 ainda na fila.
    const after = await getPendingPunches();
    expect(after.find(p => p.id === okPunch.id)).toBeUndefined();
    expect(after.find(p => p.id === pausedPunch.id)).toBeDefined();
    expect(after.find(p => p.id === futurePunch.id)).toBeDefined();
  });

  it('Test 6 — após 1ª falha, markPunchFailed escreve nextRetryAt = now + 30s + status=failed', async () => {
    const punch = await enqueuePunch({
      employeeId: 'emp-1',
      type: 'CLOCK_IN',
    });

    (punchApi.clockIn as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('network down')
    );

    const t0 = Date.now();
    const { result } = renderHook(() => useOfflinePunch());
    await waitFor(() => expect(result.current.pendingCount).toBe(1));

    await act(async () => {
      await result.current.flushQueue();
    });

    const after = await getPendingPunches();
    const updated = after.find(p => p.id === punch.id) as PendingPunch;
    expect(updated.attempts).toBe(1);
    expect(updated.status).toBe('failed');
    expect(updated.nextRetryAt).toBeGreaterThanOrEqual(t0 + 30_000 - 1000);
    expect(updated.nextRetryAt).toBeLessThanOrEqual(t0 + 30_000 + 5_000);
  });

  it('Test 7 — após 4+ falhas (esgota backoff), status=paused e nextRetryAt=undefined', async () => {
    const punch = await enqueuePunch({
      employeeId: 'emp-1',
      type: 'CLOCK_IN',
    });
    (punchApi.clockIn as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('network')
    );

    const { result } = renderHook(() => useOfflinePunch());
    await waitFor(() => expect(result.current.pendingCount).toBe(1));

    // 5 flushes seguidos — limpa nextRetryAt entre eles para não pular o gate.
    for (let i = 0; i < 5; i++) {
      // Reset nextRetryAt para forçar tentativa.
      const list = await getPendingPunches();
      const target = list.find(p => p.id === punch.id) as PendingPunch;
      if (target && target.status !== 'paused') {
        target.nextRetryAt = undefined;
        await new Promise<void>(resolve => {
          const req = indexedDB.open('opensea-punch', 2);
          req.onsuccess = () => {
            const tx = req.result.transaction('pending-punches', 'readwrite');
            tx.objectStore('pending-punches').put(target);
            tx.oncomplete = () => {
              req.result.close();
              resolve();
            };
          };
        });
      }
      await act(async () => {
        await result.current.flushQueue();
      });
    }

    const after = await getPendingPunches();
    const updated = after.find(p => p.id === punch.id) as PendingPunch;
    expect(updated.status).toBe('paused');
    expect(updated.nextRetryAt).toBeUndefined();
    expect(updated.attempts).toBeGreaterThanOrEqual(5);
  });

  it('Test 8 — retryNow(id) reseta retry e dispara flushQueue', async () => {
    const punch = await enqueuePunch({
      employeeId: 'emp-1',
      type: 'CLOCK_IN',
    });

    // Pre-mark como paused.
    const list = await getPendingPunches();
    const target = list.find(p => p.id === punch.id) as PendingPunch;
    target.status = 'paused';
    target.attempts = 5;
    await new Promise<void>(resolve => {
      const req = indexedDB.open('opensea-punch', 2);
      req.onsuccess = () => {
        const tx = req.result.transaction('pending-punches', 'readwrite');
        tx.objectStore('pending-punches').put(target);
        tx.oncomplete = () => {
          req.result.close();
          resolve();
        };
      };
    });

    (punchApi.clockIn as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'te-x',
    });

    const { result } = renderHook(() => useOfflinePunch());
    await waitFor(() => expect(result.current.pendingCount).toBe(1));

    await act(async () => {
      await result.current.retryNow(punch.id);
    });

    expect(punchApi.clockIn).toHaveBeenCalledTimes(1);
    const after = await getPendingPunches();
    expect(after.find(p => p.id === punch.id)).toBeUndefined();
  });

  it('Test 9 — TTL 7 dias: entries antigas viram status=expired e console.warn é emitido', async () => {
    const punch = await enqueuePunch({
      employeeId: 'emp-1',
      type: 'CLOCK_IN',
    });

    // Backdate createdAt para 10 dias atrás.
    const list = await getPendingPunches();
    const target = list.find(p => p.id === punch.id) as PendingPunch;
    target.createdAt = new Date(
      Date.now() - 10 * 24 * 60 * 60 * 1000
    ).toISOString();
    await new Promise<void>(resolve => {
      const req = indexedDB.open('opensea-punch', 2);
      req.onsuccess = () => {
        const tx = req.result.transaction('pending-punches', 'readwrite');
        tx.objectStore('pending-punches').put(target);
        tx.oncomplete = () => {
          req.result.close();
          resolve();
        };
      };
    });

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result } = renderHook(() => useOfflinePunch());
    await waitFor(() => expect(result.current.pendingCount).toBe(1));

    await act(async () => {
      await result.current.flushQueue();
    });

    expect(warn).toHaveBeenCalled();
    expect(
      warn.mock.calls.some(c => /expirou|expired|7 dias/i.test(String(c[0])))
    ).toBe(true);

    const after = await getPendingPunches();
    const expired = after.find(p => p.id === punch.id) as PendingPunch;
    expect(expired.status).toBe('expired');
    warn.mockRestore();
  });
});
