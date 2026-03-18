'use client';

import React from 'react';
import {
  MousePointer2,
  Move,
  RotateCw,
  Plus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Magnet,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { EditorTool, AnnotationType } from '@/types/stock';
import { ANNOTATION_DEFAULTS } from '@/types/stock';

interface EditorToolbarProps {
  currentTool: EditorTool;
  zoom: number;
  gridEnabled: boolean;
  snapToGrid: boolean;
  showOccupancy: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  onToolChange: (tool: EditorTool) => void;
  onAddAnnotation: (type: AnnotationType) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onToggleOccupancy: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSave: () => void;
}

export function EditorToolbar({
  currentTool,
  zoom,
  gridEnabled,
  snapToGrid,
  showOccupancy,
  canUndo,
  canRedo,
  isDirty,
  onToolChange,
  onAddAnnotation,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleGrid,
  onToggleSnap,
  onToggleOccupancy,
  onUndo,
  onRedo,
  onReset,
  onSave,
}: EditorToolbarProps) {
  const annotationTypes: AnnotationType[] = [
    'door',
    'pillar',
    'wall',
    'stairs',
    'elevator',
    'area',
    'label',
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        {/* Ferramentas de seleção */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === 'select' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onToolChange('select')}
              >
                <MousePointer2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Selecionar (V)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === 'move' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onToolChange('move')}
              >
                <Move className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mover (M)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentTool === 'rotate' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onToolChange('rotate')}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rotacionar (R)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Adicionar anotações */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={
                    currentTool === 'add-annotation' ? 'default' : 'outline'
                  }
                  size="sm"
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Adicionar elemento</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            {annotationTypes.map(type => {
              const defaults = ANNOTATION_DEFAULTS[type];
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => onAddAnnotation(type)}
                >
                  <div
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: defaults.color }}
                  />
                  {defaults.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refazer (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Zoom */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Diminuir zoom</TooltipContent>
          </Tooltip>

          <span className="text-xs font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aumentar zoom</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onResetZoom}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajustar à tela</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Toggles de visualização */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={gridEnabled ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleGrid}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {gridEnabled ? 'Ocultar grade' : 'Mostrar grade'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={snapToGrid ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleSnap}
              >
                <Magnet className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {snapToGrid ? 'Desativar snap' : 'Ativar snap'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showOccupancy ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleOccupancy}
              >
                {showOccupancy ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showOccupancy ? 'Ocultar ocupação' : 'Mostrar ocupação'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reset e Salvar */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Resetar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Resetar para layout automático</TooltipContent>
          </Tooltip>

          <Button
            size="sm"
            onClick={onSave}
            disabled={!isDirty}
            className={cn(!isDirty && 'opacity-50')}
          >
            <Save className="h-4 w-4 mr-1" />
            Salvar
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
