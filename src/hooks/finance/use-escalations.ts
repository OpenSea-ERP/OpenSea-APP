import { escalationService } from '@/services/finance';
import type {
  CreateEscalationRequest,
  UpdateEscalationRequest,
} from '@/types/finance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  ESCALATIONS: ['escalations'],
  ESCALATION: (id: string) => ['escalations', id],
} as const;

export { QUERY_KEYS as escalationKeys };

// =============================================================================
// QUERY HOOKS
// =============================================================================

export function useEscalations(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ESCALATIONS, params],
    queryFn: () => escalationService.list(params),
  });
}

export function useEscalation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ESCALATION(id),
    queryFn: () => escalationService.get(id),
    enabled: !!id,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

export function useCreateEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEscalationRequest) =>
      escalationService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ESCALATIONS,
      });
    },
  });
}

export function useUpdateEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateEscalationRequest;
    }) => escalationService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ESCALATIONS,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ESCALATION(variables.id),
      });
    },
  });
}

export function useDeleteEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => escalationService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ESCALATIONS,
      });
    },
  });
}

export function useDuplicateEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => escalationService.duplicate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ESCALATIONS,
      });
    },
  });
}

export function useToggleEscalationActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => escalationService.toggleActive(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ESCALATIONS,
      });
    },
  });
}
