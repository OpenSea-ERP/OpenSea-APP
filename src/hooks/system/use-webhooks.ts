/**
 * useWebhooks — listing infinite scroll hook.
 *
 * Golden rule: never `|| []`. Errors propagate to React Query.
 * Golden rule: useInfiniteQuery (não useQuery) — listings sempre infinite scroll.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { webhooksService } from '@/services/system/webhooks-service';
import type { WebhookEndpointFilters } from '@/types/system';

const PAGE_SIZE = 20;

export const WEBHOOKS_QUERY_KEYS = {
  all: ['system-webhooks'] as const,
  lists: () => [...WEBHOOKS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: WebhookEndpointFilters) =>
    [...WEBHOOKS_QUERY_KEYS.lists(), filters] as const,
  detail: (id: string) => [...WEBHOOKS_QUERY_KEYS.all, 'detail', id] as const,
  deliveries: (webhookId: string) =>
    [...WEBHOOKS_QUERY_KEYS.all, 'deliveries', webhookId] as const,
  deliveryList: (webhookId: string, filters?: Record<string, unknown>) =>
    [...WEBHOOKS_QUERY_KEYS.deliveries(webhookId), filters] as const,
};

export function useWebhooks(filters?: WebhookEndpointFilters) {
  const result = useInfiniteQuery({
    queryKey: WEBHOOKS_QUERY_KEYS.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await webhooksService.list({
        page: pageParam as number,
        limit: PAGE_SIZE,
        status: filters?.status,
        search: filters?.search,
      });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });

  // Flatten without silent fallback — undefined while loading is OK
  const items = result.data?.pages.flatMap(p => p.data);
  const total = result.data?.pages[0]?.meta.total;
  const counter = result.data?.pages[0]?.meta.count;

  return {
    ...result,
    items,
    total,
    counter,
  };
}
