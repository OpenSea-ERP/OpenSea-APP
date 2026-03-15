/**
 * OpenSea OS - Products Page
 * Página de gerenciamento de produtos usando o novo sistema OpenSea OS
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { productsConfig } from '@/config/entities/products.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
  useEntityCrud,
  useEntityPage,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { formatUnitOfMeasure } from '@/helpers/formatters';
import { usePermissions } from '@/hooks/use-permissions';
import { productsService } from '@/services/stock';
import type { Item, Product, UpdateProductRequest } from '@/types/stock';
import {
  Blocks,
  ExternalLink,
  Factory,
  Grid3x3,
  Package,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditProductForm } from './src/components';
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

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Quick-action modals state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameProduct, setRenameProduct] = useState<Product | null>(null);
  const [assignCategoryOpen, setAssignCategoryOpen] = useState(false);
  const [assignManufacturerOpen, setAssignManufacturerOpen] = useState(false);
  const [actionProductIds, setActionProductIds] = useState<string[]>([]);

  // ============================================================================
  // CRUD SETUP (always fetches ALL products - filtering is client-side)
  // ============================================================================

  const crud = useEntityCrud<Product>({
    entityName: 'Produto',
    entityNamePlural: 'Produtos',
    queryKey: ['products'],
    baseUrl: '/api/v1/products',
    listFn: async () => {
      const response = await productsService.listProducts();
      return response.products;
    },
    getFn: (id: string) => productsService.getProduct(id).then(r => r.product),
    createFn: data =>
      productsService
        .createProduct(data as ProductFormData)
        .then(r => r.product),
    updateFn: (id, data) =>
      productsService
        .updateProduct(id, data as UpdateProductRequest)
        .then(r => r.product),
    deleteFn: id => productsService.deleteProduct(id),
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<Product>({
    entityName: 'Produto',
    entityNamePlural: 'Produtos',
    queryKey: ['products'],
    crud,
    viewRoute: id => `/stock/products/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.fullCode?.toLowerCase().includes(q) ?? false) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      );
    },
  });

  // ============================================================================
  // CLIENT-SIDE URL FILTERS (applied on top of text-search filtered items)
  // ============================================================================

  // Apply URL-based filters on top of the text-search filtered items
  const displayedProducts = useMemo(() => {
    let items = page.filteredItems || [];
    if (templateIds.length > 0) {
      const set = new Set(templateIds);
      items = items.filter(
        (p: Product) => p.templateId && set.has(p.templateId)
      );
    }
    if (manufacturerIds.length > 0) {
      const set = new Set(manufacturerIds);
      items = items.filter(
        (p: Product) => p.manufacturerId && set.has(p.manufacturerId)
      );
    }
    if (categoryIds.length > 0) {
      const hasNone = categoryIds.includes('__none__');
      const realIds = categoryIds.filter(id => id !== '__none__');
      const set = new Set(realIds);
      items = items.filter((p: Product) => {
        const hasCategories =
          p.productCategories && p.productCategories.length > 0;
        if (hasNone && !hasCategories) return true;
        if (set.size > 0 && hasCategories) {
          return p.productCategories!.some(pc => set.has(pc.id));
        }
        return false;
      });
    }
    return items;
  }, [page.filteredItems, templateIds, manufacturerIds, categoryIds]);

  // Interdependent filter options: derive from ALL products (page.items = unfiltered)
  const allProducts = page.items || [];

  // Helper: narrow products by other active filters (excluding the one being computed)
  const narrowProducts = useCallback(
    (exclude: 'template' | 'manufacturer' | 'category') => {
      let filtered = allProducts;
      if (exclude !== 'template' && templateIds.length > 0) {
        const set = new Set(templateIds);
        filtered = filtered.filter(p => p.templateId && set.has(p.templateId));
      }
      if (exclude !== 'manufacturer' && manufacturerIds.length > 0) {
        const set = new Set(manufacturerIds);
        filtered = filtered.filter(
          p => p.manufacturerId && set.has(p.manufacturerId)
        );
      }
      if (exclude !== 'category' && categoryIds.length > 0) {
        const hasNone = categoryIds.includes('__none__');
        const realIds = categoryIds.filter(id => id !== '__none__');
        const set = new Set(realIds);
        filtered = filtered.filter(p => {
          const hasCategories =
            p.productCategories && p.productCategories.length > 0;
          if (hasNone && !hasCategories) return true;
          if (set.size > 0 && hasCategories) {
            return p.productCategories!.some(pc => set.has(pc.id));
          }
          return false;
        });
      }
      return filtered;
    },
    [allProducts, templateIds, manufacturerIds, categoryIds]
  );

  // Extract unique templates from products data
  const availableTemplates = useMemo(() => {
    const templateMap = new Map<string, { id: string; name: string }>();
    for (const product of allProducts) {
      if (product.templateId && product.template) {
        templateMap.set(product.templateId, {
          id: product.templateId,
          name: product.template.name,
        });
      }
    }

    if (manufacturerIds.length === 0 && categoryIds.length === 0) {
      return Array.from(templateMap.values());
    }

    const filtered = narrowProducts('template');
    const idsInFiltered = new Set(
      filtered.map(p => p.templateId).filter(Boolean)
    );
    return Array.from(templateMap.values()).filter(t =>
      idsInFiltered.has(t.id)
    );
  }, [allProducts, manufacturerIds, categoryIds, narrowProducts]);

  // Extract unique manufacturers from products data
  const availableManufacturers = useMemo(() => {
    const manufacturerMap = new Map<string, { id: string; name: string }>();
    for (const product of allProducts) {
      if (product.manufacturerId && product.manufacturer) {
        manufacturerMap.set(product.manufacturerId, {
          id: product.manufacturerId,
          name: product.manufacturer.name,
        });
      }
    }

    if (templateIds.length === 0 && categoryIds.length === 0) {
      return Array.from(manufacturerMap.values());
    }

    const filtered = narrowProducts('manufacturer');
    const idsInFiltered = new Set(
      filtered.map(p => p.manufacturerId).filter(Boolean)
    );
    return Array.from(manufacturerMap.values()).filter(m =>
      idsInFiltered.has(m.id)
    );
  }, [allProducts, templateIds, categoryIds, narrowProducts]);

  // Extract unique categories from products data (with "Sem Categoria" virtual option)
  const availableCategories = useMemo(() => {
    const noneOption = { id: '__none__', name: 'Sem categoria' };
    const categoryMap = new Map<string, { id: string; name: string }>();
    let hasUncategorized = false;

    for (const product of allProducts) {
      if (
        !product.productCategories ||
        product.productCategories.length === 0
      ) {
        hasUncategorized = true;
      }
      product.productCategories?.forEach(pc => {
        categoryMap.set(pc.id, { id: pc.id, name: pc.name });
      });
    }

    if (templateIds.length === 0 && manufacturerIds.length === 0) {
      const result = Array.from(categoryMap.values());
      return hasUncategorized ? [noneOption, ...result] : result;
    }

    const filtered = narrowProducts('category');
    const idsInFiltered = new Set<string>();
    let filteredHasUncategorized = false;
    for (const p of filtered) {
      if (!p.productCategories || p.productCategories.length === 0) {
        filteredHasUncategorized = true;
      }
      p.productCategories?.forEach(pc => idsInFiltered.add(pc.id));
    }
    const result = Array.from(categoryMap.values()).filter(c =>
      idsInFiltered.has(c.id)
    );
    return filteredHasUncategorized ? [noneOption, ...result] : result;
  }, [allProducts, templateIds, manufacturerIds, narrowProducts]);

  // Build URL preserving all filter params (comma-separated for multi-select)
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
    (ids: string[]) => {
      router.push(buildFilterUrl({ template: ids }));
    },
    [router, buildFilterUrl]
  );

  const setManufacturerFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ manufacturer: ids }));
    },
    [router, buildFilterUrl]
  );

  const setCategoryFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ category: ids }));
    },
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

  // Context menu handlers
  const handleContextView = (ids: string[]) => {
    page.handlers.handleItemsView(ids);
  };

  const handleContextEdit = (ids: string[]) => {
    page.handlers.handleItemsEdit(ids);
  };

  const handleContextDelete = (ids: string[]) => {
    page.modals.setItemsToDelete(ids);
    page.modals.open('delete');
  };

  // Quick-action context menu handlers
  const handleContextRename = useCallback(
    (ids: string[]) => {
      const product = crud.items?.find(p => p.id === ids[0]) || null;
      setRenameProduct(product);
      setRenameModalOpen(true);
    },
    [crud.items]
  );

  const handleContextAssignCategory = useCallback((ids: string[]) => {
    setActionProductIds(ids);
    setAssignCategoryOpen(true);
  }, []);

  const handleContextAssignManufacturer = useCallback((ids: string[]) => {
    setActionProductIds(ids);
    setAssignManufacturerOpen(true);
  }, []);

  // Quick-action submit handlers
  const handleRenameSubmit = useCallback(
    async (id: string, data: { name: string }) => {
      await crud.update(id, data as UpdateProductRequest);
    },
    [crud]
  );

  const handleAssignCategorySubmit = useCallback(
    async (ids: string[], categoryId: string) => {
      for (const id of ids) {
        await crud.update(id, {
          categoryIds: [categoryId],
        } as UpdateProductRequest);
      }
      await crud.invalidate();
      toast.success(
        ids.length === 1
          ? 'Categoria atribuída com sucesso!'
          : `Categoria atribuída a ${ids.length} produtos!`
      );
    },
    [crud]
  );

  const handleAssignManufacturerSubmit = useCallback(
    async (ids: string[], manufacturerId: string) => {
      for (const id of ids) {
        await crud.update(id, { manufacturerId } as UpdateProductRequest);
      }
      await crud.invalidate();
      toast.success(
        ids.length === 1
          ? 'Fabricante atribuído com sucesso!'
          : `Fabricante atribuído a ${ids.length} produtos!`
      );
    },
    [crud]
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
    const variantLabel = item.variants?.length
      ? `${item.variants.length} variante${item.variants.length !== 1 ? 's' : ''}`
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
          title={item.name}
          subtitle={manufacturerName || 'Fabricante não informado'}
          icon={Package}
          iconBgColor="bg-linear-to-br from-blue-500 to-cyan-600"
          badges={[
            { label: templateName, variant: 'default' },
            { label: unitOfMeasure, variant: 'default' },
            ...(item.outOfLine
              ? [{ label: 'Fora de Linha', variant: 'warning' as const }]
              : []),
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
              color: 'emerald',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">Categoria:</span>
            <span className="truncate">{categoryNames}</span>
          </div>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Product, isSelected: boolean) => {
    const templateName = item.template?.name || 'Template';
    const unitOfMeasure = formatUnitOfMeasure(
      item.template?.unitOfMeasure || 'UNITS'
    );
    const manufacturerName = item.manufacturer?.name;
    const variantLabel = item.variants?.length
      ? `${item.variants.length} variante${item.variants.length !== 1 ? 's' : ''}`
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
          variant="list"
          title={item.name}
          subtitle={manufacturerName || item.fullCode}
          icon={Package}
          iconBgColor="bg-linear-to-br from-blue-500 to-cyan-600"
          badges={[
            { label: templateName, variant: 'default' },
            { label: unitOfMeasure, variant: 'default' },
            ...(item.outOfLine
              ? [{ label: 'Fora de Linha', variant: 'warning' as const }]
              : []),
            ...(item.status !== 'ACTIVE'
              ? [
                  {
                    label: item.status === 'INACTIVE' ? 'Inativo' : 'Arquivado',
                    variant: 'secondary' as const,
                  },
                ]
              : []),
          ]}
          metadata={
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 shrink-0" />
              <span className="truncate">{categoryNames}</span>
            </div>
          }
          footer={{
            type: 'single',
            button: {
              icon: Grid3x3,
              label: variantLabel,
              onClick: () => handleProductClick(item),
              color: 'blue',
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

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedIds = useMemo(
    () => Array.from(page.selection?.state.selectedIds || []),
    [page.selection?.state.selectedIds]
  );

  const hasSelection = selectedIds.length > 0;

  // Memoize initialIds para evitar recálculos desnecessários
  const initialIds = useMemo(
    () =>
      (Array.isArray(displayedProducts) ? displayedProducts : []).map(
        i => i.id
      ),
    [displayedProducts]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleImport = useCallback(() => {
    router.push('/import/stock/products/home');
  }, [router]);

  const handleCreate = useCallback(() => {
    page.modals.open('create');
  }, [page.modals]);

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
            value={page.searchQuery}
            onSearch={value => page.handlers.handleSearch(value)}
            onClear={() => page.handlers.handleSearch('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {page.isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : page.error ? (
            <GridError
              type="server"
              title="Erro ao carregar produtos"
              message="Ocorreu um erro ao tentar carregar os produtos. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={productsConfig}
              items={displayedProducts}
              toolbarStart={
                <>
                  <FilterDropdown
                    label="Template"
                    icon={Blocks}
                    options={availableTemplates.map(t => ({
                      id: t.id,
                      label: t.name,
                    }))}
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
                    options={availableManufacturers.map(m => ({
                      id: m.id,
                      label: m.name,
                    }))}
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
                    options={availableCategories.map(c => ({
                      id: c.id,
                      label: c.name,
                    }))}
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
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={page.isLoading}
              isSearching={!!page.searchQuery}
              onItemClick={(item, e) => page.handlers.handleItemClick(item, e)}
              onItemDoubleClick={item =>
                page.handlers.handleItemDoubleClick(item)
              }
              showSorting={true}
              defaultSortField="name"
              defaultSortDirection="asc"
            />
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={displayedProducts.length}
              onClear={() => page.selection?.actions.clear()}
              onSelectAll={() => page.selection?.actions.selectAll()}
              defaultActions={{
                view: true,
                edit: true,
                duplicate: false,
                delete: true,
              }}
              handlers={{
                onView: page.handlers.handleItemsView,
                onEdit: page.handlers.handleItemsEdit,
                onDelete: page.handlers.handleItemsDelete,
              }}
            />
          )}

          {/* Create Wizard */}
          <CreateProductWizard
            open={page.modals.isOpen('create')}
            onOpenChange={open => !open && page.modals.close('create')}
            onSubmit={async data => {
              await crud.create(data);
            }}
          />

          {/* Edit Modal */}
          <Dialog
            open={page.modals.isOpen('edit')}
            onOpenChange={open => !open && page.modals.close('edit')}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Produto</DialogTitle>
              </DialogHeader>
              {page.modals.editingItem && (
                <EditProductForm
                  product={page.modals.editingItem}
                  onSubmit={async data => {
                    await crud.update(page.modals.editingItem!.id, data);
                    page.modals.close('edit');
                  }}
                  onCancel={() => page.modals.close('edit')}
                  isSubmitting={crud.isUpdating}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            onSuccess={() => page.handlers.handleDeleteConfirm()}
            title="Confirmar Exclusão"
            description={
              page.modals.itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para excluir este produto. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${page.modals.itemsToDelete.length} produtos. Esta ação não pode ser desfeita.`
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
            isSubmitting={crud.isUpdating}
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
            isSubmitting={crud.isUpdating}
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
            isSubmitting={crud.isUpdating}
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
