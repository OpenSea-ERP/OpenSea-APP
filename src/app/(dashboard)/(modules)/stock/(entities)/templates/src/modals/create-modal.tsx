'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CATEGORY_SUBCATEGORIES,
  PRESET_CATEGORY_LABELS,
  PRESETS_BY_CATEGORY,
  VISIBLE_CATEGORIES,
  type PresetCategory,
  type TemplatePreset,
} from '@/data/template-presets';
import { UNIT_OF_MEASURE_LABELS, type UnitOfMeasure } from '@/types/stock';
import type {
  CreateTemplateRequest,
  Template,
  TemplateAttributes,
} from '@/types/stock';
import {
  Check,
  FolderOpen,
  LayoutTemplate,
  Loader2,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

type WizardFlow = 'preset' | 'manual';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: Partial<Template>) => Promise<void>;
  formKey?: number;
  focusTrigger?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

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

const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  string: 'Texto',
  number: 'Número',
  select: 'Seleção',
  boolean: 'Sim/Não',
  date: 'Data',
};

const SPECIAL_MODULE_LABELS: Record<string, string> = {
  CARE_INSTRUCTIONS: 'Conservação Têxtil',
};

const UOM_ENTRIES = Object.entries(UNIT_OF_MEASURE_LABELS) as [
  UnitOfMeasure,
  string,
][];

// =============================================================================
// STEP 1: SELECT CATEGORY
// =============================================================================

