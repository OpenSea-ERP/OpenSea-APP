// Wave 0 stub — Phase 9 / Plan 09-01. Implementation arrives in Plan 09-03. See 09-VALIDATION.md.
//
// D-04 — Mock GPS detection client-side (heurísticas baseadas em 2 fixes consecutivos).
// Plan 09-03 implements `detectMockGps(fix1, fix2)` retornando boolean:
//   - coords idênticas em ambas as chamadas → suspectMock=true
//   - accuracy=0 → suspectMock=true (implausível em GPS real)
//   - accuracy idêntica exata em 2 fixes → suspectMock=true (real flutua)

import { describe, it, expect } from 'vitest';

describe('detectMockGps (Plan 09-03 — Wave 0 stub)', () => {
  it('placeholder — Wave 0 RED gate; replaced in Plan 09-03', () => {
    expect(() => require('./detect-mock-gps')).toThrow();
  });

  it.skip('coords idênticas em 2 fixes → suspectMock=true', () => {});
  it.skip('accuracy=0 → suspectMock=true', () => {});
  it.skip('accuracy idêntica exata em 2 fixes → suspectMock=true', () => {});
  it.skip('coords variando + accuracy variando → suspectMock=false', () => {});
});
