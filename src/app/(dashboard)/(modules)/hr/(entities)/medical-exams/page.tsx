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
import type { MedicalExam } from '@/types/hr';
import {
  Calendar,
  CircleCheck,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Plus,
  Stethoscope,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  medicalExamsConfig,
  useListMedicalExams,
  useCreateMedicalExam,
  useDeleteMedicalExam,
  formatDate,
  getExamTypeLabel,
  getExamResultLabel,
  getExamResultVariant,
  type MedicalExamFilters,
} from './src';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
const ViewModal = dynamic(
  () => import('./src/modals/view-modal').then(m => ({ default: m.ViewModal })),
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

export default function MedicalExamsPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.MEDICAL_EXAMS.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.MEDICAL_EXAMS.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.MEDICAL_EXAMS.DELETE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const queryParams = useMemo<MedicalExamFilters>(() => {
    const params: MedicalExamFilters = {};
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (filterType) params.type = filterType;
    if (filterResult) params.result = filterResult;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    return params;
  }, [
    filterEmployeeId,
    filterType,
    filterResult,
    filterStartDate,
    filterEndDate,
  ]);

  // ============================================================================
  // DATA
  // ============================================================================

  const { data, isLoading, error, refetch } = useListMedicalExams(queryParams);
  const createMutation = useCreateMedicalExam();
  const deleteMutation = useDeleteMedicalExam();

  const exams = data?.medicalExams ?? [];

  const employeeIds = useMemo(() => exams.map(e => e.employeeId), [exams]);
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

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<MedicalExam | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
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
        const item = exams.find(e => e.id === ids[0]);
        if (item) {
          setViewTarget(item);
          setIsViewOpen(true);
        }
      }
    },
    [exams]
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
      actions.push({
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: handleViewItem,
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
  }, [canView, canDelete]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: MedicalExam, isSelected: boolean) => {
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
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {getName(item.employeeId)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.examDate)}
              </span>
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
  }, [canCreate, handleOpenCreate, handleExport]);

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
            description="Gerencie os exames médicos ocupacionais dos funcionários"
          />
        </PageHeader>

        <PageBody>
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
                  setViewTarget(item);
                  setIsViewOpen(true);
                }
              }}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
          )}

          {/* Create Modal */}
          <CreateModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreate}
          />

          {/* View Modal */}
          <ViewModal
            isOpen={isViewOpen}
            onClose={() => {
              setIsViewOpen(false);
              setViewTarget(null);
            }}
            exam={viewTarget}
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
