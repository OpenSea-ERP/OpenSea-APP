'use client';

/**
 * Phase 8 / Plan 08-01 — A1 resolution.
 *
 * Hook + plain async helper para fetch da VAPID public key via endpoint
 * público `GET /v1/public/vapid-key`. A chave por design não é segredo
 * (RFC 8292), então admin só seta o backend env (`VAPID_PUBLIC_KEY`) e
 * cliente cacheia em-memória após primeiro fetch (browsers cacheiam o
 * response indefinidamente — invalidação só acontece com page reload).
 *
 * `fetchVapidPublicKey()` é a forma programática usada por `subscribe()`
 * em `use-push-subscription.ts` (chamado fora de useEffect).
 */

import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';

let cachedKey: string | null = null;
let inflight: Promise<string> | null = null;

export async function fetchVapidPublicKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  if (inflight) return inflight;
  inflight = apiClient
    .get<{ publicKey: string }>('/v1/public/vapid-key')
    .then(res => {
      cachedKey = res.publicKey;
      return cachedKey;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export interface UseVapidPublicKeyResult {
  key: string | null;
  error: Error | null;
}

export function useVapidPublicKey(): UseVapidPublicKeyResult {
  const [key, setKey] = useState<string | null>(cachedKey);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedKey) {
      setKey(cachedKey);
      return;
    }
    fetchVapidPublicKey()
      .then(setKey)
      .catch(e => setError(e instanceof Error ? e : new Error(String(e))));
  }, []);

  return { key, error };
}

/**
 * Test-only helper para resetar o cache em-memória entre tests.
 * Não usar em código de produto.
 */
export function __resetVapidCacheForTesting(): void {
  cachedKey = null;
  inflight = null;
}
