'use client';

/**
 * useOfflinePunch
 *
 * Single source of truth for the punch CTA on the PWA. It tries the network
 * first, falls back to the IndexedDB queue when the request fails or the user
 * is offline, and replays the queue automatically as soon as connectivity is
 * restored. Listens for postMessage broadcasts from `public/sw-punch.js`
 * so the pending counter stays in sync even when the Service Worker is the
 * one resolving the queue.
 */

import {
  countPendingPunches,
  enqueuePunch,
  getPendingPunches,
  markPunchFailed,
  removePunch,
  type PendingPunch,
  type PunchType,
} from '@/lib/pwa/punch-db';
import { punchApi, type PunchRequest } from '@/app/punch/api/punch.api';
import type { TimeEntry } from '@/types/hr';
import { useCallback, useEffect, useRef, useState } from 'react';

export type PunchOutcome =
  | { status: 'synced'; entry: TimeEntry }
  | { status: 'queued'; pending: PendingPunch };

interface PunchInput extends PunchRequest {
  type: PunchType;
}

interface UseOfflinePunchReturn {
  /** True while a foreground POST is in flight. */
  isSubmitting: boolean;
  /** Live network state from `navigator.onLine` + window listeners. */
  isOnline: boolean;
  /** Number of queued (unsynced) punches in IndexedDB. */
  pendingCount: number;
  /** True while the auto-flusher is replaying queued punches. */
  isSyncing: boolean;
  /** Submits a punch with online-first / queue-on-failure semantics. */
  submitPunch: (input: PunchInput) => Promise<PunchOutcome>;
  /** Imperatively triggers a flush of the IndexedDB queue. */
  flushQueue: () => Promise<void>;
}

const SW_BROADCAST_SOURCE = 'opensea-punch-sw';

export function useOfflinePunch(): UseOfflinePunchReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isFlushingRef = useRef(false);

  /* ---------- Pending counter ---------- */

  const refreshPendingCount = useCallback(async () => {
    try {
      const total = await countPendingPunches();
      setPendingCount(total);
    } catch {
      /* IDB unavailable — treat as zero pending */
    }
  }, []);

  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  /* ---------- Online / offline listeners ---------- */

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /* ---------- Service Worker broadcasts ---------- */

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data as
        | { source?: string; kind?: string }
        | undefined;
      if (!payload || payload.source !== SW_BROADCAST_SOURCE) return;
      void refreshPendingCount();
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [refreshPendingCount]);

  /* ---------- Queue flusher ---------- */

  const flushQueue = useCallback(async (): Promise<void> => {
    if (isFlushingRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    isFlushingRef.current = true;
    setIsSyncing(true);

    try {
      const queue = await getPendingPunches();
      for (const punch of queue) {
        const request: PunchRequest = {
          employeeId: punch.employeeId,
          latitude: punch.latitude,
          longitude: punch.longitude,
          notes: punch.notes,
        };
        try {
          if (punch.type === 'CLOCK_IN') {
            await punchApi.clockIn(request);
          } else {
            await punchApi.clockOut(request);
          }
          await removePunch(punch.id);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'unknown';
          await markPunchFailed(punch.id, message);
          throw err;
        }
      }

      // Ask the SW to flush as well (covers SW-queued items the foreground
      // doesn't see on first load).
      if (
        typeof navigator !== 'undefined' &&
        navigator.serviceWorker?.controller
      ) {
        navigator.serviceWorker.controller.postMessage({ type: 'punch:flush' });
      }
    } finally {
      isFlushingRef.current = false;
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [refreshPendingCount]);

  // Auto-flush when (re)connecting or when pending items appear.
  useEffect(() => {
    if (!isOnline) return;
    if (pendingCount === 0) return;
    void flushQueue();
  }, [isOnline, pendingCount, flushQueue]);

  /* ---------- Public submitter ---------- */

  const submitPunch = useCallback(
    async (input: PunchInput): Promise<PunchOutcome> => {
      const { type, ...request } = input;

      const queueLocally = async (): Promise<PunchOutcome> => {
        const pending = await enqueuePunch({
          employeeId: request.employeeId,
          type,
          latitude: request.latitude,
          longitude: request.longitude,
          notes: request.notes,
        });
        await refreshPendingCount();
        return { status: 'queued', pending };
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return queueLocally();
      }

      setIsSubmitting(true);
      try {
        const entry =
          type === 'CLOCK_IN'
            ? await punchApi.clockIn(request)
            : await punchApi.clockOut(request);
        return { status: 'synced', entry };
      } catch {
        return queueLocally();
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshPendingCount]
  );

  return {
    isSubmitting,
    isOnline,
    pendingCount,
    isSyncing,
    submitPunch,
    flushQueue,
  };
}
