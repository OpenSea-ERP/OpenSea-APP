'use client';

/**
 * Phase 8 / Plan 08-03 / Task 2 — D-08-03-01.
 *
 * `useMutation` que orquestra o flow self-justify:
 *   1. (Sequencial) Para cada `File` em `attachments`, chama
 *      `punchApprovalsService.uploadSelfEvidence` → coleta `storageKey`s.
 *      Sequencial intencional para respeitar a quota IDB do device (D-09).
 *   2. Chama `punchApprovalsService.createSelf` passando os `evidenceFileKeys`.
 *
 * Em caso de falha durante (1) o erro é propagado e a `PunchApproval` NÃO é
 * criada — o frontend reapresenta o form com a lista de anexos preservada
 * para retry. Não tentamos limpar arquivos já enviados ao S3 (orphan keys
 * são GC'ed por job futuro Phase 9 retention).
 *
 * Sucesso invalida `['punch']` broad (cobre punch-feed, today-entries,
 * history) para que badges de status reflitam a nova approval.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  punchApprovalsService,
  type CreateSelfPunchApprovalRequest,
  type CreateSelfPunchApprovalResponse,
} from '@/services/hr/punch-approvals.service';

export interface CreateSelfPunchApprovalInput extends CreateSelfPunchApprovalRequest {
  attachments?: File[];
}

export interface CreateSelfPunchApprovalResult extends CreateSelfPunchApprovalResponse {
  evidenceFileKeys: string[];
}

export function useCreateSelfPunchApproval() {
  const qc = useQueryClient();
  return useMutation<
    CreateSelfPunchApprovalResult,
    Error,
    CreateSelfPunchApprovalInput
  >({
    mutationFn: async input => {
      const { attachments, ...body } = input;

      // Step 1 — upload sequencial (respeita quota IDB).
      const uploadedKeys: string[] = [];
      for (const file of attachments ?? []) {
        const upload = await punchApprovalsService.uploadSelfEvidence(file);
        uploadedKeys.push(upload.storageKey);
      }

      // Step 2 — criar PunchApproval com keys validadas pelo backend
      // via headObject (anti phantom — Plan 8-01).
      const created = await punchApprovalsService.createSelf({
        ...body,
        evidenceFileKeys: uploadedKeys.length > 0 ? uploadedKeys : undefined,
      });

      return { ...created, evidenceFileKeys: uploadedKeys };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['punch'] });
    },
  });
}
