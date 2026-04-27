/**
 * useWebhookDeliveries — infinite scroll log + 30s polling (V1 A5).
 *
 * Refetch interval is 30s when the filter includes PENDING or FAILED (transient
 * states); idle (only DELIVERED/DEAD or 'all') uses no polling. Backend is the
 * source of truth — UI shows a snapshot.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { webhooksService } from '@/services/system/webhooks-service';
import type {
  WebhookDeliveryFilters,
  WebhookDeliveryStatus,
} from '@/types/system';
import { WEBHOOKS_QUERY_KEYS } from './use-webhooks';

const DELIVERIES_PAGE_SIZE = 25;

function shouldPoll(filters?: WebhookDeliveryFilters): boolean {
  if (!filters || !filters.status || filters.status === 'all') return true;
  const list = Array.isArray(filters.status)
    ? filters.status
    : [filters.status];
  return list.some(
    (s: WebhookDeliveryStatus) => s === 'PENDING' || s === 'FAILED'
  );
}

export function useWebhookDeliveries(
  webhookId: string | undefined,
  filters?: WebhookDeliveryFilters
) {
  const id = webhookId ?? '';
  const result = useInfiniteQuery({
    queryKey: WEBHOOKS_QUERY_KEYS.deliveryList(
      id,
      filters as unknown as Record<string, unknown>
    ),
    queryFn: async ({ pageParam = 1 }) => {
      if (!webhookId) throw new Error('webhookId required');
      const response = await webhooksService.listDeliveries(webhookId, {
        ...filters,
        page: pageParam as number,
        limit: DELIVERIES_PAGE_SIZE,
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
    enabled: !!webhookId,
    // V1 A5 — React Query polling at 30_000 ms; Socket.IO is the v2 upgrade.
    refetchInterval: shouldPoll(filters) ? 30_000 : false,
    staleTime: 10_000,
  });

  const items = result.data?.pages.flatMap(p => p.data);
  const total = result.data?.pages[0]?.meta.total;

  return { ...result, items, total };
}
