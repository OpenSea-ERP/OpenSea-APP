'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCashflowAlerts } from '@/hooks/finance';
import type { CashflowAlert, CashflowAlertSeverity } from '@/types/finance';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  X,
} from 'lucide-react';

// =============================================================================
// HELPERS
// =============================================================================

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

const DISMISS_KEY = 'finance-cashflow-alerts-dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function isDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return false;
  const elapsed = Date.now() - parseInt(dismissedAt, 10);
  return elapsed < DISMISS_DURATION;
}

function dismissAlerts(): void {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

const SEVERITY_CONFIG: Record<
  CashflowAlertSeverity,
  {
    bgClass: string;
    borderClass: string;
    textClass: string;
    iconColor: string;
    icon: React.ElementType;
  }
> = {
  CRITICAL: {
    bgClass: 'bg-rose-50 dark:bg-rose-500/8',
    borderClass: 'border-rose-200 dark:border-rose-800/50',
    textClass: 'text-rose-700 dark:text-rose-300',
    iconColor: 'text-rose-500',
    icon: AlertTriangle,
  },
  WARNING: {
    bgClass: 'bg-amber-50 dark:bg-amber-500/8',
    borderClass: 'border-amber-200 dark:border-amber-800/50',
    textClass: 'text-amber-700 dark:text-amber-300',
    iconColor: 'text-amber-500',
    icon: TrendingDown,
  },
  INFO: {
    bgClass: 'bg-sky-50 dark:bg-sky-500/8',
    borderClass: 'border-sky-200 dark:border-sky-800/50',
    textClass: 'text-sky-700 dark:text-sky-300',
    iconColor: 'text-sky-500',
    icon: TrendingDown,
  },
};

// =============================================================================
// ALERT ROW
// =============================================================================

function AlertRow({ alert }: { alert: CashflowAlert }) {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgClass} ${config.borderClass}`}
    >
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textClass}`}>
          {alert.message}
        </p>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span>Data projetada: {formatDate(alert.projectedDate)}</span>
          <span>
            Saldo projetado:{' '}
            <span
              className={
                alert.projectedBalance < 0
                  ? 'text-rose-600 dark:text-rose-400 font-medium'
                  : ''
              }
            >
              {formatCurrency(alert.projectedBalance)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CashflowAlertsBanner() {
  const { data, isLoading, error } = useCashflowAlerts();
  const [dismissed, setDismissed] = useState(() => isDismissed());
  const [expanded, setExpanded] = useState(true);

  const handleDismiss = useCallback(() => {
    dismissAlerts();
    setDismissed(true);
  }, []);

  const alerts = data?.alerts ?? [];

  // Sort by severity: CRITICAL first, then WARNING, then INFO
  const sortedAlerts = useMemo(() => {
    const order: Record<CashflowAlertSeverity, number> = {
      CRITICAL: 0,
      WARNING: 1,
      INFO: 2,
    };
    return [...alerts].sort((a, b) => order[a.severity] - order[b.severity]);
  }, [alerts]);

  // Don't render if no alerts, loading, error, or dismissed
  if (isLoading || error || alerts.length === 0 || dismissed) {
    return null;
  }

  const hasCritical = alerts.some(a => a.severity === 'CRITICAL');
  const headerBg = hasCritical
    ? 'bg-rose-50 dark:bg-rose-500/8 border-rose-200 dark:border-rose-800/50'
    : 'bg-amber-50 dark:bg-amber-500/8 border-amber-200 dark:border-amber-800/50';
  const headerText = hasCritical
    ? 'text-rose-700 dark:text-rose-300'
    : 'text-amber-700 dark:text-amber-300';
  const headerIcon = hasCritical ? 'text-rose-500' : 'text-amber-500';

  return (
    <div className={`rounded-xl border overflow-hidden ${headerBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <AlertTriangle className={`h-4 w-4 shrink-0 ${headerIcon}`} />
          <span className={`text-sm font-semibold ${headerText}`}>
            {hasCritical
              ? 'Alerta: Saldo projetado negativo'
              : 'Atencao: Saldo baixo projetado'}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            ({alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'})
          </span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={handleDismiss}
          title="Dispensar por 24 horas"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {sortedAlerts.map(alert => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
