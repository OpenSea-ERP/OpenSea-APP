'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { SearchBar } from '@/components/layout/search-bar';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Button } from '@/components/ui/button';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Progress } from '@/components/ui/progress';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { employeesService } from '@/services/hr/employees.service';
import { exportToCSV } from '@/lib/csv-export';
import { usePermissions } from '@/hooks/use-permissions';
import type { VacationPeriod, VacationStatus } from '@/types/hr';
import {
  Ban,
  Calendar,
  CalendarDays,
  CircleCheck,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  Palmtree,
  Plus,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  vacationsConfig,
  useListVacations,
  useScheduleVacation,
  useSellVacationDays,
  useCancelVacationSchedule,
  formatDate,
  getStatusLabel,
  getStatusColor,
  formatDaysInfo,
} from './src';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
const ScheduleModal = dynamic(
  () =>
    import('./src/modals/schedule-modal').then(m => ({
      default: m.ScheduleModal,
    })),
  { ssr: false }
);
const SellDaysModal = dynamic(
  () =>
    import('./src/modals/sell-days-modal').then(m => ({
      default: m.SellDaysModal,
    })),
  { ssr: false }
);
const ViewModal = dynamic(
  () => import('./src/modals/view-modal').then(m => ({ default: m.ViewModal })),
  { ssr: false }
);
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - 5 + i;
  return { value: String(year), label: String(year) };
});

const VACATION_STATUS_OPTIONS: { value: VacationStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'SCHEDULED', label: 'Agendada' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'EXPIRED', label: 'Expirada' },
  { value: 'SOLD', label: 'Vendida' },
];

