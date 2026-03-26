/**
 * ItemEntryFormModal - Modal for registering item entries
 * Uses NavigationWizardDialog with sections:
 * Variante (conditional), Entrada (+ template attributes), Custos, Rastreabilidade
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  MoneyInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  NavigationWizardDialog,
  type NavigationSection,
} from '@/components/ui/navigation-wizard-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  formatUnitAbbreviation,
  sanitizeQuantityInput,
} from '@/helpers/formatters';
import { useTemplate } from '@/hooks/stock/use-stock-other';
import { apiClient } from '@/lib/api-client';
import { translateError } from '@/lib/error-messages';
import { cn } from '@/lib/utils';
import { itemsService, productsService } from '@/services/stock';
import type {
  EntryMovementType,
  Product,
  RegisterItemEntryRequest,
  TemplateAttribute,
  Variant,
} from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Check,
  ChevronsUpDown,
  DollarSign,
  Info,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BinSelector } from '../components/bin-selector';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ItemEntryFormModalProps {
  product: Product | null;
  variant: Variant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill bin when opened from bin drawer */
  initialBinId?: string;
  /** Extra query keys to invalidate on success */
  extraInvalidateKeys?: string[][];
}

type SectionId = 'variant' | 'entry' | 'costs' | 'batch';

interface FormData {
  // Entry
  entryType: EntryMovementType;
  binId: string;
  quantity: string;
  // Costs
  unitCost: number;
  // Batch & Traceability
  uniqueCode: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  invoiceNumber: string;
  notes: string;
  // Attributes
  attributes: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENTRY_TYPE_OPTIONS: {
  type: EntryMovementType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    type: 'PURCHASE',
    label: 'Compra',
    description: 'Entrada por aquisição',
    icon: ShoppingCart,
  },
  {
    type: 'CUSTOMER_RETURN',
    label: 'Devolução',
    description: 'Retorno de cliente',
    icon: Undo2,
  },
];

