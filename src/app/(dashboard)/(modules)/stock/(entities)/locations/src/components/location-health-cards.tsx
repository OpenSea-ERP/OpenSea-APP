'use client';

import {
  BarChart3,
  Lock,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocationHealth } from '../api';

interface HealthCardConfig {
  title: string;
  icon: React.ElementType;
  gradient: string;
  iconContainerClass: string;
  getValue: (
    data: NonNullable<ReturnType<typeof useLocationHealth>['data']>
  ) => string;
  getExtra?: (
    data: NonNullable<ReturnType<typeof useLocationHealth>['data']>
  ) => {
    percentage: number;
  } | null;
}

const HEALTH_CARDS: HealthCardConfig[] = [
  {
    title: 'Ocupação Geral',
    icon: BarChart3,
    gradient: 'from-blue-500 to-blue-600',
    iconContainerClass: 'bg-blue-100 dark:bg-blue-500/10',
    getValue: data => `${data.overallOccupancy.percentage.toFixed(0)}% ocupado`,
    getExtra: data => ({ percentage: data.overallOccupancy.percentage }),
  },
  {
    title: 'Nichos Bloqueados',
    icon: Lock,
    gradient: 'from-amber-500 to-amber-600',
    iconContainerClass: 'bg-amber-100 dark:bg-amber-500/10',
    getValue: data =>
      `${data.blockedBins.count} ${data.blockedBins.count === 1 ? 'nicho bloqueado' : 'nichos bloqueados'}`,
  },
  {
    title: 'Itens sem Local',
    icon: AlertTriangle,
    gradient: 'from-rose-500 to-rose-600',
    iconContainerClass: 'bg-rose-100 dark:bg-rose-500/10',
    getValue: data =>
      `${data.orphanedItems.count} ${data.orphanedItems.count === 1 ? 'item sem localização' : 'itens sem localização'}`,
  },
  {
    title: 'Próx. Vencimento',
    icon: Clock,
    gradient: 'from-orange-500 to-orange-600',
    iconContainerClass: 'bg-orange-100 dark:bg-orange-500/10',
    getValue: data =>
      `${data.expiringItems.count} ${data.expiringItems.count === 1 ? 'item vence' : 'itens vencem'} em ${data.expiringItems.thresholdDays} dias`,
  },
  {
    title: 'Inconsistências',
    icon: ShieldAlert,
    gradient: 'from-rose-500 to-rose-600',
    iconContainerClass: 'bg-rose-100 dark:bg-rose-500/10',
    getValue: data =>
      `${data.inconsistencies.count} ${data.inconsistencies.count === 1 ? 'inconsistência' : 'inconsistências'}`,
  },
];

function HealthCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800/60 border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
    </div>
  );
}

export function LocationHealthCards() {
  const { data, isLoading } = useLocationHealth();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <HealthCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {HEALTH_CARDS.map(card => {
        const Icon = card.icon;
        const extra = card.getExtra?.(data);

        return (
          <div
            key={card.title}
            className="bg-white dark:bg-slate-800/60 border border-border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  card.iconContainerClass
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    card.gradient.includes('blue') &&
                      'text-blue-600 dark:text-blue-400',
                    card.gradient.includes('amber') &&
                      'text-amber-600 dark:text-amber-400',
                    card.gradient.includes('rose') &&
                      'text-rose-600 dark:text-rose-400',
                    card.gradient.includes('orange') &&
                      'text-orange-600 dark:text-orange-400'
                  )}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {card.title}
              </span>
            </div>

            <p className="text-sm font-semibold text-foreground">
              {card.getValue(data)}
            </p>

            {/* Progress bar for occupancy */}
            {extra && (
              <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    extra.percentage < 50 && 'bg-emerald-500',
                    extra.percentage >= 50 &&
                      extra.percentage < 80 &&
                      'bg-amber-500',
                    extra.percentage >= 80 &&
                      extra.percentage < 95 &&
                      'bg-orange-500',
                    extra.percentage >= 95 && 'bg-rose-500'
                  )}
                  style={{ width: `${Math.min(extra.percentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
