'use client';

import { cn } from '@/lib/utils';
import { useCentralTheme } from '@/contexts/central-theme-context';
import { HTMLAttributes, forwardRef } from 'react';

export type CentralBadgeVariant =
  | 'violet'
  | 'rose'
  | 'sky'
  | 'emerald'
  | 'teal'
  | 'orange'
  | 'default';

export interface CentralBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: CentralBadgeVariant;
}

const lightClasses: Record<CentralBadgeVariant, string> = {
  violet: 'bg-violet-50 text-violet-700',
  rose: 'bg-rose-50 text-rose-700',
  sky: 'bg-sky-50 text-sky-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  teal: 'bg-teal-50 text-teal-700',
  orange: 'bg-orange-50 text-orange-700',
  default: 'bg-zinc-100 text-zinc-600',
};

const darkClasses: Record<CentralBadgeVariant, string> = {
  violet: 'bg-violet-500/10 text-violet-300',
  rose: 'bg-rose-500/10 text-rose-300',
  sky: 'bg-sky-500/10 text-sky-300',
  emerald: 'bg-emerald-500/10 text-emerald-300',
  teal: 'bg-teal-500/10 text-teal-300',
  orange: 'bg-orange-500/10 text-orange-300',
  default: 'bg-zinc-500/10 text-zinc-400',
};

/**
 * Badge colorido para o Central.
 * Usa cores de personalidade Tailwind com suporte dual-theme.
 */
export const CentralBadge = forwardRef<HTMLSpanElement, CentralBadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const { theme } = useCentralTheme();
    const isDark = theme === 'dark';
    const colorClasses = isDark ? darkClasses[variant] : lightClasses[variant];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center text-[9px] font-semibold rounded-xl px-2 py-0.5',
          colorClasses,
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

CentralBadge.displayName = 'CentralBadge';
