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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { exportToCSV } from '@/lib/csv-export';
import { usePermissions } from '@/hooks/use-permissions';
import { DateRangeFilter } from '@/app/(dashboard)/(modules)/admin/overview/audit-logs/src/components/date-range-filter';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { employeesService } from '@/services/hr/employees.service';
import { medicalExamsService } from '@/services/hr/medical-exams.service';
import type { MedicalExam, MedicalExamStatus } from '@/types/hr';
import {
  AlertTriangle,
  Calendar,
  CircleCheck,
  Clock,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Pencil,
  Loader2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  medicalExamsConfig,
  useListMedicalExams,
  useCreateMedicalExam,
  useDeleteMedicalExam,
  formatDate,
  getExamTypeLabel,
  getExamResultLabel,
  getExamResultVariant,
  getExpirationStatus,
  getExpirationStatusLabel,
  getExpirationBadgeClasses,
  type MedicalExamFilters,
} from './src';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

const EXAM_TYPE_OPTIONS = [
  { value: 'ADMISSIONAL', label: 'Admissional' },
  { value: 'PERIODICO', label: 'Periódico' },
  { value: 'MUDANCA_FUNCAO', label: 'Mudança de Função' },
  { value: 'RETORNO', label: 'Retorno ao Trabalho' },
  { value: 'DEMISSIONAL', label: 'Demissional' },
];

const EXAM_RESULT_OPTIONS = [
  { value: 'APTO', label: 'Apto' },
  { value: 'INAPTO', label: 'Inapto' },
  { value: 'APTO_COM_RESTRICOES', label: 'Apto com Restrições' },
];

const EXAM_STATUS_OPTIONS = [
  { value: 'VALID', label: 'Válidos' },
  { value: 'EXPIRING', label: 'Vencendo em 30 dias' },
  { value: 'EXPIRED', label: 'Vencidos' },
];

