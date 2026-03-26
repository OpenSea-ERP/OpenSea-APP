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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import type { Termination } from '@/types/hr';
import {
  Calendar,
  Download,
  ExternalLink,
  Eye,
  FileX2,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import {
  terminationsConfig,
  useListTerminations,
  useCreateTermination,
  useDeleteTermination,
  formatCurrency,
  formatDate,
  getTerminationTypeLabel,
  getTerminationStatusLabel,
  getTerminationStatusVariant,
  getTerminationTypeVariant,
  type TerminationFilters,
  TERMINATION_TYPE_LABELS,
  TERMINATION_STATUS_LABELS,
} from './src';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

export default function TerminationsPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.TERMINATIONS.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.TERMINATIONS.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.TERMINATIONS.DELETE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const queryParams = useMemo<TerminationFilters>(() => {
    const params: TerminationFilters = {};
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

  const { data, isLoading, error, refetch } = useListTerminations(queryParams);
  const createMutation = useCreateTermination();
  const deleteMutation = useDeleteTermination();

  const terminations = data?.terminations ?? [];

  const employeeIds = useMemo(
    () => terminations.map(t => t.employeeId),
    [terminations]
  );
  const { getName } = useEmployeeMap(employeeIds);

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
    if (!searchQuery.trim()) return terminations;
    const q = searchQuery.toLowerCase();
    return terminations.filter(t => {
      const typeName = getTerminationTypeLabel(t.type).toLowerCase();
      const statusName = getTerminationStatusLabel(t.status).toLowerCase();
      return typeName.includes(q) || statusName.includes(q);
    });
  }, [terminations, searchQuery]);

  const initialIds = useMemo(
    () => filteredItems.map(i => i.id),
    [filteredItems]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

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
        toast.success(`${ids.length} rescisão(ões) excluída(s)`);
      } catch {
        // Toast handled by mutation
      }
    },
    [deleteMutation]
  );

  const handleExport = useCallback(
    (ids: string[]) => {
      const items =
        ids.length > 0
          ? terminations.filter(t => ids.includes(t.id))
          : terminations;
      exportToCSV(
        items,
        [
          { header: 'Funcionário', accessor: t => getName(t.employeeId) },
          { header: 'Tipo', accessor: t => getTerminationTypeLabel(t.type) },
          { header: 'Data', accessor: t => formatDate(t.terminationDate) },
          {
            header: 'Status',
            accessor: t => getTerminationStatusLabel(t.status),
          },
          {
            header: 'Total Líquido',
            accessor: t => formatCurrency(t.totalLiquido),
          },
        ],
        'rescisoes'
      );
    },
    [terminations, getName]
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
          if (ids.length > 0) router.push(`/hr/terminations/${ids[0]}`);
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
  }, [canView, canDelete]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Termination, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/terminations/${ids[0]}`);
              }
            : undefined
        }
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={getTerminationTypeLabel(item.type)}
          subtitle={
            item.totalLiquido
              ? formatCurrency(item.totalLiquido)
              : 'Valores pendentes'
          }
          icon={FileX2}
          iconBgColor="bg-linear-to-br from-rose-500 to-rose-600"
          badges={[
            {
              label: getTerminationStatusLabel(item.status),
              variant: getTerminationStatusVariant(item.status),
            },
            {
              label: getTerminationTypeLabel(item.type),
              variant: getTerminationTypeVariant(item.type),
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
                {formatDate(item.terminationDate)}
              </span>
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/terminations/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Termination, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/terminations/${ids[0]}`);
              }
            : undefined
        }
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={getTerminationTypeLabel(item.type)}
          subtitle={
            item.totalLiquido
              ? formatCurrency(item.totalLiquido)
              : 'Valores pendentes'
          }
          icon={FileX2}
          iconBgColor="bg-linear-to-br from-rose-500 to-rose-600"
          badges={[
            {
              label: getTerminationStatusLabel(item.status),
              variant: getTerminationStatusVariant(item.status),
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
                {formatDate(item.terminationDate)}
              </span>
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/terminations/${item.id}`)}
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
      id: 'export-terminations',
      title: 'Exportar',
      icon: Download,
      onClick: () => handleExport([]),
      variant: 'outline',
    });
    if (canCreate) {
      buttons.push({
        id: 'create-termination',
        title: 'Nova Rescisão',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate, handleOpenCreate, handleExport]);

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
        namespace: 'terminations',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Rescisões', href: '/hr/terminations' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Rescisões"
            description="Gerencie as rescisões de contrato de trabalho"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            placeholder={terminationsConfig.display.labels.searchPlaceholder}
            onSearch={value => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-64">
              <EmployeeSelector
                value={filterEmployeeId}
                onChange={id => setFilterEmployeeId(id)}
                placeholder="Filtrar por funcionário..."
              />
            </div>

            <Select
              value={filterType || 'ALL'}
              onValueChange={v => setFilterType(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Tipo de Rescisão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                {Object.entries(TERMINATION_TYPE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus || 'ALL'}
              onValueChange={v => setFilterStatus(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                {Object.entries(TERMINATION_STATUS_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
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

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar rescisões"
              message="Ocorreu um erro ao tentar carregar as rescisões. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={terminationsConfig}
              items={filteredItems}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                if (canView) {
                  router.push(`/hr/terminations/${item.id}`);
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
            isSubmitting={createMutation.isPending}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false);
              setDeleteTarget(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Excluir Rescisão"
            description="Digite seu PIN de ação para excluir esta rescisão. Esta ação não pode ser desfeita."
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
