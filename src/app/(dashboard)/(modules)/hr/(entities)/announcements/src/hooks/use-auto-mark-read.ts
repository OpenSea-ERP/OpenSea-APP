'use client';

/**
 * useAutoMarkRead
 *
 * Observes a card element with IntersectionObserver. When the card stays at
 * least `thresholdRatio` visible for `dwellMs` milliseconds, fires `onRead`
 * exactly once for that announcement id.
 *
 * Reference: Notion "viewed" tracking + Slack thread auto-mark-read.
 */

import { useEffect, useRef } from 'react';

interface UseAutoMarkReadOptions {
  announcementId: string;
  /** Whether the announcement was already read (skip observation when true). */
  alreadyRead: boolean;
  /** Visibility ratio in [0, 1]. Default: 0.5 (50% of the card). */
  thresholdRatio?: number;
  /** Dwell time in ms before firing the callback. Default: 2000. */
  dwellMs?: number;
  /** Callback invoked once per id when conditions are met. */
  onRead: (announcementId: string) => void;
}

/**
 * Returns a `ref` to attach to the observed element.
 * Safe to call with `alreadyRead: true` — it short-circuits.
 */
export function useAutoMarkRead({
  announcementId,
  alreadyRead,
  thresholdRatio = 0.5,
  dwellMs = 2000,
  onRead,
}: UseAutoMarkReadOptions) {
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (alreadyRead || firedRef.current) return;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    let dwellTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting && entry.intersectionRatio >= thresholdRatio) {
          if (dwellTimer) clearTimeout(dwellTimer);
          dwellTimer = setTimeout(() => {
            if (firedRef.current) return;
            firedRef.current = true;
            onRead(announcementId);
            observer.disconnect();
          }, dwellMs);
        } else if (dwellTimer) {
          clearTimeout(dwellTimer);
          dwellTimer = null;
        }
      },
      {
        threshold: [0, thresholdRatio, 1],
      }
    );

    observer.observe(element);
    return () => {
      if (dwellTimer) clearTimeout(dwellTimer);
      observer.disconnect();
    };
  }, [announcementId, alreadyRead, thresholdRatio, dwellMs, onRead]);

  return ref;
}
