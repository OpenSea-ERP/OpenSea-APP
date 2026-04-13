/**
 * OpenSea OS - Coupons Page
 * Página de gerenciamento de cupons de desconto com infinite scroll
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
import { useCouponsInfinite, useDeleteCoupon } from '@/hooks/sales/use-coupons';
import type { Coupon } from '@/types/sales';
import { COUPON_TYPE_LABELS } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { CreateCouponWizard } from './src/components/create-coupon-wizard';
import { Plus, Tag, Ticket, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function CouponsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <CouponsPageContent />
    </Suspense>
  );
}

function CouponsPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  const {
    coupons,
    total,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCouponsInfinite({
    search: debouncedSearch || undefined,
    type: typeFilter[0] as Coupon['type'] | undefined,
  });

  const deleteMutation = useDeleteCoupon();

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

  const typeOptions = useMemo(
    () =>
      Object.entries(COUPON_TYPE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
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
        ? 'Cupom excluído com sucesso!'
        : `${itemsToDelete.length} cupons excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });

  const isExpired = (coupon: Coupon) =>
    new Date(coupon.validUntil) < new Date();

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Cupons', href: '/sales/coupons' },
          ]}
          buttons={
            hasPermission(SALES_PERMISSIONS.COUPONS.ADMIN)
              ? [
                  {
                    id: 'create-coupon',
                    title: 'Novo Cupom',
                    icon: Plus,
                    onClick: () => setCreateOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />
        <Header
          title="Cupons de Desconto"
          description="Gerencie cupons promocionais e códigos de desconto"
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          placeholder="Buscar cupons por código..."
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
            title="Erro ao carregar cupons"
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
                label="Tipo"
                icon={Tag}
                options={typeOptions}
                selected={typeFilter}
                onSelectionChange={setTypeFilter}
                activeColor="cyan"
                searchPlaceholder="Buscar tipo..."
                emptyText="Nenhum tipo encontrado."
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {total} {total === 1 ? 'cupom' : 'cupons'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {coupons.map((coupon: Coupon) => {
                const expired = isExpired(coupon);
                return (
                  <div
                    key={coupon.id}
                    className={cn(
                      'group relative rounded-xl border bg-card p-4 transition-all',
                      expired && 'opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white',
                          expired
                            ? 'bg-gray-400'
                            : 'bg-linear-to-br from-teal-500 to-emerald-600'
                        )}
                      >
                        <Ticket className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                          {coupon.code}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {coupon.type === 'PERCENTAGE'
                            ? `${coupon.value}% de desconto`
                            : coupon.type === 'FREE_SHIPPING'
                              ? 'Frete grátis'
                              : `R$ ${coupon.value.toFixed(2)} de desconto`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                          coupon.isActive && !expired
                            ? 'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                            : 'border-gray-300 bg-gray-50 dark:bg-white/[0.04] text-gray-500'
                        )}
                      >
                        {expired
                          ? 'Expirado'
                          : coupon.isActive
                            ? 'Ativo'
                            : 'Inativo'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(coupon.validFrom)} -{' '}
                        {formatDate(coupon.validUntil)}
                      </span>
                      {coupon.usageCount > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {coupon.usageCount}
                          {coupon.maxUsageTotal
                            ? `/${coupon.maxUsageTotal}`
                            : ''}{' '}
                          usos
                        </span>
                      )}
                    </div>

                    {hasPermission(SALES_PERMISSIONS.COUPONS.ADMIN) && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete([coupon.id]);
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

            <div ref={sentinelRef} className="h-1" />
          </>
        )}

        <CreateCouponWizard open={createOpen} onOpenChange={setCreateOpen} />

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir este cupom. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
