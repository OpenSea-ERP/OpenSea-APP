import { integrationsService } from '@/services/tasks';
import type { CreateIntegrationRequest } from '@/types/tasks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CARD_QUERY_KEYS } from './use-cards';

export const INTEGRATION_QUERY_KEYS = {
  INTEGRATIONS: (boardId: string, cardId: string) => [
    'task-integrations',
    boardId,
    cardId,
  ],
} as const;

export function useIntegrations(boardId: string, cardId: string) {
  return useQuery({
    queryKey: INTEGRATION_QUERY_KEYS.INTEGRATIONS(boardId, cardId),
    queryFn: () => integrationsService.list(boardId, cardId),
    enabled: !!boardId && !!cardId,
  });
}

export function useCreateIntegration(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIntegrationRequest) =>
      integrationsService.create(boardId, cardId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.INTEGRATIONS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}

export function useDeleteIntegration(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (integrationId: string) =>
      integrationsService.delete(boardId, cardId, integrationId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.INTEGRATIONS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}
