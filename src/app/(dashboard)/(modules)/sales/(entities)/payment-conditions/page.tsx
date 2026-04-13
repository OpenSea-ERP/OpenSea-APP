/**
 * OpenSea OS - Payment Conditions Page
 * Página de gerenciamento de condições de pagamento com infinite scroll
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
  usePaymentConditionsInfinite,
  useDeletePaymentCondition,
} from '@/hooks/sales/use-payment-conditions';
import type { PaymentConditionDTO } from '@/types/sales';
import { PAYMENT_CONDITION_TYPE_LABELS } from '@/types/sales/payment-condition.types';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { CreatePaymentConditionWizard } from './src/components/create-payment-condition-wizard';
import { CreditCard, Plus, Tag, Trash2, Calendar, Percent } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function PaymentConditionsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <PaymentConditionsPageContent />
    </Suspense>
  );
}

function PaymentConditionsPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  const isActiveFilter =
    statusFilter[0] === 'active'
      ? true
      : statusFilter[0] === 'inactive'
        ? false
        : undefined;

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaymentConditionsInfinite({
    search: debouncedSearch || undefined,
    type: typeFilter[0] || undefined,
    isActive: isActiveFilter,
  });

  const paymentConditions = useMemo(
    () => data?.pages.flatMap(page => page.data) ?? [],
    [data]
  );
  const total = data?.pages[0]?.meta.total ?? 0;

  const deleteMutation = useDeletePaymentCondition();

  // Infinite scroll refs
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

  const typeOptions = useMemo(
    () =>
      Object.entries(PAYMENT_CONDITION_TYPE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  const statusOptions = useMemo(
    () => [
      { id: 'active', label: 'Ativo' },
      { id: 'inactive', label: 'Inativo' },
    ],
    []
  );

  const canCreate = hasPermission(
    SALES_PERMISSIONS.PAYMENT_CONDITIONS.REGISTER
  );
  const canDelete = hasPermission(SALES_PERMISSIONS.PAYMENT_CONDITIONS.REMOVE);

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
        ? 'Condição de pagamento excluída com sucesso!'
        : `${itemsToDelete.length} condições excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CASH':
        return 'from-emerald-500 to-green-600';
      case 'INSTALLMENT':
        return 'from-violet-500 to-purple-600';
      case 'CREDIT_LIMIT':
        return 'from-sky-500 to-blue-600';
      default:
        return 'from-teal-500 to-cyan-600';
    }
  };

  return (
    <PageLayout data-testid="payment-conditions-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            {
              label: 'Condições de Pagamento',
              href: '/sales/payment-conditions',
            },
          ]}
          buttons={
            canCreate
              ? [
                  {
                    id: 'create-payment-condition',
                    title: 'Nova Condição',
                    icon: Plus,
                    onClick: () => setCreateOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />
        <Header
          title="Condições de Pagamento"
          description="Gerencie condições e prazos de pagamento para vendas"
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          data-testid="payment-conditions-search"
          placeholder="Buscar condições de pagamento..."
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
            title="Erro ao carregar condições de pagamento"
            message="Ocorreu um erro. Por favor, tente novamente."
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
                data-testid="payment-conditions-filter-type"
                label="Tipo"
                icon={Tag}
                options={typeOptions}
                selected={typeFilter}
                onSelectionChange={setTypeFilter}
                activeColor="cyan"
                searchPlaceholder="Buscar tipo..."
                emptyText="Nenhum tipo encontrado."
              />
              <FilterDropdown
                data-testid="payment-conditions-filter-status"
                label="Status"
                icon={Tag}
                options={statusOptions}
                selected={statusFilter}
                onSelectionChange={setStatusFilter}
                activeColor="emerald"
                searchPlaceholder="Buscar status..."
                emptyText="Nenhum status encontrado."
              />
              <p
                data-testid="payment-conditions-count"
                className="text-sm text-muted-foreground whitespace-nowrap"
              >
                {total} {total === 1 ? 'condição' : 'condições'}
              </p>
            </div>

            {paymentConditions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-base font-semibold text-muted-foreground mb-1">
                  Nenhuma condição de pagamento encontrada
                </h3>
                <p className="text-sm text-muted-foreground/70 mb-4">
                  {debouncedSearch || typeFilter.length > 0 || statusFilter.length > 0
                    ? 'Tente ajustar os filtros ou termos de busca.'
                    : 'Crie a primeira condição de pagamento para começar.'}
                </p>
                {canCreate &&
                  !debouncedSearch &&
                  typeFilter.length === 0 &&
                  statusFilter.length === 0 && (
                    <button
                      data-testid="payment-conditions-empty-create-btn"
                      onClick={() => setCreateOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Nova Condição
                    </button>
                  )}
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paymentConditions.map((pc: PaymentConditionDTO) => (
                <div
                  key={pc.id}
                  data-testid={`payment-condition-card-${pc.id}`}
                  className={cn(
                    'group relative rounded-xl border bg-card p-4 transition-all cursor-pointer hover:shadow-md',
                    !pc.isActive && 'opacity-60'
                  )}
                  onClick={() =>
                    router.push(`/sales/payment-conditions/${pc.id}`)
                  }
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white bg-linear-to-br',
                        getTypeColor(pc.type)
                      )}
                    >
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {pc.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {PAYMENT_CONDITION_TYPE_LABELS[pc.type]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                        pc.isActive
                          ? 'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                          : 'border-gray-300 bg-gray-50 dark:bg-white/[0.04] text-gray-500'
                      )}
                    >
                      {pc.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    {pc.isDefault && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border border-violet-600/25 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300">
                        Padrão
                      </span>
                    )}
                    {pc.type === 'INSTALLMENT' && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {pc.installments}x de {pc.intervalDays} dias
                      </span>
                    )}
                    {pc.discountCash != null && pc.discountCash > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Percent className="h-3 w-3" />
                        {pc.discountCash}% à vista
                      </span>
                    )}
                  </div>

                  {canDelete && (
                    <button
                      data-testid={`payment-condition-delete-${pc.id}`}
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete([pc.id]);
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            )}

            <div ref={sentinelRef} className="h-1" />
          </>
        )}

        <CreatePaymentConditionWizard
          open={createOpen}
          onOpenChange={setCreateOpen}
        />

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta condição de pagamento. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
