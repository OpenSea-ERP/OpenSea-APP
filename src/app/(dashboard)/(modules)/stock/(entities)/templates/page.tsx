/**
 * OpenSea OS - Templates Page
 * Página de gerenciamento de templates com infinite scroll e filtros server-side
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
} from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useTemplatesInfinite,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  type InfiniteListFilters,
} from '@/hooks/stock/use-stock-other';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { productsService } from '@/services/stock';
import type {
  CreateTemplateRequest,
  Template,
  UpdateTemplateRequest,
} from '@/types/stock';
import {
  ChevronRight,
  Copy,
  Import,
  Loader2,
  Package,
  Pencil,
  Plus,
  Shirt,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GrObjectGroup } from 'react-icons/gr';
import { toast } from 'sonner';
import {
  CreateModal,
  DeleteConfirmModal,
  DuplicateConfirmModal,
  duplicateTemplate,
  getUnitLabel,
  RenameTemplateModal,
  templatesConfig,
} from './src';

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER & SORTING STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>(
    'name'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [createFormKey, setCreateFormKey] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [itemsToDuplicate, setItemsToDuplicate] = useState<string[]>([]);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTemplateItem, setRenameTemplateItem] = useState<Template | null>(
    null
  );
  const [productsCountByTemplateId, setProductsCountByTemplateId] = useState<
    Record<string, number>
  >({});

  // ============================================================================
  // DATA: Infinite scroll templates
  // ============================================================================

  const filters: InfiniteListFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, sortBy, sortOrder]
  );

  const {
    items,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useTemplatesInfinite(filters);

  // Mutations
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

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

  // ==========================================================================
  // OPEN CREATE MODAL VIA URL PARAM
  // ==========================================================================
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateModalOpen(true);
      window.history.replaceState(null, '', '/stock/templates');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ==========================================================================
  // LOAD PRODUCTS COUNT FOR EACH TEMPLATE (guarded by stable id key)
  // ==========================================================================
  const templateIdsKey = useMemo(
    () =>
      items
        .map(item => item.id)
        .sort()
        .join('|'),
    [items]
  );

  useEffect(() => {
    let isMounted = true;
    async function loadCounts() {
      const entries = await Promise.all(
        items.map(async t => {
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
      const template = items.find(t => t.id === ids[0]) || null;
      setRenameTemplateItem(template);
      setRenameModalOpen(true);
    },
    [items]
  );

  const handleRenameSubmit = useCallback(
    async (id: string, data: { name: string }) => {
      await updateMutation.mutateAsync({
        id,
        data: data as UpdateTemplateRequest,
      });
      setRenameModalOpen(false);
      setRenameTemplateItem(null);
    },
    [updateMutation]
  );

  const handleContextDuplicate = useCallback((ids: string[]) => {
    setItemsToDuplicate(ids);
    setDuplicateModalOpen(true);
  }, []);

  const handleDuplicateConfirm = useCallback(async () => {
    for (const id of itemsToDuplicate) {
      const template = items.find(t => t.id === id);
      if (template) {
        await duplicateTemplate(id, {
          name: `${template.name} (cópia)`,
        });
      }
    }
    setDuplicateModalOpen(false);
    setItemsToDuplicate([]);
    await refetch();
    toast.success(
      itemsToDuplicate.length === 1
        ? 'Template duplicado com sucesso!'
        : `${itemsToDuplicate.length} templates duplicados!`
    );
  }, [itemsToDuplicate, items, refetch]);

  const handleContextDelete = useCallback((ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Template excluído com sucesso!'
        : `${itemsToDelete.length} templates excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

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
    [handleContextRename, handleContextDuplicate, handleContextDelete]
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

  const initialIds = useMemo(() => items.map(i => i.id), [items]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const handleCreate = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const handleImport = useCallback(() => {
    router.push('/import/stock/templates');
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
            value={searchQuery}
            placeholder={templatesConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar templates"
              message="Ocorreu um erro ao tentar carregar os templates. Por favor, tente novamente."
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
                config={templatesConfig}
                items={items}
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/stock/templates/${item.id}`)
                }
                showSorting={true}
                showItemCount={false}
                toolbarStart={
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {total} {total === 1 ? 'template' : 'templates'}
                    {items.length < total && ` (${items.length} carregados)`}
                  </p>
                }
                defaultSortField="name"
                defaultSortDirection="asc"
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

          {/* Rename Modal */}
          <RenameTemplateModal
            isOpen={renameModalOpen}
            onClose={() => {
              setRenameModalOpen(false);
              setRenameTemplateItem(null);
            }}
            template={renameTemplateItem}
            isSubmitting={updateMutation.isPending}
            onSubmit={handleRenameSubmit}
          />

          {/* Create Modal */}
          <CreateModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            isSubmitting={createMutation.isPending}
            formKey={createFormKey}
            focusTrigger={createFormKey}
            onSubmit={async data => {
              await createMutation.mutateAsync(data as CreateTemplateRequest);
              setCreateFormKey(prev => prev + 1);
              setCreateModalOpen(false);
            }}
          />

          {/* Delete Confirmation */}
          <DeleteConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            itemCount={itemsToDelete.length}
            onConfirm={handleDeleteConfirm}
            isLoading={deleteMutation.isPending}
          />

          {/* Duplicate Confirmation */}
          <DuplicateConfirmModal
            isOpen={duplicateModalOpen}
            onClose={() => setDuplicateModalOpen(false)}
            itemCount={itemsToDuplicate.length}
            onConfirm={handleDuplicateConfirm}
            isLoading={false}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
