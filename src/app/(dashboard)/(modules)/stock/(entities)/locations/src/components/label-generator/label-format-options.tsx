'use client';

import React from 'react';
import { QrCode, Barcode, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LabelConfig, LabelFormat, LabelSize } from '@/types/stock';
import { LABEL_SIZES } from '@/types/stock';

interface LabelFormatOptionsProps {
  config: LabelConfig;
  onChange: (config: LabelConfig) => void;
}

export function LabelFormatOptions({
  config,
  onChange,
}: LabelFormatOptionsProps) {
  const handleFormatChange = (format: LabelFormat) => {
    onChange({ ...config, format });
  };

  const handleSizeChange = (size: LabelSize) => {
    onChange({ ...config, size });
  };

  const handleToggle = (field: keyof LabelConfig) => {
    onChange({ ...config, [field]: !config[field] });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Formato da Etiqueta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Código */}
        <div className="space-y-3">
          <Label>Tipo de Código</Label>
          <RadioGroup
            value={config.format}
            onValueChange={value => handleFormatChange(value as LabelFormat)}
            className="grid grid-cols-2 gap-3"
          >
            <Label
              htmlFor="format-qr"
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                config.format === 'qr'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem value="qr" id="format-qr" className="sr-only" />
              <QrCode className="h-8 w-8" />
              <span className="font-medium">QR Code</span>
              <span className="text-xs text-muted-foreground text-center">
                Fácil de escanear com celular
              </span>
            </Label>

            <Label
              htmlFor="format-barcode"
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                config.format === 'barcode'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem
                value="barcode"
                id="format-barcode"
                className="sr-only"
              />
              <Barcode className="h-8 w-8" />
              <span className="font-medium">Código de Barras</span>
              <span className="text-xs text-muted-foreground text-center">
                Compatível com leitores tradicionais
              </span>
            </Label>
          </RadioGroup>
        </div>

        {/* Tamanho */}
        <div className="space-y-3">
          <Label>Tamanho</Label>
          <RadioGroup
            value={config.size}
            onValueChange={value => handleSizeChange(value as LabelSize)}
            className="grid grid-cols-3 gap-2"
          >
            {(Object.keys(LABEL_SIZES) as LabelSize[]).map(size => {
              const dimensions = LABEL_SIZES[size];
              const labels: Record<LabelSize, string> = {
                small: 'Pequena',
                medium: 'Média',
                large: 'Grande',
              };

              return (
                <Label
                  key={size}
                  htmlFor={`size-${size}`}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                    config.size === size
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  )}
                >
                  <RadioGroupItem
                    value={size}
                    id={`size-${size}`}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">{labels[size]}</span>
                  <span className="text-xs text-muted-foreground">
                    {dimensions.width}×{dimensions.height}mm
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
        </div>

        {/* Opções de exibição */}
        <div className="space-y-3">
          <Label>Informações na Etiqueta</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="show-warehouse"
                  className="font-normal cursor-pointer"
                >
                  Nome do Armazém
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ex: "Fábrica Principal"
                </p>
              </div>
              <Switch
                id="show-warehouse"
                checked={config.showWarehouseName}
                onCheckedChange={() => handleToggle('showWarehouseName')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="show-zone"
                  className="font-normal cursor-pointer"
                >
                  Nome da Zona
                </Label>
                <p className="text-xs text-muted-foreground">Ex: "Estoque"</p>
              </div>
              <Switch
                id="show-zone"
                checked={config.showZoneName}
                onCheckedChange={() => handleToggle('showZoneName')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="show-path"
                  className="font-normal cursor-pointer"
                >
                  Caminho Completo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ex: "Corredor 1 → Prat. 02 → Nicho B"
                </p>
              </div>
              <Switch
                id="show-path"
                checked={config.showFullPath}
                onCheckedChange={() => handleToggle('showFullPath')}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
