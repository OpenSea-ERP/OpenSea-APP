/**
 * OpenSea OS - Store Credits Page
 * Página de gerenciamento de creditos de loja com infinite scroll e filtros
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
  useStoreCreditsInfinite,
  useCreateStoreCredit,
  useDeleteStoreCredit,
} from '@/hooks/sales/use-store-credits';
import type { StoreCreditDTO, CreateStoreCreditRequest } from '@/types/sales';
import { STORE_CREDIT_SOURCE_LABELS } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { CreditCard, Filter, Plus, Trash2, User, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CreateStoreCreditWizard } from './src/components/create-store-credit-wizard';

export default function StoreCreditsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <StoreCreditsPageContent />
    </Suspense>
  );
}

function StoreCreditsPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [createWizardOpen, setCreateWizardOpen] = useState(false);

  const {
    storeCredits,
    total,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStoreCreditsInfinite({
    search: debouncedSearch || undefined,
    source: sourceFilter[0] as StoreCreditDTO['source'] | undefined,
    isActive: statusFilter[0] || undefined,
  });

  const deleteMutation = useDeleteStoreCredit();
  const createMutation = useCreateStoreCredit();

  // Infinite scroll — refs prevent observer teardown/re-creation loop
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

  const sourceOptions = useMemo(
    () =>
      Object.entries(STORE_CREDIT_SOURCE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  const statusOptions = useMemo(
    () => [
      { id: 'true', label: 'Ativo' },
      { id: 'false', label: 'Inativo' },
    ],
    []
  );

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
        ? 'Credito de loja excluído com sucesso!'
        : `${itemsToDelete.length} creditos de loja excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  const handleCreateSubmit = useCallback(
    async (data: CreateStoreCreditRequest) => {
      await createMutation.mutateAsync(data);
      toast.success('Credito de loja criado com sucesso!');
    },
    [createMutation]
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const getStatusInfo = (credit: StoreCreditDTO) => {
    if (!credit.isActive) {
      return {
        label: 'Inativo',
        color:
          'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
      };
    }
    if (credit.expiresAt && new Date(credit.expiresAt) < new Date()) {
      return {
        label: 'Expirado',
        color:
          'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
      };
    }
    if (credit.balance <= 0) {
      return {
        label: 'Esgotado',
        color:
          'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
      };
    }
    return {
      label: 'Ativo',
      color:
        'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    };
  };

  const getSourceColor = (source: StoreCreditDTO['source']) => {
    switch (source) {
      case 'RETURN':
        return 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300';
      case 'MANUAL':
        return 'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300';
      case 'CAMPAIGN':
        return 'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300';
      case 'LOYALTY':
        return 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300';
      default:
        return 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400';
    }
  };

  const canCreate = hasPermission(SALES_PERMISSIONS.STORE_CREDITS.REGISTER);
  const canDelete = hasPermission(SALES_PERMISSIONS.STORE_CREDITS.REMOVE);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Creditos de Loja', href: '/sales/store-credits' },
          ]}
          buttons={
            canCreate
              ? [
                  {
                    id: 'create-store-credit',
                    title: 'Novo Credito',
                    icon: Plus,
                    onClick: () => setCreateWizardOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />
        <Header
          title="Creditos de Loja"
          description="Gerencie creditos de loja dos clientes"
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          placeholder="Buscar por cliente..."
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
            title="Erro ao carregar creditos de loja"
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
                label="Origem"
                icon={Filter}
                options={sourceOptions}
                selected={sourceFilter}
                onSelectionChange={setSourceFilter}
                activeColor="violet"
                searchPlaceholder="Buscar origem..."
                emptyText="Nenhuma origem encontrada."
              />
              <FilterDropdown
                label="Status"
                icon={Filter}
                options={statusOptions}
                selected={statusFilter}
                onSelectionChange={setStatusFilter}
                activeColor="emerald"
                searchPlaceholder="Buscar status..."
                emptyText="Nenhum status encontrado."
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {total} {total === 1 ? 'credito' : 'creditos'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {storeCredits.map((credit: StoreCreditDTO) => {
                const status = getStatusInfo(credit);
                const usedAmount = credit.amount - credit.balance;
                const usagePercent =
                  credit.amount > 0
                    ? Math.round((credit.balance / credit.amount) * 100)
                    : 0;

                return (
                  <div
                    key={credit.id}
                    className={cn(
                      'group relative rounded-xl border bg-card p-4 transition-all cursor-pointer hover:shadow-md',
                      !credit.isActive && 'opacity-60'
                    )}
                    onClick={() =>
                      router.push(`/sales/store-credits/${credit.id}`)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white',
                          credit.isActive
                            ? 'bg-linear-to-br from-violet-500 to-purple-600'
                            : 'bg-gray-400'
                        )}
                      >
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {credit.customerName || 'Cliente'}
                          </h3>
                        </div>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                          {formatCurrency(credit.balance)}
                        </p>
                        {credit.balance !== credit.amount && (
                          <p className="text-xs text-muted-foreground">
                            de {formatCurrency(credit.amount)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Usage bar */}
                    <div className="mt-3">
                      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/[0.06]">
                        <div
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            usagePercent > 50
                              ? 'bg-emerald-500'
                              : usagePercent > 20
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                          )}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                          status.color
                        )}
                      >
                        {status.label}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                          getSourceColor(credit.source)
                        )}
                      >
                        {STORE_CREDIT_SOURCE_LABELS[credit.source]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(credit.createdAt)}
                      </span>
                      {credit.expiresAt && (
                        <span className="text-[11px] text-muted-foreground">
                          Exp: {formatDate(credit.expiresAt)}
                        </span>
                      )}
                    </div>

                    {canDelete && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete([credit.id]);
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

            {storeCredits.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-base font-semibold text-muted-foreground">
                  Nenhum credito de loja encontrado
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {debouncedSearch
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Crie um credito manual para comecar.'}
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
              ? 'Digite seu PIN de ação para excluir este credito de loja. Esta ação não pode ser desfeita.'
              : `Digite seu PIN de ação para excluir ${itemsToDelete.length} creditos de loja. Esta ação não pode ser desfeita.`
          }
        />

        <CreateStoreCreditWizard
          open={createWizardOpen}
          onOpenChange={setCreateWizardOpen}
          onSubmit={handleCreateSubmit}
          isSubmitting={createMutation.isPending}
        />
      </PageBody>
    </PageLayout>
  );
}
