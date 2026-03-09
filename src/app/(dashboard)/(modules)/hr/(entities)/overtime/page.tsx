'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { DateRangeFilter } from '@/app/(dashboard)/(modules)/admin/overview/audit-logs/src/components/date-range-filter';
import { exportToCSV } from '@/lib/csv-export';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { usePermissions } from '@/hooks/use-permissions';
import type { Overtime } from '@/types/hr';
import { Check, Clock, Coffee, Download, ExternalLink, Eye, Plus, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCallback, useMemo, useState } from 'react';
import {
  overtimeConfig,
  useListOvertime,
  useCreateOvertime,
  useApproveOvertime,
  CreateModal,
  ApproveModal,
  ViewModal,
  formatDate,
  formatHours,
  getApprovalLabel,
  getApprovalColor,
} from './src';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

export default function OvertimePage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const canView = hasPermission(HR_PERMISSIONS.OVERTIME.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.OVERTIME.CREATE);
  const canApprove = hasPermission(HR_PERMISSIONS.OVERTIME.APPROVE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterApproved, setFilterApproved] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { perPage: 100 };
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (filterApproved === 'true') params.approved = true;
    else if (filterApproved === 'false') params.approved = false;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    return params;
  }, [filterEmployeeId, filterApproved, filterStartDate, filterEndDate]);

  // ============================================================================
  // DATA
  // ============================================================================

  const { data, isLoading, error, refetch } = useListOvertime(queryParams);
  const createMutation = useCreateOvertime({
    onSuccess: () => setIsCreateOpen(false),
  });
  const approveMutation = useApproveOvertime({
    onSuccess: () => {
      setIsApproveOpen(false);
      setSelectedOvertime(null);
    },
  });

  const overtimeList = data?.overtime ?? [];

  const employeeIds = useMemo(() => overtimeList.map(o => o.employeeId), [overtimeList]);
  const { getName } = useEmployeeMap(employeeIds);

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOvertime, setSelectedOvertime] = useState<Overtime | null>(
    null
  );

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return overtimeList;
    const q = searchQuery.toLowerCase();
    return overtimeList.filter(o => {
      const reason = o.reason?.toLowerCase() ?? '';
      return reason.includes(q);
    });
  }, [overtimeList, searchQuery]);

  const initialIds = useMemo(
    () => filteredItems.map(i => i.id),
    [filteredItems]
  );


  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewItem = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        const item = overtimeList.find(o => o.id === ids[0]);
        if (item) {
          setSelectedOvertime(item);
          setIsViewOpen(true);
        }
      }
    },
    [overtimeList]
  );

  const handleApproveClick = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        const item = overtimeList.find(o => o.id === ids[0]);
        if (item) {
          setSelectedOvertime(item);
          setIsApproveOpen(true);
        }
      }
    },
    [overtimeList]
  );

  const handleBulkApprove = useCallback(async (ids: string[]) => {
    const pendingIds = ids.filter(id => {
      const item = overtimeList.find(o => o.id === id);
      return item && item.approved === null;
    });
    if (pendingIds.length === 0) {
      toast.info('Nenhuma hora extra pendente selecionada');
      return;
    }
    try {
      for (const id of pendingIds) {
        await approveMutation.mutateAsync({ id, data: { addToTimeBank: false } });
      }
      toast.success(`${pendingIds.length} hora(s) extra(s) aprovada(s)`);
    } catch {
      // Toast handled by mutation
    }
  }, [overtimeList, approveMutation]);

  const handleExport = useCallback((ids: string[]) => {
    const items = ids.length > 0
      ? overtimeList.filter(o => ids.includes(o.id))
      : overtimeList;
    exportToCSV(items, [
      { header: 'Funcionário', accessor: o => getName(o.employeeId) },
      { header: 'Data', accessor: o => o.date ? new Date(o.date).toLocaleDateString('pt-BR') : '' },
      { header: 'Horas', accessor: o => o.hours },
      { header: 'Motivo', accessor: o => o.reason },
      { header: 'Aprovada', accessor: o => o.approved === null ? 'Pendente' : o.approved ? 'Sim' : 'Não' },
    ], 'horas-extras');
  }, [overtimeList, getName]);

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
          if (ids.length > 0) router.push(`/hr/overtime/${ids[0]}`);
        },
      });
      actions.push({
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: handleViewItem,
      });
    }
    if (canApprove) {
      actions.push({
        id: 'approve',
        label: 'Aprovar',
        icon: Check,
        onClick: handleApproveClick,
      });
    }
    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canApprove]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Overtime, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={canView ? handleViewItem : undefined}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="grid"
        title={item.reason}
        subtitle={formatHours(item.hours)}
        icon={Coffee}
        iconBgColor="bg-linear-to-br from-orange-500 to-orange-600"
        badges={[
          {
            label: getApprovalLabel(item),
            variant: getApprovalColor(item),
          },
        ]}
        metadata={
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>{getName(item.employeeId)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{formatDate(item.date)}</span>
            </div>
          </div>
        }
        isSelected={isSelected}
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/overtime/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      >
        {item.approved === null && canApprove && (
          <div
            className="flex gap-2 pt-2 border-t"
            onClick={e => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs text-emerald-600 hover:bg-emerald-50"
              onClick={() => handleApproveClick([item.id])}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Aprovar
            </Button>
          </div>
        )}
      </EntityCard>
    </EntityContextMenu>
  );

  const renderListCard = (item: Overtime, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={canView ? handleViewItem : undefined}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="list"
        title={item.reason}
        subtitle={formatHours(item.hours)}
        icon={Coffee}
        iconBgColor="bg-linear-to-br from-orange-500 to-orange-600"
        badges={[
          {
            label: getApprovalLabel(item),
            variant: getApprovalColor(item),
          },
        ]}
        metadata={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {getName(item.employeeId)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(item.date)}
            </span>
          </div>
        }
        isSelected={isSelected}
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/overtime/${item.id}`)}
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
        id: 'export-overtime',
        title: 'Exportar',
        icon: Download,
        onClick: () => handleExport([]),
        variant: 'outline',
      });
      if (canCreate) {
        buttons.push({
          id: 'create-overtime',
          title: 'Registrar Hora Extra',
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

  const hasActiveFilters =
    filterEmployeeId || filterApproved || filterStartDate || filterEndDate;

  const clearFilters = useCallback(() => {
    setFilterEmployeeId('');
    setFilterApproved('');
    setFilterStartDate('');
    setFilterEndDate('');
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
        namespace: 'overtime',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Horas Extras', href: '/hr/overtime' },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Horas Extras"
            description="Registros e aprovação de horas extras"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            value={searchQuery}
            placeholder={overtimeConfig.display.labels.searchPlaceholder}
            onSearch={value => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <EmployeeSelector
                value={filterEmployeeId}
                onChange={id => setFilterEmployeeId(id)}
                placeholder="Filtrar por funcionário..."
              />
            </div>

            <Select
              value={filterApproved}
              onValueChange={v => setFilterApproved(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="true">Aprovada</SelectItem>
                <SelectItem value="false">Rejeitada</SelectItem>
              </SelectContent>
            </Select>

            <DateRangeFilter
              startDate={filterStartDate}
              endDate={filterEndDate}
              onStartDateChange={setFilterStartDate}
              onEndDateChange={setFilterEndDate}
            />

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
              title="Erro ao carregar horas extras"
              message="Ocorreu um erro ao tentar carregar as horas extras. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={overtimeConfig}
              items={filteredItems}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                if (canView) {
                  setSelectedOvertime(item);
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
            onSubmit={data => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />

          <ApproveModal
            isOpen={isApproveOpen}
            onClose={() => {
              setIsApproveOpen(false);
              setSelectedOvertime(null);
            }}
            overtime={selectedOvertime}
            onApprove={(id, data) => approveMutation.mutate({ id, data })}
            isApproving={approveMutation.isPending}
          />

          <ViewModal
            isOpen={isViewOpen}
            onClose={() => {
              setIsViewOpen(false);
              setSelectedOvertime(null);
            }}
            overtime={selectedOvertime}
          />

          <HRSelectionToolbar
            totalItems={filteredItems.length}
            actions={[
              ...(canApprove ? [{
                id: 'bulk-approve',
                label: 'Aprovar',
                icon: Check,
                onClick: handleBulkApprove,
                variant: 'default' as const,
              }] : []),
            ]}
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
