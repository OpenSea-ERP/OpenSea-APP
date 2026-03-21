'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export type StatPillIconColor = 'violet' | 'sky' | 'emerald' | 'teal';

export interface CentralStatPillProps {
  icon: ReactNode;
  iconColor: StatPillIconColor;
  value: string;
  label: string;
  change?: string;
  changeType?: 'up' | 'warn';
}

const iconBgClasses: Record<StatPillIconColor, string> = {
  violet: 'bg-violet-500/20',
  sky: 'bg-sky-500/20',
  emerald: 'bg-emerald-500/20',
  teal: 'bg-teal-500/20',
};

const iconTextClasses: Record<StatPillIconColor, string> = {
  violet: 'text-violet-300',
  sky: 'text-sky-300',
  emerald: 'text-emerald-300',
  teal: 'text-teal-300',
};

/**
 * Pill de estatística para o hero banner do Central.
 * Exibe ícone colorido, valor, label e indicador de mudança.
 */
export function CentralStatPill({
  icon,
  iconColor,
  value,
  label,
  change,
  changeType,
}: CentralStatPillProps) {
  return (
    <div
      className="rounded-lg p-2 px-3.5 flex items-center gap-2"
      style={{
        background: 'var(--central-hero-pill-bg)',
        border: '1px solid var(--central-hero-pill-border)',
      }}
    >
      {/* Icon container */}
      <div
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-lg',
          iconBgClasses[iconColor]
        )}
      >
        <span className={cn('flex items-center', iconTextClasses[iconColor])}>
          {icon}
        </span>
      </div>

      {/* Value + Label */}
      <div className="flex flex-col">
        <span
          className="text-base font-extrabold leading-tight"
          style={{ color: 'var(--central-hero-text)' }}
        >
          {value}
        </span>
        <span
          className="text-[10px] leading-tight"
          style={{ color: 'var(--central-hero-muted)' }}
        >
          {label}
        </span>
      </div>

      {/* Change indicator */}
      {change && (
        <span
          className={cn(
            'text-[9px] font-semibold ml-1',
            changeType === 'up' && 'text-emerald-400',
            changeType === 'warn' && 'text-rose-400'
          )}
        >
          {change}
        </span>
      )}
    </div>
  );
}
