/**
 * OpenSea OS - Item Reservations Page
 * Página de gerenciamento de reservas de itens com infinite scroll e filtros server-side
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { itemReservationsConfig } from '@/config/entities/item-reservations.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useItemReservations,
  useCreateItemReservation,
  useReleaseItemReservation,
} from '@/hooks/sales/use-sales-other';
import type {
  ItemReservation,
  ItemReservationStatus,
  CreateItemReservationRequest,
} from '@/types/sales';
import { ITEM_RESERVATION_STATUS_LABELS } from '@/types/sales';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Hash,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { CreateItemReservationWizard } from './src/components/create-item-reservation-wizard';

// ============================================================================
// STATUS STYLES
// ============================================================================

const STATUS_STYLES: Record<
  ItemReservationStatus,
  { bg: string; text: string; border: string; icon: React.ElementType }
> = {
  PENDING: {
    bg: 'bg-amber-50 dark:bg-amber-500/8',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-600/25 dark:border-amber-500/20',
    icon: Clock,
  },
  CONFIRMED: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-600/25 dark:border-emerald-500/20',
    icon: CheckCircle2,
  },
  CANCELLED: {
    bg: 'bg-rose-50 dark:bg-rose-500/8',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-600/25 dark:border-rose-500/20',
    icon: XCircle,
  },
};

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function ItemReservationsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <ItemReservationsPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function ItemReservationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const statusFilter = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'name'>(
    'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [createWizardOpen, setCreateWizardOpen] = useState(false);

  const canCreate = hasPermission(itemReservationsConfig.permissions.create);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data: reservationsData,
    isLoading,
    error,
    refetch,
  } = useItemReservations();

  const releaseMutation = useReleaseItemReservation();
  const createMutation = useCreateItemReservation();

  const reservationsRaw = reservationsData?.reservations;

  // Client-side filtering
  const reservations = useMemo(() => {
    let list = reservationsRaw ?? [];

    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      list = list.filter(
        r =>
          r.id.toLowerCase().includes(query) ||
          (r.item?.product?.name &&
            r.item.product.name.toLowerCase().includes(query)) ||
          (r.item?.sku && r.item.sku.toLowerCase().includes(query)) ||
          (r.salesOrder?.code &&
            r.salesOrder.code.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      list = list.filter(r => statusFilter.includes(r.status));
    }

    // Sort
    list = [...list].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [reservationsRaw, debouncedSearch, statusFilter, sortBy, sortOrder]);

  const total = reservations.length;

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      () => {
        // Will call fetchNextPage when infinite query is implemented
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { status?: string[] }) => {
      const parts: string[] = [];
      const s = params.status !== undefined ? params.status : statusFilter;
      if (s.length > 0) parts.push(`status=${s.join(',')}`);
      return parts.length > 0
        ? `/sales/item-reservations?${parts.join('&')}`
        : '/sales/item-reservations';
    },
    [statusFilter]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const statusOptions = useMemo(
    () => [
      { id: 'PENDING', label: 'Pendente' },
      { id: 'CONFIRMED', label: 'Confirmada' },
      { id: 'CANCELLED', label: 'Cancelada' },
    ],
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/item-reservations/${ids[0]}`);
    }
  };

  const handleContextDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await releaseMutation.mutateAsync({
        id,
        data: { releaseQuantity: 0 },
      });
    }
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Reserva cancelada com sucesso!'
        : `${itemsToDelete.length} reservas canceladas!`
    );
  }, [itemsToDelete, releaseMutation]);

  const handleCreateSubmit = useCallback(
    async (data: CreateItemReservationRequest) => {
      await createMutation.mutateAsync(data);
      toast.success('Reserva criada com sucesso!');
    },
    [createMutation]
  );

  // ============================================================================
  // HELPERS
  // ============================================================================

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatDateTime(date: string) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function isExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date();
  }

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: ItemReservation, isSelected: boolean) => {
    const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.PENDING;
    const StatusIcon = statusStyle.icon;
    const productName = item.item?.product?.name || 'Item sem nome';
    const expired = item.status === 'PENDING' && isExpired(item.expiresAt);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        actions={[
          ...(hasPermission(itemReservationsConfig.permissions.delete)
            ? [
                {
                  id: 'delete',
                  label: 'Cancelar Reserva',
                  icon: Trash2,
                  onClick: handleContextDelete,
                  variant: 'destructive' as const,
                  separator: 'before' as const,
                },
              ]
            : []),
        ]}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={productName}
          subtitle={
            item.salesOrder?.code
              ? `Pedido ${item.salesOrder.code}`
              : 'Sem pedido vinculado'
          }
          icon={Package}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
          badges={[
            {
              label: ITEM_RESERVATION_STATUS_LABELS[item.status],
              variant: 'default',
            },
            {
              label: `Qtd: ${item.quantity}`,
              variant: 'secondary',
            },
            ...(expired
              ? [
                  {
                    label: 'Expirada',
                    variant: 'destructive' as const,
                  },
                ]
              : []),
          ]}
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

  const renderListCard = (item: ItemReservation, isSelected: boolean) => {
    const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.PENDING;
    const StatusIcon = statusStyle.icon;
    const productName = item.item?.product?.name || 'Item sem nome';
    const expired = item.status === 'PENDING' && isExpired(item.expiresAt);

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof Package;
      color: string;
    }[] = [
      {
        label: ITEM_RESERVATION_STATUS_LABELS[item.status],
        variant: 'outline',
        icon: StatusIcon as typeof Package,
        color: cn(statusStyle.border, statusStyle.bg, statusStyle.text),
      },
      {
        label: `Qtd: ${item.quantity}`,
        variant: 'outline',
        icon: Hash as typeof Package,
        color:
          'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
      },
      ...(item.salesOrder?.code
        ? [
            {
              label: item.salesOrder.code,
              variant: 'outline' as const,
              icon: ShoppingCart as typeof Package,
              color:
                'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
            },
          ]
        : []),
      ...(item.item?.sku
        ? [
            {
              label: item.item.sku,
              variant: 'outline' as const,
              color:
                'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
            },
          ]
        : []),
      ...(expired
        ? [
            {
              label: 'Expirada',
              variant: 'outline' as const,
              icon: AlertCircle as typeof Package,
              color:
                'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        actions={[
          ...(hasPermission(itemReservationsConfig.permissions.delete)
            ? [
                {
                  id: 'delete',
                  label: 'Cancelar Reserva',
                  icon: Trash2,
                  onClick: handleContextDelete,
                  variant: 'destructive' as const,
                  separator: 'before' as const,
                },
              ]
            : []),
        ]}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {productName}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                Expira em {formatDate(item.expiresAt)}
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
          icon={Package}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
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

  const initialIds = useMemo(() => reservations.map(i => i.id), [reservations]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'item-reservations',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              {
                label: 'Reservas de Itens',
                href: '/sales/item-reservations',
              },
            ]}
            buttons={
              canCreate
                ? [
                    {
                      id: 'create-reservation',
                      title: 'Nova Reserva',
                      icon: Plus,
                      onClick: () => setCreateWizardOpen(true),
                      variant: 'default',
                    },
                  ]
                : []
            }
          />

          <Header
            title="Reservas de Itens"
            description="Gerencie as reservas de itens vinculadas a pedidos de venda"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={
              itemReservationsConfig.display.labels.searchPlaceholder
            }
            value={searchQuery}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="list" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar reservas"
              message="Ocorreu um erro ao tentar carregar as reservas de itens. Por favor, tente novamente."
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
                config={itemReservationsConfig}
                items={reservations}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={AlertCircle}
                      options={statusOptions}
                      selected={statusFilter}
                      onSelectionChange={setStatusFilter}
                      activeColor="cyan"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'reserva' : 'reservas'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/item-reservations/${item.id}`)
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
            </>
          )}

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Cancelamento"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para cancelar esta reserva. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para cancelar ${itemsToDelete.length} reservas. Esta ação não pode ser desfeita.`
            }
          />

          <CreateItemReservationWizard
            open={createWizardOpen}
            onOpenChange={setCreateWizardOpen}
            onSubmit={handleCreateSubmit}
            isSubmitting={createMutation.isPending}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
