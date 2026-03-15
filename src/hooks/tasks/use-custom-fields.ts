import { customFieldsService } from '@/services/tasks';
import type {
  CreateCustomFieldRequest,
  UpdateCustomFieldRequest,
  SetCustomFieldValueRequest,
} from '@/types/tasks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BOARD_QUERY_KEYS } from './use-boards';
import { CARD_QUERY_KEYS } from './use-cards';

export const CUSTOM_FIELD_QUERY_KEYS = {
  CUSTOM_FIELDS: (boardId: string) => ['task-custom-fields', boardId],
} as const;

export function useCustomFields(boardId: string) {
  return useQuery({
    queryKey: CUSTOM_FIELD_QUERY_KEYS.CUSTOM_FIELDS(boardId),
    queryFn: () => customFieldsService.list(boardId),
    enabled: !!boardId,
  });
}

export function useCreateCustomField(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomFieldRequest) =>
      customFieldsService.create(boardId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: CUSTOM_FIELD_QUERY_KEYS.CUSTOM_FIELDS(boardId),
      });
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useUpdateCustomField(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      fieldId,
      data,
    }: {
      fieldId: string;
      data: UpdateCustomFieldRequest;
    }) => customFieldsService.update(boardId, fieldId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: CUSTOM_FIELD_QUERY_KEYS.CUSTOM_FIELDS(boardId),
      });
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useDeleteCustomField(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: string) =>
      customFieldsService.delete(boardId, fieldId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: CUSTOM_FIELD_QUERY_KEYS.CUSTOM_FIELDS(boardId),
      });
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useSetCustomFieldValues(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      values,
    }: {
      cardId: string;
      values: SetCustomFieldValueRequest['values'];
    }) => customFieldsService.setValues(boardId, cardId, { values }),
    onSuccess: async (_, variables) => {
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, variables.cardId),
      });
      await qc.invalidateQueries({
        queryKey: CUSTOM_FIELD_QUERY_KEYS.CUSTOM_FIELDS(boardId),
      });
    },
  });
}
