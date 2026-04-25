// Wave 0 stub — Phase 9 / Plan 09-01. Implementation arrives in Plan 09-03. See 09-VALIDATION.md.
//
// PUNCH-FRAUD-03 — Device fingerprint util (~40 LOC, in-house, zero deps).
// Plan 09-03 implements `computeDeviceFingerprint` collecting 5 fields
// (canvasHash, userAgent, screen, timezone, language — D-14 / D-15) and
// returning { hash: sha256-hex, raw: { ... } } per the LIA documented in ADR-027.

import { describe, it, expect } from 'vitest';

describe('computeDeviceFingerprint (Plan 09-03 — Wave 0 stub)', () => {
  it('placeholder — Wave 0 RED gate; replaced in Plan 09-03', () => {
    expect(() => require('./device-fingerprint')).toThrow();
  });

  it.skip('retorna { hash, raw }', () => {});
  it.skip('hash é sha256 hex de 64 chars', () => {});
  it.skip('raw inclui 5 campos: canvasHash, userAgent, screen, timezone, language', () => {});
  it.skip('mocked navigator/screen/crypto.subtle → output determinístico', () => {});
});
