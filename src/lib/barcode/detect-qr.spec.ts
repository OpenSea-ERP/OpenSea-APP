/**
 * detect-qr — unit spec.
 *
 * Covers all 4 paths:
 *   1. Native BarcodeDetector returns a QR.
 *   2. Native BarcodeDetector throws → falls through to jsQR.
 *   3. Native is undefined → directly uses jsQR (lazy import invoked).
 *   4. Neither path finds a QR → returns null.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the `jsqr` module so we can assert the lazy dynamic-import is invoked
// and control the decoded payload per test.
const mockJsQR = vi.fn();
vi.mock('jsqr', () => ({
  default: (
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): { data: string } | null => mockJsQR(data, width, height),
}));

import { __resetDetectQrForTests, detectQr } from './detect-qr';

/**
 * Build a minimal stand-in for HTMLCanvasElement that `detectQr` can
 * consume — just enough to satisfy the `getContext('2d').getImageData`
 * path when jsQR is used. The native path only cares that `detector.detect`
 * is called, so the canvas reference itself doesn't need to be real.
 */
function mockCanvas(): HTMLCanvasElement {
  return {
    width: 4,
    height: 4,
    getContext: () => ({
      getImageData: () => ({
        data: new Uint8ClampedArray(64),
        width: 4,
        height: 4,
      }),
    }),
  } as unknown as HTMLCanvasElement;
}

describe('detectQr', () => {
  const originalBarcodeDetector = (globalThis as Record<string, unknown>)
    .BarcodeDetector;

  beforeEach(() => {
    mockJsQR.mockReset();
    __resetDetectQrForTests();
  });

  afterEach(() => {
    // Restore whatever BarcodeDetector presence existed before the test.
    if (originalBarcodeDetector === undefined) {
      delete (globalThis as Record<string, unknown>).BarcodeDetector;
    } else {
      (globalThis as Record<string, unknown>).BarcodeDetector =
        originalBarcodeDetector;
    }
  });

  it('uses native BarcodeDetector when available and returns rawValue', async () => {
    const detect = vi.fn().mockResolvedValue([{ rawValue: 'native-token' }]);
    // Use a plain constructor function — `vi.fn().mockImplementation(() => ...)`
    // cannot be used with `new`, which is how `detectQr` instantiates the API.
    function FakeBarcodeDetector(this: { detect: typeof detect }) {
      this.detect = detect;
    }
    (globalThis as Record<string, unknown>).BarcodeDetector =
      FakeBarcodeDetector;

    const result = await detectQr(mockCanvas());

    expect(result).toBe('native-token');
    expect(detect).toHaveBeenCalledTimes(1);
    expect(mockJsQR).not.toHaveBeenCalled();
  });

  it('falls through to jsQR when native BarcodeDetector throws', async () => {
    const detect = vi.fn().mockRejectedValue(new Error('unsupported'));
    function FakeBarcodeDetector(this: { detect: typeof detect }) {
      this.detect = detect;
    }
    (globalThis as Record<string, unknown>).BarcodeDetector =
      FakeBarcodeDetector;
    mockJsQR.mockReturnValue({ data: 'fallback-token' });

    const result = await detectQr(mockCanvas());

    expect(result).toBe('fallback-token');
    expect(detect).toHaveBeenCalledTimes(1);
    expect(mockJsQR).toHaveBeenCalledTimes(1);
  });

  it('directly uses jsQR when native BarcodeDetector is undefined', async () => {
    // Ensure no native API exists.
    delete (globalThis as Record<string, unknown>).BarcodeDetector;
    mockJsQR.mockReturnValue({ data: 'jsqr-token' });

    const result = await detectQr(mockCanvas());

    expect(result).toBe('jsqr-token');
    expect(mockJsQR).toHaveBeenCalledTimes(1);
  });

  it('returns null when neither native nor jsQR finds a QR', async () => {
    delete (globalThis as Record<string, unknown>).BarcodeDetector;
    mockJsQR.mockReturnValue(null);

    const result = await detectQr(mockCanvas());

    expect(result).toBeNull();
    expect(mockJsQR).toHaveBeenCalledTimes(1);
  });
});
