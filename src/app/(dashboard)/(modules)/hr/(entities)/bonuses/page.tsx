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
import type { Bonus } from '@/types/hr';
import { Calendar, Eye, PlusCircle, Plus, Trash2, User } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  bonusesConfig,
  useListBonuses,
  useCreateBonus,
  useDeleteBonus,
  CreateModal,
  DeleteConfirmModal,
  ViewModal,
  formatCurrency,
  formatDate,
  getPaidLabel,
  getPaidColor,
  type BonusFilters,
} from './src';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';

export default function BonusesPage() {
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

  const { data, isLoading, error, refetch } = useListBonuses(queryParams);
  const createMutation = useCreateBonus();
  const deleteMutation = useDeleteBonus();

  const bonuses = data?.bonuses ?? [];

  const employeeIds = useMemo(() => bonuses.map(b => b.employeeId), [bonuses]);
  const { getName } = useEmployeeMap(employeeIds);

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Bonus | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
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
        const item = bonuses.find(b => b.id === ids[0]);
        if (item) {
          setViewTarget(item);
          setIsViewOpen(true);
        }
      }
    },
    [bonuses]
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
          showSelection={false}
          clickable={false}
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
              id: 'create-bonus',
              title: 'Nova Bonificação',
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
    filterIsPaid !== undefined ||
    filterStartDate ||
    filterEndDate;

  const clearFilters = useCallback(() => {
    setFilterEmployeeId('');
    setFilterIsPaid(undefined);
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
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            placeholder={bonusesConfig.display.labels.searchPlaceholder}
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
                filterIsPaid === undefined
                  ? 'ALL'
                  : filterIsPaid
                    ? 'true'
                    : 'false'
              }
              onValueChange={v =>
                setFilterIsPaid(v === 'ALL' ? undefined : v === 'true')
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="true">Paga</SelectItem>
                <SelectItem value="false">Pendente</SelectItem>
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
            bonus={viewTarget}
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
