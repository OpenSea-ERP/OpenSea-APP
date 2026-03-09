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
import { usePermissions } from '@/hooks/use-permissions';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import type { Deduction } from '@/types/hr';
import { Calendar, Eye, MinusCircle, Plus, Trash2, User } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  deductionsConfig,
  useListDeductions,
  useCreateDeduction,
  useDeleteDeduction,
  CreateModal,
  DeleteConfirmModal,
  ViewModal,
  formatCurrency,
  formatDate,
  getAppliedLabel,
  getAppliedColor,
  formatInstallments,
  type DeductionFilters,
} from './src';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';

export default function DeductionsPage() {
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.DEDUCTIONS.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.DEDUCTIONS.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.DEDUCTIONS.DELETE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterIsApplied, setFilterIsApplied] = useState<boolean | undefined>(
    undefined
  );
  const [filterIsRecurring, setFilterIsRecurring] = useState<
    boolean | undefined
  >(undefined);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const queryParams = useMemo<DeductionFilters>(() => {
    const params: DeductionFilters = {};
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (filterIsApplied !== undefined) params.isApplied = filterIsApplied;
    if (filterIsRecurring !== undefined) params.isRecurring = filterIsRecurring;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    return params;
  }, [
    filterEmployeeId,
    filterIsApplied,
    filterIsRecurring,
    filterStartDate,
    filterEndDate,
  ]);

  // ============================================================================
  // DATA
  // ============================================================================

  const { data, isLoading, error, refetch } = useListDeductions(queryParams);
  const createMutation = useCreateDeduction();
  const deleteMutation = useDeleteDeduction();

  const deductions = data?.deductions ?? [];

  const employeeIds = useMemo(() => deductions.map(d => d.employeeId), [deductions]);
  const { getName } = useEmployeeMap(employeeIds);

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Deduction | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return deductions;
    const q = searchQuery.toLowerCase();
    return deductions.filter(d => {
      const name = d.name?.toLowerCase() ?? '';
      const reason = d.reason?.toLowerCase() ?? '';
      return name.includes(q) || reason.includes(q);
    });
  }, [deductions, searchQuery]);

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

  const handleViewItem = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        const item = deductions.find(d => d.id === ids[0]);
        if (item) {
          setViewTarget(item);
          setIsViewOpen(true);
        }
      }
    },
    [deductions]
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

  // ============================================================================
  // CONTEXT MENU ACTIONS
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

  const renderGridCard = (item: Deduction, isSelected: boolean) => {
    const installmentInfo = formatInstallments(item);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleViewItem : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={formatCurrency(item.amount)}
          icon={MinusCircle}
          iconBgColor="bg-linear-to-br from-red-500 to-red-600"
          badges={[
            {
              label: getAppliedLabel(item),
              variant: getAppliedColor(item),
            },
            ...(item.isRecurring
              ? [{ label: 'Recorrente', variant: 'outline' as const }]
              : []),
            ...(installmentInfo
              ? [{ label: installmentInfo, variant: 'secondary' as const }]
              : []),
          ]}
          metadata={
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {getName(item.employeeId)}
              </span>
              <span className="line-clamp-1">{item.reason}</span>
              {item.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.date)}
                </span>
              )}
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
  };

  const renderListCard = (item: Deduction, isSelected: boolean) => {
    const installmentInfo = formatInstallments(item);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleViewItem : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={formatCurrency(item.amount)}
          icon={MinusCircle}
          iconBgColor="bg-linear-to-br from-red-500 to-red-600"
          badges={[
            {
              label: getAppliedLabel(item),
              variant: getAppliedColor(item),
            },
            ...(item.isRecurring
              ? [{ label: 'Recorrente', variant: 'outline' as const }]
              : []),
            ...(installmentInfo
              ? [{ label: installmentInfo, variant: 'secondary' as const }]
              : []),
          ]}
          metadata={
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {getName(item.employeeId)}
              </span>
              <span className="line-clamp-1 max-w-[200px]">{item.reason}</span>
              {item.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.date)}
                </span>
              )}
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
  };

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const actionButtons: HeaderButton[] = useMemo(
    () =>
      canCreate
        ? [
            {
              id: 'create-deduction',
              title: 'Nova Dedução',
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
    filterIsApplied !== undefined ||
    filterIsRecurring !== undefined ||
    filterStartDate ||
    filterEndDate;

  const clearFilters = useCallback(() => {
    setFilterEmployeeId('');
    setFilterIsApplied(undefined);
    setFilterIsRecurring(undefined);
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
        namespace: 'deductions',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Deduções', href: '/hr/deductions' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Deduções"
            description="Gerencie as deduções dos funcionários"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            placeholder={deductionsConfig.display.labels.searchPlaceholder}
            onSearch={value => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <EmployeeSelector
                value={filterEmployeeId}
                onChange={id => setFilterEmployeeId(id)}
                placeholder="Filtrar por funcionário..."
              />
            </div>

            <Select
              value={
                filterIsApplied === undefined
                  ? 'ALL'
                  : filterIsApplied
                    ? 'true'
                    : 'false'
              }
              onValueChange={v =>
                setFilterIsApplied(v === 'ALL' ? undefined : v === 'true')
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="true">Aplicada</SelectItem>
                <SelectItem value="false">Pendente</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={
                filterIsRecurring === undefined
                  ? 'ALL'
                  : filterIsRecurring
                    ? 'true'
                    : 'false'
              }
              onValueChange={v =>
                setFilterIsRecurring(v === 'ALL' ? undefined : v === 'true')
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                <SelectItem value="true">Recorrente</SelectItem>
                <SelectItem value="false">Avulsa</SelectItem>
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

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar deduções"
              message="Ocorreu um erro ao tentar carregar as deduções. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={deductionsConfig}
              items={filteredItems}
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
            isSubmitting={createMutation.isPending}
          />

          {/* View Modal */}
          <ViewModal
            isOpen={isViewOpen}
            onClose={() => {
              setIsViewOpen(false);
              setViewTarget(null);
            }}
            deduction={viewTarget}
          />

          {/* Delete Confirmation */}
          <DeleteConfirmModal
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false);
              setDeleteTarget(null);
            }}
            onConfirm={handleDeleteConfirm}
            isLoading={deleteMutation.isPending}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
