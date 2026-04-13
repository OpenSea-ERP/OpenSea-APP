/**
 * OpenSea OS - Variant Promotions Page
 * Página de gerenciamento de promoções de variantes com infinite scroll e filtros
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
  useVariantPromotions,
  useCreateVariantPromotion,
  useDeleteVariantPromotion,
} from '@/hooks/sales/use-sales-other';
import type { VariantPromotion } from '@/types/sales';
import { DISCOUNT_TYPE_LABELS } from '@/types/sales/promotion.types';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { CalendarDays, Percent, Plus, Tag, Trash2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CreateVariantPromotionWizard } from './src/components/create-variant-promotion-wizard';

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function VariantPromotionsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <VariantPromotionsPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function VariantPromotionsPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [discountTypeFilter, setDiscountTypeFilter] = useState<string[]>([]);

  // ============================================================================
  // STATE
  // ============================================================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [createWizardOpen, setCreateWizardOpen] = useState(false);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data: promotionsData,
    isLoading,
    error,
    refetch,
  } = useVariantPromotions();
  const createMutation = useCreateVariantPromotion();
  const deleteMutation = useDeleteVariantPromotion();

  const allPromotions = promotionsData?.promotions ?? [];

  // ============================================================================
  // CLIENT-SIDE FILTERING
  // ============================================================================

  const promotions = useMemo(() => {
    let list = allPromotions;

    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.variantId.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      list = list.filter(p => {
        if (statusFilter.includes('active') && p.isCurrentlyValid) return true;
        if (statusFilter.includes('expired') && p.isExpired) return true;
        if (statusFilter.includes('upcoming') && p.isUpcoming) return true;
        if (statusFilter.includes('inactive') && !p.isActive) return true;
        return false;
      });
    }

    // Discount type filter
    if (discountTypeFilter.length > 0) {
      list = list.filter(p => discountTypeFilter.includes(p.discountType));
    }

    return list;
  }, [allPromotions, debouncedSearch, statusFilter, discountTypeFilter]);

  const total = promotions.length;

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const statusOptions = useMemo(
    () => [
      { id: 'active', label: 'Ativa' },
      { id: 'expired', label: 'Expirada' },
      { id: 'upcoming', label: 'Futura' },
      { id: 'inactive', label: 'Inativa' },
    ],
    []
  );

  const discountTypeOptions = useMemo(
    () =>
      Object.entries(DISCOUNT_TYPE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
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
        ? 'Promoção excluída com sucesso!'
        : `${itemsToDelete.length} promoções excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });

  const formatDiscountValue = (p: VariantPromotion) =>
    p.discountType === 'PERCENTAGE'
      ? `${p.discountValue}%`
      : `R$ ${p.discountValue.toFixed(2)}`;

  const getStatusInfo = (p: VariantPromotion) => {
    if (!p.isActive) {
      return {
        label: 'Inativa',
        className:
          'border-gray-300 bg-gray-50 dark:bg-white/[0.04] text-gray-500',
      };
    }
    if (p.isExpired) {
      return {
        label: 'Expirada',
        className:
          'border-rose-600/25 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
      };
    }
    if (p.isUpcoming) {
      return {
        label: 'Futura',
        className:
          'border-sky-600/25 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      };
    }
    return {
      label: 'Ativa',
      className:
        'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    };
  };

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  const canCreate = hasPermission(SALES_PERMISSIONS.PROMOTIONS.REGISTER);
  const canDelete = hasPermission(SALES_PERMISSIONS.PROMOTIONS.REMOVE);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="variant-promotions-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            {
              label: 'Promoções de Variantes',
              href: '/sales/variant-promotions',
            },
          ]}
          buttons={
            canCreate
              ? [
                  {
                    id: 'create-promotion',
                    title: 'Nova Promoção',
                    icon: Plus,
                    onClick: () => setCreateWizardOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />
        <Header
          title="Promoções de Variantes"
          description="Gerencie promoções e descontos aplicados a variantes de produtos"
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          data-testid="variant-promotions-search"
          placeholder="Buscar promoções por nome..."
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
            title="Erro ao carregar promoções"
            message="Ocorreu um erro ao tentar carregar as promoções. Por favor, tente novamente."
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
                label="Status"
                icon={Zap}
                options={statusOptions}
                selected={statusFilter}
                onSelectionChange={setStatusFilter}
                activeColor="emerald"
                searchPlaceholder="Buscar status..."
                emptyText="Nenhum status encontrado."
              />
              <FilterDropdown
                label="Tipo de Desconto"
                icon={Percent}
                options={discountTypeOptions}
                selected={discountTypeFilter}
                onSelectionChange={setDiscountTypeFilter}
                activeColor="violet"
                searchPlaceholder="Buscar tipo..."
                emptyText="Nenhum tipo encontrado."
              />
              <p data-testid="variant-promotions-count" className="text-sm text-muted-foreground whitespace-nowrap">
                {total} {total === 1 ? 'promoção' : 'promoções'}
              </p>
            </div>

            {promotions.length === 0 ? (
              <div data-testid="variant-promotions-empty" className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.04] mb-4">
                  <Tag className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Nenhuma promoção encontrada
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {debouncedSearch ||
                  statusFilter.length > 0 ||
                  discountTypeFilter.length > 0
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Crie a primeira promoção para comecar.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {promotions.map(promotion => {
                  const status = getStatusInfo(promotion);
                  return (
                    <div
                      key={promotion.id}
                      data-testid={`variant-promotion-card-${promotion.id}`}
                      onClick={() =>
                        router.push(`/sales/variant-promotions/${promotion.id}`)
                      }
                      className={cn(
                        'group relative rounded-xl border bg-card p-4 transition-all cursor-pointer hover:shadow-md hover:border-violet-500/30',
                        promotion.isExpired && 'opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white',
                            promotion.isExpired || !promotion.isActive
                              ? 'bg-gray-400'
                              : promotion.discountType === 'PERCENTAGE'
                                ? 'bg-linear-to-br from-violet-500 to-purple-600'
                                : 'bg-linear-to-br from-teal-500 to-emerald-600'
                          )}
                        >
                          {promotion.discountType === 'PERCENTAGE' ? (
                            <Percent className="h-5 w-5" />
                          ) : (
                            <Tag className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {promotion.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDiscountValue(promotion)} de desconto
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                            promotion.discountType === 'PERCENTAGE'
                              ? 'border-violet-600/25 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300'
                              : 'border-teal-600/25 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300'
                          )}
                        >
                          {DISCOUNT_TYPE_LABELS[promotion.discountType]}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(promotion.startDate)} -{' '}
                          {formatDate(promotion.endDate)}
                        </span>
                      </div>

                      {canDelete && (
                        <button
                          data-testid={`variant-promotion-delete-${promotion.id}`}
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete([promotion.id]);
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
            )}
          </>
        )}

        <CreateVariantPromotionWizard
          open={createWizardOpen}
          onOpenChange={setCreateWizardOpen}
          onSubmit={async data => {
            await createMutation.mutateAsync(data);
            toast.success('Promoção criada com sucesso!');
          }}
          isSubmitting={createMutation.isPending}
        />

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description={
            itemsToDelete.length === 1
              ? 'Digite seu PIN de ação para excluir esta promoção. Esta ação não pode ser desfeita.'
              : `Digite seu PIN de ação para excluir ${itemsToDelete.length} promoções. Esta ação não pode ser desfeita.`
          }
        />
      </PageBody>
    </PageLayout>
  );
}
