/**
 * OpenSea OS — Kiosk Service Worker registrar.
 *
 * Registers `/sw-kiosk.js` with scope `/kiosk` so the SW can pre-cache the
 * ~6MB face-api model bundle on first load and serve it cache-first on
 * subsequent loads. Requires the `Service-Worker-Allowed: /kiosk` response
 * header on the JS file (wired in `next.config.ts`, see Pitfall 7 of
 * 05-RESEARCH.md).
 *
 * Idempotent — repeated calls reuse the cached registration promise.
 * Silent no-op when the runtime lacks SW support (SSR, older Safari).
 *
 * Phase 5 — Plan 05-10.
 */

const SW_URL = '/sw-kiosk.js';
const SW_SCOPE = '/kiosk';

let cachedRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null =
  null;

export function registerKioskSw(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  if (cachedRegistrationPromise) return cachedRegistrationPromise;

  cachedRegistrationPromise = navigator.serviceWorker
    .register(SW_URL, { scope: SW_SCOPE })
    .then(registration => {
      // Best-effort background update check — prevents a stale SW from
      // pinning old model versions after a weights bump.
      registration.update().catch(() => undefined);
      return registration;
    })
    .catch(err => {
      // Failed to register (e.g., missing Service-Worker-Allowed header,
      // or served over http). Log but do not throw — kiosk still works
      // offline for a paired device, it just won't pre-cache models.
      // eslint-disable-next-line no-console
      console.error('[kiosk-sw] registration failed', err);
      return null;
    });

  return cachedRegistrationPromise;
}

/**
 * Test-only reset — drops the cached registration promise so specs can
 * re-exercise the register path.
 */
export function __resetKioskSwForTests(): void {
  cachedRegistrationPromise = null;
}
