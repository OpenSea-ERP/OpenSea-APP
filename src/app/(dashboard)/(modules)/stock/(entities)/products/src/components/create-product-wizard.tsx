/**
 * OpenSea OS - Create Product Wizard
 * Wizard de 3 passos para criação de produtos usando StepWizardDialog
 */

'use client';

import { Button } from '@/components/ui/button';
import { CategoryCombobox } from '@/components/ui/category-combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Switch } from '@/components/ui/switch';
import { usePermissions } from '@/hooks/use-permissions';
import { logger } from '@/lib/logger';
import {
  categoriesService,
  manufacturersService,
  templatesService,
} from '@/services/stock';
import { STOCK_PERMISSIONS } from '@/app/(dashboard)/(modules)/stock/_shared/constants/stock-permissions';
import type {
  Category,
  CreateProductRequest,
  Manufacturer,
  Template,
  TemplateAttribute,
} from '@/types/stock';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  Factory,
  LayoutTemplate,
  Loader2,
  Package,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface CreateProductWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProductRequest) => Promise<void>;
  initialTemplateId?: string;
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function DependencyEmptyState({
  icon: Icon,
  title,
  description,
  createUrl,
  createLabel,
}: {
  icon: typeof Factory;
  title: string;
  description: string;
  createUrl: string;
  createLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 mb-4">
        <AlertCircle className="h-7 w-7 text-amber-500" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        {description}
      </p>
      <Button asChild size="sm">
        <Link href={createUrl}>
          <Plus className="h-4 w-4 mr-1" />
          {createLabel}
        </Link>
      </Button>
    </div>
  );
}

// =============================================================================
// STEP 1: SELECT TEMPLATE
// =============================================================================

