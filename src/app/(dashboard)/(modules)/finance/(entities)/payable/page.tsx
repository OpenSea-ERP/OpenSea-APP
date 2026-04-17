/**
 * OpenSea OS - Contas a Pagar (Accounts Payable)
 * Listagem de lancamentos financeiros do tipo PAYABLE com infinite scroll e filtros server-side
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { BaixaModal } from '@/components/finance/baixa-modal';
import { BulkPayModal } from '@/components/finance/bulk-pay-modal';
import { BulkCategorizeModal } from '@/components/finance/bulk-categorize-modal';
import { SplitPaymentModal } from '@/components/finance/split-payment-modal';
import { PayableWizardModal } from '@/components/finance/payable-wizard-modal';
import { QuickEntryModal } from '@/components/finance/quick-entry-modal';
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
import {
  SelectionToolbar,
  type SelectionAction,
} from '@/core/components/selection-toolbar';
import { useSelectionContext } from '@/core/selection/selection-context';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useFinanceEntriesInfinite,
  useDeleteFinanceEntry,
  type FinanceEntriesFilters,
} from '@/hooks/finance/use-finance-entries';
import {
  useBulkCancelEntries,
  useBulkDeleteEntries,
} from '@/hooks/finance/use-finance-bulk-actions';
import { useFinanceCategories } from '@/hooks/finance/use-finance-categories';
import { cn } from '@/lib/utils';
import type { FinanceEntry, FinanceEntryStatus } from '@/types/finance';
import { FINANCE_ENTRY_STATUS_LABELS } from '@/types/finance';
import {
  AlertTriangle,
  ArrowDownCircle,
  CalendarDays,
  CheckCheck,
  DollarSign,
  FolderTree,
  Loader2,
  Plus,
  SplitSquareHorizontal,
  Tag,
  Trash2,
  XCircle,
  Zap,
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
  { id: 'PAID', label: 'Pago' },
  { id: 'PARTIALLY_PAID', label: 'Parcialmente Pago' },
  { id: 'CANCELLED', label: 'Cancelado' },
  { id: 'SCHEDULED', label: 'Agendado' },
];

const PAYABLE_STATUSES: FinanceEntryStatus[] = [
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

export default function PayablePage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <PayablePageContent />
    </Suspense>
  );
}

function PayablePageContent() {
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
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [splitPaymentOpen, setSplitPaymentOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [baixaEntry, setBaixaEntry] = useState<FinanceEntry | null>(null);
  const [baixaOpen, setBaixaOpen] = useState(false);

  // Bulk action modals
  const [bulkPayOpen, setBulkPayOpen] = useState(false);
  const [bulkCategorizeOpen, setBulkCategorizeOpen] = useState(false);
  const [bulkCancelModalOpen, setBulkCancelModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  // ============================================================================
  // DATA: Infinite scroll entries + filter dropdown sources
  // ============================================================================

  const filters: FinanceEntriesFilters = useMemo(
    () => ({
      type: 'PAYABLE' as const,
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
        .filter(c => c.type === 'EXPENSE' || c.type === 'BOTH')
        .map(c => ({ id: c.id, label: c.name })),
    [categories]
  );

  // Mutations
  const deleteMutation = useDeleteFinanceEntry();
  const bulkCancelMutation = useBulkCancelEntries();
  const bulkDeleteMutation = useBulkDeleteEntries();

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
        ? `/finance/payable?${parts.join('&')}`
        : '/finance/payable';
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
      router.push(`/finance/payable/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/payable/${ids[0]}/edit`);
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
    // P0-35: serial await would short-circuit on the first failure and the
    // toast message would still claim full success. allSettled lets every
    // delete run, then we report the truthful count of successes/failures.
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
          ? 'Conta a pagar excluída com sucesso!'
          : `${succeeded} contas a pagar excluídas!`
      );
    }
    if (failed > 0) {
      toast.error(
        failed === 1
          ? 'Falha ao excluir 1 conta a pagar.'
          : `Falha ao excluir ${failed} contas a pagar.`
      );
    }
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // BULK ACTION HANDLERS
  // ============================================================================

  const MAX_BULK = 50;

  const handleBulkAction = useCallback((ids: string[], action: () => void) => {
    if (ids.length > MAX_BULK) {
      toast.warning(
        `Selecione no máximo ${MAX_BULK} lançamentos por operação em lote.`
      );
      return;
    }
    // Capture a fresh snapshot so later confirm handlers see the intended ids
    // even if `bulkSelectedIds` is updated by another selection event.
    const snapshot = [...ids];
    setBulkSelectedIds(snapshot);
    action();
  }, []);

  const handleBulkCancelConfirm = useCallback(async () => {
    // Capture ids locally before the async call so we don't read a stale state
    // if selection changes during the confirmation flow.
    const ids = [...bulkSelectedIds];
    try {
      const result = await bulkCancelMutation.mutateAsync({
        entryIds: ids,
      });
      if (result.failed > 0) {
        toast.warning(
          `${result.success} de ${ids.length} lançamentos cancelados.`,
          {
            description: result.errors
              .map(e => e.error)
              .slice(0, 3)
              .join('; '),
          }
        );
      } else {
        toast.success(
          `${result.success} ${result.success === 1 ? 'lançamento cancelado' : 'lançamentos cancelados'} com sucesso.`
        );
      }
      setBulkCancelModalOpen(false);
      setBulkSelectedIds([]);
    } catch {
      toast.error('Erro ao cancelar lançamentos em lote.');
    }
  }, [bulkSelectedIds, bulkCancelMutation]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    const ids = [...bulkSelectedIds];
    try {
      const result = await bulkDeleteMutation.mutateAsync({
        entryIds: ids,
      });
      if (result.failed > 0) {
        toast.warning(
          `${result.success} de ${ids.length} lançamentos excluídos.`,
          {
            description: result.errors
              .map(e => e.error)
              .slice(0, 3)
              .join('; '),
          }
        );
      } else {
        toast.success(
          `${result.success} ${result.success === 1 ? 'lançamento excluído' : 'lançamentos excluídos'} com sucesso.`
        );
      }
      setBulkDeleteModalOpen(false);
      setBulkSelectedIds([]);
    } catch {
      toast.error('Erro ao excluir lançamentos em lote.');
    }
  }, [bulkSelectedIds, bulkDeleteMutation]);

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

  const getThreeWayMatchBadge = (item: FinanceEntry) => {
    switch (item.threeWayMatchStatus) {
      case 'FULL_MATCH':
        return {
          label: '3-way match',
          variant: 'outline' as const,
          icon: CheckCheck,
          color:
            'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
        };
      case 'PARTIAL_MATCH':
        return {
          label: 'Match parcial',
          variant: 'outline' as const,
          icon: AlertTriangle,
          color:
            'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
        };
      case 'NO_MATCH':
        return {
          label: 'Sem match',
          variant: 'outline' as const,
          icon: XCircle,
          color:
            'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
        };
      default:
        return null;
    }
  };

  const renderGridCard = (item: FinanceEntry, isSelected: boolean) => {
    const isOverdue =
      item.isOverdue && item.status !== 'PAID' && item.status !== 'CANCELLED';
    const matchBadge = getThreeWayMatchBadge(item);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={[
          ...(canEdit && PAYABLE_STATUSES.includes(item.status)
            ? [
                {
                  id: 'register-payment',
                  label: 'Registrar Pagamento',
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
          subtitle={item.supplierName || item.customerName || 'Sem fornecedor'}
          icon={ArrowDownCircle}
          // P0-36: overdue payables now read as a more saturated rose so
          // they are visually distinguishable from on-track entries (which
          // use the slate gradient). Previously both branches returned the
          // same string, making the indicator dead.
          iconBgColor={
            isOverdue
              ? 'bg-gradient-to-br from-rose-600 to-rose-700'
              : 'bg-gradient-to-br from-slate-500 to-slate-600'
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
            ...(matchBadge ? [matchBadge] : []),
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
      item.isOverdue && item.status !== 'PAID' && item.status !== 'CANCELLED';
    const matchBadge = getThreeWayMatchBadge(item);

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
      ...(item.supplierName
        ? [
            {
              label: item.supplierName,
              variant: 'outline' as const,
              color:
                'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
            },
          ]
        : []),
      ...(matchBadge ? [matchBadge] : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={[
          ...(canEdit && PAYABLE_STATUSES.includes(item.status)
            ? [
                {
                  id: 'register-payment',
                  label: 'Registrar Pagamento',
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
          icon={ArrowDownCircle}
          iconBgColor="bg-linear-to-br from-rose-500 to-rose-600"
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

  const handleQuickEntryClick = useCallback(() => {
    setQuickEntryOpen(true);
  }, []);

  const handleSplitPaymentClick = useCallback(() => {
    setSplitPaymentOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'split-payment',
        title: 'Pagamento em Lote',
        icon: SplitSquareHorizontal,
        onClick: handleSplitPaymentClick,
        variant: 'outline',
        permission: FINANCE_PERMISSIONS.ENTRIES.MODIFY,
      },
      {
        id: 'quick-entry-payable',
        title: 'Rápido',
        icon: Zap,
        onClick: handleQuickEntryClick,
        variant: 'outline',
        permission: FINANCE_PERMISSIONS.ENTRIES.REGISTER,
      },
      {
        id: 'create-payable',
        title: 'Nova Conta a Pagar',
        icon: Plus,
        onClick: handleCreateClick,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.ENTRIES.REGISTER,
      },
    ],
    [handleCreateClick, handleQuickEntryClick, handleSplitPaymentClick]
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
        namespace: 'payable',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Contas a Pagar', href: '/finance/payable' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Contas a Pagar"
            description="Gerencie os pagamentos a fornecedores"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="payable-page" className="contents" />
          {/* Search Bar */}
          <div data-testid="payable-search">
            <SearchBar
              placeholder={financeEntryConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar contas a pagar"
              message="Ocorreu um erro ao tentar carregar as contas a pagar. Por favor, tente novamente."
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
                    <div data-testid="payable-filter-status">
                      <FilterDropdown
                        label="Status"
                        icon={ArrowDownCircle}
                        options={STATUS_OPTIONS}
                        selected={statusIds}
                        onSelectionChange={setStatusFilter}
                        activeColor="violet"
                        searchPlaceholder="Buscar status..."
                        emptyText="Nenhum status encontrado."
                      />
                    </div>
                    <div data-testid="payable-filter-category">
                      <FilterDropdown
                        label="Categoria"
                        icon={Tag}
                        options={categoryOptions}
                        selected={categoryIds}
                        onSelectionChange={setCategoryFilter}
                        activeColor="cyan"
                        searchPlaceholder="Buscar categoria..."
                        emptyText="Nenhuma categoria encontrada."
                      />
                    </div>
                    <p
                      className="text-sm text-muted-foreground whitespace-nowrap"
                      data-testid="payable-count"
                    >
                      {total} {total === 1 ? 'lançamento' : 'lançamentos'}
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
                  router.push(`/finance/payable/${item.id}`)
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
          <PayableWizardModal
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            onCreated={() => {
              refetch();
            }}
          />

          {/* Quick Entry Modal */}
          <QuickEntryModal
            open={quickEntryOpen}
            onOpenChange={setQuickEntryOpen}
            defaultType="PAYABLE"
            onCreated={() => {
              refetch();
            }}
          />

          {/* Baixa (Payment Registration) Modal */}
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
              onSuccess={() => {
                setBaixaOpen(false);
                setBaixaEntry(null);
                refetch();
              }}
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
                ? 'Digite seu PIN de Ação para confirmar a exclusão desta conta a pagar. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de Ação para excluir ${itemsToDelete.length} contas a pagar. Esta ação não pode ser desfeita.`
            }
          />

          {/* Split Payment Modal */}
          <SplitPaymentModal
            open={splitPaymentOpen}
            onOpenChange={setSplitPaymentOpen}
            onSuccess={() => refetch()}
          />

          {/* Bulk Pay Modal */}
          <BulkPayModal
            open={bulkPayOpen}
            onOpenChange={setBulkPayOpen}
            selectedIds={bulkSelectedIds}
            entries={entries}
            onSuccess={() => {
              setBulkSelectedIds([]);
              refetch();
            }}
            actionLabel="Registrar Pagamento"
          />

          {/* Bulk Categorize Modal */}
          <BulkCategorizeModal
            open={bulkCategorizeOpen}
            onOpenChange={setBulkCategorizeOpen}
            selectedIds={bulkSelectedIds}
            onSuccess={() => setBulkSelectedIds([])}
            categoryType="EXPENSE"
          />

          {/* Bulk Cancel PIN Modal */}
          <VerifyActionPinModal
            isOpen={bulkCancelModalOpen}
            onClose={() => {
              setBulkCancelModalOpen(false);
              setBulkSelectedIds([]);
            }}
            onSuccess={handleBulkCancelConfirm}
            title="Confirmar Cancelamento em Lote"
            description={`Digite seu PIN de Ação para cancelar ${bulkSelectedIds.length} contas a pagar. Esta ação não pode ser desfeita.`}
          />

          {/* Bulk Delete PIN Modal */}
          <VerifyActionPinModal
            isOpen={bulkDeleteModalOpen}
            onClose={() => {
              setBulkDeleteModalOpen(false);
              setBulkSelectedIds([]);
            }}
            onSuccess={handleBulkDeleteConfirm}
            title="Confirmar Exclusão em Lote"
            description={`Digite seu PIN de Ação para excluir ${bulkSelectedIds.length} contas a pagar. Esta ação não pode ser desfeita.`}
          />

          {/* Selection Toolbar */}
          <PayableSelectionToolbar
            totalItems={total}
            canEdit={canEdit}
            canDelete={canDelete}
            onBulkPay={ids => handleBulkAction(ids, () => setBulkPayOpen(true))}
            onBulkCategorize={ids =>
              handleBulkAction(ids, () => setBulkCategorizeOpen(true))
            }
            onBulkCancel={ids =>
              handleBulkAction(ids, () => setBulkCancelModalOpen(true))
            }
            onBulkDelete={ids =>
              handleBulkAction(ids, () => setBulkDeleteModalOpen(true))
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}

