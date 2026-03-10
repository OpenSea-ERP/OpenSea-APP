'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { TemplatePreset, TemplateAttribute } from '@/data/template-presets';
import { UNIT_OF_MEASURE_LABELS } from '@/types/stock';
import { ArrowLeft, Check, X } from 'lucide-react';

interface PresetPreviewProps {
  preset: TemplatePreset;
  onBack: () => void;
  onConfirm: (preset: TemplatePreset) => void;
}

const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  number: 'Número',
  select: 'Seleção',
  boolean: 'Sim/Não',
  date: 'Data',
};

function AttributeTable({
  title,
  attributes,
}: {
  title: string;
  attributes: Record<string, TemplateAttribute>;
}) {
  const entries = Object.entries(attributes);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-3 py-2 font-medium">Atributo</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium text-center">Obrigatório</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, attr]) => (
              <tr key={key} className="border-t">
                <td className="px-3 py-2">
                  {attr.name}
                  {attr.unit && (
                    <span className="text-muted-foreground ml-1">({attr.unit})</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {ATTRIBUTE_TYPE_LABELS[attr.type] || attr.type}
                </td>
                <td className="px-3 py-2 text-center">
                  {attr.required ? (
                    <Check className="w-4 h-4 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SPECIAL_MODULE_LABELS: Record<string, string> = {
  CARE_INSTRUCTIONS: 'Conservação Têxtil',
};

export function PresetPreview({ preset, onBack, onConfirm }: PresetPreviewProps) {
  const uomLabel = UNIT_OF_MEASURE_LABELS[preset.unitOfMeasure] || preset.unitOfMeasure;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">{preset.name}</h3>
      </div>

      <ScrollArea className="max-h-[55vh]">
        <div className="space-y-5 pr-3">
          {/* Description */}
          <p className="text-sm text-muted-foreground">{preset.description}</p>

          {/* Unit of Measure */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">
              Unidade de Medida
            </h4>
            <Badge variant="secondary">{uomLabel}</Badge>
          </div>

          {/* Special Modules */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">
              Módulos Especiais
            </h4>
            {preset.specialModules.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {preset.specialModules.map(mod => (
                  <Badge key={mod} variant="outline" className="border-primary/30 text-primary">
                    {SPECIAL_MODULE_LABELS[mod] || mod}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhum</p>
            )}
          </div>

          {/* Attribute Tables */}
          <AttributeTable
            title="Atributos do Produto"
            attributes={preset.productAttributes}
          />
          <AttributeTable
            title="Atributos da Variante"
            attributes={preset.variantAttributes}
          />
          <AttributeTable
            title="Atributos do Item"
            attributes={preset.itemAttributes}
          />
        </div>
      </ScrollArea>

      {/* Footer */}
      <Button className="w-full" onClick={() => onConfirm(preset)}>
        Adicionar Template
      </Button>
    </div>
  );
}
