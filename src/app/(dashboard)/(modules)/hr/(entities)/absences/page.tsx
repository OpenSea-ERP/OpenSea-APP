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
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { exportToCSV } from '@/lib/csv-export';
import { usePermissions } from '@/hooks/use-permissions';
import { employeesService } from '@/services/hr/employees.service';
import type { Absence, AbsenceType, AbsenceStatus } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  Ban,
  Calendar,
  Check,
  CircleCheck,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Plus,
  User,
  UserX,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import {
  absencesConfig,
  useListAbsences,
  useApproveAbsence,
  useCancelAbsence,
  getTypeLabel,
  getStatusLabel,
  getStatusColor,
  getTypeColor,
} from './src';

const RequestSickLeaveModal = dynamic(
  () =>
    import('./src/modals/request-sick-leave-modal').then(m => ({
      default: m.RequestSickLeaveModal,
    })),
  { ssr: false }
);
const RejectModal = dynamic(
  () =>
    import('./src/modals/reject-modal').then(m => ({ default: m.RejectModal })),
  { ssr: false }
);
const ViewModal = dynamic(
  () => import('./src/modals/view-modal').then(m => ({ default: m.ViewModal })),
  { ssr: false }
);
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

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
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const canView = hasPermission(HR_PERMISSIONS.ABSENCES.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.ABSENCES.CREATE);
  const canApprove = hasPermission(HR_PERMISSIONS.ABSENCES.APPROVE);
  const canManage = hasPermission(HR_PERMISSIONS.ABSENCES.MANAGE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
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
  }, [
    filterEmployeeId,
    filterType,
    filterStatus,
    filterStartDate,
    filterEndDate,
  ]);

  // ============================================================================
  // DATA
  // ============================================================================

  const { data, isLoading, error, refetch } = useListAbsences(queryParams);
  const approveAbsence = useApproveAbsence();
  const cancelAbsence = useCancelAbsence();

  const absences = data?.absences ?? [];

  const employeeIds = useMemo(
    () => absences.map(a => a.employeeId),
    [absences]
  );
  const { getName } = useEmployeeMap(employeeIds);

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'filter-options'],
    queryFn: () =>
      employeesService.listEmployees({ perPage: 100, status: 'ACTIVE' }),
    staleTime: 60_000,
  });

  const employeeOptions = useMemo(
    () =>
      (employeesData?.employees ?? []).map(e => ({
        value: e.id,
        label: e.fullName,
      })),
    [employeesData]
  );

  const typeOptions = useMemo(
    () => ABSENCE_TYPE_OPTIONS.map(opt => ({ value: opt.value, label: opt.label })),
    []
  );

  const statusOptions = useMemo(
    () => ABSENCE_STATUS_OPTIONS.map(opt => ({ value: opt.value, label: opt.label })),
    []
  );

  // ============================================================================
  // STATE
  // ============================================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectAbsenceId, setRejectAbsenceId] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [showCancelPin, setShowCancelPin] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const initialIds = useMemo(() => absences.map(i => i.id), [absences]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleBulkApprove = useCallback(
    async (ids: string[]) => {
      const pendingIds = ids.filter(id => {
        const item = absences.find(a => a.id === id);
        return item && item.status === 'PENDING';
      });
      if (pendingIds.length === 0) {
        toast.info('Nenhuma ausência pendente selecionada');
        return;
      }
      try {
        for (const id of pendingIds) {
          approveAbsence.mutate(id);
        }
        toast.success(`${pendingIds.length} ausência(s) aprovada(s)`);
      } catch {
        // Toast handled by mutation
      }
    },
    [absences, approveAbsence]
  );

  const handleExport = useCallback(
    (ids: string[]) => {
      const items =
        ids.length > 0 ? absences.filter(a => ids.includes(a.id)) : absences;
      exportToCSV(
        items,
        [
          { header: 'Funcionário', accessor: a => getName(a.employeeId) },
          { header: 'Tipo', accessor: a => getTypeLabel(a.type) },
          { header: 'Status', accessor: a => getStatusLabel(a.status) },
          {
            header: 'Data Início',
            accessor: a =>
              a.startDate
                ? new Date(a.startDate).toLocaleDateString('pt-BR')
                : '',
          },
          {
            header: 'Data Fim',
            accessor: a =>
              a.endDate ? new Date(a.endDate).toLocaleDateString('pt-BR') : '',
          },
          { header: 'Dias', accessor: a => a.totalDays },
          { header: 'CID', accessor: a => a.cid || '' },
        ],
        'ausencias'
      );
    },
    [absences, getName]
  );

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

  const handleCancel = useCallback((id: string) => {
    setCancelTargetId(id);
    setShowCancelPin(true);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    if (cancelTargetId) {
      cancelAbsence.mutate(cancelTargetId);
    }
    setShowCancelPin(false);
    setCancelTargetId(null);
  }, [cancelTargetId, cancelAbsence]);

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
          if (ids.length > 0) router.push(`/hr/absences/${ids[0]}`);
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
        separator: 'before',
        onClick: (ids: string[]) => {
          if (ids.length > 0) handleApprove(ids[0]);
        },
      });
      actions.push({
        id: 'reject',
        label: 'Rejeitar',
        icon: XCircle,
        separator: 'before',
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
        iconBgColor="bg-linear-to-br from-rose-500 to-rose-600"
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
              <User className="h-3 w-3" />
              <span>{getName(item.employeeId)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDate(item.startDate)} &mdash; {formatDate(item.endDate)}
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
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/absences/${item.id}`)}
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
              className="flex-1 text-xs text-rose-600 hover:bg-rose-50"
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
        iconBgColor="bg-linear-to-br from-rose-500 to-rose-600"
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
              <User className="h-3 w-3" />
              {getName(item.employeeId)}
            </span>
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
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/absences/${item.id}`)}
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
      id: 'export-absences',
      title: 'Exportar',
      icon: Download,
      onClick: () => handleExport([]),
      variant: 'outline',
    });
    if (canCreate) {
      buttons.push({
        id: 'create-absence',
        title: 'Registrar Atestado',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate, handleOpenCreate, handleExport]);

  // ============================================================================
  // FILTERS UI (unused date filters kept for query params)
  // ============================================================================

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
          <SearchBar
            value={searchQuery}
            placeholder="Buscar ausências..."
            onSearch={value => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

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
                    label="Tipo"
                    icon={FileText}
                    options={typeOptions}
                    value={filterType}
                    onChange={v => setFilterType(v as AbsenceType | '')}
                    activeColor="emerald"
                  />
                  <FilterDropdown
                    label="Status"
                    icon={CircleCheck}
                    options={statusOptions}
                    value={filterStatus}
                    onChange={v => setFilterStatus(v as AbsenceStatus | '')}
                    activeColor="cyan"
                  />
                </>
              }
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

          <VerifyActionPinModal
            isOpen={showCancelPin}
            onClose={() => {
              setShowCancelPin(false);
              setCancelTargetId(null);
            }}
            onSuccess={handleCancelConfirm}
            title="Confirmar Cancelamento"
            description="Digite seu PIN de ação para cancelar esta ausência."
          />

          <HRSelectionToolbar
            totalItems={absences.length}
            actions={[
              ...(canApprove
                ? [
                    {
                      id: 'bulk-approve',
                      label: 'Aprovar',
                      icon: Check,
                      onClick: handleBulkApprove,
                      variant: 'default' as const,
                    },
                  ]
                : []),
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
