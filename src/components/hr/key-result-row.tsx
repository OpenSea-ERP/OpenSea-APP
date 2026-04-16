/**
 * Key Result Row (HR)
 * Linha compacta para um Key Result no detail page de OKR — inclui métrica,
 * progresso, owner, ação de check-in e histórico colapsável.
 * Referência: 15Five Key Results card.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { OKRKeyResult } from '@/types/hr';
import {
  getKeyResultStatusBadgeClass,
  getKeyResultStatusLabel,
  getKeyResultTypeLabel,
} from '@/app/(dashboard)/(modules)/hr/(entities)/okrs/src/utils';
import {
  getConfidenceBadgeClass,
  getConfidenceLabel,
} from '@/app/(dashboard)/(modules)/hr/(entities)/okrs/src/utils';
import { OkrProgressBar } from './okr-progress-bar';
import {
  ChevronDown,
  ChevronUp,
  PlayCircle,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export interface KeyResultRowProps {
  keyResult: OKRKeyResult;
  daysToDeadline?: number | null;
  totalDays?: number;
  canCheckIn?: boolean;
  onCheckIn?: (keyResult: OKRKeyResult) => void;
}

function formatValue(value: number, unit?: string | null): string {
  const formatted = Number.isInteger(value)
    ? value.toLocaleString('pt-BR')
    : value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function KeyResultRow({
  keyResult,
  daysToDeadline,
  totalDays,
  canCheckIn = false,
  onCheckIn,
}: KeyResultRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const checkInsSorted = useMemo(() => {
    const list = keyResult.checkIns ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [keyResult.checkIns]);

  const lastTwo = checkInsSorted.slice(0, 2);
  const trend =
    lastTwo.length === 2
      ? lastTwo[0].newValue - lastTwo[1].newValue
      : null;

  const ownerName =
    checkInsSorted[0]?.employee?.fullName ?? null;

  const health = useMemo(() => {
    if (keyResult.status === 'COMPLETED') return 'COMPLETED' as const;
    if (keyResult.status === 'AT_RISK') return 'AT_RISK' as const;
    if (keyResult.status === 'BEHIND') return 'OFF_TRACK' as const;
    return 'ON_TRACK' as const;
  }, [keyResult.status]);

  return (
    <div
      data-testid={`key-result-row-${keyResult.id}`}
      className="rounded-lg border bg-white dark:bg-slate-800/60 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="text-sm font-medium">{keyResult.title}</h4>
            <Badge
              variant="outline"
              className={getKeyResultStatusBadgeClass(keyResult.status)}
            >
              {getKeyResultStatusLabel(keyResult.status)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getKeyResultTypeLabel(keyResult.type)} &middot; Peso{' '}
              {keyResult.weight}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold">
              {formatValue(keyResult.currentValue, keyResult.unit)}
            </span>
            <span className="text-xs text-muted-foreground">de</span>
            <span className="text-sm">
              {formatValue(keyResult.targetValue, keyResult.unit)}
            </span>
            {trend != null && trend !== 0 && (
              <span
                className={cn(
                  'inline-flex items-center text-xs font-medium ml-1',
                  trend > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {trend > 0 ? '+' : ''}
                {formatValue(trend, keyResult.unit)}
              </span>
            )}
            {trend === 0 && (
              <span className="inline-flex items-center text-xs text-muted-foreground ml-1">
                <Minus className="h-3 w-3 mr-0.5" />
                Sem variação
              </span>
            )}
          </div>

          <OkrProgressBar
            progress={keyResult.progressPercentage ?? 0}
            health={health}
            daysToDeadline={daysToDeadline}
            expectedProgress={
              totalDays && daysToDeadline != null
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      ((totalDays - daysToDeadline) / totalDays) * 100
                    )
                  )
                : null
            }
            size="md"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {ownerName && (
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                {getInitials(ownerName)}
              </AvatarFallback>
            </Avatar>
          )}
          {canCheckIn && onCheckIn && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              onClick={() => onCheckIn(keyResult)}
              data-testid={`key-result-checkin-${keyResult.id}`}
            >
              <PlayCircle className="h-4 w-4 mr-1" />
              Check-in
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setIsExpanded(prev => !prev)}
            aria-label={isExpanded ? 'Recolher histórico' : 'Expandir histórico'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Histórico de check-ins ({checkInsSorted.length})
          </p>
          {checkInsSorted.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhum check-in registrado.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {checkInsSorted.map(checkIn => (
                <div
                  key={checkIn.id}
                  className="flex items-start gap-3 rounded-md bg-slate-50 dark:bg-slate-900/40 p-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {formatValue(checkIn.previousValue, keyResult.unit)}{' '}
                        &rarr;{' '}
                        {formatValue(checkIn.newValue, keyResult.unit)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] py-0',
                          getConfidenceBadgeClass(checkIn.confidence)
                        )}
                      >
                        {getConfidenceLabel(checkIn.confidence)}
                      </Badge>
                    </div>
                    {checkIn.note && (
                      <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                        {checkIn.note}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-1">
                      {checkIn.employee?.fullName ?? 'Desconhecido'} &middot;{' '}
                      {formatDateTime(checkIn.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default KeyResultRow;
