/**
 * OpenSea OS - Customer Prices Page
 * Página de gerenciamento de preços por cliente com infinite scroll
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCustomerPricesInfinite,
  useCreateCustomerPrice,
  useDeleteCustomerPrice,
} from '@/hooks/sales/use-customer-prices';
import { useCustomersInfinite } from '@/hooks/sales/use-customers';
import type { CustomerPrice, CreateCustomerPriceRequest } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import {
  BadgeDollarSign,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CreateCustomerPriceWizard } from './src/components/create-customer-price-wizard';

export default function CustomerPricesPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <CustomerPricesPageContent />
    </Suspense>
  );
}

function CustomerPricesPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // ============================================================================
  // STATE
  // ============================================================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [createWizardOpen, setCreateWizardOpen] = useState(false);

  const canCreate = hasPermission(SALES_PERMISSIONS.CUSTOMER_PRICES.REGISTER);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    customerPrices: rawCustomerPrices,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCustomerPricesInfinite({
    customerId: customerFilter[0] || undefined,
  });

  const deleteMutation = useDeleteCustomerPrice();
  const createMutation = useCreateCustomerPrice();

  // Load customers for filter dropdown and name resolution
  const { customers: allCustomers } = useCustomersInfinite();

  // ============================================================================
  // CUSTOMER NAME MAP
  // ============================================================================

  const customerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allCustomers ?? []) {
      map.set(c.id, c.name);
    }
    return map;
  }, [allCustomers]);

  // ============================================================================
  // CLIENT-SIDE FILTERING
  // ============================================================================

  const customerPrices = useMemo(() => {
    let list = rawCustomerPrices ?? [];

    // Client-side search by customer name
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      list = list.filter(cp => {
        const name = customerNameMap.get(cp.customerId) ?? '';
        return (
          name.toLowerCase().includes(query) ||
          cp.variantId.toLowerCase().includes(query) ||
          (cp.notes && cp.notes.toLowerCase().includes(query))
        );
      });
    }

    // Status filter (active / expired / upcoming)
    if (statusFilter.length > 0) {
      const now = new Date();
      list = list.filter(cp => {
        const isActive =
          (!cp.validFrom || new Date(cp.validFrom) <= now) &&
          (!cp.validUntil || new Date(cp.validUntil) >= now);
        const isExpired = cp.validUntil && new Date(cp.validUntil) < now;
        const isUpcoming = cp.validFrom && new Date(cp.validFrom) > now;

        if (statusFilter.includes('ACTIVE') && isActive) return true;
        if (statusFilter.includes('EXPIRED') && isExpired) return true;
        if (statusFilter.includes('UPCOMING') && isUpcoming) return true;
        return false;
      });
    }

    return list;
  }, [rawCustomerPrices, debouncedSearch, statusFilter, customerNameMap]);

  const total = customerPrices.length;

  // ============================================================================
  // INFINITE SCROLL
  // ============================================================================

  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const fetchNextPageRef = useRef(fetchNextPage);
  hasNextPageRef.current = hasNextPage;
  isFetchingNextPageRef.current = isFetchingNextPage;
  fetchNextPageRef.current = fetchNextPage;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasNextPageRef.current &&
          !isFetchingNextPageRef.current
        ) {
          fetchNextPageRef.current();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const customerOptions = useMemo(
    () =>
      (allCustomers ?? []).map(c => ({
        id: c.id,
        label: c.name,
      })),
    [allCustomers]
  );

  const statusOptions = useMemo(
    () => [
      { id: 'ACTIVE', label: 'Ativo' },
      { id: 'EXPIRED', label: 'Expirado' },
      { id: 'UPCOMING', label: 'Futuro' },
    ],
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Preço excluído com sucesso!'
        : `${itemsToDelete.length} preços excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  const handleCreateSubmit = useCallback(
    async (data: CreateCustomerPriceRequest) => {
      await createMutation.mutateAsync(data);
      toast.success('Preço por cliente criado com sucesso!');
    },
    [createMutation]
  );

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatus = (cp: CustomerPrice) => {
    const now = new Date();
    if (cp.validUntil && new Date(cp.validUntil) < now) return 'expired';
    if (cp.validFrom && new Date(cp.validFrom) > now) return 'upcoming';
    return 'active';
  };

  const statusBadgeStyles = {
    active:
      'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    expired:
      'border-gray-300 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400',
    upcoming:
      'border-sky-600/25 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  };

  const statusLabels = {
    active: 'Ativo',
    expired: 'Expirado',
    upcoming: 'Futuro',
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Preços por Cliente', href: '/sales/customer-prices' },
          ]}
          buttons={
            canCreate
              ? [
                  {
                    id: 'create-customer-price',
                    title: 'Novo Preco',
                    icon: Plus,
                    onClick: () => setCreateWizardOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />
        <Header
          title="Preços por Cliente"
          description="Gerencie preços negociados individualmente para cada cliente"
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          placeholder="Buscar por cliente ou variante..."
          value={searchQuery}
          onSearch={setSearchQuery}
          onClear={() => setSearchQuery('')}
          showClear={true}
          size="md"
        />

        {isLoading ? (
          <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar preços"
            message="Ocorreu um erro ao tentar carregar os preços por cliente. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <FilterDropdown
                label="Cliente"
                icon={User}
                options={customerOptions}
                selected={customerFilter}
                onSelectionChange={setCustomerFilter}
                activeColor="violet"
                searchPlaceholder="Buscar cliente..."
                emptyText="Nenhum cliente encontrado."
              />
              <FilterDropdown
                label="Status"
                icon={Calendar}
                options={statusOptions}
                selected={statusFilter}
                onSelectionChange={setStatusFilter}
                activeColor="emerald"
                searchPlaceholder="Buscar status..."
                emptyText="Nenhum status encontrado."
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {total} {total === 1 ? 'preco' : 'preços'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {customerPrices.map((cp: CustomerPrice) => {
                const status = getStatus(cp);
                const customerName =
                  customerNameMap.get(cp.customerId) ?? 'Cliente';
                const variantLabel = cp.variantId.slice(0, 8) + '...';

                return (
                  <div
                    key={cp.id}
                    className={cn(
                      'group relative rounded-xl border bg-card p-4 transition-all cursor-pointer hover:shadow-md',
                      status === 'expired' && 'opacity-60'
                    )}
                    onClick={() =>
                      router.push(`/sales/customer-prices/${cp.id}`)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white',
                          status === 'expired'
                            ? 'bg-gray-400'
                            : status === 'upcoming'
                              ? 'bg-linear-to-br from-sky-500 to-blue-600'
                              : 'bg-linear-to-br from-emerald-500 to-teal-600'
                        )}
                      >
                        <BadgeDollarSign className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {customerName}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Variante: {variantLabel}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-3 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                        {formatPrice(cp.price)}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                          statusBadgeStyles[status]
                        )}
                      >
                        {statusLabels[status]}
                      </span>
                      {(cp.validFrom || cp.validUntil) && (
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(cp.validFrom) ?? '...'} -{' '}
                          {formatDate(cp.validUntil) ?? '...'}
                        </span>
                      )}
                    </div>

                    {/* Notes preview */}
                    {cp.notes && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                        {cp.notes}
                      </p>
                    )}

                    {/* Delete button */}
                    {hasPermission(
                      SALES_PERMISSIONS.CUSTOMER_PRICES.REMOVE
                    ) && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete([cp.id]);
                        }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {customerPrices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BadgeDollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  Nenhum preço por cliente encontrado
                </h3>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Preços negociados individualmente aparecerão aqui.
                </p>
              </div>
            )}

            <div ref={sentinelRef} className="h-1" />
          </>
        )}

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description={
            itemsToDelete.length === 1
              ? 'Digite seu PIN de ação para excluir este preco. Esta ação não pode ser desfeita.'
              : `Digite seu PIN de ação para excluir ${itemsToDelete.length} preços. Esta ação não pode ser desfeita.`
          }
        />

        <CreateCustomerPriceWizard
          open={createWizardOpen}
          onOpenChange={setCreateWizardOpen}
          onSubmit={handleCreateSubmit}
          isSubmitting={createMutation.isPending}
        />
      </PageBody>
    </PageLayout>
  );
}
