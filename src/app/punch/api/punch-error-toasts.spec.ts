// Wave 0 stub — Phase 9 / Plan 09-01. Implementation arrives in Plan 09-03. See 09-VALIDATION.md.
//
// PUNCH-FRAUD UI feedback — surface novos error codes do backend Plan 09-02:
//   - GPS_ACCURACY_LOW → toast 'GPS impreciso' duration 6000 (D-01)
//   - CLOCK_DRIFT → toast 'Relógio do dispositivo desalinhado' duration 8000 (D-07)
//   - RATE_LIMIT_EXCEEDED → showRateLimitToast(retryAfterSec) com countdown (D-18)

import { describe, it, expect } from 'vitest';

describe('punch-error-toasts (Plan 09-03 — Wave 0 stub)', () => {
  it('placeholder — Wave 0 RED gate; replaced in Plan 09-03', () => {
    expect(() => require('./punch-error-toasts')).toThrow();
  });

  it.skip('error.code=GPS_ACCURACY_LOW → toast.error "GPS impreciso" duration 6000', () => {});
  it.skip('error.code=CLOCK_DRIFT → toast.error "Relógio do dispositivo desalinhado" duration 8000', () => {});
  it.skip('error.code=RATE_LIMIT_EXCEEDED → showRateLimitToast(retryAfterSec) com countdown', () => {});
});
