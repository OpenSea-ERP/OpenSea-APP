'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SalesDashboardData } from '@/hooks/sales/use-sales-dashboard';
import { BarChart3 } from 'lucide-react';
import { useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DailySalesChartProps {
  data: SalesDashboardData | undefined;
  isLoading: boolean;
}

export function DailySalesChart({ data, isLoading }: DailySalesChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { bars, maxValue } = useMemo(() => {
    if (!data?.dailySales) return { bars: [], maxValue: 0 };
    const max = Math.max(...data.dailySales.map(d => d.total), 1);
    return { bars: data.dailySales, maxValue: max };
  }, [data?.dailySales]);

  if (isLoading) {
    return (
      <Card
        data-testid="sales-daily-chart"
        className="bg-white dark:bg-slate-800/60 border border-border"
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
            <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Vendas por Dia
          </h3>
          <span className="text-xs text-muted-foreground ml-auto">
            Últimos 30 dias
          </span>
        </div>

        {/* Chart area */}
        <div className="relative h-40">
          {/* Tooltip */}
          {hoveredIndex !== null && bars[hoveredIndex] && (
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs shadow-lg pointer-events-none whitespace-nowrap">
              <span className="font-medium">
                {formatShortDate(bars[hoveredIndex].date)}
              </span>
              {' — '}
              <span className="tabular-nums font-semibold">
                {formatCurrency(bars[hoveredIndex].total)}
              </span>
            </div>
          )}

          {/* Bars */}
          <div className="flex items-end gap-[2px] h-full">
            {bars.map((bar, i) => {
              const heightPercent =
                maxValue > 0 ? (bar.total / maxValue) * 100 : 0;
              const isHovered = hoveredIndex === i;
              const isWeekend = (() => {
                const d = new Date(bar.date + 'T00:00:00');
                return d.getDay() === 0 || d.getDay() === 6;
              })();

              return (
                <div
                  key={bar.date}
                  className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className={`w-full rounded-t-sm transition-all duration-150 ${
                      bar.total === 0
                        ? 'bg-slate-100 dark:bg-slate-700/30'
                        : isHovered
                          ? 'bg-blue-500 dark:bg-blue-400'
                          : isWeekend
                            ? 'bg-blue-200 dark:bg-blue-600/40'
                            : 'bg-blue-400 dark:bg-blue-500/70'
                    }`}
                    style={{
                      height: `${Math.max(heightPercent, bar.total > 0 ? 4 : 1)}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels (show every 5 days) */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {bars
            .filter((_, i) => i % 5 === 0 || i === bars.length - 1)
            .map(bar => (
              <span
                key={bar.date}
                className="text-[10px] text-muted-foreground tabular-nums"
              >
                {formatShortDate(bar.date)}
              </span>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
