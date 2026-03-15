import { commentsService } from '@/services/tasks';
import type {
  CommentsQuery,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '@/types/tasks';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { CARD_QUERY_KEYS } from './use-cards';

export const COMMENT_QUERY_KEYS = {
  COMMENTS: (boardId: string, cardId: string) => [
    'task-comments',
    boardId,
    cardId,
  ],
} as const;

export function useComments(
  boardId: string,
  cardId: string,
  params?: CommentsQuery
) {
  return useQuery({
    queryKey: [...COMMENT_QUERY_KEYS.COMMENTS(boardId, cardId), params],
    queryFn: () => commentsService.list(boardId, cardId, params),
    enabled: !!boardId && !!cardId,
    placeholderData: keepPreviousData,
  });
}

export function useCreateComment(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommentRequest) =>
      commentsService.create(boardId, cardId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.COMMENTS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId) });
    },
  });
}

export function useUpdateComment(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string;
      data: UpdateCommentRequest;
    }) => commentsService.update(boardId, cardId, commentId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.COMMENTS(boardId, cardId),
      });
    },
  });
}

export function useDeleteComment(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      commentsService.delete(boardId, cardId, commentId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.COMMENTS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId) });
    },
  });
}

export function useAddReaction(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, emoji }: { commentId: string; emoji: string }) =>
      commentsService.addReaction(boardId, cardId, commentId, emoji),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.COMMENTS(boardId, cardId),
      });
    },
  });
}

export function useRemoveReaction(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, emoji }: { commentId: string; emoji: string }) =>
      commentsService.removeReaction(boardId, cardId, commentId, emoji),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.COMMENTS(boardId, cardId),
      });
    },
  });
}
