import { budgetService } from '@/services/finance';
import type { SaveBudgetRequest } from '@/types/finance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  BUDGET_REPORT: (year: number, month?: number) =>
    ['budget-report', year, month] as const,
  BUDGET_CONFIG: (year: number) => ['budget-config', year] as const,
} as const;

export { QUERY_KEYS as budgetKeys };

// =============================================================================
// QUERY HOOKS
// =============================================================================

export function useBudgetReport(params: { year: number; month?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.BUDGET_REPORT(params.year, params.month),
    queryFn: () => budgetService.getReport(params),
  });
}

export function useBudgetConfig(year: number) {
  return useQuery({
    queryKey: QUERY_KEYS.BUDGET_CONFIG(year),
    queryFn: () => budgetService.getConfig(year),
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

export function useSaveBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveBudgetRequest) => budgetService.save(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) =>
          (query.queryKey[0] as string).startsWith('budget'),
      });
    },
  });
}
