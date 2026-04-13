/**
 * OpenSea OS - Cashier Sessions Page
 * Página de gerenciamento de sessões de caixa com infinite scroll e filtros
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
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCashierSessionsInfinite,
  useOpenCashierSession,
} from '@/hooks/sales/use-cashier';
import { CreateCashierSessionWizard } from './src/components/create-cashier-wizard';
import type { CashierSession, CashierSessionStatus } from '@/types/sales';
import { CASHIER_SESSION_STATUS_LABELS } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  Banknote,
  Calculator,
  DollarSign,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
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

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function CashierPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <CashierPageContent />
    </Suspense>
  );
}

function CashierPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE
  // ============================================================================

  const statusFilter = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

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
    data: infiniteData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCashierSessionsInfinite({
    status: statusFilter.length === 1 ? statusFilter[0] : undefined,
    sortBy,
    sortOrder,
  });

  const openMutation = useOpenCashierSession();

  const sessions = useMemo(() => {
    return (infiniteData?.pages.flatMap(p => p.sessions) ??
      []) as unknown as CashierSession[];
  }, [infiniteData]);

  const total = sessions.length;

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
    (params: { status?: string[] }) => {
      const parts: string[] = [];
      const s = params.status !== undefined ? params.status : statusFilter;
      if (s.length > 0) parts.push(`status=${s.join(',')}`);
      return parts.length > 0
        ? `/sales/cashier?${parts.join('&')}`
        : '/sales/cashier';
    },
    [statusFilter]
  );

  const setStatusFilterUrl = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const statusOptions = useMemo(
    () =>
      Object.entries(CASHIER_SESSION_STATUS_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  // ============================================================================
  // STATUS COLOR HELPER
  // ============================================================================

  const getStatusColor = (status: CashierSessionStatus) => {
    switch (status) {
      case 'OPEN':
        return 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300';
      case 'CLOSED':
        return 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400';
      case 'RECONCILED':
        return 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300';
      default:
        return '';
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) router.push(`/sales/cashier/${ids[0]}`);
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) router.push(`/sales/cashier/${ids[0]}/edit`);
  };

  const handleContextDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.info('Sessões de caixa não podem ser excluídas diretamente.');
  }, []);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: CashierSession, isSelected: boolean) => {
    const statusLabel =
      CASHIER_SESSION_STATUS_LABELS[item.status] || item.status;
    const diff = item.difference ?? 0;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          item.status === 'OPEN' &&
          hasPermission(SALES_PERMISSIONS.CASHIER.ADMIN)
            ? handleContextEdit
            : undefined
        }
        actions={[]}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={`Sessão #${item.id.substring(0, 8)}`}
          subtitle={formatCurrency(item.openingBalance)}
          icon={Calculator}
          iconBgColor="bg-linear-to-br from-teal-500 to-cyan-600"
          badges={[
            {
              label: statusLabel,
              variant: 'default',
            },
            ...(item.closingBalance !== undefined &&
            item.closingBalance !== null
              ? [
                  {
                    label: `Fechamento: ${formatCurrency(item.closingBalance)}`,
                    variant: 'default' as const,
                  },
                ]
              : []),
          ]}
          footer={
            diff !== 0
              ? {
                  type: 'single' as const,
                  button: {
                    icon: diff > 0 ? TrendingUp : TrendingDown,
                    label: `Diferença: ${formatCurrency(diff)}`,
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
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: CashierSession, isSelected: boolean) => {
    const statusLabel =
      CASHIER_SESSION_STATUS_LABELS[item.status] || item.status;
    const diff = item.difference ?? 0;

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof DollarSign;
      color: string;
    }[] = [
      {
        label: statusLabel,
        variant: 'outline',
        color: getStatusColor(item.status),
      },
      {
        label: `Abertura: ${formatCurrency(item.openingBalance)}`,
        variant: 'outline',
        icon: Banknote as typeof DollarSign,
        color:
          'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
      },
      ...(item.closingBalance !== undefined && item.closingBalance !== null
        ? [
            {
              label: `Fechamento: ${formatCurrency(item.closingBalance)}`,
              variant: 'outline' as const,
              color:
                'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
            },
          ]
        : []),
      ...(diff !== 0
        ? [
            {
              label: `Dif: ${formatCurrency(diff)}`,
              variant: 'outline' as const,
              icon: (diff > 0 ? TrendingUp : TrendingDown) as typeof DollarSign,
              color:
                diff > 0
                  ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                  : 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          item.status === 'OPEN' &&
          hasPermission(SALES_PERMISSIONS.CASHIER.ADMIN)
            ? handleContextEdit
            : undefined
        }
        actions={[]}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                Sessão #{item.id.substring(0, 8)}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(item.openedAt).toLocaleDateString('pt-BR')}
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
          icon={Calculator}
          iconBgColor="bg-linear-to-br from-teal-500 to-cyan-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => sessions.map(i => i.id), [sessions]);

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'open-session',
        title: 'Abrir Caixa',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: SALES_PERMISSIONS.CASHIER.OPEN,
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
        namespace: 'cashier',
        initialIds,
      }}
    >
      <PageLayout data-testid="cashier-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Caixa', href: '/sales/cashier' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Caixa"
            description="Gerencie sessões de caixa e movimentações"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            placeholder="Buscar sessões..."
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
              title="Erro ao carregar sessões"
              message="Ocorreu um erro ao tentar carregar as sessões de caixa. Por favor, tente novamente."
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
                config={{
                  display: {
                    labels: { singular: 'sessão', plural: 'sessões' },
                    titleField: 'id' as const,
                  },
                  name: 'cashier-session',
                  api: { baseUrl: '' },
                  routes: { list: '/sales/cashier' },
                  permissions: { view: '', create: '', delete: '' },
                }}
                items={sessions}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={Calculator}
                      options={statusOptions}
                      selected={statusFilter}
                      onSelectionChange={setStatusFilterUrl}
                      activeColor="cyan"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'sessão' : 'sessões'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/cashier/${item.id}`)
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

              <div ref={sentinelRef} className="h-1" />
            </>
          )}

          <CreateCashierSessionWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await openMutation.mutateAsync(
                data as unknown as Record<string, unknown>
              );
              toast.success('Caixa aberto com sucesso!');
            }}
            isSubmitting={openMutation.isPending}
          />

          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Ação"
            description="Sessões de caixa não podem ser excluídas."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
