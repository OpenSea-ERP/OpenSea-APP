'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinanceEntries } from '@/hooks/finance';
import type { FinanceEntry, OverdueRange } from '@/types/finance';
import { Flame } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface AgingSegment {
  range: OverdueRange;
  label: string;
  count: number;
  total: number;
  colorBar: string;
  colorBg: string;
  colorText: string;
}

function categorizeOverdue(entries: FinanceEntry[]): AgingSegment[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const buckets = {
    '1-7': { count: 0, total: 0 },
    '8-30': { count: 0, total: 0 },
    '31-60': { count: 0, total: 0 },
    '60+': { count: 0, total: 0 },
  };

  for (const entry of entries) {
    const due = new Date(entry.dueDate);
    due.setHours(0, 0, 0, 0);
    const daysOverdue = Math.ceil(
      (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue <= 0) continue;

    let bucket: keyof typeof buckets;
    if (daysOverdue <= 7) bucket = '1-7';
    else if (daysOverdue <= 30) bucket = '8-30';
    else if (daysOverdue <= 60) bucket = '31-60';
    else bucket = '60+';

    buckets[bucket].count += 1;
    buckets[bucket].total += entry.remainingBalance ?? entry.expectedAmount;
  }

  return [
    {
      range: '1-7' as OverdueRange,
      label: '1 - 7 dias',
      ...buckets['1-7'],
      colorBar: 'bg-rose-200 dark:bg-rose-400/30',
      colorBg: 'bg-rose-50 dark:bg-rose-500/5',
      colorText: 'text-rose-700 dark:text-rose-300',
    },
    {
      range: '8-30' as OverdueRange,
      label: '8 - 30 dias',
      ...buckets['8-30'],
      colorBar: 'bg-rose-300 dark:bg-rose-400/50',
      colorBg: 'bg-rose-100/60 dark:bg-rose-500/8',
      colorText: 'text-rose-700 dark:text-rose-300',
    },
    {
      range: '31-60' as OverdueRange,
      label: '31 - 60 dias',
      ...buckets['31-60'],
      colorBar: 'bg-rose-400 dark:bg-rose-400/70',
      colorBg: 'bg-rose-100 dark:bg-rose-500/10',
      colorText: 'text-rose-800 dark:text-rose-200',
    },
    {
      range: '60+' as OverdueRange,
      label: '60+ dias',
      ...buckets['60+'],
      colorBar: 'bg-rose-600 dark:bg-rose-500',
      colorBg: 'bg-rose-200/60 dark:bg-rose-500/15',
      colorText: 'text-rose-900 dark:text-rose-100',
    },
  ];
}

export function OverdueHeatmap() {
  const { data, isLoading } = useFinanceEntries({
    isOverdue: true,
    perPage: 100,
    sortBy: 'dueDate',
    sortOrder: 'asc',
  });

  const segments = useMemo(() => {
    if (!data?.entries) return [];
    return categorizeOverdue(data.entries);
  }, [data?.entries]);

  const grandTotal = useMemo(
    () => segments.reduce((s, seg) => s + seg.total, 0),
    [segments]
  );

  const maxTotal = useMemo(
    () => Math.max(...segments.map((s) => s.total), 1),
    [segments]
  );

  const totalCount = useMemo(
    () => segments.reduce((s, seg) => s + seg.count, 0),
    [segments]
  );

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-rose-500" />
            <CardTitle className="text-base">Aging de Vencidos</CardTitle>
          </div>
          {totalCount > 0 && (
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {totalCount} {totalCount === 1 ? 'conta' : 'contas'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
              <span className="text-lg">&#10003;</span>
            </div>
            <p className="text-sm font-medium">Nenhuma conta vencida</p>
            <p className="text-xs mt-1">Todas as contas estão em dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {segments.map((segment) => {
              const barWidth =
                segment.total > 0
                  ? Math.max((segment.total / maxTotal) * 100, 8)
                  : 0;

              return (
                <Link
                  key={segment.range}
                  href={`/finance/overview/overdue?range=${segment.range}`}
                >
                  <div
                    className={`relative rounded-lg p-3 ${segment.colorBg} border border-transparent hover:border-rose-200 dark:hover:border-rose-800/50 transition-colors cursor-pointer`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-semibold ${segment.colorText}`}
                      >
                        {segment.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {segment.count}{' '}
                        {segment.count === 1 ? 'conta' : 'contas'}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="h-2 w-full bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${segment.colorBar} transition-all duration-500`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="mt-1.5 text-right">
                      <span className={`text-sm font-bold ${segment.colorText}`}>
                        {formatCurrency(segment.total)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Grand total */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total vencido
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
