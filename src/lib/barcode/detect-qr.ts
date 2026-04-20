/**
 * OpenSea OS — QR detector with BarcodeDetector + jsQR fallback.
 *
 * Chrome/Edge (desktop + Android) ship the native `BarcodeDetector`
 * Shape Detection API; Safari, iOS and Firefox do NOT. When native is
 * unavailable (or throws), we lazy-load `jsqr` and run the fallback
 * over a canvas ImageData buffer.
 *
 * Phase 5 — Plan 05-10 / Pattern 4 / Pitfall 1 (RESEARCH.md).
 *
 * Kiosk usage contract:
 *   const canvas = // draw the current video frame into an OffscreenCanvas / HTMLCanvasElement
 *   const token = await detectQr(canvas);
 *   if (token) onQrDetected(token);
 */

/**
 * Lazy-loaded jsQR import. Cached so the ~20KB fallback bundle
 * is only pulled once — on the first frame where it's needed.
 */
let jsQRPromise: Promise<typeof import('jsqr').default> | null = null;

/**
 * Minimal shape of the native BarcodeDetector API we rely on.
 * Kept narrow so TypeScript doesn't need the full DOM lib upgrade.
 */
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
interface BarcodeDetectorConstructorLike {
  new (options?: { formats: readonly string[] }): BarcodeDetectorLike;
}

/**
 * Detect a QR code in the given canvas. Returns the decoded `rawValue`
 * string on success, or `null` if no QR was found (or decoding failed).
 *
 * Behaviour:
 *   1. If `globalThis.BarcodeDetector` exists, try the native path; on
 *      any throw we fall through to jsQR.
 *   2. Otherwise (or after a native throw), lazy-load `jsqr` and decode
 *      the canvas ImageData buffer.
 *   3. Returns null when neither path finds a QR.
 */
export async function detectQr(
  canvas: HTMLCanvasElement
): Promise<string | null> {
  // Native path — Chrome / Edge desktop + Chrome Android. Safari/iOS/Firefox
  // never land here (BarcodeDetector is undefined).
  if ('BarcodeDetector' in globalThis) {
    try {
      const Ctor = (
        globalThis as unknown as {
          BarcodeDetector: BarcodeDetectorConstructorLike;
        }
      ).BarcodeDetector;
      const detector = new Ctor({ formats: ['qr_code'] });
      const codes = await detector.detect(canvas);
      return codes[0]?.rawValue ?? null;
    } catch {
      // Native threw (rare — usually an unsupported format). Fall through
      // to jsQR so the kiosk keeps working on this machine.
    }
  }

  // Fallback path — lazy-load jsQR on first use.
  if (!jsQRPromise) {
    jsQRPromise = import('jsqr').then(m => m.default);
  }
  const jsQR = await jsQRPromise;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(
    imageData.data as unknown as Uint8ClampedArray,
    imageData.width,
    imageData.height
  );
  return result?.data ?? null;
}

/**
 * Test-only hook to reset the lazy jsQR cache between specs. Not exposed
 * to runtime callers (not re-exported from a barrel).
 */
export function __resetDetectQrForTests(): void {
  jsQRPromise = null;
}
