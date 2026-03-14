'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  PRESET_CATEGORY_LABELS,
  PRESETS_BY_CATEGORY,
  VISIBLE_CATEGORIES,
  CATEGORY_SUBCATEGORIES,
  type PresetCategory,
  type TemplatePreset,
} from '@/data/template-presets';
import { UNIT_OF_MEASURE_LABELS } from '@/types/stock';
import type {
  CreateTemplateRequest,
  Template,
  TemplateAttributes,
  UnitOfMeasure,
} from '@/types/stock';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  LayoutTemplateIcon,
  Settings2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { PresetCard } from '../components/preset-card';
import { QuickCreateForm } from '../components/quick-create-form';

type ModalState = 'grid' | 'preview' | 'manual';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: Partial<Template>) => Promise<void>;
  formKey?: number;
  focusTrigger?: number;
}

/**
 * Converte atributos do preset (tipo data/template-presets)
 * para o formato TemplateAttributes esperado pela API.
 */
function convertPresetAttributes(
  attrs: Record<
    string,
    {
      name: string;
      type: string;
      required?: boolean;
      options?: string[];
      unit?: string;
    }
  >
): TemplateAttributes {
  const result: TemplateAttributes = {};
  for (const [key, attr] of Object.entries(attrs)) {
    const typeMap: Record<string, string> = {
      text: 'string',
      number: 'number',
      select: 'select',
      boolean: 'boolean',
      date: 'date',
    };
    result[key] = {
      label: attr.name,
      type: (typeMap[attr.type] || attr.type) as
        | 'string'
        | 'number'
        | 'boolean'
        | 'date'
        | 'select',
      required: attr.required || false,
      ...(attr.options && attr.options.length > 0
        ? { options: attr.options }
        : {}),
    };
  }
  return result;
}

// ── Attribute preview table ──────────────────────

const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  string: 'Texto',
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
  attributes: Record<
    string,
    {
      name: string;
      type: string;
      required?: boolean;
      options?: string[];
      unit?: string;
    }
  >;
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
                    <span className="text-muted-foreground ml-1">
                      ({attr.unit})
                    </span>
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

// ── Sidebar category nav ─────────────────────────

