import { approvalRulesService } from '@/services/finance';
import type {
  CreateApprovalRuleRequest,
  FinanceApprovalAction,
  UpdateApprovalRuleRequest,
} from '@/types/finance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  APPROVAL_RULES: ['approval-rules'],
  APPROVAL_RULE: (id: string) => ['approval-rules', id],
} as const;

export { QUERY_KEYS as approvalRuleKeys };

// =============================================================================
// QUERY HOOKS
// =============================================================================

export function useApprovalRules(params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
  action?: FinanceApprovalAction;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.APPROVAL_RULES, params],
    queryFn: () => approvalRulesService.list(params),
  });
}

export function useApprovalRule(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.APPROVAL_RULE(id),
    queryFn: () => approvalRulesService.get(id),
    enabled: !!id,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

export function useCreateApprovalRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApprovalRuleRequest) =>
      approvalRulesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.APPROVAL_RULES,
      });
    },
  });
}

export function useUpdateApprovalRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateApprovalRuleRequest;
    }) => approvalRulesService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.APPROVAL_RULES,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.APPROVAL_RULE(variables.id),
      });
    },
  });
}

export function useDeleteApprovalRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approvalRulesService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.APPROVAL_RULES,
      });
    },
  });
}

export function useToggleApprovalRuleActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      approvalRulesService.toggleActive(id, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.APPROVAL_RULES,
      });
    },
  });
}

export function useEvaluateApprovalRule() {
  return useMutation({
    mutationFn: (entryId: string) => approvalRulesService.evaluate(entryId),
  });
}
