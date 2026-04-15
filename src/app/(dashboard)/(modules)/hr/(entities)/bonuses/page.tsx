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
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { employeesService } from '@/services/hr/employees.service';
import type { Bonus } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CircleCheck,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  PlusCircle,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  bonusesConfig,
  useListBonuses,
  useCreateBonus,
  useDeleteBonus,
  formatCurrency,
  formatDate,
  getPaidLabel,
  getPaidColor,
  type BonusFilters,
} from './src';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

export default function BonusesPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.BONUSES.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.BONUSES.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.BONUSES.DELETE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterIsPaid, setFilterIsPaid] = useState<boolean | undefined>(
    undefined
  );
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const queryParams = useMemo<BonusFilters>(() => {
    const params: BonusFilters = {};
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (filterIsPaid !== undefined) params.isPaid = filterIsPaid;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    return params;
  }, [filterEmployeeId, filterIsPaid, filterStartDate, filterEndDate]);

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
  } = useListBonuses(queryParams);
  const createMutation = useCreateBonus();
  const deleteMutation = useDeleteBonus();

  const bonuses = data?.pages.flatMap(p => p.bonuses ?? []) ?? [];

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

  const employeeIds = useMemo(() => bonuses.map(b => b.employeeId), [bonuses]);
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

  const paidStatusOptions = useMemo(
    () => [
      { value: 'true', label: 'Paga' },
      { value: 'false', label: 'Pendente' },
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
    if (!searchQuery.trim()) return bonuses;
    const q = searchQuery.toLowerCase();
    return bonuses.filter(b => {
      const name = b.name?.toLowerCase() ?? '';
      const reason = b.reason?.toLowerCase() ?? '';
      return name.includes(q) || reason.includes(q);
    });
  }, [bonuses, searchQuery]);

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
        router.push(`/hr/bonuses/${ids[0]}`);
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
        toast.success(`${ids.length} bonificação(ões) excluída(s)`);
      } catch {
        // Toast handled by mutation
      }
    },
    [deleteMutation]
  );

  const handleExport = useCallback(
    (ids: string[]) => {
      const items =
        ids.length > 0 ? bonuses.filter(b => ids.includes(b.id)) : bonuses;
      exportToCSV(
        items,
        [
          { header: 'Nome', accessor: b => b.name },
          { header: 'Funcionário', accessor: b => getName(b.employeeId) },
          { header: 'Valor', accessor: b => b.amount },
          {
            header: 'Data',
            accessor: b =>
              b.date ? new Date(b.date).toLocaleDateString('pt-BR') : '',
          },
          { header: 'Motivo', accessor: b => b.reason },
          { header: 'Paga', accessor: b => (b.isPaid ? 'Sim' : 'Não') },
        ],
        'bonificacoes'
      );
    },
    [bonuses, getName]
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
          if (ids.length > 0) router.push(`/hr/bonuses/${ids[0]}`);
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

  const renderGridCard = (item: Bonus, isSelected: boolean) => {
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
          icon={PlusCircle}
          iconBgColor="bg-linear-to-br from-lime-500 to-lime-600"
          badges={[
            {
              label: getPaidLabel(item),
              variant: getPaidColor(item),
            },
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
          onClick={() => router.push(`/hr/bonuses/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Bonus, isSelected: boolean) => {
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
          icon={PlusCircle}
          iconBgColor="bg-linear-to-br from-lime-500 to-lime-600"
          badges={[
            {
              label: getPaidLabel(item),
              variant: getPaidColor(item),
            },
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
          onClick={() => router.push(`/hr/bonuses/${item.id}`)}
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
      id: 'export-bonuses',
      title: 'Exportar',
      icon: Download,
      onClick: () => handleExport([]),
      variant: 'outline',
    });
    if (canCreate) {
      buttons.push({
        id: 'create-bonus',
        title: 'Nova Bonificação',
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
        namespace: 'bonuses',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Bonificações', href: '/hr/bonuses' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Bonificações"
            description="Gerencie as bonificações dos funcionários"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="bonuses-page" className="contents" />
          {/* Search Bar */}
          <div data-testid="bonuses-search">
            <SearchBar
              value={searchQuery}
              placeholder={bonusesConfig.display.labels.searchPlaceholder}
              onSearch={value => setSearchQuery(value)}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="md"
            />
          </div>

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar bonificações"
              message="Ocorreu um erro ao tentar carregar as bonificações. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={bonusesConfig}
              items={filteredItems}
              toolbarStart={
                <>
                  <div data-testid="bonuses-filter-employee">
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
                  </div>
                  <div data-testid="bonuses-filter-status">
                    <FilterDropdown
                      label="Status"
                      icon={CircleCheck}
                      options={paidStatusOptions}
                      value={
                        filterIsPaid === undefined
                          ? ''
                          : filterIsPaid
                            ? 'true'
                            : 'false'
                      }
                      onChange={v =>
                        setFilterIsPaid(v === '' ? undefined : v === 'true')
                      }
                      activeColor="emerald"
                    />
                  </div>
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                if (canView) {
                  router.push(`/hr/bonuses/${item.id}`);
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
            title="Excluir Bonificação"
            description="Digite seu PIN de ação para excluir esta bonificação. Esta ação não pode ser desfeita."
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
