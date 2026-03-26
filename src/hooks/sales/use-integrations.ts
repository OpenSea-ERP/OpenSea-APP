import { integrationsService } from '@/services/sales';
import type {
  ConnectIntegrationRequest,
  IntegrationCategory,
  IntegrationStatus,
} from '@/types/sales';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface IntegrationsFilters {
  search?: string;
  category?: IntegrationCategory;
  status?: IntegrationStatus;
}

const QUERY_KEYS = {
  INTEGRATIONS: ['integrations'],
  INTEGRATION: (id: string) => ['integrations', id],
} as const;

export function useIntegrations(filters?: IntegrationsFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.INTEGRATIONS, filters],
    queryFn: () =>
      integrationsService.list({
        search: filters?.search || undefined,
        category: filters?.category || undefined,
        status: filters?.status || undefined,
      }),
    staleTime: 30_000,
  });
}

export function useIntegration(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.INTEGRATION(id),
    queryFn: () => integrationsService.get(id),
    enabled: !!id,
  });
}

export function useConnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ConnectIntegrationRequest;
    }) => integrationsService.connect(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationsService.disconnect(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export function useSyncIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationsService.sync(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}
