/**
 * OKR Progress Bar (HR)
 * Barra de progresso colorida por status de saúde com tooltip de detalhes,
 * inspirada em 15Five / Lattice / Linear progress.
 */

'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  getHealthBarClass,
  getHealthLabel,
  type OkrHealthStatus,
} from '@/lib/hr/okr-rollup';

export interface OkrProgressBarProps {
  progress: number;
  health: OkrHealthStatus;
  expectedProgress?: number | null;
  daysToDeadline?: number | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<OkrProgressBarProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export function OkrProgressBar({
  progress,
  health,
  expectedProgress,
  daysToDeadline,
  showLabel = false,
  size = 'md',
  className,
}: OkrProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  const expected =
    expectedProgress != null
      ? Math.min(100, Math.max(0, Math.round(expectedProgress)))
      : null;

  const tooltipText = (
    <div className="text-xs leading-relaxed">
      <div className="font-medium">{getHealthLabel(health)}</div>
      <div>Progresso: {clamped}%</div>
      {expected != null && <div>Esperado: {expected}%</div>}
      {daysToDeadline != null && (
        <div>
          {daysToDeadline > 0
            ? `${daysToDeadline} dia(s) até o prazo`
            : daysToDeadline === 0
              ? 'Prazo é hoje'
              : `${Math.abs(daysToDeadline)} dia(s) atrasado`}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('w-full space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{getHealthLabel(health)}</span>
          <span className="font-medium">{clamped}%</span>
        </div>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700',
              SIZE_CLASS[size]
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                getHealthBarClass(health)
              )}
              style={{ width: `${clamped}%` }}
            />
            {expected != null && expected > 0 && expected < 100 && (
              <div
                className="absolute top-0 h-full w-0.5 bg-slate-500/60 dark:bg-slate-300/60"
                style={{ left: `${expected}%` }}
                aria-hidden
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipText}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export default OkrProgressBar;
