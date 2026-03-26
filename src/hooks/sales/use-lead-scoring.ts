import { leadScoringService } from '@/services/sales';
import type {
  CreateLeadScoringRuleRequest,
  LeadScoringQuery,
  UpdateLeadScoringRuleRequest,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export interface LeadScoringFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  RULES: ['lead-scoring-rules'],
  RULES_INFINITE: (filters?: LeadScoringFilters) => [
    'lead-scoring-rules',
    'infinite',
    filters,
  ],
  RULE: (id: string) => ['lead-scoring-rules', id],
  CUSTOMER_SCORE: (customerId: string) => ['customer-score', customerId],
} as const;

const PAGE_SIZE = 20;

export function useLeadScoringRulesInfinite(filters?: LeadScoringFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.RULES_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      return await leadScoringService.list({
        page: pageParam,
        limit: PAGE_SIZE,
        search: filters?.search || undefined,
        isActive: filters?.isActive,
        sortBy: filters?.sortBy || undefined,
        sortOrder: filters?.sortOrder || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });

  const rules = result.data?.pages.flatMap(p => p.rules) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    rules,
    total,
  };
}

export function useCustomerScore(customerId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER_SCORE(customerId),
    queryFn: () => leadScoringService.getCustomerScore(customerId),
    enabled: !!customerId,
    staleTime: 60_000,
  });
}

export function useCreateLeadScoringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadScoringRuleRequest) =>
      leadScoringService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
    },
  });
}

export function useUpdateLeadScoringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ruleId,
      data,
    }: {
      ruleId: string;
      data: UpdateLeadScoringRuleRequest;
    }) => leadScoringService.update(ruleId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RULE(variables.ruleId),
      });
    },
  });
}

export function useDeleteLeadScoringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => leadScoringService.delete(ruleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
    },
  });
}
