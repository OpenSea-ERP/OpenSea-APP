'use client';

import React, { memo } from 'react';
import { Lock, Package, Check, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useBinDetail } from '../../api';
import type { BinOccupancy, OccupancyLevel } from '../../types';
import { getOccupancyLevel } from '../../types';

interface BinCellProps {
  bin: BinOccupancy | null;
  zoomLevel: 'compact' | 'normal' | 'expanded' | 'detailed';
  filterMode: 'all' | 'empty' | 'occupied' | 'full' | 'blocked';
  isHighlighted: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  onClick: () => void;
}

const OCCUPANCY_BG: Record<OccupancyLevel, string> = {
  empty:
    'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
  low: 'bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-900/60',
  medium:
    'bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-900/60',
  high: 'bg-orange-100 dark:bg-orange-900/40 hover:bg-orange-200 dark:hover:bg-orange-900/60',
  full: 'bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60',
  blocked: 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed',
};

const OCCUPANCY_TEXT: Record<OccupancyLevel, string> = {
  empty: 'text-gray-400 dark:text-gray-500',
  low: 'text-green-700 dark:text-green-400',
  medium: 'text-yellow-700 dark:text-yellow-400',
  high: 'text-orange-700 dark:text-orange-400',
  full: 'text-red-700 dark:text-red-400',
  blocked: 'text-gray-500 dark:text-gray-400',
};

