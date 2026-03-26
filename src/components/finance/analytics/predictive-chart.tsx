'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { DailyProjection } from '@/types/finance';

interface PredictiveChartProps {
  dailyProjection: DailyProjection[];
  historicalDays?: number; // how many trailing historical days to show
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function PredictiveChart({
  dailyProjection,
}: PredictiveChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { maxBalance, minBalance, zeroLinePercent, bars } = useMemo(() => {
    if (dailyProjection.length === 0) {
      return { maxBalance: 0, minBalance: 0, zeroLinePercent: 50, bars: [] };
    }

    const balances = dailyProjection.map((d) => d.balance);
    const max = Math.max(...balances, 0);
    const min = Math.min(...balances, 0);
    const range = max - min || 1;

    // Zero line position from bottom
    const zeroFromBottom = ((0 - min) / range) * 100;

    const computed = dailyProjection.map((dp) => {
      const heightPercent = (Math.abs(dp.balance) / range) * 100;
      const isPositive = dp.balance >= 0;

      return {
        ...dp,
        heightPercent: Math.max(heightPercent, 0.5),
        isPositive,
      };
    });

    return {
      maxBalance: max,
      minBalance: min,
      zeroLinePercent: zeroFromBottom,
      bars: computed,
    };
  }, [dailyProjection]);

  if (dailyProjection.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <CardTitle className="text-base">Projeção Diária de Saldo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">
            Nenhum dado de projeção disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalDays = bars.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <CardTitle className="text-base">Projeção Diária de Saldo</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-emerald-500/70" />
              <span>Positivo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-rose-500/70" />
              <span>Negativo</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Y-axis labels */}
        <div className="flex gap-2">
          <div className="flex flex-col justify-between h-[280px] text-xs text-muted-foreground w-20 shrink-0 text-right pr-2">
            <span>{formatCurrency(maxBalance)}</span>
            <span>{formatCurrency(0)}</span>
            {minBalance < 0 && <span>{formatCurrency(minBalance)}</span>}
          </div>

          {/* Chart area */}
          <div className="relative flex-1 h-[280px] overflow-x-auto">
            {/* Zero line */}
            <div
              className="absolute left-0 right-0 border-t-2 border-slate-400 dark:border-slate-500 z-10"
              style={{ bottom: `${zeroLinePercent}%` }}
            >
              <span className="absolute -top-4 -left-0.5 text-[10px] text-muted-foreground font-medium">
                0
              </span>
            </div>

            {/* Danger zone background: highlight area below zero */}
            {minBalance < 0 && (
              <div
                className="absolute left-0 right-0 bottom-0 bg-rose-500/5 dark:bg-rose-500/10 border-t border-rose-200 dark:border-rose-800/30"
                style={{ height: `${zeroLinePercent}%` }}
              />
            )}

            {/* Bars */}
            <div className="flex items-end h-full gap-px">
              {bars.map((bar, index) => {
                const barWidth = `${100 / totalDays}%`;
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={bar.date}
                    className="relative group"
                    style={{
                      width: barWidth,
                      minWidth: '2px',
                      height: '100%',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* The bar itself */}
                    {bar.isPositive ? (
                      <div
                        className={`absolute left-0 right-0 rounded-t-[1px] transition-opacity ${
                          isHovered
                            ? 'bg-emerald-500'
                            : 'bg-emerald-500/70 dark:bg-emerald-500/60'
                        }`}
                        style={{
                          bottom: `${zeroLinePercent}%`,
                          height: `${bar.heightPercent}%`,
                        }}
                      />
                    ) : (
                      <div
                        className={`absolute left-0 right-0 rounded-b-[1px] transition-opacity ${
                          isHovered
                            ? 'bg-rose-500'
                            : 'bg-rose-500/70 dark:bg-rose-500/60'
                        }`}
                        style={{
                          bottom: `${zeroLinePercent - bar.heightPercent}%`,
                          height: `${bar.heightPercent}%`,
                        }}
                      />
                    )}

                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[160px] pointer-events-none">
                        <p className="text-xs font-medium">
                          {formatDate(bar.date)}
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            bar.isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatCurrency(bar.balance)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex ml-[88px]">
          <div className="flex-1 flex justify-between text-[10px] text-muted-foreground mt-1">
            {bars.length > 0 && (
              <>
                <span>{formatDate(bars[0].date)}</span>
                {bars.length > 15 && (
                  <span>
                    {formatDate(bars[Math.floor(bars.length / 2)].date)}
                  </span>
                )}
                <span>{formatDate(bars[bars.length - 1].date)}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
