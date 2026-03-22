'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { EntityCard, EntityContextMenu, EntityGrid } from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCatalogsInfinite,
  useCreateCatalog,
  useDeleteCatalog,
} from '@/hooks/sales/use-catalogs';
import { useDebounce } from '@/hooks/use-debounce';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { Catalog } from '@/types/sales';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Button } from '@/components/ui/button';
import { BookOpen, Eye, Globe, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';

const STATUS_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Rascunho', value: 'DRAFT' },
  { label: 'Ativo', value: 'ACTIVE' },
  { label: 'Arquivado', value: 'ARCHIVED' },
];

const TYPE_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Geral', value: 'GENERAL' },
  { label: 'Vendedor', value: 'SELLER' },
  { label: 'Campanha', value: 'CAMPAIGN' },
  { label: 'Cliente', value: 'CUSTOMER' },
  { label: 'IA', value: 'AI_GENERATED' },
];

export default function CatalogsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Permissions
  const canView = hasPermission(SALES_PERMISSIONS.CATALOGS.ACCESS);
  const canCreate = hasPermission(SALES_PERMISSIONS.CATALOGS.REGISTER);
  const canEdit = hasPermission(SALES_PERMISSIONS.CATALOGS.MODIFY);
  const canDelete = hasPermission(SALES_PERMISSIONS.CATALOGS.REMOVE);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // Infinite query
  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (debouncedSearch) f.search = debouncedSearch;
    if (statusFilter) f.status = statusFilter;
    if (typeFilter) f.type = typeFilter;
    return f;
  }, [debouncedSearch, statusFilter, typeFilter]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCatalogsInfinite(filters);

  const catalogs = useMemo(
    () => data?.pages.flatMap(p => p.data) ?? [],
    [data]
  );

  // Mutations
  const deleteMutation = useDeleteCatalog();

  // Sentinel ref for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // Handlers
  const handleView = (catalog: Catalog) => {
    router.push(`/sales/catalogs/${catalog.id}`);
  };

  const handleEdit = (catalog: Catalog) => {
    router.push(`/sales/catalogs/${catalog.id}/edit`);
  };

  const handleDeleteRequest = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteOpen(false);
    setItemsToDelete([]);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Rascunho';
      case 'ACTIVE':
        return 'Ativo';
      case 'ARCHIVED':
        return 'Arquivado';
      default:
        return status;
    }
  };

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[{ label: 'Vendas' }, { label: 'Catálogos' }]}
          actions={
            canCreate
              ? [
                  {
                    label: 'Novo Catálogo',
                    icon: Plus,
                    onClick: () => router.push('/sales/catalogs/new'),
                  },
                ]
              : []
          }
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          value={searchQuery}
          onSearch={setSearchQuery}
          placeholder="Buscar catálogos..."
        />

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError message={error?.message} />
        ) : (
          <EntityGrid
            items={catalogs}
            getKey={c => c.id}
            toolbarStart={
              <>
                <FilterDropdown
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <FilterDropdown
                  label="Tipo"
                  options={TYPE_OPTIONS}
                  value={typeFilter}
                  onChange={setTypeFilter}
                />
              </>
            }
            renderItem={catalog => (
              <EntityContextMenu
                key={catalog.id}
                onView={canView ? () => handleView(catalog) : undefined}
                onEdit={canEdit ? () => handleEdit(catalog) : undefined}
                actions={
                  canDelete
                    ? [
                        {
                          label: 'Excluir',
                          icon: Trash2,
                          variant: 'destructive' as const,
                          separator: 'before' as const,
                          onClick: () => handleDeleteRequest([catalog.id]),
                        },
                      ]
                    : []
                }
              >
                <EntityCard
                  onClick={() => canView && handleView(catalog)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                      <BookOpen className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-medium">
                          {catalog.name}
                        </h3>
                        {catalog.isPublic ? (
                          <Globe className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {getStatusLabel(catalog.status)} &middot; {catalog.type}
                      </p>
                      {catalog.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {catalog.description}
                        </p>
                      )}
                    </div>
                  </div>
                </EntityCard>
              </EntityContextMenu>
            )}
            emptyState={{
              icon: BookOpen,
              title: 'Nenhum catálogo encontrado',
              description:
                'Crie seu primeiro catálogo para exibir seus produtos.',
            }}
          />
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />

        {/* Delete confirmation */}
        <VerifyActionPinModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description={`Digite seu PIN de ação para excluir ${itemsToDelete.length} catálogo(s).`}
        />
      </PageBody>
    </PageLayout>
  );
}
