import { cardsService } from '@/services/tasks';
import type { CardsResponse } from '@/services/tasks/cards-service';
import type {
  CardsQuery,
  CreateCardRequest,
  UpdateCardRequest,
  MoveCardRequest,
} from '@/types/tasks';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BOARD_QUERY_KEYS } from './use-boards';

export const CARD_QUERY_KEYS = {
  CARDS: (boardId: string) => ['task-cards', boardId],
  CARD: (boardId: string, cardId: string) => ['task-cards', boardId, cardId],
} as const;

export function useCards(boardId: string, params?: CardsQuery) {
  return useQuery({
    queryKey: [...CARD_QUERY_KEYS.CARDS(boardId), params],
    queryFn: () => cardsService.list(boardId, params),
    enabled: !!boardId,
    placeholderData: keepPreviousData,
  });
}

export function useCard(boardId: string, cardId: string) {
  return useQuery({
    queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId),
    queryFn: () => cardsService.get(boardId, cardId),
    enabled: !!boardId && !!cardId,
  });
}

export function useCreateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCardRequest) => cardsService.create(boardId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useUpdateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: UpdateCardRequest }) =>
      cardsService.update(boardId, cardId, data),
    onMutate: async ({ cardId, data }) => {
      await qc.cancelQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      await qc.cancelQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, cardId) });

      const previousCardsQueries = qc.getQueriesData<CardsResponse>({
        queryKey: CARD_QUERY_KEYS.CARDS(boardId),
      });

      qc.setQueriesData<CardsResponse>(
        { queryKey: CARD_QUERY_KEYS.CARDS(boardId) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            cards: old.cards.map((c) =>
              c.id === cardId ? { ...c, ...data } : c,
            ),
          };
        },
      );

      return { previousCardsQueries };
    },
    onError: (_, __, context) => {
      if (context?.previousCardsQueries) {
        for (const [key, data] of context.previousCardsQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: (_, __, variables) => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, variables.cardId) });
    },
  });
}

export function useDeleteCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => cardsService.delete(boardId, cardId),
    onMutate: async (cardId) => {
      await qc.cancelQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      const previousQueries = qc.getQueriesData<CardsResponse>({
        queryKey: CARD_QUERY_KEYS.CARDS(boardId),
      });

      qc.setQueriesData<CardsResponse>(
        { queryKey: CARD_QUERY_KEYS.CARDS(boardId) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            cards: old.cards.filter((c) => c.id !== cardId),
          };
        },
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
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useMoveCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: MoveCardRequest }) =>
      cardsService.move(boardId, cardId, data),
    onMutate: async ({ cardId, data }) => {
      await qc.cancelQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      const previousQueries = qc.getQueriesData<CardsResponse>({
        queryKey: CARD_QUERY_KEYS.CARDS(boardId),
      });

      qc.setQueriesData<CardsResponse>(
        { queryKey: CARD_QUERY_KEYS.CARDS(boardId) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            cards: old.cards.map((c) =>
              c.id === cardId ? { ...c, columnId: data.columnId, position: data.position } : c,
            ),
          };
        },
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
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
    },
  });
}

export function useAssignCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, assigneeId }: { cardId: string; assigneeId: string | null }) =>
      cardsService.assign(boardId, cardId, { assigneeId }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, variables.cardId) });
    },
  });
}

export function useArchiveCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, archive }: { cardId: string; archive: boolean }) =>
      cardsService.archive(boardId, cardId, archive),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, variables.cardId) });
    },
  });
}

export function useManageCardLabels(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, labelIds }: { cardId: string; labelIds: string[] }) =>
      cardsService.manageLabels(boardId, cardId, { labelIds }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARDS(boardId) });
      qc.invalidateQueries({ queryKey: CARD_QUERY_KEYS.CARD(boardId, variables.cardId) });
    },
  });
}
