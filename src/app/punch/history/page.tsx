'use client';

/**
 * /punch/history — histórico estendido de 7 dias (read-only).
 *
 * Phase 8 / Plan 08-03 / Task 3 — D-11 + D-12.
 *
 * Layout:
 *   - Sticky header com botão "Voltar".
 *   - Pull-to-refresh wrapping o body (D-12 fallback offline → online).
 *   - `<TodayHistory readOnly />` mostrando entries flatten de todas as
 *     páginas carregadas (CLAUDE.md regra 1: infinite scroll, sem totais
 *     no client — backend é fonte da verdade).
 *   - "Carregar mais" button quando `hasNextPage`.
 *   - `usePunchRealtime()` injeta novas batidas no topo via Socket.IO sem
 *     reload.
 */

import { ArrowLeft, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useMemo } from 'react';

import { TodayHistory } from '@/app/punch/components/today-history';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { usePunchHistory } from '@/hooks/hr/use-punch-history';
import { usePunchRealtime } from '@/hooks/hr/use-punch-realtime';

function PunchHistoryPageContent() {
  const router = useRouter();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    error,
  } = usePunchHistory();

  // Realtime updates — injeta entries novos no cache via setQueryData prepend.
  usePunchRealtime();

  const allEntries = useMemo(
    () => data?.pages.flatMap(p => p.timeEntries) ?? [],
    [data]
  );

  return (
    <div data-testid="punch-history-page" className="contents">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-700/50 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Voltar"
            className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
            <History className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Histórico — últimos 7 dias
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <PullToRefresh onRefresh={refetch} isRefreshing={isFetching}>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              Erro ao carregar histórico: {error.message}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="mt-2 w-full"
              >
                Tentar novamente
              </Button>
            </div>
          ) : allEntries.length === 0 && !isFetching ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800/60">
              <History className="mx-auto mb-3 size-8 text-slate-400" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Nenhuma batida registrada nos últimos 7 dias.
              </p>
            </div>
          ) : (
            <TodayHistory entries={allEntries} readOnly />
          )}

          {hasNextPage && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mt-3 w-full"
            >
              {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
            </Button>
          )}
        </PullToRefresh>
      </main>
    </div>
  );
}

export default function PunchHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
        </div>
      }
    >
      <PunchHistoryPageContent />
    </Suspense>
  );
}
