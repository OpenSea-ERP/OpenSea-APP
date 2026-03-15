import { columnsService } from '@/services/tasks';
import type { BoardResponse } from '@/services/tasks/boards-service';
import type {
  CreateColumnRequest,
  UpdateColumnRequest,
  ReorderColumnsRequest,
} from '@/types/tasks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BOARD_QUERY_KEYS } from './use-boards';
import { CARD_QUERY_KEYS } from './use-cards';

export const COLUMN_QUERY_KEYS = {
  COLUMNS: (boardId: string) => ['task-columns', boardId],
} as const;

export function useCreateColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateColumnRequest) =>
      columnsService.create(boardId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useUpdateColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      columnId,
      data,
    }: {
      columnId: string;
      data: UpdateColumnRequest;
    }) => columnsService.update(boardId, columnId, data),
    onMutate: async ({ columnId, data }) => {
      await qc.cancelQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
      const previousBoard = qc.getQueryData<BoardResponse>(
        BOARD_QUERY_KEYS.BOARD(boardId)
      );

      qc.setQueryData<BoardResponse>(BOARD_QUERY_KEYS.BOARD(boardId), old => {
        if (!old?.board?.columns) return old;
        return {
          ...old,
          board: {
            ...old.board,
            columns: old.board.columns.map(col =>
              col.id === columnId ? { ...col, ...data } : col
            ),
          },
        };
      });

      return { previousBoard };
    },
    onError: (_, __, context) => {
      if (context?.previousBoard) {
        qc.setQueryData(BOARD_QUERY_KEYS.BOARD(boardId), context.previousBoard);
      }
    },
  });
}

export function useDeleteColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (columnId: string) => columnsService.delete(boardId, columnId),
    onMutate: async columnId => {
      await qc.cancelQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
      await qc.cancelQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      const previousBoard = qc.getQueryData<BoardResponse>(
        BOARD_QUERY_KEYS.BOARD(boardId)
      );

      qc.setQueryData<BoardResponse>(BOARD_QUERY_KEYS.BOARD(boardId), old => {
        if (!old?.board?.columns) return old;
        return {
          ...old,
          board: {
            ...old.board,
            columns: old.board.columns.filter(col => col.id !== columnId),
          },
        };
      });

      return { previousBoard };
    },
    onError: (_, __, context) => {
      if (context?.previousBoard) {
        qc.setQueryData(BOARD_QUERY_KEYS.BOARD(boardId), context.previousBoard);
      }
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
    },
  });
}

export function useReorderColumns(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReorderColumnsRequest) =>
      columnsService.reorder(boardId, data),
    onMutate: async ({ columnIds }) => {
      await qc.cancelQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
      const previousBoard = qc.getQueryData<BoardResponse>(
        BOARD_QUERY_KEYS.BOARD(boardId)
      );

      qc.setQueryData<BoardResponse>(BOARD_QUERY_KEYS.BOARD(boardId), old => {
        if (!old?.board?.columns) return old;
        const colMap = new Map(old.board.columns.map(c => [c.id, c]));
        const reordered = columnIds
          .map((id, i) => {
            const col = colMap.get(id);
            return col ? { ...col, position: i } : null;
          })
          .filter(Boolean);
        return {
          ...old,
          board: {
            ...old.board,
            columns: reordered as typeof old.board.columns,
          },
        };
      });

      return { previousBoard };
    },
    onError: (_, __, context) => {
      if (context?.previousBoard) {
        qc.setQueryData(BOARD_QUERY_KEYS.BOARD(boardId), context.previousBoard);
      }
    },
  });
}
