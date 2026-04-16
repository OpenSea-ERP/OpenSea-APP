'use client';

/**
 * OpenSea OS - Salary Timeline Card
 *
 * Componente reutilizável que renderiza a timeline vertical do
 * histórico salarial de um funcionário. Pode ser usado tanto em uma
 * página dedicada (`/hr/employees/[id]/salary`) quanto dentro da
 * aba "Salário" do detalhe do funcionário.
 *
 * Padrões aplicados:
 *  - Promotion markers com badge de destaque (PROMOTION = "Promoção")
 *  - Variação percentual em badge dual-theme (Emerald/Rose)
 *  - data-testid em todos os pontos de interação
 *  - Loading skeleton e empty state explícitos
 */

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  calculatePercentChange,
  formatAbsoluteChange,
  formatPercentChange,
  getChangeDirection,
  getReasonBadgeClassName,
  getReasonDotClassName,
  getReasonLabel,
  type SalaryChangeReason,
} from '@/lib/hr/calculate-salary-change';
import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Minus,
  Rocket,
  Sparkles,
  Sprout,
  TrendingDown,
  TrendingUp,
  UserCog,
  Wand2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

interface SalaryTimelineEntry {
  id: string;
  previousSalary: number | null;
  newSalary: number;
  reason: SalaryChangeReason;
  notes: string | null;
  effectiveDate: string;
  changedBy: string;
  createdAt: string;
}

export interface SalaryTimelineUserSummary {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface SalaryTimelineCardProps {
  entries: SalaryTimelineEntry[];
  isLoading?: boolean;
  /** Mapa opcional de userId → resumo (avatar+nome) para "Quem registrou". */
  userResolver?: (userId: string) => SalaryTimelineUserSummary | undefined;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Texto do botão de CTA do empty state, se houver. */
  emptyAction?: React.ReactNode;
}

const REASON_ICON_MAP: Record<SalaryChangeReason, LucideIcon> = {
  ADMISSION: Sprout,
  ADJUSTMENT: Wand2,
  PROMOTION: Rocket,
  MERIT: Sparkles,
  ROLE_CHANGE: UserCog,
  CORRECTION: Wrench,
};

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatBRL(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return BRL_FORMATTER.format(value);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function SalaryTimelineCard({
  entries,
  isLoading,
  userResolver,
  className,
  emptyTitle = 'Nenhuma mudança registrada',
  emptyDescription = 'Quando uma alteração salarial for registrada, ela aparecerá aqui em ordem cronológica.',
  emptyAction,
}: SalaryTimelineCardProps) {
  if (isLoading) {
    return (
      <Card
        data-testid="salary-timeline-loading"
        className={cn(
          'bg-white dark:bg-slate-800/60 border border-border p-6',
          className
        )}
      >
        <ol className="relative ml-3 space-y-6 border-l border-border pl-6">
          {[0, 1, 2].map(index => (
            <li key={index} className="relative">
              <span className="absolute -left-[33px] top-3 h-4 w-4 rounded-full bg-muted" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </li>
          ))}
        </ol>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card
        data-testid="salary-timeline-empty"
        className={cn(
          'bg-white dark:bg-slate-800/60 border border-border p-12 text-center',
          className
        )}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500/15 to-teal-500/15">
          <ClipboardList className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{emptyTitle}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {emptyDescription}
        </p>
        {emptyAction && <div className="mt-6">{emptyAction}</div>}
      </Card>
    );
  }

  return (
    <Card
      data-testid="salary-timeline"
      className={cn(
        'bg-white dark:bg-slate-800/60 border border-border p-6',
        className
      )}
    >
      <ol className="relative ml-3 space-y-6 border-l border-border pl-6">
        {entries.map(entry => {
          const ReasonIcon = REASON_ICON_MAP[entry.reason];
          const direction = getChangeDirection(
            entry.previousSalary,
            entry.newSalary
          );
          const percent = calculatePercentChange(
            entry.previousSalary,
            entry.newSalary
          );
          const absoluteDelta =
            entry.previousSalary !== null
              ? entry.newSalary - entry.previousSalary
              : entry.newSalary;
          const isPromotion = entry.reason === 'PROMOTION';
          const author = userResolver?.(entry.changedBy);

          const directionStyle =
            direction === 'increase'
              ? {
                  badge:
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
                  icon: TrendingUp,
                  arrow: ArrowUpRight,
                }
              : direction === 'decrease'
                ? {
                    badge:
                      'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
                    icon: TrendingDown,
                    arrow: ArrowDownRight,
                  }
                : direction === 'unchanged'
                  ? {
                      badge:
                        'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
                      icon: Minus,
                      arrow: Minus,
                    }
                  : {
                      badge:
                        'bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300',
                      icon: Sprout,
                      arrow: ArrowUpRight,
                    };

          const DirectionIcon = directionStyle.icon;
          const ArrowIcon = directionStyle.arrow;

          return (
            <li
              key={entry.id}
              data-testid={`salary-item-${entry.id}`}
              className="relative"
            >
              <span
                className={cn(
                  'absolute -left-[33px] top-4 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background',
                  getReasonDotClassName(entry.reason)
                )}
                aria-hidden
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>

              <div className="rounded-xl border border-border bg-white p-5 shadow-xs dark:bg-slate-900/40">
                {/* Header row: date + reason + promotion marker */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800'
                      )}
                    >
                      <ReasonIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <p className="text-base font-semibold leading-tight">
                        {DATE_FORMATTER.format(new Date(entry.effectiveDate))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vigência efetiva
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isPromotion && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                      >
                        <Rocket className="h-3 w-3" />
                        Promoção
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        'gap-1 border-transparent',
                        getReasonBadgeClassName(entry.reason)
                      )}
                    >
                      {getReasonLabel(entry.reason)}
                    </Badge>
                  </div>
                </div>

                {/* Salary transition */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      {formatBRL(entry.previousSalary)}
                    </span>
                    <ArrowIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xl font-semibold tracking-tight">
                      {formatBRL(entry.newSalary)}
                    </span>
                  </div>

                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {direction !== 'initial' && direction !== 'unchanged' && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'gap-1 border-transparent font-mono',
                          directionStyle.badge
                        )}
                      >
                        <DirectionIcon className="h-3 w-3" />
                        {formatPercentChange(percent)}
                      </Badge>
                    )}
                    {direction !== 'initial' && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'border-transparent font-mono',
                          directionStyle.badge
                        )}
                      >
                        {formatAbsoluteChange(absoluteDelta)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {entry.notes && (
                  <p className="mt-4 rounded-lg border border-border bg-slate-50 p-3 text-sm text-foreground/80 dark:bg-slate-800/40">
                    {entry.notes}
                  </p>
                )}

                {/* Footer: who registered + timestamp */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-xs font-medium text-white">
                      {author?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={author.avatarUrl}
                          alt={author.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(author?.name ?? entry.changedBy)
                      )}
                    </div>
                    <div className="text-xs">
                      <p className="font-medium leading-tight">
                        {author?.name ?? 'Usuário do sistema'}
                      </p>
                      <p className="text-muted-foreground">Registrou</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {DATETIME_FORMATTER.format(new Date(entry.createdAt))}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
