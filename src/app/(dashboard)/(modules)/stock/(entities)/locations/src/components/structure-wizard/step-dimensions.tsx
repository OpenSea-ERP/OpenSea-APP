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
import { cn } from '@/lib/utils';
import { Box, Grid3X3, Layers, Minus, Plus } from 'lucide-react';
import { BIN_DIRECTION_LABELS, STRUCTURE_LIMITS } from '../../constants';
import type { ZoneStructureFormData } from '@/types/stock';

interface StepDimensionsProps {
  formData: ZoneStructureFormData;
  formErrors: Record<string, string>;
  onChange: (
    field: keyof ZoneStructureFormData,
    value: number | string
  ) => void;
  totalBins: number;
}

export function StepDimensions({
  formData,
  formErrors,
  onChange,
  totalBins,
}: StepDimensionsProps) {
  const handleIncrement = (
    field: 'aisles' | 'shelvesPerAisle' | 'binsPerShelf',
    max: number
  ) => {
    if (formData[field] < max) {
      onChange(field, formData[field] + 1);
    }
  };

  const handleDecrement = (
    field: 'aisles' | 'shelvesPerAisle' | 'binsPerShelf',
    min: number
  ) => {
    if (formData[field] > min) {
      onChange(field, formData[field] - 1);
    }
  };

  const handleInputChange = (
    field: 'aisles' | 'shelvesPerAisle' | 'binsPerShelf',
    value: string,
    min: number,
    max: number
  ) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      onChange(field, Math.max(min, Math.min(max, num)));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Estrutura Física</h2>
        <p className="text-sm text-muted-foreground">
          Configure a quantidade de corredores, prateleiras e nichos desta zona
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Corredores */}
        <Card className={cn(formErrors.aisles && 'border-destructive')}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <Label className="text-base font-medium mb-4">Corredores</Label>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleDecrement('aisles', STRUCTURE_LIMITS.minAisles)
                  }
                  disabled={formData.aisles <= STRUCTURE_LIMITS.minAisles}
                  aria-label="Diminuir número de corredores"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={formData.aisles}
                  onChange={e =>
                    handleInputChange(
                      'aisles',
                      e.target.value,
                      STRUCTURE_LIMITS.minAisles,
                      STRUCTURE_LIMITS.maxAisles
                    )
                  }
                  className="w-20 text-center text-lg font-bold"
                  min={STRUCTURE_LIMITS.minAisles}
                  max={STRUCTURE_LIMITS.maxAisles}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleIncrement('aisles', STRUCTURE_LIMITS.maxAisles)
                  }
                  disabled={formData.aisles >= STRUCTURE_LIMITS.maxAisles}
                  aria-label="Aumentar número de corredores"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formErrors.aisles && (
                <p className="text-xs text-destructive mt-2">
                  {formErrors.aisles}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prateleiras por Corredor */}
        <Card
          className={cn(formErrors.shelvesPerAisle && 'border-destructive')}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
                <Grid3X3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <Label className="text-base font-medium mb-1">Prateleiras</Label>
              <span className="text-xs text-muted-foreground mb-3">
                por corredor
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleDecrement(
                      'shelvesPerAisle',
                      STRUCTURE_LIMITS.minShelvesPerAisle
                    )
                  }
                  disabled={
                    formData.shelvesPerAisle <=
                    STRUCTURE_LIMITS.minShelvesPerAisle
                  }
                  aria-label="Diminuir prateleiras"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={formData.shelvesPerAisle}
                  onChange={e =>
                    handleInputChange(
                      'shelvesPerAisle',
                      e.target.value,
                      STRUCTURE_LIMITS.minShelvesPerAisle,
                      STRUCTURE_LIMITS.maxShelvesPerAisle
                    )
                  }
                  className="w-20 text-center text-lg font-bold"
                  min={STRUCTURE_LIMITS.minShelvesPerAisle}
                  max={STRUCTURE_LIMITS.maxShelvesPerAisle}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleIncrement(
                      'shelvesPerAisle',
                      STRUCTURE_LIMITS.maxShelvesPerAisle
                    )
                  }
                  disabled={
                    formData.shelvesPerAisle >=
                    STRUCTURE_LIMITS.maxShelvesPerAisle
                  }
                  aria-label="Aumentar prateleiras"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formErrors.shelvesPerAisle && (
                <p className="text-xs text-destructive mt-2">
                  {formErrors.shelvesPerAisle}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Nichos por Prateleira */}
        <Card className={cn(formErrors.binsPerShelf && 'border-destructive')}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                <Box className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <Label className="text-base font-medium mb-1">Nichos</Label>
              <span className="text-xs text-muted-foreground mb-3">
                por prateleira
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleDecrement(
                      'binsPerShelf',
                      STRUCTURE_LIMITS.minBinsPerShelf
                    )
                  }
                  disabled={
                    formData.binsPerShelf <= STRUCTURE_LIMITS.minBinsPerShelf
                  }
                  aria-label="Diminuir nichos"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={formData.binsPerShelf}
                  onChange={e =>
                    handleInputChange(
                      'binsPerShelf',
                      e.target.value,
                      STRUCTURE_LIMITS.minBinsPerShelf,
                      STRUCTURE_LIMITS.maxBinsPerShelf
                    )
                  }
                  className="w-20 text-center text-lg font-bold"
                  min={STRUCTURE_LIMITS.minBinsPerShelf}
                  max={STRUCTURE_LIMITS.maxBinsPerShelf}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleIncrement(
                      'binsPerShelf',
                      STRUCTURE_LIMITS.maxBinsPerShelf
                    )
                  }
                  disabled={
                    formData.binsPerShelf >= STRUCTURE_LIMITS.maxBinsPerShelf
                  }
                  aria-label="Aumentar nichos"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formErrors.binsPerShelf && (
                <p className="text-xs text-destructive mt-2">
                  {formErrors.binsPerShelf}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direção dos Nichos */}
      <div className="space-y-2">
        <Label>Direção dos Nichos</Label>
        <Select
          value={formData.binDirection}
          onValueChange={value =>
            onChange('binDirection', value as 'BOTTOM_UP' | 'TOP_DOWN')
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

      {/* Resumo */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total de nichos a serem criados
              </p>
              <p className="text-3xl font-bold text-primary">
                {totalBins.toLocaleString()}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>
                {formData.aisles} × {formData.shelvesPerAisle} ×{' '}
                {formData.binsPerShelf}
              </p>
              <p>corredores × prateleiras × nichos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
