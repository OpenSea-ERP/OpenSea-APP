/**
 * OpenSea OS - Manufacturers Page
 * Página de gerenciamento de fabricantes usando infinite scroll com filtros server-side
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
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useManufacturersInfinite,
  useCreateManufacturer,
  useUpdateManufacturer,
  useDeleteManufacturer,
  type InfiniteListFilters,
} from '@/hooks/stock/use-stock-other';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { productsService } from '@/services/stock';
import type { Manufacturer, Product, UpdateManufacturerRequest } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';
import { COUNTRIES } from '@/components/ui/country-select';
import { formatCNPJ } from '@/lib/masks';
import {
  ArrowDownAZ,
  Calendar,
  ChevronRight,
  Clock,
  Copy,
  Factory,
  Globe,
  Hash,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleFlag } from 'react-circle-flags';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CreateManufacturerWizard,
  DuplicateConfirmModal,
  duplicateManufacturer,
  manufacturersConfig,
  RenameModal,
} from './src';

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

export default function ManufacturersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameManufacturerItem, setRenameManufacturerItem] =
    useState<Manufacturer | null>(null);

  // Modal state (previously managed by useEntityPage)
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [itemsToDuplicate, setItemsToDuplicate] = useState<string[]>([]);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // ============================================================================
  // DATA: Infinite scroll + mutations
  // ============================================================================

  const filters: InfiniteListFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  }), [debouncedSearch, sortBy, sortOrder]);

  const {
    items,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useManufacturersInfinite(filters);

  const createMutation = useCreateManufacturer();
  const updateMutation = useUpdateManufacturer();
  const deleteMutation = useDeleteManufacturer();

  // ============================================================================
  // PRODUCT COUNTS
  // ============================================================================

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products-for-manufacturer-counts'],
    queryFn: async () => {
      const response = await productsService.listProducts();
      return response.products;
    },
  });

  const productCountMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!products) return map;
    for (const product of products) {
      if (product.manufacturerId) {
        map.set(
          product.manufacturerId,
          (map.get(product.manufacturerId) || 0) + 1
        );
      }
    }
    return map;
  }, [products]);

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
  // OPEN CREATE MODAL VIA URL PARAM
  // ============================================================================
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateOpen(true);
      window.history.replaceState(null, '', '/stock/manufacturers');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/manufacturers/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/manufacturers/${ids[0]}/edit`);
    }
  };

  const handleContextRename = useCallback(
    (ids: string[]) => {
      const manufacturer = items.find(m => m.id === ids[0]) || null;
      setRenameManufacturerItem(manufacturer);
      setRenameModalOpen(true);
    },
    [items]
  );

  const handleRenameSubmit = useCallback(
    async (id: string, data: Partial<Manufacturer>) => {
      await updateMutation.mutateAsync({ id, data: data as UpdateManufacturerRequest });
      setRenameModalOpen(false);
      setRenameManufacturerItem(null);
    },
    [updateMutation]
  );

  const handleContextDuplicate = (ids: string[]) => {
    setItemsToDuplicate(ids);
    setDuplicateOpen(true);
  };

  const handleDuplicateConfirm = useCallback(async () => {
    setIsDuplicating(true);
    try {
      for (const id of itemsToDuplicate) {
        await duplicateManufacturer(id);
      }
      await refetch();
      setDuplicateOpen(false);
      setItemsToDuplicate([]);
    } finally {
      setIsDuplicating(false);
    }
  }, [itemsToDuplicate, refetch]);

  const handleContextDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteOpen(false);
    setItemsToDelete([]);
  }, [itemsToDelete, deleteMutation]);

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

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
  // BADGES
  // ============================================================================

  /** Resolve country name -> ISO code for flag */
  const getCountryCode = useCallback((name: string): string | null => {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    const match = COUNTRIES.find(c => c.name.toLowerCase() === lower);
    return match?.code ?? null;
  }, []);

  /** Create a flag icon component for a given country code */
  const makeFlagIcon = useCallback(
    (cc: string) =>
      function FlagIcon() {
        return <CircleFlag countryCode={cc} height={12} width={12} />;
      },
    []
  );

  const getManufacturerBadges = (item: Manufacturer) => {
    const badges: {
      label: string;
      variant: 'outline';
      icon?: typeof Globe;
      color: string;
      flag?: string;
    }[] = [];

    // Country badge with flag (violet) -- first
    const cc = getCountryCode(item.country);
    badges.push({
      label: item.country || '\u2014',
      variant: 'outline',
      icon:
        cc && cc !== 'OTHER'
          ? (makeFlagIcon(cc.toLowerCase()) as unknown as typeof Globe)
          : Globe,
      color:
        'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
      flag: cc && cc !== 'OTHER' ? cc.toLowerCase() : undefined,
    });

    // Code badge (slate) -- second
    if (item.code) {
      badges.push({
        label: item.code,
        variant: 'outline',
        icon: Hash,
        color:
          'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
      });
    }

    // Website badge (sky)
    if (item.website) {
      badges.push({
        label: 'Website',
        variant: 'outline',
        icon: Globe,
        color:
          'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      });
    }

    // Inactive badge (amber)
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

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const sortOptions = useMemo(
    () => [
      {
        field: 'custom' as const,
        direction: 'asc' as const,
        label: 'Nome (A-Z)',
        icon: ArrowDownAZ,
      },
      {
        field: 'custom' as const,
        direction: 'desc' as const,
        label: 'Nome (Z-A)',
        icon: ArrowDownAZ,
      },
      {
        field: 'createdAt' as const,
        direction: 'desc' as const,
        label: 'Mais recentes',
        icon: Calendar,
      },
      {
        field: 'createdAt' as const,
        direction: 'asc' as const,
        label: 'Mais antigos',
        icon: Calendar,
      },
      {
        field: 'updatedAt' as const,
        direction: 'desc' as const,
        label: 'Última atualização',
        icon: Clock,
      },
    ],
    []
  );

  const renderGridCard = (item: Manufacturer, isSelected: boolean) => {
    const productCount = productCountMap.get(item.id) || 0;

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
          title={(item.name || '').toUpperCase()}
          subtitle={item.cnpj ? formatCNPJ(item.cnpj) : 'Sem CNPJ'}
          icon={Factory}
          iconBgColor="bg-linear-to-br from-violet-500 to-purple-600"
          badges={getManufacturerBadges(item)}
          footer={{
            type: 'single',
            button: {
              icon: Package,
              label: `${productCount} ${productCount === 1 ? 'produto' : 'produtos'}`,
              href: `/stock/products?manufacturer=${item.id}`,
              color: 'emerald',
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

  const renderListCard = (item: Manufacturer, isSelected: boolean) => {
    const productCount = productCountMap.get(item.id) || 0;
    const listBadges = getManufacturerBadges(item);

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
                {(item.name || '').toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {item.cnpj ? formatCNPJ(item.cnpj) : 'Sem CNPJ'}
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
                  {badge.flag ? (
                    <CircleFlag
                      countryCode={badge.flag}
                      height={12}
                      width={12}
                      className="shrink-0"
                    />
                  ) : badge.icon ? (
                    <badge.icon className="w-3 h-3" />
                  ) : null}
                  {badge.label}
                </span>
              ))}
            </div>
          }
          icon={Factory}
          iconBgColor="bg-linear-to-br from-violet-500 to-purple-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        >
          <Link
            href={`/stock/products?manufacturer=${item.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <Package className="h-3.5 w-3.5" />
            {productCount} produto{productCount !== 1 ? 's' : ''}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(
    () => items.map(i => i.id),
    [items]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const handleImport = useCallback(() => {
    router.push('/import/stock/manufacturers');
  }, [router]);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'import-manufacturers',
        title: 'Importar',
        icon: Upload,
        onClick: handleImport,
        variant: 'ghost',
        permission: manufacturersConfig.permissions?.import,
      },
      {
        id: 'create-manufacturer',
        title: 'Novo Fabricante',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: manufacturersConfig.permissions?.create,
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
        namespace: 'manufacturers',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Fabricantes', href: '/stock/manufacturers' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Fabricantes"
            description="Gerencie os fabricantes de produtos"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            placeholder={manufacturersConfig.display.labels.searchPlaceholder}
            onSearch={value => setSearchQuery(value)}
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
              title="Erro ao carregar fabricantes"
              message="Ocorreu um erro ao tentar carregar os fabricantes. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => { refetch(); },
              }}
            />
          ) : (
            <>
              <EntityGrid
                config={manufacturersConfig}
                items={items}
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/stock/manufacturers/${item.id}`)
                }
                showSorting={true}
                showItemCount={false}
                toolbarStart={
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {total} {total === 1 ? 'fabricante' : 'fabricantes'}
                    {items.length < total &&
                      ` (${items.length} carregados)`}
                  </p>
                }
                defaultSortField="name"
                defaultSortDirection="asc"
                customSortOptions={sortOptions}
                onSortChange={(field, direction) => {
                  if (field === 'custom') {
                    setSortBy('name');
                  } else {
                    setSortBy(field as 'name' | 'createdAt' | 'updatedAt');
                  }
                  setSortOrder(direction);
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
          <CreateManufacturerWizard
            open={createOpen}
            onOpenChange={open => !open && setCreateOpen(false)}
            onSubmit={async data => {
              await createMutation.mutateAsync(data as Parameters<typeof createMutation.mutateAsync>[0]);
              setCreateOpen(false);
            }}
          />

          {/* Rename Modal */}
          <RenameModal
            isOpen={renameModalOpen}
            onClose={() => {
              setRenameModalOpen(false);
              setRenameManufacturerItem(null);
            }}
            manufacturer={renameManufacturerItem}
            isSubmitting={updateMutation.isPending}
            onSubmit={handleRenameSubmit}
          />

          {/* Delete Confirmation (PIN) */}
          <VerifyActionPinModal
            isOpen={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onSuccess={() => handleDeleteConfirm()}
            title="Confirmar Exclusão"
            description={`Digite seu PIN de ação para excluir ${itemsToDelete.length} ${itemsToDelete.length === 1 ? 'fabricante' : 'fabricantes'}.`}
          />

          {/* Duplicate Confirmation */}
          <DuplicateConfirmModal
            isOpen={duplicateOpen}
            onClose={() => setDuplicateOpen(false)}
            itemCount={itemsToDuplicate.length}
            onConfirm={handleDuplicateConfirm}
            isLoading={isDuplicating}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
