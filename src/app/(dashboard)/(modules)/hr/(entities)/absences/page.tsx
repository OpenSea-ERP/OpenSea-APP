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
import type { Absence, AbsenceType, AbsenceStatus } from '@/types/hr';
import {
  Ban,
  Calendar,
  Check,
  Clock,
  Eye,
  Plus,
  UserX,
  XCircle,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  absencesConfig,
  useListAbsences,
  useApproveAbsence,
  useCancelAbsence,
  RequestSickLeaveModal,
  RejectModal,
  ViewModal,
  getTypeLabel,
  getStatusLabel,
  getStatusColor,
  getTypeColor,
} from './src';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const ABSENCE_TYPE_OPTIONS: { value: AbsenceType; label: string }[] = [
  { value: 'VACATION', label: 'Férias' },
  { value: 'SICK_LEAVE', label: 'Atestado Médico' },
  { value: 'PERSONAL_LEAVE', label: 'Licença Pessoal' },
  { value: 'MATERNITY_LEAVE', label: 'Licença Maternidade' },
  { value: 'PATERNITY_LEAVE', label: 'Licença Paternidade' },
  { value: 'BEREAVEMENT_LEAVE', label: 'Licença Nojo' },
  { value: 'WEDDING_LEAVE', label: 'Licença Casamento' },
  { value: 'MEDICAL_APPOINTMENT', label: 'Consulta Médica' },
  { value: 'JURY_DUTY', label: 'Júri/Convocação' },
  { value: 'UNPAID_LEAVE', label: 'Licença não Remunerada' },
  { value: 'OTHER', label: 'Outro' },
];

const ABSENCE_STATUS_OPTIONS: { value: AbsenceStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'APPROVED', label: 'Aprovada' },
  { value: 'REJECTED', label: 'Rejeitada' },
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'COMPLETED', label: 'Concluída' },
];

