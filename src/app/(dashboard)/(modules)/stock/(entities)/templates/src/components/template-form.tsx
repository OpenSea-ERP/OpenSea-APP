/**
 * Template Form Component
 * Formulário reutilizável para criação e edição de templates
 * Responsabilidade única: Gerenciar estado e renderização do formulário de templates
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Template, UnitOfMeasure } from '@/types/stock';
import { UNIT_OF_MEASURE_LABELS } from '@/types/stock';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import {
  MdPrint,
  MdPrintDisabled,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

type AttributeType = 'string' | 'number' | 'boolean' | 'date' | 'select';

interface Attribute {
  key: string;
  label: string;
  type: AttributeType;
  required: boolean;
  options?: string[];
  unitOfMeasure?: string;
  enablePrint?: boolean;
  enableView?: boolean;
  mask?: string;
  placeholder?: string;
  description?: string;
  defaultValue?: string;
}

interface AttributeDefinition {
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  unitOfMeasure?: string;
  enablePrint?: boolean;
  enableView?: boolean;
  mask?: string;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
}

interface TemplateFormProps {
  template?: Template;
  onSubmit: (data: {
    name: string;
    iconUrl?: string;
    unitOfMeasure: UnitOfMeasure;
    productAttributes: Record<string, unknown>;
    variantAttributes: Record<string, unknown>;
    itemAttributes: Record<string, unknown>;
    specialModules?: string[];
  }) => void;
}

export interface TemplateFormRef {
  submit: () => void;
  getData: () => {
    iconUrl?: string;
    name: string;
    unitOfMeasure: UnitOfMeasure;
    productAttributes: Record<string, unknown>;
    variantAttributes: Record<string, unknown>;
    itemAttributes: Record<string, unknown>;
    specialModules?: string[];
  };
}

// Gera slug a partir do rótulo
const generateSlug = (label: string): string => {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

export const TemplateForm = forwardRef<TemplateFormRef, TemplateFormProps>(
  function TemplateForm({ template, onSubmit }, ref) {
    const [name, setName] = useState('');
    const [iconUrl, setIconUrl] = useState('');
    const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>('UNITS');
    const [specialModules, setSpecialModules] = useState<string[]>([]);
    const [productAttributes, setProductAttributes] = useState<Attribute[]>([]);
    const [variantAttributes, setVariantAttributes] = useState<Attribute[]>([]);
    const [itemAttributes, setItemAttributes] = useState<Attribute[]>([]);

    // Função para formatar atributos
    const formatAttributes = (
      attributes: Attribute[]
    ): Record<string, unknown> => {
      if (attributes.length === 0) return {};
      return attributes.reduce(
        (acc, attr) => {
          if (attr.key) {
            acc[attr.key] = {
              label: attr.label,
              type: attr.type,
              required: attr.required,
              ...(attr.type === 'select' && attr.options
                ? { options: attr.options }
                : {}),
              ...(attr.unitOfMeasure
                ? { unitOfMeasure: attr.unitOfMeasure }
                : {}),
              ...(attr.enablePrint !== undefined
                ? { enablePrint: attr.enablePrint }
                : {}),
              ...(attr.enableView !== undefined
                ? { enableView: attr.enableView }
                : {}),
              ...(attr.mask ? { mask: attr.mask } : {}),
              ...(attr.placeholder ? { placeholder: attr.placeholder } : {}),
              ...(attr.description ? { description: attr.description } : {}),
              ...(attr.defaultValue ? { defaultValue: attr.defaultValue } : {}),
            };
          }
          return acc;
        },
        {} as Record<string, unknown>
      );
    };

    // Função para obter dados do formulário
    const getData = () => ({
      name: name.trim(),
      iconUrl: iconUrl.trim() || undefined,
      unitOfMeasure,
      productAttributes: formatAttributes(productAttributes),
      variantAttributes: formatAttributes(variantAttributes),
      itemAttributes: formatAttributes(itemAttributes),
      specialModules: specialModules.length > 0 ? specialModules : undefined,
    });

    // Expor métodos para o componente pai
    useImperativeHandle(ref, () => ({
      submit: () => {
        const data = getData();
        onSubmit(data);
      },
      getData,
    }));

    // Valores iniciais baseados no template
    const initialValues = useMemo(() => {
      if (!template) {
        return {
          name: '',
          iconUrl: '',
          unitOfMeasure: 'UNITS' as UnitOfMeasure,
          specialModules: [] as string[],
          productAttributes: [],
          variantAttributes: [],
          itemAttributes: [],
        };
      }

      const convertAttributes = (
        attrs?: Record<string, unknown>
      ): Attribute[] => {
        if (!attrs) return [];
        return Object.entries(attrs).map(([key, value]) => {
          const attr = value as AttributeDefinition;
          return {
            key,
            label: attr.label,
            type: attr.type as AttributeType,
            required: attr.required,
            options: attr.options,
            unitOfMeasure: attr.unitOfMeasure,
            enablePrint: attr.enablePrint ?? false,
            enableView: attr.enableView ?? true,
            mask: attr.mask,
            placeholder: attr.placeholder,
            description: attr.description,
            defaultValue:
              attr.defaultValue !== undefined
                ? String(attr.defaultValue)
                : undefined,
          };
        });
      };

      return {
        name: template.name,
        iconUrl: template.iconUrl || '',
        unitOfMeasure: template.unitOfMeasure || ('UNITS' as UnitOfMeasure),
        specialModules: template.specialModules || [],
        productAttributes: convertAttributes(template.productAttributes),
        variantAttributes: convertAttributes(template.variantAttributes),
        itemAttributes: convertAttributes(template.itemAttributes),
      };
    }, [template]);

    // Carregar dados do template
    useEffect(() => {
      setName(initialValues.name);
      setIconUrl(initialValues.iconUrl);
      setUnitOfMeasure(initialValues.unitOfMeasure);
      setSpecialModules(initialValues.specialModules);
      setProductAttributes(initialValues.productAttributes);
      setVariantAttributes(initialValues.variantAttributes);
      setItemAttributes(initialValues.itemAttributes);
    }, [initialValues]);

    // Funções para Products
    const addProductAttribute = () => {
      setProductAttributes([
        ...productAttributes,
        {
          key: '',
          label: '',
          type: 'string',
          required: false,
          enablePrint: false,
          enableView: true,
        },
      ]);
    };

    const removeProductAttribute = (index: number) => {
      setProductAttributes(productAttributes.filter((_, i) => i !== index));
    };

    const updateProductAttribute = (
      index: number,
      field: keyof Attribute,
      value: string | boolean | string[]
    ) => {
      const updated = [...productAttributes];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'label' && typeof value === 'string') {
        updated[index].key = generateSlug(value);
      }
      setProductAttributes(updated);
    };

    // Funções para Variants
    const addVariantAttribute = () => {
      setVariantAttributes([
        ...variantAttributes,
        {
          key: '',
          label: '',
          type: 'string',
          required: false,
          enablePrint: false,
          enableView: true,
        },
      ]);
    };

    const removeVariantAttribute = (index: number) => {
      setVariantAttributes(variantAttributes.filter((_, i) => i !== index));
    };

    const updateVariantAttribute = (
      index: number,
      field: keyof Attribute,
      value: string | boolean | string[]
    ) => {
      const updated = [...variantAttributes];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'label' && typeof value === 'string') {
        updated[index].key = generateSlug(value);
      }
      setVariantAttributes(updated);
    };

    // Funções para Items
    const addItemAttribute = () => {
      setItemAttributes([
        ...itemAttributes,
        {
          key: '',
          label: '',
          type: 'string',
          required: false,
          enablePrint: false,
          enableView: true,
        },
      ]);
    };

    const removeItemAttribute = (index: number) => {
      setItemAttributes(itemAttributes.filter((_, i) => i !== index));
    };

    const updateItemAttribute = (
      index: number,
      field: keyof Attribute,
      value: string | boolean | string[]
    ) => {
      const updated = [...itemAttributes];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'label' && typeof value === 'string') {
        updated[index].key = generateSlug(value);
      }
      setItemAttributes(updated);
    };

    const [expandedAttributes, setExpandedAttributes] = useState<
      Record<string, boolean>
    >({});

    const toggleAttributeExpanded = (key: string) => {
      setExpandedAttributes(prev => ({
        ...prev,
        [key]: !prev[key],
      }));
    };

    const renderAttributeFields = (
      attributes: Attribute[],
      updateFn: (
        index: number,
        field: keyof Attribute,
        value: string | boolean | string[]
      ) => void,
      removeFn: (index: number) => void,
      prefix: string
    ) => {
      return attributes.map((attr, index) => {
        const attrKey = `${prefix}-${index}`;
        const isExpanded = expandedAttributes[attrKey] ?? false;

        return (
          <div
            key={index}
            className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Linha principal sempre visível */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Rótulo</Label>
                  <Input
                    placeholder="ex: Marca, Cor, Tamanho..."
                    value={attr.label}
                    onChange={e => updateFn(index, 'label', e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={attr.type}
                    onValueChange={value =>
                      updateFn(index, 'type', value as AttributeType)
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="boolean">Sim/Não</SelectItem>
                      <SelectItem value="date">Data</SelectItem>
                      <SelectItem value="select">Seleção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Configurações</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant={attr.required ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        updateFn(index, 'required', !attr.required)
                      }
                      className={
                        attr.required
                          ? 'flex-1 h-11'
                          : 'flex-1 h-11 bg-white dark:bg-gray-900'
                      }
                    >
                      {attr.required ? 'Obrigatório' : 'Opcional'}
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateFn(index, 'enablePrint', !attr.enablePrint)
                            }
                            className={`h-11 w-11 p-0 ${
                              attr.enablePrint
                                ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
                                : 'bg-white dark:bg-gray-900'
                            }`}
                          >
                            {attr.enablePrint ? (
                              <MdPrint className="h-4 w-4" />
                            ) : (
                              <MdPrintDisabled className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {attr.enablePrint
                            ? 'Imprime na etiqueta'
                            : 'Não imprime na etiqueta'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateFn(index, 'enableView', !attr.enableView)
                            }
                            className={`h-11 w-11 p-0 ${
                              attr.enableView
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500'
                                : 'bg-white dark:bg-gray-900'
                            }`}
                          >
                            {attr.enableView ? (
                              <MdVisibility className="h-4 w-4" />
                            ) : (
                              <MdVisibilityOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {attr.enableView ? 'Visível' : 'Oculto'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ações</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAttributeExpanded(attrKey)}
                      className="flex-1 h-11 bg-white dark:bg-gray-900 gap-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Mais
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFn(index)}
                      className="h-11 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Opções para select - sempre visível quando tipo é select */}
              {attr.type === 'select' && (
                <div className="mt-4 space-y-2">
                  <Label>Opções (separadas por vírgula)</Label>
                  <Input
                    placeholder="ex: Nike, Adidas, Puma"
                    value={attr.options?.join(', ') || ''}
                    onChange={e =>
                      updateFn(
                        index,
                        'options',
                        e.target.value.split(',').map(s => s.trim())
                      )
                    }
                    className="h-11 bg-white dark:bg-gray-900"
                  />
                </div>
              )}
            </div>

            {/* Campos expandidos */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-900/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Unidade de Medida</Label>
                    <Input
                      placeholder="ex: kg, cm, m²"
                      value={attr.unitOfMeasure || ''}
                      onChange={e =>
                        updateFn(index, 'unitOfMeasure', e.target.value)
                      }
                      className="h-11 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Máscara</Label>
                    <Input
                      placeholder="ex: ###.###.###-##"
                      value={attr.mask || ''}
                      onChange={e => updateFn(index, 'mask', e.target.value)}
                      className="h-11 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Placeholder</Label>
                    <Input
                      placeholder="Texto de ajuda no campo"
                      value={attr.placeholder || ''}
                      onChange={e =>
                        updateFn(index, 'placeholder', e.target.value)
                      }
                      className="h-11 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Padrão</Label>
                    <Input
                      placeholder="Valor inicial do campo"
                      value={attr.defaultValue || ''}
                      onChange={e =>
                        updateFn(index, 'defaultValue', e.target.value)
                      }
                      className="h-11 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descrição detalhada do atributo..."
                      value={attr.description || ''}
                      onChange={e =>
                        updateFn(index, 'description', e.target.value)
                      }
                      className="bg-white dark:bg-gray-900 min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      });
    };

    return (
      <div className="space-y-6">
        {/* Nome e Unidade em 2 colunas */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome do Template <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Eletrônicos, Roupas, Alimentos..."
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitOfMeasure">
                Unidade de Medida <span className="text-red-500">*</span>
              </Label>
              <Select
                value={unitOfMeasure}
                onValueChange={value =>
                  setUnitOfMeasure(value as UnitOfMeasure)
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione a unidade de medida" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(UNIT_OF_MEASURE_LABELS) as [
                      UnitOfMeasure,
                      string,
                    ][]
                  ).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* URL do ícone e Preview em 2 colunas */}
        <div className="px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="iconUrl">URL do Ícone (SVG)</Label>
              <Input
                id="iconUrl"
                placeholder="https://exemplo.com/icone.svg"
                value={iconUrl}
                onChange={e => setIconUrl(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Preview do Ícone</Label>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-slate-600 to-slate-800 overflow-hidden">
                {iconUrl ? (
                  <Image
                    src={iconUrl}
                    alt="Preview"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain brightness-0 invert"
                    unoptimized
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-white text-xs">Sem ícone</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Módulos Especiais */}
        <div className="px-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm">Módulos Especiais</h3>
              <p className="text-xs text-muted-foreground">
                Funcionalidades adicionais habilitadas para produtos deste
                template
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="care-instructions-module"
                checked={specialModules.includes('CARE_INSTRUCTIONS')}
                onCheckedChange={checked => {
                  setSpecialModules(prev =>
                    checked
                      ? [...prev, 'CARE_INSTRUCTIONS']
                      : prev.filter(m => m !== 'CARE_INSTRUCTIONS')
                  );
                }}
              />
              <Label
                htmlFor="care-instructions-module"
                className="cursor-pointer text-sm"
              >
                Conservacao Textil (instruções de cuidado ISO 3758)
              </Label>
            </div>
          </div>
        </div>

        {/* Tabs para atributos */}
        <Tabs defaultValue="product" className="w-full">
          <div className="w-full px-6">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="product" className="gap-2">
                <Layers className="w-4 h-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="variant" className="gap-2">
                <Layers className="w-4 h-4" />
                Variantes
              </TabsTrigger>
              <TabsTrigger value="item" className="gap-2">
                <Settings className="w-4 h-4" />
                Itens
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Produtos */}
          <TabsContent
            value="product"
            className="w-full space-y-4 mt-6 px-6 pb-6"
          >
            <div className="w-full p-6 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Atributos de Produtos</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Defina os campos que cada produto terá
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProductAttribute}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {productAttributes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum atributo adicionado. Clique em &quot;Adicionar&quot;
                  para começar.
                </div>
              ) : (
                <div className="space-y-4">
                  {renderAttributeFields(
                    productAttributes,
                    updateProductAttribute,
                    removeProductAttribute,
                    'product'
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Variantes */}
          <TabsContent
            value="variant"
            className="w-full space-y-4 mt-6 px-6 pb-6"
          >
            <div className="w-full p-6 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Atributos de Variantes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Defina os campos que cada variante terá
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariantAttribute}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {variantAttributes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum atributo adicionado. Clique em &quot;Adicionar&quot;
                  para começar.
                </div>
              ) : (
                <div className="space-y-4">
                  {renderAttributeFields(
                    variantAttributes,
                    updateVariantAttribute,
                    removeVariantAttribute,
                    'variant'
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Itens */}
          <TabsContent value="item" className="w-full space-y-4 mt-6 px-6 pb-6">
            <div className="w-full p-6 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Atributos de Itens</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Defina os campos que cada item terá
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemAttribute}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {itemAttributes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum atributo adicionado. Clique em &quot;Adicionar&quot;
                  para começar.
                </div>
              ) : (
                <div className="space-y-4">
                  {renderAttributeFields(
                    itemAttributes,
                    updateItemAttribute,
                    removeItemAttribute,
                    'item'
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);
