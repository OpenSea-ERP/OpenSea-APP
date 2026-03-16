/**
 * OpenSea OS - Product Categories Page
 * Pagina de gerenciamento de categorias de produtos
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { categoriesConfig } from '@/config/entities/categories.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
  useEntityCrud,
  useEntityPage,
} from '@/core';
import { useReorderCategories } from '@/hooks/stock/use-categories';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { categoriesService } from '@/services/stock';
import type { Category } from '@/types/stock';
import {
  ArrowUpDown,
  Check,
  ChevronRight,
  Copy,
  FolderTree,
  Package,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PiFolderOpenDuotone } from 'react-icons/pi';
import {
  SortableCategoryList,
  type SortableCategoryListRef,
} from './src/components/sortable-category-list';
import { CreateModal, RenameCategoryModal } from './src/modals';

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

export default function ProductCategoriesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const reorderMutation = useReorderCategories();
  const sortableRef = useRef<SortableCategoryListRef>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameCategory, setRenameCategory] = useState<Category | null>(null);

  // ============================================================================
  // CRUD SETUP
  // ============================================================================

  const crud = useEntityCrud<Category>({
    entityName: 'Categoria',
    entityNamePlural: 'Categorias',
    queryKey: ['categories'],
    baseUrl: '/v1/categories',
    listFn: async () => {
      const response = await categoriesService.listCategories();
      return response.categories;
    },
    getFn: async (id: string) => {
      const response = await categoriesService.getCategory(id);
      return response.category;
    },
    createFn: async (data: Partial<Category>) => {
      const response = await categoriesService.createCategory(
        data as Parameters<typeof categoriesService.createCategory>[0]
      );
      return response.category;
    },
    updateFn: async (id: string, data: Partial<Category>) => {
      const response = await categoriesService.updateCategory(
        id,
        data as Parameters<typeof categoriesService.updateCategory>[1]
      );
      return response.category;
    },
    deleteFn: async (id: string) => {
      await categoriesService.deleteCategory(id);
    },
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<Category>({
    entityName: 'Categoria',
    entityNamePlural: 'Categorias',
    queryKey: ['categories'],
    crud,
    viewRoute: id => `/stock/product-categories/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.slug?.toLowerCase().includes(q) ||
        false
      );
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/product-categories/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/product-categories/${ids[0]}/edit`);
    }
  };

  const handleContextRename = useCallback(
    (ids: string[]) => {
      const category = crud.items?.find(c => c.id === ids[0]) || null;
      setRenameCategory(category);
      setRenameModalOpen(true);
    },
    [crud.items]
  );

  const handleRenameSubmit = useCallback(
    async (id: string, data: { name: string }) => {
      await crud.update(id, data as Partial<Category>);
      await crud.invalidate();
      setRenameModalOpen(false);
      setRenameCategory(null);
    },
    [crud]
  );

  const handleContextDuplicate = (ids: string[]) => {
    page.handlers.handleItemsDuplicate(ids);
  };

  const handleContextDelete = (ids: string[]) => {
    page.modals.setItemsToDelete(ids);
    page.modals.open('delete');
  };

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const contextActions = useMemo(
    () => [
      {
        id: 'rename',
        label: 'Renomear',
        icon: Pencil,
        onClick: handleContextRename,
        hidden: (ids: string[]) => ids.length > 1,
      },
      {
        id: 'duplicate',
        label: 'Duplicar',
        icon: Copy,
        onClick: handleContextDuplicate,
        separator: 'before' as const,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: handleContextDelete,
        variant: 'destructive' as const,
        separator: 'before' as const,
      },
    ],
    [handleContextRename]
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const getCategoryBadges = (item: Category) => {
    const badges: {
      label: string;
      variant: 'outline';
      icon?: typeof Package;
      color?: string;
    }[] = [
      {
        label: `${item.childrenCount || 0} subcategoria${(item.childrenCount || 0) !== 1 ? 's' : ''}`,
        variant: 'outline',
        icon: FolderTree,
        color:
          'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      },
      {
        label: `${item.productCount || 0} produto${(item.productCount || 0) !== 1 ? 's' : ''}`,
        variant: 'outline',
        icon: Package,
        color:
          'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      },
    ];
    if (!item.isActive) {
      badges.push({
        label: 'Inativa',
        variant: 'outline',
        color:
          'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
      });
    }
    return badges;
  };

  const renderGridCard = (item: Category, isSelected: boolean) => {
    const productsCount = item.productCount || 0;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={item.description || 'Sem descricao'}
          thumbnail={item.iconUrl || undefined}
          thumbnailFallback={
            <PiFolderOpenDuotone className="w-6 h-6 text-white" />
          }
          iconBgColor="bg-linear-to-br from-blue-500 to-purple-600"
          badges={getCategoryBadges(item)}
          footer={{
            type: 'single',
            button: {
              icon: Package,
              label: `${productsCount} produto${productsCount !== 1 ? 's' : ''}`,
              href: `/stock/products?category=${item.id}`,
              color: 'emerald',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          onDoubleClick={() =>
            router.push(`/stock/product-categories/${item.id}`)
          }
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Category, isSelected: boolean) => {
    const productsCount = item.productCount || 0;
    const listBadges = getCategoryBadges(item);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </span>
              {!item.isActive && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0 border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300">
                  Inativa
                </span>
              )}
            </span>
          }
          subtitle={item.description || 'Sem descricao'}
          metadata={
            <div className="flex items-center gap-1.5 mt-0.5">
              {listBadges
                .filter(b => b.icon)
                .map((badge, i) => (
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
          thumbnail={item.iconUrl || undefined}
          thumbnailFallback={
            <PiFolderOpenDuotone className="w-5 h-5 text-white" />
          }
          iconBgColor="bg-linear-to-br from-blue-500 to-purple-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          onDoubleClick={() =>
            router.push(`/stock/product-categories/${item.id}`)
          }
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        >
          <Link
            href={`/stock/products?category=${item.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <Package className="h-3.5 w-3.5" />
            {productsCount} produto{productsCount !== 1 ? 's' : ''}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedIds = Array.from(page.selection?.state.selectedIds || []);
  const hasSelection = selectedIds.length > 0;

  const initialIds = useMemo(
    () =>
      Array.isArray(page.filteredItems)
        ? page.filteredItems.map(i => i.id)
        : [],
    [page.filteredItems]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleImport = useCallback(() => {
    router.push('/import/stock/product-categories');
  }, [router]);

  const handleCreate = useCallback(() => {
    page.modals.open('create');
  }, [page.modals]);

  const handleFinishReorder = useCallback(() => {
    if (sortableRef.current) {
      reorderMutation.mutate(sortableRef.current.getReorderedItems());
    }
    setIsReorderMode(false);
  }, [reorderMutation]);

  const actionButtons: ActionButtonWithPermission[] = isReorderMode
    ? [
        {
          id: 'cancel-reorder',
          title: 'Cancelar',
          icon: X,
          onClick: () => setIsReorderMode(false),
          variant: 'outline' as const,
        },
        {
          id: 'finish-reorder',
          title: 'Concluir',
          icon: Check,
          onClick: handleFinishReorder,
          variant: 'default' as const,
        },
      ]
    : [
        {
          id: 'reorder-categories',
          title: 'Reordenar',
          icon: ArrowUpDown,
          onClick: () => setIsReorderMode(true),
          variant: 'outline' as const,
          permission: categoriesConfig.permissions?.update,
        },
        {
          id: 'import-categories',
          title: 'Importar',
          icon: Upload,
          onClick: handleImport,
          variant: 'outline' as const,
          permission: categoriesConfig.permissions?.import,
        },
        {
          id: 'create-category',
          title: 'Nova Categoria',
          icon: Plus,
          onClick: handleCreate,
          variant: 'default' as const,
          permission: categoriesConfig.permissions?.create,
        },
      ];

  // eslint-disable-next-line react-hooks/refs -- ref is only accessed inside onClick callbacks, not during render
  const visibleActionButtons: HeaderButton[] = actionButtons
    .filter(button =>
      button.permission ? hasPermission(button.permission) : true
    )
    .map(({ permission, ...button }) => button);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'categories',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Categorias', href: '/stock/product-categories' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Categorias de Produtos"
            description="Gerencie as categorias dos seus produtos"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          {!isReorderMode && (
            <SearchBar
              placeholder="Buscar categorias..."
              value={page.searchQuery}
              onSearch={value => page.handlers.handleSearch(value)}
              onClear={() => page.handlers.handleSearch('')}
              showClear={true}
              size="md"
            />
          )}

          {/* Grid/List View or Reorder Mode */}
          {isReorderMode ? (
            <SortableCategoryList
              ref={sortableRef}
              items={page.filteredItems}
            />
          ) : page.isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : page.error ? (
            <GridError
              type="server"
              title="Erro ao carregar categorias"
              message="Ocorreu um erro ao tentar carregar as categorias. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={categoriesConfig}
              items={page.filteredItems}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={page.isLoading}
              isSearching={!!page.searchQuery}
              showSorting={true}
              showItemCount={false}
              toolbarStart={
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Total de {page.filteredItems.length}{' '}
                  {page.filteredItems.length === 1
                    ? 'categoria'
                    : 'categorias'}
                </p>
              }
              defaultSortField="name"
              defaultSortDirection="asc"
            />
          )}

          {/* Selection Toolbar */}
          {!isReorderMode && hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={
                Array.isArray(page.filteredItems)
                  ? page.filteredItems.length
                  : 0
              }
              onClear={() => page.selection?.actions.clear()}
              onSelectAll={() => page.selection?.actions.selectAll()}
              defaultActions={{
                view: true,
                edit: true,
                delete: true,
              }}
              handlers={{
                onView: page.handlers.handleItemsView,
                onEdit: page.handlers.handleItemsEdit,
                onDelete: page.handlers.handleItemsDelete,
              }}
            />
          )}

          {/* Rename Modal */}
          <RenameCategoryModal
            isOpen={renameModalOpen}
            onClose={() => {
              setRenameModalOpen(false);
              setRenameCategory(null);
            }}
            category={renameCategory}
            isSubmitting={crud.isUpdating}
            onSubmit={handleRenameSubmit}
          />

          {/* Create Modal */}
          <CreateModal
            isOpen={page.modals.isOpen('create')}
            onClose={() => page.modals.close('create')}
            onSubmit={async data => {
              await page.handlers.handleQuickCreate(data);
            }}
          />

          {/* Delete PIN Confirmation */}
          <VerifyActionPinModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            onSuccess={page.handlers.handleDeleteConfirm}
            title="Excluir Categoria"
            description={`Digite seu PIN de acao para excluir ${page.modals.itemsToDelete.length} item(ns).`}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
