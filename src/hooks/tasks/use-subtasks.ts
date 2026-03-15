import { subtasksService } from '@/services/tasks';
import type { CreateSubtaskRequest, UpdateCardRequest } from '@/types/tasks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CARD_QUERY_KEYS } from './use-cards';

export const SUBTASK_QUERY_KEYS = {
  SUBTASKS: (boardId: string, cardId: string) => [
    'task-subtasks',
    boardId,
    cardId,
  ],
} as const;

export function useSubtasks(boardId: string, cardId: string) {
  return useQuery({
    queryKey: SUBTASK_QUERY_KEYS.SUBTASKS(boardId, cardId),
    queryFn: () => subtasksService.list(boardId, cardId),
    enabled: !!boardId && !!cardId,
  });
}

export function useCreateSubtask(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubtaskRequest) =>
      subtasksService.create(boardId, cardId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: SUBTASK_QUERY_KEYS.SUBTASKS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId) });
    },
  });
}

export function useUpdateSubtask(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      subtaskId,
      data,
    }: {
      subtaskId: string;
      data: UpdateCardRequest;
    }) => subtasksService.update(boardId, cardId, subtaskId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: SUBTASK_QUERY_KEYS.SUBTASKS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId) });
    },
  });
}

export function useDeleteSubtask(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subtaskId: string) =>
      subtasksService.delete(boardId, cardId, subtaskId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: SUBTASK_QUERY_KEYS.SUBTASKS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId) });
    },
  });
}

export function useCompleteSubtask(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      subtaskId,
      completed,
    }: {
      subtaskId: string;
      completed: boolean;
    }) => subtasksService.complete(boardId, cardId, subtaskId, completed),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: SUBTASK_QUERY_KEYS.SUBTASKS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId) });
    },
  });
}
