'use client';

import React from 'react';
import { Package, Lock, Unlock, Eye, MoreVertical, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Bin, OccupancyLevel } from '@/types/stock';
import { getOccupancyLevel } from '@/types/stock';
import { OCCUPANCY_BADGE_CLASSES, OCCUPANCY_LABELS } from '../constants';

interface BinCardProps {
  bin: Bin;
  onView?: (bin: Bin) => void;
  onBlock?: (bin: Bin) => void;
  onUnblock?: (bin: Bin) => void;
  onPrintLabel?: (bin: Bin) => void;
  className?: string;
  compact?: boolean;
}

export function BinCard({
  bin,
  onView,
  onBlock,
  onUnblock,
  onPrintLabel,
  className,
  compact = false,
}: BinCardProps) {
  const occupancyLevel = getOccupancyLevel({
    id: bin.id,
    address: bin.address,
    aisle: bin.aisle,
    shelf: bin.shelf,
    position: bin.position,
    currentOccupancy: bin.currentOccupancy,
    capacity: bin.capacity,
    isBlocked: bin.isBlocked,
    itemCount: bin.currentOccupancy,
  });

  const getOccupancyPercentage = () => {
    if (!bin.capacity || bin.capacity === 0) return 0;
    return Math.round((bin.currentOccupancy / bin.capacity) * 100);
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer',
          bin.isBlocked && 'opacity-60',
          className
        )}
        onClick={() => onView?.(bin)}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              occupancyLevel === 'empty' && 'bg-gray-300',
              occupancyLevel === 'low' && 'bg-green-500',
              occupancyLevel === 'medium' && 'bg-yellow-500',
              occupancyLevel === 'high' && 'bg-orange-500',
              occupancyLevel === 'full' && 'bg-red-500',
              occupancyLevel === 'blocked' && 'bg-gray-500'
            )}
          />
          <span className="font-mono text-sm font-medium">{bin.address}</span>
          {bin.isBlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="text-xs text-muted-foreground">
          {bin.currentOccupancy}
          {bin.capacity && `/${bin.capacity}`}
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-md',
        bin.isBlocked && 'opacity-70 border-dashed',
        !bin.isActive && 'opacity-50',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                occupancyLevel === 'empty' && 'bg-gray-100 dark:bg-gray-800',
                occupancyLevel === 'low' && 'bg-green-100 dark:bg-green-900/30',
                occupancyLevel === 'medium' &&
                  'bg-yellow-100 dark:bg-yellow-900/30',
                occupancyLevel === 'high' &&
                  'bg-orange-100 dark:bg-orange-900/30',
                occupancyLevel === 'full' && 'bg-red-100 dark:bg-red-900/30',
                occupancyLevel === 'blocked' && 'bg-gray-200 dark:bg-gray-700'
              )}
            >
              {bin.isBlocked ? (
                <Lock className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Package
                  className={cn(
                    'h-5 w-5',
                    occupancyLevel === 'empty' && 'text-gray-400',
                    occupancyLevel === 'low' && 'text-green-600',
                    occupancyLevel === 'medium' && 'text-yellow-600',
                    occupancyLevel === 'high' && 'text-orange-600',
                    occupancyLevel === 'full' && 'text-red-600'
                  )}
                />
              )}
            </div>
            <div>
              <span className="font-mono text-base font-bold">
                {bin.address}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    OCCUPANCY_BADGE_CLASSES[occupancyLevel]
                  )}
                >
                  {OCCUPANCY_LABELS[occupancyLevel]}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(bin)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </DropdownMenuItem>
              )}
              {onPrintLabel && (
                <DropdownMenuItem onClick={() => onPrintLabel(bin)}>
                  <Tag className="mr-2 h-4 w-4" />
                  Imprimir Etiqueta
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {bin.isBlocked && onUnblock ? (
                <DropdownMenuItem onClick={() => onUnblock(bin)}>
                  <Unlock className="mr-2 h-4 w-4" />
                  Desbloquear
                </DropdownMenuItem>
              ) : (
                onBlock && (
                  <DropdownMenuItem onClick={() => onBlock(bin)}>
                    <Lock className="mr-2 h-4 w-4" />
                    Bloquear
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Ocupação */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Ocupação</span>
            <span className="font-medium">
              {bin.currentOccupancy}
              {bin.capacity ? `/${bin.capacity}` : ''} itens
              {bin.capacity ? ` (${getOccupancyPercentage()}%)` : ''}
            </span>
          </div>
          {bin.capacity && bin.capacity > 0 && (
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  occupancyLevel === 'empty' && 'bg-gray-300',
                  occupancyLevel === 'low' && 'bg-green-500',
                  occupancyLevel === 'medium' && 'bg-yellow-500',
                  occupancyLevel === 'high' && 'bg-orange-500',
                  occupancyLevel === 'full' && 'bg-red-500',
                  occupancyLevel === 'blocked' && 'bg-gray-400'
                )}
                style={{ width: `${Math.min(getOccupancyPercentage(), 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Motivo do bloqueio */}
        {bin.isBlocked && bin.blockReason && (
          <p className="mt-2 text-xs text-muted-foreground italic">
            Bloqueado: {bin.blockReason}
          </p>
        )}

        {/* Posição */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Corredor {bin.aisle}</span>
          <span>•</span>
          <span>Prateleira {bin.shelf.toString().padStart(2, '0')}</span>
          <span>•</span>
          <span>Nicho {bin.position}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Skeleton para loading
// ============================================

export function BinCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 rounded-lg border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="h-3 w-8 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="mt-3 flex gap-2">
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
