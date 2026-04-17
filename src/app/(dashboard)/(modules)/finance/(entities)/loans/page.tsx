/**
 * OpenSea OS - Empréstimos (Loans)
 * Listagem de empréstimos com infinite scroll, filtros server-side e EntityGrid
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
import { loanConfig } from '@/config/entities/loan.config';
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
  useLoansInfinite,
  useDeleteLoan,
  type LoansFilters,
} from '@/hooks/finance/use-loans';
import { cn } from '@/lib/utils';
import type { Loan, LoanStatus, LoanType } from '@/types/finance';
import { LOAN_STATUS_LABELS, LOAN_TYPE_LABELS } from '@/types/finance';
import { DollarSign, Landmark, Loader2, Plus, Tag, Trash2 } from 'lucide-react';
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
import { CreateLoanWizard } from './src/components/create-loan-wizard';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
  { id: 'ACTIVE', label: 'Ativo' },
  { id: 'PAID_OFF', label: 'Quitado' },
  { id: 'DEFAULTED', label: 'Inadimplente' },
  { id: 'RENEGOTIATED', label: 'Renegociado' },
  { id: 'CANCELLED', label: 'Cancelado' },
];

const TYPE_OPTIONS = [
  { id: 'PERSONAL', label: 'Pessoal' },
  { id: 'BUSINESS', label: 'Empresarial' },
  { id: 'WORKING_CAPITAL', label: 'Capital de Giro' },
  { id: 'EQUIPMENT', label: 'Financ. Equipamento' },
  { id: 'REAL_ESTATE', label: 'Financ. Imobiliário' },
  { id: 'CREDIT_LINE', label: 'Linha de Crédito' },
  { id: 'OTHER', label: 'Outro' },
];

const ACTIVE_LOAN_STATUSES: LoanStatus[] = [
  'ACTIVE',
  'DEFAULTED',
  'RENEGOTIATED',
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

function getStatusColor(status: LoanStatus): string {
  const colors: Record<LoanStatus, string> = {
    ACTIVE:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    PAID_OFF:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
    DEFAULTED:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
    RENEGOTIATED:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    CANCELLED:
      'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-600 dark:text-slate-400',
  };
  return colors[status] ?? colors.ACTIVE;
}

function getTypeColor(): string {
  return 'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300';
}

function getProgressPercentage(loan: Loan): number {
  if (loan.totalInstallments <= 0) return 0;
  return Math.round((loan.paidInstallments / loan.totalInstallments) * 100);
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

export default function LoansPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <LoansPageContent />
    </Suspense>
  );
}

function LoansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSION FLAGS
  // ============================================================================

  const canView = hasPermission(FINANCE_PERMISSIONS.LOANS.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.LOANS.REGISTER);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.LOANS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.LOANS.REMOVE);

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const statusIds = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const typeIds = useMemo(() => {
    const raw = searchParams.get('type');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<
    | 'createdAt'
    | 'totalAmount'
    | 'institution'
    | 'status'
    | 'name'
    | 'principalAmount'
    | 'outstandingBalance'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // ============================================================================
  // DATA: Infinite scroll entries + filter dropdown sources
  // ============================================================================

  const filters: LoansFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusIds.length === 1 ? (statusIds[0] as LoanStatus) : undefined,
      type: typeIds.length === 1 ? (typeIds[0] as LoanType) : undefined,
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, statusIds, typeIds, sortBy, sortOrder]
  );

  const {
    loans,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useLoansInfinite(filters);

  // Mutations
  const deleteMutation = useDeleteLoan();

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
    (params: { status?: string[]; type?: string[] }) => {
      const parts: string[] = [];
      const sts = params.status !== undefined ? params.status : statusIds;
      const tp = params.type !== undefined ? params.type : typeIds;
      if (sts.length > 0) parts.push(`status=${sts.join(',')}`);
      if (tp.length > 0) parts.push(`type=${tp.join(',')}`);
      return parts.length > 0
        ? `/finance/loans?${parts.join('&')}`
        : '/finance/loans';
    },
    [statusIds, typeIds]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  const setTypeFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ type: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/loans/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/loans/${ids[0]}/edit`);
    }
  };

  const handleContextDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  };

  const handleRegisterPayment = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        // Navigate to loan detail page (payment tab)
        router.push(`/finance/loans/${ids[0]}`);
      }
    },
    [router]
  );

  const handleDeleteConfirm = useCallback(async () => {
    // P0-35: report partial failures truthfully.
    const results = await Promise.allSettled(
      itemsToDelete.map(id => deleteMutation.mutateAsync(id))
    );
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - succeeded;
    if (succeeded > 0) {
      toast.success(
        succeeded === 1
          ? 'Empréstimo excluído com sucesso!'
          : `${succeeded} empréstimos excluídos!`
      );
    }
    if (failed > 0) {
      toast.error(
        failed === 1
          ? 'Falha ao excluir 1 empréstimo.'
          : `Falha ao excluir ${failed} empréstimos.`
      );
    }
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Loan, isSelected: boolean) => {
    const progress = getProgressPercentage(item);
    const isDefaulted = item.status === 'DEFAULTED';

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={[
          ...(canEdit && ACTIVE_LOAN_STATUSES.includes(item.status)
            ? [
                {
                  id: 'register-payment',
                  label: 'Registrar Pagamento',
                  icon: DollarSign,
                  onClick: handleRegisterPayment,
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
          title={item.name}
          subtitle={LOAN_TYPE_LABELS[item.type]}
          icon={Landmark}
          iconBgColor={
            isDefaulted
              ? 'bg-linear-to-br from-rose-500 to-rose-600'
              : 'bg-linear-to-br from-orange-500 to-orange-600'
          }
          badges={[
            {
              label: LOAN_STATUS_LABELS[item.status],
              variant: 'outline' as const,
              color: getStatusColor(item.status),
            },
            {
              label: LOAN_TYPE_LABELS[item.type],
              variant: 'outline' as const,
              icon: Tag,
              color: getTypeColor(),
            },
          ]}
          footer={{
            type: 'split',
            left: {
              icon: DollarSign,
              label: formatCurrency(item.principalAmount),
              onClick: () => {},
              color: 'secondary',
            },
            right: {
              label: `${progress}%`,
              onClick: () => {},
              color: 'secondary',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={false}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Loan, isSelected: boolean) => {
    const progress = getProgressPercentage(item);

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof Tag;
      color: string;
    }[] = [
      {
        label: LOAN_STATUS_LABELS[item.status],
        variant: 'outline',
        color: getStatusColor(item.status),
      },
      {
        label: LOAN_TYPE_LABELS[item.type],
        variant: 'outline' as const,
        icon: Tag,
        color: getTypeColor(),
      },
      ...(item.contractNumber
        ? [
            {
              label: item.contractNumber,
              variant: 'outline' as const,
              color:
                'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
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
          ...(canEdit && ACTIVE_LOAN_STATUSES.includes(item.status)
            ? [
                {
                  id: 'register-payment',
                  label: 'Registrar Pagamento',
                  icon: DollarSign,
                  onClick: handleRegisterPayment,
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
                {item.name}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {LOAN_TYPE_LABELS[item.type]}
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
          icon={Landmark}
          iconBgColor="bg-linear-to-br from-orange-500 to-orange-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={false}
        >
          {/* Right zone: amount + progress */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
              {formatCurrency(item.principalAmount)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                {item.paidInstallments}/{item.totalInstallments}
              </span>
              {/* Mini progress bar */}
              <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    progress >= 80
                      ? 'bg-emerald-500'
                      : progress >= 50
                        ? 'bg-sky-500'
                        : progress >= 25
                          ? 'bg-amber-500'
                          : 'bg-gray-400'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          </div>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => loans.map(l => l.id), [loans]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreateClick = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-loan',
        title: 'Novo Empréstimo',
        icon: Plus,
        onClick: handleCreateClick,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.LOANS.REGISTER,
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
        namespace: 'loans',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Empréstimos', href: '/finance/loans' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Empréstimos"
            description="Gerencie empréstimos, financiamentos e linhas de crédito"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="loans-page" className="contents" />
          {/* Search Bar */}
          <div data-testid="loans-search">
            <SearchBar
              placeholder={loanConfig.display.labels.searchPlaceholder}
              value={searchQuery}
              onSearch={setSearchQuery}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="md"
            />
          </div>

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="list" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar empréstimos"
              message="Ocorreu um erro ao tentar carregar os empréstimos. Por favor, tente novamente."
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
                config={loanConfig}
                items={loans}
                showItemCount={false}
                toolbarStart={
                  <>
                    <div data-testid="loans-filter-status">
                      <FilterDropdown
                        label="Status"
                        icon={Landmark}
                        options={STATUS_OPTIONS}
                        selected={statusIds}
                        onSelectionChange={setStatusFilter}
                        activeColor="emerald"
                        searchPlaceholder="Buscar status..."
                        emptyText="Nenhum status encontrado."
                      />
                    </div>
                    <div data-testid="loans-filter-type">
                      <FilterDropdown
                        label="Tipo"
                        icon={Tag}
                        options={TYPE_OPTIONS}
                        selected={typeIds}
                        onSelectionChange={setTypeFilter}
                        activeColor="violet"
                        searchPlaceholder="Buscar tipo..."
                        emptyText="Nenhum tipo encontrado."
                      />
                    </div>
                    <p
                      className="text-sm text-muted-foreground whitespace-nowrap"
                      data-testid="loans-count"
                    >
                      {total} {total === 1 ? 'empréstimo' : 'empréstimos'}
                      {loans.length < total && ` (${loans.length} carregados)`}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/finance/loans/${item.id}`)
                }
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(field as typeof sortBy);
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
          <CreateLoanWizard
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
                ? 'Digite seu PIN de Ação para confirmar a exclusão deste empréstimo. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de Ação para excluir ${itemsToDelete.length} empréstimos. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
