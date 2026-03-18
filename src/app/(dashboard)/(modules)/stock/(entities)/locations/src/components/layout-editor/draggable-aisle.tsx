'use client';

import React, { memo, useRef, useState, useCallback } from 'react';
import { RotateCw, Move, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AislePosition, ZoneStructure } from '@/types/stock';

interface DraggableAisleProps {
  position: AislePosition;
  structure: ZoneStructure;
  isSelected: boolean;
  isDraggable: boolean;
  showOccupancy?: boolean;
  occupancyData?: Map<string, number>; // shelf -> occupancy %
  onSelect: () => void;
  onMove: (deltaX: number, deltaY: number) => void;
  onMoveEnd: () => void;
  onRotate: () => void;
}

const AISLE_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-lime-500',
  'bg-indigo-500',
  'bg-orange-500',
];

export const DraggableAisle = memo(function DraggableAisle({
  position,
  structure,
  isSelected,
  isDraggable,
  showOccupancy = false,
  occupancyData,
  onSelect,
  onMove,
  onMoveEnd,
  onRotate,
}: DraggableAisleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const shelfCount = structure.shelvesPerAisle;
  const binCount = structure.binsPerShelf;

  // Dimensões base
  const shelfWidth = 8;
  const shelfHeight = 20;
  const binHeight = shelfHeight / binCount;

  // Dimensões totais
  const aisleWidth = shelfWidth * shelfCount;
  const aisleHeight = shelfHeight + 16; // +16 para label

  // Cor do corredor
  const colorClass =
    AISLE_COLORS[(position.aisleNumber - 1) % AISLE_COLORS.length];

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggable) return;
      e.preventDefault();
      e.stopPropagation();

      onSelect();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (dragStart.current) {
          const deltaX = moveEvent.clientX - dragStart.current.x;
          const deltaY = moveEvent.clientY - dragStart.current.y;
          onMove(deltaX, deltaY);
          dragStart.current = { x: moveEvent.clientX, y: moveEvent.clientY };
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        dragStart.current = null;
        onMoveEnd();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [isDraggable, onSelect, onMove, onMoveEnd]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
    },
    [onSelect]
  );

  const handleRotateClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRotate();
    },
    [onRotate]
  );

  // Calcular transformação baseado na rotação
  const getTransform = () => {
    const transforms: string[] = [];
    transforms.push(`translate(${position.x}px, ${position.y}px)`);

    if (position.rotation !== 0) {
      // Rotacionar em torno do centro
      const centerX = aisleWidth / 2;
      const centerY = aisleHeight / 2;
      transforms.push(`rotate(${position.rotation}deg)`);
    }

    return transforms.join(' ');
  };

  return (
    <div
      ref={ref}
      className={cn(
        'absolute select-none transition-shadow',
        isSelected && 'ring-2 ring-primary ring-offset-2 z-20',
        isDragging && 'cursor-grabbing opacity-80',
        isDraggable && !isDragging && 'cursor-grab',
        !isDraggable && 'cursor-pointer'
      )}
      style={{
        transform: getTransform(),
        transformOrigin: 'center center',
        width: aisleWidth,
        height: aisleHeight,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Label do corredor */}
      <div
        className={cn(
          'absolute -top-5 left-0 right-0 text-center',
          'text-xs font-bold text-white px-1 py-0.5 rounded-t',
          colorClass
        )}
      >
        C
        {position.aisleNumber
          .toString()
          .padStart(structure.codePattern.aisleDigits, '0')}
      </div>

      {/* Prateleiras */}
      <div className="flex h-5">
        {Array.from({ length: shelfCount }).map((_, shelfIdx) => {
          const shelfNumber = shelfIdx + 1;
          const occupancy =
            occupancyData?.get(`${position.aisleNumber}-${shelfNumber}`) ?? 0;

          return (
            <div
              key={shelfIdx}
              className={cn(
                'border border-gray-300 dark:border-gray-600',
                'flex flex-col'
              )}
              style={{ width: shelfWidth, height: shelfHeight }}
            >
              {Array.from({ length: binCount }).map((_, binIdx) => {
                const binOccupancy = showOccupancy ? Math.random() * 100 : 0;
                return (
                  <div
                    key={binIdx}
                    className={cn(
                      'flex-1 border-t first:border-t-0 border-gray-200 dark:border-gray-700',
                      showOccupancy &&
                        binOccupancy === 0 &&
                        'bg-gray-100 dark:bg-gray-800',
                      showOccupancy &&
                        binOccupancy > 0 &&
                        binOccupancy < 50 &&
                        'bg-green-200 dark:bg-green-900/50',
                      showOccupancy &&
                        binOccupancy >= 50 &&
                        binOccupancy < 80 &&
                        'bg-yellow-200 dark:bg-yellow-900/50',
                      showOccupancy &&
                        binOccupancy >= 80 &&
                        'bg-red-200 dark:bg-red-900/50',
                      !showOccupancy && 'bg-white dark:bg-gray-800'
                    )}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Indicadores de seleção */}
      {isSelected && isDraggable && (
        <>
          {/* Handle de rotação */}
          <button
            className={cn(
              'absolute -top-8 -right-2',
              'w-6 h-6 rounded-full bg-primary text-primary-foreground',
              'flex items-center justify-center shadow-md',
              'hover:scale-110 transition-transform',
              'z-30'
            )}
            onClick={handleRotateClick}
            title={`Rotacionar (atual: ${position.rotation}°)`}
          >
            <RotateCw className="h-3 w-3" />
          </button>

          {/* Indicador de arrastar */}
          <div
            className={cn(
              'absolute -bottom-6 left-1/2 -translate-x-1/2',
              'px-2 py-0.5 rounded bg-muted text-muted-foreground',
              'text-[10px] flex items-center gap-1'
            )}
          >
            <Move className="h-3 w-3" />
            Arraste para mover
          </div>
        </>
      )}
    </div>
  );
});
