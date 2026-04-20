'use client';

/**
 * OpenSea OS — Kiosk Wake Lock hook.
 *
 * Acquires a `screen` wake lock on mount so the shared kiosk never goes to
 * sleep while someone is punching in. Re-acquires automatically on
 * `visibilitychange` because the browser silently releases the lock when
 * the tab is hidden (Pitfall 6 in 05-RESEARCH.md).
 *
 * Best-effort: platforms that don't support the Wake Lock API (Safari <16.4,
 * in-app browsers) simply no-op — the kiosk still works, the screen just
 * relies on OS power-settings to stay on.
 *
 * Phase 5 — Plan 05-10 / UI-SPEC §/kiosk — K9 theme + wake lock.
 */

import { useEffect, useRef } from 'react';

/**
 * Minimal shape of the Wake Lock API we rely on. Typed loose so we don't
 * need a `lib` upgrade — the real API adds an `onrelease` listener we
 * intentionally ignore (visibilitychange covers us).
 */
interface WakeLockSentinelLike {
  release(): Promise<void>;
}
interface WakeLockLike {
  request(type: 'screen'): Promise<WakeLockSentinelLike>;
}

export function useWakeLock(): void {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const wakeLock = (navigator as unknown as { wakeLock?: WakeLockLike })
      .wakeLock;
    if (!wakeLock) return; // Unsupported browser — silent no-op.

    let cancelled = false;

    const acquire = async () => {
      try {
        const sentinel = await wakeLock.request('screen');
        if (cancelled) {
          // Component unmounted mid-request — release immediately.
          sentinel.release().catch(() => undefined);
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        // Autoplay / permissions restrictions. Ignore — kiosk still works.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        acquire();
      }
      // On hidden, the browser released the sentinel for us; drop our ref.
      if (document.visibilityState === 'hidden') {
        sentinelRef.current = null;
      }
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      sentinel?.release?.().catch(() => undefined);
    };
  }, []);
}
