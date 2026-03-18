'use client';

import React from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { LayoutAnnotation, AnnotationType } from '@/types/stock';
import { ANNOTATION_DEFAULTS } from '@/types/stock';

interface AnnotationsPanelProps {
  annotations: LayoutAnnotation[];
  selectedAnnotationId: string | null;
  onSelect: (id: string) => void;
  onAdd: (type: AnnotationType) => void;
  onDelete: (id: string) => void;
}

const ANNOTATION_TYPES: AnnotationType[] = [
  'door',
  'pillar',
  'wall',
  'stairs',
  'elevator',
  'area',
  'label',
];

export function AnnotationsPanel({
  annotations,
  selectedAnnotationId,
  onSelect,
  onAdd,
  onDelete,
}: AnnotationsPanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm">Elementos</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Botões para adicionar */}
        <div className="px-4 pb-3 border-b">
          <div className="flex flex-wrap gap-1">
            {ANNOTATION_TYPES.map(type => {
              const defaults = ANNOTATION_DEFAULTS[type];
              return (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 px-2"
                  onClick={() => onAdd(type)}
                >
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: defaults.color }}
                  />
                  {defaults.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Lista de anotações */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {annotations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>Nenhum elemento adicionado</p>
                <p className="text-xs mt-1">
                  Clique nos botões acima para adicionar
                </p>
              </div>
            ) : (
              annotations.map(annotation => {
                const defaults = ANNOTATION_DEFAULTS[annotation.type];
                const isSelected = annotation.id === selectedAnnotationId;

                return (
                  <div
                    key={annotation.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-muted/50 border border-transparent'
                    )}
                    onClick={() => onSelect(annotation.id)}
                  >
                    <div
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{
                        backgroundColor: annotation.color || defaults.color,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {annotation.label || defaults.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {annotation.x}, {annotation.y} • {annotation.width}×
                        {annotation.height}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={e => {
                        e.stopPropagation();
                        onDelete(annotation.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
