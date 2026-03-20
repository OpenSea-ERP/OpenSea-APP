/**
 * OpenSea OS - Template Detail Page
 * Página de visualização de um template com layout padronizado
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { productsService, templatesService } from '@/services/stock';
import type { Template, TemplateAttribute } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CalendarCheck,
  Clock,
  Hash,
  Layers,
  List,
  Pencil,
  Puzzle,
  Settings,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  ToggleLeft,
  Type,
} from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { GrObjectGroup } from 'react-icons/gr';
import {
  MdPrint,
  MdPrintDisabled,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import { getUnitLabel } from '../src/constants/unit-labels';

// ============================================================================
// TYPE ICON MAP
// ============================================================================

const TYPE_ICONS: Record<string, React.ElementType> = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  date: CalendarCheck,
  select: List,
};

const TYPE_LABELS: Record<string, string> = {
  string: 'Texto',
  number: 'Número',
  boolean: 'Sim/Não',
  date: 'Data',
  select: 'Seleção',
};

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-foreground" />
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// ============================================================================
// ATTRIBUTE CARD
// ============================================================================

function AttributeCard({
  attrKey,
  attr,
}: {
  attrKey: string;
  attr: TemplateAttribute;
}) {
  const hasAdvanced =
    attr.unitOfMeasure || attr.mask || attr.placeholder || attr.description;
  const hasDefaultValue =
    attr.defaultValue !== undefined && attr.defaultValue !== '';
  const TypeIcon = TYPE_ICONS[attr.type] || Type;

  return (
    <div className="rounded-lg border border-border bg-white dark:bg-slate-800/60 p-4 space-y-3">
      {/* Single row: icon + label | badges */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-slate-100 dark:from-slate-700 to-transparent">
          <TypeIcon className="h-4 w-4 text-muted-foreground" />
        </div>

        <span className="text-sm font-medium truncate flex-1">
          {attr.label || attrKey}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border ${
              attr.required
                ? 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300'
                : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-muted-foreground'
            }`}
          >
            <ShieldCheck className="h-2.5 w-2.5" />
            {attr.required ? 'Obrigatório' : 'Opcional'}
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border ${
              attr.enablePrint
                ? 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300'
                : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-muted-foreground'
            }`}
          >
            {attr.enablePrint ? (
              <MdPrint className="h-2.5 w-2.5" />
            ) : (
              <MdPrintDisabled className="h-2.5 w-2.5" />
            )}
            Etiqueta
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border ${
              attr.enableView
                ? 'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300'
                : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-muted-foreground'
            }`}
          >
            {attr.enableView ? (
              <MdVisibility className="h-2.5 w-2.5" />
            ) : (
              <MdVisibilityOff className="h-2.5 w-2.5" />
            )}
            Relatórios
          </span>
        </div>
      </div>

      {/* Select options */}
      {attr.type === 'select' && attr.options && attr.options.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Opções de escolha
          </p>
          <div className="flex flex-wrap gap-1.5">
            {attr.options.map((option, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {option}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Advanced details */}
      {(hasAdvanced || hasDefaultValue) && (
        <div className="pt-3 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {attr.unitOfMeasure && (
              <div>
                <p className="text-xs text-muted-foreground">Unidade</p>
                <p className="text-sm">{attr.unitOfMeasure}</p>
              </div>
            )}
            {attr.mask && (
              <div>
                <p className="text-xs text-muted-foreground">Máscara</p>
                <p className="text-sm font-mono">{attr.mask}</p>
              </div>
            )}
            {attr.placeholder && (
              <div>
                <p className="text-xs text-muted-foreground">Placeholder</p>
                <p className="text-sm text-muted-foreground italic">
                  {attr.placeholder}
                </p>
              </div>
            )}
            {hasDefaultValue && (
              <div>
                <p className="text-xs text-muted-foreground">Valor Padrão</p>
                <p className="text-sm">
                  {attr.type === 'boolean'
                    ? attr.defaultValue
                      ? 'Sim'
                      : 'Não'
                    : String(attr.defaultValue)}
                </p>
              </div>
            )}
          </div>
          {attr.description && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Descrição</p>
              <p className="text-sm mt-0.5">{attr.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: template,
    isLoading,
    error,
  } = useQuery<Template>({
    queryKey: ['templates', templateId],
    queryFn: async () => {
      const response = await templatesService.getTemplate(templateId);
      return response.template;
    },
  });

  const [productsCount, setProductsCount] = useState<number | null>(null);

  useEffect(() => {
    if (!template) return;
    productsService
      .listProducts(template.id)
      .then(r => setProductsCount(r.products?.length || 0))
      .catch(() => setProductsCount(0));
  }, [template]);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const productAttributes = useMemo(
    () =>
      (template?.productAttributes as Record<string, TemplateAttribute>) ||
      null,
    [template]
  );
  const variantAttributes = useMemo(
    () =>
      (template?.variantAttributes as Record<string, TemplateAttribute>) ||
      null,
    [template]
  );
  const itemAttributes = useMemo(
    () =>
      (template?.itemAttributes as Record<string, TemplateAttribute>) || null,
    [template]
  );

  const totalAttributes = useMemo(() => {
    return (
      Object.keys(productAttributes || {}).length +
      Object.keys(variantAttributes || {}).length +
      Object.keys(itemAttributes || {}).length
    );
  }, [productAttributes, variantAttributes, itemAttributes]);

  const specialModules = template?.specialModules || [];

  // ============================================================================
  // ACTION BAR
  // ============================================================================

  const actionButtons: HeaderButton[] = [];

  if (productsCount !== null && productsCount > 0) {
    actionButtons.push({
      id: 'view-products',
      title: `Ver ${productsCount} Produto${productsCount !== 1 ? 's' : ''}`,
      icon: Layers,
      onClick: () => router.push(`/stock/products?template=${templateId}`),
      variant: 'outline',
    });
  }

  actionButtons.push({
    id: 'edit',
    title: 'Editar',
    icon: Pencil,
    onClick: () => router.push(`/stock/templates/${templateId}/edit`),
    variant: 'default',
  });

  // ============================================================================
  // LOADING
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Templates', href: '/stock/templates' },
              { label: '...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // ERROR
  // ============================================================================

  if (error || !template) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Templates', href: '/stock/templates' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Template não encontrado"
            message="O template que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Templates',
              onClick: () => router.push('/stock/templates'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // DATES
  // ============================================================================

  const formattedCreatedAt = new Date(template.createdAt).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'long', year: 'numeric' }
  );
  const formattedUpdatedAt =
    template.updatedAt && template.updatedAt !== template.createdAt
      ? new Date(template.updatedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Templates', href: '/stock/templates' },
            { label: template.name },
          ]}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* ── Identity Card ── */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-pink-600 shadow-lg">
              {template.iconUrl ? (
                <Image
                  src={template.iconUrl}
                  alt={template.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain brightness-0 invert"
                  unoptimized
                />
              ) : (
                <GrObjectGroup className="h-6 w-6 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{template.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-2 py-1 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  {getUnitLabel(template.unitOfMeasure)}
                </div>
                {productsCount !== null && productsCount === 0 && (
                  <div className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-2 py-1 text-xs text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    Nenhum produto utiliza este template
                  </div>
                )}
              </div>
            </div>

            {/* Metadata (right) */}
            <div className="hidden sm:flex flex-col items-end text-right gap-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-sky-400" />
                Criado em {formattedCreatedAt}
              </p>
              {formattedUpdatedAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-400" />
                  Atualizado em {formattedUpdatedAt}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* ── Content Card ── */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            {/* ── Seção: Módulos Especiais ── */}
            <div className="space-y-5">
              <SectionHeader
                icon={Puzzle}
                title="Módulos Especiais"
                subtitle="Funcionalidades adicionais habilitadas"
              />

              {specialModules.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nenhum módulo especial ativado.
                </p>
              ) : (
                <div className="space-y-3">
                  {specialModules.includes('CARE_INSTRUCTIONS') && (
                    <div className="flex items-center justify-between w-full rounded-lg border border-border bg-white dark:bg-slate-800/60 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-purple-500/20 to-pink-500/20">
                          <Shirt className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Conservação Têxtil
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Instruções de cuidado segundo a norma ISO 3758
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className="text-xs shrink-0">
                        Ativado
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Seção: Atributos ── */}
            <div className="space-y-5">
              <SectionHeader
                icon={SlidersHorizontal}
                title="Atributos"
                subtitle="Campos personalizados para produtos, variantes e itens"
                badge={
                  totalAttributes > 0 ? (
                    <div className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-2 py-1 text-xs text-muted-foreground">
                      <SlidersHorizontal className="h-3 w-3" />
                      {totalAttributes}{' '}
                      {totalAttributes === 1 ? 'Atributo' : 'Atributos'}
                    </div>
                  ) : undefined
                }
              />

              <Tabs defaultValue="product" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
                  <TabsTrigger value="product" className="gap-2">
                    <Layers className="w-4 h-4 hidden sm:inline" />
                    Produtos
                    {productAttributes &&
                      Object.keys(productAttributes).length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {Object.keys(productAttributes).length}
                        </Badge>
                      )}
                  </TabsTrigger>
                  <TabsTrigger value="variant" className="gap-2">
                    <Layers className="w-4 h-4 hidden sm:inline" />
                    Variantes
                    {variantAttributes &&
                      Object.keys(variantAttributes).length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {Object.keys(variantAttributes).length}
                        </Badge>
                      )}
                  </TabsTrigger>
                  <TabsTrigger value="item" className="gap-2">
                    <Settings className="w-4 h-4 hidden sm:inline" />
                    Itens
                    {itemAttributes &&
                      Object.keys(itemAttributes).length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {Object.keys(itemAttributes).length}
                        </Badge>
                      )}
                  </TabsTrigger>
                </TabsList>

                {(['product', 'variant', 'item'] as const).map(tab => {
                  const attrs =
                    tab === 'product'
                      ? productAttributes
                      : tab === 'variant'
                        ? variantAttributes
                        : itemAttributes;
                  const label =
                    tab === 'product'
                      ? 'Produtos'
                      : tab === 'variant'
                        ? 'Variantes'
                        : 'Itens';
                  const TabIcon = tab === 'item' ? Settings : Layers;

                  return (
                    <TabsContent
                      key={tab}
                      value={tab}
                      className="space-y-4 mt-2"
                    >
                      <div className="w-full p-6 rounded-xl bg-white dark:bg-slate-800/60 border border-border">
                        <div className="flex items-center gap-2 mb-4">
                          <TabIcon className="w-5 h-5 text-foreground" />
                          <h3 className="font-semibold">
                            Atributos de {label}
                          </h3>
                        </div>
                        {!attrs || Object.keys(attrs).length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground">
                            Nenhum atributo configurado.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {Object.entries(attrs).map(([key, attr]) => (
                              <AttributeCard
                                key={key}
                                attrKey={key}
                                attr={attr}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