function StepSelectCategory({
  onSelectCategory,
}: {
  onSelectCategory: (cat: PresetCategory) => void;
}) {
  return (
    <ScrollArea className="max-h-[340px]">
      <div className="grid grid-cols-2 gap-3 pr-1">
        {VISIBLE_CATEGORIES.map(cat => {
          const subcats = CATEGORY_SUBCATEGORIES[cat] || [];
          const presetCount = (PRESETS_BY_CATEGORY[cat] || []).length;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className="p-4 rounded-xl text-left transition-all border bg-white/5 hover:bg-white/10 hover:border-primary/40 border-transparent cursor-pointer"
            >
              <p className="font-medium text-sm">
                {PRESET_CATEGORY_LABELS[cat]}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {subcats.join(', ')}
              </p>
              <Badge
                variant="secondary"
                className="mt-2 text-[10px] px-1.5 py-0"
              >
                {presetCount} {presetCount === 1 ? 'preset' : 'presets'}
              </Badge>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// =============================================================================
// STEP 2: SELECT PRESET (auto-advances on click)
// =============================================================================

function StepSelectPreset({
  category,
  onSelect,
}: {
  category: PresetCategory;
  onSelect: (preset: TemplatePreset) => void;
}) {
  const [search, setSearch] = useState('');
  const categoryPresets = PRESETS_BY_CATEGORY[category] || [];

  const filtered = useMemo(
    () =>
      categoryPresets.filter(
        p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      ),
    [categoryPresets, search]
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar template..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
          autoFocus
        />
      </div>

      <ScrollArea className="max-h-[280px]">
        <div className="grid grid-cols-2 gap-3 pr-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 col-span-2">
              Nenhum template encontrado para &ldquo;{search}&rdquo;
            </p>
          ) : (
            filtered.map(preset => {
              const uomLabel =
                UNIT_OF_MEASURE_LABELS[preset.unitOfMeasure] ||
                preset.unitOfMeasure;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelect(preset)}
                  className="flex items-start gap-3 border rounded-lg p-4 cursor-pointer hover:border-primary transition text-left w-full bg-white/50 dark:bg-white/5"
                >
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    <LayoutTemplate className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm leading-tight">
                      {preset.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {uomLabel}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// =============================================================================
// STEP 2 (MANUAL): NAME + UOM FORM
// =============================================================================

function StepManualForm({
  name,
  unitOfMeasure,
  onNameChange,
  onUnitChange,
}: {
  name: string;
  unitOfMeasure: UnitOfMeasure;
  onNameChange: (value: string) => void;
  onUnitChange: (value: UnitOfMeasure) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="template-name">
          Nome do Template <span className="text-red-500">*</span>
        </Label>
        <Input
          id="template-name"
          placeholder="Ex: Eletrônicos, Roupas, Alimentos..."
          value={name}
          onChange={e => onNameChange(e.target.value)}
          autoFocus
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="template-uom">Unidade de Medida</Label>
        <Select
          value={unitOfMeasure}
          onValueChange={v => onUnitChange(v as UnitOfMeasure)}
        >
          <SelectTrigger id="template-uom" className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UOM_ENTRIES.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Você poderá configurar atributos e detalhes posteriormente.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 3: PRESET PREVIEW (full-width tables)
// =============================================================================

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
      <div className="border rounded-lg overflow-hidden w-full">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-3 py-2 font-medium w-[45%]">Atributo</th>
              <th className="px-3 py-2 font-medium w-[35%]">Tipo</th>
              <th className="px-3 py-2 font-medium text-center w-[20%]">
                Obrigatório
              </th>
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

function StepPresetPreview({ preset }: { preset: TemplatePreset }) {
  const hasProdAttrs = Object.keys(preset.productAttributes).length > 0;
  const hasVarAttrs = Object.keys(preset.variantAttributes).length > 0;
  const hasItemAttrs = Object.keys(preset.itemAttributes).length > 0;

  const defaultTab = hasProdAttrs
    ? 'product'
    : hasVarAttrs
      ? 'variant'
      : 'item';

  return (
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

      <ScrollArea className="flex-1 max-h-[280px] mt-3">
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
  );
}

// =============================================================================
// STEP 3 (MANUAL): CONFIRMATION SUMMARY
// =============================================================================

function StepManualConfirm({
  name,
  unitOfMeasure,
}: {
  name: string;
  unitOfMeasure: UnitOfMeasure;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <LayoutTemplate className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Unidade: {UNIT_OF_MEASURE_LABELS[unitOfMeasure]}
        </p>
      </div>
      <p className="text-xs text-muted-foreground max-w-xs">
        O template será criado sem atributos pré-definidos. Você poderá
        adicionar atributos de produto, variante e item posteriormente na página
        de edição.
      </p>
    </div>
  );
}

// =============================================================================
// MAIN WIZARD
// =============================================================================

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: CreateModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [flow, setFlow] = useState<WizardFlow>('preset');
  const [selectedCategory, setSelectedCategory] =
    useState<PresetCategory | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<TemplatePreset | null>(
    null
  );
  // Manual flow state
  const [manualName, setManualName] = useState('');
  const [manualUom, setManualUom] = useState<UnitOfMeasure>('UNITS');

  const handleClose = () => {
    setCurrentStep(1);
    setFlow('preset');
    setSelectedCategory(null);
    setSelectedPreset(null);
    setManualName('');
    setManualUom('UNITS');
    onClose();
  };

  // Auto-advance: click category → step 2
  const handleCategorySelect = (cat: PresetCategory) => {
    setSelectedCategory(cat);
    setCurrentStep(2);
  };

  // Auto-advance: click preset → step 3
  const handlePresetSelect = (preset: TemplatePreset) => {
    setSelectedPreset(preset);
    setCurrentStep(3);
  };

  const handleManualCreate = () => {
    setFlow('manual');
    setCurrentStep(2);
  };

  const handleConfirmPreset = async () => {
    if (!selectedPreset) return;
    const data: Partial<Template> & CreateTemplateRequest = {
      name: selectedPreset.name,
      unitOfMeasure: selectedPreset.unitOfMeasure,
      productAttributes: convertPresetAttributes(
        selectedPreset.productAttributes
      ),
      variantAttributes: convertPresetAttributes(
        selectedPreset.variantAttributes
      ),
      itemAttributes: convertPresetAttributes(selectedPreset.itemAttributes),
      specialModules: selectedPreset.specialModules,
    };
    await onSubmit(data);
    handleClose();
  };

  const handleConfirmManual = async () => {
    if (!manualName.trim()) return;
    const data: Partial<Template> & CreateTemplateRequest = {
      name: manualName.trim(),
      unitOfMeasure: manualUom,
    };
    await onSubmit(data);
    handleClose();
  };

  const goBackToStep1 = () => {
    if (flow === 'manual') {
      setFlow('preset');
      setManualName('');
      setManualUom('UNITS');
    }
    setSelectedCategory(null);
    setSelectedPreset(null);
    setCurrentStep(1);
  };

  const goBackToStep2 = () => {
    setSelectedPreset(null);
    setCurrentStep(2);
  };

  // Build step 3 title with badges after the name
  const presetStep3Title = selectedPreset ? (
    <span className="flex items-center gap-2 flex-wrap">
      <span>{selectedPreset.name}</span>
      <Badge variant="secondary" className="text-[11px]">
        {UNIT_OF_MEASURE_LABELS[selectedPreset.unitOfMeasure] ||
          selectedPreset.unitOfMeasure}
      </Badge>
      {selectedPreset.specialModules.map(mod => (
        <Badge
          key={mod}
          className="bg-primary/15 text-primary border-primary/30 text-[11px]"
        >
          {SPECIAL_MODULE_LABELS[mod] || mod}
        </Badge>
      ))}
    </span>
  ) : (
    'Confirmar Template'
  );

  // Build steps based on flow
  const steps: WizardStep[] =
    flow === 'preset'
      ? [
          // Step 1: Select Category (no footer cancel/advance — only "Criar do Zero")
          {
            title: 'Novo Template',
            description:
              'Escolha a categoria para ver os templates disponíveis.',
            icon: (
              <FolderOpen
                className="h-16 w-16 text-purple-400"
                strokeWidth={1.2}
              />
            ),
            content: (
              <StepSelectCategory onSelectCategory={handleCategorySelect} />
            ),
            isValid: false,
            footer: (
              <Button
                type="button"
                className="w-full gap-2"
                onClick={handleManualCreate}
              >
                <Settings2 className="w-4 h-4" />
                Criar Template do Zero
              </Button>
            ),
          },
          // Step 2: Select Preset (no footer — auto-advances, back in header)
          {
            title: selectedCategory
              ? `Templates — ${PRESET_CATEGORY_LABELS[selectedCategory]}`
              : 'Selecionar Template',
            description:
              'Escolha um template pré-configurado com atributos prontos.',
            icon: (
              <LayoutTemplate
                className="h-16 w-16 text-pink-400"
                strokeWidth={1.2}
              />
            ),
            content: selectedCategory ? (
              <StepSelectPreset
                category={selectedCategory}
                onSelect={handlePresetSelect}
              />
            ) : (
              <div />
            ),
            isValid: false,
            onBack: goBackToStep1,
            footer: <></>,
          },
          // Step 3: Preview + Confirm (back in header)
          {
            title: presetStep3Title,
            description:
              'Os atributos definidos podem ser editados posteriormente.',
            icon: (
              <Check className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
            ),
            content: selectedPreset ? (
              <StepPresetPreview preset={selectedPreset} />
            ) : (
              <div />
            ),
            isValid: true,
            onBack: goBackToStep2,
            footer: (
              <Button
                type="button"
                onClick={handleConfirmPreset}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Criar Template
              </Button>
            ),
          },
        ]
      : [
          // Manual Step 1: same category step (placeholder, skipped via setCurrentStep(2))
          {
            title: 'Novo Template',
            description:
              'Escolha a categoria para ver os templates disponíveis.',
            icon: (
              <FolderOpen
                className="h-16 w-16 text-purple-400"
                strokeWidth={1.2}
              />
            ),
            content: (
              <StepSelectCategory onSelectCategory={handleCategorySelect} />
            ),
            isValid: true,
            footer: (
              <Button
                type="button"
                className="w-full gap-2"
                onClick={handleManualCreate}
              >
                <Settings2 className="w-4 h-4" />
                Criar Template do Zero
              </Button>
            ),
          },
          // Manual Step 2: Name + UOM (back in header)
          {
            title: 'Novo Template Manual',
            description: 'Configure o nome e a unidade de medida do template.',
            icon: (
              <Settings2
                className="h-16 w-16 text-amber-400"
                strokeWidth={1.2}
              />
            ),
            content: (
              <StepManualForm
                name={manualName}
                unitOfMeasure={manualUom}
                onNameChange={setManualName}
                onUnitChange={setManualUom}
              />
            ),
            isValid: !!manualName.trim(),
            onBack: goBackToStep1,
          },
          // Manual Step 3: Confirm (back in header)
          {
            title: 'Confirmar Template',
            description: 'Revise as informações antes de criar.',
            icon: (
              <Check className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
            ),
            content: (
              <StepManualConfirm name={manualName} unitOfMeasure={manualUom} />
            ),
            isValid: true,
            onBack: () => setCurrentStep(2),
            footer: (
              <Button
                type="button"
                onClick={handleConfirmManual}
                disabled={isSubmitting || !manualName.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Criar Template
              </Button>
            ),
          },
        ];

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
