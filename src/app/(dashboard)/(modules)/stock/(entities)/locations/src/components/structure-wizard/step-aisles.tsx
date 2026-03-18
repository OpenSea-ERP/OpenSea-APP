'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Box, Copy, Grid3X3, Layers, Plus, Trash2 } from 'lucide-react';
import { BIN_DIRECTION_LABELS, STRUCTURE_LIMITS } from '../../constants';
import type { AisleConfig } from '@/types/stock';

interface StepAislesProps {
  aisles: AisleConfig[];
  binDirection: 'BOTTOM_UP' | 'TOP_DOWN';
  onAislesChange: (aisles: AisleConfig[]) => void;
  onBinDirectionChange: (direction: 'BOTTOM_UP' | 'TOP_DOWN') => void;
  formErrors: Record<string, string>;
}

export function StepAisles({
  aisles,
  binDirection,
  onAislesChange,
  onBinDirectionChange,
  formErrors,
}: StepAislesProps) {
  // Add a new aisle
  const handleAddAisle = () => {
    const newAisleNumber = aisles.length + 1;
    const lastAisle = aisles[aisles.length - 1];

    // Copy configuration from last aisle if exists, otherwise use defaults
    const newAisle: AisleConfig = {
      aisleNumber: newAisleNumber,
      shelvesCount: lastAisle?.shelvesCount ?? 1,
      binsPerShelf: lastAisle?.binsPerShelf ?? 1,
    };

    onAislesChange([...aisles, newAisle]);
  };

  // Remove an aisle
  const handleRemoveAisle = (index: number) => {
    if (aisles.length <= 1) return;

    const newAisles = aisles
      .filter((_, i) => i !== index)
      .map((aisle, i) => ({ ...aisle, aisleNumber: i + 1 })); // Renumber

    onAislesChange(newAisles);
  };

  // Update aisle configuration
  const handleAisleChange = (
    index: number,
    field: 'shelvesCount' | 'binsPerShelf',
    value: number
  ) => {
    const newAisles = aisles.map((aisle, i) =>
      i === index ? { ...aisle, [field]: value } : aisle
    );
    onAislesChange(newAisles);
  };

  // Duplicate an aisle
  const handleDuplicateAisle = (index: number) => {
    const aisleToCopy = aisles[index];
    const newAisle: AisleConfig = {
      aisleNumber: aisles.length + 1,
      shelvesCount: aisleToCopy.shelvesCount,
      binsPerShelf: aisleToCopy.binsPerShelf,
    };
    onAislesChange([...aisles, newAisle]);
  };

  // Calculate totals
  const totalBins = aisles.reduce(
    (sum, aisle) => sum + aisle.shelvesCount * aisle.binsPerShelf,
    0
  );

  const totalShelves = aisles.reduce(
    (sum, aisle) => sum + aisle.shelvesCount,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Configurar Corredores</h2>
        <p className="text-sm text-muted-foreground">
          Adicione corredores individualmente. Cada corredor pode ter uma
          configuração diferente.
        </p>
      </div>

      {/* Aisles List */}
      <div className="space-y-3">
        {aisles.map((aisle, index) => (
          <Card
            key={aisle.aisleNumber}
            className={cn(
              'transition-all',
              formErrors[`aisle_${index}`] && 'border-destructive'
            )}
          >
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                {/* Aisle Number */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {aisle.aisleNumber}
                  </span>
                </div>

                {/* Shelves */}
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Grid3X3 className="h-3 w-3" />
                    Prateleiras
                  </Label>
                  <Input
                    type="number"
                    value={aisle.shelvesCount}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      if (
                        !isNaN(val) &&
                        val >= 1 &&
                        val <= STRUCTURE_LIMITS.maxShelvesPerAisle
                      ) {
                        handleAisleChange(index, 'shelvesCount', val);
                      }
                    }}
                    min={1}
                    max={STRUCTURE_LIMITS.maxShelvesPerAisle}
                    className="h-9 mt-1"
                  />
                </div>

                {/* Bins per Shelf */}
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Box className="h-3 w-3" />
                    Nichos/Prat.
                  </Label>
                  <Input
                    type="number"
                    value={aisle.binsPerShelf}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      if (
                        !isNaN(val) &&
                        val >= 1 &&
                        val <= STRUCTURE_LIMITS.maxBinsPerShelf
                      ) {
                        handleAisleChange(index, 'binsPerShelf', val);
                      }
                    }}
                    min={1}
                    max={STRUCTURE_LIMITS.maxBinsPerShelf}
                    className="h-9 mt-1"
                  />
                </div>

                {/* Subtotal */}
                <div className="text-center px-2 shrink-0">
                  <span className="text-xs text-muted-foreground">Nichos</span>
                  <div className="text-lg font-semibold">
                    {(aisle.shelvesCount * aisle.binsPerShelf).toLocaleString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDuplicateAisle(index)}
                          aria-label="Duplicar corredor"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Duplicar corredor</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveAisle(index)}
                          disabled={aisles.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remover corredor</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Aisle Button */}
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={handleAddAisle}
        disabled={aisles.length >= STRUCTURE_LIMITS.maxAisles}
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Corredor {aisles.length + 1}
      </Button>

      {/* Bin Direction */}
      <div className="space-y-2">
        <Label>Direção dos Nichos</Label>
        <Select
          value={binDirection}
          onValueChange={value =>
            onBinDirectionChange(value as 'BOTTOM_UP' | 'TOP_DOWN')
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BOTTOM_UP">
              {BIN_DIRECTION_LABELS['BOTTOM_UP']}
            </SelectItem>
            <SelectItem value="TOP_DOWN">
              {BIN_DIRECTION_LABELS['TOP_DOWN']}
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Define se a letra A representa o nicho inferior ou superior
        </p>
      </div>

      {/* Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Layers className="h-4 w-4" />
                <span className="text-sm">Corredores</span>
              </div>
              <p className="text-2xl font-bold text-primary">{aisles.length}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Grid3X3 className="h-4 w-4" />
                <span className="text-sm">Prateleiras</span>
              </div>
              <p className="text-2xl font-bold text-primary">{totalShelves}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Box className="h-4 w-4" />
                <span className="text-sm">Total Nichos</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {totalBins.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
