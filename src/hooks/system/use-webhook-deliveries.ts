/**
 * useWebhookDeliveries — infinite scroll log + 30s polling (V1 A5).
 *
 * Refetch interval is 30s ONLY when the filter explicitly includes PENDING or
 * FAILED (transient states). 'all' filter does NOT poll — backend snapshot is
 * authoritative; admin pode refetchar manualmente. (WR-01 fix.)
 *
 * Backend contract (listDeliveriesResponseSchema): { items, total, count }.
 * Pagination: offset/limit (NOT page). React Query pageParam carries the
 * cumulative offset; getNextPageParam returns next offset until
 * loaded === total.
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
  if (!filters || !filters.status || filters.status === 'all') return false;
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
    queryFn: async ({ pageParam = 0 }) => {
      if (!webhookId) throw new Error('webhookId required');
      const response = await webhooksService.listDeliveries(webhookId, {
        ...filters,
        offset: pageParam as number,
        limit: DELIVERIES_PAGE_SIZE,
      });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    enabled: !!webhookId,
    // V1 A5 — Polling 30s só quando filtro tem PENDING ou FAILED.
    // 'all'/'DELIVERED'/'DEAD' não poll (idle states; WR-01 fix).
    refetchInterval: shouldPoll(filters) ? 30_000 : false,
    staleTime: 10_000,
  });

  const items = result.data?.pages.flatMap(p => p.items);
  const total = result.data?.pages[0]?.total;
  const counter = result.data?.pages[0]?.count;

  return { ...result, items, total, counter };
}
