'use client';

/**
 * EmployeeWarningHistory
 *
 * Lista cronológica compacta de todas as advertências do funcionário, exibida
 * na coluna lateral da página de detalhe. Cada item mostra tipo, data e motivo
 * (truncado), com badge colorido conforme o tipo. A advertência atualmente em
 * foco recebe destaque visual (anel violet) para orientar o gestor.
 *
 * Quando o histórico ultrapassa cinco itens, oferece um filtro por tipo
 * (Verbal / Escrita / Suspensão / Aviso) para facilitar a navegação.
 *
 * Inspirações: BambooHR (employee timeline), Lattice (review history),
 * Linear (activity feed), Slack (channel pinned items).
 */

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { cn } from '@/lib/utils';
import type { EmployeeWarning, WarningType } from '@/types/hr';
import { AlertTriangle, History } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  getWarningTypeBadgeClass,
  getWarningTypeLabel,
} from '@/app/(dashboard)/(modules)/hr/(entities)/warnings/src/utils';

const TYPE_FILTER_OPTIONS: { value: WarningType; label: string }[] = [
  { value: 'VERBAL', label: 'Verbal' },
  { value: 'WRITTEN', label: 'Escrita' },
  { value: 'SUSPENSION', label: 'Suspensão' },
  { value: 'TERMINATION_WARNING', label: 'Aviso de Desligamento' },
];

const FILTER_THRESHOLD = 5;

interface EmployeeWarningHistoryProps {
  warnings: EmployeeWarning[];
  /** ID da advertência atualmente em foco no detalhe — recebe destaque. */
  currentWarningId?: string;
  className?: string;
}

function formatShortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}\u2026`;
}

export function EmployeeWarningHistory({
  warnings,
  currentWarningId,
  className,
}: EmployeeWarningHistoryProps) {
  const [typeFilter, setTypeFilter] = useState<WarningType | ''>('');

  const sortedWarnings = useMemo(() => {
    return [...warnings].sort((firstWarning, secondWarning) =>
      secondWarning.incidentDate.localeCompare(firstWarning.incidentDate)
    );
  }, [warnings]);

  const visibleWarnings = useMemo(() => {
    if (!typeFilter) return sortedWarnings;
    return sortedWarnings.filter(warning => warning.type === typeFilter);
  }, [sortedWarnings, typeFilter]);

  const showFilter = sortedWarnings.length > FILTER_THRESHOLD;

  return (
    <Card
      data-testid="warning-history"
      className={cn(
        'bg-white dark:bg-slate-800/60 border border-border p-5',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-slate-500 to-slate-700 text-white">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Histórico do funcionário</h3>
            <p className="text-xs text-muted-foreground">
              {sortedWarnings.length}{' '}
              {sortedWarnings.length === 1
                ? 'advertência registrada'
                : 'advertências registradas'}
            </p>
          </div>
        </div>
      </div>

      {showFilter && (
        <div className="mt-4" data-testid="warning-history-filter">
          <FilterDropdown
            label="Tipo"
            icon={AlertTriangle}
            options={TYPE_FILTER_OPTIONS}
            value={typeFilter}
            onChange={selected => setTypeFilter(selected as WarningType | '')}
            activeColor="violet"
          />
        </div>
      )}

      <div className="mt-4 space-y-2">
        {visibleWarnings.length === 0 ? (
          <p className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-4 text-center text-xs text-muted-foreground">
            {typeFilter
              ? 'Nenhuma advertência deste tipo no histórico.'
              : 'Sem advertências anteriores registradas.'}
          </p>
        ) : (
          visibleWarnings.map(warning => {
            const isCurrent = warning.id === currentWarningId;
            return (
              <Link
                key={warning.id}
                href={`/hr/warnings/${warning.id}`}
                data-testid={`warning-history-item-${warning.id}`}
                className={cn(
                  'block rounded-lg border p-3 transition-colors',
                  isCurrent
                    ? 'border-violet-400 dark:border-violet-500/50 bg-violet-50 dark:bg-violet-500/8 ring-1 ring-violet-300 dark:ring-violet-500/30'
                    : 'border-border bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      getWarningTypeBadgeClass(warning.type)
                    )}
                  >
                    {getWarningTypeLabel(warning.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatShortDate(warning.incidentDate)}
                  </span>
                </div>
                <p
                  className={cn(
                    'mt-2 text-xs',
                    isCurrent
                      ? 'text-violet-900 dark:text-violet-100 font-medium'
                      : 'text-muted-foreground'
                  )}
                  title={warning.reason}
                >
                  {truncate(warning.reason, 90)}
                </p>
                {warning.status === 'REVOKED' && (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-rose-600 dark:text-rose-400 font-medium">
                    Revogada
                  </p>
                )}
              </Link>
            );
          })
        )}
      </div>
    </Card>
  );
}

export default EmployeeWarningHistory;
