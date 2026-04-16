/**
 * OpenSea OS - Kudos hooks
 *
 * React Query hooks para o feed social de Kudos:
 * - useKudosFeed: feed paginado (pinned/regular)
 * - useToggleKudosReaction: toggle de emoji com optimistic update
 * - useKudosReplies / useCreateKudosReply / useUpdateKudosReply / useDeleteKudosReply
 * - usePinKudos / useUnpinKudos
 * - useDeleteKudos
 */

import { portalService } from '@/services/hr';
import type {
  EmployeeKudos,
  KudosListResponse,
  KudosReactionSummaryEntry,
  KudosReply,
} from '@/types/hr';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const KUDOS_QUERY_KEYS = {
  feed: (filter?: 'pinned' | 'regular') =>
    ['hr', 'kudos', 'feed', filter] as const,
  sent: () => ['hr', 'kudos', 'sent'] as const,
  received: () => ['hr', 'kudos', 'received'] as const,
  replies: (kudosId: string) => ['hr', 'kudos', kudosId, 'replies'] as const,
  reactions: (kudosId: string) =>
    ['hr', 'kudos', kudosId, 'reactions'] as const,
} as const;

const KUDOS_FEED_PAGE_SIZE = 20;

// ============================================================================
// FEED (regular + pinned)
// ============================================================================

export interface UseKudosFeedOptions {
  /** When 'pinned', requests only pinned items; when 'regular', only non-pinned. */
  filter?: 'pinned' | 'regular';
  /** Override page size. Defaults to 20. */
  perPage?: number;
  enabled?: boolean;
}

export function useKudosFeed(options: UseKudosFeedOptions = {}) {
  const { filter, perPage = KUDOS_FEED_PAGE_SIZE, enabled = true } = options;

  return useInfiniteQuery({
    queryKey: KUDOS_QUERY_KEYS.feed(filter),
    queryFn: async ({ pageParam = 1 }) => {
      return portalService.listKudosFeed({
        page: pageParam,
        perPage,
        pinned:
          filter === 'pinned' ? true : filter === 'regular' ? false : undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.totalPages ?? 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled,
  });
}

export function useSentKudosFeed(perPage = KUDOS_FEED_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: KUDOS_QUERY_KEYS.sent(),
    queryFn: async ({ pageParam = 1 }) =>
      portalService.listSentKudos({ page: pageParam, perPage }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.totalPages ?? 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
}

export function useReceivedKudosFeed(perPage = KUDOS_FEED_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: KUDOS_QUERY_KEYS.received(),
    queryFn: async ({ pageParam = 1 }) =>
      portalService.listReceivedKudos({ page: pageParam, perPage }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.totalPages ?? 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
}

// ============================================================================
// REACTIONS
// ============================================================================

/**
 * Toggle a reaction on a kudos. Performs an optimistic update on the feed
 * caches so the new emoji count appears instantly while the server roundtrips.
 */
export function useToggleKudosReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kudosId,
      emoji,
    }: {
      kudosId: string;
      emoji: string;
    }) => portalService.toggleKudosReaction(kudosId, { emoji }),

    onMutate: async ({ kudosId, emoji }) => {
      // Cancel any outgoing refetches so they don't overwrite the optimistic value
      const feedKey = ['hr', 'kudos', 'feed'] as const;
      await queryClient.cancelQueries({ queryKey: feedKey });

      const previousFeeds: Array<{
        key: readonly unknown[];
        data: InfiniteData<KudosListResponse> | undefined;
      }> = [];

      // Patch every feed cache (pinned + regular)
      const queries = queryClient.getQueriesData<
        InfiniteData<KudosListResponse>
      >({ queryKey: feedKey });

      for (const [key, data] of queries) {
        previousFeeds.push({ key, data });
        if (!data) continue;

        queryClient.setQueryData<InfiniteData<KudosListResponse>>(key, {
          ...data,
          pages: data.pages.map(page => ({
            ...page,
            kudos: page.kudos.map(kudosItem =>
              kudosItem.id === kudosId
                ? toggleEmojiInSummary(kudosItem, emoji)
                : kudosItem
            ),
          })),
        });
      }

      return { previousFeeds };
    },

    onError: (_err, _variables, context) => {
      if (!context) return;
      for (const { key, data } of context.previousFeeds) {
        queryClient.setQueryData(key, data);
      }
    },

    onSettled: (_data, _err, { kudosId }) => {
      queryClient.invalidateQueries({
        queryKey: KUDOS_QUERY_KEYS.reactions(kudosId),
      });
      queryClient.invalidateQueries({ queryKey: ['hr', 'kudos', 'feed'] });
    },
  });
}

export function useKudosReactions(kudosId: string, enabled = true) {
  return useQuery({
    queryKey: KUDOS_QUERY_KEYS.reactions(kudosId),
    queryFn: () => portalService.listKudosReactions(kudosId),
    enabled: enabled && !!kudosId,
  });
}

