/**
 * OpenSea OS - Templates Page
 * Página de gerenciamento de templates usando o novo sistema OpenSea OS
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
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
  useEntityCrud,
  useEntityPage,
  type SortDirection,
} from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { productsService, templatesService } from '@/services/stock';
import type { Template } from '@/types/stock';
import {
  ChevronRight,
  Copy,
  Import,
  Package,
  Pencil,
  Plus,
  Shirt,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GrObjectGroup } from 'react-icons/gr';
import {
  CreateModal,
  createTemplate,
  DeleteConfirmModal,
  deleteTemplate,
  DuplicateConfirmModal,
  duplicateTemplate,
  getUnitLabel,
  RenameTemplateModal,
  templatesConfig,
  updateTemplate,
} from './src';

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // STATE
  // ============================================================================

  const [createFormKey, setCreateFormKey] = useState(0);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTemplate, setRenameTemplate] = useState<Template | null>(null);
  const [productsCountByTemplateId, setProductsCountByTemplateId] = useState<
    Record<string, number>
  >({});

  // ============================================================================
  // CRUD SETUP
  // ============================================================================

  const crud = useEntityCrud<Template>({
    entityName: 'Modelo',
    entityNamePlural: 'Modelos',
    queryKey: ['templates'],
    baseUrl: '/api/v1/templates',
    listFn: async () => {
      const response = await templatesService.listTemplates();
      return response.templates;
    },
    getFn: (id: string) =>
      templatesService.getTemplate(id).then(r => r.template),
    createFn: createTemplate,
    updateFn: updateTemplate,
    deleteFn: deleteTemplate,
    duplicateFn: duplicateTemplate,
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<Template>({
    entityName: 'Modelo',
    entityNamePlural: 'Modelos',
    queryKey: ['templates'],
    crud,
    viewRoute: id => `/stock/templates/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return item.name.toLowerCase().includes(q);
    },
    duplicateConfig: {
      getNewName: item => `${item.name} (cópia)`,
      getData: item => ({
        name: `${item.name} (cópia)`,
        unitOfMeasure: item.unitOfMeasure,
        productAttributes: item.productAttributes,
        variantAttributes: item.variantAttributes,
        itemAttributes: item.itemAttributes,
        specialModules: item.specialModules,
      }),
    },
  });

  // ==========================================================================
  // OPEN CREATE MODAL VIA URL PARAM
  // ==========================================================================
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      page.modals.open('create');
      window.history.replaceState(null, '', '/stock/templates');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ==========================================================================
  // LOAD PRODUCTS COUNT FOR EACH TEMPLATE (guarded by stable id key)
  // ==========================================================================
  const templateIdsKey = useMemo(
    () =>
      page.filteredItems
        .map(item => item.id)
        .sort()
        .join('|'),
    [page.filteredItems]
  );

  useEffect(() => {
    let isMounted = true;
    async function loadCounts() {
      const entries = await Promise.all(
        page.filteredItems.map(async t => {
          try {
            const resp = await productsService.listProducts(t.id);
            return [t.id, resp.products?.length || 0] as const;
          } catch {
            return [t.id, 0] as const;
          }
        })
      );
      if (isMounted) {
        setProductsCountByTemplateId(prev => {
          const next = Object.fromEntries(entries);
          const same =
            Object.keys(next).length === Object.keys(prev).length &&
            Object.entries(next).every(([k, v]) => prev[k] === v);
          return same ? prev : next;
        });
      }
    }

    if (templateIdsKey) {
      loadCounts();
    } else {
      setProductsCountByTemplateId({});
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateIdsKey]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/templates/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/templates/${ids[0]}/edit`);
    }
  };

  const handleContextRename = useCallback(
    (ids: string[]) => {
      const template = crud.items?.find(t => t.id === ids[0]) || null;
      setRenameTemplate(template);
      setRenameModalOpen(true);
    },
    [crud.items]
  );

  const handleRenameSubmit = useCallback(
    async (id: string, data: { name: string }) => {
      await crud.update(id, data as Partial<Template>);
      await crud.invalidate();
      setRenameModalOpen(false);
      setRenameTemplate(null);
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

  const getTemplateBadges = (item: Template) => {
    const count =
      (Object.keys(item.productAttributes || {}).length || 0) +
      (Object.keys(item.variantAttributes || {}).length || 0) +
      (Object.keys(item.itemAttributes || {}).length || 0);

    const badges: {
      label: string;
      variant: 'outline';
      icon?: typeof Package;
      color?: string;
    }[] = [
      {
        label: `${count} atributo${count !== 1 ? 's' : ''}`,
        variant: 'outline',
        icon: SlidersHorizontal,
        color:
          'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      },
    ];
    if (item.specialModules?.includes('CARE_INSTRUCTIONS')) {
      badges.push({
        label: 'Conservação Têxtil',
        variant: 'outline',
        icon: Shirt,
        color:
          'border-purple-600/25 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/8 text-purple-700 dark:text-purple-300',
      });
    }
    if (!item.isActive) {
      badges.push({
        label: 'Inativo',
        variant: 'outline',
        color:
          'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
      });
    }
    return badges;
  };

  const renderGridCard = (item: Template, isSelected: boolean) => {
    const productsCount = productsCountByTemplateId[item.id] ?? 0;

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
          subtitle={getUnitLabel(item.unitOfMeasure)}
          thumbnail={item.iconUrl}
          thumbnailFallback={<GrObjectGroup className="w-6 h-6 text-white" />}
          iconBgColor="bg-linear-to-br from-purple-500 to-pink-600"
          badges={getTemplateBadges(item)}
          footer={{
            type: 'single',
            button: {
              icon: Package,
              label: `${productsCount} produto${productsCount !== 1 ? 's' : ''}`,
              href: `/stock/products?template=${item.id}`,
              color: 'emerald',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt ?? undefined}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Template, isSelected: boolean) => {
    const productsCount = productsCountByTemplateId[item.id] ?? 0;
    const listBadges = getTemplateBadges(item);

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
              <span className="text-xs text-muted-foreground shrink-0">
                {getUnitLabel(item.unitOfMeasure).match(/\(([^)]+)\)/)?.[1] ||
                  getUnitLabel(item.unitOfMeasure)}
              </span>
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
          thumbnail={item.iconUrl}
          thumbnailFallback={<GrObjectGroup className="w-5 h-5 text-white" />}
          iconBgColor="bg-linear-to-br from-purple-500 to-pink-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt ?? undefined}
          showStatusBadges={true}
        >
          <Link
            href={`/stock/products?template=${item.id}`}
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
    () => page.filteredItems.map(i => i.id),
    [page.filteredItems]
  );

  const customSortByUnit = (
    a: Template,
    b: Template,
    direction: SortDirection
  ) => {
    const unitA = a.unitOfMeasure?.toLowerCase() ?? '';
    const unitB = b.unitOfMeasure?.toLowerCase() ?? '';
    const result = unitA.localeCompare(unitB, 'pt-BR');
    return direction === 'asc' ? result : -result;
  };

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const handleCreate = useCallback(() => {
    page.modals.open('create');
  }, [page.modals]);

  const handleImport = useCallback(() => {
    router.push('/import/templates');
  }, [router]);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'import-templates',
        title: 'Importar',
        icon: Import,
        onClick: handleImport,
        variant: 'ghost',
        permission: templatesConfig.permissions.import,
      },
      {
        id: 'create-template',
        title: 'Novo Template',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: templatesConfig.permissions.create,
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
        namespace: 'templates',
        initialIds,
      }}
    >
      <PageLayout>
        {/* Action Bar */}
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Templates', href: '/stock/templates' },
            ]}
            buttons={visibleActionButtons}
          />

          {/* Header */}
          <Header
            title="Templates"
            description="Gerencie os templates de produtos"
            buttons={[]}
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={page.searchQuery}
            placeholder={templatesConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar templates"
              message="Ocorreu um erro ao tentar carregar os templates. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={templatesConfig}
              items={page.filteredItems}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={page.isLoading}
              isSearching={!!page.searchQuery}
              onItemClick={(item, e) => page.handlers.handleItemClick(item, e)}
              onItemDoubleClick={item =>
                page.handlers.handleItemDoubleClick(item)
              }
              showSorting={true}
              showItemCount={false}
              toolbarStart={
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Total de {page.filteredItems.length}{' '}
                  {page.filteredItems.length === 1 ? 'template' : 'templates'}
                </p>
              }
              defaultSortField="name"
              defaultSortDirection="asc"
              customSortFn={customSortByUnit}
              customSortLabel="Unidade de Medida"
            />
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={page.filteredItems.length}
              onClear={() => page.selection?.actions.clear()}
              onSelectAll={() => page.selection?.actions.selectAll()}
              defaultActions={{
                view: true,
                edit: true,
                duplicate: true,
                delete: true,
              }}
              handlers={{
                onView: page.handlers.handleItemsView,
                onEdit: page.handlers.handleItemsEdit,
                onDuplicate: page.handlers.handleItemsDuplicate,
                onDelete: page.handlers.handleItemsDelete,
              }}
            />
          )}

          {/* Rename Modal */}
          <RenameTemplateModal
            isOpen={renameModalOpen}
            onClose={() => {
              setRenameModalOpen(false);
              setRenameTemplate(null);
            }}
            template={renameTemplate}
            isSubmitting={crud.isUpdating}
            onSubmit={handleRenameSubmit}
          />

          {/* Create Modal */}
          <CreateModal
            isOpen={page.modals.isOpen('create')}
            onClose={() => page.modals.close('create')}
            isSubmitting={crud.isCreating}
            formKey={createFormKey}
            focusTrigger={createFormKey}
            onSubmit={async data => {
              await crud.create(data);
              setCreateFormKey(prev => prev + 1);
            }}
          />

          {/* Delete Confirmation */}
          <DeleteConfirmModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            itemCount={page.modals.itemsToDelete.length}
            onConfirm={page.handlers.handleDeleteConfirm}
            isLoading={crud.isDeleting}
          />

          {/* Duplicate Confirmation */}
          <DuplicateConfirmModal
            isOpen={page.modals.isOpen('duplicate')}
            onClose={() => page.modals.close('duplicate')}
            itemCount={page.modals.itemsToDuplicate.length}
            onConfirm={page.handlers.handleDuplicateConfirm}
            isLoading={crud.isDuplicating}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
