import { cardMembersService } from '@/services/tasks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CARD_QUERY_KEYS } from './use-cards';

export const CARD_MEMBER_QUERY_KEYS = {
  MEMBERS: (boardId: string, cardId: string) => [
    'task-card-members',
    boardId,
    cardId,
  ],
} as const;

export function useCardMembers(boardId: string, cardId: string) {
  return useQuery({
    queryKey: CARD_MEMBER_QUERY_KEYS.MEMBERS(boardId, cardId),
    queryFn: () => cardMembersService.list(boardId, cardId),
    enabled: !!boardId && !!cardId,
  });
}

export function useAddCardMember(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      cardMembersService.add(boardId, cardId, { userId }),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: CARD_MEMBER_QUERY_KEYS.MEMBERS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}

export function useRemoveCardMember(boardId: string, cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      cardMembersService.remove(boardId, cardId, userId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: CARD_MEMBER_QUERY_KEYS.MEMBERS(boardId, cardId),
      });
      await qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.invalidateQueries({
        queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
      });
    },
  });
}
