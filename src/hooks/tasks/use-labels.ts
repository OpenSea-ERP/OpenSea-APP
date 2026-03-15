import { labelsService } from '@/services/tasks';
import type { CreateLabelRequest, UpdateLabelRequest } from '@/types/tasks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BOARD_QUERY_KEYS } from './use-boards';

export const LABEL_QUERY_KEYS = {
  LABELS: (boardId: string) => ['task-labels', boardId],
} as const;

export function useLabels(boardId: string) {
  return useQuery({
    queryKey: LABEL_QUERY_KEYS.LABELS(boardId),
    queryFn: () => labelsService.list(boardId),
    enabled: !!boardId,
  });
}

export function useCreateLabel(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabelRequest) =>
      labelsService.create(boardId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: LABEL_QUERY_KEYS.LABELS(boardId) });
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useUpdateLabel(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      labelId,
      data,
    }: {
      labelId: string;
      data: UpdateLabelRequest;
    }) => labelsService.update(boardId, labelId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: LABEL_QUERY_KEYS.LABELS(boardId) });
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useDeleteLabel(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) => labelsService.delete(boardId, labelId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: LABEL_QUERY_KEYS.LABELS(boardId) });
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}
