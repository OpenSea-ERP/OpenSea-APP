'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Warehouse } from 'lucide-react';
import type { Warehouse as WarehouseType } from '@/types/stock';

interface WarehouseCardProps {
  warehouse: WarehouseType;
  isSelected?: boolean;
}

export function WarehouseCardNew({ warehouse, isSelected }: WarehouseCardProps) {
  const stats = warehouse.stats;
  const occupancyPercentage = stats?.occupancyPercentage ?? 0;

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-300 dark:bg-gray-600';
    if (percentage < 50) return 'bg-emerald-500';
    if (percentage < 80) return 'bg-amber-500';
    if (percentage < 95) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800/60 border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer',
        isSelected && 'ring-2 ring-blue-500 border-blue-500',
        !warehouse.isActive && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
          <Warehouse className="h-5 w-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-mono font-bold text-sm text-foreground block">
                {warehouse.code}
              </span>
              <span className="text-sm text-muted-foreground block truncate">
                {warehouse.name}
              </span>
            </div>
            <Badge
              variant={warehouse.isActive ? 'default' : 'secondary'}
              className={cn(
                'shrink-0 text-xs',
                warehouse.isActive &&
                  'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300',
              )}
            >
              {warehouse.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {/* Stats row */}
          {stats && (
            <p className="text-xs text-muted-foreground">
              {stats.totalZones} {stats.totalZones === 1 ? 'zona' : 'zonas'} &middot;{' '}
              {stats.totalBins.toLocaleString()} nichos &middot;{' '}
              {occupancyPercentage.toFixed(0)}% ocupação
            </p>
          )}

          {/* Progress bar */}
          {stats && stats.totalBins > 0 && (
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  getProgressColor(occupancyPercentage),
                )}
                style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