// ============================================================================
// SELECTION TOOLBAR SUB-COMPONENT
// ============================================================================

function PayableSelectionToolbar({
  totalItems,
  canEdit,
  canDelete,
  onBulkPay,
  onBulkCategorize,
  onBulkCancel,
  onBulkDelete,
}: {
  totalItems: number;
  canEdit: boolean;
  canDelete: boolean;
  onBulkPay: (ids: string[]) => void;
  onBulkCategorize: (ids: string[]) => void;
  onBulkCancel: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
}) {
  const { actions, getSelectedArray } = useSelectionContext();
  const selectedIds = getSelectedArray();

  const selectionActions = useMemo(() => {
    const acts: SelectionAction[] = [];

    if (canEdit) {
      acts.push({
        id: 'bulk-pay',
        label: 'Registrar Pagamento',
        icon: DollarSign,
        onClick: onBulkPay,
        variant: 'default',
      });

      acts.push({
        id: 'bulk-categorize',
        label: 'Alterar Categoria',
        icon: FolderTree,
        onClick: onBulkCategorize,
        variant: 'outline',
      });

      acts.push({
        id: 'bulk-cancel',
        label: 'Cancelar',
        icon: XCircle,
        onClick: onBulkCancel,
        variant: 'outline',
      });
    }

    if (canDelete) {
      acts.push({
        id: 'bulk-delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: onBulkDelete,
        variant: 'destructive',
      });
    }

    return acts;
  }, [
    canEdit,
    canDelete,
    onBulkPay,
    onBulkCategorize,
    onBulkCancel,
    onBulkDelete,
  ]);

  return (
    <SelectionToolbar
      selectedIds={selectedIds}
      totalItems={totalItems}
      onClear={actions.clear}
      onSelectAll={actions.selectAll}
      actions={selectionActions}
    />
  );
}
