import { leadRoutingService } from '@/services/sales';
import type {
  CreateLeadRoutingRuleRequest,
  LeadRoutingQuery,
  UpdateLeadRoutingRuleRequest,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export interface LeadRoutingFilters {
  search?: string;
  isActive?: boolean;
  strategy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  RULES: ['lead-routing-rules'],
  RULES_INFINITE: (filters?: LeadRoutingFilters) => [
    'lead-routing-rules',
    'infinite',
    filters,
  ],
  RULE: (id: string) => ['lead-routing-rules', id],
} as const;

const PAGE_SIZE = 20;

export function useLeadRoutingRulesInfinite(filters?: LeadRoutingFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.RULES_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      return await leadRoutingService.list({
        page: pageParam,
        limit: PAGE_SIZE,
        search: filters?.search || undefined,
        isActive: filters?.isActive,
        strategy: filters?.strategy as LeadRoutingQuery['strategy'],
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

export function useLeadRoutingRule(ruleId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.RULE(ruleId),
    queryFn: () => leadRoutingService.get(ruleId),
    enabled: !!ruleId,
  });
}

export function useCreateLeadRoutingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadRoutingRuleRequest) =>
      leadRoutingService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lead-routing-rules'] });
    },
  });
}

export function useUpdateLeadRoutingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ruleId,
      data,
    }: {
      ruleId: string;
      data: UpdateLeadRoutingRuleRequest;
    }) => leadRoutingService.update(ruleId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['lead-routing-rules'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RULE(variables.ruleId),
      });
    },
  });
}

export function useDeleteLeadRoutingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => leadRoutingService.delete(ruleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lead-routing-rules'] });
    },
  });
}
