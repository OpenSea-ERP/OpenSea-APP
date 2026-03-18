'use client';

import React from 'react';
import { MapPin, Package, Lock, AlertCircle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { BinSuggestion, OccupancyLevel, Bin } from '@/types/stock';

export interface SuggestionsProps {
  suggestions: BinSuggestion[] | Bin[];
  selectedAddress?: string;
  onSelect: (address: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  maxHeight?: number;
}

// Colors based on occupancy level
const OCCUPANCY_COLORS: Record<
  OccupancyLevel,
  { bg: string; text: string; label: string }
> = {
  empty: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    label: 'Vazio',
  },
  low: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    label: 'Baixa',
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    label: 'Média',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    label: 'Alta',
  },
  full: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Cheio',
  },
  blocked: {
    bg: 'bg-gray-200 dark:bg-gray-700',
    text: 'text-gray-500 dark:text-gray-400',
    label: 'Bloqueado',
  },
};

function isBinSuggestion(item: BinSuggestion | Bin): item is BinSuggestion {
  return 'occupancyLevel' in item;
}

function getOccupancyLevel(item: BinSuggestion | Bin): OccupancyLevel {
  if (isBinSuggestion(item)) {
    return item.occupancyLevel;
  }
  // For Bin type, calculate from capacity
  if (item.isBlocked) return 'blocked';
  if (!item.capacity || item.capacity === 0) {
    return item.currentOccupancy === 0 ? 'empty' : 'low';
  }
  const percentage = (item.currentOccupancy / item.capacity) * 100;
  if (percentage === 0) return 'empty';
  if (percentage < 50) return 'low';
  if (percentage < 80) return 'medium';
  if (percentage < 95) return 'high';
  return 'full';
}

function getItemCount(item: BinSuggestion | Bin): number {
  if (isBinSuggestion(item)) {
    return item.itemCount;
  }
  return item.currentOccupancy;
}

export function Suggestions({
  suggestions,
  selectedAddress,
  onSelect,
  isLoading = false,
  emptyMessage = 'Nenhum resultado encontrado',
  className,
  maxHeight = 300,
}: SuggestionsProps) {
  if (isLoading) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ScrollArea className={className} style={{ maxHeight }}>
      <div className="space-y-1 p-1">
        {suggestions.map(suggestion => {
          const address = isBinSuggestion(suggestion)
            ? suggestion.address
            : suggestion.address;
          const level = getOccupancyLevel(suggestion);
          const itemCount = getItemCount(suggestion);
          const colors = OCCUPANCY_COLORS[level];
          const isSelected = selectedAddress === address;
          const isBlocked = level === 'blocked';

          return (
            <button
              key={address}
              type="button"
              onClick={() => !isBlocked && onSelect(address)}
              disabled={isBlocked}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                'hover:bg-accent focus:bg-accent focus:outline-none',
                isSelected && 'bg-accent ring-2 ring-primary',
                isBlocked && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                  colors.bg
                )}
              >
                {isBlocked ? (
                  <Lock className={cn('h-5 w-5', colors.text)} />
                ) : (
                  <MapPin className={cn('h-5 w-5', colors.text)} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium truncate">
                    {address}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="h-3 w-3" />
                  <span>
                    {itemCount === 0 ? 'Sem itens' : `${itemCount} item(ns)`}
                  </span>
                </div>
              </div>

              {/* Status badge */}
              <Badge
                variant="secondary"
                className={cn('flex-shrink-0', colors.bg, colors.text)}
              >
                {colors.label}
              </Badge>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ============================================
// Recent Suggestions Component
// ============================================

interface RecentSuggestionsProps {
  recent: string[];
  onSelect: (address: string) => void;
  onClearRecent: () => void;
  className?: string;
}

export function RecentSuggestions({
  recent,
  onSelect,
  onClearRecent,
  className,
}: RecentSuggestionsProps) {
  if (recent.length === 0) return null;

  return (
    <div className={cn('p-2', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Recentes
        </span>
        <button
          type="button"
          onClick={onClearRecent}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Limpar
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {recent.map(address => (
          <button
            key={address}
            type="button"
            onClick={() => onSelect(address)}
            className="px-2 py-1 text-xs font-mono bg-muted rounded hover:bg-accent transition-colors"
          >
            {address}
          </button>
        ))}
      </div>
    </div>
  );
}
