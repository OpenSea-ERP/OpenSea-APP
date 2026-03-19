'use client';

import { cn } from '@/lib/utils';
import { OCCUPANCY_LEGEND } from '../constants/occupancy-colors';

export function BinLegend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {OCCUPANCY_LEGEND.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-3 h-3 rounded-sm border',
              item.color,
              item.border,
              'dashed' in item && item.dashed && 'border-dashed',
            )}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
