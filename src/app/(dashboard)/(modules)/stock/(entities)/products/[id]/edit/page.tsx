/**
 * OpenSea OS - Edit Product Page
 * Página de edição de produto
 */

'use client';

import { logger } from '@/lib/logger';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { CareIcon, CareSelector } from '@/components/care';
import { VariantManager } from '@/components/stock/variants';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCareOptions } from '@/hooks/stock';
import { useCategories } from '@/hooks/stock/use-categories';
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
import { NotebookText, Package, Save, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: product, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: ['products', productId],
    queryFn: async () => {
      const response = await productsService.getProduct(productId);
      return response.product;
    },
  });

  const { data: careOptions, isLoading: isLoadingCareOptions } =
    useCareOptions();

  const { data: categoriesData } = useCategories();

  const { data: template } = useQuery<Template>({
    queryKey: ['templates', product?.templateId],
    queryFn: async () => {
      if (!product?.templateId) throw new Error('Template ID não encontrado');
      const response = await templatesService.getTemplate(product.templateId);
      return response.template;
    },
    enabled: !!product?.templateId,
  });

  // ============================================================================
  // STATE
  // ============================================================================

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [manufacturerId, setManufacturerId] = useState<string>('');
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [outOfLine, setOutOfLine] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Load manufacturers
    const loadManufacturers = async () => {
      try {
        const response = await manufacturersService.listManufacturers();
        setManufacturers(response.manufacturers || []);
      } catch (error) {
        logger.error(
          'Erro ao carregar fabricantes',
          error instanceof Error ? error : undefined
        );
      }
    };

    loadManufacturers();
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
      // Categoria única: ler a primeira (e única) categoria associada
      const currentCategory = product.productCategories?.[0];
      setCategoryId(currentCategory?.id ?? '');
    }
  }, [product]);

  // Construir opções de categorias com hierarquia (raíz → filhos) ordenadas por displayOrder
  const hierarchicalCategoryOptions = useMemo(() => {
    const categories = (
      categoriesData as { categories: Category[] } | undefined
    )?.categories;
    if (!categories) return [];

    const activeCategories = categories.filter(c => c.isActive);

    // Separar raízes e filhos
    const roots = activeCategories
      .filter(c => !c.parentId)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    const childrenMap = new Map<string, Category[]>();
    for (const cat of activeCategories) {
      if (cat.parentId) {
        const siblings = childrenMap.get(cat.parentId) || [];
        siblings.push(cat);
        childrenMap.set(cat.parentId, siblings);
      }
    }

    // Ordenar filhos por displayOrder
    for (const [key, children] of childrenMap) {
      childrenMap.set(
        key,
        children.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      );
    }

    // Montar lista plana com indentação
    const options: Array<{ value: string; label: string; depth: number }> = [];
    const addCategory = (cat: Category, depth: number) => {
      const prefix = depth > 0 ? '\u00A0\u00A0'.repeat(depth) + '└ ' : '';
      options.push({
        value: cat.id,
        label: `${prefix}${cat.name}`,
        depth,
      });
      const children = childrenMap.get(cat.id) || [];
      for (const child of children) {
        addCategory(child, depth + 1);
      }
    };

    for (const root of roots) {
      addCategory(root, 0);
    }

    return options;
  }, [categoriesData]);

  // Seleções de cuidado atuais do produto para exibir ícones no cabeçalho
  // TODO: migrate to ProductCareInstruction API
  const selectedCareOptions = useMemo((): Array<{ code: string; assetPath: string; label: string }> => {
    if (!careOptions) return [];
    return [];
  }, [careOptions]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      setIsLoading(true);
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
      // Invalidar tanto o produto quanto as variantes
      await queryClient.invalidateQueries({
        queryKey: ['products', productId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['variants', 'product', productId],
      });
      router.push(`/stock/products/${productId}`);
    } catch (error) {
      logger.error(
        'Erro ao atualizar produto',
        error instanceof Error ? error : undefined
      );
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar produto', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await productsService.deleteProduct(productId);
      toast.success('Produto excluído com sucesso!');
      router.push('/stock/products');
    } catch (error) {
      logger.error(
        'Erro ao deletar produto',
        error instanceof Error ? error : undefined
      );
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao deletar produto', { description: message });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoadingProduct) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">Carregando produto...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <p className="text-red-500">Produto não encontrado</p>
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-8xl mx-auto space-y-6 px-6 gap-6">
      {/* Header com Breadcrumb */}
      <div className="flex w-full items-center justify-between">
        <PageBreadcrumb
          items={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Produtos', href: '/stock/products' },
            {
              label: product?.name || '...',
              href: `/stock/products/${productId}`,
            },
            { label: 'Editar', href: `/stock/products/${productId}/edit` },
          ]}
        />
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleDeleteClick}
            disabled={isLoading || isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || isDeleting || !name.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Product Info Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-center w-full justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-cyan-500">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {product.template?.name} {product.name}
                </h1>
                {product.outOfLine && (
                  <span className="px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-md">
                    Fora de Linha
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {product.manufacturer
                  ? product.manufacturer?.name
                  : 'Fabricante não informado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoadingCareOptions ? (
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-md bg-gray-200 dark:bg-slate-700 animate-pulse"
                  />
                ))}
              </div>
            ) : selectedCareOptions.length > 0 ? (
              <TooltipProvider>
                <div className="flex flex-wrap gap-2">
                  {selectedCareOptions.map(option => (
                    <Tooltip key={option.code} delayDuration={150}>
                      <TooltipTrigger asChild>
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                          <CareIcon
                            assetPath={option.assetPath}
                            size={32}
                            className="dark:brightness-0 dark:invert"
                            alt={option.label}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="max-w-xs space-y-1"
                      >
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="text-xs text-muted-foreground leading-snug">
                          Código: {option.code}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            ) : (
              <span className="text-sm text-muted-foreground">
                Nenhuma instrução definida
              </span>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex w-full justify-start gap-2 mb-4">
          <TabsTrigger value="general" className="rounded-lg">
            Informações Gerais
          </TabsTrigger>
          <TabsTrigger value="variants" className="rounded-lg">
            Variantes
          </TabsTrigger>
          <TabsTrigger value="conservation" className="rounded-lg">
            Modo de Conservação
          </TabsTrigger>
        </TabsList>

        {/* TAB: Informações Gerais */}
        <TabsContent value="general">
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-6">
            <Card className="w-full p-6">
              <div className="space-y-4">
                <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
                  <NotebookText className="h-6 w-6" />
                  Dados do Produto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome do Produto <span className="text-red-500">*</span>
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
                    <Label htmlFor="category">Categoria do Produto</Label>
                    <Combobox
                      value={categoryId}
                      onValueChange={setCategoryId}
                      options={[
                        { value: '', label: 'Nenhuma categoria' },
                        ...hierarchicalCategoryOptions.map(option => ({
                          value: option.value,
                          label: option.label,
                        })),
                      ]}
                      placeholder="Nenhuma categoria"
                      searchPlaceholder="Buscar categoria..."
                      emptyText="Nenhuma categoria encontrada"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="manufacturer">
                      Fabricante do Produto{' '}
                      <span className="text-red-500">*</span>
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
                      placeholder="Fabricante não informado"
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
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="outOfLine"
                        className="text-base font-medium"
                      >
                        Fora de Linha
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Indica que o produto não está mais disponível para novos
                        pedidos
                      </p>
                    </div>
                    <Switch
                      id="outOfLine"
                      checked={outOfLine}
                      onCheckedChange={setOutOfLine}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="isActive"
                        className="text-base font-medium"
                      >
                        Produto Ativo
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Define se o produto está ativo no sistema
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>
                </div>
              </div>

              <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 mt-6 text-white/60">
                <NotebookText className="h-6 w-6" />
                Atributos Personalizados
              </h3>

              {template?.productAttributes &&
              Object.keys(template.productAttributes).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(template.productAttributes)
                    .sort(([, a], [, b]) => {
                      const labelA = (a as TemplateAttribute)?.label || '';
                      const labelB = (b as TemplateAttribute)?.label || '';
                      return labelA.localeCompare(labelB);
                    })
                    .map(([key, config]) => {
                      const attrConfig = config as TemplateAttribute;
                      const fieldType = attrConfig?.type || 'text';
                      const label = attrConfig?.label || key;
                      const options = attrConfig?.options || [];

                      if (fieldType === 'boolean') {
                        return (
                          <div key={key} className="grid gap-2">
                            <div className="flex items-center space-x-2">
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
                              <Label htmlFor={`attr-${key}`}>{label}</Label>
                            </div>
                          </div>
                        );
                      }

                      if (fieldType === 'select' && options.length > 0) {
                        return (
                          <div key={key} className="grid gap-2">
                            <Label htmlFor={`attr-${key}`}>{label}</Label>
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

                      return (
                        <div key={key} className="grid gap-2">
                          <Label htmlFor={`attr-${key}`}>{label}</Label>
                          <Input
                            id={`attr-${key}`}
                            type={
                              fieldType === 'number'
                                ? 'number'
                                : fieldType === 'date'
                                  ? 'date'
                                  : 'text'
                            }
                            value={String(attributes[key] ?? '')}
                            onChange={e =>
                              setAttributes(prev => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder={`Insira ${label.toLowerCase()}`}
                          />
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum atributo personalizado definido para este template.
                </p>
              )}
            </Card>
          </form>
        </TabsContent>

        {/* TAB: Variantes */}
        <TabsContent value="variants">
          <Card className="w-full p-6">
            <div className="space-y-6">
              <VariantManager productId={productId} />
            </div>
          </Card>
        </TabsContent>

        {/* TAB: Modo de Conservação */}
        <TabsContent value="conservation">
          <Card className="w-full p-6">
            <div className="space-y-6">
              <CareSelector
                productId={productId}
                initialSelectedIds={[]}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto &quot;
              {product?.name}&quot;? Esta ação não pode ser desfeita e todas as
              variantes associadas serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
