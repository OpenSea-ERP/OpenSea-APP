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
import { Button } from '@/components/ui/button';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { exportToCSV } from '@/lib/csv-export';
import type { Payroll, PayrollStatus } from '@/types/hr';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  Ban,
  Calendar,
  Calculator,
  CalendarDays,
  Check,
  CircleCheck,
  DollarSign,
  Download,
  ExternalLink,
  Loader2,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  payrollConfig,
  useListPayrolls,
  useCreatePayroll,
  useCalculatePayroll,
  useApprovePayroll,
  usePayPayroll,
  useCancelPayroll,
  formatCurrency,
  formatMonthYear,
  getStatusLabel,
  getStatusColor,
  type PayrollFilters,
} from './src';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const STATUS_OPTIONS: { value: PayrollStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PROCESSING', label: 'Processando' },
  { value: 'CALCULATED', label: 'Calculada' },
  { value: 'APPROVED', label: 'Aprovada' },
  { value: 'PAID', label: 'Paga' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - 5 + i;
  return { value: String(year), label: String(year) };
});

export default function PayrollPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const canView = hasPermission(HR_PERMISSIONS.PAYROLL.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.PAYROLL.CREATE);
  const canProcess = hasPermission(HR_PERMISSIONS.PAYROLL.PROCESS);
  const canApprove = hasPermission(HR_PERMISSIONS.PAYROLL.APPROVE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const queryParams = useMemo<PayrollFilters>(() => {
    const params: PayrollFilters = {};
    if (filterMonth) params.referenceMonth = parseInt(filterMonth, 10);
    if (filterYear) {
      const y = parseInt(filterYear, 10);
      if (!isNaN(y)) params.referenceYear = y;
    }
    if (filterStatus) params.status = filterStatus;
    return params;
  }, [filterMonth, filterYear, filterStatus]);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListPayrolls(queryParams);
  const createMutation = useCreatePayroll();
  const calculateMutation = useCalculatePayroll();
  const approveMutation = useApprovePayroll();
  const payMutation = usePayPayroll();
  const cancelMutation = useCancelPayroll();

  const payrolls = data?.pages.flatMap(p => p.payrolls ?? []) ?? [];

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const initialIds = useMemo(() => payrolls.map(i => i.id), [payrolls]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleExport = useCallback(
    (ids: string[]) => {
      const items =
        ids.length > 0 ? payrolls.filter(p => ids.includes(p.id)) : payrolls;
      exportToCSV(
        items,
        [
          {
            header: 'Mês/Ano',
            accessor: p => formatMonthYear(p.referenceMonth, p.referenceYear),
          },
          { header: 'Status', accessor: p => getStatusLabel(p.status) },
          { header: 'Bruto', accessor: p => p.totalGross },
          { header: 'Deduções', accessor: p => p.totalDeductions },
          { header: 'Líquido', accessor: p => p.totalNet },
        ],
        'folha-pagamento'
      );
    },
    [payrolls]
  );

  const handleCreate = useCallback(
    async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
      try {
        await createMutation.mutateAsync(data);
        setIsCreateOpen(false);
      } catch {
        // Toast handled by mutation
      }
    },
    [createMutation]
  );

  const handleCalculate = useCallback(
    async (id: string) => {
      try {
        await calculateMutation.mutateAsync(id);
      } catch {
        // Toast handled by mutation
      }
    },
    [calculateMutation]
  );

  const handleApprove = useCallback(
    async (id: string) => {
      try {
        await approveMutation.mutateAsync(id);
      } catch {
        // Toast handled by mutation
      }
    },
    [approveMutation]
  );

  const handlePay = useCallback(
    async (id: string) => {
      try {
        await payMutation.mutateAsync(id);
      } catch {
        // Toast handled by mutation
      }
    },
    [payMutation]
  );

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        await cancelMutation.mutateAsync(id);
      } catch {
        // Toast handled by mutation
      }
    },
    [cancelMutation]
  );

  const handleViewItem = useCallback(
    (ids: string[]) => {
      if (ids.length > 0 && canView) {
        router.push(`/hr/payroll/${ids[0]}`);
      }
    },
    [canView, router]
  );

  // ============================================================================
  // CONTEXT MENU
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(() => {
    const actions: ContextMenuAction[] = [];
    if (canView) {
      actions.push({
        id: 'open',
        label: 'Abrir',
        icon: ExternalLink,
        onClick: (ids: string[]) => {
          if (ids.length > 0) router.push(`/hr/payroll/${ids[0]}`);
        },
      });
    }
    if (canProcess) {
      actions.push({
        id: 'cancel',
        label: 'Cancelar Folha',
        icon: Ban,
        variant: 'destructive',
        separator: 'before',
        onClick: (ids: string[]) => {
          if (ids.length > 0) setCancelTarget(ids[0]);
        },
      });
    }
    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canProcess]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Payroll, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={canView ? handleViewItem : undefined}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="grid"
        title={formatMonthYear(item.referenceMonth, item.referenceYear)}
        subtitle={getStatusLabel(item.status)}
        icon={CalendarDays}
        iconBgColor="bg-linear-to-br from-sky-500 to-sky-600"
        badges={[
          {
            label: getStatusLabel(item.status),
            variant: getStatusColor(item.status),
          },
        ]}
        metadata={
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bruto</span>
              <span className="font-medium text-green-600">
                {formatCurrency(item.totalGross)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Deduções</span>
              <span className="font-medium text-destructive">
                {formatCurrency(item.totalDeductions)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Líquido</span>
              <span className="font-bold text-primary">
                {formatCurrency(item.totalNet)}
              </span>
            </div>
          </div>
        }
        isSelected={isSelected}
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/payroll/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      >
        {item.status !== 'PAID' && item.status !== 'CANCELLED' && (
          <div
            className="flex items-center gap-2 pt-2 border-t"
            onClick={e => e.stopPropagation()}
          >
            {item.status === 'DRAFT' && canProcess && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 text-primary border-primary/30 hover:bg-primary/10"
                onClick={() => handleCalculate(item.id)}
                disabled={calculateMutation.isPending}
              >
                <Calculator className="h-3.5 w-3.5" />
                Calcular
              </Button>
            )}
            {item.status === 'CALCULATED' && canApprove && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => handleApprove(item.id)}
                disabled={approveMutation.isPending}
              >
                <Check className="h-3.5 w-3.5" />
                Aprovar
              </Button>
            )}
            {item.status === 'APPROVED' && canProcess && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => handlePay(item.id)}
                disabled={payMutation.isPending}
              >
                <DollarSign className="h-3.5 w-3.5" />
                Pagar
              </Button>
            )}
            {(item.status === 'DRAFT' ||
              item.status === 'CALCULATED' ||
              item.status === 'APPROVED') &&
              canProcess && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  onClick={() => setCancelTarget(item.id)}
                  disabled={cancelMutation.isPending}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Cancelar
                </Button>
              )}
          </div>
        )}
      </EntityCard>
    </EntityContextMenu>
  );

  const renderListCard = (item: Payroll, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={canView ? handleViewItem : undefined}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="list"
        title={formatMonthYear(item.referenceMonth, item.referenceYear)}
        subtitle={`Líquido: ${formatCurrency(item.totalNet)}`}
        icon={CalendarDays}
        iconBgColor="bg-linear-to-br from-sky-500 to-sky-600"
        badges={[
          {
            label: getStatusLabel(item.status),
            variant: getStatusColor(item.status),
          },
        ]}
        metadata={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="text-green-600">
              Bruto: {formatCurrency(item.totalGross)}
            </span>
            <span className="text-destructive">
              Ded: {formatCurrency(item.totalDeductions)}
            </span>
          </div>
        }
        isSelected={isSelected}
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/payroll/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const actionButtons: HeaderButton[] = useMemo(() => {
    const buttons: HeaderButton[] = [];
    buttons.push({
      id: 'export-payroll',
      title: 'Exportar',
      icon: Download,
      onClick: () => handleExport([]),
      variant: 'outline',
    });
    if (canCreate) {
      buttons.push({
        id: 'create-payroll',
        title: 'Nova Folha',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate, handleOpenCreate, handleExport]);

  // ============================================================================
  // LOADING
  // ============================================================================

  if (isLoadingPermissions) {
    return (
      <PageLayout>
        <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'payroll',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Folha de Pagamento', href: '/hr/payroll' },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Folha de Pagamento"
            description="Geração, cálculo e pagamento de folhas"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            placeholder={payrollConfig.display.labels.searchPlaceholder}
            onSearch={value => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar folhas de pagamento"
              message="Ocorreu um erro ao tentar carregar as folhas. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={payrollConfig}
              items={payrolls}
              toolbarStart={
                <>
                  <FilterDropdown
                    label="Mês"
                    icon={Calendar}
                    options={MONTHS}
                    value={filterMonth}
                    onChange={v => setFilterMonth(v)}
                    activeColor="blue"
                  />
                  <FilterDropdown
                    label="Ano"
                    icon={CalendarDays}
                    options={YEAR_OPTIONS}
                    value={filterYear}
                    onChange={v => setFilterYear(v)}
                    activeColor="violet"
                  />
                  <FilterDropdown
                    label="Status"
                    icon={CircleCheck}
                    options={STATUS_OPTIONS}
                    value={filterStatus}
                    onChange={v => setFilterStatus(v)}
                    activeColor="emerald"
                  />
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                if (canView) {
                  router.push(`/hr/payroll/${item.id}`);
                }
              }}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
          )}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <CreateModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
          />

<HRSelectionToolbar
            totalItems={payrolls.length}
            defaultActions={{
              export: true,
            }}
            handlers={{
              onExport: handleExport,
            }}
          />

          <VerifyActionPinModal
            isOpen={!!cancelTarget}
            onClose={() => setCancelTarget(null)}
            onSuccess={() => {
              if (cancelTarget) {
                handleCancel(cancelTarget);
                setCancelTarget(null);
              }
            }}
            title="Confirmar Cancelamento"
            description="Digite seu PIN de ação para cancelar esta folha de pagamento."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