const INITIAL_FORM: FormData = {
  entryType: 'PURCHASE',
  binId: '',
  quantity: '1',
  unitCost: 0,
  uniqueCode: '',
  batchNumber: '',
  manufacturingDate: '',
  expiryDate: '',
  invoiceNumber: '',
  notes: '',
  attributes: {},
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ItemEntryFormModal({
  product: productProp,
  variant: variantProp,
  open,
  onOpenChange,
  initialBinId,
  extraInvalidateKeys,
}: ItemEntryFormModalProps) {
  const queryClient = useQueryClient();

  // When no variant is provided, user picks one via search
  const needsVariantSearch = !variantProp;
  const [pickedProduct, setPickedProduct] = useState<Product | null>(null);
  const [pickedVariant, setPickedVariant] = useState<Variant | null>(null);

  // Resolved product/variant — either from props or from search
  const product = variantProp ? productProp : pickedProduct;
  const variant = variantProp ?? pickedVariant;

  const [activeSection, setActiveSection] = useState<SectionId>(
    needsVariantSearch ? 'variant' : 'entry'
  );
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>(
    {}
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch template for dynamic attributes
  const { data: template } = useTemplate(product?.templateId || '');

  // ---------------------------------------------------------------------------
  // Reset form when modal opens
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (open) {
      setFormData({ ...INITIAL_FORM, binId: initialBinId || '' });
      setActiveSection(needsVariantSearch ? 'variant' : 'entry');
      setSectionErrors({});
      setFieldErrors({});
      setPickedProduct(null);
      setPickedVariant(null);
    }
  }, [open, initialBinId, needsVariantSearch]);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const parsedQuantity = useMemo(() => {
    const q = parseFloat(formData.quantity.replace(',', '.'));
    return isNaN(q) || q <= 0 ? 0 : Math.round(q * 1000) / 1000;
  }, [formData.quantity]);

  const totalCost = useMemo(() => {
    if (formData.unitCost > 0 && parsedQuantity > 0) {
      return Number((formData.unitCost * parsedQuantity).toFixed(2));
    }
    return 0;
  }, [formData.unitCost, parsedQuantity]);

  const unitOfMeasure = useMemo(() => {
    return formatUnitAbbreviation(template?.unitOfMeasure);
  }, [template]);

  // ---------------------------------------------------------------------------
  // Template attributes
  // ---------------------------------------------------------------------------

  const itemAttributes = useMemo(() => {
    if (!template?.itemAttributes) return {};
    return template.itemAttributes;
  }, [template]);

  const hasAttributes = Object.keys(itemAttributes).length > 0;

  // ---------------------------------------------------------------------------
  // Sections (dynamic)
  // ---------------------------------------------------------------------------

  const sections: NavigationSection[] = useMemo(
    () => [
      {
        id: 'variant',
        label: 'Variante',
        icon: <Search className="w-4 h-4" />,
        description: 'Selecionar variante',
        hidden: !needsVariantSearch,
      },
      {
        id: 'entry',
        label: 'Entrada',
        icon: <Package className="w-4 h-4" />,
        description: hasAttributes
          ? 'Tipo, local, quantidade, atributos'
          : 'Tipo, local, quantidade',
      },
      {
        id: 'costs',
        label: 'Custos',
        icon: <DollarSign className="w-4 h-4" />,
        description: 'Preço de custo',
      },
      {
        id: 'batch',
        label: 'Rastreabilidade',
        icon: <CalendarDays className="w-4 h-4" />,
        description: 'Lote, validade, NF',
      },
    ],
    [hasAttributes, needsVariantSearch]
  );

  // ---------------------------------------------------------------------------
  // Mutation
  // ---------------------------------------------------------------------------

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['items', 'by-variant', variant?.id],
    });
    queryClient.invalidateQueries({ queryKey: ['items'] });
    queryClient.invalidateQueries({ queryKey: ['variants'] });
    queryClient.invalidateQueries({ queryKey: ['bins'] });
    queryClient.invalidateQueries({
      queryKey: ['items', 'stats-by-variants', product?.id],
    });
    if (extraInvalidateKeys) {
      for (const key of extraInvalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    }
  }, [queryClient, variant?.id, product?.id, extraInvalidateKeys]);

  const createItemMutation = useMutation({
    mutationFn: (data: RegisterItemEntryRequest) =>
      itemsService.registerEntry(data),
    onSuccess: () => {
      invalidateQueries();
      toast.success('Item registrado com sucesso!');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(translateError(error instanceof Error ? error.message : 'Erro ao registrar entrada'));
    },
  });

  // "Save and register another" mutation
  const createAndContinueMutation = useMutation({
    mutationFn: (data: RegisterItemEntryRequest) =>
      itemsService.registerEntry(data),
    onSuccess: () => {
      invalidateQueries();
      toast.success('Item registrado! Pronto para o próximo.');
      // Reset only quantity-specific fields, keep selection & bin
      setFormData(prev => ({
        ...prev,
        quantity: '1',
        uniqueCode: '',
        batchNumber: '',
        notes: '',
      }));
      setActiveSection('entry');
      setSectionErrors({});
      setFieldErrors({});
    },
    onError: (error: Error) => {
      toast.error(translateError(error instanceof Error ? error.message : 'Erro ao registrar entrada'));
    },
  });

  const isPending =
    createItemMutation.isPending || createAndContinueMutation.isPending;

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const secs: Record<string, boolean> = {};

    if (needsVariantSearch && !variant) {
      secs.variant = true;
    }
    if (!formData.binId) {
      errors.binId = 'Localização é obrigatória';
      secs.entry = true;
    }
    if (parsedQuantity <= 0) {
      errors.quantity = 'Quantidade inválida';
      secs.entry = true;
    }

    setFieldErrors(errors);
    setSectionErrors(secs);

    if (Object.keys(errors).length > 0) {
      toast.error('Preencha os campos obrigatórios');
      const firstErrorSection = Object.keys(secs)[0] as SectionId;
      if (firstErrorSection) setActiveSection(firstErrorSection);
      return false;
    }
    return true;
  }, [formData.binId, parsedQuantity, needsVariantSearch, variant]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setFormData(prev => ({ ...prev, [key]: value }));
      // Clear field error
      setFieldErrors(prev => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
      // Clear entry section errors
      if (key === 'binId' || key === 'quantity') {
        setSectionErrors(prev => {
          if (!prev.entry) return prev;
          const next = { ...prev };
          delete next.entry;
          return next;
        });
      }
    },
    []
  );

  const updateAttribute = useCallback((key: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const buildRequestData = useCallback((): RegisterItemEntryRequest | null => {
    if (!variant?.id) return null;
    if (!validate()) return null;

    // Build notes: prepend invoice number if present
    let notes = formData.notes.trim() || undefined;
    if (formData.invoiceNumber.trim()) {
      const invoiceLine = `NF: ${formData.invoiceNumber.trim()}`;
      notes = notes ? `${invoiceLine} | ${notes}` : invoiceLine;
    }

    return {
      variantId: variant.id,
      binId: formData.binId,
      quantity: parsedQuantity,
      movementType: formData.entryType,
      uniqueCode: formData.uniqueCode.trim() || undefined,
      unitCost: formData.unitCost > 0 ? formData.unitCost : undefined,
      attributes: formData.attributes,
      batchNumber: formData.batchNumber.trim() || undefined,
      manufacturingDate: formData.manufacturingDate || undefined,
      expiryDate: formData.expiryDate || undefined,
      notes,
    };
  }, [variant, formData, parsedQuantity, validate]);

  const handleSubmit = useCallback(() => {
    const data = buildRequestData();
    if (!data) return;
    createItemMutation.mutate(data);
  }, [buildRequestData, createItemMutation]);

  const handleSubmitAndContinue = useCallback(() => {
    const data = buildRequestData();
    if (!data) return;
    createAndContinueMutation.mutate(data);
  }, [buildRequestData, createAndContinueMutation]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!needsVariantSearch && (!product || !variant)) return null;

  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={handleClose}
      title="Registrar Entrada"
      subtitle={
        variant
          ? `Adicionar item para ${variant.name}`
          : 'Selecione uma variante para continuar'
      }
      sections={sections}
      activeSection={activeSection}
      onSectionChange={id => setActiveSection(id as SectionId)}
      sectionErrors={sectionErrors}
      isPending={isPending}
      footer={
        <div className="flex items-center gap-2 w-full">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={handleSubmitAndContinue}
            disabled={isPending}
          >
            {createAndContinueMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Salvar e Registrar Outro
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {createItemMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Entrada
              </>
            )}
          </Button>
        </div>
      }
    >
      {activeSection === 'variant' && needsVariantSearch && (
        <VariantSearchSection
          selectedVariant={pickedVariant}
          onSelect={(v, p) => {
            setPickedVariant(v);
            setPickedProduct(p);
            setSectionErrors(prev => {
              const next = { ...prev };
              delete next.variant;
              return next;
            });
          }}
        />
      )}
      {activeSection === 'entry' && (
        <EntrySection
          formData={formData}
          updateField={updateField}
          updateAttribute={updateAttribute}
          unitOfMeasure={unitOfMeasure}
          isPending={isPending}
          fieldErrors={fieldErrors}
          itemAttributes={itemAttributes}
          hasAttributes={hasAttributes}
        />
      )}
      {activeSection === 'costs' && (
        <CostsSection
          formData={formData}
          updateField={updateField}
          totalCost={totalCost}
          parsedQuantity={parsedQuantity}
          unitOfMeasure={unitOfMeasure}
          isPending={isPending}
        />
      )}
      {activeSection === 'batch' && (
        <BatchSection
          formData={formData}
          updateField={updateField}
          isPending={isPending}
        />
      )}
    </NavigationWizardDialog>
  );
}

