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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Template, UnitOfMeasure } from '@/types/stock';
import { UNIT_OF_MEASURE_LABELS } from '@/types/stock';
import {
  ChevronDown,
  Info,
  Layers,
  type LucideIcon,
  Puzzle,
  Plus,
  Settings,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import {
  MdPrint,
  MdPrintDisabled,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import { GrObjectGroup } from 'react-icons/gr';
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

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

function CollapsibleSection({
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className="flex w-full items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-foreground" />
            <div className="text-left">
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 transition-colors">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
        <div className="border-b border-border" />
      </div>

      {/* Content */}
      {open && children}
    </div>
  );
}

// ============================================================================
// MODULE CARD
// ============================================================================

function ModuleCard({
  id,
  title,
  subtitle,
  icon: Icon,
  active,
  onToggle,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  active: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between w-full rounded-lg border border-border bg-white dark:bg-slate-800/60 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-purple-500/20 to-pink-500/20">
          <Icon className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Switch id={id} checked={active} onCheckedChange={onToggle} />
    </div>
  );
}

// ============================================================================
// MAIN FORM
// ============================================================================

export const TemplateForm = forwardRef<TemplateFormRef, TemplateFormProps>(
  function TemplateForm({ template, onSubmit }, ref) {
    const [name, setName] = useState('');
    const [iconUrl, setIconUrl] = useState('');
    const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>('UNITS');
    const [specialModules, setSpecialModules] = useState<string[]>([]);
    const [productAttributes, setProductAttributes] = useState<Attribute[]>([]);
    const [variantAttributes, setVariantAttributes] = useState<Attribute[]>([]);
    const [itemAttributes, setItemAttributes] = useState<Attribute[]>([]);
    const [iconError, setIconError] = useState(false);

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
      setIconError(false);
    }, [initialValues]);

    // ========================================================================
    // ATTRIBUTE CRUD FUNCTIONS
    // ========================================================================

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

    // ========================================================================
    // EXPANDED ATTRIBUTES STATE
    // ========================================================================

    const [expandedAttributes, setExpandedAttributes] = useState<
      Record<string, boolean>
    >({});

    const toggleAttributeExpanded = (key: string) => {
      setExpandedAttributes(prev => ({
        ...prev,
        [key]: !prev[key],
      }));
    };

    // ========================================================================
    // RENDER ATTRIBUTE FIELDS
    // ========================================================================

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
        const displayName = attr.label || `Atributo ${index + 1}`;

        return (
          <div
            key={index}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden"
          >
            {/* ── Header: nome resumido + ações ── */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white/[0.04] border-b border-white/[0.06]">
              <span className="text-sm font-medium truncate">
                {displayName}
              </span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => removeFn(index)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Remover</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* ── Body ── */}
            <div className="p-4 space-y-4">
              {/* Linha 1: Label + Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Rótulo
                  </Label>
                  <Input
                    placeholder="ex: Marca, Cor, Tamanho..."
                    value={attr.label}
                    onChange={e => updateFn(index, 'label', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <Select
                    value={attr.type}
                    onValueChange={value =>
                      updateFn(index, 'type', value as AttributeType)
                    }
                  >
                    <SelectTrigger className="h-10">
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
              </div>

              {/* Linha 2: Toggles + botão de configurações avançadas */}
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => updateFn(index, 'required', !attr.required)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
                      attr.required
                        ? 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300'
                        : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Preenchimento Obrigatório
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateFn(index, 'enablePrint', !attr.enablePrint)
                    }
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
                      attr.enablePrint
                        ? 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300'
                        : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {attr.enablePrint ? (
                      <MdPrint className="h-3 w-3" />
                    ) : (
                      <MdPrintDisabled className="h-3 w-3" />
                    )}
                    Campo de Etiqueta
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateFn(index, 'enableView', !attr.enableView)
                    }
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
                      attr.enableView
                        ? 'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300'
                        : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {attr.enableView ? (
                      <MdVisibility className="h-3 w-3" />
                    ) : (
                      <MdVisibilityOff className="h-3 w-3" />
                    )}
                    Visível em Relatórios
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAttributeExpanded(attrKey)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer border shrink-0 ${
                    isExpanded
                      ? 'border-purple-600/25 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/8 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Settings className="h-3 w-3" />
                  Configurações Avançadas
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {/* Condicional: Opções do tipo select */}
              {attr.type === 'select' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Opções (separadas por vírgula)
                  </Label>
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
                    className="h-10"
                  />
                </div>
              )}
            </div>

            {/* ── Expandido: campos avançados ── */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-4 border-t border-white/[0.06] bg-white/[0.02]">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Unidade
                      </Label>
                      <Input
                        placeholder="ex: kg, cm, m²"
                        value={attr.unitOfMeasure || ''}
                        onChange={e =>
                          updateFn(index, 'unitOfMeasure', e.target.value)
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Máscara
                      </Label>
                      <Input
                        placeholder="ex: ###.###-##"
                        value={attr.mask || ''}
                        onChange={e => updateFn(index, 'mask', e.target.value)}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Placeholder
                      </Label>
                      <Input
                        placeholder="Texto de ajuda"
                        value={attr.placeholder || ''}
                        onChange={e =>
                          updateFn(index, 'placeholder', e.target.value)
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Valor Padrão
                      </Label>
                      <Input
                        placeholder="Valor inicial"
                        value={attr.defaultValue || ''}
                        onChange={e =>
                          updateFn(index, 'defaultValue', e.target.value)
                        }
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Descrição
                    </Label>
                    <Textarea
                      placeholder="Descrição detalhada do atributo..."
                      value={attr.description || ''}
                      onChange={e =>
                        updateFn(index, 'description', e.target.value)
                      }
                      className="min-h-[72px] resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      });
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    const hasValidIcon = iconUrl.trim() && !iconError;

    return (
      <div className="space-y-8 px-6 py-4">
        {/* ================================================================
            SEÇÃO 1 — Informações Gerais
            ================================================================ */}
        <CollapsibleSection
          icon={Info}
          title="Informações Gerais"
          subtitle="Defina o nome, unidade de medida e ícone do template"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome <span className="text-red-500">*</span>
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

            {/* Unidade de Medida */}
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

            {/* Ícone (URL + Preview inline) */}
            <div className="space-y-2">
              <Label htmlFor="iconUrl">Ícone (SVG)</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="iconUrl"
                    placeholder="https://exemplo.com/icone.svg"
                    value={iconUrl}
                    onChange={e => {
                      setIconUrl(e.target.value);
                      setIconError(false);
                    }}
                    className="h-11"
                  />
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border overflow-hidden">
                  {hasValidIcon ? (
                    <Image
                      src={iconUrl}
                      alt="Ícone"
                      width={22}
                      height={22}
                      className="h-[22px] w-[22px] object-contain dark:brightness-0 dark:invert"
                      unoptimized
                      onError={() => setIconError(true)}
                    />
                  ) : (
                    <GrObjectGroup className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ================================================================
            SEÇÃO 2 — Módulos Especiais
            ================================================================ */}
        <CollapsibleSection
          icon={Puzzle}
          title="Módulos Especiais"
          subtitle="Funcionalidades adicionais habilitadas para produtos deste template"
        >
          <div className="space-y-3">
            <ModuleCard
              id="care-instructions-module"
              title="Conservação Têxtil"
              subtitle="Instruções de cuidado segundo a norma ISO 3758"
              icon={Shirt}
              active={specialModules.includes('CARE_INSTRUCTIONS')}
              onToggle={checked => {
                setSpecialModules(prev =>
                  checked
                    ? [...prev, 'CARE_INSTRUCTIONS']
                    : prev.filter(m => m !== 'CARE_INSTRUCTIONS')
                );
              }}
            />
          </div>
        </CollapsibleSection>

        {/* ================================================================
            SEÇÃO 3 — Atributos
            ================================================================ */}
        <CollapsibleSection
          icon={SlidersHorizontal}
          title="Atributos"
          subtitle="Configure os campos personalizados para produtos, variantes e itens"
        >
          <Tabs defaultValue="product" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
              <TabsTrigger value="product" className="gap-2">
                <Layers className="w-4 h-4 hidden sm:inline" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="variant" className="gap-2">
                <Layers className="w-4 h-4 hidden sm:inline" />
                Variantes
              </TabsTrigger>
              <TabsTrigger value="item" className="gap-2">
                <Settings className="w-4 h-4 hidden sm:inline" />
                Itens
              </TabsTrigger>
            </TabsList>

            {/* Tab: Produtos */}
            <TabsContent value="product" className="w-full space-y-4 mt-2">
              <div className="w-full p-6 rounded-xl bg-white dark:bg-slate-800/60 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Atributos de Produtos</h3>
                    <p className="text-sm text-muted-foreground">
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
                  <div className="text-center py-8 text-muted-foreground">
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
            <TabsContent value="variant" className="w-full space-y-4 mt-2">
              <div className="w-full p-6 rounded-xl bg-white dark:bg-slate-800/60 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Atributos de Variantes</h3>
                    <p className="text-sm text-muted-foreground">
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
                  <div className="text-center py-8 text-muted-foreground">
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
            <TabsContent value="item" className="w-full space-y-4 mt-2">
              <div className="w-full p-6 rounded-xl bg-white dark:bg-slate-800/60 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Atributos de Itens</h3>
                    <p className="text-sm text-muted-foreground">
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
                  <div className="text-center py-8 text-muted-foreground">
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
        </CollapsibleSection>
      </div>
    );
  }
);
