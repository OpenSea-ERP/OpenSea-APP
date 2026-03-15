import { consortiaService } from '@/services/finance';
import type {
  ConsortiaQuery,
  CreateConsortiumData,
  UpdateConsortiumData,
  PayConsortiumInstallmentData,
  MarkContemplatedData,
} from '@/types/finance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  CONSORTIA: ['consortia'],
  CONSORTIUM: (id: string) => ['consortia', id],
} as const;

export function useConsortia(params?: ConsortiaQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONSORTIA, params],
    queryFn: () => consortiaService.list(params),
  });
}

export function useConsortium(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CONSORTIUM(id),
    queryFn: () => consortiaService.get(id),
    enabled: !!id,
  });
}

export function useCreateConsortium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConsortiumData) => consortiaService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONSORTIA });
    },
  });
}

export function useUpdateConsortium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConsortiumData }) =>
      consortiaService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONSORTIA });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONSORTIUM(variables.id),
      });
    },
  });
}

export function useDeleteConsortium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => consortiaService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONSORTIA });
    },
  });
}

export function usePayConsortiumInstallment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      consortiumId,
      data,
    }: {
      consortiumId: string;
      data: PayConsortiumInstallmentData;
    }) => consortiaService.registerPayment(consortiumId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONSORTIA });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONSORTIUM(variables.consortiumId),
      });
    },
  });
}

export function useMarkContemplated() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarkContemplatedData }) =>
      consortiaService.markContemplated(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONSORTIA });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONSORTIUM(variables.id),
      });
    },
  });
}
