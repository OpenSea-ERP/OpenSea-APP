/**
 * offline-queue — unit spec (IndexedDB via `fake-indexeddb/auto` polyfill).
 *
 * Covers the 4 acceptance criteria from Plan 05-10 Task 1:
 *   1. enqueuePunch persists to IDB in the `offline-punches` store.
 *   2. flushQueue iterates pending items, invokes the submit callback,
 *      and removes successful items.
 *   3. pendingCount returns the current store size.
 *   4. Same requestId is deduped — a repeated enqueue upserts, does NOT
 *      create a second row.
 */

// Polyfills `indexedDB` + `IDBKeyRange` as globals before the module under
// test imports. Must be the first statement so happy-dom doesn't race us.
import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetOfflineQueueForTests,
  enqueuePunch,
  flushQueue,
  pendingCount,
  type PendingPunch,
} from './offline-queue';

function makePunch(overrides: Partial<PendingPunch> = {}): PendingPunch {
  return {
    requestId: 'req-1',
    body: { qrToken: 'a'.repeat(64), requestId: 'req-1' },
    createdAt: Date.now(),
    deviceToken: 'dev-token-abc',
    ...overrides,
  };
}

describe('offline-queue (IndexedDB)', () => {
  beforeEach(async () => {
    await __resetOfflineQueueForTests();
  });

  it('enqueuePunch persists to the offline-punches store', async () => {
    await enqueuePunch(makePunch());

    expect(await pendingCount()).toBe(1);
  });

  it('flushQueue invokes submit per pending item and removes successes', async () => {
    await enqueuePunch(makePunch({ requestId: 'req-a' }));
    await enqueuePunch(makePunch({ requestId: 'req-b' }));
    await enqueuePunch(makePunch({ requestId: 'req-c' }));

    const submit = vi.fn<(item: PendingPunch) => Promise<void>>(
      async () => undefined
    );
    const { sent, failed } = await flushQueue(submit);

    expect(submit).toHaveBeenCalledTimes(3);
    expect(sent).toBe(3);
    expect(failed).toBe(0);
    expect(await pendingCount()).toBe(0);
  });

  it('flushQueue keeps failed items in the queue (for retry on next online)', async () => {
    await enqueuePunch(makePunch({ requestId: 'req-ok' }));
    await enqueuePunch(makePunch({ requestId: 'req-fail' }));

    const submit = vi.fn<(item: PendingPunch) => Promise<void>>(async item => {
      if (item.requestId === 'req-fail') throw new Error('5xx');
    });
    const { sent, failed } = await flushQueue(submit);

    expect(sent).toBe(1);
    expect(failed).toBe(1);
    expect(await pendingCount()).toBe(1);
  });

  it('pendingCount returns the current size', async () => {
    expect(await pendingCount()).toBe(0);
    await enqueuePunch(makePunch({ requestId: 'p1' }));
    expect(await pendingCount()).toBe(1);
    await enqueuePunch(makePunch({ requestId: 'p2' }));
    expect(await pendingCount()).toBe(2);
  });

  it('dedupes by requestId — second enqueue upserts the same row', async () => {
    await enqueuePunch(makePunch({ requestId: 'same', createdAt: 1 }));
    await enqueuePunch(makePunch({ requestId: 'same', createdAt: 2 }));

    expect(await pendingCount()).toBe(1);
  });
});