function StepSelectTemplate({
  templates,
  isLoading,
  selectedId,
  onSelect,
}: {
  templates: Template[];
  isLoading: boolean;
  selectedId: string;
  onSelect: (template: Template) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [templates, search]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <DependencyEmptyState
        icon={LayoutTemplate}
        title="Nenhum template cadastrado"
        description="Para criar um produto, primeiro cadastre um template que define a categoria, unidade de medida e atributos."
        createUrl="/stock/templates?action=create"
        createLabel="Cadastrar Template"
      />
    );
  }

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

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum template encontrado para &ldquo;{search}&rdquo;
          </p>
        ) : (
          filtered.map(template => {
            const isSelected = template.id === selectedId;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all ${
                  isSelected
                    ? 'bg-primary/10 border border-primary/40 ring-1 ring-primary/20'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shrink-0">
                  <LayoutTemplate className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {template.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {template.unitOfMeasure === 'METERS'
                      ? 'Metros'
                      : template.unitOfMeasure === 'KILOGRAMS'
                        ? 'Quilogramas'
                        : 'Unidades'}
                  </p>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-primary shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// =============================================================================
// STEP 2: SELECT MANUFACTURER
// =============================================================================

function StepSelectManufacturer({
  manufacturers,
  isLoading,
  selectedId,
  onSelect,
}: {
  manufacturers: Manufacturer[];
  isLoading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      manufacturers.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase())
      ),
    [manufacturers, search]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (manufacturers.length === 0) {
    return (
      <DependencyEmptyState
        icon={Factory}
        title="Nenhum fabricante cadastrado"
        description="Para criar um produto, primeiro cadastre pelo menos um fabricante."
        createUrl="/stock/manufacturers?action=create"
        createLabel="Cadastrar Fabricante"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar fabricante..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum fabricante encontrado para &ldquo;{search}&rdquo;
          </p>
        ) : (
          filtered.map(manufacturer => {
            const isSelected = manufacturer.id === selectedId;
            return (
              <button
                key={manufacturer.id}
                type="button"
                onClick={() => onSelect(manufacturer.id)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all ${
                  isSelected
                    ? 'bg-primary/10 border border-primary/40 ring-1 ring-primary/20'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shrink-0">
                  <Factory className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {manufacturer.name}
                  </p>
                  {manufacturer.country && (
                    <p className="text-xs text-muted-foreground truncate">
                      {manufacturer.country}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-primary shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// =============================================================================
// STEP 3: PRODUCT DATA
// =============================================================================

function StepProductData({
  selectedTemplate,
  name,
  categoryId,
  attributes,
  categories,
  loadingCategories,
  onNameChange,
  onCategoryChange,
  onAttributeChange,
  isSubmitting,
}: {
  selectedTemplate: Template | null;
  name: string;
  categoryId: string;
  attributes: Record<string, unknown>;
  categories: Category[];
  loadingCategories: boolean;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAttributeChange: (key: string, value: unknown) => void;
  isSubmitting: boolean;
}) {
  const requiredAttrs = selectedTemplate?.productAttributes
    ? Object.entries(selectedTemplate.productAttributes)
        .filter(([, config]) => (config as TemplateAttribute)?.required)
        .sort((a, b) => {
          const labelA = (
            (a[1] as TemplateAttribute)?.label || a[0]
          ).toLowerCase();
          const labelB = (
            (b[1] as TemplateAttribute)?.label || b[0]
          ).toLowerCase();
          return labelA.localeCompare(labelB);
        })
    : [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product-name">
          Nome do Produto <span className="text-red-500">*</span>
        </Label>
        <Input
          id="product-name"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Ex: Tecido Azul Royal"
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label>Categoria</Label>
        <CategoryCombobox
          categories={categories}
          value={categoryId}
          onValueChange={onCategoryChange}
          placeholder="Selecione uma categoria..."
          disabled={isSubmitting || loadingCategories}
        />
      </div>

      {requiredAttrs.length > 0 && (
        <div className="space-y-3 pt-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Atributos Obrigatórios
          </Label>
          <div className="space-y-3">
            {requiredAttrs.map(([key, config]) => {
              const cfg = config as TemplateAttribute;
              const baseLabel = cfg?.label || key;
              const displayLabel = cfg?.unitOfMeasure
                ? `${baseLabel} (${cfg.unitOfMeasure})`
                : baseLabel;
              const type: string = cfg?.type || 'text';
              const value = attributes[key] as
                | string
                | boolean
                | number
                | undefined;
              const placeholder =
                cfg?.placeholder ||
                (cfg?.mask ? cfg.mask : `Insira ${baseLabel.toLowerCase()}`);

              if (type === 'boolean' || type === 'sim/nao') {
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Switch
                      id={`attr-${key}`}
                      checked={
                        value === true || value === 'true' || value === 'sim'
                      }
                      onCheckedChange={checked =>
                        onAttributeChange(key, checked)
                      }
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={`attr-${key}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {displayLabel}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                  </div>
                );
              }

              if (type === 'select') {
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`attr-${key}`}>
                      {displayLabel}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select
                      value={String(value ?? '')}
                      onValueChange={val => onAttributeChange(key, val)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id={`attr-${key}`}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cfg?.options?.map((opt: string) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              const mask = cfg?.mask;
              const isNumericMask = mask && /^#+$/.test(mask);
              const inputType =
                type === 'number' || isNumericMask
                  ? 'text'
                  : type === 'date'
                    ? 'date'
                    : 'text';

              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`attr-${key}`}>
                    {displayLabel}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id={`attr-${key}`}
                    type={inputType}
                    inputMode={
                      isNumericMask || type === 'number' ? 'numeric' : undefined
                    }
                    maxLength={isNumericMask && mask ? mask.length : undefined}
                    value={String(value ?? '')}
                    onChange={e => {
                      let val = e.target.value;
                      if (isNumericMask) {
                        val = val.replace(/\D/g, '');
                        if (mask && val.length > mask.length) {
                          val = val.slice(0, mask.length);
                        }
                      }
                      onAttributeChange(
                        key,
                        type === 'number' ? parseFloat(val) || val : val
                      );
                    }}
                    placeholder={placeholder}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN WIZARD
// =============================================================================

export function CreateProductWizard({
  open,
  onOpenChange,
  onSubmit,
  initialTemplateId,
}: CreateProductWizardProps) {
  const { hasPermission } = usePermissions();
  const canCreateTemplate = hasPermission(STOCK_PERMISSIONS.TEMPLATES.CREATE);
  const canCreateManufacturer = hasPermission(
    STOCK_PERMISSIONS.MANUFACTURERS.CREATE
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [selectedManufacturerId, setSelectedManufacturerId] = useState('');
  const [productName, setProductName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: templatesData, isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesService.listTemplates(),
    enabled: open,
  });
  const templates = Array.isArray(templatesData?.templates)
    ? templatesData.templates
    : Array.isArray(templatesData)
      ? (templatesData as Template[])
      : [];

  const { data: manufacturersData, isLoading: loadingManufacturers } = useQuery(
    {
      queryKey: ['manufacturers'],
      queryFn: () => manufacturersService.listManufacturers(),
      enabled: open,
    }
  );
  const manufacturers = Array.isArray(manufacturersData?.manufacturers)
    ? manufacturersData.manufacturers
    : Array.isArray(manufacturersData)
      ? (manufacturersData as Manufacturer[])
      : [];

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.listCategories(),
    enabled: open,
  });
  const categories = Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];

  // Auto-select initial template
  if (initialTemplateId && !selectedTemplate && templates.length > 0) {
    const found = templates.find(t => t.id === initialTemplateId);
    if (found) {
      setSelectedTemplate(found);
      setCurrentStep(2);
    }
  }

  // Handlers
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setAttributes({});
    setCurrentStep(2);
  };

  const handleAttributeChange = (key: string, value: unknown) => {
    setAttributes(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedTemplate || !selectedManufacturerId || !productName) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        templateId: selectedTemplate.id,
        name: productName,
        manufacturerId: selectedManufacturerId,
        categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
        attributes,
      });

      handleClose();
    } catch (error) {
      logger.error(
        'Error creating product',
        error instanceof Error ? error : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedTemplate(null);
    setSelectedManufacturerId('');
    setProductName('');
    setSelectedCategoryId('');
    setAttributes({});
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleManufacturerSelect = (id: string) => {
    setSelectedManufacturerId(id);
    setCurrentStep(3);
  };

  // Steps
  const steps: WizardStep[] = [
    {
      title: 'Selecione o Template',
      description:
        'O template define a categoria, unidade e atributos do produto.',
      icon: (
        <LayoutTemplate
          className="h-16 w-16 text-purple-400"
          strokeWidth={1.2}
        />
      ),
      content: (
        <StepSelectTemplate
          templates={templates}
          isLoading={loadingTemplates}
          selectedId={selectedTemplate?.id ?? ''}
          onSelect={handleTemplateSelect}
        />
      ),
      isValid: !!selectedTemplate,
      footer: canCreateTemplate ? (
        <Button type="button" asChild>
          <Link href="/stock/templates?action=create">
            <Plus className="h-4 w-4 mr-1" />
            Criar Novo Template
          </Link>
        </Button>
      ) : (
        <></>
      ),
    },
    {
      title: 'Selecione o Fabricante',
      description: 'Informe quem fabrica este produto.',
      icon: <Factory className="h-16 w-16 text-sky-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepSelectManufacturer
          manufacturers={manufacturers}
          isLoading={loadingManufacturers}
          selectedId={selectedManufacturerId}
          onSelect={handleManufacturerSelect}
        />
      ),
      isValid: !!selectedManufacturerId,
      footer: canCreateManufacturer ? (
        <Button type="button" asChild>
          <Link href="/stock/manufacturers?action=create">
            <Plus className="h-4 w-4 mr-1" />
            Criar Novo Fabricante
          </Link>
        </Button>
      ) : (
        <></>
      ),
    },
    {
      title: 'Dados do Produto',
      description: selectedTemplate
        ? `Template: ${selectedTemplate.name}`
        : 'Preencha as informações do produto.',
      icon: (
        <Package className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(2),
      content: (
        <StepProductData
          selectedTemplate={selectedTemplate}
          name={productName}
          categoryId={selectedCategoryId}
          attributes={attributes}
          categories={categories}
          loadingCategories={loadingCategories}
          onNameChange={setProductName}
          onCategoryChange={setSelectedCategoryId}
          onAttributeChange={handleAttributeChange}
          isSubmitting={isSubmitting}
        />
      ),
      isValid: !!productName.trim(),
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !productName.trim()}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Produto
        </Button>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
