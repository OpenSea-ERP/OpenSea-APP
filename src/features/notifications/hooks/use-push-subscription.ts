'use client';

import { useCallback, useEffect, useState } from 'react';

import { registerPushDevice } from '../services/notifications-v2.service';
import { fetchVapidPublicKey } from './use-vapid-public-key';

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

/**
 * Phase 8 / Plan 08-01 — D-03/A1.
 *
 * Opções para parametrizar QUAL service worker registrar e o scope.
 * Default mantém compatibilidade com o dashboard (`/sw.js`).
 *
 * Para a PWA pessoal de ponto, chame com:
 *   `usePushSubscription({ swPath: '/sw-punch.js', swScope: '/punch' })`.
 *
 * O hook agora também consome o endpoint público `/v1/public/vapid-key`
 * via `fetchVapidPublicKey()` em vez de depender de
 * `NEXT_PUBLIC_VAPID_PUBLIC_KEY` env var (resolução A1).
 */
export interface UsePushSubscriptionOptions {
  swPath?: string;
  swScope?: string;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function usePushSubscription(options?: UsePushSubscriptionOptions) {
  const swPath = options?.swPath ?? '/sw.js';
  const swScope = options?.swScope;
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermission);
  }, []);

  const subscribe = useCallback(
    async (deviceName?: string) => {
      if (typeof window === 'undefined') return null;
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        throw new Error('Browser does not support web push');
      }

      setSubscribing(true);
      try {
        const perm = await Notification.requestPermission();
        setPermission(perm as PushPermission);
        if (perm !== 'granted') return null;

        const registration =
          (await navigator.serviceWorker.getRegistration(swPath)) ??
          (await navigator.serviceWorker.register(
            swPath,
            swScope ? { scope: swScope } : undefined
          ));

        // Phase 8 / Plan 08-01 — A1: VAPID key via endpoint público.
        const vapid = await fetchVapidPublicKey();
        if (!vapid) {
          throw new Error('VAPID public key not configured on server');
        }

        let sub = await registration.pushManager.getSubscription();
        if (!sub) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapid)
              .buffer as ArrayBuffer,
          });
        }

        const json = sub.toJSON();
        await registerPushDevice({
          endpoint: json.endpoint!,
          keys: {
            p256dh: json.keys!.p256dh,
            auth: json.keys!.auth,
          },
          deviceName,
          userAgent: navigator.userAgent,
        });
        return json.endpoint ?? null;
      } finally {
        setSubscribing(false);
      }
    },
    [swPath, swScope]
  );

  return { permission, subscribe, subscribing };
}
