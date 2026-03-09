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
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Ban,
  Calculator,
  CalendarDays,
  Check,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  payrollConfig,
  useListPayrolls,
  useCreatePayroll,
  useCalculatePayroll,
  useApprovePayroll,
  usePayPayroll,
  useCancelPayroll,
  CreateModal,
  ViewModal,
  formatCurrency,
  formatMonthYear,
  getStatusLabel,
  getStatusColor,
  type PayrollFilters,
} from './src';
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

  const { data, isLoading, error, refetch } = useListPayrolls(queryParams);
  const createMutation = useCreatePayroll();
  const calculateMutation = useCalculatePayroll();
  const approveMutation = useApprovePayroll();
  const payMutation = usePayPayroll();
  const cancelMutation = useCancelPayroll();

  const payrolls = data?.payrolls ?? [];

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Payroll | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const initialIds = useMemo(
    () => payrolls.map(i => i.id),
    [payrolls]
  );


  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleExport = useCallback((ids: string[]) => {
    const items = ids.length > 0
      ? payrolls.filter(p => ids.includes(p.id))
      : payrolls;
    exportToCSV(items, [
      { header: 'Mês/Ano', accessor: p => formatMonthYear(p.referenceMonth, p.referenceYear) },
      { header: 'Status', accessor: p => getStatusLabel(p.status) },
      { header: 'Bruto', accessor: p => p.totalGross },
      { header: 'Deduções', accessor: p => p.totalDeductions },
      { header: 'Líquido', accessor: p => p.totalNet },
    ], 'folha-pagamento');
  }, [payrolls]);

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
        const item = payrolls.find(p => p.id === ids[0]);
        if (item) {
          setViewTarget(item);
          setIsViewOpen(true);
        }
      }
    },
    [payrolls, canView]
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
      actions.push({
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: handleViewItem,
      });
    }
    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

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
              <span className="font-medium text-red-600">
                {formatCurrency(item.totalDeductions)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Líquido</span>
              <span className="font-bold text-blue-600">
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
                className="flex-1 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
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
                  className="gap-1 text-slate-500 hover:text-destructive"
                  onClick={() => handleCancel(item.id)}
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
            <span className="text-red-600">
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

  const actionButtons: HeaderButton[] = useMemo(
    () => {
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
    },
    [canCreate, handleOpenCreate, handleExport]
  );

  // ============================================================================
  // FILTERS UI
  // ============================================================================

  const hasActiveFilters = filterMonth || filterYear || filterStatus;

  const clearFilters = useCallback(() => {
    setFilterMonth('');
    setFilterYear('');
    setFilterStatus('');
  }, []);

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
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Ano"
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="w-[100px]"
              min={2000}
              max={2100}
            />

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/10"
                onClick={clearFilters}
              >
                Limpar filtros
              </Badge>
            )}
          </div>

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
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={false}
              onItemDoubleClick={item => {
                if (canView) {
                  setViewTarget(item);
                  setIsViewOpen(true);
                }
              }}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
          )}

          <CreateModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
          />

          <ViewModal
            isOpen={isViewOpen}
            onClose={() => {
              setIsViewOpen(false);
              setViewTarget(null);
            }}
            payroll={viewTarget}
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
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
