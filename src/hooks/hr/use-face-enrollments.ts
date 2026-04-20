'use client';

/**
 * OpenSea OS - Face Enrollments Hooks
 *
 * TanStack Query wrappers over face-enrollments.service.ts.
 * Toast copy matches UI-SPEC §Copywriting §Biometria.
 *
 * Per CLAUDE.md §2: NO silent `|| []` fallbacks — errors propagate to
 * React Query's error state and the UI renders a proper error state.
 */

import { faceEnrollmentsService } from '@/services/hr/face-enrollments.service';
import type {
  CreateFaceEnrollmentsInput,
  CreateFaceEnrollmentsResponse,
  ListFaceEnrollmentsResponse,
  RemoveFaceEnrollmentsResponse,
} from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const FACE_ENROLLMENTS_QUERY_KEY = (employeeId: string) =>
  ['face-enrollments', employeeId] as const;

/**
 * List active enrollments for an employee. Only metadata — no embeddings.
 */
export function useListFaceEnrollments(employeeId: string, enabled = true) {
  return useQuery<ListFaceEnrollmentsResponse>({
    queryKey: FACE_ENROLLMENTS_QUERY_KEY(employeeId),
    queryFn: () => faceEnrollmentsService.list(employeeId),
    enabled: enabled && Boolean(employeeId),
  });
}

/**
 * Create / replace the enrollment batch (3–5 embeddings).
 * Consumers pass `employeeId` to the hook; the mutation payload carries
 * only `embeddings` + `consentTextHash`.
 */
export function useCreateFaceEnrollments(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    CreateFaceEnrollmentsResponse,
    Error,
    Pick<CreateFaceEnrollmentsInput, 'embeddings' | 'consentTextHash'>
  >({
    mutationFn: payload =>
      faceEnrollmentsService.create({ employeeId, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FACE_ENROLLMENTS_QUERY_KEY(employeeId),
      });
      toast.success('Biometria cadastrada com sucesso');
    },
    onError: () => {
      toast.error('Não foi possível salvar a biometria. Tente novamente.');
    },
  });
}

/**
 * Soft-delete all active enrollments for the employee. Admin-only.
 */
export function useRemoveFaceEnrollments(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation<RemoveFaceEnrollmentsResponse, Error, void>({
    mutationFn: () => faceEnrollmentsService.remove(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FACE_ENROLLMENTS_QUERY_KEY(employeeId),
      });
      toast.success('Biometria removida');
    },
    onError: () => {
      toast.error('Não foi possível remover a biometria. Tente novamente.');
    },
  });
}