export default function VacationsPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const canView = hasPermission(HR_PERMISSIONS.VACATIONS.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.VACATIONS.CREATE);
  const canManage = hasPermission(HR_PERMISSIONS.VACATIONS.MANAGE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterStatus, setFilterStatus] = useState<VacationStatus | ''>('');
  const [filterYear, setFilterYear] = useState('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { perPage: 50 };
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (filterStatus) params.status = filterStatus;
    if (filterYear) params.year = Number(filterYear);
    return params;
  }, [filterEmployeeId, filterStatus, filterYear]);

  // ============================================================================
  // DATA
  // ============================================================================

  const { data, isLoading, error, refetch } = useListVacations(queryParams);
  const scheduleVacation = useScheduleVacation({
    onSuccess: () => {
      setShowScheduleModal(false);
      setScheduleVacationId(null);
    },
  });
  const sellDays = useSellVacationDays({
    onSuccess: () => {
      setShowSellModal(false);
      setSellVacationId(null);
    },
  });
  const cancelSchedule = useCancelVacationSchedule();

  const vacations = data?.vacationPeriods ?? [];

  const employeeIds = useMemo(
    () => vacations.map(v => v.employeeId),
    [vacations]
  );
  const { getName } = useEmployeeMap(employeeIds);

  // Employees for filter dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'filter-list'],
    queryFn: () => employeesService.listEmployees({ perPage: 200 }),
  });

  const employeeOptions = useMemo(
    () =>
      (employeesData?.employees ?? []).map(e => ({
        value: e.id,
        label: e.fullName,
      })),
    [employeesData]
  );

  // ============================================================================
  // STATE
  // ============================================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleVacationId, setScheduleVacationId] = useState<string | null>(
    null
  );
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellVacationId, setSellVacationId] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedVacation, setSelectedVacation] =
    useState<VacationPeriod | null>(null);
  const [showCancelPin, setShowCancelPin] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const initialIds = useMemo(() => vacations.map(i => i.id), [vacations]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewItem = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        const item = vacations.find(v => v.id === ids[0]);
        if (item) {
          setSelectedVacation(item);
          setIsViewOpen(true);
        }
      }
    },
    [vacations]
  );

  const handleSchedule = useCallback((vacationId: string) => {
    setScheduleVacationId(vacationId);
    setShowScheduleModal(true);
  }, []);

  const handleSellDays = useCallback((vacationId: string) => {
    setSellVacationId(vacationId);
    setShowSellModal(true);
  }, []);

  const handleCancelSchedule = useCallback((id: string) => {
    setCancelTargetId(id);
    setShowCancelPin(true);
  }, []);

  const handleCancelScheduleConfirm = useCallback(() => {
    if (cancelTargetId) {
      cancelSchedule.mutate(cancelTargetId);
    }
    setShowCancelPin(false);
    setCancelTargetId(null);
  }, [cancelTargetId, cancelSchedule]);

  const handleExport = useCallback(
    (ids: string[]) => {
      const items =
        ids.length > 0 ? vacations.filter(v => ids.includes(v.id)) : vacations;
      exportToCSV(
        items,
        [
          { header: 'Funcionário', accessor: v => getName(v.employeeId) },
          { header: 'Status', accessor: v => getStatusLabel(v.status) },
          {
            header: 'Início Aquisitivo',
            accessor: v =>
              v.acquisitionStart
                ? new Date(v.acquisitionStart).toLocaleDateString('pt-BR')
                : '',
          },
          {
            header: 'Fim Aquisitivo',
            accessor: v =>
              v.acquisitionEnd
                ? new Date(v.acquisitionEnd).toLocaleDateString('pt-BR')
                : '',
          },
          { header: 'Dias Totais', accessor: v => v.totalDays },
          { header: 'Dias Usados', accessor: v => v.usedDays },
          { header: 'Dias Vendidos', accessor: v => v.soldDays },
          { header: 'Dias Restantes', accessor: v => v.remainingDays },
        ],
        'ferias'
      );
    },
    [vacations, getName]
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
          if (ids.length > 0) router.push(`/hr/vacations/${ids[0]}`);
        },
      });
      actions.push({
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: handleViewItem,
      });
    }
    if (canManage) {
      actions.push({
        id: 'schedule',
        label: 'Agendar Férias',
        icon: CalendarDays,
        separator: 'before',
        onClick: (ids: string[]) => {
          if (ids.length > 0) handleSchedule(ids[0]);
        },
      });
      actions.push({
        id: 'sell',
        label: 'Vender Dias',
        icon: DollarSign,
        onClick: (ids: string[]) => {
          if (ids.length > 0) handleSellDays(ids[0]);
        },
      });
      actions.push({
        id: 'cancel-schedule',
        label: 'Cancelar Agendamento',
        icon: Ban,
        separator: 'before',
        onClick: (ids: string[]) => {
          if (ids.length > 0) handleCancelSchedule(ids[0]);
        },
        variant: 'destructive',
      });
    }
    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canManage]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: VacationPeriod, isSelected: boolean) => {
    const usedPercent =
      item.totalDays > 0
        ? Math.round(((item.usedDays + item.soldDays) / item.totalDays) * 100)
        : 0;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleViewItem : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={getStatusLabel(item.status)}
          subtitle={formatDaysInfo(
            item.totalDays,
            item.usedDays,
            item.soldDays,
            item.remainingDays
          )}
          icon={Palmtree}
          iconBgColor="bg-linear-to-br from-green-500 to-green-600"
          badges={[
            {
              label: getStatusLabel(item.status),
              variant: getStatusColor(item.status),
            },
          ]}
          metadata={
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3" />
                <span>{getName(item.employeeId)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                <span>
                  {formatDate(item.acquisitionStart)} &mdash;{' '}
                  {formatDate(item.acquisitionEnd)}
                </span>
              </div>
              <div>
                <Progress value={usedPercent} className="h-1.5" />
                <div className="flex justify-between text-[10px] mt-1">
                  <span>
                    {item.usedDays} usados / {item.soldDays} vendidos
                  </span>
                  <span>{item.remainingDays} restantes</span>
                </div>
              </div>
              {item.scheduledStart && (
                <p className="text-xs">
                  Agendado: {formatDate(item.scheduledStart)} &mdash;{' '}
                  {formatDate(item.scheduledEnd)}
                </p>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/vacations/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        >
          {item.status === 'AVAILABLE' && canManage && (
            <div
              className="flex gap-2 pt-2 border-t"
              onClick={e => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs text-emerald-600 hover:bg-emerald-50"
                onClick={() => handleSchedule(item.id)}
              >
                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                Agendar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs text-amber-600 hover:bg-amber-50"
                onClick={() => handleSellDays(item.id)}
              >
                <DollarSign className="h-3.5 w-3.5 mr-1" />
                Vender Dias
              </Button>
            </div>
          )}
          {item.status === 'SCHEDULED' && canManage && (
            <div
              className="flex gap-2 pt-2 border-t"
              onClick={e => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                onClick={() => handleCancelSchedule(item.id)}
                disabled={cancelSchedule.isPending}
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                Cancelar Agendamento
              </Button>
            </div>
          )}
        </EntityCard>
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: VacationPeriod, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={canView ? handleViewItem : undefined}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="list"
        title={getStatusLabel(item.status)}
        subtitle={formatDaysInfo(
          item.totalDays,
          item.usedDays,
          item.soldDays,
          item.remainingDays
        )}
        icon={Palmtree}
        iconBgColor="bg-linear-to-br from-green-500 to-green-600"
        badges={[
          {
            label: getStatusLabel(item.status),
            variant: getStatusColor(item.status),
          },
        ]}
        metadata={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {getName(item.employeeId)}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(item.acquisitionStart)} &mdash;{' '}
              {formatDate(item.acquisitionEnd)}
            </span>
            <span>{item.remainingDays} dias restantes</span>
          </div>
        }
        isSelected={isSelected}
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/vacations/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const handleOpenCreate = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const actionButtons: HeaderButton[] = useMemo(() => {
    const buttons: HeaderButton[] = [];
    buttons.push({
      id: 'export-vacations',
      title: 'Exportar',
      icon: Download,
      onClick: () => handleExport([]),
      variant: 'outline',
    });
    if (canCreate) {
      buttons.push({
        id: 'create-vacation',
        title: 'Novo Período',
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
        namespace: 'vacations',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Férias', href: '/hr/vacations' },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Férias"
            description="Períodos aquisitivos e agendamento de férias"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            placeholder="Buscar férias..."
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
              title="Erro ao carregar férias"
              message="Ocorreu um erro ao tentar carregar as férias. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={vacationsConfig}
              items={vacations}
              toolbarStart={
                <>
                  <FilterDropdown
                    label="Funcionário"
                    icon={User}
                    options={employeeOptions}
                    value={filterEmployeeId}
                    onChange={v => setFilterEmployeeId(v)}
                    activeColor="violet"
                    searchPlaceholder="Buscar funcionário..."
                    emptyText="Nenhum funcionário encontrado."
                  />
                  <FilterDropdown
                    label="Status"
                    icon={CircleCheck}
                    options={VACATION_STATUS_OPTIONS}
                    value={filterStatus}
                    onChange={v => setFilterStatus(v as VacationStatus | '')}
                    activeColor="emerald"
                  />
                  <FilterDropdown
                    label="Ano"
                    icon={Calendar}
                    options={YEAR_OPTIONS}
                    value={filterYear}
                    onChange={v => setFilterYear(v)}
                    activeColor="blue"
                  />
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                if (canView) {
                  setSelectedVacation(item);
                  setIsViewOpen(true);
                }
              }}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
          )}

          <CreateModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />

          <ScheduleModal
            isOpen={showScheduleModal}
            onClose={() => {
              setShowScheduleModal(false);
              setScheduleVacationId(null);
            }}
            vacationId={scheduleVacationId}
            onSchedule={(id, data) => scheduleVacation.mutate({ id, data })}
            isSubmitting={scheduleVacation.isPending}
          />

          <SellDaysModal
            isOpen={showSellModal}
            onClose={() => {
              setShowSellModal(false);
              setSellVacationId(null);
            }}
            vacationId={sellVacationId}
            onSell={(id, data) => sellDays.mutate({ id, data })}
            isSubmitting={sellDays.isPending}
          />

          <ViewModal
            isOpen={isViewOpen}
            onClose={() => {
              setIsViewOpen(false);
              setSelectedVacation(null);
            }}
            vacation={selectedVacation}
          />

          <VerifyActionPinModal
            isOpen={showCancelPin}
            onClose={() => {
              setShowCancelPin(false);
              setCancelTargetId(null);
            }}
            onSuccess={handleCancelScheduleConfirm}
            title="Confirmar Cancelamento"
            description="Digite seu PIN de ação para cancelar o agendamento de férias."
          />

          <HRSelectionToolbar
            totalItems={vacations.length}
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
