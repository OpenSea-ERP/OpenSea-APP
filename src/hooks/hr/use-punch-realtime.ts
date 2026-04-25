'use client';

/**
 * usePunchRealtime — Socket.IO listener `user:{id}` (Phase 7-02 auto-join).
 *
 * Phase 8 / Plan 08-03 / Task 3 — D-12.
 *
 * Escuta o evento `punch.time-entry.scoped` no socket e PREPENDE o
 * `TimeEntry` recebido na primeira página do `usePunchHistory` cache via
 * `setQueryData` (Pitfall 6 do Plan 7-06: incremental update, NÃO
 * `invalidateQueries` para preservar scroll + evitar refetch storm).
 *
 * Phase 7-02 já auto-joina a sala `user:{userId}` para qualquer usuário com
 * `hr.*` (verificado na 07-02 SUMMARY) — funcionário comum tem
 * `hr.punch-approvals.access` via DEFAULT_USER_PERMISSIONS, então também
 * cai dentro da regra. Backend emite o evento via Phase 4-05 dispatcher.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useSocket } from '@/hooks/use-socket';
import type { TimeEntry } from '@/types/hr';

import { PUNCH_HISTORY_QUERY_KEY } from './use-punch-history';

interface PageShape {
  timeEntries: TimeEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

interface InfinitePagesShape {
  pages: PageShape[];
  pageParams: number[];
}

export function usePunchRealtime() {
  const { on, isConnected } = useSocket();
  const qc = useQueryClient();
  const { user } = useAuth();
  const employeeId = user?.id ?? '';

  useEffect(() => {
    if (!isConnected || !employeeId) return;
    const off = on<TimeEntry>('punch.time-entry.scoped', entry => {
      qc.setQueryData<InfinitePagesShape>(
        PUNCH_HISTORY_QUERY_KEY(employeeId),
        old => {
          if (!old) return old;
          const newPages = [...old.pages];
          const first = newPages[0];
          if (!first) return old;
          newPages[0] = {
            ...first,
            timeEntries: [entry, ...first.timeEntries],
          };
          return { ...old, pages: newPages };
        }
      );
    });
    return () => {
      off();
    };
  }, [on, isConnected, employeeId, qc]);
}
