import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeEntriesService } from '@/services/finance';
import type { CreateBoletoData, CreateBoletoResponse } from '@/types/finance';

export function useCreateBoleto() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateBoletoResponse,
    Error,
    { entryId: string; data: CreateBoletoData }
  >({
    mutationFn: ({ entryId, data }) =>
      financeEntriesService.createBoleto(entryId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['finance-entry', variables.entryId],
      });
      queryClient.invalidateQueries({
        queryKey: ['finance-entries'],
      });
    },
  });
}