export default function MedicalExamsPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.MEDICAL_EXAMS.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.MEDICAL_EXAMS.CREATE);
  const canEdit = hasPermission(HR_PERMISSIONS.MEDICAL_EXAMS.UPDATE);
  const canDelete = hasPermission(HR_PERMISSIONS.MEDICAL_EXAMS.DELETE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const queryParams = useMemo<MedicalExamFilters>(() => {
    const params: MedicalExamFilters = {};
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (filterType) params.type = filterType;
    if (filterResult) params.result = filterResult;
    if (filterStatus) params.status = filterStatus as MedicalExamStatus;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    return params;
  }, [
    filterEmployeeId,
    filterType,
    filterResult,
    filterStatus,
    filterStartDate,
    filterEndDate,
  ]);

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
  } = useListMedicalExams(queryParams);
  const createMutation = useCreateMedicalExam();
  const deleteMutation = useDeleteMedicalExam();

  const exams = useMemo(
    () => data?.pages.flatMap(p => p.medicalExams ?? []) ?? [],
    [data]
  );

  // Compliance summary data
  const { data: expiringData } = useQuery({
    queryKey: ['medical-exams', 'expiring'],
    queryFn: () => medicalExamsService.listExpiring(30),
    staleTime: 5 * 60 * 1000,
  });

  const { data: overdueData } = useQuery({
    queryKey: ['medical-exams', 'overdue'],
    queryFn: () => medicalExamsService.listOverdue(),
    staleTime: 5 * 60 * 1000,
  });

  const expiringCount = expiringData?.expiringExams?.length ?? 0;
  const overdueCount = overdueData?.overdueExams?.length ?? 0;

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const employeeIds = useMemo(() => exams.map(e => e.employeeId), [exams]);
  const { getName } = useEmployeeMap(employeeIds);

  // Employees for filter dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'filter-list'],
    queryFn: () => employeesService.listEmployees({ perPage: 100 }),
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

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const q = searchQuery.toLowerCase();
    return exams.filter(e => {
      const doctor = e.doctorName?.toLowerCase() ?? '';
      const crm = e.doctorCrm?.toLowerCase() ?? '';
      return doctor.includes(q) || crm.includes(q);
    });
  }, [exams, searchQuery]);

  const initialIds = useMemo(
    () => filteredItems.map(i => i.id),
    [filteredItems]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = useCallback(
    async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
    },
    [createMutation]
  );

  const handleViewItem = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        router.push(`/hr/medical-exams/${ids[0]}`);
      }
    },
    [router]
  );

  const handleDeleteRequest = useCallback((ids: string[]) => {
    if (ids.length > 0) {
      setDeleteTarget(ids[0]);
      setIsDeleteOpen(true);
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      setIsDeleteOpen(false);
    } catch {
      // Toast handled by mutation
    }
  }, [deleteTarget, deleteMutation]);

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      try {
        for (const id of ids) {
          await deleteMutation.mutateAsync(id);
        }
        toast.success(`${ids.length} exame(s) excluído(s)`);
      } catch {
        // Toast handled by mutation
      }
    },
    [deleteMutation]
  );

  const handleExport = useCallback(
    (ids: string[]) => {
      const items =
        ids.length > 0 ? exams.filter(e => ids.includes(e.id)) : exams;
      exportToCSV(
        items,
        [
          { header: 'Funcionário', accessor: e => getName(e.employeeId) },
          { header: 'Tipo', accessor: e => getExamTypeLabel(e.type) },
          { header: 'Data', accessor: e => formatDate(e.examDate) },
          { header: 'Validade', accessor: e => formatDate(e.expirationDate) },
          { header: 'Médico', accessor: e => e.doctorName },
          { header: 'CRM', accessor: e => e.doctorCrm },
          { header: 'Resultado', accessor: e => getExamResultLabel(e.result) },
          {
            header: 'Aptidão',
            accessor: e => (e.aptitude ? getExamResultLabel(e.aptitude) : '-'),
          },
          { header: 'Clínica', accessor: e => e.clinicName ?? '-' },
          {
            header: 'Status',
            accessor: e =>
              getExpirationStatusLabel(getExpirationStatus(e.expirationDate)),
          },
        ],
        'exames-medicos'
      );
    },
    [exams, getName]
  );

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(() => {
    const actions: ContextMenuAction[] = [];

    if (canView) {
      actions.push({
        id: 'open',
        label: 'Abrir',
        icon: ExternalLink,
        onClick: (ids: string[]) => {
          if (ids.length > 0) router.push(`/hr/medical-exams/${ids[0]}`);
        },
      });
    }

    if (canEdit) {
      actions.push({
        id: 'edit',
        label: 'Editar',
        icon: Pencil,
        onClick: (ids: string[]) => {
          if (ids.length > 0) router.push(`/hr/medical-exams/${ids[0]}/edit`);
        },
      });
    }

    if (canDelete) {
      actions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: handleDeleteRequest,
        variant: 'destructive',
        separator: 'before',
      });
    }

    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canEdit, canDelete]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: MedicalExam, isSelected: boolean) => {
    const expirationStatus = getExpirationStatus(item.expirationDate);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleViewItem : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={getExamTypeLabel(item.type)}
          subtitle={`${item.doctorName} - ${item.doctorCrm}`}
          icon={Stethoscope}
          iconBgColor="bg-linear-to-br from-teal-500 to-teal-600"
          badges={[
            {
              label: getExamResultLabel(item.result),
              variant: getExamResultVariant(item.result),
            },
          ]}
          metadata={
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {getName(item.employeeId)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.examDate)}
              </span>
              {item.expirationDate && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium w-fit ${getExpirationBadgeClasses(expirationStatus)}`}
                >
                  {expirationStatus === 'EXPIRED' && (
                    <AlertTriangle className="h-2.5 w-2.5" />
                  )}
                  {expirationStatus === 'EXPIRING' && (
                    <Clock className="h-2.5 w-2.5" />
                  )}
                  {expirationStatus === 'VALID' && (
                    <ShieldCheck className="h-2.5 w-2.5" />
                  )}
                  {getExpirationStatusLabel(expirationStatus)}
                  {item.expirationDate && (
                    <span className="ml-0.5">
                      ({formatDate(item.expirationDate)})
                    </span>
                  )}
                </span>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/medical-exams/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: MedicalExam, isSelected: boolean) => {
    const expirationStatus = getExpirationStatus(item.expirationDate);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleViewItem : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={getExamTypeLabel(item.type)}
          subtitle={`${item.doctorName} - ${item.doctorCrm}`}
          icon={Stethoscope}
          iconBgColor="bg-linear-to-br from-teal-500 to-teal-600"
          badges={[
            {
              label: getExamResultLabel(item.result),
              variant: getExamResultVariant(item.result),
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
                {formatDate(item.examDate)}
              </span>
              {item.expirationDate && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${getExpirationBadgeClasses(expirationStatus)}`}
                >
                  {getExpirationStatusLabel(expirationStatus)}
                </span>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/medical-exams/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const actionButtons: HeaderButton[] = useMemo(() => {
    const buttons: HeaderButton[] = [];
    buttons.push({
      id: 'pcmso-dashboard',
      title: 'Painel PCMSO',
      icon: ClipboardList,
      onClick: () => router.push('/hr/medical-exams/pcmso'),
      variant: 'outline',
    });
    buttons.push({
      id: 'export-exams',
      title: 'Exportar',
      icon: Download,
      onClick: () => handleExport([]),
      variant: 'outline',
    });
    if (canCreate) {
      buttons.push({
        id: 'create-exam',
        title: 'Novo Exame',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate, handleOpenCreate, handleExport, router]);

  // ============================================================================
  // LOADING STATE
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
        namespace: 'medical-exams',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Exames Médicos', href: '/hr/medical-exams' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Exames Médicos"
            description="Gerencie os exames médicos ocupacionais dos funcionários (PCMSO)"
          />
        </PageHeader>

        <PageBody>
          {/* Compliance Summary */}
          {(expiringCount > 0 || overdueCount > 0) && (
            <div className="flex items-center gap-3 flex-wrap">
              {overdueCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterStatus('EXPIRED')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    filterStatus === 'EXPIRED'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-500/30'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/15'
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>
                    {overdueCount} exame{overdueCount !== 1 ? 's' : ''} vencido
                    {overdueCount !== 1 ? 's' : ''}
                  </span>
                </button>
              )}
              {expiringCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterStatus('EXPIRING')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    filterStatus === 'EXPIRING'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-500/30'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/15'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>{expiringCount} vencendo em 30 dias</span>
                </button>
              )}
              {filterStatus && (
                <button
                  type="button"
                  onClick={() => setFilterStatus('')}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Limpar filtro
                </button>
              )}
            </div>
          )}

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            placeholder={medicalExamsConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar exames médicos"
              message="Ocorreu um erro ao tentar carregar os exames. Por favor, tente novamente."
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
                config={medicalExamsConfig}
                items={filteredItems}
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
                      options={EXAM_TYPE_OPTIONS}
                      value={filterType}
                      onChange={v => setFilterType(v)}
                      activeColor="cyan"
                    />
                    <FilterDropdown
                      label="Resultado"
                      icon={CircleCheck}
                      options={EXAM_RESULT_OPTIONS}
                      value={filterResult}
                      onChange={v => setFilterResult(v)}
                      activeColor="emerald"
                    />
                    <FilterDropdown
                      label="Situação"
                      icon={ShieldCheck}
                      options={EXAM_STATUS_OPTIONS}
                      value={filterStatus}
                      onChange={v => setFilterStatus(v)}
                      activeColor="blue"
                    />
                    <DateRangeFilter
                      startDate={filterStartDate}
                      endDate={filterEndDate}
                      onStartDateChange={setFilterStartDate}
                      onEndDateChange={setFilterEndDate}
                    />
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!searchQuery}
                onItemDoubleClick={item => {
                  if (canView) {
                    router.push(`/hr/medical-exams/${item.id}`);
                  }
                }}
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
              />
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}

          {/* Create Modal */}
          <CreateModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreate}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false);
              setDeleteTarget(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Excluir Exame Médico"
            description="Digite seu PIN de ação para excluir este exame médico. Esta ação não pode ser desfeita."
          />

          <HRSelectionToolbar
            totalItems={filteredItems.length}
            defaultActions={{
              delete: canDelete,
              export: true,
            }}
            handlers={{
              onDelete: handleBulkDelete,
              onExport: handleExport,
            }}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