export default function AbsencesPage() {
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const canView = hasPermission(HR_PERMISSIONS.ABSENCES.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.ABSENCES.CREATE);
  const canApprove = hasPermission(HR_PERMISSIONS.ABSENCES.APPROVE);
  const canManage = hasPermission(HR_PERMISSIONS.ABSENCES.MANAGE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterType, setFilterType] = useState<AbsenceType | ''>('');
  const [filterStatus, setFilterStatus] = useState<AbsenceStatus | ''>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { perPage: 50 };
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (filterType) params.type = filterType;
    if (filterStatus) params.status = filterStatus;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    return params;
  }, [filterEmployeeId, filterType, filterStatus, filterStartDate, filterEndDate]);

  // ============================================================================
  // DATA
  // ============================================================================

  const { data, isLoading, error, refetch } = useListAbsences(queryParams);
  const approveAbsence = useApproveAbsence();
  const cancelAbsence = useCancelAbsence();

  const absences = data?.absences ?? [];

  // ============================================================================
  // STATE
  // ============================================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectAbsenceId, setRejectAbsenceId] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const initialIds = useMemo(
    () => absences.map(i => i.id),
    [absences]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewItem = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        const item = absences.find(a => a.id === ids[0]);
        if (item) {
          setSelectedAbsence(item);
          setIsViewOpen(true);
        }
      }
    },
    [absences]
  );

  const handleApprove = useCallback(
    (id: string) => {
      approveAbsence.mutate(id);
    },
    [approveAbsence]
  );

  const handleReject = useCallback((id: string) => {
    setRejectAbsenceId(id);
    setShowRejectModal(true);
  }, []);

  const handleCancel = useCallback(
    (id: string) => {
      cancelAbsence.mutate(id);
    },
    [cancelAbsence]
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
    if (canApprove) {
      actions.push({
        id: 'approve',
        label: 'Aprovar',
        icon: Check,
        onClick: (ids: string[]) => {
          if (ids.length > 0) handleApprove(ids[0]);
        },
      });
      actions.push({
        id: 'reject',
        label: 'Rejeitar',
        icon: XCircle,
        onClick: (ids: string[]) => {
          if (ids.length > 0) handleReject(ids[0]);
        },
        variant: 'destructive',
      });
    }
    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canApprove]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Absence, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={canView ? handleViewItem : undefined}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="grid"
        title={getTypeLabel(item.type)}
        subtitle={`${item.totalDays} ${item.totalDays === 1 ? 'dia' : 'dias'}`}
        icon={UserX}
        iconBgColor="bg-gradient-to-br from-rose-500 to-rose-600"
        badges={[
          {
            label: getTypeLabel(item.type),
            variant: 'outline',
            color: getTypeColor(item.type),
          },
          {
            label: getStatusLabel(item.status),
            variant: 'outline',
            color: getStatusColor(item.status),
          },
        ]}
        metadata={
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDate(item.startDate)} &mdash;{' '}
                {formatDate(item.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>
                {item.totalDays} {item.totalDays === 1 ? 'dia' : 'dias'}
              </span>
            </div>
            {item.cid && (
              <p className="text-xs">
                CID: <span className="font-mono">{item.cid}</span>
              </p>
            )}
          </div>
        }
        isSelected={isSelected}
        showSelection={false}
        clickable={false}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      >
        {item.status === 'PENDING' && canApprove && (
          <div
            className="flex gap-2 pt-2 border-t"
            onClick={e => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs text-emerald-600 hover:bg-emerald-50"
              onClick={() => handleApprove(item.id)}
              disabled={approveAbsence.isPending}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs text-red-600 hover:bg-red-50"
              onClick={() => handleReject(item.id)}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Rejeitar
            </Button>
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-slate-500 hover:bg-slate-50"
                onClick={() => handleCancel(item.id)}
                disabled={cancelAbsence.isPending}
              >
                <Ban className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </EntityCard>
    </EntityContextMenu>
  );

  const renderListCard = (item: Absence, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={canView ? handleViewItem : undefined}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="list"
        title={getTypeLabel(item.type)}
        subtitle={getStatusLabel(item.status)}
        icon={UserX}
        iconBgColor="bg-gradient-to-br from-rose-500 to-rose-600"
        badges={[
          {
            label: getTypeLabel(item.type),
            variant: 'outline',
            color: getTypeColor(item.type),
          },
          {
            label: getStatusLabel(item.status),
            variant: 'outline',
            color: getStatusColor(item.status),
          },
        ]}
        metadata={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(item.startDate)} &mdash; {formatDate(item.endDate)}
            </span>
            <span>
              {item.totalDays} {item.totalDays === 1 ? 'dia' : 'dias'}
            </span>
            {item.cid && <span className="font-mono">CID: {item.cid}</span>}
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
              id: 'create-absence',
              title: 'Registrar Atestado',
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

  const hasActiveFilters =
    filterEmployeeId ||
    filterType ||
    filterStatus ||
    filterStartDate ||
    filterEndDate;

  const clearFilters = useCallback(() => {
    setFilterEmployeeId('');
    setFilterType('');
    setFilterStatus('');
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
        namespace: 'absences',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Ausências', href: '/hr/absences' },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Ausências"
            description="Faltas, atestados e afastamentos"
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
              value={filterType}
              onValueChange={v =>
                setFilterType(v === 'ALL' ? '' : (v as AbsenceType))
              }
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                {ABSENCE_TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={v =>
                setFilterStatus(v === 'ALL' ? '' : (v as AbsenceStatus))
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                {ABSENCE_STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
              className="w-40"
              placeholder="Data início"
            />
            <Input
              type="date"
              value={filterEndDate}
              onChange={e => setFilterEndDate(e.target.value)}
              className="w-40"
              placeholder="Data fim"
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
              title="Erro ao carregar ausências"
              message="Ocorreu um erro ao tentar carregar as ausências. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={absencesConfig}
              items={absences}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={false}
              onItemDoubleClick={item => {
                if (canView) {
                  setSelectedAbsence(item);
                  setIsViewOpen(true);
                }
              }}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
          )}

          <RequestSickLeaveModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />

          <RejectModal
            isOpen={showRejectModal}
            onClose={() => {
              setShowRejectModal(false);
              setRejectAbsenceId(null);
            }}
            absenceId={rejectAbsenceId}
          />

          <ViewModal
            isOpen={isViewOpen}
            onClose={() => {
              setIsViewOpen(false);
              setSelectedAbsence(null);
            }}
            absence={selectedAbsence}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
