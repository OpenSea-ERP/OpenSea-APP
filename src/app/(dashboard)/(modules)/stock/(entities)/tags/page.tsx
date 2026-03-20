/**
 * OpenSea OS - Tags Page
 * Página de gerenciamento de tags com infinite scroll e filtros server-side
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
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useTagsInfinite,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  type InfiniteListFilters,
} from '@/hooks/stock/use-stock-other';
import type { Tag } from '@/types/stock';
import { Loader2, Plus, Tag as TagIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  CreateModal,
  DeleteConfirmModal,
  EditModal,
  tagsConfig,
  ViewModal,
} from './src';

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

export default function TagsPage() {
  const { hasPermission } = usePermissions();

  // ============================================================================
  // SEARCH & SORT STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>(
    'name'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // ============================================================================
  // MODAL STATE
  // ============================================================================

  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Tag | null>(null);
  const [editingItem, setEditingItem] = useState<Tag | null>(null);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // ============================================================================
  // DATA: Infinite scroll tags
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
  } = useTagsInfinite(filters);

  // Mutations
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

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
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      const item = items.find(i => i.id === ids[0]);
      if (item) {
        setViewingItem(item);
        setViewOpen(true);
      }
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      const item = items.find(i => i.id === ids[0]);
      if (item) {
        setEditingItem(item);
        setEditOpen(true);
      }
    }
  };

  const handleContextDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setViewOpen(false);
    setDeleteOpen(true);
  };

  const handleDoubleClick = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setViewingItem(item);
      setViewOpen(true);
    }
  };

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Tag excluída com sucesso!'
        : `${itemsToDelete.length} tags excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Tag, isSelected: boolean) => {
    const isActive = !item.deletedAt;
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        onDelete={handleContextDelete}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={item.description || 'Sem descrição'}
          icon={TagIcon}
          iconBgColor="bg-linear-to-br from-purple-500 to-pink-600"
          badges={[
            {
              label: isActive ? 'Ativa' : 'Inativa',
              variant: isActive ? 'default' : 'secondary',
            },
          ]}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          onDoubleClick={() => handleDoubleClick(item.id)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Tag, isSelected: boolean) => {
    const isActive = !item.deletedAt;
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        onDelete={handleContextDelete}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={item.description || 'Sem descrição'}
          icon={TagIcon}
          iconBgColor="bg-linear-to-br from-purple-500 to-pink-600"
          badges={[
            {
              label: isActive ? 'Ativa' : 'Inativa',
              variant: isActive ? 'default' : 'secondary',
            },
          ]}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          onDoubleClick={() => handleDoubleClick(item.id)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
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
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-tag',
        title: 'Nova Tag',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: tagsConfig.permissions?.create,
      },
    ],
    [handleCreate]
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
        namespace: 'tags',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Tags', href: '/stock/tags' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Tags"
            description="Gerencie as etiquetas para categorizar seus produtos"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={tagsConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar tags"
              message="Ocorreu um erro ao tentar carregar as tags. Por favor, tente novamente."
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
                config={tagsConfig}
                items={items}
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                showItemCount={false}
                toolbarStart={
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {total} {total === 1 ? 'tag' : 'tags'}
                    {items.length < total && ` (${items.length} carregados)`}
                  </p>
                }
                onItemDoubleClick={item => handleDoubleClick(item.id)}
                showSorting={true}
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

          {/* Create Modal */}
          <CreateModal
            isOpen={createOpen}
            onClose={() => setCreateOpen(false)}
            onSubmit={async data => {
              await createMutation.mutateAsync(
                data as Parameters<typeof createMutation.mutateAsync>[0]
              );
              setCreateOpen(false);
              toast.success('Tag criada com sucesso!');
            }}
          />

          {/* View Modal */}
          <ViewModal
            isOpen={viewOpen}
            onClose={() => setViewOpen(false)}
            tag={viewingItem}
            onEdit={() => {
              if (viewingItem) {
                setEditingItem(viewingItem);
                setViewOpen(false);
                setEditOpen(true);
              }
            }}
            onDelete={() => {
              if (viewingItem) {
                handleContextDelete([viewingItem.id]);
              }
            }}
          />

          {/* Edit Modal */}
          <EditModal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            tag={editingItem}
            onSubmit={async (id, data) => {
              await updateMutation.mutateAsync({
                id,
                data: data as Parameters<
                  typeof updateMutation.mutateAsync
                >[0]['data'],
              });
              setEditOpen(false);
              toast.success('Tag atualizada com sucesso!');
            }}
          />

          {/* Delete Confirmation */}
          <DeleteConfirmModal
            isOpen={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onConfirm={handleDeleteConfirm}
            count={itemsToDelete.length}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
