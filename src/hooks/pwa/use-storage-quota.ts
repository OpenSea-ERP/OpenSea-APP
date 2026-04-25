'use client';

import { useEffect, useState } from 'react';

/**
 * Phase 8 / Plan 08-03 / Task 2 — D-09 (offline-first quota).
 *
 * Wraps `navigator.storage.estimate()` exposing whether the IDB allocation is
 * approaching a UX-imposed cap of 15MB (D-09 ratificado pelo CONTEXT.md).
 * The cap is a UX heuristic — não é um hard limit do browser. AttachmentPicker
 * usa `isAtLimit` para bloquear novo anexo e `isNearLimit` para emitir warning.
 *
 * Quando `navigator.storage` é indisponível (browsers antigos, contexto
 * inseguro, SSR) o hook retorna shape neutro `{ used: null, ... }` sem
 * lançar — gating UX-only, não pode quebrar a renderização da página.
 */

const NEAR_LIMIT_BYTES = 12.75 * 1024 * 1024; // 85% de 15MB
const AT_LIMIT_BYTES = 15 * 1024 * 1024;

export interface StorageQuotaState {
  /** Bytes usados pelo origin (IDB + caches + SW), null se indisponível. */
  used: number | null;
  /** Bytes ainda disponíveis dentro do hard quota do browser. */
  available: number | null;
  /** Hard quota do browser (varia por device). */
  quota: number | null;
  /** > 12.75MB (85% do cap UX). */
  isNearLimit: boolean;
  /** > 15MB (cap UX — bloqueia novo anexo). */
  isAtLimit: boolean;
}

const NEUTRAL_STATE: StorageQuotaState = {
  used: null,
  available: null,
  quota: null,
  isNearLimit: false,
  isAtLimit: false,
};

export function useStorageQuota(): StorageQuotaState {
  const [state, setState] = useState<StorageQuotaState>(NEUTRAL_STATE);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (!navigator.storage || !navigator.storage.estimate) return;

    let cancelled = false;
    navigator.storage
      .estimate()
      .then(estimate => {
        if (cancelled) return;
        const used = estimate.usage ?? 0;
        const quota = estimate.quota ?? null;
        const available = quota !== null ? Math.max(0, quota - used) : null;
        setState({
          used,
          available,
          quota,
          isNearLimit: used >= NEAR_LIMIT_BYTES && used < AT_LIMIT_BYTES,
          isAtLimit: used >= AT_LIMIT_BYTES,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // Failures are non-critical (browser refused estimate, etc) — keep
        // neutral state. Caller treats as "no info" not "no space".
        setState(NEUTRAL_STATE);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
