'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { BinOccupancy, OccupancyLevel } from '@/types/stock';
import { getOccupancyLevel } from '@/types/stock';
import { BIN_CELL_COLORS, BIN_CELL_EMPTY } from '../constants/occupancy-colors';

interface BinCellProps {
  bin: BinOccupancy;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const OCCUPANCY_LABEL: Record<OccupancyLevel, string> = {
  empty: 'Vazio',
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  full: 'Cheio',
  blocked: 'Bloqueado',
};

export const BinCellNew = memo(function BinCellNew({
  bin,
  isHighlighted,
  onClick,
}: BinCellProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pulseActive, setPulseActive] = useState(!!isHighlighted);

  useEffect(() => {
    if (isHighlighted) {
      setPulseActive(true);
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      const timer = setTimeout(() => setPulseActive(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setPulseActive(false);
    }
  }, [isHighlighted]);

  const level = getOccupancyLevel(bin);
  const isEmpty = level === 'empty';
  const isBlocked = level === 'blocked';
  const hasItems = bin.itemCount > 0;

  const cell = (
    <div
      ref={ref}
      data-bin-id={bin.id}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Nicho ${bin.address}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'w-10 h-10 flex items-center justify-center border rounded-sm transition-colors text-xs font-medium',
        onClick && 'cursor-pointer',
        isEmpty ? BIN_CELL_EMPTY : BIN_CELL_COLORS[level],
        isHighlighted && 'ring-2 ring-blue-500',
        isHighlighted && pulseActive && 'animate-pulse',
      )}
    >
      {isBlocked ? (
        <Lock className="h-3 w-3 text-muted-foreground" />
      ) : hasItems ? (
        <span className="text-foreground/80">{bin.itemCount}</span>
      ) : null}
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{cell}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-mono font-bold text-sm">{bin.address}</p>
            <div className="text-xs space-y-0.5">
              <p>
                <span className="font-medium">
                  {bin.itemCount}{bin.capacity != null ? `/${bin.capacity}` : ''}
                </span>
                {' '}
                <span className="text-muted-foreground">
                  {bin.itemCount === 1 ? 'item' : 'itens'}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className="font-medium">{OCCUPANCY_LABEL[level]}</span>
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
