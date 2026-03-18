'use client';

import React, { useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { GridOverlay } from './grid-overlay';
import { DraggableAisle } from './draggable-aisle';
import type {
  ZoneLayout,
  ZoneStructure,
  EditorState,
  AnnotationType,
  LayoutAnnotation,
} from '@/types/stock';
import { ANNOTATION_DEFAULTS } from '@/types/stock';

interface LayoutCanvasProps {
  layout: ZoneLayout;
  structure: ZoneStructure;
  editorState: EditorState;
  occupancyData?: Map<string, number>;
  onSelectAisle: (aisleNumber: number) => void;
  onSelectAnnotation: (id: string) => void;
  onMoveAisle: (aisleNumber: number, deltaX: number, deltaY: number) => void;
  onMoveAisleEnd: (aisleNumber: number) => void;
  onRotateAisle: (aisleNumber: number) => void;
  onAddAnnotation: (type: AnnotationType, x: number, y: number) => void;
  onMoveAnnotation: (id: string, deltaX: number, deltaY: number) => void;
  onMoveAnnotationEnd: (id: string) => void;
  onClearSelection: () => void;
}

export function LayoutCanvas({
  layout,
  structure,
  editorState,
  occupancyData,
  onSelectAisle,
  onSelectAnnotation,
  onMoveAisle,
  onMoveAisleEnd,
  onRotateAisle,
  onAddAnnotation,
  onMoveAnnotation,
  onMoveAnnotationEnd,
  onClearSelection,
}: LayoutCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Se está no modo de adicionar anotação
      if (
        editorState.tool === 'add-annotation' &&
        editorState.annotationToAdd
      ) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = (e.clientX - rect.left) / editorState.zoom;
          const y = (e.clientY - rect.top) / editorState.zoom;
          onAddAnnotation(editorState.annotationToAdd, x, y);
        }
        return;
      }

      // Caso contrário, limpar seleção
      onClearSelection();
    },
    [
      editorState.tool,
      editorState.annotationToAdd,
      editorState.zoom,
      onAddAnnotation,
      onClearSelection,
    ]
  );

  const handleAnnotationMouseDown = useCallback(
    (e: React.MouseEvent, annotation: LayoutAnnotation) => {
      e.stopPropagation();
      onSelectAnnotation(annotation.id);

      if (editorState.tool === 'move' || editorState.tool === 'select') {
        const startX = e.clientX;
        const startY = e.clientY;

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = (moveEvent.clientX - startX) / editorState.zoom;
          const deltaY = (moveEvent.clientY - startY) / editorState.zoom;
          onMoveAnnotation(annotation.id, deltaX, deltaY);
        };

        const handleMouseUp = () => {
          onMoveAnnotationEnd(annotation.id);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    },
    [
      editorState.tool,
      editorState.zoom,
      onSelectAnnotation,
      onMoveAnnotation,
      onMoveAnnotationEnd,
    ]
  );

  const renderAnnotation = (annotation: LayoutAnnotation) => {
    const defaults = ANNOTATION_DEFAULTS[annotation.type];
    const isSelected = annotation.id === editorState.selectedAnnotation;

    return (
      <div
        key={annotation.id}
        className={cn(
          'absolute cursor-pointer transition-shadow',
          isSelected && 'ring-2 ring-primary ring-offset-1 z-10'
        )}
        style={{
          left: annotation.x,
          top: annotation.y,
          width: annotation.width,
          height: annotation.height,
          backgroundColor: annotation.color || defaults.color,
          transform: annotation.rotation
            ? `rotate(${annotation.rotation}deg)`
            : undefined,
          opacity: annotation.type === 'area' ? 0.5 : 0.9,
        }}
        onMouseDown={e => handleAnnotationMouseDown(e, annotation)}
      >
        {/* Label */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'text-white text-xs font-medium overflow-hidden',
            'pointer-events-none'
          )}
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {annotation.label || defaults.label}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative overflow-auto bg-gray-50 dark:bg-gray-900',
        'border rounded-lg',
        editorState.tool === 'add-annotation' && 'cursor-crosshair'
      )}
      style={{
        minHeight: '400px',
        maxHeight: 'calc(100vh - 300px)',
      }}
      onClick={handleCanvasClick}
    >
      <div
        className="relative"
        style={{
          width: layout.canvasWidth,
          height: layout.canvasHeight,
          transform: `scale(${editorState.zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Grid */}
        <GridOverlay
          width={layout.canvasWidth}
          height={layout.canvasHeight}
          gridSize={layout.gridSize}
          visible={editorState.gridEnabled}
        />

        {/* Anotações (atrás dos corredores) */}
        {layout.annotations
          .filter(a => a.type === 'area')
          .map(renderAnnotation)}

        {/* Corredores */}
        {layout.aislePositions.map(position => (
          <DraggableAisle
            key={position.aisleNumber}
            position={position}
            structure={structure}
            isSelected={position.aisleNumber === editorState.selectedAisle}
            isDraggable={
              editorState.tool === 'move' || editorState.tool === 'select'
            }
            showOccupancy={editorState.showOccupancy}
            occupancyData={occupancyData}
            onSelect={() => onSelectAisle(position.aisleNumber)}
            onMove={(dx, dy) => onMoveAisle(position.aisleNumber, dx, dy)}
            onMoveEnd={() => onMoveAisleEnd(position.aisleNumber)}
            onRotate={() => onRotateAisle(position.aisleNumber)}
          />
        ))}

        {/* Anotações (na frente dos corredores) */}
        {layout.annotations
          .filter(a => a.type !== 'area')
          .map(renderAnnotation)}
      </div>
    </div>
  );
}
