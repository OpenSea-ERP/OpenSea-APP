/**
 * Registers the punch Service Worker on first mount.
 *
 * Idempotent — calling it multiple times reuses the existing registration.
 * Returns the registration promise so callers can `await` it when needed
 * (mostly for tests). Silently no-ops when the runtime does not support
 * service workers (older Safari, SSR, in-app browsers without SW support).
 */

const SW_URL = '/sw-punch.js';
const SW_SCOPE = '/punch';

let cachedRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null =
  null;

export function registerPunchServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  if (cachedRegistrationPromise) return cachedRegistrationPromise;

  cachedRegistrationPromise = navigator.serviceWorker
    .register(SW_URL, { scope: SW_SCOPE })
    .then(registration => {
      // Best-effort: trigger an immediate update check on each register call.
      registration.update().catch(() => undefined);
      return registration;
    })
    .catch(() => null);

  return cachedRegistrationPromise;
}

/**
 * Asks the browser for notification permission. Best-effort — never throws,
 * never blocks. Used to surface a "batidas sincronizadas" notification when
 * the SW finishes flushing the queue while the page is in the background.
 */
export async function requestNotificationPermissionIfNeeded(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'denied';
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}