export const BinCell = memo(function BinCell({
  bin,
  zoomLevel,
  filterMode,
  isHighlighted,
  isSelected,
  isSelectionMode,
  onClick,
}: BinCellProps) {
  // Buscar detalhes do bin apenas no modo detailed
  const { data: binDetail, isLoading: isLoadingDetail } = useBinDetail(
    zoomLevel === 'detailed' && bin?.id ? bin.id : ''
  );

  // Se não há bin, célula vazia/placeholder
  if (!bin) {
    return (
      <div
        className={cn(
          'bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700',
          zoomLevel === 'compact' && 'w-6 h-6',
          zoomLevel === 'normal' && 'w-10 h-8',
          zoomLevel === 'expanded' && 'w-16 h-12',
          zoomLevel === 'detailed' && 'w-32 min-h-20'
        )}
      />
    );
  }

  const occupancyLevel = getOccupancyLevel(bin);

  // Aplicar filtro
  const shouldShow = (() => {
    switch (filterMode) {
      case 'empty':
        return occupancyLevel === 'empty';
      case 'occupied':
        return occupancyLevel !== 'empty' && occupancyLevel !== 'blocked';
      case 'full':
        return occupancyLevel === 'full';
      case 'blocked':
        return occupancyLevel === 'blocked';
      default:
        return true;
    }
  })();

  const isFiltered = !shouldShow;

  // Conteúdo da célula baseado no zoom
  const renderContent = () => {
    if (bin.isBlocked) {
      return <Lock className="h-3 w-3" />;
    }

    if (zoomLevel === 'compact') {
      // Apenas indicador visual
      if (bin.itemCount > 0) {
        return (
          <span className="text-[8px] font-bold">
            {bin.itemCount > 99 ? '99+' : bin.itemCount}
          </span>
        );
      }
      return null;
    }

    if (zoomLevel === 'normal') {
      // Quantidade de itens
      return (
        <div className="flex flex-col items-center justify-center">
          {bin.itemCount > 0 ? (
            <span className="text-xs font-bold">{bin.itemCount}</span>
          ) : (
            <Package className="h-3 w-3 opacity-30" />
          )}
        </div>
      );
    }

    if (zoomLevel === 'expanded') {
      // Expanded - mais detalhes
      return (
        <div className="flex flex-col items-center justify-center text-center px-1">
          <span className="text-xs font-bold">{bin.itemCount}</span>
          {bin.capacity && (
            <span className="text-[9px] opacity-70">/{bin.capacity}</span>
          )}
        </div>
      );
    }

    // Detailed - mostra códigos dos itens
    if (isLoadingDetail) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <Loader2 className="h-4 w-4 animate-spin opacity-50" />
        </div>
      );
    }

    const items = binDetail?.items || [];

    // Formatar item: Código do Item - Produto Variante (quantidade unidade)
    const formatItemDisplay = (item: (typeof items)[0]) => {
      const productVariant = item.variantName
        ? `${item.productName} ${item.variantName}`
        : item.productName;
      const unit = item.unitLabel || 'un';
      return `${item.itemCode} - ${productVariant} (${item.quantity} ${unit})`;
    };

    return (
      <div className="flex flex-col w-full h-full p-1.5 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono font-bold truncate">
            {bin.address.split('-').slice(-2).join('-')}
          </span>
          <span className="text-[9px] font-medium bg-black/10 dark:bg-white/10 px-1 rounded">
            {bin.itemCount}
          </span>
        </div>
        {items.length > 0 ? (
          <div className="flex-1 overflow-hidden space-y-0.5">
            {items.slice(0, 3).map(item => (
              <div
                key={item.id}
                className="text-[8px] truncate opacity-80"
                title={formatItemDisplay(item)}
              >
                {formatItemDisplay(item)}
              </div>
            ))}
            {items.length > 3 && (
              <div className="text-[8px] opacity-50">
                +{items.length - 3} mais
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Package className="h-4 w-4 opacity-20" />
          </div>
        )}
      </div>
    );
  };

  const cellContent = (
    <div
      data-bin-id={bin.id}
      role={!isFiltered && !bin.isBlocked ? 'button' : undefined}
      tabIndex={!isFiltered && !bin.isBlocked ? 0 : undefined}
      aria-label={`Nicho ${bin.address}`}
      onClick={!isFiltered && !bin.isBlocked ? onClick : undefined}
      onKeyDown={!isFiltered && !bin.isBlocked ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      className={cn(
        'relative flex items-center justify-center transition-colors',
        // Tamanhos fixos (sem scale no hover para evitar barras de rolagem)
        zoomLevel === 'compact' && 'w-6 h-6',
        zoomLevel === 'normal' && 'w-10 h-8',
        zoomLevel === 'expanded' && 'w-16 h-12',
        zoomLevel === 'detailed' && 'w-32 min-h-20',
        // Estados
        !bin.isBlocked && !isFiltered && 'cursor-pointer',
        isFiltered && 'opacity-20',
        // Highlight via URL param - efeito azul brilhante (usa shadow inset para simular borda interna)
        isHighlighted
          ? 'bg-blue-500/30 dark:bg-blue-500/40 shadow-[inset_0_0_0_2px_rgba(59,130,246,1),0_0_12px_rgba(59,130,246,0.6)] z-20'
          : isSelected
            ? 'bg-blue-100 dark:bg-blue-900/50 shadow-[inset_0_0_0_2px_rgba(59,130,246,1)]'
            : OCCUPANCY_BG[occupancyLevel],
        // Cor do texto
        !isHighlighted && !isSelected && OCCUPANCY_TEXT[occupancyLevel],
        isHighlighted && 'text-blue-700 dark:text-blue-300'
      )}
    >
      {/* Checkbox de seleção */}
      {isSelectionMode && !bin.isBlocked && (
        <div
          className={cn(
            'absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center',
            'bg-white dark:bg-gray-800',
            isSelected
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300 dark:border-gray-600'
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>
      )}

      {renderContent()}
    </div>
  );

  // Tooltip com informações detalhadas
  if (zoomLevel === 'compact' || zoomLevel === 'normal') {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-mono font-bold">{bin.address}</p>
              <div className="text-xs space-y-0.5">
                <p>
                  <span className="text-muted-foreground">Itens:</span>{' '}
                  <span className="font-medium">{bin.itemCount}</span>
                  {bin.capacity && (
                    <span className="text-muted-foreground">
                      /{bin.capacity}
                    </span>
                  )}
                </p>
                {bin.isBlocked && (
                  <p className="text-amber-600">
                    <Lock className="inline h-3 w-3 mr-1" />
                    Bloqueado
                  </p>
                )}
              </div>
              {!isSelectionMode && (
                <p className="text-[10px] text-muted-foreground pt-1">
                  Clique para ver detalhes
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cellContent;
});
