import { automationsService } from '@/services/tasks';
import type {
  CreateAutomationRequest,
  UpdateAutomationRequest,
} from '@/types/tasks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BOARD_QUERY_KEYS } from './use-boards';

export const AUTOMATION_QUERY_KEYS = {
  AUTOMATIONS: (boardId: string) => ['task-automations', boardId],
} as const;

export function useAutomations(boardId: string) {
  return useQuery({
    queryKey: AUTOMATION_QUERY_KEYS.AUTOMATIONS(boardId),
    queryFn: () => automationsService.list(boardId),
    enabled: !!boardId,
  });
}

export function useCreateAutomation(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAutomationRequest) =>
      automationsService.create(boardId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: AUTOMATION_QUERY_KEYS.AUTOMATIONS(boardId),
      });
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useUpdateAutomation(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      automationId,
      data,
    }: {
      automationId: string;
      data: UpdateAutomationRequest;
    }) => automationsService.update(boardId, automationId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: AUTOMATION_QUERY_KEYS.AUTOMATIONS(boardId),
      });
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useDeleteAutomation(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (automationId: string) =>
      automationsService.delete(boardId, automationId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: AUTOMATION_QUERY_KEYS.AUTOMATIONS(boardId),
      });
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useToggleAutomation(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (automationId: string) =>
      automationsService.toggle(boardId, automationId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: AUTOMATION_QUERY_KEYS.AUTOMATIONS(boardId),
      });
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}
