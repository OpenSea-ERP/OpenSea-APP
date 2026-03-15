/**
 * OpenSea OS - Create Product Wizard
 * Wizard de 3 passos para criação de produtos usando StepWizardDialog
 */

'use client';

import { Button } from '@/components/ui/button';
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
import { logger } from '@/lib/logger';
import { manufacturersService, templatesService } from '@/services/stock';
import type {
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

      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
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

      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
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
  description,
  attributes,
  onNameChange,
  onDescriptionChange,
  onAttributeChange,
  isSubmitting,
}: {
  selectedTemplate: Template | null;
  name: string;
  description: string;
  attributes: Record<string, unknown>;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAttributeChange: (key: string, value: unknown) => void;
  isSubmitting: boolean;
}) {
  const templateAttrs = selectedTemplate?.productAttributes
    ? Object.entries(selectedTemplate.productAttributes).sort((a, b) => {
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
        <Label htmlFor="product-description">Descrição</Label>
        <Input
          id="product-description"
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          placeholder="Descrição opcional do produto"
          disabled={isSubmitting}
        />
      </div>

      {templateAttrs.length > 0 && (
        <div className="space-y-3 pt-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Atributos do Template
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {templateAttrs.map(([key, config]) => {
              const cfg = config as TemplateAttribute;
              const label = cfg?.label || key;
              const type: string = cfg?.type || 'text';
              const value = attributes[key] as
                | string
                | boolean
                | number
                | undefined;

              if (type === 'boolean' || type === 'sim/nao') {
                return (
                  <div key={key} className="flex items-center gap-2 col-span-2">
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
                      {label}
                      {cfg?.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                  </div>
                );
              }

              if (type === 'select') {
                return (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`attr-${key}`} className="text-xs">
                      {label}
                      {cfg?.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Select
                      value={String(value ?? '')}
                      onValueChange={val => onAttributeChange(key, val)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id={`attr-${key}`} className="h-9">
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

              return (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`attr-${key}`} className="text-xs">
                    {label}
                    {cfg?.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <Input
                    id={`attr-${key}`}
                    type={
                      type === 'number'
                        ? 'number'
                        : type === 'date'
                          ? 'date'
                          : 'text'
                    }
                    value={String(value ?? '')}
                    onChange={e =>
                      onAttributeChange(
                        key,
                        type === 'number'
                          ? parseFloat(e.target.value) || 0
                          : e.target.value
                      )
                    }
                    placeholder={cfg?.placeholder || ''}
                    required={cfg?.required}
                    disabled={isSubmitting}
                    className="h-9"
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
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [selectedManufacturerId, setSelectedManufacturerId] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: templates = [], isLoading: loadingTemplates } = useQuery<
    Template[]
  >({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await templatesService.listTemplates();
      return response?.templates ?? [];
    },
    enabled: open,
  });

  const { data: manufacturers = [], isLoading: loadingManufacturers } =
    useQuery<Manufacturer[]>({
      queryKey: ['manufacturers'],
      queryFn: async () => {
        const response = await manufacturersService.listManufacturers();
        return response?.manufacturers ?? [];
      },
      enabled: open,
    });

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
        description: productDescription || undefined,
        manufacturerId: selectedManufacturerId,
        attributes,
      });

      // Reset for next product
      setProductName('');
      setProductDescription('');
      setAttributes({});
      setCurrentStep(3); // Stay on step 3 for quick consecutive creation
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
    setProductDescription('');
    setAttributes({});
    setIsSubmitting(false);
    onOpenChange(false);
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
    },
    {
      title: 'Selecione o Fabricante',
      description: 'Informe quem fabrica este produto.',
      icon: <Factory className="h-16 w-16 text-sky-400" strokeWidth={1.2} />,
      content: (
        <StepSelectManufacturer
          manufacturers={manufacturers}
          isLoading={loadingManufacturers}
          selectedId={selectedManufacturerId}
          onSelect={setSelectedManufacturerId}
        />
      ),
      isValid: !!selectedManufacturerId,
    },
    {
      title: 'Dados do Produto',
      description: selectedTemplate
        ? `Template: ${selectedTemplate.name}`
        : 'Preencha as informações do produto.',
      icon: (
        <Package className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
      ),
      content: (
        <StepProductData
          selectedTemplate={selectedTemplate}
          name={productName}
          description={productDescription}
          attributes={attributes}
          onNameChange={setProductName}
          onDescriptionChange={setProductDescription}
          onAttributeChange={handleAttributeChange}
          isSubmitting={isSubmitting}
        />
      ),
      isValid: !!productName.trim(),
      footer: (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(2)}
            disabled={isSubmitting}
          >
            ← Voltar
          </Button>
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
        </>
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
