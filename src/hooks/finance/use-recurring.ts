import { financeRecurringService } from '@/services/finance';
import type {
  RecurringConfigsQuery,
  CreateRecurringConfigRequest,
  UpdateRecurringConfigRequest,
} from '@/types/finance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  RECURRING_CONFIGS: ['recurring-configs'],
  RECURRING_CONFIG: (id: string) => ['recurring-configs', id],
} as const;

export { QUERY_KEYS as recurringKeys };

export function useRecurringConfigs(params?: RecurringConfigsQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RECURRING_CONFIGS, params],
    queryFn: () => financeRecurringService.list(params),
  });
}

export function useRecurringConfig(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.RECURRING_CONFIG(id),
    queryFn: () => financeRecurringService.get(id),
    enabled: !!id,
  });
}

export function useCreateRecurringConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringConfigRequest) =>
      financeRecurringService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIGS,
      });
    },
  });
}

export function useUpdateRecurringConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRecurringConfigRequest;
    }) => financeRecurringService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIGS,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIG(variables.id),
      });
    },
  });
}

export function usePauseRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeRecurringService.pause(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIGS,
      });
    },
  });
}

export function useResumeRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeRecurringService.resume(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIGS,
      });
    },
  });
}

export function useCancelRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeRecurringService.cancel(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIGS,
      });
    },
  });
}
