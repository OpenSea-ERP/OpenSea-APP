/**
 * OpenSea OS - Contratos
 * Listagem de contratos com infinite scroll, filtros server-side e EntityGrid
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { contractConfig } from '@/config/entities/contract.config';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useContractsInfinite,
  useDeleteContract,
  type ContractsFilters,
} from '@/hooks/finance/use-contracts';
import { cn } from '@/lib/utils';
import type { Contract, ContractStatus } from '@/types/finance';
import { CONTRACT_STATUS_LABELS, PAYMENT_FREQUENCY_LABELS } from '@/types/finance';
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
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
import { CreateContractWizard } from './src/components/create-contract-wizard';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
  { id: 'DRAFT', label: 'Rascunho' },
  { id: 'ACTIVE', label: 'Ativo' },
  { id: 'EXPIRED', label: 'Expirado' },
  { id: 'RENEWED', label: 'Renovado' },
  { id: 'CANCELLED', label: 'Cancelado' },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr));
}

function getStatusColor(status: ContractStatus): string {
  const colors: Record<ContractStatus, string> = {
    DRAFT:
      'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
    ACTIVE:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    EXPIRED:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
    RENEWED:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
    CANCELLED:
      'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
  };
  return colors[status] ?? colors.DRAFT;
}

function getDaysUntilExpirationLabel(contract: Contract): string | null {
  if (contract.isExpired) return 'Expirado';
  if (contract.daysUntilExpiration > 0 && contract.daysUntilExpiration <= 30) {
    return `${contract.daysUntilExpiration}d restantes`;
  }
  return null;
}

// ============================================================================
// TYPES
// ============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ContractsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <ContractsPageContent />
    </Suspense>
  );
}

function ContractsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSION FLAGS
  // ============================================================================

  const canView = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.REGISTER);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.REMOVE);

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const statusIds = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<
    'createdAt' | 'startDate' | 'endDate' | 'paymentAmount' | 'status'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // ============================================================================
  // DATA: Infinite scroll + filter dropdown sources
  // ============================================================================

  const filters: ContractsFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusIds.length === 1 ? statusIds[0] : undefined,
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, statusIds, sortBy, sortOrder]
  );

  const {
    contracts,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useContractsInfinite(filters);

  // Mutations
  const deleteMutation = useDeleteContract();

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      observerEntries => {
        if (
          observerEntries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
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
      const sts = params.status !== undefined ? params.status : statusIds;
      if (sts.length > 0) parts.push(`status=${sts.join(',')}`);
      return parts.length > 0
        ? `/finance/contracts?${parts.join('&')}`
        : '/finance/contracts';
    },
    [statusIds]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/contracts/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/contracts/${ids[0]}/edit`);
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
        ? 'Contrato excluído com sucesso!'
        : `${itemsToDelete.length} contratos excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Contract, isSelected: boolean) => {
    const expiryLabel = getDaysUntilExpirationLabel(item);
    const isNearExpiry =
      !item.isExpired &&
      item.daysUntilExpiration > 0 &&
      item.daysUntilExpiration <= 30;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={[
          ...(canEdit && !item.isCancelled
            ? [
                {
                  id: 'generate-entries',
                  label: 'Gerar Lançamentos',
                  icon: Play,
                  onClick: (ids: string[]) => {
                    if (ids.length === 1) {
                      router.push(`/finance/contracts/${ids[0]}`);
                    }
                  },
                  separator: 'before' as const,
                },
              ]
            : []),
          ...(canDelete
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
          subtitle={item.companyName}
          icon={FileText}
          iconBgColor="bg-linear-to-br from-teal-500 to-teal-600"
          badges={[
            {
              label: CONTRACT_STATUS_LABELS[item.status],
              variant: 'outline' as const,
              color: getStatusColor(item.status),
            },
            ...(item.autoRenew
              ? [
                  {
                    label: 'Auto-renovação',
                    variant: 'outline' as const,
                    icon: RefreshCw,
                    color:
                      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
                  },
                ]
              : []),
            ...(expiryLabel
              ? [
                  {
                    label: expiryLabel,
                    variant: 'outline' as const,
                    icon: AlertTriangle,
                    color: item.isExpired
                      ? 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300'
                      : isNearExpiry
                        ? 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300'
                        : '',
                  },
                ]
              : []),
          ]}
          footer={{
            type: 'split',
            left: {
              icon: DollarSign,
              label: formatCurrency(item.paymentAmount),
              onClick: () => {},
              color: 'secondary',
            },
            right: {
              icon: Calendar,
              label: `${formatDate(item.startDate)} → ${formatDate(item.endDate)}`,
              onClick: () => {},
              color: 'secondary',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt ?? undefined}
          showStatusBadges={false}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Contract, isSelected: boolean) => {
    const expiryLabel = getDaysUntilExpirationLabel(item);
    const isNearExpiry =
      !item.isExpired &&
      item.daysUntilExpiration > 0 &&
      item.daysUntilExpiration <= 30;

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof AlertTriangle;
      color: string;
    }[] = [
      {
        label: CONTRACT_STATUS_LABELS[item.status],
        variant: 'outline',
        color: getStatusColor(item.status),
      },
      ...(item.autoRenew
        ? [
            {
              label: 'Auto-renovação',
              variant: 'outline' as const,
              icon: RefreshCw,
              color:
                'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
            },
          ]
        : []),
      ...(expiryLabel
        ? [
            {
              label: expiryLabel,
              variant: 'outline' as const,
              icon: AlertTriangle,
              color: item.isExpired
                ? 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300'
                : isNearExpiry
                  ? 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300'
                  : '',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={[
          ...(canEdit && !item.isCancelled
            ? [
                {
                  id: 'generate-entries',
                  label: 'Gerar Lançamentos',
                  icon: Play,
                  onClick: (ids: string[]) => {
                    if (ids.length === 1) {
                      router.push(`/finance/contracts/${ids[0]}`);
                    }
                  },
                  separator: 'before' as const,
                },
              ]
            : []),
          ...(canDelete
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
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {item.code}
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
          icon={FileText}
          iconBgColor="bg-linear-to-br from-teal-500 to-teal-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt ?? undefined}
          showStatusBadges={false}
        >
          {/* Right zone: payment amount + period */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
              {formatCurrency(item.paymentAmount)}
            </span>
            <span className="text-xs text-muted-foreground">
              {item.companyName} · {PAYMENT_FREQUENCY_LABELS[item.paymentFrequency]}
            </span>
          </div>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => contracts.map(c => c.id), [contracts]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreateClick = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-contract',
        title: 'Novo Contrato',
        icon: Plus,
        onClick: handleCreateClick,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.CONTRACTS.REGISTER,
      },
    ],
    [handleCreateClick]
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
        namespace: 'contracts',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Contratos', href: '/finance/contracts' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Contratos"
            description="Gerencie contratos com fornecedores e pagamentos recorrentes"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={contractConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar contratos"
              message="Ocorreu um erro ao tentar carregar os contratos. Por favor, tente novamente."
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
                config={contractConfig}
                items={contracts}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={FileText}
                      options={STATUS_OPTIONS}
                      selected={statusIds}
                      onSelectionChange={setStatusFilter}
                      activeColor="teal"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total}{' '}
                      {total === 1 ? 'contrato' : 'contratos'}
                      {contracts.length < total &&
                        ` (${contracts.length} carregados)`}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/finance/contracts/${item.id}`)
                }
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(
                      field as
                        | 'createdAt'
                        | 'startDate'
                        | 'endDate'
                        | 'paymentAmount'
                        | 'status'
                    );
                    setSortOrder(direction);
                  }
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
          <CreateContractWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            onCreated={() => {
              refetch();
            }}
          />

          {/* Delete PIN Confirmation Modal */}
          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setItemsToDelete([]);
            }}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de Ação para confirmar a exclusão deste contrato. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de Ação para excluir ${itemsToDelete.length} contratos. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
