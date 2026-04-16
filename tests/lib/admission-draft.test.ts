/**
 * Admission Draft Helper Tests
 * Verifies localStorage persistence, isolation per user, and graceful failure
 * for malformed payloads.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDraft,
  hasDraft,
  loadDraft,
  saveDraft,
} from '@/lib/hr/admission-draft';

const USER_ID = 'user-123';
const OTHER_USER_ID = 'user-456';

describe('admission-draft helper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists and restores a draft', () => {
    saveDraft(USER_ID, {
      currentStep: 2,
      fullName: 'João da Silva',
      email: 'joao@example.com',
      docs: {
        RG: { type: 'RG', status: 'uploaded', fileId: 'file-1' },
      },
    });

    const restored = loadDraft(USER_ID);
    expect(restored).not.toBeNull();
    expect(restored?.fullName).toBe('João da Silva');
    expect(restored?.docs?.RG?.fileId).toBe('file-1');
    expect(typeof restored?.savedAt).toBe('string');
  });

  it('returns null when no draft exists', () => {
    expect(loadDraft(USER_ID)).toBeNull();
  });

  it('returns null when stored payload is malformed', () => {
    localStorage.setItem(`hr-admission-draft-${USER_ID}`, 'not-json');
    expect(loadDraft(USER_ID)).toBeNull();
  });

  it('returns null when stored payload lacks savedAt', () => {
    localStorage.setItem(
      `hr-admission-draft-${USER_ID}`,
      JSON.stringify({ fullName: 'X' })
    );
    expect(loadDraft(USER_ID)).toBeNull();
  });

  it('isolates drafts per user', () => {
    saveDraft(USER_ID, { fullName: 'A' });
    saveDraft(OTHER_USER_ID, { fullName: 'B' });

    expect(loadDraft(USER_ID)?.fullName).toBe('A');
    expect(loadDraft(OTHER_USER_ID)?.fullName).toBe('B');
  });

  it('reports presence correctly', () => {
    expect(hasDraft(USER_ID)).toBe(false);
    saveDraft(USER_ID, { fullName: 'A' });
    expect(hasDraft(USER_ID)).toBe(true);
  });

  it('clears a draft without affecting others', () => {
    saveDraft(USER_ID, { fullName: 'A' });
    saveDraft(OTHER_USER_ID, { fullName: 'B' });

    clearDraft(USER_ID);

    expect(hasDraft(USER_ID)).toBe(false);
    expect(hasDraft(OTHER_USER_ID)).toBe(true);
  });

  it('no-ops when userId is empty', () => {
    saveDraft('', { fullName: 'A' });
    expect(loadDraft('')).toBeNull();
    expect(hasDraft('')).toBe(false);
    expect(() => clearDraft('')).not.toThrow();
  });

  it('overwrites a previous draft on save', () => {
    saveDraft(USER_ID, { fullName: 'First', currentStep: 1 });
    saveDraft(USER_ID, { fullName: 'Second', currentStep: 2 });

    const restored = loadDraft(USER_ID);
    expect(restored?.fullName).toBe('Second');
    expect(restored?.currentStep).toBe(2);
  });
});
