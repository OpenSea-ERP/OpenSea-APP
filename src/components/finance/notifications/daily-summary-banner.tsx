'use client';

import { Button } from '@/components/ui/button';
import { useDailySummary, useNotificationPreferences } from '@/hooks/finance';
import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getTodayKey(): string {
  return `finance_daily_summary_dismissed_${new Date().toISOString().split('T')[0]}`;
}

export function DailySummaryBanner() {
  const { data, isLoading } = useDailySummary();
  const { prefs } = useNotificationPreferences();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = getTodayKey();
      setDismissed(localStorage.getItem(key) === 'true');
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(getTodayKey(), 'true');
    } catch {
      // ignore
    }
  }, []);

  if (!prefs.notifDailySummary || dismissed || isLoading || !data) return null;

  const { payableToday, receivableToday, overdueCount, overdueTotal } = data;

  // Nothing to show
  if (overdueCount === 0 && payableToday === 0 && receivableToday === 0) return null;

  return (
    <div className="relative rounded-lg border bg-card p-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
        aria-label="Fechar resumo diario"
      >
        <X className="h-3 w-3" />
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pr-8">
        {overdueCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-sm">
              <span className="font-medium text-destructive">
                {overdueCount} conta{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}
              </span>
              <span className="text-muted-foreground">
                {' '}({formatCurrency(overdueTotal)})
              </span>
            </span>
          </div>
        )}

        {payableToday > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-sm">
              <span className="font-medium">A pagar (7 dias):</span>{' '}
              <span className="text-muted-foreground">
                {formatCurrency(payableToday)}
              </span>
            </span>
          </div>
        )}

        {receivableToday > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-sm">
              <span className="font-medium">A receber (7 dias):</span>{' '}
              <span className="text-green-600">
                {formatCurrency(receivableToday)}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
