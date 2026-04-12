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
import { usePermissions } from '@/hooks/use-permissions';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { exportToCSV } from '@/lib/csv-export';
import { employeesService } from '@/services/hr/employees.service';
import type { Deduction } from '@/types/hr';
import {
  Calendar,
  CircleCheck,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MinusCircle,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import {
  deductionsConfig,
  useListDeductions,
  useCreateDeduction,
  useDeleteDeduction,
  formatCurrency,
  formatDate,
  getAppliedLabel,
  getAppliedColor,
  formatInstallments,
  type DeductionFilters,
} from './src';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

export default function DeductionsPage() {
  const router = useRouter();
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

  const queryParams = useMemo<DeductionFilters>(() => {
    const params: DeductionFilters = {};
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (filterIsApplied !== undefined) params.isApplied = filterIsApplied;
    if (filterIsRecurring !== undefined) params.isRecurring = filterIsRecurring;
    return params;
  }, [filterEmployeeId, filterIsApplied, filterIsRecurring]);

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
  } = useListDeductions(queryParams);
  const createMutation = useCreateDeduction();
  const deleteMutation = useDeleteDeduction();

  const deductions = data?.pages.flatMap(p => p.deductions ?? []) ?? [];

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const employeeIds = useMemo(
    () => deductions.map(d => d.employeeId),
    [deductions]
  );
  const { getName } = useEmployeeMap(employeeIds);

  // Employee options for filter dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'filter-options'],
    queryFn: () =>
      employeesService.listEmployees({ perPage: 100, status: 'ACTIVE' }),
    staleTime: 60_000,
  });

  const employeeOptions = useMemo(
    () =>
      (employeesData?.employees ?? []).map(e => ({
        id: e.id,
        label: e.fullName,
      })),
    [employeesData]
  );

  const statusOptions = useMemo(
    () => [
      { value: 'true', label: 'Aplicada' },
      { value: 'false', label: 'Pendente' },
    ],
    []
  );

  const typeOptions = useMemo(
    () => [
      { value: 'true', label: 'Recorrente' },
      { value: 'false', label: 'Avulsa' },
    ],
    []
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
      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
    },
    [createMutation]
  );

  const handleViewItem = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        router.push(`/hr/deductions/${ids[0]}`);
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
        toast.success(`${ids.length} dedução(ões) excluída(s)`);
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
          ? deductions.filter(d => ids.includes(d.id))
          : deductions;
      exportToCSV(
        items,
        [
          { header: 'Nome', accessor: d => d.name },
          { header: 'Funcionário', accessor: d => getName(d.employeeId) },
          { header: 'Valor', accessor: d => d.amount },
          {
            header: 'Data',
            accessor: d =>
              d.date ? new Date(d.date).toLocaleDateString('pt-BR') : '',
          },
          { header: 'Motivo', accessor: d => d.reason },
          {
            header: 'Recorrente',
            accessor: d => (d.isRecurring ? 'Sim' : 'Não'),
          },
          { header: 'Aplicada', accessor: d => (d.isApplied ? 'Sim' : 'Não') },
        ],
        'deducoes'
      );
    },
    [deductions, getName]
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
          if (ids.length > 0) router.push(`/hr/deductions/${ids[0]}`);
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
          iconBgColor="bg-linear-to-br from-rose-500 to-rose-600"
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
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/deductions/${item.id}`)}
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
          iconBgColor="bg-linear-to-br from-rose-500 to-rose-600"
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
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/deductions/${item.id}`)}
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
      id: 'export-deductions',
      title: 'Exportar',
      icon: Download,
      onClick: () => handleExport([]),
      variant: 'outline',
    });
    if (canCreate) {
      buttons.push({
        id: 'create-deduction',
        title: 'Nova Dedução',
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
                    options={statusOptions}
                    value={
                      filterIsApplied === undefined
                        ? ''
                        : filterIsApplied
                          ? 'true'
                          : 'false'
                    }
                    onChange={v =>
                      setFilterIsApplied(v === '' ? undefined : v === 'true')
                    }
                    activeColor="emerald"
                  />
                  <FilterDropdown
                    label="Tipo"
                    icon={FileText}
                    options={typeOptions}
                    value={
                      filterIsRecurring === undefined
                        ? ''
                        : filterIsRecurring
                          ? 'true'
                          : 'false'
                    }
                    onChange={v =>
                      setFilterIsRecurring(v === '' ? undefined : v === 'true')
                    }
                    activeColor="cyan"
                  />
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredItems.length}{' '}
                    {filteredItems.length === 1 ? 'dedução' : 'deduções'}
                  </p>
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                if (canView) {
                  router.push(`/hr/deductions/${item.id}`);
                }
              }}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
          )}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
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
            title="Excluir Dedução"
            description="Digite seu PIN de ação para excluir esta dedução. Esta ação não pode ser desfeita."
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