// ===========================================================================
// Section Components
// ===========================================================================

interface SectionProps {
  formData: FormData;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  isPending: boolean;
}

// ---------------------------------------------------------------------------
// Entry Section (now includes template attributes)
// ---------------------------------------------------------------------------

interface EntrySectionProps extends SectionProps {
  unitOfMeasure: string;
  fieldErrors: Record<string, string>;
  itemAttributes: Record<string, TemplateAttribute>;
  hasAttributes: boolean;
  updateAttribute: (key: string, value: unknown) => void;
}

function EntrySection({
  formData,
  updateField,
  updateAttribute,
  unitOfMeasure,
  isPending,
  fieldErrors,
  itemAttributes,
  hasAttributes,
}: EntrySectionProps) {
  return (
    <div className="space-y-4">
      {/* Tipo de Entrada */}
      <div className="space-y-1.5">
        <Label>
          Tipo de Entrada <span className="text-rose-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {ENTRY_TYPE_OPTIONS.map(option => {
            const Icon = option.icon;
            const isSelected = formData.entryType === option.type;
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => updateField('entryType', option.type)}
                disabled={isPending}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
                    : 'border-border hover:bg-muted/50 text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-md',
                    isSelected
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Localização + Quantidade */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>
            Localização (Bin) <span className="text-rose-500">*</span>
          </Label>
          <BinSelector
            value={formData.binId}
            onChange={binId => updateField('binId', binId)}
            placeholder="Buscar localização..."
            disabled={isPending}
          />
          {fieldErrors.binId && (
            <p className="text-xs text-rose-500">{fieldErrors.binId}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ief-quantity">
            Quantidade <span className="text-rose-500">*</span>
          </Label>
          <InputGroup className="rounded-md">
            <Input
              id="ief-quantity"
              type="text"
              inputMode="decimal"
              placeholder="1,000"
              value={formData.quantity}
              onChange={e => {
                const sanitized = sanitizeQuantityInput(e.target.value);
                updateField('quantity', sanitized);
              }}
              disabled={isPending}
              className={cn(
                'rounded-r-none',
                fieldErrors.quantity && 'border-rose-500'
              )}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>{unitOfMeasure}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          {fieldErrors.quantity ? (
            <p className="text-xs text-rose-500">{fieldErrors.quantity}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Máximo 3 casas decimais
            </p>
          )}
        </div>
      </div>

      {/* Template Attributes (inline) */}
      {hasAttributes && (
        <>
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Atributos do Template</span>
            </div>
          </div>
          <AttributeFields
            formData={formData}
            itemAttributes={itemAttributes}
            updateAttribute={updateAttribute}
            isPending={isPending}
          />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attribute Fields (inline component, used inside EntrySection)
// ---------------------------------------------------------------------------

interface AttributeFieldsProps {
  formData: FormData;
  itemAttributes: Record<string, TemplateAttribute>;
  updateAttribute: (key: string, value: unknown) => void;
  isPending: boolean;
}

function AttributeFields({
  formData,
  itemAttributes,
  updateAttribute,
  isPending,
}: AttributeFieldsProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(itemAttributes).map(
          ([key, config]: [string, TemplateAttribute]) => {
            const rawValue = formData.attributes[key];
            const currentValue = String(rawValue ?? '');
            const isBooleanType =
              config.type === 'boolean' ||
              (config.type as string) === 'sim/nao';

            return (
              <div key={key} className="space-y-1.5">
                {isBooleanType ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`ief-attr-${key}`} className="text-sm">
                        {config.label || key}
                        {config.required && (
                          <span className="text-rose-500"> *</span>
                        )}
                      </Label>
                      {config.description && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{config.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <Switch
                      id={`ief-attr-${key}`}
                      checked={
                        rawValue === true ||
                        currentValue === 'true' ||
                        currentValue === 'sim' ||
                        currentValue === '1'
                      }
                      onCheckedChange={checked => updateAttribute(key, checked)}
                      disabled={isPending}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`ief-attr-${key}`} className="text-sm">
                        {config.label || key}
                        {config.required && (
                          <span className="text-rose-500"> *</span>
                        )}
                      </Label>
                      {config.description && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{config.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {config.type === 'select' ? (
                      <Select
                        value={currentValue}
                        onValueChange={value => updateAttribute(key, value)}
                        disabled={isPending}
                      >
                        <SelectTrigger id={`ief-attr-${key}`}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {config.options?.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : config.type === 'number' ? (
                      <Input
                        id={`ief-attr-${key}`}
                        type="number"
                        value={currentValue}
                        onChange={e =>
                          updateAttribute(key, parseFloat(e.target.value) || 0)
                        }
                        placeholder={config.placeholder || ''}
                        disabled={isPending}
                      />
                    ) : config.type === 'date' ? (
                      <Input
                        id={`ief-attr-${key}`}
                        type="date"
                        value={currentValue}
                        onChange={e => updateAttribute(key, e.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <Input
                        id={`ief-attr-${key}`}
                        type="text"
                        value={currentValue}
                        onChange={e => updateAttribute(key, e.target.value)}
                        placeholder={config.placeholder || ''}
                        disabled={isPending}
                      />
                    )}
                  </>
                )}
              </div>
            );
          }
        )}
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Costs Section
// ---------------------------------------------------------------------------

interface CostsSectionProps extends SectionProps {
  totalCost: number;
  parsedQuantity: number;
  unitOfMeasure: string;
}

function CostsSection({
  formData,
  updateField,
  totalCost,
  parsedQuantity,
  unitOfMeasure,
  isPending,
}: CostsSectionProps) {
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Custo Unitário */}
          <div className="space-y-1.5">
            <Label htmlFor="ief-unitCost">Preço de Custo Unitário</Label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>R$</InputGroupText>
              </InputGroupAddon>
              <MoneyInput
                id="ief-unitCost"
                value={formData.unitCost}
                onChange={value => updateField('unitCost', value)}
                placeholder="0,00"
                disabled={isPending}
              />
            </InputGroup>
          </div>

          {/* Custo Total */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="ief-totalCost">Custo Total</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Custo unitário x {parsedQuantity} {unitOfMeasure}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>R$</InputGroupText>
              </InputGroupAddon>
              <MoneyInput
                id="ief-totalCost"
                value={totalCost}
                disabled
                className="bg-muted"
              />
            </InputGroup>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Batch Section (with uniqueCode)
// ---------------------------------------------------------------------------

function BatchSection({ formData, updateField, isPending }: SectionProps) {
  return (
    <div className="space-y-4">
      {/* Código Único */}
      <div className="space-y-1.5">
        <Label htmlFor="ief-uniqueCode">Código Único</Label>
        <Input
          id="ief-uniqueCode"
          value={formData.uniqueCode}
          onChange={e => updateField('uniqueCode', e.target.value)}
          placeholder="Código de identificação próprio (opcional)"
          maxLength={128}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Número de série, código de patrimônio ou identificador interno
        </p>
      </div>

      {/* Lote + NF */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ief-batchNumber">N° do Lote</Label>
          <Input
            id="ief-batchNumber"
            value={formData.batchNumber}
            onChange={e => updateField('batchNumber', e.target.value)}
            placeholder="Ex: LOTE-2026-001"
            maxLength={64}
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ief-invoiceNumber">N° da Nota Fiscal</Label>
          <Input
            id="ief-invoiceNumber"
            value={formData.invoiceNumber}
            onChange={e => updateField('invoiceNumber', e.target.value)}
            placeholder="Ex: 000.123.456"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ief-manufacturingDate">Data de Fabricação</Label>
          <Input
            id="ief-manufacturingDate"
            type="date"
            value={formData.manufacturingDate}
            onChange={e => updateField('manufacturingDate', e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ief-expiryDate">Data de Validade</Label>
          <Input
            id="ief-expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={e => updateField('expiryDate', e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-1.5">
        <Label htmlFor="ief-notes">Observações</Label>
        <textarea
          id="ief-notes"
          value={formData.notes}
          onChange={e => updateField('notes', e.target.value)}
          placeholder="Informações adicionais sobre esta entrada..."
          maxLength={1000}
          rows={3}
          disabled={isPending}
          className={cn(
            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-none'
          )}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.notes.length}/1000
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant Search Section (shown when no variant is pre-selected)
// ---------------------------------------------------------------------------

interface VariantSearchSectionProps {
  selectedVariant: Variant | null;
  onSelect: (variant: Variant, product: Product) => void;
}

interface VariantSearchOption {
  id: string;
  name: string;
  reference: string | null;
  colorHex: string | null;
  secondaryColorHex: string | null;
  pattern: string | null;
  productId: string;
  productName: string;
  templateName: string | null;
  manufacturerName: string | null;
  fullLabel: string;
}

function getSearchPatternStyle(
  colorHex: string | null,
  secondaryColorHex: string | null,
  pattern: string | null
): React.CSSProperties {
  const primary = colorHex || '#cbd5e1';
  const secondary = secondaryColorHex || '';
  const hasSecondary = !!secondary;
  const sec = secondary || '#94a3b8';
  switch (pattern) {
    case 'SOLID':
      if (hasSecondary)
        return {
          background: `linear-gradient(135deg, ${primary} 50%, ${sec} 50%)`,
        };
      return { background: primary };
    case 'STRIPED':
      return {
        background: `repeating-linear-gradient(45deg, ${primary}, ${primary} 4px, ${sec} 4px, ${sec} 8px)`,
      };
    case 'GRADIENT':
      return { background: `linear-gradient(135deg, ${primary}, ${sec})` };
    case 'JACQUARD':
      return {
        background: `repeating-conic-gradient(${primary} 0% 25%, ${sec} 0% 50%) 0 0 / 8px 8px`,
      };
    default:
      return { background: primary };
  }
}

async function fetchAllSearchPages<T>(
  endpoint: string,
  dataKey: string
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  const limit = 100;
  while (true) {
    const response = await apiClient.get<Record<string, unknown>>(
      `${endpoint}?page=${page}&limit=${limit}`
    );
    const items = response[dataKey] as T[] | undefined;
    if (items && items.length > 0) allItems.push(...items);
    const meta = response.meta as { pages: number } | undefined;
    if (!meta || page >= meta.pages) break;
    page++;
  }
  return allItems;
}

function VariantSearchSection({
  selectedVariant,
  onSelect,
}: VariantSearchSectionProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const { data: options, isLoading } = useQuery({
    queryKey: ['item-entry', 'variant-search-options'],
    queryFn: async (): Promise<VariantSearchOption[]> => {
      const [variants, products] = await Promise.all([
        fetchAllSearchPages<{
          id: string;
          name: string;
          reference?: string;
          productId: string;
          colorHex?: string;
          secondaryColorHex?: string;
          pattern?: string;
        }>('/v1/variants', 'variants'),
        fetchAllSearchPages<{
          id: string;
          name: string;
          templateId?: string;
          template?: { id: string; name: string };
          manufacturer?: { id: string; name: string } | null;
        }>('/v1/products', 'products'),
      ]);

      const productMap = new Map(products.map(p => [p.id, p]));

      return variants.map(v => {
        const prod = productMap.get(v.productId);
        const templateName = prod?.template?.name ?? null;
        const productName = prod?.name ?? '';
        const manufacturerName = prod?.manufacturer?.name ?? null;
        const fullLabel = [templateName, productName, v.name]
          .filter(Boolean)
          .join(' · ');
        return {
          id: v.id,
          name: v.name,
          reference: v.reference || null,
          colorHex: v.colorHex || null,
          secondaryColorHex: v.secondaryColorHex || null,
          pattern: v.pattern || null,
          productId: v.productId,
          productName,
          templateName,
          manufacturerName,
          fullLabel,
        };
      });
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleSelect = useCallback(
    async (option: VariantSearchOption) => {
      setPopoverOpen(false);
      setIsResolving(true);
      try {
        const productResponse = await productsService.getProduct(
          option.productId
        );
        const product = productResponse.product;
        const found = product.variants?.find(v => v.id === option.id);
        const variant: Variant = found
          ? {
              ...found,
              productId: option.productId,
              attributes:
                ((found as Record<string, unknown>).attributes as Record<
                  string,
                  unknown
                >) ?? {},
              outOfLine: false,
            }
          : {
              id: option.id,
              name: option.name,
              productId: option.productId,
              price: 0,
              attributes: {},
              outOfLine: false,
              isActive: true,
              createdAt: new Date().toISOString(),
              colorHex: option.colorHex ?? undefined,
              secondaryColorHex: option.secondaryColorHex,
              pattern: option.pattern as Variant['pattern'],
              reference: option.reference ?? undefined,
            };

        onSelect(variant, product);
      } catch (err) {
        toast.error(translateError(err instanceof Error ? err.message : 'Erro ao carregar dados do produto'));
      } finally {
        setIsResolving(false);
      }
    },
    [onSelect]
  );

  const hasColor = (o: VariantSearchOption) => !!(o.colorHex || o.pattern);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Variante <span className="text-rose-500">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Busque e selecione a variante para registrar a entrada.
        </p>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className="w-full justify-between h-auto min-h-[48px] px-3 py-2.5"
            >
              {selectedVariant ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  {selectedVariant.colorHex || selectedVariant.pattern ? (
                    <div
                      className="h-7 w-10 rounded-md shrink-0 border border-black/10"
                      style={getSearchPatternStyle(
                        selectedVariant.colorHex || null,
                        selectedVariant.secondaryColorHex || null,
                        selectedVariant.pattern || null
                      )}
                    />
                  ) : (
                    <div className="h-7 w-10 rounded-md shrink-0 bg-muted flex items-center justify-center">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {selectedVariant.name}
                    </p>
                    {selectedVariant.reference && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        Ref: {selectedVariant.reference}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  Buscar variante por nome, produto ou referência...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] min-w-[480px] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Buscar..." className="h-10" />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Carregando variantes...</span>
                    </div>
                  ) : (
                    'Nenhuma variante encontrada.'
                  )}
                </CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="max-h-[300px]">
                    {(options ?? []).map(option => (
                      <CommandItem
                        key={option.id}
                        value={`${option.fullLabel} ${option.manufacturerName || ''} ${option.reference || ''}`}
                        onSelect={() => handleSelect(option)}
                        className="cursor-pointer py-2.5 px-2"
                      >
                        <div className="flex items-center gap-2.5 w-full min-w-0">
                          {hasColor(option) ? (
                            <div
                              className="h-7 w-10 rounded-md shrink-0 border border-black/10"
                              style={getSearchPatternStyle(
                                option.colorHex,
                                option.secondaryColorHex,
                                option.pattern
                              )}
                            />
                          ) : (
                            <div className="h-7 w-10 rounded-md shrink-0 bg-muted flex items-center justify-center">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {option.fullLabel}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {option.manufacturerName && (
                                <span>{option.manufacturerName}</span>
                              )}
                              {option.manufacturerName &&
                                option.reference &&
                                ' · '}
                              {option.reference && (
                                <span className="font-mono">
                                  Ref: {option.reference}
                                </span>
                              )}
                              {!option.manufacturerName &&
                                !option.reference &&
                                '\u00A0'}
                            </p>
                          </div>
                          {selectedVariant?.id === option.id && (
                            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {isResolving && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm text-muted-foreground">
            Carregando dados do produto...
          </span>
        </div>
      )}

      {selectedVariant && !isResolving && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-3">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Variante selecionada
          </p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/60 mt-0.5">
            {selectedVariant.name}
            {selectedVariant.reference &&
              ` · Ref: ${selectedVariant.reference}`}
          </p>
        </div>
      )}
    </div>
  );
}
