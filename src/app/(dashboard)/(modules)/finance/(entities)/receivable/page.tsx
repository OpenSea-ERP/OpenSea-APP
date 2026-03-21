/**
 * OpenSea OS - Contas a Receber (Accounts Receivable)
 * Listagem de lancamentos financeiros do tipo RECEIVABLE com infinite scroll e filtros server-side
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { BaixaModal } from '@/components/finance/baixa-modal';
import { ReceivableWizardModal } from '@/components/finance/receivable-wizard-modal';
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
import { financeEntryConfig } from '@/config/entities/finance-entry.config';
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
  useFinanceEntriesInfinite,
  useDeleteFinanceEntry,
  type FinanceEntriesFilters,
} from '@/hooks/finance/use-finance-entries';
import { useFinanceCategories } from '@/hooks/finance/use-finance-categories';
import { cn } from '@/lib/utils';
import type { FinanceEntry, FinanceEntryStatus } from '@/types/finance';
import { FINANCE_ENTRY_STATUS_LABELS } from '@/types/finance';
import {
  ArrowUpCircle,
  CalendarDays,
  DollarSign,
  Loader2,
  Plus,
  Tag,
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

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
  { id: 'PENDING', label: 'Pendente' },
  { id: 'OVERDUE', label: 'Vencido' },
  { id: 'RECEIVED', label: 'Recebido' },
  { id: 'PAID', label: 'Pago' },
  { id: 'PARTIALLY_PAID', label: 'Parcialmente Pago' },
  { id: 'CANCELLED', label: 'Cancelado' },
  { id: 'SCHEDULED', label: 'Agendado' },
];

const RECEIVABLE_STATUSES: FinanceEntryStatus[] = [
  'PENDING',
  'OVERDUE',
  'PARTIALLY_PAID',
];

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getStatusColor(status: FinanceEntryStatus): string {
  const colors: Record<FinanceEntryStatus, string> = {
    PENDING:
      'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
    OVERDUE:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
    PAID: 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    RECEIVED:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    PARTIALLY_PAID:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    CANCELLED:
      'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
    SCHEDULED:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  };
  return colors[status] ?? colors.PENDING;
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

export default function ReceivablePage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <ReceivablePageContent />
    </Suspense>
  );
}

function ReceivablePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSION FLAGS
  // ============================================================================

  const canView = hasPermission(FINANCE_PERMISSIONS.ENTRIES.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.ENTRIES.REGISTER);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.ENTRIES.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.ENTRIES.REMOVE);

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const statusIds = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const categoryIds = useMemo(() => {
    const raw = searchParams.get('category');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<
    'createdAt' | 'dueDate' | 'expectedAmount' | 'description' | 'status'
  >('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [baixaEntry, setBaixaEntry] = useState<FinanceEntry | null>(null);
  const [baixaOpen, setBaixaOpen] = useState(false);

  // ============================================================================
  // DATA: Infinite scroll entries + filter dropdown sources
  // ============================================================================

  const filters: FinanceEntriesFilters = useMemo(
    () => ({
      type: 'RECEIVABLE' as const,
      search: debouncedSearch || undefined,
      status: statusIds.length === 1 ? statusIds[0] : undefined,
      categoryId: categoryIds.length === 1 ? categoryIds[0] : undefined,
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, statusIds, categoryIds, sortBy, sortOrder]
  );

  const {
    entries,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useFinanceEntriesInfinite(filters);

  // Category dropdown source
  const { data: categoriesData } = useFinanceCategories();
  const categories = categoriesData?.categories ?? [];

  const categoryOptions = useMemo(
    () =>
      categories
        .filter(c => c.type === 'REVENUE' || c.type === 'BOTH')
        .map(c => ({ id: c.id, label: c.name })),
    [categories]
  );

  // Mutations
  const deleteMutation = useDeleteFinanceEntry();

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
    (params: { status?: string[]; category?: string[] }) => {
      const parts: string[] = [];
      const sts = params.status !== undefined ? params.status : statusIds;
      const cat = params.category !== undefined ? params.category : categoryIds;
      if (sts.length > 0) parts.push(`status=${sts.join(',')}`);
      if (cat.length > 0) parts.push(`category=${cat.join(',')}`);
      return parts.length > 0
        ? `/finance/receivable?${parts.join('&')}`
        : '/finance/receivable';
    },
    [statusIds, categoryIds]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  const setCategoryFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ category: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/receivable/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/receivable/${ids[0]}/edit`);
    }
  };

  const handleContextDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  };

  const handleOpenBaixa = useCallback(
    (ids: string[]) => {
      if (ids.length !== 1) return;
      const entry = entries.find(e => e.id === ids[0]);
      if (entry) {
        setBaixaEntry(entry);
        setBaixaOpen(true);
      }
    },
    [entries]
  );

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Conta a receber excluída com sucesso!'
        : `${itemsToDelete.length} contas a receber excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  // Get category rates for the selected baixa entry
  const baixaCategoryRates = useMemo(() => {
    if (!baixaEntry) return { interestRate: undefined, penaltyRate: undefined };
    const cat = categories.find(c => c.id === baixaEntry.categoryId);
    return {
      interestRate: cat?.interestRate ?? undefined,
      penaltyRate: cat?.penaltyRate ?? undefined,
    };
  }, [baixaEntry, categories]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: FinanceEntry, isSelected: boolean) => {
    const isOverdue =
      item.isOverdue &&
      item.status !== 'RECEIVED' &&
      item.status !== 'PAID' &&
      item.status !== 'CANCELLED';

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={[
          ...(canEdit && RECEIVABLE_STATUSES.includes(item.status)
            ? [
                {
                  id: 'register-receipt',
                  label: 'Registrar Recebimento',
                  icon: DollarSign,
                  onClick: handleOpenBaixa,
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
          title={item.description || 'Sem descrição'}
          subtitle={item.customerName || item.supplierName || 'Sem cliente'}
          icon={ArrowUpCircle}
          iconBgColor={
            isOverdue
              ? 'bg-linear-to-br from-rose-500 to-rose-600'
              : 'bg-linear-to-br from-green-500 to-green-600'
          }
          badges={[
            {
              label: FINANCE_ENTRY_STATUS_LABELS[item.status],
              variant: 'outline' as const,
              color: getStatusColor(item.status),
            },
            ...(item.categoryName
              ? [
                  {
                    label: item.categoryName,
                    variant: 'outline' as const,
                    icon: Tag,
                    color:
                      'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
                  },
                ]
              : []),
            ...(isOverdue
              ? [
                  {
                    label: 'Vencido',
                    variant: 'outline' as const,
                    color:
                      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
                  },
                ]
              : []),
          ]}
          footer={{
            type: 'single',
            button: {
              icon: DollarSign,
              label: formatCurrency(item.expectedAmount),
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

  const renderListCard = (item: FinanceEntry, isSelected: boolean) => {
    const isOverdue =
      item.isOverdue &&
      item.status !== 'RECEIVED' &&
      item.status !== 'PAID' &&
      item.status !== 'CANCELLED';

    const installmentLabel =
      item.currentInstallment != null &&
      item.totalInstallments != null &&
      item.totalInstallments > 1
        ? ` (${item.currentInstallment}/${item.totalInstallments})`
        : '';

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof Tag;
      color: string;
    }[] = [
      {
        label: FINANCE_ENTRY_STATUS_LABELS[item.status],
        variant: 'outline',
        color: getStatusColor(item.status),
      },
      ...(item.categoryName
        ? [
            {
              label: item.categoryName,
              variant: 'outline' as const,
              icon: Tag,
              color:
                'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
            },
          ]
        : []),
      ...(item.customerName
        ? [
            {
              label: item.customerName,
              variant: 'outline' as const,
              color:
                'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
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
          ...(canEdit && RECEIVABLE_STATUSES.includes(item.status)
            ? [
                {
                  id: 'register-receipt',
                  label: 'Registrar Recebimento',
                  icon: DollarSign,
                  onClick: handleOpenBaixa,
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
                {item.description || 'Sem descrição'}
                {installmentLabel}
              </span>
              {item.code && (
                <span className="text-xs text-muted-foreground shrink-0 font-mono">
                  {item.code}
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
          icon={ArrowUpCircle}
          iconBgColor="bg-linear-to-br from-green-500 to-green-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={false}
        >
          {/* Right zone: amount + due date */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
              {formatCurrency(item.expectedAmount)}
            </span>
            <span
              className={cn(
                'text-xs flex items-center gap-1',
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-medium'
                  : 'text-muted-foreground'
              )}
            >
              <CalendarDays className="w-3 h-3" />
              {formatDate(item.dueDate)}
            </span>
          </div>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => entries.map(e => e.id), [entries]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreateClick = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-receivable',
        title: 'Nova Conta a Receber',
        icon: Plus,
        onClick: handleCreateClick,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.ENTRIES.REGISTER,
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
        namespace: 'receivable',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Contas a Receber', href: '/finance/receivable' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Contas a Receber"
            description="Gerencie os recebimentos de clientes"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={financeEntryConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar contas a receber"
              message="Ocorreu um erro ao tentar carregar as contas a receber. Por favor, tente novamente."
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
                config={financeEntryConfig}
                items={entries}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={ArrowUpCircle}
                      options={STATUS_OPTIONS}
                      selected={statusIds}
                      onSelectionChange={setStatusFilter}
                      activeColor="green"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <FilterDropdown
                      label="Categoria"
                      icon={Tag}
                      options={categoryOptions}
                      selected={categoryIds}
                      onSelectionChange={setCategoryFilter}
                      activeColor="teal"
                      searchPlaceholder="Buscar categoria..."
                      emptyText="Nenhuma categoria encontrada."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total}{' '}
                      {total === 1 ? 'recebimento' : 'recebimentos'}
                      {entries.length < total &&
                        ` (${entries.length} carregados)`}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/finance/receivable/${item.id}`)
                }
                showSorting={true}
                defaultSortField="dueDate"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(
                      field as
                        | 'createdAt'
                        | 'dueDate'
                        | 'expectedAmount'
                        | 'description'
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
          <ReceivableWizardModal
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            onCreated={() => {
              refetch();
            }}
          />

          {/* Baixa (Receipt Registration) Modal */}
          {baixaEntry && (
            <BaixaModal
              open={baixaOpen}
              onOpenChange={v => {
                setBaixaOpen(v);
                if (!v) setBaixaEntry(null);
              }}
              entry={baixaEntry}
              categoryInterestRate={baixaCategoryRates.interestRate}
              categoryPenaltyRate={baixaCategoryRates.penaltyRate}
            />
          )}

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
                ? 'Digite seu PIN de Ação para confirmar a exclusão desta conta a receber. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de Ação para excluir ${itemsToDelete.length} contas a receber. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