function CategorySidebar({
  activeCategory,
  onSelect,
}: {
  activeCategory: PresetCategory | null;
  onSelect: (cat: PresetCategory) => void;
}) {
  return (
    <div className="w-48 shrink-0 border-r border-border/50 pr-2">
      <ScrollArea className="h-[55vh]">
        <div className="space-y-0.5 py-1">
          {VISIBLE_CATEGORIES.map(cat => {
            const isActive = cat === activeCategory;
            const subcats = CATEGORY_SUBCATEGORIES[cat] || [];

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelect(cat)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-muted/60 text-foreground/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{PRESET_CATEGORY_LABELS[cat]}</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90' : ''}`}
                  />
                </div>
                {isActive && subcats.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {subcats.join(', ')}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Preview with tabs ────────────────────────────

function PresetPreviewTabs({
  preset,
  onBack,
  onConfirm,
}: {
  preset: TemplatePreset;
  onBack: () => void;
  onConfirm: (preset: TemplatePreset) => void;
}) {
  const uomLabel =
    UNIT_OF_MEASURE_LABELS[preset.unitOfMeasure] || preset.unitOfMeasure;

  const hasProdAttrs = Object.keys(preset.productAttributes).length > 0;
  const hasVarAttrs = Object.keys(preset.variantAttributes).length > 0;
  const hasItemAttrs = Object.keys(preset.itemAttributes).length > 0;

  // Determine default tab
  const defaultTab = hasProdAttrs
    ? 'product'
    : hasVarAttrs
      ? 'variant'
      : 'item';

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0">
      {/* Info row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary">{uomLabel}</Badge>
        {preset.specialModules.map(mod => (
          <Badge
            key={mod}
            variant="outline"
            className="border-primary/30 text-primary"
          >
            {SPECIAL_MODULE_LABELS[mod] || mod}
          </Badge>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start h-auto gap-1 bg-muted/50 p-1">
          {hasProdAttrs && (
            <TabsTrigger value="product" className="text-xs px-3 py-1.5">
              Produto
            </TabsTrigger>
          )}
          {hasVarAttrs && (
            <TabsTrigger value="variant" className="text-xs px-3 py-1.5">
              Variante
            </TabsTrigger>
          )}
          {hasItemAttrs && (
            <TabsTrigger value="item" className="text-xs px-3 py-1.5">
              Item
            </TabsTrigger>
          )}
        </TabsList>

        <ScrollArea className="flex-1 max-h-[35vh] mt-3">
          {hasProdAttrs && (
            <TabsContent value="product" className="mt-0">
              <AttributeTable
                title="Atributos do Produto"
                attributes={preset.productAttributes}
              />
            </TabsContent>
          )}
          {hasVarAttrs && (
            <TabsContent value="variant" className="mt-0">
              <AttributeTable
                title="Atributos da Variante"
                attributes={preset.variantAttributes}
              />
            </TabsContent>
          )}
          {hasItemAttrs && (
            <TabsContent value="item" className="mt-0">
              <AttributeTable
                title="Atributos do Item"
                attributes={preset.itemAttributes}
              />
            </TabsContent>
          )}
        </ScrollArea>
      </Tabs>

      {/* Footer */}
      <Button className="w-full" onClick={() => onConfirm(preset)}>
        Adicionar Template
      </Button>
    </div>
  );
}

// ── Main modal ───────────────────────────────────

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: CreateModalProps) {
  const [state, setState] = useState<ModalState>('grid');
  const [activeCategory, setActiveCategory] = useState<PresetCategory>(
    VISIBLE_CATEGORIES[0]
  );
  const [selectedPreset, setSelectedPreset] = useState<TemplatePreset | null>(
    null
  );

  const handleClose = () => {
    setState('grid');
    setSelectedPreset(null);
    setActiveCategory(VISIBLE_CATEGORIES[0]);
    onClose();
  };

  const handleSelectPreset = (preset: TemplatePreset) => {
    setSelectedPreset(preset);
    setState('preview');
  };

  const handleConfirmPreset = async (preset: TemplatePreset) => {
    const data: Partial<Template> & CreateTemplateRequest = {
      name: preset.name,
      unitOfMeasure: preset.unitOfMeasure,
      productAttributes: convertPresetAttributes(preset.productAttributes),
      variantAttributes: convertPresetAttributes(preset.variantAttributes),
      itemAttributes: convertPresetAttributes(preset.itemAttributes),
      specialModules: preset.specialModules,
    };
    await onSubmit(data);
    handleClose();
  };

  const handleManualSubmit = async (formData: {
    name: string;
    unitOfMeasure: UnitOfMeasure;
  }) => {
    const data: Partial<Template> & CreateTemplateRequest = {
      name: formData.name,
      unitOfMeasure: formData.unitOfMeasure,
    };
    await onSubmit(data);
    handleClose();
  };

  const categoryPresets = PRESETS_BY_CATEGORY[activeCategory] || [];

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[90vh] overflow-hidden [&>button]:hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-3 items-center">
              {state !== 'grid' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setState('grid')}
                  className="shrink-0 -ml-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-purple-500 to-pink-600 p-2 rounded-lg">
                <LayoutTemplateIcon className="h-5 w-5" />
              </div>
              {state === 'preview' && selectedPreset
                ? selectedPreset.name
                : state === 'manual'
                  ? 'Novo Template Manual'
                  : 'Novo Template'}
            </div>
          </DialogTitle>
          <DialogDescription>
            {state === 'preview' && selectedPreset
              ? selectedPreset.description
              : state === 'manual'
                ? 'Configure um template com nome e unidade de medida.'
                : 'Escolha um template pré-configurado ou crie um do zero.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 min-h-0 flex-1">
          {state === 'grid' && (
            <div className="flex gap-4 h-full">
              {/* Sidebar */}
              <CategorySidebar
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
              />

              {/* Content */}
              <div className="flex-1 flex flex-col min-w-0 gap-3">
                <ScrollArea className="flex-1 max-h-[50vh]">
                  <div className="grid grid-cols-2 gap-3 pr-3">
                    {categoryPresets.map(preset => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        onSelect={handleSelectPreset}
                      />
                    ))}
                  </div>
                </ScrollArea>

                <Button
                  variant="default"
                  className="w-full gap-2 shrink-0"
                  onClick={() => setState('manual')}
                >
                  <Settings2 className="w-4 h-4" />
                  Configurar um Novo Template
                </Button>
              </div>
            </div>
          )}

          {state === 'preview' && selectedPreset && (
            <PresetPreviewTabs
              preset={selectedPreset}
              onBack={() => setState('grid')}
              onConfirm={handleConfirmPreset}
            />
          )}

          {state === 'manual' && (
            <QuickCreateForm
              onBack={() => setState('grid')}
              onSubmit={handleManualSubmit}
            />
          )}
        </div>

        {isSubmitting && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
            <p className="text-sm text-muted-foreground animate-pulse">
              Criando template...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
