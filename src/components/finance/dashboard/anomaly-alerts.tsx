'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnomalyReport } from '@/hooks/finance';
import type { Anomaly, AnomalySeverity } from '@/types/finance';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const SEVERITY_CONFIG: Record<
  AnomalySeverity,
  { color: string; bgLight: string; bgDark: string; textLight: string; textDark: string; label: string }
> = {
  CRITICAL: {
    color: 'bg-rose-600',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-500/8',
    textLight: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    label: 'Crítico',
  },
  HIGH: {
    color: 'bg-rose-400',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-500/8',
    textLight: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    label: 'Alto',
  },
  MEDIUM: {
    color: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-500/8',
    textLight: 'text-amber-700',
    textDark: 'dark:text-amber-300',
    label: 'Médio',
  },
  LOW: {
    color: 'bg-amber-300',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-500/8',
    textLight: 'text-amber-700',
    textDark: 'dark:text-amber-300',
    label: 'Baixo',
  },
};

const TYPE_ICON: Record<string, typeof AlertTriangle> = {
  EXPENSE_SPIKE: TrendingUp,
  PRICE_INCREASE: ArrowUpRight,
  UNUSUAL_FREQUENCY: BarChart3,
  NEW_HIGH_VALUE: Zap,
};

function AnomalyRow({ anomaly }: { anomaly: Anomaly }) {
  const router = useRouter();
  const severity = SEVERITY_CONFIG[anomaly.severity];
  const Icon = TYPE_ICON[anomaly.type] ?? AlertTriangle;

  const handleClick = () => {
    if (anomaly.entryId) {
      router.push(`/finance/entries/${anomaly.entryId}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!anomaly.entryId}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        anomaly.entryId
          ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
          : 'cursor-default'
      } border-slate-200 dark:border-slate-700/50`}
    >
      <div className="flex items-start gap-3">
        {/* Severity indicator */}
        <div className="flex-shrink-0 mt-0.5">
          <div className={`w-2.5 h-2.5 rounded-full ${severity.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${severity.bgLight} ${severity.bgDark} ${severity.textLight} ${severity.textDark} border-0`}
            >
              {severity.label}
            </Badge>
            {anomaly.categoryName && (
              <span className="text-xs text-muted-foreground truncate">
                {anomaly.categoryName}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground leading-snug">
            {anomaly.description}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span>
              Valor: <strong className="text-foreground">{formatCurrency(anomaly.currentValue)}</strong>
            </span>
            <span>
              Esperado: {formatCurrency(anomaly.expectedValue)}
            </span>
            <span className={`font-medium ${severity.textLight} ${severity.textDark}`}>
              +{anomaly.deviationPercent}%
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function AnomalyAlerts() {
  const { data, isLoading, error } = useAnomalyReport(6);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !data) {
    return null;
  }

  const hasAnomalies = data.anomalies.length > 0;
  const criticalCount = data.anomalies.filter(
    (a) => a.severity === 'CRITICAL',
  ).length;
  const highCount = data.anomalies.filter(
    (a) => a.severity === 'HIGH',
  ).length;

  return (
    <Card
      className={`bg-white dark:bg-slate-800/60 border ${
        hasAnomalies
          ? 'border-rose-200 dark:border-rose-500/20'
          : 'border-emerald-200 dark:border-emerald-500/20'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle
              className={`w-4 h-4 ${
                hasAnomalies
                  ? 'text-rose-500'
                  : 'text-emerald-500'
              }`}
            />
            Alertas de Anomalias
          </CardTitle>
          {hasAnomalies && (
            <div className="flex items-center gap-1.5">
              {criticalCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300 border-0 text-xs"
                >
                  {criticalCount} {criticalCount === 1 ? 'critico' : 'criticos'}
                </Badge>
              )}
              {highCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-rose-50 dark:bg-rose-500/8 text-rose-600 dark:text-rose-400 border-0 text-xs"
                >
                  {highCount} {highCount === 1 ? 'alto' : 'altos'}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {data.anomalies.length}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasAnomalies ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Nenhuma anomalia detectada
              </p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Todos os lançamentos dos últimos 6 meses estão dentro dos padrões normais.
                {data.totalEntriesAnalyzed > 0 && (
                  <> {data.totalEntriesAnalyzed} lançamentos analisados em {data.categoriesAnalyzed} categorias.</>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {data.anomalies.map((anomaly, index) => (
              <AnomalyRow key={anomaly.entryId ?? `anomaly-${index}`} anomaly={anomaly} />
            ))}
            {data.totalEntriesAnalyzed > 0 && (
              <p className="text-xs text-muted-foreground pt-2 text-center">
                {data.totalEntriesAnalyzed} lançamentos analisados em {data.categoriesAnalyzed} categorias
                ({data.analyzedPeriod.from} a {data.analyzedPeriod.to})
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
