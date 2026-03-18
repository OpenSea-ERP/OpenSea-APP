'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { memo, useState } from 'react';
import type { AisleConfig, BinOccupancy, ZoneStructure } from '@/types/stock';
import { BinCell } from './bin-cell';

interface ShelfData {
  number: number;
  bins: (BinOccupancy | null)[];
}

type ZoomLevel = 'compact' | 'normal' | 'expanded' | 'detailed';

interface AisleRowProps {
  aisleNumber: number;
  shelves: ShelfData[];
  structure: ZoneStructure;
  aisleConfig?: AisleConfig; // Configuração específica do corredor (opcional)
  zoomLevel: ZoomLevel;
  filterMode: 'all' | 'empty' | 'occupied' | 'full' | 'blocked';
  highlightedBins: Set<string>;
  selectedBins: Set<string>;
  isSelectionMode: boolean;
  onBinClick: (bin: BinOccupancy) => void;
  enableIndividualZoom?: boolean; // Habilita zoom individual por corredor
}

export const AisleRow = memo(function AisleRow({
  aisleNumber,
  shelves,
  structure,
  aisleConfig,
  zoomLevel: globalZoomLevel,
  filterMode,
  highlightedBins,
  selectedBins,
  isSelectionMode,
  onBinClick,
  enableIndividualZoom = true,
}: AisleRowProps) {
  // Estado local para zoom individual do corredor
  const [localZoomLevel, setLocalZoomLevel] = useState<ZoomLevel | null>(null);

  // Usar zoom local se definido, senão usar o global
  const zoomLevel = localZoomLevel ?? globalZoomLevel;

  // Usar configuração específica do corredor se disponível
  const binsPerShelf = aisleConfig?.binsPerShelf ?? structure.binsPerShelf;
  const shelvesCount = aisleConfig?.shelvesCount ?? structure.shelvesPerAisle;
  const binDirection = structure.codePattern.binDirection;
  const binLabeling = structure.codePattern.binLabeling;

  // Gerar labels dos nichos (A, B, C, D ou 1, 2, 3, 4)
  const binLabels = Array.from({ length: binsPerShelf }, (_, i) => {
    if (binLabeling.toUpperCase() === 'LETTERS') {
      return String.fromCharCode(65 + i);
    }
    return (i + 1).toString();
  });

  // Inverter se BOTTOM_UP (A embaixo)
  const orderedBinLabels =
    binDirection.toUpperCase() === 'BOTTOM_UP'
      ? [...binLabels].reverse()
      : binLabels;

  // Handlers para zoom individual
  const handleZoomIn = () => {
    const current = localZoomLevel ?? globalZoomLevel;
    if (current === 'compact') setLocalZoomLevel('normal');
    else if (current === 'normal') setLocalZoomLevel('expanded');
    else if (current === 'expanded') setLocalZoomLevel('detailed');
  };

  const handleZoomOut = () => {
    const current = localZoomLevel ?? globalZoomLevel;
    if (current === 'detailed') setLocalZoomLevel('expanded');
    else if (current === 'expanded') setLocalZoomLevel('normal');
    else if (current === 'normal') setLocalZoomLevel('compact');
  };

  const handleResetZoom = () => {
    setLocalZoomLevel(null); // Volta ao zoom global
  };

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Header do corredor com numeração de prateleiras e zoom */}
      <div
        className={cn(
          'flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b',
          'sticky top-0 z-10'
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'font-bold text-primary',
              zoomLevel === 'compact' && 'text-xs',
              zoomLevel === 'normal' && 'text-sm',
              (zoomLevel === 'expanded' || zoomLevel === 'detailed') &&
                'text-base'
            )}
          >
            Corredor{' '}
            {aisleNumber
              .toString()
              .padStart(structure.codePattern.aisleDigits, '0')}
          </span>
          {aisleConfig && (
            <span className="text-xs text-muted-foreground">
              ({shelvesCount} prat. × {binsPerShelf} nichos)
            </span>
          )}
        </div>

        {/* Zoom individual do corredor */}
        {enableIndividualZoom && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleZoomOut}
              disabled={zoomLevel === 'compact'}
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleResetZoom}
              disabled={localZoomLevel === null}
              title="Restaurar zoom global"
              aria-label="Restaurar zoom global"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleZoomIn}
              disabled={zoomLevel === 'detailed'}
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Numeração das prateleiras (individual para este corredor) */}
      <div
        className={cn(
          'flex bg-muted/30 border-b sticky top-[37px] z-[5]',
          zoomLevel === 'compact' && 'text-[9px]',
          zoomLevel === 'normal' && 'text-[10px]',
          (zoomLevel === 'expanded' || zoomLevel === 'detailed') && 'text-xs'
        )}
      >
        {/* Espaço para labels dos nichos */}
        <div
          className={cn(
            'shrink-0 flex items-center justify-center text-muted-foreground font-medium border-r',
            zoomLevel === 'compact' && 'w-8 h-5',
            zoomLevel === 'normal' && 'w-10 h-6',
            zoomLevel === 'expanded' && 'w-12 h-7',
            zoomLevel === 'detailed' && 'w-14 h-8'
          )}
        >
          Prat.
        </div>
        {/* Números das prateleiras */}
        <div className="flex gap-px">
          {shelves.map(shelf => (
            <div
              key={shelf.number}
              className={cn(
                'flex items-center justify-center font-mono text-muted-foreground',
                zoomLevel === 'compact' && 'w-6 h-5',
                zoomLevel === 'normal' && 'w-10 h-6',
                zoomLevel === 'expanded' && 'w-16 h-7',
                zoomLevel === 'detailed' && 'w-32 h-8'
              )}
            >
              {shelf.number
                .toString()
                .padStart(structure.codePattern.shelfDigits, '0')}
            </div>
          ))}
        </div>
      </div>

      {/* Grid de nichos */}
      <div className="flex">
        {/* Labels dos nichos (A, B, C, D) - fixo à esquerda */}
        <div
          className={cn(
            'shrink-0 flex flex-col justify-center border-r bg-muted/30',
            zoomLevel === 'compact' && 'w-8 text-[10px]',
            zoomLevel === 'normal' && 'w-10 text-xs',
            zoomLevel === 'expanded' && 'w-12 text-sm',
            zoomLevel === 'detailed' && 'w-14 text-sm'
          )}
        >
          {orderedBinLabels.map(label => (
            <div
              key={label}
              className={cn(
                'flex items-center justify-center font-mono font-medium text-muted-foreground',
                zoomLevel === 'compact' && 'h-6',
                zoomLevel === 'normal' && 'h-8',
                zoomLevel === 'expanded' && 'h-12',
                zoomLevel === 'detailed' && 'min-h-20'
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Prateleiras (colunas) */}
        <div className="flex gap-px overflow-x-auto">
          {shelves.map(shelf => (
            <div key={shelf.number} className="flex flex-col gap-px">
              {orderedBinLabels.map((label, binIdx) => {
                // Encontrar o bin correto baseado na direção
                const actualIdx =
                  binDirection.toUpperCase() === 'BOTTOM_UP'
                    ? binsPerShelf - 1 - binIdx
                    : binIdx;
                const bin = shelf.bins[actualIdx];

                return (
                  <BinCell
                    key={`${shelf.number}-${label}`}
                    bin={bin}
                    zoomLevel={zoomLevel}
                    filterMode={filterMode}
                    isHighlighted={bin ? highlightedBins.has(bin.id) : false}
                    isSelected={bin ? selectedBins.has(bin.id) : false}
                    isSelectionMode={isSelectionMode}
                    onClick={() => bin && onBinClick(bin)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
