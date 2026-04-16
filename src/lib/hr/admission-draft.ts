/**
 * HR Admission Draft Helper
 *
 * Persists in-progress admission wizard data in localStorage so users can
 * resume admission flows across page reloads or browser sessions.
 *
 * Each draft is keyed per user (`hr-admission-draft-{userId}`), allowing
 * multiple users on the same machine to keep independent drafts.
 *
 * The shape is intentionally generic (`Record<string, unknown>` partials) so
 * the wizard can evolve without breaking older drafts — `loadDraft` returns
 * `null` for malformed payloads and the wizard discards anything it does not
 * recognize.
 */

import type { ContractType, WorkRegime } from '@/types/hr';

export type AdmissionDocChecklistStatus =
  | 'pending'
  | 'uploaded'
  | 'approved'
  | 'rejected';

export interface AdmissionDocChecklistEntry {
  /** Internal document type identifier (matches DOCS_CHECKLIST.type) */
  type: string;
  status: AdmissionDocChecklistStatus;
  /** Storage file id when uploaded */
  fileId?: string;
  /** Original file name (for display) */
  fileName?: string;
  /** Optional rejection reason (when status === 'rejected') */
  rejectionReason?: string;
  /** ISO timestamp of last status change */
  updatedAt?: string;
}

export interface AdmissionDraftPayload {
  /** Wizard step the user was on (1-indexed) */
  currentStep?: number;
  /** Toggle: continue even with pending docs */
  allowMissingDocs?: boolean;

  // ---- Step: Docs Checklist ----
  docs?: Record<string, AdmissionDocChecklistEntry>;

  // ---- Step: Candidate Info ----
  fullName?: string;
  email?: string;
  phone?: string;

  // ---- Step: Position / Contract ----
  positionId?: string;
  departmentId?: string;
  expectedStartDate?: string;
  salary?: string;
  contractType?: ContractType | '';
  workRegime?: WorkRegime | '';

  /** ISO timestamp of last save */
  savedAt: string;
}

const STORAGE_PREFIX = 'hr-admission-draft-';

function buildKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Persist the current wizard state for a given user.
 * Silently no-ops on the server or when localStorage is unavailable.
 */
export function saveDraft(
  userId: string,
  payload: Omit<AdmissionDraftPayload, 'savedAt'>
): void {
  if (!isBrowser() || !userId) return;
  try {
    const draft: AdmissionDraftPayload = {
      ...payload,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(buildKey(userId), JSON.stringify(draft));
  } catch {
    // localStorage may be full or disabled (private mode, quota exceeded).
    // Silent failure — the wizard still works in memory.
  }
}

/**
 * Load a previously saved draft. Returns `null` when no draft exists or the
 * stored payload is malformed.
 */
export function loadDraft(userId: string): AdmissionDraftPayload | null {
  if (!isBrowser() || !userId) return null;
  try {
    const raw = localStorage.getItem(buildKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as { savedAt?: unknown }).savedAt !== 'string'
    ) {
      return null;
    }
    return parsed as AdmissionDraftPayload;
  } catch {
    return null;
  }
}

/**
 * Remove the saved draft for a given user. Use after successful submission
 * or when the user explicitly discards the draft.
 */
export function clearDraft(userId: string): void {
  if (!isBrowser() || !userId) return;
  try {
    localStorage.removeItem(buildKey(userId));
  } catch {
    // ignore
  }
}

/**
 * Cheap presence check without parsing the whole payload.
 */
export function hasDraft(userId: string): boolean {
  if (!isBrowser() || !userId) return false;
  try {
    return localStorage.getItem(buildKey(userId)) !== null;
  } catch {
    return false;
  }
}
