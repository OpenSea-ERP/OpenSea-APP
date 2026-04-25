'use client';

/**
 * usePunchHistory — infinite query dos últimos 7 dias.
 *
 * Phase 8 / Plan 08-03 / Task 3 — D-11 (histórico estendido) + CLAUDE.md
 * regra 1 (infinite scroll, sem paginação tradicional).
 *
 * Clone direto do shape `use-punch-feed.ts` (Phase 7-06) com duas
 * adaptações:
 *
 *  - `timeControlService.listTimeEntries` usa `page`/`perPage`/`totalPages`
 *    (não offset). `getNextPageParam` retorna o próximo número de página
 *    quando `lastPage.page < lastPage.totalPages`.
 *  - QueryKey é factory por `employeeId` (`use-punch-realtime` invalida e
 *    prepende usando a mesma key).
 *
 * Filtro `startDate = hoje - 7 dias` (D-11).
 */

import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import {
  timeControlService,
  type TimeEntriesResponse,
} from '@/services/hr/time-control.service';

const PAGE_SIZE = 50;
const HISTORY_DAYS = 7;

export const PUNCH_HISTORY_QUERY_KEY = (employeeId: string) =>
  ['punch', 'history', employeeId] as const;

export function usePunchHistory() {
  const { user } = useAuth();
  const employeeId = user?.id ?? '';

  return useInfiniteQuery<TimeEntriesResponse, Error>({
    queryKey: PUNCH_HISTORY_QUERY_KEY(employeeId),
    queryFn: ({ pageParam }) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - HISTORY_DAYS);
      return timeControlService.listTimeEntries({
        employeeId,
        startDate: sevenDaysAgo.toISOString().split('T')[0],
        page: pageParam as number,
        perPage: PAGE_SIZE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: !!employeeId,
    staleTime: 30_000,
  });
}
