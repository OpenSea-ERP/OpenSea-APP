/**
 * VariantFormModal - Unified modal for creating and editing variants
 * Uses NavigationWizardDialog with 5 sections:
 * Informações, Aparência, Preços, Estoque, Atributos (conditional)
 */

'use client';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
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
import { useTemplate } from '@/hooks/stock/use-stock-other';
import { translateError } from '@/lib/error-messages';
import { cn } from '@/lib/utils';
import { variantsService } from '@/services/stock';
import type {
  CreateVariantRequest,
  Pattern,
  Product,
  TemplateAttribute,
  UpdateVariantRequest,
  Variant,
} from '@/types/stock';
import { PATTERN_LABELS } from '@/types/stock';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  FileText,
  Info,
  Loader2,
  Package,
  Palette,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VariantFormModalProps {
  product: Product | null;
  variant?: Variant | null;
  /** Number of items registered for this variant (used to block deletion) */
  itemCount?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SectionId = 'basic' | 'appearance' | 'pricing' | 'stock' | 'attributes';

interface FormData {
  name: string;
  sku: string;
  reference: string;
  colorHex: string;
  colorPantone: string;
  secondaryColorHex: string;
  secondaryColorPantone: string;
  pattern: string;
  outOfLine: boolean;
  isActive: boolean;
  // Pricing
  informedCostPrice: number;
  profitMarginPercent: number;
  definedSalePrice: number;
  // Stock
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  // Attributes
  attributes: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_FORM: FormData = {
  name: '',
  sku: '',
  reference: '',
  colorHex: '',
  colorPantone: '',
  secondaryColorHex: '',
  secondaryColorPantone: '',
  pattern: '',
  outOfLine: false,
  isActive: true,
  informedCostPrice: 0,
  profitMarginPercent: 0,
  definedSalePrice: 0,
  minStock: 0,
  maxStock: 0,
  reorderPoint: 0,
  reorderQuantity: 0,
  attributes: {},
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VariantFormModal({
  product,
  variant,
  itemCount = 0,
  open,
  onOpenChange,
}: VariantFormModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!variant;

  const [activeSection, setActiveSection] = useState<SectionId>('basic');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>(
    {}
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showDeletePin, setShowDeletePin] = useState(false);

  // Fetch template for dynamic attributes
  const { data: template } = useTemplate(product?.templateId || '');

  // ---------------------------------------------------------------------------
  // Populate form / reset on open
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!open) return;

    if (variant) {
      const attrs: Record<string, unknown> = {};
      if (variant.attributes && typeof variant.attributes === 'object') {
        for (const [key, value] of Object.entries(variant.attributes)) {
          // Convert numbers to string so decimal inputs work without losing format
          attrs[key] = typeof value === 'number' ? String(value) : value;
        }
      }
      setFormData({
        name: variant.name || '',
        sku: variant.sku || '',
        reference: variant.reference || '',
        colorHex: variant.colorHex || '',
        colorPantone: variant.colorPantone || '',
        secondaryColorHex: variant.secondaryColorHex || '',
        secondaryColorPantone: variant.secondaryColorPantone || '',
        pattern: variant.pattern || '',
        outOfLine: variant.outOfLine ?? false,
        isActive: variant.isActive ?? true,
        informedCostPrice: variant.costPrice || 0,
        profitMarginPercent: variant.profitMargin || 0,
        definedSalePrice: variant.price || 0,
        minStock: variant.minStock || 0,
        maxStock: variant.maxStock || 0,
        reorderPoint: variant.reorderPoint || 0,
        reorderQuantity: variant.reorderQuantity || 0,
        attributes: attrs,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setActiveSection('basic');
    setSectionErrors({});
    setFieldErrors({});
  }, [variant, open]);

  // ---------------------------------------------------------------------------
  // Pricing calculations
  // ---------------------------------------------------------------------------

  const calculatedCostPrice = variant?.costPrice || 0;

  const calculatedSalePrice = useMemo(() => {
    if (formData.informedCostPrice > 0 && formData.profitMarginPercent > 0) {
      return Number(
        (
          formData.informedCostPrice *
          (1 + formData.profitMarginPercent / 100)
        ).toFixed(2)
      );
    }
    return 0;
  }, [formData.informedCostPrice, formData.profitMarginPercent]);

  const calculatedProfitMargin = useMemo(() => {
    if (formData.informedCostPrice > 0 && formData.definedSalePrice > 0) {
      return Number(
        (
          ((formData.definedSalePrice - formData.informedCostPrice) /
            formData.informedCostPrice) *
          100
        ).toFixed(2)
      );
    }
    return 0;
  }, [formData.informedCostPrice, formData.definedSalePrice]);

  // ---------------------------------------------------------------------------
  // Template attributes
  // ---------------------------------------------------------------------------

  const variantAttributes = useMemo(() => {
    if (!template?.variantAttributes) return {};
    return template.variantAttributes;
  }, [template]);

  const hasAttributes = Object.keys(variantAttributes).length > 0;

  // ---------------------------------------------------------------------------
  // Sections (dynamic)
  // ---------------------------------------------------------------------------

  const sections: NavigationSection[] = useMemo(
    () => [
      {
        id: 'basic',
        label: 'Informações',
        icon: <FileText className="w-4 h-4" />,
        description: 'Nome, SKU, referência',
      },
      {
        id: 'appearance',
        label: 'Aparência',
        icon: <Palette className="w-4 h-4" />,
        description: 'Cores e padrão',
      },
      {
        id: 'pricing',
        label: 'Preços',
        icon: <DollarSign className="w-4 h-4" />,
        description: 'Custo, margem, venda',
      },
      {
        id: 'stock',
        label: 'Estoque',
        icon: <Package className="w-4 h-4" />,
        description: 'Mín, máx, reposição',
      },
      {
        id: 'attributes',
        label: 'Atributos',
        icon: <SlidersHorizontal className="w-4 h-4" />,
        description: 'Atributos do template',
        hidden: !hasAttributes,
      },
    ],
    [hasAttributes]
  );

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['variants', 'by-product', product?.id],
    });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({
      queryKey: ['items', 'stats-by-variants', product?.id],
    });
  }, [queryClient, product?.id]);

  const createMutation = useMutation({
    mutationFn: (data: CreateVariantRequest) =>
      variantsService.createVariant(data),
    onSuccess: () => {
      invalidateQueries();
      toast.success('Variante criada com sucesso!');
      onOpenChange(false);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('SKU already exists')) {
        setFieldErrors(prev => ({ ...prev, sku: translateError(msg) }));
        setActiveSection('basic');
      } else if (msg.includes('Price cannot be negative')) {
        setFieldErrors(prev => ({ ...prev, definedSalePrice: translateError(msg) }));
        setActiveSection('pricing');
      } else if (msg.includes('Min stock cannot be greater')) {
        setFieldErrors(prev => ({ ...prev, minStock: translateError(msg) }));
        setActiveSection('stock');
      } else if (msg.includes('Color hex must be')) {
        setFieldErrors(prev => ({ ...prev, colorHex: translateError(msg) }));
        setActiveSection('appearance');
      } else if (msg.includes('Name is required')) {
        setFieldErrors(prev => ({ ...prev, name: translateError(msg) }));
        setActiveSection('basic');
      } else {
        toast.error(translateError(msg));
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVariantRequest }) =>
      variantsService.updateVariant(id, data),
    onSuccess: () => {
      invalidateQueries();
      toast.success('Variante atualizada com sucesso!');
      onOpenChange(false);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('SKU already exists')) {
        setFieldErrors(prev => ({ ...prev, sku: translateError(msg) }));
        setActiveSection('basic');
      } else if (msg.includes('Price cannot be negative')) {
        setFieldErrors(prev => ({ ...prev, definedSalePrice: translateError(msg) }));
        setActiveSection('pricing');
      } else if (msg.includes('Min stock cannot be greater')) {
        setFieldErrors(prev => ({ ...prev, minStock: translateError(msg) }));
        setActiveSection('stock');
      } else if (msg.includes('Color hex must be')) {
        setFieldErrors(prev => ({ ...prev, colorHex: translateError(msg) }));
        setActiveSection('appearance');
      } else if (msg.includes('Name is required')) {
        setFieldErrors(prev => ({ ...prev, name: translateError(msg) }));
        setActiveSection('basic');
      } else {
        toast.error(translateError(msg));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => variantsService.deleteVariant(id),
    onSuccess: () => {
      invalidateQueries();
      toast.success('Variante excluída com sucesso!');
      onOpenChange(false);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(translateError(msg));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const sections: Record<string, boolean> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
      sections.basic = true;
    }

    setFieldErrors(errors);
    setSectionErrors(sections);

    if (Object.keys(errors).length > 0) {
      toast.error('Preencha os campos obrigatórios');
      const firstErrorSection = Object.keys(sections)[0] as SectionId;
      if (firstErrorSection) setActiveSection(firstErrorSection);
      return false;
    }
    return true;
  }, [formData]);

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
      // Clear section error for basic section fields
      if (key === 'name' || key === 'sku' || key === 'reference') {
        setSectionErrors(prev => {
          if (!prev.basic) return prev;
          const next = { ...prev };
          delete next.basic;
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

  const handleDeleteClick = useCallback(() => {
    if (itemCount > 0) {
      toast.error('Não é possível excluir uma variante com itens lançados');
      return;
    }
    setShowDeletePin(true);
  }, [itemCount]);

  const handleDeleteConfirm = useCallback(() => {
    if (!variant) return;
    deleteMutation.mutate(variant.id);
  }, [variant, deleteMutation]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(() => {
    if (!product?.id) return;
    if (!validate()) return;

    const salePrice =
      formData.definedSalePrice > 0
        ? formData.definedSalePrice
        : calculatedSalePrice || 0;

    const cleanData = {
      name: formData.name.trim(),
      sku: formData.sku.trim() || undefined,
      reference: formData.reference.trim() || undefined,
      colorHex: formData.colorHex.trim() || undefined,
      colorPantone: formData.colorPantone.trim() || undefined,
      secondaryColorHex: formData.secondaryColorHex.trim() || undefined,
      secondaryColorPantone: formData.secondaryColorPantone.trim() || undefined,
      pattern:
        formData.pattern && formData.pattern !== 'none'
          ? (formData.pattern as Pattern)
          : undefined,
      outOfLine: formData.outOfLine,
      isActive: formData.isActive,
      price: salePrice,
      costPrice: formData.informedCostPrice || undefined,
      profitMargin: formData.profitMarginPercent || undefined,
      minStock: formData.minStock || undefined,
      maxStock: formData.maxStock || undefined,
      reorderPoint: formData.reorderPoint || undefined,
      reorderQuantity: formData.reorderQuantity || undefined,
      attributes: Object.fromEntries(
        Object.entries(formData.attributes).map(([key, value]) => {
          // Convert string-typed numeric attributes back to numbers for the API
          const attrConfig = variantAttributes[key];
          if (attrConfig?.type === 'number' && typeof value === 'string' && value !== '') {
            const num = parseFloat(value.replace(',', '.'));
            return [key, isNaN(num) ? value : num];
          }
          return [key, value];
        })
      ),
    };

    if (isEditMode && variant) {
      updateMutation.mutate({ id: variant.id, data: cleanData });
    } else {
      createMutation.mutate({ ...cleanData, productId: product.id });
    }
  }, [
    product,
    variant,
    formData,
    isEditMode,
    calculatedSalePrice,
    validate,
    createMutation,
    updateMutation,
    variantAttributes,
  ]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!product) return null;

  return (
    <>
    <NavigationWizardDialog
      open={open}
      onOpenChange={handleClose}
      title={isEditMode ? 'Editar Variante' : 'Nova Variante'}
      subtitle={
        isEditMode
          ? `Editando ${variant?.name}`
          : `Adicionar variante para ${product.name}`
      }
      sections={sections}
      activeSection={activeSection}
      onSectionChange={id => setActiveSection(id as SectionId)}
      sectionErrors={sectionErrors}
      isPending={isPending}
      contentClassName="max-w-[calc(100vw-2rem)] sm:max-w-[1000px]"
      footer={
        <div className="flex items-center justify-between w-full">
          {/* Left: Delete (edit mode only) */}
          {isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isPending}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Variante
            </Button>
          )}
          {/* Right: Cancel + Save */}
          <div className={cn('flex items-center gap-2', !isEditMode && 'ml-auto')}>
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? 'Salvando...' : 'Criando...'}
                </>
              ) : isEditMode ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Variante
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      {activeSection === 'basic' && (
        <BasicSection
          formData={formData}
          updateField={updateField}
          isPending={isPending}
          isEditMode={isEditMode}
          fieldErrors={fieldErrors}
        />
      )}
      {activeSection === 'appearance' && (
        <AppearanceSection
          formData={formData}
          updateField={updateField}
          isPending={isPending}
        />
      )}
      {activeSection === 'pricing' && (
        <PricingSection
          formData={formData}
          updateField={updateField}
          calculatedCostPrice={calculatedCostPrice}
          calculatedSalePrice={calculatedSalePrice}
          calculatedProfitMargin={calculatedProfitMargin}
          isPending={isPending}
        />
      )}
      {activeSection === 'stock' && (
        <StockSection
          formData={formData}
          updateField={updateField}
          isPending={isPending}
        />
      )}
      {activeSection === 'attributes' && (
        <AttributesSection
          formData={formData}
          variantAttributes={variantAttributes}
          hasAttributes={hasAttributes}
          updateAttribute={updateAttribute}
          isPending={isPending}
        />
      )}
    </NavigationWizardDialog>

    <VerifyActionPinModal
      isOpen={showDeletePin}
      onClose={() => setShowDeletePin(false)}
      onSuccess={handleDeleteConfirm}
      title="Confirmar Exclusão"
      description={`Digite seu PIN de ação para excluir a variante "${variant?.name}".`}
    />
    </>
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
// Basic Section
// ---------------------------------------------------------------------------

interface BasicSectionProps extends SectionProps {
  isEditMode: boolean;
  fieldErrors: Record<string, string>;
}

function BasicSection({
  formData,
  updateField,
  isPending,
  isEditMode,
  fieldErrors,
}: BasicSectionProps) {
  return (
    <div className="space-y-4">
      {/* Nome + SKU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="vfm-name">
            Nome da Variante <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="vfm-name"
              placeholder="Ex: Azul P, 100ml, etc."
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              autoFocus={!isEditMode}
              disabled={isPending}
              aria-invalid={!!fieldErrors.name}
              className={cn(fieldErrors.name && 'border-rose-500')}
            />
            {fieldErrors.name && (
              <FormErrorIcon message={fieldErrors.name} />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vfm-sku">SKU</Label>
          <div className="relative">
            <Input
              id="vfm-sku"
              placeholder="Código SKU"
              value={formData.sku}
              onChange={e => updateField('sku', e.target.value)}
              maxLength={64}
              disabled={isPending}
              aria-invalid={!!fieldErrors.sku}
              className={cn(fieldErrors.sku && 'border-rose-500')}
            />
            {fieldErrors.sku && (
              <FormErrorIcon message={fieldErrors.sku} />
            )}
          </div>
        </div>
      </div>

      {/* Referência */}
      <div className="space-y-1.5">
        <Label htmlFor="vfm-reference">Referência</Label>
        <Input
          id="vfm-reference"
          placeholder="Código de referência do fornecedor/fabricante"
          value={formData.reference}
          onChange={e => updateField('reference', e.target.value)}
          maxLength={128}
          disabled={isPending}
        />
      </div>

      {/* Switches: Fora de Linha + Ativo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="space-y-0.5">
            <Label htmlFor="vfm-outOfLine" className="text-sm font-medium">
              Fora de Linha
            </Label>
            <p className="text-xs text-muted-foreground">
              Não disponível para novos pedidos
            </p>
          </div>
          <Switch
            id="vfm-outOfLine"
            checked={formData.outOfLine}
            onCheckedChange={checked => updateField('outOfLine', checked)}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="space-y-0.5">
            <Label htmlFor="vfm-isActive" className="text-sm font-medium">
              Ativo
            </Label>
            <p className="text-xs text-muted-foreground">
              Disponível para venda
            </p>
          </div>
          <Switch
            id="vfm-isActive"
            checked={formData.isActive}
            onCheckedChange={checked => updateField('isActive', checked)}
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Appearance Section (NEW)
// ---------------------------------------------------------------------------

function AppearanceSection({ formData, updateField, isPending }: SectionProps) {
  const pattern = formData.pattern || '';
  const isNoPattern = !pattern || pattern === 'none';

  // Colors disabled only when no pattern selected
  const colorsDisabled = isPending || isNoPattern;

  return (
    <div className="space-y-6">
      {/* Padrão — first, because it controls color availability */}
      <div className="space-y-1.5">
        <Label>Padrão</Label>
        <Select
          value={formData.pattern || 'none'}
          onValueChange={value =>
            updateField('pattern', value === 'none' ? '' : value)
          }
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um padrão..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {Object.entries(PATTERN_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isNoPattern && (
          <p className="text-xs text-muted-foreground">
            Selecione um padrão para definir as cores
          </p>
        )}
      </div>

      {/* Preview */}
      <PatternPreview
        pattern={pattern}
        primaryColor={formData.colorHex}
        secondaryColor={formData.secondaryColorHex}
      />

      {/* Cor Primária */}
      <div className={cn('space-y-1.5', colorsDisabled && 'opacity-50')}>
        <Label>Cor Primária</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.colorHex || '#000000'}
              onChange={e => updateField('colorHex', e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
              disabled={colorsDisabled}
            />
            <Input
              value={formData.colorHex}
              onChange={e => updateField('colorHex', e.target.value)}
              placeholder="#000000"
              maxLength={7}
              className="flex-1"
              disabled={colorsDisabled}
            />
            {formData.colorHex && !colorsDisabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => updateField('colorHex', '')}
              >
                Limpar
              </Button>
            )}
          </div>
          <Input
            value={formData.colorPantone}
            onChange={e => updateField('colorPantone', e.target.value)}
            placeholder="Ex: PANTONE 19-4052"
            maxLength={32}
            disabled={colorsDisabled}
          />
        </div>
      </div>

      {/* Cor Secundária */}
      <div className={cn('space-y-1.5', colorsDisabled && 'opacity-50')}>
        <div className="flex items-center gap-2">
          <Label>Cor Secundária</Label>
          {pattern === 'SOLID' && (
            <span className="text-[10px] text-muted-foreground">
              (com segunda cor, exibe diagonal metade/metade)
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.secondaryColorHex || '#000000'}
              onChange={e => updateField('secondaryColorHex', e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
              disabled={colorsDisabled}
            />
            <Input
              value={formData.secondaryColorHex}
              onChange={e => updateField('secondaryColorHex', e.target.value)}
              placeholder="#000000"
              maxLength={7}
              className="flex-1"
              disabled={colorsDisabled}
            />
            {formData.secondaryColorHex && !colorsDisabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => updateField('secondaryColorHex', '')}
              >
                Limpar
              </Button>
            )}
          </div>
          <Input
            value={formData.secondaryColorPantone}
            onChange={e => updateField('secondaryColorPantone', e.target.value)}
            placeholder="Ex: PANTONE 19-4052"
            maxLength={32}
            disabled={colorsDisabled}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pattern Preview
// ---------------------------------------------------------------------------

interface PatternPreviewProps {
  pattern: string;
  primaryColor: string;
  secondaryColor: string;
}

function PatternPreview({
  pattern,
  primaryColor,
  secondaryColor,
}: PatternPreviewProps) {
  const primary = primaryColor || '#cbd5e1'; // slate-300 fallback
  const hasSecondary = !!secondaryColor;
  const secondary = secondaryColor || '#94a3b8'; // slate-400 fallback
  const isNoPattern = !pattern || pattern === 'none';
  const patternLabel =
    PATTERN_LABELS[pattern as keyof typeof PATTERN_LABELS] || '';

  if (isNoPattern) {
    return (
      <div className="flex items-center justify-center h-16 rounded-xl border border-dashed border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">
          Selecione um padrão para visualizar
        </p>
      </div>
    );
  }

  const bgStyle = getPatternBackground(
    pattern,
    primary,
    secondary,
    hasSecondary
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Pré-visualização</Label>
        <span className="text-[10px] text-muted-foreground">
          {patternLabel}
        </span>
      </div>
      <div
        className="h-16 rounded-xl overflow-hidden transition-all duration-300"
        style={{
          ...bgStyle,
          boxShadow: `inset 0 0 0 1px ${primary}40, 0 0 0 1px ${primary}20`,
        }}
      />
    </div>
  );
}

function getPatternBackground(
  pattern: string,
  primary: string,
  secondary: string,
  hasSecondary: boolean
): React.CSSProperties {
  switch (pattern) {
    case 'SOLID':
      // With secondary color: diagonal half/half split
      if (hasSecondary) {
        return {
          background: `linear-gradient(135deg, ${primary} 50%, ${secondary} 50%)`,
        };
      }
      return { background: primary };

    case 'STRIPED':
      return {
        background: `repeating-linear-gradient(
          45deg,
          ${primary},
          ${primary} 8px,
          ${secondary} 8px,
          ${secondary} 16px
        )`,
      };

    case 'PLAID':
      return {
        background: `
          repeating-linear-gradient(
            0deg,
            ${secondary}00 0px,
            ${secondary}00 10px,
            ${secondary}BB 10px,
            ${secondary}BB 14px,
            ${secondary}00 14px,
            ${secondary}00 24px
          ),
          repeating-linear-gradient(
            90deg,
            ${secondary}00 0px,
            ${secondary}00 10px,
            ${secondary}BB 10px,
            ${secondary}BB 14px,
            ${secondary}00 14px,
            ${secondary}00 24px
          ),
          ${primary}`,
      };

    case 'PRINTED':
      return {
        background: `
          radial-gradient(circle 3px at 20% 30%, ${secondary} 99%, transparent),
          radial-gradient(circle 2.5px at 50% 15%, ${secondary} 99%, transparent),
          radial-gradient(circle 3.5px at 80% 40%, ${secondary} 99%, transparent),
          radial-gradient(circle 2px at 35% 70%, ${secondary} 99%, transparent),
          radial-gradient(circle 3px at 65% 80%, ${secondary} 99%, transparent),
          radial-gradient(circle 2px at 10% 55%, ${secondary} 99%, transparent),
          radial-gradient(circle 2.5px at 90% 70%, ${secondary} 99%, transparent),
          radial-gradient(circle 2px at 45% 50%, ${secondary} 99%, transparent),
          ${primary}`,
      };

    case 'GRADIENT':
      return {
        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
      };

    case 'JACQUARD':
      return {
        background: `
          repeating-conic-gradient(
            ${primary} 0% 25%,
            ${secondary} 0% 50%
          ) 0 0 / 12px 12px`,
      };

    default:
      return { background: primary };
  }
}

// ---------------------------------------------------------------------------
// Pricing Section
// ---------------------------------------------------------------------------

interface PricingSectionProps extends SectionProps {
  calculatedCostPrice: number;
  calculatedSalePrice: number;
  calculatedProfitMargin: number;
}

function PricingSection({
  formData,
  updateField,
  calculatedCostPrice,
  calculatedSalePrice,
  calculatedProfitMargin,
  isPending,
}: PricingSectionProps) {
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Row 1: Custo Calculado, Custo Informado, Margem */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="vfm-calculatedCost">Custo Calculado</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Média do custo dos itens</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>R$</InputGroupText>
              </InputGroupAddon>
              <MoneyInput
                id="vfm-calculatedCost"
                value={calculatedCostPrice}
                disabled
                className="bg-muted"
              />
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vfm-informedCost">Custo Informado</Label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>R$</InputGroupText>
              </InputGroupAddon>
              <MoneyInput
                id="vfm-informedCost"
                value={formData.informedCostPrice}
                onChange={value => updateField('informedCostPrice', value)}
                placeholder="0,00"
                disabled={isPending}
              />
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vfm-profitMargin">Margem de Lucro (%)</Label>
            <Input
              id="vfm-profitMargin"
              type="number"
              step="0.1"
              min="0"
              value={formData.profitMarginPercent || ''}
              onChange={e =>
                updateField(
                  'profitMarginPercent',
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="0.0"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Row 2: Preço Calculado, Preço Definido, Margem Calculada */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="vfm-calculatedSale">Venda Calculado</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Baseado na margem de lucro</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>R$</InputGroupText>
              </InputGroupAddon>
              <MoneyInput
                id="vfm-calculatedSale"
                value={calculatedSalePrice}
                disabled
                className="bg-muted"
              />
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vfm-definedSale">Preço de Venda</Label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>R$</InputGroupText>
              </InputGroupAddon>
              <MoneyInput
                id="vfm-definedSale"
                value={formData.definedSalePrice}
                onChange={value => updateField('definedSalePrice', value)}
                placeholder="0,00"
                disabled={isPending}
              />
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="vfm-calculatedMargin">Margem Calculada (%)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Baseado no preço definido</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="vfm-calculatedMargin"
              type="number"
              step="0.01"
              value={calculatedProfitMargin.toFixed(2)}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Stock Section
// ---------------------------------------------------------------------------

function StockSection({ formData, updateField, isPending }: SectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="vfm-minStock">Estoque Mínimo</Label>
          <Input
            id="vfm-minStock"
            type="number"
            min="0"
            value={formData.minStock || ''}
            onChange={e =>
              updateField('minStock', parseInt(e.target.value) || 0)
            }
            placeholder="0"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vfm-maxStock">Estoque Máximo</Label>
          <Input
            id="vfm-maxStock"
            type="number"
            min="0"
            value={formData.maxStock || ''}
            onChange={e =>
              updateField('maxStock', parseInt(e.target.value) || 0)
            }
            placeholder="0"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="vfm-reorderPoint">Ponto de Reposição</Label>
          <Input
            id="vfm-reorderPoint"
            type="number"
            min="0"
            value={formData.reorderPoint || ''}
            onChange={e =>
              updateField('reorderPoint', parseInt(e.target.value) || 0)
            }
            placeholder="0"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vfm-reorderQty">Quantidade de Reposição</Label>
          <Input
            id="vfm-reorderQty"
            type="number"
            min="0"
            value={formData.reorderQuantity || ''}
            onChange={e =>
              updateField('reorderQuantity', parseInt(e.target.value) || 0)
            }
            placeholder="0"
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attributes Section
// ---------------------------------------------------------------------------

interface AttributesSectionProps {
  formData: FormData;
  variantAttributes: Record<string, TemplateAttribute>;
  hasAttributes: boolean;
  updateAttribute: (key: string, value: unknown) => void;
  isPending: boolean;
}

function AttributesSection({
  formData,
  variantAttributes,
  hasAttributes,
  updateAttribute,
  isPending,
}: AttributesSectionProps) {
  if (!hasAttributes) {
    return (
      <div className="p-8 text-center border border-dashed rounded-lg">
        <SlidersHorizontal className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Nenhum atributo personalizado definido no template
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(variantAttributes).map(
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
                      <Label htmlFor={`vfm-attr-${key}`} className="text-sm">
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
                      id={`vfm-attr-${key}`}
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
                      <Label htmlFor={`vfm-attr-${key}`} className="text-sm">
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
                        <SelectTrigger id={`vfm-attr-${key}`}>
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
                        id={`vfm-attr-${key}`}
                        type="text"
                        inputMode="decimal"
                        value={currentValue}
                        onChange={e =>
                          updateAttribute(key, e.target.value.replace(/[^0-9.,]/g, ''))
                        }
                        placeholder={config.placeholder || '0'}
                        disabled={isPending}
                      />
                    ) : config.type === 'date' ? (
                      <Input
                        id={`vfm-attr-${key}`}
                        type="date"
                        value={currentValue}
                        onChange={e => updateAttribute(key, e.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <Input
                        id={`vfm-attr-${key}`}
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
