/**
 * OpenSea OS - Deals Page
 * Página de gerenciamento de negócios com infinite scroll e filtros server-side
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { dealsConfig } from '@/config/entities/deals.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCreateDeal,
  useDealsInfinite,
  useDeleteDeal,
} from '@/hooks/sales/use-deals';
import { usePipelines } from '@/hooks/sales/use-pipelines';
import { CreateDealWizard } from './src/components/create-deal-wizard';
import type { Deal, DealStatus } from '@/types/sales';
import { DEAL_STATUS_LABELS } from '@/types/sales';
import {
  CircleDollarSign,
  Handshake,
  Layers,
  Plus,
  Trash2,
  User,
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

// ============================================================================
// TYPES
// ============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

// ============================================================================
// HELPERS
// ============================================================================

const DEAL_STATUS_COLORS: Record<DealStatus, string> = {
  OPEN: 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  WON: 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  LOST: 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  ARCHIVED:
    'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
};

const STATUS_ICON_COLORS: Record<DealStatus, string> = {
  OPEN: 'bg-linear-to-br from-sky-500 to-blue-600',
  WON: 'bg-linear-to-br from-emerald-500 to-teal-600',
  LOST: 'bg-linear-to-br from-rose-500 to-pink-600',
  ARCHIVED: 'bg-linear-to-br from-gray-400 to-gray-500',
};

function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return 'Sem valor';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function DealsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <DealsPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function DealsPageContent() {
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

  const pipelineFilter = useMemo(() => {
    const raw = searchParams.get('pipeline');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>(
    'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    deals,
    total,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDealsInfinite({
    search: debouncedSearch || undefined,
    status: (statusFilter[0] as DealStatus) || undefined,
    pipelineId: pipelineFilter[0] || undefined,
    sortBy: sortBy === 'name' ? 'title' : sortBy,
    sortOrder,
  });

  const createMutation = useCreateDeal();
  const deleteMutation = useDeleteDeal();

  // Load pipelines for filter dropdown
  const { data: pipelinesData } = usePipelines({ isActive: true });
  const pipelineOptions = useMemo(
    () =>
      (pipelinesData?.pipelines ?? []).map(p => ({
        id: p.id,
        label: p.name,
      })),
    [pipelinesData]
  );

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { status?: string[]; pipeline?: string[] }) => {
      const parts: string[] = [];
      const s = params.status !== undefined ? params.status : statusFilter;
      const p =
        params.pipeline !== undefined ? params.pipeline : pipelineFilter;
      if (s.length > 0) parts.push(`status=${s.join(',')}`);
      if (p.length > 0) parts.push(`pipeline=${p.join(',')}`);
      return parts.length > 0
        ? `/sales/deals?${parts.join('&')}`
        : '/sales/deals';
    },
    [statusFilter, pipelineFilter]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  const setPipelineFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ pipeline: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const statusOptions = useMemo(
    () =>
      Object.entries(DEAL_STATUS_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/deals/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/deals/${ids[0]}/edit`);
    }
  };

  const handleContextDelete = (ids: string[]) => {
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
        ? 'Negócio excluído com sucesso!'
        : `${itemsToDelete.length} negócios excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Deal, isSelected: boolean) => {
    const statusLabel = DEAL_STATUS_LABELS[item.status] || item.status;
    const stageName = item.stage?.name || 'Sem etapa';

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          dealsConfig.permissions.update &&
          hasPermission(dealsConfig.permissions.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(dealsConfig.permissions.delete)
            ? [
                {
                  id: 'delete',
                  label: 'Excluir',
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
          title={item.title}
          subtitle={formatCurrency(item.value)}
          icon={Handshake}
          iconBgColor={STATUS_ICON_COLORS[item.status]}
          badges={[
            {
              label: statusLabel,
              variant: 'default',
            },
            {
              label: stageName,
              variant: 'secondary',
            },
            ...(item.customer
              ? [
                  {
                    label: item.customer.name,
                    variant: 'outline' as const,
                  },
                ]
              : []),
          ]}
          footer={
            item.expectedCloseDate
              ? {
                  type: 'single' as const,
                  button: {
                    icon: CircleDollarSign,
                    label: `Previsto: ${new Date(item.expectedCloseDate).toLocaleDateString('pt-BR')}`,
                    onClick: () => {},
                    color: 'secondary' as const,
                  },
                }
              : undefined
          }
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

  const renderListCard = (item: Deal, isSelected: boolean) => {
    const statusLabel = DEAL_STATUS_LABELS[item.status] || item.status;
    const statusColor =
      DEAL_STATUS_COLORS[item.status] || DEAL_STATUS_COLORS.OPEN;
    const stageName = item.stage?.name || 'Sem etapa';

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof Handshake;
      color: string;
    }[] = [
      {
        label: statusLabel,
        variant: 'outline',
        color: statusColor,
      },
      {
        label: stageName,
        variant: 'outline',
        icon: Layers,
        color:
          'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
      },
      ...(item.value !== undefined && item.value !== null
        ? [
            {
              label: formatCurrency(item.value),
              variant: 'outline' as const,
              icon: CircleDollarSign as typeof Handshake,
              color:
                'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
            },
          ]
        : []),
      ...(item.customer
        ? [
            {
              label: item.customer.name,
              variant: 'outline' as const,
              icon: User as typeof Handshake,
              color:
                'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          dealsConfig.permissions.update &&
          hasPermission(dealsConfig.permissions.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(dealsConfig.permissions.delete)
            ? [
                {
                  id: 'delete',
                  label: 'Excluir',
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
                {item.title}
              </span>
              {item.pipeline && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {item.pipeline.name}
                </span>
              )}
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
          icon={Handshake}
          iconBgColor={STATUS_ICON_COLORS[item.status]}
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

  const initialIds = useMemo(() => deals.map(i => i.id), [deals]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-deal',
        title: 'Novo Negócio',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: dealsConfig.permissions.create,
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
        namespace: 'deals',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Negócios', href: '/sales/deals' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Negócios"
            description="Gerencie os negócios do pipeline de vendas"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={dealsConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar negócios"
              message="Ocorreu um erro ao tentar carregar os negócios. Por favor, tente novamente."
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
                config={dealsConfig}
                items={deals}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={CircleDollarSign}
                      options={statusOptions}
                      selected={statusFilter}
                      onSelectionChange={setStatusFilter}
                      activeColor="emerald"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <FilterDropdown
                      label="Pipeline"
                      icon={Layers}
                      options={pipelineOptions}
                      selected={pipelineFilter}
                      onSelectionChange={setPipelineFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar pipeline..."
                      emptyText="Nenhum pipeline encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'negócio' : 'negócios'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/deals/${item.id}`)
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

          {/* Create Wizard */}
          <CreateDealWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(data);
              toast.success('Negócio criado com sucesso!');
            }}
            isSubmitting={createMutation.isPending}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para excluir este negócio. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} negócios. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
