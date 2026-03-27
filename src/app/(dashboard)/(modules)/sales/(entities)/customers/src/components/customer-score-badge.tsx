'use client';

import type { LeadScoreTier } from '@/types/sales';
import { Flame, Snowflake, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Score Tier Config ────────────────────────────────────────

const TIER_CONFIG: Record<
  LeadScoreTier,
  {
    label: string;
    icon: React.ElementType;
    color: string;
  }
> = {
  HOT: {
    label: 'Quente',
    icon: Flame,
    color:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  },
  WARM: {
    label: 'Morno',
    icon: Thermometer,
    color:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  },
  COLD: {
    label: 'Frio',
    icon: Snowflake,
    color:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  },
};

// ─── Component ────────────────────────────────────────────────

interface CustomerScoreBadgeProps {
  score?: number;
  tier?: LeadScoreTier;
  className?: string;
}

/**
 * Derives tier from score if not explicitly provided:
 * - HOT: score >= 70
 * - WARM: score >= 30
 * - COLD: score < 30
 */
function deriveTier(score: number): LeadScoreTier {
  if (score >= 70) return 'HOT';
  if (score >= 30) return 'WARM';
  return 'COLD';
}

export function CustomerScoreBadge({
  score,
  tier,
  className,
}: CustomerScoreBadgeProps) {
  if (score === undefined && tier === undefined) return null;

  const resolvedTier = tier ?? deriveTier(score ?? 0);
  const config = TIER_CONFIG[resolvedTier];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0',
        config.color,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
      {score !== undefined && (
        <span className="ml-0.5 opacity-75">{score}</span>
      )}
    </span>
  );
}
