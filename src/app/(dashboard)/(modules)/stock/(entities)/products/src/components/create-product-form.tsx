/**
 * OpenSea OS - Create Product Form
 * Formulário de 2 passos para criação rápida de produtos
 */

'use client';

import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { manufacturersService, templatesService } from '@/services/stock';
import type {
  CreateProductRequest,
  Manufacturer,
  Template,
  TemplateAttribute,
} from '@/types/stock';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  Check,
  Factory,
  LayoutTemplate,
  Loader2,
  Search,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface CreateProductFormProps {
  /** Callback ao submeter o formulário */
  onSubmit: (data: CreateProductRequest) => Promise<void>;
  /** Callback ao cancelar */
  onCancel: () => void;
  /** Template pré-selecionado (opcional) */
  initialTemplateId?: string;
  /** Está submetendo */
  isSubmitting?: boolean;
}

interface FormData {
  templateId: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK';
  supplierId?: string;
  manufacturerId?: string;
  attributes?: Record<string, unknown>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CreateProductForm({
  onSubmit,
  onCancel,
  initialTemplateId,
  isSubmitting = false,
}: CreateProductFormProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [step, setStep] = useState<'select-template' | 'fill-data'>(
    initialTemplateId ? 'fill-data' : 'select-template'
  );
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<FormData>({
    templateId: initialTemplateId || '',
    name: '',
    description: '',
    status: 'ACTIVE',
    supplierId: '',
    manufacturerId: '',
    attributes: {},
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ============================================================================
  // QUERIES
  // ============================================================================

  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<
    Template[]
  >({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await templatesService.listTemplates();
      return response?.templates ?? [];
    },
  });

  const { data: manufacturers = [], isLoading: isLoadingManufacturers } =
    useQuery<Manufacturer[]>({
      queryKey: ['manufacturers'],
      queryFn: async () => {
        const response = await manufacturersService.listManufacturers();
        return response?.manufacturers ?? [];
      },
    });

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const filteredTemplates = useMemo(
    () =>
      templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [templates, searchQuery]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      templateId: template.id,
    }));
    setStep('fill-data');
  };

  const handleBackToTemplates = () => {
    setStep('select-template');
    setSearchQuery('');
  };

  const handleFormChange = (
    field: keyof FormData,
    value: string | Record<string, unknown>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.templateId || !formData.name) {
      return;
    }

    try {
      await onSubmit({
        templateId: formData.templateId,
        name: formData.name,
        description: formData.description || undefined,
        supplierId: formData.supplierId || undefined,
        manufacturerId: formData.manufacturerId || undefined,
        attributes: formData.attributes,
      });

      // Mostrar sucesso
      setSubmitSuccess(true);

      // Resetar formulário mas manter template
      setTimeout(() => {
        setFormData({
          templateId: formData.templateId,
          name: '',
          description: '',
          status: 'ACTIVE',
          supplierId: '',
          manufacturerId: '',
          attributes: {},
        });
        setSubmitSuccess(false);
      }, 1000);
    } catch (error) {
      logger.error(
        'Error creating product',
        error instanceof Error ? error : undefined
      );
    }
  };

  const handleCancel = () => {
    setFormData({
      templateId: '',
      name: '',
      description: '',
      status: 'ACTIVE',
      supplierId: '',
      manufacturerId: '',
      attributes: {},
    });
    setSelectedTemplate(null);
    setStep('select-template');
    setSubmitSuccess(false);
    onCancel();
  };

  // ============================================================================
  // RENDER - STEP 1: SELECT TEMPLATE
  // ============================================================================

  if (step === 'select-template') {
    return (
      <div className="space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold',
              'bg-sky-600 text-primary-foreground'
            )}
          >
            1
          </div>
          <div className="h-0.5 w-12 bg-slate-600" />
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold',
              'bg-slate-600 text-muted-foreground'
            )}
          >
            2
          </div>
        </div>

        {/* Title and Instructions */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Seleção de Template do Novo Produto
          </h2>
          <p className="text-sm text-muted-foreground">
            Primeiro, selecione o template que será usado como base para o
            produto. O template define a categoria, unidade de medida e
            atributos do produto.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 text-muted-foreground" />
          <Input
            placeholder="Buscar template..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Templates List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {isLoadingTemplates ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : filteredTemplates.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Nenhum template encontrado'
                  : 'Nenhum template disponível'}
              </p>
            </Card>
          ) : (
            filteredTemplates.map(template => (
              <div
                key={template.id}
                className={cn(
                  'p-3 transition-all bg-linear-to-br from-slate-800/80 to-slate-950 rounded-2xl hover:shadow-md hover:border-primary',
                  'flex items-center gap-3'
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-pink-600 shrink-0">
                  <LayoutTemplate className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {template.unitOfMeasure === 'METERS'
                      ? 'Metros'
                      : template.unitOfMeasure === 'KILOGRAMS'
                        ? 'Kg'
                        : 'Unidades'}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleTemplateSelect(template)}
                  className="shrink-0 text-sm"
                >
                  Selecionar
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - STEP 2: FILL DATA
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold',
            'bg-slate-600 text-primary-foreground'
          )}
        >
          1
        </div>
        <div className="h-0.5 w-12 bg-slate-600" />
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold',
            'bg-sky-600 text-muted-foreground'
          )}
        >
          2
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Nome (obrigatório) */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nome do Produto <span className="text-red-600 text-sm">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => handleFormChange('name', e.target.value)}
            placeholder="Ex: Tecido Azul Royal"
            required
            autoFocus
            disabled={isSubmitting}
          />
        </div>

        {/* Fabricante (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="manufacturerId">Fabricante</Label>
          <Select
            value={formData.manufacturerId || ''}
            onValueChange={value =>
              handleFormChange('manufacturerId', value === 'none' ? '' : value)
            }
            disabled={isSubmitting || isLoadingManufacturers}
          >
            <SelectTrigger id="manufacturerId" className="w-full">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Selecione um fabricante (opcional)" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">Nenhum fabricante</span>
              </SelectItem>
              {manufacturers.map(manufacturer => (
                <SelectItem key={manufacturer.id} value={manufacturer.id}>
                  {manufacturer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Atributos Exclusivos */}
      {selectedTemplate?.productAttributes &&
        Object.keys(selectedTemplate.productAttributes).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Atributos Exclusivos</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(selectedTemplate.productAttributes)
                .sort((a, b) => {
                  const labelA = (
                    (a[1] as TemplateAttribute)?.label || a[0]
                  ).toLowerCase();
                  const labelB = (
                    (b[1] as TemplateAttribute)?.label || b[0]
                  ).toLowerCase();
                  return labelA.localeCompare(labelB);
                })
                .map(([key, config]) => {
                  const cfg = config as TemplateAttribute;
                  const label = cfg?.label || key;
                  const type: string = cfg?.type || 'text';
                  const rawValue = formData.attributes?.[key];
                  const value = rawValue as
                    | string
                    | boolean
                    | number
                    | undefined;

                  if (type === 'boolean' || type === 'sim/nao') {
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Switch
                          id={`attr-${key}`}
                          checked={
                            value === true ||
                            value === 'true' ||
                            value === 'sim' ||
                            value === '1'
                          }
                          onCheckedChange={checked => {
                            setFormData(prev => ({
                              ...prev,
                              attributes: {
                                ...prev.attributes,
                                [key]: checked,
                              },
                            }));
                          }}
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

                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`attr-${key}`}>
                        {label}
                        {cfg?.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>

                      {type === 'select' ? (
                        <Select
                          value={String(value ?? '')}
                          onValueChange={val => {
                            setFormData(prev => ({
                              ...prev,
                              attributes: {
                                ...prev.attributes,
                                [key]: val,
                              },
                            }));
                          }}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id={`attr-${key}`}>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {cfg?.options?.map((option: string) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : type === 'number' ? (
                        <Input
                          id={`attr-${key}`}
                          type="number"
                          value={String(value ?? '')}
                          onChange={e => {
                            setFormData(prev => ({
                              ...prev,
                              attributes: {
                                ...prev.attributes,
                                [key]: parseFloat(e.target.value) || 0,
                              },
                            }));
                          }}
                          placeholder={cfg?.placeholder || ''}
                          required={cfg?.required}
                          disabled={isSubmitting}
                        />
                      ) : type === 'date' ? (
                        <Input
                          id={`attr-${key}`}
                          type="date"
                          value={String(value ?? '')}
                          onChange={e => {
                            setFormData(prev => ({
                              ...prev,
                              attributes: {
                                ...prev.attributes,
                                [key]: e.target.value,
                              },
                            }));
                          }}
                          required={cfg?.required}
                          disabled={isSubmitting}
                        />
                      ) : (
                        <Input
                          id={`attr-${key}`}
                          type="text"
                          value={String(value ?? '')}
                          onChange={e => {
                            setFormData(prev => ({
                              ...prev,
                              attributes: {
                                ...prev.attributes,
                                [key]: e.target.value,
                              },
                            }));
                          }}
                          placeholder={cfg?.placeholder || ''}
                          required={cfg?.required}
                          disabled={isSubmitting}
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      {/* Selected Template Card + Trocar Template Button */}
      <div className="flex items-center gap-3 p-3 transition-all bg-linear-to-br from-slate-800/80 to-slate-950 rounded-2xl hover:shadow-md hover:border-primary">
        <div className="flex-1  flex items-center gap-4 bg-muted/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-pink-600 shrink-0">
            <LayoutTemplate className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">
                  {selectedTemplate?.name}
                </h3>
                <p className="text-sm text-slate-600 truncate">
                  {selectedTemplate?.unitOfMeasure === 'METERS'
                    ? 'Metros'
                    : selectedTemplate?.unitOfMeasure === 'KILOGRAMS'
                      ? 'Kg'
                      : 'Unidades'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleBackToTemplates}
          disabled={isSubmitting}
          className="shrink-0 text-sm bg-slate-600"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Trocar Template
        </Button>
      </div>

      {/* Submit Success Message */}
      {submitSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Produto criado com sucesso! Você pode adicionar outro.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Fechar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.name}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Produto
        </Button>
      </div>
    </form>
  );
}

export default CreateProductForm;
