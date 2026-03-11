'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Move, RotateCw, Trash2, X } from 'lucide-react';
import type {
  AislePosition,
  LayoutAnnotation,
  ZoneStructure,
} from '../../types';
import { ANNOTATION_DEFAULTS } from '../../types';

interface PropertiesPanelProps {
  selectedAisle: AislePosition | null;
  selectedAnnotation: LayoutAnnotation | null;
  structure?: ZoneStructure;
  onUpdateAisle?: (
    aisleNumber: number,
    updates: Partial<AislePosition>
  ) => void;
  onRotateAisle?: (aisleNumber: number) => void;
  onUpdateAnnotation?: (id: string, updates: Partial<LayoutAnnotation>) => void;
  onDeleteAnnotation?: (id: string) => void;
  onClearSelection: () => void;
}

export function PropertiesPanel({
  selectedAisle,
  selectedAnnotation,
  structure,
  onUpdateAisle,
  onRotateAisle,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onClearSelection,
}: PropertiesPanelProps) {
  // Se nada selecionado, mostrar dica
  if (!selectedAisle && !selectedAnnotation) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Propriedades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
            <Move className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">
              Selecione um elemento para editar suas propriedades
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Propriedades do corredor
  if (selectedAisle) {
    const totalBins = structure
      ? structure.shelvesPerAisle * structure.binsPerShelf
      : 0;

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              Corredor {selectedAisle.aisleNumber}
              <Badge variant="outline" className="text-xs">
                {totalBins} nichos
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Posição */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Posição</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="zone-prop-aisle-x" className="text-xs">X</Label>
                <Input
                  id="zone-prop-aisle-x"
                  type="number"
                  value={selectedAisle.x}
                  onChange={e =>
                    onUpdateAisle?.(selectedAisle.aisleNumber, {
                      x: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="zone-prop-aisle-y" className="text-xs">Y</Label>
                <Input
                  id="zone-prop-aisle-y"
                  type="number"
                  value={selectedAisle.y}
                  onChange={e =>
                    onUpdateAisle?.(selectedAisle.aisleNumber, {
                      y: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Rotação */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Rotação</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-4 gap-1">
                {([0, 90, 180, 270] as const).map(angle => (
                  <Button
                    key={angle}
                    variant={
                      selectedAisle.rotation === angle ? 'default' : 'outline'
                    }
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() =>
                      onUpdateAisle?.(selectedAisle.aisleNumber, {
                        rotation: angle,
                      })
                    }
                  >
                    {angle}°
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => onRotateAisle?.(selectedAisle.aisleNumber)}
                aria-label="Rotacionar corredor"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Informações */}
          {structure && (
            <div className="space-y-2 text-sm">
              <Label className="text-xs text-muted-foreground">Estrutura</Label>
              <div className="space-y-1 text-muted-foreground">
                <p>{structure.shelvesPerAisle} prateleiras</p>
                <p>{structure.binsPerShelf} nichos por prateleira</p>
                <p>{totalBins} nichos total</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Propriedades da anotação
  if (selectedAnnotation) {
    const defaults = ANNOTATION_DEFAULTS[selectedAnnotation.type];

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{
                  backgroundColor: selectedAnnotation.color || defaults.color,
                }}
              />
              {defaults.label}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClearSelection}
              aria-label="Fechar painel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Label personalizado */}
          <div className="space-y-1">
            <Label htmlFor="zone-prop-label" className="text-xs">Texto</Label>
            <Input
              id="zone-prop-label"
              value={selectedAnnotation.label || ''}
              onChange={e =>
                onUpdateAnnotation?.(selectedAnnotation.id, {
                  label: e.target.value,
                })
              }
              placeholder={defaults.label}
              className="h-8"
            />
          </div>

          {/* Posição */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Posição</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="zone-prop-ann-x" className="text-xs">X</Label>
                <Input
                  id="zone-prop-ann-x"
                  type="number"
                  value={selectedAnnotation.x}
                  onChange={e =>
                    onUpdateAnnotation?.(selectedAnnotation.id, {
                      x: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="zone-prop-ann-y" className="text-xs">Y</Label>
                <Input
                  id="zone-prop-ann-y"
                  type="number"
                  value={selectedAnnotation.y}
                  onChange={e =>
                    onUpdateAnnotation?.(selectedAnnotation.id, {
                      y: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-8"
                />
              </div>
            </div>
          </div>

          {/* Tamanho */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tamanho</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="zone-prop-width" className="text-xs">Largura</Label>
                <Input
                  id="zone-prop-width"
                  type="number"
                  value={selectedAnnotation.width}
                  onChange={e =>
                    onUpdateAnnotation?.(selectedAnnotation.id, {
                      width: parseInt(e.target.value) || defaults.width,
                    })
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="zone-prop-height" className="text-xs">Altura</Label>
                <Input
                  id="zone-prop-height"
                  type="number"
                  value={selectedAnnotation.height}
                  onChange={e =>
                    onUpdateAnnotation?.(selectedAnnotation.id, {
                      height: parseInt(e.target.value) || defaults.height,
                    })
                  }
                  className="h-8"
                />
              </div>
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-1">
            <Label htmlFor="zone-prop-color" className="text-xs">Cor</Label>
            <div className="flex gap-2">
              <Input
                id="zone-prop-color"
                type="color"
                value={selectedAnnotation.color || defaults.color}
                onChange={e =>
                  onUpdateAnnotation?.(selectedAnnotation.id, {
                    color: e.target.value,
                  })
                }
                className="h-8 w-14 p-1 cursor-pointer"
              />
              <Input
                id="zone-prop-color-text"
                value={selectedAnnotation.color || defaults.color}
                onChange={e =>
                  onUpdateAnnotation?.(selectedAnnotation.id, {
                    color: e.target.value,
                  })
                }
                className="h-8 flex-1 font-mono text-xs"
              />
            </div>
          </div>

          <Separator />

          {/* Excluir */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => onDeleteAnnotation?.(selectedAnnotation.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
