/**
 * OpenSea OS — Kiosk offline queue (IndexedDB-backed).
 *
 * Kiosk punches that fail (offline / 5xx) are enqueued here and replayed
 * when connectivity returns. The store is keyed by `requestId` so the
 * same logical punch can be enqueued idempotently — repeated `enqueue`
 * calls upsert the same row rather than creating duplicates.
 *
 * Distinct from the `/punch` PWA queue (`src/lib/pwa/punch-db.ts`) because
 * the kiosk has no JWT / `employeeId` — it authenticates by
 * `x-punch-device-token` and the payload shape is the unified
 * `POST /v1/hr/punch/clock` body (qrToken / pin+matricula / faceEmbedding).
 *
 * Phase 5 — Plan 05-10 / Claude's Discretion C-01.
 */

const DB_NAME = 'opensea-kiosk';
const DB_VERSION = 1;
const STORE = 'offline-punches';

/**
 * A pending kiosk punch. `body` is the opaque POST body the kiosk would
 * have sent (typed loose because its shape evolves with the plan
 * contract — validation happens server-side).
 */
export interface PendingPunch {
  /** UUID — primary key; dedupe handle for idempotent enqueue. */
  requestId: string;
  /** The POST body that failed — replayed verbatim on reconnect. */
  body: unknown;
  /** Epoch ms at enqueue time. */
  createdAt: number;
  /** Device token captured at enqueue time (for server-side auth replay). */
  deviceToken: string;
}

/**
 * Open (or create) the IDB database. Creates the `offline-punches` object
 * store keyed by `requestId` on first open. Every caller awaits a fresh
 * connection — cheap and avoids handle-sharing concurrency headaches.
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'requestId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Enqueue (or upsert) a pending kiosk punch. Safe to call multiple times
 * with the same `requestId` — the IDB `put()` semantics guarantee no
 * duplicate rows, which gives us natural idempotency on the client side.
 */
export async function enqueuePunch(item: PendingPunch): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/**
 * Current number of pending punches in the queue.
 */
export async function pendingCount(): Promise<number> {
  const db = await openDb();
  const count = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return count;
}

/**
 * Iterate pending punches and invoke `submit(item)` for each. Items whose
 * submit resolves are removed from the store. Items whose submit rejects
 * stay in the queue and count as `failed`. The caller owns retry policy
 * (typically: re-run on the next `online` event).
 *
 * Returns the per-batch counters for telemetry / toast copy
 * ("{sent} batidas sincronizadas").
 */
export async function flushQueue(
  submit: (item: PendingPunch) => Promise<void>
): Promise<{ sent: number; failed: number }> {
  const db = await openDb();
  const items = await new Promise<PendingPunch[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as PendingPunch[]) ?? []);
    req.onerror = () => reject(req.error);
  });

  let sent = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await submit(item);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(item.requestId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      sent++;
    } catch {
      failed++;
    }
  }
  db.close();
  return { sent, failed };
}

/**
 * Test-only hard reset — wipes the IDB database entirely so each spec
 * runs against an empty store.
 */
export async function __resetOfflineQueueForTests(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}
