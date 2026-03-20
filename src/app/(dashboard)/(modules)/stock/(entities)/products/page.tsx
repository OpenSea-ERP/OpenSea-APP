/**
 * OpenSea OS - Products Page
 * Página de gerenciamento de produtos com infinite scroll e filtros server-side
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { productsConfig } from '@/config/entities/products.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { formatUnitOfMeasure } from '@/helpers/formatters';
import { usePermissions } from '@/hooks/use-permissions';
import { useCategories } from '@/hooks/stock/use-categories';
import { useManufacturers, useTemplates } from '@/hooks/stock/use-stock-other';
import {
  useProductsInfinite,
  useUpdateProduct,
  useCreateProduct,
  useDeleteProduct,
  type ProductsFilters,
} from '@/hooks/stock/use-products';
import { productsService } from '@/services/stock';
import type { Item, Product, UpdateProductRequest } from '@/types/stock';
import {
  Blocks,
  ExternalLink,
  Factory,
  Grid3x3,
  Loader2,
  Package,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { CreateProductWizard } from './src/components/create-product-wizard';
import {
  AssignCategoryModal,
  AssignManufacturerModal,
  ProductVariantsItemsModal,
  RenameProductModal,
} from './src/modals';
import type { ProductFormData } from './src/types';

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const templateIds = useMemo(() => {
    const raw = searchParams.get('template');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const manufacturerIds = useMemo(() => {
    const raw = searchParams.get('manufacturer');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const categoryIds = useMemo(() => {
    const raw = searchParams.get('category');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>(
    'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // Quick-action modals state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameProduct, setRenameProduct] = useState<Product | null>(null);
  const [assignCategoryOpen, setAssignCategoryOpen] = useState(false);
  const [assignManufacturerOpen, setAssignManufacturerOpen] = useState(false);
  const [actionProductIds, setActionProductIds] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  // ============================================================================
  // DATA: Infinite scroll products + filter dropdown sources
  // ============================================================================

  const filters: ProductsFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      templateId: templateIds.length > 0 ? templateIds.join(',') : undefined,
      manufacturerId:
        manufacturerIds.length > 0 ? manufacturerIds.join(',') : undefined,
      categoryId: categoryIds.length > 0 ? categoryIds.join(',') : undefined,
      sortBy,
      sortOrder,
    }),
    [
      debouncedSearch,
      templateIds,
      manufacturerIds,
      categoryIds,
      sortBy,
      sortOrder,
    ]
  );

  const {
    products,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useProductsInfinite(filters);

  // Dropdown sources from dedicated endpoints (A1 strategy)
  const { data: allTemplates = [] } = useTemplates();
  const { data: allManufacturers } = useManufacturers();
  const { data: allCategories } = useCategories();

  const templateOptions = useMemo(
    () => allTemplates.map(t => ({ id: t.id, label: t.name })),
    [allTemplates]
  );

  const manufacturerOptions = useMemo(
    () =>
      (allManufacturers?.manufacturers ?? []).map(m => ({
        id: m.id,
        label: m.name,
      })),
    [allManufacturers]
  );

  const categoryOptions = useMemo(
    () =>
      (allCategories?.categories ?? []).map(c => ({
        id: c.id,
        label: c.name,
      })),
    [allCategories]
  );

  // Mutations
  const updateMutation = useUpdateProduct();
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: {
      template?: string[];
      manufacturer?: string[];
      category?: string[];
    }) => {
      const parts: string[] = [];
      const tpl = params.template !== undefined ? params.template : templateIds;
      const mfr =
        params.manufacturer !== undefined
          ? params.manufacturer
          : manufacturerIds;
      const cat = params.category !== undefined ? params.category : categoryIds;
      if (tpl.length > 0) parts.push(`template=${tpl.join(',')}`);
      if (mfr.length > 0) parts.push(`manufacturer=${mfr.join(',')}`);
      if (cat.length > 0) parts.push(`category=${cat.join(',')}`);
      return parts.length > 0
        ? `/stock/products?${parts.join('&')}`
        : '/stock/products';
    },
    [templateIds, manufacturerIds, categoryIds]
  );

  const setTemplateFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ template: ids })),
    [router, buildFilterUrl]
  );

  const setManufacturerFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ manufacturer: ids })),
    [router, buildFilterUrl]
  );

  const setCategoryFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ category: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  }, []);

  const handleMoveItem = useCallback((_item: Item) => {
    // TODO: Implement item movement modal
  }, []);

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/products/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/products/${ids[0]}/edit`);
    }
  };

  const handleContextDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  };

  const handleContextRename = useCallback(
    (ids: string[]) => {
      const product = products.find(p => p.id === ids[0]) || null;
      setRenameProduct(product);
      setRenameModalOpen(true);
    },
    [products]
  );

  const handleContextAssignCategory = useCallback((ids: string[]) => {
    setActionProductIds(ids);
    setAssignCategoryOpen(true);
  }, []);

  const handleContextAssignManufacturer = useCallback((ids: string[]) => {
    setActionProductIds(ids);
    setAssignManufacturerOpen(true);
  }, []);

  const handleRenameSubmit = useCallback(
    async (id: string, data: { name: string }) => {
      await updateMutation.mutateAsync({
        productId: id,
        data: data as UpdateProductRequest,
      });
      setRenameModalOpen(false);
      setRenameProduct(null);
    },
    [updateMutation]
  );

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Produto excluído com sucesso!'
        : `${itemsToDelete.length} produtos excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  const handleAssignCategorySubmit = useCallback(
    async (ids: string[], categoryId: string) => {
      for (const id of ids) {
        await updateMutation.mutateAsync({
          productId: id,
          data: { categoryIds: [categoryId] } as UpdateProductRequest,
        });
      }
      setAssignCategoryOpen(false);
      setActionProductIds([]);
      toast.success(
        ids.length === 1
          ? 'Categoria atribuída com sucesso!'
          : `Categoria atribuída a ${ids.length} produtos!`
      );
    },
    [updateMutation]
  );

  const handleAssignManufacturerSubmit = useCallback(
    async (ids: string[], manufacturerId: string) => {
      for (const id of ids) {
        await updateMutation.mutateAsync({
          productId: id,
          data: { manufacturerId } as UpdateProductRequest,
        });
      }
      setAssignManufacturerOpen(false);
      setActionProductIds([]);
      toast.success(
        ids.length === 1
          ? 'Fabricante atribuído com sucesso!'
          : `Fabricante atribuído a ${ids.length} produtos!`
      );
    },
    [updateMutation]
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Product, isSelected: boolean) => {
    const templateName = item.template?.name || 'Template';
    const unitOfMeasure = formatUnitOfMeasure(
      item.template?.unitOfMeasure || 'UNITS'
    );
    const manufacturerName = item.manufacturer?.name;
    const hasVariants = (item.variants?.length ?? 0) > 0;
    const variantLabel = hasVariants
      ? `${item.variants!.length} variante${item.variants!.length !== 1 ? 's' : ''}`
      : 'Ver variantes';
    const categoryNames =
      item.productCategories && item.productCategories.length > 0
        ? item.productCategories.map(c => c.name).join(', ')
        : 'Sem categoria';

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        actions={[
          {
            id: 'rename',
            label: 'Renomear',
            icon: Pencil,
            onClick: handleContextRename,
            hidden: ids => ids.length > 1,
          },
          {
            id: 'assign-category',
            label: 'Atribuir Categoria',
            icon: Tag,
            onClick: handleContextAssignCategory,
            separator: 'before',
          },
          {
            id: 'assign-manufacturer',
            label: 'Atribuir Fabricante',
            icon: Factory,
            onClick: handleContextAssignManufacturer,
          },
          {
            id: 'delete',
            label: 'Excluir',
            icon: Trash2,
            onClick: handleContextDelete,
            variant: 'destructive',
            separator: 'before',
          },
        ]}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="truncate">{item.name}</span>
              {item.outOfLine && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center shrink-0 rounded px-1 py-0.5 text-[10px] font-bold border border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300">
                      FL
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Fora de Linha</TooltipContent>
                </Tooltip>
              )}
            </span>
          }
          subtitle={manufacturerName || 'Fabricante não informado'}
          icon={Package}
          iconBgColor={
            item.outOfLine
              ? 'bg-linear-to-br from-amber-500 to-amber-600'
              : 'bg-linear-to-br from-blue-500 to-cyan-600'
          }
          badges={[
            { label: templateName, variant: 'default' },
            { label: unitOfMeasure, variant: 'default' },
            {
              label: categoryNames,
              variant: 'outline' as const,
              icon: Tag,
              color:
                'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
            },
            ...(item.status !== 'ACTIVE'
              ? [
                  {
                    label: item.status === 'INACTIVE' ? 'Inativo' : 'Arquivado',
                    variant: 'secondary' as const,
                  },
                ]
              : []),
          ]}
          footer={{
            type: 'single',
            button: {
              icon: Grid3x3,
              label: variantLabel,
              onClick: () => handleProductClick(item),
              color: hasVariants ? 'emerald' : 'secondary',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Product, isSelected: boolean) => {
    const templateName = item.template?.name || 'Template';
    const unitOfMeasure = formatUnitOfMeasure(
      item.template?.unitOfMeasure || 'UNITS'
    );
    const manufacturerName = item.manufacturer?.name;
    const variantCount = item.variants?.length ?? 0;
    const hasVariants = variantCount > 0;
    const variantLabel = hasVariants
      ? `${variantCount} variante${variantCount !== 1 ? 's' : ''}`
      : 'Ver variantes';
    const categoryNames =
      item.productCategories && item.productCategories.length > 0
        ? item.productCategories.map(c => c.name).join(', ')
        : 'Sem categoria';

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof Tag;
      color: string;
    }[] = [
      {
        label: templateName,
        variant: 'outline',
        icon: Blocks,
        color:
          'border-purple-600/25 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/8 text-purple-700 dark:text-purple-300',
      },
      {
        label: unitOfMeasure,
        variant: 'outline',
        color:
          'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      },
      {
        label: categoryNames,
        variant: 'outline',
        icon: Tag,
        color:
          'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
      },
      ...(item.status !== 'ACTIVE'
        ? [
            {
              label: item.status === 'INACTIVE' ? 'Inativo' : 'Arquivado',
              variant: 'outline' as const,
              color:
                'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        actions={[
          {
            id: 'rename',
            label: 'Renomear',
            icon: Pencil,
            onClick: handleContextRename,
            hidden: ids => ids.length > 1,
          },
          {
            id: 'assign-category',
            label: 'Atribuir Categoria',
            icon: Tag,
            onClick: handleContextAssignCategory,
            separator: 'before',
          },
          {
            id: 'assign-manufacturer',
            label: 'Atribuir Fabricante',
            icon: Factory,
            onClick: handleContextAssignManufacturer,
          },
          {
            id: 'delete',
            label: 'Excluir',
            icon: Trash2,
            onClick: handleContextDelete,
            variant: 'destructive',
            separator: 'before',
          },
        ]}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </span>
              {item.outOfLine && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center shrink-0 rounded px-1 py-0.5 text-[10px] font-bold border border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300">
                      FL
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Fora de Linha</TooltipContent>
                </Tooltip>
              )}
              {manufacturerName && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {manufacturerName}
                </span>
              )}
            </span>
          }
          metadata={
            <div className="flex items-center gap-1.5 mt-0.5">
              {listBadges.map((badge, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0',
                    badge.color
                  )}
                >
                  {badge.icon && <badge.icon className="w-3 h-3" />}
                  {badge.label}
                </span>
              ))}
            </div>
          }
          icon={Package}
          iconBgColor={
            item.outOfLine
              ? 'bg-linear-to-br from-amber-500 to-amber-600'
              : 'bg-linear-to-br from-blue-500 to-cyan-600'
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        >
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleProductClick(item);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer',
              hasVariants
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/15'
                : 'bg-gray-50 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-500/20 hover:bg-gray-100 dark:hover:bg-gray-500/15'
            )}
          >
            <Grid3x3 className="h-3.5 w-3.5" />
            {variantLabel}
          </button>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => products.map(i => i.id), [products]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleImport = useCallback(() => {
    router.push('/import/stock/products/home');
  }, [router]);

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'import-products',
        title: 'Importar',
        icon: Upload,
        onClick: handleImport,
        variant: 'outline',
        permission: productsConfig.permissions.import,
      },
      {
        id: 'create-product',
        title: 'Novo Produto',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: productsConfig.permissions.create,
      },
    ],
    [handleImport, handleCreate]
  );

  const visibleActionButtons = useMemo<HeaderButton[]>(
    () =>
      actionButtons
        .filter(button =>
          button.permission ? hasPermission(button.permission) : true
        )
        .map(({ permission, ...button }) => button),
    [actionButtons, hasPermission]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'products',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Produtos', href: '/stock/products' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Produtos"
            description="Gerencie o catálogo de produtos"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={productsConfig.display.labels.searchPlaceholder}
            value={searchQuery}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar produtos"
              message="Ocorreu um erro ao tentar carregar os produtos. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <>
              <EntityGrid
                config={productsConfig}
                items={products}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Template"
                      icon={Blocks}
                      options={templateOptions}
                      selected={templateIds}
                      onSelectionChange={setTemplateFilter}
                      activeColor="emerald"
                      searchPlaceholder="Buscar template..."
                      emptyText="Nenhum template encontrado."
                      footerAction={{
                        icon: ExternalLink,
                        label: 'Ver todos os templates',
                        onClick: () => router.push('/stock/templates'),
                        color: 'emerald',
                      }}
                    />
                    <FilterDropdown
                      label="Fabricante"
                      icon={Factory}
                      options={manufacturerOptions}
                      selected={manufacturerIds}
                      onSelectionChange={setManufacturerFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar fabricante..."
                      emptyText="Nenhum fabricante encontrado."
                      footerAction={{
                        icon: ExternalLink,
                        label: 'Ver todos os fabricantes',
                        onClick: () => router.push('/stock/manufacturers'),
                        color: 'violet',
                      }}
                    />
                    <FilterDropdown
                      label="Categoria"
                      icon={Tag}
                      options={categoryOptions}
                      selected={categoryIds}
                      onSelectionChange={setCategoryFilter}
                      activeColor="cyan"
                      searchPlaceholder="Buscar categoria..."
                      emptyText="Nenhuma categoria encontrada."
                      footerAction={{
                        icon: ExternalLink,
                        label: 'Ver todas as categorias',
                        onClick: () => router.push('/stock/categories'),
                        color: 'cyan',
                      }}
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'produto' : 'produtos'}
                      {products.length < total &&
                        ` (${products.length} carregados)`}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/stock/products/${item.id}`)
                }
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(field as 'name' | 'createdAt' | 'updatedAt');
                    setSortOrder(direction);
                  }
                }}
              />

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}

          {/* Create Wizard */}
          <CreateProductWizard
            open={createOpen}
            onOpenChange={open => !open && setCreateOpen(false)}
            onSubmit={async data => {
              await createMutation.mutateAsync(data as ProductFormData);
              setCreateOpen(false);
            }}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para excluir este produto. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} produtos. Esta ação não pode ser desfeita.`
            }
          />

          {/* Rename Product Modal */}
          <RenameProductModal
            isOpen={renameModalOpen}
            onClose={() => {
              setRenameModalOpen(false);
              setRenameProduct(null);
            }}
            product={renameProduct}
            isSubmitting={updateMutation.isPending}
            onSubmit={handleRenameSubmit}
          />

          {/* Assign Category Modal */}
          <AssignCategoryModal
            isOpen={assignCategoryOpen}
            onClose={() => {
              setAssignCategoryOpen(false);
              setActionProductIds([]);
            }}
            productIds={actionProductIds}
            isSubmitting={updateMutation.isPending}
            onSubmit={handleAssignCategorySubmit}
          />

          {/* Assign Manufacturer Modal */}
          <AssignManufacturerModal
            isOpen={assignManufacturerOpen}
            onClose={() => {
              setAssignManufacturerOpen(false);
              setActionProductIds([]);
            }}
            productIds={actionProductIds}
            isSubmitting={updateMutation.isPending}
            onSubmit={handleAssignManufacturerSubmit}
          />

          {/* Product Variants & Items Modal (Two-column) */}
          <ProductVariantsItemsModal
            product={selectedProduct}
            open={productModalOpen}
            onOpenChange={open => {
              setProductModalOpen(open);
              if (!open) {
                setSelectedProduct(null);
              }
            }}
            onMoveItem={handleMoveItem}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