// ============================================================================
// REPLIES (thread)
// ============================================================================

export function useKudosReplies(kudosId: string, enabled = true) {
  return useQuery({
    queryKey: KUDOS_QUERY_KEYS.replies(kudosId),
    queryFn: () => portalService.listKudosReplies(kudosId),
    enabled: enabled && !!kudosId,
  });
}

export function useCreateKudosReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kudosId,
      content,
    }: {
      kudosId: string;
      content: string;
    }) => portalService.createKudosReply(kudosId, { content }),

    onSuccess: (response, { kudosId }) => {
      // Append to thread cache
      queryClient.setQueryData<{ replies: KudosReply[] }>(
        KUDOS_QUERY_KEYS.replies(kudosId),
        prev => ({
          replies: [...(prev?.replies ?? []), response.reply],
        })
      );
      // Bump the repliesCount on each feed cache
      bumpRepliesCount(queryClient, kudosId, +1);
    },
  });
}

export function useUpdateKudosReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      replyId,
      content,
    }: {
      replyId: string;
      content: string;
      kudosId: string;
    }) => portalService.updateKudosReply(replyId, { content }),

    onSuccess: (response, { kudosId }) => {
      queryClient.setQueryData<{ replies: KudosReply[] }>(
        KUDOS_QUERY_KEYS.replies(kudosId),
        prev => ({
          replies: (prev?.replies ?? []).map(existingReply =>
            existingReply.id === response.reply.id
              ? response.reply
              : existingReply
          ),
        })
      );
    },
  });
}

export function useDeleteKudosReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ replyId }: { replyId: string; kudosId: string }) =>
      portalService.deleteKudosReply(replyId),

    onSuccess: (_data, { kudosId, replyId }) => {
      queryClient.setQueryData<{ replies: KudosReply[] }>(
        KUDOS_QUERY_KEYS.replies(kudosId),
        prev => ({
          replies: (prev?.replies ?? []).filter(r => r.id !== replyId),
        })
      );
      bumpRepliesCount(queryClient, kudosId, -1);
    },
  });
}

// ============================================================================
// PIN / UNPIN
// ============================================================================

export function usePinKudos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kudosId: string) => portalService.pinKudos(kudosId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'kudos', 'feed'] });
    },
  });
}

export function useUnpinKudos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kudosId: string) => portalService.unpinKudos(kudosId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'kudos', 'feed'] });
    },
  });
}

// ============================================================================
// DELETE KUDOS
// ============================================================================

export function useDeleteKudos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kudosId: string) => portalService.deleteKudos(kudosId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'kudos'] });
    },
  });
}

// ============================================================================
// HELPERS
// ============================================================================

/** Returns a new EmployeeKudos with the emoji toggled in `reactionsSummary`. */
function toggleEmojiInSummary(
  kudosItem: EmployeeKudos,
  emoji: string
): EmployeeKudos {
  const summary: KudosReactionSummaryEntry[] = [
    ...(kudosItem.reactionsSummary ?? []),
  ];
  const existingIndex = summary.findIndex(entry => entry.emoji === emoji);

  if (existingIndex === -1) {
    summary.push({ emoji, count: 1, hasReacted: true });
    return { ...kudosItem, reactionsSummary: summary };
  }

  const existing = summary[existingIndex];
  if (existing.hasReacted) {
    // Toggle off: decrement and possibly remove
    const newCount = Math.max(0, existing.count - 1);
    if (newCount === 0) {
      summary.splice(existingIndex, 1);
    } else {
      summary[existingIndex] = {
        ...existing,
        count: newCount,
        hasReacted: false,
      };
    }
  } else {
    // Toggle on: increment
    summary[existingIndex] = {
      ...existing,
      count: existing.count + 1,
      hasReacted: true,
    };
  }

  return { ...kudosItem, reactionsSummary: summary };
}

/** Mutates feed caches to bump (or decrement) the `repliesCount` of a kudos. */
function bumpRepliesCount(
  queryClient: ReturnType<typeof useQueryClient>,
  kudosId: string,
  delta: number
) {
  const queries = queryClient.getQueriesData<InfiniteData<KudosListResponse>>({
    queryKey: ['hr', 'kudos', 'feed'],
  });

  for (const [key, data] of queries) {
    if (!data) continue;
    queryClient.setQueryData<InfiniteData<KudosListResponse>>(key, {
      ...data,
      pages: data.pages.map(page => ({
        ...page,
        kudos: page.kudos.map(kudosItem =>
          kudosItem.id === kudosId
            ? {
                ...kudosItem,
                repliesCount: Math.max(
                  0,
                  (kudosItem.repliesCount ?? 0) + delta
                ),
              }
            : kudosItem
        ),
      })),
    });
  }
}
