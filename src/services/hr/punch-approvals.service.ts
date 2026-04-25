import { apiClient } from '@/lib/api-client';

/**
 * Phase 8 / Plan 08-03 / Task 2 — D-08-03-01.
 *
 * Service para o flow self-justify da PWA pessoal de ponto.
 *
 *  - `createSelf` cria a `PunchApproval` PENDING (Plan 8-01).
 *  - `uploadSelfEvidence` sobe foto/PDF (Plan 8-03 backend addition,
 *    owner-only, sem PIN, JPG/PNG/PDF até 5MB).
 *
 * NEVER use `|| []` ou silent fallback (CLAUDE.md regra 2). Erros propagam
 * para React Query.
 */

export type CreateSelfPunchApprovalReason =
  | 'OUT_OF_GEOFENCE'
  | 'FACE_MATCH_LOW'
  | 'EMPLOYEE_SELF_REQUEST';

export type CreateSelfPunchApprovalEntryType =
  | 'CLOCK_IN'
  | 'CLOCK_OUT'
  | 'BREAK_START'
  | 'BREAK_END';

export interface CreateSelfPunchApprovalRequest {
  /** Cenário 1 — justificar batida existente. */
  timeEntryId?: string;
  /** Cenário 2 — pedir registro de batida ausente. */
  proposedTimestamp?: string;
  entryType?: CreateSelfPunchApprovalEntryType;
  reason: CreateSelfPunchApprovalReason;
  note?: string;
  /** Storage keys retornadas por `uploadSelfEvidence` (max 3). */
  evidenceFileKeys?: string[];
}

export interface CreateSelfPunchApprovalResponse {
  approvalId: string;
  status: 'PENDING';
  createdAt: string;
}

export interface UploadSelfPunchEvidenceResponse {
  storageKey: string;
  size: number;
  uploadedAt: string;
  filename: string;
  mimeType: string;
}

export const punchApprovalsService = {
  /**
   * POST /v1/hr/punch-approvals — funcionário cria justificativa própria.
   * Phase 8 / Plan 8-01. Sem PIN gate (D-08 ratificado).
   */
  async createSelf(
    body: CreateSelfPunchApprovalRequest
  ): Promise<CreateSelfPunchApprovalResponse> {
    return apiClient.post<CreateSelfPunchApprovalResponse>(
      '/v1/hr/punch-approvals',
      body
    );
  },

  /**
   * POST /v1/hr/punch-approvals/self-evidence — owner-only multipart upload.
   * Phase 8 / Plan 8-03. Aceita JPG/PNG/PDF até 5MB. Retorna storageKey
   * que deve ser passado em `evidenceFileKeys[]` ao criar a approval.
   *
   * Sequencial intencional no caller (`useCreateSelfPunchApproval`) para
   * respeitar a quota IDB do device (D-09).
   */
  async uploadSelfEvidence(
    file: File
  ): Promise<UploadSelfPunchEvidenceResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<UploadSelfPunchEvidenceResponse>(
      '/v1/hr/punch-approvals/self-evidence',
      formData
    );
  },
};
