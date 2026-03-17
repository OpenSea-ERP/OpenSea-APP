/**
 * OpenSea OS - Edit Product Page
 * Follows the standard edit page pattern: PageLayout > PageHeader > PageBody
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { CareSelector } from '@/components/care';
import { Card } from '@/components/ui/card';
import { CategoryCombobox } from '@/components/ui/category-combobox';
import { Combobox } from '@/components/ui/combobox';
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
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/stock/use-categories';
import { useProductCareInstructions } from '@/hooks/stock/use-product-care-instructions';
import { logger } from '@/lib/logger';
import {
  manufacturersService,
  productsService,
  templatesService,
} from '@/services/stock';
import type {
  Category,
  Manufacturer,
  Product,
  Template,
  TemplateAttribute,
} from '@/types/stock';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  NotebookText,
  Package,
  Save,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: product,
    isLoading: isLoadingProduct,
    error,
  } = useQuery<Product>({
    queryKey: ['products', productId],
    queryFn: async () => {
      const response = await productsService.getProduct(productId);
      return response.product;
    },
  });

  const { data: categoriesData } = useCategories();
  const categories =
    (categoriesData as { categories: Category[] } | undefined)?.categories ??
    [];

  const { data: template } = useQuery<Template>({
    queryKey: ['templates', product?.templateId],
    queryFn: async () => {
      if (!product?.templateId) throw new Error('Template ID não encontrado');
      const response = await templatesService.getTemplate(product.templateId);
      return response.template;
    },
    enabled: !!product?.templateId,
  });

  const hasCareInstructions =
    template?.specialModules?.includes('CARE_INSTRUCTIONS');

  const { data: savedCareInstructions } = useProductCareInstructions(productId);
  const savedCareIds =
    savedCareInstructions?.map(ci => ci.careInstructionId) ?? [];

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [outOfLine, setOutOfLine] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    manufacturersService
      .listManufacturers()
      .then(r => setManufacturers(r.manufacturers || []))
      .catch(err =>
        logger.error(
          'Erro ao carregar fabricantes',
          err instanceof Error ? err : undefined
        )
      );
  }, []);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setAttributes(product.attributes || {});
      setOutOfLine(product.outOfLine ?? false);
      setIsActive(product.status === 'ACTIVE');
      if (product.manufacturer?.id) {
        setManufacturerId(product.manufacturer.id);
      }
      const currentCategory = product.productCategories?.[0];
      setCategoryId(currentCategory?.id ?? '');
    }
  }, [product]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      await productsService.updateProduct(productId, {
        name: name.trim(),
        description: description.trim() || undefined,
        manufacturerId: manufacturerId || undefined,
        attributes,
        outOfLine,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        categoryIds: categoryId ? [categoryId] : [],
      });

      toast.success('Produto atualizado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['products', productId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['variants', 'product', productId],
      });
      router.push(`/stock/products/${productId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar produto',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar produto', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await productsService.deleteProduct(productId);
      toast.success('Produto excluído com sucesso!');
      router.push('/stock/products');
    } catch (err) {
      logger.error(
        'Erro ao deletar produto',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar produto', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'delete',
      title: 'Excluir',
      icon: Trash2,
      onClick: () => setDeleteModalOpen(true),
      variant: 'default',
      className:
        'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
    },
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving || !name.trim(),
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Estoque', href: '/stock' },
    { label: 'Produtos', href: '/stock/products' },
    {
      label: product?.name || '...',
      href: `/stock/products/${productId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingProduct) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !product) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Produto não encontrado"
            message="O produto solicitado não foi encontrado."
            action={{
              label: 'Voltar para Produtos',
              onClick: () => router.push('/stock/products'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // TEMPLATE ATTRIBUTES
  // ============================================================================

  const templateAttrs = template?.productAttributes
    ? Object.entries(template.productAttributes).sort(([, a], [, b]) => {
        const labelA = ((a as TemplateAttribute)?.label || '').toLowerCase();
        const labelB = ((b as TemplateAttribute)?.label || '').toLowerCase();
        return labelA.localeCompare(labelB);
      })
    : [];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 shadow-lg">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando produto</p>
              <h1 className="text-xl font-bold truncate">{product.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Fora de Linha</p>
                  <p className="text-[11px] text-muted-foreground">
                    {outOfLine ? 'Sim' : 'Não'}
                  </p>
                </div>
                <Switch checked={outOfLine} onCheckedChange={setOutOfLine} />
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs + Form Card */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList
            className={`grid w-full h-12 mb-4 ${hasCareInstructions ? 'grid-cols-2' : 'grid-cols-1'}`}
          >
            <TabsTrigger value="general">Informações Gerais</TabsTrigger>
            {hasCareInstructions && (
              <TabsTrigger value="conservation">
                Modo de Conservação
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB: Informações Gerais */}
          <TabsContent value="general" className="flex-col w-full space-y-6">
            {/* Section: Dados do Produto */}
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-8">
                <div className="space-y-5">
                  <SectionHeader
                    icon={NotebookText}
                    title="Dados do Produto"
                    subtitle="Informações básicas de identificação"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">
                          Nome <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Nome do produto"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Categoria</Label>
                        <CategoryCombobox
                          categories={categories}
                          value={categoryId}
                          onValueChange={setCategoryId}
                          placeholder="Selecione uma categoria..."
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>
                          Fabricante <span className="text-red-500">*</span>
                        </Label>
                        <Combobox
                          value={manufacturerId}
                          onValueChange={setManufacturerId}
                          options={[
                            { value: '', label: 'Não informado' },
                            ...manufacturers.map(mfg => ({
                              value: mfg.id,
                              label: mfg.name,
                            })),
                          ]}
                          placeholder="Selecione um fabricante..."
                          searchPlaceholder="Buscar fabricante..."
                          emptyText="Nenhum fabricante encontrado"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Descrição do produto"
                        rows={3}
                      />
                    </div>

                    {/* Mobile toggles */}
                    <div className="grid grid-cols-1 sm:hidden gap-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">
                            Fora de Linha
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {outOfLine ? 'Sim' : 'Não'}
                          </p>
                        </div>
                        <Switch
                          checked={outOfLine}
                          onCheckedChange={setOutOfLine}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">
                            Status
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {isActive ? 'Ativo' : 'Inativo'}
                          </p>
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={setIsActive}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section: Atributos Exclusivos */}
            {templateAttrs.length > 0 && (
              <Card className="bg-white/5 py-2 overflow-hidden">
                <div className="px-6 py-4 space-y-8">
                  <div className="space-y-5">
                    <SectionHeader
                      icon={SlidersHorizontal}
                      title="Atributos Exclusivos"
                      subtitle={`Definidos pelo template "${template?.name}"`}
                    />
                    <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templateAttrs.map(([key, config]) => {
                          const cfg = config as TemplateAttribute;
                          const fieldType = cfg?.type || 'text';
                          const baseLabel = cfg?.label || key;
                          const displayLabel = cfg?.unitOfMeasure
                            ? `${baseLabel} (${cfg.unitOfMeasure})`
                            : baseLabel;
                          const options = cfg?.options || [];
                          const placeholder =
                            cfg?.placeholder ||
                            (cfg?.mask
                              ? cfg.mask
                              : `Insira ${baseLabel.toLowerCase()}`);

                          if (fieldType === 'boolean') {
                            return (
                              <div
                                key={key}
                                className="flex items-center space-x-2"
                              >
                                <Switch
                                  id={`attr-${key}`}
                                  checked={attributes[key] === true}
                                  onCheckedChange={checked =>
                                    setAttributes(prev => ({
                                      ...prev,
                                      [key]: checked,
                                    }))
                                  }
                                />
                                <Label htmlFor={`attr-${key}`}>
                                  {displayLabel}
                                </Label>
                              </div>
                            );
                          }

                          if (fieldType === 'select' && options.length > 0) {
                            return (
                              <div key={key} className="grid gap-2">
                                <Label htmlFor={`attr-${key}`}>
                                  {displayLabel}
                                </Label>
                                <Select
                                  value={String(attributes[key] ?? '')}
                                  onValueChange={value =>
                                    setAttributes(prev => ({
                                      ...prev,
                                      [key]: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger id={`attr-${key}`}>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {options.map((option: string) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
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
                            fieldType === 'number' || isNumericMask
                              ? 'text'
                              : fieldType === 'date'
                                ? 'date'
                                : 'text';

                          const handleMaskedChange = (
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            let val = e.target.value;
                            if (isNumericMask) {
                              val = val.replace(/\D/g, '');
                              if (mask && val.length > mask.length) {
                                val = val.slice(0, mask.length);
                              }
                            }
                            setAttributes(prev => ({
                              ...prev,
                              [key]:
                                fieldType === 'number'
                                  ? parseFloat(val) || val
                                  : val,
                            }));
                          };

                          return (
                            <div key={key} className="grid gap-2">
                              <Label htmlFor={`attr-${key}`}>
                                {displayLabel}
                              </Label>
                              <Input
                                id={`attr-${key}`}
                                type={inputType}
                                inputMode={
                                  isNumericMask || fieldType === 'number'
                                    ? 'numeric'
                                    : undefined
                                }
                                maxLength={
                                  isNumericMask && mask
                                    ? mask.length
                                    : undefined
                                }
                                value={String(attributes[key] ?? '')}
                                onChange={handleMaskedChange}
                                placeholder={placeholder}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Modo de Conservação */}
          {hasCareInstructions && (
            <TabsContent
              value="conservation"
              className="flex-col w-full space-y-6"
            >
              <Card className="bg-white/5 py-2 overflow-hidden">
                <div className="px-6 py-4">
                  <CareSelector
                    productId={productId}
                    initialSelectedIds={savedCareIds}
                  />
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Produto"
        description={`Digite seu PIN de ação para excluir o produto "${product.name}". Esta ação não pode ser desfeita e todas as variantes associadas serão removidas.`}
      />
    </PageLayout>
  );
}
