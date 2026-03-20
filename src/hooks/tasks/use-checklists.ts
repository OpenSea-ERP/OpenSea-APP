import { checklistsService } from '@/services/tasks';
import type {
  CreateChecklistRequest,
  UpdateChecklistRequest,
  CreateChecklistItemRequest,
} from '@/types/tasks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CARD_QUERY_KEYS } from './use-cards';

export const CHECKLIST_QUERY_KEYS = {
  CHECKLISTS: (boardId: string, cardId: string) => [
    'task-checklists',
    boardId,
    cardId,
  ],
} as const;

export function useCreateChecklist(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChecklistRequest) =>
      checklistsService.create(boardId, cardId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}

export function useUpdateChecklist(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      checklistId,
      data,
    }: {
      checklistId: string;
      data: UpdateChecklistRequest;
    }) => checklistsService.update(boardId, cardId, checklistId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}

export function useDeleteChecklist(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (checklistId: string) =>
      checklistsService.delete(boardId, cardId, checklistId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}

export function useAddChecklistItem(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      checklistId,
      data,
    }: {
      checklistId: string;
      data: CreateChecklistItemRequest;
    }) => checklistsService.addItem(boardId, cardId, checklistId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}

export function useToggleChecklistItem(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      checklistId,
      itemId,
    }: {
      checklistId: string;
      itemId: string;
    }) => checklistsService.toggleItem(boardId, cardId, checklistId, itemId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}

export function useDeleteChecklistItem(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      checklistId,
      itemId,
    }: {
      checklistId: string;
      itemId: string;
    }) => checklistsService.deleteItem(boardId, cardId, checklistId, itemId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}
