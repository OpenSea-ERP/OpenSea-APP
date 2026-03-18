'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SEPARATOR_LABELS, BIN_LABELING_LABELS } from '../../constants';
import type { ZoneStructureFormData } from '@/types/stock';

type CodePatternFields =
  | 'separator'
  | 'aisleDigits'
  | 'shelfDigits'
  | 'binLabeling'
  | 'binDirection';

interface StepCodePatternProps {
  formData: ZoneStructureFormData;
  warehouseCode: string;
  zoneCode: string;
  onChange: (field: CodePatternFields, value: number | string) => void;
  sampleAddresses: string[];
}

export function StepCodePattern({
  formData,
  warehouseCode,
  zoneCode,
  onChange,
  sampleAddresses,
}: StepCodePatternProps) {
  // Gerar exemplo de endereço para preview
  const generatePreviewAddress = () => {
    const sep = formData.separator;
    const aisle = formData.aisleDigits === 2 ? '01' : '1';
    const shelf = formData.shelfDigits === 3 ? '002' : '02';
    const bin = formData.binLabeling === 'LETTERS' ? 'B' : '2';

    return [warehouseCode, zoneCode, `${aisle}${shelf}`, bin].join(sep);
  };

  const previewAddress = generatePreviewAddress();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Padrão de Endereçamento</h2>
        <p className="text-sm text-muted-foreground">
          Defina como será o código de cada localização
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Separador */}
        <div className="space-y-3">
          <Label className="text-base">Separador</Label>
          <RadioGroup
            value={formData.separator}
            onValueChange={value => onChange('separator', value)}
            className="grid grid-cols-3 gap-2"
          >
            {(['-', '.', ''] as const).map(sep => (
              <Label
                key={sep || 'none'}
                className={cn(
                  'flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors',
                  formData.separator === sep
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                )}
              >
                <RadioGroupItem value={sep} className="sr-only" />
                <span className="font-mono">{SEPARATOR_LABELS[sep]}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Dígitos do Corredor */}
        <div className="space-y-3">
          <Label className="text-base">Dígitos do Corredor</Label>
          <RadioGroup
            value={formData.aisleDigits.toString()}
            onValueChange={value =>
              onChange('aisleDigits', parseInt(value) as 1 | 2)
            }
            className="grid grid-cols-2 gap-2"
          >
            <Label
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors',
                formData.aisleDigits === 1
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem value="1" className="sr-only" />
              <span className="font-mono text-lg">1</span>
              <span className="text-xs text-muted-foreground">1, 2, 3...</span>
            </Label>
            <Label
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors',
                formData.aisleDigits === 2
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem value="2" className="sr-only" />
              <span className="font-mono text-lg">01</span>
              <span className="text-xs text-muted-foreground">
                01, 02, 03...
              </span>
            </Label>
          </RadioGroup>
        </div>

        {/* Dígitos da Prateleira */}
        <div className="space-y-3">
          <Label className="text-base">Dígitos da Prateleira</Label>
          <RadioGroup
            value={formData.shelfDigits.toString()}
            onValueChange={value =>
              onChange('shelfDigits', parseInt(value) as 2 | 3)
            }
            className="grid grid-cols-2 gap-2"
          >
            <Label
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors',
                formData.shelfDigits === 2
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem value="2" className="sr-only" />
              <span className="font-mono text-lg">01</span>
              <span className="text-xs text-muted-foreground">01-99</span>
            </Label>
            <Label
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors',
                formData.shelfDigits === 3
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem value="3" className="sr-only" />
              <span className="font-mono text-lg">001</span>
              <span className="text-xs text-muted-foreground">001-999</span>
            </Label>
          </RadioGroup>
        </div>

        {/* Identificação do Nicho */}
        <div className="space-y-3">
          <Label className="text-base">Identificação do Nicho</Label>
          <RadioGroup
            value={formData.binLabeling}
            onValueChange={value =>
              onChange('binLabeling', value as 'LETTERS' | 'NUMBERS')
            }
            className="grid grid-cols-2 gap-2"
          >
            <Label
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors',
                formData.binLabeling === 'LETTERS'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem value="LETTERS" className="sr-only" />
              <span className="font-mono text-lg">A, B, C</span>
              <span className="text-xs text-muted-foreground">Letras</span>
            </Label>
            <Label
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors',
                formData.binLabeling === 'NUMBERS'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem value="NUMBERS" className="sr-only" />
              <span className="font-mono text-lg">1, 2, 3</span>
              <span className="text-xs text-muted-foreground">Números</span>
            </Label>
          </RadioGroup>
        </div>
      </div>

      {/* Preview do Código */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Preview do Código
            </p>
            <div className="font-mono text-3xl font-bold text-primary mb-4">
              {previewAddress}
            </div>

            {/* Explicação do código */}
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground flex-wrap">
              <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {warehouseCode}
              </span>
              {formData.separator && <span>{formData.separator}</span>}
              <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                {zoneCode}
              </span>
              {formData.separator && <span>{formData.separator}</span>}
              <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                {formData.aisleDigits === 2 ? '01' : '1'}
                {formData.shelfDigits === 3 ? '002' : '02'}
              </span>
              {formData.separator && <span>{formData.separator}</span>}
              <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                {formData.binLabeling === 'LETTERS' ? 'B' : '2'}
              </span>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              <span className="text-blue-600">Armazém</span>
              {' → '}
              <span className="text-emerald-600">Zona</span>
              {' → '}
              <span className="text-amber-600">Corredor + Prateleira</span>
              {' → '}
              <span className="text-purple-600">Nicho</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemplos */}
      {sampleAddresses.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Exemplos de endereços:
          </Label>
          <div className="flex flex-wrap gap-2">
            {sampleAddresses.map((addr, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-muted font-mono text-sm"
              >
                {addr}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
