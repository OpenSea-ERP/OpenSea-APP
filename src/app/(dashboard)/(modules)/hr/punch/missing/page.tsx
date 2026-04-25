'use client';

/**
 * /hr/punch/missing — Missing punches today (Phase 7 / Plan 07-06 / Task 3).
 *
 * Infinite-scroll paginated list of PunchMissedLog rows. DatePicker in
 * header lets the manager change the reference day. LGPD-safe: backend
 * (Plan 07-03) strips CPF — we render employee + department + shift only.
 *
 * Permission-gated by NOT rendering when user lacks
 * `hr.punch-approvals.access` or `hr.punch-approvals.admin`.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { GridLoading } from '@/components/handlers/grid-loading';
import { GridError } from '@/components/handlers/grid-error';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { usePunchMissing } from '@/hooks/hr/use-punch-missing';
import { AlarmClockOff, CheckCircle2, UserMinus } from 'lucide-react';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function Content() {
  const { hasPermission } = usePermissions();
  const [date, setDate] = useState<string>(todayIso());
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePunchMissing({ date });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo(
    () => (data ? data.pages.flatMap(p => p.items) : []),
    [data]
  );
  const total = data?.pages[0]?.total ?? items.length;

  const canAccess =
    hasPermission('hr.punch-approvals.access') ||
    hasPermission('hr.punch-approvals.admin');

  if (!canAccess) return null;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Ponto', href: '/hr/punch/dashboard' },
            { label: 'Faltantes', href: '/hr/punch/missing' },
          ]}
        />
        <Header
          title="Batidas Faltantes"
          description="Funcionários que não bateram ponto na data selecionada"
        />
      </PageHeader>

      <PageBody>
        <div data-testid="punch-missing-page" className="space-y-3">
          <Card className="flex flex-wrap items-end gap-3 p-3">
            <div className="space-y-1">
              <Label htmlFor="missing-date">Data de referência</Label>
              <DatePicker
                id="missing-date"
                value={date}
                onChange={value => setDate((value as string) || todayIso())}
                valueFormat="iso"
                placeholder="Selecione"
                hideClear
              />
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs">
              <Badge
                variant="outline"
                className={
                  total > 0
                    ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                    : 'text-muted-foreground'
                }
              >
                <AlarmClockOff className="mr-1 h-3 w-3" />
                <span data-testid="punch-missing-total">{total}</span>{' '}
                faltante(s)
              </Badge>
            </div>
          </Card>

          {isError ? (
            <GridError
              type="server"
              message={error?.message ?? 'Falha ao carregar faltantes'}
              action={{
                label: 'Tentar novamente',
                onClick: () => {
                  void refetch();
                },
              }}
            />
          ) : isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500/60" />
              <p className="text-sm text-muted-foreground">
                Nenhum funcionário com batida faltante nesta data.
              </p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {items.map(item => (
                <li
                  key={item.id}
                  data-testid={`punch-missing-row-${item.id}`}
                  className="flex items-start gap-3 rounded-md border bg-card p-3 text-sm"
                >
                  <UserMinus className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {item.employeeName}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {item.departmentName && (
                        <span>{item.departmentName}</span>
                      )}
                      {item.shiftLabel && <span>{item.shiftLabel}</span>}
                      {item.resolvedAt && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                        >
                          Resolvido
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              <div ref={sentinelRef} className="h-px" />
              {isFetchingNextPage && (
                <Skeleton
                  className="h-16 w-full"
                  data-testid="punch-missing-fetching"
                />
              )}
            </ul>
          )}
        </div>
      </PageBody>
    </PageLayout>
  );
}

export default function PunchMissingPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="list" size="md" gap="gap-2" />}
    >
      <Content />
    </Suspense>
  );
}
