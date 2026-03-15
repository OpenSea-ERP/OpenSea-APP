import { boardsService } from '@/services/tasks';
import type {
  BoardsResponse,
  BoardResponse,
} from '@/services/tasks/boards-service';
import type {
  BoardsQuery,
  CreateBoardRequest,
  UpdateBoardRequest,
} from '@/types/tasks';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export const BOARD_QUERY_KEYS = {
  BOARDS: ['task-boards'],
  BOARD: (boardId: string) => ['task-boards', boardId],
} as const;

export function useBoards(params?: BoardsQuery) {
  return useQuery({
    queryKey: [...BOARD_QUERY_KEYS.BOARDS, params],
    queryFn: () => boardsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useBoardsInfinite(params?: Omit<BoardsQuery, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...BOARD_QUERY_KEYS.BOARDS, 'infinite', params],
    queryFn: ({ pageParam }) =>
      boardsService.list({ ...params, page: pageParam }),
    getNextPageParam: lastPage =>
      lastPage.meta.page < lastPage.meta.pages
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
  });
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: BOARD_QUERY_KEYS.BOARD(boardId),
    queryFn: () => boardsService.get(boardId),
    enabled: !!boardId,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBoardRequest) => boardsService.create(data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARDS });
    },
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      boardId,
      data,
    }: {
      boardId: string;
      data: UpdateBoardRequest;
    }) => boardsService.update(boardId, data),
    onSuccess: async (_, variables) => {
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARDS });
      await qc.invalidateQueries({
        queryKey: BOARD_QUERY_KEYS.BOARD(variables.boardId),
      });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => boardsService.delete(boardId),
    onMutate: async boardId => {
      await qc.cancelQueries({ queryKey: BOARD_QUERY_KEYS.BOARDS });
      const previousQueries = qc.getQueriesData<BoardsResponse>({
        queryKey: BOARD_QUERY_KEYS.BOARDS,
      });

      qc.setQueriesData<BoardsResponse>(
        { queryKey: BOARD_QUERY_KEYS.BOARDS },
        old => {
          if (!old) return old;
          return {
            ...old,
            boards: old.boards.filter(b => b.id !== boardId),
          };
        }
      );

      return { previousQueries };
    },
    onError: (_, __, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARDS });
    },
  });
}

export function useArchiveBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, archive }: { boardId: string; archive: boolean }) =>
      boardsService.archive(boardId, archive),
    onSuccess: async (_, variables) => {
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARDS });
      await qc.invalidateQueries({
        queryKey: BOARD_QUERY_KEYS.BOARD(variables.boardId),
      });
    },
  });
}
