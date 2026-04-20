/**
 * OpenSea OS - HR Biometria Types
 *
 * Types for face enrollment (EmployeeFaceEnrollment) and punch PIN management.
 * Mirrors the backend contracts from Phase 5 plans 05-03 and 05-05:
 *
 * - POST /v1/hr/employees/:id/face-enrollments   — plan 05-03
 * - GET  /v1/hr/employees/:id/face-enrollments   — plan 05-03
 * - DELETE /v1/hr/employees/:id/face-enrollments — plan 05-03
 * - POST /v1/hr/employees/:id/punch-pin          — plan 05-05
 * - POST /v1/hr/employees/:id/unlock-punch-pin   — plan 05-05
 */

/* -------------------------------------------------------------------------- */
/* Face enrollment                                                            */
/* -------------------------------------------------------------------------- */

export interface FaceEnrollmentDTO {
  id: string;
  employeeId: string;
  /** Numeric position within the enrollment batch (1..5). */
  photoCount: number;
  /** ISO-8601. Raw image is NEVER persisted — only the encrypted embedding. */
  capturedAt: string;
  capturedByUserId: string;
  createdAt: string;
}

export interface CreateFaceEnrollmentsInput {
  employeeId: string;
  /**
   * Array of 128-d embeddings. Length MUST be between 3 and 5 inclusive
   * (validated on both the client modal and the backend Zod schema).
   * Each inner array MUST have length === 128.
   */
  embeddings: number[][];
  /**
   * SHA-256 hex of the EXACT consent text presented to the admin (LGPD D-07).
   * Backend recomputes and rejects on mismatch.
   */
  consentTextHash: string;
}

export interface CreateFaceEnrollmentsResponse {
  enrollments: FaceEnrollmentDTO[];
  /** Count of previously-active enrollments that were soft-deleted. */
  replacedCount: number;
}

export interface ListFaceEnrollmentsResponse {
  items: FaceEnrollmentDTO[];
  count: number;
}

export interface RemoveFaceEnrollmentsResponse {
  removedCount: number;
}

/* -------------------------------------------------------------------------- */
/* Punch PIN (fallback for kiosk)                                             */
/* -------------------------------------------------------------------------- */

export interface SetPunchPinInput {
  employeeId: string;
  /** Exactly 6 digits. Weak / sequential PINs rejected server-side. */
  pin: string;
}

export interface SetPunchPinResponse {
  /** ISO-8601 timestamp of when the PIN was stored. */
  setAt: string;
}

export interface UnlockPunchPinResponse {
  unlockedAt: string;
}
