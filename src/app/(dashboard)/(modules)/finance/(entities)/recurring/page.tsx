/**
 * OpenSea OS - Recorrências
 * Listagem de recorrências com infinite scroll, filtros server-side e EntityGrid
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
import { RecurringWizard } from '@/components/finance/recurring/recurring-wizard';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { recurringConfig } from '@/config/entities/recurring.config';
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
  useRecurringInfinite,
  usePauseRecurring,
  useResumeRecurring,
  useCancelRecurring,
  type RecurringFilters,
} from '@/hooks/finance/use-recurring';
import { cn } from '@/lib/utils';
import type {
  RecurringConfig,
  RecurringStatus,
  FinanceEntryType,
} from '@/types/finance';
import {
  RECURRING_STATUS_LABELS,
  FREQUENCY_LABELS,
  FINANCE_ENTRY_TYPE_LABELS,
} from '@/types/finance';
import {
  Calendar,
  DollarSign,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  XCircle,
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
  { id: 'ACTIVE', label: 'Ativa' },
  { id: 'PAUSED', label: 'Pausada' },
  { id: 'CANCELLED', label: 'Cancelada' },
];

const TYPE_OPTIONS = [
  { id: 'PAYABLE', label: 'A Pagar' },
  { id: 'RECEIVABLE', label: 'A Receber' },
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

function getStatusColor(status: RecurringStatus): string {
  const colors: Record<RecurringStatus, string> = {
    ACTIVE:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    PAUSED:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    CANCELLED:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  };
  return colors[status] ?? colors.ACTIVE;
}

function getTypeColor(type: FinanceEntryType): string {
  const colors: Record<FinanceEntryType, string> = {
    PAYABLE:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
    RECEIVABLE:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  };
  return colors[type] ?? colors.PAYABLE;
}

function getFrequencyLabel(unit: string, interval: number): string {
  const label = FREQUENCY_LABELS[unit as keyof typeof FREQUENCY_LABELS] ?? unit;
  if (interval > 1) return `A cada ${interval} ${label.toLowerCase()}s`;
  return label;
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

export default function RecurringPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <RecurringPageContent />
    </Suspense>
  );
}

function RecurringPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSION FLAGS
  // ============================================================================

  const canView = hasPermission(FINANCE_PERMISSIONS.RECURRING.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.RECURRING.REGISTER);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.RECURRING.MODIFY);
  const canAdmin = hasPermission(FINANCE_PERMISSIONS.RECURRING.ADMIN);

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  // Single-value filters: backend listRecurringConfigsQuerySchema accepts one
  // status enum and one type enum, not arrays. Multi-select UI used to pick
  // multiple values silently ignored everything past the first one.
  const statusFilter = searchParams.get('status') ?? undefined;
  const typeFilter = searchParams.get('type') ?? undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<
    'createdAt' | 'description' | 'expectedAmount' | 'status'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [wizardOpen, setWizardOpen] = useState(false);
  // Only "cancel" is supported here. The previous "delete" branch hit the
  // exact same cancelMutation and produced misleading copy ("não pode ser
  // desfeita") for what is actually a soft-cancel. Hard-delete will require
  // a dedicated backend route + audit trail.
  const [pinAction, setPinAction] = useState<{
    type: 'cancel';
    id: string;
  } | null>(null);

  // ============================================================================
  // DATA: Infinite scroll + filter dropdown sources
  // ============================================================================

  const filters: RecurringFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter,
      type: typeFilter,
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, statusFilter, typeFilter, sortBy, sortOrder]
  );

  const {
    configs,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useRecurringInfinite(filters);

  // Mutations
  const pauseMutation = usePauseRecurring();
  const resumeMutation = useResumeRecurring();
  const cancelMutation = useCancelRecurring();

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
    (params: { status?: string | undefined; type?: string | undefined }) => {
      const parts: string[] = [];
      // Only use the passed-in value when it was explicitly provided (not undefined);
      // otherwise fall back to the current filter state.
      const sts = params.status !== undefined ? params.status : statusFilter;
      const typ = params.type !== undefined ? params.type : typeFilter;
      if (sts) parts.push(`status=${sts}`);
      if (typ) parts.push(`type=${typ}`);
      return parts.length > 0
        ? `/finance/recurring?${parts.join('&')}`
        : '/finance/recurring';
    },
    [statusFilter, typeFilter]
  );

  const setStatusFilter = useCallback(
    (value: string) =>
      router.push(buildFilterUrl({ status: value || undefined })),
    [router, buildFilterUrl]
  );

  const setTypeFilter = useCallback(
    (value: string) =>
      router.push(buildFilterUrl({ type: value || undefined })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/recurring/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/recurring/${ids[0]}/edit`);
    }
  };

  const handlePause = useCallback(
    async (ids: string[]) => {
      if (ids.length !== 1) return;
      try {
        await pauseMutation.mutateAsync(ids[0]);
        toast.success('Recorrência pausada com sucesso.');
      } catch {
        toast.error('Erro ao pausar recorrência.');
      }
    },
    [pauseMutation]
  );

  const handleResume = useCallback(
    async (ids: string[]) => {
      if (ids.length !== 1) return;
      try {
        await resumeMutation.mutateAsync(ids[0]);
        toast.success('Recorrência retomada com sucesso.');
      } catch {
        toast.error('Erro ao retomar recorrência.');
      }
    },
    [resumeMutation]
  );

  const handleCancelRequest = useCallback((ids: string[]) => {
    if (ids.length === 1) {
      setPinAction({ type: 'cancel', id: ids[0] });
    }
  }, []);

  const handlePinConfirm = useCallback(async () => {
    if (!pinAction) return;
    try {
      await cancelMutation.mutateAsync(pinAction.id);
      toast.success('Recorrência cancelada com sucesso.');
      setPinAction(null);
    } catch {
      toast.error('Erro ao cancelar recorrência.');
    }
  }, [pinAction, cancelMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const getContextActions = useCallback(
    (item: RecurringConfig) => {
      const actions: Array<{
        id: string;
        label: string;
        icon: typeof Pause;
        onClick: (ids: string[]) => void;
        variant?: 'destructive';
        separator?: 'before';
      }> = [];

      // Pause/Resume toggle
      if (canEdit && item.status === 'ACTIVE') {
        actions.push({
          id: 'pause',
          label: 'Pausar',
          icon: Pause,
          onClick: handlePause,
          separator: 'before',
        });
      }
      if (canEdit && item.status === 'PAUSED') {
        actions.push({
          id: 'resume',
          label: 'Retomar',
          icon: Play,
          onClick: handleResume,
          separator: 'before',
        });
      }

      // Cancel (destructive, soft) - only for non-cancelled
      if (canAdmin && item.status !== 'CANCELLED') {
        actions.push({
          id: 'cancel',
          label: 'Cancelar',
          icon: XCircle,
          onClick: handleCancelRequest,
          variant: 'destructive',
          separator: actions.length === 0 ? 'before' : undefined,
        });
      }

      return actions;
    },
    [canEdit, canAdmin, handlePause, handleResume, handleCancelRequest]
  );

  const renderGridCard = (item: RecurringConfig, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.description}
          subtitle={getFrequencyLabel(
            item.frequencyUnit,
            item.frequencyInterval
          )}
          icon={RefreshCw}
          iconBgColor="bg-linear-to-br from-violet-500 to-violet-600"
          badges={[
            {
              label: RECURRING_STATUS_LABELS[item.status],
              variant: 'outline' as const,
              color: getStatusColor(item.status),
            },
            {
              label: FINANCE_ENTRY_TYPE_LABELS[item.type],
              variant: 'outline' as const,
              color: getTypeColor(item.type),
            },
          ]}
          footer={{
            type: 'split',
            left: {
              icon: DollarSign,
              label: formatCurrency(item.expectedAmount),
              onClick: () => {},
              color: 'secondary',
            },
            right: {
              icon: Calendar,
              label: item.nextDueDate
                ? formatDate(item.nextDueDate)
                : 'Sem data',
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

  const renderListCard = (item: RecurringConfig, isSelected: boolean) => {
    const listBadges: {
      label: string;
      variant: 'outline';
      color: string;
    }[] = [
      {
        label: RECURRING_STATUS_LABELS[item.status],
        variant: 'outline',
        color: getStatusColor(item.status),
      },
      {
        label: getFrequencyLabel(item.frequencyUnit, item.frequencyInterval),
        variant: 'outline',
        color:
          'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
      },
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.description}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {FINANCE_ENTRY_TYPE_LABELS[item.type]}
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
                  {badge.label}
                </span>
              ))}
            </div>
          }
          icon={RefreshCw}
          iconBgColor="bg-linear-to-br from-violet-500 to-violet-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt ?? undefined}
          showStatusBadges={false}
        >
          {/* Right zone: amount + next date */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
              {formatCurrency(item.expectedAmount)}
            </span>
            <span className="text-xs text-muted-foreground">
              {item.nextDueDate
                ? `Próx: ${formatDate(item.nextDueDate)}`
                : 'Sem próxima data'}
            </span>
          </div>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => configs.map(c => c.id), [configs]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreateClick = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-recurring',
        title: 'Nova Recorrência',
        icon: Plus,
        onClick: handleCreateClick,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.RECURRING.REGISTER,
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
        namespace: 'recurring',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Recorrências', href: '/finance/recurring' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Recorrências"
            description="Gerencie lançamentos recorrentes automáticos"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="recurring-page" className="contents" />
          {/* Search Bar */}
          <div data-testid="recurring-search">
            <SearchBar
              placeholder={recurringConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar recorrências"
              message="Ocorreu um erro ao tentar carregar as recorrências. Por favor, tente novamente."
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
                config={recurringConfig}
                items={configs}
                showItemCount={false}
                toolbarStart={
                  <>
                    <div data-testid="recurring-filter-status">
                      <FilterDropdown
                        label="Status"
                        icon={RefreshCw}
                        options={STATUS_OPTIONS}
                        value={statusFilter ?? ''}
                        onChange={setStatusFilter}
                        activeColor="violet"
                        searchPlaceholder="Buscar status..."
                        emptyText="Nenhum status encontrado."
                      />
                    </div>
                    <div data-testid="recurring-filter-type">
                      <FilterDropdown
                        label="Tipo"
                        icon={DollarSign}
                        options={TYPE_OPTIONS}
                        value={typeFilter ?? ''}
                        onChange={setTypeFilter}
                        activeColor="blue"
                        searchPlaceholder="Buscar tipo..."
                        emptyText="Nenhum tipo encontrado."
                      />
                    </div>
                    <p
                      className="text-sm text-muted-foreground whitespace-nowrap"
                      data-testid="recurring-count"
                    >
                      {total} {total === 1 ? 'recorrência' : 'recorrências'}
                      {configs.length < total &&
                        ` (${configs.length} carregadas)`}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/finance/recurring/${item.id}`)
                }
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(
                      field as
                        | 'createdAt'
                        | 'description'
                        | 'expectedAmount'
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
          <RecurringWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            onCreated={() => {
              refetch();
            }}
          />

          {/* PIN Confirmation Modal (cancel) */}
          <VerifyActionPinModal
            isOpen={!!pinAction}
            onClose={() => setPinAction(null)}
            onSuccess={handlePinConfirm}
            title="Cancelar Recorrência"
            description="Digite seu PIN de Ação para confirmar o cancelamento desta recorrência. Após cancelar, nenhum lançamento futuro será gerado."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
