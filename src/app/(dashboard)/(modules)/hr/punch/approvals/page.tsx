'use client';

/**
 * /hr/punch/approvals — Punch approvals queue (Phase 7 / Plan 07-06 / Task 3).
 *
 * Infinite-scroll list of PunchApproval rows (PENDING first), multi-select
 * checkbox per row, fixed PunchApprovalBatchBar at the bottom when ≥ 1
 * selected. PIN gate engages automatically at > 5 selected (handled inside
 * the batch bar).
 *
 * Permission-gated: not rendered without `hr.punch-approvals.access` (or admin).
 */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { GridLoading } from '@/components/handlers/grid-loading';
import { GridError } from '@/components/handlers/grid-error';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { usePermissions } from '@/hooks/use-permissions';
import {
  usePunchApprovals,
  PUNCH_APPROVALS_QUERY_KEY,
} from '@/hooks/hr/use-punch-approvals';
import { PunchApprovalBatchBar } from '@/components/hr/punch/PunchApprovalBatchBar';
import type {
  PunchApprovalItem,
  PunchApprovalStatus,
} from '@/services/hr/punch-dashboard.service';
import { useQueryClient } from '@tanstack/react-query';
import { ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CLS: Record<PunchApprovalStatus, string> = {
  PENDING:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  APPROVED:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  REJECTED:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
  CANCELLED:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300',
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--';
  }
}

function ApprovalRow({
  item,
  selected,
  onToggle,
}: {
  item: PunchApprovalItem;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <li
      data-testid={`punch-approval-row-${item.id}`}
      className={cn(
        'flex items-start gap-3 rounded-md border bg-card p-3 text-sm transition-colors',
        selected && 'border-primary/60 bg-primary/5'
      )}
    >
      <Checkbox
        data-testid={`punch-approval-checkbox-${item.id}`}
        checked={selected}
        onCheckedChange={() => onToggle(item.id)}
        aria-label={`Selecionar exceção de ${item.employeeName}`}
        className="mt-1"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">{item.employeeName}</span>
          <Badge
            variant="outline"
            className={cn('text-[11px]', STATUS_CLS[item.status])}
          >
            {item.status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.departmentName && <span>{item.departmentName}</span>}
          <span className="font-mono">{formatDateTime(item.occurredAt)}</span>
        </div>
        {item.reason && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {item.reason}
          </p>
        )}
      </div>
    </li>
  );
}

function Content() {
  const { hasPermission } = usePermissions();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter] = useState<PunchApprovalStatus | undefined>('PENDING');

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
  } = usePunchApprovals({ status: statusFilter });

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

  const canAccess =
    hasPermission('hr.punch-approvals.access') ||
    hasPermission('hr.punch-approvals.admin');

  if (!canAccess) return null;

  const toggleId = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResolved = () => {
    setSelected(new Set());
    void qc.invalidateQueries({
      queryKey: PUNCH_APPROVALS_QUERY_KEY({ status: statusFilter }),
    });
    void refetch();
  };

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Ponto', href: '/hr/punch/dashboard' },
            { label: 'Exceções', href: '/hr/punch/approvals' },
          ]}
        />
        <Header
          title="Exceções de Ponto"
          description="Aprove ou rejeite batidas pendentes em lote"
        />
      </PageHeader>

      <PageBody>
        <div data-testid="punch-approvals-page" className="space-y-3">
          <Card className="px-3 py-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <ListChecks className="h-3.5 w-3.5" />
              <span>
                Selecionar mais de 5 exceções exige confirmação por PIN.
              </span>
            </div>
          </Card>

          {isError ? (
            <GridError
              type="server"
              message={error?.message ?? 'Falha ao carregar exceções'}
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
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma exceção pendente. 🎉
              </p>
            </Card>
          ) : (
            <ul className="space-y-2 pb-24">
              {items.map(item => (
                <ApprovalRow
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  onToggle={toggleId}
                />
              ))}
              <div ref={sentinelRef} className="h-px" />
              {isFetchingNextPage && (
                <Skeleton
                  className="h-20 w-full"
                  data-testid="punch-approvals-fetching"
                />
              )}
            </ul>
          )}
        </div>
      </PageBody>

      <PunchApprovalBatchBar
        selectedIds={Array.from(selected)}
        onClear={() => setSelected(new Set())}
        onResolved={handleResolved}
      />
    </PageLayout>
  );
}

export default function PunchApprovalsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="list" size="md" gap="gap-2" />}
    >
      <Content />
    </Suspense>
  );
}
