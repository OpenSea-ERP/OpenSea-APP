/**
 * Phase 8 / Plan 08-01 — Task 3.
 * IDB v2 helpers spec — usa fake-indexeddb.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

import {
  DB_VERSION,
  enqueuePunch,
  getPendingPunches,
  markPunchFailed,
  markPunchesExpiredOlderThan,
  resetPunchRetry,
  __resetPunchDbForTesting,
  type PendingPunch,
} from './punch-db';

beforeEach(() => {
  // Reset IDB factory entre testes para evitar vazamento de state.
  (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  __resetPunchDbForTesting();
});

afterEach(() => {
  __resetPunchDbForTesting();
});

describe('punch-db v2 (Plan 8-01)', () => {
  it('Test 1 — DB_VERSION === 2 + PendingPunch shape inclui status enum + nextRetryAt + requestId', async () => {
    expect(DB_VERSION).toBe(2);
    const created = await enqueuePunch({
      employeeId: 'emp-1',
      type: 'CLOCK_IN',
    });
    expect(created.status).toBe('pending');
    expect(created.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.nextRetryAt).toBeUndefined();
  });

  it('Test 2 — markPunchFailed(id, msg, { status, nextRetryAt }) atualiza row', async () => {
    const punch = await enqueuePunch({
      employeeId: 'emp-1',
      type: 'CLOCK_IN',
    });
    await markPunchFailed(punch.id, 'network error', {
      status: 'failed',
      nextRetryAt: Date.now() + 30_000,
    });

    const list = await getPendingPunches();
    const updated = list.find(p => p.id === punch.id) as PendingPunch;
    expect(updated.attempts).toBe(1);
    expect(updated.lastError).toBe('network error');
    expect(updated.status).toBe('failed');
    expect(updated.nextRetryAt).toBeGreaterThan(Date.now());

    // Segunda call incrementa attempts.
    await markPunchFailed(punch.id, 'network error', {
      status: 'failed',
      nextRetryAt: Date.now() + 60_000,
    });
    const list2 = await getPendingPunches();
    const updated2 = list2.find(p => p.id === punch.id) as PendingPunch;
    expect(updated2.attempts).toBe(2);
  });

  it('Test 3 — resetPunchRetry zera attempts/status/nextRetryAt/lastError', async () => {
    const punch = await enqueuePunch({
      employeeId: 'emp-1',
      type: 'CLOCK_OUT',
    });
    await markPunchFailed(punch.id, 'fail', {
      status: 'paused',
      nextRetryAt: undefined,
    });
    await markPunchFailed(punch.id, 'fail2', {
      status: 'paused',
      nextRetryAt: undefined,
    });

    await resetPunchRetry(punch.id);
    const list = await getPendingPunches();
    const updated = list.find(p => p.id === punch.id) as PendingPunch;
    expect(updated.attempts).toBe(0);
    expect(updated.status).toBe('pending');
    expect(updated.nextRetryAt).toBeUndefined();
    expect(updated.lastError).toBeNull();
  });

  it('Test 4 — markPunchesExpiredOlderThan(ms) seta status=expired em rows antigas e retorna count', async () => {
    const oldPunch = await enqueuePunch({
      employeeId: 'emp-1',
      type: 'CLOCK_IN',
    });
    const recentPunch = await enqueuePunch({
      employeeId: 'emp-2',
      type: 'CLOCK_IN',
    });

    // Backdate createdAt da oldPunch para 10 dias atrás via raw IDB put
    // (sem deletar — put substitui pelo mesmo id).
    const backdated: PendingPunch = {
      ...(oldPunch as PendingPunch),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('opensea-punch', DB_VERSION);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('pending-punches', 'readwrite');
        tx.objectStore('pending-punches').put(backdated);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });

    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const count = await markPunchesExpiredOlderThan(cutoff);
    expect(count).toBe(1);

    const list2 = await getPendingPunches();
    const expiredPunch = list2.find(p => p.id === oldPunch.id);
    const recentRow = list2.find(p => p.id === recentPunch.id);
    expect(expiredPunch?.status).toBe('expired');
    expect(recentRow?.status).toBe('pending');

    // Idempotência: segunda call retorna 0 (já expired).
    const count2 = await markPunchesExpiredOlderThan(cutoff);
    expect(count2).toBe(0);
  });
});
