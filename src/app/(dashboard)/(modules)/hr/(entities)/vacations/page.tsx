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
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { usePermissions } from '@/hooks/use-permissions';
import type { VacationPeriod, VacationStatus } from '@/types/hr';
import {
  Ban,
  CalendarDays,
  DollarSign,
  Eye,
  Palmtree,
  Plus,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  vacationsConfig,
  useListVacations,
  useScheduleVacation,
  useSellVacationDays,
  useCancelVacationSchedule,
  CreateModal,
  ScheduleModal,
  SellDaysModal,
  ViewModal,
  formatDate,
  getStatusLabel,
  getStatusColor,
  formatDaysInfo,
} from './src';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';

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

  const employeeIds = useMemo(() => vacations.map(v => v.employeeId), [vacations]);
  const { getName } = useEmployeeMap(employeeIds);

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

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const initialIds = useMemo(
    () => vacations.map(i => i.id),
    [vacations]
  );

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

  const handleCancelSchedule = useCallback(
    (id: string) => {
      cancelSchedule.mutate(id);
    },
    [cancelSchedule]
  );

  // ============================================================================
  // CONTEXT MENU
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(() => {
    const actions: ContextMenuAction[] = [];
    if (canView) {
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

  const renderGridCard = (item: VacationPeriod, isSelected: boolean) => {
    const usedPercent =
      item.totalDays > 0
        ? Math.round(
            ((item.usedDays + item.soldDays) / item.totalDays) * 100
          )
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
          showSelection={false}
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
                className="flex-1 text-xs text-green-600 hover:bg-green-50"
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
                className="flex-1 text-xs text-red-600 hover:bg-red-50"
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
        showSelection={false}
        clickable={false}
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

  const actionButtons: HeaderButton[] = useMemo(
    () =>
      canCreate
        ? [
            {
              id: 'create-vacation',
              title: 'Novo Período',
              icon: Plus,
              onClick: handleOpenCreate,
              variant: 'default',
            },
          ]
        : [],
    [canCreate, handleOpenCreate]
  );

  // ============================================================================
  // FILTERS UI
  // ============================================================================

  const hasActiveFilters = filterEmployeeId || filterStatus || filterYear;

  const clearFilters = useCallback(() => {
    setFilterEmployeeId('');
    setFilterStatus('');
    setFilterYear('');
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <EmployeeSelector
                value={filterEmployeeId}
                onChange={id => setFilterEmployeeId(id)}
                placeholder="Filtrar por funcionário..."
              />
            </div>

            <Select
              value={filterStatus}
              onValueChange={v =>
                setFilterStatus(v === 'ALL' ? '' : (v as VacationStatus))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                {VACATION_STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Ano"
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="w-28"
              min={2020}
              max={2099}
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
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={false}
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
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
